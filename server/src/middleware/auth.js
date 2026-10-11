import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { Session, Audit } from '../models.js';
import { sendMail } from '../lib/mail.js';
import { sha256 } from '../lib/crypto.js';
import { locate, describeDevice } from '../lib/security.js';
import { httpError, esc } from '../lib/util.js';

const cookieBase = (req) => ({ httpOnly: true, sameSite: 'strict', secure: req.secure });
export const REAUTH_COOKIE = { name: 'tv_ra', path: '/api/auth' };

// Called after the Google Authenticator step. The session lasts exactly SESSION_MINUTES (60).
// A second cookie (12 h) lets the user come back with only an Authenticator code.
export const STEP_UP_MINUTES = 10;

// `fullLogin`: password + email code + Authenticator were all just checked, so the session starts
// already "security-checked" for a few minutes (no need to repeat them to set a first PIN).
export async function startSession(req, res, user, { fullLogin = false } = {}) {
  const ua = req.get('user-agent') ?? '';
  const device = describeDevice(ua);
  const location = await locate(req.ip);
  const ms = config.sessionMinutes * 60e3;
  const session = await Session.create({
    user: user._id, ip: req.ip, device, location, expiresAt: new Date(Date.now() + ms),
    ...(fullLogin && { elevatedUntil: new Date(Date.now() + STEP_UP_MINUTES * 60e3) }),
  });

  res.cookie('tv_sid', jwt.sign({ sid: session.id }, config.jwtSecret, { expiresIn: ms / 1000 }), { ...cookieBase(req), maxAge: ms });
  res.cookie(REAUTH_COOKIE.name, jwt.sign({ uid: user.id, stage: 'reauth' }, config.jwtSecret, { expiresIn: '12h' }),
    { ...cookieBase(req), maxAge: 12 * 3600e3, path: REAUTH_COOKIE.path });

  const deviceKey = sha256(ua);
  if (!user.knownDevices.includes(deviceKey)) {
    if (user.knownDevices.length) {
      sendMail({
        to: user.email,
        subject: 'New device signed in to TrustVault',
        title: 'New sign-in detected',
        body: `<p>Your account was just used from a new device:</p>
          <p><b>${esc(device)}</b><br>IP ${esc(req.ip)} &middot; ${esc(location)}<br>${new Date().toUTCString()}</p>
          <p>If this was you, you can ignore this email.</p>`,
      }).catch((e) => console.error('Alert mail failed:', e.message));
    }
    user.knownDevices.push(deviceKey);
  }
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  await user.save();
  await Audit.create({ user: user._id, subject: user._id, action: 'login', detail: `${device} | ${location}`, ip: req.ip });
  return session;
}

export async function requireAuth(req, res, next) {
  const token = req.cookies.tv_sid;
  if (!token) return res.status(401).json({ error: 'Please sign in.', code: 'NO_SESSION' });
  let sid;
  try {
    ({ sid } = jwt.verify(token, config.jwtSecret));
  } catch {
    return res.status(401).json({ error: 'Session expired. Enter your Google Authenticator code again.', code: 'SESSION_EXPIRED' });
  }
  const session = await Session.findById(sid).populate('user');
  if (!session?.user || session.revoked || session.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Session expired. Enter your Google Authenticator code again.', code: 'SESSION_EXPIRED' });
  }
  req.user = session.user;
  req.sess = session;
  next();
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'You do not have permission for this.' });

// Vault PIN is asked once per session: the first correct PIN unlocks the vault until the session ends.
export async function requireVault(req) {
  if (req.sess.vaultUnlocked) return;
  if (!req.body?.pin) throw httpError(403, 'Your vault is locked. Enter your vault PIN to unlock it.', 'VAULT_LOCKED');
  await checkPin(req.user, req.body.pin);
  req.sess.vaultUnlocked = true;
  await req.sess.save();
}

// Sensitive changes (PIN, password, backup codes, devices, deleting the account) need a fresh security check.
export function requireStepUp(req) {
  if (!(req.sess.elevatedUntil > new Date())) {
    throw httpError(403, 'Confirm it is you first: password, email code, then Google Authenticator.', 'STEP_UP');
  }
}

// The separate 6-digit vault PIN. 5 wrong tries = 15 min lock.
export async function checkPin(user, pin) {
  if (!user.vaultPinHash) throw httpError(400, 'Set your vault PIN first on the Security page.');
  if (user.pinLockedUntil > new Date()) throw httpError(423, 'Vault locked after too many wrong PINs. Try again in 15 minutes.');
  if (await bcrypt.compare(String(pin ?? ''), user.vaultPinHash)) {
    if (user.pinFails) {
      user.pinFails = 0;
      await user.save();
    }
    return;
  }
  user.pinFails += 1;
  const left = 5 - user.pinFails;
  if (left <= 0) {
    user.pinFails = 0;
    user.pinLockedUntil = new Date(Date.now() + 15 * 60e3);
  }
  await user.save();
  throw httpError(403, left > 0 ? `Wrong vault PIN. ${left} attempt(s) left.` : 'Wrong vault PIN. Vault locked for 15 minutes.');
}

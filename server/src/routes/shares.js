// Time-limited share links. The recipient must also prove they own the email (OTP).
import { Router } from 'express';
import config from '../config.js';
import { Document, Share } from '../models.js';
import { sha256, randomToken } from '../lib/crypto.js';
import { sendMail } from '../lib/mail.js';
import { httpError, audit, esc } from '../lib/util.js';
import { requireVault } from '../middleware/auth.js';

const r = Router();

r.get('/', async (req, res) => {
  const shares = await Share.find({ owner: req.user._id }).sort({ createdAt: -1 }).populate('doc', 'title');
  res.json(shares.map((s) => ({
    id: s.id, title: s.doc?.title ?? '(deleted)', recipient: s.recipient, expiresAt: s.expiresAt, views: s.views, maxViews: s.maxViews,
    status: s.revoked ? 'revoked' : s.expiresAt < new Date() ? 'expired' : s.views >= s.maxViews ? 'used up' : 'active',
  })));
});

r.post('/', async (req, res) => {
  const { docId, email, hours = 24 } = req.body ?? {};
  const doc = await Document.findOne({ _id: docId, owner: req.user._id });
  if (!doc) throw httpError(404, 'Document not found.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) throw httpError(400, 'Enter a valid recipient email.');
  await requireVault(req);

  const token = randomToken();
  const share = await Share.create({
    doc: doc._id, owner: req.user._id, recipient: email.toLowerCase(), tokenHash: sha256(token),
    expiresAt: Date.now() + Math.min(Math.max(Number(hours) || 24, 1), 168) * 3600e3,
  });
  await sendMail({
    to: share.recipient, subject: `${req.user.name} shared a document with you`, title: 'A document was shared with you',
    body: `<p><b>${esc(req.user.name)}</b> shared <b>${esc(doc.title)}</b> (status: ${doc.status}) with you via TrustVault.</p>
      <p><a href="${config.appUrl}/share/${token}">Open the document</a></p>
      <p>The link works until ${share.expiresAt.toUTCString()} and up to ${share.maxViews} views. You will receive a code by email to open it.</p>`,
  });
  await audit(req, 'share.create', `${doc.title} -> ${share.recipient}`);
  res.status(201).json({ ok: true });
});

r.delete('/:id', async (req, res) => {
  await Share.updateOne({ _id: req.params.id, owner: req.user._id }, { revoked: true });
  await audit(req, 'share.revoke');
  res.json({ ok: true });
});

export default r;

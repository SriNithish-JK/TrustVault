// The student's side of consent: see who asked for access, approve / deny / revoke.
import { Router } from 'express';
import { AccessRequest } from '../models.js';
import { sendMail } from '../lib/mail.js';
import { httpError, audit, esc } from '../lib/util.js';

const r = Router();
const GRANT_HOURS = 24;

r.get('/', async (req, res) => {
  const list = await AccessRequest.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(50).populate('verifier', 'name email role');
  res.json(list.map((a) => ({
    id: a.id, verifier: a.verifier, reason: a.reason, requestedAt: a.createdAt, expiresAt: a.expiresAt,
    status: a.status === 'approved' && a.expiresAt < new Date() ? 'expired' : a.status,
  })));
});

r.post('/:id', async (req, res) => {
  const { decision } = req.body ?? {};
  if (!['approve', 'deny', 'revoke'].includes(decision)) throw httpError(400, 'Choose approve, deny or revoke.');
  const a = await AccessRequest.findOne({ _id: req.params.id, student: req.user._id }).populate('verifier', 'name email');
  if (!a) throw httpError(404, 'Request not found.');
  if (decision === 'revoke' ? a.status !== 'approved' : a.status !== 'pending') throw httpError(400, 'This request was already answered.');

  a.status = { approve: 'approved', deny: 'denied', revoke: 'revoked' }[decision];
  if (decision === 'approve') a.expiresAt = new Date(Date.now() + GRANT_HOURS * 3600e3);
  await a.save();
  await audit(req, `access.${a.status}`, `${a.verifier.name}: ${a.reason}`);
  sendMail({
    to: a.verifier.email, subject: `Access request ${a.status}`, title: `Your access request was ${a.status}`,
    body: `<p>${esc(req.user.name)} ${a.status} your request to see their records.${decision === 'approve' ? ` Access lasts ${GRANT_HOURS} hours.` : ''}</p>`,
  }).catch((e) => console.error(e.message));
  res.json({ ok: true });
});

export default r;

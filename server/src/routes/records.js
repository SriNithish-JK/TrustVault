// Student records - for verifiers and admins, and only with the student's consent.
// Staff can see who is registered; to open a record they request access and the student approves it (24 h).
import { Router } from 'express';
import { User, Document, AccessRequest } from '../models.js';
import { sendMail } from '../lib/mail.js';
import { httpError, audit, esc } from '../lib/util.js';
import { activeGrant } from '../lib/access.js';
import config from '../config.js';
import { docView } from './documents.js';

const r = Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const accessView = (a) => a && { status: a.status, reason: a.reason, expiresAt: a.expiresAt, requestedAt: a.createdAt };

// Latest request from this verifier per student; approved ones that ran out show as "expired".
async function latestRequests(verifier, studentIds) {
  const reqs = await AccessRequest.find({ verifier, student: { $in: studentIds } }).sort({ createdAt: 1 });
  const map = Object.fromEntries(reqs.map((a) => [a.student, a]));
  for (const a of Object.values(map)) if (a.status === 'approved' && a.expiresAt < new Date()) a.status = 'expired';
  return map;
}

r.get('/students', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const match = q ? { $or: ['name', 'email', 'studentId'].map((f) => ({ [f]: new RegExp(escapeRegex(q), 'i') })) } : {};
  const students = await User.find({ role: 'student', ...match }).sort({ name: 1 }).limit(100);
  const ids = students.map((s) => s._id);
  const [counts, access] = await Promise.all([
    Document.aggregate([
      { $match: { owner: { $in: ids } } },
      { $group: { _id: '$owner', total: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } } } },
    ]),
    latestRequests(req.user._id, ids),
  ]);
  const byId = Object.fromEntries(counts.map((c) => [c._id, c]));
  res.json(students.map((s) => ({
    id: s.id, name: s.name, email: s.email, studentId: s.studentId, joined: s.createdAt,
    total: byId[s.id]?.total ?? 0, verified: byId[s.id]?.verified ?? 0, access: accessView(access[s.id]),
  })));
});

r.get('/students/:id', async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw httpError(404, 'Student not found.');
  const grant = await activeGrant(req.user, student._id);
  const latest = (await latestRequests(req.user._id, [student._id]))[student.id];
  const docs = grant ? await Document.find({ owner: student._id }).sort({ createdAt: -1 }) : [];
  if (grant) await audit(req, 'record.open', `Opened record of ${student.name}`, student._id);
  res.json({
    student: { id: student.id, name: student.name, email: student.email, studentId: student.studentId, joined: student.createdAt },
    access: accessView(latest),
    documents: docs.map(docView),
  });
});

r.post('/students/:id/request', async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw httpError(404, 'Student not found.');
  const reason = String(req.body?.reason ?? '').trim();
  if (reason.length < 5) throw httpError(400, 'Tell the student why you need access (at least 5 characters).');
  if (await AccessRequest.exists({ verifier: req.user._id, student: student._id, status: 'pending' })) {
    throw httpError(409, 'You already have a pending request for this student.');
  }
  await AccessRequest.create({ verifier: req.user._id, student: student._id, reason });
  await audit(req, 'access.request', `${req.user.name} asked to see the record: ${reason}`, student._id);
  sendMail({
    to: student.email, subject: `${req.user.name} is asking to see your records`, title: 'Access request',
    body: `<p><b>${esc(req.user.name)}</b> (${req.user.role}) would like to see your TrustVault documents for 24 hours.</p>
      <p>Reason: <i>${esc(reason)}</i></p>
      <p><a href="${config.appUrl}/access">Approve or deny the request</a>. Nothing is shared unless you approve.</p>`,
  }).catch((e) => console.error(e.message));
  res.status(201).json({ ok: true });
});

export default r;

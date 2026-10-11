// Consent rules for staff looking at a student's documents:
//  - pending documents: verifiers may open them to do the verification the student asked for;
//  - everything else: only while the student has approved an access request (24 h).
import { AccessRequest } from '../models.js';
import { httpError } from './util.js';

export const STAFF = ['verifier', 'admin'];

export const activeGrant = (viewer, studentId) =>
  AccessRequest.findOne({ verifier: viewer._id, student: studentId, status: 'approved', expiresAt: { $gt: new Date() } });

export async function assertDocAccess(viewer, doc) {
  if (!STAFF.includes(viewer.role)) throw httpError(403, 'You cannot open this document.');
  if (doc.status === 'pending' || (await activeGrant(viewer, doc.owner._id))) return;
  throw httpError(403, 'The student has not approved your access request for this record.');
}

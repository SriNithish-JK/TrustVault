import { Audit } from '../models.js';

export const httpError = (status, message, code) => Object.assign(new Error(message), { status, ...(code && { code }) });

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const maskEmail = (email) =>
  email.replace(/^(.)(.*)(@.*)$/, (_, first, rest, domain) => first + '*'.repeat(Math.min(rest.length, 6)) + domain);

export const audit = (req, action, detail = '', subject = req.user?._id) =>
  Audit.create({ user: req.user?._id, subject, action, detail, ip: req.ip });

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  studentId: u.studentId,
  avatarV: u.avatarV || 0,
  memberSince: u.createdAt,
  hasVaultPin: Boolean(u.vaultPinHash),
  backupCodesLeft: u.backupCodes?.length ?? 0,
});

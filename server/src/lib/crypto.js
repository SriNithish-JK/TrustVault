import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config.js';
import { httpError } from './util.js';

export const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const randomCode = () => String(crypto.randomInt(0, 1e6)).padStart(6, '0');

// AES-256-GCM: [12-byte IV][16-byte auth tag][ciphertext]. The tag also detects tampering.
export function encrypt(buf) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.vaultKey, iv);
  const data = Buffer.concat([cipher.update(buf), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]);
}

export function decrypt(buf) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', config.vaultKey, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
}

export const encryptText = (text) => encrypt(Buffer.from(text)).toString('base64');
export const decryptText = (text) => decrypt(Buffer.from(text, 'base64')).toString();

const storage = path.join(config.dataDir, 'storage');
await fs.mkdir(storage, { recursive: true });

export async function storeFile(buf) {
  const name = `${randomToken(16)}.enc`;
  await fs.writeFile(path.join(storage, name), encrypt(buf));
  return name;
}

export const readFile = async (name) => decrypt(await fs.readFile(path.join(storage, name)));
export const removeFile = (name) => fs.rm(path.join(storage, name), { force: true });

// Decrypts a document and proves it still matches the hash recorded at upload.
export async function openDocument(doc) {
  const buf = await readFile(doc.storedName).catch(() => null);
  if (!buf || sha256(buf) !== doc.sha256) {
    if (!doc.tampered) await doc.updateOne({ tampered: true });
    throw httpError(409, 'Integrity check failed: this file was modified or corrupted on the server.');
  }
  return buf;
}

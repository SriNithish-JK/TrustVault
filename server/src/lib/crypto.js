import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
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

// Encrypted files live in server/storage, or in MongoDB (GridFS) when FILE_STORE=db.
const storage = path.join(config.dataDir, 'storage');
if (!config.filesInDb) await fs.mkdir(storage, { recursive: true });
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'vault' });

export async function storeFile(buf) {
  const name = `${randomToken(16)}.enc`;
  const data = encrypt(buf);
  if (config.filesInDb) await new Promise((done, failed) => bucket().openUploadStream(name).on('finish', done).on('error', failed).end(data));
  else await fs.writeFile(path.join(storage, name), data);
  return name;
}

export const readFile = async (name) => decrypt(config.filesInDb
  ? Buffer.concat(await bucket().openDownloadStreamByName(name).toArray())
  : await fs.readFile(path.join(storage, name)));

export async function removeFile(name) {
  if (!config.filesInDb) return fs.rm(path.join(storage, name), { force: true });
  for await (const file of bucket().find({ filename: name })) await bucket().delete(file._id);
}

// Decrypts a document and proves it still matches the hash recorded at upload.
export async function openDocument(doc) {
  const buf = await readFile(doc.storedName).catch(() => null);
  if (!buf || sha256(buf) !== doc.sha256) {
    if (!doc.tampered) await doc.updateOne({ tampered: true });
    throw httpError(409, 'Integrity check failed: this file was modified or corrupted on the server.');
  }
  return buf;
}

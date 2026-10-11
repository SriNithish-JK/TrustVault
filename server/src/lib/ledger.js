// Blockchain-inspired, append-only ledger. Each block's hash covers the previous block's hash,
// so editing or deleting any old record breaks every block after it.
import { Block, Document } from '../models.js';
import { sha256, readFile } from './crypto.js';

const GENESIS = '0'.repeat(64);
const blockHash = (b) => sha256(`${b.index}|${b.action}|${b.docId}|${b.fileHash}|${b.prevHash}|${new Date(b.at).toISOString()}`);

export async function addBlock(action, docId, fileHash) {
  for (let attempt = 0; ; attempt++) {
    const last = await Block.findOne().sort({ index: -1 });
    const block = { index: last ? last.index + 1 : 0, action, docId, fileHash, prevHash: last?.hash ?? GENESIS, at: new Date() };
    try {
      return await Block.create({ ...block, hash: blockHash(block) });
    } catch (e) {
      if (e.code !== 11000 || attempt >= 4) throw e; // another upload took this index - retry
    }
  }
}

export async function checkIntegrity() {
  const problems = [];
  const blocks = await Block.find().sort({ index: 1 });
  blocks.forEach((b, i) => {
    if (b.prevHash !== (i ? blocks[i - 1].hash : GENESIS)) problems.push(`Block #${b.index}: link to previous block is broken`);
    if (b.hash !== blockHash(b)) problems.push(`Block #${b.index}: contents were edited`);
  });

  const uploads = new Set(blocks.filter((b) => b.action === 'upload').map((b) => `${b.docId}:${b.fileHash}`));
  const docs = await Document.find();
  let tampered = 0;
  for (const doc of docs) {
    const buf = await readFile(doc.storedName).catch(() => null);
    const bad = !buf || sha256(buf) !== doc.sha256 || !uploads.has(`${doc._id}:${doc.sha256}`);
    if (bad) {
      tampered++;
      problems.push(`Document "${doc.title}" (${doc._id}): file or hash does not match the ledger`);
    }
    if (bad !== doc.tampered) await doc.updateOne({ tampered: bad });
  }
  return { ok: problems.length === 0, blocks: blocks.length, documents: docs.length, tampered, problems, checkedAt: new Date() };
}

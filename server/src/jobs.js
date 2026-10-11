// Background jobs, every 6 hours: document-expiry reminders and cleanup of old export ZIPs.
import { Document, Export } from './models.js';
import { removeFile } from './lib/crypto.js';
import { sendMail } from './lib/mail.js';
import { esc } from './lib/util.js';

async function run() {
  const soon = new Date(Date.now() + 30 * 864e5);
  const expiring = await Document.find({ expiryDate: { $lte: soon }, reminded: { $ne: true } }).populate('owner', 'name email');
  for (const doc of expiring) {
    await sendMail({
      to: doc.owner.email, subject: `Reminder: ${doc.title} expires soon`, title: 'Document expiry reminder',
      body: `<p>Hi ${esc(doc.owner.name)}, your <b>${esc(doc.title)}</b> expires on <b>${doc.expiryDate.toDateString()}</b>.</p>
        <p>Renew it and upload the new copy to keep your vault verified.</p>`,
    });
    await doc.updateOne({ reminded: true });
  }
  for (const exp of await Export.find({ expiresAt: { $lt: new Date() } })) {
    await removeFile(exp.storedName);
    await exp.deleteOne();
  }
}

export function startJobs() {
  const safeRun = () => run().catch((e) => console.error('Background job failed:', e.message));
  setTimeout(safeRun, 10e3);
  setInterval(safeRun, 6 * 3600e3);
}

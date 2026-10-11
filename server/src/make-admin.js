// Usage: npm run make-admin -- you@example.com   (register in the website first)
import mongoose from 'mongoose';
import config from './config.js';
import { User } from './models.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.log('Usage: npm run make-admin -- you@example.com');
  process.exit(1);
}
await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
const user = await User.findOneAndUpdate({ email }, { role: 'admin' });
console.log(user ? `${email} is now an admin. Sign out and sign in again.` : `No account with ${email}. Register in the website first.`);
await mongoose.disconnect();

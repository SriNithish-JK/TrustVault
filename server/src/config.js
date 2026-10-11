import path from 'node:path';

const env = process.env;
if (!env.JWT_SECRET || !env.VAULT_KEY) {
  console.error('Missing JWT_SECRET or VAULT_KEY in server/.env - run "npm run setup" in the project folder.');
  process.exit(1);
}

export default {
  port: Number(env.PORT || 5000),
  mongoUri: env.MONGO_URI || 'mongodb://127.0.0.1:27017/trustvault',
  appUrl: env.APP_URL || 'http://localhost:5173',
  jwtSecret: env.JWT_SECRET,
  vaultKey: Buffer.from(env.VAULT_KEY, 'hex'),
  smtp: { host: env.SMTP_HOST || 'smtp.gmail.com', port: Number(env.SMTP_PORT || 465), user: env.SMTP_USER, pass: env.SMTP_PASS },
  sessionMinutes: Number(env.SESSION_MINUTES || 60),
  // Where encrypted files, dev emails and the OCR cache live (tests point this at a temp folder).
  dataDir: env.DATA_DIR || path.join(import.meta.dirname, '..'),
};

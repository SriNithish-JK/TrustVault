// Creates server/.env from the example and fills in fresh random secret keys.
import fs from 'node:fs';
import crypto from 'node:crypto';

const target = new URL('../server/.env', import.meta.url);
if (fs.existsSync(target)) {
  console.log('server/.env already exists - keeping it.');
} else {
  const text = fs.readFileSync(new URL('../server/.env.example', import.meta.url), 'utf8')
    .replace('JWT_SECRET=', `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}`)
    .replace('VAULT_KEY=', `VAULT_KEY=${crypto.randomBytes(32).toString('hex')}`);
  fs.writeFileSync(target, text);
  console.log('Created server/.env with fresh secret keys.');
}

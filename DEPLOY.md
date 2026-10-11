# Putting TrustVault on the internet for free

This guide uses three free services. None of them asks for a bank card.

| Part | Service | Free plan |
|---|---|---|
| Website and API | [Render](https://render.com) | One web service. Sleeps after 15 minutes without visitors; the next visit takes about a minute to wake it. |
| Database and encrypted files | [MongoDB Atlas](https://www.mongodb.com/atlas) | 512 MB, kept permanently. |
| Email (sign-in codes) | [Brevo](https://www.brevo.com) | 300 emails a day. |

This setup is for **demonstrations with sample documents**. It has one encryption key and no backups, so the site shows a "Demo site" notice on the sign-up and upload forms.

## 1. Database: MongoDB Atlas

1. Sign up at mongodb.com/atlas and create a **free (M0)** cluster.
2. **Database Access**: add a user with a long random password. Write both down.
3. **Network Access**: add the address `0.0.0.0/0` (Render's free plan has no fixed address).
4. **Connect → Drivers**: copy the connection string. Put your password in it and add the database name before the `?`:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/trustvault?retryWrites=true&w=majority
   ```

## 2. Email: Brevo

1. Sign up at brevo.com.
2. **Senders, Domains & Dedicated IPs → Senders**: add the address the emails should come from and confirm it from your inbox.
3. **SMTP & API → API keys**: create a key and copy it.

## 3. A vault key

Run this once on your computer and keep the result private. If this key is lost, every uploaded file is unreadable.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Website: Render

1. Sign up at render.com with your GitHub account.
2. **New → Blueprint**, choose the TrustVault repository. Render reads [`render.yaml`](render.yaml).
3. Fill in the values it asks for:

   | Name | Value |
   |---|---|
   | `MONGO_URI` | the connection string from step 1 |
   | `BREVO_API_KEY` | the key from step 2 |
   | `MAIL_FROM` | the sender address you confirmed in Brevo |
   | `VAULT_KEY` | the key from step 3 |
   | `APP_URL` | the site's address, for example `https://trustvault.onrender.com` (no slash at the end) |

4. Click **Apply**. The first build takes a few minutes.

If Render gives the site a different address than you typed in `APP_URL`, correct it under **Environment** and save; links in emails and QR codes use it.

## 5. The first admin

Create your account on the live site, then run this on your computer with the same connection string:

```bash
MONGO_URI="mongodb+srv://..." npm run make-admin -- you@example.com
```

Sign out and in again. After that you can invite other admins and verifiers from the Admin screen.

## What the settings do

| Setting | Effect |
|---|---|
| `FILE_STORE=db` | Encrypted files are kept in MongoDB instead of `server/storage`, because a free host wipes its disk on every restart. |
| `TRUST_PROXY=1` | The server trusts the host's proxy, so cookies are marked secure and limits count per visitor. |
| `BREVO_API_KEY`, `MAIL_FROM` | Email goes out over HTTPS. Free hosts block ordinary SMTP. |
| `VITE_DEMO=1` | Shows the "Demo site" notice. Remove it and redeploy to hide the notice. |

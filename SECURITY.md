# Security policy

TrustVault handles identity documents, so security reports are taken seriously.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Use GitHub's private reporting instead: open the repository's **Security** tab and choose **Report a vulnerability**.
Include what you found, the steps to reproduce it, and what an attacker could do with it.

You can expect a first reply within a week. Please give a reasonable time to fix the problem before sharing it publicly.

## Scope and honest limits

This is a student project that runs locally. Known limits are listed in the README under *Limitations*, including:

- One master encryption key in `server/.env` rather than a key vault with per-file keys.
- PAN and Aadhaar are checked by format, checksum and OCR, not against government databases.
- The hash ledger lives in the same database it protects.
- The leaked-password and throw-away-email checks rely on public services and let sign-ups through when those are unreachable.

Reports about these are welcome, but they are known.

## Never commit

`server/.env`, anything in `server/storage/`, `server/dev-mail/` or `server/.ocr-cache/`. They are in `.gitignore`.

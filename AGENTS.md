# Coding rules for this repo

Adapted from [ponytail](https://github.com/DietrichGebert/ponytail) (MIT) – "the best code is the code you never wrote".
Any person or AI agent changing this project follows these rules.

## Before writing code, climb the ladder
1. Does this need to exist at all?
2. Does the codebase already have it? (`server/src/lib/*`, `client/src/components/app/kit.jsx`, `client/src/components/ui/*`)
3. Does the Node / browser standard library do it? (`node:crypto`, `fetch`, `FormData`, `<details>`)
4. Does an installed dependency do it? (sharp, pdf-lib, otplib, mongoose…)
5. Can it be one line?
6. Only then: the minimum code that works.

## Principles
- Understand the real flow first; fix root causes, once, in the shared function.
- No unrequested abstractions, dependencies or boilerplate. Deleting beats adding; boring beats clever.
- Mark deliberate shortcuts with a `ponytail:` comment saying the limit and the upgrade path.

## Never cut corners on
- Input validation at trust boundaries (uploads, IDs, every request body)
- Security: encryption, auth, rate limits, audit logging
- Error handling that could lose a user's documents
- Accessibility
- Explicit requirements from the project brief
- Tests for non-trivial logic (`npm test`)

## Design
UI changes follow [DESIGN.md](DESIGN.md).

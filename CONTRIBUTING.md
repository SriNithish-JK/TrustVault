# Contributing

Thanks for looking at TrustVault. Small, focused changes are the easiest to review.

## Before you start

1. Read [AGENTS.md](AGENTS.md) for the coding rules (write the least code that works; never cut corners on validation, security, error handling or accessibility).
2. Read [DESIGN.md](DESIGN.md) before touching the interface. The neon look is the foundation: extend it, do not restyle it.

## Making a change

1. Fork the repository and create a branch from `main`.
2. Run `npm run setup` once, then `npm run dev`.
3. Make the change. Check the interface in **both themes** and at **phone width**.
4. Run the tests:
   ```bash
   npm test            # unit tests
   npm run test:e2e    # 105 end-to-end checks
   npm run test:ui     # every page in headless Chrome (needs Chrome installed)
   npm run build
   ```
5. Open a pull request that says what changed and why. Add a screenshot for interface changes.

Server changes need a matching check in `server/e2e/run.mjs`.

## Reporting bugs

Open an issue with the steps, what you expected and what happened. For security problems, follow [SECURITY.md](SECURITY.md) instead.

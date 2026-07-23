# The Mirror

See yourself. Find the switch. Act.

## What is this?

A living equation that reads your state from your writing and shows you what's underneath.

`ΔI = (C × EI)^NTR`

- **C** (Coherence) — read from your language, not self-reported
- **EI** (Existing Information) — bridges between what you know and what you're facing, accumulated over time
- **NTR** (New Transmission Richness) — complexity of what you're processing
- **ΔI** — your accessible potential right now

Your creature mirrors your equation. Write honestly, and watch it evolve.

## Stack

- Next.js 15 (App Router)
- Neon Postgres (serverless)
- NextAuth.js (authentication)
- Tailwind CSS 4
- Anthropic Claude (equation engine)
- Vercel (deployment)

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env.local

# Run database migration
npm run db:migrate

# Start dev server
npm run dev
```

## Environment Variables

See `.env.example` for required variables.

## Security

- All API routes require authentication
- Diary entries are private per-user (row-level isolation via user_id)
- Input sanitized and length-limited (5000 chars)
- Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- JWT sessions with 30-day expiry
- No secrets in client code
- `robots.txt` blocks indexing (stealth mode)
- `.env` files gitignored

## License

Private. All rights reserved.

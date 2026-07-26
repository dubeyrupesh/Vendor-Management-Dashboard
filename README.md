# Vendor Quality Dashboard

Quarterly ranking of testing vendors on Quality Services. Quality Managers enter ratings and metrics; leadership reviews vendor roll-ups. GitLab and Jira/Xray start as stub adapters.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- NextAuth (credentials) for QM vs Leadership roles
- Vitest (unit) + Playwright Page Object Model (UI)
- GitHub Actions CI

## Quick start

```bash
cp .env.example .env
# ensure Postgres is running and DATABASE_URL is correct
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Demo users:

- `qm@example.com` / `password123` (Quality Manager)
- `lead@example.com` / `password123` (Leadership)

## Tests

```bash
npm run test:unit
npm run build && npm run test:e2e
```

Playwright layout:

- Page objects: `tests/e2e/pages/*Page.ts`
- Specs: `tests/e2e/specs/*.spec.ts`
- Fixtures: `tests/e2e/fixtures/`

## Scoring (v1)

Per project, then averaged to the vendor for the quarter:

| Factor | Weight |
|---|---:|
| Automation coverage vs 80% target | 35% |
| Xray automation ratio | 20% |
| Qualitative average | 30% |
| Prod defect leakage | 15% |

Weights: `lib/scoring/weights.ts`

## Cursor skills

Reusable Agent skills live in `.cursor/skills/` (Prisma, Server Actions, API routes, dashboard queries, stubs, Vitest, Playwright POM, vendor scoring).

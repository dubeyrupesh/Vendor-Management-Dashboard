# Vendor Quality Dashboard

Internal dashboard for ranking **Quality Services (Testing) vendors** on how well they deliver automation, documentation, responsiveness, and production quality — then presenting those results to leadership by quarter, half-year, or year.

---

## Business purpose

Organizations often engage multiple testing vendors across web, mobile, API, performance, and other workstreams. Not every project needs every test type, but leadership still needs a consistent way to answer:

- Which vendors are meeting automation expectations?
- Are tests documented in Xray (manual vs automated)?
- How responsive and available is the vendor team, and do they understand project complexity?
- How many defects are leaking to production?
- How does that performance look over a quarter, half-year, or full year?

This app turns those signals into **project-level ratings**, rolls them up to **vendor scores**, and surfaces them as **leadership-ready rankings and charts**.

### Who uses it

| Role | Purpose |
|---|---|
| **Quality Manager** | Maintain vendors/projects and enter quarterly metrics + qualitative ratings |
| **Leadership** | Review rankings, drill into vendors/projects, compare periods |

### What gets measured

Ratings are captured **per project**, then aggregated to the vendor.

1. **Automation coverage** — expect **> 80%** on every project (only for required test types: web / mobile / API / performance / other)
2. **Xray documentation** — count manual vs automated tests
3. **Qualitative ratings (1–5)** — responsiveness, availability, complexity understanding
4. **Production defect leakage** — defects that escaped to prod

### Scoring model (v1)

Each project gets a weighted composite score. The vendor score for a period is the **average of its project scores**.

| Factor | Weight | Notes |
|---|---:|---|
| Automation coverage | 35% | Target is **> 80%** |
| Xray automation ratio | 20% | `automated / (manual + automated)` |
| Qualitative average | 30% | Mean of responsiveness, availability, complexity (1–5 → 0–100) |
| Prod defect leakage | 15% | Lower is better (capped scale) |

Weights live in [`lib/scoring/weights.ts`](lib/scoring/weights.ts) and can be tuned without schema changes.

### Period views

Leadership can switch the reporting window:

| View | Example | Behavior |
|---|---|---|
| Quarterly | `2026-Q2` | Single quarter |
| Half-yearly | `2026-H1` | Average of Q1 + Q2 |
| Yearly | `2025` | Average of quarters present for that year |

Demo seed includes: `2025-Q3`, `2025-Q4`, `2026-Q1`, `2026-Q2`.

---

## Product surfaces

### Quality Manager workspace (`/qm`)

- Create vendors and projects
- Set required test types per project
- Enter/edit quarterly metrics and qualitative ratings (`/qm/ratings`)
- Refresh **stub** GitLab / Jira-Xray values for demos

### Leadership dashboard (`/leadership`)

- Period filter: quarterly / half-yearly / yearly
- Vendor ranking table with overall scores
- Charts: vendor scores, automation coverage vs target, quality factor balance
- Vendor drill-down: project scores, score composition, **per-attribute graphs across projects**, detail table

---

## Tech stack

| Layer | Choice |
|---|---|
| App framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| UI | **React 19** + **Tailwind CSS** + Recharts |
| Database | **PostgreSQL** |
| ORM | **Prisma** |
| Auth | **NextAuth / Auth.js** (credentials; QM vs Leadership roles) |
| Validation | **Zod** |
| Unit tests | **Vitest** |
| UI / E2E tests | **Playwright** with Page Object Model |
| CI | **GitHub Actions** (unit → e2e) |

### Integrations (v1)

GitLab and Jira/Xray are wired through a shared interface with **stub adapters** that return deterministic demo data. Quality Managers can still override values manually. Real API clients can replace stubs later without changing scoring or dashboard pages.

See:

- [`lib/integrations/types.ts`](lib/integrations/types.ts)
- [`lib/integrations/gitlab/stub.ts`](lib/integrations/gitlab/stub.ts)
- [`lib/integrations/jira-xray/stub.ts`](lib/integrations/jira-xray/stub.ts)

---

## Architecture overview

```text
Vendor
  └── Projects (required test types)
        ├── ProjectQuarterMetric   (coverage, Xray counts, prod defects, source)
        └── QualitativeRating      (responsiveness, availability, complexity)
              └── rolls up to
VendorQuarterScore (overallScore + scoreBreakdown)
```

Key folders:

```text
app/
  (qm)/                 Quality Manager UI + server actions
  (leadership)/         Leadership rankings + vendor detail
  login/                Auth
lib/
  scoring/              Pure scoring + rollups
  reporting/            Period aggregation (Q / H / Y)
  integrations/         Stub (and future real) data sources
  periods.ts            Period parsing + options
prisma/                 Schema, migrations, seed
tests/e2e/              Playwright POM specs
.cursor/skills/         Reusable Cursor Agent skills
```

---

## Prerequisites

- **Node.js 22+** and npm
- **PostgreSQL** running locally (or a hosted Postgres URL)
- Git

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/dubeyrupesh/Vendor-Management-Dashboard.git
cd Vendor-Management-Dashboard
git checkout cursor/vendor-quality-dashboard-8aa5
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/vendor_quality?schema=public"
AUTH_SECRET="replace-with-a-long-random-string"
NEXTAUTH_URL="http://127.0.0.1:3000"
AUTH_URL="http://127.0.0.1:3000"
AUTH_TRUST_HOST=true
```

### 3. Migrate, seed, run

```bash
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

### Demo users

| Email | Password | Role |
|---|---|---|
| `qm@example.com` | `password123` | Quality Manager |
| `lead@example.com` | `password123` | Leadership |

Seed creates **3 vendors × 5 projects**, with ratings across **4 quarters**.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:seed` | Reseed demo users, vendors, projects, scores |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright UI tests |
| `npm test` | Unit then e2e |

---

## Testing

### Unit tests (Vitest)

Focus on scoring, period helpers, and stub adapters:

```bash
npm run test:unit
```

### UI tests (Playwright + POM)

```bash
npm run build
npm run test:e2e
```

Conventions:

| Artifact | Convention | Example |
|---|---|---|
| Page object | `PascalCase` + `Page.ts` | `LeadershipRankingPage.ts` |
| Spec file | `kebab-case` + `.spec.ts` | `leadership-quarterly-ranking.spec.ts` |
| Assertions | In specs only | Not inside page objects |

Layout:

- Page objects: `tests/e2e/pages/`
- Specs: `tests/e2e/specs/`
- Fixtures: `tests/e2e/fixtures/`

### CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on PRs and `main`:

1. Unit tests
2. Playwright e2e (Postgres service, migrate, seed, build)

---

## Cursor skills

Reusable Agent workflows live in [`.cursor/skills/`](.cursor/skills/) for this stack and future projects, including:

- Prisma schema changes
- Next.js Server Action CRUD
- API routes with Zod + Prisma
- Dashboard data queries
- Integration adapter stubs
- Vitest unit tests
- Playwright POM specs
- Vendor quarterly scoring

Testing naming/POM rules are also in [`.cursor/rules/testing.mdc`](.cursor/rules/testing.mdc).

---

## Roadmap ideas

- Real GitLab + Jira/Xray sync (OAuth / tokens, scheduled jobs)
- SSO / enterprise identity
- Tunable weights from an admin UI
- Exportable quarterly leadership packs (PDF/CSV)
- Audit history for rating changes

---

## License

Private / internal use unless otherwise specified.

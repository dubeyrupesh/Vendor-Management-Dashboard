---
name: playwright-pom-spec
description: Add Playwright UI specs using Page Object Model. Use when writing or updating e2e/UI tests under tests/e2e.
paths:
  - "tests/e2e/**"
  - "**/*.spec.ts"
---

# Playwright POM spec

## Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Page object file | `PascalCase` + `Page.ts` | `LeadershipRankingPage.ts` |
| Page object class | same as file | `class LeadershipRankingPage` |
| Spec file | `kebab-case` + `.spec.ts` | `qm-enter-quarterly-ratings.spec.ts` |
| `test.describe` | feature area Title Case | `Quality Manager Ratings` |
| `test(...)` title | behavior sentence | `saves quarterly coverage and updates vendor rank` |
| `data-testid` | `kebab-case` domain path | `vendor-rank-table` |

## Instructions

1. Put page objects in `tests/e2e/pages/` and specs in `tests/e2e/specs/`.
2. Page objects expose locators and actions only — **no assertions** in page classes.
3. Specs own assertions and flow orchestration; import page objects and fixtures.
4. Prefer `getByRole` / `getByLabel`; use `data-testid` when the accessible name is unstable.
5. Reuse auth via `tests/e2e/fixtures/`; do not log in inline in every spec if a fixture exists.
6. Keep specs independent; seed or reset data in `beforeEach` / project fixtures as needed.
7. Run `npm run test:e2e` for the new/related spec and fix failures without disabling waits via hard sleeps.

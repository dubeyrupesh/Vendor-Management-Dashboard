---
name: vitest-unit-test
description: Add or update Vitest unit tests. Use when testing scoring, Zod schemas, stubs, helpers, or other pure/unit-level logic.
paths:
  - "**/*.test.ts"
  - "tests/unit/**"
---

# Vitest unit test

## Instructions

1. Name files `*.test.ts` next to the source or under `tests/unit/` mirroring `lib/`.
2. Use Arrange–Act–Assert; one behavior per `it`/`test`.
3. Prefer testing pure functions (`lib/scoring`, adapters, Zod parse) over React components.
4. Do not hit a real database; mock Prisma only when the unit necessarily touches persistence.
5. Cover happy path plus at least one edge case (empty input, boundary at 80% coverage, zero tests).
6. Run `npm run test:unit` (or the focused file) and fix failures without weakening assertions.
7. Keep tests deterministic — no `Date.now()` drift without injection.

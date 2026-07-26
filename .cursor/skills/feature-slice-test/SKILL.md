---
name: feature-slice-test
description: Add focused unit and Playwright coverage for a feature slice. Invoke with /feature-slice-test for a deliberate test pass.
disable-model-invocation: true
---

# Feature slice test

## Instructions

1. Identify the feature slice (files under `app/`, `lib/`, components).
2. Add Vitest unit tests for pure logic (`*.test.ts`) following the `vitest-unit-test` skill.
3. If the slice has a user flow, add or update a Playwright POM spec under `tests/e2e/` following `playwright-pom-spec`.
4. Detect runners from `package.json` (`test:unit`, `test:e2e`).
5. Run only the new/related unit file first, then the related Playwright spec.
6. Cover happy path + validation failure + auth denial when applicable.
7. Do not weaken assertions to make tests pass; fix product code or test setup instead.

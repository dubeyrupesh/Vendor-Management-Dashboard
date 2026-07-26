---
name: integration-adapter-stub
description: Define a typed external data-source interface with a stub implementation. Use when adding GitLab, Jira, Xray, or other integrations that should start stubbed and swap to real APIs later.
paths:
  - "lib/integrations/**"
  - "**/integrations/**"
---

# Integration adapter stub

## Instructions

1. Define a narrow TypeScript interface in `lib/integrations/types.ts` (or extend the existing one).
2. Implement a `Stub*` class that returns deterministic seeded data — no network calls.
3. Keep methods async and quarter/project-scoped so a real client can replace the stub later.
4. Persist ingested values with a `source` field (`stub` | `manual` | real provider name).
5. Allow Quality Manager overrides in the UI without changing the adapter contract.
6. Add unit tests that assert stub return shapes and edge cases (empty counts, null coverage).
7. Do not put API tokens or real HTTP clients in the stub path.

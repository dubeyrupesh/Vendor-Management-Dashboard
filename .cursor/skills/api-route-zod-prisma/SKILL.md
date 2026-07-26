---
name: api-route-zod-prisma
description: Create type-safe Next.js route handlers with Zod validation and Prisma. Use when adding REST/JSON API endpoints or route.ts handlers.
paths:
  - "**/api/**/route.ts"
  - "**/route.ts"
---

# API route with Zod + Prisma

## Instructions

1. Follow existing `app/api/.../route.ts` layout in the repo.
2. Parse `params` and body/searchParams with Zod; return 400 on failure.
3. Enforce auth the same way nearby routes do; return 401/403 consistently.
4. Perform Prisma work only after validation; map not-found to 404.
5. Return JSON with a consistent envelope if the project has one; otherwise plain resource JSON.
6. Avoid exporting non-HTTP helpers from `route.ts`; put shared logic in `lib/`.

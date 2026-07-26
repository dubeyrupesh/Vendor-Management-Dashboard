---
name: nextjs-server-action-crud
description: Implement Next.js App Router CRUD with Server Actions and Prisma. Use when adding create/update/delete forms, server actions, or mutating dashboard data.
paths:
  - "app/**/*.tsx"
  - "app/**/*.ts"
  - "src/app/**/*.tsx"
  - "src/app/**/*.ts"
---

# Next.js Server Action CRUD

## Instructions

1. Prefer Server Components for reads; Server Actions for mutations.
2. Colocate actions near the route (`actions.ts`) unless the repo has a shared `lib/actions` pattern.
3. Validate all inputs with Zod before Prisma calls.
4. Use the shared Prisma singleton from `lib/db`; wrap multi-step writes in `prisma.$transaction`.
5. Revalidate the correct path/tag after success (`revalidatePath` / `revalidateTag`).
6. Return structured `{ ok, error }` results; never leak raw Prisma errors to the UI.
7. Mirror existing auth/session checks from a nearby action before writing.

---
name: prisma-schema-change
description: Add or change Prisma models safely. Use when editing schema.prisma, adding relations, migrations, or database fields.
paths:
  - "**/schema.prisma"
  - "prisma/**"
---

# Prisma schema change

## Instructions

1. Read `prisma/schema.prisma` and existing migrations before editing.
2. Prefer additive changes; avoid destructive column renames in one step.
3. Update the model, then run the project's migrate command (`npx prisma migrate dev` or the script in `package.json`).
4. Regenerate the client if the project does not do it automatically (`npx prisma generate`).
5. Update affected Zod/input types, API routes, Server Actions, and queries to match the new shape.
6. Add or adjust a focused unit test when the change affects scoring or business rules.
7. Summarize migration name, schema diff, and files touched.

---
name: dashboard-data-query
description: Build efficient Prisma aggregations and dashboard data loaders. Use when adding charts, scorecards, filters, date ranges, or leaderboard/table queries.
---

# Dashboard data query

## Instructions

1. Push filtering/aggregation into Prisma (`groupBy`, `aggregate`, `count`) instead of fetching rows and reducing in JS when possible.
2. Accept a single typed filter object (quarter, vendorId, status); default the quarter explicitly.
3. Select only columns the UI needs; avoid `include` depth greater than 2 unless required.
4. For expensive scorecards, prefer a dedicated query function in `lib/` with a clear name.
5. Keep chart series shape stable: `{ label, value }[]` or the project's existing chart DTO.
6. Suggest a schema index when filtering on new high-cardinality fields.
7. Note N+1 risks and fix with `include`/`select` or a single query.

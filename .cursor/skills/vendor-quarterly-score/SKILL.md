---
name: vendor-quarterly-score
description: Recompute project and vendor quarterly quality scores. Use when changing scoring weights, coverage rules, defect leakage scoring, or VendorQuarterScore roll-ups.
paths:
  - "lib/scoring/**"
  - "**/scoring/**"
---

# Vendor quarterly score

## Instructions

1. Read `lib/scoring/weights.ts` and `references/scoring-rubric.md` in this skill folder before changing formulas.
2. Score each project for a quarter, then average project scores into the vendor quarterly score.
3. Enforce the automation coverage target of **> 80%** as a scored factor (do not invent a different threshold).
4. Include qualitative ratings (responsiveness, availability, complexity understanding) on a 1–5 scale.
5. Persist roll-ups to `VendorQuarterScore` with a `scoreBreakdown` JSON for leadership drill-down.
6. After formula changes, update unit tests in `lib/scoring/*.test.ts` and regenerate any seeded demo scores.
7. Keep weights configurable in `lib/scoring/weights.ts` — do not hardcode magic numbers in UI components.

## See also

- [scoring-rubric.md](references/scoring-rubric.md)

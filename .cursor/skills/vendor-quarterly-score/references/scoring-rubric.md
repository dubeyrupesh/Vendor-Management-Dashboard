# Scoring rubric (v1)

Weighted composite **per project**, then **average across the vendor’s projects** for the quarter.

| Factor | Weight | Notes |
|---|---:|---|
| Automation coverage vs 80% target | 35% | Score scales with coverage; target is > 80% |
| Xray automation ratio | 20% | `automated / (manual + automated)`; 0 if no tests |
| Qualitative average | 30% | Mean of responsiveness, availability, complexity understanding (1–5 → 0–100) |
| Prod defect leakage | 15% | Lower is better; capped scale (0 defects = full points) |

Weights live in `lib/scoring/weights.ts`.

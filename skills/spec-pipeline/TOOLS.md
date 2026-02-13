# Tools Reference — Spec Pipeline

## File Paths

| Path | Purpose |
|------|---------|
| `/home/node/emika/spec-hub/data/research/` | Research output directory (sub-agents write here) |
| `/home/node/emika/spec-hub/data/research/pipeline-state.json` | Pipeline checkpoint/state |
| `/home/node/emika/spec-hub/data/research/<aspect-slug>.json` | Per-aspect research findings |

## Spec Hub API (localhost:3000)

All endpoints from the main TOOLS.md apply. Key ones for the pipeline:

| Action | Call |
|--------|------|
| Create spec | `POST /api/specs` with `{"title", "description", "status": "draft"}` |
| Add section | `POST /api/specs/:id/sections` with `{"title", "content", "order", "status"}` |
| Update spec | `PUT /api/specs/:id` with fields to update |
| Add edge case | `POST /api/specs/:id/edge-cases` with `{"question", "status": "open"}` |
| Add review note | `POST /api/specs/:id/review-notes` with `{"content", "type"}` |

## Sub-Agent Rules

- Always `cleanup: "delete"`
- One aspect per sub-agent
- Output: JSON file only (no API calls from sub-agents)
- Slug format: lowercase, hyphens (e.g., `api-design.json`, `error-handling.json`)

## Quality Gate Thresholds

- **Pass:** ≥ 70/100
- **Max iterations:** 3
- **Categories:** Completeness (20), Specificity (15), Edge Cases (15), Security (15), Grounding (15), Consistency (10), Actionability (10)

---
name: spec-pipeline
description: Multi-phase spec writing pipeline — delegates research to the research pipeline
version: 2.0.0
triggers:
  - "run a spec pipeline"
  - "spec pipeline for"
  - "pipeline spec"
---

# Spec Pipeline — Multi-Phase Specification Writer

This skill orchestrates spec writing by leveraging the **manager-research** pipeline for deep research, then synthesizing findings into a formal specification stored in the Spec Hub.

**Trigger:** "Run a spec pipeline for [topic]"

## How It Works

The spec pipeline now delegates research to the component research skills:

1. **Research Phase** → Uses **manager-research** pipeline (phases 1-5)
   - **research-planner** decomposes the topic into aspects
   - **aspect-researcher** sub-agents research each aspect in parallel
   - **synthesis** aggregates findings and identifies patterns
   - **quality-gate** evaluates research quality (PASS/WARN/FAIL)
   - **report-generator** produces a research report
   - **phase-checkpoint** / **resume-checkpoint** handle state and recovery
   - **grounding-protocol** ensures no hallucination throughout

2. **Spec Assembly** → Convert research report into structured spec sections via Spec Hub API

3. **Quality Gate** → Score the spec against the rubric (completeness, specificity, security, etc.)

## Research Pipeline Integration

To run the research phase:

```
Follow the manager-research skill to research "{topic}" at depth: deep
Session artifacts: /home/node/emika/spec-hub/data/research/{session_id}/
```

Once the research pipeline completes with a PASS or WARN verdict, read `FINAL_REPORT.md` and convert it into spec sections.

## Spec Assembly

After research completes, create spec in Spec Hub:

```bash
curl -s -X POST http://localhost:3000/api/specs \
  -H "Content-Type: application/json" \
  -d '{"title": "<Topic> Specification", "description": "Generated via spec pipeline", "status": "draft"}'
```

Then create sections from the research themes:
1. Overview & Problem Statement
2. Scope & Boundaries
3. Functional Requirements
4. Data Model / Schema
5. API / Interface Design
6. Security Considerations
7. Error Handling & Recovery
8. Performance & Scalability
9. Edge Cases & Open Questions
10. Acceptance Criteria

## Component Skills

See the individual skill directories for full details:
- `skills/manager-research/` — Main orchestrator
- `skills/research-planner/` — Topic decomposition
- `skills/aspect-researcher/` — Per-aspect web research (sub-agent)
- `skills/synthesis/` — Cross-aspect aggregation
- `skills/quality-gate/` — PASS/WARN/FAIL evaluation
- `skills/report-generator/` — Final report (sub-agent)
- `skills/phase-checkpoint/` — State checkpointing
- `skills/resume-checkpoint/` — Recovery from failures
- `skills/grounding-protocol/` — No-hallucination rules

---
name: manager-research
description: Multi-phase research pipeline orchestration with parallel sub-agents
version: 1.0.0
triggers:
  - "research"
  - "research topic"
  - "deep research"
---

# Research Pipeline Manager

## Purpose

Orchestrate a multi-phase research pipeline from topic decomposition to final report. Triggered by saying "research [topic]" to the System Analyst.

## Overview

```
Phase 1        Phase 2           Phase 3       Phase 4        Phase 5
Planning  ───▶ Research ×N ───▶ Synthesis ───▶ Quality ───▶ Report
   │              │                 │             │            │
   ▼              ▼                 ▼             ▼            ▼
plan.yaml    aspects/*.yaml   synthesis.yaml  quality.yaml  FINAL_REPORT.md
```

All artifacts stored in: `/home/node/emika/spec-hub/data/research/{session_id}/`

## Prerequisites

1. Generate session ID: `research_{YYYYMMDD}_{random6}`
2. Create artifacts directory:

```bash
SESSION_ID="research_$(date +%Y%m%d)_$(head -c 3 /dev/urandom | xxd -p)"
ARTIFACTS="/home/node/emika/spec-hub/data/research/${SESSION_ID}"
mkdir -p "${ARTIFACTS}/aspects" "${ARTIFACTS}/checkpoints"
```

3. Initialize `state.yaml`:

```yaml
session_id: "{session_id}"
topic: "{topic}"
workflow: "manager-research"
current_phase: "planning"
phase_states:
  planning: pending
  research: pending
  synthesis: pending
  quality_gate: pending
  report: pending
started_at: "{now}"
last_updated: "{now}"
error: null
```

---

## Phase 1: Planning

**Gate:** None (entry point)

### Actions

1. Analyze the topic using the **research-planner** skill
2. Decompose into 3-7 aspects based on depth (default: medium = 5)
3. Generate targeted queries for each aspect
4. Write `${ARTIFACTS}/plan.yaml`

### Quality Check
- `aspects.length >= 3`
- Each aspect has `>= 2` queries

### Checkpoint
After success, run **phase-checkpoint** with `phase_id: 1, phase_name: planning`

### Update State
```yaml
current_phase: "research"
phase_states.planning: "completed"
```

---

## Phase 2: Parallel Research

**Gate:** `plan.yaml` exists with `aspects.length >= 3`

### Actions

1. Read `plan.yaml`
2. Spawn one **aspect-researcher** sub-agent per aspect using `sessions_spawn()`
3. Wait for all to complete by polling for output files

### Spawning Sub-Agents

For each aspect in `plan.aspects`:

```javascript
sessions_spawn({
  task: `You are an aspect researcher. Follow the aspect-researcher skill.

Research this aspect:
- aspect_id: ${aspect.id}
- aspect_name: ${aspect.name}
- aspect_description: ${aspect.description}
- queries: ${JSON.stringify(aspect.queries)}
- session_id: ${session_id}
- output_path: /home/node/emika/spec-hub/data/research/${session_id}/aspects/${aspect.id}.yaml

Instructions:
1. Execute each search query using web_search
2. Evaluate source quality using tier classification (S/A/B/C/D/X)
3. Extract findings with full source attribution
4. Write structured YAML to the output_path

Apply grounding-protocol: every finding must have a source URL. No hallucination.`,
  cleanup: "delete"
})
```

**CRITICAL: Always use `cleanup: "delete"` for sub-agents.**

### Waiting for Completion

Poll for aspect files:
```bash
ls ${ARTIFACTS}/aspects/*.yaml | wc -l
```

All sub-agents should complete within 3-5 minutes. If a file is missing after 5 minutes, note the gap and proceed if `completed >= min_aspects_for_synthesis` (default: 3).

### Quality Check
- `count(aspects/*.yaml) >= 3`
- Each file has `findings.length >= 3`

### Checkpoint
Run **phase-checkpoint** with `phase_id: 2, phase_name: research`

---

## Phase 3: Synthesis

**Gate:** `count(aspects/*.yaml) >= 3`

### Actions

1. Load all aspect YAML files
2. Apply the **synthesis** skill:
   - Deduplicate findings across aspects
   - Identify cross-aspect patterns
   - Generate aggregated insights
   - Calculate quality metrics
3. Write `${ARTIFACTS}/synthesis.yaml`

### Checkpoint
Run **phase-checkpoint** with `phase_id: 3, phase_name: synthesis`

---

## Phase 4: Quality Gate

**Gate:** `synthesis.yaml` exists

### Actions

1. Apply the **quality-gate** skill
2. Evaluate against thresholds:
   - saturation ≥ 50%
   - diversity ≥ 0.5
   - tier_quality ≥ 0.6
   - evidence_depth ≥ 3
3. Write `${ARTIFACTS}/quality.yaml`

### Routing

| Verdict | Action |
|---------|--------|
| PASS | → Phase 5 |
| WARN | → Phase 5 (with caveats noted in report) |
| FAIL | → Report gaps to user, suggest re-research |

### Checkpoint
Run **phase-checkpoint** with `phase_id: 4, phase_name: quality_gate`

---

## Phase 5: Report Generation

**Gate:** `quality.verdict` is PASS or WARN

### Actions

1. Spawn **report-generator** sub-agent:

```javascript
sessions_spawn({
  task: `You are a report generator. Follow the report-generator skill.

Generate research report:
- session_id: ${session_id}
- synthesis_path: /home/node/emika/spec-hub/data/research/${session_id}/synthesis.yaml
- plan_path: /home/node/emika/spec-hub/data/research/${session_id}/plan.yaml
- quality_path: /home/node/emika/spec-hub/data/research/${session_id}/quality.yaml
- output_path: /home/node/emika/spec-hub/data/research/${session_id}/FINAL_REPORT.md

Apply grounding-protocol: every claim must trace to synthesis findings.`,
  cleanup: "delete"
})
```

2. Wait for `FINAL_REPORT.md` to appear
3. Optionally POST to Spec Hub API:

```bash
curl -s -X POST http://localhost:3000/api/specs \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Research: ${topic}\", \"status\": \"review\"}"
```

### Checkpoint
Run **phase-checkpoint** with `phase_id: 5, phase_name: report`

### Update State
```yaml
current_phase: "completed"
phase_states.report: "completed"
```

---

## Recovery

### On Worker Failure (Phase 2)

```
1. Log which aspect failed
2. Continue with remaining workers
3. At phase end:
   - If completed >= min_aspects → continue
   - If completed < min_aspects → retry failed only
```

### On Phase Failure

```
1. Update state.yaml with error
2. Report to user: what phase failed, what was completed, specific error
3. Suggest: retry command or manual intervention
```

### On Resume

```
1. Read state.yaml
2. Find current_phase
3. If in_progress → resume from there
4. If failed → offer retry or rollback via resume-checkpoint
5. Skip completed phases
```

User says "resume research" → read state.yaml, pick up where it left off.

### On Rollback

Use **resume-checkpoint** skill to restore to a previous phase and re-run from there.

---

## Component Skills

| Skill | Role | Phase |
|-------|------|-------|
| research-planner | Topic decomposition into aspects | 1 |
| aspect-researcher | Web search + source evaluation (sub-agent) | 2 |
| synthesis | Cross-aspect pattern identification | 3 |
| quality-gate | PASS/WARN/FAIL verdict | 4 |
| report-generator | Final report assembly (sub-agent) | 5 |
| phase-checkpoint | State checkpoint after each phase | 1-5 |
| resume-checkpoint | Restore from checkpoint | Recovery |
| grounding-protocol | No-hallucination rules | All |

---

## Example Run

```
User: research "AI agents orchestration patterns"

Phase 1: Planning
  ✓ Decomposed into 5 aspects (medium depth)
  → plan.yaml

Phase 2: Research (parallel)
  ✓ Spawning 5 sub-agents...
  ✓ aspects/architecture.yaml (12 findings)
  ✓ aspects/communication.yaml (8 findings)
  ✓ aspects/tools.yaml (15 findings)
  ✓ aspects/challenges.yaml (7 findings)
  ✓ aspects/implementation.yaml (6 findings)

Phase 3: Synthesis
  ✓ Aggregated 48 findings
  ✓ Identified 4 cross-aspect patterns
  → synthesis.yaml

Phase 4: Quality Gate
  ✓ Saturation: 72% (threshold: 50%) ✓
  ✓ Diversity: 0.81 (threshold: 0.5) ✓
  → Verdict: PASS

Phase 5: Report
  ✓ Generated 2,400 word report
  → FINAL_REPORT.md

Status: COMPLETED ✅
```

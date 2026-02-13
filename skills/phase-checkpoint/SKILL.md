---
name: phase-checkpoint
description: Create state checkpoint after each pipeline phase completion
version: 1.0.0
---

# Phase Checkpoint

## Purpose

Create a state checkpoint after each pipeline phase completes. Enables recovery from failures and resumption.

## When to Invoke

After any phase completes successfully:
- After planning → checkpoint: `phase-1-planning`
- After research → checkpoint: `phase-2-research`
- After synthesis → checkpoint: `phase-3-synthesis`
- After quality → checkpoint: `phase-4-quality`
- After report → checkpoint: `phase-5-report`

## Input

```yaml
session_id: "research_20260130_abc"
phase_id: 2
phase_name: "research"
```

## Procedure

### Step 1: Snapshot Artifacts

Copy current state of all artifacts to a checkpoint:

```bash
ARTIFACTS="/home/node/emika/spec-hub/data/research/${session_id}"
CHECKPOINT="${ARTIFACTS}/checkpoints/phase-${phase_id}-${phase_name}"
mkdir -p "${CHECKPOINT}"
cp -r "${ARTIFACTS}"/*.yaml "${CHECKPOINT}/" 2>/dev/null || true
cp -r "${ARTIFACTS}"/aspects "${CHECKPOINT}/" 2>/dev/null || true
```

### Step 2: Update State

Update `state.yaml` with checkpoint info:

```yaml
checkpoints:
  - phase: 2
    name: "research"
    path: "checkpoints/phase-2-research"
    created_at: "2026-01-30T10:30:00Z"
    files_count: 5
```

### Step 3: Update Phase Status

```yaml
phase_states:
  {phase_name}: "completed"
last_updated: "{now}"
```

## Output

```yaml
status: "created" | "skipped"
checkpoint:
  path: "checkpoints/phase-2-research"
  files_committed: 5
  phase: 2
  phase_name: "research"
message: "Checkpoint created successfully"
```

## Idempotency

Running checkpoint twice for same phase:
1. First run: creates checkpoint directory and copies
2. Second run: overwrites with identical data (safe)

## Error Handling

| Scenario | Action |
|----------|--------|
| No artifacts yet | Skip, return skipped |
| Disk full | Report error, don't halt pipeline |
| No changes | Skip gracefully |

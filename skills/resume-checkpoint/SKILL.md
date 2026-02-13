---
name: resume-checkpoint
description: Restore pipeline state from checkpoint and resume execution
version: 1.0.0
---

# Resume Checkpoint

## Purpose

Restore pipeline artifacts to a previous checkpoint and resume execution from that point. Enables recovery from failures and iterative debugging.

## When to Invoke

- Pipeline failed mid-phase and needs rollback
- User wants to re-run from a specific phase
- Experimenting with alternative approaches

## Input

```yaml
session_id: "research_20260130_abc"
target_phase: 2  # Resume AFTER this phase (start phase 3)
```

## Procedure

### Step 1: Validate Target

```bash
ARTIFACTS="/home/node/emika/spec-hub/data/research/${session_id}"
ls "${ARTIFACTS}/checkpoints/"
```

List available checkpoints and verify the target exists.

### Step 2: Restore Artifacts

```bash
CHECKPOINT="${ARTIFACTS}/checkpoints/phase-${target_phase}-${phase_name}"
# Restore key files from checkpoint
cp -r "${CHECKPOINT}"/*.yaml "${ARTIFACTS}/" 2>/dev/null || true
cp -r "${CHECKPOINT}"/aspects "${ARTIFACTS}/" 2>/dev/null || true
```

### Step 3: Update state.yaml

Reset phases after target to `pending`:

```yaml
session_id: "research_20260130_abc"
current_phase: "{next_phase_name}"
phase_states:
  planning: completed
  research: completed        # If target_phase >= 2
  synthesis: pending         # Reset phases after target
  quality_gate: pending
  report: pending
last_updated: "{now}"
restored_from:
  checkpoint: "phase-2-research"
  restored_at: "{now}"
  reason: "manual_resume"
```

### Step 4: Report Restoration

```yaml
status: "restored"
restored_to:
  phase: 2
  phase_name: "research"
next_phase: 3
next_phase_name: "synthesis"
message: "Restored to phase 2. Ready to resume from phase 3 (synthesis)."
```

## Phase Name Mapping

| Phase ID | Name | Description |
|----------|------|-------------|
| 1 | planning | Topic decomposition |
| 2 | research | Parallel aspect research |
| 3 | synthesis | Cross-aspect synthesis |
| 4 | quality_gate | Quality evaluation |
| 5 | report | Final report generation |

## Safety

- Does NOT delete any data
- Only overwrites working artifacts with checkpoint copies
- Original state recoverable from other checkpoints
- Uncommitted work in current phase will be overwritten (warning issued)

## Error Cases

| Error | Handling |
|-------|----------|
| Checkpoint not found | List available checkpoints, suggest closest |
| Invalid session | Error with available sessions list |
| Corrupted checkpoint | Report error, suggest earlier checkpoint |

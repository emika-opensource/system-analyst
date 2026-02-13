---
name: quality-gate
description: Evaluate synthesis quality and return PASS/WARN/FAIL verdict
version: 1.0.0
---

# Quality Gate

## Purpose

Evaluate research synthesis quality against thresholds. Return verdict that determines whether to proceed to report generation.

## Input

Reads from: `${ARTIFACTS}/synthesis.yaml`
Writes to: `${ARTIFACTS}/quality.yaml`

Where `ARTIFACTS=/home/node/emika/spec-hub/data/research/${session_id}`

## Procedure

### Step 1: Load Synthesis

```
synthesis = Read("${ARTIFACTS}/synthesis.yaml")
metrics = synthesis.quality_metrics
```

### Step 2: Evaluate Metrics

| Metric | Threshold | Weight | Evaluation |
|--------|-----------|--------|------------|
| saturation | ≥50 | 0.3 | Information completeness |
| diversity | ≥0.5 | 0.2 | Source variety |
| tier_quality | ≥0.6 | 0.3 | Average source quality |
| evidence_depth | ≥3 | 0.2 | Findings per insight |

For each metric:
```
score = metric_value >= threshold ? 1.0 : metric_value / threshold
weighted_score = score * weight
```

### Step 3: Check Critical Failures

**Automatic FAIL:**
- saturation < 30 (insufficient coverage)
- total_sources < 10 (not enough research)
- insights.length < 3 (not enough synthesis)
- S+A tier sources < 3 (quality too low)

### Step 4: Calculate Verdict

```
total_score = sum(weighted_scores)

PASS: total_score >= 0.8 AND no critical failures
WARN: total_score >= 0.5 AND no critical failures
FAIL: total_score < 0.5 OR any critical failure
```

### Step 5: Generate Issues & Recommendations

For each failed metric, generate an issue with severity and recommendation.

## Output Schema

Write to `${ARTIFACTS}/quality.yaml`:

```yaml
verdict: PASS|WARN|FAIL
total_score: number  # 0-1
evaluated_at: timestamp

scores:
  saturation:
    value: number
    threshold: number
    passed: boolean
    weight: number
    weighted_score: number
  diversity:
    # same structure
  tier_quality:
    # same structure
  evidence_depth:
    # same structure

critical_checks:
  min_saturation: boolean
  min_sources: boolean
  min_insights: boolean
  min_quality_sources: boolean

issues:
  - metric: string
    issue: string
    severity: warning|critical

recommendations:
  - string
```

## Decision Table

| Condition | Verdict | Action |
|-----------|---------|--------|
| total ≥0.8, no criticals | PASS | Proceed to report |
| total ≥0.5, no criticals | WARN | Proceed with caveats |
| total <0.5 | FAIL | Identify gaps, suggest re-research |
| any critical failure | FAIL | Address critical issue first |

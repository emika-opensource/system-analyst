---
name: synthesis
description: Aggregate findings across aspects, identify patterns and generate insights
version: 1.0.0
---

# Synthesis

## Purpose

Aggregate findings from multiple aspect research files. Identify cross-aspect patterns, generate insights, calculate quality metrics.

## Dependencies

- **grounding-protocol** — Ensure no hallucination in synthesis

## Input

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | Research session ID |

Reads from: `${ARTIFACTS}/aspects/*.yaml`
Writes to: `${ARTIFACTS}/synthesis.yaml`

Where `ARTIFACTS=/home/node/emika/spec-hub/data/research/${session_id}`

## Procedure

### Step 1: Load All Aspect Files

```
Read all *.yaml files from ${ARTIFACTS}/aspects/
Collect all findings across aspects
```

### Step 2: Deduplicate Findings

Across aspects, findings may overlap. Deduplicate by:
1. Exact URL match → keep higher tier version
2. Semantic similarity → merge, cite both sources

### Step 3: Identify Cross-Aspect Patterns

Look for:
- **Recurring themes:** Same concept in 2+ aspects
- **Contradictions:** Conflicting claims → note both
- **Causal chains:** A (aspect 1) enables B (aspect 2)
- **Gaps:** Expected topics not covered

For each pattern:
```yaml
pattern: "Description of pattern"
type: recurring|contradiction|causal|gap
aspects: ["aspect_1", "aspect_3"]
evidence:
  - finding_id: "f001"
    aspect: "aspect_1"
  - finding_id: "f012"
    aspect: "aspect_3"
strength: 3  # Number of supporting findings
```

### Step 4: Generate Insights

From patterns and strong findings, generate insights:

**Insight criteria:**
- Supported by 2+ sources
- Non-obvious (not just restating a finding)
- Actionable or informative

**Confidence levels:**

| Level | Criteria |
|-------|----------|
| high | 3+ S/A sources, no contradictions |
| medium | 2+ sources OR B-tier majority |
| low | Single source OR contradictions exist |

### Step 5: Calculate Quality Metrics

```yaml
saturation:   # Information completeness (0-100)
  formula: (unique_topics_covered / expected_topics) * 100
  threshold: 50

diversity:    # Source variety (0-1)
  formula: unique_domains / total_sources
  threshold: 0.5

tier_quality: # Weighted average of source tiers
  formula: sum(tier_weight * source_count) / total_sources
  threshold: 0.6

evidence_depth: # Average findings per insight
  formula: total_findings / total_insights
  threshold: 3
```

### Step 6: Organize by Themes

Group insights into themes for report structure.

## Output Schema

Write to `${ARTIFACTS}/synthesis.yaml`:

```yaml
metadata:
  session_id: string
  created_at: timestamp
  aspects_processed: number
  total_findings: number
  total_sources: number
  unique_domains: number

insights:
  - id: "i001"
    title: string
    description: string
    evidence:
      - finding_id: string
        aspect_id: string
        source_url: string
        weight: number
    confidence: high|medium|low
    type: observation|recommendation|warning

cross_aspect_patterns:
  - pattern: string
    type: recurring|contradiction|causal|gap
    aspects: string[]
    strength: number
    evidence: object[]

themes:
  - name: string
    description: string
    insights: string[]

quality_metrics:
  saturation: number
  diversity: number
  tier_quality: number
  evidence_depth: number

source_summary:
  total: number
  by_tier: {S: n, A: n, B: n, C: n, D: n}
  top_domains: string[]
```

## Quality Criteria

- [ ] All findings traced to aspects
- [ ] No hallucinated insights (grounding-protocol)
- [ ] Patterns have evidence
- [ ] Themes cover all major insights
- [ ] Metrics calculated

---
name: grounding-protocol
description: No-hallucination rules for data sourcing and traceability
version: 1.0.0
---

# Grounding Protocol

## Purpose

Ensure all generated content is traceable to source data. Prevent hallucination, fabrication, and unsupported claims.

## Core Principles

### Principle 1: Source Traceability

**Every factual claim must trace to a specific source.**

- Link claims to finding IDs
- Include source URLs
- Note confidence level based on source quality

**Violations:**
- Stating facts without source attribution
- "It is well known that..." without citation
- Synthesizing "insights" from nothing

### Principle 2: No Fabrication

**Never invent data, statistics, quotes, or facts.**

- Only use numbers from sources
- Only quote text that exists in sources
- If data is missing, say so explicitly

**Violations:**
- Inventing statistics ("Studies show 73%...")
- Fake quotes
- Made-up examples presented as real

### Principle 3: Uncertainty Acknowledgment

**Clearly mark uncertain or inferred content.**

- Use hedging for inferences: "This suggests...", "Based on the evidence..."
- Distinguish between direct quotes and paraphrasing
- Note when extrapolating beyond sources

### Hard Constraints (Never Violate)

| ID | Constraint |
|----|------------|
| HC1 | Never invent statistics or numbers |
| HC2 | Never fabricate quotes |
| HC3 | Never claim source says something it doesn't |
| HC4 | Never present inference as direct fact |

## Attribution Patterns

### Direct Claim
```
According to [Source], {claim}.
```

### Synthesis Claim
```
Multiple sources ({Source1}, {Source2}) indicate that {synthesis}.
```

### Inference
```
Based on {evidence}, this suggests that {inference}.
```

### Gap Acknowledgment
```
The sources do not address {topic}. Further research needed.
```

## Verification Checklist

Before outputting any research content:
- [ ] Every fact has a source
- [ ] No invented numbers
- [ ] No fabricated quotes
- [ ] Inferences are marked
- [ ] Gaps acknowledged
- [ ] Confidence levels appropriate

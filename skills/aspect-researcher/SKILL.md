---
name: aspect-researcher
description: Research a single aspect via web search with source quality evaluation
version: 1.0.0
---

# Aspect Researcher

## Purpose

Research a single aspect of a topic using web search. Evaluate source quality, extract findings with full attribution. This runs as a sub-agent spawned by the manager.

## Context

You receive:
- `aspect_id`: Unique identifier for this aspect
- `aspect_name`: Human-readable aspect name
- `aspect_description`: What to research
- `queries`: List of search queries to execute
- `session_id`: Current session
- `output_path`: Where to write results

## Instructions

### 1. Execute Searches

For each query in `queries`:
1. Run `web_search` with the query
2. Collect up to 8 results per query
3. On search failure, retry once then skip that query

### 2. Evaluate Sources

For each result:

**Tier Classification:**

| Tier | Weight | Match |
|------|--------|-------|
| S | 1.0 | github.com, arxiv.org, official docs, RFCs |
| A | 0.8 | Personal tech blogs, dev.to, HN, lobste.rs |
| B | 0.6 | Medium (with author), Stack Overflow |
| C | 0.4 | News sites, tech aggregators |
| D | 0.2 | Generic content sites |
| X | 0.0 | SEO farms → SKIP |

**Recency:**

| Age | Weight |
|-----|--------|
| <6 months | 1.0 |
| 6-18 months | 0.8 |
| 18-36 months | 0.6 |
| >36 months | 0.4 |

### 3. Extract Findings

For sources that pass (tier != X):
1. Fetch content via `web_fetch`
2. Extract: facts, data points, expert opinions (with attribution), patterns and trends
3. Tag each finding with source URL

### 4. Write Output

Write YAML to `output_path`:

```yaml
metadata:
  aspect_id: "{aspect_id}"
  aspect_name: "{aspect_name}"
  created_at: "{timestamp}"
  queries_executed: 3
  sources_evaluated: 24
  sources_used: 8

findings:
  - id: "f001"
    content: "Extracted insight or fact"
    source:
      url: "https://..."
      title: "Source Title"
      tier: A
      recency: fresh
    relevance: high
    tags: ["pattern", "architecture"]

themes:
  - name: "Theme Name"
    finding_ids: ["f001", "f003"]
    strength: 2

quality:
  tier_distribution: {S: 1, A: 4, B: 2, C: 1}
  source_diversity: 0.75
```

## Constraints

- Maximum 15 sources total
- Skip X-tier sources entirely
- Every finding must have source URL
- No hallucination — extract only from sources
- Apply grounding-protocol rules at all times

## Quality Criteria

- [ ] Minimum 5 findings
- [ ] At least 1 S/A tier source
- [ ] All findings have URLs
- [ ] Themes identified (if 5+ findings)

---
name: research-planner
description: Decompose topic into researchable aspects with targeted search queries
version: 1.0.0
---

# Research Planner

## Purpose

Decompose a research topic into distinct aspects, each with targeted search queries. Produces a structured plan for parallel research.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | Yes | Research topic |
| `depth` | enum | No | quick (3 aspects), medium (5), deep (7) |
| `focus_areas` | string[] | No | Areas to prioritize |
| `session_id` | string | Yes | Research session ID |

## Procedure

### Step 1: Topic Analysis

Analyze the topic to identify:
- Core concept
- Key dimensions (technical, market, social, etc.)
- Temporal aspects (current state, trends, future)
- Stakeholder perspectives

### Step 2: Aspect Generation

Generate aspects based on depth:

| Depth | Aspects | Focus |
|-------|---------|-------|
| quick | 3 | Core dimensions only |
| medium | 5 | Core + context |
| deep | 7 | Comprehensive coverage |

Each aspect must be:
- **Distinct:** No significant overlap with others
- **Researchable:** Can find sources via web search
- **Bounded:** Clear scope

### Step 3: Query Generation

For each aspect, generate 3-5 search queries:

**Query Types:**
- Definitional: "What is {concept}"
- Comparative: "{concept} vs {alternative}"
- Practical: "{concept} implementation"
- Expert: "{concept} best practices"
- Recent: "{concept} 2025 2026"

### Step 4: Write Plan

Write `plan.yaml` to the artifacts directory:

```bash
ARTIFACTS="/home/node/emika/spec-hub/data/research/${session_id}"
mkdir -p "${ARTIFACTS}"
```

## Output Schema

Write to `${ARTIFACTS}/plan.yaml`:

```yaml
topic: "Original topic"
depth: quick|medium|deep
created_at: "timestamp"
session_id: "research_{date}_{random}"

aspects:
  - id: "aspect_1"
    name: "Aspect Name"
    description: "What this aspect covers"
    priority: 1  # 1 = highest
    queries:
      - "query 1"
      - "query 2"
      - "query 3"

settings:
  max_sources_per_aspect: 15
  min_findings_per_aspect: 5
  min_aspects_for_synthesis: 3
```

## Quality Criteria

- [ ] Aspects are distinct (no major overlap)
- [ ] Each aspect has 2-5 queries (matching depth)
- [ ] Queries are searchable (not too broad/narrow)
- [ ] Queries include temporal markers for freshness
- [ ] Priorities assigned (1 = core, 2 = context, 3 = peripheral)
- [ ] Settings included

## Example

**Input:** `topic: "AI agents orchestration patterns"`, `depth: medium`

```yaml
topic: "AI agents orchestration patterns"
depth: medium
created_at: "2026-01-30T10:00:00Z"
session_id: "research_20260130_x7k9m"

aspects:
  - id: "architecture"
    name: "Architecture Patterns"
    description: "Structural patterns for multi-agent systems: hierarchical, mesh, swarm"
    priority: 1
    queries:
      - "multi-agent system architecture patterns"
      - "hierarchical vs mesh agent orchestration"
      - "agent swarm coordination patterns"

  - id: "communication"
    name: "Inter-Agent Communication"
    description: "How agents communicate: message passing, shared state, events"
    priority: 2
    queries:
      - "agent to agent communication protocols"
      - "multi-agent message passing patterns"

  - id: "tools"
    name: "Orchestration Frameworks"
    description: "Frameworks and tools: LangGraph, AutoGen, CrewAI, Claude Code"
    priority: 2
    queries:
      - "LangGraph vs AutoGen vs CrewAI comparison 2026"
      - "multi-agent orchestration frameworks"

  - id: "challenges"
    name: "Challenges & Limitations"
    description: "Common problems: coordination, state management, debugging"
    priority: 3
    queries:
      - "multi-agent system challenges"
      - "AI agent debugging and observability"

  - id: "implementation"
    name: "Implementation Patterns"
    description: "Tool use, prompt chaining, memory, file-based state"
    priority: 3
    queries:
      - "AI agent tool use patterns production"
      - "agent memory architecture implementation"

settings:
  max_sources_per_aspect: 15
  min_findings_per_aspect: 5
  min_aspects_for_synthesis: 3
```

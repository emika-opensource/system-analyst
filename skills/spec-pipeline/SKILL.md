---
name: spec-pipeline
description: Multi-phase spec writing pipeline with parallel research and quality gates
version: 1.0.0
triggers:
  - "run a spec pipeline"
  - "spec pipeline for"
  - "pipeline spec"
---

# Spec Pipeline — Multi-Phase Specification Writer

This skill orchestrates a full spec-writing pipeline with parallel research sub-agents and quality gates. It produces deeply-researched, grounded specifications stored in the Spec Hub.

**Trigger:** "Run a spec pipeline for [topic]"

## Overview

The pipeline has 4 phases:

1. **Planning** — Decompose topic into 5-8 research aspects, create spec shell
2. **Parallel Research** — Spawn sub-agents to research each aspect concurrently
3. **Synthesis** — Combine research into a coherent spec document
4. **Quality Gate** — Score, review, and iterate if needed

---

## Phase 1: Planning (Decomposition)

Given a spec request, decompose it into 5-8 aspects that need research. Common aspects include:

- **Functional requirements** — core features and user flows
- **Data model** — entities, relationships, schemas
- **API design** — endpoints, contracts, versioning
- **Security considerations** — auth, authz, data protection, threat model
- **Error handling** — failure modes, recovery, degradation
- **Performance & scalability** — load, caching, bottlenecks
- **Edge cases** — boundary conditions, race conditions, partial failures
- **Integration points** — third-party services, dependencies, compatibility

### Steps

1. Analyze the request and identify 5-8 specific research aspects
2. Create checkpoint file:

```bash
cat > /home/node/emika/spec-hub/data/research/pipeline-state.json << 'EOF'
{
  "topic": "<topic>",
  "status": "planning",
  "aspects": ["aspect1", "aspect2", ...],
  "specId": null,
  "scores": [],
  "iteration": 1
}
EOF
```

3. Create the spec shell in Spec Hub:

```bash
curl -s -X POST http://localhost:3000/api/specs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<Topic> Specification",
    "description": "Auto-generated via spec pipeline. Topic: <topic>",
    "status": "draft"
  }'
```

4. Save the returned spec `id` to the checkpoint file
5. Create research directory:

```bash
mkdir -p /home/node/emika/spec-hub/data/research
```

---

## Phase 2: Parallel Research

Spawn one sub-agent per aspect using `sessions_spawn()`. Each sub-agent researches ONE aspect deeply.

### Spawning Sub-Agents

For each aspect, spawn like this:

```javascript
sessions_spawn({
  task: `You are a research sub-agent. Research the following aspect for a specification about "${topic}":

ASPECT: ${aspectName}

Instructions:
1. Use web_search to find best practices, industry standards, and prior art
2. Search for common patterns and anti-patterns
3. Identify specific, actionable requirements (not vague generalities)
4. Note any assumptions you're making
5. Write your findings as structured JSON to: /home/node/emika/spec-hub/data/research/${aspectSlug}.json

Output format for the JSON file:
{
  "aspect": "${aspectName}",
  "findings": [
    {
      "claim": "Specific finding or requirement",
      "source": "URL or 'best practice' or 'industry standard'",
      "confidence": "high|medium|low",
      "type": "requirement|recommendation|warning|context"
    }
  ],
  "suggestedRequirements": [
    "MUST do X",
    "SHOULD do Y",
    "MAY do Z"
  ],
  "openQuestions": ["Question that needs stakeholder input"],
  "references": ["url1", "url2"]
}

Be thorough. Use RFC 2119 keywords in requirements. Every claim must have a source or be marked confidence:low.`,
  cleanup: "delete"
})
```

### CRITICAL Rules for Sub-Agents

- **ALWAYS** use `cleanup: "delete"` — no exceptions
- Each sub-agent writes to `/home/node/emika/spec-hub/data/research/<aspect-slug>.json`
- Aspect slug = lowercase, hyphens instead of spaces (e.g., `error-handling.json`)
- Sub-agents do NOT call the Spec Hub API — they only write research files

### Waiting for Completion

After spawning all sub-agents, wait for all research files to appear:

```bash
# Check if all expected files exist
ls /home/node/emika/spec-hub/data/research/*.json
```

Poll periodically. All sub-agents should complete within 2-3 minutes. If a file is missing after 5 minutes, note the gap and proceed with available research.

### Update checkpoint:

```bash
# Update pipeline-state.json status to "researching" then "synthesizing"
```

---

## Phase 3: Synthesis

Read all research files and synthesize into a coherent specification.

### Steps

1. Read all JSON files from `/home/node/emika/spec-hub/data/research/`
2. Deduplicate findings across aspects
3. Resolve conflicts (if two aspects contradict, flag as open question)
4. Organize into spec sections following this structure:

### Spec Section Structure

Create sections via the Spec Hub API in this order:

```
1. Overview & Problem Statement
2. Scope & Boundaries
3. Functional Requirements
4. Data Model / Schema
5. API / Interface Design
6. Security Considerations
7. Error Handling & Recovery
8. Performance & Scalability
9. Edge Cases & Open Questions
10. Glossary
11. Acceptance Criteria
```

For each section:

```bash
curl -s -X POST http://localhost:3000/api/specs/${SPEC_ID}/sections \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Section Title",
    "content": "Full markdown content...",
    "order": 1,
    "status": "draft"
  }'
```

### Grounding Protocol

Every requirement in the synthesized spec MUST follow these rules:

1. **Sourced claims** — If a requirement comes from research, include `[Source: <url or description>]` inline
2. **Assumptions** — If a requirement is inferred (not directly from research), mark it: `[ASSUMPTION — needs stakeholder validation]`
3. **No hallucination** — Do NOT invent requirements that aren't grounded in research or explicitly requested by the user
4. **Confidence markers** — For contentious or uncertain items, add `[Confidence: low/medium/high]`

### Update the spec status:

```bash
curl -s -X PUT http://localhost:3000/api/specs/${SPEC_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "review"}'
```

---

## Phase 4: Quality Gate

Self-review the synthesized spec against a scoring rubric.

### Scoring Rubric (100 points total)

| Category | Points | Criteria |
|----------|--------|----------|
| Completeness | 20 | All 11 sections present and substantive |
| Specificity | 15 | Uses RFC 2119 keywords, concrete values (not "fast" but "< 200ms") |
| Edge Cases | 15 | At least 5 edge cases identified per major feature |
| Security | 15 | Threat model, auth/authz, data protection addressed |
| Grounding | 15 | Every claim sourced or marked as assumption |
| Consistency | 10 | No contradictions between sections |
| Actionability | 10 | A developer could implement from this spec alone |

### Review Process

1. Score each category honestly
2. For each gap found, add an edge case:

```bash
curl -s -X POST http://localhost:3000/api/specs/${SPEC_ID}/edge-cases \
  -H "Content-Type: application/json" \
  -d '{"question": "Gap description", "status": "open"}'
```

3. Add a review note with the score:

```bash
curl -s -X POST http://localhost:3000/api/specs/${SPEC_ID}/review-notes \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Quality Gate Review — Iteration 1\nScore: 78/100\n\nCompleteness: 18/20\nSpecificity: 12/15\n...\n\nGaps identified:\n- Missing rate limiting specifics\n- No rollback procedure defined",
    "type": "quality-gate"
  }'
```

4. Update checkpoint with score

### Iteration Logic

- **Score ≥ 70:** Spec passes. Move to "review" status. Report to user.
- **Score < 70:** Identify the weakest categories. Spawn targeted sub-agents to research ONLY the gaps. Loop back to Phase 3 for re-synthesis. Maximum 3 iterations.

### Final Steps

1. Clean up research files:

```bash
rm -f /home/node/emika/spec-hub/data/research/*.json
# Keep pipeline-state.json as audit trail
```

2. Update checkpoint to `"status": "complete"`
3. Report to user with:
   - Spec ID and link (`http://localhost:3000/specs/${SPEC_ID}`)
   - Final quality score
   - Number of iterations
   - Open questions that need stakeholder input
   - Count of edge cases (open vs addressed)

---

## Resuming a Failed Pipeline

If a pipeline fails mid-execution:

1. Read `/home/node/emika/spec-hub/data/research/pipeline-state.json`
2. Check the `status` field:
   - `"planning"` → Restart from Phase 1
   - `"researching"` → Check which research files exist, re-spawn only missing ones
   - `"synthesizing"` → Re-read research and restart Phase 3
   - `"reviewing"` → Re-run Phase 4
3. The `specId` in the checkpoint lets you resume updating the same spec

---

## Examples

### Example 1: Basic Usage

**User:** "Run a spec pipeline for a user authentication system"

**You:**
1. Decompose into aspects: functional-requirements, data-model, api-design, security-considerations, error-handling, performance-scalability, edge-cases, integration-points
2. Create spec shell → get ID
3. Spawn 8 sub-agents in parallel
4. Wait for research files
5. Synthesize into full spec
6. Score → 74/100 → passes
7. Report: "Spec SA-xxx created with score 74/100. 12 edge cases flagged, 3 open questions need your input."

### Example 2: Targeted Topic

**User:** "Spec pipeline for a real-time notification system with WebSocket support"

Aspects might include: WebSocket protocol design, message queue architecture, delivery guarantees, offline handling, rate limiting, security (origin validation, auth), mobile push integration, monitoring & observability.

### Example 3: Resume

**User:** "Continue the spec pipeline" or "Resume spec pipeline"

Read checkpoint → pick up where it left off.

---

## Important Notes

- The Spec Hub API is at `http://localhost:3000` (same container, always available)
- All intermediate state is JSON files in `/home/node/emika/spec-hub/data/research/`
- Sub-agents MUST use `cleanup: "delete"` — no exceptions
- Maximum 3 quality gate iterations to prevent infinite loops
- If web search is unavailable, sub-agents should use their training knowledge but mark ALL findings as `confidence: "low"`

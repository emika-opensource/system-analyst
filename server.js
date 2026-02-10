const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

// Data directory
const DATA_DIR = fs.existsSync('/home/node/emika') ? '/home/node/emika/spec-hub' : path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(path.join(DATA_DIR, 'uploads'));

// Multer for file uploads
const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadJSON(file, fallback = []) {
  const p = path.join(DATA_DIR, file);
  try { return fs.readJsonSync(p); } catch { return fallback; }
}
function saveJSON(file, data) {
  fs.writeJsonSync(path.join(DATA_DIR, file), data, { spaces: 2 });
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── BM25 Search Engine ────────────────────────────────────────────────────

const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','it','as','was','are','be','has','had','do','does','this','that','these','those','i','you','he','she','we','they','my','your','his','her','its','our','their','what','which','who','whom','how','when','where','why','not','no','all','each','every','both','few','more','most','other','some','such','than','too','very','can','will','just','should','now']);

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function chunkText(text, size = 500) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > size && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += s + ' ';
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function bm25Search(query, chunks, limit = 10) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length || !chunks.length) return [];

  const k1 = 1.5, b = 0.75;
  const N = chunks.length;
  const avgDl = chunks.reduce((s, c) => s + (c.tokens || []).length, 0) / N || 1;

  // IDF
  const df = {};
  for (const c of chunks) {
    const unique = new Set(c.tokens || []);
    for (const t of unique) df[t] = (df[t] || 0) + 1;
  }

  const results = [];
  for (const chunk of chunks) {
    const tokens = chunk.tokens || [];
    const dl = tokens.length;
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;

    let score = 0;
    for (const qt of queryTokens) {
      const n = df[qt] || 0;
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);
      const freq = tf[qt] || 0;
      score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * dl / avgDl));
    }
    if (score > 0) results.push({ ...chunk, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ─── Templates ──────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'api-spec',
    name: 'API Specification',
    description: 'Complete REST/GraphQL API specification with endpoints, authentication, schemas, error handling, and rate limiting.',
    sections: [
      { title: 'Overview', promptQuestions: ['What is the purpose of this API?', 'Who are the consumers (frontend, mobile, third-party)?', 'What protocol and format (REST/JSON, GraphQL, gRPC)?'], contentTemplate: '## Overview\n\nDescribe the API purpose, consumers, and high-level architecture.\n\n### Base URL\n\n### Authentication Method\n\n### Versioning Strategy' },
      { title: 'Authentication & Authorization', promptQuestions: ['What auth mechanism (JWT, OAuth2, API keys)?', 'What are the permission levels/roles?', 'How are tokens refreshed/revoked?'], contentTemplate: '## Authentication & Authorization\n\n### Auth Mechanism\n\n### Roles & Permissions\n\n| Role | Permissions |\n|------|------------|\n\n### Token Lifecycle' },
      { title: 'Endpoints', promptQuestions: ['What resources does the API expose?', 'What CRUD operations are needed per resource?', 'Are there any batch or bulk operations?'], contentTemplate: '## Endpoints\n\n### Resource: [Name]\n\n#### GET /resource\n- Description:\n- Query Parameters:\n- Response Schema:\n- Example Response:\n\n#### POST /resource\n- Description:\n- Request Body:\n- Response Schema:' },
      { title: 'Request/Response Schemas', promptQuestions: ['What are the data models?', 'Are there nested objects or references?', 'What validation rules apply?'], contentTemplate: '## Schemas\n\n### [Model Name]\n\n```json\n{\n  "field": "type — description"\n}\n```\n\n### Validation Rules' },
      { title: 'Error Handling', promptQuestions: ['What error format do you use?', 'What HTTP status codes are returned?', 'How are validation errors structured?'], contentTemplate: '## Error Handling\n\n### Error Response Format\n\n```json\n{\n  "error": {\n    "code": "string",\n    "message": "string",\n    "details": []\n  }\n}\n```\n\n### Error Codes\n\n| Code | HTTP Status | Description |' },
      { title: 'Rate Limiting', promptQuestions: ['What are the rate limits per endpoint/user?', 'How are limits communicated (headers)?', 'What happens when limits are exceeded?'], contentTemplate: '## Rate Limiting\n\n### Limits\n\n| Tier | Requests/min | Burst |\n|------|-------------|-------|\n\n### Headers\n\n- `X-RateLimit-Limit`\n- `X-RateLimit-Remaining`\n- `X-RateLimit-Reset`' },
      { title: 'Pagination & Filtering', promptQuestions: ['Cursor-based or offset-based pagination?', 'What filtering/sorting options?', 'Max page size?'], contentTemplate: '## Pagination & Filtering\n\n### Pagination Strategy\n\n### Query Parameters\n\n### Example' },
      { title: 'Webhooks & Events', promptQuestions: ['Does the API emit events/webhooks?', 'What events trigger notifications?', 'How is delivery guaranteed?'], contentTemplate: '## Webhooks & Events\n\n### Available Events\n\n### Payload Format\n\n### Retry Policy' }
    ],
    edgeCasePrompts: ['What happens if the auth token is expired mid-request?', 'How does the API handle concurrent writes to the same resource?', 'What if a referenced resource is deleted while being referenced?', 'How does the API behave when the database is unavailable?', 'What is the maximum payload size and what happens when exceeded?']
  },
  {
    id: 'feature-spec',
    name: 'Feature Specification',
    description: 'End-to-end feature specification with user stories, acceptance criteria, wireframes, edge cases, and dependencies.',
    sections: [
      { title: 'Feature Overview', promptQuestions: ['What problem does this feature solve?', 'Who are the target users?', 'What is the expected business impact?'], contentTemplate: '## Feature Overview\n\n### Problem Statement\n\n### Target Users\n\n### Success Metrics\n\n### Business Value' },
      { title: 'User Stories', promptQuestions: ['What are the primary user flows?', 'Are there different user roles with different needs?', 'What is the MVP scope vs future enhancements?'], contentTemplate: '## User Stories\n\n### US-001: [Title]\n- **As a** [role]\n- **I want** [capability]\n- **So that** [benefit]\n\n**Acceptance Criteria:**\n- [ ] Given... When... Then...' },
      { title: 'Functional Requirements', promptQuestions: ['What are the must-have behaviors?', 'What data inputs and outputs are involved?', 'What business rules apply?'], contentTemplate: '## Functional Requirements\n\n### FR-001: [Title]\n- **Priority:** MUST/SHOULD/MAY\n- **Description:**\n- **Business Rule:**\n- **Acceptance Criteria:**' },
      { title: 'Non-Functional Requirements', promptQuestions: ['What are the performance expectations?', 'What accessibility standards apply?', 'What are the security requirements?'], contentTemplate: '## Non-Functional Requirements\n\n### Performance\n\n### Security\n\n### Accessibility\n\n### Scalability' },
      { title: 'UI/UX Design', promptQuestions: ['What does the user interface look like?', 'What is the interaction flow?', 'Are there responsive/mobile considerations?'], contentTemplate: '## UI/UX Design\n\n### Wireframes\n\n### User Flow\n\n### Responsive Behavior\n\n### Accessibility Notes' },
      { title: 'Dependencies & Risks', promptQuestions: ['What existing systems does this depend on?', 'Are there third-party dependencies?', 'What could go wrong?'], contentTemplate: '## Dependencies & Risks\n\n### Dependencies\n\n| Dependency | Type | Risk Level |\n|-----------|------|------------|\n\n### Risks & Mitigation' },
      { title: 'Implementation Plan', promptQuestions: ['What is the estimated effort?', 'Can this be broken into phases?', 'What needs to be built vs configured?'], contentTemplate: '## Implementation Plan\n\n### Phases\n\n### Estimated Effort\n\n### Technical Approach' }
    ],
    edgeCasePrompts: ['What happens if the user loses connectivity mid-action?', 'How does this feature behave with no data (empty state)?', 'What if two users perform conflicting actions simultaneously?', 'How does this degrade on slow connections or old devices?', 'What happens if a dependency service is down?']
  },
  {
    id: 'system-arch',
    name: 'System Architecture',
    description: 'System architecture document covering components, data flow, infrastructure, scaling strategy, and security.',
    sections: [
      { title: 'Architecture Overview', promptQuestions: ['What is the high-level architecture pattern (monolith, microservices, serverless)?', 'What are the main system boundaries?', 'What are the key design decisions and their rationale?'], contentTemplate: '## Architecture Overview\n\n### Architecture Pattern\n\n### System Context Diagram\n\n### Key Design Decisions\n\n| Decision | Rationale | Trade-offs |' },
      { title: 'Component Design', promptQuestions: ['What are the major components/services?', 'What is the responsibility of each?', 'How do they communicate?'], contentTemplate: '## Component Design\n\n### Component: [Name]\n- **Responsibility:**\n- **Technology:**\n- **Interfaces:**\n- **Dependencies:**' },
      { title: 'Data Architecture', promptQuestions: ['What databases/stores are used?', 'How does data flow through the system?', 'What is the data consistency model?'], contentTemplate: '## Data Architecture\n\n### Data Stores\n\n### Data Flow Diagram\n\n### Consistency Model\n\n### Data Retention Policy' },
      { title: 'Infrastructure', promptQuestions: ['What cloud provider/platform?', 'What is the deployment topology?', 'How is infrastructure managed (IaC)?'], contentTemplate: '## Infrastructure\n\n### Cloud Platform\n\n### Deployment Topology\n\n### Infrastructure as Code\n\n### Environments' },
      { title: 'Scaling Strategy', promptQuestions: ['What are the expected load patterns?', 'Horizontal vs vertical scaling?', 'What are the bottlenecks?'], contentTemplate: '## Scaling Strategy\n\n### Load Expectations\n\n### Scaling Approach\n\n### Bottlenecks & Mitigation\n\n### Auto-scaling Rules' },
      { title: 'Security Architecture', promptQuestions: ['What is the threat model?', 'How is data encrypted (at rest, in transit)?', 'What access control mechanisms exist?'], contentTemplate: '## Security Architecture\n\n### Threat Model\n\n### Encryption\n\n### Access Control\n\n### Audit Logging\n\n### Compliance Requirements' },
      { title: 'Monitoring & Observability', promptQuestions: ['What metrics are tracked?', 'What alerting thresholds?', 'What logging strategy?'], contentTemplate: '## Monitoring & Observability\n\n### Metrics\n\n### Alerting\n\n### Logging\n\n### Tracing\n\n### Dashboards' },
      { title: 'Disaster Recovery', promptQuestions: ['What is the RPO/RTO?', 'What is the backup strategy?', 'What is the failover process?'], contentTemplate: '## Disaster Recovery\n\n### RPO / RTO\n\n### Backup Strategy\n\n### Failover Process\n\n### Recovery Procedures' }
    ],
    edgeCasePrompts: ['What happens if a core service goes down — what is the blast radius?', 'How does the system handle network partitions between services?', 'What if the primary database becomes corrupted?', 'How does the system handle a sudden 10x traffic spike?', 'What happens during a rolling deployment if schemas are incompatible?']
  },
  {
    id: 'db-design',
    name: 'Database Design',
    description: 'Database schema specification with tables, relationships, indexes, migrations, and constraints.',
    sections: [
      { title: 'Overview', promptQuestions: ['What type of database (relational, document, graph)?', 'What is the expected data volume?', 'What are the primary access patterns?'], contentTemplate: '## Database Overview\n\n### Database Engine\n\n### Expected Data Volume\n\n### Primary Access Patterns' },
      { title: 'Schema Design', promptQuestions: ['What are the core entities?', 'What are the relationships between entities?', 'What are the cardinality constraints?'], contentTemplate: '## Schema Design\n\n### Entity: [Name]\n\n| Column | Type | Constraints | Description |\n|--------|------|------------|-------------|\n\n### Relationships\n\n### ER Diagram' },
      { title: 'Indexes & Performance', promptQuestions: ['What queries need to be fast?', 'What composite indexes are needed?', 'Are there full-text search requirements?'], contentTemplate: '## Indexes & Performance\n\n### Indexes\n\n| Table | Index | Columns | Type | Rationale |\n|-------|-------|---------|------|-----------|\n\n### Query Performance Targets' },
      { title: 'Constraints & Validation', promptQuestions: ['What unique constraints exist?', 'What foreign key rules (cascade, restrict)?', 'What check constraints?'], contentTemplate: '## Constraints & Validation\n\n### Unique Constraints\n\n### Foreign Keys\n\n### Check Constraints\n\n### Application-Level Validation' },
      { title: 'Migrations', promptQuestions: ['How are migrations managed?', 'What is the rollback strategy?', 'How are breaking changes handled?'], contentTemplate: '## Migrations\n\n### Migration Strategy\n\n### Rollback Plan\n\n### Breaking Changes Protocol\n\n### Data Migration Steps' },
      { title: 'Data Lifecycle', promptQuestions: ['What is the retention policy?', 'How is data archived?', 'What about soft deletes vs hard deletes?'], contentTemplate: '## Data Lifecycle\n\n### Retention Policy\n\n### Archival Strategy\n\n### Deletion Strategy\n\n### GDPR / Data Privacy' }
    ],
    edgeCasePrompts: ['What happens if a migration fails halfway through?', 'How do you handle schema changes with zero downtime?', 'What if an index becomes too large for memory?', 'How are orphaned records handled when parent records are deleted?', 'What happens if concurrent transactions create duplicate records?']
  },
  {
    id: 'integration-spec',
    name: 'Integration Specification',
    description: 'Third-party integration specification with data mapping, error handling, retry logic, and monitoring.',
    sections: [
      { title: 'Integration Overview', promptQuestions: ['What system are you integrating with?', 'What is the integration pattern (sync, async, batch)?', 'What data flows between systems?'], contentTemplate: '## Integration Overview\n\n### External System\n\n### Integration Pattern\n\n### Data Flow Direction\n\n### SLA Requirements' },
      { title: 'Authentication', promptQuestions: ['How does the external API authenticate?', 'How are credentials managed and rotated?', 'What are the rate limits?'], contentTemplate: '## Authentication\n\n### Auth Method\n\n### Credential Management\n\n### Rate Limits\n\n### Token Refresh Strategy' },
      { title: 'Data Mapping', promptQuestions: ['What fields map between systems?', 'Are there data transformations needed?', 'How are data types reconciled?'], contentTemplate: '## Data Mapping\n\n### Field Mapping\n\n| Our Field | Their Field | Transform | Notes |\n|-----------|------------|-----------|-------|\n\n### Data Transformations' },
      { title: 'Error Handling', promptQuestions: ['What errors can the external API return?', 'How should each error type be handled?', 'What is the retry strategy?'], contentTemplate: '## Error Handling\n\n### Error Types\n\n| Error Code | Meaning | Our Action | Retry? |\n|-----------|---------|------------|--------|\n\n### Circuit Breaker Configuration\n\n### Dead Letter Queue' },
      { title: 'Retry & Resilience', promptQuestions: ['What is the retry strategy (exponential backoff)?', 'What is the circuit breaker threshold?', 'How are failed messages recovered?'], contentTemplate: '## Retry & Resilience\n\n### Retry Strategy\n\n### Circuit Breaker\n\n### Fallback Behavior\n\n### Recovery Procedures' },
      { title: 'Monitoring & Alerting', promptQuestions: ['What metrics should be tracked?', 'What constitutes an integration failure?', 'How is data consistency verified?'], contentTemplate: '## Monitoring & Alerting\n\n### Health Checks\n\n### Metrics\n\n### Alerting Rules\n\n### Data Reconciliation' }
    ],
    edgeCasePrompts: ['What happens if the external API changes its schema without notice?', 'How do you handle partial failures in batch operations?', 'What if the external system returns stale data?', 'How do you handle timezone/locale differences?', 'What happens if the integration processes the same message twice (idempotency)?']
  },
  {
    id: 'migration-plan',
    name: 'Migration Plan',
    description: 'System migration plan with current/target state, step-by-step execution, rollback procedures, and risk assessment.',
    sections: [
      { title: 'Current State', promptQuestions: ['What is the current system architecture?', 'What are the pain points driving migration?', 'What data needs to be migrated?'], contentTemplate: '## Current State\n\n### Architecture\n\n### Pain Points\n\n### Data Inventory\n\n### Dependencies' },
      { title: 'Target State', promptQuestions: ['What does the target architecture look like?', 'What improvements does it deliver?', 'What new capabilities are gained?'], contentTemplate: '## Target State\n\n### Architecture\n\n### Improvements\n\n### New Capabilities\n\n### Technology Choices' },
      { title: 'Migration Strategy', promptQuestions: ['Big bang or incremental migration?', 'Can you run both systems in parallel?', 'What is the migration sequence?'], contentTemplate: '## Migration Strategy\n\n### Approach\n\n### Sequence\n\n### Parallel Running Period\n\n### Feature Flags' },
      { title: 'Data Migration', promptQuestions: ['How is data transformed between schemas?', 'How is data validated post-migration?', 'What is the data volume?'], contentTemplate: '## Data Migration\n\n### Schema Mapping\n\n### Transformation Rules\n\n### Validation Checks\n\n### Performance Estimate' },
      { title: 'Rollback Plan', promptQuestions: ['At what point can you still roll back?', 'How is data synchronized during rollback?', 'What is the rollback time estimate?'], contentTemplate: '## Rollback Plan\n\n### Point of No Return\n\n### Rollback Steps\n\n### Data Sync During Rollback\n\n### Time Estimate' },
      { title: 'Risk Assessment', promptQuestions: ['What could go wrong?', 'What is the impact of each risk?', 'What mitigations are in place?'], contentTemplate: '## Risk Assessment\n\n| Risk | Probability | Impact | Mitigation |\n|------|------------|--------|------------|\n\n### Contingency Plans' },
      { title: 'Timeline & Milestones', promptQuestions: ['What are the phases and deadlines?', 'What are the go/no-go criteria?', 'Who approves each phase?'], contentTemplate: '## Timeline & Milestones\n\n### Phases\n\n| Phase | Start | End | Go/No-Go Criteria |\n|-------|-------|-----|-------------------|\n\n### Approval Matrix' }
    ],
    edgeCasePrompts: ['What happens if the migration takes longer than the maintenance window?', 'How do you handle data created during the migration window?', 'What if the target system has lower performance initially?', 'How do you handle users who are mid-session during cutover?', 'What if you discover data corruption during migration?']
  },
  {
    id: 'security-audit',
    name: 'Security Audit Spec',
    description: 'Security audit specification with threat modeling, vulnerability assessment, controls, and compliance requirements.',
    sections: [
      { title: 'Scope & Objectives', promptQuestions: ['What systems are in scope?', 'What are the security objectives?', 'What compliance frameworks apply?'], contentTemplate: '## Scope & Objectives\n\n### Systems in Scope\n\n### Security Objectives\n\n### Compliance Requirements\n\n### Out of Scope' },
      { title: 'Threat Model', promptQuestions: ['Who are the threat actors?', 'What are the attack surfaces?', 'What assets need protection?'], contentTemplate: '## Threat Model\n\n### Threat Actors\n\n### Attack Surface\n\n### Assets\n\n| Asset | Classification | Threat | Impact |\n|-------|---------------|--------|--------|' },
      { title: 'Vulnerability Assessment', promptQuestions: ['What known vulnerabilities exist?', 'What tools are used for scanning?', 'What is the remediation priority?'], contentTemplate: '## Vulnerability Assessment\n\n### Known Vulnerabilities\n\n| ID | Severity | Description | Status |\n|----|----------|-------------|--------|\n\n### Scanning Tools & Schedule' },
      { title: 'Security Controls', promptQuestions: ['What preventive controls exist?', 'What detective controls?', 'What corrective controls?'], contentTemplate: '## Security Controls\n\n### Preventive\n\n### Detective\n\n### Corrective\n\n### Control Matrix' },
      { title: 'Access Control', promptQuestions: ['How is access managed?', 'What is the principle of least privilege implementation?', 'How are privileged accounts managed?'], contentTemplate: '## Access Control\n\n### IAM Strategy\n\n### Role Definitions\n\n### Privileged Access Management\n\n### Access Review Process' },
      { title: 'Incident Response', promptQuestions: ['What is the incident response plan?', 'What are the escalation procedures?', 'How are incidents documented?'], contentTemplate: '## Incident Response\n\n### Response Plan\n\n### Escalation Matrix\n\n### Communication Plan\n\n### Post-Incident Review' }
    ],
    edgeCasePrompts: ['What happens if an admin account is compromised?', 'How do you detect and respond to a data breach in progress?', 'What if a zero-day vulnerability is discovered in a core dependency?', 'How do you handle security incidents during off-hours?', 'What if compliance requirements conflict with usability?']
  },
  {
    id: 'performance-spec',
    name: 'Performance Specification',
    description: 'Performance specification with benchmarks, SLAs, load testing strategy, and optimization targets.',
    sections: [
      { title: 'Performance Requirements', promptQuestions: ['What are the response time targets?', 'What throughput is expected?', 'What are the concurrency requirements?'], contentTemplate: '## Performance Requirements\n\n### Response Time Targets\n\n| Endpoint/Operation | P50 | P95 | P99 |\n|-------------------|-----|-----|-----|\n\n### Throughput Targets\n\n### Concurrency Requirements' },
      { title: 'SLAs & SLOs', promptQuestions: ['What uptime is required?', 'What are the SLA penalties?', 'How are SLOs measured?'], contentTemplate: '## SLAs & SLOs\n\n### Service Level Agreements\n\n| Metric | Target | Measurement | Penalty |\n|--------|--------|------------|----------|\n\n### Error Budget' },
      { title: 'Load Testing Strategy', promptQuestions: ['What load testing tools?', 'What are the test scenarios?', 'What is the load profile?'], contentTemplate: '## Load Testing Strategy\n\n### Tools\n\n### Test Scenarios\n\n### Load Profiles\n\n| Profile | Users | Ramp-up | Duration | Think Time |\n|---------|-------|---------|----------|------------|' },
      { title: 'Benchmarks', promptQuestions: ['What is the current baseline performance?', 'What are the target improvements?', 'How often are benchmarks run?'], contentTemplate: '## Benchmarks\n\n### Current Baseline\n\n### Target Performance\n\n### Benchmark Schedule\n\n### Comparison Methodology' },
      { title: 'Optimization Targets', promptQuestions: ['What are the known bottlenecks?', 'What optimization techniques apply?', 'What is the optimization priority?'], contentTemplate: '## Optimization Targets\n\n### Identified Bottlenecks\n\n### Optimization Plan\n\n| Bottleneck | Technique | Expected Improvement | Effort |\n|-----------|-----------|---------------------|--------|\n\n### Caching Strategy' },
      { title: 'Capacity Planning', promptQuestions: ['What is the growth projection?', 'When will current infrastructure be insufficient?', 'What is the scaling cost model?'], contentTemplate: '## Capacity Planning\n\n### Growth Projections\n\n### Infrastructure Limits\n\n### Scaling Triggers\n\n### Cost Model' }
    ],
    edgeCasePrompts: ['What happens when the system hits its performance ceiling?', 'How does performance degrade under sustained load beyond capacity?', 'What if a single tenant/user generates disproportionate load?', 'How does cold start / cache miss affect performance?', 'What is the performance impact of running background jobs during peak hours?']
  }
];

// ─── CRUD Helpers ───────────────────────────────────────────────────────────

function crudRoutes(app, resource, file) {
  app.get(`/api/${resource}`, (req, res) => {
    res.json(loadJSON(file, []));
  });
  app.post(`/api/${resource}`, (req, res) => {
    const items = loadJSON(file, []);
    const item = { id: uid(), ...req.body, createdAt: new Date().toISOString() };
    items.push(item);
    saveJSON(file, items);
    res.json(item);
  });
  app.get(`/api/${resource}/:id`, (req, res) => {
    const items = loadJSON(file, []);
    const item = items.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  app.put(`/api/${resource}/:id`, (req, res) => {
    const items = loadJSON(file, []);
    const idx = items.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
    saveJSON(file, items);
    res.json(items[idx]);
  });
  app.delete(`/api/${resource}/:id`, (req, res) => {
    let items = loadJSON(file, []);
    items = items.filter(i => i.id !== req.params.id);
    saveJSON(file, items);
    res.json({ success: true });
  });
}

// ─── Projects ───────────────────────────────────────────────────────────────

crudRoutes(app, 'projects', 'projects.json');

// ─── Links ──────────────────────────────────────────────────────────────────

crudRoutes(app, 'links', 'links.json');

// ─── Specifications ─────────────────────────────────────────────────────────

app.get('/api/specs', (req, res) => {
  res.json(loadJSON('specs.json', []));
});

app.post('/api/specs', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = {
    id: uid(),
    title: req.body.title || 'Untitled Specification',
    description: req.body.description || '',
    status: 'draft',
    version: '0.1.0',
    sections: req.body.sections || [],
    edgeCases: req.body.edgeCases || [],
    reviewNotes: [],
    exportFormats: ['md', 'html', 'pdf'],
    tags: req.body.tags || [],
    projectId: req.body.projectId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  specs.push(spec);
  saveJSON('specs.json', specs);
  res.json(spec);
});

app.get('/api/specs/:id', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });
  res.json(spec);
});

app.put('/api/specs/:id', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const idx = specs.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  specs[idx] = { ...specs[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveJSON('specs.json', specs);
  res.json(specs[idx]);
});

app.delete('/api/specs/:id', (req, res) => {
  let specs = loadJSON('specs.json', []);
  specs = specs.filter(s => s.id !== req.params.id);
  saveJSON('specs.json', specs);
  res.json({ success: true });
});

// Sections
app.post('/api/specs/:id/sections', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });
  const section = {
    id: uid(),
    title: req.body.title || 'New Section',
    content: req.body.content || '',
    order: spec.sections.length,
    status: req.body.status || 'draft'
  };
  spec.sections.push(section);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json(section);
});

app.put('/api/specs/:id/sections/:sectionId', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Spec not found' });
  const section = spec.sections.find(s => s.id === req.params.sectionId);
  if (!section) return res.status(404).json({ error: 'Section not found' });
  Object.assign(section, req.body);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json(section);
});

app.delete('/api/specs/:id/sections/:sectionId', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Spec not found' });
  spec.sections = spec.sections.filter(s => s.id !== req.params.sectionId);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json({ success: true });
});

// Edge Cases
app.post('/api/specs/:id/edge-cases', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });
  const ec = {
    id: uid(),
    question: req.body.question || '',
    answer: req.body.answer || '',
    status: req.body.status || 'open',
    createdAt: new Date().toISOString()
  };
  spec.edgeCases.push(ec);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json(ec);
});

app.put('/api/specs/:id/edge-cases/:caseId', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Spec not found' });
  const ec = spec.edgeCases.find(e => e.id === req.params.caseId);
  if (!ec) return res.status(404).json({ error: 'Edge case not found' });
  Object.assign(ec, req.body);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json(ec);
});

// Review Notes
app.post('/api/specs/:id/review-notes', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });
  const note = {
    id: uid(),
    content: req.body.content || '',
    type: req.body.type || 'user-feedback',
    createdAt: new Date().toISOString()
  };
  spec.reviewNotes.push(note);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json(note);
});

// Export
app.get('/api/specs/:id/export/:format', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });

  const { format } = req.params;

  // Build markdown
  let md = `---\ntitle: "${spec.title}"\nversion: ${spec.version}\ndate: ${spec.updatedAt || spec.createdAt}\nstatus: ${spec.status}\n---\n\n# ${spec.title}\n\n`;
  if (spec.description) md += `${spec.description}\n\n`;

  md += `## Table of Contents\n\n`;
  (spec.sections || []).sort((a, b) => a.order - b.order).forEach((s, i) => {
    md += `${i + 1}. [${s.title}](#${s.title.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  md += `${(spec.sections || []).length + 1}. [Edge Cases](#edge-cases)\n\n`;

  for (const s of (spec.sections || []).sort((a, b) => a.order - b.order)) {
    md += `## ${s.title}\n\n${s.content || '*No content yet*'}\n\n`;
  }

  if (spec.edgeCases && spec.edgeCases.length) {
    md += `## Edge Cases\n\n`;
    for (const ec of spec.edgeCases) {
      const status = ec.status === 'addressed' ? '[ADDRESSED]' : ec.status === 'deferred' ? '[DEFERRED]' : '[OPEN]';
      md += `### ${status} ${ec.question}\n\n`;
      if (ec.answer) md += `${ec.answer}\n\n`;
    }
  }

  if (format === 'md') {
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${spec.title.replace(/[^a-z0-9]/gi, '-')}.md"`);
    return res.send(md);
  }

  const htmlContent = marked(md);
  const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${spec.title}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root { --bg: #06060a; --surface: #0f0f14; --border: #1a1a24; --text: #e0e0e8; --muted: #888898; --accent: #6366f1; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.7; }
h1 { font-size: 2rem; color: #fff; margin-bottom: 8px; border-bottom: 2px solid var(--accent); padding-bottom: 12px; }
h2 { font-size: 1.4rem; color: #fff; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
h3 { font-size: 1.1rem; color: var(--accent); margin: 20px 0 8px; }
p { margin-bottom: 12px; }
ul, ol { margin: 0 0 12px 24px; }
li { margin-bottom: 4px; }
code { font-family: 'JetBrains Mono', monospace; background: var(--surface); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
pre { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; overflow-x: auto; margin-bottom: 16px; }
pre code { background: none; padding: 0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
th { background: var(--surface); color: var(--accent); font-weight: 600; }
blockquote { border-left: 3px solid var(--accent); padding-left: 16px; color: var(--muted); margin-bottom: 12px; }
hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
.version-badge { display: inline-block; background: var(--accent); color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; margin-left: 8px; }
@media print {
  body { background: #fff; color: #000; padding: 20px; }
  h1, h2, h3 { color: #000; }
  h1 { border-bottom-color: #6366f1; }
  code { background: #f0f0f0; }
  pre { background: #f5f5f5; border-color: #ddd; }
  th { background: #f0f0f0; color: #333; }
  th, td { border-color: #ccc; }
  .version-badge { background: #6366f1; }
}
</style>
</head>
<body>
<div style="margin-bottom: 24px; color: var(--muted); font-size: 0.85rem;">
  Version: ${spec.version} <span class="version-badge">v${spec.version}</span> &middot;
  Status: ${spec.status.toUpperCase()} &middot;
  Updated: ${new Date(spec.updatedAt || spec.createdAt).toLocaleDateString()}
</div>
${htmlContent}
</body>
</html>`;

  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${spec.title.replace(/[^a-z0-9]/gi, '-')}.html"`);
    return res.send(styledHtml);
  }

  if (format === 'pdf') {
    // Serve as HTML with print prompt
    return res.send(styledHtml + `<script>setTimeout(()=>window.print(),500)</script>`);
  }

  res.status(400).json({ error: 'Invalid format. Use md, html, or pdf.' });
});

// Create from template
app.post('/api/specs/from-template', (req, res) => {
  const template = TEMPLATES.find(t => t.id === req.body.templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const specs = loadJSON('specs.json', []);
  const spec = {
    id: uid(),
    title: req.body.title || `${template.name} - New`,
    description: template.description,
    status: 'draft',
    version: '0.1.0',
    sections: template.sections.map((s, i) => ({
      id: uid(),
      title: s.title,
      content: s.contentTemplate,
      order: i,
      status: 'draft'
    })),
    edgeCases: template.edgeCasePrompts.map(q => ({
      id: uid(),
      question: q,
      answer: '',
      status: 'open',
      createdAt: new Date().toISOString()
    })),
    reviewNotes: [],
    exportFormats: ['md', 'html', 'pdf'],
    tags: req.body.tags || [],
    projectId: req.body.projectId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  specs.push(spec);
  saveJSON('specs.json', specs);
  res.json(spec);
});

// ─── Templates ──────────────────────────────────────────────────────────────

app.get('/api/templates', (req, res) => {
  res.json(TEMPLATES);
});

// ─── Knowledge Base / Documents ─────────────────────────────────────────────

app.get('/api/documents', (req, res) => {
  res.json(loadJSON('documents.json', []));
});

app.get('/api/documents/:id', (req, res) => {
  const docs = loadJSON('documents.json', []);
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  // Include chunks
  const allChunks = loadJSON('knowledge-chunks.json', []);
  const chunks = allChunks.filter(c => c.documentId === doc.id);
  res.json({ ...doc, chunks });
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    const docs = loadJSON('documents.json', []);
    const chunks = loadJSON('knowledge-chunks.json', []);

    let text = '';
    let filename = 'pasted-text.txt';
    let fileType = 'text';
    let fileSize = 0;

    if (req.file) {
      filename = req.file.originalname;
      fileSize = req.file.size;
      const ext = path.extname(filename).toLowerCase();
      const content = await fs.readFile(req.file.path);

      if (ext === '.pdf') {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(content);
        text = data.text;
        fileType = 'pdf';
      } else if (['.md', '.txt', '.html', '.json', '.js', '.ts', '.py', '.yaml', '.yml', '.csv'].includes(ext)) {
        text = content.toString('utf-8');
        fileType = ext.replace('.', '');
      } else {
        text = content.toString('utf-8');
        fileType = ext.replace('.', '') || 'text';
      }
      // Cleanup temp file
      await fs.remove(req.file.path);
    } else if (req.body.text) {
      text = req.body.text;
      filename = req.body.name || 'pasted-text.txt';
      fileSize = Buffer.byteLength(text);
    }

    if (!text.trim()) return res.status(400).json({ error: 'No content extracted' });

    const docId = uid();
    const textChunks = chunkText(text);
    const newChunks = textChunks.map((c, i) => ({
      id: uid(),
      documentId: docId,
      content: c,
      tokens: tokenize(c),
      index: i
    }));

    const doc = {
      id: docId,
      name: req.body.name || filename,
      filename,
      type: fileType,
      category: req.body.category || 'other',
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim())) : [],
      chunkCount: newChunks.length,
      uploadedAt: new Date().toISOString(),
      size: fileSize
    };

    docs.push(doc);
    chunks.push(...newChunks);
    saveJSON('documents.json', docs);
    saveJSON('knowledge-chunks.json', chunks);

    res.json(doc);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  let docs = loadJSON('documents.json', []);
  let chunks = loadJSON('knowledge-chunks.json', []);
  docs = docs.filter(d => d.id !== req.params.id);
  chunks = chunks.filter(c => c.documentId !== req.params.id);
  saveJSON('documents.json', docs);
  saveJSON('knowledge-chunks.json', chunks);
  res.json({ success: true });
});

// ─── Search ─────────────────────────────────────────────────────────────────

app.get('/api/search', (req, res) => {
  const q = req.query.q || '';
  const limit = parseInt(req.query.limit) || 10;
  if (!q.trim()) return res.json([]);

  const chunks = loadJSON('knowledge-chunks.json', []);
  const docs = loadJSON('documents.json', []);
  const results = bm25Search(q, chunks, limit);

  // Enrich with document info
  const enriched = results.map(r => {
    const doc = docs.find(d => d.id === r.documentId);
    return {
      content: r.content,
      score: Math.round(r.score * 100) / 100,
      documentId: r.documentId,
      documentName: doc ? doc.name : 'Unknown',
      documentCategory: doc ? doc.category : 'other'
    };
  });

  res.json(enriched);
});

// ─── Analyze ────────────────────────────────────────────────────────────────

app.post('/api/analyze', (req, res) => {
  const { text, name, category } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'No text provided' });

  const docs = loadJSON('documents.json', []);
  const chunks = loadJSON('knowledge-chunks.json', []);

  const docId = uid();
  const textChunks = chunkText(text);
  const newChunks = textChunks.map((c, i) => ({
    id: uid(),
    documentId: docId,
    content: c,
    tokens: tokenize(c),
    index: i
  }));

  const doc = {
    id: docId,
    name: name || 'Analysis Input',
    filename: 'analysis-input.txt',
    type: 'text',
    category: category || 'other',
    tags: ['analysis'],
    chunkCount: newChunks.length,
    uploadedAt: new Date().toISOString(),
    size: Buffer.byteLength(text)
  };

  docs.push(doc);
  chunks.push(...newChunks);
  saveJSON('documents.json', docs);
  saveJSON('knowledge-chunks.json', chunks);

  // Generate analysis questions based on content
  const questions = [];
  const tokens = tokenize(text);
  const hasApi = tokens.some(t => ['api', 'endpoint', 'rest', 'graphql', 'route'].includes(t));
  const hasDb = tokens.some(t => ['database', 'table', 'schema', 'sql', 'query', 'migration'].includes(t));
  const hasAuth = tokens.some(t => ['auth', 'authentication', 'authorization', 'token', 'jwt', 'oauth'].includes(t));
  const hasInfra = tokens.some(t => ['deploy', 'server', 'docker', 'kubernetes', 'aws', 'cloud', 'infrastructure'].includes(t));

  questions.push('What is the primary purpose of this system/component?');
  questions.push('Who are the main users or consumers?');
  if (hasApi) {
    questions.push('What authentication method do the APIs use?');
    questions.push('What happens when an API endpoint receives malformed input?');
    questions.push('Are there rate limiting or throttling mechanisms?');
  }
  if (hasDb) {
    questions.push('What is the data retention policy?');
    questions.push('How are database migrations handled?');
    questions.push('What happens if a migration fails halfway?');
  }
  if (hasAuth) {
    questions.push('How are tokens stored and refreshed?');
    questions.push('What happens when a session expires mid-operation?');
    questions.push('How are privileged actions audited?');
  }
  if (hasInfra) {
    questions.push('What is the disaster recovery strategy?');
    questions.push('How is the system monitored for failures?');
    questions.push('What is the deployment rollback procedure?');
  }
  questions.push('What are the main failure modes?');
  questions.push('How does this component interact with other parts of the system?');

  res.json({ document: doc, analysisQuestions: questions });
});

// ─── Config ─────────────────────────────────────────────────────────────────

app.get('/api/config', (req, res) => {
  res.json(loadJSON('config.json', {
    companyName: '',
    defaultTechStack: [],
    reviewRequirements: { requireAllEdgeCasesAddressed: true, minimumSections: 3 }
  }));
});

app.put('/api/config', (req, res) => {
  saveJSON('config.json', req.body);
  res.json(req.body);
});

// ─── Analytics ──────────────────────────────────────────────────────────────

app.get('/api/analytics', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const docs = loadJSON('documents.json', []);
  const projects = loadJSON('projects.json', []);

  const byStatus = { draft: 0, review: 0, approved: 0, archived: 0 };
  let totalSections = 0, totalEdgeCases = 0, addressedEdgeCases = 0, openEdgeCases = 0;

  for (const s of specs) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    totalSections += (s.sections || []).length;
    for (const ec of (s.edgeCases || [])) {
      totalEdgeCases++;
      if (ec.status === 'addressed') addressedEdgeCases++;
      if (ec.status === 'open') openEdgeCases++;
    }
  }

  const specsByProject = {};
  for (const s of specs) {
    const pid = s.projectId || 'none';
    specsByProject[pid] = (specsByProject[pid] || 0) + 1;
  }

  // Activity timeline (last 30 days)
  const now = Date.now();
  const activity = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * 86400000).toISOString().split('T')[0];
    const count = specs.filter(s => (s.createdAt || '').startsWith(date) || (s.updatedAt || '').startsWith(date)).length;
    activity.push({ date, count });
  }

  res.json({
    totalSpecs: specs.length,
    byStatus,
    totalSections,
    avgSections: specs.length ? Math.round(totalSections / specs.length * 10) / 10 : 0,
    totalEdgeCases,
    addressedEdgeCases,
    openEdgeCases,
    edgeCaseCoverage: totalEdgeCases ? Math.round(addressedEdgeCases / totalEdgeCases * 100) : 0,
    totalDocuments: docs.length,
    totalProjects: projects.length,
    specsByProject,
    activity
  });
});

// ─── SPA fallback ───────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Spec Hub server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

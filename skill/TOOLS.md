# Tools Reference — System Analyst

## Specifications

```
GET  /api/specs                          → [Spec]
POST /api/specs                          → Spec  (body: {title, description, tags[], projectId?})
GET  /api/specs/:id                      → Spec
PUT  /api/specs/:id                      → Spec  (body: partial update)
DELETE /api/specs/:id                    → {success}

POST /api/specs/:id/sections             → Section (body: {title, content?, status?})
PUT  /api/specs/:id/sections/:sid        → Section (body: partial)
DELETE /api/specs/:id/sections/:sid      → {success}

POST /api/specs/:id/edge-cases           → EdgeCase (body: {question, status?})
PUT  /api/specs/:id/edge-cases/:eid      → EdgeCase (body: {answer?, status?})

POST /api/specs/:id/review-notes         → Note (body: {content, type: self-review|user-feedback|question})

GET  /api/specs/:id/export/md            → Markdown file download
GET  /api/specs/:id/export/html          → HTML file download
GET  /api/specs/:id/export/pdf           → Styled HTML with print dialog

POST /api/specs/from-template            → Spec (body: {templateId, title, projectId?, tags[]})
```

## Knowledge Base

```
GET  /api/documents                      → [Document]
POST /api/documents                      → Document (multipart: file + category + name)
GET  /api/documents/:id                  → Document + chunks[]
DELETE /api/documents/:id                → {success}

GET  /api/search?q=query&limit=10        → [{content, score, documentName, documentCategory}]

POST /api/analyze                        → {document, analysisQuestions[]} (body: {text, name?, category?})
```

## Other

```
GET/POST/PUT/DELETE /api/projects        → Project {id, name, description, techStack[], architecture, links[]}
GET/POST/DELETE     /api/links           → Link {id, title, url, description, category, tags[]}
GET                 /api/templates       → [Template] (read-only, 8 built-in templates)
GET/PUT             /api/config          → Config {companyName, defaultTechStack[], reviewRequirements}
GET                 /api/analytics       → Stats {totalSpecs, byStatus, edgeCaseCoverage, activity[]}
```

## Status Values
- Spec: draft, review, approved, archived
- Section: draft, complete, needs-review
- Edge Case: open, addressed, deferred
- Review Note Type: self-review, user-feedback, question

## Categories (Documents/Links)
architecture, requirements, api-docs, codebase, meeting-notes, design, reference, tools, other

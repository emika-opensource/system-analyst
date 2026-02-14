# Tools Reference — System Analyst

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.

## Spec Hub App

Your **Spec Hub** web application is ALREADY RUNNING on port 3000. It starts automatically via `start.sh`.

- **DO NOT** kill anything on port 3000 — that's YOUR app
- **DO NOT** try to start a new server on port 3000
- The app is accessible to the user via the browser panel (iframe)
- All API endpoints below are served by this app at `http://localhost:3000`

## API Quick Reference

| Resource | Endpoints |
|----------|-----------|
| Specs | `GET /api/specs`, `POST /api/specs`, `GET /api/specs/:id`, `PUT /api/specs/:id`, `DELETE /api/specs/:id` |
| Edge Cases | `POST /api/specs/:id/edge-cases`, `PUT /api/specs/:id/edge-cases/:caseId`, `DELETE /api/specs/:id/edge-cases/:caseId` |
| Export | `GET /api/specs/:id/export/md`, `GET /api/specs/:id/export/html`, `GET /api/specs/:id/export/pdf` |
| Documents | `GET /api/documents`, `GET /api/documents/:id`, `POST /api/documents` (multipart), `DELETE /api/documents/:id` |
| Search | `GET /api/search?q=...&limit=10` |
| Analyze | `POST /api/analyze` |
| Links | `GET /api/links`, `POST /api/links`, `DELETE /api/links/:id` |

### Spec Object

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "draft|review|approved|archived",
  "version": "0.1.0",
  "content": "# Markdown content...",
  "edgeCases": [
    {
      "id": "string",
      "question": "What if...?",
      "answer": "Resolution...",
      "status": "open|addressed|deferred"
    }
  ],
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Creating a Spec

```bash
curl -X POST http://localhost:3000/api/specs \
  -H 'Content-Type: application/json' \
  -d '{"title": "My Spec", "description": "Brief desc", "content": "# Spec\n\n..."}'
```

### Updating a Spec

```bash
curl -X PUT http://localhost:3000/api/specs/:id \
  -H 'Content-Type: application/json' \
  -d '{"content": "# Updated...", "status": "review"}'
```

### Adding Edge Cases

```bash
curl -X POST http://localhost:3000/api/specs/:id/edge-cases \
  -H 'Content-Type: application/json' \
  -d '{"question": "What happens if...?", "status": "open"}'
```

### Knowledge Base

```bash
# Upload a file
curl -X POST http://localhost:3000/api/documents -F "file=@document.pdf" -F "name=My Doc"

# Search
curl http://localhost:3000/api/search?q=authentication&limit=10

# Analyze text
curl -X POST http://localhost:3000/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"text": "...", "name": "Analysis", "category": "codebase"}'
```

### Shareable Links

Every spec has a public view page. After creating/updating a spec, share the link with the user:
```
/view/{spec_id}
```
This renders a standalone dark-themed page with the full spec, edge cases, and status. No login required.

## Status Values
- **Spec:** draft, review, approved, archived
- **Edge Case:** open, addressed, deferred

## Error Handling
API returns `{ "error": "message" }` with appropriate HTTP status codes (400, 404, 500).

# Tools Reference — System Analyst

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.

> Full API details and methodology are in SKILL.md. This file covers quick reference only.

## ⚠️ IMPORTANT: Spec Hub App

Your **Spec Hub** web application is ALREADY RUNNING on port 3000. It starts automatically via `start.sh`.

- **DO NOT** kill anything on port 3000 — that's YOUR app
- **DO NOT** try to start a new server on port 3000
- The app is accessible to the user via the browser panel (iframe)
- All API endpoints below are served by this app at `http://localhost:3000`
- If you need to build something for the user, deploy it on a DIFFERENT port using PM2

## API Quick Reference

| Resource | Endpoints |
|----------|-----------|
| Specs | `GET/POST /api/specs`, `GET/PUT/DELETE /api/specs/:id` |
| Sections | `POST /api/specs/:id/sections`, `PUT/DELETE /api/specs/:id/sections/:sid` |
| Edge Cases | `POST /api/specs/:id/edge-cases`, `PUT /api/specs/:id/edge-cases/:eid` |
| Review Notes | `POST /api/specs/:id/review-notes` |
| Export | `GET /api/specs/:id/export/(md\|html\|pdf)` |
| Templates | `GET /api/templates`, `POST /api/specs/from-template` |
| Documents | `GET/POST/DELETE /api/documents`, `GET /api/documents/:id` |
| Search | `GET /api/search?q=...&limit=10` |
| Analyze | `POST /api/analyze` |
| Projects | `GET/POST/PUT/DELETE /api/projects` |
| Links | `GET/POST/DELETE /api/links` |
| Config | `GET/PUT /api/config` |
| Analytics | `GET /api/analytics` |

## Status Values
- **Spec:** draft, review, approved, archived
- **Section:** draft, complete, needs-review
- **Edge Case:** open, addressed, deferred

## Error Handling
API returns `{ "error": "message" }` with appropriate HTTP status codes (400, 404, 500). Always check response status before processing.

## Screenshots & File Sharing

### Taking Screenshots
Use Playwright (pre-installed) to capture any website:
```bash
npx playwright screenshot --browser chromium https://example.com /tmp/screenshot.png
```

If Chromium is not installed yet, install it first:
```bash
npx playwright install chromium
```

### Sharing Files & Images with the User
Upload to the Emika API to get a shareable URL:
```bash
# Get your seat token

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.
TOKEN=$(python3 -c "import json; print(json.load(open('/home/node/.openclaw/openclaw.json'))['gateway']['auth']['token'])")

# Upload any file

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.
URL=$(curl -s -X POST "http://162.55.102.58:8080/uploads/seat" \
  -H "X-Seat-Token: $TOKEN" \
  -F "file=@/tmp/screenshot.png" | python3 -c "import sys,json; print(json.load(sys.stdin)['full_url'])")

# Include the URL in your response as markdown image

## CRITICAL: Port 3000 Only
You MUST deploy ONLY on port 3000. Nginx ONLY proxies port 3000 — any other port will NOT be accessible.
If port 3000 is busy: `pm2 delete all` then `pm2 start your-app.js --name app` on port 3000.
NEVER use port 3001, 8080, or any other port. ONLY port 3000.
echo "![Screenshot]($URL)"
```

**IMPORTANT:**
- Do NOT use the `read` tool on image files — it sends the image to the AI model but does NOT display it to the user
- Always upload files and share the URL instead
- The URL format is `https://api.emika.ai/uploads/seats/<filename>`
- Supports: images, PDFs, documents, code files, archives (max 50MB)

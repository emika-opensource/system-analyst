# Tools Reference — System Analyst

> Full API details and methodology are in SKILL.md. This file covers quick reference only.

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


## Browser & Screenshots (Playwright)

Playwright and Chromium are pre-installed. Use them for browsing websites, taking screenshots, scraping content, and testing.

```bash
# Quick screenshot
npx playwright screenshot --full-page https://example.com screenshot.png

# In Node.js
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("https://example.com");
await page.screenshot({ path: "screenshot.png", fullPage: true });
await browser.close();
```

Do NOT install Puppeteer or download Chromium — Playwright is already here and ready to use.


## File & Image Sharing (Upload API)

To share files or images with the user, upload them to the Emika API and include the URL in your response.

```bash
# Upload a file (use your gateway token from openclaw.json)
TOKEN=$(cat /home/node/.openclaw/openclaw.json | grep -o "\"token\":\"[^\"]*" | head -1 | cut -d\" -f4)

curl -s -X POST "http://162.55.102.58:8080/uploads/seat" \
  -H "X-Seat-Token: $TOKEN" \
  -F "file=@/path/to/file.png" | jq -r .full_url
```

The response includes `full_url` — a public URL you can send to the user. Example:
- `https://api.emika.ai/uploads/seats/f231-27bd_abc123def456.png`

### Common workflow: Screenshot → Upload → Share
```bash
# Take screenshot with Playwright
npx playwright screenshot --full-page https://example.com /tmp/screenshot.png

# Upload to API
TOKEN=$(cat /home/node/.openclaw/openclaw.json | grep -o "\"token\":\"[^\"]*" | head -1 | cut -d\" -f4)
URL=$(curl -s -X POST "http://162.55.102.58:8080/uploads/seat" \
  -H "X-Seat-Token: $TOKEN" \
  -F "file=@/tmp/screenshot.png" | jq -r .full_url)

echo "Screenshot: $URL"
# Then include $URL in your response to the user
```

Supported: images (png, jpg, gif, webp), documents (pdf, doc, xlsx), code files, archives. Max 50MB.

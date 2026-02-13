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

# Spec Hub — System Analyst AI Employee

A specification creation and knowledge management platform for the Emika AI Employee platform.

## Features

- **Specification Management** — Create, edit, version, and export specs with rich markdown support
- **Edge Case Analysis** — AI-driven critical thinking with tracked questions and answers
- **Knowledge Base (RAG)** — Upload docs, BM25 search across indexed content
- **Templates** — 8 pre-built spec templates (API, Feature, Architecture, Database, Integration, Migration, Security, Performance)
- **Multi-format Export** — Markdown, styled HTML, and PDF (via print)
- **Self-Review Protocol** — Built-in review notes and quality assurance workflow
- **Project Organization** — Group specs by project with tags
- **Analytics** — Track spec progress, edge case coverage, and activity

## Quick Start

```bash
npm install
node server.js
```

Server runs on port 3000. Data stored in `/home/node/emika/spec-hub/` (or `./data/` fallback).

## Tech Stack

- **Backend:** Express.js, BM25 search, multer (uploads), marked (markdown), pdf-parse
- **Frontend:** Vanilla JS SPA with hash routing
- **Design:** Dark theme (#06060a), DM Sans font, indigo (#6366f1) accent, SVG icons

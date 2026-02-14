const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = fs.existsSync('/home/node/emika') ? '/home/node/emika/spec-hub' : path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(path.join(DATA_DIR, 'uploads'));

const upload = multer({ dest: path.join(DATA_DIR, 'uploads'), limits: { fileSize: 50 * 1024 * 1024 } });

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

// ─── Links (CRUD) ───────────────────────────────────────────────────────────

app.get('/api/links', (req, res) => {
  res.json(loadJSON('links.json', []));
});
app.post('/api/links', (req, res) => {
  const items = loadJSON('links.json', []);
  const item = { id: uid(), ...req.body, createdAt: new Date().toISOString() };
  items.push(item);
  saveJSON('links.json', items);
  res.json(item);
});
app.delete('/api/links/:id', (req, res) => {
  let items = loadJSON('links.json', []);
  items = items.filter(i => i.id !== req.params.id);
  saveJSON('links.json', items);
  res.json({ success: true });
});

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
    status: req.body.status || 'draft',
    version: req.body.version || '0.1.0',
    content: req.body.content || '',
    edgeCases: req.body.edgeCases || [],
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

// Edge Cases
app.post('/api/specs/:id/edge-cases', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });
  if (!spec.edgeCases) spec.edgeCases = [];
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
  const ec = (spec.edgeCases || []).find(e => e.id === req.params.caseId);
  if (!ec) return res.status(404).json({ error: 'Edge case not found' });
  Object.assign(ec, req.body);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json(ec);
});

app.delete('/api/specs/:id/edge-cases/:caseId', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Spec not found' });
  spec.edgeCases = (spec.edgeCases || []).filter(e => e.id !== req.params.caseId);
  spec.updatedAt = new Date().toISOString();
  saveJSON('specs.json', specs);
  res.json({ success: true });
});

// Export
app.get('/api/specs/:id/export/:format', (req, res) => {
  const specs = loadJSON('specs.json', []);
  const spec = specs.find(s => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Not found' });

  const { format } = req.params;

  let md = `---\ntitle: "${spec.title}"\nversion: ${spec.version}\ndate: ${spec.updatedAt || spec.createdAt}\nstatus: ${spec.status}\n---\n\n# ${spec.title}\n\n`;
  if (spec.description) md += `${spec.description}\n\n`;
  if (spec.content) md += `${spec.content}\n\n`;

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
@media print {
  body { background: #fff; color: #000; padding: 20px; }
  h1, h2, h3 { color: #000; }
  code { background: #f0f0f0; }
  pre { background: #f5f5f5; border-color: #ddd; }
  th { background: #f0f0f0; color: #333; }
  th, td { border-color: #ccc; }
}
</style>
</head>
<body>
<div style="margin-bottom: 24px; color: var(--muted); font-size: 0.85rem;">
  Version: ${spec.version} &middot; Status: ${spec.status.toUpperCase()} &middot; Updated: ${new Date(spec.updatedAt || spec.createdAt).toLocaleDateString()}
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
    return res.send(styledHtml + `<script>setTimeout(()=>window.print(),500)</script>`);
  }

  res.status(400).json({ error: 'Invalid format. Use md, html, or pdf.' });
});

// ─── Knowledge Base / Documents ─────────────────────────────────────────────

app.get('/api/documents', (req, res) => {
  res.json(loadJSON('documents.json', []));
});

app.get('/api/documents/:id', (req, res) => {
  const docs = loadJSON('documents.json', []);
  const doc = docs.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
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
  }
  if (hasDb) {
    questions.push('What is the data retention policy?');
    questions.push('How are database migrations handled?');
  }
  if (hasAuth) {
    questions.push('How are tokens stored and refreshed?');
    questions.push('What happens when a session expires mid-operation?');
  }
  if (hasInfra) {
    questions.push('What is the disaster recovery strategy?');
    questions.push('How is the system monitored for failures?');
  }
  questions.push('What are the main failure modes?');
  questions.push('How does this component interact with other parts of the system?');

  res.json({ document: doc, analysisQuestions: questions });
});

// ─── API 404 ────────────────────────────────────────────────────────────────

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ─── SPA fallback ───────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Spec Hub server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

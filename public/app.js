/* ─── Spec Hub — Frontend App ─── */

const API = '';

// ─── State ──────────────────────────────────────────────────────────────────
let state = {
  specs: [],
  projects: [],
  documents: [],
  links: [],
  templates: [],
  analytics: null,
  config: {},
  currentSpec: null,
  specTab: 'sections',
  edgeCaseFilter: 'all',
  specFilter: 'all',
  knowledgeTab: 'docs',
  searchResults: [],
};

// ─── API helpers ────────────────────────────────────────────────────────────
async function api(url, opts = {}) {
  const res = await fetch(API + url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
  });
  return res.json();
}
async function apiUpload(url, formData) {
  const res = await fetch(API + url, { method: 'POST', body: formData });
  return res.json();
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const icons = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 9l6 6 6-6"/></svg>',
  chevRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
  filePdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M10 13H8v4h2v-1.5H9.5V14H10v-.5z" fill="currentColor"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') e.className = v;
    else if (k === 'onclick' || k === 'oninput' || k === 'onchange') e[k] = v;
    else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}
function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}
function statusBadge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}
function renderMd(text) {
  try { return marked.parse(text || ''); } catch { return text || ''; }
}

// ─── Router ─────────────────────────────────────────────────────────────────
function getRoute() {
  const hash = location.hash.slice(1) || 'dashboard';
  const parts = hash.split('/');
  return { page: parts[0], id: parts[1], sub: parts[2] };
}

function navigate(hash) {
  location.hash = hash;
}

window.addEventListener('hashchange', () => render());

// ─── Render ─────────────────────────────────────────────────────────────────
async function render() {
  const route = getRoute();
  const content = $('#content');

  // Update nav
  $$('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === route.page || (route.page === 'spec' && n.dataset.page === 'specs'));
  });

  switch (route.page) {
    case 'dashboard': return renderDashboard(content);
    case 'specs': return renderSpecs(content);
    case 'spec': return renderSpec(content, route.id);
    case 'knowledge': return renderKnowledge(content);
    case 'links': return renderLinks(content);
    case 'templates': return renderTemplates(content);
    case 'analytics': return renderAnalytics(content);
    case 'settings': return renderSettings(content);
    default: return renderDashboard(content);
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
async function renderDashboard(container) {
  const [specs, docs, analytics] = await Promise.all([
    api('/api/specs'),
    api('/api/documents'),
    api('/api/analytics'),
  ]);
  state.specs = specs;
  state.documents = docs;
  state.analytics = analytics;

  const openEdgeCases = [];
  for (const s of specs) {
    for (const ec of (s.edgeCases || [])) {
      if (ec.status === 'open') openEdgeCases.push({ ...ec, specId: s.id, specTitle: s.title });
    }
  }

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">Specification overview and quick actions</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card stat-accent"><div class="stat-value">${analytics.totalSpecs}</div><div class="stat-label">Total Specs</div></div>
      <div class="stat-card"><div class="stat-value">${analytics.byStatus.draft || 0}</div><div class="stat-label">In Draft</div></div>
      <div class="stat-card stat-yellow"><div class="stat-value">${analytics.byStatus.review || 0}</div><div class="stat-label">In Review</div></div>
      <div class="stat-card stat-green"><div class="stat-value">${analytics.byStatus.approved || 0}</div><div class="stat-label">Approved</div></div>
      <div class="stat-card"><div class="stat-value">${analytics.totalDocuments}</div><div class="stat-label">Knowledge Docs</div></div>
    </div>
    <div class="quick-actions">
      <a href="#specs" class="quick-action" onclick="event.preventDefault(); showNewSpecModal()">
        ${icons.plus} New Specification
      </a>
      <a href="#knowledge" class="quick-action">
        ${icons.upload} Upload Document
      </a>
      <a href="#templates" class="quick-action">
        ${icons.template} Browse Templates
      </a>
    </div>
    <div class="two-col-wide">
      <div>
        <div class="card">
          <div class="card-title">Recent Specifications</div>
          <div id="recent-specs"></div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-title">Open Edge Cases <span class="tab-count">${openEdgeCases.length}</span></div>
          <div id="open-edge-cases"></div>
        </div>
      </div>
    </div>
  `;

  const recentEl = $('#recent-specs');
  const recent = [...specs].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 5);
  if (!recent.length) {
    recentEl.innerHTML = '<div class="card-muted" style="padding:16px 0">No specifications yet. Create one to get started.</div>';
  } else {
    recentEl.innerHTML = recent.map(s => `
      <div class="spec-card" style="border:none;padding:10px 0;border-bottom:1px solid var(--border)" onclick="navigate('#spec/${s.id}')">
        <div class="spec-card-left">
          <div class="spec-card-title">${esc(s.title)}</div>
          <div class="spec-card-meta">${statusBadge(s.status)} <span class="badge badge-version">v${s.version}</span> ${timeAgo(s.updatedAt || s.createdAt)}</div>
        </div>
      </div>
    `).join('');
  }

  const ecEl = $('#open-edge-cases');
  if (!openEdgeCases.length) {
    ecEl.innerHTML = '<div class="card-muted" style="padding:16px 0">No open edge cases. Looking good.</div>';
  } else {
    ecEl.innerHTML = openEdgeCases.slice(0, 8).map(ec => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('#spec/${ec.specId}')">
        <div style="display:flex;align-items:flex-start;gap:8px">
          <span class="dot dot-open" style="margin-top:6px;flex-shrink:0"></span>
          <div>
            <div style="font-size:0.85rem;color:var(--white)">${esc(ec.question)}</div>
            <div style="font-size:0.72rem;color:var(--text-dim)">${esc(ec.specTitle)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// ─── Specifications List ────────────────────────────────────────────────────
async function renderSpecs(container) {
  state.specs = await api('/api/specs');
  state.projects = await api('/api/projects');

  const filtered = state.specFilter === 'all' ? state.specs : state.specs.filter(s => s.status === state.specFilter);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Specifications</div>
        <div class="page-subtitle">${state.specs.length} specifications</div>
      </div>
      <button class="btn btn-primary" onclick="showNewSpecModal()">${icons.plus} New Spec</button>
    </div>
    <div class="filter-bar">
      <div class="filter-chip ${state.specFilter === 'all' ? 'active' : ''}" onclick="state.specFilter='all';renderSpecs($('#content'))">All</div>
      <div class="filter-chip ${state.specFilter === 'draft' ? 'active' : ''}" onclick="state.specFilter='draft';renderSpecs($('#content'))">Draft</div>
      <div class="filter-chip ${state.specFilter === 'review' ? 'active' : ''}" onclick="state.specFilter='review';renderSpecs($('#content'))">Review</div>
      <div class="filter-chip ${state.specFilter === 'approved' ? 'active' : ''}" onclick="state.specFilter='approved';renderSpecs($('#content'))">Approved</div>
      <div class="filter-chip ${state.specFilter === 'archived' ? 'active' : ''}" onclick="state.specFilter='archived';renderSpecs($('#content'))">Archived</div>
    </div>
    <div class="spec-grid" id="spec-list"></div>
  `;

  const listEl = $('#spec-list');
  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state-title">No specifications${state.specFilter !== 'all' ? ' with status "' + state.specFilter + '"' : ''}</div><div class="empty-state-desc">Create a new specification to get started</div><button class="btn btn-primary" onclick="showNewSpecModal()">${icons.plus} New Spec</button></div>`;
    return;
  }

  listEl.innerHTML = filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).map(s => {
    const openEC = (s.edgeCases || []).filter(e => e.status === 'open').length;
    const project = state.projects.find(p => p.id === s.projectId);
    return `
      <div class="spec-card" onclick="navigate('#spec/${s.id}')">
        <div class="spec-card-left">
          <div class="spec-card-title">${esc(s.title)}</div>
          <div class="spec-card-meta">
            ${statusBadge(s.status)}
            <span class="badge badge-version">v${s.version}</span>
            ${project ? '<span class="tag">' + esc(project.name) + '</span>' : ''}
            ${(s.tags || []).map(t => '<span class="tag">' + esc(t) + '</span>').join('')}
            <span>${timeAgo(s.updatedAt || s.createdAt)}</span>
          </div>
        </div>
        <div class="spec-card-right">
          <div class="spec-card-stat"><div class="spec-card-stat-val">${(s.sections || []).length}</div><div class="spec-card-stat-label">Sections</div></div>
          <div class="spec-card-stat"><div class="spec-card-stat-val" style="${openEC > 0 ? 'color:var(--red)' : ''}">${openEC}</div><div class="spec-card-stat-label">Open EC</div></div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── New Spec Modal ─────────────────────────────────────────────────────────
async function showNewSpecModal() {
  state.templates = await api('/api/templates');
  state.projects = await api('/api/projects');

  const overlay = el('div', { className: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  const modal = el('div', { className: 'modal' }, `
    <div class="modal-title">New Specification</div>
    <div class="form-group">
      <label class="form-label">Title</label>
      <input class="form-input" id="new-spec-title" placeholder="e.g., User Authentication API Spec">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="new-spec-desc" rows="3" placeholder="Brief description..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Project</label>
      <select class="form-select" id="new-spec-project">
        <option value="">No project</option>
        ${state.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Start from template</label>
      <select class="form-select" id="new-spec-template">
        <option value="">Blank specification</option>
        ${state.templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tags (comma-separated)</label>
      <input class="form-input" id="new-spec-tags" placeholder="e.g., backend, api, v2">
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" onclick="createSpec()">Create Specification</button>
    </div>
  `);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => $('#new-spec-title').focus(), 100);
}

async function createSpec() {
  const title = $('#new-spec-title').value.trim();
  if (!title) return;
  const desc = $('#new-spec-desc').value.trim();
  const projectId = $('#new-spec-project').value;
  const templateId = $('#new-spec-template').value;
  const tags = $('#new-spec-tags').value.split(',').map(t => t.trim()).filter(Boolean);

  let spec;
  if (templateId) {
    spec = await api('/api/specs/from-template', { method: 'POST', body: { title, templateId, projectId: projectId || null, tags } });
  } else {
    spec = await api('/api/specs', { method: 'POST', body: { title, description: desc, projectId: projectId || null, tags } });
  }

  $('.modal-overlay').remove();
  navigate('#spec/' + spec.id);
}

// ─── Spec Detail ────────────────────────────────────────────────────────────
async function renderSpec(container, id) {
  const spec = await api('/api/specs/' + id);
  if (spec.error) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Specification not found</div><a href="#specs" class="btn btn-primary">Back to Specs</a></div>';
    return;
  }
  state.currentSpec = spec;
  state.projects = await api('/api/projects');

  const project = state.projects.find(p => p.id === spec.projectId);
  const openEC = (spec.edgeCases || []).filter(e => e.status === 'open').length;
  const sections = (spec.sections || []).sort((a, b) => a.order - b.order);

  container.innerHTML = `
    <div style="margin-bottom:16px">
      <a href="#specs" class="btn btn-ghost btn-sm">${icons.back} Back to Specifications</a>
    </div>
    <div class="spec-header">
      <div style="flex:1">
        <input class="spec-title-input" value="${esc(spec.title)}" onchange="updateSpecField('${id}', 'title', this.value)">
        <div class="spec-meta">
          ${statusBadge(spec.status)}
          <select class="form-select" style="width:auto;padding:4px 30px 4px 10px;font-size:0.78rem" onchange="updateSpecField('${id}','status',this.value)">
            <option value="draft" ${spec.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="review" ${spec.status === 'review' ? 'selected' : ''}>Review</option>
            <option value="approved" ${spec.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="archived" ${spec.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
          <span class="badge badge-version">v${spec.version}</span>
          <input class="form-input" style="width:80px;padding:4px 8px;font-size:0.78rem;font-family:'JetBrains Mono',monospace" value="${spec.version}" onchange="updateSpecField('${id}','version',this.value)">
          ${project ? '<span class="tag">' + esc(project.name) + '</span>' : ''}
          <span class="card-muted">${timeAgo(spec.updatedAt || spec.createdAt)}</span>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-danger btn-sm" onclick="deleteSpec('${id}')">${icons.trash}</button>
      </div>
    </div>
    <div class="tabs">
      <button class="tab ${state.specTab === 'sections' ? 'active' : ''}" onclick="state.specTab='sections';renderSpec($('#content'),'${id}')">Sections <span class="tab-count">${sections.length}</span></button>
      <button class="tab ${state.specTab === 'edge-cases' ? 'active' : ''}" onclick="state.specTab='edge-cases';renderSpec($('#content'),'${id}')">Edge Cases <span class="tab-count" style="${openEC > 0 ? 'background:var(--red-dim);color:var(--red)' : ''}">${(spec.edgeCases || []).length}</span></button>
      <button class="tab ${state.specTab === 'review-notes' ? 'active' : ''}" onclick="state.specTab='review-notes';renderSpec($('#content'),'${id}')">Review Notes <span class="tab-count">${(spec.reviewNotes || []).length}</span></button>
      <button class="tab ${state.specTab === 'export' ? 'active' : ''}" onclick="state.specTab='export';renderSpec($('#content'),'${id}')">Export</button>
    </div>
    <div id="spec-tab-content"></div>
  `;

  const tabContent = $('#spec-tab-content');
  switch (state.specTab) {
    case 'sections': renderSections(tabContent, spec); break;
    case 'edge-cases': renderEdgeCases(tabContent, spec); break;
    case 'review-notes': renderReviewNotes(tabContent, spec); break;
    case 'export': renderExport(tabContent, spec); break;
  }
}

function renderSections(container, spec) {
  const sections = (spec.sections || []).sort((a, b) => a.order - b.order);
  container.innerHTML = `
    <div id="sections-list">
      ${sections.map((s, i) => sectionCard(spec.id, s, i)).join('')}
    </div>
    <button class="btn" style="margin-top:12px" onclick="addSection('${spec.id}')">${icons.plus} Add Section</button>
  `;
}

function sectionCard(specId, section, index) {
  const expanded = section._expanded;
  return `
    <div class="section-card" data-section-id="${section.id}">
      <div class="section-header" onclick="toggleSection('${specId}','${section.id}')">
        <div class="section-header-left">
          <span class="drag-handle" onclick="event.stopPropagation()">${icons.grip}</span>
          ${expanded ? icons.chevDown : icons.chevRight}
          <span class="section-title-text">${esc(section.title)}</span>
          ${statusBadge(section.status || 'draft')}
        </div>
        <div class="btn-group">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editSectionTitle('${specId}','${section.id}')">${icons.edit}</button>
          <button class="btn btn-ghost btn-sm btn-danger" onclick="event.stopPropagation();deleteSection('${specId}','${section.id}')">${icons.trash}</button>
        </div>
      </div>
      ${expanded ? `
        <div class="section-body">
          <div class="editor-toggle">
            <button class="editor-toggle-btn ${section._editMode !== 'edit' ? 'active' : ''}" onclick="setSectionMode('${specId}','${section.id}','preview')">Preview</button>
            <button class="editor-toggle-btn ${section._editMode === 'edit' ? 'active' : ''}" onclick="setSectionMode('${specId}','${section.id}','edit')">Edit</button>
          </div>
          ${section._editMode === 'edit'
            ? `<textarea class="editor-area" oninput="debounceSaveSection('${specId}','${section.id}',this.value)">${esc(section.content || '')}</textarea>
               <div style="margin-top:8px">
                 <select class="form-select" style="width:auto;padding:4px 30px 4px 10px;font-size:0.78rem" onchange="updateSectionStatus('${specId}','${section.id}',this.value)">
                   <option value="draft" ${section.status === 'draft' ? 'selected' : ''}>Draft</option>
                   <option value="complete" ${section.status === 'complete' ? 'selected' : ''}>Complete</option>
                   <option value="needs-review" ${section.status === 'needs-review' ? 'selected' : ''}>Needs Review</option>
                 </select>
               </div>`
            : `<div class="section-content">${renderMd(section.content)}</div>`
          }
        </div>
      ` : ''}
    </div>
  `;
}

// Section state tracking
const sectionState = {};

function toggleSection(specId, sectionId) {
  sectionState[sectionId] = sectionState[sectionId] || {};
  sectionState[sectionId].expanded = !sectionState[sectionId].expanded;
  refreshSpec(specId);
}

function setSectionMode(specId, sectionId, mode) {
  sectionState[sectionId] = sectionState[sectionId] || {};
  sectionState[sectionId].editMode = mode;
  refreshSpec(specId);
}

async function refreshSpec(specId) {
  const spec = await api('/api/specs/' + specId);
  state.currentSpec = spec;
  // Apply section UI state
  for (const s of spec.sections) {
    const ss = sectionState[s.id];
    if (ss) {
      s._expanded = ss.expanded;
      s._editMode = ss.editMode;
    }
  }
  const tabContent = $('#spec-tab-content');
  if (tabContent) {
    switch (state.specTab) {
      case 'sections': renderSections(tabContent, spec); break;
      case 'edge-cases': renderEdgeCases(tabContent, spec); break;
      case 'review-notes': renderReviewNotes(tabContent, spec); break;
      case 'export': renderExport(tabContent, spec); break;
    }
  }
}

let saveTimers = {};
function debounceSaveSection(specId, sectionId, value) {
  clearTimeout(saveTimers[sectionId]);
  saveTimers[sectionId] = setTimeout(() => {
    api(`/api/specs/${specId}/sections/${sectionId}`, { method: 'PUT', body: { content: value } });
  }, 500);
}

async function updateSectionStatus(specId, sectionId, status) {
  await api(`/api/specs/${specId}/sections/${sectionId}`, { method: 'PUT', body: { status } });
}

async function addSection(specId) {
  const title = prompt('Section title:');
  if (!title) return;
  await api(`/api/specs/${specId}/sections`, { method: 'POST', body: { title } });
  refreshSpec(specId);
}

async function editSectionTitle(specId, sectionId) {
  const spec = state.currentSpec;
  const section = spec.sections.find(s => s.id === sectionId);
  const title = prompt('Section title:', section ? section.title : '');
  if (!title) return;
  await api(`/api/specs/${specId}/sections/${sectionId}`, { method: 'PUT', body: { title } });
  refreshSpec(specId);
}

async function deleteSection(specId, sectionId) {
  if (!confirm('Delete this section?')) return;
  await api(`/api/specs/${specId}/sections/${sectionId}`, { method: 'DELETE' });
  refreshSpec(specId);
}

async function updateSpecField(specId, field, value) {
  await api(`/api/specs/${specId}`, { method: 'PUT', body: { [field]: value } });
}

async function deleteSpec(specId) {
  if (!confirm('Delete this specification?')) return;
  await api(`/api/specs/${specId}`, { method: 'DELETE' });
  navigate('#specs');
}

// ─── Edge Cases Tab ─────────────────────────────────────────────────────────
function renderEdgeCases(container, spec) {
  const ecs = spec.edgeCases || [];
  const filtered = state.edgeCaseFilter === 'all' ? ecs : ecs.filter(e => e.status === state.edgeCaseFilter);

  container.innerHTML = `
    <div class="edge-case-filter">
      <div class="filter-chip ${state.edgeCaseFilter === 'all' ? 'active' : ''}" onclick="state.edgeCaseFilter='all';refreshSpec('${spec.id}')">All <span class="tab-count">${ecs.length}</span></div>
      <div class="filter-chip ${state.edgeCaseFilter === 'open' ? 'active' : ''}" onclick="state.edgeCaseFilter='open';refreshSpec('${spec.id}')">Open <span class="tab-count">${ecs.filter(e=>e.status==='open').length}</span></div>
      <div class="filter-chip ${state.edgeCaseFilter === 'addressed' ? 'active' : ''}" onclick="state.edgeCaseFilter='addressed';refreshSpec('${spec.id}')">Addressed <span class="tab-count">${ecs.filter(e=>e.status==='addressed').length}</span></div>
      <div class="filter-chip ${state.edgeCaseFilter === 'deferred' ? 'active' : ''}" onclick="state.edgeCaseFilter='deferred';refreshSpec('${spec.id}')">Deferred <span class="tab-count">${ecs.filter(e=>e.status==='deferred').length}</span></div>
    </div>
    <div id="edge-cases-list">
      ${filtered.map(ec => `
        <div class="edge-case-item">
          <div class="edge-case-question">
            <span class="dot dot-${ec.status}"></span>
            <span>${esc(ec.question)}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
            ${statusBadge(ec.status)}
            <select class="form-select" style="width:auto;padding:3px 28px 3px 8px;font-size:0.72rem" onchange="updateEdgeCase('${spec.id}','${ec.id}',{status:this.value})">
              <option value="open" ${ec.status === 'open' ? 'selected' : ''}>Open</option>
              <option value="addressed" ${ec.status === 'addressed' ? 'selected' : ''}>Addressed</option>
              <option value="deferred" ${ec.status === 'deferred' ? 'selected' : ''}>Deferred</option>
            </select>
          </div>
          <div class="edge-case-answer">
            ${ec.answer ? renderMd(ec.answer) : ''}
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="editEdgeCaseAnswer('${spec.id}','${ec.id}')">${icons.edit} ${ec.answer ? 'Edit Answer' : 'Add Answer'}</button>
        </div>
      `).join('')}
    </div>
    <button class="btn" style="margin-top:12px" onclick="addEdgeCase('${spec.id}')">${icons.plus} Add Edge Case</button>
  `;
}

async function addEdgeCase(specId) {
  const question = prompt('Edge case question:');
  if (!question) return;
  await api(`/api/specs/${specId}/edge-cases`, { method: 'POST', body: { question } });
  refreshSpec(specId);
}

async function updateEdgeCase(specId, caseId, data) {
  await api(`/api/specs/${specId}/edge-cases/${caseId}`, { method: 'PUT', body: data });
  refreshSpec(specId);
}

async function editEdgeCaseAnswer(specId, caseId) {
  const spec = state.currentSpec;
  const ec = spec.edgeCases.find(e => e.id === caseId);

  const overlay = el('div', { className: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  const modal = el('div', { className: 'modal' }, `
    <div class="modal-title">Edge Case Answer</div>
    <div style="margin-bottom:12px;color:var(--white);font-weight:500">${esc(ec.question)}</div>
    <div class="form-group">
      <label class="form-label">Answer (Markdown)</label>
      <textarea class="form-textarea" id="ec-answer" rows="6" style="min-height:150px">${esc(ec.answer || '')}</textarea>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEdgeCaseAnswer('${specId}','${caseId}')">Save</button>
    </div>
  `);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function saveEdgeCaseAnswer(specId, caseId) {
  const answer = $('#ec-answer').value;
  await api(`/api/specs/${specId}/edge-cases/${caseId}`, { method: 'PUT', body: { answer, status: answer.trim() ? 'addressed' : 'open' } });
  $('.modal-overlay').remove();
  refreshSpec(specId);
}

// ─── Review Notes Tab ───────────────────────────────────────────────────────
function renderReviewNotes(container, spec) {
  const notes = (spec.reviewNotes || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  container.innerHTML = `
    <div class="review-timeline">
      ${notes.map(n => `
        <div class="review-note">
          <div class="review-note-header">
            <span class="review-note-type ${n.type}">${n.type.replace('-', ' ')}</span>
            <span class="review-note-time">${timeAgo(n.createdAt)}</span>
          </div>
          <div class="review-note-content">${renderMd(n.content)}</div>
        </div>
      `).join('')}
    </div>
    <div class="card" style="margin-top:16px">
      <div class="form-group">
        <label class="form-label">Add Review Note</label>
        <textarea class="form-textarea" id="review-note-content" rows="3" placeholder="Add a review note, question, or feedback..."></textarea>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <select class="form-select" id="review-note-type" style="width:auto">
          <option value="user-feedback">User Feedback</option>
          <option value="self-review">Self Review</option>
          <option value="question">Question</option>
        </select>
        <button class="btn btn-primary" onclick="addReviewNote('${spec.id}')">Add Note</button>
      </div>
    </div>
  `;
}

async function addReviewNote(specId) {
  const content = $('#review-note-content').value.trim();
  if (!content) return;
  const type = $('#review-note-type').value;
  await api(`/api/specs/${specId}/review-notes`, { method: 'POST', body: { content, type } });
  refreshSpec(specId);
}

// ─── Export Tab ─────────────────────────────────────────────────────────────
function renderExport(container, spec) {
  const sections = (spec.sections || []).sort((a, b) => a.order - b.order);

  let md = `# ${spec.title}\n\n`;
  if (spec.description) md += `${spec.description}\n\n`;
  md += `## Table of Contents\n\n`;
  sections.forEach((s, i) => { md += `${i + 1}. ${s.title}\n`; });
  md += `\n`;
  for (const s of sections) { md += `## ${s.title}\n\n${s.content || '*No content*'}\n\n`; }
  if (spec.edgeCases && spec.edgeCases.length) {
    md += `## Edge Cases\n\n`;
    for (const ec of spec.edgeCases) {
      md += `### [${ec.status.toUpperCase()}] ${ec.question}\n\n`;
      if (ec.answer) md += `${ec.answer}\n\n`;
    }
  }

  container.innerHTML = `
    <div class="export-buttons">
      <a href="/api/specs/${spec.id}/export/md" download class="btn">${icons.download} Markdown (.md)</a>
      <a href="/api/specs/${spec.id}/export/html" download class="btn">${icons.download} HTML (.html)</a>
      <a href="/api/specs/${spec.id}/export/pdf" target="_blank" class="btn">${icons.printer} PDF (Print)</a>
    </div>
    <div class="export-preview">
      ${renderMd(md)}
    </div>
  `;
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────
async function renderKnowledge(container) {
  state.documents = await api('/api/documents');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Knowledge Base</div>
        <div class="page-subtitle">${state.documents.length} documents indexed</div>
      </div>
    </div>
    <div class="tabs" style="border-bottom:1px solid var(--border);margin-bottom:20px">
      <button class="tab ${state.knowledgeTab === 'docs' ? 'active' : ''}" onclick="state.knowledgeTab='docs';renderKnowledge($('#content'))">Documents</button>
      <button class="tab ${state.knowledgeTab === 'search' ? 'active' : ''}" onclick="state.knowledgeTab='search';renderKnowledge($('#content'))">Search</button>
      <button class="tab ${state.knowledgeTab === 'analyze' ? 'active' : ''}" onclick="state.knowledgeTab='analyze';renderKnowledge($('#content'))">Analyze</button>
    </div>
    <div id="knowledge-content"></div>
  `;

  const kc = $('#knowledge-content');
  switch (state.knowledgeTab) {
    case 'docs': renderDocs(kc); break;
    case 'search': renderSearch(kc); break;
    case 'analyze': renderAnalyze(kc); break;
  }
}

function renderDocs(container) {
  container.innerHTML = `
    <div class="dropzone" id="upload-zone">
      <input type="file" id="file-input" accept=".pdf,.md,.txt,.html,.json,.js,.ts,.py,.yaml,.yml,.csv">
      ${icons.upload}
      <div class="dropzone-text" style="margin-top:12px">
        <strong>Drop files here</strong> or click to upload<br>
        <span style="font-size:0.78rem">Supports PDF, Markdown, TXT, HTML, JSON, code files</span>
      </div>
    </div>
    <div class="form-group" style="display:flex;gap:10px">
      <select class="form-select" id="upload-category" style="width:auto">
        <option value="other">Category...</option>
        <option value="architecture">Architecture</option>
        <option value="requirements">Requirements</option>
        <option value="api-docs">API Docs</option>
        <option value="codebase">Codebase</option>
        <option value="meeting-notes">Meeting Notes</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="doc-grid">
      ${state.documents.map(d => `
        <div class="doc-card" onclick="viewDocument('${d.id}')">
          <div class="doc-card-header">
            <span class="doc-icon">${d.type === 'pdf' ? icons.filePdf : icons.file}</span>
            <span class="doc-name">${esc(d.name)}</span>
          </div>
          <div class="doc-meta">
            <span class="category-badge cat-${d.category || 'other'}">${d.category || 'other'}</span>
            <span>${d.chunkCount} chunks</span>
            <span>${timeAgo(d.uploadedAt)}</span>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-ghost btn-sm btn-danger" onclick="event.stopPropagation();deleteDocument('${d.id}')">${icons.trash}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Upload handlers
  const zone = $('#upload-zone');
  const input = $('#file-input');
  zone.onclick = () => input.click();
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = () => zone.classList.remove('dragover');
  zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove('dragover'); uploadFiles(e.dataTransfer.files); };
  input.onchange = () => { if (input.files.length) uploadFiles(input.files); };
}

async function uploadFiles(files) {
  const category = $('#upload-category').value;
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('name', file.name);
    await apiUpload('/api/documents', fd);
  }
  renderKnowledge($('#content'));
}

async function deleteDocument(id) {
  if (!confirm('Delete this document and its chunks?')) return;
  await api(`/api/documents/${id}`, { method: 'DELETE' });
  renderKnowledge($('#content'));
}

async function viewDocument(id) {
  const doc = await api(`/api/documents/${id}`);
  const overlay = el('div', { className: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  const modal = el('div', { className: 'modal', style: 'max-width:700px' }, `
    <div class="modal-title">${esc(doc.name)}</div>
    <div style="margin-bottom:16px">
      <span class="category-badge cat-${doc.category || 'other'}">${doc.category || 'other'}</span>
      <span class="card-muted" style="margin-left:8px">${doc.chunkCount} chunks &middot; ${(doc.size / 1024).toFixed(1)} KB</span>
    </div>
    <div style="max-height:400px;overflow-y:auto;background:var(--bg);border-radius:var(--radius);padding:16px;font-size:0.82rem;line-height:1.6">
      ${(doc.chunks || []).map((c, i) => `<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)"><span style="color:var(--accent);font-size:0.7rem">Chunk ${i + 1}</span><br>${esc(c.content)}</div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="this.closest('.modal-overlay').remove()">Close</button>
    </div>
  `);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function renderSearch(container) {
  container.innerHTML = `
    <div class="search-bar">
      <input class="search-input" id="kb-search-input" placeholder="Search knowledge base..." onkeydown="if(event.key==='Enter')doSearch()">
      <button class="btn btn-primary" onclick="doSearch()">${icons.search} Search</button>
    </div>
    <div id="search-results">
      ${state.searchResults.map(r => `
        <div class="search-result">
          <div class="search-result-score">
            <div class="score-bar"><div class="score-bar-fill" style="width:${Math.min(100, r.score * 10)}%"></div></div>
            <span class="score-value">${r.score}</span>
          </div>
          <div class="search-result-content">${esc(r.content)}</div>
          <div class="search-result-source">${esc(r.documentName)} &middot; ${r.documentCategory}</div>
        </div>
      `).join('')}
    </div>
  `;
}

async function doSearch() {
  const q = $('#kb-search-input').value.trim();
  if (!q) return;
  state.searchResults = await api(`/api/search?q=${encodeURIComponent(q)}&limit=10`);
  renderSearch($('#knowledge-content'));
}

function renderAnalyze(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title">Analyze Text</div>
      <div class="card-muted" style="margin-bottom:16px">Paste code, meeting notes, or any text for analysis. It will be indexed and the system will generate relevant questions.</div>
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="analyze-name" placeholder="e.g., Auth service code, Sprint planning notes">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="analyze-category">
          <option value="codebase">Codebase</option>
          <option value="meeting-notes">Meeting Notes</option>
          <option value="requirements">Requirements</option>
          <option value="architecture">Architecture</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea class="analyze-area" id="analyze-text" rows="10" placeholder="Paste your text here..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="doAnalyze()">Analyze</button>
    </div>
    <div id="analyze-results"></div>
  `;
}

async function doAnalyze() {
  const name = $('#analyze-name').value.trim() || 'Analysis Input';
  const text = $('#analyze-text').value.trim();
  const category = $('#analyze-category').value;
  if (!text) return;

  const result = await api('/api/analyze', { method: 'POST', body: { text, name, category } });
  const resultsEl = $('#analyze-results');
  resultsEl.innerHTML = `
    <div class="card" style="margin-top:16px">
      <div class="card-title">Analysis Questions</div>
      <div class="card-muted" style="margin-bottom:12px">Document indexed as "${esc(result.document.name)}" (${result.document.chunkCount} chunks)</div>
      ${result.analysisQuestions.map(q => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
          <span class="dot dot-open" style="margin-top:6px;flex-shrink:0"></span>
          <span style="font-size:0.88rem">${esc(q)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Links ──────────────────────────────────────────────────────────────────
async function renderLinks(container) {
  state.links = await api('/api/links');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Reference Links</div>
        <div class="page-subtitle">${state.links.length} links</div>
      </div>
      <button class="btn btn-primary" onclick="showAddLinkModal()">${icons.plus} Add Link</button>
    </div>
    <div class="link-grid">
      ${state.links.map(l => `
        <div class="link-card">
          <div class="link-card-title"><a href="${esc(l.url)}" target="_blank">${esc(l.title)} ${icons.external}</a></div>
          ${l.description ? `<div class="link-card-desc">${esc(l.description)}</div>` : ''}
          <div class="link-card-meta">
            <span class="category-badge cat-${(l.category || 'other').replace(/\s+/g, '-')}">${l.category || 'other'}</span>
            <span class="card-muted">${timeAgo(l.addedAt)}</span>
            <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteLink('${l.id}')">${icons.trash}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function showAddLinkModal() {
  const overlay = el('div', { className: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  const modal = el('div', { className: 'modal' }, `
    <div class="modal-title">Add Reference Link</div>
    <div class="form-group">
      <label class="form-label">Title</label>
      <input class="form-input" id="link-title" placeholder="e.g., API Documentation">
    </div>
    <div class="form-group">
      <label class="form-label">URL</label>
      <input class="form-input" id="link-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="link-desc" rows="2" placeholder="Brief description..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <select class="form-select" id="link-category">
        <option value="architecture">Architecture</option>
        <option value="api-docs">API Docs</option>
        <option value="requirements">Requirements</option>
        <option value="design">Design</option>
        <option value="reference">Reference</option>
        <option value="tools">Tools</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" onclick="addLink()">Add Link</button>
    </div>
  `);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function addLink() {
  const title = $('#link-title').value.trim();
  const url = $('#link-url').value.trim();
  if (!title || !url) return;
  await api('/api/links', { method: 'POST', body: {
    title, url,
    description: $('#link-desc').value.trim(),
    category: $('#link-category').value,
    tags: [],
    addedAt: new Date().toISOString()
  }});
  $('.modal-overlay').remove();
  renderLinks($('#content'));
}

async function deleteLink(id) {
  if (!confirm('Delete this link?')) return;
  await api(`/api/links/${id}`, { method: 'DELETE' });
  renderLinks($('#content'));
}

// ─── Templates ──────────────────────────────────────────────────────────────
async function renderTemplates(container) {
  state.templates = await api('/api/templates');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Spec Templates</div>
        <div class="page-subtitle">${state.templates.length} templates available</div>
      </div>
    </div>
    <div class="template-grid">
      ${state.templates.map(t => `
        <div class="template-card">
          <div class="template-name">${esc(t.name)}</div>
          <div class="template-desc">${esc(t.description)}</div>
          <div class="template-meta">
            <span>${t.sections.length} sections</span>
            <span>${t.edgeCasePrompts.length} edge case prompts</span>
          </div>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="previewTemplate('${t.id}')">Preview</button>
            <button class="btn btn-primary btn-sm" onclick="useTemplate('${t.id}')">Use Template</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function previewTemplate(id) {
  const t = state.templates.find(x => x.id === id);
  if (!t) return;

  const overlay = el('div', { className: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  const modal = el('div', { className: 'modal', style: 'max-width:700px' }, `
    <div class="modal-title">${esc(t.name)}</div>
    <div class="card-muted" style="margin-bottom:16px">${esc(t.description)}</div>
    <h4 style="color:var(--white);font-size:0.9rem;margin-bottom:12px">Sections (${t.sections.length})</h4>
    ${t.sections.map(s => `
      <div style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:var(--radius)">
        <div style="font-weight:600;color:var(--white);margin-bottom:6px">${esc(s.title)}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px">Prompt Questions:</div>
        ${s.promptQuestions.map(q => `<div style="font-size:0.82rem;color:var(--text);padding:2px 0">- ${esc(q)}</div>`).join('')}
      </div>
    `).join('')}
    <h4 style="color:var(--white);font-size:0.9rem;margin:16px 0 12px">Edge Case Prompts (${t.edgeCasePrompts.length})</h4>
    ${t.edgeCasePrompts.map(q => `<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><span class="dot dot-open" style="margin-top:6px;flex-shrink:0"></span><span style="font-size:0.85rem">${esc(q)}</span></div>`).join('')}
    <div class="modal-actions">
      <button class="btn" onclick="this.closest('.modal-overlay').remove()">Close</button>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove();useTemplate('${id}')">Use Template</button>
    </div>
  `);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function useTemplate(id) {
  const t = state.templates.find(x => x.id === id);
  const title = prompt('Specification title:', t.name + ' - New');
  if (!title) return;
  const spec = await api('/api/specs/from-template', { method: 'POST', body: { title, templateId: id } });
  navigate('#spec/' + spec.id);
}

// ─── Analytics ──────────────────────────────────────────────────────────────
async function renderAnalytics(container) {
  const analytics = await api('/api/analytics');

  const maxStatus = Math.max(analytics.byStatus.draft || 0, analytics.byStatus.review || 0, analytics.byStatus.approved || 0, analytics.byStatus.archived || 0, 1);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Analytics</div>
        <div class="page-subtitle">Specification metrics and insights</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card stat-accent"><div class="stat-value">${analytics.totalSpecs}</div><div class="stat-label">Total Specs</div></div>
      <div class="stat-card"><div class="stat-value">${analytics.avgSections}</div><div class="stat-label">Avg Sections</div></div>
      <div class="stat-card"><div class="stat-value">${analytics.totalEdgeCases}</div><div class="stat-label">Edge Cases</div></div>
      <div class="stat-card stat-green"><div class="stat-value">${analytics.edgeCaseCoverage}%</div><div class="stat-label">EC Coverage</div></div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="chart-title">Specs by Status</div>
        <div class="bar-chart">
          ${['draft', 'review', 'approved', 'archived'].map(s => `
            <div class="bar-wrapper">
              <div class="bar-value">${analytics.byStatus[s] || 0}</div>
              <div class="bar" style="height:${((analytics.byStatus[s] || 0) / maxStatus) * 120}px;background:var(--${s === 'draft' ? 'text-muted' : s === 'review' ? 'yellow' : s === 'approved' ? 'green' : 'text-dim'})"></div>
              <div class="bar-label">${s}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="chart-title">Edge Case Coverage</div>
        <div style="display:flex;align-items:center;gap:20px;padding:20px 0">
          <div style="position:relative;width:120px;height:120px">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface3)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--green)" stroke-width="10"
                stroke-dasharray="${analytics.edgeCaseCoverage * 3.14} 314"
                stroke-linecap="round" transform="rotate(-90 60 60)"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;color:var(--white)">${analytics.edgeCaseCoverage}%</div>
          </div>
          <div>
            <div style="font-size:0.85rem;margin-bottom:4px"><span style="color:var(--green)">Addressed:</span> ${analytics.addressedEdgeCases}</div>
            <div style="font-size:0.85rem"><span style="color:var(--red)">Open:</span> ${analytics.openEdgeCases}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="chart-title">Activity (Last 30 Days)</div>
      <div class="activity-chart">
        ${analytics.activity.map(a => {
          const maxA = Math.max(...analytics.activity.map(x => x.count), 1);
          return `<div class="activity-bar" style="height:${Math.max(2, (a.count / maxA) * 70)}px" title="${a.date}: ${a.count}"></div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ─── Settings ───────────────────────────────────────────────────────────────
async function renderSettings(container) {
  const config = await api('/api/config');
  state.projects = await api('/api/projects');

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Settings</div>
        <div class="page-subtitle">Configuration and preferences</div>
      </div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-title">General</div>
        <div class="form-group">
          <label class="form-label">Company Name</label>
          <input class="form-input" id="cfg-company" value="${esc(config.companyName || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Default Tech Stack (comma-separated)</label>
          <input class="form-input" id="cfg-stack" value="${esc((config.defaultTechStack || []).join(', '))}">
        </div>
        <div class="form-group">
          <label class="form-label">Minimum Sections for Review</label>
          <input class="form-input" type="number" id="cfg-minsections" value="${config.reviewRequirements?.minimumSections || 3}">
        </div>
        <button class="btn btn-primary" onclick="saveConfig()">Save Settings</button>
      </div>
      <div class="card">
        <div class="card-title">Projects</div>
        <div id="projects-list">
          ${state.projects.map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:500;color:var(--white)">${esc(p.name)}</div>
                <div class="card-muted">${esc(p.description || '')}</div>
              </div>
              <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteProject('${p.id}')">${icons.trash}</button>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <input class="form-input" id="new-project-name" placeholder="Project name" style="flex:1">
          <button class="btn btn-primary" onclick="addProject()">Add</button>
        </div>
      </div>
    </div>
  `;
}

async function saveConfig() {
  await api('/api/config', { method: 'PUT', body: {
    companyName: $('#cfg-company').value,
    defaultTechStack: $('#cfg-stack').value.split(',').map(t => t.trim()).filter(Boolean),
    reviewRequirements: {
      requireAllEdgeCasesAddressed: true,
      minimumSections: parseInt($('#cfg-minsections').value) || 3
    }
  }});
  alert('Settings saved');
}

async function addProject() {
  const name = $('#new-project-name').value.trim();
  if (!name) return;
  await api('/api/projects', { method: 'POST', body: { name, description: '', techStack: [], architecture: '', links: [] } });
  renderSettings($('#content'));
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  await api(`/api/projects/${id}`, { method: 'DELETE' });
  renderSettings($('#content'));
}

// ─── Utilities ──────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Init ───────────────────────────────────────────────────────────────────
render();

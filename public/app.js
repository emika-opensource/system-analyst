/* ─── Spec Hub — Kanban + Fullscreen Editor ──────────────────────────────── */

const API = '';
const STATUSES = [
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'archived', label: 'Archived' }
];

// ─── State ──────────────────────────────────────────────────────────────────

const state = {
  view: 'kanban',        // kanban | editor | kb | links | settings
  specs: [],
  documents: [],
  links: [],
  searchResults: null,
  editingSpec: null,
  editorTab: 'content',  // content | edgecases | export
  editorMode: 'edit',    // edit | preview | split
  saveTimer: null,
  saveStatus: '',
  config: {}
};

// ─── Icons (SVG strings) ────────────────────────────────────────────────────

const icons = {
  kanban: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  back: '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  chevDown: '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  fileText: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  alertCircle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  code: '<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  bold: '<svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>',
  italic: '<svg viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>',
  list: '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  listOrdered: '<svg viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
  quote: '<svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  table: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
  externalLink: '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') e.className = v;
      else if (k === 'innerHTML') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    }
  }
  for (const c of children) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  }
  return e;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function statusLabel(s) {
  const m = { draft: 'Draft', review: 'In Review', approved: 'Approved', archived: 'Archived' };
  return m[s] || s;
}

function statusBadgeClass(s) {
  return 'kanban-card-badge badge-' + s;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

let toastContainer;
function toast(msg, type = 'info') {
  if (!toastContainer) {
    toastContainer = el('div', { className: 'toast-container' });
    document.body.appendChild(toastContainer);
  }
  const t = el('div', { className: `toast ${type}` }, msg);
  toastContainer.appendChild(t);
  setTimeout(() => { t.remove(); }, 3000);
}

// ─── Data Loading ───────────────────────────────────────────────────────────

async function loadSpecs() {
  try { state.specs = await api('GET', '/api/specs'); } catch { state.specs = []; }
}
async function loadDocuments() {
  try { state.documents = await api('GET', '/api/documents'); } catch { state.documents = []; }
}
async function loadLinks() {
  try { state.links = await api('GET', '/api/links'); } catch { state.links = []; }
}

// ─── Render ─────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (state.view === 'editor' && state.editingSpec) {
    app.appendChild(renderEditor());
  } else {
    app.appendChild(renderSidebar());
    app.appendChild(renderMain());
  }
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function renderSidebar() {
  const nav = el('nav', { className: 'sidebar-nav' },
    navItem('kanban', icons.kanban, 'Specs'),
    navItem('kb', icons.book, 'Knowledge Base'),
    navItem('links', icons.link, 'Links')
  );

  const title = state.config.appTitle || 'Spec Hub';
  const accentColor = state.config.accentColor || '#6366f1';

  const logo = el('div', { className: 'sidebar-logo' });
  const logoIcon = el('div', { className: 'sidebar-logo-icon', style: { background: accentColor } });
  logoIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
  logo.appendChild(logoIcon);
  logo.appendChild(el('div', { className: 'sidebar-logo-text' },
    el('h1', null, title),
    el('span', null, state.config.appSubtitle || 'Specification Manager')
  ));

  const settingsBtn = el('button', {
    className: `nav-item settings-nav${state.view === 'settings' ? ' active' : ''}`,
    innerHTML: icons.settings + '<span>Settings</span>',
    onClick: () => { state.view = 'settings'; render(); }
  });

  return el('aside', { className: 'sidebar' },
    logo,
    nav,
    el('div', { className: 'sidebar-bottom' },
      settingsBtn,
      el('div', { className: 'sidebar-footer' }, `${state.specs.length} specs`)
    )
  );
}

function navItem(view, icon, label) {
  return el('button', {
    className: `nav-item${state.view === view ? ' active' : ''}`,
    innerHTML: icon + `<span>${label}</span>`,
    onClick: () => { state.view = view; render(); }
  });
}

// ─── Main Area ──────────────────────────────────────────────────────────────

function renderMain() {
  const main = el('div', { className: 'main' });
  if (state.view === 'kanban') {
    main.appendChild(renderKanbanTopbar());
    main.appendChild(renderKanban());
  } else if (state.view === 'kb') {
    main.appendChild(renderTopbar('Knowledge Base'));
    main.appendChild(renderKB());
  } else if (state.view === 'links') {
    main.appendChild(renderTopbar('Links'));
    main.appendChild(renderLinksView());
  } else if (state.view === 'settings') {
    main.appendChild(renderTopbar('Settings'));
    main.appendChild(renderSettings());
  }
  return main;
}

function renderTopbar(title, actions) {
  return el('div', { className: 'topbar' },
    el('div', { className: 'topbar-title' }, title),
    actions || el('div')
  );
}

// ─── Kanban ─────────────────────────────────────────────────────────────────

function renderKanbanTopbar() {
  const actions = el('div', { className: 'topbar-actions' },
    el('button', {
      className: 'btn btn-primary',
      innerHTML: icons.plus + ' New Spec',
      onClick: showNewSpecModal
    })
  );
  return el('div', { className: 'topbar' },
    el('div', { className: 'topbar-title' }, 'Specifications'),
    actions
  );
}

function renderKanban() {
  const board = el('div', { className: 'kanban' });
  for (const status of STATUSES) {
    const specs = state.specs.filter(s => s.status === status.key);
    const col = el('div', { className: 'kanban-column' });

    const header = el('div', { className: 'kanban-column-header' },
      el('div', { className: 'kanban-column-title' },
        statusLabel(status.key),
        el('span', { className: 'kanban-column-count' }, String(specs.length))
      )
    );
    col.appendChild(header);

    const body = el('div', { className: 'kanban-column-body' });
    body.dataset.status = status.key;

    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('drag-over');
    });
    body.addEventListener('dragleave', () => {
      body.classList.remove('drag-over');
    });
    body.addEventListener('drop', async (e) => {
      e.preventDefault();
      body.classList.remove('drag-over');
      const specId = e.dataTransfer.getData('text/plain');
      if (!specId) return;
      try {
        await api('PUT', `/api/specs/${specId}`, { status: status.key });
        await loadSpecs();
        render();
        toast(`Moved to ${statusLabel(status.key)}`, 'success');
      } catch { toast('Failed to move spec', 'error'); }
    });

    if (specs.length === 0) {
      body.appendChild(el('div', { className: 'kanban-empty' }, 'No specs'));
    } else {
      for (const spec of specs.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))) {
        body.appendChild(renderKanbanCard(spec));
      }
    }

    col.appendChild(body);
    board.appendChild(col);
  }
  return board;
}

function renderKanbanCard(spec) {
  const ecCount = (spec.edgeCases || []).length;
  const card = el('div', {
    className: 'kanban-card',
    draggable: 'true',
    onClick: () => openEditor(spec.id)
  });
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', spec.id);
    card.classList.add('dragging');
    setTimeout(() => card.classList.remove('dragging'), 0);
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  card.appendChild(el('div', { className: 'kanban-card-title' }, spec.title));
  if (spec.description) {
    card.appendChild(el('div', { className: 'kanban-card-desc' }, spec.description));
  }

  const meta = el('div', { className: 'kanban-card-meta' });
  meta.appendChild(el('span', { className: statusBadgeClass(spec.status) }, statusLabel(spec.status)));

  const info = el('div', { className: 'kanban-card-info' });
  if (ecCount > 0) {
    info.appendChild(el('span', { innerHTML: icons.alertCircle + ` ${ecCount}` }));
  }
  info.appendChild(el('span', { innerHTML: icons.clock + ` ${timeAgo(spec.updatedAt || spec.createdAt)}` }));
  meta.appendChild(info);

  card.appendChild(meta);
  return card;
}

// ─── New Spec Modal ─────────────────────────────────────────────────────────

function showNewSpecModal() {
  const overlay = el('div', { className: 'modal-overlay' });
  const modal = el('div', { className: 'modal' });
  modal.appendChild(el('h2', null, 'New Specification'));

  const titleField = el('div', { className: 'modal-field' },
    el('label', null, 'Title'),
    el('input', { type: 'text', placeholder: 'e.g. Payment Integration Spec', id: 'new-spec-title' })
  );
  const descField = el('div', { className: 'modal-field' },
    el('label', null, 'Description'),
    el('textarea', { placeholder: 'Brief description...', id: 'new-spec-desc' })
  );

  const actions = el('div', { className: 'modal-actions' },
    el('button', { className: 'btn', onClick: () => overlay.remove() }, 'Cancel'),
    el('button', {
      className: 'btn btn-primary',
      onClick: async () => {
        const title = document.getElementById('new-spec-title').value.trim();
        if (!title) { toast('Title is required', 'error'); return; }
        const desc = document.getElementById('new-spec-desc').value.trim();
        try {
          const spec = await api('POST', '/api/specs', { title, description: desc });
          overlay.remove();
          await loadSpecs();
          openEditor(spec.id);
          toast('Spec created', 'success');
        } catch { toast('Failed to create spec', 'error'); }
      }
    }, 'Create')
  );

  modal.appendChild(titleField);
  modal.appendChild(descField);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('new-spec-title').focus(), 50);
}

// ─── Editor ─────────────────────────────────────────────────────────────────

async function openEditor(specId) {
  try {
    state.editingSpec = await api('GET', `/api/specs/${specId}`);
    state.view = 'editor';
    state.editorTab = 'content';
    state.editorMode = 'edit';
    state.saveStatus = '';
    render();
  } catch { toast('Failed to load spec', 'error'); }
}

function renderEditor() {
  const spec = state.editingSpec;
  const view = el('div', { className: 'editor-view' });

  // Top bar
  const topbar = el('div', { className: 'editor-topbar' });
  topbar.appendChild(el('button', {
    className: 'btn-icon',
    innerHTML: icons.back,
    onClick: async () => {
      await loadSpecs();
      state.view = 'kanban';
      state.editingSpec = null;
      render();
    }
  }));

  const titleInput = el('input', {
    className: 'editor-title-input',
    value: spec.title,
    placeholder: 'Spec title...'
  });
  titleInput.addEventListener('input', () => {
    spec.title = titleInput.value;
    autoSave();
  });
  topbar.appendChild(titleInput);

  topbar.appendChild(el('span', { className: 'version-badge' }, `v${spec.version}`));
  topbar.appendChild(renderStatusSelect(spec));

  const deleteBtn = el('button', {
    className: 'btn btn-danger btn-sm',
    innerHTML: icons.trash + ' Delete',
    onClick: () => confirmDeleteSpec(spec.id)
  });
  topbar.appendChild(deleteBtn);

  view.appendChild(topbar);

  // Description (editable)
  const descInput = el('textarea', {
    className: 'editor-desc-input',
    value: spec.description || '',
    placeholder: 'Add a brief description...',
    rows: '2'
  });
  descInput.value = spec.description || '';
  descInput.addEventListener('input', () => {
    spec.description = descInput.value;
    autoSave();
  });
  view.appendChild(descInput);

  // Tabs
  const tabs = el('div', { className: 'editor-tabs' });
  for (const tab of [
    { key: 'content', label: 'Content' },
    { key: 'edgecases', label: `Edge Cases (${(spec.edgeCases || []).length})` },
    { key: 'export', label: 'Export' }
  ]) {
    tabs.appendChild(el('button', {
      className: `editor-tab${state.editorTab === tab.key ? ' active' : ''}`,
      onClick: () => { state.editorTab = tab.key; render(); }
    }, tab.label));
  }
  view.appendChild(tabs);

  // Body
  const body = el('div', { className: 'editor-body' });
  if (state.editorTab === 'content') {
    body.appendChild(renderEditorToolbar());
    body.appendChild(renderEditorContent());
  } else if (state.editorTab === 'edgecases') {
    body.appendChild(renderEdgeCases());
  } else if (state.editorTab === 'export') {
    body.appendChild(renderExport());
  }
  view.appendChild(body);

  return view;
}

function renderStatusSelect(spec) {
  const wrapper = el('div', { className: 'custom-select' });
  const trigger = el('div', {
    className: 'custom-select-trigger',
    innerHTML: `<span class="${statusBadgeClass(spec.status)}" style="margin:0">${statusLabel(spec.status)}</span> ${icons.chevDown}`
  });

  const dropdown = el('div', { className: 'custom-select-dropdown' });
  for (const s of STATUSES) {
    const opt = el('div', {
      className: `custom-select-option${spec.status === s.key ? ' selected' : ''}`,
      onClick: async () => {
        spec.status = s.key;
        dropdown.classList.remove('open');
        autoSave();
        render();
      }
    }, statusLabel(s.key));
    dropdown.appendChild(opt);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'), { once: true });

  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  return wrapper;
}

// ─── Editor Toolbar ─────────────────────────────────────────────────────────

function renderEditorToolbar() {
  const toolbar = el('div', { className: 'editor-toolbar' });

  const cmds = [
    { label: 'H1', action: () => insertMd('# ', '') },
    { label: 'H2', action: () => insertMd('## ', '') },
    { label: 'H3', action: () => insertMd('### ', '') },
    { sep: true },
    { icon: icons.bold, action: () => wrapMd('**', '**') },
    { icon: icons.italic, action: () => wrapMd('*', '*') },
    { icon: icons.code, action: () => wrapMd('`', '`') },
    { sep: true },
    { label: '```', action: () => insertMd('```\n', '\n```') },
    { icon: icons.list, action: () => insertMd('- ', '') },
    { icon: icons.listOrdered, action: () => insertMd('1. ', '') },
    { icon: icons.quote, action: () => insertMd('> ', '') },
    { sep: true },
    { icon: icons.table, action: () => insertMd('| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n', '') },
    { icon: icons.link, action: () => wrapMd('[', '](url)') },
    { icon: icons.minus, action: () => insertMd('\n---\n', '') },
  ];

  for (const cmd of cmds) {
    if (cmd.sep) {
      toolbar.appendChild(el('div', { className: 'toolbar-sep' }));
      continue;
    }
    const btn = el('button', {
      className: 'toolbar-btn',
      innerHTML: cmd.icon || '',
      onClick: cmd.action
    });
    if (cmd.label && !cmd.icon) btn.textContent = cmd.label;
    toolbar.appendChild(btn);
  }

  // Right side
  const right = el('div', { className: 'toolbar-right' });

  const saveInd = el('span', {
    className: `save-indicator ${state.saveStatus}`
  }, state.saveStatus === 'saving' ? 'Saving...' : state.saveStatus === 'saved' ? 'Saved' : '');
  right.appendChild(saveInd);

  const toggle = el('div', { className: 'view-toggle' });
  for (const mode of ['edit', 'preview', 'split']) {
    toggle.appendChild(el('button', {
      className: `view-toggle-btn${state.editorMode === mode ? ' active' : ''}`,
      onClick: () => { state.editorMode = mode; render(); }
    }, mode.charAt(0).toUpperCase() + mode.slice(1)));
  }
  right.appendChild(toggle);
  toolbar.appendChild(right);

  return toolbar;
}

function getTextarea() {
  return document.getElementById('md-editor');
}

function insertMd(before, after) {
  setTimeout(() => {
    const ta = getTextarea();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.substring(start, end);
    const newText = before + sel + after;
    ta.setRangeText(newText, start, end, 'end');
    ta.focus();
    state.editingSpec.content = ta.value;
    autoSave();
  }, 0);
}

function wrapMd(before, after) {
  insertMd(before, after);
}

// ─── Editor Content ─────────────────────────────────────────────────────────

function renderEditorContent() {
  const container = el('div', { className: 'editor-content' });
  const spec = state.editingSpec;

  if (state.editorMode === 'edit' || state.editorMode === 'split') {
    const pane = el('div', { className: 'editor-pane' });
    const textarea = el('textarea', {
      className: 'editor-textarea',
      id: 'md-editor',
      placeholder: 'Start writing your specification in Markdown...\n\n# Overview\n\nDescribe the purpose...\n\n## Requirements\n\n- Requirement 1\n- Requirement 2'
    });
    textarea.value = spec.content || '';
    textarea.addEventListener('input', () => {
      spec.content = textarea.value;
      autoSave();
      if (state.editorMode === 'split') {
        const preview = document.getElementById('md-preview');
        if (preview) preview.innerHTML = marked.parse(spec.content || '');
      }
    });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        textarea.setRangeText('  ', start, start, 'end');
        spec.content = textarea.value;
        autoSave();
      }
    });
    pane.appendChild(textarea);
    container.appendChild(pane);
  }

  if (state.editorMode === 'preview' || state.editorMode === 'split') {
    const pane = el('div', {
      className: 'preview-pane',
      id: 'md-preview',
      innerHTML: marked.parse(spec.content || '*Nothing to preview yet.*')
    });
    container.appendChild(pane);
  }

  return container;
}

// ─── Auto Save ──────────────────────────────────────────────────────────────

function autoSave() {
  state.saveStatus = 'saving';
  updateSaveIndicator();
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(async () => {
    try {
      const spec = state.editingSpec;
      await api('PUT', `/api/specs/${spec.id}`, {
        title: spec.title,
        description: spec.description,
        content: spec.content,
        status: spec.status,
        version: spec.version,
        edgeCases: spec.edgeCases
      });
      state.saveStatus = 'saved';
      updateSaveIndicator();
      setTimeout(() => {
        state.saveStatus = '';
        updateSaveIndicator();
      }, 2000);
    } catch {
      state.saveStatus = '';
      toast('Auto-save failed', 'error');
    }
  }, 800);
}

function updateSaveIndicator() {
  const ind = document.querySelector('.save-indicator');
  if (!ind) return;
  ind.className = `save-indicator ${state.saveStatus}`;
  ind.textContent = state.saveStatus === 'saving' ? 'Saving...' : state.saveStatus === 'saved' ? 'Saved' : '';
}

// ─── Edge Cases ─────────────────────────────────────────────────────────────

function renderEdgeCases() {
  const panel = el('div', { className: 'edge-cases-panel' });
  const spec = state.editingSpec;

  // Add form
  const form = el('div', { className: 'ec-add-form' });
  const input = el('input', { type: 'text', placeholder: 'What happens if...?', id: 'ec-new-input' });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addEdgeCase(); });
  form.appendChild(input);
  form.appendChild(el('button', { className: 'btn btn-primary btn-sm', onClick: addEdgeCase, innerHTML: icons.plus + ' Add' }));
  panel.appendChild(form);

  // List
  const list = el('div', { className: 'ec-list' });
  for (const ec of (spec.edgeCases || [])) {
    const item = el('div', { className: 'ec-item' });
    const header = el('div', { className: 'ec-item-header' });
    header.appendChild(el('div', { className: 'ec-question' }, ec.question));

    const statusCls = `ec-status ec-status-${ec.status}`;
    const statusBtn = el('span', {
      className: statusCls,
      onClick: () => cycleEcStatus(ec)
    }, ec.status);
    header.appendChild(statusBtn);
    item.appendChild(header);

    const answer = el('textarea', {
      className: 'ec-answer',
      placeholder: 'Answer or resolution...',
      value: ec.answer || ''
    });
    answer.addEventListener('input', () => {
      ec.answer = answer.value;
      autoSave();
    });
    item.appendChild(answer);

    const actions = el('div', { className: 'ec-actions' });
    actions.appendChild(el('button', {
      className: 'btn-icon',
      innerHTML: icons.trash,
      onClick: async () => {
        try {
          await api('DELETE', `/api/specs/${spec.id}/edge-cases/${ec.id}`);
          spec.edgeCases = spec.edgeCases.filter(e => e.id !== ec.id);
          render();
          toast('Edge case removed', 'success');
        } catch { toast('Failed to delete', 'error'); }
      }
    }));
    item.appendChild(actions);

    list.appendChild(item);
  }

  if ((spec.edgeCases || []).length === 0) {
    list.appendChild(el('div', { className: 'kanban-empty', style: { padding: '40px' } }, 'No edge cases yet. Add one above.'));
  }

  panel.appendChild(list);
  return panel;
}

async function addEdgeCase() {
  const input = document.getElementById('ec-new-input');
  const q = input.value.trim();
  if (!q) return;
  const spec = state.editingSpec;
  try {
    const ec = await api('POST', `/api/specs/${spec.id}/edge-cases`, { question: q });
    spec.edgeCases.push(ec);
    input.value = '';
    render();
    toast('Edge case added', 'success');
  } catch { toast('Failed to add edge case', 'error'); }
}

async function cycleEcStatus(ec) {
  const order = ['open', 'addressed', 'deferred'];
  const idx = order.indexOf(ec.status);
  ec.status = order[(idx + 1) % order.length];
  autoSave();
  render();
}

// ─── Export Tab ──────────────────────────────────────────────────────────────

function renderExport() {
  const panel = el('div', { className: 'export-panel' });
  const spec = state.editingSpec;

  // Shareable link section
  const shareUrl = `${location.origin}/view/${spec.id}`;
  const shareSection = el('div', { className: 'export-share' });
  shareSection.appendChild(el('h3', null, 'Shareable Link'));
  shareSection.appendChild(el('p', { style: { color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' } }, 'Anyone with this link can view the spec.'));
  const shareRow = el('div', { className: 'share-link-row' });
  const shareInput = el('input', {
    className: 'share-link-input',
    value: shareUrl,
    readOnly: 'true'
  });
  const copyBtn = el('button', {
    className: 'btn btn-primary btn-sm',
    onClick: () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      });
    }
  }, 'Copy');
  shareRow.appendChild(shareInput);
  shareRow.appendChild(copyBtn);
  shareSection.appendChild(shareRow);
  panel.appendChild(shareSection);

  // Download section
  panel.appendChild(el('h3', { style: { marginTop: '24px', marginBottom: '12px' } }, 'Download'));
  const formats = [
    { fmt: 'md', name: 'Markdown', desc: 'Raw .md file', icon: icons.fileText },
    { fmt: 'html', name: 'HTML', desc: 'Styled HTML document', icon: icons.globe },
    { fmt: 'pdf', name: 'PDF', desc: 'Print-ready PDF (via browser)', icon: icons.file },
  ];
  for (const f of formats) {
    panel.appendChild(el('a', {
      className: 'export-card',
      href: `/api/specs/${spec.id}/export/${f.fmt}`,
      target: '_blank',
      style: { textDecoration: 'none' }
    },
      el('div', { className: 'export-card-icon', innerHTML: f.icon }),
      el('div', { className: 'export-card-info' },
        el('h3', null, f.name),
        el('p', null, f.desc)
      )
    ));
  }
  return panel;
}

// ─── Delete Spec ────────────────────────────────────────────────────────────

function confirmDeleteSpec(specId) {
  const overlay = el('div', { className: 'modal-overlay' });
  const modal = el('div', { className: 'modal' });
  modal.appendChild(el('h2', null, 'Delete Specification'));
  modal.appendChild(el('p', { style: { marginBottom: '20px', color: 'var(--text-muted)' } }, 'This action cannot be undone. Are you sure?'));
  modal.appendChild(el('div', { className: 'modal-actions' },
    el('button', { className: 'btn', onClick: () => overlay.remove() }, 'Cancel'),
    el('button', {
      className: 'btn btn-danger',
      onClick: async () => {
        try {
          await api('DELETE', `/api/specs/${specId}`);
          overlay.remove();
          await loadSpecs();
          state.view = 'kanban';
          state.editingSpec = null;
          render();
          toast('Spec deleted', 'success');
        } catch { toast('Failed to delete', 'error'); }
      }
    }, 'Delete')
  ));
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────

function renderKB() {
  const view = el('div', { className: 'kb-view' });

  // Search
  const search = el('div', { className: 'kb-search' });
  const searchInput = el('input', { type: 'text', placeholder: 'Search knowledge base...' });
  searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (!q) { state.searchResults = null; render(); return; }
      try {
        state.searchResults = await api('GET', `/api/search?q=${encodeURIComponent(q)}&limit=10`);
        render();
      } catch { toast('Search failed', 'error'); }
    }
  });
  search.appendChild(searchInput);
  search.appendChild(el('button', { className: 'btn', innerHTML: icons.search, onClick: async () => {
    const q = searchInput.value.trim();
    if (!q) return;
    try {
      state.searchResults = await api('GET', `/api/search?q=${encodeURIComponent(q)}&limit=10`);
      render();
    } catch { toast('Search failed', 'error'); }
  }}));
  view.appendChild(search);

  // Search results
  if (state.searchResults && state.searchResults.length > 0) {
    const results = el('div', { className: 'kb-search-results' });
    results.appendChild(el('h3', { style: { color: '#fff', fontSize: '14px', marginBottom: '8px' } }, `${state.searchResults.length} results`));
    for (const r of state.searchResults) {
      results.appendChild(el('div', { className: 'kb-search-result' },
        el('div', { className: 'kb-search-result-doc' }, r.documentName),
        el('div', { className: 'kb-search-result-text' }, r.content.substring(0, 300) + (r.content.length > 300 ? '...' : '')),
        el('div', { className: 'kb-search-result-score' }, `Score: ${r.score}`)
      ));
    }
    view.appendChild(results);
  }

  // Upload area
  const uploadArea = el('div', { className: 'kb-upload-area' });
  uploadArea.innerHTML = `${icons.upload}<p>Drop files here or <span class="accent">browse</span></p><p style="font-size:11px;color:var(--text-dim);margin-top:4px">PDF, Markdown, Text, JSON, Code files</p>`;
  const fileInput = el('input', { type: 'file', style: { display: 'none' }, accept: '.pdf,.md,.txt,.html,.json,.js,.ts,.py,.yaml,.yml,.csv' });
  fileInput.addEventListener('change', () => uploadFile(fileInput.files[0]));
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--accent)'; });
  uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
  });
  uploadArea.appendChild(fileInput);
  view.appendChild(uploadArea);

  // Documents grid
  if (state.documents.length > 0) {
    const grid = el('div', { className: 'kb-docs-grid' });
    for (const doc of state.documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))) {
      const card = el('div', { className: 'kb-doc-card' });
      const header = el('div', { className: 'kb-doc-card-header' });
      header.appendChild(el('span', { className: 'kb-doc-card-name' }, doc.name));
      header.appendChild(el('span', { className: 'kb-doc-card-type' }, doc.type));
      card.appendChild(header);
      const meta = el('div', { className: 'kb-doc-card-meta' });
      meta.appendChild(el('span', null, `${doc.chunkCount} chunks`));
      meta.appendChild(el('span', null, timeAgo(doc.uploadedAt)));
      card.appendChild(meta);
      const actions = el('div', { style: { marginTop: '8px' } });
      actions.appendChild(el('button', {
        className: 'btn-icon',
        innerHTML: icons.trash,
        onClick: async () => {
          try {
            await api('DELETE', `/api/documents/${doc.id}`);
            await loadDocuments();
            render();
            toast('Document removed', 'success');
          } catch { toast('Failed to delete', 'error'); }
        }
      }));
      card.appendChild(actions);
      grid.appendChild(card);
    }
    view.appendChild(grid);
  }

  return view;
}

async function uploadFile(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  try {
    await fetch('/api/documents', { method: 'POST', body: formData });
    await loadDocuments();
    render();
    toast('Document uploaded', 'success');
  } catch { toast('Upload failed', 'error'); }
}

// ─── Links View ─────────────────────────────────────────────────────────────

function renderLinksView() {
  const view = el('div', { className: 'links-view' });

  const form = el('div', { className: 'link-add-form' });
  const nameInput = el('input', { type: 'text', placeholder: 'Link title', id: 'link-name' });
  const urlInput = el('input', { type: 'url', placeholder: 'https://...', id: 'link-url' });
  form.appendChild(nameInput);
  form.appendChild(urlInput);
  form.appendChild(el('button', {
    className: 'btn btn-primary btn-sm',
    innerHTML: icons.plus + ' Add',
    onClick: async () => {
      const name = document.getElementById('link-name').value.trim();
      const url = document.getElementById('link-url').value.trim();
      if (!url) { toast('URL is required', 'error'); return; }
      try {
        await api('POST', '/api/links', { name: name || url, url });
        await loadLinks();
        render();
        toast('Link added', 'success');
      } catch { toast('Failed to add link', 'error'); }
    }
  }));
  view.appendChild(form);

  const list = el('div', { className: 'links-list' });
  for (const link of state.links) {
    list.appendChild(el('div', { className: 'link-item' },
      el('div', { className: 'link-item-info' },
        el('div', { className: 'link-item-title' }, link.name || link.url),
        el('a', { className: 'link-item-url', href: link.url, target: '_blank', rel: 'noopener' }, link.url)
      ),
      el('button', {
        className: 'btn-icon',
        innerHTML: icons.trash,
        onClick: async () => {
          try {
            await api('DELETE', `/api/links/${link.id}`);
            await loadLinks();
            render();
            toast('Link removed', 'success');
          } catch { toast('Failed to delete', 'error'); }
        }
      })
    ));
  }
  if (state.links.length === 0) {
    list.appendChild(el('div', { className: 'kanban-empty', style: { padding: '40px' } }, 'No links yet. Add one above.'));
  }
  view.appendChild(list);

  return view;
}

// ─── Init ───────────────────────────────────────────────────────────────────

// ─── PIN Protection ─────────────────────────────────────────────────────────

async function checkPinLock() {
  try {
    const config = await api('GET', '/api/config');
    state.config = config;
    if (!config.pinEnabled) return false;
    if (sessionStorage.getItem('spechub-pin-auth') === 'true') return false;

    // Show lock screen, hide app
    document.getElementById('pin-lock').style.display = 'flex';
    document.getElementById('app').style.display = 'none';

    createPinInputs('pin-lock-inputs', async (entered) => {
      try {
        const result = await api('POST', '/api/verify-pin', { pin: entered });
        if (result.success) {
          sessionStorage.setItem('spechub-pin-auth', 'true');
          document.getElementById('pin-lock').style.display = 'none';
          document.getElementById('app').style.display = '';
          startApp();
        }
      } catch {
        document.getElementById('pin-lock-error').textContent = 'Wrong PIN';
        document.querySelectorAll('#pin-lock-inputs .pin-digit').forEach(d => {
          d.classList.add('error');
          d.value = '';
          setTimeout(() => d.classList.remove('error'), 400);
        });
        document.querySelector('#pin-lock-inputs .pin-digit').focus();
      }
    });
    return true;
  } catch {
    return false;
  }
}

function createPinInputs(containerId, onComplete) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const inputs = [];
  for (let i = 0; i < 4; i++) {
    const input = document.createElement('input');
    input.type = 'tel';
    input.maxLength = 1;
    input.className = 'pin-digit';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]';
    input.autocomplete = 'off';

    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;
      if (val && i < 3) inputs[i + 1].focus();
      const full = inputs.map(inp => inp.value).join('');
      if (full.length === 4 && onComplete) onComplete(full);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        inputs[i - 1].focus();
        inputs[i - 1].value = '';
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 4);
      for (let j = 0; j < pasted.length && j < 4; j++) inputs[j].value = pasted[j];
      if (pasted.length === 4 && onComplete) onComplete(pasted);
      else if (pasted.length > 0) inputs[Math.min(pasted.length, 3)].focus();
    });

    inputs.push(input);
    container.appendChild(input);
  }
  setTimeout(() => inputs[0].focus(), 100);
}

// ─── Settings View ──────────────────────────────────────────────────────────

function renderSettings() {
  const view = el('div', { className: 'settings-view' });

  // Appearance card
  const appearance = el('div', { className: 'settings-card' });
  appearance.appendChild(el('h3', null, 'Appearance'));

  const titleGroup = el('div', { className: 'settings-group' });
  titleGroup.appendChild(el('label', null, 'App Title'));
  const titleInput = el('input', { className: 'settings-input', value: state.config.appTitle || 'Spec Hub', placeholder: 'Spec Hub' });
  titleGroup.appendChild(titleInput);
  appearance.appendChild(titleGroup);

  const subtitleGroup = el('div', { className: 'settings-group' });
  subtitleGroup.appendChild(el('label', null, 'Subtitle'));
  const subtitleInput = el('input', { className: 'settings-input', value: state.config.appSubtitle || '', placeholder: 'Specification Manager' });
  subtitleGroup.appendChild(subtitleInput);
  appearance.appendChild(subtitleGroup);

  const colorGroup = el('div', { className: 'settings-group' });
  colorGroup.appendChild(el('label', null, 'Accent Color'));
  const colorRow = el('div', { className: 'color-row' });
  const presetColors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6'];
  const currentColor = state.config.accentColor || '#6366f1';
  for (const c of presetColors) {
    const swatch = el('button', {
      className: `color-swatch${c === currentColor ? ' active' : ''}`,
      style: { background: c },
      onClick: () => {
        colorRow.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      }
    });
    colorRow.appendChild(swatch);
  }
  colorGroup.appendChild(colorRow);
  appearance.appendChild(colorGroup);

  const saveAppearance = el('button', {
    className: 'btn btn-primary',
    onClick: async () => {
      const activeSwatch = colorRow.querySelector('.color-swatch.active');
      const accentColor = activeSwatch ? activeSwatch.style.background : currentColor;
      try {
        state.config = await api('PUT', '/api/config', {
          appTitle: titleInput.value.trim() || 'Spec Hub',
          appSubtitle: subtitleInput.value.trim(),
          accentColor: rgbToHex(accentColor)
        });
        applyAccentColor();
        toast('Settings saved', 'success');
        render();
      } catch { toast('Failed to save', 'error'); }
    }
  }, 'Save');
  appearance.appendChild(saveAppearance);
  view.appendChild(appearance);

  // PIN Protection card
  const pinCard = el('div', { className: 'settings-card' });
  pinCard.appendChild(el('h3', null, 'PIN Protection'));
  pinCard.appendChild(el('p', { className: 'settings-desc' }, 'Require a 4-digit PIN to access Spec Hub. Shareable spec links (/view/...) will remain public and won\'t require a PIN.'));

  const pinStatus = el('div', { className: 'pin-status' });
  if (state.config.pinEnabled) {
    pinStatus.appendChild(el('span', { className: 'pin-badge pin-badge-on' }, 'PIN Active'));
    pinStatus.appendChild(el('span', { style: { color: 'var(--text-muted)', fontSize: '13px' } }, 'Change or disable below'));
  } else {
    pinStatus.appendChild(el('span', { className: 'pin-badge pin-badge-off' }, 'No PIN'));
    pinStatus.appendChild(el('span', { style: { color: 'var(--text-muted)', fontSize: '13px' } }, 'Set a PIN to protect access'));
  }
  pinCard.appendChild(pinStatus);

  const pinGroup = el('div', { className: 'settings-group' });
  pinGroup.appendChild(el('label', null, 'Set 4-Digit PIN'));
  const pinRow = el('div', { className: 'pin-input-row', id: 'pin-settings-inputs' });
  pinGroup.appendChild(pinRow);
  pinCard.appendChild(pinGroup);

  const pinActions = el('div', { className: 'settings-actions' });
  pinActions.appendChild(el('button', {
    className: 'btn btn-primary',
    onClick: async () => {
      const inputs = document.querySelectorAll('#pin-settings-inputs .pin-digit');
      const pin = Array.from(inputs).map(i => i.value).join('');
      if (pin.length !== 4) {
        inputs.forEach(i => { i.classList.add('error'); setTimeout(() => i.classList.remove('error'), 400); });
        return;
      }
      try {
        state.config = await api('PUT', '/api/config', { pin });
        sessionStorage.setItem('spechub-pin-auth', 'true');
        toast('PIN saved', 'success');
        render();
      } catch { toast('Failed to save PIN', 'error'); }
    }
  }, 'Save PIN'));

  if (state.config.pinEnabled) {
    pinActions.appendChild(el('button', {
      className: 'btn btn-danger',
      onClick: async () => {
        try {
          state.config = await api('PUT', '/api/config', { pin: null });
          sessionStorage.removeItem('spechub-pin-auth');
          toast('PIN disabled', 'success');
          render();
        } catch { toast('Failed to disable PIN', 'error'); }
      }
    }, 'Disable PIN'));
  }
  pinCard.appendChild(pinActions);
  view.appendChild(pinCard);

  // Create PIN inputs after DOM is ready
  setTimeout(() => createPinInputs('pin-settings-inputs', null), 50);

  return view;
}

function rgbToHex(color) {
  if (color.startsWith('#')) return color;
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  return '#' + [match[1], match[2], match[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function applyAccentColor() {
  const color = state.config.accentColor || '#6366f1';
  document.documentElement.style.setProperty('--accent', color);
}

// ─── Init ───────────────────────────────────────────────────────────────────

async function startApp() {
  await Promise.all([loadSpecs(), loadDocuments(), loadLinks()]);
  try {
    state.config = await api('GET', '/api/config');
    applyAccentColor();
  } catch {}
  render();
}

async function init() {
  // Load marked from CDN if not already loaded
  if (typeof marked === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
    document.head.appendChild(script);
    await new Promise(r => script.onload = r);
  }

  const locked = await checkPinLock();
  if (!locked) {
    await startApp();
  }
}

init();

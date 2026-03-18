// ============================================================
// LeadScraper Pro – Dashboard Application
// ============================================================

'use strict';

// ---- Column definitions (all 80+ fields) -------------------
const ALL_COLUMNS = [
  // Group: Core
  { key: '_rowNum',         label: '#',                group: 'Core',      defaultOn: true,  width: 48  },
  { key: 'name',            label: 'Business Name',    group: 'Core',      defaultOn: true,  width: 200 },
  { key: 'firstCategory',   label: 'First Category',   group: 'Core',      defaultOn: true,  width: 160 },
  { key: 'secondCategory',  label: 'Second Category',  group: 'Core',      defaultOn: false, width: 160 },
  { key: 'claimedGmb',      label: 'Claimed GMB',      group: 'Core',      defaultOn: true,  width: 100 },
  { key: 'averageRating',   label: 'Avg Rating',       group: 'Core',      defaultOn: true,  width: 90  },
  { key: 'reviewsCount',    label: 'Reviews',          group: 'Core',      defaultOn: true,  width: 80  },

  // Group: Contact
  { key: 'phoneStandard',   label: 'Phone',            group: 'Contact',   defaultOn: true,  width: 150 },
  { key: 'phone',           label: 'Phone (Raw)',      group: 'Contact',   defaultOn: false, width: 130 },
  { key: 'email1',          label: 'Email 1',          group: 'Contact',   defaultOn: true,  width: 200 },
  { key: 'email2',          label: 'Email 2',          group: 'Contact',   defaultOn: false, width: 200 },
  { key: 'website',         label: 'Website',          group: 'Contact',   defaultOn: true,  width: 220 },
  { key: 'cleanWebsiteUrl', label: 'Clean Website',    group: 'Contact',   defaultOn: false, width: 220 },
  { key: 'domain',          label: 'Domain',           group: 'Contact',   defaultOn: true,  width: 160 },

  // Group: Address
  { key: 'fullAddress',     label: 'Full Address',     group: 'Address',   defaultOn: true,  width: 280 },
  { key: 'streetAddress',   label: 'Street Address',   group: 'Address',   defaultOn: false, width: 200 },
  { key: 'city',            label: 'City',             group: 'Address',   defaultOn: true,  width: 120 },
  { key: 'state',           label: 'State',            group: 'Address',   defaultOn: true,  width: 80  },
  { key: 'zipCode',         label: 'Zip Code',         group: 'Address',   defaultOn: false, width: 90  },
  { key: 'municipality',    label: 'Municipality',     group: 'Address',   defaultOn: false, width: 140 },
  { key: 'country',         label: 'Country',          group: 'Address',   defaultOn: false, width: 100 },
  { key: 'timeZone',        label: 'Time Zone',        group: 'Address',   defaultOn: false, width: 140 },

  // Group: Social
  { key: 'facebook',        label: 'Facebook',         group: 'Social',    defaultOn: true,  width: 220 },
  { key: 'instagram',       label: 'Instagram',        group: 'Social',    defaultOn: true,  width: 220 },
  { key: 'linkedin',        label: 'LinkedIn',         group: 'Social',    defaultOn: true,  width: 220 },
  { key: 'youtube',         label: 'YouTube',          group: 'Social',    defaultOn: false, width: 220 },
  { key: 'tiktok',          label: 'TikTok',           group: 'Social',    defaultOn: false, width: 220 },
  { key: 'twitter',         label: 'Twitter / X',      group: 'Social',    defaultOn: false, width: 180 },
  { key: 'yelp',            label: 'Yelp',             group: 'Social',    defaultOn: false, width: 220 },

  // Group: Hours
  { key: 'hours',           label: 'Hours (Summary)',  group: 'Hours',     defaultOn: false, width: 200 },
  { key: 'monday',          label: 'Monday',           group: 'Hours',     defaultOn: false, width: 130 },
  { key: 'tuesday',         label: 'Tuesday',          group: 'Hours',     defaultOn: false, width: 130 },
  { key: 'wednesday',       label: 'Wednesday',        group: 'Hours',     defaultOn: false, width: 130 },
  { key: 'thursday',        label: 'Thursday',         group: 'Hours',     defaultOn: false, width: 130 },
  { key: 'friday',          label: 'Friday',           group: 'Hours',     defaultOn: false, width: 130 },
  { key: 'saturday',        label: 'Saturday',         group: 'Hours',     defaultOn: false, width: 130 },
  { key: 'sunday',          label: 'Sunday',           group: 'Hours',     defaultOn: false, width: 130 },

  // Group: GMB / IDs
  { key: 'placeId',         label: 'Place ID',         group: 'GMB / IDs', defaultOn: false, width: 200 },
  { key: 'cid',             label: 'CID',              group: 'GMB / IDs', defaultOn: false, width: 180 },
  { key: 'kgmid',           label: 'KGMID',            group: 'GMB / IDs', defaultOn: false, width: 120 },
  { key: 'googleFeatureId', label: 'Feature ID',       group: 'GMB / IDs', defaultOn: false, width: 160 },
  { key: 'latitude',        label: 'Latitude',         group: 'GMB / IDs', defaultOn: false, width: 110 },
  { key: 'longitude',       label: 'Longitude',        group: 'GMB / IDs', defaultOn: false, width: 110 },
  { key: 'coordinates',     label: 'Coordinates',      group: 'GMB / IDs', defaultOn: false, width: 160 },
  { key: 'gmbUrl',          label: 'GMB URL',          group: 'GMB / IDs', defaultOn: false, width: 300 },
  { key: 'googleKnowledgeUrl', label: 'Knowledge URL', group: 'GMB / IDs', defaultOn: false, width: 280 },
  { key: 'photosPageUrl',   label: 'Photos Page',      group: 'GMB / IDs', defaultOn: false, width: 280 },
  { key: 'reviewUrl',       label: 'Review URL',       group: 'GMB / IDs', defaultOn: false, width: 280 },
  { key: 'menuLink',        label: 'Menu Link',        group: 'GMB / IDs', defaultOn: false, width: 220 },

  // Group: Tech
  { key: 'facebookPixelId', label: 'FB Pixel ID',      group: 'Tech',      defaultOn: false, width: 140 },
  { key: 'gtmContainerId',  label: 'GTM Container',    group: 'Tech',      defaultOn: false, width: 130 },
  { key: 'faviconUrl',      label: 'Favicon URL',      group: 'Tech',      defaultOn: false, width: 220 },
  { key: 'logoUrl',         label: 'Logo URL',         group: 'Tech',      defaultOn: false, width: 220 },
  { key: 'favicon',         label: 'Favicon (Google)', group: 'Tech',      defaultOn: false, width: 220 },

  // Group: UTM
  { key: 'utmSource',       label: 'UTM Source',       group: 'UTM',       defaultOn: false, width: 120 },
  { key: 'utmMedium',       label: 'UTM Medium',       group: 'UTM',       defaultOn: false, width: 120 },
  { key: 'utmCampaign',     label: 'UTM Campaign',     group: 'UTM',       defaultOn: false, width: 140 },

  // Group: Attributes
  { key: 'serviceOptions',  label: 'Service Options',  group: 'Attributes',defaultOn: false, width: 200 },
  { key: 'accessibility',   label: 'Accessibility',    group: 'Attributes',defaultOn: false, width: 160 },
  { key: 'crowd',           label: 'Crowd',            group: 'Attributes',defaultOn: false, width: 120 },
  { key: 'amenities',       label: 'Amenities',        group: 'Attributes',defaultOn: false, width: 180 },
  { key: 'fromBusiness',    label: 'From Business',    group: 'Attributes',defaultOn: false, width: 200 },
  { key: 'payments',        label: 'Payments',         group: 'Attributes',defaultOn: false, width: 160 },
  { key: 'offerings',       label: 'Offerings',        group: 'Attributes',defaultOn: false, width: 180 },

  // Group: Meta
  { key: '_keyword',        label: 'Keyword',          group: 'Meta',      defaultOn: false, width: 160 },
  { key: '_scrapedAt',      label: 'Scraped At',       group: 'Meta',      defaultOn: false, width: 160 },
];

// ---- State --------------------------------------------------
let allLeads = [];
let filteredLeads = [];
let visibleCols = new Set(ALL_COLUMNS.filter(c => c.defaultOn).map(c => c.key));
let sortKey = '';
let sortDir = 1;
let filterText = '';
let filterCol = '';
let settings = {
  delay: 1500,
  maxListings: 100,
  webTimeout: 4000
};

// ---- Element refs -------------------------------------------
const $ = id => document.getElementById(id);
const btnStart       = $('btnStart');
const btnStop        = $('btnStop');
const btnExportCSV   = $('btnExportCSV');
const btnExportXLSX  = $('btnExportXLSX');
const btnClearLeads  = $('btnClearLeads');
const btnSettings    = $('btnSettings');
const btnCloseSettings = $('btnCloseSettings');
const btnSaveSettings  = $('btnSaveSettings');
const btnColumnToggle  = $('btnColumnToggle');
const btnSelectAll   = $('btnSelectAll');
const btnSelectNone  = $('btnSelectNone');
const keywordsInput  = $('keywords');
const locationInput  = $('location');
const scrapeWebsite  = $('scrapeWebsite');
const skipDuplicates = $('skipDuplicates');
const filterSearch   = $('filterSearch');
const filterColSel   = $('filterCol');
const columnsPanel   = $('columnsPanel');
const columnsGroups  = $('columnsGroups');
const tableHead      = $('tableHead');
const tableBody      = $('tableBody');
const emptyState     = $('emptyState');
const settingsModal  = $('settingsModal');
const statusBadge    = $('statusBadge');
const statusText     = $('statusText');
const statusDot      = statusBadge.querySelector('.status-dot');

// ---- Init ---------------------------------------------------
async function init() {
  loadSettings();
  buildColumnsPanel();
  buildTableHeader();

  // Load existing leads
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'GET_LEADS' });
    if (resp && resp.leads) {
      allLeads = resp.leads;
      renderTable();
    }
  } catch {}

  // Get session state
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (state && state.active) {
      setStatus('running', 'Scraping...');
      updateStats(state.stats);
      btnStart.disabled = true;
      btnStop.disabled = false;
      if (state.keywords) keywordsInput.value = state.keywords.join('\n');
      if (state.location) locationInput.value = state.location;
    }
  } catch {}

  // Listen for background messages
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

function loadSettings() {
  const saved = localStorage.getItem('leadscraper_settings');
  if (saved) {
    try { settings = { ...settings, ...JSON.parse(saved) }; } catch {}
  }
  $('settingDelay').value = settings.delay;
  $('settingMaxListings').value = settings.maxListings;
  $('settingWebTimeout').value = settings.webTimeout;
}

// ---- Background message handler ----------------------------
function handleBackgroundMessage(msg) {
  if (!msg || !msg.type) return;
  switch (msg.type) {
    case 'SESSION_STARTED':
      setStatus('running', 'Scraping...');
      btnStart.disabled = true;
      btnStop.disabled = false;
      break;

    case 'SESSION_STOPPED':
      const reason = msg.data?.reason;
      setStatus(reason === 'complete' ? 'done' : 'stopped',
        reason === 'complete' ? 'Complete' : reason === 'user' ? 'Stopped' : 'Stopped');
      btnStart.disabled = false;
      btnStop.disabled = true;
      showToast(reason === 'complete' ? 'Scraping complete!' : 'Scraping stopped.', reason === 'complete' ? 'success' : '');
      break;

    case 'NEW_LEADS':
      if (msg.data?.leads) {
        msg.data.leads.forEach(l => {
          if (!allLeads.find(x => x._id === l._id)) allLeads.push(l);
        });
        renderTable();
      }
      if (msg.data?.stats) updateStats(msg.data.stats);
      break;

    case 'LEAD_ENRICHED':
      if (msg.data?.leadId && msg.data?.webData) {
        const lead = allLeads.find(l => l._id === msg.data.leadId);
        if (lead) Object.assign(lead, msg.data.webData);
        renderTable();
      }
      if (msg.data?.stats) updateStats(msg.data.stats);
      break;

    case 'STATS_UPDATE':
      if (msg.data?.stats) updateStats(msg.data.stats);
      break;

    case 'KEYWORD_START':
      if (msg.data) {
        $('currentKeyword').textContent = msg.data.keyword || '—';
        const pct = msg.data.total ? ((msg.data.index) / msg.data.total * 100) : 0;
        $('keywordProgress').style.width = pct + '%';
        $('keywordSub').textContent = `${msg.data.index + 1} / ${msg.data.total}`;
      }
      break;

    case 'KEYWORD_DONE':
      if (msg.data) {
        const pct = msg.data.index ? (msg.data.index / (allLeads.length || 1) * 100) : 0;
        $('keywordProgress').style.width = Math.min(100, pct) + '%';
      }
      break;

    case 'LEADS_CLEARED':
      allLeads = [];
      filteredLeads = [];
      renderTable();
      updateStats({ totalLeads: 0, uniqueLeads: 0, emails: 0, phones: 0, startTime: null, elapsedSeconds: 0 });
      break;
  }
}

// ---- Status -------------------------------------------------
function setStatus(type, label) {
  statusDot.className = 'status-dot ' + type;
  statusText.textContent = label;
}

// ---- Stats --------------------------------------------------
function updateStats(stats) {
  $('statTotal').textContent = stats.totalLeads || 0;
  $('statUnique').textContent = stats.uniqueLeads || 0;
  $('statEmails').textContent = stats.emails || 0;
  $('statPhones').textContent = stats.phones || 0;

  if (stats.elapsedSeconds !== undefined) {
    const s = stats.elapsedSeconds;
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    $('elapsedTime').textContent = `${h}:${m}:${sec}`;
  }
}

// ---- Build Columns Panel -----------------------------------
function buildColumnsPanel() {
  const groups = {};
  ALL_COLUMNS.forEach(col => {
    if (!groups[col.group]) groups[col.group] = [];
    groups[col.group].push(col);
  });

  columnsGroups.innerHTML = '';
  for (const [groupName, cols] of Object.entries(groups)) {
    const groupEl = document.createElement('div');
    groupEl.style.cssText = 'width:100%;margin-bottom:6px;';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;text-transform:uppercase;color:#6B7280;margin-bottom:4px;font-weight:600;letter-spacing:0.05em;';
    title.textContent = groupName;
    groupEl.appendChild(title);

    const chipsWrap = document.createElement('div');
    chipsWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';

    cols.forEach(col => {
      if (col.key === '_rowNum') return; // always visible
      const chip = document.createElement('span');
      chip.className = 'col-chip' + (visibleCols.has(col.key) ? ' active' : '');
      chip.textContent = col.label;
      chip.dataset.key = col.key;
      chip.addEventListener('click', () => {
        if (visibleCols.has(col.key)) visibleCols.delete(col.key);
        else visibleCols.add(col.key);
        chip.classList.toggle('active', visibleCols.has(col.key));
        buildTableHeader();
        renderTable();
        saveVisibleCols();
      });
      chipsWrap.appendChild(chip);
    });

    groupEl.appendChild(chipsWrap);
    columnsGroups.appendChild(groupEl);
  }
}

function saveVisibleCols() {
  localStorage.setItem('leadscraper_cols', JSON.stringify([...visibleCols]));
}

function loadVisibleCols() {
  const saved = localStorage.getItem('leadscraper_cols');
  if (saved) {
    try { visibleCols = new Set(JSON.parse(saved)); } catch {}
  }
}

// ---- Build Table Header ------------------------------------
function buildTableHeader() {
  const cols = getVisibleColumns();
  const tr = document.createElement('tr');
  cols.forEach(col => {
    const th = document.createElement('th');
    th.style.width = col.width + 'px';
    const isSorted = sortKey === col.key;
    th.className = isSorted ? 'sorted' : '';
    th.innerHTML = col.label + (isSorted ? `<span class="sort-arrow">${sortDir > 0 ? '↑' : '↓'}</span>` : '');
    if (col.key !== '_rowNum') {
      th.addEventListener('click', () => {
        if (sortKey === col.key) sortDir *= -1;
        else { sortKey = col.key; sortDir = 1; }
        buildTableHeader();
        renderTable();
      });
    }
    tr.appendChild(th);
  });
  tableHead.innerHTML = '';
  tableHead.appendChild(tr);
}

function getVisibleColumns() {
  return ALL_COLUMNS.filter(c => c.key === '_rowNum' || visibleCols.has(c.key));
}

// ---- Render Table ------------------------------------------
function applyFilter() {
  const text = filterText.toLowerCase();
  const col = filterCol;

  if (!text) {
    filteredLeads = [...allLeads];
  } else if (col) {
    filteredLeads = allLeads.filter(l => {
      const val = String(l[col] || '').toLowerCase();
      return val.includes(text);
    });
  } else {
    filteredLeads = allLeads.filter(l =>
      Object.values(l).some(v => String(v || '').toLowerCase().includes(text))
    );
  }

  if (sortKey) {
    filteredLeads.sort((a, b) => {
      let av = a[sortKey] || '', bv = b[sortKey] || '';
      if (typeof av === 'number' || typeof bv === 'number') {
        av = parseFloat(av) || 0; bv = parseFloat(bv) || 0;
        return (av - bv) * sortDir;
      }
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }

  $('filterCount').textContent = filteredLeads.length.toLocaleString();
}

function renderTable() {
  applyFilter();

  const cols = getVisibleColumns();
  emptyState.classList.toggle('hidden', filteredLeads.length > 0);

  // Virtual render – only first 500 rows for performance
  const LIMIT = 500;
  const rows = filteredLeads.slice(0, LIMIT);

  const fragment = document.createDocumentFragment();
  rows.forEach((lead, idx) => {
    const tr = document.createElement('tr');
    cols.forEach(col => {
      const td = document.createElement('td');
      td.style.maxWidth = col.width + 'px';
      const val = col.key === '_rowNum' ? idx + 1 : (lead[col.key] ?? '');
      renderCell(td, col.key, val, lead);
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });

  tableBody.innerHTML = '';
  tableBody.appendChild(fragment);

  if (filteredLeads.length > LIMIT) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = cols.length;
    td.style.cssText = 'text-align:center;color:#6B7280;padding:12px;';
    td.textContent = `Showing ${LIMIT} of ${filteredLeads.length} results. Export to see all.`;
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }
}

function renderCell(td, key, val, lead) {
  if (key === '_rowNum') {
    td.className = 'row-num';
    td.textContent = val;
    return;
  }

  if (key === 'claimedGmb') {
    td.className = val ? 'cell-yes' : 'cell-no';
    td.textContent = val ? 'Yes' : 'No';
    return;
  }

  if (key === 'averageRating' && val) {
    td.innerHTML = `<span class="cell-rating">★ ${val}</span>`;
    return;
  }

  if (key === 'website' || key === 'cleanWebsiteUrl' || key === 'gmbUrl' || key === 'menuLink' ||
      key === 'googleKnowledgeUrl' || key === 'photosPageUrl' || key === 'reviewUrl' ||
      key === 'facebook' || key === 'instagram' || key === 'linkedin' || key === 'youtube' ||
      key === 'tiktok' || key === 'twitter' || key === 'yelp') {
    if (val) {
      const a = document.createElement('a');
      a.href = val;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'cell-link';
      a.textContent = val.replace(/^https?:\/\/(www\.)?/, '').substring(0, 40) + (val.length > 40 ? '…' : '');
      a.title = val;
      td.appendChild(a);
    }
    return;
  }

  if (key === 'email1' || key === 'email2') {
    if (val) {
      const a = document.createElement('a');
      a.href = 'mailto:' + val;
      a.className = 'cell-link';
      a.textContent = val;
      td.appendChild(a);
    }
    return;
  }

  td.textContent = String(val || '');
  td.title = String(val || '');
}

// ---- Export ------------------------------------------------
function getExportData() {
  const cols = ALL_COLUMNS.filter(c => c.key !== '_rowNum');
  const headers = cols.map(c => c.label);
  const rows = filteredLeads.map(lead =>
    cols.map(c => {
      const v = lead[c.key];
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      return v ?? '';
    })
  );
  return { headers, rows };
}

function exportCSV() {
  const { headers, rows } = getExportData();
  const csvRows = [headers, ...rows].map(row =>
    row.map(cell => {
      const s = String(cell).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(',')
  );
  const csv = '\uFEFF' + csvRows.join('\r\n'); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `leads_${timestamp()}.csv`);
  showToast(`Exported ${filteredLeads.length} leads to CSV`, 'success');
}

function exportXLSX() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel library not loaded. Try again.', 'error');
    return;
  }
  const { headers, rows } = getExportData();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');

  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: '4F46E5' } } };
  }

  // Auto column widths
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.slice(0, 100).map(r => String(r[i] || '').length));
    return { wch: Math.min(50, Math.max(10, maxLen + 2)) };
  });

  XLSX.writeFile(wb, `leads_${timestamp()}.xlsx`);
  showToast(`Exported ${filteredLeads.length} leads to Excel`, 'success');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ---- Toast -------------------------------------------------
function showToast(message, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ---- Event listeners ---------------------------------------
btnStart.addEventListener('click', async () => {
  const keywords = keywordsInput.value.trim().split('\n').filter(k => k.trim());
  const location = locationInput.value.trim();

  if (!keywords.length) {
    showToast('Enter at least one keyword.', 'error');
    return;
  }

  btnStart.disabled = true;
  btnStop.disabled = false;
  setStatus('running', 'Starting...');

  try {
    const resp = await chrome.runtime.sendMessage({
      type: 'START_SCRAPING',
      config: {
        keywords,
        location,
        settings: {
          scrapeWebsite: scrapeWebsite.checked,
          skipDuplicates: skipDuplicates.checked,
          delay: settings.delay,
          maxListings: settings.maxListings,
          webTimeout: settings.webTimeout
        }
      }
    });
    if (resp && resp.error) {
      showToast(resp.error, 'error');
      setStatus('idle', 'Ready');
      btnStart.disabled = false;
      btnStop.disabled = true;
    }
  } catch (e) {
    showToast('Failed to communicate with extension.', 'error');
    btnStart.disabled = false;
    btnStop.disabled = true;
    setStatus('idle', 'Ready');
  }
});

btnStop.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'STOP_SCRAPING' });
});

btnClearLeads.addEventListener('click', async () => {
  if (!confirm(`Clear all ${allLeads.length} leads?`)) return;
  await chrome.runtime.sendMessage({ type: 'CLEAR_LEADS' });
  showToast('All leads cleared.');
});

btnExportCSV.addEventListener('click', exportCSV);
btnExportXLSX.addEventListener('click', exportXLSX);

filterSearch.addEventListener('input', e => {
  filterText = e.target.value;
  renderTable();
});

filterColSel.addEventListener('change', e => {
  filterCol = e.target.value;
  renderTable();
});

btnColumnToggle.addEventListener('click', () => {
  columnsPanel.classList.toggle('hidden');
});

btnSelectAll.addEventListener('click', () => {
  ALL_COLUMNS.forEach(c => { if (c.key !== '_rowNum') visibleCols.add(c.key); });
  buildColumnsPanel();
  buildTableHeader();
  renderTable();
  saveVisibleCols();
});

btnSelectNone.addEventListener('click', () => {
  const always = new Set(['name', 'phoneStandard', 'email1', 'website', 'city', 'state', 'averageRating']);
  visibleCols = new Set([...always]);
  buildColumnsPanel();
  buildTableHeader();
  renderTable();
  saveVisibleCols();
});

btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });

btnSaveSettings.addEventListener('click', () => {
  settings.delay = parseInt($('settingDelay').value) || 1500;
  settings.maxListings = parseInt($('settingMaxListings').value) || 100;
  settings.webTimeout = parseInt($('settingWebTimeout').value) || 4000;
  localStorage.setItem('leadscraper_settings', JSON.stringify(settings));
  settingsModal.classList.add('hidden');
  showToast('Settings saved.', 'success');
});

// ---- Load saved column visibility --------------------------
loadVisibleCols();

// ---- Start --------------------------------------------------
init().catch(err => {
  console.error('[LeadScraper Dashboard]', err);
  showToast('Extension not available. Load as an unpacked extension.', 'error');
});

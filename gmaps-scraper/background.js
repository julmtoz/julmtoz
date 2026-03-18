// ============================================================
// LeadScraper Pro – Background Service Worker
// ============================================================

const STORAGE_KEY = 'leadscraper_leads';
const SESSION_KEY = 'leadscraper_session';

// ---- Session state (in-memory, synced to storage) ----------
let session = {
  active: false,
  keywords: [],
  currentKeywordIndex: 0,
  location: '',
  settings: {},
  stats: {
    totalLeads: 0,
    uniqueLeads: 0,
    emails: 0,
    phones: 0,
    startTime: null,
    elapsedSeconds: 0
  },
  mapsTabId: null,
  websiteQueue: [],
  processedUrls: new Set(),
  leads: []
};

// ---- Helpers ------------------------------------------------
function log(...args) {
  console.log('[LeadScraper BG]', ...args);
}

function broadcastToUI(type, data) {
  chrome.runtime.sendMessage({ type, data }).catch(() => {});
}

async function saveLeadsToStorage() {
  await chrome.storage.local.set({
    [STORAGE_KEY]: session.leads,
    [SESSION_KEY]: {
      active: session.active,
      keywords: session.keywords,
      currentKeywordIndex: session.currentKeywordIndex,
      location: session.location,
      settings: session.settings,
      stats: session.stats
    }
  });
}

async function loadFromStorage() {
  const data = await chrome.storage.local.get([STORAGE_KEY, SESSION_KEY]);
  if (data[STORAGE_KEY]) session.leads = data[STORAGE_KEY];
  if (data[SESSION_KEY]) {
    const s = data[SESSION_KEY];
    session.keywords = s.keywords || [];
    session.currentKeywordIndex = s.currentKeywordIndex || 0;
    session.location = s.location || '';
    session.settings = s.settings || {};
    session.stats = s.stats || session.stats;
    session.active = false; // never restore as active
  }
}

loadFromStorage();

// ---- Tab management ----------------------------------------
async function getOrCreateMapsTab() {
  if (session.mapsTabId) {
    try {
      const tab = await chrome.tabs.get(session.mapsTabId);
      if (tab) return session.mapsTabId;
    } catch {}
  }
  const tab = await chrome.tabs.create({
    url: 'https://www.google.com/maps/',
    active: false
  });
  session.mapsTabId = tab.id;
  return tab.id;
}

async function navigateMapsTab(url) {
  const tabId = await getOrCreateMapsTab();
  await chrome.tabs.update(tabId, { url });
  return tabId;
}

// ---- Start / Stop scraping ---------------------------------
async function startScraping(config) {
  if (session.active) return { error: 'Already running' };

  session.active = true;
  session.keywords = config.keywords.filter(k => k.trim());
  session.location = config.location || '';
  session.currentKeywordIndex = 0;
  session.settings = config.settings || {};
  session.stats = {
    totalLeads: 0,
    uniqueLeads: 0,
    emails: 0,
    phones: 0,
    startTime: Date.now(),
    elapsedSeconds: 0
  };
  session.websiteQueue = [];
  session.processedUrls = new Set(session.leads.map(l => l._url || ''));

  log('Starting scraping session', session.keywords, session.location);
  await saveLeadsToStorage();
  broadcastToUI('SESSION_STARTED', { keywords: session.keywords, location: session.location });

  // Start timer
  chrome.alarms.create('statsTimer', { periodInMinutes: 1 / 60 });

  await scrapeNextKeyword();
  return { ok: true };
}

async function stopScraping(reason = 'user') {
  session.active = false;
  chrome.alarms.clear('statsTimer');
  await saveLeadsToStorage();
  broadcastToUI('SESSION_STOPPED', { reason, stats: session.stats });
  log('Stopped scraping:', reason);
}

async function scrapeNextKeyword() {
  if (!session.active) return;

  if (session.currentKeywordIndex >= session.keywords.length) {
    log('All keywords done');
    await stopScraping('complete');
    return;
  }

  const keyword = session.keywords[session.currentKeywordIndex];
  const query = encodeURIComponent(keyword + (session.location ? ' ' + session.location : ''));
  const url = `https://www.google.com/maps/search/${query}/`;

  log(`Scraping keyword ${session.currentKeywordIndex + 1}/${session.keywords.length}: ${keyword}`);
  broadcastToUI('KEYWORD_START', {
    keyword,
    index: session.currentKeywordIndex,
    total: session.keywords.length
  });

  await navigateMapsTab(url);
  // Content script will send results back
}

// ---- Handle incoming lead data from content script ----------
async function handleBusinessData(businesses) {
  if (!Array.isArray(businesses)) businesses = [businesses];

  let newCount = 0;
  for (const biz of businesses) {
    const dedupKey = biz.placeId || biz.name + '|' + biz.fullAddress;
    if (session.processedUrls.has(dedupKey)) continue;
    session.processedUrls.add(dedupKey);

    biz._id = Date.now() + Math.random();
    biz._keyword = session.keywords[session.currentKeywordIndex] || '';
    biz._scrapedAt = new Date().toISOString();

    session.leads.push(biz);
    session.stats.totalLeads++;
    session.stats.uniqueLeads++;
    if (biz.email1 || biz.email2) session.stats.emails++;
    if (biz.phone) session.stats.phones++;

    // Queue website for enrichment
    if (biz.website && session.settings.scrapeWebsite !== false) {
      session.websiteQueue.push({ url: biz.website, leadId: biz._id });
    }

    newCount++;
  }

  if (newCount > 0) {
    await saveLeadsToStorage();
    broadcastToUI('NEW_LEADS', { leads: businesses, stats: session.stats });
  }
}

// ---- Website enrichment ------------------------------------
async function processWebsiteQueue() {
  if (!session.active || session.websiteQueue.length === 0) return;

  const { url, leadId } = session.websiteQueue.shift();
  log('Enriching website:', url);

  try {
    const tab = await chrome.tabs.create({ url, active: false });
    await new Promise(resolve => setTimeout(resolve, 4000));

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/website-scraper.js']
    });

    if (results && results[0] && results[0].result) {
      const webData = results[0].result;
      const lead = session.leads.find(l => l._id === leadId);
      if (lead) {
        Object.assign(lead, webData);
        if (webData.email1) session.stats.emails++;
        await saveLeadsToStorage();
        broadcastToUI('LEAD_ENRICHED', { leadId, webData, stats: session.stats });
      }
    }

    await chrome.tabs.remove(tab.id);
  } catch (err) {
    log('Website enrichment failed:', url, err.message);
  }

  // Process next in queue after delay
  if (session.websiteQueue.length > 0) {
    setTimeout(processWebsiteQueue, 2000);
  }
}

// ---- Message listener --------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'START_SCRAPING':
        sendResponse(await startScraping(msg.config));
        break;

      case 'STOP_SCRAPING':
        await stopScraping('user');
        sendResponse({ ok: true });
        break;

      case 'CLEAR_LEADS':
        session.leads = [];
        session.processedUrls = new Set();
        session.stats = { totalLeads: 0, uniqueLeads: 0, emails: 0, phones: 0, startTime: null, elapsedSeconds: 0 };
        await saveLeadsToStorage();
        broadcastToUI('LEADS_CLEARED', {});
        sendResponse({ ok: true });
        break;

      case 'GET_STATE':
        sendResponse({
          active: session.active,
          stats: session.stats,
          keywords: session.keywords,
          currentKeywordIndex: session.currentKeywordIndex,
          location: session.location,
          leadsCount: session.leads.length
        });
        break;

      case 'GET_LEADS':
        sendResponse({ leads: session.leads });
        break;

      case 'BUSINESS_DATA':
        // From content script - batch of businesses scraped
        await handleBusinessData(msg.businesses);
        if (session.settings.scrapeWebsite !== false) {
          setTimeout(processWebsiteQueue, 1000);
        }
        sendResponse({ ok: true });
        break;

      case 'KEYWORD_DONE':
        // Content script finished current keyword
        session.currentKeywordIndex++;
        broadcastToUI('KEYWORD_DONE', {
          keyword: msg.keyword,
          count: msg.count,
          index: session.currentKeywordIndex
        });
        await new Promise(r => setTimeout(r, 2000));
        await scrapeNextKeyword();
        sendResponse({ ok: true });
        break;

      case 'MAPS_PAGE_READY':
        // Content script loaded on Maps page and is asking if it should scrape
        if (session.active && session.currentKeywordIndex < session.keywords.length) {
          const keyword = session.keywords[session.currentKeywordIndex];
          sendResponse({ keyword });
        } else {
          sendResponse({ keyword: null });
        }
        break;

      case 'OPEN_DASHBOARD':
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
        sendResponse({ ok: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  return true; // async response
});

// ---- Tab close listener ------------------------------------
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === session.mapsTabId) {
    session.mapsTabId = null;
    if (session.active) {
      log('Maps tab closed during active session');
      stopScraping('tab_closed');
    }
  }
});

// ---- Alarm for stats timer ---------------------------------
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'statsTimer' && session.active && session.stats.startTime) {
    session.stats.elapsedSeconds = Math.floor((Date.now() - session.stats.startTime) / 1000);
    broadcastToUI('STATS_UPDATE', { stats: session.stats });
  }
});

log('Background service worker ready.');

// ============================================================
// LeadScraper Pro – Google Maps Content Script
// ============================================================

(function () {
  'use strict';

  if (window.__leadScraperInjected) return;
  window.__leadScraperInjected = true;

  const log = (...a) => console.log('[LeadScraper GMAPS]', ...a);

  let isScraping = false;
  let scrapedCount = 0;
  let aborted = false;

  // ---- Utilities --------------------------------------------
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function normalizePhone(raw) {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+1 (${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === '1') return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    return raw.trim();
  }

  function cleanWebsiteUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      return u.origin + u.pathname.replace(/\/$/, '');
    } catch { return url; }
  }

  function extractDomain(url) {
    if (!url) return '';
    try {
      return new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, '');
    } catch { return ''; }
  }

  function parseCoordinatesFromUrl(url) {
    const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    return { lat: '', lng: '' };
  }

  function parsePlaceIdFromUrl(url) {
    // ChI format from URL
    const m1 = url.match(/place\/[^/]+\/@[^/]+\/data=.*?1s(ChI[^!&]+)/);
    if (m1) return m1[1];
    // 0x hex format
    const m2 = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/i);
    if (m2) return m2[1];
    // place_id param
    const u = new URLSearchParams(url.split('?')[1] || '');
    return u.get('place_id') || '';
  }

  function parseCIDFromUrl(url) {
    // From ?cid= query param
    const m = url.match(/[?&]cid=(\d+)/);
    if (m) return m[1];
    // From data parameter: !1s0xHEX:0xHEX → convert second hex to decimal CID
    const hexMatch = url.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
    if (hexMatch) {
      try {
        const parts = hexMatch[1].split(':');
        if (parts[1]) return BigInt(parts[1]).toString(10);
      } catch {}
    }
    return '';
  }

  function parseKGMIDFromUrl(url) {
    // !16s%2Fg%2F[alphanumeric] in data segment
    const m = url.match(/!16s(%2Fg%2F[^!&]+)/);
    if (m) return decodeURIComponent(m[1]); // returns "/g/1tf_zfkh"
    // fallback: /g/ in pathname
    const m2 = url.match(/\/g\/([a-zA-Z0-9_-]+)/);
    return m2 ? `/g/${m2[1]}` : '';
  }

  function buildGMBUrl(name, placeId) {
    if (placeId) return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    return window.location.href.split('?')[0];
  }

  function buildPhotosUrl(placeId, name) {
    if (placeId) return `https://www.google.com/maps/place/?q=place_id:${placeId}&source=photos`;
    return '';
  }

  function buildReviewUrl(placeId) {
    // placeId here is the CID decimal (for search.google.com reviews)
    if (placeId) return `https://search.google.com/local/reviews?placeid=${placeId}`;
    return '';
  }

  function buildGoogleKnowledgeUrl(kgmid, cid) {
    if (kgmid) return `https://www.google.com/search?kgmid=${encodeURIComponent(kgmid)}`;
    if (cid) return `https://www.google.com/search?q=&ludocid=${cid}`;
    return '';
  }

  function parseAddressParts(fullAddress) {
    if (!fullAddress) return {};
    // Try to parse "123 Main St, City, ST 12345, USA" or "123 Main St, City, ST 12345"
    const parts = fullAddress.split(',').map(p => p.trim());
    const result = {
      streetAddress: '',
      city: '',
      municipality: '',
      state: '',
      zipCode: '',
      country: ''
    };

    if (parts.length >= 4) {
      result.streetAddress = parts[0];
      result.city = parts[1];
      const stateZip = parts[2].trim();
      const stateZipM = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (stateZipM) {
        result.state = stateZipM[1];
        result.zipCode = stateZipM[2];
      } else {
        result.state = stateZip;
      }
      result.country = parts[3];
    } else if (parts.length === 3) {
      result.streetAddress = parts[0];
      result.city = parts[1];
      const stateZip = parts[2].trim();
      const m = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (m) { result.state = m[1]; result.zipCode = m[2]; }
      else { result.state = stateZip; }
    } else if (parts.length === 2) {
      result.streetAddress = parts[0];
      result.city = parts[1];
    } else {
      result.streetAddress = fullAddress;
    }

    return result;
  }

  // ---- DOM Selectors (multi-variant for resilience) ---------
  function qs(root, ...selectors) {
    for (const sel of selectors) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch {}
    }
    return null;
  }

  function qsText(root, ...selectors) {
    const el = qs(root, ...selectors);
    return el ? el.textContent.trim() : '';
  }

  function qsAttr(root, attr, ...selectors) {
    const el = qs(root, ...selectors);
    return el ? (el.getAttribute(attr) || '').trim() : '';
  }

  // ---- Extract from detail panel ----------------------------
  async function extractDetailPanel() {
    const panel = document.querySelector('[role="main"]');
    if (!panel) return null;

    const currentUrl = window.location.href;
    const { lat, lng } = parseCoordinatesFromUrl(currentUrl);
    const placeId = parsePlaceIdFromUrl(currentUrl);
    const cid = parseCIDFromUrl(currentUrl);
    const kgmid = parseKGMIDFromUrl(currentUrl);

    // Name
    const name = qsText(panel,
      'h1.DUwDvf',
      'h1[data-attrid="title"]',
      '[jstcache="3"] h1',
      'h1'
    );

    // Address
    const addressEl = panel.querySelector('[data-item-id="address"] .fontBodyMedium') ||
      panel.querySelector('button[data-tooltip="Copy address"] .fontBodyMedium') ||
      panel.querySelector('[aria-label*="Address"]') ||
      panel.querySelector('[data-item-id="address"]');
    const fullAddress = addressEl ? addressEl.textContent.trim() : '';
    const addressParts = parseAddressParts(fullAddress);

    // Phone
    const phoneEl = panel.querySelector('[data-item-id*="phone"] .fontBodyMedium') ||
      panel.querySelector('button[data-tooltip="Copy phone number"] .fontBodyMedium') ||
      panel.querySelector('[aria-label*="Phone"] .fontBodyMedium') ||
      panel.querySelector('[data-tooltip*="phone"]');
    const rawPhone = phoneEl ? phoneEl.textContent.trim() : '';

    // Website
    const websiteEl = panel.querySelector('a[data-item-id="authority"]') ||
      panel.querySelector('a[aria-label*="website" i]') ||
      panel.querySelector('[data-item-id="authority"] a');
    let website = websiteEl ? (websiteEl.href || websiteEl.textContent.trim()) : '';
    // Google wraps links in a redirect; try to get the actual href
    if (website.includes('google.com/url?')) {
      try {
        const u = new URL(website);
        website = u.searchParams.get('q') || website;
      } catch {}
    }

    // Categories
    const catEls = panel.querySelectorAll('button.DkEaL, div.skqShb button, [jsaction*="category"] button, .fontBodyMedium.dmRWX');
    const categories = Array.from(catEls).map(e => e.textContent.trim()).filter(Boolean);

    // Rating & Reviews
    const ratingEl = panel.querySelector('div.F7nice > span > span[aria-hidden="true"]') ||
      panel.querySelector('.F7nice span[aria-hidden]') ||
      panel.querySelector('[aria-label*="stars"] span');
    const rating = ratingEl ? parseFloat(ratingEl.textContent) || '' : '';

    const reviewEl = panel.querySelector('div.F7nice > span > span[aria-label*="reviews"]') ||
      panel.querySelector('[aria-label*="review"]') ||
      panel.querySelector('.F7nice span[aria-label]');
    const reviewText = reviewEl ? reviewEl.getAttribute('aria-label') || '' : '';
    const reviewCount = reviewText.match(/[\d,]+/) ? parseInt(reviewText.match(/([\d,]+)/)[1].replace(',', '')) : '';

    // Claimed GMB
    const claimEl = panel.querySelector('[aria-label*="Own this business"]') ||
      panel.querySelector('[data-item-id*="claim"]') ||
      panel.querySelector('a[href*="business.google.com"]');
    const claimed = !claimEl; // if no "claim" button, it's claimed

    // Hours (async - may need to click expand button)
    const hours = await extractHours(panel);

    // Menu
    const menuEl = panel.querySelector('a[href*="menu"]') ||
      panel.querySelector('[aria-label*="menu" i][href]') ||
      panel.querySelector('[data-item-id*="menu"] a');
    const menuLink = menuEl ? menuEl.href : '';

    // Attributes sections (Accessibility, Service Options, etc.)
    const attributes = extractAttributes(panel);

    // Favicon (Google's hosted favicon for website domain)
    const domain = extractDomain(website);
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';

    // Build lead object
    const lead = {
      name: name || '',
      fullAddress,
      streetAddress: addressParts.streetAddress || '',
      city: addressParts.city || '',
      zipCode: addressParts.zipCode || '',
      municipality: addressParts.municipality || '',
      state: addressParts.state || '',
      country: addressParts.country || '',
      timeZone: '',
      phone: rawPhone,
      phoneStandard: normalizePhone(rawPhone),
      website: website,
      cleanWebsiteUrl: cleanWebsiteUrl(website),
      domain: extractDomain(website),
      // website-enriched fields (filled later)
      email1: '',
      email2: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
      twitter: '',
      yelp: '',
      faviconUrl,
      logoUrl: '',
      facebookPixelId: '',
      gtmContainerId: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      // GMaps fields
      firstCategory: categories[0] || '',
      secondCategory: categories[1] || '',
      claimedGmb: claimed,
      reviewsCount: reviewCount,
      averageRating: rating,
      ...hours,
      latitude: lat,
      longitude: lng,
      coordinates: lat && lng ? `${lat},${lng}` : '',
      placeId,
      googleFeatureId: '',
      menuLink,
      gmbUrl: buildGMBUrl(name, placeId),
      cid,
      googleKnowledgeUrl: buildGoogleKnowledgeUrl(kgmid, cid),
      kgmid,
      photosPageUrl: buildPhotosUrl(placeId, name),
      favicon: faviconUrl,
      reviewUrl: buildReviewUrl(placeId),
      // attributes
      accessibility: attributes.accessibility || '',
      serviceOptions: attributes.serviceOptions || '',
      crowd: attributes.crowd || '',
      amenities: attributes.amenities || '',
      fromBusiness: attributes.fromBusiness || '',
      payments: attributes.payments || '',
      offerings: attributes.offerings || '',
      // meta
      _url: currentUrl
    };

    // Extract UTMs from website URL
    if (website) {
      try {
        const u = new URL(website.startsWith('http') ? website : 'https://' + website);
        lead.utmSource = u.searchParams.get('utm_source') || '';
        lead.utmMedium = u.searchParams.get('utm_medium') || '';
        lead.utmCampaign = u.searchParams.get('utm_campaign') || '';
      } catch {}
    }

    return lead;
  }

  async function extractHours(panel) {
    const result = {
      hours: '',
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    };

    // Try to click the hours toggle to expand it
    const hoursToggle = panel.querySelector('button[data-item-id="oh"]') ||
      panel.querySelector('[jsaction*="openhours"]') ||
      panel.querySelector('[aria-label*="Sunday" i]')?.closest('button') ||
      panel.querySelector('[aria-label*="hour" i] button');

    if (hoursToggle) {
      try {
        hoursToggle.click();
        // Wait for hours table to appear via MutationObserver
        await new Promise(resolve => {
          const obs = new MutationObserver(() => {
            if (panel.querySelector('table.WgFkxc, table[class*="hours"]')) {
              obs.disconnect();
              resolve();
            }
          });
          obs.observe(panel, { childList: true, subtree: true });
          setTimeout(() => { obs.disconnect(); resolve(); }, 1500);
        });
      } catch {}
    }

    // Parse hours table
    const hoursTable = panel.querySelector('table.WgFkxc') ||
      panel.querySelector('table[class*="hour"]') ||
      panel.querySelector('[data-hide-tooltip-on-mouse-out] table') ||
      panel.querySelector('div.t39EBf table');

    if (hoursTable) {
      const rows = hoursTable.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const day = cells[0].textContent.trim().toLowerCase();
          const time = cells[1].textContent.trim();
          if (day.includes('monday') || day === 'mon') result.monday = time;
          else if (day.includes('tuesday') || day === 'tue') result.tuesday = time;
          else if (day.includes('wednesday') || day === 'wed') result.wednesday = time;
          else if (day.includes('thursday') || day === 'thu') result.thursday = time;
          else if (day.includes('friday') || day === 'fri') result.friday = time;
          else if (day.includes('saturday') || day === 'sat') result.saturday = time;
          else if (day.includes('sunday') || day === 'sun') result.sunday = time;
        }
      });
    }

    // Summary hours (e.g. "Open ⋅ Closes 9 PM")
    const hoursText = panel.querySelector('.t39EBf') ||
      panel.querySelector('[jsaction*="openhours"] .fontBodyMedium') ||
      panel.querySelector('[data-item-id="oh"] .fontBodyMedium');
    if (hoursText) result.hours = hoursText.textContent.trim();

    return result;
  }

  function extractAttributes(panel) {
    const result = {
      accessibility: '',
      serviceOptions: '',
      crowd: '',
      amenities: '',
      fromBusiness: '',
      payments: '',
      offerings: ''
    };

    // Google Maps organizes these under section headers
    const sections = panel.querySelectorAll('[jsaction*="section"] h2, .section-header-text, .VkWCPb');
    const attribMap = {
      'accessibility': 'accessibility',
      'service options': 'serviceOptions',
      'planning': 'crowd',
      'amenities': 'amenities',
      'from the business': 'fromBusiness',
      'payments': 'payments',
      'offerings': 'offerings',
      'crowd': 'crowd'
    };

    // Alternative: look for attribute chips
    const chips = panel.querySelectorAll('[aria-label][data-item-id] .fontBodyMedium, .iL3Qke .fontBodyMedium');
    chips.forEach(chip => {
      const text = chip.textContent.trim();
      const label = chip.closest('[aria-label]');
      if (label) {
        const section = (label.getAttribute('aria-label') || '').toLowerCase();
        for (const [key, prop] of Object.entries(attribMap)) {
          if (section.includes(key)) {
            if (result[prop]) result[prop] += ', ' + text;
            else result[prop] = text;
          }
        }
      }
    });

    return result;
  }

  // ---- Scroll and collect results ---------------------------
  async function scrollResultsList() {
    const feed = document.querySelector('[role="feed"]') ||
      document.querySelector('div[jsaction*="mouseover"] > div[tabindex]')?.parentElement;
    if (!feed) return;

    let lastHeight = 0;
    let stableCount = 0;
    const MAX_STABLE = 3;

    while (stableCount < MAX_STABLE && !aborted) {
      feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
      await sleep(1500);
      const newHeight = feed.scrollHeight;
      if (newHeight === lastHeight) stableCount++;
      else stableCount = 0;
      lastHeight = newHeight;

      // Check for "end of results" indicator
      const endText = document.body.innerText;
      if (endText.includes("You've reached the end of the list")) break;
    }
  }

  // ---- Get all listing elements ----------------------------
  function getListingElements() {
    return Array.from(
      document.querySelectorAll(
        'div[role="feed"] > div > div[jsaction],' +
        'div[role="feed"] div.Nv2PK,' +
        '[role="article"]'
      )
    ).filter(el => el.querySelector('a[href*="maps/place"]') || el.querySelector('[jsaction*="mouseover"]'));
  }

  // ---- Click a listing and wait for detail panel -----------
  async function clickListing(el) {
    // Find clickable anchor or the element itself
    const anchor = el.querySelector('a[href*="/maps/place"]') || el.querySelector('a[jsaction]') || el;
    anchor.click();
    await sleep(2500);

    // Wait for detail panel to load
    let attempts = 0;
    while (attempts < 10) {
      const panel = document.querySelector('[role="main"] h1.DUwDvf, [role="main"] h1');
      if (panel && panel.textContent.trim()) break;
      await sleep(500);
      attempts++;
    }
  }

  // ---- Main scraping loop ----------------------------------
  async function scrapeCurrentPage(keyword) {
    log('Starting scrape for keyword:', keyword);
    isScraping = true;
    scrapedCount = 0;

    await sleep(2000); // let page settle

    // Scroll to load all results
    await scrollResultsList();

    const listings = getListingElements();
    log(`Found ${listings.length} listings`);

    const businesses = [];

    for (let i = 0; i < listings.length; i++) {
      if (aborted) break;

      const el = listings[i];
      try {
        await clickListing(el);
        const lead = await extractDetailPanel();

        if (lead && lead.name) {
          businesses.push(lead);
          scrapedCount++;

          // Send in batches of 5
          if (businesses.length >= 5) {
            chrome.runtime.sendMessage({
              type: 'BUSINESS_DATA',
              businesses: [...businesses]
            });
            businesses.length = 0;
          }
        }

        // Random delay to avoid detection
        const delay = 1000 + Math.random() * 1500;
        await sleep(delay);

      } catch (err) {
        log('Error on listing:', i, err.message);
      }
    }

    // Send remaining
    if (businesses.length > 0) {
      chrome.runtime.sendMessage({
        type: 'BUSINESS_DATA',
        businesses
      });
    }

    isScraping = false;
    chrome.runtime.sendMessage({
      type: 'KEYWORD_DONE',
      keyword,
      count: scrapedCount
    });
  }

  // ---- Listen for messages from background -----------------
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_KEYWORD') {
      aborted = false;
      scrapeCurrentPage(msg.keyword);
      sendResponse({ ok: true });
    } else if (msg.type === 'ABORT_SCRAPE') {
      aborted = true;
      isScraping = false;
      sendResponse({ ok: true });
    } else if (msg.type === 'PING') {
      sendResponse({ ok: true, url: window.location.href });
    }
    return true;
  });

  // ---- Auto-start when URL indicates a search is loaded ----
  function checkAndStart() {
    const url = window.location.href;
    if (url.includes('/maps/search/') && !isScraping) {
      chrome.runtime.sendMessage({ type: 'MAPS_PAGE_READY', url }, resp => {
        if (resp && resp.keyword) {
          aborted = false;
          scrapeCurrentPage(resp.keyword);
        }
      });
    }
  }

  // Watch for navigation changes (Google Maps is a SPA)
  let lastUrl = '';
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(checkAndStart, 2000);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check
  setTimeout(checkAndStart, 3000);

  log('Content script ready on', window.location.href);
})();

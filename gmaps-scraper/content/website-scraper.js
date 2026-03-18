// ============================================================
// LeadScraper Pro – Website Enrichment Content Script
// Injected into business websites to extract email, social, etc.
// Returns result via executeScript return value.
// ============================================================

(function () {
  'use strict';

  const html = document.documentElement.innerHTML;
  const text = document.body ? document.body.innerText : '';

  // ---- Emails -----------------------------------------------
  function extractEmails() {
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const found = new Set();

    // From visible text
    const textMatches = text.match(emailRegex) || [];
    textMatches.forEach(e => found.add(e.toLowerCase()));

    // From mailto links
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const email = a.href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
      if (email) found.add(email);
    });

    // From page source
    const srcMatches = html.match(emailRegex) || [];
    srcMatches.forEach(e => {
      const lower = e.toLowerCase();
      if (!lower.includes('.png') && !lower.includes('.jpg') && !lower.includes('.gif') &&
          !lower.includes('.svg') && !lower.includes('.css') && !lower.includes('.js')) {
        found.add(lower);
      }
    });

    // Filter out common false positives
    const filtered = [...found].filter(e =>
      !e.includes('example.com') &&
      !e.includes('youremail') &&
      !e.includes('email@') &&
      !e.endsWith('.png') &&
      !e.endsWith('.jpg') &&
      e.includes('.') &&
      e.length < 100
    );

    return filtered.slice(0, 2);
  }

  // ---- Social links -----------------------------------------
  function extractSocialLinks() {
    const socials = {
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
      twitter: '',
      yelp: ''
    };

    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const patterns = {
      facebook: /facebook\.com\/(?!sharer|share|login|dialog|l\.php)[a-zA-Z0-9._%-]+/i,
      instagram: /instagram\.com\/[a-zA-Z0-9._%-]+/i,
      linkedin: /linkedin\.com\/(company|in)\/[a-zA-Z0-9._%-]+/i,
      youtube: /youtube\.com\/(channel|c|user|@)[a-zA-Z0-9._%-]+/i,
      tiktok: /tiktok\.com\/@[a-zA-Z0-9._%-]+/i,
      twitter: /(?:twitter|x)\.com\/[a-zA-Z0-9._%-]+/i,
      yelp: /yelp\.com\/biz\/[a-zA-Z0-9._%-]+/i
    };

    anchors.forEach(a => {
      const href = (a.href || '').toLowerCase();
      for (const [platform, regex] of Object.entries(patterns)) {
        if (!socials[platform] && regex.test(href)) {
          socials[platform] = a.href;
        }
      }
    });

    // Also search in page source
    for (const [platform, regex] of Object.entries(patterns)) {
      if (!socials[platform]) {
        const m = html.match(regex);
        if (m) {
          socials[platform] = 'https://' + m[0];
        }
      }
    }

    return socials;
  }

  // ---- Facebook Pixel ID ------------------------------------
  function extractFacebookPixelId() {
    // fbq('init', 'PIXEL_ID')
    const m = html.match(/fbq\(['"]init['"],\s*['"](\d{10,})['"]/);
    if (m) return m[1];
    // Meta pixel in noscript
    const m2 = html.match(/facebook\.com\/tr\?id=(\d{10,})/);
    if (m2) return m2[1];
    return '';
  }

  // ---- GTM Container ID -------------------------------------
  function extractGTMContainerId() {
    // GTM-XXXXXXX
    const m = html.match(/GTM-[A-Z0-9]{4,8}/);
    if (m) return m[0];
    return '';
  }

  // ---- Logo URL ---------------------------------------------
  function extractLogoUrl() {
    // Schema.org logo
    const schemas = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of schemas) {
      try {
        const data = JSON.parse(s.textContent);
        const objs = Array.isArray(data) ? data : [data];
        for (const obj of objs) {
          if (obj.logo) {
            if (typeof obj.logo === 'string') return obj.logo;
            if (obj.logo.url) return obj.logo.url;
          }
        }
      } catch {}
    }

    // OG image
    const og = document.querySelector('meta[property="og:image"]');
    if (og) return og.getAttribute('content') || '';

    // Logo in img
    const logoImg = document.querySelector('img[class*="logo" i], img[id*="logo" i], img[alt*="logo" i]');
    if (logoImg) return logoImg.src || '';

    return '';
  }

  // ---- Favicon URL ------------------------------------------
  function extractFaviconUrl() {
    const fav = document.querySelector('link[rel*="icon"]');
    if (fav) {
      const href = fav.href;
      if (href) return href;
    }
    return window.location.origin + '/favicon.ico';
  }

  // ---- Execute ----------------------------------------------
  const emails = extractEmails();
  const socials = extractSocialLinks();

  return {
    email1: emails[0] || '',
    email2: emails[1] || '',
    facebook: socials.facebook,
    instagram: socials.instagram,
    linkedin: socials.linkedin,
    youtube: socials.youtube,
    tiktok: socials.tiktok,
    twitter: socials.twitter,
    yelp: socials.yelp,
    faviconUrl: extractFaviconUrl(),
    logoUrl: extractLogoUrl(),
    facebookPixelId: extractFacebookPixelId(),
    gtmContainerId: extractGTMContainerId()
  };
})();

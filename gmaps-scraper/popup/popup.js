// LeadScraper Pro – Popup Script

(async () => {
  const statusDot   = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const pTotal      = document.getElementById('pTotal');
  const pEmails     = document.getElementById('pEmails');
  const btnOpenDash = document.getElementById('btnOpenDash');
  const btnStopPop  = document.getElementById('btnStopPop');

  // Load state
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (state) {
      if (state.active) {
        statusDot.className = 'dot running';
        statusLabel.textContent = 'Scraping...';
        btnStopPop.style.display = 'flex';
      } else {
        statusDot.className = 'dot idle';
        statusLabel.textContent = 'Ready';
      }
      if (state.stats) {
        pTotal.textContent = state.stats.totalLeads || 0;
        pEmails.textContent = state.stats.emails || 0;
      }
    }
  } catch {}

  btnOpenDash.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
    window.close();
  });

  btnStopPop.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'STOP_SCRAPING' });
    statusDot.className = 'dot idle';
    statusLabel.textContent = 'Stopped';
    btnStopPop.style.display = 'none';
  });
})();

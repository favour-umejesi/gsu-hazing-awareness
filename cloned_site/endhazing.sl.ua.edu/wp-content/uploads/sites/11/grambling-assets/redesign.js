/* Grambling End Hazing — inline site search (no page navigation until a result is chosen). */
(function () {
  function siteRoot() {
    var el = document.querySelector('link[href*="grambling-assets/redesign.css"]') ||
             document.querySelector('script[src*="grambling-assets/redesign.js"]');
    var u = el ? (el.href || el.src) : location.href;
    return u.replace(/wp-content\/uploads\/sites\/11\/grambling-assets\/redesign\.(css|js).*$/, '');
  }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function escHtml(s) { return s.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function init() {
    var btn = document.querySelector('.nav-search');
    var goldNav = document.querySelector('.gold-nav');
    if (!btn || !goldNav) return;

    var root = siteRoot();
    var panel = document.createElement('div');
    panel.className = 'search-panel';
    panel.innerHTML = '<input type="search" placeholder="Search this site…" aria-label="Search this site" autocomplete="off">' +
      '<div class="search-results" role="listbox"></div>';
    goldNav.style.position = 'relative';
    goldNav.appendChild(panel);

    var input = panel.querySelector('input');
    var results = panel.querySelector('.search-results');
    var index = null, loading = false;

    function load() {
      if (index || loading) return;
      if (window.__SEARCH_INDEX__) { index = window.__SEARCH_INDEX__; if (input.value.trim()) run(); return; }
      loading = true;
      // Load as a script (JSONP-style) so it works both over http and from the local file system.
      var s = document.createElement('script');
      s.src = root + 'search-index.js';
      s.onload = function () { index = window.__SEARCH_INDEX__ || []; loading = false; if (input.value.trim()) run(); };
      s.onerror = function () { loading = false; results.innerHTML = '<div class="search-empty">Search is unavailable right now.</div>'; };
      document.head.appendChild(s);
    }
    function open() { panel.classList.add('open'); load(); setTimeout(function () { input.focus(); }, 0); }
    function close() { panel.classList.remove('open'); }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      panel.classList.contains('open') ? close() : open();
    });

    function run() {
      var q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      if (!index) { results.innerHTML = '<div class="search-empty">Loading…</div>'; return; }
      var words = q.toLowerCase().split(/\s+/).filter(Boolean);
      var scored = [];
      index.forEach(function (it) {
        var title = (it.title || '').toLowerCase();
        var text = (it.text || '').toLowerCase();
        var score = 0;
        words.forEach(function (w) {
          if (title.indexOf(w) >= 0) score += 6;
          var c = text.split(w).length - 1;
          score += Math.min(c, 4);
        });
        if (score > 0) scored.push({ it: it, score: score });
      });
      scored.sort(function (a, b) { return b.score - a.score; });
      if (!scored.length) {
        results.innerHTML = '<div class="search-empty">No results for &ldquo;' + escHtml(q) + '&rdquo;.</div>';
        return;
      }
      var rx;
      try { rx = new RegExp('(' + words.map(esc).join('|') + ')', 'ig'); } catch (e) { rx = null; }
      results.innerHTML = scored.slice(0, 8).map(function (s) {
        var it = s.it;
        var title = (it.title || '').split('|')[0].trim();
        var text = it.text || '';
        var idx = text.toLowerCase().indexOf(words[0]);
        var start = Math.max(0, idx - 45);
        var snip = (start > 0 ? '…' : '') + text.substr(start, 150).trim() + '…';
        snip = escHtml(snip);
        if (rx) snip = snip.replace(rx, '<mark>$1</mark>');
        var ttl = escHtml(title);
        if (rx) ttl = ttl.replace(rx, '<mark>$1</mark>');
        return '<a href="' + root + it.path + '"><div class="r-title">' + ttl + '</div><div class="r-snip">' + snip + '</div></a>';
      }).join('');
    }

    var timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 110); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && !btn.contains(e.target)) close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

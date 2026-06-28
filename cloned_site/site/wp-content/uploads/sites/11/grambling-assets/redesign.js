/* Grambling Hazing Awareness & Prevention — inline site search (no page navigation until a result is chosen). */
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

  function initHeroIntro() {
    document.querySelectorAll('.hero').forEach(function (hero) {
      var container = hero.querySelector('.container');
      if (!container) return;
      hero.classList.add('hero--intro');
      Array.prototype.forEach.call(container.children, function (el, i) {
        var tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        el.classList.add('hero-intro-item');
        el.style.animationDelay = (0.08 + i * 0.12) + 's';
      });
    });
  }

  function boot() {
    init();
    initHeroIntro();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* =====================================================================
   Motion system — Framer-Motion-style animations for the static site.
   ---------------------------------------------------------------------
   Uses Motion (https://motion.dev) — the vanilla-JS animation library
   from the Framer Motion team — loaded via CDN for genuine spring/tween
   reveals, with a native (IntersectionObserver) fallback so the site
   degrades gracefully if the CDN is blocked. Everything is gated behind
   `prefers-reduced-motion` and a `.has-anim` flag, so the page is fully
   usable if any of this fails to load.
   ===================================================================== */
(function () {
  var MOTION_URL = 'https://cdn.jsdelivr.net/npm/motion@12/+esm';
  var EASE = [0.22, 0.61, 0.36, 1];
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Flag the document up front so CSS hidden-states engage before paint. */
  root.classList.add('has-anim');

  /* Containers whose direct children reveal as a staggered group. */
  var GROUP_SELECTORS = [
    '.resource-grid', '.card-grid', '.feature-grid', '.stat-grid', '.stat-flow',
    '.spectrum-grid', '.spectrum-cols', '.steps-grid', '.quote-grid', '.term-grid',
    '.tr-stats', '.btn-row', '.tag-row', '.social-row', '.bullet-list',
    '.contact-list', '.method-list', '.record-list', '.rules-list',
    '.violation-year__list', '.qa-grid', '.store-badges', '.alt-panels'
  ];
  /* Standalone blocks that reveal individually. */
  var ITEM_SELECTORS = [
    '.section-head', '.report-layout', '.split', '.media-band', '.cta-band',
    '.about-grid', '.callout-bar', '.info-callout', '.qa-box', '.definition-quote',
    '.clery-band', '.band-flex', '.qr-card', '.record-card', '.year-chip',
    '.lead', '.prose', '.myth-row', '.record-row', '.faq details', '.list-card'
  ];

  function inHero(el) { return !!el.closest('.hero, .alt-activities__intro'); }
  function hasTaggedAncestor(el) {
    for (var p = el.parentElement; p; p = p.parentElement) {
      if (p.hasAttribute('data-reveal')) return true;
    }
    return false;
  }
  function tag(el, delayMs) {
    el.setAttribute('data-reveal', '');
    el.__delay = delayMs || 0;
    if (delayMs) el.style.setProperty('--reveal-delay', delayMs + 'ms');
  }

  /* Build the list of reveal targets. Items first, then group children;
     anything inside an already-tagged element is skipped so reveals never
     nest (a block animates as a unit, not block + children). */
  function gatherTargets() {
    ITEM_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.hasAttribute('data-reveal') || inHero(el) || hasTaggedAncestor(el)) return;
        tag(el, 0);
      });
    });
    GROUP_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        if (inHero(group)) return;
        var i = 0;
        Array.prototype.forEach.call(group.children, function (child) {
          if (child.nodeType !== 1) return;
          var t = child.tagName;
          if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEMPLATE') return;
          if (child.hasAttribute('data-reveal') || hasTaggedAncestor(child)) return;
          tag(child, Math.min(i, 6) * 70);
          i++;
        });
      });
    });
    return Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  }

  function revealNow(targets) { targets.forEach(function (el) { el.classList.add('is-revealed'); }); }

  /* ---------- Stat count-up helpers ---------- */
  function parseStat(el) {
    var m = (el.textContent || '').trim().match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/);
    if (!m) return null;                     // skips "1 in 10", phone numbers, etc.
    var numStr = m[2];
    var target = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(target)) return null;
    return {
      prefix: m[1], suffix: m[3], target: target,
      decimals: (numStr.split('.')[1] || '').length,
      comma: numStr.indexOf(',') >= 0
    };
  }
  function formatStat(s, v) {
    var n = s.decimals ? v.toFixed(s.decimals)
                       : (s.comma ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)));
    return s.prefix + n + s.suffix;
  }
  function statEls() {
    return document.querySelectorAll('.stat-num, .tr-stat .n');
  }

  /* ---------- Path A: Motion engine (preferred) ---------- */
  function runMotion(M, targets) {
    var animate = M.animate, inView = M.inView;
    targets.forEach(function (el) {
      inView(el, function () {
        if (el.__seen) return; el.__seen = true;
        /* Resting state up front: guarantees the element is visible even if
           the animation is interrupted; Motion's inline opacity drives the
           tween on top, then we clear it so CSS hover transforms are free. */
        el.classList.add('is-revealed');
        animate(el, { opacity: [0, 1], y: [18, 0] },
          { duration: 0.6, delay: el.__delay / 1000, ease: EASE }
        ).finished.then(function () {
          el.style.opacity = ''; el.style.transform = ''; el.style.translate = '';
          el.style.removeProperty('--reveal-delay');
        }, function () {});
      }, { amount: 0.15, margin: '0px 0px -8% 0px' });
    });

    statEls().forEach(function (el) {
      var s = parseStat(el); if (!s) return;
      inView(el, function () {
        if (el.__counted) return; el.__counted = true;
        animate(0, s.target, {
          duration: 1.2, ease: EASE,
          onUpdate: function (v) { el.textContent = formatStat(s, v); }
        });
      }, { amount: 0.6 });
    });
  }

  /* ---------- Path B: native fallback (CDN blocked) ---------- */
  function runNative(targets) {
    root.classList.add('no-motion');
    if (!('IntersectionObserver' in window)) { revealNow(targets); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });

    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, s = el.__stat;
        sio.unobserve(el);
        var start = null;
        (function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = formatStat(s, s.target * eased);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now ? performance.now() : Date.now());
      });
    }, { threshold: 0.6 });
    statEls().forEach(function (el) {
      var s = parseStat(el); if (!s) return;
      el.__stat = s; sio.observe(el);   /* keep real number until count begins */
    });
  }

  function start() {
    if (reduce) return;                       // honor reduced-motion fully
    var targets = gatherTargets();

    var settled = false;
    function settle(fn) { if (settled) return; settled = true; clearTimeout(timer); fn(); }
    var timer = setTimeout(function () { settle(function () { runNative(targets); }); }, 700);

    if (typeof Promise === 'undefined' || !document.head) { settle(function () { runNative(targets); }); return; }
    import(MOTION_URL).then(function (M) {
      settle(function () { runMotion(M, targets); });
    }).catch(function () {
      settle(function () { runNative(targets); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

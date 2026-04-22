/* ══════════════════════════════════════════════════════════════════════
   APP — search, progress bar, copy buttons, mobile menu, fade-in,
   dynamic page title, hacker title reveal, boot log.
   ══════════════════════════════════════════════════════════════════════ */

/* ─── SEARCH ─── */
(function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  let noResultsEl = null;

  function filter() {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      document.querySelectorAll('[data-search]').forEach(el => { el.style.display = ''; });
      document.querySelectorAll('.nav-section, .nav-group-label').forEach(el => { el.style.display = ''; });
      if (noResultsEl) noResultsEl.style.display = 'none';
      return;
    }

    let visibleCount = 0;
    const sections = document.querySelectorAll('.section[data-search]');
    const matchedSections = new Set();

    sections.forEach(sec => {
      const topics = sec.querySelectorAll('.topic[data-search]');
      let hasMatch = false;
      const secTitle = sec.querySelector('.section-title')?.textContent?.toLowerCase() || '';
      const secMatched = secTitle.includes(q);

      topics.forEach(t => {
        const text = t.textContent.toLowerCase();
        const id = t.id.toLowerCase();
        const matches = text.includes(q) || id.includes(q) || secMatched;
        if (matches) {
          t.style.display = '';
          hasMatch = true;
          visibleCount++;
        } else {
          t.style.display = 'none';
        }
      });

      if (hasMatch || secMatched) {
        sec.style.display = '';
        matchedSections.add(sec.id);
      } else {
        sec.style.display = 'none';
      }
    });

    document.querySelectorAll('.part-divider[data-search]').forEach(pd => {
      const txt = pd.textContent.toLowerCase();
      pd.style.display = txt.includes(q) ? '' : 'none';
    });

    document.querySelectorAll('.nav-section').forEach(ns => {
      const id = ns.dataset.sectionId;
      ns.style.display = matchedSections.has(id) ? '' : 'none';
    });

    if (visibleCount === 0) {
      if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = 'search-no-results';
        document.getElementById('content').appendChild(noResultsEl);
      }
      const safeQ = q.replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]));
      noResultsEl.innerHTML = `<div class="err">no_results_found</div>grep: pattern <code style="color: var(--magenta); background: var(--bg-deep); padding: 2px 8px; border: 1px solid var(--line);">${safeQ}</code> returned 0 matches in the corpus.<br><br><span style="color: var(--fg-muted); font-size: 13px;">try: embedding · rag · kafka · kubernetes · llm · agent · mcp · celery · sharding</span>`;
      noResultsEl.style.display = 'block';
    } else if (noResultsEl) {
      noResultsEl.style.display = 'none';
    }
  }

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(filter, 150);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      filter();
      input.blur();
    }
  });
})();

/* ─── PROGRESS BAR ─── */
(function initProgress() {
  const fill = document.getElementById('progressFill');
  if (!fill) return;
  let ticking = false;
  function update() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    fill.style.width = pct + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();

/* ─── COPY BUTTONS ─── */
(function initCopy() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const wrap = btn.closest('.code-block');
    if (!wrap) return;
    const code = wrap.querySelector('pre, code');
    if (!code) return;
    const text = code.textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓ copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
      }).catch(() => {
        btn.textContent = 'copy failed';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
      });
    }
  });
})();

/* ─── MOBILE SIDEBAR TOGGLE ─── */
(function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (window.innerWidth > 1024) return;
    if (sidebar.classList.contains('open')
      && !sidebar.contains(e.target)
      && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
})();

/* ─── FADE-IN ON SCROLL ─── */
(function initFadeIn() {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px' });
  fadeEls.forEach(el => obs.observe(el));
})();

/* ─── DYNAMIC PAGE TITLE ─── */
(function initDynamicTitle() {
  const BASE = 'Backend & AI Architecture';
  document.title = BASE + ' // Komiljon Xamidjonov';

  const topics = document.querySelectorAll('.topic[id]');
  const titleObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const num = e.target.querySelector('.topic-id')?.textContent?.trim() || '';
      const h3 = e.target.querySelector('h3')?.textContent?.trim() || '';
      if (num && h3) {
        const short = h3.length > 42 ? h3.slice(0, 42) + '…' : h3;
        document.title = num + ' ' + short + ' | ' + BASE;
      }
    });
  }, { rootMargin: '-10% 0px -60% 0px' });

  topics.forEach(t => titleObs.observe(t));

  const hero = document.querySelector('.hero');
  if (hero) {
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        document.title = BASE + ' // Komiljon Xamidjonov';
      }
    }, { threshold: 0.3 }).observe(hero);
  }
})();

/* ─── BOOT LOG ─── */
console.log('%c> backend_architecture.guide — loaded', 'color: #00ff88; font-family: monospace; font-size: 14px;');
console.log('%c> komiljon_xamidjonov | 2026', 'color: #ff00aa; font-family: monospace;');
console.log('%c> sections: 17 | topics: 80+ | interactive viz: 6', 'color: #b87eff; font-family: monospace;');

/* ─── HACKER TITLE: colour spans + char-scramble reveal ─── */
(function hackerTitleInit() {
  const el = document.querySelector('.ht-text');
  if (!el) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const segments = [
    { t: 'BACKEND', cls: null },
    { t: ' & ', cls: 'ht-amp' },
    { t: 'AI', cls: 'ht-ai' },
    { t: ' ARXITEKTURA', cls: null },
  ];

  const fullText = segments.map(s => s.t).join('');

  function renderFinal() {
    let html = '';
    for (const seg of segments) {
      const safe = seg.t.replace(/&/g, '&amp;');
      if (seg.cls) html += `<span class="${seg.cls}">${safe}</span>`;
      else html += safe;
    }
    el.innerHTML = html;
  }

  if (reduceMotion) { renderFinal(); return; }

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>?/|[]{}';
  const REVEAL_SPEED = 38;
  const SCRAMBLE_ROUNDS = 3;

  let revealed = 0;
  const timers = {};

  function rand(str) { return str[Math.floor(Math.random() * str.length)]; }

  function renderText(revealedCount, scramblePosMap) {
    let html = '';
    let pos = 0;
    for (const seg of segments) {
      let segHtml = '';
      for (let i = 0; i < seg.t.length; i++, pos++) {
        let ch;
        if (pos < revealedCount) {
          ch = seg.t[i];
          if (ch === '&') ch = '&amp;';
        } else if (scramblePosMap && scramblePosMap[pos] !== undefined) {
          ch = scramblePosMap[pos];
          if (ch === '&') ch = '&amp;';
        } else {
          ch = ' ';
        }
        segHtml += ch;
      }
      if (seg.cls) html += `<span class="${seg.cls}">${segHtml}</span>`;
      else html += segHtml;
    }
    el.innerHTML = html;
  }

  renderText(0, {});

  function revealNext() {
    if (revealed >= fullText.length) {
      renderText(fullText.length, {});
      return;
    }

    let round = 0;
    const pos = revealed;

    function scrambleStep() {
      const scrambleMap = {};
      for (let j = pos; j < Math.min(pos + 3, fullText.length); j++) {
        scrambleMap[j] = rand(CHARS);
      }
      renderText(pos, scrambleMap);
      round++;
      if (round < SCRAMBLE_ROUNDS) {
        timers[pos] = setTimeout(scrambleStep, REVEAL_SPEED);
      } else {
        revealed++;
        const settleMap = {};
        for (let j = pos + 1; j < Math.min(pos + 4, fullText.length); j++) {
          settleMap[j] = rand(CHARS);
        }
        renderText(revealed, settleMap);
        setTimeout(revealNext, REVEAL_SPEED + 5);
      }
    }
    scrambleStep();
  }

  setTimeout(revealNext, 400);
})();

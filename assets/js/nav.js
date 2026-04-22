/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR NAVIGATION
   Renders only Part dividers (as group labels) + top-level sections.
   Topic-level entries (1.1, 1.2, 2.1 ...) are intentionally excluded.
   Clicking a section smooth-scrolls to it.
   ══════════════════════════════════════════════════════════════════════ */
(function buildNav() {
  const nav = document.getElementById('nav');
  const content = document.getElementById('content');
  if (!nav || !content) return;

  const frag = document.createDocumentFragment();
  const sectionLinks = [];

  content.querySelectorAll(':scope > .part-divider, :scope > .section[id]').forEach(node => {
    if (node.classList.contains('part-divider')) {
      const roman = node.querySelector('.part-divider-roman')?.textContent?.trim() || '';
      const title = node.querySelector('.part-divider-title')?.textContent?.trim() || '';
      const label = document.createElement('div');
      label.className = 'nav-group-label';
      label.textContent = roman + ' · ' + title;
      frag.appendChild(label);
      return;
    }

    const titleEl = node.querySelector('.section-title');
    if (!titleEl) return;
    const num = node.querySelector('.section-num')?.textContent?.trim().replace(/[^\d]/g, '') || '';
    const title = titleEl.textContent.trim();
    const secId = node.id;

    const link = document.createElement('a');
    link.className = 'nav-section-link';
    link.href = '#' + secId;
    link.dataset.sectionId = secId;
    link.innerHTML = `
      <span class="nav-section-num">${num}</span>
      <span class="nav-section-title">${title}</span>
    `;

    const wrap = document.createElement('div');
    wrap.className = 'nav-section';
    wrap.dataset.sectionId = secId;
    wrap.appendChild(link);
    frag.appendChild(wrap);

    sectionLinks.push({ link, id: secId });
  });

  nav.appendChild(frag);

  // Smooth-scroll + close mobile sidebar on click
  nav.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-section-link');
    if (!link) return;
    const id = link.dataset.sectionId;
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    }
    if (window.innerWidth <= 1024) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  });

  // Active-state tracking via IntersectionObserver
  const linkById = new Map();
  sectionLinks.forEach(({ link, id }) => linkById.set(id, link));

  const sections = document.querySelectorAll('.section[id]');
  const activeObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        sectionLinks.forEach(({ link }) => link.classList.remove('active'));
        const link = linkById.get(e.target.id);
        if (link) {
          link.classList.add('active');
          // Ensure the active link is visible in the sidebar's scrollable area
          const navEl = document.getElementById('nav');
          if (navEl) {
            const linkRect = link.getBoundingClientRect();
            const navRect = navEl.getBoundingClientRect();
            if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
              link.scrollIntoView({ block: 'nearest' });
            }
          }
        }
      }
    });
  }, { rootMargin: '-15% 0px -75% 0px' });
  sections.forEach(s => activeObs.observe(s));
})();

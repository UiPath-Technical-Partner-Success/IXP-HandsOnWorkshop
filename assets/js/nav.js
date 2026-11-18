/* =============================================
   IXP Hands-on Workshop - nav.js
   Sidebar, tabs, step cards, checklists, copy buttons
   ============================================= */

function storeGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (e) { return fallback; }
}
function storeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
}

/* ---- Light/dark theme toggle ----
   Light is the default. The inline script in each page's <head> applies a saved "dark"
   before the stylesheets load (no flash); this adds the header button. */
const THEME_KEY = 'tps-theme';
const THEME_ICONS =
  '<svg class="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
  '<svg class="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';

function applyTheme(theme) {
  const dark = theme === 'dark';
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.setAttribute('aria-pressed', String(dark));
    btn.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  });
}

function initThemeToggle() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Dark theme');
  btn.innerHTML = THEME_ICONS;
  (header.querySelector('nav') || header).appendChild(btn);
  applyTheme(document.documentElement.getAttribute('data-theme'));

  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
    applyTheme(next);
  });
  // Keep other open tabs of the site in step
  window.addEventListener('storage', e => { if (e.key === THEME_KEY) applyTheme(e.newValue); });
}

/* ---- Sidebar collapse toggle ---- */
const SIDEBAR_KEY = 'ixp-workshop-sidebar-collapsed';

function initSidebarCollapse() {
  const layout = document.querySelector('.course-layout');
  if (!layout) return;

  const btn = document.createElement('button');
  btn.className = 'sidebar-toggle-btn';
  btn.setAttribute('aria-label', 'Toggle sidebar');
  btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  document.body.appendChild(btn);

  function applyState(collapsed) {
    layout.classList.toggle('sidebar-collapsed', collapsed);
    btn.style.left = collapsed ? '8px' : '248px';
    btn.querySelector('svg').style.transform = collapsed ? 'rotate(180deg)' : 'rotate(0deg)';
    btn.setAttribute('aria-expanded', String(!collapsed));
  }

  applyState(storeGet(SIDEBAR_KEY, false) === true);

  btn.addEventListener('click', () => {
    const collapsed = !layout.classList.contains('sidebar-collapsed');
    storeSet(SIDEBAR_KEY, collapsed);
    applyState(collapsed);
  });
}

/* ---- Active sidebar link ---- */
function initActiveSidebarLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav__list a').forEach(a => {
    const href = a.getAttribute('href').split('#')[0].split('/').pop();
    if (href && href === current) a.classList.add('active');
  });
}

/* ---- Tabs ---- */
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabs => {
    const btns = Array.from(tabs.querySelectorAll('.tabs__btn'));
    const panels = Array.from(tabs.querySelectorAll('.tabs__panel'));
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        btns.forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', String(isActive));
        });
        panels.forEach(p => {
          const isActive = p.dataset.tabPanel === target;
          p.classList.toggle('active', isActive);
          p.hidden = !isActive;
        });
      });
    });
  });
}

/* ---- Step cards: tick off each step, remembered per browser ---- */
const STEPS_KEY = 'ixp-workshop-steps';

function initStepCards() {
  const done = storeGet(STEPS_KEY, {});

  function refreshCounters() {
    document.querySelectorAll('.steps-progress').forEach(bar => {
      const list = document.getElementById(bar.dataset.for);
      if (!list) return;
      const items = list.querySelectorAll('[data-step-id]');
      const checked = list.querySelectorAll('[data-step-id].done').length;
      bar.querySelector('.steps-count').textContent = `${checked} of ${items.length} done`;
      bar.querySelector('.steps-fill').style.width = (items.length ? Math.round(checked / items.length * 100) : 0) + '%';
    });
  }

  document.querySelectorAll('[data-step-id]').forEach(card => {
    const id = card.dataset.stepId;
    const box = card.querySelector('input[type=checkbox]');
    if (!box) return;
    box.checked = !!done[id];
    card.classList.toggle('done', box.checked);
    box.addEventListener('change', () => {
      const state = storeGet(STEPS_KEY, {});
      if (box.checked) state[id] = true; else delete state[id];
      storeSet(STEPS_KEY, state);
      card.classList.toggle('done', box.checked);
      refreshCounters();
    });
  });
  refreshCounters();
}

/* ---- Checklists ---- */
const CHECKLIST_KEY = 'ixp-workshop-checklists';

function initChecklists() {
  const state = storeGet(CHECKLIST_KEY, {});
  document.querySelectorAll('ul.checklist input[data-check-id]').forEach(box => {
    const id = box.dataset.checkId;
    const li = box.closest('li');
    box.checked = !!state[id];
    li.classList.toggle('checked', box.checked);
    box.addEventListener('change', () => {
      const s = storeGet(CHECKLIST_KEY, {});
      if (box.checked) s[id] = true; else delete s[id];
      storeSet(CHECKLIST_KEY, s);
      li.classList.toggle('checked', box.checked);
    });
  });
  document.querySelectorAll('[data-reset-checklist]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prefix = btn.dataset.resetChecklist;
      const s = storeGet(CHECKLIST_KEY, {});
      Object.keys(s).forEach(k => { if (k.startsWith(prefix)) delete s[k]; });
      storeSet(CHECKLIST_KEY, s);
      document.querySelectorAll(`ul.checklist input[data-check-id^="${prefix}"]`).forEach(box => {
        box.checked = false;
        box.closest('li').classList.remove('checked');
      });
    });
  });
}

/* ---- Copy buttons on code blocks ---- */
function initCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const text = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }).catch(() => { btn.textContent = 'Select & copy'; });
    });
    pre.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSidebarCollapse();
  initActiveSidebarLink();
  initTabs();
  initStepCards();
  initChecklists();
  initCopyButtons();
});

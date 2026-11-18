/* =============================================
   IXP Hands-on Workshop - progress.js
   Tracks page completion in localStorage
   Key: 'ixp-workshop-workshop-progress'
   Value: { "setup": true, "lab-1": true, ... }
   ============================================= */

const PROGRESS_KEY = 'ixp-workshop-workshop-progress';

const MODULES = [
  'setup', 'lab-1', 'lab-2', 'lab-3', 'lab-4'
];

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveProgress(data) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
}

function isCompleted(moduleId) {
  return !!getProgress()[moduleId];
}

function markComplete(moduleId) {
  const p = getProgress();
  p[moduleId] = true;
  saveProgress(p);
  dispatchProgressEvent(moduleId);
}

function markIncomplete(moduleId) {
  const p = getProgress();
  delete p[moduleId];
  saveProgress(p);
  dispatchProgressEvent(moduleId);
}

/* Clears completed labs and ticked lab steps in this browser; checklists keep their own Reset. */
function resetProgress() {
  if (!window.confirm('Reset your workshop progress? This clears the completed labs and the ticked lab steps in this browser.')) return;
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem('ixp-workshop-steps');
  } catch (e) { /* storage unavailable */ }
  location.reload();
}

function addResetButtons() {
  document.querySelectorAll('.sidebar-progress, .progress-summary-text').forEach(box => {
    if (box.querySelector('.progress-reset-btn')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'progress-reset-btn';
    b.textContent = 'Reset progress';
    b.addEventListener('click', resetProgress);
    box.appendChild(b);
  });
}

function getCompletedCount() {
  return MODULES.filter(id => isCompleted(id)).length;
}

function getProgressPercent() {
  return Math.round((getCompletedCount() / MODULES.length) * 100);
}

function dispatchProgressEvent(moduleId) {
  document.dispatchEvent(new CustomEvent('progressChanged', { detail: { moduleId } }));
}

/* ---- Update DOM progress bars (index page + sidebar) ---- */
function updateProgressUI() {
  const percent = getProgressPercent();
  const count = getCompletedCount();

  document.querySelectorAll('.progress-bar-fill:not(.steps-fill)').forEach(el => {
    el.style.width = percent + '%';
  });
  const numEl = document.getElementById('completed-count');
  const pctEl = document.getElementById('progress-percent');
  if (numEl) numEl.textContent = count;
  if (pctEl) pctEl.textContent = percent + '%';

  MODULES.forEach(id => {
    const card = document.querySelector(`.module-card[data-module="${id}"]`);
    if (!card) return;
    const statusEl = card.querySelector('.module-card__status');
    const btnEl = card.querySelector('.btn');
    // Remember the original card state so an undo can restore it.
    if (statusEl && card.dataset.origStatus === undefined) {
      card.dataset.origStatus = statusEl.textContent;
      card.dataset.origStatusClass = statusEl.className;
    }
    if (btnEl && card.dataset.origBtn === undefined) card.dataset.origBtn = btnEl.textContent;
    if (isCompleted(id)) {
      card.classList.add('completed');
      if (statusEl) { statusEl.textContent = '✓ Completed'; statusEl.className = 'module-card__status module-card__status--completed'; }
      if (btnEl) { btnEl.textContent = 'Review'; }
    } else {
      card.classList.remove('completed');
      if (statusEl) { statusEl.textContent = card.dataset.origStatus; statusEl.className = card.dataset.origStatusClass; }
      if (btnEl) { btnEl.textContent = card.dataset.origBtn; }
    }
  });

  document.querySelectorAll('.sidebar-nav__list a[data-page]').forEach(a => {
    const id = a.getAttribute('data-page');
    const existing = a.querySelector('.check');
    if (isCompleted(id) && !existing) {
      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = '✓';
      a.appendChild(check);
    } else if (!isCompleted(id) && existing) {
      existing.remove();
    }
  });
}

/* ---- Page: wire up "Mark as complete" button ---- */
function initModulePage(moduleId) {
  const btn = document.getElementById('mark-complete-btn');
  if (!btn) return;

  function updateBtn() {
    // Completed stays clickable: a second click undoes it.
    if (isCompleted(moduleId)) {
      btn.textContent = 'Completed';  // course.css adds the ✓ via .completed::before
      btn.classList.add('completed');
      btn.title = 'Click to mark as not complete';
    } else {
      btn.textContent = 'Mark as complete';
      btn.classList.remove('completed');
      btn.title = '';
    }
    btn.disabled = false;
  }
  updateBtn();

  btn.addEventListener('click', () => {
    if (isCompleted(moduleId)) {
      markIncomplete(moduleId);
      updateBtn();
      showToast('Marked as not complete');
    } else {
      markComplete(moduleId);
      updateBtn();
      showToast('🎉 Marked as complete!');
    }
  });
}

function showToast(msg) {
  const existing = document.getElementById('ixp-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'ixp-toast';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#065F46;color:#fff;padding:12px 20px;font-size:.875rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999;transition:opacity .3s;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 350); }, 3000);
}

document.addEventListener('DOMContentLoaded', updateProgressUI);
document.addEventListener('DOMContentLoaded', addResetButtons);
document.addEventListener('progressChanged', updateProgressUI);

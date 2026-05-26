/**
 * Nasaq — Options Page Logic
 *
 * المسؤوليات:
 *   - عرض كل المواقع المعدلة مع إمكانية التعديل/الحذف
 *   - تصدير/استيراد JSON
 *   - الإعدادات العامة
 *   - مسح كل البيانات
 */

'use strict';

const STORAGE_KEY = 'nasaq_v1';

const $ = (id) => document.getElementById(id);

const els = {
  toast: $('toast'),
  welcomeBanner: $('welcomeBanner'),
  dismissWelcome: $('dismissWelcome'),
  // tabs
  // sites
  sitesList: $('sitesList'),
  sitesEmpty: $('sitesEmpty'),
  siteSearch: $('siteSearch'),
  // general
  globalEnable: $('globalEnable'),
  showBadge: $('showBadge'),
  btnShortcuts: $('btnShortcuts'),
  // backup
  btnExport: $('btnExport'),
  importFile: $('importFile'),
  btnWipe: $('btnWipe'),
  // about
  lnkPrivacy: $('lnkPrivacy'),
  lnkLicense: $('lnkLicense'),
  lnkSource: $('lnkSource'),
  // modal
  modal: $('modal'),
  modalTitle: $('modalTitle'),
  modalCSS: $('modalCSS'),
  modalClose: $('modalClose'),
  modalCopy: $('modalCopy'),
  modalDelete: $('modalDelete'),
  modalEdit: $('modalEdit')
};

let settings = null;
let modalContext = null; // { host }

function showToast(msg, opts = {}) {
  els.toast.innerHTML = '';

  const textEl = document.createElement('span');
  textEl.className = 'toast-text';
  textEl.textContent = msg;
  els.toast.appendChild(textEl);

  if (opts.actionLabel && typeof opts.onAction === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = opts.actionLabel;
    btn.addEventListener('click', () => {
      hideToast();
      opts.onAction();
    });
    els.toast.appendChild(btn);
  }

  els.toast.hidden = false;
  requestAnimationFrame(() => els.toast.classList.add('show'));
  clearTimeout(showToast._t);
  const dur = opts.duration || (opts.actionLabel ? 5000 : 2000);
  showToast._t = setTimeout(hideToast, dur);
}

function hideToast() {
  els.toast.classList.remove('show');
  clearTimeout(showToast._t);
  setTimeout(() => { els.toast.hidden = true; }, 220);
}

/**
 * نمط تأكيد بنقرتين لزر أيقوني (icon-only):
 * النقرة الأولى: يهتزّ ويتحوّل لأحمر بارز
 * النقرة الثانية خلال 3 ثوانٍ: ينفذ الإجراء
 */
function setupConfirmIconBtn(btn, onConfirm) {
  if (!btn) return;
  let pending = false;
  let timer = null;
  const originalTitle = btn.title || '';

  function reset() {
    pending = false;
    clearTimeout(timer);
    btn.classList.remove('confirm-pending-icon');
    btn.title = originalTitle;
    document.removeEventListener('click', onOutside, true);
  }
  function onOutside(e) {
    if (!btn.contains(e.target)) reset();
  }

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!pending) {
      pending = true;
      btn.classList.add('confirm-pending-icon');
      btn.title = 'اضغط مرة أخرى للتأكيد';
      timer = setTimeout(reset, 3000);
      setTimeout(() => document.addEventListener('click', onOutside, true), 50);
    } else {
      reset();
      try { await onConfirm(); } catch (err) { console.warn(err); }
    }
  });
}

/**
 * نمط تأكيد بنقرتين لزر نصّي (text button).
 */
function setupConfirmTextBtn(btn, onConfirm, opts = {}) {
  if (!btn) return;
  const defaultLabel = opts.defaultLabel || btn.textContent.trim();
  const confirmLabel = opts.confirmLabel || 'اضغط للتأكيد';
  let pending = false;
  let timer = null;
  const originalHTML = btn.innerHTML;

  function reset() {
    pending = false;
    clearTimeout(timer);
    btn.classList.remove('confirm-pending');
    btn.innerHTML = originalHTML;
    document.removeEventListener('click', onOutside, true);
  }
  function onOutside(e) {
    if (!btn.contains(e.target)) reset();
  }

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!pending) {
      pending = true;
      btn.classList.add('confirm-pending');
      btn.textContent = confirmLabel;
      timer = setTimeout(reset, 3000);
      setTimeout(() => document.addEventListener('click', onOutside, true), 50);
    } else {
      reset();
      try { await onConfirm(); } catch (err) { console.warn(err); }
    }
  });
}

function sendBg(message) {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(message, resp => {
        if (chrome.runtime.lastError) return resolve({ ok: false });
        resolve(resp || { ok: false });
      });
    } catch { resolve({ ok: false }); }
  });
}

async function loadSettings() {
  const resp = await sendBg({ type: 'nasaq:get-settings' });
  settings = resp.settings || {};
}

async function saveSettings() {
  await sendBg({ type: 'nasaq:save-settings', settings });
}

// ============================================================
// Welcome banner
// ============================================================

function checkWelcome() {
  const params = new URLSearchParams(location.search);
  if (params.get('welcome') === '1') {
    els.welcomeBanner.hidden = false;
  }
  els.dismissWelcome.addEventListener('click', () => {
    els.welcomeBanner.hidden = true;
    // remove ?welcome from URL
    const u = new URL(location.href);
    u.searchParams.delete('welcome');
    history.replaceState({}, '', u.toString());
  });
}

// ============================================================
// Tabs
// ============================================================

function bindTabs() {
  document.querySelectorAll('.otab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.otab').forEach(x => x.classList.remove('otab-active'));
      t.classList.add('otab-active');
      const name = t.dataset.otab;
      document.querySelectorAll('.opanel').forEach(p => {
        p.hidden = p.dataset.opanel !== name;
      });
    });
  });
}

// ============================================================
// Sites list
// ============================================================

function renderSites(filter = '') {
  const styles = settings.styles || {};
  const enabled = settings.enabledSites || {};
  const hosts = Object.keys(styles).sort();

  const filtered = filter
    ? hosts.filter(h => h.toLowerCase().includes(filter.toLowerCase()))
    : hosts;

  els.sitesList.innerHTML = '';

  if (!filtered.length) {
    els.sitesList.appendChild(els.sitesEmpty);
    if (filter) {
      els.sitesEmpty.querySelector('h3').textContent = 'لا توجد نتائج';
      els.sitesEmpty.querySelector('p').textContent = `لم نجد مواقع تطابق "${filter}"`;
    } else {
      els.sitesEmpty.querySelector('h3').textContent = 'لا يوجد مواقع مُعدَّلة بعد';
      els.sitesEmpty.querySelector('p').textContent = 'افتح أي موقع وعدّله من اللوحة الجانبية، ثم اضغط حفظ — وسيظهر هنا.';
    }
    return;
  }

  for (const host of filtered) {
    const style = styles[host] || {};
    const isOn = !!enabled[host];
    const updated = style.updatedAt
      ? new Date(style.updatedAt).toLocaleDateString('ar-EG-u-nu-latn', {
          year: 'numeric', month: 'short', day: 'numeric'
        })
      : '—';
    const cssLen = (style.basicCSS?.length || 0) + (style.codeCSS?.length || 0);

    const row = document.createElement('div');
    row.className = 'site-row';
    row.innerHTML = `
      <div class="site-favicon">
        <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32" alt="" onerror="this.style.display='none'">
      </div>
      <div class="site-info-block">
        <div class="site-host">${host}</div>
        <div class="site-meta">
          <span>آخر تعديل: ${updated}</span>
          <span>·</span>
          <span>${cssLen} حرف CSS</span>
        </div>
      </div>
      <span class="site-status ${isOn ? 'on' : 'off'}">${isOn ? 'مُفعَّل' : 'مُعطَّل'}</span>
      <div class="site-actions">
        <button class="iconbtn" data-act="view" title="عرض CSS">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="iconbtn" data-act="toggle" title="${isOn ? 'تعطيل' : 'تفعيل'}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </button>
        <button class="iconbtn" data-act="delete" title="حذف">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    row.querySelector('[data-act="view"]').addEventListener('click', () => openModal(host));
    row.querySelector('[data-act="toggle"]').addEventListener('click', async () => {
      await sendBg({ type: 'nasaq:toggle-site', host });
      await loadSettings();
      renderSites(els.siteSearch.value);
    });
    const deleteBtn = row.querySelector('[data-act="delete"]');
    setupConfirmIconBtn(deleteBtn, async () => {
      await sendBg({ type: 'nasaq:delete-site-style', host });
      await loadSettings();
      renderSites(els.siteSearch.value);
      showToast(`تم حذف ${host}`);
    });

    els.sitesList.appendChild(row);
  }
}

function bindSiteSearch() {
  els.siteSearch.addEventListener('input', () => {
    renderSites(els.siteSearch.value.trim());
  });
}

// ============================================================
// Modal
// ============================================================

function openModal(host) {
  modalContext = { host };
  const style = settings.styles?.[host] || {};
  const combined = [style.basicCSS, style.codeCSS].filter(Boolean).join('\n\n');
  els.modalTitle.textContent = host;
  els.modalCSS.textContent = combined || '/* لا يوجد CSS محفوظ */';
  els.modal.hidden = false;
}

function closeModal() {
  els.modal.hidden = true;
  modalContext = null;
}

function bindModal() {
  els.modalClose.addEventListener('click', closeModal);
  els.modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  els.modalCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(els.modalCSS.textContent);
      showToast('تم نسخ CSS');
    } catch { showToast('تعذر النسخ'); }
  });
  setupConfirmTextBtn(els.modalDelete, async () => {
    if (!modalContext) return;
    const host = modalContext.host;
    await sendBg({ type: 'nasaq:delete-site-style', host });
    await loadSettings();
    renderSites(els.siteSearch.value);
    closeModal();
    showToast(`تم حذف ${host}`);
  }, {
    defaultLabel: 'حذف الموقع',
    confirmLabel: 'اضغط للتأكيد'
  });
  els.modalEdit.addEventListener('click', () => {
    showToast('افتح الموقع ثم اللوحة الجانبية');
    closeModal();
  });
}

// ============================================================
// General
// ============================================================

function bindGeneral() {
  els.globalEnable.checked = settings.enabled !== false;
  els.globalEnable.addEventListener('change', async () => {
    settings.enabled = els.globalEnable.checked;
    await saveSettings();
    showToast(settings.enabled ? 'تم تفعيل نَسَق' : 'تم تعطيل Nasaq');
  });

  els.showBadge.checked = settings.ui?.showBadge !== false;
  els.showBadge.addEventListener('change', async () => {
    settings.ui = settings.ui || {};
    settings.ui.showBadge = els.showBadge.checked;
    await saveSettings();
  });

  els.btnShortcuts.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

// ============================================================
// Backup
// ============================================================

function bindBackup() {
  els.btnExport.addEventListener('click', () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'Nasaq',
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nasaq-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير النسخة الاحتياطية');
  });

  els.importFile.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.app !== 'Nasaq' || !data.settings) {
        throw new Error('ملف غير صالح');
      }
      if (!confirm('سيستبدل هذا كل إعداداتك الحالية. هل أنت متأكد؟')) {
        e.target.value = '';
        return;
      }
      settings = data.settings;
      await saveSettings();
      await loadSettings();
      renderSites();
      els.globalEnable.checked = settings.enabled !== false;
      showToast('تم استيراد النسخة الاحتياطية');
    } catch (err) {
      alert('فشل الاستيراد: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  setupConfirmTextBtn(els.btnWipe, async () => {
    await chrome.storage.local.remove(STORAGE_KEY);
    await loadSettings();
    renderSites();
    els.globalEnable.checked = true;
    showToast('تم مسح كل البيانات');
  }, {
    defaultLabel: 'مسح كل شيء',
    confirmLabel: 'متأكد؟ اضغط للحذف نهائيًا'
  });
}

// ============================================================
// About
// ============================================================

function bindAbout() {
  els.lnkPrivacy.addEventListener('click', (e) => {
    e.preventDefault();
    alert(`سياسة الخصوصية\n\nنَسَق لا تجمع أي بيانات شخصية:\n• كل الإعدادات والأنماط تُحفظ محليًا في chrome.storage.local\n• لا اتصال بأي خادم خارجي\n• لا تتبع، لا تحليلات، لا إعلانات\n• الخطوط مدمجة محليًا — لا تحميل من Google Fonts CDN\n\nالصلاحيات المطلوبة:\n• storage — لحفظ تفضيلاتك محليًا\n• sidePanel — لعرض اللوحة الجانبية\n• scripting — لحقن CSS في الصفحات\n• activeTab, host_permissions — لتطبيق التغييرات على المواقع التي تعدّلها`);
  });
  els.lnkLicense.addEventListener('click', (e) => {
    e.preventDefault();
    alert(`الترخيص — MIT License\n\nالخطوط المدمجة مرخّصة بـ OFL 1.1 أو Apache 2.0.\nراجع fonts/LICENSE.txt للتفاصيل.`);
  });
  els.lnkSource.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('الكود المصدري متاح في مجلد المشروع');
  });
}

// ============================================================
// Init
// ============================================================

async function init() {
  await loadSettings();
  checkWelcome();
  bindTabs();
  bindSiteSearch();
  bindGeneral();
  bindBackup();
  bindAbout();
  bindModal();
  renderSites();

  // أعد التحديث عند تغيّر التخزين
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
      await loadSettings();
      renderSites(els.siteSearch.value);
    }
  });
}

init();

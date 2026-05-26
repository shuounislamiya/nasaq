/**
 * Nasaq — Side Panel Logic
 *
 * المسؤوليات:
 *   - الحصول على التبويب النشط والإعدادات
 *   - بناء قواعد CSS من حقول Basic وتطبيقها live
 *   - إدارة محرر Code
 *   - حفظ النمط لكل موقع
 *   - تفعيل/تعطيل
 *   - التواصل مع picker
 */

'use strict';

const STORAGE_KEY = 'nasaq_v1';

const State = {
  tabId: null,
  host: null,
  url: null,
  title: null,
  favicon: null,
  settings: null,
  /**
   * النمط المُحرَّر حاليًا.
   * بنية:
   * {
   *   rules: { [selector]: { property: value, ... }, ... },
   *   codeCSS: "..."
   * }
   */
  draft: {
    rules: {},
    codeCSS: ''
  },
  /** آخر نسخة محفوظة لمقارنة dirty */
  saved: { rules: {}, codeCSS: '' },
  currentSelector: '',
  dirty: false,
  applyTimer: null
};

// ============================================================
// عناصر DOM
// ============================================================

const $ = (id) => document.getElementById(id);

const els = {
  favicon: $('favicon'),
  currentHost: $('currentHost'),
  enableSub: $('enableSub'),
  siteToggle: $('siteToggle'),
  btnPicker: $('btnPicker'),
  selectorInput: $('selectorInput'),
  btnClearSelector: $('btnClearSelector'),
  btnReset: $('btnReset'),
  btnOptions: $('btnOptions'),
  autosaveIndicator: $('autosaveIndicator'),
  toast: $('toast'),
  cssEditor: $('cssEditor'),
  btnFormatCSS: $('btnFormatCSS'),
  btnCopyCSS: $('btnCopyCSS'),
  // Basic controls
  fontFamily: $('fontFamily'),
  customFontField: $('customFontField'),
  customFontName: $('customFontName'),
  fontSize: $('fontSize'),
  lineHeight: $('lineHeight'),
  fontWeight: $('fontWeight'),
  textColorPicker: $('textColorPicker'),
  textColor: $('textColor'),
  textColorClear: $('textColorClear'),
  bgColorPicker: $('bgColorPicker'),
  bgColor: $('bgColor'),
  bgColorClear: $('bgColorClear'),
  displayMode: $('displayMode'),
  boxWidth: $('boxWidth'),
  boxHeight: $('boxHeight'),
  marginTop: $('marginTop'),
  marginRight: $('marginRight'),
  marginBottom: $('marginBottom'),
  marginLeft: $('marginLeft'),
  paddingTop: $('paddingTop'),
  paddingRight: $('paddingRight'),
  paddingBottom: $('paddingBottom'),
  paddingLeft: $('paddingLeft'),
  borderWidth: $('borderWidth'),
  borderStyle: $('borderStyle'),
  borderColorPicker: $('borderColorPicker'),
  borderColor: $('borderColor'),
  borderColorClear: $('borderColorClear'),
  borderRadius: $('borderRadius'),
  opacity: $('opacity'),
  opacityVal: $('opacityVal'),
  boxShadow: $('boxShadow'),
  cursor: $('cursor'),
  optArabic: $('optArabic')
};

// ============================================================
// أدوات مساعدة
// ============================================================

/**
 * يعرض toast مع زر "تراجع" اختياري.
 * @param {string} message - النص المعروض
 * @param {object} [opts]
 *   - actionLabel: نص زر الإجراء (مثل "تراجع")
 *   - onAction: دالة تُستدعى عند الضغط على الزر
 *   - duration: مدة الظهور بالمللي ثانية (افتراضي 1800 أو 5000 إن وُجد زر)
 */
function showToast(message, opts = {}) {
  els.toast.innerHTML = '';

  const textEl = document.createElement('span');
  textEl.className = 'toast-text';
  textEl.textContent = message;
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
  const dur = opts.duration || (opts.actionLabel ? 5000 : 1800);
  showToast._t = setTimeout(hideToast, dur);
}

function hideToast() {
  els.toast.classList.remove('show');
  clearTimeout(showToast._t);
  setTimeout(() => { els.toast.hidden = true; }, 250);
}

function sendBg(message) {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(message, (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(resp || { ok: false });
        }
      });
    } catch (e) {
      resolve({ ok: false, error: String(e) });
    }
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function escapeCSSValue(v) {
  if (v == null) return '';
  return String(v).replace(/[<>{}]/g, '');
}

/** يتحقق من صلاحية CSS selector */
function isValidSelector(sel) {
  if (!sel || !sel.trim()) return false;
  try {
    document.querySelector(sel);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// قائمة الخطوط المدمجة — 3 خطوط فقط (يجب أن تطابق inject.js)
// ============================================================

const BUNDLED_FONTS = {
  ar: [
    { family: 'Tajawal',              name: 'Tajawal — تجوّل' },
    { family: 'IBM Plex Sans Arabic', name: 'IBM Plex Sans Arabic' },
    { family: 'Amiri',                name: 'Amiri — أميري' }
  ]
};

function populateFonts() {
  function add(group, list) {
    if (!group) return;
    for (const f of list) {
      const opt = document.createElement('option');
      opt.value = f.family;
      opt.textContent = f.name;
      opt.style.fontFamily = `"${f.family}", sans-serif`;
      group.appendChild(opt);
    }
  }
  add(els.optArabic, BUNDLED_FONTS.ar);
}

// ============================================================
// التهيئة
// ============================================================

async function init() {
  populateFonts();
  await loadActiveTab();
  await loadSettings();
  bindUI();
  bindMessages();
  hydrateForm();
  setAutosaveStatus('saved'); // الحالة الأولية: لا تغييرات معلّقة
}

async function loadActiveTab() {
  const resp = await sendBg({ type: 'nasaq:get-active-tab' });
  if (resp.ok) {
    State.tabId = resp.tabId;
    State.host = resp.host;
    State.url = resp.url;
    State.title = resp.title;
    State.favicon = resp.favIconUrl;
    els.currentHost.textContent = resp.host || '— غير متاح —';
    els.currentHost.dir = 'ltr';
    setFavicon(resp.favIconUrl, resp.host);
  } else {
    els.currentHost.textContent = '— لا يوجد تبويب —';
    els.favicon.hidden = true;
  }
}

function setFavicon(favIconUrl, host) {
  // فضّل favicon من Chrome، ثم Google service، ثم اخفِ
  const fallback = host
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`
    : '';
  const url = favIconUrl || fallback;
  if (!url) {
    els.favicon.hidden = true;
    return;
  }
  els.favicon.hidden = false;
  els.favicon.src = url;
  els.favicon.onerror = () => {
    if (els.favicon.src !== fallback && fallback) {
      els.favicon.src = fallback;
    } else {
      els.favicon.hidden = true;
    }
  };
}

async function loadSettings() {
  const resp = await sendBg({ type: 'nasaq:get-settings' });
  State.settings = resp.settings;

  const host = State.host;
  if (!host) {
    // ربما chrome:// أو about:
    document.body.classList.add('site-disabled');
    els.siteToggle.checked = false;
    els.siteToggle.disabled = true;
    els.enableSub.textContent = 'هذه الصفحة لا تسمح بتطبيق الأنماط (داخلية)';
    return;
  }

  const enabled = !!State.settings.enabledSites?.[host];
  els.siteToggle.checked = enabled;
  document.body.classList.toggle('site-disabled', !enabled);
  els.enableSub.textContent = enabled
    ? 'الأنماط مطبَّقة على هذا الموقع'
    : 'عطّل الأنماط هنا فقط';

  // تحميل النمط المحفوظ
  const saved = State.settings.styles?.[host];
  if (saved) {
    State.saved = {
      rules: parseBasicCSS(saved.basicCSS || ''),
      codeCSS: saved.codeCSS || ''
    };
  } else {
    State.saved = { rules: {}, codeCSS: '' };
  }
  // ابدأ بنفس المحفوظ كـ draft
  State.draft = JSON.parse(JSON.stringify(State.saved));

  // selector افتراضي يطبّق على كل النصوص في الصفحة
  // (selector واحد لـ body لا يكفي، لأن كل عنصر يرث font-family إلا إن كان له صريح)
  const savedSelectors = Object.keys(State.saved.rules || {});
  State.currentSelector = savedSelectors[0] || 'html, body, body *';
  els.selectorInput.value = State.currentSelector;
  els.cssEditor.value = State.draft.codeCSS || '';
}

// ============================================================
// تحويل النمط: rules <-> CSS
// ============================================================

/**
 * يبني نص CSS من بنية rules
 * rules: { selector: { prop: value } }
 */
function buildBasicCSS(rules) {
  const parts = [];
  for (const [selector, props] of Object.entries(rules)) {
    if (!selector) continue;
    const entries = Object.entries(props).filter(([_, v]) => v != null && v !== '');
    if (!entries.length) continue;
    const lines = entries.map(([p, v]) => `  ${p}: ${escapeCSSValue(v)} !important;`).join('\n');
    parts.push(`${selector} {\n${lines}\n}`);
  }
  return parts.join('\n\n');
}

/**
 * يحلّل CSS بسيطة إلى rules
 * يدعم فقط الصيغة المُولَّدة من Basic (لكنه آمن لأي CSS عادي)
 */
function parseBasicCSS(css) {
  const out = {};
  if (!css) return out;
  const RE = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = RE.exec(css)) !== null) {
    const selector = m[1].trim().replace(/\s+/g, ' ');
    const body = m[2];
    const props = {};
    body.split(';').forEach(line => {
      const idx = line.indexOf(':');
      if (idx < 0) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      val = val.replace(/\s*!important\s*$/i, '').trim();
      if (key) props[key] = val;
    });
    if (Object.keys(props).length) out[selector] = props;
  }
  return out;
}

function buildFullCSS() {
  const basic = buildBasicCSS(State.draft.rules);
  const code  = State.draft.codeCSS || '';
  return [basic, code].filter(Boolean).join('\n\n');
}

// ============================================================
// تطبيق المعاينة الحيّة
// ============================================================

/**
 * تطبيق المعاينة الحيّة فورًا (بدون تأخير) — للاستجابة الفورية
 */
async function applyPreviewNow() {
  if (!State.tabId) return;
  if (!els.siteToggle.checked) {
    await sendBg({ type: 'nasaq:apply-live', tabId: State.tabId, css: '' });
    return;
  }
  const css = buildFullCSS();
  await sendBg({ type: 'nasaq:apply-live', tabId: State.tabId, css });
}

/**
 * الحفظ التلقائي: يحفظ النمط في chrome.storage بعد كل تغيير (debounced)
 * يضمن:
 *  - بقاء التغييرات بعد إعادة فتح الصفحة
 *  - مزامنة كل التبويبات على نفس الموقع
 *  - بقاء الـ rules نظيفة (يحذف الـ properties الفارغة تلقائيًا)
 */
const autoSave = debounce(async () => {
  if (!State.host) return;
  setAutosaveStatus('saving');
  const basicCSS = buildBasicCSS(State.draft.rules);
  const codeCSS  = State.draft.codeCSS;
  // إذا كانت الـ rules فارغة والكود فارغ → احذف النمط كاملاً
  if (!basicCSS.trim() && !codeCSS.trim()) {
    await sendBg({ type: 'nasaq:save-site-style', host: State.host,
      style: { basicCSS: '', codeCSS: '', updatedAt: Date.now() } });
  } else {
    await sendBg({ type: 'nasaq:save-site-style', host: State.host,
      style: { basicCSS, codeCSS, updatedAt: Date.now() } });
  }
  State.saved = JSON.parse(JSON.stringify(State.draft));
  setAutosaveStatus('saved');
}, 400);

/**
 * نضمن تطبيق المعاينة فورًا + الحفظ التلقائي بعد debounce قصير
 */
function applyAndSave() {
  applyPreviewNow();
  autoSave();
}

function setAutosaveStatus(status) {
  if (!els.autosaveIndicator) return;
  els.autosaveIndicator.classList.remove('saving', 'saved');
  els.autosaveIndicator.classList.add(status);
  const textEl = els.autosaveIndicator.querySelector('.autosave-text');
  if (textEl) {
    textEl.textContent = status === 'saving' ? 'جاري الحفظ' : 'محفوظ';
  }
}

// ============================================================
// ربط الواجهة
// ============================================================

function setRule(prop, value) {
  const sel = State.currentSelector || 'html, body, body *';
  if (!State.draft.rules[sel]) State.draft.rules[sel] = {};
  if (value == null || value === '') {
    // قيمة فارغة = حذف الخاصية تلقائيًا (لا تستلزم زر مسح)
    delete State.draft.rules[sel][prop];
    if (!Object.keys(State.draft.rules[sel]).length) {
      delete State.draft.rules[sel];
    }
  } else {
    State.draft.rules[sel][prop] = value;
  }
  applyAndSave();
}

function getRule(prop) {
  const sel = State.currentSelector || 'body';
  return State.draft.rules[sel]?.[prop] ?? '';
}

function bindSelectorInput() {
  els.selectorInput.addEventListener('input', e => {
    const v = e.target.value.trim();
    State.currentSelector = v;
    e.target.classList.toggle('invalid', v && !isValidSelector(v));
    updateQuickSelButtons();
    hydrateForm();
  });
  els.selectorInput.addEventListener('change', () => {
    if (!State.currentSelector) {
      State.currentSelector = 'html, body, body *';
      els.selectorInput.value = 'html, body, body *';
    }
    updateQuickSelButtons();
    hydrateForm();
  });
  els.btnClearSelector.addEventListener('click', () => {
    els.selectorInput.value = 'html, body, body *';
    State.currentSelector = 'html, body, body *';
    els.selectorInput.classList.remove('invalid');
    updateQuickSelButtons();
    hydrateForm();
  });

  // أزرار الاختصارات السريعة
  document.querySelectorAll('.qsel').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.dataset.sel;
      State.currentSelector = sel;
      els.selectorInput.value = sel;
      els.selectorInput.classList.remove('invalid');
      updateQuickSelButtons();
      hydrateForm();
    });
  });
}

function updateQuickSelButtons() {
  document.querySelectorAll('.qsel').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sel === State.currentSelector);
  });
}

function bindPicker() {
  els.btnPicker.addEventListener('click', async () => {
    if (!State.tabId) return showToast('لا يوجد تبويب نشط');
    els.btnPicker.classList.add('active');
    showToast('انقر على عنصر داخل الصفحة');
    const resp = await sendBg({ type: 'nasaq:start-picker', tabId: State.tabId });
    if (!resp.ok) {
      els.btnPicker.classList.remove('active');
      showToast('تعذر بدء أداة الاختيار');
    }
  });
}

function bindToggle() {
  els.siteToggle.addEventListener('change', async () => {
    if (!State.host) return;
    const enabled = els.siteToggle.checked;
    document.body.classList.toggle('site-disabled', !enabled);
    els.enableSub.textContent = enabled
      ? 'الأنماط مطبَّقة على هذا الموقع'
      : 'عطّل الأنماط هنا فقط';
    if (!State.settings.enabledSites) State.settings.enabledSites = {};
    if (enabled) {
      State.settings.enabledSites[State.host] = true;
    } else {
      delete State.settings.enabledSites[State.host];
    }
    setAutosaveStatus('saving');
    await sendBg({ type: 'nasaq:save-settings', settings: State.settings });
    setAutosaveStatus('saved');
  });
}

function bindTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
      const name = tab.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.hidden = p.dataset.panel !== name;
      });
      if (State.settings) {
        State.settings.ui = State.settings.ui || {};
        State.settings.ui.activeTab = name;
      }
    });
  });
}

function bindBasicControls() {
  // font family
  els.fontFamily.addEventListener('change', () => {
    const v = els.fontFamily.value;
    els.customFontField.hidden = v !== '__custom__';
    if (v === '__custom__') {
      setRule('font-family', els.customFontName.value
        ? `"${els.customFontName.value.replace(/"/g, '')}"` : '');
    } else if (v) {
      const fallback = isArabicFont(v) ? ', system-ui, sans-serif' : ', system-ui, sans-serif';
      setRule('font-family', `"${v}"${fallback}`);
    } else {
      setRule('font-family', '');
    }
  });
  els.customFontName.addEventListener('input', () => {
    const v = els.customFontName.value.trim();
    setRule('font-family', v ? `"${v.replace(/"/g, '')}", system-ui, sans-serif` : '');
  });

  // الحجم — select dropdown (px تلقائي)
  els.fontSize.addEventListener('change', () => {
    const v = els.fontSize.value;
    setRule('font-size', v ? `${v}px` : '');
  });

  // ارتفاع السطر — select dropdown (رقم بلا وحدة)
  els.lineHeight.addEventListener('change', () => {
    setRule('line-height', els.lineHeight.value || '');
  });

  els.fontWeight.addEventListener('change', () => {
    setRule('font-weight', els.fontWeight.value);
  });

  // radio groups
  function bindRadios(name, prop, transformer) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
      r.addEventListener('change', () => {
        if (r.checked) {
          const v = transformer ? transformer(r.value) : r.value;
          setRule(prop, v);
        }
      });
    });
  }
  bindRadios('fontStyle', 'font-style');
  bindRadios('textDecoration', 'text-decoration');
  bindRadios('textAlign', 'text-align');

  // === الاتجاه (Direction) — يُطبَّق على html, body مباشرة بغض النظر عن selector ===
  const DIRECTION_SELECTOR = 'html, body';
  document.querySelectorAll('.dir-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir || '';
      setDirectionRule(dir);
      refreshDirectionButtons();
    });
  });

  function setDirectionRule(dir) {
    // اضمن وجود الـ rules بـ selector الـ HTML/BODY
    if (!State.draft.rules[DIRECTION_SELECTOR]) {
      State.draft.rules[DIRECTION_SELECTOR] = {};
    }
    if (!dir) {
      delete State.draft.rules[DIRECTION_SELECTOR]['direction'];
      delete State.draft.rules[DIRECTION_SELECTOR]['unicode-bidi'];
      if (!Object.keys(State.draft.rules[DIRECTION_SELECTOR]).length) {
        delete State.draft.rules[DIRECTION_SELECTOR];
      }
    } else {
      State.draft.rules[DIRECTION_SELECTOR]['direction'] = dir;
      // unicode-bidi: plaintext للنمط auto لضمان عرض صحيح للنصوص المختلطة
      if (dir === 'auto') {
        State.draft.rules[DIRECTION_SELECTOR]['unicode-bidi'] = 'plaintext';
      } else {
        delete State.draft.rules[DIRECTION_SELECTOR]['unicode-bidi'];
      }
    }
    applyAndSave();
  }

  document.querySelectorAll('input[name="visibility"]').forEach(r => {
    r.addEventListener('change', () => {
      if (!r.checked) return;
      // visibility مخصّص: قيمتان عاديتان + قيمة "إزالة" التي تعني display:none
      if (r.value === '__display_none__') {
        setRule('display', 'none');
        setRule('visibility', '');
      } else if (r.value === '') {
        setRule('visibility', '');
        // لا نلمس display هنا — يبقى ما هو عليه
      } else {
        setRule('visibility', r.value);
        // أعد display إن كان مضبوطًا none من قبل
        const cur = getRule('display');
        if (cur === 'none') setRule('display', '');
      }
    });
  });

  // colors
  function bindColor(picker, text, clear, prop) {
    picker.addEventListener('input', () => {
      text.value = picker.value;
      setRule(prop, picker.value);
    });
    text.addEventListener('input', () => {
      const v = text.value.trim();
      setRule(prop, v);
      if (/^#[0-9a-f]{6}$/i.test(v) || /^#[0-9a-f]{3}$/i.test(v)) picker.value = expandHex(v);
    });
    clear.addEventListener('click', () => {
      text.value = '';
      setRule(prop, '');
    });
  }
  bindColor(els.textColorPicker, els.textColor, els.textColorClear, 'color');
  bindColor(els.bgColorPicker, els.bgColor, els.bgColorClear, 'background-color');
  bindColor(els.borderColorPicker, els.borderColor, els.borderColorClear, 'border-color');

  // layout
  els.displayMode.addEventListener('change', () => setRule('display', els.displayMode.value));
  els.boxWidth.addEventListener('input', () => setRule('width', els.boxWidth.value.trim()));
  els.boxHeight.addEventListener('input', () => setRule('height', els.boxHeight.value.trim()));

  // box-model
  function bindBoxSide(input, prop) {
    input.addEventListener('input', () => setRule(prop, input.value.trim()));
  }
  bindBoxSide(els.marginTop,    'margin-top');
  bindBoxSide(els.marginRight,  'margin-right');
  bindBoxSide(els.marginBottom, 'margin-bottom');
  bindBoxSide(els.marginLeft,   'margin-left');
  bindBoxSide(els.paddingTop,    'padding-top');
  bindBoxSide(els.paddingRight,  'padding-right');
  bindBoxSide(els.paddingBottom, 'padding-bottom');
  bindBoxSide(els.paddingLeft,   'padding-left');

  // border
  els.borderWidth.addEventListener('input', () => setRule('border-width', els.borderWidth.value.trim()));
  els.borderStyle.addEventListener('change', () => setRule('border-style', els.borderStyle.value));
  els.borderRadius.addEventListener('input', () => setRule('border-radius', els.borderRadius.value.trim()));

  // effects
  els.opacity.addEventListener('input', () => {
    const v = els.opacity.value;
    setRule('opacity', v);
    els.opacityVal.textContent = v;
  });
  els.boxShadow.addEventListener('input', () => setRule('box-shadow', els.boxShadow.value.trim()));
  els.cursor.addEventListener('change', () => setRule('cursor', els.cursor.value));
}

/**
 * يحدّث أزرار الاتجاه ليعكس القيمة المحفوظة في html, body
 */
function refreshDirectionButtons() {
  const dirRule = State.draft.rules['html, body']?.['direction'] || '';
  document.querySelectorAll('.dir-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.dir || '') === dirRule);
  });
}

/**
 * يضبط قيمة select. لو القيمة غير موجودة كخيار، يضيفها كـ option جديد
 * (يدعم القيم المخصّصة المحفوظة سابقًا من Code tab مثلاً).
 */
function setSelectValue(select, val) {
  if (val === '' || val == null) {
    select.value = '';
    // نظّف أي options مخصّصة سابقة
    Array.from(select.options).forEach(o => {
      if (o.dataset.custom === '1') o.remove();
    });
    return;
  }
  const exists = Array.from(select.options).some(o => o.value === String(val));
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = String(val);
    opt.textContent = `${val} (مخصّص)`;
    opt.dataset.custom = '1';
    select.appendChild(opt);
  }
  select.value = String(val);
}

function isArabicFont(family) {
  const ar = ['Tajawal','IBM Plex Sans Arabic','Cairo','Noto Naskh Arabic','Amiri','Readex Pro','Vazirmatn','Markazi Text'];
  return ar.includes(family);
}

function expandHex(h) {
  if (h.length === 4) {
    return '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
  }
  return h;
}

function bindCodeEditor() {
  // محرر الكود — autosave فوري بدون زر حفظ
  els.cssEditor.addEventListener('input', () => {
    State.draft.codeCSS = els.cssEditor.value;
    applyAndSave();
  });

  // Tab key inserts two spaces instead of changing focus
  els.cssEditor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const v = e.target.value;
      e.target.value = v.slice(0, start) + '  ' + v.slice(end);
      e.target.selectionStart = e.target.selectionEnd = start + 2;
      els.cssEditor.dispatchEvent(new Event('input'));
    }
  });

  els.btnFormatCSS.addEventListener('click', () => {
    els.cssEditor.value = formatCSS(els.cssEditor.value);
    State.draft.codeCSS = els.cssEditor.value;
    applyAndSave();
    showToast('تم تنسيق الكود');
  });

  els.btnCopyCSS.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildFullCSS());
      showToast('تم نسخ كل CSS');
    } catch {
      showToast('تعذر النسخ');
    }
  });
}

/** منسّق CSS بسيط */
function formatCSS(css) {
  return css
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/;\s*(?!})/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function bindFooter() {
  setupConfirmButton(els.btnReset, resetSite);
  els.btnOptions.addEventListener('click', () => {
    sendBg({ type: 'nasaq:open-options' });
  });
}

/**
 * يحوّل زرًا إلى نمط "تأكيد بنقرتين":
 *  - الضغط الأول → الزر يتحوّل لـ "اضغط مرة أخرى للتأكيد" بلون أحمر نابض
 *  - الضغط الثاني خلال 3 ثوانٍ → ينفّذ الإجراء
 *  - بعد 3 ثوانٍ بلا ضغط → يعود الزر لشكله الأصلي
 *  - الضغط خارج الزر → يلغي التأكيد
 *
 * يتطلب أن يحوي الزر:
 *   - data-default-label, data-confirm-label
 *   - <span class="btn-label"></span>
 */
function setupConfirmButton(btn, onConfirm) {
  if (!btn) return;
  const defaultLabel = btn.dataset.defaultLabel || btn.textContent.trim();
  const confirmLabel = btn.dataset.confirmLabel || 'اضغط مرة أخرى للتأكيد';
  const labelEl = btn.querySelector('.btn-label');
  if (labelEl) labelEl.textContent = defaultLabel;

  let pending = false;
  let timer = null;

  function reset() {
    pending = false;
    clearTimeout(timer);
    btn.classList.remove('pending');
    if (labelEl) labelEl.textContent = defaultLabel;
    document.removeEventListener('click', onOutside, true);
  }

  function onOutside(e) {
    if (!btn.contains(e.target)) reset();
  }

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!pending) {
      pending = true;
      btn.classList.add('pending');
      if (labelEl) labelEl.textContent = confirmLabel;
      timer = setTimeout(reset, 3000);
      // اسمح بالنقر خارج الزر للإلغاء
      setTimeout(() => document.addEventListener('click', onOutside, true), 50);
    } else {
      reset();
      try { await onConfirm(); } catch (err) { console.warn(err); }
    }
  });
}

async function resetSite() {
  if (!State.host) return;

  const hasRules = Object.keys(State.draft.rules || {}).length > 0;
  const hasCode = (State.draft.codeCSS || '').trim().length > 0;
  const wasEnabled = !!State.settings.enabledSites?.[State.host];
  if (!hasRules && !hasCode && !wasEnabled) {
    showToast('لا توجد تعديلات على هذا الموقع');
    return;
  }

  await sendBg({ type: 'nasaq:delete-site-style', host: State.host });
  State.draft = { rules: {}, codeCSS: '' };
  State.saved = { rules: {}, codeCSS: '' };
  if (State.settings.enabledSites) delete State.settings.enabledSites[State.host];
  els.cssEditor.value = '';
  hydrateForm();
  els.siteToggle.checked = false;
  document.body.classList.add('site-disabled');
  els.enableSub.textContent = 'عطّل الأنماط هنا فقط';
  showToast('تم إرجاع الموقع لإعداداته الافتراضية');
}

// ============================================================
// تعبئة الواجهة من draft للـ selector الحالي
// ============================================================

function hydrateForm() {
  const sel = State.currentSelector || 'html, body, body *';
  const r = State.draft.rules[sel] || {};

  // font
  const ff = (r['font-family'] || '').replace(/["']/g, '').split(',')[0].trim();
  const allFamilies = [
    ...BUNDLED_FONTS.ar.map(f => f.family),
    'system-ui','Arial','Tahoma','Segoe UI','Georgia','Times New Roman','Courier New'
  ];
  if (allFamilies.includes(ff)) {
    els.fontFamily.value = ff;
    els.customFontField.hidden = true;
  } else if (ff) {
    els.fontFamily.value = '__custom__';
    els.customFontField.hidden = false;
    els.customFontName.value = ff;
  } else {
    els.fontFamily.value = '';
    els.customFontField.hidden = true;
  }

  // font-size: استخرج الرقم فقط من قيمة مثل "20px"
  const fsVal = r['font-size'] || '';
  const fsMatch = fsVal.match(/^(-?\d*\.?\d+)/);
  setSelectValue(els.fontSize, fsMatch ? fsMatch[1] : '');

  // line-height: رقم بلا وحدة
  setSelectValue(els.lineHeight, r['line-height'] || '');

  els.fontWeight.value = r['font-weight'] || '';

  function setRadio(name, val) {
    const inputs = document.querySelectorAll(`input[name="${name}"]`);
    let matched = false;
    inputs.forEach(i => {
      if (i.value === val) { i.checked = true; matched = true; }
    });
    if (!matched) {
      inputs.forEach(i => { if (i.value === '') i.checked = true; });
    }
  }
  setRadio('fontStyle', r['font-style'] || '');
  setRadio('textDecoration', r['text-decoration'] || '');
  setRadio('textAlign', r['text-align'] || '');
  // الاتجاه يقرأ من selector ثابت (html, body) بغض النظر عن selector الحالي
  refreshDirectionButtons();
  // visibility مع display none
  if (r['display'] === 'none') {
    setRadio('visibility', '__display_none__');
  } else {
    setRadio('visibility', r['visibility'] || '');
  }

  // colors
  els.textColor.value = r['color'] || '';
  els.bgColor.value = r['background-color'] || '';
  els.borderColor.value = r['border-color'] || '';
  if (/^#[0-9a-f]{6}$/i.test(els.textColor.value)) els.textColorPicker.value = els.textColor.value;
  if (/^#[0-9a-f]{6}$/i.test(els.bgColor.value)) els.bgColorPicker.value = els.bgColor.value;
  if (/^#[0-9a-f]{6}$/i.test(els.borderColor.value)) els.borderColorPicker.value = els.borderColor.value;

  // layout
  els.displayMode.value = r['display'] || '';
  els.boxWidth.value = r['width'] || '';
  els.boxHeight.value = r['height'] || '';
  els.marginTop.value    = r['margin-top']    || '';
  els.marginRight.value  = r['margin-right']  || '';
  els.marginBottom.value = r['margin-bottom'] || '';
  els.marginLeft.value   = r['margin-left']   || '';
  els.paddingTop.value    = r['padding-top']    || '';
  els.paddingRight.value  = r['padding-right']  || '';
  els.paddingBottom.value = r['padding-bottom'] || '';
  els.paddingLeft.value   = r['padding-left']   || '';

  // border
  els.borderWidth.value = r['border-width'] || '';
  els.borderStyle.value = r['border-style'] || '';
  els.borderRadius.value = r['border-radius'] || '';

  // effects
  els.opacity.value = r['opacity'] != null && r['opacity'] !== '' ? r['opacity'] : 1;
  els.opacityVal.textContent = r['opacity'] || '—';
  els.boxShadow.value = r['box-shadow'] || '';
  els.cursor.value = r['cursor'] || '';
}

// ============================================================
// رسائل الاستقبال
// ============================================================

function bindMessages() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg?.type) return;
    switch (msg.type) {
      case 'nasaq:picker-selected': {
        els.btnPicker.classList.remove('active');
        State.currentSelector = msg.selector || 'body';
        els.selectorInput.value = State.currentSelector;
        els.selectorInput.classList.remove('invalid');
        hydrateForm();
        const tag = msg.tagName || 'عنصر';
        const previewText = (msg.preview || '').replace(/\s+/g, ' ').slice(0, 30);
        showToast(`تم اختيار ${tag}${previewText ? ' — ' + previewText : ''}`);
        break;
      }
      case 'nasaq:request-open-panel': {
        // لا نحتاج فعل شيء — اللوحة مفتوحة بالفعل
        break;
      }
    }
  });

  // عند تغيّر التبويب أعد التهيئة
  chrome.tabs?.onActivated?.addListener(async () => {
    await loadActiveTab();
    await loadSettings();
    hydrateForm();
  });
  chrome.tabs?.onUpdated?.addListener(async (tabId, info) => {
    if (tabId === State.tabId && info.url) {
      await loadActiveTab();
      await loadSettings();
      hydrateForm();
    }
  });
}

// ============================================================
// ربط كل شيء
// ============================================================

function bindUI() {
  bindToggle();
  bindSelectorInput();
  bindPicker();
  bindTabs();
  bindBasicControls();
  bindCodeEditor();
  bindFooter();
}

init();

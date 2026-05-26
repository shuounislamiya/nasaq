/**
 * Nasaq — Element Picker
 * يُحقن عند الطلب لاختيار عنصر من الصفحة
 *
 * يُمرَّر عبر chrome.scripting.executeScript
 * - يُظهر overlay فوق العنصر تحت المؤشر
 * - عند الضغط يحسب CSS selector فريد ومستقر
 * - يرسل النتيجة للوحة عبر background
 */

(() => {
  'use strict';

  // إذا كان هناك جلسة سابقة فعّالة، أوقفها
  if (window.__NASAQ_PICKER_ACTIVE__) {
    window.__NASAQ_PICKER_STOP__?.();
    return;
  }
  window.__NASAQ_PICKER_ACTIVE__ = true;

  const OVERLAY_ID = '__nasaq_picker_overlay__';
  const TOOLTIP_ID = '__nasaq_picker_tooltip__';
  const STYLE_ID   = '__nasaq_picker_styles__';

  // ============================================================
  // خوارزمية CSS Selector (مبنية على دروس @medv/finder + تخصيصات)
  // ============================================================

  const BLACKLIST_CLASS = [
    /^(css|sc|jss|emotion|chakra|mui|ant|MuiBox)-/i,
    /^[a-z]+-[a-z0-9]{5,}$/i,
    /^_[a-zA-Z0-9_-]{4,}$/,
    /^[a-z]{1,2}\d+_[a-z0-9]+$/i,
    /^[a-z0-9]{8,}$/i,
    /^nasaq/i
  ];

  const PREFERRED_ATTRS = [
    'data-testid', 'data-test', 'data-id', 'data-cy', 'data-qa',
    'aria-label', 'role', 'name', 'type'
  ];

  function cssEscape(str) {
    if (window.CSS?.escape) return CSS.escape(str);
    return String(str).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  function isStableClass(c) {
    if (!c || c.length < 2 || c.length > 50) return false;
    if (!/^[a-zA-Z_][\w-]*$/.test(c) && !/[؀-ۿ]/.test(c)) {
      // اسمح بأسماء طبيعية أو عربية
      return /^[a-zA-Z][\w-]*$/.test(c);
    }
    return !BLACKLIST_CLASS.some(rx => rx.test(c));
  }

  function isStableId(id) {
    if (!id) return false;
    if (/\d{4,}/.test(id)) return false;
    if (id.length > 60) return false;
    if (/^nasaq/i.test(id)) return false;
    return /^[a-zA-Z][\w-]*$/.test(id);
  }

  function getCount(root, sel) {
    try {
      return root.querySelectorAll(sel).length;
    } catch { return -1; }
  }

  function selectorForElement(el) {
    if (!(el instanceof Element)) return null;
    const doc = el.ownerDocument || document;

    // 1) ID فريد
    if (isStableId(el.id)) {
      const sel = '#' + cssEscape(el.id);
      if (getCount(doc, sel) === 1) return sel;
    }

    // 2) attribute مميّز (data-testid وما شابه)
    for (const attr of PREFERRED_ATTRS) {
      const v = el.getAttribute(attr);
      if (v && v.length < 60 && /^[\w\s؀-ۿ.\-_/]+$/.test(v)) {
        const sel = `[${attr}="${v.replace(/"/g, '\\"')}"]`;
        if (getCount(doc, sel) === 1) return sel;
      }
    }

    // 3) tag + classes ثابتة
    const tag = el.tagName.toLowerCase();
    const classes = [...el.classList].filter(isStableClass).slice(0, 3);
    if (classes.length) {
      const sel = tag + '.' + classes.map(cssEscape).join('.');
      if (getCount(doc, sel) === 1) return sel;
    }

    // 4) بناء سلسلة آباء
    return buildPath(el);
  }

  function buildPath(el, max = 6) {
    const parts = [];
    let cur = el;
    let root = el.ownerDocument || document;

    while (cur && cur.nodeType === 1 && parts.length < max) {
      const t = cur.tagName.toLowerCase();
      if (t === 'html' || t === 'body') {
        parts.unshift(t);
        break;
      }

      // جزء العنصر الحالي
      let part = t;

      // جرّب ID أولًا
      if (isStableId(cur.id)) {
        part = t + '#' + cssEscape(cur.id);
        parts.unshift(part);
        const sel = parts.join(' > ');
        if (getCount(root, sel) === 1) return sel;
        continue;
      }

      // ثم classes ثابتة
      const cls = [...cur.classList].filter(isStableClass).slice(0, 2);
      if (cls.length) {
        part = t + '.' + cls.map(cssEscape).join('.');
      } else {
        // nth-of-type كحلّ أخير
        const parent = cur.parentNode;
        if (parent) {
          const siblings = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
          if (siblings.length > 1) {
            const idx = siblings.indexOf(cur) + 1;
            part = `${t}:nth-of-type(${idx})`;
          }
        }
      }

      parts.unshift(part);
      const sel = parts.join(' > ');
      if (getCount(root, sel) === 1) return sel;

      cur = cur.parentElement;
    }

    return parts.join(' > ');
  }

  // ============================================================
  // واجهة Picker
  // ============================================================

  let target = null;
  let onPick = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${OVERLAY_ID} {
  position: fixed !important;
  pointer-events: none !important;
  z-index: 2147483646 !important;
  background: rgba(30, 64, 175, 0.18) !important;
  border: 2px solid #1E40AF !important;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.25) !important;
  transition: all 80ms ease !important;
  border-radius: 2px !important;
  box-sizing: border-box !important;
}
#${TOOLTIP_ID} {
  position: fixed !important;
  z-index: 2147483647 !important;
  background: #1E40AF !important;
  color: #FFFFFF !important;
  font: 600 12px/1.4 system-ui, -apple-system, Segoe UI, sans-serif !important;
  padding: 6px 10px !important;
  border-radius: 6px !important;
  pointer-events: none !important;
  box-shadow: 0 8px 24px rgba(30, 64, 175, .35) !important;
  max-width: 360px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  direction: ltr !important;
  text-align: left !important;
}
#${TOOLTIP_ID} .nasaq-hint {
  display: block !important;
  font-weight: 400 !important;
  opacity: .8 !important;
  font-size: 11px !important;
  margin-top: 2px !important;
}
html[data-nasaq-picking] *, html[data-nasaq-picking] {
  cursor: crosshair !important;
}
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function makeOverlay() {
    const o = document.createElement('div');
    o.id = OVERLAY_ID;
    document.documentElement.appendChild(o);

    const t = document.createElement('div');
    t.id = TOOLTIP_ID;
    document.documentElement.appendChild(t);
    return { o, t };
  }

  function positionOverlay(el, overlay, tooltip) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    Object.assign(overlay.style, {
      top: r.top + 'px',
      left: r.left + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
      display: 'block'
    });
    const tag = el.tagName.toLowerCase();
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    const id = el.id ? '#' + el.id : '';
    tooltip.innerHTML = `<strong>${tag}${id}${cls}</strong><span class="nasaq-hint">انقر لاختيار · Esc للإلغاء</span>`;
    const tt = tooltip.getBoundingClientRect();
    let top = r.top - tt.height - 8;
    if (top < 4) top = r.bottom + 8;
    let left = r.left;
    if (left + tt.width > window.innerWidth - 4) {
      left = window.innerWidth - tt.width - 4;
    }
    if (left < 4) left = 4;
    Object.assign(tooltip.style, {
      top: top + 'px',
      left: left + 'px',
      display: 'block'
    });
  }

  function isOurNode(el) {
    if (!el) return false;
    return el.id === OVERLAY_ID || el.id === TOOLTIP_ID || el.id === STYLE_ID
      || el.hasAttribute?.('data-nasaq');
  }

  let overlay, tooltip;
  function onMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOurNode(el)) return;
    target = el;
    positionOverlay(el, overlay, tooltip);
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (!target) return finish();

    const selector = selectorForElement(target);
    const preview = (target.textContent || '').trim().slice(0, 80);

    try {
      chrome.runtime.sendMessage({
        type: 'nasaq:picker-result',
        selector,
        tagName: target.tagName.toLowerCase(),
        preview
      });
    } catch {}

    // أعد فتح اللوحة الجانبية إن أمكن (يتطلب user gesture — الضغط هذا يكفي)
    try {
      chrome.runtime.sendMessage({ type: 'nasaq:request-open-panel' });
    } catch {}

    finish();
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      finish();
    }
  }

  function onScrollOrResize() {
    if (target) positionOverlay(target, overlay, tooltip);
  }

  function finish() {
    window.__NASAQ_PICKER_ACTIVE__ = false;
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize, true);
    document.documentElement.removeAttribute('data-nasaq-picking');
    overlay?.remove();
    tooltip?.remove();
  }

  // ============================================================
  // البدء
  // ============================================================

  injectStyles();
  const ov = makeOverlay();
  overlay = ov.o;
  tooltip = ov.t;
  document.documentElement.setAttribute('data-nasaq-picking', '1');
  window.__NASAQ_PICKER_STOP__ = finish;

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize, true);
})();

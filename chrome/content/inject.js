/**
 * Nasaq — Content Script (early injector)
 * يعمل عند document_start ليمنع وميض FOUC
 *
 * مسؤول عن:
 *   - قراءة الإعدادات وحقن CSS الخاص بالموقع مبكرًا
 *   - تطبيق المعاينة الحية القادمة من اللوحة الجانبية
 *   - إدارة عنصر <style> الخاص بالإضافة
 *   - إعلام اللوحة عند تغيير الموقع (SPA navigation)
 */

(() => {
  'use strict';

  if (window.__NASAQ_INJECTED__) return;
  window.__NASAQ_INJECTED__ = true;

  const STORAGE_KEY = 'nasaq_v1';
  const STYLE_ID = '__nasaq_style__';
  const PREVIEW_STYLE_ID = '__nasaq_preview__';
  const FONT_STYLE_ID = '__nasaq_fonts__';
  const HOST_ATTR = 'data-nasaq';

  const hostname = location.hostname.toLowerCase();
  let currentSettings = null;
  let fontFaceCache = '';

  // ============================================================
  // قائمة الخطوط المدمجة — 3 خطوط عربية احترافية فقط
  // ============================================================
  const BUNDLED_FONTS = [
    { id: 'tajawal',          family: 'Tajawal',                lang: 'ar', weights: [400, 500, 700] },
    { id: 'ibm-plex-arabic',  family: 'IBM Plex Sans Arabic',   lang: 'ar', weights: [400, 500, 700] },
    { id: 'amiri',            family: 'Amiri',                  lang: 'ar', weights: [400, 700] }
  ];

  // ============================================================
  // قراءة الإعدادات
  // ============================================================

  function loadSettings() {
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(STORAGE_KEY, data => {
          resolve(data[STORAGE_KEY] || null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  function getSiteCSS(settings) {
    if (!settings) return '';
    if (settings.enabled === false) return '';
    if (!settings.enabledSites?.[hostname]) return '';
    const siteStyle = settings.styles?.[hostname];
    if (!siteStyle) return '';
    const parts = [];
    if (siteStyle.basicCSS) parts.push('/* ===== Basic ===== */\n' + siteStyle.basicCSS);
    if (siteStyle.codeCSS)  parts.push('/* ===== Code ===== */\n'  + siteStyle.codeCSS);
    return parts.join('\n\n');
  }

  function buildFontFaceCSS(settings) {
    // نولد @font-face لكل الخطوط المدمجة المُستَخدَمة فقط (lazy)
    // لتقليل عمل المتصفّح، نحقن @font-face لكل الخطوط مرة واحدة
    // (المتصفح لن يحمّل الملفّ فعليًا إلا عند استخدامه)
    const lines = [];
    for (const f of BUNDLED_FONTS) {
      for (const w of f.weights) {
        try {
          const url = chrome.runtime.getURL(`fonts/${f.id}-${w}.woff2`);
          lines.push(`@font-face{font-family:"${f.family}";font-style:normal;font-weight:${w};font-display:swap;src:url("${url}") format("woff2");}`);
        } catch { /* */ }
      }
    }
    return lines.join('\n');
  }

  // ============================================================
  // الحقن
  // ============================================================

  function ensureStyleElement(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      el.setAttribute(HOST_ATTR, '1');
      // نحقن في documentElement حتى يعمل قبل وجود head
      const target = document.head || document.documentElement;
      target.appendChild(el);
    }
    return el;
  }

  function injectFontsOnce() {
    if (fontFaceCache) return;
    fontFaceCache = buildFontFaceCSS();
    const el = ensureStyleElement(FONT_STYLE_ID);
    el.textContent = fontFaceCache;
  }

  function applySiteCSS(css) {
    // إذا الموقع مفعّل، احقن @font-face دائمًا حتى لو CSS فارغ
    // (لأن المستخدم قد يفتح اللوحة ويبدأ التعديل في أي لحظة)
    injectFontsOnce();
    const el = ensureStyleElement(STYLE_ID);
    el.textContent = css || '';
    document.documentElement.setAttribute('data-nasaq-active', '1');
  }

  function applyPreview(css) {
    injectFontsOnce();
    if (!css || !css.trim()) {
      const el = document.getElementById(PREVIEW_STYLE_ID);
      if (el) el.remove();
      return;
    }
    const el = ensureStyleElement(PREVIEW_STYLE_ID);
    el.textContent = css;
  }

  function clearAll() {
    [STYLE_ID, PREVIEW_STYLE_ID].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    document.documentElement.removeAttribute('data-nasaq-active');
  }

  // ============================================================
  // التشغيل
  // ============================================================

  async function init() {
    const settings = await loadSettings();
    currentSettings = settings;
    const isEnabled = settings?.enabled !== false
      && settings?.enabledSites?.[hostname];
    if (isEnabled) {
      // الموقع مفعّل: احقن الخطوط + CSS المحفوظ (إن وُجد)
      const css = getSiteCSS(settings);
      applySiteCSS(css);
    } else {
      // الموقع غير مفعّل: نظّف كل شيء
      clearAll();
    }
  }

  // المراقبة المستمرة لـ chrome.storage
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY]) {
        currentSettings = changes[STORAGE_KEY].newValue || null;
        const isEnabled = currentSettings?.enabled !== false
          && currentSettings?.enabledSites?.[hostname];
        if (isEnabled) {
          applySiteCSS(getSiteCSS(currentSettings));
        } else {
          clearAll();
        }
      }
    });
  } catch {}

  // الاستماع للرسائل
  try {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg?.type) return;
      switch (msg.type) {
        case 'nasaq:apply-preview':
          applyPreview(msg.css);
          sendResponse({ ok: true });
          break;
        case 'nasaq:clear-preview':
          applyPreview('');
          sendResponse({ ok: true });
          break;
        case 'nasaq:reload':
          init();
          sendResponse({ ok: true });
          break;
        case 'nasaq:get-host':
          sendResponse({ host: hostname, url: location.href });
          break;
        case 'nasaq:get-fonts':
          sendResponse({ fonts: BUNDLED_FONTS });
          break;
        default:
          break;
      }
    });
  } catch {}

  // البدء المبكّر
  init();

  // مراقبة تغيّر URL في SPA لإعادة تطبيق الأنماط (نادر لكن مفيد لـ history.pushState)
  let lastHref = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      // قد يتغير hostname (مثلاً subdomain)
      const newHost = location.hostname.toLowerCase();
      if (newHost !== hostname) {
        // أعد التهيئة بـ host الجديد
        init();
      }
    }
  });
  try {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}
})();

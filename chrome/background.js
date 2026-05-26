/**
 * Nasaq — Service Worker
 * إدارة Side Panel + التخزين + Context Menu + الشارة + المراسلات
 */

const STORAGE_KEY = 'nasaq_v1';

const DEFAULTS = {
  enabled: true,
  enabledSites: {},
  styles: {},
  globalCSS: '',
  ui: {
    theme: 'royal',
    activeTab: 'basic'
  },
  fonts: {
    custom: []
  }
};

// ============================================================
// إدارة Side Panel
// ============================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => { /* قديم */ });

  await createContextMenus();

  if (details.reason === 'install') {
    const current = await chrome.storage.local.get(STORAGE_KEY);
    if (!current[STORAGE_KEY]) {
      await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULTS });
    }
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html?welcome=1')
    });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});
  await createContextMenus();
});

// ============================================================
// Context Menu
// ============================================================

async function createContextMenus() {
  await new Promise(r => chrome.contextMenus.removeAll(r));

  chrome.contextMenus.create({
    id: 'nasaq-open',
    title: 'نَسَق — فتح اللوحة',
    contexts: ['action', 'page']
  });

  chrome.contextMenus.create({
    id: 'nasaq-toggle-site',
    title: 'تفعيل/تعطيل على هذا الموقع',
    contexts: ['action', 'page']
  });

  chrome.contextMenus.create({
    id: 'nasaq-sep1',
    type: 'separator',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'nasaq-options',
    title: 'الإعدادات المتقدمة',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'nasaq-pick',
    title: 'اختر عنصرًا لتنسيقه',
    contexts: ['page', 'selection']
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'nasaq-open':
      try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      } catch (e) { /* */ }
      break;
    case 'nasaq-toggle-site':
      await toggleSite(tab);
      break;
    case 'nasaq-options':
      chrome.runtime.openOptionsPage();
      break;
    case 'nasaq-pick':
      await startPicker(tab);
      break;
  }
});

// ============================================================
// اختصارات
// ============================================================

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  switch (command) {
    case 'open-panel':
      try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      } catch (e) {}
      break;
    case 'toggle-site':
      await toggleSite(tab);
      break;
  }
});

// ============================================================
// التخزين
// ============================================================

async function getSettings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return mergeDeep(structuredClone(DEFAULTS), data[STORAGE_KEY] || {});
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      target[key] = mergeDeep(target[key] || {}, sv);
    } else {
      target[key] = sv;
    }
  }
  return target;
}

function urlToHost(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.toLowerCase();
  } catch { return null; }
}

// ============================================================
// تفعيل/تعطيل لكل موقع
// ============================================================

async function toggleSite(tab) {
  if (!tab?.url) return;
  const host = urlToHost(tab.url);
  if (!host) return;

  const settings = await getSettings();
  const sites = settings.enabledSites || {};
  sites[host] = !sites[host];
  if (!sites[host]) delete sites[host];

  await saveSettings({ ...settings, enabledSites: sites });
  await updateBadge(tab.id, host, !!sites[host]);

  // أبلغ التبويب لتطبيق/إزالة الأنماط فورًا
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'nasaq:reload' });
  } catch {}
}

// ============================================================
// Badge — يعرض حالة كل تبويب
// ============================================================

async function updateBadge(tabId, hostOpt, enabledOpt) {
  if (!tabId) return;
  let host = hostOpt;
  let enabled = enabledOpt;

  if (host === undefined || enabled === undefined) {
    try {
      const tab = await chrome.tabs.get(tabId);
      host = urlToHost(tab.url);
      if (!host) {
        await chrome.action.setBadgeText({ tabId, text: '' });
        return;
      }
      const settings = await getSettings();
      enabled = !!settings.enabledSites?.[host];
    } catch { return; }
  }

  const text = enabled ? 'ON' : '';
  const color = enabled ? '#1E40AF' : '#94A3B8';

  try {
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
    await chrome.action.setBadgeTextColor({ tabId, color: '#FFFFFF' });
  } catch {}
}

chrome.tabs.onActivated.addListener(({ tabId }) => updateBadge(tabId));
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'complete' || info.url) updateBadge(tabId);
});

// ============================================================
// Picker
// ============================================================

async function startPicker(tab) {
  if (!tab?.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: false },
      files: ['content/picker.js']
    });
  } catch (e) {
    console.warn('نَسَق picker injection failed:', e);
  }
}

// ============================================================
// رسائل من Side Panel و Content Scripts
// ============================================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  (async () => {
    try {
      switch (msg.type) {

        case 'nasaq:get-active-tab': {
          const [tab] = await chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
          });
          if (!tab) return sendResponse({ ok: false });
          const host = urlToHost(tab.url);
          sendResponse({
            ok: true,
            tabId: tab.id,
            url: tab.url,
            host,
            title: tab.title,
            favIconUrl: tab.favIconUrl
          });
          return;
        }

        case 'nasaq:get-settings': {
          const settings = await getSettings();
          sendResponse({ ok: true, settings });
          return;
        }

        case 'nasaq:save-settings': {
          await saveSettings(msg.settings);
          sendResponse({ ok: true });
          return;
        }

        case 'nasaq:save-site-style': {
          const { host, style } = msg;
          if (!host) return sendResponse({ ok: false, error: 'no-host' });
          const settings = await getSettings();
          settings.styles[host] = style;
          if (!settings.enabledSites[host]) settings.enabledSites[host] = true;
          await saveSettings(settings);

          // أبلغ التبويبات المتأثرة
          await broadcastReload(host);
          sendResponse({ ok: true });
          return;
        }

        case 'nasaq:delete-site-style': {
          const { host } = msg;
          const settings = await getSettings();
          delete settings.styles[host];
          delete settings.enabledSites[host];
          await saveSettings(settings);
          await broadcastReload(host);
          sendResponse({ ok: true });
          return;
        }

        case 'nasaq:toggle-site': {
          const { host } = msg;
          const settings = await getSettings();
          if (settings.enabledSites[host]) {
            delete settings.enabledSites[host];
          } else {
            settings.enabledSites[host] = true;
          }
          await saveSettings(settings);
          await broadcastReload(host);
          const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
          if (tab?.id) await updateBadge(tab.id, host, !!settings.enabledSites[host]);
          sendResponse({ ok: true, enabled: !!settings.enabledSites[host] });
          return;
        }

        case 'nasaq:apply-live': {
          // تطبيق فوري للمعاينة الحيّة دون حفظ
          const { tabId, css } = msg;
          if (!tabId) return sendResponse({ ok: false });
          try {
            await chrome.tabs.sendMessage(tabId, {
              type: 'nasaq:apply-preview',
              css: css || ''
            });
          } catch {}
          sendResponse({ ok: true });
          return;
        }

        case 'nasaq:start-picker': {
          const { tabId } = msg;
          if (!tabId) return sendResponse({ ok: false });
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: false },
            files: ['content/picker.js']
          });
          sendResponse({ ok: true });
          return;
        }

        case 'nasaq:picker-result': {
          // رسالة من picker — أعد توجيهها للوحة الجانبية
          chrome.runtime.sendMessage({
            type: 'nasaq:picker-selected',
            selector: msg.selector,
            tagName: msg.tagName,
            preview: msg.preview
          }).catch(() => {});
          sendResponse({ ok: true });
          return;
        }

        case 'nasaq:open-options': {
          chrome.runtime.openOptionsPage();
          sendResponse({ ok: true });
          return;
        }

        default:
          sendResponse({ ok: false, error: 'unknown-type' });
      }
    } catch (e) {
      console.warn('نَسَق bg error:', e);
      sendResponse({ ok: false, error: String(e) });
    }
  })();

  return true; // async
});

async function broadcastReload(host) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.url || !tab.id) continue;
      const h = urlToHost(tab.url);
      if (h === host) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'nasaq:reload' });
        } catch {}
        await updateBadge(tab.id);
      }
    }
  } catch {}
}

// عند تغيير التخزين، حدّث الـ badge للتبويب الفعّال
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[STORAGE_KEY]) return;
  chrome.tabs.query({ active: true }).then(tabs => {
    for (const t of tabs) updateBadge(t.id);
  });
});

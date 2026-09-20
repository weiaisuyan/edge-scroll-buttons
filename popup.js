/* 滚动按钮 - 弹窗菜单逻辑：设置入口 + 当前网站「禁用 / 启用」开关
 * 关闭开关 = 把当前网站（域名级）加入排除列表；打开 = 从列表移除。
 * 写入 chrome.storage.local.settings.excludedSites，页面按钮实时响应。 */
(() => {
  'use strict';

  const DEFAULTS = ESB_SHARED.DEFAULTS;
  const t = (k, f, s) => ESB_SHARED.t(k, f, s);
  let S = Object.assign({}, DEFAULTS);

  const $ = (id) => document.getElementById(id);

  const ICO_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICO_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  let site = '';        // 规范化后的当前网站（页面可排除时）
  let supported = false; // 当前页面是否为可排除的普通网页
  let excluded = false;  // 当前网站是否在排除列表中

  try { ESB_SHARED.localize(document); } catch (err) { /* 忽略 */ }
  try { $('ver').textContent = 'v' + chrome.runtime.getManifest().version; } catch (err) { /* 忽略 */ }

  $('openGuide').addEventListener('click', () => {
    try { chrome.tabs.create({ url: chrome.runtime.getURL('guide.html') }); } catch (err) { /* 忽略 */ }
    window.close();
  });

  $('openOptions').addEventListener('click', () => {
    try { chrome.runtime.openOptionsPage(); } catch (err) { /* 忽略 */ }
    window.close();
  });

  function storageGet(cb) {
    try {
      chrome.storage.local.get('settings', (res) => {
        if (res && res.settings) S = Object.assign({}, DEFAULTS, res.settings);
        cb();
      });
    } catch (err) { cb(); }
  }

  function storageSet() {
    try { chrome.storage.local.set({ settings: S }); } catch (err) { /* 忽略 */ }
  }

  function siteList() {
    return Array.isArray(S.excludedSites) ? S.excludedSites.slice() : [];
  }

  function entryMatches(siteHost, raw) {
    const e = ESB_SHARED.normalizeSite(raw);
    if (!e) return false;
    return siteHost === e || siteHost.slice(-(e.length + 1)) === '.' + e;
  }

  /* 读取当前标签页网址 → 解析出可排除的网站名（需要 activeTab 授权） */
  function readCurrentSite(cb) {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        let ok = false;
        let s = '';
        if (tab && tab.url) {
          try {
            const u = new URL(tab.url);
            if (u.protocol === 'http:' || u.protocol === 'https:') {
              s = ESB_SHARED.normalizeSite(u.hostname);
              ok = !!s;
            }
          } catch (err) { /* 忽略 */ }
        }
        cb(ok, s);
      });
    } catch (err) { cb(false, ''); }
  }

  function render() {
    const row = $('siteToggle');
    if (!supported) {
      $('siteHost').textContent = '—';
      $('siteHost').title = '';
      $('siteIco').innerHTML = ICO_OFF;
      $('siteLabel').textContent = t('popup_unavailable', '当前页面无法设置');
      $('siteHint').textContent = t('popup_unavailable_hint', '浏览器内部页面不支持排除');
      row.disabled = true;
      row.setAttribute('aria-pressed', 'false');
      return;
    }
    $('siteHost').textContent = site;
    $('siteHost').title = site;
    row.disabled = false;
    row.setAttribute('aria-pressed', excluded ? 'false' : 'true');
    if (excluded) {
      $('siteIco').innerHTML = ICO_OFF;
      $('siteLabel').textContent = t('popup_off', '已在此网站禁用');
      $('siteHint').textContent = t('popup_off_hint', '点击恢复显示；排除列表可在「设置」中管理');
    } else {
      $('siteIco').innerHTML = ICO_ON;
      $('siteLabel').textContent = t('popup_on', '在网站上显示按钮');
      $('siteHint').textContent = '';
    }
  }

  $('siteToggle').addEventListener('click', () => {
    if (!supported) return;
    const list = siteList();
    if (excluded) {
      // 启用：移除所有命中当前网站的条目（含上级域名条目，如 zhihu.com 覆盖 zhuanlan.zhihu.com）
      S.excludedSites = list.filter((raw) => !entryMatches(site, raw));
    } else {
      // 禁用：加入当前网站（域名级，自动去除 www. 前缀）
      if (!list.some((raw) => ESB_SHARED.normalizeSite(raw) === site)) list.push(site);
      S.excludedSites = list;
    }
    storageSet();
    excluded = ESB_SHARED.isSiteExcluded(site, S.excludedSites);
    render();
  });

  storageGet(() => {
    readCurrentSite((ok, s) => {
      supported = ok;
      site = s;
      excluded = ok && ESB_SHARED.isSiteExcluded(site, siteList());
      render();
    });
  });
})();

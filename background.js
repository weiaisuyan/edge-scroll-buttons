/* 滚动按钮 - 后台服务：弹窗菜单（popup.html）+ 页面消息通道（打开设置页 / 中键关闭标签）+ 启动时机与兜底 */
'use strict';

/* 首次安装：自动打开用法教程页（更新时不打扰） */
chrome.runtime.onInstalled.addListener((details) => {
  if (details && details.reason === 'install') {
    try { chrome.tabs.create({ url: chrome.runtime.getURL('guide.html') }); } catch (err) { /* 忽略 */ }
  }
});

/* 空监听器：为 MV3 service worker 提供启动时机，确保消息监听注册稳定 */
chrome.runtime.onStartup.addListener(() => {});

/* 页面消息通道：「打开设置页」（网络页兜底）与「关闭当前标签页」（按钮中键）。 */
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg) return;
  if (msg.type === 'esb-open-options') {
    chrome.runtime.openOptionsPage();
    return;
  }
  if (msg.type === 'esb-close-tab') {
    const tabId = sender && sender.tab && sender.tab.id;
    if (tabId == null) return;
    try {
      chrome.tabs.remove(tabId, () => { void chrome.runtime.lastError; });
    } catch (err) { /* 忽略 */ }
  }
});

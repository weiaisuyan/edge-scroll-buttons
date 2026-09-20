/* 滚动按钮 - 用法教程页：应用当前语言文案 */
(() => {
  'use strict';
  try {
    document.title = ESB_SHARED.t('guide_title', document.title);
    ESB_SHARED.localize(document);
  } catch (err) { /* file:// 预览时忽略 */ }
})();

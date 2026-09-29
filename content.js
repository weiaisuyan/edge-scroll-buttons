/* 滚动按钮 - 页面悬浮「上/下」滚动按钮（Edge/Chrome 扩展 content script）
 * 左键单击：平滑翻页；左键按住 ≥holdDelay：连续滚动，松开/移出即停。
 * Ctrl+左键拖动：调整按钮位置（避开 Edge 鼠标手势冲突）；右键单击上/下按钮：滚动到最上 / 最下。
 * 中键（按下滚轮）单击上/下按钮：关闭当前标签页（v1.1.0 起，设置中可关闭）。
 * 闲置淡化：鼠标离开按钮 ≥idleDelay 秒后淡到 idleOpacity；悬浮/点击立即恢复（可开关）。
 * 网站排除：settings.excludedSites 中的网站（含子域名）不显示按钮（域名级匹配，见 shared.js）。
 * 设置存于 chrome.storage.local.settings，由设置页/弹窗修改，本脚本实时响应。
 */
(() => {
  'use strict';

  if (window.__esb_injected) return;
  window.__esb_injected = true;

  const DEFAULTS = ESB_SHARED.DEFAULTS;
  const STYLES = ESB_SHARED.STYLES;

  const FLIP_VMAX_BASE = 3.6;      // 基础巡航速度（px/ms）：中段约 3600px/s，滑动干脆利落
  const FLIP_VMAX_PER_PAGE = 1.3;  // 每多积累一页速度上限 +1.3（连点提速）
  const FLIP_VMAX_CAP = 9.5;       // 速度上限封顶（px/ms）
  const FLIP_KV = 0.023;           // 速度增益：目标速度 = 剩余距离 × KV（尾部缓出 ~170ms 平滑停稳）
  const FLIP_ACCEL = 0.4;          // 加速段加速度：起步几乎立即（一帧到速）
  const FLIP_DECEL = 0.4;          // 减速段减速度：干脆收尾，不拖尾巴
  const FLIP_SETTLE = 3;           // 距目标 ≤ 该像素直接落位（避免慢速爬行）
  const EDGE = 6;              // 按钮组离视口边缘的最小距离（px）
  const SCROLLBAR_RESERVE = 16; // 右侧预留滚动条宽度（避免大按钮贴边、压住滚动条）
  const GAP = 8;               // 上下按钮间距（px）
  const DRAG_THRESHOLD = 5;    // Ctrl+左键移动超过该距离视为拖动（px）

  let settings = Object.assign({}, DEFAULTS);
  let host = null;
  let shadow = null;
  let wrapEl = null;
  let btnUp = null;
  let btnDown = null;
  let resizeTimer = 0;
  let flip = null;        // 翻页动画状态 { target, to, v, peak, lastClick, last, raf }
  let flipLastPeak = 0;   // 最近一次翻页会话的峰值速度（连点续接用）
  let flipLastPeakAt = 0; // 峰值记录时间
  let press = null;    // 左键按压状态 { dir, mode:'pending'|'hold', timer }
  let hold = null;     // 连续滚动状态 { raf, target, dir }
  let drag = null;     // Ctrl+左键拖动状态 { startX, startY, offX, offY, moved, lastX, lastY }
  let rclick = null;   // 右键单击起点 { x, y, dir:'up'|'down' }（松开时滚到最上 / 最下）
  let idleTimer = 0;   // 闲置淡化计时器
  let fsActive = false; // 是否处于元素全屏（全屏时按钮隐藏）

  /* ---------------- 设置读写 ---------------- */

  function readSettings(cb) {
    try {
      chrome.storage.local.get('settings', (res) => {
        if (res && res.settings) settings = Object.assign({}, DEFAULTS, res.settings);
        cb();
      });
    } catch (err) { cb(); }
  }

  function saveSettings() {
    try { chrome.storage.local.set({ settings: settings }); } catch (err) { /* 忽略 */ }
  }

  function watchSettings() {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.settings && changes.settings.newValue) {
          settings = Object.assign({}, DEFAULTS, changes.settings.newValue);
          applyAll();
          applyXhsAi();
        }
      });
    } catch (err) { /* 忽略 */ }
  }

  /* 当前网站是否在排除列表中（域名级匹配：条目 zhihu.com 覆盖其全部子域名） */
  function siteExcluded() {
    try {
      return ESB_SHARED.isSiteExcluded(location.hostname, settings.excludedSites);
    } catch (err) { return false; }
  }

  /* ---------------- 界面构建 ---------------- */

  function build() {
    host = document.createElement('div');
    host.id = 'esb-host';
    host.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;';
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .esb-wrap {
        display:flex; flex-direction:column; gap:${GAP}px; position:relative;
        opacity:var(--esb-op, .7); transition:opacity .55s ease;
      }
      .esb-wrap.esb-idle { opacity:var(--esb-idle-op, .15); }
      .esb-wrap.esb-idle:hover { opacity:var(--esb-op, .7); transition-duration:.18s; }
      .esb-btn {
        box-sizing:border-box; margin:0; padding:0; border:0; outline:none;
        display:flex; align-items:center; justify-content:center;
        border-radius:var(--esb-radius, 50%);
        background:var(--esb-bg, rgba(62,74,88,.85));
        color:var(--esb-fg, #fff);
        border:var(--esb-border, 0);
        box-shadow:var(--esb-shadow, 0 2px 8px rgba(0,0,0,.28));
        backdrop-filter:var(--esb-blur, none);
        -webkit-backdrop-filter:var(--esb-blur, none);
        cursor:pointer; touch-action:none;
        -webkit-user-select:none; user-select:none;
        transition:background-color .2s ease, transform .18s cubic-bezier(.34,1.3,.64,1), box-shadow .22s ease;
      }
      .esb-btn:hover {
        background:var(--esb-hover, rgba(76,92,110,.95)); transform:scale(1.06);
        box-shadow:var(--esb-shadow-hover, var(--esb-shadow, 0 3px 10px rgba(0,0,0,.32)));
      }
      .esb-btn:active {
        background:var(--esb-active, rgba(101,121,143,1)); transform:scale(.96);
        box-shadow:var(--esb-shadow);
      }
      .esb-btn:focus-visible { outline:2px solid rgba(125,153,190,.95); outline-offset:3px; }
      .esb-btn svg { width:56%; height:56%; display:block; pointer-events:none; filter:drop-shadow(0 1px 1px rgba(0,0,0,.14)); }
      .esb-dragging .esb-btn { outline:2px dashed rgba(125,153,190,.95); outline-offset:3px; }
      /* 动态样式：pan=流光移动（渐变大背景平移）、pulse=呼吸辉光（阴影脉动） */
      .esb-btn.esb-anim-pan { background-size:230% 230%; animation:esbPan 9s ease-in-out infinite alternate; }
      .esb-btn.esb-anim-pulse { animation:esbPulse 2.8s ease-in-out infinite; }
      @keyframes esbPan { from { background-position:0% 50%; } to { background-position:100% 50%; } }
      @keyframes esbPulse {
        0%, 100% { box-shadow:var(--esb-glow-a, var(--esb-shadow)); }
        50% { box-shadow:var(--esb-glow-b, var(--esb-shadow)); }
      }
      @media (prefers-reduced-motion: reduce) {
        .esb-btn.esb-anim-pan, .esb-btn.esb-anim-pulse { animation:none; }
      }
    `;
    shadow.appendChild(style);

    const makeBtn = (dir, title, path) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'esb-btn esb-' + dir;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
      b.addEventListener('pointerdown', (e) => onDown(dir, e));
      b.addEventListener('mousedown', onMiddleDown);
      b.addEventListener('pointerleave', onLeave);
      b.addEventListener('pointercancel', onLeave);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };

    btnUp = makeBtn('up', ESB_SHARED.t('btn_up_title', '向上翻页 / 按住连续上滚 / 右键滚到最上 / 中键关闭标签 / Ctrl+左键拖动移位'), 'M6 15l6-6 6 6');
    btnDown = makeBtn('down', ESB_SHARED.t('btn_down_title', '向下翻页 / 按住连续下滚 / 右键滚到最下 / 中键关闭标签 / Ctrl+左键拖动移位'), 'M6 9l6 6 6-6');

    wrapEl = document.createElement('div');
    wrapEl.className = 'esb-wrap';
    wrapEl.appendChild(btnUp);
    wrapEl.appendChild(btnDown);
    shadow.appendChild(wrapEl);

    // 闲置淡化：鼠标在按钮组上=保持不淡；离开后重新计时
    wrapEl.addEventListener('pointerenter', holdIdle);
    wrapEl.addEventListener('pointerleave', scheduleIdle);

    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointerup', onRightUp, true);
    window.addEventListener('pointerup', onDragUp, true);
    window.addEventListener('pointermove', onDragMove, true);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('wheel', cancelFlip, { passive: true });
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(place, 100);
    }, { passive: true });

    host.addEventListener('pointerdown', (e) => {
      if (e.target !== host) return;
      if (e.pointerType !== 'mouse') return;
      if (e.button === 0 && e.ctrlKey) onDragStart(e);
      else if (e.button === 2) onRightClick(e, null);
    });

    (document.documentElement || document.body).appendChild(host);
  }

  /* ---------------- 布局 / 样式 ---------------- */

  function applyAll() {
    if (!host) return;
    applyStyle();
    if (!settings.visible || siteExcluded()) {
      host.style.display = 'none';
      clearIdleTimer();
      setIdleFaded(false);
      stopHold();
      cancelFlip();
      return;
    }
    host.style.display = (fsActive || mutedFrame()) ? 'none' : 'block';
    host.style.setProperty('--esb-op', String(settings.opacity));
    host.style.setProperty('--esb-idle-op', String(settings.idleOpacity));
    scheduleIdle();
    const s = Math.round(settings.size);
    btnUp.style.width = btnUp.style.height = s + 'px';
    btnDown.style.width = btnDown.style.height = s + 'px';
    host.style.width = s + 'px';
    host.style.height = (s * 2 + GAP) + 'px';
    place();
  }

  function applyStyle() {
    const s = STYLES[settings.styleId] || STYLES.ink;
    host.style.setProperty('--esb-bg', s.bg);
    host.style.setProperty('--esb-hover', s.hover);
    host.style.setProperty('--esb-active', s.active);
    host.style.setProperty('--esb-fg', s.fg);
    host.style.setProperty('--esb-border', s.border);
    host.style.setProperty('--esb-shadow', s.shadow);
    host.style.setProperty('--esb-shadow-hover', s.shadowHover || s.shadow);
    host.style.setProperty('--esb-blur', s.blur ? 'blur(8px)' : 'none');
    host.style.setProperty('--esb-glow-a', s.glowA || s.shadow);
    host.style.setProperty('--esb-glow-b', s.glowB || s.shadow);
    const r = settings.shape === 'rounded' ? '30%' : '50%';
    host.style.setProperty('--esb-radius', r);
    const anim = s.anim || '';
    [btnUp, btnDown].forEach((b) => {
      if (!b) return;
      b.classList.toggle('esb-anim-pan', anim === 'pan');
      b.classList.toggle('esb-anim-pulse', anim === 'pulse');
    });
  }

  function place() {
    if (!host || !settings.visible) return;
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let cx = (settings.posX / 100) * vw;
    let cy = (settings.posY / 100) * vh;
    cx = Math.min(Math.max(cx, w / 2 + EDGE), vw - w / 2 - SCROLLBAR_RESERVE);
    cy = Math.min(Math.max(cy, h / 2 + EDGE), vh - h / 2 - EDGE);
    host.style.left = (cx - w / 2) + 'px';
    host.style.top = (cy - h / 2) + 'px';
  }

  /* ---------------- 闲置淡化 ---------------- */

  /* 鼠标在按钮组上（悬浮/按压/拖动）时保持「按钮透明度」设置的原值；
     离开后经过「闲置延时」秒，淡到「闲置透明度」；再触碰立即恢复。 */

  function setIdleFaded(on) {
    if (!wrapEl) return;
    wrapEl.classList.toggle('esb-idle', !!on);
  }

  function clearIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = 0;
  }

  /* 开始（或重新开始）闲置计时；设置变化 / 鼠标离开时调用 */
  function scheduleIdle() {
    clearIdleTimer();
    setIdleFaded(false);
    if (!settings.visible || settings.idleFade === false) return;
    if (wrapEl && wrapEl.matches(':hover')) return;  // 鼠标仍在按钮上：等离开后再重新计时
    const sec = Math.max(1, Number(settings.idleDelay) || 3);
    idleTimer = setTimeout(() => {
      idleTimer = 0;
      if (wrapEl && wrapEl.matches(':hover')) return;  // 计时到期时仍悬停其上：保持不淡
      setIdleFaded(true);
    }, sec * 1000);
  }

  /* 鼠标在按钮上：立即恢复并暂停计时 */
  function holdIdle() {
    clearIdleTimer();
    setIdleFaded(false);
  }

  /* ---------------- 全屏时隐藏 ---------------- */

  /* 元素全屏（视频全屏等，document.fullscreenElement 非空）时隐藏按钮：
     全屏下页面滚动无意义，且按钮不应出现在全屏内容之上。退出全屏后按设置恢复。 */
  function onFullscreenChange() {
    const fs = !!document.fullscreenElement;
    if (fs === fsActive) return;
    fsActive = fs;
    if (fsActive) {
      // 进入全屏：停掉进行中的滚动/翻页/按压，清掉闲置计时
      stopHold();
      cancelFlip();
      clearPress();
      clearIdleTimer();
      setIdleFaded(false);
    }
    if (!host) return;
    if (fsActive || !settings.visible || siteExcluded()) {
      host.style.display = 'none';
      return;
    }
    host.style.display = mutedFrame() ? 'none' : 'block';
    scheduleIdle();
    place();
  }

  /* ---------------- 滚动目标（页面本体 / 内部滚动容器） ---------------- */

  function canScrollEl(el) {
    if (!el || !(el instanceof Element)) return false;
    if (el.scrollHeight - el.clientHeight <= 4) return false;
    const oy = getComputedStyle(el).overflowY;
    return oy === 'auto' || oy === 'scroll' || oy === 'overlay';
  }

  function getTarget() {
    const se = document.scrollingElement || document.documentElement;
    if (se && se.scrollHeight - se.clientHeight > 4) return se;
    try {
      let el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      while (el && el !== document.body && el !== document.documentElement) {
        if (canScrollEl(el)) return el;
        el = el.parentElement;
      }
      let best = null;
      let bestD = 4;
      const nodes = document.querySelectorAll('div, main, section, article');
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!canScrollEl(n)) continue;
        const d = n.scrollHeight - n.clientHeight;
        if (d > bestD) { bestD = d; best = n; }
      }
      return best;
    } catch (err) {
      return se;
    }
  }

  /* ---------------- 本框架是否"没事可干"（iframe 外壳页适配） ----------------

     有些站点把正文整块塞进 <iframe>，外层只是壳（learn.html 这类课件站、
     云文档、老式后台）。壳自己一点滚不动，按钮却浮在最上面，把内层框架那套
     按钮整个盖住 → 点上去永远没反应。
     规则（保守，宁可不隐藏）：
       ① 当前文档自己能滚 → 正常显示；
       ② 自己在子框架里且自己滚不动 → 隐藏（子框架里没得滚就不该有按钮）；
       ③ 自己是顶层、自己滚不动，但内部有能滚的同源子框架 → 隐藏（让位给内层那套）。
     副作用边界：顶层滚不动、也没有同源可滚子框架的页面（如极短的静态页）
     一律维持原行为=显示，避免懒加载页面在加载早期被误判后按钮再也不出现。 */

  function docScrollable() {
    const se = document.scrollingElement || document.documentElement;
    return !!(se && se.scrollHeight - se.clientHeight > 4);
  }

  function anySameOriginChildScrolls() {
    const frames = document.querySelectorAll('iframe, frame');
    for (let i = 0; i < frames.length; i++) {
      try {
        const d = frames[i].contentDocument;
        if (!d) continue;
        const se = d.scrollingElement || d.documentElement;
        if (se && se.scrollHeight - se.clientHeight > 4) return true;
      } catch (err) { /* 跨域框架读不到内容，跳过 */ }
    }
    return false;
  }

  function mutedFrame() {
    if (docScrollable()) return false;
    if (window.top !== window) return true;
    return anySameOriginChildScrolls();
  }

  function setTop(target, top) {
    try {
      target.scrollTo({ top: top, behavior: 'instant' });
    } catch (err) {
      target.scrollTop = top;
    }
  }

  /* ---------------- 左键单击：平滑翻页 ---------------- */

  /* 翻页速度倍率：来自设置页「翻页速度」滑杆（0.5–3.0，1.0 = 标准） */
  function spd() {
    const v = settings.flipSpeed;
    return (typeof v === 'number' && isFinite(v) && v > 0) ? Math.min(Math.max(v, 0.2), 3) : 1;
  }

  /* 到顶/到底速度倍率：来自设置页「到顶/到底速度」滑杆（右键单击滚到最上/最下用，上限 10×） */
  function spdEdge() {
    const v = settings.edgeSpeed;
    return (typeof v === 'number' && isFinite(v) && v > 0) ? Math.min(Math.max(v, 0.2), 10) : 1;
  }

  /* 平滑翻页（自绘速度引擎 v2）：速度连续变化；连点期间"保速"（速度只升不降），
     停手 350ms 后才收尾减速 —— 避免"减速-再加速"的摆动感；连点越多巡航越快。 */
  function doFlip(dir) {
    const target = getTarget();
    if (!target) return;
    const max = target.scrollHeight - target.clientHeight;
    if (max <= 0) return;
    const stepDist = target.clientHeight * settings.pageRatio;

    if (flip && flip.target === target) {
      // 翻页进行中：推远目标 + 刷新点击时间（保速窗口）+ 点击瞬间直接保速（不等下一帧）
      flip.to = Math.min(Math.max(flip.to + (dir === 'down' ? 1 : -1) * stepDist, 0), max);
      flip.lastClick = performance.now();
      if (flip.peak > 0 && Math.abs(flip.v) < flip.peak * 0.9) {
        flip.v = (dir === 'down' ? 1 : -1) * flip.peak * 0.9;
      }
      if (!flip.raf) flip.raf = requestAnimationFrame(flipTick);
      return;
    }

    let to = target.scrollTop + (dir === 'down' ? 1 : -1) * stepDist;
    to = Math.min(Math.max(to, 0), max);
    if (Math.abs(to - target.scrollTop) < 1) return;
    const now = performance.now();
    // 连点续接：距上次会话 1.5s 内，用上次峰值速度直接起步（不归零）
    const dirSign = dir === 'down' ? 1 : -1;
    const carry = (now - flipLastPeakAt) < 1500 ? Math.min(flipLastPeak * 0.9, FLIP_VMAX_CAP * spd()) : 0;
    flip = { target: target, to: to, v: dirSign * carry, peak: carry, lastClick: now, last: now, raf: requestAnimationFrame(flipTick) };
  }

  function flipTick(now) {
    if (!flip) return;
    const dt = Math.min(Math.max(now - flip.last, 0), 100);
    flip.last = now;
    const cur = flip.target.scrollTop;
    const remaining = flip.to - cur;
    if (Math.abs(remaining) <= FLIP_SETTLE) {
      setTop(flip.target, flip.to);
      flipLastPeak = flip.peak;          // 记住峰值供连点续接
      flipLastPeakAt = now;
      flip.raf = 0;
      flip = null;
      return;
    }
    // 速度上限随剩余页数提高（连点越多越快）；整体乘对应速度倍率（翻页=翻页速度，到边缘=到顶/到底速度）
    const s = flip.edge ? spdEdge() : spd();
    const stepDist = flip.target.clientHeight * settings.pageRatio;
    const pages = stepDist > 0 ? Math.abs(remaining) / stepDist : 1;
    const vMaxNow = Math.min(FLIP_VMAX_BASE + Math.max(pages - 1, 0) * FLIP_VMAX_PER_PAGE, FLIP_VMAX_CAP) * s;
    let vT = remaining * FLIP_KV * s;
    // 保速：连点窗口内（500ms），目标速度不低于本次会话峰值的 90%（只升不降）
    if ((now - flip.lastClick) < 500 && flip.peak > 0 && Math.abs(vT) < flip.peak * 0.9) {
      vT = (remaining > 0 ? 1 : -1) * flip.peak * 0.9;
    }
    vT = Math.min(Math.max(vT, -vMaxNow), vMaxNow);
    const limit = (Math.abs(vT) > Math.abs(flip.v) ? FLIP_ACCEL : FLIP_DECEL) * s;
    const maxDv = limit * dt;
    flip.v += Math.min(Math.max(vT - flip.v, -maxDv), maxDv);
    if (Math.abs(flip.v) > flip.peak) flip.peak = Math.abs(flip.v);
    const next = cur + flip.v * dt;
    if ((flip.to - cur) * (flip.to - next) <= 0) {
      setTop(flip.target, flip.to);
      flipLastPeak = flip.peak;          // 记住峰值供连点续接
      flipLastPeakAt = now;
      flip.raf = 0;
      flip = null;
      return;
    }
    setTop(flip.target, next);
    flip.raf = requestAnimationFrame(flipTick);
  }

  function cancelFlip() {
    if (flip) {
      if (flip.raf) cancelAnimationFrame(flip.raf);
      flip = null;
    }
  }

  /* ---------------- 左键按住：连续滚动 ---------------- */

  function startHold(dir) {
    stopHold();
    cancelFlip();
    const target = getTarget();
    if (!target) return;
    if (target.scrollHeight - target.clientHeight <= 0) return;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const delta = (dir === 'down' ? 1 : -1) * settings.holdSpeed * dt / 1000;
      setTop(target, target.scrollTop + delta);
      hold.raf = requestAnimationFrame(loop);
    };
    hold = { raf: requestAnimationFrame(loop), target: target, dir: dir };
  }

  function stopHold() {
    if (hold) {
      cancelAnimationFrame(hold.raf);
      hold = null;
    }
  }

  /* ---------------- 左键按压判定：单击 vs 按住 ---------------- */

  function onDown(dir, e) {
    if (e.pointerType === 'mouse' && e.button === 2) {
      onRightClick(e, dir);
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.ctrlKey) {
      onDragStart(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    clearPress();
    endDrag();
    press = { dir: dir, mode: 'pending', timer: 0 };
    press.timer = setTimeout(() => {
      if (!press) return;
      press.mode = 'hold';
      startHold(dir);
    }, Math.max(80, settings.holdDelay));
  }

  function onUp() {
    if (!press) return;
    const st = press;
    clearPress();
    if (st.mode === 'pending') {
      doFlip(st.dir);
    } else {
      stopHold();
    }
  }

  function onLeave() {
    if (!press) return;
    const wasHold = press.mode === 'hold';
    clearPress();
    if (wasHold) stopHold();
  }

  function clearPress() {
    if (press) {
      clearTimeout(press.timer);
      press = null;
    }
  }

  function onWindowBlur() {
    clearPress();
    stopHold();
    cancelFlip();
    rclick = null;
    // 注意：不清理 Ctrl+拖动状态 —— 窗口短暂失焦不应中断拖动
  }

  /* ---------------- Ctrl+左键：按住拖动调整位置 ---------------- */

  function onDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    cancelFlip();
    clearPress();
    stopHold();
    const rect = host.getBoundingClientRect();
    drag = {
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - (rect.left + rect.width / 2),
      offY: e.clientY - (rect.top + rect.height / 2),
      moved: false,
      lastX: rect.left + rect.width / 2,
      lastY: rect.top + rect.height / 2
    };
  }

  function onDragMove(e) {
    if (!drag) return;
    if ((e.buttons & 1) === 0) { endDrag(); return; }  // 左键已松开（如 pointerup 丢失）→ 结束拖动
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      drag.moved = true;
      host.classList.add('esb-dragging');
    }
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    let cx = e.clientX - drag.offX;
    let cy = e.clientY - drag.offY;
    cx = Math.min(Math.max(cx, w / 2 + EDGE), window.innerWidth - w / 2 - SCROLLBAR_RESERVE);
    cy = Math.min(Math.max(cy, h / 2 + EDGE), window.innerHeight - h / 2 - EDGE);
    host.style.left = (cx - w / 2) + 'px';
    host.style.top = (cy - h / 2) + 'px';
    drag.lastX = cx;
    drag.lastY = cy;
  }

  function onDragUp() {
    if (!drag) return;
    const st = drag;
    drag = null;
    host.classList.remove('esb-dragging');
    if (st.moved) {
      settings.posX = Math.min(98, Math.max(2, Math.round((st.lastX / window.innerWidth) * 1000) / 10));
      settings.posY = Math.min(98, Math.max(2, Math.round((st.lastY / window.innerHeight) * 1000) / 10));
      place();
      saveSettings();
    }
  }

  function endDrag() {
    if (drag) {
      drag = null;
      if (host) host.classList.remove('esb-dragging');
    }
  }

  /* ---------------- 右键单击：滚动到最上 / 最下 ---------------- */

  /* 上按钮右键 → 滚到最上；下按钮右键 → 滚到最下（松开后触发，见 onRightUp）。 */
  function onRightClick(e, dir) {
    e.preventDefault();
    e.stopPropagation();
    rclick = dir ? { x: e.clientX, y: e.clientY, dir: dir } : null;
  }

  function onRightUp(e) {
    if (!rclick) return;
    const st = rclick;
    rclick = null;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (dx * dx + dy * dy > 64) return;   // 松开点与按下点距离超过 8px（如鼠标手势拖动）→ 不触发
    scrollToEdge(st.dir);
  }

  /* 平滑滚动到页面最上 / 最下：复用翻页速度引擎（速度连续，可与翻页连点接力） */
  function scrollToEdge(dir) {
    const target = getTarget();
    if (!target) return;
    const max = target.scrollHeight - target.clientHeight;
    if (max <= 0) return;
    const to = dir === 'up' ? 0 : max;
    const cur = target.scrollTop;
    if (Math.abs(to - cur) < 1) return;
    stopHold();
    cancelFlip();
    const now = performance.now();
    const dirSign = to > cur ? 1 : -1;
    const carry = (now - flipLastPeakAt) < 1500 ? Math.min(flipLastPeak * 0.9, FLIP_VMAX_CAP * spdEdge()) : 0;
    flip = { target: target, to: to, v: dirSign * carry, peak: carry, lastClick: now, last: now, raf: requestAnimationFrame(flipTick), edge: true };
  }

  /* ---------------- 中键（按下滚轮）：关闭当前标签页 ---------------- */

  /* 中键在按钮上按下 → 关闭当前标签页（按下即触发；设置「中键关闭标签」可关）。
     preventDefault 阻止 Chromium 中键「自动滚屏」默认行为；仅按钮范围内生效。 */
  function onMiddleDown(e) {
    if (e.button !== 1) return;
    if (settings.middleClose === false) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      chrome.runtime.sendMessage({ type: 'esb-close-tab' }, () => { void chrome.runtime.lastError; });
    } catch (err) { /* 忽略 */ }
  }

  /* ---------------- 小红书搜索页：隐藏「点点」AI 总结面板 ---------------- */

  /* 小红书搜索结果页会自动从右侧弹出「点点」AI 总结抽屉（元素 = #app > .container，
     关闭态在元素上带 .out 类）。本功能开启时：
       ① 注入一条 CSS 直接隐藏该抽屉（不挡搜索结果、不闪一下）；
       ② 抽屉每次被打开时点掉它的关闭按钮，让站点自己把状态收回（避免残留遮罩/侧栏位移）。
     只在 xiaohongshu.com 的搜索页生效，其他网站与其他页面完全不受影响。 */

  const XHS_AI_STYLE_ID = 'esb-xhs-ai-hide';
  const XHS_AI_CSS = '#app > .container{display:none !important;}';
  const XHS_AI_MAX_CLOSES = 20;   // 同一页面最多自动关闭次数（防站点反复弹时死循环）
  let xhsAiObserver = null;
  let xhsAiTimer = 0;
  let xhsAiCloses = 0;
  let xhsAiLastClose = 0;
  let xhsAiLastUrl = '';

  function xhsIsSite() {
    try { return /(^|\.)xiaohongshu\.com$/i.test(location.hostname); } catch (err) { return false; }
  }

  function xhsIsSearchPage() {
    try { return xhsIsSite() && location.pathname.indexOf('/search_result') === 0; } catch (err) { return false; }
  }

  function applyXhsAi() {
    if (window.top !== window) return;   // 只在顶层文档处理
    if (!xhsIsSite()) return;
    const on = settings.hideXhsAi !== false && xhsIsSearchPage();
    let el = document.getElementById(XHS_AI_STYLE_ID);
    if (!on) {
      if (el) el.remove();
      if (xhsAiObserver) { xhsAiObserver.disconnect(); xhsAiObserver = null; }
      return;
    }
    if (!el) {
      el = document.createElement('style');
      el.id = XHS_AI_STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = XHS_AI_CSS;
    startXhsAiWatch();
    closeXhsAiPanel(true);
  }

  /* 判断抽屉是否处于「打开」状态：元素存在且不带 .out */
  function xhsAiPanelOpen() {
    const panel = document.querySelector('#app > .container');
    return panel && !panel.classList.contains('out') ? panel : null;
  }

  function closeXhsAiPanel(force) {
    if (!xhsIsSearchPage()) return;
    const panel = xhsAiPanelOpen();
    if (!panel) return;
    const now = Date.now();
    if (!force && (xhsAiCloses >= XHS_AI_MAX_CLOSES || now - xhsAiLastClose < 400)) return;
    xhsAiCloses++;
    xhsAiLastClose = now;
    const btn = panel.querySelector('.header .right button.close-icon') || panel.querySelector('button.close-icon');
    if (btn) {
      // 先点它的关闭按钮（站点若响应，会自己把状态收回、连遮罩一起清理）
      try { btn.click(); } catch (err) { /* 忽略 */ }
    }
    // 无论如何立刻补标关闭态：站点对程序化点击不一定有反应，不能指望它；本扩展已隐藏该抽屉，改类不影响观感
    panel.classList.add('out');
  }

  function scheduleXhsAiCheck() {
    if (xhsAiTimer) return;
    xhsAiTimer = setTimeout(() => { xhsAiTimer = 0; closeXhsAiPanel(false); }, 250);
  }

  function startXhsAiWatch() {
    if (xhsAiObserver) return;
    const app = document.getElementById('app');
    if (!app) return;
    xhsAiObserver = new MutationObserver(scheduleXhsAiCheck);
    xhsAiObserver.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /* 站点是单页应用：站内跳转不重新加载页面，需轮询地址变化后重新判定是否该生效 */
  function watchXhsNav() {
    if (!xhsIsSite()) return;
    xhsAiLastUrl = location.href;
    setInterval(() => {
      if (location.href !== xhsAiLastUrl) {
        xhsAiLastUrl = location.href;
        applyXhsAi();
      }
    }, 1000);
  }

  /* ---------------- 启动 ---------------- */

  readSettings(() => {
    build();
    watchSettings();
    applyAll();
    applyXhsAi();           // 小红书搜索页：隐藏「点点」AI 面板
    watchXhsNav();
    onFullscreenChange();   // 初始同步（如扩展刷新时页面正处于全屏）
  });
})();

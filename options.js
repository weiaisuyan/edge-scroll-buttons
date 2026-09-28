/* 滚动按钮 - 设置页逻辑（多语言版） */
(() => {
  'use strict';

  const DEFAULTS = ESB_SHARED.DEFAULTS;
  const STYLES = ESB_SHARED.STYLES;
  const t = (k, f, s) => ESB_SHARED.t(k, f, s);
  const STYLE_GROUPS = ESB_SHARED.STYLE_GROUPS || [
    { id: 'solid', name: '纯色' },
    { id: 'grad', name: '渐变' },
    { id: 'glass', name: '玻璃' },
    { id: 'breath', name: '呼吸' },
    { id: 'flow', name: '流光' },
    { id: 'metal', name: '金属' }
  ];
  let S = Object.assign({}, DEFAULTS);
  let saveTimer = 0;

  const $ = (id) => document.getElementById(id);
  const preview = $('preview');
  const dots = $('dots');

  // 单位随语言切换
  const UNIT_SEC = ESB_SHARED.isZh() ? ' 秒' : ' s';
  const UNIT_PER_SEC = ESB_SHARED.isZh() ? ' px/秒' : ' px/s';

  try { ESB_SHARED.localize(document); } catch (err) { /* 忽略 */ }

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

  function save(now) {
    clearTimeout(saveTimer);
    if (now) { storageSet(); return; }
    saveTimer = setTimeout(storageSet, 120);
  }

  /* 旧版本遗留值迁移（如已删除的样式/方形） */
  function migrate() {
    let dirty = false;
    if (!STYLES[S.styleId]) { S.styleId = DEFAULTS.styleId; dirty = true; }
    if (S.shape !== 'circle' && S.shape !== 'rounded') { S.shape = 'circle'; dirty = true; }
    if (dirty) save(true);
  }

  /* ---------- 样式网格（分组 + 迷你按钮实景） ---------- */
  function makeMiniBtn(s) {
    const demo = document.createElement('span');
    demo.className = 'style-demo';
    demo.style.background = s.bg;
    if (s.border && s.border !== '0') demo.style.border = s.border;
    if (s.shadow) demo.style.boxShadow = s.shadow;
    if (s.blur) demo.classList.add('style-demo-blur');
    if (s.anim === 'pan') {
      demo.classList.add('demo-anim-pan');
      demo.style.backgroundSize = '230% 230%';
    } else if (s.anim === 'pulse') {
      demo.classList.add('demo-anim-pulse');
      demo.style.setProperty('--demo-glow-a', s.glowA || s.shadow || 'none');
      demo.style.setProperty('--demo-glow-b', s.glowB || s.shadow || 'none');
    }
    demo.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="' + (s.fg || '#ffffff') + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
    return demo;
  }

  function renderStyles() {
    const wrap = $('styles');
    wrap.innerHTML = '';
    STYLE_GROUPS.forEach((g) => {
      const sec = document.createElement('div');
      sec.className = 'style-group';
      const title = document.createElement('div');
      title.className = 'style-group-title';
      title.textContent = ESB_SHARED.groupName(g);
      sec.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'styles-grid';
      Object.keys(STYLES).forEach((id) => {
        const s = STYLES[id];
        if ((s.group || 'solid') !== g.id) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'style-card' + (id === S.styleId ? ' on' : '');
        b.title = ESB_SHARED.styleName(id, s);
        b.appendChild(makeMiniBtn(s));
        const nameEl = document.createElement('span');
        nameEl.className = 'style-name';
        nameEl.textContent = ESB_SHARED.styleName(id, s);
        b.appendChild(nameEl);
        b.addEventListener('click', () => {
          S.styleId = id;
          save(true);
          renderStyles();
          updatePreviewButtons();
        });
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  /* ---------- 形状选择 ---------- */
  const SHAPES = [
    { id: 'circle', name: '圆形', nameEn: 'Circle', r: '50%' },
    { id: 'rounded', name: '圆角', nameEn: 'Rounded', r: '30%' }
  ];

  function shapeLabel(sh) {
    return ESB_SHARED.isZh() ? sh.name : (sh.nameEn || sh.name);
  }

  function shapeRadius() {
    const sh = SHAPES.find((x) => x.id === S.shape) || SHAPES[0];
    return sh.r;
  }

  function renderShapes() {
    const wrap = $('shapes');
    wrap.innerHTML = '';
    SHAPES.forEach((sh) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'shape-card' + (sh.id === S.shape ? ' on' : '');
      const demo = document.createElement('span');
      demo.className = 'shape-demo';
      demo.style.borderRadius = sh.r;
      const nameEl = document.createElement('span');
      nameEl.className = 'shape-name';
      nameEl.textContent = shapeLabel(sh);
      b.appendChild(demo);
      b.appendChild(nameEl);
      b.addEventListener('click', () => {
        S.shape = sh.id;
        save(true);
        renderShapes();
        updatePreviewButtons();
      });
      wrap.appendChild(b);
    });
  }

  /* ---------- 预览：还原按钮实际样式 / 大小 / 透明度 ---------- */
  function updatePreviewButtons() {
    const s = STYLES[S.styleId] || STYLES.ink;
    const mini = Math.max(14, Math.min(Math.round(S.size * 0.55), 80));
    const gap = Math.max(2, Math.round(mini * 0.15));
    dots.style.gap = gap + 'px';
    dots.style.opacity = String(S.opacity);
    const dotEls = dots.querySelectorAll('.dot');
    for (let i = 0; i < dotEls.length; i++) {
      const d = dotEls[i];
      d.style.boxSizing = 'border-box';
      d.style.width = mini + 'px';
      d.style.height = mini + 'px';
      d.style.background = s.bg;
      d.style.border = s.border;
      d.style.boxShadow = s.shadow || 'none';
      d.style.borderRadius = shapeRadius();
    }
  }

  function drawDots() {
    dots.style.left = S.posX + '%';
    dots.style.top = S.posY + '%';
  }

  function updatePosText() {
    const x = Math.round(S.posX * 10) / 10;
    const y = Math.round(S.posY * 10) / 10;
    $('posText').textContent = ESB_SHARED.isZh()
      ? '水平 ' + x + '% · 垂直 ' + y + '%'
      : 'X ' + x + '% · Y ' + y + '%';
  }

  let dragging = false;

  function posFromEvent(e) {
    const r = preview.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let x = ((e.clientX - r.left) / r.width) * 100;
    let y = ((e.clientY - r.top) / r.height) * 100;
    x = Math.min(97, Math.max(3, x));
    y = Math.min(95, Math.max(5, y));
    S.posX = Math.round(x * 10) / 10;
    S.posY = Math.round(y * 10) / 10;
    drawDots();
    updatePosText();
  }

  preview.addEventListener('pointerdown', (e) => {
    dragging = true;
    try { preview.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    posFromEvent(e);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    posFromEvent(e);
    save();
  });
  preview.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    save(true);
  });
  preview.addEventListener('pointercancel', () => { dragging = false; });

  $('resetPos').addEventListener('click', () => {
    S.posX = DEFAULTS.posX;
    S.posY = DEFAULTS.posY;
    drawDots();
    updatePosText();
    save(true);
  });

  /* ---------- 控件 ---------- */
  $('size').addEventListener('input', (e) => {
    S.size = +e.target.value;
    $('sizeVal').textContent = S.size + ' px';
    updatePreviewButtons();
    save();
  });
  $('opacity').addEventListener('input', (e) => {
    S.opacity = (+e.target.value) / 100;
    $('opacityVal').textContent = e.target.value + '%';
    updatePreviewButtons();
    save();
  });
  $('ratio').addEventListener('input', (e) => {
    S.pageRatio = (+e.target.value) / 100;
    $('ratioVal').textContent = e.target.value + '%';
    save();
  });
  $('flipSpeed').addEventListener('input', (e) => {
    S.flipSpeed = +e.target.value;
    $('flipSpeedVal').textContent = S.flipSpeed.toFixed(1) + ' ×';
    save();
  });
  $('edgeSpeed').addEventListener('input', (e) => {
    S.edgeSpeed = +e.target.value;
    $('edgeSpeedVal').textContent = S.edgeSpeed.toFixed(1) + ' ×';
    save();
  });
  $('speed').addEventListener('input', (e) => {
    S.holdSpeed = +e.target.value;
    $('speedVal').textContent = e.target.value + UNIT_PER_SEC;
    save();
  });
  $('delay').addEventListener('input', (e) => {
    S.holdDelay = +e.target.value;
    $('delayVal').textContent = e.target.value + ' ms';
    save();
  });
  $('visible').addEventListener('change', (e) => {
    S.visible = e.target.checked;
    save(true);
  });
  $('middleClose').addEventListener('change', (e) => {
    S.middleClose = e.target.checked;
    save(true);
  });
  $('hideXhsAi').addEventListener('change', (e) => {
    S.hideXhsAi = e.target.checked;
    save(true);
  });

  /* ---------- 自动隐藏 ---------- */
  function syncIdleControls() {
    const on = !!S.idleFade;
    $('idleFade').checked = on;
    $('idleDelay').disabled = !on;
    $('idleOpacity').disabled = !on;
    document.querySelectorAll('.field.idle-sub').forEach((el) => el.classList.toggle('dim', !on));
  }

  $('idleFade').addEventListener('change', (e) => {
    S.idleFade = e.target.checked;
    save(true);
    syncIdleControls();
  });
  $('idleDelay').addEventListener('input', (e) => {
    S.idleDelay = +e.target.value;
    $('idleDelayVal').textContent = e.target.value + UNIT_SEC;
    save();
  });
  $('idleOpacity').addEventListener('input', (e) => {
    S.idleOpacity = (+e.target.value) / 100;
    $('idleOpacityVal').textContent = e.target.value + '%';
    save();
  });

  /* ---------- 网站排除 ---------- */
  function exclList() {
    return Array.isArray(S.excludedSites) ? S.excludedSites.slice() : [];
  }

  function renderExcl() {
    const wrap = $('exclList');
    wrap.innerHTML = '';
    const list = exclList();
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'excl-empty';
      empty.textContent = t('opt_excl_empty', '暂无排除的网站 —— 所有网站都会显示按钮');
      wrap.appendChild(empty);
      return;
    }
    list.forEach((raw, idx) => {
      const site = ESB_SHARED.normalizeSite(raw) || String(raw);
      const row = document.createElement('div');
      row.className = 'excl-row';
      const name = document.createElement('span');
      name.className = 'excl-site';
      name.textContent = site;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'excl-del';
      del.textContent = t('opt_remove', '移除');
      del.addEventListener('click', () => {
        const next = exclList();
        next.splice(idx, 1);
        S.excludedSites = next;
        save(true);
        renderExcl();
      });
      row.appendChild(name);
      row.appendChild(del);
      wrap.appendChild(row);
    });
  }

  function addExcl() {
    const input = $('exclInput');
    const err = $('exclErr');
    const site = ESB_SHARED.normalizeSite(input.value);
    if (!site) {
      err.textContent = input.value.trim()
        ? t('opt_excl_err_invalid', '无法识别为网址：请输入域名（如 zhihu.com），或直接粘贴完整网址')
        : t('opt_excl_err_empty', '请输入要排除的域名');
      return;
    }
    const list = exclList();
    if (list.some((raw) => ESB_SHARED.normalizeSite(raw) === site)) {
      err.textContent = t('opt_excl_err_dupe', '该网站已在列表中');
      return;
    }
    list.push(site);
    S.excludedSites = list;
    save(true);
    input.value = '';
    err.textContent = '';
    renderExcl();
  }

  $('exclAdd').addEventListener('click', addExcl);
  $('exclInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addExcl(); }
  });

  /* ---------- 清单与恢复（导入 / 导出） ---------- */
  const NUM_RANGES = {
    posX: [2, 98], posY: [2, 98], size: [40, 160], opacity: [0.3, 1],
    idleDelay: [1, 15], idleOpacity: [0.05, 0.6], pageRatio: [0.1, 1],
    flipSpeed: [0.5, 3], edgeSpeed: [0.5, 10], holdSpeed: [200, 3000], holdDelay: [100, 600]
  };

  function bakMsg(text, cls) {
    const el = $('bakMsg');
    el.textContent = text || '';
    el.className = 'hint bak-msg' + (cls ? ' ' + cls : '');
    clearTimeout(bakMsg._t);
    if (text && cls === 'ok') {
      bakMsg._t = setTimeout(() => {
        el.textContent = '';
        el.className = 'hint bak-msg';
      }, 4500);
    }
  }

  function buildBackup() {
    let ver = 'unknown';
    try { ver = chrome.runtime.getManifest().version; } catch (err) { /* 忽略 */ }
    return {
      app: 'edge-scroll-buttons',
      version: ver,
      exportedAt: new Date().toISOString(),
      settings: S
    };
  }

  function sanitizeSettings(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    let hit = 0;
    if (typeof raw.visible === 'boolean') { out.visible = raw.visible; hit++; }
    if (typeof raw.idleFade === 'boolean') { out.idleFade = raw.idleFade; hit++; }
    if (typeof raw.middleClose === 'boolean') { out.middleClose = raw.middleClose; hit++; }
    if (typeof raw.hideXhsAi === 'boolean') { out.hideXhsAi = raw.hideXhsAi; hit++; }
    Object.keys(NUM_RANGES).forEach((k) => {
      const v = raw[k];
      if (typeof v === 'number' && isFinite(v)) {
        out[k] = Math.min(Math.max(v, NUM_RANGES[k][0]), NUM_RANGES[k][1]);
        hit++;
      }
    });
    if (typeof raw.styleId === 'string' && STYLES[raw.styleId]) { out.styleId = raw.styleId; hit++; }
    if (raw.shape === 'circle' || raw.shape === 'rounded') { out.shape = raw.shape; hit++; }
    if (Array.isArray(raw.excludedSites)) {
      out.excludedSites = [];
      raw.excludedSites.forEach((x) => {
        const e = ESB_SHARED.normalizeSite(x);
        if (e && out.excludedSites.indexOf(e) < 0) out.excludedSites.push(e);
      });
      hit++;
    }
    return hit ? out : null;
  }

  $('bakExport').addEventListener('click', () => {
    try {
      const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      const p = (n) => (n < 10 ? '0' + n : '' + n);
      a.href = url;
      a.download = 'scroll-buttons-settings-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      bakMsg(t('opt_bak_exported', '已导出：包含样式、位置、速度与排除名单 —— 重装后用它即可恢复'), 'ok');
    } catch (err) {
      bakMsg(t('opt_bak_export_fail', '导出失败：') + err, 'err');
    }
  });

  $('bakImport').addEventListener('click', () => $('bakFile').click());
  $('bakFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try { data = JSON.parse(String(reader.result)); } catch (err) {
        bakMsg(t('opt_bak_bad_json', '导入失败：不是有效的 JSON 文件'), 'err');
        return;
      }
      const src = (data && typeof data === 'object' && data.settings && typeof data.settings === 'object')
        ? data.settings
        : data;
      const clean = sanitizeSettings(src);
      if (!clean) {
        bakMsg(t('opt_bak_no_settings', '导入失败：文件里没有可识别的设置'), 'err');
        return;
      }
      S = Object.assign({}, DEFAULTS, clean);
      save(true);
      render();
      const n = Array.isArray(S.excludedSites) ? S.excludedSites.length : 0;
      bakMsg(n ? t('opt_bak_restored_n', '已恢复设置，含 ' + n + ' 个排除网站', [String(n)]) : t('opt_bak_restored', '已恢复设置'), 'ok');
    };
    reader.onerror = () => bakMsg(t('opt_bak_read_fail', '导入失败：文件读取错误'), 'err');
    reader.readAsText(f);
  });

  /* ---------- 反馈：复制邮箱 ---------- */
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (err) { /* 忽略 */ }
    document.body.removeChild(ta);
  }

  $('copyMail').addEventListener('click', () => {
    const mail = 'weiaisuyansjd@gmail.com';
    const done = () => {
      $('copyOk').textContent = t('opt_copied', '已复制');
      setTimeout(() => { $('copyOk').textContent = ''; }, 1600);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(done, () => fallbackCopy(mail, done));
      } else {
        fallbackCopy(mail, done);
      }
    } catch (err) { fallbackCopy(mail, done); }
  });

  /* ---------- 渲染 ---------- */
  function render() {
    $('visible').checked = !!S.visible;
    $('middleClose').checked = S.middleClose !== false;
    $('hideXhsAi').checked = S.hideXhsAi !== false;
    $('size').value = S.size;
    $('sizeVal').textContent = Math.round(S.size) + ' px';
    $('opacity').value = Math.round(S.opacity * 100);
    $('opacityVal').textContent = Math.round(S.opacity * 100) + '%';
    $('idleDelay').value = S.idleDelay;
    $('idleDelayVal').textContent = Math.round(S.idleDelay) + UNIT_SEC;
    $('idleOpacity').value = Math.round(S.idleOpacity * 100);
    $('idleOpacityVal').textContent = Math.round(S.idleOpacity * 100) + '%';
    syncIdleControls();
    $('ratio').value = Math.round(S.pageRatio * 100);
    $('ratioVal').textContent = Math.round(S.pageRatio * 100) + '%';
    $('flipSpeed').value = S.flipSpeed;
    $('flipSpeedVal').textContent = (+S.flipSpeed || 1).toFixed(1) + ' ×';
    $('edgeSpeed').value = S.edgeSpeed;
    $('edgeSpeedVal').textContent = (+S.edgeSpeed || 1).toFixed(1) + ' ×';
    $('speed').value = S.holdSpeed;
    $('speedVal').textContent = Math.round(S.holdSpeed) + UNIT_PER_SEC;
    $('delay').value = S.holdDelay;
    $('delayVal').textContent = Math.round(S.holdDelay) + ' ms';
    renderStyles();
    renderShapes();
    renderExcl();
    updatePreviewButtons();
    drawDots();
    updatePosText();
  }

  try {
    $('ver').textContent = t('app_name', '滚动按钮') + ' v' + chrome.runtime.getManifest().version;
  } catch (err) { /* 独立预览时忽略 */ }

  storageGet(() => {
    migrate();
    render();
  });
})();

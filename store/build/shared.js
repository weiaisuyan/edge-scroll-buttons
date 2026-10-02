/* 滚动按钮 - 共享定义（content script 与设置页共用） */
var ESB_SHARED = {
  DEFAULTS: {
    posX: 96,          // 按钮组中心：水平位置（视口宽度的百分比）
    posY: 50,          // 按钮组中心：垂直位置（视口高度的百分比）
    size: 52,          // 按钮直径（px，40–160）
    opacity: 0.7,      // 按钮透明度（常态）
    idleFade: true,    // 闲置自动淡化：鼠标离开按钮后进一步变淡
    idleDelay: 3,      // 闲置多少秒后开始变淡（秒，1–15）
    idleOpacity: 0.15, // 闲置（变淡）时的透明度（0.05–0.6）
    pageRatio: 0.8,    // 单击翻页幅度（占一屏高度的比例）
    flipSpeed: 1.0,    // 单击翻页滑动速度倍率（0.5–3.0；1.0 为标准）
    edgeSpeed: 1.0,    // 右键滚到最上/最下的速度倍率（0.5–10；1.0 为标准）
    holdSpeed: 700,    // 按住滚动速度（像素/秒）
    holdDelay: 200,    // 按住多久后进入连续滚动（ms）
    middleClose: true, // 中键（按下滚轮）单击按钮：关闭当前标签页
    shape: 'circle',   // 按钮形状：circle 圆形 / rounded 圆角
    styleId: 'ink',    // 按钮样式
    visible: true,     // 是否在页面上显示按钮
    excludedSites: [], // 网站排除列表：其中的网站（含子域名）不显示按钮
    hideXhsAi: true    // 小红书全站：隐藏并关闭自动弹出的「点点」AI 面板
  },

  /* 样式分类（设置页与文档共用；每类数量保持一致，便于浏览） */
  STYLE_GROUPS: [
    { id: 'solid', name: '纯色' },
    { id: 'grad', name: '渐变' },
    { id: 'glass', name: '玻璃' },
    { id: 'breath', name: '呼吸' },
    { id: 'flow', name: '流光' },
    { id: 'metal', name: '金属' }
  ],

  /* 按钮样式：6 组 × 6 款 = 36 款。
     分组规则（组内效果严格一致）：
       solid  纯色 —— 单色实底，无渐变、无动效
       grad   渐变 —— 静态渐变，无动效
       glass  玻璃 —— 半透明 + 背景模糊，无动效
       breath 呼吸 —— 深底 + 同色辉光，呼吸灯脉动（anim: pulse）
       flow   流光 —— 多彩渐变 + 流光移动（anim: pan）
       metal  金属 —— 金属质感渐变，无动效
     字段：bg/hover/active/fg/border/shadow/shadowHover（+blur / anim / glowA / glowB） */
  STYLES: {
    /* ================= 纯色（6） ================= */
    ink: {
      group: 'solid', name: '经典深灰',
      bg: 'rgba(62,74,88,.85)', hover: 'rgba(76,92,110,.95)', active: 'rgba(101,121,143,1)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.16)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(19,25,33,.25), 0 4px 12px rgba(19,25,33,.28)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.24), 0 2px 4px rgba(19,25,33,.26), 0 10px 24px rgba(19,25,33,.34)'
    },
    charcoal: {
      group: 'solid', name: '碳黑',
      bg: 'rgba(24,28,33,.9)', hover: 'rgba(38,44,51,.95)', active: 'rgba(52,60,69,1)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.14)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.1), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.32)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.13), 0 2px 5px rgba(0,0,0,.32), 0 10px 24px rgba(0,0,0,.38)'
    },
    blue: {
      group: 'solid', name: '雾蓝',
      bg: 'rgba(99,127,158,.85)', hover: 'rgba(113,142,172,.95)', active: 'rgba(128,156,184,1)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.22)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.24), 0 1px 2px rgba(37,54,74,.25), 0 4px 12px rgba(37,54,74,.3)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 5px rgba(37,54,74,.28), 0 10px 24px rgba(37,54,74,.36)'
    },
    green: {
      group: 'solid', name: '湖水绿',
      bg: 'rgba(111,149,132,.85)', hover: 'rgba(125,163,146,.95)', active: 'rgba(139,177,160,1)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.22)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.24), 0 1px 2px rgba(36,58,48,.24), 0 4px 12px rgba(36,58,48,.28)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 5px rgba(36,58,48,.26), 0 10px 24px rgba(36,58,48,.34)'
    },
    purple: {
      group: 'solid', name: '香芋紫',
      bg: 'rgba(141,128,168,.85)', hover: 'rgba(155,142,182,.95)', active: 'rgba(169,156,196,1)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.22)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.24), 0 1px 2px rgba(44,38,62,.24), 0 4px 12px rgba(44,38,62,.28)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.3), 0 2px 5px rgba(44,38,62,.26), 0 10px 24px rgba(44,38,62,.34)'
    },
    ikb: {
      group: 'solid', name: '克莱因蓝',
      bg: '#002fa7', hover: '#0a3ec2', active: '#00258f',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.26)',
      shadow: 'inset 0 1px 0 rgba(160,190,255,.35), 0 1px 2px rgba(0,15,60,.45), 0 5px 16px rgba(0,25,110,.45)',
      shadowHover: 'inset 0 1px 0 rgba(180,205,255,.42), 0 2px 5px rgba(0,15,60,.45), 0 10px 26px rgba(0,25,120,.55)'
    },

    /* ================= 渐变（6） ================= */
    dusk: {
      group: 'grad', name: '暮云',
      bg: 'linear-gradient(140deg, #6b849f, #7b6d97)',
      hover: 'linear-gradient(140deg, #7a93ac, #8a7ca6)',
      active: 'linear-gradient(140deg, #5d7690, #6d6088)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.18)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(60,66,92,.3), 0 4px 12px rgba(60,66,92,.34)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.32), 0 2px 5px rgba(60,66,92,.3), 0 10px 24px rgba(60,66,92,.4)'
    },
    sunset: {
      group: 'grad', name: '暖霞',
      bg: 'linear-gradient(140deg, #967952, #946c65)',
      hover: 'linear-gradient(140deg, #a68a64, #a37d76)',
      active: 'linear-gradient(140deg, #856b4e, #82615b)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.18)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(92,64,42,.3), 0 4px 12px rgba(92,64,42,.34)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.32), 0 2px 5px rgba(92,64,42,.3), 0 10px 24px rgba(92,64,42,.4)'
    },
    ocean: {
      group: 'grad', name: '深海',
      bg: 'linear-gradient(140deg, #54708f, #5d8473)',
      hover: 'linear-gradient(140deg, #627ea2, #6e9281)',
      active: 'linear-gradient(140deg, #496580, #527968)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.18)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(52,84,80,.3), 0 4px 12px rgba(52,84,80,.34)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.32), 0 2px 5px rgba(52,84,80,.3), 0 10px 24px rgba(52,84,80,.4)'
    },
    aurora: {
      group: 'grad', name: '极光',
      bg: 'linear-gradient(140deg, #5d8473, #7b6d97)',
      hover: 'linear-gradient(140deg, #6b937f, #8a7ca6)',
      active: 'linear-gradient(140deg, #527968, #6d6088)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.18)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(70,80,105,.3), 0 4px 12px rgba(70,80,105,.34)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.32), 0 2px 5px rgba(70,80,105,.3), 0 10px 24px rgba(70,80,105,.4)'
    },
    peach: {
      group: 'grad', name: '蜜桃霞',
      bg: 'linear-gradient(140deg, #ffb199, #ff8fab 55%, #e77fae)',
      hover: 'linear-gradient(140deg, #ffc1ac, #ffa0b9 55%, #f091bd)',
      active: 'linear-gradient(140deg, #f29d85, #ef7f9d 55%, #d16e9e)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.35)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 1px 2px rgba(140,70,95,.28), 0 5px 14px rgba(150,80,105,.3)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.55), 0 2px 5px rgba(140,70,95,.28), 0 10px 24px rgba(150,80,105,.36)'
    },
    dawn: {
      group: 'grad', name: '晨曦',
      bg: 'linear-gradient(140deg, #ffd97a, #ffb45c 45%, #ff8f6b)',
      hover: 'linear-gradient(140deg, #ffe38f, #ffc26e 45%, #ff9f7a)',
      active: 'linear-gradient(140deg, #f0c965, #efa44b 45%, #ef7d58)',
      fg: '#5c3a12', border: '1px solid rgba(255,255,255,.5)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 1px 2px rgba(150,95,30,.25), 0 5px 14px rgba(160,105,40,.28)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.7), 0 2px 5px rgba(150,95,30,.25), 0 10px 24px rgba(160,105,40,.34)'
    },

    /* ================= 玻璃（6，半透明 + 背景模糊） ================= */
    glass: {
      group: 'glass', name: '玻璃',
      bg: 'rgba(36,42,50,.42)', hover: 'rgba(48,56,66,.58)', active: 'rgba(62,72,84,.7)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.4)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(0,0,0,.18), 0 4px 14px rgba(0,0,0,.26)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.32), 0 2px 5px rgba(0,0,0,.2), 0 10px 26px rgba(0,0,0,.32)',
      blur: true
    },
    liquidGlass: {
      group: 'glass', name: '液态玻璃',
      bg: 'rgba(250,251,253,.5)', hover: 'rgba(255,255,255,.66)', active: 'rgba(235,240,246,.6)',
      fg: '#39424f', border: '1px solid rgba(255,255,255,.85)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.95), inset 0 -8px 18px rgba(150,165,190,.18), 0 1px 2px rgba(40,55,75,.18), 0 6px 18px rgba(40,55,75,.22)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -8px 20px rgba(150,165,190,.22), 0 2px 6px rgba(40,55,75,.2), 0 12px 28px rgba(40,55,75,.28)',
      blur: true
    },
    spaceGlass: {
      group: 'glass', name: '深空玻璃',
      bg: 'rgba(24,29,42,.5)', hover: 'rgba(34,41,58,.62)', active: 'rgba(44,52,72,.7)',
      fg: '#e8eeff', border: '1px solid rgba(150,175,255,.4)',
      shadow: 'inset 0 1px 0 rgba(210,225,255,.28), inset 0 -8px 20px rgba(10,14,30,.4), 0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.34)',
      shadowHover: 'inset 0 1px 0 rgba(220,232,255,.36), inset 0 -8px 22px rgba(10,14,30,.44), 0 2px 6px rgba(0,0,0,.3), 0 12px 28px rgba(0,0,0,.4)',
      blur: true
    },
    pearl: {
      group: 'glass', name: '珍珠',
      bg: 'linear-gradient(160deg, #fdf3f7, #eef1f8 52%, #faf4ec)',
      hover: 'linear-gradient(160deg, #fff8fb, #f3f6fc 52%, #fdf8f1)',
      active: 'linear-gradient(160deg, #f4e9ef, #e4e8f2 52%, #f1eae0)',
      fg: '#4c4f5c', border: '1px solid rgba(255,255,255,.9)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.95), 0 1px 2px rgba(90,95,120,.2), 0 5px 16px rgba(100,105,135,.24)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,1), 0 2px 5px rgba(90,95,120,.2), 0 10px 24px rgba(100,105,135,.3)',
      blur: true
    },
    iceGlass: {
      group: 'glass', name: '冰晶',
      bg: 'rgba(226,240,252,.5)', hover: 'rgba(238,246,255,.64)', active: 'rgba(212,228,244,.6)',
      fg: '#3c4a5c', border: '1px solid rgba(255,255,255,.9)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.95), inset 0 -8px 18px rgba(140,170,210,.2), 0 1px 2px rgba(50,70,100,.18), 0 6px 18px rgba(50,70,100,.22)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -8px 20px rgba(140,170,210,.24), 0 2px 6px rgba(50,70,100,.2), 0 12px 28px rgba(50,70,100,.28)',
      blur: true
    },
    obsidian: {
      group: 'glass', name: '墨曜',
      bg: 'rgba(16,18,24,.55)', hover: 'rgba(26,29,37,.66)', active: 'rgba(36,40,50,.72)',
      fg: '#dfe4ee', border: '1px solid rgba(180,195,230,.35)',
      shadow: 'inset 0 1px 0 rgba(210,220,245,.22), inset 0 -8px 20px rgba(5,7,12,.5), 0 1px 2px rgba(0,0,0,.35), 0 6px 18px rgba(0,0,0,.4)',
      shadowHover: 'inset 0 1px 0 rgba(220,230,250,.3), inset 0 -8px 22px rgba(5,7,12,.54), 0 2px 6px rgba(0,0,0,.35), 0 12px 28px rgba(0,0,0,.46)',
      blur: true
    },

    /* ================= 呼吸（6，呼吸灯脉动 anim: pulse） ================= */
    neonPink: {
      group: 'breath', name: '霓虹粉',
      bg: 'rgba(44,22,36,.95)', hover: 'rgba(58,30,48,.97)', active: 'rgba(74,38,60,1)',
      fg: '#ffd3e6', border: '1px solid rgba(255,120,180,.62)',
      shadow: 'inset 0 1px 0 rgba(255,200,225,.2), 0 0 12px rgba(255,110,175,.42), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      shadowHover: 'inset 0 1px 0 rgba(255,210,232,.28), 0 0 20px rgba(255,120,185,.6), 0 2px 5px rgba(0,0,0,.3), 0 10px 22px rgba(0,0,0,.38)',
      anim: 'pulse',
      glowA: 'inset 0 1px 0 rgba(255,200,225,.2), 0 0 12px rgba(255,110,175,.42), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      glowB: 'inset 0 1px 0 rgba(255,210,232,.26), 0 0 22px rgba(255,130,190,.68), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)'
    },
    neonGreen: {
      group: 'breath', name: '霓虹绿',
      bg: 'rgba(16,32,26,.95)', hover: 'rgba(22,42,34,.97)', active: 'rgba(30,54,44,1)',
      fg: '#c8f5d8', border: '1px solid rgba(110,235,165,.6)',
      shadow: 'inset 0 1px 0 rgba(190,245,215,.2), 0 0 12px rgba(90,225,150,.4), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      shadowHover: 'inset 0 1px 0 rgba(200,248,222,.28), 0 0 20px rgba(100,232,160,.58), 0 2px 5px rgba(0,0,0,.3), 0 10px 22px rgba(0,0,0,.38)',
      anim: 'pulse',
      glowA: 'inset 0 1px 0 rgba(190,245,215,.2), 0 0 12px rgba(90,225,150,.4), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      glowB: 'inset 0 1px 0 rgba(200,248,222,.26), 0 0 22px rgba(105,235,165,.66), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)'
    },
    neonCyan: {
      group: 'breath', name: '霓虹青',
      bg: 'rgba(22,32,44,.95)', hover: 'rgba(30,43,58,.97)', active: 'rgba(40,56,74,1)',
      fg: '#cfe8f4', border: '1px solid rgba(127,180,200,.65)',
      shadow: 'inset 0 1px 0 rgba(190,225,240,.18), 0 0 12px rgba(110,175,205,.45), 0 1px 2px rgba(0,0,0,.28), 0 4px 10px rgba(0,0,0,.32)',
      shadowHover: 'inset 0 1px 0 rgba(190,225,240,.24), 0 0 18px rgba(115,180,210,.6), 0 2px 5px rgba(0,0,0,.3), 0 10px 22px rgba(0,0,0,.38)',
      anim: 'pulse',
      glowA: 'inset 0 1px 0 rgba(190,225,240,.18), 0 0 12px rgba(110,175,205,.45), 0 1px 2px rgba(0,0,0,.28), 0 4px 10px rgba(0,0,0,.32)',
      glowB: 'inset 0 1px 0 rgba(200,232,246,.24), 0 0 22px rgba(120,185,215,.68), 0 1px 2px rgba(0,0,0,.28), 0 4px 10px rgba(0,0,0,.32)'
    },
    neonViolet: {
      group: 'breath', name: '霓虹紫',
      bg: 'rgba(34,28,46,.95)', hover: 'rgba(45,37,60,.97)', active: 'rgba(58,48,76,1)',
      fg: '#e4d9f5', border: '1px solid rgba(165,145,205,.65)',
      shadow: 'inset 0 1px 0 rgba(230,215,250,.18), 0 0 12px rgba(160,140,200,.45), 0 1px 2px rgba(0,0,0,.28), 0 4px 10px rgba(0,0,0,.32)',
      shadowHover: 'inset 0 1px 0 rgba(230,215,250,.24), 0 0 18px rgba(165,145,205,.6), 0 2px 5px rgba(0,0,0,.3), 0 10px 22px rgba(0,0,0,.38)',
      anim: 'pulse',
      glowA: 'inset 0 1px 0 rgba(230,215,250,.18), 0 0 12px rgba(160,140,200,.45), 0 1px 2px rgba(0,0,0,.28), 0 4px 10px rgba(0,0,0,.32)',
      glowB: 'inset 0 1px 0 rgba(235,222,252,.24), 0 0 22px rgba(168,148,208,.68), 0 1px 2px rgba(0,0,0,.28), 0 4px 10px rgba(0,0,0,.32)'
    },
    neonBlue: {
      group: 'breath', name: '霓虹蓝',
      bg: 'rgba(16,24,44,.95)', hover: 'rgba(22,33,58,.97)', active: 'rgba(30,44,74,1)',
      fg: '#cfe0ff', border: '1px solid rgba(110,155,255,.62)',
      shadow: 'inset 0 1px 0 rgba(190,215,255,.2), 0 0 12px rgba(90,140,255,.42), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      shadowHover: 'inset 0 1px 0 rgba(200,222,255,.28), 0 0 20px rgba(100,150,255,.6), 0 2px 5px rgba(0,0,0,.3), 0 10px 22px rgba(0,0,0,.38)',
      anim: 'pulse',
      glowA: 'inset 0 1px 0 rgba(190,215,255,.2), 0 0 12px rgba(90,140,255,.42), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      glowB: 'inset 0 1px 0 rgba(200,222,255,.26), 0 0 22px rgba(105,152,255,.68), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)'
    },
    neonGold: {
      group: 'breath', name: '霓虹金',
      bg: 'rgba(40,32,14,.95)', hover: 'rgba(52,42,20,.97)', active: 'rgba(66,54,28,1)',
      fg: '#ffe9b3', border: '1px solid rgba(255,206,110,.65)',
      shadow: 'inset 0 1px 0 rgba(255,235,180,.2), 0 0 12px rgba(255,190,80,.42), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      shadowHover: 'inset 0 1px 0 rgba(255,238,190,.28), 0 0 20px rgba(255,198,95,.6), 0 2px 5px rgba(0,0,0,.3), 0 10px 22px rgba(0,0,0,.38)',
      anim: 'pulse',
      glowA: 'inset 0 1px 0 rgba(255,235,180,.2), 0 0 12px rgba(255,190,80,.42), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)',
      glowB: 'inset 0 1px 0 rgba(255,238,190,.26), 0 0 22px rgba(255,200,100,.68), 0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.34)'
    },

    /* ================= 流光（6，彩色渐变 + 流光移动 anim: pan） ================= */
    cyber: {
      group: 'flow', name: '赛博',
      bg: 'linear-gradient(140deg, #ff2ea6, #7b2eff 52%, #00c8ff)',
      hover: 'linear-gradient(140deg, #ff47b2, #8f4aff 52%, #2bd4ff)',
      active: 'linear-gradient(140deg, #e61e92, #6a20e6 52%, #00b2e6)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.25)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 0 16px rgba(150,60,255,.45), 0 1px 2px rgba(30,10,50,.4), 0 4px 14px rgba(60,20,90,.45)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.38), 0 0 24px rgba(160,80,255,.6), 0 2px 6px rgba(30,10,50,.4), 0 10px 26px rgba(60,20,90,.5)',
      anim: 'pan'
    },
    holo: {
      group: 'flow', name: '全息',
      bg: 'linear-gradient(120deg, #a5b4fc, #e9a8ff 22%, #ffc2dd 40%, #b5f0d8 58%, #9fd4ff 78%, #c9b3ff)',
      hover: 'linear-gradient(120deg, #b6c4ff, #f0b8ff 22%, #ffd0e6 40%, #c6f5e2 58%, #b0e0ff 78%, #d6c4ff)',
      active: 'linear-gradient(120deg, #93a3ef, #d898f0 22%, #f0b0d0 40%, #a3e0c8 58%, #8fc4ef 78%, #b8a2ef)',
      fg: '#44405e', border: '1px solid rgba(255,255,255,.7)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.75), 0 1px 2px rgba(70,60,110,.24), 0 5px 16px rgba(90,80,140,.3)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.85), 0 2px 5px rgba(70,60,110,.25), 0 10px 26px rgba(90,80,140,.36)',
      anim: 'pan'
    },
    polarLight: {
      group: 'flow', name: '极光流',
      bg: 'linear-gradient(120deg, #22c8a8, #3b82f6 38%, #8b5cf6 68%, #22d3ee)',
      hover: 'linear-gradient(120deg, #35d6b6, #4f92ff 38%, #9a6fff 68%, #38ddf5)',
      active: 'linear-gradient(120deg, #17b294, #3374e0 38%, #7a4fe0 68%, #15bed6)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.3)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 0 14px rgba(90,140,255,.35), 0 1px 2px rgba(20,50,90,.35), 0 5px 14px rgba(25,60,110,.38)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.5), 0 0 22px rgba(100,150,255,.5), 0 2px 5px rgba(20,50,90,.35), 0 10px 24px rgba(25,60,110,.44)',
      anim: 'pan'
    },
    lava: {
      group: 'flow', name: '熔岩',
      bg: 'linear-gradient(140deg, #ffb03a, #f4572e 55%, #d22d47)',
      hover: 'linear-gradient(140deg, #ffc050, #ff6a3d 55%, #e03a54)',
      active: 'linear-gradient(140deg, #f09a24, #e04a22 55%, #bd2439)',
      fg: '#fff7ef', border: '1px solid rgba(255,220,180,.4)',
      shadow: 'inset 0 1px 0 rgba(255,235,205,.4), 0 0 14px rgba(255,110,60,.4), 0 1px 2px rgba(80,25,10,.4), 0 4px 12px rgba(90,30,12,.42)',
      shadowHover: 'inset 0 1px 0 rgba(255,240,215,.5), 0 0 22px rgba(255,120,70,.58), 0 2px 5px rgba(80,25,10,.4), 0 10px 24px rgba(90,30,12,.48)',
      anim: 'pan'
    },
    emerald: {
      group: 'flow', name: '翡翠',
      bg: 'linear-gradient(140deg, #7ee8a2, #34b891 48%, #0e9488)',
      hover: 'linear-gradient(140deg, #8ef0b0, #42c69e 48%, #1aa294)',
      active: 'linear-gradient(140deg, #6bd892, #2aa47e 48%, #0c7f75)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.35)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.5), 0 0 12px rgba(60,200,150,.32), 0 1px 2px rgba(10,70,55,.35), 0 5px 14px rgba(15,80,65,.36)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.6), 0 0 20px rgba(70,210,160,.46), 0 2px 5px rgba(10,70,55,.35), 0 10px 24px rgba(15,80,65,.42)',
      anim: 'pan'
    },
    nebula: {
      group: 'flow', name: '星云',
      bg: 'linear-gradient(130deg, #8b5cf6, #d24fe0 36%, #5b6cff 66%, #2fb8d8)',
      hover: 'linear-gradient(130deg, #9a70f8, #dd62e8 36%, #6c7cff 66%, #44c6e4)',
      active: 'linear-gradient(130deg, #7a4ce6, #c03ecf 36%, #4a5aef 66%, #1fa6c6)',
      fg: '#ffffff', border: '1px solid rgba(255,255,255,.3)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.42), 0 0 16px rgba(160,90,255,.4), 0 1px 2px rgba(40,20,80,.4), 0 5px 16px rgba(50,25,95,.44)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.5), 0 0 24px rgba(170,100,255,.55), 0 2px 6px rgba(40,20,80,.4), 0 10px 26px rgba(50,25,95,.5)',
      anim: 'pan'
    },

    /* ================= 金属（6） ================= */
    chrome: {
      group: 'metal', name: '铬光金属',
      bg: 'linear-gradient(180deg, #fafcff 0%, #cfd8e3 28%, #8e9bab 52%, #dde5ee 72%, #a9b6c5 100%)',
      hover: 'linear-gradient(180deg, #ffffff 0%, #dbe3ec 28%, #9dabbb 52%, #e8eef5 72%, #b8c4d2 100%)',
      active: 'linear-gradient(180deg, #e8edf4 0%, #bcc7d4 28%, #7c8999 52%, #ccd6e0 72%, #98a5b4 100%)',
      fg: '#2b3340', border: '1px solid rgba(255,255,255,.7)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(90,105,125,.35), 0 1px 2px rgba(40,50,65,.3), 0 5px 14px rgba(50,60,80,.32)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(90,105,125,.4), 0 2px 5px rgba(40,50,65,.3), 0 10px 24px rgba(50,60,80,.4)'
    },
    goldRim: {
      group: 'metal', name: '鎏金',
      bg: 'rgba(26,21,13,.95)', hover: 'rgba(38,31,19,.97)', active: 'rgba(50,41,26,1)',
      fg: '#ffdf9f', border: '1px solid rgba(255,203,110,.8)',
      shadow: 'inset 0 1px 0 rgba(255,230,170,.22), 0 0 14px rgba(255,186,80,.32), 0 1px 2px rgba(0,0,0,.35), 0 4px 12px rgba(0,0,0,.4)',
      shadowHover: 'inset 0 1px 0 rgba(255,236,185,.3), 0 0 22px rgba(255,196,95,.5), 0 2px 5px rgba(0,0,0,.35), 0 10px 24px rgba(0,0,0,.46)'
    },
    roseGold: {
      group: 'metal', name: '玫瑰金',
      bg: 'linear-gradient(140deg, #f8cfc4, #eab0a4 50%, #dc968c)',
      hover: 'linear-gradient(140deg, #ffdcd2, #f5bcb0 50%, #e6a298)',
      active: 'linear-gradient(140deg, #edbfb3, #dc9d90 50%, #c98278)',
      fg: '#63392f', border: '1px solid rgba(255,255,255,.55)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.7), 0 1px 2px rgba(120,70,55,.28), 0 5px 14px rgba(140,85,68,.3)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.85), 0 2px 5px rgba(120,70,55,.28), 0 10px 24px rgba(140,85,68,.36)'
    },
    titanium: {
      group: 'metal', name: '钛银',
      bg: 'linear-gradient(160deg, #7b8592, #59636e 52%, #454e58)',
      hover: 'linear-gradient(160deg, #8a94a1, #67717d 52%, #525b66)',
      active: 'linear-gradient(160deg, #6d7683, #4d5661 52%, #3a424b)',
      fg: '#eef2f7', border: '1px solid rgba(255,255,255,.28)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.35), inset 0 -1px 0 rgba(0,0,0,.25), 0 1px 2px rgba(20,26,34,.4), 0 5px 14px rgba(25,32,42,.42)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.3), 0 2px 5px rgba(20,26,34,.4), 0 10px 24px rgba(25,32,42,.5)'
    },
    bronze: {
      group: 'metal', name: '青铜',
      bg: 'linear-gradient(160deg, #9c7d52, #775f3c 55%, #5a472c)',
      hover: 'linear-gradient(160deg, #ac8d60, #87704a 55%, #6a5637)',
      active: 'linear-gradient(160deg, #886b44, #654f31 55%, #4a3a24)',
      fg: '#f3e3c2', border: '1px solid rgba(255,235,190,.35)',
      shadow: 'inset 0 1px 0 rgba(255,235,195,.4), inset 0 -1px 0 rgba(40,28,12,.4), 0 1px 2px rgba(45,32,14,.4), 0 5px 14px rgba(55,40,18,.42)',
      shadowHover: 'inset 0 1px 0 rgba(255,240,205,.5), inset 0 -1px 0 rgba(40,28,12,.45), 0 2px 5px rgba(45,32,14,.4), 0 10px 24px rgba(55,40,18,.5)'
    },
    champagne: {
      group: 'metal', name: '香槟金',
      bg: 'linear-gradient(160deg, #f6ead0, #e6d2a8 52%, #d8bd8d)',
      hover: 'linear-gradient(160deg, #fdf2dc, #efdcb4 52%, #e3c99a)',
      active: 'linear-gradient(160deg, #ecdcc0, #dcc596 52%, #c9ac7a)',
      fg: '#6b552e', border: '1px solid rgba(255,255,255,.7)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(140,110,60,.25), 0 1px 2px rgba(120,95,50,.25), 0 5px 14px rgba(130,100,55,.28)',
      shadowHover: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(140,110,60,.3), 0 2px 5px rgba(120,95,50,.25), 0 10px 24px rgba(130,100,55,.34)'
    }
  }
};

/* ---------- 网站排除：域名清洗与匹配（设置页 / 弹窗 / 页面脚本共用） ---------- */

/* 把用户输入（域名或整段网址）清洗成规范域名：
   - 去协议、user:pass@、路径/查询/锚点、端口、结尾点、开头 www.（域名级：www.zhihu.com 与 zhihu.com 视为同一网站）
   - 支持 *.example.com 写法（等价 example.com）
   非法输入（空、无点、含异常字符）返回 '' */
ESB_SHARED.normalizeSite = function (input) {
  var s = String(input == null ? '' : input).trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');    // https://
  s = s.replace(/^\/\//, '');                      // //
  s = s.split('/')[0].split('?')[0].split('#')[0]; // 路径 / 查询 / 锚点
  s = s.split('@').pop();                          // user:pass@
  s = s.replace(/:\d+$/, '');                      // :8080
  s = s.replace(/^\*\./, '');                      // *.example.com
  s = s.replace(/^www\./, '');                     // www.
  s = s.replace(/\.$/, '');                        // 结尾点
  if (!s) return '';
  if (s === 'localhost') return s;
  if (s.indexOf('.') < 0) return '';               // 至少含一个点（防误入 "com" 这类顶级域全灭）
  if (s.indexOf('..') >= 0) return '';             // 连续点 = 非法域名
  if (/[^a-z0-9._\u4e00-\u9fa5-]/.test(s)) return '';
  return s;
};

/* 当前主机名是否被排除列表命中（域名级：条目 example.com 命中 example.com 及其所有子域名） */
ESB_SHARED.isSiteExcluded = function (host, list) {
  var h = String(host == null ? '' : host).trim().toLowerCase();
  if (!h || !list || !list.length) return false;
  h = h.replace(/^www\./, '');
  for (var i = 0; i < list.length; i++) {
    var e = ESB_SHARED.normalizeSite(list[i]);
    if (!e) continue;
    if (h === e || h.slice(-(e.length + 1)) === '.' + e) return true;
  }
  return false;
};

/* ---------- 多语言（chrome.i18n）：界面文案在 _locales/，样式名在此 ---------- */

/* 样式分组/样式的英文名（界面语言非中文时使用） */
ESB_SHARED.GROUP_EN = { solid: 'Solid', grad: 'Gradient', glass: 'Glass', breath: 'Breath', flow: 'Flow', metal: 'Metal' };
ESB_SHARED.NAMES_EN = {
  ink: 'Classic Gray', charcoal: 'Charcoal', blue: 'Misty Blue', green: 'Lake Green', purple: 'Taro Purple', ikb: 'Klein Blue',
  dusk: 'Dusk', sunset: 'Sunset Haze', ocean: 'Deep Sea', aurora: 'Aurora', peach: 'Peach', dawn: 'Dawn',
  glass: 'Glass', liquidGlass: 'Liquid Glass', spaceGlass: 'Space Glass', pearl: 'Pearl', iceGlass: 'Ice Crystal', obsidian: 'Obsidian',
  neonPink: 'Neon Pink', neonGreen: 'Neon Green', neonCyan: 'Neon Cyan', neonViolet: 'Neon Violet', neonBlue: 'Neon Blue', neonGold: 'Neon Gold',
  cyber: 'Cyber', holo: 'Holographic', polarLight: 'Aurora Flow', lava: 'Lava', emerald: 'Emerald', nebula: 'Nebula',
  chrome: 'Chrome', goldRim: 'Gilded', roseGold: 'Rose Gold', titanium: 'Titanium', bronze: 'Bronze', champagne: 'Champagne'
};

ESB_SHARED.uiLang = function () {
  try { return String(chrome.i18n.getUILanguage() || '').toLowerCase(); } catch (err) { return ''; }
};
ESB_SHARED.isZh = function () { return ESB_SHARED.uiLang().indexOf('zh') === 0; };
ESB_SHARED.t = function (key, fallback, subs) {
  try {
    var m = chrome.i18n.getMessage(key, subs || undefined);
    if (m) return m;
  } catch (err) { /* 忽略 */ }
  return fallback != null ? fallback : key;
};
ESB_SHARED.styleName = function (id, s) {
  if (!ESB_SHARED.isZh() && ESB_SHARED.NAMES_EN[id]) return ESB_SHARED.NAMES_EN[id];
  return (s && s.name) || id;
};
ESB_SHARED.groupName = function (g) {
  if (!ESB_SHARED.isZh() && ESB_SHARED.GROUP_EN[g.id]) return ESB_SHARED.GROUP_EN[g.id];
  return g.name;
};

/* 把页面里 [data-i18n]/[data-i18n-html]/[data-i18n-placeholder]/[data-i18n-title]/[data-i18n-aria] 的文案换成当前语言 */
ESB_SHARED.localize = function (root) {
  var r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = ESB_SHARED.t(el.getAttribute('data-i18n'), el.textContent);
  });
  r.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    el.innerHTML = ESB_SHARED.t(el.getAttribute('data-i18n-html'), el.innerHTML);
  });
  r.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    el.setAttribute('placeholder', ESB_SHARED.t(el.getAttribute('data-i18n-placeholder'), el.getAttribute('placeholder')));
  });
  r.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    el.setAttribute('title', ESB_SHARED.t(el.getAttribute('data-i18n-title'), el.getAttribute('title')));
  });
  r.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    el.setAttribute('aria-label', ESB_SHARED.t(el.getAttribute('data-i18n-aria'), el.getAttribute('aria-label')));
  });
};

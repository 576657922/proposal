# Blueprint 设计规格书 — 「工程图纸 × 印鑑」全站重设计

> 项目:ka1o 个人作品集/提案站(EN/JA 双语,自由职业接单)
> 方向:B「工程图纸」+ 浅色纸底 + 双语排版主角化 + 原生 CSS 能力宣言
> 状态:已定稿,可直接施工
> 配套决策:邮箱 `chenfangfang6b6@gmail.com` 确认无误,保持不变

---

## 一、设计概念

### 1.1 定位陈述

**「可靠不是说出来的,是画出来的。」**

这个网站本身是一张正在被审阅的工程图纸:纸白的底、墨黑的线、灰色的标注、以及盖在右下角的一枚朱印。客户打开它,看到的不是又一个暗色炫技站,而是一份**已经画好尺寸、标好修订记录、等待盖章发行的图面**——这正是 ka1o 卖的东西:交付之后还能被下一个人看懂、接手、维护的工程。

三条支撑线:

1. **图纸隐喻 = 人设翻译。** "5 年经验 / 企业级 / 引き継ぎしやすい" 这些抽象承诺,全部翻译成制图语言的视觉事实:图框、表题栏、修订履历表、尺寸标注。
2. **双语排版 = 设计主角。** 日英切换不是功能开关,而是一次有仪式感的"图面差し替え"(换图)。日文版有自己完整的排版规则(`:lang(ja)`),不是英文版的字符串替换。
3. **原生 CSS = 能力宣言。** 全站动效只用 View Transitions API、Scroll-Driven Animations、CSS transition,运行时 JS 依赖归零(删除 GSAP / Lenis / SplitType / three.js)。源码本身是作品。

### 1.2 制图语言贯穿点(7 处)

| # | 制图元素 | 日文术语 | 全站应用 |
|---|---------|---------|---------|
| 1 | **图框 + 表题栏** | 図枠・表題欄 | 视口四周 1px 墨线图框(fixed,带角部裁切标记);Hero 右下角放一个真正的表题栏:姓名 / 図番 KA1O-2026-001 / 縮尺 1:1 / 日付 / 一枚 12mm 朱印 |
| 2 | **十字光标 + 坐标读数** | 十字カーソル | 保留现有十字光标(全站唯一保留的 JS 视觉装置),旁挂等宽数字实时坐标 `X:0742 Y:0391`,数字为标注灰,hover 可交互元素时读数变朱色 |
| 3 | **尺寸线 / 引出线** | 寸法線・引出線 | section 标题编号用引出线样式 `SHT 02 ──○ WORK`;关键留白处放装饰性尺寸标注(如 Hero 标题左侧 `↕ 96`);项目条目 hover 时浮现引出线指向年份 |
| 4 | **朱印(印鑑)** | 印鑑 | 12mm 见方的「佳」字篆体风 SVG 印章 = 品牌 logo。出现位置:表题栏、Contact 区(滚动到位时"盖下"一次)、Footer 修订表的"承認"栏。全站唯一的面积型朱色 |
| 5 | **修订履历表** | 改訂履歴表 | Footer 重做为一张真实的修订记录表:`Rev. | 日付 | 内容 | 承認` 四列,行内容就是职业履历(2021 入行 → 2026 当前),最后一行 `Rev.E 2026 — Open for projects [印]` |
| 6 | **中心线(点划线)** | 中心線 | 所有 section 分隔线用 CSS 点划线(`1px dash-dot`)替代现有渐变 divider;Process 时间轴的主轴也是点划线 |
| 7 | **剖面线(45° 细线)** | ハッチング | hover 态的填充语言:项目条目、Skills 卡、CTA 按钮 hover 时背景浮现 45° 细线 hatching(`repeating-linear-gradient`),替代一切发光/阴影 hover |

**禁用清单(继承上轮评审,全部生效):** wall tunnel 及 `/leonardo/` 素材、accent 彩虹渐变、orbs、grain、text scramble、段落逐词 reveal、h2 字符 scrub、滚动 skew、marquee、"Go Wild" 文案、card-stack.js / cursor-ripple.js 死代码、2.2s preloader、blur reveal、磁吸按钮、双层 bracket 光标(只留十字)、3D 卡牌 tilt/shine/翻面。

---

## 二、设计 Token

```css
:root {
    /* ===== 色彩 — 墨 × 朱 · 纸白底 ===== */
    --paper:        #F2EFE8;  /* 纸白底 */
    --paper-raised: #EDE9E0;  /* 表格行交替 / 卡片底(比纸深一档) */
    --ink:          #141414;  /* 墨黑 — 正文、标题、主线条 */
    --ink-soft:     #3A3A3A;  /* 次级文字 */
    --note:         #6B6B6B;  /* 标注灰 — 寸法数字、标签、辅助说明 */
    --line:         #C9C4B8;  /* 细线 — 表格线、图框内分隔(纸上铅笔灰) */
    --line-strong:  #141414;  /* 图框主线、表题栏外框 */
    --vermilion:    #D93A2B;  /* 朱 — 用量 <5%,仅限:链接下划线、hover、
                                 坐标读数激活态、东京 marker、CTA、朱印 */
    --vermilion-ink:#B22E21;  /* 朱的按压/visited 态 */

    /* 对比度红线(施工时遵守):
       - #D93A2B on #F2EFE8 ≈ 4.0:1 → 朱色"文字"仅允许 ≥18px 或 ≥14px bold,
         小号文字一律墨色字 + 朱色下划线/标记
       - #6B6B6B on #F2EFE8 ≈ 4.6:1 → 标注灰文字最小 12px,不再出现 10px */

    /* ===== 字体 ===== */
    --font-sans: 'IBM Plex Sans', 'IBM Plex Sans JP', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
    /* :lang(ja) 时 --font-sans 由规则覆盖,见第三章 */

    /* ===== Type Scale(桌面,详表见 3.4)===== */
    --text-xs:   0.75rem;   /* 12 — 寸法数字、表格、坐标 */
    --text-sm:   0.8125rem; /* 13 — 标注、nav */
    --text-base: 1rem;      /* 16 — 正文 */
    --text-md:   1.25rem;   /* 20 — 强调正文、项目副题 */
    --text-lg:   1.75rem;   /* 28 — 小节标题、项目名 */
    --text-xl:   2.5rem;    /* 40 — section 标题 */
    --text-2xl:  clamp(2.75rem, 6.5vw, 4.5rem);  /* 44–72 — Hero/Contact */

    /* ===== 间距(8px 基准)===== */
    --space-1: 8px;
    --space-2: 16px;
    --space-3: 24px;
    --space-4: 40px;
    --space-5: 64px;
    --space-6: 96px;
    --space-7: 160px;   /* section 纵向间距(桌面) */
    --frame-inset: clamp(12px, 2vw, 24px);  /* 视口图框内缩 */

    /* ===== 线宽(制图三级线宽)===== */
    --stroke-bold: 2px;    /* 外形线 — 图框主线、表题栏外框 */
    --stroke-med:  1px;    /* 可见轮廓 — 表格、卡片边框 */
    --stroke-thin: 0.5px;  /* 标注线 — 尺寸线、hatching(高分屏);
                              低分屏回退 1px + opacity .5 */

    /* ===== 圆角 ===== */
    --radius: 0;   /* 全站 0。工程图纸没有圆角。
                      例外:朱印 SVG 自身的篆刻圆角属于图形,不受此限 */

    /* ===== 动效 ===== */
    --ease-draw:  cubic-bezier(0.65, 0, 0.35, 1);  /* 线条描绘 */
    --ease-out:   cubic-bezier(0.19, 1, 0.22, 1);  /* 位移入场 */
    --ease-stamp: cubic-bezier(0.34, 1.3, 0.64, 1);/* 盖章(轻微过冲) */
    --t-fast:   0.15s;  /* hover */
    --t-normal: 0.3s;   /* 状态切换 */
    --t-draw:   0.8s;   /* 入场描线 */
    --t-stamp:  0.35s;  /* 盖章 */

    /* ===== 制图纹理 ===== */
    --hatch: repeating-linear-gradient(
        -45deg,
        transparent 0 5px,
        color-mix(in srgb, var(--ink) 8%, transparent) 5px 6px
    );
    --dash-dot: /* 中心线:长划-点-长划,用 border-image 或 SVG 实现 */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='1'%3E%3Cpath d='M0 .5h14m4 0h2' stroke='%23C9C4B8'/%3E%3C/svg%3E");
}

::selection { background: var(--vermilion); color: var(--paper); }
```

**Token 纪律:** 施工后全站 `grep` 不允许出现 token 之外的色值、字号、时长字面量(SVG 内部除外)。上一版 2183 行 CSS 里散落的 `rgba(232,255,71,*)` 式硬编码是事故源头。

---

## 三、排版系统

### 3.1 英文字体:放弃 Space Grotesk,改用 IBM Plex 家族

**明确推荐:`IBM Plex Sans`(标题+正文)+ `IBM Plex Mono`(标注/数据/坐标)。**

理由:
1. **气质对位。** Space Grotesk 是"创意工作室味"的展示字体,曲线讨巧,与制图的克制工整相悖。IBM Plex 出身就是工程公司字体系统(IBM 设计语言),骨架平直、终端利落,本身带"规格书感"。
2. **三文字系统同源。** Plex 是市面上唯一同时拥有高质量 **Sans / Mono / Sans JP** 的开源超家族。英文标题、等宽标注、日文正文出自同一套骨架,双语切换时灰度和字面节奏不跳——这正是"双语排版当主角"的物质基础。
3. **Mono 是这套设计的主力。** 坐标读数、寸法数字、表题栏、修订表、tag、図番——制图语言的一半内容是等宽的。Plex Mono 的数字是真等宽 + 高辨识,且自带 `tabular-nums`。

加载字重(严格限制,全部真实存在):

| 字体 | 字重 | 用途 |
|------|------|------|
| IBM Plex Sans | 400 / 500 / 600 | 正文 / 强调 / 标题 |
| IBM Plex Mono | 400 / 500 | 标注、数据 / 表题栏 |
| IBM Plex Sans JP | 400 / 500 / 700 | 日文正文 / 强调 / 标题 |

**加载方式:`@fontsource` 自托管(Vite 直接 import),不再走 Google Fonts CDN。** woff2 按需子集;JP 字体用 `unicode-range` 切片(fontsource 已切好),首屏只拉用到的片。`font-display: swap` + 系统兜底栈 `'Helvetica Neue', 'Hiragino Sans', sans-serif`。**禁止再出现"声明了未加载字重"**(上一版 Space Grotesk 200 事故)。

### 3.2 日文字体:IBM Plex Sans JP

三个候选的裁决:

| 候选 | 裁决 | 理由 |
|------|------|------|
| **IBM Plex Sans JP** | ✅ 采用 | 与英文 Plex 同骨架同灰度,拉丁字符直接复用 Plex Sans 字形,日英混排零违和;工程气质一致 |
| Noto Sans JP | ❌ | 质量没问题,但"到处都是"且偏圆润中性,与 Plex 拉丁混排时灰度偏淡、骨架不合 |
| Zen Kaku Gothic New | ❌ | 气质偏"现代日式人文",适合品牌站,不适合图纸;与 Mono 并置时风格断裂 |

### 3.3 `:lang(ja)` 完整规则

`i18n.js` 已在切换时设置 `documentElement.lang`,以下规则挂在它上面(这是上一版完全缺失的层):

```css
/* ===== 日文排版规则 ===== */
:lang(ja) {
    --font-sans: 'IBM Plex Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    letter-spacing: 0;                    /* 全局清零,禁止继承英文负字距 */
    font-feature-settings: 'palt' 1;      /* 比例假名字距(约物收紧) */
    line-break: strict;                   /* 严格禁则处理 */
    word-break: auto-phrase;              /* Chrome 119+ 文节断行,渐进增强 */
    overflow-wrap: anywhere;
}

/* 标题:日文不需要负字距,行高比英文高一档 */
:lang(ja) h1, :lang(ja) h2, :lang(ja) h3,
:lang(ja) .display {
    letter-spacing: 0.02em;
    line-height: 1.35;        /* 英文标题 1.1 → 日文 1.35 */
    font-weight: 700;         /* 日文同字号视觉偏轻,标题上调一档 */
    text-wrap: balance;
}

/* 正文:行长更短、行距更松 */
:lang(ja) p, :lang(ja) li, :lang(ja) td {
    line-height: 1.9;         /* 英文正文 1.6 → 日文 1.9 */
    max-width: 38em;          /* 日文每行 ≤38 全角字 */
}

/* em:禁用斜体(日文无斜体传统),改为「朱点强调」 */
:lang(ja) em {
    font-style: normal;
    font-weight: 700;
    text-emphasis: dot var(--vermilion);   /* 傍点 — 字符上方朱色圆点 */
    -webkit-text-emphasis: dot var(--vermilion);
}

/* 数字/拉丁混排:统一走 Mono,保持表格对齐 */
:lang(ja) .num, :lang(ja) time, :lang(ja) .dim-label {
    font-family: var(--font-mono);
    font-feature-settings: 'palt' 0, 'tnum' 1;
}

/* 标点悬挂(支持的浏览器) */
:lang(ja) p { hanging-punctuation: allow-end; }
```

**日文文案商务化规则(ux-critic 结论):** 全部敬体(です・ます)统一;补「対応時間:平日・週末問わず、週30〜40時間」「まずは小さなタスクからお試しいただけます」;删除「働きましょう！」的感叹号风格,改为「まずは小さなご依頼から、お気軽にご相談ください。」。

### 3.4 Type Scale 表

| 档位 | 桌面 ≥1024 | 移动 ≤599 | 字体/字重 | 行高 EN / JA | 用途 |
|------|-----------|-----------|----------|--------------|------|
| display | clamp(44→72px) | clamp(34→44px) | Sans 600 / JP 700 | 1.05 / 1.3 | Hero 主标题、Contact 标题 |
| h2 | 40px | 28px | Sans 600 / JP 700 | 1.1 / 1.35 | section 标题 |
| h3 | 28px | 22px | Sans 500 / JP 500 | 1.2 / 1.4 | 项目名、卡片标题 |
| md | 20px | 18px | Sans 400 | 1.5 / 1.8 | Hero 副题、导语 |
| base | 16px | 16px | Sans 400 | 1.6 / 1.9 | 正文 |
| sm | 13px | 13px | Mono 400 | 1.4 | nav、标注、tag、表格 |
| xs | 12px | 12px | Mono 400 | 1.3 | 寸法数字、坐标、図番 |

纪律:**全站只允许这 7 档**;10px / 11px 永久退役;Mono 一律 `font-variant-numeric: tabular-nums`。

---

## 四、逐 Section 重设计

全站结构(信息优先级重排,Work 前置):

```
図枠(fixed 视口图框)
├── Nav(图框上边沿)
├── 01 Hero ──────── 100vh 内完成自我介绍 + 主CTA + 表题栏
├── 02 Work ──────── 项目表(角色/结果一句话)
├── 03 About ─────── 三行事实 + 数据标注
├── 04 Process ───── 中心线时间轴 3 步
├── 05 Skills ────── 部品表(BOM 风格表格)
├── 06 Contact ───── 朱印盖章 + mailto/复制双动作
└── Footer ───────── 改訂履歴表
```

### 4.0 全局:図枠(视口图框)

```
┌─┬───────────────────────────────────────────┬─┐
│ ka1o ④      ABOUT WORK PROCESS CONTACT  EN|JA │  ← Nav 融入图框上沿
├─┼───────────────────────────────────────────┼─┤
│                                               │
│   (内容区,所有 section 在图框内滚动)            │
│                                               │
│ +                                           + │  ← 角部裁切十字标记
├─┴───────────────────────────────────────────┴─┤
│ KA1O-2026-001  ·  SHT 02/06  ·  SCALE 1:1     │  ← 图框下沿:図番 + 当前页码
└───────────────────────────────────────────────┘
```

- 实现:`body::before` fixed 边框(`--stroke-med`,inset `--frame-inset`)+ 四角 12px 十字裁切标记(SVG background)。内容滚动,图框不动——"纸不动,图在卷"。
- 图框下沿的 `SHT 02/06` 随滚动所在 section 更新(IntersectionObserver 改一个 `data-sheet` 属性,CSS 显示;这是保留的极少量 JS 之一)。
- 顶部滚动进度:图框上沿内侧一条 2px 朱线,`animation-timeline: scroll(root)`,纯 CSS(动效预算 #3)。

### 4.1 Nav

- 布局:嵌在图框上沿,左 logo「ka1o」(Mono 500,13px),右侧锚点链接(Mono 13px 大写)+ `EN|JA` 切换。
- 制图语言:链接之间用 `·` 分隔;当前 section 的链接前缀一个朱色 `●`(对应图框下沿页码)。
- 语言切换是一个真实的 `<button>`,切换走 View Transitions API(见动效 #4)。
- hover:文字不变色,**下方浮现 1px 朱色下划线**(`transition: width var(--t-fast)`)。
- 移动端:锚点收进右上 `INDEX +` 折叠(原生 `<details>` 或 popover,不写 JS 抽屉),`EN|JA` 始终可见。

### 4.2 Hero(100vh 内完成任务)

```
┌───────────────────────────────────────────────┐
│                                               │
│  WEB DEVELOPER — TOKYO, JP          ┌╌╌╌╌╌┐   │
│  ↕96                                ╎ 🌐  ╎   │ ← 线框地球图例
│  Reliable code,                     ╎ ●Tokyo  │   (60×60,虚线框
│  drawn to spec.                     └╌╌╌╌╌┘   │    标注 FIG.1)
│  ────────────────────                         │
│  5 years. Next.js / TypeScript / Spring Boot. │
│  Web apps, MVPs, landing pages — built so     │
│  the next developer can pick them up.         │
│                                               │
│  [ Start a project ↗ ]   [ View work ↓ ]      │
│                                               │
│              ┌───────────┬───────┬─────┬────┐ │
│              │ ka1o      │ 図番   │縮尺  │ 印 │ │ ← 表题栏
│              │ Web Dev   │KA1O-  │ 1:1 │[佳]│ │
│              │ Tokyo, JP │2026-01│     │    │ │
│              └───────────┴───────┴─────┴────┘ │
└───────────────────────────────────────────────┘
```

- **是谁/做什么/CTA 全部在首屏:** 标签行(Mono 12px:`WEB DEVELOPER — TOKYO, JP`)→ display 标题两行 → 一段 20px 导语(技术栈 + "为下一个开发者而写")→ 双 CTA(主:`Start a project` 朱边框按钮 mailto 锚到 Contact;副:`View work` 墨色文字链)。
- **滚动税归零:** Hero 不再 sticky,不再 200vh。正常文档流 100vh,滚一下就是 Work。
- 制图语言:标题左侧装饰性尺寸标注 `↕96`(标注灰 Mono);标题下一条 `--stroke-bold` 墨线像图纸上的基准线;右下表题栏(`--stroke-bold` 外框 + `--stroke-med` 内格,Mono 12px,内嵌 20px 朱印 SVG)。
- 入场动效(动效 #1):图框、基准线、表题栏边框以 `stroke-dashoffset` 描线 0.8s;文字 0.3s 后 fade+8px 上移。**无 preloader**——字体 swap + 描线动画本身就是加载体验。

**Three.js 地球的裁决:删除 three.js,降级为 SVG 线框地球图例。明确推荐后者,理由:**

1. **重量:** three.js + 纹理 + composer ≈ 500KB+ 与"零依赖原生 CSS 宣言"直接冲突;SVG 方案 <15KB。
2. **气质:** 暗色发光粒子地球在纸白底上是异物;**线框正射投影地图本来就是制图语言的一部分**——地球被画成「FIG.1」插图,虚线框 + 图名标注 + 东京一枚朱色圆点 + 引出线 `TOKYO 35.68°N`,隐喻严丝合缝。
3. **叙事保留:** "From Tokyo to the world" 的概念资产没有丢,只是从"电影开场"降为"图纸图例"——而图例恰恰是图纸上最被仔细看的东西。
- 实现:预生成的世界地图 wireframe SVG(正射投影,经纬网格 `--line` 色,海岸线 `--ink` 0.5px),CSS `rotate` 60s 匀速整体自转可选(动效 #8,`prefers-reduced-motion` 时静止)。东京点 4px 朱色实心圆 + 1 圈 CSS 呼吸 ring(可并入 #8 预算)。

### 4.3 Work(前置,信息增强)

```
│ SHT 02 ──○ WORK / 実績                        │
│ ┌─────────────────────────────────────────┐   │
│ │ 01  Kyn & Folk E-commerce        2026 ─┐│   │
│ │     Next.js storefront, design → ship  ││← hover:行背景 hatching
│ │     Role: solo developer                ││   + 缩略图右侧浮现
│ │ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤│
│ │ 02  BOTANIST Landing Page        2025   │
│ │     LP build for major haircare brand   │
│ │     Role: frontend implementation       │
│ │ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤│
│ │ 03  Brother SDGs Story           2024   │
│ │ 04  Haconese Product Site        2023   │
│ └─────────────────────────────────────────┘   │
```

- 每个项目固定三行:**项目名(h3)/ 一句"做了什么+结果" / `Role:` 标注(Mono 13px 标注灰)**。BOTANIST、Brother 是真实大品牌,这两条的"一句话"必须点名品牌背书(EN: "LP build for BOTANIST, one of Japan's largest haircare brands")。
- 编号 `01–04` 用 Mono 朱色;年份右对齐 Mono;行分隔用中心线点划线。
- hover(pointer:fine):行背景浮现 `--hatch` 剖面线 + 右侧 240px 缩略图淡入(静态 `<img>`,CSS opacity,不再 JS 跟随鼠标);编号旁伸出一条引出线指向缩略图。触屏:无 hover,缩略图常驻行尾 80px 缩略格。
- EN/JA 两套项目列表保留现有 data-lang 结构,切换由 View Transitions 接管。

### 4.4 About

```
│ SHT 03 ──○ ABOUT / 概要                       │
│                                               │
│  I build things that work —                   │
│  then make sure they keep working.            │
│                                               │
│  ┌──────────────┬──────────────┬───────────┐  │
│  │ EXPERIENCE   │ BASE         │ STACK     │  │
│  │ 5+ yrs       │ Tokyo, JP    │ Full-stack│  │
│  │ since 2021   │ async-first  │ React+Java│  │
│  └──────────────┴──────────────┴───────────┘  │
```

- 砍掉:四个圆形 stat(凑数指标 "Languages Shipped 2" / "24/7" 永久删除)、trait 图标卡、计数动画。
- 保留 pull-quote 一句(display 档,墨色,**左侧 3px 朱色竖线保留**——它恰好像批注线)。
- 数据改为一张三列规格表(`--stroke-med` 表格线,表头 Mono 12px 标注灰),内容只留可验证的事实。表格就是这个 section 的全部装饰。

### 4.5 Process(中心线时间轴)

```
│ SHT 04 ──○ PROCESS / 進め方                   │
│                                               │
│  ─·─·─●─·─·─·─·─·─●─·─·─·─·─·─●─·─·─→        │
│       │           │           │               │
│   01 Discovery  02 Build   03 Ship & Maintain │
│   コード理解から  小タスクで   引き継げる状態で  │
│   要件確認      実証→高速化   納品+保守        │
```

- 横向时间轴(桌面),主轴 = 点划中心线,节点 = 朱色圆点 + 引出线下挂说明。移动端转纵向(复用现有纵轴思路,但线型换点划线)。
- 文案保留现有三步(它们写得好),JA 版敬体化。
- 动效:进入视口时三个节点依次 fade-in(scroll-driven `view()`,动效 #2 统一变体),**不做滚动进度填充**——上一版四个进度隐喻砍剩图框顶部一个。

### 4.6 Skills(部品表 / BOM)

```
│ SHT 05 ──○ SKILLS / 部品表                    │
│  ┌────┬───────────┬──────────────────┬─────┐  │
│  │ NO │ 区分       │ 仕様              │ 年数 │  │
│  ├────┼───────────┼──────────────────┼─────┤  │
│  │ 01 │ Frontend  │ Next.js/React/TS │  5  │  │
│  │ 02 │ Backend   │ Supabase/PG/Node │  4  │  │
│  │ 03 │ Enterprise│ Java/Spring Boot │  3  │  │
│  │ 04 │ Practice  │ Refactor/Handoff │  —  │  │
│  └────┴───────────┴──────────────────┴─────┘  │
```

- **塔罗牌卡组整体退役**(翻面/tilt/shine/扇形展开/卡背图案全部删除)。技能本质是清单,就用图纸上清单的样子:部品表(BOM)。
- 表格:`--stroke-med` 线,表头 `--paper-raised` 底 + Mono 12px,行 hover 浮现 hatching。每行点击展开一行说明(原生 `<details>` 行内展开,无 JS)。
- 这是全站"最敢平淡"的 section——在堆满动效的同行站中间,一张安静的表格反而是品味宣言。

### 4.7 Contact(朱印 + 双动作 + 降风险话术)

```
│ SHT 06 ──○ CONTACT / お問い合わせ              │
│                                               │
│  Have a project in mind?                      │
│  まずは小さなご依頼から。              ┌────┐  │
│                                       │ 佳 │  │ ← 朱印:滚动到位
│  → chenfangfang6b6@gmail.com [COPY]   └────┘  │    时盖下(一次)
│  → Twitter / GitHub                           │
│                                               │
│  ┄ 対応時間:週30〜40時間(平日・週末可)        │
│  ┄ Start small: happy to begin with a         │
│    single task to prove the fit.              │
```

- 标题 display 档一行(EN: "Have a project in mind?" / JA: 「まずは小さなご依頼から。」)。hover-letters 逐字效果删除。
- **联系双动作:** 邮箱行是 `<a href="mailto:chenfangfang6b6@gmail.com">`(主动作,真实链接),右侧并列独立 `[COPY]` 按钮(Mono 12px 边框小钮,点击复制 + 按钮文字变 `COPIED ✓` 1.5s,保留现有 clipboard 逻辑)。
- **降风险话术上页面(ux-critic 强制项):** `contact.desc` 的两条信息(週30〜40時間 / 小さなタスクからOK)以"图纸注记"样式呈现——行首 `※`(JA)或 `NOTE:`(EN),Mono 13px 标注灰,放在联系方式下方。这是全站最重要的转化文案,不许再埋在 i18n 字典里。
- **朱印动效(动效 #5):** 36px 朱印初始 `opacity:0; scale:1.15; rotate:-4deg`,section 进入视口 60% 时加 class,`var(--ease-stamp)` 0.35s 盖下,落定后印面带 2% 噪点蒙版(印泥质感,SVG mask)。一次性,不重复。

### 4.8 Footer(改訂履歴表)

```
├───────────────────────────────────────────────┤
│ 改訂履歴 / REVISION HISTORY                    │
│ ┌────┬────────┬──────────────────────┬──────┐ │
│ │Rev.│ 日付    │ 内容                  │ 承認 │ │
│ ├────┼────────┼──────────────────────┼──────┤ │
│ │ A  │ 2021   │ Career start — TSJ corporate │ │
│ │ B  │ 2023   │ Sun* — enterprise Java       │ │
│ │ C  │ 2024-25│ BOTANIST / Brother LPs       │ │
│ │ D  │ 2026   │ Kyn & Folk e-commerce        │ │
│ │ E  │ 2026   │ Open for new projects │ [佳] │ │
│ └────┴────────┴──────────────────────┴──────┘ │
│ ka1o · © 2026 · KA1O-2026-001 SHT 06/06       │
└───────────────────────────────────────────────┘
```

- 履历伪装成修订表,最后一行的"承認"栏盖一枚 16px 朱印——整张"图纸"以被批准发行收尾,闭环。
- 全 Mono 12-13px,表格线 `--stroke-med`。无动效(进入视口统一 fade 即可)。

---

## 五、动效预算表(全站 8 项封顶)

| # | 动效 | 触发 | 时长 | 技术 | reduced-motion 降级 |
|---|------|------|------|------|---------------------|
| 1 | 图框/基准线/表题栏描线入场 | 页面加载 | 0.8s 一次 | CSS `@keyframes` + `stroke-dashoffset`(SVG line) | 直接显示终态 |
| 2 | Section 内容 reveal(全站唯一变体:opacity 0→1 + translateY 12px) | 进入视口 | 0.5s | CSS `animation-timeline: view()`;`@supports` 不支持时直接可见(内容默认不隐藏) | 删除 translate,仅 0.2s fade 或直接显示 |
| 3 | 图框顶部朱色滚动进度线 | 滚动 | 跟随 | CSS `animation-timeline: scroll(root)` | 保留(非运动型,仅宽度) |
| 4 | EN/JA 语言切换 | 点击切换 | 0.4s | **View Transitions API**(`document.startViewTransition`),旧文字上移淡出/新文字下入,图框不动;不支持的浏览器瞬时切换 | 瞬时切换 |
| 5 | 朱印盖章(Contact) | 进入视口 60%,一次 | 0.35s | IntersectionObserver 加 class + CSS transition | 直接显示印章 |
| 6 | 十字光标 + 坐标读数 | pointermove | 实时 | JS rAF(唯一常驻 rAF;`pointer:fine` 限定) | 隐藏自定义光标,恢复系统光标 |
| 7 | Hover 微交互(朱下划线 / hatching 浮现 / COPY 反馈) | hover/click | 0.15s | 纯 CSS transition | 保留(瞬时也可接受) |
| 8 | 线框地球自转 + 东京点呼吸 | 常驻 | 60s 循环 | CSS `rotate` animation | 暂停(`animation: none`),静态图例 |

**硬性规定:**
- 运行时依赖归零:`package.json` 移除 three / gsap / lenis / split-type。剩余 JS ≈ 光标(6)、i18n + View Transition 包装(4)、IO 两处(5、図枠页码)、clipboard——目标 **< 8KB min+gzip 自有 JS,0 个 runtime 依赖**。
- Lenis 删除后用原生滚动 + `html { scroll-behavior: smooth }`(`prefers-reduced-motion: no-preference` 限定)。
- 全站统一一个 reveal 变体;任何新动效申请必须先从此表删一项。

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

---

## 六、响应式策略

| | 桌面 ≥1024px | 平板 600–1023px | 手机 ≤599px |
|---|---|---|---|
| 図枠 | 完整四边 + 角部裁切标记 + 下沿図番/页码 | 完整四边,下沿只留页码 | **只留上下两条边**(左右贴边省宽度),`--frame-inset: 10px` |
| Nav | 图框上沿全锚点 + EN\|JA | 同桌面(13px 已够) | logo + `INDEX +`(details/popover)+ EN\|JA |
| Hero | 左文右图例 + 右下表题栏 | 图例缩至 48px 并入标签行;表题栏横置底部 | 单栏;表题栏简化为两行 Mono 文字 + 朱印;CTA 全宽 |
| 光标/坐标 | 十字光标 + 坐标读数 | 系统光标(`pointer:fine` 才启用) | 系统光标 |
| Work | 三行条目 + hover 缩略图浮层 | hover 浮层 → 常驻行尾缩略格 | 缩略格 64px;Role 行保留 |
| Process | 横向中心线时间轴 | 横向(可横滚,`scroll-snap`) | 纵向时间轴 |
| Skills 表 | 四列 BOM | 四列(13px) | 「年数」列并入仕様行内,三列 |
| section 间距 | `--space-7: 160px` | 112px | 72px |

**移动端 Contact 直达(ux-critic 强制项):**
滚动越过 Hero 后,视口底部出现固定迷你表题栏条(高 48px + `env(safe-area-inset-bottom)`):

```
└──[ ✉ お問い合わせ / Contact ]────────[佳]──┘
```

- 实现:`position: fixed; bottom: 0`,出现时机用 `animation-timeline: scroll(root)` 在 0–100vh 区间保持 `translateY(100%)`,越过后滑入——纯 CSS,无滚动监听。点击 = 锚到 `#contact`。`#contact` 进入视口时条隐藏(IO 复用 #5 的观察器)。
- 全站 a11y 底线:`:focus-visible { outline: 2px solid var(--vermilion); outline-offset: 2px; }`;跳转链接 `Skip to contact`;所有纯装饰 SVG `aria-hidden`;触控目标 ≥44px。

---

## 七、实施计划(5 Phases)

### Phase 1 — 地基:Token + 字体 + 大删除(预估 1.5 人日)

**改动范围:** `package.json`、`index.html`、`src/styles/main.css`(重写头部)、删除 `src/js/` 大半
- 依赖:卸载 three / gsap / lenis / split-type;安装 `@fontsource/ibm-plex-sans|mono|sans-jp`
- 删除文件:`card-stack.js`、`cursor-ripple.js`、`grain.js`、`scene.js`、`globe.js`、`atmosphere.js`、`marker.js`、`particles.js`、`controls.js`、`config.js`、`text-scramble.js`、`micro-interactions.js`、`scroll-effects.js`;`/leonardo/` 素材目录整体移除
- `index.html`:删 wall section、marquee、orbs、preloader、cardBack symbol、Google Fonts link
- `main.css`:清空重写为 Token 块(第二章)+ 临时最小排版;浅色底上线
- `main.js` 缩为:i18n 初始化 + 光标占位 + clipboard

**验收:** `npm run build` 通过;bundle 自有 JS <8KB gzip、无 runtime 依赖;全站纸白底可读;Lighthouse Performance ≥95;`grep -r "e8ff47\|gsap\|lenis\|three" src/` 零结果。

### Phase 2 — 排版与 i18n(预估 1 人日)

**改动范围:** `main.css`(type scale + `:lang(ja)` 块)、`i18n.js`、`index.html` 文案
- Type scale 7 档落地;`:lang(ja)` 全部规则(3.3)
- i18n:初始语言 = `localStorage.lang ?? (navigator.language.startsWith('ja') ? 'ja' : 'en')`;切换写回 localStorage
- JA 文案敬体统一;`contact.desc` 渲染上页面;Hero/Contact 新文案(EN/JA);Work 每项补"一句话+Role"双语
- Section 重排:Work 移到 About 前

**验收:** JA 模式无斜体日文、无负字距、行高 ≥1.9(正文);`?lang` 记忆刷新生效;contact.desc 两条话术在 Contact 区可见;所有文字 ≥12px。

### Phase 3 — 制图语言组件(预估 2 人日)

**改动范围:** `main.css`、`index.html`、新增 `src/assets/`(朱印 SVG、地球 SVG)、`main.js`(IO 页码)
- 図枠 + 角部标记 + 下沿図番/页码(IO 更新 `data-sheet`)
- 表题栏(Hero)、引出线 section 标题、寸法标注装饰、中心线 divider、hatching hover
- 朱印 SVG(「佳」篆刻风,手工绘制,两个尺寸 36/16px)
- 线框地球 SVG 图例 + 东京朱点
- About 规格表、Skills BOM 表(`<details>` 展开)、Footer 修订履历表
- 十字光标 + 坐标读数(rAF,pointer:fine)

**验收:** 七处制图语言全部在页可指认;表格语义为真实 `<table>`;键盘可完整操作(details/链接/COPY);朱色元素面积目测 <5%。

### Phase 4 — 动效(预估 1 人日)

**改动范围:** `main.css`、`main.js`(View Transition 包装、盖章 IO)
- 描线入场(#1)、view() reveal(#2)、scroll() 进度线(#3)、View Transitions 语言切换(#4)、盖章(#5)、地球自转(#8)
- `@supports (animation-timeline: view())` 渐进增强:不支持的浏览器内容直接可见
- `prefers-reduced-motion` 全表降级落地

**验收:** 动效总数 ≤8 且与预算表一一对应;Safari(无 scroll-timeline)下内容无缺失;reduced-motion 模式逐项核对;语言切换在 Chrome 走 View Transition、其他浏览器瞬切无报错。

### Phase 5 — 响应式与收尾打磨(预估 1.5 人日)

**改动范围:** `main.css`(三档媒体查询)、`index.html`(移动 Contact 条、meta)
- 三档断点布局(第六章);移动端固定 Contact 条 + safe-area;Process 平板横滚 scroll-snap
- a11y 终检:`:focus-visible`、skip link、对比度复测(朱色小字违规清扫)、触控目标
- meta/OG 更新(浅色 `theme-color: #F2EFE8`);字体子集复核;图片 `loading="lazy"` + 尺寸属性
- 真机检查:iOS Safari(safe-area、details)、Android Chrome(auto-phrase)

**验收:** 375/768/1440 三宽度截图走查无破版;移动端任意位置 ≤1 次点击到达 Contact;Lighthouse 四项 ≥95;axe 扫描零 critical;最终 `npm run build` 产物总重(含字体首屏子集)<300KB。

**总预估:7 人日。**

---

## 附录:验收红线(每个 PR 自查)

1. 出现 token 外的色值/字号/时长字面量 → 打回
2. 新增动效未从预算表置换 → 打回
3. 朱色用于 <18px 非粗体文字 → 打回
4. 日文出现 italic / 负字距 / 行高 <1.35 → 打回
5. 新增 runtime npm 依赖 → 打回
6. 内容默认 `opacity: 0` 等待 JS 才可见 → 打回(渐进增强原则)

import { textScramble } from './text-scramble.js';

const translations = {
    en: {
        'nav.about': 'About',
        'nav.work': 'Work',
        'nav.skills': 'Skills',
        'nav.contact': 'Contact',
        'hero.label': 'Web Developer',
        'hero.title': '<span class="line"><span>From <em>Tokyo</em></span></span><br><span class="line"><span>to the <em>world.</em></span></span>',
        'hero.sub': 'I ship web apps, MVPs, and landing pages \u2014 clean code that lasts, not just code that works.',
        'hero.scroll': 'Scroll',
        'about.label': '( 01 \u2014 About )',
        'about.pullquote': 'I build products that ship and last.',
        'about.trait1_title': '5+ Years',
        'about.trait1_desc': 'Hands-on web development experience across startups and enterprise.',
        'about.trait2_title': 'Japan-based',
        'about.trait2_desc': 'Working with global teams across timezones, flexible hours.',
        'about.trait3_title': 'Full-stack',
        'about.trait3_desc': 'From React frontends to Spring Boot backends, end to end.',
        'about.trait4_title': 'Ship & Maintain',
        'about.trait4_desc': 'Clean code that lasts, not just code that passes review.',
        'about.stat1': 'Years Experience',
        'about.stat2': 'Projects Delivered',
        'process.header': 'My Process',
        'process.step1': 'Step 01',
        'process.step2': 'Step 02',
        'process.step3': 'Step 03',
        'process.title1': 'Discovery',
        'process.title2': 'Build & Iterate',
        'process.title3': 'Ship & Maintain',
        'process.desc1': 'Understand the product, the users, and what\u2019s already built. Confirm requirements early to avoid unnecessary back-and-forth.',
        'process.desc2': 'Start with a small task or feature to check fit, then move fast on implementation with regular progress updates.',
        'process.desc3': 'Deliver clean, maintainable code that\u2019s built to last \u2014 not just to pass review. Refactor where it matters.',
        'work.label': '( 02 \u2014 Work )',
        'work.heading': 'Selected projects',
        'work.project1': 'SaaS Admin Dashboard',
        'work.project2': 'Fintech MVP',
        'work.project3': 'E-commerce Landing Page',
        'work.project4': 'Enterprise Workflow System',
        'skills.label': '( 03 \u2014 Skills )',
        'skills.heading': 'What I work with',
        'skills.title1': 'Frontend',
        'skills.title2': 'Backend',
        'skills.title3': 'Enterprise',
        'skills.title4': 'Refactoring',
        'skills.desc1': 'HTML, CSS, JavaScript, TypeScript \u2014 Next.js, React, jQuery. Responsive UIs, landing pages, and interactive web apps with a focus on performance.',
        'skills.desc2': 'Supabase, PostgreSQL, MySQL, Node.js \u2014 authentication, CRUD features, admin dashboards, and API integration.',
        'skills.desc3': 'Java, Spring Boot \u2014 structured systems built for long-term maintenance and reliability, not just quick fixes.',
        'skills.desc4': 'Extending existing codebases, fixing UI and logic issues, and adjusting implementations to match real requirements.',
        'contact.label': '( 04 \u2014 Contact )',
        'contact.heading': 'Let\u2019s build something together.',
        'contact.desc': 'Available 30\u201340 hours per week, flexible on weekdays and weekends. Happy to start with a small task or build a quick demo to check fit before moving forward.',
    },
    ja: {
        'nav.about': '概要',
        'nav.work': '実績',
        'nav.skills': 'スキル',
        'nav.contact': 'お問合せ',
        'hero.label': 'Webエンジニア',
        'hero.title': '<span class="line"><span><em>東京</em>から、</span></span><br><span class="line"><span><em>世界</em>へ。</span></span>',
        'hero.sub': 'Webアプリ・MVP・LPを開発。動くだけでなく、長く使えるコードを。',
        'hero.scroll': 'スクロール',
        'about.label': '( 01 — 概要 )',
        'about.pullquote': '出荷し、長く使われるプロダクトを。',
        'about.trait1_title': '5年以上',
        'about.trait1_desc': 'スタートアップからエンタープライズまで、実務的なWeb開発経験。',
        'about.trait2_title': '日本拠点',
        'about.trait2_desc': '海外チームとの協業経験あり。柔軟な時間対応。',
        'about.trait3_title': 'フルスタック',
        'about.trait3_desc': 'Reactフロントエンドから Spring Bootバックエンドまで一貫対応。',
        'about.trait4_title': '納品・保守',
        'about.trait4_desc': 'レビューを通すだけでなく、長く使えるクリーンなコードを。',
        'about.stat1': '年の経験',
        'about.stat2': 'プロジェクト納品',
        'process.header': 'プロセス',
        'process.step1': 'ステップ 01',
        'process.step2': 'ステップ 02',
        'process.step3': 'ステップ 03',
        'process.title1': 'ヒアリング',
        'process.title2': '開発・改善',
        'process.title3': '納品・保守',
        'process.desc1': 'プロダクト、ユーザー、既存の実装を理解。不要なやり取りを避けるため、要件は早期に確認します。',
        'process.desc2': 'まずは小さなタスクで相性を確認。その後、定期的な進捗共有とともにスピーディに実装を進めます。',
        'process.desc3': 'レビューを通すだけでなく、長く使えるクリーンなコードを納品。必要な箇所をリファクタリング。',
        'work.label': '( 02 — 実績 )',
        'work.heading': '主なプロジェクト',
        'work.project1': 'SaaS管理ダッシュボード',
        'work.project2': 'フィンテックMVP',
        'work.project3': 'ECランディングページ',
        'work.project4': 'エンタープライズワークフロー',
        'skills.label': '( 03 — スキル )',
        'skills.heading': '使用技術',
        'skills.title1': 'フロントエンド',
        'skills.title2': 'バックエンド',
        'skills.title3': 'エンタープライズ',
        'skills.title4': 'リファクタリング',
        'skills.desc1': 'HTML、CSS、JavaScript、TypeScript — Next.js、React、jQuery。レスポンシブUI、ランディングページ、パフォーマンス重視のWebアプリ。',
        'skills.desc2': 'Supabase、PostgreSQL、MySQL、Node.js — 認証、CRUD機能、管理ダッシュボード、API連携。',
        'skills.desc3': 'Java、Spring Boot — 長期的な保守性と信頼性を重視した構造化システム。',
        'skills.desc4': '既存コードベースの拡張、UI・ロジックの修正、実際の要件に合わせた実装調整。',
        'contact.label': '( 04 — お問合せ )',
        'contact.heading': '一緒に何かつくりませんか。',
        'contact.desc': '週30〜40時間稼働可能。平日・休日ともに柔軟に対応いたします。まずは簡単なタスクやデモ作成からお試しいただけます。',
    }
};

let currentLang = 'en';

export function toggleLang() {
    currentLang = currentLang === 'en' ? 'ja' : 'en';
    applyTranslations();
    return currentLang;
}

function applyTranslations() {
    const t = translations[currentLang];

    // Plain text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // HTML elements (hero title with <em> tags)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (t[key]) el.innerHTML = t[key];
    });

    // Scramble text elements — update data-scramble and re-trigger
    document.querySelectorAll('[data-i18n-scramble]').forEach(el => {
        const key = el.getAttribute('data-i18n-scramble');
        if (t[key]) {
            el.setAttribute('data-scramble', t[key]);
            textScramble(el, t[key], 800);
        }
    });

    // Update html lang attribute
    document.documentElement.lang = currentLang === 'ja' ? 'ja' : 'en';
}

export function getCurrentLang() {
    return currentLang;
}

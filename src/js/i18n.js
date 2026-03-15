import { textScramble } from './text-scramble.js';

const translations = {
    en: {
        'nav.about': 'About',
        'nav.work': 'Work',
        'nav.skills': 'Skills',
        'nav.contact': 'Contact',
        'hero.label': 'Web Developer',
        'hero.title': '<span class="line"><span>Based in <em>Japan,</em></span></span><br><span class="line"><span>Connected <em>globally.</em></span></span>',
        'hero.sub': 'With about 5 years of hands-on experience, I build web apps, MVPs, and landing pages for small teams and early-stage products \u2014 with a focus on clarity, performance, and long-term maintainability.',
        'hero.scroll': 'Scroll',
        'about.label': '( 01 \u2014 About )',
        'about.heading': 'I build products that ship and last.',
        'about.col1': 'I\u2019m a web developer with about 5 years of hands-on experience, based in Japan. Most of my work involves improving existing codebases \u2014 adding features, fixing UI or logic issues, and adjusting implementations to better match real requirements, not just the initial spec.',
        'about.col2': 'I\u2019ve worked with both modern web stacks and enterprise systems (Java & Spring Boot), so I think about structure and long-term maintenance \u2014 not just making things work for now. Communication is simple and practical: confirm requirements early, share progress when needed, and avoid unnecessary back-and-forth.',
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
        'hero.title': '<span class="line"><span><em>日本</em>拠点、</span></span><br><span class="line"><span><em>世界</em>とつながる。</span></span>',
        'hero.sub': 'Webエンジニアとして約5年間、Webアプリケーション・MVP・LP制作・業務支援ツールの開発に携わってきました。明快さ・パフォーマンス・長期的な保守性を重視しています。',
        'hero.scroll': 'スクロール',
        'about.label': '( 01 — 概要 )',
        'about.heading': '出荷し、長く使われるプロダクトを。',
        'about.col1': 'カイと申します。Webエンジニアとして約5年間の実務経験があります。新規実装だけでなく、既存コードの修正や機能追加といった作業も多く、仕様を確認しながら無理のない形で調整・実装することを意識しています。',
        'about.col2': 'モダンなWebスタックとエンタープライズシステム（Java・Spring Boot）の両方の経験があり、「とりあえず動く」だけでなく、構造と長期的な保守性を考えて開発します。ご契約前にデモを作成し、事前にご確認いただくことも可能です。',
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

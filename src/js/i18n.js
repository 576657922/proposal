import { textScramble } from './text-scramble.js';

const translations = {
    en: {
        'nav.about': 'About',
        'nav.work': 'Work',
        'nav.skills': 'Skills',
        'nav.contact': 'Contact',
        'hero.label': 'Web Developer',
        'hero.title': '<span class="line"><span>Based in <em>Japan,</em></span></span><br><span class="line"><span>Connected <em>globally.</em></span></span>',
        'hero.sub': 'I build web apps, MVPs, and landing pages for small teams and early-stage products \u2014 with a focus on clarity, performance, and long-term maintainability.',
        'hero.scroll': 'Scroll',
        'about.label': '( 01 \u2014 About )',
        'about.heading': 'I build products that ship and last.',
        'about.col1': 'I\u2019m a web developer based in Yamanashi, Japan \u2014 working with clients and collaborators worldwide. Most of my work involves improving existing codebases: adding features, fixing UI or logic issues, and adjusting implementations to match real requirements.',
        'about.col2': 'I\u2019ve worked with both modern web stacks and enterprise systems, so I think about structure and long-term maintenance \u2014 not just making things work for now. I keep communication simple and practical: confirm requirements early, share progress when needed.',
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
        'skills.desc1': 'Next.js, React, TypeScript \u2014 responsive UIs, landing pages, and interactive web apps with a focus on performance.',
        'skills.desc2': 'Supabase, PostgreSQL, Node.js \u2014 authentication, CRUD features, admin dashboards, and API integration.',
        'skills.desc3': 'Java, Spring Boot \u2014 structured systems built for long-term maintenance and reliability, not just quick fixes.',
        'skills.desc4': 'Extending existing codebases, fixing UI and logic issues, and adjusting implementations to match real requirements.',
        'contact.label': '( 04 \u2014 Contact )',
        'contact.heading': 'Let\u2019s build something together.',
        'contact.desc': 'Available 30\u201340 hours per week. Happy to start with a small task to check fit before moving forward.',
    },
    ja: {
        'nav.about': '\u6982\u8981',
        'nav.work': '\u5B9F\u7E3E',
        'nav.skills': '\u30B9\u30AD\u30EB',
        'nav.contact': '\u304A\u554F\u5408\u305B',
        'hero.label': 'Web\u30C7\u30D9\u30ED\u30C3\u30D1\u30FC',
        'hero.title': '<span class="line"><span><em>\u65E5\u672C</em>\u62E0\u70B9\u3001</span></span><br><span class="line"><span><em>\u4E16\u754C</em>\u3068\u3064\u306A\u304C\u308B\u3002</span></span>',
        'hero.sub': '\u5C0F\u898F\u6A21\u30C1\u30FC\u30E0\u3084\u30A2\u30FC\u30EA\u30FC\u30B9\u30C6\u30FC\u30B8\u306E\u30D7\u30ED\u30C0\u30AF\u30C8\u5411\u3051\u306B\u3001Web\u30A2\u30D7\u30EA\u30FB MVP\u30FB\u30E9\u30F3\u30C7\u30A3\u30F3\u30B0\u30DA\u30FC\u30B8\u3092\u958B\u767A\u3002\u660E\u5FEB\u3055\u30FB\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u30FB\u9577\u671F\u7684\u306A\u4FDD\u5B88\u6027\u3092\u91CD\u8996\u3057\u3066\u3044\u307E\u3059\u3002',
        'hero.scroll': '\u30B9\u30AF\u30ED\u30FC\u30EB',
        'about.label': '( 01 \u2014 \u6982\u8981 )',
        'about.heading': '\u51FA\u8377\u3057\u3001\u9577\u304F\u4F7F\u308F\u308C\u308B\u30D7\u30ED\u30C0\u30AF\u30C8\u3092\u3002',
        'about.col1': '\u5C71\u68A8\u770C\u5728\u4F4F\u306EWeb\u30C7\u30D9\u30ED\u30C3\u30D1\u30FC\u3067\u3059\u3002\u4E16\u754C\u4E2D\u306E\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u3084\u30B3\u30E9\u30DC\u30EC\u30FC\u30BF\u30FC\u3068\u5354\u529B\u3057\u3066\u3044\u307E\u3059\u3002\u65E2\u5B58\u30B3\u30FC\u30C9\u30D9\u30FC\u30B9\u306E\u6539\u5584\u2014\u2014\u6A5F\u80FD\u8FFD\u52A0\u3001UI\u30FB\u30ED\u30B8\u30C3\u30AF\u306E\u4FEE\u6B63\u3001\u5B9F\u969B\u306E\u8981\u4EF6\u306B\u5408\u308F\u305B\u305F\u5B9F\u88C5\u8ABF\u6574\u304C\u4E3B\u306A\u696D\u52D9\u3067\u3059\u3002',
        'about.col2': '\u30E2\u30C0\u30F3\u306AWeb\u30B9\u30BF\u30C3\u30AF\u3068\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30B7\u30B9\u30C6\u30E0\u306E\u4E21\u65B9\u306E\u7D4C\u9A13\u304C\u3042\u308B\u305F\u3081\u3001\u300C\u3068\u308A\u3042\u3048\u305A\u52D5\u304F\u300D\u3060\u3051\u3067\u306A\u304F\u3001\u69CB\u9020\u3068\u9577\u671F\u7684\u306A\u4FDD\u5B88\u6027\u3092\u8003\u3048\u3066\u958B\u767A\u3057\u307E\u3059\u3002\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u306F\u30B7\u30F3\u30D7\u30EB\u304B\u3064\u5B9F\u7528\u7684\u306B\u3002',
        'about.stat1': '\u5E74\u306E\u7D4C\u9A13',
        'about.stat2': '\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u7D0D\u54C1',
        'process.header': '\u30D7\u30ED\u30BB\u30B9',
        'process.step1': '\u30B9\u30C6\u30C3\u30D7 01',
        'process.step2': '\u30B9\u30C6\u30C3\u30D7 02',
        'process.step3': '\u30B9\u30C6\u30C3\u30D7 03',
        'process.title1': '\u30D2\u30A2\u30EA\u30F3\u30B0',
        'process.title2': '\u958B\u767A\u30FB\u6539\u5584',
        'process.title3': '\u7D0D\u54C1\u30FB\u4FDD\u5B88',
        'process.desc1': '\u30D7\u30ED\u30C0\u30AF\u30C8\u3001\u30E6\u30FC\u30B6\u30FC\u3001\u65E2\u5B58\u306E\u5B9F\u88C5\u3092\u7406\u89E3\u3002\u4E0D\u8981\u306A\u3084\u308A\u53D6\u308A\u3092\u907F\u3051\u308B\u305F\u3081\u3001\u8981\u4EF6\u306F\u65E9\u671F\u306B\u78BA\u8A8D\u3057\u307E\u3059\u3002',
        'process.desc2': '\u307E\u305A\u306F\u5C0F\u3055\u306A\u30BF\u30B9\u30AF\u3067\u76F8\u6027\u3092\u78BA\u8A8D\u3002\u305D\u306E\u5F8C\u3001\u5B9A\u671F\u7684\u306A\u9032\u6357\u5171\u6709\u3068\u3068\u3082\u306B\u30B9\u30D4\u30FC\u30C7\u30A3\u306B\u5B9F\u88C5\u3092\u9032\u3081\u307E\u3059\u3002',
        'process.desc3': '\u30EC\u30D3\u30E5\u30FC\u3092\u901A\u3059\u3060\u3051\u3067\u306A\u304F\u3001\u9577\u304F\u4F7F\u3048\u308B\u30AF\u30EA\u30FC\u30F3\u306A\u30B3\u30FC\u30C9\u3092\u7D0D\u54C1\u3002\u5FC5\u8981\u306A\u7B87\u6240\u3092\u30EA\u30D5\u30A1\u30AF\u30BF\u30EA\u30F3\u30B0\u3002',
        'work.label': '( 02 \u2014 \u5B9F\u7E3E )',
        'work.heading': '\u4E3B\u306A\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8',
        'work.project1': 'SaaS\u7BA1\u7406\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9',
        'work.project2': '\u30D5\u30A3\u30F3\u30C6\u30C3\u30AFMVP',
        'work.project3': 'EC\u30E9\u30F3\u30C7\u30A3\u30F3\u30B0\u30DA\u30FC\u30B8',
        'work.project4': '\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC',
        'skills.label': '( 03 \u2014 \u30B9\u30AD\u30EB )',
        'skills.heading': '\u4F7F\u7528\u6280\u8853',
        'skills.title1': '\u30D5\u30ED\u30F3\u30C8\u30A8\u30F3\u30C9',
        'skills.title2': '\u30D0\u30C3\u30AF\u30A8\u30F3\u30C9',
        'skills.title3': '\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA',
        'skills.title4': '\u30EA\u30D5\u30A1\u30AF\u30BF\u30EA\u30F3\u30B0',
        'skills.desc1': 'Next.js\u3001React\u3001TypeScript \u2014 \u30EC\u30B9\u30DD\u30F3\u30B7\u30D6UI\u3001\u30E9\u30F3\u30C7\u30A3\u30F3\u30B0\u30DA\u30FC\u30B8\u3001\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u91CD\u8996\u306EWeb\u30A2\u30D7\u30EA\u3002',
        'skills.desc2': 'Supabase\u3001PostgreSQL\u3001Node.js \u2014 \u8A8D\u8A3C\u3001CRUD\u6A5F\u80FD\u3001\u7BA1\u7406\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3001API\u9023\u643A\u3002',
        'skills.desc3': 'Java\u3001Spring Boot \u2014 \u9577\u671F\u7684\u306A\u4FDD\u5B88\u6027\u3068\u4FE1\u983C\u6027\u3092\u91CD\u8996\u3057\u305F\u69CB\u9020\u5316\u30B7\u30B9\u30C6\u30E0\u3002',
        'skills.desc4': '\u65E2\u5B58\u30B3\u30FC\u30C9\u30D9\u30FC\u30B9\u306E\u62E1\u5F35\u3001UI\u30FB\u30ED\u30B8\u30C3\u30AF\u306E\u4FEE\u6B63\u3001\u5B9F\u969B\u306E\u8981\u4EF6\u306B\u5408\u308F\u305B\u305F\u5B9F\u88C5\u8ABF\u6574\u3002',
        'contact.label': '( 04 \u2014 \u304A\u554F\u5408\u305B )',
        'contact.heading': '\u4E00\u7DD2\u306B\u4F55\u304B\u3064\u304F\u308A\u307E\u305B\u3093\u304B\u3002',
        'contact.desc': '\u9031 30\u301C40 \u6642\u9593\u7A3C\u50CD\u53EF\u80FD\u3002\u307E\u305A\u306F\u5C0F\u3055\u306A\u30BF\u30B9\u30AF\u304B\u3089\u304A\u8A66\u3057\u3044\u305F\u3060\u3051\u307E\u3059\u3002',
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

import { textScramble } from './text-scramble.js';

const translations = {
    en: {
        'nav.about': 'About',
        'nav.work': 'Work',
        'nav.skills': 'Skills',
        'nav.contact': 'Contact',
        'hero.label': 'Web Developer',
        'hero.title': '<span class="line"><span>From <em>Tokyo</em></span></span><br><span class="line"><span>to the <em>world.</em></span></span>',
        'hero.sub': 'Web apps, MVPs, landing pages. Code that ships on time and still works a year later.',
        'hero.scroll': 'Scroll',
        'about.label': '( 01 \u2014 About )',
        'about.pullquote': 'I build things that work. Then I make sure they keep working.',
        'about.trait1_title': '5+ Years',
        'about.trait1_desc': 'Building for startups and enterprise since 2021.',
        'about.trait2_title': 'Japan-based',
        'about.trait2_desc': 'Async-first. Comfortable working across timezones.',
        'about.trait3_title': 'Full-stack',
        'about.trait3_desc': 'React on the frontend, Spring Boot on the backend. I handle both.',
        'about.trait4_title': 'Ship & Maintain',
        'about.trait4_desc': 'I care about what happens after the PR gets merged.',
        'about.stat1': 'Years Experience',
        'about.stat2': 'Projects Delivered',
        'process.header': 'How I work',
        'process.step1': 'Step 01',
        'process.step2': 'Step 02',
        'process.step3': 'Step 03',
        'process.title1': 'Discovery',
        'process.title2': 'Build & Iterate',
        'process.title3': 'Deliver',
        'process.desc1': 'I go through the codebase first, then ask the right questions. Requirements get confirmed upfront so we stay aligned.',
        'process.desc2': 'Usually I start with one small task to prove I can deliver. After that, I move fast and share progress along the way.',
        'process.desc3': 'You get code you can maintain without me. I refactor when it matters and keep things clean as I go.',
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
        'skills.desc1': 'HTML, CSS, JavaScript, TypeScript. Next.js, React, jQuery. I build responsive UIs and landing pages that load fast.',
        'skills.desc2': 'Supabase, PostgreSQL, MySQL, Node.js. Auth, dashboards, APIs. The layer behind every screen.',
        'skills.desc3': 'Java, Spring Boot. Systems built so the next person can pick them up easily.',
        'skills.desc4': 'I pick up existing codebases, improve what needs attention, and adjust things when requirements change.',
        'contact.label': '( 04 \u2014 Contact )',
        'contact.subtitle': 'Is Your Big Idea Ready to Go Wild?',
        'contact.heading': 'Have something in mind?',
        'contact.line1': "Let's work",
        'contact.line2': 'together!',
        'contact.desc': '30\u201340 hours a week, weekdays or weekends. Want to test the waters? I\u2019m happy to start with one small task first.',
    },
    ja: {
        'nav.about': '概要',
        'nav.work': '実績',
        'nav.skills': 'スキル',
        'nav.contact': 'お問合せ',
        'hero.label': 'Webエンジニア',
        'hero.title': '<span class="line"><span><em>東京</em>から、</span></span><br><span class="line"><span><em>世界</em>へ。</span></span>',
        'hero.sub': 'Webアプリ・MVP・LP。納品して終わりじゃなく、1年後もちゃんと動くコードを書きます。',
        'hero.scroll': 'スクロール',
        'about.label': '( 01 — 概要 )',
        'about.pullquote': '動くものを作る。動き続けるようにする。',
        'about.trait1_title': '5年以上',
        'about.trait1_desc': '2021年からスタートアップ・エンタープライズ向けに開発。',
        'about.trait2_title': '日本拠点',
        'about.trait2_desc': '非同期ベース。タイムゾーンをまたいだ仕事に慣れています。',
        'about.trait3_title': 'フルスタック',
        'about.trait3_desc': 'フロントはReact、バックはSpring Boot。両方やります。',
        'about.trait4_title': '納品・保守',
        'about.trait4_desc': 'PRがマージされた後のことまで考えて書きます。',
        'about.stat1': '年の経験',
        'about.stat2': 'プロジェクト納品',
        'process.header': '進め方',
        'process.step1': 'ステップ 01',
        'process.step2': 'ステップ 02',
        'process.step3': 'ステップ 03',
        'process.title1': 'ヒアリング',
        'process.title2': '開発・改善',
        'process.title3': '納品',
        'process.desc1': 'まずコードベースを把握した上で、的確な質問をします。要件は最初にすり合わせ。',
        'process.desc2': '最初は小さなタスクで試してもらうことが多いです。そこから先はスピーディに、進捗を共有しながら進めます。',
        'process.desc3': '引き継ぎしやすいコードを納品します。必要な箇所はリファクタリング。',
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
        'skills.desc1': 'HTML、CSS、JavaScript、TypeScript。Next.js、React、jQuery。速くて崩れないUIを作ります。',
        'skills.desc2': 'Supabase、PostgreSQL、MySQL、Node.js。認証、管理画面、API。フロントを支える裏側。',
        'skills.desc3': 'Java、Spring Boot。次の人が引き継ぎやすい設計を意識しています。',
        'skills.desc4': '既存コードベースを引き継いで、改善点を見つけて対応。要件変更にも柔軟に合わせます。',
        'contact.label': '( 04 — お問合せ )',
        'contact.subtitle': 'あなたのアイデア、一緒に形にしませんか？',
        'contact.heading': '何かお考えでしたら、お気軽に。',
        'contact.line1': '一緒に',
        'contact.line2': '働きましょう！',
        'contact.desc': '週30〜40時間。平日も休日も対応可。まずは小さなタスクから試してもらえれば。',
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

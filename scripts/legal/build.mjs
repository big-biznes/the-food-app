#!/usr/bin/env node
// Writes the Privacy Policy and Terms of Service as web pages (docs/legal), from the same
// texts the app shows (constants/legal/*.json). The app stores ask for a link to them, and
// Google Play also asks for a page that says how to delete an account.
//
//   node scripts/legal/build.mjs      (npm run legal)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const config = read('constants/legal/config.json');
const LANGUAGES = { en: 'English', bg: 'Български', nl: 'Nederlands' };
const out = new URL('docs/legal/', root);
mkdirSync(out, { recursive: true });

const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const file = (doc, lang) => (lang === 'en' ? `${doc}.html` : `${doc}-${lang}.html`);

const DELETE = {
  en: {
    title: 'Delete your account',
    inApp: 'In the app: open Settings, scroll to the bottom and choose Delete account. Your account, profile, week plan, likes, shopping list, pantry and feedback are removed from our database straight away, and the copy on your phone is cleared.',
    noApp: 'Without the app: write to us from the email address of your account and ask for it to be deleted. We delete the same data within 30 days.',
    kept: 'Crash reports hold no name, account or device identifier and cannot be linked to you; they are deleted once they are no longer needed to fix a fault. Backups made by our hosting provider are overwritten on their normal schedule.',
  },
  bg: {
    title: 'Изтриване на профила',
    inApp: 'В приложението: отворете Настройки, превъртете до края и изберете „Изтрий профила“. Профилът ви, данните в него, седмичният план, харесванията, списъкът за пазаруване, наличните продукти и обратната ви връзка се премахват веднага от нашата база данни, а копието на телефона ви се изчиства.',
    noApp: 'Без приложението: пишете ни от имейл адреса на профила си и поискайте той да бъде изтрит. Изтриваме същите данни в срок от 30 дни.',
    kept: 'Докладите за сривове не съдържат име, профил или идентификатор на устройството и не могат да бъдат свързани с вас; те се изтриват, щом вече не са нужни за отстраняване на грешка. Резервните копия, които прави нашият хостинг доставчик, се презаписват по обичайния му график.',
  },
  nl: {
    title: 'Je account verwijderen',
    inApp: 'In de app: open Instellingen, scrol naar beneden en kies Account verwijderen. Je account, profiel, weekplan, likes, boodschappenlijst, voorraad en feedback worden direct uit onze database verwijderd, en de kopie op je telefoon wordt gewist.',
    noApp: 'Zonder de app: schrijf ons vanaf het e-mailadres van je account en vraag om verwijdering. We verwijderen dezelfde gegevens binnen 30 dagen.',
    kept: 'Crashrapporten bevatten geen naam, account of apparaatkenmerk en kunnen niet aan jou worden gekoppeld; ze worden verwijderd zodra ze niet meer nodig zijn om een fout op te lossen. Back-ups van onze hostingprovider worden volgens hun normale schema overschreven.',
  },
};

function page({ lang, doc, title, body }) {
  const others = Object.entries(LANGUAGES)
    .map(([code, name]) => (code === lang ? `<span>${name}</span>` : `<a href="${file(doc, code)}">${name}</a>`))
    .join(' · ');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · fudapp</title>
<style>
  body { margin: 0; background: #F7F8F3; color: #123B2F; font: 17px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 20px 72px; }
  nav { font-size: 14px; color: #5F7A70; display: flex; flex-wrap: wrap; gap: 6px 18px; justify-content: space-between; }
  a { color: #123B2F; }
  h1 { font-size: 34px; line-height: 1.1; letter-spacing: -0.02em; margin: 28px 0 6px; }
  h2 { font-size: 20px; margin: 34px 0 8px; }
  p { margin: 0 0 12px; color: #3F5F53; }
  .updated { font-size: 14px; color: #5F7A70; margin-bottom: 22px; }
  .intro { color: #123B2F; }
</style>
</head>
<body>
<main>
<nav><a href="index.html">fudapp</a><span>${others}</span></nav>
${body}
</main>
</body>
</html>
`;
}

const written = [];
for (const lang of Object.keys(LANGUAGES)) {
  const source = read(`constants/legal/${lang}.json`);
  const owner = config.owner || source.ownerFallback;
  const contact = config.contact ? source.contactWith.replace('{{contact}}', config.contact) : source.contactWithout;
  const fill = text => esc(text.replace('{{owner}}', owner).replace('{{contact}}', contact));
  for (const doc of ['privacy', 'terms']) {
    const { title, intro, sections } = source[doc];
    const body = [
      `<h1>${esc(title)}</h1>`,
      `<p class="updated">${esc(source.updated)}</p>`,
      `<p class="intro">${fill(intro)}</p>`,
      ...sections.map(s => `<h2>${esc(s.heading)}</h2>\n${s.body.map(p => `<p>${fill(p)}</p>`).join('\n')}`),
    ].join('\n');
    writeFileSync(new URL(file(doc, lang), out), page({ lang, doc, title, body }));
    written.push(file(doc, lang));
  }
  const del = DELETE[lang];
  const body = [`<h1>${esc(del.title)}</h1>`, `<p class="updated">${esc(source.updated)}</p>`, `<p>${esc(del.inApp)}</p>`, `<p>${esc(del.noApp)} ${esc(contact)}</p>`, `<p>${esc(del.kept)}</p>`].join('\n');
  writeFileSync(new URL(file('delete-account', lang), out), page({ lang, doc: 'delete-account', title: del.title, body }));
  written.push(file('delete-account', lang));
}

const links = Object.entries(LANGUAGES)
  .map(([lang, name]) => {
    const source = read(`constants/legal/${lang}.json`);
    return `<h2>${name}</h2>\n<p><a href="${file('privacy', lang)}">${esc(source.privacy.title)}</a><br><a href="${file('terms', lang)}">${esc(source.terms.title)}</a><br><a href="${file('delete-account', lang)}">${esc(DELETE[lang].title)}</a></p>`;
  })
  .join('\n');
writeFileSync(
  new URL('index.html', out),
  page({ lang: 'en', doc: 'index', title: 'Legal', body: `<h1>fudapp</h1>\n${links}` }).replace(/<nav>.*<\/nav>\n/, ''),
);
written.push('index.html');

console.log(`Wrote ${written.length} pages to docs/legal/.`);
if (!config.owner || !config.contact) console.log('! constants/legal/config.json has no owner or contact yet: the pages use the general wording.');

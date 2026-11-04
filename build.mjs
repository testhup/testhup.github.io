// Static site generator for karmashawky.com — zero dependencies.
// Usage: node build.mjs   → writes ./dist (upload dist/ to Hostinger public_html)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const readDir = (d) =>
  fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => rd(`${d}/${f}`)) : [];

const jsonIn = (d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => [f.slice(0, -5), rd(`${d}/${f}`)]);
const site = { ...Object.assign({}, ...jsonIn('content/site').map(([, v]) => v)), ...rd('content/settings.json') };
const clients = rd('content/clients.json');
const cases = readDir('content/case-studies').sort((a, b) => a.order - b.order);
const insights = readDir('content/insights');
const snapshots = rd('content/snapshots.json');
const websites = rd('content/websites.json');
const funnels = Object.fromEntries(jsonIn('content/funnels'));
const resources = readDir('content/resources').sort((a, b) => (a.order || 0) - (b.order || 0));
const ads = readDir('content/ads').sort((a, b) => a.order - b.order);
const refs = readDir('content/references').sort((a, b) => a.order - b.order);
const extra = readDir('content/pages').sort((a, b) => (a.order || 0) - (b.order || 0));
const colFolder = (t) => (site.collections[t] ? site.collections[t].folder : null);
const extraUrl = (l, p) => (p.type === 'page' ? url(l, p.slug) : url(l, colFolder(p.type), p.slug));
const extraKey = (p) => (p.type === 'page' ? p.slug : `${colFolder(p.type)}/${p.slug}`);
const LANGS = ['ar', 'en'];
const BASE = site.siteUrl.replace(/\/$/, '');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const T = (o, l) => (o && typeof o === 'object' && !Array.isArray(o) && (l in o) ? o[l] : o);
const url = (l, ...p) => `/${l}/${p.length ? p.join('/') + '/' : ''}`;
const other = (l) => (l === 'ar' ? 'en' : 'ar');
const client = (id) => clients.find((c) => c.id === id);
const publicRole = (c, l) => {
  const r = T(c.role, 'en');
  return /to confirm/i.test(r) ? (l === 'ar' ? 'التسويق' : 'Marketing') : T(c.role, l);
};

// ---------- doodles ----------
const ico = {
  arrow: '<svg class="arr" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  crown: '<svg class="doodle d-crown" viewBox="0 0 64 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 46 4 16l16 14L32 8l12 22 16-14-2 30z"/><circle cx="4" cy="12" r="3"/><circle cx="32" cy="5" r="3"/><circle cx="60" cy="12" r="3"/></svg>',
  bars: '<svg class="doodle d-bars" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 80h78"/><rect x="12" y="52" width="14" height="28" fill="#E9C34E"/><rect x="34" y="38" width="14" height="42" fill="#E9C34E"/><rect x="56" y="22" width="14" height="58" fill="#C8BBA5"/><path d="M10 40 36 24l14 8 28-22m0 0h-14m14 0v14"/></svg>',
  swirl: '<svg class="d-swirl" viewBox="0 0 170 70" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 50c30 14 50-34 24-34-22 0-10 40 38 36 34-3 64-14 92-28m0 0-18-2m18 2-10 14"/></svg>',
  plane: '<svg class="plane" viewBox="0 0 120 60" fill="none" stroke="#292820" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="m4 28 108-22-30 48-22-16-12 14-4-18z M42 36 112 6"/></svg>',
  logoImg: '<img src="/images/logo.png" alt="" width="44" height="44">',
};

// ---------- visuals ----------
function funnelSVG(v, l) {
  const n = v.steps.length, W = 640, rowH = 54, gap = 8, H = n * (rowH + gap);
  const cols = ['#E9C34E', '#C8BBA5', '#E9C34E', '#C8BBA5', '#292820'];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T(v.title, l))}">`;
  v.steps.forEach((st, i) => {
    const w = W - i * ((W - 200) / Math.max(1, n - 1));
    const x = (W - w) / 2, y = i * (rowH + gap);
    const fill = cols[i % cols.length];
    const txt = fill === '#292820' ? '#F4E9D6' : '#292820';
    s += `<rect x="${x}" y="${y}" width="${w}" height="${rowH}" rx="14" fill="${fill}"/><text x="${W / 2}" y="${y + rowH / 2 + 6}" text-anchor="middle" font-size="19" fill="${txt}">${esc(T(st, l))}</text>`;
  });
  return s + '</svg>';
}
function treeSVG(v, l) {
  const b = v.branches, W = 640, colW = W / b.length;
  const H = 250;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T(v.title, l))}">`;
  s += `<rect x="${W / 2 - 100}" y="6" width="200" height="44" rx="14" fill="#292820"/><text x="${W / 2}" y="34" text-anchor="middle" font-size="18" fill="#F4E9D6">${esc(T(v.root, l))}</text>`;
  b.forEach((br, i) => {
    const cx = colW * i + colW / 2;
    s += `<path d="M${W / 2} 50 V70 H${cx} V90" fill="none" stroke="#C8BBA5" stroke-width="3"/>`;
    s += `<rect x="${cx - 80}" y="90" width="160" height="42" rx="12" fill="#E9C34E"/><text x="${cx}" y="116" text-anchor="middle" font-size="16" fill="#292820">${esc(T(br.t, l))}</text>`;
    br.c.forEach((c, j) => {
      const y = 160 + j * 46;
      s += `<path d="M${cx} 132 V${y + 18}" fill="none" stroke="#C8BBA5" stroke-width="2" stroke-dasharray="4 4"/><rect x="${cx - 62}" y="${y}" width="124" height="36" rx="10" fill="#C8BBA5"/><text x="${cx}" y="${y + 23}" text-anchor="middle" font-size="14" fill="#292820">${esc(T(c, l))}</text>`;
    });
  });
  return s + '</svg>';
}
function journeyHTML(v, l) {
  return `<ol class="journey" aria-label="${esc(T(v.title, l))}">${v.stages
    .map((s) => `<li><b>${esc(T(s.t, l))}</b><span>${esc(T(s.d, l))}</span></li>`)
    .join('')}</ol>`;
}
function tableHTML(v, l) {
  const cell = (x) => esc(T(x, l));
  return `<div class="tbl"><table><thead><tr>${v.cols.map((c) => `<th scope="col">${cell(c)}</th>`).join('')}</tr></thead><tbody>${v.rows.map((r) => `<tr>${r.cells.map((x, i) => (i === 0 ? `<th scope="row">${cell(x)}</th>` : `<td>${cell(x)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function visual(v, l, src) {
  const inner = v.type === 'funnel' ? funnelSVG(v, l) : v.type === 'tree' ? treeSVG(v, l) : v.type === 'table' ? tableHTML(v, l) : journeyHTML(v, l);
  const cap = v.type === 'table' ? `${T(site.work.source, l)}: ${src ? T(src, l) : ''}` : T(site.work.illustrative, l);
  return `<figure class="viz"><h3>${esc(T(v.title, l))}</h3>${inner}<figcaption>${esc(cap)}</figcaption></figure>`;
}

// ---------- layout ----------
function layout(l, key, { title, desc, body, ld = [], altPath, ogType = 'website', noindex = false }) {
  const dir = l === 'ar' ? 'rtl' : 'ltr';
  const canon = `${BASE}${altPath[l]}`;
  const isCur = (...ks) => ks.some((k) => key === k || key.startsWith(k + '/'));
  const A = (href, label, cur) => `<a href="${href}"${cur ? ' aria-current="page"' : ''}>${esc(T(label, l))}</a>`;
  const dd = (label, items, active) => `<div class="dd"><button class="dd-btn" type="button" aria-expanded="false" aria-haspopup="true"${active ? ' data-active="1"' : ''}>${esc(T(label, l))}</button><div class="dd-menu">${items.join('')}</div></div>`;
  const workSub = ['work/websites', 'work/ads', 'work/clients', 'work/references'];
  const nav = [
    dd(site.nav.services, [A(url(l, 'services'), site.nav.servicesAll, key === 'services'), A(url(l, 'consulting'), site.nav.consulting, key === 'consulting'), A(url(l, 'marketing-management'), site.nav.management, key === 'marketing-management')], isCur('services', 'consulting', 'marketing-management')),
    dd(site.nav.work, [A(url(l, 'work'), site.work.sub.cases, key === 'work' || (key.startsWith('work/') && !workSub.includes(key))), A(url(l, 'work', 'websites'), site.nav.websites, key === 'work/websites'), A(url(l, 'work', 'ads'), site.work.sub.ads, key === 'work/ads'), A(url(l, 'work', 'clients'), site.work.sub.clients, key === 'work/clients')], key.startsWith('work')),
    A(url(l, 'about'), site.nav.about, key === 'about'),
    A(url(l, 'insights'), site.nav.insights, isCur('insights')),
    ...(resources.length ? [A(url(l, 'resources'), site.nav.resources, isCur('resources'))] : []),
    A(url(l, 'contact'), site.nav.contact, key === 'contact'),
  ].join('');
  const ga = (site.analytics && site.analytics.ga4) || '';
  const px = (site.analytics && site.analytics.metaPixel) || '';
  const KS = JSON.stringify({
    lang: l, px, endpoint: site.forms.endpoint || '', sheets: site.forms.sheetsWebhook || '', ga4: ga, thanks: url(l, 'thank-you'),
    wa: (site.links.whatsapp || '').replace(/\D/g, ''), booking: site.booking.mode === 'calendar' ? site.booking.bookingUrl : '',
    waText: l === 'ar'
      ? { general: 'مرحباً كارما، أود التواصل معك بخصوص عملي.', consulting: 'مرحباً كارما، أود الاستفسار عن الاستشارات التسويقية.', management: 'مرحباً كارما، أود الاستفسار عن إدارة التسويق الشهرية.', consultation: 'مرحباً كارما، أود حجز استشارة.', audit: 'مرحباً كارما، أود طلب مراجعة تسويقية.', proposal: 'مرحباً كارما، أود طلب عرض تعاون مخصّص.' }
      : { general: 'Hello Karma, I would like to get in touch about my business.', consulting: 'Hello Karma, I would like to ask about marketing consulting.', management: 'Hello Karma, I would like to ask about monthly marketing management.', consultation: 'Hello Karma, I would like to book a consultation.', audit: 'Hello Karma, I would like to request a marketing audit.', proposal: 'Hello Karma, I would like to request a custom proposal.' },
    refLabel: l === 'ar' ? 'المرجع' : 'Ref',
    typeLabels: Object.fromEntries(Object.entries(site.form.types).map(([k, v]) => [k, T(v, l)])),
    err: { required: T(site.form.errRequired, l), email: T(site.form.errEmail, l), whatsapp: T(site.form.errWhatsapp, l), consent: T(site.form.errConsent, l), network: T(site.form.errNetwork, l), unconfigured: T(site.form.errUnconfigured, l) },
  }).replace(/</g, '\\u003c');
  const pxHead = px ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','revoke');fbq('init','${esc(px)}');fbq('track','PageView');</script>` : '';
  const gaHead = ga
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});gtag('js',new Date());gtag('config','${esc(ga)}');</script>`
    : `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}</script>`;
  const consentBar = (ga || px)
    ? `<div class="consent" id="consent" role="dialog" aria-label="Cookies" hidden><p>${esc(T(site.cookie.text, l))} <a href="${url(l, 'privacy')}">${esc(T(site.footer.privacy, l))}</a></p><div><button type="button" class="btn sm" data-consent="accept">${esc(T(site.cookie.accept, l))}</button> <button type="button" class="btn sm ghost" data-consent="decline">${esc(T(site.cookie.decline, l))}</button></div></div>`
    : '';
  const soc = [['hub', 'All links'], ['linkedin', 'LinkedIn'], ['instagram', 'Instagram'], ['youtube', 'YouTube']]
    .filter(([k]) => site.links[k])
    .map(([k, n]) => `<a href="${esc(site.links[k])}" rel="noopener" target="_blank">${n}</a>`)
    .join('') +
    (site.links.whatsapp ? `<a href="https://wa.me/${esc(site.links.whatsapp.replace(/\D/g, ''))}" rel="noopener" target="_blank">WhatsApp</a>` : '') +
    (site.links.email ? `<a href="mailto:${esc(site.links.email)}">Email</a>` : '');
  const resLink = resources.length ? `<a href="${url(l, 'resources')}">${esc(T(site.nav.resources, l))}</a>` : '';
  const privacyLink = `<a href="${url(l, 'privacy')}">${esc(T(site.footer.privacy, l))}</a>`;
  const colLinks = Object.entries(site.collections).filter(([t]) => extra.some((p) => p.type === t)).map(([t, c]) => `<a href="${url(l, c.folder)}">${esc(T(c.title, l))}</a>`).join('') + resLink + privacyLink;
  return `<!doctype html>
<html lang="${l}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${canon}">
<link rel="alternate" hreflang="ar" href="${BASE}${altPath.ar}">
<link rel="alternate" hreflang="en" href="${BASE}${altPath.en}">
<link rel="alternate" hreflang="x-default" href="${BASE}${altPath[site.defaultLang]}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canon}">
<meta property="og:locale" content="${l === 'ar' ? 'ar_EG' : 'en_US'}">
<meta property="og:image" content="${BASE}/images/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F4E9D6">
<link rel="icon" href="/images/icon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/images/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/css/style.css">
<script>try{var t=localStorage.getItem('ks-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
${gaHead}
${pxHead}
<script>window.KS=${KS}</script>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">${esc(T(site.ui.skip, l))}</a>
<header class="hdr"><div class="wrap">
  <a class="brand" href="${url(l)}" aria-label="${esc(T(site.name, l))}">${ico.logoImg}<span>${esc(T(site.name, l))}</span></a>
  <nav class="nav" id="nav" aria-label="Main">${nav}</nav>
  <div class="tools">
    <a class="btn sm nav-cta" href="${url(l, 'book')}" data-cta="header_book">${esc(T(site.nav.cta, l))}</a>
    <a class="pill-btn" href="${altPath[other(l)]}" hreflang="${other(l)}" lang="${other(l)}" data-track="language_switch" data-lang="${other(l)}">${esc(T(site.ui.lang, l))}</a>
    <button class="icon-btn" id="theme" type="button" aria-label="${esc(T(site.ui.theme, l))}">◐</button>
    <button class="icon-btn burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="${esc(T(site.ui.menu, l))}">☰</button>
  </div>
</div></header>
<main id="main">
${body}
</main>
<footer class="ftr"><div class="wrap">
  <a class="brand" href="${url(l)}">${ico.logoImg}<span>${esc(T(site.name, l))}</span></a>
  <nav aria-label="Footer">${nav}${colLinks}${soc}</nav>
  <small>© ${new Date().getFullYear()} ${esc(T(site.name, l))}. ${esc(T(site.footer.copy, l))} ${esc(T(site.footer.built, l))}</small>
</div></footer>
${consentBar}
<script src="/assets/js/main.js" defer></script>
</body>
</html>`;
}

const pageHead = (title, lead) => `<section class="page-head"><div class="wrap"><h1>${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</div></section>`;
const breadcrumb = (l, items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: BASE + p })),
});
const personLD = (l) => {
  const sameAs = Object.entries(site.links).filter(([k, v]) => ['linkedin', 'instagram', 'youtube'].includes(k) && v).map(([, v]) => v);
  return {
    '@context': 'https://schema.org', '@type': 'Person', name: 'Karma Shawky', alternateName: site.name.ar,
    jobTitle: T(site.role, l), description: l === 'ar' ? 'مستشارة نمو واستراتيجية تسويق ومديرة تسويق وشريكة نمو للأعمال' : 'Growth and marketing strategy consultant, marketing manager and business growth partner', ...(site.links.email ? { email: site.links.email } : {}), ...(site.links.whatsapp ? { telephone: '+' + site.links.whatsapp } : {}), url: `${BASE}${url(l)}`, image: `${BASE}/images/karma-hero.webp`,
    knowsAbout: ['Growth strategy', 'Performance marketing', 'Meta Ads', 'Google Ads', 'Lead generation', 'Conversion rate optimization', 'CRM'],
    ...(sameAs.length ? { sameAs } : {}),
  };
};

const nm = (c, l) => (l === 'ar' ? c.nameAr : c.name);
const MK = { Egypt: { en: 'Egypt', ar: 'مصر' }, UAE: { en: 'UAE', ar: 'الإمارات' }, KSA: { en: 'Saudi Arabia', ar: 'السعودية' }, Jordan: { en: 'Jordan', ar: 'الأردن' } };
const markets = (c, l) => c.markets.map((m) => T(MK[m], l)).join(' · ');
function logoItem(c, l) {
  const pic = c.logo
    ? `<img src="${c.logo}" width="120" height="120" loading="lazy" alt="${esc(nm(c, l))}">`
    : `<div class="wm" aria-hidden="true">${esc(nm(c, l))}</div>`;
  return `<figure class="logo">${pic}<figcaption>${esc(nm(c, l))}<small>${esc(T(c.industry, l))}${c.markets.length ? ' · ' + esc(markets(c, l)) : ''}</small></figcaption></figure>`;
}
const logoGrid = (l, list) => `<div class="logos">${list.map((c) => logoItem(c, l)).join('')}</div>`;
const PAL = ['#E9C34E', '#C8BBA5', '#E4D2A1', '#F3DFA9'];
const siteIcon = (w, i) => `<span class="sico" style="background:${PAL[i % PAL.length]}" aria-hidden="true">${esc(T(w.name, 'en').trim().charAt(0))}</span>`;
const siteMark = (w, i) => (w.logo ? `<img src="${w.logo}" width="40" height="40" loading="lazy" alt="">` : siteIcon(w, i));
const sitesIcons = (l, list) => `<div class="sites">${list.map((w, i) => `<a class="site-chip" href="${esc(w.url)}" target="_blank" rel="noopener">${siteMark(w, i)}<span><b>${esc(T(w.name, l))}</b><small dir="ltr">${esc(w.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</small></span></a>`).join('')}</div>`;
const subnav = (l, active) => `<nav class="subnav" aria-label="${esc(T(site.nav.work, l))}">${[['', 'cases'], ['websites', 'websites'], ['ads', 'ads'], ['clients', 'clients']].concat(refs.length ? [['references', 'references']] : []).map(([p, k]) => `<a href="${p ? url(l, 'work', p) : url(l, 'work')}"${k === active ? ' aria-current="page"' : ''}>${esc(T(site.work.sub[k], l))}</a>`).join('')}</nav>`;
const brandN = Math.floor(clients.length / 10) * 10;
function caseCard(c, l) {
  const cl = client(c.clientId);
  const kp = c.kind === 'results' ? c.results.slice(0, 2).map((r) => `<div><b>${esc(T(r.v, l))}</b><span>${esc(T(r.l, l))}</span></div>`).join('') : '';
  return `<a class="case-card" href="${url(l, 'work', c.slug)}">
  <div class="cc-top">${cl.logo ? `<img class="cc-logo" src="${cl.logo}" width="40" height="40" alt="">` : ''}<span class="cc-client">${esc(nm(cl, l))}</span><span class="chip">${esc(T(c.tag, l))}</span></div>
  <h3>${esc(T(c.title, l))}</h3>
  ${kp ? `<div class="mini-kpis">${kp}</div>` : `<p>${esc(T(c.summary, l))}</p>`}
  <span class="more">${esc(T(site.work.readCase, l))} ${ico.arrow}</span></a>`;
}
function caseCards(l, kind, opts = {}) {
  return `<div class="cards${opts.feature ? ' feature-first' : ''}">${cases.filter((c) => !kind || c.kind === kind).map((c) => caseCard(c, l)).join('')}</div>`;
}

// ---------- lead forms ----------
function formHTML(l, { id, type, selectable = false }) {
  const f = site.form;
  const opt = (o) => `<option value="${esc(o.v)}">${esc(T(o.l, l))}</option>`;
  const err = (n) => `<span class="err" id="${id}-${n}-err" role="alert"></span>`;
  const fld = (n, label, input, req, extra = '') => `<div class="fld"${extra}><label for="${id}-${n}">${esc(T(label, l))} <span class="req" aria-hidden="true"${req ? '' : ' hidden'}>*</span></label>${input}${err(n)}</div>`;
  const sel = (n, label, opts, req, extra = '', reqFor = '') => fld(n, label, `<select id="${id}-${n}" name="${n}"${req ? ' required' : ''}${reqFor ? ` data-req-for="${reqFor}"` : ''} aria-describedby="${id}-${n}-err"><option value="">${esc(T(f.pick, l))}</option>${opts.map(opt).join('')}</select>`, req, extra);
  const choices = selectable ? ['general', 'consultation', 'audit', 'proposal'] : [];
  const typeField = selectable
    ? fld('lead_type', f.whatFor, `<select id="${id}-lead_type" name="lead_type" required aria-describedby="${id}-lead_type-err">${choices.map((k) => `<option value="${k}"${k === type ? ' selected' : ''}>${esc(T(f.types[k], l))}</option>`).join('')}</select>`, true)
    : `<input type="hidden" name="lead_type" value="${type}">`;
  return `<form class="lead-form" id="${id}" method="post" novalidate data-form-id="${id}" data-default-type="${type}">
  ${typeField}
  <div class="row2">
    ${fld('name', f.name, `<input id="${id}-name" name="name" required autocomplete="name" aria-describedby="${id}-name-err">`, true)}
    ${sel('country', f.country, site.countries, true)}
  </div>
  <div class="row2">
    ${fld('email', f.email, `<input id="${id}-email" name="email" type="email" autocomplete="email" inputmode="email" dir="ltr" aria-describedby="${id}-email-err">`, false)}
    ${fld('company', f.company, `<input id="${id}-company" name="company" autocomplete="organization">`, false)}
  </div>
  ${fld('website', f.website, `<input id="${id}-website" name="website" dir="ltr" inputmode="url" autocomplete="url" data-req-for="audit" aria-describedby="${id}-website-err">`, false)}
  ${sel('service', f.service, f.serviceOpts, false, ' data-for="consulting"', 'consulting')}
  ${sel('topic', f.topic, f.topicOpts, false, ' data-for="consultation"', 'consultation')}
  ${fld('preferred_time', f.preferred, `<input id="${id}-preferred_time" name="preferred_time" aria-describedby="${id}-preferred_time-err">`, false, ' data-for="consultation"')}
  ${sel('goal', f.goal, f.goalOpts, false, ' data-for="audit"', 'audit')}
  ${sel('ad_platforms', f.adPlatforms, f.adOpts, false, ' data-for="audit"')}
  ${sel('project_type', f.projectType, f.projectOpts, false, ' data-for="proposal"', 'proposal')}
  ${sel('timeline', f.timeline, f.timelineOpts, false, ' data-for="proposal"')}
  <div class="row2" data-for="management audit proposal">
    ${fld('budget', f.budget, `<input id="${id}-budget" name="budget" aria-describedby="${id}-budget-err">`, false)}
    <div data-for="management">${sel('setup', f.setup, f.setupOpts, false)}</div>
  </div>
  ${fld('message', f.message, `<textarea id="${id}-message" name="message" rows="5" data-req-for="general consulting management consultation proposal" minlength="10" aria-describedby="${id}-message-err"></textarea>`, false)}
  <div class="fld consent-fld"><label class="chk"><input type="checkbox" name="consent" value="yes" required aria-describedby="${id}-consent-err"> <span>${esc(T(f.consent, l))} <a href="${url(l, 'privacy')}" target="_blank" rel="noopener">${esc(T(f.privacyLink, l))}</a></span></label>${err('consent')}</div>
  <input class="hp" name="hp_url" tabindex="-1" autocomplete="off" aria-hidden="true">
  <button class="btn" type="submit" data-label="${esc(T(f.send, l))}" data-sending="${esc(T(f.sending, l))}">${esc(T(f.send, l))} ${ico.arrow}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
  <p class="form-hint">${esc(T(f.note, l))}</p>
</form>`;
}
const ctaBand = (l) => `<section class="cta-band"><div class="wrap"><div><h2>${esc(T(site.home.ctaBandTitle, l))}</h2><p>${esc(T(site.home.ctaBandSub, l))}</p></div><div class="cta-row"><a class="btn dark" href="${url(l, 'book')}" data-cta="band_book">${esc(T(site.home.ctaBook, l))} ${ico.arrow}</a><a class="btn ghost dark-ghost" href="${url(l, 'audit')}" data-cta="band_audit">${esc(T(site.home.ctaAudit, l))}</a><a class="btn ghost dark-ghost" href="${url(l, 'proposal')}" data-cta="band_proposal">${esc(T(site.home.ctaProposal, l))}</a></div></div></section>`;
const faqBlock = (F, l) => `<h2>${esc(T(F.faqTitle, l))}</h2>${F.faq.map((q) => `<details><summary>${esc(T(q.q, l))}</summary><p>${esc(T(q.a, l))}</p></details>`).join('')}`;
const ulPlain = (arr, l) => `<ul class="plain big">${T(arr, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
const waHref = (extra = '') => (site.links.whatsapp ? `https://wa.me/${site.links.whatsapp.replace(/\D/g, '')}${extra}` : '');
const hlPhrase = (txt, phrase) => (phrase && txt.includes(phrase) ? esc(txt).replace(esc(phrase), `<mark>${esc(phrase)}</mark>`) : esc(txt));

// ---------- pages ----------
const pages = []; // {l,key,path,html}
const add = (l, key, p, html) => pages.push({ l, key, path: p, html });
const alt = (...p) => ({ ar: url('ar', ...p), en: url('en', ...p) });

for (const l of LANGS) {
  const H = site.home;
  // HOME
  {
    const S = site.services;
    const body = `
<section class="hero"><div class="wrap">
  <div>
    <p class="eyebrow">${esc(T(site.name, l))} · ${esc(T(site.role, l))}</p>
    <h1>${hlPhrase(T(H.positioning, l), T(H.highlight, l))}</h1>
    <p class="lead hero-lead">${esc(T(H.heroValue, l))}</p>
    <p class="roles">${esc(T(H.rolesLine, l))}</p>
    <div class="cta-row"><a class="btn" href="${url(l, 'book')}" data-cta="hero_book">${esc(T(H.ctaBook, l))} ${ico.arrow}</a><a class="btn ghost" href="${url(l, 'audit')}" data-cta="hero_audit">${esc(T(H.ctaAudit, l))}</a></div>
  </div>
  <div class="hero-art">
    <div class="blob" aria-hidden="true"></div>
    <img class="hero-photo" src="/images/karma-hero.webp" width="820" height="1020" alt="${esc(T(site.name, l))}, ${esc(T(site.role, l))}" fetchpriority="high">
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <h2 class="sec-title">${esc(T(H.challengesTitle, l))}</h2>
  <div class="chal">${H.challenges.map((c, i) => `<div class="chal-item"><span class="n">0${i + 1}</span><h3>${esc(T(c.t, l))}</h3><p>${esc(T(c.d, l))}</p></div>`).join('')}</div>
</div></section>
<section class="sec alt"><div class="wrap">
  <h2 class="sec-title">${esc(T(H.pillarsTitle, l))}</h2>
  <div class="pillars">${S.pillars.map((p, i) => `<article class="pillar"><span class="n">0${i + 1}</span><h3>${esc(T(p.t, l))}</h3><p>${esc(T(p.d, l))}</p><a class="more" href="${url(l, p.href)}" data-cta="home_pillar_${p.k}">${esc(T(p.cta, l))} ${ico.arrow}</a></article>`).join('')}</div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="row-head"><h2 class="sec-title">${esc(T(H.featuredTitle, l))}</h2><a class="btn ghost" href="${url(l, 'work')}">${esc(T(H.viewAll, l))} ${ico.arrow}</a></div>
  ${caseCards(l, 'results', { feature: true })}
  <p class="strip-label" style="margin-top:2rem">${esc(T(H.selectedClients, l))}</p><div class="logo-strip">${clients.filter((c) => c.logo).sort((a, b) => ({ featured: 0, highlight: 1, client: 2 }[a.tier] - { featured: 0, highlight: 1, client: 2 }[b.tier])).slice(0, 10).map((c) => `<img src="${c.logo}" width="72" height="72" loading="lazy" alt="${esc(nm(c, l))}" title="${esc(nm(c, l))}">`).join('')}<a class="strip-more" href="${url(l, 'work', 'clients')}">${esc(T(H.allClients, l))} ${ico.arrow}</a></div>
  <p style="margin-top:.6rem"><a class="more" href="${url(l, 'work', 'websites')}">${esc(T(site.nav.websites, l))} ${ico.arrow}</a></p>
</div></section>
<section class="sec alt"><div class="wrap">
  <h2 class="sec-title">${esc(T(H.approachTitle, l))}</h2>
  <ol class="rhythm">${H.approach.map((s) => `<li><b>${esc(T(s.t, l))}</b><span>${esc(T(s.d, l))}</span></li>`).join('')}</ol>
</div></section>
<section class="sec"><div class="wrap about-grid">
  <div>
    <h2 class="sec-title">${esc(T(H.aboutTitle, l))}</h2>
    <p class="prose">${esc(T(H.aboutText, l))}</p>
    <a class="btn ghost" href="${url(l, 'about')}">${esc(T(H.aboutCta, l))} ${ico.arrow}</a>
  </div>
  <div class="about-photo"><img src="/images/karma-about.webp" width="760" height="900" loading="lazy" alt="${esc(T(site.about.photoAlt, l))}"></div>
</div></section>
<section class="sec alt"><div class="wrap">
  <div class="row-head"><h2 class="sec-title">${esc(T(H.insightsTitle, l))}</h2><a class="btn ghost" href="${url(l, 'insights')}">${esc(T(site.work.viewAll, l))} ${ico.arrow}</a></div>
  <div class="grid3">${insights.slice(0, 3).map((a) => `<a class="tile art-card" href="${url(l, 'insights', a.slug)}"><h3>${esc(T(a.title, l))}</h3><p>${esc(T(a.summary, l))}</p><p class="meta-line">${a.min} ${esc(T(site.insights.min, l))}</p></a>`).join('')}</div>
</div></section>
${ctaBand(l)}`;
    add(l, 'home', url(l), layout(l, 'home', {
      title: T(H.title, l), desc: T(H.description, l), body, altPath: alt(),
      ld: [personLD(l), { '@context': 'https://schema.org', '@type': 'WebSite', name: T(site.name, l), url: BASE + url(l), inLanguage: l }],
    }));
  }

  // ABOUT
  {
    const A = site.about;
    const body = `${pageHead(T(A.title, l), T(A.lead, l))}
<section class="sec" style="padding-top:0"><div class="wrap two">
  <div class="story">${T(A.story, l).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  <img src="/images/karma-thinking.webp" width="760" height="900" alt="${esc(T(site.name, l))}" loading="lazy">
</div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(A.principlesTitle, l))}</h2>
  <div class="grid2" style="margin-top:1.2rem">${A.principles.map((p) => `<div class="tile"><div class="em" aria-hidden="true">${p.emoji}</div><h3>${esc(T(p.t, l))}</h3><p>${esc(T(p.d, l))}</p></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><h2 class="sec-title">${esc(T(A.credsTitle, l))}</h2>
  <div class="grid3" style="margin-top:1.2rem">${A.creds.map((c) => `<div class="tile"><div class="em" aria-hidden="true">${c.emoji}</div><h3>${esc(T(c.t, l))}</h3><ul class="plain">${T(c.d, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><h2 class="sec-title">${esc(T(A.expTitle, l))}</h2>
  <div class="exp">${A.exp.map((e) => `<div><b>${esc(T(e.t, l))}${e.y ? ' · ' + e.y : ''}</b><span>${esc(T(e.d, l))}</span></div>`).join('')}</div></div></section>
${ctaBand(l)}`;
    add(l, 'about', url(l, 'about'), layout(l, 'about', {
      title: `${T(A.title, l)} | ${T(site.name, l)}`, desc: T(A.description, l), body, altPath: alt('about'),
      ld: [personLD(l), breadcrumb(l, [[T(site.nav.about, l), url(l, 'about')]])],
    }));
  }

  // SERVICES
  {
    const S = site.services;
    const body = `${pageHead(T(S.title, l), T(S.lead, l))}
<section class="sec" style="padding-top:0"><div class="wrap pillar-list">${S.pillars.map((p, i) => `<article class="pl"><div class="pl-h"><span class="n">0${i + 1}</span><div><h2>${esc(T(p.t, l))}</h2><p class="lead">${esc(T(p.d, l))}</p></div></div>${ulPlain(p.items, l)}<a class="btn ghost sm" href="${url(l, p.href)}" data-cta="services_pillar_${p.k}">${esc(T(p.cta, l))}</a></article>`).join('')}</div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(S.capsTitle, l))}</h2><p class="lead" style="margin-top:.6rem">${esc(T(S.capsLead, l))}</p><ul class="caps">${T(S.caps, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></section>
${ctaBand(l)}`;
    add(l, 'services', url(l, 'services'), layout(l, 'services', {
      title: `${T(S.title, l)} | ${T(site.name, l)}`, desc: T(S.description, l), body, altPath: alt('services'),
      ld: [{ '@context': 'https://schema.org', '@type': 'ProfessionalService', name: T(site.name, l), url: BASE + url(l, 'services'), areaServed: ['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'], serviceType: S.pillars.map((p) => T(p.t, 'en')) }, breadcrumb(l, [[T(S.title, l), url(l, 'services')]])],
    }));
  }

  // WORK INDEX
  {
    const W = site.work;
    const hl = clients.filter((c) => c.tier === 'highlight');
    const groups = site.clientGroups.map((g) => `<h3 class="grp">${esc(T(g.t, l))}</h3>${logoGrid(l, clients.filter((c) => c.group === g.id))}`).join('');
    const gal = ads.filter((a) => !a.group).map((a) => `<a href="${a.image}" target="_blank" rel="noopener"><img src="${a.image}" width="1366" height="768" loading="lazy" alt="${esc(T(a.alt, l))}"></a>`).join('');
    const body = `${pageHead(T(W.title, l), T(W.lead, l))}
<div class="wrap">${subnav(l, 'cases')}</div>
<section class="sec" style="padding-top:0"><div class="wrap">
  <h2 class="sec-title">${esc(T(W.featured, l))}</h2><div style="height:1rem"></div>${caseCards(l, 'results')}
</div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(W.snapshotsTitle, l))}</h2><p class="lead" style="margin-top:.6rem">${esc(T(W.snapshotsNote, l))}</p>
  <div class="grid2" style="margin-top:1.2rem">${snapshots.map((s) => { const c = client(s.client); return `<div class="tile snap"><div class="snap-head">${c.logo ? `<img src="${c.logo}" width="44" height="44" loading="lazy" alt="">` : ''}<div><h3>${esc(nm(c, l))}</h3><small>${esc(s.platform)} · ${esc(T(s.period, l))}</small></div></div><div class="kpis">${s.metrics.map((m) => `<div><b>${esc(m.v)}</b><span>${esc(T(m.l, l))}</span>${m.c ? `<em>${esc(m.c)}</em>` : ''}</div>`).join('')}</div><p>${esc(T(s.note, l))}</p>${(s.shots || []).length ? `<div class="snap-shots">${s.shots.map((x) => `<a href="${x.src}" target="_blank" rel="noopener" title="${esc(T(W.shotsOpen, l))}"><img src="${x.src}" loading="lazy" alt="${esc(T(x.alt, l))}"></a>`).join('')}</div>` : ''}</div>`; }).join('')}</div></div></section>
<section class="sec"><div class="wrap"><div class="row-head"><h2 class="sec-title">${esc(T(W.sitesTitle, l))}</h2><a class="btn ghost" href="${url(l, 'work', 'websites')}">${esc(T(W.viewAll, l))} ${ico.arrow}</a></div>${sitesIcons(l, websites)}</div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(W.conceptsTitle, l))}</h2><div class="notice" style="margin-top:1rem">${esc(T(W.conceptsNote, l))}</div>${caseCards(l, 'concept')}</div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(W.highlights, l))}</h2>
  <div class="grid3" style="margin-top:1.2rem">${hl.map((c) => `<div class="tile hl">${c.logo ? `<img class="hl-logo" src="${c.logo}" width="64" height="64" loading="lazy" alt="">` : ''}<span class="chip">${esc(T(c.industry, l))}</span><h3>${esc(nm(c, l))}</h3><p><b>${esc(T(W.role, l))}:</b> ${esc(publicRole(c, l))}${c.markets.length ? ' · ' + esc(markets(c, l)) : ''}</p>${c.services.length ? `<div class="tags" style="margin-top:.6rem">${c.services.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><h2 class="sec-title">${esc(T(W.clients, l))}</h2>${groups}</div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(W.gallery.title, l))}</h2><p class="lead" style="margin-top:.6rem">${esc(T(W.gallery.note, l))}</p><div class="gallery">${gal}</div><p style="margin-top:1.2rem"><a class="btn ghost" href="${url(l, 'work', 'ads')}">${esc(T(W.viewAll, l))} ${ico.arrow}</a></p></div></section>`;
    add(l, 'work', url(l, 'work'), layout(l, 'work', {
      title: `${T(W.title, l)} | ${T(site.name, l)}`, desc: T(W.description, l), body, altPath: alt('work'),
      ld: [breadcrumb(l, [[T(W.title, l), url(l, 'work')]])],
    }));

    // CASE PAGES: consulting structure (context, challenge, thinking, role, execution, impact, lessons)
    for (const c of cases) {
      const cl = client(c.clientId);
      const S7 = W.sections7, secs = c.sections, isRes = c.kind === 'results', lay = c.layout || 'concept';
      const L2 = (k) => T(secs[k], l);
      const ul = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      const para = (v) => `<p>${esc(v)}</p>`;
      const tags = (arr) => `<span class="tags">${arr.map((x) => `<span>${esc(x)}</span>`).join('')}</span>`;
      const tbl = c.visuals.find((v) => v.type === 'table');
      const dg = c.visuals.filter((v) => v.type !== 'table');
      const sec = (id, title, inner) => `<section class="cs-sec" id="${id}"><h2>${esc(title)}</h2><div>${inner}</div></section>`;
      const shots = (c.screens || []).length ? `<h3 class="sub">${esc(T(W.screens, l))}</h3><div class="shots">${c.screens.map((s) => `<figure class="shot"><a href="${s.src}" target="_blank" rel="noopener"><img src="${s.src}" loading="lazy" alt="${esc(T(s.alt, l))}"></a><figcaption>${esc(T(s.caption, l))}</figcaption></figure>`).join('')}</div>` : '';
      const kpis = isRes ? `<div class="kpis big">${c.results.map((r) => `<div><b>${esc(T(r.v, l))}</b><span>${esc(T(r.l, l))}</span></div>`).join('')}</div>` : '';
      const S = {
        context: sec('context', T(S7.context, l), para(L2('overview')) + `<p class="muted">${esc(L2('industry'))}</p>`),
        challenge: sec('challenge', T(S7.challenge, l), para(L2('challenge')) + para(L2('problem'))),
        thinking: sec('thinking', T(S7.thinking, l), para(L2('approach')) + ul(L2('strategy')) + (dg[0] ? visual(dg[0], l, c.source) : '')),
        role: sec('role', T(S7.role, l), para(T(c.role, l))),
        execution: sec('execution', T(S7.execution, l), ul(L2('execution')) + `<h3 class="sub">${esc(T(W.campaignH, l))}</h3>` + ul(L2('campaign')) + `<h3 class="sub">${esc(T(W.creativeH, l))}</h3>` + ul(L2('creative')) + (dg[1] ? visual(dg[1], l, c.source) : '')),
        impact: isRes ? sec('impact', T(S7.impact, l), kpis + para(L2('impact')) + (tbl ? visual(tbl, l, c.source) : '') + shots) : sec('impact', T(S7.impactConcept, l), para(L2('impact'))),
        lessons: sec('lessons', T(S7.lessons, l), ul(L2('learnings'))),
      };
      const orders = { data: ['context', 'impact', 'challenge', 'thinking', 'role', 'execution', 'lessons'], story: ['context', 'challenge', 'impact', 'thinking', 'role', 'execution', 'lessons'] };
      const parts = (orders[lay] || ['context', 'challenge', 'thinking', 'role', 'execution', 'impact', 'lessons']).map((k) => S[k]).join('');
      const F = W.facts;
      const factRows = [[F.client, esc(T(cl.industry, l))]]
        .concat(cl.markets.length ? [[F.market, esc(markets(cl, l))]] : [])
        .concat(isRes ? [[F.period, esc(T(c.period, l))], [F.channels, c.channels ? tags(T(c.channels, l)) : ''], [F.source, esc(T(c.source, l))]] : []);
      const factsHTML = `<dl class="cs-facts">${factRows.map(([k, v]) => `<div><dt>${esc(T(k, l))}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
      const others = cases.filter((x) => x.slug !== c.slug);
      const body = `<section class="page-head cs-head lay-${lay}"><div class="wrap">
  <a href="${url(l, 'work')}" class="back">${l === 'ar' ? '→' : '←'} ${esc(T(W.back, l))}</a>
  <p style="margin-top:1rem"><span class="chip">${esc(T(c.tag, l))}</span></p>
  <h1>${esc(T(c.title, l))}</h1><p class="lead">${esc(T(c.summary, l))}</p>
  ${lay === 'report' ? '' : factsHTML}
  ${isRes ? '' : `<div class="notice concept">${esc(T(W.conceptBanner, l))}</div>`}</div></section>
<section class="sec" style="padding-top:0"><div class="wrap cs-body lay-${lay}">${lay === 'report' ? `<aside class="cs-aside">${factsHTML}</aside>` : ''}<div class="cs-main">${parts}</div></div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(W.next, l))}</h2><div class="cards" style="margin-top:1.2rem">${others.map((o) => caseCard(o, l)).join('')}</div></div></section>
${ctaBand(l)}`;
      add(l, `work/${c.slug}`, url(l, 'work', c.slug), layout(l, `work/${c.slug}`, {
        title: `${T(c.title, l)} | ${T(site.name, l)}`, desc: T(c.summary, l), body, altPath: alt('work', c.slug), ogType: 'article',
        ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: T(c.title, l), description: T(c.summary, l), inLanguage: l, author: { '@type': 'Person', name: 'Karma Shawky' }, image: `${BASE}/images/og-image.jpg`, mainEntityOfPage: BASE + url(l, 'work', c.slug) },
          breadcrumb(l, [[T(W.title, l), url(l, 'work')], [T(c.title, l), url(l, 'work', c.slug)]])],
      }));
    }
  }

  // INSIGHTS
  {
    const I = site.insights;
    const body = `${pageHead(T(I.title, l), T(I.lead, l))}
<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid3">${insights.map((a) => `<a class="tile art-card" href="${url(l, 'insights', a.slug)}"><div class="em" aria-hidden="true">${a.emoji}</div><h3>${esc(T(a.title, l))}</h3><p>${esc(T(a.summary, l))}</p><p style="margin-top:.6rem;font-weight:800">${esc(T(I.read, l))} · ${a.min} ${esc(T(I.min, l))}</p></a>`).join('')}</div></div></section>`;
    add(l, 'insights', url(l, 'insights'), layout(l, 'insights', {
      title: `${T(I.title, l)} | ${T(site.name, l)}`, desc: T(I.description, l), body, altPath: alt('insights'),
      ld: [breadcrumb(l, [[T(I.title, l), url(l, 'insights')]])],
    }));
    for (const a of insights) {
      const body2 = `<section class="page-head"><div class="wrap"><a href="${url(l, 'insights')}" style="font-weight:800">${l === 'ar' ? '→' : '←'} ${esc(T(I.back, l))}</a><h1 style="margin-top:1rem">${esc(T(a.title, l))}</h1></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><article class="prose">${T(a.body, l).map((p) => `<p>${esc(p)}</p>`).join('')}</article></div></section>`;
      add(l, `insights/${a.slug}`, url(l, 'insights', a.slug), layout(l, `insights/${a.slug}`, {
        title: `${T(a.title, l)} | ${T(site.name, l)}`, desc: T(a.summary, l), body: body2, altPath: alt('insights', a.slug), ogType: 'article',
        ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: T(a.title, l), description: T(a.summary, l), inLanguage: l, author: { '@type': 'Person', name: 'Karma Shawky' }, image: `${BASE}/images/og-image.jpg` },
          breadcrumb(l, [[T(I.title, l), url(l, 'insights')], [T(a.title, l), url(l, 'insights', a.slug)]])],
      }));
    }
  }

  // FREE RESOURCES (content/resources/*.json): pages appear only when at least one resource exists
  if (resources.length) {
    const Rs = site.resources;
    const blk = (bk) => bk.type === 'list' ? `<section class="blk"><h2>${esc(T(bk.h, l))}</h2><ul>${T(bk.items, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`
      : bk.type === 'faq' ? `<section class="blk"><h2>${l === 'ar' ? 'أسئلة شائعة' : 'FAQ'}</h2>${bk.items.map((f) => `<details><summary>${esc(T(f.q, l))}</summary><p>${esc(T(f.a, l))}</p></details>`).join('')}</section>`
      : `<section class="blk"><h2>${esc(T(bk.h, l))}</h2><p>${esc(T(bk.p, l))}</p></section>`;
    const idx = `${pageHead(T(Rs.title, l), T(Rs.lead, l))}<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid3">${resources.map((r) => `<a class="tile art-card" href="${url(l, 'resources', r.slug)}"><span class="chip">${esc(T(Rs.kinds[r.kind] || Rs.kinds.guide, l))}</span><h3>${esc(T(r.title, l))}</h3><p>${esc(T(r.summary, l))}</p><p class="more" style="margin-top:.6rem">${esc(T(Rs.open, l))} ${ico.arrow}</p></a>`).join('')}</div></div></section>`;
    add(l, 'resources', url(l, 'resources'), layout(l, 'resources', { title: `${T(Rs.title, l)} | ${T(site.name, l)}`, desc: T(Rs.description, l), body: idx, altPath: alt('resources'), ld: [breadcrumb(l, [[T(Rs.title, l), url(l, 'resources')]])] }));
    for (const r of resources) {
      const ext = /^https?:/.test(r.file || '');
      const dl = r.file ? `<a class="btn" href="${esc(r.file)}"${ext ? ' target="_blank" rel="noopener"' : ' download'} data-resource="${esc(r.slug)}" data-cta="resource_download">${esc(T(Rs.download, l))} ${ico.arrow}</a>` : '';
      const body = `<section class="page-head"><div class="wrap"><a href="${url(l, 'resources')}" class="back">${l === 'ar' ? '→' : '←'} ${esc(T(Rs.back, l))}</a><p style="margin-top:1rem"><span class="chip">${esc(T(Rs.kinds[r.kind] || Rs.kinds.guide, l))}</span></p><h1>${esc(T(r.title, l))}</h1><p class="lead">${esc(T(r.summary, l))}</p><div class="cta-row">${dl}</div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap prose-wrap">${(r.blocks || []).map(blk).join('')}${dl ? `<p style="margin-top:1.6rem">${dl}</p>` : ''}</div></section>`;
      add(l, `resources/${r.slug}`, url(l, 'resources', r.slug), layout(l, `resources/${r.slug}`, { title: `${T(r.title, l)} | ${T(site.name, l)}`, desc: T(r.summary, l), body, altPath: alt('resources', r.slug), ogType: 'article',
        ld: [{ '@context': 'https://schema.org', '@type': 'CreativeWork', name: T(r.title, l), description: T(r.summary, l), inLanguage: l, isAccessibleForFree: true, author: { '@type': 'Person', name: 'Karma Shawky' } }, breadcrumb(l, [[T(Rs.title, l), url(l, 'resources')], [T(r.title, l), url(l, 'resources', r.slug)]])] }));
    }
  }

  // WORK SUB-PAGES: websites, ads, clients, references
  {
    const P = site.work.pages;
    const mk = (key, active, body, ldx) => add(l, `work/${key}`, url(l, 'work', key), layout(l, `work/${key}`, {
      title: `${T(P[key].title, l)} | ${T(site.name, l)}`, desc: T(P[key].description, l), body, altPath: alt('work', key),
      ld: [breadcrumb(l, [[T(site.work.title, l), url(l, 'work')], [T(P[key].title, l), url(l, 'work', key)]]), ...(ldx || [])],
    }));
    mk('websites', 'websites', `${pageHead(T(P.websites.title, l), T(site.work.sitesNote, l))}<div class="wrap">${subnav(l, 'websites')}</div>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid2">${websites.map((w, i) => `<a class="site-row" href="${esc(w.url)}" target="_blank" rel="noopener">${w.logo ? `<img src="${w.logo}" width="56" height="56" loading="lazy" alt="">` : `<span class="sico big" style="background:${PAL[i % PAL.length]}" aria-hidden="true">${esc(T(w.name, 'en').trim().charAt(0))}</span>`}<div><h3>${esc(T(w.name, l))}</h3><p>${esc(T(w.desc, l))}</p><small dir="ltr">${esc(w.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</small></div></a>`).join('')}</div></div></section>`);
    const shotFig = (a) => `<figure style="margin:0"><a href="${a.image}" target="_blank" rel="noopener"><img src="${a.image}" width="1200" height="700" loading="lazy" alt="${esc(T(a.alt, l))}"></a><figcaption class="cap">${esc(T(a.caption, l))}</figcaption></figure>`;
    mk('ads', 'ads', `${pageHead(T(P.ads.title, l), T(site.work.gallery.note, l))}<div class="wrap">${subnav(l, 'ads')}</div>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="gallery">${ads.filter((a) => !a.group).map(shotFig).join('')}</div></div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(site.work.reportsTitle, l))}</h2><p class="lead" style="margin-top:.6rem">${esc(T(site.work.reportsNote, l))}</p><div class="gallery">${ads.filter((a) => a.group === 'reports').map(shotFig).join('')}</div></div></section>`);
    mk('clients', 'clients', `${pageHead(T(P.clients.title, l), '')}<div class="wrap">${subnav(l, 'clients')}</div>
<section class="sec" style="padding-top:0"><div class="wrap">${site.clientGroups.map((g) => `<h3 class="grp">${esc(T(g.t, l))}</h3>${logoGrid(l, clients.filter((c) => c.group === g.id))}`).join('')}</div></section>`);
    if (refs.length) mk('references', 'references', `${pageHead(T(P.references.title, l), '')}<div class="wrap">${subnav(l, 'references')}</div>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid2">${refs.map((r) => { const c = r.clientId ? client(r.clientId) : null; return `<figure class="tile quote" style="margin:0"><blockquote>${esc(T(r.quote, l))}</blockquote><figcaption><b>${esc(r.name)}</b><br>${esc(T(r.role, l))}${c && c.logo ? `<img src="${c.logo}" width="40" height="40" loading="lazy" alt="${esc(nm(c, l))}" class="hl-logo">` : ''}<small>${esc(T(r.source, l))}</small></figcaption></figure>`; }).join('')}</div></div></section>`);
  }

  // GENERIC CONTENT: SEO pages, offers, courses (content/pages/*.json)
  {
    const blockHTML = (bk) => {
      if (bk.type === 'list') return `<section class="blk"><h2>${esc(T(bk.h, l))}</h2><ul>${T(bk.items, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
      if (bk.type === 'faq') return `<section class="blk"><h2>${l === 'ar' ? 'أسئلة شائعة' : 'FAQ'}</h2>${bk.items.map((f) => `<details><summary>${esc(T(f.q, l))}</summary><p>${esc(T(f.a, l))}</p></details>`).join('')}</section>`;
      return `<section class="blk"><h2>${esc(T(bk.h, l))}</h2><p>${esc(T(bk.p, l))}</p></section>`;
    };
    for (const p of extra) {
      const faq = p.blocks.filter((x) => x.type === 'faq').flatMap((x) => x.items);
      const body = `<section class="page-head"><div class="wrap"><h1>${esc(T(p.title, l))}</h1><p class="lead">${esc(T(p.description, l))}</p></div></section>
<section class="sec" style="padding-top:0"><div class="wrap prose-wrap">${p.blocks.map(blockHTML).join('')}${p.cta ? `<p style="margin-top:1.6rem"><a class="btn" href="${url(l, p.cta.href)}">${esc(T(p.cta.label, l))} ${ico.arrow}</a></p>` : ''}</div></section>`;
      const ld = [breadcrumb(l, [[T(p.title, l), extraUrl(l, p)]])];
      if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: T(f.q, l), acceptedAnswer: { '@type': 'Answer', text: T(f.a, l) } })) });
      if (p.type === 'course') ld.push({ '@context': 'https://schema.org', '@type': 'Course', name: T(p.title, l), description: T(p.description, l), provider: { '@type': 'Person', name: 'Karma Shawky' } });
      const altP = { ar: extraUrl('ar', p), en: extraUrl('en', p) };
      add(l, extraKey(p), extraUrl(l, p), layout(l, extraKey(p), { title: `${T(p.title, l)} | ${T(site.name, l)}`, desc: T(p.description, l), body, altPath: altP, ld }));
    }
    for (const [t, c] of Object.entries(site.collections)) {
      const list = extra.filter((p) => p.type === t);
      if (!list.length) continue;
      const body = `${pageHead(T(c.title, l), T(c.description, l))}<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid3">${list.map((p) => `<a class="tile art-card" href="${extraUrl(l, p)}"><h3>${esc(T(p.title, l))}</h3><p>${esc(T(p.description, l))}</p></a>`).join('')}</div></div></section>`;
      add(l, c.folder, url(l, c.folder), layout(l, c.folder, { title: `${T(c.title, l)} | ${T(site.name, l)}`, desc: T(c.description, l), body, altPath: alt(c.folder), ld: [breadcrumb(l, [[T(c.title, l), url(l, c.folder)]])] }));
    }
  }

  // FUNNEL PAGES
  {
    const faqHTML = (F) => `<h2>${esc(T(F.faqTitle, l))}</h2>${F.faq.map((q) => `<details><summary>${esc(T(q.q, l))}</summary><p>${esc(T(q.a, l))}</p></details>`).join('')}`;
    const fitHTML = (F) => `<div class="fit"><h3>${esc(T(F.fitYesTitle, l))}</h3><ul class="yes">${T(F.fitYes, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h3>${esc(T(F.fitNoTitle, l))}</h3><ul class="no">${T(F.fitNo, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    const bookBtn = site.booking.mode === 'calendar' && site.booking.bookingUrl ? `<a class="btn ghost" href="${esc(site.booking.bookingUrl)}" target="_blank" rel="noopener" data-booking="1" data-cta="consulting_book">${esc(T(funnels.consulting.bookLabel, l))}</a>` : '';
    const svcLD = (F, name, path) => ({ '@context': 'https://schema.org', '@type': 'Service', name: T(F.title, l), description: T(F.description, l), serviceType: name, provider: { '@type': 'Person', name: 'Karma Shawky', url: BASE + url(l) }, areaServed: ['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'], url: BASE + path, inLanguage: l });
    const faqLD = (F) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: F.faq.map((q) => ({ '@type': 'Question', name: T(q.q, l), acceptedAnswer: { '@type': 'Answer', text: T(q.a, l) } })) });

    // consulting
    {
      const F = funnels.consulting;
      const body = `<section class="page-head f-head"><div class="wrap"><p class="eyebrow">${esc(T(F.eyebrow, l))}</p><h1>${esc(T(F.h1, l))}</h1><p class="lead">${esc(T(F.lead, l))}</p>
<div class="cta-row"><a class="btn" href="#request" data-cta="consulting_request">${esc(T(F.formTitle, l))} ${ico.arrow}</a>${bookBtn}</div></div></section>
<section class="sec" style="padding-top:1rem"><div class="wrap"><h2 class="sec-title">${esc(T(F.offersTitle, l))}</h2>
  <div class="offers">${F.offers.map((o) => `<article class="offer"><h3>${esc(T(o.t, l))}</h3><p class="for"><b>${esc(T(F.forLabel, l))}</b> ${esc(T(o.for, l))}</p><p class="get-h"><b>${esc(T(F.getLabel, l))}</b></p><ul>${T(o.get, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><a class="btn ghost sm" href="${o.service === 'Marketing Audit' ? url(l, 'audit') : '#request'}" data-service="${esc(o.service)}" data-cta="consulting_offer">${esc(T(F.formTitle, l))}</a></article>`).join('')}</div>
  <p class="note">${esc(T(F.offersNote, l))}</p></div></section>
<section class="sec alt"><div class="wrap two-col"><div><h2 class="sec-title">${esc(T(F.processTitle, l))}</h2><ol class="steps">${T(F.process, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>${fitHTML(F)}</div></section>
<section class="sec"><div class="wrap prose-wrap">${faqHTML(F)}</div></section>
<section class="sec alt" id="request"><div class="wrap form-wrap"><div><h2 class="sec-title">${esc(T(F.formTitle, l))}</h2><p class="lead">${esc(T(F.formLead, l))}</p></div>${formHTML(l, { id: 'consulting-form', type: 'consulting' })}</div></section>`;
      const p = url(l, 'consulting');
      add(l, 'consulting', p, layout(l, 'consulting', { title: `${T(F.title, l)} | ${T(site.name, l)}`, desc: T(F.description, l), body, altPath: alt('consulting'), ld: [svcLD(F, 'Marketing consulting', p), faqLD(F), breadcrumb(l, [[T(site.nav.consulting, l), p]])] }));
    }
    // management
    {
      const F = funnels.management;
      const body = `<section class="page-head f-head"><div class="wrap"><p class="eyebrow">${esc(T(F.eyebrow, l))}</p><h1>${esc(T(F.h1, l))}</h1><p class="lead">${esc(T(F.lead, l))}</p>
<div class="cta-row"><a class="btn" href="#request" data-cta="management_request">${esc(T(F.formTitle, l))} ${ico.arrow}</a><a class="btn ghost" href="${url(l, 'proposal')}" data-cta="management_proposal">${esc(T(site.home.ctaProposal, l))}</a></div></div></section>
<section class="sec" style="padding-top:1rem"><div class="wrap"><h2 class="sec-title">${esc(T(F.scopeTitle, l))}</h2>
  <div class="grid3 scope">${F.scope.map((s) => `<div class="tile"><h3>${esc(T(s.t, l))}</h3><p>${esc(T(s.d, l))}</p></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(F.processTitle, l))}</h2><ol class="rhythm">${F.rhythm.map((s) => `<li><b>${esc(T(s.t, l))}</b><span>${esc(T(s.d, l))}</span></li>`).join('')}</ol>
  <div class="two-col" style="margin-top:2rem"><div><h3>${esc(T(F.termsTitle, l))}</h3><ul class="plain big">${T(F.terms, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>${fitHTML(F)}</div></div></section>
<section class="sec"><div class="wrap prose-wrap">${faqHTML(F)}</div></section>
<section class="sec alt" id="request"><div class="wrap form-wrap"><div><h2 class="sec-title">${esc(T(F.formTitle, l))}</h2><p class="lead">${esc(T(F.formLead, l))}</p></div>${formHTML(l, { id: 'management-form', type: 'management' })}</div></section>`;
      const p = url(l, 'marketing-management');
      add(l, 'marketing-management', p, layout(l, 'marketing-management', { title: `${T(F.title, l)} | ${T(site.name, l)}`, desc: T(F.description, l), body, altPath: alt('marketing-management'), ld: [svcLD(F, 'Monthly marketing management', p), faqLD(F), breadcrumb(l, [[T(site.nav.management, l), p]])] }));
    }
    // thank you
    {
      const Th = site.thanks;
      const types = ['consultation', 'audit', 'proposal', 'consulting', 'management', 'general'];
      const body = `<section class="page-head"><div class="wrap" data-thanks="1"><h1>${esc(T(Th.title, l))}</h1>
${types.map((t) => `<div class="thx" data-type="${t}"${t === 'general' ? '' : ' hidden'}><p class="lead">${esc(T(Th.lead[t], l))}</p><h2 class="h3">${esc(T(Th.next, l))}</h2><ol class="steps">${T(Th.steps[t], l).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>`).join('')}
<p class="form-hint" style="margin-top:1rem">${esc(T(Th.hint, l))}</p><p class="ref" hidden>${esc(T(Th.ref, l))}: <b id="thx-ref"></b></p>
<div class="cta-row"><a class="btn" id="thx-wa" href="#" hidden data-whatsapp="1" data-cta="thanks_whatsapp">${esc(T(Th.wa, l))}</a>${site.booking.mode === 'calendar' && site.booking.bookingUrl ? `<a class="btn ghost" id="thx-book" href="${esc(site.booking.bookingUrl)}" target="_blank" rel="noopener" data-booking="1" data-cta="thanks_book" hidden>${esc(T(Th.book, l))}</a>` : ''}<a class="btn ghost" href="${url(l)}">${esc(T(Th.home, l))}</a></div></div></section>`;
      add(l, 'thank-you', url(l, 'thank-you'), layout(l, 'thank-you', { title: `${T(Th.title, l)} | ${T(site.name, l)}`, desc: T(Th.description, l), body, altPath: alt('thank-you'), noindex: true }));
    }
    // privacy
    {
      const Pv = site.privacy;
      const body = `${pageHead(T(Pv.title, l), T(Pv.updated, l))}<section class="sec" style="padding-top:0"><div class="wrap prose-wrap">${Pv.blocks.map((x) => `<section class="blk"><h2>${esc(T(x.h, l))}</h2><p>${esc(T(x.p, l))}</p></section>`).join('')}${site.links.email ? `<p><a href="mailto:${esc(site.links.email)}">${esc(site.links.email)}</a></p>` : ''}</div></section>`;
      add(l, 'privacy', url(l, 'privacy'), layout(l, 'privacy', { title: `${T(Pv.title, l)} | ${T(site.name, l)}`, desc: T(Pv.description, l), body, altPath: alt('privacy'), ld: [breadcrumb(l, [[T(Pv.title, l), url(l, 'privacy')]])] }));
    }
  }

  // CONTACT
  {
    const C = site.contact, L = site.links;
    const direct = [
      L.email && `<a href="mailto:${esc(L.email)}" data-contact="email">${esc(L.email)}</a>`,
      L.whatsapp && `<a href="${waHref()}" rel="noopener" target="_blank" data-whatsapp="1" data-cta="contact_whatsapp">WhatsApp</a>`,
      L.hub && `<a href="${esc(L.hub)}" rel="noopener" target="_blank">${l === 'ar' ? 'كل روابطي' : 'All my links'}</a>`,
    ].filter(Boolean).join(' · ');
    const body = `${pageHead(T(C.title, l), T(C.lead, l))}
<section class="sec" style="padding-top:0"><div class="wrap two">
  <div>
    <p class="lead" style="margin-bottom:1rem">${esc(T(C.sub, l))}</p>
    ${direct ? `<p class="direct"><b>${direct}</b></p>` : ''}
    ${formHTML(l, { id: 'contact-form', type: 'general', selectable: true })}
  </div>
  <img src="/images/karma-contact.webp" width="760" height="900" alt="${esc(T(C.photoAlt, l))}" loading="lazy">
</div></section>`;
    add(l, 'contact', url(l, 'contact'), layout(l, 'contact', {
      title: `${T(C.title, l)} | ${T(site.name, l)}`, desc: T(C.description, l), body, altPath: alt('contact'),
      ld: [breadcrumb(l, [[T(C.title, l), url(l, 'contact')]])],
    }));
  }

  // BOOK, AUDIT, PROPOSAL: three distinct conversion paths
  {
    const bk = site.booking;
    const svcLD = (F, name, p) => ({ '@context': 'https://schema.org', '@type': 'Service', name: T(F.title, l), description: T(F.description, l), serviceType: name, provider: { '@type': 'Person', name: 'Karma Shawky', url: BASE + url(l) }, areaServed: ['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'], url: BASE + p, inLanguage: l });
    const faqLD = (F) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: F.faq.map((q) => ({ '@type': 'Question', name: T(q.q, l), acceptedAnswer: { '@type': 'Answer', text: T(q.a, l) } })) });
    const head = (F, ctaLabel, ctaId, extra = '') => `<section class="page-head f-head"><div class="wrap"><p class="eyebrow">${esc(T(F.eyebrow, l))}</p><h1>${esc(T(F.h1, l))}</h1><p class="lead">${esc(T(F.lead, l))}</p><div class="cta-row"><a class="btn" href="#request" data-cta="${ctaId}">${esc(ctaLabel)} ${ico.arrow}</a>${extra}</div></div></section>`;
    const formSec = (F, id, type) => `<section class="sec alt" id="request"><div class="wrap form-wrap"><div><h2 class="sec-title">${esc(T(F.formTitle, l))}</h2><p class="lead">${esc(T(F.formLead, l))}</p></div>${formHTML(l, { id, type })}</div></section>`;

    // book a consultation
    {
      const F = funnels.book;
      const calBtn = bk.mode === 'calendar' && bk.bookingUrl ? `<a class="btn ghost" href="${esc(bk.bookingUrl)}" target="_blank" rel="noopener" data-booking="1" data-cta="book_calendar">${esc(T(F.calendar, l))}</a>` : '';
      const payBtn = bk.mode === 'paid' && bk.paymentUrl ? `<a class="btn ghost" href="${esc(bk.paymentUrl)}" target="_blank" rel="noopener" data-booking="1" data-cta="book_pay">${esc(T(site.book.btnPaid, l))}</a>` : '';
      const body = `${head(F, T(F.formTitle, l), 'book_request', calBtn + payBtn)}
<section class="sec" style="padding-top:1rem"><div class="wrap two-col"><div><h2 class="sec-title">${esc(T(F.bringTitle, l))}</h2>${ulPlain(F.bring, l)}</div><div><h2 class="sec-title">${esc(T(F.processTitle, l))}</h2><ol class="steps">${T(F.process, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div></div></section>
${formSec(F, 'consultation-form', 'consultation')}`;
      const p = url(l, 'book');
      add(l, 'book', p, layout(l, 'book', { title: `${T(F.title, l)} | ${T(site.name, l)}`, desc: T(F.description, l), body, altPath: alt('book'), ld: [svcLD(F, 'Marketing consultation', p), breadcrumb(l, [[T(site.nav.cta, l), p]])] }));
    }
    // marketing audit
    {
      const F = funnels.audit;
      const body = `${head(F, T(F.formTitle, l), 'audit_request')}
<section class="sec" style="padding-top:1rem"><div class="wrap two-col"><div><h2 class="sec-title">${esc(T(F.reviewTitle, l))}</h2><ul class="rv">${F.review.map((r) => `<li><b>${esc(T(r.t, l))}</b><span>${esc(T(r.d, l))}</span></li>`).join('')}</ul></div>
  <div><h3>${esc(T(F.getTitle, l))}</h3>${ulPlain(F.get, l)}<h3>${esc(T(F.needTitle, l))}</h3>${ulPlain(F.need, l)}<p class="note">${esc(T(F.note, l))}</p></div></div></section>
<section class="sec alt"><div class="wrap"><h2 class="sec-title">${esc(T(F.processTitle, l))}</h2><ol class="steps">${T(F.process, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div></section>
<section class="sec"><div class="wrap prose-wrap">${faqBlock(F, l)}</div></section>
${formSec(F, 'audit-form', 'audit')}`;
      const p = url(l, 'audit');
      add(l, 'audit', p, layout(l, 'audit', { title: `${T(F.title, l)} | ${T(site.name, l)}`, desc: T(F.description, l), body, altPath: alt('audit'), ld: [svcLD(F, 'Marketing audit', p), faqLD(F), breadcrumb(l, [[T(F.eyebrow, l), p]])] }));
    }
    // custom proposal
    {
      const F = funnels.proposal;
      const body = `${head(F, T(F.formTitle, l), 'proposal_request')}
<section class="sec" style="padding-top:1rem"><div class="wrap two-col"><div><h2 class="sec-title">${esc(T(F.whenTitle, l))}</h2>${ulPlain(F.when, l)}</div><div><h2 class="sec-title">${esc(T(F.processTitle, l))}</h2><ol class="steps">${T(F.process, l).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div></div></section>
<section class="sec alt"><div class="wrap prose-wrap">${faqBlock(F, l)}</div></section>
${formSec(F, 'proposal-form', 'proposal')}`;
      const p = url(l, 'proposal');
      add(l, 'proposal', p, layout(l, 'proposal', { title: `${T(F.title, l)} | ${T(site.name, l)}`, desc: T(F.description, l), body, altPath: alt('proposal'), ld: [svcLD(F, 'Custom marketing proposal', p), faqLD(F), breadcrumb(l, [[T(F.eyebrow, l), p]])] }));
    }
  }
}

// ---------- write ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const copy = (a, b) => fs.cpSync(path.join(ROOT, a), path.join(DIST, b), { recursive: true });
copy('src/assets', 'assets');
copy('public/images', 'images');
if (fs.existsSync(path.join(ROOT, 'public/files'))) copy('public/files', 'files');
if (fs.existsSync(path.join(ROOT, 'public/root'))) fs.cpSync(path.join(ROOT, 'public/root'), DIST, { recursive: true });

for (const p of pages) {
  const dir = path.join(DIST, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), p.html);
}

// root: language redirect (default language from site.json; Arabic browsers go to /ar/)
const d = site.defaultLang;
fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html><html lang="${d}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(T(site.home.title, d))}</title>
<link rel="canonical" href="${BASE}/${d}/"><link rel="alternate" hreflang="ar" href="${BASE}/ar/"><link rel="alternate" hreflang="en" href="${BASE}/en/"><link rel="alternate" hreflang="x-default" href="${BASE}/${d}/">
<meta http-equiv="refresh" content="0;url=/${d}/"><script>var l=(navigator.language||'').slice(0,2)==='en'?'en':'${d}';try{var s=localStorage.getItem('ks-lang');if(s)l=s}catch(e){}location.replace('/'+l+'/')</script></head>
<body><a href="/ar/">العربية</a> · <a href="/en/">English</a></body></html>`);

// 404
const nf = (l) => `<section class="nf"><div class="wrap"><h1>404</h1><p class="lead" style="margin-inline:auto">${esc(T(site.ui.notFoundText, l))}</p><p><a class="btn" href="${url(l)}">${esc(T(site.ui.home, l))}</a></p></div></section>`;
fs.writeFileSync(path.join(DIST, '404.html'), layout('ar', '404', { title: T(site.ui.notFoundTitle, 'ar'), desc: T(site.ui.notFoundText, 'ar'), body: nf('ar'), altPath: { ar: '/ar/', en: '/en/' }, noindex: true }));

// sitemap with hreflang
const keys = [...new Set(pages.map((p) => p.key))].filter((k) => k !== 'thank-you');
const loc = (l, k) => `${BASE}${k === 'home' ? url(l) : url(l, ...k.split('/'))}`;
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${keys.flatMap((k) => LANGS.map((l) => `<url><loc>${loc(l, k)}</loc><lastmod>${today}</lastmod>${LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${x}" href="${loc(x, k)}"/>`).join('')}</url>`)).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({ name: 'Karma Shawky', short_name: 'Karma', start_url: '/', display: 'standalone', background_color: '#F4E9D6', theme_color: '#F4E9D6', icons: [{ src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
// Hostinger / Apache: clean URLs, 404 page, caching, compression
fs.writeFileSync(path.join(DIST, '.htaccess'), `ErrorDocument 404 /404.html
DirectoryIndex index.html
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/webp "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
</IfModule>
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
`);
console.log(`built ${pages.length} pages + root/404/sitemap/robots → dist/`);

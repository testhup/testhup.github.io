(function () {
  'use strict';
  var d = document, w = window;
  var KS = w.KS || {};
  var LOADED = Date.now();

  /* ---------- storage helpers (never throw) ---------- */
  function sget(k, session) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
  function sset(k, v, session) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }

  /* ---------- analytics: dataLayer + gtag, always safe ---------- */
  w.__ksEvents = w.__ksEvents || [];
  function track(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    params.language = KS.lang;
    w.__ksEvents.push({ name: name, params: params });
    try {
      w.dataLayer = w.dataLayer || [];
      var o = { event: name }; for (var k in params) o[k] = params[k];
      w.dataLayer.push(o);
      if (typeof w.gtag === 'function' && KS.ga4) w.gtag('event', name, params);
      if (typeof w.fbq === 'function' && KS.px) {
        if (name === 'generate_lead') w.fbq('track', 'Lead', { content_name: params.lead_type || '', content_category: params.service || '' });
        else if (name === 'whatsapp_click') w.fbq('trackCustom', 'WhatsAppClick', { cta: params.cta || '' });
        else if (name === 'booking_click') w.fbq('track', 'Schedule');
      }
    } catch (e) {}
  }
  w.ksTrack = track;

  /* ---------- consent (only shown when analytics is configured) ---------- */
  var bar = d.getElementById('consent');
  function applyConsent(v) {
    if (typeof w.gtag === 'function' && KS.ga4) {
      w.gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' });
    }
    if (typeof w.fbq === 'function' && KS.px) w.fbq('consent', v === 'granted' ? 'grant' : 'revoke');
  }
  if (bar) {
    var saved = sget('ks_consent');
    if (saved) applyConsent(saved); else bar.hidden = false;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      var v = b.getAttribute('data-consent') === 'accept' ? 'granted' : 'denied';
      sset('ks_consent', v); applyConsent(v); bar.hidden = true;
    });
  }

  /* ---------- attribution: first and last touch ---------- */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  function readTouch() {
    var q = new URLSearchParams(location.search), t = {}, has = false;
    KEYS.forEach(function (k) { var v = q.get(k); if (v) { t[k] = v.slice(0, 200); has = true; } });
    var ref = '';
    try { if (d.referrer) { var u = new URL(d.referrer); if (u.hostname !== location.hostname) ref = u.hostname; } } catch (e) {}
    if (ref) t.referrer = ref;
    if (has || ref) { t.landing = location.pathname; t.ts = new Date().toISOString(); return t; }
    return null;
  }
  var touch = readTouch();
  if (touch) {
    sset('ks_last', JSON.stringify(touch));
    if (!sget('ks_first')) sset('ks_first', JSON.stringify(touch));
  }
  if (!sget('ks_first')) sset('ks_first', JSON.stringify({ landing: location.pathname, ts: new Date().toISOString(), direct: true }));
  function parse(k) { try { return JSON.parse(sget(k) || 'null') || {}; } catch (e) { return {}; } }
  var FIRST = parse('ks_first'), LAST = parse('ks_last');
  var REF = sget('ks_ref', true);
  if (!REF) { REF = 'KS-' + Date.now().toString(36).toUpperCase().slice(-6); sset('ks_ref', REF, true); }

  /* ---------- nav + dropdowns + theme ---------- */
  var burger = d.querySelector('.burger'), nav = d.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  function closeDD(except) {
    d.querySelectorAll('.dd-btn[aria-expanded="true"]').forEach(function (b) { if (b !== except) b.setAttribute('aria-expanded', 'false'); });
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('.dd-btn');
    if (b) { var o = b.getAttribute('aria-expanded') === 'true'; closeDD(b); b.setAttribute('aria-expanded', o ? 'false' : 'true'); return; }
    if (!e.target.closest('.dd')) closeDD();
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDD(); });
  var themeBtn = d.getElementById('theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = d.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      d.documentElement.setAttribute('data-theme', next); sset('ks-theme', next);
    });
  }

  /* ---------- click tracking ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a,button');
    if (!a) return;
    var cta = a.getAttribute('data-cta');
    if (cta) track('cta_click', { cta: cta });
    if (a.getAttribute('data-track') === 'language_switch') { sset('ks-lang', a.getAttribute('data-lang') || ''); track('language_switch', { to: a.getAttribute('data-lang') }); }
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-whatsapp') || /^https:\/\/wa\.me\//.test(href)) track('whatsapp_click', { cta: cta || 'whatsapp', ref_id: REF });
    if (a.hasAttribute('data-booking')) track('booking_click', { cta: cta || 'booking' });
    if (/^mailto:/.test(href)) track('contact_click', { method: 'email' });
    if (/^tel:/.test(href)) track('contact_click', { method: 'phone' });
    var rs = a.getAttribute('data-resource');
    if (rs) track('resource_download', { resource: rs });
    var svc = a.getAttribute('data-service');
    if (svc) { var s = d.querySelector('#consulting-form [name="service"]'); if (s) s.value = svc; }
  });

  /* ---------- WhatsApp links: pre-filled message with a reference code ---------- */
  function waType() {
    var p = location.pathname;
    if (p.indexOf('/consulting') > -1) return 'consulting';
    if (p.indexOf('/marketing-management') > -1) return 'management';
    if (p.indexOf('/audit') > -1) return 'audit';
    if (p.indexOf('/proposal') > -1) return 'proposal';
    if (p.indexOf('/book') > -1) return 'consultation';
    return 'general';
  }
  function waLink(type) {
    if (!KS.wa) return '';
    var t = (KS.waText && KS.waText[type || waType()]) || '';
    return 'https://wa.me/' + KS.wa + '?text=' + encodeURIComponent(t + ' (' + KS.refLabel + ': ' + REF + ')');
  }
  d.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (a) { a.setAttribute('href', waLink()); });

  /* ---------- forms ---------- */
  function showFor(form) {
    var type = (form.elements.lead_type && form.elements.lead_type.value) || form.getAttribute('data-default-type');
    form.querySelectorAll('[data-for]').forEach(function (g) {
      var on = g.getAttribute('data-for').split(' ').indexOf(type) > -1;
      g.hidden = !on;
      g.querySelectorAll('input,select,textarea').forEach(function (el) { el.disabled = !on; });
    });
    form.querySelectorAll('[data-req-for]').forEach(function (el) {
      el.required = !el.disabled && el.getAttribute('data-req-for').split(' ').indexOf(type) > -1;
      var lb = form.querySelector('label[for="' + el.id + '"] .req');
      if (lb) lb.hidden = !el.required;
    });
  }
  function setErr(form, name, msg) {
    var el = d.getElementById(form.id + '-' + name + '-err');
    var inp = form.elements[name];
    if (el) el.textContent = msg || '';
    if (inp && inp.setAttribute) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
  }
  function validate(form) {
    var ok = true, first = null, e = KS.err || {};
    Array.prototype.forEach.call(form.elements, function (inp) {
      var n = inp.name;
      if (!n || n === 'hp_url' || inp.type === 'hidden' || inp.type === 'submit' || inp.tagName === 'BUTTON') return;
      if (inp.disabled) { setErr(form, n, ''); return; }
      var msg = '', v = (inp.type === 'checkbox' ? (inp.checked ? 'y' : '') : (inp.value || '').trim());
      if (inp.required && !v) msg = n === 'consent' ? e.consent : e.required;
      else if (n === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = e.email;
      else if (n === 'whatsapp' && v && !/^\+?[0-9\s\-]{7,18}$/.test(v)) msg = e.whatsapp;
      else if (n === 'message' && v && v.length < 10) msg = e.required;
      setErr(form, n, msg);
      if (msg) { ok = false; if (!first) first = inp; }
    });
    if (first) first.focus();
    return ok;
  }
  function payload(form) {
    var o = {}, fd = new FormData(form);
    fd.forEach(function (v, k) { if (k !== 'hp_url' && k !== 'consent') o[k] = typeof v === 'string' ? v.trim() : v; });
    o.consent = 'yes';
    o.ref_id = REF;
    o.language = KS.lang;
    o.page_path = location.pathname;
    o.page_title = d.title;
    o.form_id = form.id;
    o.submitted_at = new Date().toISOString();
    KEYS.forEach(function (k) { o[k] = (LAST[k] || FIRST[k] || ''); });
    o.referrer = LAST.referrer || FIRST.referrer || '';
    o.landing_page = LAST.landing || FIRST.landing || '';
    o.first_touch_source = FIRST.utm_source || FIRST.referrer || (FIRST.direct ? 'direct' : '');
    o.first_touch_medium = FIRST.utm_medium || '';
    o.first_touch_campaign = FIRST.utm_campaign || '';
    o.first_touch_landing = FIRST.landing || '';
    o.user_agent = navigator.userAgent.slice(0, 200);
    return o;
  }
  function post(url, data, json) {
    var ctl = ('AbortController' in w) ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : null;
    var opts = { method: 'POST', body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined };
    if (json) opts.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    else { opts.mode = 'no-cors'; opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' }; }
    return fetch(url, opts).then(function (r) { if (t) clearTimeout(t); return r; }, function (err) { if (t) clearTimeout(t); throw err; });
  }
  function buildMessage(form, type, data) {
    var lines = [], title = (KS.typeLabels && KS.typeLabels[type]) || type, skip = { lead_type: 1, consent: 1, hp_url: 1 };
    lines.push('*' + title + '*');
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || skip[el.name] || el.disabled || el.type === 'hidden' || el.type === 'submit' || el.tagName === 'BUTTON') return;
      var v = el.tagName === 'SELECT' ? (el.selectedIndex > -1 ? el.options[el.selectedIndex].text : '') : (el.value || '');
      v = v.trim(); if (!v) return;
      if (el.name === 'message' && v.length > 700) v = v.slice(0, 700) + '…';
      var lb = form.querySelector('label[for="' + el.id + '"]');
      var t = lb ? lb.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').replace(/\(.*?\)/g, '').trim() : el.name;
      lines.push(t + ': ' + v);
    });
    var src = [data.utm_source || data.referrer, data.utm_medium, data.utm_campaign].filter(Boolean).join(' / ');
    lines.push('');
    lines.push(KS.refLabel + ': ' + REF + (src ? ' | ' + src : ''));
    return lines.join('\n');
  }
  d.querySelectorAll('form.lead-form').forEach(function (form) {
    var started = false, btn = form.querySelector('button[type="submit"]'), status = form.querySelector('.form-status');
    showFor(form);
    var qType = new URLSearchParams(location.search).get('type');
    var sel = form.elements.lead_type && form.elements.lead_type.tagName === 'SELECT' ? form.elements.lead_type : null;
    if (sel && qType && /^(general|consultation|audit|proposal|consulting|management)$/.test(qType)) { sel.value = qType; showFor(form); }
    if (sel) sel.addEventListener('change', function () { showFor(form); });
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start', { form_id: form.id, lead_type: form.elements.lead_type.value }); } });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      status.textContent = ''; status.className = 'form-status';
      if (form.elements.hp_url && form.elements.hp_url.value) return; /* bot */
      if (Date.now() - LOADED < 2500) { status.textContent = (KS.err || {}).network || ''; status.className = 'form-status bad'; return; }
      if (!validate(form)) { track('form_error', { form_id: form.id }); return; }
      if (!KS.wa && !KS.endpoint) { status.textContent = (KS.err || {}).unconfigured || ''; status.className = 'form-status bad'; track('form_error', { form_id: form.id, reason: 'unconfigured' }); return; }
      var data = payload(form), type = data.lead_type || 'general';
      btn.disabled = true; btn.textContent = btn.getAttribute('data-sending');
      var link = '';
      if (KS.wa) {
        link = 'https://wa.me/' + KS.wa + '?text=' + encodeURIComponent(buildMessage(form, type, data));
        sset('ks_wa_link', link, true);
      }
      /* optional extra copy to a form endpoint, never blocks the WhatsApp step */
      if (KS.endpoint) { try { post(KS.endpoint, data, true)['catch'](function () {}); } catch (e) {} }
      track('generate_lead', { lead_type: type, form_id: form.id, ref_id: data.ref_id, service: data.service || '', country: data.country || '', utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign, method: 'whatsapp' });
      if (link) { try { w.open(link, '_blank'); } catch (e) {} }
      setTimeout(function () { location.href = KS.thanks + '?type=' + encodeURIComponent(type) + '&ref=' + encodeURIComponent(data.ref_id); }, 400);
    });
  });

  /* ---------- thank-you page ---------- */
  var thx = d.querySelector('[data-thanks]');
  if (thx) {
    var q = new URLSearchParams(location.search), type = q.get('type'), ref = q.get('ref') || REF;
    if (!/^(general|consultation|audit|proposal|consulting|management)$/.test(type || '')) type = 'general';
    thx.querySelectorAll('.thx').forEach(function (el) { el.hidden = el.getAttribute('data-type') !== type; });
    var refEl = d.getElementById('thx-ref');
    if (refEl) { refEl.textContent = ref.replace(/[^A-Za-z0-9\-]/g, '').slice(0, 20); refEl.parentNode.hidden = false; }
    var wa = d.getElementById('thx-wa');
    if (wa && KS.wa) { wa.href = sget('ks_wa_link', true) || waLink(type); wa.hidden = false; wa.setAttribute('target', '_blank'); wa.setAttribute('rel', 'noopener'); }
    var bk = d.getElementById('thx-book');
    if (bk && type === 'consulting') bk.hidden = false;
    if (!sget('ks_thx_' + ref, true)) { sset('ks_thx_' + ref, '1', true); track('thank_you_view', { lead_type: type, ref_id: ref }); }
  }
})();

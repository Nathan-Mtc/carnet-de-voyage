// ================= 99 · QUÊTES › HISTOIRE : LA ROUTE D'AUGUSTINE (v100) =================
// Le joueur (19/11) : « ce n'est pas stimulant ». Avant : un conseil et une carte de chapitre qui disaient la même chose,
// un pavé de texte, « 2/6 % » illisible, des listes plates (pages, régions), et des récompenses sans rapport avec l'histoire.
// Maintenant : 1. la route dessinée (étapes faites tamponnées, étape en cours qui pulse, suivantes en « ? ») ;
// 2. une seule carte d'action (jauge avec le palier, la récompense affichée, un bouton) ; 3. rien d'autre.
const rt$ = (f, d) => { try { return f(); } catch (e) { return d; } };
// ce que rapporte chaque type d'étape (les vraies récompenses de l'histoire)
const RT_GAIN = {
  region: ['⚡ Trajets −15 % dans la région', '🗺️ Les régions voisines s’ouvrent', '📖 Un indice d’Augustine'],
  clue: ['⛺ Un camp de base', '🪤 Une recette d’appât', '🧭 La suite de sa route'],
  herbo: ['🥚 Un nouveau compagnon'], couv: ['🥚 Un nouveau compagnon'],
  hab: ['📜 Le plan d’un équipement'], forge: ['🎒 L’équipement pour traverser'],
  passage: ['🌍 Une nouvelle région', '📖 Le chapitre suivant'], read: ['📖 Le début de l’histoire'], map: ['🎒 De quoi satisfaire vos clients'],
};
function rtStops() {
  const s = sctSt(), home = rt$(() => rgHome().id, ''), P = akStep(), out = [];
  out.push({ k: 'home', ico: '⌂', nm: rt$(() => S.home, '') || 'Chez vous', sub: 'Chez vous', st: 'done', page: 1 });
  Object.entries(s.camp || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).forEach(([id]) => { if (RG[id]) out.push({ k: 'camp', ico: '⛺', nm: RG[id].short, sub: sctStars(sctLvl(id)), st: 'done', reg: id }); });
  let cur = P && P.C.reg && !augHasCamp(P.C.reg) ? P.C.reg : !augHasCamp(home) ? home : null, lock = false;
  if (!cur) { const last = out.filter(x => x.reg).pop(), N = last && augNext(last.reg); if (N) { cur = N.id; lock = !rcIsOpen(N.id); } }
  if (cur && RG[cur]) out.push({ k: 'cur', ico: lock ? '🔒' : '📍', nm: RG[cur].short, sub: lock ? 'à atteindre' : sctStars(sctLvl(cur)), st: 'cur', reg: cur });
  const left = Math.max(0, REGIONS.filter(R => rt$(() => rcOk(R), false)).length - out.length + 1);
  for (let i = 0; i < Math.min(3, left); i++) out.push({ k: 'q', ico: '?', nm: '???', sub: '', st: 'next' });
  return { out, left };
}
function rtRouteHTML() {
  const { out, left } = rtStops(), k = S.sel;
  const stop = x => `<li class="rt-s rt-${x.st}"${x.reg ? ` data-rtreg="${x.reg}"` : x.page ? ' data-cnpage="1"' : ''}><span class="rt-st">${x.st === 'cur' && k ? `<img src="${rt$(() => portraitURI(k), '')}" alt="">` : ''}<b>${x.ico}</b></span><span class="rt-n">${esc(x.nm)}</span>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</li>`;
  return `<div class="rt-map"><p class="rt-k">La route d’Augustine</p><ol class="rt-route">${out.map(stop).join('')}</ol>${left > 3 ? `<p class="rt-more">… et encore ${left} régions où elle est passée</p>` : ''}</div>`;
}
function rtCardHTML() {
  const s = akSt(), P = akStep(); if (!P && !s.newPage) return '';
  if (s.newPage) return `<div class="rt-card"><p class="rt-ck">Chapitre ${s.newPage} · ${esc(akChap(s.newPage).nm)}</p><h3>Une nouvelle page du carnet !</h3><button class="btn green big wide" data-cngo="1">Lire la page</button></div>`;
  const st = P.st, go = st.go || 'map', ct = akVal(st.ct);
  let gauge = '';
  if (go === 'region') {
    const id = P.C.reg || rt$(() => rgHome().id, ''), I = rt$(() => sctInfo(id), null);
    if (I) { const goal = I.th[1], f = Math.min(1, I.pct / Math.max(1, goal)); gauge = `<div class="rt-g"><i style="width:${Math.round(f * 100)}%"></i><span class="rt-gm" style="left:100%"></span></div><p class="rt-gt"><b>${I.pct} %</b> de ${esc(RG[id].short)} découvert → <b>Habitué à ${goal} %</b></p>`; }
  } else if (ct) gauge = `<p class="rt-gt"><b>${esc(ct)}</b></p>`;
  const gains = (RT_GAIN[go] || []).map(g => `<li>${esc(g)}</li>`).join('');
  const btn = go === 'region' ? `<button class="btn green big wide" data-rtgo="brume">Où aller ?</button>` : `<button class="btn green big wide" data-cngo="1">${esc(st.btn || 'Y aller')}</button>`;
  return `<div class="rt-card"><p class="rt-ck">Chapitre ${P.n} · ${esc(P.C.nm)}</p><h3>${esc(akVal(st.tx))}</h3>${gauge}${gains ? `<p class="rt-gk">🎁 À la clé</p><ul class="rt-gain">${gains}</ul>` : ''}${btn}</div>`;
}
function rtPagesHTML() {
  const s = akSt(), n = s.ch, L = []; for (let i = 1; i <= n; i++) if (i < n || s.read[i]) L.push(i);
  if (!L.length) return '';
  return `<p class="rt-pages">📔 Relire le carnet : ${L.map(i => `<button class="rt-pg" data-cnpage="${i}">${i}</button>`).join('')}</p>`;
}
if (typeof QM_HTML !== 'undefined') QM_HTML.hist = function () { return rt$(rtRouteHTML, '') + rt$(rtCardHTML, '') + rt$(rtPagesHTML, ''); };
// pas de doublon : le conseil du moment et la vitrine « Ce qu'on peut gagner » disparaissent de l'onglet Histoire
if (typeof qtPageHTML === 'function') qtPageHTML = (orig => function () {
  let h = orig.apply(this, arguments);
  rt$(() => {
    if (qmTab !== 'hist') return;
    const a = h.indexOf('<div class="cs-adv'), b = h.indexOf('<nav class="qm-tabs"'); if (a >= 0 && b > a) h = h.slice(0, a) + h.slice(b);
    h = h.replace(/<details class="md-win qm-hist">[\s\S]*?<\/details>/, '');
  });
  return h;
})(qtPageHTML);
// « Où aller ? » (et « Voir » sur l'étape de découverte) : la vue Monde, où l'on voit la brume de la région
function rtBrume() {
  rt$(() => { $('modal').hidden = true; }); rt$(() => { if (tab !== 'carte') { tab = 'carte'; renderPanel(); } }); rt$(() => vwGo('monde'));
  rt$(() => toast('Les zones blanches sont dans la brume : envoyez un compagnon vers un lieu là-bas.'));
}
rt$(() => { akGo.region = rtBrume; });
// la page Quêtes s'ouvre toujours sur Histoire (sauf si un bouton demande un autre onglet juste avant)
if (typeof qtOpenPage === 'function') qtOpenPage = (orig => function () {
  const want = qmTab || 'hist'; const r = orig.apply(this, arguments);
  if (qmTab !== want) rt$(() => qmShow(want));
  return r;
})(qtOpenPage);
document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('.qm-page [data-closemodal]')) rt$(() => { qmTab = 'hist'; }); }, true);
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-rtgo],[data-rtreg]'); if (!t) return;
  ev.stopPropagation(); ev.preventDefault();
  if (t.dataset.rtreg) { const id = t.dataset.rtreg; if (augHasCamp(id)) return augCampPage(id); rt$(() => { $('modal').hidden = true; }); return sctCard(id); }
  rtBrume();
}, true);

{
  const css = document.createElement('style');
  css.textContent = `
.rt-map{position:relative;margin:0 0 10px;padding:10px 8px 8px;border-radius:14px;background:repeating-linear-gradient(#f8efdc 0 23px,#ecdcbc 23px 24px);box-shadow:inset 0 0 0 1.5px rgba(120,88,52,.25)}
.rt-k{margin:0 4px 6px;font:700 20px 'Caveat',cursive;color:#7a5238}
.rt-route{list-style:none;margin:0;padding:6px 2px 2px;display:flex;gap:0;overflow-x:auto;scrollbar-width:none}
.rt-route::-webkit-scrollbar{display:none}
.rt-s{position:relative;flex:none;width:76px;display:flex;flex-direction:column;align-items:center;text-align:center;cursor:pointer}
.rt-s:not(:last-child)::after{content:'';position:absolute;top:27px;left:58px;width:36px;border-top:3px dashed #b08a5a}
.rt-st{position:relative;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;background:#fffaf0;border:3px solid #b08a5a}
.rt-st b{font:800 24px var(--display,system-ui);color:#7a5238}
.rt-done .rt-st{background:#fde7cf;border:3px double #c0563f;transform:rotate(-8deg);box-shadow:0 2px 0 rgba(74,53,40,.2)}
.rt-cur .rt-st{background:#fff3c9;border-color:#e0701a;animation:augPulse 1.8s ease-in-out infinite}
.rt-cur .rt-st img{position:absolute;width:34px;height:34px;top:-20px;right:-12px;filter:drop-shadow(0 2px 1px rgba(0,0,0,.2))}
.rt-next .rt-st{background:rgba(255,255,255,.55);border-style:dashed;border-color:#c9b48a}.rt-next .rt-st b{color:#c9b48a}
.rt-n{margin-top:4px;font:800 12px/1.1 var(--display,system-ui);color:#4a3528;max-width:74px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-s small{font-size:10px;letter-spacing:1px;color:#e0a42a}.rt-next .rt-n{color:#b8a58a}
.rt-more{margin:4px 4px 0;font:700 16px 'Caveat',cursive;color:#a5784f;text-align:right}
.rt-card{margin:0 0 10px;padding:12px 12px 10px;border-radius:16px;background:#fffaf0;border:2.5px solid #4a3528;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.rt-ck{margin:0;font:800 11px var(--display,system-ui);letter-spacing:.06em;text-transform:uppercase;color:#a5784f}
.rt-card h3{margin:2px 0 8px;font:800 19px/1.2 var(--display,system-ui);color:#3d2a1e}
.rt-g{position:relative;height:18px;border-radius:999px;background:#efe6d6;border:2px solid #4a3528;overflow:hidden}
.rt-g i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#7fd0c8,#3f9c95)}
.rt-gt{margin:4px 0 8px;font:600 13px var(--body,system-ui);color:#5a4434}
.rt-gk{margin:0 0 4px;font:800 12px var(--display,system-ui);color:#9a4a0e}
.rt-gain{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-wrap:wrap;gap:5px}
.rt-gain li{padding:4px 9px;border-radius:999px;background:#fff3c9;border:1.5px solid #f2c14e;font:700 12px var(--body,system-ui);color:#6b4f12}
.rt-pages{margin:2px 0 4px;font:700 13px var(--body,system-ui);color:#7a6a5c;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rt-pg{width:28px;height:28px;border-radius:6px;border:2px solid #c9b48a;background:#f8efdc;font:800 13px var(--display,system-ui);color:#7a5238;cursor:pointer}
`;
  document.head.appendChild(css);
}

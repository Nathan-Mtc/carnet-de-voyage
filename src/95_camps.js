// ================= 95 · LES CAMPS D'AUGUSTINE ET LE NOUVEAU FIL ROUGE (v90) =================
// Le joueur (18/11) : « à quoi bon suivre l'histoire d'Augustine, ça sert à quoi ? Pas de récompenses bidon. » ;
// « les familiers ne peuvent pas être à Augustine, on n'a qu'un œuf au début » ; « on a besoin de toutes les pièces dès le départ ».
// Histoire retenue :
//  - Vous habitez la maison d'Augustine. Au grenier : son carnet et son dernier œuf (votre premier compagnon).
//  - Dans chaque région, Augustine a laissé un CAMP. Quand on y est Habitué (94), un indice apparaît : un secteur entouré en orange.
//    Envoyer un compagnon dans ce secteur → on trouve le camp. Deux récompenses qui changent le jeu :
//      1. CAMP DE BASE : les voyages partent du point le plus proche (maison ou camp) → les régions lointaines deviennent jouables ;
//      2. SES NOTES : la recette d'un appât de l'Herboristerie (sans elle, impossible d'attirer cette espèce) ;
//    et la page dit où elle est partie ensuite (l'habitant du passage dit comment y aller).
//  - Les recettes d'appâts ne sont plus toutes connues au départ : on les apprend dans ses camps.
const aug$ = (f, d) => { try { return f(); } catch (e) { return d; } };
const augCamps = () => sctSt().camp;

// ---------- départ du point le plus proche ----------
function augOrigin(d) {
  const h = homeObj(); let best = { o: h, camp: null, km: aug$(() => kmExact(h, d), 1e9) };
  Object.entries(augCamps()).forEach(([id, c]) => { const km = aug$(() => kmExact(c, d), 1e9); if (km < best.km - 1) best = { o: { name: `Camp d’Augustine (${RG[id].short})`, lat: c.lat, lon: c.lon }, camp: id, km }; });
  return best;
}
function augRoadMs(d) {
  const O = augOrigin(d), red = aug$(() => sctRed(d), 0);
  return { O, red, road: Math.max(60e3, Math.round(tripRoundMs(O.km) * (1 - red) / 5e3) * 5e3) };
}
if (typeof trjPlanInfo === 'function') trjPlanInfo = (orig => function (dest) {
  const r = orig.apply(this, arguments);
  aug$(() => { if (!dest || dest.tuto) return; const A = augRoadMs(dest); if (!A.O.camp && !A.red && !A.fa && !A.sac) return; r.km = A.O.km; r.road = A.road; r.total = A.road + r.stay; r.back = Date.now() + r.total; });
  return r;
})(trjPlanInfo);
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  aug$(() => {
    const t = S.trips[k]; if (!t || t === before || t.tuto || !t.dest || t.augSet) return;
    const A = augRoadMs(t.dest); t.augSet = 1; if (!A.O.camp && !A.red && !A.fa && !A.sac) return;
    const out = Math.round(A.road / 2), total = 2 * out + (t.stay || 0);
    t.out = out; t.total = total; t.from = { name: A.O.o.name, lat: A.O.o.lat, lon: A.O.o.lon }; t.dist = Math.round(A.O.km);
    if (A.O.camp) t.fromCamp = A.O.camp; if (A.red) t.sctRed = A.red; if (A.fa) t.faRed = A.fa;
    const ar = (t.events || []).find(e => e.type === 'arrivee'); if (ar) ar.at = out / total;
    (t.events || []).sort((a, b) => a.at - b.at);
    save();
  });
  return r;
})(startTrip);
// la portée se compte depuis le camp le plus proche
if (typeof dfRange === 'function') dfRange = (orig => function (k, d) {
  const r = orig.apply(this, arguments);
  aug$(() => { if (!d || !r) return; const O = augOrigin(d); if (!O.camp) return; const gain = Math.round(aug$(() => kmExact(homeObj(), d), 0) - O.km); if (gain <= 0) return; r.parts.push({ id: 'camp', lbl: 'Départ du camp d’Augustine', km: gain }); r.km += gain; r.sum += gain; r.world = r.km >= DF_WORLD; });
  return r;
})(dfRange);

// ---------- l'indice ----------
// v93 : l'indice = un point dans la brume (environ 2 rayons au-delà de ce qu'on connaît) ; on le trouve en allant tout près
function augPickClue(id) {
  const g = sctGrid(id); if (!g) return null;
  const V = sctVis(id), orig = [homeObj()].concat(Object.values(augCamps()));
  let best = null, bs = 1e9;
  g.pts.forEach(([lon, lat], i) => {
    if (i % 2) return;
    const dd = V.length ? Math.min(...V.map(([a, b]) => sctKm(a, b, lon, lat))) : 0; if (V.length && dd < g.r) return;
    const dO = Math.min(...orig.map(o => sctKm(o.lon, o.lat, lon, lat)));
    const sc = Math.abs(dd / g.r - 2.3) * 3 + (dO / g.r) * 0.25 + (hashStr(id + i) % 100) / 300;
    if (sc < bs) { bs = sc; best = [+lon.toFixed(4), +lat.toFixed(4)]; }
  });
  return best;
}
function augClueCenter(id) { const c = sctSt().clue[id]; return Array.isArray(c) ? c : null; }
function augClueAt(d) {
  const R = sctRegOf(d); if (!R) return false;
  const s = sctSt(), C = augClueCenter(R.id), g = sctGrid(R.id);
  return !s.camp[R.id] && !!C && !!g && sctKm(C[0], C[1], d.lon, d.lat) < g.r * 0.8;
}
function augTick() {
  if (document.body.classList.contains('firstrun')) return;
  const s = sctSt();
  Object.keys(s.clue).forEach(id => { if (!Array.isArray(s.clue[id])) delete s.clue[id]; });
  sctOpenIds().forEach(id => {
    if (s.camp[id] || s.clue[id] || sctLvl(id) < 2) return;
    const k = augPickClue(id);
    if (!k) { const a = RG[id].anchor; s.camp[id] = { lon: a[0], lat: a[1], name: RG[id].short, at: Date.now() }; s.pend = id; augLearn(id); }
    else { s.clue[id] = k; if (s.mig2) aug$(() => toast(`📖 Augustine a laissé un indice en ${RG[id].short} : un 📖 sur la carte : son camp est dans les environs.`)); }
    sctDirty = true; aug$(save);
  });
  if (!s.mig2) { s.mig2 = 1; aug$(save); }
  // la page du camp, dès que l'écran est libre
  if (s.pend && aug$(() => $('modal').hidden, true) && !document.getElementById('sctC') && !document.body.classList.contains('cu-on') && !Object.values(S.trips || {}).some(t => t && t.done)) { const id = s.pend; s.pend = null; aug$(save); augCampPage(id); }
}

// ---------- ses notes : un appât par camp ----------
const AUG_HB = {};
aug$(() => HB_BAITS.forEach(([sp]) => { const R = RECIPES.find(r => r.id === 'hb_' + sp); if (R) AUG_HB[sp] = R; }));
function augOwnedSps() { const o = new Set(); aug$(() => Object.keys(S.comps || {}).forEach(k => o.add(spOf(k)))); return o; }
function augSyncHB() {
  const s = sctSt();
  if (!s.hbMig) { // partie en cours : on garde les appâts des espèces qu'on a déjà et ceux du sac
    s.hbMig = 1;
    augOwnedSps().forEach(sp => { if (sp !== 'panda' && sp !== 'capy' && sp !== 'axo' && AUG_HB[sp]) s.learn[sp] = 1; });
    (S.inv || []).forEach(i => { if (i && i.sub === 'appat') { const sp = aug$(() => HB_SP[String(i.name || '').replace(/ \(chef-d’œuvre\)$/, '')], null); if (sp) s.learn[sp] = 1; } });
  }
  for (let i = RECIPES.length - 1; i >= 0; i--) { const R = RECIPES[i]; if (R && /^hb_/.test(R.id) && AUG_HB[R.sp] && !s.learn[R.sp]) RECIPES.splice(i, 1); }
  Object.keys(s.learn).forEach(sp => { if (AUG_HB[sp] && !RECIPES.includes(AUG_HB[sp])) RECIPES.push(AUG_HB[sp]); });
}
aug$(augSyncHB);
// l'espèce que le camp fait connaître : une qui vit dans la région, sinon la plus proche qu'on ne connaît pas encore
function augSpFor(id) {
  const s = sctSt(), L = Object.keys(AUG_HB).filter(sp => !s.learn[sp]); if (!L.length) return null;
  const here = L.filter(sp => NS_SP[sp] && NS_SP[sp].reg[id]).sort((a, b) => NS_SP[b].reg[id] - NS_SP[a].reg[id]);
  if (here.length) return { sp: here[0], where: id };
  const A = { lon: RG[id].anchor[0], lat: RG[id].anchor[1] };
  let best = null, bd = 1e12;
  L.forEach(sp => Object.keys((NS_SP[sp] || {}).reg || {}).forEach(rid => { if (!RG[rid]) return; const km = kmExact(A, { lon: RG[rid].anchor[0], lat: RG[rid].anchor[1] }); if (km < bd) { bd = km; best = { sp, where: rid }; } }));
  return best;
}
function augLearn(id) {
  const s = sctSt(), X = augSpFor(id); if (!X) return null;
  s.learn[X.sp] = 1; s.camp[id].sp = X.sp; s.camp[id].spWhere = X.where; augSyncHB(); return X;
}
const augBaitNm = sp => (HB_BAITS.find(b => b[0] === sp) || [])[1] || 'un appât';
const augPlural = sp => aug$(() => NS_PLURAL[sp], null) || aug$(() => spName(sp), sp);

// ---------- trouver le camp ----------
GAME.on('trip:return', e => aug$(() => {
  if (!e || !e.dest || (e.trip && e.trip.tuto) || !augClueAt(e.dest)) return;
  const R = sctRegOf(e.dest), s = sctSt(), id = R.id;
  s.camp[id] = { lon: e.dest.lon, lat: e.dest.lat, name: e.dest.name || R.short, at: Date.now() };
  delete s.clue[id]; augLearn(id); s.pend = id; sctDirty = true; save();
  setTimeout(() => aug$(() => toast(`⛺ Vous avez trouvé le camp d’Augustine en ${R.short} !`)), 1500);
}));
// où est-elle partie ensuite : un passage vers une région encore fermée
function augNext(id) {
  const E = aug$(() => psEdgesOf(id), []).find(x => !rcIsOpen(psOther(x, id)) && rcOk(RG[psOther(x, id)]));
  if (!E) return null;
  const o = psOther(E, id), T = PS_T[E[2]] || {};
  return { id: o, how: E[2] === 'libre' ? 'par la route' : `par ${E[3] || T.nm || 'un passage'}${T.ico ? ' ' + T.ico : ''}` };
}
function augCampPage(id) {
  const R = RG[id], c = augCamps()[id]; if (!R || !c) return;
  const N = augNext(id), sp = c.sp;
  const txt = `J’ai planté ma tente près de ${c.name}. ${R.mood || ''} ${sp ? `C’est ${c.spWhere === id ? 'ici' : `en ${RG[c.spWhere].short}`} que j’ai appris à attirer ${augPlural(sp)} : je te laisse ma recette.` : ''} ${N ? `De là, je suis partie vers ${RG[N.id].short}, ${N.how}.` : 'Le monde continue, et moi aussi.'}`;
  const gains = [`<li><span>⛺</span><div><b>Camp de base</b><small>Vos compagnons partent d’ici quand c’est plus près que la maison : trajets bien plus courts dans le coin.</small></div></li>`];
  if (sp) gains.push(`<li><span>🪤</span><div><b>Recette : « ${esc(augBaitNm(sp))} »</b><small>À l’Herboristerie. Emportée en voyage, elle attire ${esc(augPlural(sp))}${c.spWhere ? ` (${esc(RG[c.spWhere].short)})` : ''}.</small></div></li>`);
  if (N) gains.push(`<li><span>🧭</span><div><b>La suite : ${esc(RG[N.id].short)}</b><small>${N.how === 'par la route' ? 'Elle s’ouvrira quand vous serez Habitué de la région.' : 'Un habitant près du passage vous expliquera comment le franchir.'}</small></div></li>`);
  aug$(() => showModal(`<div class="cn-page"><p class="cn-k">Le carnet d’Augustine · Le camp de ${esc(R.short)}</p><h2>⛺ Son camp</h2><p class="cn-txt">${esc(txt.replace(/\s+/g, ' ').trim())}</p><p class="cn-sig">— Augustine</p>
<ul class="cn-steps aug-gain">${gains.join('')}</ul><button class="btn green big wide" data-closemodal="1">Merci, Augustine</button></div>`));
  aug$(() => confetti(true)); aug$(() => drawMarks()); aug$(() => renderTripCard()); aug$(() => cmGoal());
}
function augCampLine(id) {
  const s = sctSt(), c = s.camp[id];
  if (c) return `<p class="aug-ln ok">⛺ <b>Camp d’Augustine trouvé</b>${c.sp ? ` · recette : ${esc(augBaitNm(c.sp))}` : ''}</p>`;
  if (s.clue[id]) return `<p class="aug-ln clue">📖 <b>Le camp d’Augustine</b> est près du 📖 sur la carte.</p>`;
  return `<p class="aug-ln">📖 Devenez <b>Habitué</b> : Augustine vous laissera un indice vers son camp.</p>`;
}

// ---------- sur la carte : le camp et l'indice ----------
function augMarks() {
  if (typeof ovEls === 'undefined' || !document.getElementById('ov') || document.body.classList.contains('firstrun')) return;
  const s = sctSt(), want = {};
  Object.entries(s.camp).forEach(([id, c]) => { want['augc' + id] = { lon: c.lon, lat: c.lat, h: `<span class="aug-pin" data-augcamp="${id}">⛺</span>` }; });
  Object.keys(s.clue).forEach(id => { if (s.camp[id] || !rcIsOpen(id)) return; const C = augClueCenter(id); if (C) want['augq' + id] = { lon: C[0], lat: C[1], h: `<span class="aug-q" data-augclue="${id}">📖</span>` }; });
  Object.keys(ovEls).forEach(key => { if ((key.startsWith('augc') || key.startsWith('augq')) && !want[key]) { ovEls[key].el.remove(); delete ovEls[key]; } });
  Object.entries(want).forEach(([key, W]) => {
    const o = ovEls[key];
    if (o && o.el.isConnected) { o.el.hidden = false; o.lon = W.lon; o.lat = W.lat; return; }
    const el = document.createElement('div'); el.className = 'ovm augm'; el.innerHTML = W.h;
    document.getElementById('ov').appendChild(el); ovEls[key] = { el, lon: W.lon, lat: W.lat };
  });
}
function augClueCard(id) {
  if (document.getElementById('sctC')) return;
  const el = document.createElement('div'); el.id = 'sctC'; el.className = 'ch-ov ch-route';
  el.innerHTML = `<div class="ch-card"><p class="cu-k">Un indice d’Augustine</p><h3 class="ps-h">📖 Son camp en ${esc(RG[id].short)}</h3><p class="ch-q">« Mon camp était par là, dans ce coin que tu ne connais pas encore. »</p><p class="fd-how">Envoyez un compagnon vers <b>n’importe quel lieu</b> tout près du 📖 : il trouvera le camp. Zoomez pour voir les lieux.</p><button class="btn green big wide" data-augzoom="${id}">Voir la zone</button><button class="cu-later" data-sctquit="1">Fermer</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
}
function augZoom(id) {
  const C = augClueCenter(id); if (!C) return;
  aug$(() => { $('modal').hidden = true; }); aug$(() => { if (tab !== 'carte') { tab = 'carte'; renderPanel(); } });
  aug$(() => map.flyTo({ center: C, zoom: Math.max(8.6, Math.min(10, map.getZoom() + 2)), duration: 1300, essential: true }));
}
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-augclue],[data-augzoom],[data-augcamp]'); if (!t) return;
  ev.stopPropagation(); ev.preventDefault();
  if (t.dataset.augclue) return augClueCard(t.dataset.augclue);
  if (t.dataset.augzoom) { sctClose(); return augZoom(t.dataset.augzoom); }
  if (t.dataset.augcamp) return augCampPage(t.dataset.augcamp);
}, true);

// ---------- le fil rouge : les chapitres ----------
const augHomeId = () => aug$(() => rgHome().id, '');
const augHasCamp = id => !!(id && augCamps()[id]);
const augSecCt = id => { const I = aug$(() => sctInfo(id), null); return I ? `${I.pct} % → ${I.th[1]} %` : ''; };
Object.assign(akGo, {
  clue: () => { const id = Object.keys(sctSt().clue).find(x => !augHasCamp(x) && rcIsOpen(x)); if (id) augZoom(id); else akGo.map(); },
  region: () => { aug$(() => { $('modal').hidden = true; }); const P = akStep(); sctCard((P && P.C.reg) || augHomeId()); },
});
AK_CH.splice(0, AK_CH.length,
  { nm: 'Le carnet au grenier', page: 'Si tu lis ces lignes, c’est que tu habites ma maison. Je m’appelle Augustine. Toute ma vie, j’ai suivi les compagnons sauvages à travers le monde. Avant mon dernier voyage, j’ai laissé au grenier ce carnet et mon dernier œuf : prends-en soin, c’est ton premier compagnon. Dans chaque région où je suis passée, j’ai laissé un camp. Retrouve-les, et tu me retrouveras.',
    steps: AK_CH[0].steps },
  { nm: 'Connaître son pays', page: 'Avant de partir loin, apprends à connaître ton pays. Chaque coin découvert rend la route plus facile : on connaît les raccourcis, les gens, les chemins. Quand tu seras d’ici, je te montrerai où était mon premier camp.',
    steps: [{ tx: () => `Découvrir ${aug$(() => akHome().short, 'votre région')}`, ct: () => augSecCt(augHomeId()), sub: 'Envoyez vos compagnons là où la carte est encore dans la brume : plus vous découvrez la région, plus les voyages y sont rapides.', ok: () => aug$(() => sctLvl(augHomeId()), 0) >= 2, go: 'region', btn: 'Où aller ?' }] },
  { nm: 'Le premier camp', page: 'Mon premier camp n’était pas loin de chez nous. Je t’ai laissé un indice : cherche le 📖 sur ta carte. Là-bas, tu trouveras mes notes… et un endroit d’où partir.',
    steps: [{ tx: 'Trouver le camp d’Augustine', sub: 'Envoyez un compagnon vers un lieu tout près du 📖 sur la carte.', ok: () => augHasCamp(augHomeId()), go: 'clue', btn: 'Voir' }] },
  { nm: 'Un nouveau compagnon', page: 'Les compagnons sauvages ne viennent pas à n’importe qui. Avec le bon appât et un peu de patience, ils te suivront. Ma recette est dans mon camp.',
    steps: [{ tx: 'Fabriquer l’appât d’Augustine à l’Herboristerie', ok: () => (S.inv || []).some(i => i && i.sub === 'appat') || akSt().bait || Object.keys(S.comps || {}).length > akSt().base.comps, go: 'herbo', btn: 'Herboristerie' },
      { tx: 'Partir avec l’appât et faire éclore un œuf', sub: 'Allez là où vit l’espèce : l’appât l’attire, l’œuf rejoint la Couveuse.', ok: () => Object.keys(S.comps || {}).length > akSt().base.comps, go: 'couv', btn: 'Couveuse' }] },
  { nm: 'Le savoir des habitants', page: 'Je suis repartie plus loin. Aux frontières, il y a toujours quelqu’un qui sait : un guide, un marin, un éclusier. Rends-leur service, ils t’apprendront à franchir ce qui semble infranchissable.',
    steps: AK_CH[2].steps },
  { nm: 'L’atelier', page: AK_CH[3].page, steps: AK_CH[3].steps },
  { nm: 'La première frontière', page: AK_CH[4].page, steps: AK_CH[4].steps },
);
// au-delà : une région par chapitre, fixée au début du chapitre
function augFront() {
  const s = rcSt(), L = Object.keys(s.open).filter(id => RG[id] && rcOk(RG[id]) && !augHasCamp(id));
  L.sort((a, b) => (sctLvl(b) - sctLvl(a)) || ((s.open[b].at || 0) - (s.open[a].at || 0)));
  return L.length ? RG[L[0]] : null;
}
akLoop = function (n) {
  const s = akSt(); if (!s.lreg) s.lreg = {};
  if (!s.lreg[n] && n === s.ch) { const F = augFront(); if (F) { s.lreg[n] = F.id; aug$(save); } }
  const id = s.lreg[n], F = id ? RG[id] : augFront(), base = s.loopPs != null ? s.loopPs : akPsDone();
  return { nm: F ? `Sur ses traces : ${F.short}` : 'Sur ses traces', reg: F && F.id,
    page: F ? `${F.name}. ${F.mood || ''} J’y suis passée moi aussi, et j’y ai laissé un camp. Apprends à connaître la région : je te dirai où le trouver.` : 'Le monde est grand. Continue.',
    steps: [
      { tx: () => F ? `Découvrir ${F.short}` : 'Découvrir une nouvelle région', ct: () => F ? augSecCt(F.id) : '', sub: 'Visitez des lieux dans la brume pour devenir Habitué.', ok: () => !F || sctLvl(F.id) >= 2, go: 'region', btn: 'Où aller ?' },
      { tx: () => F ? `Trouver le camp d’Augustine (${F.short})` : 'Trouver le camp d’Augustine', sub: 'Envoyez un compagnon tout près du 📖 sur la carte.', ok: () => !F || augHasCamp(F.id), go: 'clue', btn: 'Voir' },
      { tx: 'Suivre ses traces plus loin', ct: () => `${akPsDone()} passage${akPsDone() > 1 ? 's' : ''} franchi${akPsDone() > 1 ? 's' : ''}`, sub: 'Sa page dit où elle est partie : franchissez le passage, ou explorez la région suivante.', ok: () => akPsDone() > base || (!!augFront() && augFront() !== F), go: 'passage', btn: 'Y aller' },
    ] };
};
// partie en cours : on reprend au chapitre « Connaître son pays » (les chapitres déjà faits passent tout seuls)
aug$(() => { const s = akSt(); if (!s.v2) { s.v2 = 1; if (s.ch >= 2) s.ch = 2; s.newPage = 0; save(); } });
if (QM_HTML && QM_HTML.hist) QM_HTML.hist = (orig => function () {
  let h = String(orig.apply(this, arguments)).replace(/<div class="cn-goal">[\s\S]*?<\/div>/, '<div class="cn-goal"><b>Le but :</b> retrouver les camps d’Augustine, région après région, jusqu’à elle. Chaque camp vous donne un camp de base et une de ses recettes.</div>');
  const ids = aug$(() => sctOpenIds(), []);
  if (ids.length) h += `<h3 class="qt-h3">Vos régions <small>${ids.length}</small></h3><div class="cn-pages">${ids.map(id => { const I = sctInfo(id); return `<button class="cn-pg" data-sctreg="${id}"><span>${augHasCamp(id) ? '⛺' : '🗺️'}</span><b>${esc(RG[id].short)} · ${I.nm} <small class="aug-st">${sctStars(I.lvl)}</small></b></button>`; }).join('')}</div>`;
  return h;
})(QM_HTML.hist);

setInterval(() => { if (document.hidden) return; aug$(augTick); aug$(augMarks); }, 2000);
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); aug$(augMarks); return r; })(drawMarks);
window.__aug = { camps: () => sctSt().camp, clue: () => sctSt().clue, page: id => augCampPage(id), origin: (lon, lat) => augOrigin({ lon, lat }), sp: id => augSpFor(id) };

{
  const css = document.createElement('style');
  css.textContent = `
.ovm.augm{z-index:4}.aug-pin,.aug-q{display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;background:#fffaf0;border:3px solid #4a3528;font-size:20px;box-shadow:0 3px 0 rgba(74,53,40,.3);cursor:pointer}
.aug-q{background:#ffe7c9;border-color:#e0701a;animation:augPulse 1.8s ease-in-out infinite}
@keyframes augPulse{0%,100%{box-shadow:0 0 0 0 rgba(224,112,26,.5),0 3px 0 rgba(74,53,40,.3)}50%{box-shadow:0 0 0 10px rgba(224,112,26,0),0 3px 0 rgba(74,53,40,.3)}}
.aug-gain{margin:0 0 12px}.aug-gain li>span{background:#fff3c9!important;font-size:14px}
.aug-ln{margin:0 0 8px;padding:7px 10px;border-radius:12px;background:#f4efe6;font:600 13px var(--body,system-ui);color:#5a4434}.aug-ln.ok{background:#eaf4e2;color:#3d6b2a}.aug-ln.clue{background:#ffe7c9;color:#9a4a0e}
.aug-st{color:#e0a42a;letter-spacing:1px;font-size:11px}
`;
  document.head.appendChild(css);
}

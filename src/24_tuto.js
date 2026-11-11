// ================= TUTORIEL GUIDÉ (v14) =================
// « Le joueur doit savoir exactement quoi faire à chaque instant. »
// Après le premier lancement (œuf, nom, commerce : 20_collection.js et 18_boutique.js), le compagnon de départ guide
// le joueur pas à pas : un projecteur éclaire UN élément, une main le montre, une bulle (1 à 2 phrases) explique.
// Chaque étape attend que le joueur fasse l'action ; elle se déduit de l'état du jeu, donc un joueur qui prend un autre
// chemin (carte d'action, sac, menu…) est suivi, et un rechargement reprend à la bonne étape.
// Le jeu « cale » ce qu'il faut pour que chaque étape soit réalisable : la première commande demande un objet du lieu
// du quartier visité, le premier voyage contient forcément un choix (et patiente pendant qu'on répond), le premier retour
// rapporte forcément l'objet demandé et un œuf à éclosion très courte.
// v41 : après le commerce, la PORTÉE (le cercle de la carte, 50_difficulte.js), le MATÉRIEL (une boussole offerte, équipée dans
// Compagnons › Talents, 41_expedition.js : le cercle grandit, « Désormais accessible » comme 53_preparation.js), puis le carnet
// d'Augustine trouvé au grenier lance la BD du chapitre 1 (51_histoire.js) et la bulle montre la checklist de l'histoire.
// État sauvegardé : S.tuto = { on, done, i (étape), f (drapeaux), k (compagnon guide), o (commande), trip, egg, replay, v: 2 }.
// Menu : « Revoir le tutoriel ». « Passer le tutoriel » : petit lien dans la bulle, avec confirmation intégrée.

// ---------------- état ----------------
(function tuInit() {
  try {
    if (!S.tuto || typeof S.tuto !== 'object') {
      // nouvelle partie (l'œuf mystère attend) : le tutoriel suivra ; ancienne sauvegarde : rien, mais « Revoir » au menu
      S.tuto = S.firstRun ? { on: 1, i: 0, f: {}, v: 2 } : { done: 1 };
    }
    // v41 : le tutoriel a changé d'étapes ; un tutoriel en cours d'une ancienne version reprend au début (les étapes déjà faites se sautent seules)
    if (S.tuto.on && S.tuto.v !== 2) { S.tuto.v = 2; S.tuto.i = 0; }
    if (!S.tuto.f || typeof S.tuto.f !== 'object') S.tuto.f = {};
    if (typeof S.tuto.i !== 'number') S.tuto.i = 0;
  } catch (e) { console.error('tuto', e); }
})();
const tuOn = () => !!(S.tuto && S.tuto.on && !S.firstRun);
function tutoActive() { return tuOn(); }
const tuK = () => (S.tuto && S.tuto.k && S.comps[S.tuto.k] ? S.tuto.k : (teamIds()[0] || S.sel));
const tuName = () => (CHARS[tuK()] ? CHARS[tuK()].name : '');
const tuE = () => (typeof compE === 'function' ? compE(tuK()) : '');
const tuOrder = () => { try { return bqState().orders.find(o => o.id === S.tuto.o) || null; } catch (e) { return null; } };
const tuTrip = () => { const t = S.trips[tuK()]; return t && S.tuto.trip && t.id === S.tuto.trip ? t : null; };
const tuChoice = t => t ? t.journal.find(j => j.kind === 'choix') : null;
const tuReduce = () => (typeof reduceMotion === 'function' && reduceMotion());
const $q = s => document.querySelector(s);
const tuVis = el => { if (!el) return null; const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null; const cs = getComputedStyle(el); return cs.visibility === 'hidden' || cs.display === 'none' ? null : el; };
const tuSel = (...ss) => { for (const s of ss) { const e = tuVis($q(s)); if (e) return e; } return null; };
const tuModal = () => { const m = $('modal'); return m && !m.hidden ? m.querySelector('.mbox') : null; };

// ---------------- mise en place : la commande du tutoriel ----------------
// un objet commun d'un lieu du quartier, que le commerce vend vraiment (cohérent dès la lecture : il ne changera plus)
function tuPickReq() {
  const T = bqType();
  const cats = ((T && T.cats) || ['boulangerie', 'cafe', 'marche', 'parc']).filter(c => typeof bqPoiOK === 'function' ? bqPoiOK(c) : LOOT[c]);
  const subs = new Set(T ? [].concat(...(T.keys || []).map(k => ING[k] ? ING[k][0] : []), T.bsubs || []) : []);
  let best = null;
  for (const cat of cats.length ? cats : ['boulangerie']) {
    const defs = (LOOT[cat] || []).filter(d => d[3] === 0 && d[1] !== 't' && d[1] !== 'v');
    if (!defs.length) continue;
    const fit = defs.filter(d => subs.has(d[2]) || (T && (T.itemCats || []).includes(d[1])));
    let near = 0;
    try { const p = typeof nearestPOI === 'function' ? nearestPOI(x => x.cat === cat, true) : null; if (p && kmBetween(homeObj(), p) < 2) near = 1; } catch (e) {}
    const score = (fit.length ? 2 : 0) + near * 3 + (cat === cats[0] ? 0.5 : 0);
    if (!best || score > best.score) best = { cat, def: (fit.length ? fit : defs)[0], score };
  }
  if (!best) return null;
  const d = best.def;
  return { k: 'item', name: d[0], def: [d[0], d[1], d[2], 0, d[4] || null, d[5] || null], n: 1, src: { cat: best.cat } };
}
function tuSetup() {
  const T = S.tuto;
  // le guide : un compagnon de l'équipe qui ne voyage pas
  const free = teamIds().filter(k => !S.trips[k]);
  if (!free.length) { T.on = 0; T.done = 1; save(); toast('Toute l’équipe est en voyage : relancez le tutoriel au retour d’un compagnon.'); return false; }
  T.k = free.includes(S.sel) ? S.sel : free[0];
  if (S.sel !== T.k) { S.sel = T.k; plan.dest = null; }
  const s = bqState(); bqTickOrders();
  let o = T.replay ? null : s.orders[0];
  if (!o) { try { o = bqNewOrder(true); if (o) s.orders.push(o); } catch (e) { o = null; } }
  if (!o) o = s.orders[0];
  const req = tuPickReq();
  if (o && req) {
    o.req = [req]; o.tuto = 1; o.deadline = 0; delete o.bonus;
    o.coins = Math.max(o.coins || 0, 40); o.rep = Math.max(o.rep || 0, 15);
    // la phrase du client parle de ce qu'il demande
    o.line = `Bonjour ! Il me faudrait « ${req.name} », s’il vous plaît.`;
    s.orders = [o, ...s.orders.filter(x => x !== o)];
    T.o = o.id;
  }
  T.started = 1; T.i = 0; T.f = {}; T.t0 = Date.now();
  save();
  return true;
}

// ---------------- les étapes ----------------
// num : numéro affiché (sur 10 ; 1 et 2 sont l'œuf et le commerce du premier lancement)
// done() : l'étape est faite (on passe à la suivante) · go() : { el, txt, dim, ok } à éclairer maintenant
// tuNav(tab, sub) : le bouton à toucher pour aller à un écran (ou null si on y est déjà)
function tuNav(t, sub, allowModal) {
  if (!allowModal && tuModal()) { const b = tuSel('#modal [data-fclose]', '#modal [data-closemodal]', '#modal .stgb [data-stg="no"]'); if (b) return { el: b, txt: 'Fermez d’abord cette fenêtre.', nav: 1 }; }
  if (tab !== t) return { el: tuSel(`#nav [data-nav="${t}"]`), txt: null, nav: 1 };
  if (sub) {
    const cur = getSub(t);
    if (cur !== sub) return { el: t === 'boutique' ? tuSel(`[data-bsub="${sub}"]`) : tuSel(`#panelBody .subtabs [data-sub="${sub}"]`), txt: null, nav: 1 };
  }
  return null;
}
const tuReqTxt = () => { const o = tuOrder(); if (!o) return { who: 'Le client', what: 'sa commande', where: '' }; const c = BQC(o.client), r = o.req[0]; return { who: c ? c.name : 'Le client', what: bqReqLabel(r).toLowerCase(), where: bqReqWhere(r).toLowerCase(), c }; };
const tuDur = () => { const d = DURS.find(x => x.key === 'eclair') || DURS[0]; return d.label; };
// la portée : un repère invisible posé sur le cercle de la carte (le projecteur l'entoure), et la carte cadrée dessus
function tuRangeKm() { try { return dfRange(tuK(), null).km; } catch (e) { return 50; } }
let tuFitSig = '';
function tuRangeEl(km, sig) {
  try {
    if (typeof map === 'undefined' || !map || !mapReady) return null;
    const h = homeObj(), dLat = km / 111.195, dLon = dLat / Math.max(0.2, Math.cos(h.lat * Math.PI / 180));
    if (tuFitSig !== sig) { tuFitSig = sig; map.fitBounds([[h.lon - dLon, h.lat - dLat], [h.lon + dLon, h.lat + dLat]], { padding: { top: 110, bottom: 330, left: 34, right: 34 }, duration: tuReduce() ? 0 : 900 }); try { dfMapUpdate(true); } catch (e) {} }
    const el = tuBuild(); let m = el.querySelector('.tu-rmark');
    if (!m) { m = document.createElement('div'); m.className = 'tu-rmark'; el.appendChild(m); }
    const mr = map.getContainer().getBoundingClientRect(), gr = el.getBoundingClientRect();
    const a = map.project([h.lon - dLon, h.lat + dLat]), b = map.project([h.lon + dLon, h.lat - dLat]);
    const L = Math.max(4, mr.left - gr.left + a.x), T = Math.max(60, mr.top - gr.top + a.y), R = Math.min(gr.width - 4, mr.left - gr.left + b.x), B = Math.min(gr.height - 200, mr.top - gr.top + b.y);
    if (R - L < 30 || B - T < 30) return null;
    Object.assign(m.style, { left: L + 'px', top: T + 'px', width: (R - L) + 'px', height: (B - T) + 'px' });
    return m;
  } catch (e) { return null; }
}
// un lieu que la nouvelle portée permet d'atteindre (« Désormais accessible »)
function tuNewPlace(km0, km1) {
  try { const h = homeObj(); const L = PLACES.map(p => ({ p, d: kmBetween(h, p) })).filter(o => o.d > km0 && o.d <= km1).sort((x, y) => y.d - x.d); return L[0] ? L[0].p.name : ''; } catch (e) { return ''; }
}
const tuCompOwned = () => { const k = tuK(); return (S.inv || []).find(it => { const G = xpGearOf(it); if (!G || G.g !== 'boussole') return false; const by = xpWornBy(it.id); return !by || by === k; }) || null; };
const tuCompOn = () => { try { return xpTierOf(tuK(), 'boussole') >= 1; } catch (e) { return false; } };
const tuStoryRead = () => { try { return styStep(1) !== 0 || styState().n > 1; } catch (e) { return true; } };
const tuOnMap = txt => { const n = tuNav('carte'); return n ? { ...n, txt: n.txt || txt } : null; };
const TU_STEPS = [
  { id: 'commande', num: 3,
    done: () => tuStepPast('commande') || !!(plan.dest && tab === 'voyage') || !!tuTrip() || !tuOrder(),
    go: () => {
      const R = tuReqTxt();
      if (tuModal()) return tuNav('boutique', 'comptoir');
      if (tab !== 'boutique') return { el: tuSel('#nav [data-nav="boutique"]'), txt: 'Votre premier client est arrivé ! Touchez « Boutique ».' };
      const n = tuNav('boutique', 'comptoir'); if (n) return { ...n, txt: 'Les clients attendent au Comptoir.' };
      const o = tuOrder(); if (!o) return null;
      const card = tuVis($q(`.bq-order[data-oid="${o.id}"]`));
      return { el: card, hand: card && card.querySelector('[data-bgo]'), txt: `${R.who} voudrait : <b>${esc(R.what)}</b>. On en trouve tout près, ${esc(R.where)}. Touchez « Partir chercher » !`, scroll: card };
    } },
  { id: 'go', num: 3,
    done: () => !!tuTrip() || !!S.tuto.f.collected,
    go: () => {
      if (tab !== 'voyage' || !plan.dest) return tuBackToOrder();
      const b = tuSel('#goBtn');
      return { el: b, txt: `Direction <b>${esc(plan.dest.name)}</b>, à deux pas ! Un petit tour pour commencer : touchez « ${esc((b && b.textContent.trim()) || 'Partir !')} ».` };
    } },
  { id: 'route', num: 4, dim: false,
    done: () => { const t = tuTrip(); return !!S.tuto.f.collected || !t || !!tuChoice(t) || t.done; },
    go: () => tuOnMap('Revenez sur la carte pour me suivre.') || { el: tuSel('#tripCard'), txt: 'Je suis en route ! En chemin, je ramasse des objets… et parfois, je vous demande votre avis.' } },
  { id: 'choix', num: 4,
    done: () => { const t = tuTrip(), j = tuChoice(t); return !!S.tuto.f.collected || !t || !j || j.resolved; },
    go: () => {
      const t = tuTrip(), j = tuChoice(t);
      if (tab === 'voyage' && S.sel === tuK()) {
        const i = t.journal.indexOf(j), opts = tuVis($q(`#panelBody [data-choice="${i}"]`));
        if (opts) { const je = opts.closest('.je'); return { el: je || opts.closest('.opts') || opts, hand: opts, txt: 'À vous de choisir ! Audace : gros trésor ou petite chute. Prudence : sûr mais modeste.', scroll: je }; }
      }
      return tuOnMap('Revenez sur la carte : j’ai besoin de vous !') || { el: tuSel('#tripCard [data-act="choose"]', '#tripCard'), txt: `${esc(j.text)} J’hésite… Aidez-moi à choisir !` };
    } },
  { id: 'retour', num: 5,
    done: () => !!S.tuto.f.collected,
    go: () => {
      const t = S.trips[tuK()]; if (!t) return null;
      if (!t.done) { const left = Math.max(0, (t.total - t.elapsed) / (typeof fast !== 'undefined' && fast ? 30 : 1)); return tuOnMap('Revenez sur la carte : je rentre bientôt !') || { el: tuSel('#tripCard'), dim: false, txt: `Merci ! Je finis mon tour et je rentre avec mon sac plein. Retour dans ${left < 60e3 ? 'moins d’une minute' : 'environ ' + Math.max(1, Math.round(left / 60e3)) + ' min'}…` }; }
      return tuOnMap('Je suis rentré' + tuE() + ' ! Revenez sur la carte.') || { el: tuSel('#tripCard [data-act="collect"]', '[data-live="collect"]', '#tripCard'), txt: `Je suis rentré${tuE()} ! Ouvrez mon sac pour voir ce que j’ai rapporté.` };
    } },
  { id: 'livrer', num: 5,
    done: () => !!S.tuto.f.delivered || !tuOrder(),
    go: () => {
      const R = tuReqTxt(), o = tuOrder(), txt = `J’ai ${esc(R.what)} ! Livrez la commande de ${esc(R.who)} : votre commerce gagne des pièces et de la réputation.`;
      // filet de sécurité : la commande du tutoriel doit être livrable (objet vendu, porté ou utilisé entre-temps)
      if (o && !bqReady(o) && !tuModal()) { tuTopUp(o); if (tab === 'boutique') renderPanel(); }
      const M = tuModal();
      if (M && M.querySelector('.haul')) { const b = tuSel('#modal .bq-haul [data-bopen]', '#modal .obsum [data-obgo="order"]'); if (b) return { el: b, txt }; }
      if (tab === 'boutique' && getSub('boutique') === 'comptoir' && !M) { const b = tuSel(`[data-bdeliver="${o.id}"]`); if (b) return { el: b, txt, scroll: b.closest('.bq-order') }; const c = tuVis($q(`.bq-order[data-oid="${o.id}"]`)); if (c) return { el: c, hand: c.querySelector('[data-bdeliver],[data-bgo]'), txt, scroll: c }; }
      if (tab === 'carte' && !M) { const b = tuSel(`#tripCard [data-act="deliver"][data-id="${o.id}"]`); if (b) return { el: b, txt }; }
      const n = tuNav('boutique', 'comptoir'); return n ? { ...n, txt: n.txt || txt } : null;
    } },
  { id: 'portee', num: 6, ok: 'Compris !', round: 1,
    done: () => !!S.tuto.f.portee,
    go: () => {
      const pre = S.tuto.f.paid ? `Bravo, ${esc(S.tuto.f.paid)} ! ` : '';
      const n = tuOnMap(`${pre}Revenez sur la carte : je veux vous montrer quelque chose.`); if (n) return n;
      const km = tuRangeKm();
      return { el: tuRangeEl(km, 'portee'), txt: `Ce cercle vert, c’est ma portée (${km} km). Votre familier peut aller jusqu’ici. Pour aller plus loin : matériel, provisions, niveau.` };
    } },
  { id: 'boussole', num: 7, ok: 'Merci !',
    done: () => !!tuCompOwned() || tuCompOn(),
    go: () => tuOnMap('Revenez sur la carte : j’ai un cadeau pour vous.') || { el: null, txt: `<span class="tu-gift">${xpGIco('boussole', 1)}</span>Pour voir plus loin, il faut du matériel. Voici une <b>boussole de base</b>, en cadeau ! Les suivantes s’achètent au Magasin ou se fabriquent à l’atelier.` } },
  { id: 'equiper', num: 7,
    done: () => tuCompOn(),
    go: () => {
      const k = tuK(), it = tuCompOwned(); if (!it) return null;
      if (tuModal()) return tuNav('compagnons', 'talents');
      if (tab !== 'compagnons') return { el: tuSel('#nav [data-nav="compagnons"]'), txt: 'Équipons-la ! Touchez « Compagnons ».' };
      const n = tuNav('compagnons', 'talents'); if (n) return { ...n, txt: 'Le matériel se range dans « Talents ».' };
      if (S.sel !== k) return { el: tuSel(`#hudComps .hc-btn[data-sel="${k}"]`, `#panelBody [data-stc="${k}"]`), txt: `Choisissez-moi d’abord : c’est moi, ${esc(tuName())} !` };
      if (xpSlot == null) { const a = xpEq(k), i = a[0] && !a[1] ? 1 : 0, b = tuSel(`#panelBody [data-xps="${i}"]`); return { el: b, txt: 'Voici mes 2 cases de matériel. Touchez une case vide.', scroll: b && b.closest('.xpf') }; }
      const b = tuSel(`#panelBody [data-xpeq="${it.id}"]`);
      return { el: b, txt: 'Touchez la boussole pour me l’équiper.', scroll: b };
    } },
  { id: 'accessible', num: 8, ok: 'Super !', round: 1,
    done: () => !!S.tuto.f.acc,
    go: () => {
      const n = tuOnMap('Revenez sur la carte : regardez ma portée !'); if (n) return n;
      const km0 = S.tuto.f.km0 || 50, km = tuRangeKm(), pl = tuNewPlace(km0, km);
      return { el: tuRangeEl(km, 'acc'), txt: `Ma portée passe de ${km0} à <b>${km} km</b> !${pl ? ` Désormais accessible : <b>${esc(pl)}</b> ✨` : ''} Plus tard : provisions, matériel pro et niveau la feront encore grandir.` };
    } },
  { id: 'carnet', num: 9, ok: 'Lire le carnet',
    done: () => tuStoryRead(),
    go: () => {
      if ($('styBD')) return { hide: 1 };
      return tuOnMap('Revenez sur la carte : une dernière chose…') || { el: null, txt: 'Une dernière chose… En rangeant le grenier, j’ai trouvé un vieux carnet couvert de poussière. Lisons-le !' };
    } },
  { id: 'fin', num: 10, ok: 'À vous de jouer !',
    done: () => !!S.tuto.f.fin,
    go: () => {
      if ($('styBD')) return { hide: 1 };
      const n = tuOnMap('Revenez sur la carte.'); if (n) return n;
      if (!tuSel('#tripCard.act-story')) try { renderTripCard(); } catch (e) {}
      return { el: tuSel('#tripCard.act-story', '#tripCard'), txt: 'Voici la suite de l’histoire d’Augustine : une petite liste à cocher, avec « Y aller ». Elle est aussi dans Quêtes › Histoire. Bon voyage !' };
    } },
];
const TU_IDX = Object.fromEntries(TU_STEPS.map((s, i) => [s.id, i]));
const tuStepPast = id => (S.tuto.i || 0) > TU_IDX[id];
// hors du bon écran pendant le départ : on revient à la commande
function tuBackToOrder() {
  if (S.trips[tuK()]) return null;
  const n = tuNav('boutique', 'comptoir'); if (n) return { ...n, txt: n.txt || 'Retournez voir la commande au Comptoir.' };
  const o = tuOrder(); const b = o && tuSel(`[data-bgo="${o.id}"]`);
  return { el: b, txt: 'Touchez « Partir chercher » pour préparer le voyage.', scroll: b && b.closest('.bq-order') };
}

function tuTopUp(o) {
  try {
    const al = bqAllocate(o);
    o.req.forEach((rq, j) => {
      for (let n = al[j] ? al[j].have : 0; n < rq.n; n++) {
        let def = rq.def;
        if (!def && rq.k === 'ing') def = Object.values(LOOT).flat().find(d => (d[1] === 'm' || d[1] === 'n') && ING[rq.key] && ING[rq.key][0].includes(d[2]) && d[3] === 0);
        if (def) { const it = makeItem(def, 0, (plan.dest && plan.dest.name) || S.home, [], { fixed: 0 }); S.inv.push(it); S.dex[it.name] = true; }
      }
    });
    save();
  } catch (e) { console.error('tuto', e); }
}
// la boussole offerte (une seule, même si on rejoue le tutoriel)
function tuGiveCompass() {
  try {
    if (tuCompOwned() || tuCompOn()) return;
    const it = makeItem(xpGearDef('boussole', 1), 0, S.home, [], { fixed: 1 });
    S.inv.push(it); S.dex[it.name] = true; S.tuto.f.comp = it.id; save();
  } catch (e) { console.error('tuto', e); }
}
// d'autres modules montrent ce qu'ils cachent d'habitude pendant le tutoriel : le cercle de portée (50, 53) et l'histoire (51)
function tuRangeOn() { try { return tuOn() && S.tuto.i >= TU_IDX.portee && S.tuto.i <= TU_IDX.accessible; } catch (e) { return false; } }
function tuStoryOn() { try { return tuOn() && S.tuto.i >= TU_IDX.carnet; } catch (e) { return false; } }
// ---------------- moteur ----------------
let tuCur = null, tuLastEl = null, tuSkipAsk = false, tuWaitDest = 0;
function tuTick() {
  try {
    const T = S.tuto;
    if (!tuOn()) { tuHide(); return; }
    if (!T.started && !tuSetup()) { tuHide(); return; }
    // avancer tant que les étapes sont faites
    let guard = 0;
    while (T.i < TU_STEPS.length && guard++ < 20 && TU_STEPS[T.i].done()) { T.i++; tuSkipAsk = false; save(); }
    if (T.i >= TU_STEPS.length) return tuFinish();
    const st = TU_STEPS[T.i];
    // la destination : un lieu du quartier (moins de 2 km), sinon la boutique du quartier la plus proche, créée pour l'occasion
    if ((st.id === 'commande' || st.id === 'go') && tab === 'voyage') tuCheckDest();
    let g = null;
    try { g = st.go(); } catch (e) { console.error('tuto', st.id, e); }
    if (g && g.hide) { tuHide(); return; }
    tuShow(st, g || { el: null, txt: null });
  } catch (e) { console.error('tuto', e); }
}
function tuCheckDest() {
  const d = plan.dest; if (!d || S.trips[tuK()]) return;
  if (d.poi && kmExact(homeObj(), d) <= 1.5) { if (plan.dur !== 'eclair') { plan.dur = 'eclair'; renderPanel(); } return; }
  tuFallbackDest();
}
// « Partir chercher » sur la commande du tutoriel : la destination est choisie ICI, sans dépendre des icônes dessinées
// par la couche de la carte (mode tiles : les lieux OSM n'existent que dans la vue, et seulement à partir du zoom 13-14).
// Lieu connu du quartier à moins de 1,5 km (trajet d'environ 1 à 2 min), sinon « <Catégorie> du quartier », créé à 500 m.
function tuGoDest() {
  const o = tuOrder(), cat = (o && o.req[0].src && o.req[0].src.cat) || 'boulangerie';
  if (S.sel !== tuK()) { S.sel = tuK(); }
  let p = null;
  try { p = typeof nearestPOI === 'function' ? nearestPOI(x => x.cat === cat, true) : null; if (p && kmExact(homeObj(), p) > 1.5) p = null; } catch (e) { p = null; }
  if (p && typeof poiDest === 'function') {
    plan.dest = poiDest(p); plan.dur = 'eclair';
    openSheet('voyage');
    try { drawMarks(); } catch (e) {}
  } else tuFallbackDest();
  // la carte montre la maison ET la destination (le joueur suivra le trajet au retour sur la carte)
  try { const d = plan.dest, h = homeObj(); if (d && map) map.fitBounds([[Math.min(d.lon, h.lon), Math.min(d.lat, h.lat)], [Math.max(d.lon, h.lon), Math.max(d.lat, h.lat)]], { padding: { top: 130, bottom: 230, left: 60, right: 90 }, maxZoom: 16, duration: 900 }); } catch (e) {}
}
if (typeof bqGo === 'function') bqGo = (orig => function (id) {
  try { if (tuOn() && S.tuto.started && S.tuto.o === id && S.tuto.i <= TU_IDX.go && !S.trips[tuK()]) return tuGoDest(); } catch (e) { console.error('tuto', e); }
  return orig.apply(this, arguments);
})(bqGo);
function tuFallbackDest() {
  const o = tuOrder(), cat = o && o.req[0].src && o.req[0].src.cat || 'boulangerie';
  if (typeof poiDest !== 'function' || !POI_CATS[cat]) return;
  const h = homeObj();
  plan.dest = poiDest({ cat, name: `${POI_CATS[cat][0]} du quartier`, lon: h.lon + 0.0045, lat: h.lat + 0.0028, city: S.home });
  plan.dur = 'eclair';
  if (tab !== 'voyage') openSheet('voyage'); else renderPanel();
  try { drawMarks(); } catch (e) {}
}
function tuFinish() {
  S.tuto = { done: 1, at: Date.now() };
  save(); tuHide(); renderAll();
  toast('Bon voyage ! Le tutoriel se revoit depuis le menu.');
}
function tuSkip() {
  S.tuto = { done: 1, skipped: 1 };
  save(); tuHide(); renderAll();
  toast('Tutoriel passé. Vous pourrez le revoir depuis le menu.');
}
function tuReplay() {
  S.tuto = { on: 1, i: 0, f: {}, replay: 1, v: 2 };
  save();
  closeSheet();
  tuTick();
}

// ---------------- affichage : projecteur, main, bulle ----------------
let tuEl = null;
function tuBuild() {
  if (tuEl) return tuEl;
  tuEl = document.createElement('div'); tuEl.id = 'tuto'; tuEl.setAttribute('aria-live', 'polite');
  tuEl.innerHTML = `<div class="tu-hole" aria-hidden="true"></div><div class="tu-hand" aria-hidden="true"><svg viewBox="0 0 48 56"><path d="M17 30 V9 a4.5 4.5 0 0 1 9 0 V24 l1-6 a4.2 4.2 0 0 1 8 1.4 V26 l.6-3 a4 4 0 0 1 7.6 1.6 V36 c0 10 -6 16 -15 16 h-3 c-6 0 -10 -3 -13 -8 l-7 -11 a4 4 0 0 1 6.4 -4.8Z" fill="#fff8ea" stroke="#4a3528" stroke-width="3" stroke-linejoin="round"/><path d="M26 25 V32 M34.6 26 V33" stroke="#4a3528" stroke-width="2.2" stroke-linecap="round"/><circle cx="21.5" cy="9.5" r="2.2" fill="#f4b7c4"/></svg></div><div class="tu-bub" role="dialog" aria-label="Tutoriel"><i class="tu-tail" aria-hidden="true"></i><img class="tu-face" alt=""><div class="tu-tx"><b class="tu-who"></b><p class="tu-say"></p><div class="tu-ft"><span class="tu-pg"></span><button class="tu-skip" data-tu="skip">Passer le tutoriel</button><button class="btn green sm tu-ok" data-tu="ok"></button></div></div></div>`;
  (document.querySelector('.game') || document.body).appendChild(tuEl);
  return tuEl;
}
function tuHide() { if (tuEl) tuEl.hidden = true; document.body.classList.remove('tu-on'); tuCur = null; tuLastEl = null; }
let tuSig = '';
function tuShow(st, g) {
  const el = tuBuild();
  el.hidden = false; document.body.classList.add('tu-on');
  const k = tuK(), bub = el.querySelector('.tu-bub');
  const dim = g.dim !== undefined ? g.dim : st.dim !== undefined ? st.dim : true;
  // le texte
  let say = g.txt || '…', ok = (!g.nav && st.ok) || '', foot = '';
  if (tuSkipAsk) { say = 'Passer le tutoriel ? Vous pourrez le revoir quand vous voulez depuis le menu.'; ok = ''; }
  const sig = [st.id, say, ok, tuSkipAsk, k].join('|');
  if (sig !== tuSig) {
    tuSig = sig;
    el.querySelector('.tu-face').src = portraitURI(k, st.id === 'fin' ? 'amour' : st.id === 'choix' || st.id === 'carnet' ? 'curieux' : 'rire');
    el.querySelector('.tu-who').textContent = CHARS[k] ? CHARS[k].name : '';
    el.querySelector('.tu-say').innerHTML = say;
    const ft = el.querySelector('.tu-ft');
    ft.innerHTML = tuSkipAsk
      ? `<button class="btn cream sm" data-tu="stay">Continuer</button><button class="btn gold sm" data-tu="skipok">Passer</button>`
      : `<span class="tu-pg" aria-label="Étape ${st.num} sur 10">${Array.from({ length: 10 }, (_, i) => `<i class="${i < st.num - 1 ? 'on' : i === st.num - 1 ? 'cur' : ''}"></i>`).join('')}</span>${ok ? `<button class="btn green sm tu-ok" data-tu="ok">${ok}</button>` : `<button class="tu-skip" data-tu="skip">Passer le tutoriel</button>`}`;
    if (ok && !tuSkipAsk) ft.insertAdjacentHTML('beforeend', '');
    bub.classList.remove('pop'); void bub.offsetWidth; if (!tuReduce()) bub.classList.add('pop');
  }
  el.classList.toggle('nodim', !dim || !g.el);
  el.classList.toggle('center', !g.el);
  el.classList.toggle('round', !!(g.el && st.round));
  tuCur = { st, g };
  // amener l'élément sous les yeux (une fois par élément)
  const sc = g.scroll || g.el;
  if (g.el && g.el !== tuLastEl) {
    tuLastEl = g.el;
    if (sc && sc.scrollIntoView) { const r = sc.getBoundingClientRect(); let pb = sc.parentElement; while (pb && pb !== document.body && !(pb.scrollHeight > pb.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(pb).overflowY))) pb = pb.parentElement; if (!pb || pb === document.body) pb = sc.closest('#panelBody, .mbox'); const box = pb ? pb.getBoundingClientRect() : { top: 0, bottom: innerHeight }; if (r.top < box.top + 8 || r.bottom > box.bottom - 8) sc.scrollIntoView({ block: 'center', behavior: tuReduce() ? 'auto' : 'smooth' }); }
  }
  tuPlace();
}
// position : le trou autour de l'élément, la main dessus, la bulle au-dessus ou au-dessous (là où il y a la place)
function tuPlace() {
  if (!tuEl || tuEl.hidden || !tuCur) return;
  const { g } = tuCur, hole = tuEl.querySelector('.tu-hole'), hand = tuEl.querySelector('.tu-hand'), bub = tuEl.querySelector('.tu-bub'), tail = tuEl.querySelector('.tu-tail');
  const gr = tuEl.getBoundingClientRect(), W = gr.width, H = gr.height, M = 10;
  const el = g.el && document.contains(g.el) ? g.el : null;
  const bw = Math.min(360, W - 2 * M); bub.style.width = bw + 'px';
  const bh = bub.offsetHeight;
  if (!el) {
    hole.style.display = 'none'; hand.style.display = 'none'; tail.style.display = 'none';
    bub.style.left = (W - bw) / 2 + 'px'; bub.style.top = Math.max(M, (H - bh) / 2) + 'px';
    return;
  }
  const r0 = el.getBoundingClientRect(), p = 6;
  const r = { left: r0.left - gr.left - p, top: r0.top - gr.top - p, width: r0.width + 2 * p, height: r0.height + 2 * p };
  r.right = r.left + r.width; r.bottom = r.top + r.height;
  hole.style.display = ''; tail.style.display = '';
  Object.assign(hole.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  // la main : sur l'élément à toucher (ou au centre de l'élément éclairé)
  const he = g.hand && document.contains(g.hand) ? g.hand.getBoundingClientRect() : r0;
  const wait = g.dim === false || (tuCur.st.dim === false && g.dim === undefined);
  hand.style.display = wait || tuSkipAsk ? 'none' : '';
  hand.style.left = Math.min(W - 46, he.left - gr.left + he.width / 2 - 6) + 'px';
  hand.style.top = Math.min(H - 52, he.top - gr.top + he.height / 2 + 2) + 'px';
  // la bulle
  const above = r.top - M, below = H - r.bottom - M;
  let top, up;
  if (g.below || st_prefBelow(r, H)) { up = !(below >= bh + 14) && above > below; }
  else up = above >= bh + 14 || above > below;
  if (up) top = Math.max(M, r.top - bh - 14); else top = Math.min(H - bh - M, r.bottom + 14);
  // jamais sur l'élément : si la place manque des deux côtés, la bulle se pose au bord le plus éloigné
  if (!up && top < r.bottom + 4 && above > below) { top = M; up = true; }
  const cx = r.left + r.width / 2;
  const left = Math.max(M, Math.min(W - bw - M, cx - bw / 2));
  bub.style.left = left + 'px'; bub.style.top = top + 'px';
  bub.classList.toggle('up', up);
  tail.style.left = Math.max(18, Math.min(bw - 18, cx - left)) + 'px';
  const overlap = up ? top + bh > r.top : top < r.bottom;
  tail.style.display = overlap ? 'none' : '';
}
// les éléments du haut (HUD) : la bulle passe dessous ; ceux du bas : dessus
const st_prefBelow = (r, H) => r.top + r.height / 2 < H * 0.4;
function tuLoop() { try { tuPlace(); } catch (e) {} requestAnimationFrame(tuLoop); }

// ---------------- calages : chaque étape doit être réalisable ----------------
// 1. le premier voyage contient un choix, tôt, et pas de rencontre ni de marchand qui brouilleraient le message
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  try {
    const t = S.trips[k];
    if (tuOn() && t && t !== before && !S.tuto.trip && S.tuto.i >= TU_IDX.commande && S.tuto.i <= TU_IDX.go) {
      S.tuto.trip = t.id; S.tuto.k = k; t.tuto = 1;
      if (Array.isArray(t.events)) {
        t.events = t.events.filter(e => e.type !== 'sauvage');
        const rest = t.events.filter(e => e.type !== 'arrivee' && e.type !== 'pepin');
        rest.forEach(e => { if (['rencontre', 'marchand', 'aide', 'choix', 'tresor'].includes(e.type)) e.type = 'trouvaille'; });
        const first = rest.slice().sort((a, b) => a.at - b.at)[0];
        if (first) first.type = 'choix';
        else t.events.push({ at: 0.2, type: 'choix' });
        t.events.sort((a, b) => a.at - b.at);
      }
      save();
    }
  } catch (e) { console.error('tuto', e); }
  return r;
})(startTrip);
// 2. un choix attend la réponse du joueur : pendant le tutoriel, le voyage patiente
tick = (orig => function () {
  let t = null;
  try { if (tuOn()) { t = tuTrip(); const j = tuChoice(t); if (!(t && !t.done && j && j.pending && !j.resolved)) t = null; } } catch (e) { t = null; }
  if (t) t.done = true;
  try { return orig.apply(this, arguments); } finally { if (t) { t.done = false; t.last = Date.now(); } }
})(tick);
// un choix en attente ne se décide plus tout seul à l'événement suivant (quelques secondes plus tard), mais au retour :
// le joueur qui touche « Choisir » trouve bien le choix (sans réponse, le compagnon décide toujours seul au retour)
autoResolve = (orig => function (t) { if (t && !t.done && t.elapsed < t.total) return; return orig.apply(this, arguments); })(autoResolve);
// 3. le premier retour rapporte l'objet de la commande, un vêtement et un œuf qui éclot très vite
let tuFastEgg = false;
if (typeof nsHatchMs === 'function') nsHatchMs = (orig => function () { return tuFastEgg ? 20e3 : orig.apply(this, arguments); })(nsHatchMs);
collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  const mine = !!(t && tuOn() && S.tuto.trip && t.id === S.tuto.trip);
  const eggs0 = new Set((S.eggs || []).map(e => e.id));
  if (mine) {
    try {
      const place = t.dest.name, tags = t.dest.tags || ['campagne'];
      const o = tuOrder();
      if (o) o.req.forEach(rq => {
        const have = S.inv.concat(t.bag).filter(x => bqMatch(rq, x)).length;
        for (let n = have; n < rq.n; n++) {
          let def = rq.def;
          if (!def && rq.k === 'ing') def = Object.values(LOOT).flat().find(d => (d[1] === 'm' || d[1] === 'n') && ING[rq.key] && ING[rq.key][0].includes(d[2]) && d[3] === 0);
          if (def) t.bag.push(makeItem(def, 0, place, tags, { fixed: 0 }));
        }
      });
    } catch (e) { console.error('tuto', e); }
    tuFastEgg = true;
  }
  let r;
  try { r = orig.apply(this, arguments); } finally { tuFastEgg = false; }
  if (mine && !S.trips[k]) {
    try {
      S.tuto.f.collected = 1;
      let egg = (S.eggs || []).find(e => !eggs0.has(e.id));
      if (!egg && typeof nsAddEgg === 'function') {
        // l'œuf du tutoriel (le premier œuf est déjà garanti par la nurserie ; ici pour « Revoir le tutoriel »)
        const sp = typeof nsPickSp === 'function' ? nsPickSp(t.dest) : 'panda';
        egg = nsAddEgg({ sp, genes: defaultGenes(sp), rarity: 0, from: { how: 'oeuf', place: t.dest.name }, ms: 20e3 });
        const M = tuModal(); if (M && M.querySelector('.haul') && typeof nsEggFoundHTML === 'function') { const b = M.querySelector('button[data-closemodal]'); if (b) b.insertAdjacentHTML('beforebegin', nsEggFoundHTML(egg)); }
      }
      if (egg) { S.tuto.egg = egg.id; if (egg.ready - Date.now() > 20e3) { egg.ready = Date.now() + 15e3; egg.ms = 20e3; } }
      save();
    } catch (e) { console.error('tuto', e); }
  }
  return r;
})(collect);
// la carte d'action parle de la commande du tutoriel (et pas du rêve) tant qu'on prépare le premier départ
nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  try {
    if (tuOn() && S.tuto.started && S.tuto.i <= TU_IDX.go && a && (a.kind === 'dream' || a.kind === 'order' || a.kind === 'idle')) {
      const o = tuOrder(), k = tuK();
      if (o && !S.trips[k]) return { kind: 'order', k, o, r: o.req[0] };
    }
    // à la fin du tutoriel, la carte d'action montre la checklist de l'histoire (51_histoire.js prend le relais d'une carte « libre »)
    if (tuStoryOn() && a && a.kind !== 'away' && !$('styBD')) return { kind: 'idle' };
  } catch (e) {}
  return a;
})(nextAction);
// panneau de voyage : pour le premier départ, seule la durée la plus courte est proposée
renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (tuOn() && S.tuto.i <= TU_IDX.go && !S.trips[S.sel] && box) {
      box.querySelectorAll('.dur[data-dur]').forEach(b => { if (b.dataset.dur !== 'eclair') { b.disabled = true; b.classList.add('tu-off'); b.title = 'Après le tutoriel'; } });
    }
  } catch (e) {}
  return r;
})(renderVoyage);
// pendant la préparation du premier départ, la bulle guide seule : pas de consigne concurrente en haut de l'écran
toast = (orig => function (msg) {
  try { if (tuOn() && S.tuto.started && S.tuto.i <= TU_IDX.go && !/Toute l’équipe|déjà en voyage/.test(String(msg))) return; } catch (e) {}
  return orig.apply(this, arguments);
})(toast);
// menu : « Revoir le tutoriel »
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    box.insertAdjacentHTML('beforeend', `<section class="msec"><header><h3>Aide</h3></header><div class="mrow"><span class="mri tu-mri" aria-hidden="true"><img src="${portraitURI(teamIds()[0] || S.sel, 'rire')}" alt=""></span><div><b>Revoir le tutoriel</b><span>${esc(CHARS[teamIds()[0]] ? CHARS[teamIds()[0]].name : 'Votre compagnon')} vous remontre la boucle du jeu, pas à pas.</span></div><button class="btn cream sm" data-tu="replay"${tuOn() ? ' disabled' : ''}>${tuOn() ? 'En cours' : 'Revoir'}</button></div></section>`);
  } catch (e) { console.error('tuto', e); }
  return r;
})(renderMenu);
// la commande livrée : on retient le gain pour féliciter le joueur
GAME.on('order:done', ({ order }) => {
  try { if (tuOn() && order && order.id === S.tuto.o) { S.tuto.f.delivered = 1; S.tuto.f.paid = `+${order.coins} pièces et +${order.rep} de réputation`; save(); } } catch (e) {}
});
// la durée : le joueur l'a choisie lui-même
document.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  const d = b.dataset.tu; if (!d) return;
  if (d === 'skip') { tuSkipAsk = true; tuSig = ''; tuTick(); return; }
  if (d === 'stay') { tuSkipAsk = false; tuSig = ''; tuTick(); return; }
  if (d === 'skipok') { tuSkipAsk = false; return tuSkip(); }
  if (d === 'replay') return tuReplay();
  if (d === 'ok' && tuCur) {
    const id = tuCur.st.id;
    const F = S.tuto.f;
    if (id === 'portee') { F.portee = 1; F.km0 = tuRangeKm(); }
    if (id === 'boussole') tuGiveCompass();
    if (id === 'accessible') F.acc = 1;
    if (id === 'carnet') { F.carnet = 1; save(); tuHide(); try { styRead(); } catch (e) { console.error('tuto', e); } }
    if (id === 'fin') F.fin = 1;
    save(); tuTick();
  }
}, true);
// l'œuf du tutoriel devient prêt : la nurserie affichée se met à jour toute seule
let tuEggReady = false;
setInterval(() => {
  tuTick();
  try {
    const e = S.tuto && S.tuto.egg && (S.eggs || []).find(x => x.id === S.tuto.egg), rd = !!(e && e.ready <= Date.now());
    if (rd && !tuEggReady && tab === 'village' && villView === 'nurserie' && !tuModal()) renderPanel();
    tuEggReady = rd;
  } catch (e) {}
}, 250);
requestAnimationFrame(tuLoop);
addEventListener('resize', () => { tuLastEl = null; });

// ---------------- styles ----------------
(function tuCSS() {
  const st = document.createElement('style'); st.id = 'tutoCSS';
  st.textContent = `
#tuto{position:absolute;inset:0;z-index:45;pointer-events:none}
#tuto[hidden]{display:none}
body.tu-on #toast{z-index:47}
/* pendant le tutoriel : ni voyageurs simulés ni filtre de carte (rien ne s'ouvre par-dessus le projecteur) */
body.tu-on #vyLay,body.tu-on #vyCard,body.tu-on #zFilt,body.tu-on #poiFilt{display:none!important}
.tu-hole{position:absolute;border-radius:16px;box-shadow:0 0 0 3px #fff6c9,0 0 0 6px rgba(246,196,69,.9),0 0 0 200vmax rgba(52,34,22,.42);transition:left .25s,top .25s,width .25s,height .25s}
.tu-hole::after{content:"";position:absolute;inset:-6px;border-radius:20px;border:3px solid #f6c445;animation:tuRing 1.3s ease-out infinite}
#tuto.nodim .tu-hole{box-shadow:0 0 0 3px #fff6c9,0 0 0 6px rgba(246,196,69,.9)}
#tuto.center{background:rgba(52,34,22,.42)}
@keyframes tuRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.12)}}
.tu-hand{position:absolute;width:40px;height:46px;filter:drop-shadow(0 3px 0 rgba(74,53,40,.35));animation:tuTap 1s ease-in-out infinite;transform-origin:30% 10%}
.tu-hand svg{width:100%;height:100%;display:block}
@keyframes tuTap{0%,100%{transform:translate(0,0)}50%{transform:translate(-3px,-7px)}}
.tu-bub{position:absolute;box-sizing:border-box;pointer-events:auto;display:flex;gap:9px;align-items:flex-start;background:var(--paper,#fff8ea);border:3px solid var(--ink,#4a3528);border-radius:20px;padding:9px 11px 9px 9px;box-shadow:0 5px 0 rgba(74,53,40,.45);color:var(--ink,#4a3528);text-align:left;transition:left .25s,top .25s}
.tu-bub.pop{animation:tuPop .35s cubic-bezier(.2,1.5,.4,1)}
@keyframes tuPop{0%{transform:scale(.85);opacity:0}100%{transform:none;opacity:1}}
.tu-tail{position:absolute;left:30px;top:-10px;width:16px;height:16px;margin-left:-8px;background:var(--paper,#fff8ea);border-left:3px solid var(--ink,#4a3528);border-top:3px solid var(--ink,#4a3528);transform:rotate(45deg);border-radius:3px 0 0 0}
.tu-bub.up .tu-tail{top:auto;bottom:-10px;transform:rotate(225deg)}
.tu-face{flex:none;width:52px;height:56px;border-radius:14px;border:2.5px solid var(--ink,#4a3528);background:#fff3c4;object-fit:cover;object-position:top}
.tu-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.tu-who{font:800 13px/1.1 var(--display);color:var(--rust,#c9604f);letter-spacing:.02em}
.tu-say{margin:0;font:600 14.5px/1.38 var(--body);text-wrap:pretty}
.tu-say b{font-weight:800}
.tu-ft{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:3px}
.tu-pg{display:flex;gap:3px;flex:1}
.tu-pg i{width:7px;height:7px;border-radius:50%;background:#efe2c8;border:1.5px solid #c9b391}
.tu-pg i.on{background:var(--green,#5fbf7f);border-color:#3a8f5a}
.tu-pg i.cur{background:var(--gold,#f6c445);border-color:var(--ink,#4a3528);transform:scale(1.25)}
.tu-skip{background:none;border:0;padding:2px 0;font:700 12px var(--display);color:var(--muted,#9a8574);text-decoration:underline;cursor:pointer}
.tu-ft .btn{padding:6px 12px 4px;font-size:14px}
.tu-rmark{position:absolute;pointer-events:none;opacity:0}
#tuto.round .tu-hole{border-radius:50%}#tuto.round .tu-hole::after{border-radius:50%}
.tu-gift{float:left;width:46px;height:46px;margin:0 8px 2px 0}.tu-gift svg{width:100%;height:100%}
.dur.tu-off{opacity:.42;filter:grayscale(.6)}
.tu-mri{overflow:hidden;background:#fff3c4}.tu-mri img{width:36px;height:40px;object-fit:cover;object-position:top}
@media (max-width:420px){.tu-say{font-size:14px}.tu-face{width:44px;height:48px}}
@media (prefers-reduced-motion:reduce){.tu-hand,.tu-hole::after,.tu-bub.pop{animation:none!important}.tu-hole,.tu-bub{transition:none}}
`;
  document.head.appendChild(st);
})();
window.__tuto = { S: () => S.tuto, cur: () => tuCur && { id: tuCur.st.id, wait: tuCur.g.dim === false || (tuCur.st.dim === false && tuCur.g.dim === undefined), txt: tuEl && tuEl.querySelector('.tu-say').textContent }, target: () => tuCur && (tuCur.g.hand || tuCur.g.el), step: () => (TU_STEPS[S.tuto && S.tuto.i] || {}).id, tick: tuTick, replay: tuReplay, skip: tuSkip };

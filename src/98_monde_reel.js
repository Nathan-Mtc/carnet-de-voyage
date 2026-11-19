// ================= 98 · LE LIEN ENTRE VOTRE QUARTIER ET LE MONDE (v96) =================
// Ligne directrice (19/11, projet : claude/ligne-directrice.md) : « Vous êtes le lien entre votre quartier et le reste du monde. »
// Les clients demandent de vraies spécialités de vrais lieux ; plus c'est loin, plus c'est précieux.
//  1. Vue « Mon quartier » : quelques km autour de chez soi, assez près pour voir les vrais commerces (zoom ≥ 14).
//  2. Les demandes de spécialités viennent de ce que le joueur peut atteindre (régions ouvertes) et, plus rarement,
//     d'une région voisine encore fermée (sans délai : elle attend qu'on puisse y aller). Prix selon la distance depuis la boutique.
//  3. Le « merci » du client, lié à qui il est : recette, appât, chemin (brume levée), passage, outil, provisions, objet rare.
//  4. Le plus rare : un correspondant dans une région lointaine, qui envoie une spécialité chaque jour.
const mr$ = (f, d) => { try { return f(); } catch (e) { return d; } };
function mrSt() { if (!S.mr || typeof S.mr !== 'object') S.mr = {}; if (!S.mr.corr) S.mr.corr = {}; return S.mr; }

// ---------- 1 · la vue « Mon quartier » ----------
const MR_QKM = 1.3;
vwCoinBox = function () {
  const h = mr$(() => homeObj(), null); if (!h) return null;
  const dLat = MR_QKM / 111, dLon = MR_QKM / (111 * Math.max(0.2, Math.cos(h.lat * Math.PI / 180)));
  return [[h.lon - dLon, h.lat - dLat], [h.lon + dLon, h.lat + dLat]];
};
vwGo = function (mode, instant) {
  if (typeof map === 'undefined' || !map || !map.cameraForBounds) return;
  const B = mode === 'monde' ? vwWorldBox() : vwCoinBox(); if (!B) return;
  const c = mr$(() => map.cameraForBounds(B, { padding: vwPad() }), null); if (!c) return;
  const z = mode === 'monde' ? Math.min(13, c.zoom) : Math.max(14.1, Math.min(15.5, c.zoom));
  const to = { center: c.center, zoom: z, bearing: 0, pitch: 0 };
  mr$(() => instant ? map.jumpTo(to) : map.flyTo(Object.assign({ duration: 1500, essential: true }, to)));
  vwMode = mode; vwSync();
};
vwAuto = function () {
  if (typeof map === 'undefined' || !map || !map.getZoom) return;
  const m = map.getZoom() < 11 ? 'monde' : 'coin';
  if (m !== vwMode) { vwMode = m; vwSync(); }
};
vwSync = function () {
  const ov = document.getElementById('ov'); if (ov) { ov.classList.toggle('vw-coin', vwMode === 'coin'); ov.classList.toggle('vw-monde', vwMode === 'monde'); }
  const b = document.getElementById('vwBtn'); if (b) { const toW = vwMode === 'coin'; b.innerHTML = `<span>${toW ? '🗺️' : '🏠'}</span><small>${toW ? 'Le monde' : 'Mon quartier'}</small>`; b.setAttribute('aria-label', toW ? 'Voir le monde' : 'Revenir à mon quartier'); }
};

// ---------- 2 · des demandes de vraies spécialités ----------
const mrKm = R => mr$(() => kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }), 0);
// où se trouve vraiment une spécialité : la ville principale de sa zone la plus proche (sinon le cœur de la région)
function mrOrigin(rid) {
  const x = RG_RES[rid]; if (!x) return null; const R = RG[x.region], W = typeof RG_RES_WHERE !== 'undefined' ? RG_RES_WHERE[rid] : null, h = homeObj();
  let best = { lon: R.anchor[0], lat: R.anchor[1], c: R.short }, bd = kmBetween(h, best);
  (W && W.z || []).forEach(z => { const Z = RG_ZONES[z]; if (!Z) return; const [lon, lat] = Z.pts.split(' ')[0].split(',').map(Number); const p = { lon, lat, c: Z.c }, d = kmBetween(h, p); if (!W.z.indexOf || bd === null || d < bd || best.c === R.short) { if (best.c === R.short || d < bd) { best = p; bd = d; } } });
  return Object.assign(best, { km: bd });
}
// les régions d'où peuvent venir les demandes : celles qu'on peut atteindre, et parfois une voisine encore fermée
function mrRegions() {
  const open = Object.keys(mr$(() => rcSt().open, {})).filter(id => RG[id] && rcOk(RG[id]));
  const front = new Set();
  open.forEach(id => mr$(() => psEdgesOf(id), []).forEach(E => { const o = psOther(E, id); if (RG[o] && rcOk(RG[o]) && !rcIsOpen(o)) front.add(o); }));
  return { open, front: [...front] };
}
function mrPickSpec(c, L, T) {
  const { open, front } = mrRegions(), home = mr$(() => rgHome().id, '');
  const maxR = [0, 1, 1, 2, 3, 3][L] || 0;
  const cands = id => (RG[id].res || []).filter(x => (x.rar || 0) <= (open.includes(id) ? maxR : Math.min(1, maxR)));
  const useFront = front.length && Math.random() < 0.2;
  const regs = (useFront ? front : open).filter(id => cands(id).length);
  if (!regs.length) return null;
  const rw = id => (id === home ? 1 : 1.5);
  let t = regs.reduce((a, id) => a + rw(id), 0), v = Math.random() * t, reg = regs[0];
  for (const id of regs) { v -= rw(id); if (v <= 0) { reg = id; break; } }
  const pool = cands(reg).map(x => {
    const r = { k: 'reg', rid: x.id, name: x.name, n: 1, src: { region: x.region } };
    let w = (x.rar || 0) ? 0.7 : 1;
    if (T && mr$(() => bqFitReq(T, r), true)) w *= 2.2; else if (T) w *= 0.6;
    if (c.likes.some(k => ING[k] && ING[k][0].includes(x.sub))) w *= 2;
    return [r, w];
  });
  t = pool.reduce((a, p) => a + p[1], 0); v = Math.random() * t;
  for (const [r, w] of pool) { v -= w; if (v <= 0) return r; }
  return pool[pool.length - 1][0];
}
// les tranches : le quartier, les alentours (< 60 km), la région (60-250 km), le lointain (> 250 km ou région fermée)
const MR_BANDS = [[0, 0], [0, 60], [60, 250], [250, 1e9]];
const mrAugReg = id => mr$(() => !!augCamps()[id] || (akStep() && akStep().C.reg === id) || (Object.values(augCamps()).length && Object.keys(augCamps()).some(c => (augNext(c) || {}).id === id)), false);
function mrPickBand(c, L, T) {
  const { open, front } = mrRegions(), maxR = [0, 1, 1, 2, 3, 3][L] || 0, all = [];
  open.concat(front).forEach(id => (RG[id].res || []).forEach(x => {
    const lock = !open.includes(id); if ((x.rar || 0) > (lock ? Math.min(1, maxR) : maxR)) return;
    const O = mrOrigin(x.id); if (!O) return;
    const r = { k: 'reg', rid: x.id, name: x.name, n: 1, src: { region: x.region } };
    let w = (x.rar || 0) ? 0.7 : 1;
    if (T && mr$(() => bqFitReq(T, r), true)) w *= 2.2; else if (T) w *= 0.6;
    if (c.likes.some(k => ING[k] && ING[k][0].includes(x.sub))) w *= 2;
    // v105 : l'histoire et les clients se rejoignent : les régions où Augustine est passée (camp trouvé) ou que vous suivez
    if (mrAugReg(id)) { w *= 2.5; r.aug = 1; }
    all.push({ r, w, km: lock ? Math.max(O.km, 250) : O.km });
  }));
  // les alentours : aussi la nature autour de chez soi (forêt, lac, campagne, rivière) ; toujours de quoi faire à moins de 60 km
  ['foret', 'lac', 'campagne', 'riviere', 'montagne'].forEach(tag => (LOOT[tag] || []).forEach(d => { if (d[3] <= Math.min(1, maxR) && d[1] !== 't') all.push({ r: { k: 'item', name: d[0], def: d, n: 1, src: { tag }, near: 1 }, w: 0.5, km: 30 }); }));
  const bands = MR_BANDS.map(([a, b], i) => i === 0 ? 'local' : all.filter(x => x.km >= a && x.km < b)).filter(b => b === 'local' || b.length);
  const B = bands[Math.floor(Math.random() * bands.length)];
  if (B === 'local') return 'local';
  const t = B.reduce((a, x) => a + x.w, 0); let v = Math.random() * t;
  for (const x of B) { v -= x.w; if (v <= 0) return x.r; }
  return B[B.length - 1].r;
}
// le merci de chaque client, lié à qui il est
const MR_MERCI = {
  noisette: 'recette', ondine: 'passage', roussette: 'rare', pompon: 'appat', hulotte: 'chemin', bruno: 'provisions', mimi: 'provisions',
  filou: 'rare', chips: 'chemin', gaston: 'outil', capucine: 'passage', rainette: 'chemin', moustache: 'rare', biscotte: 'provisions',
  frisette: 'provisions', clochette: 'recette', eucalypso: 'passage', pingo: 'outil', grignote: 'provisions', leonie: 'recette',
};
const MR_MLBL = { recette: ['📜', 'Une recette'], appat: ['🪤', 'Une recette d’appât'], chemin: ['🧭', 'Un chemin'], passage: ['⛵', 'Un passage'], outil: ['🎒', 'Du matériel'], provisions: ['🍲', 'Des provisions'], rare: ['💎', 'Un objet rare'] };
// v29 avait coupé les commandes (seule celle du tutoriel restait) : elles reviennent, au cœur du jeu.
// On demande au générateur une commande « simple » (un client et une demande du quartier), puis on l'oriente vers le vrai monde.
if (typeof cmPurgeOrders === 'function') cmPurgeOrders = function () {
  try { const s = bqState(), keep = o => !!(o && (o.mr || (o.tuto && S.tuto && S.tuto.on && S.tuto.o === o.id))), n0 = s.orders.length; s.orders = s.orders.filter(keep); return s.orders.length !== n0; } catch (e) { return false; }
};
if (typeof bqNewOrder === 'function') bqNewOrder = (orig => function (forceEasy) {
  if (forceEasy) return orig.apply(this, arguments);
  const o = orig.call(this, true);
  if (o) { o.mr = 1; delete o.tuto; }
  mr$(() => {
    if (!o) return;
    const s = bqState(), L = s.lvl, T = bqType(), c = BQC(o.client);
    if (o.req.some(r => r.k === 'comp' || r.k === 'egg' || r.k === 'bait')) return;
    // v97 (le joueur : « une disparité linéaire, autant de 2 km que de 50 ») : on tire d'abord une TRANCHE DE DISTANCE,
    // toutes aussi probables, puis une demande dans cette tranche. Les demandes ne s'éloignent pas avec le temps.
    if (s.served >= 1) { const r = mrPickBand(c, L, T); if (r === 'local') o.req = o.req.filter(x => x.k !== 'reg').length ? o.req.filter(x => x.k !== 'reg') : o.req; else if (r) o.req = [r]; }
    if (o.req.some(r => r.near)) { o.km = 30; o.coins = bqRound5(o.coins * 1.3); o.rep += 4; }
    // un camp vient d'être trouvé : la demande suivante vient de cette région, et le client en parle
    const st = mrSt(), camp = Object.keys(mr$(() => augCamps(), {})).find(id => !(st.augAsk || {})[id]);
    if (camp && RG[camp] && (RG[camp].res || []).length && s.served >= 1) {
      st.augAsk = st.augAsk || {}; st.augAsk[camp] = 1;
      const x = mrPick((RG[camp].res || []).filter(x => (x.rar || 0) <= 1)) || RG[camp].res[0];
      o.req = [{ k: 'reg', rid: x.id, name: x.name, n: 1, src: { region: x.region }, aug: 1 }]; o.augTalk = 1;
    }
    const rq = o.req.find(r => r.k === 'reg'); if (!rq) return;
    const R = RG[rq.src.region], O = mrOrigin(rq.rid), km = O ? O.km : mrKm(R), val = o.req.reduce((a, r) => a + bqReqValue(r), 0);
    o.km = km; o.locked = !rcIsOpen(R.id);
    o.coins = bqRound5((25 + 2.5 * val) * bqLv(L).rich * c.rich * (1 + km / 350));
    o.rep = Math.round(Math.min(120, o.rep + km / 15));
    if (km >= 60 || o.locked) { o.deadline = 0; const m = MR_MERCI[c.id] || 'provisions'; o.merci = m; delete o.bonus; }
  });
  return o;
})(bqNewOrder);
// « où » : la distance depuis la boutique, et la région fermée
if (typeof bqReqWhere === 'function') bqReqWhere = (orig => function (r) {
  let w = orig.apply(this, arguments);
  mr$(() => { if (r.k !== 'reg' || !r.src || !RG[r.src.region]) return; const R = RG[r.src.region], O = mrOrigin(r.rid); if (O && O.km > 5) w = `${O.c !== R.short ? `Vers ${O.c}, ` : ''}${R.short} · ${O.km} km`; if (!rcIsOpen(R.id)) w += ' · 🔒 région pas encore ouverte'; if (mrAugReg(R.id)) w += ' · 📖 sur la route d’Augustine'; });
  return w;
})(bqReqWhere);
// la carte de commande montre le merci
if (typeof bqOrderCard === 'function') bqOrderCard = (orig => function (o) {
  let h = orig.apply(this, arguments);
  mr$(() => { if (!o.merci) return; const L = MR_MLBL[o.merci]; h = h.replace('<div class="bq-rew">', `<div class="bq-rew"><span class="bq-bonus mr-merci" title="Le merci de ce client"><span class="bq-bi">${L[0]}</span>${L[1]}</span>`); });
  return h;
})(bqOrderCard);

// la carte de demande du comptoir (37) : la distance et le vrai lieu, le merci du client
if (typeof cmOrdersHTML === 'function') cmOrdersHTML = function () {
  const s = bqState(); if (!s.orders.length) return '';
  return `<section class="cm-ords"><h3 class="cz-h">${CZ_IC.cmd}<span>${s.served ? 'Les demandes de vos clients' : 'Votre premier client'}</span></h3><div class="b2cards">${s.orders.map(cmOrderCard).join('')}</div></section>`;
};
if (typeof cmOrderCard === 'function') cmOrderCard = (orig => function (o) {
  let h = orig.apply(this, arguments);
  mr$(() => {
    if (!o.mr) return;
    const rq = o.req.find(r => r.k === 'reg'), O = rq && mrOrigin(rq.rid);
    const tag = O ? `📍 ${O.km} km` : o.req.some(r => r.near) ? '📍 Alentours' : '📍 Quartier';
    h = h.replace(/<span class="cm-tier">[^<]*<\/span>/, `<span class="cm-tier mr-km">${tag}</span>`);
    const where = rq ? esc(bqReqWhere(rq)) : esc(bqReqWhere(o.req[0]) || '');
    if (where) h = h.replace(/(<p class="b2lbl[^"]*">[\s\S]*?<\/p>)/, `$1<p class="mr-where">${where}</p>`);
    if (o.augTalk) h = h.replace(/(<p class="mr-where">[\s\S]*?<\/p>)/, `$1<p class="mr-aug">« On dit que vous suivez Augustine… Elle m’en rapportait de là-bas ! »</p>`);
  });
  return h;
})(cmOrderCard);
if (typeof cmRwHTML === 'function') cmRwHTML = (orig => function (o) {
  let h = orig.apply(this, arguments);
  mr$(() => { if (!o.merci) return; const L = MR_MLBL[o.merci]; h = h.replace(/<span class="cm-rwi[^"]*">[\s\S]*?<\/span><span class="cm-rwx"><b>[^<]*<\/b>/, `<span class="cm-rwi k-merci">${L[0]}</span><span class="cm-rwx"><b>${esc(L[1])} en merci</b>`); });
  return h;
})(cmRwHTML);

// ---------- 3 · donner le merci ----------
const mrPick = a => a[Math.floor(Math.random() * a.length)];
function mrProv(n) {
  const kinds = ['chaud', 'frais', 'end'], k = mrPick(kinds), rids = Object.keys(CM_R).filter(rid => mr$(() => eqKindOf(rid), null) === k); if (!rids.length) return null;
  const out = [];
  for (let i = 0; i < n; i++) { const R = CM_R[mrPick(rids)], it = makeItem(R.def, 0, 'Cadeau', [], { fixed: R.def[3] || 0 }); it.mk = { shop: R.shop, rid: R.id, st: 2, p: mr$(() => cmPrice(R, 2), 10) }; S.inv.push(it); out.push(it.name); }
  return `${n} provisions « ${({ chaud: 'Chaleur', frais: 'Fraîcheur', end: 'Endurance' })[k]} » (${out[0]}…)`;
}
function mrChemin(regId) {
  const ids = [regId].concat(mr$(() => sctOpenIds(), [])).filter(id => id && RG[id] && rcIsOpen(id));
  for (const id of ids) {
    const g = mr$(() => sctGrid(id), null); if (!g) continue;
    const V = sctVis(id); const cand = g.pts.filter(([lon, lat]) => !V.some(([a, b]) => sctKm(a, b, lon, lat) < g.r * 1.2));
    if (!cand.length) continue;
    // le coin dans la brume le plus proche de ce qu'on connaît : un vrai raccourci
    cand.sort((p, q) => Math.min(...V.map(([a, b]) => sctKm(a, b, p[0], p[1]))) - Math.min(...V.map(([a, b]) => sctKm(a, b, q[0], q[1]))));
    const [lon, lat] = cand[Math.min(cand.length - 1, 2)];
    sctVisit({ lon, lat }, true);
    return `un chemin : la brume se lève près de ${mr$(() => nearestCityName(lon, lat), RG[id].short)} (${RG[id].short})`;
  }
  return null;
}
function mrPassage(c) {
  const pref = { ondine: ['mer', 'ocean', 'riviere'], eucalypso: ['ocean', 'mer', 'desert', 'jungle'], capucine: ['riviere', 'marais', 'mer'], pingo: ['glace'] }[c.id] || [];
  const L = PS_EDGES.filter(E => { const f = psFrom(E); return f && rcIsOpen(f) && !psSt().done[psKey(E)] && !mr$(() => tvKnown(E), true); });
  if (!L.length) return null;
  L.sort((a, b) => (pref.includes(b[2]) ? 1 : 0) - (pref.includes(a[2]) ? 1 : 0));
  const E = L[0]; mrSt().rev = mrSt().rev || {}; mrSt().rev[psKey(E)] = 1;
  return `un passage : ${E[3] || PS_T[E[2]].nm} ${PS_T[E[2]].ico}, vers ${RG[psTo(E)].short}`;
}
// un passage révélé par un client est connu
if (typeof tvKnown === 'function') tvKnown = (orig => function (E) { return !!(S.mr && S.mr.rev && S.mr.rev[psKey(E)]) || orig.apply(this, arguments); })(tvKnown);
function mrOutil(c) {
  const g = { pingo: 'crampons', gaston: mrPick(['crampons', 'palmes', 'lampe', 'boussole']) }[c.id] || 'boussole';
  const gg = XP_G[g] ? g : 'boussole';
  const it = mr$(() => makeItem(xpGearDef(gg, 1), 0, `Cadeau de ${c.name}`, [], { fixed: 1 }), null); if (!it) return null;
  S.inv.push(it); S.dex[it.name] = true; return `du matériel : ${it.name}`;
}
function mrRecette() {
  const s = bqState(), r = BQ_RECIPES.find(x => x.lvl <= s.lvl + 2 && !s.recipes.includes(x.id)); if (!r) return null;
  s.recipes.push(r.id); return `sa recette : ${r.out[0]}`;
}
function mrAppat(regId) {
  const X = mr$(() => augSpFor(regId || rgHome().id), null); if (!X) return null;
  sctSt().learn[X.sp] = 1; mr$(augSyncHB); return `la recette d’appât « ${augBaitNm(X.sp)} » (${augPlural(X.sp)})`;
}
function mrRare(o) {
  const rq = o.req.find(r => r.k === 'reg'), R = rq && RG[rq.src.region]; if (!R) return null;
  const x = (R.res || []).filter(x => (x.rar || 0) >= 2).sort(() => Math.random() - 0.5)[0] || (R.res || [])[0]; if (!x) return null;
  const it = mr$(() => rgMakeRes(x, `Cadeau (${R.short})`, [], { region: R.id, km: mrKm(R) }), null); if (!it) return null;
  S.inv.push(it); S.dex[it.name] = true; return `un objet rare : ${it.name}`;
}
function mrGive(o, c) {
  const rq = o.req.find(r => r.k === 'reg'), reg = rq && rq.src.region;
  const tries = { recette: [mrRecette, () => mrProv(2)], appat: [() => mrAppat(reg), mrRecette], chemin: [() => mrChemin(reg), () => mrProv(2)], passage: [() => mrPassage(c), () => mrChemin(reg)], outil: [() => mrOutil(c), () => mrProv(2)], provisions: [() => mrProv(3)], rare: [() => mrRare(o), () => mrProv(2)] }[o.merci] || [() => mrProv(2)];
  for (const f of tries) { const t = mr$(f, null); if (t) return t; }
  return null;
}
if (typeof bqDeliver === 'function') bqDeliver = (orig => function (id) {
  const s = bqState(), o = s.orders.find(x => x.id === id), c = o && BQC(o.client);
  const r = orig.apply(this, arguments);
  mr$(() => {
    if (!o || s.orders.includes(o)) return; // pas livrée
    const msgs = [];
    if (o.merci) { const t = mrGive(o, c); if (t) msgs.push(`🎁 ${c.name} vous remercie avec ${t}.`); }
    // le plus rare : un correspondant là-bas
    const rq = o.req.find(x => x.k === 'reg'), reg = rq && rq.src.region, home = mr$(() => rgHome().id, '');
    if (reg && reg !== home && (o.km || 0) >= 250 && !mrSt().corr[reg] && Math.random() < 0.3) { mrSt().corr[reg] = { client: c.id, at: Date.now(), day: '' }; msgs.push(`📬 ${c.name} devient votre correspondant${c.label && /^la /.test(c.label) ? 'e' : ''} en ${RG[reg].short} : chaque jour, une spécialité de là-bas vous attend.`); }
    if (!msgs.length) return;
    save();
    setTimeout(() => mr$(() => showModal(`<div class="mr-thx"><img src="${clientURI(c, 'joie')}" alt=""><h2>Merci !</h2>${msgs.map(m => `<p>${esc(m)}</p>`).join('')}<button class="btn green big wide" data-closemodal="1">Super</button></div>`)), 1700);
  });
  return r;
})(bqDeliver);

// ---------- 4 · les correspondants ----------
const mrDay = () => { const d = new Date(); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
function mrCorrTick() {
  if (document.body.classList.contains('firstrun')) return;
  const st = mrSt(), day = mrDay(), got = [];
  Object.entries(st.corr).forEach(([reg, C]) => {
    if (C.day === day || !RG[reg]) return; C.day = day;
    const x = mrPick((RG[reg].res || []).filter(x => (x.rar || 0) <= 1)); if (!x) return;
    const it = mr$(() => rgMakeRes(x, `Envoi de ${BQC(C.client).name} (${RG[reg].short})`, [], { region: reg, km: mrKm(RG[reg]) }), null); if (!it) return;
    S.inv.push(it); S.dex[it.name] = true; got.push(`${it.name} (${RG[reg].short})`);
  });
  if (got.length) { save(); mr$(() => toast(`📬 Courrier de vos correspondants : ${got.join(', ')}`)); }
}
setInterval(() => { if (!document.hidden) mr$(mrCorrTick); }, 30e3);
setTimeout(() => mr$(mrCorrTick), 8000);
window.__mr = { spec: () => mrPickSpec(BQ_CLIENTS[0], 2, bqType()), regions: mrRegions, give: (o, c) => mrGive(o, c), corr: () => mrSt().corr };

{
  const css = document.createElement('style');
  css.textContent = `
.mr-merci{background:#fff3c9!important;border-color:#f2c14e!important}
.cm-tier.mr-km{background:#eef7f6!important;color:#2f6f6a!important}
.mr-aug{margin:-2px 0 6px;font:700 15px/1.2 'Caveat',cursive;color:#9a4a0e;text-align:center}
.mr-where{margin:-2px 0 6px;font:700 12px var(--body,system-ui);color:#7a6a5c;text-align:center}
.cm-rwi.k-merci{font-size:22px;display:flex;align-items:center;justify-content:center}
.mr-thx{text-align:center}.mr-thx img{width:96px;height:96px}.mr-thx h2{margin:4px 0 8px;font:800 24px var(--display,system-ui);color:#4a3528}
.mr-thx p{margin:0 0 10px;padding:9px 12px;border-radius:14px;background:#fff8e6;border:2px solid #f2d58a;font:700 14px/1.4 var(--body,system-ui);color:#4a3528;text-align:left}
`;
  document.head.appendChild(css);
}

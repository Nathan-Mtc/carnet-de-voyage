// ================= ÉQUIPAGE : LE FAMILIER ET LES PERSONNAGES (v30, étape 2, bloc C) =================
// Sans nouvel écran : panneau de départ, fiche du familier (Compagnons › Talents), aventure vécue (journal), butin,
// page Quêtes, comptoir (recettes et onglet Clients), barre des compagnons.
// 1. SAC À PROVISIONS : 0 à 3 plats du commerce (produits finis it.mk, famille nourriture) mis dans le sac au départ, mangés en route.
//    Endurance (longues expéditions : moins de risques et UN demi-tour évité), chaleur (froid, un peu la montagne),
//    fraîcheur (désert), moral (meilleur butin : chance et +1 objet par plat). Conseil en une ligne pour les expéditions.
// 2. SPÉCIALITÉ : au niveau 10, un bouton sur la fiche (6 spécialités). Vrai bonus + 1 lieu réservé avec trésor unique et titre.
//    CROISSANCE : petit, aguerri, légendaire (badge sur le portrait : pousse, foulard, étoile) ; titre choisi affiché sous le nom.
// 3. DUO : un 2e familier libre part avec le premier (occupé aussi). L'un porte (+1 objet), l'autre guide (moins de risques).
//    Amitié par paire (voyages communs), 4 paliers avec petits bonus.
// 4. CONTRATS (1 ou 2, délai 2 à 4 jours, client du comptoir) et RIVAL (Gaspard le renard) qui court parfois après le même contrat.
// 5. LIVRAISONS URGENTES : un client du comptoir veut un de vos produits livré dans une autre vraie ville, avant un délai.
// État : S.eqp = { sp: {k: id}, ti: {k: titre}, tx: {k: [titres]}, ami: {"a|b": n}, duo: {partenaire: meneur}, wsp: {id: k},
//   con: [contrats], cn, hist: [..], riv: {cid, st, dur, w, l, rev, last}, del, dn, dlast }.
// Enveloppes : startTrip, collect, showHaul, fireEvent, avApply, xpRiskK, xpPinLab, renderVoyage, renderTalents, renderComps,
// qtPageHTML, cmRecipesHTML, cfClientsHTML. Expose window.__eq (tests).

const eqCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const eqNm = k => (k && CHARS[k] ? CHARS[k].name : '');
const eqE = k => eqCall(() => compE(k), '');
const eqTuto = () => eqCall(() => tuOn(), false);
const eqKm = (a, b) => eqCall(() => d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]) * 6371, 1e9);
const eqLow = s => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);
const eqLeft = ms => { ms = Math.max(0, ms); const h = Math.floor(ms / 36e5); return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : h >= 1 ? `${h} h ${String(Math.floor(ms / 6e4) % 60).padStart(2, '0')}` : `${Math.ceil(ms / 6e4)} min`; };
function eqState() {
  if (!S.eqp || typeof S.eqp !== 'object' || Array.isArray(S.eqp)) S.eqp = {};
  const E = S.eqp;
  ['sp', 'ti', 'tx', 'ami', 'duo', 'wsp'].forEach(k => { if (!E[k] || typeof E[k] !== 'object' || Array.isArray(E[k])) E[k] = {}; });
  if (!Array.isArray(E.con)) E.con = [];
  if (!Array.isArray(E.hist)) E.hist = [];
  if (!E.riv || typeof E.riv !== 'object') E.riv = { cid: null, st: 0, dur: 0, w: 0, l: 0, rev: 0, last: null };
  if (E.dn == null) E.dn = Date.now() + 15 * 6e4;
  if (E.cn == null) E.cn = 0;
  return E;
}

// ---------------- 1. provisions ----------------
// kind : end (endurance), chaud (chaleur), frais (fraîcheur), moral
const EQ_KIND = { ca_the: 'chaud', ca_choco: 'chaud', ca_creme: 'chaud', ca_viennois: 'chaud', ca_monde: 'chaud', re_soupe: 'chaud', re_fondue: 'chaud', re_gratin: 'chaud',
  ca_citron: 'frais', ca_jus: 'frais', ep_jus: 'frais', gl_citron: 'frais', gl_bois: 'frais', gl_cornet: 'frais', gl_shake: 'frais', gl_coupe: 'frais', gl_monde: 'frais', gl_bombe: 'frais',
  bo_piece: 'moral', bo_tarte: 'moral', re_festin: 'moral', re_monde: 'moral', an_exo: 'moral', an_fruits: 'moral', ep_confiture: 'moral', ep_gourmand: 'moral', ep_coffret: 'moral', ep_epices: 'moral' };
const EQ_K = { end: ['Endurance', '#c9853a', 'longues expéditions : moins de risques, un demi-tour évité', 'pour tenir la distance', 'Gâteau du voyageur'],
  chaud: ['Chaleur', '#d9604f', 'le froid devient moins risqué', 'pour le froid', 'Chocolat chaud'],
  frais: ['Fraîcheur', '#3fa0c9', 'le désert devient moins risqué', 'pour la chaleur du désert', 'Citronnade'],
  moral: ['Moral', '#d99a25', 'meilleur butin (+1 objet par plat)', 'pour le moral (meilleur butin)', 'Grand festin'] };
const eqKindOf = rid => { const R = CM_R[rid]; if (!R || R.egg || R.def[1] !== 'n') return null; return EQ_KIND[rid] || 'end'; };
const eqFood = () => eqCall(() => cmProducts(), []).filter(it => it.mk && eqKindOf(it.mk.rid));
function eqStock() { const by = {}; eqFood().forEach(it => { by[it.mk.rid] = (by[it.mk.rid] || 0) + 1; }); return by; }
// plan.eqProv : liste de recettes (une entrée par plat)
function eqPlanProv() {
  if (!Array.isArray(plan.eqProv)) plan.eqProv = [];
  const st = eqStock(), used = {};
  plan.eqProv = plan.eqProv.filter(rid => { used[rid] = (used[rid] || 0) + 1; return used[rid] <= (st[rid] || 0); }).slice(0, 3);
  return plan.eqProv;
}
function eqCount(rids) { const P = { end: 0, chaud: 0, frais: 0, moral: 0 }; (rids || []).forEach(r => { const k = eqKindOf(r); if (k) P[k]++; }); return P; }
const EQ_ICO_BAG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 15 Q10 9 20 9 Q30 9 30 15 V33 Q30 36 27 36 H13 Q10 36 10 33Z" fill="#c98a5a" stroke="#5b4636" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 9 Q15 4 20 4 Q25 4 25 9" fill="none" stroke="#5b4636" stroke-width="2.2"/><rect x="14" y="20" width="12" height="8" rx="2" fill="#e9b07a" stroke="#5b4636" stroke-width="1.8"/><path d="M10 17 H30" stroke="#5b4636" stroke-width="1.8"/></svg>';
const eqRIco = (rid, uid) => eqCall(() => cmIcon(CM_R[rid], uid), '');
const eqRName = rid => (CM_R[rid] ? CM_R[rid].def[0] : rid);

// ---------------- 2. spécialités ----------------
const EQ_SP = {
  alpi: { nm: 'Alpiniste', g: 'mont', col: '#7f8fb0', txt: '−30 % de risques en montagne et dans le grand froid', terr: ['montagne', 'froid'],
    pl: { name: 'Refuge secret du Grand Paradis', lon: 7.266, lat: 45.517, tags: ['montagne', 'neige'], it: ['Piolet d’or', 'm', 'outil', 4, null, '#e0a52a'], ti: 'Premier de cordée' } },
  plong: { nm: 'Plongeur', g: 'vague', col: '#3f8ac0', txt: '−30 % de risques en mer, +1 trésor marin à chaque voyage en mer', terr: ['mer'],
    pl: { name: 'Trou bleu de Dahab', lon: 34.537, lat: 28.572, tags: ['mer'], it: ['Perle bleue de Dahab', 'm', 'perle', 4, null, '#3f8ac0'], ti: 'Seigneur des profondeurs' } },
  archeo: { nm: 'Archéologue', g: 'colonne', col: '#c9853a', txt: '−25 % de risques au désert et dans les grottes, parfois un fragment antique unique', terr: ['desert'], cave: 1,
    pl: { name: 'Cité de Pétra', lon: 35.444, lat: 30.329, tags: ['desert', 'monument'], it: ['Tablette de Pétra', 'd', 'statue', 4, null, '#d9733f'], ti: 'Déchiffreur de Pétra' } },
  bota: { nm: 'Botaniste', g: 'feuille', col: '#4f9a5f', txt: '−30 % de risques en forêt, +1 trouvaille végétale à chaque voyage', terr: ['foret'],
    pl: { name: 'Forêt de nuages de Monteverde', lon: -84.8, lat: 10.3, tags: ['foret'], it: ['Orchidée des nuages', 'd', 'plante', 4, null, '#c58ad9'], ti: 'Ami des orchidées' } },
  photo: { nm: 'Photographe animalier', g: 'arbre', col: '#6a7a4a', txt: '−30 % de risques face aux animaux rares, plus de chance partout', wild: 1,
    pl: { name: 'Parc de Yellowstone', lon: -110.59, lat: 44.43, tags: ['foret', 'montagne'], it: ['Photo du loup de Yellowstone', 'd', 'herbier', 4, null, '#7a8a9a'], ti: 'Œil de lynx' } },
  march: { nm: 'Marchand', g: 'tour', col: '#b0782f', txt: '+25 % de pièces en voyage, livraisons urgentes +50 %',
    pl: { name: 'Grand Bazar d’Istanbul', lon: 28.968, lat: 41.0106, tags: ['ville', 'monument'], it: ['Lampe du Grand Bazar', 'd', 'lampe', 4, null, '#e0a52a'], ti: 'Prince du bazar' } },
};
const EQ_SP_LVL = 10;
const eqSpec = k => (k ? eqState().sp[k] || null : null);
const eqSpIco = (id, cls = 's') => { const P = EQ_SP[id]; return P ? eqCall(() => xpGly(P.g, P.col, cls), '') : ''; };
function eqPickSpec(k, id) {
  if (!CHARS[k] || !EQ_SP[id] || eqSpec(k)) return false;
  if (((S.prog[k] && S.prog[k].lvl) || 1) < EQ_SP_LVL) return false;
  const E = eqState(); E.sp[k] = id; eqAddTitle(k, EQ_SP[id].nm + (eqE(k) && id === 'march' ? 'e' : '')); save(); return true;
}
const eqSpDest = id => { const P = EQ_SP[id].pl; return { id: null, eqsp: id, name: P.name, country: '', lat: P.lat, lon: P.lon, tags: P.tags.slice(), special: null }; };
// titres gagnés (41, 43, et ceux d'ici)
function eqAddTitle(k, t) { const E = eqState(); const a = Array.isArray(E.tx[k]) ? E.tx[k] : (E.tx[k] = []); if (!a.includes(t)) a.push(t); }
function eqTitles(k) {
  const a = eqCall(() => (Array.isArray(xpState().titles[k]) ? xpState().titles[k] : []), []);
  return [...new Set(a.concat(eqState().tx[k] || []))];
}
const EQ_STAGE = ['', 'Petit', 'Aguerri', 'Légendaire'];
function eqStage(k) {
  const lv = (S.prog[k] && S.prog[k].lvl) || 1, nt = eqTitles(k).length, sp = eqSpec(k), won = sp && eqState().wsp[sp];
  if (lv >= 20 || (won && nt >= 3)) return 3;
  if (lv >= EQ_SP_LVL || nt >= 2) return 2;
  return 1;
}
const eqStageWord = (k, st) => (st === 1 ? 'Petit explorateur' : st === 2 ? 'Explorateur aguerri' : 'Explorateur légendaire').replace(/eur/, eqE(k) ? 'rice' : 'eur').replace(/Petit e/, eqE(k) ? 'Petite e' : 'Petit e').replace(/aguerri/, eqE(k) ? 'aguerrie' : 'aguerri');
function eqTitle(k) { const t = eqState().ti[k]; return t && eqTitles(k).includes(t) ? t : eqStageWord(k, eqStage(k)); }
// badge permanent : pousse (petit), foulard d'explorateur (aguerri), étoile dorée sur foulard (légendaire)
function eqBadge(k, cls = '') {
  const st = eqStage(k);
  const svg = st === 1 ? '<path d="M12 20 V12" stroke="#4f8a3f" stroke-width="2.2" stroke-linecap="round"/><path d="M12 13 Q6 13 5 7 Q11 7 12 13Z M12 11 Q17 10 19 5 Q13 5 12 11Z" fill="#7fbf5f" stroke="#4f8a3f" stroke-width="1.4"/>'
    : st === 2 ? '<path d="M3 6 H21 L12 21Z" fill="#d9483f" stroke="#7a2a24" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="9" r="1.2" fill="#fff"/><circle cx="14" cy="10" r="1.2" fill="#fff"/><circle cx="11" cy="14" r="1.2" fill="#fff"/>'
    : '<path d="M3 8 H21 L12 22Z" fill="#d9483f" stroke="#7a2a24" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 1.5 L14.3 6.3 L19.5 6.9 L15.6 10.4 L16.7 15.6 L12 13 L7.3 15.6 L8.4 10.4 L4.5 6.9 L9.7 6.3Z" fill="#f6c445" stroke="#a8781a" stroke-width="1.3" stroke-linejoin="round"/>';
  return `<span class="eq-bdg st${st} ${cls}" title="${EQ_STAGE[st]}" aria-label="Stade : ${EQ_STAGE[st]}"><svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg></span>`;
}

// ---------------- 3. duo ----------------
const EQ_AMI = [[1, 'Copains'], [3, 'Amis'], [6, 'Inséparables'], [10, 'Âmes sœurs']];
const eqAmiKey = (a, b) => [a, b].sort().join('|');
const eqAmiN = (a, b) => +eqState().ami[eqAmiKey(a, b)] || 0;
const eqAmiLv = (a, b) => EQ_AMI.filter(([n]) => eqAmiN(a, b) >= n).length;
const eqAmiNm = lv => (lv ? EQ_AMI[lv - 1][1] : 'Nouveaux compagnons');
function eqBusyWith(k) {
  const E = eqState(), lead = E.duo[k]; if (!lead) return null;
  const t = S.trips && S.trips[lead];
  if (t && t.eqDuo === k) return lead;
  delete E.duo[k]; return null;
}
const eqFree = k => !!(k && CHARS[k] && S.comps && S.comps[k] && !S.trips[k] && !eqBusyWith(k) && !(eqCall(() => xpHurtLeft(k), 0) > 0));
function eqPlanDuo() { const p = plan.eqDuo; if (!p || p === S.sel || !eqFree(p)) { plan.eqDuo = null; return null; } return p; }
// qui porte, qui guide (le meilleur niveau du terrain guide)
function eqRoles(k, p, terr) { const a = eqCall(() => xpLvl(k, terr), 1), b = eqCall(() => xpLvl(p, terr), 1); return b > a ? { guide: p, porte: k, gl: b } : { guide: k, porte: p, gl: a }; }

// ---------------- risques ----------------
let eqNoCtx = false;
function eqCtx(k) {
  if (eqNoCtx || eqTuto()) return null;
  const t = S.trips && S.trips[k];
  if (t) return t.done || t.tuto ? null : { prov: t.eqProv || null, duo: t.eqDuo || null, long: !!t.eqLong };
  if (k === S.sel && plan.dest) { const d = plan.dest; return { prov: eqCount(eqPlanProv()), duo: eqPlanDuo(), long: eqIsLong(d) }; }
  return null;
}
const eqIsLong = d => !!d && (!!d.xpl || !!d.mysx || eqCall(() => kmBetween(homeObj(), d), 0) >= 2500);
const EQ_PM = [1, 0.7, 0.55, 0.45], EQ_PM2 = [1, 0.85, 0.75, 0.68];
function eqRiskMul(k, c, C) {
  let m = 1; const P = C.prov || {};
  if (c.terr === 'froid') m *= EQ_PM[Math.min(3, P.chaud || 0)];
  if (c.terr === 'montagne') m *= EQ_PM2[Math.min(3, P.chaud || 0)];
  if (c.terr === 'desert') m *= EQ_PM[Math.min(3, P.frais || 0)];
  if (C.long) m *= EQ_PM2[Math.min(3, P.end || 0)];
  [k, C.duo].filter(Boolean).forEach(x => { const sp = EQ_SP[eqSpec(x)]; if (!sp) return; if ((sp.terr && sp.terr.includes(c.terr)) || (sp.cave && (c.cave || c.night)) || (sp.wild && c.wild)) m *= sp.cave ? 0.75 : 0.7; });
  if (C.duo) {
    m *= 0.85;
    if (eqCall(() => xpLvl(C.duo, c.terr), 1) > eqCall(() => xpLvl(k, c.terr), 1)) m *= 0.85;
    m *= 1 - 0.05 * eqAmiLv(k, C.duo);
  }
  return m;
}
if (typeof xpRiskK === 'function') xpRiskK = (orig => function (k, c) {
  const r = orig.apply(this, arguments);
  try { const C = r > 0 && c ? eqCtx(k) : null; if (C) return Math.max(0.03, Math.min(0.9, r * eqRiskMul(k, c, C))); } catch (e) {}
  return r;
})(xpRiskK);
// risque affiché : sans puis avec provisions, duo et spécialité
function eqRiskPair(k, d) {
  if (!d || !eqCall(() => xpIsExpe(d), false)) return null;
  const c = xpCtxOf(d), P = d.xpl ? XP_P[d.xpl] : null, miss = P ? xpMiss(P, k).length > 0 : false;
  eqNoCtx = true; let a; try { a = xpRiskK(k, c, miss, 0.35); } finally { eqNoCtx = false; }
  return [a, xpRiskK(k, c, miss, 0.35)];
}
// conseil : quels plats emporter
function eqAdvice(k, d) {
  if (!d || !eqCall(() => xpIsExpe(d), false)) return '';
  const c = xpCtxOf(d), want = [];
  if (c.terr === 'froid' || c.terr === 'montagne') want.push('chaud');
  if (c.terr === 'desert') want.push('frais');
  if (eqIsLong(d)) want.push('end');
  if (d.xpl || d.mysx || d.eqsp) want.push('moral');
  if (!want.length) return '';
  const st = eqStock(), T = eqCall(() => cmT(), null), line = T ? (CM_LINES[T.id] || []) : [];
  const nameFor = kd => { const inS = Object.keys(st).find(r => eqKindOf(r) === kd); if (inS) return eqRName(inS); const R = line.find(x => eqKindOf(x.id) === kd && eqCall(() => cmUnlocked(x), false)); return R ? R.def[0] : EQ_K[kd][4]; };
  return 'Conseillé : ' + want.slice(0, 2).map(kd => `1 ${eqLow(nameFor(kd))} ${EQ_K[kd][3]}`).join(' · ');
}

// ---------------- 4. contrats et rival ----------------
const EQ_CT = [
  { ty: 'cont', n: 3, t: '3 objets de 3 continents différents', coins: 900, stones: 8 },
  { ty: 'lieux', t: 'Un objet de chaque phare de Bretagne', L: [['Phare d’Eckmühl', -4.3725, 47.7978], ['Phare du Créac’h (Ouessant)', -5.1294, 48.4594], ['Phare du Petit Minou', -4.6153, 48.3369]], coins: 700, stones: 6 },
  { ty: 'lieux', t: 'Un souvenir de Rome, de Londres et de Madrid', L: [['Rome', 12.4964, 41.9028], ['Londres', -0.1276, 51.5072], ['Madrid', -3.7038, 40.4168]], coins: 900, stones: 7 },
  { ty: 'terr', terr: 'montagne', n: 2, t: '2 voyages en montagne, le sac plein', coins: 600, stones: 5 },
  { ty: 'terr', terr: 'mer', n: 2, t: '2 voyages en mer ou sur une île, le sac plein', coins: 600, stones: 5 },
  { ty: 'rare', n: 2, t: '2 objets épiques ou mieux', coins: 800, stones: 6 },
];
const EQ_CLI = ['hulotte', 'filou', 'moustache', 'eucalypso', 'ondine', 'leonie', 'pingo', 'roussette'];
const EQ_RIVAL = { id: 'eq_rival', name: 'Gaspard', sp: 'renard', cloth: '#3a3550', acc: 'chapeau', accC: '#1f1b2e' };
const eqRivalImg = (mood, cls = '') => { const u = eqCall(() => clientURI(EQ_RIVAL, mood), ''); return u ? `<img class="eq-rimg ${cls}" src="${u}" alt="Gaspard le renard">` : ''; };
const eqCliImg = (cid, mood = 'content') => { const c = eqCall(() => BQC(cid), null); const u = c ? eqCall(() => clientURI(c, mood), '') : ''; return u ? `<img class="eq-cimg" src="${u}" alt="">` : ''; };
const eqCliNm = cid => eqCall(() => BQC(cid).name, 'Un collectionneur');
function eqContinent(lon, lat) {
  if (lat >= 35 && lon >= -25 && lon <= 45) return 'Europe';
  if (lon <= -30 && lon >= -170 && lat >= 12) return 'Amérique du Nord';
  if (lon <= -30 && lon >= -95 && lat < 12) return 'Amérique du Sud';
  if ((lon >= 110 && lat < -10) || (lon <= -130 && lat < 0)) return 'Océanie';
  if (lat < 37 && lon >= -20 && lon <= 52) return 'Afrique';
  return 'Asie';
}
const eqCDef = c => EQ_CT[c.k] || EQ_CT[0];
const eqCN = c => { const D = eqCDef(c); return D.ty === 'lieux' ? D.L.length : D.n; };
const eqCCur = c => (Array.isArray(c.got) ? c.got.filter(Boolean).length : +c.got || 0);
function eqNewContract(k, opt = {}) {
  const E = eqState(), now = Date.now();
  if (k == null) { const used = E.con.map(c => c.k); const pool = EQ_CT.map((_, i) => i).filter(i => !used.includes(i)); k = pool[Math.floor(Math.random() * pool.length)]; }
  if (k == null || !EQ_CT[k]) return null;
  const D = EQ_CT[k], days = 2 + Math.floor(Math.random() * 3);
  const c = { id: 'ct' + now.toString(36) + Math.floor(Math.random() * 1e4), k, cid: EQ_CLI[Math.floor(Math.random() * EQ_CLI.length)], st: now, end: now + days * 864e5, got: D.ty === 'lieux' ? D.L.map(() => 0) : D.ty === 'cont' ? [] : 0, rev: opt.rev ? 1 : 0 };
  E.con.push(c);
  const R = E.riv;
  if (!R.cid && (opt.rival || (!opt.noRival && now >= (R.rev || 0) && Math.random() < 0.5))) { R.cid = c.id; R.st = now; R.dur = Math.round((c.end - c.st) * (0.5 + Math.random() * 0.3)); }
  save(); return c;
}
const eqRivP = () => { const R = eqState().riv; return R.cid ? Math.max(0, Math.min(1, (Date.now() - R.st) / Math.max(1, R.dur))) : 0; };
function eqHist(o) { const E = eqState(); E.hist.unshift(Object.assign({ at: Date.now() }, o)); E.hist.length = Math.min(E.hist.length, 4); }
function eqTick() {
  if (eqTuto() || !S || !S.trips) return false;
  const E = eqState(), now = Date.now(); let ch = false;
  // rival arrivé avant vous
  const R = E.riv;
  if (R.cid) {
    const c = E.con.find(x => x.id === R.cid);
    if (!c) R.cid = null;
    else if (eqRivP() >= 1) {
      E.con = E.con.filter(x => x !== c); R.cid = null; R.w = (R.w || 0) + 1; R.rev = now + 6 * 36e5; R.last = { k: 'win', t: eqCDef(c).t, at: now };
      eqHist({ t: eqCDef(c).t, res: 'rival' }); ch = true;
      eqCall(() => toast('Gaspard le renard a rempli le contrat avant vous… Revanche possible plus tard (page Quêtes).'), 0);
    }
  }
  // délais dépassés
  E.con.filter(c => now > c.end).forEach(c => { eqHist({ t: eqCDef(c).t, res: 'late' }); if (R.cid === c.id) R.cid = null; ch = true; });
  E.con = E.con.filter(c => now <= c.end);
  // nouveaux contrats (après le premier voyage)
  if (E.con.length < 2 && now >= (E.cn || 0) && ((S.stats && S.stats.trips) || 0) >= 1) { eqNewContract(); E.cn = now + 4 * 36e5; ch = true; }
  // livraisons urgentes
  const D = E.del;
  if (D && D.st === 'open' && now > D.end) { E.dlast = { res: 'late', cid: D.cid, at: now }; E.del = null; E.dn = now + 3 * 36e5; ch = true; }
  if (!E.del && now >= (E.dn || 0) && eqCall(() => cmT(), null) && ((S.stats && S.stats.trips) || 0) >= 1) { if (eqNewDel()) ch = true; else E.dn = now + 36e5; }
  if (ch) save();
  return ch;
}
// progression d'un contrat par un voyage rentré
function eqContractsOnReturn(t, out) {
  const E = eqState(), bag = t.bag || [], d = t.dest || {}, terr = t.xpTerr || eqCall(() => xpTerrOf(d), 'foret');
  if (!bag.length) return;
  for (const c of E.con.slice()) {
    const D = eqCDef(c); let moved = false;
    if (D.ty === 'cont') { const co = eqContinent(+d.lon, +d.lat); if (!c.got.includes(co)) { c.got.push(co); moved = co; } }
    else if (D.ty === 'lieux') D.L.forEach(([n, lon, lat], i) => { if (!c.got[i] && eqKm({ lon, lat }, d) <= 25) { c.got[i] = 1; moved = n; } });
    else if (D.ty === 'terr') { if (terr === D.terr || (D.terr === 'mer' && (d.tags || []).includes('ile'))) { c.got = (+c.got || 0) + 1; moved = 1; } }
    else if (D.ty === 'rare') { const n = bag.filter(it => (it.rarity || 0) >= 3).length; if (n) { c.got = (+c.got || 0) + n; moved = 1; } }
    if (!moved) continue;
    const cur = eqCCur(c), n = eqCN(c);
    if (cur >= n) {
      E.con = E.con.filter(x => x !== c);
      const mul = c.rev ? 1.5 : 1, coinsN = Math.round(D.coins * mul), st = Math.round(D.stones * mul);
      let beat = 0;
      if (E.riv.cid === c.id) { E.riv.cid = null; E.riv.l = (E.riv.l || 0) + 1; E.riv.last = { k: 'lose', t: D.t, at: Date.now() }; beat = 3; }
      eqCall(() => gainCoins(coinsN), 0); eqCall(() => gainStones(st + beat), 0); eqCall(() => xpGain(t.comp, terr, 60), 0); // XP du familier en bonus
      eqHist({ t: D.t, res: 'ok' });
      out.push({ k: 'cok', t: D.t, cid: c.cid, coins: coinsN, stones: st + beat, beat: !!beat });
    } else out.push({ k: 'cstep', t: D.t, cur, n });
  }
}

// ---------------- 5. livraisons urgentes ----------------
const EQ_CITIES = [['Lyon', 4.8357, 45.764], ['Marseille', 5.3698, 43.2965], ['Bordeaux', -0.5792, 44.8378], ['Lille', 3.0573, 50.6292], ['Strasbourg', 7.7521, 48.5734], ['Nantes', -1.5536, 47.2184],
  ['Bruxelles', 4.3517, 50.8503], ['Genève', 6.1432, 46.2044], ['Barcelone', 2.1734, 41.3851], ['Londres', -0.1276, 51.5072], ['Amsterdam', 4.9041, 52.3676], ['Turin', 7.6869, 45.0703], ['Paris', 2.3522, 48.8566], ['Toulouse', 1.4442, 43.6047]];
const EQ_WHO = ['sa cousine', 'son vieil ami', 'sa grand-tante', 'son neveu', 'une amie d’enfance', 'son ancien professeur'];
function eqNewDel(opt = {}) {
  const E = eqState(), T = eqCall(() => cmT(), null); if (!T) return null;
  const line = (CM_LINES[T.id] || []).filter(R => !R.egg && !R.x && eqCall(() => cmUnlocked(R), true));
  const R = opt.rid ? CM_R[opt.rid] : line[Math.floor(Math.random() * line.length)]; if (!R) return null;
  const h = eqCall(() => homeObj(), null), cand = EQ_CITIES.filter(([n, lon, lat]) => !h || (eqKm({ lon, lat }, h) >= 80 && eqKm({ lon, lat }, h) <= 1500));
  const C = opt.city ? EQ_CITIES.find(x => x[0] === opt.city) : cand[Math.floor(Math.random() * cand.length)]; if (!C) return null;
  const cl = eqCall(() => (BQ_SHOP_CLIENTS[T.id] || []).filter(id => BQC(id)), []), cid = opt.cid || cl[Math.floor(Math.random() * cl.length)] || 'noisette';
  const now = Date.now();
  E.del = { id: 'dl' + now.toString(36), cid, rid: R.id, city: C[0], lon: C[1], lat: C[2], who: EQ_WHO[Math.floor(Math.random() * EQ_WHO.length)], st: 'open', at: now, end: now + (8 + Math.floor(Math.random() * 9)) * 36e5 };
  save(); return E.del;
}
const eqDelDest = D => ({ id: null, name: D.city, country: '', lat: D.lat, lon: D.lon, tags: ['ville'], special: null });
function eqDelFor(dest) { const D = eqState().del; return D && D.st === 'open' && dest && !dest.poi && eqKm(D, dest) <= 40 ? D : null; }
// le produit à livrer, en dehors des provisions choisies
function eqDelItem(D, prov) {
  const used = (prov || []).filter(r => r === D.rid).length;
  const l = eqCall(() => cmProducts(), []).filter(it => it.mk && it.mk.rid === D.rid).sort((a, b) => a.mk.st - b.mk.st);
  return l.length > used ? l[0] : null;
}
const eqDelRw = (D, k) => { const R = CM_R[D.rid], base = eqCall(() => cmPrice(R, 3), 30) * 4 + 80; return Math.round(base * (eqSpec(k) === 'march' ? 1.5 : 1)); };

// ---------------- départ ----------------
function eqOnStart(k, t, dest, rids, duo, D) {
  const E = eqState(), names = [];
  // livraison (avant les provisions)
  if (D) { const it = eqDelItem(D, rids); if (it) { S.inv.splice(S.inv.indexOf(it), 1); t.eqDel = D.id; t.eqDelIt = it.name; D.st = 'sent'; D.by = k; t.journal.push({ t: Date.now(), kind: 'eq', text: `Dans le sac, bien calé : ${it.name}, à livrer à ${D.city} pour ${eqCliNm(D.cid)}. Pas de temps à perdre !`, chips: [['give', 'livraison urgente']] }); } }
  // provisions
  const P = { end: 0, chaud: 0, frais: 0, moral: 0 };
  for (const rid of rids) {
    const it = eqFood().filter(x => x.mk.rid === rid).sort((a, b) => a.mk.st - b.mk.st)[0]; if (!it) continue;
    S.inv.splice(S.inv.indexOf(it), 1); P[eqKindOf(rid)]++; names.push(it.name);
  }
  t.eqLong = eqIsLong(dest);
  if (names.length) {
    t.eqProv = P; t.eqProvN = names;
    t.luck += 0.4 * P.moral;
    if (P.end && t.eqLong) t.eqSave = 1;
    t.journal.push({ t: Date.now(), kind: 'eq', text: `Dans le sac à provisions : ${names.join(', ')}. ${P.chaud ? 'De quoi se réchauffer ! ' : ''}${P.frais ? 'De quoi se rafraîchir ! ' : ''}${P.end ? 'De quoi tenir la distance ! ' : ''}${P.moral ? 'Et un bon repas pour le moral !' : ''}`.trim(), chips: [['give', `${names.length} provision${names.length > 1 ? 's' : ''}`]] });
  }
  // duo
  if (duo && eqFree(duo)) {
    t.eqDuo = duo; E.duo[duo] = k;
    const R = eqRoles(k, duo, t.xpTerr || eqCall(() => xpTerrOf(dest), 'foret'));
    t.luck += 0.3 + 0.1 * eqAmiLv(k, duo);
    t.journal.push({ t: Date.now(), kind: 'eq', text: `${eqNm(k)} et ${eqNm(duo)} partent ensemble : ${eqNm(R.porte)} porte le sac, ${eqNm(R.guide)} montre le chemin.`, chips: [['friend', `duo · ${eqAmiNm(eqAmiLv(k, duo))}`]] });
  }
  // photographe : plus de chance partout
  if ([k, t.eqDuo].some(x => eqSpec(x) === 'photo')) t.luck += 0.4;
  save();
}
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, dest = plan.dest;
  if (dest && !eqTuto()) {
    const lead = eqBusyWith(k);
    if (lead) { toast(`${eqNm(k)} est déjà en route avec ${eqNm(lead)}. Choisissez un autre compagnon en haut.`); return; }
    if (dest.eqsp && eqSpec(k) !== dest.eqsp && eqSpec(eqPlanDuo()) !== dest.eqsp) { toast(`Lieu réservé aux ${EQ_SP[dest.eqsp].nm.toLowerCase()}s : emmenez un familier qui a cette spécialité.`); return; }
  }
  const rids = eqTuto() ? [] : eqPlanProv().slice(), duo = eqTuto() ? null : eqPlanDuo(), D = eqTuto() ? null : eqDelFor(dest), before = S.trips[k];
  const r = orig.apply(this, arguments);
  try { const t = S.trips[k]; if (t && t !== before && !t.tuto && dest && !eqTuto()) { eqOnStart(k, t, dest, rids, duo, D); plan.eqProv = []; plan.eqDuo = null; } } catch (e) { console.error('équipage départ', e); }
  return r;
})(startTrip);

// une provision d'endurance évite UN demi-tour
if (typeof avApply === 'function') avApply = (orig => function (t, j, fx, place) {
  if (t && t.eqSave > 0 && /\bxback\b/.test(String(fx || ''))) {
    t.eqSave = 0; t.eqSaved = 1;
    const out = orig.call(this, t, j, String(fx).replace(/\bxback\b/, 'time+'), place);
    try { out.chips.push(['fast', 'Provisions : pas de demi-tour !']); } catch (e) {}
    return out;
  }
  return orig.apply(this, arguments);
})(avApply);

// arrivée : livraison, duo
if (typeof fireEvent === 'function') fireEvent = (orig => function (t, e) {
  const r = orig.apply(this, arguments);
  try {
    if (e && e.type === 'arrivee' && t && !t.tuto && !eqTuto() && !t.eqArr) {
      t.eqArr = 1; const k = t.comp, E = eqState();
      if (t.eqDuo) t.journal.push({ t: Date.now(), kind: 'eq', place: t.dest.name, text: `${eqNm(k)} et ${eqNm(t.eqDuo)} arrivent côte à côte à ${t.dest.name}. Ils se tapent dans la patte !`, chips: [['friend', 'en duo']] });
      const D = E.del;
      if (t.eqDel && D && D.id === t.eqDel && D.st === 'sent') {
        if (Date.now() <= D.end && eqKm(D, t.dest) <= 40) {
          const coinsN = eqDelRw(D, k); t.coins = (t.coins || 0) + coinsN;
          eqCall(() => b2Heart(D.cid, 4), 0); eqCall(() => gainStones(2), 0);
          E.dlast = { res: 'ok', cid: D.cid, at: Date.now(), coins: coinsN, it: t.eqDelIt, city: D.city }; E.del = null; E.dn = Date.now() + (3 + Math.random() * 3) * 36e5;
          t.eqDelOk = { cid: D.cid, coins: coinsN, it: t.eqDelIt, city: D.city };
          t.journal.push({ t: Date.now(), kind: 'eq', place: D.city, text: `Livraison faite ! ${eqNm(k)} remet ${t.eqDelIt} à ${D.who} de ${eqCliNm(D.cid)}, qui l’attendait à la fenêtre. Quel sourire !`, chips: [['coins', `+${coinsN} pièces`], ['friend', `${eqCliNm(D.cid)} +4 amitié`]] });
          S.unseen[k] = (S.unseen[k] || 0) + 1;
        } else { E.dlast = { res: 'late', cid: D.cid, at: Date.now() }; E.del = null; E.dn = Date.now() + 3 * 36e5; t.journal.push({ t: Date.now(), kind: 'eq', text: `Trop tard pour la livraison… ${eqNm(k)} mange ${t.eqDelIt} en chemin, un peu déçu${eqE(k)}.`, chips: [['back', 'livraison ratée']] }); }
      }
      save();
    }
  } catch (err) { console.error('équipage arrivée', err); }
  return r;
})(fireEvent);

// ---------------- retour ----------------
let eqHaul = null;
function eqOnReturn(k, t) {
  const E = eqState(), out = [], d = t.dest || {}, tags = (d.tags && d.tags.length ? d.tags : ['campagne']), terr = t.xpTerr || eqCall(() => xpTerrOf(d), 'foret');
  const add = (n, why, tg) => { if (n <= 0) return 0; const l = eqCall(() => lootFor(tg || tags, (t.luck || 0) + 1, d.name, n, k), []); l.forEach(it => t.bag.push(it)); if (l.length) out.push({ k: 'plus', n: l.length, why }); return l.length; };
  if (t.eqProvN) { out.push({ k: 'prov', names: t.eqProvN, saved: !!t.eqSaved }); add(t.eqProv.moral || 0, 'repas du moral'); }
  // duo : amitié, objet porté, progression du partenaire
  const p = t.eqDuo;
  if (p && CHARS[p]) {
    const key = eqAmiKey(k, p), lv0 = eqAmiLv(k, p); E.ami[key] = (+E.ami[key] || 0) + 1; const lv1 = eqAmiLv(k, p);
    if (lv1 >= 3 && lv0 < 3) { eqAddTitle(k, `Inséparable de ${eqNm(p)}`); eqAddTitle(p, `Inséparable de ${eqNm(k)}`); }
    const R = eqRoles(k, p, terr);
    const n = add(1 + (lv1 >= 2 ? 1 : 0), `porté par ${eqNm(R.porte)}`);
    eqCall(() => addXP(p, Math.round(30 + Math.min(120, (t.dist || 0) / 60)) * (1 + 0.1 * lv1)), 0);
    eqCall(() => xpGain(p, terr, Math.round(10 + (t.xpe ? 15 : 0) + Math.min(25, (t.dist || 0) / 200))), 0);
    out.push({ k: 'duo', p, n: E.ami[key], lv0, lv1, extra: n });
    delete E.duo[p];
  }
  // spécialités (meneur et partenaire)
  const sps = [...new Set([eqSpec(k), eqSpec(p)].filter(Boolean))];
  if (sps.includes('plong') && terr === 'mer') add(1, 'trésor de plongeur', ['mer']);
  if (sps.includes('bota')) add(1, 'trouvaille de botaniste', ['foret']);
  if (sps.includes('archeo') && (t.xpe || terr === 'desert') && Math.random() < (t.xpe ? 0.35 : 0.15)) {
    const it = eqCall(() => makeItem(['Fragment antique', 'd', 'statue', 3, null, '#c9a35a'], 0, `Fouille : ${d.name}`, tags, { fixed: 3 }), null);
    if (it) { t.bag.push(it); out.push({ k: 'plus', n: 1, why: 'fouille d’archéologue' }); }
  }
  if (sps.includes('march') && t.coins > 0) { const x = Math.round(t.coins * 0.25); t.coins += x; out.push({ k: 'coins', n: x, why: 'flair du marchand' }); }
  // lieu réservé à une spécialité
  if (d.eqsp && EQ_SP[d.eqsp] && !t.xpFail) {
    const P = EQ_SP[d.eqsp].pl, who = eqSpec(k) === d.eqsp ? k : p;
    if (!E.wsp[d.eqsp]) {
      E.wsp[d.eqsp] = who || k;
      const it = eqCall(() => makeItem(P.it, 0, `Lieu réservé : ${P.name}`, P.tags, { fixed: 4 }), null);
      if (it) { it.special = true; it.xpr = 1; t.bag.push(it); }
      eqAddTitle(who || k, P.ti); t.coins = (t.coins || 0) + 300; // v33 : plus de pierres d'étoile (Exploration)
      out.push({ k: 'spw', sp: d.eqsp, it: P.it[0], ti: P.ti });
    }
  }
  if (t.eqDelOk) out.push(Object.assign({ k: 'del' }, t.eqDelOk));
  else if (t.eqDel && E.del && E.del.id === t.eqDel && E.del.st === 'sent') { E.del.st = 'open'; delete E.del.by; out.push({ k: 'delko' }); }
  eqContractsOnReturn(t, out);
  return out.length ? { k, at: Date.now(), out } : null;
}
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  eqHaul = null;
  try { if (t && t.done && !t.tuto && !eqTuto()) eqHaul = eqOnReturn(k, t); } catch (e) { console.error('équipage retour', e); }
  return orig.apply(this, arguments);
})(collect);
function eqHaulHTML(H) {
  const rows = H.out.map(o => {
    if (o.k === 'prov') return `<p><span class="eqh-i">${EQ_ICO_BAG}</span><span>Provisions mangées : <b>${esc(o.names.join(', '))}</b>${o.saved ? ' · <b class="ok">grâce à elles, pas de demi-tour !</b>' : ''}</span></p>`;
    if (o.k === 'plus') return `<p><span class="eqh-i">${EQ_ICO_BAG}</span><span>+${o.n} objet${o.n > 1 ? 's' : ''} (${esc(o.why)})</span></p>`;
    if (o.k === 'coins') return `<p><span class="eqh-i">${CM_COIN}</span><span>+${o.n} pièces (${esc(o.why)})</span></p>`;
    if (o.k === 'duo') return `<p class="eqh-duo"><img src="${portraitURI(H.k, 'rire')}" alt=""><img src="${portraitURI(o.p, 'rire')}" alt=""><span>Amitié ${esc(eqNm(H.k))} et ${esc(eqNm(o.p))} : <b>${o.n} voyage${o.n > 1 ? 's' : ''} ensemble</b> · ${esc(eqAmiNm(o.lv1))}${o.lv1 > o.lv0 ? ' <b class="ok">nouveau palier !</b>' : ''}</span></p>`;
    if (o.k === 'spw') return `<p class="eqh-big"><span class="eqh-i">${eqSpIco(o.sp, 'm')}</span><span><b>Lieu réservé conquis !</b><small>${esc(o.it)} · titre « ${esc(o.ti)} » · +300 pièces</small></span></p>`;
    if (o.k === 'del') return `<p class="eqh-big">${eqCliImg(o.cid, 'joie')}<span><b>Livraison réussie à ${esc(o.city)} !</b><small>${esc(eqCliNm(o.cid))} vous remercie : +${o.coins} pièces · +4 amitié · +2 pierres d’étoile</small></span></p>`;
    if (o.k === 'delko') return `<p>Livraison pas encore faite : le produit est revenu dans le sac. Il reste du temps !</p>`;
    if (o.k === 'cok') return `<p class="eqh-big">${eqCliImg(o.cid, 'joie')}<span><b>Contrat rempli : ${esc(o.t)} !</b><small>+${o.coins} pièces · +${o.stones} pierres d’étoile${o.beat ? ' · Gaspard le renard est battu !' : ''}</small></span></p>`;
    if (o.k === 'cstep') return `<p><span class="eqh-i">${CM_SCROLL}</span><span>Contrat « ${esc(o.t)} » : <b>${o.cur}/${o.n}</b></span></p>`;
    return '';
  }).join('');
  return rows ? `<div class="eq-haul">${rows}</div>` : '';
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const H = eqHaul;
    if (H && h && h.comp === H.k && Date.now() - H.at < 30000) {
      eqHaul = null;
      const html = eqHaulHTML(H), mb = document.querySelector('#modal .mbox'), hl = mb && mb.querySelector('.haul');
      if (html) { if (hl) hl.insertAdjacentHTML('beforebegin', html); else if (mb) mb.insertAdjacentHTML('beforeend', html); }
    }
  } catch (e) { console.error('équipage butin', e); }
  return r;
})(showHaul);

// ---------------- panneau de départ ----------------
function eqProvHTML(k, d) {
  const sel = eqPlanProv(), st = eqStock(), P = eqCount(sel);
  const left = r => (st[r] || 0) - sel.filter(x => x === r).length;
  const slots = [0, 1, 2].map(i => sel[i] ? `<button class="eqp-s on" data-eqprm="${i}" title="Retirer : ${esc(eqRName(sel[i]))}" aria-label="Retirer ${esc(eqRName(sel[i]))}">${eqRIco(sel[i], 'eqs' + i)}<i style="--kc:${EQ_K[eqKindOf(sel[i])][1]}">${EQ_K[eqKindOf(sel[i])][0]}</i></button>` : `<span class="eqp-s"></span>`).join('');
  const av = Object.keys(st).map(r => `<button class="eqp-a" data-eqpadd="${r}" ${left(r) > 0 && sel.length < 3 ? '' : 'disabled'} title="${esc(eqRName(r))} : ${esc(EQ_K[eqKindOf(r)][2])}">${eqRIco(r, 'eqa' + r)}<span><b>${esc(eqRName(r))}</b><small style="color:${EQ_K[eqKindOf(r)][1]}">${EQ_K[eqKindOf(r)][0]} · ${left(r)} en stock</small></span></button>`).join('');
  const pair = eqRiskPair(k, d), adv = eqAdvice(k, d);
  const fx = [];
  if (pair && Math.abs(pair[0] - pair[1]) > 0.004) fx.push(`Risques : <s>${xpPct(pair[0])}</s> → <b>${xpPct(pair[1])}</b>`);
  else if (pair) fx.push(`Risques : <b>${xpPct(pair[1])}</b>`);
  if (P.moral) fx.push(`+${P.moral} objet${P.moral > 1 ? 's' : ''} au retour`);
  if (P.end && eqIsLong(d)) fx.push('1 demi-tour évité');
  return `<div class="eqp"><b class="eqp-t"><span class="eqp-bag">${EQ_ICO_BAG}</span><span>Sac à provisions <small>${sel.length}/3 · des plats de votre commerce, mangés en route</small></span></b>
    <div class="eqp-sl">${slots}</div>
    ${av ? `<div class="eqp-av">${av}</div>` : `<p class="eqp-none">Aucun plat prêt. Préparez-en au comptoir : chocolat chaud = chaleur, citronnade = fraîcheur, gâteau du voyageur = endurance, grand festin = moral. <button class="btn cream sm" data-eqshop="1">Au comptoir</button></p>`}
    ${adv ? `<p class="eqp-adv">${esc(adv)}</p>` : ''}${fx.length ? `<p class="eqp-fx">${fx.join(' · ')}</p>` : ''}</div>`;
}
function eqDuoHTML(k, d) {
  const free = compIds().filter(x => x !== k && eqFree(x)), p = eqPlanDuo();
  if (!free.length && !p) return '';
  const terr = eqCall(() => xpCtxOf(d).terr, 'foret');
  let info = '<small>Ajoutez un 2e familier libre : l’un porte (+1 objet), l’autre guide (moins de risques). Les deux sont occupés pendant le voyage.</small>';
  if (p) { const R = eqRoles(k, p, terr), lv = eqAmiLv(k, p); info = `<small><b>${esc(eqNm(R.porte))}</b> porte le sac (+${1 + (lv >= 2 ? 1 : 0)} objet${lv >= 2 ? 's' : ''}), <b>${esc(eqNm(R.guide))}</b> guide (${esc(XP_T[terr][1])} niv. ${R.gl}) · amitié : ${esc(eqAmiNm(lv))} (${eqAmiN(k, p)} voyage${eqAmiN(k, p) > 1 ? 's' : ''})</small>`; }
  return `<div class="eqd"><b class="eqp-t"><span>Compagnon de route</span></b><div class="eqd-l">${free.slice(0, 6).map(x => `<button class="eqd-c${x === p ? ' on' : ''}" data-eqduo="${x}" aria-pressed="${x === p}" title="${esc(eqNm(x))}"><img src="${portraitURI(x)}" alt=""><span>${esc(eqNm(x))}</span></button>`).join('')}</div>${info}</div>`;
}
function eqDelGoHTML(k, d) {
  const D = eqDelFor(d); if (!D) return '';
  const it = eqDelItem(D, eqPlanProv());
  return `<div class="eqdl${it ? '' : ' no'}">${eqCliImg(D.cid)}<span><b>Livraison urgente pour ${esc(eqCliNm(D.cid))}</b><small>1 ${esc(eqLow(eqRName(D.rid)))} pour ${esc(D.who)} à ${esc(D.city)} · reste ${eqLeft(D.end - Date.now())} · ${it ? '<b class="ok">✓ dans le sac</b>' : '<b class="no">✗ aucun en stock : préparez-en au comptoir</b>'}</small></span></div>`;
}
function eqSpGoHTML(k, d) {
  if (!d.eqsp || !EQ_SP[d.eqsp]) return '';
  const S2 = EQ_SP[d.eqsp], ok = eqSpec(k) === d.eqsp || eqSpec(eqPlanDuo()) === d.eqsp, won = eqState().wsp[d.eqsp];
  return `<div class="eqdl sp${ok ? '' : ' no'}"><span class="eqh-i">${eqSpIco(d.eqsp, 'm')}</span><span><b>Lieu réservé aux ${esc(S2.nm.toLowerCase())}s</b><small>${won ? 'Déjà conquis.' : `Trésor unique : ${esc(S2.pl.it[0])} · titre « ${esc(S2.pl.ti)} »`} · ${ok ? '<b class="ok">✓ spécialité présente</b>' : '<b class="no">✗ il faut un familier de cette spécialité (seul ou en duo)</b>'}</small></span></div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!box || eqTuto()) return r;
    const k = S.sel, d = plan.dest, t = S.trips[k], lead = eqBusyWith(k);
    if (!t && lead) {
      box.insertAdjacentHTML('afterbegin', `<div class="eqdl busy"><img src="${portraitURI(lead)}" alt=""><span><b>${esc(eqNm(k))} voyage avec ${esc(eqNm(lead))}</b><small>${eqE(k) ? 'Elle' : 'Il'} rentrera avec ${esc(eqNm(lead))}. Choisissez un autre compagnon en haut.</small></span></div>`);
      const b = box.querySelector('#goBtn'); if (b) b.disabled = true;
      return r;
    }
    if (t && t.eqDuo && !t.done) { const ph = box.querySelector('.phead'); if (ph) ph.insertAdjacentHTML('afterend', `<p class="eq-with"><img src="${portraitURI(t.eqDuo)}" alt="">En duo avec ${esc(eqNm(t.eqDuo))}</p>`); }
    if (d && !t && CHARS[k]) {
      const gb = box.querySelector('.gobar'), html = eqSpGoHTML(k, d) + eqDelGoHTML(k, d) + eqProvHTML(k, d) + eqDuoHTML(k, d);
      if (gb) { gb.insertAdjacentHTML('beforebegin', html); const nb = gb.querySelector('div > b'); if (nb) nb.insertAdjacentHTML('afterend', `<em class="eq-gti">${esc(eqTitle(k))}</em>`); const im = gb.querySelector('img'); if (im) im.insertAdjacentHTML('afterend', eqBadge(k, 'go')); }
      else box.insertAdjacentHTML('beforeend', html);
    }
  } catch (e) { console.error('équipage panneau', e); }
  return r;
})(renderVoyage);
// épingle à cadenas : le conseil de provisions
if (typeof xpPinLab === 'function') xpPinLab = (orig => function (P) {
  const h = orig.apply(this, arguments);
  try { const a = eqAdvice(S.sel, xpDest(P)); if (a) { const at = h.lastIndexOf('<button'); if (at >= 0) return h.slice(0, at) + `<p class="eqp-adv">${esc(a)}</p>` + h.slice(at); } } catch (e) {}
  return h;
})(xpPinLab);

// ---------------- fiche du familier ----------------
let eqSpOpen = false;
function eqFicheHTML(k) {
  const E = eqState(), lv = (S.prog[k] && S.prog[k].lvl) || 1, sp = eqSpec(k), st = eqStage(k), tl = eqTitles(k), cur = eqTitle(k);
  let h = `<div class="eqf"><div class="eqf-h"><b>Spécialité</b><span class="eqf-st st${st}">${eqBadge(k)}${EQ_STAGE[st]}</span></div>`;
  if (sp) {
    const S2 = EQ_SP[sp], won = E.wsp[sp];
    h += `<div class="eqf-sp"><span class="eqh-i">${eqSpIco(sp, 'm')}</span><span><b>${esc(S2.nm)}</b><small>${esc(S2.txt)}</small></span></div>
      <div class="eqf-pl${won ? ' got' : ''}"><span><small>Lieu réservé</small><b>${esc(S2.pl.name)}</b><small>${won ? `Conquis ✔ · ${esc(S2.pl.it[0])}` : `Trésor unique : ${esc(S2.pl.it[0])} · titre « ${esc(S2.pl.ti)} »`}</small></span>${won ? '' : `<button class="btn gold sm" data-eqspgo="${sp}">Y aller</button>`}</div>`;
  } else if (lv >= EQ_SP_LVL) {
    h += eqSpOpen ? `<p class="eqf-help">Choisissez UNE spécialité (définitive) :</p><div class="eqf-ch">${Object.entries(EQ_SP).map(([id, S2]) => `<button class="eqf-o" data-eqsp="${id}"><span class="eqh-i">${eqSpIco(id, 'm')}</span><span><b>${esc(S2.nm)}</b><small>${esc(S2.txt)}</small><small class="eqf-pn">Lieu réservé : ${esc(S2.pl.name)}</small></span></button>`).join('')}</div>`
      : `<button class="btn green sm eqf-go" data-eqspopen="1">Choisir sa spécialité</button>`;
  } else h += `<p class="eqf-help">Au niveau ${EQ_SP_LVL} (encore ${EQ_SP_LVL - lv}), ${esc(eqNm(k))} choisira une spécialité : alpiniste, plongeur, archéologue, botaniste, photographe animalier ou marchand.</p>`;
  h += `<div class="eqf-ti"><small>Titre affiché :</small>${[eqStageWord(k, st)].concat(tl).slice(0, 8).map(x => `<button class="eqf-t${x === cur ? ' on' : ''}" data-eqti="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
  const pals = compIds().filter(x => x !== k && CHARS[x] && eqAmiN(k, x) > 0);
  if (pals.length) h += `<div class="eqf-am">${pals.map(x => `<span><img src="${portraitURI(x)}" alt="">${esc(eqNm(x))} · ${esc(eqAmiNm(eqAmiLv(k, x)))} (${eqAmiN(k, x)})</span>`).join('')}</div>`;
  return h + '</div>';
}
if (typeof renderTalents === 'function') renderTalents = (orig => function (k) {
  let h = orig.apply(this, arguments);
  try {
    if (!CHARS[k] || eqTuto()) return h;
    h = h.replace('<div class="cptch">', `<div class="cptch eq-pt">${eqBadge(k, 'big')}`);
    h = h.replace(/(<div class="cptx"><b>[^<]*<\/b>)/, `$1<em class="eq-fti">${esc(eqTitle(k))}</em>`);
    const at = h.indexOf('<div class="cptree">');
    return at >= 0 ? h.slice(0, at) + eqFicheHTML(k) + h.slice(at) : h + eqFicheHTML(k);
  } catch (e) { console.error('équipage fiche', e); return h; }
})(renderTalents);
// barre des compagnons : badge de croissance, duo
if (typeof renderComps === 'function') renderComps = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    if (eqTuto()) return r;
    document.querySelectorAll('#hudComps .hc-btn[data-sel]').forEach(b => {
      const k = b.dataset.sel; if (!CHARS[k]) return;
      if (eqStage(k) >= 2) b.insertAdjacentHTML('beforeend', eqBadge(k, 'hud'));
      if (eqBusyWith(k)) b.insertAdjacentHTML('beforeend', '<span class="eq-hduo" title="En duo">duo</span>');
    });
  } catch (e) {}
  return r;
})(renderComps);

// ---------------- page Quêtes : Contrats, Rival, Livraison ----------------
function eqConHTML(c) {
  const D = eqCDef(c), n = eqCN(c), cur = eqCCur(c), R = eqState().riv, raced = R.cid === c.id, mul = c.rev ? 1.5 : 1;
  let det = '';
  if (D.ty === 'lieux') det = `<div class="eqc-l">${D.L.map(([nm], i) => `<span class="${c.got[i] ? 'ok' : ''}">${c.got[i] ? '✓' : ''}${esc(nm)}${c.got[i] ? '' : ` <button class="eqc-go" data-eqcgo="${c.id}:${i}">Y aller</button>`}</span>`).join('')}</div>`;
  else if (D.ty === 'cont' && c.got.length) det = `<small>Déjà : ${esc(c.got.join(', '))}</small>`;
  const art = eqCall(() => qmRewardArt({ k: 'stones', n: Math.round(D.stones * mul), mode: 'defi', coins: Math.round(D.coins * mul) }, 64), '');
  return `<div class="eqc${raced ? ' raced' : ''}" id="qmq-co_${c.id}">${art || eqCliImg(c.cid)}<div><b>${esc(D.t)}</b><small>${art ? eqCliImg(c.cid).replace('class="eq-cimg"', 'class="qt-face"') : ''}Pour ${esc(eqCliNm(c.cid))} · ⏱ ${eqLeft(c.end - Date.now())}${c.rev ? ' · revanche' : ''}</small>${eqCall(() => qmMeta('defi', D.ty === 'terr' || D.ty === 'rare' ? 2 : 3, []), '')}
    <span class="eqc-bar" aria-label="Vous : ${cur} sur ${n}"><i style="width:${(cur / n * 100).toFixed(0)}%"></i><em>Vous ${cur}/${n}</em></span>
    ${raced ? `<span class="eqc-bar riv" aria-label="Gaspard"><i style="width:${(eqRivP() * 100).toFixed(0)}%"></i><em>Gaspard ${Math.round(eqRivP() * 100)} %</em></span>` : ''}${det}</div></div>`;
}
function eqSecHTML() {
  eqTick();
  const E = eqState(), R = E.riv, now = Date.now();
  let h = `<section class="eq-sec"><h3 class="qt-h3" id="eqContrats">Contrats <small>collectionneurs pressés, grosses récompenses</small></h3>`;
  h += E.con.length ? E.con.map(eqConHTML).join('') : '<p class="qt-hint">Pas de contrat pour l’instant : un collectionneur passera après votre prochain voyage.</p>';
  void R; void now;
  h += eqRivalHTML() + '</section>';
  return h;
}
function eqRivalHTML() {
  const E = eqState(), R = E.riv, now = Date.now(), raced = R.cid && E.con.find(c => c.id === R.cid), canRev = R.last && R.last.k === 'win' && now >= (R.rev || 0) && !R.cid;
  let h = `<div class="eqr" id="eqRival">${eqRivalImg(raced ? 'content' : R.last && R.last.k === 'win' ? 'joie' : 'content')}<div><b>Rival : Gaspard le renard <small>${R.w || 0} victoire${(R.w || 0) > 1 ? 's' : ''} pour lui · ${R.l || 0} pour vous</small></b>`;
  if (raced) h += `<small>Il court après le même contrat : « ${esc(eqCDef(raced).t)} ». S’il arrive avant vous, c’est perdu !</small><span class="eqc-bar riv"><i style="width:${(eqRivP() * 100).toFixed(0)}%"></i><em>${Math.round(eqRivP() * 100)} %</em></span>`;
  else if (R.last && R.last.k === 'win') h += `<small>Il vous a doublé sur « ${esc(R.last.t)} ». ${canRev ? '' : `Revanche possible dans ${eqLeft(R.rev - now)}.`}</small>${canRev ? `<button class="btn gold sm" data-eqrev="1" ${E.con.length >= 2 ? 'disabled' : ''}>Revanche ! (récompense ×1,5)</button>${E.con.length >= 2 ? '<small>Terminez d’abord un contrat.</small>' : ''}` : ''}`;
  else if (R.last && R.last.k === 'lose') h += `<small>Battu sur « ${esc(R.last.t)} » ! Il rumine sa défaite… et reviendra.</small>`;
  else h += '<small>Un explorateur rival, rusé et rapide. Il vise parfois les mêmes trésors que vous.</small>';
  return h + '</div></div>';
}
function eqDelCardHTML(D) {
  const it = eqDelItem(D, []);
  const art = eqCall(() => qmRewardArt({ k: 'stones', n: 2, mode: 'defi', coins: eqDelRw(D, S.sel) }, 64), '');
  return `<div class="eqc del">${art || eqCliImg(D.cid)}<div><b>Apporter 1 ${esc(eqLow(eqRName(D.rid)))} à ${esc(D.city)}</b>${eqCall(() => qmMeta('defi', 2, []), '')}<small>${D.st === 'sent' ? `En route avec ${esc(eqNm(D.by))}…` : `Avant ${eqLeft(D.end - Date.now())} · ${it ? 'en stock ✓' : 'à préparer au comptoir'}`} · +4 amitié</small>${D.st === 'open' ? `<button class="btn gold sm" data-eqdel="1">Y aller</button>` : ''}</div></div>`;
}
if (typeof qtPageHTML === 'function') qtPageHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  try {
    if (eqTuto()) return h;
    let at = h.indexOf('<section class="my-sec">'); if (at < 0) at = h.indexOf('<h3 class="qt-h3">Histoires');
    return at >= 0 ? h.slice(0, at) + eqSecHTML() + h.slice(at) : h;
  } catch (e) { console.error('équipage quêtes', e); return h; }
})(qtPageHTML);
// comptoir : l'usage de chaque plat en voyage, et la livraison dans l'onglet Clients
if (typeof cmRecipesHTML === 'function') cmRecipesHTML = (orig => function () {
  let h = orig.apply(this, arguments);
  try {
    if (eqTuto()) return h;
    const T = cmT(); if (!T) return h;
    (CM_LINES[T.id] || []).forEach(R => {
      const kd = eqKindOf(R.id); if (!kd) return;
      const i = h.indexOf(`data-cfcard="${R.id}"`); if (i < 0) return; const j = h.indexOf('</b>', i); if (j < 0) return;
      h = h.slice(0, j + 4) + `<i class="eq-ptag" style="--kc:${EQ_K[kd][1]}" title="En voyage : ${esc(EQ_K[kd][2])}">${EQ_ICO_BAG}${EQ_K[kd][0]}</i>` + h.slice(j + 4);
    });
  } catch (e) {}
  return h;
})(cmRecipesHTML);
if (typeof cfClientsHTML === 'function') cfClientsHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  try { const D = eqState().del; if (D && !eqTuto()) return `<div class="eq-cli">${eqDelCardHTML(D)}</div>` + h; } catch (e) {}
  return h;
})(cfClientsHTML);

// ---------------- clics ----------------
function eqRepaint() { const b = $('panelBody'), y = b ? b.scrollTop : 0; eqCall(() => renderPanel(), 0); if (b) b.scrollTop = y; }
function eqQtRefresh() { const m = $('modal'); if (!m || m.hidden || !m.querySelector('.qt-page')) return; const mb = m.querySelector('.mbox'), y = mb.scrollTop; showModal(qtPageHTML()); mb.scrollTop = y; }
function eqGoDest(dest) {
  const m = $('modal'); if (m) m.hidden = true;
  if (S.trips[S.sel]) { openSheet('voyage'); toast(`${eqNm(S.sel)} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; }
  plan.dest = dest; openSheet('voyage'); eqCall(() => drawMarks(), 0);
}
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-eqpadd],[data-eqprm],[data-eqduo],[data-eqshop],[data-eqsp],[data-eqspopen],[data-eqspgo],[data-eqti],[data-eqrev],[data-eqdel],[data-eqcgo]');
  if (!el || el.disabled) return;
  const d = el.dataset, k = S.sel;
  try {
    if (d.eqpadd) { const l = eqPlanProv(); if (l.length < 3) { l.push(d.eqpadd); eqCall(() => sfx('pop'), 0); } return eqRepaint(); }
    if (d.eqprm != null) { eqPlanProv().splice(+d.eqprm, 1); return eqRepaint(); }
    if (d.eqduo) { plan.eqDuo = plan.eqDuo === d.eqduo ? null : d.eqduo; return eqRepaint(); }
    if (d.eqshop) { if (typeof openBoutique === 'function') openBoutique('comptoir'); else openSheet('boutique'); return; }
    if (d.eqspopen) { eqSpOpen = true; return eqRepaint(); }
    if (d.eqsp) { if (eqPickSpec(k, d.eqsp)) { eqSpOpen = false; toast(`${eqNm(k)} devient ${EQ_SP[d.eqsp].nm.toLowerCase()} !`); eqCall(() => renderComps(), 0); } return eqRepaint(); }
    if (d.eqspgo) return eqGoDest(eqSpDest(d.eqspgo));
    if (d.eqti) { eqState().ti[k] = d.eqti; save(); return eqRepaint(); }
    if (d.eqrev) { const E = eqState(); if (E.con.length < 2) { eqNewContract(null, { rev: 1, rival: 1 }); E.riv.last = null; } return eqQtRefresh(); }
    if (d.eqdel) { const D = eqState().del; if (D) eqGoDest(eqDelDest(D)); return; }
    if (d.eqcgo) { const [id, i] = d.eqcgo.split(':'), c = eqState().con.find(x => x.id === id); if (c) { const L = eqCDef(c).L[+i]; eqGoDest({ id: null, name: L[0], country: '', lat: L[2], lon: L[1], tags: /Phare/.test(L[0]) ? ['mer'] : ['ville', 'monument'], special: null }); } return; }
  } catch (e) { console.error('équipage clic', e); }
});
setInterval(() => { try { if (document.hidden) return; if (eqTick()) { const m = $('modal'); if (m && !m.hidden && m.querySelector('#eqContrats')) eqQtRefresh(); } } catch (e) {} }, 5000);

// ---------------- style ----------------
(function eqCSS() {
  const st = document.createElement('style'); st.id = 'eqCSS';
  st.textContent = `
.eqp,.eqd{display:flex;flex-direction:column;gap:6px;margin:8px 0;padding:8px 10px;border:2.5px solid #c98a5a;border-radius:16px;background:#fff6ea}
.eqd{border-color:#7fae4f;background:#f3f9ec}
.eqp-t{display:flex;align-items:center;gap:8px;font:800 15px/1.15 var(--display,inherit)}
.eqp-t small{display:block;font:600 12px var(--body,inherit);color:var(--ink2,#7a6250)}
.eqp-bag{width:30px;height:30px;flex:none}.eqp-bag svg{width:100%;height:100%}
.eqp-sl{display:flex;gap:6px}
.eqp-s{position:relative;width:54px;height:54px;border-radius:14px;border:2.5px dashed #d9b68a;background:#fff;display:flex;align-items:center;justify-content:center;padding:5px}
.eqp-s.on{border-style:solid;border-color:var(--ink,#4a3528);cursor:pointer}
.eqp-s svg{width:100%;height:100%}
.eqp-s i{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);font:800 9.5px var(--display,inherit);font-style:normal;color:#fff;background:var(--kc);border-radius:999px;padding:0 5px;white-space:nowrap}
.eqp-av{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
.eqp-a{display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:12px;border:2px solid var(--line,#e2d3bd);background:#fff;text-align:left;cursor:pointer;min-width:0}
.eqp-a:disabled{opacity:.45}.eqp-a>svg,.eqp-a>span:first-child{flex:none}
.eqp-a svg{width:30px;height:30px;flex:none}.eqp-a span{display:flex;flex-direction:column;min-width:0}
.eqp-a b{font-size:12px;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.eqp-a small{font-size:11px;font-weight:700}
.eqp-none{margin:0;font-size:12.5px;line-height:1.35;color:var(--ink2,#7a6250)}
.eqp-adv{margin:0;padding:4px 8px;border-radius:10px;background:#fff3c4;font-size:12.5px;font-weight:700;color:#7a5a10}
.eqp-fx{margin:0;font-size:13px}.eqp-fx s{color:#a8452f}.eqp-fx b{color:#2f7f4c}
.eqd-l{display:flex;gap:6px;flex-wrap:wrap}
.eqd-c{display:flex;flex-direction:column;align-items:center;width:58px;padding:3px;border-radius:12px;border:2px solid var(--line,#e2d3bd);background:#fff;cursor:pointer;font:700 11px var(--display,inherit)}
.eqd-c img{width:40px;height:44px;object-fit:contain}.eqd-c.on{border-color:#4f8a3f;background:#e3f3d8}
.eqd small{font-size:12px;line-height:1.35;color:var(--ink2,#7a6250)}
.eqdl{display:flex;align-items:center;gap:8px;margin:8px 0;padding:7px 9px;border:2.5px solid #2f7f6c;border-radius:16px;background:#eaf6f2}
.eqdl.no{border-color:#c9604f;background:#fff1ea}.eqdl.busy{border-color:#7fae4f;background:#f3f9ec}.eqdl.sp{border-color:#b0782f;background:#fff6e0}
.eqdl>span:last-child{display:flex;flex-direction:column;min-width:0}.eqdl b{font:800 14px var(--display,inherit)}.eqdl small{font-size:12px;line-height:1.3;color:var(--ink2,#7a6250)}
.eqdl img,.eq-cimg{width:42px;height:42px;object-fit:contain;flex:none}
.ok{color:#2f7f4c}.eqdl .no,.eqp .no{color:#c9604f}
.eq-with{display:flex;align-items:center;gap:6px;margin:4px 0;font:800 13px var(--display,inherit);color:#4f8a3f}.eq-with img{width:28px;height:30px;object-fit:contain}
.eq-gti,.eq-fti{display:block;font:700 11.5px var(--body,inherit);font-style:italic;color:#8a5a20}
.eq-bdg{display:inline-flex;width:20px;height:20px;border-radius:50%;background:#fffaf0;border:1.6px solid var(--ink,#4a3528);align-items:center;justify-content:center;flex:none}
.eq-bdg svg{width:15px;height:15px}.eq-bdg.st3{background:#fff3c4;border-color:#a8781a}
.eq-bdg.go{margin-left:-16px;align-self:flex-end;position:relative;z-index:1}
.eq-pt{position:relative}.eq-bdg.big{position:absolute;right:-2px;bottom:2px;width:26px;height:26px;z-index:2}.eq-bdg.big svg{width:20px;height:20px}
.hc-btn .eq-bdg.hud{position:absolute;left:-2px;bottom:14px;width:18px;height:18px}.hc-btn .eq-bdg.hud svg{width:13px;height:13px}
.eq-hduo{position:absolute;right:-4px;top:-2px;padding:0 4px;border-radius:999px;background:#4f8a3f;color:#fff;font:800 9px/14px var(--display,inherit)}
.eqf{display:flex;flex-direction:column;gap:6px;margin-top:8px;padding:8px 10px;border:2.5px solid #b0782f;border-radius:18px;background:#fffaf0}
.eqf-h{display:flex;align-items:center;justify-content:space-between;font:800 15px var(--display,inherit)}
.eqf-st{display:inline-flex;align-items:center;gap:4px;font:800 12px var(--display,inherit);color:var(--ink2,#7a6250)}.eqf-st.st3{color:#a8781a}
.eqf-sp,.eqf-o{display:flex;align-items:center;gap:8px}.eqf-sp>span:last-child,.eqf-o>span:last-child{display:flex;flex-direction:column;min-width:0}
.eqf-sp b,.eqf-o b{font:800 14px var(--display,inherit)}.eqf-sp small,.eqf-o small{font-size:12px;line-height:1.3;color:var(--ink2,#7a6250)}
.eqh-i{width:34px;height:34px;flex:none;display:inline-flex;align-items:center;justify-content:center}.eqh-i svg{width:100%;height:100%}
.eqf-pl{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:12px;background:#fff3c4;border:1.6px solid #e0a52a}
.eqf-pl>span{flex:1;display:flex;flex-direction:column;min-width:0}.eqf-pl b{font-size:13.5px}.eqf-pl small{font-size:11.5px;color:var(--ink2,#7a6250)}.eqf-pl.got{opacity:.75}
.eqf-ch{display:flex;flex-direction:column;gap:5px}
.eqf-o{padding:6px 8px;border-radius:12px;border:2px solid var(--line,#e2d3bd);background:#fff;text-align:left;cursor:pointer}
.eqf-o .eqf-pn{color:#8a5a20;font-weight:700}
.eqf-help{margin:0;font-size:12.5px;line-height:1.35;color:var(--ink2,#7a6250)}.eqf-go{align-self:flex-start}
.eqf-ti{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.eqf-ti small{font-size:12px;color:var(--ink2,#7a6250)}
.eqf-t{padding:2px 8px;border-radius:999px;border:1.6px solid var(--line,#e2d3bd);background:#fff;font:700 11.5px var(--display,inherit);cursor:pointer}
.eqf-t.on{background:#fff3c4;border-color:#e0a52a;color:#7a5a10}
.eqf-am{display:flex;flex-wrap:wrap;gap:6px}.eqf-am span{display:inline-flex;align-items:center;gap:3px;font-size:11.5px;color:var(--ink2,#7a6250)}.eqf-am img{width:22px;height:24px;object-fit:contain}
.eq-sec{display:flex;flex-direction:column;gap:6px}
.eqc,.eqr{display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border:2px solid var(--line,#e2d3bd);border-radius:14px;background:#fffaf0}
.eqc>div,.eqr>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.eqc b,.eqr b{font:800 13.5px/1.2 var(--display,inherit)}.eqc small,.eqr small{font-size:11.5px;line-height:1.3;color:var(--ink2,#7a6250)}
.eqc.raced{border-color:#3a3550;background:#f3f1f8}.eqc.del{border-color:#2f7f6c;background:#eaf6f2}
.eqc .btn,.eqr .btn{align-self:flex-start}
.eqc-bar{position:relative;display:block;height:14px;border-radius:7px;background:#ece2d0;overflow:hidden;border:1px solid rgba(74,53,40,.2)}
.eqc-bar i{display:block;height:100%;background:#3f9a5f}.eqc-bar.riv i{background:#3a3550}
.eqc-bar em{position:absolute;left:6px;top:0;font:800 10px/14px var(--display,inherit);font-style:normal;color:#fff;text-shadow:0 0 2px rgba(0,0,0,.6)}
.eqc-l{display:flex;flex-wrap:wrap;gap:4px}.eqc-l span{font-size:11.5px;padding:1px 6px;border-radius:999px;background:#fff;border:1.4px solid var(--line,#e2d3bd)}.eqc-l span.ok{background:#e3f3d8;border-color:#7fae4f}
.eqc-go{border:0;background:none;color:#2f6fb0;font:800 11px var(--display,inherit);text-decoration:underline;cursor:pointer;padding:0}
.eq-rimg{width:56px;height:56px;object-fit:contain;flex:none}
.eq-cli{margin-bottom:8px}
.eq-ptag{display:inline-flex;align-items:center;gap:2px;margin:1px auto 0;padding:0 6px 0 2px;border-radius:999px;background:#fff;border:1.4px solid var(--kc);color:var(--kc);font:800 10px/15px var(--display,inherit);font-style:normal}
.eq-ptag svg{width:13px;height:13px}
.eq-haul{display:flex;flex-direction:column;gap:4px;margin:8px 0;padding:8px 10px;border:2.5px solid #c98a5a;border-radius:16px;background:#fff6ea}
.eq-haul p{margin:0;display:flex;align-items:center;gap:6px;font-size:13px}.eq-haul .eqh-i{width:26px;height:26px}
.eq-haul .eqh-big>span:last-child{display:flex;flex-direction:column}.eq-haul .eqh-big b{font:800 14.5px var(--display,inherit)}.eq-haul .eqh-big small{font-size:12px;color:var(--ink2,#7a6250)}
.eqh-duo img{width:28px;height:30px;object-fit:contain;flex:none}.eqh-duo img+img{margin-left:-12px}
`;
  document.head.appendChild(st);
})();

window.__eq = {
  state: eqState, SP: EQ_SP, CT: EQ_CT, kindOf: eqKindOf, stock: eqStock, count: eqCount, riskPair: eqRiskPair, advice: eqAdvice, pickSpec: eqPickSpec, spec: eqSpec, spDest: eqSpDest,
  stage: eqStage, title: eqTitle, titles: eqTitles, busy: eqBusyWith, ami: eqAmiN, amiLv: eqAmiLv, newContract: eqNewContract, tick: eqTick, rivP: eqRivP, newDel: eqNewDel, delDest: eqDelDest,
  riskTrip: k => (S.trips[k] && S.trips[k].xpe ? xpRisk(S.trips[k], 0.35) : 0), secHTML: eqSecHTML, fiche: eqFicheHTML, continent: eqContinent,
  api: () => ({ S, plan, startTrip, collect, tick, openSheet, renderPanel, makeItem, qtPageHTML, renderTalents, cmRecipesHTML, cfClientsHTML, showModal }),
};

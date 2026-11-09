// ================= v36 : DIFFICULTÉ, PORTÉE DE VOYAGE ET FICHE AVANT LE DÉPART =================
// Le joueur : « Le jeu n'est pas assez dur. Il faut que les bonus aient du sens et qu'on sente la progression en arrivant
// à faire des choses qu'on n'arrivait pas à faire. » RÈGLE : on bloque PAR LA PRÉPARATION, jamais par un simple niveau.
// 1. PORTÉE : chaque familier a une portée (50 km au départ) qui grandit avec niveau, stade, matériel (la BOUSSOLE devient
//    du matériel d'expédition équipable), provisions, confort, spécialité, vêtements d'explorateur, duo. Au-delà : départ
//    refusé avec la raison et quoi faire. Cercle discret sur la carte, lieux hors portée estompés.
//    Exceptions : tutoriel, lieux du quotidien, livraison urgente acceptée, étape de la quête suivie, objectifs du jour
//    « tout près » et « dans la région ». L'objectif « grand voyage » (800 à 2 500 km) reste un objectif à préparer.
// 2. TERRAINS DURS : risque de base sans préparation (montagne 80 %, grand froid 85 %, désert 75 %, mer 70 %), le bon
//    matériel le divise par 4 à 12. Les terrains durs deviennent des expéditions dès 60 km ; sans préparation, même
//    l'option prudente peut échouer (risque − 30 %).
// 3. RESSOURCES : trouvailles multiples −30 %, objets rares relancés 30 % du temps (sauf objets utiles aux quêtes,
//    à l'objectif du jour et aux recettes ; jamais pendant les 5 premiers voyages). ÉPUISEMENT : 100/70/45/25 % du butin
//    selon les visites des 3 dernières heures.
// 4. FICHE AVANT LE DÉPART : stats en barres, ce qu'il porte et son effet ici, risque avant/après, portée, trouvailles,
//    conseils cliquables. Remplace les lignes éparpillées (canfind, risques de 41 et 45, conseil de provisions).
// État : S.dif = { ex: { "lon:lat": [horodatages] } }. Enveloppes : xpIsExpe, xpRiskK, avChoose, avChance, lootFor,
// startTrip, collect, showHaul, renderVoyage, drawMarks. Tests : window.__df.

const dfCall = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const dfTuto = () => dfCall(() => tuOn(), false);
const dfNm = k => (k && CHARS[k] ? CHARS[k].name : '');
function dfState() {
  if (!S.dif || typeof S.dif !== 'object' || Array.isArray(S.dif)) S.dif = {};
  const D = S.dif;
  if (!D.ex || typeof D.ex !== 'object' || Array.isArray(D.ex)) D.ex = {};
  return D;
}

// ---------------- la boussole devient du matériel d'expédition (2 cases par familier) ----------------
try {
  const G = ['boussole', ['Boussole', 'Boussole pro', 'Boussole légendaire'], 'Tous terrains : voyager beaucoup plus loin', '#c9a35a', [], '', 'boussole'];
  if (!XP_G.boussole) { XP_GEAR.push(G); XP_G.boussole = G; G[1].forEach((n, i) => { XP_GBY[n] = { g: 'boussole', tier: i + 1 }; }); XP_GBY['Boussole de l’épave'] = { g: 'boussole', tier: 3 }; }
} catch (e) { console.error('difficulté boussole', e); }

// ---------------- terrains ----------------
const DF_T = { montagne: 0.8, froid: 0.85, desert: 0.75, mer: 0.7, foret: 0.35, ville: 0.3 };
const DF_HARD = { montagne: 1, froid: 1, desert: 1, mer: 1 };
const DF_GEARX = [1, 0.385, 0.333, 0.267]; // × [1, .65, .45, .3] de 41 = [1, .25, .15, .08]
const dfTerr = d => dfCall(() => xpTerrOf(d), 'foret');
const dfKm = d => dfCall(() => kmExact(homeObj(), d), dfCall(() => kmBetween(homeObj(), d), 0));
function dfHardTrip(d) {
  if (!d || d.poi) return false;
  const terr = dfTerr(d), tg = d.tags || [];
  if (!DF_HARD[terr]) return false;
  if (terr === 'mer' && (tg.includes('ville') || tg.includes('monument'))) return false; // une ville au bord de la mer reste une ville
  return dfKm(d) >= 60;
}
if (typeof xpIsExpe === 'function') xpIsExpe = (orig => function (d) {
  if (orig.apply(this, arguments)) return true;
  return dfCall(() => dfHardTrip(d), false);
})(xpIsExpe);
if (typeof xpRiskK === 'function') xpRiskK = (orig => function (k, c, miss, base) {
  if (!c || !(base > 0)) return orig.apply(this, arguments);
  const nb = Math.min(0.95, base * (DF_T[c.terr] || 0.35) / 0.35);
  let r = orig.call(this, k, c, miss, nb);
  if (r > 0) { r *= DF_GEARX[dfCall(() => xpGearFor(k, c), 0)] || 1; r = Math.max(0.03, Math.min(0.9, r)); }
  return r;
})(xpRiskK);
const dfNoPrep = (c, miss) => Math.min(0.9, (DF_T[c.terr] || 0.35) * (miss ? 1.6 : 1) + (miss ? 0.3 : 0));
function dfRiskOf(k, d) {
  if (!d || !dfCall(() => xpIsExpe(d), false)) return null;
  const c = xpCtxOf(d), P = d.xpl ? XP_P[d.xpl] : null, miss = P ? xpMiss(P, k).length > 0 : false;
  return { r: xpRiskK(k, c, miss, 0.35), no: dfNoPrep(c, miss), c, miss };
}
// sans préparation, même la prudence peut échouer
let dfFail = false;
if (typeof avChance === 'function') avChance = (orig => function () { return dfFail ? 0 : orig.apply(this, arguments); })(avChance);
if (typeof avChoose === 'function') avChoose = (orig => function (t, j, oi, auto) {
  let opt = null, patched = false;
  try {
    if (t && j && j.xp && !j.resolved && t.xpe && !t.xpe.miss) {
      const node = avNode(j); opt = node && node.o[oi];
      if (opt && opt.p == null && !opt.need && node.xft) {
        const r = xpRiskK(t.comp, t.xpe, false, 0.35), pf = Math.max(0, r - 0.3);
        if (pf > 0 && Math.random() < pf) { opt.p = 1; opt.f = R_(node.xft, node.xf || 'xback'); patched = true; dfFail = true; }
      }
    }
  } catch (e) {}
  try { return orig.apply(this, arguments); } finally { dfFail = false; if (patched) { delete opt.p; delete opt.f; } }
})(avChoose);

// ---------------- portée ----------------
const DF_BASE = 50, DF_WORLD = 3000;
const DF_COMP = [[0, 1], [100, 1.3], [200, 1.6], [400, 2.2]]; // boussole : km ajoutés, puis multiplicateur
const DF_EXPLO = ['explorateur', 'rando', 'godillots', 'gilet', 'sac', 'veste', 'carquois'];
const DF_PAL = [[150, 'Autour de la maison'], [400, 'Votre région'], [1000, 'Grand voisinage'], [2500, 'France entière'], [DF_WORLD, 'Europe'], [1e9, 'Monde entier']];
const dfPalier = km => (DF_PAL.find(p => km < p[0]) || DF_PAL[DF_PAL.length - 1])[1];
function dfProv(k) { return k === S.sel ? dfCall(() => eqCount(eqPlanProv()), {}) : {}; }
function dfDuo(k) { return k === S.sel ? dfCall(() => eqPlanDuo(), null) : null; }
// o : { comp: palier de boussole forcé, end: plats d'endurance en plus }
function dfRange(k, d, o = {}) {
  const c = d ? dfCall(() => xpCtxOf(d), null) : null, terr = c ? c.terr : null, parts = [];
  const add = (id, lbl, km) => { km = Math.round(km); if (km > 0) parts.push({ id, lbl, km }); };
  add('base', 'Départ', DF_BASE);
  const lv = (S.prog[k] && S.prog[k].lvl) || 1; add('lvl', `Niveau ${lv}`, Math.min(240, (lv - 1) * 8));
  const st = dfCall(() => eqStage(k), 1); add('stade', st === 3 ? 'Stade légendaire' : 'Stade aguerri', [0, 0, 100, 300][st] || 0);
  if (dfCall(() => pgPowOf(k), '') === 'endu') add('pouv', 'Pouvoir Endurance', 60 * dfCall(() => pgPowN(k), 0));
  let ct = 0;
  dfCall(() => xpEqItems(k), []).forEach(it => {
    const G = xpGearOf(it); if (!G) return;
    if (G.g === 'boussole') { ct = Math.max(ct, G.tier); return; }
    const D = XP_G[G.g]; if (c && (D[4].includes(c.terr) || (D[5] === 'cave' && (c.cave || c.night)) || (D[5] === 'wild' && c.wild))) add('g:' + it.id, it.name, 80 * G.tier);
  });
  if (o.comp != null) ct = o.comp;
  const P = dfProv(k), ne = (P.end || 0) + (o.end || 0);
  add('end', `${ne} plat${ne > 1 ? 's' : ''} d’endurance`, 90 * ne);
  add('prov', 'Autres provisions', 30 * ((P.chaud || 0) + (P.frais || 0) + (P.moral || 0)));
  if (dfDuo(k)) add('duo', 'Duo', 50);
  add('conf', 'Confort du foyer', 500 * dfCall(() => f3Eff().p, 0));
  const sp = dfCall(() => EQ_SP[eqSpec(k)], null);
  if (sp) add('spec', sp.nm, terr && sp.terr && sp.terr.includes(terr) ? 150 : 60);
  let wear = 0;
  dfCall(() => usWornItems(k), []).forEach(it => { const f = dfCall(() => usFormOf(it), ''), b = dfCall(() => usWearOf(it), null); if (DF_EXPLO.includes(f)) wear += 40; else if (b && terr && (b.t === terr || b.t === '*')) wear += 20; });
  if (dfCall(() => usSetsOf(k), []).some(x => x.on && x.St.id === 'explo')) wear += 150;
  add('wear', 'Vêtements d’explorateur', wear);
  const sum = parts.reduce((a, p) => a + p.km, 0), C = DF_COMP[Math.max(0, Math.min(3, ct))];
  const km = Math.round((sum + C[0]) * C[1]);
  if (ct) parts.push({ id: 'comp', lbl: xpGName('boussole', ct), km: km - sum });
  return { km, world: km >= DF_WORLD, parts, comp: ct, sum };
}
function dfExempt(d) {
  if (!d || dfTuto() || d.poi) return true;
  if (dfCall(() => eqDelFor(d), null)) return true;
  const R = dfCall(() => regionAt(d.lon, d.lat), null), Z = dfCall(() => rgZoneAt(d.lon, d.lat), null);
  return dfCall(() => qtNeeds(), []).some(n => {
    if (!(n.src === 'quete' || (n.src === 'jour' && !/grand voyage/i.test(n.why || '')))) return false;
    const s = n.step || {}; return !!((s.region && R && s.region === R.id) || (s.zone && Z && s.zone === Z.id));
  });
}
const dfCompItem = k => (S.inv || []).filter(it => { const G = xpGearOf(it); return G && G.g === 'boussole'; }).sort((a, b) => xpGearOf(b).tier - xpGearOf(a).tier).find(it => { const by = dfCall(() => xpWornBy(it.id), null); return !by || by === k; }) || null;
function dfCheck(k, d) {
  const dist = Math.round(dfKm(d)), R = dfRange(k, d), ex = dfExempt(d);
  const ok = ex || R.world || dist <= R.km;
  let msg = '';
  if (!ok) {
    const opts = [];
    const stock = dfCall(() => eqStock(), {}), endIn = Object.keys(stock).filter(r => eqKindOf(r) === 'end').reduce((a, r) => a + stock[r], 0) - (dfProv(k).end || 0);
    for (let n = 1; n <= 3 - dfCall(() => eqPlanProv().length, 0); n++) if (dfRange(k, d, { end: n }).km >= dist) { opts.push(`emportez ${n} plat${n > 1 ? 's' : ''} d’endurance${endIn < n ? ' (à préparer au comptoir)' : ''}`); break; }
    if (R.comp < 1 && dfRange(k, d, { comp: 1 }).km >= dist) opts.push(dfCompItem(k) ? 'équipez la boussole' : 'fabriquez et équipez une boussole');
    if (!opts.length && R.comp < 1) { const kk = dfRange(k, d, { comp: 1, end: 3 - dfCall(() => eqPlanProv().length, 0) }).km; if (kk >= dist) opts.push('combinez boussole et plats d’endurance'); }
    const how = opts.length ? opts.join(' ou ') : `faites grandir ${dfNm(k)} (stade, matériel, vêtements d’explorateur) ou visez plus près`;
    msg = `Trop loin : ${dist.toLocaleString('fr-FR')} km pour une portée de ${R.km.toLocaleString('fr-FR')} km. ${how.charAt(0).toUpperCase() + how.slice(1)}.`;
  }
  return { ok, ex: ex && !(R.world || dist <= R.km), dist, R, msg };
}

// ---------------- épuisement ----------------
const DF_EXF = [1, 0.7, 0.45, 0.25], DF_REGROW = 3 * 3600e3;
const dfKey = d => `${(Math.round(+d.lon * 100) / 100).toFixed(2)}:${(Math.round(+d.lat * 100) / 100).toFixed(2)}`;
function dfExInfo(d) {
  if (!d || !isFinite(+d.lon)) return { n: 0, f: 1, back: 0 };
  const now = Date.now(), a = (dfState().ex[dfKey(d)] || []).filter(ts => now - ts < DF_REGROW);
  return { n: a.length, f: DF_EXF[Math.min(3, a.length)], back: a.length ? Math.max(...a) + DF_REGROW - now : 0 };
}
function dfVisit(d) {
  const D = dfState(), now = Date.now(), key = dfKey(d);
  for (const kk of Object.keys(D.ex)) { D.ex[kk] = (D.ex[kk] || []).filter(ts => now - ts < DF_REGROW); if (!D.ex[kk].length) delete D.ex[kk]; }
  (D.ex[key] = D.ex[key] || []).push(now);
}
const dfLeft = ms => dfCall(() => xpMin(ms), Math.ceil(ms / 6e4) + ' min');

// ---------------- butin plus rare ----------------
const dfLootOn = () => !dfTuto() && ((S.stats && S.stats.trips) || 0) >= 5;
const dfNeeded = (it, N) => N.some(n => n && typeof n.match === 'function' && dfCall(() => n.match(it), false));
if (typeof lootFor === 'function') lootFor = (orig => function (tags, luck, place, n = 1, comp = null) {
  if (!dfLootOn()) return orig.apply(this, arguments);
  const L = (+luck || 0) * 0.75, out = orig.call(this, tags, L, place, n, comp);
  try {
    if (!Array.isArray(out)) return out;
    const N = dfCall(() => qtNeeds(), []);
    // trouvailles multiples : environ 30 % de moins (jamais un objet utile)
    if (out.length >= 2) {
      const x = out.length * 0.7, keep = Math.max(1, Math.floor(x) + (Math.random() < x % 1 ? 1 : 0));
      let drop = out.length - keep;
      for (let i = out.length - 1; i >= 0 && drop > 0; i--) if (!out[i].special && !dfNeeded(out[i], N)) { out.splice(i, 1); drop--; }
    }
    // objets rares : 30 % relancés
    for (let i = 0; i < out.length; i++) {
      const it = out[i];
      if (it && (it.rarity || 0) >= 2 && !it.special && !dfNeeded(it, N) && Math.random() < 0.3) { const b = orig.call(this, tags, L, place, 1, comp); if (b && b[0]) out[i] = b[0]; }
    }
  } catch (e) { console.error('difficulté butin', e); }
  return out;
})(lootFor);

// ---------------- départ et retour ----------------
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, d = plan.dest;
  if (d && CHARS[k] && !S.trips[k] && !dfTuto()) {
    const C = dfCall(() => dfCheck(k, d), { ok: true });
    if (!C.ok) { toast(C.msg); dfCall(() => renderPanel(), 0); return; }
  }
  const before = S.trips[k], ex = d ? dfExInfo(d) : null;
  const r = orig.apply(this, arguments);
  try { const t = S.trips[k]; if (t && t !== before && !t.tuto && d && !dfTuto()) { t.dfEx = ex.f; t.dfExN = ex.n; dfVisit(d); save(); } } catch (e) { console.error('difficulté départ', e); }
  return r;
})(startTrip);
let dfHaul = null;
if (typeof collect === 'function') collect = (orig => function () {
  dfHaul = null;
  try {
    const k = S.sel, t = S.trips[k];
    if (t && t.done && !t.tuto && !t.dfL && t.dfEx < 1 && Array.isArray(t.bag)) {
      t.dfL = 1;
      const N = dfCall(() => qtNeeds(), []), cand = t.bag.filter(it => !it.special && !it.xpr && !it.mk && !it.edition && !dfNeeded(it, N));
      const n = Math.round(cand.length * (1 - t.dfEx));
      cand.sort(() => Math.random() - 0.5).slice(0, n).forEach(it => { const i = t.bag.indexOf(it); if (i >= 0) t.bag.splice(i, 1); });
      t.dfLost = n;
      dfHaul = { k, txt: `Lieu épuisé (${t.dfExN + 1}e visite en 3 h) : ${n} objet${n > 1 ? 's' : ''} en moins. Il repousse en quelques heures.` };
    }
  } catch (e) { console.error('difficulté retour', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  try { if (dfHaul && h && h.comp === dfHaul.k) { h.extra = (h.extra || []).concat([dfHaul.txt]); dfHaul = null; } } catch (e) {}
  return orig.apply(this, arguments);
})(showHaul);

// ---------------- fiche avant le départ ----------------
const DF_SVG = {
  endu: '<path d="M7 3h6v8.5l5.2 2.6c1.3.7 1 2.9-.6 2.9H6.5c-.8 0-1.5-.7-1.5-1.5V5c0-1.1.9-2 2-2z" fill="#fff"/><path d="M5 19.5h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  flair: '<path d="M12 2.5l2.3 7.2 7.2 2.3-7.2 2.3L12 21.5l-2.3-7.2L2.5 12l7.2-2.3z" fill="#fff"/>',
  robu: '<path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10.5C7.4 20.3 4 16.5 4 11.5v-6z" fill="#fff"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke="#5f8fb8" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  far: '<circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="3 2.5"/><circle cx="12" cy="12" r="2.6" fill="#fff"/>',
};
const dfGly = (g, col) => `<i class="dfg" style="--c:${col}" aria-hidden="true"><svg viewBox="0 0 24 24">${DF_SVG[g]}</svg></i>`;
const dfPct = r => `${Math.round(r * 100)} %`;
const dfRC = r => (r < 0.2 ? 'ok' : r < 0.45 ? 'mid' : 'bad');
const dfPos = km => Math.max(0.02, Math.min(1, Math.log(Math.max(DF_BASE, km) / DF_BASE) / Math.log(DF_WORLD / DF_BASE)));
function dfFlair(k, d, c) {
  const P = dfProv(k), n = dfCall(() => pgPowN(k), 0), pw = dfCall(() => pgPowOf(k), '');
  let L = dfCall(() => lvlLuck(k), 0) + 0.06 * (dfCall(() => xpLvl(k, c.terr), 1) - 1) + [0, 0.3, 0.5, 0.8][dfCall(() => xpGearFor(k, c), 0)] + 0.4 * (P.moral || 0);
  if (pw === 'etoile') L += 0.5 * n;
  if (dfCall(() => eqSpec(k), '') === 'photo') L += 0.4;
  if (dfDuo(k)) L += 0.3;
  const loot = dfCall(() => usLootP(k, c.terr), 0) + dfCall(() => f3Eff().p, 0), objs = (pw === 'flair' ? n : 0) + (P.moral || 0);
  return { L, loot, objs, rare: Math.round(L * 60) };
}
// simulations (rien n'est sauvegardé)
function dfWithEq(k, slot, id, fn) { const a = xpEq(k), old = a.slice(); a[slot] = id; try { return fn(); } finally { a[0] = old[0]; a[1] = old[1]; } }
function dfWithProv(rid, fn) { const p = dfCall(() => eqPlanProv(), []), old = p.slice(); p.push(rid); try { return fn(); } finally { plan.eqProv = old; } }
function dfUseful(it, c) { const G = xpGearOf(it); if (!G) return false; if (G.g === 'boussole') return true; const D = XP_G[G.g]; return !!(c && (D[4].includes(c.terr) || (D[5] === 'cave' && (c.cave || c.night)) || (D[5] === 'wild' && c.wild))); }
function dfSlotFor(k, c) { const a = xpEq(k), items = xpEqItems(k); for (let i = 0; i < 2; i++) if (!a[i]) return i; for (let i = 0; i < 2; i++) if (!dfUseful(items[i], c)) return i; return 1; }
function dfWearHTML(k, d, c, risk) {
  const chips = [], terr = c.terr, R = dfRange(k, d), rk = () => { const x = dfRiskOf(k, d); return x ? x.r : 0; };
  const chip = (ico, nm, fx, on) => `<span class="dfw${on ? '' : ' off'}"><span class="dfw-i">${ico}</span><span class="dfw-t"><b>${esc(nm)}</b><small>${fx}</small></span></span>`;
  xpEqItems(k).forEach((it, slot) => {
    if (!it) return; const G = xpGearOf(it), fx = [];
    if (G.g === 'boussole') { const p = R.parts.find(x => x.id === 'comp'); if (p) fx.push(`+${p.km.toLocaleString('fr-FR')} km`); }
    else if (dfUseful(it, c)) {
      const p = R.parts.find(x => x.id === 'g:' + it.id); if (p) fx.push(`+${p.km} km`);
      if (risk) { const w = dfWithEq(k, slot, null, rk); if (w > risk.r + 0.004) fx.push(`−${Math.round((1 - risk.r / w) * 100)} % de risques`); }
    }
    chips.push(chip(itemIcon(it), it.name, fx.length ? fx.join(' · ') : 'rien ici', fx.length));
  });
  const P = dfCall(() => eqPlanProv(), []);
  P.forEach((rid, i) => {
    const kd = eqKindOf(rid), fx = kd === 'end' ? '+90 km' : kd === 'moral' ? '+1 objet · +30 km' : (kd === 'chaud' && (terr === 'froid' || terr === 'montagne')) || (kd === 'frais' && terr === 'desert') ? `moins de risques · +30 km` : '+30 km';
    chips.push(chip(eqRIco(rid, 'dfp' + i), eqRName(rid), fx, true));
  });
  dfCall(() => usWornItems(k), []).forEach(it => {
    const b = dfCall(() => usWearOf(it), null), f = dfCall(() => usFormOf(it), ''), fx = [];
    if (DF_EXPLO.includes(f)) fx.push('+40 km');
    if (b && b.t !== 'cm' && (b.t === terr || b.t === '*')) { fx.push(b.k === 'risk' ? `−${Math.round(b.v * 100)} % de risques` : `+${Math.round(b.v * 100)} % de butin`); if (!DF_EXPLO.includes(f)) fx.push('+20 km'); }
    chips.push(chip(itemIcon(it), it.name, fx.length ? fx.join(' · ') : 'rien ici', fx.length));
  });
  dfCall(() => usSetsOf(k), []).filter(x => x.on).forEach(x => {
    const fx = x.St.fx.filter(([t]) => t === terr || t === '*').map(([, kk, v]) => (kk === 'risk' ? `−${Math.round(v * 100)} % de risques` : kk === 'loot' ? `+${Math.round(v * 100)} % de butin` : '')).filter(Boolean);
    if (x.St.id === 'explo') fx.push('+150 km');
    chips.push(chip(`<b class="dfw-set">${x.n}/4</b>`, 'Ensemble ' + x.St.nom, fx.length ? fx.join(' · ') : 'rien ici', fx.length));
  });
  if (!chips.length) return `<p class="df-none">Rien d’équipé. Matériel et vêtements : Compagnons › Talents.</p>`;
  return `<div class="dfws">${chips.join('')}</div>`;
}
function dfLootHTML(d) {
  if (d.poi) return '';
  let tbl = dfCall(() => lootTable(d.tags || ['campagne']), []);
  const common = tbl.slice().sort((a, b) => b.p - a.p).filter(x => x.d[3] < 2).slice(0, 4), rare = tbl.filter(x => x.d[3] >= 2).sort((a, b) => b.d[3] - a.d[3]).slice(0, 2);
  const ic = (x, r) => { const it = { name: x.d[0], cat: x.d[1], sub: x.d[2], rarity: x.d[3], look: x.d[4], color: x.d[5] }; const seen = S.dex && S.dex[it.name]; return `<span class="dfl${r ? ' rare' : ''}" title="${esc(seen || it.rarity < 3 ? it.name : 'Objet rare encore inconnu')} · ${esc(dfCall(() => RARITY[it.rarity], ''))}" style="--rc:${dfCall(() => RARC[it.rarity], '#ccc')}">${itemIcon(it)}</span>`; };
  let h = common.map(x => ic(x, 0)).join('') + rare.map(x => ic(x, 1)).join('');
  if (d.special) h += `<span class="dfl rare sp" title="Souvenir unique">${S.found[d.name] ? itemIcon({ name: d.special[0], cat: d.special[1], sub: d.special[2], rarity: 3, look: d.special[4], color: d.special[5] }) : '<b>?</b>'}</span>`;
  return h ? `<div class="dfls">${h}</div>` : '';
}
function dfTips(k, d, C, risk) {
  const out = [], c = risk ? risk.c : dfCall(() => xpCtxOf(d), { terr: 'foret' });
  const stock = dfCall(() => eqStock(), {}), plan3 = dfCall(() => eqPlanProv().length, 0) < 3, used = r => dfCall(() => eqPlanProv(), []).filter(x => x === r).length;
  const inStock = kind => Object.keys(stock).find(r => eqKindOf(r) === kind && stock[r] - used(r) > 0);
  if (!C.ok) {
    const ci = dfCompItem(k);
    if (C.R.comp < 1) { const g = dfRange(k, d, { comp: 1 }).km - C.R.km; out.push(ci ? { a: 'eq', v: ci.id, t: `Équiper la boussole`, fx: `+${g} km` } : { a: 'hint', v: 'Boussole : atelier › Équipement (1 métal + 1 verre), ou au magasin. Puis équipez-la sur la fiche du familier.', t: 'Fabriquer une boussole', fx: `+${g} km` }); }
    const er = plan3 && inStock('end');
    out.push(er ? { a: 'prov', v: er, t: `Emporter 1 ${eqRName(er).toLowerCase()}`, fx: '+90 km' } : { a: 'hint', v: 'Plats d’endurance : préparez au comptoir un plat (gâteau du voyageur, tartes, pains…). Chaque plat emporté : +90 km.', t: 'Préparer des plats d’endurance', fx: '+90 km chacun' });
  }
  if (risk && risk.r >= 0.3 && out.length < 2) {
    const want = Object.keys(XP_G).filter(g => g !== 'boussole' && XP_G[g][4].includes(c.terr));
    const own = (S.inv || []).filter(it => { const G = xpGearOf(it); if (!G || !want.includes(G.g)) return false; const by = dfCall(() => xpWornBy(it.id), null); return (!by || by === k) && !xpEq(k).includes(it.id); }).sort((a, b) => xpGearOf(b).tier - xpGearOf(a).tier)[0];
    if (own) { const s = dfSlotFor(k, c), nr = dfWithEq(k, s, own.id, () => { const x = dfRiskOf(k, d); return x ? x.r : 0; }); out.push({ a: 'eq', v: own.id, t: `Équiper : ${own.name}`, fx: `${dfPct(risk.r)} → ${dfPct(nr)}` }); }
    else if (want.length && !xpEqItems(k).some(it => dfUseful(it, c) && xpGearOf(it).g !== 'boussole')) out.push({ a: 'hint', v: `${xpGName(want[0], 1)} : atelier › Équipement, ou au magasin. Puis équipez-les sur la fiche du familier.`, t: `Fabriquer : ${xpGName(want[0], 1).toLowerCase()}`, fx: `${dfPct(risk.r)} → ${dfPct(Math.max(0.03, risk.r * 0.25))}` });
    const kind = c.terr === 'desert' ? 'frais' : (c.terr === 'froid' || c.terr === 'montagne') ? 'chaud' : null, pr = kind && plan3 && inStock(kind);
    if (pr && out.length < 2) { const nr = dfWithProv(pr, () => { const x = dfRiskOf(k, d); return x ? x.r : 0; }); if (nr < risk.r - 0.004) out.push({ a: 'prov', v: pr, t: `Emporter 1 ${eqRName(pr).toLowerCase()}`, fx: `${dfPct(risk.r)} → ${dfPct(nr)}` }); }
  }
  return out.slice(0, 2);
}
function dfCardHTML(k, d) {
  const C = dfCheck(k, d), risk = dfRiskOf(k, d), c = risk ? risk.c : dfCall(() => xpCtxOf(d), { terr: 'foret' }), T = XP_T[c.terr] || XP_T.foret;
  const F = dfFlair(k, d, c), ex = dfExInfo(d), lv = dfCall(() => xpLvl(k, c.terr), 1), R = C.R;
  const r = risk ? risk.r : 0, circ = 2 * Math.PI * 25;
  const ring = `<div class="dfring ${risk ? dfRC(r) : 'ok'}" role="img" aria-label="Risque de ce voyage : ${risk ? dfPct(r) : 'aucun'}"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" class="bg"/><circle cx="30" cy="30" r="25" class="fg" stroke-dasharray="${(circ * (risk ? Math.max(0.03, r) : 1)).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 30 30)"/></svg><b>${risk ? dfPct(r) : '0 %'}</b><small>risque</small></div>`;
  const kmTxt = R.world ? 'Monde entier' : `${R.km.toLocaleString('fr-FR')} km`;
  const endBar = `<span class="dfbar end${C.ok ? '' : ' no'}"><i style="width:${(R.world ? 100 : dfPos(R.km) * 100).toFixed(0)}%"></i><em style="left:${(dfPos(C.dist) * 100).toFixed(0)}%" title="Destination : ${C.dist} km"></em></span>`;
  const flBar = `<span class="dfbar fl"><i style="width:${Math.round(Math.min(1, 0.12 + F.L / 3 + F.loot) * 100)}%"></i></span>`;
  const rbBar = `<span class="dfbar rb ${risk ? dfRC(r) : 'ok'}"><i style="width:${Math.round((1 - r) * 100)}%"></i></span>`;
  const st = dfCall(() => eqTitle(k), '');
  let h = `<section class="dfc${C.ok ? '' : ' far'}" aria-label="Fiche de ${esc(dfNm(k))} pour ce voyage">`;
  h += `<div class="dfc-top"><img class="dfc-pic" src="${portraitURI(k)}" alt="" width="46" height="50"><div class="dfc-who"><b>${esc(dfNm(k))}</b><small>${esc(st)} · niv. ${(S.prog[k] && S.prog[k].lvl) || 1}</small><span class="dfc-ter" style="--tc:${T[3]}">${xpTIco(c.terr, 's')}${esc(T[1])} niv. ${lv}</span></div>${ring}</div>`;
  if (!C.ok) h += `<p class="dfc-far">${dfGly('far', '#c9604f')}<span><b>Trop loin : ${C.dist.toLocaleString('fr-FR')} km pour une portée de ${R.km.toLocaleString('fr-FR')} km</b><small>${esc(C.msg.replace(/^Trop loin[^.]*\.\s*/, ''))}</small></span></p>`;
  h += `<div class="dfst">`;
  h += `<div class="dfs">${dfGly('endu', '#c9853a')}<span class="dfs-n">Endurance</span>${endBar}<span class="dfs-v ${C.ok ? 'ok' : 'no'}">${C.dist.toLocaleString('fr-FR')} / ${esc(kmTxt)} ${C.ok ? '✓' : '✗'}</span></div>`;
  h += `<div class="dfs">${dfGly('flair', '#d9a520')}<span class="dfs-n">Flair</span>${flBar}<span class="dfs-v">${F.loot > 0.004 ? `+${Math.round(F.loot * 100)} % butin` : 'butin normal'}${F.objs ? ` · +${F.objs} obj.` : ''}${F.rare ? ` · rares +${F.rare} %` : ''}</span></div>`;
  h += `<div class="dfs">${dfGly('robu', '#5f8fb8')}<span class="dfs-n">Robustesse</span>${rbBar}<span class="dfs-v">${risk ? `${dfPct(1 - r)}` : 'pas de risque ici'}</span></div>`;
  h += `</div>`;
  if (C.ex) h += `<p class="dfc-note">Hors de sa portée (${R.km.toLocaleString('fr-FR')} km), mais autorisé : c’est une étape de quête ou une livraison.</p>`;
  else h += `<p class="dfc-note">Portée : <b>${esc(kmTxt)}</b> · ${esc(dfPalier(R.km))}${R.parts.length > 1 ? ` <span class="dfc-pts">${R.parts.filter(p => p.id !== 'base').map(p => `${esc(p.lbl)} +${p.km.toLocaleString('fr-FR')}`).join(' · ')}</span>` : ''}</p>`;
  if (risk) h += `<div class="dfc-cmp"><span>Sans préparation <b class="bad">${dfPct(risk.no)}</b></span><span class="arr">→</span><span>avec votre équipement <b class="${dfRC(r)}">${dfPct(r)}</b></span></div>`;
  h += `<h4 class="dfh">Ce qu’${eqCall2(k) ? 'elle' : 'il'} porte</h4>` + dfWearHTML(k, d, c, risk);
  const loot = dfLootHTML(d);
  if (loot || ex.n) h += `<h4 class="dfh">À trouver ici${ex.n ? ` <span class="dfex">Lieu épuisé : ${Math.round(ex.f * 100)} % du butin · revient dans ${esc(dfLeft(ex.back))}</span>` : ''}</h4>${loot}`;
  const tips = dfTips(k, d, C, risk);
  if (tips.length) h += `<div class="dftips">${tips.map((x, i) => `<button class="dftip" data-dftip="${i}" data-a="${x.a}" data-v="${esc(x.v)}"><span>${esc(x.t)}</span><b>${esc(x.fx)}</b></button>`).join('')}</div>`;
  return h + `</section>`;
}
const eqCall2 = k => dfCall(() => !!compE(k), false);
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel, d = plan.dest;
    if (!box || !d || S.trips[k] || !CHARS[k] || dfTuto() || box.querySelector('.eqdl.busy')) return r;
    // les lignes éparpillées sont rassemblées dans la fiche
    box.querySelectorAll('.canfind, .xpgo.mini, .xpgo .xp-risk, .eqp-fx, .eqp-adv').forEach(e => e.remove());
    const anchor = box.querySelector('.trjline') || box.querySelector('.dhead, .poihead');
    const html = dfCardHTML(k, d);
    if (anchor) anchor.insertAdjacentHTML('afterend', html); else box.insertAdjacentHTML('afterbegin', html);
    const C = dfCheck(k, d), b = box.querySelector('#goBtn');
    if (b && !C.ok) { b.disabled = true; b.textContent = 'Trop loin'; b.classList.add('df-off'); }
  } catch (e) { console.error('difficulté fiche', e); }
  return r;
})(renderVoyage);
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-dftip]'); if (!el) return;
  const k = S.sel, d = plan.dest, a = el.dataset.a, v = el.dataset.v; if (!CHARS[k] || !d) return;
  if (a === 'eq') { const c = dfCall(() => xpCtxOf(d), null); if (xpEquip(k, dfSlotFor(k, c), v)) dfCall(() => sfx('pop'), 0); }
  else if (a === 'prov') { const p = dfCall(() => eqPlanProv(), null); if (p && p.length < 3) p.push(v); }
  else if (a === 'hint') { toast(v); return; }
  const b = $('panelBody'), y = b ? b.scrollTop : 0; dfCall(() => renderPanel(), 0); if (b) b.scrollTop = y;
  dfCall(() => dfMapUpdate(true), 0);
});

// ---------------- carte : cercle de portée, lieux hors portée, lieux épuisés ----------------
let dfSig = '';
function dfMapUpdate(force) {
  if (typeof map === 'undefined' || !map || !mapReady || !map.getStyle) return;
  const k = S.sel, h = homeObj(), on = !!(CHARS[k] && !S.trips[k] && !dfTuto() && !document.body.classList.contains('firstrun'));
  const R = on ? dfRange(k, plan.dest || null) : null, show = !!(R && !R.world);
  const sig = [show ? R.km : 0, h.lon, h.lat].join('|');
  if (!map.getSource('dfRange')) {
    try {
      map.addSource('dfRange', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      const bef = map.getLayer('route-shadow') ? 'route-shadow' : undefined;
      map.addLayer({ id: 'dfRangeF', type: 'fill', source: 'dfRange', paint: { 'fill-color': '#2f7f6c', 'fill-opacity': 0.07 } }, bef);
      map.addLayer({ id: 'dfRangeL', type: 'line', source: 'dfRange', paint: { 'line-color': '#2f7f6c', 'line-width': 2.5, 'line-opacity': 0.75, 'line-dasharray': [2, 2] } }, bef);
      dfSig = '';
    } catch (e) { return; }
  }
  if (sig !== dfSig || force) {
    dfSig = sig;
    const g = show ? d3.geoCircle().center([h.lon, h.lat]).radius(R.km / 111.195).precision(2)() : null;
    if (g) g.coordinates = g.coordinates.map(ring => ring.slice().reverse()); // sens trigonométrique pour MapLibre
    dfCall(() => map.getSource('dfRange').setData({ type: 'FeatureCollection', features: g ? [{ type: 'Feature', properties: {}, geometry: g }] : [] }), 0);
  }
  // lieux hors portée estompés
  for (const p of PLACES) { const o = ovEls['p' + p.id]; if (o) o.el.classList.toggle('dffar', !!(show && kmBetween(h, p) > R.km)); }
  // lieux épuisés (épingles des lieux et des lieux du quotidien)
  const D = dfState(), now = Date.now(), hot = new Set(Object.keys(D.ex).filter(kk => (D.ex[kk] || []).some(ts => now - ts < DF_REGROW)));
  for (const [key, o] of Object.entries(ovEls)) {
    if (!/^[pq]/.test(key) || !o || !o.el) continue;
    const lon = o.lon != null ? o.lon : o.poi && o.poi.lon, lat = o.lat != null ? o.lat : o.poi && o.poi.lat;
    const kk = isFinite(+lon) && isFinite(+lat) ? dfKey({ lon, lat }) : '', ex = hot.has(kk);
    o.el.classList.toggle('dfexp', ex);
    if (ex) { const I = dfExInfo({ lon, lat }); o.el.dataset.dfex = `Lieu épuisé : revient dans ${dfLeft(I.back)}`; o.el.title = o.el.dataset.dfex; } else if (o.el.dataset.dfex) { delete o.el.dataset.dfex; o.el.removeAttribute('title'); }
  }
}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); dfCall(() => dfMapUpdate(), 0); return r; })(drawMarks);
setInterval(() => { if (!document.hidden) dfCall(() => dfMapUpdate(), 0); }, 3000);

// ---------------- « Comment ça marche » ----------------
if (typeof cmHowHTML === 'function') cmHowHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  try {
    const add = `<div class="xp-how"><p>${dfGly('far', '#2f7f6c')}<span><b>Portée</b> : chaque familier part à 50 km au début. Boussole, plats d’endurance, matériel, vêtements d’explorateur, confort du foyer et croissance l’agrandissent (cercle sur la carte).</span></p><p>${dfGly('robu', '#5f8fb8')}<span><b>Terrains durs</b> : sans le bon matériel, la montagne, le froid, le désert et la mer sont très risqués.</span></p></div>`;
    const at = h.lastIndexOf('<button class="btn green" data-closemodal');
    return at >= 0 ? h.slice(0, at) + add + h.slice(at) : h;
  } catch (e) { return h; }
})(cmHowHTML);

// ---------------- style ----------------
(function dfCSS() {
  const st = document.createElement('style'); st.id = 'dfCSS';
  st.textContent = `
.dfc{margin:8px 0 10px;padding:10px 11px 11px;border:2.5px solid var(--ink,#4a3528);border-radius:20px;background:linear-gradient(180deg,#fffdf6,#fff6e6);box-shadow:0 3px 0 rgba(74,53,40,.18);display:flex;flex-direction:column;gap:7px}
.dfc.far{background:linear-gradient(180deg,#fff6f1,#ffece4);border-color:#c9604f}
.dfc-top{display:flex;align-items:center;gap:9px}
.dfc .dfc-top img.dfc-pic{width:46px!important;height:50px!important;max-width:46px;object-fit:contain;flex:none;margin:-4px 0;position:static;transform:none}
.dfc .dfc-top .livep{width:46px!important;height:50px!important;max-width:46px;flex:none;overflow:hidden;position:static;transform:none;margin:-4px 0}.dfc .dfc-top .livep svg,.dfc .dfc-top .livep img{width:100%!important;height:100%!important}
.dfc-who{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dfc-who b{font:800 17px/1.05 var(--display,inherit);color:var(--ink,#4a3528)}
.dfc-who small{font:600 12px var(--body,inherit);color:var(--ink2,#7a6250);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dfc-ter{display:inline-flex;align-items:center;gap:4px;align-self:flex-start;margin-top:2px;padding:1px 8px 1px 2px;border-radius:999px;background:color-mix(in srgb,var(--tc) 18%,#fff);border:1.5px solid var(--tc);font:800 11.5px var(--display,inherit);color:var(--ink,#4a3528)}
.dfc-ter .rgb{--sz:18px}
.dfring{position:relative;width:66px;height:66px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dfring svg{position:absolute;inset:0;width:100%;height:100%}
.dfring circle{fill:none;stroke-width:7}.dfring .bg{stroke:#efe4d2}.dfring .fg{stroke-linecap:round;stroke:#3f9a5f}
.dfring.mid .fg{stroke:#e0952f}.dfring.bad .fg{stroke:#d0463f}
.dfring b{position:relative;font:800 17px/1 var(--display,inherit);color:var(--ink,#4a3528)}
.dfring small{position:relative;font:700 9.5px var(--body,inherit);color:var(--ink2,#7a6250);text-transform:uppercase;letter-spacing:.04em}
.dfc-far{margin:0;display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-radius:12px;background:#fff;border:1.8px solid #e3a191}
.dfc-far b{display:block;font:800 13.5px/1.2 var(--display,inherit);color:#a8352f}.dfc-far small{display:block;font-size:12px;line-height:1.3;color:#7a4a3a;margin-top:1px}
.dfg{width:22px;height:22px;border-radius:50%;background:var(--c);border:1.6px solid var(--ink,#4a3528);display:inline-flex;align-items:center;justify-content:center;flex:none}
.dfg svg{width:15px;height:15px}
.dfst{display:flex;flex-direction:column;gap:5px}
.dfs{display:grid;grid-template-columns:22px 74px minmax(40px,1fr) auto;align-items:center;gap:6px}
.dfs-n{font:800 12.5px var(--display,inherit);color:var(--ink,#4a3528)}
.dfs-v{font:700 11.5px var(--body,inherit);color:var(--ink2,#7a6250);text-align:right;white-space:nowrap}
.dfs-v.ok{color:#2f7f4c}.dfs-v.no{color:#b8403a}
.dfbar{position:relative;height:10px;border-radius:6px;background:#efe4d2;border:1.5px solid rgba(74,53,40,.25)}
.dfbar i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:#c9853a}
.dfbar.fl i{background:#e2b23a}.dfbar.rb i{background:#3f9a5f}.dfbar.rb.mid i{background:#e0952f}.dfbar.rb.bad i{background:#d0463f}
.dfbar.end.no i{background:#d9a07a}
.dfbar em{position:absolute;top:-4px;width:3px;height:16px;margin-left:-1.5px;border-radius:2px;background:var(--ink,#4a3528)}
.dfbar.end.no em{background:#c9403a}
.dfc-note{margin:0;font-size:12px;line-height:1.35;color:var(--ink2,#7a6250)}
.dfc-note b{color:var(--ink,#4a3528)}
.dfc-pts{display:block;font-size:11px;color:#9a8470}
.dfc-cmp{display:flex;align-items:center;justify-content:center;gap:8px;padding:5px 8px;border-radius:12px;background:#fff;border:1.5px dashed #d8c6aa;font:700 12px var(--body,inherit);color:var(--ink2,#7a6250)}
.dfc-cmp b{font:800 15px var(--display,inherit);padding:0 6px;border-radius:999px;color:#fff;background:#3f9a5f}
.dfc-cmp b.mid{background:#e0952f}.dfc-cmp b.bad{background:#d0463f}
.dfc-cmp .arr{font:800 16px var(--display,inherit);color:var(--ink,#4a3528)}
.dfh{margin:2px 0 -2px;font:800 11.5px var(--display,inherit);letter-spacing:.05em;text-transform:uppercase;color:var(--ink2,#7a6250);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dfex{text-transform:none;letter-spacing:0;font:800 11px var(--body,inherit);color:#8a5a2a;background:#f6e3c6;border:1.5px solid #d9a868;border-radius:999px;padding:0 7px}
.dfws{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
.dfw{display:flex;align-items:center;gap:6px;min-width:0;padding:3px 6px 3px 3px;border-radius:12px;background:#fff;border:1.6px solid #e2d3bd}
.dfw.off{opacity:.5;filter:grayscale(.7);background:#f7f2ea}
.dfw-i{width:30px;height:30px;flex:none;display:flex;align-items:center;justify-content:center}.dfw-i svg{width:30px;height:30px}
.dfw-set{font:800 12px var(--display,inherit);color:#8a6fc4}
.dfw-t{min-width:0;display:flex;flex-direction:column}
.dfw-t b{font:800 11.5px/1.15 var(--display,inherit);color:var(--ink,#4a3528);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dfw-t small{font:700 11px/1.2 var(--body,inherit);color:#2f7f4c}
.dfw.off .dfw-t small{color:#8a7a6a}
.df-none{margin:0;font-size:12px;color:var(--ink2,#7a6250)}
.dfls{display:flex;gap:6px;flex-wrap:wrap}
.dfl{width:40px;height:40px;border-radius:12px;background:#fff;border:2px solid color-mix(in srgb,var(--rc) 60%,#e2d3bd);display:flex;align-items:center;justify-content:center;padding:3px}
.dfl svg{width:100%;height:100%}
.dfl.rare{background:radial-gradient(circle,#fff8d8 30%,#ffe9a6);border-color:#e0a52a;box-shadow:0 0 0 2px rgba(224,165,42,.25),0 0 10px rgba(242,193,78,.7)}
.dfl.sp b{font:800 18px var(--display,inherit);color:#b07a1a}
.dftips{display:flex;flex-direction:column;gap:5px}
.dftip{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 10px;border-radius:14px;border:2px solid var(--ink,#4a3528);background:#e8f6ee;cursor:pointer;font:800 13px var(--display,inherit);color:var(--ink,#4a3528);box-shadow:0 2.5px 0 rgba(74,53,40,.3);text-align:left}
.dftip b{flex:none;padding:1px 8px;border-radius:999px;background:#2f7f6c;color:#fff;font:800 12px var(--display,inherit)}
.dftip:active{transform:translateY(2px);box-shadow:none}
#goBtn.df-off{filter:grayscale(.6);opacity:.75}
.ovm.dffar{opacity:.4;filter:grayscale(.5)}
.ovm.dfexp{filter:saturate(.45)}
.ovm.dfexp::before{content:'zz';position:absolute;left:8px;top:-22px;font:800 10px var(--display,inherit);color:#7a6a5a;background:#f3ecdf;border:1.5px solid #b9a58a;border-radius:999px;padding:0 4px;pointer-events:none;z-index:2}
`;
  document.head.appendChild(st);
})();

window.__df = {
  state: dfState, range: dfRange, check: dfCheck, risk: dfRiskOf, exInfo: dfExInfo, visit: dfVisit, exempt: dfExempt, mapUpdate: dfMapUpdate, T: DF_T,
  api: () => ({ S, plan, startTrip, collect, tick, renderPanel, openSheet, lootFor, xpEquip, xpEq, map: typeof map !== 'undefined' ? map : null }),
};

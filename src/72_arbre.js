// ================= 72 · UN VRAI ARBRE DE TALENTS (v46) =================
// Le joueur (13/11) : « plus on monte de niveau, plus on débloque de points ; on garde cette esthétique ; plusieurs
// branches pour vraiment le développer ; que ça ait du sens, qu'on ressente les améliorations sans que ça devienne cheaté,
// qu'améliorer le personnage devienne indispensable, et cohérent avec la race ».
// • Points (32_compagnons.js cpPtsTotal) : 1 par niveau jusqu'au niv. 4, puis 2 (niv. 5-9), 3 (niv. 10-14), 4 ensuite.
// • Chaque branche (Explorateur, Trouvailles, Charmeur) : un tronc de 2 talents, puis 2 rameaux de 3 talents, puis le
//   talent SIGNATURE de l'espèce (ses anciens talents de race : Nageuse pour l'axolotl, Grimpeuse pour le panda…).
//   Rameaux : niveau 3 ; 3e talent d'un rameau : niveau 6 ; signature : niveau 10 + un rameau complet.
// • Effets chiffrés, modestes un par un mais qui s'additionnent : on sent la différence, sans tout casser.
// • L'espèce compte aussi : la signature, et un talent de chaque branche « de race » (bonus doublé si c'est son terrain).
// Anciennes parties : l'arbre change → tous les points sont rendus une fois (S.tlMig2), à replacer librement.
const TL_FX = {}; // id d'effet → [type, valeur, texte]
const tlFx = (id, kind, v, txt, ico) => { TL_FX[id] = [kind, v, txt]; CP_EFF[id] = txt; if (CP_ICO[ico]) CP_ICO[id] = CP_ICO[ico]; return id; };
// [id, nom, effet, rameau ('' tronc, 'a', 'b', 's' signature), rang dans la colonne (1 = en bas)]
const TL_BR = {
  E: { a: 'Grand voyageur', b: 'Baroudeur', nodes: [
    ['1', 'Pas léger', tlFx('xe_v1', 'vite', 0.08, 'Voyages 8 % plus courts', 'vite'), '', 1],
    ['2', 'Bon souffle', tlFx('xe_k1', 'km', 30, '+30 km de portée', 'eclair'), '', 2],
    ['3a', 'Longue route', tlFx('xe_k2', 'km', 50, '+50 km de portée', 'eclair'), 'a', 3],
    ['4a', 'Raccourcis', tlFx('xe_v2', 'vite', 0.12, 'Voyages 12 % plus courts', 'vite'), 'a', 4],
    ['5a', 'Globe-trotteur', tlFx('xe_k3', 'km', 90, '+90 km de portée', 'eclair'), 'a', 5],
    ['3b', 'Pied sûr', tlFx('xe_r1', 'risk', 0.08, '8 % de risques en moins', 'zen'), 'b', 3],
    ['4b', 'Tout-terrain', tlFx('xe_h1', 'riskHard', 0.15, '15 % de risques en moins en montagne, neige, désert et mer', 'audace'), 'b', 4],
    ['5b', 'Increvable', tlFx('xe_r2', 'risk', 0.12, '12 % de risques en moins', 'zen'), 'b', 5],
  ] },
  T: { a: 'Fouineur', b: 'Chanceux', nodes: [
    ['1', 'Flair', tlFx('xt_l1', 'loot', 1, 'Une trouvaille de plus à chaque voyage', 'flair'), '', 1],
    ['2', 'Œil vif', tlFx('xt_q1', 'rare', 0.4, 'Objets un peu plus rares', 'rare'), '', 2],
    ['3a', 'Fouille', tlFx('xt_l2', 'loot', 1, 'Encore une trouvaille de plus', 'flair'), 'a', 3],
    ['4a', 'Sentiers cachés', 'cache', 'a', 4],
    ['5a', 'Sac sans fond', tlFx('xt_l3', 'loot', 2, 'Deux trouvailles de plus', 'flair'), 'a', 5],
    ['3b', 'Bonne étoile', tlFx('xt_q2', 'rare', 0.5, 'Objets plus rares', 'rare'), 'b', 3],
    ['4b', 'Porte-bonheur', 'chance', 'b', 4],
    ['5b', 'Pépites', tlFx('xt_q3', 'rare', 0.8, 'Objets bien plus rares', 'chance'), 'b', 5],
  ] },
  C: { a: 'Commerçant', b: 'Ami des bêtes', nodes: [
    ['1', 'Main tendre', tlFx('xc_t1', 'tame', 0.08, 'Apprivoiser : +8 % de chances', 'ami'), '', 1],
    ['2', 'Sourire', tlFx('xc_s1', 'sell', 0.08, 'Plats vendus 8 % plus cher au comptoir', 'nego'), '', 2],
    ['3a', 'Marchandage', 'nego', 'a', 3],
    ['4a', 'Petite star', 'renom', 'a', 4],
    ['5a', 'Coqueluche', 'fan', 'a', 5],
    ['3b', 'Ami des oiseaux', 'oiseau', 'b', 3],
    ['4b', 'Nid douillet', tlFx('xc_e1', 'egg', 0.5, 'Œufs et rencontres plus fréquents', 'ami'), 'b', 4],
    ['5b', 'Murmure', tlFx('xc_t2', 'tame', 0.15, 'Apprivoiser : +15 % de chances', 'ami'), 'b', 5],
  ] },
};
// la signature de chaque branche, selon l'espèce (ses talents de race d'avant) ; sinon une signature commune
const TL_SIG_DEF = { E: ['Grand voyageur', 'eclair'], T: ['Chasseur de trésors', 'tresor'], C: ['Coeur d’or', tlFx('xc_x1', 'xp', 0.25, '+25 % d’expérience à chaque voyage', 'fan')] };
function tlSig(k, B) {
  const o = CP_SP[cpSp(k)] || {};
  return o[B + '3'] || o[B + '2'] || o[B + '1'] || TL_SIG_DEF[B];
}
const TL_COLX = { '': 0, a: -8.25, b: 8.25, s: 0 };
const TL_X = { E: 16.75, T: 50, C: 83.25 }; // un peu resserré : les rameaux ne sortent pas du cadre
const TL_RS = { E: { a: 'Voyageur', b: 'Baroudeur' }, T: { a: 'Fouineur', b: 'Chanceux' }, C: { a: 'Commerce', b: 'Bêtes' } };
const TL_Y = { 1: 88, 2: 74, 3: 59, 4: 45, 5: 31, 6: 15 };
cpTree = function (k) {
  const out = [];
  for (const B of CP_BR) {
    const D = TL_BR[B.id];
    D.nodes.forEach(([n, name, eff, r, row]) => out.push({ id: B.id + n, br: B.id, tier: row, ram: r, name, eff, B, x: TL_X[B.id] + TL_COLX[r] }));
    const [sn, se] = tlSig(k, B.id);
    out.push({ id: B.id + '6', br: B.id, tier: 6, ram: 's', name: sn, eff: se, B, x: TL_X[B.id], sig: 1 });
  }
  return out;
};
const tlLvl = k => (S.prog[k] && S.prog[k].lvl) || 1;
const TL_NEED_LVL = { 3: 3, 4: 3, 5: 6, 6: 10 };
function tlPrev(n) { // le talent qu'il faut avoir avant
  const b = n.br;
  if (n.ram === '' ) return n.tier === 1 ? null : [b + '1'];
  if (n.ram === 's') return [b + '5a', b + '5b']; // l'un OU l'autre
  return [n.tier === 3 ? b + '2' : b + (n.tier - 1) + n.ram];
}
cpCan = function (k, node) {
  if (cpHas(k, node.id)) return 'on';
  const pv = tlPrev(node);
  if (pv && !pv.some(id => cpHas(k, id))) return 'lock';
  if (TL_NEED_LVL[node.tier] && tlLvl(k) < TL_NEED_LVL[node.tier]) return 'lock';
  return cpPtsFree(k) > 0 ? 'can' : 'wait';
};
cpLearn = function (k, id) {
  const node = cpTree(k).find(x => x.id === id); if (!node || cpCan(k, node) !== 'can') return false;
  cpState(k).n[id] = 1; save(); return true;
};
// anciennes parties : l'arbre a changé, on rend tous les points une fois
function tlMigrate() {
  if (S.tlMig2) return;
  S.tlMig2 = 1;
  try { cpMigrate(); Object.keys(S.tl || {}).forEach(k => { const T = S.tl[k]; if (T) { T.n = {}; T.leg = []; } }); } catch (e) {}
  setTimeout(() => { try { if (Object.keys(S.comps || {}).length > 1 || Object.values(S.prog || {}).some(p => p.lvl > 1)) toast('L’arbre de talents a grandi : vos points vous ont été rendus, replacez-les dans Compagnons › Talents.'); } catch (e) {} }, 2500);
}
setTimeout(() => { try { tlMigrate(); save(); } catch (e) {} }, 0);

// ---------------- effets chiffrés ----------------
function tlSum(k, kind) {
  if (!k || !S.comps || !S.comps[k]) return 0;
  let s = 0;
  try { cpTree(k).forEach(n => { const F = TL_FX[n.eff]; if (F && F[0] === kind && cpHas(k, n.id)) s += F[1]; }); } catch (e) {}
  return s;
}
const TL_HARD = ['montagne', 'neige', 'desert', 'mer'];
// au départ : voyages plus courts, objets plus rares
if (typeof GAME !== 'undefined') GAME.on('trip:start', ({ who, trip }) => {
  try {
    const t = trip; if (!t || t.tlDone) return; t.tlDone = 1;
    const v = Math.min(0.35, tlSum(who, 'vite'));
    if (v > 0 && t.out > 0) { t.out = Math.round(t.out * (1 - v)); t.stay = Math.round((t.stay || 0) * (1 - v)); t.total = 2 * t.out + (t.stay || 0); }
    const q = tlSum(who, 'rare'); if (q) t.luck = (t.luck || 0) + q;
  } catch (e) { console.error('talents départ', e); }
});
// portée
if (typeof dfRange === 'function') dfRange = (orig => function (k) {
  const R = orig.apply(this, arguments);
  try { const km = tlSum(k, 'km'); if (km && R) { R.parts.push({ id: 'tal', lbl: 'Talents', km }); R.km += km; R.sum = (R.sum || 0) + km; R.world = R.km >= DF_WORLD; } } catch (e) {}
  return R;
})(dfRange);
// risques
if (typeof xpRiskK === 'function') xpRiskK = (orig => function (k, c) {
  let r = orig.apply(this, arguments);
  try { let m = 1 - Math.min(0.3, tlSum(k, 'risk')); if (c && TL_HARD.includes(c.terr)) m *= 1 - tlSum(k, 'riskHard'); if (r > 0 && m < 1) r = Math.max(0.03, r * m); } catch (e) {}
  return r;
})(xpRiskK);
// au retour : trouvailles en plus, expérience
if (typeof collect === 'function') collect = (orig => function () {
  try {
    const k = S.sel, t = S.trips[k];
    if (t && t.done && !t.tuto && !t.tlL && Array.isArray(t.bag) && t.dest && !t.xpFail) {
      t.tlL = 1;
      const n = tlSum(k, 'loot'); if (n) t.bag.push(...lootFor(t.dest.tags || ['campagne'], t.luck || 0, t.dest.name, n, k));
      const x = tlSum(k, 'xp'); if (x) t.xp = Math.round((t.xp || 0) * (1 + x));
    }
  } catch (e) { console.error('talents retour', e); }
  return orig.apply(this, arguments);
})(collect);
// œufs et rencontres
if (typeof nsTripEgg === 'function') nsTripEgg = (orig => function (e) {
  let r = orig.apply(this, arguments);
  try { const k = e && e.trip ? e.trip.comp || S.sel : S.sel, p = tlSum(k, 'egg'); if (!r && p && Math.random() < p) { const N = nsState(); if (N.dry > 0) N.dry--; r = orig.apply(this, arguments); } } catch (x) {}
  return r;
})(nsTripEgg);
// apprivoiser
if (typeof nsTameChance === 'function') nsTameChance = (orig => function () {
  let p = orig.apply(this, arguments);
  try { const b = tlSum(S.sel, 'tame'); if (b) p = Math.min(0.97, p + b); } catch (e) {}
  return p;
})(nsTameChance);
// comptoir : le meilleur « Sourire » de l'équipe
if (typeof cmFinish === 'function') cmFinish = (orig => function () {
  const it = orig.apply(this, arguments);
  try { const b = Math.max(0, ...Object.keys(S.comps || {}).map(k => tlSum(k, 'sell'))); if (b && it && it.mk) it.mk.p = Math.round(it.mk.p * (1 + b)); } catch (e) {}
  return it;
})(cmFinish);

// ---------------- l'arbre à l'écran (même style : couleurs, ronds, traits courbes) ----------------
function tlTreeHTML(k) {
  const tree = cpTree(k), sel = typeof cpSelNode !== 'undefined' ? cpSelNode : null;
  const pos = id => tree.find(n => n.id === id);
  const line = (a, b, col, on) => `<path d="M${a.x} ${TL_Y[a.tier]} C${a.x} ${(TL_Y[a.tier] + TL_Y[b.tier]) / 2} ${b.x} ${(TL_Y[a.tier] + TL_Y[b.tier]) / 2} ${b.x} ${TL_Y[b.tier]}" class="${on ? 'on' : ''}" style="--bc:${col}" vector-effect="non-scaling-stroke"/>`;
  let lines = '';
  for (const B of CP_BR) {
    lines += `<path d="M50 99 C50 ${(99 + TL_Y[1]) / 2} ${TL_X[B.id]} ${(99 + TL_Y[1]) / 2} ${TL_X[B.id]} ${TL_Y[1]}" class="${cpHas(k, B.id + '1') ? 'on' : ''}" style="--bc:${B.col}" vector-effect="non-scaling-stroke"/>`;
    tree.filter(n => n.br === B.id && n.tier > 1).forEach(n => { const pv = tlPrev(n); pv.forEach(id => { const a = pos(id); if (a) lines += line(a, n, B.col, cpHas(k, n.id) && cpHas(k, id)); }); });
  }
  let h = `<div class="cptree tl-big"><svg class="cptl" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  h += CP_BR.map(B => `<span class="cpbr" style="left:${TL_X[B.id]}%;--bc:${B.col};--bs:${B.soft}">${esc(B.name)}</span>`).join('');
  h += CP_BR.map(B => ['a', 'b'].map(r => `<span class="tl-ram" style="left:${TL_X[B.id] + TL_COLX[r]}%;top:${TL_Y[3] + 6.8}%;--bc:${B.col}">${esc(TL_RS[B.id][r])}</span>`).join('')).join('');
  h += tree.map(n => {
    const st = cpCan(k, n), small = n.ram === 'a' || n.ram === 'b';
    return `<button class="cpn st-${st} ${n.sig ? 't3' : small ? 'tl-s' : ''} ${sel === n.id ? 'sel' : ''}" data-cpn="${n.id}" style="left:${n.x}%;top:${TL_Y[n.tier]}%;--bc:${n.B.col};--bs:${n.B.soft}" aria-label="${esc(n.name)}${st === 'on' ? ' (appris)' : ''}">${cpIco(n.eff)}${n.sig ? '<i class="cpsig">★</i>' : ''}${st === 'on' ? '<i class="cpok">✓</i>' : st === 'lock' ? '<i class="cplk"></i>' : ''}</button>`;
  }).join('');
  return h + `<span class="tl-root" style="--gs:${typeof gwScale === 'function' ? gwScale(k) : 1}">${drawChar(k, S.outfits[k], 'content', 'tlr' + k)}</span></div>`;
}
function tlInfoHTML(k, n) {
  const st = cpCan(k, n), lv = tlLvl(k), need = TL_NEED_LVL[n.tier];
  const why = st === 'wait' ? 'Plus de points : niveau suivant' : need && lv < need ? `Niv. ${need}` : n.sig ? 'Finir un rameau' : 'Apprendre le talent d’avant';
  const ram = n.ram === 'a' || n.ram === 'b' ? ` · ${TL_BR[n.br][n.ram]}` : n.sig ? ' · talent de son espèce' : '';
  return `<div class="cptinfo" style="--bc:${n.B.col};--bs:${n.B.soft}"><span class="cpti">${cpIco(n.eff)}</span><div><b>${esc(n.name)}${n.sig ? ' <i class="cpsigt">Signature</i>' : ''}</b><span>${esc(CP_EFF[n.eff] || '')}<small class="tl-ramt">${esc(n.B.name + ram)}</small></span></div>${st === 'on' ? '<span class="cptag">Appris</span>' : st === 'can' ? `<button class="btn green sm" data-cplearn="${n.id}">Apprendre</button>` : `<span class="cptag off">${why}</span>`}</div>`;
}
renderTalents = (orig => function (k) {
  const html = orig.apply(this, arguments);
  try {
    const T = document.createElement('template'); T.innerHTML = html;
    const tr = T.content.querySelector('.cptree'); if (tr) tr.outerHTML = tlTreeHTML(k);
    const inf = T.content.querySelector('.cptinfo'), n = cpTree(k).find(x => x.id === cpSelNode);
    if (inf && n) inf.outerHTML = tlInfoHTML(k, n);
    const d = document.createElement('div'); d.appendChild(T.content.cloneNode(true)); return d.innerHTML;
  } catch (e) { console.error('arbre', e); return html; }
})(renderTalents);
{
  const st = document.createElement('style');
  st.textContent = `.cptree.tl-big{aspect-ratio:auto;height:min(560px,78vh);background:radial-gradient(ellipse at 50% 100%,#e8f4d8 0 26%,transparent 62%),#fffaf0}
.cptree.tl-big .cpn{width:13.5%;max-width:52px}.cptree.tl-big .cpn.tl-s{width:11%;max-width:42px;border-width:2.5px}.cptree.tl-big .cpn.t3{width:15.5%;max-width:60px}
.tl-ram{position:absolute;transform:translate(-50%,-50%);font:800 8.5px var(--display,inherit);text-transform:uppercase;letter-spacing:.02em;color:var(--bc);background:rgba(255,250,240,.92);padding:0 3px;border-radius:5px;white-space:nowrap;pointer-events:none}
.tl-root{position:absolute;left:50%;bottom:-2%;width:22%;max-width:90px;transform:translateX(-50%);pointer-events:none}
.tl-root>svg{width:100%;height:auto;display:block;scale:var(--gs,1);transform-origin:50% 100%}
.tl-ramt{display:block;font-size:11px;font-weight:800;color:var(--bc);margin-top:1px}`;
  document.head.appendChild(st);
}
window.__tl = { tree: k => cpTree(k), sum: tlSum, can: (k, id) => cpCan(k, cpTree(k).find(x => x.id === id)), learn: (k, id) => cpLearn(k, id) };

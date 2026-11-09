// ================= v35 : LE SENTIMENT DE PROGRESSION =================
// 1. CONSTRUIRE : la maison (Foyer) et la boutique (onglet Préparer du comptoir) s'agrandissent avec des MATÉRIAUX.
//    10 améliorations × 3 niveaux, chacune avec un effet réel, et un petit dessin ajouté à la scène.
// 2. NOURRIR LES FAMILIERS : depuis leur fiche (Talents). La nourriture donne de l'XP (plat préféré ×2) ; les stades de
//    croissance viennent de 45_equipage.js (eqStage) ; à chaque stade, un POUVOIR (Flair, Endurance, Bonne étoile).
// 3. RANG D'EXPLORATEUR : calculé à partir de ce que le joueur a fait. Badge discret dans le HUD, à côté des pièces.
// 4. PASSEPORT : un tampon par région visitée, dans l'Album ; paliers de tampons récompensés.
// État : S.prg = { b: {id: niveau}, rk: dernier rang vu, pal: {palier: 1}, pw: {familier: stade vu}, rec: {commerce: n}, gift: {} }.
// Enveloppes : fyRender, cmRecipesHTML, czSceneHTML, cmState, cmTickBuyers, cmSell, nsLayout, nsRoomFor, fyCapInfo, fyMods,
// famSow, wdMomentsHTML, renderTalents, startTrip, collect, renderTop, renderAlbum. Usages : GAME.addUses / GAME.addAction.
// Tests : window.__prg.

const pgCall = (f, d) => { try { return f(); } catch (e) { return d; } };
function pgState() {
  if (!S.prg || typeof S.prg !== 'object' || Array.isArray(S.prg)) S.prg = {};
  const P = S.prg;
  ['b', 'pal', 'pw', 'rec', 'gift'].forEach(k => { if (!P[k] || typeof P[k] !== 'object' || Array.isArray(P[k])) P[k] = {}; });
  return P;
}
const pgLvl = id => Math.max(0, Math.min(3, +pgState().b[id] || 0));
const pgTuto = () => pgCall(() => tuOn(), false);

// ---------------- 1. CONSTRUIRE ----------------
const PG_MAT = { bois: ['planche', 'planches'], pierre: ['pierre', 'pierres'], tissu: ['tissu', 'tissus'], metal: ['métal', 'métaux'], verre: ['verre', 'verres'], cristal: ['cristal', 'cristaux'] };
const PG_B = [
  { id: 'chambre', w: 'maison', nm: 'Chambre d’amis', eff: l => `+${l} familier${l > 1 ? 's' : ''} logé${l > 1 ? 's' : ''} au foyer`,
    cost: [[['bois', 6], ['tissu', 3], ['pierre', 2]], [['bois', 10], ['tissu', 5], ['verre', 2]], [['bois', 14], ['tissu', 8], ['metal', 4]]] },
  { id: 'serre', w: 'maison', nm: 'Serre', eff: l => `Jardin : les graines poussent ${[0, 20, 35, 50][l]} % plus vite`,
    cost: [[['verre', 4], ['bois', 4]], [['verre', 7], ['bois', 6], ['metal', 2]], [['verre', 10], ['metal', 5], ['pierre', 4]]] },
  { id: 'atelier', w: 'maison', nm: 'Atelier agrandi', eff: l => `${15 * l} % de chances de fabriquer en double`,
    cost: [[['bois', 5], ['metal', 3]], [['bois', 8], ['metal', 5], ['pierre', 3]], [['bois', 12], ['metal', 8], ['verre', 3]]] },
  { id: 'cheminee', w: 'maison', nm: 'Cheminée', eff: l => `Repos ${['', '1,5', '2', '2,5'][l]}× plus rapide · familier reposé : −${10 + 5 * l} % de risques`,
    cost: [[['pierre', 6], ['metal', 2]], [['pierre', 10], ['metal', 3], ['bois', 4]], [['pierre', 14], ['metal', 5], ['verre', 2]]] },
  { id: 'repas', w: 'maison', nm: 'Coin repas', eff: l => `Nourrir un familier : +${25 * l} % d’XP`,
    cost: [[['bois', 4], ['tissu', 2]], [['bois', 6], ['tissu', 4], ['pierre', 3]], [['bois', 10], ['tissu', 6], ['verre', 3]]] },
  { id: 'observ', w: 'maison', nm: 'Observatoire', rank: 3, eff: l => `Moments rares annoncés ${[45, 90, 150, 240][l]} jours à l’avance (au lieu de 45)`,
    cost: [[['verre', 4], ['metal', 4], ['pierre', 4]], [['verre', 6], ['metal', 6], ['cristal', 1]], [['verre', 10], ['metal', 8], ['cristal', 2]]] },
  { id: 'vitrine', w: 'boutique', nm: 'Vitrine', eff: l => `+${l} client${l > 1 ? 's' : ''} dans la file`,
    cost: [[['verre', 3], ['bois', 4]], [['verre', 6], ['bois', 6], ['metal', 2]], [['verre', 9], ['metal', 4], ['tissu', 3]]] },
  { id: 'cuisine', w: 'boutique', nm: 'Cuisine agrandie', eff: l => `+${l} place${l > 1 ? 's' : ''} de préparation`,
    cost: [[['metal', 4], ['pierre', 4], ['bois', 2]], [['metal', 6], ['pierre', 6], ['bois', 4]], [['metal', 10], ['pierre', 8], ['verre', 3]]] },
  { id: 'terrasse', w: 'boutique', nm: 'Terrasse', eff: l => `Les clients paient +${10 * l} %`,
    cost: [[['bois', 6], ['tissu', 3]], [['bois', 8], ['tissu', 5], ['pierre', 4]], [['bois', 12], ['tissu', 8], ['pierre', 6]]] },
  { id: 'enseigne', w: 'boutique', nm: 'Enseigne lumineuse', eff: l => `Amitié des clients ×${['1', '1,5', '2', '3'][l]} : plus de clients fidèles`,
    cost: [[['metal', 3], ['verre', 3]], [['metal', 5], ['verre', 5], ['bois', 3]], [['metal', 8], ['verre', 8], ['cristal', 1]]] },
];
const PG_BY = {}; PG_B.forEach(B => { PG_BY[B.id] = B; });
const PG_LV_RANK = [0, 1, 2, 6]; // niveau 2 : rang Randonneur ; niveau 3 : rang Grand explorateur
const pgNeedRank = (B, lv) => Math.max(PG_LV_RANK[lv] || 1, lv === 1 && B.rank ? B.rank : 1);
// un matériau utilisable : la bonne sous-famille, pas un produit du commerce, pas un trésor
function pgUsable(it, key) {
  if (!it || it.cat !== 'm' || it.mk || it.tresor || it.special || it.rel || (it.rarity || 0) > 2) return false;
  const subs = ING[key] ? ING[key][0] : [key]; if (!subs.includes(it.sub)) return false;
  return pgCall(() => famOf(it) === 'materiaux', true);
}
const pgHave = key => (S.inv || []).filter(it => pgUsable(it, key)).length;
function pgTake(key, n) {
  const c = S.inv.filter(it => pgUsable(it, key)).sort((a, b) => (a.rid ? 1 : 0) - (b.rid ? 1 : 0) || (a.rarity || 0) - (b.rarity || 0));
  c.slice(0, n).forEach(it => S.inv.splice(S.inv.indexOf(it), 1));
}
const pgMatKey = it => Object.keys(PG_MAT).find(k => pgUsable(it, k)) || null;
const pgMatTxt = (k, n) => `${n} ${PG_MAT[k] ? PG_MAT[k][n > 1 ? 1 : 0] : k}`;
const pgCostTxt = cost => cost.map(([k, n]) => pgMatTxt(k, n)).join(', ');
function pgMatIco(k) { const r = pgCall(() => cmIngIcon(k), ''); return r || pgCall(() => itemIcon({ cat: 'm', sub: k, color: '#b07a4f' }), ''); }
function pgCan(id) {
  const B = PG_BY[id], l = pgLvl(id); if (!B || l >= 3) return { ok: false, max: true };
  const need = pgNeedRank(B, l + 1), rk = pgRank().i + 1;
  const cost = B.cost[l], miss = cost.filter(([k, n]) => pgHave(k) < n);
  return { ok: rk >= need && !miss.length, rankOk: rk >= need, need, cost, miss };
}
function pgBuild(id) {
  const B = PG_BY[id], c = pgCan(id); if (!B || !c.ok) return false;
  c.cost.forEach(([k, n]) => pgTake(k, n));
  const P = pgState(); P.b[id] = pgLvl(id) + 1;
  S.stats.built = (S.stats.built || 0) + 1;
  save();
  pgCele(`${B.nm} ${P.b[id] > 1 ? 'niveau ' + P.b[id] : ''} construit${B.nm.endsWith('e') && !/Atelier/.test(B.nm) ? 'e' : ''} ! ${B.eff(P.b[id])}`);
  pgCheck();
  return true;
}
let pgMissOpen = null;
function pgMissHTML(id) {
  const c = pgCan(id); if (!c.miss || !c.miss.length) return '';
  const rows = c.miss.map(([k, n]) => {
    const h = pgHave(k), locs = pgCall(() => cfLocs(k), []), buy = pgCall(() => cfShop(k), null), nm = PG_MAT[k] ? PG_MAT[k][1] : k;
    const lr = locs.map(L => { const i = pgCall(() => CF_GO.push({ step: L.step, name: nm, why: PG_BY[id].nm }) - 1, -1); return i < 0 ? '' : `<div class="cf-loc"><span class="cf-lx"><b>${esc(L.label)}</b><small>${esc(L.sub || '')}${L.km != null ? ` · ${pgCall(() => fmtDist(L.km), '')}` : ''}</small></span><button class="btn gold sm" data-cfgo="${i}">Y aller</button></div>`; }).join('');
    return `<div class="cf-mi"><div class="cf-mih"><span class="cf-ii">${pgMatIco(k)}</span><span class="cf-mx"><b>${esc(nm.charAt(0).toUpperCase() + nm.slice(1))}</b><span>Vous en avez <b class="cf-cnt">${Math.min(h, n)}/${n}</b></span></span></div>
      ${lr ? `<div class="cf-locs"><small class="cf-lt">Où le trouver, au plus près :</small>${lr}</div>` : '<p class="cf-lt">En voyage : rues, forêts, ports et chantiers en rapportent.</p>'}
      ${buy ? `<button class="btn cream sm cf-buy" data-cfbuy="${buy.kind}:${esc(buy.key)}" data-pgbuy="1">Acheter ${buy.where} (≈ ${buy.price} pièces)</button>` : ''}</div>`;
  }).join('');
  return `<div class="cf-miss pg-miss"><div class="cf-mh"><b>Il manque pour « ${esc(PG_BY[id].nm)} »</b><button class="cf-x" data-pgx="1" aria-label="Fermer">✕</button></div>${rows}</div>`;
}
const PG_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L14.8 8.6 L21.4 9.3 L16.4 13.7 L17.9 20.3 L12 16.9 L6.1 20.3 L7.6 13.7 L2.6 9.3 L9.2 8.6Z"/></svg>';
function pgCardHTML(B) {
  const l = pgLvl(B.id), c = pgCan(B.id);
  const lv = `<span class="pg-lv" aria-label="Niveau ${l} sur 3">${[1, 2, 3].map(i => `<i class="${i <= l ? 'on' : ''}">${PG_STAR}</i>`).join('')}</span>`;
  let body;
  if (c.max) body = `<p class="pg-eff on">${esc(B.eff(3))}</p><span class="pg-done">Niveau maximum</span>`;
  else {
    const costs = c.cost.map(([k, n]) => { const h = pgHave(k); return `<span class="pg-ing${h >= n ? ' ok' : ''}" title="${esc(pgMatTxt(k, n))}">${pgMatIco(k)}<i>${Math.min(h, n)}/${n}</i></span>`; }).join('');
    const btn = !c.rankOk ? `<span class="pg-lock">Rang ${c.need} : ${esc(PG_RANKS[c.need - 1].n)}</span>`
      : c.ok ? `<button class="btn green sm" data-pgbuild="${B.id}">Construire</button>` : `<button class="btn cream sm" data-pgmiss="${B.id}">Où trouver</button>`;
    body = `${l ? `<p class="pg-eff on">Actuel : ${esc(B.eff(l))}</p>` : ''}<p class="pg-eff">${l ? 'Niveau suivant' : 'Effet'} : <b>${esc(B.eff(l + 1))}</b></p><span class="pg-cost" aria-label="Coût : ${esc(pgCostTxt(c.cost))}">${costs}</span>${btn}`;
  }
  return `<div class="pg-card${c.ok ? ' can' : ''}${l ? ' built' : ''}" data-pgcard="${B.id}"><span class="pg-pic">${pgIconSVG(B.id)}</span><div class="pg-x"><b>${esc(B.nm)}</b>${lv}${body}</div></div>${pgMissOpen === B.id ? pgMissHTML(B.id) : ''}`;
}
function pgBuildHTML(w) {
  const list = PG_B.filter(B => B.w === w);
  const n = list.reduce((a, B) => a + pgLvl(B.id), 0);
  return `<section class="pg-build" id="pgBuild_${w}"><h3 class="pg-h">${pgIconSVG('hammer')}<span>À construire</span><small>${n}/${list.length * 3} · avec les matériaux rapportés de voyage</small></h3><div class="pg-list">${list.map(pgCardHTML).join('')}</div></section>`;
}
// petites icônes des améliorations
const PG_L = '#5b4636';
function pgIconSVG(id) {
  const s = `stroke="${PG_L}" stroke-width="2" stroke-linejoin="round"`;
  const g = {
    chambre: `<path d="M4 22 V12 L14 5 L24 12 V22Z" fill="#f6dcc0" ${s}/><rect x="8" y="15" width="12" height="7" rx="2" fill="#9cc3e6" ${s}/><rect x="8" y="13" width="5" height="3" rx="1.4" fill="#fff" ${s}/>`,
    serre: `<path d="M4 23 V13 Q14 3 24 13 V23Z" fill="#d8f0ee" ${s}/><path d="M14 6 V23 M4 15 H24" stroke="${PG_L}" stroke-width="1.4"/><path d="M9 23 q0-5 3-6 M19 23 q0-5-3-6" fill="none" stroke="#4f8a3f" stroke-width="2"/>`,
    atelier: `<rect x="4" y="15" width="20" height="4" rx="1" fill="#c98a5a" ${s}/><path d="M7 19 V24 M21 19 V24" ${s}/><path d="M9 14 L15 6 L18 8 L12 15Z" fill="#b5bcc2" ${s}/>`,
    cheminee: `<rect x="7" y="9" width="14" height="15" fill="#d98b6a" ${s}/><path d="M10 24 V17 Q14 13 18 17 V24" fill="#5b4636"/><path d="M12 22 q2-5 4 0" fill="#f6a945"/><path d="M5 9 H23" ${s}/>`,
    repas: `<path d="M5 14 H23 L20 22 H8Z" fill="#f2c14e" ${s}/><ellipse cx="14" cy="14" rx="9" ry="2.6" fill="#fff3c9" ${s}/><circle cx="11" cy="12.5" r="2" fill="#e0604f"/><circle cx="16" cy="12.5" r="2" fill="#8fbf6a"/>`,
    observ: `<path d="M6 23 V15 Q14 5 22 15 V23Z" fill="#c9d4e6" ${s}/><path d="M13 13 L22 6" stroke="${PG_L}" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="4" r="1.5" fill="#f2c14e"/>`,
    vitrine: `<rect x="4" y="8" width="20" height="15" rx="2" fill="#dff1f6" ${s}/><path d="M4 16 H24" ${s}/><circle cx="10" cy="13" r="2.3" fill="#f3aec1"/><circle cx="17" cy="13" r="2.3" fill="#f2c14e"/><path d="M8 8 l4-4" stroke="#fff" stroke-width="1.6"/>`,
    cuisine: `<path d="M6 13 H22 V21 Q22 24 19 24 H9 Q6 24 6 21Z" fill="#8f9cb3" ${s}/><path d="M4 13 H24" ${s}/><path d="M10 9 q1-3 0-5 M14 9 q1-3 0-5 M18 9 q1-3 0-5" fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-linecap="round"/>`,
    terrasse: `<path d="M3 11 Q14 1 25 11Z" fill="#e5587f" ${s}/><path d="M14 11 V24 M8 24 H20" ${s}/><path d="M8 11 Q11 6 14 11 Q17 6 20 11" fill="#fff" opacity=".6"/>`,
    enseigne: `<rect x="3" y="7" width="22" height="12" rx="3" fill="#f6c445" ${s}/><path d="M9 7 V3 M19 7 V3" ${s}/><path d="M14 9.5 l1.3 2.6 2.8.3-2.1 1.9.6 2.8-2.6-1.4-2.6 1.4.6-2.8-2.1-1.9 2.8-.3Z" fill="#fff"/>`,
    hammer: `<path d="M5 9 L13 4 L17 8 L9 13Z" fill="#b5bcc2" ${s}/><path d="M13 9 L23 21" stroke="${PG_L}" stroke-width="3.2" stroke-linecap="round"/><path d="M13 9 L23 21" stroke="#c98a5a" stroke-width="1.6" stroke-linecap="round"/>`,
  };
  return `<svg class="pg-ic" viewBox="0 0 28 28" aria-hidden="true">${g[id] || ''}</svg>`;
}
// la scène de la maison : chaque amélioration ajoute un élément ; les emplacements vides restent en pointillés
function pgHouseSVG() {
  const L = PG_L, s = `stroke="${L}" stroke-width="2.2" stroke-linejoin="round"`, ghost = 'fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-dasharray="4 3"';
  const lv = id => pgLvl(id);
  let g = `<svg viewBox="0 0 360 150" class="pg-house" role="img" aria-label="Votre maison">`;
  g += `<rect width="360" height="150" fill="#dff0f7"/><circle cx="330" cy="26" r="12" fill="#fbe39a"/><path d="M0 128 Q90 116 180 124 T360 122 V150 H0Z" fill="#a8d08d"/><path d="M0 138 H360" stroke="#8fbf6a" stroke-width="2"/>`;
  // serre (à gauche)
  if (lv('serre')) { g += `<g class="pg-el" data-pgel="serre"><path d="M10 128 V98 Q38 72 66 98 V128Z" fill="#e3f6f3" fill-opacity=".85" ${s}/><path d="M38 80 V128 M10 108 H66" stroke="${L}" stroke-width="1.4"/>`; for (let i = 0; i < lv('serre') + 1; i++) g += `<path d="M${18 + i * 14} 128 q0-12 5-15 M${18 + i * 14} 128 q0-10-5-12" fill="none" stroke="#4f8a3f" stroke-width="2.4" stroke-linecap="round"/><circle cx="${23 + i * 14}" cy="112" r="3" fill="#f39ab0"/>`; g += `</g>`; }
  else g += `<path d="M10 128 V98 Q38 72 66 98 V128Z" ${ghost}/>`;
  // chambre d'amis (annexe)
  if (lv('chambre')) { g += `<g class="pg-el" data-pgel="chambre"><path d="M72 128 V86 L100 70 L128 86 V128Z" fill="#f3d7c2" ${s}/>`; for (let i = 0; i < lv('chambre'); i++) g += `<rect x="${80 + (i % 2) * 22}" y="${92 + Math.floor(i / 2) * 18}" width="14" height="12" rx="2" fill="#fbd76a" ${s}/>`; g += `</g>`; }
  else g += `<path d="M72 128 V86 L100 70 L128 86 V128Z" ${ghost}/>`;
  // la maison
  g += `<path d="M128 128 V74 L180 40 L232 74 V128Z" fill="#fff3e2" ${s}/><path d="M120 78 L180 36 L240 78" fill="none" stroke="#d9604f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><rect x="168" y="98" width="24" height="30" rx="3" fill="#c98a5a" ${s}/><rect x="140" y="86" width="20" height="16" rx="2" fill="#9cc3e6" ${s}/><rect x="200" y="86" width="20" height="16" rx="2" fill="#9cc3e6" ${s}/>`;
  // cheminée et fumée
  if (lv('cheminee')) { g += `<g class="pg-el" data-pgel="cheminee"><rect x="206" y="40" width="14" height="26" fill="#d98b6a" ${s}/>`; for (let i = 0; i < lv('cheminee'); i++) g += `<circle class="pg-smoke" style="animation-delay:${i * 0.8}s" cx="${213 + i * 3}" cy="${32 - i * 9}" r="${5 + i}" fill="#fff" opacity=".85"/>`; g += `</g>`; }
  else g += `<rect x="206" y="44" width="14" height="22" ${ghost}/>`;
  // atelier (à droite)
  if (lv('atelier')) g += `<g class="pg-el" data-pgel="atelier"><path d="M238 128 V94 L268 82 L298 94 V128Z" fill="#e9c7a0" ${s}/><rect x="252" y="104" width="32" height="24" fill="#a8754a" ${s}/>${lv('atelier') > 1 ? `<path d="M258 112 L274 104 L278 108 L262 116Z" fill="#b5bcc2" ${s}/>` : ''}${lv('atelier') > 2 ? `<circle cx="268" cy="94" r="5" fill="#f2c14e" ${s}/>` : ''}</g>`;
  else g += `<path d="M238 128 V94 L268 82 L298 94 V128Z" ${ghost}/>`;
  // observatoire (sur la colline)
  if (lv('observ')) g += `<g class="pg-el" data-pgel="observ"><rect x="306" y="96" width="44" height="32" fill="#c9d4e6" ${s}/><path d="M306 96 Q328 68 350 96Z" fill="#8f9cb3" ${s}/><path d="M326 84 L346 66" stroke="${L}" stroke-width="5" stroke-linecap="round"/>${'<circle cx="300" cy="50" r="1.8" fill="#f2c14e"/><circle cx="350" cy="44" r="1.8" fill="#f2c14e"/><circle cx="318" cy="56" r="1.4" fill="#f2c14e"/>'.slice(0, 40 * lv('observ') + 10)}</g>`;
  else g += `<path d="M306 128 V96 Q328 68 350 96 V128Z" ${ghost}/>`;
  // coin repas (devant)
  if (lv('repas')) g += `<g class="pg-el" data-pgel="repas"><rect x="146" y="132" width="68" height="6" rx="2" fill="#c98a5a" ${s}/><path d="M152 138 V148 M208 138 V148" ${s}/>${Array.from({ length: lv('repas') }, (_, i) => `<ellipse cx="${162 + i * 18}" cy="130" rx="7" ry="3" fill="#f2c14e" ${s}/>`).join('')}</g>`;
  else g += `<rect x="146" y="132" width="68" height="6" ${ghost}/>`;
  return g + `</svg>`;
}
function pgHouseHTML() {
  const list = PG_B.filter(B => B.w === 'maison'), n = list.reduce((a, B) => a + pgLvl(B.id), 0);
  const effs = list.filter(B => pgLvl(B.id)).map(B => `<li>${pgIconSVG(B.id)}<span>${esc(B.eff(pgLvl(B.id)))}</span></li>`).join('');
  return `<div class="pg-home"><div class="pg-scene">${pgHouseSVG()}</div><div class="pg-hx"><b>Votre maison</b><small>${n ? `${n} amélioration${n > 1 ? 's' : ''} sur ${list.length * 3}` : 'Elle s’agrandit avec les matériaux de vos voyages : bois, pierre, tissu, métal, verre.'}</small>${effs ? `<ul class="pg-effs">${effs}</ul>` : ''}</div></div>`;
}
// la scène du comptoir : enseigne, vitrine, terrasse, fourneau en plus
function pgShopSVG() {
  const L = PG_L, s = `stroke="${L}" stroke-width="2" stroke-linejoin="round"`;
  let g = '';
  const en = pgLvl('enseigne'), vi = pgLvl('vitrine'), te = pgLvl('terrasse'), cu = pgLvl('cuisine');
  if (en) g += `<g class="pg-sign" data-pgel="enseigne"><path d="M150 4 V14 M210 4 V14" ${s}/><rect x="136" y="12" width="88" height="26" rx="8" fill="#f6c445" ${s}/>${Array.from({ length: en }, (_, i) => `<path transform="translate(${180 + (i - (en - 1) / 2) * 20} 25)" d="M0 -8 L2.4 -2.6 L8 -2.2 L3.8 1.6 L5 7.2 L0 4.4 L-5 7.2 L-3.8 1.6 L-8 -2.2 L-2.4 -2.6Z" fill="#fff"/>`).join('')}</g>`;
  if (vi) g += `<g data-pgel="vitrine"><rect x="10" y="292" width="74" height="56" rx="5" fill="#e8f6fa" fill-opacity=".9" ${s}/><path d="M10 320 H84" ${s}/>${Array.from({ length: vi + 1 }, (_, i) => `<circle cx="${24 + i * 16}" cy="${308}" r="6" fill="${['#f3aec1', '#f2c14e', '#9cc38a', '#e5587f'][i]}" ${s}/>`).join('')}<path d="M18 298 l10-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`;
  if (te) g += `<g data-pgel="terrasse"><path d="M236 300 Q266 270 296 300Z" fill="#e5587f" ${s}/><path d="M246 300 Q256 288 266 300 Q276 288 286 300" fill="#fff" opacity=".55"/><path d="M266 300 V352" ${s}/><rect x="244" y="336" width="44" height="6" rx="2" fill="#c98a5a" ${s}/>${te > 1 ? `<rect x="226" y="344" width="14" height="6" rx="2" fill="#c98a5a" ${s}/>` : ''}${te > 2 ? `<rect x="292" y="344" width="14" height="6" rx="2" fill="#c98a5a" ${s}/>` : ''}</g>`;
  if (cu) g += `<g data-pgel="cuisine">${Array.from({ length: cu }, (_, i) => `<g transform="translate(${300 - i * 40} 58)"><path d="M0 10 H30 V24 Q30 30 24 30 H6 Q0 30 0 24Z" fill="#8f9cb3" ${s}/><path d="M-4 10 H34" ${s}/><path class="pg-steam" d="M8 4 q3-6 0-10 M16 4 q3-6 0-10 M24 4 q3-6 0-10" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`).join('')}</g>`;
  return g ? `<div class="pg-cz" aria-hidden="true"><svg viewBox="0 0 360 380" preserveAspectRatio="none">${g}</svg></div>` : '';
}

// ---------------- effets réels des améliorations ----------------
// chambre (+ rangs 4 et 7) : des places en plus au foyer
const pgBeds = () => pgLvl('chambre') + (pgRank().i >= 3 ? 1 : 0) + (pgRank().i >= 6 ? 1 : 0);
if (typeof nsLayout === 'function') nsLayout = (orig => function () {
  const L = orig.apply(this, arguments);
  try { let n = pgBeds(); while (n-- > 0 && L.tent.length) { const k = L.tent.shift(); L.by.prairie.push(k); L.where[k] = 'prairie'; } } catch (e) {}
  return L;
})(nsLayout);
if (typeof nsRoomFor === 'function') nsRoomFor = (orig => function (sp) {
  if (orig.apply(this, arguments)) return true;
  try { const L = nsLayout(); return !L.tent.length && L.by.prairie.length < nsCap('prairie') + pgBeds(); } catch (e) { return false; }
})(nsRoomFor);
if (typeof fyCapInfo === 'function') fyCapInfo = (orig => function () { const r = orig.apply(this, arguments); try { r.cap += pgBeds(); } catch (e) {} return r; })(fyCapInfo);
// cheminée : repos plus rapide
if (typeof fyMods === 'function') fyMods = (orig => function () { const m = orig.apply(this, arguments); try { m.rest += 0.5 * pgLvl('cheminee'); } catch (e) {} return m; })(fyMods);
// serre : les graines poussent plus vite
if (typeof famSow === 'function') famSow = (orig => function (i) {
  const ok = orig.apply(this, arguments);
  try { const l = pgLvl('serre'), p = ok && famState().j.plots[i]; if (p && l && !p.pg) { p.ms = Math.round(p.ms * (1 - [0, 0.2, 0.35, 0.5][l])); p.pg = 1; save(); } } catch (e) {}
  return ok;
})(famSow);
// atelier : parfois un objet fabriqué en double
GAME.on('craft', d => {
  const l = pgLvl('atelier'); if (!l || !d || !d.item || Math.random() >= 0.15 * l + (window.__prg && __prg.forceDouble ? 1 : 0)) return;
  const it = Object.assign({}, d.item, { id: uidGen(), date: Date.now() }); S.inv.push(it); save();
  setTimeout(() => toast(`Atelier agrandi : « ${it.name} » fabriqué en double !`), 900);
});
// cuisine : des places de préparation en plus (gardées à part, rendues après la logique existante)
if (typeof cmState === 'function') cmState = (orig => function () {
  let ex = [];
  try { const c = bqState().cm; if (c && Array.isArray(c.sl) && typeof c._b === 'number' && c.sl.length > c._b) ex = c.sl.splice(c._b); } catch (e) {}
  const c = orig.apply(this, arguments);
  try {
    c._b = c.sl.length;
    const n = pgLvl('cuisine');
    for (let i = 0; i < n; i++) { const x = ex[i]; c.sl.push(x && CM_R[x.rid] ? x : null); }
  } catch (e) {}
  return c;
})(cmState);
// vitrine : plus de clients dans la file (la logique existante s'arrête à 2)
if (typeof cmTickBuyers === 'function') cmTickBuyers = (orig => function () {
  let ch = orig.apply(this, arguments);
  try {
    const ex = pgLvl('vitrine'), c = cmState();
    if (ex && c.buy.length >= 2 && c.buy.length < 2 + ex) {
      const keep = c.buy.splice(0, c.buy.length - 1), cids = new Set(keep.map(b => b.cid));
      const r = orig.apply(this, arguments);
      const fresh = c.buy.filter(b => !cids.has(b.cid));
      c.buy = keep.concat(fresh);
      ch = ch || r;
    }
  } catch (e) {}
  return ch;
})(cmTickBuyers);
// terrasse : +10 % par niveau ; enseigne : plus d'amitié
if (typeof cmSell === 'function') cmSell = (orig => function (bid) {
  const c0 = S.coins, b = pgCall(() => cmState().buy.find(x => x.id === bid), null);
  const r = orig.apply(this, arguments);
  try {
    const sold = S.coins > c0 && b && !cmState().buy.includes(b);
    if (sold) {
      const te = pgLvl('terrasse'), en = pgLvl('enseigne');
      if (te) { const bonus = Math.max(1, Math.round((S.coins - c0) * 0.1 * te)); gainCoins(bonus); S.prg.lastTip = bonus; }
      if (en) { const extra = en === 3 ? 2 : en === 2 ? 1 : (Math.random() < 0.5 ? 1 : 0); if (extra) b2Heart(b.cid, extra); }
      if (te || en) { save(); renderTop(); }
    }
  } catch (e) { console.error('progression vente', e); }
  return r;
})(cmSell);
// observatoire : les moments rares plus tôt
const pgObsDays = () => [45, 90, 150, 240][pgLvl('observ')];
function pgObsList() {
  const H = pgObsDays(); if (H <= 45) return [];
  return pgCall(() => WD_MOM.filter(M => M.win && !wdInWin(wdMD(), M.win)).map(M => {
    const d = wdDate(); for (let i = 46; i <= H; i++) { const x = new Date(d.getTime() + i * 864e5), md = (x.getMonth() + 1) * 100 + x.getDate(); if (wdInWin(md, M.win)) return { M, i }; }
    return null;
  }).filter(o => o && wdMoSoon(o.M) > 45).sort((a, b) => a.i - b.i), []);
}
if (typeof wdMomentsHTML === 'function') wdMomentsHTML = (orig => function () {
  let h = orig.apply(this, arguments);
  try {
    const l = pgObsList();
    if (l.length) h += `<p class="wd-sub pg-obs">${pgIconSVG('observ')}L’observatoire voit plus loin (${pgObsDays()} jours)</p><ul class="pg-obsl">${l.map(o => `<li>${o.M.ico} <b>${esc(o.M.nm)}</b> · ${esc(o.M.where)} · dans ${o.i} jours</li>`).join('')}</ul>`;
  } catch (e) {}
  return h;
})(wdMomentsHTML);

// ---------------- 2. NOURRIR ET FAIRE ÉVOLUER LES FAMILIERS ----------------
const PG_POW = {
  flair: { nm: 'Flair', txt: n => `+${n} objet${n > 1 ? 's' : ''} par voyage` },
  endu: { nm: 'Endurance', txt: n => `−${10 * n} % de durée de voyage` },
  etoile: { nm: 'Bonne étoile', txt: n => `objets plus rares en voyage (+${n * 10} % de chance)` },
};
const PG_SP_POW = { panda: 'flair', capy: 'endu', axo: 'etoile', renard: 'flair', fennec: 'endu', tanuki: 'etoile', paresseux: 'etoile', lemur: 'flair', phoque: 'endu', quokka: 'flair' };
function pgPowOf(k) { const sp = pgCall(() => spOf(k), k) || k; return PG_SP_POW[sp] || ['flair', 'endu', 'etoile'][pgCall(() => fyHash(String(sp)), 0) % 3]; }
const pgStage = k => pgCall(() => eqStage(k), (S.prog[k] && S.prog[k].lvl >= 20) ? 3 : (S.prog[k] && S.prog[k].lvl >= 10) ? 2 : 1);
const pgPowN = k => Math.max(0, pgStage(k) - 1);
const pgPowLine = (k, n) => { const P = PG_POW[pgPowOf(k)]; return `${P.nm}${n > 1 ? ' II' : ''} : ${P.txt(Math.max(1, n))}`; };
// aliments du sac : les plats du commerce d'abord, le préféré en tête ; jamais ce qu'il déteste
function pgFoods(k) {
  const rank = { love: 0, like: 1, hate: 9 };
  const seen = new Set();
  return (S.inv || []).filter(it => it.cat === 'n' && pgCall(() => tasteOf(k, it), 'like') !== 'hate')
    .sort((a, b) => rank[pgCall(() => tasteOf(k, a), 'like')] - rank[pgCall(() => tasteOf(k, b), 'like')] || (b.mk ? 1 : 0) - (a.mk ? 1 : 0) || (b.rarity || 0) - (a.rarity || 0))
    .filter(it => { const key = it.name + '|' + (it.mk ? it.mk.st : ''); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 5);
}
function pgFoodXP(k, it) {
  const love = pgCall(() => tasteOf(k, it), 'like') === 'love';
  const base = it.mk ? 30 + 10 * (it.mk.st || 1) : 12 + 6 * (it.rarity || 0);
  return Math.round(base * (love ? 2 : 1) * (1 + 0.25 * pgLvl('repas')));
}
function pgFeed(k, id) {
  const it = (S.inv || []).find(i => i.id === id && i.cat === 'n'); if (!it || !S.prog[k] || !S.comps[k]) return null;
  if (pgCall(() => tasteOf(k, it), 'like') === 'hate') return null;
  const st0 = pgStage(k), lv0 = S.prog[k].lvl, love = pgCall(() => tasteOf(k, it), 'like') === 'love';
  S.inv.splice(S.inv.indexOf(it), 1);
  const xp = addXP(k, pgFoodXP(k, it));
  pgCall(() => { const c = fyC(k); c.joy = fyClamp(c.joy + (love ? 20 : 10)); }, 0);
  S.stats.fed = (S.stats.fed || 0) + 1; if (love) pgCall(() => bump('feed_love'), 0);
  const st1 = pgStage(k), nm = CHARS[k].name;
  pgState().pw[k] = st1;
  save();
  if (st1 > st0) pgCele(`${nm} devient ${pgCall(() => eqStageWord(k, st1), 'plus fort')} ! Pouvoir : ${pgPowLine(k, st1 - 1)}`);
  else toast(`${nm} se régale${love ? ' (son préféré : XP ×2)' : ''} : +${xp} XP${S.prog[k].lvl > lv0 ? ` · niveau ${S.prog[k].lvl} !` : ''}`);
  pgCheck();
  return { xp, st0, st1 };
}
function pgFeedHTML(k) {
  const p = S.prog[k] || { lvl: 1, xp: 0 }, need = needXP(p.lvl), f = Math.min(1, p.xp / need), st = pgStage(k), n = pgPowN(k), away = !!(S.trips && S.trips[k]);
  const nextLv = st === 1 ? 10 : st === 2 ? 20 : 0, foods = away ? [] : pgFoods(k);
  const pow = n ? `<p class="pg-pow on">${pgIconSVG('enseigne').replace('pg-ic', 'pg-ic pw')}<b>${esc(pgPowLine(k, n))}</b></p>`
    : `<p class="pg-pow">${pgIconSVG('enseigne').replace('pg-ic', 'pg-ic pw off')}<span>Au stade suivant (niv. ${nextLv}) : ${esc(pgPowLine(k, 1))}</span></p>`;
  const row = foods.map(it => { const love = pgCall(() => tasteOf(k, it), 'like') === 'love'; return `<button class="pg-fd${love ? ' love' : ''}" data-pgfeed="${k}:${esc(it.id)}" aria-label="Nourrir avec ${esc(it.name)} : +${pgFoodXP(k, it)} XP" title="${esc(it.name)}"><span class="ico">${itemIcon(it)}</span>${love ? '<i class="pg-heart">❤</i>' : ''}<small>+${pgFoodXP(k, it)}</small></button>`; }).join('');
  return `<div class="pg-feed" id="pgFeed"><div class="pg-fh"><b>Nourrir</b><span class="pg-xpb" aria-label="${p.xp} sur ${need} XP"><i style="width:${(f * 100).toFixed(1)}%"></i><em>Niv. ${p.lvl} · ${p.xp}/${need} XP</em></span></div>
    ${away ? '<p class="pg-fn">En voyage : vous le nourrirez à son retour.</p>' : row ? `<div class="pg-fds">${row}</div>` : '<p class="pg-fn">Rien à manger dans le sac : préparez un plat au comptoir ou partez en voyage.</p>'}${pow}</div>`;
}
if (typeof renderTalents === 'function') renderTalents = (orig => function (k) {
  const h = orig.apply(this, arguments);
  try {
    if (!CHARS[k] || !S.prog[k] || pgTuto()) return h;
    const at = ['<div class="xpf', '<div class="eqf">', '<div class="cptree">'].map(x => h.indexOf(x)).filter(i => i >= 0).sort((a, b) => a - b)[0];
    return at != null ? h.slice(0, at) + pgFeedHTML(k) + h.slice(at) : h + pgFeedHTML(k);
  } catch (e) { console.error('progression fiche', e); return h; }
})(renderTalents);
// les pouvoirs en voyage
const pgRankDurMul = () => (pgRank().i >= 7 ? 0.95 : 1);
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  try {
    const t = S.trips[k];
    if (t && t !== before && !t.pg) {
      t.pg = 1; const pw = pgPowOf(k), n = pgPowN(k);
      let mul = pgRankDurMul(); if (n && pw === 'endu') mul *= 1 - 0.1 * n;
      if (mul < 1) { t.out = Math.round(t.out * mul); t.stay = Math.round((t.stay || 0) * mul); t.total = Math.max(1000, Math.round(t.total * mul)); }
      if (n && pw === 'etoile') t.luck = (t.luck || 0) + 0.5 * n;
      if (n && pw === 'flair') t.pgFl = n;
      save();
    }
  } catch (e) { console.error('progression départ', e); }
  return r;
})(startTrip);
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips && S.trips[k];
  const r = orig.apply(this, arguments);
  try {
    if (t && t.pgFl && S.trips[k] !== t) {
      const items = lootFor((t.dest && t.dest.tags && t.dest.tags.length ? t.dest.tags : ['campagne']), t.luck || 0, (t.dest && t.dest.name) || 'Voyage', t.pgFl, k);
      items.forEach(it => { it.from = it.from || 'Voyage'; S.inv.push(it); if (S.dex) S.dex[it.name] = true; });
      t.pgFl = 0; save();
      if (items.length) setTimeout(() => toast(`Flair de ${CHARS[k].name} : +${items.length} objet${items.length > 1 ? 's' : ''} (${items.map(i => i.name).join(', ')})`), 600);
    }
  } catch (e) { console.error('progression retour', e); }
  return r;
})(collect);

// ---------------- 3. RANG D'EXPLORATEUR ----------------
const PG_RANKS = [
  { n: 'Petit voyageur', at: 0, un: 'Les premières améliorations à construire' },
  { n: 'Randonneur', at: 15, un: 'Améliorations de niveau 2' },
  { n: 'Baroudeur', at: 40, un: 'L’observatoire et une recette exclusive au comptoir' },
  { n: 'Explorateur', at: 80, un: '+1 place de familier au foyer' },
  { n: 'Aventurier', at: 140, un: 'Les énigmes difficiles' },
  { n: 'Grand explorateur', at: 220, un: 'Améliorations de niveau 3' },
  { n: 'Cartographe', at: 320, un: '+1 place de familier et une 2e recette exclusive' },
  { n: 'Pionnier', at: 450, un: 'Tous les voyages 5 % plus courts' },
  { n: 'Légende', at: 620, un: 'La couronne de légende' },
];
const PG_PTS = [['lieux', 'lieu découvert', 1], ['reg', 'région', 5], ['qu', 'quête', 2], ['en', 'énigme', 5], ['lock', 'lieu à cadenas', 8], ['bat', 'construction', 4], ['fam', 'familier', 3]];
function pgPtsDetail() {
  const d = {
    lieux: pgCall(() => Object.keys(S.visited || {}).length, 0),
    reg: pgStamps().length,
    qu: +S.stats.qclaimed || 0,
    en: pgCall(() => myDoneN(), 0),
    lock: pgCall(() => Object.keys(xpState().won || {}).length, 0),
    bat: PG_B.reduce((a, B) => a + pgLvl(B.id), 0),
    fam: pgCall(() => compIds().length, 0),
  };
  let pts = PG_PTS.reduce((a, [k, , w]) => a + (d[k] || 0) * w, 0);
  PG_PAL.forEach(P => { if (pgState().pal[P.n]) pts += P.pts; });
  return { d, pts };
}
function pgRank() {
  if (pgRank._c && Date.now() - pgRank._t < 400) return pgRank._c;
  const { pts } = pgPtsDetail(); let i = 0; PG_RANKS.forEach((R, j) => { if (pts >= R.at) i = j; });
  const nx = PG_RANKS[i + 1] || null, cur = PG_RANKS[i];
  pgRank._c = { i, R: cur, nx, pts, f: nx ? (pts - cur.at) / (nx.at - cur.at) : 1 }; pgRank._t = Date.now();
  return pgRank._c;
}
pgRank._c = null; pgRank._t = 0;
const pgFlush = () => { pgRank._c = null; };
// déblocages concrets, appliqués à chaque vérification (idempotents)
function pgApplyRank(i) {
  // énigmes difficiles (43_mysteres.js) : ouvertes d'office au rang Aventurier
  pgCall(() => { MY_UNLOCK[3] = i >= 4 ? 0 : 4; }, 0);
  // recettes exclusives du comptoir
  const want = (i >= 2 ? 1 : 0) + (i >= 6 ? 1 : 0), P = pgState(), got = [];
  if (want) pgCall(() => { const c = cmState(); BQ_SHOPS.forEach(T => { const ex = (CM_LINES[T.id] || []).filter(R => R.x && !R.egg); let n = +P.rec[T.id] || 0; while (n < want && ex.length) { const R = ex.find(x => !c.unl.includes(x.id)); if (!R) break; c.unl.push(R.id); n++; if (T.id === pgCall(() => cmT().id, '')) got.push(R.def[0]); } P.rec[T.id] = n; }); }, 0);
  if (i >= 8 && !P.gift.crown) { P.gift.crown = 1; pgCall(() => { const it = makeItem(['Couronne de légende', 'v', 'tete', 4, 'couronne', '#f2c14e'], 0, 'Rang Légende', [], { fixed: 4 }); S.inv.push(it); S.dex[it.name] = true; }, 0); }
  return got;
}
// ---------------- 4. PASSEPORT ----------------
const PG_PAL = [{ n: 5, coins: 200, pts: 10, mat: 0 }, { n: 10, coins: 500, pts: 20, mat: 3 }, { n: 20, coins: 1200, pts: 40, mat: 5 }, { n: 40, coins: 3000, pts: 80, mat: 8 }];
function pgStamps() {
  return pgCall(() => {
    const st = rgState().seen, home = pgCall(() => rgHome().id, null);
    return REGIONS.filter(R => rgDiscovered(R.id)).map(R => ({ R, t: (st[R.id] && st[R.id].first) || (R.id === home ? 0 : Date.now()) })).sort((a, b) => a.t - b.t);
  }, []);
}
const PG_MAT_GIFT = [['Planche de chêne', 'bois', '#b07a4f'], ['Pierre de taille', 'pierre', '#a9a39a'], ['Lingot de fer', 'metal', '#8f9cb3'], ['Vitre soufflée', 'verre', '#bfe1f2'], ['Coupon de lin', 'tissu', '#e9dcc0']];
function pgPalCheck() {
  const n = pgStamps().length, P = pgState(), msgs = [];
  PG_PAL.forEach(L => {
    if (n < L.n || P.pal[L.n]) return;
    P.pal[L.n] = 1; gainCoins(L.coins);
    for (let i = 0; i < L.mat; i++) { const d = PG_MAT_GIFT[i % PG_MAT_GIFT.length]; const it = makeItem([d[0], 'm', d[1], 1, null, d[2]], 0, 'Passeport', [], { fixed: 1 }); S.inv.push(it); if (S.dex) S.dex[it.name] = true; }
    msgs.push(`Passeport : ${L.n} tampons ! +${L.coins} pièces${L.mat ? `, ${L.mat} matériaux` : ''}`);
  });
  return msgs;
}
function pgStampSVG(R, i) {
  const c = R.color || '#5b8fd0', nm = String(R.short || R.name || ''), t = nm.length > 13 ? nm.slice(0, 12) + '.' : nm, fs = t.length > 10 ? 6.4 : t.length > 7 ? 8 : 10;
  const rot = ((i * 37) % 17) - 8;
  return `<svg viewBox="0 0 80 80" class="pg-stamp" role="img" aria-label="Tampon ${esc(nm)}"><g transform="rotate(${rot} 40 40)"><circle cx="40" cy="40" r="35" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="3"/><circle cx="40" cy="40" r="28" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 2.4"/><text x="40" y="43" text-anchor="middle" font-size="${fs}" font-weight="800" fill="${c}" font-family="inherit">${esc(t.toUpperCase())}</text><path d="M28 54 H52" stroke="${c}" stroke-width="1.6"/><path transform="translate(40 26)" d="M0 -5 L1.5 -1.6 L5 -1.4 L2.4 1 L3.1 4.6 L0 2.8 L-3.1 4.6 L-2.4 1 L-5 -1.4 L-1.5 -1.6Z" fill="${c}"/></g></svg>`;
}
function pgPassHTML() {
  const l = pgStamps(), n = l.length, P = pgState(), tot = pgCall(() => REGIONS.length, 43);
  const pals = PG_PAL.map(L => `<span class="pg-pal${P.pal[L.n] ? ' ok' : n >= L.n ? ' ok' : ''}"><b>${L.n}</b><small>${P.pal[L.n] ? '✔' : `+${L.coins}`}</small></span>`).join('');
  const nx = PG_PAL.find(L => n < L.n);
  return `<details class="pg-pass" open><summary>${pgIconSVG('enseigne').replace('pg-ic', 'pg-ic pass')}<b>Passeport</b><small>${n}/${tot} tampons${nx ? ` · prochain palier : ${nx.n}` : ''}</small></summary>
    <div class="pg-pals" aria-label="Paliers de tampons">${pals}</div>
    <div class="pg-stamps">${l.map((o, i) => `<span class="pg-st" title="${esc(o.R.name)}">${pgStampSVG(o.R, i)}</span>`).join('')}${Array.from({ length: Math.max(0, Math.min(3, tot - n)) }, () => '<span class="pg-st empty" aria-hidden="true"></span>').join('')}</div></details>`;
}
if (typeof renderAlbum === 'function') renderAlbum = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!box || pgTuto()) return r;
    const at = box.querySelector('.mdreg') || box.querySelector('.phead, h2, header');
    if (at) at.insertAdjacentHTML('afterend', pgPassHTML()); else box.insertAdjacentHTML('afterbegin', pgPassHTML());
  } catch (e) { console.error('passeport', e); }
  return r;
})(renderAlbum);

// ---------------- vérification : rang, paliers, célébration ----------------
let pgCeleQ = [];
function pgCele(msg) {
  pgCeleQ.push(msg); if (pgCeleQ.length > 1) return;
  const show = () => {
    const m = pgCeleQ[0]; if (!m) return;
    let el = document.getElementById('pgCele');
    if (!el) { el = document.createElement('div'); el.id = 'pgCele'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    el.innerHTML = `<i>${PG_STAR}</i><span>${esc(m)}</span><i>${PG_STAR}</i>`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(pgCele.h); pgCele.h = setTimeout(() => { el.classList.remove('on'); pgCeleQ.shift(); if (pgCeleQ.length) setTimeout(show, 350); }, 2600);
  };
  show();
}
function pgCheck() {
  if (!S || (S.firstRun && S.firstRun.stage && S.firstRun.stage !== 'done' && pgTuto())) return;
  const P = pgState(); pgFlush();
  const pal = pgPalCheck(); if (pal.length) pgFlush();
  const R = pgRank(), first = P.rk == null;
  const got = pgApplyRank(R.i);
  // stades déjà atteints (anciennes sauvegardes) : notés sans annonce
  pgCall(() => compIds().forEach(k => { if (P.pw[k] == null) P.pw[k] = pgStage(k); else if (pgStage(k) > P.pw[k]) { P.pw[k] = pgStage(k); pgCele(`${CHARS[k].name} : nouveau pouvoir ! ${pgPowLine(k, pgPowN(k))}`); } }), 0);
  if (first) P.rk = R.i;
  else if (R.i > P.rk) {
    for (let i = P.rk + 1; i <= R.i; i++) pgCele(`Nouveau rang : ${PG_RANKS[i].n} ! Débloqué : ${PG_RANKS[i].un}${i === R.i && got.length ? ` (« ${got[0]} »)` : ''}`);
    P.rk = R.i;
  }
  pal.forEach(m => pgCele(m));
  if (pal.length || (!first && R.i !== P.rk0)) save();
  P.rk0 = R.i;
  pgBadge();
}
// ---------------- badge du HUD ----------------
function pgBadge() {
  const host = document.querySelector('.hud .hright'); if (!host) return;
  let b = document.getElementById('pgRank');
  if (!b) { b = document.createElement('button'); b.id = 'pgRank'; b.className = 'pg-rank'; b.type = 'button'; const c = document.getElementById('coins'); host.insertBefore(b, c || host.firstChild); }
  const R = pgRank();
  b.hidden = pgTuto();
  b.setAttribute('aria-label', `Rang d’explorateur ${R.i + 1} : ${R.R.n}`);
  b.innerHTML = `<span class="pg-rn">${R.i + 1}</span><span class="pg-rb"><i style="width:${(R.f * 100).toFixed(0)}%"></i></span>`;
  const pop = document.getElementById('pgRankPop'); if (pop && !pop.hidden) pop.innerHTML = pgPopHTML();
}
function pgPopHTML() {
  const R = pgRank(), { d } = pgPtsDetail();
  const how = PG_PTS.map(([k, l, w]) => `${l} +${w}`).join(' · ');
  return `<div class="pg-ph"><span class="pg-rn big">${R.i + 1}</span><span><b>${esc(R.R.n)}</b><small>${R.pts} points d’explorateur</small></span><button class="cf-x" data-pgpop="0" aria-label="Fermer">✕</button></div>
    <span class="pg-rb big"><i style="width:${(R.f * 100).toFixed(0)}%"></i></span>
    <p>${pgIconSVG('observ')}<span>${R.nx ? `Prochain rang : <b>${esc(R.nx.n)}</b> (encore ${R.nx.at - R.pts} points)` : 'Rang maximum : vous êtes une légende !'}</span></p>
    <p>${pgIconSVG('enseigne')}<span>${R.nx ? `Il débloque : <b>${esc(R.nx.un)}</b>` : `Débloqué : ${esc(R.R.un)}`}</span></p>
    <p>${pgIconSVG('hammer')}<span>Progresser : ${esc(how)}. Déjà ${d.lieux} lieux, ${d.reg} tampons, ${d.bat} constructions.</span></p>`;
}
function pgTogglePop(show) {
  let p = document.getElementById('pgRankPop');
  if (!p) { p = document.createElement('div'); p.id = 'pgRankPop'; p.className = 'pg-pop'; p.hidden = true; document.body.appendChild(p); }
  p.hidden = show === false ? true : show === true ? false : !p.hidden;
  if (!p.hidden) p.innerHTML = pgPopHTML();
}
if (typeof renderTop === 'function') renderTop = (orig => function () { const r = orig.apply(this, arguments); try { pgCheck(); } catch (e) { console.error('rang', e); } return r; })(renderTop);

// ---------------- branchement dans le Foyer et le comptoir ----------------
if (typeof fyRender === 'function') fyRender = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!box || pgTuto()) return r;
    const html = pgHouseHTML() + pgBuildHTML('maison'), head = box.querySelector('.fw-head');
    if (head) head.insertAdjacentHTML('afterend', html); else box.insertAdjacentHTML('afterbegin', html);
  } catch (e) { console.error('progression foyer', e); }
  return r;
})(fyRender);
if (typeof cmRecipesHTML === 'function') cmRecipesHTML = (orig => function () { const h = orig.apply(this, arguments); try { if (cmT() && !pgTuto()) return h + pgBuildHTML('boutique'); } catch (e) {} return h; })(cmRecipesHTML);
if (typeof czSceneHTML === 'function') czSceneHTML = (orig => function () { const h = orig.apply(this, arguments); try { const o = pgShopSVG(); if (o) return h.replace(/<\/div><\/div>$/, o + '</div></div>'); } catch (e) {} return h; })(czSceneHTML);
function pgRepaint() {
  const b = $('panelBody'), top = b ? b.scrollTop : 0;
  try { if (typeof cmOnComptoir === 'function' && cmOnComptoir()) { cmPaint(true); } else renderPanel(); } catch (e) { renderPanel(); }
  if (b) b.scrollTop = top;
}
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-pgbuild],[data-pgmiss],[data-pgx],[data-pgfeed],[data-pgpop],#pgRank,[data-pgbuy]');
  if (!el) {
    const p = document.getElementById('pgRankPop'); if (p && !p.hidden && !ev.target.closest('#pgRankPop')) p.hidden = true;
    return;
  }
  const d = el.dataset;
  if (el.id === 'pgRank') { pgTogglePop(); return; }
  if (d.pgpop != null) { pgTogglePop(false); return; }
  if (d.pgbuild) { pgMissOpen = null; if (pgBuild(d.pgbuild)) { renderTop(); pgRepaint(); } return; }
  if (d.pgmiss) { pgMissOpen = pgMissOpen === d.pgmiss ? null : d.pgmiss; pgRepaint(); return; }
  if (d.pgx) { pgMissOpen = null; pgRepaint(); return; }
  if (d.pgbuy) { setTimeout(() => { try { pgRepaint(); } catch (e) {} }, 30); return; }
  if (d.pgfeed) { const i = d.pgfeed.indexOf(':'), k = d.pgfeed.slice(0, i), id = d.pgfeed.slice(i + 1); if (pgFeed(k, id)) { renderTop(); renderComps(); pgRepaint(); } }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { const p = document.getElementById('pgRankPop'); if (p) p.hidden = true; } });

// ---------------- usages et actions (contrat 13_bus.js) ----------------
GAME.addUses(it => {
  const out = [];
  if (!it) return out;
  if (it.cat === 'm') {
    const k = pgMatKey(it);
    if (k) { const nm = PG_B.filter(B => B.cost.some(c => c.some(([x]) => x === k))).map(B => B.nm); out.push({ txt: `Construire : ${nm.slice(0, 3).join(', ')}${nm.length > 3 ? '…' : ''}`, kind: 'construire' }); }
  }
  if (it.cat === 'n') {
    const fans = pgCall(() => compIds().filter(k => CHARS[k] && tasteOf(k, it) === 'love').map(k => CHARS[k].name), []);
    out.push({ txt: fans.length ? `Nourrir un familier : plat préféré de ${fans.slice(0, 2).join(' et ')} (XP ×2)` : 'Nourrir un familier : de l’XP pour grandir et gagner un pouvoir', kind: 'familier' });
  }
  return out;
});
GAME.addAction(it => {
  if (!it) return [];
  if (it.cat === 'm' && pgMatKey(it)) return [{ label: 'Construire', kind: 'construire', run: () => { pgCall(() => { openSheet('foyer'); setTimeout(() => { const e = document.getElementById('pgBuild_maison'); if (e) e.scrollIntoView({ block: 'start' }); }, 60); }, 0); } }];
  if (it.cat === 'n') {
    const ks = pgCall(() => compIds().filter(k => CHARS[k] && S.comps[k] && !S.trips[k] && tasteOf(k, it) !== 'hate'), []);
    ks.sort((a, b) => (tasteOf(b, it) === 'love') - (tasteOf(a, it) === 'love'));
    const k = ks[0]; if (!k) return [];
    return [{ label: `Nourrir ${CHARS[k].name}${tasteOf(k, it) === 'love' ? ' ❤' : ''}`, kind: 'familier', run: () => { if (pgFeed(k, it.id)) { renderTop(); renderComps(); pgCall(() => renderPanel(), 0); } } }];
  }
  return [];
});

// ---------------- style ----------------
(function pgCSS() {
  const st = document.createElement('style');
  st.textContent = `
.pg-rank{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:40px;height:40px;padding:3px 6px;border-radius:14px;border:2.5px solid #5b4636;background:#fff3c4;box-shadow:0 3px 0 rgba(74,53,40,.3);cursor:pointer;color:#4a3528;font:800 15px/1 var(--display,inherit);margin-right:6px;flex:none}
.pg-rn{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#e0a52a;color:#fff;font:800 12.5px/1 var(--display,inherit);border:2px solid #5b4636}
.pg-rn.big{width:34px;height:34px;font-size:18px;flex:none}
.pg-rb{display:block;width:30px;height:5px;border-radius:4px;background:#e7dcc4;overflow:hidden}.pg-rb i{display:block;height:100%;background:#3a8f5a;border-radius:4px}
.pg-rb.big{width:100%;height:8px;margin:6px 0 4px}
.pg-pop{position:fixed;z-index:60;top:64px;right:8px;width:min(320px,calc(100vw - 16px));padding:10px 12px;border-radius:18px;border:2.5px solid #5b4636;background:#fffaf0;box-shadow:0 6px 0 rgba(74,53,40,.2),0 14px 30px rgba(74,53,40,.2);color:#4a3528;font-size:13px}
.pg-pop .pg-ph{display:flex;gap:8px;align-items:center}.pg-pop .pg-ph>span{display:flex;flex-direction:column;flex:1}.pg-pop .pg-ph b{font:800 17px/1.1 var(--display,inherit)}.pg-pop .pg-ph small{color:#7a6250}
.pg-pop p{display:flex;gap:8px;align-items:flex-start;margin:6px 0 0;line-height:1.3}.pg-pop p .pg-ic{width:22px;height:22px;flex:none}
#pgCele{position:fixed;z-index:70;left:50%;top:10px;transform:translate(-50%,-160%);display:flex;align-items:center;gap:8px;width:max-content;max-width:min(440px,calc(100vw - 24px));padding:8px 14px;border-radius:18px;font-size:13.5px!important;border:2.5px solid #a8781a;background:linear-gradient(#fff6d0,#f6d77a);color:#4a3528;font:800 14px/1.25 var(--display,inherit);box-shadow:0 5px 0 rgba(168,120,26,.35),0 12px 24px rgba(74,53,40,.2);transition:transform .45s cubic-bezier(.3,1.5,.6,1);pointer-events:none;text-align:center}
#pgCele.on{transform:translate(-50%,0)}#pgCele i svg{width:18px;height:18px;fill:#e0a52a;display:block}
.pg-ic{width:26px;height:26px;flex:none;display:block}
.pg-home{display:flex;flex-direction:column;border:2.5px solid var(--line,#e2d3bd);border-radius:18px;overflow:hidden;background:#fff;margin:0 0 10px}
.pg-scene svg{display:block;width:100%;height:auto}
.pg-hx{padding:8px 12px;display:flex;flex-direction:column;gap:2px}.pg-hx>b{font:800 16px/1.2 var(--display,inherit)}.pg-hx small{color:var(--ink2,#7a6250)}
.pg-effs{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:3px}.pg-effs li{display:flex;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:#2f6b3a}.pg-effs .pg-ic{width:20px;height:20px}
.pg-smoke{animation:pgSmoke 2.4s ease-in infinite}.pg-steam{animation:pgSmoke 1.8s ease-in infinite}
.pg-sign rect{filter:drop-shadow(0 0 6px #ffd84a)}.pg-sign{animation:pgGlow 2s ease-in-out infinite}
.pg-cz{position:absolute;inset:0;z-index:4;pointer-events:none}.pg-cz svg{width:100%;height:100%;display:block}
.pg-build{margin:12px 0}
.pg-h{display:flex;align-items:center;gap:6px;margin:0 0 8px;font:800 16px/1.2 var(--display,inherit)}.pg-h{flex-wrap:wrap}.pg-h small{flex-basis:100%;font-weight:600;font-size:12px;line-height:1.2;color:var(--ink2,#7a6250)}
.pg-list{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
.pg-card{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:2.5px solid var(--line,#e2d3bd);border-radius:16px;background:#fff}
.pg-card.can{border-color:#3a8f5a;box-shadow:0 3px 0 rgba(58,143,90,.25)}.pg-card.built{background:#fffaf0}
.pg-pic{width:46px;height:46px;flex:none;border-radius:14px;background:#f4ebe1;display:flex;align-items:center;justify-content:center}.pg-pic .pg-ic{width:34px;height:34px}
.pg-x{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.pg-x>b{font:800 14.5px/1.15 var(--display,inherit)}
.pg-lv{display:flex;gap:2px}.pg-lv i svg{width:14px;height:14px;fill:#e7dcc4;stroke:#b9ad9a;stroke-width:1.5;display:block}.pg-lv i.on svg{fill:#f2c14e;stroke:#a8781a}
.pg-eff{margin:0;font-size:12.5px;line-height:1.3;color:var(--ink2,#7a6250)}.pg-eff.on{color:#2f6b3a;font-weight:700}
.pg-cost{display:flex;flex-wrap:wrap;gap:5px}
.pg-ing{position:relative;display:inline-flex;align-items:center;gap:3px;padding:2px 6px 2px 3px;border-radius:10px;border:2px solid #f0c9b8;background:#fff4ef;font:800 12px/1 var(--display,inherit);color:#b0482f}
.pg-ing.ok{border-color:#bfe3c9;background:#eef8f0;color:#2f6b3a}.pg-ing svg{width:22px;height:22px;display:block}.pg-ing i{font-style:normal}
.pg-card .btn{align-self:flex-start;margin-top:2px}
.pg-lock,.pg-done{font-size:12px;font-weight:800;color:#7a6250;background:#f4ebe1;border-radius:10px;padding:3px 8px;align-self:flex-start}
.pg-miss{margin:-2px 0 4px}
.pg-feed{margin:8px 0;padding:8px 10px;border:2.5px solid var(--line,#e2d3bd);border-radius:16px;background:#fff}
.pg-fh{display:flex;align-items:center;gap:8px}.pg-fh>b{font:800 15px/1.1 var(--display,inherit)}
.pg-xpb{position:relative;flex:1;height:18px;border-radius:9px;background:#efe6d6;overflow:hidden;border:2px solid #e2d3bd}.pg-xpb i{display:block;height:100%;background:linear-gradient(#ffd86b,#f2b53a);transition:width .5s}
.pg-xpb em{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 11px/1 var(--display,inherit);font-style:normal;color:#4a3528}
.pg-fds{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:8px}
.pg-fd{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 2px 3px;border-radius:14px;border:2.5px solid var(--line,#e2d3bd);background:#fffaf0;cursor:pointer;min-height:56px}
.pg-fd.love{border-color:#e5587f;background:#fff0f4}.pg-fd .ico svg{width:32px;height:32px;display:block}.pg-fd small{font:800 11px/1 var(--display,inherit);color:#a8781a}
.pg-heart{position:absolute;top:-6px;right:-4px;font-style:normal;font-size:14px;color:#e5587f}
.pg-fd:active{transform:scale(.94)}
.pg-fn{margin:6px 0 0;font-size:12.5px;color:var(--ink2,#7a6250)}
.pg-pow{display:flex;gap:6px;align-items:center;margin:8px 0 0;font-size:12.5px;color:var(--ink2,#7a6250)}.pg-pow.on{color:#7a4fb0}.pg-pow .pg-ic{width:22px;height:22px}.pg-pow .pg-ic.off{filter:grayscale(1);opacity:.5}
.pg-pass{margin:8px 0 12px;border:2.5px solid var(--line,#e2d3bd);border-radius:16px;background:#fbf4e4;padding:6px 10px 10px}
.pg-pass summary{display:flex;align-items:center;gap:8px;cursor:pointer;list-style:none}.pg-pass summary::-webkit-details-marker{display:none}.pg-pass summary b{font:800 16px/1.1 var(--display,inherit)}.pg-pass summary small{color:var(--ink2,#7a6250);margin-left:auto;font-size:12px;text-align:right}
.pg-pals{display:flex;gap:6px;margin:8px 0}.pg-pal{flex:1;display:flex;flex-direction:column;align-items:center;padding:3px 0;border-radius:10px;border:2px dashed #d8c7ab;background:#fff;font-size:11px;color:#7a6250}.pg-pal b{font:800 14px/1 var(--display,inherit);color:#4a3528}.pg-pal.ok{border-style:solid;border-color:#3a8f5a;background:#eef8f0;color:#2f6b3a}
.pg-stamps{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px}
.pg-st{display:block;aspect-ratio:1}.pg-st svg{width:100%;height:100%;display:block}.pg-st.empty{border-radius:50%;border:2px dashed #d8c7ab}
.pg-obs{display:flex;align-items:center;gap:6px}.pg-obsl{margin:0 0 8px;padding-left:18px;font-size:13px}
.cm-slots:has(> :nth-child(5)){grid-template-columns:repeat(3,minmax(0,1fr))!important}
@keyframes pgSmoke{0%{transform:translateY(4px);opacity:0}30%{opacity:.9}100%{transform:translateY(-10px);opacity:0}}
@keyframes pgGlow{0%,100%{opacity:1}50%{opacity:.82}}
@media (prefers-reduced-motion:reduce){.pg-smoke,.pg-steam,.pg-sign{animation:none}#pgCele{transition:none}}
@media (max-width:420px){.pg-rank{min-width:34px;height:36px;padding:2px 4px;margin-right:4px}}
`;
  document.head.appendChild(st);
})();
setTimeout(() => { try { pgCheck(); } catch (e) {} }, 1600);

window.__prg = {
  state: pgState, B: PG_B, RANKS: PG_RANKS, lvl: pgLvl, can: pgCan, build: pgBuild, have: pgHave, rank: () => (pgFlush(), pgRank()), pts: pgPtsDetail, check: pgCheck,
  stamps: pgStamps, passHTML: pgPassHTML, feed: pgFeed, foods: pgFoods, foodXP: pgFoodXP, stage: pgStage, powLine: pgPowLine, powOf: pgPowOf, beds: pgBeds, obs: pgObsList,
  forceDouble: false,
  T: () => ({ S, makeItem, rgState, REGIONS, cmState, CM_R, MY_UNLOCK, fyMods, fyCapInfo, needXP, openSheet, renderPanel, renderTop, GAME }),
};

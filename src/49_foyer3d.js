// ================= v36 : LE FOYER EN 3D, À LA PREMIÈRE PERSONNE (+ CONFORT) =================
// Le joueur : « Le foyer ne ressemble à rien. Je voudrais une vraie vue d'intérieur, avec tout ce que j'entrepose. »
// 1. LA PIÈCE en CSS 3D (aucune bibliothèque) : une boîte de 4 murs, sol et plafond ; la caméra est au centre, à hauteur
//    de familier. Glisser fait tourner le regard (360°, un peu d'inertie, un peu de haut en bas). Les constructions de
//    48_progression.js se voient (serre, atelier, coin repas, observatoire, chambre d'amis, cheminée).
// 2. CE QU'ON ENTREPOSE : les objets du sac sur des étagères triées par usage (garde-manger, caisses de matériaux,
//    vitrine des trésors, vestiaire, matériel d'expédition) ; toucher une étagère ouvre le sac sur le bon onglet.
// 3. DÉCORER ET CONFORT : 10 emplacements ; chaque déco posée donne 1 à 5 points (rareté), +2 au bon endroit.
//    Niveaux Simple, Douillet, Cosy, Chaleureux, Paradis : +0/4/8/12/16 % de butin, autant de risques en moins,
//    repos (et bonheur au repos) 2× ce pourcentage. Appliqué : collect, xpRiskK, fyMods, fwWork.
// 4. LES FAMILIERS présents se promènent dans la pièce (billboards), près de leur poste (40_foyer.js).
// État : S.f3d = { d: { emplacement: objet posé } } (les objets posés quittent le sac et y reviennent quand on les retire).
// Enveloppes : fyRender, collect, showHaul, xpRiskK, fyMods, fwWork. Usages : GAME.addUses / GAME.addAction (kind 'decorer').
// Tests : window.__f3.

const f3Call = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const F3_L = '#5b4636';
const F3_R = 300, F3_HW = 380, F3_EYE = 120, F3_P = 205; // demi-largeur de la pièce, hauteur des murs, hauteur des yeux, perspective
const F3_FLOOR = F3_EYE, F3_CEIL = F3_EYE - F3_HW;

function f3State() {
  if (!S.f3d || typeof S.f3d !== 'object' || Array.isArray(S.f3d)) S.f3d = {};
  const D = S.f3d;
  if (!D.d || typeof D.d !== 'object' || Array.isArray(D.d)) D.d = {};
  for (const k of Object.keys(D.d)) if (!F3_SLOT[k] || !D.d[k] || typeof D.d[k] !== 'object' || !D.d[k].name) delete D.d[k];
  return D;
}
const f3Lvl = id => f3Call(() => pgLvl(id), 0);

// ---------------- emplacements de décoration ----------------
// [id, mur, x, y, l, h, genre (w mur, f sol, r tapis), nom, sous-types idéaux, regex de nom idéal, conseil]
const F3_SLOTS = [
  ['n_vit', 'N', 40, 58, 112, 72, 'f', 'Sur la vitrine', ['statue', 'mappemonde', 'bocal'], /troph|coupe|globe|mappemonde/i, 'un trophée ou une mappemonde'],
  ['n_mur', 'N', 428, 62, 136, 112, 'w', 'Mur de la fenêtre', ['herbier', 'cartemur'], /carte|tableau|planisph|affiche/i, 'un tableau ou une carte'],
  ['n_fen', 'N', 430, 236, 110, 138, 'f', 'Près de la fenêtre', ['plante', 'lanterne'], /plante|cactus|oranger|bonsa/i, 'une plante (au soleil)'],
  ['e_chem', 'E', 252, 26, 116, 98, 'w', 'Au-dessus de la cheminée', ['cartemur', 'herbier', 'statue', 'mappemonde'], /carte|horloge|tableau|pendule/i, 'une carte du monde ou une horloge'],
  ['e_mur', 'E', 444, 70, 120, 112, 'w', 'Mur du coin repos', ['lampe', 'lanterne', 'herbier'], /lampe|lanterne|applique/i, 'une lampe douce'],
  ['s_mur', 'S', 36, 52, 132, 110, 'w', 'À côté de la porte', ['cartemur', 'herbier'], /carte|plan |atlas|planisph/i, 'une carte du monde, pour préparer les voyages'],
  ['s_sol', 'S', 188, 250, 60, 124, 'f', 'Près de la porte', ['plante', 'statue', 'lanterne'], /plante|lanterne|parapluie/i, 'une plante ou une lanterne'],
  ['w_mur', 'W', 310, 64, 106, 106, 'w', 'Mur de la cuisine', ['herbier', 'cartemur'], /horloge|tableau|pendule|carte/i, 'une horloge ou un tableau'],
  ['w_cpt', 'W', 214, 168, 84, 86, 'f', 'Sur le plan de travail', ['bocal', 'plante'], /bocal|mug|tasse|moulin|pot/i, 'un bocal ou une petite plante'],
  ['tapis', 'F', 180, 60, 240, 170, 'r', 'Au milieu de la pièce', ['tapis', 'coussin'], /tapis|coussin|plaid/i, 'un tapis ou un coussin'],
];
const F3_SLOT = {}; F3_SLOTS.forEach(s => { F3_SLOT[s[0]] = s; });
const F3_WALLS = { N: 0, E: -90, S: 180, W: 90 };
const F3_WNAME = { N: 'la fenêtre', E: 'la cheminée', S: 'l’entrée', W: 'la cuisine' };
// objets décoratifs : famille déco, et quelques objets fabriqués qui se posent (carte du monde, horloge, lampe…)
const F3_DECO_RX = /carte du monde|carte murale|planisph|mappemonde|horloge|pendule|tableau|lampe|lustre|vase|bougie parfum|boîte à musique|peluche|bonsa/i;
function f3IsDeco(it) {
  if (!it || !it.name || it.cat === 'n' || it.cat === 'v' || it.mk) return false;
  return it.cat === 'd' || F3_DECO_RX.test(it.name);
}
const F3_FLOOR_ONLY = ['tapis', 'coussin', 'gamelle'];
function f3Fits(it, slot) {
  const s = F3_SLOT[slot]; if (!s || !f3IsDeco(it)) return false;
  if (s[6] === 'r') return F3_FLOOR_ONLY.includes(it.sub);
  if (s[6] === 'w' && F3_FLOOR_ONLY.includes(it.sub)) return false;
  if (s[6] === 'f' && it.sub === 'tapis') return false;
  return true;
}
const f3Match = (it, slot) => { const s = F3_SLOT[slot]; return !!(s && it && (s[8].includes(it.sub) || s[9].test(it.name || ''))); };
// v36 : TROPHÉES (reliques, trésors uniques, objets légendaires, statues rares) : points de confort doublés
const f3Trophy = it => !!(it && (it.relic || it.tresor || (it.rarity | 0) >= 4 || (it.sub === 'statue' && (it.rarity | 0) >= 3)));
const f3Base = it => Math.max(1, Math.min(5, (it.rarity | 0) + 1)) * (f3Trophy(it) ? 2 : 1);
const f3Pts = (it, slot) => f3Base(it) + (slot && f3Match(it, slot) ? 2 : 0);

// ---------------- confort ----------------
const F3_LV = [['Simple', 0, 0], ['Douillet', 4, 0.04], ['Cosy', 10, 0.08], ['Chaleureux', 18, 0.12], ['Paradis', 28, 0.16]];
function f3Comfort() {
  const D = f3State(); let n = 0;
  for (const [k, it] of Object.entries(D.d)) n += f3Pts(it, k);
  return n + f3Lvl('cheminee'); // une vraie cheminée réchauffe aussi la pièce
}
function f3Eff(c) {
  if (c == null) c = f3Comfort();
  let i = 0; F3_LV.forEach((L, j) => { if (c >= L[1]) i = j; });
  const L = F3_LV[i], nx = F3_LV[i + 1];
  return { c, i, nm: L[0], p: (window.__f3 && __f3.forceP != null) ? __f3.forceP : L[2], next: nx ? { nm: nx[0], need: nx[1] - c } : null };
}
const f3Pct = p => Math.round(p * 100);
function f3EffTxt(E) {
  E = E || f3Eff();
  const rl = f3Call(() => f3Relics().map(f3RelicTxt), []).map(x => ` · ${x}`).join('');
  if (!E.p) return `${E.nm} : posez des décos pour gagner du confort${rl}`;
  return `${E.nm} : +${f3Pct(E.p)} % de butin, −${f3Pct(E.p)} % de risques, repos +${f3Pct(2 * E.p)} %${rl}`;
}
function f3EffShort(E) {
  E = E || f3Eff();
  return E.p ? `+${f3Pct(E.p)} % butin · −${f3Pct(E.p)} % risques · repos +${f3Pct(2 * E.p)} %` : 'Posez des décos pour gagner du confort';
}

// ---- effets réels ----
if (typeof xpRiskK === 'function') xpRiskK = (orig => function () {
  const r = orig.apply(this, arguments);
  try { const p = f3Eff().p; if (r > 0 && p > 0) return Math.max(0.03, r * (1 - p)); } catch (e) {}
  return r;
})(xpRiskK);
let f3LootMsg = null;
if (typeof collect === 'function') collect = (orig => function () {
  f3LootMsg = null;
  try {
    const k = S.sel, t = S.trips && S.trips[k], E = f3Eff();
    if (t && t.done && !t.tuto && !t.f3 && E.p > 0 && Array.isArray(t.bag)) {
      t.f3 = 1;
      const exp = Math.max(1, t.bag.length) * E.p, n = Math.floor(exp) + (Math.random() < exp % 1 || (window.__f3 && __f3.forceLoot) ? 1 : 0);
      if (n > 0) {
        const add = f3Call(() => lootFor((t.dest && t.dest.tags && t.dest.tags.length) ? t.dest.tags : ['campagne'], t.luck || 0, t.dest ? t.dest.name : '', n, k), []) || [];
        add.forEach(b => { b.f3 = 1; t.bag.push(b); });
        if (add.length) f3LootMsg = { k, txt: `Foyer ${E.nm.toLowerCase()} : ${add.length > 1 ? add.length + ' objets' : '« ' + add[0].name + ' »'} en plus !` };
      }
    }
  } catch (e) { console.error('foyer 3d butin', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  try { if (f3LootMsg && h && h.comp === f3LootMsg.k) { h.extra = (h.extra || []).concat([f3LootMsg.txt]); f3LootMsg = null; } } catch (e) {}
  return orig.apply(this, arguments);
})(showHaul);
if (typeof fyMods === 'function') fyMods = (orig => function () {
  const m = orig.apply(this, arguments);
  try { const p = f3Eff().p; m.rest += 2 * p; m.joy += p; } catch (e) {}
  return m;
})(fyMods);
if (typeof fwWork === 'function') fwWork = (orig => function (dt) {
  const r = orig.apply(this, arguments);
  try { const p = f3Eff().p, h = Math.max(0, Math.min(+dt || 0, 48 * 3600e3)) / 3600e3; if (p > 0 && h > 0) fwWho('repos').forEach(k => { const c = fyC(k); c.joy = fyClamp(c.joy + h * 20 * 2 * p); }); } catch (e) {}
  return r;
})(fwWork);

// ---------------- poser / retirer ----------------
function f3Place(slot, id) {
  const it = S.inv.find(i => i.id === id), D = f3State();
  if (!it || !F3_SLOT[slot] || D.d[slot] || !f3Fits(it, slot)) return false;
  S.inv.splice(S.inv.indexOf(it), 1); D.d[slot] = it; save();
  return true;
}
function f3Take(slot) {
  const D = f3State(), it = D.d[slot]; if (!it) return false;
  delete D.d[slot]; S.inv.push(it); save(); return true;
}
function f3BestSlot(it) {
  const D = f3State(), free = F3_SLOTS.filter(s => !D.d[s[0]] && f3Fits(it, s[0]));
  return (free.find(s => f3Match(it, s[0])) || free[0] || [null])[0];
}
function f3AutoPlace(id) {
  const it = S.inv.find(i => i.id === id); if (!it) return false;
  const sl = f3BestSlot(it);
  if (!sl) { f3Call(() => toast('Tous les emplacements sont pris : retirez une déco dans le Foyer (bouton « Décorer »).')); return false; }
  const before = f3Eff(), pts = f3Pts(it, sl);
  if (!f3Place(sl, id)) return false;
  f3Yaw = F3_SLOT[sl][1] === 'F' ? f3Yaw : F3_WALLS[F3_SLOT[sl][1]] + (F3_SLOT[sl][2] + F3_SLOT[sl][4] / 2 - 300) * 0.1;
  f3Call(() => { const m = $('modal'); if (m) m.hidden = true; });
  f3Call(() => openSheet('foyer'));
  f3Call(() => { const b = $('panelBody'); if (b) b.scrollTop = 0; });
  const E = f3Eff();
  f3Call(() => toast(`${it.name} posé${it.name.match(/^(La |Une )|e$/) ? 'e' : ''} : +${pts} confort${E.i > before.i ? ` · votre foyer devient « ${E.nm} » !` : ''}`));
  return true;
}

// ---------------- ce qu'on entrepose ----------------
// zone → [onglet du sac, nom de l'étagère, nombre d'icônes]
const F3_ZONES = { cuisine: ['cuisiner', 'Garde-manger', 10], caisses: ['construire', 'Matériaux', 8], vitrine: ['autre', 'Trésors', 9], portant: ['porter', 'Vestiaire', 6], expe: ['partir', 'Expédition', 8] };
function f3ZoneOf(it) {
  const tabs = f3Call(() => usTabsOf(it), new Set()) || new Set();
  if (it.tresor || it.special || (it.rarity || 0) >= 3 || f3IsDeco(it)) return 'vitrine';
  if (it.cat === 'v') return 'portant';
  if (tabs.has('partir')) return 'expe';
  if (it.cat === 'n' || tabs.has('cuisiner')) return 'cuisine';
  if (it.cat === 'm' || tabs.has('construire')) return 'caisses';
  return 'vitrine';
}
function f3Stock() {
  const by = {}, Z = {}; Object.keys(F3_ZONES).forEach(z => { Z[z] = { n: 0, list: [] }; });
  (S.inv || []).forEach(it => { if (!it || !it.name) return; const g = by[it.name]; if (g) { g.n++; if ((it.rarity || 0) > (g.it.rarity || 0)) g.it = it; } else by[it.name] = { it, n: 1 }; });
  Object.values(by).forEach(g => { const z = f3ZoneOf(g.it); Z[z].n += g.n; Z[z].list.push(g); });
  for (const [z, o] of Object.entries(Z)) { // les plus rares et les plus nombreux
    const cap = F3_ZONES[z][2], half = Math.ceil(cap / 2), pick = new Set();
    o.list.slice().sort((a, b) => (b.it.rarity || 0) - (a.it.rarity || 0) || b.n - a.n).slice(0, half).forEach(g => pick.add(g));
    o.list.slice().sort((a, b) => b.n - a.n || (b.it.rarity || 0) - (a.it.rarity || 0)).forEach(g => { if (pick.size < cap) pick.add(g); });
    o.show = [...pick].sort((a, b) => (b.it.rarity || 0) - (a.it.rarity || 0) || b.n - a.n);
  }
  return Z;
}
const f3It = g => `<span class="f3-it r${g.it.rarity | 0}" title="${esc(g.it.name)}${g.n > 1 ? ' ×' + g.n : ''}">${f3Call(() => itemIcon(g.it), '')}${g.n > 1 ? `<i>×${g.n}</i>` : ''}</span>`;
function f3ZoneHTML(z, Z, x, y, w, h, cls = '') {
  const o = Z[z], [tab, nm] = F3_ZONES[z];
  return `<button class="f3-z f3-z-${z} ${cls}" data-f3z="${z}" data-f3tab="${tab}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-label="${esc(nm)} : ${o.n} objet${o.n > 1 ? 's' : ''}, ouvrir le sac"><span class="f3-zi">${o.show.map(f3It).join('') || `<em class="f3-empty">vide</em>`}</span><b class="f3-sign">${esc(nm)} · ${o.n}</b></button>`;
}

// ---------------- dessin de la pièce ----------------
const f3s = (w = 2.2) => `stroke="${F3_L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
function f3Sky() {
  const h = f3Call(() => fyHour(), new Date().getHours()), ph = f3Call(() => fyPhase(), 'day');
  const wx = f3Call(() => { const w = wdAt(homeObj()); return w ? w.K.wx : ''; }, '') || '';
  const top = ph === 'day' ? '#8fd0f0' : ph === 'eve' ? '#f6a07a' : '#26305e', bot = ph === 'day' ? '#e3f4fb' : ph === 'eve' ? '#fcdca0' : '#4a4f86';
  let g = `<defs><linearGradient id="f3sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wx === 'pluie' || wx === 'nuages' ? (ph === 'night' ? '#2b2f4a' : '#9fb1c2') : top}"/><stop offset="1" stop-color="${wx === 'pluie' || wx === 'nuages' ? (ph === 'night' ? '#454a66' : '#dfe6ea') : bot}"/></linearGradient></defs>`;
  g += `<rect x="0" y="0" width="180" height="200" fill="url(#f3sky)"/>`;
  if (ph === 'night') g += [[20, 30], [60, 18], [120, 40], [150, 22], [90, 60], [36, 76], [160, 70]].map(([x, y], i) => `<circle class="f3-tw" style="animation-delay:${i * 0.4}s" cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.2}" fill="#fff6c8"/>`).join('') + `<path d="M138 30 A16 16 0 1 0 150 58 A13 13 0 0 1 138 30Z" fill="#fff3c0"/>`;
  else if (wx !== 'pluie' && wx !== 'nuages') g += ph === 'day' ? `<circle cx="140" cy="42" r="30" fill="#fff6c8" opacity=".45"/><circle cx="140" cy="42" r="17" fill="#fbe08a"/>` : `<circle cx="120" cy="118" r="26" fill="#fbd27a"/><circle cx="120" cy="118" r="44" fill="#fbd27a" opacity=".3"/>`;
  const cl = (x, y, s, o) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 14 a10 10 0 0 1 12 -10 a14 14 0 0 1 26 2 a9 9 0 0 1 10 12 Z" fill="#fff" opacity="${o}"/>`;
  g += wx === 'nuages' || wx === 'pluie' ? cl(10, 22, 1.4, ph === 'night' ? .25 : .9) + cl(80, 40, 1.8, ph === 'night' ? .2 : .85) + cl(40, 70, 1.2, .7) : ph !== 'night' ? cl(14, 34, 1, .9) + cl(96, 70, .8, .8) : '';
  // dehors : collines, arbre, clôture
  const hill = ph === 'night' ? '#3d5a5a' : ph === 'eve' ? '#9ab070' : '#a8d08d', hill2 = ph === 'night' ? '#30494b' : ph === 'eve' ? '#86a060' : '#8fbf6a';
  g += `<path d="M0 150 Q50 118 100 140 T180 128 V200 H0Z" fill="${hill}"/><path d="M0 172 Q70 150 180 170 V200 H0Z" fill="${hill2}"/>`;
  g += `<path d="M30 160 V130" stroke="#7a5a3a" stroke-width="5"/><circle cx="30" cy="118" r="18" fill="${ph === 'night' ? '#2f5a46' : '#6fae5f'}"/><circle cx="20" cy="126" r="11" fill="${ph === 'night' ? '#2a4f3e' : '#5f9e50'}"/>`;
  g += `<path d="M0 182 H180 M10 176 V194 M50 176 V194 M90 176 V194 M130 176 V194 M170 176 V194" stroke="${ph === 'night' ? '#6a6070' : '#f4ead8'}" stroke-width="3"/>`;
  if (wx === 'pluie') g += `<g class="f3-rain">${Array.from({ length: 16 }, (_, i) => `<path d="M${(i * 23) % 180} ${(i * 37) % 160} l-5 14" stroke="#dbe8f4" stroke-width="1.6" opacity=".8"/>`).join('')}</g>`;
  if (wx === 'neige') g += `<g class="f3-snow">${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 29) % 180}" cy="${(i * 41) % 190}" r="${1.5 + i % 3}" fill="#fff"/>`).join('')}</g>`;
  return { g, ph, wx, h };
}
// mur N : vitrine, grande fenêtre (ciel, météo, observatoire), banquette
function f3WallN(Z, sky) {
  const ob = f3Lvl('observ');
  let g = `<svg class="f3-svg" viewBox="0 0 600 380" aria-hidden="true">`;
  // vitrine
  g += `<rect x="22" y="128" width="156" height="246" rx="6" fill="#b88355" ${f3s()}/><rect x="32" y="138" width="136" height="200" rx="3" fill="#e9f5f6" fill-opacity=".55" ${f3s(1.6)}/>`;
  g += [200, 262].map(y => `<path d="M32 ${y} H168" ${f3s(3)}/><path d="M32 ${y + 3} H168" stroke="#7a5236" stroke-width="2" opacity=".5"/>`).join('');
  g += `<path d="M100 138 V338" ${f3s(1.4)}/><path d="M44 150 l20 -10 M48 166 l30 -16" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/><rect x="32" y="342" width="136" height="26" fill="#a87048" ${f3s(1.6)}/><circle cx="92" cy="355" r="3" fill="#f2c14e" ${f3s(1)}/><circle cx="108" cy="355" r="3" fill="#f2c14e" ${f3s(1)}/>`;
  // fenêtre : embrasure, ciel, croisillons, rideaux
  g += `<rect x="196" y="38" width="208" height="236" rx="10" fill="#e9c9a3" ${f3s()}/>`;
  g += `<svg x="210" y="52" width="180" height="200" viewBox="0 0 180 200" preserveAspectRatio="none">${sky.g}</svg>`;
  g += `<rect x="210" y="52" width="180" height="200" fill="none" ${f3s(2.6)}/><path d="M300 52 V252 M210 150 H390" stroke="#fff8ec" stroke-width="7"/><path d="M300 52 V252 M210 150 H390" ${f3s(1.4)} fill="none"/>`;
  g += `<path d="M222 64 l26 -6 M222 80 l46 -12" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
  g += `<path d="M184 30 H416" ${f3s(4)}/><path d="M188 30 Q206 120 194 286 Q214 290 226 284 Q218 150 234 30Z" fill="#f3aec1" ${f3s(1.8)}/><path d="M412 30 Q394 120 406 286 Q386 290 374 284 Q382 150 366 30Z" fill="#f3aec1" ${f3s(1.8)}/>`;
  g += `<path d="M200 54 Q206 160 200 280 M400 54 Q394 160 400 280" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/>`;
  g += `<rect x="186" y="270" width="228" height="12" rx="4" fill="#d9b48a" ${f3s(2)}/>`;
  // banquette sous la fenêtre
  g += `<rect x="206" y="300" width="188" height="74" rx="8" fill="#c99a6a" ${f3s()}/><path d="M214 300 Q300 284 386 300 V316 H214Z" fill="#9fd1d8" ${f3s(2)}/><ellipse cx="246" cy="296" rx="22" ry="14" fill="#f6d36b" ${f3s(1.8)}/><ellipse cx="356" cy="296" rx="22" ry="14" fill="#f39ab0" ${f3s(1.8)}/><path d="M226 340 H374" stroke="${F3_L}" stroke-width="1.6" opacity=".5"/>`;
  // observatoire : un télescope pointé vers le ciel
  if (ob) g += `<g class="f3-tele"><path d="M352 372 L366 250 L380 372 M366 250 L366 372" ${f3s(3)} fill="none"/><g transform="rotate(-34 366 246)"><rect x="318" y="234" width="${92 + ob * 8}" height="22" rx="8" fill="${ob > 1 ? '#e3b94a' : '#8f9cb3'}" ${f3s(2.2)}/><rect x="${404 + ob * 8}" y="230" width="12" height="30" rx="4" fill="#5c6b94" ${f3s(2)}/><rect x="306" y="238" width="14" height="14" rx="3" fill="#5c6b94" ${f3s(1.8)}/></g><circle cx="366" cy="248" r="6" fill="#f2c14e" ${f3s(1.6)}/></g>`;
  else g += `<rect x="340" y="320" width="44" height="30" rx="4" fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  g += `</svg>`;
  return g + f3ZoneHTML('vitrine', Z, 34, 140, 132, 196, 'f3-glass') + (ob ? '' : `<span class="f3-ghost" style="left:318px;top:352px">Observatoire</span>`);
}
// mur E : atelier / expédition, nid d'œufs, cheminée, coin repos
function f3WallE(Z) {
  const at = f3Lvl('atelier'), ch = f3Lvl('cheminee'), eggs = (S.eggs || []).length;
  let g = `<svg class="f3-svg" viewBox="0 0 600 380" aria-hidden="true">`;
  // atelier : panneau à outils + établi (ou simple étagère)
  if (at) {
    g += `<rect x="16" y="70" width="172" height="168" rx="6" fill="#e9c7a0" ${f3s()}/>` + Array.from({ length: 36 }, (_, i) => `<circle cx="${30 + (i % 9) * 18}" cy="${86 + Math.floor(i / 9) * 38}" r="1.6" fill="${F3_L}" opacity=".35"/>`).join('');
    g += `<rect x="10" y="250" width="184" height="18" rx="3" fill="#b07a4f" ${f3s()}/><path d="M24 268 V374 M180 268 V374 M24 330 H180" ${f3s(3)}/><rect x="140" y="236" width="34" height="16" rx="3" fill="#8f9cb3" ${f3s(1.8)}/>`;
    if (at > 1) g += `<path d="M40 246 l30 -14 6 6 -30 14Z" fill="#b5bcc2" ${f3s(1.6)}/>`;
    if (at > 2) g += `<path d="M160 70 V40 M160 40 l-20 -6" ${f3s(2)} fill="none"/><path d="M128 30 h22 l-6 14 h-10Z" fill="#f2c14e" ${f3s(1.6)}/><circle cx="139" cy="52" r="20" fill="#fbe08a" opacity=".35"/>`;
  } else {
    g += `<rect x="20" y="148" width="164" height="10" rx="3" fill="#c99a6a" ${f3s()}/><rect x="20" y="228" width="164" height="10" rx="3" fill="#c99a6a" ${f3s()}/><path d="M34 158 l8 10 M170 158 l-8 10 M34 238 l8 10 M170 238 l-8 10" ${f3s(2)}/>`;
    g += `<rect x="30" y="300" width="146" height="74" rx="5" fill="#d8a978" ${f3s()}/><path d="M30 336 H176 M103 300 V374" ${f3s(1.6)}/>`;
  }
  // nid d'œufs de la nurserie, au chaud près du feu
  g += `<ellipse cx="212" cy="360" rx="26" ry="12" fill="#d9b48a" ${f3s(2)}/>` + Array.from({ length: Math.min(3, Math.max(1, eggs)) }, (_, i) => `<ellipse cx="${200 + i * 12}" cy="${346 - (i % 2) * 3}" rx="8" ry="11" fill="${eggs ? ['#fff3e2', '#f6d2e6', '#d6ecf3'][i] : '#f4ead8'}" ${f3s(1.6)} opacity="${eggs ? 1 : .5}"/>`).join('') + `<path d="M188 356 Q212 370 236 356" fill="none" stroke="#a87a50" stroke-width="3"/>`;
  // cheminée
  if (ch) {
    g += `<rect x="226" y="136" width="148" height="238" fill="#e3c8b0" ${f3s()}/>` + [160, 190, 220, 250, 280, 310, 340].map((y, j) => `<path d="M226 ${y} H374" stroke="${F3_L}" stroke-width="1" opacity=".25"/>` + [0, 1, 2, 3].map(i => `<path d="M${240 + i * 40 + (j % 2) * 20} ${y - 30} V${y}" stroke="${F3_L}" stroke-width="1" opacity=".18"/>`).join('')).join('');
    g += `<rect x="214" y="126" width="172" height="16" rx="4" fill="#a87048" ${f3s()}/><path d="M252 374 V250 Q300 204 348 250 V374Z" fill="#3b2a24" ${f3s()}/>`;
    if (ch > 1) g += `<path d="M216 140 Q240 156 262 142 Q286 156 300 142 Q316 156 338 142 Q360 156 384 140" fill="none" stroke="#5fa274" stroke-width="5"/>` + [240, 280, 320, 360].map((x, i) => `<circle cx="${x}" cy="${150}" r="4" fill="${['#e5584f', '#f6c445', '#e5584f', '#f6c445'][i]}" ${f3s(1)}/>`).join('');
    if (ch > 2) g += `<path d="M214 126 H386" stroke="#e3b94a" stroke-width="3"/>`;
    g += `<path d="M266 372 L334 360 M266 360 L334 372" stroke="#8a5a3a" stroke-width="9" stroke-linecap="round"/><g class="f3-fire"><path d="M270 362 C262 330 286 318 292 290 C304 316 318 300 316 280 C334 306 342 336 330 362Z" fill="#f28a3a"/><path d="M284 362 C280 340 296 332 300 312 C308 332 320 330 318 362Z" fill="#f6c445"/><path d="M294 362 C292 350 300 344 302 334 C306 346 312 350 308 362Z" fill="#fff3c0"/></g>`;
  } else {
    g += `<rect x="248" y="232" width="104" height="142" rx="6" fill="#d98b6a" ${f3s()}/><rect x="240" y="222" width="120" height="14" rx="4" fill="#a87048" ${f3s()}/><path d="M270 374 V300 Q300 276 330 300 V374Z" fill="#3b2a24" ${f3s(2)}/><g class="f3-fire"><path d="M284 372 C280 352 294 344 300 328 C306 344 320 352 316 372Z" fill="#f28a3a"/><path d="M292 372 C290 360 298 356 300 348 C304 358 310 362 308 372Z" fill="#f6c445"/></g>`;
    g += `<path d="M232 136 H368 V222" fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  }
  // coin repos : paniers et coussins
  g += `<path d="M396 374 Q392 330 432 326 H494 Q520 330 516 374Z" fill="#c98a5a" ${f3s()}/><ellipse cx="456" cy="336" rx="48" ry="12" fill="#9fd1d8" ${f3s(2)}/><path d="M404 352 H508" stroke="#a87048" stroke-width="2" opacity=".6"/>`;
  g += `<ellipse cx="552" cy="358" rx="40" ry="16" fill="#f3aec1" ${f3s(2)}/><path d="M524 352 Q552 340 580 352" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/><circle cx="552" cy="356" r="2.6" fill="${F3_L}" opacity=".5"/>`;
  g += `</svg>`;
  if (ch) g += `<i class="f3-glow f3-glow-big" style="left:200px;top:200px"></i>`; else g += `<i class="f3-glow" style="left:230px;top:250px"></i>`;
  return g + f3ZoneHTML('expe', Z, 22, at ? 78 : 100, 160, at ? 154 : 128) + (ch ? '' : `<span class="f3-ghost" style="left:258px;top:118px">Cheminée</span>`) + (at ? '' : `<span class="f3-ghost" style="left:58px;top:340px">Atelier</span>`);
}
// mur S : caisses de matériaux, porte d'entrée, vestiaire, chambre d'amis
function f3WallS(Z) {
  const cb = f3Lvl('chambre');
  let g = `<svg class="f3-svg" viewBox="0 0 600 380" aria-hidden="true">`;
  const crate = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" ${f3s()}/><path d="M${x} ${y + h / 2} H${x + w} M${x + 6} ${y + 4} L${x + w - 6} ${y + h - 4}" stroke="${F3_L}" stroke-width="1.6" opacity=".55"/>`;
  g += crate(16, 300, 92, 74, '#d8a978') + crate(108, 314, 76, 60, '#c99a6a') + crate(34, 236, 76, 64, '#e3b88a');
  // porte d'entrée
  g += `<rect x="242" y="112" width="126" height="262" rx="8" fill="#e9c9a3" ${f3s()}/><path d="M252 374 V136 Q252 122 266 122 H344 Q358 122 358 136 V374Z" fill="#8fbfb0" ${f3s()}/>`;
  g += `<rect x="266" y="140" width="78" height="80" rx="6" fill="#cfe8f0" ${f3s(1.8)}/><path d="M305 140 V220 M266 180 H344" ${f3s(1.4)}/><rect x="266" y="236" width="78" height="120" rx="6" fill="none" ${f3s(1.6)}/><circle cx="346" cy="262" r="5" fill="#f2c14e" ${f3s(1.4)}/>`;
  g += `<path d="M226 374 H384" stroke="#a87048" stroke-width="5"/><ellipse cx="305" cy="370" rx="44" ry="6" fill="#e5587f" opacity=".9" ${f3s(1.4)}/>`;
  // vestiaire (portant)
  g += `<path d="M384 374 V150 M486 374 V150 M378 150 H492" ${f3s(4)} fill="none"/><path d="M378 374 H396 M474 374 H492" ${f3s(4)}/>`;
  // chambre d'amis : une arche avec un lit
  if (cb) {
    g += `<path d="M502 374 V176 Q502 140 546 140 Q590 140 590 176 V374Z" fill="#f6dcc0" ${f3s()}/><path d="M512 374 V184 Q512 154 546 154 Q580 154 580 184 V374Z" fill="#fbe9d2"/>`;
    g += `<rect x="514" y="300" width="64" height="40" rx="6" fill="#9cc3e6" ${f3s(2)}/><rect x="514" y="292" width="24" height="14" rx="5" fill="#fff" ${f3s(1.6)}/><path d="M514 340 V372 M578 340 V372" ${f3s(3)}/><rect x="532" y="206" width="30" height="34" rx="4" fill="#fbd76a" ${f3s(1.6)}/>`;
    if (cb > 1) g += `<path d="M530 318 H574" stroke="#fff" stroke-width="3" opacity=".7"/>`;
  } else g += `<path d="M502 374 V176 Q502 140 546 140 Q590 140 590 176 V374" fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  g += `</svg>`;
  return g + f3ZoneHTML('caisses', Z, 18, 210, 166, 160, 'f3-crate') + f3ZoneHTML('portant', Z, 388, 158, 96, 214, 'f3-rack') + (cb ? '' : `<span class="f3-ghost" style="left:506px;top:250px">Chambre d’amis</span>`);
}
// mur W : garde-manger et plan de travail, coin repas, porte vitrée de la serre
function f3WallW(Z) {
  const rp = f3Lvl('repas'), se = f3Lvl('serre');
  let g = `<svg class="f3-svg" viewBox="0 0 600 380" aria-hidden="true">`;
  // étagères du garde-manger
  g += [140, 212].map(y => `<rect x="20" y="${y}" width="190" height="9" rx="3" fill="#c99a6a" ${f3s()}/><path d="M34 ${y + 9} l8 9 M196 ${y + 9} l-8 9" ${f3s(2)}/>`).join('');
  // plan de travail
  g += `<rect x="10" y="252" width="296" height="16" rx="4" fill="#f4ead8" ${f3s()}/><rect x="18" y="268" width="280" height="106" fill="#9fc7b5" ${f3s()}/><path d="M112 268 V374 M206 268 V374" ${f3s(1.6)}/><circle cx="102" cy="320" r="3.4" fill="${F3_L}"/><circle cx="122" cy="320" r="3.4" fill="${F3_L}"/><circle cx="216" cy="320" r="3.4" fill="${F3_L}"/>`;
  g += `<path d="M40 252 V236 Q40 226 52 226 H74 Q86 226 86 236 V252" fill="#e0784a" ${f3s(1.8)}/><path d="M86 238 h12" ${f3s(2)}/><path d="M56 220 q-4 -8 0 -14 M68 220 q-4 -8 0 -14" stroke="#fff" stroke-width="2" opacity=".7" fill="none"/>`;
  g += `<rect x="146" y="238" width="40" height="14" rx="3" fill="#d9b48a" ${f3s(1.6)}/>`;
  // coin repas
  if (rp) {
    g += `<ellipse cx="362" cy="300" rx="54" ry="12" fill="#fff" ${f3s(2)}/><path d="M314 300 Q362 330 410 300 V312 Q362 340 314 312Z" fill="#e5587f" ${f3s(1.6)}/><path d="M362 318 V374 M340 374 H384" ${f3s(4)}/>`;
    g += Array.from({ length: rp }, (_, i) => `<ellipse cx="${336 + i * 26}" cy="294" rx="10" ry="4" fill="#f2c14e" ${f3s(1.4)}/>`).join('');
    g += `<path d="M300 374 V330 H322 V374 M402 374 V330 H424 V374" fill="none" ${f3s(3)}/>`;
  } else g += `<ellipse cx="362" cy="300" rx="54" ry="12" fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  // serre derrière une porte vitrée
  if (se) {
    g += `<rect x="428" y="104" width="160" height="270" rx="8" fill="#e9c9a3" ${f3s()}/><rect x="438" y="114" width="140" height="260" fill="#d8f0e6" ${f3s(2)}/>`;
    g += `<path d="M438 210 Q470 150 508 196 Q540 140 578 200 V374 H438Z" fill="#9fd07f" opacity=".75"/>` + Array.from({ length: 2 + se }, (_, i) => { const x = 450 + i * (120 / (1 + se)); return `<path d="M${x} 374 q0 -50 12 -70 M${x} 374 q-2 -40 -14 -56" fill="none" stroke="#4f8a3f" stroke-width="3.4" stroke-linecap="round"/><circle cx="${x + 12}" cy="300" r="7" fill="${['#f39ab0', '#f6c445', '#e5587f', '#cdb8ea', '#f39ab0'][i]}" ${f3s(1.4)}/>`; }).join('');
    g += `<path d="M508 114 V374 M438 200 H578 M438 290 H578" stroke="#fff8ec" stroke-width="6"/><path d="M508 114 V374" ${f3s(1.4)}/><path d="M450 130 l30 -12 M450 150 l50 -22" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/><circle cx="496" cy="250" r="5" fill="#f2c14e" ${f3s(1.4)}/>`;
  } else g += `<rect x="438" y="114" width="140" height="260" rx="8" fill="none" stroke="#b9ad9a" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  g += `</svg>`;
  if (se) g += `<i class="f3-green" style="left:410px;top:120px"></i>`;
  return g + f3ZoneHTML('cuisine', Z, 22, 84, 188, 132, 'f3-pantry') + (rp ? '' : `<span class="f3-ghost" style="left:322px;top:278px">Coin repas</span>`) + (se ? '' : `<span class="f3-ghost" style="left:474px;top:230px">Serre</span>`);
}
function f3SlotHTML(id, edit) {
  const s = F3_SLOT[id], it = f3State().d[id];
  const cls = `f3-slot k-${s[6]}${it ? ' full' : ''}${edit ? ' edit' : ''}${f3Pick === id ? ' pick' : ''}`;
  const lab = it ? `${it.name} : +${f3Pts(it, id)} confort${edit ? ', toucher pour retirer' : ''}` : `Emplacement libre : ${s[7]}`;
  if (!it && !edit) return '';
  return `<button class="${cls}" data-f3slot="${id}" style="left:${s[2]}px;top:${s[3]}px;width:${s[4]}px;height:${s[5]}px" aria-label="${esc(lab)}">${it ? `<span class="f3-deco">${f3Call(() => itemIcon(it), '')}</span>${edit ? '<i class="f3-x">✕</i>' : ''}${f3Match(it, id) ? '<i class="f3-star" title="Au bon endroit : +2">★</i>' : ''}` : '<i class="f3-plus">+</i>'}</button>`;
}
function f3WallHTML(w, inner, edit) {
  const sl = F3_SLOTS.filter(s => s[1] === w).map(s => f3SlotHTML(s[0], edit)).join('');
  // en bandes verticales : un mur qui passe derrière la caméra ne disparaît pas en entier
  const n = 6, t = (2 * F3_R + 4) / n; let h = '';
  for (let j = 0; j < n; j++) h += `<div class="f3-tile" style="left:${j * t}px;top:0;width:${t + 0.6}px;height:${F3_HW}px"><div class="f3-tin f3-wall-in" style="left:${-j * t}px;top:0">${inner}${sl}<i class="f3-sh"></i></div></div>`;
  return `<div class="f3-face f3-wall f3-w${w}" style="transform:rotateY(${F3_WALLS[w]}deg) translateZ(-${F3_R}px)">${h}</div>`;
}
function f3FloorHTML(edit, sky) {
  const sun = sky.ph !== 'night' && sky.wx !== 'pluie' && sky.wx !== 'nuages';
  return f3Tiled('f3-floor', 'rotateX(90deg)', `<i class="f3-rugdef"></i>${sun ? `<i class="f3-sun${sky.ph === 'eve' ? ' eve' : ''}"></i>` : ''}<i class="f3-fireflo${f3Lvl('cheminee') ? ' big' : ''}"></i>${f3SlotHTML('tapis', edit)}<i class="f3-sh"></i>`);
}
// sol et plafond en tuiles : un grand plan qui passe sous la caméra disparaît parfois (Chrome) ; des tuiles, non
function f3Tiled(cls, tf, inner) {
  const n = 6, t = 2 * F3_R / n; let h = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) h += `<div class="f3-tile" style="left:${j * t}px;top:${i * t}px;width:${t + 0.6}px;height:${t + 0.6}px"><div class="f3-tin ${cls}-in" style="left:${-j * t}px;top:${-i * t}px">${inner}</div></div>`;
  return `<div class="f3-face ${cls}" style="transform:${tf}">${h}</div>`;
}

// ---------------- les familiers dans la pièce ----------------
// un point au sol devant un mur (x le long du mur, recul depuis le mur) → coordonnées du monde
function f3Pt(w, x, inset) {
  const a = F3_WALLS[w] * Math.PI / 180, X = x - 300, Z = -F3_R + inset;
  return [X * Math.cos(a) + Z * Math.sin(a), -X * Math.sin(a) + Z * Math.cos(a)];
}
const F3_POST = { jard: ['W', 500, 92], comm: ['W', 150, 96], nurs: ['E', 214, 92], repos: ['E', 470, 84] };
const F3_WANDER = [['N', 300, 120], ['N', 470, 110], ['S', 300, 110], ['S', 120, 120], ['E', 330, 120], ['W', 360, 110]];
function f3PetSpots(ks) {
  const per = {};
  return ks.map(k => {
    const j = f3Call(() => fwJob(k), 'repos'), P = F3_POST[j] || F3_POST.repos, i = per[j] = (per[j] || 0) + 1;
    return { k, j, home: f3Pt(P[0], P[1] + (i - 1) * (i % 2 ? 46 : -46), P[2] + (i > 2 ? 30 : 0)) };
  });
}
let f3PetPos = {};
function f3PetsHTML() {
  const ks = f3Call(() => fwHome(), []).slice(0, 8), sp = f3PetSpots(ks);
  return sp.map(o => {
    const p = f3PetPos[o.k] && f3PetPos[o.k].j === o.j ? f3PetPos[o.k].p : o.home; f3PetPos[o.k] = { j: o.j, p, home: o.home };
    const mood = o.j === 'repos' ? 'dodo' : f3Call(() => fyC(o.k).joy, 70) >= 70 ? 'rire' : 'content';
    return `<div class="f3-pet" data-f3k="${o.k}" style="transform:translate3d(${p[0].toFixed(1)}px,${F3_FLOOR}px,${p[1].toFixed(1)}px)"><i class="f3-shadow"></i><button class="f3-bb" data-f3pet="${o.k}" aria-label="${esc(CHARS[o.k].name)} (${esc(FW_J[o.j][1])}) : choisir son poste"><span class="f3-tag">${f3Call(() => fwIco(o.j), '')}${esc(CHARS[o.k].name)}</span><img src="${f3Call(() => portraitURI(o.k, mood), '')}" alt=""></button></div>`;
  }).join('');
}

// ---------------- la vue ----------------
let f3Yaw = 0, f3Pitch = 4, f3Edit = false, f3Pick = null, f3Seen = false, f3Timer = null, f3Raf = 0;
const f3RM = () => f3Call(() => reduceMotion(), false);
function f3HudHTML() {
  const E = f3Eff(), seg = F3_LV.map((L, i) => `<i class="${i <= E.i ? 'on' : ''}"></i>`).join('');
  const fill = E.next ? Math.round(((E.c - F3_LV[E.i][1]) / (F3_LV[E.i + 1][1] - F3_LV[E.i][1])) * 100) : 100;
  return `<div class="f3-hud"><div class="f3-cf" aria-label="Confort ${E.c}, niveau ${esc(E.nm)}"><span class="f3-cft"><svg viewBox="0 0 24 24" aria-hidden="true">${FY_IC.sofa}</svg><b>Confort ${E.c}</b><em>${esc(E.nm)}</em></span><span class="f3-gauge"><span class="f3-lv">${seg}</span><span class="f3-bar"><i style="width:${fill}%"></i></span>${E.next ? `<small class="f3-nx">+${E.next.need} → ${esc(E.next.nm)}</small>` : ''}</span><small class="f3-eff" title="${esc(f3EffTxt(E))}">${esc(f3EffShort(E))}</small>${f3Call(() => f3Relics().map(id => `<small class="f3-rel">${esc(f3RelicTxt(id))}</small>`).join(''), '')}</div>
    <button class="f3-dec${f3Edit ? ' on' : ''}" data-f3edit="1" aria-pressed="${f3Edit}">${f3Edit ? 'Terminé' : 'Décorer'}</button></div>`;
}
function f3PickHTML() {
  if (!f3Pick || !F3_SLOT[f3Pick]) return '';
  const s = F3_SLOT[f3Pick], by = {};
  (S.inv || []).filter(it => f3Fits(it, f3Pick)).forEach(it => { const g = by[it.name]; if (!g || (it.rarity || 0) > (g.it.rarity || 0)) by[it.name] = { it, n: (g ? g.n : 0) + 1 }; else g.n++; });
  const list = Object.values(by).sort((a, b) => f3Pts(b.it, f3Pick) - f3Pts(a.it, f3Pick));
  const rows = list.map(g => `<button class="f3-pi" data-f3put="${esc(g.it.id)}"><span class="f3-pii">${f3Call(() => itemIcon(g.it), '')}</span><span class="f3-pit"><b>${esc(g.it.name)}</b><small>${f3Match(g.it, f3Pick) ? '★ au bon endroit' : esc(f3Call(() => RARITY[g.it.rarity], ''))}${g.n > 1 ? ' · ×' + g.n : ''}</small></span><em>+${f3Pts(g.it, f3Pick)}</em></button>`).join('');
  return `<div class="f3-pick" role="dialog" aria-label="Choisir une décoration"><div class="f3-ph"><b>${esc(s[7])}</b><small>Idéal ici : ${esc(s[10])} (+2)</small><button class="f3-pc" data-f3close="1" aria-label="Fermer">✕</button></div>${rows ? `<div class="f3-pl">${rows}</div>` : `<p class="f3-pe">Aucune décoration dans le sac pour cet endroit. On en trouve en voyage (musées, fleuristes, boutiques) et à l’atelier : plante en pot, carte murale, lanterne…</p>`}</div>`;
}
function f3ViewHTML() {
  const Z = f3Stock(), sky = f3Sky(), nt = sky.ph === 'night' ? 0.3 : sky.ph === 'eve' ? 0.12 : 0;
  const tint = sky.ph === 'eve' ? '255,170,110' : '30,35,90';
  return `<section class="f3${f3Edit ? ' editing' : ''} ph-${sky.ph}" id="f3View" aria-label="Votre foyer, vue d’intérieur" style="--nt:${nt};--tint:${tint}">
  <div class="f3-vp" data-f3vp="1"><div class="f3-world" style="transform:${f3Tf()}">
    ${f3WallHTML('N', f3WallN(Z, sky), f3Edit)}${f3WallHTML('E', f3WallE(Z), f3Edit)}${f3WallHTML('S', f3WallS(Z), f3Edit)}${f3WallHTML('W', f3WallW(Z), f3Edit)}
    ${f3FloorHTML(f3Edit, sky)}${f3Tiled('f3-ceil', 'rotateX(-90deg)', '<i class="f3-lamp"></i><i class="f3-sh"></i>')}
    ${f3PetsHTML()}
  </div><i class="f3-vig"></i></div>
  ${f3HudHTML()}
  <div class="f3-foot"><span class="f3-hint${f3Seen ? ' seen' : ''}">${f3Edit ? 'Touchez un « + » pour poser une déco, ou une déco pour la retirer' : '↔ Glissez pour regarder autour'}</span><span class="f3-where">${esc('Vers ' + f3Facing())}</span></div>
  ${f3PickHTML()}</section>`;
}
const f3Norm = a => ((a % 360) + 540) % 360 - 180;
function f3Facing() { const y = f3Norm(f3Yaw); return F3_WNAME[Math.abs(y) < 45 ? 'N' : Math.abs(y) > 135 ? 'S' : y > 0 ? 'E' : 'W']; }
const f3Tf = () => `translateZ(${F3_P}px) rotateX(${(-f3Pitch).toFixed(2)}deg) rotateY(${f3Yaw.toFixed(2)}deg)`;
function f3Apply(root) {
  root = root || document.getElementById('f3View'); if (!root) return;
  const w = root.querySelector('.f3-world'); if (w) w.style.transform = f3Tf();
  root.querySelectorAll('.f3-bb').forEach(b => { b.style.transform = `rotateY(${(-f3Yaw).toFixed(2)}deg)`; });
  const wh = root.querySelector('.f3-where'); if (wh) { const t = 'Vers ' + f3Facing(); if (wh.textContent !== t) wh.textContent = t; }
}
function f3Mount(root) {
  f3Apply(root);
  const vp = root.querySelector('.f3-vp');
  let drag = null, moved = false, vel = 0;
  const stopRaf = () => { if (f3Raf) cancelAnimationFrame(f3Raf); f3Raf = 0; };
  vp.addEventListener('pointerdown', ev => {
    if (ev.button > 0) return; stopRaf();
    drag = { x: ev.clientX, y: ev.clientY, t: performance.now(), id: ev.pointerId }; moved = false; vel = 0;
  });
  vp.addEventListener('pointermove', ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y, now = performance.now();
    if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!moved) { moved = true; try { vp.setPointerCapture(ev.pointerId); } catch (e) {} if (!f3Seen) { f3Seen = true; const h = root.querySelector('.f3-hint'); if (h) h.classList.add('seen'); } }
    const d = -dx * 0.32; f3Yaw += d; f3Pitch = Math.max(-12, Math.min(14, f3Pitch + dy * 0.12));
    vel = d / Math.max(8, now - drag.t) * 16; drag.x = ev.clientX; drag.y = ev.clientY; drag.t = now;
    f3Apply(root);
  });
  const end = ev => {
    if (!drag || (ev && ev.pointerId !== drag.id)) return;
    drag = null;
    if (moved) { root.dataset.f3drag = '1'; setTimeout(() => { delete root.dataset.f3drag; }, 60); }
    if (moved && !f3RM() && Math.abs(vel) > 0.15) {
      const step = () => { vel *= 0.92; f3Yaw += vel; f3Apply(root); f3Raf = Math.abs(vel) > 0.05 && root.isConnected ? requestAnimationFrame(step) : 0; };
      f3Raf = requestAnimationFrame(step);
    }
  };
  vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
  // les familiers se promènent doucement (pas si « réduire les animations »)
  clearInterval(f3Timer);
  if (!f3RM()) f3Timer = setInterval(() => {
    if (!root.isConnected) { clearInterval(f3Timer); return; }
    const els = [...root.querySelectorAll('.f3-pet')]; if (!els.length) return;
    const el = els[Math.floor(Math.random() * els.length)], k = el.dataset.f3k, P = f3PetPos[k]; if (!P) return;
    const atHome = Math.hypot(P.p[0] - P.home[0], P.p[1] - P.home[1]) < 20;
    let p = P.home;
    if (atHome && Math.random() < 0.6) { const W = F3_WANDER[Math.floor(Math.random() * F3_WANDER.length)]; p = f3Pt(W[0], W[1] + (Math.random() - 0.5) * 120, W[2] + Math.random() * 40); }
    else if (atHome) p = [P.home[0] + (Math.random() - 0.5) * 60, P.home[1] + (Math.random() - 0.5) * 60];
    if (Math.hypot(p[0], p[1]) < 110) return; // pas sur la caméra
    P.p = p; el.classList.add('walk'); el.style.transform = `translate3d(${p[0].toFixed(1)}px,${F3_FLOOR}px,${p[1].toFixed(1)}px)`;
    setTimeout(() => el.classList.remove('walk'), 3200);
  }, 2600);
}
function f3Repaint() {
  const b = $('panelBody'), top = b ? b.scrollTop : 0;
  f3Call(() => renderPanel()); if (b) b.scrollTop = top;
}
function f3Refresh() { const old = document.getElementById('f3View'); if (!old) return f3Repaint(); old.insertAdjacentHTML('beforebegin', f3ViewHTML()); old.remove(); const nv = document.getElementById('f3View'); if (nv) f3Mount(nv); }

// ---------------- branchement dans le Foyer ----------------
if (typeof fyRender === 'function') fyRender = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!box || f3Call(() => pgTuto(), false)) return r;
    const old = box.querySelector('.pg-home'); if (old) old.remove();
    box.insertAdjacentHTML('afterbegin', f3ViewHTML());
    box.classList.add('f3-on');
    const v = box.querySelector('#f3View'); if (v) f3Mount(v);
  } catch (e) { console.error('foyer 3d', e); }
  return r;
})(fyRender);

document.addEventListener('click', ev => {
  const root = ev.target.closest && ev.target.closest('#f3View'); if (!root) return;
  if (root.dataset.f3drag) { ev.preventDefault(); ev.stopPropagation(); return; }
  const el = ev.target.closest('[data-f3edit],[data-f3slot],[data-f3put],[data-f3close],[data-f3z],[data-f3pet]'); if (!el) return;
  const d = el.dataset;
  if (d.f3edit) { f3Edit = !f3Edit; f3Pick = null; f3Refresh(); return; }
  if (d.f3close) { f3Pick = null; f3Refresh(); return; }
  if (d.f3put) {
    const sl = f3Pick, it = S.inv.find(i => i.id === d.f3put), before = f3Eff();
    if (sl && it && f3Place(sl, it.id)) { const E = f3Eff(); f3Pick = null; f3Refresh(); f3Call(() => toast(`${it.name} : +${f3Pts(it, sl)} confort${E.i > before.i ? ` · votre foyer devient « ${E.nm} » !` : ''}`)); }
    return;
  }
  if (d.f3slot) {
    const id = d.f3slot, it = f3State().d[id];
    if (!f3Edit) { if (it) f3Call(() => toast(`${it.name} : +${f3Pts(it, id)} confort${f3Match(it, id) ? ' (au bon endroit)' : ''}. « Décorer » pour la déplacer.`)); return; }
    if (it) { f3Take(id); f3Pick = null; f3Refresh(); f3Call(() => toast(`${it.name} retourne dans le sac.`)); return; }
    f3Pick = f3Pick === id ? null : id; f3Refresh(); return;
  }
  if (d.f3z) { // ouvrir le sac sur le bon onglet d'usage
    if (f3Edit) return;
    f3Call(() => { obFilter = d.f3tab; }); f3Call(() => openSheet('sac')); return;
  }
  if (d.f3pet) { // le choix de poste du familier, plus bas
    const k = d.f3pet, b = document.querySelector(`#panelBody [data-fwjob][data-fk="${CSS.escape(k)}"]`), card = b && b.closest('.fy2-c');
    if (card) { card.scrollIntoView({ block: 'center', behavior: f3RM() ? 'auto' : 'smooth' }); card.classList.remove('f3-flash'); void card.offsetWidth; card.classList.add('f3-flash'); }
  }
}, true);

// ---------------- usages (contrat 13_bus.js) ----------------
try { if (typeof US_K !== 'undefined' && !US_K.decorer) US_K.decorer = { nom: 'Décorer', c: '#c9739a', g: '<path d="M3.5 9.5 L10 4 L16.5 9.5 V16.5 H3.5Z" fill="#fff"/><path d="M10 15 C7.5 13 6.5 12 6.5 10.8 A1.7 1.7 0 0 1 10 10.2 A1.7 1.7 0 0 1 13.5 10.8 C13.5 12 12.5 13 10 15Z" fill="#c9739a"/>' }; } catch (e) {}
const F3_ICO = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 19 L20 7 L34 19 V34 H6Z" fill="#fff3e2" stroke="#5b4636" stroke-width="2" stroke-linejoin="round"/><path d="M20 30 C14 26 12 23.5 12 21 A3.6 3.6 0 0 1 20 19.6 A3.6 3.6 0 0 1 28 21 C28 23.5 26 26 20 30Z" fill="#f39ab0" stroke="#5b4636" stroke-width="1.6"/></svg>';
GAME.addUses(it => {
  if (!f3IsDeco(it)) return [];
  const b = f3Base(it), best = F3_SLOTS.find(s => f3Match(it, s[0])), e = f3Call(() => fyEffOf({ item: it }), null);
  const out = [{ txt: `Poser chez moi : +${b} confort${f3Trophy(it) ? ' (trophée ×2)' : ''}${best ? ` (+${b + 2} ${best[7].toLowerCase()})` : ''}${e ? ` · ${e[2]}` : ''}`, kind: 'decorer' }];
  if (it.relic && F3_RELIC[it.relic]) out.push({ txt: `Relique exposée chez vous : ${f3RelicTxt(it.relic).replace(/^[^:]+: /, '')}${f3Relics().includes(it.relic) ? ' (active)' : ''}`, kind: 'confort' });
  return out;
});
GAME.addAction(it => {
  if (!f3IsDeco(it) || !S.inv.includes(it)) return [];
  const sl = f3BestSlot(it);
  return [{ label: 'Poser chez moi', kind: 'decorer', ico: F3_ICO, ready: !!sl, hint: sl ? `+${f3Pts(it, sl)} confort · ${F3_SLOT[sl][7].toLowerCase()}` : 'Tous les emplacements sont pris', run: () => f3AutoPlace(it.id) }];
});

// ================= v36 (audit des objets) : RELIQUES, ÉNERGIE, BONUS AFFICHÉS AU DÉPART =================
// RELIQUES : chaque artefact réuni (famAssemble, it.relic), exposé au foyer (vue 3D S.f3d ou ancienne maison S.house),
//   donne un bonus permanent sur un terrain : appliqué dans xpRiskK (risques) et collect (butin).
// ÉNERGIE : au départ, un familier reposé (énergie ≥ 70) rapporte 1 objet de plus et a −10 % de risques
//   (−5 % de plus par niveau de Cheminée, 48_progression.js) ; fatigué (< 30), il rapporte 1 objet de moins.
//   Mémorisé sur le voyage (t.nrgB, t.nrgCh) : clés facultatives, anciennes sauvegardes compatibles.
const F3_RELIC = { pharaon: ['desert', 'risk', 0.2], laurier: ['mer', 'risk', 0.2], soleil: ['montagne', 'loot', 0.2], jade: ['ville', 'loot', 0.2] };
const F3_TW = { montagne: 'en montagne', mer: 'en mer', foret: 'en forêt', ville: 'en ville', desert: 'au désert', froid: 'dans le grand froid' };
function f3Relics() {
  const ids = new Set();
  try { for (const it of Object.values(f3State().d)) if (it && it.relic && F3_RELIC[it.relic]) ids.add(it.relic); } catch (e) {}
  try { for (const v of Object.values(S.house || {})) if (v && v.item && v.item.relic && F3_RELIC[v.item.relic]) ids.add(v.item.relic); } catch (e) {}
  return [...ids];
}
function f3RelicTxt(id) {
  const R = F3_RELIC[id], nm = f3Call(() => FAM_RELICS.find(x => x.id === id).nom, id);
  return R ? `${nm} : ${R[1] === 'risk' ? `−${f3Pct(R[2])} % de risques` : `+${f3Pct(R[2])} % de chances d’un objet en plus`} ${F3_TW[R[0]]}` : nm;
}
const f3RelicSum = (terr, kind) => f3Relics().reduce((a, id) => a + (F3_RELIC[id][0] === terr && F3_RELIC[id][1] === kind ? F3_RELIC[id][2] : 0), 0);
function f3Nrg(k) {
  const t = S.trips && S.trips[k];
  if (t && t.nrgB != null) return { b: t.nrgB, ch: t.nrgCh | 0, n: null };
  const n = f3Call(() => fyC(k).nrg, 50), ch = f3Lvl('cheminee');
  return { b: n >= 70 ? 1 : n < 30 ? -1 : 0, ch, n: Math.round(n) };
}
const f3NrgRisk = N => (N.b > 0 ? 0.1 + 0.05 * N.ch : 0);
if (typeof xpRiskK === 'function') xpRiskK = (orig => function (k, c) {
  const r = orig.apply(this, arguments);
  try {
    if (r > 0 && k && c) {
      let m = 1 - f3RelicSum(c.terr, 'risk');
      const N = f3Nrg(k); m *= N.b > 0 ? 1 - f3NrgRisk(N) : N.b < 0 ? 1.1 : 1;
      if (m !== 1) return Math.max(0.03, Math.min(0.9, r * m));
    }
  } catch (e) {}
  return r;
})(xpRiskK);
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips && S.trips[k];
  let N = null; try { if (k && S.comps && S.comps[k] && !before) N = f3Nrg(k); } catch (e) {}
  const r = orig.apply(this, arguments);
  try { const t = S.trips[k]; if (N && t && t !== before && !t.tuto) { t.nrgB = N.b; t.nrgCh = N.ch; save(); } } catch (e) { console.error('foyer énergie', e); }
  return r;
})(startTrip);
let f3Msgs = [];
if (typeof collect === 'function') collect = (orig => function () {
  f3Msgs = [];
  try {
    const k = S.sel, t = S.trips && S.trips[k];
    if (t && t.done && !t.tuto && !t.f3n && Array.isArray(t.bag)) {
      t.f3n = 1;
      const tags = (t.dest && t.dest.tags && t.dest.tags.length) ? t.dest.tags : ['campagne'], one = () => f3Call(() => lootFor(tags, t.luck || 0, t.dest ? t.dest.name : '', 1, k)[0], null);
      if (t.nrgB > 0) { const b = one(); if (b) { t.bag.push(b); f3Msgs.push(`Bien reposé au départ : « ${b.name} » en plus !`); } }
      else if (t.nrgB < 0 && t.bag.length > 1) { const c = t.bag.filter(x => x && !x.special && !x.tresor && !x.mys && !x.qt).sort((a, b) => (a.rarity || 0) - (b.rarity || 0))[0]; if (c) { t.bag.splice(t.bag.indexOf(c), 1); f3Msgs.push('Parti fatigué : un objet de moins. Laissez-le se reposer au foyer avant le prochain départ.'); } }
      const terr = t.xpTerr || f3Call(() => xpTerrOf(t.dest), ''), p = f3RelicSum(terr, 'loot');
      if (p > 0 && (Math.random() < p || (window.__f3 && __f3.forceLoot))) { const b = one(); if (b) { t.bag.push(b); f3Msgs.push(`Relique exposée (${F3_TW[terr] || ''}) : « ${b.name} » en plus !`); } }
      if (f3Msgs.length) f3Msgs.k = k;
    }
  } catch (e) { console.error('foyer reliques/énergie', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  try { if (f3Msgs.length && h && h.comp === f3Msgs.k) { h.extra = (h.extra || []).concat(f3Msgs); f3Msgs = []; } } catch (e) {}
  return orig.apply(this, arguments);
})(showHaul);
// panneau de départ : ce que le foyer apporte VRAIMENT à ce voyage
const F3_TRIPNM = { mappemonde: 'Mappemonde', cartemur: 'Carte murale' };
function f3GoHTML(k, d) {
  const L = [], N = f3Nrg(k), nm = f3Call(() => CHARS[k].name, '');
  if (N.b > 0) L.push(`<span class="ok"><b>Énergie ${N.n}/100 : reposé</b> → +1 objet au retour, −${f3Pct(f3NrgRisk(N))} % de risques${N.ch ? ' (Cheminée)' : ''}</span>`);
  else if (N.b < 0) L.push(`<span class="ko"><b>Énergie ${N.n}/100 : fatigué</b> → 1 objet de moins. ${esc(nm)} devrait se reposer au foyer.</span>`);
  else L.push(`<span><b>Énergie ${N.n}/100</b> · à 70 ou plus : +1 objet et −${f3Pct(0.1 + 0.05 * N.ch)} % de risques</span>`);
  const seen = new Set(), items = [].concat(Object.values(f3State().d), Object.values(S.house || {}).map(v => v && v.item)).filter(Boolean);
  for (const it of items) { const e = f3Call(() => fyEffOf({ item: it }), null); if (e && e[0] === 'trip' && !seen.has(it.sub)) { seen.add(it.sub); L.push(`<span>${esc(F3_TRIPNM[it.sub] || it.name)} : −${f3Pct(e[1])} % de trajet</span>`); } }
  const E = f3Eff(); if (E.p) L.push(`<span>Foyer ${esc(E.nm.toLowerCase())} : +${f3Pct(E.p)} % de butin, −${f3Pct(E.p)} % de risques</span>`);
  const terr = f3Call(() => xpTerrOf(d), '');
  f3Relics().forEach(id => { if (F3_RELIC[id][0] === terr) L.push(`<span class="ok">${esc(f3RelicTxt(id))}</span>`); });
  return `<div class="f3-go" id="f3Go">${L.join('')}</div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel, d = typeof plan !== 'undefined' ? plan.dest : null;
    if (box && d && CHARS[k] && S.comps[k] && !S.trips[k] && !f3Call(() => tuOn(), false)) {
      const gb = box.querySelector('.gobar');
      if (gb) gb.insertAdjacentHTML('beforebegin', f3GoHTML(k, d)); else box.insertAdjacentHTML('beforeend', f3GoHTML(k, d));
    }
  } catch (e) { console.error('foyer départ', e); }
  return r;
})(renderVoyage);

// ---------------- style ----------------
(function f3CSS() {
  const st = document.createElement('style');
  st.textContent = `
.f3{position:relative;height:min(58vh,520px);min-height:340px;border-radius:20px;overflow:hidden;border:2.5px solid ${F3_L};background:#3a2a20;box-shadow:0 4px 0 rgba(74,53,40,.25);user-select:none;-webkit-user-select:none;margin-bottom:2px}
.f3-vp{position:absolute;inset:0;perspective:${F3_P}px;perspective-origin:50% 50%;overflow:hidden;touch-action:pan-y;cursor:grab}
.f3-vp:active{cursor:grabbing}
.f3-world{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
.f3-face{position:absolute;display:block}
.f3-wall{left:-${F3_R + 2}px;top:${F3_CEIL}px;width:${2 * F3_R + 4}px;height:${F3_HW}px;transform-style:preserve-3d}
.f3-tin.f3-wall-in{width:${2 * F3_R + 4}px;height:${F3_HW}px;
 background:linear-gradient(#8a5a3a,#8a5a3a) 0 ${F3_HW - 10}px/100% 10px no-repeat,
  linear-gradient(#a8754a,#a8754a) 0 268px/100% 7px no-repeat,
  repeating-linear-gradient(90deg,transparent 0 72px,rgba(91,70,54,.22) 72px 74px) 0 275px/100% ${F3_HW - 285}px no-repeat,
  linear-gradient(#cfe0c4,#bcd3b0) 0 275px/100% ${F3_HW - 275}px no-repeat,
  radial-gradient(circle at 22px 18px,#f2b4ae 2.6px,transparent 3.2px) 0 0/44px 40px,
  radial-gradient(circle at 0 38px,#b9d6a6 2px,transparent 2.6px) 0 0/44px 40px,
  repeating-linear-gradient(90deg,#fae9d6 0 22px,#f5dfca 22px 44px)}
.f3-svg{position:absolute;left:2px;top:0;width:600px;height:380px;overflow:visible}
.f3-sh{position:absolute;inset:0;pointer-events:none;
 background:linear-gradient(rgba(var(--tint),var(--nt)),rgba(var(--tint),var(--nt))),
  linear-gradient(90deg,rgba(50,28,15,.34),rgba(50,28,15,0) 16%,rgba(50,28,15,0) 84%,rgba(50,28,15,.34)),
  linear-gradient(rgba(50,28,15,.26),rgba(50,28,15,0) 22%,rgba(50,28,15,0) 80%,rgba(50,28,15,.2))}

.f3-tile{position:absolute;overflow:hidden;transform:translateZ(0)}
.f3-tin{position:absolute;width:${2 * F3_R}px;height:${2 * F3_R}px}
.f3-floor{left:-${F3_R}px;top:${F3_FLOOR - F3_R}px;width:${2 * F3_R}px;height:${2 * F3_R}px;transform-style:preserve-3d}
.f3-floor-in{background:repeating-linear-gradient(0deg,transparent 0 118px,rgba(91,60,34,.4) 118px 120px),
  repeating-linear-gradient(90deg,#d9a877 0 46px,#5b3f2a 46px 47.5px,#cf9b69 47.5px 94px,#5b3f2a 94px 95.5px,#dcb083 95.5px 142px,#5b3f2a 142px 143.5px)}
.f3-floor-in .f3-sh{background:linear-gradient(rgba(var(--tint),var(--nt)),rgba(var(--tint),var(--nt))),radial-gradient(circle at 50% 50%,rgba(50,28,15,0) 28%,rgba(50,28,15,.45) 74%)}
.f3-rugdef{position:absolute;left:180px;top:60px;width:240px;height:170px;border-radius:50%;background:radial-gradient(ellipse,#f6d2c4 0 34%,#e9a0a0 35% 38%,#f9e6d8 39% 56%,#9fd1d8 57% 62%,#f3c9b8 63%);box-shadow:0 0 0 3px ${F3_L},0 6px 18px rgba(40,20,10,.35)}
.f3-sun{position:absolute;left:150px;top:0;width:330px;height:420px;clip-path:polygon(18% 0,74% 0,100% 100%,36% 100%);background:linear-gradient(rgba(255,238,170,.62),rgba(255,238,170,0));mix-blend-mode:screen;pointer-events:none}
.f3-sun.eve{background:linear-gradient(rgba(255,190,120,.6),rgba(255,190,120,0));transform:skewX(-14deg)}
.f3-fireflo{position:absolute;right:-80px;top:180px;width:220px;height:240px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,160,70,.45),rgba(255,160,70,0));mix-blend-mode:screen;pointer-events:none;animation:f3Flick 2.4s ease-in-out infinite}
.f3-fireflo.big{width:300px;height:320px;top:140px;right:-110px}
.f3-ceil{left:-${F3_R}px;top:${F3_CEIL - F3_R}px;width:${2 * F3_R}px;height:${2 * F3_R}px;transform-style:preserve-3d}
.f3-ceil-in{background:repeating-linear-gradient(90deg,#f6e8d6 0 104px,#b98a5e 104px 106px,#a87a50 106px 120px,#8a5a3a 120px 122px)}
.f3-ceil-in .f3-sh{background:linear-gradient(rgba(var(--tint),calc(var(--nt) + .1)),rgba(var(--tint),calc(var(--nt) + .1))),radial-gradient(circle at 50% 50%,rgba(50,28,15,0) 20%,rgba(50,28,15,.55) 72%)}
.f3-lamp{position:absolute;left:260px;top:260px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#fff6d0 0 30%,#f6d36b 31% 44%,${F3_L} 45% 49%,rgba(255,230,160,.5) 50%,rgba(255,230,160,0) 70%)}
.f3-glow{position:absolute;width:140px;height:140px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,80,.55),rgba(255,170,80,0));mix-blend-mode:screen;pointer-events:none;animation:f3Flick 2.2s ease-in-out infinite}
.f3-glow-big{width:200px;height:200px}
.f3-green{position:absolute;width:200px;height:270px;background:radial-gradient(closest-side,rgba(190,240,170,.45),rgba(190,240,170,0));mix-blend-mode:screen;pointer-events:none}
.f3-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 50%,rgba(40,20,10,0) 55%,rgba(40,20,10,.42))}
.f3-ghost{position:absolute;font:700 11px/1.1 var(--display,inherit);color:#9a8b78;background:rgba(255,250,240,.7);padding:2px 6px;border-radius:8px;border:1px dashed #b9ad9a;white-space:nowrap}
.f3-z{position:absolute;display:flex;flex-direction:column;justify-content:space-between;padding:0;border:0;background:none;cursor:pointer;font:inherit;color:inherit}
.f3-zi{display:flex;flex-wrap:wrap;align-content:flex-start;gap:2px 3px;justify-content:center}
.f3-it{position:relative;width:34px;height:34px;display:inline-flex;filter:drop-shadow(0 2px 0 rgba(60,35,20,.35))}
.f3-it svg{width:100%;height:100%}
.f3-it.r3,.f3-it.r4{filter:drop-shadow(0 0 4px rgba(255,220,120,.95)) drop-shadow(0 2px 0 rgba(60,35,20,.35))}
.f3-it i{position:absolute;right:-5px;bottom:-4px;font:800 10px/1 var(--display,inherit);font-style:normal;background:#fffaf0;color:${F3_L};border:1.5px solid ${F3_L};border-radius:8px;padding:1px 3px}
.f3-sign{align-self:center;font:800 11.5px/1 var(--display,inherit);color:#fffaf0;background:#8a5a3a;border:2px solid ${F3_L};border-radius:8px;padding:3px 7px;white-space:nowrap;box-shadow:0 2px 0 rgba(60,35,20,.35)}
.f3-pantry .f3-zi{gap:30px 4px;padding-top:12px}.f3-pantry .f3-sign{position:absolute;left:50%;transform:translateX(-50%);bottom:-26px}
.f3-glass .f3-zi{gap:22px 6px;padding-top:14px}.f3-glass .f3-sign{margin-bottom:-26px}
.f3-crate .f3-zi{padding:0 6px;margin-top:8px}.f3-crate .f3-sign{margin-bottom:8px}
.f3-rack .f3-zi{flex-direction:column;flex-wrap:wrap;height:150px;align-items:center}.f3-rack .f3-it{width:40px;height:40px}.f3-rack .f3-sign{margin-bottom:20px}
.f3-z-expe .f3-zi{gap:30px 4px;padding-top:10px}
.f3-empty{font:700 11px var(--display,inherit);color:#9a8b78}
.f3-slot{position:absolute;padding:0;border:0;background:none;cursor:pointer;display:flex;align-items:flex-end;justify-content:center}
.f3-slot.edit:not(.full){border:2.5px dashed #fffaf0;border-radius:14px;background:rgba(91,70,54,.28);align-items:center;animation:f3Pulse 1.6s ease-in-out infinite}
.f3-slot.pick{background:rgba(242,193,78,.55)!important;border-color:#f2c14e!important}
.f3-slot.edit.full{outline:2.5px dashed #e5587f;outline-offset:2px;border-radius:12px}
.f3-plus{font:800 34px/1 var(--display,inherit);color:#fffaf0;font-style:normal;text-shadow:0 2px 0 rgba(60,35,20,.45)}
.f3-deco{width:100%;height:100%;display:flex;filter:drop-shadow(0 4px 3px rgba(40,20,10,.35))}
.f3-deco svg{width:100%;height:100%}
.f3-slot.k-r .f3-deco{filter:none}
.f3-x,.f3-star{position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:#e5587f;color:#fff;font:800 13px/24px var(--display,inherit);font-style:normal;border:2px solid ${F3_L}}
.f3-star{right:auto;left:-6px;top:-6px;background:#f2c14e;color:${F3_L};width:20px;height:20px;line-height:18px;font-size:12px}
.f3-pet{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;transition:transform 3s ease-in-out}
.f3-shadow{position:absolute;left:-34px;top:-12px;width:68px;height:24px;border-radius:50%;background:radial-gradient(closest-side,rgba(40,20,10,.45),rgba(40,20,10,0));transform:rotateX(90deg)}
.f3-bb{position:absolute;left:-48px;bottom:0;width:96px;height:126px;padding:0;border:0;background:none;cursor:pointer;transform-origin:50% 100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.f3-bb img{width:92px;height:100px;display:block;animation:f3Bob 2.6s ease-in-out infinite;transform-origin:50% 100%;filter:drop-shadow(0 3px 2px rgba(40,20,10,.3))}
.f3-pet.walk .f3-bb img{animation:f3Walk .45s ease-in-out infinite}
.f3-tag{display:inline-flex;align-items:center;gap:2px;font:800 10.5px/1 var(--display,inherit);background:#fffaf0;color:${F3_L};border:1.8px solid ${F3_L};border-radius:9px;padding:2px 5px 2px 3px;white-space:nowrap;margin-bottom:-2px}
.f3-tag .fwi{width:13px;height:13px}
.f3-hud{position:absolute;left:8px;right:8px;top:8px;display:flex;gap:8px;align-items:flex-start;pointer-events:none}
.f3-hud>*{pointer-events:auto}
.f3-cf{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;background:rgba(255,250,240,.93);border:2px solid ${F3_L};border-radius:14px;padding:6px 9px;box-shadow:0 3px 0 rgba(60,35,20,.3)}
.f3-cft{display:flex;align-items:center;gap:5px;font:800 14px/1 var(--display,inherit);color:${F3_L}}
.f3-cft svg{width:18px;height:18px;fill:#e5587f}
.f3-cft em{font-style:normal;margin-left:auto;background:#f2c14e;border:1.5px solid ${F3_L};border-radius:8px;padding:2px 7px;font-size:12px}
.f3-gauge{display:flex;align-items:center;gap:6px}
.f3-lv{display:flex;gap:2px}.f3-lv i{width:9px;height:9px;border-radius:50%;border:1.5px solid ${F3_L};background:#fff}.f3-lv i.on{background:#e5587f}
.f3-bar{flex:1;height:7px;border-radius:5px;background:#eadccb;border:1.5px solid ${F3_L};overflow:hidden}.f3-bar i{display:block;height:100%;background:linear-gradient(90deg,#f6c445,#e5587f)}
.f3-rel{display:block;font:800 11px/1.25 var(--display,inherit);color:#8a5a1a}
.f3-go{margin:6px 0;padding:7px 10px;border:2px solid #eadccb;border-radius:12px;background:#fffaf0;display:flex;flex-direction:column;gap:3px;font-size:12.5px;line-height:1.3;color:#5b4636}.f3-go b{font-family:var(--display,inherit)}.f3-go .ok{color:#2f7f5a}.f3-go .ko{color:#b0503a}
.f3-eff{font:700 11.5px/1.25 var(--display,inherit);color:#6a4f3c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.f3-nx{flex:none;font:800 10.5px/1 var(--display,inherit);color:#a0607a}
.f3-dec{flex:none;font:800 14px/1 var(--display,inherit);color:#fff;background:#e5587f;border:2.5px solid ${F3_L};border-radius:14px;padding:10px 12px;box-shadow:0 3px 0 ${F3_L};cursor:pointer}
.f3-dec.on{background:#3a8f5a}
.f3-foot{position:absolute;left:8px;right:8px;bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:6px;pointer-events:none}
.f3-hint{font:800 12.5px/1.2 var(--display,inherit);color:#fffaf0;background:rgba(60,35,20,.62);border-radius:12px;padding:5px 10px;transition:opacity .6s}
.f3-hint.seen{opacity:.55}
.f3.editing .f3-hint{background:#3a8f5a;opacity:1}
.f3-where{font:700 11px/1 var(--display,inherit);color:#fffaf0;background:rgba(60,35,20,.45);border-radius:10px;padding:4px 8px;white-space:nowrap}
.f3-pick{position:absolute;left:8px;right:8px;bottom:8px;max-height:62%;display:flex;flex-direction:column;background:#fffaf0;border:2.5px solid ${F3_L};border-radius:16px;box-shadow:0 6px 0 rgba(60,35,20,.3);overflow:hidden;z-index:2}
.f3-ph{display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;padding:8px 40px 6px 10px;border-bottom:2px solid #eadccb;position:relative}
.f3-ph b{font:800 14px/1.2 var(--display,inherit)}.f3-ph small{flex-basis:100%;font-size:12px;color:#7a6250}
.f3-pc{position:absolute;right:6px;top:6px;width:30px;height:30px;border-radius:50%;border:2px solid ${F3_L};background:#fff;font-weight:800;cursor:pointer}
.f3-pl{overflow-y:auto;display:flex;flex-direction:column}
.f3-pi{display:flex;align-items:center;gap:8px;padding:6px 10px;border:0;border-bottom:1px solid #eadccb;background:none;text-align:left;cursor:pointer;font:inherit}
.f3-pi:active{background:#fff3c4}
.f3-pii{width:40px;height:40px;flex:none;display:flex}.f3-pii svg{width:100%;height:100%}
.f3-pit{flex:1;display:flex;flex-direction:column;min-width:0}.f3-pit b{font:800 13.5px/1.15 var(--display,inherit)}.f3-pit small{font-size:11.5px;color:#7a6250}
.f3-pi em{font:800 14px var(--display,inherit);font-style:normal;color:#fff;background:#e5587f;border:2px solid ${F3_L};border-radius:10px;padding:2px 7px}
.f3-pe{padding:10px;font-size:13px;color:#7a6250;margin:0}
.f3-tw{animation:f3Tw 2.4s ease-in-out infinite}
.f3-fire{transform-origin:300px 372px;animation:f3Fire 1.1s ease-in-out infinite alternate}
.f3-flash{animation:f3Flash 1.4s ease-out}
.f3-on .fw-head{padding:7px 10px;margin-bottom:6px}.f3-on .fw-head>b{font-size:14.5px}.f3-on .fw-head>span:not(.fw-last){display:none}
.f3-on .fw-scene{height:46px}.f3-on .fw-scene img.fw-pet{width:34px!important;height:34px!important}.f3-on .fw-scene .fwi.big{width:22px;height:22px}
.f3-on .fw-pt{padding:4px 7px 6px}.f3-on .fw-line{font-size:11.5px}
.f3-on .pg-card{padding:6px 8px;gap:8px}.f3-on .pg-card .pg-eff{font-size:12px;margin:1px 0}.f3-on .pg-pic svg{width:30px;height:30px}
@keyframes f3Bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px) scale(1.01,.99)}}
@keyframes f3Walk{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)}}
@keyframes f3Flick{0%,100%{opacity:.85}40%{opacity:1}70%{opacity:.7}}
@keyframes f3Fire{0%{transform:scale(1,1)}100%{transform:scale(1.06,.92)}}
@keyframes f3Tw{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes f3Pulse{0%,100%{background-color:rgba(91,70,54,.22)}50%{background-color:rgba(242,193,78,.45)}}
@keyframes f3Flash{0%{box-shadow:0 0 0 0 rgba(229,88,127,.9)}100%{box-shadow:0 0 0 14px rgba(229,88,127,0)}}
@media (prefers-reduced-motion:reduce){.f3-pet{transition:none}.f3-bb img,.f3-fire,.f3-glow,.f3-fireflo,.f3-tw,.f3-slot.edit{animation:none!important}}
`;
  document.head.appendChild(st);
})();

window.__f3 = {
  state: f3State, comfort: f3Comfort, eff: f3Eff, effTxt: f3EffTxt, place: f3Place, take: f3Take, autoPlace: f3AutoPlace, bestSlot: f3BestSlot, stock: f3Stock, isDeco: f3IsDeco,
  SLOTS: F3_SLOTS, yaw: () => f3Yaw, setYaw: y => { f3Yaw = y; f3Apply(); }, pitch: () => f3Pitch, edit: v => { f3Edit = !!v; f3Pick = null; f3Refresh(); }, pick: id => { f3Pick = id; f3Refresh(); },
  risk: (k, terr) => xpRiskK(k, { terr: terr || 'foret' }, false, 0.35), forceP: null, forceLoot: false,
  relics: () => f3Relics(), relicTxt: f3RelicTxt, nrg: k => f3Nrg(k), goHTML: (k, d) => f3GoHTML(k, d), pts: f3Pts, trophy: f3Trophy,
  T: () => ({ craft, RECIPES, CM_R: typeof CM_R !== 'undefined' ? CM_R : {}, usesOf: it => GAME.usesOf(it), FY_EFF, fyMods, plan, openSheet, ING }),
};

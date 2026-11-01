// ================= COMMERCE QUI FABRIQUE (v20) =================
// Le commerce fabrique PUIS vend :
// - chaque type de commerce a SA ligne de recettes (CM_LINES), préparées en 3 à 10 secondes sur 3 places (cuisine ou atelier) ;
// - environ 1 fois sur 5, un DÉFI RAPIDE facultatif (jauge à arrêter dans la zone verte) donne 2 étoiles de plus ;
// - les produits prêts vont sur le comptoir (dans le sac, marqués it.mk) ; les clients de la scène les achètent d'un toucher ;
//   le surplus se vend au marché mondial (catégorie « Objets fabriqués ») ;
// - commandes spéciales : 3 au maximum, niveaux Facile / Normal / Défi, récompense montrée en image, à accepter ou refuser ;
// - choix du commerce : ligne de produits, ingrédients clés et leurs lieux, AVANTAGE UNIQUE (CM_ADV, tous branchés) ;
// - menu : page « Comment ça marche ».
// Économie : prix = coût des ingrédients au marché (≈ 6 pièces, 15 s'il vient de loin) + un petit gain de travail.
// Familles (agent FAMILLES) : famOf, FAM, famUseLine appelés via typeof, avec repli.
// État : S.shop.cm = { sl: [3 places], unl: [recettes débloquées], buy: [clients acheteurs], nb, eggDay, sold }.

// ---------------- les lignes de recettes ----------------
// [id, nom, catégorie, sous-type, rareté, look, couleur, ingrédients, secondes, déblocage] ; déblocage : 0, réputation (nombre) ou 'x' (récompense)
const CM_RAW = {
  boulangerie: [
    ['bo_baguette', 'Baguette dorée', 'n', 'pain', 1, null, '#e3b06b', [['farine', 2]], 3, 0],
    ['bo_croissant', 'Croissant au beurre', 'n', 'pain', 1, null, '#e9a84b', [['farine', 1], ['sucre', 1]], 4, 0],
    ['bo_chausson', 'Chausson aux pommes', 'n', 'pomme', 1, null, '#e5a04b', [['farine', 1], ['pomme', 1]], 5, 0],
    ['bo_tarte', 'Tarte des bois', 'n', 'fruit', 1, null, '#9a6fd6', [['farine', 1], ['fruit', 2]], 6, 0],
    ['bo_brioche', 'Brioche tressée', 'n', 'pain', 2, null, '#e3a04b', [['farine', 2], ['sucre', 1]], 7, 50],
    ['bo_voyage', 'Gâteau du voyageur', 'n', 'sucre', 2, null, '#f39ab0', [['farine', 1], ['sucre', 1], ['far', 1]], 8, 0],
    ['bo_piece', 'Pièce montée des grands jours', 'n', 'sucre', 3, null, '#f6e3c4', [['farine', 2], ['sucre', 2], ['fruit', 1]], 10, 'x'],
  ],
  cafe: [
    ['ca_the', 'Thé fumant', 'n', 'boisson', 1, null, '#c9d48a', [['feuille', 1]], 3, 0],
    ['ca_choco', 'Chocolat chaud', 'n', 'boisson', 1, null, '#8a5a3a', [['boisson', 1], ['sucre', 1]], 4, 0],
    ['ca_citron', 'Citronnade', 'n', 'boisson', 1, null, '#f2e27a', [['agrume', 1], ['sucre', 1]], 4, 0],
    ['ca_jus', 'Jus des bois', 'n', 'boisson', 1, null, '#7a5fb8', [['fruit', 2]], 5, 0],
    ['ca_creme', 'Café crème', 'n', 'boisson', 2, null, '#c99a6a', [['boisson', 2], ['sucre', 1]], 6, 50],
    ['ca_monde', 'Thé des quatre coins', 'n', 'boisson', 2, null, '#58b8a0', [['feuille', 1], ['far', 1]], 7, 0],
    ['ca_viennois', 'Chocolat viennois', 'n', 'boisson', 3, null, '#6b4a32', [['boisson', 1], ['sucre', 2], ['pain', 1]], 9, 'x'],
  ],
  restaurant: [
    ['re_soupe', 'Soupe du potager', 'n', 'plat', 1, null, '#8fbf5a', [['legume', 2]], 4, 0],
    ['re_croque', 'Croque-monsieur doré', 'n', 'plat', 1, null, '#e3b06b', [['pain', 1], ['fromage', 1]], 4, 0],
    ['re_poisson', 'Poisson grillé', 'n', 'plat', 1, null, '#f08a7a', [['mer', 2]], 5, 0],
    ['re_gratin', 'Gratin fondant', 'n', 'plat', 1, null, '#f2c14e', [['legume', 1], ['fromage', 1]], 6, 0],
    ['re_fondue', 'Fondue des copains', 'n', 'plat', 2, null, '#f2d06b', [['fromage', 2], ['pain', 1]], 8, 50],
    ['re_monde', 'Plat du bout du monde', 'n', 'plat', 2, null, '#d9733f', [['legume', 1], ['far', 1]], 8, 0],
    ['re_festin', 'Grand festin', 'n', 'plat', 3, null, '#d9604f', [['mer', 1], ['fromage', 1], ['legume', 1], ['pain', 1]], 10, 'x'],
  ],
  fleuriste: [
    ['fl_champs', 'Bouquet des champs', 'd', 'plante', 1, null, '#f39ab0', [['fleur', 2]], 3, 0],
    ['fl_pot', 'Petite plante en pot', 'd', 'plante', 1, null, '#6fae7d', [['graine', 2]], 4, 0],
    ['fl_couronne', 'Couronne fleurie', 'v', 'tete', 1, 'fleurs', '#f6c2cf', [['fleur', 2], ['feuille', 1]], 5, 0],
    ['fl_herbier', 'Herbier du jardin', 'd', 'herbier', 1, null, '#8fbf6a', [['feuille', 2], ['papier', 1]], 6, 0],
    ['fl_mariee', 'Bouquet de mariée', 'd', 'plante', 2, null, '#fbf8f0', [['fleur', 3], ['tissu', 1]], 7, 50],
    ['fl_exo', 'Bouquet exotique', 'd', 'plante', 2, null, '#f08a3a', [['fleur', 1], ['far', 1]], 7, 0],
    ['fl_arche', 'Arche fleurie', 'd', 'plante', 3, null, '#e07a9a', [['fleur', 3], ['bois', 1], ['feuille', 1]], 10, 'x'],
  ],
  mode: [
    ['mo_echarpe', 'Écharpe douce', 'v', 'cou', 1, 'echarpe', '#a9cf8e', [['laine', 2]], 4, 0],
    ['mo_chaussettes', 'Chaussettes rayées', 'v', 'pieds', 1, 'chaussettes', '#f39ab0', [['tissu', 2]], 4, 0],
    ['mo_bonnet', 'Bonnet à pompon', 'v', 'tete', 1, 'bonnet', '#e5584f', [['laine', 1], ['tissu', 1]], 5, 0],
    ['mo_tshirt', 'T-shirt du voyageur', 'v', 'haut', 1, 'tshirt', '#bfe1f2', [['tissu', 2]], 5, 0],
    ['mo_cape', 'Cape à plumes', 'v', 'dos', 2, 'cape', '#7a4fa0', [['tissu', 2], ['plume', 1]], 7, 50],
    ['mo_foulard', 'Foulard du bout du monde', 'v', 'cou', 2, 'foulard', '#f6c445', [['tissu', 1], ['far', 1]], 7, 0],
    ['mo_gala', 'Couronne de gala', 'v', 'tete', 3, 'couronne', '#f2c14e', [['tissu', 1], ['metal', 1], ['cristal', 1]], 10, 'x'],
  ],
  animalerie: [
    ['an_graines', 'Friandises aux graines', 'n', 'plat', 1, null, '#c99a6a', [['graine', 2]], 3, 0],
    ['an_fruits', 'Brochette de fruits', 'n', 'fruit', 1, null, '#e5584f', [['fruit', 2]], 3, 0],
    ['an_biscuit', 'Biscuits au poisson', 'n', 'mer', 1, null, '#f08a7a', [['mer', 1], ['farine', 1]], 4, 0],
    ['an_jouet', 'Jouet en bois', 'd', 'statue', 1, null, '#c99a6a', [['bois', 2]], 5, 0],
    ['an_panier', 'Panier douillet', 'd', 'tapis', 1, null, '#f3aec1', [['laine', 1], ['tissu', 1]], 6, 0],
    ['an_nid', 'Œuf du nid douillet', 'o', 'oeuf', 2, null, '#fff3e2', [['graine', 2], ['plume', 2], ['laine', 1]], 10, 50, { egg: 1 }],
    ['an_exo', 'Friandise exotique', 'n', 'sucre', 2, null, '#58b8a0', [['sucre', 1], ['far', 1]], 6, 0],
    ['an_royal', 'Grand panier royal', 'd', 'tapis', 3, null, '#9a6fd6', [['tissu', 2], ['laine', 2], ['plume', 1]], 10, 'x'],
  ],
  glacier: [
    ['gl_citron', 'Sorbet citron', 'n', 'glace', 1, null, '#f2e27a', [['agrume', 1], ['sucre', 1]], 3, 0],
    ['gl_bois', 'Glace des bois', 'n', 'glace', 1, null, '#b88ad9', [['fruit', 1], ['sucre', 1]], 4, 0],
    ['gl_cornet', 'Cornet gourmand', 'n', 'glace', 1, null, '#f6a6b8', [['glace', 1], ['farine', 1]], 4, 0],
    ['gl_shake', 'Milk-shake', 'n', 'glace', 1, null, '#f3aec1', [['glace', 1], ['boisson', 1]], 5, 0],
    ['gl_coupe', 'Coupe glacée', 'n', 'glace', 2, null, '#f08aa6', [['glace', 2], ['fruit', 1]], 8, 50],
    ['gl_monde', 'Glace du bout du monde', 'n', 'glace', 2, null, '#58b8a0', [['glace', 1], ['far', 1]], 7, 0],
    ['gl_bombe', 'Bombe glacée', 'n', 'glace', 3, null, '#d9604f', [['glace', 2], ['agrume', 1], ['fruit', 1]], 10, 'x'],
  ],
  librairie: [
    ['li_marque', 'Marque-page fleuri', 'm', 'papier', 1, null, '#f6c2cf', [['papier', 1], ['fleur', 1]], 3, 0],
    ['li_carnet', 'Carnet de voyage', 'm', 'papier', 1, null, '#c9604f', [['papier', 1], ['tissu', 1]], 4, 0],
    ['li_carte', 'Carte du quartier', 'd', 'mappemonde', 1, null, '#c9a97a', [['papier', 2]], 4, 0],
    ['li_herbier', 'Herbier pressé', 'd', 'herbier', 1, null, '#9cc38a', [['papier', 1], ['feuille', 2]], 5, 0],
    ['li_globe', 'Globe de voyageur', 'd', 'mappemonde', 2, null, '#9fd1e8', [['papier', 2], ['bois', 1]], 8, 50],
    ['li_loin', 'Carte des terres lointaines', 'd', 'mappemonde', 2, null, '#e3b07a', [['papier', 1], ['far', 1]], 7, 0],
    ['li_atlas', 'Atlas enluminé', 'd', 'mappemonde', 3, null, '#f2c14e', [['papier', 3], ['lumiere', 1]], 10, 'x'],
  ],
  epicerie: [
    ['ep_plateau', 'Plateau de fromages', 'n', 'fromage', 1, null, '#f2d06b', [['fromage', 2]], 3, 0],
    ['ep_jus', 'Jus d’agrumes pressé', 'n', 'agrume', 1, null, '#f2a93b', [['agrume', 2]], 3, 0],
    ['ep_confiture', 'Confiture maison', 'n', 'fruit', 1, null, '#7a5fb8', [['fruit', 2], ['sucre', 1]], 4, 0],
    ['ep_panier', 'Panier du marché', 'n', 'legume', 1, null, '#8fbf5a', [['legume', 1], ['fruit', 1]], 4, 0],
    ['ep_gourmand', 'Panier gourmand', 'n', 'plat', 2, null, '#d9a35f', [['fromage', 1], ['pain', 1], ['fruit', 1]], 7, 50],
    ['ep_epices', 'Bocal d’épices lointaines', 'n', 'sucre', 2, null, '#d9733f', [['verre', 1], ['far', 1]], 6, 0],
    ['ep_coffret', 'Coffret du terroir', 'n', 'plat', 3, null, '#a8b45a', [['fromage', 1], ['fruit', 1], ['sucre', 1], ['far', 1]], 10, 'x'],
  ],
  brocante: [
    ['br_cadre', 'Cadre en bois', 'd', 'herbier', 1, null, '#c99a6a', [['bois', 2]], 3, 0],
    ['br_bocal', 'Bocal à souvenirs', 'd', 'bocal', 1, null, '#f6cdb8', [['verre', 1], ['coquillage', 1]], 4, 0],
    ['br_lampe', 'Lampe restaurée', 'd', 'lampe', 1, null, '#f6e08a', [['metal', 1], ['verre', 1]], 5, 0],
    ['br_statue', 'Statuette sculptée', 'd', 'statue', 1, null, '#c9b8a6', [['bois', 1], ['pierre', 1]], 6, 0],
    ['br_lanterne', 'Lanterne de verre', 'd', 'lanterne', 2, null, '#bfe3f6', [['verre', 2], ['metal', 1]], 8, 50],
    ['br_monde', 'Souvenir du bout du monde', 'd', 'statue', 2, null, '#e3b07a', [['bois', 1], ['far', 1]], 7, 0],
    ['br_mobile', 'Mobile de coquillages', 'd', 'bocal', 3, null, '#f6cdb8', [['coquillage', 3], ['verre', 1], ['metal', 1]], 10, 'x'],
  ],
};
const CM_LINES = {}, CM_R = {};
for (const [shop, list] of Object.entries(CM_RAW)) CM_LINES[shop] = list.map(([id, name, cat, sub, rar, look, col, ing, t, u, ex]) => (CM_R[id] = Object.assign({ id, shop, def: [name, cat, sub, rar, look, col], ing, t, rep: typeof u === 'number' ? u : 0, x: u === 'x' }, ex || {})));
// l'animation de préparation de chaque commerce
const CM_ANIM = { boulangerie: 'oven', cafe: 'cup', restaurant: 'pot', fleuriste: 'scis', mode: 'scis', animalerie: 'bowl', glacier: 'churn', librairie: 'quill', epicerie: 'pot', brocante: 'hammer' };
// l'avantage unique de chaque commerce (tous branchés plus bas ou dans 18_boutique.js)
const CM_ADV = {
  boulangerie: ['Four rapide', 'Préparations 30 % plus courtes'],
  cafe: ['Salon bondé', 'Les clients du comptoir viennent 2 fois plus souvent'],
  restaurant: ['Chef inspiré', 'Défi rapide 2 fois plus souvent : plus d’étoiles'],
  fleuriste: ['Charme fleuri', '+30 % de réputation (commandes et ventes)'],
  mode: ['Cousu main', 'Chaque vêtement fabriqué ici donne un bonus de chance en voyage quand il est porté'],
  animalerie: ['Ami des bêtes', 'Œufs 20 % moins chers et croisements 2 fois plus rapides'],
  glacier: ['Pourboires', '+5 pièces par client du comptoir, +10 par commande'],
  librairie: ['Bouche-à-oreille', 'Les commandes offrent 2 fois plus souvent une recette'],
  epicerie: ['Réseau lointain', 'Commandes de spécialités lointaines dès le début, mieux payées'],
  brocante: ['Œil de chineur', 'Souvenirs du monde demandés plus tôt, et bien payés'],
};
const CM_MAXO = 3; // commandes spéciales au maximum
const cmOwn = id => { try { return bqOwned().includes(id); } catch (e) { return false; } };
const cmT = () => { try { return bqType(); } catch (e) { return null; } };
// le restaurant ne prend plus une 4e commande (3 au maximum) : son avantage devient le défi plus fréquent
try { const R = BQS('restaurant'); if (R) { R.slot = 0; R.perks = ['Plats cuisinés, fromages et légumes : +35 % de pièces', CM_ADV.restaurant[1]]; } } catch (e) {}
try { const A = BQS('animalerie'); if (A) A.perks = ['Œufs plus fréquents et 20 % moins chers au magasin', 'Croisements 2 fois plus rapides à la nurserie']; } catch (e) {}
try { const B = BQS('boulangerie'); if (B) B.perks = [B.perks[0], CM_ADV.boulangerie[1], B.perks[1]]; const C = BQS('cafe'); if (C) C.perks.push(CM_ADV.cafe[1]); const M = BQS('mode'); if (M) M.perks.push(CM_ADV.mode[1]); const G = BQS('glacier'); if (G) G.perks = [G.perks[0], CM_ADV.glacier[1]]; } catch (e) {}

// ---------------- état ----------------
function cmState() {
  const s = bqState();
  if (!s.cm || typeof s.cm !== 'object') s.cm = {};
  const c = s.cm;
  if (!Array.isArray(c.sl) || c.sl.length !== 3) c.sl = [null, null, null];
  c.sl = c.sl.map(x => (x && CM_R[x.rid] ? x : null));
  if (!Array.isArray(c.unl)) c.unl = [];
  if (!Array.isArray(c.buy)) c.buy = [];
  c.buy = c.buy.filter(b => b && BQC(b.cid) && CM_R[b.rid]);
  for (const k of ['nb', 'eggDay', 'sold']) if (typeof c[k] !== 'number' || !isFinite(c[k])) c[k] = 0;
  return c;
}
const cmHome = () => { try { const h = bqHome(); return h ? h.id : null; } catch (e) { return null; } };
const cmIsFar = it => !!(it && it.rid && typeof RG_RES !== 'undefined' && RG_RES[it.rid] && RG_RES[it.rid].region !== cmHome());
const cmWorn = () => { try { return bqWorn(); } catch (e) { return new Set(); } };
function cmPool(key) {
  const worn = cmWorn();
  return S.inv.filter(it => it && !it.mk && !it.tresor && !worn.has(it.id) && (key === 'far' ? cmIsFar(it) && it.cat !== 'v' : ING[key] && ING[key][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n')));
}
const cmHave = key => cmPool(key).length;
const cmCanIng = R => R.ing.every(([k, n]) => cmHave(k) >= n);
const cmUnlocked = R => !!R && (R.x ? cmState().unl.includes(R.id) : R.rep ? bqState().rep >= R.rep || cmState().unl.includes(R.id) : true);
const cmCost = R => R.ing.reduce((a, [k, n]) => a + n * (k === 'far' ? 15 : 6), 0);
const cmR5 = n => Math.max(5, Math.round(n / 5) * 5);
// prix de vente : ingrédients au prix du marché + un gain de travail raisonnable (pas de boucle d'argent)
const cmPrice = (R, st) => cmR5(cmCost(R) * (1 + 0.15 * (st - 1)) + 2 + 3 * st);
const cmDur = R => Math.max(3, Math.min(10, R.t * (cmT() && cmT().id === 'boulangerie' ? 0.7 : 1)));
const cmDefiP = () => (cmT() && cmT().id === 'restaurant' ? 0.4 : 0.2);
const cmItem = R => bqItemOf(R.def);
const cmProducts = shop => S.inv.filter(it => it && it.mk && (!shop || it.mk.shop === shop) && !cmWorn().has(it.id));

// ---------------- icônes ----------------
const CM_GLOBE = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#9fd1e8" stroke="#5b4636" stroke-width="2"/><path d="M9 15 c5 -3 7 2 10 0 s5 -5 10 -1 M8 24 c5 1 6 -2 10 -1 s6 4 12 1" stroke="#5fa274" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M28 6 l6 -2 -2 6" fill="none" stroke="#d9604f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CM_COIN = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="14" fill="#e0a52a" stroke="#5b4636" stroke-width="2"/><circle cx="20" cy="19" r="14" fill="#f6c445" stroke="#5b4636" stroke-width="2"/><circle cx="20" cy="19" r="9" fill="none" stroke="#fff3c4" stroke-width="2"/><path d="M17 15 h6 M17 23 h6 M20 13 v12" stroke="#b07a1a" stroke-width="2" stroke-linecap="round"/></svg>';
const CM_SCROLL = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 9 L14 6 L26 10 L35 7 V31 L26 34 L14 30 L5 33Z" fill="#efe2c4" stroke="#5b4636" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 26 q6 -10 12 -4 q4 4 8 -6" fill="none" stroke="#c9604f" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M27 13 l4 4 M31 13 l-4 4" stroke="#c9604f" stroke-width="2" stroke-linecap="round"/></svg>';
const CM_LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="10" rx="2.5" fill="#cfc5b4" stroke="#5b4636" stroke-width="2"/><path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 V10.5" stroke="#5b4636" stroke-width="2.2" fill="none"/></svg>';
const cmStars = (n, max = 3) => `<span class="cm-st" aria-label="${n} étoile${n > 1 ? 's' : ''}">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
function cmIcon(R, uid) { try { return R.egg ? bqEggSVG(null, uid || 'cme' + R.id) : itemIcon(cmItem(R)); } catch (e) { return ''; } }
function cmIngIcon(k) { if (k === 'far') return CM_GLOBE; try { return itemIcon(bqSampleIng(k)); } catch (e) { return ''; } }
const cmIngName = k => k === 'far' ? 'Ingrédient venu de loin' : ING[k] ? ING[k][1] : k;
// l'animation de préparation (marmite qui fume, four, ciseaux…)
function cmAnimSVG(kind) {
  const L = '#5b4636', sw = `stroke="${L}" stroke-width="2" stroke-linejoin="round"`;
  const steam = `<g class="cm-steam"><path d="M14 10 q-3 -4 0 -8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M20 9 q3 -4 0 -8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M26 10 q-3 -4 0 -8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`;
  const k = {
    pot: `${steam}<path d="M6 16 H34 L31 34 H9Z" fill="#7f8c99" ${sw}/><rect x="4" y="13" width="32" height="5" rx="2" fill="#9aa8b4" ${sw}/><path d="M4 20 H1 M36 20 H39" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/><path d="M10 37 q3 -4 6 0 q3 -4 6 0 q3 -4 6 0" fill="#f2a05a" class="cm-fire"/>`,
    oven: `<rect x="4" y="6" width="32" height="30" rx="4" fill="#c9734a" ${sw}/><rect x="9" y="14" width="22" height="16" rx="3" fill="#3b2f2a" ${sw}/><rect x="11" y="16" width="18" height="12" rx="2" fill="#f2a05a" class="cm-glow"/><circle cx="12" cy="10" r="1.6" fill="${L}"/><circle cx="18" cy="10" r="1.6" fill="${L}"/>`,
    cup: `${steam}<path d="M8 16 H30 V28 a8 8 0 0 1 -8 8 H16 a8 8 0 0 1 -8 -8Z" fill="#fff8ea" ${sw}/><path d="M30 19 h3 a4 4 0 0 1 0 8 h-3" fill="none" stroke="${L}" stroke-width="2"/><rect x="10" y="18" width="18" height="4" fill="#8a5a3a"/>`,
    scis: `<g class="cm-snipA"><path d="M20 20 L36 6" stroke="#9aa8b4" stroke-width="3.4" stroke-linecap="round"/><circle cx="12" cy="28" r="5" fill="none" stroke="#d9604f" stroke-width="3"/><path d="M15 25 L20 20" stroke="#d9604f" stroke-width="3"/></g><g class="cm-snipB"><path d="M20 20 L36 34" stroke="#9aa8b4" stroke-width="3.4" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="none" stroke="#d9604f" stroke-width="3"/><path d="M15 15 L20 20" stroke="#d9604f" stroke-width="3"/></g>`,
    bowl: `<g class="cm-bounce"><circle cx="14" cy="13" r="3" fill="#c99a6a" ${sw}/><circle cx="22" cy="10" r="3" fill="#e5584f" ${sw}/><circle cx="28" cy="14" r="3" fill="#c99a6a" ${sw}/></g><path d="M5 20 H35 L31 34 H9Z" fill="#3faf9a" ${sw}/><path d="M12 26 h16" stroke="#fff" stroke-width="2" opacity=".6"/>`,
    churn: `<path d="M8 18 H32 L28 36 H12Z" fill="#e6f8f2" ${sw}/><g class="cm-spin" style="transform-origin:20px 14px"><path d="M20 4 V24 M12 14 H28" stroke="#58b8a0" stroke-width="3" stroke-linecap="round"/></g><circle cx="20" cy="27" r="5" fill="#f6a6b8" ${sw}/>`,
    quill: `<rect x="4" y="22" width="32" height="14" rx="2" fill="#fff8ea" ${sw}/><path d="M9 28 h14 M9 32 h10" stroke="#c9a97a" stroke-width="1.6"/><g class="cm-write"><path d="M24 30 L36 4 C40 10 34 20 26 28Z" fill="#fbf8f0" ${sw}/></g>`,
    hammer: `<rect x="4" y="30" width="32" height="6" rx="2" fill="#a87a50" ${sw}/><g class="cm-hit" style="transform-origin:30px 30px"><path d="M30 30 L14 12" stroke="#a87a50" stroke-width="3.4" stroke-linecap="round"/><rect x="6" y="6" width="14" height="8" rx="2" fill="#9aa8b4" ${sw} transform="rotate(45 13 10)"/></g>`,
  }[kind] || '';
  return `<svg class="cm-anim" viewBox="0 0 40 40" aria-hidden="true">${k}</svg>`;
}

// ---------------- préparer ----------------
let cmForceDefi = false;
function cmStart(rid) {
  const T = cmT(), R = CM_R[rid], c = cmState(); if (!T || !R || R.shop !== T.id) return;
  if (!cmUnlocked(R)) { toast(R.x ? 'Recette exclusive : elle s’obtient en récompense d’une commande Défi.' : `Recette débloquée à ${R.rep} points de réputation.`); return; }
  const i = c.sl.findIndex(x => !x); if (i < 0) { toast('Les 3 places sont occupées : attendez qu’un produit soit prêt.'); return; }
  if (R.egg && c.eggDay === dayKey()) { toast('Un seul œuf du nid douillet par jour : revenez demain !'); return; }
  if (!cmCanIng(R)) { const m = R.ing.find(([k, n]) => cmHave(k) < n); toast(`Il manque : ${cmIngName(m[0]).toLowerCase()} (${cmHave(m[0])}/${m[1]}).`); return; }
  let rare = false;
  for (const [k, n] of R.ing) {
    const take = cmPool(k).sort((a, b) => (a.rid ? 1 : 0) - (b.rid ? 1 : 0) || (a.rarity || 0) - (b.rarity || 0)).slice(0, n);
    take.forEach(it => { if ((it.rarity || 0) >= 2) rare = true; S.inv.splice(S.inv.indexOf(it), 1); });
  }
  if (R.egg) c.eggDay = dayKey();
  const now = Date.now(), dur = cmDur(R) * 1000;
  c.sl[i] = { rid, shop: T.id, t0: now, end: now + dur, dur, st: rare ? 2 : 1, ch: cmForceDefi || Math.random() < cmDefiP() ? 1 : 0, chd: 0 };
  cmForceDefi = false;
  save(); cmPaint();
}
// un produit prêt : il va sur le comptoir (dans le sac, marqué it.mk)
function cmFinish(i) {
  const c = cmState(), x = c.sl[i]; if (!x) return null;
  const R = CM_R[x.rid], T = BQS(x.shop); c.sl[i] = null;
  if (R.egg) {
    try { addEgg({ sp: null, rarity: 1, from: { how: 'quete', place: T.short }, hatchMs: 3 * 60e3 }); } catch (e) {}
    toast('Un œuf est sorti du nid douillet ! Il attend à la nurserie.');
    return null;
  }
  const st = Math.max(1, Math.min(3, x.st));
  const it = makeItem(R.def, 0, `Fabriqué : ${T ? T.short : 'commerce'}`, [], { fixed: R.def[3] });
  it.mk = { shop: x.shop, rid: R.id, st, p: cmPrice(R, st) };
  if (x.shop === 'mode' && it.cat === 'v') it.mkb = 1; // avantage de la mode : cousu main
  S.inv.push(it); S.dex[it.name] = true;
  S.stats.crafted = (S.stats.crafted || 0) + 1;
  try { bump('craft'); } catch (e) {}
  setTimeout(() => { try { bqCheckReady('craft'); } catch (e) {} }, 30); // (pas de carte « nouvel objet » : aucune fenêtre spontanée)
  return it;
}
function cmTickKitchen() {
  const c = cmState(), now = Date.now(); let done = 0;
  c.sl.forEach((x, i) => { if (x && !x.pause && now >= x.end) { cmFinish(i); done++; } });
  if (done) save();
  return done;
}

// ---------------- défi rapide : une jauge qui défile, à arrêter dans la zone verte ----------------
let cmGame = null;
function cmDefiOpen(i) {
  const c = cmState(), x = c.sl[i]; if (!x || !x.ch || x.chd) return;
  x.pause = Date.now();
  const z = 15 + Math.random() * 55, w = 20;
  cmGame = { i, z, w };
  const R = CM_R[x.rid];
  showModal(`<div class="cm-defi"><span class="cm-dk">Défi rapide</span><span class="cm-dprod">${cmIcon(R, 'cmdp')}</span><h2>Touchez quand le curseur est dans le vert !</h2><p>Réussi : <b>+2 étoiles</b>, le produit se vendra plus cher.</p>
    <div class="cm-gauge" id="cmGauge"><i class="cm-zone" style="left:${z}%;width:${w}%"></i><i class="cm-cur" id="cmCur"></i></div>
    <button class="btn gold cm-stop" data-cmstop="1">Maintenant !</button><button class="btn cream sm" data-cmskip="1">Passer</button></div>`);
  try { $('modal').dataset.cm = '1'; } catch (e) {}
}
function cmDefiEnd(ok) {
  const G = cmGame; cmGame = null; if (!G) return;
  const c = cmState(), x = c.sl[G.i];
  if (x) {
    if (x.pause) { x.end += Date.now() - x.pause; delete x.pause; }
    x.chd = ok ? 1 : -1; if (ok) x.st = Math.min(3, x.st + 2);
  }
  save();
  const box = document.querySelector('#modal .cm-defi');
  if (box) box.insertAdjacentHTML('beforeend', `<p class="cm-dres ${ok ? 'ok' : 'ko'}">${ok ? `Bravo ! ${cmStars(3)}` : 'Raté… le produit garde ses étoiles.'}</p>`);
  setTimeout(() => { const m = $('modal'); if (m && m.dataset.cm) { m.hidden = true; delete m.dataset.cm; } cmPaint(); }, ok ? 900 : 700);
}
function cmDefiStop() {
  const G = cmGame; if (!G) return;
  const g = $('cmGauge'), cur = $('cmCur'); if (!g || !cur) return cmDefiEnd(false);
  const a = g.getBoundingClientRect(), b = cur.getBoundingClientRect(), p = ((b.left + b.width / 2) - a.left) / a.width * 100;
  cur.style.animationPlayState = 'paused';
  cmDefiEnd(p >= G.z - 1 && p <= G.z + G.w + 1);
}

// ---------------- clients acheteurs (la scène) ----------------
const cmBuyGap = () => Math.round((12 + Math.random() * 18) * 1000 * (cmT() && cmT().id === 'cafe' ? 0.5 : 1));
function cmTickBuyers() {
  const T = cmT(); if (!T) return false;
  const c = cmState(), now = Date.now(); let ch = false;
  // un acheteur repart si plus rien ne lui plaît, ou après 4 minutes
  const avail = cmProducts(T.id);
  const n0 = c.buy.length; c.buy = c.buy.filter(b => b.shop === T.id && now - b.at < 4 * 60e3 && avail.some(it => it.mk.rid === b.rid)); if (c.buy.length !== n0) ch = true;
  if (!avail.length || c.buy.length >= 2) return ch;
  if (!c.nb) c.nb = now + 1500;
  if (now < c.nb) return ch;
  const s = bqState(), busy = new Set([...s.orders.map(o => o.client), ...c.buy.map(b => b.cid)]);
  const ids = (BQ_SHOP_CLIENTS[T.id] || []).filter(id => BQC(id) && !busy.has(id));
  const pool = ids.length ? ids : BQ_CLIENTS.filter(x => !busy.has(x.id)).map(x => x.id); if (!pool.length) return ch;
  const cid = pick(pool), cl = BQC(cid);
  // il achète ce qu'il aime parmi ce qui est prêt
  const rids = [...new Set(avail.map(it => it.mk.rid))].filter(r => !c.buy.some(b => b.rid === r)) ; if (!rids.length) return ch;
  const rid = bqPick(rids, r => (CM_R[r].ing.some(([k]) => (cl.likes || []).includes(k)) ? 3 : 1));
  c.buy.push({ id: uidGen(), cid, rid, shop: T.id, at: now });
  c.nb = now + cmBuyGap();
  return true;
}
function cmSell(bid, el) {
  const c = cmState(), b = c.buy.find(x => x.id === bid); if (!b) return;
  const it = cmProducts(b.shop).filter(x => x.mk.rid === b.rid).sort((a, z) => z.mk.st - a.mk.st)[0];
  c.buy = c.buy.filter(x => x !== b);
  if (!it) { save(); cmPaint(); return; }
  S.inv.splice(S.inv.indexOf(it), 1);
  const T = BQS(b.shop), s = bqState(), tip = T && T.id === 'glacier' ? 5 : 0, pay = it.mk.p + tip;
  const rep = Math.max(1, Math.round(it.mk.st * (T && T.rep ? T.rep : 1)));
  const lv0 = s.lvl;
  gainCoins(pay); s.rep += rep; s.earned += pay; c.sold++; s.lvl = bqLevelOf(s.rep);
  try { b2Heart(b.cid, 1); } catch (e) {}
  c.nb = Date.now() + cmBuyGap();
  save();
  try { bqHearts(el); } catch (e) {}
  toast(`${BQC(b.cid).name} achète « ${it.name} » : +${pay} pièces${tip ? ' (pourboire compris)' : ''}, +${rep} réputation.`);
  if (s.lvl > lv0) try { bqLevelUp(s.lvl); } catch (e) {}
  renderTop(); cmPaint(true);
}

// ---------------- commandes spéciales : niveaux et récompenses ----------------
let cmNextTier = null;
const CM_TIER = { f: ['Facile', '#3a8f5a', '#e3f6ec'], n: ['Normal', '#2f6fb0', '#e1effa'], d: ['Défi', '#b0482f', '#ffe4d8'] };
function cmRareDef(T) {
  const pool = []; (T.cats || []).filter(c => LOOT[c]).forEach(c => LOOT[c].forEach(d => { if (d[3] === 2 && d[1] !== 't' && d[1] !== 'o') pool.push({ c, d }); }));
  return bqPick(pool);
}
function cmFarRes() {
  if (typeof REGIONS === 'undefined') return null;
  const h = cmHome(), pool = []; REGIONS.forEach(R => { if (R.id !== h && R.id !== 'grand_large') R.res.forEach(x => { if (x.rar <= 1) pool.push(x); }); });
  return bqPick(pool);
}
function cmRewardFor(tier, T, c) {
  const L = bqState().lvl, out = [];
  const excl = (CM_LINES[T.id] || []).filter(R => R.x && !cmState().unl.includes(R.id));
  const cloth = BQ_CAT.filter(a => a.k === 'v' && a.def[3] >= (tier === 'd' ? 3 : 2)).map(a => a.def);
  if (tier === 'f') return { k: 'coins' };
  if (tier === 'n') { out.push([{ k: 'coins' }, 2], [{ k: 'rumor' }, 1]); if (cloth.length) out.push([{ k: 'cloth', def: pick(cloth.filter(d => d[3] <= 2)) || pick(cloth) }, 1]); }
  else {
    out.push([{ k: 'egg', sp: pick(bqSpIds()), variant: Math.random() < 0.5 }, 3], [{ k: 'rumor' }, 2], [{ k: 'coins' }, 1]);
    if (excl.length) out.push([{ k: 'rec', rid: excl[0].id }, 3]);
    if (cloth.length) out.push([{ k: 'cloth', def: pick(cloth) }, 2]);
  }
  void L; void c;
  return bqPick(out, x => x[1])[0];
}
function cmApplyTier(o, tier) {
  const T = BQS(o.shop) || cmT(); if (!T) return o;
  o.tier = tier;
  if (tier === 'f') { o.req = o.req.slice(0, 1); if (o.req[0] && o.req[0].n > 2) o.req[0].n = 2; o.coins = bqRound5(o.coins * 0.8); o.rep = Math.max(5, Math.round(o.rep * 0.8)); }
  if (tier === 'd') {
    const opts = [];
    const own = (CM_LINES[T.id] || []).filter(R => !R.egg && cmUnlocked(R));
    if (own.length) { const R = pick(own); opts.push({ k: 'mk', rid: R.id, st: 3, n: 1, name: R.def[0] + ' 3 étoiles', def: R.def }); }
    const rd = cmRareDef(T); if (rd) opts.push({ k: 'item', name: rd.d[0], def: rd.d, n: 1, src: { cat: rd.c } });
    const fx = cmFarRes(); if (fx) opts.push({ k: 'reg', rid: fx.id, name: fx.name, n: 1, src: { region: fx.region } });
    const r = pick(opts); if (r) o.req = [r];
    o.coins = bqRound5(o.coins * 2.2); o.rep = Math.round(o.rep * 2); delete o.bonus; o.deadline = 0;
  }
  o.rw = cmRewardFor(tier, T, BQC(o.client));
  if (o.rw.k === 'coins' && tier !== 'f') o.coins = bqRound5(o.coins * 1.3);
  return o;
}
if (typeof bqNewOrder === 'function') bqNewOrder = (orig => function (forceEasy) {
  const o = orig.apply(this, arguments); if (!o) return o;
  try {
    if (forceEasy) { o.tier = 'f'; o.rw = { k: 'coins' }; return o; } // tutoriel et premières commandes : simples, déjà acceptées
    const r = Math.random(), tier = cmNextTier || (r < 0.4 ? 'f' : r < 0.75 ? 'n' : 'd'); cmNextTier = null;
    cmApplyTier(o, tier); o.pend = 1;
  } catch (e) { console.error('commerce', e); }
  return o;
})(bqNewOrder);
// une demande « produit du commerce, N étoiles »
if (typeof bqMatch === 'function') bqMatch = (orig => function (r, it) { if (r && r.k === 'mk') return !!(it && it.mk && it.mk.rid === r.rid && it.mk.st >= (r.st || 1)); return orig.apply(this, arguments); })(bqMatch);
if (typeof bqReqIcon === 'function') bqReqIcon = (orig => function (r) { if (r && r.k === 'mk' && CM_R[r.rid]) return cmIcon(CM_R[r.rid]); return orig.apply(this, arguments); })(bqReqIcon);
if (typeof bqReqWhere === 'function') bqReqWhere = (orig => function (r) { if (r && r.k === 'mk') return 'À préparer en cuisine, défi rapide réussi'; return orig.apply(this, arguments); })(bqReqWhere);
if (typeof bqRarity === 'function') bqRarity = (orig => function (r) { if (r && r.k === 'mk') return 3; return orig.apply(this, arguments); })(bqRarity);
if (typeof bqReqValue === 'function') bqReqValue = (orig => function (r) { if (r && r.k === 'mk' && CM_R[r.rid]) return cmPrice(CM_R[r.rid], 3); return orig.apply(this, arguments); })(bqReqValue);
if (typeof bqGo === 'function') bqGo = (orig => function (id) {
  const o = bqState().orders.find(x => x.id === id);
  try { if (o) { const al = bqAllocate(o), r = o.req.find((q, i) => al[i].have < q.n); if (r && r.k === 'mk') { const k = document.getElementById('cmKitchen'); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' }); toast(`Préparez « ${CM_R[r.rid].def[0]} » et réussissez le défi rapide (3 étoiles).`); return; } } } catch (e) {}
  return orig.apply(this, arguments);
})(bqGo);
// 3 commandes au maximum
if (typeof bqTickOrders === 'function') bqTickOrders = (orig => function () {
  let ch = orig.apply(this, arguments);
  try { const s = bqState(); while (s.orders.length > CM_MAXO) { const i = s.orders.map((o, j) => [o, j]).filter(([o]) => !o.tuto).sort((a, b) => b[0].seq - a[0].seq)[0]; if (!i) break; s.orders.splice(i[1], 1); ch = true; } } catch (e) {}
  return ch;
})(bqTickOrders);
// la récompense est donnée à la livraison
function cmGrant(o, c) {
  const rw = o.rw; if (!rw) return '';
  try {
    if (rw.k === 'egg') {
      let genes = null; if (rw.variant && typeof randomGenes === 'function') { try { genes = randomGenes(rw.sp, 2.5); } catch (e) {} }
      addEgg({ sp: rw.sp, genes, rarity: rw.variant ? 3 : 2, from: { how: 'quete', place: c.name }, hatchMs: 5 * 60e3 });
      const e = S.eggs[S.eggs.length - 1]; if (e) e.known = true;
      return `un œuf de ${bqSpName(rw.sp).toLowerCase()}${rw.variant ? ' (variante rare)' : ''}`;
    }
    if (rw.k === 'rumor') {
      let r = null; const h = bqHome(); if (typeof tzGiveRumor === 'function') r = tzGiveRumor(null, c.name, h ? { lon: h.anchor[0], lat: h.anchor[1] } : null);
      if (r) { setTimeout(() => { try { tzRumorToast(c.name + ' vous confie un lieu secret', r); } catch (e) {} }, 1400); return 'un lieu secret'; }
      gainCoins(60); return '60 pièces';
    }
    if (rw.k === 'rec') { const st = cmState(); if (!st.unl.includes(rw.rid)) st.unl.push(rw.rid); return `la recette exclusive « ${CM_R[rw.rid].def[0]} »`; }
    if (rw.k === 'cloth') { const it = makeItem(rw.def, 0, `Cadeau de ${c.name}`, [], { fixed: Math.max(2, rw.def[3]) }); S.inv.push(it); S.dex[it.name] = true; return `« ${it.name} »`; }
  } catch (e) { console.error('commerce récompense', e); }
  return '';
}
if (typeof bqDeliver === 'function') bqDeliver = (orig => function (id) {
  const s = bqState(), o = s.orders.find(x => x.id === id), c = o && BQC(o.client);
  const r = orig.apply(this, arguments);
  try { if (o && !s.orders.includes(o)) { const t = cmGrant(o, c); if (t) { save(); setTimeout(() => toast(`Récompense de ${c.name} : ${t} !`), 1100); } } } catch (e) {}
  return r;
})(bqDeliver);
function cmAccept(id) { const o = bqState().orders.find(x => x.id === id); if (!o) return; delete o.pend; save(); cmPaint(true); }
function cmRwHTML(o) {
  const rw = o.rw || { k: 'coins' };
  let ic = CM_COIN, tx = 'Pièces et réputation';
  if (rw.k === 'egg') { ic = bqEggSVG(rw.sp, 'cmrw' + o.id); tx = `Œuf de ${bqSpName(rw.sp).toLowerCase()}${rw.variant ? ' · variante rare' : ''}`; }
  else if (rw.k === 'rumor') { ic = CM_SCROLL; tx = 'Un lieu secret'; }
  else if (rw.k === 'rec' && CM_R[rw.rid]) { ic = cmIcon(CM_R[rw.rid]) + '<i class="cm-recb">Recette</i>'; tx = `Recette exclusive : ${CM_R[rw.rid].def[0]}`; }
  else if (rw.k === 'cloth') { ic = itemIcon(bqItemOf(rw.def)); tx = `Vêtement ${RARITY[rw.def[3]].toLowerCase()} : ${rw.def[0]}`; }
  return `<div class="cm-rw"><span class="cm-rwi k-${rw.k}">${ic}</span><span class="cm-rwx"><b>${esc(tx)}</b><span>${coins(o.coins)} · ${BQ_STAR}+${o.rep}</span></span></div>`;
}
function cmOrderCard(o) {
  const c = BQC(o.client), al = bqAllocate(o), ready = !o.pend && al.every((a, i) => a.have >= o.req[i].n), tier = CM_TIER[o.tier || 'n'];
  const miss = o.req.find((r, i) => al[i].have < r.n);
  const big = o.req.map((r, i) => { const ok = al[i].have >= r.n; return `<span class="b2ri${ok ? ' ok' : ''}${i === 0 ? ' first' : ''}" style="--rc:${RARC[bqRarity(r)]}" title="${esc(bqReqLabel(r))}">${bqReqIcon(r)}<i>${ok ? '✓' : `${al[i].have}/${r.n}`}</i>${r.k === 'mk' ? `<em class="cm-req3">${cmStars(3)}</em>` : ''}</span>`; }).join('');
  const goLbl = !miss ? '' : miss.k === 'mk' ? 'Préparer' : miss.k === 'egg' || miss.k === 'comp' ? 'Au marché' : miss.k === 'bait' ? 'Nurserie' : miss.k === 'craft' && canCraft(RECIPES.find(x => x.id === miss.id) || { ing: [], coins: 0 }) ? 'Fabriquer' : 'Partir chercher';
  const acts = o.pend ? `<button class="btn green" data-cmacc="${o.id}">Accepter</button><button class="btn cream sm" data-brefuse="${o.id}">Refuser</button>`
    : ready ? `<button class="btn green" data-bdeliver="${o.id}">Livrer</button>` : `<button class="btn gold sm" data-bgo="${o.id}">${goLbl}</button>`;
  return `<article class="b2card bq-order cm-o${ready ? ' ready' : ''}${o.pend ? ' pend' : ''}" data-oid="${o.id}" style="--tc:${tier[1]};--tb:${tier[2]}">
    <div class="b2ch"><img src="${clientURI(c, ready ? 'joie' : 'content')}" alt=""><b>${esc(c.name)}</b><span class="cm-tier">${tier[0]}</span>${o.deadline ? `<span class="bq-dl" data-bqcd="${o.deadline}">${fmtDur(o.deadline - Date.now())}</span>` : ''}${o.pend ? '' : `<button class="b2x" data-brefuse="${o.id}" aria-label="Refuser la commande de ${esc(c.name)}">×</button>`}</div>
    <div class="b2big">${big}</div>
    <p class="b2lbl${miss ? '' : ' ok'}">${miss ? esc(bqReqLabel(miss)) : 'Tout est prêt !'}</p>
    ${cmRwHTML(o)}
    <div class="b2act">${acts}</div>
  </article>`;
}

// ---------------- le comptoir ----------------
function cmLayerHTML() {
  const s = bqState(), c = cmState(), T = cmT();
  const os = s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).slice(0, 2);
  let h = os.map((o, i) => {
    const cl = BQC(o.client), ready = !o.pend && bqReady(o), al = bqAllocate(o), miss = o.req.find((r, j) => al[j].have < r.n);
    const bub = ready ? '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#5fbf7f" stroke="#3a8f5a" stroke-width="1.6"/><path d="M5.6 10.4 L8.6 13.2 L14.4 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : bqReqIcon(miss || o.req[0]);
    return `<button class="b2c ord${ready ? ' ready' : ''}" data-b2ord="${o.id}" style="left:${B2_QO[i]}%" aria-label="${esc(cl.name)} : commande spéciale"><span class="b2b">${bub}</span><img src="${clientURI(cl, ready ? 'joie' : 'content')}" alt=""></button>`;
  }).join('');
  // les produits prêts, posés sur le comptoir
  if (T) {
    const prods = cmProducts(T.id), by = {};
    prods.forEach(it => { (by[it.mk.rid] = by[it.mk.rid] || []).push(it); });
    h += Object.entries(by).slice(0, 4).map(([rid, l], i) => `<span class="cm-onc" style="left:${33 + i * 8.5}%">${cmIcon(CM_R[rid], 'cmo' + rid)}${l.length > 1 ? `<i>${l.length}</i>` : ''}</span>`).join('');
  }
  // les clients qui achètent : bulle avec l'image du produit, un toucher pour vendre
  h += c.buy.filter(b => !T || b.shop === T.id).map((b, i) => {
    const cl = BQC(b.cid), R = CM_R[b.rid], best = cmProducts(b.shop).filter(x => x.mk.rid === b.rid).sort((a, z) => z.mk.st - a.mk.st)[0];
    return `<button class="b2c cm-buy" data-cmsell="${b.id}" style="left:${[61, 80][i]}%" aria-label="${esc(cl.name)} veut « ${esc(R.def[0])} » : toucher pour vendre"><span class="b2b cm-bb">${cmIcon(R, 'cmb' + b.id)}${best ? `<em>${best.mk.p + (b.shop === 'glacier' ? 5 : 0)}</em>` : ''}</span><img src="${clientURI(cl, 'joie')}" alt=""></button>`;
  }).join('');
  return h;
}
function cmKitchenHTML() {
  const T = cmT(), c = cmState(), now = Date.now(), lab = T && ['fleuriste', 'mode', 'librairie', 'brocante'].includes(T.id) ? 'L’atelier' : 'La cuisine';
  const slots = c.sl.map((x, i) => {
    if (!x) return `<div class="cm-slot empty"><span class="cm-plus">+</span><small>Place libre</small></div>`;
    const R = CM_R[x.rid], left = Math.max(0, x.end - now), el = x.dur - left;
    const defi = x.ch && !x.chd ? `<button class="btn gold sm cm-defib" data-cmdefi="${i}">Défi !</button>` : x.chd === 1 ? `<span class="cm-ok">Défi réussi</span>` : '';
    return `<div class="cm-slot on${x.pause ? ' paused' : ''}"><span class="cm-an">${cmAnimSVG(CM_ANIM[x.shop] || 'pot')}</span><span class="cm-sp">${cmIcon(R, 'cms' + i)}</span>${cmStars(x.st)}<span class="cm-bar"><i style="animation-duration:${(x.dur / 1000).toFixed(2)}s;animation-delay:-${(el / 1000).toFixed(2)}s"></i></span><small data-cmleft="${x.end}">${Math.ceil(left / 1000)} s</small>${defi}</div>`;
  }).join('');
  return `<section class="cm-kit" id="cmKitchen"><h3 class="bq-h3">${lab} <small>3 places · 3 à 10 secondes</small></h3><div class="cm-slots">${slots}</div></section>`;
}
function cmRecipesHTML() {
  const T = cmT(); if (!T) return '';
  const c = cmState(), free = c.sl.some(x => !x);
  const cards = (CM_LINES[T.id] || []).map(R => {
    const un = cmUnlocked(R), ok = un && cmCanIng(R) && free && !(R.egg && c.eggDay === dayKey());
    const ings = R.ing.map(([k, n]) => { const h = cmHave(k); return `<span class="cm-ing${h >= n ? ' ok' : ''}" title="${esc(cmIngName(k))}">${cmIngIcon(k)}<i>${Math.min(h, n)}/${n}</i></span>`; }).join('');
    const price = R.egg ? `<span class="cm-pr">Œuf · 1 par jour</span>` : `<span class="cm-pr">${coins(cmPrice(R, 1))}<small> → ${cmPrice(R, 3)} ${cmStars(3)}</small></span>`;
    const lock = R.x ? 'Récompense d’une commande Défi' : `Réputation ${R.rep}`;
    const far = R.ing.some(([k]) => k === 'far');
    return `<div class="cm-r${un ? '' : ' locked'}${ok ? ' can' : ''}"><span class="cm-rp">${cmIcon(R, 'cmr' + R.id)}<i class="cm-rt">${cmDur(R)} s</i>${far ? '<i class="cm-far">De loin</i>' : ''}</span><b>${esc(R.def[0])}</b><span class="cm-ings">${ings}</span>${price}${un ? `<button class="btn ${ok ? 'green' : 'cream'} sm" data-cmprep="${R.id}" ${ok ? '' : 'aria-disabled="true"'}>Préparer</button>` : `<span class="cm-lock">${CM_LOCK}${esc(lock)}</span>`}</div>`;
  }).join('');
  const surplus = cmProducts(T.id).length;
  return `<section class="cm-recs"><h3 class="bq-h3">Recettes ${(typeof famOf === 'function' && typeof FAM !== 'undefined') ? '' : ''}<small>ingrédients possédés / demandés · prix de vente</small></h3><div class="cm-rgrid">${cards}</div>
    ${surplus ? `<div class="cm-surplus"><span>${surplus} produit${surplus > 1 ? 's' : ''} sur le comptoir</span><button class="btn cream sm" data-cmmk="1">Surplus : vendre au marché mondial</button></div>` : ''}</section>`;
}
function cmOrdersHTML() {
  const s = bqState(), now = Date.now();
  let h = `<section class="cm-ords"><h3 class="bq-h3">Commandes spéciales <small>${s.orders.length}/${CM_MAXO}</small></h3><div class="b2cards">${s.orders.slice().sort((a, b) => (a.pend ? 1 : 0) - (b.pend ? 1 : 0) || bqReady(b) - bqReady(a) || a.seq - b.seq).map(cmOrderCard).join('')}`;
  if (s.orders.length < CM_MAXO) h += `<div class="b2card b2wait"><svg viewBox="0 0 30 30">${BQ_ICONS.comptoir}</svg><span>Prochaine commande</span><b data-bqcd="${s.next}">${fmtDur(s.next - now)}</b></div>`;
  return h + `</div></section>`;
}
function cmComptoir(box) {
  const s = bqState(); bqTickOrders(); try { b2(); } catch (e) {} cmState(); cmTickKitchen(); cmTickBuyers();
  const T = cmT(), tuto = typeof tutoActive === 'function' && tutoActive();
  let h = bqShopsBar() + `<div class="b2scene" id="b2scene"><div class="b2bg">${b2SVG()}</div><div class="b2layer" id="cmLayer">${cmLayerHTML()}</div></div>`;
  if (T && CM_ADV[T.id]) h += `<p class="cm-adv"><b>${esc(CM_ADV[T.id][0])}</b> ${esc(CM_ADV[T.id][1])}</p>`;
  const kit = T ? `<div id="cmKit">${cmKitchenHTML()}${cmRecipesHTML()}</div>` : '';
  h += tuto ? cmOrdersHTML() + kit : kit + cmOrdersHTML();
  try { h += b2FidHTML(); } catch (e) {}
  h += bqRepHTML();
  box.innerHTML = h;
  void s;
}
if (typeof renderComptoir === 'function') renderComptoir = cmComptoir;
const cmOnComptoir = () => { try { return tab === 'boutique' && bView === 'comptoir' && !!document.getElementById('cmKitchen'); } catch (e) { return false; } };
// mise à jour légère (sans tout redessiner) ; full : tout le panneau, en gardant le défilement
function cmPaint(full) {
  if (!cmOnComptoir() && !(full && tab === 'boutique')) { try { renderNav(); } catch (e) {} return; }
  const b = $('panelBody'), top = b ? b.scrollTop : 0;
  if (full) { renderPanel(); if (b) b.scrollTop = top; return; }
  const k = document.getElementById('cmKit'), l = document.getElementById('cmLayer');
  if (k) k.innerHTML = cmKitchenHTML() + cmRecipesHTML();
  if (l) l.innerHTML = cmLayerHTML();
  if (b) b.scrollTop = top;
}
// horloge : les préparations et les clients acheteurs
setInterval(() => {
  try {
    const d = cmTickKitchen(), bch = cmTickBuyers();
    if (d || bch) { save(); cmPaint(); }
    else document.querySelectorAll('[data-cmleft]').forEach(e => { e.textContent = Math.max(0, Math.ceil((+e.dataset.cmleft - Date.now()) / 1000)) + ' s'; });
  } catch (e) { console.error('commerce', e); }
}, 500);

// ---------------- économie : produits fabriqués ----------------
// valeur au marché ≈ 70 % du prix au comptoir (les clients paient mieux) ; catégorie « Objets fabriqués »
if (typeof value === 'function') value = (orig => function (it) { if (it && it.mk && it.mk.p) return Math.max(3, Math.round(it.mk.p * 0.7)); return orig.apply(this, arguments); })(value);
if (typeof mkCatOf === 'function') mkCatOf = (orig => function (it) { if (it && it.mk) return 'craft'; return orig.apply(this, arguments); })(mkCatOf);
try { if (typeof MK_CATS !== 'undefined' && MK_CATS[3]) MK_CATS[3][1] = 'Objets fabriqués'; } catch (e) {}

// ---------------- avantages uniques branchés ----------------
// animalerie : croisements 2 fois plus rapides
if (typeof nsStartCross === 'function') nsStartCross = (orig => function () {
  const r = orig.apply(this, arguments);
  try { const N = nsState(); if (r && N.cross && cmOwn('animalerie') && !N.cross.cm) { N.cross.ready = N.cross.start + Math.round((N.cross.ready - N.cross.start) / 2); N.cross.cm = 1; save(); toast(`Ami des bêtes (animalerie) : l’œuf arrive dans ${fmtDur(N.cross.ready - Date.now())} !`); } } catch (e) {}
  return r;
})(nsStartCross);
// mode : vêtement cousu main porté → plus de chance en voyage (0,3 par pièce, 0,9 au plus)
if (typeof GAME !== 'undefined') GAME.on('trip:start', e => {
  try { const k = e && e.who, t = e && e.trip; if (!k || !t || t.cmMode) return; const o = S.outfits && S.outfits[k]; if (!o || !o.worn) return;
    const n = Object.values(o.worn).filter(id => { const it = id && S.inv.find(x => x.id === id); return it && it.mkb; }).length;
    if (n) { t.luck = (t.luck || 0) + Math.min(0.9, 0.3 * n); t.cmMode = n; save(); } } catch (er) {}
});
if (typeof cpItemEffects === 'function') cpItemEffects = (orig => function (it) { const out = orig.apply(this, arguments); try { if (it && it.mkb) out.push({ ico: 'chance', txt: 'Cousu main : + de chance en voyage', kind: 'mk' }); } catch (e) {} return out; })(cpItemEffects);

// ---------------- choix du commerce : ligne, ingrédients, lieux, avantage ----------------
function cmShopKeys(T) { const ks = new Set(); (CM_LINES[T.id] || []).forEach(R => R.ing.forEach(([k]) => ks.add(k))); return [...ks]; }
function cmPlaceName(c) { try { return POI_CATS[c] ? POI_CATS[c][0] : c; } catch (e) { return c; } }
if (typeof bqChooseRender === 'function') bqChooseRender = function () {
  const C = bqCh; if (!C) return;
  const owned = bqOwned(), slot = bqNextSlot(), cost = C.mode === 'buy' && slot ? slot.cost : 0;
  const advBox = T => `<div class="cm-advbox"><span>${cmAnimSVG(CM_ANIM[T.id])}</span><div><b>${esc(CM_ADV[T.id][0])}</b><small>${esc(CM_ADV[T.id][1])}</small></div></div>`;
  if (C.pick) {
    const T = BQS(C.pick), line = CM_LINES[T.id] || [];
    const prods = line.map(R => `<li class="${R.x || R.rep ? 'later' : ''}"><span class="bqc-si">${cmIcon(R, 'cmc' + R.id)}</span><b>${esc(R.def[0])}</b>${R.x ? '<i>Exclusif</i>' : R.rep ? `<i>Réput. ${R.rep}</i>` : ''}</li>`).join('');
    const ings = cmShopKeys(T).map(k => `<li><span class="bqc-si">${cmIngIcon(k)}</span><b>${esc(cmIngName(k))}</b></li>`).join('');
    const where = (T.cats || []).map(c => `<i>${esc(cmPlaceName(c))}</i>`).join('') + '<i>Régions lointaines</i>';
    showModal(`<div class="bqc bqc-one"><div class="bqc-big">${bqFacadeSVG(T, 'bqcbig')}</div><span class="bqc-kick">${C.mode === 'first' ? 'Votre premier commerce' : C.mode === 'buy' ? 'Nouveau commerce' : 'Votre spécialité'}</span><h2>${esc(T.name)}</h2>
      ${advBox(T)}
      <h3>Ce que vous fabriquerez</h3><ul class="bqc-stars cm-line">${prods}</ul>
      <h3>Ingrédients clés</h3><ul class="bqc-stars cm-line">${ings}</ul>
      <h3>Où les trouver</h3><p class="bqc-uses">${where}</p>
      <div class="bqc-acts"><button class="btn cream" data-bqcback="1">Voir les autres</button><button class="btn green" data-bqcopen="${T.id}" ${cost && S.coins < cost ? 'disabled' : ''}>${cost ? `Ouvrir · ${coins(cost)}` : 'Ouvrir ce commerce'}</button></div>
      ${cost && S.coins < cost ? `<p class="small">Il vous manque ${cost - S.coins} pièces.</p>` : ''}</div>`);
    const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0;
    return;
  }
  const list = BQ_SHOPS.filter(T => !owned.includes(T.id));
  const head = C.mode === 'first' ? `<span class="bqc-kick">Dernière étape</span><h2>Quel commerce ouvrez-vous ?</h2><p class="bqc-ph">Vous y fabriquerez des produits avec ce que vos compagnons rapportent, puis vous les vendrez. D’autres commerces s’ouvriront avec la réputation.</p>`
    : C.mode === 'buy' ? `<span class="bqc-kick">Votre réputation grandit</span><h2>Ouvrir un nouveau commerce</h2><p class="bqc-ph">Coût : ${coins(cost)}.</p>`
    : `<span class="bqc-kick">Nouveau</span><h2>Choisissez votre commerce</h2>`;
  showModal(`<div class="bqc">${head}<div class="bqc-grid cm-cgrid">${list.map(T => `<button class="bqc-card cm-cc" data-bqcpick="${T.id}" style="--aw:${T.aw}"><span class="bqc-fac">${bqFacadeSVG(T, 'g' + T.id)}</span><b>${esc(T.short)}</b><span class="cm-cprods">${(CM_LINES[T.id] || []).filter(R => !R.x && !R.rep).slice(0, 4).map(R => `<i>${cmIcon(R, 'cmq' + R.id)}</i>`).join('')}</span><span class="cm-cadv">${esc(CM_ADV[T.id][0])}</span></button>`).join('')}</div>${C.mode !== 'first' ? '<button class="btn cream" data-bqcclose="1">Plus tard</button>' : ''}</div>`);
  const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0;
};

// ---------------- « Comment ça marche » (menu) ----------------
const CM_FAM0 = [['nourriture', 'Nourriture', '#e5584f', '🍎', 'nourrir'], ['materiaux', 'Matériaux', '#a87a50', '🪵', 'fabriquer'], ['vetements', 'Vêtements', '#9a6fd6', '👕', 'porter'], ['jardin', 'Jardin', '#5fa274', '🌱', 'semer'], ['equipement', 'Équipement', '#2f6fb0', '🧭', 'équiper'], ['nature', 'Nature', '#e3a04b', '🐚', 'collectionner'], ['tresors', 'Trésors', '#d99a25', '💎', 'vendre']];
function cmFams() {
  return CM_FAM0.map(([id, nom, col, ic, verb]) => {
    let f = null; try { f = typeof FAM !== 'undefined' && FAM ? FAM[id] : null; } catch (e) {}
    const icon = f ? (f.icone || f['icône'] || f.icon || f.ico || ic) : ic;
    return { id, nom: f ? (f.nom || f.name || nom) : nom, col: f ? (f.couleur || f.color || col) : col, icon: String(icon), verb };
  });
}
const cmFamIco = f => f.icon.trim().startsWith('<') ? f.icon : esc(f.icon);
function cmHowHTML() {
  const F = cmFams(), me = (() => { try { return `<img src="${portraitURI(S.sel)}" alt="">`; } catch (e) { return ''; } })();
  const step = (n, art, t, sub) => `<li class="cm-hs"><span class="cm-hn">${n}</span><span class="cm-ha">${art}</span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</li>`;
  const fams = `<span class="cm-hf">${F.map(f => `<i style="--fc:${f.col}" title="${esc(f.nom)}">${cmFamIco(f)}</i>`).join('')}</span>`;
  const uses = `<span class="cm-hu">${F.map(f => `<i style="--fc:${f.col}"><u>${cmFamIco(f)}</u>${esc(f.verb)}</i>`).join('')}</span>`;
  return `<div class="cm-how"><span class="bqc-kick">Le carnet en un coup d’œil</span><h2>Comment ça marche</h2><ol class="cm-hsteps">
    ${step(1, `<span class="cm-hpic">${me}${CM_GLOBE}</span>`, 'Voyager', 'Choisissez un lieu, votre compagnon part')}
    ${step(2, fams, 'Rapporter des objets', '7 familles, chacune son usage')}
    ${step(3, uses, 'S’en servir', '')}
    ${step(4, `<span class="cm-hpic">${cmAnimSVG('pot')}${CM_COIN}</span>`, 'Fabriquer et vendre', 'Votre commerce, ses clients, ses commandes')}
    ${step(5, `<span class="cm-hpic">${me}<b class="cm-hheart">♥</b>${CM_COIN}</span>`, 'Familiers plus forts, pièces', 'Bonheur, œufs, nouvelles recettes')}
    ${step(6, `<span class="cm-hpic">${CM_GLOBE}${CM_SCROLL}</span>`, 'Voyager plus loin', 'Lieux secrets, ingrédients lointains')}
  </ol><button class="btn green" data-closemodal="1">J’ai compris</button></div>`;
}
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const F = cmFams();
    const row = `<section class="msec"><header><h3>Comment ça marche</h3></header><div class="mrow"><span class="mri cm-mri">${cmFamIco(F[0])}</span><div><b>Le jeu en 6 images</b><span class="cm-mf">${F.map(f => `<i style="--fc:${f.col}">${cmFamIco(f)}</i>`).join('')}</span></div><button class="btn cream sm" data-cmhow="1">Voir</button></div></section>`;
    const secs = box.querySelectorAll('.msec'); const last = secs[secs.length - 1];
    if (last) last.insertAdjacentHTML('beforebegin', row); else box.insertAdjacentHTML('beforeend', row);
  } catch (e) { console.error('commerce menu', e); }
  return r;
})(renderMenu);

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-cmprep],[data-cmdefi],[data-cmstop],[data-cmskip],[data-cmsell],[data-cmacc],[data-cmmk],[data-cmhow]'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.cmprep) return cmStart(d.cmprep);
  if (d.cmdefi) return cmDefiOpen(+d.cmdefi);
  if (d.cmstop) return cmDefiStop();
  if (d.cmskip) { const G = cmGame; cmGame = null; const x = G && cmState().sl[G.i]; if (x) { if (x.pause) { x.end += Date.now() - x.pause; delete x.pause; } x.chd = -1; save(); } $('modal').hidden = true; cmPaint(); return; }
  if (d.cmsell) return cmSell(d.cmsell, el);
  if (d.cmacc) return cmAccept(d.cmacc);
  if (d.cmmk) { bView = 'marche'; try { mkView = 'vendre'; mkCat = 'craft'; } catch (e) {} renderPanel(); const b = $('panelBody'); if (b) b.scrollTop = 0; return; }
  if (d.cmhow) { showModal(cmHowHTML()); return; }
});
// fermer la fenêtre du défi autrement : le produit reprend sa cuisson
document.addEventListener('click', ev => { if (cmGame && ev.target.closest('[data-closemodal]')) { const G = cmGame; cmGame = null; const x = cmState().sl[G.i]; if (x && x.pause) { x.end += Date.now() - x.pause; delete x.pause; save(); } } }, true);

// ---------------- styles ----------------
(function cmCSS() {
  const st = document.createElement('style');
  st.textContent = `
.cm-adv{margin:-2px 0 8px;font-size:12px;text-align:center;color:var(--ink2)}.cm-adv b{color:var(--ink);background:#fff3c4;border:1.5px solid var(--ink);border-radius:8px;padding:0 6px;margin-right:4px}
.cm-onc{position:absolute;top:51%;width:8%;aspect-ratio:1;background:#fff8ea;border:1.5px solid var(--ink);border-radius:8px;padding:2px;box-sizing:border-box;animation:b2pop .35s ease-out}
.cm-onc svg{width:100%;height:100%;display:block}.cm-onc i{position:absolute;right:-6px;top:-6px;font:800 10px/1 'Baloo 2',sans-serif;font-style:normal;background:#f6c445;border:1.2px solid var(--ink);border-radius:8px;padding:1px 3px}
.cm-buy .cm-bb{border-color:#d99a25;animation:b2pop .35s ease-out,cmbob 1.6s ease-in-out .4s infinite}
.cm-bb em{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);font:800 10px/1 'Baloo 2',sans-serif;font-style:normal;background:#f6c445;border:1.2px solid var(--ink);border-radius:8px;padding:2px 4px;white-space:nowrap}
@keyframes cmbob{50%{transform:translateX(-50%) translateY(-3px)}}
.cm-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.cm-slot{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:2.5px solid var(--ink);border-radius:14px;background:#fff8ea;padding:6px 4px;min-height:118px;box-sizing:border-box}
.cm-slot.empty{border-style:dashed;background:none;justify-content:center;color:var(--ink2)}.cm-plus{font:800 26px/1 'Baloo 2',sans-serif;opacity:.5}
.cm-an svg{width:40px;height:40px}.cm-sp{position:absolute;top:4px;right:4px;width:26px;height:26px}.cm-sp svg{width:100%;height:100%}
.cm-bar{width:90%;height:8px;border:1.5px solid var(--ink);border-radius:5px;background:#efe2c4;overflow:hidden}.cm-bar i{display:block;height:100%;background:#5fbf7f;width:0;animation:cmfill linear forwards}
.cm-slot.paused .cm-bar i{animation-play-state:paused}
@keyframes cmfill{to{width:100%}}
.cm-slot small{font:800 11px 'Baloo 2',sans-serif}.cm-defib{animation:cmpulse 1s ease-in-out infinite}.cm-ok{font:800 10.5px 'Baloo 2',sans-serif;color:#2f7f6c}
@keyframes cmpulse{50%{transform:scale(1.08)}}
.cm-st{display:inline-flex;gap:0;font-size:12px;line-height:1}.cm-st i{font-style:normal;color:#d8cdb8;-webkit-text-stroke:.6px #5b4636}.cm-st i.on{color:#f6c445}
.cm-steam path{animation:cmsteam 1.4s ease-out infinite;opacity:.9}.cm-steam path:nth-child(2){animation-delay:.4s}.cm-steam path:nth-child(3){animation-delay:.8s}
@keyframes cmsteam{from{transform:translateY(4px);opacity:0}40%{opacity:.9}to{transform:translateY(-4px);opacity:0}}
.cm-anim .cm-fire{animation:cmglow .5s ease-in-out infinite alternate}.cm-glow{animation:cmglow .8s ease-in-out infinite alternate}
@keyframes cmglow{from{opacity:.55}to{opacity:1}}
.cm-snipA{transform-origin:20px 20px;animation:cmsnip .5s ease-in-out infinite alternate}.cm-snipB{transform-origin:20px 20px;animation:cmsnip2 .5s ease-in-out infinite alternate}
@keyframes cmsnip{to{transform:rotate(14deg)}}@keyframes cmsnip2{to{transform:rotate(-14deg)}}
.cm-bounce{animation:cmbnc .6s ease-in-out infinite alternate}@keyframes cmbnc{to{transform:translateY(-4px)}}
.cm-spin{animation:cmspin 1s linear infinite}@keyframes cmspin{to{transform:rotate(360deg)}}
.cm-write{transform-origin:24px 30px;animation:cmwr .4s ease-in-out infinite alternate}@keyframes cmwr{to{transform:rotate(-10deg) translateX(-3px)}}
.cm-hit{animation:cmhit .5s ease-in infinite alternate}@keyframes cmhit{from{transform:rotate(-25deg)}to{transform:rotate(8deg)}}
.cm-rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-bottom:8px}
.cm-r{display:flex;flex-direction:column;align-items:center;gap:3px;border:2px solid var(--ink);border-radius:14px;background:#fff8ea;padding:6px;text-align:center}
.cm-r.can{background:#effaf2;border-color:#3a8f5a}.cm-r.locked{opacity:.62;background:#f4efe6}
.cm-r>b{font:700 12.5px/1.1 'Baloo 2',sans-serif}
.cm-rp{position:relative;width:54px;height:54px;background:#fff;border:2px solid #e7d6b8;border-radius:14px;padding:4px;box-sizing:border-box}.cm-rp svg{width:100%;height:100%}
.cm-rt{position:absolute;bottom:-6px;left:-8px;font:800 10px/1 'Baloo 2',sans-serif;font-style:normal;background:#fff;border:1.2px solid var(--ink);border-radius:8px;padding:2px 4px}
.cm-far{position:absolute;top:-6px;right:-14px;font:800 9px/1 'Baloo 2',sans-serif;font-style:normal;background:#9fd1e8;border:1.2px solid var(--ink);border-radius:8px;padding:2px 4px}
.cm-ings{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}
.cm-ing{position:relative;width:30px;height:30px;border:1.5px solid #d9604f;border-radius:9px;background:#fff;padding:2px;box-sizing:border-box}.cm-ing.ok{border-color:#3a8f5a}.cm-ing svg{width:100%;height:100%}
.cm-ing i{position:absolute;bottom:-6px;right:-6px;font:800 9.5px/1 'Baloo 2',sans-serif;font-style:normal;background:#ffe4d8;border:1.2px solid var(--ink);border-radius:7px;padding:1px 3px}.cm-ing.ok i{background:#5fbf7f;color:#fff}
.cm-pr{font-weight:800;font-size:12.5px;margin-top:3px}.cm-pr small{font-weight:700;color:var(--ink2)}.cm-pr .cm-st{font-size:9px}
.cm-r .btn[aria-disabled]{opacity:.6}
.cm-lock{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700}.cm-lock svg{width:14px;height:14px}
.cm-surplus{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;font-size:12.5px;font-weight:700;border:2px dashed #c9a97a;border-radius:12px;padding:6px 8px;margin-bottom:10px}
.cm-o{border-color:var(--tc)}.cm-o.pend{background:var(--tb)}
.cm-tier{font:800 10.5px/1 'Baloo 2',sans-serif;color:#fff;background:var(--tc);border:1.5px solid var(--ink);border-radius:8px;padding:3px 6px;margin-left:auto}
.cm-req3{position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-style:normal;background:#fff;border-radius:8px;padding:0 2px}
.cm-rw{display:flex;align-items:center;gap:6px;background:#fff;border:2px solid var(--tc);border-radius:12px;padding:4px 6px}
.cm-rwi{position:relative;flex:none;width:44px;height:44px}.cm-rwi svg{width:100%;height:100%}
.cm-recb{position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);font:800 8.5px/1 'Baloo 2',sans-serif;font-style:normal;background:#f6c445;border:1px solid var(--ink);border-radius:6px;padding:1px 3px}
.cm-rwx{display:flex;flex-direction:column;min-width:0}.cm-rwx b{font:800 12px/1.1 'Baloo 2',sans-serif}.cm-rwx span{font-size:11.5px;font-weight:700}.cm-rwx .bq-star{width:12px;height:12px;vertical-align:-2px}
.cm-defi{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.cm-dk{font:800 12px 'Baloo 2',sans-serif;color:#fff;background:#b0482f;border-radius:8px;padding:2px 8px}.cm-dprod{width:64px;height:64px}.cm-dprod svg{width:100%;height:100%}
.cm-defi h2{font-size:18px;margin:0}.cm-defi p{margin:0;font-size:13px}
.cm-gauge{position:relative;width:100%;max-width:320px;height:34px;border:2.5px solid var(--ink);border-radius:12px;background:#f3d9cf;overflow:hidden;margin:6px 0}
.cm-zone{position:absolute;top:0;bottom:0;background:#5fbf7f}
.cm-cur{position:absolute;top:-2px;bottom:-2px;width:8px;left:0;background:#4a3528;border-radius:4px;animation:cmcur 1.15s ease-in-out infinite alternate}
@keyframes cmcur{from{left:0}to{left:calc(100% - 8px)}}
.cm-stop{font-size:18px;padding:10px 28px}.cm-dres{font:800 16px 'Baloo 2',sans-serif}.cm-dres.ok{color:#2f7f6c}.cm-dres.ko{color:#b0482f}.cm-dres .cm-st{font-size:20px}
.cm-advbox{display:flex;align-items:center;gap:8px;text-align:left;background:linear-gradient(135deg,#fff3c4,#ffe1ec);border:2.5px solid var(--ink);border-radius:14px;padding:6px 10px;margin:6px 0}
.cm-advbox svg{width:44px;height:44px}.cm-advbox b{display:block;font:800 15px 'Baloo 2',sans-serif}.cm-advbox small{font-size:12.5px}
.cm-line li.later{opacity:.7}.cm-line li i{font-style:normal;font-size:10px;font-weight:800;color:#9a6fd6;display:block}
.cm-cprods{display:flex;gap:2px;justify-content:center}.cm-cprods i{width:24px;height:24px}.cm-cprods svg{width:100%;height:100%}
.cm-cadv{font:800 11px 'Baloo 2',sans-serif;background:#fff3c4;border:1.5px solid var(--ink);border-radius:8px;padding:1px 6px}
.cm-mf{display:flex;gap:3px;margin-top:2px}.cm-mf i,.cm-hf i{font-style:normal;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--fc);font-size:12px;border:1.5px solid var(--ink)}
.cm-mf svg,.cm-hf svg,.cm-hu svg,.cm-mri svg{width:70%;height:70%}
.cm-how{text-align:center}.cm-how h2{margin:2px 0 8px}
.cm-hsteps{list-style:none;padding:0;margin:0 0 10px;display:grid;grid-template-columns:1fr;gap:4px}
.cm-hs{position:relative;display:grid;grid-template-columns:26px 1fr;grid-template-areas:'n a' 'n t' 'n s';align-items:center;gap:0 8px;border:2px solid var(--ink);border-radius:14px;background:#fff8ea;padding:6px 8px;text-align:left}
.cm-hs+.cm-hs::before{content:'↓';position:absolute;top:-14px;left:50%;font:800 14px/1 'Baloo 2',sans-serif;color:#c9a97a}
.cm-hn{grid-area:n;width:24px;height:24px;border-radius:50%;background:#f6c445;border:1.5px solid var(--ink);display:grid;place-items:center;font:800 13px 'Baloo 2',sans-serif}
.cm-ha{grid-area:a;display:flex;justify-content:center;width:100%}.cm-hs b{grid-area:t;font:800 14px/1.1 'Baloo 2',sans-serif;text-align:center}.cm-hs small{grid-area:s;font-size:11.5px;color:var(--ink2);text-align:center}
.cm-hpic{display:flex;align-items:center;gap:4px}.cm-hpic img,.cm-hpic svg{width:40px;height:40px}.cm-hheart{color:#f08aa6;font-size:22px}
.cm-hf{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}.cm-hf i{width:30px;height:30px;font-size:17px}
.cm-hu{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}.cm-hu i{font-style:normal;display:flex;flex-direction:column;align-items:center;font:700 10.5px/1.1 'Baloo 2',sans-serif;width:58px}.cm-hu{width:100%}
.cm-hu u{text-decoration:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--fc);border:1.5px solid var(--ink);font-size:14px}
@media (min-width:700px){.cm-hsteps{grid-template-columns:repeat(3,1fr);gap:10px}.cm-hs{grid-template-columns:1fr;grid-template-areas:'n' 'a' 't' 's';justify-items:center}.cm-hs+.cm-hs::before{content:'→';top:45%;left:-11px}.cm-slots{max-width:640px;margin-left:auto;margin-right:auto}}
@media (prefers-reduced-motion:reduce){.cm-anim *,.cm-defib,.cm-bb{animation:none!important}}
`;
  document.head.appendChild(st);
})();

window.__cm = { R: CM_R, LINES: CM_LINES, ADV: CM_ADV, state: cmState, start: cmStart, finish: cmFinish, price: cmPrice, sell: cmSell, tickBuyers: cmTickBuyers,
  forceDefi: () => { cmForceDefi = true; }, nextTier: t => { cmNextTier = t; }, applyTier: cmApplyTier, newOrder: () => bqNewOrder(false), how: cmHowHTML };

// ================= COMMERCE QUI FABRIQUE (v20) =================
// Le commerce fabrique PUIS vend :
// - chaque type de commerce a SA ligne de recettes (CM_LINES), préparées en 3 à 10 secondes sur 3 places (cuisine ou atelier) ;
// - environ 1 fois sur 5, un DÉFI RAPIDE facultatif (jauge à arrêter dans la zone verte) donne 2 étoiles de plus ;
// - les produits prêts vont sur le comptoir (dans le sac, marqués it.mk) ; les clients de la scène les achètent d'un toucher ;
//   le surplus se vend au marché mondial (catégorie « Objets fabriqués ») ;
// - v29 : plus de commandes spéciales (seule la commande guidée du tutoriel existe encore) ; leurs pierres d'étoile et
//   objets rares passent aux clients fidèles (42_fideles.js) ;
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
  fleuriste: ['Charme fleuri', '+30 % de réputation à chaque vente'],
  mode: ['Cousu main', 'Chaque vêtement fabriqué ici donne un bonus de chance en voyage quand il est porté'],
  animalerie: ['Ami des bêtes', 'Œufs 20 % moins chers et croisements 2 fois plus rapides'],
  glacier: ['Pourboires', '+5 pièces par client du comptoir'],
  librairie: ['Bouche-à-oreille', 'Les clients fidèles offrent 2 fois plus souvent un cadeau'],
  epicerie: ['Réseau lointain', 'Produits faits avec un ingrédient venu de loin : +25 % au comptoir'],
  brocante: ['Œil de chineur', 'Chaque vente rapporte un point d’amitié de plus au client'],
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
  // v26 : envies variées (historique des envies, dernière vente et ventes par recette ; absents des anciennes sauvegardes)
  if (!Array.isArray(c.envH)) c.envH = [];
  for (const k of ['soldAt', 'soldN']) if (!c[k] || typeof c[k] !== 'object') c[k] = {};
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
const cmDur = R => Math.max(3, Math.min(10, R.t * (cmT() && cmT().id === 'boulangerie' ? 0.7 : 1) * cfDurMul(R))); // cfDurMul : avantages des clients fidèles (42_fideles.js)
const cmDefiP = () => (cmT() && cmT().id === 'restaurant' ? 0.4 : 0.2) + cfDefiAdd();
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
  if (!cmUnlocked(R)) { toast(R.x ? 'Recette exclusive : elle s’obtient en récompense (client fidèle, histoire ou défi).' : `Recette débloquée à ${R.rep} points de réputation.`); return; }
  const i = c.sl.findIndex(x => !x); if (i < 0) { toast('Les 3 places sont occupées : attendez qu’un produit soit prêt.'); return; }
  if (R.egg && c.eggDay === dayKey()) { toast('Un seul œuf du nid douillet par jour : revenez demain !'); return; }
  if (!cmCanIng(R)) { const m = R.ing.find(([k, n]) => cmHave(k) < n); toast(`Il manque : ${cmIngName(m[0]).toLowerCase()} (${cmHave(m[0])}/${m[1]}).`); return; }
  let rare = false, sg = 0; // sg : meilleure « spécialité maison » utilisée (65_adresses.js) — elles partent en premier, la plus étoilée d'abord
  for (const [k, n] of R.ing) {
    const take = cmPool(k).sort((a, b) => ((b.sg ? b.sg.s : 0) - (a.sg ? a.sg.s : 0)) || (a.rid ? 1 : 0) - (b.rid ? 1 : 0) || (a.rarity || 0) - (b.rarity || 0)).slice(0, n);
    take.forEach(it => { if (it.sg) sg = Math.max(sg, it.sg.s || 1); else if ((it.rarity || 0) >= 2) rare = true; S.inv.splice(S.inv.indexOf(it), 1); });
  }
  if (R.egg) c.eggDay = dayKey();
  const now = Date.now(), dur = cmDur(R) * 1000;
  c.sl[i] = { rid, shop: T.id, t0: now, end: now + dur, dur, st: rare ? 2 : 1, ch: cmForceDefi || Math.random() < cmDefiP() ? 1 : 0, chd: 0 };
  if (sg) { c.sl[i].sg = sg; try { toast(`Spécialité ${'★'.repeat(sg)} utilisée : ce plat se vendra ${[0, 10, 25, 50][sg]} % plus cher.`); } catch (e) {} }
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
  if (x.sg) { it.mk.sg = x.sg; it.mk.p = Math.round(it.mk.p * (1 + [0, 0.1, 0.25, 0.5][x.sg])); } // cuisiné avec une spécialité maison étoilée
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
// v26 : l'envie d'un client, choisie parmi TOUTES les recettes débloquées du commerce (pas seulement la vitrine).
// Jamais la même que les 3 dernières (si au moins 5 recettes), lassitude après une vente, bonus aux produits jamais vendus.
function cmEnvieOf(list, c, likes, now, stock) {
  if (!list.length) return null;
  const taken = new Set(c.buy.map(b => b.rid)), nb = list.length >= 5 ? 3 : list.length >= 3 ? list.length - 2 : list.length - 1;
  const ban = new Set(nb > 0 ? c.envH.slice(-nb) : []);
  let pool = list.filter(R => !taken.has(R.id) && !ban.has(R.id));
  if (!pool.length) pool = list.filter(R => !taken.has(R.id) && R.id !== c.envH[c.envH.length - 1]);
  if (!pool.length) pool = list.filter(R => !taken.has(R.id)); if (!pool.length) return null;
  const w = R => {
    let x = R.ing.some(([k]) => (likes || []).includes(k)) ? 1.8 : 1;
    const t = c.soldAt[R.id];
    if (!c.soldN[R.id]) x *= 1.7; else if (t) x *= 0.15 + 0.85 * Math.min(1, Math.max(0, now - t) / 300e3); // lassitude : 5 minutes
    if (stock && stock.has(R.id)) x *= 1.3;
    return x;
  };
  const R = bqPick(pool, w); c.envH.push(R.id); if (c.envH.length > 12) c.envH.splice(0, c.envH.length - 12);
  return R.id;
}
const cmEnvieList = T => (CM_LINES[T.id] || []).filter(R => !R.egg && cmUnlocked(R));
function cmTickBuyers() {
  const T = cmT(); if (!T) return false;
  const c = cmState(), now = Date.now(); let ch = false;
  // un acheteur attend 4 minutes (3 si son produit n'est pas en vitrine)
  const avail = cmProducts(T.id), stock = new Set(avail.map(it => it.mk.rid));
  const n0 = c.buy.length; c.buy = c.buy.filter(b => b.shop === T.id && now - b.at < (stock.has(b.rid) ? 4 : 3) * 60e3 && CM_R[b.rid] && cmUnlocked(CM_R[b.rid])); if (c.buy.length !== n0) ch = true;
  const list = cmEnvieList(T);
  if (!list.length || c.buy.length >= 2) return ch;
  if (!c.nb) c.nb = now + 1500;
  if (now < c.nb) return ch;
  const s = bqState(), busy = new Set([...s.orders.map(o => o.client), ...c.buy.map(b => b.cid)]);
  const ids = (BQ_SHOP_CLIENTS[T.id] || []).filter(id => BQC(id) && !busy.has(id));
  const pool = ids.length ? ids : BQ_CLIENTS.filter(x => !busy.has(x.id)).map(x => x.id); if (!pool.length) return ch;
  const cid = pick(pool), cl = BQC(cid);
  const rid = cmEnvieOf(list, c, cl.likes, now, stock); if (!rid) return ch;
  c.buy.push({ id: uidGen(), cid, rid, shop: T.id, at: now });
  c.nb = now + cmBuyGap();
  return true;
}
function cmSell(bid, el) {
  const c = cmState(), b = c.buy.find(x => x.id === bid); if (!b) return;
  const it = cmProducts(b.shop).filter(x => x.mk.rid === b.rid).sort((a, z) => z.mk.st - a.mk.st)[0];
  if (!it) { // pas encore en vitrine : on montre la recette à préparer (le client patiente)
    const R = CM_R[b.rid], q = BQC(b.cid);
    toast(`${q ? q.name : 'Ce client'} voudrait « ${R.def[0]} » : préparez-le, il vous attend !`);
    czGo('prep');
    setTimeout(() => { const card = document.querySelector(`#czBody [data-cmprep="${b.rid}"]`); const r = card && card.closest('.cm-r'); if (r) { r.scrollIntoView({ behavior: czRM() ? 'auto' : 'smooth', block: 'center' }); r.classList.add('b2flash'); } }, 60);
    return;
  }
  const fx = el && el.closest && el.closest('#czScene') ? czFxFrom(el, b.rid) : null;
  c.buy = c.buy.filter(x => x !== b);
  S.inv.splice(S.inv.indexOf(it), 1);
  const T = BQS(b.shop), s = bqState(), tip = T && T.id === 'glacier' ? 5 : 0, pay = it.mk.p + tip;
  const rep = Math.max(1, Math.round(it.mk.st * (T && T.rep ? T.rep : 1)));
  const lv0 = s.lvl;
  gainCoins(pay); s.rep += rep; s.earned += pay; c.sold++; s.lvl = bqLevelOf(s.rep);
  c.soldAt[b.rid] = Date.now(); c.soldN[b.rid] = (c.soldN[b.rid] || 0) + 1;
  try { b2Heart(b.cid, 1); } catch (e) {}
  c.nb = Date.now() + cmBuyGap();
  save();
  if (!fx) try { bqHearts(el); } catch (e) {}
  toast(`${BQC(b.cid).name} achète « ${it.name} » : +${pay} pièces${tip ? ' (pourboire compris)' : ''}, +${rep} réputation.`);
  if (s.lvl > lv0) try { bqLevelUp(s.lvl); } catch (e) {}
  renderTop(); cmPaint(true); czSaleFx(fx, pay);
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
  const h = cmHome(), pool = []; REGIONS.forEach(R => { if (R.id !== h && R.id !== 'grand_large') R.res.forEach(x => { if (x.rar <= 1 && (typeof bqRegSense !== 'function' || bqRegSense(x))) pool.push(x); }); });
  return bqPick(pool);
}
// v22 : objets rares en récompense (décoration, clé de coffre, pierre précieuse), montrés en image avant d'accepter.
// f : petit cadeau (clé en bois, déco commune) ; n : rare ; d : épique ou légendaire.
const CM_RW_KIND = { deco: 'Décoration', cle: 'Clé de coffre', gemme: 'Pierre précieuse' };
function cmRareItem(tier) {
  const lo = tier === 'f' ? 0 : tier === 'n' ? 2 : 3, hi = tier === 'f' ? 1 : tier === 'n' ? 2 : 4, out = [];
  try { // décorations du foyer (catalogue et objets du monde)
    const deco = []; BQ_CAT.forEach(a => { if (a.k === 'd' && a.def[3] >= lo && a.def[3] <= hi) deco.push(a.def); });
    Object.values(LOOT).forEach(l => l.forEach(d => { if (d[1] === 'd' && d[3] >= lo && d[3] <= hi && !deco.some(x => x[0] === d[0])) deco.push(d.slice(0, 6)); }));
    if (deco.length) out.push({ w: 3, what: 'deco', def: pick(deco) });
  } catch (e) {}
  try { // clés de coffre (familles)
    const locks = Object.keys(FAM_LOCKS).filter(l => FAM_LOCKS[l].r - 1 >= Math.max(0, lo - 1) && FAM_LOCKS[l].r - 1 <= hi);
    if (locks.length) { const l = pick(locks), L = FAM_LOCKS[l]; out.push({ w: 2, what: 'cle', def: [famKeyName(l), 'm', 'cle', L.r - 1, null, L.col] }); }
  } catch (e) {}
  try { // pierres précieuses brutes (à tailler à l'atelier)
    const g = FAM_GEMS.filter(x => x[4] >= Math.max(1, lo) && x[4] <= hi);
    if (g.length) { const x = pick(g); out.push({ w: 2, what: 'gemme', def: [x[1], 'm', 'gemme', x[4], null, x[5]] }); }
  } catch (e) {}
  const r = out.length ? bqPick(out, x => x.w) : null;
  return r ? { k: 'item', what: r.what, def: r.def } : null;
}
function cmRewardFor(tier, T, c) {
  const L = bqState().lvl, out = [];
  const excl = (CM_LINES[T.id] || []).filter(R => R.x && !cmState().unl.includes(R.id));
  const cloth = BQ_CAT.filter(a => a.k === 'v' && a.def[3] >= (tier === 'd' ? 3 : 2)).map(a => a.def);
  const rare = cmRareItem(tier);
  if (tier === 'f') return rare && Math.random() < 0.35 ? rare : { k: 'coins' };
  if (tier === 'n') { out.push([{ k: 'coins' }, 2], [{ k: 'rumor' }, 1]); if (cloth.length) out.push([{ k: 'cloth', def: pick(cloth.filter(d => d[3] <= 2)) || pick(cloth) }, 1]); if (rare) out.push([rare, 2]); }
  else {
    out.push([{ k: 'egg', sp: pick(bqSpIds()), variant: Math.random() < 0.5 }, 3], [{ k: 'rumor' }, 2], [{ k: 'coins' }, 1]);
    if (excl.length) out.push([{ k: 'rec', rid: excl[0].id }, 3]);
    if (cloth.length) out.push([{ k: 'cloth', def: pick(cloth) }, 2]);
    if (rare) out.push([rare, 3]);
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
  // pierres d'étoile (S.stones, pour le futur tirage) : 1 commande Normal sur 3 en donne 1, un Défi en donne 2 ou 3
  o.st = tier === 'd' ? 2 + (Math.random() < 0.4 ? 1 : 0) : tier === 'n' && Math.random() < 1 / 3 ? 1 : 0;
  if (!o.st) delete o.st;
  return o;
}
// v29 : plus de commandes spéciales. Seule la commande guidée du tutoriel (forceEasy) est encore créée.
if (typeof bqNewOrder === 'function') bqNewOrder = (orig => function (forceEasy) {
  if (!forceEasy) return null;
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
  try { if (o) { const al = bqAllocate(o), r = o.req.find((q, i) => al[i].have < q.n); if (r && r.k === 'mk') { if (document.getElementById('czScene')) czGo('prep'); toast(`Préparez « ${CM_R[r.rid].def[0]} » et réussissez le défi rapide (3 étoiles).`); return; } } } catch (e) {}
  return orig.apply(this, arguments);
})(bqGo);
// v29 : seule la commande du tutoriel en cours reste ; les anciennes commandes (sauvegardes) sont annulées sans bruit
function cmPurgeOrders() {
  try {
    const s = bqState(), keep = o => !!(o && o.tuto && S.tuto && S.tuto.on && S.tuto.o === o.id), n0 = s.orders.length;
    s.orders = s.orders.filter(keep);
    if (s.park && typeof s.park === 'object') for (const k of Object.keys(s.park)) s.park[k] = [];
    return s.orders.length !== n0;
  } catch (e) { return false; }
}
if (typeof bqTickOrders === 'function') bqTickOrders = (orig => function () {
  let ch = orig.apply(this, arguments);
  if (cmPurgeOrders()) ch = true;
  return ch;
})(bqTickOrders);
try { if (cmPurgeOrders()) save(); } catch (e) {}
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
    if (rw.k === 'item' && Array.isArray(rw.def)) { const it = makeItem(rw.def, 0, `Cadeau de ${c.name}`, [], { fixed: rw.def[3] }); S.inv.push(it); S.dex[it.name] = true; return `« ${it.name} »`; }
  } catch (e) { console.error('commerce récompense', e); }
  return '';
}
if (typeof bqDeliver === 'function') bqDeliver = (orig => function (id) {
  const s = bqState(), o = s.orders.find(x => x.id === id), c = o && BQC(o.client);
  const r = orig.apply(this, arguments);
  try { if (o && !s.orders.includes(o)) { let t = cmGrant(o, c); const st = o.st > 0 && typeof gainStones === 'function' ? gainStones(o.st) : 0; if (st) t = (t ? t + ' et ' : '') + stonesWord(st); if (t) { save(); setTimeout(() => toast(`Récompense de ${c.name} : ${t} !`), 1100); } } } catch (e) {}
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
  else if (rw.k === 'item' && Array.isArray(rw.def)) { ic = itemIcon(bqItemOf(rw.def)) + `<i class="cm-rwr" style="--rc:${RARC[rw.def[3]] || RARC[0]}">${esc(RARITY[rw.def[3]] || '')}</i>`; tx = `${CM_RW_KIND[rw.what] || 'Objet'} : ${rw.def[0]}`; }
  const st = o.st > 0 && typeof STONE_SVG !== 'undefined' ? ` <em class="cm-stn" title="${esc(stonesWord(o.st))}">${STONE_SVG}+${o.st}</em>` : '';
  return `<div class="cm-rw"><span class="cm-rwi k-${rw.k}">${ic}</span><span class="cm-rwx"><b>${esc(tx)}</b><span>${coins(o.coins)} · ${BQ_STAR}+${o.rep}${st}</span></span></div>`;
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

// ---------------- le comptoir (v25 : scène cosy et vivante) ----------------
// En haut, une GRANDE scène dessinée (SVG + CSS) : intérieur en bois, décor propre au commerce (CZ_WS, czTopProp, czFore),
// qui s'enrichit avec la réputation (czTier : 4 paliers). Les clients entrent par la porte, font la queue avec une bulle
// (toucher = vendre, data-cmsell / livrer, data-b2ord), puis repartent avec un cœur. Les familiers « Commis » du foyer
// (ou le familier choisi) travaillent derrière le comptoir ; ce qui est prêt s'aligne dans la vitrine et sur les étagères.
// En dessous : 2 onglets, Préparer (cuisine, vitrine, recettes ; la commande guidée du tutoriel s'y affiche) et Clients
// (v29 : clients fidèles et leurs avantages, 42_fideles.js).
const CZ_L = '#5b4636';
const czX = x => (x / 3.6).toFixed(2) + '%', czY = y => (y / 3.8).toFixed(2) + '%';
const czSW = (w = 1.6) => `stroke="${CZ_L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const czTier = () => { let L = 0; try { L = bqState().lvl || 0; } catch (e) {} return L >= 3 ? 3 : L >= 2 ? 2 : L >= 1 ? 1 : 0; };
const CZ_WS = { boulangerie: 'oven', cafe: 'coffee', restaurant: 'stove', epicerie: 'stove', glacier: 'freezer' };
const CZ_FORE = { boulangerie: 'sack', restaurant: 'crate', epicerie: 'crate', fleuriste: 'bucket', mode: 'yarn', animalerie: 'yarn', glacier: 'board', cafe: 'board', librairie: 'books', brocante: 'books' };
let czTab = null, czWalkC = null, czWalkT = 0, czDing = false; const czSeen = new Set();
const czSeenNew = k => { if (czSeen.size > 400) czSeen.clear(); if (czSeen.has(k)) return false; czSeen.add(k); return true; };
const czURIc = new Map();
const czURI = (c, m) => { const k = c.id + m; let u = czURIc.get(k); if (!u) { u = clientURI(c, m); if (czURIc.size > 80) czURIc.clear(); czURIc.set(k, u); } return u; };
const czRM = () => { try { return reduceMotion(); } catch (e) { return false; } };
const czBusy = () => { try { const n = Date.now(); return cmState().sl.some(x => x && !x.pause && n < x.end); } catch (e) { return false; } };
const czSteam = (x, y, col) => `<g class="cz-stm" transform="translate(${x} ${y})"${col ? ` style="stroke:${col}"` : ''}><path d="M-7 2 q-4 -6 0 -11 q4 -6 0 -11"/><path d="M0 0 q-4 -6 0 -11 q4 -6 0 -11"/><path d="M7 2 q-4 -6 0 -11 q4 -6 0 -11"/></g>`;
const CZ_IC = {
  prep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 H20 L18.5 20 H5.5Z" fill="#e3a04b" stroke="#5b4636" stroke-width="1.5" stroke-linejoin="round"/><path d="M2.5 11 H21.5" stroke="#5b4636" stroke-width="1.8" stroke-linecap="round"/><path d="M9 8 q-1.5 -2 0 -4 M13 8 q-1.5 -2 0 -4" fill="none" stroke="#5b4636" stroke-width="1.3" stroke-linecap="round"/></svg>',
  cmd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3 H16 L19 6 V21 H6Z" fill="#fffaf0" stroke="#5b4636" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 9 h7 M9 13 h7 M9 17 h4" stroke="#c9a97a" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="18" r="4" fill="#f6c445" stroke="#5b4636" stroke-width="1.3"/></svg>',
  cli: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 C5 15 3 11.5 3 8.5 A4.3 4.3 0 0 1 12 6.5 A4.3 4.3 0 0 1 21 8.5 C21 11.5 19 15 12 20Z" fill="#f39ab0" stroke="#5b4636" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  hat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14 a4 4 0 0 1 1.5 -7.6 a4.6 4.6 0 0 1 9 0 A4 4 0 0 1 18 14Z" fill="#fff" stroke="#5b4636" stroke-width="1.4" stroke-linejoin="round"/><rect x="7" y="14" width="10" height="5" rx="1.2" fill="#fff" stroke="#5b4636" stroke-width="1.4"/></svg>',
  shelf: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="#e3c08f" stroke="#5b4636" stroke-width="1.4"/><path d="M4 10 H20 M4 16 H20" stroke="#5b4636" stroke-width="1.4"/><circle cx="8" cy="7.5" r="2" fill="#f39ab0"/><rect x="13" y="12" width="4" height="4" rx="1" fill="#9fd1e8"/></svg>',
};

// le poste de travail, selon le commerce
function czStation(T) {
  const id = T ? T.id : '', k = CZ_WS[id] || 'bench', s = czSW(), s1 = czSW(1.2), aw = T ? T.aw : '#e3a04b', aw2 = T ? T.aw2 : '#fff8ea';
  if (k === 'oven') return `<rect x="300" y="0" width="20" height="106" fill="#b5654a" ${s}/><path d="M300 32 H320 M300 70 H320" stroke="${CZ_L}" stroke-width="1"/>
    <path d="M264 202 V150 a46 46 0 0 1 92 0 V202Z" fill="#d6825c" ${s}/>
    <path d="M272 126 H348 M266 150 H354 M264 174 H356 M292 106 V126 M328 106 V126 M278 126 V150 M310 126 V150 M342 126 V150 M292 150 V174 M326 150 V174" stroke="#a85a3e" stroke-width="1.1" opacity=".75"/>
    <ellipse class="cz-hot" cx="310" cy="190" rx="50" ry="34" fill="url(#czlamp)"/>
    <path d="M284 202 V182 a26 24 0 0 1 52 0 V202Z" fill="#3b2f2a" ${s}/><path d="M292 199 H328" stroke="#c9604f" stroke-width="2" opacity=".7"/>
    <g class="cz-hot cz-fire"><path d="M292 202 q3 -14 9 -6 q2 -13 9 -2 q4 -11 8 0 q4 -8 8 8Z" fill="#f2a05a"/><path d="M300 202 q4 -9 8 -3 q4 -6 7 3Z" fill="#fbd76a"/></g>
    ${czSteam(310, 176)}
    <rect x="260" y="202" width="100" height="36" rx="3" fill="#c9a27a" ${s}/>` + [282, 302, 322, 342].map(x => `<circle cx="${x}" cy="221" r="7" fill="#b07a4a" ${s1}/><circle cx="${x}" cy="221" r="3" fill="none" stroke="#7a5236" stroke-width="1"/>`).join('');
  if (k === 'stove') return `<rect x="300" y="0" width="20" height="96" fill="#b9c0c8" ${s}/><path d="M270 96 H350 L358 120 H262Z" fill="#d3dade" ${s}/><path d="M266 114 H354" stroke="#9aa8b4" stroke-width="1.1"/>
    <path d="M272 130 H348" stroke="${CZ_L}" stroke-width="1.6"/><path d="M278 130 V144" stroke="${CZ_L}" stroke-width="1.3"/><circle cx="278" cy="147" r="4" fill="#9aa8b4" ${s1}/>
    <path d="M342 130 V141" stroke="${CZ_L}" stroke-width="1.3"/><rect x="338" y="141" width="8" height="9" rx="1.5" fill="#9aa8b4" ${s1}/>
    <path d="M286 148 H322 L319 170 H289Z" fill="#9aa8b4" ${s}/><rect x="283" y="144" width="42" height="6" rx="2" fill="#c3ccd3" ${s1}/><circle cx="304" cy="142" r="2.2" fill="${CZ_L}"/>
    <ellipse cx="338" cy="168" rx="11" ry="3" fill="#5b6670"/><path d="M349 167 h9" stroke="${CZ_L}" stroke-width="2"/>
    <g class="cz-hot"><path d="M292 174 q3 -6 6 0 q3 -6 6 0 q3 -6 6 0 q3 -6 6 0" fill="#f2a05a"/></g>${czSteam(304, 136)}
    <rect x="260" y="172" width="100" height="8" rx="2" fill="#5b6670" ${s1}/><rect x="264" y="180" width="92" height="58" rx="4" fill="${aw}" ${s}/>
    <rect x="276" y="194" width="68" height="34" rx="4" fill="#fff8ea" ${s1}/><rect x="283" y="200" width="54" height="22" rx="3" fill="#3b2f2a"/><rect class="cz-hot" x="283" y="200" width="54" height="22" rx="3" fill="#f2a05a" opacity=".55"/>` + [280, 294, 308, 322, 336].map(x => `<circle cx="${x}" cy="187" r="2.2" fill="#fff8ea" ${s1}/>`).join('');
  if (k === 'coffee') return `<rect x="266" y="84" width="88" height="5" rx="1.5" fill="#c98a5a" ${s1}/>` + [[276, '#8a5a3a'], [300, '#c9d48a'], [324, '#f3aec1']].map(([x, c]) => `<rect x="${x}" y="66" width="16" height="18" rx="3" fill="#fffaf0" ${s1}/><rect x="${x + 2}" y="72" width="12" height="10" rx="2" fill="${c}"/><rect x="${x - 1}" y="62" width="18" height="5" rx="1.5" fill="${aw}" ${s1}/>`).join('') +
    [280, 296, 312].map(x => `<path d="M${x} 104 h11 v5 a3 3 0 0 1 -3 3 h-5 a3 3 0 0 1 -3 -3Z" fill="#fff" ${s1}/>`).join('') +
    `<rect x="272" y="122" width="66" height="50" rx="9" fill="#d99a5f" ${s}/><rect x="268" y="113" width="74" height="10" rx="4" fill="#8a5a3a" ${s}/><circle cx="305" cy="138" r="8" fill="#fffaf0" ${s1}/><path d="M305 138 L309.5 133.5" stroke="${CZ_L}" stroke-width="1.4"/>
    <rect x="289" y="154" width="16" height="6" rx="1.5" fill="${CZ_L}"/><path d="M297 160 v4" stroke="#8a5a3a" stroke-width="2"/><path d="M291 165 h12 v4 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3Z" fill="#fff" ${s1}/>
    <path d="M330 150 q10 4 8 18" fill="none" stroke="${CZ_L}" stroke-width="2"/>${czSteam(338, 150)}
    <rect x="260" y="172" width="100" height="8" rx="2" fill="#e3b07a" ${s1}/><rect x="264" y="180" width="92" height="58" rx="3" fill="#a87a50" ${s}/><path d="M310 184 V234" stroke="${CZ_L}" stroke-width="1.2"/><circle cx="304" cy="208" r="2" fill="#f6d36b" ${s1}/><circle cx="316" cy="208" r="2" fill="#f6d36b" ${s1}/>`;
  if (k === 'freezer') return `<g transform="translate(310 58)"><path d="M-12 20 L0 56 L12 20Z" fill="#e3b06b" ${s}/><path d="M-8 28 L6 42 M-4 23 L8 35 M8 28 L-4 46 M3 21 L-8 33" stroke="#c48f55" stroke-width="1"/><circle cx="-7" cy="15" r="9" fill="#f6a6b8" ${s1}/><circle cx="7" cy="15" r="9" fill="#b8e0c8" ${s1}/><circle cx="0" cy="4" r="9" fill="#fbe4a0" ${s1}/><circle cx="0" cy="-7" r="3" fill="#e5584f" ${s1}/></g>
    <path d="M266 178 L274 152 H346 L354 178Z" fill="#dff1f8" fill-opacity=".85" ${s1}/>` + [[282, '#f6a6b8'], [302, '#fbe4a0'], [322, '#b8e0c8'], [342, '#c9b0e8']].map(([x, c]) => `<circle cx="${x - 3}" cy="170" r="4" fill="${c}"/><circle cx="${x + 3}" cy="170" r="4" fill="${c}"/><ellipse cx="${x}" cy="174" rx="8" ry="3.5" fill="${c}" ${s1}/>`).join('') +
    `${czSteam(310, 152, '#cfe9f5')}<rect x="262" y="178" width="96" height="60" rx="6" fill="#fffaf2" ${s}/><rect x="263" y="206" width="94" height="10" fill="${aw}" opacity=".55"/><path d="M276 190 h68" stroke="#e8d8cc" stroke-width="2" stroke-linecap="round"/>
    <g class="cz-ws">${cmAnimSVG('churn').replace('<svg ', '<svg x="326" y="124" width="28" height="28" ')}</g>`;
  // établi (fleuriste, mode, animalerie, librairie, brocante)
  let peg = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) peg += `<circle cx="${276 + c * 14}" cy="${98 + r * 18}" r="1.2" fill="#c9a97a"/>`;
  const tools = {
    fleuriste: `<circle cx="284" cy="112" r="7" fill="#f39ab0" ${s1}/><circle cx="284" cy="112" r="2" fill="#fffaf0"/><circle cx="302" cy="112" r="7" fill="#a9cf8e" ${s1}/><circle cx="302" cy="112" r="2" fill="#fffaf0"/><path d="M322 100 q10 12 -2 22 q-8 8 6 18" fill="none" stroke="#c9a27a" stroke-width="2"/><path d="M336 100 L346 128 M346 100 L336 128" stroke="#9aa8b4" stroke-width="2.4"/>`,
    mode: [[282, '#e5584f'], [296, '#9fd1e8'], [310, '#f6c445']].map(([x, c]) => `<rect x="${x - 5}" y="100" width="10" height="16" rx="1.5" fill="#e3c08f" ${s1}/><rect x="${x - 4}" y="103" width="8" height="10" fill="${c}"/>`).join('') + `<path d="M326 102 q16 10 0 24 q-12 10 6 26" fill="none" stroke="#f6c445" stroke-width="3"/>`,
    animalerie: `<path d="M284 100 q-12 18 4 24 q10 4 4 -8" fill="none" stroke="#3faf9a" stroke-width="2.4"/><path d="M308 112 h20" stroke="#fffaf0" stroke-width="5" stroke-linecap="round"/><circle cx="307" cy="109" r="3.4" fill="#fffaf0" ${s1}/><circle cx="307" cy="115" r="3.4" fill="#fffaf0" ${s1}/><circle cx="329" cy="109" r="3.4" fill="#fffaf0" ${s1}/><circle cx="329" cy="115" r="3.4" fill="#fffaf0" ${s1}/><path d="M309 112 h18" stroke="#fffaf0" stroke-width="5"/>`,
    librairie: `<rect x="278" y="98" width="38" height="28" rx="2" fill="#efe2c4" ${s1}/><path d="M283 118 q8 -12 16 -4 q4 4 12 -8" fill="none" stroke="#c9604f" stroke-width="1.2" stroke-dasharray="2 2"/><rect x="326" y="100" width="18" height="24" rx="2" fill="#f6e3c4" ${s1}/><path d="M330 106 h10 M330 111 h10 M330 116 h6" stroke="#c9a97a" stroke-width="1.2"/>`,
    brocante: `<path d="M286 98 V128" stroke="#a87a50" stroke-width="3"/><rect x="279" y="94" width="14" height="7" rx="1.5" fill="#9aa8b4" ${s1}/><circle cx="330" cy="114" r="12" fill="#fffaf0" ${s1}/><path d="M330 114 V106 M330 114 L336 117" stroke="${CZ_L}" stroke-width="1.4"/><path d="M302 100 L314 132" stroke="#9aa8b4" stroke-width="4"/>`,
  }[id] || '';
  const under = {
    fleuriste: `<path d="M280 238 L277 214 H303 L300 238Z" fill="#b9c4cc" ${s1}/><path d="M284 214 l-4 -12 M290 214 V198 M296 214 l5 -12" stroke="#5fa274" stroke-width="1.6"/><circle cx="280" cy="201" r="4" fill="#f39ab0" ${s1}/><circle cx="290" cy="196" r="4" fill="#f6d36b" ${s1}/><circle cx="301" cy="201" r="4" fill="${aw}" ${s1}/>`,
    mode: `<rect x="280" y="222" width="34" height="12" rx="6" fill="${aw}" ${s1}/><rect x="300" y="210" width="34" height="12" rx="6" fill="#bfe1f2" ${s1}/>`,
    animalerie: `<path d="M282 238 q-4 -22 10 -24 q14 2 10 24Z" fill="#e3c08f" ${s1}/><path d="M286 220 h12" stroke="#a87a50" stroke-width="1.4"/>`,
    librairie: `<rect x="282" y="228" width="34" height="8" fill="#5f87c9" ${s1}/><rect x="285" y="220" width="30" height="8" fill="#c9604f" ${s1}/><rect x="283" y="212" width="32" height="8" fill="#f2c14e" ${s1}/>`,
    brocante: `<rect x="282" y="216" width="40" height="20" rx="2" fill="#c98a5a" ${s1}/><path d="M282 226 h40" stroke="#a87a50" stroke-width="1.2"/><circle cx="292" cy="212" r="5" fill="#bfe3f6" ${s1}/>`,
  }[id] || '';
  return `<rect x="268" y="90" width="84" height="76" rx="4" fill="#ecd3ab" ${s}/>${peg}${tools}
    <rect x="260" y="180" width="100" height="9" rx="2" fill="#c98a5a" ${s}/><rect x="266" y="189" width="8" height="49" fill="#a87a50" ${s1}/><rect x="346" y="189" width="8" height="49" fill="#a87a50" ${s1}/><rect x="270" y="234" width="80" height="4" fill="#b98656"/>${under}
    <g class="cz-ws">${cmAnimSVG(CM_ANIM[id] || 'hammer').replace('<svg ', '<svg x="290" y="138" width="44" height="44" ')}</g>`;
}
// l'objet posé en haut de l'étagère
function czTopProp(T) {
  const id = T ? T.id : '', s = czSW(1.3), aw = T ? T.aw : '#e3a04b', aw2 = T ? T.aw2 : '#fff8ea';
  return ({
    boulangerie: [96, 106, 116].map((x, i) => `<rect x="${x}" y="14" width="7" height="24" rx="3.5" fill="#e3b06b" ${s} transform="rotate(${(i - 1) * 14} ${x + 3.5} 36)"/>`).join('') + `<path d="M90 38 h36 l-3 -12 h-30Z" fill="#c99a6a" ${s}/><path d="M94 32 h28" stroke="#a87a50" stroke-width="1"/>`,
    cafe: `<path d="M92 38 q-2 -18 16 -18 q18 0 16 18Z" fill="#9fd1e8" ${s}/><rect x="104" y="15" width="8" height="5" rx="2" fill="#9fd1e8" ${s}/><path d="M93 30 q-8 -2 -10 -9" fill="none" stroke="${CZ_L}" stroke-width="2.4"/><path d="M123 25 q8 2 4 11" fill="none" stroke="${CZ_L}" stroke-width="1.8"/><path d="M130 31 h11 v4 a3 3 0 0 1 -3 3 h-5 a3 3 0 0 1 -3 -3Z" fill="#fff" ${s}/>`,
    restaurant: [36, 32, 28, 24].map(y => `<ellipse cx="100" cy="${y}" rx="15" ry="3.5" fill="#fffaf0" ${s}/>`).join('') + `<path d="M126 38 V24 q0 -4 3 -6 V12 h4 v6 q3 2 3 6 V38Z" fill="#6fae7d" ${s}/>`,
    fleuriste: `<rect x="86" y="24" width="12" height="14" rx="3" fill="#bfe3f6" ${s}/><circle cx="88" cy="20" r="4" fill="#f39ab0" ${s}/><circle cx="96" cy="17" r="4" fill="#f6d36b" ${s}/><path d="M118 38 h18 l-2 -12 h-14Z" fill="#d98763" ${s}/><path d="M134 28 q14 10 8 30 q-6 20 6 40" fill="none" stroke="#5fa274" stroke-width="1.6"/>` + [[140, 40], [143, 54], [139, 70], [144, 86]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="#7fbf6a" ${czSW(1)}/>`).join('') + `<ellipse cx="127" cy="24" rx="5" ry="3" fill="#7fbf6a" ${czSW(1)}/>`,
    mode: `<rect x="86" y="22" width="30" height="16" rx="3" fill="${aw}" ${s}/><path d="M86 28 H116" stroke="${aw2}" stroke-width="3"/><ellipse cx="129" cy="36" rx="13" ry="3" fill="#c9a27a" ${s}/><path d="M122 36 q0 -12 7 -12 q7 0 7 12" fill="#c9a27a" ${s}/><path d="M122 32 h14" stroke="${aw}" stroke-width="2"/>`,
    animalerie: `<rect x="90" y="35" width="36" height="4" rx="1.5" fill="#a87a50" ${s}/><path d="M92 36 V24 a16 13 0 0 1 32 0 V36" fill="#fffaf0" fill-opacity=".4" ${s}/><path d="M100 36 V14 M108 36 V11 M116 36 V14" stroke="${CZ_L}" stroke-width="1"/><circle cx="108" cy="8" r="2" fill="none" ${s}/><circle cx="106" cy="28" r="5" fill="#f6d36b" ${s}/><path d="M110 28 l3 1 -3 1" fill="#e3a04b"/>`,
    glacier: `<rect x="92" y="18" width="24" height="20" rx="4" fill="#dff1f8" fill-opacity=".85" ${s}/>` + [98, 104, 110].map(x => `<path d="M${x - 3} 22 L${x} 34 L${x + 3} 22Z" fill="#e3b06b" ${czSW(1)}/>`).join('') + `<circle cx="130" cy="30" r="7" fill="#f6a6b8" ${s}/><path d="M124 34 h12 l-6 5Z" fill="#e3b06b" ${czSW(1)}/>`,
    librairie: `<rect x="86" y="32" width="32" height="6" fill="#c9604f" ${s}/><rect x="88" y="26" width="28" height="6" fill="#5f87c9" ${s}/><rect x="86" y="20" width="30" height="6" fill="#f2c14e" ${s}/>` + [[124, 18, '#6fae7d'], [130, 14, '#f39ab0'], [136, 20, '#9a6fd6']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="6" height="${38 - y}" fill="${c}" ${s}/>`).join(''),
    epicerie: [[88, '#e5584f'], [104, '#f2a93b'], [120, '#7a5fb8']].map(([x, c]) => `<rect x="${x}" y="24" width="14" height="14" rx="3" fill="#fffaf0" ${s}/><rect x="${x + 2}" y="28" width="10" height="8" rx="2" fill="${c}"/><rect x="${x - 1}" y="20" width="16" height="5" rx="1.5" fill="#fff" stroke="#e5584f" stroke-width="1.3" stroke-dasharray="2 1.5"/>`).join(''),
    brocante: `<rect x="90" y="16" width="22" height="22" rx="4" fill="#a87a50" ${s}/><circle cx="101" cy="26" r="7" fill="#fffaf0" ${s}/><path d="M101 26 V21 M101 26 L105 28" stroke="${CZ_L}" stroke-width="1.2"/><path d="M124 38 V30" stroke="${CZ_L}" stroke-width="1.6"/><rect x="118" y="34" width="12" height="4" fill="#a87a50" ${s}/><path d="M124 30 l12 -14 q5 9 -2 15Z" fill="#f2c14e" ${s}/>`,
  })[id] || `<rect x="96" y="22" width="16" height="16" rx="4" fill="#f3aec1" ${s}/><rect x="116" y="26" width="14" height="12" rx="3" fill="#bfe3f6" ${s}/>`;
}
// v26 : la fenêtre vit (nuages qui passent, rue, un chat ou un oiseau de temps en temps)
function czWinSky(night) {
  const cl = (x, y, k) => `<path d="M${x} ${y} q0 -7 8 -6 q3 -6 10 -3 q7 -2 8 5 q5 0 5 4 Z" fill="#fff" opacity="${night ? 0.25 : 0.92}" transform="scale(${k})"/>`;
  return `<g clip-path="url(#czwinc)"><g class="cz-cloud">${cl(150, 74, 1)}${cl(196, 70, 0.8)}</g><g class="cz-cloud b">${cl(170, 92, 0.85)}</g></g>`;
}
function czWinStreet(night) {
  const s1 = czSW(1), h = (x, w, ht, c, r) => `<rect x="${x}" y="${114 - ht}" width="${w}" height="${ht}" fill="${c}" ${s1}/><path d="M${x - 2} ${114 - ht} L${x + w / 2} ${114 - ht - 7} L${x + w + 2} ${114 - ht}Z" fill="${r}" ${s1}/><rect x="${x + w / 2 - 2.5}" y="${114 - ht + 4}" width="5" height="5" fill="${night ? '#f6d36b' : '#cfe8f7'}" ${czSW(.7)}/>`;
  return `<g clip-path="url(#czwinc)">${h(172, 14, 15, '#f6e3c4', '#d98763')}${h(222, 16, 12, '#f6cdb8', '#9a6fd6')}<path d="M196 114 V96" stroke="${CZ_L}" stroke-width="1.2"/><circle cx="196" cy="95" r="2.4" fill="${night ? '#f6d36b' : '#fff8ea'}" ${czSW(.8)}/><rect x="166" y="110" width="80" height="4" fill="#d9c8b0"/>
    <g class="cz-cat"><g transform="translate(160 103)"><path d="M0 7 q0 -6 7 -6 h6 q3 -4 6 0 v4 q0 3 -3 3 H2Z" fill="#7a6a5a" ${czSW(.8)}/><path d="M13 -1 l1 -3 l2 3 M17 -1 l1 -3 l1 3" fill="#7a6a5a" ${czSW(.7)}/><path d="M0 4 q-6 -2 -5 -8" fill="none" stroke="#7a6a5a" stroke-width="1.6" stroke-linecap="round"/><path d="M3 8 v3 M8 8 v3 M12 8 v3 M16 8 v3" stroke="${CZ_L}" stroke-width="1"/></g></g>
    <g class="cz-bird"><g transform="translate(252 68)"><path d="M0 0 q3 -3 6 0 q3 -3 6 0" fill="none" stroke="${CZ_L}" stroke-width="1.3" stroke-linecap="round" class="cz-wing"/></g></g></g>`;
}
// le décor au fond : mur, porte, étagères, fenêtre, enseigne, poste de travail
function czBackSVG(T) {
  const t = czTier(), id = T ? T.id : '', s = czSW(), s1 = czSW(1.2);
  const wA = T ? T.wall : '#f8e6cc', wB = T ? T.wall2 : '#f0d9bc', aw = T ? T.aw : '#e3a04b', aw2 = T ? T.aw2 : '#fff8ea', door = T ? T.door : '#b06a3a';
  let night = false; try { night = isNight(); } catch (e) {}
  const pk = { fleuriste: 'dots', animalerie: 'dots', glacier: 'wide', restaurant: 'check', epicerie: 'check', librairie: 'dia', mode: 'dia', brocante: 'dia' }[id] || 'stripe';
  const pat = { stripe: `<rect width="10" height="20" fill="${wB}" opacity=".55"/>`, wide: `<rect width="10" height="20" fill="${aw2}"/><rect x="10" width="10" height="20" fill="${wB}" opacity=".45"/>`, dots: `<circle cx="5" cy="5" r="1.8" fill="${wB}"/><circle cx="15" cy="15" r="1.8" fill="${wB}"/>`, check: `<rect width="10" height="10" fill="${wB}" opacity=".45"/><rect x="10" y="10" width="10" height="10" fill="${wB}" opacity=".45"/>`, dia: `<path d="M10 3 L17 10 L10 17 L3 10Z" fill="${wB}" opacity=".55"/>` }[pk];
  let g = `<svg viewBox="0 0 360 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true"><defs>
    <pattern id="czw" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${wA}"/>${pat}</pattern>
    <linearGradient id="czsky" x1="0" y1="0" x2="0" y2="1">${night ? '<stop offset="0" stop-color="#2f3d6b"/><stop offset="1" stop-color="#5a6aa0"/>' : '<stop offset="0" stop-color="#bfe3f4"/><stop offset="1" stop-color="#fdf0d6"/>'}</linearGradient>
    <linearGradient id="czfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4a26c"/><stop offset="1" stop-color="#e8bf8c"/></linearGradient>
    <radialGradient id="czlt"><stop offset="0" stop-color="#fff6d8" stop-opacity="${night ? 0.35 : 0.65}"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
    <clipPath id="czwinc"><rect x="166" y="58" width="80" height="56" rx="6"/></clipPath>
    <radialGradient id="czlamp"><stop offset="0" stop-color="#ffe3a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></radialGradient></defs>`;
  // mur, lambris, parquet
  g += `<rect width="360" height="238" fill="url(#czw)"/><rect width="360" height="5" fill="#e3c08f"/><ellipse cx="206" cy="100" rx="175" ry="135" fill="url(#czlt)"/>`;
  g += `<rect y="180" width="360" height="58" fill="#ecd3ab"/>` + Array.from({ length: 20 }, (_, i) => `<path d="M${9 + i * 18} 184 V236" stroke="#d6b386" stroke-width="1.1"/>`).join('') + `<rect y="176" width="360" height="6" rx="2" fill="#d9b48a" ${s1}/>`;
  g += `<rect y="236" width="360" height="144" fill="url(#czfl)"/><rect y="236" width="360" height="5" fill="#9a6a40" opacity=".3"/>`;
  const rows = [236, 256, 280, 308, 340, 380];
  for (let r = 0; r < 5; r++) { if (r) g += `<path d="M0 ${rows[r]} H360" stroke="#b98a58" stroke-width="1.1" opacity=".7"/>`; for (let x = 30 + (r % 2) * 45; x < 360; x += 90) g += `<path d="M${x} ${rows[r]} V${rows[r + 1]}" stroke="#b98a58" stroke-width="1" opacity=".55"/>`; }
  g += `<ellipse cx="190" cy="352" rx="150" ry="24" fill="#fff3d6" opacity=".22"/>`;
  if (t >= 1) g += `<ellipse cx="196" cy="348" rx="138" ry="24" fill="${aw}" opacity=".5" ${s1}/>` + (t >= 2 ? `<ellipse cx="196" cy="348" rx="120" ry="17" fill="none" stroke="${aw2}" stroke-width="2.2" stroke-dasharray="5 4"/>` : '') + (t >= 3 ? `<ellipse cx="196" cy="348" rx="92" ry="11" fill="${aw2}" opacity=".55"/>` : '');
  // guirlande de fanions (palier 1+) et lumières (palier 3)
  if (t >= 1) {
    const cols = [aw, aw2, '#a9cf8e', '#f6d36b'];
    [[0, 180], [180, 360]].forEach(([a, b]) => {
      g += `<path d="M${a} 4 Q${(a + b) / 2} 20 ${b} 4" fill="none" stroke="${CZ_L}" stroke-width="1"/>`;
      for (let i = 0; i < 10; i++) { const u = (i + 0.5) / 10, x = a + u * (b - a), y = 4 + 32 * u * (1 - u); g += `<path d="M${(x - 5).toFixed(1)} ${y.toFixed(1)} L${(x + 5).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 10).toFixed(1)}Z" fill="${cols[i % 4]}" ${czSW(0.9)}/>`; }
    });
  }
  // porte d'entrée, clochette, paillasson
  g += `<path d="M4 238 V112 a27 27 0 0 1 54 0 V238Z" fill="#b98656" ${s}/><path d="M9 238 V114 a22 22 0 0 1 44 0 V238Z" fill="${door}" ${s}/>
    <path d="M15 150 V116 a16 16 0 0 1 32 0 V150Z" fill="url(#czsky)" ${s1}/><path d="M31 100 V150 M15 128 H47" stroke="#fff8ea" stroke-width="2"/>
    <rect x="15" y="164" width="32" height="60" rx="4" fill="none" stroke="${CZ_L}" stroke-width="1.1" opacity=".4"/><circle cx="47" cy="198" r="2.6" fill="#f6c445" ${s1}/>
    <g transform="translate(17 154)"><rect width="28" height="11" rx="2.5" fill="#fffaf0" stroke="${CZ_L}" stroke-width="1.1"/><text x="14" y="8.4" text-anchor="middle" font-family="Baloo 2, Fredoka, sans-serif" font-weight="800" font-size="7.5" fill="${CZ_L}">Ouvert</text></g>
    <g class="cz-bell"><path d="M31 68 V77" stroke="${CZ_L}" stroke-width="1.2"/><path d="M26 85 q5 -13 10 0Z" fill="#f6c445" ${s1}/><circle cx="31" cy="86" r="1.6" fill="${CZ_L}"/></g>
    <rect x="2" y="240" width="58" height="8" rx="3" fill="${aw}" opacity=".85" ${s1}/>`;
  if (t >= 1) g += `<circle cx="31" cy="188" r="10" fill="none" stroke="#6fae7d" stroke-width="5"/>` + [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${(31 + 10 * Math.cos(i * 1.05)).toFixed(1)}" cy="${(188 + 10 * Math.sin(i * 1.05)).toFixed(1)}" r="2" fill="${i % 2 ? '#e5584f' : aw2}"/>`).join('') + `<path d="M27 178 l4 4 4 -4" fill="${aw}" stroke="${CZ_L}" stroke-width=".8"/>`;
  // étagères (la vitrine murale)
  g += `<rect x="68" y="44" width="80" height="194" rx="3" fill="#e3c08f" ${s}/><rect x="74" y="50" width="68" height="160" fill="#c99a6a" opacity=".32"/><rect x="64" y="38" width="88" height="8" rx="2" fill="#c98a5a" ${s}/>`;
  [96, 148, 200].forEach(y => { g += `<rect x="70" y="${y}" width="76" height="6" rx="1.5" fill="#c98a5a" ${s1}/><path d="M76 ${y + 6} l3 5 M140 ${y + 6} l-3 5" stroke="${CZ_L}" stroke-width="1"/>`; });
  g += `<rect x="72" y="212" width="72" height="22" rx="2" fill="#d9ad78" ${s1}/><circle cx="108" cy="223" r="2" fill="${CZ_L}"/>` + czTopProp(T);
  if (t >= 2) g += `<path d="M72 38 q-8 18 -2 34 q4 14 -4 30" fill="none" stroke="#5fa274" stroke-width="1.5"/>` + [[66, 52], [70, 68], [64, 86], [68, 100]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#7fbf6a" ${czSW(1)}/>`).join('');
  // fenêtre, rideaux, rebord fleuri
  g += `<path d="M148 46 H264" stroke="${CZ_L}" stroke-width="1.6"/><rect x="160" y="52" width="92" height="68" rx="10" fill="#fff8ea" ${s}/><rect x="166" y="58" width="80" height="56" rx="6" fill="url(#czsky)" ${s1}/>`;
  g += czWinSky(night);
  g += night ? `<circle cx="228" cy="72" r="6" fill="#f4efd2"/><circle cx="182" cy="66" r="1" fill="#fff"/><circle cx="198" cy="76" r="1" fill="#fff"/><circle cx="214" cy="64" r="1" fill="#fff"/>` : `<circle cx="228" cy="74" r="7" fill="#fbd76a"/><ellipse cx="186" cy="72" rx="11" ry="4" fill="#fff" opacity=".9"/>`;
  g += `<path d="M166 104 q18 -14 38 -4 q20 -12 42 0 V108 a6 6 0 0 1 -6 6 H172 a6 6 0 0 1 -6 -6Z" fill="${night ? '#4f6a72' : '#a9d08e'}"/>${czWinStreet(night)}<path d="M206 58 V114 M166 86 H246" stroke="#fff8ea" stroke-width="3"/>`;
  g += `<g class="cz-cur"><path d="M152 46 H174 q-6 34 4 58 q-14 6 -26 -2Z" fill="${aw}" ${s1}/><path d="M154 92 q10 5 20 1" fill="none" stroke="${aw2}" stroke-width="2.4"/></g><g class="cz-cur r"><path d="M260 46 H238 q6 34 -4 58 q14 6 26 -2Z" fill="${aw}" ${s1}/><path d="M258 92 q-10 5 -20 1" fill="none" stroke="${aw2}" stroke-width="2.4"/></g>`;
  g += `<circle cx="148" cy="46" r="2.6" fill="#c98a5a" ${s1}/><circle cx="264" cy="46" r="2.6" fill="#c98a5a" ${s1}/><rect x="154" y="118" width="104" height="7" rx="2.5" fill="#e3b07a" ${s1}/>`;
  g += `<path d="M168 106 h14 l-2 12 h-10Z" fill="#d98763" ${s1}/><path d="M175 106 q-8 -10 -4 -16 q4 6 4 16 q2 -12 8 -14 q0 10 -8 14" fill="#7fbf6a" ${s1}/>`;
  if (t >= 1) g += `<path d="M232 106 h14 l-2 12 h-10Z" fill="#bfe3f6" ${s1}/><path d="M236 106 l-3 -8 M239 106 V96 M242 106 l3 -8" stroke="#5fa274" stroke-width="1.4"/><circle cx="233" cy="97" r="3.4" fill="#f39ab0" ${s1}/><circle cx="239" cy="93" r="3.4" fill="#f6d36b" ${s1}/><circle cx="245" cy="97" r="3.4" fill="${aw}" ${s1}/>`;
  if (t >= 3) g += `<g transform="translate(196 104)"><rect x="0" y="0" width="12" height="14" rx="3" fill="#f6d36b" ${s1}/><circle cx="6" cy="7" r="9" fill="url(#czlamp)" class="cz-glow"/></g>`;
  // suspensions lumineuses (palier 2+)
  if (t >= 2) [156, 258].forEach(x => { g += `<circle cx="${x}" cy="34" r="26" fill="url(#czlamp)" class="cz-glow"/><path d="M${x} 0 V22" stroke="${CZ_L}" stroke-width="1"/><path d="M${x - 9} 31 q0 -9 9 -9 q9 0 9 9Z" fill="${aw}" ${s1}/><circle cx="${x}" cy="33" r="2.6" fill="#fff3b0"/>`; });
  // poste de travail du commerce
  g += `<g class="cz-st">${czStation(T)}</g>`;
  // enseigne : papier, bois, bois fleuri, or
  const nm = T ? T.short : 'Mon commerce', w = Math.max(74, nm.length * 7.4 + 30), x0 = 206 - w / 2;
  const fill = t >= 3 ? '#f6d36b' : t >= 1 ? '#dcae74' : '#fffaf0';
  g += `<path d="M${x0 + 12} 0 L${x0 + 14} 12 M${x0 + w - 12} 0 L${x0 + w - 14} 12" stroke="${CZ_L}" stroke-width="1.1"/><rect x="${x0}" y="12" width="${w}" height="25" rx="${t >= 1 ? 5 : 3}" fill="${fill}" ${s}/>`;
  if (t >= 1) g += `<path d="M${x0 + 6} 33 H${x0 + w - 6}" stroke="${t >= 3 ? '#e0a52a' : '#c48f55'}" stroke-width="1"/><circle cx="${x0 + 5}" cy="17" r="1.3" fill="${CZ_L}"/><circle cx="${x0 + w - 5}" cy="17" r="1.3" fill="${CZ_L}"/>`;
  if (t >= 2) [x0, x0 + w].forEach((x, i) => { const d = i ? 1 : -1; g += `<ellipse cx="${x - d * 2}" cy="14" rx="7" ry="4" fill="#7fbf6a" ${czSW(1)} transform="rotate(${d * 25} ${x} 14)"/><ellipse cx="${x + d * 3}" cy="22" rx="6" ry="3.5" fill="#a9cf8e" ${czSW(1)}/><circle cx="${x}" cy="15" r="4" fill="${i ? '#f39ab0' : aw2}" ${czSW(1)}/>`; });
  if (t >= 3) { g += `<rect x="${x0 + 3}" y="15" width="${w - 6}" height="19" rx="4" fill="none" stroke="#fff3b0" stroke-width="1.2"/><path d="M206 2 l2.4 5 5.4 .6 -4 3.6 1.2 5.3 -5 -2.8 -5 2.8 1.2 -5.3 -4 -3.6 5.4 -.6Z" fill="#fff3b0" stroke="#c98f1e" stroke-width="1" class="cz-twk"/>`; for (let i = 0; i <= 6; i++) g += `<circle cx="${(x0 + 6 + i * (w - 12) / 6).toFixed(1)}" cy="39.5" r="1.8" fill="#fff3b0" stroke="#c98f1e" stroke-width=".7" class="cz-twk" style="animation-delay:${(i * 0.3).toFixed(1)}s"/>`; }
  g += `<text x="206" y="29.5" text-anchor="middle" font-family="Baloo 2, Fredoka, sans-serif" font-weight="800" font-size="13" fill="#4a3528">${esc(nm)}</text>`;
  if (t >= 3) { let l = `<path d="M60 44 Q104 58 148 44 M264 44 Q312 58 360 44" fill="none" stroke="${CZ_L}" stroke-width=".9"/>`; [[60, 148], [264, 360]].forEach(([a, b]) => { for (let i = 1; i < 8; i++) { const u = i / 8, x = a + u * (b - a), y = 44 + 28 * u * (1 - u); l += `<circle cx="${x.toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="2.3" fill="${['#fff3b0', '#f9c6d3', '#c9f0dc'][i % 3]}" stroke="${CZ_L}" stroke-width=".6" class="cz-twk" style="animation-delay:${(i * 0.37 % 2.4).toFixed(2)}s"/>`; } }); g += l; }
  return g + '</svg>';
}
// le premier plan : comptoir, vitrine en verre, objets au sol
function czFrontSVG(T) {
  const t = czTier(), id = T ? T.id : '', s = czSW(), s1 = czSW(1.2), aw = T ? T.aw : '#e3a04b', aw2 = T ? T.aw2 : '#fff8ea';
  let g = `<svg viewBox="0 0 360 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">`;
  g += `<rect x="112" y="302" width="248" height="8" fill="${CZ_L}" opacity=".08"/><rect x="114" y="236" width="248" height="66" fill="#c98a5a" ${s}/>`;
  g += [126, 184, 250, 308].map(x => `<rect x="${x}" y="250" width="${x === 308 ? 44 : 48}" height="42" rx="5" fill="#d39a66" stroke="#a5683e" stroke-width="1.2"/>`).join('');
  if (t >= 1) for (let i = 0, x = 114; x < 360; x += 17, i++) g += `<path d="M${x} 238 h17 v5 a8.5 6 0 0 1 -17 0Z" fill="${i % 2 ? aw2 : aw}" ${czSW(1)}/>`;
  g += `<rect x="108" y="226" width="256" height="12" rx="4" fill="#e8c08a" ${s}/>` + (t >= 3 ? `<path d="M112 229 H362" stroke="#f2c14e" stroke-width="2"/>` : '');
  if (T) g += `<circle cx="241" cy="274" r="16" fill="#fff8ea" ${s}/><g transform="translate(228.5 261.5) scale(.62)">${bqEmblem(T.em)}</g>`;
  // vitrine en verre posée sur le comptoir
  g += `<path d="M120 226 V194 q0 -6 6 -6 H198 q6 0 6 6 V226Z" fill="#e6f4fa" fill-opacity=".4" ${s1}/><path d="M128 194 L134 220 M140 194 L143 206" stroke="#fff" stroke-width="2.4" opacity=".8" stroke-linecap="round"/><rect x="116" y="222" width="92" height="6" rx="2" fill="#a87a50" ${s1}/>`;
  // clochette de service, vase, pot à pourboires
  g += `<path d="M214 226 q9 -16 18 0Z" fill="#f2c14e" ${s1}/><rect x="211" y="224.5" width="24" height="3" rx="1.5" fill="#a87a50"/><circle cx="223" cy="209" r="1.6" fill="${CZ_L}"/>`;
  if (t >= 1) g += `<path d="M338 210 l-3 -9 M343 210 V196 M348 210 l4 -9" stroke="#5fa274" stroke-width="1.4"/><circle cx="335" cy="200" r="4" fill="#f39ab0" ${s1}/><circle cx="343" cy="194" r="4" fill="#f6d36b" ${s1}/><circle cx="352" cy="200" r="4" fill="${aw}" ${s1}/><rect x="336" y="208" width="14" height="19" rx="4" fill="#bfe3f6" ${s1}/>`;
  if (t >= 2) g += `<rect x="312" y="210" width="16" height="17" rx="3" fill="#e6f4fa" fill-opacity=".7" ${s1}/><circle cx="317" cy="222" r="2.6" fill="#f6c445" ${czSW(.8)}/><circle cx="322" cy="219" r="2.6" fill="#f6c445" ${czSW(.8)}/><rect x="311" y="207" width="18" height="4" rx="1.5" fill="#c98a5a" ${czSW(1)}/>`;
  // au sol, au premier plan
  const f = CZ_FORE[id] || 'yarn';
  g += ({
    sack: `<path d="M6 380 q-4 -40 8 -52 q-4 -8 6 -10 q10 2 6 10 q12 12 8 52Z" fill="#f3e6cf" ${s}/><path d="M20 346 V372 M15 352 l5 5 l5 -5 M15 360 l5 5 l5 -5" stroke="#c9a27a" stroke-width="1.5"/>`,
    crate: [[10, '#e5584f'], [22, '#8fbf5a'], [34, '#f2a93b'], [16, '#f2a93b'], [28, '#e5584f']].map(([x, c], i) => `<circle cx="${x}" cy="${i > 2 ? 338 : 344}" r="6" fill="${c}" ${s1}/>`).join('') + `<rect x="2" y="344" width="44" height="34" rx="2" fill="#c98a5a" ${s}/><path d="M2 356 H46 M2 367 H46" stroke="#a5683e" stroke-width="1.2"/>`,
    bucket: `<path d="M12 344 l-6 -20 M20 344 V316 M28 344 l6 -20" stroke="#5fa274" stroke-width="1.8"/><circle cx="6" cy="322" r="6" fill="#f39ab0" ${s1}/><circle cx="20" cy="313" r="6" fill="#f6d36b" ${s1}/><circle cx="34" cy="322" r="6" fill="${aw}" ${s1}/><path d="M6 380 L2 344 H38 L34 380Z" fill="#b9c4cc" ${s}/><path d="M3 352 H37" stroke="#8f9ba6" stroke-width="1.2"/>`,
    yarn: [[10, '#f39ab0'], [24, '#9fd1e8'], [38, '#f6d36b']].map(([x, c]) => `<circle cx="${x}" cy="350" r="8" fill="${c}" ${s1}/><path d="M${x - 5} 346 q5 4 10 0 M${x - 6} 352 q6 3 12 -1" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/>`).join('') + `<path d="M0 380 V356 H48 V380Z" fill="#d9ad78" ${s}/><path d="M0 366 H48" stroke="#b98656" stroke-width="1.2"/>`,
    board: `<path d="M8 380 L18 322 H38 L48 380" fill="none" stroke="#a87a50" stroke-width="3"/><rect x="12" y="326" width="32" height="38" rx="2" fill="#3f4a45" ${s}/>` + (id === 'glacier' ? `<path d="M22 342 L28 358 L34 342Z" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="28" cy="338" r="5" fill="none" stroke="#f6a6b8" stroke-width="1.6"/>` : `<path d="M20 344 h14 v6 a5 5 0 0 1 -5 5 h-4 a5 5 0 0 1 -5 -5Z M34 346 h3 a2 2 0 0 1 0 4 h-3" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M24 340 q-2 -3 0 -6 M30 340 q-2 -3 0 -6" fill="none" stroke="#fff" stroke-width="1.2"/>`),
    books: `<rect x="2" y="368" width="42" height="10" fill="#5f87c9" ${s1}/><rect x="6" y="358" width="36" height="10" fill="#c9604f" ${s1}/><rect x="4" y="348" width="38" height="10" fill="#f2c14e" ${s1}/><path d="M22 348 V330" stroke="${CZ_L}" stroke-width="1.6"/><path d="M14 330 h16 l-3 -10 h-10Z" fill="${aw}" ${s1}/>`,
  })[f];
  // (la grande plante du premier plan est dans czForeSVG)
  return g + '</svg>';
}
// les familiers au travail : les commis du foyer, sinon le familier choisi
function czWorkers() {
  let ks = [], commis = false;
  try { ks = fwWho('comm').slice(0, 2); commis = ks.length > 0; } catch (e) {}
  if (!ks.length) { try { const k = CHARS[S.sel] && !(S.trips && S.trips[S.sel]) ? S.sel : (typeof teamIds === 'function' ? teamIds() : []).find(x => !(S.trips && S.trips[x])); if (k) ks = [k]; } catch (e) {} }
  return { ks, commis };
}
// v26 : le familier, GRAND, derrière le comptoir ; pendant une préparation on le voit faire la recette
// (geste animé selon la recette, ustensile en main, compte à rebours au-dessus ; le produit grandit sur le plan de travail)
const CZ_GEST_SHOP = { boulangerie: ['petrir', 'rouleau'], cafe: ['verser', 'theiere'], restaurant: ['melanger', 'cuillere'], fleuriste: ['emballer', 'ruban'], mode: ['couper', 'ciseaux'],
  animalerie: ['melanger', 'cuillere'], glacier: ['melanger', 'fouet'], librairie: ['emballer', 'ruban'], epicerie: ['emballer', 'ruban'], brocante: ['couper', 'marteau'] };
const CZ_GEST_R = { bo_tarte: ['melanger', 'fouet'], bo_voyage: ['melanger', 'fouet'], bo_piece: ['emballer', 'ruban'], ca_choco: ['melanger', 'cuillere'], ca_viennois: ['melanger', 'fouet'], ca_jus: ['couper', 'couteau'],
  re_croque: ['couper', 'couteau'], re_poisson: ['couper', 'couteau'], fl_couronne: ['couper', 'ciseaux'], fl_pot: ['verser', 'arrosoir'], fl_herbier: ['couper', 'ciseaux'], mo_echarpe: ['emballer', 'aiguilles'], mo_bonnet: ['emballer', 'aiguilles'],
  an_fruits: ['couper', 'couteau'], an_biscuit: ['petrir', 'rouleau'], an_jouet: ['couper', 'marteau'], an_panier: ['emballer', 'ruban'], an_royal: ['emballer', 'ruban'], an_nid: ['emballer', 'ruban'],
  gl_shake: ['verser', 'theiere'], li_carte: ['couper', 'plume'], li_loin: ['couper', 'plume'], li_atlas: ['couper', 'plume'], li_herbier: ['couper', 'ciseaux'],
  ep_jus: ['verser', 'theiere'], ep_confiture: ['melanger', 'cuillere'], ep_plateau: ['couper', 'couteau'], ep_epices: ['verser', 'theiere'], br_lanterne: ['emballer', 'ruban'], br_bocal: ['emballer', 'ruban'] };
const CZ_GEST_TXT = { petrir: 'Pétrit', couper: 'Coupe', verser: 'Verse', melanger: 'Mélange', emballer: 'Emballe' };
const czGest = R => CZ_GEST_R[R.id] || CZ_GEST_SHOP[R.shop] || ['melanger', 'cuillere'];
const CZ_TOOL = {
  rouleau: `<rect x="4" y="16" width="32" height="8" rx="4" fill="#e3c08f" ${czSW(1.4)}/><rect x="0" y="18" width="6" height="4" rx="2" fill="#a87a50" ${czSW(1.1)}/><rect x="34" y="18" width="6" height="4" rx="2" fill="#a87a50" ${czSW(1.1)}/>`,
  couteau: `<path d="M6 30 L24 12 q8 -6 10 -2 L14 30Z" fill="#dfe6ec" ${czSW(1.4)}/><rect x="1" y="28" width="12" height="6" rx="3" fill="#a87a50" ${czSW(1.2)} transform="rotate(-45 7 31)"/>`,
  ciseaux: `<path d="M20 20 L36 6 M20 20 L36 30" stroke="#9aa8b4" stroke-width="3.4" stroke-linecap="round"/><circle cx="12" cy="27" r="5" fill="none" stroke="#d9604f" stroke-width="3"/><circle cx="12" cy="13" r="5" fill="none" stroke="#d9604f" stroke-width="3"/>`,
  theiere: `<ellipse cx="18" cy="24" rx="12" ry="10" fill="#f6c2cf" ${czSW(1.4)}/><path d="M29 21 Q36 15 38 10" fill="none" ${czSW(2.4)}/><path d="M7 19 Q1 23 7 29" fill="none" ${czSW(2)}/><rect x="13" y="11" width="10" height="4" rx="2" fill="#e9a0b4" ${czSW(1.1)}/>`,
  arrosoir: `<path d="M8 16 H28 V34 H8Z" fill="#9fd1e8" ${czSW(1.4)}/><path d="M28 22 L38 12" ${czSW(2.4)}/><path d="M8 20 Q2 24 8 30" fill="none" ${czSW(2)}/>`,
  cuillere: `<path d="M8 34 L26 12" stroke="#a87a50" stroke-width="3.6" stroke-linecap="round"/><ellipse cx="29" cy="8" rx="5" ry="7" fill="#c99a6a" ${czSW(1.3)} transform="rotate(40 29 8)"/>`,
  fouet: `<path d="M8 34 L20 20" stroke="#a87a50" stroke-width="3.6" stroke-linecap="round"/><path d="M20 20 C18 6 30 2 34 6 C38 10 34 22 20 20Z M20 20 C24 10 30 6 34 6" fill="none" stroke="#9aa8b4" stroke-width="1.8"/>`,
  ruban: `<path d="M20 20 q-12 -12 -14 -4 q-1 8 14 4 q12 -12 14 -4 q1 8 -14 4Z" fill="#f39ab0" ${czSW(1.3)}/><path d="M20 20 l-6 14 M20 20 l6 14" stroke="#f39ab0" stroke-width="3.4" stroke-linecap="round"/><circle cx="20" cy="20" r="3" fill="#e9748f" ${czSW(1)}/>`,
  marteau: `<path d="M10 34 L26 16" stroke="#a87a50" stroke-width="3.6" stroke-linecap="round"/><rect x="18" y="4" width="18" height="9" rx="2" fill="#9aa8b4" ${czSW(1.4)} transform="rotate(42 27 9)"/>`,
  plume: `<path d="M8 34 L32 4 C38 12 30 24 14 30Z" fill="#fbf8f0" ${czSW(1.4)}/><path d="M8 34 L26 12" stroke="${CZ_L}" stroke-width="1"/>`,
  aiguilles: `<path d="M6 32 L32 6 M10 34 L34 12" stroke="#c99a6a" stroke-width="2.6" stroke-linecap="round"/><circle cx="22" cy="26" r="8" fill="#a9cf8e" ${czSW(1.3)}/><path d="M16 23 q6 4 12 0 M16 28 q6 3 12 -1" fill="none" stroke="#fff" stroke-width="1.2"/>`,
};
const czToolSVG = k => `<svg viewBox="0 0 40 40" aria-hidden="true">${CZ_TOOL[k] || CZ_TOOL.cuillere}</svg>`;
// les préparations en cours, de la plus avancée à la moins avancée
function czActive() { const now = Date.now(); try { return cmState().sl.map((x, i) => (x && CM_R[x.rid] && !x.pause && now < x.end ? { x, i, R: CM_R[x.rid] } : null)).filter(Boolean).sort((a, b) => a.x.end - b.x.end); } catch (e) { return []; } }
const CZ_PET = [[226, 112], [318, 90]]; // [centre x, largeur] dans le repère 360×380 ; pieds cachés derrière le comptoir (y 250)
function czPetsHTML() {
  const { ks, commis } = czWorkers(), act = czActive(), now = Date.now();
  return ks.map((k, i) => {
    const [cx, w] = CZ_PET[i] || CZ_PET[0], h = w * 350 / 320, top = 246 - h, job = act[i];
    let svg = ''; try { svg = drawChar(k, S.outfits[k], job ? 'rire' : 'content', 'czk' + i); } catch (e) {}
    let tool = '', bar = '';
    if (job) {
      const [g, tk] = czGest(job.R), left = Math.max(0, job.x.end - now), el = job.x.dur - left;
      tool = `<i class="cz-tool t-${tk}">${czToolSVG(tk)}</i>`;
      bar = `<span class="cz-pbar" style="left:${czX(cx - 46)};top:${czY(top - 22)};width:${czX(92)}"><b>${CZ_GEST_TXT[g]} <span data-cmleft="${job.x.end}">⏱ ${Math.ceil(left / 1000)} s</span></b><i><u style="width:${Math.round(el / job.x.dur * 100)}%;animation-duration:${(job.x.dur / 1000).toFixed(2)}s;animation-delay:-${(el / 1000).toFixed(2)}s"></u></i></span>`;
      return `<span class="cz-pet busy g-${g}" data-czpet="${esc(k)}" style="left:${czX(cx - w / 2)};top:${czY(top)};width:${czX(w)}"><span class="cz-pb">${svg}${tool}${commis ? `<i class="cz-job" title="Commis">${CZ_IC.hat}</i>` : ''}</span></span>${bar}`;
    }
    return `<span class="cz-pet" data-czpet="${esc(k)}" style="left:${czX(cx - w / 2)};top:${czY(top + 4)};width:${czX(w)};animation-delay:-${(i * 0.9).toFixed(2)}s"><span class="cz-pb">${svg}${commis ? `<i class="cz-job" title="Commis">${CZ_IC.hat}</i>` : ''}</span></span>`;
  }).join('');
}
// le produit qui grandit sur le plan de travail, devant le familier
function czMakeHTML() {
  const act = czActive(), now = Date.now(), { ks } = czWorkers();
  return act.slice(0, Math.max(1, Math.min(2, ks.length))).map((j, i) => {
    const cx = (CZ_PET[i] || CZ_PET[0])[0] + (i ? 20 : 44), left = Math.max(0, j.x.end - now), el = j.x.dur - left;
    return `<span class="cz-make" style="left:${czX(cx - 21)};top:${czY(188)};width:${czX(42)}"><span style="animation-duration:${(j.x.dur / 1000).toFixed(2)}s;animation-delay:-${(el / 1000).toFixed(2)}s">${cmIcon(j.R, 'czm' + i)}</span><i></i></span>`;
  }).join('');
}
// le premier plan : grande plante qui se balance, plante suspendue, bord de l'image
function czForeSVG(T) {
  const t = czTier(), s = czSW(1.4), lf = (d, c) => `<path d="${d}" fill="${c}" ${s}/>`;
  let g = `<svg viewBox="0 0 360 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">`;
  // plante suspendue en haut à gauche (cadre la scène, au plus près)
  g += `<g class="cz-sway sl"><path d="M6 0 V38" stroke="${CZ_L}" stroke-width="1.2"/><path d="M-6 38 H22 L19 52 H-3Z" fill="#d98763" ${s}/><path d="M-6 42 H22" stroke="#f6e3c4" stroke-width="2"/>`
    + [[0, 52, 60], [9, 52, 80], [18, 52, 48]].map(([x, y, l], i) => `<path d="M${x} ${y} q${i % 2 ? 6 : -6} ${l / 2} 0 ${l}" fill="none" stroke="#5fa274" stroke-width="1.6"/>` + Array.from({ length: 4 }, (_, k) => { const yy = y + 10 + k * l / 4.2, xx = x + (k % 2 ? 4 : -4); return `<ellipse cx="${xx}" cy="${yy.toFixed(1)}" rx="5.5" ry="3.4" fill="${k % 2 ? '#7fbf6a' : '#8fcf7a'}" ${czSW(1)} transform="rotate(${k % 2 ? 30 : -30} ${xx} ${yy.toFixed(1)})"/>`; }).join('')).join('') + `</g>`;
  // grande plante en pot, à droite, au premier plan
  g += `<g class="cz-sway sr">` + lf('M344 360 C318 344 304 322 300 296 C318 304 334 324 344 360Z', '#7fbf6a') + lf('M344 360 C346 330 356 312 368 300 V344 C360 350 350 354 344 360Z', '#5fa274')
    + lf('M344 360 C334 328 334 300 342 278 C352 300 352 330 344 360Z', '#8fcf7a') + lf('M344 360 C326 336 318 316 322 290 C336 304 342 330 344 360Z', '#6fae6d') + `<path d="M344 360 L342 282 M344 360 L306 300" stroke="#4f8a5a" stroke-width="1"/></g>`
    + `<path d="M318 384 L314 352 H370 L366 384Z" fill="#d98763" ${czSW(1.8)}/><path d="M314 358 H370" stroke="#f6e3c4" stroke-width="3"/>`;
  if (t >= 2) g += `<circle cx="326" cy="312" r="4" fill="#f39ab0" ${czSW(1)}/><circle cx="350" cy="298" r="3.4" fill="#f6d36b" ${czSW(1)}/>`;
  return g + '</svg>';
}
// rayon de soleil en diagonale, avec la poussière qui scintille
function czSunHTML() {
  let night = false; try { night = isNight(); } catch (e) {}
  const dust = Array.from({ length: 9 }, (_, i) => `<i style="left:${(18 + (i * 37) % 64)}%;top:${(12 + (i * 53) % 70)}%;animation-delay:-${(i * 1.3).toFixed(1)}s;animation-duration:${(7 + (i % 4) * 1.6).toFixed(1)}s"></i>`).join('');
  return `<div class="cz-sun${night ? ' night' : ''}" aria-hidden="true"><span class="cz-beam"></span><span class="cz-dust">${dust}</span></div>`;
}
// la couche vivante : zones à toucher, vitrine, préparations en cours, clients
function czLayerHTML() {
  const s = bqState(), c = cmState(), T = cmT(), now = Date.now(), bench = !(T && CZ_WS[T.id]);
  let h = `<button class="cz-zone" data-czgo="prep" style="left:${czX(258)};top:${czY(50)};width:${czX(102)};height:${czY(188)}" aria-label="${bench ? 'L’établi' : 'Les fourneaux'} : préparer"></button>`
    + `<button class="cz-zone" data-czgo="stock" style="left:${czX(60)};top:${czY(10)};width:${czX(94)};height:${czY(228)}" aria-label="Les étagères : le stock"></button>`
    + `<button class="cz-zone" data-czgo="stock" style="left:${czX(114)};top:${czY(184)};width:${czX(96)};height:${czY(46)}" aria-label="La vitrine : le stock"></button>`;
  // réputation (le palier fait évoluer le décor)
  const L = s.lvl, lv = bqLv(L), nx = BQ_LEVELS[L + 1], f = nx ? (s.rep - lv.rep) / (nx.rep - lv.rep) : 1;
  h += `<button class="cz-lv" data-czgo="cli" aria-label="Réputation : ${esc(lv.name)}">${BQ_STAR}<b>${L + 1}</b><span><i style="width:${Math.round(Math.max(0.06, Math.min(1, f)) * 100)}%"></i></span></button>`;
  // produits prêts : d'abord la vitrine en verre, puis les étagères
  if (T) {
    const prods = cmProducts(T.id).slice().sort((a, b) => (a.mk.rid < b.mk.rid ? -1 : a.mk.rid > b.mk.rid ? 1 : b.mk.st - a.mk.st));
    const spots = [[125, 196, 24], [151, 196, 24], [177, 196, 24], [76, 66, 30], [110, 66, 30], [76, 118, 30], [110, 118, 30], [76, 170, 30], [110, 170, 30]];
    h += prods.slice(0, spots.length).map((it, i) => { const [x, y, z] = spots[i], nw = czSeenNew('p' + it.id); return `<span class="cz-pr${nw ? ' new' : ''}${i < 3 ? ' vit' : ''}" data-rid="${it.mk.rid}" style="left:${czX(x)};top:${czY(y)};width:${czX(z)};animation-delay:${nw ? (i * 0.06).toFixed(2) : 0}s">${cmIcon(CM_R[it.mk.rid], 'czp' + i)}${it.mk.st >= 3 ? '<i>★</i>' : ''}</span>`; }).join('');
    if (prods.length > spots.length) h += `<span class="cz-more" style="left:${czX(118)};top:${czY(48)}">+${prods.length - spots.length}</span>`;
  }
  // préparations en cours, au-dessus du poste (anneau = progression ; étoile = défi rapide)
  const chips = c.sl.map((x, i) => {
    if (!x || !CM_R[x.rid]) return '';
    const R = CM_R[x.rid], left = Math.max(0, x.end - now), el = x.dur - left, df = x.ch && !x.chd;
    return `<button class="cz-chip${x.pause ? ' paused' : ''}${df ? ' defi' : ''}" ${df ? `data-cmdefi="${i}"` : 'data-czgo="prep"'} aria-label="${esc(R.def[0])}${df ? ' : défi rapide !' : ''}"><svg class="cz-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" pathLength="100"/><circle class="on" cx="18" cy="18" r="16" pathLength="100" style="animation-duration:${(x.dur / 1000).toFixed(2)}s;animation-delay:-${(el / 1000).toFixed(2)}s"/></svg><span>${cmIcon(R, 'czc' + i)}</span>${df ? '<i>★</i>' : ''}</button>`;
  }).join('');
  h += czMakeHTML();
  if (chips) h += `<div class="cz-chips" style="left:${czX(256)};top:${czY(44)};width:${czX(104)}">${chips}</div>`;
  // clients : flâneur, commandes spéciales, acheteurs
  const os = s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).slice(0, 2);
  const buys = c.buy.filter(b => !T || b.shop === T.id).slice(0, 2);
  const busySet = new Set([...s.orders.map(o => o.client), ...c.buy.map(b => b.cid)]);
  if (os.length < 2 && !czRM()) {
    if (!czWalkC || now - czWalkT > 60e3 || busySet.has(czWalkC) || !BQC(czWalkC)) {
      const ids = ((T && BQ_SHOP_CLIENTS[T.id]) || []).filter(id => BQC(id) && !busySet.has(id)), pool = ids.length ? ids : BQ_CLIENTS.map(x => x.id).filter(id => !busySet.has(id));
      czWalkC = pool.length ? pick(pool) : null; czWalkT = now;
    }
    const wc = czWalkC && BQC(czWalkC);
    if (wc) h += `<span class="cz-walk" style="left:${czX(66)};bottom:${(52 / 3.8).toFixed(2)}%;width:${czX(70)};--fx:-96%;--fy:-128%" aria-hidden="true"><img src="${czURI(wc, 'content')}" alt=""></span>`;
  }
  const cl = (cx, key, attr, cls, bub, img, label) => {
    const nw = czSeenNew(key); if (nw) czDing = true;
    return `<button class="cz-cl ${cls}${nw ? ' in' : ''}" ${attr} style="left:${czX(cx - 52)};--fx:${Math.round((31 - cx) / 104 * 100)}%;--fy:-150%" aria-label="${label}"><span class="cz-bub">${bub}</span><span class="cz-who" style="animation-delay:-${(cx % 7).toFixed(1)}s"><img src="${img}" alt=""></span></button>`;
  };
  const OK = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#5fbf7f" stroke="#3a8f5a" stroke-width="1.6"/><path d="M5.6 10.4 L8.6 13.2 L14.4 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  os.forEach((o, i) => {
    const q = BQC(o.client); if (!q) return;
    const ready = !o.pend && bqReady(o), al = bqAllocate(o), miss = o.req.find((r, j) => al[j].have < r.n);
    h += cl([314, 58][i], 'o' + o.id, `data-b2ord="${o.id}"`, `ord${ready ? ' ready' : ''}${o.pend ? ' pend' : ''}`, (ready ? OK : bqReqIcon(miss || o.req[0])) + (o.pend ? '<em class="cz-new">!</em>' : ''), czURI(q, ready ? 'joie' : 'content'), `${esc(q.name)} : commande spéciale${ready ? ', toucher pour livrer' : ''}`);
  });
  buys.forEach((b, i) => {
    const q = BQC(b.cid), R = CM_R[b.rid]; if (!q || !R) return;
    const best = cmProducts(b.shop).filter(x => x.mk.rid === b.rid).sort((a, z) => z.mk.st - a.mk.st)[0];
    h += cl([150, 240][i], 'b' + b.id, `data-cmsell="${b.id}"`, `cm-buy buy${best ? '' : ' wait'}`, cmIcon(R, 'czb' + i) + (best ? `<em>${best.mk.p + (b.shop === 'glacier' ? 5 : 0)}</em>` : `<em class="cz-todo">À préparer</em>`), czURI(q, best ? 'joie' : 'content'), `${esc(q.name)} veut « ${esc(R.def[0])} »${best ? ' : toucher pour vendre' : ' : à préparer'}`);
  });
  return h;
}
// le client servi repart vers la porte, content : petit saut, cœur
const czGhostOf = el => { try { return { left: el.style.left, fx: el.style.getPropertyValue('--fx'), src: el.querySelector('img').src }; } catch (e) { return null; } };
function czGhost(g) {
  if (!g || czRM()) return; const sc = $('czScene'); if (!sc) return;
  const d = document.createElement('span'); d.className = 'cz-ghost'; d.setAttribute('aria-hidden', 'true');
  d.style.left = g.left; d.style.setProperty('--fx', g.fx); d.style.setProperty('--fy', '-150%');
  d.innerHTML = `<img src="${g.src}" alt=""><i>${CZ_IC.cli}</i>`; sc.appendChild(d); setTimeout(() => d.remove(), 2100);
}
// v26 : effets de vente (avant de redessiner : où sont le client et le produit)
function czFxFrom(el, rid) {
  try {
    const sc = $('czScene'), pr = sc.querySelector(`.cz-pr.vit[data-rid="${rid}"]`) || sc.querySelector(`.cz-pr[data-rid="${rid}"]`) || sc.querySelector('.cz-front');
    const img = el.querySelector('img');
    const S0 = sc.getBoundingClientRect(), rel = R => ({ x: (R.left - S0.left) / S0.width, y: (R.top - S0.top) / S0.height, w: R.width / S0.width, h: R.height / S0.height });
    return { gh: czGhostOf(el), c: rel((img || el).getBoundingClientRect()), p: rel(pr.getBoundingClientRect()), ic: cmIcon(CM_R[rid], 'czfx') };
  } catch (e) { return null; }
}
const CZ_COIN = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#f6c445" stroke="#5b4636" stroke-width="2.4"/><circle cx="20" cy="20" r="9.5" fill="none" stroke="#fff3c4" stroke-width="2.2"/><path d="M15 14 l3 2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
function czSaleFx(fx, pay) {
  try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
  if (!fx) return;
  czGhost(fx.gh);
  if (czRM() || !document.body.animate) return;
  const box = document.createElement('div'); box.className = 'cz-fx'; box.setAttribute('aria-hidden', 'true'); document.body.appendChild(box);
  const mk = (cls, html, sz) => { const e = document.createElement('span'); e.className = cls; e.innerHTML = html; e.style.width = e.style.height = sz + 'px'; box.appendChild(e); return e; };
  const sc = $('czScene'); if (!sc) return; const S1 = sc.getBoundingClientRect(), abs = q => ({ left: S1.left + q.x * S1.width, top: S1.top + q.y * S1.height, width: q.w * S1.width, height: q.h * S1.height });
  const C = abs(fx.c), P = abs(fx.p), cx = C.left + C.width / 2, cy = C.top + C.height * 0.62;
  // 1. le produit saute du comptoir dans le sac du client
  const ps = Math.max(26, Math.min(44, P.width || 34)), px = P.left + P.width / 2 - ps / 2, py = P.top + P.height / 2 - ps / 2;
  mk('cz-fxp', fx.ic, ps).animate([
    { transform: `translate(${px}px,${py}px) scale(1)`, opacity: 1 },
    { transform: `translate(${(px + cx - ps / 2) / 2}px,${Math.min(py, cy) - 70}px) scale(1.25) rotate(-12deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${cx - ps / 2}px,${cy - ps / 2}px) scale(.35) rotate(8deg)`, opacity: 0.2 },
  ], { duration: 650, easing: 'cubic-bezier(.3,.6,.5,1)', fill: 'forwards' });
  // 2. le petit « +15 » qui monte
  const t = mk('cz-fxt', `+${pay}`, 0); t.style.width = t.style.height = '';
  t.animate([{ transform: `translate(${cx}px,${C.top + 6}px) translate(-50%,0) scale(.6)`, opacity: 0 }, { transform: `translate(${cx}px,${C.top - 16}px) translate(-50%,0) scale(1.15)`, opacity: 1, offset: 0.25 }, { transform: `translate(${cx}px,${C.top - 52}px) translate(-50%,0) scale(1)`, opacity: 0 }],
    { duration: 1300, delay: 350, easing: 'ease-out', fill: 'both' });
  // 3. les pièces volent vers le compteur du HUD
  const hud = $('coins'), H = hud ? hud.getBoundingClientRect() : { left: innerWidth - 80, top: 10, width: 60, height: 30 };
  const hx = H.left + Math.min(H.width, 40) / 2 - 11, hy = H.top + H.height / 2 - 11, n = Math.max(3, Math.min(7, Math.round(pay / 8)));
  for (let i = 0; i < n; i++) {
    const sx = cx - 11 + (i - n / 2) * 7, sy = C.top + 10;
    mk('cz-fxc', CZ_COIN, 22).animate([
      { transform: `translate(${sx}px,${sy}px) scale(.3)`, opacity: 0 },
      { transform: `translate(${sx + (i % 2 ? 14 : -14)}px,${sy - 34 - (i % 3) * 8}px) scale(1)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${hx}px,${hy}px) scale(.7)`, opacity: 1 },
    ], { duration: 900, delay: 420 + i * 70, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'both' });
  }
  setTimeout(() => { const h2 = $('coins'); if (h2 && h2.animate) h2.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 260, iterations: 2 }); }, 1300);
  setTimeout(() => box.remove(), 2400);
}
// v26 : légère parallaxe (toucher, souris, défilement) : chaque plan glisse de quelques pixels
let czParRaf = 0, czParX = 0, czParY = 0;
function czParApply() {
  czParRaf = 0; const sc = $('czScene'); if (!sc) return;
  const r = sc.getBoundingClientRect(), vis = r.bottom > 0 && r.top < innerHeight;
  sc.classList.toggle('off', !vis); if (!vis) return;
  const sy = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2)));
  sc.style.setProperty('--px', czParX.toFixed(3)); sc.style.setProperty('--py', Math.max(-1, Math.min(1, czParY * 0.7 + sy * 0.6)).toFixed(3));
}
const czParQ = () => { if (!czParRaf) czParRaf = requestAnimationFrame(czParApply); };
document.addEventListener('pointermove', ev => {
  const sc = ev.target && ev.target.closest && ev.target.closest('#czScene'); if (!sc || czRM()) return;
  const r = sc.getBoundingClientRect(); czParX = Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width - 0.5) * 2)); czParY = Math.max(-1, Math.min(1, ((ev.clientY - r.top) / r.height - 0.5) * 2)); czParQ();
}, { passive: true });
document.addEventListener('pointerout', ev => { const sc = $('czScene'); if (sc && sc.contains(ev.target) && !(ev.relatedTarget && sc.contains(ev.relatedTarget))) { czParX = czParY = 0; czParQ(); } }, { passive: true });
document.addEventListener('pointerup', ev => { if (ev.pointerType === 'touch' && ev.target && ev.target.closest && ev.target.closest('#czScene')) { czParX = czParY = 0; czParQ(); } }, { passive: true });
document.addEventListener('scroll', () => { if (!czRM() && document.getElementById('czScene')) czParQ(); }, { passive: true, capture: true });
function czAfter() {
  czParQ();
  if (!czDing) return; czDing = false; const sc = $('czScene'); if (!sc || czRM()) return;
  sc.classList.remove('ding'); void sc.offsetWidth; sc.classList.add('ding'); setTimeout(() => sc.classList.remove('ding'), 1500);
}
function czSceneHTML() {
  const T = cmT();
  return `<div class="cz-wrap"><div class="cz-scene t${czTier()}${czBusy() ? ' busy' : ''}" id="czScene"><div class="cz-back cz-p1">${czBackSVG(T)}</div>${czSunHTML()}<div class="cz-pets cz-p2" id="czPets">${czPetsHTML()}</div><div class="cz-front cz-p2">${czFrontSVG(T)}</div><div class="cz-layer cz-p3" id="czLayer">${czLayerHTML()}</div><div class="cz-fore cz-p4">${czForeSVG(T)}</div></div></div>`;
}

function cmKitchenHTML() {
  const T = cmT(), c = cmState(), now = Date.now(), lab = T && !CZ_WS[T.id] ? 'L’établi' : 'Les fourneaux';
  const slots = c.sl.map((x, i) => {
    if (!x) return `<div class="cm-slot empty"><span class="cm-plus">+</span><small>Libre</small></div>`;
    const R = CM_R[x.rid], left = Math.max(0, x.end - now), el = x.dur - left;
    const defi = x.ch && !x.chd ? `<button class="btn gold sm cm-defib" data-cmdefi="${i}">Défi !</button>` : x.chd === 1 ? `<span class="cm-ok">Défi réussi</span>` : '';
    return `<div class="cm-slot on${x.pause ? ' paused' : ''}"><span class="cm-an">${cmAnimSVG(CM_ANIM[x.shop] || 'pot')}</span><span class="cm-sp">${cmIcon(R, 'cms' + i)}</span>${cmStars(x.st)}<span class="cm-bar"><i style="animation-duration:${(x.dur / 1000).toFixed(2)}s;animation-delay:-${(el / 1000).toFixed(2)}s"></i></span><small class="cm-left" data-cmleft="${x.end}">${left > 0 ? `⏱ ${Math.ceil(left / 1000)} s` : 'Prêt ✔'}</small>${defi}</div>`;
  }).join('');
  const adv = T && CM_ADV[T.id] ? `<button class="cz-adv" data-czadv="1">${esc(CM_ADV[T.id][0])}</button>` : '';
  return `<section class="cm-kit" id="cmKitchen"><h3 class="cz-h">${CZ_IC.prep}<span>${lab}</span>${adv}</h3><div class="cm-slots" style="grid-template-columns:repeat(${c.sl.length},1fr)">${slots}</div></section>`;
}
function czStockHTML() {
  const T = cmT(); if (!T) return '';
  const prods = cmProducts(T.id), by = {};
  prods.forEach(it => { (by[it.mk.rid] = by[it.mk.rid] || []).push(it); });
  const ic = Object.entries(by).map(([rid, l]) => `<span class="cz-si" title="${esc(CM_R[rid].def[0])}">${cmIcon(CM_R[rid], 'czs' + rid)}<i>${l.length}</i></span>`).join('');
  return `<div class="cz-stock${prods.length ? '' : ' empty'}" id="czStock">${CZ_IC.shelf}${prods.length ? `<span class="cz-sl">${ic}</span><button class="btn cream sm" data-cmmk="1">Surplus au marché</button>` : '<span class="cz-sl0">Vitrine vide : préparez une recette !</span>'}</div>`;
}
function cmRecipesHTML() {
  const T = cmT(); if (!T) return '';
  const c = cmState(), free = c.sl.some(x => !x);
  const cards = (CM_LINES[T.id] || []).map(R => {
    const un = cmUnlocked(R), ok = un && cmCanIng(R) && free && !(R.egg && c.eggDay === dayKey());
    const ings = R.ing.map(([k, n]) => { const h = cmHave(k); return `<span class="cm-ing${h >= n ? ' ok' : ''}" data-cfing="${k}" data-cfr="${R.id}" title="${esc(cmIngName(k))}">${cmIngIcon(k)}<i>${Math.min(h, n)}/${n}</i></span>`; }).join('');
    const price = R.egg ? `<span class="cm-pr">Œuf · 1 par jour</span>` : `<span class="cm-pr">${coins(cmPrice(R, 1))}<small> → ${cmPrice(R, 3)} ${cmStars(3)}</small></span>`;
    const lock = R.x ? 'Récompense Défi' : `Réputation ${R.rep}`;
    const far = R.ing.some(([k]) => k === 'far');
    return `<div class="cm-r${un ? '' : ' locked'}${ok ? ' can' : ''}" data-cfcard="${R.id}"><i class="cm-rt">⏱ ${Math.round(cmDur(R))} s</i><span class="cm-rp">${cmIcon(R, 'cmr' + R.id)}${far ? '<i class="cm-far">De loin</i>' : ''}</span><b>${esc(R.def[0])}</b><span class="cm-ings">${ings}</span>${price}${un ? `<button class="btn ${ok ? 'green' : 'cream'} sm" data-cmprep="${R.id}" ${ok ? '' : 'aria-disabled="true"'}>Préparer</button>` : `<span class="cm-lock">${CM_LOCK}${esc(lock)}</span>`}</div>`;
  }).join('');
  return `<section class="cm-recs"><h3 class="cz-h">${CZ_IC.cmd}<span>Recettes</span></h3><div class="cm-rgrid">${cards}</div></section>`;
}
const czPrepHTML = () => cmKitchenHTML() + czStockHTML() + cmRecipesHTML();
// v29 : plus d'onglet Commandes ; la commande guidée du tutoriel (seule commande restante) s'affiche en haut de « Préparer »
function cmOrdersHTML() {
  const s = bqState(); if (!s.orders.length) return '';
  return `<section class="cm-ords"><h3 class="cz-h">${CZ_IC.cmd}<span>Votre premier client</span></h3><div class="b2cards">${s.orders.map(cmOrderCard).join('')}</div></section>`;
}
function czTabsHTML() {
  const c = cmState();
  const run = c.sl.filter(x => x).length, defi = c.sl.some(x => x && x.ch && !x.chd);
  let fav = 0; try { fav = cfNewPerks(); } catch (e) {}
  return [['prep', 'Préparer', CZ_IC.prep, defi ? '<i class="cz-n gold">★</i>' : run ? `<i class="cz-n soft">${run}</i>` : ''],
    ['cli', 'Clients', CZ_IC.cli, fav ? `<i class="cz-n green">${fav}</i>` : '']].map(([k, l, ic, b]) => `<button role="tab" data-cztab="${k}" aria-selected="${czTab === k}">${ic}<span>${l}</span>${b}</button>`).join('');
}
function czBodyHTML() {
  if (czTab === 'cli') {
    let f = ''; try { f = cfClientsHTML(); } catch (e) { console.error('fidèles', e); }
    return f + bqRepHTML();
  }
  return cmT() ? cmOrdersHTML() + `<div id="cmKit">${czPrepHTML()}</div>` : `<p class="cz-empty">${CZ_IC.prep}<span>Choisissez d’abord votre commerce.</span></p>`;
}
function czPaintBody() { const b = $('czBody'), t = $('czTabs'); if (b) b.innerHTML = czBodyHTML(); if (t) t.innerHTML = czTabsHTML(); }
function czGo(w) {
  czTab = w === 'cli' ? 'cli' : 'prep'; czPaintBody();
  const el = w === 'stock' ? $('czStock') : $('czTabs');
  if (el) try { el.scrollIntoView({ behavior: czRM() ? 'auto' : 'smooth', block: w === 'stock' ? 'center' : 'start' }); } catch (e) {}
}
function cmComptoir(box) {
  bqState(); bqTickOrders(); try { b2(); } catch (e) {} cmState(); cmTickKitchen(); cmTickBuyers();
  if ((typeof tutoActive === 'function' && tutoActive()) || czTab !== 'cli') czTab = 'prep';
  const bar = bqShopsBar().replace(/<div class="bq-perkl">[\s\S]*?<\/div>/, '');
  box.innerHTML = bar + czSceneHTML() + `<div class="cz-tabs" id="czTabs" role="tablist" aria-label="Le comptoir">${czTabsHTML()}</div><div class="cz-body" id="czBody">${czBodyHTML()}</div>`;
  czAfter();
}
if (typeof renderComptoir === 'function') renderComptoir = cmComptoir;
const cmOnComptoir = () => { try { return tab === 'boutique' && bView === 'comptoir' && !!document.getElementById('czScene'); } catch (e) { return false; } };
// mise à jour légère (sans tout redessiner) ; full : tout le panneau, en gardant le défilement
function cmPaint(full) {
  if (!cmOnComptoir() && !(full && tab === 'boutique')) { try { renderNav(); } catch (e) {} return; }
  const b = $('panelBody'), top = b ? b.scrollTop : 0;
  if (full) { renderPanel(); if (b) b.scrollTop = top; return; }
  const k = $('cmKit'), l = $('czLayer'), p = $('czPets'), sc = $('czScene'), t = $('czTabs');
  if (k) k.innerHTML = czPrepHTML();
  if (l) l.innerHTML = czLayerHTML();
  if (p) p.innerHTML = czPetsHTML();
  if (sc) sc.classList.toggle('busy', czBusy());
  if (t) t.innerHTML = czTabsHTML();
  czAfter();
  if (b) b.scrollTop = top;
}
// horloge : les préparations et les clients acheteurs
setInterval(() => {
  try {
    const d = cmTickKitchen(), bch = cmTickBuyers();
    if (d || bch) { save(); cmPaint(); }
    else document.querySelectorAll('[data-cmleft]').forEach(e => { { const l = Math.ceil((+e.dataset.cmleft - Date.now()) / 1000); e.textContent = l > 0 ? `⏱ ${l} s` : 'Prêt ✔'; } });
  } catch (e) { console.error('commerce', e); }
}, 500);
// onglets, zones de la scène, avantage du commerce ; le client du tutoriel (commande pas prête) montre sa carte
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-cztab],[data-czgo],[data-czadv],[data-b2ord]'); if (!el) return;
  const d = el.dataset;
  if (d.cztab) { czTab = d.cztab === 'cli' ? 'cli' : 'prep'; czPaintBody(); return; }
  if (d.czgo) return czGo(d.czgo);
  if (d.czadv) { const T = cmT(); if (T && CM_ADV[T.id]) toast(`${CM_ADV[T.id][0]} : ${CM_ADV[T.id][1]}`); return; }
  if (d.b2ord && el.closest('#czScene')) {
    const o = bqState().orders.find(x => x.id === d.b2ord); if (!o || bqReady(o)) return;
    if (czTab !== 'prep') { czTab = 'prep'; czPaintBody(); }
    const card = document.querySelector(`.b2card[data-oid="${o.id}"]`); if (card) { card.scrollIntoView({ behavior: czRM() ? 'auto' : 'smooth', block: 'center' }); card.classList.add('b2flash'); }
  }
});
// une commande livrée : son client quitte la scène avec un cœur
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-b2ord],[data-bdeliver]'); if (!el) return;
  const id = el.dataset.b2ord || el.dataset.bdeliver, o = bqState().orders.find(x => x.id === id); if (!o || !bqReady(o)) return;
  const c = document.querySelector(`#czScene [data-b2ord="${id}"]`); if (!c) return;
  const g = czGhostOf(c); setTimeout(() => { if (!bqState().orders.some(x => x.id === id)) czGhost(g); }, 60);
}, true);

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
.cm-slot small{font:800 11px 'Baloo 2',sans-serif}.cm-slot .cm-left{position:absolute;top:4px;left:4px;z-index:2;background:#5b4636;color:#fff;border-radius:9px;padding:1px 7px;font:800 11.5px 'Baloo 2',sans-serif;line-height:1.4}.cm-slot.on{padding-top:22px}.cm-defib{animation:cmpulse 1s ease-in-out infinite}.cm-ok{font:800 10.5px 'Baloo 2',sans-serif;color:#2f7f6c}
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
.cm-r{position:relative}.cm-r .cm-rt{position:absolute;top:5px;left:5px;right:auto;width:auto!important;height:auto;display:inline-block;z-index:2;font:800 11px/1.3 'Baloo 2',sans-serif;font-style:normal;white-space:nowrap;background:#5b4636;color:#fff;border-radius:9px;padding:1px 7px}
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
.cm-rwr{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);font:800 8.5px/1 'Baloo 2',sans-serif;font-style:normal;color:#fff;background:var(--rc);border:1px solid var(--ink);border-radius:6px;padding:2px 4px;white-space:nowrap}
.cm-stn{font-style:normal;display:inline-flex;align-items:center;gap:1px;color:#3d4f99;font-weight:800;background:#eef4ff;border:1.5px solid #9fb3e8;border-radius:8px;padding:0 4px}.cm-stn .stone{width:13px;height:13px}
`;
  document.head.appendChild(st);
})();

// ---------------- styles du comptoir vivant (v25) ----------------
(function czCSS() {
  const st = document.createElement('style');
  st.textContent = `
.cz-wrap{margin:4px 0 2px}
.cz-scene{position:relative;width:min(100%,calc(46vh * 360 / 380));aspect-ratio:360/380;margin:0 auto;border:1.6px solid #5b4636;border-radius:22px;overflow:hidden;background:#f8e6cc;box-shadow:0 4px 0 #d9bf98,0 12px 26px rgba(91,70,54,.16);user-select:none;-webkit-user-select:none;isolation:isolate}
.cz-scene::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 34px rgba(91,70,54,.2);pointer-events:none;z-index:6}
.cz-back,.cz-front,.cz-pets,.cz-layer{position:absolute;inset:0}
.cz-back svg,.cz-front svg{width:100%;height:100%;display:block}
.cz-pets{z-index:1;pointer-events:none}.cz-front{z-index:2;pointer-events:none}.cz-layer{z-index:3;pointer-events:none}
.cz-layer button{pointer-events:auto;-webkit-tap-highlight-color:transparent}
.cz-zone{position:absolute;border:0;background:none;padding:0;border-radius:14px;cursor:pointer;transition:background .2s}
.cz-zone:focus-visible{outline:3px solid #f6c445}.cz-zone:active{background:rgba(255,246,216,.3)}
.cz-hot{opacity:0;transition:opacity .6s}.cz-scene.busy .cz-hot{opacity:1}
.cz-scene.busy .cz-fire{animation:czflk .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
@keyframes czflk{to{transform:scaleY(1.18)}}
.cz-stm{stroke:#fff}.cz-stm path{fill:none;stroke-width:2.6;stroke-linecap:round;opacity:0}
.cz-scene.busy .cz-stm path{animation:czstm 1.6s ease-out infinite}
.cz-scene.busy .cz-stm path:nth-child(2){animation-delay:.5s}.cz-scene.busy .cz-stm path:nth-child(3){animation-delay:1s}
@keyframes czstm{from{opacity:0;transform:translateY(5px)}40%{opacity:.9}to{opacity:0;transform:translateY(-9px)}}
.cz-scene:not(.busy) .cz-ws *{animation-play-state:paused!important}
.cz-bell{transform-box:fill-box;transform-origin:50% 0}
.cz-scene.ding .cz-bell{animation:czding .2s ease-in-out 6 alternate}
@keyframes czding{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}
.cz-glow{animation:czglow 3.5s ease-in-out infinite alternate}@keyframes czglow{from{opacity:.55}to{opacity:1}}
.cz-twk{animation:cztwk 2.4s ease-in-out infinite}@keyframes cztwk{50%{opacity:.3}}
.cz-pet{position:absolute;display:block;transform-origin:50% 100%;animation:czbr 3.2s ease-in-out infinite}
.cz-pet svg{width:100%;height:auto;display:block}
.cz-pet.busy{animation:czwork .5s ease-in-out infinite alternate}
@keyframes czbr{50%{transform:scaleY(.975)}}
@keyframes czwork{from{transform:translateY(0) rotate(-2.5deg)}to{transform:translateY(-4%) rotate(2.5deg)}}
.cz-job{position:absolute;right:0;top:-4%;width:30%;filter:drop-shadow(0 1px 0 rgba(91,70,54,.3))}.cz-job svg{width:100%;display:block}
.cz-lv{position:absolute;left:2.2%;top:2.4%;display:flex;align-items:center;gap:3px;padding:3px 7px 3px 4px;border:1.4px solid #5b4636;border-radius:12px;background:rgba(255,250,240,.95);box-shadow:0 2px 0 rgba(91,70,54,.2);font:800 12px/1 'Baloo 2',sans-serif;color:#4a3528;cursor:pointer}
.cz-lv .bq-star{width:14px;height:14px}
.cz-lv span{display:block;width:30px;height:6px;border-radius:4px;background:#efe2c4;border:1px solid #c9a97a;overflow:hidden}.cz-lv span i{display:block;height:100%;background:#f6c445}
.cz-pr{position:absolute;aspect-ratio:1;filter:drop-shadow(0 2px 0 rgba(91,70,54,.22))}
.cz-pr svg{width:100%;height:100%;display:block}
.cz-pr.new{animation:czpop .55s cubic-bezier(.3,1.6,.5,1) both}
@keyframes czpop{from{transform:translateY(-35%) scale(.2);opacity:0}}
.cz-pr i{position:absolute;right:-14%;top:-16%;font:800 12px/1 'Baloo 2',sans-serif;font-style:normal;color:#f6c445;-webkit-text-stroke:.7px #5b4636}
.cz-more{position:absolute;font:800 10px/1 'Baloo 2',sans-serif;background:#f6c445;border:1.2px solid #5b4636;border-radius:8px;padding:2px 4px}
.cz-chips{position:absolute;display:flex;gap:3%;justify-content:center;flex-wrap:wrap}
.cz-chip{position:relative;width:30%;aspect-ratio:1;padding:0;border:0;border-radius:50%;background:#fffaf0;box-shadow:0 2px 0 rgba(91,70,54,.3);cursor:pointer}
.cz-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.cz-ring circle{fill:none;stroke:#efe2c4;stroke-width:4}
.cz-ring circle.on{stroke:#5fbf7f;stroke-dasharray:100;stroke-dashoffset:100;animation:czring linear forwards}
.cz-chip.paused .cz-ring circle.on{animation-play-state:paused}
@keyframes czring{to{stroke-dashoffset:0}}
.cz-chip>span{position:absolute;inset:19%}.cz-chip>span svg{width:100%;height:100%;display:block}
.cz-chip.defi{box-shadow:0 0 0 2.5px #f6c445,0 2px 0 rgba(91,70,54,.3);animation:czpulse 1s ease-in-out infinite}
.cz-chip>i{position:absolute;right:-16%;top:-16%;width:50%;aspect-ratio:1;border-radius:50%;background:#f6c445;border:1.2px solid #5b4636;font:800 10px/1 'Baloo 2',sans-serif;font-style:normal;display:grid;place-items:center;color:#5b4636}
@keyframes czpulse{50%{transform:scale(1.12)}}
.cz-cl{position:absolute;bottom:.4%;width:25.56%;padding:0;border:0;background:none;cursor:pointer;transform-origin:50% 100%}
.cz-cl img{display:block;width:100%;animation:czidle 2.6s ease-in-out infinite;transform-origin:50% 100%;filter:drop-shadow(0 3px 0 rgba(91,70,54,.18))}
.cz-cl.buy img{animation-delay:-1.3s}
@keyframes czidle{50%{transform:translateY(-1.5%) scaleY(.985)}}
.cz-cl.in{animation:czin 1.6s cubic-bezier(.3,.7,.4,1) both}
@keyframes czin{0%{transform:translate(var(--fx),var(--fy)) scale(.45);opacity:0}12%{opacity:1}100%{transform:none;opacity:1}}
.cz-bub{position:absolute;left:50%;bottom:84%;width:46%;aspect-ratio:1;transform:translateX(-50%);background:#fffaf0;border:1.5px solid #5b4636;border-radius:50%;padding:9%;box-sizing:border-box;box-shadow:0 3px 0 rgba(91,70,54,.18);display:flex;align-items:center;justify-content:center}
.cz-bub::after{content:'';position:absolute;left:24%;bottom:-9%;width:16%;height:16%;background:inherit;border-right:1.5px solid #5b4636;border-bottom:1.5px solid #5b4636;transform:rotate(45deg)}
.cz-bub svg{width:100%;height:100%;display:block;position:relative;z-index:1}
.cz-cl.in .cz-bub{animation:czbub .45s 1.35s cubic-bezier(.3,1.6,.5,1) both}
@keyframes czbub{from{transform:translateX(-50%) scale(0)}}
.cz-cl.buy .cz-bub{border-color:#c98f1e;background:#fff8e1}
.cz-cl.buy:not(.in) .cz-bub{animation:czbob 1.8s ease-in-out infinite}
@keyframes czbob{50%{transform:translateX(-50%) translateY(-6%)}}
.cz-bub em{position:absolute;bottom:-24%;left:50%;transform:translateX(-50%);z-index:2;font:800 11px/1 'Baloo 2',sans-serif;font-style:normal;background:#f6c445;border:1.2px solid #5b4636;border-radius:8px;padding:2px 5px;white-space:nowrap}
.cz-bub em.cz-new{bottom:auto;top:-12%;left:auto;right:-12%;transform:none;background:#e5584f;color:#fff;border-radius:50%;width:17px;height:17px;padding:0;display:grid;place-items:center}
.cz-cl.ord.ready .cz-bub{border-color:#3a8f5a;animation:czpulse2 1.4s ease-in-out infinite}
@keyframes czpulse2{50%{transform:translateX(-50%) scale(1.1)}}
.cz-cl:active img{transform:scale(.96)}
.cz-ghost{position:absolute;bottom:.4%;width:25.56%;z-index:4;pointer-events:none;transform-origin:50% 100%;animation:czout 1.7s ease-in forwards}
.cz-ghost img{width:100%;display:block}
.cz-ghost i{position:absolute;left:36%;top:-4%;width:28%;animation:czhrt 1.1s ease-out forwards}.cz-ghost i svg{width:100%;display:block}
@keyframes czout{0%,25%{transform:none;opacity:1}100%{transform:translate(var(--fx),var(--fy)) scale(.45);opacity:0}}
@keyframes czhrt{from{transform:translateY(0) scale(.4);opacity:0}30%{opacity:1;transform:translateY(-40%) scale(1.15)}to{transform:translateY(-150%) scale(1);opacity:0}}
.cz-walk{position:absolute;opacity:0;pointer-events:none;transform-origin:50% 100%;animation:czwalk 20s 2.5s linear infinite}
.cz-walk img{width:100%;display:block}
@keyframes czwalk{0%{opacity:0;transform:translate(var(--fx),var(--fy)) scale(.5)}3%{opacity:1}12%{opacity:1;transform:none}48%{opacity:1;transform:none}60%,100%{opacity:0;transform:translate(var(--fx),var(--fy)) scale(.5)}}
.cz-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:14px auto 10px;max-width:640px}
.cz-tabs button{position:relative;display:flex;align-items:center;justify-content:center;gap:5px;min-height:42px;padding:6px 4px;border:1.5px solid #8a6446;border-radius:14px;background:linear-gradient(#ecd0a4,#dcb07a);color:#4a3528;font:800 13.5px/1 'Baloo 2',sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 3px 0 #b88a5a;cursor:pointer}
.cz-tabs button svg{width:20px;height:20px;flex:none}
.cz-tabs button[aria-selected="true"]{background:#fffaf0;border-color:#5b4636;box-shadow:0 3px 0 #e2cfae,0 6px 14px rgba(91,70,54,.14);transform:translateY(-2px)}
.cz-n{position:absolute;top:-8px;right:-3px;min-width:19px;height:19px;padding:0 4px;box-sizing:border-box;border-radius:10px;background:#e5584f;color:#fff;font:800 11px/16px 'Baloo 2',sans-serif;font-style:normal;border:1.5px solid #fff;text-align:center}
.cz-n.green{background:#3a8f5a}.cz-n.gold{background:#f6c445;color:#5b4636}.cz-n.soft{background:#8a6446}
.cz-body{max-width:760px;margin:0 auto}
.cz-h{display:flex;align-items:center;gap:6px;margin:4px 2px 8px;font:800 15px/1.1 'Baloo 2',sans-serif;color:#4a3528}.cz-h svg{width:20px;height:20px;flex:none}.cz-h small{font-size:12px;color:var(--ink2)}
.cz-adv{margin-left:auto;font:800 11px/1 'Baloo 2',sans-serif;background:#fff3c4;border:1.3px solid #c98f1e;color:#7a4a12;border-radius:10px;padding:5px 8px;cursor:pointer}
.cz-body .cm-slot{border:1.5px solid #8a6446;border-radius:16px;background:linear-gradient(#fffaf0,#fbefd9);box-shadow:0 3px 0 #e2cfae,0 6px 12px rgba(91,70,54,.07);min-height:112px}
.cz-body .cm-slot.empty{border:1.5px dashed #c9a97a;background:rgba(255,250,240,.55);box-shadow:none}
.cz-body .cm-r{border:1.5px solid #dcc29c;border-radius:16px;background:#fffaf0;box-shadow:0 3px 0 #ecdcbf,0 6px 12px rgba(91,70,54,.06);padding:8px 6px}
.cz-body .cm-r.can{border-color:#7fbf8f;background:linear-gradient(#f6fcf3,#eaf6e6);box-shadow:0 3px 0 #cfe8d2}
.cz-body .cm-r.locked{background:#f5efe4}
.cz-body .cm-rp{border:1.5px solid #ecdcbf;border-radius:50%;width:56px;height:56px;padding:7px}
.cz-body .cm-ing{border-radius:50%;border-width:1.3px}
.cz-body .cm-rgrid{grid-template-columns:repeat(auto-fill,minmax(146px,1fr));gap:8px}
.cz-stock{display:flex;align-items:center;gap:8px;margin:2px 0 14px;padding:7px 10px;border:1.5px solid #c9a97a;border-radius:16px;background:repeating-linear-gradient(90deg,#f1dcb8 0 14px,#ecd3ab 14px 28px);box-shadow:inset 0 -3px 0 rgba(168,122,80,.22)}
.cz-stock>svg{width:24px;height:24px;flex:none}
.cz-sl{display:flex;gap:8px;flex:1;overflow-x:auto;padding:4px 6px 6px 2px}
.cz-si{position:relative;flex:none;width:34px;height:34px;background:#fffaf0;border:1.3px solid #c9a97a;border-radius:10px;padding:3px;box-sizing:border-box}.cz-si svg{width:100%;height:100%;display:block}
.cz-si i{position:absolute;right:-6px;bottom:-5px;font:800 10px/1 'Baloo 2',sans-serif;font-style:normal;background:#f6c445;border:1.2px solid #5b4636;border-radius:8px;padding:1px 4px}
.cz-sl0{flex:1;font:700 12.5px 'Baloo 2',sans-serif;color:#7a5a40}
.cz-body .b2card.cm-o{background:#fffaf0;border:1.5px solid var(--tc);border-radius:18px;box-shadow:0 3px 0 rgba(91,70,54,.1),0 8px 16px rgba(91,70,54,.07);padding-top:10px}
.cz-body .b2card.cm-o::before{content:'';position:absolute;top:-6px;left:50%;width:46px;height:13px;transform:translateX(-50%) rotate(-3deg);background:var(--tc);opacity:.35;border-radius:2px}
.cz-body .b2card.cm-o.pend{background:linear-gradient(#fffaf0,var(--tb))}
.cz-body .b2wait{border:1.5px dashed #c9a97a;background:rgba(255,250,240,.6);border-radius:18px;box-shadow:none}
.cz-body .b2f{border:1.5px solid #dcc29c;border-radius:14px;background:#fffaf0;box-shadow:0 3px 0 #ecdcbf}
.cz-empty{display:flex;align-items:center;gap:10px;padding:12px;border:1.5px dashed #c9a97a;border-radius:16px;background:rgba(255,250,240,.6);font:700 13px/1.3 'Baloo 2',sans-serif;color:#7a5a40;margin:0 0 12px}.cz-empty svg{width:34px;height:34px;flex:none}
/* ---- v26 : profondeur (3 plans), lumière chaude, tout bouge un peu ---- */
.cz-scene{--px:0;--py:0}
.cz-back{z-index:0;inset:-5px}.cz-sun{z-index:1}.cz-pets{z-index:2}.cz-front{z-index:3}.cz-layer{z-index:5}.cz-fore{z-index:4;pointer-events:none}.cz-scene::after{z-index:7}
.cz-fore{position:absolute;inset:-6px}.cz-fore svg{width:100%;height:100%;display:block}
.cz-p1,.cz-p2,.cz-p3,.cz-p4{transition:translate .5s cubic-bezier(.2,.7,.3,1)}
.cz-p1{translate:calc(var(--px) * -3px) calc(var(--py) * -2px)}
.cz-p3{translate:calc(var(--px) * 2.5px) calc(var(--py) * 1.5px)}
.cz-p4{translate:calc(var(--px) * 6px) calc(var(--py) * 4px)}
.cz-pr:not(.vit){translate:calc(var(--px) * -5.5px) calc(var(--py) * -3.5px)}
.cz-front svg{filter:drop-shadow(0 7px 5px rgba(91,70,54,.2))}
.cz-pb>svg{filter:drop-shadow(-5px 6px 4px rgba(91,70,54,.22))}
.cz-scene.off *{animation-play-state:paused!important}
/* fenêtre vivante */
.cz-cloud{animation:czcloud 34s ease-in-out infinite alternate}.cz-cloud.b{animation-duration:47s;animation-direction:alternate-reverse}
@keyframes czcloud{from{transform:translateX(-14px)}to{transform:translateX(46px)}}
.cz-cat{transform:translateX(-30px);animation:czcat 27s 5s linear infinite}
@keyframes czcat{0%{transform:translateX(-30px)}32%,100%{transform:translateX(112px)}}
.cz-cat path:nth-child(4){animation:czpaw .3s steps(2) infinite}@keyframes czpaw{50%{transform:translateY(-1px)}}
.cz-bird{transform:translateX(0);animation:czbird 19s 11s linear infinite}
@keyframes czbird{0%{transform:translate(0,0)}9%{transform:translate(-60px,-6px)}18%,100%{transform:translate(-120px,2px)}}
.cz-wing{transform-box:fill-box;transform-origin:50% 100%;animation:czwing .28s ease-in-out infinite alternate}@keyframes czwing{to{transform:scaleY(-.6)}}
.cz-cur{transform-box:fill-box;transform-origin:50% 0;animation:czcur 6.5s ease-in-out infinite alternate}.cz-cur.r{animation-delay:-3.2s}
@keyframes czcur{from{transform:skewX(-2.2deg)}to{transform:skewX(2.4deg) scaleX(1.03)}}
.cz-bell{animation:czbell 4.2s ease-in-out infinite}@keyframes czbell{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.cz-sway{transform-box:view-box;animation:czsway 5.5s ease-in-out infinite alternate}.cz-sway.sl{transform-origin:6px 0}.cz-sway.sr{transform-origin:344px 360px;animation-duration:4.4s}
@keyframes czsway{from{transform:rotate(-2.4deg)}to{transform:rotate(2.4deg)}}
/* rayon de soleil, poussière, halo du fourneau */
.cz-sun{position:absolute;inset:0;pointer-events:none}
.cz-beam,.cz-dust{position:absolute;inset:0;clip-path:polygon(46% 15%,69% 15%,47% 100%,4% 100%)}
.cz-beam{background:linear-gradient(162deg,rgba(255,243,196,.6),rgba(255,226,150,.2) 55%,rgba(255,226,150,0));animation:czbeam 7s ease-in-out infinite alternate}
@keyframes czbeam{from{opacity:.5}to{opacity:.85}}
.cz-sun.night .cz-beam{background:linear-gradient(162deg,rgba(200,215,255,.32),rgba(200,215,255,0));}
.cz-dust i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fffbe8;box-shadow:0 0 4px 1px rgba(255,236,170,.9);animation:czdust 8s ease-in-out infinite}
@keyframes czdust{0%{transform:translate(0,0);opacity:0}25%{opacity:1}50%{transform:translate(9px,-14px);opacity:.3}75%{opacity:.95}100%{transform:translate(-5px,-26px);opacity:0}}
.cz-sun::after{content:'';position:absolute;left:58%;top:22%;width:48%;height:52%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,80,.42),rgba(255,170,80,0));opacity:0;transition:opacity .8s}
.cz-scene.busy .cz-sun::after{opacity:1;animation:czbeam 1.6s ease-in-out infinite alternate}
/* le familier : grand, il respire, regarde autour de lui, et travaille */
.cz-pet,.cz-pet.busy{animation:none}.cz-pb .cz-job{left:37%;right:auto;top:-7%;width:26%}
.cz-pb{display:block;position:relative;transform-origin:50% 100%;animation:czbr2 3.6s ease-in-out infinite}
@keyframes czbr2{0%,100%{transform:none}25%{transform:scaleY(.982)}55%{transform:rotate(-2.5deg)}62%{transform:rotate(-2.5deg) scaleY(.985)}80%{transform:rotate(1.5deg)}}
.cz-pet.g-petrir .cz-pb{animation:czknead .55s ease-in-out infinite}@keyframes czknead{50%{transform:translateY(4%) scale(1.04,.94)}}
.cz-pet.g-couper .cz-pb{animation:czbob .42s ease-in-out infinite}@keyframes czbob{50%{transform:translateY(2%)}}
.cz-pet.g-verser .cz-pb{animation:czlean 1.5s ease-in-out infinite alternate}@keyframes czlean{from{transform:rotate(-1deg)}to{transform:rotate(5deg) translateX(2%)}}
.cz-pet.g-melanger .cz-pb{animation:czstir .9s ease-in-out infinite}@keyframes czstir{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg) translateY(1.5%)}}
.cz-pet.g-emballer .cz-pb{animation:czwrap 1.1s ease-in-out infinite}@keyframes czwrap{0%,100%{transform:translateX(-2.5%) rotate(-2deg)}50%{transform:translateX(2.5%) rotate(2deg)}}
.cz-tool{position:absolute;left:56%;top:47%;width:36%;aspect-ratio:1;transform-origin:22% 85%;filter:drop-shadow(0 2px 0 rgba(91,70,54,.25))}.cz-tool svg{width:100%;height:100%;display:block}
.g-petrir .cz-tool{left:30%;top:58%;width:44%;transform-origin:50% 50%;animation:czroll .55s ease-in-out infinite}@keyframes czroll{50%{transform:translate(8%,10%) rotate(6deg)}}
.g-couper .cz-tool{animation:czchop .42s ease-in infinite}@keyframes czchop{0%,100%{transform:rotate(-38deg)}55%{transform:rotate(18deg)}}
.g-verser .cz-tool{animation:czpour 1.5s ease-in-out infinite alternate}@keyframes czpour{from{transform:rotate(0)}to{transform:rotate(-48deg) translateY(6%)}}
.g-melanger .cz-tool{animation:czcirc .9s linear infinite}@keyframes czcirc{0%{transform:translate(0,0) rotate(-6deg)}25%{transform:translate(9%,6%) rotate(4deg)}50%{transform:translate(0,12%) rotate(10deg)}75%{transform:translate(-9%,6%) rotate(2deg)}100%{transform:translate(0,0) rotate(-6deg)}}
.g-emballer .cz-tool{left:34%;top:56%;transform-origin:50% 50%;animation:czbow 1.1s ease-in-out infinite}@keyframes czbow{0%,100%{transform:rotate(-16deg) scale(.9)}50%{transform:rotate(16deg) scale(1.08)}}
.cz-pbar{position:absolute;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:2;pointer-events:none}
.cz-pbar b{font:800 11px/1 'Baloo 2',sans-serif;color:#4a3528;background:#fffaf0;border:1.3px solid #5b4636;border-radius:10px;padding:3px 7px 2px;white-space:nowrap;box-shadow:0 2px 0 rgba(91,70,54,.2)}
.cz-pbar b span{color:#b0482f}
.cz-pbar i{display:block;width:78%;height:7px;border:1.3px solid #5b4636;border-radius:6px;background:#efe2c4;overflow:hidden}
.cz-pbar u{display:block;height:100%;width:0;background:linear-gradient(90deg,#8fcf7a,#5fbf7f);animation:czfill linear forwards}@keyframes czfill{from{width:0}to{width:100%}}
.cz-make{position:absolute;aspect-ratio:1;pointer-events:none}
.cz-make>span{position:absolute;inset:0;transform-origin:50% 92%;animation:czgrow linear forwards;filter:drop-shadow(0 3px 2px rgba(91,70,54,.25))}.cz-make svg{width:100%;height:100%;display:block}
@keyframes czgrow{from{transform:scale(.22);opacity:.55}20%{opacity:1}to{transform:scale(1)}}
.cz-make>i{position:absolute;right:-12%;top:-10%;width:30%;aspect-ratio:1;background:radial-gradient(closest-side,#fff,rgba(255,246,200,0));animation:cztwk 1.1s ease-in-out infinite}
/* clients : premier plan, plus grands, ombre, ils respirent et regardent autour d'eux */
.cz-cl{width:28.9%}
.cz-cl::before{content:'';position:absolute;left:12%;right:12%;bottom:-1%;height:9%;border-radius:50%;background:radial-gradient(closest-side,rgba(91,70,54,.32),rgba(91,70,54,0))}
.cz-who{display:block;transform-origin:50% 100%;animation:czlook 8s ease-in-out infinite}
@keyframes czlook{0%,52%,76%,100%{transform:none}56%,72%{transform:scaleX(-1)}}
.cz-cl.in .cz-who{animation:czstep .36s ease-in-out 4}@keyframes czstep{50%{transform:translateY(-5%) rotate(2.5deg)}}
.cz-cl.wait .cz-bub{border-style:dashed;border-color:#8a6446;background:#fffaf0}
.cz-bub em.cz-todo{background:#fffaf0;color:#7a4a12;font-size:9.5px;border-color:#8a6446}
.cz-ghost{width:28.9%;animation:czout 2s ease-in forwards}
@keyframes czout{0%{transform:none;opacity:1}9%{transform:translateY(-16%) scaleY(1.04)}18%{transform:none}24%{transform:translateY(-7%)}30%{transform:none;opacity:1}100%{transform:translate(var(--fx),var(--fy)) scale(.45);opacity:0}}
.cz-ghost i{left:34%;width:32%}
/* effets de vente (au-dessus de tout) */
.cz-fx{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden}
.cz-fx>span{position:absolute;left:0;top:0;display:block;will-change:transform}.cz-fx svg{width:100%;height:100%;display:block}
.cz-fxt{font:800 22px/1 'Baloo 2',sans-serif;color:#f6c445;-webkit-text-stroke:1.2px #5b4636;text-shadow:0 2px 0 #5b4636;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.cz-p1,.cz-p2,.cz-p3,.cz-p4,.cz-pr{translate:none!important}.cz-pbar u{animation:none!important}.cz-beam{opacity:.7}}
@media (prefers-reduced-motion:reduce){.cz-scene,.cz-scene *{animation:none!important;transition:none!important}.cz-walk,.cz-ghost{display:none!important}}
`;
  document.head.appendChild(st);
})();

window.__cm = { R: CM_R, LINES: CM_LINES, ADV: CM_ADV, state: () => cmState(), start: cmStart, finish: cmFinish, price: cmPrice, sell: cmSell, tickBuyers: cmTickBuyers,
  forceDefi: () => { cmForceDefi = true; },
  // simulation chiffrée des envies (sans toucher à la sauvegarde) : n clients de suite, chacun achète son envie 25 s plus tard
  cl: shop => { const l = (BQ_SHOP_CLIENTS[shop] || []).filter(x => BQC(x)); return l.length > 1 ? l : BQ_CLIENTS.map(x => x.id); },
  envSim: (shop, n) => { const list = (CM_LINES[shop] || []).filter(R => !R.egg && !R.x), c = { buy: [], envH: [], soldAt: {}, soldN: {} }; let now = Date.now(); const out = [];
    for (let i = 0; i < n; i++) { const rid = cmEnvieOf(list, c, [], now, null); out.push(rid); c.soldAt[rid] = now; c.soldN[rid] = (c.soldN[rid] || 0) + 1; now += 25e3; } return out; }, tab: t => { czTab = t === 'cli' ? 'cli' : 'prep'; czPaintBody(); }, nextTier: t => { cmNextTier = t; }, applyTier: cmApplyTier, newOrder: () => bqNewOrder(false), how: cmHowHTML };

// ================= 66 · SPÉCIALITÉS SIGNATURE DES BONNES ADRESSES (v45) =================
// Le joueur (12/11) : « Mijoté du chef à McDonald's, on se fiche de moi » → une spécialité PROPRE À CHAQUE LIEU,
// cohérente avec ce qu'il est, seulement dans les bonnes adresses (★★ et ★★★, voir 65_adresses.js).
// Nom = BASE (selon le type de lieu, et le nom pour les restaurants : burger chez un fast-food, ramen chez un japonais…)
//     + TOUCHE (au miel, à la truffe…) + nom du lieu → des milliers de spécialités, toujours les mêmes pour un lieu.
// Nourriture : rapportée à chaque visite (★★ : 1, ★★★ : 2). À la 1re visite on apprend la RECETTE SIGNATURE : votre
//   commerce peut la préparer (ingrédient signature + 1 ingrédient courant), les clients la réclament et la paient
//   ×2,5 ; le plat préparé se vend, s'emporte en provision (comme les autres plats) ou nourrit un familier.
// Vêtements (boutique de vêtements, friperie) : une PIÈCE SIGNATURE unique (1re visite), à porter, bonus réel en voyage.
// Abandonné à la demande du joueur : vendre la recette. Supprimé : le vieux souvenir générique des lieux du quotidien.
const SGS_SWEET = ['au miel', 'au caramel salé', 'aux noisettes', 'à la vanille de Tahiti', 'à la framboise', 'au citron vert', 'à la fleur d’oranger', 'aux noix de pécan', 'à la pistache', 'au chocolat noir', 'à la cannelle', 'au sésame noir', 'à la fraise des bois', 'au praliné', 'à la mangue', 'au thé matcha', 'à la châtaigne', 'aux fruits rouges', 'à la rose', 'au yuzu'];
const SGS_SALTY = ['au miel et moutarde', 'à la truffe', 'aux oignons confits', 'au piment doux', 'fumé au bois de hêtre', 'aux herbes du jardin', 'à l’ail noir', 'au poivre de Sichuan', 'au comté affiné', 'façon barbecue', 'au citron confit', 'aux champignons des bois', 'au sésame grillé', 'à la sauce maison', 'au curry doux', 'aux tomates séchées', 'au pesto de basilic', 'au chèvre frais', 'au gingembre', 'aux noix'];
const SGS_DRINK = ['à la vanille', 'au caramel', 'à la noisette', 'à la cannelle', 'au gingembre', 'à la menthe fraîche', 'au citron vert', 'au sirop d’érable', 'à la fleur de sureau', 'aux fruits rouges', 'au miel', 'à la cardamome', 'au chocolat blanc', 'à la pêche', 'au thé vert', 'à la framboise'];
const SGS_CLOTH = ['en lin', 'à carreaux', 'à rayures', 'en velours côtelé', 'en laine mérinos', 'à fleurs', 'en jean délavé', 'à pois', 'en soie', 'en tweed', 'à franges', 'brodé main', 'à motif renard', 'patchwork', 'en coton bio', 'tie and dye', 'en cachemire', 'à motif étoiles'];
// base : [nom, sous-catégorie (icône), saveur s/a/d, ingrédient courant de la recette]
const SGS_B = {
  fastfood: [['Burger', 'plat', 'a', 'pain'], ['Wrap', 'plat', 'a', 'legume'], ['Frites', 'plat', 'a', 'legume'], ['Milkshake', 'boisson', 'd', 'glace'], ['Hot-dog', 'pain', 'a', 'pain'], ['Sundae', 'glace', 's', 'glace'], ['Cheeseburger', 'plat', 'a', 'fromage'], ['Bagel', 'pain', 'a', 'fromage'], ['Nuggets', 'plat', 'a', 'farine'], ['Cookie géant', 'sucre', 's', 'farine']],
  pizza: [['Pizza', 'plat', 'a', 'fromage'], ['Calzone', 'plat', 'a', 'farine'], ['Focaccia', 'pain', 'a', 'farine'], ['Panna cotta', 'sucre', 's', 'sucre'], ['Tiramisu', 'sucre', 's', 'sucre'], ['Arancini', 'plat', 'a', 'fromage'], ['Lasagnes', 'plat', 'a', 'fromage']],
  asia: [['Ramen', 'plat', 'a', 'legume'], ['Bao', 'pain', 'a', 'farine'], ['Gyoza', 'plat', 'a', 'legume'], ['Maki', 'mer', 'a', 'mer'], ['Bol de riz', 'plat', 'a', 'legume'], ['Mochi', 'sucre', 's', 'sucre'], ['Thé glacé', 'boisson', 'd', 'boisson'], ['Nems', 'plat', 'a', 'legume']],
  creperie: [['Galette', 'plat', 'a', 'farine'], ['Crêpe', 'sucre', 's', 'farine'], ['Jus de pomme pétillant', 'boisson', 'd', 'boisson'], ['Kouign-amann', 'sucre', 's', 'farine']],
  kebab: [['Kebab', 'plat', 'a', 'pain'], ['Falafel', 'plat', 'a', 'legume'], ['Assiette grillée', 'plat', 'a', 'legume'], ['Baklava', 'sucre', 's', 'sucre']],
  bistrot: [['Tartine', 'pain', 'a', 'pain'], ['Velouté', 'plat', 'a', 'legume'], ['Risotto', 'plat', 'a', 'fromage'], ['Quiche', 'plat', 'a', 'farine'], ['Salade composée', 'legume', 'a', 'legume'], ['Gratin', 'plat', 'a', 'fromage'], ['Croque-monsieur', 'pain', 'a', 'fromage'], ['Crème brûlée', 'sucre', 's', 'sucre'], ['Mousse', 'sucre', 's', 'sucre'], ['Tarte fine', 'sucre', 's', 'farine']],
  boulangerie: [['Pain', 'pain', 'a', 'farine'], ['Brioche', 'sucre', 's', 'farine'], ['Croissant', 'sucre', 's', 'farine'], ['Tarte', 'sucre', 's', 'farine'], ['Fougasse', 'pain', 'a', 'farine'], ['Chausson', 'sucre', 's', 'farine'], ['Éclair', 'sucre', 's', 'sucre'], ['Financier', 'sucre', 's', 'sucre'], ['Pain de campagne', 'pain', 'a', 'farine'], ['Cookie', 'sucre', 's', 'farine']],
  chocolaterie: [['Bonbon de chocolat', 'sucre', 's', 'sucre'], ['Tablette', 'sucre', 's', 'sucre'], ['Truffe en chocolat', 'sucre', 's', 'sucre'], ['Mendiant', 'sucre', 's', 'sucre'], ['Chocolat chaud', 'boisson', 'd', 'boisson']],
  cafe: [['Latte', 'boisson', 'd', 'boisson'], ['Cappuccino', 'boisson', 'd', 'boisson'], ['Chocolat chaud', 'boisson', 'd', 'boisson'], ['Thé', 'boisson', 'd', 'boisson'], ['Muffin', 'sucre', 's', 'farine'], ['Cheesecake', 'sucre', 's', 'fromage'], ['Brownie', 'sucre', 's', 'sucre'], ['Cookie', 'sucre', 's', 'farine'], ['Smoothie', 'boisson', 'd', 'fruit']],
  glacier: [['Glace', 'glace', 's', 'glace'], ['Sorbet', 'glace', 's', 'glace'], ['Cornet', 'glace', 's', 'glace'], ['Coupe glacée', 'glace', 's', 'glace'], ['Granité', 'glace', 's', 'glace']],
  terroir: [['Confiture', 'sucre', 's', 'sucre'], ['Miel', 'sucre', 's', 'sucre'], ['Bocal de soupe', 'plat', 'a', 'legume'], ['Compote', 'sucre', 's', 'fruit'], ['Jus pressé', 'boisson', 'd', 'fruit'], ['Tapenade', 'legume', 'a', 'legume']],
  poisson: [['Rillettes de poisson', 'mer', 'a', 'mer'], ['Soupe de poisson', 'mer', 'a', 'mer'], ['Tartare', 'mer', 'a', 'mer'], ['Brochette de crevettes', 'mer', 'a', 'mer']],
  fromage: [['Fromage affiné', 'fromage', 'a', 'fromage'], ['Tomme', 'fromage', 'a', 'fromage'], ['Chèvre frais', 'fromage', 'a', 'fromage'], ['Fondue', 'fromage', 'a', 'fromage']],
  boucherie: [['Terrine', 'plat', 'a', 'plat'], ['Pâté en croûte', 'plat', 'a', 'farine'], ['Rôti', 'plat', 'a', 'plat'], ['Saucisson', 'plat', 'a', 'plat']],
  caviste: [['Jus de raisin', 'boisson', 'd', 'boisson'], ['Sirop', 'boisson', 'd', 'boisson'], ['Limonade artisanale', 'boisson', 'd', 'boisson']],
  // vêtements : [nom, emplacement, saveur 'v', forme]
  vetement: [['Pull', 'haut', 'v', 'pull'], ['Sweat', 'haut', 'v', 'sweat'], ['T-shirt', 'haut', 'v', 'tshirt'], ['Foulard', 'cou', 'v', 'foulard'], ['Écharpe', 'cou', 'v', 'echarpe'], ['Béret', 'tete', 'v', 'beret'], ['Bonnet', 'tete', 'v', 'bonnet'], ['Chapeau', 'tete', 'v', 'chapeau'], ['Casquette', 'tete', 'v', 'casquette'], ['Jupe', 'bas', 'v', 'jupe'], ['Short', 'bas', 'v', 'short'], ['Bottes', 'pieds', 'v', 'bottes'], ['Gants', 'mains', 'v', 'gants'], ['Cape', 'dos', 'v', 'cape']],
};
const SGS_COL = ['#d9733f', '#e3a04b', '#b9824f', '#8a5a3a', '#e07a9a', '#7a6fb8', '#4f9f78', '#3b5aa8', '#c95a5a', '#e9b04b', '#5aa3a8', '#a8566a'];
// quel groupe pour ce lieu ? (null = pas de spécialité : musée, gare, parc…)
function sgsGroup(d) {
  const c = d.cat || (d.tags || [])[0], n = String(d.name || '').toLowerCase();
  if (c === 'restaurant' || c === 'cafe') {
    if (/mc ?do|burger|kfc|quick|subway|five guys|tacos|snack|fast/.test(n)) return 'fastfood';
    if (/pizz|trattoria|ital/.test(n)) return 'pizza';
    if (/sushi|japon|ramen|wok|thaï|thai|pho|asia|chin|bao|udon|viet|korea|cor[ée]/.test(n)) return 'asia';
    if (/cr[êe]p|galette|breizh|bretagne/.test(n)) return 'creperie';
    if (/kebab|kebap|grill|d[öo]ner|liban/.test(n)) return 'kebab';
    return c === 'cafe' ? 'cafe' : 'bistrot';
  }
  return { boulangerie: 'boulangerie', chocolaterie: 'chocolaterie', glacier: 'glacier', marche: 'terroir', epicerie: 'terroir', ferme: 'terroir', poissonnerie: 'poisson', fromagerie: 'fromage', boucherie: 'boucherie', caviste: 'caviste', mode: 'vetement', friperie: 'vetement' }[c] || null;
}
function sgsOf(d) {
  const G = sgOf(d); if (!G || G.s < 2) return null;
  const grp = sgsGroup(d); if (!grp) return null;
  const B = SGS_B[grp], b = B[Math.floor(sgRnd(G.key, 'b') * B.length)];
  const T = b[2] === 'v' ? SGS_CLOTH : b[2] === 'd' ? SGS_DRINK : b[2] === 's' ? SGS_SWEET : SGS_SALTY, touch = T[Math.floor(sgRnd(G.key, 'k') * T.length)];
  const place = String(d.name).trim().slice(0, 26), de = /^[aeiouyhéèêàâîôû]/i.test(place) ? 'd’' : 'de ';
  const dish = `${b[0]} ${touch}`, col = SGS_COL[Math.floor(sgRnd(G.key, 'c') * SGS_COL.length)];
  const id = G.key.replace(/[^a-z0-9]/gi, '').slice(-14) + Math.floor(sgRnd(G.key, 'id') * 1e6).toString(36);
  const nm = `${dish} ${de}${place}`.replace(/\bde (Le|Les|Au|Aux) /, (m, a) => ({ Le: 'du ', Les: 'des ', Au: 'd’Au ', Aux: 'd’Aux ' })[a]);
  return { G, grp, id, cloth: b[2] === 'v', dish, name: nm, sub: b[1], look: b[2] === 'v' ? b[3] : null, base: b[2] === 'v' ? null : b[3], col, place: d.name, cat: d.cat || (d.tags || [])[0] };
}
function sgsItem(X) {
  const it = makeItem([X.name, X.cloth ? 'v' : 'n', X.sub, X.G.s, X.look, X.col], 0, X.place, [], { fixed: X.G.s });
  it.sgId = X.id; it.sgS = X.G.s;
  return it;
}

// ---------------- recettes signature apprises : S.sig.r[id] ----------------
const sgsR = () => { const st = sgState(); if (!st.r) st.r = {}; return st.r; };
// le commerce qui prépare la recette : le plus proche du lieu d'origine parmi ceux que vous possédez
function sgsShopFor(cat) {
  let own = []; try { own = bqOwned(); } catch (e) {}
  const pref = { boulangerie: 'boulangerie', chocolaterie: 'boulangerie', cafe: 'cafe', glacier: 'glacier' }[cat] || 'restaurant';
  const food = own.filter(s => (CM_LINES[s] || []).some(R => R.def[1] === 'n' && !R.egg));
  return food.includes(pref) ? pref : food.includes('restaurant') ? 'restaurant' : food[0] || null;
}
function sgsRegAll() {
  try {
    const R0 = sgsR();
    for (const id in R0) {
      const r = R0[id], rid = 'sg_' + id;
      ING['sgx_' + id] = [[], r.name];
      if (CM_R[rid]) continue;
      const shop = sgsShopFor(r.cat); if (!shop || !CM_LINES[shop]) continue;
      const R = { id: rid, shop, def: [`${r.dish} ★`, 'n', r.sub, 2, null, r.col], ing: [['sgx_' + id, 1], [ING[r.base] ? r.base : 'farine', 1]], t: 6, rep: 0, x: false, sg: id };
      CM_R[rid] = R; CM_LINES[shop].push(R);
    }
  } catch (e) { console.error('recettes signature', e); }
}
setTimeout(sgsRegAll, 0);
// l'ingrédient signature n'est pris QUE par sa recette ; les recettes ordinaires ne le prennent jamais
if (typeof cmPool === 'function') cmPool = (orig => function (key) {
  if (String(key).startsWith('sgx_')) { const id = key.slice(4); return S.inv.filter(it => it && it.sgId === id && !it.mk); }
  return orig.apply(this, arguments).filter(it => !it.sgId);
})(cmPool);
if (typeof cmIngIcon === 'function') cmIngIcon = (orig => function (k) {
  if (String(k).startsWith('sgx_')) { const r = sgsR()[k.slice(4)]; return r ? sg$(() => itemIcon({ name: r.name, cat: 'n', sub: r.sub, rarity: 2, color: r.col }), '') : ''; }
  return orig.apply(this, arguments);
})(cmIngIcon);
// le plat signature préparé se vend 2,5 fois plus cher
if (typeof cmFinish === 'function') cmFinish = (orig => function (i) {
  const it = orig.apply(this, arguments);
  try { if (it && it.mk && CM_R[it.mk.rid] && CM_R[it.mk.rid].sg) it.mk.p = Math.round(it.mk.p * 2.5); } catch (e) {}
  return it;
})(cmFinish);
// « Sert à » : l'ingrédient signature ne sert qu'à SA recette
if (typeof usCmRecipes === 'function') usCmRecipes = (orig => function (it) {
  const out = orig.apply(this, arguments);
  if (it && it.sgId) return (CM_R['sg_' + it.sgId] ? [{ R: CM_R['sg_' + it.sgId], ok: sg$(() => cmCanIng(CM_R['sg_' + it.sgId]), false), here: true }] : []);
  return out;
})(usCmRecipes);
if (typeof usAtRecipes === 'function') usAtRecipes = (orig => function (it) { return it && it.sgId ? [] : orig.apply(this, arguments); })(usAtRecipes);
GAME.addUses(it => {
  if (!it || !it.sgId) return [];
  if (it.cat === 'v') return [{ txt: 'Pièce signature : unique, à porter pour un vrai bonus en voyage', kind: 'porter' }];
  return [{ txt: CM_R['sg_' + it.sgId] ? `Recette signature au commerce : ${CM_R['sg_' + it.sgId].def[0]} (vendu très cher)` : 'Recette signature : ouvrez un commerce de bouche pour la préparer', kind: 'cuisiner' }];
});
// l'ingrédient signature se revend bien, la pièce signature aussi
if (typeof value === 'function') value = (orig => function (it) { const v = orig.apply(this, arguments); return it && it.sgId && typeof v === 'number' ? Math.round(v * (it.cat === 'v' ? 3 : 2)) : v; })(value);
// la pièce signature : un bonus fort partout (★★ 20 %, ★★★ 30 %), risque ou butin selon la pièce
if (typeof usWearOf === 'function') usWearOf = (orig => function (it) {
  if (it && it.cat === 'v' && it.sgId) { const k = sgRnd(it.sgId, 'w') < 0.5 ? 'risk' : 'loot', v = (it.sgS || 2) >= 3 ? 0.3 : 0.2; return { t: '*', k, v, txt: k === 'risk' ? `−${Math.round(v * 100)} % de risques partout` : `+${Math.round(v * 100)} % de butin partout` }; }
  return orig.apply(this, arguments);
})(usWearOf);

// ---------------- au retour : la spécialité ----------------
let sgsHaul = null;
if (typeof collect === 'function') collect = (orig => function () {
  sgsHaul = null;
  try {
    const k = S.sel, t = S.trips[k];
    if (t && t.done && !t.tuto && !t.sgsL && !t.xpFail && Array.isArray(t.bag) && t.dest) {
      t.sgsL = 1;
      const X = sgsOf(t.dest);
      if (X) {
        if (X.cloth) { // une seule pièce signature par lieu
          const got = sgState().cl || (sgState().cl = {});
          if (!got[X.id]) { got[X.id] = 1; t.bag.push(sgsItem(X)); sgsHaul = { k, txt: `Pièce signature : ${X.dish} (bonus en voyage)` }; }
        } else {
          for (let i = 0; i < (X.G.s >= 3 ? 2 : 1); i++) t.bag.push(sgsItem(X));
          const R0 = sgsR();
          if (!R0[X.id]) { R0[X.id] = { name: X.name, dish: X.dish, sub: X.sub, col: X.col, base: X.base, cat: X.cat, place: X.place }; sgsRegAll(); sgsHaul = { k, txt: `Recette signature apprise : ${X.dish}${CM_R['sg_' + X.id] ? '' : ' (il faut un commerce de bouche)'}` }; }
        }
      }
    }
  } catch (e) { console.error('spécialités', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  try { if (sgsHaul && h && h.comp === sgsHaul.k) { h.extra = (h.extra || []).concat([sgsHaul.txt]); sgsHaul = null; } } catch (e) {}
  return orig.apply(this, arguments);
})(showHaul);
// un commerce acheté plus tard : les recettes apprises le rejoignent
if (typeof renderPanel === 'function') renderPanel = (orig => function () { sgsRegAll(); return orig.apply(this, arguments); })(renderPanel);

// ---------------- plus de vieux souvenir générique dans les lieux du quotidien ----------------
if (typeof poiDest === 'function') poiDest = (orig => function (p) { const d = orig.apply(this, arguments); if (d) d.special = null; return d; })(poiDest);

// ---------------- « Le lieu » : la spécialité sous la ligne d'étoiles ----------------
if (typeof sgLineHTML === 'function') sgLineHTML = (orig => function (d) {
  let h = orig.apply(this, arguments);
  try {
    const X = sgsOf(d);
    if (X && sgState().v[X.G.key]) h = h.replace('</small></span></div>', `</small><small class="sgs-sp">${X.cloth ? 'Pièce signature' : 'Spécialité'} : ${esc(X.dish)}</small></span></div>`);
    else if (!sgState().v[(sgOf(d) || {}).key] && sgsGroup(d)) h = h.replace('À découvrir : certains lieux donnent deux fois plus.', 'À découvrir : les meilleures adresses ont leur spécialité.');
  } catch (e) {}
  return h;
})(sgLineHTML);
{
  const st = document.createElement('style');
  st.textContent = `.sg-t .sgs-sp{font-weight:800;color:#8a5a00}`;
  document.head.appendChild(st);
}
window.__sgs = { of: sgsOf, group: sgsGroup, rec: sgsR, reg: sgsRegAll };

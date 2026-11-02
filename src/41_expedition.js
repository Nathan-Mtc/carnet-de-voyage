// ================= L'AVENTURE AU CŒUR DU JEU (v28, étape 1) =================
// Le joueur : « Il faut du challenge, qu'on galère à trouver et à accéder à des endroits. Le personnage ne progresse pas assez. »
// Sans nouvel écran : tout se branche sur l'existant.
// 1. MATÉRIEL D'EXPÉDITION : 6 types × 3 niveaux (de base, pro, légendaire). Fabriqué à l'atelier (onglet Équipement),
//    acheté au magasin (de base), gagné en récompense (lieux verrouillés, défis). Un familier en équipe 2 au plus :
//    deux cases sur sa fiche (Compagnons › Talents). Effets : ouvre des lieux, moins de risques, un peu plus de butin.
// 2. MAÎTRISE DES TERRAINS : 6 terrains, niveaux 1 à 10, de l'XP à chaque voyage. Chaque niveau : voyage un peu plus court,
//    butin un peu meilleur, moins de risques ; certains niveaux sont demandés par les lieux verrouillés.
// 3. LIEUX VERROUILLÉS : 18 lieux réels, épingle à cadenas visible quand on zoome sur la région (limite d'épingles partagée
//    avec 38_quetes.js). Au toucher : conditions cochées ou non, récompense unique (objet, tenue, titre, pierres d'étoile).
// 4. EXPÉDITIONS À RISQUES : lieux verrouillés, voyages lointains ou en terrain difficile. 2 ou 3 choix risqués (scènes de
//    29_aventure.js) ; sans réponse, le choix prudent est pris. Conséquences : butin perdu, demi-tour, blessure (repos obligatoire
//    au foyer, poste Repos), raccourci secret, objet bonus. Résultat dans la fenêtre du butin.
// État : S.xpd = { eq: {k: [id, id]}, tx: {k: {terrain: xp}}, hurt: {k: fin}, won: {lieu: {k, at}}, titles: {k: [..]} }.
// Enveloppes : startTrip, collect, showHaul, renderVoyage, renderTalents, drawMarks, avFireChoice, avPickScene, avChoose, avChance,
// avAutoIdx, avApply, avTxt, avChipShort, famHasTool, famUseLine, bqStock, cmHowHTML. Expose window.__xp (tests).

// ---------------- terrains ----------------
// [id, nom, glyphe (17_regions.js), couleur]
const XP_TERR = [['montagne', 'Montagne', 'mont', '#8f9cb3'], ['mer', 'Mer', 'vague', '#4f97c4'], ['foret', 'Forêt', 'arbre', '#5fa274'], ['ville', 'Ville', 'tour', '#d98763'], ['desert', 'Désert', 'cactus', '#dba85c'], ['froid', 'Grand froid', 'flocon', '#7fb6e0']];
const XP_T = {}; XP_TERR.forEach(x => { XP_T[x[0]] = x; });
const XP_LV = [0, 40, 100, 190, 310, 460, 650, 880, 1160, 1500]; // XP cumulée pour atteindre les niveaux 1 à 10
const xpGly = (g, col, cls = '') => `<i class="rgb ${cls}" style="--rg:${col}" aria-hidden="true"><svg viewBox="0 0 24 24">${(typeof RG_GLYPH !== 'undefined' && RG_GLYPH[g]) || ''}</svg></i>`;
const xpTIco = (id, cls) => { const T = XP_T[id]; return T ? xpGly(T[2], T[3], cls) : ''; };
const xpLock = (cls = '') => xpGly('lock', '#7a6a5a', cls);

// ---------------- matériel ----------------
// [id, noms des 3 niveaux, à quoi il sert, couleur, terrains, contexte en plus (grotte, nuit, animaux), outil existant équivalent]
const XP_GEAR = [
  ['crampons', ['Crampons', 'Crampons pro', 'Crampons légendaires'], 'Montagne et haute altitude', '#8f9cb3', ['montagne', 'froid'], '', 'corde'],
  ['palmes', ['Palmes et tuba', 'Palmes et tuba pro', 'Palmes et tuba légendaires'], 'Mer et fonds marins', '#4fb3d9', ['mer'], '', 'masque'],
  ['lampe', ['Lampe frontale', 'Lampe frontale pro', 'Lampe frontale légendaire'], 'Grottes et nuit', '#f2c14e', [], 'cave', 'lampe'],
  ['gourde', ['Gourde d’expédition', 'Gourde d’expédition pro', 'Gourde d’expédition légendaire'], 'Désert et chaleur', '#7fbf9f', ['desert'], '', ''],
  ['manteau', ['Manteau polaire', 'Manteau polaire pro', 'Manteau polaire légendaire'], 'Grand froid', '#9fd1d8', ['froid'], '', ''],
  ['jumelles', ['Jumelles', 'Jumelles pro', 'Jumelles légendaires'], 'Animaux rares', '#3b4a7a', ['foret'], 'wild', ''],
];
const XP_G = {}; XP_GEAR.forEach(g => { XP_G[g[0]] = g; });
const XP_TIER = ['de base', 'pro', 'légendaire'];
const XP_GRAR = [1, 3, 4];
const XP_GBY = {}; XP_GEAR.forEach(g => g[1].forEach((n, i) => { XP_GBY[n] = { g: g[0], tier: i + 1 }; }));
const xpGearDef = (g, tier) => { const G = XP_G[g]; return [G[1][tier - 1], 'm', 'outil', XP_GRAR[tier - 1], null, G[3]]; };
const xpGearOf = it => (it ? XP_GBY[String(it.name || '').replace(/ \(chef-d’œuvre\)$/, '')] || null : null);
const xpGName = (g, tier) => XP_G[g] ? XP_G[g][1][tier - 1] : g;

// icônes : on réutilise 39_icones.js (plongée, gourde, jumelles, lampe torche) et on ajoute deux petits dessins
(function xpIcons() {
  try {
    ICO.crampons = ['#8f9cb3', c => iR(9, 7, 22, 6, 3, '#e5584f') + iP('M6 14 H34 L31 21 H9Z', c) + iL('M10 21 l-2 9 M16 21 l-1 9 M24 21 l1 9 M30 21 l2 9', IL, 2.4) + iL('M13 10 h14', '#fff', 1.4)];
    ICO.manteaup = ['#9fd1d8', c => iP('M14 6 L20 10 L26 6 L34 13 L30 19 L28 17 V35 H12 V17 L10 19 L6 13Z', c) + iP('M13 6 Q20 15 27 6 Q20 9 13 6Z', '#fffaf2', 1.2) + iL('M20 11 V35', IL, 1.3) + iC(17, 21, 1.3, '#fff', 0.8) + iC(17, 27, 1.3, '#fff', 0.8) + iL('M12 31 H28', '#fffaf2', 2.2)];
    ICO_RULES.unshift([/crampons/, 'crampons'], [/manteau polaire/, 'manteaup'], [/palmes|tuba/, 'plongee'], [/gourde d.expedition/, 'gourde']);
  } catch (e) { console.error('expédition icônes', e); }
})();
const xpGIco = (g, tier) => { try { const d = xpGearDef(g, tier); return itemIcon({ name: d[0], cat: 'm', sub: 'outil', rarity: d[3], color: d[5] }); } catch (e) { return ''; } };

// fabrication (atelier › Équipement) : de base et pro, à partir de matériaux
[
  ['crampons', 1, [['metal', 2], ['pierre', 1]], 15], ['palmes', 1, [['tissu', 1], ['verre', 1], ['metal', 1]], 15], ['gourde', 1, [['metal', 1], ['tissu', 1]], 10],
  ['manteau', 1, [['laine', 3], ['tissu', 1]], 20], ['jumelles', 1, [['verre', 2], ['metal', 1]], 20],
  ['crampons', 2, [['metal', 3], ['cristal', 1], ['pierre', 2]], 80], ['palmes', 2, [['verre', 2], ['metal', 2], ['coquillage', 2]], 80], ['lampe', 2, [['metal', 2], ['lumiere', 2], ['verre', 1]], 80],
  ['gourde', 2, [['metal', 2], ['cristal', 1], ['tissu', 2]], 80], ['manteau', 2, [['laine', 4], ['plume', 2], ['tissu', 2]], 90], ['jumelles', 2, [['verre', 3], ['metal', 2], ['cristal', 1]], 90],
].forEach(([g, tier, ing, c]) => { try { RECIPES.push({ id: `xg_${g}${tier}`, kind: 'Équipement', out: xpGearDef(g, tier), ing, coins: c }); } catch (e) {} });
// magasin : le matériel de base (2 articles par jour, rayon « Objets fabriqués »)
const XP_SHOP = ['crampons', 'palmes', 'gourde', 'manteau', 'jumelles'];
try { XP_SHOP.forEach(g => BQ_CAT.push({ key: 'xg_' + g, k: 't', lvl: 0, def: xpGearDef(g, 1) })); } catch (e) {}

// ---------------- lieux verrouillés ----------------
// need : [['g', type, niveau mini] | ['m', terrain, niveau mini]] ; ctx : cave (grotte), wild (animaux rares), night
const R4 = (n, cat, sub, look, col) => [n, cat, sub, 4, look, col];
const XP_PLACES = [
  { id: 'montblanc', name: 'Sommet du Mont-Blanc', lon: 6.8652, lat: 45.8326, terr: 'montagne', tags: ['montagne', 'neige'], need: [['g', 'crampons', 2], ['m', 'montagne', 4]], item: xpGearDef('crampons', 3), title: 'Vainqueur du Mont-Blanc', stones: 10 },
  { id: 'cervin', name: 'Le Cervin', lon: 7.6586, lat: 45.9763, terr: 'montagne', tags: ['montagne', 'neige'], need: [['g', 'crampons', 2], ['m', 'montagne', 6]], item: R4('Bonnet du Cervin', 'v', 'tete', 'bonnet', '#e5584f'), title: 'Vainqueur du Cervin', stones: 12 },
  { id: 'epave', name: 'Épave au large de la Bretagne', lon: -4.95, lat: 48.03, terr: 'mer', tags: ['mer'], need: [['g', 'palmes', 1], ['m', 'mer', 2]], item: R4('Boussole de l’épave', 'm', 'outil', null, '#c9a35a'), title: 'Plongeur de l’épave', stones: 6 },
  { id: 'padirac', name: 'Gouffre de Padirac', lon: 1.7497, lat: 44.8581, terr: 'montagne', ctx: 'cave', tags: ['montagne', 'foret'], need: [['g', 'lampe', 1], ['m', 'montagne', 2]], item: xpGearDef('lampe', 3), title: 'Explorateur de Padirac', stones: 6 },
  { id: 'sahara', name: 'Cœur du Sahara', lon: 5.53, lat: 23.29, terr: 'desert', tags: ['desert'], need: [['g', 'gourde', 2], ['m', 'desert', 4]], item: R4('Rose des sables', 'm', 'pierre', null, '#e9b48a'), title: 'Voyageur du Sahara', stones: 10 },
  { id: 'laponie', name: 'Aurores de Laponie', lon: 27.03, lat: 68.9, terr: 'froid', ctx: 'night', tags: ['neige', 'foret'], need: [['g', 'manteau', 2], ['m', 'froid', 3]], item: xpGearDef('manteau', 3), title: 'Chasseur d’aurores', stones: 10 },
  { id: 'barriere', name: 'Grande Barrière de corail', lon: 147.7, lat: -18.3, terr: 'mer', ctx: 'wild', tags: ['mer', 'ile'], need: [['g', 'palmes', 2], ['m', 'mer', 5]], item: xpGearDef('palmes', 3), title: 'Ami du corail', stones: 12 },
  { id: 'everest', name: 'Camp de base de l’Everest', lon: 86.85, lat: 28.0, terr: 'montagne', tags: ['montagne', 'neige'], need: [['g', 'crampons', 3], ['g', 'manteau', 2], ['m', 'montagne', 7]], item: R4('Bonnet des neiges de l’Everest', 'v', 'tete', 'bonnet', '#f2c14e'), title: 'Héros de l’Everest', stones: 15 },
  { id: 'mariannes', name: 'Fosse des Mariannes (Guam)', lon: 144.79, lat: 13.44, terr: 'mer', tags: ['mer', 'ile'], need: [['g', 'palmes', 3], ['m', 'mer', 8]], item: R4('Perle des abysses', 'm', 'perle', null, '#9fd8f0'), title: 'Maître des abysses', stones: 15 },
  { id: 'machu', name: 'Machu Picchu', lon: -72.545, lat: -13.163, terr: 'montagne', tags: ['montagne', 'monument'], need: [['g', 'crampons', 1], ['m', 'montagne', 5]], item: R4('Poncho des Andes', 'v', 'haut', 'pull', '#d9604f'), title: 'Gardien du Machu Picchu', stones: 10 },
  { id: 'kili', name: 'Kilimandjaro', lon: 37.355, lat: -3.066, terr: 'montagne', tags: ['montagne', 'neige'], need: [['g', 'crampons', 2], ['g', 'gourde', 1], ['m', 'montagne', 5]], item: R4('Sac à dos du Kilimandjaro', 'v', 'dos', 'sac', '#7fae4f'), title: 'Vainqueur du Kilimandjaro', stones: 12 },
  { id: 'canyon', name: 'Grand Canyon', lon: -112.11, lat: 36.1, terr: 'desert', tags: ['desert', 'montagne'], need: [['g', 'gourde', 2], ['m', 'desert', 5]], item: R4('Foulard du Grand Canyon', 'v', 'cou', 'foulard', '#d9733f'), title: 'Aventurier du Grand Canyon', stones: 10 },
  { id: 'islande', name: 'Glacier du Vatnajökull (Islande)', lon: -16.8, lat: 64.4, terr: 'froid', tags: ['neige', 'montagne'], need: [['g', 'crampons', 1], ['g', 'manteau', 1], ['m', 'froid', 4]], item: R4('Cristal du glacier', 'm', 'cristal', null, '#bfe3f6'), title: 'Marcheur des glaciers', stones: 10 },
  { id: 'cenote', name: 'Cénote du Yucatán', lon: -88.47, lat: 20.66, terr: 'mer', ctx: 'cave', tags: ['lac', 'foret'], need: [['g', 'palmes', 1], ['g', 'lampe', 1], ['m', 'mer', 3]], item: R4('Perle du cénote', 'm', 'perle', null, '#e8f4fa'), title: 'Plongeur du cénote', stones: 8 },
  { id: 'amazonie', name: 'Forêt amazonienne', lon: -62.2, lat: -3.4, terr: 'foret', ctx: 'wild', tags: ['foret', 'ile'], need: [['g', 'jumelles', 2], ['m', 'foret', 5]], item: R4('Cape de feuilles d’Amazonie', 'v', 'dos', 'cape', '#4f9f78'), title: 'Ami de l’Amazonie', stones: 12 },
  { id: 'antarctique', name: 'Antarctique', lon: -57.0, lat: -63.4, terr: 'froid', tags: ['neige', 'mer'], need: [['g', 'manteau', 3], ['m', 'froid', 8]], item: R4('Écharpe de l’aurore australe', 'v', 'cou', 'echarpe', '#9fe0d0'), title: 'Explorateur polaire', stones: 15 },
  { id: 'galapagos', name: 'Îles Galápagos', lon: -90.5, lat: -0.7, terr: 'mer', ctx: 'wild', tags: ['mer', 'ile'], need: [['g', 'jumelles', 2], ['m', 'mer', 4]], item: R4('Chemise à fleurs des Galápagos', 'v', 'haut', 'tshirt', '#7fc4a0'), title: 'Naturaliste des Galápagos', stones: 10 },
  { id: 'serengeti', name: 'Plaines du Serengeti', lon: 34.83, lat: -2.33, terr: 'desert', ctx: 'wild', tags: ['desert', 'campagne'], need: [['g', 'jumelles', 1], ['g', 'gourde', 1], ['m', 'desert', 3]], item: R4('Statue du lion du Serengeti', 'd', 'statue', null, '#e9b44a'), title: 'Ami des lions', stones: 8 },
];
const XP_P = {}; XP_PLACES.forEach(p => { XP_P[p.id] = p; });

// ---------------- état ----------------
function xpState() {
  if (!S.xpd || typeof S.xpd !== 'object' || Array.isArray(S.xpd)) S.xpd = {};
  const X = S.xpd;
  ['eq', 'tx', 'hurt', 'won', 'titles'].forEach(k => { if (!X[k] || typeof X[k] !== 'object' || Array.isArray(X[k])) X[k] = {}; });
  return X;
}
const xpCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const xpName = k => (CHARS[k] ? CHARS[k].name : '');
const xpE = k => xpCall(() => compE(k), '');
// matériel équipé (les objets vendus ou disparus sont oubliés)
function xpEq(k) {
  const X = xpState(); let a = X.eq[k];
  if (!Array.isArray(a)) a = X.eq[k] = [null, null];
  while (a.length < 2) a.push(null);
  a.length = 2;
  for (let i = 0; i < 2; i++) if (a[i] && !S.inv.some(it => it.id === a[i] && xpGearOf(it))) a[i] = null;
  return a;
}
const xpEqItems = k => xpEq(k).map(id => (id ? S.inv.find(it => it.id === id) : null));
function xpTierOf(k, g) { let t = 0; xpEqItems(k).forEach(it => { const G = xpGearOf(it); if (G && G.g === g) t = Math.max(t, G.tier); }); return t; }
const xpWornBy = id => { const X = xpState(); for (const k of Object.keys(X.eq)) if (S.comps && S.comps[k] && Array.isArray(X.eq[k]) && X.eq[k].includes(id)) return k; return null; };
// maîtrise
const xpTx = k => { const X = xpState(); if (!X.tx[k] || typeof X.tx[k] !== 'object') X.tx[k] = {}; return X.tx[k]; };
function xpLvl(k, terr) { const v = +xpTx(k)[terr] || 0; let l = 1; XP_LV.forEach((need, i) => { if (v >= need) l = i + 1; }); return l; }
function xpLvlFrac(k, terr) { const v = +xpTx(k)[terr] || 0, l = xpLvl(k, terr); if (l >= 10) return 1; return Math.max(0, Math.min(1, (v - XP_LV[l - 1]) / (XP_LV[l] - XP_LV[l - 1]))); }
function xpGain(k, terr, n) { const T = xpTx(k), l0 = xpLvl(k, terr); T[terr] = Math.round((+T[terr] || 0) + Math.max(0, n)); return { l0, l1: xpLvl(k, terr) }; }
// blessure
const xpHurtLeft = k => Math.max(0, (+xpState().hurt[k] || 0) - Date.now());
const xpMin = ms => { const m = Math.ceil(ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };

// terrain d'une destination
function xpTerrOf(d) {
  if (!d) return 'foret';
  if (d.xpl && XP_P[d.xpl]) return XP_P[d.xpl].terr;
  const tags = (d.tags || []).slice(); if (d.cat && typeof POI_CATS !== 'undefined' && POI_CATS[d.cat]) tags.push(POI_CATS[d.cat][3]);
  const has = x => tags.includes(x), lat = Math.abs(+d.lat || 0);
  if (has('neige') || lat >= 62) return 'froid';
  if (has('desert')) return 'desert';
  if (has('montagne')) return 'montagne';
  if (has('mer') || has('ile') || has('lac')) return 'mer';
  if (has('foret') || has('campagne')) return 'foret';
  if (has('ville') || has('monument')) return 'ville';
  const z = xpCall(() => rgZoneAt(d.lon, d.lat), null); if (z && /alpes/.test(z.id)) return 'montagne';
  return 'foret';
}
const xpCtxOf = d => ({ terr: xpTerrOf(d), cave: !!(d && d.xpl && XP_P[d.xpl] && XP_P[d.xpl].ctx === 'cave'), wild: !!(d && d.xpl && XP_P[d.xpl] && XP_P[d.xpl].ctx === 'wild'), night: xpCall(() => isNight(), false) || !!(d && d.xpl && XP_P[d.xpl] && XP_P[d.xpl].ctx === 'night') });
// meilleur niveau de matériel utile ici (0 à 3)
function xpGearFor(k, c) {
  let best = 0;
  xpEqItems(k).forEach(it => { const G = xpGearOf(it); if (!G) return; const D = XP_G[G.g]; if (D[4].includes(c.terr) || (D[5] === 'cave' && (c.cave || c.night)) || (D[5] === 'wild' && c.wild)) best = Math.max(best, G.tier); });
  return best;
}
// conditions d'un lieu verrouillé pour un familier
function xpConds(P, k) {
  return P.need.map(([ty, a, n]) => {
    if (ty === 'g') { const have = xpTierOf(k, a); return { ok: have >= n, ico: xpGIco(a, n), lbl: `${xpGName(a, n)}`, have: have ? XP_TIER[have - 1] : 'aucun' }; }
    const have = xpLvl(k, a); return { ok: have >= n, ico: xpTIco(a, 's'), lbl: `${XP_T[a][1]} niv. ${n}`, have: `niv. ${have}` };
  });
}
const xpMiss = (P, k) => xpConds(P, k).filter(c => !c.ok);
// risque (0 à 1) : matériel, maîtrise et traits ; conditions manquantes = très risqué
function xpRiskK(k, c, miss, base) {
  let r = base;
  r *= [1, 0.65, 0.45, 0.3][xpGearFor(k, c)];
  r *= 1 - 0.05 * (xpLvl(k, c.terr) - 1);
  if (xpCall(() => hasEff(k, 'audace'), false)) r *= 0.85;
  if (xpCall(() => hasEff(k, 'zen'), false)) r *= 0.85;
  if (miss) r = r * 1.6 + 0.3;
  return base <= 0 && !miss ? 0 : Math.max(0.03, Math.min(0.9, r));
}
const xpRisk = (t, base) => (t && t.xpe ? xpRiskK(t.comp, t.xpe, !!t.xpe.miss, base) : base);
const xpRiskWord = r => (r < 0.15 ? 'faibles' : r < 0.3 ? 'moyens' : r < 0.5 ? 'élevés' : 'très élevés');
const xpPct = r => `${Math.round(r * 100)} %`;
function xpIsExpe(d) {
  if (!d || d.poi) return false;
  if (d.xpl) return true;
  const km = xpCall(() => kmBetween(homeObj(), d), 0), terr = xpTerrOf(d);
  return km >= 3000 || (['montagne', 'froid', 'desert'].includes(terr) && km >= 400);
}
const xpTuto = () => xpCall(() => tuOn(), false);

// ---------------- scènes à risques (moteur de 29_aventure.js) ----------------
// xs : option prudente (prise sans réponse) ; xf/xft : échec de l'option prudente quand des conditions manquent
const XP_SCENES = [
  { id: 'xp_pont', b: ['xp'], xs: 1, xf: 'xback', xft: 'Le sentier s’effondre derrière {n}… Impossible d’aller plus loin : demi-tour !', q: 'Le pont de cordes est fragile et le ravin bien profond. {n} hésite…', o: [
    { a: 'Traverser (risque {r30})', p: 0.7, r: R_('Le pont grince, mais tient bon ! {n} gagne un temps fou.', 'time- x10'), f: R_('Crac ! Une planche cède et {n} se tord la patte en se rattrapant. Plus de peur que de mal, mais il faudra se reposer au foyer.', 'xhurt') },
    { a: 'Contourner (+temps)', r: R_('{n} fait le grand tour par le vallon. Plus long, mais sans risque.', 'time+') },
    { a: 'Poser les crampons', need: ['xg:crampons:1'], h: 'Crampons', r: R_('Crampons aux pattes, {n} passe par la paroi… et découvre un raccourci secret !', 'xcut rare') } ] },
  { id: 'xp_tempete', b: ['xp'], xs: 1, xf: 'xloot', xft: 'Même à l’abri, le vent souffle si fort qu’il emporte une partie du butin…', q: 'Le ciel devient noir : une tempête arrive ! Le vent siffle déjà dans les oreilles de {n}.', o: [
    { a: 'Continuer (risque {r40})', p: 0.6, r: R_('{n} file entre les rafales et arrive avant tout le monde. Bravo !', 'xcut loot'), f: R_('Une rafale arrache le sac ! {n} rattrape ce qu’{il} peut, mais une partie du butin s’envole.', 'xloot time+') },
    { a: 'S’abriter (+temps)', r: R_('{n} se blottit dans un abri de berger et attend que ça passe, au chaud.', 'time+') },
    { a: 'Enfiler le manteau', need: ['xg:manteau:1'], h: 'Manteau polaire', r: R_('Bien emmitouflé{e}, {n} avance tranquillement et ramasse ce que la tempête a laissé.', 'loot2') } ] },
  { id: 'xp_crevasse', b: ['xp'], xs: 1, xf: 'xback', xft: 'Le passage est trop dangereux sans le bon matériel : {n} doit faire demi-tour.', q: 'Une crevasse bleue barre le glacier. De l’autre côté, le sommet n’est plus très loin.', o: [
    { a: 'Sauter (risque {r35})', p: 0.65, r: R_('Hop ! {n} atterrit de l’autre côté et trouve un éclat brillant dans la glace.', 'rare time-'), f: R_('{n} glisse au bord et rebrousse chemin, le cœur battant. L’expédition s’arrête là : demi-tour !', 'xback') },
    { a: 'Chercher un passage (+temps)', r: R_('Un pont de neige plus loin : c’est long, mais {n} passe en douceur.', 'time+') },
    { a: 'Planter les crampons', need: ['xg:crampons:2'], h: 'Crampons pro', r: R_('Crampons pro bien plantés, {n} franchit la crevasse comme un chamois et repère un raccourci.', 'xcut rare') } ] },
  { id: 'xp_courant', b: ['xp'], xs: 1, xf: 'xloot', xft: 'Le courant emporte une partie du butin hors du sac…', q: 'Un fort courant tire vers le large. Au fond, quelque chose brille entre les algues.', o: [
    { a: 'Plonger (risque {r35})', p: 0.65, r: R_('{n} plonge, attrape le trésor et remonte en riant. Quelle prise !', 'rare x15'), f: R_('Le courant secoue {n} dans tous les sens. {Il} remonte sain{e} et sauf{e}… mais le sac s’est vidé à moitié.', 'xloot') },
    { a: 'Attendre (+temps)', r: R_('{n} attend que la mer se calme, assis{e} sur un rocher.', 'time+') },
    { a: 'Mettre les palmes', need: ['xg:palmes:1'], h: 'Palmes et tuba', r: R_('Palmes aux pattes, {n} glisse sous le courant et rapporte deux trésors des fonds marins !', 'rare loot') } ] },
  { id: 'xp_grotte', b: ['xp'], xs: 1, xf: 'xhurt', xft: 'Dans le noir, {n} se cogne la tête contre une stalactite. Aïe ! Repos obligatoire au retour.', q: 'L’entrée d’une grotte souffle un air frais. Au fond, on entend l’eau goutter… et il fait tout noir.', o: [
    { a: 'Entrer (risque {r40})', p: 0.6, r: R_('À tâtons, {n} trouve une salle pleine de cristaux. Magnifique !', 'rare loot'), f: R_('Dans le noir, {n} trébuche sur un caillou et s’écorche le genou. Un pansement, et repos au foyer au retour.', 'xhurt') },
    { a: 'Passer son chemin', r: R_('{n} préfère la lumière du jour et reprend la route.', 'x5') },
    { a: 'Allumer la lampe', need: ['xg:lampe:1'], h: 'Lampe frontale', r: R_('La lampe éclaire un passage secret ! {n} ressort de l’autre côté de la colline, avec un trésor.', 'xcut rare') } ] },
  { id: 'xp_dune', b: ['xp'], xs: 1, xf: 'xback', xft: 'Sans eau, impossible de continuer sous ce soleil : {n} fait demi-tour.', q: 'Le soleil tape fort et les dunes s’étendent à perte de vue. La gourde est bien légère…', o: [
    { a: 'Foncer (risque {r35})', p: 0.65, r: R_('{n} file de dune en dune et trouve une oasis cachée !', 'time- loot'), f: R_('Trop chaud ! {n} doit rebrousser chemin pour se rafraîchir. L’expédition s’arrête là.', 'xback') },
    { a: 'Attendre le soir (+temps)', r: R_('{n} fait la sieste à l’ombre d’un rocher et repart à la fraîche.', 'time+') },
    { a: 'Boire à la gourde', need: ['xg:gourde:1'], h: 'Gourde', r: R_('Une bonne gorgée, et {n} marche d’un bon pas jusqu’à un vieux puits plein de trouvailles.', 'loot2 time-') } ] },
  { id: 'xp_animal', b: ['xp'], xs: 1, xf: 'xloot', xft: 'Un petit malin a profité de l’attente pour chiper quelques objets dans le sac !', q: 'Des traces toutes fraîches ! Un animal très rare est passé par là, il y a quelques minutes.', o: [
    { a: 'Suivre (risque {r30})', p: 0.7, r: R_('Au bout des traces, l’animal rare pose pour la photo. Il laisse même un petit cadeau !', 'rare photo'), f: R_('Les traces tournent en rond… et pendant ce temps, un singe farceur fouille le sac de {n} !', 'xloot') },
    { a: 'Observer de loin', r: R_('{n} reste caché{e} et prend une jolie photo de loin.', 'photo') },
    { a: 'Sortir les jumelles', need: ['xg:jumelles:1'], h: 'Jumelles', r: R_('Aux jumelles, {n} repère l’animal… et son trésor caché sous une racine !', 'rare photo x10') } ] },
  { id: 'xp_froid', b: ['xp'], xs: 1, xf: 'xhurt', xft: 'Le froid pique les oreilles de {n}, qui rentre enrhumé{e} : repos au foyer !', q: 'Le froid mord les oreilles, la neige tombe en gros flocons. Le refuge est encore loin…', o: [
    { a: 'Continuer (risque {r40})', p: 0.6, r: R_('{n} serre les dents et atteint le refuge plus tôt que prévu. Le gardien lui offre un cadeau.', 'time- loot'), f: R_('Atchoum ! {n} attrape un gros rhume. Rien de grave, mais repos obligatoire au foyer au retour.', 'xhurt') },
    { a: 'Faire un feu (+temps)', r: R_('Un petit feu, une boisson chaude, et {n} repart réchauffé{e}.', 'time+') },
    { a: 'Enfiler le manteau', need: ['xg:manteau:1'], h: 'Manteau polaire', r: R_('Au chaud dans son manteau polaire, {n} admire le paysage et trouve un trésor sous la neige.', 'loot rare') } ] },
];
try { XP_SCENES.forEach(s => { AV_SCENES.push(s); AV_BY[s.id] = s; }); } catch (e) { console.error('expédition scènes', e); }
const XP_POOL = { montagne: ['xp_pont', 'xp_crevasse', 'xp_grotte', 'xp_tempete'], froid: ['xp_crevasse', 'xp_froid', 'xp_tempete'], mer: ['xp_courant', 'xp_tempete', 'xp_animal'], desert: ['xp_dune', 'xp_tempete', 'xp_animal'], foret: ['xp_pont', 'xp_grotte', 'xp_animal'], ville: ['xp_pont', 'xp_tempete', 'xp_grotte'] };
const XP_GSCENE = { crampons: 'xp_crevasse', palmes: 'xp_courant', lampe: 'xp_grotte', gourde: 'xp_dune', manteau: 'xp_froid', jumelles: 'xp_animal' };

// ---------------- branchements sur l'aventure ----------------
let xpForce = null, xpCtx = null;
if (typeof avPickScene === 'function') avPickScene = (orig => function (t, biome, forced) { return orig.call(this, t, biome, forced || xpForce); })(avPickScene);
if (typeof avFireChoice === 'function') avFireChoice = (orig => function (t, e, place, J) {
  if (!e || !e.xsc) return orig.apply(this, arguments);
  xpForce = e.xsc;
  try { const r = orig.apply(this, arguments); if (r) { const j = t.journal[t.journal.length - 1]; if (j && j.sc === e.xsc) j.xp = 1; } return r; }
  finally { xpForce = null; }
})(avFireChoice);
if (typeof avNeedOk === 'function') avNeedOk = (orig => function (k, need, t) {
  if (need && need.some(n => /^xg:/.test(n))) return need.some(n => { if (/^xg:/.test(n)) { const [, g, tier] = n.split(':'); return xpTierOf(k, g) >= +tier; } return orig.call(this, k, [n], t); });
  return orig.apply(this, arguments);
})(avNeedOk);
if (typeof avAutoIdx === 'function') avAutoIdx = (orig => function (t, node) { return node && node.xs != null ? node.xs : orig.apply(this, arguments); })(avAutoIdx);
if (typeof avChance === 'function') avChance = (orig => function (k, p) { return xpCtx ? 1 - xpRisk(xpCtx, 1 - p) : orig.apply(this, arguments); })(avChance);
if (typeof avTxt === 'function') avTxt = (orig => function (s, k) {
  s = String(s || '');
  if (s.includes('{r')) s = s.replace(/\{r(\d+)\}/g, (m, p) => xpPct(xpRisk(S.trips && S.trips[k], +p / 100)));
  return orig.call(this, s, k);
})(avTxt);
if (typeof avChipShort === 'function') avChipShort = (orig => function (c, l) { if (c === 'hurt' && /^Blessé/.test(String(l))) return 'blessé'; return orig.apply(this, arguments); })(avChipShort);
if (typeof avChoose === 'function') avChoose = (orig => function (t, j, oi, auto) {
  if (!j || !j.xp || j.resolved || !t) return orig.apply(this, arguments);
  const node = avNode(j), opt = node && node.o[oi];
  let patched = false;
  // conditions manquantes : même la prudence devient risquée
  if (opt && opt.p == null && t.xpe && t.xpe.miss) { opt.p = 1; opt.f = R_(node.xft || 'Demi-tour !', node.xf || 'xback'); patched = true; }
  xpCtx = t;
  try {
    const r = orig.apply(this, arguments);
    if (r === 'done' && /\bx(hurt|back)\b/.test(j.fx || '')) j.act = 'fall';
    return r;
  } finally { xpCtx = null; if (patched) { delete opt.p; delete opt.f; } }
})(avChoose);
if (typeof avApply === 'function') avApply = (orig => function (t, j, fx, place) {
  const toks = String(fx || '').split(' ').filter(Boolean), mine = toks.filter(x => /^x(loot|back|hurt|cut)$/.test(x));
  if (!mine.length) return orig.apply(this, arguments);
  const out = orig.call(this, t, j, toks.filter(x => !mine.includes(x)).join(' '), place), k = t.comp;
  for (const tok of mine) {
    try {
      if (tok === 'xloot') {
        const cand = t.bag.filter(it => !it.special && !it.xpr); const n = Math.min(cand.length, Math.max(1, Math.ceil(cand.length * 0.4)));
        cand.sort(() => Math.random() - 0.5).slice(0, n).forEach(it => { const i = t.bag.indexOf(it); if (i >= 0) t.bag.splice(i, 1); });
        out.chips.push(['give', n ? `−${n} objet${n > 1 ? 's' : ''} perdu${n > 1 ? 's' : ''}` : 'Rien à perdre, ouf !']);
        t.xpLost = (t.xpLost || 0) + n;
      } else if (tok === 'xback') {
        t.xpFail = 1;
        t.events.forEach(e => { if (!e.fired) e.fired = true; });
        const { fb } = tripPhases(t); t.elapsed = Math.min(t.total - 3e3, Math.max(t.elapsed, fb * t.total));
        out.chips.push(['back', 'Demi-tour : expédition ratée']);
      } else if (tok === 'xhurt') {
        t.xpHurt = 1; out.chips.push(['hurt', avTxt('Blessé{e} : repos au foyer au retour', k)]);
      } else if (tok === 'xcut') {
        const d = Math.max(5e3, (t.total - t.elapsed) * 0.25); t.elapsed = Math.min(t.total - 3e3, t.elapsed + d);
        out.chips.push(['fast', `−${avDurS(d)} (raccourci secret)`]);
      }
    } catch (e) { console.error('expédition', tok, e); }
  }
  return out;
})(avApply);
// outils : les crampons servent de corde, les palmes de masque, les lampes pro et légendaire de lampe
if (typeof famHasTool === 'function') famHasTool = (orig => function (k) {
  if (orig.apply(this, arguments)) return true;
  try { return S.inv.some(it => { const G = xpGearOf(it); return G && XP_G[G.g][6] === k; }); } catch (e) { return false; }
})(famHasTool);
if (typeof famUseLine === 'function') famUseLine = (orig => function (it) {
  const G = xpGearOf(it); if (G) return `Matériel d’expédition ${XP_TIER[G.tier - 1]} : ${XP_G[G.g][2].toLowerCase()}. À équiper sur la fiche du familier (Compagnons › Talents).`;
  return orig.apply(this, arguments);
})(famUseLine);

// ---------------- départ ----------------
function xpOnStart(k, t, dest) {
  const c = xpCtxOf(dest), lv = xpLvl(k, c.terr), g = xpGearFor(k, c);
  // maîtrise : un peu plus rapide ; matériel et maîtrise : un peu meilleur butin
  const f = 1 - 0.02 * (lv - 1);
  if (f < 1 && t.out > 0) { t.out = Math.round(t.out * f); t.stay = Math.round((t.stay || 0) * f); t.total = 2 * t.out + t.stay; }
  t.luck += 0.06 * (lv - 1) + [0, 0.3, 0.5, 0.8][g];
  t.xpTerr = c.terr;
  if (!xpIsExpe(dest)) return;
  const P = dest.xpl ? XP_P[dest.xpl] : null, miss = P ? xpMiss(P, k).length > 0 : false;
  t.xpe = { terr: c.terr, cave: c.cave, wild: c.wild, night: c.night, lock: P ? P.id : null, miss };
  const n = P ? 3 : 2, pool = (XP_POOL[c.terr] || XP_POOL.foret).slice().sort(() => Math.random() - 0.5);
  if (P) { const first = XP_GSCENE[P.need[0][1]]; pool.splice(pool.indexOf(first) >>> 0, pool.includes(first) ? 1 : 0); pool.unshift(first); }
  const ats = n === 3 ? [0.2, 0.42, 0.64] : [0.3, 0.6];
  ats.forEach((at, i) => { const sc = pool[i % pool.length]; if (sc) t.events.push({ at, type: 'choix', xsc: sc }); });
  t.events.sort((a, b) => a.at - b.at);
  t.journal.push({ t: Date.now(), kind: 'depart', text: P ? `${xpName(k)} part à l’assaut d’un lieu verrouillé : ${P.name} ! ${miss ? 'Il manque du matériel ou de l’expérience : les risques sont très élevés.' : 'Bien équipé' + xpE(k) + ', prêt' + xpE(k) + ' pour l’aventure.'}` : `C’est une expédition (${XP_T[c.terr][1].toLowerCase()}) : des choix risqués attendent ${xpName(k)} en route.` });
}
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, dest = plan.dest, left = xpHurtLeft(k);
  if (left > 0 && dest && !xpTuto()) { toast(`${xpName(k)} est blessé${xpE(k)} : repos au foyer encore ${xpMin(left)}. Envoyez un autre compagnon !`); return; }
  const before = S.trips[k], r = orig.apply(this, arguments);
  try { const t = S.trips[k]; if (t && t !== before && !t.tuto && dest) { xpOnStart(k, t, dest); save(); } } catch (e) { console.error('expédition départ', e); }
  return r;
})(startTrip);

// ---------------- retour ----------------
let xpHaulR = null;
function xpOnReturn(k, t) {
  const X = xpState(), terr = t.xpTerr || xpTerrOf(t.dest), P = t.xpe && t.xpe.lock ? XP_P[t.xpe.lock] : null, res = { k, terr, P: P ? P.id : null };
  const dd = xpCall(() => DURS.find(x => x.key === t.dur), null);
  let gain = 12 + Math.min(40, Math.round((t.dist || 0) / 150)) + Math.round(((dd && dd.luck) || 0) * 6) + (t.xpe ? 25 : 0);
  if (P && !t.xpFail) gain += 60;
  if (t.xpFail) gain = Math.round(gain / 2);
  const L = xpGain(k, terr, gain); res.gain = gain; res.l0 = L.l0; res.l1 = L.l1;
  if (t.xpe && t.xpFail) res.fail = 1;
  if (P && !t.xpFail) {
    res.win = 1;
    if (!X.won[P.id]) {
      res.first = 1; X.won[P.id] = { k, at: Date.now() };
      const it = makeItem(P.item, 0, `Récompense : ${P.name}`, P.tags, { fixed: P.item[3] }); it.xpr = 1; it.special = true; t.bag.push(it); res.item = it.name;
      (X.titles[k] = Array.isArray(X.titles[k]) ? X.titles[k] : []).push(P.title); res.title = P.title;
      if (typeof gainStones === 'function') gainStones(P.stones); else S.stones = (S.stones || 0) + P.stones;
      res.stones = P.stones;
    }
  }
  if (t.xpHurt) {
    const ms = (P ? 40 : 20) * 60e3; X.hurt[k] = Date.now() + ms; res.hurt = ms;
    try { fwState().job[k] = 'repos'; } catch (e) {}
  }
  if (t.xpLost) res.lost = t.xpLost;
  return res;
}
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  xpHaulR = null;
  if (t && t.done && !t.tuto) { try { xpHaulR = xpOnReturn(k, t); xpHaulR.at = Date.now(); } catch (e) { console.error('expédition retour', e); } }
  return orig.apply(this, arguments);
})(collect);
function xpHaulHTML(R) {
  const n = xpName(R.k), P = R.P ? XP_P[R.P] : null, rows = [];
  if (R.win && P) rows.push(`<p class="xph-big">${xpGly('etoile', '#e0a52a', 'm')}<span><b>Expédition réussie : ${esc(P.name)} !</b>${R.first ? `<small>Titre « ${esc(R.title)} » · ${esc(R.item)} · +${R.stones} pierres d’étoile</small>` : '<small>Déjà conquis : la récompense unique est déjà à vous.</small>'}</span></p>`);
  else if (R.fail) rows.push(`<p class="xph-big fail">${xpLock('m')}<span><b>Demi-tour${P ? ` avant ${esc(P.name)}` : ''} : l’expédition a échoué.</b><small>Rien de grave ! Mieux équipé${xpE(R.k)}, ${esc(n)} pourra réessayer quand vous voulez.</small></span></p>`);
  if (R.lost) rows.push(`<p>${xpGly('lock', '#c9604f', 's')}${R.lost} objet${R.lost > 1 ? 's' : ''} perdu${R.lost > 1 ? 's' : ''} en route.</p>`);
  if (R.hurt) rows.push(`<p class="xph-hurt"><img src="${portraitURI(R.k, 'dodo')}" alt="">${esc(n)} s’est fait un petit bobo : repos au foyer pendant ${xpMin(R.hurt)}, avec un bon câlin.</p>`);
  rows.push(`<p>${xpTIco(R.terr, 's')}${esc(XP_T[R.terr][1])} +${R.gain} XP${R.l1 > R.l0 ? ` · <b>niveau ${R.l1} !</b>` : ''}</p>`);
  return `<div class="xp-haul${R.win ? ' win' : R.fail ? ' fail' : ''}">${rows.join('')}</div>`;
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const R = xpHaulR;
    if (R && h && h.comp === R.k && Date.now() - R.at < 30000) {
      xpHaulR = null;
      const mb = document.querySelector('#modal .mbox'), hd = mb && mb.querySelector('.hhead');
      if (hd) hd.insertAdjacentHTML('afterend', xpHaulHTML(R)); else if (mb) mb.insertAdjacentHTML('afterbegin', xpHaulHTML(R));
    }
  } catch (e) { console.error('expédition butin', e); }
  return r;
})(showHaul);

// ---------------- panneau de départ ----------------
function xpCondsHTML(P, k) {
  return `<ul class="xp-conds">${xpConds(P, k).map(c => `<li class="${c.ok ? 'ok' : 'no'}"><span class="xp-ci">${c.ico}</span><span>${esc(c.lbl)}${c.ok ? '' : ` <small>(${esc(c.have)})</small>`}</span><b>${c.ok ? '✓' : '✗'}</b></li>`).join('')}</ul>`;
}
function xpRewardHTML(P) {
  const it = { name: P.item[0], cat: P.item[1], sub: P.item[2], rarity: 4, look: P.item[4], color: P.item[5] }, won = xpState().won[P.id];
  return `<div class="xp-rw${won ? ' got' : ''}"><span class="xp-ri">${xpCall(() => itemIcon(it), '')}</span><span><b>${won ? 'Déjà conquis' : 'Récompense unique'}</b><small>${esc(it.name)} · titre « ${esc(P.title)} » · ${P.stones} pierres d’étoile</small></span></div>`;
}
function xpGoHTML(d, k) {
  const left = xpHurtLeft(k);
  if (left > 0) return `<div class="xpgo hurt"><img src="${portraitURI(k, 'dodo')}" alt=""><span><b>${esc(xpName(k))} est blessé${xpE(k)}</b>Repos au foyer encore ${xpMin(left)}. Choisissez un autre compagnon en haut.</span></div>`;
  const c = xpCtxOf(d), lv = xpLvl(k, c.terr), T = XP_T[c.terr];
  if (!xpIsExpe(d)) return `<div class="xpgo mini">${xpTIco(c.terr, 's')}<span>${esc(T[1])} niv. ${lv} · ce voyage le fait progresser</span></div>`;
  const P = d.xpl ? XP_P[d.xpl] : null, miss = P ? xpMiss(P, k) : [], risk = xpRiskK(k, c, miss.length > 0, 0.35);
  let h = `<div class="xpgo expe${miss.length ? ' miss' : ''}"><b class="xpgo-t">${P ? xpLock('m') : xpTIco(c.terr, 'm')}<span>${P ? `Lieu verrouillé · ${esc(T[1])}` : `Expédition · ${esc(T[1])}`}<small>${P ? 3 : 2} choix risqués en route · ${esc(T[1])} niv. ${lv}</small></span></b>`;
  if (P) h += xpCondsHTML(P, k) + xpRewardHTML(P);
  h += `<span class="xp-risk r${risk < 0.15 ? 0 : risk < 0.3 ? 1 : risk < 0.5 ? 2 : 3}">Risques : <b>${xpRiskWord(risk)}</b></span>`;
  if (miss.length) h += `<p class="xp-warn">Il manque : ${miss.map(m => esc(m.lbl)).join(', ')}. Vous pouvez tenter quand même, mais les risques sont très élevés.</p>`;
  return h + `</div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel, d = plan.dest;
    if (box && d && !S.trips[k] && CHARS[k] && !xpTuto()) {
      const gb = box.querySelector('.gobar'), html = xpGoHTML(d, k);
      if (gb) gb.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
      if (xpHurtLeft(k) > 0) { const b = box.querySelector('#goBtn'); if (b) b.disabled = true; }
    }
  } catch (e) { console.error('expédition panneau', e); }
  return r;
})(renderVoyage);

// ---------------- fiche du familier (Compagnons › Talents) ----------------
let xpSlot = null;
function xpFicheHTML(k) {
  const items = xpEqItems(k), X = xpState(), left = xpHurtLeft(k);
  const slot = (it, i) => { const G = xpGearOf(it); return `<button class="xps${it ? ' on' : ''}${xpSlot === i ? ' sel' : ''}" data-xps="${i}" aria-label="${it ? esc(it.name) : 'Case de matériel vide'}" title="${it ? esc(it.name) + ' : ' + esc(XP_G[G.g][2]) : 'Équiper du matériel'}">${it ? itemIcon(it) : '<b>+</b>'}</button>`; };
  let h = `<div class="xpf"><div class="xpf-top"><div class="xpf-slots" role="group" aria-label="Matériel d’expédition">${items.map(slot).join('')}</div><div class="xpf-ter">${XP_TERR.map(([id, nm, , col]) => { const l = xpLvl(k, id); return `<span class="xpt" title="${esc(nm)} niv. ${l}" aria-label="${esc(nm)} niveau ${l}" style="--tc:${col}">${xpTIco(id, 's')}<u><i style="width:${(((l - 1) + xpLvlFrac(k, id)) / 10 * 100).toFixed(0)}%"></i></u></span>`; }).join('')}</div></div>`;
  if (xpSlot != null) {
    const mine = S.inv.filter(it => xpGearOf(it)).sort((a, b) => xpGearOf(b).tier - xpGearOf(a).tier);
    h += `<div class="xpf-pick">${mine.length ? mine.map(it => { const by = xpWornBy(it.id), cur = items[xpSlot] && items[xpSlot].id === it.id; return `<button class="xpp${cur ? ' on' : ''}" data-xpeq="${it.id}" ${by && by !== k ? 'disabled' : ''} title="${esc(it.name)}${by && by !== k ? ' (équipé par ' + esc(xpName(by)) + ')' : ''}">${itemIcon(it)}<small>${esc(XP_TIER[xpGearOf(it).tier - 1])}</small></button>`; }).join('') : '<span class="xpf-none">Pas de matériel : atelier › Équipement, ou magasin.</span>'}${items[xpSlot] ? `<button class="btn cream sm" data-xpun="${xpSlot}">Retirer</button>` : ''}</div>`;
  }
  const tl = Array.isArray(X.titles[k]) ? X.titles[k] : [];
  if (tl.length) h += `<div class="xpf-ti">${tl.slice(-3).reverse().map(x => `<span>${xpGly('etoile', '#e0a52a', 's')}${esc(x)}</span>`).join('')}</div>`;
  if (left > 0) h += `<p class="xpf-hurt">${esc(xpName(k))} est blessé${xpE(k)} : repos au foyer encore ${xpMin(left)}.</p>`;
  return h + `<p class="xpf-help">2 cases de matériel : il ouvre les lieux à cadenas de la carte et réduit les risques. Chaque voyage fait progresser son terrain.</p></div>`;
}
if (typeof renderTalents === 'function') renderTalents = (orig => function (k) {
  const h = orig.apply(this, arguments);
  try {
    if (!CHARS[k]) return h;
    const at = h.indexOf('<div class="cptree">');
    return at >= 0 ? h.slice(0, at) + xpFicheHTML(k) + h.slice(at) : h + xpFicheHTML(k);
  } catch (e) { console.error('expédition fiche', e); return h; }
})(renderTalents);
function xpEquip(k, slot, id) {
  const a = xpEq(k), it = S.inv.find(x => x.id === id), G = xpGearOf(it); if (!G || slot < 0 || slot > 1) return false;
  const by = xpWornBy(id); if (by && by !== k) return false;
  const other = a[1 - slot] && xpGearOf(S.inv.find(x => x.id === a[1 - slot]));
  if (a[1 - slot] === id) a[1 - slot] = null;
  else if (other && other.g === G.g) a[1 - slot] = null; // un seul objet de chaque type
  a[slot] = id; save(); return true;
}

// ---------------- carte : épingles à cadenas ----------------
const XP_PIN_ZOOM = 4; // visibles quand on zoome sur la région
let xpPins = [], xpPinSig = '', xpOpen = '', xpHooked = false;
function xpPinLab(P) {
  const k = S.sel, won = xpState().won[P.id];
  return `<div class="xplab"><b>${esc(P.name)}</b><span class="xp-for">${won ? `Conquis par ${esc(xpName(won.k) || 'vos familiers')}` : `Pour ${esc(xpName(k))} :`}</span>${xpCondsHTML(P, k)}${xpRewardHTML(P)}<button class="btn green sm" data-xpgo="${P.id}">Partir</button></div>`;
}
function xpMapUpdate() {
  if (typeof map === 'undefined' || !map || typeof ovEls === 'undefined' || !$('ov')) return;
  const on = tab === 'carte' && !document.body.classList.contains('firstrun') && !xpTuto() && map.getZoom() >= XP_PIN_ZOOM;
  let list = [];
  if (on) {
    const c = map.getContainer(), W = c.clientWidth, H = c.clientHeight, used = xpCall(() => qtPins.length, 0);
    const cap = Math.max(0, Math.min(3, 5 - used));
    list = XP_PLACES.map(P => { const p = map.project([P.lon, P.lat]); return { P, x: p.x, y: p.y, d: Math.hypot(p.x - W / 2, p.y - H / 2) }; })
      .filter(o => o.x > 16 && o.y > 60 && o.x < W - 16 && o.y < H - 60).sort((a, b) => a.d - b.d).slice(0, cap).map(o => o.P);
  }
  const won = xpState().won, sig = list.map(P => P.id + (won[P.id] ? '+' : '')).join(',') + '|' + xpOpen + '|' + S.sel;
  const alive = list.every((P, i) => ovEls['xl' + i] && ovEls['xl' + i].el.isConnected);
  xpPins = list;
  if (sig === xpPinSig && alive) return;
  xpPinSig = sig;
  for (const key of Object.keys(ovEls)) if (key.startsWith('xl')) { ovEls[key].el.remove(); delete ovEls[key]; }
  const ov = $('ov');
  list.forEach((P, i) => {
    const el = document.createElement('div'), w = !!won[P.id];
    el.className = 'ovm xppin' + (xpOpen === P.id ? ' open' : '') + (w ? ' won' : ''); el.dataset.xpl = P.id;
    el.innerHTML = `<div class="xpb">${w ? xpGly('etoile', '#e0a52a') : xpLock()}</div><span class="xpn">${esc(P.name)}</span>${xpOpen === P.id ? xpPinLab(P) : ''}`;
    ov.appendChild(el); ovEls['xl' + i] = { el, lon: P.lon, lat: P.lat };
  });
  if (typeof positionOverlay === 'function') positionOverlay();
}
function xpDest(P) { return { id: null, xpl: P.id, name: P.name, country: '', lat: P.lat, lon: P.lon, tags: P.tags.slice(), special: null }; }
function xpGo(id) {
  const P = XP_P[id]; if (!P) return;
  if (S.trips[S.sel]) { openSheet('voyage'); toast(`${xpName(S.sel)} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; }
  xpOpen = ''; xpPinSig = '';
  plan.dest = xpDest(P); openSheet('voyage'); drawMarks();
}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); try { xpMapUpdate(); } catch (e) { console.error(e); } return r; })(drawMarks);
try {
  $('ov').addEventListener('click', ev => {
    const m = ev.target.closest('.xppin'); if (!m) return;
    if (ev.target.closest('[data-xpgo]')) { xpGo(m.dataset.xpl); return; }
    xpOpen = xpOpen === m.dataset.xpl ? '' : m.dataset.xpl; xpPinSig = ''; xpMapUpdate();
    const lab = m.isConnected ? null : document.querySelector('.xppin.open .xplab'), ov = $('ov');
    if (lab && ov) { const r = lab.getBoundingClientRect(), o = ov.getBoundingClientRect(); let dx = 0; if (r.left < o.left + 8) dx = o.left + 8 - r.left; else if (r.right > o.right - 8) dx = o.right - 8 - r.right; lab.style.marginLeft = dx.toFixed(0) + 'px'; }
  });
} catch (e) {}
setInterval(() => {
  try {
    if (document.hidden) return;
    if (!xpHooked && typeof map !== 'undefined' && map && map.on) { xpHooked = true; map.on('moveend', () => { try { xpMapUpdate(); } catch (e) {} }); }
    xpMapUpdate();
  } catch (e) {}
}, 2000);

// ---------------- foyer : repos obligatoire ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-fwjob]'); if (!el) return;
  const k = el.dataset.fk; if (el.dataset.fwjob !== 'repos' && xpHurtLeft(k) > 0) { ev.stopImmediatePropagation(); ev.preventDefault(); toast(`${xpName(k)} est blessé${xpE(k)} : repos obligatoire encore ${xpMin(xpHurtLeft(k))}.`); }
}, true);

// ---------------- magasin : du matériel de base chaque jour ----------------
if (typeof bqStock === 'function') bqStock = (orig => function () {
  const items = orig.apply(this, arguments);
  try {
    if (Array.isArray(items) && !items.some(x => x && /^xg_/.test(x.key || ''))) {
      const d = xpCall(() => dayKey(), 0), a = XP_SHOP[d % XP_SHOP.length], b = XP_SHOP[(d + 2) % XP_SHOP.length];
      items.push({ key: 'xg_' + a, r: 'craft' }, { key: 'xg_' + b, r: 'craft' });
    }
  } catch (e) {}
  return items;
})(bqStock);

// ---------------- défis : du matériel légendaire ----------------
try {
  QT_DEFIS.push(
    { id: 'xp_terr5', title: 'Explorateur aguerri', txt: 'Atteindre le niveau 5 dans 2 terrains (sur un ou plusieurs familiers)', n: 2, cur: () => XP_TERR.filter(([id]) => Object.keys(S.comps || {}).some(k => xpLvl(k, id) >= 5)).length, rw: { k: 'item', lbl: 'Matériel légendaire', def: xpGearDef('jumelles', 3), coins: 800, stones: 8 } },
    { id: 'xp_lock3', title: 'Conquérant', txt: 'Conquérir 3 lieux verrouillés (cadenas sur la carte)', n: 3, cur: () => Object.keys(xpState().won).length, rw: { k: 'item', lbl: 'Matériel légendaire', def: xpGearDef('gourde', 3), coins: 1000, stones: 10 } });
} catch (e) {}

// ---------------- « Comment ça marche » ----------------
if (typeof cmHowHTML === 'function') cmHowHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  try {
    const add = `<div class="xp-how"><p>${xpGIco('crampons', 1)}<span><b>Matériel d’expédition</b> : 2 objets par familier (Compagnons › Talents). Il ouvre les lieux à cadenas et réduit les risques.</span></p><p>${xpTIco('montagne', 'm')}<span><b>Terrains</b> : chaque voyage fait progresser le terrain visité. Plus haut niveau = plus rapide, meilleur butin, moins de risques.</span></p><p>${xpLock('m')}<span><b>Expéditions</b> : lieux lointains ou difficiles, avec des choix risqués. Sans réponse, votre familier reste prudent.</span></p></div>`;
    const at = h.lastIndexOf('<button class="btn green" data-closemodal');
    return at >= 0 ? h.slice(0, at) + add + h.slice(at) : h;
  } catch (e) { return h; }
})(cmHowHTML);

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-xps],[data-xpeq],[data-xpun]'); if (!el || !el.closest('#panelBody')) return;
  const k = S.sel, d = el.dataset; if (!CHARS[k]) return;
  if (d.xps != null) xpSlot = xpSlot === +d.xps ? null : +d.xps;
  else if (d.xpeq) { if (xpSlot != null && xpEquip(k, xpSlot, d.xpeq)) { xpSlot = null; try { sfx('pop'); } catch (e) {} } }
  else if (d.xpun != null) { xpEq(k)[+d.xpun] = null; save(); xpSlot = null; }
  const b = $('panelBody'), top = b ? b.scrollTop : 0; renderPanel(); if (b) b.scrollTop = top;
});

// ---------------- style ----------------
(function xpCSS() {
  const st = document.createElement('style'); st.id = 'xpCSS';
  st.textContent = `
.xpf{display:flex;flex-direction:column;gap:6px;padding:8px 10px;border:2.5px solid var(--ink,#4a3528);border-radius:18px;background:#fffaf0}
.xpf-top{display:flex;align-items:center;gap:10px}
.xpf-slots{display:flex;gap:6px;flex:none}
.xps{width:52px;height:52px;border-radius:14px;border:2.5px dashed #b9a58a;background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;cursor:pointer;color:#b9a58a;font:800 22px var(--display,inherit)}
.xps.on{border-style:solid;border-color:var(--ink,#4a3528);box-shadow:0 3px 0 rgba(74,53,40,.25)}
.xps.sel{outline:3px solid var(--teal,#2f7f6c);outline-offset:1px}
.xps svg{width:100%;height:100%}
.xpf-ter{flex:1;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 8px}
.xpt{display:flex;align-items:center;gap:4px;min-width:0}
.xpt u{flex:1;height:7px;border-radius:4px;background:#ece2d0;overflow:hidden;text-decoration:none;border:1px solid rgba(74,53,40,.2)}
.xpt u i{display:block;height:100%;background:var(--tc);border-radius:4px}
.xpf-pick{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px;border-radius:12px;background:#f3ecdf}
.xpp{width:58px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 2px;border-radius:12px;border:2px solid var(--line,#e2d3bd);background:#fff;cursor:pointer;font:700 10px/1.1 var(--display,inherit);color:var(--ink2,#7a6250)}
.xpp svg{width:34px;height:34px}.xpp.on{border-color:var(--ink,#4a3528);background:#fff3c4}.xpp:disabled{opacity:.45}
.xpf-none{font-size:12.5px;color:var(--ink2,#7a6250)}
.xpf-ti{display:flex;flex-wrap:wrap;gap:4px}
.xpf-ti span{display:inline-flex;align-items:center;gap:4px;padding:2px 8px 2px 3px;border-radius:999px;background:#fff3c4;border:1.6px solid #e0a52a;font:800 12px var(--display,inherit);color:#7a5a10}
.xpf-hurt{margin:0;padding:5px 8px;border-radius:10px;background:#fde8ef;color:#a8455f;font-weight:700;font-size:13px}
.xpf-help{margin:0;font-size:12px;line-height:1.3;color:var(--ink2,#7a6250)}
.xpgo{display:flex;flex-direction:column;gap:6px;margin:8px 0;padding:8px 10px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#f2f7fb}
.xpgo.mini{flex-direction:row;align-items:center;gap:6px;padding:5px 9px;border-width:2px;border-color:var(--line,#e2d3bd);background:#fffaf0;font-size:13px;color:var(--ink2,#7a6250)}
.xpgo.miss{background:#fff1ea;border-color:#c9604f}
.xpgo.hurt{flex-direction:row;align-items:center;background:#fde8ef;border-color:#c9607e;font-size:13px}
.xpgo.hurt img{width:44px;height:48px;object-fit:contain;flex:none}.xpgo.hurt b{display:block;font:800 15px var(--display,inherit)}
.xpgo-t{display:flex;align-items:center;gap:8px;font:800 15px/1.15 var(--display,inherit)}
.xpgo-t small{display:block;font:600 12.5px var(--body,inherit);color:var(--ink2,#7a6250)}
.xp-conds{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
.xp-conds li{display:flex;align-items:center;gap:6px;font-size:13px;padding:2px 6px;border-radius:10px;background:#fff}
.xp-conds li>span:nth-child(2){flex:1}.xp-conds small{color:var(--ink2,#7a6250)}
.xp-conds li b{font:800 15px var(--display,inherit)}.xp-conds li.ok b{color:#2f7f4c}.xp-conds li.no b{color:#c9604f}
.xp-ci{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;flex:none}.xp-ci svg{width:24px;height:24px}
.xp-rw{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:12px;background:#fff8dc;border:1.6px solid #e0a52a}
.xp-rw.got{opacity:.7}.xp-ri{width:38px;height:38px;flex:none}.xp-ri svg{width:100%;height:100%}
.xp-rw b{display:block;font:800 13px var(--display,inherit)}.xp-rw small{font-size:12px;color:var(--ink2,#7a6250)}
.xp-risk{font-size:13px}.xp-risk b{padding:1px 8px;border-radius:999px;color:#fff;background:#3f9a5f}
.xp-risk.r1 b{background:#d9a03a}.xp-risk.r2 b{background:#e07a4f}.xp-risk.r3 b{background:#c9404f}
.xp-warn{margin:0;font-size:12.5px;font-weight:700;color:#a8452f}
.xppin{z-index:3}
.xppin .xpb{transform:translate(-50%,-100%);filter:drop-shadow(0 2px 0 rgba(74,53,40,.35))}
.xppin .xpb .rgb{--sz:30px}
.xppin .xpn{position:absolute;left:0;top:2px;transform:translateX(-50%);white-space:nowrap;font:800 11px var(--display,inherit);color:var(--ink,#4a3528);background:rgba(255,250,240,.92);border:1.5px solid var(--ink,#4a3528);border-radius:999px;padding:0 6px}
.xppin.won .xpn{background:#fff3c4}
.xplab{position:absolute;left:0;top:22px;transform:translateX(-50%);width:250px;display:flex;flex-direction:column;gap:5px;padding:8px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#fffaf0;box-shadow:0 4px 0 rgba(74,53,40,.3);cursor:default}
.xplab>b{font:800 15px var(--display,inherit)}.xp-for{font-size:12px;color:var(--ink2,#7a6250)}
.xp-haul{margin:8px 0;padding:8px 10px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#f2f7fb;display:flex;flex-direction:column;gap:4px}
.xp-haul.win{background:linear-gradient(180deg,#fff6c8,#fffaf0);border-color:#e0a52a}
.xp-haul.fail{background:#fff1ea}
.xp-haul p{margin:0;display:flex;align-items:center;gap:6px;font-size:13px}
.xp-haul .xph-big b{display:block;font:800 15px/1.2 var(--display,inherit)}.xp-haul .xph-big small{display:block;font-size:12.5px;color:var(--ink2,#7a6250)}
.xp-haul .xph-hurt img{width:36px;height:40px;object-fit:contain;flex:none}
.xp-how{display:flex;flex-direction:column;gap:6px;margin:10px 0;text-align:left}
.xp-how p{margin:0;display:flex;align-items:center;gap:8px;font-size:13px}.xp-how p>svg{width:32px;height:32px;flex:none}
@media (max-width:420px){.xpf-top{flex-direction:column;align-items:stretch}.xpf-slots{justify-content:center}}
`;
  document.head.appendChild(st);
})();

window.__xp = {
  state: xpState, PLACES: XP_PLACES, GEAR: XP_GEAR, lvl: xpLvl, gain: xpGain, terrOf: xpTerrOf, eq: xpEq, equip: xpEquip, hurtLeft: xpHurtLeft, risk: xpRiskK, conds: xpConds,
  mapUpdate: xpMapUpdate, go: xpGo, dest: id => xpDest(XP_P[id]), pins: () => xpPins.map(P => P.id),
  give: (g, tier) => { const it = makeItem(xpGearDef(g, tier), 0, 'test', [], { fixed: XP_GRAR[tier - 1] }); S.inv.push(it); save(); return it.id; },
  api: () => ({ S, plan, startTrip, collect, tick, openSheet, renderPanel, drawMarks, avOpen: typeof avOpen === 'function' ? avOpen : null, fwState, tripPhases }),
};

// Un choix d'expédition en attente : la scène montre la destination (le glacier), pas la route (le lac)
if (typeof avWhere === 'function') avWhere = (orig => function (t) {
  const w = orig.apply(this, arguments);
  try {
    const pi = typeof avPending === 'function' ? avPending(t) : -1, j = pi >= 0 ? t.journal[pi] : null;
    if (j && j.xp && t.dest && !t.dest.poi && w.ph !== 'sejour') return Object.assign({}, w, { name: t.dest.name, tags: t.dest.tags || w.tags, lon: t.dest.lon, lat: t.dest.lat });
  } catch (e) {}
  return w;
})(avWhere);

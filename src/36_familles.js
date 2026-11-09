// ================= v20 : LES 7 FAMILLES D'OBJETS (agent FAMILLES) =================
// Tout objet appartient à UNE famille, calculée par règles (cat, sub, nom) : famOf(it). Les anciennes sauvegardes sont classées à la volée.
// Expose : FAM, famOf, famUseLine, famTopHTML, famHasTool, jardinHTML (+ famSow, famHarvest), famOpenChest, famCut, famAssemble,
//          famLoot (appelé par 30_butin.js), famAdvLoot (fx 'fam:…' de 29_aventure.js). Aucune fenêtre ne s'ouvre seule.
const FAM = {
  nourriture: { nom: 'Nourriture', couleur: '#c8582a', fond: '#fdeee0', icone: '🍎', usage: 'nourrir ses familiers (bonheur), ingrédient des commerces de bouche' },
  materiaux: { nom: 'Matériaux', couleur: '#8a5a3a', fond: '#f4ebe1', icone: '🪵', usage: 'fabriquer à l’atelier : vêtements, équipement, produits' },
  vetements: { nom: 'Vêtements', couleur: '#b8456a', fond: '#fde6ef', icone: '👕', usage: 'porter : ouvre des chemins en aventure' },
  jardin: { nom: 'Jardin', couleur: '#3f8a3f', fond: '#e5f4df', icone: '🌱', usage: 'semer au foyer pour récolter, ou attirer une espèce en voyage' },
  equipement: { nom: 'Équipement', couleur: '#2a7092', fond: '#e0f0f6', icone: '🧭', usage: 'outils et cartes : actions en aventure, voyages plus courts, lieux cachés' },
  nature: { nom: 'Nature', couleur: '#2d7f7a', fond: '#ddf3f1', icone: '🐚', usage: 'insectes et coquillages : une collection à compléter, qui se revend bien' },
  tresors: { nom: 'Trésors', couleur: '#9a6a10', fond: '#fbf0d2', icone: '💎', usage: 'pierres à tailler, reliques à assembler, coffres à ouvrir, raretés' },
};
const FAM_IDS = Object.keys(FAM);

// ---------------- données ----------------
// outils : [clé, nom, rareté, couleur, effet]
const FAM_TOOLS = [
  ['pelle', 'Pelle de voyage', 1, '#a87a50', 'Creuser en aventure : coffres enfouis'],
  ['canne', 'Canne à pêche', 1, '#d9c38f', 'Pêcher en aventure, au bord de l’eau'],
  ['lampe', 'Lampe frontale', 2, '#f2c14e', 'Explorer les grottes en aventure'],
  ['filet', 'Filet à papillons', 1, '#7fae4f', 'Attraper les insectes ; plus de trouvailles nature'],
  ['boussole', 'Boussole', 2, '#c9a35a', 'Tous les voyages 15 % plus courts'],
  ['carte', 'Carte de région', 1, '#efe2c4', 'Révèle un lieu caché au prochain départ'],
  ['loupe', 'Loupe de naturaliste', 1, '#9fd8f0', 'Insectes et coquillages plus rares'],
  ['burin', 'Burin de lapidaire', 1, '#8f9cb3', 'Tailler une pierre précieuse (s’use)'],
  ['masque', 'Masque de plongée', 1, '#4fb3d9', 'Plonger en aventure, même sans savoir nager'],
  ['corde', 'Corde d’escalade', 1, '#e9a03a', 'Grimper en aventure, même sans griffes'],
];
const FAM_TOOL_BY = {}; FAM_TOOLS.forEach(d => { FAM_TOOL_BY[d[1]] = d; }); FAM_TOOL_BY['Canne à pêche en bambou'] = FAM_TOOLS[1];
// graines : [nom, paysages (null = déjà trouvable ailleurs), minutes, récolte, quantité]
const FAM_SEEDS = [
  ['Pépins de pomme', ['campagne', 'foret'], 6, ['Pomme du verger', 'n', 'pomme', 0], 2],
  ['Graines de tournesol', ['campagne'], 4, ['Tournesol', 'm', 'fleur', 0, null, '#f2c14e'], 1],
  ['Bulbe de tulipe', ['ville', 'campagne'], 5, ['Tulipe', 'm', 'fleur', 0, null, '#e5587f'], 2],
  ['Graines de fraisier', ['foret', 'campagne'], 3, ['Fraises des bois', 'n', 'fruit', 0, null, '#e5584f'], 2],
  ['Semis de lavande', ['agrumes', 'montagne'], 8, ['Bouquet de lavande', 'm', 'fleur', 1, null, '#9b86d6'], 1],
  ['Graines de nénuphar', ['lac'], 6, ['Nénuphar', 'm', 'fleur', 0, null, '#f6c2cf'], 2],
  ['Rhizome de bambou', ['montagne', 'foret'], 10, ['Pousse de bambou', 'n', 'legume', 1, null, '#7fbf6a'], 1],
  ['Pépins de citron', ['agrumes'], 12, ['Citron doux', 'n', 'agrume', 1], 2],
  ['Spores de lichen', ['neige', 'montagne'], 15, ['Lichen des rennes', 'm', 'feuille', 1, null, '#c9d4a6'], 1],
  ['Graines d’eucalyptus', ['ile'], 15, ['Feuille d’eucalyptus', 'm', 'feuille', 1, null, '#7fae8f'], 1],
  ['Graines de théier', ['montagne', 'ville'], 18, ['Thé matcha', 'n', 'boisson', 1, null, '#7fae4f'], 1],
  ['Noyau de dattier', ['desert'], 20, ['Dattes', 'n', 'sucre', 0], 3],
  ['Graine de passiflore', ['ile'], 22, ['Fruit de la passion', 'n', 'fruit', 1, null, '#7a5fb8'], 1],
  ['Graines d’edelweiss', ['montagne', 'neige'], 12, ['Edelweiss séché', 'm', 'fleur', 2], 1],
  ['Gousse de vanillier', ['ile', 'agrumes'], 30, ['Gousse de vanille', 'n', 'sucre', 2, null, '#4a3424'], 1],
  ['Pomme de pin', null, 10, ['Pignons de pin', 'n', 'fruit', 0, null, '#c9a36b'], 1],
  ['Gland doré', null, 20, ['Chêne miniature', 'd', 'plante', 3, null, '#7fae4f'], 1],
  ['Graine de géant', null, 30, ['Citrouille géante', 'n', 'legume', 3, null, '#f08a3a'], 1],
  ['Graines rares', null, 15, ['Bouquet de fleurs rares', 'm', 'fleur', 2, null, '#f39ab0'], 1],
  ['Graine d’arbre-monde', null, 30, ['Fruit de l’arbre-monde', 'n', 'fruit', 4, null, '#9fe0d0'], 1],
];
const FAM_SEED_BY = {}; FAM_SEEDS.forEach(d => { FAM_SEED_BY[d[0]] = d; });
const FAM_SEED_COL = ['#c9a07a', '#a8b45a', '#9c6b4a', '#e9a0a0', '#7fae4f'];
// insectes et coquillages : [nom, sub, paysages, saisons ('' = toute l'année), heure ('' | 'jour' | 'nuit'), rareté, couleur]
const FAM_NATURE = [
  ['Coccinelle', 'insecte', ['campagne', 'foret', 'ville'], 'printemps,été', 'jour', 0, '#e5584f'],
  ['Papillon citron', 'insecte', ['campagne', 'foret'], 'printemps,été', 'jour', 0, '#f2d64e'],
  ['Machaon', 'insecte', ['montagne', 'campagne'], 'été', 'jour', 1, '#f2c14e'],
  ['Paon-du-jour', 'insecte', ['foret', 'campagne'], 'été,automne', 'jour', 1, '#c9604f'],
  ['Morpho bleu', 'insecte', ['ile', 'foret'], '', 'jour', 3, '#3f8fe0'],
  ['Luciole', 'insecte', ['foret', 'campagne', 'lac'], 'été', 'nuit', 1, '#e8f59a'],
  ['Libellule bleue', 'insecte', ['lac'], 'printemps,été', 'jour', 0, '#4fb3d9'],
  ['Demoiselle émeraude', 'insecte', ['lac', 'foret'], 'printemps,été', '', 1, '#2faf6f'],
  ['Grillon champêtre', 'insecte', ['campagne'], 'été', 'nuit', 0, '#4a3a2a'],
  ['Cigale', 'insecte', ['agrumes', 'desert'], 'été', 'jour', 0, '#a8a04a'],
  ['Scarabée doré', 'insecte', ['desert'], '', 'jour', 2, '#e3b94a'],
  ['Bousier', 'insecte', ['desert', 'campagne'], '', '', 0, '#3a3a4a'],
  ['Lucane cerf-volant', 'insecte', ['foret'], 'été', 'nuit', 2, '#7a4a2a'],
  ['Abeille charpentière', 'insecte', ['campagne', 'ville'], 'printemps,été', 'jour', 0, '#3b4a7a'],
  ['Bourdon velu', 'insecte', ['montagne', 'campagne'], 'printemps,été,automne', 'jour', 0, '#f2b13e'],
  ['Phasme feuille', 'insecte', ['ile', 'foret'], '', '', 1, '#7fae4f'],
  ['Sauterelle verte', 'insecte', ['campagne'], 'été,automne', '', 0, '#8fbf4f'],
  ['Mante religieuse', 'insecte', ['campagne', 'agrumes'], 'été,automne', '', 1, '#a8cf6a'],
  ['Papillon lune', 'insecte', ['foret'], '', 'nuit', 2, '#bfe8c8'],
  ['Puce des neiges', 'insecte', ['neige', 'montagne'], 'hiver', '', 1, '#5c6b94'],
  ['Apollon des cimes', 'insecte', ['montagne'], 'été', 'jour', 2, '#f4f1ea'],
  ['Scarabée arc-en-ciel', 'insecte', ['ile'], '', '', 3, '#9a6fd6'],
  ['Fourmi pot-de-miel', 'insecte', ['desert'], '', 'nuit', 2, '#f2a03a'],
  ['Monarque', 'insecte', ['campagne', 'ville'], 'automne', 'jour', 2, '#f08a3a'],
  ['Gerris', 'insecte', ['lac'], '', '', 0, '#7a6a5a'],
  ['Escargot de Bourgogne', 'coquillage', ['campagne', 'foret'], 'printemps,automne', '', 0, '#c9a36b'],
  ['Coque', 'coquillage', ['mer'], '', '', 0, '#e9dcc0'],
  ['Moule bleue', 'coquillage', ['mer', 'lac'], '', '', 0, '#3b4a7a'],
  ['Bigorneau', 'coquillage', ['mer'], '', '', 0, '#5c4a3a'],
  ['Couteau de mer', 'coquillage', ['mer'], '', '', 0, '#d9c3a6'],
  ['Patelle', 'coquillage', ['mer', 'ile'], '', '', 0, '#b9a48f'],
  ['Coquille Saint-Jacques', 'coquillage', ['mer'], 'automne,hiver', '', 1, '#f2a06b'],
  ['Porcelaine tigrée', 'coquillage', ['ile'], '', '', 1, '#c98f4f'],
  ['Étoile de mer', 'coquillage', ['mer', 'ile'], '', '', 1, '#f08a5a'],
  ['Oursin vert', 'coquillage', ['mer'], '', '', 1, '#5f8a4f'],
  ['Conque rose', 'coquillage', ['ile'], '', '', 2, '#f6a6b8'],
  ['Ormeau nacré', 'coquillage', ['mer'], '', '', 2, '#9fd8c4'],
  ['Murex épineux', 'coquillage', ['mer', 'agrumes'], '', '', 2, '#e9c4a0'],
  ['Nautile', 'coquillage', ['ile', 'mer'], '', 'nuit', 3, '#f4e4d0'],
  ['Dent de requin fossile', 'coquillage', ['mer', 'desert'], '', '', 3, '#8a8a8a'],
  ['Ammonite', 'coquillage', ['montagne', 'desert'], '', '', 3, '#c9a07a'],
];
try { ING.insecte = [['insecte', 'scarabee'], 'Insecte']; } catch (e) {} // v36 : offrandes aux gardiens, appâts (fennec, lémurien)
const FAM_NAT_BY = {}; FAM_NATURE.forEach(d => { FAM_NAT_BY[d[0]] = d; });
// pierres précieuses : [clé, brute, taillée, zones, rareté, couleur] ; zones : eur, afr, asie, ase (Asie du Sud-Est), oce, amn, ams
const FAM_GEMS = [
  ['grenat', 'Grenat brut', 'Grenat taillé', ['eur', 'amn'], 1, '#a83246'],
  ['amethyste', 'Améthyste brute', 'Améthyste taillée', ['eur', 'ams'], 1, '#9b6fd6'],
  ['aigue', 'Aigue-marine brute', 'Aigue-marine taillée', ['amn', 'eur', 'afr'], 2, '#7fd0e0'],
  ['turquoise', 'Turquoise brute', 'Turquoise taillée', ['afr', 'asie', 'amn'], 2, '#4fbfb0'],
  ['topaze', 'Topaze brute', 'Topaze taillée', ['afr', 'ams'], 2, '#f2a93b'],
  ['jade', 'Jade brut', 'Jade taillé', ['asie', 'ase'], 2, '#5fae7f'],
  ['saphir', 'Saphir brut', 'Saphir taillé', ['asie', 'ase', 'oce'], 3, '#3f6fcf'],
  ['rubis', 'Rubis brut', 'Rubis taillé', ['ase', 'asie', 'afr'], 3, '#d9304f'],
  ['emeraude', 'Émeraude brute', 'Émeraude taillée', ['ams'], 3, '#2faf6f'],
  ['opale', 'Opale brute', 'Opale taillée', ['oce'], 3, '#c9e8f0'],
  ['diamant', 'Diamant brut', 'Diamant taillé', ['afr', 'oce'], 4, '#e8f4fa'],
];
const FAM_GEM_BY = {}; FAM_GEMS.forEach(g => { FAM_GEM_BY[g[1]] = { g, cut: false }; FAM_GEM_BY[g[2]] = { g, cut: true }; });
const FAM_ZONE_L = { eur: 'Europe', afr: 'Afrique', asie: 'Asie', ase: 'Asie du Sud-Est', oce: 'Océanie', amn: 'Amérique du Nord', ams: 'Amérique du Sud' };
function famZone(lon, lat) {
  if (lon < -30) return lat > 15 ? 'amn' : 'ams';
  if (lon > 110 && lat < -10) return 'oce';
  if (lon >= 90 && lat < 25) return 'ase';
  if (lon > 60 || (lon > 52 && lat > 8)) return 'asie';
  if (lat < 35 || (lon > 32 && lat < 40)) return 'afr';
  return 'eur';
}
// reliques : 3 fragments chacune, près de vrais monuments [site, lat, lon]
const FAM_RELICS = [
  { id: 'pharaon', nom: 'Couronne des Pharaons', col: '#f2c14e', frags: [['Gizeh', 29.979, 31.134], ['Louxor', 25.719, 32.657], ['Abou Simbel', 22.336, 31.626]] },
  { id: 'jade', nom: 'Sceptre de l’Empereur de jade', col: '#5fae7f', frags: [['la Grande Muraille', 40.432, 116.570], ['la Cité interdite', 39.916, 116.397], ['Xi’an', 34.385, 109.273]] },
  { id: 'laurier', nom: 'Couronne de laurier antique', col: '#c9b84a', frags: [['le Colisée', 41.890, 12.492], ['l’Acropole', 37.971, 23.726], ['le Pont du Gard', 43.947, 4.535]] },
  { id: 'soleil', nom: 'Masque du Soleil', col: '#f08a3a', frags: [['Machu Picchu', -13.163, -72.545], ['Chichén Itzá', 20.684, -88.568], ['Teotihuacan', 19.692, -98.844]] },
];
const famFragName = (R, i) => `Fragment de ${R.nom.charAt(0).toLowerCase() + R.nom.slice(1)} (${R.frags[i][0]})`;
// coffres et clés
const FAM_LOCKS = { bois: { de: 'en bois', r: 1, col: '#b07a4f', w: 60, kw: 50 }, fer: { de: 'en fer', r: 2, col: '#8f9cb3', w: 28, kw: 30 }, or: { de: 'en or', r: 3, col: '#f2c14e', w: 10, kw: 15 }, ancienne: { de: 'ancien', kde: 'ancienne', r: 4, col: '#7a6a5a', w: 2, kw: 5 } };
const FAM_CHEST_BY = { 'Coffre en bois': 'bois', 'Coffre en fer': 'fer', 'Coffre en or': 'or', 'Coffre ancien': 'ancienne' };
const FAM_KEY_BY = { 'Clé en bois': 'bois', 'Clé en fer': 'fer', 'Clé en or': 'or', 'Clé ancienne': 'ancienne', 'Clé de crypte': 'ancienne', 'Clé du réverbère': 'fer', 'Clé de la ville': 'or' };
const famChestName = l => 'Coffre ' + FAM_LOCKS[l].de;
const famKeyName = l => 'Clé ' + (FAM_LOCKS[l].kde || FAM_LOCKS[l].de);
// exceptions écrites à la main (nom → famille)
// v36 : « Lunettes anti-sable », « Raquettes à neige », « Gourde de refuge », « Carte des marées », « Plan du métro » ne sont plus
// rangés dans Équipement (ce ne sont pas des outils) : ils suivent leur matière (papier, bois, plastique…).
const FAM_EXC = { 'Pousse de bambou': 'jardin', 'Hamac tressé': 'materiaux', 'Écaille de brochet': 'nature', 'Écaille de sirène': 'tresors' };

// ---------------- classement ----------------
const famName = it => String((it && it.name) || '').replace(/ \(chef-d’œuvre\)$/, '');
let _famIngSubs = null;
function famIngSubs() { if (!_famIngSubs) { _famIngSubs = new Set(); try { Object.values(ING).forEach(v => v[0].forEach(s => _famIngSubs.add(s))); } catch (e) {} } return _famIngSubs; }
function famIsBait(it) { try { return typeof nsBaitSps === 'function' && nsBaitSps(it).length > 0; } catch (e) { return false; } }
function famOf(it) {
  if (!it) return 'materiaux';
  if (it.fam && FAM[it.fam]) return it.fam;
  const nm = famName(it), sub = it.sub;
  if (FAM_EXC[nm]) return FAM_EXC[nm];
  if (it.tresor || it.relic || it.rel || FAM_CHEST_BY[nm] || FAM_KEY_BY[nm] || FAM_GEM_BY[nm]) return 'tresors';
  if (FAM_TOOL_BY[nm] || it.cat === 't') return 'equipement';
  if (FAM_SEED_BY[nm] || FAM_NAT_BY[nm]) return FAM_NAT_BY[nm] ? 'nature' : 'jardin';
  if (it.cat === 'v') return 'vetements';
  if (it.cat === 'n') return 'nourriture';
  if (it.cat === 'd') return sub === 'plante' ? 'jardin' : 'tresors';
  if (['insecte', 'coquillage', 'corail', 'scarabee'].includes(sub)) return 'nature';
  if (['graine', 'plante', 'appat', 'pousse'].includes(sub)) return 'jardin';
  if (sub === 'outil') return 'equipement';
  if (['gemme', 'fragment', 'coffre', 'cle', 'perle', 'medaille', 'masque', 'relique'].includes(sub)) return 'tresors';
  if (['fleur', 'feuille', 'mousse'].includes(sub) && famIsBait(it)) return 'jardin';
  if (!famIngSubs().has(sub)) return 'tresors'; // matière qui n'entre dans aucune recette : une rareté à vendre
  return 'materiaux';
}
const famToolOf = it => { const d = FAM_TOOL_BY[famName(it)]; return d ? d[0] : null; };
function famHasTool(k) { try { return (S.inv || []).some(i => famToolOf(i) === k); } catch (e) { return false; } }
function famSeedOf(it) {
  const d = FAM_SEED_BY[famName(it)]; if (d) return { min: d[2], out: d[3], n: d[4] };
  if (it && it.sub === 'graine' && famOf(it) === 'jardin') return { min: 8, out: ['Fleurs du jardin', 'm', 'fleur', Math.min(2, it.rarity || 0), null, '#f39ab0'], n: 1 };
  return null;
}
const famIsChest = it => FAM_CHEST_BY[famName(it)] || null;
const famIsKey = it => FAM_KEY_BY[famName(it)] || null;
const famGemOf = it => FAM_GEM_BY[famName(it)] || null;
const famRelOf = it => (it && it.rel ? FAM_RELICS.find(R => R.id === it.rel) : null);
const famSpN = sp => { try { return typeof spName === 'function' ? spName(sp) : sp; } catch (e) { return sp; } };

// ---------------- une ligne d'usage, toujours ----------------
function famRecipeFor(it) { try { return RECIPES.find(r => r.ing.some(([k]) => ING[k] && ING[k][0].includes(it.sub))) || null; } catch (e) { return null; } }
function famNatGot() { return FAM_NATURE.filter(d => S.dex && S.dex[d[0]]).length; }
function famUseLine(it) {
  const f = famOf(it), nm = famName(it);
  try {
    if (f === 'nourriture') { const b = famIsBait(it) ? nsBaitSps(it)[0] : null; return b ? `Nourrir, ou attirer : ${famSpN(b)}` : 'Nourrir un familier : bonheur et expérience'; }
    if (f === 'materiaux') { const r = famRecipeFor(it); return r ? `Fabriquer : ${r.out[0]}${it.cat === 'n' ? '' : ''}` : 'Fabriquer à l’atelier'; }
    if (f === 'vetements') return `Porter (${(SLOT_LABEL[it.sub] || 'tenue').toLowerCase()}) : ouvre des chemins en aventure`;
    if (f === 'jardin') {
      const s = famSeedOf(it); if (s) return `Semer au jardin : ${s.out[0].toLowerCase()} en ${s.min} min`;
      if (famIsBait(it)) return `Appât : attire ${nsBaitSps(it).slice(0, 2).map(famSpN).join(', ')}`;
      return it.cat === 'd' ? 'Plante : décore le foyer' : 'Se replante au jardin';
    }
    if (f === 'equipement') { const d = FAM_TOOL_BY[nm]; if (d) return d[4]; return it.cat === 't' ? 'Déplier : une rumeur de trésor' : 'Équipement de voyage'; }
    if (f === 'nature') return `Collection nature ${famNatGot()}/${FAM_NATURE.length} · se revend bien`;
    if (f === 'tresors') {
      const g = famGemOf(it); if (g) return g.cut ? 'Pierre taillée : vaut 3 fois plus' : 'Tailler à l’atelier : vaudra 3 fois plus';
      const R = famRelOf(it); if (R && it.sub === 'fragment') { const n = new Set(S.inv.filter(i => i.rel === R.id && i.sub === 'fragment').map(i => i.frag)).size; return `Fragment ${n}/3 : ${R.nom}`; }
      if (it.relic) return 'Artefact légendaire : à exposer au foyer';
      const c = famIsChest(it); if (c) return `S’ouvre avec une ${famKeyName(c).toLowerCase()}`;
      const k = famIsKey(it); if (k) return `Ouvre un ${famChestName(k).toLowerCase()}`;
      if (it.tresor) return 'Trésor unique : la fierté du carnet';
      if (it.cat === 'd') return 'À exposer au foyer, ou à vendre cher';
      return 'Rareté : se vend cher au marché';
    }
  } catch (e) {}
  return FAM[f].usage;
}
// le bouton d'action de la fiche : { lbl, attr }
function famAction(it) {
  const f = famOf(it), id = esc(it.id), go = (g, a = '') => `data-obgo="${g}" data-obarg="${esc(a)}" data-obid="${id}"`;
  if (f === 'nourriture') return { lbl: 'Nourrir', attr: `data-feed="${id}"` };
  if (f === 'materiaux') { const r = famRecipeFor(it); return { lbl: 'Fabriquer', attr: r ? go('craft', r.id) : go('atelier') }; }
  if (f === 'vetements') return { lbl: 'Porter', attr: go('wear') };
  if (f === 'jardin') { if (famSeedOf(it)) return { lbl: 'Semer', attr: `data-famact="semer" data-id="${id}"` }; if (famIsBait(it)) return { lbl: 'Emporter', attr: go('bait') }; return { lbl: 'Exposer', attr: go('house') }; }
  if (f === 'equipement') return it.cat === 't' ? { lbl: 'Déplier', attr: `data-unroll="${id}"` } : { lbl: 'Emporter', attr: `data-famact="emporter" data-id="${id}"` };
  if (f === 'nature') return { lbl: 'Collection', attr: go('col') };
  if (famIsChest(it)) return { lbl: 'Ouvrir', attr: `data-famact="ouvrir" data-id="${id}"` };
  const g = famGemOf(it); if (g && !g.cut) return { lbl: 'Tailler', attr: `data-famact="atelier"` };
  if (it.sub === 'fragment') return { lbl: 'Assembler', attr: `data-famact="atelier"` };
  if (it.cat === 'd') return { lbl: 'Exposer', attr: go('house') };
  return { lbl: 'Vendre', attr: go('sell') };
}
// bandeau en haut de la fiche : « Famille · ce que ça fait · bouton »
function famTopHTML(it) {
  const F = FAM[famOf(it)], a = famAction(it);
  return `<div class="famtop" style="--fc:${F.couleur};--fb:${F.fond}"><span class="famtf"><i aria-hidden="true">${F.icone}</i>${F.nom}</span><span class="famtu">${esc(famUseLine(it))}</span><button class="famtb" ${a.attr}>${a.lbl}</button></div>`;
}

// ---------------- état ----------------
function famState() {
  if (!S.fam || typeof S.fam !== 'object') S.fam = {};
  const F = S.fam;
  if (!F.j || typeof F.j !== 'object') F.j = {};
  if (!Array.isArray(F.j.plots)) F.j.plots = [];
  if (typeof F.j.h !== 'number') F.j.h = 0;
  if (!F.relics || typeof F.relics !== 'object') F.relics = {};
  return F;
}
const famPush = it => { S.inv.push(it); if (S.dex) S.dex[it.name] = true; return it; };

// ---------------- objets ----------------
const famMk = (def, from, tags, r, extra) => { const it = makeItem(def, 0, from, tags || [], { fixed: r != null ? r : def[3] }); if (extra) Object.assign(it, extra); return it; };
function famWeighted(list, wf) { const w = list.map(wf), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; } return list[0]; }
function famNatureItem(tags, from, kind, boost) {
  const se = typeof season === 'function' ? season() : '', nuit = typeof isNight === 'function' && isNight();
  let c = FAM_NATURE.filter(d => (!kind || d[1] === kind) && d[2].some(t => (tags || []).includes(t)) && (!d[3] || d[3].split(',').includes(se)) && (!d[4] || (d[4] === 'nuit') === nuit));
  if (!c.length && kind) c = FAM_NATURE.filter(d => d[1] === kind && (!d[4] || (d[4] === 'nuit') === nuit));
  if (!c.length) return null;
  const k = famHasTool('loupe') || boost ? 0.7 : 1.6, d = famWeighted(c, x => 1 / (1 + x[5] * k));
  return famMk([d[0], 'm', d[1], d[5], null, d[6]], from, tags, d[5]);
}
function famSeedItem(tags, from) {
  const c = FAM_SEEDS.filter(d => d[1] && d[1].some(t => (tags || []).includes(t))); if (!c.length) return null;
  const d = c[Math.floor(Math.random() * c.length)], r = d[3][3] >= 2 ? 1 : 0;
  return famMk([d[0], 'm', 'graine', r, null, FAM_SEED_COL[d[0].length % FAM_SEED_COL.length]], from, tags, r);
}
function famGemItem(pl, from) {
  const z = pl && isFinite(+pl.lon) ? famZone(+pl.lon, +pl.lat) : 'eur', c = FAM_GEMS.filter(g => g[3].includes(z));
  const g = famWeighted(c.length ? c : FAM_GEMS, x => 1 / (1 + x[4] * 1.6));
  return famMk([g[1], 'm', 'gemme', g[4], null, g[5]], from, [], g[4]);
}
function famToolItem(k, from) { const d = FAM_TOOLS.find(x => x[0] === k) || FAM_TOOLS[Math.floor(Math.random() * FAM_TOOLS.length)]; return famMk([d[1], 'm', 'outil', d[2], null, d[3]], from, [], d[2]); }
function famChestItem(from, tags, lock) { lock = lock || famWeighted(Object.keys(FAM_LOCKS), l => FAM_LOCKS[l].w); const L = FAM_LOCKS[lock]; return famMk([famChestName(lock), 'm', 'coffre', L.r, null, L.col], from, tags, L.r); }
function famKeyItem(from, lock) { lock = lock || famWeighted(Object.keys(FAM_LOCKS), l => FAM_LOCKS[l].kw); const L = FAM_LOCKS[lock]; return famMk([famKeyName(lock), 'm', 'cle', L.r - 1, null, L.col], from, [], L.r - 1); }
function famFragItem(R, i, from) { return famMk([famFragName(R, i), 'm', 'fragment', 3, null, R.col], from, [], 3, { rel: R.id, frag: i }); }
const famHasFrag = (R, i) => S.inv.some(x => x.rel === R.id && x.sub === 'fragment' && x.frag === i);
function famKm(a, b) { const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r; const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); }

// ---------------- intégration au butin (appelé par le lootFor de 30_butin.js) ----------------
function famLoot(out, tags, luck, place, n, comp) {
  const arr = n >= 2, pName = typeof place === 'string' ? place : (place && place.name) || 'En voyage';
  let pl = null; try { pl = typeof btResolve === 'function' ? btResolve(place) : null; } catch (e) {}
  const add = it => { if (it) out.push(it); };
  const net = famHasTool('filet') ? 1.5 : 1;
  if (Math.random() < (arr ? 0.3 : 0.05) * net) add(famNatureItem(tags, pName));
  if (Math.random() < (arr ? 0.14 : 0.04)) add(famSeedItem(tags, pName));
  if (Math.random() < (arr ? 0.04 : 0.015)) add(famKeyItem(pName));
  if (!arr) return;
  const rocky = (tags || []).some(t => ['montagne', 'desert'].includes(t));
  if (Math.random() < (rocky ? 0.1 : 0.05) + Math.max(0, luck || 0) * 0.01) add(famGemItem(pl, pName));
  if (Math.random() < 0.06) add(famChestItem(pName, tags));
  if (Math.random() < 0.025) add(famToolItem(null, pName));
  if (pl && isFinite(+pl.lat)) {
    const F = famState();
    for (const R of FAM_RELICS) {
      if (F.relics[R.id]) continue;
      R.frags.forEach((f, i) => { if (!famHasFrag(R, i) && !out.some(x => x.rel === R.id && x.frag === i) && famKm({ lat: +pl.lat, lon: +pl.lon }, { lat: f[1], lon: f[2] }) < 80 && Math.random() < 0.5) add(famFragItem(R, i, pName)); });
    }
  }
}
// fx 'fam:…' des options d'aventure (29_aventure.js)
function famAdvLoot(kind, tags, place, t) {
  const from = (place && place.name) || 'En voyage';
  if (kind === 'poisson') {
    const pool = [].concat(...(tags || []).map(x => LOOT[x] || [])).filter(d => d[1] === 'n' && d[2] === 'mer');
    const d = pool.length ? pool[Math.floor(Math.random() * pool.length)] : ['Truite arc-en-ciel', 'n', 'mer', 2, null, '#e9a6b8'];
    return famMk(d, from, tags, Math.max(1, d[3]));
  }
  if (kind === 'insecte' || kind === 'coquillage') return famNatureItem(tags, from, kind, true);
  if (kind === 'coffre') return famChestItem(from, tags, Math.random() < 0.5 ? 'fer' : null);
  if (kind === 'gemme') return famGemItem(place, from);
  return null;
}

// ---------------- coffres ----------------
function famChestLoot(lock, chest) {
  const L = FAM_LOCKS[lock], min = { bois: 0, fer: 1, or: 2, ancienne: 3 }[lock], n = lock === 'bois' || lock === 'fer' ? 2 : 3;
  const tags = chest.tags && chest.tags.length && LOOT[chest.tags[0]] ? chest.tags : [Object.keys(LOOT)[Math.floor(Math.random() * Object.keys(LOOT).length)]];
  const pool = (LOOT[tags[0]] || LOOT.campagne).filter(d => d[1] !== 't'), from = famChestName(lock), items = [];
  const pool2 = pool.filter(d => d[3] <= min + 1); for (let i = 0; i < n; i++) { const d = famWeighted(pool2.length ? pool2 : pool, x => 1 / (1 + x[3] * 1.6)); items.push(famMk(d, from, tags, Math.min(4, Math.max(min, d[3])))); }
  if (lock === 'fer') items.push(Math.random() < 0.5 ? famSeedItem(Object.keys(LOOT), from) : famNatureItem(tags, from, null, true) || famSeedItem(Object.keys(LOOT), from));
  if (lock === 'or' || lock === 'ancienne') items.push(famGemItem(null, from));
  if (lock === 'ancienne') { const miss = []; FAM_RELICS.forEach(R => { if (!famState().relics[R.id]) R.frags.forEach((f, i) => { if (!famHasFrag(R, i)) miss.push([R, i]); }); }); if (miss.length && Math.random() < 0.6) { const [R, i] = miss[Math.floor(Math.random() * miss.length)]; items.push(famFragItem(R, i, from)); } else items.push(famToolItem(null, from)); }
  const coins = Math.round({ bois: 15, fer: 30, or: 60, ancienne: 150 }[lock] * (1 + Math.random()));
  return { items: items.filter(Boolean), coins, L };
}
function famOpenChest(id) {
  const chest = S.inv.find(i => i.id === id), lock = chest && famIsChest(chest);
  if (!lock) return null;
  const key = S.inv.filter(i => famIsKey(i) === lock).sort((a, b) => a.rarity - b.rarity)[0];
  if (!key) { toast(`Il faut une ${famKeyName(lock).toLowerCase()} pour ouvrir ce coffre.`); return null; }
  S.inv.splice(S.inv.indexOf(chest), 1); S.inv.splice(S.inv.indexOf(key), 1);
  const R = famChestLoot(lock, chest);
  R.items.forEach(famPush); gainCoins(R.coins); save();
  try { renderTop(); renderPanel(); } catch (e) {}
  famChestModal(R, lock, key.name);
  return R;
}
const famChestSVG = col => `<svg viewBox="0 0 120 100" aria-hidden="true"><rect x="16" y="46" width="88" height="46" rx="6" fill="${col}" stroke="#5b4636" stroke-width="3"/><rect x="16" y="60" width="88" height="7" fill="#5b4636" opacity=".25"/><g class="famlid"><path d="M16 48 V36 Q60 10 104 36 V48Z" fill="${col}" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/></g><rect x="52" y="52" width="16" height="18" rx="3" fill="#f6e08a" stroke="#5b4636" stroke-width="2.5"/><circle cx="60" cy="60" r="2.6" fill="#5b4636"/></svg>`;
function famChestModal(R, lock, keyName) {
  showModal(`<div class="famchest" style="--lc:${R.L.col}"><h2>${esc(famChestName(lock))} ouvert !</h2><p class="small">Avec : ${esc(keyName)}</p><div class="famcbox"><span class="famglow"></span>${famChestSVG(R.L.col)}</div><div class="famcitems">${R.items.map((it, i) => `<button class="famci" data-fiche="${esc(it.id)}" style="--d:${(0.95 + i * 0.16).toFixed(2)}s;--rc:${RARC[it.rarity]}"><span class="ico">${itemIcon(it)}</span><b>${esc(it.name)}</b><small>${FAM[famOf(it)].icone} ${RARITY[it.rarity]}</small></button>`).join('')}<div class="famci famcoin" style="--d:${(0.95 + R.items.length * 0.16).toFixed(2)}s">${typeof coins === 'function' ? coins(R.coins) : R.coins + ' pièces'}</div></div><button class="btn green sm" data-fclose="1">Super !</button></div>`);
  if (lock !== 'bois' && typeof confetti === 'function') setTimeout(() => { try { confetti(lock === 'ancienne'); } catch (e) {} }, 900);
}

// ---------------- tailler, assembler ----------------
const famCutCost = it => Math.round(value(Object.assign({}, it, { vx: 0 })) * 1.2);
function famCut(id, mode) {
  const it = S.inv.find(i => i.id === id), g = it && famGemOf(it);
  if (!g || g.cut) return null;
  if (mode === 'burin') { const b = S.inv.find(i => famToolOf(i) === 'burin'); if (!b) { toast('Il faut un burin de lapidaire (atelier › Équipement).'); return null; } S.inv.splice(S.inv.indexOf(b), 1); }
  else { const c = famCutCost(it); if (S.coins < c) { toast(`Il faut ${c} pièces pour faire tailler cette pierre.`); return null; } S.coins -= c; }
  S.inv.splice(S.inv.indexOf(it), 1);
  const nw = famPush(famMk([g.g[2], 'm', 'gemme', it.rarity, null, g.g[5]], 'Taillé à l’atelier', [], it.rarity, { vx: 3, cut: 1 }));
  S.stats.crafted = (S.stats.crafted || 0) + 1; save();
  try { renderTop(); renderPanel(); } catch (e) {}
  showModal(`<div class="famcut" style="--gc:${g.g[5]}"><h2>Pierre taillée !</h2><div class="famcutv"><span class="ico a">${itemIcon(Object.assign({}, nw, { name: g.g[1], vx: 0, cut: 0 }))}</span><b>→</b><span class="ico b">${itemIcon(nw)}<i class="famspk"></i></span></div><p><b>${esc(nw.name)}</b> vaut maintenant ${coins(value(nw))} (3 fois plus).</p><button class="btn green sm" data-fclose="1">Magnifique !</button></div>`);
  return nw;
}
function famAssemble(rid) {
  const R = FAM_RELICS.find(x => x.id === rid); if (!R) return null;
  const parts = [0, 1, 2].map(i => S.inv.find(x => x.rel === rid && x.sub === 'fragment' && x.frag === i));
  if (parts.some(p => !p)) { toast('Il manque encore des fragments.'); return null; }
  parts.forEach(p => S.inv.splice(S.inv.indexOf(p), 1));
  const it = famPush({ id: uidGen(), name: R.nom, cat: 'd', sub: 'statue', rarity: 4, color: R.col, from: 'Assemblé à l’atelier', tags: [], date: Date.now(), relic: R.id, desc: `Trois fragments réunis : ${R.frags.map(f => f[0]).join(', ')}. Un artefact légendaire.` });
  famState().relics[rid] = 1; S.stats.crafted = (S.stats.crafted || 0) + 1; save();
  try { renderTop(); renderPanel(); } catch (e) {}
  showModal(`<div class="famcut" style="--gc:${R.col}"><h2>Artefact légendaire !</h2><div class="famcutv"><span class="ico b">${itemIcon(it)}<i class="famspk"></i></span></div><p><b>${esc(R.nom)}</b> est enfin réunie. Exposez-la au foyer, ou vendez-la ${coins(value(it))}.</p><button class="btn green sm" data-fclose="1">Fabuleux !</button></div>`);
  if (typeof confetti === 'function') setTimeout(() => { try { confetti(true); } catch (e) {} }, 300);
  return it;
}
// onglet « Trésors » de l'atelier
function famTreasureHTML() {
  const groups = (f, key) => { const m = new Map(); S.inv.filter(f).forEach(i => { const k = key(i); const e = m.get(k); if (e) e.n.push(i); else m.set(k, { it: i, n: [i] }); }); return [...m.values()]; };
  const burins = S.inv.filter(i => famToolOf(i) === 'burin').length;
  const gems = groups(i => { const g = famGemOf(i); return g && !g.cut; }, i => i.name);
  const chests = groups(i => famIsChest(i), i => i.name);
  let h = `<p class="famintro">💎 Taillez vos pierres (elles valent <b>3 fois plus</b>), réunissez les fragments de reliques, et ouvrez vos coffres avec la bonne clé.</p>`;
  h += `<h3 class="famh3">Tailler une pierre</h3>`;
  h += gems.length ? `<div class="recipes">${gems.map(({ it, n }) => { const g = famGemOf(it).g, c = famCutCost(it), out = Object.assign({}, it, { name: g[2], vx: 3 }); return `<div class="rec famrec ok" style="--rc:${RARC[it.rarity]}"><div class="ico big">${itemIcon(it)}</div><div class="rx"><b>${esc(it.name)} ×${n.length} → ${esc(g[2])}</b><span class="famres" style="--fc:${FAM.tresors.couleur};--fb:${FAM.tresors.fond}">💎 Résultat : vaut ${coins(value(out))} au lieu de ${coins(value(it))}</span><div class="fambtns"><button data-famact="tailler" data-mode="burin" data-id="${esc(it.id)}" ${burins ? '' : 'disabled'}>Avec un burin (${burins})</button><button data-famact="tailler" data-mode="coins" data-id="${esc(it.id)}" ${S.coins >= c ? '' : 'disabled'}>Pour ${coins(c)}</button></div></div></div>`; }).join('')}</div>` : `<p class="small">Aucune pierre brute. On en trouve en voyage, surtout en montagne et dans le désert : chaque région du monde a les siennes.</p>`;
  h += `<h3 class="famh3">Assembler une relique</h3><div class="recipes">${FAM_RELICS.map(R => { const done = famState().relics[R.id], have = [0, 1, 2].map(i => famHasFrag(R, i)), ok = have.every(Boolean); return `<div class="rec famrec ${ok ? 'ok' : ''}" style="--rc:${RARC[4]}"><div class="ico big">${itemIcon({ name: R.nom, cat: 'd', sub: 'statue', rarity: 4, color: R.col })}</div><div class="rx"><b>${esc(R.nom)}</b><span class="famres" style="--fc:${FAM.tresors.couleur};--fb:${FAM.tresors.fond}">💎 Résultat : artefact légendaire, ${coins(value({ cat: 'd', rarity: 4 }))}</span><ul>${R.frags.map((f, i) => `<li class="${have[i] || done ? 'have' : ''}">Fragment près de ${esc(f[0])} <b>${have[i] || done ? '✓' : '…'}</b></li>`).join('')}</ul></div>${done ? '<span class="tagok">Réunie</span>' : `<button data-famact="assembler" data-rid="${R.id}" ${ok ? '' : 'disabled'}>Assembler</button>`}</div>`; }).join('')}</div>`;
  h += `<h3 class="famh3">Ouvrir un coffre</h3>`;
  h += chests.length ? `<div class="recipes">${chests.map(({ it, n }) => { const l = famIsChest(it), k = S.inv.filter(i => famIsKey(i) === l).length; return `<div class="rec famrec ${k ? 'ok' : ''}" style="--rc:${RARC[it.rarity]}"><div class="ico big">${itemIcon(it)}</div><div class="rx"><b>${esc(it.name)} ×${n.length}</b><ul><li class="${k ? 'have' : ''}">${esc(famKeyName(l))} <b>${Math.min(k, 1)}/1</b></li></ul></div><button data-famact="ouvrir" data-id="${esc(it.id)}" ${k ? '' : 'disabled'}>Ouvrir</button></div>`; }).join('')}</div>` : `<p class="small">Aucun coffre. On en déterre en voyage (une pelle aide beaucoup !). Clés en bois et en fer : onglet Équipement.</p>`;
  return h;
}
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const f = box.querySelector('.filters');
    if (f && !f.querySelector('[data-cf="Équipement"]')) f.insertAdjacentHTML('beforeend', `<button data-cf="Équipement" aria-pressed="${craftFilter === 'Équipement'}">🧭 Équipement</button><button data-cf="Trésors" aria-pressed="${craftFilter === 'Trésors'}">💎 Trésors</button>`);
    if (craftFilter === 'Trésors') { const list = box.querySelector('.recipes'); if (list) list.outerHTML = `<div class="famtre">${famTreasureHTML()}</div>`; }
    // chaque recette montre ce que fait le RÉSULTAT : sa famille et son usage
    box.querySelectorAll('.rec [data-craft]').forEach(b => {
      const rc = RECIPES.find(x => x.id === b.dataset.craft), rx = b.closest('.rec') && b.closest('.rec').querySelector('.rx');
      if (!rc || !rx || rx.querySelector('.famres')) return;
      const o = { name: rc.out[0], cat: rc.out[1], sub: rc.out[2], rarity: rc.out[3] }, F = FAM[famOf(o)];
      const bEl = rx.querySelector('b'); if (bEl) bEl.insertAdjacentHTML('afterend', `<span class="famres" style="--fc:${F.couleur};--fb:${F.fond}">${F.icone} ${F.nom} · ${esc(famUseLine(o))}</span>`);
    });
  } catch (e) { console.error('familles', e); }
  return r;
})(renderAtelier);

// ---------------- le jardin du foyer ----------------
const famPlotN = () => Math.min(6, 3 + Math.floor(famState().j.h / 8));
function famSeedsInBag() { const m = new Map(); S.inv.forEach(i => { const s = famSeedOf(i); if (!s) return; const e = m.get(i.name); if (e) e.n++; else m.set(i.name, { it: i, n: 1, s }); }); return [...m.values()].sort((a, b) => a.s.min - b.s.min); }
function famSow(i, id) {
  const J = famState().j, it = S.inv.find(x => x.id === id), s = it && famSeedOf(it);
  if (!s || i < 0 || i >= famPlotN() || J.plots[i]) return false;
  S.inv.splice(S.inv.indexOf(it), 1);
  J.plots[i] = { seed: it.name, t0: Date.now(), ms: s.min * 60e3, out: s.out, n: s.n, r: it.rarity || 0 };
  save(); return true;
}
function famHarvest(i) {
  const J = famState().j, p = J.plots[i];
  if (!p || Date.now() - p.t0 < p.ms) return null;
  const items = []; for (let k = 0; k < (p.n || 1); k++) items.push(famPush(famMk(p.out, 'Jardin du foyer', [], p.out[3])));
  if (Math.random() < 0.25) items.push(famPush(famMk([p.seed, 'm', 'graine', p.r || 0, null, FAM_SEED_COL[p.seed.length % FAM_SEED_COL.length]], 'Jardin du foyer', [], p.r || 0)));
  J.plots[i] = null; J.h++; save();
  try { renderTop(); } catch (e) {}
  return items;
}
const famLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`; };
function famPlantSVG(p, f) {
  const c = (p.out && p.out[5]) || { pomme: '#e5584f', agrume: '#f2b13e', sucre: '#9c6b4a', fruit: '#c9604f' }[p.out && p.out[2]] || '#f39ab0', h = 6 + f * 26, ready = f >= 1;
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="50" rx="22" ry="7" fill="#8a6448" stroke="#5b4636" stroke-width="2"/>${f > 0.02 ? `<path d="M30 48 V${48 - h}" stroke="#4f9f4f" stroke-width="3" stroke-linecap="round"/><path d="M30 ${48 - h * 0.45} q-9 -2 -11 -9 q8 0 11 7 M30 ${48 - h * 0.6} q9 -2 11 -9 q-8 0 -11 7" fill="#7fbf6a" stroke="#3f7f3f" stroke-width="1.2"/>` : '<circle cx="30" cy="46" r="2.5" fill="#5b4636"/>'}${ready ? `<g class="famripe"><circle cx="30" cy="${48 - h}" r="7.5" fill="${c}" stroke="#5b4636" stroke-width="2"/><circle cx="27.5" cy="${45.5 - h}" r="2" fill="#fff" opacity=".7"/></g>` : f > 0.5 ? `<circle cx="30" cy="${48 - h}" r="3.5" fill="#a8cf6a" stroke="#3f7f3f" stroke-width="1.2"/>` : ''}</svg>`;
}
let famJPick = -1, famJPre = null;
function jardinHTML(box, opt) {
  const J = famState().j, now = Date.now(), np = famPlotN(), seeds = famSeedsInBag();
  if (opt && opt.pre) famJPre = opt.pre;
  const pre = famJPre && S.inv.find(i => i.id === famJPre);
  let h = `<div class="famj" data-famj="1"><div class="famjh"><b>🌱 Le jardin</b><span>${pre ? `Touchez une parcelle libre pour semer « ${esc(pre.name)} ».` : 'Semez une graine : elle pousse toute seule, même jeu fermé.'}</span></div><div class="famjp">`;
  for (let i = 0; i < np; i++) {
    const p = J.plots[i];
    if (!p) { h += `<button class="famplot empty${famJPick === i ? ' pick' : ''}${pre ? ' glow' : ''}" data-jplot="${i}" aria-label="Parcelle ${i + 1} libre : semer">${famPlantSVG({}, 0)}<b>Semer</b><small>Parcelle libre</small></button>`; continue; }
    const f = Math.min(1, (now - p.t0) / p.ms), ready = f >= 1;
    h += `<button class="famplot${ready ? ' ready' : ''}" ${ready ? `data-jharv="${i}"` : 'disabled'} aria-label="${esc(p.out[0])} : ${ready ? 'prêt, récolter' : 'en train de pousser'}">${famPlantSVG(p, f)}<b>${ready ? 'Récolter' : esc(p.out[0])}</b><small data-jleft="${i}">${ready ? `${p.n > 1 ? p.n + ' × ' : ''}${esc(p.out[0])}` : `Encore ${famLeft(p.ms - (now - p.t0))}`}</small><span class="fambar"><i data-jbar="${i}" style="width:${Math.round(f * 100)}%"></i></span></button>`;
  }
  h += `</div>`;
  if (famJPick >= 0 && !J.plots[famJPick]) {
    h += seeds.length ? `<div class="famjs"><b>Que semer dans la parcelle ${famJPick + 1} ?</b><div class="famjsl">${seeds.map(({ it, n, s }) => `<button data-jsow="${famJPick}" data-id="${esc(it.id)}"><span class="ico">${itemIcon(it)}</span><span><b>${esc(it.name)}${n > 1 ? ` ×${n}` : ''}</b><small>${s.n > 1 ? s.n + ' × ' : ''}${esc(s.out[0])} · ${s.min} min</small></span></button>`).join('')}</div></div>` : `<p class="famjs small">Aucune graine dans le sac. On en trouve en voyage : à la campagne, en forêt, sur les îles…</p>`;
  }
  h += np < 6 ? `<p class="small famjn">Nouvelle parcelle après ${8 - (J.h % 8)} récolte${8 - (J.h % 8) > 1 ? 's' : ''} (${np}/6).</p>` : '';
  h += `</div>`;
  if (box) box.innerHTML = h;
  return h;
}
// petite horloge : met à jour les barres des jardins affichés (aucune fenêtre)
setInterval(() => {
  try {
    const els = document.querySelectorAll('.famj'); if (!els.length) return;
    const J = famState().j, now = Date.now();
    let redraw = false;
    J.plots.forEach((p, i) => { if (!p) return; const f = Math.min(1, (now - p.t0) / p.ms); document.querySelectorAll(`[data-jbar="${i}"]`).forEach(b => { b.style.width = Math.round(f * 100) + '%'; }); document.querySelectorAll(`[data-jleft="${i}"]`).forEach(b => { if (f < 1) b.textContent = 'Encore ' + famLeft(p.ms - (now - p.t0)); else if (!b.closest('.ready')) redraw = true; }); });
    if (redraw) els.forEach(e => jardinHTML(e.parentElement));
  } catch (e) {}
}, 1000);

// ---------------- voyage : boussole et carte de région ----------------
const FAM_HIDE = { foret: 'Clairière secrète', jungle: 'Cascade cachée', mer: 'Crique cachée', lac: 'Anse secrète', montagne: 'Belvédère secret', neige: 'Grotte de glace', desert: 'Oasis cachée', campagne: 'Verger oublié', ville: 'Passage secret', quartier: 'Cour secrète' };
if (typeof GAME !== 'undefined') GAME.on('trip:start', ({ trip, dest }) => {
  if (!trip || !dest) return;
  if (famHasTool('boussole') && trip.out > 0) {
    const o = trip.out, no = Math.round(o * 0.85); trip.out = no; trip.total -= 2 * (o - no);
    const a = trip.events.find(e => e.type === 'arrivee'); if (a) a.at = no / trip.total;
    trip.journal.push({ t: Date.now(), kind: 'depart', text: 'La boussole montre le chemin le plus court : 15 % de trajet en moins.' });
  }
  const map = S.inv.find(i => famToolOf(i) === 'carte');
  if (map && typeof avAddPlace === 'function' && isFinite(+dest.lon)) {
    const biome = typeof avBiome === 'function' ? avBiome(dest.tags || [], dest.lat, dest.poi) : 'campagne';
    const p = avAddPlace(trip, { lon: +dest.lon, lat: +dest.lat, biome }, `${FAM_HIDE[biome] || 'Coin secret'} (${dest.name})`);
    if (p) { S.inv.splice(S.inv.indexOf(map), 1); trip.journal.push({ t: Date.now(), kind: 'depart', text: `La carte de région révèle un lieu caché près de ${dest.name} : « ${p.name} ». Il apparaît sur votre carte !` }); }
  }
  save();
});

// ---------------- valeur, création, collection, icônes ----------------
if (typeof value === 'function') value = (orig => function (it) {
  let v = orig.apply(this, arguments);
  try { if (it && it.vx) v = Math.round(v * it.vx); else if (it && !it.near && it.name && famOf(it) === 'nature') v = Math.round(v * 1.5); } catch (e) {}
  return v;
})(value);
if (typeof makeItem === 'function') makeItem = (orig => function () { const it = orig.apply(this, arguments); try { if (it) it.fam = famOf(it); } catch (e) {} return it; })(makeItem);
if (typeof collections === 'function') collections = (orig => function () { const c = orig.apply(this, arguments); c.push({ key: 'nature', label: 'Insectes et coquillages', names: FAM_NATURE.map(d => d[0]) }); return c; })(collections);
try { TAGC.nature = FAM.nature.couleur; } catch (e) {}
const FAM_L = 'stroke="#5b4636" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
const FAM_TOOL_SVG = {
  pelle: c => `<path d="M10 33 L26 12" ${FAM_L} stroke-width="3.5" stroke="#a87a50"/><path d="M24 8 L33 4 L36 7 L32 16 Q28 18 24 14Z" fill="#b9c4cc" ${FAM_L}/>`,
  canne: c => `<path d="M6 34 L30 6" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M30 6 Q36 14 34 26" fill="none" stroke="#5b4636" stroke-width="1.2"/><path d="M34 26 q0 4 -3 3" fill="none" stroke="#5b4636" stroke-width="1.6"/><circle cx="12" cy="27" r="3" fill="#e5584f" ${FAM_L}/>`,
  lampe: c => `<path d="M6 22 Q20 10 34 22" fill="none" stroke="#5f87a8" stroke-width="4"/><rect x="14" y="16" width="12" height="10" rx="3" fill="${c}" ${FAM_L}/><path d="M20 26 L12 37 H28Z" fill="#fff4b0" opacity=".8"/>`,
  filet: c => `<path d="M8 34 L20 20" stroke="#a87a50" stroke-width="3" stroke-linecap="round"/><circle cx="26" cy="13" r="9" fill="#fff" fill-opacity=".5" stroke="${c}" stroke-width="2.5"/><path d="M20 8 L32 18 M19 14 L30 6 M22 20 L34 12" stroke="${c}" stroke-width=".9"/>`,
  boussole: c => `<circle cx="20" cy="20" r="14" fill="${c}" ${FAM_L}/><circle cx="20" cy="20" r="10" fill="#fff8ea" ${FAM_L}/><path d="M20 11 L23 20 L20 29 L17 20Z" fill="#e5584f" ${FAM_L} stroke-width="1"/><path d="M20 20 L23 20 L20 29 L17 20Z" fill="#5f87a8"/>`,
  carte: c => `<path d="M5 9 L14 6 L26 10 L35 7 V31 L26 34 L14 30 L5 33Z" fill="${c}" ${FAM_L}/><path d="M14 6 V30 M26 10 V34" stroke="#5b4636" stroke-width="1"/><circle cx="21" cy="18" r="3" fill="#e5584f"/>`,
  loupe: c => `<circle cx="16" cy="16" r="10" fill="${c}" fill-opacity=".55" stroke="#5b4636" stroke-width="3"/><path d="M23 23 L34 34" stroke="#a87a50" stroke-width="5" stroke-linecap="round"/>`,
  burin: c => `<path d="M8 32 L22 18" stroke="#a87a50" stroke-width="5" stroke-linecap="round"/><path d="M20 20 L30 6 L35 9 L24 23Z" fill="${c}" ${FAM_L}/>`,
  masque: c => `<rect x="5" y="12" width="30" height="16" rx="8" fill="${c}" ${FAM_L}/><circle cx="14" cy="20" r="5" fill="#dff4fb" ${FAM_L}/><circle cx="26" cy="20" r="5" fill="#dff4fb" ${FAM_L}/><path d="M35 18 h3 v-12" fill="none" stroke="#e5584f" stroke-width="3"/>`,
  corde: c => `<circle cx="20" cy="20" r="13" fill="none" stroke="${c}" stroke-width="5"/><circle cx="20" cy="20" r="7" fill="none" stroke="${c}" stroke-width="4"/><circle cx="20" cy="20" r="13" fill="none" stroke="#5b4636" stroke-width="1" stroke-dasharray="3 3"/>`,
};
if (typeof itemIcon === 'function') itemIcon = (orig => function (it) {
  try {
    const c = it.color || '#e9c46a', W = s => `<svg viewBox="0 0 40 40">${s}</svg>`, t = famToolOf(it);
    if (t && FAM_TOOL_SVG[t]) return W(FAM_TOOL_SVG[t](c));
    const ch = famIsChest(it); if (ch) return W(`<rect x="5" y="17" width="30" height="17" rx="3" fill="${c}" ${FAM_L}/><path d="M5 18 V13 Q20 3 35 13 V18Z" fill="${c}" ${FAM_L}/><rect x="17" y="19" width="6" height="7" rx="1.5" fill="#f6e08a" ${FAM_L} stroke-width="1.2"/>`);
    if (famIsKey(it)) return W(`<circle cx="12" cy="14" r="7" fill="none" stroke="#5b4636" stroke-width="6.5"/><circle cx="12" cy="14" r="7" fill="none" stroke="${c}" stroke-width="3.6"/><path d="M18 18 L33 31 M27 26 l-3 4 M31 29.5 l-3 3.5" stroke="#5b4636" stroke-width="5.4" stroke-linecap="round"/><path d="M18 18 L33 31 M27 26 l-3 4 M31 29.5 l-3 3.5" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`);
    const g = famGemOf(it); if (g) return g.cut ? W(`<path d="M20 4 L34 15 L20 36 L6 15Z" fill="${c}" ${FAM_L}/><path d="M6 15 H34 M20 4 L14 15 L20 36 L26 15Z" fill="none" stroke="#5b4636" stroke-width="1"/><path d="M12 11 l3 -3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`) : W(`<path d="M6 27 C4 18 12 9 21 10 C31 11 36 20 32 28 C28 34 11 34 6 27Z" fill="#a9a29a" ${FAM_L}/><path d="M14 16 L22 13 L27 21 L19 27 L12 22Z" fill="${c}" ${FAM_L} stroke-width="1.2"/><path d="M16 18 l3 -2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
    if (it.sub === 'fragment') return W(`<path d="M8 30 L12 10 L22 6 L32 14 L28 32 L18 28Z" fill="${c}" ${FAM_L}/><path d="M12 10 L18 28 M22 6 L20 18 L32 14" fill="none" stroke="#5b4636" stroke-width="1" opacity=".6"/><path d="M14 13 l4 -2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
    if (it.sub === 'insecte') return W(`<ellipse cx="13" cy="15" rx="8" ry="7" fill="${c}" ${FAM_L}/><ellipse cx="27" cy="15" rx="8" ry="7" fill="${c}" ${FAM_L}/><ellipse cx="14" cy="27" rx="6" ry="5" fill="${c}" ${FAM_L}/><ellipse cx="26" cy="27" rx="6" ry="5" fill="${c}" ${FAM_L}/><path d="M20 10 V34" stroke="#5b4636" stroke-width="3.4" stroke-linecap="round"/><path d="M20 10 q-3 -5 -6 -6 M20 10 q3 -5 6 -6" fill="none" stroke="#5b4636" stroke-width="1.4"/>`);
    if (it.sub === 'graine' && FAM_SEED_BY[famName(it)]) return W(`<path d="M10 12 H30 L28 34 H12Z" fill="#efe2c4" ${FAM_L}/><path d="M10 12 L13 7 H27 L30 12" fill="#e3d0a6" ${FAM_L}/><circle cx="20" cy="23" r="6" fill="${(FAM_SEED_BY[famName(it)][3][5]) || '#e5584f'}" ${FAM_L} stroke-width="1.2"/><path d="M20 17 q3 -4 6 -3" stroke="#4f9f4f" stroke-width="2" fill="none"/>`);
  } catch (e) {}
  return orig.apply(this, arguments);
})(itemIcon);

// ---------------- clics (boutons data-famact, jardin) ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset, modal = $('modal'), inModal = modal && el.closest('#modal');
  const redrawJ = () => { const j = el.closest('.famj'); if (j && j.parentElement) jardinHTML(j.parentElement); };
  if (d.jplot != null) { const i = +d.jplot; if (famJPre && famSow(i, famJPre)) { famJPre = null; famJPick = -1; } else { famJPre = null; famJPick = famJPick === i ? -1 : i; } redrawJ(); return; }
  if (d.jsow != null) { famSow(+d.jsow, d.id); famJPick = -1; redrawJ(); return; }
  if (d.jharv != null) { const got = famHarvest(+d.jharv); redrawJ(); if (got && got.length) toast(`Récolte : ${got.map(x => x.name).join(', ')} !`); return; }
  if (!d.famact) return;
  const a = d.famact;
  if (a === 'semer') { famJPre = d.id; famJPick = -1; showModal(`<div class="famjmod"><div id="famJM"></div><button class="btn green sm" data-fclose="1">Fermer</button></div>`); jardinHTML($('famJM'), { pre: d.id }); return; }
  if (a === 'emporter') { const it = S.inv.find(i => i.id === d.id); if (inModal) modal.hidden = true; toast(it ? `« ${it.name} » reste dans le sac : il sert tout seul en voyage.` : 'Rangé dans le sac.'); return; }
  if (a === 'ouvrir') { famOpenChest(d.id); return; }
  if (a === 'tailler') { famCut(d.id, d.mode); return; }
  if (a === 'assembler') { famAssemble(d.rid); return; }
  if (a === 'atelier') { if (inModal) modal.hidden = true; try { craftFilter = 'Trésors'; } catch (e) {} openSheet('atelier'); return; }
});

// ---------------- styles ----------------
(function famCSS() {
  const st = document.createElement('style'); st.id = 'famillesCSS';
  st.textContent = `
.famfil{grid-template-columns:repeat(4,minmax(0,1fr))}
.famfil button{--fc:var(--teal);--fb:var(--tealsoft)}
.famfil .famico{grid-row:1;grid-column:1;font-size:19px;line-height:1}
.famfil button span{font-size:11.5px;letter-spacing:-.2px;overflow-wrap:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.famfil button[aria-selected="true"]:not(.obf-tout){background:var(--fb);border-color:var(--fc);box-shadow:0 3px 0 var(--fc)}
.famfil button[aria-selected="true"]:not(.obf-tout) i{background:var(--fc)}
.famfil button:not(.zero):not(.obf-tout) i{color:var(--fc)}
.famfil button[aria-selected="true"]:not(.obf-tout) i{color:#fff}
.famhint{margin:0;padding:7px 11px;border-radius:12px;background:var(--fb);border:1.5px solid var(--fc);font:600 13px/1.35 var(--body);color:var(--ink)}
.famhint b{color:var(--fc)}
.obempty .famico.big{font-size:40px;line-height:1}
.fampill{display:inline-flex;align-items:center;gap:3px;padding:1px 7px 1px 4px;border-radius:999px;background:var(--fb);color:var(--fc);border:1.5px solid var(--fc);font:800 10.5px/16px var(--display);white-space:nowrap}
.fampill i{font-style:normal;font-size:11px}
.obu.famu{border-color:var(--uc)}
.famtop{display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;gap:3px 10px;align-items:center;margin:8px 0 4px;padding:9px 10px 9px 12px;border-radius:16px;background:var(--fb);border:2px solid var(--fc);text-align:left}
.famtf{font:800 14px/1.1 var(--display);color:var(--fc);display:flex;gap:5px;align-items:center}
.famtf i{font-style:normal;font-size:17px}
.famtu{grid-row:2;grid-column:1;font:700 13.5px/1.3 var(--body);color:var(--ink)}
.famtb{grid-row:1 / 3;grid-column:2;min-height:44px;padding:0 16px;border-radius:999px;border:2.5px solid var(--ink);background:var(--fc);color:#fff;font:800 15px/1 var(--display);box-shadow:0 3px 0 var(--ink);cursor:pointer}
.famtb:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
.famres{display:block;margin:3px 0;padding:3px 8px;border-radius:9px;background:var(--fb);color:var(--fc);border:1.5px solid var(--fc);font:700 12px/1.3 var(--body)}
.famintro{margin:6px 0;font:600 13.5px/1.4 var(--body)}
.famh3{margin:12px 0 6px;font:800 16px var(--display)}
.fambtns{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}
.fambtns button,.famrec>button{min-height:40px;padding:0 12px;border-radius:12px;border:2px solid var(--ink);background:var(--gold,#f2c14e);font:800 13px var(--display);cursor:pointer}
.fambtns button:disabled,.famrec>button:disabled{opacity:.45;cursor:default}
.famj{display:flex;flex-direction:column;gap:8px}
.famjh{display:flex;flex-direction:column}
.famjh b{font:800 18px var(--display)}
.famjh span{font:600 13px/1.35 var(--body);color:var(--ink2)}
.famjp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.famplot{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 4px 9px;min-height:118px;border-radius:16px;border:2.5px solid #8a6448;background:linear-gradient(#eaf6df,#d9ecc8);font:inherit;color:var(--ink);cursor:pointer}
.famplot svg{width:62px;height:62px}
.famplot b{font:800 13px/1.15 var(--display);text-align:center}
.famplot small{font:600 11px/1.2 var(--body);color:var(--ink2);text-align:center}
.famplot.empty{border-style:dashed;background:#f6efe3}
.famplot.pick,.famplot.glow{border-color:#3f8a3f;box-shadow:0 0 0 3px #bfe3b0}
.famplot.ready{border-color:#d99a25;background:linear-gradient(#fff6d6,#f8e3a8);box-shadow:0 3px 0 #b07a1e}
.famplot:disabled{cursor:default;opacity:1}
.famplot .fambar{position:absolute;left:10px;right:10px;bottom:4px;height:4px;border-radius:3px;background:#0001;overflow:hidden}
.famplot .fambar i{display:block;height:100%;background:#4f9f4f}
.famplot.ready .famripe{animation:famBob 1.2s ease-in-out infinite;transform-origin:30px 30px}
@keyframes famBob{50%{transform:translateY(-2px) scale(1.06)}}
.famjs{display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:14px;background:#fff;border:2px solid #cfe3c4}
.famjsl{display:flex;flex-direction:column;gap:6px}
.famjsl button{display:flex;align-items:center;gap:8px;min-height:48px;padding:4px 10px;border-radius:12px;border:2px solid #3f8a3f;background:#f2faee;text-align:left;font:inherit;color:var(--ink);cursor:pointer}
.famjsl .ico{width:36px;height:36px;flex:none}
.famjsl .ico svg{width:100%;height:100%}
.famjsl span{display:flex;flex-direction:column}
.famjsl small{font:600 12px var(--body);color:var(--ink2)}
.famjn{margin:0}
.famjmod{display:flex;flex-direction:column;gap:10px;align-items:stretch}
.famchest,.famcut{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.famcbox{position:relative;width:150px;height:125px;animation:famShake .6s ease-in-out}
.famcbox svg{width:100%;height:100%;position:relative}
.famcbox .famlid{transform-origin:16px 46px;animation:famLid .45s .65s cubic-bezier(.3,1.6,.6,1) forwards}
.famglow{position:absolute;left:50%;top:48%;width:10px;height:10px;border-radius:50%;background:radial-gradient(#fff6c0,#f2c14e00 70%);transform:translate(-50%,-50%) scale(0);animation:famGlow .8s .7s ease-out forwards}
@keyframes famShake{20%,60%{transform:rotate(-4deg)}40%,80%{transform:rotate(4deg)}}
@keyframes famLid{to{transform:rotate(-38deg) translate(-6px,-6px)}}
@keyframes famGlow{to{transform:translate(-50%,-50%) scale(22);opacity:.9}}
.famcitems{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;width:100%}
.famci{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 5px;border-radius:14px;border:2.5px solid var(--rc,#c9a35a);background:#fff;font:inherit;color:var(--ink);opacity:0;transform:translateY(24px) scale(.6);animation:famPop .45s var(--d) cubic-bezier(.3,1.5,.6,1) forwards;cursor:pointer}
.famci .ico{width:44px;height:44px}.famci .ico svg{width:100%;height:100%}
.famci b{font:800 12.5px/1.15 var(--display)}.famci small{font:700 11px var(--body);color:var(--ink2)}
.famci.famcoin{justify-content:center;font:800 16px var(--display);border-color:#d99a25;background:#fff6d6}
@keyframes famPop{to{opacity:1;transform:none}}
.famcutv{display:flex;align-items:center;gap:14px;font:800 24px var(--display)}
.famcutv .ico{position:relative;width:70px;height:70px}.famcutv .ico svg{width:100%;height:100%}
.famcutv .ico.b{animation:famPop .5s .25s both;opacity:0;transform:scale(.5)}
.famspk{position:absolute;inset:-8px;border-radius:50%;background:radial-gradient(circle,#fff 0 6%,transparent 7%) 20% 25%/22px 22px no-repeat,radial-gradient(circle,#fff 0 6%,transparent 7%) 75% 70%/18px 18px no-repeat;animation:famTw 1.1s .6s infinite;pointer-events:none}
@keyframes famTw{50%{opacity:.2}}
@media (prefers-reduced-motion: reduce){.famcbox,.famcbox .famlid,.famci,.famglow,.famcutv .ico.b,.famplot.ready .famripe,.famspk{animation-duration:.01s!important;animation-delay:0s!important}}
@media (min-width:700px){.famfil{grid-template-columns:repeat(8,minmax(0,1fr))}.famjp{grid-template-columns:repeat(6,minmax(0,1fr))}.famcitems{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;
  document.head.appendChild(st);
})();

window.__fam = { FAM, famOf, famUseLine, famAction, famTopHTML, jardinHTML, famSow, famHarvest, famOpenChest, famCut, famAssemble, famLoot, famAdvLoot, famHasTool, famState,
  mk: { tool: famToolItem, chest: famChestItem, key: famKeyItem, gem: famGemItem, seed: famSeedItem, nature: famNatureItem, frag: (rid, i) => famFragItem(FAM_RELICS.find(R => R.id === rid), i, 'Test') },
  data: { FAM_TOOLS, FAM_SEEDS, FAM_NATURE, FAM_GEMS, FAM_RELICS } };

// ================= v35 : À QUOI SERT CHAQUE OBJET (usages, actions directes, vêtements utiles) =================
// Le joueur : « on ne sait pas à quoi servent les items, ni dans quel but ».
// 1. Déclare (GAME.addUses / GAME.addAction, contrat de 13_bus.js) les usages qui manquaient : recettes du commerce,
//    matériel d'expédition, graines, clés et coffres, vêtements, offrandes et quêtes (actions), vente et recyclage.
// 2. usKinds(it) : les « kind » standard d'un objet (cuisiner, construire, expedition, familier, porter, planter, offrande),
//    d'après GAME.usesOf (y compris ceux des autres modules, ex. 48_progression.js) ; pastilles SVG (usBadgesHTML).
// 3. Sac rangé par usage : onglets d'usage (usTabsOf) utilisés par obRenderBag (23_objets.js).
// 4. Fiche : rangée « objet → résultats » en images, « Utiliser », « Vendre (≈ X) », « Recycler ».
// 5. Vêtements utiles : un bonus par vêtement (d'après son nom et sa forme, vFormOf) et 8 ensembles (3 pièces sur 4).
//    Vraiment appliqués : xpRiskK (risques), collect (butin), cfDurMul (préparation, donc cmDur), cmSell (paiement).
// Aucune nouvelle clé dans S (tout est calculé) : anciennes sauvegardes compatibles. Aucune fenêtre spontanée.

const usCall = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const US_INK = '#5b4636';

// ---------------- pastilles (cercle coloré, trait d'encre, dessin blanc : même style que les glyphes de régions) ----------------
const US_K = {
  cuisiner: { nom: 'Cuisiner', c: '#e0784a', g: '<ellipse cx="10" cy="11.5" rx="5.6" ry="4.2" fill="#fff"/><path d="M15 10 L19 8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M7.5 5 q-1 -1.6 0 -3 M10.5 5 q-1 -1.6 0 -3" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>' },
  construire: { nom: 'Construire', c: '#b07a4f', g: '<path d="M6 17 L12.5 10.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M9.5 6.5 L14 3.5 L17.5 7 L14.5 11.5Z" fill="#fff"/>' },
  expedition: { nom: 'Expédition', c: '#5f8fb8', g: '<rect x="5" y="6.5" width="10" height="10.5" rx="3" fill="#fff"/><path d="M7.5 6.5 V5 a2.5 2.5 0 0 1 5 0 V6.5" stroke="#fff" stroke-width="1.6" fill="none"/><rect x="7.5" y="11" width="5" height="3" rx="1" fill="#5f8fb8"/>' },
  familier: { nom: 'Familiers', c: '#d9739a', g: '<ellipse cx="10" cy="13" rx="3.6" ry="3" fill="#fff"/><circle cx="5.6" cy="9" r="1.7" fill="#fff"/><circle cx="8.3" cy="6.2" r="1.7" fill="#fff"/><circle cx="11.7" cy="6.2" r="1.7" fill="#fff"/><circle cx="14.4" cy="9" r="1.7" fill="#fff"/>' },
  porter: { nom: 'Porter', c: '#8a6fc4', g: '<path d="M7 4.5 L3.5 7.5 L5.5 10 L7 9 V16 H13 V9 L14.5 10 L16.5 7.5 L13 4.5 Q10 6.5 7 4.5Z" fill="#fff"/>' },
  planter: { nom: 'Planter', c: '#5fa274', g: '<path d="M10 17 V9" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M10 10 Q4 10 4 5 Q9.5 5 10 10Z M10 9 Q16 9 16 4 Q10.5 4 10 9Z" fill="#fff"/>' },
  offrande: { nom: 'Offrande', c: '#c9a03a', g: '<rect x="4.5" y="8.5" width="11" height="8" rx="1.5" fill="#fff"/><rect x="3.5" y="6.5" width="13" height="3" rx="1" fill="#fff"/><path d="M10 6.5 V16.5" stroke="#c9a03a" stroke-width="1.8"/><path d="M10 6.5 Q7 2.5 6 5 Q6.5 6.5 10 6.5 Q13 2.5 14 5 Q13.5 6.5 10 6.5Z" fill="#fff"/>' },
  vendre: { nom: 'Vendre', c: '#c9a03a', g: '<circle cx="10" cy="10" r="5.6" fill="#fff"/><path d="M10 7 V13" stroke="#c9a03a" stroke-width="1.8" stroke-linecap="round"/>' },
  recycler: { nom: 'Recycler', c: '#6fa58a', g: '<path d="M6 8.5 a4.5 4.5 0 0 1 7.6 -2 M14 11.5 a4.5 4.5 0 0 1 -7.6 2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M14.6 3.6 V7.2 H11Z M5.4 16.4 V12.8 H9Z" fill="#fff"/>' },
  // bonus de commerce des vêtements
  prep: { nom: 'Préparation', c: '#e0784a', g: '<circle cx="10" cy="11" r="5.8" fill="#fff"/><path d="M10 7.8 V11 L12.4 12.4" stroke="#e0784a" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="8.4" y="2.6" width="3.2" height="2" rx=".8" fill="#fff"/>' },
  pay: { nom: 'Clients', c: '#d9a520', g: '<circle cx="10" cy="10" r="5.8" fill="#fff"/><path d="M8 8.2 h3.4 a1.6 1.6 0 0 1 0 3.2 h-2.8 a1.6 1.6 0 0 0 0 3.2 H12" stroke="#d9a520" stroke-width="1.4" fill="none" stroke-linecap="round" transform="translate(0 -1.6)"/>' },
  // v36 : décoration à poser au foyer (confort, 49_foyer3d.js)
  confort: { nom: 'Confort', c: '#c9739a', g: '<path d="M4 15.5 V10.5 a2 2 0 0 1 4 0 V12 H12 V10.5 a2 2 0 0 1 4 0 V15.5Z" fill="#fff"/><path d="M6 8.5 V7 a2.5 2.5 0 0 1 2.5 -2.5 H11.5 A2.5 2.5 0 0 1 14 7 V8.5" stroke="#fff" stroke-width="1.6" fill="none"/>' },
  tous: { nom: 'Tous terrains', c: '#7f9a6a', g: '<circle cx="10" cy="10" r="5.6" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M10 4 L11.6 10 L10 16 L8.4 10Z" fill="#fff"/>' },
};
const usPill = (k, cls = '', title = '') => { const K = US_K[k]; if (!K) return ''; return `<i class="uspill ${cls}" style="--pc:${K.c}"${title ? ` title="${esc(title)}"` : ''} aria-hidden="true"><svg viewBox="0 0 20 20">${K.g}</svg></i>`; };
// pastille d'un terrain (glyphes de 17_regions.js, couleurs de 41_expedition.js)
const usTerrPill = (t, cls = '', title = '') => {
  if (t === '*') return usPill('tous', cls, title);
  const T = usCall(() => XP_T[t], null); if (!T) return '';
  const g = usCall(() => RG_GLYPH[T[2]], '') || '';
  return `<i class="uspill ${cls}" style="--pc:${T[3]}"${title ? ` title="${esc(title)}"` : ''} aria-hidden="true"><svg viewBox="0 0 24 24">${g}</svg></i>`;
};
const US_TNAME = { montagne: 'en montagne', mer: 'en mer', foret: 'en forêt', ville: 'en ville', desert: 'au désert', froid: 'dans le grand froid', '*': 'partout' };

// ---------------- correspondance d'ingrédients ----------------
function usIngMatch(key, it) {
  if (!it || it.tresor || it.mk) return false;
  if (key === 'far') return usCall(() => cmIsFar(it), false) && it.cat !== 'v';
  if (String(key).startsWith('r:')) return it.rid === key.slice(2);
  return !!(ING[key] && ING[key][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n') && ingExtra(key, it));
}
const usDefItem = def => ({ name: def[0], cat: def[1], sub: def[2], rarity: def[3] || 0, look: def[4] || null, color: def[5] || null });
const usIco = def => usCall(() => itemIcon(usDefItem(def)), '');

// ---------------- recettes ----------------
// commerce : lignes des commerces ouverts (sinon toutes : on voit ce qu'on pourrait cuisiner)
function usShopLines() {
  const own = usCall(() => bqOwned(), []), T = usCall(() => cmT(), null);
  const ids = own.length ? own : Object.keys(CM_LINES);
  if (T && !ids.includes(T.id)) ids.unshift(T.id);
  return ids;
}
function usCmRecipes(it) {
  if (!it || typeof CM_LINES === 'undefined') return [];
  const out = [], T = usCall(() => cmT(), null);
  for (const sh of usShopLines()) for (const R of CM_LINES[sh] || []) {
    if (R.egg || !usCall(() => cmUnlocked(R), false)) continue;
    if (R.ing.some(([k]) => usIngMatch(k, it))) out.push({ R, here: !!(T && T.id === R.shop), ok: !!(T && T.id === R.shop) && usCall(() => cmCanIng(R), false) });
  }
  return out.sort((a, b) => (b.ok - a.ok) || (b.here - a.here));
}
const usRecLocked = r => usCall(() => BQ_RIDS.has(r.id) && !bqRecOwned(r.id), false);
function usAtRecipes(it) {
  if (!it || typeof RECIPES === 'undefined') return [];
  const seen = new Set(), out = [];
  for (const r of RECIPES) {
    if (seen.has(r.out[0]) || usRecLocked(r) || !r.ing.some(([k]) => usIngMatch(k, it))) continue;
    seen.add(r.out[0]); out.push({ r, ok: usCall(() => canCraft(r), false) });
  }
  return out.sort((a, b) => b.ok - a.ok);
}
const usGearOf = def => usCall(() => XP_GBY[String(def[0]).replace(/ \(chef-d’œuvre\)$/, '')], null);
// kind d'une recette d'après ce qu'elle produit
const usOutKind = def => (def[1] === 'n' ? 'cuisiner' : usGearOf(def) || def[2] === 'outil' ? 'expedition' : 'construire');

// ---------------- les kinds standard d'un objet ----------------
const usCache = new Map(); let usCacheT = 0;
function usKinds(it) {
  if (!it) return [];
  const now = Date.now(); if (now - usCacheT > 800) { usCache.clear(); usCacheT = now; }
  const ck = (it.id || it.name) + '|' + ((typeof S !== 'undefined' && S.inv) ? S.inv.length : 0);
  if (usCache.has(ck)) return usCache.get(ck);
  const K = new Set();
  const raw = usCall(() => GAME.usesOf(it), []) || [];
  for (const u of raw) {
    if (!u) continue;
    const k = u.kind, txt = String(u.txt || '');
    if (k === 'decorer' || k === 'confort') { K.add('confort'); continue; }
    if (US_K[k] && k !== 'vendre' && k !== 'recycler') { K.add(k); continue; }
    if (k === 'batiment') K.add('construire');
    else if (k === 'nourrir' || k === 'attirer' || k === 'eclore') K.add('familier');
    else if (k === 'habiller') K.add('porter');
    else if (k === 'recette') {
      if (/^Offrande/.test(txt)) K.add('offrande');
      else if (/^Atelier\s*:/.test(txt)) { const nm = txt.replace(/^Atelier\s*:\s*/, ''), r = RECIPES.find(x => x.out[0] === nm); K.add(r ? usOutKind(r.out) : 'construire'); }
    }
  }
  if (it.cat === 'v') K.add('porter');
  if (it.cat === 'n' && !it.mk) K.add('familier');
  if (usGearOf([it.name]) || usCall(() => famToolOf(it), null)) K.add('expedition');
  if (usCall(() => famSeedOf(it), null)) K.add('planter');
  if (it.cat === 'd' || usCall(() => f3IsDeco(it), false)) K.add('confort');
  const order = ['porter', 'cuisiner', 'construire', 'expedition', 'familier', 'planter', 'offrande', 'confort'];
  const out = order.filter(k => K.has(k));
  usCache.set(ck, out);
  return out;
}
// onglets du sac
const US_TABS = [['tout', 'Tout'], ['cuisiner', 'Cuisiner'], ['construire', 'Construire'], ['partir', 'Partir'], ['familier', 'Familiers'], ['porter', 'Porter'], ['confort', 'Confort'], ['autre', 'Autres / à vendre']];
const US_TAB_ICO = { cuisiner: 'cuisiner', construire: 'construire', partir: 'expedition', familier: 'familier', porter: 'porter', confort: 'confort', autre: 'vendre' };
const US_TAB_HINT = {
  cuisiner: 'Ingrédients : préparez des plats au commerce, puis vendez-les aux clients.',
  construire: 'Matériaux : fabriquez à l’atelier, construisez au village.',
  partir: 'Matériel, outils et offrandes : pour les expéditions et les gardiens.',
  familier: 'Pour nourrir, attirer ou faire éclore vos familiers.',
  porter: 'Chaque vêtement porté donne un bonus. 3 pièces d’un même ensemble : gros bonus !',
  confort: 'Décorations, statues, trophées et reliques : posez-les au foyer (« Poser chez moi ») pour gagner du confort.',
  autre: 'Collection, trésors et surplus : à garder, ou à vendre au marché.',
};
const US_TAB_EMPTY = { cuisiner: 'Aucun ingrédient pour vos recettes pour l’instant : marchés et vergers en regorgent.', construire: 'Aucun matériau : bois, laine, pierres… se trouvent partout en voyage.', partir: 'Aucun matériel d’expédition : fabriquez-en à l’atelier.', familier: 'Rien pour vos familiers : la nourriture se trouve partout.', porter: 'Aucun vêtement : chaque paysage a les siens.', confort: 'Aucune décoration dans le sac : elles sont peut-être déjà posées au foyer.', autre: 'Rien d’autre : tout a un usage !' };
function usTabsOf(it) {
  const k = usKinds(it), t = new Set();
  k.forEach(x => { if (x === 'cuisiner' || x === 'construire' || x === 'familier' || x === 'porter') t.add(x); if (x === 'expedition' || x === 'offrande') t.add('partir'); if (x === 'confort') t.add('confort'); });
  if (!t.size) t.add('autre');
  return t;
}
// 1 ou 2 pastilles dans un coin de l'icône
function usBadgesHTML(it) {
  if (!it) return '';
  try {
    const ks = usKinds(it), pills = [];
    if (it.cat === 'v') {
      pills.push(usPill('porter', 's'));
      const b = usWearOf(it);
      if (b) pills.push(b.t === 'cm' ? usPill(b.k, 's', b.txt) : usTerrPill(b.t, 's', b.txt));
    } else ks.slice(0, 2).forEach(k => pills.push(usPill(k, 's', US_K[k].nom)));
    return pills.length ? `<span class="usbd" aria-label="${esc(ks.map(k => US_K[k].nom).join(', '))}">${pills.join('')}</span>` : '';
  } catch (e) { return ''; }
}

// ================= VÊTEMENTS UTILES =================
// forme dessinée → [terrain | 'cm', type de bonus] ; risk : moins de risques, loot : plus de butin, prep : préparation plus rapide, pay : clients qui paient mieux
const US_FORM = {
  godillots: ['montagne', 'risk'], chullo: ['montagne', 'risk'], rando: ['montagne', 'risk'], gants: ['montagne', 'risk'], cuir: ['montagne', 'risk'], sac: ['montagne', 'loot'], kepi: ['montagne', 'loot'],
  moufles: ['froid', 'risk'], fourrees: ['froid', 'risk'], apres: ['froid', 'risk'], chapka: ['froid', 'risk'], bonnet: ['froid', 'risk'], pompon: ['froid', 'risk'], echarpe: ['froid', 'risk'], tartan: ['froid', 'risk'], jacquard: ['froid', 'loot'], pull: ['froid', 'risk'], noel: ['froid', 'loot'], mitaines: ['froid', 'loot'],
  cire: ['mer', 'risk'], bouee: ['mer', 'risk'], cuissardes: ['mer', 'risk'], capitaine: ['mer', 'risk'], bainb: ['mer', 'risk'],
  mariniere: ['mer', 'loot'], bain: ['mer', 'loot'], tongs: ['mer', 'loot'], coquill: ['mer', 'loot'], lei: ['mer', 'loot'], hawai: ['mer', 'loot'], tshirt: ['mer', 'loot'], short: ['mer', 'loot'], calecon: ['mer', 'loot'],
  cheche: ['desert', 'risk'], sombrero: ['desert', 'risk'], sandales: ['desert', 'risk'], babouches: ['desert', 'risk'], explorateur: ['desert', 'risk'], kasa: ['desert', 'risk'], poncho: ['desert', 'loot'], bandana: ['desert', 'loot'],
  bottes: ['foret', 'risk'], carreaux: ['foret', 'risk'], salopette: ['foret', 'risk'], gilet: ['foret', 'risk'], carquois: ['foret', 'risk'], chaussettes: ['foret', 'risk'],
  paille: ['foret', 'loot'], jardin: ['foret', 'loot'], champignon: ['foret', 'loot'], bob: ['foret', 'loot'], panier: ['foret', 'loot'], oreilles: ['foret', 'loot'], sabots: ['foret', 'loot'], laurier: ['foret', 'loot'], cape: ['foret', 'loot'], fleurs: ['foret', 'loot'],
  baskets: ['ville', 'loot'], casquette: ['ville', 'loot'], cartable: ['ville', 'loot'], tote: ['ville', 'loot'], valise: ['ville', 'loot'], sweat: ['ville', 'loot'], jean: ['ville', 'loot'], maillot: ['ville', 'loot'], rayee: ['ville', 'loot'], rayees: ['ville', 'loot'], bandanacou: ['ville', 'loot'], securite: ['ville', 'risk'], veste: ['ville', 'risk'],
  toque: ['cm', 'prep'], tablier: ['cm', 'prep'], chaussons: ['cm', 'prep'], peignoir: ['cm', 'prep'],
  noeud: ['cm', 'pay'], foulard: ['cm', 'pay'], beret: ['cm', 'pay'], hautforme: ['cm', 'pay'], cloche: ['cm', 'pay'], dentelle: ['cm', 'pay'], kimono: ['cm', 'pay'], soie: ['cm', 'pay'], montre: ['cm', 'pay'], bracelet: ['cm', 'pay'],
  diademe: ['cm', 'pay'], couronne: ['cm', 'pay'], mandarine: ['cm', 'pay'], jupe: ['cm', 'pay'], tutu: ['cm', 'pay'], plissee: ['cm', 'pay'], ruban: ['cm', 'pay'], clochette: ['cm', 'pay'], serretete: ['cm', 'pay'],
  canotier: ['cm', 'pay'], sorciere: ['cm', 'pay'], nuit: ['cm', 'pay'], bandeau: ['cm', 'pay'], ailes: ['cm', 'pay'], capeetoile: ['cm', 'pay'], vampire: ['cm', 'pay'], kilt: ['cm', 'pay'], perles: ['cm', 'pay'], chapeau: ['cm', 'pay'],
};
// mots du nom qui l'emportent (un « bonnet de montagne » aide en montagne)
const US_WORD = [[/montagn|sommet|alpin|trek|randonn|escalad|cervin/, 'montagne'], [/polaire|neige|yeti|ski|flocon|islandais|banquise|glace/, 'froid'], [/marin|mer\b|plage|surf|pecheur|plong|bretag|matelot|capitaine/, 'mer'], [/desert|sable|safari|dune|oasis|sahara/, 'desert'], [/foret|bucheron|bois\b|jardin|champignon/, 'foret'], [/ville|metro|urbain|city/, 'ville'], [/chef|cuisin|patiss|boulang|toque|tablier/, 'cm:prep']];
const usPct = v => Math.round(v * 100);
function usFormOf(it) {
  if (!it || it.cat !== 'v') return null;
  const base = it.look || ''; return usCall(() => vFormOf(it.name || '', it.sub, base), base) || base;
}
// le bonus d'un vêtement : { t, k, v, txt }
function usWearOf(it) {
  if (!it || it.cat !== 'v') return null;
  const f = usFormOf(it), n = usCall(() => vNorm(it.name), String(it.name || '').toLowerCase());
  let d = US_FORM[f] || US_FORM[it.look] || null;
  for (const [re, t] of US_WORD) if (re.test(n)) { d = t.startsWith('cm:') ? ['cm', t.slice(3)] : [t, d && d[0] === t ? d[1] : 'risk']; break; }
  if (!d) d = ['ville', 'loot'];
  const r = Math.max(0, Math.min(4, it.rarity || 0));
  const v = d[1] === 'risk' ? 0.10 + 0.025 * r : d[1] === 'loot' ? 0.10 + 0.03 * r : 0.08 + 0.02 * r;
  return { t: d[0], k: d[1], v, txt: usBonusTxt(d[0], d[1], v) };
}
function usBonusTxt(t, k, v) {
  if (k === 'risk') return `−${usPct(v)} % de risques ${US_TNAME[t] || ''}`;
  if (k === 'loot') return `+${usPct(v)} % de butin ${US_TNAME[t] || ''}`;
  if (k === 'prep') return `−${usPct(v)} % de temps de préparation`;
  return `+${usPct(v)} % de pièces des clients`;
}
// ---------------- ensembles : 4 pièces (une par emplacement) ; bonus dès 3 pièces portées ----------------
const US_SETS = [
  { id: 'marin', nom: 'Marin breton', pcs: [['haut', ['mariniere']], ['tete', ['capitaine', 'bob', 'casquette']], ['pieds', ['cuissardes', 'tongs', 'bottes']], ['cou', ['bouee', 'foulard', 'rayee']]], fx: [['mer', 'risk', 0.3], ['mer', 'loot', 0.25]] },
  { id: 'explo', nom: 'Explorateur', pcs: [['tete', ['explorateur']], ['haut', ['gilet', 'veste']], ['dos', ['rando', 'sac', 'carquois']], ['pieds', ['godillots']]], fx: [['*', 'risk', 0.2]] },
  { id: 'monta', nom: 'Montagnard', pcs: [['tete', ['chullo', 'bonnet', 'pompon']], ['haut', ['jacquard', 'pull']], ['mains', ['gants', 'moufles', 'cuir']], ['pieds', ['godillots', 'apres']]], fx: [['montagne', 'risk', 0.35], ['montagne', 'loot', 0.2]] },
  { id: 'chef', nom: 'Chef pâtissier', pcs: [['tete', ['toque']], ['haut', ['tablier']], ['cou', ['noeud', 'foulard']], ['mains', ['soie', 'mitaines', 'gants']]], fx: [['cm', 'prep', 0.3]] },
  { id: 'jard', nom: 'Jardinier', pcs: [['tete', ['paille']], ['bas', ['salopette']], ['mains', ['jardin']], ['pieds', ['sabots', 'bottes']]], fx: [['foret', 'loot', 0.3], ['foret', 'risk', 0.2]] },
  { id: 'polaire', nom: 'Voyageur polaire', pcs: [['tete', ['chapka', 'bonnet', 'pompon', 'noel']], ['cou', ['echarpe', 'tartan']], ['mains', ['moufles', 'fourrees']], ['pieds', ['apres']]], fx: [['froid', 'risk', 0.35], ['froid', 'loot', 0.2]] },
  { id: 'nomade', nom: 'Nomade du désert', pcs: [['tete', ['sombrero', 'kasa', 'explorateur']], ['cou', ['cheche', 'bandanacou']], ['haut', ['poncho']], ['pieds', ['sandales', 'babouches']]], fx: [['desert', 'risk', 0.35], ['desert', 'loot', 0.2]] },
  { id: 'chic', nom: 'Citadin chic', pcs: [['tete', ['beret', 'hautforme', 'cloche']], ['cou', ['noeud', 'dentelle', 'perles']], ['haut', ['kimono', 'veste']], ['mains', ['montre', 'bracelet', 'soie']]], fx: [['cm', 'pay', 0.25]] },
];
const US_SET_MIN = 3;
const usSlots = () => usCall(() => ST_SLOT_IDS, ['tete', 'cou', 'haut', 'bas', 'mains', 'pieds', 'dos']);
// vêtements portés par k (objets du sac, tenue de départ, ancienne tenue)
function usWornItems(k) {
  if (!k || !S.outfits || !S.outfits[k]) return [];
  return usSlots().map(sl => usCall(() => stWorn(k, sl), null)).filter(Boolean);
}
function usSetsOf(k) {
  const worn = usWornItems(k), bySl = {}; worn.forEach(it => { bySl[it.sub] = usFormOf(it); });
  return US_SETS.map(St => { const got = St.pcs.map(([sl, fs]) => !!bySl[sl] && fs.includes(bySl[sl])); const n = got.filter(Boolean).length; return { St, n, got, on: n >= US_SET_MIN }; });
}
// tous les bonus de k : [{ t, k, v, txt, set? }]
function usBonusOf(k) {
  const out = [];
  usWornItems(k).forEach(it => { const b = usWearOf(it); if (b) out.push({ ...b, it }); });
  usSetsOf(k).filter(x => x.on).forEach(x => x.St.fx.forEach(([t, kk, v]) => out.push({ t, k: kk, v, txt: usBonusTxt(t, kk, v), set: x.St.nom })));
  return out;
}
const US_CAP = { risk: 0.6, loot: 0.6, prep: 0.45, pay: 0.5 };
function usSum(list, kind, terr) { const s = list.filter(b => b.k === kind && (!terr || b.t === terr || b.t === '*')).reduce((a, b) => a + b.v, 0); return Math.min(US_CAP[kind], s); }
const usRiskMul = (k, terr) => 1 - usSum(usBonusOf(k), 'risk', terr || 'foret');
const usLootP = (k, terr) => usSum(usBonusOf(k), 'loot', terr || 'foret');
// commerce : toute l'équipe compte (ceux qui sont au commerce comme ceux qui le représentent en voyage)
function usTeam() { const t = usCall(() => teamIds(), null); return (Array.isArray(t) && t.length ? t : Object.keys(S.comps || {})).filter(k => usCall(() => CHARS[k], null)); }
const usShopB = kind => Math.min(US_CAP[kind], usTeam().reduce((a, k) => a + usSum(usBonusOf(k), kind), 0));

// ---- application réelle ----
if (typeof xpRiskK === 'function') xpRiskK = (orig => function (k, c) {
  const r = orig.apply(this, arguments);
  try { if (r > 0 && k && c) { const m = usRiskMul(k, c.terr); if (m < 1) return Math.max(0.03, r * m); } } catch (e) {}
  return r;
})(xpRiskK);
let usLootMsg = null;
if (typeof collect === 'function') collect = (orig => function () {
  usLootMsg = null;
  try {
    const k = S.sel, t = S.trips[k];
    if (t && t.done && !t.tuto && !t.usL) {
      t.usL = 1;
      const terr = t.xpTerr || usCall(() => xpTerrOf(t.dest), 'foret'), p = usLootP(k, terr);
      if (p > 0 && Math.random() < p) {
        const b = usCall(() => lootFor((t.dest && t.dest.tags && t.dest.tags.length) ? t.dest.tags : ['campagne'], t.luck || 0, t.dest ? t.dest.name : '', 1, k)[0], null);
        if (b) { b.usb = 1; t.bag.push(b); usLootMsg = { k, txt: `Bonus de tenue (${US_TNAME[terr] || ''}) : « ${b.name} » en plus !` }; }
      }
    }
  } catch (e) { console.error('usages butin', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  try { if (usLootMsg && h && h.comp === usLootMsg.k) { h.extra = (h.extra || []).concat([usLootMsg.txt]); usLootMsg = null; } } catch (e) {}
  return orig.apply(this, arguments);
})(showHaul);
if (typeof cfDurMul === 'function') cfDurMul = (orig => function () {
  const m = orig.apply(this, arguments);
  try { const b = usShopB('prep'); if (b > 0) return m * (1 - b); } catch (e) {}
  return m;
})(cfDurMul);
if (typeof cmSell === 'function') cmSell = (orig => function () {
  const c0 = S.coins, r = orig.apply(this, arguments);
  try { const d = S.coins - c0, b = usShopB('pay'); if (d > 0 && b > 0) { const x = Math.max(1, Math.round(d * b)); gainCoins(x); renderTop(); } } catch (e) {}
  return r;
})(cmSell);
try { if (window.__cm) window.__cm.sell = cmSell; } catch (e) {}

// ================= RECYCLAGE : matériaux de base =================
const US_BASE = {
  bois: ['Planche de bois', 'm', 'bois', 0, null, '#b07a4f'],
  tissu: ['Coupon de tissu', 'm', 'tissu', 0, null, '#e9b58f'],
  pierre: ['Pierre brute', 'm', 'pierre', 0, null, '#a9a39a'],
  metal: ['Ferraille', 'm', 'metal', 0, null, '#8f9cb3'],
  terreau: ['Terreau', 'm', 'mousse', 0, null, '#7a5a3a'],
};
const US_BASE_NAMES = new Set(Object.values(US_BASE).map(d => d[0]));
function usBaseOf(it) {
  if (!it || it.tresor || it.cat === 't' || US_BASE_NAMES.has(it.name)) return null;
  const f = usCall(() => famOf(it), null), s = it.sub || '';
  if (it.cat === 'v' || /tissu|laine|plume/.test(s)) return 'tissu';
  if (/metal|plastique|medaille|outil|cle|coffre/.test(s) || f === 'equipement') return 'metal';
  if (/pierre|eclat|cristal|sable|gemme|coquillage|perle|corail|fragment/.test(s) || f === 'nature' || f === 'tresors') return 'pierre';
  if (it.cat === 'n' || f === 'jardin' || /fleur|feuille|graine|mousse|champignon/.test(s)) return 'terreau';
  return 'bois';
}
const usRecN = it => 1 + ((it.rarity || 0) >= 2 ? 1 : 0);
function usRecycle(id) {
  const it = S.inv.find(i => i.id === id), b = usBaseOf(it); if (!b) return null;
  const go = () => {
    const x = S.inv.find(i => i.id === id); if (!x) return;
    S.inv.splice(S.inv.indexOf(x), 1);
    for (const o of Object.values(S.outfits || {})) if (o && o.worn && o.worn[x.sub] === x.id) { o[x.sub] = 'none'; o.worn[x.sub] = null; }
    const n = usRecN(x), made = [];
    for (let i = 0; i < n; i++) { const m = makeItem(US_BASE[b], 0, 'Recyclé', [], { fixed: 0 }); S.inv.push(m); made.push(m); }
    S.dex[US_BASE[b][0]] = true;
    save(); usCall(() => { renderTop(); renderComps(); renderPanel(); });
    toast(`Recyclé : « ${x.name} » → ${n} × ${US_BASE[b][0].toLowerCase()}.`);
  };
  if (typeof styleGuard === 'function') styleGuard(id, 'recycler', go); else go();
  return b;
}
function usSell(id) {
  const it = S.inv.find(i => i.id === id); if (!it || it.tresor) return;
  const m = $('modal'); if (m) m.hidden = true;
  const b = document.createElement('button'); b.hidden = true; b.dataset.sellq = id; document.body.appendChild(b); b.click(); b.remove(); // même chemin que la vente rapide (10_ui.js)
}

// ================= ACTIONS (GAME.addAction) et USAGES (GAME.addUses) =================
const usAfter = () => usCall(() => { renderTop(); renderPanel(); });
function usCook(rid) {
  const R = CM_R[rid], T = usCall(() => cmT(), null); if (!R) return;
  if (!T || T.id !== R.shop) { const B = usCall(() => BQS(R.shop), null); toast(`« ${R.def[0]} » se prépare dans votre ${B ? B.name.toLowerCase() : 'commerce'} : changez de commerce à la boutique.`); return; }
  const n0 = cmState().sl.filter(Boolean).length;
  cmStart(rid);
  if (cmState().sl.filter(Boolean).length > n0) toast(`En préparation : « ${R.def[0]} » (${Math.round(cmDur(R))} s). Il ira sur le comptoir.`);
  usAfter();
}
function usCraft(rid) {
  const r = RECIPES.find(x => x.id === rid); if (!r) return;
  if (usCall(() => canCraft(r), false)) { const n0 = S.stats.crafted; craft(rid); if (S.stats.crafted > n0) toast(`Fabriqué : « ${r.out[0]} » !`); usAfter(); return; }
  usCall(() => obGo('craft', rid));
}
function usFeed(id) { const b = document.createElement('button'); b.hidden = true; b.dataset.feed = id; document.body.appendChild(b); b.click(); b.remove(); }
function usWear(id) {
  const it = S.inv.find(i => i.id === id), k = S.sel; if (!it || !k) return;
  if (typeof styleEquip === 'function') styleEquip(k, it); else return usCall(() => obGo('wear', '', id));
  const b = usWearOf(it); usCall(() => { renderTop(); renderComps(); renderPanel(); });
  toast(`${CHARS[k].name} porte « ${it.name} »${b ? ` : ${b.txt}` : ''}.`);
}
function usGearEquip(id) {
  const k = S.sel, a = usCall(() => xpEq(k), null); if (!a) return;
  let slot = a.indexOf(null); if (slot < 0) slot = 0;
  if (usCall(() => xpEquip(k, slot, id), false)) { toast(`${CHARS[k].name} emporte « ${S.inv.find(i => i.id === id).name} » en expédition.`); usAfter(); }
  else toast('Ce matériel est déjà porté par un autre compagnon.');
}
function usPlant(id) {
  const J = usCall(() => famState().j, null); if (!J) return;
  const n = usCall(() => famPlotN(), 3); let i = -1; for (let p = 0; p < n; p++) if (!J.plots[p]) { i = p; break; }
  if (i < 0) { toast('Le jardin est plein : récoltez d’abord (Foyer › Jardin).'); return; }
  const it = S.inv.find(x => x.id === id), s = it && famSeedOf(it);
  if (famSow(i, id)) { toast(`Planté ! « ${s.out[0]} » à récolter dans ${s.min} min (Foyer › Jardin).`); usAfter(); }
}
function usQuests(sel) { usCall(() => { qtOpenPage(); if (sel) setTimeout(() => { const e = document.querySelector('#modal ' + sel); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); }, 80); }); }

GAME.addUses(it => {
  const out = []; if (!it) return out;
  usCmRecipes(it).slice(0, 3).forEach(({ R }) => out.push({ txt: `${R.def[1] === 'n' ? 'Cuisiner' : 'Préparer'} : ${R.def[0]}`, kind: R.def[1] === 'n' ? 'cuisiner' : 'construire', go: () => usCook(R.id) }));
  const G = usGearOf([it.name]); if (G) out.push({ txt: `Expédition : ${usCall(() => XP_G[G.g][2], '')}`, kind: 'expedition', go: () => usGearEquip(it.id) });
  const s = usCall(() => famSeedOf(it), null); if (s) out.push({ txt: `Planter : ${s.out[0]} en ${s.min} min`, kind: 'planter', go: () => usPlant(it.id) });
  const ch = usCall(() => famIsChest(it), null); if (ch) out.push({ txt: `Coffre : s’ouvre avec une ${famKeyName(ch).toLowerCase()}`, kind: 'tresor', go: () => famOpenChest(it.id) });
  const ky = usCall(() => famIsKey(it), null); if (ky) out.push({ txt: `Clé : ouvre un ${famChestName(ky).toLowerCase()}`, kind: 'tresor' });
  if (it.cat === 'v') { const b = usWearOf(it); if (b) out.push({ txt: `Porté : ${b.txt}`, kind: 'porter', go: () => usWear(it.id) }); }
  return out;
});
GAME.addAction(it => {
  const out = []; if (!it || !S.inv.includes(it)) return out;
  // recettes du commerce (avec le produit en image)
  const cms = usCmRecipes(it).slice(0, 4), cmN = new Set(cms.map(x => x.R.def[0]));
  cms.forEach(({ R, ok, here }) => out.push({ label: R.def[0], kind: R.def[1] === 'n' ? 'cuisiner' : 'construire', out: R.def, ready: ok, hint: here ? `${R.ing.map(([k, n]) => `${n} ${usCall(() => cmIngName(k), k).toLowerCase()}`).join(' + ')}` : 'Dans un autre commerce', run: () => usCook(R.id) }));
  // atelier (vêtements, matériel d'expédition, objets)
  usAtRecipes(it).filter(x => !cmN.has(x.r.out[0])).slice(0, 4).forEach(({ r, ok }) => out.push({ label: r.out[0], kind: usOutKind(r.out), out: r.out, ready: ok, run: () => usCraft(r.id) }));
  // bâtiments du village
  usCall(() => VILLAGE_BUILDINGS.filter(b => !villageBuilt(b.id) && b.cost.some(([k]) => usIngMatch(k, it))).slice(0, 2), []).forEach(b => out.push({ label: b.name, kind: 'construire', ico: usCall(() => obIco('batiment'), ''), run: () => obGo('village') }));
  // vêtement, matériel, graine, coffre, clé
  if (it.cat === 'v') out.push({ label: 'Porter', kind: 'porter', ready: true, run: () => usWear(it.id) });
  if (usGearOf([it.name])) out.push({ label: 'Équiper', kind: 'expedition', ready: true, run: () => usGearEquip(it.id) });
  const s = usCall(() => famSeedOf(it), null); if (s) out.push({ label: s.out[0], kind: 'planter', out: s.out, ready: true, run: () => usPlant(it.id) });
  const ch = usCall(() => famIsChest(it), null);
  if (ch) { const has = S.inv.some(i => usCall(() => famIsKey(i), null) === ch); out.push({ label: 'Ouvrir', kind: 'coffre', ready: has, run: () => famOpenChest(it.id) }); }
  const ky = usCall(() => famIsKey(it), null);
  if (ky) { const c = S.inv.find(i => usCall(() => famIsChest(i), null) === ky); out.push({ label: `Ouvrir le ${famChestName(ky).toLowerCase()}`, kind: 'coffre', out: [famChestName(ky), 'm', 'coffre', 1, null, usCall(() => FAM_LOCKS[ky].col, '#b07a4f')], ready: !!c, run: () => (c ? famOpenChest(c.id) : toast(`Il vous faut d’abord un ${famChestName(ky).toLowerCase()} : on en trouve en voyage.`)) }); }
  // nourrir (48_progression.js peut fournir le sien : le même libellé n'est affiché qu'une fois)
  if (it.cat === 'n' && !it.mk && usCall(() => tasteOf(S.sel, it), 'like') !== 'hate') out.push({ label: 'Nourrir', kind: 'familier', ready: true, run: () => usFeed(it.id) });
  // offrandes aux gardiens (43_mysteres.js)
  usCall(() => MY_GUARDS.filter(G => { const g = myGRec(G.id); return g.d && !g.done && (g.t || 0) < G.offers.length && myOfferMatch(myOffer(G))(it); }).slice(0, 1), []).forEach(G => out.push({ label: `Offrir : ${G.nm}`, kind: 'offrande', ready: true, run: () => usQuests('#qmq-gd_' + G.id) }));
  // objectif du jour et quêtes (38_quetes.js)
  usCall(() => qtNeeds().filter(n => n.match && (n.src === 'jour' || n.src === 'quete') && n.match(it)).slice(0, 1), []).forEach(n => out.push({ label: n.src === 'jour' ? 'Objectif du jour' : 'Quête', kind: 'quete', ready: true, run: () => usQuests() }));
  // vendre et recycler
  if (!it.tresor) out.push({ label: `Vendre (≈ ${usCall(() => sellPrice(it), 0)} pièces)`, kind: 'vendre', run: () => usSell(it.id) });
  if (usBaseOf(it)) out.push({ label: 'Recycler', kind: 'recycler', out: US_BASE[usBaseOf(it)], run: () => usRecycle(it.id) });
  return out;
});

// ================= LA FICHE : objet → résultats, Utiliser, Vendre, Recycler =================
let US_ACTS = [];
const US_MAIN_ORDER = ['construire', 'cuisiner', 'porter', 'expedition', 'coffre', 'planter', 'familier', 'offrande']; // v42 : ce qui se fait TOUT DE SUITE d'abord ; l'offrande (lointaine) en dernier
const US_VERB = { construire: 'Fabriquer', cuisiner: 'Cuisiner', porter: 'Porter', expedition: 'Équiper', coffre: 'Ouvrir', planter: 'Planter', familier: 'Nourrir', offrande: 'Offrir' };
function usActsFor(it) {
  const all = usCall(() => GAME.actionsOf(it), []) || [], seen = new Map();
  all.forEach(a => { if (a && a.label && typeof a.run === 'function') seen.set(String(a.label).toLowerCase(), a); }); // le dernier déclaré l'emporte (ex. 48_progression.js)
  return [...seen.values()];
}
function usMainOf(acts, it) {
  const use = acts.filter(a => a.kind !== 'vendre' && a.kind !== 'recycler' && a.kind !== 'quete');
  const rank = a => { const i = US_MAIN_ORDER.indexOf(a.kind); return i < 0 ? 50 : i; };
  const rdy = use.filter(a => a.ready).sort((a, b) => (!!b.out - !!a.out) || rank(a) - rank(b));
  return rdy[0] || null; // v42 : « Utiliser » seulement si c'est faisable maintenant
}
function usFicheHTML(it) {
  US_ACTS = usActsFor(it);
  const idx = a => US_ACTS.indexOf(a);
  const res = US_ACTS.filter(a => (a.out || a.ico) && a.kind !== 'vendre' && a.kind !== 'recycler').slice(0, 6);
  const main = usMainOf(US_ACTS, it), sell = US_ACTS.find(a => a.kind === 'vendre'), rec = US_ACTS.find(a => a.kind === 'recycler');
  let h = '<div class="usfiche">';
  if (res.length) {
    h += `<div class="usflow"><span class="usfrom">${usCall(() => itemIcon(it), '')}${usBadgesHTML(it)}</span><svg class="usarr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 H18 M13 6 L19 12 L13 18" fill="none" stroke="${US_INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="usouts">`;
    h += res.map(a => `<button class="usres${a.ready ? ' ok' : ''}" data-usact="${idx(a)}" title="${esc(a.label)}${a.hint ? ' · ' + esc(a.hint) : ''}" aria-label="${esc(a.label)}${a.ready ? ', prêt' : ''}"><span class="usri">${a.out ? usIco(a.out) : a.ico}${usPill(US_K[a.kind] ? a.kind : 'construire', 's usrk')}${a.ready ? '<b class="usok" aria-hidden="true">✓</b>' : ''}</span><small>${esc(a.label)}</small></button>`).join('');
    h += '</div></div>';
  }
  const btns = [];
  if (main) btns.push(`<button class="btn green sm usmain" data-usact="${idx(main)}">${usPill(US_K[main.kind] ? main.kind : 'construire', 's')}<span>${esc(main.out && main.kind !== 'planter' ? (main.kind === 'cuisiner' ? 'Cuisiner : ' : 'Fabriquer : ') + main.label : (US_VERB[main.kind] && !/^(Porter|Équiper|Nourrir|Ouvrir)/.test(main.label) ? US_VERB[main.kind] + ' : ' : '') + main.label)}</span></button>`);
  if (sell) btns.push(`<button class="btn cream sm ussell" data-usact="${idx(sell)}">${usPill('vendre', 's')}<span>Vendre ≈ ${usCall(() => coins(sellPrice(it)), '')}</span></button>`);
  if (rec) btns.push(`<button class="btn cream sm usrec" data-usact="${idx(rec)}" title="Devient : ${esc(rec.out[0])}">${usPill('recycler', 's')}<span>Recycler</span><span class="usrb">${usIco(rec.out)}</span></button>`);
  if (btns.length) h += `<div class="usbtns">${btns.join('')}</div>`;
  return h + '</div>';
}
if (typeof openFiche === 'function') openFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  try {
    const it = S.inv.find(i => i.id === id), f = document.querySelector('#modal .fiche');
    if (!it || !f) return r;
    const at = f.querySelector('.famtop') || f.querySelector('.obfk') || f.querySelector('h2');
    const html = usFicheHTML(it);
    if (at && at.classList.contains('famtop')) at.insertAdjacentHTML('beforebegin', html); else if (at) at.insertAdjacentHTML('afterend', html); else f.insertAdjacentHTML('afterbegin', html);
    // pas de doublons : le bouton du bandeau et la vente rapide sont remplacés par « Utiliser » et « Vendre »
    f.querySelectorAll('.famtop .famtb, .obff [data-sellq]').forEach(b => b.remove());
    f.querySelectorAll('.famtop').forEach(b => b.remove()); // v42 : doublon de la rangée de résultats
    // la liste détaillée des usages reste disponible, repliée
    const sec = f.querySelector('.obsec');
    if (sec && f.querySelector('.usflow, .usbtns')) { const h3 = sec.querySelector('h3'); const d = document.createElement('details'); d.className = 'obsec usdet'; d.innerHTML = `<summary>${h3 ? h3.textContent : 'À quoi ça sert'}</summary>`; if (h3) h3.remove(); while (sec.firstChild) d.appendChild(sec.firstChild); sec.replaceWith(d); }
  } catch (e) { console.error('usages fiche', e); }
  return r;
})(openFiche);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-usact]'); if (!b || b.disabled) return;
  const a = US_ACTS[+b.dataset.usact]; if (!a) return;
  const m = $('modal'); if (m && b.closest('#modal')) m.hidden = true;
  try { a.run(); } catch (e) { console.error('usages action', e); }
});

// ================= SAC ET BUTIN : pastilles =================
if (typeof haulCard === 'function') haulCard = (orig => function (it) {
  const h = orig.apply(this, arguments);
  try { const bd = usBadgesHTML(it); if (bd) return h.replace('<span class="hico">', `<span class="hico usrel">${bd}`); } catch (e) {}
  return h;
})(haulCard);

// ================= GARDE-ROBE : bonus de la tenue et ensembles =================
function usWardHTML(k) {
  const bs = usBonusOf(k).filter(b => !b.set), sets = usSetsOf(k);
  // regroupe les bonus identiques (même terrain, même type)
  const g = new Map(); bs.forEach(b => { const key = b.t + b.k; g.set(key, { ...b, v: (g.get(key) ? g.get(key).v : 0) + b.v }); });
  const chip = b => `<span class="uswc">${b.t === 'cm' ? usPill(b.k, 's') : usTerrPill(b.t, 's')}${esc(usBonusTxt(b.t, b.k, Math.min(US_CAP[b.k], b.v)))}</span>`;
  let h = `<div class="uswr"><p class="uswl"><b>Bonus :</b> ${g.size ? [...g.values()].map(chip).join('') : '<span class="uswe">aucun vêtement porté</span>'}</p>`;
  const show = sets.filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 2);
  if (!show.length) show.push(sets[0]);
  h += show.map(x => `<p class="uswset${x.on ? ' on' : ''}"><b>${esc(x.St.nom)}</b><em>${x.n}/4</em><span class="uswd">${x.got.map(o => `<i class="${o ? 'y' : ''}"></i>`).join('')}</span><small>${x.St.fx.map(([t, kk, v]) => `<span class="uswc">${t === 'cm' ? usPill(kk, 's') : usTerrPill(t, 's')}${esc(usBonusTxt(t, kk, v))}</span>`).join('')}${x.on ? '' : `<span>dès ${US_SET_MIN} pièces</span>`}</small></p>`).join('');
  return h + '</div>';
}
if (typeof renderWardrobe === 'function') renderWardrobe = (orig => function (k) {
  const h = orig.apply(this, arguments);
  try { const at = h.indexOf('<div class="wrstage">'); if (at >= 0) return h.slice(0, at) + usWardHTML(k) + h.slice(at); } catch (e) { console.error('usages garde-robe', e); }
  return h;
})(renderWardrobe);

// ================= STYLES =================
(function usCSS() {
  const st = document.createElement('style');
  st.textContent = `
.uspill{--sz:15px;display:inline-flex;align-items:center;justify-content:center;flex:none;width:var(--sz);height:var(--sz);border-radius:50%;background:var(--pc);border:1.5px solid ${US_INK};font-style:normal;box-sizing:border-box}
.uspill svg{width:78%;height:78%;display:block}
.uspill.s{--sz:15px}
.usbd{position:absolute;right:-3px;bottom:-3px;display:flex;gap:1px;z-index:2;pointer-events:none}
.usbd .uspill{box-shadow:0 1px 0 rgba(91,70,54,.25)}
.obi{position:relative}.hico.usrel{position:relative;display:inline-block}
.usfiche{margin:8px 0 6px;display:flex;flex-direction:column;gap:8px;max-width:100%}
.usflow{display:flex;align-items:center;gap:6px;background:#fff8ec;border:2px solid #ecdcc4;border-radius:16px;padding:6px 8px;min-width:0}
.usfrom{position:relative;flex:none;width:44px;height:44px;display:inline-block}.usfrom svg:not(.uspill svg){width:44px;height:44px}
.usarr{flex:none;width:20px;height:20px}
.usouts{display:flex;gap:6px;overflow-x:auto;min-width:0;padding:2px;scrollbar-width:none}
.usres{flex:none;width:58px;display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:2px solid #e3d3bb;border-radius:12px;padding:4px 2px 3px;cursor:pointer;font:inherit;color:inherit;opacity:.72}
.usres.ok{opacity:1;border-color:#7fbf8e;background:#f1fbf3}
.usres:active{transform:scale(.95)}
.usri{position:relative;width:40px;height:40px;display:block}.usri>svg{width:40px;height:40px}
.usri .usrk{position:absolute;left:-3px;bottom:-3px}
.usok{position:absolute;right:-4px;top:-4px;width:15px;height:15px;border-radius:50%;background:#4f9f63;color:#fff;font-size:10px;line-height:15px;text-align:center;border:1.5px solid ${US_INK}}
.usres small{font-size:10.5px;line-height:1.1;max-width:54px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.usbtns{display:flex;gap:6px;flex-wrap:wrap}
.usbtns .btn{display:inline-flex;align-items:center;gap:5px;flex:1 1 auto;justify-content:center;min-width:0}
.usbtns .btn span{display:inline-flex;flex-direction:column;align-items:flex-start;line-height:1.05}
.usbtns .ussell span{flex-direction:row;align-items:center;gap:2px}.ussell i{font-style:normal}
.usmain small{font-size:10px;font-weight:600;opacity:.85;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.usrb{width:22px;height:22px}.usrb svg{width:22px;height:22px}
.usdet summary{cursor:pointer;font-weight:800;color:#8a6a50;font-size:13px;margin:4px 0}
.uswr{margin:6px 0;padding:6px 8px;background:#fff8ec;border:2px solid #ecdcc4;border-radius:14px;font-size:12.5px}
.uswr p{margin:2px 0;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.uswc{display:inline-flex;align-items:center;gap:3px;background:#fff;border:1.5px solid #e3d3bb;border-radius:99px;padding:1px 7px 1px 2px;font-weight:700}
.uswe{opacity:.7}
.uswset b{font-weight:800}.uswset em{font-style:normal;font-weight:800;color:#8a6a50}
.uswset.on{background:#eef8ee;border-radius:10px;padding:2px 4px}.uswset.on em{color:#3f8a4f}
.uswd{display:inline-flex;gap:2px}.uswd i{width:9px;height:9px;border-radius:50%;border:1.5px solid ${US_INK};background:#fff}.uswd i.y{background:#7fbf8e}
.uswset small{display:inline-flex;align-items:center;gap:3px;flex-wrap:wrap;opacity:.9}
.obfil.usfil{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.obfil.usfil button{min-height:46px;padding:4px 6px 5px}
.obfil.usfil button i.uspill{--sz:20px;grid-row:1;grid-column:1;justify-self:start;min-width:0;padding:0;height:var(--sz);width:var(--sz);background:var(--pc);border-radius:50%;line-height:0}
.obfil.usfil button span{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.obfil.usfil .obf-autre{grid-column:span 2}
@media (min-width:700px){.obfil.usfil{grid-template-columns:repeat(7,minmax(0,1fr))}.obfil.usfil .obf-autre{grid-column:auto}}
`;
  document.head.appendChild(st);
})();

// ---------------- outils de test ----------------
window.__us = {
  kinds: it => usKinds(it), tabs: it => [...usTabsOf(it)], badges: it => usBadgesHTML(it), wear: it => usWearOf(it), bonus: k => usBonusOf(k), sets: k => usSetsOf(k).map(x => ({ id: x.St.id, n: x.n, on: x.on })),
  riskMul: (k, t) => usRiskMul(k, t), lootP: (k, t) => usLootP(k, t), shop: kind => usShopB(kind), acts: it => usActsFor(it).map(a => ({ label: a.label, kind: a.kind, ready: !!a.ready, img: !!(a.out || a.ico) })),
  T: () => ({ openSheet, openFiche, xpRiskK, styleEquip, styleUnequip, makeItem, cmState, cmDur, CM_R, renderPanel }),
  base: it => usBaseOf(it), recycle: usRecycle, sell: usSell, SETS: US_SETS, BASE: US_BASE, ward: k => usWardHTML(k),
};

// ================= QUÊTES ET LISTE DE COURSES (v21) =================
// But : « j'ai besoin de ÇA, pour ÇA, et ça se trouve LÀ ».
// - qtNeeds() rassemble les besoins du joueur (ingrédients des recettes du commerce, commandes, rêves, objectif du jour,
//   étape de la quête suivie, clé d'un coffre) et qtLoc() trouve le lieu le plus proche où les obtenir ;
// - la carte montre ces lieux par de petites épingles « besoin » (8 au plus), avec une flèche au bord de l'écran
//   quand le lieu est loin ; boutons « Ma liste » et « Quêtes » à gauche de la carte ;
// - objectif du jour : 3 objets recherchés (proche, région, lointain), sans fenêtre spontanée (point rouge seulement) ;
// - vraies quêtes : 9 histoires en étapes avec un personnage et une récompense unique, et 8 défis difficiles ;
// - au retour d'un voyage, le butin indique « Pour : … ✔ ».
// État : S.qt = { st: {quête: {i, b, hit, done}}, df: {défi: 1}, log: {...}, follow, day, seen }.

function qtState() {
  if (!S.qt || typeof S.qt !== 'object') S.qt = {};
  const q = S.qt;
  if (!q.st || typeof q.st !== 'object') q.st = {};
  if (!q.df || typeof q.df !== 'object') q.df = {};
  if (!q.log || typeof q.log !== 'object') q.log = {};
  const L = q.log;
  if (!L.cont || typeof L.cont !== 'object') L.cont = {};
  if (!Array.isArray(L.reg)) L.reg = [];
  if (!L.m3 || typeof L.m3 !== 'object') L.m3 = {};
  for (const k of ['far', 'chests', 'made']) if (typeof L[k] !== 'number' || !isFinite(L[k])) L[k] = 0;
  if (typeof q.follow !== 'string') q.follow = '';
  if (typeof q.seen !== 'number') q.seen = 0;
  if (q.day && (typeof q.day !== 'object' || !Array.isArray(q.day.list))) q.day = null;
  return q;
}
const qtCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const qtRnd = s => (typeof btRng === 'function' ? btRng(btHash(s)) : rng(hashStr(s)));
const qtHome = () => homeObj();
const qtKm = p => qtCall(() => kmBetween(qtHome(), p), 0);
const qtWorn = () => qtCall(() => bqWorn(), new Set());
const qtFam = it => qtCall(() => FAM[famOf(it)], null);
const qtIco = it => qtCall(() => itemIcon(it), '');
const qtResIt = x => ({ name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar || 0, color: x.color, rid: x.id });
const qtIngIt = k => qtCall(() => bqSampleIng(k), { name: '', cat: 'm', sub: 'pierre', rarity: 0 });
const qtIngMatch = k => it => !!(it && !it.mk && ING[k] && ING[k][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n'));
const qtCount = m => S.inv.filter(it => it && m(it)).length;
const qtHomeReg = () => qtCall(() => regionAt(qtHome().lon, qtHome().lat), null);
const QT_SCROLL = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 7 H29 a4 4 0 0 1 4 4 V31 a3 3 0 0 1 -3 3 H11 a4 4 0 0 1 -4 -4 V9Z" fill="#fff3d6" stroke="#5b4636" stroke-width="2.2" stroke-linejoin="round"/><path d="M13 14 H27 M13 19 H27 M13 24 H22" stroke="#c98a5a" stroke-width="2.2" stroke-linecap="round"/><circle cx="29" cy="30" r="5" fill="#e0607e" stroke="#5b4636" stroke-width="2"/></svg>';
const QT_LIST = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="5" width="24" height="31" rx="4" fill="#fffaf0" stroke="#5b4636" stroke-width="2.4"/><rect x="14" y="2.5" width="12" height="6" rx="2" fill="#f2c14e" stroke="#5b4636" stroke-width="2"/><path d="M13 16 l2.4 2.4 L20 14 M13 25 l2.4 2.4 L20 23" fill="none" stroke="#3a8f5a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.5 16.5 H28 M22.5 25.5 H28" stroke="#c98a5a" stroke-width="2.4" stroke-linecap="round"/></svg>';
const QT_FLAG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 36 V5" stroke="#5b4636" stroke-width="3" stroke-linecap="round"/><path d="M11 6 C17 3 22 10 32 6 V21 C22 25 17 18 11 21Z" fill="#e0607e" stroke="#5b4636" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 11 l2 3 4 -4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
const QT_TROPHY = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 6 H28 V15 a8 8 0 0 1 -16 0Z" fill="#f6c445" stroke="#5b4636" stroke-width="2.2"/><path d="M12 9 H6 c0 6 3 8 7 8 M28 9 H34 c0 6 -3 8 -7 8" fill="none" stroke="#5b4636" stroke-width="2"/><path d="M20 23 V29 M13 34 H27 L25 29 H15Z" fill="#e0a52a" stroke="#5b4636" stroke-width="2" stroke-linejoin="round"/></svg>';

// ---------------- personnages et récompenses uniques ----------------
const qtCli = id => qtCall(() => BQC(id), null) || { id, name: id, sp: 'lapin' };
const qtFace = id => { const c = qtCli(id); const u = qtCall(() => clientURI(c, 'content'), ''); return u ? `<img class="qt-face" src="${u}" alt="">` : `<span class="qt-face qt-face0">${esc(c.name[0])}</span>`; };
function qtRwIco(rw) {
  if (rw.k === 'egg') return qtCall(() => bqEggSVG(rw.sp, 'qtrw' + rw.sp), QT_TROPHY);
  if (rw.k === 'cloth') return qtIco(bqItemOf(rw.def));
  if (rw.k === 'rec') return qtCall(() => CM_SCROLL, QT_SCROLL);
  if (rw.k === 'secret') return QT_FLAG;
  return QT_TROPHY;
}
function qtRwTxt(rw) {
  const c = rw.coins ? ` + ${rw.coins} pièces` : '';
  if (rw.k === 'egg') return `Œuf de ${qtCall(() => bqSpName(rw.sp), rw.sp).toLowerCase()}, variante unique${c}`;
  if (rw.k === 'cloth') return `Tenue exclusive : ${rw.def[0]}${c}`;
  if (rw.k === 'rec') return `Recette exclusive de votre commerce${c}`;
  if (rw.k === 'secret') return `Un lieu secret${c}`;
  return `${rw.coins} pièces`;
}
function qtGrant(rw, from) {
  let txt = qtRwTxt(rw);
  try {
    if (rw.k === 'egg') {
      let genes = null; try { genes = randomGenes(rw.sp, 3); } catch (e) {}
      addEgg({ sp: rw.sp, genes, rarity: 3, from: { how: 'quete', place: from }, hatchMs: 2 * 60e3 });
      const e = S.eggs[S.eggs.length - 1]; if (e) e.known = true;
    } else if (rw.k === 'cloth') {
      const it = makeItem(rw.def, 0, `Récompense : ${from}`, [], { fixed: rw.def[3] }); it.qt = 1; S.inv.push(it); S.dex[it.name] = true;
    } else if (rw.k === 'rec') {
      const T = cmT(), st = cmState(), R = T ? (CM_LINES[T.id] || []).find(x => x.x && !st.unl.includes(x.id)) : null;
      if (R) { st.unl.push(R.id); txt = `Recette exclusive : ${R.def[0]}`; } else { gainCoins(300); txt = '300 pièces (toutes les recettes exclusives sont déjà à vous)'; }
    } else if (rw.k === 'secret') {
      const r = typeof tzGiveRumor === 'function' ? tzGiveRumor(null, from, rw.near ? { lon: rw.near[0], lat: rw.near[1] } : null) : null;
      if (r) setTimeout(() => { try { tzRumorToast(from + ' vous confie un lieu secret', r); } catch (e) {} }, 1400);
      else { gainCoins(250); txt = '250 pièces'; }
    }
    if (rw.coins) gainCoins(rw.coins);
  } catch (e) { console.error('quêtes récompense', e); }
  save(); return txt;
}

// ---------------- les histoires ----------------
// étapes : go (lieu célèbre), cat (type de lieu), region, item (ingrédient à donner), craft (produits du commerce), chest (coffre), tame (nouveau compagnon)
const QT_STORIES = [
  { id: 'gouter', who: 'noisette', title: 'Le goûter de Noisette', pitch: 'Noisette organise un goûter surprise pour sa grand-mère.',
    steps: [{ t: 'cat', cat: 'boulangerie', txt: 'Visiter une boulangerie', story: '« Il me faut l’avis d’un vrai boulanger. Allez voir celle du quartier ! »' },
      { t: 'item', ing: 'sucre', n: 2, txt: 'Donner 2 douceurs sucrées', story: '« Du sucré, du vrai ! Grand-mère adore ça. »' },
      { t: 'craft', n: 1, txt: 'Fabriquer 1 produit au commerce', story: '« Et quelque chose fait maison, par vous, pour la table. »' },
      { t: 'cat', cat: 'parc', txt: 'Visiter un parc pour le pique-nique', story: '« Il ne manque plus qu’un joli coin d’herbe. »' }],
    rw: { k: 'rec', coins: 150 } },
  { id: 'alpes', who: 'pompon', title: 'La route des Alpes', pitch: 'Pompon cherche la graine d’edelweiss de son grand-père, perdue quelque part dans les Alpes.',
    steps: [{ t: 'go', place: 'Lyon', txt: 'Aller à Lyon', story: '« Grand-père partait toujours de Lyon. Commençons là. »' },
      { t: 'go', place: 'Annecy', txt: 'Aller à Annecy', story: '« Son carnet parle d’un lac turquoise… c’est Annecy ! »' },
      { t: 'item', ing: 'graine', n: 1, txt: 'Donner 1 graine', story: '« Une graine trouvée en chemin, pour la comparer. »' },
      { t: 'go', place: 'Chamonix', txt: 'Monter à Chamonix', story: '« La dernière page montre le Mont-Blanc. Allons-y ! »' },
      { t: 'item', ing: 'cristal', n: 1, txt: 'Donner 1 cristal', story: '« Grand-père gardait sa graine dans un cristal. Il m’en faut un ! »' }],
    rw: { k: 'egg', sp: 'phoque', coins: 200 } },
  { id: 'canuts', who: 'roussette', title: 'Le foulard des canuts', pitch: 'Roussette veut la plus belle tenue du bal, tissée comme autrefois à Lyon.',
    steps: [{ t: 'go', place: 'Lyon', txt: 'Aller à Lyon', story: '« Les canuts tissaient la soie sur la Croix-Rousse. Je veux voir ça ! »' },
      { t: 'item', ing: 'tissu', n: 2, txt: 'Donner 2 tissus', story: '« Du tissu, beaucoup de tissu ! »' },
      { t: 'cat', cat: 'mode', txt: 'Visiter une boutique de mode', story: '« Allez voir ce qui se porte en ce moment. »' },
      { t: 'craft', n: 2, txt: 'Fabriquer 2 produits au commerce', story: '« Vos mains d’artisan feront le reste. »' }],
    rw: { k: 'cloth', def: ['Cape de soie des canuts', 'v', 'dos', 4, 'cape', '#b45a8c'], coins: 150 } },
  { id: 'broceliande', who: 'hulotte', title: 'Les légendes de Brocéliande', pitch: 'Madame Hulotte a trouvé une vieille carte qui mène en Bretagne.',
    steps: [{ t: 'cat', cat: 'bibliotheque', txt: 'Visiter une bibliothèque', story: '« Cherchons d’abord la légende dans les vieux livres. »' },
      { t: 'go', place: 'Carnac', txt: 'Aller à Carnac', story: '« Les menhirs de Carnac montrent la route, dit le livre. »' },
      { t: 'go', place: 'Brocéliande', txt: 'Entrer dans la forêt de Brocéliande', story: '« La forêt des fées ! Restez sur le sentier… »' },
      { t: 'chest', n: 1, txt: 'Ouvrir un coffre', story: '« La carte parle d’un coffre. N’importe lequel vous apprendra la serrure. »' },
      { t: 'item', ing: 'papier', n: 1, txt: 'Donner 1 papier ancien', story: '« Un papier ancien pour recopier le secret. »' }],
    rw: { k: 'secret', near: [-2.17, 48.02], coins: 250 } },
  { id: 'capitaine', who: 'ondine', title: 'Cap sur la mer', pitch: 'Capitaine Ondine prépare un grand tour des côtes.',
    steps: [{ t: 'cat', cat: 'port', txt: 'Visiter un port', story: '« Tout bon voyage commence au port. »' },
      { t: 'item', ing: 'coquillage', n: 3, txt: 'Donner 3 coquillages', story: '« Des coquillages pour décorer ma cabine. »' },
      { t: 'go', place: 'Mont-Saint-Michel', txt: 'Aller au Mont-Saint-Michel', story: '« La marée y monte au galop. Je veux voir ça ! »' },
      { t: 'go', place: 'Bonifacio', txt: 'Aller à Bonifacio', story: '« Et pour finir, les falaises blanches de Corse. »' }],
    rw: { k: 'cloth', def: ['Casquette de capitaine', 'v', 'tete', 4, 'casquette', '#3e5f8a'], coins: 200 } },
  { id: 'japon', who: 'capucine', title: 'Le carnet du Japon', pitch: 'Capucine a reçu une lettre d’un ami de Kyoto.',
    steps: [{ t: 'go', place: 'Kyoto', txt: 'Aller à Kyoto', story: '« La lettre parle des mille portes rouges de Kyoto. »' },
      { t: 'item', ing: 'lumiere', n: 1, txt: 'Donner 1 lumière', story: '« Une lanterne pour la fête de la lune. »' },
      { t: 'go', place: 'Tokyo', txt: 'Aller à Tokyo', story: '« Mon ami nous attend à Tokyo. »' },
      { t: 'tame', n: 1, txt: 'Accueillir un nouveau compagnon', story: '« Il dit qu’un petit compagnon vous attend… »' }],
    rw: { k: 'egg', sp: 'tanuki', coins: 250 } },
  { id: 'epices', who: 'gaston', title: 'Le marché aux épices', pitch: 'Gaston veut ouvrir un stand d’épices et d’agrumes.',
    steps: [{ t: 'cat', cat: 'marche', txt: 'Visiter un marché', story: '« Voyons d’abord ce qui se vend ici. »' },
      { t: 'go', place: 'Marrakech', txt: 'Aller à Marrakech', story: '« Les meilleures épices viennent des souks. »' },
      { t: 'item', ing: 'agrume', n: 2, txt: 'Donner 2 agrumes', story: '« Des agrumes pour la confiture. »' },
      { t: 'go', place: 'Merzouga', txt: 'Traverser le désert jusqu’à Merzouga', story: '« Et une nuit sous les étoiles du désert ! »' }],
    rw: { k: 'egg', sp: 'fennec', coins: 250 } },
  { id: 'venise', who: 'roussette', title: 'La lettre de Venise', pitch: 'Roussette est invitée au grand bal masqué de Venise.',
    steps: [{ t: 'go', place: 'Venise', txt: 'Aller à Venise', story: '« Les gondoles, les masques… vite ! »' },
      { t: 'item', ing: 'verre', n: 2, txt: 'Donner 2 verres', story: '« Du verre de Murano pour mon masque. »' },
      { t: 'craft', n: 2, txt: 'Fabriquer 2 produits au commerce', story: '« Un cadeau pour mes hôtes, fait par vous. »' },
      { t: 'go', place: 'Rome', txt: 'Finir le voyage à Rome', story: '« Tous les chemins y mènent, non ? »' }],
    rw: { k: 'cloth', def: ['Béret du bal masqué', 'v', 'tete', 4, 'beret', '#7a4fa0'], coins: 200 } },
  { id: 'nord', who: 'pingo', title: 'Le grand nord', pitch: 'Pingo veut voir les aurores boréales avant l’hiver.',
    steps: [{ t: 'go', place: 'Reykjavik', txt: 'Aller à Reykjavik', story: '« L’Islande, la terre de glace et de feu. »' },
      { t: 'item', ing: 'flocon', n: 1, txt: 'Donner 1 flocon éternel', story: '« Un flocon qui ne fond jamais, pour ma collection. »' },
      { t: 'chest', n: 1, txt: 'Ouvrir un coffre', story: '« On dit que les Vikings cachaient leurs trésors. »' },
      { t: 'go', place: 'Rovaniemi', txt: 'Aller à Rovaniemi', story: '« Le ciel y danse en vert et violet. »' }],
    rw: { k: 'cloth', def: ['Écharpe aurore boréale', 'v', 'cou', 4, 'echarpe', '#5fd0b0'], coins: 300 } },
];
const QT_BY = {}; QT_STORIES.forEach(q => { QT_BY[q.id] = q; });
// les histoires se débloquent progressivement : 2 au départ, une de plus par histoire terminée
const qtDoneN = () => QT_STORIES.filter(q => (qtState().st[q.id] || {}).done).length;
const qtOpen = q => QT_STORIES.indexOf(q) < 2 + qtDoneN();
const qtNComps = () => Object.keys(S.comps || {}).length;
function qtBase(st) {
  const L = qtState().log;
  return st.t === 'craft' ? L.made : st.t === 'chest' ? L.chests : st.t === 'tame' ? qtNComps() : 0;
}
// avancement d'une étape : { done, cur, n }
function qtStepProg(st, rec) {
  const L = qtState().log, n = st.n || 1;
  if (st.t === 'item') { const h = qtCount(qtIngMatch(st.ing)); return { done: false, cur: Math.min(h, n), n, give: h >= n }; }
  if (st.t === 'craft') { const c = L.made - (rec.b || 0); return { done: c >= n, cur: Math.min(c, n), n }; }
  if (st.t === 'chest') { const c = L.chests - (rec.b || 0); return { done: c >= n, cur: Math.min(c, n), n }; }
  if (st.t === 'tame') { const c = qtNComps() - (rec.b || 0); return { done: c >= n, cur: Math.min(Math.max(0, c), n), n }; }
  return { done: !!rec.hit, cur: rec.hit ? 1 : 0, n: 1 };
}
function qtStepGo(st) {
  if (st.t === 'go') return { t: 'place', name: st.place };
  if (st.t === 'cat') return { t: 'visit', cat: [st.cat] };
  if (st.t === 'region') return { region: st.r };
  if (st.t === 'item') { const c = qtCall(() => bqCatFor(st.ing), null); return c ? { t: 'visit', cat: [c] } : null; }
  return null;
}
function qtAdvance(q, rec) {
  rec.i++; rec.hit = 0;
  if (rec.i >= q.steps.length) {
    rec.done = 1; if (qtState().follow === q.id) qtState().follow = '';
    const t = qtGrant(q.rw, qtCli(q.who).name);
    setTimeout(() => { toast(`Histoire terminée : « ${q.title} » ! Récompense : ${t}.`); try { confetti(true); } catch (e) {} }, 400);
  } else rec.b = qtBase(q.steps[rec.i]);
  save(); qtRefreshAll();
}
function qtStart(id) {
  const q = QT_BY[id], s = qtState(); if (!q || !qtOpen(q)) return;
  if (!s.st[id]) s.st[id] = { i: 0, b: qtBase(q.steps[0]), hit: 0 };
  if (s.st[id].done) return;
  s.follow = id; save(); qtRefreshAll();
}
function qtGive(id) {
  const q = QT_BY[id], rec = q && qtState().st[id]; if (!rec || rec.done) return;
  const st = q.steps[rec.i]; if (st.t !== 'item') return;
  const worn = qtWorn(), m = qtIngMatch(st.ing);
  const take = S.inv.filter(it => it && m(it) && !worn.has(it.id) && !it.tresor).sort((a, b) => (a.rarity || 0) - (b.rarity || 0)).slice(0, st.n || 1);
  if (take.length < (st.n || 1)) { toast('Il vous en manque encore.'); return; }
  take.forEach(it => S.inv.splice(S.inv.indexOf(it), 1));
  toast(`${qtCli(q.who).name} : « Merci ! »`);
  qtAdvance(q, rec);
}
// vérification régulière (fabrication, coffres, nouveaux compagnons)
function qtCheckStories() {
  const s = qtState();
  for (const q of QT_STORIES) {
    const rec = s.st[q.id]; if (!rec || rec.done) continue;
    const st = q.steps[rec.i]; if (!st || st.t === 'item') continue;
    if (qtStepProg(st, rec).done) qtAdvance(q, rec);
  }
}

// ---------------- les défis ----------------
const qtCont = (lon, lat) => lat < -10 && lon > 110 ? 'oc' : lon < -30 ? (lat > 12 ? 'na' : 'sa') : lon < 52 && lat < 36 ? 'af' : lon < 40 ? 'eu' : 'as';
const QT_CONT = { eu: 'Europe', af: 'Afrique', as: 'Asie', na: 'Amérique du Nord', sa: 'Amérique du Sud', oc: 'Océanie' };
const qtWeekRegs = () => new Set(qtState().log.reg.filter(r => Date.now() - r[0] < 7 * 864e5).map(r => r[1])).size;
const qtShopRecs = () => qtCall(() => (CM_LINES[cmT().id] || []).filter(R => !R.x && !R.egg), []);
const qtSpecies = () => new Set(Object.keys(S.comps || {}).map(k => qtCall(() => spOf(k), k))).size;
const qtNatureN = () => new Set(S.inv.filter(it => it && qtCall(() => famOf(it), '') === 'nature').map(it => it.name)).size;
const QT_DEFIS = [
  { id: 'leg3', title: 'Trois continents légendaires', txt: 'Rapporter un objet légendaire de 3 continents différents', n: 3, cur: () => Object.keys(qtState().log.cont).length, rw: { k: 'egg', sp: 'lemur', coins: 1500 } },
  { id: 'reg5', title: 'Le tour express', txt: 'Visiter 5 régions différentes en 7 jours', n: 5, cur: qtWeekRegs, rw: { k: 'cloth', def: ['Cape du grand tour', 'v', 'dos', 4, 'cape', '#2f7f6c'], coins: 1200 } },
  { id: 'star3', title: 'Maître artisan', txt: 'Fabriquer un produit 3 étoiles de chaque recette de base de votre commerce', n: () => Math.max(1, qtShopRecs().length), cur: () => qtShopRecs().filter(R => qtState().log.m3[R.id]).length, rw: { k: 'rec', coins: 1500 } },
  { id: 'relic', title: 'Relique complète', txt: 'Assembler les 3 fragments d’une relique à l’atelier', n: 1, cur: () => qtCall(() => Object.keys(famState().relics).length, 0), rw: { k: 'secret', coins: 1200 } },
  { id: 'far3', title: 'Au bout du monde', txt: 'Faire 3 voyages à plus de 5 000 km de chez vous', n: 3, cur: () => qtState().log.far, rw: { k: 'coins', coins: 2000 } },
  { id: 'chest5', title: 'Chasseur de coffres', txt: 'Ouvrir 5 coffres avec la bonne clé', n: 5, cur: () => qtState().log.chests, rw: { k: 'egg', sp: 'quokka', coins: 1000 } },
  { id: 'sp6', title: 'Grande famille', txt: 'Avoir des compagnons de 6 espèces différentes', n: 6, cur: qtSpecies, rw: { k: 'cloth', def: ['Couronne de fleurs du refuge', 'v', 'tete', 4, 'fleurs', '#f08aa6'], coins: 1500 } },
  { id: 'nat12', title: 'Cabinet de curiosités', txt: 'Posséder 12 objets Nature différents (insectes, coquillages…)', n: 12, cur: qtNatureN, rw: { k: 'coins', coins: 1500 } },
];
const qtDN = d => (typeof d.n === 'function' ? d.n() : d.n);
function qtClaimDefi(id) {
  const d = QT_DEFIS.find(x => x.id === id), s = qtState(); if (!d || s.df[id]) return;
  if (qtCall(d.cur, 0) < qtDN(d)) return;
  s.df[id] = 1; const t = qtGrant(d.rw, d.title);
  toast(`Défi réussi : « ${d.title} » ! ${t}.`); try { confetti(true); } catch (e) {}
  qtRefreshAll();
}

// ---------------- objectif du jour ----------------
function qtDay() {
  const s = qtState(), dk = dayKey(), h = qtHome();
  if (s.day && s.day.v === 2 && s.day.d === dk && s.day.h === S.home && !s.day.list.some(o => o.step && o.step.fn)) return s.day;
  const r = qtRnd('qtday' + dk + S.home), pick = a => a[Math.floor(r() * a.length)], list = [];
  try { // 1. proche : un objet d'un type de lieu du quotidien
    const cats = (typeof BQ_NEAR_CATS !== 'undefined' ? BQ_NEAR_CATS : ['marche', 'parc', 'boulangerie']).filter(c => POI_CATS[c] && LOOT[c] && c !== 'rue' && c !== 'route');
    for (let n = 0; n < 20 && list.length < 1; n++) {
      const c = pick(cats), defs = LOOT[c].filter(d => d[1] !== 't' && d[3] >= 1 && d[3] <= 2);
      if (defs.length) { const d = pick(defs); list.push({ z: 'near', name: d[0], def: d.slice(0, 6), step: { t: 'visit', cat: [c] }, where: `Près de chez vous : ${POI_CATS[c][0].toLowerCase()}`, pay: 120 + d[3] * 40 }); }
    }
  } catch (e) {}
  const R0 = qtHomeReg();
  try { // 2. région : une spécialité de la région de la maison
    if (R0 && R0.res && R0.res.length) { const x = pick(R0.res.filter(x => (x.rar || 0) <= 2)) || R0.res[0]; let st = qtCall(() => btStepFor(x.name), null); const W = typeof RG_RES_WHERE !== 'undefined' ? RG_RES_WHERE[x.id] : null;
      if (!st || st.fn) st = W && W.z && RG_ZONES[W.z[0]] ? { zone: W.z[0] } : { t: 'visit', cat: (W && W.c || ['marche']).filter(c => POI_CATS[c]) };
      list.push({ z: 'reg', name: x.name, rid: x.id, step: st, where: `Votre région (${R0.short}) : ${qtCall(() => rgResWhere(x), 'marchés et fermes')}`, pay: 220 + (x.rar || 0) * 40 }); }
  } catch (e) {}
  try { // 3. lointain : une spécialité d'une région à plus de 800 km
    const far = REGIONS.filter(R => R.id !== (R0 && R0.id) && R.anchor && R.res && R.res.length && kmBetween(h, { lon: R.anchor[0], lat: R.anchor[1] }) > 800);
    const R = pick(far.length ? far : REGIONS.filter(R => R.res && R.res.length)), x = pick(R.res.filter(x => (x.rar || 0) >= 1 && (x.rar || 0) <= 3 && x.cat !== 'n')) || pick(R.res.filter(x => (x.rar || 0) >= 1)) || R.res[0];
    list.push({ z: 'far', name: x.name, rid: x.id, step: { region: R.id }, where: `${R.name} (${Math.round(kmBetween(h, { lon: R.anchor[0], lat: R.anchor[1] })).toLocaleString('fr-FR')} km)`, pay: 400, egg: 1 });
  } catch (e) {}
  s.day = { v: 2, d: dk, h: S.home, list }; save();
  return s.day;
}
const QT_Z = { near: 'Tout près', reg: 'Dans la région', far: 'Grand voyage' };
function qtDayIt(o) { if (o.rid && typeof RG_RES !== 'undefined' && RG_RES[o.rid]) return qtResIt(RG_RES[o.rid]); return o.def ? bqItemOf(o.def) : { name: o.name, cat: 'm', sub: 'pierre', rarity: 1 }; }
const qtDayMatch = o => it => !!(it && !it.mk && (o.rid ? it.rid === o.rid || it.name === o.name : it.name === o.name));
function qtDayGive(i) {
  const D = qtDay(), o = D.list[i]; if (!o || o.done) return;
  const worn = qtWorn(), it = S.inv.find(x => qtDayMatch(o)(x) && !worn.has(x.id)); if (!it) { toast('Vous ne l’avez pas encore.'); return; }
  S.inv.splice(S.inv.indexOf(it), 1); o.done = 1; gainCoins(o.pay);
  if (o.egg) { try { addEgg({ sp: null, rarity: 2, from: { how: 'quete', place: 'Objectif du jour' }, hatchMs: 3 * 60e3 }); } catch (e) {} }
  toast(`Objectif du jour rempli : +${o.pay} pièces${o.egg ? ' et un œuf !' : ''}`);
  save(); qtRefreshAll();
}
const qtDot = () => { const D = qtDay(); return qtState().seen !== D.d && D.list.some(o => !o.done); };

// ---------------- tous les besoins du joueur ----------------
// besoin : { id, src, ico, it, name, why, gain, step, have, n, match }
const QT_SRC = { quete: ['Quête suivie', 0], jour: ['Objectif du jour', 1], commande: ['Commande', 2], reve: ['Rêve', 3], recette: ['Recette du commerce', 4], cle: ['Coffre', 5] };
let qtNeedC = { t: 0, v: [] };
function qtNeeds(force) {
  if (!force && Date.now() - qtNeedC.t < 1500) return qtNeedC.v;
  const out = [], add = o => { if (o && o.step) out.push(o); };
  // quête suivie : étape en cours
  try {
    const s = qtState(), q = QT_BY[s.follow], rec = q && s.st[q.id];
    if (q && rec && !rec.done) {
      const st = q.steps[rec.i], go = qtStepGo(st), pr = qtStepProg(st, rec);
      if (go && !(st.t === 'item' && pr.give)) add({ id: 'qs:' + q.id, src: 'quete', it: st.t === 'item' ? qtIngIt(st.ing) : null, ico: st.t === 'item' ? '' : QT_FLAG, name: st.t === 'item' ? ING[st.ing][1] : st.txt, why: q.title, gain: 'Étape de quête', step: go, have: pr.cur, n: pr.n, match: st.t === 'item' ? qtIngMatch(st.ing) : null });
    }
  } catch (e) {}
  // objectif du jour
  try { qtDay().list.forEach((o, i) => { if (o.done) return; const m = qtDayMatch(o), h = qtCount(m); if (h >= 1) return; add({ id: 'day:' + i, src: 'jour', it: qtDayIt(o), name: o.name, why: `Objectif du jour (${QT_Z[o.z].toLowerCase()})`, gain: `+${o.pay} pièces${o.egg ? ' + œuf' : ''}`, step: o.step, have: 0, n: 1, match: m }); }); } catch (e) {}
  // commandes du comptoir (acceptées)
  try {
    for (const o of bqState().orders) {
      if (o.pend) continue;
      const al = bqAllocate(o), c = BQC(o.client);
      o.req.forEach((r, j) => {
        if (al[j].have >= r.n || ['egg', 'comp', 'craft', 'bait', 'mk'].includes(r.k)) return;
        add({ id: 'ord:' + o.id + ':' + j, src: 'commande', ico: bqReqIcon(r), it: r.k === 'ing' ? qtIngIt(r.key) : r.k === 'reg' && RG_RES[r.rid] ? qtResIt(RG_RES[r.rid]) : r.def ? bqItemOf(r.def) : null, name: bqReqLabel(r), why: `Commande ${o.tier && CM_TIER[o.tier] ? CM_TIER[o.tier][0] : ''} de ${c ? c.name : 'un client'}`, gain: `+${o.coins} pièces${o.rw && o.rw.k !== 'coins' ? ' + cadeau' : ''}`, step: bqStepFor(r), have: al[j].have, n: r.n, match: it => bqMatch(r, it) });
      });
    }
  } catch (e) {}
  // rêves de l'équipe
  try {
    for (const k of teamIds()) {
      const d = curDream(k), i = d ? nextStepIdx(k) : -1; if (!d || i < 0) continue;
      const st = d.steps[i];
      if (st.t === 'item') add({ id: 'rv:' + k, src: 'reve', it: sampleItem(st), name: st.short || st.txt, why: `Rêve de ${CHARS[k].name}`, gain: 'Rêve réalisé', step: srcStep(st), have: 0, n: st.n || 1, match: it => itemMatches(st, it) });
      else if (st.t === 'visit' || st.t === 'place') add({ id: 'rv:' + k, src: 'reve', ico: stepIcon(st), name: st.short || st.txt, why: `Rêve de ${CHARS[k].name}`, gain: 'Rêve réalisé', step: st, have: 0, n: 1, match: null });
    }
  } catch (e) {}
  // recettes du commerce : ingrédients qui manquent (les recettes les plus proches d'être prêtes d'abord)
  try {
    const T = cmT();
    if (T) {
      const recs = (CM_LINES[T.id] || []).filter(R => !R.egg && cmUnlocked(R)).map(R => ({ R, miss: R.ing.filter(([k, n]) => cmHave(k) < n) })).filter(x => x.miss.length).sort((a, b) => a.miss.length - b.miss.length);
      const seen = new Set();
      for (const { R, miss } of recs) for (const [k, n] of miss) {
        if (seen.has(k) || seen.size >= 4) continue; seen.add(k);
        let step = null;
        if (k === 'far') { const R0 = qtHomeReg(), h = qtHome(); const F = REGIONS.filter(x => x.g === 0 && x.id !== (R0 && R0.id) && x.anchor).sort((a, b) => kmBetween(h, { lon: a.anchor[0], lat: a.anchor[1] }) - kmBetween(h, { lon: b.anchor[0], lat: b.anchor[1] }))[0]; if (F) step = { region: F.id }; }
        else { const c = bqCatFor(k, T.cats); if (c) step = { t: 'visit', cat: [c] }; }
        add({ id: 'ing:' + k, src: 'recette', it: k === 'far' ? null : qtIngIt(k), ico: k === 'far' ? cmIngIcon('far') : '', name: cmIngName(k), why: R.def[0], gain: `+${cmPrice(R, 1)} pièces`, step, have: cmHave(k), n, match: k === 'far' ? (it => cmIsFar(it)) : qtIngMatch(k) });
      }
    }
  } catch (e) {}
  // coffres sans leur clé
  try {
    const locks = new Set();
    for (const it of S.inv) { const l = it && famIsChest(it); if (l && !locks.has(l) && !S.inv.some(x => famIsKey(x) === l)) { locks.add(l); const kn = famKeyName(l); add({ id: 'key:' + l, src: 'cle', it: { name: kn, cat: 'd', sub: 'cle', rarity: 2 }, name: kn, why: `Ouvrir : ${it.name}`, gain: 'Trésor du coffre', step: btStepFor(kn), have: 0, n: 1, match: x => famIsKey(x) === l }); } }
  } catch (e) {}
  out.sort((a, b) => QT_SRC[a.src][1] - QT_SRC[b.src][1]);
  qtNeedC = { t: Date.now(), v: out };
  return out;
}
const qtNeedIco = n => n.ico || (n.it ? qtIco(n.it) : QT_FLAG);
const qtNeedCol = n => { const F = n.it ? qtFam(n.it) : null; return F ? F.couleur : '#d9604f'; };

// ---------------- où l'obtenir : le lieu le plus proche ----------------
const qtLocC = new Map();
function qtLoc(step) {
  if (!step || step.fn) return null;
  const key = JSON.stringify(step) + '|' + S.home, c = qtLocC.get(key);
  if (c && (c.v || Date.now() - c.t < 8000) && Date.now() - c.t < 60000) return c.v;
  let v = null;
  try {
    if (step.t === 'place') { const P = PLACES.find(x => x.name === step.name); if (P) v = { lon: P.lon, lat: P.lat, place: P, label: P.name }; }
    else if (step.zone && RG_ZONES[step.zone]) { const Z = RG_ZONES[step.zone], [lon, lat] = Z.pts.split(' ')[0].split(',').map(Number); v = { lon, lat, zone: Z, label: Z.n }; }
    else if (step.region && RG[step.region]) { const R = RG[step.region]; v = { lon: R.anchor[0], lat: R.anchor[1], region: R.id, label: R.short || R.name }; }
    else if (step.t === 'visit') {
      const p = nearestPOI(poiTest(step));
      if (p) v = { lon: p.lon, lat: p.lat, poi: p, label: p.name };
      else if (step.tag) { const P = nearestPlaceWith(x => x.tags.includes(step.tag)); if (P) v = { lon: P.lon, lat: P.lat, place: P, label: P.name }; }
    }
  } catch (e) {}
  if (qtLocC.size > 200) qtLocC.clear();
  qtLocC.set(key, { t: Date.now(), v });
  return v;
}
function qtGo(n) {
  if (!n) return;
  const m = $('modal'); if (m) m.hidden = true;
  if (!qtCall(() => btFreeComp(), true)) return;
  if (tab !== 'carte') closeSheet();
  const L = qtLoc(n.step), why = `${n.name} → ${n.why}`;
  try {
    if (L && L.poi) return void goDreamPOI(L.poi, `${why} : ${L.label} (${fmtDist(qtKm(L))}). Choisissez la durée, puis partez !`);
    if (L && L.place) return void goDreamPlace(L.place, `${why} : cap sur ${L.place.name} ! Choisissez la durée, puis partez.`);
    if (L && L.region) return void regionGo(L.region);
    if (L && L.zone) return void btGoZone(L.zone);
    btRun(n.step);
  } catch (e) { console.error('quêtes', e); openSheet('voyage'); }
}

// ---------------- épingles « besoin » sur la carte ----------------
let qtPins = [], qtPinSig = '', qtOpenPin = '';
function qtGroups() {
  const G = new Map();
  for (const n of qtNeeds()) {
    const L = qtLoc(n.step); if (!L) continue;
    const k = L.lon.toFixed(3) + ',' + L.lat.toFixed(3);
    if (!G.has(k)) G.set(k, { k, L, list: [] });
    G.get(k).list.push(n);
  }
  return [...G.values()].slice(0, 8);
}
// clés des lieux du quotidien déjà marqués d'une épingle (07_poi.js ne les redessine pas dessous)
function qtPinKeys() { const s = new Set(); for (const g of qtPins) if (g.L.poi) s.add(poiKey(g.L.poi)); return s; }
// types de lieux utiles pour les besoins (priorité haute dans la couche des lieux)
function qtNeedCats() { const c = []; for (const n of qtNeeds()) if (n.step && n.step.t === 'visit' && n.step.cat) c.push(...[].concat(n.step.cat)); return c; }
function qtLine(n) { return `<span class="qt-ln"><b>${esc(n.name)}</b> → ${esc(n.why)}${n.gain ? ` <em>(${esc(n.gain)})</em>` : ''}</span>`; }
function qtMapUpdate() {
  if (typeof map === 'undefined' || !map || typeof ovEls === 'undefined' || !$('ov')) return;
  const on = tab === 'carte' && !document.body.classList.contains('firstrun') && map.getZoom() >= QT_PIN_ZOOM;
  const gs = on ? qtGroups().filter(g => qtKm(g.L) < 60).slice(0, 5) : [];
  const sig = gs.map(g => g.k + ':' + g.list.map(n => n.id + n.gain).join('+')).join(';') + '|' + qtOpenPin;
  const ov = $('ov'), alive = gs.every((g, i) => ovEls['qn' + i] && ovEls['qn' + i].el.isConnected);
  qtPins = gs;
  if (sig !== qtPinSig || !alive) {
    qtPinSig = sig;
    for (const k of Object.keys(ovEls)) if (k.startsWith('qn')) { ovEls[k].el.remove(); delete ovEls[k]; }
    gs.forEach((g, i) => {
      const n = g.list[0], el = document.createElement('div'); el.className = 'ovm qtpin' + (qtOpenPin === g.k ? ' open' : ''); el.dataset.need = g.k;
      el.innerHTML = `<div class="qtb" style="--fc:${qtNeedCol(n)}"><span class="qti">${qtNeedIco(n)}</span><i class="qtf"></i>${g.list.length > 1 ? `<b class="qtn">${g.list.length}</b>` : ''}</div>
        <div class="qtlab">${g.list.slice(0, 3).map(qtLine).join('')}<span class="qt-where">${esc(g.L.label)} · ${fmtDist(qtKm(g.L))}</span><button class="btn green sm" data-qtgo="1">Partir</button></div>`;
      ov.appendChild(el); ovEls['qn' + i] = { el, lon: g.L.lon, lat: g.L.lat };
    });
  }
  qtEdgeUpd();
}
function qtPinTap(el, ev) {
  const g = qtPins.find(x => x.k === el.dataset.need); if (!g) return;
  if (ev && ev.target.closest('[data-qtgo]')) { qtOpenPin = ''; qtGo(g.list[0]); qtMapUpdate(); return; }
  qtOpenPin = qtOpenPin === g.k ? '' : g.k; qtMapUpdate(); if (typeof positionOverlay === 'function') positionOverlay();
  // l'étiquette reste entière à l'écran
  const pin = document.querySelector('.qtpin.open'), lab = pin && pin.querySelector('.qtlab'), ov = $('ov');
  if (lab && ov) { const r = lab.getBoundingClientRect(), o = ov.getBoundingClientRect(); let dx = 0; if (r.left < o.left + 8) dx = o.left + 8 - r.left; else if (r.right > o.right - 8) dx = o.right - 8 - r.right; lab.style.marginLeft = dx.toFixed(0) + 'px'; }
}
// flèches au bord de l'écran vers les besoins hors de vue (3 au plus)
const QT_PIN_ZOOM = 13.5; // v21b : épingles visibles seulement quand on zoome
let qtEdgeRaf = 0;
function qtEdgeUpd() {
  { const b = $('qtEdge'); if (b) b.remove(); return; } // v21b : flèches de bord retirées (surcharge)
  if (qtEdgeRaf) return;
  qtEdgeRaf = requestAnimationFrame(() => {
    qtEdgeRaf = 0;
    const ov = $('ov'); if (!ov || !map) return;
    let box = $('qtEdge'); if (!box) { box = document.createElement('div'); box.id = 'qtEdge'; }
    if (box.parentNode !== ov) ov.appendChild(box);
    const W = ov.clientWidth, H = ov.clientHeight, cx = W / 2, cy = H / 2, x0 = 104, x1 = W - 76, y0 = 120, y1 = H - 190;
    let h = '', n = 0;
    for (const g of qtPins) {
      if (n >= 3) break;
      let p; try { p = map.project([g.L.lon, g.L.lat]); } catch (e) { continue; }
      if (p.x > 0 && p.y > 0 && p.x < W && p.y < H) continue;
      const dx = p.x - cx, dy = p.y - cy, s = Math.min(Math.abs((dx > 0 ? x1 - cx : x0 - cx) / (dx || 1e-6)), Math.abs((dy > 0 ? y1 - cy : y0 - cy) / (dy || 1e-6)));
      const x = cx + dx * s, y = cy + dy * s, a = Math.atan2(dy, dx) * 180 / Math.PI, nd = g.list[0];
      h += `<button class="qtedge" data-qtedge="${esc(g.k)}" style="transform:translate(${x.toFixed(0)}px,${y.toFixed(0)}px);--fc:${qtNeedCol(nd)}" aria-label="${esc(nd.name)} : ${esc(g.L.label)}"><span class="qti">${qtNeedIco(nd)}</span><i class="qtar" style="transform:rotate(${a.toFixed(0)}deg)"><svg viewBox="0 0 24 24"><path d="M14 5 L22 12 L14 19Z" fill="#4a3528"/></svg></i><small>${fmtDist(qtKm(g.L))}</small></button>`;
      n++;
    }
    if (box.dataset.h !== h) { box.innerHTML = h; box.dataset.h = h; }
    box.hidden = !(tab === 'carte' && !document.body.classList.contains('firstrun') && !document.body.classList.contains('sheet-open'));
  });
}

// ---------------- « Ma liste » ----------------
function qtListHTML() {
  const D = qtDay(), needs = qtNeeds(true);
  const day = D.list.map((o, i) => {
    const it = qtDayIt(o), h = qtCount(qtDayMatch(o)), F = qtFam(it);
    return `<div class="qt-day${o.done ? ' done' : ''}"><span class="qt-z z-${o.z}">${QT_Z[o.z]}</span><span class="qt-di" style="--fc:${F ? F.couleur : '#d9604f'}">${qtIco(it)}<i class="qtf"></i></span><b>${esc(o.name)}</b><small>${esc(o.where)}</small><span class="qt-pay">${coins(o.pay)}${o.egg ? ' + œuf' : ''}</span>
      ${o.done ? '<span class="qt-ok">Rempli ✔</span>' : h ? `<button class="btn green sm" data-qtday="${i}">Livrer</button>` : `<button class="btn gold sm" data-qtneed="day:${i}">Y aller</button>`}</div>`;
  }).join('');
  // v21b : des onglets au lieu d'une longue liste à faire défiler
  const tabs = [['jour', 'Objectif', D.list.filter(o => !o.done).length], ...QT_LTABS.map(([k, lab, srcs]) => [k, lab, needs.filter(n => srcs.includes(n.src)).length])];
  if (!tabs.some(t => t[0] === qtLTab)) qtLTab = 'jour';
  const cur = QT_LTABS.find(t => t[0] === qtLTab), list = cur ? needs.filter(n => cur[2].includes(n.src)) : [];
  const rows = list.map(n => {
    const L = qtLoc(n.step), F = n.it ? qtFam(n.it) : null;
    return `<div class="qt-need"><span class="qt-di" style="--fc:${qtNeedCol(n)}">${qtNeedIco(n)}<i class="qtf"></i></span><div class="qt-nx"><b>${esc(n.name)}${n.n > 1 || n.have ? ` <small>${Math.min(n.have, n.n)}/${n.n}</small>` : ''}</b><span>Pour : ${esc(n.why)} · <em>${esc(n.gain)}</em></span><span class="qt-w">${F ? `<i style="--fc:${F.couleur}">${F.icone} ${esc(F.nom)}</i> ` : ''}${L ? `${esc(L.label)} · ${fmtDist(qtKm(L))}` : 'Voir où le trouver'}</span></div><button class="btn gold sm" data-qtneed="${esc(n.id)}">Y aller</button></div>`;
  }).join('');
  const bar = `<div class="qt-ltabs">${tabs.map(([k, lab, n]) => `<button class="qt-ltab${k === qtLTab ? ' on' : ''}" data-qtltab="${k}">${lab}${n ? `<b>${n}</b>` : ''}</button>`).join('')}</div>`;
  const body = qtLTab === 'jour'
    ? `<p class="qt-sub">3 objets recherchés aujourd’hui, très bien payés.</p><div class="qt-days">${day || '<p class="empty">Rien aujourd’hui.</p>'}</div>`
    : (rows || `<p class="empty">${QT_LEMPTY[qtLTab]}</p>`);
  return `<div class="qt-page qt-list"><h2>Ma liste</h2>${bar}${body}
    <div class="qt-acts"><button class="btn cream" data-qtpage="1">${QT_SCROLL} Quêtes</button><button class="btn green" data-closemodal="1">Fermer</button></div></div>`;
}
let qtLTab = 'jour';
const QT_LTABS = [['commande', 'Commandes', ['commande']], ['reve', 'Rêves', ['reve']], ['recette', 'Recettes', ['recette']], ['quete', 'Quêtes', ['quete', 'cle']]];
const QT_LEMPTY = { commande: 'Aucune commande en cours : acceptez-en une au comptoir.', reve: 'Aucun rêve en cours.', recette: 'Rien ne manque pour vos recettes.', quete: 'Suivez une quête pour voir ici sa prochaine étape.' };
function qtOpenList() { const s = qtState(); s.seen = qtDay().d; save(); showModal(qtListHTML()); qtBtns(); const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0; }

// ---------------- page Quêtes ----------------
function qtStoryHTML(q, big) {
  const s = qtState(), rec = s.st[q.id], open = qtOpen(q), c = qtCli(q.who);
  if (!open) return `<div class="qt-story locked"><span class="qt-face qt-face0">?</span><div><b>${esc(q.title)}</b><small>Terminez une autre histoire pour la débloquer.</small></div></div>`;
  if (!big) {
    const st = rec ? (rec.done ? 'Terminée ✔' : `Étape ${rec.i + 1}/${q.steps.length}`) : `${q.steps.length} étapes`;
    return `<div class="qt-story${rec && rec.done ? ' done' : ''}">${qtFace(q.who)}<div><b>${esc(q.title)}</b><small>${esc(c.name)} · ${st}</small><span class="qt-rw"><i>${qtRwIco(q.rw)}</i>${esc(qtRwTxt(q.rw))}</span></div>${rec && rec.done ? '' : `<button class="btn cream sm" data-qtfollow="${q.id}">Suivre</button>`}</div>`;
  }
  const steps = q.steps.map((st, i) => {
    const done = rec && (rec.done || i < rec.i), cur = rec && !rec.done && i === rec.i, pr = cur ? qtStepProg(st, rec) : null;
    let act = '';
    if (cur) {
      if (st.t === 'item') act = pr.give ? `<button class="btn green sm" data-qtgive="${q.id}">Donner</button>` : `<button class="btn gold sm" data-qtneed="qs:${q.id}">Y aller</button>`;
      else if (st.t === 'craft') act = `<button class="btn gold sm" data-qtshop="1">Commerce</button>`;
      else if (st.t === 'chest') act = `<button class="btn gold sm" data-qtsac="1">Mon sac</button>`;
      else if (st.t === 'tame') act = `<button class="btn gold sm" data-qtnur="1">Nurserie</button>`;
      else act = `<button class="btn gold sm" data-qtneed="qs:${q.id}">Y aller</button>`;
    }
    return `<li class="${done ? 'done' : cur ? 'cur' : ''}"><i class="qt-ck">${done ? '✔' : i + 1}</i><div><b>${esc(st.txt)}${pr && pr.n > 1 ? ` <small>${pr.cur}/${pr.n}</small>` : ''}</b>${cur || done ? `<span>${esc(st.story)}</span>` : ''}</div>${act}</li>`;
  }).join('');
  return `<div class="qt-big"><div class="qt-bh">${qtFace(q.who)}<div><span class="bqc-kick">Quête suivie</span><h3>${esc(q.title)}</h3><small>${esc(c.name)} : ${esc(q.pitch)}</small></div></div>
    <ol class="qt-steps">${steps}</ol><div class="qt-rwb"><span>${qtRwIco(q.rw)}</span><div><small>Récompense unique</small><b>${esc(qtRwTxt(q.rw))}</b></div></div></div>`;
}
function qtDefiHTML(d) {
  const n = qtDN(d), cur = Math.min(n, qtCall(d.cur, 0)), got = qtState().df[d.id];
  return `<div class="qt-defi${got ? ' done' : ''}"><span class="qt-dt">${QT_TROPHY}</span><div><b>${esc(d.title)}</b><small>${esc(d.txt)}</small><span class="qt-bar"><i style="width:${(cur / n * 100).toFixed(0)}%"></i></span><span class="qt-rw"><i>${qtRwIco(d.rw)}</i>${esc(qtRwTxt(d.rw))}</span></div>${got ? '<span class="qt-ok">✔</span>' : cur >= n ? `<button class="btn green sm" data-qtdefi="${d.id}">Récupérer</button>` : `<span class="qt-cnt">${cur}/${n}</span>`}</div>`;
}
function qtPageHTML() {
  const s = qtState(), f = QT_BY[s.follow];
  return `<div class="qt-page"><h2>Quêtes</h2>
    ${f ? qtStoryHTML(f, true) : '<p class="qt-hint">Choisissez une histoire et touchez « Suivre » : son étape s’affichera sur la carte.</p>'}
    <h3 class="qt-h3">Histoires <small>${qtDoneN()}/${QT_STORIES.length} terminées</small></h3><div class="qt-stories">${QT_STORIES.filter(q => q !== f).map(q => qtStoryHTML(q)).join('')}</div>
    <h3 class="qt-h3">Défis <small>difficiles, grosses récompenses</small></h3><div class="qt-defis">${QT_DEFIS.map(qtDefiHTML).join('')}</div>
    <div class="qt-acts"><button class="btn cream" data-qtlist="1">${QT_LIST} Ma liste</button><button class="btn green" data-closemodal="1">Fermer</button></div></div>`;
}
let qtPageOn = false;
function qtOpenPage() { qtPageOn = true; showModal(qtPageHTML()); const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0; }
function qtRefreshAll() {
  qtNeedC.t = 0;
  const m = $('modal');
  if (m && !m.hidden) { if (m.querySelector('.qt-page h2') && qtPageOn && m.querySelector('.qt-stories')) { const mb = m.querySelector('.mbox'), y = mb.scrollTop; showModal(qtPageHTML()); mb.scrollTop = y; } else if (m.querySelector('.qt-list')) { const mb = m.querySelector('.mbox'), y = mb.scrollTop; showModal(qtListHTML()); mb.scrollTop = y; } }
  try { renderTripCard(); } catch (e) {}
  qtMapUpdate(); qtBtns();
  try { if (typeof poiStateCheck === 'function') poiStateCheck(); } catch (e) {}
}

// ---------------- boutons de la carte ----------------
function qtBtns() {
  let b = $('qtBtns');
  if (!b) {
    const z = document.querySelector('.zoom'); if (!z) return;
    b = document.createElement('div'); b.id = 'qtBtns';
    b.innerHTML = `<button class="qt-mb" data-qtlist="1" aria-label="Ma liste">${QT_LIST}<span>Ma liste</span><i class="qt-dot" hidden></i></button><button class="qt-mb" data-qtpage="1" aria-label="Quêtes">${QT_SCROLL}<span>Quêtes</span></button>`;
    z.parentNode.insertBefore(b, z);
  }
  const d = b.querySelector('.qt-dot'); if (d) d.hidden = !qtCall(qtDot, false);
}

// ---------------- branchements ----------------
// carte d'action : l'étape en cours de la quête suivie
if (typeof renderTripCard === 'function') renderTripCard = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const box = $('tripCard'), s = qtState(), q = QT_BY[s.follow], rec = q && s.st[q.id];
    if (box && !box.hidden && q && rec && !rec.done && tab === 'carte') {
      const st = q.steps[rec.i];
      box.classList.add('qt-on');
      box.insertAdjacentHTML('beforeend', `<div class="qt-tc"><span class="qt-tci">${QT_SCROLL}</span><span class="qt-tcx"><b>${esc(q.title)} · ${rec.i + 1}/${q.steps.length}</b>${esc(st.txt)}</span><button class="btn cream sm" data-qtpage="1">Voir</button></div>`);
    } else if (box) box.classList.remove('qt-on');
  } catch (e) {}
  return r;
})(renderTripCard);
// fabrication au commerce (étapes « fabriquer » et défi « Maître artisan »)
if (typeof cmFinish === 'function') cmFinish = (orig => function (i) {
  const x = qtCall(() => cmState().sl[i], null), it = orig.apply(this, arguments);
  try { if (it && it.mk) { const L = qtState().log; L.made++; if (it.mk.st >= 3) L.m3[it.mk.rid] = 1; save(); setTimeout(qtCheckStories, 50); } } catch (e) {}
  void x; return it;
})(cmFinish);
if (typeof famOpenChest === 'function') famOpenChest = (orig => function () {
  const r = orig.apply(this, arguments);
  try { if (r) { qtState().log.chests++; save(); setTimeout(qtCheckStories, 50); } } catch (e) {}
  return r;
})(famOpenChest);
// retour de voyage : besoins mémorisés AVANT le rangement du butin (pour « Pour : … ✔ »)
let qtHaulNeeds = null, qtHaulT = 0; // la fenêtre du retour peut s'ouvrir un peu plus tard (nouvelle région…)
if (typeof collect === 'function') collect = (orig => function () {
  try { qtHaulNeeds = qtNeeds(true).filter(n => n.match); qtHaulT = Date.now(); } catch (e) { qtHaulNeeds = null; }
  try { return orig.apply(this, arguments); } finally { qtNeedC.t = 0; }
})(collect);
GAME.on('trip:return', ({ dest, items }) => {
  if (!dest) return;
  const s = qtState(), L = s.log;
  try {
    const km = qtKm(dest); if (km > 5000) L.far++;
    const R = qtCall(() => regionAt(dest.lon, dest.lat), null); if (R) { L.reg.push([Date.now(), R.id]); if (L.reg.length > 60) L.reg.splice(0, L.reg.length - 60); }
    if ((items || []).some(it => (it.rarity || 0) >= 4)) L.cont[qtCont(dest.lon, dest.lat)] = 1;
    for (const q of QT_STORIES) {
      const rec = s.st[q.id]; if (!rec || rec.done) continue;
      const st = q.steps[rec.i];
      const hit = st.t === 'go' ? (() => { const P = PLACES.find(x => x.name === st.place); return dest.name === st.place || (P && kmBetween(P, dest) < 30); })()
        : st.t === 'cat' ? dest.cat === st.cat || (dest.tags || []).includes(st.cat)
        : st.t === 'region' ? R && R.id === st.r : false;
      if (hit) { rec.hit = 1; setTimeout(() => toast(`Quête « ${q.title} » : étape réussie !`), 1600); qtAdvance(q, rec); }
    }
  } catch (e) { console.error('quêtes retour', e); }
  save();
});
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const needs = qtHaulNeeds && Date.now() - qtHaulT < 20000 ? qtHaulNeeds : [], hits = []; qtHaulNeeds = null;
    for (const n of needs) {
      const got = (h.items || []).filter(it => n.match(it)); if (!got.length) continue;
      const have = qtCount(n.match), ok = have >= n.n;
      hits.push(`<div class="qt-hrow"><span class="qt-di" style="--fc:${qtNeedCol(n)}">${qtIco(got[0])}<i class="qtf"></i></span><span class="qt-hx"><b>${esc(got[0].name)}</b><span>Pour : ${esc(n.why)} ${ok ? '<em class="ok">✔</em>' : `<em>${Math.min(have, n.n)}/${n.n}</em>`}</span></span><button class="btn ${ok ? 'green' : 'cream'} sm" data-qthaul="${esc(n.src)}">${n.src === 'recette' ? 'Préparer' : n.src === 'commande' ? 'Livrer' : n.src === 'reve' ? 'Mon rêve' : n.src === 'cle' ? 'Ouvrir' : n.src === 'quete' ? 'Quête' : 'Ma liste'}</button></div>`);
      if (hits.length >= 4) break;
    }
    if (hits.length) {
      const mb = document.querySelector('#modal .mbox'), hd = mb && mb.querySelector('.hhead');
      const html = `<div class="qt-haul"><h4>${QT_LIST} Utile pour vos besoins</h4>${hits.join('')}</div>`;
      if (hd) hd.insertAdjacentHTML('afterend', html); else if (mb) mb.insertAdjacentHTML('afterbegin', html);
    }
  } catch (e) { console.error('quêtes butin', e); }
  return r;
})(showHaul);
// « Sert à… » des fiches d'objet
try { GAME.addUses(it => qtCall(() => qtNeeds().filter(n => n.match && n.match(it)).slice(0, 2).map(n => ({ txt: `Pour : ${n.why} (${n.gain})`, kind: 'recette' })), [])); } catch (e) {}
// menu : Quêtes et Ma liste
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const row = `<section class="msec"><header><h3>Quêtes</h3></header><div class="mrow"><span class="mri">${QT_SCROLL}</span><div><b>Histoires et défis</b><span>${qtDoneN()}/${QT_STORIES.length} histoires · ${Object.keys(qtState().df).length}/${QT_DEFIS.length} défis</span></div><button class="btn cream sm" data-qtpage="1">Voir</button></div><div class="mrow"><span class="mri">${QT_LIST}</span><div><b>Ma liste de courses</b><span>Ce qu’il vous faut, pour quoi, et où</span></div><button class="btn cream sm" data-qtlist="1">Voir</button></div></section>`;
    const first = box.querySelector('.msec'); if (first) first.insertAdjacentHTML('afterend', row); else box.insertAdjacentHTML('beforeend', row);
  } catch (e) { console.error('quêtes menu', e); }
  return r;
})(renderMenu);

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const tb = ev.target.closest('[data-qtltab]'); if (tb) { qtLTab = tb.dataset.qtltab; const mb = document.querySelector('#modal .mbox'); showModal(qtListHTML()); if (mb) mb.scrollTop = 0; return; }
  const el = ev.target.closest('[data-qtlist],[data-qtpage],[data-qtneed],[data-qtday],[data-qtfollow],[data-qtgive],[data-qtdefi],[data-qtshop],[data-qtsac],[data-qtnur],[data-qthaul],[data-qtedge]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.qtlist) return qtOpenList();
  if (d.qtpage) return qtOpenPage();
  if (d.qtneed) { const n = qtNeeds(true).find(x => x.id === d.qtneed); if (n) qtGo(n); else toast('Ce besoin est déjà comblé !'); return; }
  if (d.qtday) return qtDayGive(+d.qtday);
  if (d.qtfollow) { qtStart(d.qtfollow); const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0; return; }
  if (d.qtgive) return qtGive(d.qtgive);
  if (d.qtdefi) return qtClaimDefi(d.qtdefi);
  if (d.qtedge) { const g = qtPins.find(x => x.k === d.qtedge); if (g) qtGo(g.list[0]); return; }
  $('modal').hidden = true;
  if (d.qtshop || (d.qthaul === 'recette' || d.qthaul === 'commande')) { try { openBoutique('comptoir'); } catch (e) { openSheet('boutique'); } return; }
  if (d.qtsac || d.qthaul === 'cle') return openSheet('sac');
  if (d.qtnur) return openSheet('compagnons');
  if (d.qthaul === 'reve') return openSheet('reves');
  if (d.qthaul === 'quete') return qtOpenPage();
  if (d.qthaul) return qtOpenList();
});
document.addEventListener('click', ev => { if (ev.target.closest('[data-closemodal]')) qtPageOn = false; }, true);
// suivi régulier : épingles, point rouge, étapes automatiques
setInterval(() => { try { if (document.hidden) return; qtState(); qtCheckStories(); qtNeedC.t = 0; qtMapUpdate(); qtBtns(); if (typeof positionOverlay === 'function') positionOverlay(); } catch (e) {} }, 2500);
setTimeout(() => { try { qtState(); qtBtns(); qtMapUpdate(); } catch (e) {} }, 300);
window.__qt = { state: qtState, needs: qtNeeds, loc: qtLoc, groups: qtGroups, day: qtDay, dayGive: qtDayGive, start: qtStart, give: qtGive, check: qtCheckStories, claim: qtClaimDefi, list: qtOpenList, page: qtOpenPage, update: qtMapUpdate, STORIES: QT_STORIES, DEFIS: QT_DEFIS };

// ---------------- styles ----------------
(function qtCSS() {
  const st = document.createElement('style'); st.id = 'qtCSS';
  st.textContent = `
#qtBtns{position:absolute;left:max(16px,env(safe-area-inset-left,0px));top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:4}
body.sheet-open #qtBtns,body.firstrun #qtBtns,body.firstrun .qtpin,body.firstrun #qtEdge{display:none!important}
.qt-mb{position:relative;width:58px;padding:5px 2px 3px;border-radius:16px;background:var(--paper);border:2.5px solid var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.35);display:flex;flex-direction:column;align-items:center;gap:0;cursor:pointer;color:var(--ink);font:800 10.5px/1.15 var(--display)}
.qt-mb svg{width:28px;height:28px}
.qt-mb:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(74,53,40,.35)}
.qt-dot{position:absolute;right:-4px;top:-4px;width:14px;height:14px;border-radius:50%;background:#e5484d;border:2px solid #fff}
.qt-dot[hidden]{display:none}
.qtpin{position:absolute;left:0;top:0;z-index:3}
.qtb{position:absolute;left:-19px;top:-46px;width:38px;height:38px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:#fffaf0;border:2.5px solid var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.35),0 0 0 4px rgba(246,196,69,.55);display:flex;align-items:center;justify-content:center}
.qtb .qti{transform:rotate(45deg);width:27px;height:27px;display:flex}
.qti svg{width:100%;height:100%}
.qtb .qtf{position:absolute;right:-3px;top:-3px;width:12px;height:12px;border-radius:50%;background:var(--fc);border:2px solid #fff;transform:rotate(45deg)}
.qtb .qtn{position:absolute;left:-7px;top:-7px;transform:rotate(45deg);background:#e0607e;color:#fff;border:2px solid #fff;border-radius:9px;font:800 10px/14px var(--display);padding:0 4px}
#ov[data-z="far"] .qtb{width:30px;height:30px;left:-15px;top:-38px}
#ov[data-z="far"] .qtb .qti{width:21px;height:21px}
.qtlab{display:none;position:absolute;left:0;top:4px;transform:translateX(-50%);width:max-content;max-width:250px;background:#fff8ea;border:2.5px solid var(--ink);border-radius:14px;padding:7px 9px;box-shadow:0 3px 0 rgba(74,53,40,.35);font:600 12.5px/1.3 var(--body);color:var(--ink);flex-direction:column;gap:3px;z-index:5}
.qtpin.open{z-index:6}.qtpin.open .qtlab{display:flex}
.qt-ln b{font-family:var(--display)}.qt-ln em{font-style:normal;color:#2f7f3a;font-weight:800}
.qt-where{font-size:11.5px;color:var(--ink2,#7a6455)}
.qtlab .btn{align-self:flex-start;margin-top:3px}
#qtEdge{position:absolute;inset:0;pointer-events:none}
.qtedge{position:absolute;left:0;top:0;margin:-22px 0 0 -22px;width:44px;height:44px;border-radius:50%;background:#fffaf0;border:2.5px solid var(--ink);box-shadow:0 0 0 3px var(--fc),0 3px 0 rgba(74,53,40,.35);pointer-events:auto;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}
.qtedge .qti{width:28px;height:28px}
.qtedge .qtar{position:absolute;inset:-14px;display:flex;justify-content:flex-end;align-items:center;pointer-events:none}
.qtedge .qtar svg{width:15px;height:15px}
.qtedge small{position:absolute;top:100%;margin-top:3px;left:50%;transform:translateX(-50%);background:#fff8ea;border:2px solid var(--ink);border-radius:8px;padding:0 5px;font:800 10px/15px var(--display);white-space:nowrap;color:var(--ink)}
.tripcard.qt-on{flex-wrap:wrap}
.qt-tc{flex-basis:100%;display:flex;align-items:center;gap:8px;border-top:2px dashed rgba(74,53,40,.25);padding-top:6px;margin-top:2px}
.qt-tci svg{width:26px;height:26px;display:block}
.qt-tcx{flex:1;min-width:0;font:600 12.5px/1.25 var(--body);display:flex;flex-direction:column}
.qt-tcx b{font:800 12.5px/1.2 var(--display);color:#b0482f}
.qt-page{text-align:left}.qt-page h2,.qt-page>.bqc-kick{text-align:center;display:block}.qt-page h2{margin:0 0 8px}
.qt-ltabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:6px 0 12px}.qt-list{max-width:100%;overflow-x:hidden}.qt-ltab{flex:none;display:flex;align-items:center;gap:5px;padding:6px 10px;border:2px solid #5b4636;border-radius:999px;background:#fffaf0;font:800 13px var(--body);color:#5b4636;cursor:pointer}.qt-ltab.on{background:#5b4636;color:#fff}.qt-ltab b{min-width:18px;height:18px;border-radius:9px;background:#e0607e;color:#fff;font-size:11px;display:grid;place-items:center;padding:0 4px}.qt-sub{margin:0 0 8px;font-size:13px;opacity:.75}
.qt-h3{font:800 15px var(--display);margin:14px 0 6px;display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}.qt-h3 small{font:600 12px var(--body);opacity:.7}
.qt-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.qt-day{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;background:#fffaf0;border:2.5px solid var(--ink);border-radius:16px;padding:8px 8px 9px}
.qt-day.done{opacity:.6}
.qt-day b{font:800 13.5px/1.15 var(--display)}.qt-day small{font-size:11.5px;line-height:1.2;opacity:.8}
.qt-z{font:800 10.5px var(--display);text-transform:uppercase;letter-spacing:.04em;border-radius:8px;padding:0 6px;background:#e3f6ec;color:#2f7f3a}.qt-z.z-reg{background:#e1effa;color:#2f6fb0}.qt-z.z-far{background:#ffe4d8;color:#b0482f}
.qt-di{position:relative;width:42px;height:42px;flex:none;border-radius:12px;background:#fff;border:2px solid var(--fc);display:flex;align-items:center;justify-content:center}
.qt-di svg{width:32px;height:32px}
.qt-di .qtf{position:absolute;right:-4px;top:-4px;width:11px;height:11px;border-radius:50%;background:var(--fc);border:2px solid #fff}
.qt-pay{font:800 13px var(--display)}
.qt-ok{font:800 13px var(--display);color:#2f7f3a}
.qt-need,.qt-story,.qt-defi,.qt-hrow{display:flex;align-items:center;gap:9px;background:#fffaf0;border:2px solid rgba(74,53,40,.35);border-radius:14px;padding:7px 9px;margin-bottom:6px}
.qt-nx,.qt-story>div,.qt-defi>div,.qt-hx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;font:600 12.5px/1.25 var(--body)}
.qt-nx b,.qt-story b,.qt-defi b,.qt-hx b{font:800 14px/1.2 var(--display)}
.qt-nx em{font-style:normal;color:#2f7f3a;font-weight:800}
.qt-w{font-size:11.5px;opacity:.85}.qt-w i{font-style:normal;color:var(--fc);font-weight:800}
.qt-face{width:46px;height:46px;flex:none;border-radius:50%;background:#f6ead6;border:2px solid var(--ink);object-fit:cover}
.qt-face0{display:flex;align-items:center;justify-content:center;font:800 20px var(--display)}
.qt-story.locked{opacity:.55}.qt-story.done{opacity:.7}
.qt-rw{display:flex;align-items:center;gap:5px;font-size:11.5px;color:#9a6a10;font-weight:700}.qt-rw i{width:20px;height:20px;flex:none;display:flex}.qt-rw i svg{width:100%;height:100%}
.qt-big{background:#fff3d6;border:3px solid var(--ink);border-radius:18px;padding:10px;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.qt-bh{display:flex;gap:10px;align-items:center}.qt-bh h3{margin:0;font:800 18px/1.15 var(--display)}.qt-bh small{font:600 12.5px/1.3 var(--body)}
.qt-bh .qt-face{width:58px;height:58px}
.qt-steps{list-style:none;margin:10px 0 8px;padding:0;display:flex;flex-direction:column;gap:6px}
.qt-steps li{display:flex;align-items:center;gap:8px;background:#fffaf0;border-radius:12px;padding:6px 8px;border:2px solid transparent;font:600 12.5px/1.25 var(--body)}
.qt-steps li>div{flex:1;min-width:0;display:flex;flex-direction:column}
.qt-steps li b{font:800 13.5px var(--display)}
.qt-steps li.cur{border-color:#e0a52a;background:#fff}
.qt-steps li.done{opacity:.65}.qt-steps li.done b{text-decoration:line-through}
.qt-ck{width:24px;height:24px;flex:none;border-radius:7px;border:2.5px solid var(--ink);display:flex;align-items:center;justify-content:center;font:800 12px var(--display);font-style:normal;background:#fff}
.qt-steps li.done .qt-ck{background:#5fbf7f;color:#fff}
.qt-rwb{display:flex;gap:9px;align-items:center;background:#fffaf0;border-radius:12px;padding:6px 9px}.qt-rwb>span{width:40px;height:40px;flex:none;display:flex}.qt-rwb>span svg{width:100%;height:100%}.qt-rwb div{display:flex;flex-direction:column;font:600 12px var(--body)}.qt-rwb b{font:800 14px var(--display);color:#9a6a10}
.qt-dt svg{width:36px;height:36px;display:block}
.qt-defi.done{opacity:.6}
.qt-bar{height:8px;border-radius:5px;background:#eadfcd;overflow:hidden;margin:3px 0}.qt-bar i{display:block;height:100%;background:#5fbf7f}
.qt-cnt{font:800 13px var(--display)}
.qt-hint{background:#fff3d6;border-radius:12px;padding:8px 10px;font-weight:600}
.qt-acts{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}.qt-acts svg{width:20px;height:20px;vertical-align:-4px}
.qt-haul{margin:8px 0;background:#e9f7ee;border:2.5px solid #3a8f5a;border-radius:14px;padding:7px 8px}
.qt-haul h4{margin:0 0 6px;font:800 14px var(--display);color:#2f6f45;display:flex;align-items:center;gap:6px}.qt-haul h4 svg{width:20px;height:20px}
.qt-haul .qt-hrow{margin-bottom:4px;border-color:rgba(58,143,90,.4)}
.qt-hx em{font-style:normal;font-weight:800}.qt-hx em.ok{color:#2f7f3a}
@media (max-width:420px){.qt-days{grid-template-columns:1fr}.qt-day{flex-direction:row;flex-wrap:wrap;text-align:left;justify-content:flex-start}.qt-day small{flex-basis:100%}.qt-day .qt-z{position:absolute;right:8px;top:6px}}
`;
  document.head.appendChild(st);
})();

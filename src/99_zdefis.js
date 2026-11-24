// ================= LIEUX À DÉFI (v164) : la chasse au trésor sur les vrais lieux =================
// Le joueur : « je veux des lieux à défi presque dans chaque village, pas seulement les Alpes ; qu'on galère de façon
// exponentielle pour y accéder ; que ce qu'on obtient soit propre au lieu et vaille le coup ; des cadenas, pas de code couleur ».
// - Parmi les vrais lieux de la carte, certains (chapelle, château, ruines, étang, rivière, sommet, belvédère, forêt…)
//   deviennent des lieux à défi, toujours les mêmes (tirage fixé par le lieu), de ★1 à ★3 pour l'instant.
// - Chaque lieu a des CADENAS : un équipement d'un certain niveau, un familier d'un terrain et d'un niveau, un moment réel,
//   des matériaux qu'on ne trouve QUE dans les lieux à défi de l'étoile d'en dessous. D'où la croissance exponentielle.
// - Tous les cadenas ouverts : on rapporte des matériaux de l'étoile du lieu et, la première fois, un trésor à son nom.
//   On peut tenter sans tout : on revient rarement avec quelque chose.
// - Sur la carte : une pastille par lieu à défi (étoiles + cadenas ouverts/fermés), et un filtre (tous, ouverts, presque, masqués).
const ld$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('défis', e); return d; } };
function ldSt() { if (!S.ld || typeof S.ld !== 'object') S.ld = {}; const s = S.ld; if (!s.done) s.done = {}; if (!s.f) s.f = 'tout'; if (!s.stars) s.stars = [1, 2, 3]; return s; }

const LD_FAM = {
  ancien: { nm: 'Lieu ancien', gear: ['lanterne', 'boussole', 'lampe'], ter: null, mats: ['Pierre gravée', 'Médaille ancienne', 'Sceau oublié'], col: '#b08a5a', tr: 'Relique' },
  eau: { nm: 'Lieu d’eau', gear: ['bottes', 'palmes', 'cire'], ter: ['riviere', 'marais', 'mer'], mats: ['Galet poli', 'Perle d’eau douce', 'Larme de source'], col: '#3f8fb8', tr: 'Galet chantant' },
  hauteur: { nm: 'Lieu en hauteur', gear: ['crampons', 'corde', 'jumelles'], ter: ['montagne'], mats: ['Éclat de roche', 'Cristal de crête', 'Cœur de sommet'], col: '#8a7a9a', tr: 'Cristal' },
  nature: { nm: 'Lieu sauvage', gear: ['jumelles', 'lanterne', 'bottes'], ter: ['foret', 'campagne'], mats: ['Graine rare', 'Écorce dorée', 'Sève ancienne'], col: '#5f8f52', tr: 'Gland d’or' },
};
const LD_CAT = { patrimoine: 'ancien', musee: 'ancien', mairie: 'ancien', bibliotheque: 'ancien', etang: 'eau', riviere: 'eau', port: 'eau', plage: 'eau', phare: 'eau', sentier: 'hauteur', belvedere: 'hauteur', foret: 'nature', parc: 'nature', jardin: 'nature', camping: 'nature', ferme: 'nature', zoo: 'nature', cinema: 'ancien' };
const LD_P = { patrimoine: .5, musee: .45, mairie: .25, bibliotheque: .25, etang: .5, riviere: .45, port: .4, plage: .4, phare: .8, sentier: .65, belvedere: .7, foret: .4, parc: .06, jardin: .12, camping: .25, ferme: .3, zoo: .5, cinema: .6 };
// les églises et monuments aux morts sont partout : on en garde peu ; les lieux rares le sont plus souvent
const LD_PS = { place_of_worship: .1, memorial: .12, monument: .35, castle: .9, ruins: .85, archaeological_site: .85, windmill: .85, watermill: .85, fort: .9, city_gate: .8, tower: .6, wayside_shrine: .15, pond: .35, stream: .3, waterfall: .9, dam: .7, lock_gate: .75, peak: .8, saddle: .8, alpine_hut: .8 };
// certaines catégories ne comptent que pour quelques vrais types de lieu (un cinéma de centre commercial n'est pas un défi, un vieux théâtre oui)
const LD_ONLY = { cinema: ['theatre', 'opera'] };
// sous-types : [nom affiché, nom du trésor, équipements possibles, terrain du familier]
const LD_SUB = {
  place_of_worship: ['Église',  'Cloche miniature', ['lanterne', 'boussole']], castle: ['Château', 'Blason', ['lanterne', 'corde', 'boussole']], ruins: ['Ruines', 'Pierre runique', ['lampe', 'boussole', 'corde']],
  monument: ['Monument', 'Médaillon', ['jumelles', 'boussole']], memorial: ['Mémorial', 'Médaillon', ['jumelles', 'lanterne']], attraction: ['Curiosité', 'Objet étrange', ['jumelles', 'lampe']],
  archaeological_site: ['Site antique', 'Tesson gravé', ['lampe', 'boussole', 'plan']], windmill: ['Moulin à vent', 'Meule miniature', ['corde', 'jumelles']],
  watermill: ['Moulin à eau', 'Roue à aubes', ['bottes', 'corde']], fort: ['Fort', 'Boulet gravé', ['lanterne', 'corde', 'plan']], city_gate: ['Porte de ville', 'Clé de la cité', ['plan', 'lanterne']],
  tower: ['Tour', 'Girouette', ['corde', 'jumelles']], wayside_shrine: ['Oratoire', 'Cloche miniature', ['lanterne', 'boussole']], theatre: ['Vieux théâtre', 'Masque doré', ['lanterne', 'plan']], opera: ['Opéra', 'Masque doré', ['lanterne', 'plan']],
  musee: ['Musée', 'Pièce de collection', ['lampe', 'jumelles']], mairie: ['Vieille mairie', 'Sceau de la ville', ['plan', 'lanterne']], bibliotheque: ['Bibliothèque', 'Grimoire', ['lampe', 'lanterne']],
  lake: ['Lac', 'Nénuphar d’argent', ['palmes', 'bottes']], pond: ['Étang', 'Nénuphar d’argent', ['bottes', 'palmes']], reservoir: ['Lac de barrage', 'Écaille bleue', ['palmes', 'cire']],
  river: ['Rivière', 'Galet chantant', ['bottes', 'palmes']], stream: ['Ruisseau', 'Galet chantant', ['bottes']], waterfall: ['Cascade', 'Goutte de cascade', ['cire', 'corde', 'palmes']],
  dam: ['Barrage', 'Rouage rouillé', ['corde', 'bottes']], weir: ['Seuil', 'Rouage rouillé', ['bottes']], lock_gate: ['Écluse', 'Clé d’écluse', ['bottes', 'corde']],
  port: ['Port', 'Ancre miniature', ['cire', 'palmes']], plage: ['Plage', 'Coquillage nacré', ['palmes', 'chapeau']], phare: ['Phare', 'Lentille de phare', ['cire', 'lanterne', 'corde']],
  peak: ['Sommet', 'Cristal de sommet', ['crampons', 'corde', 'bonnet']], saddle: ['Col', 'Edelweiss', ['crampons', 'bonnet']], alpine_hut: ['Refuge', 'Carnet du refuge', ['crampons', 'lanterne']],
  wilderness_hut: ['Cabane', 'Carnet du refuge', ['lanterne', 'boussole']], trailhead: ['Sentier', 'Bâton sculpté', ['crampons', 'gourde']], belvedere: ['Belvédère', 'Longue-vue ancienne', ['jumelles', 'corde']],
  foret: ['Forêt', 'Gland d’or', ['jumelles', 'lanterne', 'bottes']], parc: ['Parc', 'Feuille dorée', ['jumelles', 'lanterne']], jardin: ['Jardin', 'Graine rare', ['chapeau', 'jumelles']],
  camping: ['Bivouac', 'Bougie de bivouac', ['lanterne', 'gourde']], ferme: ['Ferme', 'Œuf doré', ['bottes', 'chapeau']], zoo: ['Parc animalier', 'Plume rare', ['jumelles', 'gourde']],
};
const ldSub = p => LD_SUB[(p.osm && p.osm.subclass) || ''] && ['patrimoine', 'etang', 'riviere', 'sentier', 'cinema'].includes(p.cat) ? (p.osm.subclass) : (LD_SUB[p.cat] ? p.cat : null);
// ---------- ce que chaque type de lieu exige, et POURQUOI (v174 : « pas de cohérence entre le lieu et les prérequis ») ----------
// g : équipements possibles [clé, raison] (XP_G complet au moment du tirage : + corde, lanterne, bonnet, chapeau, bottes, cire, plan, boussole)
// c : familier [terrain, raison] ; m : moment [moment, raison] ; rel : famille des matériaux demandés en plus des siens
const LD_REQ = {
  place_of_worship: { g: [['lampe', 'La crypte est plongée dans le noir'], ['lanterne', 'Le clocher se visite à la lueur d’une lanterne']], c: ['ville', 'Un familier qui connaît les ruelles du bourg'], m: ['hiver', 'La crèche n’est installée qu’en hiver'], rel: 'ancien' },
  wayside_shrine: { g: [['lampe', 'La niche de l’oratoire est sombre'], ['lanterne', 'On y dépose une lanterne le soir']], c: ['campagne', 'L’oratoire se cache au bord des champs'], m: ['printemps', 'On le fleurit au printemps'], rel: 'nature' },
  castle: { g: [['lampe', 'Les souterrains du château sont sombres'], ['corde', 'Il faut escalader le rempart effondré']], c: ['montagne', 'Le château est perché sur sa colline'], m: ['nuit', 'On dit qu’une lueur brille dans la tour la nuit'], rel: 'hauteur' },
  fort: { g: [['lampe', 'Les casemates sont dans le noir'], ['corde', 'Le fossé se descend à la corde']], c: ['montagne', 'Le fort garde les hauteurs'], m: ['nuit', 'La relève de la garde se faisait de nuit'], rel: 'hauteur' },
  ruins: { g: [['lampe', 'Des caves effondrées à explorer'], ['crampons', 'Les murs écroulés sont glissants'], ['corde', 'Le donjon n’a plus d’escalier']], c: ['foret', 'La forêt a envahi les pierres'], m: ['nuit', 'Les vieilles pierres brillent au clair de lune'], rel: 'nature' },
  monument: { g: [['jumelles', 'L’inscription est tout en haut']], c: ['ville', 'Il trône au cœur de la ville'], m: ['été', 'La fête du village a lieu l’été'], rel: 'ancien' },
  memorial: { g: [['jumelles', 'Les noms gravés sont tout en haut']], c: ['ville', 'Il se dresse sur la place'], m: ['automne', 'La cérémonie a lieu en automne'], rel: 'ancien' },
  attraction: { g: [['jumelles', 'Il faut repérer le détail caché']], c: ['ville', 'Un familier curieux de la ville'], m: ['été', 'Le lieu s’anime l’été'], rel: 'ancien' },
  musee: { g: [['lampe', 'Les réserves du musée sont dans le noir'], ['plan', 'Les salles sont un vrai labyrinthe']], c: ['ville', 'Un familier habitué à la ville'], m: ['nuit', 'Comme pour la Nuit des musées'], rel: 'ancien' },
  mairie: { g: [['lampe', 'Les archives sont au sous-sol'], ['plan', 'Il faut retrouver la rue d’origine sur le vieux plan']], c: ['ville', 'Un familier qui connaît le bourg'], m: ['printemps', 'Le marché de printemps se tient sur la place'], rel: 'ancien' },
  bibliotheque: { g: [['lampe', 'Les vieux rayonnages sont mal éclairés']], c: ['ville', 'Un familier habitué à la ville'], m: ['hiver', 'On y lit au chaud l’hiver'], rel: 'ancien' },
  archaeological_site: { g: [['gourde', 'On fouille en plein soleil'], ['lampe', 'Des galeries sont enfouies'], ['chapeau', 'Pas un coin d’ombre sur le chantier']], c: ['campagne', 'Le site est au milieu des champs'], m: ['été', 'Les fouilles ont lieu l’été'], rel: 'nature' },
  windmill: { g: [['manteau', 'Le vent souffle fort sur la butte'], ['bonnet', 'Le vent glacé de la butte']], c: ['campagne', 'Le moulin veille sur les champs'], m: ['automne', 'On moud le grain après la moisson'], rel: 'nature' },
  watermill: { g: [['palmes', 'La roue tourne dans l’eau du bief'], ['bottes', 'Le bief déborde sur le chemin']], c: ['riviere', 'Il faut un familier de l’eau douce'], m: ['printemps', 'La rivière est haute au printemps'], rel: 'eau' },
  city_gate: { g: [['lampe', 'Le passage voûté est sombre'], ['plan', 'Les ruelles anciennes s’emmêlent']], c: ['ville', 'La porte ouvre sur la vieille ville'], m: ['nuit', 'Les portes se fermaient la nuit'], rel: 'ancien' },
  tower: { g: [['crampons', 'L’escalier est étroit et usé'], ['jumelles', 'Toute la vue est en haut'], ['corde', 'Les dernières marches ont disparu']], c: ['ville', 'La tour domine les toits'], m: ['été', 'Le sommet n’ouvre qu’aux beaux jours'], rel: 'hauteur' },
  theatre: { g: [['lampe', 'Les coulisses sont dans le noir'], ['plan', 'Les coulisses sont un dédale']], c: ['ville', 'Un familier qui aime la ville'], m: ['nuit', 'Le spectacle commence le soir'], rel: 'ancien' },
  lake: { g: [['palmes', 'Il faut plonger au fond du lac']], c: ['riviere', 'Il faut un familier de l’eau douce'], m: ['été', 'L’eau n’est bonne qu’en été'], rel: 'nature' },
  pond: { g: [['jumelles', 'Les oiseaux de l’étang sont farouches'], ['palmes', 'L’étang est vaseux et profond'], ['bottes', 'Les berges sont pleines de vase']], c: ['marais', 'Il faut un familier des roseaux'], m: ['printemps', 'Les grenouilles chantent au printemps'], rel: 'nature' },
  river: { g: [['palmes', 'Il faut traverser le courant'], ['bottes', 'Il faut patauger sur les berges']], c: ['riviere', 'Il faut un familier de l’eau douce'], m: ['printemps', 'Les eaux montent au printemps'], rel: 'nature' },
  waterfall: { g: [['crampons', 'Les rochers sont glissants'], ['palmes', 'Le bassin est profond'], ['cire', 'Les embruns trempent tout']], c: ['montagne', 'La cascade tombe de la montagne'], m: ['printemps', 'La fonte des neiges la réveille'], rel: 'hauteur' },
  dam: { g: [['lampe', 'Les galeries de l’ouvrage sont sombres'], ['corde', 'Il faut descendre le long du mur']], c: ['riviere', 'Il faut un familier de l’eau douce'], m: ['été', 'Les vannes s’ouvrent l’été'], rel: 'ancien' },
  port: { g: [['palmes', 'Le trésor est sous les pontons'], ['cire', 'Les embruns du large']], c: ['mer', 'Il faut un familier marin'], m: ['nuit', 'Les pêcheurs rentrent de nuit'], rel: 'eau' },
  plage: { g: [['palmes', 'Il faut nager jusqu’aux rochers'], ['gourde', 'Le soleil tape fort'], ['chapeau', 'Le soleil tape fort sur le sable']], c: ['mer', 'Il faut un familier marin'], m: ['été', 'La plage est vivante l’été'], rel: 'nature' },
  phare: { g: [['lampe', 'L’escalier en colimaçon est sombre'], ['jumelles', 'Il faut guetter les bateaux au large'], ['cire', 'Les vagues fouettent la jetée']], c: ['mer', 'Il faut un familier marin'], m: ['nuit', 'Le phare ne s’allume que la nuit'], rel: 'hauteur' },
  peak: { g: [['crampons', 'La pente finale est verglacée'], ['manteau', 'Il fait glacial là-haut'], ['corde', 'La dernière arête se passe encordé'], ['bonnet', 'Le froid mord les oreilles']], c: ['montagne', 'Il faut un familier montagnard'], m: ['été', 'Le sommet n’est accessible qu’en été'], rel: 'hauteur' },
  saddle: { g: [['crampons', 'Le passage est verglacé'], ['manteau', 'Le vent du col est glacial'], ['bonnet', 'Le vent du col est glacial']], c: ['montagne', 'Il faut un familier montagnard'], m: ['été', 'Le col est fermé le reste de l’année'], rel: 'hauteur' },
  hut: { g: [['manteau', 'Les nuits au refuge sont glaciales'], ['crampons', 'Le chemin du refuge est raide'], ['bonnet', 'Il gèle la nuit au refuge']], c: ['montagne', 'Il faut un familier montagnard'], m: ['hiver', 'Le refuge d’hiver n’ouvre qu’à la neige'], rel: 'hauteur' },
  wilderness_hut: { g: [['lampe', 'La cabane n’a pas d’électricité'], ['lanterne', 'Pas d’électricité dans la cabane']], c: ['foret', 'La cabane est perdue dans les bois'], m: ['automne', 'On y trouve refuge à l’automne'], rel: 'nature' },
  trailhead: { g: [['gourde', 'Une longue marche vous attend'], ['crampons', 'Le sentier grimpe sec'], ['boussole', 'Les balises ont disparu']], c: ['montagne', 'Il faut un bon marcheur'], m: ['été', 'Le sentier est praticable l’été'], rel: 'hauteur' },
  belvedere: { g: [['jumelles', 'Pour profiter de la vue']], c: ['montagne', 'Il faut un familier à l’aise en hauteur'], m: ['automne', 'L’air est limpide en automne'], rel: 'hauteur' },
  foret: { g: [['jumelles', 'Les animaux de la forêt sont timides'], ['lampe', 'Les sous-bois sont sombres'], ['boussole', 'On s’y perd facilement'], ['lanterne', 'Les sous-bois sont sombres']], c: ['foret', 'Il faut un familier de la forêt'], m: ['automne', 'Champignons et feuilles d’or'], rel: 'nature' },
  parc: { g: [['jumelles', 'Les écureuils se cachent dans les arbres']], c: ['ville', 'Un familier habitué aux parcs de ville'], m: ['printemps', 'Le parc fleurit au printemps'], rel: 'nature' },
  jardin: { g: [['jumelles', 'Des papillons rares s’y posent'], ['chapeau', 'Plein soleil dans les allées']], c: ['campagne', 'Il faut un familier qui aime la terre'], m: ['printemps', 'Tout fleurit au printemps'], rel: 'nature' },
  camping: { g: [['lampe', 'La nuit tombe vite au bivouac'], ['gourde', 'Pas de point d’eau sur place'], ['lanterne', 'La nuit tombe vite au bivouac']], c: ['foret', 'Le bivouac est en lisière de forêt'], m: ['été', 'On campe l’été'], rel: 'nature' },
  ferme: { g: [['lampe', 'La vieille grange est sombre'], ['bottes', 'La cour est boueuse']], c: ['campagne', 'Il faut un familier de la campagne'], m: ['automne', 'C’est le temps des récoltes'], rel: 'nature' },
  zoo: { g: [['jumelles', 'Les animaux rares se cachent'], ['boussole', 'Le parc est immense']], c: ['foret', 'Il faut un familier qui rassure les animaux'], m: ['printemps', 'Les petits naissent au printemps'], rel: 'nature' },
};
const LD_REQA = { opera: 'theatre', reservoir: 'lake', stream: 'river', weir: 'dam', lock_gate: 'dam', alpine_hut: 'hut' };
const ldReq = sk => LD_REQ[sk] || LD_REQ[LD_REQA[sk]] || LD_REQ.place_of_worship;
const LD_BIG = ['ruins', 'castle', 'fort', 'archaeological_site', 'peak', 'waterfall', 'alpine_hut', 'lighthouse', 'saddle', 'monument'];
const LD_CACHE = {};
const ldHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const ldRnd = seed => { let a = seed || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const ldPick = (r, a) => a[Math.floor(r() * a.length)];

// ---------- un lieu est-il à défi ? (toujours la même réponse pour le même vrai lieu) ----------
function ldOf(p) {
  if (!p || !p.cat || !p.name || p.tuto) return null;
  const fam = LD_CAT[p.cat]; if (!fam) return null;
  const sub = (p.osm && p.osm.subclass) || ''; if (LD_ONLY[p.cat] && !LD_ONLY[p.cat].includes(sub)) return null;
  const id = 'ld' + ldHash(p.cat + '|' + p.name + '|' + (+p.lon).toFixed(3) + '|' + (+p.lat).toFixed(3)).toString(36);
  if (LD_CACHE[id]) return LD_CACHE[id];
  const r = ldRnd(ldHash(id));
  if (r() > (LD_PS[sub] ?? LD_P[p.cat] ?? .2)) return null;
  const F = LD_FAM[fam], big = p.osm && LD_BIG.includes(p.osm.subclass) ? 1 : 0, x = r();
  const sk = ldSub(p) || ({ ancien: 'place_of_worship', eau: 'pond', hauteur: 'trailhead', nature: 'foret' })[fam], SB = LD_SUB[sk];
  const s = Math.min(3, 1 + (x < .55 ? 0 : x < .88 ? 1 : 2) + big);
  const Q = ldReq(sk), gg = ldPick(r, Q.g.filter(x => XP_G[x[0]])), rel = Q.rel || fam, L = [];
  const G = t => ({ t: 'g', g: gg[0], tier: t, why: gg[1] }), C = lvl => ({ t: 'c', ter: Q.c[0], lvl, why: Q.c[1] }), M = () => ({ t: 'm', m: Q.m[0], why: Q.m[1] });
  if (s === 1) {
    L.push(r() < .5 ? C(3) : G(1));
  } else if (s === 2) {
    L.push(G(2));
    L.push({ t: 'i', fam: rel, tier: 0, n: 3 });
    const y = r(); if (y < .45) L.push(C(8)); else if (y < .75) L.push(M());
  } else {
    L.push(G(3)); L.push(C(15)); L.push(M());
    L.push({ t: 'i', fam: rel, tier: 1, n: 3 });
    if (rel !== fam) L.push({ t: 'i', fam, tier: 0, n: 5 }); else L.push({ t: 'i', fam, tier: 0, n: 8 });
  }
  const tr = `${SB[1]} · ${p.name}`;
  return (LD_CACHE[id] = { id, fam, sk, kind: SB[0], s, locks: L, tr, p: { cat: p.cat, name: p.name, lon: +p.lon, lat: +p.lat, city: p.city, osm: p.osm } });
}

// un objet est utile s'il entre dans une recette (matériau), se mange, se porte ou décore le Foyer
function ldUseful(d) {
  if (d[1] === 'n' || d[1] === 'v' || d[1] === 'd') return true;
  if (d[1] !== 'm') return false;
  return ld$(() => Object.keys(ING).some(k => ING[k][0].includes(d[2]) && RECIPES.some(r => r.ing.some(x => x[0] === k))), false);
}
// les ingrédients ordinaires de la version pro d'un équipement (métal, verre, lumière…) : ce que le défi rapporte
function ldGearIngs(g) { return ld$(() => { const F = t => RECIPES.find(r => r.kind === 'Équipement' && (x => x && x.g === g && x.tier === t)(xpGearOf({ name: r.out[0] }))), R = F(2) || F(1); return R ? R.ing.map(x => x[0]).filter(k => ING[k] && !/^(xg[pb]_|ldm_|gemme)/.test(k)) : []; }, []); }
// un vrai objet de ce matériau, de préférence trouvé dans ce type de lieu
function ldDefFor(key, cat) {
  const subs = ING[key] ? ING[key][0] : [], ok = d => (d[1] === 'm' || d[1] === 'n') && subs.includes(d[2]) && d[3] <= 2;
  const here = (LOOT[cat] || []).filter(d => ok(d) && !/\{/.test(d[0])); if (here.length) return here[Math.floor(Math.random() * here.length)];
  const all = []; for (const L of Object.values(LOOT)) for (const d of L) if (ok(d) && !/\{/.test(d[0])) all.push(d);
  return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}
// l'espèce liée au défi : son terrain (LD_REQ) et sa région ; sinon le terrain seul ; sinon n'importe laquelle
function ldEggSp(D) {
  const ter = ldReq(D.sk).c[0], rid = ld$(() => regionAt(D.p.lon, D.p.lat).id, '');
  const L = ld$(() => FA_SP, []), a = L.filter(f => (f.ter || []).includes(ter) && f.reg && f.reg[rid]), b = L.filter(f => (f.ter || []).includes(ter));
  const P = a.length ? a : b.length ? b : L; return P.length ? P[Math.floor(Math.random() * P.length)].id : null;
}
// le familier né d'un œuf de forme locale porte le nom de son lieu
GAME.on('comp:new', e => ld$(() => { const c = e && e.comp; if (!c || !c.from || !c.from.local) return; c.local = c.from.local; save(); setTimeout(() => toast(`✨ ${c.name}, forme locale de « ${c.local} » : on ne la trouve nulle part ailleurs !`), 1500); }));
// ---------- les cadenas ----------
const ldLvl = k => ld$(() => (S.prog[k] || {}).lvl || 1, 1);
const ldMatN = nm => S.inv.filter(it => it && it.name === nm).length;
function ldOpen(L, k) {
  switch (L.t) {
    case 'g': return !!ld$(() => ppOwned(k, L.g, L.tier), null);
    case 'c': return !!k && ld$(() => faCompTer(k).ter.includes(L.ter), false) && ldLvl(k) >= L.lvl;
    case 'l': return !!k && ldLvl(k) >= L.lvl;
    case 'm': return L.m === 'nuit' ? isNight() : season() === L.m;
    case 'i': return ldMatN(LD_FAM[L.fam].mats[L.tier]) >= L.n;
  }
  return false;
}
const LD_MNM = { nuit: 'De nuit', hiver: 'En hiver', 'été': 'En été', automne: 'En automne', printemps: 'Au printemps' };
function ldLabel(L) {
  switch (L.t) {
    case 'g': return ld$(() => xpGearDef(L.g, L.tier)[0], L.g);
    case 'c': return `Familier ${ld$(() => FA_TER[L.ter][1].toLowerCase(), L.ter)} niveau ${L.lvl}`;
    case 'l': return `Un familier niveau ${L.lvl}`;
    case 'm': return LD_MNM[L.m] || L.m;
    case 'i': return `${L.n} × ${LD_FAM[L.fam].mats[L.tier]}`;
  }
  return '';
}
function ldHint(L, k) {
  switch (L.t) {
    case 'g': return L.tier >= 3 ? 'À fabriquer à l’atelier : il faut la version pro, plus une gemme' : L.tier === 2 ? 'Version pro à fabriquer à l’atelier' : 'À fabriquer à l’atelier du Foyer';
    case 'c': return ld$(() => faCompTer(k).ter.includes(L.ter), false) ? `${faNm(k)} doit encore monter : niveau ${ldLvl(k)} sur ${L.lvl}` : `Il faut envoyer un familier qui vit ${ld$(() => FA_TER[L.ter][2], '')}, assez fort`;
    case 'l': return `${faNm(k)} est niveau ${ldLvl(k)} : voyages et repas le font monter`;
    case 'm': return L.m === 'nuit' ? 'Revenez partir entre 21 h et 6 h' : `Ce lieu ne s’ouvre qu’${(LD_MNM[L.m] || '').toLowerCase().replace(/^en /, 'en ').replace(/^au /, 'au ')}`;
    case 'i': return `Vous en avez ${ldMatN(LD_FAM[L.fam].mats[L.tier])}. Se trouve dans les lieux à défi ${'★'.repeat(L.tier + 1)} « ${LD_FAM[L.fam].nm.toLowerCase()} »`;
  }
  return '';
}
const ldState = (D, k) => { const o = D.locks.map(L => ldOpen(L, k)); return { o, n: o.filter(Boolean).length, all: o.every(Boolean) }; };

// ---------- dessins ----------
const LD_LOCK = (open, col) => `<svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true">${open ? `<path d="M4.5 8V5.5a3.5 3.5 0 0 1 6.8-1.2" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/>` : `<path d="M4.5 8V5.5a3.5 3.5 0 0 1 7 0V8" fill="none" stroke="${col}" stroke-width="2"/>`}<rect x="2" y="8" width="12" height="9" rx="2" fill="${open ? 'none' : col}" stroke="${col}" stroke-width="1.8"/></svg>`;
const LD_GLYPH = {
  ancien: '<path d="M3 9l9-5 9 5zM5.5 9v9M10 9v9M14 9v9M18.5 9v9M3 20h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  eau: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  hauteur: '<path d="M2 20L9 7l4 6 3-4 6 11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  nature: '<path d="M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};
// une icône par type de lieu (avant, tous les lieux « anciens » avaient une église)
const ldP = d => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
const LD_SG = {
  place_of_worship: ldP('M4 20V10l8-6 8 6v10M9 20v-5h6v5M12 4V1M10.5 2.5h3'),
  wayside_shrine: ldP('M7 21V9l5-5 5 5v12zM10 21v-6h4v6M12 7v4M10.5 9h3'),
  castle: ldP('M5 21V9h2V6h2v3h2V6h2v3h2V6h2v3h2v12zM10 21v-4a2 2 0 0 1 4 0v4'),
  fort: ldP('M3 21V11l3-2 3 2V7h6v4l3-2 3 2v10zM10 21v-4a2 2 0 0 1 4 0v4'),
  ruins: ldP('M3 21h18M5 21V8h4v13M5 8l1-2 1 1 2-1M14 21v-8l2-2 3 1v9'),
  monument: ldP('M10 20l1-14 1-3 1 3 1 14zM6 21h12'),
  memorial: ldP('M10 20l1-14 1-3 1 3 1 14zM6 21h12'),
  attraction: ldP('M12 3l2.6 5.6 6 .7-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.7z'),
  musee: ldP('M3 9l9-5 9 5zM5.5 9v9M10 9v9M14 9v9M18.5 9v9M3 20h18'),
  mairie: ldP('M4 21V11h16v10M2 11l10-5 10 5M12 6V2l4 1-4 1M10 21v-5h4v5'),
  bibliotheque: ldP('M12 6C9 4 5 4 3 5v14c2-1 6-1 9 1 3-2 7-2 9-1V5c-2-1-6-1-9 1zM12 6v14'),
  archaeological_site: ldP('M9 3h6M10 3v3c-3 1-4 4-4 7s2 6 6 8c4-2 6-5 6-8s-1-6-4-7V3'),
  windmill: ldP('M10 21l1-9h2l1 9zM12 11L6 5M12 11l6-6M12 11l-6 6M12 11l6 6'),
  watermill: ldP('M12 5a7 7 0 1 1 0 14a7 7 0 1 1 0-14zM12 5v14M5 12h14M7 7l10 10M17 7L7 17'),
  city_gate: ldP('M4 21V6h16v15M9 21v-5a3 3 0 0 1 6 0v5M4 6V3h3v3M10.5 6V3h3v3M17 6V3h3v3'),
  tower: ldP('M8 21V8h8v13M7 8l5-5 5 5M11 12h2M11 16h2'),
  theatre: ldP('M5 4h14v7a7 7 0 0 1-14 0zM9 13c1.5 1.5 4.5 1.5 6 0M8.5 8.5h1.5M14 8.5h1.5'),
  lake: ldP('M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0'),
  river: ldP('M8 3c-4 5 6 7 2 11s-1 7 0 7M15 3c-4 5 6 7 2 11s-1 7 0 7'),
  waterfall: ldP('M4 3h16M8 3v10M12 3v13M16 3v10M4 19c2-1.5 4-1.5 6 0s4 1.5 6 0 3-1 4-.5'),
  dam: ldP('M4 20V5h16v15M4 10h16M4 15h16M10 5v5M14 10v5M10 15v5'),
  port: ldP('M12 3a2 2 0 1 1 0 4a2 2 0 1 1 0-4zM12 7v14M8 11h8M4 14c0 4 4 7 8 7s8-3 8-7'),
  plage: ldP('M3 11a9 7 0 0 1 18 0zM12 11v10M4 21h16'),
  phare: ldP('M9 21l1-12h4l1 12zM10 9V5h4v4M7 21h10M3 5l4 1M21 5l-4 1'),
  peak: ldP('M2 20L9 7l4 6 3-4 6 11z'),
  saddle: ldP('M2 20L7 8l5 7 5-7 5 12z'),
  hut: ldP('M3 12l9-8 9 8M5 10v11h14V10M10 21v-5h4v5'),
  trailhead: ldP('M12 3v18M12 5h7l2 2-2 2h-7M12 11H5l-2 2 2 2h7'),
  belvedere: ldP('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 1 0 6a3 3 0 1 1 0-6z'),
  foret: ldP('M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5'),
  parc: ldP('M12 22v-8M12 4a5 5 0 1 1 0 10a5 5 0 1 1 0-10z'),
  jardin: ldP('M12 21v-9M12 6a3 3 0 1 1 0 6a3 3 0 1 1 0-6zM12 18c-2-2-5-2-6 0M12 18c2-2 5-2 6 0'),
  camping: ldP('M2 21L12 4l10 17zM12 21l-3-6h6z'),
  ferme: ldP('M3 21V10l9-6 9 6v11zM8 21v-6h8v6M8 15l8 6M16 15l-8 6'),
  zoo: '<path d="M12 12c-3 0-5 3-5 5.5S9 21 12 21s5-1 5-3.5-2-5.5-5-5.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="5.5" cy="10" r="2" fill="currentColor"/><circle cx="18.5" cy="10" r="2" fill="currentColor"/><circle cx="9" cy="5" r="2" fill="currentColor"/><circle cx="15" cy="5" r="2" fill="currentColor"/>',
};
const LD_SGA = {'opera': 'theatre', 'pond': 'lake', 'reservoir': 'lake', 'stream': 'river', 'weir': 'dam', 'lock_gate': 'dam', 'alpine_hut': 'hut', 'wilderness_hut': 'hut'};
const ldGlyph = D => LD_SG[D.sk] || LD_SG[LD_SGA[D.sk]] || LD_GLYPH[D.fam];
function ldMarkHTML(D, st) {
  const left = D.locks.length - st.n, ok = st.all;
  return `<span class="ld-s">${'<i></i>'.repeat(D.s)}</span><span class="ld-c" style="--c:${LD_FAM[D.fam].col}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">${ldGlyph(D)}</svg></span><span class="ld-pk${ok ? ' ok' : ''}">${LD_LOCK(ok, '#fff')}${ok ? '' : left}</span>`;
}

// ---------- sur la carte ----------
let ldMk = new Map(), ldList = [];
function ldCandidates() {
  if (!map || !mapReady) return [];
  if (mapMode === 'tiles') {
    let feats = []; try { feats = map.queryRenderedFeatures({ layers: ['poi-hit'] }); } catch (e) { feats = []; }
    const out = [];
    for (const f of feats) {
      const p = f.properties || {}, cat = OSM_CAT[p.subclass] || OSM_CAT[p.class], name = p['name:fr'] || p.name;
      if (!cat || !name || !LD_CAT[cat] || f.geometry.type !== 'Point') continue;
      const g = f.geometry.coordinates; out.push({ cat, name, lon: g[0], lat: g[1], osm: { class: p.class || '', subclass: p.subclass || '' } });
    }
    return out;
  }
  return ld$(() => fallbackPOIs(), []).filter(p => LD_CAT[p.cat]);
}
function ldShow(D, st) {
  const s = ldSt(); if (s.f === 'masque' || !s.stars.includes(D.s)) return false;
  if (s.f === 'ouverts') return st.all;
  if (s.f === 'presque') return !st.all && st.n === D.locks.length - 1;
  return true;
}
// on choisit les défis à montrer en tournant : d'abord un de chaque famille, puis un de chaque type de lieu, puis le reste (jamais plus de 2 du même type)
function ldVaries(near, max) {
  const out = [], used = new Set(), nSk = {}, take = o => { out.push(o); used.add(o.D.id); nSk[o.D.sk] = (nSk[o.D.sk] || 0) + 1; };
  const famSeen = new Set(); for (const o of near) { if (out.length >= max) break; if (!famSeen.has(o.D.fam)) { famSeen.add(o.D.fam); take(o); } }
  for (const o of near) { if (out.length >= max) break; if (!used.has(o.D.id) && !nSk[o.D.sk]) take(o); }
  for (const o of near) { if (out.length >= max) break; if (!used.has(o.D.id) && (nSk[o.D.sk] || 0) < 2) take(o); }
  return out;
}
function ldRefresh() {
  if (!map || !mapReady) return;
  const z = map.getZoom(), seen = new Set(), c = map.getCenter();
  const all = z < 12 ? [] : ldCandidates().map(ldOf).filter(Boolean);
  const uniq = [...new Map(all.map(D => [D.id, D])).values()];
  ldList = uniq;
  const k = S.sel;
  const near = uniq.map(D => ({ D, st: ldState(D, k) })).filter(o => ldShow(o.D, o.st))
    .sort((a, b) => kmExact({ lon: c.lng, lat: c.lat }, a.D.p) - kmExact({ lon: c.lng, lat: c.lat }, b.D.p))
    ;
  const vis = ldVaries(near, z < 14 ? 8 : 12);
  for (const { D, st } of vis) {
    seen.add(D.id);
    let m = ldMk.get(D.id);
    const html = ldMarkHTML(D, st);
    if (!m) {
      const el = document.createElement('div'); el.className = 'ld-mk'; el.dataset.ld = D.id; el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ldFiche(D.id); } }); el.setAttribute('aria-label', `${D.kind} à défi, ${D.s} étoile${D.s > 1 ? 's' : ''} : ${D.p.name}`);
      el.innerHTML = html; el._h = html;
      el.addEventListener('click', ev => { ev.stopPropagation(); ldFiche(D.id); });
      m = new maplibregl.Marker({ element: el, anchor: 'bottom', opacity: '1', opacityWhenCovered: '1' }).setLngLat([D.p.lon, D.p.lat]).addTo(map); ldMk.set(D.id, m);
      ld$(() => m.setOpacity && m.setOpacity('1', '1'));
    } else if (m.getElement()._h !== html) { m.getElement().innerHTML = html; m.getElement()._h = html; }
  }
  for (const [id, m] of ldMk) if (!seen.has(id)) { m.remove(); ldMk.delete(id); }
  ldFiltBtn();
}
refreshPOIs = (orig => function () { const r = orig.apply(this, arguments); ld$(() => { clearTimeout(ldRefresh._t); ldRefresh._t = setTimeout(ldRefresh, 120); }); return r; })(refreshPOIs);
renderAll = (orig => function () { const r = orig.apply(this, arguments); ld$(() => { clearTimeout(ldRefresh._u); ldRefresh._u = setTimeout(ldRefresh, 200); }); return r; })(renderAll);
// la carte écoute « moveend » avec l'ancienne fonction (branchée avant ce fichier) : on s'y abonne nous-mêmes
ld$(() => { if (map) { map.on('moveend', () => { clearTimeout(ldRefresh._m); ldRefresh._m = setTimeout(ldRefresh, 150); }); map.on('load', () => setTimeout(ldRefresh, 400)); } });
setInterval(() => ld$(() => { if (mapReady && !document.hidden && (!$('ldFilt') || !ldList.length)) ldRefresh(); }), 2500);

// ---------- le filtre ----------
const LD_F = [['tout', 'Tous les défis'], ['ouverts', 'Tous cadenas ouverts'], ['presque', 'Il manque un cadenas'], ['masque', 'Masquer les défis']];
function ldFiltBtn() {
  let b = $('ldFilt');
  if (!b) {
    const host = document.querySelector('.zoom') || ($('map') && $('map').parentElement); if (!host) return;
    b = document.createElement('div'); b.id = 'ldFilt'; host.appendChild(b);
    b.addEventListener('click', ev => {
      const t = ev.target.closest('button'); if (!t) return; ev.stopPropagation(); const s = ldSt();
      if (t.dataset.ldo) { b.classList.toggle('on'); return; }
      if (t.dataset.ldf) s.f = t.dataset.ldf;
      if (t.dataset.lds) { const n = +t.dataset.lds; s.stars = s.stars.includes(n) ? s.stars.filter(x => x !== n) : s.stars.concat(n).sort(); if (!s.stars.length) s.stars = [n]; }
      save(); ldRefresh(); b.classList.add('on');
    });
  }
  const s = ldSt(), n = ldList.length;
  const html = `<button class="ld-fb" data-ldo="1" aria-label="Filtrer les lieux à défi">${LD_LOCK(false, '#4a3528')}<b>Défis</b>${s.f !== 'tout' ? '<i></i>' : ''}</button>
  <div class="ld-fm"><span>${n} lieu${n > 1 ? 'x' : ''} à défi ici</span>${LD_F.map(([id, nm]) => `<button data-ldf="${id}" class="${s.f === id ? 'sel' : ''}">${nm}</button>`).join('')}<div class="ld-st">${[1, 2, 3].map(x => `<button data-lds="${x}" class="${s.stars.includes(x) ? 'sel' : ''}" aria-label="${x} étoile${x > 1 ? 's' : ''}">${'★'.repeat(x)}</button>`).join('')}</div></div>`;
  if (b._h !== html) { const on = b.classList.contains('on'); b.innerHTML = html; b._h = html; if (on) b.classList.add('on'); }
}
document.addEventListener('click', ev => { const b = $('ldFilt'); if (b && b.classList.contains('on') && !b.contains(ev.target)) b.classList.remove('on'); });

// ---------- la fiche ----------
function ldFiche(id) {
  const D = LD_CACHE[id]; if (!D) return;
  const k = S.sel, st = ldState(D, k), s = ldSt(), F = LD_FAM[D.fam], done = s.done[id] || 0;
  const locks = D.locks.map((L, i) => `<li class="${st.o[i] ? 'op' : ''}">${LD_LOCK(st.o[i], st.o[i] ? '#3f7f3a' : '#4a3528')}<span><b>${esc(ldLabel(L))}</b>${L.why ? `<em class="ld-why">${esc(L.why)}</em>` : ''}${st.o[i] ? '' : `<small>${esc(ldHint(L, k))}</small>`}</span></li>`).join('');
  const mat = F.mats[D.s - 1];
  showModal(`<div class="ld-f">
    <div class="ld-fh" style="--c:${F.col}"><span class="ld-fi"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">${ldGlyph(D)}</svg></span><div><small>${esc(D.kind || F.nm)} · ${'★'.repeat(D.s)}${'☆'.repeat(3 - D.s)}</small><h3>${esc(D.p.name)}</h3></div><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>
    <p class="ld-k">Cadenas · ${st.n} ouvert${st.n > 1 ? 's' : ''} sur ${D.locks.length}${k ? ` pour ${esc(faNm(k))}` : ''}</p>
    <ul class="ld-l">${locks}</ul>
    <p class="ld-k">Ce qu’on y trouve</p>
    <div class="ld-r">${done ? '' : `<div><b>${esc(D.tr)}</b><small>trésor unique, la première fois</small></div>`}<div><b>${esc(mat)}</b><small>matériau ${'★'.repeat(D.s)}, à chaque réussite</small></div><div><b>${D.s + 1} trouvailles du lieu</b><small>toutes utiles : atelier, repas, tenue ou Foyer</small></div>${D.s >= 3 ? '<div><b>Pierre précieuse</b><small>35 % : pour le légendaire</small></div>' : ''}<div><b>${D.s >= 3 ? 'Œuf de forme locale' : 'Œuf de familier'}</b><small>${[0, 3, 10, 25][D.s]} % de chance</small></div></div>
    ${done ? `<p class="ld-n">Déjà réussi ${done} fois.</p>` : ''}
    <div class="ld-b">${st.all ? `<button class="btn green" data-ldgo="${id}">Y aller avec ${esc(faNm(k))}</button>` : `<button class="btn" disabled aria-disabled="true">Encore ${D.locks.length - st.n} cadenas à ouvrir</button>`}</div></div>`);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-ldgo]'); if (!b) return;
  const D = LD_CACHE[b.dataset.ldgo]; if (!D || !ldState(D, S.sel).all) return;
  ld$(() => { $('modal').hidden = true; });
  choosePOI({ ...D.p, ld: D.id });
});
document.addEventListener('click', ev => { const m = $('modal'); if (m && ev.target === m && m.querySelector('.ld-f')) m.hidden = true; });
poiDest = (orig => function (p) { const d = orig.apply(this, arguments); if (p && p.ld) d.ld = p.ld; return d; })(poiDest);

// ---------- départ, retour ----------
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k], d = plan.dest, D = d && d.ld ? LD_CACHE[d.ld] : null;
  const st = D ? ldState(D, k) : null;
  if (D && !st.all && !S.trips[k]) { toast(`Défi fermé : il reste ${D.locks.length - st.n} cadenas pour ${faNm(k)}`); return; }
  const r = orig.apply(this, arguments);
  ld$(() => {
    const t = S.trips[k]; if (!t || t === before || !D) return;
    if (st.all) for (const L of D.locks) if (L.t === 'i') { let n = L.n; const nm = LD_FAM[L.fam].mats[L.tier]; S.inv = S.inv.filter(it => !(n > 0 && it.name === nm && n--)); }
    t.ld = { id: D.id, ok: st.all };
    save();
  });
  return r;
})(startTrip);
GAME.on('trip:return', e => ld$(() => {
  const t = e && e.trip; if (!t || !t.ld) return;
  const D = LD_CACHE[t.ld.id] || null, s = ldSt(); if (!D) return;
  const F = LD_FAM[D.fam], got = [], k = e.who;
  const give = (nm, tier, n) => { for (let i = 0; i < n; i++) S.inv.push(makeItem([nm, 'm', 'defi', tier, null, F.col], 0, D.p.name, ['defi'], { fixed: tier })); got.push(`${n > 1 ? n + ' × ' : ''}${nm}`); };
  if (t.ld.ok) {
    give(F.mats[D.s - 1], D.s, D.s === 1 ? 1 + (Math.random() < .5 ? 1 : 0) : 1);
    if (D.s >= 2 && Math.random() < .5) give(F.mats[D.s - 2], D.s - 1, 1);
    if (!s.done[D.id]) { const it = makeItem([D.tr, 'd', 'tresor', D.s + 1, null, F.col], 0, D.p.name, ['defi', 'tresor'], { fixed: D.s + 1 }); it.special = true; it.tresor = true; S.inv.push(it); got.unshift(`le trésor « ${D.tr} » (trophée pour la vitrine du Foyer : confort doublé)`); }
    // v194 : des objets DU LIEU (ses vraies trouvailles), mais seulement ceux qui servent à quelque chose :
    //  matériau d'une recette, nourriture (repas, cuisine), vêtement (à porter), décoration (Foyer). Rien « à vendre » seulement.
    ld$(() => {
      const pool = lootTable([D.p.cat]).map(x => x.d).filter(d => !/\{/.test(d[0]) && ldUseful(d));
      for (let i = 0; i < D.s + 1 && pool.length; i++) { const it = makeItem(pool[Math.floor(Math.random() * pool.length)], 0.6 * D.s, D.p.name, [D.p.cat, 'defi']); S.inv.push(it); const u = ld$(() => itemUses(it)[0].txt, ''); got.push(u ? `${it.name} (${u.toLowerCase()})` : it.name); }
      if (D.s >= 3 && Math.random() < 0.35 && typeof famGemItem === 'function') { const it = famGemItem(D.p, D.p.name); S.inv.push(it); got.push(`${it.name} (pierre précieuse : équipement légendaire)`); }
    });
    // les familiers : de temps en temps seulement (★ 3 %, ★★ 10 %, ★★★ 25 % : forme locale du lieu)
    ld$(() => { if (Math.random() < [0, 0.03, 0.10, 0.25][D.s]) { const sp = ldEggSp(D); if (!sp) return; const local = D.s >= 3 ? D.p.name : null;
      addEgg({ sp, rarity: D.s >= 3 ? 3 : 2, from: { how: 'defi', place: D.p.name, local } }); const e = S.eggs[S.eggs.length - 1]; if (e) e.known = true;
      got.unshift(local ? `un œuf rare : ${ld$(() => spName(sp), sp)} forme locale « ${local} » !` : `un œuf de ${ld$(() => spName(sp), sp)} !`); } });
    s.done[D.id] = (s.done[D.id] || 0) + 1;
    ld$(() => addXP(k, 12 * D.s * D.s, 'défi'));
  }
  save();
  const html = `<div class="nsfind ld-win"><span class="ld-wi">${LD_LOCK(t.ld.ok, t.ld.ok ? '#3f7f3a' : '#4a3528')}</span><div><span class="nsfk">Défi réussi · ${'★'.repeat(D.s)}</span><b>${esc(D.p.name)}</b><span>${got.length ? 'Rapporté : ' + esc(got.join(', ')) + '.' : 'Rien cette fois : il manquait des cadenas.'}</span></div></div>`;
  const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox');
  if (box && box.querySelector('.haul')) { const btn = box.querySelector('button[data-closemodal]'); if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
  else toast(t.ld.ok ? `Défi réussi : ${D.p.name} !` : `Tentative à ${D.p.name} : ${got.length ? got.join(', ') : 'rien cette fois'}`);
}));
// la fiche de départ rappelle les cadenas
trjDecorate = (orig => function (box) {
  const r = orig.apply(this, arguments);
  ld$(() => {
    if (!box) return; const old = box.querySelector('.ld-tip');
    const d = plan.dest, D = d && d.ld ? LD_CACHE[d.ld] : null;
    if (!D || S.trips[S.sel]) { if (old) old.remove(); return; }
    const st = ldState(D, S.sel), miss = D.locks.filter((L, i) => !st.o[i]).map(ldLabel);
    ld$(() => { const go = box.querySelector('#goBtn') || $('goBtn'); if (go) { go.disabled = !st.all; go.style.opacity = st.all ? '' : '.55'; } });
    const h = `<div class="ld-tip">${D.locks.map((L, i) => LD_LOCK(st.o[i], st.o[i] ? '#3f7f3a' : '#4a3528')).join('')}<span><b>Défi ${'★'.repeat(D.s)}</b> · ${st.all ? 'tous les cadenas sont ouverts' : 'départ impossible, il manque : ' + esc(miss.join(', '))}</span></div>`;
    if (old) { if (old.outerHTML !== h) old.outerHTML = h; return; }
    const a = box.querySelector('.fa-tip') || box.querySelector('.sct-tip') || box.querySelector('.trjline'); if (a) a.insertAdjacentHTML('afterend', h);
  });
  return r;
})(trjDecorate);

(function ldStyle() {
  const st = document.createElement('style'); st.id = 'ldStyle';
  st.textContent = `.maplibregl-marker.ld-mk,.ld-mk{width:30px!important;height:34px!important;padding:0!important;margin:0;border:0!important;background:none!important;box-shadow:none!important;min-height:0!important;cursor:pointer;display:block;opacity:1!important}
.ld-mk:focus-visible{outline:3px solid #e8b13a;outline-offset:3px;border-radius:50%}
.ld-c{position:absolute;left:1px;bottom:0;width:28px;height:28px;border-radius:50%;background:#fffaf0;border:2px solid var(--c);color:var(--c);display:grid;place-items:center;box-shadow:0 2px 5px rgba(74,53,40,.28)}
.ld-s{position:absolute;left:0;right:0;top:0;display:flex;justify-content:center;gap:2px;z-index:1}.ld-s i{width:5px;height:5px;border-radius:50%;background:#e8b13a;box-shadow:0 0 0 1.2px #fffaf0}
.ld-why{display:block;font-style:italic;font-size:12px;color:#7a6450;margin-top:1px}
.ld-pk{position:absolute;right:-17px;bottom:-1px;z-index:1;display:flex;align-items:center;gap:1px;height:14px;padding:0 4px 0 3px;border-radius:8px;background:#4a3528;color:#fff;font:800 9.5px/1 var(--body,system-ui);box-shadow:0 0 0 1.5px #fffaf0}
.ld-pk svg{width:7px;height:8px}.ld-pk.ok{background:#3f7f3a;padding:0 3px;right:-11px}
#ldFilt{position:relative;z-index:6;font-family:inherit}
.zoom #ldFilt{margin-top:6px}
.ld-fb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:44px;height:44px;padding:0;border-radius:14px;border:2.5px solid #4a3528;box-shadow:0 3px 0 #4a3528;background:#fffaf0;font:800 10px var(--body,system-ui);color:#4a3528;position:relative}
.ld-fb svg{width:16px;height:18px}
.ld-fb i{position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#e5584f;border:2px solid #fffaf0}
.ld-fm{display:none;position:absolute;right:calc(100% + 8px);top:0;background:#fffaf0;border:2px solid #4a3528;border-radius:14px;padding:6px;width:200px;box-shadow:0 6px 16px rgba(74,53,40,.2)}
#ldFilt.on .ld-fm{display:flex;flex-direction:column;gap:3px}
.ld-fm>span{font-size:11.5px;color:#7a6250;padding:2px 6px 4px}
.ld-fm button{text-align:left;border:0;background:none;border-radius:9px;padding:8px 9px;min-height:38px;font:700 13px var(--body,system-ui);color:#4a3528}
.ld-fm button.sel{background:#f2e6cc}
.ld-st{display:flex;gap:4px;border-top:1px solid #eadcc4;padding-top:5px;margin-top:2px}.ld-st button{flex:1;text-align:center;color:#c8902a;opacity:.45}.ld-st button.sel{opacity:1;background:#fff3c4}
.ld-f{width:100%;text-align:left}.ld-f h3{margin:0;font:800 22px/1.1 var(--display,inherit)}
.ld-x{margin-left:auto;align-self:flex-start;flex:none;width:44px;height:44px;border-radius:50%;border:2px solid #4a3528;background:#fffaf0;display:grid;place-items:center;position:sticky;top:0}
.ld-fh{display:flex;align-items:center;gap:10px;margin-bottom:6px}.ld-fh small{font-size:12px;font-weight:700;color:var(--c)}
.ld-fi{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#fffaf0;border:2px solid var(--c);color:var(--c);flex:none}
.ld-k{margin:12px 0 6px;font-size:12px;font-weight:800;color:#8a6a50}
.ld-l{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.ld-l li{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:#fbf3e4;border:1.5px solid #eadcc4}
.ld-l li.op{background:#eef7e8;border-color:#cfe6c2}.ld-l li svg{flex:none;margin-top:2px;width:16px;height:18px}
.ld-l span{display:flex;flex-direction:column}.ld-l b{font-size:14px}.ld-l small{font-size:12px;color:#7a6250}
.ld-r{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px}.ld-r div{padding:8px 10px;border-radius:12px;background:#fff3c4;display:flex;flex-direction:column}.ld-r b{font-size:13.5px}.ld-r small{font-size:11.5px;color:#7a6250}
.ld-n{font-size:12.5px;color:#7a6250;margin:10px 0 0}
.ld-b{display:flex;gap:8px;margin-top:12px;position:sticky;bottom:-20px;padding:10px 0 4px;background:var(--paper,#fffaf0)}.ld-b .btn{flex:1}.ld-b .btn[disabled]{opacity:.6;cursor:not-allowed}
.ld-tip{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:6px 0;padding:7px 10px;border-radius:12px;background:#fbf3e4;border:1.5px solid #eadcc4;font-size:12.5px;line-height:1.35}
.ld-tip span{flex:1;min-width:170px}
.ld-win .ld-wi{flex:none;width:46px;display:grid;place-items:center}.ld-win .ld-wi svg{width:28px;height:32px}`;
  document.head.appendChild(st);
})();
window.__ld = { of: p => ldOf(p), st: (id, k) => ldState(LD_CACHE[id], k || S.sel), list: () => ldList, fiche: id => ldFiche(id), refresh: () => ldRefresh(), cache: LD_CACHE };

// ================= COLLECTION DE COMPAGNONS (v13, phase A) =================
// « Explore le vrai monde pour trouver, élever et échanger des compagnons uniques. »
// Chaque compagnon possédé est un INDIVIDU : S.comps[id] = { id, sp, name, genes, rarity, hybrid, born, from, fem }.
// L'équipe (S.team, 3 au plus) s'affiche dans le HUD et voyage ; les autres vivent au refuge.
// Ce fichier fournit : spOf, compLook, addComp, teamIds, l'œuf mystère du premier lancement, les œufs (S.eggs),
// la carte d'action de l'écran principal, le menu (récompenses, événement du jour, réglages) et le refuge.
// Dessin : l'agent ART fournit SPECIES, randomGenes, mixGenes, geneRarity, compLookDefault et drawEgg (01_draw_chars.js) ;
// tant qu'ils manquent, on se replie sur des valeurs simples (voir les appels protégés par typeof).

// ---------- les espèces ----------
const SP_IDS = ['panda', 'capy', 'axo', 'renard', 'fennec', 'tanuki', 'paresseux', 'lemur', 'phoque', 'quokka'];
const SP_STARTERS = ['panda', 'capy', 'axo'];
// tpl : ancien compagnon servant de modèle (champs attendus par le code, et dessin provisoire tant que l'agent ART n'a pas fini)
// temper : décision sans réponse du joueur (0 audace, 1 prudence, 2 troisième voie, 'eau' : audace près de l'eau)
const SP_INFO = {
  panda: { name: 'Panda roux', art: 'un panda roux', tpl: 'pistache', temper: 0, hab: ['foret', 'montagne'], tint: '#ffe1cc',
    names: ['Pistache', 'Noisette', 'Cannelle', 'Praline', 'Myrtille', 'Paprika', 'Biscotte', 'Caramel', 'Muscade', 'Gingembre', 'Châtaigne', 'Rouquine'] },
  capy: { name: 'Capybara', art: 'un capybara', tpl: 'mochi', temper: 1, hab: ['lac', 'campagne'], tint: '#f3e6d3',
    names: ['Mochi', 'Tofu', 'Galet', 'Brioche', 'Sésame', 'Pépite', 'Nougat', 'Flan', 'Coton', 'Bambou', 'Yuzu', 'Patate'] },
  axo: { name: 'Axolotl', art: 'un axolotl', tpl: 'bulle', temper: 'eau', hab: ['mer', 'lac', 'ile'], tint: '#ffe0ea',
    names: ['Bulle', 'Perle', 'Ondine', 'Corail', 'Sirop', 'Bonbon', 'Guimauve', 'Lagon', 'Nacre', 'Framboise', 'Plouf', 'Rosée'] },
  renard: { name: 'Renard polaire', art: 'un renard polaire', tpl: 'pistache', temper: 0, hab: ['neige', 'montagne'], tint: '#e4f0fa',
    names: ['Flocon', 'Givre', 'Frimas', 'Cristal', 'Blizzard', 'Glaçon', 'Aurore', 'Banquise', 'Nuage', 'Lumi'],
    perso: 'Rêveur', bio: 'Son pelage change avec les saisons. Il adore la neige fraîche, les étoiles et les histoires du Grand Nord, mais le soleil trop chaud le fatigue.',
    love: 'la neige, le poisson grillé, le fromage, les aurores boréales', hate: 'la chaleur, les agrumes trop acides',
    lines: { hello: ['Il neige dans ma tête !', 'On part vers le Nord ?'], pet: ['Mmh, tout doux…', 'Encore, derrière les oreilles !'], click: ['Hihi !', 'Brrr, ça chatouille !'], wake: ['Hein ? Il neige ?', 'Je rêvais d’une aurore boréale…'], idle: ['Chut… j’écoute la neige tomber.'],
      love: 'Du poisson grillé ! Mon préféré !', like: 'Miam, merci !', hate: 'Oh non… c’est trop acide.',
      tap: ['Tu as vu ? Il neige dans ma tête !', 'Ma queue est une écharpe. Pratique, non ?', 'On va voir les étoiles ce soir ?', 'Brrr… j’adore le froid !', 'Un petit poisson grillé ? Juste un.', 'Chut… j’écoute la neige tomber.'],
      night: ['…zzz… flocon… zzz…', 'Je rêvais d’une aurore boréale…'], away: ['Il fait frais ici, c’est parfait !', 'Je laisse des traces de pattes partout !'] } },
  fennec: { name: 'Fennec', art: 'un fennec', tpl: 'pistache', temper: 2, hab: ['desert'], tint: '#fbebd2',
    names: ['Sable', 'Dune', 'Mirage', 'Safran', 'Datte', 'Oasis', 'Cumin', 'Sirocco', 'Ambre', 'Biscuit'],
    perso: 'Malicieux', bio: 'Ses immenses oreilles entendent tout, même les secrets. Il adore les dattes, le sable chaud et les longues siestes à l’ombre.',
    love: 'les dattes, les douceurs, le sable chaud', hate: 'le froid, les glaces',
    lines: { hello: ['Mes oreilles t’ont entendu arriver !'], pet: ['Les oreilles ! Gratte les oreilles !'], click: ['Hihi !'], wake: ['Hein ? J’entendais un secret…'], idle: ['Le sable chaud, c’est comme un câlin.'],
      love: 'Une douceur ! Je la garde pour moi tout seul.', like: 'Merci !', hate: 'Brrr, c’est glacé…',
      tap: ['Mes oreilles entendent ton cœur ! Boum, boum !', 'Tu as une datte ? Je sens une datte.', 'Le sable chaud, c’est comme un câlin.', 'Je connais un secret… mais chut !', 'On part vers le soleil ?'],
      night: ['…zzz… une oasis… zzz…', 'Les étoiles du désert sont les plus belles.'], away: ['Il fait chaud, j’adore !', 'J’entends des choses incroyables par ici !'] } },
  tanuki: { name: 'Tanuki', art: 'un tanuki', tpl: 'pistache', temper: 2, hab: ['foret', 'ville'], tint: '#efe5dc',
    names: ['Daifuku', 'Kinako', 'Matcha', 'Azuki', 'Miso', 'Dango', 'Nori', 'Kaki', 'Sakura', 'Edamame'],
    perso: 'Gourmand', bio: 'Un petit filou au masque noir, qui adore les festins, les feuilles qui volent et les farces. Il se déguise souvent… pour goûter deux fois.',
    love: 'les festins, le pain, les légumes, les gâteaux', hate: 'les agrumes, sauter un repas',
    lines: { hello: ['Tu as apporté le goûter ?'], pet: ['Mmh… encore un peu…'], click: ['Hihi, une farce !'], wake: ['Le repas est prêt ?'], idle: ['Ça sent bon par ici…'],
      love: 'Un festin ! Je goûte tout, deux fois !', like: 'Miam, merci !', hate: 'Beurk… trop acide.',
      tap: ['Tu as faim ? Moi, toujours.', 'Je me suis déguisé en feuille. Tu m’as vu ?', 'Un festin ce soir ? Je m’occupe du dessert !', 'Hihi, je t’ai fait une farce… je crois.'],
      night: ['…zzz… encore une part… zzz…'], away: ['Il y a des choses délicieuses par ici !', 'J’ai trouvé un marché, je goûte tout !'] } },
  paresseux: { name: 'Paresseux', art: 'un paresseux', tpl: 'mochi', temper: 1, hab: ['foret', 'ile'], tint: '#efe8dc',
    names: ['Pantoufle', 'Doudou', 'Câlin', 'Moka', 'Papaye', 'Mangue', 'Tapioca', 'Liane', 'Cajou', 'Velours'],
    perso: 'Très calme', bio: 'Il prend son temps pour tout : manger, marcher, sourire. Mais quand il sourit, toute la forêt sourit avec lui.',
    love: 'les fruits, les feuilles tendres, les hamacs, la pluie douce', hate: 'se presser, les boissons trop chaudes',
    lines: { hello: ['Bon…jour…'], pet: ['Mmmh… parfait…'], click: ['Oh… coucou…'], wake: ['…Déjà… ?'], idle: ['Rien… ne… presse…'],
      love: 'Un… fruit… Merci… infiniment…', like: 'Merci… c’est… gentil…', hate: 'Trop… chaud…',
      tap: ['Bon…jour…', 'On… se… fait… un… câlin… ?', 'Rien… ne… presse…', 'Une… mangue… ? Mmmh…', 'Je… t’aime… bien…'],
      night: ['…zzz…', '…zzz… hamac… zzz…'], away: ['J’avance… doucement…', 'Quel… beau… voyage…'] } },
  lemur: { name: 'Lémurien', art: 'un lémurien', tpl: 'pistache', temper: 0, hab: ['foret', 'ile'], tint: '#ecebf1',
    names: ['Vanille', 'Litchi', 'Tamarin', 'Zeste', 'Badiane', 'Girofle', 'Ylang', 'Coco', 'Zébulon', 'Rayure'],
    perso: 'Acrobate', bio: 'Il saute de branche en branche avec sa grande queue rayée. Le matin, il prend un bain de soleil, les bras grands ouverts.',
    love: 'les fruits, les agrumes, les bains de soleil', hate: 'le fromage, la pluie froide',
    lines: { hello: ['Hop ! Me voilà !'], pet: ['Hihi, encore !'], click: ['Hop !'], wake: ['Déjà le soleil ?'], idle: ['Bain de soleil… Ahhh.'],
      love: 'Un fruit ! Hop, dans ma bouche !', like: 'Merci !', hate: 'Beurk, ça sent fort…',
      tap: ['Regarde ma queue ! Douze rayures !', 'Bain de soleil, bras ouverts… Ahhh.', 'Hop ! Hop ! On grimpe ?', 'Un litchi ? Deux litchis ? Trois ?'],
      night: ['…zzz… litchi… zzz…'], away: ['Je saute d’arbre en arbre !', 'Quelle vue d’en haut !'] } },
  phoque: { name: 'Phoque', art: 'un phoque', tpl: 'bulle', temper: 'eau', hab: ['mer', 'neige'], tint: '#e2eef5',
    names: ['Plouf', 'Brume', 'Écume', 'Bigorneau', 'Iceberg', 'Bouée', 'Caillou', 'Galet', 'Vaguelette', 'Morse'],
    perso: 'Joueur', bio: 'Il glisse sur le ventre, applaudit avec ses nageoires et fait des bulles en riant. Il adore les vagues et le poisson frais.',
    love: 'le poisson, les vagues, les glissades', hate: 'les légumes, rester au sec trop longtemps',
    lines: { hello: ['Plouf ! Coucou !'], pet: ['Clap clap ! Encore !'], click: ['Plouf !'], wake: ['On va nager ?'], idle: ['Ça sent la mer… miam !'],
      love: 'Du poisson ! Clap clap clap !', like: 'Merci !', hate: 'Des légumes ? Non merci…',
      tap: ['Plouf ! Tu viens nager ?', 'Clap clap ! Bravo à toi !', 'Une glissade sur le ventre ? Regarde !', 'Ça sent la mer… miam !'],
      night: ['…zzz… les vagues… zzz…'], away: ['L’eau est parfaite !', 'J’ai fait une glissade géante !'] } },
  quokka: { name: 'Quokka', art: 'un quokka', tpl: 'mochi', temper: 2, hab: ['ile', 'campagne'], tint: '#f6e8dc',
    names: ['Risette', 'Pompon', 'Pastèque', 'Gaufre', 'Popcorn', 'Mimosa', 'Cookie', 'Pirouette', 'Grenadine', 'Câpre'],
    perso: 'Souriant', bio: 'C’est l’animal le plus souriant du monde. Il dit bonjour à tout le monde et adore les pique-niques au soleil.',
    love: 'les feuilles croquantes, les pommes, les pique-niques', hate: 'la mer agitée, les grincheux',
    lines: { hello: ['Bonjour ! Bonjour !'], pet: ['Hihi, je souris encore plus !'], click: ['Coucou !'], wake: ['Bonjour le monde !'], idle: ['Souris ! Comme moi !'],
      love: 'Oh, mon préféré ! Merci !', like: 'Merci beaucoup !', hate: 'Hum… non merci.',
      tap: ['Souris ! Comme moi !', 'Un pique-nique ? Oh oui !', 'Bonjour ! Bonjour ! Bonjour !', 'Tu es mon ami. C’est décidé.'],
      night: ['…zzz… pique-nique… zzz…'], away: ['Je dis bonjour à tout le monde !', 'Tout le monde est gentil ici !'] } },
};
const COMP_FROM = { depart: 'Compagnon de départ', oeuf: 'Né d’un œuf', rencontre: 'Rencontré en chemin', magasin: 'Adopté au magasin', quete: 'Reçu en récompense', croisement: 'Né à la nurserie' };

// ---------- fonctions de base (déclarations : utilisables par les fichiers chargés avant celui-ci) ----------
function spOf(k) {
  const c = S && S.comps && S.comps[k];
  if (c && c.sp) return c.sp;
  if (k === 'pistache') return 'panda';
  if (k === 'mochi') return 'capy';
  if (k === 'bulle') return 'axo';
  if (['panda', 'capy', 'axo', 'renard', 'fennec', 'tanuki', 'paresseux', 'lemur', 'phoque', 'quokka'].includes(k)) return k;
  if (typeof SPECIES !== 'undefined' && SPECIES && SPECIES[k]) return k;
  return 'panda';
}
function spName(sp) { try { if (typeof SPECIES !== 'undefined' && SPECIES[sp] && SPECIES[sp].name) return SPECIES[sp].name; } catch (e) {} return (SP_INFO[sp] || SP_INFO.panda).name; }
function spArticle(sp) { return (SP_INFO[sp] || {}).art || ('un ' + spName(sp).toLowerCase()); }
function spHab(k) { return (SP_INFO[spOf(k)] || {}).hab || []; }
function spTemper(k) { const t = (SP_INFO[spOf(k)] || {}).temper; return t === undefined ? 2 : t; }
function spTint(k) { return (SP_INFO[spOf(k)] || {}).tint || '#fff3dc'; }
function compE(k) { const c = S.comps && S.comps[k]; return c && c.fem ? 'e' : ''; } // accord : « rentré » / « rentrée »
function compIds() { return Object.keys(S.comps || {}); }
function teamIds() { return (S.team || []).filter(k => S.comps && S.comps[k]); }
function compName(k) { return CHARS[k] ? CHARS[k].name : ''; }
// gènes par défaut d'une espèce (ceux de Pistache, Mochi et Bulle pour leurs espèces)
function defaultGenes(sp) {
  try { if (typeof compLookDefault === 'function') { const d = compLookDefault(sp); if (d && d.genes) return { ...d.genes }; if (d && typeof d === 'object' && !d.sp) return { ...d }; } } catch (e) {}
  try { if (typeof SPECIES !== 'undefined' && SPECIES[sp] && SPECIES[sp].defGenes) return { ...SPECIES[sp].defGenes }; } catch (e) {}
  return null;
}
// compLook(key) → { sp, genes, hybrid } : ce que l'agent ART dessine pour ce compagnon
function compLook(key) {
  const c = S && S.comps && S.comps[key];
  if (c) return { sp: c.sp, genes: c.genes || defaultGenes(c.sp), hybrid: c.hybrid || null };
  try { if (typeof compLookDefault === 'function') { const d = compLookDefault(key); if (d && d.sp) return d; } } catch (e) {}
  const sp = spOf(key);
  return { sp, genes: defaultGenes(sp), hybrid: null };
}
function geneRarityOf(genes, sp) {
  if (!genes || typeof geneRarity !== 'function') return 0;
  for (const args of [[genes, sp], [sp, genes]]) {
    try { const r = geneRarity(...args); const v = typeof r === 'number' ? r : r && typeof r.rarity === 'number' ? r.rarity : NaN; if (isFinite(v)) return Math.max(0, Math.min(4, Math.round(v))); } catch (e) {}
  }
  return 0;
}
function rollGenes(sp, luck = 0) {
  try { if (typeof randomGenes === 'function') { const g = randomGenes(sp, luck); if (g) return g.genes && !g.base ? g.genes : g; } } catch (e) {}
  return defaultGenes(sp);
}
// texte lisible des gènes (palette, motif, particularité) ; vide pour les couleurs d'origine
function genesText(c) {
  const g = c && c.genes; if (!g) return '';
  try { if (typeof geneLabel === 'function') { const t = geneLabel(g, c.sp); if (t) return String(t); } } catch (e) {}
  const out = [], SPx = typeof SPECIES !== 'undefined' && SPECIES[c.sp];
  const nameOf = (list, v) => { if (!Array.isArray(list) || v == null) return null; const f = list.find(x => x && (x.id === v || x.key === v || x.name === v || x === v)); return f ? (f.name || f.label || (typeof f === 'string' ? f : null)) : null; };
  if (SPx) { const p = nameOf(SPx.palettes, g.palette != null ? g.palette : g.base); if (p) out.push(p); const m = nameOf(SPx.patterns, g.pattern); if (m && !/^uni/i.test(m)) out.push(m); }
  else if (typeof g.pattern === 'string' && !/^(uni|none|aucun)$/i.test(g.pattern)) out.push('motif ' + g.pattern);
  if (g.special && g.special !== 'none') out.push(typeof g.special === 'string' ? g.special : 'particularité rare');
  return out.join(' · ');
}

// ---------- les fiches CHARS des individus ----------
// modèles : les anciennes fiches (pistache, mochi, bulle) et, si l'agent ART en fournit, une fiche par espèce (CHARS.renard…)
const CHAR_TPL = {};
for (const k of ['pistache', 'mochi', 'bulle', ...SP_IDS]) { try { if (CHARS[k]) CHAR_TPL[k] = JSON.parse(JSON.stringify(CHARS[k])); } catch (e) { CHAR_TPL[k] = { ...CHARS[k] }; } }
const DEF_LINES = { hello: ['Coucou !'], pet: ['Mmh, encore !'], click: ['Hihi !'], wake: ['Hein ? Je dormais pas…'], idle: ['On part explorer ?'], love: 'Mon plat préféré ! Merci !', like: 'Miam, merci !', hate: 'Hum… non merci.',
  tap: ['Coucou !', 'On part explorer ?', 'Tu es mon humain préféré !', 'J’ai hâte de voir le monde !'], night: ['…zzz…'], away: ['Coucou de la route !', 'Je te rapporte plein de choses !'] };
const NO_OUTFIT = { tete: 'none', cou: 'none', haut: 'none', bas: 'none', mains: 'none', pieds: 'none', dos: 'none' };
function buildChar(c) {
  const info = SP_INFO[c.sp] || SP_INFO.panda;
  let ch = CHARS[c.id];
  if (!ch) {
    const own = CHAR_TPL[c.sp], tpl = own || CHAR_TPL[info.tpl] || CHAR_TPL.pistache || {};
    try { ch = JSON.parse(JSON.stringify(tpl)); } catch (e) { ch = { ...tpl }; }
    ch.outfit = { ...NO_OUTFIT };
    if (!own && info.lines) Object.assign(ch, { perso: info.perso, bio: info.bio, love: info.love, hate: info.hate, lines: info.lines });
    if (!ch.lines || !ch.lines.tap) ch.lines = Object.assign({}, DEF_LINES, ch.lines || {});
    for (const f of ['perso', 'bio', 'love', 'hate']) if (!ch[f]) ch[f] = info[f] || '';
    CHARS[c.id] = ch;
  }
  ch.id = c.id; ch.sp = c.sp; ch.name = c.name; ch.species = c.hybrid ? `${spName(c.hybrid.a)} × ${spName(c.hybrid.b)}` : spName(c.sp);
  return ch;
}
function ensureCompState(k) {
  const ch = CHARS[k]; if (!ch) return;
  if (!(k in S.trips)) S.trips[k] = null;
  if (!(k in S.unseen)) S.unseen[k] = 0;
  if (!S.prog[k]) S.prog[k] = { xp: 0, lvl: 1 };
  if (!S.outfits[k]) S.outfits[k] = { ...(ch.outfit || NO_OUTFIT), col: {}, worn: {} };
}
function normComp(c, id) {
  c.id = id; if (!SP_IDS.includes(c.sp) && !(typeof SPECIES !== 'undefined' && SPECIES[c.sp])) c.sp = spOf(id);
  if (!c.name) c.name = pickCompName(c.sp);
  if (!c.genes) c.genes = defaultGenes(c.sp);
  if (typeof c.rarity !== 'number') c.rarity = 0;
  if (!c.from || typeof c.from !== 'object') c.from = { how: typeof c.from === 'string' ? c.from : 'oeuf' };
  if (typeof c.fem !== 'boolean') c.fem = Math.random() < 0.5;
  if (!c.born) c.born = Date.now();
  return c;
}
function pickCompName(sp) {
  const used = new Set(Object.values(S.comps || {}).map(c => c.name));
  const pool = ((SP_INFO[sp] || SP_INFO.panda).names || ['Petit']).filter(n => !used.has(n));
  if (pool.length) return pick(pool);
  return pick((SP_INFO[sp] || SP_INFO.panda).names) + ' ' + (Object.keys(S.comps || {}).length + 1);
}

// ---------- ajouter un compagnon ----------
// addComp({ sp, genes, rarity, hybrid, from, name, fem }) : crée l'individu, sa fiche, son état (voyage, niveau, tenue, rêves…)
// et l'ajoute à l'équipe s'il reste une place. Renvoie son id.
function addComp(o = {}) {
  let sp = o.sp;
  if (!SP_IDS.includes(sp) && !(typeof SPECIES !== 'undefined' && SPECIES && SPECIES[sp])) sp = o.hybrid && SP_IDS.includes(o.hybrid.a) ? o.hybrid.a : pick(SP_STARTERS);
  let id; do { id = 'c' + uidGen(); } while (CHARS[id] || (S.comps && S.comps[id]));
  const genes = o.genes || defaultGenes(sp);
  const from = typeof o.from === 'string' ? { how: o.from } : Object.assign({ how: 'oeuf' }, o.from || {});
  const c = { id, sp, name: (o.name || '').trim().slice(0, 16) || pickCompName(sp), genes, rarity: typeof o.rarity === 'number' ? Math.max(0, Math.min(4, o.rarity)) : geneRarityOf(genes, sp), hybrid: o.hybrid || null, born: Date.now(), from, fem: typeof o.fem === 'boolean' ? o.fem : Math.random() < 0.5 };
  if (!c.hybrid) delete c.hybrid;
  S.comps[id] = c;
  buildChar(c); ensureCompState(id);
  if (teamIds().length < 3) S.team = [...teamIds(), id];
  if (!S.sel || !S.comps[S.sel] || !teamIds().includes(S.sel)) S.sel = teamIds()[0] || id;
  try { if (typeof ensureDreams === 'function') ensureDreams(); } catch (e) {}
  try { if (typeof styleState === 'function') styleState(); } catch (e) {}
  S.stats.comps = (S.stats.comps || 0) + 1;
  save();
  try { GAME.emit('comp:new', { id, comp: c }); } catch (e) {}
  try { if (window.__colBooted) { renderAll(); } } catch (e) { console.error(e); }
  return id;
}
function renameComp(k, name) {
  const c = S.comps[k]; name = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!c || !name) return false;
  c.name = name; buildChar(c); save();
  try { for (const key of Object.keys(portraitCache)) if (key.startsWith(k)) delete portraitCache[key]; } catch (e) {}
  return true;
}

// ---------- équipe ----------
function teamAdd(k) {
  if (!S.comps[k] || teamIds().includes(k)) return false;
  if (teamIds().length >= 3) { toast('L’équipe est complète : renvoyez d’abord un compagnon au refuge.'); return false; }
  S.team = [...teamIds(), k]; save(); renderAll(); return true;
}
function teamRemove(k) {
  const t = teamIds(); if (!t.includes(k)) return false;
  if (S.trips[k]) { toast(`${compName(k)} est en voyage : ${compE(k) ? 'elle' : 'il'} reste dans l’équipe jusqu’à son retour.`); return false; }
  if (t.length <= 1) { toast('Il faut garder au moins un compagnon dans l’équipe.'); return false; }
  S.team = t.filter(x => x !== k);
  if (S.sel === k) { S.sel = S.team[0]; plan.dest = null; }
  save(); renderAll(); return true;
}
// setTeam([ids]) : jusqu'à 3 compagnons possédés ; ceux qui voyagent restent forcément dans l'équipe
function setTeam(ids) {
  let t = [...new Set((ids || []).filter(k => S.comps[k]))];
  const away = teamIds().filter(k => S.trips[k] && !t.includes(k));
  t = [...away, ...t].slice(0, 3);
  if (!t.length) return false;
  S.team = t; if (!t.includes(S.sel)) S.sel = t[0];
  save(); renderAll(); return true;
}

// ---------- dessin provisoire (en attendant l'agent ART) ----------
// Sans SPECIES, l'ancien dessin ne connaît que pistache, mochi et bulle : un individu se dessine avec le modèle de son espèce.
if (typeof SPECIES === 'undefined') {
  const _drawChar = drawChar;
  drawChar = function (key, outfit, expr, uid) {
    if (!CHARS[key]) key = 'pistache';
    const tk = CHARS[key].sp ? (SP_INFO[CHARS[key].sp] || SP_INFO.panda).tpl : null;
    if (tk && tk !== key && CHARS[tk]) return _drawChar(tk, outfit, expr, uid).replace(/aria-label="[^"]*"/, `aria-label="${esc(CHARS[key].name)}"`);
    return _drawChar(key, outfit, expr, uid);
  };
}

// ---------- les œufs ----------
const EGG_COLS = [['#fff3e2', '#f3aec1'], ['#e6f6ec', '#f6d36b'], ['#ece4fd', '#ffffff'], ['#e1f0fa', '#9fd1d8'], ['#fff3c4', '#e9a07a'], ['#fde3ea', '#c9b8ea']];
// addEgg({ sp?, genes?, rarity?, hybrid?, from, hatchMs }) : un œuf qui éclora quand on le décide (une fois prêt). Phase B : œufs régionaux, nurserie…
function addEgg(o = {}) {
  const e = { id: 'e' + uidGen(), sp: o.sp || null, genes: o.genes || null, rarity: typeof o.rarity === 'number' ? o.rarity : null, hybrid: o.hybrid || null,
    from: typeof o.from === 'string' ? { how: o.from } : Object.assign({ how: 'oeuf' }, o.from || {}), got: Date.now(), ready: Date.now() + (o.hatchMs || 0), col: o.col || pick(EGG_COLS) };
  S.eggs.push(e); save(); try { renderAll(); } catch (er) {}
  return e.id;
}
const readyEggs = () => (S.eggs || []).filter(e => e && e.ready <= Date.now());
function eggArt(egg, crack, uid) {
  if (typeof drawEgg === 'function') {
    // drawEgg(sp, genes, crack, uid) : un œuf « connu » (régional, cadeau) montre son espèce ; les autres restent mystère (NURSERIE)
    try { const s = drawEgg(egg.known && egg.sp ? egg.sp : null, egg.known ? egg.genes : null, crack, uid); if (typeof s === 'string' && s.includes('<svg')) return s; } catch (e) {}
  }
  const [c1, c2] = egg.col || EGG_COLS[0], L = '#5b4636', u = uid || 'eg';
  const body = 'M60 10 C90 10 110 62 110 94 C110 126 89 146 60 146 C31 146 10 126 10 94 C10 62 30 10 60 10Z';
  const cr = [
    '', 'M44 40 L52 48 L47 54 L56 60',
    'M44 40 L52 48 L47 54 L56 60 M78 70 L70 76 L76 82 L68 90',
    'M12 90 L26 82 L34 94 L46 84 L56 96 L68 84 L80 96 L92 84 L108 92 M44 40 L52 48 L47 54 L56 60',
  ][Math.max(0, Math.min(3, crack | 0))];
  return `<svg viewBox="0 0 120 160" class="eggsvg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="${u}c"><path d="${body}"/></clipPath><radialGradient id="${u}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${c1}"/><stop offset="1" stop-color="${shade(c1, 0.9)}"/></radialGradient></defs>
    <ellipse cx="60" cy="150" rx="40" ry="7" fill="#000" opacity=".12"/>
    <path d="${body}" fill="url(#${u}g)"/>
    <g clip-path="url(#${u}c)" fill="${c2}" stroke="${L}" stroke-width="1.6"><circle cx="34" cy="62" r="9"/><circle cx="78" cy="44" r="6"/><circle cx="86" cy="104" r="11"/><circle cx="40" cy="118" r="7"/><circle cx="62" cy="84" r="4.5"/><circle cx="102" cy="72" r="5"/></g>
    <path d="${body}" fill="none" stroke="${L}" stroke-width="3.5"/>
    <ellipse cx="42" cy="40" rx="8" ry="13" fill="#fff" opacity=".7" transform="rotate(25 42 40)"/>
    ${cr ? `<path d="${cr}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${crack >= 2 ? `<g fill="#fff6c9"><path d="${starPath(98, 24, 6)}"/><path d="${starPath(18, 52, 4)}"/></g>` : ''}</svg>`;
}
let hatchCtx = null; // { egg, crack, first, id }
function hatchEggScreen(egg, first) {
  hatchCtx = { egg, crack: 0, first: !!first, id: null };
  const intro = first
    ? `<span class="hkick">Nouvelle partie</span><h2>Bienvenue dans le Carnet de voyage !</h2><p class="hlead">Explore le vrai monde pour trouver, élever et échanger des compagnons uniques. Tout commence avec cet œuf mystère : touchez-le pour le faire éclore !</p>`
    : `<span class="hkick">${esc(COMP_FROM[egg.from && egg.from.how] || 'Un œuf')}${egg.from && egg.from.place ? ' · ' + esc(egg.from.place) : ''}</span><h2>Un œuf va éclore !</h2><p class="hlead">Qui se cache dedans ? Touchez l’œuf pour l’aider à sortir.</p>`;
  showModal(`<div class="hatchbox">${intro}<button class="eggbtn" data-egg-tap="1" aria-label="Toucher l’œuf (encore 3 fois)"><span class="eggwrap">${eggArt(egg, 0, 'egm')}</span></button><div class="eggdots" aria-hidden="true"><i></i><i></i><i></i></div><p class="egghint">Touchez l’œuf 3 fois</p></div>`);
  document.body.classList.toggle('firstrun', !!first);
}
function eggTap(btn) {
  const h = hatchCtx; if (!h || h.crack >= 3) return;
  h.crack++;
  const wrap = btn.querySelector('.eggwrap');
  wrap.innerHTML = eggArt(h.egg, h.crack, 'egm' + h.crack);
  btn.classList.remove('wob'); void btn.offsetWidth; btn.classList.add('wob');
  btn.closest('.hatchbox').querySelectorAll('.eggdots i').forEach((d, i) => d.classList.toggle('on', i < h.crack));
  const hint = btn.closest('.hatchbox').querySelector('.egghint');
  btn.setAttribute('aria-label', h.crack < 3 ? `Toucher l’œuf (encore ${3 - h.crack} fois)` : 'L’œuf éclot');
  if (h.crack < 3) { if (hint) hint.textContent = h.crack === 1 ? 'Il bouge ! Encore…' : 'Ça craque ! Une dernière fois !'; return; }
  if (hint) hint.textContent = '';
  btn.classList.add('burst'); btn.disabled = true;
  setTimeout(() => hatchNow(), (typeof reduceMotion === 'function' && reduceMotion()) ? 50 : 650);
}
function hatchNow() {
  const h = hatchCtx; if (!h) return;
  const e = h.egg;
  let sp = e.sp, genes = e.genes, rarity = e.rarity;
  if (!sp) sp = h.first ? pick(SP_STARTERS) : pick(SP_IDS);
  if (!genes) {
    // œuf de départ : couleurs d'origine, avec une petite chance de variante
    if (h.first) genes = Math.random() < 0.15 ? rollGenes(sp, 0) : defaultGenes(sp);
    else genes = rollGenes(sp, 0.5);
  }
  if (typeof rarity !== 'number') rarity = geneRarityOf(genes, sp);
  const id = addComp({ sp, genes, rarity, hybrid: e.hybrid, from: h.first ? { how: 'depart' } : e.from });
  h.id = id;
  if (e.paid && S.comps[id]) S.comps[id].paid = e.paid; // acheté : revente plafonnée au prix payé (22_marche.js)
  if (!h.first) S.eggs = (S.eggs || []).filter(x => x.id !== e.id);
  if (h.first) { S.firstRun = { stage: 'name', id }; }
  S.stats.hatched = (S.stats.hatched || 0) + 1;
  save();
  nameScreen(id, true);
  if (typeof confetti === 'function') setTimeout(() => { try { confetti(rarity >= 2); } catch (er) {} }, 150);
}
function nameScreen(id, fresh) {
  const c = S.comps[id]; if (!c) return;
  const gt = genesText(c), rar = c.rarity || 0;
  const kick = `${RARITY[rar]} · ${esc(CHARS[id].species)}`;
  showModal(`<div class="hatchbox named"><div class="hrays${fresh ? ' pop' : ''}" style="--tint:${spTint(id)}"><div class="hart">${drawChar(id, S.outfits[id], 'rire', 'hn' + id)}</div></div>
    <span class="hrar" style="--rc:${RARC[rar]}">${kick}</span>
    <h2>${fresh ? (c.hybrid ? 'C’est un hybride !' : `C’est ${esc(spArticle(c.sp))} !`) : esc(c.name)}</h2>
    ${gt ? `<p class="hgenes">${rar > 0 ? 'Une variante : ' : ''}${esc(gt)}</p>` : rar > 0 ? '<p class="hgenes">Une variante rare !</p>' : ''}
    <label class="hnlab" for="cnName">${fresh ? 'Comment l’appeler ?' : 'Son nom'}</label>
    <div class="hnrow"><input id="cnName" maxlength="16" autocomplete="off" spellcheck="false" value="${esc(c.name)}" aria-label="Nom du compagnon"><button class="icon-btn" data-name-dice="${id}" aria-label="Proposer un autre nom" title="Autre nom"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#fff" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="9" r="1.6" fill="currentColor"/><circle cx="15" cy="15" r="1.6" fill="currentColor"/><circle cx="15" cy="9" r="1.6" fill="currentColor"/><circle cx="9" cy="15" r="1.6" fill="currentColor"/></svg></button></div>
    <button class="btn green big wide" data-name-ok="${id}">${fresh ? 'C’est parti !' : 'Enregistrer'}</button></div>`);
}
function nameOk(id) {
  const inp = $('cnName'); const v = inp ? inp.value : '';
  if (v.trim()) renameComp(id, v);
  const h = hatchCtx; hatchCtx = null;
  if (S.firstRun && S.firstRun.id === id) return firstRunNext();
  $('modal').hidden = true; document.body.classList.remove('firstrun');
  renderAll();
  if (h && !h.first) toast(`Bienvenue, ${compName(id)} ! ${teamIds().includes(id) ? 'Il rejoint l’équipe.' : 'Il vous attend au refuge.'}`.replace('Il ', compE(id) ? 'Elle ' : 'Il '));
}

// ---------- premier lancement ----------
// Phase B : d'autres étapes viendront après le nom (le choix du commerce : boulangerie, café, fleuriste…).
// Il suffira d'ajouter une fonction : FIRST_RUN_STEPS.push(next => { …afficher l'étape…; puis appeler next(); }).
const FIRST_RUN_STEPS = [];
function startFirstRun() {
  const F = S.firstRun; if (!F) return;
  if (F.stage === 'name' && S.comps[F.id]) { document.body.classList.add('firstrun'); nameScreen(F.id, true); return; }
  hatchEggScreen(F.egg || { col: EGG_COLS[0] }, true);
}
function firstRunNext() {
  const F = S.firstRun;
  if (F) {
    F.step = (F.step || 0) + 1;
    const f = FIRST_RUN_STEPS[F.step - 1];
    if (typeof f === 'function') { save(); try { return f(firstRunNext); } catch (e) { console.error(e); } }
  }
  // fin du premier lancement : l'écran principal
  S.firstRun = null; S.seenIntro = true; save();
  $('modal').hidden = true; document.body.classList.remove('firstrun');
  renderAll();
  const k = teamIds()[0];
  // (le tutoriel guidé, 24_tuto.js, prend le relais : pas de consigne concurrente)
  if (k && !(typeof tutoActive === 'function' && tutoActive())) setTimeout(() => toast(`${compName(k)} a hâte de partir : touchez « Partir » !`), 500);
}

// ---------- carte d'action (écran principal) : la prochaine chose utile, un seul bouton ----------
function simplestOrder() {
  try {
    if (typeof bqState !== 'function') return null;
    const os = bqState().orders || []; let best = null, bm = 1e9;
    for (const o of os) {
      const al = bqAllocate(o), miss = o.req.reduce((a, r, j) => a + Math.max(0, r.n - (al[j] ? al[j].have : 0)), 0);
      if (miss > 0 && miss < bm) { bm = miss; best = { o, r: o.req.find((r, j) => (al[j] ? al[j].have : 0) < r.n) }; }
    }
    return best;
  } catch (e) { return null; }
}
function nextAction() {
  const team = teamIds().filter(k => CHARS[k] && S.prog[k]), order = [S.sel, ...team.filter(k => k !== S.sel)].filter(k => team.includes(k));
  // 1. un voyage terminé
  for (const k of order) { const t = S.trips[k]; if (t && t.done) return { kind: 'collect', k, t }; }
  // 2. un choix en voyage (il n'attend pas : il se décide tout seul au retour)
  for (const k of order) { const t = S.trips[k]; if (t && !t.done) { const j = t.journal.find(x => x.pending && !x.resolved); if (j) return { kind: 'choose', k, t, j }; } }
  // 3. un œuf prêt à éclore
  const egg = readyEggs()[0]; if (egg) return { kind: 'hatch', egg };
  // 4. une commande livrable
  try { if (typeof bqState === 'function') { const o = bqState().orders.find(bqReady); if (o) return { kind: 'deliver', o }; } } catch (e) {}
  // 5. le rêve en cours (ou la commande la plus simple) d'un compagnon disponible
  const free = order.find(k => !S.trips[k]);
  if (free) {
    const d = typeof curDream === 'function' ? curDream(free) : null;
    if (d) return { kind: typeof dreamReady === 'function' && dreamReady(free) ? 'dreamok' : 'dream', k: free, d };
    const so = simplestOrder(); if (so) return { kind: 'order', k: free, ...so };
    return { kind: 'idle', k: free };
  }
  const k = order[0]; if (k && S.trips[k]) return { kind: 'away', k, t: S.trips[k] };
  return null;
}
function renderActionCard(box) {
  if (document.body.classList.contains('firstrun')) { box.hidden = true; return; }
  const a = nextAction();
  if (!a) { box.hidden = true; return; }
  box.hidden = false;
  box.className = 'tripcard act act-' + a.kind;
  box.dataset.k = a.k || ''; box.dataset.kind = a.kind;
  const face = (k, mood) => `<img src="${portraitURI(k, mood)}" alt="">`;
  let ic = '', kick = '', title = '', sub = '', btn = '';
  const n = a.k ? esc(compName(a.k)) : '';
  if (a.kind === 'collect') {
    const nb = a.t.bag.length;
    ic = face(a.k, 'rire'); kick = 'Retour de voyage'; title = `${n} est rentré${compE(a.k)} !`;
    sub = `${nb} objet${nb > 1 ? 's' : ''}${a.t.coins > 0 ? ` · ${a.t.coins} pièces` : ''} · ${esc(a.t.dest.name)}`;
    btn = `<button class="btn green" data-act="collect" data-k="${a.k}">Ouvrir le sac</button>`;
  } else if (a.kind === 'hatch') {
    ic = `<span class="acegg">${eggArt(a.egg, 1, 'ace')}</span>`; kick = 'Nurserie'; title = 'Un œuf va éclore !';
    sub = 'Il remue… aidez-le à sortir'; btn = `<button class="btn gold" data-act="hatch" data-id="${a.egg.id}">Faire éclore</button>`;
  } else if (a.kind === 'choose') {
    ic = face(a.k, 'curieux'); kick = `En voyage · ${esc(a.j.place || a.t.dest.name)}`;
    title = typeof liveAskText === 'function' ? esc(liveAskText(compName(a.k), a.j).replace(/ ! Choisis$/, ' !')) : `${n} hésite !`;
    sub = esc(a.j.text || ''); btn = `<button class="btn pink" data-act="choose" data-k="${a.k}">Choisir</button>`;
  } else if (a.kind === 'deliver') {
    const c = BQC(a.o.client);
    ic = typeof clientURI === 'function' ? `<img class="acli" src="${clientURI(c, 'joie')}" alt="">` : ''; kick = 'Boutique';
    title = `Commande prête : ${esc(c.name)}`; sub = 'Tout est dans le sac : il ne reste qu’à livrer !';
    btn = `<button class="btn green" data-act="deliver" data-id="${a.o.id}">Livrer</button>`;
  } else if (a.kind === 'dreamok') {
    ic = face(a.k, 'amour'); kick = `Rêve de ${n}`; title = esc(ucfirst(a.d.wish));
    sub = 'Toutes les étapes sont faites !'; btn = `<button class="btn gold" data-act="dream" data-k="${a.k}">Réaliser</button>`;
  } else if (a.kind === 'dream') {
    const list = dreamsOf(a.k), nx = nextStepIdx(a.k), st = a.d.steps[nx];
    ic = face(a.k); kick = `${n} rêve de… <em>${list.indexOf(a.d) + 1}/${list.length}</em>`; title = esc(ucfirst(a.d.wish));
    sub = `<span class="acsteps">${a.d.steps.map((s, i) => { const pr = stepProg(a.k, i), g = stepGoal(s), ok = pr >= g; return `<i class="${ok ? 'ok' : i === nx ? 'nx' : ''}">${ok ? '✓ ' : ''}${esc(s.short)}${!ok && g > 1 ? ` ${pr}/${g}` : ''}</i>`; }).join('')}</span>`;
    const craftStep = st && st.t === 'craft';
    btn = `<button class="btn ${craftStep ? 'pink' : 'green'}" data-act="dream" data-k="${a.k}">${craftStep ? 'Fabriquer' : 'Partir'}</button>`;
  } else if (a.kind === 'order') {
    const c = BQC(a.o.client);
    ic = typeof clientURI === 'function' ? `<img class="acli" src="${clientURI(c, 'content')}" alt="">` : face(a.k); kick = 'Commande';
    title = `${esc(c.name)} attend : ${esc(bqReqLabel(a.r).toLowerCase())}`; sub = esc(bqReqWhere(a.r));
    btn = `<button class="btn green" data-act="order" data-id="${a.o.id}">Partir</button>`;
  } else if (a.kind === 'idle') {
    ic = face(a.k); kick = esc(CHARS[a.k].species); title = `${n} est prêt${compE(a.k)} à partir`;
    sub = 'Touchez un lieu de la carte, ou demandez une idée.'; btn = `<button class="btn green" data-act="idea" data-k="${a.k}">Partir</button>`;
  } else if (a.kind === 'away') {
    const f = Math.min(1, a.t.elapsed / a.t.total), last = a.t.journal[a.t.journal.length - 1];
    ic = face(a.k); kick = `En voyage · ${Math.floor(f * 100)} %`; title = `${n} → ${esc(a.t.dest.name)}`;
    sub = `<span class="acbar"><i id="pbar2" style="width:${(f * 100).toFixed(1)}%"></i></span><span id="ptime2" class="actime">${f < 0.5 ? 'Aller' : 'Retour'} · ${fmtDur((a.t.total - a.t.elapsed) / (fast ? 30 : 1))}</span>`;
    if (last && last.text && last.kind !== 'depart') sub = `<span class="aclast">${esc(last.text)}</span>`;
    btn = `<button class="btn cream" data-act="journal" data-k="${a.k}">Journal</button>`;
  }
  box.dataset.sig = actionSig(a);
  box.innerHTML = `<span class="acic">${ic}</span><div class="tcx"><span class="ack">${kick}</span><b class="act-t">${title}</b><span class="acs">${sub}</span></div>${btn}`;
}
function runAction(el) {
  const d = el.dataset, k = d.k;
  if (k && S.comps[k] && S.sel !== k && d.act !== 'deliver') { S.sel = k; S.unseen[k] = 0; plan.dest = null; save(); renderComps(); drawMarks(); }
  switch (d.act) {
    case 'collect': if (S.trips[k]) collect(); return;
    case 'hatch': { const e = (S.eggs || []).find(x => x.id === d.id); if (e) hatchEggScreen(e, false); return; }
    case 'choose': if (typeof liveOpenJournal === 'function') liveOpenJournal(k, true); else openSheet('voyage'); return;
    case 'deliver': if (typeof bqDeliver === 'function') bqDeliver(d.id, el); return;
    case 'dream': if (typeof dreamGo === 'function') dreamGo(k); return;
    case 'order': if (typeof bqGo === 'function') bqGo(d.id); return;
    case 'idea': case 'journal': renderAll(); openSheet('voyage'); return;
  }
}

// ---------- le menu (carnet) : récompenses à récupérer, journée, progression, réglages ----------
NAV_ICONS.menu = '<path d="M7 4 H23 a2 2 0 0 1 2 2 V24 a2 2 0 0 1 -2 2 H7Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 4 V26" stroke="currentColor" stroke-width="3.2"/><path d="M12 10 H21 M12 14.5 H21 M12 19 H18" stroke="#c98a5a" stroke-width="2" stroke-linecap="round"/><path d="M19 3 V9 l2-1.5 2 1.5 V3" fill="#f08aa6" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>';
NAV_ICONS.refuge = '<path d="M3 15 L15 5 L27 15" fill="none" stroke="#d9604f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14 V26 H24 V14" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 23.5 C9.5 19.5 10 15.5 12.6 15.5 C14 15.5 15 16.6 15 17.6 C15 16.6 16 15.5 17.4 15.5 C20 15.5 20.5 19.5 15 23.5Z" fill="#f08aa6" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>';
function pendingRewards() {
  const out = [];
  try { if (typeof giftPending === 'function' && giftPending()) out.push({ kind: 'gift' }); } catch (e) {}
  try { if (typeof achReady === 'function') achReady().forEach(a => out.push({ kind: 'ach', a })); } catch (e) {}
  (S.tierPending || []).forEach((p, i) => out.push({ kind: 'tier', p, i }));
  return out;
}
function renderMenuDot() {
  const g = $('gear'); if (!g) return;
  const n = pendingRewards().length;
  let dot = g.querySelector('.mdot'); if (!dot) { dot = document.createElement('i'); dot.className = 'mdot'; g.appendChild(dot); }
  dot.hidden = !n;
  g.setAttribute('aria-label', `Menu${n ? ` : ${n} récompense${n > 1 ? 's' : ''} à récupérer` : ''}`);
}
function menuRewardRow(r) {
  if (r.kind === 'gift') {
    const L = S.login, idx = ((L.streak || 1) - 1) % 7, rw = LOGIN_REWARDS[idx];
    const what = `${rw.coins ? `${rw.coins} pièces` : ''}${rw.coins && rw.item != null ? ' + ' : ''}${rw.item != null ? `un objet ${RARITY[rw.item].toLowerCase()}` : ''}`;
    return `<div class="mrow"><span class="mri gift">${GIFT()}</span><div><b>Cadeau du jour</b><span>Jour ${idx + 1} de la série · ${what}</span></div><button class="btn gold sm" data-menu="gift">Récupérer</button></div>`;
  }
  if (r.kind === 'ach') return `<div class="mrow"><span class="mri">${TROPHY()}</span><div><b>Succès : ${esc(r.a.name)}</b><span>${esc(r.a.desc)}</span></div><button class="btn gold sm" data-menu="ach" data-id="${r.a.id}">${coins(r.a.r)}</button></div>`;
  const c = collections().find(x => x.key === r.p.key); if (!c) return '';
  const lab = r.p.i >= 2 ? `Collection complète : ${esc(c.label)}` : `Palier ${TIERS[r.p.i].label} : ${esc(c.label)}`;
  const what = r.p.i >= 2 ? `${colReward(c)} pièces + un trophée` : `${tierReward(c, r.p.i)} pièces${r.p.i === 1 ? ' + un objet rare' : ''}`;
  return `<div class="mrow"><span class="mri" style="--tc:${TAGC[c.key] || '#c9a97a'}"><i class="mtag"></i></span><div><b>${lab}</b><span>${what}</span></div><button class="btn gold sm" data-menu="tier" data-i="${r.i}">Récupérer</button></div>`;
}
function renderMenu(box) {
  const P = pendingRewards();
  let h = '';
  // à récupérer
  if (P.length) h += `<section class="msec hot"><header><h3>À récupérer</h3>${P.length > 1 ? `<button class="btn green sm" data-menu="all">Tout récupérer</button>` : ''}</header>${P.map(menuRewardRow).join('')}</section>`;
  // aujourd'hui : événement et série
  try {
    const ev = todayEvent(), L = S.login, cur = ((L.streak || 1) - 1) % 7;
    h += `<section class="msec"><header><h3>Aujourd’hui</h3></header><div class="mrow"><span class="mri ev" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><div><b>${esc(ev.name)}</b><span>${esc(ev.short)}</span></div><button class="btn cream sm" data-menu="event">J’y vais</button></div>`;
    const big = LOGIN_REWARDS[6];
    h += `<div class="mstreak"><span class="streak">${FLAME} ${L.streak || 1} jour${(L.streak || 1) > 1 ? 's' : ''} de suite</span><span class="mdots" aria-hidden="true">${LOGIN_REWARDS.map((r, i) => `<i class="${i < cur || (i === cur && !giftPending()) ? 'on' : i === cur ? 'now' : ''}${i === 6 ? ' big' : ''}"></i>`).join('')}</span><span class="small">Revenez chaque jour : au 7ᵉ jour, ${big.coins} pièces et un objet ${RARITY[big.item].toLowerCase()}.</span></div></section>`;
  } catch (e) { console.error(e); }
  // progression
  {
    const rows = [];
    try { const { n } = worldStats(), w = worldTier(n); rows.push(`<div class="mrow"><span class="mri">${'<svg viewBox="0 0 24 24"><path d="M12 3 C6.5 3 2.5 7 2.5 12 C2.5 17 6.5 21 11 21 C12.5 21 13 20 12.6 18.8 C12.2 17.5 13 16.5 14.4 16.5 H17 C19.5 16.5 21.5 14.6 21.5 12 C21.5 7 17.5 3 12 3Z" fill="#fff3e2" stroke="#4a3528" stroke-width="1.6"/><circle cx="7.5" cy="11" r="1.8" fill="#e5584f"/><circle cx="10.5" cy="7" r="1.8" fill="#f2c14e"/><circle cx="15" cy="7.2" r="1.8" fill="#5fbf7f"/><circle cx="17.6" cy="11" r="1.8" fill="#4f97c4"/></svg>'}</span><div><b>Monde colorié : ${n} lieu${n > 1 ? 'x' : ''}</b><span class="mbar"><i style="width:${(w.f * 100).toFixed(0)}%"></i></span><span>${w.next ? `Prochain palier : ${w.next} lieux` : 'Le monde est en couleurs !'}</span></div><button class="btn cream sm" data-menu="world">Voir</button></div>`); } catch (e) {}
    const nc = compIds().length, nsp = new Set(Object.values(S.comps).map(c => c.sp)).size;
    rows.push(`<div class="mrow"><span class="mri"><svg viewBox="0 0 30 30">${NAV_ICONS.refuge}</svg></span><div><b>${nc} compagnon${nc > 1 ? 's' : ''}</b><span>${nsp} espèce${nsp > 1 ? 's' : ''} sur ${SP_IDS.length} découverte${nsp > 1 ? 's' : ''}</span></div><button class="btn cream sm" data-menu="refuge">Refuge</button></div>`);
    try { const done = Object.keys(S.achClaimed || {}).length; rows.push(`<div class="mrow"><span class="mri">${TROPHY()}</span><div><b>Succès : ${done} / ${ACH.length}</b><span class="mbar"><i style="width:${(done / ACH.length * 100).toFixed(0)}%"></i></span></div><button class="btn cream sm" data-menu="achs">Voir</button></div>`); } catch (e) {}
    try { const g = goalState(); if (!g.finished) rows.push(`<div class="mrow"><span class="mri"><svg viewBox="0 0 30 30">${GOAL_ICON[g.ch.icon]}</svg></span><div><b>Grand Carnet : ${esc(g.ch.name)}</b><span>${g.complete ? 'Chapitre terminé : récompense à récupérer !' : esc(g.step.txt)}</span></div><button class="btn ${g.complete ? 'gold' : 'cream'} sm" data-menu="carnet">${g.complete ? 'Récompense' : 'Voir'}</button></div>`); } catch (e) {}
    h += `<section class="msec"><header><h3>Ma progression</h3></header>${rows.join('')}</section>`;
  }
  // bien démarrer
  try {
    const ts = typeof tutoStep === 'function' ? tutoStep() : 0;
    if (ts) h += `<section class="msec"><header><h3>Bien démarrer</h3></header><ol class="mtuto">${[['Partir en voyage', 'Touchez « Partir » en bas de la carte.'], ['Livrer une commande', 'Les clients de la boutique paient en pièces.'], ['Habiller un compagnon', 'Touchez son portrait en haut, puis la garde-robe.']].map(([t, d], i) => `<li class="${i + 1 < ts ? 'ok' : i + 1 === ts ? 'cur' : ''}"><b>${i + 1 < ts ? '✓ ' : ''}${t}</b><span>${d}</span></li>`).join('')}</ol></section>`;
  } catch (e) {}
  // réglages
  h += `<section class="msec"><header><h3>Réglages</h3></header><div class="mrow set"><label for="menuHome"><b>Votre ville</b><span>Le point de départ de tous les voyages.</span></label><select id="menuHome">${HOMES.map(x => `<option ${x[0] === S.home ? 'selected' : ''}>${x[0]}</option>`).join('')}</select></div></section>`;
  box.innerHTML = h;
}
function menuClaimAll() {
  let n = 0;
  if (typeof giftPending === 'function' && giftPending()) { claimGift(); n++; }
  for (const a of (typeof achReady === 'function' ? achReady() : [])) { claimAch(a.id); n++; }
  while ((S.tierPending || []).length) { claimTier(0); n++; }
  if (n) toast(`${n} récompense${n > 1 ? 's' : ''} récupérée${n > 1 ? 's' : ''} !`);
}

// ---------- le refuge : toute la collection, et le choix de l'équipe ----------
let refugeSel = null;
function compCard(k, inT) {
  const c = S.comps[k], ch = CHARS[k], p = S.prog[k] || { lvl: 1 }, t = S.trips[k], gt = genesText(c);
  let act;
  if (inT) act = `<button class="btn cream sm" data-team-out="${k}" ${t || teamIds().length <= 1 ? 'disabled' : ''}>${t ? (t.done ? 'Rentré' + compE(k) : 'En voyage') : 'Au refuge'}</button>`;
  else act = `<button class="btn green sm" data-team-in="${k}" ${teamIds().length >= 3 ? 'disabled title="L’équipe est complète : libérez une place"' : ''}>Dans l’équipe</button>`;
  return `<article class="rfc ${inT ? 'in' : ''} r${c.rarity || 0}" style="--tint:${spTint(k)};--rc:${RARC[c.rarity || 0]}"><button class="rfp" data-comp-info="${k}" aria-label="${esc(ch.name)}"><img src="${portraitURI(k)}" alt=""></button><div class="rfx"><b>${esc(ch.name)}<button class="rfren" data-comp-rename="${k}" aria-label="Renommer ${esc(ch.name)}" title="Renommer"><svg viewBox="0 0 20 20"><path d="M4 14.5 V16 H5.5 L14 7.5 L12.5 6Z M13.3 5.2 L14.8 6.7 L16 5.5 a1 1 0 0 0 0 -1.4 L15.9 4 a1 1 0 0 0 -1.4 0Z" fill="currentColor"/></svg></button></b><span class="rfs">${esc(ch.species)} · niv. ${p.lvl}</span><span class="rfr">${RARITY[c.rarity || 0]}${gt ? ' · ' + esc(gt) : ''}</span></div><div class="rfa">${act}</div></article>`;
}
function renderRefuge(box) {
  const team = teamIds(), rest = compIds().filter(k => !team.includes(k) && CHARS[k]), eggs = S.eggs || [];
  const nsp = new Set(Object.values(S.comps).map(c => c.sp)).size;
  let h = `<div class="rfhead"><div class="rfhi"><svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.refuge}</svg></div><div><h2>Le refuge</h2><p>${compIds().length} compagnon${compIds().length > 1 ? 's' : ''} · ${nsp}/${SP_IDS.length} espèces. L’équipe (3 places) voyage avec vous ; les autres se reposent ici.</p></div></div>`;
  h += `<h3 class="rfh">L’équipe <small>${team.length}/3</small></h3><div class="rfgrid">${team.map(k => compCard(k, true)).join('')}${team.length < 3 ? Array.from({ length: 3 - team.length }, () => `<div class="rfc empty"><span>Place libre</span></div>`).join('') : ''}</div>`;
  h += `<h3 class="rfh">Au refuge <small>${rest.length}</small></h3>`;
  if (rest.length && team.length >= 3) h += `<p class="rfnote">L’équipe est complète : renvoyez d’abord un compagnon au refuge pour libérer une place.</p>`;
  h += rest.length ? `<div class="rfgrid">${rest.map(k => compCard(k, false)).join('')}</div>` : `<p class="rfempty">Personne au refuge pour l’instant. Les prochains compagnons viendront des œufs trouvés en voyage, des rencontres et de la nurserie.</p>`;
  if (eggs.length) h += `<h3 class="rfh">Œufs <small>${eggs.length}</small></h3><div class="rfeggs">${eggs.map(e => { const ok = e.ready <= Date.now(); return `<div class="rfegg"><span class="rfeic">${eggArt(e, ok ? 1 : 0, 'rf' + e.id)}</span><b>${esc(COMP_FROM[e.from && e.from.how] || 'Œuf')}</b>${ok ? `<button class="btn gold sm" data-act="hatch" data-id="${e.id}">Faire éclore</button>` : `<span class="small">Éclosion dans ${fmtDur(e.ready - Date.now())}</span>`}</div>`; }).join('')}</div>`;
  box.innerHTML = h;
}
function refugeDot() { return readyEggs().length > 0; }
function renameModal(k) {
  if (!S.comps[k]) return;
  hatchCtx = null;
  nameScreen(k, false);
}

// ---------- clics ----------
document.addEventListener('click', ev => {
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.eggTap) return eggTap(el);
  if (d.nameDice) { const c = S.comps[d.nameDice], inp = $('cnName'); if (c && inp) { const used = new Set(Object.values(S.comps).map(x => x.name)); const pool = ((SP_INFO[c.sp] || SP_INFO.panda).names).filter(n => !used.has(n) && n !== inp.value); inp.value = pool.length ? pick(pool) : pickCompName(c.sp); const b = el.closest('.hatchbox').querySelector('[data-name-ok]'); void b; } return; }
  if (d.nameOk) return nameOk(d.nameOk);
  if (d.act && el.closest('#tripCard, .rfeggs')) { if ($('modal')) $('modal').hidden = true; return runAction(el); }
  if (d.teamIn) { teamAdd(d.teamIn); return; }
  if (d.teamOut) { teamRemove(d.teamOut); return; }
  if (d.compRename) return renameModal(d.compRename);
  if (d.compInfo) { const k = d.compInfo; if (teamIds().includes(k)) { selectComp(k); if (typeof openCompagnons === 'function') openCompagnons('talents'); } else toast(`${compName(k)} se repose au refuge. Ajoutez-${compE(k) ? 'la' : 'le'} à l’équipe pour l’emmener en voyage.`); return; }
  if (d.menu) {
    const m = d.menu;
    if (m === 'gift') claimGift();
    else if (m === 'ach') claimAch(d.id);
    else if (m === 'tier') { const r = claimTier(+d.i); if (r) toast(r.full ? `Collection « ${r.c.label} » complète : +${r.coins} pièces et un trophée !` : `Palier ${TIERS[r.i].label} · ${r.c.label} : +${r.coins} pièces${r.item ? ` et « ${r.item.name} »` : ''}`); }
    else if (m === 'all') menuClaimAll();
    else if (m === 'event') { closeSheet(); return goEvent(); }
    else if (m === 'world') { closeSheet(); if (map) map.flyTo({ center: [10, 30], zoom: 1.8, speed: 1.4 }); return; }
    else if (m === 'refuge') { openCompagnons('refuge'); return; }
    else if (m === 'achs') { openAchievements(); return; }
    else if (m === 'carnet') { const g = goalState(); if (g.complete) { claimChapter(); } else { openSheet('reves'); setTimeout(() => { const c = $('rvCarnet'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 80); } return; }
    renderMenuDot(); if (tab === 'menu') renderPanel();
    return;
  }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.id === 'cnName') { const b = document.querySelector('[data-name-ok]'); if (b) b.click(); } });
document.addEventListener('change', ev => {
  if (ev.target && ev.target.id === 'menuHome') { const hs = $('homeSel'); if (hs) { hs.value = ev.target.value; hs.dispatchEvent(new Event('change')); } }
});

// ---------- mise en place au chargement ----------
(function initCollection() {
  try {
    for (const [k, c] of Object.entries(S.comps)) { if (!c || typeof c !== 'object') { delete S.comps[k]; continue; } normComp(c, k); buildChar(c); ensureCompState(k); }
    // un compagnon en voyage reste toujours dans l'équipe
    let team = teamIds().slice(0, 3);
    for (const k of compIds()) if (S.trips[k] && !team.includes(k) && team.length < 3) team.push(k);
    if (!team.length) team = compIds().slice(0, 3);
    S.team = team;
    if (!S.comps[S.sel] || !team.includes(S.sel)) S.sel = team[0] || '';
    if (!Array.isArray(S.eggs)) S.eggs = [];
    if (!Array.isArray(S.tierPending)) S.tierPending = [];
    // nouvelle partie : l'œuf mystère
    if (!compIds().length && !S.firstRun) S.firstRun = { stage: 'egg', egg: { col: pick(EGG_COLS) } };
    if (S.firstRun) document.body.classList.add('firstrun');
    if (typeof ensureDreams === 'function') ensureDreams();
    if (typeof styleState === 'function') styleState();
    save();
  } catch (e) { console.error('collection', e); }
})();
// la boucle de jeu : marquer le démarrage et garder le point du menu à jour
maybeIntro = (orig => function () { const r = orig.apply(this, arguments); window.__colBooted = true; renderMenuDot(); return r; })(maybeIntro);
// la carte d'action suit l'état du jeu (commande devenue livrable, œuf prêt, choix résolu…) sans attendre un autre affichage
const actionSig = a => a ? [a.kind, a.k || '', a.egg ? a.egg.id : '', a.o ? a.o.id : '', a.j ? a.t.journal.indexOf(a.j) : '', a.d ? a.d.id + ':' + JSON.stringify(S.dreams[a.k] && S.dreams[a.k].prog) : ''].join('|') : '';
setInterval(() => {
  try {
    renderMenuDot();
    const box = $('tripCard'); if (!box || tab !== 'carte' || document.body.classList.contains('firstrun')) return;
    const sig = actionSig(nextAction());
    if (sig !== box.dataset.sig) renderTripCard();
  } catch (e) {}
}, 1000);

// ---------- styles ----------
(function colCSS() {
  const st = document.createElement('style'); st.id = 'colCSS';
  st.textContent = `
/* écran principal épuré : plus de bandeau, de barre d'événement, de compteur ni d'annonces volantes */
#goal,#jeuBar,#worldMeter,#achPop,#stDress,#mapNote{display:none!important}
body.firstrun .hud,body.firstrun #nav,body.firstrun .zoom,body.firstrun #tripCard,body.firstrun #liveBar,body.firstrun #sheet{display:none!important}
/* HUD : l'équipe + le refuge */
#hudComps{align-items:flex-start}
.hc-btn .nm{max-width:72px;overflow:hidden;text-overflow:ellipsis}
.hc-add{position:relative;flex:none;width:40px;height:40px;margin:10px 0 0 2px;border-radius:50%;background:var(--paper);border:2.5px dashed var(--ink);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.hc-add svg{width:20px;height:20px}
.hc-add i{position:absolute;right:-8px;top:-8px;min-width:19px;height:19px;border-radius:999px;background:var(--teal);color:#fff;border:2px solid #fff;font:800 10.5px/15px var(--display);font-style:normal;text-align:center;padding:0 3px}
.hc-add:active{transform:translateY(2px)}
#gear{position:relative}
#gear .mdot{position:absolute;right:-4px;top:-4px;width:14px;height:14px;border-radius:50%;background:var(--rust);border:2.5px solid #fff;box-shadow:0 0 0 1.5px var(--ink)}
@media (max-width:420px){
 .hc-btn{width:58px;height:78px}.hc-btn .ring{width:54px;height:54px;left:2px}.hc-btn img,.hc-btn .livep{top:4px!important;left:9px!important;width:40px!important;height:44px!important}
 .lv{top:35px;width:21px;height:21px;font-size:11.5px;line-height:16px}.nm{top:56px;font-size:11px;line-height:16px;padding:0 5px;max-width:62px}
 .hc-add{width:34px;height:34px;margin-top:10px}.hc-add svg{width:17px;height:17px}
 .hud .icon-btn{width:40px;height:40px}
}
/* carte d'action */
.tripcard.act{gap:9px;padding:6px 8px 6px 6px;min-height:58px}
.tripcard.act .acic{flex:none;width:48px;height:52px;border-radius:14px;background:var(--tint,#f6e3c4);border:2px solid var(--ink);overflow:hidden;display:flex;align-items:center;justify-content:center}
.tripcard.act .acic img,.tripcard.act .acic .livep{width:46px!important;height:50px!important;border:0!important;border-radius:0!important;background:none!important;flex:none}
.tripcard.act .acic img.acli{width:44px!important;height:44px!important}
.tripcard.act .acegg svg{width:34px;height:44px;display:block}
.tripcard.act .tcx{gap:1px}
.ack{font:700 11px/1.2 var(--display);color:var(--rust);letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ack em{font-style:normal;color:var(--muted);letter-spacing:0}
.tripcard.act .act-t{font:800 15.5px/1.15 var(--display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acs{display:block;font:600 12.5px/1.3 var(--body);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acsteps{display:flex;gap:4px;overflow:hidden}
.acsteps i{font-style:normal;flex:none;font:700 11.5px/18px var(--display);padding:0 7px;border-radius:999px;background:#fff;border:1.5px solid var(--line);color:var(--ink2)}
.acsteps i.nx{border-color:var(--ink);background:#fff3c4;color:var(--ink)}
.acsteps i.ok{background:#e6f6e9;border-color:#9fd3ae;color:var(--greenD)}
.acbar{display:block;height:8px;border-radius:999px;background:#f1e4c8;border:1.5px solid var(--ink);overflow:hidden;margin:3px 0 1px}.acbar i{display:block;height:100%;background:var(--green)}
.actime{font:700 11.5px var(--display);color:var(--muted)}
.tripcard.act>.btn{flex:none;padding:9px 13px 7px;font-size:15.5px;border-radius:13px;box-shadow:0 3px 0 var(--ink)}
.tripcard.act-collect,.tripcard.act-dreamok,.tripcard.act-hatch{background:#fff3c4;animation:glow 1.2s ease-in-out infinite alternate}
.tripcard.act-choose{background:#ffe9ef}
.tripcard.act .btn.pink{animation:actPulse 1s ease-in-out infinite alternate}
@keyframes actPulse{to{transform:scale(1.05)}}
.tripcard.act-deliver{background:#effaf2}
@media (prefers-reduced-motion:reduce){.tripcard.act{animation:none!important}}
/* le fil du voyage : une seule ligne */
#liveBar .lvb.feed{padding:3px 8px 3px 4px;border-width:2px;border-radius:14px;box-shadow:0 3px 0 rgba(74,53,40,.35)}
#liveBar .lvb.feed .lvi{width:28px;height:28px}#liveBar .lvb.feed .lvi svg{width:16px;height:16px}
#liveBar .lvb.feed .lvi img{width:18px;height:20px;right:-6px;bottom:-5px}
#liveBar .lvb.feed .lvx b{-webkit-line-clamp:1;font-size:13px}
#liveBar .lvb.feed .lvx small{font-size:10.5px}
/* œuf et éclosion */
.hatchbox{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;text-align:center}
.hkick{font:800 12px var(--display);letter-spacing:.1em;text-transform:uppercase;color:#fff;background:var(--teal);border:2px solid var(--ink);border-radius:999px;padding:3px 12px 1px}
.hlead{margin:0;font-size:15px;line-height:1.4;color:var(--ink2);text-wrap:balance}
.eggbtn{position:relative;background:radial-gradient(circle at 50% 55%,#fff8dc 0 35%,transparent 66%);border:0;padding:6px 18px 0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.eggwrap{display:block;width:150px;height:200px;transform-origin:50% 92%;animation:eggIdle 2.6s ease-in-out infinite}
.eggwrap svg{width:100%;height:100%;display:block;overflow:visible}
@keyframes eggIdle{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-5deg)}82%{transform:rotate(5deg)}88%{transform:rotate(-3deg)}94%{transform:rotate(0)}}
.eggbtn.wob .eggwrap{animation:eggWob .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes eggWob{0%{transform:scale(1)}20%{transform:rotate(-12deg) scale(1.06,.94)}45%{transform:rotate(10deg) scale(.96,1.05)}70%{transform:rotate(-5deg)}100%{transform:none}}
.eggbtn.burst .eggwrap{animation:eggBurst .65s ease-in forwards}
@keyframes eggBurst{0%{transform:scale(1)}40%{transform:scale(1.18,.86)}100%{transform:scale(1.6);opacity:0;filter:brightness(2.2)}}
.eggbtn.burst::after{content:"";position:absolute;inset:-30px;border-radius:50%;background:radial-gradient(circle,#fff 0 30%,rgba(255,246,201,.8) 45%,transparent 70%);animation:eggFlash .65s ease-out forwards}
@keyframes eggFlash{0%{opacity:0;transform:scale(.3)}70%{opacity:1}100%{opacity:0;transform:scale(1.4)}}
.eggdots{display:flex;gap:8px}.eggdots i{width:14px;height:14px;border-radius:50%;border:2.5px solid var(--ink);background:#fff;transition:background .2s,transform .3s cubic-bezier(.3,1.6,.5,1)}
.eggdots i.on{background:var(--gold);transform:scale(1.2)}
.egghint{margin:0;font:800 16px var(--display);color:var(--ink);min-height:22px}
.hatchbox.named{gap:6px}
.hrays{position:relative;width:190px;height:190px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 50%,#fff 0 38%,var(--tint) 39% 100%);border:3px solid var(--ink);box-shadow:0 0 0 7px #fff3c4,0 0 0 10px var(--ink);overflow:hidden;isolation:isolate}
.hrays::before{content:"";position:absolute;inset:-40%;z-index:-1;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.75) 0 12deg,transparent 12deg 30deg);animation:rays 9s linear infinite}
.hrays.pop{animation:dpop .7s cubic-bezier(.2,1.6,.4,1) both}
.hart{width:168px;margin-top:22px}.hart svg{width:100%;height:auto;display:block}
.hrar{margin-top:14px;font:800 12.5px var(--display);color:#fff;background:var(--rc);border:2px solid var(--ink);border-radius:999px;padding:2px 12px 1px;letter-spacing:.03em}
.hgenes{margin:0;font:700 13.5px var(--display);color:var(--ink2)}
.hnlab{margin-top:4px;font:700 14px var(--display);color:var(--ink2)}
.hnrow{display:flex;gap:8px;width:100%;max-width:300px}
.hnrow input{flex:1;min-width:0;font:800 20px var(--display);color:var(--ink);text-align:center;background:#fff;border:2.5px solid var(--ink);border-radius:14px;padding:6px 10px 4px;box-shadow:inset 0 2px 0 rgba(74,53,40,.12)}
.hnrow input:focus{outline:3px solid var(--teal);outline-offset:1px}
@media (prefers-reduced-motion:reduce){.eggwrap,.eggbtn.wob .eggwrap{animation:none}.hrays::before{animation:none}}
/* menu (carnet) */
#sheet[data-kind="menu"] #panelBody{display:flex;flex-direction:column;gap:12px}
.msec{background:#fff;border:2.5px solid var(--ink);border-radius:18px;padding:10px;box-shadow:0 3px 0 rgba(74,53,40,.25);display:flex;flex-direction:column;gap:7px}
.msec.hot{background:#fffbe6;border-color:var(--goldD)}
.msec header{display:flex;align-items:center;justify-content:space-between;gap:8px}
.msec h3{margin:0;font:800 16px var(--display)}
.mrow{display:flex;align-items:center;gap:10px;min-width:0}
.mrow>div,.mrow>label{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.mrow b{font:700 14.5px/1.2 var(--display)}
.mrow span{font-size:12.5px;color:var(--ink2);line-height:1.3}
.mrow .btn{flex:none}
.mri{flex:none;width:40px;height:40px;border-radius:12px;background:#fff3e2;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink)}
.mri svg{width:28px;height:28px}.mri.ev{background:var(--ec);border-color:var(--ink);border-radius:50%}.mri.ev svg{width:22px;height:22px}
.mri .mtag{width:18px;height:18px;border-radius:50%;background:var(--tc);border:2px solid var(--ink)}
.mbar{display:block;height:7px;border-radius:999px;background:#f1e4c8;border:1.5px solid var(--ink);overflow:hidden;margin:2px 0}.mbar i{display:block;height:100%;background:linear-gradient(90deg,#f2c14e,#5fbf7f)}
.mstreak{display:flex;flex-direction:column;gap:6px;padding-top:4px;border-top:2px dashed var(--line)}
.mstreak .streak{font-size:15px}.mstreak .streak svg{width:20px;height:20px}
.mstreak{flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px 10px}.mstreak .small{flex-basis:100%;margin:0}
.mdots{display:flex;gap:5px}.mdots i{width:14px;height:14px;border-radius:50%;border:2px solid var(--ink);background:#fff}.mdots i.on{background:var(--green)}.mdots i.now{background:var(--gold);box-shadow:0 0 0 3px rgba(246,196,69,.45)}.mdots i.big{width:18px;height:18px;margin-top:-2px}
.mtuto{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}
.mtuto li{display:flex;flex-direction:column;border:2px solid var(--line);border-radius:12px;padding:5px 9px}
.mtuto li b{font:700 14px var(--display)}.mtuto li span{font-size:12.5px;color:var(--ink2)}
.mtuto li.ok{background:#eef8f0;opacity:.8}.mtuto li.cur{border-color:var(--ink);background:#fff3c4}
.mrow.set select{flex:none;max-width:46%}
/* refuge */
.rfhead{display:flex;align-items:center;gap:10px}
.rfhi{width:46px;height:46px;flex:none;border-radius:14px;background:#fde3ea;border:2.5px solid var(--ink);display:flex;align-items:center;justify-content:center;color:var(--ink)}.rfhi svg{width:32px;height:32px}
.rfhead h2{margin:0;font:800 20px var(--display)}.rfhead p{margin:2px 0 0;font-size:13px;color:var(--ink2)}
.rfh{margin:14px 0 7px;font:800 16px var(--display);display:flex;align-items:center;gap:8px}.rfh small{font:700 13px var(--display);color:var(--muted)}
.rfh::after{content:"";flex:1;height:2px;background:var(--line);border-radius:2px}
.rfgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:7px}
.rfc{position:relative;display:flex;align-items:center;gap:9px;background:linear-gradient(90deg,var(--tint),#fff 70%);border:2.5px solid var(--line);border-radius:16px;padding:6px 8px 6px 6px;min-width:0}
.rfc.in{border-color:var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.3)}
.rfc.r2,.rfc.r3,.rfc.r4{border-color:var(--rc);box-shadow:0 0 0 2px var(--rc) inset}
.rfc.empty{justify-content:center;min-height:62px;border-style:dashed;background:rgba(255,255,255,.5);font:700 14px var(--display);color:var(--muted)}
.rfp{flex:none;width:54px;height:58px;padding:0;border:2px solid var(--ink);border-radius:14px;background:#fff;overflow:hidden;cursor:pointer}
.rfp img,.rfp .livep{width:100%!important;height:100%!important;display:block}
.rfx{flex:1;display:flex;flex-direction:column;gap:1px;min-width:0}
.rfx b{display:flex;align-items:center;gap:4px;font:800 16px/1.15 var(--display);min-width:0}
.rfs{font:700 12px var(--display);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rfr{font:700 11.5px var(--display);color:var(--rc);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rfa{flex:none}
.rfa .btn{padding:7px 10px 5px;font-size:13.5px}
.rfren{flex:none;width:24px;height:24px;border-radius:50%;background:#fff;border:1.5px solid var(--line);color:var(--ink2);cursor:pointer;padding:3px;display:inline-flex}
.rfren svg{width:100%;height:100%}
.rfnote{margin:-2px 0 8px;font-size:12.5px;color:var(--ink2)}
.rfempty{margin:0;padding:10px;border:2px dashed var(--line);border-radius:12px;font-size:13.5px;color:var(--ink2)}
.rfeggs{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.rfegg{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fffaf0;border:2px solid var(--line);border-radius:16px;padding:8px}
.rfeic svg{width:52px;height:68px;display:block}.rfegg b{font:700 12.5px var(--display)}
@media (max-width:420px){.rfgrid{grid-template-columns:1fr}}
`;
  document.head.appendChild(st);
})();

window.__collection = { addComp, addEgg, spOf, compLook, teamIds, compIds, setTeam, teamAdd, teamRemove, renameComp, firstRunNext, startFirstRun, nextAction, hatchEggScreen, readyEggs, SP_INFO, SP_IDS, FIRST_RUN_STEPS, pendingRewards, S: () => S };

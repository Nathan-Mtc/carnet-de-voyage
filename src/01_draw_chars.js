const NS = 'http://www.w3.org/2000/svg';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

function shade(hex, f) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
const hexRGB = h => { const n = parseInt(String(h).slice(1), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function mixHex(a, b, t) { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const lumHex = h => { const [r, g, b] = hexRGB(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
function smooth(pts) {
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const heartD = (x, y, r) => `M${x} ${y + r * 0.95}C${x - r * 1.7} ${y - r * 0.15} ${x - r * 0.75} ${y - r * 1.35} ${x} ${y - r * 0.4}C${x + r * 0.75} ${y - r * 1.35} ${x + r * 1.7} ${y - r * 0.15} ${x} ${y + r * 0.95}Z`;
const starD = (x, y, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.47 : r; d += (i ? 'L' : 'M') + (x + Math.cos(a) * q).toFixed(1) + ' ' + (y + Math.sin(a) * q).toFixed(1); } return d + 'Z'; };
const twinkleD = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
function capsule(x1, y1, x2, y2, w, fill, line) {
  const d = `M${x1} ${y1}L${x2} ${y2}`;
  return `<path d="${d}" stroke="${line}" stroke-width="${w + 3.4}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
}

// ---------- les compagnons de départ (anciennes clés, gardées pour les anciennes sauvegardes) ----------
const CHARS = {
  pistache: {
    name: 'Pistache', sp: 'panda', species: 'Panda roux', perso: 'Curieuse',
    bio: 'Elle renifle tout ce qui bouge, collectionne les feuilles d’érable et range ses trésors dans son écharpe. Très courageuse, sauf devant les pigeons.',
    love: 'les pommes, les fruits, le pain tout chaud, les forêts', hate: 'les pigeons, l’odeur de la mer',
    tw: 44, head: { rx: 94, ry: 78 }, eye: { dx: 37, y: 156, rx: 12.5, ry: 14.5 }, mouthY: 194, mouth: 'w', blush: { dx: 60, y: 178 },
    c: { fur: '#ec9c6f', fur2: '#cf7752', dark: '#86574a', light: '#fff5ea', inner: '#6b443a', iris: '#a0603a', line: '#6b4a3c', blush: '#f49a98' },
    sleepAfter: 26, foods: { pomme: 'love', crepe: 'like', mandarine: 'like', crevette: 'hate' },
    outfit: { tete: 'none', cou: 'echarpe', haut: 'none', bas: 'none', mains: 'none', pieds: 'none', dos: 'none' },
    lines: {
      hello: ['Oh ! Tu as vu ce qu’il y a là-bas ?', 'Je peux renifler ta poche ?', 'On part explorer ?'],
      pet: ['Encore ! Derrière les oreilles…', 'Mmmh, c’est bien, ça.'],
      click: ['Hihi ! Ça chatouille !', 'Attrape-moi si tu peux !'],
      wake: ['Hein ? Je dormais pas…', 'J’ai rêvé d’une forêt en pommes.'],
      idle: ['Ça sent la forêt par ici…', 'Tu crois que les nuages ont un goût ?', 'Il y a un pigeon ? Non ? Ouf.'],
      love: 'Une pomme ! Ma préférée de toute la vie !', like: 'Miam, merci !', hate: 'Beurk… ça sent la mer.',
      tap: ['Hihi ! Ça chatouille !', 'Tu as une pomme ? Juste une petite ?', 'Ça sent le pain chaud… tu sens aussi ?', 'Une fraise, une poire, une pomme… je veux tout !', 'On va renifler la boulangerie ?', 'J’ai caché une noisette dans mon écharpe.', 'Encore ! Derrière les oreilles…', 'Tu es mon humain préféré !'],
      night: ['Mmh… cinq minutes encore…', 'Je rêvais d’une tartine à la pomme…', 'Chut… les étoiles dorment aussi.'],
      away: ['Coucou de la route ! Ça sent les fruits ici !', 'Je te rapporte un truc qui croustille !', 'Il y a plein de choses à renifler !'],
    },
  },
  mochi: {
    name: 'Mochi', sp: 'capy', species: 'Capybara', perso: 'Zen',
    bio: 'Le plus calme de la bande. Il peut s’endormir n’importe où, et un petit oiseau nommé Pépin vient souvent se poser sur sa mandarine.',
    love: 'les mandarines, les citrons, le thé bien chaud, les siestes, les sources chaudes', hate: 'courir, le bruit',
    tw: 52, head: { rx: 90, ry: 80 }, eye: { dx: 42, y: 128, rx: 10, ry: 11 }, mouthY: 206, mouth: 'small', blush: { dx: 66, y: 156 }, lids: true,
    c: { fur: '#d9b18b', fur2: '#c39470', dark: '#8e6a4f', light: '#f2e0c8', inner: '#8a6248', iris: '#6a4632', line: '#6b4a3c', blush: '#f2a29a' },
    sleepAfter: 14, foods: { mandarine: 'love', pomme: 'like', crepe: 'like', crevette: 'hate' },
    outfit: { tete: 'mandarine', cou: 'none', haut: 'none', bas: 'none', mains: 'none', pieds: 'none', dos: 'none' },
    lines: {
      hello: ['On n’est pas pressés.', 'Tu veux faire une sieste avec moi ?', 'Respire. Tout va bien.'],
      pet: ['Mmmh… continue…', 'Je pourrais rester là cent ans.'],
      click: ['Oh. Bonjour.', 'Doucement… doucement.'],
      wake: ['…Il est quelle heure ?', 'J’étais en train de méditer.'],
      idle: ['Pépin, tu es là ?', 'Une source chaude… ce serait bien.'],
      bird: 'Mon ami Pépin est revenu.',
      love: 'Une mandarine… Je la garde sur ma tête.', like: 'Merci, c’est gentil.', hate: 'Non merci. Trop d’émotions.',
      tap: ['Oh. Bonjour, toi.', 'Un thé bien chaud… et la vie est douce.', 'Le yuzu, ça sent le soleil d’hiver.', 'Respire avec moi. Inspire… expire…', 'Rien ne presse. Tout arrive.', 'Un chocolat chaud ? Oui. Toujours oui.', 'Pépin dit bonjour aussi.', 'Mmmh… continue…'],
      night: ['…zzz… une tisane… zzz…', 'Je méditais. Les yeux fermés.', 'La lune est une grosse mandarine.'],
      away: ['Je marche doucement. C’est ça, le secret.', 'J’ai vu un citronnier. Très beau.', 'Pas d’inquiétude. J’arrive… un jour.'],
    },
  },
  bulle: {
    name: 'Bulle', sp: 'axo', species: 'Axolotl', perso: 'Joyeuse',
    bio: 'Toujours souriante, elle fait des bulles quand elle est contente et éclabousse tout le monde au bord de l’eau. Elle adore la pluie.',
    love: 'la mer, les glaces, les crevettes, les jours de pluie', hate: 'le soleil trop fort, la poussière',
    tw: 46, head: { rx: 102, ry: 76 }, eye: { dx: 50, y: 146, rx: 10.5, ry: 11.5 }, mouthY: 170, mouth: 'wide', blush: { dx: 72, y: 166 },
    c: { fur: '#f8c4d2', fur2: '#ee9fb8', dark: '#de7c9c', light: '#fde8ef', inner: '#e7809f', iris: '#5b3a52', line: '#7a4e5c', blush: '#f58aa6', gill: '#f08db0', frill: '#fbb6cb' },
    sleepAfter: 30, foods: { crevette: 'love', crepe: 'like', pomme: 'like', mandarine: 'hate' },
    outfit: { tete: 'none', cou: 'none', haut: 'none', bas: 'none', mains: 'none', pieds: 'bottes', dos: 'none' },
    lines: {
      hello: ['Bloup !', 'On va à la plage ? Dis oui !', 'Il va pleuvoir ? J’espère !'],
      pet: ['Hihihi ! Mes branchies !', 'Encore, encore !'],
      click: ['Plouf ! Je t’ai eu !', 'Bloup bloup !'],
      wake: ['Bloup ? C’est déjà le matin ?'],
      idle: ['Bloup.', 'Tu sens la pluie, toi aussi ?'],
      love: 'CREVETTE ! Tu es la meilleure personne du monde !', like: 'Bloup ! Merci !', hate: 'C’est tout sec et ça pique…',
      tap: ['Bloup bloup ! Coucou !', 'On va à la mer ? Dis oui, dis oui !', 'Une glace à la fraise ! Non, deux !', 'Plouf ! Je t’ai eu !', 'Les vagues, c’est des câlins mouillés !', 'Glace à la vanille, ou au melon ? Les deux !', 'Hihihi ! Mes branchies !', 'Je fais des bulles de joie !'],
      night: ['Bloup… je rêve de la mer…', 'Zzz… une glace… géante… zzz', 'Bloup ? Il fait encore nuit…'],
      away: ['Bloup ! Je cherche la mer !', 'Je te garde un coquillage !', 'Il pleut ? Trop bien !'],
    },
  },
};

// ---------- vestiaire ----------
const SLOTS = [
  ['tete', 'Tête', [['Rien', 'none'], ['Casquette', 'casquette'], ['Bonnet', 'bonnet'], ['Béret', 'beret'], ['Mandarine', 'mandarine'], ['Fleurs', 'fleurs']]],
  ['cou', 'Cou', [['Rien', 'none'], ['Écharpe', 'echarpe'], ['Foulard', 'foulard'], ['Nœud pap’', 'noeud']]],
  ['haut', 'Haut', [['Rien', 'none'], ['T-shirt', 'tshirt'], ['Pull', 'pull'], ['Sweat à capuche', 'sweat']]],
  ['bas', 'Bas', [['Rien', 'none'], ['Caleçon', 'calecon'], ['Short', 'short'], ['Jupe', 'jupe']]],
  ['mains', 'Mains', [['Rien', 'none'], ['Gants', 'gants'], ['Moufles', 'moufles']]],
  ['pieds', 'Pieds', [['Rien', 'none'], ['Chaussettes', 'chaussettes'], ['Bottes de pluie', 'bottes']]],
  ['dos', 'Dos', [['Rien', 'none'], ['Sac à dos', 'sac'], ['Cape', 'cape']]],
];
const MOODS = [['Content', 'content'], ['Fou rire', 'rire'], ['Amoureux', 'amour'], ['Surpris', 'surpris'], ['Triste', 'triste'], ['Boudeur', 'boude'], ['Endormi', 'dodo'], ['Curieux', 'curieux'], ['Fier', 'fier']];
const FOODS = [['Pomme', 'pomme'], ['Mandarine', 'mandarine'], ['Crevette', 'crevette'], ['Crêpe', 'crepe']];

// =====================================================================
// ESPÈCES ET GÈNES (source de vérité des gènes dessinables)
// genes = { pal, base, accent, belly, pattern, patCol, eye, special }
//   pal : id de la palette d’origine ('mix' = couleurs mélangées, 'hybride')
//   base / accent / belly : couleurs #hex (pelage, marques sombres, ventre)
// =====================================================================
const RARITY_W = [100, 34, 11, 3, 0.7];
const EYES = {
  def: { name: 'Naturels', r: 0 },
  noisette: { name: 'Noisette', r: 0, col: '#9a6a3a' },
  bleu: { name: 'Bleu ciel', r: 1, col: '#4f9fd6' },
  vert: { name: 'Vert tendre', r: 1, col: '#5fae6e' },
  violet: { name: 'Lavande', r: 2, col: '#9b7fd4' },
  rose: { name: 'Rose bonbon', r: 2, col: '#ee7fa8' },
  or: { name: 'Dorés', r: 3, col: '#e2a92e' },
  vairon: { name: 'Vairons', r: 3, col: '#4f9fd6', col2: '#e2a92e' },
};
const PATTERNS = {
  uni: { name: 'Uni', r: 0 },
  taches: { name: 'Taches', r: 1 },
  rayures: { name: 'Rayures', r: 1 },
  pattes: { name: 'Pattes colorées', r: 1 },
  degrade: { name: 'Dégradé', r: 2 },
  masque: { name: 'Masque', r: 2 },
  coeurs: { name: 'Cœurs', r: 3 },
  etoiles: { name: 'Étoiles', r: 3 },
};
const SPECIALS = {
  none: { name: 'Aucun', r: 0 },
  bebe: { name: 'Bébé', r: 3 },
  pastel: { name: 'Aura pastel', r: 3 },
  brillant: { name: 'Brillant', r: 4 },
};
const PAT_COLS = ['#f6a6c1', '#a8d8f0', '#bfe6c4', '#f6d88a', '#cdb8ee', '#ffffff'];
const TRAIT_NAMES = { ears: 'Oreilles', tail: 'Queue', mask: 'Masque', snout: 'Museau', arms: 'Bras', gills: 'Branchies', flippers: 'Nageoires' };

const PAL = (id, name, r, base, accent, belly, more) => ({ id, name, r, base, accent, belly, ...(more || {}) });
const SHARED_PAL = {
  lavande: PAL('lavande', 'Lavande', 2, '#cdb8e8', '#8f76b8', '#f6f0fd', { pc: '#f6c2d6' }),
  menthe: PAL('menthe', 'Menthe', 2, '#b9e4cf', '#6aa88e', '#f0fbf5', { pc: '#fff3b0' }),
  peche: PAL('peche', 'Pêche', 2, '#f8c6a6', '#d98a68', '#fff2e8', { pc: '#f49aa8' }),
  rose: PAL('rose', 'Barbe à papa', 2, '#f6c1d6', '#d27d9f', '#fff0f6', { pc: '#b8dcf4' }),
  ciel: PAL('ciel', 'Bleu ciel', 2, '#b9d8f2', '#6d97c4', '#f2f8ff', { pc: '#fff3b0' }),
  nuit: PAL('nuit', 'Nuit étoilée', 3, '#7377be', '#3d4182', '#dcdff7', { pc: '#ffe27a', pat: 'etoiles', x: { line: '#2e2a4f', blush: '#f29ac0' } }),
  corail: PAL('corail', 'Corail', 3, '#f7998a', '#c85a55', '#ffe8e0', { pc: '#fff3c8' }),
  aurore: PAL('aurore', 'Aurore boréale', 3, '#b5e6dc', '#6fa0c4', '#f5eefc', { pc: '#f6a6c8', grad: ['#c4f0e0', '#b3d6f4', '#e6c8f2'] }),
  ocean: PAL('ocean', 'Océan', 3, '#8cc2df', '#4a83a6', '#e3f3fb', { pc: '#ffffff' }),
  or: PAL('or', 'Or', 4, '#f4cd68', '#b98328', '#fff5d2', { pc: '#fff3b8', grad: ['#ffeaa8', '#f4c552', '#eaa53a'], x: { line: '#7e5222' }, fx: 'glint' }),
  arcenciel: PAL('arcenciel', 'Arc-en-ciel', 4, '#f6c2cf', '#a98ad6', '#fffaf0', { pc: '#ffffff', grad: ['#f9aac0', '#fbd38d', '#bfe6a8', '#a8d8f0', '#cdb5f0'], x: { line: '#6e5474' } }),
  cristal: PAL('cristal', 'Cristal', 4, '#dcecfb', '#8cb2da', '#ffffff', { pc: '#ffffff', grad: ['#f6fcff', '#cfe3fa', '#e6dbff'], x: { line: '#56658f' }, fx: 'glint' }),
};
const sharedPals = ids => ids.map(id => SHARED_PAL[id]);
const ALL_PATS = ['uni', 'taches', 'rayures', 'pattes', 'degrade', 'masque', 'coeurs', 'etoiles'];

// shape : silhouette ; parts : morceaux dessinés (ears, tail, snout, mask, arms, hands) ;
// graft : traits « greffables » sur un hybride (le premier est le trait signature).
const SPECIES = {
  panda: {
    name: 'Panda roux', habitat: 'Forêts et montagnes d’Asie',
    shape: { tw: 44, head: { rx: 94, ry: 78 }, eye: { dx: 37, y: 156, rx: 12.5, ry: 14.5 }, mouthY: 194, mouth: 'w', blush: { dx: 60, y: 178 }, iris: '#a0603a', limbDark: true, belly: 'dark', torso: 'std', legs: true },
    parts: { ears: 'panda', tail: 'panda', snout: 'panda', mask: null, arms: 'arm', hands: 'paw' },
    graft: ['tail', 'ears'],
    palettes: [PAL('naturel', 'Naturel', 0, '#ec9c6f', '#86574a', '#fff5ea', { x: { fur2: '#cf7752', inner: '#6b443a', line: '#6b4a3c', blush: '#f49a98' } }),
      PAL('creme', 'Crème', 0, '#f2cfa5', '#a07a5f', '#fffaf2'), PAL('chocolat', 'Chocolat', 0, '#b4735a', '#5a3a32', '#f6e5d5'), PAL('cannelle', 'Cannelle', 1, '#e07e58', '#6e3a30', '#fff0e2'),
      ...sharedPals(['lavande', 'menthe', 'nuit', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#f4caa6', b: '#d9825a', m: 'leaves' },
  },
  capy: {
    name: 'Capybara', habitat: 'Rivières et lacs d’Amérique du Sud',
    shape: { tw: 52, head: { rx: 90, ry: 80 }, eye: { dx: 42, y: 128, rx: 10, ry: 11 }, mouthY: 206, mouth: 'small', blush: { dx: 66, y: 156 }, iris: '#6a4632', belly: 'patch', torso: 'std', legs: true },
    parts: { ears: 'capy', tail: null, snout: 'capy', mask: null, arms: 'arm', hands: 'paw' },
    graft: ['snout', 'ears'],
    palettes: [PAL('naturel', 'Naturel', 0, '#d9b18b', '#8e6a4f', '#f2e0c8', { x: { fur2: '#c39470', inner: '#8a6248', line: '#6b4a3c', blush: '#f2a29a' } }),
      PAL('creme', 'Crème', 0, '#ead3b4', '#a5876b', '#fbf2e4'), PAL('chocolat', 'Chocolat', 0, '#a57a5c', '#5c4334', '#e8d4bf'), PAL('cendre', 'Cendré', 1, '#c7bcb0', '#7b6f66', '#f1ece6'),
      ...sharedPals(['peche', 'menthe', 'corail', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#ead6b8', b: '#8fc2d6', m: 'waves' },
  },
  axo: {
    name: 'Axolotl', habitat: 'Lacs et eaux douces du Mexique',
    shape: { tw: 46, head: { rx: 102, ry: 76 }, eye: { dx: 50, y: 146, rx: 10.5, ry: 11.5 }, mouthY: 170, mouth: 'wide', blush: { dx: 72, y: 166 }, iris: '#5b3a52', belly: 'patch', torso: 'std', legs: true, bubbles: true },
    parts: { ears: 'axo', tail: 'axo', snout: null, mask: null, arms: 'arm', hands: 'axo' },
    graft: ['ears', 'tail'], graftNames: { ears: 'Branchies' },
    palettes: [PAL('naturel', 'Rose', 0, '#f8c4d2', '#de7c9c', '#fde8ef', { x: { fur2: '#ee9fb8', inner: '#e7809f', line: '#7a4e5c', blush: '#f58aa6', gill: '#f08db0', frill: '#fbb6cb' } }),
      PAL('perle', 'Perle', 0, '#fbf0ef', '#e59ab0', '#ffffff', { x: { gill: '#f0819f', frill: '#f9c3d2', line: '#7a4e5c' } }),
      PAL('vase', 'Vase', 0, '#b3ab84', '#6c6849', '#e8e3c8', { x: { gill: '#c07884', frill: '#dcaab0' } }),
      PAL('dore', 'Doré', 1, '#f6dc92', '#d6a24a', '#fff6dc', { x: { gill: '#f2a07a', frill: '#fbd0a8' } }),
      ...sharedPals(['lavande', 'ciel', 'nuit', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#fbd5e0', b: '#ef93b2', m: 'bubbles' },
  },
  renard: {
    name: 'Renard polaire', habitat: 'Grand Nord, neige et banquise',
    shape: { tw: 42, head: { rx: 96, ry: 76 }, eye: { dx: 38, y: 150, rx: 12, ry: 13.5 }, mouthY: 190, mouth: 'w', blush: { dx: 62, y: 172 }, iris: '#5b6c92', belly: 'patch', torso: 'std', legs: true },
    parts: { ears: 'renard', tail: 'renard', snout: 'renard', mask: null, arms: 'arm', hands: 'paw' },
    graft: ['tail', 'ears'],
    palettes: [PAL('neige', 'Neige', 0, '#f5f5f8', '#aab6cb', '#ffffff', { x: { fur2: '#dce1ec', line: '#5f566c', inner: '#efc3d0', blush: '#f5a3b4', tip: '#ffffff' } }),
      PAL('ete', 'Pelage d’été', 0, '#b89d84', '#6e5646', '#efe3d6'), PAL('bleu', 'Bleu polaire', 0, '#aab6c6', '#66738a', '#ebf0f6'), PAL('givre', 'Givre', 1, '#e3edf8', '#8ea7c6', '#ffffff'),
      ...sharedPals(['lavande', 'rose', 'aurore', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#eef4fa', b: '#9fbbdb', m: 'snow' },
  },
  fennec: {
    name: 'Fennec', habitat: 'Déserts d’Afrique du Nord et du Moyen-Orient',
    shape: { tw: 40, head: { rx: 88, ry: 74 }, eye: { dx: 35, y: 154, rx: 13, ry: 15 }, mouthY: 192, mouth: 'w', blush: { dx: 56, y: 178 }, iris: '#7a4a2e', belly: 'patch', torso: 'std', legs: true },
    parts: { ears: 'fennec', tail: 'fennec', snout: 'fennec', mask: null, arms: 'arm', hands: 'paw' },
    graft: ['ears', 'tail'],
    palettes: [PAL('naturel', 'Sable', 0, '#f0d09c', '#cf955a', '#fff6e6', { x: { pink: '#f5b3a5' } }),
      PAL('creme', 'Crème', 0, '#f7e5c4', '#d4b384', '#fffbf3'), PAL('cannelle', 'Cannelle', 0, '#e0a76c', '#9d6038', '#fbe9d2'), PAL('rosedesert', 'Rose des sables', 1, '#f2c3b2', '#c27c68', '#fff1eb'),
      ...sharedPals(['peche', 'menthe', 'corail', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#f6e0b5', b: '#e0a35f', m: 'dunes' },
  },
  tanuki: {
    name: 'Tanuki', habitat: 'Forêts et villages du Japon et de Corée',
    shape: { tw: 54, head: { rx: 96, ry: 80 }, eye: { dx: 38, y: 150, rx: 11, ry: 12.5 }, mouthY: 198, mouth: 'w', blush: { dx: 66, y: 182 }, iris: '#b07a46', limbDark: true, belly: 'round', torso: 'round', legs: true },
    parts: { ears: 'tanuki', tail: 'tanuki', snout: 'tanuki', mask: 'tanuki', arms: 'arm', hands: 'paw' },
    graft: ['mask', 'tail'],
    palettes: [PAL('naturel', 'Naturel', 0, '#bf9f80', '#5c4a40', '#f6ead8', { x: { line: '#5b4136' } }),
      PAL('roux', 'Roux', 0, '#c98d61', '#5a3c2f', '#f8e6cf'), PAL('gris', 'Gris', 0, '#aaa39b', '#4e4846', '#f0ece7'), PAL('automne', 'Automne', 1, '#dca75e', '#6c482c', '#fbe9c8'),
      ...sharedPals(['lavande', 'menthe', 'nuit', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS.filter(p => p !== 'masque'),
    egg: { a: '#e6d2b4', b: '#7d5d48', m: 'leaves2' },
  },
  paresseux: {
    name: 'Paresseux', habitat: 'Forêts tropicales d’Amérique du Sud et centrale',
    shape: { tw: 46, head: { rx: 94, ry: 80 }, eye: { dx: 31, y: 152, rx: 9.5, ry: 10.5 }, mouthY: 186, mouth: 'smile', blush: { dx: 58, y: 178 }, iris: '#6a4a36', belly: 'patch', torso: 'std', legs: true },
    parts: { ears: null, tail: null, snout: 'paresseux', mask: 'paresseux', arms: 'long', hands: 'claw' },
    graft: ['mask', 'arms'],
    palettes: [PAL('naturel', 'Naturel', 0, '#c9b39b', '#6c5444', '#f6ebdc'),
      PAL('cacao', 'Cacao', 0, '#a68a73', '#56423a', '#efe1d1'), PAL('creme', 'Crème', 0, '#e3d3bd', '#8a735f', '#fdf7ee'), PAL('mousse', 'Mousse', 1, '#b9c39a', '#5f6a45', '#f2f3e2'),
      ...sharedPals(['peche', 'lavande', 'aurore', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS.filter(p => p !== 'masque'),
    egg: { a: '#d8eac6', b: '#78a964', m: 'flowers' },
  },
  lemur: {
    name: 'Lémurien', habitat: 'Madagascar et océan Indien',
    shape: { tw: 42, head: { rx: 92, ry: 78 }, eye: { dx: 37, y: 148, rx: 15, ry: 16 }, eyeStyle: 'big', mouthY: 200, mouth: 'small', blush: { dx: 64, y: 180 }, iris: '#f0a531', belly: 'patch', torso: 'std', legs: true },
    parts: { ears: 'lemur', tail: 'lemur', snout: 'lemur', mask: 'lemur', arms: 'arm', hands: 'paw' },
    graft: ['tail', 'mask'], graftNames: { mask: 'Grands yeux' },
    palettes: [PAL('naturel', 'Naturel', 0, '#b8b4bc', '#3d3842', '#f9f7f5'),
      PAL('brun', 'Brun', 0, '#b9a18e', '#4c3d36', '#f7f0e8'), PAL('blanc', 'Blanc', 0, '#e9e6ec', '#6b6572', '#ffffff'), PAL('roux', 'Roux', 1, '#d29a73', '#5a3a2c', '#fbefe4'),
      ...sharedPals(['lavande', 'ciel', 'nuit', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS.filter(p => p !== 'masque'),
    egg: { a: '#ece8ef', b: '#5d5764', m: 'rings' },
  },
  phoque: {
    name: 'Phoque', habitat: 'Côtes froides, banquise et océans',
    shape: { tw: 56, head: { rx: 94, ry: 78 }, eye: { dx: 38, y: 146, rx: 13, ry: 15 }, mouthY: 196, mouth: 'small', blush: { dx: 64, y: 170 }, iris: '#3e3346', belly: 'seal', torso: 'pear', legs: false },
    parts: { ears: null, tail: 'phoque', snout: 'phoque', mask: null, arms: 'flipper', hands: 'flipper' },
    graft: ['arms', 'snout'], graftNames: { arms: 'Nageoires' },
    palettes: [PAL('banquise', 'Banquise', 0, '#eef0f4', '#a7b0c2', '#ffffff', { x: { line: '#5a5668', fur2: '#d8dde8' } }),
      PAL('gris', 'Gris', 0, '#b9c0ca', '#6b7483', '#e7ecf2', { pc: '#8e97a6' }), PAL('sable', 'Sable', 0, '#d8cbb8', '#857766', '#f3ede4'),
      PAL('tachete', 'Léopard des mers', 1, '#c9ccd2', '#5f6672', '#eef0f3', { pc: '#6f7784', pat: 'taches' }),
      ...sharedPals(['ciel', 'menthe', 'ocean', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#e0ebf4', b: '#86a9c8', m: 'waves' },
  },
  quokka: {
    name: 'Quokka', habitat: 'Australie et ses îles',
    shape: { tw: 44, head: { rx: 92, ry: 78 }, eye: { dx: 37, y: 146, rx: 11, ry: 12.5 }, mouthY: 184, mouth: 'grin', blush: { dx: 62, y: 172 }, iris: '#5a3a28', belly: 'patch', torso: 'std', legs: true },
    parts: { ears: 'quokka', tail: 'quokka', snout: 'quokka', mask: null, arms: 'arm', hands: 'paw' },
    graft: ['snout', 'ears'], graftNames: { snout: 'Grand sourire' },
    palettes: [PAL('naturel', 'Naturel', 0, '#c49a72', '#77573f', '#f1dcc1', { x: { pink: '#eda8a0' } }),
      PAL('miel', 'Miel', 0, '#dbb07c', '#8f653e', '#fcedd6'), PAL('cacao', 'Cacao', 0, '#a27b5f', '#563f33', '#ead7c3'), PAL('sable', 'Sable', 1, '#e2cba6', '#9a7d58', '#fbf4e6'),
      ...sharedPals(['peche', 'rose', 'corail', 'or', 'arcenciel', 'cristal'])],
    patterns: ALL_PATS,
    egg: { a: '#f7dcc0', b: '#e59a5e', m: 'suns' },
  },
};
for (const [id, s] of Object.entries(SPECIES)) {
  s.id = id;
  const p = s.palettes[0];
  s.defGenes = { pal: p.id, base: p.base, accent: p.accent, belly: p.belly, pattern: 'uni', patCol: p.pc || mixHex(p.base, p.accent, 0.55), eye: 'def', special: 'none' };
  s.traits = Object.fromEntries(s.graft.map(t => [t, (s.graftNames && s.graftNames[t]) || TRAIT_NAMES[t]]));
}
const LEGACY_SP = { pistache: 'panda', mochi: 'capy', bulle: 'axo' };

// ---------- apparence d’un individu ----------
function compLookDefault(key) {
  const ch = typeof CHARS !== 'undefined' ? CHARS[key] : null;
  let sp = LEGACY_SP[key] || (SPECIES[key] ? key : null);
  if (!sp && ch && SPECIES[ch.sp]) return { sp: ch.sp, genes: { ...SPECIES[ch.sp].defGenes, ...(ch.genes || {}) }, hybrid: ch.hybrid || null };
  sp = sp || 'panda';
  return { sp, genes: { ...SPECIES[sp].defGenes }, hybrid: null };
}
function lookOf(key) {
  let L = null;
  if (key && typeof key === 'object' && key.sp) L = key;
  else if (typeof compLook === 'function') { try { L = compLook(key); } catch (e) { L = null; } }
  if (!L || !SPECIES[L.sp]) L = compLookDefault(key);
  return L;
}
function palOf(g, sp) {
  if (!g) return null;
  const lists = sp && SPECIES[sp] ? [SPECIES[sp].palettes] : Object.values(SPECIES).map(s => s.palettes);
  for (const l of lists) { const p = l.find(q => q.id === g.pal && q.base === g.base); if (p) return p; }
  return null;
}
function colorsOf(spec, g, uid) {
  const pal = palOf(g, spec.id), base = g.base, acc = g.accent, bel = g.belly;
  const c = {
    furH: base, fur: base, fur2: mixHex(shade(base, 0.9), acc, 0.12), dark: acc, light: bel,
    inner: shade(acc, 0.85), pink: mixHex('#f2a5b0', base, 0.3),
    line: mixHex(shade(acc, 0.6), '#6b4a3c', 0.5), blush: mixHex('#f49a98', base, 0.15),
    gill: mixHex(base, acc, 0.5), frill: mixHex(base, '#ffffff', 0.3), defs: '', fx: '',
  };
  if (lumHex(c.line) > 0.4) c.line = shade(c.line, 0.62);
  if (pal && pal.x) Object.assign(c, pal.x);
  const ey = EYES[g.eye] || EYES.def;
  c.iris = (ey.col) || (pal && pal.x && pal.x.iris) || spec.shape.iris;
  c.iris2 = ey.col2 || c.iris;
  c.pat = g.patCol || mixHex(base, acc, 0.55);
  if (pal && pal.grad) {
    const st = pal.grad.map((col, i) => `<stop offset="${(i / (pal.grad.length - 1)).toFixed(2)}" stop-color="${col}"/>`).join('');
    c.defs += `<linearGradient id="${uid}fg" gradientUnits="userSpaceOnUse" x1="70" y1="60" x2="250" y2="330">${st}</linearGradient>`;
    c.fur = `url(#${uid}fg)`;
  }
  if (pal && pal.fx) c.fx = pal.fx;
  return c;
}

// modèle de dessin : corps de l’espèce, traits greffés (hybride), couleurs des gènes
function charModel(key, uid) {
  const look = lookOf(key), spec = SPECIES[look.sp];
  const genes = { ...spec.defGenes, ...(look.genes || {}) };
  const S0 = spec.shape;
  const ch = {
    key, sp: spec.id, spec, genes, tw: S0.tw, head: { ...S0.head }, eye: { ...S0.eye }, mouthY: S0.mouthY, mouth: S0.mouth, blush: { ...S0.blush },
    eyeStyle: S0.eyeStyle || '', limbDark: !!S0.limbDark, belly: S0.belly, torso: S0.torso, legs: S0.legs, parts: { ...spec.parts },
    pattern: PATTERNS[genes.pattern] ? genes.pattern : 'uni', special: SPECIALS[genes.special] ? genes.special : 'none',
  };
  const hy = look.hybrid;
  if (hy && SPECIES[hy.b] && hy.b !== spec.id) {
    const B = SPECIES[hy.b], t = hy.t && B.graft.includes(hy.t) ? hy.t : B.graft[0];
    ch.hybrid = { a: spec.id, b: B.id, t };
    ch.parts[t] = B.parts[t];
    if (t === 'arms') ch.parts.hands = B.parts.hands;
    if (t === 'snout' && B.shape.mouth === 'grin') ch.mouth = 'grin';
    if (t === 'mask' && B.shape.eyeStyle) { ch.eyeStyle = B.shape.eyeStyle; ch.eye.rx *= 1.16; ch.eye.ry *= 1.12; ch.irisFrom = B.shape.iris; }
  }
  if (ch.special === 'bebe') { ch.eye.rx *= 1.12; ch.eye.ry *= 1.12; }
  ch.c = colorsOf(spec, genes, uid);
  if (ch.irisFrom && genes.eye === 'def') ch.c.iris = ch.c.iris2 = ch.irisFrom;
  const ch0 = typeof CHARS !== 'undefined' && CHARS[key];
  ch.name = (ch0 && ch0.name) || spec.name;
  ch.species = spec.name + (ch.hybrid ? ' × ' + SPECIES[ch.hybrid.b].name : '');
  return ch;
}

// ---------- dessin ----------
function geo(ch) {
  const tw = ch.tw, A = ch.parts.arms;
  const g = { tw, cw: tw, headTop: 150 - ch.head.ry, neckY: 228, shL: [160 - tw + 7, 248], shR: [160 + tw - 7, 248], hL: [160 - tw - 9, 284], hR: [160 + tw + 9, 284] };
  g.legL = [160 - 19, 300, 160 - 21, 316]; g.legR = [160 + 19, 300, 160 + 21, 316];
  if (ch.torso === 'pear') {
    g.cw = tw + 24;
    g.torso = `M${160 - tw} 222 C${160 - tw - 16} 252 ${160 - tw - 30} 294 ${160 - tw - 14} 318 C${160 - tw + 8} 334 ${160 + tw - 8} 334 ${160 + tw + 14} 318 C${160 + tw + 30} 294 ${160 + tw + 16} 252 ${160 + tw} 222 C${160 + tw - 16} 208 ${160 - tw + 16} 208 ${160 - tw} 222Z`;
  } else if (ch.torso === 'round') {
    g.cw = tw + 4;
    g.torso = `M${160 - tw + 8} 234 C${160 - tw - 8} 258 ${160 - tw - 8} 300 ${160 - tw + 14} 310 L${160 + tw - 14} 310 C${160 + tw + 8} 300 ${160 + tw + 8} 258 ${160 + tw - 8} 234 C${160 + tw - 20} 222 ${160 - tw + 20} 222 ${160 - tw + 8} 234Z`;
  } else g.torso = `M${160 - tw + 4} 236 C${160 - tw - 3} 268 ${160 - tw} 302 ${160 - tw + 16} 310 L${160 + tw - 16} 310 C${160 + tw} 302 ${160 + tw + 3} 268 ${160 + tw - 4} 236 C${160 + tw - 18} 222 ${160 - tw + 18} 222 ${160 - tw + 4} 236Z`;
  if (A === 'long') { g.hL = [160 - tw - 4, 314]; g.hR = [160 + tw + 4, 314]; }
  if (A === 'flipper') { g.shL = [160 - tw + 5, 246]; g.shR = [160 + tw - 5, 246]; g.hL = [160 - tw - 16, 288]; g.hR = [160 + tw + 16, 288]; }
  return g;
}
function headPath(ch) {
  const { rx, ry } = ch.head, hs = ch.sp;
  if (hs === 'capy') {
    const x = 160 - rx, y = 150 - ry, w = rx * 2, h = ry * 2;
    return `M${x + 64} ${y + 2} Q160 ${y - 6} ${x + w - 64} ${y + 2} Q${x + w + 2} ${y + 6} ${x + w} ${y + 70} L${x + w - 2} ${y + h - 54} Q${x + w - 6} ${y + h} ${160 + 30} ${y + h} L${160 - 30} ${y + h} Q${x + 6} ${y + h} ${x + 2} ${y + h - 54} L${x} ${y + 70} Q${x - 2} ${y + 6} ${x + 64} ${y + 2}Z`;
  }
  const pts = [];
  const N = 52;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
    let r = 1, xk = 1;
    if (hs === 'panda') {
      const fluff = (a > 0.12 * Math.PI && a < 0.42 * Math.PI) || (a > 0.58 * Math.PI && a < 0.88 * Math.PI);
      if (fluff) r = i % 2 ? 1.07 : 0.985;
    } else if (hs === 'renard') {
      if (sa > 0.12 && sa < 0.78 && Math.abs(ca) > 0.6) r = i % 2 ? 1.09 : 1.0;
    } else if (hs === 'fennec' || hs === 'lemur') {
      if (sa > 0) xk = 1 - (hs === 'lemur' ? 0.1 : 0.07) * sa;
      if (hs === 'lemur' && sa > 0.1 && Math.abs(ca) > 0.6) r = i % 2 ? 1.07 : 0.99;
    } else if (hs === 'tanuki') {
      if (Math.abs(ca) > 0.8 && sa > -0.25) r = i % 2 ? 1.07 : 0.99;
    } else if (hs === 'paresseux') {
      if (sa < -0.8) r = i % 2 ? 1.05 : 0.985;
    } else if (hs === 'quokka') {
      if (sa > 0) xk = 1 + 0.05 * sa;
    }
    let yy = sa * ry;
    if (hs === 'axo' && yy > 0) yy *= 0.93;
    if (hs === 'phoque' && yy > 0) yy *= 0.96;
    pts.push([160 + ca * rx * r * xk, 150 + yy * r]);
  }
  return smooth(pts);
}
function eyeOpen(x, y, rx, ry, iris, uid, i, scale = 1, style = '') {
  rx *= scale; ry *= scale;
  if (style === 'big') return `<g class="look"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2a2130"/>
    <ellipse cx="${x}" cy="${y + ry * 0.06}" rx="${rx * 0.8}" ry="${ry * 0.8}" fill="${iris}"/>
    <ellipse cx="${x}" cy="${y + ry * 0.1}" rx="${rx * 0.42}" ry="${ry * 0.48}" fill="#2a2130"/>
    <circle cx="${x - rx * 0.32}" cy="${y - ry * 0.34}" r="${rx * 0.34}" fill="#fff"/>
    <circle cx="${x + rx * 0.34}" cy="${y + ry * 0.36}" r="${rx * 0.14}" fill="#fff"/></g>`;
  return `<g class="look"><clipPath id="${uid}ec${i}"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/></clipPath>
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2a2130"/>
    <ellipse cx="${x}" cy="${y + ry * 0.55}" rx="${rx * 0.85}" ry="${ry * 0.6}" fill="${iris}" opacity=".95" clip-path="url(#${uid}ec${i})"/>
    <circle cx="${x - rx * 0.3}" cy="${y - ry * 0.36}" r="${rx * 0.42}" fill="#fff"/>
    <circle cx="${x + rx * 0.36}" cy="${y + ry * 0.3}" r="${rx * 0.17}" fill="#fff"/>
    <circle cx="${x + rx * 0.1}" cy="${y - ry * 0.62}" r="${rx * 0.1}" fill="#fff" opacity=".8"/></g>`;
}
function face(key, ch, expr, uid) {
  const e = ch.eye, c = ch.c, L = c.line;
  const xs = [160 - e.dx, 160 + e.dx];
  let eyes = '', over = '', mouth = '', blush = '', fx = '';
  const mY = ch.mouthY;
  const blushBase = (k = 1) => xs.map((_, i) => {
    const bx = 160 + (i ? 1 : -1) * ch.blush.dx;
    return `<ellipse cx="${bx}" cy="${ch.blush.y}" rx="${13 * k}" ry="${8 * k}" fill="${c.blush}" opacity="${0.55 + 0.2 * (k - 1)}"/><ellipse cx="${bx - 5 * k}" cy="${ch.blush.y - 3 * k}" rx="${3.2 * k}" ry="${1.8 * k}" fill="#fff" opacity=".6"/>`;
  }).join('');
  const sparkle = (x, y, r, d = 0) => `<path class="twk" style="animation-delay:${d}s" d="${twinkleD(x, y, r)}" fill="#ffe27a" stroke="${L}" stroke-width="1.3" stroke-linejoin="round"/>`;
  const blushLines = () => xs.map((_, i) => {
    const bx = 160 + (i ? 1 : -1) * ch.blush.dx;
    return [-6, 0, 6].map(o => `<path d="M${bx + o - 2} ${ch.blush.y + 3} l4 -6" stroke="${shade(c.blush, 0.8)}" stroke-width="1.4" stroke-linecap="round"/>`).join('');
  }).join('');
  const ink = ch.inkEyes || '#2a2130';
  const arcs = (up) => xs.map(x => up
    ? `<path d="M${x - e.rx} ${e.y + 3} Q${x} ${e.y - e.ry - 3} ${x + e.rx} ${e.y + 3}" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/>`
    : `<path d="M${x - e.rx} ${e.y} Q${x} ${e.y + e.ry * 0.75} ${x + e.rx} ${e.y}" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  const irisOf = i => i ? c.iris2 : c.iris;
  const open = (s = 1) => xs.map((x, i) => eyeOpen(x, e.y, e.rx, e.ry, irisOf(i), uid, i, s, ch.eyeStyle)).join('');
  const lids = (depth) => xs.map(x => {
    const top = e.y - e.ry - 3, yl = e.y - e.ry + e.ry * 2 * depth;
    return `<path d="M${x - e.rx - 2} ${top} L${x + e.rx + 2} ${top} L${x + e.rx + 2} ${yl} Q${x} ${yl + 4} ${x - e.rx - 2} ${yl}Z" fill="${ch.lidCol || c.fur}"/><path d="M${x - e.rx - 1} ${yl} Q${x} ${yl + 4} ${x + e.rx + 1} ${yl}" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
  }).join('');
  const defMouth = () => {
    if (ch.mouth === 'w') return `<path d="M${160 - 11} ${mY} Q${160 - 5.5} ${mY + 7} 160 ${mY} Q${160 + 5.5} ${mY + 7} ${160 + 11} ${mY}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ch.mouth === 'wide') return `<path d="M${160 - 30} ${mY} Q160 ${mY + 20} ${160 + 30} ${mY}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`;
    if (ch.mouth === 'grin') return `<path d="M${160 - 22} ${mY - 1} Q160 ${mY + 4} ${160 + 22} ${mY - 1} Q${160 + 18} ${mY + 22} 160 ${mY + 22} Q${160 - 18} ${mY + 22} ${160 - 22} ${mY - 1}Z" fill="#8c3a4c" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${160 - 10} ${mY + 17} Q160 ${mY + 9} ${160 + 10} ${mY + 17} Q160 ${mY + 22} ${160 - 10} ${mY + 17}Z" fill="#f4889f"/><path d="M${160 - 25} ${mY - 4} q2 3 -1 6 M${160 + 25} ${mY - 4} q-2 3 1 6" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
    if (ch.mouth === 'smile') return `<path d="M${160 - 20} ${mY - 3} Q160 ${mY + 13} ${160 + 20} ${mY - 3}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/><path d="M${160 - 23} ${mY - 6} q3 1 3 4 M${160 + 23} ${mY - 6} q-3 1 -3 4" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
    return `<path d="M${160 - 8} ${mY} Q160 ${mY + 6} ${160 + 8} ${mY}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
  };
  const w = ch.mouth === 'wide' ? 26 : ch.mouth === 'grin' ? 20 : 13;
  const openMouth = `<path d="M${160 - w} ${mY - 2} Q160 ${mY + w * 1.35} ${160 + w} ${mY - 2} Q160 ${mY + 4} ${160 - w} ${mY - 2}Z" fill="#8c3a4c" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="160" cy="${mY + w * 0.62}" rx="${w * 0.45}" ry="${w * 0.24}" fill="#f4889f"/>`;
  switch (expr) {
    case 'rire': eyes = arcs(true); mouth = openMouth; blush = blushBase(1.15) + blushLines(); break;
    case 'amour':
      eyes = xs.map(x => `<path d="${heartD(x, e.y, e.rx * 1.05)}" fill="#ef6a90" stroke="${L}" stroke-width="1.6"/><circle cx="${x - e.rx * 0.4}" cy="${e.y - e.ry * 0.25}" r="2.4" fill="#fff"/>`).join('');
      mouth = defMouth(); blush = blushBase(1.3) + blushLines();
      fx = [0, 1, 2].map(i => `<path class="rise" style="animation-delay:${i * 0.45}s;animation-iteration-count:infinite" d="${heartD(118 + i * 42, 80 - (i % 2) * 14, 8)}" fill="#f27a9a" stroke="${L}" stroke-width="1.2"/>`).join('');
      break;
    case 'surpris':
      eyes = open(1.12); mouth = `<ellipse cx="160" cy="${mY + 3}" rx="5.5" ry="7" fill="#8c3a4c" stroke="${L}" stroke-width="2"/>`; blush = blushBase(0.9);
      over = xs.map((x, i) => `<path d="M${x - 11} ${e.y - e.ry - 13} Q${x} ${e.y - e.ry - 20} ${x + 11} ${e.y - e.ry - 13}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`).join('');
      fx = `<g class="rise" style="animation-iteration-count:infinite"><path d="M246 58 l4 26" stroke="${L}" stroke-width="5" stroke-linecap="round"/><circle cx="251.5" cy="94" r="3" fill="${L}"/></g>`;
      break;
    case 'triste':
      eyes = open(1.04); mouth = `<path d="M${160 - 9} ${mY + 5} Q160 ${mY - 3} ${160 + 9} ${mY + 5}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`; blush = blushBase(0.8);
      over = xs.map((x, i) => { const s = i ? 1 : -1; return `<path d="M${x - s * 12} ${e.y - e.ry - 8} L${x + s * 8} ${e.y - e.ry - 15}" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')
        + `<path class="rise" style="animation-iteration-count:infinite;animation-duration:2.4s" d="M${xs[1] + e.rx - 2} ${e.y + e.ry} q-5 9 0 13 q5 -4 0 -13Z" fill="#9fd3f2" stroke="#6fa9cc" stroke-width="1"/>`;
      break;
    case 'boude':
      eyes = open(0.95); over = lids(0.48); mouth = `<path d="M${160 - 7} ${mY + 2} q3.5 -4 7 0 q3.5 4 7 0" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
      blush = blushBase(1.35);
      fx = `<g transform="translate(236 72)"><path d="M0 10 q-2 -12 10 -12 q4 -8 14 -2 q12 -2 10 10 q6 8 -4 12 q-10 6 -18 0 q-14 2 -12 -8Z" fill="#fff" stroke="${L}" stroke-width="1.4"/><text x="16" y="12" text-anchor="middle" font-family="Fredoka,sans-serif" font-size="11" fill="${L}">hmpf</text></g>`;
      break;
    case 'curieux': {
      eyes = eyeOpen(xs[0], e.y, e.rx, e.ry, irisOf(0), uid, 0, 1, ch.eyeStyle) + eyeOpen(xs[1], e.y - 1, e.rx, e.ry, irisOf(1), uid, 1, 1.16, ch.eyeStyle);
      mouth = `<ellipse cx="${160 + 4}" cy="${mY + 2}" rx="4" ry="4.6" fill="#8c3a4c" stroke="${L}" stroke-width="1.8"/>`; blush = blushBase(0.95);
      over = `<path d="M${xs[1] - 12} ${e.y - e.ry - 16} Q${xs[1]} ${e.y - e.ry - 25} ${xs[1] + 12} ${e.y - e.ry - 15}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/><path d="M${xs[0] - 10} ${e.y - e.ry - 9} Q${xs[0]} ${e.y - e.ry - 12} ${xs[0] + 10} ${e.y - e.ry - 9}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
      fx = `<g class="rise" style="animation-iteration-count:infinite;animation-duration:2.6s"><text x="250" y="92" font-family="Fredoka,sans-serif" font-weight="700" font-size="34" fill="#fff" stroke="${L}" stroke-width="2.4" paint-order="stroke">?</text></g>`;
      break;
    }
    case 'fier':
      eyes = xs.map(x => `<path d="M${x - e.rx} ${e.y + 2} Q${x} ${e.y - e.ry * 0.9} ${x + e.rx} ${e.y + 2}" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M${x + e.rx - 1} ${e.y + 1} l4 -3" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`).join('');
      mouth = `<path d="M${160 - 13} ${mY - 1} Q${160 - 2} ${mY + 9} ${160 + 14} ${mY - 4}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`;
      blush = blushBase(1.1);
      over = xs.map((x, i) => { const s = i ? 1 : -1; return `<path d="M${x - s * 10} ${e.y - e.ry - 12} Q${x} ${e.y - e.ry - 18} ${x + s * 11} ${e.y - e.ry - 10}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`; }).join('');
      fx = sparkle(72, 70, 11) + sparkle(250, 84, 9, 0.5) + sparkle(236, 46, 6, 1);
      break;
    case 'endormi':
    case 'dodo':
      eyes = arcs(false); mouth = `<ellipse cx="160" cy="${mY + 2}" rx="3.6" ry="4.4" fill="#8c3a4c"/>`; blush = blushBase(1);
      fx = [0, 1, 2].map(i => `<text class="zz" style="animation-delay:${i * 0.8}s" x="${222 + i * 12}" y="${92 - i * 14}" font-family="Fredoka,sans-serif" font-weight="600" font-size="${16 + i * 5}" fill="${L}">z</text>`).join('');
      break;
    default:
      eyes = open(1); mouth = defMouth(); blush = blushBase(1);
  }
  const ey = e.y, eo = !['rire', 'amour', 'dodo', 'endormi', 'fier'].includes(expr);
  return `<g class="eyes${eo ? ' eo' : ''}" style="transform-origin:160px ${ey}px">${eyes}</g>${over}${blush}${mouth}<g class="fxface">${fx}</g>`;
}

// ---------- vêtements ----------
const ic = (o, k) => (o && o.col && o.col[k]) || IC[k];
const IC = {
  chapeau: '#e9c46a', couronne: '#f2d48f',
  casquette: '#9cc3e8', bonnet: '#f3b7c6', beret: '#c9b8ea', echarpe: '#bfe3d6', foulard: '#f6d88a', noeud: '#e9748f',
  tshirt: '#fbf6ec', pull: '#f6d88a', sweat: '#b8d8f0', calecon: '#fff8f0', short: '#8fb3dc', jupe: '#f4b7c4',
  gants: '#f6c48f', moufles: '#e6a0b4', chaussettes: '#fff3e0', bottes: '#f6d36b', sac: '#b9a6d9', cape: '#d97a8c',
};
function backItems(o, g, ch, uid) {
  let s = '';
  const L = ch.c.line;
  if (o.dos === 'cape') s += `<path d="M${160 - g.tw + 2} 232 Q${160 - g.tw - 26} 300 ${160 - g.tw - 18} 324 L${160 + g.tw + 18} 324 Q${160 + g.tw + 26} 300 ${160 + g.tw - 2} 232Z" fill="${ic(o, 'cape')}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
  if (o.dos === 'sac') s += `<rect x="${160 + g.tw - 16}" y="240" width="42" height="54" rx="13" fill="${ic(o, 'sac')}" stroke="${L}" stroke-width="1.8"/><rect x="${160 + g.tw - 6}" y="258" width="26" height="16" rx="5" fill="${shade(ic(o, 'sac'), 0.88)}" stroke="${L}" stroke-width="1.4"/>`;
  if (o.haut === 'sweat') s += `<ellipse cx="160" cy="226" rx="${g.tw + 18}" ry="22" fill="${shade(ic(o, 'sweat'), 0.9)}" stroke="${L}" stroke-width="1.8"/>`;
  return s;
}
const footCol = ch => ch.pattern === 'pattes' ? ch.c.pat : ch.limbDark ? ch.c.dark : shade(ch.c.furH, 0.9);
function legsAndFeet(o, g, ch) {
  if (!ch.legs) return '';
  const c = ch.c, L = c.line, footC = footCol(ch);
  let s = '';
  for (const lg of [g.legL, g.legR]) {
    const [x1, y1, x2, y2] = lg, side = x1 < 160 ? -1 : 1;
    s += capsule(x1, y1, x2, y2, 26, footC, L);
    s += `<ellipse cx="${x2 + side * 2}" cy="${y2 + 6}" rx="18" ry="11" fill="${footC}" stroke="${L}" stroke-width="1.8"/>`;
    s += `<path d="M${x2 + side * 2 - 6} ${y2 + 13} q2 -3 4 0 M${x2 + side * 2 + 2} ${y2 + 13} q2 -3 4 0" fill="none" stroke="${L}" stroke-width="1.2" stroke-linecap="round"/>`;
    if (o.pieds === 'chaussettes') {
      s += capsule(x1, y1 + 8, x2, y2, 27, ic(o, 'chaussettes'), L);
      s += `<ellipse cx="${x2 + side * 2}" cy="${y2 + 6}" rx="19" ry="11.5" fill="${ic(o, 'chaussettes')}" stroke="${L}" stroke-width="1.8"/>`;
      s += `<path d="M${x1 - 13} ${y1 + 12} h26 M${x1 - 13} ${y1 + 17} h26" stroke="#f0a3b4" stroke-width="2.6"/>`;
    }
    if (o.pieds === 'bottes') {
      s += `<path d="M${x2 - 16} ${y1 + 6} L${x2 + 16} ${y1 + 6} L${x2 + 16 + side * 2} ${y2 + 8} Q${x2 + side * 2 + 20} ${y2 + 18} ${x2 + side * 2} ${y2 + 18} Q${x2 + side * 2 - 20} ${y2 + 18} ${x2 - 16 + side * 2} ${y2 + 8}Z" fill="${ic(o, 'bottes')}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
      s += `<path d="M${x2 + side * 2 - 18} ${y2 + 15} h36" stroke="${shade(ic(o, 'bottes'), 0.7)}" stroke-width="3" stroke-linecap="round"/><path d="M${x2 - 15} ${y1 + 11} h30" stroke="#fff" stroke-width="2" opacity=".6"/>`;
    }
  }
  return s;
}
function torsoItems(o, g, ch, uid) {
  let s = '', L = ch.c.line;
  const t = g.cw;
  if (o.bas === 'calecon') {
    s += `<rect x="${160 - t - 6}" y="282" width="${2 * t + 12}" height="${ch.legs ? 34 : 50}" fill="${ic(o, 'calecon')}"/><rect x="${160 - t - 6}" y="280" width="${2 * t + 12}" height="7" fill="#9cc3e8"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="${heartD(160 - t + 12 + i * (2 * t - 24) / 5, 297 + (i % 2) * 6, 3.4)}" fill="#ef7f9c"/>`;
  }
  if (o.bas === 'short') s += `<rect x="${160 - t - 6}" y="280" width="${2 * t + 12}" height="${ch.legs ? 36 : 52}" fill="${ic(o, 'short')}"/><rect x="${160 - t - 6}" y="280" width="${2 * t + 12}" height="6" fill="${shade(ic(o, 'short'), 0.85)}"/><path d="M160 288 v20" stroke="${shade(ic(o, 'short'), 0.75)}" stroke-width="1.4"/><circle cx="160" cy="283" r="2" fill="#f6d36b"/>`;
  if (o.haut === 'tshirt') s += `<rect x="${160 - t - 6}" y="220" width="${2 * t + 12}" height="${o.bas === 'none' || o.bas === 'jupe' ? 72 : 64}" fill="${ic(o, 'tshirt')}"/><path d="${heartD(160 - 12, 258, 7)}" fill="#ef7f9c"/><path d="M${160 + 2} 254 h16 M${160 + 2} 260 h12" stroke="#9cc3e8" stroke-width="3" stroke-linecap="round"/>`;
  if (o.haut === 'pull') {
    s += `<rect x="${160 - t - 6}" y="220" width="${2 * t + 12}" height="76" fill="${ic(o, 'pull')}"/>`;
    for (let x = 160 - t; x < 160 + t; x += 6) s += `<path d="M${x} 288 v8" stroke="${shade(ic(o, 'pull'), 0.82)}" stroke-width="1.6"/>`;
    s += `<path d="M${160 - t} 252 h${2 * t} M${160 - t} 262 h${2 * t}" stroke="#fff" stroke-width="3" opacity=".7"/>`;
  }
  if (o.haut === 'sweat') s += `<rect x="${160 - t - 6}" y="220" width="${2 * t + 12}" height="78" fill="${ic(o, 'sweat')}"/><path d="M${160 - 22} 270 h44 l-6 18 h-32Z" fill="${shade(ic(o, 'sweat'), 0.9)}" stroke="${L}" stroke-width="1.4"/><path d="M152 236 v18 M168 236 v18" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`;
  return s;
}
function skirt(o, g, ch) {
  if (o.bas !== 'jupe') return '';
  const t = ch.torso === 'pear' ? g.tw + 14 : g.cw, L = ch.c.line;
  return `<path d="M${160 - t + 2} 280 L${160 + t - 2} 280 L${160 + t + 14} 316 Q160 324 ${160 - t - 14} 316Z" fill="${ic(o, 'jupe')}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${160 - t / 2} 284 l-6 34 M160 284 v38 M${160 + t / 2} 284 l6 34" stroke="${shade(ic(o, 'jupe'), 0.82)}" stroke-width="1.4"/>`;
}
function shortLegs(o, g, ch) {
  if (!ch.legs || (o.bas !== 'calecon' && o.bas !== 'short')) return '';
  const c = o.bas === 'short' ? ic(o, 'short') : ic(o, 'calecon'), L = ch.c.line, len = o.bas === 'short' ? 4 : 1;
  return [g.legL, g.legR].map(([x1, y1]) => capsule(x1, y1 - 2, x1, y1 + len, 29, c, L)).join('');
}
function flipperPath(sh, h, col, L) {
  const dx = h[0] - sh[0], dy = h[1] - sh[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  const P = (t, w) => [sh[0] + dx * t + nx * w, sh[1] + dy * t + ny * w];
  const side = dx < 0 ? -1 : 1;
  const tipA = P(0.86, -8 * side), tipB = P(0.98, -2 * side);
  return `<path d="${smooth([P(-0.08, 0), P(0.12, 12), P(0.55, 15), P(0.92, 11), P(1.14, 2), P(1.08, -7), P(0.7, -12), P(0.3, -12), P(0.05, -10)])}" fill="${col}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M${tipA[0].toFixed(1)} ${tipA[1].toFixed(1)} L${tipB[0].toFixed(1)} ${tipB[1].toFixed(1)}" stroke="${L}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`;
}
function arms(o, g, ch) {
  const c = ch.c, L = c.line, P = ch.parts;
  const armC = ch.pattern === 'pattes' ? c.pat : ch.limbDark ? c.dark : c.fur;
  let s = '';
  for (const [sh, h] of [[g.shL, g.hL], [g.shR, g.hR]]) {
    if (P.arms === 'long') {
      const sd = h[0] < 160 ? -1 : 1, d = `M${sh[0]} ${sh[1]} Q${160 + sd * (g.tw + 36)} ${sh[1] + 10} ${h[0]} ${h[1]}`;
      const seg = (f, w, col) => `<path d="${d}" pathLength="100" stroke-dasharray="${f} 200" stroke="${L}" stroke-width="${w + 3.4}" stroke-linecap="round" fill="none"/><path d="${d}" pathLength="100" stroke-dasharray="${f} 200" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
      s += seg(100, 20, armC);
      if (o.haut === 'tshirt') s += seg(28, 25, ic(o, 'tshirt'));
      if (o.haut === 'pull' || o.haut === 'sweat') s += seg(74, 25, ic(o, o.haut));
    } else if (P.arms === 'flipper') s += flipperPath(sh, h, armC, L);
    else s += capsule(sh[0], sh[1], h[0], h[1], 22, armC, L);
    const lerp = k => [sh[0] + (h[0] - sh[0]) * k, sh[1] + (h[1] - sh[1]) * k];
    if (P.arms === 'long') { /* manches déjà dessinées le long de la courbe */ }
    else if (o.haut === 'tshirt') { const m = lerp(0.42); s += capsule(sh[0], sh[1] - 2, m[0], m[1], 25, ic(o, 'tshirt'), L); }
    else if (o.haut === 'pull' || o.haut === 'sweat') {
      const col = ic(o, o.haut), m = lerp(P.arms === 'flipper' ? 0.6 : 0.78); s += capsule(sh[0], sh[1] - 2, m[0], m[1], 25, col, L);
      s += capsule(m[0], m[1], m[0] + (h[0] - sh[0]) * 0.02, m[1] + 1, 26, shade(col, 0.88), L);
    }
    const side = h[0] < 160 ? -1 : 1;
    if (o.mains === 'gants') s += `<circle cx="${h[0]}" cy="${h[1]}" r="12.5" fill="${ic(o, 'gants')}" stroke="${L}" stroke-width="1.8"/><path d="M${h[0] - 10} ${h[1] - 9} q10 -6 20 0" stroke="${shade(ic(o, 'gants'), 0.8)}" stroke-width="3" fill="none"/>`;
    else if (o.mains === 'moufles') s += `<ellipse cx="${h[0]}" cy="${h[1] + 1}" rx="14" ry="15" fill="${ic(o, 'moufles')}" stroke="${L}" stroke-width="1.8"/><ellipse cx="${h[0] - side * 11}" cy="${h[1] - 4}" rx="5.5" ry="7" fill="${ic(o, 'moufles')}" stroke="${L}" stroke-width="1.6"/><path d="M${h[0] - 12} ${h[1] - 9} h24" stroke="#fff" stroke-width="3"/>`;
    else if (P.hands === 'axo') s += [-6, 0, 6].map(dx => `<circle cx="${h[0] + dx}" cy="${h[1] + 9}" r="4.4" fill="${c.fur}" stroke="${L}" stroke-width="1.4"/>`).join('');
    else if (P.hands === 'claw') s += [-7, 0, 7].map(dx => { const d = `M${h[0] + dx} ${h[1] + 4} q${side * 2 + dx * 0.2} 12 ${side * -3 + dx * 0.3} 19`; return `<path d="${d}" fill="none" stroke="${L}" stroke-width="8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f6ead2" stroke-width="5" stroke-linecap="round"/>`; }).join('') + `<ellipse cx="${h[0]}" cy="${h[1] + 2}" rx="11" ry="9" fill="${armC}" stroke="${L}" stroke-width="1.8"/>`;
    else if (P.hands === 'flipper') s += '';
    else s += `<ellipse cx="${h[0]}" cy="${h[1] + 6}" rx="5" ry="3.4" fill="${c.blush}" opacity=".7"/>`;
  }
  return s;
}
function neckItems(o, g, ch) {
  const L = ch.c.line, t = g.tw;
  if (o.cou === 'echarpe') return `<rect x="${160 - t - 6}" y="220" width="${2 * t + 12}" height="24" rx="12" fill="${ic(o, 'echarpe')}" stroke="${L}" stroke-width="1.8"/><path d="M${160 - t + 4} 226 v14 M${160 - t + 16} 226 v14 M${160 + t - 16} 226 v14 M${160 + t - 4} 226 v14" stroke="#fff" stroke-width="3" opacity=".7"/>
    <rect x="${160 + 10}" y="234" width="20" height="44" rx="7" transform="rotate(-8 ${170} 234)" fill="${ic(o, 'echarpe')}" stroke="${L}" stroke-width="1.8"/><path d="M${170} 274 l2 8 M${178} 273 l2 8 M${186} 272 l2 8" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>`;
  if (o.cou === 'foulard') return `<path d="M${160 - 34} 222 L${160 + 34} 222 L160 268Z" fill="${ic(o, 'foulard')}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>${[[150, 236], [168, 236], [160, 250]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join('')}`;
  if (o.cou === 'noeud') return `<path d="M160 236 L136 222 L136 250Z M160 236 L184 222 L184 250Z" fill="${ic(o, 'noeud')}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="160" cy="236" r="6" fill="${shade(ic(o, 'noeud'), 0.85)}" stroke="${L}" stroke-width="1.6"/>`;
  return '';
}
function headItem(o, g, ch) {
  const T = g.headTop, hw = ch.head.rx, L = ch.c.line, st = `stroke="${L}" stroke-width="1.8" stroke-linejoin="round"`;
  switch (o.tete) {
    case 'casquette': return `<path d="M${160 - hw * 0.72} ${T + 30} C${160 - hw * 0.72} ${T - 30} ${160 + hw * 0.72} ${T - 30} ${160 + hw * 0.72} ${T + 30}Z" fill="${ic(o, 'casquette')}" ${st}/><path d="M${160 + hw * 0.55} ${T + 24} C${160 + hw * 0.9} ${T + 14} ${160 + hw * 1.25} ${T + 22} ${160 + hw * 1.3} ${T + 32} C${160 + hw * 1.05} ${T + 38} ${160 + hw * 0.75} ${T + 36} ${160 + hw * 0.58} ${T + 32}Z" fill="${shade(ic(o, 'casquette'), 0.85)}" ${st}/><circle cx="160" cy="${T - 14}" r="4.5" fill="${shade(ic(o, 'casquette'), 0.8)}" ${st}/><path d="${heartD(160, T + 8, 6)}" fill="#fff" opacity=".85"/>`;
    case 'bonnet': return `<path d="M${160 - hw * 0.82} ${T + 34} C${160 - hw * 0.82} ${T - 42} ${160 + hw * 0.82} ${T - 42} ${160 + hw * 0.82} ${T + 34}Z" fill="${ic(o, 'bonnet')}" ${st}/><rect x="${160 - hw * 0.88}" y="${T + 18}" width="${hw * 1.76}" height="22" rx="10" fill="${shade(ic(o, 'bonnet'), 0.9)}" ${st}/>${Array.from({ length: 9 }, (_, i) => `<path d="M${160 - hw * 0.78 + i * hw * 0.195} ${T + 22} v14" stroke="${shade(ic(o, 'bonnet'), 0.78)}" stroke-width="1.4"/>`).join('')}<circle cx="160" cy="${T - 32}" r="15" fill="#fff8f0" ${st}/>`;
    case 'beret': return `<path d="M${160 - hw * 0.86} ${T + 20} C${160 - hw * 0.8} ${T - 14} ${160 + hw * 0.78} ${T - 20} ${160 + hw * 0.84} ${T + 12} C${160 + hw * 0.5} ${T + 26} ${160 - hw * 0.5} ${T + 30} ${160 - hw * 0.86} ${T + 20}Z" fill="${ic(o, 'beret')}" ${st}/><path d="M${154} ${T - 10} q2 -10 8 -8" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'chapeau': { const c = ic(o, 'chapeau'); return `<ellipse cx="160" cy="${T + 16}" rx="${hw * 1.08}" ry="18" fill="${c}" ${st}/><path d="M${160 - hw * 0.55} ${T + 16} C${160 - hw * 0.55} ${T - 34} ${160 + hw * 0.55} ${T - 34} ${160 + hw * 0.55} ${T + 16}Z" fill="${c}" ${st}/><path d="M${160 - hw * 0.54} ${T + 2} C${160 - hw * 0.2} ${T + 8} ${160 + hw * 0.2} ${T + 8} ${160 + hw * 0.54} ${T + 2} L${160 + hw * 0.55} ${T + 13} C${160 + hw * 0.2} ${T + 19} ${160 - hw * 0.2} ${T + 19} ${160 - hw * 0.55} ${T + 13}Z" fill="${shade(c, 0.72)}" ${st}/>`; }
    case 'couronne': { const c = ic(o, 'couronne'); return `<path d="M${160 - 44} ${T + 14} L${160 - 44} ${T - 20} L${160 - 24} ${T - 4} L${160 - 10} ${T - 30} L160 ${T - 8} L${160 + 10} ${T - 30} L${160 + 24} ${T - 4} L${160 + 44} ${T - 20} L${160 + 44} ${T + 14}Z" fill="${c}" ${st}/><circle cx="160" cy="${T + 2}" r="5.5" fill="#f08aa0" ${st}/><circle cx="${160 - 26}" cy="${T + 4}" r="3.4" fill="#a9c5e6"/><circle cx="${160 + 26}" cy="${T + 4}" r="3.4" fill="#a9c5e6"/><path d="M${160 - 40} ${T - 12} l4 -4 M${160 + 36} ${T - 14} l4 4" stroke="#fff" stroke-width="2" opacity=".7"/>`; }
    case 'mandarine': return `<g class="wobble" style="transform-origin:160px ${T + 4}px"><circle cx="160" cy="${T - 16}" r="23" fill="#f7b367" ${st}/><circle cx="152" cy="${T - 24}" r="5" fill="#fff" opacity=".45"/><path d="M160 ${T - 38} C165 ${T - 49} 176 ${T - 49} 179 ${T - 43} C172 ${T - 39} 166 ${T - 38} 160 ${T - 38}Z" fill="#a6cf8e" ${st}/><path d="M160 ${T - 38} v-5" stroke="${L}" stroke-width="2" stroke-linecap="round"/></g>`;
    case 'fleurs': {
      let s = ''; const cols = ['#f6c2cf', '#fff8f0', '#f6dc8a', '#cdbfe9', '#bfe3d6'];
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.14 + i * 0.12), x = 160 + Math.cos(a) * ch.head.rx * 0.86, y = 150 + Math.sin(a) * ch.head.ry * 0.9;
        if (i % 2) s += `<path d="M${x - 8} ${y + 5} q8 -12 16 0 q-8 5 -16 0Z" fill="#a6cf8e" stroke="${L}" stroke-width="1.2"/>`;
        for (let k = 0; k < 5; k++) { const b = k * Math.PI * 0.4; s += `<circle cx="${x + Math.cos(b) * 6}" cy="${y + Math.sin(b) * 6}" r="5.4" fill="${cols[i % 5]}" stroke="${L}" stroke-width="1.1"/>`; }
        s += `<circle cx="${x}" cy="${y}" r="3.2" fill="#f2c14e"/>`;
      }
      return s;
    }
    default: return '';
  }
}
function hatHeight(o) { return { casquette: 30, bonnet: 48, beret: 18, mandarine: 40, fleurs: 8 }[o.tete] || 0; }

// ---------- oreilles (ou branchies) : dessinées derrière la tête, relatives à la tête hôte ----------
function earPair(ch, x, y, rot, cls, inner) {
  return [-1, 1].map(side => `<g class="ear e-${cls}" style="transform-origin:${160 + side * x}px ${y + 8}px"><g transform="translate(${160 + side * x} ${y}) rotate(${side * rot}) scale(${side} 1)">${inner}</g></g>`).join('');
}
const EARS = {
  panda(ch, c, L) {
    const k = ch.head.rx / 94, y = 150 - ch.head.ry + 20;
    const ear = (x, side) => `<g class="ear e-panda" style="transform-origin:${x}px ${y + 8}px"><g transform="translate(${x} ${y}) rotate(${side * 20}) scale(${side} 1)">
      <path d="M-30 26 C-36 -8 -12 -40 6 -42 C24 -38 36 -6 30 26Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-17 21 C-21 -2 -6 -24 4 -27 C14 -23 22 -2 18 21Z" fill="${c.inner}"/>
      <path d="M-22 14 C-22 -2 -14 -18 -4 -26 M-10 18 C-10 4 -4 -8 2 -14" stroke="${c.light}" stroke-width="3.4" stroke-linecap="round" fill="none"/></g></g>`;
    return ear(160 - 64 * k, -1) + ear(160 + 64 * k, 1);
  },
  capy(ch, c, L) {
    const k = ch.head.rx / 90, y = 150 - ch.head.ry + 6;
    const ear = (x, side) => `<g class="ear e-capy" style="transform-origin:${x}px ${y + 8}px"><ellipse cx="${x}" cy="${y}" rx="17" ry="15" fill="${c.fur2}" stroke="${L}" stroke-width="2"/><ellipse cx="${x + side * 1}" cy="${y + 2}" rx="8" ry="7" fill="${c.inner}"/></g>`;
    return ear(160 - 66 * k, -1) + ear(160 + 66 * k, 1);
  },
  axo(ch, c, L) {
    const kx = ch.head.rx / 102, ky = ch.head.ry / 76;
    let s = '';
    for (const side of [-1, 1]) {
      const bx = 160 + side * 92 * kx;
      s += `<g class="wave e-axo ${side > 0 ? 'r' : ''}" style="transform-origin:${bx}px ${150 - 2 * ky}px">`;
      [[-0.7, 150 - 38 * ky, 44], [-0.12, 150 - 8 * ky, 48], [0.45, 150 + 22 * ky, 40]].forEach(([ang, by, len]) => {
        const dx = Math.cos(ang) * side, dy = Math.sin(ang);
        const tx = bx + dx * len, ty = by + dy * len;
        for (let k = 0.32; k <= 1.01; k += 0.17) {
          const px = bx + dx * len * k, py = by + dy * len * k;
          s += `<ellipse cx="${px - dy * 7 * side * -1}" cy="${py - Math.abs(dx) * 7}" rx="6" ry="4.6" transform="rotate(${ang * 57 * side} ${px} ${py})" fill="${c.frill}" stroke="${L}" stroke-width="1.1"/>`;
          s += `<ellipse cx="${px + dy * 7 * side * -1}" cy="${py + Math.abs(dx) * 7}" rx="6" ry="4.6" transform="rotate(${ang * 57 * side} ${px} ${py})" fill="${c.frill}" stroke="${L}" stroke-width="1.1"/>`;
        }
        s += capsule(bx, by, tx, ty, 9, c.gill, L);
      });
      s += `</g>`;
    }
    return s;
  },
  renard(ch, c, L) {
    const k = ch.head.rx / 96, y = 150 - ch.head.ry + 26;
    return earPair(ch, 56 * k, y, 22, 'renard', `<path d="M-27 22 C-28 -2 -12 -42 0 -48 C12 -42 28 -2 27 22Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-15 18 C-16 0 -7 -28 0 -34 C7 -28 16 0 15 18Z" fill="${c.inner}"/>
      <path d="M-12 20 q-1 -10 4 -18 M-2 20 q-2 -8 2 -16 M8 20 q2 -8 -1 -14" stroke="${c.light}" stroke-width="3" stroke-linecap="round" fill="none"/>`);
  },
  fennec(ch, c, L) {
    const k = ch.head.rx / 88, y = 150 - ch.head.ry + 36;
    return earPair(ch, 46 * k, y, 30, 'fennec', `<path d="M-34 22 C-40 -22 -16 -86 -2 -100 C2 -103 6 -102 8 -98 C22 -84 40 -22 34 22Z" fill="${c.fur}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-22 16 C-26 -16 -12 -68 0 -82 C12 -68 26 -16 22 16Z" fill="${c.pink}"/>
      <path d="M-18 14 q-4 -16 2 -32 M-6 16 q-3 -22 3 -44 M8 16 q4 -18 -1 -36 M18 12 q2 -10 -2 -20" stroke="${c.light}" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".95"/>
      <path d="M-26 -10 C-22 -40 -12 -70 -2 -88" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".35"/>`);
  },
  tanuki(ch, c, L) {
    const k = ch.head.rx / 96, y = 150 - ch.head.ry + 20;
    return earPair(ch, 62 * k, y, 18, 'tanuki', `<path d="M-23 16 C-26 -6 -10 -28 0 -30 C10 -28 26 -6 23 16Z" fill="${c.dark}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-13 14 C-14 0 -6 -15 0 -17 C6 -15 14 0 13 14Z" fill="${c.light}"/>`);
  },
  lemur(ch, c, L) {
    const k = ch.head.rx / 92, y = 150 - ch.head.ry + 32;
    return earPair(ch, 76 * k, y, 46, 'lemur', `<path d="M-22 20 C-26 -2 -12 -34 0 -42 C12 -34 26 -2 22 20Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-12 16 C-14 0 -6 -20 0 -26 C6 -20 14 0 12 16Z" fill="${c.light}"/>`);
  },
  quokka(ch, c, L) {
    const k = ch.head.rx / 92, y = 150 - ch.head.ry + 14;
    return earPair(ch, 60 * k, y, 10, 'quokka', `<ellipse cx="0" cy="0" rx="21" ry="20" fill="${c.fur}" stroke="${L}" stroke-width="2"/><ellipse cx="1" cy="2" rx="12" ry="11" fill="${c.pink}"/><path d="M-12 -12 q8 -6 18 -2" stroke="${c.dark}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".35"/>`);
  },
};

// ---------- queues : dessinées derrière le corps ----------
function bez(p0, p1, p2, p3, t) { const u = 1 - t; return [0, 1].map(i => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]); }
// queue en panache : bord festonné le long d’une courbe de Bézier, bout de couleur
function plume(p0, p1, p2, p3, wmax, n, fill, tipFill, tipFrac, L, cls, extra) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, P = bez(p0, p1, p2, p3, t), Q = bez(p0, p1, p2, p3, Math.min(1, t + 0.01)), R = bez(p0, p1, p2, p3, Math.max(0, t - 0.01));
    const dx = Q[0] - R[0], dy = Q[1] - R[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const w = wmax * Math.pow(Math.sin(Math.PI * (0.14 + 0.7 * t)), 0.6) * (i % 2 || i === 0 || i === n ? 1 : 1.13);
    pts.push({ t, P, nx, ny, w, ux: dx / l, uy: dy / l });
  }
  const side = (arr, s) => arr.map(q => [q.P[0] + q.nx * q.w * s, q.P[1] + q.ny * q.w * s]);
  const last = pts[pts.length - 1], tip = [last.P[0] + last.ux * last.w * 0.95, last.P[1] + last.uy * last.w * 0.95];
  const body = [...side(pts, 1), tip, ...side(pts, -1).reverse()];
  const tp = pts.filter(q => q.t >= 1 - tipFrac);
  const tipPoly = tp.length ? [...side(tp, 1), tip, ...side(tp, -1).reverse()] : null;
  const fluff = [0.3, 0.5, 0.7].map(t => { const q = pts[Math.round(t * n)]; return `M${(q.P[0] + q.nx * q.w * 0.55).toFixed(1)} ${(q.P[1] + q.ny * q.w * 0.55).toFixed(1)} q${(q.ux * 8).toFixed(1)} ${(q.uy * 8).toFixed(1)} ${(q.ux * 14 - q.nx * 6).toFixed(1)} ${(q.uy * 14 - q.ny * 6).toFixed(1)}`; }).join(' ');
  return `<g class="swish ${cls}" style="transform-origin:${p0[0]}px ${p0[1]}px"><path d="${smooth(body)}" fill="${fill}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>${tipPoly ? `<path d="${smooth(tipPoly)}" fill="${tipFill}"/>` : ''}<path d="${fluff}" fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>${extra || ''}<path d="${smooth(body)}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/></g>`;
}
const TAILS = {
  panda(ch, c, L, g) {
    const x0 = 160 + g.tw - 8, d = `M${x0} 300 C${x0 + 56} 306 ${x0 + 82} 262 ${x0 + 66} 214`;
    return `<g class="swish t-panda" style="transform-origin:${x0}px 300px"><path d="${d}" stroke="${L}" stroke-width="42" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.fur}" stroke-width="38" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.fur2}" stroke-width="38" stroke-dasharray="15 15" stroke-dashoffset="-6" fill="none"/><circle cx="${x0 + 66}" cy="214" r="17" fill="${c.dark}"/></g>`;
  },
  axo(ch, c, L, g) {
    const x0 = 160 + g.tw - 8;
    return `<g class="swish t-axo" style="transform-origin:${x0}px 296px"><path d="M${x0 - 4} 302 C${x0 + 50} 310 ${x0 + 84} 284 ${x0 + 78} 244 C${x0 + 56} 262 ${x0 + 26} 276 ${x0 - 4} 276Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M${x0 + 10} 300 C${x0 + 52} 302 ${x0 + 78} 280 ${x0 + 78} 246" stroke="${c.gill}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
  },
  renard(ch, c, L, g) {
    const x0 = 160 + g.tw - 10;
    return plume([x0 - 8, 304], [x0 + 66, 324], [x0 + 90, 236], [x0 + 34, 170], 29, 16, c.fur, c.tip || c.light, 0.24, L, 't-renard');
  },

  fennec(ch, c, L, g) {
    const x0 = 160 + g.tw - 8;
    return plume([x0 - 6, 302], [x0 + 56, 316], [x0 + 80, 262], [x0 + 52, 214], 19, 12, c.fur, mixHex(c.dark, '#3a2a2a', 0.6), 0.2, L, 't-fennec');
  },

  tanuki(ch, c, L, g) {
    const x0 = 160 + g.tw - 10;
    return plume([x0 - 8, 300], [x0 + 48, 320], [x0 + 80, 292], [x0 + 64, 238], 23, 12, c.fur, c.dark, 0.22, L, 't-tanuki');
  },

  lemur(ch, c, L, g) {
    const x0 = 160 + g.tw - 8, d = `M${x0} 300 C${x0 + 64} 312 ${x0 + 80} 252 ${x0 + 60} 202 C${x0 + 42} 158 ${x0 + 54} 108 ${x0 + 86} 98`;
    return `<g class="swish t-lemur" style="transform-origin:${x0}px 300px"><path d="${d}" stroke="${L}" stroke-width="27" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.light}" stroke-width="23" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.dark}" stroke-width="23" stroke-dasharray="13 12" stroke-dashoffset="-14" fill="none"/><circle cx="${x0 + 86}" cy="98" r="11.5" fill="${c.dark}"/></g>`;
  },
  quokka(ch, c, L, g) {
    const x0 = 160 + g.tw - 10;
    return `<g class="swish t-quokka" style="transform-origin:${x0}px 300px"><path d="M${x0 - 6} 286 C${x0 + 24} 290 ${x0 + 44} 304 ${x0 + 58} 324 C${x0 + 54} 328 ${x0 + 48} 328 ${x0 + 42} 324 C${x0 + 28} 314 ${x0 + 10} 310 ${x0 - 6} 310Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/></g>`;
  },
  phoque(ch, c, L, g, o) {
    const col = ch.pattern === 'pattes' ? c.pat : shade(c.furH, 0.94), sock = o && o.pieds === 'chaussettes' ? ic(o, 'chaussettes') : null;
    let s = `<path d="M128 318 C160 310 206 314 240 320 L242 332 C206 338 160 342 126 336 C118 330 120 322 128 318Z" fill="${col}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M150 326 C180 324 210 326 232 328" stroke="${L}" stroke-width="1.4" fill="none" opacity=".3" stroke-linecap="round"/>`;
    for (const [a, b] of [[[236, 322], [270, 302]], [[236, 328], [280, 334]]]) {
      s += flipperPath(a, b, col, L);
      if (sock) s += flipperPath([a[0] + (b[0] - a[0]) * 0.45, a[1] + (b[1] - a[1]) * 0.45], b, sock, L);
    }
    return `<g class="t-phoque">${s}</g>`;
  },


};

// ---------- marques du visage propres au corps ----------
function MARKS(ch, c, L, uid) {
  const clip = s => `<g clip-path="url(#${uid}hc)">${s}</g>`;
  switch (ch.sp) {
    case 'panda': return clip(`
      <ellipse cx="${160 - 58}" cy="186" rx="44" ry="34" fill="${c.light}"/><ellipse cx="${160 + 58}" cy="186" rx="44" ry="34" fill="${c.light}"/>
      <ellipse cx="160" cy="216" rx="80" ry="20" fill="${c.fur2}" opacity=".35"/>
      <path d="M${160 - 45} 170 C${160 - 47} 180 ${160 - 45} 190 ${160 - 41} 198 M${160 + 45} 170 C${160 + 47} 180 ${160 + 45} 190 ${160 + 41} 198" stroke="${c.fur2}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".75"/>
      <ellipse cx="160" cy="104" rx="42" ry="16" fill="#fff" opacity=".22"/>`) + `
      <ellipse cx="${160 - 38}" cy="127" rx="15" ry="9" fill="${c.light}"/><ellipse cx="${160 + 38}" cy="127" rx="15" ry="9" fill="${c.light}"/>
      <path d="M150 80 q4 -9 9 -2 M160 78 q5 -10 10 -1" fill="none" stroke="${c.fur2}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'capy': return clip(`<ellipse cx="160" cy="96" rx="48" ry="16" fill="#fff" opacity=".2"/><ellipse cx="160" cy="226" rx="90" ry="14" fill="${c.fur2}" opacity=".35"/>`) + `
      <path d="M${160 - 76} 150 q5 3 3 9 M${160 + 76} 150 q-5 3 -3 9" fill="none" stroke="${c.fur2}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M152 74 q4 -14 10 -2 M162 72 q6 -12 10 0" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
    case 'axo': return clip(`<ellipse cx="160" cy="100" rx="50" ry="16" fill="#fff" opacity=".3"/><ellipse cx="160" cy="214" rx="96" ry="16" fill="${c.fur2}" opacity=".35"/>`) + `
      ${[[132, 96], [146, 88], [176, 90], [190, 100], [161, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${c.dark}" opacity=".45"/>`).join('')}
      <path d="M${160 - 84} 128 Q${160 - 80} 108 ${160 - 64} 98" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/><circle cx="${160 - 86}" cy="138" r="2" fill="#fff" opacity=".55"/>`;
    case 'renard': return clip(`
      <path d="${smooth([[60, 168], [96, 170], [124, 186], [140, 210], [110, 232], [70, 220]])}" fill="${c.light}"/>
      <path d="${smooth([[260, 168], [224, 170], [196, 186], [180, 210], [210, 232], [250, 220]])}" fill="${c.light}"/>
      <ellipse cx="160" cy="98" rx="46" ry="15" fill="#fff" opacity=".35"/><ellipse cx="160" cy="226" rx="80" ry="14" fill="${c.fur2}" opacity=".4"/>`) + `
      <path d="M${160 - 70} 186 q8 4 14 2 M${160 + 70} 186 q-8 4 -14 2" fill="none" stroke="${c.fur2}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M152 86 q4 -9 9 -2 M162 84 q5 -9 9 -1" fill="none" stroke="${shade(c.dark, 1.1)}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
    case 'fennec': return clip(`
      <ellipse cx="${160 - 46}" cy="190" rx="40" ry="28" fill="${c.light}"/><ellipse cx="${160 + 46}" cy="190" rx="40" ry="28" fill="${c.light}"/>
      <ellipse cx="160" cy="104" rx="40" ry="14" fill="#fff" opacity=".3"/><ellipse cx="160" cy="220" rx="74" ry="12" fill="${c.fur2}" opacity=".4"/>`) + `
      <path d="M${160 - 22} 160 Q${160 - 20} 172 ${160 - 14} 178 M${160 + 22} 160 Q${160 + 20} 172 ${160 + 14} 178" fill="none" stroke="${c.dark}" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>
      <ellipse cx="${160 - 35}" cy="128" rx="11" ry="6" fill="${c.light}" opacity=".9"/><ellipse cx="${160 + 35}" cy="128" rx="11" ry="6" fill="${c.light}" opacity=".9"/>`;
    case 'tanuki': return clip(`
      <ellipse cx="${160 - 54}" cy="198" rx="44" ry="30" fill="${c.light}"/><ellipse cx="${160 + 54}" cy="198" rx="44" ry="30" fill="${c.light}"/>
      <path d="M146 72 Q160 66 174 72 L168 126 Q160 132 152 126Z" fill="${c.light}" opacity=".9"/>
      <ellipse cx="160" cy="226" rx="80" ry="14" fill="${c.fur2}" opacity=".35"/>`) + `
      <path d="M${160 - 78} 176 l-9 2 M${160 - 76} 186 l-9 5 M${160 + 78} 176 l9 2 M${160 + 76} 186 l9 5" stroke="${L}" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>`;
    case 'paresseux': return clip(`
      <ellipse cx="160" cy="166" rx="70" ry="54" fill="${c.light}"/>
      <ellipse cx="160" cy="226" rx="80" ry="14" fill="${c.fur2}" opacity=".35"/>`) + `
      <path d="M128 76 q6 -12 12 0 M146 72 q6 -14 13 -1 M162 72 q7 -14 13 0 M180 76 q6 -11 11 1" fill="none" stroke="${c.fur2}" stroke-width="3" stroke-linecap="round"/>
      <path d="M118 116 Q160 98 202 116" fill="none" stroke="${shade(c.fur2, 0.9)}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`;
    case 'lemur': return clip(`
      <path d="${smooth([[160, 108], [196, 116], [222, 146], [218, 186], [192, 216], [160, 226], [128, 216], [102, 186], [98, 146], [124, 116]])}" fill="${c.light}"/>
      <ellipse cx="160" cy="88" rx="44" ry="14" fill="${c.dark}" opacity=".18"/>`);
    case 'phoque': return clip(`
      <ellipse cx="160" cy="214" rx="78" ry="30" fill="${c.light}" opacity=".7"/>
      <ellipse cx="160" cy="98" rx="50" ry="16" fill="#fff" opacity=".35"/>`) + `
      <circle cx="${160 - 30}" cy="104" r="2.4" fill="${c.dark}" opacity=".3"/><circle cx="${160 + 36}" cy="98" r="2" fill="${c.dark}" opacity=".3"/><circle cx="${160 + 22}" cy="88" r="1.6" fill="${c.dark}" opacity=".3"/>`;
    case 'quokka': return clip(`
      <ellipse cx="${160 - 50}" cy="184" rx="36" ry="26" fill="${c.light}" opacity=".9"/><ellipse cx="${160 + 50}" cy="184" rx="36" ry="26" fill="${c.light}" opacity=".9"/>
      <ellipse cx="160" cy="100" rx="44" ry="15" fill="#fff" opacity=".26"/><ellipse cx="160" cy="222" rx="80" ry="14" fill="${c.fur2}" opacity=".35"/>`) + `
      <path d="M150 80 q4 -9 9 -2 M160 78 q5 -10 10 -1" fill="none" stroke="${c.fur2}" stroke-width="2.6" stroke-linecap="round"/>`;
    default: return '';
  }
}

// ---------- masques (greffables) : autour des yeux, avant les yeux ----------
const MASKS = {
  tanuki(ch, c, L) {
    const e = ch.eye;
    return [-1, 1].map(s => {
      const x = 160 + s * e.dx, y = e.y, rx = e.rx, ry = e.ry;
      return `<path d="${smooth([[x - s * rx * 1.1, y - ry * 1.15], [x + s * rx * 0.6, y - ry * 1.3], [x + s * rx * 1.9, y - ry * 0.5], [x + s * rx * 2.5, y + ry * 0.7], [x + s * rx * 1.8, y + ry * 1.7], [x + s * rx * 0.2, y + ry * 1.6], [x - s * rx * 1.25, y + ry * 0.7]])}" fill="${c.dark}"/>`;
    }).join('') + [-1, 1].map(s => `<path d="M${160 + s * (e.dx - e.rx * 0.6)} ${e.y - e.ry * 1.55} q${s * e.rx * 0.9} -5 ${s * e.rx * 2} 2" fill="none" stroke="${c.light}" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>`).join('');
  },
  lemur(ch, c, L) {
    const e = ch.eye;
    return [-1, 1].map(s => {
      const x = 160 + s * e.dx, y = e.y, rx = e.rx, ry = e.ry;
      return `<path d="${smooth([[x - s * rx * 1.15, y + ry * 0.2], [x - s * rx * 0.7, y - ry * 1.05], [x + s * rx * 0.5, y - ry * 1.3], [x + s * rx * 1.35, y - ry * 0.4], [x + s * rx * 1.2, y + ry * 0.9], [x + s * rx * 0.1, y + ry * 1.35], [x - s * rx * 1.0, y + ry * 1.5]])}" fill="${c.dark}"/>`;
    }).join('');
  },
  paresseux(ch, c, L) {
    const e = ch.eye;
    return [-1, 1].map(s => {
      const x = 160 + s * e.dx, y = e.y, r = e.rx;
      return `<path d="${smooth([[x - s * r * 1.2, y - r * 0.2], [x - s * r * 0.3, y - r * 1.4], [x + s * r * 1.2, y - r * 1.2], [x + s * r * 2.6, y + r * 0.4], [x + s * r * 4.2, y + r * 2.0], [x + s * r * 3.9, y + r * 2.9], [x + s * r * 2.2, y + r * 2.1], [x + s * r * 0.6, y + r * 1.5], [x - s * r * 0.9, y + r * 1.1]])}" fill="${c.dark}"/>`;
    }).join('');
  },
};

// ---------- museaux (greffables) : ancrés sur la bouche (mouthY) ----------
const SNOUT_K = { capy: 0.72 };
const SNOUT_Y0 = {};
const SNOUTS = {
  panda(m, c, L) {
    return `<ellipse cx="160" cy="${m - 4}" rx="31" ry="22" fill="${c.light}"/>
      <path d="M150 ${m - 16} Q160 ${m - 22} 170 ${m - 16} Q167 ${m - 7} 160 ${m - 6} Q153 ${m - 7} 150 ${m - 16}Z" fill="#3b2a2a"/><ellipse cx="156" cy="${m - 16}" rx="3" ry="1.6" fill="#fff" opacity=".6"/>
      ${[[-17, 0], [-21, 7], [-12, 8], [17, 0], [21, 7], [12, 8]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${m + y}" r="1.5" fill="${c.fur2}" opacity=".75"/>`).join('')}`;
  },
  capy(m, c, L) {
    return `<path d="M${160 - 62} ${m - 20} C${160 - 64} ${m - 48} ${160 - 40} ${m - 56} 160 ${m - 56} C${160 + 40} ${m - 56} ${160 + 64} ${m - 48} ${160 + 62} ${m - 20} C${160 + 62} ${m + 8} ${160 + 40} ${m + 16} 160 ${m + 16} C${160 - 40} ${m + 16} ${160 - 62} ${m + 8} ${160 - 62} ${m - 20}Z" fill="${c.fur2}" stroke="${L}" stroke-width="1.8"/>
      <ellipse cx="160" cy="${m - 46}" rx="38" ry="8" fill="#fff" opacity=".18"/>
      <ellipse cx="${160 - 15}" cy="${m - 28}" rx="5.5" ry="3.6" fill="#4a3428"/><ellipse cx="${160 + 15}" cy="${m - 28}" rx="5.5" ry="3.6" fill="#4a3428"/>
      <path d="M160 ${m - 20} v12" stroke="${L}" stroke-width="1.8" stroke-linecap="round"/>
      <g class="nose" style="transform-origin:160px ${m - 28}px"><ellipse cx="${160 - 17}" cy="${m - 29.5}" rx="2" ry="1.1" fill="#fff" opacity=".45"/><ellipse cx="${160 + 13}" cy="${m - 29.5}" rx="2" ry="1.1" fill="#fff" opacity=".45"/></g>
      ${[[-34, -16], [-40, -9], [-30, -7], [34, -16], [40, -9], [30, -7]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${m + y}" r="1.6" fill="${c.dark}" opacity=".45"/>`).join('')}`;
  },
  renard(m, c, L) {
    return `<ellipse cx="160" cy="${m - 6}" rx="25" ry="17" fill="${c.light}"/>
      <path d="M151 ${m - 19} Q160 ${m - 24} 169 ${m - 19} Q166 ${m - 10} 160 ${m - 9} Q154 ${m - 10} 151 ${m - 19}Z" fill="#3b2a2a"/><ellipse cx="156" cy="${m - 19}" rx="2.6" ry="1.4" fill="#fff" opacity=".6"/>
      ${[[-15, 0], [-19, 6], [15, 0], [19, 6]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${m + y}" r="1.4" fill="${c.dark}" opacity=".5"/>`).join('')}`;
  },
  fennec(m, c, L) {
    return `<ellipse cx="160" cy="${m - 6}" rx="20" ry="14" fill="${c.light}"/>
      <path d="M153 ${m - 17} Q160 ${m - 21} 167 ${m - 17} Q165 ${m - 10} 160 ${m - 9} Q155 ${m - 10} 153 ${m - 17}Z" fill="#3b2a2a"/><ellipse cx="157" cy="${m - 17}" rx="2.2" ry="1.2" fill="#fff" opacity=".6"/>
      ${[[-13, 0], [-16, 5], [13, 0], [16, 5]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${m + y}" r="1.3" fill="${c.dark}" opacity=".55"/>`).join('')}`;
  },
  tanuki(m, c, L) {
    return `<ellipse cx="160" cy="${m - 8}" rx="27" ry="19" fill="${c.light}"/>
      <ellipse cx="160" cy="${m - 18}" rx="10" ry="6.5" fill="#3b2a2a"/><ellipse cx="156.5" cy="${m - 20}" rx="3" ry="1.6" fill="#fff" opacity=".6"/>
      ${[[-16, -2], [-20, 5], [16, -2], [20, 5]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${m + y}" r="1.5" fill="${c.dark}" opacity=".55"/>`).join('')}`;
  },
  paresseux(m, c, L) {
    return `<path d="M151 ${m - 20} Q160 ${m - 25} 169 ${m - 20} Q168 ${m - 12} 160 ${m - 11} Q152 ${m - 12} 151 ${m - 20}Z" fill="#3b2a2a"/><ellipse cx="156" cy="${m - 20}" rx="2.6" ry="1.4" fill="#fff" opacity=".6"/>`;
  },
  lemur(m, c, L) {
    return `<path d="M150 ${m - 40} Q160 ${m - 46} 170 ${m - 40} L171 ${m - 16} Q160 ${m - 6} 149 ${m - 16}Z" fill="${c.dark}" opacity=".88"/>
      <path d="M152 ${m - 19} Q160 ${m - 24} 168 ${m - 19} Q165 ${m - 11} 160 ${m - 10} Q155 ${m - 11} 152 ${m - 19}Z" fill="#2a2130"/><ellipse cx="157" cy="${m - 19}" rx="2.4" ry="1.3" fill="#fff" opacity=".6"/>`;
  },
  phoque(m, c, L) {
    const pad = mixHex(c.light, c.furH, 0.25);
    return `<ellipse cx="${160 - 12}" cy="${m - 11}" rx="15" ry="12" fill="${pad}"/><ellipse cx="${160 + 12}" cy="${m - 11}" rx="15" ry="12" fill="${pad}"/>
      ${[[-18, -14], [-11, -9], [-20, -6], [18, -14], [11, -9], [20, -6]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${m + y}" r="1.5" fill="${c.dark}" opacity=".6"/>`).join('')}
      <path d="M152 ${m - 26} Q160 ${m - 30} 168 ${m - 26} Q166 ${m - 19} 160 ${m - 18} Q154 ${m - 19} 152 ${m - 26}Z" fill="#3b2a2a"/><ellipse cx="157" cy="${m - 26}" rx="2.4" ry="1.3" fill="#fff" opacity=".6"/>
      <path d="M${160 - 26} ${m - 14} l-26 -6 M${160 - 26} ${m - 9} l-26 1 M${160 + 26} ${m - 14} l26 -6 M${160 + 26} ${m - 9} l26 1" stroke="${L}" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>`;
  },
  quokka(m, c, L) {
    return `<ellipse cx="160" cy="${m - 4}" rx="27" ry="19" fill="${c.light}"/>
      <path d="M150 ${m - 16} Q160 ${m - 21} 170 ${m - 16} Q167 ${m - 8} 160 ${m - 7} Q153 ${m - 8} 150 ${m - 16}Z" fill="#3b2a2a"/><ellipse cx="155.5" cy="${m - 16}" rx="2.8" ry="1.5" fill="#fff" opacity=".6"/>`;
  },
};
function snoutOf(ch) {
  const id = ch.parts.snout; if (!id || !SNOUTS[id]) return '';
  const m = ch.mouthY;
  if (id === ch.sp) return SNOUTS[id](m, ch.c, ch.c.line);
  const k = SNOUT_K[id] || 1;
  return `<g transform="translate(160 ${m}) scale(${k}) translate(-160 ${-m})">${SNOUTS[id](m, ch.c, ch.c.line)}</g>`;
}

// ---------- motifs (gènes) ----------
const HEAD_SPOTS = [[-0.5, -0.72, 0.13], [0.36, -0.82, 0.09], [0.66, -0.5, 0.11], [-0.84, -0.22, 0.08], [0.88, 0.1, 0.075], [-0.9, 0.3, 0.065], [0.04, -0.94, 0.06]];
function patHead(ch, c, uid) {
  const { rx, ry } = ch.head, P = c.pat, T = 150 - ry;
  const at = (u, v) => [160 + u * rx, 150 + v * ry];
  switch (ch.pattern) {
    case 'taches': return HEAD_SPOTS.map(([u, v, r]) => { const [x, y] = at(u, v); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * rx).toFixed(1)}" ry="${(r * rx * 0.8).toFixed(1)}" transform="rotate(${(u * 30).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${P}" opacity=".85"/>`; }).join('');
    case 'rayures': return [-0.26, 0, 0.26].map(u => { const x = 160 + u * rx; return `<path d="M${x - 7} ${T - 4} Q${x} ${T + ry * 0.46} ${x} ${T + ry * 0.46} Q${x} ${T + ry * 0.46} ${x + 7} ${T - 4}Z" fill="${P}" opacity=".85"/>`; }).join('')
      + [-1, 1].map(s => [-0.14, 0.1].map(v => { const y = 150 + v * ry, x0 = 160 + s * rx * 1.04, x1 = 160 + s * rx * 0.74; return `<path d="M${x0} ${y - 6} Q${x1} ${y} ${x1} ${y} Q${x1} ${y} ${x0} ${y + 6}Z" fill="${P}" opacity=".85"/>`; }).join('')).join('');
    case 'coeurs': return [0, 2, 3, 4, 6].map(i => { const [u, v, r] = HEAD_SPOTS[i], [x, y] = at(u, v); return `<path d="${heartD(+x.toFixed(1), +y.toFixed(1), Math.max(6, r * rx * 0.8))}" fill="${P}" opacity=".9"/>`; }).join('');
    case 'etoiles': return [0, 1, 2, 3, 5].map(i => { const [u, v, r] = HEAD_SPOTS[i], [x, y] = at(u, v); return `<path d="${starD(x, y, Math.max(6.5, r * rx * 0.95))}" fill="${P}" opacity=".95"/>`; }).join('');
    case 'degrade': return `<rect x="40" y="${T - 6}" width="240" height="${ry * 1.25}" fill="url(#${uid}pg)"/>`;
    default: return '';
  }
}
function patBody(ch, c, g, uid) {
  const P = c.pat, w = g.cw;
  switch (ch.pattern) {
    case 'taches': return [[-0.6, 250, 8], [0.52, 266, 9], [-0.28, 296, 6], [0.72, 298, 6]].map(([u, y, r]) => `<ellipse cx="${160 + u * w}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="${P}" opacity=".85"/>`).join('');
    case 'rayures': return [-1, 1].map(s => [248, 264, 280].map(y => `<path d="M${160 + s * (w + 8)} ${y - 4} Q${160 + s * (w - 18)} ${y} ${160 + s * (w - 18)} ${y} Q${160 + s * (w - 18)} ${y} ${160 + s * (w + 8)} ${y + 4}Z" fill="${P}" opacity=".85"/>`).join('')).join('');
    case 'coeurs': return [[-0.55, 252, 6], [0.6, 286, 5]].map(([u, y, r]) => `<path d="${heartD(160 + u * w, y, r)}" fill="${P}" opacity=".9"/>`).join('');
    case 'etoiles': return [[-0.55, 254, 7], [0.58, 270, 6], [-0.2, 300, 5]].map(([u, y, r]) => `<path d="${starD(160 + u * w, y, r)}" fill="${P}" opacity=".95"/>`).join('');
    case 'degrade': return `<rect x="60" y="250" width="200" height="90" fill="url(#${uid}pgb)"/>`;
    default: return '';
  }
}
function banditMask(ch, c) {
  const e = ch.eye, y = e.y, h = e.ry * 1.45, xl = 160 - e.dx - e.rx * 2.1, xr = 160 + e.dx + e.rx * 2.1;
  return `<path d="${smooth([[xl, y - 2], [160 - e.dx, y - h], [160, y - h * 0.5], [160 + e.dx, y - h], [xr, y - 2], [160 + e.dx, y + h], [160, y + h * 0.45], [160 - e.dx, y + h]])}" fill="${c.pat}" opacity=".92"/>`;
}

// ---------- corps : ventre ----------
function bellyOf(ch, c, g) {
  const tw = g.tw;
  switch (ch.belly) {
    case 'dark': return `<rect x="100" y="276" width="120" height="40" fill="${ch.pattern === 'pattes' ? c.pat : c.dark}"/><ellipse cx="160" cy="276" rx="${tw}" ry="10" fill="${ch.pattern === 'pattes' ? c.pat : c.dark}"/>`;
    case 'round': return `<ellipse cx="160" cy="276" rx="${tw * 0.74}" ry="36" fill="${c.light}"/><ellipse cx="${160 - tw * 0.3}" cy="262" rx="9" ry="13" fill="#fff" opacity=".35"/><path d="M${160 - 6} 280 q6 4 12 0" stroke="${c.line}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/>`;
    case 'seal': return `<ellipse cx="${160 - tw - 18}" cy="292" rx="22" ry="46" fill="${c.fur2}" opacity=".7"/><ellipse cx="${160 + tw + 18}" cy="292" rx="22" ry="46" fill="${c.fur2}" opacity=".7"/><ellipse cx="160" cy="292" rx="${tw * 0.82}" ry="44" fill="${c.light}"/>`;
    default: return `<ellipse cx="160" cy="282" rx="${tw * 0.6}" ry="30" fill="${c.light}"/>`;
  }
}

// ---------- spéciaux ----------
function auraOf(ch, uid) {
  if (ch.special !== 'pastel') return '';
  return `<g class="aura"><circle cx="160" cy="196" r="156" fill="url(#${uid}au)"/>${[[58, 120, 5, '#f9b9d4'], [272, 160, 4, '#b9dcf6'], [76, 270, 4, '#c8ecc4'], [254, 286, 5, '#e2cdf6'], [104, 64, 3.5, '#fde6a0'], [226, 70, 3, '#f9b9d4']].map(([x, y, r, col]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity=".9"/>`).join('')}</g>`;
}
function shineOf(ch, c) {
  let s = '';
  const tw = (x, y, r, d, col) => `<path class="twk" style="animation-delay:${d}s" d="${twinkleD(x, y, r)}" fill="${col}" stroke="${c.line}" stroke-width="1.1" stroke-linejoin="round"/>`;
  if (ch.special === 'brillant') s += [[54, 100, 11, 0], [270, 132, 9, 0.5], [70, 256, 8, 1.0], [262, 246, 10, 0.3], [208, 52, 7, 0.8], [112, 46, 6, 1.2]].map(([x, y, r, d]) => tw(x, y, r, d, '#fff6c2')).join('');
  if (c.fx === 'glint') s += [[122, 96, 6, 0.2], [204, 112, 5, 0.9], [140, 262, 5, 0.5]].map(([x, y, r, d]) => `<path class="twk" style="animation-delay:${d}s" d="${twinkleD(x, y, r)}" fill="#fff" opacity=".9"/>`).join('');
  return s ? `<g class="shine">${s}</g>` : '';
}

function drawChar(key, outfit, expr, uid) {
  uid = uid || 'c' + Math.random().toString(36).slice(2, 7);
  const ch = charModel(key, uid), g = geo(ch), c = ch.c, L = c.line, P = ch.parts;
  const o = outfit || {};
  const hp = headPath(ch);
  let defs = `<clipPath id="${uid}tc"><path d="${g.torso}"/></clipPath><clipPath id="${uid}hc"><path d="${hp}"/></clipPath>` + c.defs;
  if (ch.pattern === 'degrade') defs += `<linearGradient id="${uid}pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.pat}" stop-opacity=".95"/><stop offset="1" stop-color="${c.pat}" stop-opacity="0"/></linearGradient><linearGradient id="${uid}pgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.pat}" stop-opacity="0"/><stop offset="1" stop-color="${c.pat}" stop-opacity=".95"/></linearGradient>`;
  if (ch.special === 'pastel') defs += `<radialGradient id="${uid}au"><stop offset="0" stop-color="#fff4fb" stop-opacity=".95"/><stop offset=".45" stop-color="#f6d2ee" stop-opacity=".6"/><stop offset=".75" stop-color="#cfe4fb" stop-opacity=".35"/><stop offset="1" stop-color="#cfe4fb" stop-opacity="0"/></radialGradient>`;
  const cls = `cc sp-${ch.sp}${ch.hybrid ? ' hyb hyb-' + ch.hybrid.b : ''}${ch.special !== 'none' ? ' sx-' + ch.special : ''} m-${expr || 'content'}`;
  let s = `<svg viewBox="0 0 320 350" xmlns="${NS}" class="${cls}" role="img" aria-label="${ch.name}, ${ch.species}"><defs>${defs}</defs>`;
  s += auraOf(ch, uid);
  s += `<path d="M14 338 C90 322 150 346 214 330 S290 322 308 334" fill="none" stroke="#cdb08a" stroke-width="2" stroke-dasharray="5 8" stroke-linecap="round"/>`;
  const baby = ch.special === 'bebe';
  if (baby) s += `<g transform="translate(160 334) scale(.8) translate(-160 -334)">`;
  s += `<ellipse cx="160" cy="334" rx="${70 + g.tw * 0.3}" ry="8" fill="#e5d2ae"/>`;
  s += `<g class="root"><g class="breath">`;
  const tailFront = P.tail === 'phoque';
  s += backItems(o, g, ch, uid) + (P.tail && TAILS[P.tail] && !tailFront ? TAILS[P.tail](ch, c, L, g, o) : '');
  s += legsAndFeet(o, g, ch);
  // torse
  s += `<path d="${g.torso}" fill="${c.fur}"/>`;
  s += `<g clip-path="url(#${uid}tc)">`;
  s += bellyOf(ch, c, g) + patBody(ch, c, g, uid);
  s += `<ellipse cx="160" cy="232" rx="${g.tw + 6}" ry="14" fill="${c.fur2}" opacity=".45"/><ellipse cx="${160 - g.tw * 0.45}" cy="258" rx="7" ry="13" fill="#fff" opacity=".18"/>`;
  s += torsoItems(o, g, ch, uid) + `</g>`;
  s += `<path d="${g.torso}" fill="none" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
  if (tailFront) s += TAILS.phoque(ch, c, L, g, o);
    s += skirt(o, g, ch) + shortLegs(o, g, ch);
  if (o.dos === 'sac') s += `<path d="M${160 - g.tw + 10} 238 C${160 - g.tw + 16} 270 ${160 + g.tw - 24} 272 ${160 + g.tw - 6} 250" fill="none" stroke="${shade(ic(o, 'sac'), 0.72)}" stroke-width="5" stroke-linecap="round"/>`;
  s += arms(o, g, ch) + neckItems(o, g, ch);
  if (o.dos === 'cape') s += `<circle cx="160" cy="232" r="6" fill="#f6d36b" stroke="${L}" stroke-width="1.6"/>`;
  s += `</g>`;
  // tête
  s += `<g class="bob"><g class="tilt">`;
  s += P.ears && EARS[P.ears] ? EARS[P.ears](ch, c, L) : '';
  s += `<path d="${hp}" fill="${c.fur}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const ph = patHead(ch, c, uid);
  if (ph) s += `<g clip-path="url(#${uid}hc)">${ph}</g>`;
  s += MARKS(ch, c, L, uid);
  if (ch.pattern === 'masque') { s += banditMask(ch, c); ch.lidCol = c.pat; if (lumHex(c.pat) < 0.45) ch.inkEyes = '#fff6ea'; }
  if (P.mask && MASKS[P.mask]) { s += MASKS[P.mask](ch, c, L); ch.lidCol = c.dark; if (lumHex(c.dark) < 0.45) ch.inkEyes = '#fff6ea'; }
  s += snoutOf(ch);
  s += `<g class="face">${face(key, ch, expr, uid)}</g>`;
  s += headItem(o, g, ch);
  if (ch.sp === 'axo' && expr !== 'dodo' && expr !== 'endormi') s += `<g class="bubs" opacity="0" fill="#e9f7ff" stroke="${L}" stroke-width="1.3"><circle cx="198" cy="${ch.mouthY - 6}" r="5"/><circle cx="210" cy="${ch.mouthY - 22}" r="3.4"/><circle cx="203" cy="${ch.mouthY - 34}" r="2.4"/></g>`;
  s += `<g class="perch"></g></g></g>`;
  s += `<g class="fx"></g></g>`;
  if (baby) s += `</g>`;
  s += shineOf(ch, c);
  s += `</svg>`;
  return s;
}

// =====================================================================
// GÈNES : tirage, rareté, croisements
// =====================================================================
const rarityW = (r, luck) => RARITY_W[Math.max(0, Math.min(4, r))] * Math.pow(1 + 0.45 * luck, r);
function wPick(list, wf) {
  const ws = list.map(wf), tot = ws.reduce((a, b) => a + b, 0);
  let t = Math.random() * tot;
  for (let i = 0; i < list.length; i++) { t -= ws[i]; if (t <= 0) return list[i]; }
  return list[list.length - 1];
}
function patColFor(pal) {
  if (Math.random() < 0.65) return pal.pc || mixHex(pal.base, pal.accent, 0.55);
  return pick(PAT_COLS);
}
function randomGenes(sp, luck = 0) {
  const S0 = SPECIES[sp] || SPECIES.panda;
  luck = Math.max(0, Math.min(5, +luck || 0));
  const pal = wPick(S0.palettes, p => rarityW(p.r, luck));
  let pattern = pal.pat && Math.random() < 0.5 ? pal.pat : wPick(S0.patterns, id => rarityW(PATTERNS[id].r, luck) * (id === 'uni' ? 2.2 : 1));
  if (!S0.patterns.includes(pattern)) pattern = 'uni';
  const eye = wPick(Object.keys(EYES), id => rarityW(EYES[id].r, luck) * (id === 'def' ? 4 : 1));
  const special = Math.random() < 0.01 * (1 + luck) ? wPick(['bebe', 'pastel', 'brillant'], id => rarityW(SPECIALS[id].r, luck)) : 'none';
  return { pal: pal.id, base: pal.base, accent: pal.accent, belly: pal.belly, pattern, patCol: patColFor(pal), eye, special };
}
function geneRarity(genes, sp, hybrid) {
  if (!genes) return 0;
  const pal = palOf(genes, sp);
  const pr = pal ? pal.r : genes.pal === 'hybride' ? 3 : 1;
  const rs = [pr, (PATTERNS[genes.pattern] || PATTERNS.uni).r, (EYES[genes.eye] || EYES.def).r, (SPECIALS[genes.special] || SPECIALS.none).r];
  let best = Math.max(...rs);
  const strong = rs.filter(x => x >= 2).length;
  if (strong >= 3 || (strong >= 2 && best < 3)) best++;
  if (hybrid || genes.pal === 'hybride') best = Math.max(best, 3);
  return Math.min(4, best);
}
function inheritSpecial(gA, gB) {
  const has = [gA.special, gB.special].filter(x => x && x !== 'none');
  if (has.length && Math.random() < 0.35 * has.length) return pick(has);
  return 'none';
}
function mutate(g, sp, p) {
  if (Math.random() >= p) return g;
  const m = randomGenes(sp, 3), what = pick(['pal', 'pal', 'pattern', 'eye', 'special']);
  if (what === 'pal') { const pals = SPECIES[sp].palettes.filter(x => x.r >= 2); const q = pick(pals); Object.assign(g, { pal: q.id, base: q.base, accent: q.accent, belly: q.belly, patCol: patColFor(q) }); }
  else if (what === 'pattern') { const pats = SPECIES[sp].patterns.filter(x => PATTERNS[x].r >= 2); g.pattern = pick(pats); g.patCol = m.patCol; }
  else if (what === 'eye') g.eye = pick(['violet', 'rose', 'or', 'vairon']);
  else g.special = pick(['bebe', 'pastel', 'brillant']);
  g.mutation = what;
  return g;
}
function mixGenes(gA, gB, spA, spB) {
  spA = SPECIES[spA] ? spA : 'panda'; spB = SPECIES[spB] ? spB : spA;
  gA = { ...SPECIES[spA].defGenes, ...(gA || {}) }; gB = { ...SPECIES[spB].defGenes, ...(gB || {}) };
  const coin = () => Math.random() < 0.5;
  const tail = (g, P, Q, sp) => {
    const pp = coin() ? P : Q;
    g.pattern = SPECIES[sp].patterns.includes(pp.pattern) ? pp.pattern : 'uni'; g.patCol = pp.patCol;
    g.eye = coin() ? P.eye : Q.eye; g.special = inheritSpecial(P, Q);
    return g;
  };
  if (spA === spB) {
    const P = coin() ? gA : gB, Q = P === gA ? gB : gA;
    let g;
    if (gA.pal === gB.pal && gA.base === gB.base) g = { pal: gA.pal, base: gA.base, accent: gA.accent, belly: gA.belly };
    else if (Math.random() < 0.7) g = { pal: P.pal, base: P.base, accent: P.accent, belly: P.belly };
    else g = { pal: 'mix', base: mixHex(P.base, Q.base, 0.5), accent: mixHex(P.accent, Q.accent, 0.5), belly: mixHex(P.belly, Q.belly, 0.5) };
    tail(g, P, Q, spA);
    return { sp: spA, genes: mutate(g, spA, 0.06), hybrid: null };
  }
  if (Math.random() < 0.15) {
    const [a, b, ga, gb] = coin() ? [spA, spB, gA, gB] : [spB, spA, gB, gA];
    const g = tail({ pal: 'hybride', base: mixHex(ga.base, gb.base, 0.3), accent: mixHex(ga.accent, gb.accent, 0.4), belly: mixHex(ga.belly, gb.belly, 0.2) }, ga, gb, a);
    return { sp: a, genes: g, hybrid: { a, b, t: pick(SPECIES[b].graft) } };
  }
  const [a, ga, gb] = coin() ? [spA, gA, gB] : [spB, gB, gA];
  const g = tail({ pal: 'mix', base: mixHex(ga.base, gb.base, 0.35), accent: mixHex(ga.accent, gb.accent, 0.3), belly: mixHex(ga.belly, gb.belly, 0.25) }, ga, gb, a);
  return { sp: a, genes: mutate(g, a, 0.04), hybrid: null };
}
// petit libellé lisible des gènes (pour les fiches)
function geneLabel(genes, sp) {
  if (!genes) return '';
  const pal = palOf(genes, sp), parts = [pal ? pal.name : genes.pal === 'hybride' ? 'Hybride' : 'Mélange'];
  if (genes.pattern && genes.pattern !== 'uni' && PATTERNS[genes.pattern]) parts.push(PATTERNS[genes.pattern].name);
  if (genes.eye && genes.eye !== 'def' && EYES[genes.eye]) parts.push('yeux ' + EYES[genes.eye].name.toLowerCase());
  if (genes.special && genes.special !== 'none' && SPECIALS[genes.special]) parts.push(SPECIALS[genes.special].name);
  return parts.join(' · ');
}

// =====================================================================
// ŒUFS : drawEgg(sp|null, genes|null, crack 0..3, uid)
// =====================================================================
const EGG_D = 'M60 16 C85 16 102 58 102 86 C102 113 84 129 60 129 C36 129 18 113 18 86 C18 58 35 16 60 16Z';
const EGG_SPOTS = [[42, 42], [74, 34], [58, 62], [88, 68], [32, 78], [68, 92], [46, 112], [84, 106], [26, 104], [94, 92]];
function eggMotif(m, b, L) {
  const at = (n) => EGG_SPOTS.slice(0, n);
  switch (m) {
    case 'leaves': return at(8).map(([x, y], i) => `<path d="M${x - 7} ${y + 4} Q${x - 6} ${y - 7} ${x + 7} ${y - 5} Q${x + 6} ${y + 6} ${x - 7} ${y + 4}Z" fill="${b}" transform="rotate(${i * 47} ${x} ${y})"/><path d="M${x - 5} ${y + 3} L${x + 5} ${y - 4}" stroke="${shade(b, 0.75)}" stroke-width="1.2" transform="rotate(${i * 47} ${x} ${y})"/>`).join('');
    case 'leaves2': return at(7).map(([x, y], i) => `<path d="M${x} ${y - 8} q8 6 0 16 q-8 -10 0 -16Z" fill="${b}" transform="rotate(${i * 61 - 30} ${x} ${y})"/>`).join('') + at(10).slice(7).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${b}" opacity=".7"/>`).join('');
    case 'waves': return [44, 70, 96, 118].map((y, i) => `<path d="M14 ${y} q8 -7 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="${b}" stroke-width="4.5" stroke-linecap="round" opacity="${i % 2 ? 0.75 : 1}"/>`).join('');
    case 'bubbles': return at(9).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${4 + (i % 3) * 2.4}" fill="#fff" fill-opacity=".55" stroke="${b}" stroke-width="2"/><circle cx="${x - 2}" cy="${y - 2}" r="1.4" fill="#fff"/>`).join('');
    case 'snow': return at(8).map(([x, y], i) => { const r = 5 + (i % 2) * 2; return `<g stroke="${b}" stroke-width="2" stroke-linecap="round">${[0, 60, 120].map(a => `<path d="M${x - r} ${y} h${2 * r}" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>`; }).join('');
    case 'dunes': return [52, 78, 104].map((y, i) => `<path d="M10 ${y} Q30 ${y - 14} 50 ${y} T90 ${y} T130 ${y}" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round" opacity="${1 - i * 0.15}"/>`).join('') + `<circle cx="76" cy="34" r="6" fill="${shade(b, 1.25)}"/>`;
    case 'flowers': return at(7).map(([x, y], i) => `<g transform="rotate(${i * 30} ${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="${y - 4.5}" rx="2.8" ry="4.2" fill="${i % 2 ? '#f6a6b8' : '#fff4c8'}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2.2" fill="${b}"/></g>`).join('') + `<path d="M22 60 q14 10 8 30 M98 54 q-12 14 -6 32" stroke="${b}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'rings': return [38, 60, 82, 104, 126].map(y => `<path d="M10 ${y} q50 8 100 0" stroke="${b}" stroke-width="7" fill="none" opacity=".55"/>`).join('');
    case 'suns': return at(7).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${4 + (i % 2) * 1.5}" fill="${b}"/>${i % 2 ? '' : `<circle cx="${x}" cy="${y}" r="8.5" fill="none" stroke="${b}" stroke-width="1.6" stroke-dasharray="2 3"/>`}`).join('');
    case 'mystery': {
      const cols = ['#f6a6c1', '#a8d8f0', '#bfe6a8', '#f6d88a', '#cdb8ee'];
      return at(10).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${4 + (i % 3) * 1.6}" fill="${cols[i % 5]}"/>`).join('')
        + `<path d="M14 84 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8" fill="none" stroke="#f2b5c8" stroke-width="5" stroke-linejoin="round"/>`
        + `<text x="60" y="76" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="34" fill="#fff" stroke="${L}" stroke-width="2.4" paint-order="stroke">?</text>`;
    }
    default: return '';
  }
}
function drawEgg(sp, genes, crack, uid) {
  uid = uid || 'eg' + Math.random().toString(36).slice(2, 7);
  crack = Math.max(0, Math.min(3, crack | 0));
  const S0 = SPECIES[sp];
  const th = S0 ? S0.egg : { a: '#fff3dc', b: '#f2b5c8', m: 'mystery' };
  let a = th.a, b = th.b;
  if (genes && genes.base) { a = mixHex(a, genes.base, 0.35); b = mixHex(b, genes.accent || b, 0.25); }
  const L = '#6b4a3c', shiny = genes && genes.special === 'brillant';
  const name = S0 ? `Œuf de ${S0.name.toLowerCase()}` : 'Œuf mystère';
  const defs = `<clipPath id="${uid}ek"><path d="${EGG_D}"/></clipPath><radialGradient id="${uid}eh" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${shade(a, 0.82)}" stop-opacity=".55"/></radialGradient>`
    + `<radialGradient id="${uid}eg"><stop offset="0" stop-color="#fff6c4"/><stop offset="1" stop-color="#ffe38a" stop-opacity="0"/></radialGradient>`
    + `<clipPath id="${uid}top"><path d="M0 0 H120 V74 L110 82 L100 74 L90 82 L80 74 L70 82 L60 74 L50 82 L40 74 L30 82 L20 74 L10 82 L0 74Z"/></clipPath><clipPath id="${uid}bot"><path d="M0 140 H120 V74 L110 82 L100 74 L90 82 L80 74 L70 82 L60 74 L50 82 L40 74 L30 82 L20 74 L10 82 L0 74Z"/></clipPath>`;
  const shell = `<path d="${EGG_D}" fill="${a}"/><g clip-path="url(#${uid}ek)">${eggMotif(th.m, b, L)}<path d="${EGG_D}" fill="url(#${uid}eh)"/></g><path d="${EGG_D}" fill="none" stroke="${L}" stroke-width="2.6"/><ellipse cx="44" cy="40" rx="7" ry="11" fill="#fff" opacity=".55" transform="rotate(24 44 40)"/>`;
  const cr = (d) => `<path d="${d}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".6" transform="translate(1 1)"/>`;
  let body;
  if (crack >= 3) {
    body = `<ellipse cx="60" cy="80" rx="44" ry="26" fill="url(#${uid}eg)"/>`
      + `<g clip-path="url(#${uid}bot)">${shell}</g>`
      + `<g transform="translate(4 -5) rotate(-13 20 76)"><g clip-path="url(#${uid}top)">${shell}</g><path d="M18 74 L20 74 L30 82 L40 74 L50 82 L60 74 L70 82 L80 74 L90 82 L100 74 L102 74" fill="none" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/></g>`
      + `<path d="M18 74 L20 74 L30 82 L40 74 L50 82 L60 74 L70 82 L80 74 L90 82 L100 74 L102 74" fill="none" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`
      + `<g class="peek"><ellipse cx="49" cy="70" rx="4" ry="5" fill="#2a2130"/><ellipse cx="71" cy="70" rx="4" ry="5" fill="#2a2130"/><circle cx="47.8" cy="68.3" r="1.6" fill="#fff"/><circle cx="69.8" cy="68.3" r="1.6" fill="#fff"/></g>`
      + [[14, 50, 0], [104, 46, 0.4], [60, 22, 0.8]].map(([x, y, d]) => `<path class="twk" style="animation-delay:${d}s" d="${twinkleD(x, y, 6)}" fill="#ffe27a" stroke="${L}" stroke-width="1.1"/>`).join('');
  } else {
    body = shell;
    if (crack >= 1) body += cr('M66 18 L60 30 L67 36 L61 46');
    if (crack >= 2) body += cr('M19 84 L30 78 L37 86 L47 79 L55 87') + cr('M101 80 L92 86 L95 94');
  }
  if (shiny) body += [[16, 30, 0], [104, 112, 0.6], [100, 26, 1.1]].map(([x, y, d]) => `<path class="twk" style="animation-delay:${d}s" d="${twinkleD(x, y, 6)}" fill="#fff6c2" stroke="${L}" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 120 140" xmlns="${NS}" class="ccegg${crack ? ' cr' + crack : ''}${S0 ? ' egg-' + sp : ' egg-mystere'}" role="img" aria-label="${name}"><defs>${defs}</defs><ellipse cx="60" cy="132" rx="36" ry="6" fill="#e5d2ae"/><g class="eggwob">${body}</g></svg>`;
}

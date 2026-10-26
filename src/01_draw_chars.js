const NS = 'http://www.w3.org/2000/svg';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
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
function capsule(x1, y1, x2, y2, w, fill, line) {
  const d = `M${x1} ${y1}L${x2} ${y2}`;
  return `<path d="${d}" stroke="${line}" stroke-width="${w + 3.4}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
}

// ---------- les compagnons ----------
const CHARS = {
  pistache: {
    name: 'Pistache', species: 'Panda roux', perso: 'Curieuse',
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
    name: 'Mochi', species: 'Capybara', perso: 'Zen',
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
    name: 'Bulle', species: 'Axolotl', perso: 'Joyeuse',
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

// ---------- dessin ----------
function geo(ch) {
  const tw = ch.tw;
  return {
    tw, headTop: 150 - ch.head.ry, neckY: 228,
    shL: [160 - tw + 7, 248], shR: [160 + tw - 7, 248], hL: [160 - tw - 9, 284], hR: [160 + tw + 9, 284],
    legL: [160 - 19, 300, 160 - 21, 316], legR: [160 + 19, 300, 160 + 21, 316],
    torso: `M${160 - tw + 4} 236 C${160 - tw - 3} 268 ${160 - tw} 302 ${160 - tw + 16} 310 L${160 + tw - 16} 310 C${160 + tw} 302 ${160 + tw + 3} 268 ${160 + tw - 4} 236 C${160 + tw - 18} 222 ${160 - tw + 18} 222 ${160 - tw + 4} 236Z`,
  };
}
function headPath(key, ch) {
  const { rx, ry } = ch.head;
  if (key === 'mochi') {
    const x = 160 - rx, y = 150 - ry, w = rx * 2, h = ry * 2;
    return `M${x + 64} ${y + 2} Q160 ${y - 6} ${x + w - 64} ${y + 2} Q${x + w + 2} ${y + 6} ${x + w} ${y + 70} L${x + w - 2} ${y + h - 54} Q${x + w - 6} ${y + h} ${160 + 30} ${y + h} L${160 - 30} ${y + h} Q${x + 6} ${y + h} ${x + 2} ${y + h - 54} L${x} ${y + 70} Q${x - 2} ${y + 6} ${x + 64} ${y + 2}Z`;
  }
  const pts = [];
  const N = 52;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    let r = 1;
    if (key === 'pistache') {
      const fluff = (a > 0.12 * Math.PI && a < 0.42 * Math.PI) || (a > 0.58 * Math.PI && a < 0.88 * Math.PI);
      if (fluff) r = i % 2 ? 1.07 : 0.985;
    }
    let yy = Math.sin(a) * ry;
    if (key === 'bulle' && yy > 0) yy *= 0.93;
    pts.push([160 + Math.cos(a) * rx * r, 150 + yy * r]);
  }
  return smooth(pts);
}
function eyeOpen(x, y, rx, ry, iris, uid, i, scale = 1) {
  rx *= scale; ry *= scale;
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
  const sparkle = (x, y, r, d = 0) => `<path class="twk" style="animation-delay:${d}s" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="#ffe27a" stroke="${L}" stroke-width="1.3" stroke-linejoin="round"/>`;
  const blushLines = () => xs.map((_, i) => {
    const bx = 160 + (i ? 1 : -1) * ch.blush.dx;
    return [-6, 0, 6].map(o => `<path d="M${bx + o - 2} ${ch.blush.y + 3} l4 -6" stroke="${shade(c.blush, 0.8)}" stroke-width="1.4" stroke-linecap="round"/>`).join('');
  }).join('');
  const arcs = (up) => xs.map(x => up
    ? `<path d="M${x - e.rx} ${e.y + 3} Q${x} ${e.y - e.ry - 3} ${x + e.rx} ${e.y + 3}" fill="none" stroke="#2a2130" stroke-width="3.4" stroke-linecap="round"/>`
    : `<path d="M${x - e.rx} ${e.y} Q${x} ${e.y + e.ry * 0.75} ${x + e.rx} ${e.y}" fill="none" stroke="#2a2130" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  const open = (s = 1) => xs.map((x, i) => eyeOpen(x, e.y, e.rx, e.ry, c.iris, uid, i, s)).join('');
  const lids = (depth) => xs.map(x => {
    const top = e.y - e.ry - 3, yl = e.y - e.ry + e.ry * 2 * depth;
    return `<path d="M${x - e.rx - 2} ${top} L${x + e.rx + 2} ${top} L${x + e.rx + 2} ${yl} Q${x} ${yl + 4} ${x - e.rx - 2} ${yl}Z" fill="${c.fur}"/><path d="M${x - e.rx - 1} ${yl} Q${x} ${yl + 4} ${x + e.rx + 1} ${yl}" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
  }).join('');
  const defMouth = () => {
    if (ch.mouth === 'w') return `<path d="M${160 - 11} ${mY} Q${160 - 5.5} ${mY + 7} 160 ${mY} Q${160 + 5.5} ${mY + 7} ${160 + 11} ${mY}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ch.mouth === 'wide') return `<path d="M${160 - 30} ${mY} Q160 ${mY + 20} ${160 + 30} ${mY}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<path d="M${160 - 8} ${mY} Q160 ${mY + 6} ${160 + 8} ${mY}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
  };
  const w = ch.mouth === 'wide' ? 26 : 13;
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
      eyes = eyeOpen(xs[0], e.y, e.rx, e.ry, c.iris, uid, 0, 1) + eyeOpen(xs[1], e.y - 1, e.rx, e.ry, c.iris, uid, 1, 1.16);
      mouth = `<ellipse cx="${160 + 4}" cy="${mY + 2}" rx="4" ry="4.6" fill="#8c3a4c" stroke="${L}" stroke-width="1.8"/>`; blush = blushBase(0.95);
      over = `<path d="M${xs[1] - 12} ${e.y - e.ry - 16} Q${xs[1]} ${e.y - e.ry - 25} ${xs[1] + 12} ${e.y - e.ry - 15}" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/><path d="M${xs[0] - 10} ${e.y - e.ry - 9} Q${xs[0]} ${e.y - e.ry - 12} ${xs[0] + 10} ${e.y - e.ry - 9}" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
      fx = `<g class="rise" style="animation-iteration-count:infinite;animation-duration:2.6s"><text x="250" y="92" font-family="Fredoka,sans-serif" font-weight="700" font-size="34" fill="#fff" stroke="${L}" stroke-width="2.4" paint-order="stroke">?</text></g>`;
      break;
    }
    case 'fier':
      eyes = xs.map(x => `<path d="M${x - e.rx} ${e.y + 2} Q${x} ${e.y - e.ry * 0.9} ${x + e.rx} ${e.y + 2}" fill="none" stroke="#2a2130" stroke-width="3.4" stroke-linecap="round"/><path d="M${x + e.rx - 1} ${e.y + 1} l4 -3" stroke="#2a2130" stroke-width="2" stroke-linecap="round"/>`).join('');
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
function legsAndFeet(o, g, ch) {
  const c = ch.c, L = c.line, footC = ch === CHARS.pistache ? c.dark : shade(c.fur, 0.9);
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
  const t = g.tw;
  if (o.bas === 'calecon') {
    s += `<rect x="${160 - t - 6}" y="282" width="${2 * t + 12}" height="34" fill="${ic(o, 'calecon')}"/><rect x="${160 - t - 6}" y="280" width="${2 * t + 12}" height="7" fill="#9cc3e8"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="${heartD(160 - t + 12 + i * (2 * t - 24) / 5, 297 + (i % 2) * 6, 3.4)}" fill="#ef7f9c"/>`;
  }
  if (o.bas === 'short') s += `<rect x="${160 - t - 6}" y="280" width="${2 * t + 12}" height="36" fill="${ic(o, 'short')}"/><rect x="${160 - t - 6}" y="280" width="${2 * t + 12}" height="6" fill="${shade(ic(o, 'short'), 0.85)}"/><path d="M160 288 v20" stroke="${shade(ic(o, 'short'), 0.75)}" stroke-width="1.4"/><circle cx="160" cy="283" r="2" fill="#f6d36b"/>`;
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
  const t = g.tw, L = ch.c.line;
  return `<path d="M${160 - t + 2} 280 L${160 + t - 2} 280 L${160 + t + 14} 316 Q160 324 ${160 - t - 14} 316Z" fill="${ic(o, 'jupe')}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${160 - t / 2} 284 l-6 34 M160 284 v38 M${160 + t / 2} 284 l6 34" stroke="${shade(ic(o, 'jupe'), 0.82)}" stroke-width="1.4"/>`;
}
function shortLegs(o, g, ch) {
  if (o.bas !== 'calecon' && o.bas !== 'short') return '';
  const c = o.bas === 'short' ? ic(o, 'short') : ic(o, 'calecon'), L = ch.c.line, len = o.bas === 'short' ? 4 : 1;
  return [g.legL, g.legR].map(([x1, y1]) => capsule(x1, y1 - 2, x1, y1 + len, 29, c, L)).join('');
}
function arms(o, g, ch) {
  const c = ch.c, L = c.line, armC = ch === CHARS.pistache ? c.dark : c.fur;
  let s = '';
  for (const [sh, h] of [[g.shL, g.hL], [g.shR, g.hR]]) {
    s += capsule(sh[0], sh[1], h[0], h[1], 22, armC, L);
    const lerp = k => [sh[0] + (h[0] - sh[0]) * k, sh[1] + (h[1] - sh[1]) * k];
    if (o.haut === 'tshirt') { const m = lerp(0.42); s += capsule(sh[0], sh[1] - 2, m[0], m[1], 25, ic(o, 'tshirt'), L); }
    if (o.haut === 'pull' || o.haut === 'sweat') {
      const col = ic(o, o.haut), m = lerp(0.78); s += capsule(sh[0], sh[1] - 2, m[0], m[1], 25, col, L);
      s += capsule(m[0], m[1], m[0] + (h[0] - sh[0]) * 0.02, m[1] + 1, 26, shade(col, 0.88), L);
    }
    const side = h[0] < 160 ? -1 : 1;
    if (o.mains === 'gants') s += `<circle cx="${h[0]}" cy="${h[1]}" r="12.5" fill="${ic(o, 'gants')}" stroke="${L}" stroke-width="1.8"/><path d="M${h[0] - 10} ${h[1] - 9} q10 -6 20 0" stroke="${shade(ic(o, 'gants'), 0.8)}" stroke-width="3" fill="none"/>`;
    else if (o.mains === 'moufles') s += `<ellipse cx="${h[0]}" cy="${h[1] + 1}" rx="14" ry="15" fill="${ic(o, 'moufles')}" stroke="${L}" stroke-width="1.8"/><ellipse cx="${h[0] - side * 11}" cy="${h[1] - 4}" rx="5.5" ry="7" fill="${ic(o, 'moufles')}" stroke="${L}" stroke-width="1.6"/><path d="M${h[0] - 12} ${h[1] - 9} h24" stroke="#fff" stroke-width="3"/>`;
    else if (ch === CHARS.bulle) s += [-6, 0, 6].map(dx => `<circle cx="${h[0] + dx}" cy="${h[1] + 9}" r="4.4" fill="${c.fur}" stroke="${L}" stroke-width="1.4"/>`).join('');
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

// ---------- têtes ----------
function headBack(key, ch) {
  const c = ch.c, L = c.line;
  if (key === 'pistache') {
    const ear = (x, side) => `<g class="ear" style="transform-origin:${x}px ${100}px"><g transform="translate(${x} 92) rotate(${side * 20}) scale(${side} 1)">
      <path d="M-30 26 C-36 -8 -12 -40 6 -42 C24 -38 36 -6 30 26Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-17 21 C-21 -2 -6 -24 4 -27 C14 -23 22 -2 18 21Z" fill="${c.inner}"/>
      <path d="M-22 14 C-22 -2 -14 -18 -4 -26 M-10 18 C-10 4 -4 -8 2 -14" stroke="${c.light}" stroke-width="3.4" stroke-linecap="round" fill="none"/></g></g>`;
    return ear(160 - 64, -1) + ear(160 + 64, 1);
  }
  if (key === 'mochi') {
    const ear = (x, side) => `<g class="ear" style="transform-origin:${x}px 84px"><ellipse cx="${x}" cy="76" rx="17" ry="15" fill="${c.fur2}" stroke="${L}" stroke-width="2"/><ellipse cx="${x + side * 1}" cy="78" rx="8" ry="7" fill="${c.inner}"/></g>`;
    return ear(160 - 66, -1) + ear(160 + 66, 1);
  }
  // axolotl : branchies
  let s = '';
  for (const side of [-1, 1]) {
    const bx = 160 + side * 92;
    s += `<g class="wave ${side > 0 ? 'r' : ''}" style="transform-origin:${bx}px 148px">`;
    [[-0.7, 112, 44], [-0.12, 142, 48], [0.45, 172, 40]].forEach(([ang, by, len]) => {
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
}
function headFront(key, ch, uid) {
  const c = ch.c, L = c.line;
  if (key === 'pistache') {
    return `<g clip-path="url(#${uid}hc)">
      <ellipse cx="${160 - 58}" cy="186" rx="44" ry="34" fill="${c.light}"/><ellipse cx="${160 + 58}" cy="186" rx="44" ry="34" fill="${c.light}"/>
      <ellipse cx="160" cy="216" rx="80" ry="20" fill="${c.fur2}" opacity=".35"/>
      <path d="M${160 - 45} 170 C${160 - 47} 180 ${160 - 45} 190 ${160 - 41} 198 M${160 + 45} 170 C${160 + 47} 180 ${160 + 45} 190 ${160 + 41} 198" stroke="${c.fur2}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".75"/>
      <ellipse cx="160" cy="104" rx="42" ry="16" fill="#fff" opacity=".22"/></g>
      <ellipse cx="${160 - 38}" cy="127" rx="15" ry="9" fill="${c.light}"/><ellipse cx="${160 + 38}" cy="127" rx="15" ry="9" fill="${c.light}"/>
      <ellipse cx="160" cy="190" rx="31" ry="22" fill="${c.light}"/>
      <path d="M150 178 Q160 172 170 178 Q167 187 160 188 Q153 187 150 178Z" fill="#3b2a2a"/><ellipse cx="156" cy="178" rx="3" ry="1.6" fill="#fff" opacity=".6"/>
      <path d="M150 80 q4 -9 9 -2 M160 78 q5 -10 10 -1" fill="none" stroke="${c.fur2}" stroke-width="2.6" stroke-linecap="round"/>
      ${[[-17, 194], [-21, 201], [-12, 202], [17, 194], [21, 201], [12, 202]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${y}" r="1.5" fill="${c.fur2}" opacity=".75"/>`).join('')}`;
  }
  if (key === 'mochi') {
    return `<g clip-path="url(#${uid}hc)"><ellipse cx="160" cy="96" rx="48" ry="16" fill="#fff" opacity=".2"/><ellipse cx="160" cy="226" rx="90" ry="14" fill="${c.fur2}" opacity=".35"/></g>
      <path d="M${160 - 62} 186 C${160 - 64} 158 ${160 - 40} 150 160 150 C${160 + 40} 150 ${160 + 64} 158 ${160 + 62} 186 C${160 + 62} 214 ${160 + 40} 222 160 222 C${160 - 40} 222 ${160 - 62} 214 ${160 - 62} 186Z" fill="${c.fur2}" stroke="${L}" stroke-width="1.8"/>
      <ellipse cx="160" cy="160" rx="38" ry="8" fill="#fff" opacity=".18"/>
      <ellipse cx="${160 - 15}" cy="178" rx="5.5" ry="3.6" fill="#4a3428"/><ellipse cx="${160 + 15}" cy="178" rx="5.5" ry="3.6" fill="#4a3428"/>
      <path d="M160 186 v12" stroke="${L}" stroke-width="1.8" stroke-linecap="round"/>
      <g class="nose" style="transform-origin:160px 178px"><ellipse cx="${160 - 17}" cy="176.5" rx="2" ry="1.1" fill="#fff" opacity=".45"/><ellipse cx="${160 + 13}" cy="176.5" rx="2" ry="1.1" fill="#fff" opacity=".45"/></g>
      ${[[-34, 190], [-40, 197], [-30, 199], [34, 190], [40, 197], [30, 199]].map(([dx, y]) => `<circle cx="${160 + dx}" cy="${y}" r="1.6" fill="${c.dark}" opacity=".45"/>`).join('')}
      <path d="M${160 - 76} 150 q5 3 3 9 M${160 + 76} 150 q-5 3 -3 9" fill="none" stroke="${c.fur2}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M152 74 q4 -14 10 -2 M162 72 q6 -12 10 0" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return `<g clip-path="url(#${uid}hc)"><ellipse cx="160" cy="100" rx="50" ry="16" fill="#fff" opacity=".3"/><ellipse cx="160" cy="214" rx="96" ry="16" fill="${c.fur2}" opacity=".35"/></g>
    ${[[132, 96], [146, 88], [176, 90], [190, 100], [161, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${c.dark}" opacity=".45"/>`).join('')}
    <path d="M${160 - 84} 128 Q${160 - 80} 108 ${160 - 64} 98" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/><circle cx="${160 - 86}" cy="138" r="2" fill="#fff" opacity=".55"/>`;
}
function tail(key, ch, g) {
  const c = ch.c, L = c.line, x0 = 160 + g.tw - 8;
  if (key === 'pistache') {
    const d = `M${x0} 300 C${x0 + 56} 306 ${x0 + 82} 262 ${x0 + 66} 214`;
    return `<g class="swish" style="transform-origin:${x0}px 300px"><path d="${d}" stroke="${L}" stroke-width="42" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.fur}" stroke-width="38" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.fur2}" stroke-width="38" stroke-dasharray="15 15" stroke-dashoffset="-6" fill="none"/><circle cx="${x0 + 66}" cy="214" r="17" fill="${c.dark}"/></g>`;
  }
  if (key === 'bulle') return `<g class="swish" style="transform-origin:${x0}px 296px"><path d="M${x0 - 4} 302 C${x0 + 50} 310 ${x0 + 84} 284 ${x0 + 78} 244 C${x0 + 56} 262 ${x0 + 26} 276 ${x0 - 4} 276Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M${x0 + 10} 300 C${x0 + 52} 302 ${x0 + 78} 280 ${x0 + 78} 246" stroke="${c.gill}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
  return '';
}

function drawChar(key, outfit, expr, uid) {
  const ch = CHARS[key], g = geo(ch), c = ch.c, L = c.line, o = outfit;
  const hp = headPath(key, ch);
  let s = `<svg viewBox="0 0 320 350" xmlns="${NS}" class="cc sp-${key} m-${expr || 'content'}" role="img" aria-label="${ch.name}, ${ch.species}"><defs><clipPath id="${uid}tc"><path d="${g.torso}"/></clipPath><clipPath id="${uid}hc"><path d="${hp}"/></clipPath></defs>`;
  s += `<path d="M14 338 C90 322 150 346 214 330 S290 322 308 334" fill="none" stroke="#cdb08a" stroke-width="2" stroke-dasharray="5 8" stroke-linecap="round"/>`;
  s += `<ellipse cx="160" cy="334" rx="${70 + g.tw * 0.3}" ry="8" fill="#e5d2ae"/>`;
  s += `<g class="root"><g class="breath">`;
  s += backItems(o, g, ch, uid) + tail(key, ch, g);
  s += legsAndFeet(o, g, ch);
  // torse
  s += `<path d="${g.torso}" fill="${c.fur}"/>`;
  s += `<g clip-path="url(#${uid}tc)">`;
  if (key === 'pistache') s += `<rect x="100" y="276" width="120" height="40" fill="${c.dark}"/><ellipse cx="160" cy="276" rx="${g.tw}" ry="10" fill="${c.dark}"/>`;
  else s += `<ellipse cx="160" cy="282" rx="${g.tw * 0.6}" ry="30" fill="${c.light}"/>`;
  s += `<ellipse cx="160" cy="232" rx="${g.tw + 6}" ry="14" fill="${c.fur2}" opacity=".45"/><ellipse cx="${160 - g.tw * 0.45}" cy="258" rx="7" ry="13" fill="#fff" opacity=".18"/>`;
  s += torsoItems(o, g, ch, uid) + `</g>`;
  s += `<path d="${g.torso}" fill="none" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
  s += skirt(o, g, ch) + shortLegs(o, g, ch);
  if (o.dos === 'sac') s += `<path d="M${160 - g.tw + 10} 238 C${160 - g.tw + 16} 270 ${160 + g.tw - 24} 272 ${160 + g.tw - 6} 250" fill="none" stroke="${shade(ic(o, 'sac'), 0.72)}" stroke-width="5" stroke-linecap="round"/>`;
  s += arms(o, g, ch) + neckItems(o, g, ch);
  if (o.dos === 'cape') s += `<circle cx="160" cy="232" r="6" fill="#f6d36b" stroke="${L}" stroke-width="1.6"/>`;
  s += `</g>`;
  // tête
  s += `<g class="bob"><g class="tilt">`;
  s += headBack(key, ch);
  s += `<path d="${hp}" fill="${c.fur}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += headFront(key, ch, uid);
  s += `<g class="face">${face(key, ch, expr, uid)}</g>`;
  s += headItem(o, g, ch);
  if (key === 'bulle' && expr !== 'dodo' && expr !== 'endormi') s += `<g class="bubs" opacity="0" fill="#e9f7ff" stroke="${L}" stroke-width="1.3"><circle cx="198" cy="${ch.mouthY - 6}" r="5"/><circle cx="210" cy="${ch.mouthY - 22}" r="3.4"/><circle cx="203" cy="${ch.mouthY - 34}" r="2.4"/></g>`;
  s += `<g class="perch"></g></g></g>`;
  s += `<g class="fx"></g></g></svg>`;
  return s;
}



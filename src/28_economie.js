// ================= ÉCONOMIE VIVANTE (v15 bis) : événements de saison, cadeaux, machine à souvenirs, tournois =================
// Idée du joueur : « des cadeaux uniques, des tournois qui donnent des récompenses uniques, un tirage qui consomme une ressource ».
// Tout est ici ; les autres fichiers ne sont pas modifiés (sauf 12_jeu.js et 19_style.js, voir plus bas) : on ENVELOPPE.
//
// 1. ÉVÉNEMENTS DE SAISON (calendrier réel, 7 à 14 jours, un seul à la fois) : ECO_EVENTS. Chacun a une ressource temporaire
//    récoltée en voyage (×2 dans ses paysages, ×3 près de ses hauts lieux), une boutique d'événement (objets DATÉS, œuf d'une
//    variante exclusive), et une bannière à la machine. À la fin, la ressource restante devient des pièces (à récupérer au menu).
//    L'« événement du jour » de 12_jeu.js devient le « bonus du jour » ; pendant un événement, le bonus du jour EST l'événement.
// 2. CADEAUX : série de 7 jours revue (tickets, objet daté du mois), cadeau de bienvenue unique, anniversaires des compagnons.
// 3. MACHINE À SOUVENIRS (village › Capsules) : 1 ticket = 1 capsule. Probabilités affichées, garanties (épique ≤ 10, légendaire ≤ 50).
//    Tickets : échange du surplus d'objets communs (20 → 1) et peu communs (6 → 1), tournois, cadeaux, commandes difficiles,
//    paliers de collection, boutique d'événement. Pièces : un seul « tirage doré » par jour, cher (300). Jamais d'argent réel.
// 4. TOURNOI DE STYLE (compagnons › Tournoi) : chaque semaine, 4 manches (une par jour, toutes le dimanche) contre 15 joueurs
//    SIMULÉS (pseudos du marché mondial), classement suisse, récompenses par rang (tickets, trophée daté, vêtement unique).
// 5. MARCHÉ : les objets datés valent plus (value, mkFair) et l'affichent ; quelques objets d'anciens événements y circulent.
// Rien ne s'ouvre tout seul ; rien n'est visible pendant le tutoriel (ecoOn).
// État : S.eco = { tickets, pity, lux, evs, gifts, pend, tour, keep, recipes, seenT, st } (valeurs par défaut : ecoState).
// Enveloppées : todayEvent (via 12_jeu), collect, showHaul, value, mkFair, mkGen, mkSub, mkRowSell, randomGenes, mixGenes,
//   renderMenu, pendingRewards, menuRewardRow, menuClaimAll, claimTier, renderPanel, subDot, renderVillageTab, canCraft,
//   renderAtelier, obStory, obRareHTML. Écoute GAME 'order:done'.

// ---------------- état ----------------
function ecoState() {
  if (!S.eco || typeof S.eco !== 'object') S.eco = {};
  const E = S.eco;
  if (typeof E.tickets !== 'number' || !isFinite(E.tickets) || E.tickets < 0) E.tickets = 0;
  if (!E.pity || typeof E.pity !== 'object') E.pity = {};
  for (const b of ['perm', 'ev']) { const p = E.pity[b]; if (!p || typeof p !== 'object') E.pity[b] = { e: 0, l: 0, n: 0 }; else for (const k of ['e', 'l', 'n']) if (typeof p[k] !== 'number') p[k] = 0; }
  if (typeof E.lux !== 'number') E.lux = 0;
  if (!E.evs || typeof E.evs !== 'object') E.evs = {};
  if (!E.gifts || typeof E.gifts !== 'object') E.gifts = {};
  if (!E.gifts.bday || typeof E.gifts.bday !== 'object') E.gifts.bday = {};
  if (!E.gifts.month || typeof E.gifts.month !== 'object') E.gifts.month = {};
  if (!Array.isArray(E.pend)) E.pend = [];
  if (E.tour && typeof E.tour !== 'object') E.tour = null;
  if (typeof E.keep !== 'number') E.keep = 3;
  if (!Array.isArray(E.recipes)) E.recipes = [];
  if (typeof E.seenT !== 'number') E.seenT = 0;
  if (!E.st || typeof E.st !== 'object') E.st = {};
  for (const k of ['exch', 'exchN', 'pulls', 'lux', 'evRes', 'tours', 'tickIn']) if (typeof E.st[k] !== 'number') E.st[k] = 0;
  if (!Array.isArray(E.trophies)) E.trophies = [];
  return E;
}
// rien de tout cela pendant le premier lancement et le tutoriel
const ecoOn = () => { try { return !!S && !S.firstRun && !(typeof tutoActive === 'function' && tutoActive()); } catch (e) { return false; } };
const ecoPl = (n, one, many) => `${n.toLocaleString('fr-FR')} ${n > 1 ? many : one}`;
const ecoCap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const ECO_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ecoDate = ms => { const d = new Date(ms); return `${d.getDate() === 1 ? '1er' : d.getDate()} ${ECO_MOIS[d.getMonth()]}`; };
const ecoDaysLeft = ms => Math.max(0, Math.ceil((ms - Date.now()) / 864e5));
function ecoAddTickets(n, why) {
  const E = ecoState(); n = Math.max(0, Math.round(n)); if (!n) return 0;
  E.tickets += n; E.st.tickIn += n; if (why) E.st['t_' + why] = (E.st['t_' + why] || 0) + n;
  return n;
}
const ECO_L = '#4a3528';
const ECO_TICKET = `<svg class="eco-tk" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7 h18 v3 a2 2 0 0 0 0 4 v3 h-18 v-3 a2 2 0 0 0 0 -4z" fill="#f6c445" stroke="${ECO_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M15.5 7.6 v8.8" stroke="${ECO_L}" stroke-width="1.2" stroke-dasharray="1.6 1.4"/><path d="M8.6 9.4 l.95 1.9 2.1 .3 -1.5 1.45 .35 2.1 -1.9 -1 -1.9 1 .35 -2.1 -1.5 -1.45 2.1 -.3z" fill="#fff"/></svg>`;
const ecoTk = n => `<span class="eco-tkn">${ECO_TICKET}${n.toLocaleString('fr-FR')}</span>`;

// ================= 1. ÉVÉNEMENTS DE SAISON =================
const ECO_GLYPH = {
  citrouille: `<ellipse cx="12" cy="14" rx="8.4" ry="6.6" fill="#f2963b" stroke="${ECO_L}" stroke-width="1.5"/><path d="M12 7.6 v12.8 M8 8.6 q-2.4 5.4 0 11 M16 8.6 q2.4 5.4 0 11" fill="none" stroke="#c96a1e" stroke-width="1.2"/><path d="M12 7.8 q0 -3 2.6 -3.8" stroke="#5f8a3a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  flocon: `<g stroke="#4f7fb8" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M12 5.5 l-2 -2 M12 5.5 l2 -2 M12 18.5 l-2 2 M12 18.5 l2 2" stroke-width="1.5"/></g><circle cx="12" cy="12" r="2.4" fill="#f6c445" stroke="${ECO_L}" stroke-width="1"/>`,
  lanterne: `<rect x="10.8" y="2" width="2.4" height="3" rx=".6" fill="${ECO_L}"/><ellipse cx="12" cy="12.4" rx="7.4" ry="7" fill="#e5584f" stroke="${ECO_L}" stroke-width="1.5"/><path d="M8.2 7 q-1.8 5.4 0 10.8 M15.8 7 q1.8 5.4 0 10.8 M12 5.4 v14" stroke="#f6c445" stroke-width="1.1" fill="none"/><path d="M10.4 19.2 h3.2 v2.8 h-3.2z" fill="#f6c445" stroke="${ECO_L}" stroke-width="1"/>`,
  coeur: `<path d="M12 20.4 C5.4 15.4 3.2 12.2 3.2 8.8 C3.2 6.2 5.3 4.3 7.7 4.3 C9.6 4.3 11 5.4 12 6.9 C13 5.4 14.4 4.3 16.3 4.3 C18.7 4.3 20.8 6.2 20.8 8.8 C20.8 12.2 18.6 15.4 12 20.4Z" fill="#f08aa6" stroke="${ECO_L}" stroke-width="1.5"/><ellipse cx="8.2" cy="8.4" rx="1.8" ry="1.1" fill="#fff" opacity=".75"/>`,
  masque: `<path d="M2.8 8.6 q9.2 -4.4 18.4 0 q-.8 6.6 -5.2 6.6 q-2.2 0 -4 -2.2 q-1.8 2.2 -4 2.2 q-4.4 0 -5.2 -6.6z" fill="#9a6fd6" stroke="${ECO_L}" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="8.4" cy="10.2" rx="2" ry="1.3" fill="#fff"/><ellipse cx="15.6" cy="10.2" rx="2" ry="1.3" fill="#fff"/><circle cx="5" cy="18.6" r="1.4" fill="#f6c445"/><circle cx="19" cy="19.2" r="1.3" fill="#58c2b0"/><rect x="10.8" y="17.6" width="2.6" height="2.6" fill="#f08aa6" transform="rotate(20 12 19)"/>`,
  cloche: `<path d="M12 4 c4.2 0 6.2 3.6 6.2 8.2 v2.8 l2.2 2.6 h-16.8 l2.2 -2.6 v-2.8 c0 -4.6 2 -8.2 6.2 -8.2z" fill="#a8703f" stroke="${ECO_L}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="19.8" r="1.9" fill="#f2c14e" stroke="${ECO_L}" stroke-width="1"/><path d="M8.6 10.2 q3.4 -3 6.8 0" stroke="#f6c2cf" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M12 4 c-2 -2.2 -4.4 -1.6 -4.2 .2 M12 4 c2 -2.2 4.4 -1.6 4.2 .2" stroke="#f08aa6" stroke-width="1.6" fill="none"/>`,
  sakura: [0, 72, 144, 216, 288].map(a => `<ellipse cx="12" cy="6.8" rx="3.5" ry="4.7" fill="#f6c2cf" stroke="${ECO_L}" stroke-width="1.1" transform="rotate(${a} 12 12)"/>`).join('') + `<circle cx="12" cy="12" r="2.2" fill="#f2c14e" stroke="${ECO_L}" stroke-width=".8"/>`,
  tulipe: `<path d="M12 21.5 V12" stroke="#5f9a4f" stroke-width="2.2"/><path d="M12 18 q-4.4 -.6 -5.6 -4.4 q4.4 .2 5.6 3.6" fill="#7fae4f" stroke="${ECO_L}" stroke-width="1"/><path d="M6.8 4.6 q.8 9.6 5.2 9.6 q4.4 0 5.2 -9.6 l-2.6 2.6 l-2.6 -3.6 l-2.6 3.6z" fill="#e5584f" stroke="${ECO_L}" stroke-width="1.4" stroke-linejoin="round"/>`,
  coccinelle: `<ellipse cx="12" cy="13.6" rx="7.4" ry="7" fill="#e5584f" stroke="${ECO_L}" stroke-width="1.5"/><path d="M12 6.6 v14" stroke="${ECO_L}" stroke-width="1.2"/><circle cx="12" cy="6.4" r="3.1" fill="${ECO_L}"/><circle cx="8.4" cy="12" r="1.5" fill="${ECO_L}"/><circle cx="15.6" cy="12" r="1.5" fill="${ECO_L}"/><circle cx="8.9" cy="16.6" r="1.3" fill="${ECO_L}"/><circle cx="15.1" cy="16.6" r="1.3" fill="${ECO_L}"/>`,
  soleil: [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="12" cy="5" rx="2.4" ry="3.6" fill="#f6e08a" stroke="${ECO_L}" stroke-width="1" transform="rotate(${a} 12 12)"/>`).join('') + `<circle cx="12" cy="12" r="4.2" fill="#f2963b" stroke="${ECO_L}" stroke-width="1.3"/>`,
  coquillage: `<path d="M12 20 L3.6 9.2 Q12 .8 20.4 9.2Z" fill="#f2c14e" stroke="${ECO_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 20 L7.6 6.6 M12 20 V4.4 M12 20 L16.4 6.6" stroke="#c98f1e" stroke-width="1.2"/><rect x="9.6" y="18.8" width="4.8" height="2.8" rx="1.2" fill="#f2c14e" stroke="${ECO_L}" stroke-width="1.2"/>`,
  etoile: `<path d="M2.6 21 L10.6 13" stroke="#cdb8ee" stroke-width="2.6" stroke-linecap="round"/><path d="M5 22 L10 17" stroke="#f6c2cf" stroke-width="1.6" stroke-linecap="round"/><path d="M15.2 3 l2 4.1 4.5 .65 -3.25 3.15 .77 4.5 -4.02 -2.1 -4.02 2.1 .77 -4.5 -3.25 -3.15 4.5 -.65z" fill="#ffe27a" stroke="${ECO_L}" stroke-width="1.3" stroke-linejoin="round"/>`,
  raisin: `<path d="M12 5 q2 -3 5 -2.6 q-1 3 -5 2.6" fill="#7fae4f" stroke="${ECO_L}" stroke-width="1"/>` + [[9, 8], [15, 8], [12, 8.4], [7.6, 12], [12, 12], [16.4, 12], [9.8, 15.6], [14.2, 15.6], [12, 19]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.7" fill="#8a3a6e" stroke="${ECO_L}" stroke-width="1"/>`).join('') + `<circle cx="8.2" cy="7.2" r=".8" fill="#fff" opacity=".7"/>`,
  lumignon: `<path d="M6.6 9 h10.8 l-1.2 11.6 h-8.4z" fill="#fff3c4" stroke="${ECO_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 4.2 q-2.4 3.2 0 5.6 q2.4 -2.4 0 -5.6z" fill="#f2963b" stroke="${ECO_L}" stroke-width=".9"/><rect x="9.8" y="12" width="4.4" height="6.6" rx=".8" fill="#f6e08a"/><path d="M6.4 9 h11.2" stroke="${ECO_L}" stroke-width="2"/>`,
  lotus: `<path d="M3.6 14.6 q8.4 6.4 16.8 0 q-2 5.6 -8.4 5.6 q-6.4 0 -8.4 -5.6z" fill="#f6c2cf" stroke="${ECO_L}" stroke-width="1.4"/><path d="M6.8 15 q1 -5.4 5.2 -7.4 q4.2 2 5.2 7.4" fill="#f6a6c1" stroke="${ECO_L}" stroke-width="1.3"/><path d="M12 3.4 q-2.2 3 0 4.8 q2.2 -1.8 0 -4.8z" fill="#f2963b" stroke="${ECO_L}" stroke-width=".9"/>`,
  sucre: `<path d="M9 21.4 V9 a4 4 0 0 1 8 0" fill="none" stroke="${ECO_L}" stroke-width="5.2" stroke-linecap="round"/><path d="M9 21.4 V9 a4 4 0 0 1 8 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M9 21.4 V9 a4 4 0 0 1 8 0" fill="none" stroke="#e5584f" stroke-width="3" stroke-dasharray="2 2.2"/>`,
};
const D_ = (y, m, d) => new Date(y, m - 1, d);
const ECO_LNY = { 2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3], 2031: [1, 23], 2032: [2, 11], 2033: [1, 31], 2034: [2, 19], 2035: [2, 8], 2036: [1, 28] };
function ecoEaster(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return D_(y, mo, da); }
const ecoAddD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// items : 0-3 en boutique d'événement, 4-5 exclusifs à la bannière de la machine. Le nom reçoit l'année (« Écharpe d’Halloween 2026 »).
// egg : l'œuf de la variante exclusive (palette enregistrée chez l'espèce, jamais tirée au hasard).
const ECO_EVENTS = [
  { key: 'neiges', name: 'Fête des neiges', color: '#7fa8d6', color2: '#e6f1fb', glyph: 'flocon', res: ['flocon doré', 'flocons dorés'],
    when: y => [D_(y, 1, 6), D_(y, 1, 19)], tags: ['neige', 'montagne', 'sentier', 'belvedere'], places: ['Rovaniemi', 'Reykjavik', 'Chamonix', 'Zermatt', 'Banff', 'Montréal'],
    where: 'la neige, la montagne, la Laponie et le Canada', story: 'Les premières grandes neiges de l’année : on glisse, on souffle sur ses moufles et on ramasse des flocons dorés.',
    items: [['Bonnet des neiges', 'v', 'tete', 2, 'bonnet', '#cfe8f7'], ['Moufles flocon', 'v', 'mains', 2, 'moufles', '#9fb6e8'], ['Igloo miniature', 'd', 'statue', 2, null, '#e8f4fb'], ['Pull jacquard des neiges', 'v', 'haut', 3, 'pull', '#5c8fc4'], ['Cape aurore des neiges', 'v', 'dos', 3, 'cape', '#9fe0d0'], ['Luge dorée des neiges', 'd', 'statue', 3, null, '#f2c14e']],
    egg: { sp: 'renard', pal: 'Flocon', base: '#e6f1fb', accent: '#7fa8d6', belly: '#ffffff', pc: '#bfe0ff', pattern: 'etoiles' } },
  { key: 'lunaire', name: 'Nouvel An lunaire', color: '#d9443a', color2: '#ffe6d6', glyph: 'lanterne', res: ['lanterne rouge', 'lanternes rouges'], prio: 2,
    when: y => { const c = ECO_LNY[y] || [2, 5], s = D_(y, c[0], c[1]); return [ecoAddD(s, -2), ecoAddD(s, 9)]; }, tags: ['monument', 'marche', 'restaurant', 'patrimoine'], places: ['Tokyo', 'Kyoto', 'Bali', 'Sydney'],
    where: 'l’Asie, les villes, les marchés et les restaurants', story: 'Dragons de papier, pétards et raviolis : l’Asie fête la nouvelle lune. Les lanternes rouges portent bonheur toute l’année.',
    items: [['Bonnet du Nouvel An', 'v', 'tete', 2, 'bonnet', '#d9443a'], ['Écharpe porte-bonheur', 'v', 'cou', 2, 'echarpe', '#f2c14e'], ['Lanterne du Nouvel An', 'd', 'lanterne', 2, null, '#e5584f'], ['Veste de soie du Nouvel An', 'v', 'haut', 3, 'sweat', '#c9302c'], ['Cape dragon du Nouvel An', 'v', 'dos', 3, 'cape', '#d9443a'], ['Dragon doré miniature', 'd', 'statue', 3, null, '#f2c14e']],
    egg: { sp: 'panda', pal: 'Lanterne', base: '#ef7a5f', accent: '#8a2a22', belly: '#fff1d6', pc: '#f6c445', pattern: 'masque' } },
  { key: 'valentin', name: 'Saint-Valentin', color: '#e86a9a', color2: '#ffe6ef', glyph: 'coeur', res: ['cœur en sucre', 'cœurs en sucre'],
    when: y => [D_(y, 2, 8), D_(y, 2, 15)], tags: ['fleuriste', 'chocolaterie', 'cafe', 'parc'], places: ['Paris', 'Venise', 'Vienne'],
    where: 'les fleuristes, les chocolateries, les cafés et Paris', story: 'Des cœurs partout ! Les fleuristes débordent de roses et les chocolatiers de bonbons en forme de cœur.',
    items: [['Nœud de la Saint-Valentin', 'v', 'cou', 2, 'noeud', '#f08aa6'], ['Chaussettes de la Saint-Valentin', 'v', 'pieds', 2, 'chaussettes', '#f4b7c4'], ['Bouquet de la Saint-Valentin', 'd', 'plante', 2, null, '#e5587f'], ['Couronne de roses de la Saint-Valentin', 'v', 'tete', 3, 'fleurs', '#e5587f'], ['Cape cœur de la Saint-Valentin', 'v', 'dos', 3, 'cape', '#f6a6c1'], ['Boîte à musique de la Saint-Valentin', 'd', 'statue', 3, null, '#f6c2cf']],
    egg: { sp: 'axo', pal: 'Guimauve', base: '#ffd1e3', accent: '#e86a9a', belly: '#fff5f9', pc: '#ffffff', pattern: 'coeurs' } },
  { key: 'carnaval', name: 'Carnaval', color: '#9a6fd6', color2: '#efe6fd', glyph: 'masque', res: ['confetti', 'confettis'],
    when: y => [D_(y, 2, 20), D_(y, 3, 3)], tags: ['monument', 'rue', 'mer', 'port'], places: ['Venise', 'Rio de Janeiro', 'Nice'],
    where: 'Venise, Rio, Nice et les rues en fête', story: 'Masques de Venise, chars de Nice et samba de Rio : le monde entier se déguise et lance des confettis.',
    items: [['Chapeau de carnaval', 'v', 'tete', 2, 'chapeau', '#9a6fd6'], ['Foulard à paillettes du carnaval', 'v', 'cou', 2, 'foulard', '#f6c445'], ['Lampion du carnaval', 'd', 'lanterne', 2, null, '#f08aa6'], ['Cape de bal du carnaval', 'v', 'dos', 3, 'cape', '#3b2a6e'], ['Couronne de plumes du carnaval', 'v', 'tete', 3, 'couronne', '#58c2b0'], ['Gondole du carnaval', 'd', 'statue', 3, null, '#2f3b5c']],
    egg: { sp: 'lemur', pal: 'Arlequin', base: '#c9a7ee', accent: '#5a3a8a', belly: '#fff3c4', pc: '#f6c445', pattern: 'masque' } },
  { key: 'paques', name: 'Pâques', color: '#8fbf6a', color2: '#eef8e4', glyph: 'cloche', res: ['cloche en chocolat', 'cloches en chocolat'], prio: 2,
    when: y => { const e = ecoEaster(y); return [ecoAddD(e, -6), ecoAddD(e, 6)]; }, tags: ['campagne', 'jardin', 'parc', 'ferme', 'chocolaterie'], places: ['Valensole', 'Toscane', 'Carnac'],
    where: 'la campagne, les jardins, les fermes et les chocolateries', story: 'Les cloches reviennent de Rome et sèment des chocolats dans les jardins. Ouvrez l’œil sous les buissons !',
    items: [['Chapeau de printemps de Pâques', 'v', 'tete', 2, 'chapeau', '#f6e08a'], ['Gilet pastel de Pâques', 'v', 'haut', 2, 'pull', '#c6e6a4'], ['Panier de Pâques', 'd', 'bocal', 2, null, '#f4b7c4'], ['Cape fleurie de Pâques', 'v', 'dos', 3, 'cape', '#b8d8f0'], ['Couronne de Pâques', 'v', 'tete', 3, 'fleurs', '#f6c2cf'], ['Cloche dorée de Pâques', 'd', 'statue', 3, null, '#f2c14e']],
    egg: { sp: 'quokka', pal: 'Praliné', base: '#cf9363', accent: '#6b4226', belly: '#f6e3c4', pc: '#f4b7c4', pattern: 'pattes' } },
  { key: 'hanami', name: 'Cerisiers en fleurs', color: '#e48aa6', color2: '#fde9ef', glyph: 'sakura', res: ['pétale de cerisier', 'pétales de cerisier'],
    when: y => [D_(y, 3, 27), D_(y, 4, 9)], tags: ['parc', 'jardin', 'foret', 'monument', 'patrimoine'], places: ['Kyoto', 'Tokyo'],
    where: 'le Japon, les parcs et les jardins', story: 'Au Japon, on pique-nique sous les cerisiers en fleurs. Les pétales roses volent jusque dans les parcs du monde entier.',
    items: [['Couronne de cerisier', 'v', 'tete', 2, 'fleurs', '#f6c2cf'], ['Bonsaï de cerisier', 'd', 'plante', 2, null, '#f6a6c1'], ['Haori des cerisiers', 'v', 'haut', 3, 'sweat', '#f4b7c4'], ['Lanterne de pierre des cerisiers', 'd', 'lanterne', 3, null, '#e9e2d6'], ['Écharpe pétales des cerisiers', 'v', 'cou', 3, 'echarpe', '#ffd6e2'], ['Pagode miniature des cerisiers', 'd', 'statue', 3, null, '#d9604f']],
    egg: { sp: 'tanuki', pal: 'Sakura', base: '#f8d3dd', accent: '#b46a82', belly: '#fff6f8', pc: '#ffffff', pattern: 'taches' } },
  { key: 'tulipes', name: 'Tulipes de Hollande', color: '#e5584f', color2: '#ffe8e2', glyph: 'tulipe', res: ['bulbe de tulipe', 'bulbes de tulipe'],
    when: y => [D_(y, 4, 22), D_(y, 5, 3)], tags: ['fleuriste', 'campagne', 'jardin', 'marche'], places: ['Amsterdam', 'Valensole'],
    where: 'les Pays-Bas, les fleuristes et les champs', story: 'Les champs de Hollande se couvrent de rayures rouges, jaunes et roses. Un bulbe par-ci, un bulbe par-là…',
    items: [['Chapeau de paille aux tulipes', 'v', 'tete', 2, 'chapeau', '#f6d36b'], ['Chaussettes tulipes de Hollande', 'v', 'pieds', 2, 'chaussettes', '#e5584f'], ['Moulin à vent miniature', 'd', 'statue', 2, null, '#e9dcc0'], ['Salopette des champs de tulipes', 'v', 'bas', 3, 'short', '#7f9fc4'], ['Cape des champs de tulipes', 'v', 'dos', 3, 'cape', '#e5584f'], ['Bouquet arc-en-ciel de tulipes', 'd', 'plante', 3, null, '#f39ab0']],
    egg: { sp: 'capy', pal: 'Tulipe', base: '#f6a68a', accent: '#c9453c', belly: '#fff3e6', pc: '#f6e08a', pattern: 'rayures' } },
  { key: 'nature', name: 'Fête de la nature', color: '#5fa274', color2: '#e6f4e8', glyph: 'coccinelle', res: ['coccinelle', 'coccinelles'],
    when: y => [D_(y, 5, 15), D_(y, 5, 28)], tags: ['foret', 'parc', 'sentier', 'campagne', 'etang', 'riviere', 'jardin'], places: ['Brocéliande', 'Vercors', 'Banff', 'Bali'],
    where: 'les forêts, les parcs, les sentiers et les rivières', story: 'Tout pousse et tout bourdonne. Les coccinelles se posent sur le nez des compagnons qui explorent la nature.',
    items: [['Bob d’explorateur de la nature', 'v', 'tete', 2, 'chapeau', '#7fae4f'], ['Sac à dos de la nature', 'v', 'dos', 2, 'sac', '#a9dcc8'], ['Terrarium de la nature', 'd', 'bocal', 2, null, '#9fd3ae'], ['Bottes de jardin de la nature', 'v', 'pieds', 3, 'bottes', '#5f9a6a'], ['Cape de mousse de la nature', 'v', 'dos', 3, 'cape', '#5f8a5a'], ['Herbier de la fête de la nature', 'd', 'herbier', 3, null, '#8fbf6a']],
    egg: { sp: 'paresseux', pal: 'Mousse', base: '#a8c98a', accent: '#4f7a42', belly: '#eef6dc', pc: '#f6e08a', pattern: 'taches' } },
  { key: 'solstice', name: 'Solstice d’été', color: '#e9a03a', color2: '#fff3d4', glyph: 'soleil', res: ['fleur de la Saint-Jean', 'fleurs de la Saint-Jean'],
    when: y => [D_(y, 6, 18), D_(y, 7, 1)], tags: ['campagne', 'parc', 'lac', 'mer'], places: ['Geiranger', 'Reykjavik', 'Rovaniemi', 'Paris'],
    where: 'la Scandinavie, la campagne et les fêtes de la musique', story: 'Le jour le plus long : en Scandinavie le soleil ne se couche presque pas, et partout on fait de la musique dans les rues.',
    items: [['Couronne du solstice', 'v', 'tete', 2, 'fleurs', '#f6e08a'], ['T-shirt de la fête de la musique', 'v', 'haut', 2, 'tshirt', '#f6a68a'], ['Lanterne du solstice', 'd', 'lanterne', 2, null, '#f6c445'], ['Cape soleil de minuit', 'v', 'dos', 3, 'cape', '#f2963b'], ['Nœud papillon du solstice', 'v', 'cou', 3, 'noeud', '#f6c445'], ['Feu de joie du solstice', 'd', 'cheminee', 3, null, '#f2884a']],
    egg: { sp: 'fennec', pal: 'Soleil de minuit', base: '#f8d38a', accent: '#e0884a', belly: '#fff7e2', pc: '#fff3b0', pattern: 'degrade' } },
  { key: 'plage', name: 'Grand été à la plage', color: '#3f8fb8', color2: '#e2f3fb', glyph: 'coquillage', res: ['coquillage doré', 'coquillages dorés'],
    when: y => [D_(y, 7, 14), D_(y, 7, 27)], tags: ['mer', 'ile', 'plage', 'port', 'glacier', 'piscine'], places: ['Santorin', 'Bali', 'Rio de Janeiro', 'Sydney', 'Calanques', 'Bonifacio'],
    where: 'la mer, les îles, les plages et les ports', story: 'Serviette, crème solaire et châteaux de sable : les vacances ! Les coquillages dorés brillent au bord de l’eau.',
    items: [['Chapeau de paille de l’été', 'v', 'tete', 2, 'chapeau', '#f6e08a'], ['Short de bain de l’été', 'v', 'bas', 2, 'short', '#58c2b0'], ['Château de sable de l’été', 'd', 'statue', 2, null, '#f2deb0'], ['Chemise hawaïenne de l’été', 'v', 'haut', 3, 'tshirt', '#f39ab0'], ['Collier de coquillages dorés de l’été', 'v', 'cou', 3, 'foulard', '#f2c14e'], ['Bouée licorne de l’été', 'd', 'statue', 3, null, '#f6c2cf']],
    egg: { sp: 'phoque', pal: 'Lagon', base: '#a8e0e8', accent: '#3f8fa8', belly: '#f2fcff', pc: '#fff3b0', pattern: 'rayures' } },
  { key: 'perseides', name: 'Nuits des étoiles filantes', color: '#4a4f8f', color2: '#e6e8fa', glyph: 'etoile', res: ['éclat de Perséide', 'éclats de Perséide'],
    when: y => [D_(y, 8, 7), D_(y, 8, 16)], tags: ['belvedere', 'montagne', 'campagne', 'desert', 'sentier', 'camping'], places: ['Merzouga', 'Grand Canyon', 'Patagonie', 'Zermatt'],
    where: 'les points de vue, la montagne, le désert et la campagne', story: 'Mi-août, le ciel pleut des étoiles filantes : les Perséides. Les compagnons veillent tard pour en attraper un éclat.',
    items: [['Bonnet des étoiles filantes', 'v', 'tete', 2, 'bonnet', '#3b4a7a'], ['Écharpe des étoiles filantes', 'v', 'cou', 2, 'echarpe', '#7377be'], ['Télescope des étoiles filantes', 'd', 'statue', 2, null, '#c9a35a'], ['Cape de la voie lactée', 'v', 'dos', 3, 'cape', '#2e2a4f'], ['Couronne d’étoiles filantes', 'v', 'tete', 3, 'couronne', '#ffe27a'], ['Lampe constellation', 'd', 'lampe', 3, null, '#ffe27a']],
    egg: { sp: 'panda', pal: 'Nébuleuse', base: '#8f86d6', accent: '#3d3a7a', belly: '#e9e4ff', pc: '#ffe27a', pattern: 'etoiles' } },
  { key: 'vendanges', name: 'Vendanges', color: '#8a3a6e', color2: '#f6e4ee', glyph: 'raisin', res: ['grappe de raisin', 'grappes de raisin'],
    when: y => [D_(y, 9, 17), D_(y, 9, 30)], tags: ['campagne', 'ferme', 'caviste', 'marche'], places: ['Bordeaux', 'Toscane', 'Beaufortain'],
    where: 'Bordeaux, la Toscane, les fermes et les cavistes', story: 'Sécateurs et paniers : c’est l’heure de cueillir le raisin. On en garde toujours une grappe pour la route.',
    items: [['Béret des vendanges', 'v', 'tete', 2, 'beret', '#8a3a6e'], ['Panier des vendanges', 'v', 'dos', 2, 'sac', '#c99a5a'], ['Tonneau miniature des vendanges', 'd', 'statue', 2, null, '#a87a50'], ['Gilet de vigneron des vendanges', 'v', 'haut', 3, 'pull', '#6b2a4e'], ['Foulard pampre des vendanges', 'v', 'cou', 3, 'foulard', '#7fae4f'], ['Pressoir doré des vendanges', 'd', 'statue', 3, null, '#f2c14e']],
    egg: { sp: 'renard', pal: 'Raisin', base: '#b48ab8', accent: '#5e2a5a', belly: '#f6e6f4', pc: '#a6d88f', pattern: 'taches' } },
  { key: 'halloween', name: 'Halloween', color: '#e98a2e', color2: '#fff0dc', glyph: 'citrouille', res: ['citrouille', 'citrouilles'],
    when: y => [D_(y, 10, 18), D_(y, 10, 31)], tags: ['foret', 'campagne', 'parc', 'ferme', 'jardin', 'patrimoine', 'monument'], places: ['Édimbourg', 'Prague', 'Brocéliande', 'New York', 'Highlands'],
    where: 'les forêts, la campagne, les vieux châteaux et Édimbourg', story: 'Les citrouilles sourient aux fenêtres et les forêts chuchotent. Les compagnons ramassent des citrouilles à chaque voyage.',
    items: [['Écharpe d’Halloween', 'v', 'cou', 2, 'echarpe', '#f2963b'], ['Citrouille-lanterne d’Halloween', 'd', 'lanterne', 2, null, '#f2963b'], ['Chapeau de sorcière d’Halloween', 'v', 'tete', 3, 'chapeau', '#5b3a6e'], ['Cape de vampire d’Halloween', 'v', 'dos', 3, 'cape', '#3a2a4a'], ['Sweat fantôme d’Halloween', 'v', 'haut', 3, 'sweat', '#f4f1ea'], ['Chaudron magique d’Halloween', 'd', 'statue', 3, null, '#5b3a6e']],
    egg: { sp: 'tanuki', pal: 'Citrouille', base: '#f6a24b', accent: '#5b3a6e', belly: '#fff1d6', pc: '#3a2a4a', pattern: 'masque' } },
  { key: 'lanternes', name: 'Fête des lanternes', color: '#d99a25', color2: '#fff4d6', glyph: 'lotus', res: ['lanterne flottante', 'lanternes flottantes'],
    when: y => [D_(y, 11, 1), D_(y, 11, 14)], tags: ['riviere', 'etang', 'lac', 'mer', 'port', 'phare'], places: ['Bali', 'Kyoto', 'Istanbul'],
    where: 'les rivières, les lacs et l’Asie', story: 'Diwali en Inde (le 8 novembre), Loy Krathong en Thaïlande : des milliers de petites lumières flottent sur l’eau.',
    items: [['Couronne de lumières', 'v', 'tete', 2, 'fleurs', '#f6d36b'], ['Écharpe safran', 'v', 'cou', 2, 'echarpe', '#e3a94a'], ['Lanterne flottante', 'd', 'lanterne', 2, null, '#f6c445'], ['Cape de soie dorée', 'v', 'dos', 3, 'cape', '#d99a25'], ['Bottes de lotus', 'v', 'pieds', 3, 'bottes', '#f6c2cf'], ['Lampe aux mille lumières', 'd', 'lampe', 3, null, '#f6e08a']],
    egg: { sp: 'axo', pal: 'Lotus', base: '#ffe0a8', accent: '#e08a3a', belly: '#fff8ea', pc: '#f6a6c1', pattern: 'degrade' } },
  { key: 'lumieres', name: 'Fête des Lumières', color: '#3b4a7a', color2: '#e8ecfa', glyph: 'lumignon', res: ['lumignon', 'lumignons'],
    when: y => [D_(y, 12, 3), D_(y, 12, 10)], tags: ['monument', 'patrimoine', 'rue', 'musee'], places: ['Lyon', 'Strasbourg', 'Vienne', 'Prague'],
    where: 'Lyon, les villes illuminées et les monuments', story: 'À Lyon, chaque fenêtre a son lumignon et les façades s’illuminent. Les compagnons en rapportent de chaque balade en ville.',
    items: [['Bonnet lumignon', 'v', 'tete', 2, 'bonnet', '#f6c445'], ['Écharpe des Lumières', 'v', 'cou', 2, 'echarpe', '#3b4a7a'], ['Lumignon de fenêtre', 'd', 'lanterne', 2, null, '#f6e08a'], ['Manteau des Lumières', 'v', 'haut', 3, 'sweat', '#2f3b5c'], ['Cape illuminée', 'v', 'dos', 3, 'cape', '#f2c14e'], ['Basilique lumineuse miniature', 'd', 'statue', 3, null, '#e9e2d6']],
    egg: { sp: 'lemur', pal: 'Lumignon', base: '#f6e3a8', accent: '#5c6b94', belly: '#fffbea', pc: '#f2c14e', pattern: 'etoiles' } },
  { key: 'noel', name: 'Noël', color: '#c94a4a', color2: '#fde6e2', glyph: 'sucre', res: ['sucre d’orge', 'sucres d’orge'],
    when: y => [D_(y, 12, 14), D_(y, 12, 27)], tags: ['neige', 'montagne', 'marche', 'chocolaterie', 'boulangerie', 'foret'], places: ['Strasbourg', 'Rovaniemi', 'Vienne', 'Prague', 'Montréal'],
    where: 'les marchés de Noël, la neige et la Laponie', story: 'Vin chaud pour les grands, chocolat pour les petits, et des sucres d’orge accrochés au sapin. Joyeux Noël !',
    items: [['Bonnet de Noël', 'v', 'tete', 2, 'bonnet', '#c94a4a'], ['Pull moche de Noël', 'v', 'haut', 2, 'pull', '#3f8a5a'], ['Sapin de Noël miniature', 'd', 'plante', 2, null, '#3f8a5a'], ['Cape de Noël', 'v', 'dos', 3, 'cape', '#c94a4a'], ['Moufles de Noël', 'v', 'mains', 3, 'moufles', '#f4f1ea'], ['Boule à neige de Noël', 'd', 'statue', 3, null, '#cfe8f7']],
    egg: { sp: 'phoque', pal: 'Sucre d’orge', base: '#fbe3e3', accent: '#c94a4a', belly: '#ffffff', pc: '#e5584f', pattern: 'rayures' } },
];
const ECO_EV = Object.fromEntries(ECO_EVENTS.map(E => [E.key, E]));
const ecoIconSVG = (E, cls = '') => `<svg class="eco-gl ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ECO_GLYPH[E.glyph] || ECO_GLYPH.etoile}</svg>`;
const ecoResName = (E, n) => n > 1 ? E.res[1] : E.res[0];
// calendrier d'une année : un seul événement à la fois (Pâques et le Nouvel An lunaire, mobiles, passent d'abord ; les autres se décalent)
const _ecoYears = {};
function ecoYear(y) {
  if (_ecoYears[y]) return _ecoYears[y];
  const list = ECO_EVENTS.map(E => { const [a, b] = E.when(y); return { E, y, s: a.getTime(), e: new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59, 999).getTime() }; });
  list.sort((a, b) => (b.E.prio || 0) - (a.E.prio || 0) || a.s - b.s);
  const placed = [];
  for (const o of list) {
    const len = o.e - o.s, s0 = o.s;
    for (let g = 0; g < 6; g++) { const hit = placed.find(p => o.s <= p.e && o.e >= p.s); if (!hit) break; const d = new Date(hit.e + 1); o.s = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(); o.e = o.s + len; }
    if (placed.some(p => o.s <= p.e && o.e >= p.s) || o.s - s0 > 21 * 864e5) continue;
    o.id = `${o.E.key}-${y}`; o.label = `${o.E.name} ${y}`;
    placed.push(o);
  }
  placed.sort((a, b) => a.s - b.s);
  return (_ecoYears[y] = placed);
}
function ecoActive(now = Date.now()) { const y = new Date(now).getFullYear(); for (const yy of [y, y - 1]) { const o = ecoYear(yy).find(x => now >= x.s && now <= x.e); if (o) return o; } return null; }
function ecoNext(now = Date.now()) { const y = new Date(now).getFullYear(); for (const yy of [y, y + 1]) { const o = ecoYear(yy).find(x => x.s > now); if (o) return o; } return null; }
function ecoOcc(id) { const m = /^(.*)-(\d{4})$/.exec(id || ''); if (!m) return null; return ecoYear(+m[2]).find(x => x.id === id) || null; }
// événements passés (pour le marché des collectionneurs)
function ecoPast(now = Date.now(), days = 400) { const y = new Date(now).getFullYear(); return [...ecoYear(y - 1), ...ecoYear(y)].filter(o => o.e < now && now - o.e < days * 864e5); }
function ecoEvState(occ) { const E = ecoState(); const k = occ.id; if (!E.evs[k] || typeof E.evs[k] !== 'object') E.evs[k] = { res: 0, got: 0, bought: {}, conv: 0 }; const v = E.evs[k]; if (!v.bought || typeof v.bought !== 'object') v.bought = {}; return v; }
// « bonus du jour » : pendant un événement, c'est lui (une seule notion d'événement) ; sinon, la rotation de 12_jeu.js
function ecoDailyFace() {
  const occ = ecoActive(); if (!occ) return null;
  const E = occ.E;
  // le butin n'est doublé que dans les deux paysages phares (comme un bonus du jour ordinaire) ; la ressource, elle, vient de partout
  return { key: 'saison-' + E.key, name: E.name, short: `${ecoCap(E.res[1])} en voyage · butin ×2 : ${E.tags.slice(0, 2).map(t => (typeof POI_CATS !== 'undefined' && POI_CATS[t] ? POI_CATS[t][0] : TAGL[t] || t).toLowerCase()).join(', ')}`, desc: E.story, tags: E.tags.slice(0, 2), color: E.color, season: occ };
}
// ressource gagnée au retour d'un voyage
const ECO_DUR_RES = { eclair: 1, court: 2, moyen: 3, long: 5, expe: 8 };
function ecoNearPlace(occ, dest) {
  if (!dest) return null;
  for (const n of occ.E.places) { const p = PLACES.find(x => x.name === n); if (!p) continue; if (dest.name === n || (typeof kmBetween === 'function' && kmBetween(p, dest) < 250)) return p; }
  return null;
}
// le haut lieu de l'événement le plus proche de la maison (bouton « J'y vais »)
function ecoNearestPlace(occ) { const h = homeObj(); return occ.E.places.map(n => PLACES.find(p => p.name === n)).filter(p => p && p.name !== S.home).sort((a, b) => kmBetween(h, a) - kmBetween(h, b))[0] || null; }
function ecoResFor(t, occ) {
  if (!t || !t.dest) return { n: 0 };
  const base = ECO_DUR_RES[t.dur] || 1, tags = t.dest.tags || [];
  const inTag = tags.some(x => occ.E.tags.includes(x)), near = ecoNearPlace(occ, t.dest);
  const f = near ? 3 : inTag ? 2 : 1;
  return { n: base * f + (t.dayBonus ? 2 : 0), f, near, inTag };
}

// ---------------- objets datés ----------------
function ecoDated(def, label, from, end, extra = {}) {
  const it = makeItem(def, 0, from, [], { fixed: def[3] });
  it.edition = extra.edition || `Édition limitée · ${label}`;
  it.dated = { label, end: end || 0, id: extra.id || '' };
  if (extra.cap) it.cap = 1;
  if (extra.paid) it.paid = extra.paid;
  return it;
}
const ecoGone = it => !!(it && it.dated && it.dated.end && Date.now() > it.dated.end);
function ecoEvItem(occ, i, from, extra = {}) {
  const d = occ.E.items[i]; const def = [`${d[0]} ${occ.y}`, d[1], d[2], d[3], d[4], d[5]];
  return ecoDated(def, occ.label, from, occ.e, Object.assign({ id: occ.id }, extra));
}
// palettes exclusives : enregistrées chez leur espèce (pour le dessin et le Compédium), jamais tirées au hasard
const ECO_EXCL = new Set();
function ecoRegPal(sp, id, name, r, base, accent, belly, pc, extra = {}) {
  try {
    const S0 = SPECIES[sp]; if (!S0 || S0.palettes.some(p => p.id === id)) return;
    S0.palettes.push(PAL(id, name, r, base, accent, belly, Object.assign({ pc, excl: 1 }, extra)));
    ECO_EXCL.add(id);
  } catch (e) { console.error('eco pal', e); }
}
for (const E of ECO_EVENTS) { const g = E.egg; ecoRegPal(g.sp, 'ev_' + E.key, g.pal, 4, g.base, g.accent, g.belly, g.pc); }
for (const sp of Object.keys(typeof SPECIES !== 'undefined' ? SPECIES : {})) {
  ecoRegPal(sp, 'capsule', 'Capsule', 3, '#cdeaf2', '#7c8fd0', '#fff8fb', '#f6a6c1', { grad: ['#f6d2e6', '#cde4fb', '#d8f2e0'] });
  ecoRegPal(sp, 'capsule_or', 'Capsule dorée', 4, '#f6dc8a', '#b98328', '#fff8de', '#ffffff', { grad: ['#fff1b8', '#f6cf6a', '#f2b45a'], x: { line: '#7e5222' }, fx: 'glint' });
}
const ecoPalGenes = (sp, palId, pattern, special, eye) => { const p = (SPECIES[sp] || SPECIES.panda).palettes.find(x => x.id === palId) || SPECIES[sp].palettes[0]; return { pal: p.id, base: p.base, accent: p.accent, belly: p.belly, pattern: pattern || 'uni', patCol: p.pc || '#ffffff', eye: eye || 'def', special: special || 'none' }; };
if (typeof randomGenes === 'function') randomGenes = (orig => function (sp) {
  let g = null;
  for (let i = 0; i < 12; i++) { g = orig.apply(this, arguments); if (!g || !ECO_EXCL.has(g.pal)) return g; }
  const d = (SPECIES[sp] || SPECIES.panda).defGenes; return Object.assign(g, { pal: d.pal, base: d.base, accent: d.accent, belly: d.belly });
})(randomGenes);
if (typeof mixGenes === 'function') mixGenes = (orig => function (gA, gB) {
  const r = orig.apply(this, arguments);
  try { const g = r && r.genes; if (g && ECO_EXCL.has(g.pal) && !(gA && gA.pal === g.pal) && !(gB && gB.pal === g.pal)) { const d = SPECIES[r.sp].defGenes; Object.assign(g, { pal: d.pal, base: d.base, accent: d.accent, belly: d.belly }); } } catch (e) {}
  return r;
})(mixGenes);
function ecoEgg(sp, genes, rarity, from, hatchMs) {
  if (typeof addEgg !== 'function') return null;
  const id = addEgg({ sp, genes, rarity, from, hatchMs: hatchMs || 10 * 60e3 });
  const e = (S.eggs || []).find(x => x.id === id); if (e) e.known = true;
  return e;
}
const ecoEvEggGenes = (E, shiny) => ecoPalGenes(E.egg.sp, 'ev_' + E.key, E.egg.pattern, shiny ? 'brillant' : 'none', shiny ? 'or' : 'def');
if (typeof COMP_FROM !== 'undefined') Object.assign(COMP_FROM, { evenement: 'Œuf d’événement', machine: 'Sorti de la machine à souvenirs', cadeau: 'Cadeau', tournoi: 'Gagné au tournoi' });

// ---------------- boutique d'événement ----------------
const ECO_PRICE = { 2: 45, 3: 100 };
function ecoShop(occ) {
  const E = occ.E, out = [];
  [0, 1, 2, 3].forEach(i => { const d = E.items[i]; out.push({ id: 'i' + i, kind: 'item', i, price: ECO_PRICE[d[3]] || 60, lim: 1, name: `${d[0]} ${occ.y}`, def: d }); });
  out.push({ id: 'egg', kind: 'egg', price: 200, lim: 1, name: `Œuf ${E.egg.pal.toLowerCase().startsWith('sucre') ? 'sucre d’orge' : E.egg.pal.toLowerCase()} ${occ.y}` });
  out.push({ id: 'tk', kind: 'ticket', price: 30, lim: 3, name: 'Ticket de la machine à souvenirs' });
  return out;
}
function ecoBuyEv(id) {
  const occ = ecoActive(); if (!occ || !ecoOn()) return false;
  const v = ecoEvState(occ), a = ecoShop(occ).find(x => x.id === id); if (!a) return false;
  if ((v.bought[id] || 0) >= a.lim) { toast('Déjà acheté !'); return false; }
  if (v.res < a.price) { toast(`Il manque ${ecoPl(a.price - v.res, ecoResName(occ.E, 1), occ.E.res[1])}. Partez en voyage !`); return false; }
  v.res -= a.price; v.bought[id] = (v.bought[id] || 0) + 1;
  let msg;
  if (a.kind === 'item') { const it = ecoEvItem(occ, a.i, `Boutique · ${occ.label}`); S.inv.push(it); S.dex[it.name] = true; msg = `« ${it.name} » rejoint le sac !`; }
  else if (a.kind === 'egg') { ecoEgg(occ.E.egg.sp, ecoEvEggGenes(occ.E, false), 3, { how: 'evenement', place: occ.label }); msg = `${a.name} : il éclora au refuge dans 10 minutes !`; }
  else { ecoAddTickets(1, 'event'); msg = '+1 ticket pour la machine à souvenirs !'; }
  save(); renderTop(); if (tab === 'menu') renderPanel(); toast(msg);
  return true;
}
// fin d'un événement : la ressource restante devient une petite compensation (à récupérer au menu)
const ECO_CONV = 2;
function ecoCheckEnds() {
  const E = ecoState(), now = Date.now(); let ch = false;
  for (const [id, v] of Object.entries(E.evs)) {
    if (!v || v.conv) continue;
    const o = ecoOcc(id); if (!o || o.e >= now) continue;
    v.conv = 1; ch = true;
    if (v.res > 0) E.pend.push({ id: 'conv:' + id, kind: 'conv', ev: id, n: v.res, coins: v.res * ECO_CONV, label: o.label });
    v.res = 0;
  }
  if (ch) save();
}

// ================= 2. CADEAUX =================
const ECO_MONTH_GIFT = [['Bonnet de janvier', 'v', 'tete', 3, 'bonnet', '#9fb6e8'], ['Écharpe de février', 'v', 'cou', 3, 'echarpe', '#f4b7c4'], ['Chapeau de mars', 'v', 'tete', 3, 'chapeau', '#c6e6a4'], ['Cape d’avril', 'v', 'dos', 3, 'cape', '#b8d8f0'], ['Couronne de mai', 'v', 'tete', 3, 'fleurs', '#f6e08a'], ['T-shirt de juin', 'v', 'haut', 3, 'tshirt', '#f6a68a'], ['Short de juillet', 'v', 'bas', 3, 'short', '#58c2b0'], ['Chaussettes d’août', 'v', 'pieds', 3, 'chaussettes', '#f6d36b'], ['Sac à dos de septembre', 'v', 'dos', 3, 'sac', '#c9734a'], ['Pull d’octobre', 'v', 'haut', 3, 'pull', '#d9893e'], ['Moufles de novembre', 'v', 'mains', 3, 'moufles', '#a87a50'], ['Bottes de décembre', 'v', 'pieds', 3, 'bottes', '#c94a4a']];
const ecoMonthKey = (d = new Date()) => d.getFullYear() * 100 + d.getMonth() + 1;
function ecoMonthDef(d = new Date()) { const g = ECO_MONTH_GIFT[d.getMonth()]; return [`${g[0]} ${d.getFullYear()}`, g[1], g[2], g[3], g[4], g[5]]; }
// 7ᵉ jour de la série : l'objet daté du mois (un seul par mois ; sinon 3 tickets)
function ecoMonthGift() {
  const E = ecoState(), mk = ecoMonthKey(), d = new Date();
  if (E.gifts.month[mk]) { ecoAddTickets(3, 'login'); return null; }
  E.gifts.month[mk] = 1;
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1;
  const it = ecoDated(ecoMonthDef(d), `${ECO_MOIS[d.getMonth()]} ${d.getFullYear()}`, 'Cadeau de fidélité', end, { edition: `Cadeau de fidélité · ${ECO_MOIS[d.getMonth()]} ${d.getFullYear()}` });
  S.inv.push(it); S.dex[it.name] = true; S.stats.maxRar = Math.max(S.stats.maxRar || 0, it.rarity);
  return it;
}
// anniversaires : jour et mois de naissance, à partir de l'année suivante
function ecoBirthdays(now = new Date()) {
  const E = ecoState(), out = [];
  for (const [k, c] of Object.entries(S.comps || {})) {
    if (!c || !c.born || !CHARS[k]) continue;
    const b = new Date(c.born); if (now.getFullYear() <= b.getFullYear()) continue;
    let bm = b.getMonth(), bd = b.getDate();
    if (bm === 1 && bd === 29 && new Date(now.getFullYear(), 1, 29).getMonth() !== 1) bd = 28;
    if (now.getMonth() !== bm || now.getDate() !== bd) continue;
    const key = `${k}:${now.getFullYear()}`; if (E.gifts.bday[key]) continue;
    out.push({ k, key, age: now.getFullYear() - b.getFullYear() });
  }
  return out;
}
const ECO_WELCOME = ['Foulard du voyageur débutant', 'v', 'cou', 2, 'foulard', '#f6c445'];
function ecoPending() {
  if (!ecoOn()) return [];
  const E = ecoState(), out = [];
  if (!E.gifts.welcome) out.push({ kind: 'eco', id: 'welcome', t: 'Cadeau de bienvenue', s: '3 tickets + un foulard daté, rien que pour vous', ic: GIFT('#f6c445') });
  for (const b of ecoBirthdays()) out.push({ kind: 'eco', id: 'bday:' + b.key, t: `Joyeux anniversaire, ${CHARS[b.k].name} !`, s: `${b.age} an${b.age > 1 ? 's' : ''} aujourd’hui · 2 tickets + un chapeau de fête daté`, ic: `<img src="${portraitURI(b.k, 'rire')}" alt="">` });
  for (const p of E.pend) {
    if (p.kind === 'conv') { const o = ecoOcc(p.ev); out.push({ kind: 'eco', id: p.id, t: `Fin de l’événement ${p.label}`, s: `${ecoPl(p.n, o ? o.E.res[0] : 'ressource', o ? o.E.res[1] : 'ressources')} → ${p.coins} pièces`, ic: o ? ecoIconSVG(o.E) : COIN }); }
    if (p.kind === 'tour') out.push({ kind: 'eco', id: p.id, t: `Tournoi « ${p.theme} » : ${p.rank}${p.rank === 1 ? 'er' : 'e'} sur 16`, s: ecoTourPrizeText(p.rank), ic: TROPHY(p.rank === 1 ? '#f2c14e' : p.rank === 2 ? '#c9d2d8' : p.rank === 3 ? '#d9905a' : '#e7dcc4') });
  }
  return out;
}
function ecoClaim(id, quiet) {
  const E = ecoState(); let msg = '';
  if (id === 'welcome') {
    if (E.gifts.welcome) return '';
    E.gifts.welcome = Date.now(); ecoAddTickets(3, 'gift');
    const d = new Date(), it = ecoDated(ECO_WELCOME, `${ECO_MOIS[d.getMonth()]} ${d.getFullYear()}`, 'Cadeau de bienvenue', 0, { edition: `Cadeau de bienvenue · ${ECO_MOIS[d.getMonth()]} ${d.getFullYear()}` });
    it.dated.end = Date.now(); // unique : on ne le reçoit qu'une fois
    S.inv.push(it); S.dex[it.name] = true;
    msg = `Bienvenue ! +3 tickets et « ${it.name} ».`;
  } else if (id.startsWith('bday:')) {
    const key = id.slice(5), b = ecoBirthdays().find(x => x.key === key); if (!b) return '';
    E.gifts.bday[key] = Date.now(); ecoAddTickets(2, 'gift');
    const y = new Date().getFullYear(), nm = CHARS[b.k].name;
    const it = ecoDated([`Chapeau de fête ${/^[aeiouyéèêh]/i.test(nm) ? 'd’' : 'de '}${nm} ${y}`, 'v', 'tete', 3, 'chapeau', '#f6a6c1'], `anniversaire ${y}`, `Anniversaire de ${nm}`, Date.now() + 864e5, { edition: `Anniversaire · ${y}` });
    S.inv.push(it); S.dex[it.name] = true;
    try { addXP(b.k, 60); } catch (e) {}
    msg = `Joyeux anniversaire ${nm} ! +2 tickets et « ${it.name} ».`;
  } else {
    const i = E.pend.findIndex(p => p.id === id); if (i < 0) return '';
    const p = E.pend.splice(i, 1)[0];
    if (p.kind === 'conv') { gainCoins(p.coins); msg = `${p.label} : +${p.coins} pièces pour vos ${ecoPl(p.n, 'souvenir', 'souvenirs')} restants.`; }
    if (p.kind === 'tour') msg = ecoTourGive(p);
  }
  save(); renderTop();
  if (!quiet && msg) toast(msg);
  return msg;
}

// ================= 3. MACHINE À SOUVENIRS =================
const ECO_RATES = [52, 28, 14, 5, 1];
const ECO_PITY_E = 10, ECO_PITY_L = 50, ECO_LUX = 300, ECO_EXCH = [20, 6], ECO_KEEP1 = 2, ECO_EXDAY = 10; // au plus 10 tickets d'échange par jour
// lots de la bannière permanente (exclusifs à la machine)
const ECO_CAPS = [
  [['Bob capsule à pois', 'v', 'tete', 0, 'chapeau', '#f6a6c1'], ['Chaussettes capsule', 'v', 'pieds', 0, 'chaussettes', '#a8d8f0'], ['Bandana capsule', 'v', 'cou', 0, 'foulard', '#f6d88a'], ['Figurine capsule', 'd', 'statue', 0, null, '#ec9c6f'], ['Mini plante capsule', 'd', 'plante', 0, null, '#9fd3ae'], ['Autocollants du monde', 'd', 'herbier', 0, null, '#f4b7c4']],
  [['Casquette capsule', 'v', 'tete', 1, 'casquette', '#9fb6e8'], ['Moufles bonbon', 'v', 'mains', 1, 'moufles', '#f4b7c4'], ['Sweat capsule pastel', 'v', 'haut', 1, 'sweat', '#c9b8ea'], ['Bocal de capsules', 'd', 'bocal', 1, null, '#f6e08a'], ['Lanterne capsule', 'd', 'lanterne', 1, null, '#a9dcc8']],
  [['Cape capsule étoilée', 'v', 'dos', 2, 'cape', '#7377be'], ['Bottes capsule', 'v', 'pieds', 2, 'bottes', '#f6a68a'], ['Mappemonde capsule', 'd', 'mappemonde', 2, null, '#9fd1d8'], { recipe: 'cap_lampe' }, { recipe: 'cap_pull' }, { recipe: 'cap_gateau' }, { egg: 2 }],
  [['Couronne de capsules', 'v', 'tete', 3, 'couronne', '#c9b8ea'], ['Jupe capsule étoilée', 'v', 'bas', 3, 'jupe', '#cdb8ee'], ['Machine à souvenirs miniature', 'd', 'statue', 3, null, '#f08aa6'], { egg: 3 }],
  [['Cape de la machine à souvenirs', 'v', 'dos', 4, 'cape', '#f2c14e'], ['Couronne dorée des souvenirs', 'v', 'tete', 4, 'couronne', '#f2c14e'], { egg: 4 }],
];
const ECO_RECIPES = [
  { id: 'cap_lampe', kind: 'Décoration', out: ['Lampe à capsules', 'd', 'lampe', 3, null, '#f6c2cf'], ing: [['cristal', 1], ['papier', 2]], coins: 10 },
  { id: 'cap_pull', kind: 'Vêtement', out: ['Pull capsule arc-en-ciel', 'v', 'haut', 3, 'pull', '#c9b8ea'], ing: [['laine', 3], ['fleur', 1]], coins: 10 },
  { id: 'cap_gateau', kind: 'Cuisine', out: ['Gâteau capsule', 'n', 'sucre', 3, null, '#f6a6c1'], ing: [['sucre', 2], ['fruit', 1]], coins: 0 },
].filter(r => r.ing.every(([k]) => ING[k]));
const ECO_RIDS = new Set(ECO_RECIPES.map(r => r.id));
const ecoRecOwned = id => ecoState().recipes.includes(id);
function ecoSyncRecipes() { for (const r of ECO_RECIPES) if (ecoRecOwned(r.id) && !RECIPES.some(x => x.id === r.id)) RECIPES.push({ id: r.id, kind: r.kind, out: r.out, ing: r.ing, coins: r.coins, cap: 1 }); }
// tirage : rareté avec garanties
function ecoRoll(bn) {
  const P = ecoState().pity[bn]; P.e++; P.l++; P.n++;
  let r;
  if (P.l >= ECO_PITY_L) r = 4;
  else if (P.e >= ECO_PITY_E) r = Math.random() < ECO_RATES[4] / (ECO_RATES[3] + ECO_RATES[4]) ? 4 : 3;
  else { let x = Math.random() * 100; r = 0; for (let i = 0; i < 5; i++) { x -= ECO_RATES[i]; if (x < 0) { r = i; break; } } }
  if (r >= 3) P.e = 0;
  if (r === 4) P.l = 0;
  return r;
}
function ecoPrizePool(bn, r, occ) {
  let pool = ECO_CAPS[r].slice();
  if (bn === 'ev' && occ) {
    const E = occ.E;
    if (r === 0) pool = [{ res: 12 }, { res: 12 }, ...ECO_CAPS[0].slice(0, 3)];
    if (r === 1) pool = [{ res: 30 }, { res: 30 }, ...ECO_CAPS[1].slice(0, 3)];
    if (r === 2) pool = [{ evItem: 0 }, { evItem: 1 }, { res: 60 }];
    if (r === 3) pool = [{ evItem: 4 }, { evItem: 5 }, { evEgg: 0 }];
    if (r === 4) pool = [{ evEgg: 1 }];
    void E;
  }
  return pool;
}
// applique un lot ; renvoie la description pour l'animation
function ecoGive(bn, r, opt = {}) {
  const occ = bn === 'ev' ? ecoActive() : null;
  let pool = ecoPrizePool(bn, r, occ).filter(p => !(p && p.recipe && (ecoRecOwned(p.recipe) || !ECO_RIDS.has(p.recipe))));
  if (!pool.length) pool = ECO_CAPS[r].filter(p => Array.isArray(p));
  const p = pick(pool);
  const from = bn === 'ev' && occ ? `Machine · ${occ.label}` : 'Machine à souvenirs';
  const out = { r };
  if (Array.isArray(p)) {
    const it = makeItem(p, 0, from, [], { fixed: p[3] }); it.cap = 1;
    if (opt.paid) it.paid = opt.paid;
    S.inv.push(it); S.dex[it.name] = true; out.it = it;
  } else if (p.recipe) {
    const E = ecoState(); E.recipes.push(p.recipe); ecoSyncRecipes();
    const rc = ECO_RECIPES.find(x => x.id === p.recipe); out.rec = rc; out.it = { name: `Recette : ${rc.out[0]}`, cat: rc.out[1], sub: rc.out[2], rarity: r, look: rc.out[4], color: rc.out[5] };
  } else if (p.egg != null) {
    const sp = pick(SP_IDS), genes = r >= 3 ? ecoPalGenes(sp, r >= 4 ? 'capsule_or' : 'capsule', r >= 4 ? 'etoiles' : 'coeurs', r >= 4 ? 'brillant' : 'none', r >= 4 ? 'or' : 'def') : randomGenes(sp, 1.5);
    const e = ecoEgg(sp, genes, r >= 3 ? r : Math.max(2, typeof geneRarityOf === 'function' ? geneRarityOf(genes, sp) : 2), { how: 'machine', place: 'Machine à souvenirs' });
    if (e && opt.paid) e.paid = opt.paid;
    out.egg = { sp, genes }; out.it = { name: r >= 3 ? `Œuf ${r >= 4 ? 'capsule dorée' : 'capsule'} de ${spName(sp).toLowerCase()}` : `Œuf de ${spName(sp).toLowerCase()}`, rarity: r };
  } else if (p.res && occ) {
    const v = ecoEvState(occ); v.res += p.res; v.got += p.res; out.res = p.res; out.it = { name: `${p.res} ${occ.E.res[1]}`, rarity: r };
  } else if (p.evItem != null && occ) {
    const it = ecoEvItem(occ, p.evItem, from, { cap: 1 }); if (opt.paid) it.paid = opt.paid;
    S.inv.push(it); S.dex[it.name] = true; out.it = it;
  } else if (p.evEgg != null && occ) {
    const shiny = !!p.evEgg, g = ecoEvEggGenes(occ.E, shiny);
    const e = ecoEgg(occ.E.egg.sp, g, shiny ? 4 : 3, { how: 'machine', place: occ.label }); if (e && opt.paid) e.paid = opt.paid;
    out.egg = { sp: occ.E.egg.sp, genes: g }; out.it = { name: `Œuf ${shiny ? 'scintillant' : 'exclusif'} ${occ.label}`, rarity: shiny ? 4 : 3 };
  } else { // repli
    const d = pick(ECO_CAPS[0]); const it = makeItem(d, 0, from, [], { fixed: 0 }); it.cap = 1; S.inv.push(it); S.dex[it.name] = true; out.it = it; out.r = 0;
  }
  return out;
}
// n tirages ; pay : 'ticket' | 'lux'
function ecoPull(bn, n, pay) {
  const E = ecoState();
  if (bn === 'ev' && !ecoActive()) bn = 'perm';
  if (pay === 'lux') { if (E.lux === dayNum() || S.coins < ECO_LUX) return null; S.coins -= ECO_LUX; E.lux = dayNum(); E.st.lux++; n = 1; }
  else { if (E.tickets < n) return null; E.tickets -= n; }
  const res = [];
  for (let i = 0; i < n; i++) { const r = ecoRoll(bn); res.push(ecoGive(bn, r, pay === 'lux' ? { paid: ECO_LUX } : {})); }
  E.st.pulls += n;
  S.stats.maxRar = Math.max(S.stats.maxRar || 0, ...res.map(x => x.r));
  save();
  return res;
}
// échange du surplus : objets communs (20 → 1) et peu communs (6 → 1) au-delà de quelques exemplaires de chaque
function ecoReserved() {
  const ids = new Set();
  try { if (typeof bqWorn === 'function') bqWorn().forEach(x => ids.add(x)); } catch (e) {}
  try { for (const o of bqState().orders) bqAllocate(o).forEach(a => { if (!a.pet) (a.take || []).forEach(it => it && ids.add(it.id)); }); } catch (e) {}
  return ids;
}
function ecoSurplus(r) {
  const E = ecoState(), keep = r === 0 ? E.keep : ECO_KEEP1, res = ecoReserved(), groups = {};
  for (const it of S.inv) {
    if (!it || it.tresor || it.rarity !== r || !['m', 'n', 'v', 'd'].includes(it.cat) || it.paid || it.cap || it.special || it.edition || it.dated || it.rid || it.orig || it.trophy || res.has(it.id)) continue;
    (groups[it.name] = groups[it.name] || []).push(it);
  }
  const out = [];
  for (const arr of Object.values(groups).sort((a, b) => b.length - a.length)) { arr.sort((a, b) => (b.date || 0) - (a.date || 0)); out.push(...arr.slice(keep)); }
  return out;
}
const ecoExLeft = () => { const X = ecoState().exDay; return X && X.d === dayNum() ? Math.max(0, ECO_EXDAY - X.n) : ECO_EXDAY; };
function ecoExchange(r, all) {
  const per = ECO_EXCH[r], sur = ecoSurplus(r), packs = Math.min(ecoExLeft(), all ? Math.floor(sur.length / per) : Math.min(1, Math.floor(sur.length / per)));
  if (!packs) return 0;
  { const E0 = ecoState(); if (!E0.exDay || E0.exDay.d !== dayNum()) E0.exDay = { d: dayNum(), n: 0 }; E0.exDay.n += packs; }
  const gone = new Set(sur.slice(0, packs * per).map(x => x.id));
  S.inv = S.inv.filter(it => !gone.has(it.id));
  ecoAddTickets(packs, 'exch');
  const E = ecoState(); E.st.exch += packs; E.st.exchN += gone.size;
  save();
  return packs;
}

// ================= 4. TOURNOI DE STYLE =================
const ECO_TOUR_N = 16, ECO_ROUNDS = 4, ECO_TOUR_FEE = 40;
const ECO_TOUR_JURY = ['élégance', 'respect du thème', 'couleurs et fantaisie'];
const ecoWeek = () => (typeof stWeek === 'function' ? stWeek() : { y: new Date().getFullYear(), w: 1, key: new Date().getFullYear() * 100 + 1 });
function ecoRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ecoHash = s => { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// fin de semaine (dimanche 23 h 59)
function ecoWeekEnd(d = new Date()) { const day = d.getDay() || 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7 - day), 23, 59, 59, 999).getTime(); }
function ecoTheme() { return typeof styleTheme === 'function' ? styleTheme() : null; }
// 15 joueurs SIMULÉS : pseudos et régions du marché mondial (22_marche.js), compagnons et tenues tirés au hasard
function ecoField(wk) {
  const r = ecoRng(ecoHash('tournoi' + wk));
  const people = (typeof MK_PEOPLE !== 'undefined' ? MK_PEOPLE : PLAYERS.map(p => [p[0], ''])).slice();
  const suf = typeof MK_SUF !== 'undefined' ? MK_SUF : ['', '7', '_cosy'];
  const sps = typeof SP_IDS !== 'undefined' ? SP_IDS : ['panda', 'capy', 'axo'];
  const looks = {}; for (const s of SLOTS) looks[s[0]] = s[2].map(x => x[1]).filter(x => x !== 'none');
  const dyes = (typeof ST_DYES !== 'undefined' ? ST_DYES.map(x => x[0]) : ['#f4b7c4', '#b8d8f0', '#f6e08a']).concat(['#3b4a7a', '#c94a4a', '#5f8a5a']);
  const out = [];
  for (let i = 0; i < ECO_TOUR_N - 1; i++) {
    const [nm, reg] = people.splice(Math.floor(r() * people.length), 1)[0] || ['Voyageur', ''];
    const sp = sps[Math.floor(r() * sps.length)];
    const pals = (SPECIES[sp] || SPECIES.panda).palettes.filter(p => !p.excl && p.r <= 3);
    const pal = pals[Math.floor(Math.pow(r(), 1.8) * pals.length)];
    const genes = { pal: pal.id, base: pal.base, accent: pal.accent, belly: pal.belly, pattern: r() < 0.6 ? 'uni' : pick(['taches', 'rayures', 'pattes', 'degrade', 'coeurs', 'etoiles']), patCol: pal.pc || '#ffffff', eye: r() < 0.7 ? 'def' : pick(['bleu', 'vert', 'violet', 'rose']), special: 'none' };
    const look = { col: {} }; const nSl = 3 + Math.floor(r() * 4);
    const slots = Object.keys(looks).sort(() => r() - 0.5).slice(0, nSl);
    for (const sl of Object.keys(looks)) look[sl] = 'none';
    for (const sl of slots) { const lk = looks[sl][Math.floor(r() * looks[sl].length)]; look[sl] = lk; look.col[lk] = dyes[Math.floor(r() * dyes.length)]; }
    out.push({ n: nm + suf[Math.floor(r() * suf.length)], reg, sp, genes, look, sk: Math.round((0.36 + 0.52 * Math.pow(r(), 0.9)) * 100) / 100, pts: 0, sum: 0, met: [] });
  }
  return out;
}
function ecoTour() {
  const E = ecoState(), wk = ecoWeek().key;
  if (E.tour && E.tour.week !== wk && !E.tour.final) ecoTourFinish(true);
  if (E.tour && E.tour.week !== wk) E.tour = null;
  return E.tour;
}
// une manche par jour ; le dimanche (dernier jour), toutes les manches restantes
function ecoRoundOpen() {
  const T = ecoTour(); if (!T || T.final || T.rounds.length >= ECO_ROUNDS) return false;
  const today = dayNum(), sunday = (new Date().getDay() || 7) === 7;
  return T.last !== today || sunday;
}
function ecoTourDot() { try { if (!ecoOn()) return false; const T = ecoTour(); return T ? ecoRoundOpen() : true; } catch (e) { return false; } }
function ecoPresentBonus(it) { if (!it) return 0; return Math.min(12, [0, 0, 3, 6, 10][it.rarity || 0] + (it.edition || it.dated ? 4 : 0)); }
function ecoTourRegister(k, itemId) {
  const E = ecoState(), th = ecoTheme(); if (!th || !CHARS[k] || ecoTour()) return false;
  if (S.coins < ECO_TOUR_FEE) { toast(`L’inscription coûte ${ECO_TOUR_FEE} pièces.`); return false; }
  S.coins -= ECO_TOUR_FEE;
  const w = ecoWeek();
  E.tour = { week: w.key, wn: w.w, y: w.y, theme: th.id, tname: th.name, who: k, item: itemId || null, field: ecoField(w.key), rounds: [], pts: 0, sum: 0, last: 0, final: 0, at: Date.now() };
  E.st.tours++;
  save();
  return true;
}
// une manche : le joueur affronte le simulé de même niveau qu'il n'a pas encore rencontré ; les autres jouent entre eux
function ecoTourPlay() {
  const T = ecoTour(); if (!T || !ecoRoundOpen()) return null;
  const th = (typeof ST_THEMES !== 'undefined' && ST_THEMES.find(x => x.id === T.theme)) || ecoTheme();
  const k = CHARS[T.who] ? T.who : S.sel, ri = T.rounds.length;
  const J = styleJudge(k, th), j = ri % 3, focus = ri === ECO_ROUNDS - 1 ? J.avg / 5 : J.jury[j].s / 5;
  const r = ecoRng(ecoHash(`manche${T.week}:${ri}`));
  const it = T.item ? S.inv.find(x => x.id === T.item) : null;
  const me = Math.max(5, Math.min(100, Math.round(100 * (0.5 * J.overall + 0.5 * focus) + ecoPresentBonus(it) + (r() - 0.5) * 8)));
  const F = T.field, idx = F.map((p, i) => i).filter(i => !F[i].metMe);
  idx.sort((a, b) => Math.abs(F[a].pts - T.pts) - Math.abs(F[b].pts - T.pts) || F[b].pts - F[a].pts);
  const oi = idx[0], O = F[oi];
  const them = Math.max(5, Math.min(100, Math.round(100 * O.sk + (r() - 0.5) * 18)));
  const win = me > them || (me === them && r() < 0.5);
  O.metMe = 1;
  if (win) T.pts += 3; else O.pts += 3;
  T.sum += me; O.sum += them;
  // les 14 autres simulés jouent leur manche entre eux
  const rest = F.map((p, i) => i).filter(i => i !== oi).sort((a, b) => F[b].pts - F[a].pts || r() - 0.5);
  for (let i = 0; i + 1 < rest.length; i += 2) {
    const A = F[rest[i]], B = F[rest[i + 1]];
    const sa = Math.round(100 * A.sk + (r() - 0.5) * 18), sb = Math.round(100 * B.sk + (r() - 0.5) * 18);
    A.sum += sa; B.sum += sb; if (sa >= sb) A.pts += 3; else B.pts += 3;
  }
  const rd = { i: ri, j: ri === ECO_ROUNDS - 1 ? 3 : j, me, them, opp: oi, win: win ? 1 : 0, at: Date.now(), stars: J.stars, line: J.jury[j].txt };
  T.rounds.push(rd); T.last = dayNum();
  if (T.rounds.length >= ECO_ROUNDS) ecoTourFinish(false);
  save();
  return rd;
}
function ecoStandings(T) {
  const rows = T.field.map((p, i) => ({ me: 0, i, n: p.n, reg: p.reg, sp: p.sp, pts: p.pts, sum: p.sum })).concat([{ me: 1, n: CHARS[T.who] ? CHARS[T.who].name : 'Vous', pts: T.pts, sum: T.sum }]);
  rows.sort((a, b) => b.pts - a.pts || b.sum - a.sum || a.me - b.me);
  rows.forEach((x, i) => x.rank = i + 1);
  return rows;
}
// fin du tournoi (4 manches jouées, ou semaine terminée : les manches non jouées sont perdues)
function ecoTourFinish(forfeit) {
  const E = ecoState(), T = E.tour; if (!T || T.final) return;
  if (forfeit) { const r = ecoRng(ecoHash('fin' + T.week)); while (T.rounds.length < ECO_ROUNDS) { const ri = T.rounds.length; T.field.forEach(p => { p.pts += r() < p.sk ? 3 : 0; p.sum += Math.round(100 * p.sk); }); T.rounds.push({ i: ri, forfeit: 1, me: 0, them: 0, win: 0 }); } }
  const st = ecoStandings(T), rank = st.find(x => x.me).rank;
  T.final = Date.now(); T.rank = rank;
  E.pend.push({ id: 'tour:' + T.week, kind: 'tour', rank, theme: T.tname, themeId: T.theme, wn: T.wn, y: T.y, week: T.week, who: T.who, sum: T.sum });
  try { GAME.emit('contest:done', { score: Math.round(T.sum / ECO_ROUNDS) / 20, rank, who: T.who, theme: T.theme }); } catch (e) {}
}
const ecoTourTickets = rank => rank === 1 ? 5 : rank === 2 ? 4 : rank === 3 ? 3 : rank <= 8 ? 2 : 1;
function ecoTourPrizeText(rank) { return `${ecoTourTickets(rank)} ticket${ecoTourTickets(rank) > 1 ? 's' : ''}${rank <= 3 ? ` + trophée ${rank === 1 ? 'd’or' : rank === 2 ? 'd’argent' : 'de bronze'} daté` : ''}${rank <= 4 ? ' + vêtement unique' : ''}`; }
function ecoTourGive(p) {
  const E = ecoState(), rank = p.rank, lab = `Tournoi · semaine ${p.wn} · ${p.y}`;
  const end = Date.now();
  ecoAddTickets(ecoTourTickets(rank), 'tour');
  const got = [`${ecoTourTickets(rank)} ticket${ecoTourTickets(rank) > 1 ? 's' : ''}`];
  if (rank <= 3) {
    const med = [['Trophée d’or', '#f2c14e', 4, 'or'], ['Trophée d’argent', '#c9d2d8', 3, 'argent'], ['Trophée de bronze', '#d9905a', 3, 'bronze']][rank - 1];
    const it = ecoDated([`${med[0]} · ${p.theme} ${p.y}`, 'd', 'statue', med[2], null, med[1]], `semaine ${p.wn} · ${p.y}`, 'Tournoi de style', end, { edition: lab });
    it.trophy = med[3]; S.inv.push(it); S.dex[it.name] = true; got.push(`« ${it.name} »`);
    E.trophies.push({ week: p.week, wn: p.wn, y: p.y, theme: p.theme, medal: med[3], rank, who: p.who, at: Date.now() });
    try { const s = styleState(); s.trophies.push({ week: p.week, theme: p.themeId, name: p.theme, medal: med[3], stars: 6 - rank, who: p.who, at: Date.now() }); } catch (e) {}
  }
  if (rank <= 4) {
    const th = (typeof ST_THEMES !== 'undefined' && ST_THEMES.find(x => x.id === p.themeId)) || null;
    if (th) { const d = th.prize; const it = ecoDated([`${d[0]} · S${p.wn} ${p.y}`, d[1], d[2], rank === 1 ? 4 : 3, d[4], d[5]], `semaine ${p.wn} · ${p.y}`, 'Tournoi de style', end, { edition: lab }); it.contest = th.id; S.inv.push(it); S.dex[it.name] = true; got.push(`« ${it.name} »`); }
  }
  return `Tournoi « ${p.theme} » : ${got.join(', ')} !`;
}

// ================= ENVELOPPES : jeu =================
// ressource d'événement au retour de voyage (ligne dans la fenêtre du butin)
let ecoHaulNote = null;
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  let g = null, occ = null;
  try { if (t && ecoOn()) { occ = ecoActive(); if (occ) g = ecoResFor(t, occ); } } catch (e) { g = null; }
  if (g && g.n) ecoHaulNote = `${occ.E.name} : +${ecoPl(g.n, occ.E.res[0], occ.E.res[1])}${g.near ? ` (près ${/^[AEIOUYÉÈ]/.test(g.near.name) ? 'd’' : 'de '}${g.near.name} : ×3)` : g.inTag ? ' (paysage de la fête : ×2)' : ''}.`;
  const r = orig.apply(this, arguments);
  ecoHaulNote = null;
  if (g && g.n && S.trips[k] !== t) { const v = ecoEvState(occ); v.res += g.n; v.got += g.n; ecoState().st.evRes += g.n; save(); }
  return r;
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  if (ecoHaulNote && h) h.extra = (h.extra || []).concat([ecoHaulNote]);
  return orig.apply(this, arguments);
})(showHaul);
// commandes difficiles : un ticket
if (typeof GAME !== 'undefined' && GAME.on) GAME.on('order:done', d => {
  try {
    if (!ecoOn()) return; const o = d && d.order; if (!o) return;
    if ((o.req || []).length >= 3 || o.deadline || (o.coins || 0) >= 220 || (o.req || []).some(r => r.wonder)) { ecoAddTickets(1, 'order'); save(); setTimeout(() => toast('Commande difficile réussie : +1 ticket pour la machine à souvenirs !'), 3800); }
  } catch (e) {}
});
// paliers de collection : un ticket chacun
if (typeof claimTier === 'function') claimTier = (orig => function (idx) { const p = (S.tierPending || [])[idx]; const r = orig.apply(this, arguments); if (r && p && p.i >= 1 && ecoOn()) { ecoAddTickets(1, 'tier'); save(); } return r; })(claimTier);
// recettes de la machine : verrouillées tant qu'on ne les a pas tirées
if (typeof canCraft === 'function') canCraft = (orig => function (r) { if (r && ECO_RIDS.has(r.id) && !ecoRecOwned(r.id)) return false; return orig.apply(this, arguments); })(canCraft);
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  ecoSyncRecipes();
  const r = orig.apply(this, arguments);
  try { box.querySelectorAll('[data-craft]').forEach(b => { if (ECO_RIDS.has(b.dataset.craft)) { const x = b.closest('.rec'), nm = x && x.querySelector('.rx b'); if (nm && !nm.querySelector('.eco-rb')) nm.insertAdjacentHTML('beforeend', ' <i class="eco-rb">Machine</i>'); } }); } catch (e) {}
  return r;
})(renderAtelier);

// ================= ENVELOPPES : prix et marché =================
// objets datés : plus chers (et encore plus quand on ne peut plus les obtenir)
// souvenirs de la machine (non datés) : valeur surtout sentimentale, ils se revendent peu (pas de boucle tickets → pièces)
if (typeof value === 'function') value = (orig => function (it) { const v = orig.apply(this, arguments); if (it && it.dated) return Math.round(v * (ecoGone(it) ? 1.5 : 1.2)); if (it && it.cap) return Math.max(3, Math.round(v * 0.35)); return v; })(value);
if (typeof mkFair === 'function') mkFair = (orig => function (it) {
  const p = orig.apply(this, arguments);
  try { if (it && it.dated) return Math.max(p, Math.max(5, Math.round(value({ ...it, id: it.id || '' }) / 5) * 5)); } catch (e) {} // la tendance du jour ne fait pas baisser un objet daté
  return p;
})(mkFair);
// quelques objets d'anciens événements circulent au marché mondial (des collectionneurs simulés les revendent)
if (typeof mkGen === 'function') mkGen = (orig => function (cat) {
  try {
    if (cat === 'mode' && Math.random() < 0.08) {
      const past = ecoPast().filter(o => o.E.items.some(d => d[1] === 'v'));
      if (past.length) {
        const o = pick(past), defs = o.E.items.map((d, i) => [d, i]).filter(([d]) => d[1] === 'v'), [d] = pick(defs);
        const data = { name: `${d[0]} ${o.y}`, cat: 'v', sub: d[2], rarity: d[3], look: d[4], color: d[5], edition: `Édition limitée · ${o.label}`, dated: { label: o.label, end: o.e, id: o.id } };
        const now = Date.now(), fair = mkFair(data);
        return { id: 'm' + uidGen(), cat, at: now, exp: now + (20 + Math.random() * 60) * 60e3, kind: 'item', data, fair, seller: mkSeller(), price: mkR5(fair * (1.05 + Math.random() * 0.35)) };
      }
    }
  } catch (e) {}
  return orig.apply(this, arguments);
})(mkGen);
const ecoEdBadge = it => it && it.dated ? `<i class="eco-ed">${esc(it.edition || 'Édition limitée')}</i>` : '';
if (typeof mkSub === 'function') mkSub = (orig => function (l) { const s = orig.apply(this, arguments); return l && l.kind === 'item' && l.data && l.data.dated ? s + ' ' + ecoEdBadge(l.data) : s; })(mkSub);
if (typeof mkRowSell === 'function') mkRowSell = (orig => function (x) { const s = orig.apply(this, arguments); return x && x.t === 'item' && x.it && x.it.dated ? s.replace('</span><span class="mk-by">', ` ${ecoEdBadge(x.it)}</span><span class="mk-by">`) : s; })(mkRowSell);
// fiches d'objet (23_objets.js) : un objet daté raconte d'où il vient
if (typeof obStory === 'function') obStory = (orig => function (it) {
  if (it && it.dated) return `${esc(it.edition || 'Édition limitée')}. ${ecoGone(it) ? 'On ne peut plus l’obtenir : sa valeur grimpe.' : `Disponible jusqu’au ${ecoDate(it.dated.end)}, puis introuvable.`}`;
  if (it && it.cap) return 'Sorti de la machine à souvenirs : on ne le trouve nulle part ailleurs.';
  return orig.apply(this, arguments);
})(obStory);
if (typeof obRareHTML === 'function') obRareHTML = (orig => function (it) {
  if (it && it.dated) return `<p class="eco-dated">${ecoIconForItem(it)}<span><b>${esc(it.edition || 'Édition limitée')}</b><br>${ecoGone(it) ? 'Plus disponible : objet de collection.' : `Disponible jusqu’au ${ecoDate(it.dated.end)}.`} Se vend environ ${typeof mkFair === 'function' ? mkFair(it) : value(it)} pièces au marché.</span></p>`;
  return orig.apply(this, arguments);
})(obRareHTML);
function ecoIconForItem(it) { const id = it && it.dated && it.dated.id; const o = id ? ecoOcc(id) : null; return o ? ecoIconSVG(o.E) : ECO_TICKET; }

// ================= INTERFACE =================
// ---------- menu (carnet) : événement, rendez-vous, cadeaux ----------
let ecoView = null; // null | 'event'
if (typeof pendingRewards === 'function') pendingRewards = (orig => function () { const out = orig.apply(this, arguments); try { if (ecoOn()) out.push(...ecoPending()); } catch (e) {} return out; })(pendingRewards);
if (typeof menuRewardRow === 'function') menuRewardRow = (orig => function (r) {
  if (r && r.kind === 'eco') return `<div class="mrow eco-mr"><span class="mri eco-mri">${r.ic || GIFT()}</span><div><b>${esc(r.t)}</b><span>${esc(r.s)}</span></div><button class="btn gold sm" data-eco-claim="${esc(r.id)}">Récupérer</button></div>`;
  if (r && r.kind === 'gift') {
    const L = S.login, idx = ((L.streak || 1) - 1) % 7, rw = LOGIN_REWARDS[idx];
    return `<div class="mrow"><span class="mri gift">${GIFT()}</span><div><b>Cadeau du jour</b><span>Jour ${idx + 1} de la série · ${esc(ecoLoginWhat(rw))}</span></div><button class="btn gold sm" data-menu="gift">Récupérer</button></div>`;
  }
  const h = orig.apply(this, arguments);
  return r && r.kind === 'tier' && r.p && r.p.i >= 1 && ecoOn() ? h.replace(/(<\/span><\/div><button class="btn gold sm" data-menu="tier")/, ' + 1 ticket$1') : h;
})(menuRewardRow);
function ecoLoginWhat(rw) {
  if (!rw) return '';
  const p = [];
  if (rw.coins) p.push(`${rw.coins} pièces`);
  if (rw.ticket) p.push(`${rw.ticket} ticket${rw.ticket > 1 ? 's' : ''}`);
  if (rw.dated) p.push(`l’objet daté de ${ECO_MOIS[new Date().getMonth()]}`);
  else if (rw.item != null) p.push(`un objet ${RARITY[rw.item].toLowerCase()}`);
  return p.join(' + ');
}
if (typeof menuClaimAll === 'function') menuClaimAll = (orig => function () {
  let n = 0; try { if (ecoOn()) for (const p of ecoPending()) { if (ecoClaim(p.id, true)) n++; } } catch (e) {}
  const r = orig.apply(this, arguments);
  if (n) setTimeout(() => toast(`${n} cadeau${n > 1 ? 'x' : ''} de plus récupéré${n > 1 ? 's' : ''} !`), 1200);
  return r;
})(menuClaimAll);
function ecoEventCard(occ, big) {
  const E = occ.E, v = ecoEvState(occ), dl = ecoDaysLeft(occ.e);
  return `<div class="eco-evc ${big ? 'big' : ''}" style="--ec:${E.color};--ec2:${E.color2}"><span class="eco-evi">${ecoIconSVG(E)}</span><div class="eco-evx"><span class="eco-kick">Événement · ${dl <= 1 ? 'dernier jour !' : `encore ${dl} jours`}</span><b>${esc(occ.label)}</b><span class="eco-evd">Du ${ecoDate(occ.s)} au ${ecoDate(occ.e)} · ${esc(ecoCap(E.res[1]))} : <b class="eco-res">${ecoIconSVG(E, 'sm')}${v.res.toLocaleString('fr-FR')}</b></span></div>${big ? '' : `<button class="btn gold sm" data-eco-go="event">Voir</button>`}</div>`;
}
function ecoStreakHTML() {
  const L = S.login, cur = ((L.streak || 1) - 1) % 7, pend = typeof giftPending === 'function' && giftPending();
  return `<div class="mstreak"><span class="streak">${FLAME} ${L.streak || 1} jour${(L.streak || 1) > 1 ? 's' : ''} de suite</span><span class="mdots eco-dots" aria-hidden="true">${LOGIN_REWARDS.map((r, i) => `<i class="${i < cur || (i === cur && !pend) ? 'on' : i === cur ? 'now' : ''}${i === 6 ? ' big' : ''}${r.ticket ? ' tk' : ''}"></i>`).join('')}</span><span class="small">Jour 3 : un ticket · jour 6 : deux tickets · jour 7 : l’objet daté de ${ECO_MOIS[new Date().getMonth()]}.</span></div>`;
}
function ecoMenuHTML() {
  const occ = ecoActive(), ev = typeof todayEvent === 'function' ? todayEvent() : null;
  let h = `<section class="msec eco-ms"><header><h3>Événement</h3></header>`;
  if (occ) h += ecoEventCard(occ, false);
  else {
    const nx = ecoNext();
    if (ev) h += `<div class="mrow"><span class="mri ev" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><div><b>Bonus du jour : ${esc(ev.name)}</b><span>${esc(ev.short)}</span></div><button class="btn cream sm" data-menu="event">J’y vais</button></div>`;
    if (nx) h += `<div class="eco-next" style="--ec:${nx.E.color}">${ecoIconSVG(nx.E)}<span>Prochain événement : <b>${esc(nx.label)}</b>, ${ecoDaysLeft(nx.s) <= 1 ? 'demain' : `dans ${ecoDaysLeft(nx.s)} jours`} (${ecoDate(nx.s)})</span></div>`;
  }
  h += ecoStreakHTML() + `</section>`;
  // rendez-vous : tournoi et machine
  const T = ecoTour(), th = ecoTheme(), E = ecoState();
  let tr;
  if (!T) tr = `<div><b>Tournoi de style : ${esc(th ? th.name : '')}</b><span>Inscriptions ouvertes jusqu’à dimanche</span></div><button class="btn gold sm" data-eco-go="tournoi">S’inscrire</button>`;
  else if (T.final) tr = `<div><b>Tournoi « ${esc(T.tname)} » terminé</b><span>${T.rank}${T.rank === 1 ? 'er' : 'e'} sur 16 · nouveau thème lundi</span></div><button class="btn cream sm" data-eco-go="tournoi">Voir</button>`;
  else tr = `<div><b>Tournoi « ${esc(T.tname)} » · manche ${Math.min(ECO_ROUNDS, T.rounds.length + 1)}/${ECO_ROUNDS}</b><span>${ecoRoundOpen() ? 'Une manche vous attend !' : 'Prochaine manche demain'} · ${T.pts} pts</span></div><button class="btn ${ecoRoundOpen() ? 'gold' : 'cream'} sm" data-eco-go="tournoi">${ecoRoundOpen() ? 'Jouer' : 'Voir'}</button>`;
  h += `<section class="msec eco-ms"><header><h3>Rendez-vous</h3></header><div class="mrow"><span class="mri">${TROPHY()}</span>${tr}</div><div class="mrow"><span class="mri eco-mach">${ecoMachIcon()}</span><div><b>Machine à souvenirs</b><span>${ecoPl(E.tickets, 'ticket', 'tickets')}${occ ? ` · bannière ${esc(occ.label)}` : ''}</span></div><button class="btn ${E.tickets ? 'gold' : 'cream'} sm" data-eco-go="machine">${E.tickets ? 'Tourner' : 'Voir'}</button></div></section>`;
  return h;
}
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  if (ecoView === 'event' && ecoOn() && ecoActive()) { try { return ecoRenderEvent(box); } catch (e) { console.error(e); } }
  ecoView = null;
  const r = orig.apply(this, arguments);
  if (!ecoOn()) return r;
  try {
    ecoCheckEnds();
    const old = box.querySelector('[data-menu="event"]'), sec = old && old.closest('.msec');
    const html = ecoMenuHTML();
    if (sec) sec.outerHTML = html;
    else { const hot = box.querySelector('.msec.hot'); if (hot) hot.insertAdjacentHTML('afterend', html); else box.insertAdjacentHTML('afterbegin', html); }
  } catch (e) { console.error('eco menu', e); }
  return r;
})(renderMenu);
// ---------- l'écran de l'événement (dans le carnet) ----------
function ecoRenderEvent(box) {
  const occ = ecoActive(), E = occ.E, v = ecoEvState(occ), dl = ecoDaysLeft(occ.e);
  let h = `<button class="eco-back" data-eco-back="1">‹ Le carnet</button>`;
  h += `<div class="eco-hero" style="--ec:${E.color};--ec2:${E.color2}"><div class="eco-hi">${ecoIconSVG(E)}</div><span class="eco-kick">Événement de saison · ${dl <= 1 ? 'dernier jour !' : `encore ${dl} jours`}</span><h2>${esc(occ.label)}</h2><p>${esc(E.story)}</p><span class="eco-dates">Du ${ecoDate(occ.s)} au ${ecoDate(occ.e)}</span></div>`;
  h += `<div class="eco-resbar" style="--ec:${E.color}"><span class="eco-resbig">${ecoIconSVG(E)}<b>${v.res.toLocaleString('fr-FR')}</b><i>${esc(E.res[1])}</i></span><span class="small">Gagnées en tout : ${v.got.toLocaleString('fr-FR')}</span></div>`;
  h += `<h3>Où en trouver ?</h3><ul class="eco-how"><li><b>Chaque voyage</b> en rapporte : plus il est long, plus il y en a.</li><li><b>×2</b> dans ${esc(E.where.split(',').slice(0, 2).join(' et ').replace(/ et et /, ' et '))} et autres paysages de la fête.</li><li><b>×3</b> près des hauts lieux :</li></ul><div class="eco-places">${E.places.map(n => PLACES.find(p => p.name === n)).filter(Boolean).map(p => `<button class="eco-pl" data-eco-place="${p.id}">${esc(p.name)}<small>${esc(p.country)}</small></button>`).join('')}</div>`;
  h += `<h3>Boutique de l’événement</h3><p class="small eco-note">Objets datés « ${esc(occ.label)} » : introuvables après le ${ecoDate(occ.e)}.</p><div class="eco-shop">`;
  for (const a of ecoShop(occ)) {
    const n = v.bought[a.id] || 0, done = n >= a.lim, can = !done && v.res >= a.price;
    let ic, rar, sub;
    if (a.kind === 'item') { ic = itemIcon({ name: a.name, cat: a.def[1], sub: a.def[2], rarity: a.def[3], look: a.def[4], color: a.def[5] }); rar = a.def[3]; sub = a.def[1] === 'v' ? `Vêtement · ${SLOT_LABEL[a.def[2]]}` : 'Décoration'; }
    else if (a.kind === 'egg') { ic = drawEgg(E.egg.sp, ecoEvEggGenes(E, false), 0, 'ecoegg' + E.key); rar = 3; sub = `Variante exclusive « ${esc(E.egg.pal)} » · ${esc(spName(E.egg.sp).toLowerCase())}`; }
    else { ic = ECO_TICKET; rar = 1; sub = `Pour la machine à souvenirs · ${n}/${a.lim}`; }
    h += `<article class="eco-art r${rar}" style="--rc:${RARC[rar]}"><span class="eco-aic">${ic}</span><b>${esc(a.name)}</b><i style="color:${RARC[rar]}">${RARITY[rar]}</i><span class="eco-asub">${sub}</span><button class="btn ${done ? 'cream' : can ? 'gold' : 'cream'} sm" data-eco-buy="${a.id}" ${done ? 'disabled' : ''}>${done ? 'Acheté' : `${ecoIconSVG(E, 'sm')} ${a.price}`}</button></article>`;
  }
  h += `</div><div class="eco-mbanner" style="--ec:${E.color}"><span>${ecoMachIcon()}</span><div><b>Bannière ${esc(occ.label)}</b><span>À la machine à souvenirs : objets exclusifs et l’œuf scintillant.</span></div><button class="btn gold sm" data-eco-go="machine-ev">Y aller</button></div>`;
  h += `<p class="small eco-note">À la fin de l’événement, chaque ${esc(E.res[0])} restant${/e$/.test(E.res[0]) && !/[éè]e$/.test(E.res[0]) ? 'e' : ''} devient ${ECO_CONV} pièces.</p>`;
  box.innerHTML = h;
}
function ecoOpenEvent() { if (!ecoOn() || !ecoActive()) return; ecoView = 'event'; if (typeof openSheet === 'function') openSheet('menu'); $('panelBody').scrollTop = 0; }

// ---------- la machine à souvenirs (village › Capsules) ----------
let ecoBanner = 'perm';
function ecoMachIcon() { return `<svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.machine}</svg>`; }
function ecoMachineSVG(run, cols) {
  const caps = [[78, 70], [104, 58], [132, 66], [92, 92], [120, 90], [146, 96], [70, 104], [100, 118], [130, 120], [84, 136], [112, 142], [142, 140], [158, 116], [62, 128]];
  const C = cols || ['#f6a6c1', '#9fd1d8', '#f6e08a', '#a6d88f', '#cdb8ee', '#f6a68a', '#9a6fd6', '#4f88cf', '#d99a25', '#f08aa6', '#5fbf7f', '#b8d8f0', '#f6c445', '#e9a0a0'];
  const cap = (x, y, c, i) => `<g transform="translate(${x} ${y}) rotate(${(i * 47) % 360})"><circle r="12" fill="#fffaf0" stroke="${ECO_L}" stroke-width="2.2"/><path d="M-12 0 a12 12 0 0 1 24 0z" fill="${c}" stroke="${ECO_L}" stroke-width="2.2"/><ellipse cx="-4.5" cy="-5.5" rx="3.6" ry="2" fill="#fff" opacity=".7"/></g>`;
  return `<svg class="cm-svg ${run ? 'run' : ''}" viewBox="0 0 220 290" aria-hidden="true"><defs><radialGradient id="cmGl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="#e9f8fb" stop-opacity=".25"/><stop offset="1" stop-color="#bfe6ee" stop-opacity=".55"/></radialGradient><clipPath id="cmClip"><circle cx="110" cy="100" r="74"/></clipPath></defs>
<ellipse cx="110" cy="281" rx="86" ry="8" fill="#000" opacity=".12"/>
<circle cx="110" cy="100" r="76" fill="#dff3f6" stroke="${ECO_L}" stroke-width="4.5"/>
<g clip-path="url(#cmClip)"><g class="cm-caps">${caps.map(([x, y], i) => cap(x, y, C[i % C.length], i)).join('')}</g></g>
<circle cx="110" cy="100" r="74" fill="url(#cmGl)"/><path d="M62 70 Q74 44 104 36" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>
<rect x="88" y="16" width="44" height="12" rx="6" fill="#f6c445" stroke="${ECO_L}" stroke-width="3"/>
<path d="M46 166 H174 L184 270 H36Z" fill="#f08aa6" stroke="${ECO_L}" stroke-width="4.5" stroke-linejoin="round"/>
<path d="M58 176 H162 L168 256 H52Z" fill="#f6a6c1" opacity=".55"/>
<rect x="40" y="160" width="140" height="18" rx="7" fill="#f6c445" stroke="${ECO_L}" stroke-width="4"/>
<rect x="68" y="186" width="84" height="22" rx="7" fill="#fff8ea" stroke="${ECO_L}" stroke-width="3"/><text x="110" y="201.5" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="12.5" fill="${ECO_L}" letter-spacing="1">SOUVENIRS</text>
<g class="cm-crank"><circle cx="80" cy="236" r="19" fill="#fff8ea" stroke="${ECO_L}" stroke-width="4"/><rect x="75.5" y="214" width="9" height="44" rx="4.5" fill="#f6c445" stroke="${ECO_L}" stroke-width="3"/><circle cx="80" cy="236" r="4" fill="${ECO_L}"/></g>
<rect x="122" y="220" width="44" height="36" rx="9" fill="#5b4636" stroke="${ECO_L}" stroke-width="3.5"/><path d="M126 236 Q144 228 162 236 V250 H126Z" fill="#7a5f50"/>
<rect x="150" y="190" width="7" height="16" rx="3.5" fill="#5b4636"/>
</svg>`;
}
function ecoCapsuleSVG(c, uid) {
  return `<svg class="cp-svg" viewBox="0 0 100 100" aria-hidden="true"><g class="cp-top"><path d="M10 50 a40 40 0 0 1 80 0z" fill="${c}" stroke="${ECO_L}" stroke-width="5"/><ellipse cx="34" cy="28" rx="11" ry="6" fill="#fff" opacity=".6"/></g><g class="cp-bot"><path d="M10 50 a40 40 0 0 0 80 0z" fill="#fffaf0" stroke="${ECO_L}" stroke-width="5"/></g><rect class="cp-band" x="7" y="46" width="86" height="8" rx="4" fill="#fff" stroke="${ECO_L}" stroke-width="4"/></svg>`;
}
const ECO_CAPC = ['#c9c4d2', '#7fcf9f', '#7fb0ea', '#b58ce8', '#f2c14e'];
function ecoMachineDot() { try { const E = ecoState(); return ecoOn() && E.tickets > 0 && E.tickets > E.seenT; } catch (e) { return false; } }
function ecoRenderMachine(box) {
  const E = ecoState(), occ = ecoActive();
  if (ecoBanner === 'ev' && !occ) ecoBanner = 'perm';
  E.seenT = E.tickets;
  const bn = ecoBanner, P = E.pity[bn], luxOK = E.lux !== dayNum();
  let h = `<div class="cm-wrap"><div class="cm-head"><div class="cm-mach">${ecoMachineSVG(false)}</div><div class="cm-side"><span class="eco-kick">Village · place du marché</span><h2>La machine à souvenirs</h2><p>Glissez un ticket, tournez la manivelle… et ouvrez la capsule !</p><div class="cm-tk">${ecoTk(E.tickets)}<span>ticket${E.tickets > 1 ? 's' : ''}</span></div></div></div>`;
  // bannières
  h += `<div class="cm-bans" role="tablist"><button role="tab" aria-selected="${bn === 'perm'}" data-eco-ban="perm"><b>Souvenirs du monde</b><small>Permanente</small></button>${occ ? `<button role="tab" aria-selected="${bn === 'ev'}" data-eco-ban="ev" style="--ec:${occ.E.color}">${ecoIconSVG(occ.E, 'sm')}<b>${esc(occ.label)}</b><small>jusqu’au ${ecoDate(occ.e)}</small></button>` : ''}</div>`;
  h += bn === 'ev' && occ ? `<p class="cm-bdesc">Objets datés exclusifs « ${esc(occ.label)} », ${esc(occ.E.res[1])} et l’œuf <b>scintillant</b> (légendaire) de la variante ${esc(occ.E.egg.pal)}.</p>` : `<p class="cm-bdesc">Vêtements, décorations, recettes et œufs que l’on ne trouve nulle part ailleurs.</p>`;
  // garanties
  const le = ECO_PITY_E - P.e, ll = ECO_PITY_L - P.l;
  h += `<div class="cm-pity"><div><span>Épique ou mieux garanti dans</span><b>${le} tirage${le > 1 ? 's' : ''}</b><i class="cm-bar"><i style="width:${(P.e / ECO_PITY_E * 100).toFixed(0)}%;background:${RARC[3]}"></i></i></div><div><span>Légendaire garanti dans</span><b>${ll} tirage${ll > 1 ? 's' : ''}</b><i class="cm-bar"><i style="width:${(P.l / ECO_PITY_L * 100).toFixed(0)}%;background:${RARC[4]}"></i></i></div></div>`;
  // boutons
  h += `<div class="cm-go"><button class="btn green big" data-eco-pull="1" ${E.tickets >= 1 ? '' : 'disabled'}>Tourner la manivelle<small>${ECO_TICKET} 1 ticket</small></button>${E.tickets >= 10 ? `<button class="btn gold" data-eco-pull="10">×10<small>${ECO_TICKET} 10</small></button>` : ''}</div>`;
  h += `<div class="cm-lux"><span>${COIN}<span><b>Pièce dorée</b><small>Un tirage par jour contre ${ECO_LUX} pièces</small></span></span><button class="btn cream sm" data-eco-pull="lux" ${luxOK && S.coins >= ECO_LUX ? '' : 'disabled'}>${luxOK ? coins(ECO_LUX) : 'Demain'}</button></div>`;
  // probabilités
  h += `<details class="cm-rates" open><summary>Probabilités et garanties</summary><div class="cm-rt">${ECO_RATES.map((p, r) => `<span style="--rc:${RARC[r]}"><i></i>${RARITY[r]}<b>${String(p).replace('.', ',')} %</b></span>`).join('')}</div><p class="small">Le 10ᵉ tirage sans objet épique donne forcément un épique ou un légendaire ; le 50ᵉ sans légendaire donne forcément un légendaire. Chaque bannière a ses compteurs. Aucun achat : les tickets se gagnent en jouant, jamais avec de l’argent réel.</p></details>`;
  // contenu
  h += `<details class="cm-pool"><summary>Ce que contient la ${bn === 'ev' ? 'bannière' : 'machine'}</summary>${[4, 3, 2, 1, 0].map(r => `<div class="cm-pr"><b style="color:${RARC[r]}">${RARITY[r]}</b><span>${ecoPrizePool(bn, r, occ).map(p => esc(ecoPrizeLabel(p, occ))).join(' · ')}</span></div>`).join('')}</details>`;
  // échange du surplus
  const s0 = ecoSurplus(0), s1 = ecoSurplus(1), xl = ecoExLeft(), n0 = Math.min(xl, Math.floor(s0.length / ECO_EXCH[0])), n1 = Math.min(xl, Math.floor(s1.length / ECO_EXCH[1]));
  h += `<h3 class="cm-h">Échanger le surplus contre des tickets <small class="tr-opt">${ecoExLeft()}/${ECO_EXDAY} aujourd’hui</small></h3><p class="small cm-ex">Vos doublons repartent dans le monde : on garde toujours les ${E.keep} plus récents de chaque objet commun (et 2 de chaque peu commun), ce qui est réservé à une commande, porté, acheté, daté ou unique.</p><div class="cm-exs">`;
  h += `<div class="cm-exr"><span class="cm-exi" style="--rc:${RARC[0]}">${s0.length ? itemIcon(s0[0]) : ''}</span><div><b>${ECO_EXCH[0]} objets communs → 1 ticket</b><span>${s0.length} en surplus${s0.length ? ` (${esc([...new Set(s0.map(x => x.name))].slice(0, 3).join(', '))}${new Set(s0.map(x => x.name)).size > 3 ? '…' : ''})` : ''}</span></div><div class="cm-exb"><button class="btn cream sm" data-eco-ex="0" ${n0 ? '' : 'disabled'}>1 ticket</button>${n0 > 1 ? `<button class="btn gold sm" data-eco-ex="0a">Tout : ${n0}</button>` : ''}</div></div>`;
  h += `<div class="cm-exr"><span class="cm-exi" style="--rc:${RARC[1]}">${s1.length ? itemIcon(s1[0]) : ''}</span><div><b>${ECO_EXCH[1]} objets peu communs → 1 ticket</b><span>${s1.length} en surplus</span></div><div class="cm-exb"><button class="btn cream sm" data-eco-ex="1" ${n1 ? '' : 'disabled'}>1 ticket</button>${n1 > 1 ? `<button class="btn gold sm" data-eco-ex="1a">Tout : ${n1}</button>` : ''}</div></div>`;
  h += `<label class="cm-keep">Garder <select data-eco-keep="1">${[1, 2, 3, 5, 8].map(n => `<option value="${n}" ${n === E.keep ? 'selected' : ''}>${n}</option>`).join('')}</select> exemplaire(s) de chaque objet commun</label></div>`;
  h += `<h3 class="cm-h">Gagner des tickets</h3><ul class="cm-earn"><li><b>Tournoi de style</b><span>1 à 5 tickets chaque semaine</span></li><li><b>Cadeaux</b><span>Série de connexion, anniversaires, bienvenue</span></li><li><b>Commandes difficiles</b><span>3 objets, délai ou grosse commande : +1</span></li><li><b>Paliers de collection</b><span>+1 aux paliers 50 % et 100 %</span></li>${occ ? `<li><b>Boutique ${esc(occ.E.name)}</b><span>jusqu’à 3 tickets</span></li>` : ''}<li><b>Surplus</b><span>Échangez vos doublons ci-dessus</span></li></ul></div>`;
  box.innerHTML = h;
}
function ecoPrizeLabel(p, occ) {
  if (Array.isArray(p)) return p[0];
  if (p.recipe) { const r = ECO_RECIPES.find(x => x.id === p.recipe); return r ? `Recette : ${r.out[0]}` : 'Recette'; }
  if (p.egg != null) return p.egg >= 4 ? 'Œuf capsule dorée (brillant)' : p.egg >= 3 ? 'Œuf capsule' : 'Œuf de compagnon';
  if (p.res && occ) return `${p.res} ${occ.E.res[1]}`;
  if (p.evItem != null && occ) return `${occ.E.items[p.evItem][0]} ${occ.y}`;
  if (p.evEgg != null && occ) return p.evEgg ? `Œuf scintillant ${occ.E.egg.pal}` : `Œuf ${occ.E.egg.pal}`;
  return '';
}
// animation d'ouverture (déclenchée par le joueur)
let ecoLast = null;
function ecoPullShow(res, bn) {
  ecoLast = res;
  if (!res || !res.length) return;
  if (res.length === 1) {
    const x = res[0];
    showModal(`<div class="cp-stage" data-n="1"><span class="eco-kick">${bn === 'ev' && ecoActive() ? esc(ecoActive().label) : 'Machine à souvenirs'}</span><div class="cp-mach">${ecoMachineSVG(true)}</div><button class="cp-cap r${x.r}" data-eco-open="0" style="--rc:${RARC[x.r]}" aria-label="Ouvrir la capsule">${ecoCapsuleSVG(ECO_CAPC[x.r])}</button><p class="cp-hint">Touchez la capsule pour l’ouvrir !</p><div class="cp-out" hidden></div><div class="cp-acts" hidden><button class="btn cream" data-closemodal="1">Ranger</button>${ecoState().tickets >= 1 ? `<button class="btn green" data-eco-again="${bn}">Encore ! <small>${ECO_TICKET}1</small></button>` : ''}</div></div>`);
  } else {
    showModal(`<div class="cp-stage multi"><span class="eco-kick">${res.length} capsules</span><div class="cp-row">${res.map((x, i) => `<button class="cp-cap mini r${x.r}" data-eco-open="${i}" style="--rc:${RARC[x.r]};--d:${(i * 0.07).toFixed(2)}s">${ecoCapsuleSVG(ECO_CAPC[x.r])}</button>`).join('')}</div><p class="cp-hint">Touchez une capsule, ou ouvrez tout d’un coup.</p><button class="btn gold" data-eco-openall="1">Tout ouvrir</button><div class="haul cp-grid" hidden></div><div class="cp-acts" hidden><button class="btn green big wide" data-closemodal="1">Tout ranger</button></div></div>`);
  }
}
function ecoPrizeCard(x, i) {
  const it = x.it || { name: '?', rarity: x.r };
  const ic = x.egg ? drawEgg(x.egg.sp, x.egg.genes, 0, 'cpe' + i + uidGen()) : x.res ? ecoIconSVG(ecoActive() ? ecoActive().E : ECO_EVENTS[0]) : itemIcon(it);
  const tag = x.rec ? 'Nouvelle recette' : x.egg ? 'Œuf au refuge' : x.res ? 'Ressource' : it.dated ? (it.edition || '') : it.edition || '';
  return `<div class="hcard r${x.r}" style="--rc:${RARC[x.r]};--d:${(0.06 * i).toFixed(2)}s"><span class="hico">${ic}</span><b>${esc(it.name)}</b><span class="hr">${RARITY[x.r]}</span>${tag ? `<span class="hed">${esc(tag)}</span>` : ''}</div>`;
}
function ecoOpenCap(btn, i) {
  const x = ecoLast && ecoLast[i]; if (!x || btn.classList.contains('open')) return;
  btn.classList.add('open'); btn.disabled = true;
  const st = btn.closest('.cp-stage');
  if (st.dataset.n === '1') {
    setTimeout(() => {
      const out = st.querySelector('.cp-out'); out.innerHTML = ecoPrizeCard(x, 0) + (x.r >= 3 ? `<span class="hbig r${x.r}">${x.r >= 4 ? 'Légendaire !' : 'Épique !'}</span>` : ''); out.hidden = false;
      st.querySelector('.cp-hint').hidden = true; st.querySelector('.cp-acts').hidden = false; btn.classList.add('gone');
      if (x.r >= 3 && typeof confetti === 'function') confetti(x.r >= 4);
    }, reduceMotion() ? 30 : 420);
  } else {
    const grid = st.querySelector('.cp-grid'); grid.hidden = false;
    grid.insertAdjacentHTML('beforeend', ecoPrizeCard(x, 0));
    if (st.querySelectorAll('.cp-cap:not(.open)').length === 0) { st.querySelector('.cp-acts').hidden = false; const b = st.querySelector('[data-eco-openall]'); if (b) b.hidden = true; st.querySelector('.cp-hint').hidden = true; if (ecoLast.some(y => y.r >= 3) && typeof confetti === 'function') confetti(ecoLast.some(y => y.r >= 4)); }
  }
}
function ecoDoPull(arg) {
  if (!ecoOn()) return;
  const bn = ecoBanner === 'ev' && ecoActive() ? 'ev' : 'perm';
  const res = arg === 'lux' ? ecoPull(bn, 1, 'lux') : ecoPull(bn, Math.max(1, +arg || 1), 'ticket');
  if (!res) { toast(arg === 'lux' ? (ecoState().lux === dayNum() ? 'La pièce dorée, c’est une fois par jour. À demain !' : `Il faut ${ECO_LUX} pièces.`) : 'Pas assez de tickets. Échangez votre surplus ou jouez le tournoi !'); return; }
  renderTop(); if (tab === 'village') renderPanel();
  ecoPullShow(res, bn);
}

// ---------- le tournoi (compagnons › Tournoi) ----------
const ECO_PORT = new Map();
function ecoOppPortrait(T, i) {
  const key = T.week + ':' + i; if (ECO_PORT.has(key)) return ECO_PORT.get(key);
  const p = T.field[i]; let s = '';
  try { s = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawChar({ sp: p.sp, genes: p.genes, hybrid: null }, p.look, 'content', 'tro' + i).replace('<svg ', '<svg width="80" height="88" ')); } catch (e) {}
  ECO_PORT.set(key, s); return s;
}
function renderTournoi(box, k) {
  const T = ecoTour(), th = ecoTheme(), w = ecoWeek(), E = ecoState();
  if (!th) { box.innerHTML = '<p class="empty">Le tournoi revient bientôt.</p>'; return; }
  const dl = ecoDaysLeft(ecoWeekEnd());
  let h = `<div class="cthero tr-hero"><span class="ctrib">Tournoi de style · semaine ${w.w}</span><h2>${esc(T ? T.tname : th.name)}</h2><p>${esc(th.desc)}</p><div class="ctmeta"><span>16 participants · 15 joueurs simulés</span><span>${dl <= 1 ? 'Finale aujourd’hui !' : `Finale dimanche (${dl} jours)`}</span></div></div>`;
  if (!T) {
    const J = styleJudge(k, th);
    const rare = S.inv.filter(x => x.rarity >= 2 && x.cat !== 't').sort((a, b) => (b.rarity - a.rarity) || ((b.edition ? 1 : 0) - (a.edition ? 1 : 0))).slice(0, 8);
    h += `<h3>Comment ça marche ?</h3><ol class="tr-how"><li>Inscrivez un compagnon habillé selon le thème.</li><li><b>4 manches</b>, une par jour (le dimanche, toutes celles qui restent). À chaque manche, un duel contre un joueur simulé de votre niveau, devant un juré différent.</li><li>Vous pouvez changer la tenue entre deux manches. Le classement final donne les récompenses.</li></ol>`;
    h += `<h3>Ce que le jury regarde</h3><ul class="ctcrit">${J.res.map(r => `<li class="${r.v >= 0.99 ? 'ok' : r.v > 0 ? 'mid' : ''}"><span class="ctck">${r.v >= 0.99 ? '✓' : r.v > 0 ? '½' : ''}</span><span>${esc(r.cr.txt)}</span></li>`).join('')}</ul>`;
    h += `<h3>Présenter un objet rare <small class="tr-opt">facultatif</small></h3><div class="tr-items">${rare.length ? rare.map(x => `<button class="tr-it ${ecoSelItem === x.id ? 'on' : ''}" data-eco-present="${x.id}" style="--rc:${RARC[x.rarity]}" aria-pressed="${ecoSelItem === x.id}"><span>${itemIcon(x)}</span><b>${esc(x.name)}</b><i>+${ecoPresentBonus(x)} pts</i></button>`).join('') : '<p class="small">Aucun objet rare dans le sac pour l’instant.</p>'}</div>`;
    h += `<div class="ctstage" style="--tint:${stTint(k)}"><div class="ctch">${drawChar(k, S.outfits[k], 'fier', 'trk' + k)}</div><div class="ctgo"><b>${CHARS[k].name} : ${String(J.avg).replace('.', ',')} / 5 aujourd’hui</b><span class="small">Inscription : ${ECO_TOUR_FEE} pièces. Ajustez la tenue à la garde-robe avant, ou entre les manches.</span><button class="btn green big" data-eco-reg="${k}" ${S.coins >= ECO_TOUR_FEE ? '' : 'disabled'}>Inscrire ${CHARS[k].name} · ${coins(ECO_TOUR_FEE)}</button><button class="btn cream sm" data-stgo="garde">Modifier la tenue</button></div></div>`;
  } else {
    const who = CHARS[T.who] ? T.who : k, open = ecoRoundOpen(), nr = T.rounds.length;
    h += `<div class="tr-prog">${Array.from({ length: ECO_ROUNDS }, (_, i) => { const r = T.rounds[i]; return `<span class="${r ? (r.win ? 'w' : 'l') : i === nr && open ? 'now' : ''}"><b>${i + 1}</b><i>${r ? (r.forfeit ? 'forfait' : r.win ? 'gagnée' : 'perdue') : i === ECO_ROUNDS - 1 ? 'grand jury' : ECO_TOUR_JURY[i % 3]}</i></span>`; }).join('')}</div>`;
    if (!T.final) {
      const j = nr % 3, jur = nr === ECO_ROUNDS - 1 ? null : ST_JURY[j];
      h += `<div class="ctstage" style="--tint:${stTint(who)}"><div class="ctch">${drawChar(who, S.outfits[who], 'fier', 'trw' + who)}</div><div class="ctgo"><b>Manche ${nr + 1} · ${jur ? `${jur.name} (${ECO_TOUR_JURY[j]})` : 'le grand jury'}</b><span class="small">${open ? `${CHARS[who].name} est prêt${typeof compE === 'function' ? compE(who) : ''} ? La tenue actuelle sera jugée.` : 'Prochaine manche demain : revenez pour le duel !'}</span><button class="btn green big" data-eco-play="1" ${open ? '' : 'disabled'}>${open ? 'Jouer la manche' : 'Demain'}</button><button class="btn cream sm" data-stgo="garde">Modifier la tenue</button></div></div>`;
    } else {
      const p = E.pend.find(x => x.id === 'tour:' + T.week);
      h += `<div class="tr-final"><span class="tr-rk">${T.rank}<small>${T.rank === 1 ? 'er' : 'e'}</small></span><div><b>${T.rank <= 3 ? 'Sur le podium !' : 'Tournoi terminé'}</b><span>${esc(ecoTourPrizeText(T.rank))}</span></div>${p ? `<button class="btn gold" data-eco-claim="${p.id}">Récupérer</button>` : '<span class="tagok">Récupéré</span>'}</div>`;
    }
    // classement
    const st = ecoStandings(T);
    h += `<h3>Classement <span class="eco-sim">joueurs simulés</span></h3><ol class="tr-tab">${st.map(x => `<li class="${x.me ? 'me' : ''}"><span class="tr-r">${x.rank}</span>${x.me ? `<img src="${portraitURI(T.who)}" alt="">` : `<img src="${ecoOppPortrait(T, x.i)}" alt="">`}<span class="tr-n"><b>${esc(x.n)}</b>${x.me ? '<i>vous</i>' : `<i>${esc(spName(x.sp))}${x.reg && typeof RG !== 'undefined' && RG[x.reg] ? ' · ' + esc(RG[x.reg].short) : ''} · simulé</i>`}</span><span class="tr-p">${x.pts} pts</span></li>`).join('')}</ol>`;
    if (T.rounds.length) h += `<h3>Vos duels</h3><ul class="tr-duels">${T.rounds.map(r => r.forfeit ? `<li class="l"><b>Manche ${r.i + 1}</b><span>Forfait (pas jouée à temps)</span></li>` : `<li class="${r.win ? 'w' : 'l'}"><b>Manche ${r.i + 1}</b><span>${r.me} contre ${r.them} · ${esc(T.field[r.opp].n)} (simulé)</span><em>${r.win ? 'Victoire' : 'Défaite'}</em></li>`).join('')}</ul>`;
  }
  // vitrine
  const tro = E.trophies.slice().reverse();
  h += `<h3>Récompenses</h3><ol class="ctlad tr-lad"><li><span class="ctls">1er</span><span>${esc(ecoTourPrizeText(1))}</span></li><li><span class="ctls">2e</span><span>${esc(ecoTourPrizeText(2))}</span></li><li><span class="ctls">3e</span><span>${esc(ecoTourPrizeText(3))}</span></li><li><span class="ctls">4e</span><span>${esc(ecoTourPrizeText(4))}</span></li><li><span class="ctls">5-8e</span><span>2 tickets</span></li><li><span class="ctls">9-16e</span><span>1 ticket</span></li></ol>`;
  if (tro.length) h += `<h3>Vitrine des trophées</h3><div class="cttro">${tro.slice(0, 12).map(t => `<div class="ctt m-${t.medal}"><svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.concours}</svg><b>${esc(t.theme)}</b><i>${t.rank}${t.rank === 1 ? 'er' : 'e'} · semaine ${t.wn} ${t.y}</i></div>`).join('')}</div>`;
  box.innerHTML = h;
}
let ecoSelItem = null;
function ecoDuelShow(rd) {
  const T = ecoTour() || ecoState().tour; if (!T || !rd) return;
  const O = T.field[rd.opp], who = T.who, jur = rd.j === 3 ? null : ST_JURY[rd.j];
  showModal(`<div class="tr-duel"><span class="ctrib">Manche ${rd.i + 1} · ${jur ? esc(jur.name) : 'Le grand jury'}</span><div class="tr-vs"><div class="tr-side me ${rd.win ? 'won' : ''}"><div class="tr-ch">${drawChar(who, S.outfits[who], rd.win ? 'amour' : 'triste', 'tdm')}</div><b>${esc(CHARS[who].name)}</b><span class="tr-sc" data-to="${rd.me}">0</span></div><span class="tr-x">VS</span><div class="tr-side op ${rd.win ? '' : 'won'}"><div class="tr-ch">${drawChar({ sp: O.sp, genes: O.genes, hybrid: null }, O.look, rd.win ? 'triste' : 'rire', 'tdo')}</div><b>${esc(O.n)}</b><i class="eco-sim">simulé</i><span class="tr-sc" data-to="${rd.them}">0</span></div></div><div class="tr-verd"><span class="ctjf">${stJuryFace(rd.i % 3)}</span><p>${esc(rd.line || '')}</p></div><div class="tr-res ${rd.win ? 'w' : 'l'}">${rd.win ? 'Victoire ! +3 points' : rd.them - rd.me <= 8 ? 'Défaite… de peu !' : 'Défaite : suivez mieux le thème !'}${T.final ? ` · classement final : ${T.rank}${T.rank === 1 ? 'er' : 'e'}` : ''}</div><button class="btn green big wide tr-ok" data-closemodal="1">${T.final ? 'Voir le classement' : 'Continuer'}</button></div>`);
  const els = document.querySelectorAll('.tr-sc'), t0 = performance.now(), dur = reduceMotion() ? 1 : 1300;
  const step = now => { const f = Math.min(1, (now - t0) / dur); els.forEach(e => { e.textContent = Math.round((+e.dataset.to) * (1 - Math.pow(1 - f, 3))); }); if (f < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  if (rd.win && T.final && T.rank <= 3 && typeof confetti === 'function') setTimeout(() => confetti(T.rank === 1), 1600);
}

// ---------- navigation : sous-onglets « Tournoi » (Compagnons) et « Capsules » (Village) ----------
if (typeof NAV_ICONS !== 'undefined') {
  NAV_ICONS.tournoi = NAV_ICONS.concours;
  NAV_ICONS.machine = '<rect x="7" y="16" width="16" height="11" rx="2" fill="#f08aa6" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="10" r="7.6" fill="#dff3f6" stroke="currentColor" stroke-width="2"/><circle cx="12.2" cy="10.4" r="2.3" fill="#f6c445" stroke="currentColor" stroke-width="1"/><circle cx="17" cy="8.4" r="2.1" fill="#9a6fd6" stroke="currentColor" stroke-width="1"/><circle cx="16.6" cy="12.8" r="2" fill="#5fbf7f" stroke="currentColor" stroke-width="1"/><rect x="16" y="19.5" width="5" height="5" rx="1.2" fill="#5b4636"/><circle cx="11" cy="22" r="2.4" fill="#fff8ea" stroke="currentColor" stroke-width="1.5"/>';
}
if (typeof TAB_ALIAS !== 'undefined') Object.assign(TAB_ALIAS, { concours: ['compagnons', 'tournoi'], tournoi: ['compagnons', 'tournoi'], machine: ['village', 'machine'], capsules: ['village', 'machine'], tirage: ['village', 'machine'] });
function ecoSyncTabs() {
  if (typeof SUBTABS === 'undefined') return;
  const on = ecoOn();
  const sync = (arr, entry) => { if (!arr) return; const i = arr.findIndex(x => x[0] === entry[0]); if (on && i < 0) arr.push(entry); if (!on && i >= 0) arr.splice(i, 1); };
  sync(SUBTABS.compagnons, ['tournoi', 'Tournoi', 'tournoi']);
  sync(SUBTABS.village, ['machine', 'Capsules', 'machine']);
}
if (typeof renderPanel === 'function') renderPanel = (orig => function () {
  try {
    ecoSyncTabs();
    if (!ecoOn()) { if (compView === 'tournoi') compView = 'garde'; if (villView === 'machine') villView = 'refuge'; if (tab === 'menu') ecoView = null; }
  } catch (e) {}
  return orig.apply(this, arguments);
})(renderPanel);
if (typeof subDot === 'function') subDot = (orig => function (t, k) {
  try { if (t === 'village' && k === 'machine') return ecoMachineDot(); if (t === 'compagnons' && k === 'tournoi') return ecoTourDot(); } catch (e) {}
  return orig.apply(this, arguments);
})(subDot);
if (typeof renderVillageTab === 'function') renderVillageTab = (orig => function (box) {
  if (villView === 'machine' && ecoOn()) return ecoRenderMachine(box);
  return orig.apply(this, arguments);
})(renderVillageTab);
function ecoGo(where) {
  if (!ecoOn()) return;
  if (where === 'event') return ecoOpenEvent();
  if (where === 'machine' || where === 'machine-ev') { if (where === 'machine-ev' && ecoActive()) ecoBanner = 'ev'; ecoView = null; villView = 'machine'; openSheet('village', true); $('panelBody').scrollTop = 0; return; }
  if (where === 'tournoi') { ecoView = null; if (typeof openCompagnons === 'function') openCompagnons('tournoi'); else { compView = 'tournoi'; openSheet('compagnons', true); } }
}

// ---------- clics ----------
document.addEventListener('click', ev => {
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.ecoClaim) { ecoClaim(d.ecoClaim); renderMenuDot(); renderPanel(); return; }
  if (d.ecoGo) { if (d.ecoGo === 'event' && $('modal')) $('modal').hidden = true; ecoGo(d.ecoGo); return; }
  if (d.ecoBack) { ecoView = null; renderPanel(); $('panelBody').scrollTop = 0; return; }
  if (d.ecoBuy) { ecoBuyEv(d.ecoBuy); return; }
  if (d.ecoPlace) { const p = PLACES[+d.ecoPlace]; if (p) { closeSheet(); if (typeof goToPlace === 'function') goToPlace(p); } return; }
  if (d.ecoBan) { ecoBanner = d.ecoBan; renderPanel(); return; }
  if (d.ecoPull) { ecoDoPull(d.ecoPull); return; }
  if (d.ecoAgain) { $('modal').hidden = true; ecoBanner = d.ecoAgain; ecoDoPull('1'); return; }
  if (d.ecoOpen !== undefined) { ecoOpenCap(el, +d.ecoOpen); return; }
  if (d.ecoOpenall) { const st = el.closest('.cp-stage'); st.querySelectorAll('.cp-cap:not(.open)').forEach((b, i) => setTimeout(() => ecoOpenCap(b, +b.dataset.ecoOpen), reduceMotion() ? 0 : i * 160)); return; }
  if (d.ecoEx) { const r = +d.ecoEx[0], n = ecoExchange(r, d.ecoEx.length > 1); if (n) { toast(`+${ecoPl(n, 'ticket', 'tickets')} ! Vos doublons repartent dans le monde.`); renderTop(); renderPanel(); } return; }
  if (d.ecoPresent) { ecoSelItem = ecoSelItem === d.ecoPresent ? null : d.ecoPresent; renderPanel(); return; }
  if (d.ecoReg) { if (ecoTourRegister(d.ecoReg, ecoSelItem)) { ecoSelItem = null; renderTop(); renderPanel(); toast(`${CHARS[d.ecoReg].name} est inscrit${compE(d.ecoReg)} ! Première manche : quand vous voulez.`); } return; }
  if (d.ecoPlay) { const rd = ecoTourPlay(); if (rd) { renderAll(); ecoDuelShow(rd); } return; }
});
document.addEventListener('change', ev => {
  const t = ev.target; if (!t || !t.dataset || !t.dataset.ecoKeep) return;
  ecoState().keep = Math.max(1, Math.min(10, +t.value || 3)); save(); renderPanel();
});

// ---------- mise en place ----------
(function ecoInit() {
  try {
    ecoState(); ecoSyncRecipes(); ecoCheckEnds(); ecoTour();
    ecoSyncTabs();
  } catch (e) { console.error('eco', e); }
})();
setInterval(() => { try { if (!window.__jeuReady) return; ecoCheckEnds(); const T = ecoState().tour; if (T && T.week !== ecoWeek().key) { ecoTour(); renderMenuDot(); } } catch (e) {} }, 30e3);

// ---------- styles ----------
(function ecoCSS() {
  const st = document.createElement('style'); st.id = 'ecoCSS';
  st.textContent = `
.eco-tk{width:20px;height:20px;vertical-align:-5px}
.eco-tkn{display:inline-flex;align-items:center;gap:3px;font:800 15px var(--display)}
.eco-gl{width:24px;height:24px;flex:none}.eco-gl.sm{width:17px;height:17px;vertical-align:-3px}
.eco-kick{display:inline-block;font:800 11px/1.3 var(--display);letter-spacing:.06em;text-transform:uppercase;color:var(--rust)}
.eco-sim,.tr-n i.sim{display:inline-block;font:800 10px/1.5 var(--display);letter-spacing:.04em;text-transform:uppercase;background:#ece6f6;color:#6a5a8a;border-radius:999px;padding:0 7px;vertical-align:2px}
.eco-evc{display:flex;align-items:center;gap:10px;background:linear-gradient(110deg,var(--ec2),#fffaf0 75%);border:2.5px solid var(--ec);border-radius:16px;padding:8px 10px;box-shadow:0 3px 0 rgba(74,53,40,.18)}
.eco-evi{flex:none;width:46px;height:46px;border-radius:14px;background:#fff;border:2.5px solid var(--ink);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 var(--ink)}
.eco-evi svg{width:32px;height:32px}
.eco-evx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.eco-evx>b{font:800 17px/1.15 var(--display)}
.eco-evd{font-size:12.5px;color:var(--ink2);line-height:1.3}
.eco-res{display:inline-flex;align-items:center;gap:3px;font:800 13.5px var(--display);color:var(--ink)}
.eco-next{display:flex;align-items:center;gap:8px;background:#fffaf0;border:2px dashed var(--line);border-radius:14px;padding:7px 10px;font-size:13.5px;margin-top:6px}
.eco-dots i.tk{background:#fff3c4}
.eco-mri img{width:30px;height:33px;object-fit:contain}
.eco-mach svg{width:26px;height:26px}
.mrow .mri.eco-mach{display:flex;align-items:center;justify-content:center}
.eco-back{background:none;border:0;font:800 14px var(--display);color:var(--teal);padding:2px 0;cursor:pointer;align-self:flex-start}
.eco-hero{position:relative;text-align:center;background:radial-gradient(circle at 50% 0,#fff 0,var(--ec2) 60%);border:3px solid var(--ink);border-radius:22px;padding:14px 14px 12px;box-shadow:0 4px 0 rgba(74,53,40,.35);overflow:hidden}
.eco-hero::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent 0 18px,rgba(255,255,255,.35) 18px 22px);pointer-events:none}
.eco-hi{position:relative;width:62px;height:62px;margin:0 auto 4px;background:#fff;border:3px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 var(--ink),0 0 0 6px var(--ec)}
.eco-hi svg{width:42px;height:42px}
.eco-hero h2{position:relative;margin:4px 0 2px;font:800 26px/1.05 var(--display)}
.eco-hero p{position:relative;margin:0 auto;max-width:42ch;color:var(--ink2);font-size:14px;line-height:1.38}
.eco-dates{position:relative;display:inline-block;margin-top:7px;background:#fff;border:2px solid var(--ink);border-radius:999px;padding:1px 11px;font:800 12.5px var(--display)}
.eco-resbar{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:6px 12px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.eco-resbig{display:flex;align-items:center;gap:6px}.eco-resbig svg{width:34px;height:34px}.eco-resbig b{font:800 26px var(--display)}.eco-resbig i{font:700 13px var(--display);font-style:normal;color:var(--ink2)}
.eco-how{margin:0;padding-left:18px;font-size:13.5px;line-height:1.45}
.eco-places{display:flex;flex-wrap:wrap;gap:6px}
.eco-pl{display:flex;flex-direction:column;align-items:flex-start;background:#fff;border:2px solid var(--ink);border-radius:12px;padding:3px 10px;cursor:pointer;font:800 13.5px var(--display);color:var(--ink);box-shadow:0 2px 0 var(--ink)}
.eco-pl small{font:600 11px var(--body);color:var(--muted)}
.eco-note{margin:0}
.eco-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.eco-art{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;background:#fff;border:2.5px solid var(--rc);border-radius:16px;padding:8px 6px;box-shadow:0 3px 0 var(--rc)}
.eco-art.r3{background:radial-gradient(circle at 50% 30%,#f6efff,#fff 70%)}
.eco-aic{width:56px;height:56px;display:flex;align-items:center;justify-content:center}.eco-aic svg{width:100%;height:100%}
.eco-art b{font:800 13px/1.15 var(--display)}.eco-art>i{font:700 11px var(--body);font-style:normal}
.eco-asub{font-size:11px;color:var(--muted);line-height:1.25;min-height:2.5em}
.eco-art .btn{margin-top:3px;display:inline-flex;align-items:center;gap:4px}
.eco-mbanner{display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#ffe1ec,#fff3c4);border:2.5px solid var(--ink);border-radius:16px;padding:8px 10px}
.eco-mbanner>span svg{width:38px;height:38px}.eco-mbanner div{flex:1;display:flex;flex-direction:column;min-width:0}.eco-mbanner b{font:800 15px var(--display)}.eco-mbanner div span{font-size:12.5px;color:var(--ink2)}
.eco-ed{display:inline-block;font:800 10.5px/1.5 var(--display);font-style:normal;background:#fff3c4;color:#9a6200;border:1.5px solid #e3b04b;border-radius:999px;padding:0 6px;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;vertical-align:1px}
.eco-dated{display:flex;gap:8px;align-items:flex-start;background:#fff8e1;border:2px solid #e3b04b;border-radius:12px;padding:6px 9px;margin:6px 0;font-size:13px;line-height:1.35;text-align:left}
.eco-dated svg{width:26px;height:26px;flex:none}
.eco-rb{font:800 10.5px var(--display);font-style:normal;background:#f6d2e6;color:#9a3a6a;border-radius:999px;padding:0 6px}
/* machine */
.cm-wrap{display:flex;flex-direction:column;gap:10px}
.cm-head{display:flex;gap:10px;align-items:center;background:radial-gradient(circle at 30% 20%,#fff 0,#fde6ef 55%,#e6f3f6 100%);border:3px solid var(--ink);border-radius:22px;padding:8px 12px 8px 6px;box-shadow:0 4px 0 rgba(74,53,40,.35)}
.cm-mach{width:118px;flex:none}.cm-svg{width:100%;height:auto;display:block}
.cm-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cm-side h2{margin:0;font:800 23px/1.05 var(--display)}.cm-side p{margin:0;font-size:13.5px;color:var(--ink2);line-height:1.3}
.cm-tk{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-top:4px;background:#fff;border:2.5px solid var(--ink);border-radius:999px;padding:2px 12px 2px 6px;box-shadow:0 2px 0 var(--ink);font:700 13px var(--display)}
.cm-tk .eco-tkn{font-size:20px}.cm-tk .eco-tk{width:26px;height:26px}
.cm-bans{display:flex;gap:6px}
.cm-bans button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:0;background:#fffaf0;border:2.5px solid var(--line);border-radius:14px;padding:5px 6px;cursor:pointer;color:var(--ink)}
.cm-bans button b{font:800 14px/1.15 var(--display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.cm-bans button small{font:600 11px var(--body);color:var(--muted)}
.cm-bans button[aria-selected="true"]{background:#fff;border-color:var(--ink);box-shadow:0 3px 0 var(--ink)}
.cm-bans button[data-eco-ban="ev"][aria-selected="true"]{background:linear-gradient(180deg,#fff,#fff0dc);border-color:var(--ec)}
.cm-bdesc{margin:0;font-size:13.5px;color:var(--ink2);text-align:center}
.cm-pity{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cm-pity>div{background:#fff;border:2px solid var(--line);border-radius:12px;padding:5px 9px;display:flex;flex-direction:column;gap:1px}
.cm-pity span{font-size:11.5px;color:var(--muted);line-height:1.2}.cm-pity b{font:800 16px var(--display)}
.cm-bar{display:block;height:7px;background:#f1e4c8;border-radius:999px;overflow:hidden;margin-top:2px}.cm-bar>i{display:block;height:100%;border-radius:999px}
.cm-go{display:flex;gap:8px}
.cm-go .btn{display:flex;flex-direction:column;align-items:center;line-height:1.1}
.cm-go .btn.big{flex:1}.cm-go small{display:inline-flex;align-items:center;gap:3px;font:700 12px var(--display);opacity:.9}
.cm-go small .eco-tk,.cp-acts small .eco-tk{width:16px;height:16px;vertical-align:-3px}
.cm-lux{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff8e1;border:2px dashed var(--goldD);border-radius:14px;padding:6px 10px}
.cm-lux>span{display:flex;align-items:center;gap:8px}.cm-lux>span>svg{width:28px;height:28px}.cm-lux>span>span{display:flex;flex-direction:column}.cm-lux b{font:800 14px var(--display)}.cm-lux small{font-size:12px;color:var(--ink2)}
.cm-rates,.cm-pool{background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 10px}
.cm-rates summary,.cm-pool summary{cursor:pointer;font:800 14px var(--display)}
.cm-rt{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:6px 0 2px}
.cm-rt span{display:flex;flex-direction:column;align-items:center;font:700 11px/1.2 var(--display);color:var(--rc);text-align:center}
.cm-rt span i{width:20px;height:20px;border-radius:50%;background:var(--rc);border:2px solid var(--ink);margin-bottom:2px}
.cm-rt b{font:800 15px var(--display);color:var(--ink)}
.cm-pr{display:flex;gap:8px;font-size:12.5px;line-height:1.35;padding:3px 0;border-top:1px dashed var(--line)}.cm-pr b{flex:none;width:86px;font:800 12.5px var(--display)}
.cm-h{margin:6px 0 0}
.cm-ex{margin:0}
.cm-exs{display:flex;flex-direction:column;gap:6px}
.cm-exr{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 8px}
.cm-exi{flex:none;width:40px;height:40px;border-radius:10px;border:2px solid var(--rc);display:flex;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;background:#fffaf0}.cm-exi svg{width:100%;height:100%}
.cm-exr>div:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column}.cm-exr b{font:800 13.5px var(--display)}.cm-exr span{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-exb{display:flex;flex-direction:column;gap:4px}
.cm-keep{font-size:12.5px;color:var(--ink2)}.cm-keep select{font:700 13px var(--display);border:2px solid var(--line);border-radius:8px;background:#fff}
.cm-earn{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.cm-earn li{background:#fffaf0;border:2px solid var(--line);border-radius:12px;padding:5px 9px;display:flex;flex-direction:column}.cm-earn b{font:800 13px var(--display)}.cm-earn span{font-size:12px;color:var(--ink2)}
.cm-svg.run .cm-crank{transform-box:fill-box;transform-origin:50% 50%;animation:cmCrank .9s cubic-bezier(.5,0,.4,1)}
.cm-svg.run .cm-caps{animation:cmShake .9s ease-in-out}
@keyframes cmCrank{to{transform:rotate(360deg)}}
@keyframes cmShake{20%{transform:translate(-3px,2px) rotate(-2deg)}40%{transform:translate(3px,-1px) rotate(2deg)}60%{transform:translate(-2px,1px)}80%{transform:translate(2px,0)}}
/* ouverture */
.cp-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.cp-mach{width:150px;margin-bottom:-60px}
.cp-cap{position:relative;z-index:2;width:118px;height:118px;padding:0;border:0;background:none;cursor:pointer;opacity:0;animation:cpDrop .75s cubic-bezier(.3,1.4,.5,1) .85s forwards;filter:drop-shadow(0 5px 0 rgba(74,53,40,.3))}
.cp-cap::before{content:"";position:absolute;inset:-14px;border-radius:50%;background:radial-gradient(circle,var(--rc) 0,transparent 68%);opacity:.45;z-index:-1}
.cp-cap.r3::before,.cp-cap.r4::before{opacity:.85;animation:cpGlow 1s ease-in-out infinite alternate}
.cp-cap.r4::after{content:"";position:absolute;inset:-34px;z-index:-2;background:repeating-conic-gradient(from 0deg,rgba(242,193,78,.55) 0 10deg,transparent 10deg 30deg);border-radius:50%;animation:rays 5s linear infinite}
.cp-svg{width:100%;height:100%;overflow:visible}
.cp-cap:not(.open) .cp-svg{animation:cpWob 1.4s ease-in-out 1.7s infinite}
.cp-top,.cp-bot,.cp-band{transform-box:fill-box;transition:transform .45s cubic-bezier(.3,1.2,.5,1),opacity .45s}
.cp-cap.open .cp-top{transform:translate(-18px,-46px) rotate(-38deg);opacity:0}
.cp-cap.open .cp-bot{transform:translateY(30px);opacity:0}.cp-cap.open .cp-band{opacity:0}
.cp-cap.gone{display:none}
.cp-hint{margin:0;font:800 15px var(--display);color:var(--ink2)}
.cp-out{display:flex;flex-direction:column;align-items:center;gap:8px}
.cp-out .hcard{width:150px;padding:12px 8px 10px}.cp-out .hcard .hico{width:76px;height:76px}
.cp-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.cp-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;width:100%;max-width:420px}
.cp-cap.mini{width:100%;height:auto;aspect-ratio:1/1;animation:cpDrop .6s cubic-bezier(.3,1.4,.5,1) var(--d,0s) forwards}
.cp-cap.mini.open{display:none}
.cp-grid{width:100%}
@keyframes cpDrop{0%{opacity:0;transform:translateY(-90px) scale(.5)}60%{opacity:1;transform:translateY(8px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes cpWob{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg)}40%{transform:rotate(7deg)}60%{transform:rotate(-4deg)}}
@keyframes cpGlow{from{transform:scale(.92)}to{transform:scale(1.08)}}
/* tournoi */
.tr-how{margin:0;padding-left:20px;font-size:13.5px;line-height:1.45}
.tr-opt{font:700 11px var(--display);color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.tr-items{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
.tr-it{flex:none;width:96px;display:flex;flex-direction:column;align-items:center;gap:1px;background:#fff;border:2.5px solid var(--line);border-radius:14px;padding:5px 4px;cursor:pointer;color:var(--ink);text-align:center}
.tr-it span{width:40px;height:40px}.tr-it span svg{width:100%;height:100%}
.tr-it b{font:700 11.5px/1.15 var(--display);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tr-it i{font:800 11px var(--display);font-style:normal;color:var(--greenD)}
.tr-it.on{border-color:var(--rc);background:#fffaf0;box-shadow:0 3px 0 var(--rc)}
.tr-prog{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.tr-prog span{display:flex;flex-direction:column;align-items:center;background:#fff;border:2.5px solid var(--line);border-radius:14px;padding:4px 2px;text-align:center}
.tr-prog b{width:26px;height:26px;border-radius:50%;background:#efe4d0;border:2px solid var(--ink);font:800 14px/22px var(--display)}
.tr-prog i{font:700 10.5px/1.2 var(--display);font-style:normal;color:var(--muted)}
.tr-prog .w{border-color:var(--greenD);background:#f1faf3}.tr-prog .w b{background:var(--green);color:#fff}
.tr-prog .l b{background:#e7dcc4}
.tr-prog .now{border-color:var(--ink);background:#fff3c4;animation:pulse .8s ease-in-out infinite alternate}.tr-prog .now b{background:var(--gold)}
.tr-final{display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#fff3c4,#ffe1ec);border:3px solid var(--ink);border-radius:18px;padding:8px 12px;box-shadow:0 4px 0 rgba(74,53,40,.35)}
.tr-rk{font:800 40px/1 var(--display);color:var(--goldD);-webkit-text-stroke:1.5px var(--ink)}.tr-rk small{font-size:18px}
.tr-final>div{flex:1;display:flex;flex-direction:column}.tr-final b{font:800 17px var(--display)}.tr-final span{font-size:13px;color:var(--ink2)}
.tr-tab{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
.tr-tab li{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:2px 9px 2px 4px}
.tr-tab li:nth-child(-n+3){background:#fffaf0;border-color:#e9cf8a}
.tr-tab li.me{background:#e6f6e9;border-color:var(--greenD);box-shadow:0 2px 0 var(--greenD)}
.tr-r{flex:none;width:24px;text-align:center;font:800 15px var(--display);color:var(--ink2)}
.tr-tab img{width:30px;height:33px;flex:none;object-fit:contain}
.tr-n{flex:1;min-width:0;display:flex;flex-direction:column}.tr-n b{font:800 13.5px/1.15 var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr-n i{font:600 11px var(--body);font-style:normal;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-p{flex:none;font:800 14px var(--display)}
.tr-duels{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.tr-duels li{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:4px 9px;font-size:13px}
.tr-duels li b{font:800 13px var(--display);flex:none}.tr-duels li span{flex:1;min-width:0;color:var(--ink2)}.tr-duels li em{font:800 12px var(--display);font-style:normal}
.tr-duels li.w em{color:var(--greenD)}.tr-duels li.l em{color:var(--rust)}
.tr-duel{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.tr-vs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;width:100%}
.tr-side{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:2.5px solid var(--line);border-radius:18px;padding:6px 4px;transition:all .4s;animation:ctIn .45s cubic-bezier(.3,1.5,.5,1) both}
.tr-side.op{animation-delay:.15s}
.tr-ch{width:100%;max-width:130px}.tr-ch svg{width:100%;height:auto;display:block}
.tr-side b{font:800 14px/1.1 var(--display);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-sc{font:800 30px/1 var(--display)}
.tr-side.won{animation:trWin .5s ease 1.4s forwards}
@keyframes trWin{to{border-color:var(--goldD);background:#fff8dc;box-shadow:0 0 0 4px rgba(246,196,69,.6),0 4px 0 var(--goldD)}}
.tr-x{font:800 22px var(--display);color:var(--rust);-webkit-text-stroke:1px var(--ink)}
.tr-verd{display:flex;gap:8px;align-items:flex-start;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 9px;text-align:left;animation:ctIn .45s cubic-bezier(.3,1.5,.5,1) 1.3s both}.tr-verd p{margin:0;font-size:13px;line-height:1.3;color:var(--ink2)}
.tr-res{font:800 19px var(--display);animation:ctIn .45s cubic-bezier(.3,1.5,.5,1) 1.6s both}.tr-res.w{color:var(--greenD)}.tr-res.l{color:var(--rust)}
.tr-ok{animation:ctIn .3s ease 1.8s both}
.tr-hero .ctmeta span:first-child{color:var(--ink2)}
@media (max-width:420px){.cm-mach{width:96px}.cm-side h2{font-size:20px}.eco-shop{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-pr b{width:74px}.tr-sc{font-size:26px}.cp-row{gap:5px}}
@media (prefers-reduced-motion:reduce){.cp-cap,.cp-cap.mini{animation:none;opacity:1}.cp-cap .cp-svg,.cp-cap::after,.cp-cap::before{animation:none!important}.cm-svg.run .cm-crank,.cm-svg.run .cm-caps,.tr-side,.tr-verd,.tr-res,.tr-ok{animation:none}}
`;
  document.head.appendChild(st);
})();

// ---------- pour les tests et la simulation ----------
window.__eco = {
  S: () => ecoState(), active: ecoActive, next: ecoNext, year: ecoYear, occ: ecoOcc, events: ECO_EVENTS, pull: ecoPull, surplus: ecoSurplus, exchange: ecoExchange,
  tickets: () => ecoState().tickets, addTickets: n => { ecoAddTickets(n); save(); }, pending: ecoPending, claim: ecoClaim, buy: ecoBuyEv, shop: () => { const o = ecoActive(); return o ? ecoShop(o) : []; },
  tour: ecoTour, register: ecoTourRegister, play: ecoTourPlay, standings: () => ecoTour() && ecoStandings(ecoTour()), go: ecoGo, openEvent: ecoOpenEvent, duel: ecoDuelShow, show: ecoPullShow,
  on: ecoOn, birthdays: ecoBirthdays, monthGift: ecoMonthGift, checkEnds: ecoCheckEnds, setBanner: b => { ecoBanner = b; },
  // simulation : un joueur qui utilise les nouveaux systèmes
  claimAllGifts: () => { for (const p of ecoPending()) ecoClaim(p.id, true); },
  botExchange: () => { ecoExchange(0, true); ecoExchange(1, true); },
  botPull: () => { const E = ecoState(); const bn = ecoActive() ? 'ev' : 'perm'; if (E.tickets) ecoPull(bn, E.tickets, 'ticket'); if (S.coins > 900 && E.lux !== dayNum()) ecoPull(bn, 1, 'lux'); },
  botEventShop: () => { const o = ecoActive(); if (!o) return; for (const a of ecoShop(o)) { const v = ecoEvState(o); while ((v.bought[a.id] || 0) < a.lim && v.res >= a.price) { if (!ecoBuyEv(a.id)) break; } } },
  botTournament: () => { if (!ecoTour() && S.coins > 100) { const k = teamIds()[0]; try { const it = S.inv.filter(x => x.cat === 'v' && x.look).sort((a, b) => b.rarity - a.rarity); for (const sl of ['tete', 'cou', 'haut', 'bas', 'mains', 'pieds', 'dos']) { const x = it.find(y => y.sub === sl); if (x) styleEquip(k, x, true); } } catch (e) {} ecoTourRegister(k, (S.inv.filter(x => x.rarity >= 3)[0] || {}).id); } if (ecoRoundOpen()) ecoTourPlay(); },
  botStats: () => { const E = ecoState(); return Object.assign({ tickets: E.tickets, evRes: Object.values(E.evs).reduce((a, v) => a + (v.got || 0), 0), tour: E.tour && { pts: E.tour.pts, rank: E.tour.rank, rounds: E.tour.rounds.length } }, E.st); },
};

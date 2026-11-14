// ================= 74 · LA MAISON DE POUPÉE (v47-v48, étape 1) =================
// Le joueur : « au foyer il y a beaucoup de choses et on doit trop défiler pour améliorer ; la 3D est sympa mais ne sert
// à rien ». Décision (14/11) : une maison vue en coupe (maison de poupée, 2D) ; on touche une pièce et on y entre vraiment
// (esprit « planque de Tarkov ») : son niveau, ce qu'elle fait, ce qu'il faut pour l'améliorer, et ce qu'on y fait.
// v48 : la première version (rectangles vides avec un « + ») a été jugée « beaucoup trop simpliste, horrible » → chaque
// pièce est DESSINÉE (meubles, lumière, animations), les meubles s'ajoutent avec le niveau, les compagnons restés à la
// maison se voient dans la pièce de leur poste, et l'intérieur d'une pièce reprend le même dessin en grand.
// Rien n'est réécrit côté règles : les blocs existants (constructions de 48, jardin/nurserie/postes de 31-40, la vue 3D
// de 49 pour décorer le salon) sont rangés dans leur pièce.
let hmRoom = null;
const HM_W = 136, HM_H = 80, HM_K = '#4a3528';
const HM_ROOMS = [
  // id, nom, construction (48 PG_B), blocs déplacés depuis l'ancien foyer, position [x, y, échelle], mur, « lock » = pièce fermée tant que niveau 0
  { id: 'observ', nm: 'Observatoire', b: 'observ', blocks: [], p: [129, 74, 0.75], wall: '#39457a', lock: 1 },
  { id: 'chambres', nm: 'Chambres', b: 'chambre', blocks: ['.fw-head', '.fw-posts', '.fy2-list', '.rfg'], p: [44, 142, 1], wall: '#f6dbe6' },
  { id: 'nurserie', nm: 'Nurserie', b: null, blocks: ['.fy2-nur'], p: [184, 142, 1], wall: '#fdeccd' },
  { id: 'salon', nm: 'Salon', b: 'cheminee', blocks: ['.f3'], p: [44, 226, 1], wall: '#f8dfc4' },
  { id: 'cuisine', nm: 'Cuisine', b: 'repas', blocks: [], p: [184, 226, 1], wall: '#dcedd6', lock: 1 },
  { id: 'atelier', nm: 'Atelier', b: 'atelier', blocks: [], p: [44, 310, 1], wall: '#e9dcc8' },
  { id: 'jardin', nm: 'Jardin', b: 'serre', blocks: ['.fy2-jar'], p: [184, 310, 1], wall: '#cfeaf5' },
];
const HM_INFO = {
  observ: 'Annonce à l’avance les moments rares du ciel.',
  chambres: 'Vos familiers qui ne voyagent pas vivent ici : donnez-leur un poste.',
  nurserie: 'Les œufs éclosent ici. Agrandissez-la pour accueillir plus de familiers.',
  salon: 'Décorez : le confort rend vos compagnons plus efficaces en voyage.',
  cuisine: 'Nourrir vos compagnons ici leur donne plus d’expérience.',
  atelier: 'Fabriquez objets, matériel et décorations.',
  jardin: 'Semez des graines : elles poussent même pendant vos voyages.',
};
const HM_EMOJI = { observ: '🔭', chambres: '🛏️', nurserie: '🥚', salon: '🛋️', cuisine: '🍳', atelier: '🔨', jardin: '🌱' };
const hm$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
const hmLvl = R => R.b ? Math.max(0, Math.min(3, hm$(() => pgLvl(R.b), 0))) : 1;
const hmNight = () => { const h = new Date().getHours(); return h >= 20 || h < 7; };
function hmDot(R) {
  if (R.b && hm$(() => pgLvl(R.b) < 3 && pgCan(R.b).ok, false)) return true;
  if (R.id === 'nurserie' && (S.eggs || []).some(e => e && e.ready <= Date.now())) return true;
  return false;
}
// qui est dans quelle pièce : selon le poste donné au foyer (40)
function hmWho() {
  const W = {}, put = (r, k) => { (W[r] = W[r] || []).push(k); };
  const cuis = hm$(() => pgLvl('repas') > 0, false);
  let alt = 0;
  hm$(() => fwHome(), []).forEach(k => {
    const j = hm$(() => fwJob(k), 'repos');
    if (j === 'jard') put('jardin', k); else if (j === 'comm') put(cuis ? 'cuisine' : 'atelier', k); else if (j === 'nurs') put('nurserie', k);
    else put(alt++ % 2 ? 'salon' : 'chambres', k);
  });
  return W;
}
// ---------------- le dessin des pièces (repère 136 × 80, sol à y = 68) ----------------
const hmR = (x, y, w, h, f, rx = 0, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${HM_K}" stroke-width="1.3" ${o}/>`;
const hmP = (d, f, o = '') => `<path d="${d}" fill="${f}" stroke="${HM_K}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" ${o}/>`;
const HM_DEFS = `<defs>
  <pattern id="hmStripe" width="10" height="10" patternUnits="userSpaceOnUse"><rect x="0" width="4" height="10" fill="#fff" opacity=".28"/></pattern>
  <pattern id="hmDots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="#fff" opacity=".55"/><circle cx="9" cy="9" r="1.3" fill="#fff" opacity=".55"/></pattern>
  <pattern id="hmBrick" width="10" height="6" patternUnits="userSpaceOnUse"><path d="M0 0H10M0 3H10M5 0V3M0 3V6M10 3V6" stroke="#8f4a36" stroke-width=".7" fill="none"/></pattern>
  <pattern id="hmTile" width="14" height="9" patternUnits="userSpaceOnUse"><path d="M0 0 Q7 9 14 0" fill="none" stroke="#a84a36" stroke-width="1.1"/></pattern>
  <pattern id="hmGlass" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M0 0H17M0 0V17" stroke="#fff" stroke-width="1.4" fill="none"/></pattern>
</defs>`;
function hmBase(wall, pat, floor = '#d8b48a') {
  return `<rect width="${HM_W}" height="${HM_H}" fill="${wall}"/>${pat ? `<rect width="${HM_W}" height="68" fill="url(#${pat})"/>` : ''}
    <rect y="64.5" width="${HM_W}" height="3.5" fill="#fffaf0" opacity=".8"/><rect y="68" width="${HM_W}" height="12" fill="${floor}"/>
    <path d="M0 68H136M0 74H136M22 68V74M58 74V80M94 68V74M118 74V80" stroke="${HM_K}" stroke-width=".8" opacity=".45" fill="none"/><path d="M0 68H136" stroke="${HM_K}" stroke-width="1.3"/>`;
}
const hmWin = (x, y) => `<g transform="translate(${x} ${y})"><rect width="22" height="22" rx="2" class="hm-win" stroke="${HM_K}" stroke-width="1.3"/><path d="M11 0V22M0 11H22" stroke="${HM_K}" stroke-width="1"/><path d="M-2 -1 Q3 9 -2 20Z M24 -1 Q19 9 24 20Z" fill="#fff" stroke="${HM_K}" stroke-width="1"/><path d="M-4 -2H26" stroke="${HM_K}" stroke-width="1.6" stroke-linecap="round"/></g>`;
const hmBed = (x, col, flip) => `<g transform="translate(${x} 0)${flip ? ' translate(46 0) scale(-1 1)' : ''}">${hmR(0, 38, 5, 30, '#b98a5e', 2)}${hmR(40, 52, 4, 16, '#b98a5e', 1.5)}${hmR(3, 56, 40, 8, '#c99a6a', 1)}${hmR(4, 49, 39, 9, '#fffdf7', 3)}<ellipse cx="12" cy="48.5" rx="7" ry="3.6" fill="#fff" stroke="${HM_K}" stroke-width="1.1"/>${hmR(20, 47, 23, 13, col, 3)}<path d="M20 52H43" stroke="#fff" stroke-width="1.6" opacity=".7"/></g>`;
const hmPlant = (x, y = 68, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${hmP('M-3 -12 Q-10 -20 -6 -26 Q-1 -20 -1 -12Z M1 -12 Q2 -24 8 -27 Q9 -18 3 -11Z M0 -12 Q-1 -22 1 -30 Q4 -22 2 -12Z', '#6fbf73')}${hmP('M-5 -12H5L3.5 0H-3.5Z', '#d98a5f')}</g>`;
const HM_DRAW = {
  chambres(l) {
    return hmBase('#f6dbe6', 'hmStripe') + hmWin(57, 16)
      + `<ellipse cx="68" cy="74" rx="20" ry="3.6" fill="#f7b9cc" stroke="${HM_K}" stroke-width="1"/>`
      + hmBed(6, '#f29cb0') + (l >= 1 ? hmBed(84, '#8fc3e8', 1) : hmPlant(118) + hmR(96, 56, 14, 12, '#c99a6a', 1.5))
      + `<g transform="translate(62 0)">${hmR(0, 55, 12, 13, '#c99a6a', 1.5)}<circle cx="6" cy="61" r="1.2" fill="${HM_K}"/><path d="M6 55V49" stroke="${HM_K}" stroke-width="1.3"/><circle cx="6" cy="46" r="11" fill="#ffe27a" opacity=".3" class="hm-glow"/>${hmP('M1 49L3 42H9L11 49Z', '#ffd866')}</g>`
      + (l >= 2 ? `${hmR(90, 22, 36, 3, '#b98a5e', 1)}${hmR(93, 13, 4, 9, '#e0685a')}${hmR(97, 15, 4, 7, '#6fa8dc')}${hmR(101, 12, 4, 10, '#f2c14e')}${hmR(105, 16, 5, 6, '#7fc38a')}<circle cx="118" cy="17" r="5" fill="#f6c7a0" stroke="${HM_K}" stroke-width="1.1"/><circle cx="114.5" cy="12.5" r="2" fill="#f6c7a0" stroke="${HM_K}" stroke-width="1"/><circle cx="121.5" cy="12.5" r="2" fill="#f6c7a0" stroke="${HM_K}" stroke-width="1"/>` : '')
      + (l >= 3 ? `<path d="M4 6 Q34 16 68 7 Q102 16 132 6" fill="none" stroke="${HM_K}" stroke-width="1"/>${[[16, 10, '#e0685a'], [32, 12, '#f2c14e'], [48, 11, '#7fc38a'], [86, 11, '#6fa8dc'], [102, 12, '#e0685a'], [118, 10, '#f2c14e']].map(([x, y, c]) => hmP(`M${x - 3} ${y}H${x + 3}L${x} ${y + 6}Z`, c)).join('')}${hmP('M20 22l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z', '#ffd866')}` : '');
  },
  nurserie() {
    const eggs = (S.eggs || []).filter(Boolean), now = Date.now(), n = Math.min(3, eggs.length);
    let e = '';
    for (let i = 0; i < n; i++) { const rdy = eggs[i].ready <= now; e += `<g class="hm-egg${rdy ? ' rdy' : ''}" style="--i:${i}"><ellipse cx="${28 + i * 12}" cy="${55 - (i === 1 ? 2 : 0)}" rx="5.2" ry="6.8" fill="${['#fff4dc', '#e4f3ff', '#ffe6ee'][i]}" stroke="${HM_K}" stroke-width="1.2"/><circle cx="${26.5 + i * 12}" cy="${53 - (i === 1 ? 2 : 0)}" r="1.1" fill="${['#f2b46a', '#7fb3e0', '#f08aa5'][i]}"/><circle cx="${30 + i * 12}" cy="${57 - (i === 1 ? 2 : 0)}" r="1.4" fill="${['#f2b46a', '#7fb3e0', '#f08aa5'][i]}"/></g>`; }
    return hmBase('#fdeccd', 'hmDots')
      + `<path d="M40 0V14" stroke="${HM_K}" stroke-width="1.2"/><path d="M26 66L34 22H46L54 66Z" fill="#ffe27a" opacity=".28" class="hm-glow"/>${hmP('M32 22L35 14H45L48 22Z', '#f28f6b')}`
      + `<ellipse cx="40" cy="64" rx="27" ry="7.5" fill="#e2b96a" stroke="${HM_K}" stroke-width="1.3"/><path d="M16 62l7 4M22 59l6 6M56 59l-6 6M64 62l-7 4M33 68l3-5M46 68l-2-5" stroke="#a87b32" stroke-width="1" stroke-linecap="round"/>${e}<path d="M15 63 Q40 73 65 63" fill="none" stroke="${HM_K}" stroke-width="1.1"/>`
      + `<g class="hm-mob"><path d="M98 0V12M84 12H112M86 12V19M98 12V24M110 12V18" stroke="${HM_K}" stroke-width="1" fill="none"/>${hmP('M86 19l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z', '#ffd866')}<path d="M100 25a4 4 0 1 1-3.5 6 5 5 0 0 0 3.500-6z" fill="#c9d8ff" stroke="${HM_K}" stroke-width="1"/><circle cx="110" cy="21" r="3" fill="#f7a8bd" stroke="${HM_K}" stroke-width="1"/></g>`
      + `${hmR(78, 42, 50, 3, '#b98a5e', 1)}<circle cx="90" cy="36" r="5" fill="#f6c7a0" stroke="${HM_K}" stroke-width="1.1"/><circle cx="86.500" cy="31.5" r="2" fill="#f6c7a0" stroke="${HM_K}" stroke-width="1"/><circle cx="93.500" cy="31.5" r="2" fill="#f6c7a0" stroke="${HM_K}" stroke-width="1"/>${hmR(103, 33, 5, 9, '#fff', 1.5)}${hmR(104, 30.500, 3, 3, '#f7a8bd', 1)}${hmP('M116 36c-3-5 3-7 4-3 1-4 7-2 4 3l-4 5z', '#f08aa5')}`
      + `${hmP('M82 68Q80 54 92 54H116Q128 54 126 68Z', '#f7b9cc')}<path d="M84 58Q104 64 124 58" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`;
  },
  salon(l) {
    const fire = l >= 1
      ? `${hmR(100, 0, 24, 30, '#eccfb0')}${hmR(93, 33, 38, 35, '#c9785c')}<rect x="93" y="33" width="38" height="35" fill="url(#hmBrick)"/>${hmR(101, 45, 22, 23, '#3b2a22', 2)}<ellipse cx="112" cy="62" rx="15" ry="9" fill="#ffb347" opacity=".35" class="hm-glow"/><g class="hm-fire">${hmP('M105 68C100 60 106 57 107 50C111 55 110 58 112 60C113 56 116 55 116 51C122 58 121 64 118 68Z', '#f28f3b')}<path d="M109 68C107 64 110 62 111 59C114 62 115 65 113 68Z" fill="#ffe27a"/></g><path d="M103 68h18" stroke="#7a4a2e" stroke-width="2.4" stroke-linecap="round"/>${hmR(90, 30, 44, 4, '#8a5a3c', 1)}`
      + (l >= 2 ? `${hmP('M96 30V25Q94 22 97 20Q100 22 98 25V30Z', '#7fb3e0')}<circle cx="124" cy="24.5" r="5" fill="#fffdf7" stroke="${HM_K}" stroke-width="1.2"/><path d="M124 21.500V24.5L126 26" stroke="${HM_K}" stroke-width="1" fill="none" stroke-linecap="round"/>` : '')
      + (l >= 3 ? `${hmR(103, 6, 18, 14, '#fffdf7', 1)}${hmP('M105 18l5-7 3 4 2-2 4 5Z', '#7fc38a')}<circle cx="117" cy="10" r="1.6" fill="#f2c14e"/><g>${hmR(80, 61, 9, 3.5, '#b98a5e', 1.7)}${hmR(82, 57.5, 9, 3.5, '#c99a6a', 1.7)}${hmR(84, 64.5, 9, 3.5, '#a87b52', 1.7)}</g>` : '')
      : hmPlant(112, 68, 1.25) + hmR(92, 56, 12, 12, '#c99a6a', 1.5);
    return hmBase('#f8dfc4', 'hmStripe')
      + `${hmR(26, 12, 26, 18, '#fffdf7', 1.5)}<path d="M28 28l7-9 5 6 3-3 7 6Z" fill="#8fc3a0" stroke="${HM_K}" stroke-width=".9"/><circle cx="45" cy="17" r="2.2" fill="#f2c14e"/>`
      + `<ellipse cx="52" cy="74.500" rx="34" ry="3.8" fill="#f2a58c" stroke="${HM_K}" stroke-width="1"/><ellipse cx="52" cy="74.500" rx="24" ry="2.2" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>`
      + `${hmR(13, 40, 54, 20, '#6fa9c4', 6)}${hmR(8, 50, 10, 16, '#7fb9d4', 4)}${hmR(62, 50, 10, 16, '#7fb9d4', 4)}${hmR(16, 54, 48, 10, '#8fc9e4', 4)}<path d="M40 54V64" stroke="${HM_K}" stroke-width="1"/>${hmR(22, 46, 11, 9, '#ffd866', 2.5)}${hmP('M50 50c-2-3.5 2.500-5 3.200-2 .7-3 5.200-1.500 3.200 2l-3.200 3.500z', '#f08aa5')}<path d="M14 66v2M66 66v2" stroke="${HM_K}" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M80 68V34" stroke="${HM_K}" stroke-width="1.4"/><path d="M76 68H84" stroke="${HM_K}" stroke-width="1.8" stroke-linecap="round"/><circle cx="80" cy="30" r="12" fill="#ffe27a" opacity=".28" class="hm-glow"/>${hmP('M74 34L76.500 25H83.500L86 34Z', '#ffd866')}`
      + fire;
  },
  cuisine(l) {
    return hmBase('#dcedd6', 'hmDots', '#e9dcc6')
      + `${hmR(8, 24, 46, 3, '#b98a5e', 1)}${hmR(11, 15, 6, 9, '#f08a6a', 1.5)}${hmR(19, 17, 6, 7, '#f2c14e', 1.5)}${hmR(27, 14, 6, 10, '#9fd08a', 1.5)}${hmR(35, 18, 5, 6, '#fffdf7', 1.5)}${hmR(42, 16, 7, 8, '#c9a0dc', 1.5)}`
      + `${hmP('M46 30H70L66 40H50Z', '#cfd6da')}${hmR(54, 24, 8, 6, '#b9c2c7')}`
      + `${hmR(6, 47, 66, 21, '#fff7e8', 1)}${hmR(4, 44, 70, 4, '#b98a5e', 1.5)}${hmR(10, 52, 14, 12, '#f5ead2', 1.5)}${hmR(27, 52, 14, 12, '#f5ead2', 1.5)}<circle cx="21" cy="58" r="1" fill="${HM_K}"/><circle cx="30" cy="58" r="1" fill="${HM_K}"/>`
      + `${hmR(46, 48, 24, 20, '#e7ecee', 1)}${hmR(50, 54, 16, 10, '#3b2a22', 2)}<rect x="52" y="56" width="12" height="6" rx="1" fill="#ffb347" opacity=".75" class="hm-glow"/><circle cx="51" cy="51" r="1.1" fill="${HM_K}"/><circle cx="58" cy="51" r="1.1" fill="${HM_K}"/><circle cx="65" cy="51" r="1.1" fill="${HM_K}"/>`
      + `${hmP('M50 44V37Q50 35.500 52 35.500H64Q66 35.500 66 37V44Z', '#e0685a')}<path d="M47 38.500H50M66 38.500H69M54 35.500Q58 32 62 35.500" stroke="${HM_K}" stroke-width="1.3" fill="none" stroke-linecap="round"/><g class="hm-steam"><path d="M54 32q-3-4 0-7M58 31q3-4 0-8M62 32q-3-4 0-7" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`
      + `<path d="M18 44V39Q18 36 22 36" stroke="${HM_K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      + (l >= 2 ? `${hmR(84, 52, 42, 4, '#c99a6a', 1.5)}<path d="M90 56V68M120 56V68" stroke="${HM_K}" stroke-width="2.2" stroke-linecap="round"/>${hmR(78, 59, 9, 3, '#e0685a', 1.5)}<path d="M80 62V68M85 62V68" stroke="${HM_K}" stroke-width="1.4"/>${hmP('M92 52Q92 47 97 47H101Q106 47 106 52Z', '#fffdf7')}<path d="M95 45q-1.500-2 0-3.500M100 45q1.500-2 0-3.500" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" class="hm-steam"/>` : hmPlant(104, 68, 1.2))
      + (l >= 3 ? `${hmR(110, 46, 12, 6, '#f6c7a0', 2)}${hmP('M110 46Q116 40 122 46Z', '#f7a8bd')}<circle cx="116" cy="41.500" r="1.6" fill="#e0533d" stroke="${HM_K}" stroke-width=".8"/><path d="M84 10H126" stroke="${HM_K}" stroke-width="1.6" stroke-linecap="round"/><path d="M92 10V15M106 10V15M118 10V14" stroke="${HM_K}" stroke-width="1"/><circle cx="92" cy="20" r="5" fill="#8a8f95" stroke="${HM_K}" stroke-width="1.2"/><circle cx="106" cy="21" r="6" fill="#c98a5a" stroke="${HM_K}" stroke-width="1.2"/>${hmP('M115 14H121L120 22H116Z', '#cfd6da')}` : '');
  },
  atelier(l) {
    return hmBase('#e9dcc8', null, '#c9a57c')
      + `${hmR(10, 12, 58, 26, '#f3e7d3', 2)}${[16, 26, 36, 46, 56].map(x => `<circle cx="${x}" cy="16" r=".8" fill="${HM_K}" opacity=".5"/><circle cx="${x}" cy="34" r=".8" fill="${HM_K}" opacity=".5"/>`).join('')}`
      + `<path d="M20 20V33" stroke="#b98a5e" stroke-width="2.4" stroke-linecap="round"/>${hmR(15, 17, 10, 5, '#8a8f95', 1)}`
      + `${hmP('M31 30L47 20L49 23L35 33Z', '#cfd6da')}${hmR(28, 29, 7, 5, '#e0685a', 1.5)}`
      + `<path d="M58 19a4 4 0 1 0 4 4" fill="none" stroke="#8a8f95" stroke-width="2.4" stroke-linecap="round"/><path d="M60 24V34" stroke="#8a8f95" stroke-width="2.4" stroke-linecap="round"/>`
      + `${hmR(6, 46, 70, 5, '#b98a5e', 1.5)}<path d="M12 51V68M70 51V68M12 60H70" stroke="${HM_K}" stroke-width="2.2" stroke-linecap="round" fill="none"/>${hmR(16, 39, 10, 7, '#6fa8dc', 1)}${hmR(18, 36, 6, 3, '#8a8f95')}${hmR(40, 41, 18, 5, '#f2d9a8', 1)}<path d="M36 44l10-6" stroke="#e0685a" stroke-width="1.8" stroke-linecap="round"/>${hmR(62, 40, 6, 6, '#f2c14e', 1)}`
      + `${hmR(104, 54, 24, 14, '#d9a86a', 1.5)}<path d="M104 61H128M116 54V68" stroke="${HM_K}" stroke-width=".9"/>${hmR(108, 43, 17, 11, '#e2b97c', 1.5)}<path d="M108 48.500H125" stroke="${HM_K}" stroke-width=".9"/>`
      + (l >= 1 ? `${hmP('M82 56H98L96 60H93V64H97V68H83V64H87V60H84Z', '#7d858c')}<path d="M98 56L102 54" stroke="${HM_K}" stroke-width="1.3" stroke-linecap="round"/>` : '')
      + (l >= 2 ? `${hmR(82, 24, 46, 3, '#b98a5e', 1)}${hmR(85, 17, 7, 7, '#e0685a', 1)}${hmR(94, 17, 7, 7, '#6fa8dc', 1)}${hmR(103, 17, 7, 7, '#f2c14e', 1)}${hmR(112, 15, 6, 9, '#9fd08a', 1)}<path d="M121 24V14M119.500 14h3" stroke="${HM_K}" stroke-width="1.3" stroke-linecap="round"/>` : '')
      + (l >= 3 ? `${hmR(84, 30, 26, 16, '#7fb3e0', 1)}<path d="M88 42V34H98V42M98 38H106V42M88 38H98" stroke="#fff" stroke-width="1" fill="none"/><path d="M78 0V8" stroke="${HM_K}" stroke-width="1.2"/><path d="M68 46L74 12H82L88 46Z" fill="#ffe27a" opacity=".22" class="hm-glow"/>${hmP('M72 13L75 7H81L84 13Z', '#5b8f6a')}` : '');
  },
  jardin(l) {
    const serre = l >= 1;
    return `<rect width="${HM_W}" height="${HM_H}" class="hm-sky2"/>`
      + (serre ? `<rect width="${HM_W}" height="68" fill="url(#hmGlass)" opacity=".75"/><path d="M0 12H136" stroke="#fff" stroke-width="2.4"/>` : `<circle cx="112" cy="18" r="9" class="hm-sun"/><path d="M0 46H136M0 56H136" stroke="#c99a6a" stroke-width="2.6"/>${[6, 22, 38, 54, 70, 86, 102, 118, 130].map(x => hmP(`M${x - 3} 68V44L${x} 40L${x + 3} 44V68Z`, '#e2b97c')).join('')}`)
      + `<rect y="68" width="${HM_W}" height="12" fill="#8fcf7a"/><path d="M0 68H136" stroke="${HM_K}" stroke-width="1.3"/><path d="M8 72l2-3 2 3M40 76l2-3 2 3M96 75l2-3 2 3M124 72l2-3 2 3" stroke="#5fa85a" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
      + `${hmR(8, 59, 84, 11, '#8a5a3c', 3)}<path d="M12 62h76" stroke="#6b4228" stroke-width="1" stroke-dasharray="3 4"/>`
      + `<g class="hm-sway">${hmP('M18 60Q14 52 16 47Q20 52 19 60ZM20 60Q22 50 26 48Q26 55 21 60Z', '#6fbf73')}<path d="M19 60v-3" stroke="#f08a3b" stroke-width="3" stroke-linecap="round"/></g>`
      + `<path d="M38 60V32" stroke="#b98a5e" stroke-width="1.6" stroke-linecap="round"/><g class="hm-sway" style="--i:1">${hmP('M38 58Q30 54 31 46Q37 48 38 54Q40 44 46 42Q47 50 39 58Z', '#5fb36b')}<circle cx="33" cy="50" r="3" fill="#e0533d" stroke="${HM_K}" stroke-width="1"/><circle cx="43" cy="46" r="3" fill="#e0533d" stroke="${HM_K}" stroke-width="1"/><circle cx="40" cy="54" r="2.4" fill="#f2c14e" stroke="${HM_K}" stroke-width="1"/></g>`
      + `<g class="hm-sway" style="--i:2"><path d="M60 60V34" stroke="#5fa85a" stroke-width="2" stroke-linecap="round"/>${hmP('M60 50Q53 49 52 44Q58 44 60 48ZM60 46Q67 45 68 40Q62 40 60 44Z', '#6fbf73')}${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="60" cy="24" rx="2.4" ry="4.200" fill="#f2c14e" stroke="${HM_K}" stroke-width=".8" transform="rotate(${a} 60 30)"/>`).join('')}<circle cx="60" cy="30" r="4" fill="#8a5a3c" stroke="${HM_K}" stroke-width="1"/></g>`
      + `<g class="hm-sway">${hmP('M78 60Q72 56 74 50Q79 52 80 58Q82 50 87 50Q87 57 81 60Z', '#7fc38a')}</g>`
      + `${hmP('M104 68V58H120V68Z', '#7fb3e0')}${hmP('M120 60L128 55L129 57L120 64Z', '#7fb3e0')}<path d="M106 58Q112 50 118 58" fill="none" stroke="${HM_K}" stroke-width="1.3"/>`
      + (l >= 2 ? `<path d="M100 12V22M122 12V20" stroke="${HM_K}" stroke-width="1"/>${hmP('M95 22H105L103 29H97Z', '#d98a5f')}${hmP('M97 22Q94 16 98 14Q100 18 100 22Q102 15 105 16Q105 20 102 22Z', '#6fbf73')}${hmP('M117 20H127L125 27H119Z', '#d98a5f')}<path d="M119 21Q116 30 118 34M124 21Q127 29 125 32" stroke="#5fb36b" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : '')
      + (l >= 3 ? `<g class="hm-fly">${hmP('M92 36Q88 31 91 30Q94 32 92 36Q96 31 98 33Q97 37 92 36Z', '#f7a8bd')}</g><g class="hm-fly" style="--i:1">${hmP('M26 28Q22 23 25 22Q28 24 26 28Q30 23 32 25Q31 29 26 28Z', '#ffd866')}</g>` : '');
  },
  observ(l) {
    return `<rect width="${HM_W}" height="${HM_H}" fill="#39457a"/>${[[12, 14], [30, 30], [52, 10], [76, 34], [100, 12], [124, 26], [118, 46], [20, 48]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1 : 1.6}" fill="#ffe9a8" class="hm-star" style="--i:${i}"/>`).join('')}
      <rect y="68" width="${HM_W}" height="12" fill="#8c7aa8"/><path d="M0 68H136" stroke="${HM_K}" stroke-width="1.3"/>
      <circle cx="100" cy="30" r="17" fill="#1f2a55" stroke="${HM_K}" stroke-width="1.5"/><path d="M100 13V47M83 30H117" stroke="${HM_K}" stroke-width="1" opacity=".7"/><path d="M106 21a8 8 0 1 0 5 13 9 9 0 0 1-5-13z" fill="#ffe9a8"/>
      <path d="M46 68L56 46L66 68M56 46V68" stroke="${HM_K}" stroke-width="1.8" fill="none" stroke-linecap="round"/><g transform="rotate(-32 56 44)">${hmR(34, 39, 46, 10, '#e7ecee', 3)}${hmR(76, 37, 9, 14, '#c9a35a', 2)}${hmR(28, 41, 7, 6, '#8a8f95', 1.5)}</g><circle cx="56" cy="45" r="3" fill="#c9a35a" stroke="${HM_K}" stroke-width="1.2"/>`
      + (l >= 2 ? `${hmR(8, 16, 26, 20, '#f3e7d3', 1.5)}<path d="M12 30l6-8 6 4 6-7" stroke="#6f7fc0" stroke-width="1" fill="none"/><circle cx="18" cy="22" r="1.2" fill="#e0685a"/><circle cx="24" cy="26" r="1.2" fill="#e0685a"/><circle cx="30" cy="19" r="1.2" fill="#e0685a"/>` : '')
      + (l >= 3 ? `<path d="M16 68V58" stroke="${HM_K}" stroke-width="1.6"/><path d="M10 68H22" stroke="${HM_K}" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="51" r="7" fill="#7fb3e0" stroke="${HM_K}" stroke-width="1.3"/><path d="M11 49q4-3 6 0t5 2" stroke="#7fc38a" stroke-width="2" fill="none"/><ellipse cx="16" cy="51" rx="10" ry="3" fill="none" stroke="#c9a35a" stroke-width="1" transform="rotate(-18 16 51)"/>` : '');
  },
};
// pièce pas encore construite : poussière, cartons, drap, panneau
function hmLockedArt() {
  return `<rect width="${HM_W}" height="${HM_H}" fill="#cfc6b8"/><rect y="68" width="${HM_W}" height="12" fill="#a8977f"/><path d="M0 68H136" stroke="${HM_K}" stroke-width="1.3"/>
    <path d="M0 0H26M0 0V24M0 0L20 18M8 0Q10 9 0 9M16 0Q19 16 0 17M24 0Q26 22 0 23" stroke="#fff" stroke-width=".8" fill="none" opacity=".8"/>
    ${hmP('M78 68V44Q78 36 90 37Q102 34 106 42Q118 40 120 50V68Z', '#f3efe6')}<path d="M86 68V52M98 68V46M110 68V54" stroke="${HM_K}" stroke-width=".8" opacity=".4"/>
    ${hmR(12, 52, 22, 16, '#d9a86a', 1)}<path d="M12 57H34M23 52V57" stroke="${HM_K}" stroke-width=".9"/>${hmR(18, 40, 16, 12, '#e2b97c', 1)}<path d="M18 44.500H34" stroke="${HM_K}" stroke-width=".9"/>
    <path d="M56 68V50" stroke="${HM_K}" stroke-width="2"/>${hmR(42, 30, 28, 20, '#f2d9a8', 3)}<text x="56" y="45" text-anchor="middle" font-size="13">🔨</text>`;
}
const hmArt = (R, l) => R.lock && l < 1 ? hmLockedArt() : hm$(() => HM_DRAW[R.id](l), '');
const hmChars = ks => (ks || []).slice(0, 2).map((k, i) => { const u = hm$(() => portraitURI(k), ''); return u ? `<image href="${u}" x="${i ? 96 : 70}" y="${i ? 40 : 41}" width="26" height="28.4" class="hm-ch" style="--i:${i}"/>` : ''; }).join('');
function hmHouseHTML() {
  const W = hmWho(), night = hmNight(), smoke = hm$(() => pgLvl('cheminee') > 0, false);
  let rooms = '';
  HM_ROOMS.forEach(R => {
    const [x, y, s] = R.p, l = hmLvl(R), locked = R.lock && l < 1, dot = hmDot(R);
    const lab = R.nm + (R.b && !locked ? ' ' + '★'.repeat(l) + '☆'.repeat(3 - l) : locked ? ' · à construire' : ''), lw = lab.length * 5.1 + 11, py = y + HM_H * s - 13.8;
    rooms += `<g class="hm-room" data-hmroom="${R.id}" tabindex="0" role="button" aria-label="${R.nm}${R.b ? `, niveau ${l} sur 3` : ''}">
      <g transform="translate(${x} ${y}) scale(${s})"><g class="hm-art">${hmArt(R, l)}${locked ? '' : hmChars(W[R.id])}</g></g>
      <rect x="${x}" y="${y}" width="${HM_W * s}" height="${HM_H * s}" class="hm-hit"/>
      <rect x="${x + 2.5}" y="${py}" width="${lw}" height="12" rx="6" class="hm-plq"/><text x="${x + 7.5}" y="${py + 8.9}" class="hm-nm">${lab}</text>
      ${dot ? `<g class="hm-dotg"><circle cx="${x + HM_W * s - 9}" cy="${y + 9.5}" r="7" class="hm-dot"/><text x="${x + HM_W * s - 9}" y="${y + 13}" text-anchor="middle" class="hm-dott">!</text></g>` : ''}
    </g>`;
  });
  const stars = night ? [[30, 30], [70, 60], [300, 40], [330, 90], [250, 20], [20, 110], [345, 150]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#ffe9a8" class="hm-star" style="--i:${i}"/>`).join('') : '';
  return `<div class="hm"><svg class="hm-svg${night ? ' night' : ''}" viewBox="0 0 360 412" aria-label="Votre maison">${HM_DEFS}
    <rect width="360" height="412" class="hm-sky"/>${stars}
    ${night ? `<path d="M60 40a16 16 0 1 0 12 26 18 18 0 0 1-12-26z" fill="#ffe9a8"/>` : `<circle cx="52" cy="48" r="17" class="hm-sun"/><g class="hm-cloud" fill="#fff" opacity=".9"><ellipse cx="300" cy="50" rx="24" ry="9"/><ellipse cx="288" cy="44" rx="12" ry="9"/><ellipse cx="306" cy="42" rx="13" ry="10"/></g><g class="hm-cloud" style="--i:1" fill="#fff" opacity=".8"><ellipse cx="96" cy="96" rx="16" ry="6"/><ellipse cx="90" cy="92" rx="9" ry="6"/></g>`}
    <path d="M0 386 Q90 372 180 384 T360 380V412H0Z" fill="#9fcf86"/>
    <g>${hmR(11, 338, 6, 54, '#a87b52', 2)}<circle cx="14" cy="322" r="20" fill="#7fc38a" stroke="${HM_K}" stroke-width="1.5"/><circle cx="4" cy="336" r="11" fill="#8fd09a" stroke="${HM_K}" stroke-width="1.3"/><circle cx="20" cy="312" r="3" fill="#e0533d"/><circle cx="6" cy="324" r="3" fill="#e0533d"/></g>
    <g>${hmR(340.5, 368, 3.5, 24, '#a87b52', 1)}${hmR(333, 356, 19, 13, '#e0685a', 4)}<path d="M352 358v-7h6v4h-6" fill="#ffd866" stroke="${HM_K}" stroke-width="1"/></g>
    ${smoke ? `<g class="hm-smoke" fill="#fff"><circle cx="268" cy="38" r="6"/><circle cx="274" cy="24" r="8" style="--i:1"/><circle cx="266" cy="8" r="10" style="--i:2"/></g>` : ''}
    ${hmR(258, 46, 20, 44, '#c9785c')}<rect x="258" y="46" width="20" height="44" fill="url(#hmBrick)"/>${hmR(255, 42, 26, 6, '#8a5a3c', 2)}
    <path d="M20 142 L180 12 L340 142 Z" fill="#d9735a" stroke="${HM_K}" stroke-width="3" stroke-linejoin="round"/><path d="M20 142 L180 12 L340 142 Z" fill="url(#hmTile)"/>
    <rect x="124" y="69" width="112" height="70" rx="3" fill="#6b4a36" stroke="${HM_K}" stroke-width="1.5"/>
    <rect x="38" y="136" width="284" height="260" rx="4" fill="#6b4a36" stroke="${HM_K}" stroke-width="3"/>
    <rect x="30" y="392" width="300" height="9" rx="3" fill="#b9a58c" stroke="${HM_K}" stroke-width="1.5"/>
    ${rooms}
    <path d="M14 142H346" stroke="${HM_K}" stroke-width="4" stroke-linecap="round"/>
  </svg>
  <p class="hm-help">Touchez une pièce pour y entrer. <b class="hm-dotl">!</b> = quelque chose à faire.</p></div>`;
}
function hmRoomHead(R) {
  const l = hmLvl(R);
  return `<div class="hm-head"><button class="btn cream sm" data-hmback="1">← La maison</button><div class="hm-ht"><b>${HM_EMOJI[R.id]} ${R.nm}</b>${R.b ? `<small>${'★'.repeat(l)}${'☆'.repeat(3 - l)} niveau ${l}/3</small>` : ''}</div></div>`;
}
// l'intérieur : le même dessin, en grand
function hmSceneHTML(R) {
  const l = hmLvl(R), locked = R.lock && l < 1;
  return `<div class="hm-scene"><svg class="hm-svg in${hmNight() ? ' night' : ''}" viewBox="0 0 ${HM_W} ${HM_H}" aria-hidden="true">${HM_DEFS}<g class="hm-art">${hmArt(R, l)}${locked ? '' : hmChars(hmWho()[R.id])}</g></svg><p class="hm-info">${locked ? 'Cette pièce n’est pas encore construite. ' : ''}${HM_INFO[R.id] || ''}</p></div>`;
}
if (typeof fyRender === 'function') fyRender = (orig => function (box) {
  if (!box || hm$(() => pgTuto(), false)) return orig.apply(this, arguments);
  if (!hmRoom) { box.innerHTML = hmHouseHTML(); box.classList.remove('f3-on'); return; }
  const R = HM_ROOMS.find(x => x.id === hmRoom); if (!R) { hmRoom = null; box.innerHTML = hmHouseHTML(); return; }
  // on construit l'ancien foyer à part, puis on range dans la pièce les blocs qui la concernent
  const tmp = document.createElement('div');
  try { orig.call(this, tmp); } catch (e) { console.error('foyer', e); }
  box.innerHTML = hmRoomHead(R) + hmSceneHTML(R);
  box.classList.toggle('f3-on', R.id === 'salon');
  if (R.b) box.insertAdjacentHTML('beforeend', `<div class="hm-up"><h3 class="hm-h">${hmLvl(R) < 1 ? 'Construire' : 'Améliorer la pièce'}</h3>${hm$(() => pgCardHTML(PG_BY[R.b]), '')}</div>`);
  if (R.id === 'atelier') box.insertAdjacentHTML('beforeend', `<button class="btn green" data-hmgo="atelier">🔨 Ouvrir l’établi</button>`);
  if (R.id === 'cuisine' && hmLvl(R) > 0) box.insertAdjacentHTML('beforeend', `<button class="btn green" data-hmgo="talents">🍖 Nourrir un compagnon</button>`);
  if (R.id === 'salon') box.insertAdjacentHTML('beforeend', `<h3 class="hm-h">Décorer le salon</h3>`);
  R.blocks.forEach(sel => tmp.querySelectorAll(sel).forEach(e => box.appendChild(e)));
})(fyRender);
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const r = t.closest('[data-hmroom]'); if (r) { ev.stopPropagation(); hmRoom = r.dataset.hmroom; renderPanel(); const p = $('panelBody'); if (p) p.scrollTop = 0; return; }
  if (t.closest('[data-hmback]')) { ev.stopPropagation(); hmRoom = null; renderPanel(); return; }
  const g = t.closest('[data-hmgo]'); if (g) { ev.stopPropagation(); if (g.dataset.hmgo === 'atelier') openSheet('atelier'); else { try { tlOpen = 'feed'; } catch (e) {} if (typeof openCompagnons === 'function') openCompagnons('talents'); else openSheet('compagnons'); } }
}, true);
document.addEventListener('keydown', ev => { const r = ev.target.closest && ev.target.closest('[data-hmroom]'); if (r && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
// revenir sur l'onglet Foyer depuis ailleurs : on retrouve la maison
if (typeof openSheet === 'function') openSheet = (orig => function (name) { if (name === 'village' || name === 'foyer') hmRoom = null; return orig.apply(this, arguments); })(openSheet);
window.__hm = { house: () => hmHouseHTML(), room: () => hmRoom };
{
  const st = document.createElement('style');
  st.textContent = `.hm-svg{width:100%;height:auto;display:block;border-radius:18px;border:2.5px solid var(--ink,#4a3528);box-shadow:0 3px 0 rgba(74,53,40,.18)}
.hm-svg.in{border-radius:16px}
.hm-sky{fill:#bfe3f5}.hm-svg.night .hm-sky{fill:#2d3a63}.hm-sky2{fill:#cfeaf5}.hm-svg.night .hm-sky2{fill:#3a4a7a}
.hm-sun{fill:#ffd866;stroke:#f2b43a;stroke-width:2}.hm-svg.night .hm-sun{fill:#ffe9a8;stroke:none}
.hm-win{fill:#bfe3f5}.hm-svg.night .hm-win{fill:#34427a}
.hm-svg.night .hm-art{filter:brightness(.93) saturate(.95)}
.hm-room{cursor:pointer;outline:none}.hm-hit{fill:transparent;stroke:#fff8ec;stroke-width:0;rx:2px}
.hm-room:hover .hm-hit,.hm-room:focus-visible .hm-hit{stroke:#ffd866;stroke-width:3}.hm-room:active .hm-hit{fill:rgba(255,216,102,.25)}
.hm-plq{fill:#fffaf0;stroke:#4a3528;stroke-width:1}.hm-nm{font:800 8.4px var(--display,system-ui);fill:#4a3528}
.hm-dot{fill:#e0533d;stroke:#fff;stroke-width:1.6}.hm-dott{font:800 10px system-ui;fill:#fff}
.hm-dotg{animation:hmPulse 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.hm-fire{animation:hmFire .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
.hm-glow{animation:hmGlow 2.4s ease-in-out infinite alternate}
.hm-steam{animation:hmSteam 2.2s ease-in-out infinite}
.hm-smoke circle{opacity:.7;animation:hmSmoke 4s ease-out infinite;animation-delay:calc(var(--i,0) * -1.3s)}
.hm-egg.rdy{animation:hmEgg .7s ease-in-out infinite;animation-delay:calc(var(--i,0) * .15s);transform-box:fill-box;transform-origin:50% 100%}
.hm-mob{animation:hmSway 3.4s ease-in-out infinite;transform-origin:98px 0}
.hm-sway{animation:hmSway 3s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.8s);transform-box:fill-box;transform-origin:50% 100%}
.hm-fly{animation:hmFly 5s ease-in-out infinite;animation-delay:calc(var(--i,0) * -2s)}
.hm-star{animation:hmTw 2.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.5s)}
.hm-cloud{animation:hmCloud 26s linear infinite alternate;animation-delay:calc(var(--i,0) * -9s)}
.hm-ch{animation:hmBob 2.2s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.9s);transform-box:fill-box;transform-origin:50% 100%}
@keyframes hmPulse{50%{transform:scale(1.18)}}@keyframes hmFire{to{transform:scale(1.06,.86)}}@keyframes hmGlow{from{opacity:.16}}
@keyframes hmSteam{0%{opacity:0;transform:translateY(3px)}40%{opacity:.9}100%{opacity:0;transform:translateY(-5px)}}
@keyframes hmSmoke{0%{opacity:0;transform:translate(0,8px) scale(.6)}30%{opacity:.75}100%{opacity:0;transform:translate(10px,-16px) scale(1.25)}}
@keyframes hmEgg{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}@keyframes hmSway{0%,100%{transform:rotate(-2.500deg)}50%{transform:rotate(2.500deg)}}
@keyframes hmFly{0%,100%{transform:translate(0,0)}25%{transform:translate(8px,-6px)}50%{transform:translate(14px,2px)}75%{transform:translate(5px,6px)}}
@keyframes hmTw{50%{opacity:.25}}@keyframes hmCloud{to{transform:translateX(-36px)}}@keyframes hmBob{50%{transform:scale(1.02,.96)}}
@media (prefers-reduced-motion:reduce){.hm-svg *{animation:none!important}}
.hm-help{margin:6px 2px 0;font-size:12.5px;color:var(--ink2,#7a6250)}.hm-dotl{display:inline-block;width:15px;height:15px;border-radius:50%;background:#e0533d;color:#fff;text-align:center;font:800 10px/15px system-ui}
.hm-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.hm-ht b{display:block;font:800 18px var(--display,inherit);color:var(--ink,#4a3528)}.hm-ht small{font-size:12px;color:#c98a12;font-weight:800}
.hm-scene{margin-bottom:10px}.hm-info{margin:6px 2px 0;font-size:13px;color:var(--ink2,#7a6250)}
.hm-up{margin:10px 0}.hm-h{margin:10px 2px 6px;font:800 13px var(--body,system-ui);color:#9a8470;text-transform:uppercase;letter-spacing:.04em}
#panelBody>.btn.green{display:block;width:100%;margin-top:8px}`;
  document.head.appendChild(st);
}

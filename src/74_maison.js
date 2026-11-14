// ================= 74 · LA MAISON : PIÈCES EN 3/4 (v47-v50) =================
// Le joueur : « au foyer il y a beaucoup de choses et on doit trop défiler ; la 3D est sympa mais ne sert à rien ».
// v47 maison de poupée schématique → « trop simpliste, horrible » ; v48 maison en coupe dessinée → « pas cosy, on a
// l'impression d'être dans Terraria (gros cadres bruns, grille, vue plate), on ne voit pas à quoi ça sert ».
// v50 (choix du joueur) : UNE pièce à la fois, vue en 3/4 (isométrique) façon diorama cosy (Unpacking, Animal Crossing) :
// sol en planches, deux murs, lumière de fenêtre, soirée feutrée la nuit, compagnons dans la pièce de leur poste.
// Lisibilité : une rangée d'icônes avec un VERBE (Décorer, Postes, Nourrir…) + pastille quand il y a quelque chose à faire ;
// on glisse sur la pièce ou on touche les flèches pour passer à la suivante. Une pièce = une action.
// Règles inchangées : les blocs existants (constructions 48, jardin/nurserie/postes 31-40, décoration 3D 49) sont rangés
// dans leur pièce ; les meubles dessinés s'ajoutent avec le niveau de la construction.
let hmRoom = null, hmEdit = false;
const HM_ROOMS = [
  // v51 : une pièce = un rôle, et le familier qui y travaille (j = poste de 40_foyer.js)
  { id: 'entree', nm: 'Entrée', v: 'Partir', e: '🚪', b: null, blocks: [] },
  { id: 'salon', nm: 'Salon', v: 'Confort', e: '🛋️', b: 'cheminee', blocks: [] },
  { id: 'chambres', nm: 'Chambres', v: 'Dormir', e: '🛏️', b: 'chambre', blocks: [], j: 'repos' },
  { id: 'cuisine', nm: 'Cuisine', v: 'Nourrir', e: '🍲', b: 'repas', blocks: ['.fy2-list'], j: 'comm' },
  { id: 'nurserie', nm: 'Nurserie', v: 'Éclore', e: '🥚', b: null, blocks: ['.fy2-nur'], j: 'nurs' },
  { id: 'jardin', nm: 'Jardin', v: 'Planter', e: '🌱', b: 'serre', blocks: ['.fy2-jar'], j: 'jard' },
  { id: 'atelier', nm: 'Atelier', v: 'Créer', e: '🔨', b: 'atelier', blocks: [] },
  { id: 'observ', nm: 'Observatoire', v: 'Le ciel', e: '🔭', b: 'observ', blocks: [], lock: 1 },
];
const HM_INFO = {
  entree: 'Vos 3 compagnons de voyage. Bien reposés, ils rapportent plus.',
  salon: 'Plus votre maison est décorée, plus vos voyages rapportent. Touchez « Aménager ».',
  chambres: 'Au lit, vos compagnons rechargent leur énergie avant de repartir.',
  cuisine: 'Nourrissez vos familiers ; le commis cuisine les provisions de voyage.',
  nurserie: 'Les œufs éclosent ici. Agrandissez-la pour accueillir plus de familiers.',
  jardin: 'Semez des graines : elles poussent même pendant vos voyages.',
  atelier: 'Fabriquez le matériel de voyage et vos décorations.',
  observ: 'Annonce à l’avance les moments rares du ciel.',
};
const hm$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
const hmLvl = R => R.b ? Math.max(0, Math.min(3, hm$(() => pgLvl(R.b), 0))) : 1;
const hmNight = () => { const h = new Date().getHours(); return h >= 20 || h < 7; };
const hmR = id => HM_ROOMS.find(x => x.id === id);
function hmDot(R) {
  if (R.b && hm$(() => pgLvl(R.b) < 3 && pgCan(R.b).ok, false)) return 1;
  if (R.id === 'nurserie') return (S.eggs || []).filter(e => e && e.ready <= Date.now()).length;
  return 0;
}
function hmWho() {
  const W = {}, put = (r, k) => { (W[r] = W[r] || []).push(k); };
  const cuis = hm$(() => pgLvl('repas') > 0, false);
  let alt = 0; const team = hm$(() => teamIds(), []);
  hm$(() => fwHome(), []).forEach(k => {
    const j = hm$(() => fwJob(k), 'repos');
    if (j === 'jard') put('jardin', k); else if (j === 'comm') put('cuisine', k); else if (j === 'nurs') put('nurserie', k);
    else if (team.includes(k)) put('entree', k); // l'équipe au repos attend à l'entrée, sacs prêts
    else put(alt++ < 3 ? 'chambres' : 'salon', k);
  });
  return W;
}
// ---------------- projection 3/4 ----------------
// X va vers la droite-bas, Y vers la gauche-bas, Z vers le haut. Pièce de 9 × 9, murs de 6.
const HIU = 21.5, HIA = HIU * 0.866, HIB = HIU * 0.5, HIOX = 190, HIOY = 146, HIN = 9, HIH = 6, HILN = '#6b5040';
const hIP = (x, y, z = 0) => [+(HIOX + (x - y) * HIA).toFixed(1), +(HIOY + (x + y) * HIB - z * HIU).toFixed(1)];
const hIPath = (pts, f, o = '') => `<path d="M${pts.map(p => p.join(' ')).join('L')}Z" fill="${f}" stroke="${HILN}" stroke-opacity=".55" stroke-width="1" stroke-linejoin="round" ${o}/>`;
function hIMix(h, k) { // k > 0 : vers la lumière ; k < 0 : vers une ombre chaude
  const c = parseInt(h.slice(1), 16), t = k > 0 ? [255, 250, 240] : [74, 48, 38], a = Math.abs(k);
  const r = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v, i) => Math.round(v + (t[i] - v) * a));
  return '#' + r.map(v => v.toString(16).padStart(2, '0')).join('');
}
// un bloc (meuble, mur…) : dessus, face gauche (vers Y+), face droite (vers X+)
function hIBox(x, y, z, w, d, h, c, o = {}) {
  const T = o.t || hIMix(c, .2), L = o.l || c, R = o.r || hIMix(c, -.16);
  return hIPath([hIP(x, y, z + h), hIP(x + w, y, z + h), hIP(x + w, y + d, z + h), hIP(x, y + d, z + h)], T)
    + (o.noL ? '' : hIPath([hIP(x, y + d, z + h), hIP(x + w, y + d, z + h), hIP(x + w, y + d, z), hIP(x, y + d, z)], L))
    + (o.noR ? '' : hIPath([hIP(x + w, y, z + h), hIP(x + w, y + d, z + h), hIP(x + w, y + d, z), hIP(x + w, y, z)], R));
}
// un rectangle posé sur un mur : 'L' = mur de gauche (plan X = 0), 'R' = mur du fond (plan Y = 0)
const hIWq = (s, a, z, w, h) => s === 'L' ? [hIP(0, a, z), hIP(0, a + w, z), hIP(0, a + w, z + h), hIP(0, a, z + h)] : [hIP(a, 0, z), hIP(a + w, 0, z), hIP(a + w, 0, z + h), hIP(a, 0, z + h)];
const hIFq = (x, y, w, d, z = 0) => [hIP(x, y, z), hIP(x + w, y, z), hIP(x + w, y + d, z), hIP(x, y + d, z)];
const hIEll = (x, y, r, f, z = 0, o = '') => { const [px, py] = hIP(x, y, z); return `<ellipse cx="${px}" cy="${py}" rx="${(r * HIU * 1.22).toFixed(1)}" ry="${(r * HIU * 0.71).toFixed(1)}" fill="${f}" stroke="${HILN}" stroke-opacity=".5" stroke-width="1" ${o}/>`; };
function hIWin(s, a, z, w, h) {
  const q = hIWq(s, a, z, w, h), m = (i, j, t) => q[i].map((v, n) => v + (q[j][n] - v) * t);
  return hIPath(hIWq(s, a - .18, z - .18, w + .36, h + .36), '#fffaf0') + hIPath(q, 'url(#isky)', 'class="iwin"')
    + `<path d="M${m(0, 1, .5).join(' ')}L${m(3, 2, .5).join(' ')}M${m(0, 3, .5).join(' ')}L${m(1, 2, .5).join(' ')}" stroke="#fffaf0" stroke-width="2.2"/>`
    + hIPath(hIWq(s, a - .3, z - .35, w + .6, .2), '#fffaf0');
}
// la tache de soleil au sol, sous une fenêtre du mur de gauche / du fond
const hISun = (s, a, w) => s === 'L' ? hIPath([hIP(.1, a, 0), hIP(.1, a + w, 0), hIP(3.6, a + w + 1.6, 0), hIP(3.6, a + 1.6, 0)], '#fff3c4', 'stroke="none" class="isun"') : hIPath([hIP(a, .1, 0), hIP(a + w, .1, 0), hIP(a + w + 1.6, 3.6, 0), hIP(a + 1.6, 3.6, 0)], '#fff3c4', 'stroke="none" class="isun"');
function hIPlant(x, y, s = 1, pot = '#d98a5f') {
  const [px, py] = hIP(x, y, .75 * s);
  const leaf = (dx, dy, rot, c) => `<ellipse cx="${(px + dx * s).toFixed(1)}" cy="${(py + dy * s).toFixed(1)}" rx="${(4.6 * s).toFixed(1)}" ry="${(12 * s).toFixed(1)}" fill="${c}" stroke="${HILN}" stroke-opacity=".5" stroke-width="1" transform="rotate(${rot} ${(px + dx * s).toFixed(1)} ${(py + dy * s).toFixed(1)})"/>`;
  return hIBox(x - .35 * s, y - .35 * s, 0, .7 * s, .7 * s, .75 * s, pot) + `<g class="isway">${leaf(-7, -9, -35, '#6fbf73')}${leaf(7, -10, 32, '#7fcb7f')}${leaf(0, -14, 2, '#5fb36b')}${leaf(-3, -6, -12, '#8fd38a')}</g>`;
}
function hILamp(x, y, z = 0, hgt = 3.1, shade = '#ffd866') {
  const [bx, by] = hIP(x, y, z), [tx, ty] = hIP(x, y, z + hgt);
  return `<ellipse cx="${bx}" cy="${by}" rx="7" ry="3.6" fill="#8a6a50" stroke="${HILN}" stroke-opacity=".5"/><path d="M${bx} ${by}V${ty}" stroke="${HILN}" stroke-width="2"/>`
    + `<path d="M${tx - 10} ${ty + 2}L${tx - 6} ${ty - 11}H${tx + 6}L${tx + 10} ${ty + 2}Z" fill="${shade}" stroke="${HILN}" stroke-opacity=".6" stroke-linejoin="round"/>`;
}
const hIGlow = (x, y, z, r = 46, c = '#ffd27a') => { const [px, py] = hIP(x, y, z); return `<circle cx="${px}" cy="${py}" r="${r}" fill="url(#iglow)" style="--gc:${c}" class="iglow"/>`; };
// ---------------- la coquille de la pièce ----------------
let hmCur = '', hmCustom = () => ({}); // pièce dessinée ; murs et sol choisis par le joueur (75_amenager.js)
function hIShell(wall, floor, o = {}) {
  if (!o.open) { const C = hm$(() => hmCustom(hmCur), {}); if (C.w) { wall = C.w[1]; o = Object.assign({}, o, { pat: C.w[2], wl: null, wr: null }); } if (C.f) { floor = C.f[1]; o = Object.assign({}, o, { tiles: C.f[2] === 'tiles', check: C.f[2] === 'check', carpet: C.f[2] === 'carpet' }); } }
  let s = `<ellipse cx="${HIOX}" cy="${HIOY + HIN * 2 * HIB + 14}" rx="180" ry="20" fill="#4a3026" opacity=".12"/>`;
  s += hIBox(-.45, -.45, -.55, HIN + .45, HIN + .45, .55, floor, { t: floor, l: hIMix(floor, -.22), r: hIMix(floor, -.32) });
  if (o.check) for (let i = 0; i < HIN; i++) for (let j = (i % 2); j < HIN; j += 2) s += hIPath(hIFq(i, j, 1, 1), hIMix(floor, -.12), 'stroke="none"');
  if (o.carpet) for (let i = 0; i < 40; i++) { const [px, py] = hIP((i * 2.3) % 8.8 + .1, (i * 4.1) % 8.8 + .1); s += `<circle cx="${px}" cy="${py}" r="1" fill="#fff" opacity=".4"/>`; }
  if (o.tiles || o.check) for (let i = 1; i < HIN; i++) s += `<path d="M${hIP(i, 0).join(' ')}L${hIP(i, HIN).join(' ')}M${hIP(0, i).join(' ')}L${hIP(HIN, i).join(' ')}" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>`;
  else if (!o.grass && !o.carpet) for (let i = 1; i < HIN * 2; i++) { const y = i / 2; s += `<path d="M${hIP(0, y).join(' ')}L${hIP(HIN, y).join(' ')}" stroke="${hIMix(floor, -.25)}" stroke-opacity=".35" stroke-width=".8"/>`; if (i % 2) s += `<path d="M${hIP((i * 3.7) % 8 + .5, y).join(' ')}L${hIP((i * 3.7) % 8 + .5, y + .5).join(' ')}" stroke="${hIMix(floor, -.25)}" stroke-opacity=".35" stroke-width=".8"/>`; }
  if (o.grass) { for (let i = 0; i < 26; i++) { const [px, py] = hIP((i * 3.3) % 8.6 + .2, (i * 5.9) % 8.6 + .2); s += `<path d="M${px - 2} ${py}l2-5 2 5" stroke="#6fae5f" stroke-width="1.2" fill="none" stroke-linecap="round"/>`; } }
  if (o.open) return s;
  const wl = o.wl || wall, wr = o.wr || hIMix(wall, -.07);
  s += hIBox(-.45, -.45, 0, .45, .45, HIH, '#fffaf0', { t: '#fffaf0' })
    + hIBox(-.45, 0, 0, .45, HIN, HIH, wall, { t: '#fffaf0', l: '#f3e3cc', r: wl })
    + hIBox(0, -.45, 0, HIN, .45, HIH, wall, { t: '#fffaf0', l: wr, r: '#f3e3cc' });
  if (o.pat === 'stripe') for (let i = 1; i < HIN * 2; i += 1) { if (i % 2) continue; s += `<path d="M${hIP(0, i / 2, 0).join(' ')}L${hIP(0, i / 2, HIH).join(' ')}" stroke="#fff" stroke-opacity=".35" stroke-width="5"/><path d="M${hIP(i / 2, 0, 0).join(' ')}L${hIP(i / 2, 0, HIH).join(' ')}" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>`; }
  if (o.pat === 'dots') for (let a = .7; a < HIN; a += 1.3) for (let z = .9; z < HIH; z += 1.1) { const [lx, ly] = hIP(0, a + ((z * 10) % 2 ? .6 : 0), z), [rx, ry] = hIP(a + ((z * 10) % 2 ? .6 : 0), 0, z); s += `<circle cx="${lx}" cy="${ly}" r="1.6" fill="#fff" opacity=".6"/><circle cx="${rx}" cy="${ry}" r="1.6" fill="#fff" opacity=".55"/>`; }
  if (o.pat === 'wood') for (let z = .5; z < HIH; z += .5) s += `<path d="M${hIP(0, 0, z).join(' ')}L${hIP(0, HIN, z).join(' ')}M${hIP(0, 0, z).join(' ')}L${hIP(HIN, 0, z).join(' ')}" stroke="${hIMix(wall, -.25)}" stroke-opacity=".4" stroke-width=".9"/>`;
  if (o.pat === 'flowers') for (let a = .8; a < HIN; a += 1.6) for (let z = 1; z < HIH; z += 1.4) { [hIP(0, a + (z % 2.8 > 1.4 ? .8 : 0), z), hIP(a + (z % 2.8 > 1.4 ? .8 : 0), 0, z)].forEach(([px, py]) => { s += `<g fill="#fff" opacity=".7"><circle cx="${px - 2.5}" cy="${py}" r="1.8"/><circle cx="${px + 2.5}" cy="${py}" r="1.8"/><circle cx="${px}" cy="${py - 2.5}" r="1.8"/><circle cx="${px}" cy="${py + 2.5}" r="1.8"/></g><circle cx="${px}" cy="${py}" r="1.4" fill="#f2c14e"/>`; }); }
  if (o.pat === 'stars') for (let i = 0; i < 18; i++) { const a = (i * 2.9) % 8.6 + .2, z = (i * 1.7) % 5 + .8, [px, py] = i % 2 ? hIP(0, a, z) : hIP(a, 0, z); s += `<circle cx="${px}" cy="${py}" r="${i % 3 ? 1.2 : 2}" fill="#ffe9a8" class="itw" style="--i:${i}"/>`; }
  // plinthes
  s += hIPath([hIP(0, 0, 0), hIP(0, HIN, 0), hIP(0, HIN, .3), hIP(0, 0, .3)], '#fffaf0') + hIPath([hIP(0, 0, 0), hIP(HIN, 0, 0), hIP(HIN, 0, .3), hIP(0, 0, .3)], '#fbf1e2');
  return s;
}
const HISTD = `<defs><linearGradient id="isky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#dff2fb"/></linearGradient>
  <radialGradient id="iglow"><stop offset="0" stop-color="var(--gc,#ffd27a)" stop-opacity=".55"/><stop offset="1" stop-color="var(--gc,#ffd27a)" stop-opacity="0"/></radialGradient>
  <radialGradient id="ibg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#fff8ee"/><stop offset="1" stop-color="#f6e2cc"/></radialGradient></defs>`;
// ---------------- les pièces ----------------
// chaque fonction renvoie { s: le décor, g: les lumières (dessinées par-dessus la pénombre du soir), spots: où se tiennent les compagnons }
const HM_ISO = {
  entree() {
    let s = hIShell('#dfe8d2', '#d9b48a', { pat: 'wood' }), g = '';
    s += hIPath(hIWq('R', 3.15, 0, 2.5, 4.35), '#fffaf0') + hIPath(hIWq('R', 3.4, 0, 2, 4), '#79aed0') + hIPath(hIWq('R', 3.75, 2.4, 1.3, 1.1), 'url(#isky)', 'class="iwin"');
    s += hIPath(hIWq('R', 3.65, .4, 1.5, 1.5), 'none', 'stroke="#fff" stroke-opacity=".5"');
    const [kx, ky] = hIP(5.05, 0, 1.9); s += `<circle cx="${kx}" cy="${ky}" r="2.6" fill="#f2c14e" stroke="${HILN}" stroke-opacity=".6"/>`;
    const [lx, ly] = hIP(4.4, 0, 4.9); s += `<path d="M${lx} ${ly - 6}v6" stroke="${HILN}"/><path d="M${lx - 7} ${ly + 8}L${lx - 4} ${ly}H${lx + 4}L${lx + 7} ${ly + 8}Z" fill="#ffd866" stroke="${HILN}" stroke-opacity=".6"/>`; g += hIGlow(4.4, .2, 4.6, 46);
    s += hIPath(hIFq(3.5, .25, 1.8, 1.1), '#c9785c') + `<path d="M${hIP(3.7, .5).join(' ')}L${hIP(5.1, .5).join(' ')}M${hIP(3.7, 1.1).join(' ')}L${hIP(5.1, 1.1).join(' ')}" stroke="#f2c14e" stroke-width="1.6"/>`;
    s += hIPath(hIWq('L', 3.1, 2.5, 2.8, 1.8), '#fffaf0') + hIPath(hIWq('L', 3.25, 2.62, 2.5, 1.55), '#f3e6cf');
    s += `<path d="M${hIP(0, 3.6, 3).join(' ')}Q${hIP(0, 4.3, 4.1).join(' ')} ${hIP(0, 4.9, 3.4).join(' ')}T${hIP(0, 5.5, 3.6).join(' ')}" fill="none" stroke="#e0685a" stroke-width="1.4" stroke-dasharray="3 2"/>`;
    [[3.6, 3], [4.9, 3.4], [5.5, 3.6]].forEach(([a, z], i) => { const [px, py] = hIP(0, a, z); s += `<circle cx="${px}" cy="${py}" r="2.6" fill="${['#e0533d', '#f2c14e', '#5fb36b'][i]}" stroke="${HILN}" stroke-opacity=".6"/>`; });
    s += hIBox(.15, 3, 0, 1.15, 2.9, .85, '#c99a6a') + hIBox(.15, 3, 0, .2, 2.9, 1.9, '#b98a5e');
    const nb = Math.max(1, Math.min(3, hm$(() => teamIds().length, 3)));
    ['#e0685a', '#7fb3e0', '#9fd08a'].slice(0, nb).forEach((c, i) => { const y = 3.2 + i * .95; s += hIBox(.35, y, .85, .75, .78, .85, c) + hIBox(.3, y - .03, 1.45, .85, .84, .3, hIMix(c, -.12)) + hIBox(.85, y + .25, .95, .1, .3, .4, '#f2c14e'); });
    const [rx, ry] = hIP(.9, 1.2, 0), [tx, ty] = hIP(.9, 1.2, 4.3);
    s += `<ellipse cx="${rx}" cy="${ry}" rx="10" ry="5" fill="#8a6a50" stroke="${HILN}" stroke-opacity=".5"/><path d="M${rx} ${ry}V${ty}" stroke="#8a6a50" stroke-width="4" stroke-linecap="round"/><path d="M${tx - 12} ${ty + 6}L${tx} ${ty + 2}L${tx + 12} ${ty + 6}" stroke="#8a6a50" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${tx - 14} ${ty + 12}q-4 -9 6 -10q8 1 4 10z" fill="#f2c14e" stroke="${HILN}" stroke-opacity=".6"/><path d="M${tx + 4} ${ty + 8}h14v4h-14z" fill="#e0685a" stroke="${HILN}" stroke-opacity=".6"/><path d="M${tx + 3} ${ty + 10}q-2 14 3 26M${tx + 9} ${ty + 10}q2 12 -1 22" stroke="#7fb3e0" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    s += hIBox(7.8, .6, 0, .7, .7, 1.1, '#7fb3e0') + `<path d="M${hIP(8.1, .9, 1).join(' ')}L${hIP(8.25, .95, 3).join(' ')}M${hIP(8.25, .85, 1).join(' ')}L${hIP(8.5, .7, 2.8).join(' ')}" stroke="#e0685a" stroke-width="2.6" stroke-linecap="round"/>`;
    s += hIPlant(8.2, 3, 1.1);
    return { s, g, blk: [[3.4, 0, 2, 1.4], [0, 3, 1.4, 3], [.4, .8, 1, 1], [7.7, .5, .9, .9], [7.8, 2.6, .8, .8]], spots: [[4.6, 3.2], [5.9, 4.4], [3.4, 4.6]] };
  },
  salon(l) {
    let s = hIShell('#f7d9bd', '#e3b98a', { pat: 'stripe' }), g = '';
    s += hIWin('L', 2.2, 2.3, 2.6, 2.4) + hISun('L', 2.2, 2.6);
    s += hIPath(hIWq('R', 1.2, 3, 2, 1.5), '#fffaf0') + hIPath(hIWq('R', 1.4, 3.2, 1.6, 1.1), '#a9d8b5') + `<circle cx="${hIP(2.6, 0, 3.9)[0]}" cy="${hIP(2.6, 0, 3.9)[1]}" r="2.6" fill="#ffd866"/>`;
    if (l >= 1) {
      s += hIBox(4.6, 0, 0, 2.6, .9, 2.8, '#c9785c', { t: '#d98e6f' }) + hIBox(4.4, 0, 2.8, 3, 1.15, .28, '#9a6a4a');
      s += hIPath([hIP(5.15, .9, 0), hIP(6.65, .9, 0), hIP(6.65, .9, 1.7), hIP(5.15, .9, 1.7)], '#3b2a22');
      const [fx, fy] = hIP(5.9, .9, 0);
      s += `<g class="ifire"><path d="M${fx - 9} ${fy - 1}C${fx - 12} ${fy - 12} ${fx - 4} ${fy - 14} ${fx - 3} ${fy - 24}C${fx + 2} ${fy - 16} ${fx + 4} ${fy - 18} ${fx + 6} ${fy - 22}C${fx + 12} ${fy - 12} ${fx + 10} ${fy - 5} ${fx + 8} ${fy - 1}Z" fill="#f28f3b"/><path d="M${fx - 4} ${fy - 1}C${fx - 5} ${fy - 8} ${fx} ${fy - 9} ${fx + 1} ${fy - 14}C${fx + 5} ${fy - 8} ${fx + 5} ${fy - 4} ${fx + 3} ${fy - 1}Z" fill="#ffe27a"/></g>`;
      g += hIGlow(5.9, 1.4, .6, 70, '#ffb35c');
      if (l >= 2) s += hIBox(4.7, .25, 3.08, .35, .35, .6, '#7fb3e0') + hIBox(6.7, .25, 3.08, .45, .3, .55, '#fffdf7');
      if (l >= 3) s += hIBox(6.3, 3.3, 0, 1.7, 1.7, .8, '#e0a07a') + hIBox(7.6, 3.3, .8, .4, 1.7, 1.1, '#d8936d') + hIBox(6.3, 3.3, .8, 1.3, .35, .55, '#d8936d') + hIBox(6.3, 4.65, .8, 1.3, .35, .55, '#d8936d');
    } else s += hIBox(5, .1, 0, 2.4, .8, 1.1, '#c99a6a') + hIPlant(6.2, .5, .8, '#7fb3e0');
    s += hIEll(4.4, 5, 2.4, '#f2a58c') + hIEll(4.4, 5, 1.6, 'none', 0, 'stroke="#fff" stroke-opacity=".8" stroke-width="2"');
    s += hIBox(.25, 3, 0, 1.7, 3.6, .9, '#79aed0') + hIBox(.15, 3, .9, .55, 3.6, 1.05, '#6fa3c6') + hIBox(.25, 2.65, 0, 1.7, .38, 1.35, '#86bad9') + hIBox(.25, 6.6, 0, 1.7, .38, 1.35, '#86bad9');
    s += hIBox(.7, 3.4, .9, .45, 1, .75, '#ffd866') + hIBox(.7, 5.3, .9, .45, 1, .75, '#f6a3b7');
    s += hIBox(3.6, 4.4, 0, 1.5, 1.9, .55, '#c99a6a') + hIBox(4.1, 5.1, .55, .3, .3, .35, '#fffdf7');
    s += hILamp(.8, 1.2) + hIPlant(8.2, 1.1, 1.15);
    g += hIGlow(.8, 1.2, 3.1, 52);
    return { s, g, blk: [[0,2.6,2,4.4],[3.6,4.4,1.5,1.9],[.4,.8,.8,.8],[7.8,.7,.8,.8],[4.4,0,3.2,1.2]].concat(l>=3?[[6.3,3.3,1.7,1.7]]:[]), spots: [[6, 6.6], [7.6, 5.4]] };
  },
  chambres(l) {
    let s = hIShell('#f5d6e2', '#e6c39a', { pat: 'stripe' }), g = '';
    s += hIWin('R', 3.3, 2.4, 2.4, 2.4) + hISun('R', 3.3, 2.4);
    const bed = (y, c) => hIBox(.2, y, 0, 3.3, 2.2, .65, '#c99a6a') + hIBox(.05, y, 0, .35, 2.2, 1.7, '#b98a5e') + hIBox(.45, y + .08, .65, 2.95, 2.04, .32, '#fffaf2') + hIBox(1.55, y + .02, .7, 1.95, 2.16, .34, c) + hIBox(.6, y + .35, .97, .8, 1.5, .25, '#ffffff');
    s += bed(.9, '#f29cb0');
    s += hIBox(.2, 3.4, 0, 1, 1, 1, '#c99a6a') + hILamp(.7, 3.9, 1, 1.1, '#ffd866'); g += hIGlow(.7, 3.9, 2.1, 40);
    if (l >= 1) s += bed(4.7, '#8fc3e8');
    else s += hIPlant(.8, 5.5, .9) + hIBox(.2, 6.5, 0, 1.2, 1.4, .9, '#e2b97c');
    if (l >= 2) { s += hIBox(6.4, .05, 0, 2.2, .7, 3.3, '#c99a6a'); [['#e0685a', 6.6], ['#6fa8dc', 6.95], ['#f2c14e', 7.3], ['#7fc38a', 7.65], ['#c9a0dc', 8]].forEach(([c, x], i) => { s += hIPath([hIP(x, .75, 2.2), hIP(x + .3, .75, 2.2), hIP(x + .3, .75, 2.2 + .7 + (i % 2) * .2), hIP(x, .75, 2.2 + .7 + (i % 2) * .2)], c); s += hIPath([hIP(x, .75, .9), hIP(x + .3, .75, .9), hIP(x + .3, .75, 1.6), hIP(x, .75, 1.6)], c); }); }
    if (l >= 3) { const pts = [0, 1, 2, 3, 4, 5, 6, 7].map(i => hIP(.6 + i * 1.05, 0, 5.4 - Math.sin(i / 7 * Math.PI) * .6)); s += `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="${HILN}" stroke-width="1"/>`; pts.forEach((p, i) => { s += `<circle cx="${p[0]}" cy="${p[1] + 3}" r="2.6" fill="${['#ffd866', '#f6a3b7', '#a9d8f0'][i % 3]}" class="itw" style="--i:${i}"/>`; g += `<circle cx="${p[0]}" cy="${p[1] + 3}" r="9" fill="url(#iglow)" style="--gc:#ffe27a" class="iglow"/>`; }); }
    s += hIEll(5.2, 5.4, 2, '#f7b9cc') + hIPlant(8.3, 1, .95);
    return { s, g, blk: [[0,.9,3.5,2.2],[0,3.4,1.2,1],[0,4.7,3.5,2.2],[7.9,.6,.8,.8]].concat(l>=2?[[6.4,0,2.2,.8]]:[]), spots: [[5.6, 6.4], [7.4, 4.9], [6.6, 7.8]] };
  },
  cuisine(l) {
    let s = hIShell('#d6ead0', '#f1e6d4', { pat: 'dots', tiles: 1 }), g = '';
    s += hIWin('L', 2.6, 2.4, 2.4, 2.2) + hISun('L', 2.6, 2.4);
    s += hIBox(.2, 0, 0, 3.4, 1.15, 1.4, '#fffaf0', { t: '#c99a6a' }) + hIBox(3.6, 0, 0, 1.6, 1.15, 1.4, '#e7ecee', { t: '#cfd6da' }) + hIBox(5.2, 0, 0, 1.6, 1.15, 1.4, '#fffaf0', { t: '#c99a6a' });
    s += hIPath([hIP(3.8, 1.15, .25), hIP(5, 1.15, .25), hIP(5, 1.15, 1), hIP(3.8, 1.15, 1)], '#3b2a22') + hIPath([hIP(3.9, 1.15, .35), hIP(4.9, 1.15, .35), hIP(4.9, 1.15, .7), hIP(3.9, 1.15, .7)], '#ffb347', 'class="iglow2"');
    [.5, 1.9].forEach(x => { s += hIPath([hIP(x, 1.15, .2), hIP(x + 1.2, 1.15, .2), hIP(x + 1.2, 1.15, 1.15), hIP(x, 1.15, 1.15)], '#f5ead2'); });
    s += hIBox(3.95, .25, 1.4, .9, .7, .6, '#e0685a') + hIBox(3.9, .2, 2, 1, .8, .1, '#c95a4c');
    const [sx, sy] = hIP(4.4, .6, 2.4); s += `<g class="isteam"><path d="M${sx - 6} ${sy}q-4-7 0-13M${sx} ${sy - 2}q4-7 0-14M${sx + 6} ${sy}q-4-7 0-13" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
    s += hIBox(.6, 0, 3.4, 3.2, .55, .14, '#b98a5e');
    [['#f08a6a', .8], ['#f2c14e', 1.5], ['#9fd08a', 2.2], ['#c9a0dc', 2.9]].forEach(([c, x], i) => { s += hIBox(x, .1, 3.54, .45, .35, .55 + (i % 2) * .2, c); });
    if (l >= 1) {
      s += hIEll(5.2, 5.2, 1.4, '#fffaf0', 1.15) + hIBox(5, 5, 0, .4, .4, 1.15, '#b98a5e') + hIEll(5.2, 5.2, 1.4, '#c99a6a', 1.15);
      s += hIBox(3, 4.9, 0, .8, .8, .7, '#e0685a') + hIBox(6.6, 4.6, 0, .8, .8, .7, '#e0685a');
      s += hIEll(5.2, 5.2, .4, '#fffdf7', 1.2) + hIBox(5, 5, 1.2, .4, .4, .2, '#f2c14e');
      if (l >= 3) s += hIBox(5.6, 4.6, 1.2, .5, .5, .35, '#f6c7a0', { t: '#f7a8bd' });
    } else s += hIPlant(6, 5, 1.1);
    if (l >= 2) { s += hIBox(0, 5.4, 4, .15, 2.6, .1, HILN); [5.9, 6.8, 7.5].forEach((y, i) => { const [px, py] = hIP(.1, y, 3.6); s += `<path d="M${px} ${py - 6}v6" stroke="${HILN}"/><circle cx="${px}" cy="${py + 4}" r="${4 + i}" fill="${['#8a8f95', '#c98a5a', '#cfd6da'][i]}" stroke="${HILN}" stroke-opacity=".6"/>`; }); }
    g += hIGlow(4.4, 1.2, .6, 40, '#ffb35c');
    return { s, g, blk: [[0,0,6.8,1.2],[4.4,4.4,1.7,1.7],[2.9,4.8,1,1],[6.5,4.5,1,1]], spots: [[6.8, 7], [3.8, 7.2]] };
  },
  nurserie() {
    let s = hIShell('#fde7c4', '#ebc89c', { pat: 'dots' }), g = '';
    s += hIWin('R', 4.2, 2.6, 2.2, 2.2) + hISun('R', 4.2, 2.2);
    s += hIEll(4.6, 4.6, 2.8, '#fff3dc') + hIEll(4.6, 4.6, 2, 'none', 0, 'stroke="#f6c7a0" stroke-width="2" stroke-dasharray="5 4"');
    s += hIEll(4.6, 4.6, 1.3, '#e2b96a', .25) + hIEll(4.6, 4.6, .85, '#c99a4e', .3);
    const eggs = (S.eggs || []).filter(Boolean), now = Date.now();
    eggs.slice(0, 3).forEach((e, i) => { const [px, py] = hIP(4.6 + [-.35, .25, .1][i], 4.6 + [.1, -.3, .45][i], .45), rdy = e.ready <= now; s += `<g class="iegg${rdy ? ' rdy' : ''}" style="--i:${i}"><ellipse cx="${px}" cy="${py - 8}" rx="7" ry="9" fill="${['#fff4dc', '#e4f3ff', '#ffe6ee'][i]}" stroke="${HILN}" stroke-opacity=".7" stroke-width="1.2"/><circle cx="${px - 2}" cy="${py - 11}" r="1.6" fill="${['#f2b46a', '#7fb3e0', '#f08aa5'][i]}"/><circle cx="${px + 2.5}" cy="${py - 6}" r="2" fill="${['#f2b46a', '#7fb3e0', '#f08aa5'][i]}"/></g>`; if (rdy) g += hIGlow(4.6, 4.6, .8, 30, '#fff1a8'); });
    const [mx, my] = hIP(4.6, 4.6, 6.2);
    s += `<g class="imob"><path d="M${mx} ${my - 40}V${my}M${mx - 22} ${my}H${mx + 22}M${mx - 20} ${my}v10M${mx + 20} ${my}v8M${mx} ${my}v14" stroke="${HILN}" stroke-width="1" fill="none"/><path d="M${mx - 20} ${my + 9}l2 4 4.5.6-3.3 3.1.8 4.5-4-2.1-4 2.1.8-4.5-3.3-3.1 4.5-.6z" fill="#ffd866" stroke="${HILN}" stroke-opacity=".6"/><circle cx="${mx + 20}" cy="${my + 12}" r="4" fill="#f7a8bd" stroke="${HILN}" stroke-opacity=".6"/><path d="M${mx + 3} ${my + 14}a5 5 0 1 1-4 8 6 6 0 0 0 4-8z" fill="#c9d8ff" stroke="${HILN}" stroke-opacity=".6"/></g>`;
    s += hIBox(.2, 1, 0, 2, 2.6, .5, '#f6dbe6') + hIBox(.2, 1, .5, 2, 2.6, .25, '#ffffff');
    [0, 1, 2, 3, 4, 5, 6].forEach(i => { const [a, b] = hIP(2.2, 1.1 + i * .4, .5), [c, d] = hIP(2.2, 1.1 + i * .4, 1.6); s += `<path d="M${a} ${b}L${c} ${d}" stroke="#c99a6a" stroke-width="2"/>`; });
    s += `<path d="M${hIP(2.2, 1, 1.6).join(' ')}L${hIP(2.2, 3.6, 1.6).join(' ')}" stroke="#c99a6a" stroke-width="3" stroke-linecap="round"/>`;
    s += hIBox(1.2, 0, 3, 2.6, .55, .14, '#b98a5e') + hIEll(1.9, .3, .3, '#f6c7a0', 3.14) + hIBox(2.8, .1, 3.14, .35, .3, .6, '#fff');
    s += hIBox(7.2, .3, 0, 1.4, 1.4, .9, '#f7b9cc', { t: '#fff' }) + hIPlant(8.3, 2.4, .8, '#f7b9cc');
    return { s, g, blk: [[3.4,3.4,2.4,2.4],[0,1,2.3,2.6],[7.2,.3,1.4,1.4],[7.9,2,.8,.8]], spots: [[7, 6.8], [6.4, 3]] };
  },
  jardin(l) {
    let s = hIShell('#cfeaf5', '#a9d88e', { open: 1, grass: 1 }), g = '';
    if (l >= 1) {
      s += hIBox(-.3, -.3, 0, .3, HIN + .3, HIH, '#ffffff', { t: '#fffaf0', l: '#e8f6fb', r: 'rgba(214,240,250,.55)' }).replace(/fill="rgba[^"]+"/, 'fill="#d6f0fa" fill-opacity=".5"');
      s += hIBox(0, -.3, 0, HIN, .3, HIH, '#ffffff', { t: '#fffaf0', l: '#e3f3fa', r: '#e8f6fb' }).replace(/fill="#e3f3fa"/, 'fill="#d6f0fa" fill-opacity=".45"');
      for (let i = 1; i < HIN; i += 2) s += `<path d="M${hIP(0, i, 0).join(' ')}L${hIP(0, i, HIH).join(' ')}M${hIP(i, 0, 0).join(' ')}L${hIP(i, 0, HIH).join(' ')}" stroke="#fff" stroke-width="2.4"/>`;
      s += `<path d="M${hIP(0, 0, 3).join(' ')}L${hIP(0, HIN, 3).join(' ')}M${hIP(0, 0, 3).join(' ')}L${hIP(HIN, 0, 3).join(' ')}" stroke="#fff" stroke-width="2"/>`;
    } else {
      for (let i = 0; i <= HIN; i += 1) s += hIBox(i - .15, -.15, 0, .3, .3, 1.5, '#e2b97c') + hIBox(-.15, i - .15, 0, .3, .3, 1.5, '#e2b97c');
      s += hIBox(0, -.08, 1.05, HIN, .12, .14, '#d9a86a') + hIBox(-.08, 0, 1.05, .12, HIN, .14, '#d9a86a') + hIBox(0, -.08, .5, HIN, .12, .14, '#d9a86a') + hIBox(-.08, 0, .5, .12, HIN, .14, '#d9a86a');
    }
    const bed = (x, y, w, d) => hIBox(x, y, 0, w, d, .45, '#9a6a4a', { t: '#7a5236' });
    s += bed(.7, .7, 5, 1.4) + bed(.7, 2.9, 1.4, 4);
    const sprout = (x, y, c) => { const [px, py] = hIP(x, y, .45); return `<g class="isway" style="--i:${(x * 3) % 3}"><path d="M${px} ${py}v-7" stroke="#5fa85a" stroke-width="2"/><ellipse cx="${px - 4}" cy="${py - 8}" rx="4.4" ry="2.6" fill="#7fc38a" stroke="${HILN}" stroke-opacity=".5" transform="rotate(-25 ${px - 4} ${py - 8})"/><ellipse cx="${px + 4}" cy="${py - 9}" rx="4.4" ry="2.6" fill="#6fbf73" stroke="${HILN}" stroke-opacity=".5" transform="rotate(25 ${px + 4} ${py - 9})"/>${c ? `<circle cx="${px}" cy="${py - 12}" r="3.2" fill="${c}" stroke="${HILN}" stroke-opacity=".6"/>` : ''}</g>`; };
    [[1.3, 1.4, '#e0533d'], [2.3, 1.4, 0], [3.3, 1.4, '#f2c14e'], [4.3, 1.4, 0], [5.2, 1.4, '#e0533d'], [1.4, 3.6, 0], [1.4, 4.6, '#f08a3b'], [1.4, 5.6, 0], [1.4, 6.5, '#c9a0dc']].forEach(([x, y, c]) => { s += sprout(x, y, c); });
    const [fx, fy] = hIP(7.6, 1.6, 0), [hx, hy] = hIP(7.6, 1.6, 3.6);
    s += `<g class="isway"><path d="M${fx} ${fy}L${hx} ${hy}" stroke="#5fa85a" stroke-width="3"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="${hx}" cy="${hy - 8}" rx="3.4" ry="7" fill="#f2c14e" stroke="${HILN}" stroke-opacity=".6" transform="rotate(${a} ${hx} ${hy})"/>`).join('')}<circle cx="${hx}" cy="${hy}" r="6" fill="#8a5a3c" stroke="${HILN}" stroke-opacity=".6"/></g>`;
    s += hIBox(4.6, 4.6, 0, .8, .6, .6, '#7fb3e0') + hIEll(5, 4.9, .12, '#7fb3e0', .6);
    if (l >= 2) [[2, 0], [5.5, 0]].forEach(([x]) => { const [px, py] = hIP(x, 0, 4.4); s += `<path d="M${px} ${py - 22}V${py - 8}" stroke="${HILN}"/><path d="M${px - 8} ${py - 8}h16l-3 10h-10z" fill="#d98a5f" stroke="${HILN}" stroke-opacity=".6"/><path d="M${px - 6} ${py - 8}q-4 12 -1 18M${px + 5} ${py - 8}q4 10 1 16" stroke="#5fb36b" stroke-width="2" fill="none"/>`; });
    if (l >= 3) [[3.2, 3.5, 2.6, '#f7a8bd'], [6.6, 2.8, 3, '#ffd866']].forEach(([x, y, z, c], i) => { const [px, py] = hIP(x, y, z); s += `<g class="ifly" style="--i:${i}"><path d="M${px} ${py}q-7-7-3-9q4 2 3 9q4-7 8-5q-1 5-8 5z" fill="${c}" stroke="${HILN}" stroke-opacity=".6"/></g>`; });
    g += l >= 1 ? '' : `<circle cx="330" cy="40" r="16" fill="#ffd866" opacity=".9"/>`;
    return { s, g, blk: [[.7,.7,5,1.4],[.7,2.9,1.4,4],[7.2,1.2,.8,.8],[4.6,4.6,.8,.6]], spots: [[5.4, 6.6], [7.6, 5.2], [4, 7.8]], sky: 1 };
  },
  atelier(l) {
    let s = hIShell('#ead9c0', '#c9a37a'), g = '';
    s += hIWin('L', 3.2, 2.5, 2.2, 2.2) + hISun('L', 3.2, 2.2);
    s += hIPath(hIWq('R', .8, 2.2, 3.8, 2.2), '#f3e6cf');
    for (let x = 1.1; x < 4.5; x += .45) for (let z = 2.45; z < 4.3; z += .45) { const [px, py] = hIP(x, 0, z); s += `<circle cx="${px}" cy="${py}" r=".9" fill="${HILN}" opacity=".35"/>`; }
    const tl = (x, z, d) => { const [a, b] = hIP(x, 0, z), [c, e] = hIP(x, 0, z - d); return `<path d="M${a} ${b}L${c} ${e}" stroke="#8a8f95" stroke-width="3.4" stroke-linecap="round"/>`; };
    s += tl(1.5, 4.1, 1.3) + hIPath(hIWq('R', 1.2, 3.75, .7, .45), '#8a8f95') + tl(2.4, 4.1, 1.5) + hIPath(hIWq('R', 2.25, 2.6, .3, .5), '#e0685a') + tl(3.4, 4.1, 1.2) + `<circle cx="${hIP(3.4, 0, 4.2)[0]}" cy="${hIP(3.4, 0, 4.2)[1]}" r="4" fill="none" stroke="#8a8f95" stroke-width="3"/>`;
    s += hIBox(.6, .1, 0, .3, .3, 1.3, '#a87b52') + hIBox(4.4, .1, 0, .3, .3, 1.3, '#a87b52') + hIBox(.6, 1.2, 0, .3, .3, 1.3, '#a87b52') + hIBox(4.4, 1.2, 0, .3, .3, 1.3, '#a87b52');
    s += hIBox(.6, .1, .4, 4.1, 1.4, .15, '#b98a5e') + hIBox(.5, 0, 1.3, 4.3, 1.6, .25, '#c99a6a');
    s += hIBox(1, .4, 1.55, .9, .6, .45, '#6fa8dc') + hIBox(2.4, .5, 1.55, 1.2, .8, .1, '#f2d9a8') + hIBox(3.9, .4, 1.55, .4, .4, .4, '#f2c14e');
    s += hIBox(7, .4, 0, 1.6, 1.4, 1.2, '#d9a86a') + hIBox(7.2, .6, 1.2, 1.2, 1, 1, '#e2b97c') + hIBox(7.4, 2.2, 0, 1.1, 1.1, .9, '#d9a86a');
    if (l >= 1) { s += hIBox(3.6, 4.6, 0, .9, .9, .7, '#5f666d') + hIBox(3.3, 4.55, .7, 1.6, 1, .35, '#7d858c'); g += hIGlow(4, 5, 1.2, 30, '#ffb35c'); }
    if (l >= 2) { s += hIBox(0, 6, 3, .55, 2.6, .14, '#b98a5e'); [6.2, 6.9, 7.6].forEach((y, i) => { s += hIBox(.1, y, 3.14, .35, .45, .5 + (i % 2) * .2, ['#e0685a', '#9fd08a', '#7fb3e0'][i]); }); }
    if (l >= 3) s += hIPath(hIWq('L', 6, 1.3, 2.4, 1.5), '#7fb3e0') + `<path d="M${hIP(0, 6.4, 1.6).join(' ')}L${hIP(0, 7.4, 2.4).join(' ')}L${hIP(0, 8, 1.7).join(' ')}" stroke="#fff" stroke-width="1.2" fill="none"/>`;
    const [lx, ly] = hIP(2.6, .7, 5.6); s += `<path d="M${lx} ${ly - 30}V${ly}" stroke="${HILN}"/><path d="M${lx - 11} ${ly + 6}L${lx - 5} ${ly - 2}H${lx + 5}L${lx + 11} ${ly + 6}Z" fill="#5b8f6a" stroke="${HILN}" stroke-opacity=".6"/>`; g += hIGlow(2.6, .9, 4.6, 60);
    return { s, g, blk: [[.5,0,4.3,1.6],[7,.4,1.6,1.4],[7.4,2.2,1.1,1.1]].concat(l>=1?[[3.3,4.5,1.6,1]]:[]), spots: [[5.8, 6.4], [3, 6.8]] };
  },
  observ(l) {
    let s = hIShell('#3b4778', '#6d5a8c', { pat: 'stars', wl: '#3b4778', wr: '#34406d' }), g = '';
    const [cx, cy] = hIP(5, 0, 3.6); s += `<ellipse cx="${cx}" cy="${cy}" rx="34" ry="40" fill="#fffaf0" transform="skewY(-30) translate(0 0)" transform-origin="${cx} ${cy}"/><ellipse cx="${cx}" cy="${cy}" rx="29" ry="35" fill="#1f2a55" transform="skewY(-30)" transform-origin="${cx} ${cy}"/><path d="M${cx + 8} ${cy - 16}a12 12 0 1 0 7 20 13 13 0 0 1-7-20z" fill="#ffe9a8"/>`;
    g += `<circle cx="${cx + 10}" cy="${cy - 6}" r="40" fill="url(#iglow)" style="--gc:#cfe0ff" class="iglow"/>`;
    s += hIEll(4.6, 4.6, 2.2, '#8a74ad');
    const [tx, ty] = hIP(4.6, 4.6, 0), [hx, hy] = hIP(4.6, 4.6, 2.2);
    s += `<path d="M${tx - 16} ${ty + 4}L${hx} ${hy}L${tx + 16} ${ty + 4}M${hx} ${hy}L${tx} ${ty + 10}" stroke="${HILN}" stroke-width="2.4" stroke-linecap="round" fill="none"/><g transform="rotate(-30 ${hx} ${hy})"><rect x="${hx - 30}" y="${hy - 8}" width="56" height="15" rx="6" fill="#e7ecee" stroke="${HILN}" stroke-opacity=".7"/><rect x="${hx + 20}" y="${hy - 11}" width="12" height="21" rx="4" fill="#c9a35a" stroke="${HILN}" stroke-opacity=".7"/></g><circle cx="${hx}" cy="${hy}" r="4" fill="#c9a35a" stroke="${HILN}"/>`;
    if (l >= 2) s += hIPath(hIWq('L', 1.5, 2.4, 2.6, 1.9), '#f3e6cf') + `<path d="M${hIP(0, 1.9, 2.9).join(' ')}L${hIP(0, 2.6, 3.6).join(' ')}L${hIP(0, 3.2, 3.1).join(' ')}L${hIP(0, 3.8, 3.9).join(' ')}" stroke="#6f7fc0" stroke-width="1.2" fill="none"/>`;
    if (l >= 3) { s += hIBox(7.2, 6.4, 0, .9, .9, 1, '#b98a5e'); const [gx, gy] = hIP(7.65, 6.85, 1.6); s += `<circle cx="${gx}" cy="${gy}" r="10" fill="#7fb3e0" stroke="${HILN}" stroke-opacity=".7"/><path d="M${gx - 7} ${gy - 2}q5-5 9 0t5 3" stroke="#7fc38a" stroke-width="3" fill="none"/>`; }
    s += hILamp(1, 7, 0, 2.4, '#c9a0dc'); g += hIGlow(1, 7, 2.4, 44, '#e6c8ff');
    return { s, g, blk: [[3.6,3.6,2,2],[.6,6.6,.8,.8]].concat(l>=3?[[7.2,6.4,.9,.9]]:[]), spots: [[6.4, 7], [7.6, 3.4]] };
  },
};
function hmLocked() {
  let s = hIShell('#d9cfc0', '#bfae94'), g = '';
  s += hIBox(.6, .6, 0, 1.5, 1.5, 1.2, '#d9a86a') + hIBox(.8, .8, 1.2, 1.1, 1.1, .9, '#e2b97c') + hIBox(2.6, .5, 0, 1.2, 1.2, .9, '#d9a86a');
  const [bx, by] = hIP(5.6, 2.6, 0); s += `<path d="M${bx - 40} ${by + 8}Q${bx - 44} ${by - 40} ${bx - 6} ${by - 46}Q${bx + 34} ${by - 52} ${bx + 40} ${by - 10}L${bx + 44} ${by + 14}Q${bx} ${by + 24} ${bx - 40} ${by + 8}Z" fill="#f6f1e7" stroke="${HILN}" stroke-opacity=".55"/><path d="M${bx - 20} ${by + 14}Q${bx - 18} ${by - 20} ${bx - 6} ${by - 40}M${bx + 14} ${by + 16}Q${bx + 16} ${by - 16} ${bx + 24} ${by - 36}" stroke="${HILN}" stroke-opacity=".25" fill="none"/>`;
  const [px, py] = hIP(4.8, 6, 0); s += `<path d="M${px} ${py}V${py - 44}" stroke="${HILN}" stroke-width="3"/><rect x="${px - 30}" y="${py - 70}" width="60" height="30" rx="7" fill="#f2d9a8" stroke="${HILN}" stroke-opacity=".7"/><text x="${px}" y="${py - 50}" text-anchor="middle" font-size="16">🔨</text>`;
  return { s, g, spots: [] };
}
let hmExtra = () => ({ s: '', top: '' }); // objets posés et grille d'aménagement (75_amenager.js)
function hmSceneSVG(R) {
  const l = hmLvl(R), locked = R.lock && l < 1, night = hmNight(); hmCur = R.id;
  const D = locked ? hmLocked() : hm$(() => HM_ISO[R.id](l), { s: '', g: '', spots: [] });
  const who = locked ? [] : (hmWho()[R.id] || []).slice(0, D.spots.length);
  const chars = who.map((k, i) => { const u = hm$(() => portraitURI(k), ''), [px, py] = hIP(...D.spots[i]); return u ? `<ellipse cx="${px}" cy="${py}" rx="15" ry="5" fill="#4a3026" opacity=".18"/><image href="${u}" x="${px - 25}" y="${py - 52}" width="50" height="55" class="ich" style="--i:${i}"/>` : ''; }).join('');
  const X = locked ? { s: '', top: '' } : hm$(() => hmExtra(R, D), { s: '', top: '' });
  const motes = !night && !locked ? [0, 1, 2, 3, 4].map(i => `<circle cx="${110 + i * 37}" cy="${170 + (i % 3) * 22}" r="${i % 2 ? 1.4 : 2}" fill="#fff8d8" class="imote" style="--i:${i}"/>`).join('') : '';
  return `<svg class="hm-iso${night ? ' night' : ''}" viewBox="0 0 380 352" role="img" aria-label="${R.nm}">${HISTD}
    <rect width="380" height="352" fill="${D.sky ? (night ? '#3a4a7a' : '#cfeaf5') : 'url(#ibg)'}"/>
    ${D.s}${X.s}${chars}${motes}${night ? '<rect width="380" height="352" fill="#1d2550" opacity=".3"/>' : ''}${D.g}${X.top}</svg>`;
}
// ---------------- l'écran ----------------
function hmTabsHTML(cur) {
  return `<div class="hm-tabs" role="tablist">${HM_ROOMS.map(R => { const n = hmDot(R), l = hmLvl(R); return `<button role="tab" data-hmroom="${R.id}" aria-selected="${R.id === cur}"${R.lock && l < 1 ? ' class="lk"' : ''}><span class="hm-te">${R.e}</span><small>${R.v}</small>${n ? `<i class="hm-bd">${R.id === 'nurserie' ? n : '!'}</i>` : ''}</button>`; }).join('')}</div>`;
}
function hmStageHTML(R) {
  const l = hmLvl(R), locked = R.lock && l < 1;
  return `<div class="hm-stage" data-hmswipe="1">${hmSceneSVG(R)}
    <div class="hm-tag"><b>${R.nm}</b>${R.b ? `<span>${'★'.repeat(l)}<i>${'★'.repeat(3 - l)}</i></span>` : ''}</div>
    ${locked || R.id === 'jardin' ? '' : `<button class="hm-edit" data-hmedit="1">${hmEdit ? '✓ Terminé' : '✏️ Aménager'}</button>`}
    <button class="hm-nav p" data-hmnav="-1" aria-label="Pièce précédente">‹</button><button class="hm-nav n" data-hmnav="1" aria-label="Pièce suivante">›</button></div>
    <p class="hm-info">${locked ? '<b>À construire.</b> ' : ''}${HM_INFO[R.id] || ''}</p>`;
}
// ---------------- ce qu'on fait dans la pièce ----------------
const hmNrg = k => Math.round(hm$(() => fyC(k).nrg, 50));
const hmPic = (k, mood) => `<img src="${hm$(() => portraitURI(k, mood || 'content'), '')}" alt="">`;
function hmBar(k) { const n = hmNrg(k), st = n >= 70 ? ['ok', 'En forme'] : n < 30 ? ['ko', 'Fatigué'] : ['mid', 'Un peu las']; return `<span class="hm-nb ${st[0]}"><i style="width:${n}%"></i></span><small class="hm-ns ${st[0]}">${st[1]}</small>`; }
const HM_JL = { repos: 'L’énergie et le bonheur remontent.', comm: 'Il cuisine tout seul la recette choisie.', nurs: 'Les œufs éclosent plus vite.', jard: 'Le jardin pousse plus vite et se récolte tout seul.' };
const HM_JT = { repos: 'Au lit', comm: 'Le commis', nurs: 'Le gardien', jard: 'Le jardinier' };
function hmWorkHTML(R) {
  const j = R.j, home = hm$(() => fwHome(), []), on = home.filter(k => hm$(() => fwJob(k), 'repos') === j);
  if (!home.length) return `<p class="hm-none">Tous vos familiers sont en voyage.</p>`;
  const line = HM_JL[j];
  return `<section class="hm-work"><h3 class="hm-h">${HM_JT[j]} <small>${on.length ? on.map(k => esc(CHARS[k].name)).join(', ') : 'personne'}</small></h3>
    ${line && on.length ? `<p class="hm-wl">${esc(line)}</p>` : ''}
    <div class="hm-who">${home.map(k => { const me = on.includes(k), jb = hm$(() => fwJob(k), 'repos'); return `<button class="hm-wk${me ? ' on' : ''}" data-fwjob="${me && j !== 'repos' ? 'repos' : j}" data-fk="${k}" aria-pressed="${me}">${hmPic(k, me && j === 'repos' ? 'dodo' : 'content')}<b>${esc(CHARS[k].name)}</b>${j === 'repos' ? hmBar(k) : `<small>${me ? 'ici ✓' : jb === 'repos' ? 'au repos' : esc(HM_JT[jb] ? HM_JT[jb].replace(/^(Le|Au) /, '') : '')}</small>`}</button>`; }).join('')}</div>
    <p class="hm-tip">${j === 'repos' ? 'Touchez un familier pour le mettre au lit.' : 'Touchez un familier pour lui confier ce poste, encore une fois pour le libérer.'}</p></section>`;
}
function hmTeamHTML() {
  const team = hm$(() => teamIds(), []).filter(k => CHARS[k]);
  return `<section class="hm-work"><h3 class="hm-h">L’équipe de voyage <small>${team.length}/3</small></h3><div class="hm-who">${team.map(k => { const away = !!(S.trips && S.trips[k]); return `<div class="hm-wk on">${hmPic(k)}<b>${esc(CHARS[k].name)}</b>${away ? '<small>en voyage</small>' : hmBar(k)}</div>`; }).join('')}</div>
    <p class="hm-tip">À 70 d’énergie ou plus : +1 objet au retour et moins de risques. Fatigué : un objet de moins. Les Chambres rechargent l’énergie.</p></section>`;
}
function hmProvHTML() {
  const P = hm$(() => eqCount(Object.entries(eqStock()).flatMap(([r, n]) => Array(n).fill(r))), null); if (!P) return '';
  return `<section class="hm-work"><h3 class="hm-h">Provisions de voyage</h3><div class="hm-prov">${Object.entries(EQ_K).map(([k, K]) => `<span class="${P[k] ? 'on' : ''}" style="--pc:${K[1]}"><b>${P[k]}</b>${K[0]}</span>`).join('')}</div><p class="hm-tip">On les emporte au départ (onglet Préparation). Le commis en cuisine tout seul.</p></section>`;
}
function hmGearHTML() {
  const n = hm$(() => (S.inv || []).filter(it => xpGearOf(it)).length, 0);
  return `<button class="btn green hm-go" data-hmgo="atelier">🔨 Ouvrir l’établi</button><p class="hm-tip">${n} objet${n > 1 ? 's' : ''} de matériel prêt${n > 1 ? 's' : ''} pour vos expéditions.</p>`;
}
let hmPanelExtra = () => {}; // aménagement, souvenirs (75_amenager.js)
if (typeof fyRender === 'function') fyRender = (orig => function (box) {
  if (!box || hm$(() => pgTuto(), false)) return orig.apply(this, arguments);
  if (!hmR(hmRoom)) hmRoom = (HM_ROOMS.find(x => x.id === 'nurserie' && hmDot(x)) || HM_ROOMS[0]).id;
  const R = hmR(hmRoom), l = hmLvl(R), locked = R.lock && l < 1;
  const tmp = document.createElement('div');
  try { orig.call(this, tmp); } catch (e) { console.error('foyer', e); }
  box.classList.remove('f3-on');
  box.innerHTML = hmTabsHTML(R.id) + hmStageHTML(R);
  hm$(() => hmPanelExtra(box, R, 'top'), 0);
  if (!locked) {
    if (R.id === 'entree') box.insertAdjacentHTML('beforeend', hmTeamHTML());
    if (R.j) box.insertAdjacentHTML('beforeend', hmWorkHTML(R));
    if (R.id === 'cuisine') { const sel = tmp.querySelector('.fw-post.j-comm .fw-sel'), w = box.querySelector('.hm-work'); if (sel && w) w.insertBefore(sel, w.querySelector('.hm-tip')); box.insertAdjacentHTML('beforeend', hmProvHTML()); }
    R.blocks.forEach(sel => tmp.querySelectorAll(sel).forEach(e => box.appendChild(e)));
    if (R.id === 'nurserie') box.insertAdjacentHTML('beforeend', `<button class="btn cream hm-go" data-hmgo="nurserie">🥚 Toute la nurserie (croisements, habitats)</button>`);
    if (R.id === 'atelier') box.insertAdjacentHTML('beforeend', hmGearHTML());
  }
  const L = box.querySelector('.fy2-list');
  if (L) { L.querySelectorAll('.fy2-b, .fw-jobs, .fw-away, [data-fy="pet2"]').forEach(e => e.remove()); L.insertAdjacentHTML('beforebegin', `<h3 class="hm-h">Nourrir un familier</h3>`); }
  hm$(() => hmPanelExtra(box, R, 'end'), 0);
  if (R.b) box.insertAdjacentHTML('beforeend', `<div class="hm-up"><h3 class="hm-h">${l < 1 ? 'Construire' : l < 3 ? 'Améliorer la pièce' : 'Pièce au maximum'}</h3>${hm$(() => pgCardHTML(PG_BY[R.b]), '')}</div>`);
})(fyRender);
function hmGo(d) { const i = HM_ROOMS.findIndex(x => x.id === hmRoom); hmRoom = HM_ROOMS[(i + d + HM_ROOMS.length) % HM_ROOMS.length].id; renderPanel(); }
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const r = t.closest('[data-hmroom]'); if (r) { ev.stopPropagation(); if (hmRoom !== r.dataset.hmroom) { hmRoom = r.dataset.hmroom; renderPanel(); } return; }
  const n = t.closest('[data-hmnav]'); if (n) { ev.stopPropagation(); hmGo(+n.dataset.hmnav); return; }
  const g = t.closest('[data-hmgo]'); if (g) { ev.stopPropagation(); try { villView = g.dataset.hmgo; } catch (e) {} renderPanel(); const p = $('panelBody'); if (p) p.scrollTop = 0; }
}, true);
{ let x0 = null, y0 = 0; // glisser sur la pièce
  document.addEventListener('touchstart', ev => { const s = ev.target.closest && ev.target.closest('[data-hmswipe]'); x0 = s ? ev.touches[0].clientX : null; y0 = s ? ev.touches[0].clientY : 0; }, { passive: true });
  document.addEventListener('touchend', ev => { if (x0 == null) return; const t = ev.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) hmGo(dx < 0 ? 1 : -1); }, { passive: true });
}
if (typeof rfgHTML === 'function') rfgHTML = (orig => function () {
  const h = orig.apply(this, arguments); if (!h) return h;
  const n = hm$(() => teamIds().length, 0);
  return `<details class="hm-rfg"><summary>🔁 Changer l’équipe</summary>${h}</details>`;
})(rfgHTML);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-fwjob]'); if (!b) return;
  const k = b.dataset.fk, j = b.dataset.fwjob, to = { jard: 'au jardin', comm: hm$(() => pgLvl('repas') > 0, false) ? 'à la cuisine' : 'à l’atelier', nurs: 'à la nurserie', repos: 'se reposer' }[j];
  hm$(() => toast(`${CHARS[k].name} ${j === 'repos' ? 'va ' : 'part '}${to}`), 0);
});
window.__hm = { room: () => hmRoom, svg: id => hmSceneSVG(hmR(id)) };
{
  const st = document.createElement('style');
  st.textContent = `.hm-tabs{display:grid;grid-template-columns:repeat(8,1fr);gap:3px;margin:0 0 8px}
.hm-edit{position:absolute;right:10px;top:10px;padding:6px 12px;border-radius:999px;border:0;background:#fff;color:var(--ink,#4a3528);font:800 13px var(--body,system-ui);box-shadow:0 2px 6px rgba(120,80,40,.2);cursor:pointer}
.hm-work{margin:10px 0}.hm-h small{text-transform:none;letter-spacing:0;font-weight:700;color:#b9a48e;margin-left:4px}
.hm-wl{margin:-2px 2px 8px;font-size:12.5px;color:#2f7f4c;font-weight:600}
.hm-who{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none}
.hm-wk{flex:none;width:86px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px 7px;border:2px solid var(--line,#eadfce);border-radius:16px;background:#fff;font:inherit;color:var(--ink,#4a3528);cursor:pointer}
.hm-wk.on{border-color:#7fc38a;background:#f1faee}.hm-wk img{width:54px;height:58px;object-fit:contain}.hm-wk b{font-size:12.5px}.hm-wk small{font-size:11px;color:#9a8470}
.hm-nb{display:block;width:62px;height:7px;border-radius:9px;background:#eee4d6;overflow:hidden}.hm-nb i{display:block;height:100%;background:#e9b44c}.hm-nb.ok i{background:#5fb36b}.hm-nb.ko i{background:#e0685a}
.hm-ns.ok{color:#2f7f4c!important;font-weight:700}.hm-ns.ko{color:#c0563f!important;font-weight:700}
.hm-tip{margin:2px 2px 0;font-size:12px;color:#a8927c}.hm-none{font-size:13px;color:#9a8470}
.hm-prov{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.hm-prov span{display:flex;flex-direction:column;align-items:center;padding:7px 2px;border-radius:12px;background:#f7f1e8;font-size:11.5px;color:#a8927c}
.hm-prov span.on{background:#fff;box-shadow:inset 0 0 0 2px var(--pc);color:var(--ink,#4a3528)}.hm-prov b{font:800 18px var(--display,inherit);color:var(--pc)}
.hm-work .fw-sel{margin:4px 2px 6px;font-size:12.5px}
.hm-tabs button{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 0 5px;border:2px solid transparent;border-radius:14px;background:#fff7ea;font:inherit;color:var(--ink2,#7a6250);cursor:pointer}
.hm-tabs button[aria-selected=true]{background:#fff;border-color:#f2c14e;color:var(--ink,#4a3528);box-shadow:0 2px 0 #ecd9b6}
.hm-tabs button.lk{opacity:.55}.hm-te{font-size:19px;line-height:1.1}.hm-tabs small{font:800 9px var(--body,system-ui);white-space:nowrap;letter-spacing:-.02em}
.hm-bd{position:absolute;top:-4px;right:-1px;min-width:16px;height:16px;padding:0 3px;border-radius:9px;background:#e0533d;color:#fff;font:800 10px/16px system-ui;font-style:normal;border:1.5px solid #fff;animation:hmPulse 1.4s ease-in-out infinite}
.hm-stage{position:relative;border-radius:22px;overflow:hidden;box-shadow:0 6px 18px -10px rgba(120,80,40,.45);touch-action:pan-y}
.hm-iso{display:block;width:100%;height:auto}
.hm-tag{position:absolute;left:12px;top:10px;padding:5px 12px 6px;border-radius:999px;background:rgba(255,250,240,.92);box-shadow:0 2px 6px rgba(120,80,40,.15)}
.hm-tag b{font:800 15px var(--display,inherit);color:var(--ink,#4a3528);margin-right:6px}.hm-tag span{font-size:12px;color:#e0a01e;letter-spacing:1px}.hm-tag i{font-style:normal;color:#e3d6c2}
.hm-nav{position:absolute;top:50%;width:34px;height:34px;margin-top:-17px;border-radius:50%;border:0;background:rgba(255,250,240,.88);color:var(--ink,#4a3528);font:800 24px/30px system-ui;box-shadow:0 2px 6px rgba(120,80,40,.2);cursor:pointer}
.hm-nav.p{left:8px}.hm-nav.n{right:8px}
.hm-info{margin:8px 4px 4px;font-size:13px;line-height:1.35;color:var(--ink2,#7a6250)}.hm-info b{color:#c0563f}
.hm-h{margin:12px 2px 6px;font:800 13px var(--body,system-ui);color:#9a8470;text-transform:uppercase;letter-spacing:.04em}
.hm-up{margin:6px 0 4px}.hm-go{display:block;width:100%;margin-top:10px}
.hm-deco,.hm-rfg{margin:12px 0;padding:2px 12px;border:2px solid var(--line,#e7dccb);border-radius:14px;background:#fff}
.hm-deco summary,.hm-rfg summary{cursor:pointer;padding:9px 0;font:800 14px var(--display,inherit);color:var(--ink,#4a3528);list-style:none}
.hm-deco summary::-webkit-details-marker,.hm-rfg summary::-webkit-details-marker{display:none}.hm-rfg summary small{color:#9a8470;margin-left:4px}.hm-rfg .rfh,.hm-rfg .rfnote{display:none}
.hm-iso .isun{opacity:.55}.hm-iso.night .isun{opacity:0}.hm-iso.night .iwin{fill:#2b3566}
.hm-iso .iglow{opacity:.5;animation:hmGlow 2.6s ease-in-out infinite alternate}.hm-iso.night .iglow{opacity:1}
.ifire{animation:hmFire .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
.iglow2{animation:hmGlow 1.6s ease-in-out infinite alternate}
.isteam{animation:hmSteam 2.4s ease-in-out infinite}
.iegg.rdy{animation:hmEgg .7s ease-in-out infinite;animation-delay:calc(var(--i,0) * .15s);transform-box:fill-box;transform-origin:50% 100%}
.imob{animation:hmSway 3.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 0}
.isway{animation:hmSway 3.2s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.8s);transform-box:fill-box;transform-origin:50% 100%}
.ifly{animation:hmFly 5s ease-in-out infinite;animation-delay:calc(var(--i,0) * -2s)}
.itw{animation:hmTw 2.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.45s)}
.ich{animation:hmBob 2.4s ease-in-out infinite;animation-delay:calc(var(--i,0) * -1s);transform-box:fill-box;transform-origin:50% 100%}
.imote{opacity:0;animation:hmMote 7s ease-in-out infinite;animation-delay:calc(var(--i,0) * -1.4s)}
@keyframes hmPulse{50%{transform:scale(1.15)}}@keyframes hmFire{to{transform:scale(1.07,.85)}}@keyframes hmGlow{from{opacity:.25}}
@keyframes hmSteam{0%{opacity:0;transform:translateY(4px)}40%{opacity:.9}100%{opacity:0;transform:translateY(-8px)}}
@keyframes hmEgg{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}@keyframes hmSway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes hmFly{0%,100%{transform:translate(0,0)}25%{transform:translate(10px,-8px)}50%{transform:translate(18px,2px)}75%{transform:translate(6px,8px)}}
@keyframes hmTw{50%{opacity:.25}}@keyframes hmBob{50%{transform:scale(1.02,.96)}}
@keyframes hmMote{0%{opacity:0;transform:translate(0,0)}30%{opacity:.9}100%{opacity:0;transform:translate(14px,-30px)}}
@media (prefers-reduced-motion:reduce){.hm-iso *,.hm-bd{animation:none!important}}`;
  document.head.appendChild(st);
}

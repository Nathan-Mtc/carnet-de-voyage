// ================= 83 · LE MOMENT FORT DU VOYAGE : LA CUEILLETTE (v79) =================
// Le joueur (17/11) : « le gameplay est trop figé » ; « pas des mini-jeux moches et simplistes » ; « intuitif, sans charge mentale ».
// Règles décidées :
//  - UN seul moment fort par voyage. Ici : la cueillette, dans les lieux de nature (prairie, sous-bois, alpage).
//  - Il arrive en route (vers 30-50 % du voyage) ; la carte d'action du bas l'annonce (« À vous de cueillir ! »).
//  - Facultatif : si on ne joue pas avant le retour, le compagnon cueille seul (résultat moyen). On n'est jamais puni d'être absent.
//  - Ce qu'on cueille sert vraiment : feuilles, fruits et légumes sont les ingrédients des appâts de l'Herboristerie (donc des œufs).
//  - Jeu : reconnaître la bonne plante parmi ses sosies (menthe / ortie, cèpe / amanite, génépi / aconit), 45 secondes,
//    le soleil qui traverse le ciel sert de minuteur, 3 erreurs et le panier est fini. Une trouvaille rare passe parfois, très vite.
const cu$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- les trois paysages ----------
const CU_BIOMES = {
  prairie: {
    nm: 'la prairie', sky: ['#bfe3f4', '#fff1d2'], far: '#bcd8a2', near: '#98c779', grass: ['#86c064', '#6fae52', '#9bd174'],
    good: { id: 'menthe', nm: 'Menthe sauvage', it: ['Menthe sauvage', 'm', 'feuille', 0, null, '#7fbf6a'], clue: 'feuilles rondes et douces, petits épis mauves' },
    trap: { id: 'ortie', nm: 'Ortie', clue: 'feuilles pointues et poilues, grappes vertes qui pendent' },
    bonus: { id: 'fraise', nm: 'Fraise des bois', it: ['Fraise des bois', 'n', 'fruit', 1, null, '#e5484f'] },
    rare: { id: 'trefle', nm: 'Trèfle à quatre feuilles', it: ['Trèfle à quatre feuilles', 'm', 'feuille', 3, null, '#4fae5a'] },
  },
  sousbois: {
    nm: 'le sous-bois', sky: ['#cfe6c4', '#f7ecc6'], far: '#7fa66a', near: '#5f8f52', grass: ['#6f9e4f', '#5a8a42', '#86b562'],
    good: { id: 'cepe', nm: 'Cèpe', it: ['Cèpe de forêt', 'n', 'legume', 1, null, '#a8723f'], clue: 'chapeau brun bien rond, pied épais et clair' },
    trap: { id: 'amanite', nm: 'Amanite', clue: 'chapeau pâle verdâtre, anneau sur un pied fin' },
    bonus: { id: 'myrtille', nm: 'Myrtilles', it: ['Myrtilles sauvages', 'n', 'fruit', 0, null, '#4a5aa8'] },
    rare: { id: 'truffe', nm: 'Truffe noire', it: ['Truffe noire', 'n', 'legume', 3, null, '#3a2a22'] },
  },
  alpage: {
    nm: 'l’alpage', sky: ['#a8d3f2', '#f1f6fb'], far: '#9aa9c0', near: '#a7d07f', grass: ['#9cc874', '#86b862', '#b2d98a'],
    good: { id: 'genepi', nm: 'Génépi', it: ['Brin de génépi', 'm', 'feuille', 1, null, '#b9c9a8'], clue: 'feuillage argenté et plumeux, pompons jaunes' },
    trap: { id: 'aconit', nm: 'Aconit', clue: 'grandes fleurs bleu foncé en forme de capuchon' },
    bonus: { id: 'myrtille', nm: 'Myrtilles', it: ['Myrtilles sauvages', 'n', 'fruit', 0, null, '#4a5aa8'] },
    rare: { id: 'edelweiss', nm: 'Edelweiss', it: ['Edelweiss', 'm', 'fleur', 3, null, '#f4f1e6'] },
  },
};
const CU_TAG = { foret: 'sousbois', sentier: 'sousbois', camping: 'sousbois', champignon: 'sousbois', montagne: 'alpage', neige: 'alpage', belvedere: 'alpage', campagne: 'prairie', parc: 'prairie', jardin: 'prairie', ferme: 'prairie', verger: 'prairie', lac: 'prairie', riviere: 'prairie', etang: 'prairie', agrumes: 'prairie', zoo: 'prairie' };
function cuBiomeOf(d) { if (!d) return null; for (const t of [d.cat, ...(d.tags || [])]) if (t && CU_TAG[t]) return CU_TAG[t]; return null; }
const CU_GOAL = 12, CU_TIME = 45;

// ---------- le moment fort accroché au voyage ----------
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  cu$(() => {
    const t = S.trips[k]; if (!t || t === before || t.mf) return;
    const b = cuBiomeOf(t.dest); if (!b) return;
    t.mf = { k: 'cueil', b, at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
const cuName = k => cu$(() => CHARS[k].name, 'Votre compagnon');
const cuMk = (def, from, tags) => { const it = makeItem(def, 0, from, tags || [], { fixed: def[3] }); return it; };
function cuGive(t, res) {
  const B = CU_BIOMES[t.mf.b], from = (t.dest && t.dest.name) || '', tags = (t.dest && t.dest.tags) || [], out = [];
  const add = (def, n) => { for (let i = 0; i < n; i++) { const it = cu$(() => cuMk(def, from, tags), null); if (it) { t.bag.push(it); out.push(it); } } };
  add(B.good.it, res.nGood); add(B.bonus.it, res.nBonus); add(B.rare.it, res.nRare);
  return out;
}
function cuAuto(t) { if (!t.mf || (t.mf.st !== 'wait' && t.mf.st !== 'ready')) return; t.mf.st = 'auto'; t.mf.res = { stars: 1, nGood: 1, nBonus: 1, nRare: 0, auto: 1 }; cuGive(t, t.mf.res); cu$(save); }
function cuTick() {
  if (!S || !S.trips) return;
  let ch = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || !t.mf) continue;
    if (t.done) { if (t.mf.st === 'wait' || t.mf.st === 'ready') { cuAuto(t); ch = true; } continue; }
    if (t.mf.st === 'wait' && t.elapsed >= t.total * t.mf.at) {
      t.mf.st = 'ready'; ch = true;
      const B = CU_BIOMES[t.mf.b];
      cu$(() => toast(`🌿 ${cuName(k)} est arrivé dans ${B.nm} : à vous de cueillir !`));
    }
  }
  if (ch) { cu$(save); cu$(() => renderTripCard()); }
}
setInterval(() => { if (!document.hidden) cu$(cuTick); }, 2000);
if (typeof collect === 'function') collect = (orig => function () { cu$(() => Object.values(S.trips).forEach(t => { if (t && t.done && t.mf) cuAuto(t); })); return orig.apply(this, arguments); })(collect);

// ---------- la carte d'action du bas ----------
function cuReady() { for (const [k, t] of Object.entries(S.trips || {})) if (t && !t.done && t.mf && t.mf.st === 'ready') return { k, t }; return null; }
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && a.kind === 'collect') return a;
  if (document.body.classList.contains('firstrun')) return a;
  const R = cu$(cuReady, null);
  return R ? { kind: 'cumf', k: R.k, t: R.t } : a;
})(nextAction);
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = cu$(() => nextAction(), null);
  if (!a || a.kind !== 'cumf') return orig.apply(this, arguments);
  const B = CU_BIOMES[a.t.mf.b];
  box.hidden = false; box.className = 'tripcard act act-cu'; box.dataset.kind = 'cumf'; box.dataset.k = a.k; box.dataset.sig = cu$(() => actionSig(a), '');
  box.innerHTML = `<span class="acic"><img src="${cu$(() => portraitURI(a.k, 'rire'), '')}" alt=""></span><div class="tcx"><span class="ack">Moment fort · ${esc(a.t.dest.name || '')}</span><b class="act-t">Cueillette dans ${esc(B.nm)}</b><span class="acs">À jouer avant son retour, sinon ${esc(cuName(a.k))} cueille seul.</span></div><button class="btn green" data-cuplay="${a.k}">Jouer</button>`;
})(renderActionCard);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-cuplay]'); if (!b) return;
  ev.stopPropagation(); ev.preventDefault();
  cuOpen(b.dataset.cuplay);
}, true);

// ================= LE MINI-JEU =================
let CU = null;
const cuRnd = (a, b) => a + Math.random() * (b - a);
const cuEase = x => 1 - Math.pow(1 - x, 3);
const CU_INK = '#4a3528';

// ----- dessins des plantes (origine = pied de la plante, vers le haut = y négatif ; u = taille) -----
function cuLeaf(c, x, y, len, w, ang, fill, serr, hairs) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(0, 0);
  if (serr) {
    const n = 5;
    for (let i = 1; i <= n; i++) { const t = i / n, px = len * t, pw = w * Math.sin(Math.PI * Math.min(0.98, t)) * (serr === 2 ? 0.9 : 1); c.lineTo(px - len / n * 0.5, -pw * 1.08); c.lineTo(px, -pw * 0.78); }
    for (let i = n; i >= 1; i--) { const t = i / n, px = len * t, pw = w * Math.sin(Math.PI * Math.min(0.98, t)) * (serr === 2 ? 0.9 : 1); c.lineTo(px, pw * 0.78); c.lineTo(px - len / n * 0.5, pw * 1.08); }
  } else { c.quadraticCurveTo(len * 0.5, -w * 1.3, len, 0); c.quadraticCurveTo(len * 0.5, w * 1.3, 0, 0); }
  c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 1.6; c.strokeStyle = CU_INK; c.stroke();
  c.beginPath(); c.moveTo(2, 0); c.lineTo(len * 0.85, 0); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.stroke();
  if (hairs) { c.strokeStyle = 'rgba(74,53,40,.55)'; c.lineWidth = 0.8; for (let i = 0; i < 9; i++) { const px = len * (0.15 + i * 0.09), s = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(px, s * w * 0.75); c.lineTo(px + 2, s * (w * 0.75 + 3.5)); c.stroke(); } }
  c.restore();
}
function cuStem(c, h, col = '#5d9a4a', wd = 3) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-2, -h * 0.5, 0, -h); c.strokeStyle = CU_INK; c.lineWidth = wd + 2.4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = col; c.lineWidth = wd; c.stroke(); }
const CU_DRAW = {
  menthe(c, u) {
    cuStem(c, u * 0.95, '#6fae55');
    for (let i = 0; i < 3; i++) { const y = -u * (0.22 + i * 0.24), L = u * (0.36 - i * 0.06), W = u * (0.15 - i * 0.025); cuLeaf(c, 0, y, L * 0.85, W * 1.35, -0.25, i % 2 ? '#a4dc84' : '#94d474', 0); cuLeaf(c, 0, y, L * 0.85, W * 1.35, Math.PI + 0.25, i % 2 ? '#94d474' : '#a4dc84', 0); }
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cuRndS(i) * 3, -u * (0.98 + i * 0.07), u * 0.055, 0, 7); c.fillStyle = i % 2 ? '#c9a3e8' : '#b48ad9'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.1; c.stroke(); }
  },
  ortie(c, u) {
    cuStem(c, u * 1.0, '#4f8a3f');
    for (let i = 0; i < 3; i++) { const y = -u * (0.24 + i * 0.25), L = u * (0.42 - i * 0.07), W = u * (0.12 - i * 0.02); cuLeaf(c, 0, y, L, W, -0.6, '#3f7a35', 2, true); cuLeaf(c, 0, y, L, W, Math.PI + 0.6, '#386f2f', 2, true); }
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -u * 0.6); c.quadraticCurveTo(s * u * 0.25, -u * 0.62, s * u * 0.3, -u * 0.35); c.strokeStyle = CU_INK; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = '#a8c47a'; c.lineWidth = 2; c.stroke(); for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(s * u * (0.14 + j * 0.05), -u * (0.6 - j * 0.07), 2.2, 0, 7); c.fillStyle = '#b8d48a'; c.fill(); } }
  },
  fraise(c, u) {
    cuStem(c, u * 0.55, '#6fae55', 2.4);
    for (const a of [-0.9, 0, 0.9]) { c.save(); c.translate(0, -u * 0.55); c.rotate(a - Math.PI / 2); cuLeaf(c, 0, 0, u * 0.3, u * 0.12, 0, '#79bb5c', 1); c.restore(); }
    c.save(); c.translate(u * 0.18, -u * 0.25);
    c.beginPath(); c.moveTo(0, -u * 0.12); c.bezierCurveTo(u * 0.17, -u * 0.12, u * 0.12, u * 0.14, 0, u * 0.2); c.bezierCurveTo(-u * 0.12, u * 0.14, -u * 0.17, -u * 0.12, 0, -u * 0.12); c.fillStyle = '#e5484f'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#ffe9a8'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((i % 3 - 1) * u * 0.06, -u * 0.04 + Math.floor(i / 3) * u * 0.09, 1.3, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(-u * 0.08, -u * 0.12); c.lineTo(0, -u * 0.18); c.lineTo(u * 0.08, -u * 0.12); c.lineTo(0, -u * 0.09); c.closePath(); c.fillStyle = '#5fa24f'; c.fill(); c.stroke();
    c.restore();
  },
  trefle(c, u) {
    cuStem(c, u * 0.6, '#5fae55', 2.2);
    c.save(); c.translate(0, -u * 0.6);
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2 + Math.PI / 4); c.beginPath(); const r = u * 0.13; c.moveTo(0, 0); c.bezierCurveTo(-r * 1.4, -r * 0.6, -r * 0.9, -r * 2.1, 0, -r * 1.3); c.bezierCurveTo(r * 0.9, -r * 2.1, r * 1.4, -r * 0.6, 0, 0); c.fillStyle = '#4fae5a'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(0, -r * 1.1); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.stroke(); c.restore(); }
    c.restore();
  },
  cepe(c, u) {
    c.beginPath(); c.moveTo(-u * 0.14, 0); c.bezierCurveTo(-u * 0.24, -u * 0.18, -u * 0.12, -u * 0.42, -u * 0.09, -u * 0.48); c.lineTo(u * 0.09, -u * 0.48); c.bezierCurveTo(u * 0.12, -u * 0.42, u * 0.24, -u * 0.18, u * 0.14, 0); c.closePath(); c.fillStyle = '#f1e2c4'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(168,132,90,.55)'; c.lineWidth = 0.9; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-u * 0.1 + i * u * 0.05, -u * 0.1); c.lineTo(-u * 0.08 + i * u * 0.045, -u * 0.38); c.stroke(); }
    c.beginPath(); c.moveTo(-u * 0.36, -u * 0.44); c.bezierCurveTo(-u * 0.36, -u * 0.86, u * 0.36, -u * 0.86, u * 0.36, -u * 0.44); c.quadraticCurveTo(0, -u * 0.38, -u * 0.36, -u * 0.44); c.fillStyle = '#9a6234'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = CU_INK; c.stroke();
    c.beginPath(); c.moveTo(-u * 0.2, -u * 0.62); c.quadraticCurveTo(-u * 0.05, -u * 0.74, u * 0.12, -u * 0.7); c.strokeStyle = 'rgba(255,230,190,.55)'; c.lineWidth = 3; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.moveTo(-u * 0.32, -u * 0.45); c.quadraticCurveTo(0, -u * 0.41, u * 0.32, -u * 0.45); c.strokeStyle = '#d9c27a'; c.lineWidth = 2; c.stroke();
  },
  amanite(c, u) {
    c.beginPath(); c.ellipse(0, -u * 0.03, u * 0.13, u * 0.06, 0, 0, 7); c.fillStyle = '#f4f1e6'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(-u * 0.06, -u * 0.03); c.lineTo(-u * 0.045, -u * 0.6); c.lineTo(u * 0.045, -u * 0.6); c.lineTo(u * 0.06, -u * 0.03); c.closePath(); c.fillStyle = '#f7f4ea'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-u * 0.06, -u * 0.4); c.quadraticCurveTo(0, -u * 0.32, u * 0.07, -u * 0.4); c.lineTo(u * 0.05, -u * 0.44); c.lineTo(-u * 0.05, -u * 0.44); c.closePath(); c.fillStyle = '#fffdf5'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-u * 0.32, -u * 0.58); c.bezierCurveTo(-u * 0.3, -u * 0.9, u * 0.3, -u * 0.9, u * 0.32, -u * 0.58); c.quadraticCurveTo(0, -u * 0.53, -u * 0.32, -u * 0.58); c.fillStyle = '#c9cf9a'; c.fill(); c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.9; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-u * 0.26 + i * u * 0.085, -u * 0.58); c.lineTo(-u * 0.22 + i * u * 0.075, -u * 0.62); c.stroke(); }
  },
  myrtille(c, u) {
    cuStem(c, u * 0.7, '#6f8f4a', 2.2);
    for (let i = 0; i < 4; i++) cuLeaf(c, 0, -u * (0.2 + i * 0.13), u * 0.2, u * 0.08, i % 2 ? -0.7 : Math.PI + 0.7, '#6fa45a', 0);
    for (const [x, y] of [[-0.14, -0.42], [0.12, -0.55], [-0.06, -0.66], [0.16, -0.32], [0.02, -0.5]]) { c.beginPath(); c.arc(x * u, y * u, u * 0.065, 0, 7); c.fillStyle = '#4a5aa8'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.3; c.stroke(); c.beginPath(); c.arc(x * u - u * 0.02, y * u - u * 0.02, u * 0.018, 0, 7); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); }
  },
  truffe(c, u) {
    c.beginPath(); c.ellipse(0, -u * 0.05, u * 0.34, u * 0.08, 0, 0, 7); c.fillStyle = '#7a5a3a'; c.fill();
    c.beginPath(); for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI, r = u * (0.2 + (i % 2) * 0.02); c.lineTo(Math.cos(a) * r, -u * 0.06 + Math.sin(a) * r * 0.95); } c.closePath(); c.fillStyle = '#3a2a22'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-u * 0.1 + i * u * 0.04, -u * 0.14 - (i % 2) * u * 0.05, 1.4, 0, 7); c.fill(); }
  },
  genepi(c, u) {
    for (const s of [-0.25, 0, 0.25]) { c.save(); c.rotate(s); cuStem(c, u * 0.85, '#a7b79a', 2); for (let i = 0; i < 5; i++) { const y = -u * (0.15 + i * 0.13); for (const d of [-1, 1]) { c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(d * u * 0.09, y - u * 0.02, d * u * 0.13, y - u * 0.07); c.strokeStyle = CU_INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#c9d6bc'; c.lineWidth = 1.6; c.stroke(); } } c.beginPath(); c.arc(0, -u * 0.88, u * 0.06, 0, 7); c.fillStyle = '#f2cf3a'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.2; c.stroke(); c.restore(); }
  },
  aconit(c, u) {
    cuStem(c, u * 1.05, '#4f8a4f', 2.6);
    for (let i = 0; i < 3; i++) cuLeaf(c, 0, -u * (0.12 + i * 0.12), u * 0.3, u * 0.12, i % 2 ? -0.5 : Math.PI + 0.5, '#4f8a4f', 2);
    for (let i = 0; i < 5; i++) { const y = -u * (0.55 + i * 0.11), x = (i % 2 ? 1 : -1) * u * 0.06; c.beginPath(); c.moveTo(x - u * 0.07, y + u * 0.04); c.quadraticCurveTo(x - u * 0.08, y - u * 0.09, x + u * 0.02, y - u * 0.08); c.quadraticCurveTo(x + u * 0.08, y - u * 0.02, x + u * 0.06, y + u * 0.04); c.closePath(); c.fillStyle = i % 2 ? '#3f4fb0' : '#3446a0'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.3; c.stroke(); }
  },
  edelweiss(c, u) {
    cuStem(c, u * 0.55, '#b9c4ae', 2.2);
    c.save(); c.translate(0, -u * 0.6);
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-u * 0.07, -u * 0.12, 0, -u * 0.22); c.quadraticCurveTo(u * 0.07, -u * 0.12, 0, 0); c.fillStyle = '#f7f5ee'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1.2; c.stroke(); c.restore(); }
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(Math.cos(i * 1.26) * u * 0.04, Math.sin(i * 1.26) * u * 0.04, u * 0.035, 0, 7); c.fillStyle = '#f0d36a'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 1; c.stroke(); }
    c.restore();
  },
};
function cuRndS(i) { return Math.sin(i * 12.9898) * 1.3; }

// ----- le décor : peint une fois (fond), puis l'herbe, la lumière et le pollen bougent -----
function cuBg(W, H, b) {
  const B = CU_BIOMES[b], cv = document.createElement('canvas'), dpr = CU.dpr; cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const g = c.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, B.sky[0]); g.addColorStop(1, B.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const hz = H * 0.5;
  if (b === 'alpage') {
    const mt = (pts, col, snow) => { c.beginPath(); c.moveTo(0, hz); pts.forEach(([x, y]) => c.lineTo(x * W, y * H)); c.lineTo(W, hz); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(74,53,40,.35)'; c.lineWidth = 1.5; c.stroke(); if (snow) { pts.forEach(([x, y], i) => { if (y < 0.3 && i > 0 && i < pts.length - 1) { c.beginPath(); c.moveTo(x * W, y * H); c.lineTo((x - 0.05) * W, (y + 0.06) * H); c.lineTo((x - 0.015) * W, (y + 0.045) * H); c.lineTo(x * W, (y + 0.07) * H); c.lineTo((x + 0.02) * W, (y + 0.045) * H); c.lineTo((x + 0.05) * W, (y + 0.06) * H); c.closePath(); c.fillStyle = '#fff'; c.fill(); } }); } };
    mt([[0, 0.36], [0.16, 0.22], [0.3, 0.33], [0.46, 0.17], [0.62, 0.3], [0.8, 0.2], [1, 0.34]], '#a9b6cc', true);
    mt([[0, 0.44], [0.2, 0.36], [0.4, 0.42], [0.58, 0.34], [0.78, 0.41], [1, 0.38]], '#86a68a', false);
  } else {
    c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += 8) c.lineTo(x, hz - 18 - Math.sin(x / W * 5 + 1) * 16 - Math.sin(x / W * 13) * 6); c.lineTo(W, H); c.lineTo(0, H); c.fillStyle = B.far; c.fill();
  }
  if (b === 'sousbois') {
    for (let i = 0; i < 7; i++) { const x = (i + 0.3) / 7 * W + cuRndS(i) * 14, w = 18 + (i % 3) * 8; const tg = c.createLinearGradient(x, 0, x + w, 0); tg.addColorStop(0, '#6b4a33'); tg.addColorStop(1, '#8a6446'); c.fillStyle = tg; c.fillRect(x, 0, w, hz + 30); c.strokeStyle = 'rgba(74,53,40,.5)'; c.lineWidth = 1.5; c.strokeRect(x, -2, w, hz + 32); }
    for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(i / 17 * W, 10 + (i % 3) * 18, 48 + (i % 4) * 10, 0, 7); c.fillStyle = i % 2 ? '#4f7f45' : '#5d8f4f'; c.fill(); }
  } else {
    for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * W + cuRndS(i + 3) * 30, y = hz - 6; if (b === 'alpage') { c.beginPath(); c.moveTo(x, y - 34); c.lineTo(x + 11, y); c.lineTo(x - 11, y); c.closePath(); c.fillStyle = '#4f7f5a'; c.fill(); c.strokeStyle = 'rgba(74,53,40,.45)'; c.lineWidth = 1.2; c.stroke(); } else { c.fillStyle = '#7a5a40'; c.fillRect(x - 2, y - 12, 4, 14); c.beginPath(); c.arc(x, y - 20, 13 + (i % 2) * 4, 0, 7); c.fillStyle = i % 2 ? '#79ad5e' : '#6aa052'; c.fill(); c.strokeStyle = 'rgba(74,53,40,.4)'; c.stroke(); } }
  }
  // le pré
  const gg = c.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, B.near); gg.addColorStop(1, B.grass[1]); c.fillStyle = gg;
  c.beginPath(); c.moveTo(0, hz + 6); for (let x = 0; x <= W; x += 10) c.lineTo(x, hz + 6 - Math.sin(x / W * 3.2) * 10); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  // petites touches : fleurs, cailloux, feuilles mortes
  for (let i = 0; i < 70; i++) { const x = Math.random() * W, y = hz + 20 + Math.random() * (H - hz - 20), r = 1.4 + Math.random() * 2.2; c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = b === 'sousbois' ? ['#b5703a', '#c98f5a', '#8a5a3a'][i % 3] : ['#fff8f0', '#f6d36a', '#f2a6c0', '#c9a3e8'][i % 4]; c.globalAlpha = 0.85; c.fill(); c.globalAlpha = 1; }
  return cv;
}
function cuBlades(W, H) {
  const L = [], hz = H * 0.5;
  for (let i = 0; i < 150; i++) { const y = hz + 14 + Math.pow(Math.random(), 0.7) * (H - hz - 10); L.push({ x: Math.random() * W, y, h: 8 + (y - hz) / (H - hz) * 26 * (0.6 + Math.random() * 0.6), p: Math.random() * 6, c: Math.floor(Math.random() * 3) }); }
  return L.sort((a, b) => a.y - b.y);
}

// ----- ouverture / fermeture -----
function cuOpen(k) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.st !== 'ready' || t.done) { cu$(() => toast('Ce moment est passé.')); return; }
  if (CU) return;
  const B = CU_BIOMES[t.mf.b];
  const el = document.createElement('div'); el.id = 'cuG'; el.className = 'cu-ov';
  el.innerHTML = `<canvas class="cu-cv"></canvas>
    <div class="cu-top"><div class="cu-herb"><canvas class="cu-ico" width="88" height="88"></canvas><div><b>${esc(B.good.nm)}</b><span class="cu-cnt">0 / ${CU_GOAL}</span></div></div><div class="cu-hearts" aria-label="Erreurs restantes"><i></i><i></i><i></i></div></div>
    <div class="cu-combo" hidden></div>
    <div class="cu-me"><img alt="" src="${cu$(() => portraitURI(k), '')}"><span class="cu-bask"><b>0</b></span></div>
    <div class="cu-card cu-intro"><p class="cu-k">Moment fort · ${esc(t.dest.name || '')}</p><h3>Cueillette dans ${esc(B.nm)}</h3>
      <div class="cu-cmp"><figure class="ok"><canvas width="160" height="160" data-p="${B.good.id}"></canvas><figcaption><b>${esc(B.good.nm)}</b> : cueillez<small>${esc(B.good.clue)}</small></figcaption></figure>
      <figure class="ko"><canvas width="160" height="160" data-p="${B.trap.id}"></canvas><figcaption><b>${esc(B.trap.nm)}</b> : n’y touchez pas<small>${esc(B.trap.clue)}</small></figcaption></figure></div>
      <p class="cu-tip">Bonus : ${esc(B.bonus.nm)}. Et si quelque chose brille… soyez rapide !</p>
      <button class="btn green big wide" data-cugo="1">Cueillir !</button><button class="cu-later" data-cuquit="1">Plus tard</button></div>`;
  document.body.appendChild(el);
  CU = { k, t, B, el, cv: el.querySelector('.cu-cv'), dpr: Math.min(2, window.devicePixelRatio || 1), plants: [], fx: [], pollen: [], st: 'intro', time: 0, good: 0, bonus: 0, rare: 0, err: 0, combo: 0, best: 0, rareLeft: 2, nextSpawn: 0.4, nextRare: cuRnd(10, 30), shake: 0, flash: 0 };
  el.querySelectorAll('canvas[data-p]').forEach(cv => { const c = cv.getContext('2d'); c.translate(80, 140); CU_DRAW[cv.dataset.p](c, 120); });
  { const cv = el.querySelector('.cu-ico'), c = cv.getContext('2d'); c.translate(44, 80); CU_DRAW[B.good.id](c, 64); }
  cuSize(); window.addEventListener('resize', cuSize);
  CU.cv.addEventListener('pointerdown', cuTap);
  CU.last = performance.now(); requestAnimationFrame(cuLoop);
  document.body.classList.add('cu-on');
}
function cuSize() {
  if (!CU) return;
  const W = window.innerWidth, H = window.innerHeight; CU.W = W; CU.H = H;
  CU.cv.width = W * CU.dpr; CU.cv.height = H * CU.dpr; CU.cv.style.width = W + 'px'; CU.cv.style.height = H + 'px';
  CU.bg = cuBg(W, H, CU.t.mf.b); CU.blades = cuBlades(W, H);
  CU.pollen = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.9, v: cuRnd(6, 18), p: Math.random() * 6 }));
}
function cuClose() {
  if (!CU) return;
  window.removeEventListener('resize', cuSize);
  CU.el.remove(); CU = null; document.body.classList.remove('cu-on');
  cu$(() => renderTripCard()); cu$(renderTop);
}
document.addEventListener('click', ev => {
  if (!CU) return;
  const b = ev.target.closest && ev.target.closest('[data-cugo],[data-cuquit],[data-cudone]'); if (!b) return;
  ev.stopPropagation();
  if (b.dataset.cugo) { CU.el.querySelector('.cu-intro').remove(); CU.st = 'play'; CU.time = 0; cu$(() => sfx('pop')); return; }
  if (b.dataset.cuquit || b.dataset.cudone) cuClose();
}, true);

// ----- la partie -----
function cuSlotFree(x, y) { return !CU.plants.some(p => !p.gone && Math.abs(p.x - x) < 78 && Math.abs(p.y - y) < 56); }
function cuSpawn(kind) {
  const W = CU.W, H = CU.H, hz = H * 0.5;
  for (let tries = 0; tries < 14; tries++) {
    const y = hz + 70 + Math.random() * (H - hz - 190), x = 40 + Math.random() * (W - 80);
    if (!cuSlotFree(x, y)) continue;
    if (CU.plants.filter(p => !p.gone && !p.pick).length >= 6) return;
    const depth = (y - hz) / (H - hz), u = 62 + depth * 52;
    const B = CU.B, id = kind === 'good' ? B.good.id : kind === 'trap' ? B.trap.id : kind === 'bonus' ? B.bonus.id : B.rare.id;
    const life = kind === 'rare' ? 1.25 : Math.max(1.55, 2.6 - CU.time / CU_TIME * 0.9);
    CU.plants.push({ kind, id, x, y, u, age: 0, life, sway: Math.random() * 6, gone: false, pick: 0 });
    return;
  }
}
function cuTap(ev) {
  if (!CU || CU.st !== 'play') return;
  const r = CU.cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
  let hit = null;
  for (const p of CU.plants) { if (p.gone || p.pick) continue; const top = p.y - p.u * 0.95; if (x > p.x - p.u * 0.5 && x < p.x + p.u * 0.5 && y > top - 10 && y < p.y + 12) { if (!hit || p.y > hit.y) hit = p; } }
  if (!hit) return;
  if (hit.kind === 'trap') {
    hit.pick = -1; CU.err++; CU.combo = 0; CU.shake = 0.35; CU.flash = 0.45;
    cuFx(hit.x, hit.y - hit.u * 0.6, `Aïe ! ${CU.B.trap.nm}`, '#d9604f');
    cuMood('surpris');
    const hs = CU.el.querySelectorAll('.cu-hearts i'); if (hs[3 - CU.err]) hs[3 - CU.err].classList.add('off');
    cu$(() => navigator.vibrate && navigator.vibrate(60));
    if (CU.err >= 3) cuEnd();
    return;
  }
  hit.pick = 1; hit.pt = 0; hit.fx0 = hit.x; hit.fy0 = hit.y;
  CU.combo++; CU.best = Math.max(CU.best, CU.combo);
  if (hit.kind === 'good') CU.good++; else if (hit.kind === 'bonus') CU.bonus++; else CU.rare++;
  const txt = hit.kind === 'rare' ? `✨ ${CU.B.rare.nm} !` : hit.kind === 'bonus' ? `+ ${CU.B.bonus.nm}` : CU.combo >= 3 ? `Bien vu ! ×${CU.combo}` : '+1';
  cuFx(hit.x, hit.y - hit.u * 0.7, txt, hit.kind === 'rare' ? '#d99a1a' : '#3f8f4a', hit.kind === 'rare' ? 16 : 8);
  cuMood(hit.kind === 'rare' || CU.combo >= 4 ? 'rire' : 'content');
  CU.el.querySelector('.cu-cnt').textContent = `${Math.min(CU.good, CU_GOAL)} / ${CU_GOAL}`;
  CU.el.querySelector('.cu-bask b').textContent = CU.good + CU.bonus + CU.rare;
  const cb = CU.el.querySelector('.cu-combo'); if (CU.combo >= 3) { cb.hidden = false; cb.textContent = `Série ×${CU.combo}`; cb.classList.remove('pop'); void cb.offsetWidth; cb.classList.add('pop'); } else cb.hidden = true;
  cu$(() => sfx('pop'));
}
let cuMoodT = 0;
function cuMood(m) {
  const img = CU && CU.el.querySelector('.cu-me img'); if (!img) return;
  img.src = cu$(() => portraitURI(CU.k, m), img.src);
  const me = CU.el.querySelector('.cu-me'); me.classList.remove('hop', 'oops'); void me.offsetWidth; me.classList.add(m === 'surpris' ? 'oops' : 'hop');
  clearTimeout(cuMoodT); cuMoodT = setTimeout(() => { if (CU) img.src = cu$(() => portraitURI(CU.k), img.src); }, 900);
}
function cuFx(x, y, txt, col, sparks = 0) {
  CU.fx.push({ x, y, txt, col, a: 0 });
  for (let i = 0; i < sparks; i++) { const a = Math.random() * 7, v = cuRnd(40, 140); CU.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, a: 0, sp: 1, col }); }
}
function cuLoop(now) {
  if (!CU) return;
  const dt = Math.min(0.05, (now - CU.last) / 1000); CU.last = now;
  if (CU.st === 'play') {
    CU.time += dt;
    CU.nextSpawn -= dt;
    if (CU.nextSpawn <= 0) {
      const r = Math.random(); cuSpawn(r < 0.52 ? 'good' : r < 0.86 ? 'trap' : 'bonus');
      CU.nextSpawn = Math.max(0.3, 0.6 - CU.time / CU_TIME * 0.28) * cuRnd(0.8, 1.2);
    }
    if (CU.rareLeft && CU.time >= CU.nextRare) { CU.rareLeft--; CU.nextRare = CU.time + cuRnd(9, 16); cuSpawn('rare'); }
    if (CU.time >= CU_TIME) cuEnd();
  }
  for (const p of CU.plants) {
    p.age += dt;
    if (p.pick === 1) p.pt += dt * 2.4;
    if (p.pick === -1) p.pt = (p.pt || 0) + dt * 3;
    if ((p.pick === 0 && p.age > p.life + 0.32) || (p.pick && p.pt >= 1)) p.gone = true;
  }
  CU.plants = CU.plants.filter(p => !p.gone);
  for (const f of CU.fx) { f.a += dt; if (f.sp) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 220 * dt; } else f.y -= 26 * dt; }
  CU.fx = CU.fx.filter(f => f.a < (f.sp ? 0.7 : 1));
  CU.shake = Math.max(0, CU.shake - dt); CU.flash = Math.max(0, CU.flash - dt);
  cuDraw();
  requestAnimationFrame(cuLoop);
}
function cuDraw() {
  const c = CU.cv.getContext('2d'), W = CU.W, H = CU.H, T = CU.last / 1000;
  c.setTransform(CU.dpr, 0, 0, CU.dpr, 0, 0);
  const sx = CU.shake ? (Math.random() - 0.5) * 10 * CU.shake / 0.35 : 0;
  c.save(); c.translate(sx, 0);
  c.drawImage(CU.bg, 0, 0, W, H);
  // le soleil traverse le ciel : c'est le minuteur
  const k = CU.st === 'play' ? Math.min(1, CU.time / CU_TIME) : CU.st === 'end' ? 1 : 0, sxp = W * (0.08 + 0.84 * k), syp = H * (0.2 - Math.sin(k * Math.PI) * 0.12);
  const sg = c.createRadialGradient(sxp, syp, 4, sxp, syp, 70); sg.addColorStop(0, k > 0.8 ? 'rgba(255,170,90,.75)' : 'rgba(255,236,150,.8)'); sg.addColorStop(1, 'rgba(255,236,150,0)');
  c.fillStyle = sg; c.fillRect(sxp - 70, syp - 70, 140, 140);
  c.beginPath(); c.arc(sxp, syp, 17, 0, 7); c.fillStyle = k > 0.8 ? '#ffb46a' : '#ffd95a'; c.fill(); c.strokeStyle = CU_INK; c.lineWidth = 2; c.stroke();
  // rais de lumière
  c.save(); c.globalAlpha = CU.t.mf.b === 'sousbois' ? 0.16 : 0.08; c.fillStyle = '#fff7d6';
  for (let i = 0; i < 4; i++) { const x0 = W * (0.15 + i * 0.22) + Math.sin(T * 0.3 + i) * 12; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 40, 0); c.lineTo(x0 + 150, H); c.lineTo(x0 + 70, H); c.closePath(); c.fill(); }
  c.restore();
  // plantes (de loin vers près) + brins d'herbe devant elles
  const items = CU.plants.slice().sort((a, b) => a.y - b.y);
  let bi = 0; const B = CU.B, bl = CU.blades;
  const drawBlade = g => { const sw = Math.sin(T * 1.6 + g.p + g.x / 120) * 3.5; c.beginPath(); c.moveTo(g.x - 2, g.y); c.quadraticCurveTo(g.x + sw * 0.4, g.y - g.h * 0.6, g.x + sw, g.y - g.h); c.quadraticCurveTo(g.x + sw * 0.4 + 1.5, g.y - g.h * 0.55, g.x + 2.5, g.y); c.closePath(); c.fillStyle = B.grass[g.c]; c.fill(); };
  for (const p of items) {
    while (bi < bl.length && bl[bi].y < p.y - 4) drawBlade(bl[bi++]);
    let s;
    if (p.pick === 1) s = 1;
    else if (p.age < 0.32) s = cuEase(p.age / 0.32);
    else if (p.age > p.life) s = Math.max(0, 1 - (p.age - p.life) / 0.32);
    else s = 1;
    c.save();
    let px = p.x, py = p.y, rot = Math.sin(T * 2 + p.sway) * 0.06, alpha = 1;
    if (p.pick === 1) { const e = cuEase(Math.min(1, p.pt)); const bx = 74, by = H - 70; px = p.fx0 + (bx - p.fx0) * e; py = p.fy0 + (by - p.fy0) * e - Math.sin(e * Math.PI) * 120; s = 1 - e * 0.65; rot = e * 2.4; }
    if (p.pick === -1) { rot = Math.sin(p.pt * 40) * 0.25; alpha = 1 - p.pt; }
    c.globalAlpha = alpha; c.translate(px, py); c.rotate(rot); c.scale(s, s);
    if (p.kind === 'rare') { const gl = c.createRadialGradient(0, -p.u * 0.45, 2, 0, -p.u * 0.45, p.u * 0.9); gl.addColorStop(0, 'rgba(255,226,120,.9)'); gl.addColorStop(1, 'rgba(255,226,120,0)'); c.fillStyle = gl; c.fillRect(-p.u, -p.u * 1.4, p.u * 2, p.u * 1.8); }
    c.beginPath(); c.ellipse(0, 2, p.u * 0.32, p.u * 0.07, 0, 0, 7); c.fillStyle = 'rgba(40,60,20,.22)'; c.fill();
    cu$(() => CU_DRAW[p.id](c, p.u));
    if (p.kind === 'rare') { c.fillStyle = '#fff6c9'; for (let i = 0; i < 3; i++) { const a = T * 4 + i * 2.1; c.save(); c.translate(Math.cos(a) * p.u * 0.35, -p.u * 0.5 + Math.sin(a) * p.u * 0.3); c.rotate(a); c.fillRect(-1, -5, 2, 10); c.fillRect(-5, -1, 10, 2); c.restore(); } }
    c.restore();
  }
  while (bi < bl.length) drawBlade(bl[bi++]);
  // pollen
  c.fillStyle = 'rgba(255,250,220,.85)';
  for (const q of CU.pollen) { q.y -= q.v * 0.016; q.x += Math.sin(T + q.p) * 0.3; if (q.y < -5) { q.y = H * 0.95; q.x = Math.random() * W; } c.beginPath(); c.arc(q.x, q.y, 1.6, 0, 7); c.fill(); }
  // textes et étincelles
  for (const f of CU.fx) {
    if (f.sp) { c.globalAlpha = 1 - f.a / 0.7; c.fillStyle = f.col === '#d99a1a' ? '#ffd95a' : '#fff6c9'; c.beginPath(); c.arc(f.x, f.y, 2.6, 0, 7); c.fill(); c.globalAlpha = 1; continue; }
    c.globalAlpha = Math.min(1, 2 - f.a * 2); c.font = '800 17px Fredoka, "Baloo 2", system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fffaf0'; c.strokeText(f.txt, f.x, f.y); c.fillStyle = f.col; c.fillText(f.txt, f.x, f.y); c.globalAlpha = 1;
  }
  c.restore();
  if (CU.flash) { c.fillStyle = `rgba(217,96,79,${CU.flash * 0.35})`; c.fillRect(0, 0, W, H); }
  // vignette douce
  const vg = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,20,.28)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
function cuIcoURL(name) {
  const B = CU.B, id = name === B.good.it[0] ? B.good.id : name === B.bonus.it[0] ? B.bonus.id : name === B.rare.it[0] ? B.rare.id : B.good.id;
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d'); c.translate(48, 86); cu$(() => CU_DRAW[id](c, 72)); return cv.toDataURL();
}
function cuEnd() {
  if (!CU || CU.st !== 'play') return;
  CU.st = 'end';
  const cbx = CU.el.querySelector('.cu-combo'); if (cbx) cbx.hidden = true;
  const g = CU.good, stars = g >= CU_GOAL && CU.err <= 1 ? 3 : g >= CU_GOAL * 0.6 ? 2 : g >= 3 ? 1 : 0;
  const res = { stars, nGood: Math.min(5, (g >= 2 ? Math.max(1, Math.floor(g / 3)) : 0) + (stars === 3 ? 1 : 0)), nBonus: Math.min(3, Math.floor(CU.bonus / 2) + (CU.bonus === 1 ? 1 : 0)), nRare: Math.min(1, CU.rare) };
  const t = CU.t; t.mf.st = 'done'; t.mf.res = res;
  const got = cuGive(t, res); cu$(save);
  cu$(() => t.journal.push({ t: Date.now(), kind: 'cueil', text: `${cuName(CU.k)} a fait une belle cueillette : ${got.length} trouvaille${got.length > 1 ? 's' : ''}.` }));
  const card = document.createElement('div'); card.className = 'cu-card cu-end';
  const st = [1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('');
  const groups = {}; got.forEach(it => { (groups[it.name] = groups[it.name] || { it, n: 0 }).n++; });
  card.innerHTML = `<p class="cu-k">${['Panier presque vide', 'Jolie cueillette', 'Belle cueillette', 'Cueillette parfaite'][stars]}</p><div class="cu-stars">${st}</div>
    <p class="cu-sum">${esc(CU.B.good.nm)} × ${g}${CU.bonus ? ` · ${esc(CU.B.bonus.nm)} × ${CU.bonus}` : ''}${CU.rare ? ` · ✨ ${esc(CU.B.rare.nm)}` : ''}${CU.err ? ` · ${CU.err} erreur${CU.err > 1 ? 's' : ''}` : ''}</p>
    <div class="cu-loot">${Object.values(groups).map(({ it, n }) => `<span class="cu-li" style="--rc:${cu$(() => RARC[it.rarity], '#ccc')}"><img src="${cuIcoURL(it.name)}" alt=""><b>${esc(it.name)}</b>${n > 1 ? `<em>×${n}</em>` : ''}</span>`).join('') || '<span class="cu-none">Rien cette fois…</span>'}</div>
    <p class="cu-tip">${got.length ? `${esc(cuName(CU.k))} les rapporte à son retour. Ils servent à fabriquer des appâts à l’Herboristerie.` : 'La prochaine fois, regardez bien la forme des feuilles.'}</p>
    <button class="btn green big wide" data-cudone="1">Super !</button>`;
  CU.el.appendChild(card);
  cuMood(stars >= 2 ? 'rire' : 'triste');
}
window.__cu = { render: () => renderTripCard(), collect: () => collect(), open: k => cuOpen(k), force: k => { const t = S.trips[k]; if (t) { t.mf = t.mf || { k: 'cueil', b: 'prairie', at: 0, st: 'wait' }; t.mf.st = 'ready'; } }, biome: (k, b) => { const t = S.trips[k]; if (t && t.mf) t.mf.b = b; }, state: () => CU && { st: CU.st, good: CU.good, err: CU.err, n: CU.plants.length }, end: () => { if (CU) { CU.time = CU_TIME; } }, tapGood: () => { if (!CU) return 0; const p = CU.plants.find(x => x.kind === 'good' && !x.pick); if (!p) return 0; cuTap({ clientX: p.x, clientY: p.y - p.u * 0.4 }); return 1; } };

{
  const st = document.createElement('style');
  st.textContent = `
.cu-ov{position:fixed;inset:0;z-index:9000;background:#f6ecd2;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
.cu-cv{position:absolute;inset:0;display:block}
.cu-top{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;justify-content:space-between;align-items:flex-start;padding:0 12px;pointer-events:none}
.cu-herb{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:18px;background:rgba(255,250,240,.94);border:2.5px solid #4a3528;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.cu-herb canvas{width:44px;height:44px;border-radius:12px;background:#eef6e2;border:1.5px solid #cfdcb8}
.cu-herb b{display:block;font:800 14px var(--display,system-ui);color:#3f7a3a}.cu-herb .cu-cnt{font:800 18px var(--display,system-ui);color:#4a3528}
.cu-hearts{display:flex;gap:4px;padding:7px 9px;border-radius:16px;background:rgba(255,250,240,.94);border:2.5px solid #4a3528}
.cu-hearts i{width:20px;height:20px;border-radius:50% 0 50% 50%;transform:rotate(-45deg);background:#7fc462;border:2px solid #4a3528;transition:all .25s}
.cu-hearts i.off{background:#d9cfbf;opacity:.5;transform:rotate(-45deg) scale(.8)}
.cu-combo{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 76px);transform:translateX(-50%);padding:4px 14px;border-radius:999px;background:#ffd95a;border:2.5px solid #4a3528;font:800 15px var(--display,system-ui);color:#4a3528;pointer-events:none}
.cu-combo.pop{animation:cuPop .35s ease-out}@keyframes cuPop{0%{transform:translateX(-50%) scale(.6)}70%{transform:translateX(-50%) scale(1.15)}100%{transform:translateX(-50%) scale(1)}}
.cu-me{position:absolute;left:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);width:118px;height:128px;pointer-events:none}
.cu-me img{position:absolute;left:0;bottom:6px;width:110px;height:auto;filter:drop-shadow(0 3px 0 rgba(74,53,40,.25))}
.cu-me.hop img{animation:cuHop .45s ease-out}.cu-me.oops img{animation:cuOops .4s ease-out}
@keyframes cuHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}}
@keyframes cuOops{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px) rotate(-4deg)}75%{transform:translateX(6px) rotate(4deg)}}
.cu-bask{position:absolute;right:-8px;bottom:0;width:58px;height:42px;border-radius:6px 6px 22px 22px;background:repeating-linear-gradient(90deg,#c98f5a 0 6px,#b5784a 6px 12px);border:2.5px solid #4a3528;display:flex;align-items:center;justify-content:center}
.cu-bask::before{content:'';position:absolute;left:8px;right:8px;top:-16px;height:22px;border:2.5px solid #4a3528;border-bottom:0;border-radius:20px 20px 0 0}
.cu-bask b{font:800 16px var(--display,system-ui);color:#fffaf0;text-shadow:0 1px 0 #4a3528,0 -1px 0 #4a3528,1px 0 0 #4a3528,-1px 0 0 #4a3528}
.cu-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,380px);max-height:88vh;overflow:auto;padding:16px 16px 14px;border-radius:24px;background:#fffaf0;border:3px solid #4a3528;box-shadow:0 6px 0 rgba(74,53,40,.3);text-align:center;animation:cuIn .35s ease-out}
@keyframes cuIn{from{transform:translate(-50%,-44%);opacity:0}to{transform:translate(-50%,-50%);opacity:1}}
.cu-k{margin:0;font:800 12px var(--display,system-ui);letter-spacing:.06em;text-transform:uppercase;color:#a5784f}
.cu-card h3{margin:2px 0 10px;font:800 22px var(--display,system-ui);color:#4a3528}
.cu-cmp{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cu-cmp figure{margin:0;padding:6px 6px 8px;border-radius:16px;border:2.5px solid}
.cu-cmp figure.ok{background:#eef8e6;border-color:#6fb06a}.cu-cmp figure.ko{background:#fdecea;border-color:#d9604f}
.cu-cmp canvas{width:100%;max-width:120px;aspect-ratio:1;display:block;margin:0 auto}
.cu-cmp figcaption{font:600 12.5px/1.25 var(--body,system-ui);color:#4a3528}.cu-cmp figcaption b{font-weight:800}
.cu-cmp figcaption small{display:block;margin-top:3px;color:#7a5f48;font-size:11.5px}
.cu-cmp .ok figcaption b{color:#3f7a3a}.cu-cmp .ko figcaption b{color:#b5443a}
.cu-tip{margin:10px 0;font:600 12.5px var(--body,system-ui);color:#7a5f48}
.cu-later{display:block;margin:8px auto 0;background:none;border:0;font:700 13px var(--body,system-ui);color:#8a6a4a;text-decoration:underline;cursor:pointer}
.cu-stars{display:flex;justify-content:center;gap:6px;margin:4px 0}.cu-stars i{font-style:normal;font-size:38px;color:#e7dcc4;-webkit-text-stroke:2px #4a3528}.cu-stars i.on{color:#ffd95a;animation:cuPop2 .4s ease-out backwards}.cu-stars i.on:nth-child(2){animation-delay:.15s}.cu-stars i.on:nth-child(3){animation-delay:.3s}
@keyframes cuPop2{from{transform:scale(0) rotate(-30deg)}to{transform:scale(1)}}
.cu-sum{margin:2px 0 8px;font:700 13px var(--body,system-ui);color:#4a3528}
.cu-loot{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.cu-li{display:flex;align-items:center;gap:5px;padding:4px 9px 4px 4px;border-radius:14px;background:#fff;border:2px solid var(--rc)}
.cu-li img{width:34px;height:34px}.cu-li b{font:700 12.5px var(--body,system-ui);color:#4a3528}.cu-li em{font:800 12px var(--display,system-ui);font-style:normal;color:#a5784f}
.cu-none{font:600 13px var(--body,system-ui);color:#8a6a4a}
body.cu-on{overflow:hidden}
.act-cu .acic img{width:100%;height:100%;object-fit:contain}
`;
  document.head.appendChild(st);
}

// ---------- v79b : au retour, les objets identiques sont regroupés avec leur nombre (×3) ----------
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  const stack = () => cu$(() => {
    const box = document.querySelector('#modal .haul'); if (!box) return;
    const byId = {}; (h.items || []).forEach(it => { if (it) byId[it.id] = it; });
    const seen = {};
    box.querySelectorAll('.hcard').forEach(c => {
      if (c.dataset.cust) return;
      const it = byId[c.dataset.fiche]; const key = it ? [it.name, it.rarity, it.edition || '', it.special ? 1 : 0].join('|') : (c.querySelector('b') || {}).textContent;
      if (!key) return;
      if (seen[key]) { seen[key].n++; c.remove(); const x = seen[key].c.querySelector('.cu-hx'); x.textContent = '×' + seen[key].n; x.hidden = false; return; }
      seen[key] = { c, n: 1 }; c.dataset.cust = '1';
      c.insertAdjacentHTML('beforeend', '<span class="cu-hx" hidden></span>');
    });
  });
  setTimeout(stack, 40); setTimeout(stack, 160);
  return r;
})(showHaul);
{ const st = document.createElement('style'); st.textContent = `.haul .hcard .cu-hx{position:absolute;right:5px;bottom:5px;min-width:24px;padding:1px 6px;border-radius:999px;background:#4a3528;color:#fffaf0;font:800 12.5px var(--display,system-ui);text-align:center;z-index:3}`; document.head.appendChild(st); }

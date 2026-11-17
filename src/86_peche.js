// ================= 86 · MOMENT FORT : LA PÊCHE (v82) =================
// 2e mini-jeu (17/11) : rivières, lacs, étangs, ports et plages. Un seul moment fort par voyage : près de l'eau,
// la pêche arrive à peu près une fois sur deux (sinon une situation d'aventure, 85).
// Jeu : LIRE les remous (petits cercles rapides = petit poisson ; grands cercles lents avec une ombre = gros ; reflets dorés = rare ;
// une feuille qui flotte = rien du tout), LANCER au bon endroit (toucher l'eau), FERRER quand le bouchon plonge (ni trop tôt, ni trop tard),
// puis pour les gros : MAINTENIR pour remonter, RELÂCHER quand la ligne est trop tendue. 60 secondes, le soleil sert de minuteur.
// Les poissons sont des « produits de la mer » : ingrédients des appâts (phoque, axolotl) et de la cuisine.
const pe$ = (f, d) => { try { return f(); } catch (e) { return d; } };
const PE_WATER = { lac: 'douce', riviere: 'douce', etang: 'douce', port: 'mer', plage: 'mer', phare: 'mer', mer: 'mer', ile: 'mer', poissonnerie: 'mer' };
function peWaterOf(d) { if (!d) return null; for (const t of [d.cat, ...(d.tags || [])]) if (t && PE_WATER[t]) return PE_WATER[t]; return null; }
const PE_FISH = {
  douce: { nm: 'la rivière', sky: ['#bfe1f2', '#fff3d8'], shore: '#8fbf74', water: ['#6fb3c9', '#2f6f86'],
    small: { nm: 'Gardon', it: ['Gardon', 'n', 'mer', 0, null, '#b9c4cf'], col: '#b9c4cf' },
    big: { nm: 'Truite', it: ['Truite de rivière', 'n', 'mer', 1, null, '#c98f7a'], col: '#c9a07a' },
    rare: { nm: 'Brochet doré', it: ['Brochet doré', 'n', 'mer', 3, null, '#e2b84a'], col: '#e8c04f' } },
  mer: { nm: 'la mer', sky: ['#bfe6f7', '#fff6df'], shore: '#e9d6a6', water: ['#5fb6d6', '#1f5f8a'],
    small: { nm: 'Sardine', it: ['Sardine', 'n', 'mer', 0, null, '#9fb6c9'], col: '#9fb6c9' },
    big: { nm: 'Bar', it: ['Bar de ligne', 'n', 'mer', 1, null, '#8f9fb0'], col: '#8fa3b5' },
    rare: { nm: 'Daurade royale', it: ['Daurade royale', 'n', 'mer', 3, null, '#f2c94e'], col: '#f2c94e' } },
};
const PE_TIME = 60;

// ---------- accroché au voyage ----------
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  pe$(() => {
    const t = S.trips[k]; if (!t || t === before) return;
    const w = peWaterOf(t.dest); if (!w || Math.random() >= 0.5) return;
    t.mf = { k: 'peche', w, at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
const peName = k => pe$(() => CHARS[k].name, 'Votre compagnon');
function peGive(t, res) {
  const F = PE_FISH[t.mf.w], from = (t.dest && t.dest.name) || '', tags = (t.dest && t.dest.tags) || [], out = [];
  const add = (def, n) => { for (let i = 0; i < n; i++) { const it = pe$(() => makeItem(def, 0, from, tags, { fixed: def[3] }), null); if (it) { t.bag.push(it); out.push(it); } } };
  add(F.small.it, res.small); add(F.big.it, res.big); add(F.rare.it, res.rare);
  return out;
}
function peAuto(t) { if (!t.mf || t.mf.k !== 'peche' || (t.mf.st !== 'wait' && t.mf.st !== 'ready')) return; t.mf.st = 'auto'; t.mf.res = { small: 1, big: 0, rare: 0, auto: 1 }; peGive(t, t.mf.res); pe$(save); }
function peTick() {
  if (!S || !S.trips) return;
  let ch = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || !t.mf || t.mf.k !== 'peche') continue;
    if (t.done) { if (t.mf.st === 'wait' || t.mf.st === 'ready') { peAuto(t); ch = true; } continue; }
    if (t.mf.st === 'wait' && t.elapsed >= t.total * t.mf.at) { t.mf.st = 'ready'; ch = true; pe$(() => toast(`🎣 ${peName(k)} est au bord de ${PE_FISH[t.mf.w].nm} : à vous de pêcher !`)); }
  }
  if (ch) { pe$(save); pe$(() => renderTripCard()); }
}
setInterval(() => { if (!document.hidden) pe$(peTick); }, 2000);
if (typeof collect === 'function') collect = (orig => function () { pe$(() => Object.values(S.trips).forEach(t => { if (t && t.done && t.mf) peAuto(t); })); return orig.apply(this, arguments); })(collect);
function peReady() { for (const [k, t] of Object.entries(S.trips || {})) if (t && !t.done && t.mf && t.mf.k === 'peche' && t.mf.st === 'ready') return { k, t }; return null; }
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && (a.kind === 'collect' || a.kind === 'cumf' || a.kind === 'chmf')) return a;
  if (document.body.classList.contains('firstrun')) return a;
  const R = pe$(peReady, null);
  return R ? { kind: 'pemf', k: R.k, t: R.t } : a;
})(nextAction);
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = pe$(() => nextAction(), null);
  if (!a || a.kind !== 'pemf') return orig.apply(this, arguments);
  box.hidden = false; box.className = 'tripcard act act-cu'; box.dataset.kind = 'pemf'; box.dataset.k = a.k; box.dataset.sig = pe$(() => actionSig(a), '');
  box.innerHTML = `<span class="acic"><img src="${pe$(() => portraitURI(a.k, 'rire'), '')}" alt=""></span><div class="tcx"><span class="ack">Moment fort · ${esc(a.t.dest.name || '')}</span><b class="act-t">🎣 La pêche, au bord de ${esc(PE_FISH[a.t.mf.w].nm)}</b><span class="acs">À jouer avant son retour, sinon ${esc(peName(a.k))} pêche seul.</span></div><button class="btn green" data-peplay="${a.k}">Jouer</button>`;
})(renderActionCard);
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-peplay]'); if (!b) return; ev.stopPropagation(); ev.preventDefault(); peOpen(b.dataset.peplay); }, true);

// ================= LE MINI-JEU =================
let PE = null;
const peR = (a, b) => a + Math.random() * (b - a);
const PE_INK = '#4a3528';
function peFishShape(c, x, y, L, col, ang = 0, flip = 1) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(flip, 1);
  c.beginPath(); c.moveTo(-L * 0.5, 0); c.lineTo(-L * 0.78, -L * 0.2); c.lineTo(-L * 0.74, 0); c.lineTo(-L * 0.78, L * 0.2); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = PE_INK; c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.ellipse(0, 0, L * 0.5, L * 0.22, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-L * 0.05, -L * 0.2); c.quadraticCurveTo(L * 0.05, -L * 0.36, L * 0.15, -L * 0.18); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(-L * 0.05, L * 0.05, L * 0.32, L * 0.08, 0, 0, 7); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
  c.beginPath(); c.arc(L * 0.3, -L * 0.04, L * 0.05, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.beginPath(); c.arc(L * 0.31, -L * 0.04, L * 0.022, 0, 7); c.fillStyle = PE_INK; c.fill();
  c.restore();
}
function peBg(W, H, w) {
  const F = PE_FISH[w], cv = document.createElement('canvas'), dpr = PE.dpr; cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const hz = H * 0.36;
  let g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, F.sky[0]); g.addColorStop(1, F.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, hz + 2);
  // rive lointaine
  c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += 8) c.lineTo(x, hz - 12 - Math.sin(x / W * 4 + 0.5) * 10 - Math.sin(x / W * 11) * 4); c.lineTo(W, hz + 4); c.lineTo(0, hz + 4); c.fillStyle = F.shore; c.fill();
  if (w === 'mer') {
    for (let i = 0; i < 5; i++) { const x = W * (0.12 + i * 0.19), h = 12 + (i % 2) * 8; c.fillStyle = ['#fff8f0', '#f6d8b8', '#cfe3ef'][i % 3]; c.fillRect(x, hz - h - 10, 14, h); c.beginPath(); c.moveTo(x - 2, hz - h - 10); c.lineTo(x + 7, hz - h - 18); c.lineTo(x + 16, hz - h - 10); c.fillStyle = '#d9604f'; c.fill(); }
    c.fillStyle = '#fff8f0'; c.fillRect(W * 0.86, hz - 46, 9, 38); c.fillStyle = '#d9604f'; c.fillRect(W * 0.86, hz - 34, 9, 6); c.fillRect(W * 0.86, hz - 20, 9, 6);
  } else {
    for (let i = 0; i < 9; i++) { const x = (i + 0.3) / 9 * W, r = 11 + (i % 3) * 4; c.beginPath(); c.arc(x, hz - 14 - (i % 2) * 6, r, 0, 7); c.fillStyle = i % 2 ? '#6aa052' : '#5a9046'; c.fill(); }
  }
  // l'eau
  g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, F.water[0]); g.addColorStop(1, F.water[1]); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
  // premier plan : roseaux (rivière) ou ponton (mer)
  if (w === 'mer') {
    c.fillStyle = '#b5844f'; c.strokeStyle = PE_INK; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const y = H - 34 - i * 0; c.fillRect(-10, H - 40 + i * 0, W * 0.48, 40); }
    c.strokeRect(-10, H - 40, W * 0.48, 44); for (let x = 10; x < W * 0.48; x += 30) { c.beginPath(); c.moveTo(x, H - 40); c.lineTo(x, H); c.stroke(); }
    c.fillStyle = '#8a5a3a'; c.fillRect(W * 0.46, H - 80, 12, 80); c.strokeRect(W * 0.46, H - 80, 12, 80);
  } else {
    for (const side of [0, 1]) for (let i = 0; i < 9; i++) {
      const x = side ? W - 8 - i * 7 : 8 + i * 7, h = 80 + (i * 37 % 60), y = H;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (side ? -6 : 6), y - h * 0.6, x + (side ? -10 : 10), y - h); c.strokeStyle = '#5f8f4a'; c.lineWidth = 3; c.stroke();
      if (i % 3 === 0) { c.beginPath(); c.ellipse(x + (side ? -10 : 10), y - h + 8, 3.5, 10, 0, 0, 7); c.fillStyle = '#8a5a3a'; c.fill(); }
    }
  }
  return cv;
}
function peOpen(k) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.k !== 'peche' || t.mf.st !== 'ready' || t.done) { pe$(() => toast('Ce moment est passé.')); return; }
  if (PE) return;
  const F = PE_FISH[t.mf.w];
  const el = document.createElement('div'); el.id = 'peG'; el.className = 'cu-ov pe-ov';
  el.innerHTML = `<canvas class="cu-cv"></canvas>
    <div class="cu-top"><div class="cu-herb pe-score"><span class="pe-sc">🐟 <b class="pe-n">0</b></span><span class="pe-pts">0 pt</span></div><div class="pe-hint"></div></div>
    <div class="pe-fight" hidden><div class="pe-tn"><i></i></div><div class="pe-pr"><i></i></div><p>Maintenez pour remonter · relâchez si ça tire trop !</p></div>
    <div class="cu-me pe-me"><img alt="" src="${pe$(() => portraitURI(k), '')}"><span class="cu-bask"><b>0</b></span></div>
    <div class="cu-card cu-intro"><p class="cu-k">Moment fort · ${esc(t.dest.name || '')}</p><h3>La pêche, au bord de ${esc(F.nm)}</h3>
      <ol class="pe-how"><li><b>Lisez l’eau.</b> Petits cercles rapides : petit poisson. Grands cercles lents avec une ombre : gros poisson. Reflets dorés : rare ! Une feuille qui flotte : rien.</li>
      <li><b>Touchez l’eau</b> au milieu des cercles pour lancer.</li><li><b>Ferrez</b> (touchez) dès que le bouchon plonge. Trop tôt, le poisson fuit.</li>
      <li>Pour un gros : <b>maintenez</b> pour remonter, <b>relâchez</b> si la ligne devient rouge.</li></ol>
      <div class="pe-fishes"><span>${esc(F.small.nm)} · 1 pt</span><span>${esc(F.big.nm)} · 3 pts</span><span class="r">✨ ${esc(F.rare.nm)} · 6 pts</span></div>
      <button class="btn green big wide" data-pego="1">Pêcher !</button><button class="cu-later" data-pequit="1">Plus tard</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
  PE = { k, t, F, el, cv: el.querySelector('.cu-cv'), dpr: Math.min(2, window.devicePixelRatio || 1), st: 'intro', time: 0, spots: [], fx: [], drops: [], cast: null, small: 0, big: 0, rare: 0, miss: 0, rareLeft: 1, nextSpot: 0.2, nextRare: peR(15, 40), hold: false };
  peSize(); window.addEventListener('resize', peSize);
  PE.cv.addEventListener('pointerdown', peDown); window.addEventListener('pointerup', peUp); window.addEventListener('pointercancel', peUp);
  PE.last = performance.now(); requestAnimationFrame(peLoop);
}
function peSize() { if (!PE) return; const W = innerWidth, H = innerHeight; PE.W = W; PE.H = H; PE.cv.width = W * PE.dpr; PE.cv.height = H * PE.dpr; PE.cv.style.width = W + 'px'; PE.cv.style.height = H + 'px'; PE.bg = peBg(W, H, PE.t.mf.w); PE.rod = { x: 96, y: H - 150 }; }
function peClose() { if (!PE) return; window.removeEventListener('resize', peSize); window.removeEventListener('pointerup', peUp); window.removeEventListener('pointercancel', peUp); PE.el.remove(); PE = null; document.body.classList.remove('cu-on'); pe$(() => renderTripCard()); }
document.addEventListener('click', ev => {
  if (!PE) return;
  const b = ev.target.closest && ev.target.closest('[data-pego],[data-pequit],[data-pedone]'); if (!b) return;
  ev.stopPropagation();
  if (b.dataset.pego) { PE.el.querySelector('.cu-intro').remove(); PE.st = 'play'; PE.time = 0; peHint('Touchez l’eau au milieu des cercles'); return; }
  peClose();
}, true);
function peHint(t) { const h = PE && PE.el.querySelector('.pe-hint'); if (h) { h.textContent = t; h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); } }
function peMood(m) { const img = PE && PE.el.querySelector('.pe-me img'); if (!img) return; img.src = pe$(() => portraitURI(PE.k, m), img.src); const me = PE.el.querySelector('.pe-me'); me.classList.remove('hop', 'oops'); void me.offsetWidth; me.classList.add(m === 'surpris' || m === 'triste' ? 'oops' : 'hop'); clearTimeout(PE.mt); PE.mt = setTimeout(() => { if (PE) img.src = pe$(() => portraitURI(PE.k), img.src); }, 1100); }
function peText(x, y, txt, col) { PE.fx.push({ x: Math.max(110, Math.min(PE.W - 110, x)), y, txt, col, a: 0 }); }
function peSplash(x, y, n = 10) { for (let i = 0; i < n; i++) { const a = -Math.PI * Math.random(), v = peR(40, 130); PE.drops.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: 0 }); } }
function peSpawn(kind) {
  const W = PE.W, H = PE.H, hz = H * 0.36;
  for (let i = 0; i < 12; i++) {
    const y = hz + 50 + Math.random() * (H - hz - 230), x = 50 + Math.random() * (W - 100);
    if (PE.spots.some(s => Math.abs(s.x - x) < 90 && Math.abs(s.y - y) < 60)) continue;
    const d = (y - hz) / (H - hz), sc = 0.6 + d * 0.7;
    PE.spots.push({ kind, x, y, sc, age: 0, life: kind === 'rare' ? 3.2 : kind === 'leaf' ? 4.5 : kind === 'big' ? 4.2 : 3.4, p: Math.random() * 6 });
    return;
  }
}
function peDown(ev) {
  if (!PE || PE.st !== 'play') return;
  const r = PE.cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, c = PE.cast;
  if (c && c.ph === 'fight') { PE.hold = true; return; }
  if (c && (c.ph === 'wait' || c.ph === 'bite')) {
    if (c.ph === 'bite') {
      if (c.kind === 'small') { peCatch('small'); }
      else { c.ph = 'fight'; c.tn = 0.35; c.pr = 0.1; c.ft = 0; c.pull = 0; PE.hold = true; PE.el.querySelector('.pe-fight').hidden = false; peHint(c.kind === 'rare' ? 'Un poisson rare ! Doucement…' : 'Un gros ! Maintenez, relâchez si ça tire'); }
    } else { if (c.spot) { peText(c.x, c.y - 30, 'Trop tôt !', '#d9604f'); c.spot.gone = 1; } PE.miss++; PE.cast = null; peMood('surpris'); }
    return;
  }
  if (c) return;
  if (y < PE.H * 0.36 + 10) return;
  const spot = PE.spots.filter(s => !s.gone).map(s => ({ s, d: Math.hypot((s.x - x) / s.sc, (s.y - y) / s.sc / 0.55) })).filter(o => o.d < 70).sort((a, b) => a.d - b.d)[0];
  PE.cast = { ph: 'fly', t: 0, x, y, spot: spot ? spot.s : null, kind: spot ? spot.s.kind : null };
  if (spot) spot.s.taken = 1;
}
function peUp() { if (PE) PE.hold = false; }
function peCatch(kind) {
  const c = PE.cast; PE[kind]++;
  PE.el.querySelector('.pe-fight').hidden = true;
  const F = PE.F, f = kind === 'small' ? F.small : kind === 'big' ? F.big : F.rare;
  PE.fx.push({ fish: 1, x: c.x, y: c.y, col: f.col, L: kind === 'small' ? 34 : kind === 'big' ? 54 : 58, a: 0, rare: kind === 'rare' });
  peSplash(c.x, c.y, 14);
  peText(c.x, c.y - 50, kind === 'rare' ? `✨ ${f.nm} !` : `+ ${f.nm}`, kind === 'rare' ? '#c98a12' : '#2f6f86');
  if (c.spot) c.spot.gone = 1;
  PE.cast = null; peMood(kind === 'small' ? 'content' : 'rire');
  pe$(() => sfx('pop')); pe$(() => navigator.vibrate && navigator.vibrate(kind === 'small' ? 30 : 80));
  const pts = PE.small + PE.big * 3 + PE.rare * 6;
  PE.el.querySelector('.pe-n').textContent = PE.small + PE.big + PE.rare; PE.el.querySelector('.pe-pts').textContent = `${pts} pt${pts > 1 ? 's' : ''}`;
  PE.el.querySelector('.pe-me .cu-bask b').textContent = PE.small + PE.big + PE.rare;
}
function peLose(why) { const c = PE.cast; PE.el.querySelector('.pe-fight').hidden = true; peText(c.x, c.y - 40, why, '#d9604f'); peSplash(c.x, c.y, 6); if (c.spot) c.spot.gone = 1; PE.cast = null; PE.miss++; peMood('triste'); }
function peLoop(now) {
  if (!PE) return;
  const dt = Math.min(0.05, (now - PE.last) / 1000); PE.last = now;
  if (PE.st === 'play') {
    PE.time += dt;
    PE.nextSpot -= dt;
    const live = PE.spots.filter(s => !s.gone && !s.taken && s.kind !== 'leaf').length;
    if (PE.nextSpot <= 0 && live < 3) { const r = Math.random(); peSpawn(r < 0.24 ? 'leaf' : r < 0.7 ? 'small' : 'big'); PE.nextSpot = peR(0.8, 1.5); }
    if (PE.rareLeft && PE.time >= PE.nextRare) { PE.rareLeft--; peSpawn('rare'); }
    const c = PE.cast;
    if (c) {
      c.t += dt;
      if (c.ph === 'fly' && c.t >= 0.45) {
        c.ph = 'wait'; c.t = 0; peSplash(c.x, c.y, 5);
        if (!c.spot) { c.wait = 2.2; c.empty = 1; } else if (c.kind === 'leaf') { c.wait = 0.9; c.empty = 1; c.leaf = 1; } else c.wait = peR(0.7, 1.9);
      } else if (c.ph === 'wait' && c.t >= c.wait) {
        if (c.empty) { peText(c.x, c.y - 30, c.leaf ? 'Ce n’était qu’une feuille…' : 'Rien ne mord ici', '#6a5040'); if (c.spot) c.spot.gone = 1; PE.cast = null; }
        else { c.ph = 'bite'; c.t = 0; c.win = c.kind === 'small' ? 0.85 : c.kind === 'big' ? 0.65 : 0.55; peSplash(c.x, c.y, 8); pe$(() => navigator.vibrate && navigator.vibrate(25)); }
      } else if (c.ph === 'bite' && c.t >= c.win) { peLose('Trop tard, il a filé !'); }
      else if (c.ph === 'fight') {
        c.ft += dt; c.pull -= dt;
        if (c.pull <= 0) { c.pull = peR(0.5, 1.2); c.spike = c.kind === 'rare' ? 0.5 : 0.35; }
        if (c.spike > 0) { c.tn += dt * 1.1; c.spike -= dt; }
        if (PE.hold) { c.tn += dt * (c.kind === 'rare' ? 0.55 : 0.45); c.pr += dt * (c.kind === 'rare' ? 0.2 : 0.26) * (c.tn < 0.8 ? 1 : 0.3); }
        else { c.tn -= dt * 0.75; c.pr -= dt * 0.05; }
        c.tn = Math.max(0, c.tn); c.pr = Math.max(0, c.pr);
        const fe = PE.el.querySelector('.pe-fight'); fe.querySelector('.pe-tn i').style.width = Math.min(100, c.tn * 100) + '%'; fe.querySelector('.pe-tn').className = 'pe-tn' + (c.tn > 0.8 ? ' red' : c.tn > 0.6 ? ' warn' : ''); fe.querySelector('.pe-pr i').style.width = Math.min(100, c.pr * 100) + '%';
        if (c.tn >= 1) peLose('Crac ! La ligne a cassé');
        else if (c.pr >= 1) peCatch(c.kind);
        else if (c.ft > 9) peLose('Il s’est décroché…');
      }
    }
    if (PE.time >= PE_TIME && !(PE.cast && PE.cast.ph === 'fight')) peEnd();
  }
  for (const s of PE.spots) s.age += dt;
  PE.spots = PE.spots.filter(s => !s.gone && (s.taken || s.age < s.life));
  for (const f of PE.fx) f.a += dt;
  PE.fx = PE.fx.filter(f => f.a < (f.fish ? 1.1 : 1.2));
  for (const d of PE.drops) { d.a += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 300 * dt; }
  PE.drops = PE.drops.filter(d => d.a < 0.6);
  peDraw(); requestAnimationFrame(peLoop);
}
function peDraw() {
  const c = PE.cv.getContext('2d'), W = PE.W, H = PE.H, T = PE.last / 1000, hz = H * 0.36;
  c.setTransform(PE.dpr, 0, 0, PE.dpr, 0, 0);
  c.drawImage(PE.bg, 0, 0, W, H);
  // soleil-minuteur
  const k = PE.st === 'play' ? Math.min(1, PE.time / PE_TIME) : PE.st === 'end' ? 1 : 0, sx = W * (0.08 + 0.84 * k), sy = hz * (0.5 - Math.sin(k * Math.PI) * 0.3);
  c.beginPath(); c.arc(sx, sy, 16, 0, 7); c.fillStyle = k > 0.8 ? '#ffb46a' : '#ffd95a'; c.fill(); c.strokeStyle = PE_INK; c.lineWidth = 2; c.stroke();
  // reflet du soleil et vaguelettes
  c.save(); c.globalAlpha = 0.35; c.fillStyle = '#fff6c9';
  for (let i = 0; i < 7; i++) { const y = hz + 8 + i * 9, w = 40 - i * 4 + Math.sin(T * 2 + i) * 6; c.fillRect(sx - w / 2, y, w, 2.5); }
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.4;
  for (let i = 0; i < 26; i++) { const y = hz + 20 + (i * 53 % (H - hz - 40)), x = (i * 97 + T * 18 * (i % 2 ? 1 : -1)) % (W + 60) - 30, w = 16 + (i % 4) * 8; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3, x + w, y); c.stroke(); }
  // remous
  for (const s of PE.spots) {
    const fade = Math.min(1, s.age / 0.4) * (s.taken ? 1 : Math.max(0, Math.min(1, (s.life - s.age) / 0.6)));
    c.save(); c.globalAlpha = fade; c.translate(s.x, s.y); c.scale(s.sc, s.sc * 0.42);
    if (s.kind === 'leaf') {
      c.restore(); c.save(); c.globalAlpha = fade; c.translate(s.x + Math.sin(T + s.p) * 6, s.y); c.rotate(Math.sin(T * 0.8 + s.p) * 0.4); c.scale(s.sc, s.sc);
      c.beginPath(); c.ellipse(0, 0, 16, 9, 0, 0, 7); c.fillStyle = '#c9a03a'; c.fill(); c.strokeStyle = PE_INK; c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.stroke();
      c.restore(); c.save(); c.globalAlpha = fade * 0.6; c.translate(s.x, s.y + 4); c.scale(s.sc, s.sc * 0.42); c.beginPath(); c.arc(0, 0, 24 + (T * 10 % 8), 0, 7); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.restore(); continue;
    }
    const sp = s.kind === 'small' ? 2.6 : s.kind === 'big' ? 1.2 : 1.6, max = s.kind === 'small' ? 38 : 62;
    if (s.kind !== 'small') { c.beginPath(); c.ellipse(Math.sin(T * 1.3 + s.p) * 10, 0, s.kind === 'rare' ? 34 : 38, 14, 0, 0, 7); c.fillStyle = s.kind === 'rare' ? 'rgba(242,201,78,.5)' : 'rgba(20,40,60,.35)'; c.fill(); }
    for (let i = 0; i < 3; i++) { const ph = ((T * sp + i / 3 + s.p) % 1), r = 8 + ph * max; c.beginPath(); c.arc(0, 0, r, 0, 7); c.strokeStyle = s.kind === 'rare' ? `rgba(255,224,120,${1 - ph})` : `rgba(255,255,255,${0.9 * (1 - ph)})`; c.lineWidth = s.kind === 'big' ? 3.4 : 2.4; c.stroke(); }
    c.restore();
    if (s.kind === 'rare') { c.fillStyle = '#fff6c9'; for (let i = 0; i < 3; i++) { const a = T * 4 + i * 2.1; c.save(); c.translate(s.x + Math.cos(a) * 26 * s.sc, s.y - 8 + Math.sin(a) * 10); c.rotate(a); c.fillRect(-1, -5, 2, 10); c.fillRect(-5, -1, 10, 2); c.restore(); } }
  }
  // canne, fil et bouchon
  const R = PE.rod, tip = { x: R.x + 120, y: R.y - 150 }, cc = PE.cast;
  c.beginPath(); c.moveTo(R.x, R.y); c.quadraticCurveTo(R.x + 60, R.y - 90 + (cc && cc.ph === 'fight' ? 26 : 0), tip.x, tip.y + (cc && cc.ph === 'fight' ? 30 : 0)); c.strokeStyle = PE_INK; c.lineWidth = 6; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#b5844f'; c.lineWidth = 3.4; c.stroke();
  if (cc) {
    let bx = cc.x, by = cc.y;
    if (cc.ph === 'fly') { const e = Math.min(1, cc.t / 0.45); bx = tip.x + (cc.x - tip.x) * e; by = tip.y + (cc.y - tip.y) * e - Math.sin(e * Math.PI) * 120; }
    let dip = Math.sin(T * 4) * 2;
    if (cc.ph === 'bite') dip = 9 + Math.sin(T * 30) * 3;
    if (cc.ph === 'fight') { bx += Math.sin(T * 9) * 10; dip = 12; }
    c.beginPath(); c.moveTo(tip.x, tip.y + (cc.ph === 'fight' ? 30 : 0)); c.quadraticCurveTo((tip.x + bx) / 2, Math.max(tip.y, by) + (cc.ph === 'fight' ? -10 : 30), bx, by + dip); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.3; c.stroke();
    if (cc.ph !== 'fight') {
      c.beginPath(); c.arc(bx, by + dip, 7, 0, 7); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = PE_INK; c.lineWidth = 1.6; c.stroke();
      c.beginPath(); c.arc(bx, by + dip, 7, Math.PI, 2 * Math.PI); c.fillStyle = '#e0533d'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(bx, by + dip - 7); c.lineTo(bx, by + dip - 16); c.stroke();
    }
    if (cc.ph === 'bite') { c.font = '900 30px Fredoka, system-ui'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = '#fffaf0'; c.strokeText('!', bx, by - 26); c.fillStyle = '#e0533d'; c.fillText('!', bx, by - 26); }
  }
  // gouttes et poissons qui sautent
  c.fillStyle = 'rgba(235,250,255,.95)'; for (const d of PE.drops) { c.beginPath(); c.arc(d.x, d.y, 2.4, 0, 7); c.fill(); }
  for (const f of PE.fx) {
    if (f.fish) { const e = Math.min(1, f.a / 1.0); const x = f.x + (90 - f.x) * e, y = f.y + (PE.H - 70 - f.y) * e - Math.sin(e * Math.PI) * 140; c.save(); c.globalAlpha = 1 - Math.max(0, e - 0.85) / 0.15; if (f.rare) { const g = c.createRadialGradient(x, y, 2, x, y, f.L); g.addColorStop(0, 'rgba(255,226,120,.8)'); g.addColorStop(1, 'rgba(255,226,120,0)'); c.fillStyle = g; c.fillRect(x - f.L, y - f.L, f.L * 2, f.L * 2); } peFishShape(c, x, y, f.L * (1 - e * 0.4), f.col, -0.6 + e * 1.4, -1); c.restore(); continue; }
    c.globalAlpha = Math.min(1, 2.2 - f.a * 1.8); c.font = '800 17px Fredoka, system-ui'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fffaf0'; c.strokeText(f.txt, f.x, f.y - f.a * 26); c.fillStyle = f.col; c.fillText(f.txt, f.x, f.y - f.a * 26); c.globalAlpha = 1;
  }
  const vg = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,40,60,.25)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
function peEnd() {
  if (!PE || PE.st !== 'play') return;
  PE.st = 'end'; PE.el.querySelector('.pe-fight').hidden = true;
  const pts = PE.small + PE.big * 3 + PE.rare * 6, stars = pts >= 14 ? 3 : pts >= 8 ? 2 : pts >= 3 ? 1 : 0;
  const res = { stars, small: Math.min(5, PE.small), big: Math.min(4, PE.big + (stars === 3 ? 1 : 0)), rare: Math.min(1, PE.rare) };
  const t = PE.t; t.mf.st = 'done'; t.mf.res = res;
  const got = peGive(t, res); pe$(save);
  pe$(() => t.journal.push({ t: Date.now(), kind: 'peche', text: `${peName(PE.k)} a pêché ${got.length} poisson${got.length > 1 ? 's' : ''} au bord de ${PE.F.nm}.` }));
  const groups = {}; got.forEach(it => { (groups[it.name] = groups[it.name] || { it, n: 0 }).n++; });
  const ico = it => { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; const c = cv.getContext('2d'); const f = it.name === PE.F.rare.it[0] ? PE.F.rare : it.name === PE.F.big.it[0] ? PE.F.big : PE.F.small; peFishShape(c, 48, 50, 78, f.col, -0.15); return cv.toDataURL(); };
  const card = document.createElement('div'); card.className = 'cu-card cu-end';
  card.innerHTML = `<p class="cu-k">${['Ça ne mordait pas', 'Petite pêche', 'Belle pêche', 'Pêche miraculeuse'][stars]}</p><div class="cu-stars">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</div>
    <p class="cu-sum">${pts} point${pts > 1 ? 's' : ''} · ${PE.small + PE.big + PE.rare} poisson${PE.small + PE.big + PE.rare > 1 ? 's' : ''}${PE.miss ? ` · ${PE.miss} raté${PE.miss > 1 ? 's' : ''}` : ''}</p>
    <div class="cu-loot">${Object.values(groups).map(({ it, n }) => `<span class="cu-li" style="--rc:${pe$(() => RARC[it.rarity], '#ccc')}"><img src="${ico(it)}" alt=""><b>${esc(it.name)}</b>${n > 1 ? `<em>×${n}</em>` : ''}</span>`).join('') || '<span class="cu-none">Rien cette fois…</span>'}</div>
    <p class="cu-tip">${got.length ? `${esc(peName(PE.k))} les rapporte à son retour. Ils servent aux appâts (phoques, axolotls) et en cuisine.` : 'Visez le centre des cercles, et ferrez dès que le bouchon plonge.'}</p>
    <button class="btn green big wide" data-pedone="1">Super !</button>`;
  PE.el.appendChild(card); peMood(stars >= 2 ? 'rire' : 'triste');
}
window.__pe = { force: (k, w) => { const t = S.trips[k]; if (t) t.mf = { k: 'peche', w: w || 'douce', at: 0, st: 'ready' }; }, st: () => PE && { st: PE.st, spots: PE.spots.map(s => [s.kind, Math.round(s.x), Math.round(s.y)]), cast: PE.cast && PE.cast.ph, small: PE.small, big: PE.big }, end: () => { if (PE) PE.time = PE_TIME; } };

{
  const st = document.createElement('style');
  st.textContent = `
.pe-score{gap:10px;padding:7px 12px}.pe-sc b{display:inline!important;font:inherit!important;color:inherit!important}.pe-sc{font:800 18px var(--display,system-ui);color:#2f6f86}.pe-pts{font:800 14px var(--display,system-ui);color:#a5784f}
.pe-hint{max-width:56%;padding:6px 10px;border-radius:14px;background:rgba(255,250,240,.92);border:2px solid #4a3528;font:700 12.5px var(--body,system-ui);color:#4a3528;opacity:0;transition:opacity .3s}.pe-hint.on{opacity:1}
.pe-fight{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);transform:translateX(-50%);width:min(80vw,300px);padding:10px 12px;border-radius:18px;background:rgba(255,250,240,.95);border:2.5px solid #4a3528;text-align:center;pointer-events:none}
.pe-fight p{margin:6px 0 0;font:700 12px var(--body,system-ui);color:#4a3528}
.pe-tn,.pe-pr{height:12px;border-radius:999px;background:#e7dcc4;border:2px solid #4a3528;overflow:hidden;margin:4px 0}.pe-tn i,.pe-pr i{display:block;height:100%;width:0}
.pe-tn i{background:#7fc462;transition:background .2s}.pe-tn.warn i{background:#f2c14e}.pe-tn.red i{background:#e0533d}.pe-pr i{background:#5aa6d6}
.pe-how{margin:0 0 10px;padding-left:20px;text-align:left;font:600 12.5px/1.4 var(--body,system-ui);color:#4a3528}.pe-how li{margin:3px 0}
.pe-fishes{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin-bottom:10px}.pe-fishes span{padding:3px 9px;border-radius:999px;background:#e6f3f8;font:700 12px var(--body,system-ui);color:#2f6f86}.pe-fishes span.r{background:#fff1c4;color:#8a6110}
`;
  document.head.appendChild(st);
}

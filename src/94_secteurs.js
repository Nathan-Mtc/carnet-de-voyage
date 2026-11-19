// ================= 94 · LES SECTEURS : CONNAÎTRE UNE RÉGION (v90) =================
// Le joueur (18/11) : « 100 km, je ne veux pas lancer le jeu le matin et revenir 2 h après » ; « on pourrait gagner de l'expérience
// de région et voyager de plus en plus vite ? » ; « si je fais 20 allers-retours au tacos, on glitche le jeu » ;
// « on découpe les régions en brume » ; « il faut que le joueur comprenne bien à quoi ça sert de découvrir des régions ».
// Décisions :
//  - Chaque région est découpée en SECTEURS hexagonaux (≈ 50 km de large en France, plus grands pour les régions lointaines,
//    ~20 à 25 par grande région). Un secteur pas encore visité est dans la brume (hexagone blanc sur la carte).
//  - Visiter un lieu dans un secteur dans la brume le découvre. Deux lieux du même secteur comptent pour un : pas de triche.
//  - 5 niveaux de connaissance par région (seuils selon le nombre de secteurs, ex. 1/3/7/12/18 sur 25) :
//    Visiteur, Habitué (−15 % de trajet, les voisines s'ouvrent), Connaisseur (−30 %), Comme chez soi (−45 %), Enfant du pays (−60 %).
//  - Remplace la règle « 3 voyages dans la région » (81) : une région est explorée quand on y est Habitué.
//  - On le voit partout : fiche de départ (« secteur inconnu », « trajet −30 % »), étiquettes des régions en vue Monde, fiche de région.
const sct$ = (f, d) => { try { return f(); } catch (e) { return d; } };
function sctSt() {
  if (!S.sct || typeof S.sct !== 'object') S.sct = {};
  const s = S.sct;
  ['d', 'camp', 'clue', 'learn'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  return s;
}
sct$(sctSt);

// ---------- la grille d'une région ----------
const SCT_GRID = {};
function sctFlood(id, step, cap) {
  const R = RG[id], out = [], seen = new Set(), q = [];
  const push = (ix, iy) => { const k = ix + '_' + iy; if (seen.has(k)) return; seen.add(k); q.push([ix, iy]); };
  const seeds = [[R.anchor[0], R.anchor[1]]];
  sct$(() => PLACES.forEach(p => { if (regionAt(p.lon, p.lat).id === id) seeds.push([p.lon, p.lat]); }));
  seeds.forEach(([lon, lat]) => { const ix = Math.floor(lon / step), iy = Math.floor(lat / step); push(ix, iy); push(ix + 1, iy); push(ix - 1, iy); push(ix, iy + 1); push(ix, iy - 1); });
  let over = false;
  while (q.length) {
    const [ix, iy] = q.pop(), lon = (ix + 0.5) * step, lat = (iy + 0.5) * step;
    if (lat > 84 || lat < -84) continue;
    const X = sct$(() => regionAt(lon, lat), null); if (!X || X.id !== id || !sct$(() => rgCountry(lon, lat), 1)) continue;
    out.push([lon, lat]); if (out.length > cap) { over = true; break; }
    push(ix + 1, iy); push(ix - 1, iy); push(ix, iy + 1); push(ix, iy - 1);
  }
  return { out, over, seeds };
}
const sctDl = (a, b) => { let d = a - b; while (d > 180) d -= 360; while (d < -180) d += 360; return d; };
// v93 : plus de secteurs ni de formes. La brume se lève autour de chaque lieu visité (rayon selon la taille de la région) ;
// la connaissance = la part de la SURFACE de la région découverte. Revenir au même endroit ne découvre rien.
const SQ3 = Math.sqrt(3);
function sctKeyOld(R, lon0, lat0, kx, ky, k) { const i = k.indexOf('_'), q = +k.slice(0, i), r = +k.slice(i + 1); return [lon0 + R * SQ3 * (q + r / 2) / kx, lat0 + R * 1.5 * r / ky]; }
function sctGrid(id) {
  if (SCT_GRID[id]) return SCT_GRID[id];
  const Rg = RG[id]; if (!Rg) return null;
  const lat0 = Rg.anchor[1], ky = 110.57;
  let p1 = sctFlood(id, 0.5, 4000); if (p1.over) p1 = sctFlood(id, 2, 4000);
  const st1 = p1.over ? 2 : 0.5;
  let area = 0; p1.out.forEach(([, lat]) => { area += (st1 * 111.32 * Math.cos(lat * Math.PI / 180)) * (st1 * ky); });
  area = Math.max(area, 3000);
  const r = Math.max(15, Math.sqrt(area) / 12);           // rayon de brume levée autour d'un lieu (km)
  const step = Math.max(0.08, Math.min(3, r * 0.45 / ky));
  const p2 = sctFlood(id, step, 8000);
  const pts = p2.out.length ? p2.out : p2.seeds;
  // pour la conversion des anciennes parties (secteurs hexagonaux)
  const Rold = Math.max(30, Math.sqrt(area / (2.598 * 17))), kx0 = 111.32 * Math.max(0.15, Math.cos(lat0 * Math.PI / 180));
  return (SCT_GRID[id] = { id, area, r, step, pts, old: k => sctKeyOld(Rold, Rg.anchor[0], lat0, kx0, ky, k) });
}
const sctKm = (a, b, c, d) => { const x = sctDl(c, a) * 111.32 * Math.cos((b + d) / 2 * Math.PI / 180), y = (d - b) * 110.57; return Math.sqrt(x * x + y * y); };

// ---------- connaissance ----------
const SCT_LV = [
  { nm: 'Inconnue', red: 0 },
  { nm: 'Visiteur', red: 0, f: 0.001, fx: 'La région est sur votre carte.' },
  { nm: 'Habitué', red: 0.15, f: 0.06, fx: 'Trajets −15 % · les régions voisines s’ouvrent · un indice d’Augustine apparaît' },
  { nm: 'Connaisseur', red: 0.30, f: 0.15, fx: 'Trajets −30 % · on vous parle des autres passages' },
  { nm: 'Comme chez soi', red: 0.45, f: 0.30, fx: 'Trajets −45 %' },
  { nm: 'Enfant du pays', red: 0.60, f: 0.50, fx: 'Trajets −60 %' },
];
const sctPct = f => f <= 0 ? 0 : Math.max(1, Math.round(f * 100));
const sctVis = id => { const s = sctSt(); if (!s.v || typeof s.v !== 'object') s.v = {}; return s.v[id] || []; };
function sctCov(id) {
  const g = sctGrid(id), V = sctVis(id); if (!g || !V.length) return 0;
  const sig = V.length + ':' + (V[V.length - 1] || []).join(',');
  if (g.covSig === sig) return g.cov;
  let c = 0; g.pts.forEach(([lon, lat]) => { if (V.some(([a, b, rk]) => sctKm(a, b, lon, lat) < g.r * (rk || 1))) c++; });
  g.covSig = sig; g.cov = g.pts.length ? Math.min(1, c / g.pts.length) : 0;
  return g.cov;
}
function sctInfo(id) {
  const f = sctCov(id); let lvl = 0;
  SCT_LV.forEach((L, i) => { if (i && (f >= L.f || (i === 1 && sctVis(id).length))) lvl = i; });
  return { f, pct: sctPct(f), lvl, nm: SCT_LV[lvl].nm, red: SCT_LV[lvl].red, next: lvl < 5 ? Math.round(SCT_LV[lvl + 1].f * 100) : null, th: SCT_LV.slice(1).map(L => Math.round(L.f * 100)) };
}
const sctLvl = id => sct$(() => sctInfo(id).lvl, 0);
const sctStars = l => '★'.repeat(l) + '☆'.repeat(5 - l);
const sctRegOf = d => sct$(() => regionAt(d.lon, d.lat), null);
// le lieu fait-il découvrir quelque chose ? (déjà connu = un lieu visité tout près)
function sctNear(d) { const R = sctRegOf(d); if (!R || !rcOk(R)) return null; const g = sctGrid(R.id); if (!g) return null; const near = sctVis(R.id).some(([a, b]) => sctKm(a, b, d.lon, d.lat) < g.r * 0.45); return { R, g, near }; }
function sctKnown(d) { const K = sctNear(d); return !K || K.near; }
const sctRed = d => { const R = sctRegOf(d); return R && rcOk(R) ? SCT_LV[sctLvl(R.id)].red : 0; };

// un lieu visité : la brume se lève autour (quiet = sans annonce)
function sctVisit(d, quiet) {
  const K = sct$(() => sctNear(d), null); if (!K || K.near) return null;
  const s = sctSt(), id = K.R.id; if (!s.v[id]) s.v[id] = [];
  const before = sctInfo(id);
  s.v[id].push(d.rk > 1 ? [+(+d.lon).toFixed(4), +(+d.lat).toFixed(4), +(+d.rk).toFixed(2)] : [+(+d.lon).toFixed(4), +(+d.lat).toFixed(4)]);
  const I = sctInfo(id); sctDirty = true;
  if (!quiet && I.pct > before.pct) setTimeout(() => sct$(() => {
    if (I.lvl > before.lvl) { toast(`⭐ ${K.R.short} : vous êtes « ${I.nm} » ! ${I.red ? `Trajets ${Math.round(I.red * 100)} % plus rapides dans la région.` : ''}`); sct$(() => confetti(true)); }
    else toast(`🌫️ La brume se lève : ${K.R.short} découverte à ${I.pct} %${I.next ? ` (niveau suivant à ${I.next} %)` : ''}`);
  }), 900);
  return { id, I, up: I.lvl > before.lvl };
}
// au retour d'un compagnon
GAME.on('trip:return', e => sct$(() => { if (e && e.dest && !(e.trip && e.trip.tuto)) { sctVisit(e.trip && e.trip.faRk > 1 ? { ...e.dest, rk: e.trip.faRk } : e.dest, false); sct$(save); sct$(() => rcCheck(false)); } }));
// mise en route : la maison est connue, les anciens voyages comptent (et les anciens secteurs)
function sctMig() {
  const s = sctSt(); if (s.mig3) return; if (document.body.classList.contains('firstrun')) return;
  s.mig3 = 1; if (!s.v || typeof s.v !== 'object') s.v = {};
  sct$(() => sctVisit(homeObj(), true));
  sct$(() => Object.entries(s.d || {}).forEach(([id, D]) => { const g = sctGrid(id); if (g) Object.keys(D).forEach(k => { const c = g.old(k); sctVisit({ lon: c[0], lat: c[1] }, true); }); }));
  sct$(() => (bfX().o || []).forEach(([lon, lat]) => sctVisit({ lon, lat }, true)));
  sct$(() => PLACES.forEach(p => { if (S.found && S.found[p.name]) sctVisit(p, true); }));
  sct$(() => Object.values(s.camp || {}).forEach(c => sctVisit(c, true)));
  sct$(save);
}

// ---------- une région est « explorée » quand on y est Habitué (remplace les 3 voyages de 81) ----------
rcCheck = function (quiet) {
  const s = rcSt(), home = rc$(() => rgHome().id, '');
  if (home && !s.open[home]) s.open[home] = { need: 3, at: Date.now() };
  if (!s.mig) {
    s.mig = 1;
    Object.keys(s.seen).forEach(id => { if (RG[id] && rcOk(RG[id]) && rcTrips(id) > 0 && !s.open[id]) s.open[id] = { need: 3, at: Date.now() }; });
    rc$(() => PLACES.forEach(p => { if (S.found[p.name]) { const R = regionAt(p.lon, p.lat); if (rcOk(R) && !s.open[R.id]) s.open[R.id] = { need: 3, at: Date.now() }; } }));
    quiet = true;
  }
  let changed = false;
  for (let guard = 0; guard < 60; guard++) {
    const R = REGIONS.find(X => s.open[X.id] && !s.done[X.id] && sctLvl(X.id) >= 2); if (!R) break;
    s.done[R.id] = Date.now();
    const nw = rcNearest(R, RC_NEAR);
    nw.forEach(X => { s.open[X.id] = { need: 3, at: Date.now() }; });
    changed = true;
    if (!quiet && nw.length) { rc$(() => toast(`🗺️ Vous êtes Habitué de ${R.short} ! ${nw.length > 1 ? 'Nouvelles régions ouvertes' : 'Nouvelle région ouverte'} : ${nw.map(X => X.short).join(' et ')}.`)); rc$(() => confetti(true)); }
  }
  const sig = Object.keys(s.open).sort().join(',');
  if (changed || sig !== rcSig) { rcSig = sig; rcCellsCache = null; sctDirty = true; rc$(() => { exDirty = true; }); rc$(save); rc$(rcBounds); rc$(() => drawMarks()); }
};
// la fiche d'une région fermée : « Habitué de … » au lieu de « 3 voyages »
if (typeof fdCard === 'function') fdCard = (orig => function (id) {
  const r = orig.apply(this, arguments);
  sct$(() => {
    const el = document.querySelector('#fdC .fd-how'); if (!el || !/voyages/.test(el.textContent)) return;
    const lib = psEdgesOf(id).filter(x => x[2] === 'libre').map(x => psOther(x, id)).find(o => rcIsOpen(o)); if (!lib) return;
    const I = sctInfo(lib);
    el.innerHTML = `Elle s’ouvrira quand vous serez <b>Habitué</b> de ${esc(RG[lib].short)} : ${I.pct}/${I.th[1]} % de la région découverte. Visitez des lieux dans la brume là-bas.`;
  });
  return r;
})(fdCard);

// ---------- la carte : les secteurs dans la brume ----------
if (typeof fdMist === 'function') fdMist = function () { sct$(() => { if (map.getLayer('fdMist')) map.setLayoutProperty('fdMist', 'visibility', 'none'); }); };
let sctDirty = true, sctBuild = 0;
function sctOpenIds() { return Object.keys(rcSt().open).filter(id => RG[id] && rcOk(RG[id])); }
// v93 : une vraie brume continue (image dessinée), sans formes : un voile blanc sur les régions ouvertes,
// qui s'efface doucement autour des lieux visités.
let sctImgSig = '';
function sctFogImage() {
  const ids = sctOpenIds().filter(id => SCT_GRID[id]); if (!ids.length) return null;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  ids.forEach(id => { const g = SCT_GRID[id]; g.pts.forEach(([lon, lat]) => { x0 = Math.min(x0, lon - g.step); x1 = Math.max(x1, lon + g.step); y0 = Math.min(y0, lat - g.step); y1 = Math.max(y1, lat + g.step); }); });
  const pad = 0.6; x0 -= pad; x1 += pad; y0 = Math.max(-80, y0 - pad); y1 = Math.min(80, y1 + pad);
  const M = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)), m0 = M(y0), m1 = M(y1);
  const wDeg = x1 - x0, hM = (m1 - m0) * 180 / Math.PI, sc = 1100 / Math.max(wDeg, hM);
  const W = Math.max(64, Math.round(wDeg * sc)), H = Math.max(64, Math.round(hM * sc));
  const X = lon => (lon - x0) / wDeg * W, Y = lat => (m1 - M(lat)) / (m1 - m0) * H;
  const a = document.createElement('canvas'); a.width = W; a.height = H; const c = a.getContext('2d');
  c.fillStyle = '#fff';
  ids.forEach(id => { const g = SCT_GRID[id], hw = g.step * sc * 0.62; g.pts.forEach(([lon, lat]) => { const px = X(lon), py = Y(lat); c.fillRect(px - hw, py - hw * 1.4, hw * 2, hw * 2.8); }); });
  const b = document.createElement('canvas'); b.width = W; b.height = H; const d = b.getContext('2d');
  d.filter = `blur(${Math.max(2, Math.round(W / 220))}px)`; d.drawImage(a, 0, 0); d.filter = 'none';
  // la brume s'efface autour des lieux visités
  d.globalCompositeOperation = 'destination-out';
  ids.forEach(id => { const g = SCT_GRID[id]; sctVis(id).forEach(([lon, lat, rk]) => {
    const px = X(lon), py = Y(lat), rr = g.r * (rk || 1) / (111.32 * Math.max(0.2, Math.cos(lat * Math.PI / 180))) * sc * 1.05;
    const gr = d.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr; d.beginPath(); d.arc(px, py, rr, 0, Math.PI * 2); d.fill();
  }); });
  return { url: b.toDataURL('image/png'), coordinates: [[x0, y1], [x1, y1], [x1, y0], [x0, y0]] };
}
function sctPaint() {
  if (typeof map === 'undefined' || !map || !map.getSource || !sct$(() => map.getLayer('exFog'), null)) return;
  ['sctLine', 'sctClueF', 'sctClueL'].forEach(l => sct$(() => { if (map.getLayer(l)) map.removeLayer(l); }));
  sct$(() => { if (map.getLayer('sctFog') && map.getLayer('sctFog').type !== 'raster') map.removeLayer('sctFog'); });
  const miss = sctOpenIds().find(id => !SCT_GRID[id]);
  if (miss) { sctGrid(miss); sctDirty = true; if (++sctBuild < 50) return; }
  const sig = sctOpenIds().map(id => id + ':' + sctVis(id).length).join('|');
  if (!sctDirty && sig === sctImgSig && map.getLayer('sctFog')) return;
  sctDirty = false; sctImgSig = sig;
  const I = sctFogImage(); if (!I) return;
  const src = map.getSource('sctFogImg');
  if (src && src.updateImage) src.updateImage(I);
  else map.addSource('sctFogImg', { type: 'image', url: I.url, coordinates: I.coordinates });
  if (!map.getLayer('sctFog')) map.addLayer({ id: 'sctFog', type: 'raster', source: 'sctFogImg', paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 9, 0.5, 12, 0.32], 'raster-fade-duration': 0, 'raster-resampling': 'linear' } }, 'exFog');
}

// ---------- étiquettes des régions ouvertes (vue Monde) ----------
function sctLabels() {
  if (typeof ovEls === 'undefined' || !document.getElementById('ov') || document.body.classList.contains('firstrun')) return;
  const L = sctOpenIds(), keep = new Set(L.map(id => 'sctl' + id));
  Object.keys(ovEls).forEach(key => { if (key.startsWith('sctl') && !keep.has(key)) { ovEls[key].el.remove(); delete ovEls[key]; } });
  L.forEach(id => {
    const key = 'sctl' + id, I = sct$(() => sctInfo(id), null); if (!I) return;
    const h = `<span><b>${esc(RG[id].short)}</b><i>${sctStars(I.lvl)}</i></span>`;
    if (ovEls[key] && ovEls[key].el.isConnected) { if (ovEls[key].el.innerHTML !== h) ovEls[key].el.innerHTML = h; ovEls[key].el.hidden = false; return; }
    const el = document.createElement('div'); el.className = 'ovm sctl'; el.dataset.sctreg = id; el.innerHTML = h;
    document.getElementById('ov').appendChild(el); ovEls[key] = { el, lon: RG[id].anchor[0], lat: RG[id].anchor[1] };
  });
}

// ---------- la fiche d'une région : à quoi sert de la découvrir ----------
function sctCardHTML(id) {
  const R = RG[id], I = sctInfo(id), pct = I.pct;
  const lad = SCT_LV.slice(1).map((L, i) => { const lv = i + 1, ok = I.lvl >= lv; return `<li class="${ok ? 'ok' : lv === I.lvl + 1 ? 'cur' : ''}"><span>${ok ? '✓' : lv}</span><div><b>${L.nm} <small>${i ? I.th[i] + ' % de la région' : 'un premier voyage'}</small></b><small>${L.fx}</small></div></li>`; }).join('');
  const camp = sct$(() => augCampLine(id), '');
  return `<div class="ch-card sct-card"><p class="cu-k">Votre connaissance de la région</p><h3 class="ps-h">${esc(R.name)}</h3>
<p class="sct-lv"><b>${I.nm}</b> <i>${sctStars(I.lvl)}</i>${I.red ? ` <em>Trajets −${Math.round(I.red * 100)} %</em>` : ''}</p>
<div class="sct-bar"><i style="width:${pct}%"></i><span>${I.pct} % de la région découverte</span></div>
<p class="sct-how">La <b>brume</b> se lève autour de chaque lieu où vont vos compagnons. Plus vous découvrez la région, plus le niveau monte. Retourner au même endroit ne découvre rien de neuf : allez voir plus loin !</p>
<ul class="cn-steps sct-lad">${lad}</ul>${camp}
<button class="cu-later" data-sctquit="1">Fermer</button></div>`;
}
function sctCard(id) {
  if (!RG[id] || document.getElementById('sctC')) return;
  const el = document.createElement('div'); el.id = 'sctC'; el.className = 'ch-ov ch-route'; el.innerHTML = sctCardHTML(id);
  document.body.appendChild(el); document.body.classList.add('cu-on');
}
function sctClose() { const el = document.getElementById('sctC'); if (el) el.remove(); document.body.classList.remove('cu-on'); }
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-sctreg],[data-sctquit]'); if (!t) return;
  ev.stopPropagation(); ev.preventDefault();
  if (t.dataset.sctquit) return sctClose();
  sctClose(); sct$(() => { $('modal').hidden = true; }); sctCard(t.dataset.sctreg);
}, true);

// ---------- la fiche de départ : ce que ce voyage apporte ----------
function sctTipHTML(d) {
  const K = sct$(() => sctNear(d), null); if (!K) return '';
  const I = sctInfo(K.R.id), out = [];
  if (sct$(() => augClueAt(d), false)) out.push(`<span class="sct-t clue">📖 Le camp d’Augustine est par ici !</span>`);
  if (!K.near) out.push(`<span class="sct-t new">🌫️ Coin dans la brume : ce voyage fera découvrir ${esc(K.R.short)} <small>(${I.pct} % aujourd’hui)</small></span>`);
  else out.push(`<span class="sct-t">Coin déjà découvert</span>`);
  if (I.red) out.push(`<span class="sct-t fast">⚡ ${esc(K.R.short)}, niveau ${I.nm} : trajet −${Math.round(I.red * 100)} %</span>`);
  const O = sct$(() => augOrigin(d), null); if (O && O.camp) out.push(`<span class="sct-t camp">⛺ Départ du camp d’Augustine (${esc(RG[O.camp].short)})</span>`);
  return `<div class="sct-tip" data-sctreg="${K.R.id}">${out.join('')}</div>`;
}
if (typeof trjDecorate === 'function') trjDecorate = (orig => function (box) {
  const r = orig.apply(this, arguments);
  sct$(() => {
    if (!box || S.trips[S.sel] || !plan.dest || plan.dest.tuto) return;
    const old = box.querySelector('.sct-tip'), h = sctTipHTML(plan.dest); if (!h) { if (old) old.remove(); return; }
    if (old) { if (old.outerHTML !== h) old.outerHTML = h; return; }
    const a = box.querySelector('.trjline') || box.querySelector('.dhead, .poihead'); if (a) a.insertAdjacentHTML('afterend', h);
  });
  return r;
})(trjDecorate);

// ---------- rafraîchissement ----------
setInterval(() => { if (document.hidden) return; sct$(sctMig); sct$(sctPaint); sct$(sctLabels); }, 2000);
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); sct$(sctLabels); return r; })(drawMarks);
window.__sct = { info: id => sctInfo(id), grid: id => { const g = sctGrid(id); return g && { r: g.r, n: g.pts.length, area: g.area }; }, visit: (lon, lat) => sctVisit({ lon, lat }, false), card: id => sctCard(id), ev: s => eval(s) };

{
  const css = document.createElement('style');
  css.textContent = `
.ovm.sctl{z-index:2;cursor:pointer}.sctl span{display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-155%);padding:2px 9px 1px;border-radius:12px;background:rgba(255,255,255,.92);border:2px solid #3f9c95;box-shadow:0 2px 0 rgba(74,53,40,.2);white-space:nowrap}
.sctl b{font:800 12px var(--body,system-ui);color:#2f6f6a}.sctl i{font-style:normal;font-size:10px;letter-spacing:1px;color:#e0a42a;line-height:1}
#ov.vw-coin .sctl{display:none!important}
.sct-card{text-align:left}.sct-card .ps-h,.sct-card .cu-k{text-align:center}
.sct-lv{margin:2px 0 8px;text-align:center;font:800 15px var(--body,system-ui);color:#4a3528}.sct-lv i{font-style:normal;color:#e0a42a;letter-spacing:1px}.sct-lv em{font-style:normal;margin-left:6px;padding:1px 8px;border-radius:999px;background:#3f9c95;color:#fff;font-size:12px}
.sct-bar{position:relative;height:22px;border-radius:999px;background:#efe6d6;border:2px solid #4a3528;overflow:hidden;margin:0 0 8px}.sct-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#7fd0c8,#3f9c95)}.sct-bar span{position:relative;display:block;text-align:center;font:800 12px/18px var(--body,system-ui);color:#2b2018}
.sct-how{margin:0 0 8px;font:600 13px/1.35 var(--body,system-ui);color:#5a4434}
.sct-lad{margin-bottom:8px}.sct-lad small{display:block}
.sct-tip{display:flex;flex-direction:column;gap:3px;margin:4px 0 6px;cursor:pointer}
.sct-t{padding:5px 10px;border-radius:10px;background:#f4efe6;font:700 12.5px var(--body,system-ui);color:#7a6a5c}.sct-t small{font-weight:700;opacity:.8}
.sct-t.new{background:#eef7f6;color:#2f6f6a;border:1.5px dashed #7fbfb8}.sct-t.fast{background:#fff3c9;color:#6b4f12}.sct-t.camp{background:#eaf4e2;color:#3d6b2a}.sct-t.clue{background:#ffe7c9;color:#9a4a0e;border:1.5px dashed #e0701a}
`;
  document.head.appendChild(css);
}

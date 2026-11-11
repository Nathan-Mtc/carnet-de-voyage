// ================= 62 · BROUILLARD EN CERCLES + ANIMATION AU RETOUR (v43) =================
// Le joueur : « trop de zones, et le brouillard ne s'enlève jamais ». Décisions (questions du 11/11) :
//   • unité = un CERCLE d'environ 100 km autour du lieu visité (fini les petits carrés éparpillés d'une zone) ;
//   • il se lève seulement à l'ARRIVÉE d'un voyage, mais on le VOIT au retour : la carte va sur le lieu et le
//     brouillard se dissipe sous les yeux (animation) quand on ferme l'écran de retour ;
//   • la portée ne s'affiche plus qu'en km (voir 50_difficulte.js et 58_conseil.js).
// Technique : S.ex.o = [[lon, lat, km], …] (cercles dévoilés), S.ex.pend = cercles en attente d'animation,
// S.ex.leg = anciennes cellules de 0,5° dévoilées avant cette version (toujours dégagées). Le dessin rasterise
// tout sur une grille fine de 0,1° et réutilise le principe de 52 (bandes par ligne + bords flous).
// Les cellules S.ex.c de 52 restent tenues à jour (conseil, zones, histoire) : rien d'autre ne change.
const BF_R = 100, BF_F = 0.1;
let bfAnim = null, bfSkip = false;
function bfX() {
  const X = exState();
  if (!Array.isArray(X.o)) X.o = [];
  if (!Array.isArray(X.pend)) X.pend = [];
  if (!X.v2) {
    X.v2 = 1; X.leg = Object.keys(X.c);
    const h = md$(() => homeObj(), null); if (h) X.o.push([+h.lon, +h.lat, BF_R]);
  }
  if (!Array.isArray(X.leg)) X.leg = [];
  return X;
}
const bfKey = (ix, iy) => ix + '_' + iy;
function bfCircle(set, lon, lat, km) {
  const y0 = Math.floor((lat - km / 111.2) / BF_F), y1 = Math.floor((lat + km / 111.2) / BF_F);
  for (let iy = y0; iy <= y1; iy++) {
    const cy = (iy + 0.5) * BF_F, dy = (cy - lat) * 111.2; if (Math.abs(dy) > km) continue;
    const hw = Math.sqrt(km * km - dy * dy), dl = hw / (111.2 * Math.max(0.15, Math.cos(cy * Math.PI / 180)));
    const x0 = Math.round((lon - dl) / BF_F), x1 = Math.round((lon + dl) / BF_F) - 1;
    for (let ix = x0; ix <= x1; ix++) set.add(bfKey(ix, iy));
  }
}
function bfCells(extra) {
  const X = bfX(), set = new Set(), n = Math.round(EX_CELL / BF_F);
  X.leg.forEach(c => { const p = exCellXY(c); if (!p) return; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) set.add(bfKey(p[0] * n + a, p[1] * n + b)); });
  X.o.forEach(([lon, lat, km]) => bfCircle(set, lon, lat, km));
  (extra || []).forEach(([lon, lat, km]) => { if (km > 0.5) bfCircle(set, lon, lat, km); });
  return set;
}
exFogData = function (extra) {
  const set = bfCells(extra), rows = {}, edges = [], holes = [];
  set.forEach(k => { const i = k.indexOf('_'), x = +k.slice(0, i), y = +k.slice(i + 1); (rows[y] = rows[y] || []).push(x); });
  Object.entries(rows).forEach(([y, xs]) => {
    y = +y; xs.sort((a, b) => a - b);
    let s = xs[0], prev = xs[0];
    const push = (a, b) => { const x0 = a * BF_F, x1 = (b + 1) * BF_F, y0 = y * BF_F, y1 = (y + 1) * BF_F; holes.push([[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]); };
    for (let i = 1; i < xs.length; i++) { if (xs[i] !== prev + 1) { push(s, prev); s = xs[i]; } prev = xs[i]; }
    push(s, prev);
    xs.forEach(x => {
      const x0 = x * BF_F, x1 = x0 + BF_F, y0 = y * BF_F, y1 = y0 + BF_F;
      if (!set.has(bfKey(x - 1, y))) edges.push([[x0, y0], [x0, y1]]);
      if (!set.has(bfKey(x + 1, y))) edges.push([[x1, y0], [x1, y1]]);
      if (!set.has(bfKey(x, y - 1))) edges.push([[x0, y0], [x1, y0]]);
      if (!set.has(bfKey(x, y + 1))) edges.push([[x0, y1], [x1, y1]]);
    });
  });
  return {
    fog: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], ...holes] } },
    edge: { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: edges } },
  };
};
// un cercle validé : il entre dans S.ex.o et ses cellules de 0,5° sont marquées (conseil, zones)
function bfCommit(lon, lat, km) {
  const X = bfX(); X.o.push([+(+lon).toFixed(3), +(+lat).toFixed(3), km]);
  const s = new Set(); bfCircle(s, lon, lat, km);
  s.forEach(k => { const i = k.indexOf('_'); X.c[exCellOf((+k.slice(0, i) + 0.5) * BF_F, (+k.slice(i + 1) + 0.5) * BF_F)] = 1; });
  exDirty = true; md$(save, 0);
}
const bfCovered = (lon, lat) => bfX().o.concat(bfX().pend.map(p => [p.lon, p.lat, p.km])).some(([a, b, km]) => md$(() => mdKm({ lon: a, lat: b }, { lon, lat }), 1e9) < km * 0.35);
// ---- une arrivée : le cercle attend l'écran de retour pour se dévoiler ----
if (typeof exVisit === 'function') exVisit = (orig => function (d, t) {
  bfSkip = true;
  let r; try { r = orig.apply(this, arguments); } finally { bfSkip = false; }
  try {
    if (d && d.lon != null && !d.poi && !mdTuto() && !bfCovered(+d.lon, +d.lat)) {
      bfX().pend.push({ lon: +d.lon, lat: +d.lat, km: BF_R, name: d.name || '', at: Date.now() });
      md$(save, 0);
    }
  } catch (e) { console.error('brouillard', e); }
  return r;
})(exVisit);
// dévoilements d'histoire (chapitres) : un cercle par cellule de la zone, tout de suite
if (typeof exReveal === 'function') exReveal = (orig => function (ids) {
  const nw = orig.apply(this, arguments);
  if (!bfSkip && nw && nw.length) md$(() => { const X = bfX(); nw.forEach(id => exZoneCells(id).forEach(c => { const C = exCellC(c); if (C && !bfCovered(C.lon, C.lat)) X.o.push([C.lon, C.lat, 45]); })); exDirty = true; save(); }, 0);
  return nw;
})(exReveal);
// déménagement : un cercle autour de la nouvelle maison
if (typeof exRevealHome === 'function') exRevealHome = (orig => function (X) {
  const r = orig.apply(this, arguments);
  md$(() => { const h = homeObj(); if (Array.isArray(X.o) && h && !X.o.some(([a, b]) => Math.abs(a - h.lon) < 0.05 && Math.abs(b - h.lat) < 0.05)) X.o.push([+h.lon, +h.lat, BF_R]); }, 0);
  return r;
})(exRevealHome);

// ---- l'animation : la carte va sur le lieu, le brouillard se dissipe ----
function bfSetFog(extra) {
  const D = exFogData(extra);
  md$(() => map.getSource('exFog').setData(D.fog), 0); md$(() => map.getSource('exEdge').setData(D.edge), 0);
}
function bfPlay() {
  const X = bfX();
  if (bfAnim || !X.pend.length || typeof map === 'undefined' || !map || !md$(() => map.getSource('exFog'), null) || mdTuto()) return false;
  const P = X.pend.splice(0), last = P[P.length - 1];
  bfAnim = 1;
  const grow = () => {
    const t0 = performance.now(), T = 1600;
    const step = now => {
      const k = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - k, 3);
      bfSetFog(P.map(p => [p.lon, p.lat, p.km * e]));
      if (k < 1) return setTimeout(() => requestAnimationFrame(step), 50);
      P.forEach(p => bfCommit(p.lon, p.lat, p.km));
      bfAnim = null; exDirty = true; md$(exMapTick, 0);
      md$(() => toast(`🌫️ Le brouillard se lève${last.name ? ` autour de ${last.name}` : ''} !`), 0);
      md$(() => sfx('pop'), 0);
    };
    requestAnimationFrame(step);
  };
  bfSetFog([]);
  const reduce = md$(() => reduceMotion(), false);
  if (reduce) { grow(); return true; }
  md$(() => map.flyTo({ center: [last.lon, last.lat], zoom: Math.min(6.3, Math.max(5.2, map.getZoom())), duration: 1300, essential: true }), 0);
  setTimeout(grow, 1400);
  return true;
}
// l'écran de retour (55_journal : .hhead) vient d'être fermé → on joue l'animation
{
  let bfSaw = false;
  const m = document.getElementById('modal');
  if (m) new MutationObserver(() => {
    if (!m.hidden) { if (m.querySelector('.hhead')) bfSaw = true; return; }
    if (bfSaw) { bfSaw = false; setTimeout(() => { if (m.hidden) md$(bfPlay, 0); }, 350); }
  }).observe(m, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
}
// filet de sécurité : un cercle en attente depuis plus de 3 minutes, carte visible et rien d'ouvert → on le joue
setInterval(() => md$(() => {
  const X = bfX(), m = document.getElementById('modal');
  if (!X.pend.length || bfAnim || (m && !m.hidden) || document.body.classList.contains('sheet-open')) return;
  if (Date.now() - Math.min(...X.pend.map(p => p.at || 0)) > 180000) bfPlay();
}, 0), 5000);
// pendant l'animation, la mise à jour automatique de 52 ne doit pas redessiner le brouillard final
if (typeof exMapTick === 'function') exMapTick = (orig => function () { if (bfAnim) return; return orig.apply(this, arguments); })(exMapTick);
window.__fog = { x: bfX, play: bfPlay, commit: bfCommit, cells: bfCells, visit: (d, t) => exVisit(d, t) };

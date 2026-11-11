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
// v43b : le joueur trouve 100 km trop grand et le brouillard trop épais → 30 km par voyage, 40 km autour de la maison, voile plus léger
const BF_R = 30, BF_HOME = 40, BF_F = 0.1;
let bfAnim = null, bfSkip = false;
function bfX() {
  const X = exState();
  if (!Array.isArray(X.o)) X.o = [];
  if (!Array.isArray(X.pend)) X.pend = [];
  if (!X.v2) {
    X.v2 = 1; X.leg = Object.keys(X.c);
    const h = md$(() => homeObj(), null); if (h) X.o.push([+h.lon, +h.lat, BF_HOME]);
  }
  if (!X.v3) { X.v3 = 1; X.o.forEach((c, i) => { if (c[2] >= 100) c[2] = i === 0 ? BF_HOME : BF_R; }); X.pend.forEach(p => { if (p.km >= 100) p.km = BF_R; }); exDirty = true; }
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
  // Un polygone avec des centaines de trous qui se touchent est mal dessiné par la carte (tout restait dans le brouillard).
  // On dessine donc l'inverse : le monde avec UN seul trou (le rectangle autour de ce qui est découvert), puis, dans ce
  // rectangle, des bandes de brouillard sur les cases NON découvertes (des rectangles séparés, toujours valides).
  const set = bfCells(extra), edges = [], polys = [];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  set.forEach(k => { const i = k.indexOf('_'), x = +k.slice(0, i), y = +k.slice(i + 1); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
  const W = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
  if (!set.size) polys.push([W]);
  else {
    x0 -= 1; x1 += 1; y0 -= 1; y1 += 1;
    const bx0 = x0 * BF_F, bx1 = (x1 + 1) * BF_F, by0 = y0 * BF_F, by1 = (y1 + 1) * BF_F;
    // sens des anneaux : la carte range les anneaux par sens de rotation ; contour du monde et bandes = même sens, trou = sens inverse
    polys.push([W, [[bx0, by0], [bx0, by1], [bx1, by1], [bx1, by0], [bx0, by0]]]);
    const rect = (a, b, y) => { const ax = a * BF_F, bx = (b + 1) * BF_F, ay = y * BF_F, by = (y + 1) * BF_F; polys.push([[[ax, ay], [bx, ay], [bx, by], [ax, by], [ax, ay]]]); };
    for (let y = y0; y <= y1; y++) {
      let s0 = null;
      for (let x = x0; x <= x1 + 1; x++) {
        const fog = x <= x1 && !set.has(bfKey(x, y));
        if (fog && s0 === null) s0 = x;
        if (!fog && s0 !== null) { rect(s0, x - 1, y); s0 = null; }
        if (x <= x1 && !fog) {
          const cx0 = x * BF_F, cx1 = cx0 + BF_F, cy0 = y * BF_F, cy1 = cy0 + BF_F;
          if (!set.has(bfKey(x - 1, y))) edges.push([[cx0, cy0], [cx0, cy1]]);
          if (!set.has(bfKey(x + 1, y))) edges.push([[cx1, cy0], [cx1, cy1]]);
          if (!set.has(bfKey(x, y - 1))) edges.push([[cx0, cy0], [cx1, cy0]]);
          if (!set.has(bfKey(x, y + 1))) edges.push([[cx0, cy1], [cx1, cy1]]);
        }
      }
    }
  }
  return {
    fog: { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polys } },
    edge: { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: edges } },
  };
};
// voile plus léger, sans coutures entre les bandes
let bfPaintOk = false;
function bfPaint() {
  if (bfPaintOk || typeof map === 'undefined' || !map || !md$(() => map.getLayer('exFog'), null)) return;
  md$(() => {
    map.setPaintProperty('exFog', 'fill-antialias', false);
    map.setPaintProperty('exFog', 'fill-opacity', ['interpolate', ['linear'], ['zoom'], 2, 0.28, 8, 0.32]);
    map.setPaintProperty('exEdge', 'line-opacity', 0.35);
    map.setPaintProperty('exEdge', 'line-width', ['interpolate', ['linear'], ['zoom'], 3, 3, 9, 14]);
    map.setPaintProperty('exEdge', 'line-blur', ['interpolate', ['linear'], ['zoom'], 3, 3, 9, 12]);
    bfPaintOk = true;
  }, 0);
}
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
  md$(() => { const h = homeObj(); if (Array.isArray(X.o) && h && !X.o.some(([a, b]) => Math.abs(a - h.lon) < 0.05 && Math.abs(b - h.lat) < 0.05)) X.o.push([+h.lon, +h.lat, BF_HOME]); }, 0);
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
if (typeof exMapTick === 'function') exMapTick = (orig => function () { if (bfAnim) return; const r = orig.apply(this, arguments); bfPaint(); return r; })(exMapTick);
window.__fog = { x: bfX, play: bfPlay, commit: bfCommit, cells: bfCells, visit: (d, t) => exVisit(d, t), jump: (lon, lat, z) => map.jumpTo({ center: [lon, lat], zoom: z }), vis: v => ['exFog', 'exEdge'].forEach(id => map.setLayoutProperty(id, 'visibility', v)), feat: () => map.queryRenderedFeatures(map.project(map.getCenter()), { layers: ['exFog'] }).length };
// v43b : le soir, le voile de nuit de la carte (06_map.js) s'ajoutait au brouillard → bien trop sombre. Voile de nuit allégé.
{
  const st = document.createElement('style');
  st.textContent = `#cvAmb[data-ph="night"] .veil{background:radial-gradient(120% 90% at 50% 40%,rgba(118,124,196,.22),rgba(62,70,140,.32))}`;
  document.head.appendChild(st);
}

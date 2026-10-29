// ================= LIEUX AU ZOOM =================
const hashStr = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const POI_MIN_Z = () => mapMode === 'tiles' ? 14 : 12;
let poiCache = {}, poiShown = {}, townKey = '';
const fillName = (tpl, r, cityName) => tpl.replace('{N}', NOMS[Math.floor(r() * NOMS.length)]).replace('{A2}', ['Moulin', 'Chêne', 'Ruisseau', 'Coteau'][Math.floor(r() * 4)]).replace('{A}', ARBRES[Math.floor(r() * ARBRES.length)]).replace('{S}', SAINTS[Math.floor(r() * SAINTS.length)]).replace('{V}', cityName);
function rng(seedN) { let s = seedN % 2147483646 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function genTown(c) {
  const k = c.n + c.lon;
  if (poiCache[k]) return poiCache[k];
  const r = rng(hashStr(k));
  const big = c.gen ? 0.45 : c.r <= 2 ? 3 : c.r <= 4 ? 2 : c.r <= 6 ? 1.4 : c.r <= 8 ? 1 : 0.7;
  const R = 1.6 * big, nP = Math.round(10 * big + (c.gen ? 1 : 4)), nS = Math.round(5 * big + (c.gen ? 1 : 3));
  const kmLon = 111 * Math.cos(c.lat * Math.PI / 180), kmLat = 111;
  const at = (dx, dy) => [c.lon + dx / kmLon, c.lat + dy / kmLat];
  const out = { pois: [], feats: [] };
  // contour de la ville
  const ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr = R * (0.85 + 0.25 * Math.sin(a * 3 + r() * 6)); ring.push(at(Math.cos(a) * rr, Math.sin(a) * rr)); }
  ring[24] = ring[0];
  out.feats.push({ type: 'Feature', properties: { kind: 'town' }, geometry: { type: 'Polygon', coordinates: [ring] } });
  // rues
  const used = new Set();
  const voie = () => { let v; for (let t = 0; t < 8; t++) { v = VOIES[Math.floor(r() * VOIES.length)]; if (!used.has(v)) break; } used.add(v); return v; };
  const base = r() * Math.PI;
  for (let i = 0; i < nS; i++) {
    const ang = base + (i % 2 ? Math.PI / 2 : 0) + (r() - 0.5) * 0.35, off = (r() - 0.5) * R * 1.4, len = R * (0.7 + r() * 0.6);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const a = at(nx * off - Math.cos(ang) * len, ny * off - Math.sin(ang) * len), b = at(nx * off + Math.cos(ang) * len, ny * off + Math.sin(ang) * len);
    const main = i < 2;
    const name = main ? (i === 0 ? 'Grande Rue' : `Avenue ${voie()}`) : `Rue ${voie()}`;
    out.feats.push({ type: 'Feature', properties: { kind: main ? 'main' : 'street' }, geometry: { type: 'LineString', coordinates: [a, b] } });
    const t = 0.25 + r() * 0.5;
    out.pois.push({ id: k + 's' + i, cat: 'rue', name, lon: a[0] + (b[0] - a[0]) * t, lat: a[1] + (b[1] - a[1]) * t, city: c.n });
  }
  // routes de sortie
  for (let i = 0; i < 2; i++) {
    const ang = r() * Math.PI * 2, a = at(Math.cos(ang) * R * 0.6, Math.sin(ang) * R * 0.6), b = at(Math.cos(ang) * R * 3, Math.sin(ang) * R * 3);
    const near = geoLayersCities().filter(x => x !== c && Math.abs(x.lat - c.lat) < 1.2 && Math.abs(x.lon - c.lon) < 1.6).sort((p, q) => Math.hypot(p.lon - b[0], p.lat - b[1]) - Math.hypot(q.lon - b[0], q.lat - b[1]))[0];
    out.feats.push({ type: 'Feature', properties: { kind: 'road' }, geometry: { type: 'LineString', coordinates: [a, b] } });
    out.pois.push({ id: k + 'r' + i, cat: 'route', name: near ? `Route de ${near.n}` : 'Route départementale', lon: (a[0] + b[0] * 2) / 3, lat: (a[1] + b[1] * 2) / 3, city: c.n });
  }
  // commerces et lieux
  const cats = Object.entries(POI_CATS).filter(([, v]) => v[4] > 0);
  const tot = cats.reduce((s, [, v]) => s + v[4], 0);
  const pickCat = () => { let x = r() * tot; for (const [kk, v] of cats) { x -= v[4]; if (x <= 0) return kk; } return 'boulangerie'; };
  const extra = [];
  if (c.r <= 7 && !c.gen) extra.push('gare');
  if (c.r <= 3) extra.push('zoo', 'musee');
  if (c.r >= 5 && r() < 0.5) extra.push('camping'); if (c.r >= 5 && r() < 0.4) extra.push('belvedere'); if (c.gen) extra.push('patrimoine', 'boulangerie');
  let coastal = false;
  for (let i = 0; i < nP + extra.length; i++) {
    let cat = i < extra.length ? extra[i] : pickCat();
    const ang = r() * Math.PI * 2, rr = Math.sqrt(r()) * R * (cat === 'camping' || cat === 'belvedere' ? 1.8 : 1);
    let [lon, lat] = at(Math.cos(ang) * rr, Math.sin(ang) * rr);
    if (!isLand(lon, lat)) { cat = coastal && r() < 0.5 ? 'port' : 'plage'; coastal = true; }
    const names = POI_NAMES[cat] || [POI_CATS[cat][0]];
    out.pois.push({ id: k + 'p' + i, cat, name: fillName(names[Math.floor(r() * names.length)], r, c.n), lon, lat, city: c.n });
  }
  // campagne autour : bois, champs, fermes
  const nat = c.gen ? 3 : Math.round(3 + big * 2);
  for (let i = 0; i < nat; i++) {
    const ang = r() * Math.PI * 2, rr = R * (1.3 + r() * 1.6);
    const [lon, lat] = at(Math.cos(ang) * rr, Math.sin(ang) * rr);
    if (!isLand(lon, lat)) continue;
    const cat = ['foret', 'campagne', 'ferme'][Math.floor(r() * 3)];
    out.pois.push({ id: k + 'n' + i, cat, name: fillName(pick3(cat === 'foret' ? BOIS_N : cat === 'campagne' ? CHAMP_N : FERME_N, r), r, c.n), lon, lat, city: c.n });
  }
  if (coastal) { const ang = r() * Math.PI * 2; let best = null; for (let i = 0; i < 16; i++) { const a2 = ang + i / 16 * Math.PI * 2, p = at(Math.cos(a2) * R * 1.1, Math.sin(a2) * R * 1.1); if (!isLand(p[0], p[1])) { best = p; break; } } if (best) out.pois.push({ id: k + 'pp', cat: 'poissonnerie', name: fillName('Poissonnerie {N}', r, c.n), lon: (best[0] + c.lon) / 2, lat: (best[1] + c.lat) / 2, city: c.n }); }
  if (c.gen) out.pois.push({ id: k + 'L', label: true, name: c.n, lon: c.lon, lat: c.lat });
  poiCache[k] = out;
  return out;
}
const pick3 = (arr, r) => arr[Math.floor(r() * arr.length)];
function villageName(r) { let a = pick3(VIL_A, r), b = pick3(VIL_B, r); if (a === 'Mont' || a === 'Ville') b = b.toLowerCase(); return a + b + (r() < 0.35 ? pick3(VIL_C, r) : ''); }
function gridVillages(b) {
  const step = 0.07, out = [];
  const x0 = Math.floor(b.getWest() / step), x1 = Math.ceil(b.getEast() / step), y0 = Math.floor(b.getSouth() / step), y1 = Math.ceil(b.getNorth() / step);
  if ((x1 - x0) * (y1 - y0) > 400) return out;
  const real = geoLayersCities().filter(c => c.lon > b.getWest() - 0.2 && c.lon < b.getEast() + 0.2 && c.lat > b.getSouth() - 0.2 && c.lat < b.getNorth() + 0.2);
  for (let gx = x0; gx < x1; gx++) for (let gy = y0; gy < y1; gy++) {
    const r = rng(hashStr('v' + gx + ':' + gy));
    if (r() > 0.72) continue;
    const lon = (gx + 0.15 + r() * 0.7) * step, lat = (gy + 0.15 + r() * 0.7) * step;
    if (Math.abs(lat) > 70 || !isLand(lon, lat)) continue;
    const kmLon = 111 * Math.cos(lat * Math.PI / 180);
    if (real.some(c => Math.hypot((c.lon - lon) * kmLon, (c.lat - lat) * 111) < (c.r <= 4 ? 9 : 4.5))) continue;
    out.push({ n: villageName(r), lon, lat, r: 10, cap: 0, gen: true });
  }
  return out;
}
let _cities = null;
function geoLayersCities() { if (!_cities) _cities = GEO.p.map(([n, lon, lat, r, cap]) => ({ n, lon, lat, r, cap })); return _cities; }
function nearestCityName(lon, lat) { let b = null, bd = 1e9; for (const c of geoLayersCities()) { if (c.r > 9) continue; const d = Math.hypot((c.lon - lon) * Math.cos(lat * Math.PI / 180), c.lat - lat); if (d < bd) { bd = d; b = c; } } return b ? b.n : ''; }
// densité « comme Maps » : chaque cellule de ~1 km a ses lieux, plus nombreux en ville
const CELL = 0.01;
const BLDG_COLORS = ['#f4dcc0', '#efd0b8', '#f2e6cf', '#e8d2c4', '#f6e2b8', '#e9d9c9', '#f0cfc4', '#dfe0cf'];
function treeFeat(lon, lat, rM, h, col) { const ring = [], k = 1 / (111000 * Math.cos(lat * Math.PI / 180)); for (let i = 0; i <= 6; i++) { const a = i / 6 * 6.283; ring.push([lon + Math.cos(a) * rM * k, lat + Math.sin(a) * rM / 111000]); } return { type: 'Feature', properties: { kind: 'tree', h: Math.round(h), c: col }, geometry: { type: 'Polygon', coordinates: [ring] } }; }
function boxFeat(lon, lat, w, d, h, col) { const k = 1 / (111000 * Math.cos(lat * Math.PI / 180)), dl = d / 111000; return { type: 'Feature', properties: { kind: 'bldg', h, c: col }, geometry: { type: 'Polygon', coordinates: [[[lon - w / 2 * k, lat - dl / 2], [lon + w / 2 * k, lat - dl / 2], [lon + w / 2 * k, lat + dl / 2], [lon - w / 2 * k, lat + dl / 2], [lon - w / 2 * k, lat - dl / 2]]] } }; }
const cityRad = c => c.gen ? 1.3 : c.r <= 2 ? 7 : c.r <= 4 ? 4.5 : c.r <= 6 ? 3.2 : c.r <= 8 ? 2.4 : 1.9;
const cityW = c => c.gen ? 0.62 : c.r <= 6 ? 1 : 0.85;
const RURAL = [['foret', 4], ['campagne', 4], ['ferme', 2], ['route', 1], ['camping', 0.3], ['belvedere', 0.4], ['etang', 0.8], ['riviere', 0.8], ['sentier', 0.6]];
let cellCache = {};
function urbanAt(lon, lat, towns) {
  let u = 0, best = null, bd = 1e9;
  const kmLon = 111 * Math.cos(lat * Math.PI / 180);
  for (const c of towns) {
    const d = Math.hypot((c.lon - lon) * kmLon, (c.lat - lat) * 111), R = cityRad(c);
    const v = cityW(c) * Math.exp(-(d / R) * (d / R));
    if (v > u) u = v;
    const dn = d / R; if (dn < bd) { bd = dn; best = c; }
  }
  return { u, city: best ? best.n : '', c: best };
}
function genCell(gx, gy, towns) {
  const key = gx + ':' + gy;
  if (cellCache[key]) return cellCache[key];
  const r = rng(hashStr('c' + key));
  const lon0 = gx * CELL, lat0 = gy * CELL;
  const { u, city, c: cobj } = urbanAt(lon0 + CELL / 2, lat0 + CELL / 2, towns);
  const out = { pois: [], feats: [] };
  const land = isLand(lon0 + CELL / 2, lat0 + CELL / 2);
  // rues en quadrillage continu (aligné sur la ville) + pâtés de maisons en 3D
  if (land && u > 0.22 && cobj) {
    const th = (hashStr(cobj.n) % 157) / 100, ct = Math.cos(th), st = Math.sin(th);
    const mLon = 111000 * Math.cos(cobj.lat * Math.PI / 180), mLat = 111000;
    const S = cobj.gen ? 150 : cobj.r <= 4 ? 105 : 130;
    const toM = (lon, lat) => { const X = (lon - cobj.lon) * mLon, Y = (lat - cobj.lat) * mLat; return [X * ct + Y * st, -X * st + Y * ct]; };
    const toLL = (xr, yr) => { const X = xr * ct - yr * st, Y = xr * st + yr * ct; return [cobj.lon + X / mLon, cobj.lat + Y / mLat]; };
    const corners = [[lon0, lat0], [lon0 + CELL, lat0], [lon0, lat0 + CELL], [lon0 + CELL, lat0 + CELL]].map(([a2, b2]) => toM(a2, b2));
    const xmn = Math.min(...corners.map(q => q[0])), xmx = Math.max(...corners.map(q => q[0])), ymn = Math.min(...corners.map(q => q[1])), ymx = Math.max(...corners.map(q => q[1]));
    const clip = (p1, p2) => { let t0 = 0, t1 = 1; const dx2 = p2[0] - p1[0], dy2 = p2[1] - p1[1]; const P = [-dx2, dx2, -dy2, dy2], Q = [p1[0] - lon0, lon0 + CELL - p1[0], p1[1] - lat0, lat0 + CELL - p1[1]]; for (let i = 0; i < 4; i++) { if (P[i] === 0) { if (Q[i] < 0) return null; } else { const t = Q[i] / P[i]; if (P[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; } } } return [[p1[0] + t0 * dx2, p1[1] + t0 * dy2], [p1[0] + t1 * dx2, p1[1] + t1 * dy2]]; };
    const lines = [];
    for (let k = Math.ceil(xmn / S); k <= Math.floor(xmx / S); k++) { const seg = clip(toLL(k * S, ymn - 10), toLL(k * S, ymx + 10)); if (seg) lines.push([seg, 'x' + k, k % 4 === 0]); }
    for (let k = Math.ceil(ymn / S); k <= Math.floor(ymx / S); k++) { const seg = clip(toLL(xmn - 10, k * S), toLL(xmx + 10, k * S)); if (seg) lines.push([seg, 'y' + k, k % 4 === 0]); }
    for (const [seg, lk, main] of lines) {
      if (!isLand((seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2)) continue;
      out.feats.push({ type: 'Feature', properties: { kind: main ? 'main' : 'street' }, geometry: { type: 'LineString', coordinates: seg } });
      const rr2 = rng(hashStr(cobj.n + lk));
      if (r() < 0.45) { const t = 0.2 + r() * 0.6; out.pois.push({ id: 'c' + key + 's' + lk, cat: 'rue', name: main ? `${pick3(['Avenue', 'Boulevard', 'Cours'], rr2)} ${pick3(VOIES, rr2)}` : `${pick3(['Rue', 'Rue', 'Rue', 'Rue', 'Allée', 'Impasse'], rr2)} ${pick3(VOIES, rr2)}`, lon: seg[0][0] + (seg[1][0] - seg[0][0]) * t, lat: seg[0][1] + (seg[1][1] - seg[0][1]) * t, city, imp: r() }); }
    }
    const dense = u > 0.5;
    for (let i = Math.floor(xmn / S); i <= Math.ceil(xmx / S); i++) for (let j = Math.floor(ymn / S); j <= Math.ceil(ymx / S); j++) {
      const cx = (i + 0.5) * S, cy = (j + 0.5) * S, cll = toLL(cx, cy);
      if (cll[0] < lon0 || cll[0] >= lon0 + CELL || cll[1] < lat0 || cll[1] >= lat0 + CELL) continue;
      if (!isLand(cll[0], cll[1])) continue;
      const rb = rng(hashStr(cobj.n + ':' + i + ':' + j));
      const h0 = urbanAt(cll[0], cll[1], [cobj]).u;
      if (h0 < 0.18) continue;
      const m = 10, inner = S - 2 * m;
      if (rb() < 0.07) { // square / petit parc
        const ring = [[-inner / 2, -inner / 2], [inner / 2, -inner / 2], [inner / 2, inner / 2], [-inner / 2, inner / 2], [-inner / 2, -inner / 2]].map(([a2, b2]) => toLL(cx + a2, cy + b2));
        out.feats.push({ type: 'Feature', properties: { kind: 'park' }, geometry: { type: 'Polygon', coordinates: [ring] } });
        for (let q = 0; q < 7; q++) { const tl = toLL(cx + (rb() - 0.5) * inner * 0.8, cy + (rb() - 0.5) * inner * 0.8); out.feats.push(treeFeat(tl[0], tl[1], 3 + rb() * 2.5, 7 + rb() * 6, '#7fbf74')); }
        if (rb() < 0.6) out.pois.push({ id: 'c' + key + 'k' + i + '_' + j, cat: 'parc', name: fillName(pick3(POI_NAMES.parc, rb), rb, city), lon: cll[0], lat: cll[1], city, imp: rb() });
        continue;
      }
      const nx = h0 > 0.5 ? 3 : 2, ny = h0 > 0.5 ? 2 : 2, pw = inner / nx, ph = inner / ny;
      for (let a2 = 0; a2 < nx; a2++) for (let b2 = 0; b2 < ny; b2++) {
        if (!dense && rb() < 0.25) continue;
        const sx = h0 > 0.5 ? 0.5 : 2.5 + rb() * 3, x1 = -inner / 2 + a2 * pw + sx, x2 = x1 + pw - 2 * sx, y1 = -inner / 2 + b2 * ph + sx, y2 = y1 + ph - 2 * sx;
        const ring = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]].map(([a3, b3]) => toLL(cx + a3, cy + b3));
        const h = h0 > 0.5 ? 9 + rb() * 18 * h0 + (rb() < 0.05 ? 30 : 0) : 5 + rb() * 6;
        out.feats.push({ type: 'Feature', properties: { kind: 'bldg', h: Math.round(h), c: BLDG_COLORS[Math.floor(rb() * BLDG_COLORS.length)] }, geometry: { type: 'Polygon', coordinates: [ring] } });
      }
    }
  } else if (land && u > 0.05 && r() < 0.35) {
    const ang = r() * Math.PI, cx = lon0 + CELL / 2, cy = lat0 + CELL / 2, dx = Math.cos(ang) * CELL * 0.7, dy = Math.sin(ang) * CELL * 0.7;
    out.feats.push({ type: 'Feature', properties: { kind: 'road' }, geometry: { type: 'LineString', coordinates: [[cx - dx, cy - dy], [cx + dx, cy + dy]] } });
  }
  // lieux
  const cats = Object.entries(POI_CATS).filter(([, v]) => v[4] > 0), tot = cats.reduce((a, [, v]) => a + v[4], 0);
  const rtot = RURAL.reduce((a, x) => a + x[1], 0);
  const n = Math.floor(u * 9 + r() * (u > 0.1 ? 1.5 : 1.4) + (u < 0.1 ? 0.55 : 0));
  for (let i = 0; i < n; i++) {
    const lon = lon0 + r() * CELL, lat = lat0 + r() * CELL;
    let cat;
    if (u > 0.12) { let x = r() * tot; for (const [kk, v] of cats) { x -= v[4]; if (x <= 0) { cat = kk; break; } } }
    else { let x = r() * rtot; for (const [kk, w] of RURAL) { x -= w; if (x <= 0) { cat = kk; break; } } }
    cat = cat || 'boulangerie';
    if (!isLand(lon, lat)) { if (u > 0.05 && (isLand(lon + CELL, lat) || isLand(lon - CELL, lat) || isLand(lon, lat + CELL) || isLand(lon, lat - CELL))) { const q = r(); cat = q < 0.66 ? 'plage' : q < 0.95 ? 'port' : 'phare'; } else continue; }
    const names = { foret: BOIS_N, campagne: CHAMP_N, ferme: FERME_N }[cat] || POI_NAMES[cat] || [POI_CATS[cat][0]];
    out.pois.push({ id: 'c' + key + 'p' + i, cat, name: fillName(pick3(names, r), r, city), lon, lat, city, imp: r() * (cat === 'plage' || cat === 'gare' || cat === 'musee' ? 0.3 : 1) });
    if (cat === 'parc' || cat === 'foret' || cat === 'camping') {
      const nt = cat === 'foret' ? 22 : 9, spread = cat === 'foret' ? 160 : 70;
      for (let q = 0; q < nt; q++) { const a = r() * 6.283, d = Math.sqrt(r()) * spread, tl = lon + Math.cos(a) * d / (111000 * Math.cos(lat * Math.PI / 180)), tt = lat + Math.sin(a) * d / 111000; out.feats.push(treeFeat(tl, tt, 3 + r() * 3, 7 + r() * 9, cat === 'foret' ? '#5f9a6a' : '#7fbf74')); }
      if (cat === 'parc') { const rad = 75 / 111000, ring = []; for (let q = 0; q <= 18; q++) { const a = q / 18 * 6.283; ring.push([lon + Math.cos(a) * rad / Math.cos(lat * Math.PI / 180), lat + Math.sin(a) * rad * 0.8]); } out.feats.push({ type: 'Feature', properties: { kind: 'park' }, geometry: { type: 'Polygon', coordinates: [ring] } }); }
    }
    if (cat === 'ferme') out.feats.push(boxFeat(lon + 0.0004, lat + 0.0002, 18, 12, 7, '#c9604f'));
  }
  if (Object.keys(cellCache).length > 6000) cellCache = {};
  return (cellCache[key] = out);
}
function fallbackPOIs() {
  const b = map.getBounds(), z = map.getZoom();
  const m = 0.25;
  const towns = geoLayersCities().filter(c => c.lon > b.getWest() - m && c.lon < b.getEast() + m && c.lat > b.getSouth() - m && c.lat < b.getNorth() + m);
  if (z >= 11) towns.push(...gridVillages({ getWest: () => b.getWest() - m, getEast: () => b.getEast() + m, getSouth: () => b.getSouth() - m, getNorth: () => b.getNorth() + m }));
  const feats = [], pois = [];
  for (const c of towns) if (c.gen) pois.push({ id: 'L' + c.n + c.lon, label: true, name: c.n, lon: c.lon, lat: c.lat, imp: 0 });
  // halos de ville
  for (const c of towns) { if (!c.gen && c.r > 9) continue; const R = cityRad(c) * 0.9, kmLon = 111 * Math.cos(c.lat * Math.PI / 180), rr = rng(hashStr(c.n)); const ring = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2, k = R * (0.8 + 0.3 * Math.sin(a * 3 + rr() * 6)); ring.push([c.lon + Math.cos(a) * k / kmLon, c.lat + Math.sin(a) * k / 111]); } ring[28] = ring[0]; feats.push({ type: 'Feature', properties: { kind: 'town' }, geometry: { type: 'Polygon', coordinates: [ring] } }); }
  if (z >= 11) {
    const x0 = Math.floor(b.getWest() / CELL), x1 = Math.ceil(b.getEast() / CELL), y0 = Math.floor(b.getSouth() / CELL), y1 = Math.ceil(b.getNorth() / CELL);
    if ((x1 - x0) * (y1 - y0) <= 1600) {
      const thr = z < 11.5 ? 0.05 : z < 12.5 ? 0.1 : z < 13.5 ? 0.28 : z < 14.5 ? 0.6 : 1.01;
      const all = [];
      for (let gx = x0; gx < x1; gx++) for (let gy = y0; gy < y1; gy++) {
        const cell = genCell(gx, gy, towns);
        if (z >= 12.2) for (const f of cell.feats) { const kd = f.properties.kind; if ((kd === 'bldg' || kd === 'tree') && z < 14) continue; feats.push(f); }
        for (const p of cell.pois) if (p.imp < thr && !(p.cat === 'rue' && z < 13)) all.push(p);
      }
      all.sort((p, q) => p.imp - q.imp);
      pois.push(...all.slice(0, 600)); // la sélection d'affichage (poiPick) ne garde qu'une vingtaine de lieux à l'écran
    }
  }
  const key = Math.round(b.getWest() / CELL) + ':' + Math.round(b.getSouth() / CELL) + ':' + Math.round(b.getEast() / CELL) + ':' + Math.round(b.getNorth() / CELL) + ':' + (z >= 14 ? 2 : z >= 12.2 ? 1 : 0);
  if (key !== townKey && mapReady && map.getSource('town')) { townKey = key; map.getSource('town').setData({ type: 'FeatureCollection', features: feats }); }
  return pois;
}
function tilesPOIs() {
  const out = [], seen = new Set();
  let feats = [];
  try { feats = map.queryRenderedFeatures({ layers: ['poi-hit'] }); } catch (e) { return out; }
  for (const f of feats) {
    const p = f.properties || {}, cat = OSM_CAT[p.subclass] || OSM_CAT[p.class];
    const name = p['name:fr'] || p.name || p['name:latin'];
    if (!cat || !name) continue;
    const g = f.geometry.type === 'Point' ? f.geometry.coordinates : null; if (!g) continue;
    const id = cat + name + g[0].toFixed(4) + g[1].toFixed(4);
    if (seen.has(id)) continue; seen.add(id);
    // rank OSM (plus petit = plus connu) : sert à départager les lieux d'une même priorité
    out.push({ id, cat, name, lon: g[0], lat: g[1], imp: Math.min(1, (+p.rank || 40) / 100) });
    if (out.length > 700) break; // la sélection plus bas n'en garde qu'une vingtaine à l'écran
  }
  return out;
}
function poiMarkerHTML(p) { const c = POI_CATS[p.cat]; return `<div class="poib" style="--pc:${c[1]}"><svg viewBox="0 0 24 24" aria-hidden="true">${POI_GLYPH[c[2]]}</svg></div><span class="poil">${esc(p.name)}</span>`; }

// ================= AFFICHAGE DES LIEUX (v14) : lisible à tout zoom =================
// Les lieux du quotidien sont dessinés par MapLibre dans une couche « symbol » (icônes rasterisées une fois) :
// la carte gère elle-même les collisions pendant les animations, sans aucun recalcul HTML à chaque image.
// Le CHOIX des lieux montrés (priorité, densité, diversité des catégories) est fait ici, au moveend seulement.
// Priorité : 1 lieux utiles maintenant (commande, rêve, événement du jour : halo doré) ; 3 types encore jamais visités ;
// 4 le reste ; 5 rues et routes. La destination et les compagnons en route restent des marqueurs HTML et
// réservent leur place (aucune icône dessous), tout comme la maison, les lieux célèbres et les secrets.
const POI_FILTERS = [
  ['utile', 'Utiles maintenant', null],
  ['tout', 'Tout', null],
  ['nourriture', 'Nourriture', ['boulangerie', 'cafe', 'restaurant', 'marche', 'epicerie', 'poissonnerie', 'glacier', 'fromagerie', 'boucherie', 'chocolaterie', 'caviste']],
  ['nature', 'Nature', ['parc', 'plage', 'port', 'foret', 'campagne', 'ferme', 'jardin', 'etang', 'riviere', 'sentier', 'belvedere', 'camping', 'zoo', 'phare']],
  ['boutiques', 'Boutiques', ['fleuriste', 'librairie', 'mode', 'friperie', 'bricolage', 'jouets', 'boutique', 'puces', 'coiffeur', 'laverie', 'pharmacie']],
  ['culture', 'Culture', ['musee', 'patrimoine', 'cinema', 'bibliotheque', 'mairie', 'gare', 'ecole', 'poste']],
];
const poiFilter = () => (S.mapFilter && POI_FILTERS.some(f => f[0] === S.mapFilter)) ? S.mapFilter : 'utile';
function setPoiFilter(id) {
  if (!POI_FILTERS.some(f => f[0] === id)) return;
  S.mapFilter = id; save(); poiPrev = new Set(); poiSig = '';
  refreshPOIs(true);
  if (typeof renderPoiFilter === 'function') renderPoiFilter();
}
// --- lieux utiles maintenant : prochaine étape des rêves, commandes du comptoir, événement du jour
let poiUsefulCache = { t: 0, v: null };
function poiStepCats(st, add, depth = 0) {
  if (!st || depth > 3) return;
  if (st.t === 'item' && typeof srcStep === 'function') return poiStepCats(srcStep(st), add, depth + 1);
  if (st.t === 'craft' && typeof bqStepFor === 'function') { const s2 = bqStepFor({ k: 'craft', id: st.id }); if (s2 && s2.t !== 'craft') poiStepCats(s2, add, depth + 1); return; }
  if (st.cat) [].concat(st.cat).forEach(c => add(c));
  else if (st.tag && typeof TAG_POIS === 'object') (TAG_POIS[st.tag] || []).forEach(c => add(c));
}
function poiUsefulNow(force) {
  const now = Date.now();
  if (!force && poiUsefulCache.v && now - poiUsefulCache.t < 1500) return poiUsefulCache.v;
  const cats = new Set(), why = {};
  const add = src => c => { if (!POI_CATS[c] || c === 'rue' || c === 'route') return; cats.add(c); if (!why[c]) why[c] = src; };
  try {
    const team = (typeof teamIds === 'function' ? teamIds() : Object.keys(S.comps || {})).filter(k => CHARS[k]);
    if (typeof curDream === 'function' && typeof nextStepIdx === 'function') for (const k of team) {
      const d = curDream(k), i = d ? nextStepIdx(k) : -1;
      if (d && i >= 0) poiStepCats(d.steps[i], add('reve'));
    }
  } catch (e) {}
  try {
    if (S.shop && Array.isArray(S.shop.orders) && typeof bqAllocate === 'function' && typeof bqStepFor === 'function') for (const o of S.shop.orders) {
      const al = bqAllocate(o), r = o.req.find((x, j) => al[j].have < x.n);
      if (r) poiStepCats(bqStepFor(r), add('commande'));
    }
  } catch (e) {}
  try { const ev = typeof todayEvent === 'function' ? todayEvent() : null; if (ev && ev.tags) ev.tags.forEach(add('evenement')); } catch (e) {}
  return (poiUsefulCache = { t: now, v: { cats, why } }).v;
}
// type de lieu encore jamais visité : aucun objet de sa table de butin dans le carnet
const poiNewCache = {};
function poiNewCat(cat) {
  const n = Object.keys(S.dex || {}).length, c = poiNewCache[cat];
  if (c && c.n === n) return c.v;
  const L = typeof LOOT === 'object' ? LOOT[cat] : null, v = !!(L && L.length && !L.some(d => S.dex[d[0]]));
  poiNewCache[cat] = { n, v }; return v;
}
// la pastille « nouveau » n'a de sens qu'une fois quelques types visités (au tout début, tout serait « nouveau »)
let poiSeenTypes = { n: -1, v: 0 };
function poiTypesSeen() {
  const n = Object.keys(S.dex || {}).length; if (poiSeenTypes.n === n) return poiSeenTypes.v;
  let v = 0; for (const c of Object.keys(POI_CATS)) if (LOOT[c] && LOOT[c].some(d => S.dex[d[0]])) v++;
  return (poiSeenTypes = { n, v }).v;
}
// --- icônes rasterisées (une fois par catégorie et variante ; une image par nom affiché)
const POI_PR = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
const POI_FONT = '700 12.5px "Baloo 2", "Nunito", system-ui, sans-serif';
const poiGlyphImg = {}; let poiGlyphsP = null, poiGlyphsOK = false;
function loadPoiGlyphs() {
  if (poiGlyphsP) return poiGlyphsP;
  const jobs = Object.entries(POI_GLYPH).map(([k, g]) => new Promise(res => {
    const im = new Image(); im.onload = () => { poiGlyphImg[k] = im; res(); }; im.onerror = () => res();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">${g}</svg>`);
  }));
  poiGlyphsP = Promise.all(jobs).then(() => { poiGlyphsOK = true; });
  return poiGlyphsP;
}
// demi-largeur de l'emplacement de l'icône dans l'image (le point du lieu est au centre de l'icône)
const poiHW = v => v.includes('u') ? 20 : v.includes('s') ? 11 : 15;
function poiDrawIcon(g, cx, cy, cat, v) {
  const c = POI_CATS[cat] || POI_CATS.boutique, small = v.includes('s'), r = small ? 7 : 10.5, use = v.includes('u');
  if (use) {
    const gr = g.createRadialGradient(cx, cy, r + 2, cx, cy, r + 9);
    gr.addColorStop(0, 'rgba(246,196,69,.9)'); gr.addColorStop(1, 'rgba(246,196,69,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r + 9, 0, 7); g.fill();
  }
  g.save(); g.shadowColor = 'rgba(74,53,40,.38)'; g.shadowBlur = 2.5; g.shadowOffsetY = 1.4;
  g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(cx, cy, r + 2, 0, 7); g.fill(); g.restore();
  g.fillStyle = c[1]; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.strokeStyle = use ? '#c98f1e' : 'rgba(74,53,40,.5)'; g.lineWidth = use ? 1.6 : 1; g.beginPath(); g.arc(cx, cy, r + 2.4, 0, 7); g.stroke();
  const gi = poiGlyphImg[c[2]]; if (gi) { const s = small ? 9.5 : 13; g.drawImage(gi, cx - s / 2, cy - s / 2, s, s); }
  if (v.includes('w')) { // pastille « nouveau » : type de lieu encore jamais visité
    const bx = cx + r * 0.8, by = cy - r * 0.8;
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(bx, by, 4, 0, 7); g.fill();
    g.fillStyle = '#e0607e'; g.beginPath(); g.arc(bx, by, 2.7, 0, 7); g.fill();
  }
}
let poiMeasureCtx = null; const poiTW = {};
function poiTextW(t) {
  if (poiTW[t] != null) return poiTW[t];
  if (Object.keys(poiTW).length > 3000) for (const k in poiTW) delete poiTW[k];
  if (!poiMeasureCtx) poiMeasureCtx = document.createElement('canvas').getContext('2d');
  poiMeasureCtx.font = POI_FONT; return (poiTW[t] = Math.ceil(poiMeasureCtx.measureText(t).width));
}
const poiShort = n => n.length > 26 ? n.slice(0, 24).trim() + '…' : n;
const poiLblImgs = new Map(); // nom d'image → dernier usage (pour faire le ménage)
function poiMakeImage(key) {
  if (!map || map.hasImage(key) || !poiGlyphsOK) return;
  const [kind, v, cat, ...rest] = key.split('|'), name = rest.join('|');
  const hw = poiHW(v), txt = kind === 'pl' ? poiShort(name) : '', tw = txt ? poiTextW(txt) + 8 : 0;
  const W = hw * 2 + (txt ? tw + 1 : 0), H = hw * 2;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(W * POI_PR); cv.height = Math.ceil(H * POI_PR);
  const g = cv.getContext('2d'); g.scale(POI_PR, POI_PR);
  poiDrawIcon(g, hw, hw, cat, v);
  if (txt) {
    g.font = POI_FONT; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const x = hw * 2 - (v.includes('u') ? 4 : 1);
    g.lineWidth = 3.6; g.strokeStyle = 'rgba(255,248,234,.96)'; g.strokeText(txt, x, hw + 0.5);
    g.fillStyle = v.includes('u') ? '#5a3a10' : '#4a3528'; g.fillText(txt, x, hw + 0.5);
  }
  try { map.addImage(key, g.getImageData(0, 0, cv.width, cv.height), { pixelRatio: POI_PR }); } catch (e) { return; }
  if (kind === 'pl') poiLblImgs.set(key, Date.now());
}
function poiCleanImages(keep) {
  if (poiLblImgs.size < 160) return;
  const old = [...poiLblImgs.entries()].filter(([k]) => !keep.has(k)).sort((a, b) => a[1] - b[1]).slice(0, poiLblImgs.size - 100);
  for (const [k] of old) { try { if (map.hasImage(k)) map.removeImage(k); } catch (e) {} poiLblImgs.delete(k); }
}
// --- couche MapLibre
let poiLayerOK = false;
function poiLayerInit() {
  if (!map || poiLayerOK || map.getSource('pois')) return;
  map.addSource('pois', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'poi-sym', type: 'symbol', source: 'pois',
    layout: {
      'icon-image': ['get', 'img'],
      'icon-anchor': 'left',
      'icon-offset': ['match', ['get', 'hw'], 20, ['literal', [-20, 0]], 11, ['literal', [-11, 0]], ['literal', [-15, 0]]],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.74, 14, 0.82, 15.5, 0.92, 16.5, 1],
      'icon-allow-overlap': false, 'icon-ignore-placement': false, 'icon-padding': 1,
      'symbol-sort-key': ['get', 'sk'], 'symbol-z-order': 'auto',
      'icon-pitch-alignment': 'viewport', 'icon-rotation-alignment': 'viewport',
    },
    paint: { 'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.85, 12, 1] },
  });
  // une icône manquante (après un ménage) est redessinée aussitôt
  map.on('styleimagemissing', e => { if (e.id && (e.id.startsWith('pi|') || e.id.startsWith('pl|'))) poiMakeImage(e.id); });
  map.on('mousemove', 'poi-sym', e => { map.getCanvas().style.cursor = 'pointer'; poiTip(e.features && e.features[0]); });
  map.on('mouseleave', 'poi-sym', () => { map.getCanvas().style.cursor = ''; poiTip(null); });
  map.on('movestart', () => poiTip(null));
  poiLayerOK = true;
  loadPoiGlyphs().then(() => refreshPOIs(true));
  if (document.fonts && document.fonts.load) document.fonts.load(POI_FONT).then(() => { for (const k of poiLblImgs.keys()) { try { map.removeImage(k); } catch (e) {} } poiLblImgs.clear(); for (const k in poiTW) delete poiTW[k]; poiSig = ''; refreshPOIs(true); }).catch(() => {});
}
// survol à la souris : le nom en petite étiquette (au toucher, la fiche du lieu s'ouvre et le nom apparaît sur la destination)
function poiTip(f) {
  let el = $('poiTip');
  if (!f || !f.properties || f.properties.lb) { if (el) el.hidden = true; return; }
  const p = poiById[f.properties.id]; if (!p) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'poiTip'; el.className = 'ovm poitip'; $('ov').appendChild(el); }
  const pt = map.project([p.lon, p.lat]);
  el.textContent = p.name; el.hidden = false; el.style.display = '';
  el.style.transform = `translate(${pt.x.toFixed(1)}px,${pt.y.toFixed(1)}px)`;
}
// lieu touché sur la carte (couche symbole) : le plus proche du doigt, avec une marge pour les petits écrans
function poiAtPoint(pt) {
  if (!map || !map.getLayer('poi-sym')) return null;
  const R = 14; let fs = [];
  try { fs = map.queryRenderedFeatures([[pt.x - R, pt.y - R], [pt.x + R, pt.y + R]], { layers: ['poi-sym'] }); } catch (e) { return null; }
  let best = null, bd = 1e9;
  for (const f of fs) { const p = poiById[f.properties.id]; if (!p) continue; const q = map.project([p.lon, p.lat]), d = Math.hypot(q.x - pt.x, q.y - pt.y); if (d < bd) { bd = d; best = p; } }
  return best;
}
// --- place déjà prise à l'écran : boutons et cartes de l'interface, marqueurs HTML (maison, compagnons, destination…)
function poiBlocked(W, H) {
  const ct = map.getContainer().getBoundingClientRect(), rects = [];
  const push = r => { if (r && r.width && r.height) rects.push([r.left - ct.left, r.top - ct.top, r.right - ct.left, r.bottom - ct.top]); };
  for (const sel of ['#hudComps', '.hud .hright', '.zoom', '#tripCard', '#nav', '#liveBar', '#goal', '#poiFilt']) {
    const el = document.querySelector(sel); if (!el || el.hidden) continue;
    if (sel === '.zoom') { for (const b of el.children) if (!b.hidden && b.offsetParent) push(b.getBoundingClientRect()); continue; }
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
    push(el.getBoundingClientRect());
  }
  const ov = $('ov');
  for (const el of ov.children) {
    if (el.hidden || el.style.display === 'none' || el.classList.contains('poitip') || el.classList.contains('reveal')) continue;
    if (el.classList.contains('ovc')) { push(el.getBoundingClientRect()); continue; }
    if (!el.classList.contains('ovm') || el.classList.contains('poi')) continue;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const c of el.children) { const r = c.getBoundingClientRect(); if (!r.width || getComputedStyle(c).display === 'none') continue; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    if (x1 > x0) rects.push([x0 - ct.left - 4, y0 - ct.top - 4, x1 - ct.left + 4, y1 - ct.top + 4]);
  }
  return rects;
}
const poiKey = p => p.name + '@' + (+p.lon).toFixed(5) + ',' + (+p.lat).toFixed(5);
function poiDestKeys() {
  const ks = new Set();
  try { if (plan.dest && plan.dest.poi) ks.add(poiKey(plan.dest)); } catch (e) {}
  for (const t of Object.values(S.trips || {})) if (t && t.dest && t.dest.poi && !t.done) ks.add(poiKey(t.dest));
  return ks;
}
// --- sélection : priorité, diversité des catégories, densité par zone, pas de chevauchement
let poiPrev = new Set();
function poiPick(cands, z) {
  const ct = map.getContainer(), W = ct.clientWidth, H = ct.clientHeight;
  const tiles = mapMode === 'tiles', lblZ = tiles ? 16 : 14.8, allZ = tiles ? 17 : 15.4;
  const f = poiFilter(), only = (POI_FILTERS.find(x => x[0] === f) || [])[2];
  const U = poiUsefulNow(), dk = poiDestKeys();
  const size = z < 11 ? 0.74 : z < 14 ? 0.74 + (z - 11) * 0.027 : z < 15.5 ? 0.82 + (z - 14) * 0.067 : z < 16.5 ? 0.92 + (z - 15.5) * 0.08 : 1;
  const items = [];
  for (const p of cands) {
    if (!p.cat || !POI_CATS[p.cat]) continue;
    if (only && !only.includes(p.cat)) continue;
    if (dk.size && dk.has(poiKey(p))) continue; // la destination a déjà son marqueur
    const pt = map.project([p.lon, p.lat]);
    if (pt.x < 8 || pt.y < 8 || pt.x > W - 8 || pt.y > H - 8) continue;
    const minor = p.cat === 'rue' || p.cat === 'route', useful = !minor && U.cats.has(p.cat), fresh = !useful && !minor && poiNewCat(p.cat);
    const tier = useful ? 1 : fresh ? 3 : minor ? 5 : 4;
    items.push({ p, x: pt.x, y: pt.y, tier, h: (p.imp != null ? p.imp * 0.6 : 0) + (hashStr(p.id) / 4294967296) * 0.4, prev: poiPrev.has(p.id) ? 0 : 1 });
  }
  // diversité : dans chaque catégorie, rang du lieu (le 1er restaurant passe avant le 2e café, etc.)
  const byCat = {};
  for (const it of items) (byCat[it.p.cat] = byCat[it.p.cat] || []).push(it);
  for (const a of Object.values(byCat)) { a.sort((u, v) => u.prev - v.prev || u.h - v.h); a.forEach((it, i) => { it.rr = Math.min(i, 6); }); }
  items.sort((a, b) => a.tier - b.tier || a.prev - b.prev || a.rr - b.rr || a.h - b.h);
  const area = Math.max(1, (W * H) / (390 * 640));
  const base = z < 13 ? 12 : z < 14 ? 15 : z < 15 ? 18 : z < 16 ? 22 : z < 17 ? 28 : 34;
  const budget = Math.round(base * Math.pow(area, 0.6) * (f === 'tout' ? 1.6 : only ? 1.25 : 1));
  const usefulMax = Math.ceil(budget * 0.4), badge = poiTypesSeen() >= 4;
  const ZONE = 130, more = (f === 'tout' || only) ? 1 : 0;
  const capOf = t => t === 1 ? (z >= lblZ ? 3 : z >= lblZ - 1 ? 2 : 1) : t === 5 ? 1 : (z >= lblZ ? 2 : 1) + more;
  const sp = z < 15 ? 5 : 3;
  // grille d'occupation (cases de 40 px) pour tester les chevauchements rapidement
  const G = 40, grid = new Map();
  const cells = (r, fn) => { for (let gx = Math.floor(r[0] / G); gx <= Math.floor(r[2] / G); gx++) for (let gy = Math.floor(r[1] / G); gy <= Math.floor(r[3] / G); gy++) if (fn(gx + ':' + gy) === false) return false; return true; };
  const hit = r => !cells(r, k => { const L = grid.get(k); if (!L) return true; for (const q of L) if (r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]) return false; return true; });
  const put = r => cells(r, k => { const L = grid.get(k); if (L) L.push(r); else grid.set(k, [r]); });
  for (const r of poiBlocked(W, H)) put(r);
  const zc = {}, out = []; let n = 0, nu = 0;
  for (const it of items) {
    if (it.tier === 1 ? nu >= usefulMax : n >= budget) { if (it.tier > 1) break; continue; }
    const zk = Math.floor(it.x / ZONE) + ',' + Math.floor(it.y / ZONE) + ':' + it.p.cat;
    if ((zc[zk] || 0) >= capOf(it.tier)) continue;
    const v = (it.tier === 1 ? 'u' : '') + (it.tier === 3 && badge ? 'w' : '') + (it.tier === 5 ? 's' : '') || 'n';
    const r = (it.tier === 1 ? 15 : it.tier === 5 ? 9.5 : 13) * size + sp;
    const ri = [it.x - r, it.y - r, it.x + r, it.y + r];
    if (hit(ri)) continue;
    let lb = (z >= lblZ && it.tier <= 3) || z >= allZ, rl = null;
    if (lb) {
      const tw = (poiTextW(poiShort(it.p.name)) + 8) * size;
      rl = [it.x + r - sp - 2, it.y - 9 * size - 1, it.x + r - sp + tw + 2, it.y + 9 * size + 1];
      if (rl[2] > W - 4 || hit(rl)) { lb = false; rl = null; }
    }
    put(ri); if (rl) put(rl);
    zc[zk] = (zc[zk] || 0) + 1; n++; if (it.tier === 1) nu++;
    out.push({ p: it.p, v, lb, tier: it.tier, sk: it.tier * 100 + it.rr * 10 + Math.floor(it.h * 9) });
  }
  return out;
}
// --- mise à jour (au moveend, au chargement des tuiles, quand l'état du jeu change), avec un petit throttle
let poiById = {}, poiSig = '', poiLast = 0, poiTimer = 0, poiStats = { cands: 0, shown: 0, labels: 0, ms: 0 };
const POI_HIDDEN = { hidden: true, remove() {} }; // place-holder : les lieux restent visibles des autres modules via ovEls
function refreshPOIs(force) {
  if (!map || !mapReady) return;
  const now = performance.now();
  if (force !== true && now - poiLast < 150) { clearTimeout(poiTimer); poiTimer = setTimeout(() => refreshPOIs(true), 170); return; }
  clearTimeout(poiTimer); poiLast = now;
  const z = map.getZoom();
  const want = mapMode === 'tiles' ? (z >= POI_MIN_Z() ? tilesPOIs() : []) : (z >= 10 ? fallbackPOIs() : []);
  if (mapMode === 'local' && z < 10 && townKey && map.getSource('town')) { townKey = ''; map.getSource('town').setData({ type: 'FeatureCollection', features: [] }); }
  // noms de villages (mode secours) : petites étiquettes HTML, peu nombreuses
  const keep = new Set(want.map(p => p.id));
  for (const id of Object.keys(poiShown)) if (!keep.has(id)) { poiShown[id].remove(); delete poiShown[id]; delete ovEls['q' + id]; }
  const ov = $('ov');
  for (const p of want) {
    if (!p.label || poiShown[p.id]) continue;
    const el = document.createElement('div'); el.className = 'ovc vil'; el.textContent = p.name;
    ov.insertBefore(el, ov.firstChild);
    poiShown[p.id] = el; ovEls['q' + p.id] = { el, lon: p.lon, lat: p.lat, poi: p };
  }
  // tous les lieux candidats restent connus (fiche, « Partir » des rêves et des commandes via shownPOIs), même non dessinés
  const cands = want.filter(p => !p.label && p.cat);
  const ids = new Set(cands.map(p => p.id));
  for (const k of Object.keys(ovEls)) if (k[0] === 'q' && ovEls[k].el === POI_HIDDEN && !ids.has(k.slice(1))) delete ovEls[k];
  poiById = {};
  for (const p of cands) { poiById[p.id] = p; if (!ovEls['q' + p.id]) ovEls['q' + p.id] = { el: POI_HIDDEN, lon: p.lon, lat: p.lat, poi: p }; }
  positionOverlay();
  if (!poiLayerOK || !map.getSource('pois')) return;
  if (!poiGlyphsOK) { loadPoiGlyphs().then(() => refreshPOIs(true)); return; }
  const sel = poiPick(cands, z);
  const feats = [], used = new Set();
  for (const s of sel) {
    const key = (s.lb ? 'pl|' : 'pi|') + s.v + '|' + s.p.cat + (s.lb ? '|' + poiShort(s.p.name) : '');
    poiMakeImage(key); used.add(key); if (s.lb) poiLblImgs.set(key, Date.now());
    feats.push({ type: 'Feature', properties: { id: s.p.id, img: key, hw: poiHW(s.v), sk: s.sk, lb: s.lb ? 1 : 0 }, geometry: { type: 'Point', coordinates: [s.p.lon, s.p.lat] } });
  }
  poiPrev = new Set(sel.map(s => s.p.id));
  const sig = feats.map(f => f.properties.img + f.properties.id).join(';');
  poiStats = { cands: cands.length, shown: sel.length, labels: sel.filter(s => s.lb).length, useful: sel.filter(s => s.tier === 1).length, ms: +(performance.now() - now).toFixed(2), filter: poiFilter() };
  if (sig === poiSig) return; // rien n'a changé : pas de nouveau rendu (sinon « idle » relancerait sans fin)
  poiSig = sig;
  map.getSource('pois').setData({ type: 'FeatureCollection', features: feats });
  poiCleanImages(used);
}
// l'état du jeu a changé (destination, commande, rêve, filtre) : on réévalue les priorités, sans excès
let poiDestK = '', poiUseK = '', poiStateT = 0;
function poiStateCheck() {
  if (!map || !mapReady) return;
  const d = [...poiDestKeys()].join(';'); let ch = d !== poiDestK; poiDestK = d;
  if (Date.now() - poiStateT > 1500) {
    poiStateT = Date.now();
    const u = [...poiUsefulNow(true).cats].sort().join(',') + '/' + Object.keys(S.dex || {}).length;
    if (u !== poiUseK) { ch = ch || poiUseK !== ''; poiUseK = u; }
  }
  if (ch) { poiSig = ''; refreshPOIs(); }
}
window.__carte = { stats: () => Object.assign({}, poiStats), setMode: m => { mapMode = m; }, refresh: () => refreshPOIs(true), setPoiFilter, poiUsefulNow, shown: () => (map && map.getSource('pois') ? map.querySourceFeatures('pois').length : 0), poiAtPoint, rendered: () => map.queryRenderedFeatures({ layers: ['poi-sym'] }).length, get S() { return S; }, get plan() { return plan; } };
function poiDest(p) {
  const c = POI_CATS[p.cat];
  const spec = (SPECIALTY[p.cat] || SPEC_DEFAULT).slice(); spec[0] = spec[0].replace('{P}', p.name).replace(/\bde (Le|Les|Au|Aux) /, (m, a) => ({ Le: 'du ', Les: 'des ', Au: 'd’Au ', Aux: 'd’Aux ' })[a]);
  return { id: null, poi: true, cat: p.cat, name: p.name, country: c[0], city: p.city || nearestCityName(p.lon, p.lat), lat: p.lat, lon: p.lon, tags: [p.cat, c[3]], special: spec };
}
function choosePOI(p) { if (S.trips[S.sel]) { openSheet('voyage'); toast(`${CHARS[S.sel].name} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; } plan.dest = poiDest(p); if (kmBetween(homeObj(), plan.dest) < 40) plan.dur = 'eclair'; openSheet('voyage'); drawMarks(); }
// table de butin et chances
function lootTable(tags) {
  let pool = [];
  if (POI_CATS[tags[0]] && LOOT[tags[0]]) pool = LOOT[tags[0]].map(d => ({ d }));
  else tags.forEach(t => (LOOT[t] || []).forEach(d => pool.push({ d })));
  if (season() === 'automne' && tags.some(t => ['foret', 'campagne', 'ville', 'montagne', 'parc', 'rue', 'route'].includes(t))) SEASON_LOOT.forEach(d => pool.push({ d, tag: 'Automne' }));
  if (isNight()) NIGHT_LOOT.forEach(d => pool.push({ d, tag: 'La nuit' }));
  const seen = new Set(); pool = pool.filter(x => !seen.has(x.d[0]) && seen.add(x.d[0]));
  const w = pool.map(x => (x.tag ? 0.25 : 1) / (1 + x.d[3] * 1.6)), tot = w.reduce((a, b) => a + b, 0);
  return pool.map((x, i) => ({ ...x, p: w[i] / tot })).sort((a, b) => a.d[3] - b.d[3] || b.p - a.p);
}
const fmtPct = p => p >= 0.095 ? Math.round(p * 100) + ' %' : p >= 0.01 ? (p * 100).toFixed(1).replace('.', ',') + ' %' : '< 1 %';
const fmtDist = km => km < 1 ? `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m` : km < 20 ? `${(Math.round(km * 10) / 10).toLocaleString('fr-FR')} km` : `${Math.round(km).toLocaleString('fr-FR')} km`;
// clic sur la carte détaillée : rue, parc, eau, forêt, champs…
function typedPlaceAt(e) {
  if (mapMode !== 'tiles') return null;
  const box = [[e.point.x - 6, e.point.y - 6], [e.point.x + 6, e.point.y + 6]];
  let fs = [];
  try { fs = map.queryRenderedFeatures(box, { layers: ['rd-name', 'rd-minor', 'rd-main', 'rd-mw', 'park', 'water', 'lc'].filter(id => map.getLayer(id)) }); } catch (er) { return null; }
  if (!fs.length) return null;
  const { lng, lat } = e.lngLat, city = nearestCityName(lng, lat);
  const f = fs[0], L = f.layer.id, pr = f.properties || {};
  const nm = pr['name:fr'] || pr.name;
  if (L === 'rd-name') return { id: 'click', cat: (pr.class === 'motorway' || pr.class === 'trunk' || pr.class === 'primary') ? 'route' : 'rue', name: nm || 'Une rue', lon: lng, lat, city };
  if (L === 'rd-minor') { const n2 = fs.find(x => x.layer.id === 'rd-name'); return { id: 'click', cat: 'rue', name: (n2 && (n2.properties['name:fr'] || n2.properties.name)) || `Une rue de ${city}`, lon: lng, lat, city }; }
  if (L === 'rd-main' || L === 'rd-mw') return { id: 'click', cat: 'route', name: nm || `Route près de ${city}`, lon: lng, lat, city };
  if (L === 'park') return { id: 'click', cat: 'parc', name: nm || `Un parc de ${city}`, lon: lng, lat, city };
  if (L === 'water') return null;
  if (L === 'lc' && (pr.class === 'sand' || pr.subclass === 'beach')) return { id: 'click', cat: 'plage', name: nm || `Plage près de ${city}`, lon: lng, lat, city };
  return null;
}

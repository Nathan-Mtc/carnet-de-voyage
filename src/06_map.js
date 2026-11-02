// ================= VRAIE CARTE (MapLibre, WebGL) =================
const TAG_ICON = {
  montagne: '<path d="M2 20 L9 7 L13 13 L16 9 L22 20Z" fill="#fff"/>',
  neige: '<path d="M12 3 V21 M4 7.5 L20 16.5 M20 7.5 L4 16.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  lac: '<path d="M3 10 q4.5 -4 9 0 q4.5 4 9 0 M3 16 q4.5 -4 9 0 q4.5 4 9 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  mer: '<path d="M2 15 C6 6 12 6 14 11 C10 10 9 15 12 16 C16 17 19 14 22 15 V20 H2Z" fill="#fff"/>',
  foret: '<path d="M12 2 L20 15 H4Z M12 7 L21 20 H3Z" fill="#fff"/><rect x="10.5" y="19" width="3" height="4" fill="#fff"/>',
  ville: '<path d="M3 22 V10 H9 V4 H16 V12 H21 V22Z" fill="#fff"/>',
  monument: '<path d="M3 8 L12 3 L21 8Z M4 21 H20 V19 H4Z M6 9 h2 v9 h-2Z M11 9 h2 v9 h-2Z M16 9 h2 v9 h-2Z" fill="#fff"/>',
  desert: '<circle cx="17" cy="7" r="3.5" fill="#fff"/><path d="M1 20 C6 10 12 10 15 15 C18 12 21 13 23 20Z" fill="#fff"/>',
  campagne: '<path d="M12 22 V4" stroke="#fff" stroke-width="2"/><ellipse cx="9" cy="7" rx="3" ry="1.8" transform="rotate(-35 9 7)" fill="#fff"/><ellipse cx="15" cy="7" rx="3" ry="1.8" transform="rotate(35 15 7)" fill="#fff"/><ellipse cx="9" cy="12" rx="3" ry="1.8" transform="rotate(-35 9 12)" fill="#fff"/><ellipse cx="15" cy="12" rx="3" ry="1.8" transform="rotate(35 15 12)" fill="#fff"/>',
  ile: '<path d="M12 22 C11 16 11 11 13 7" stroke="#fff" stroke-width="2.6" fill="none"/><path d="M13 7 C7 3 3 6 3 9 M13 7 C19 2 23 5 22 9 M13 7 C11 2 15 1 18 2" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  agrumes: '<circle cx="12" cy="14" r="7.5" fill="#fff"/><path d="M12 6 q4 -5 8 -2 q-3 3 -8 2Z" fill="#fff"/>',
};
const LAND_PAL = ['#d3eaa6', '#ecdf9c', '#c9e6a4', '#f2d9a4', '#dbe9a2', '#e6e4ac', '#cfe5b0', '#efe2b0'];
let map = null, mapMode = 'local', mapReady = false, landFeatures = null, geoLayers = null, ovEls = {}, cityEls = [];
const zoomT = { get k() { return map ? Math.pow(2, map.getZoom() - 1.5) : 1; } };
const kToZoom = k => 1.5 + Math.log2(Math.max(1, k));
function homeZoom() { return Math.pow(2, (mapMode === 'tiles' ? 8.5 : 6) - 1.5); }

const decLine = arr => { const out = []; let x = 0, y = 0; for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out.push([x / 100, y / 100]); } return out; };
function fixPoly(rings) { const poly = { type: 'Polygon', coordinates: rings }; if (d3.geoArea(poly) > 2 * Math.PI) rings.forEach(r => r.reverse()); return rings; }
function loadLand() {
  if (typeof GEO === 'undefined') return;
  landFeatures = GEO.c.filter(c => c[4].length).map(([name, iso, col, lrank, polys]) => {
    const coords = polys.map(rings => fixPoly(rings.map(decLine)));
    const f = { type: 'Feature', properties: { fr: name, id: iso, col, lrank, fill: LAND_PAL[(col - 1 + LAND_PAL.length) % LAND_PAL.length] }, geometry: { type: 'MultiPolygon', coordinates: coords } };
    f.properties.bounds = d3.geoBounds(f);
    let best = null, ba = -1;
    coords.forEach(c => { const a = d3.geoArea({ type: 'Polygon', coordinates: c }); if (a > ba) { ba = a; best = c; } });
    f.properties.area = ba; f.properties.centroid = d3.geoCentroid({ type: 'Polygon', coordinates: best });
    return f;
  });
}
const _mask = {};
function maskTile(rx, ry) {
  const key = rx + ':' + ry; if (_mask[key]) return _mask[key];
  const N = 400, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'); g.fillStyle = '#000';
  const x0 = rx * 2, y0 = ry * 2;
  for (const f of landFeatures) {
    const b = f.properties.bounds;
    if (b[0][0] <= b[1][0] && (b[1][0] < x0 || b[0][0] > x0 + 2)) continue;
    if (b[1][1] < y0 || b[0][1] > y0 + 2) continue;
    g.beginPath();
    for (const poly of f.geometry.coordinates) for (const ring of poly) {
      ring.forEach(([lon, lat], i) => { const X = (lon - x0) / 2 * N, Y = (1 - (lat - y0) / 2) * N; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
      g.closePath();
    }
    g.fill('evenodd');
  }
  const data = g.getImageData(0, 0, N, N).data, bits = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) bits[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  return (_mask[key] = bits);
}
const isLand = (lon, lat) => {
  if (!landFeatures) return true;
  const rx = Math.floor(lon / 2), ry = Math.floor(lat / 2), m = maskTile(rx, ry);
  const X = Math.min(399, Math.floor((lon - rx * 2) / 2 * 400)), Y = Math.min(399, Math.floor((1 - (lat - ry * 2) / 2) * 400));
  return m[Y * 400 + X] === 1;
};

// --- styles
// Style « carnet illustré » : pastels francs mais doux, eau turquoise, toits colorés, halo crème.
// Les tuiles OpenFreeMap ne servent que Noto Sans (pas de glyphes Baloo 2 en PBF) : on garde Noto, en gras arrondi et halo crème.
const CV_WALL = ['#fdf3e1', '#f8e7d0', '#fbeedd', '#f4e4d6', '#fff6e6'];
const CV_WALL_NIGHT = ['#ffe3a3', '#ffd98e', '#ffe9b8', '#f9d79a', '#ffdf9a'];
const CV_ROOF = ['#f0b39c', '#f6e2c4', '#b9d7e0', '#c9e2b3', '#f4d398', '#ecc3cf', '#f6e2c4', '#d2c8e8'];
const cvBH = ['coalesce', ['get', 'render_height'], 8];
const cvBId = ['to-number', ['id'], 0];
const cvMatch = (idx, pal) => { const m = ['match', idx]; pal.forEach((c, i) => m.push(i, c)); m.push(pal[0]); return m; };
const cvWallExpr = pal => cvMatch(['%', ['+', cvBId, ['floor', ['/', cvBH, 5]]], pal.length], pal);
function tilesStyle() {
  const F = ['Noto Sans Regular'], FB = ['Noto Sans Bold'], FI = ['Noto Sans Italic'];
  const ink = '#5b3f2c', halo = '#fff8ea';
  const H = (w = 1.8) => ({ 'text-halo-color': halo, 'text-halo-width': w, 'text-halo-blur': 0.5 });
  const omt = (id, type, layer, extra) => Object.assign({ id, type, source: 'omt', 'source-layer': layer }, extra);
  const roof = cvMatch(['%', ['+', ['floor', ['/', cvBId, 7]], ['floor', ['/', cvBH, 9]]], CV_ROOF.length], CV_ROOF);
  const zH = v => ['interpolate', ['linear'], ['zoom'], 14, 0, 15, v];
  return {
    version: 8, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' },
      // relief : tuiles d'altitude publiques (AWS Open Data, format Terrarium). Si elles ne répondent pas, la carte reste sans ombrage.
      dem: { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 12, attribution: 'Relief © Mapzen, AWS Terrain Tiles' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f4ecc9' } },
      omt('lc', 'fill', 'landcover', { paint: { 'fill-color': ['match', ['get', 'subclass'], 'forest', '#93c97f', 'orchard', '#c6e39a', 'vineyard', '#dcd28c', 'meadow', '#c2e69b', 'scrub', '#b5d98f', 'heath', '#c9d99a', 'beach', '#f7dea0', 'glacier', '#e8f3fc',
        ['match', ['get', 'class'], 'wood', '#a2d48a', 'grass', '#c8e8a0', 'farmland', '#f0da8e', 'ice', '#ebf5fd', 'sand', '#f6dca2', 'wetland', '#b3dfc6', 'rock', '#e2d8cf', '#d6e9ab']], 'fill-opacity': 0.95 } }),
      omt('lc-ice-edge', 'line', 'landcover', { filter: ['==', ['get', 'class'], 'ice'], paint: { 'line-color': '#bcd8f0', 'line-width': 1 } }),
      { id: 'hill', type: 'hillshade', source: 'dem', minzoom: 3, maxzoom: 15, paint: { 'hillshade-exaggeration': 0.38, 'hillshade-shadow-color': 'rgba(98,78,150,0.42)', 'hillshade-highlight-color': 'rgba(255,248,222,0.55)', 'hillshade-accent-color': 'rgba(130,100,80,0.22)' } },
      omt('lu', 'fill', 'landuse', { minzoom: 9, paint: { 'fill-color': ['match', ['get', 'class'], 'residential', '#f8e4cc', 'suburb', '#f8e4cc', 'neighbourhood', '#f8e4cc', 'commercial', '#f9dccb', 'retail', '#fbd9cf', 'industrial', '#ece2d9', 'railway', '#ebe1d8', 'cemetery', '#cde6b8', 'hospital', '#fcdcd8', 'school', '#fde6c6', 'kindergarten', '#fde6c6', 'university', '#fde6c6', 'college', '#fde6c6', 'stadium', '#bfe49c', 'pitch', '#b7e29a', 'playground', '#d6efa8', 'track', '#f3c9a4', 'zoo', '#cfe8a6', 'theme_park', '#f6d4e4', '#f4e6cf'], 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0, 10, 0.88] } }),
      omt('park', 'fill', 'park', { paint: { 'fill-color': ['match', ['get', 'class'], 'national_park', '#b9e19a', 'nature_reserve', '#b9e19a', 'protected_area', '#c3e3a5', '#acdd8a'], 'fill-opacity': ['match', ['get', 'class'], 'national_park', 0.45, 'nature_reserve', 0.5, 'protected_area', 0.4, 0.92] } }),
      omt('park-edge', 'line', 'park', { minzoom: 12, paint: { 'line-color': '#8cc773', 'line-width': 1.2, 'line-opacity': 0.8 } }),
      omt('water', 'fill', 'water', { paint: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 3, '#79cfd6', 12, '#82d6d8'] } }),
      // reflet : un liseré clair juste à l'intérieur de la rive, puis la rive turquoise plus soutenue
      omt('water-shine', 'line', 'water', { minzoom: 9, paint: { 'line-color': '#c6f2ec', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 16, 5], 'line-offset': ['interpolate', ['linear'], ['zoom'], 9, 1, 16, 4], 'line-blur': 1.5, 'line-opacity': 0.75 } }),
      omt('water-edge', 'line', 'water', { paint: { 'line-color': '#4fb8c4', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 14, 1.6] } }),
      omt('waterway', 'line', 'waterway', { layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#6ccbd3', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 16, ['match', ['get', 'class'], 'river', 7, 3]] } }),
      omt('b-admin4', 'line', 'boundary', { filter: ['==', ['get', 'admin_level'], 4], minzoom: 4, paint: { 'line-color': '#cbb08a', 'line-width': 1, 'line-dasharray': [2, 2] } }),
      omt('b-admin2', 'line', 'boundary', { filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': '#b08a5e', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 10, 2.4], 'line-dasharray': [3, 2] } }),
      omt('rd-path', 'line', 'transportation', { minzoom: 13, filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]], paint: { 'line-color': '#c49a6c', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 18, 2.6], 'line-dasharray': [1.6, 1.4] } }),
      omt('rd-minor-c', 'line', 'transportation', { minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#eacd9c', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 2, 18, 18] } }),
      omt('rd-rail', 'line', 'transportation', { minzoom: 8, filter: ['==', ['get', 'class'], 'rail'], paint: { 'line-color': '#b9a39b', 'line-width': 1.3, 'line-dasharray': [3, 3] } }),
      omt('rd-main-c', 'line', 'transportation', { minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'trunk']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e4b071', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.8, 18, 22] } }),
      omt('rd-mw-c', 'line', 'transportation', { minzoom: 4, filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e2955f', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 4, 1, 18, 26] } }),
      omt('rd-minor', 'line', 'transportation', { minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fffaf0', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1, 18, 15] } }),
      omt('rd-main', 'line', 'transportation', { minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'trunk']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff0c6', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.4, 18, 18] } }),
      omt('rd-mw', 'line', 'transportation', { minzoom: 4, filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffd99c', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 4, 0.6, 18, 21] } }),
      // bâtiments : murs crème (fenêtres éclairées la nuit) + une fine dalle de toit colorée par-dessus
      omt('building', 'fill-extrusion', 'building', { minzoom: 14, paint: { 'fill-extrusion-color': cvWallExpr(CV_WALL), 'fill-extrusion-height': zH(cvBH), 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 1 } }),
      omt('building-roof', 'fill-extrusion', 'building', { minzoom: 14, paint: { 'fill-extrusion-color': roof, 'fill-extrusion-base': zH(cvBH), 'fill-extrusion-height': zH(['+', cvBH, ['max', 1.2, ['*', cvBH, 0.07]]]), 'fill-extrusion-opacity': 1 } }),
      omt('poi-hit', 'circle', 'poi', { minzoom: 12, paint: { 'circle-radius': 4, 'circle-opacity': 0 } }),
      omt('rd-name', 'symbol', 'transportation_name', { minzoom: 14, layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': F, 'text-size': 12 }, paint: Object.assign({ 'text-color': '#7a5a40' }, H(1.8)) }),
      omt('water-name', 'symbol', 'water_name', { layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': FI, 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 12, 10, 16], 'text-letter-spacing': 0.1 }, paint: { 'text-color': '#24808f', 'text-halo-color': '#d6f6f2', 'text-halo-width': 1.6, 'text-halo-blur': 0.5 } }),
      omt('peak', 'symbol', 'mountain_peak', { minzoom: 10, layout: { 'text-field': ['concat', '▲ ', ['get', 'name']], 'text-font': FB, 'text-size': 11, 'text-anchor': 'top' }, paint: Object.assign({ 'text-color': '#8a6650' }, H(1.6)) }),
      omt('place-small', 'symbol', 'place', { minzoom: 10, filter: ['in', ['get', 'class'], ['literal', ['village', 'suburb', 'hamlet', 'neighbourhood', 'quarter']]], layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': FB, 'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 16, 14] }, paint: Object.assign({ 'text-color': '#7a5640' }, H(1.8)) }),
      omt('place-town', 'symbol', 'place', { minzoom: 7, filter: ['==', ['get', 'class'], 'town'], layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': FB, 'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 14, 16] }, paint: Object.assign({ 'text-color': ink }, H(2)) }),
      omt('place-city', 'symbol', 'place', { minzoom: 3, filter: ['==', ['get', 'class'], 'city'], layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': FB, 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 12, 12, 21] }, paint: Object.assign({ 'text-color': '#4a3020' }, H(2.4)) }),
      omt('place-country', 'symbol', 'place', { maxzoom: 7, filter: ['==', ['get', 'class'], 'country'], layout: { 'text-field': ['upcase', ['coalesce', ['get', 'name:fr'], ['get', 'name']]], 'text-font': FB, 'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 6, 16], 'text-letter-spacing': 0.2 }, paint: Object.assign({ 'text-color': '#a5805a' }, H(1.6)) }),
    ],
  };
}
function localStyle() {
  const ml = list => ({ type: 'MultiLineString', coordinates: list });
  const fc = feats => ({ type: 'FeatureCollection', features: feats });
  const lakes = GEO.l.map(([name, rank, arr]) => ({ type: 'Feature', properties: { rank }, geometry: { type: 'Polygon', coordinates: [decLine(arr)] } }));
  const rivers = GEO.r.map(([name, rank, arr]) => ({ type: 'Feature', properties: { rank }, geometry: { type: 'LineString', coordinates: decLine(arr) } }));
  const roads = GEO.rd.map(([maj, rank, arr]) => ({ type: 'Feature', properties: { maj: maj || rank <= 4 ? 1 : 0 }, geometry: { type: 'LineString', coordinates: decLine(arr) } }));
  const countries = landFeatures.map(f => ({ type: 'Feature', properties: { fill: f.properties.fill }, geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates.map(p => p.map(r => r.slice().reverse())) } }));
  return {
    version: 8,
    sources: {
      c: { type: 'geojson', data: fc(countries) }, l: { type: 'geojson', data: fc(lakes) }, r: { type: 'geojson', data: fc(rivers) },
      town: { type: 'geojson', data: fc([]) },
      rd: { type: 'geojson', data: fc(roads) }, a: { type: 'geojson', data: { type: 'Feature', geometry: ml(GEO.a.map(decLine)) } },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#7fd0d6' } },
      { id: 'coast-halo', type: 'line', source: 'c', paint: { 'line-color': '#b4ece6', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 3, 8, 16], 'line-blur': 3 } },
      { id: 'coast-shine', type: 'line', source: 'c', minzoom: 3, paint: { 'line-color': '#e2fbf5', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 10, 3], 'line-blur': 1, 'line-opacity': 0.8 } },
      { id: 'land', type: 'fill', source: 'c', paint: { 'fill-color': ['get', 'fill'] } },
      { id: 'admin', type: 'line', source: 'a', minzoom: 3.5, paint: { 'line-color': '#c9b48e', 'line-width': 0.8, 'line-dasharray': [2, 2] } },
      { id: 'border', type: 'line', source: 'c', paint: { 'line-color': '#a5845e', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.6, 8, 1.6], 'line-dasharray': [3, 2] } },
      { id: 'riv', type: 'line', source: 'r', filter: ['<=', ['get', 'rank'], ['step', ['zoom'], 4, 3, 6, 5, 8, 7, 10]], paint: { 'line-color': '#62c4cf', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 9, 2.6, 14, 6] }, layout: { 'line-cap': 'round', 'line-join': 'round' } },
      { id: 'lake', type: 'fill', source: 'l', paint: { 'fill-color': '#7fd0d6', 'fill-outline-color': '#4fb8c4' } },
      { id: 'town-field', type: 'fill', source: 'town', minzoom: 11.5, filter: ['in', ['get', 'kind'], ['literal', ['field', 'wood']]], paint: { 'fill-color': ['get', 'fc'], 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 11.5, 0, 12.5, 0.9] } },
      { id: 'town-fill', type: 'fill', source: 'town', minzoom: 9.5, filter: ['==', ['get', 'kind'], 'town'], paint: { 'fill-color': '#f8e4cc', 'fill-outline-color': '#e6c9a2', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9.5, 0, 10.5, 0.85] } },
      { id: 'town-road-c', type: 'line', source: 'town', minzoom: 10.5, filter: ['in', ['get', 'kind'], ['literal', ['main', 'road']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#e4b071', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10.5, 2, 15, 16] } },
      { id: 'town-street-c', type: 'line', source: 'town', minzoom: 12.2, filter: ['==', ['get', 'kind'], 'street'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#eacd9c', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12.2, 1.8, 16, 16] } },
      { id: 'town-street', type: 'line', source: 'town', minzoom: 12.2, filter: ['==', ['get', 'kind'], 'street'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#fffaf0', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12.2, 1, 16, 12] } },
      { id: 'town-road', type: 'line', source: 'town', minzoom: 10.5, filter: ['in', ['get', 'kind'], ['literal', ['main', 'road']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#fff0c6', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10.5, 1, 15, 12] } },
      { id: 'town-park', type: 'fill', source: 'town', filter: ['==', ['get', 'kind'], 'park'], paint: { 'fill-color': '#acdd8a', 'fill-outline-color': '#8cc773' } },
      { id: 'town-3d', type: 'fill-extrusion', source: 'town', minzoom: 14, filter: ['in', ['get', 'kind'], ['literal', ['bldg', 'tree']]], paint: { 'fill-extrusion-color': ['get', 'c'], 'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.6, ['get', 'h']], 'fill-extrusion-base': ['case', ['==', ['get', 'kind'], 'tree'], 2, 0], 'fill-extrusion-opacity': 1 } },
      { id: 'town-roof', type: 'fill-extrusion', source: 'town', minzoom: 14, filter: ['==', ['get', 'kind'], 'bldg'], paint: { 'fill-extrusion-color': ['coalesce', ['get', 'rc'], '#e8917a'], 'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.6, ['get', 'h']], 'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.6, ['+', ['get', 'h'], 1.4]], 'fill-extrusion-opacity': 1 } },
      { id: 'rd-c', type: 'line', source: 'rd', minzoom: 4.5, filter: ['==', ['get', 'maj'], 1], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e4b071', 'line-width': ['interpolate', ['linear'], ['zoom'], 4.5, 1.2, 9, 4.4] } },
      { id: 'rd', type: 'line', source: 'rd', minzoom: 4.5, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['case', ['==', ['get', 'maj'], 1], '#fff0c6', '#fffaf0'], 'line-width': ['interpolate', ['linear'], ['zoom'], 4.5, 0.6, 9, ['case', ['==', ['get', 'maj'], 1], 2.6, 1.6]] } },
    ],
  };
}
function routeLayers() {
  map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'route-shadow', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff8ea', 'line-width': 7, 'line-opacity': 0.8 } });
  map.addLayer({ id: 'route', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': ['get', 'w'], 'line-dasharray': [0.1, 2] } });
}
// --- décor vivant : motifs (vaguelettes, arbres et fleurs, sillons), nuages, ambiance selon l'heure réelle
const cvReduce = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function cvPattern(w, h, draw) {
  const pr = 2, cv = document.createElement('canvas'); cv.width = w * pr; cv.height = h * pr;
  const g = cv.getContext('2d'); g.scale(pr, pr); g.lineCap = 'round'; draw(g);
  return { img: g.getImageData(0, 0, w * pr, h * pr), opt: { pixelRatio: pr } };
}
const cvTree = (g, x, y, r, c1, c2) => { g.fillStyle = 'rgba(70,90,60,.18)'; g.beginPath(); g.ellipse(x + 1, y + r * 0.9, r * 0.9, r * 0.35, 0, 0, 7); g.fill(); g.fillStyle = c1; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.45, 0, 7); g.fill(); };
const cvFlower = (g, x, y, c) => { g.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i * 1.2566; g.beginPath(); g.arc(x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6, 1.2, 0, 7); g.fill(); } g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); };
function cvImages() {
  const add = (id, p) => { if (!map.hasImage(id)) map.addImage(id, p.img, p.opt); };
  add('cv-wave', cvPattern(56, 36, g => { g.strokeStyle = 'rgba(236,253,250,.85)'; g.lineWidth = 1.3; [[8, 10], [34, 27]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 3, x + 6, y); g.quadraticCurveTo(x + 9, y + 3, x + 12, y); g.stroke(); }); }));
  add('cv-park', cvPattern(72, 72, g => { cvTree(g, 16, 18, 5.5, '#6fb06a', '#8fd07f'); cvTree(g, 52, 50, 4.5, '#5fa266', '#86c879'); cvFlower(g, 46, 16, '#f49ab4'); cvFlower(g, 20, 54, '#f7c95e'); cvFlower(g, 60, 30, '#b9a3f0'); }));
  add('cv-wood', cvPattern(44, 44, g => { cvTree(g, 11, 12, 4.5, 'rgba(70,140,80,.75)', 'rgba(140,200,120,.7)'); cvTree(g, 33, 32, 4, 'rgba(60,128,74,.75)', 'rgba(130,192,112,.7)'); }));
  add('cv-field', cvPattern(24, 24, g => { g.strokeStyle = 'rgba(196,150,70,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-2, 26); g.lineTo(26, -2); g.moveTo(10, 26); g.lineTo(26, 10); g.moveTo(-2, 14); g.lineTo(14, -2); g.stroke(); }));
}
function cvLayer(def, before) { if (map.getLayer(def.id)) return; try { map.addLayer(def, before && map.getLayer(before) ? before : undefined); } catch (e) { console.warn('décor', def.id, e && e.message); } }
function mapDecorInit() {
  cvImages();
  const fadeIn = (z0, o) => ['interpolate', ['linear'], ['zoom'], z0, 0, z0 + 1, o];
  if (mapMode === 'tiles') {
    cvLayer({ id: 'lc-wood-tex', type: 'fill', source: 'omt', 'source-layer': 'landcover', minzoom: 11, filter: ['==', ['get', 'class'], 'wood'], paint: { 'fill-pattern': 'cv-wood', 'fill-opacity': fadeIn(11, 0.6) } }, 'hill');
    cvLayer({ id: 'lc-field-tex', type: 'fill', source: 'omt', 'source-layer': 'landcover', minzoom: 12, filter: ['==', ['get', 'class'], 'farmland'], paint: { 'fill-pattern': 'cv-field', 'fill-opacity': fadeIn(12, 0.8) } }, 'hill');
    cvLayer({ id: 'park-deco', type: 'fill', source: 'omt', 'source-layer': 'park', minzoom: 14.5, filter: ['!', ['in', ['get', 'class'], ['literal', ['national_park', 'nature_reserve', 'protected_area']]]], paint: { 'fill-pattern': 'cv-park', 'fill-opacity': fadeIn(14.5, 0.95) } }, 'park-edge');
    cvLayer({ id: 'water-wave', type: 'fill', source: 'omt', 'source-layer': 'water', minzoom: 11.5, paint: { 'fill-pattern': 'cv-wave', 'fill-opacity': fadeIn(11.5, 0.7) } }, 'water-shine');
  } else {
    cvLayer({ id: 'bg-wave', type: 'background', minzoom: 9, paint: { 'background-pattern': 'cv-wave', 'background-opacity': fadeIn(9, 0.6) } }, 'coast-halo');
    cvLayer({ id: 'lake-wave', type: 'fill', source: 'l', minzoom: 9, paint: { 'fill-pattern': 'cv-wave', 'fill-opacity': fadeIn(9, 0.6) } }, 'town-field');
    cvLayer({ id: 'town-wood-tex', type: 'fill', source: 'town', minzoom: 12.5, filter: ['==', ['get', 'kind'], 'wood'], paint: { 'fill-pattern': 'cv-wood', 'fill-opacity': fadeIn(12.5, 0.7) } }, 'town-fill');
    cvLayer({ id: 'town-field-tex', type: 'fill', source: 'town', minzoom: 12.5, filter: ['==', ['get', 'kind'], 'field'], paint: { 'fill-pattern': 'cv-field', 'fill-opacity': fadeIn(12.5, 0.8) } }, 'town-fill');
    cvLayer({ id: 'town-park-deco', type: 'fill', source: 'town', minzoom: 13.5, filter: ['==', ['get', 'kind'], 'park'], paint: { 'fill-pattern': 'cv-park', 'fill-opacity': fadeIn(13.5, 0.95) } }, 'town-3d');
  }
  cvAmbInit();
}
(function cvCSS() {
  const st = document.createElement('style');
  st.textContent = `#cvAmb{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#cvAmb .veil{position:absolute;inset:0;opacity:0;transition:opacity 1.6s ease;mix-blend-mode:multiply}
#cvAmb[data-ph="gold"] .veil{opacity:1;background:linear-gradient(180deg,rgba(255,176,128,.20),rgba(255,214,160,.08) 55%,rgba(250,180,176,.14))}
#cvAmb[data-ph="night"] .veil{opacity:1;background:radial-gradient(120% 90% at 50% 40%,rgba(118,124,196,.52),rgba(62,70,140,.66))}
#cvAmb .glow{position:absolute;inset:0;opacity:0;transition:opacity 1.6s;mix-blend-mode:screen;background:radial-gradient(60% 40% at 80% 0%,rgba(255,236,190,.35),transparent 70%)}
#cvAmb[data-ph="gold"] .glow{opacity:1}
#cvAmb[data-ph="night"] .glow{opacity:.5;background:radial-gradient(40% 30% at 82% 8%,rgba(200,215,255,.35),transparent 70%)}
#cvAmb .cld{position:absolute;left:0;translate:var(--ox,0) 0;width:150px;height:60px;opacity:0;transition:opacity 1.2s;animation:cvDrift var(--d) linear infinite;animation-delay:var(--dl);will-change:transform}
#cvAmb.far .cld{opacity:1}
#cvAmb:not(.far) .cld{animation-play-state:paused}
#cvAmb .cld i{position:absolute;border-radius:50%}
#cvAmb .cld .sh{inset:34px -10px -30px 30px;background:radial-gradient(closest-side,rgba(52,70,96,.16),rgba(52,70,96,0));border-radius:50%}
#cvAmb .cld .p1{left:18px;top:22px;width:110px;height:34px;background:rgba(255,255,255,.72)}
#cvAmb .cld .p2{left:40px;top:6px;width:52px;height:46px;background:rgba(255,255,255,.72)}
#cvAmb .cld .p3{left:78px;top:14px;width:40px;height:34px;background:rgba(255,255,255,.72)}
@keyframes cvDrift{from{transform:translateX(-200px) scale(var(--s))}to{transform:translateX(calc(100vw + 60px)) scale(var(--s))}}
@media (prefers-reduced-motion: reduce){#cvAmb .cld{display:none}#cvAmb .veil,#cvAmb .glow{transition:none}}`;
  document.head.appendChild(st);
})();
let cvForced = null, cvPhase = '', cvT = 0;
function cvSun(lat, lon, d) {
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), dec = 0.4093 * Math.sin(2 * Math.PI * (284 + doy) / 365);
  const c = Math.max(-1, Math.min(1, -Math.tan(lat * Math.PI / 180) * Math.tan(dec))), half = Math.acos(c) * 12 / Math.PI;
  const noon = 12 - d.getTimezoneOffset() / 60 - lon / 15; // midi solaire, en heure locale de l'appareil
  return [noon - half, noon + half];
}
function cvPhaseNow() {
  if (cvForced) return cvForced;
  const d = new Date(), h = homeObj(), [up, down] = cvSun(h.lat, h.lon, d), t = d.getHours() + d.getMinutes() / 60;
  if (t < up - 0.6 || t > down + 0.6) return 'night';
  if (t < up + 0.9 || t > down - 1.1) return 'gold';
  return 'day';
}
function cvAmbInit() {
  if ($('cvAmb')) return;
  const el = document.createElement('div'); el.id = 'cvAmb'; el.setAttribute('aria-hidden', 'true');
  let html = '<div class="veil"></div><div class="glow"></div>';
  [[14, 46, -10, 1], [38, 62, -40, 0.8], [62, 52, -25, 1.15], [82, 70, -55, 0.9]].forEach(([top, d, dl, s]) => { html += `<div class="cld" style="top:${top}%;--d:${d}s;--dl:${dl}s;--s:${s}"><i class="sh"></i><i class="p1"></i><i class="p2"></i><i class="p3"></i></div>`; });
  el.innerHTML = html;
  const cc = map.getCanvasContainer(), cv = map.getCanvas();
  cc.insertBefore(el, cv.nextSibling); // sous les marqueurs HTML et l'overlay #ov
  const upd = () => { el.classList.toggle('far', map.getZoom() < 9); };
  map.on('zoom', upd); upd();
  // les nuages suivent la carte quand on la fait glisser (ils ne restent plus collés à l'écran)
  let ox = 0, oy = 0, last = null;
  map.on('move', () => { const c = map.project(map.getCenter()), p = map.project([0, 0]); const cur = { x: p.x, y: p.y };
    if (last) { ox += cur.x - last.x; oy += cur.y - last.y; } last = cur;
    const W = window.innerWidth + 260, H = window.innerHeight;
    el.style.setProperty('--ox', (((ox % W) + W) % W - 130).toFixed(0) + 'px'); el.style.setProperty('--oy', (((oy % H) + H) % H - H / 2).toFixed(0) * 0 + 'px'); });
  map.on('zoomstart', () => { last = null; });
  cvAmbTick(); clearInterval(cvT); cvT = setInterval(cvAmbTick, 5 * 60 * 1000);
}
function cvAmbTick() {
  const el = $('cvAmb'); if (!el || !map) return;
  const ph = cvPhaseNow(); el.dataset.ph = ph;
  if (ph === cvPhase) return; cvPhase = ph;
  const night = ph === 'night';
  try {
    if (map.getLayer('building')) map.setPaintProperty('building', 'fill-extrusion-color', cvWallExpr(night ? CV_WALL_NIGHT : CV_WALL));
    if (map.getLayer('town-3d')) map.setPaintProperty('town-3d', 'fill-extrusion-color', night ? ['case', ['==', ['get', 'kind'], 'bldg'], ['coalesce', ['get', 'nc'], '#ffdf9a'], ['get', 'c']] : ['get', 'c']);
  } catch (e) { console.warn(e); }
}
// pour les tests et le débogage : __ambiance('night' | 'gold' | 'day' | null)
window.__ambiance = ph => { cvForced = ph || null; cvAmbTick(); return cvPhaseNow(); };
async function probeTiles() {
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch('https://tiles.openfreemap.org/planet', { signal: ctl.signal }); clearTimeout(tm);
    if (!r.ok) return false; const j = await r.json(); return !!(j && j.tiles);
  } catch (e) { return false; }
}
async function buildMap() {
  if (map) { map.resize(); return; }
  mapMode = (await probeTiles()) ? 'tiles' : 'local';
  const h = homeObj();
  map = new maplibregl.Map({
    container: 'mapBox', style: mapMode === 'tiles' ? tilesStyle() : localStyle(), center: [h.lon, h.lat], zoom: kToZoom(homeZoom()),
    minZoom: 1, maxZoom: mapMode === 'tiles' ? 18.5 : 15.5, dragRotate: true, pitchWithRotate: true, maxPitch: 65, attributionControl: mapMode === 'tiles' ? { compact: true } : false, renderWorldCopies: false,
  });
  window.__map = map;
  map.touchZoomRotate.disableRotation && 0;
  map.keyboard.disableRotation && map.keyboard.disableRotation();
  map.on('error', e => { if (mapMode === 'tiles' && !mapReady) { /* tuiles inaccessibles : on garde la carte intégrée */ } });
  map.on('load', () => { routeLayers(); try { mapDecorInit(); } catch (e) { console.error(e); } mapReady = true; if (typeof liveOnMapLoad === 'function') { try { liveOnMapLoad(); } catch (e) { console.error(e); } } try { poiLayerInit(); } catch (e) { console.error(e); } setTimeout(() => refreshPOIs(true), 50); const n = $('mapNote'); n.hidden = mapMode === 'tiles'; if (!n.hidden) setTimeout(() => n.classList.add('gone'), 9000); drawMarks(); });
  map.on('move', positionOverlay);
  map.on('zoomend', () => { if (typeof qtMapUpdate === 'function') { try { qtMapUpdate(); } catch (e) {} } });
  map.on('zoom', () => { lodOverlay(); });
  map.on('moveend', refreshPOIs);
  let autoTilt = true;
  map.on('zoomend', () => { const z = map.getZoom(); if (autoTilt && z >= 15 && map.getPitch() < 5) map.easeTo({ pitch: 52, duration: 700 }); if (z < 12.5 && map.getPitch() > 5) map.easeTo({ pitch: 0, bearing: 0, duration: 500 }); upd3D(); });
  map.on('pitchend', upd3D); map.on('rotateend', upd3D);
  window.toggle3D = () => { const tilted = map.getPitch() > 5; if (tilted) { autoTilt = false; map.easeTo({ pitch: 0, bearing: 0, duration: 600 }); } else { autoTilt = true; map.easeTo({ pitch: 55, zoom: Math.max(map.getZoom(), 15.2), duration: 900 }); } };
  let idleT = 0; map.on('idle', () => { if (mapMode === 'tiles' && Date.now() - idleT > 600) { idleT = Date.now(); refreshPOIs(); } });
  map.on('click', e => { if (e.originalEvent && e.originalEvent.target.closest && e.originalEvent.target.closest('.ovm')) return; const hp = poiAtPoint(e.point); if (hp) { choosePOI(hp); return; } const tp = typedPlaceAt(e); if (tp) { choosePOI(tp); return; } pickPoint(e.lngLat.lng, e.lngLat.lat); });
  buildOverlay();
}
function zoomTo(lon, lat, k) { if (!map) return; map.flyTo({ center: [lon, lat], zoom: k ? Math.min(map.getMaxZoom(), kToZoom(k)) : map.getZoom(), speed: 1.4, curve: 1.3, essential: true }); }
function zoomBy(f) { if (map) map.easeTo({ zoom: map.getZoom() + Math.log2(f), duration: 250 }); }
function applyLOD() {}
function upd3D() { const b = $('z3d'); if (b && map) { const on = map.getPitch() > 5; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); } }

// --- surcouche HTML (épingles, maison, compagnons, villes intégrées)
function pinHTML(p) {
  return `<div class="pinb" style="--pc:${TAGC[p.tags[0]]}"><svg viewBox="0 0 24 24" aria-hidden="true">${TAG_ICON[p.tags[0]] || ''}</svg></div><span class="pinl">${esc(p.name)}</span>`;
}
function buildOverlay() {
  const ov = $('ov'); ov.innerHTML = ''; ovEls = {};
  const add = (key, cls, html, lon, lat, data) => {
    const el = document.createElement('div'); el.className = 'ovm ' + cls; el.innerHTML = html;
    Object.entries(data || {}).forEach(([k, v]) => el.dataset[k] = v);
    ov.appendChild(el); ovEls[key] = { el, lon, lat }; return el;
  };
  if (mapMode === 'local' && geoLayers === null) geoLayers = { cities: GEO.p.map(([n, lon, lat, r, cap]) => ({ n, lon, lat, r, cap })).sort((a, b) => a.r - b.r || b.cap - a.cap) };
  cityEls = [];
  if (mapMode === 'local') for (const c of geoLayers.cities.slice(0, 900)) {
    const el = document.createElement('div'); el.className = 'ovc' + (c.cap ? ' cap' : ''); el.textContent = c.n; ov.appendChild(el); cityEls.push({ el, c });
  }
  for (const p of PLACES) add('p' + p.id, 'pin', pinHTML(p), p.lon, p.lat, { place: p.id });
  // v15 : plus d'épingles « lieu secret » : le trésor suivi a sa zone dorée (27_tresors.js, tzMapUpdate)
  add('home', 'home', `<div class="homeb"><svg viewBox="0 0 60 60"><path d="M40 6 v12 h6 V10Z" fill="#c9604f" stroke="#5b4636" stroke-width="2.4"/><path d="M8 54 V28 L30 10 L52 28 V54Z" fill="#fff6e6" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/><path d="M4 30 L30 8 L56 30" fill="none" stroke="#d9604f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><rect x="24" y="36" width="12" height="18" rx="2" fill="#c98a5a" stroke="#5b4636" stroke-width="2.4"/><rect x="12" y="32" width="9" height="9" fill="#bfe1f2" stroke="#5b4636" stroke-width="2"/><rect x="39" y="32" width="9" height="9" fill="#bfe1f2" stroke="#5b4636" stroke-width="2"/></svg></div><span class="pinl home">Chez vous</span>`, 0, 0, { home: 1 });
  add('drop', 'drop', `<svg viewBox="0 0 30 40"><path d="M15 39 C4 24 2 16 2 13 A13 13 0 0 1 28 13 C28 16 26 24 15 39Z" fill="#e0607e" stroke="#4a3528" stroke-width="2.4"/><circle cx="15" cy="13" r="5" fill="#fff"/></svg><span class="pinl"></span>`, 0, 0, {});
  // destination d'un voyage en cours (drapeau) et compagnon en route : créés à la demande pour chaque individu (compOverlay)
  buildPoiFilter();
  drawMarks();
}
const FLAG_COL = { panda: '#e0884a', capy: '#c99a6a', axo: '#f08aa6', renard: '#9fc3e0', fennec: '#e3b06b', tanuki: '#a8826a', paresseux: '#b39a7a', lemur: '#9a9aa8', phoque: '#8fb0c8', quokka: '#c9a07a' };
function compOverlay(k) {
  if (ovEls['w' + k] || !CHARS[k]) return;
  const ov = $('ov'); if (!ov) return;
  const mk = (key, cls, html) => { const el = document.createElement('div'); el.className = 'ovm ' + cls; el.innerHTML = html; el.dataset.comp = k; el.hidden = true; ov.appendChild(el); ovEls[key] = { el, lon: 0, lat: 0 }; };
  mk('t' + k, 'tdest', `<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M7 38 V4" stroke="#4a3528" stroke-width="3" stroke-linecap="round"/><path d="M8 5 C14 2 18 9 27 5 V19 C18 23 14 16 8 19Z" fill="${FLAG_COL[typeof spOf === 'function' ? spOf(k) : k] || '#d9604f'}" stroke="#4a3528" stroke-width="2.2" stroke-linejoin="round"/></svg><span class="pinl"></span>`);
  mk('w' + k, 'walker', `<div class="wkb"><img alt="" src="${portraitURI(k)}"></div><i class="wkbang">!</i><span class="wkl"></span>`);
}
const ovComps = () => Object.keys(S.comps || {}).filter(k => CHARS[k]);
function positionOverlay() {
  if (!map) return;
  const W = map.getContainer().clientWidth, H = map.getContainer().clientHeight;
  for (const o of Object.values(ovEls)) {
    if (o.el.hidden) continue;
    const p = map.project([o.lon, o.lat]);
    const vis = p.x > -60 && p.y > -60 && p.x < W + 60 && p.y < H + 60;
    o.el.style.display = vis ? '' : 'none';
    if (vis) o.el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
  }
  if (cityEls.length) placeCities(W, H);
}
function placeCities(W, H) {
  const z = map.getZoom(), maxR = z < 3 ? 1 : z < 4 ? 2 : z < 5 ? 4 : z < 6 ? 6 : z < 7 ? 7 : z < 7.6 ? 8 : 10;
  const occ = new Set(), key = (x, y) => `${Math.floor(x / 90)},${Math.floor(y / 22)}`;
  for (const o of Object.values(ovEls)) if (!o.el.hidden && o.el.style.display !== 'none') { const p = map.project([o.lon, o.lat]); occ.add(key(p.x, p.y)); occ.add(key(p.x, p.y + 20)); }
  for (const { el, c } of cityEls) {
    let show = c.r <= maxR;
    let p;
    if (show) { p = map.project([c.lon, c.lat]); show = p.x > 0 && p.y > 0 && p.x < W && p.y < H; }
    if (show) { const k = key(p.x, p.y); if (occ.has(k) || occ.has(key(p.x + 60, p.y))) show = false; else { occ.add(k); occ.add(key(p.x + 60, p.y)); } }
    el.style.display = show ? '' : 'none';
    if (show) el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
  }
}
function lodOverlay() {
  if (!map) return;
  const z = map.getZoom();
  $('ov').dataset.z = z < 4 ? 'far' : z < 6.5 ? 'mid' : z < 10.5 ? 'near' : z < (mapMode === 'tiles' ? 16 : 13.6) ? 'city' : 'street';
  // le bouton « lieux affichés » n'apparaît que lorsque des lieux du quotidien sont à l'écran
  const fb = $('zFilt'), show = z >= (mapMode === 'tiles' ? 12.5 : 10.5);
  if (fb && fb.hidden === show) { fb.hidden = !show; if (!show) poiFiltOpen(false); }
}
function suggestions() {
  seed(dayKey() * 3 + S.home.length * 97);
  const h = homeObj();
  const withD = PLACES.filter(p => p.name !== S.home).map(p => ({ p, d: kmBetween(h, p) }));
  const pickFrom = arr => arr.length ? arr[Math.floor(srand() * arr.length)].p : null;
  return [pickFrom(withD.filter(x => x.d < 350)), pickFrom(withD.filter(x => x.d >= 350 && x.d < 1800)), pickFrom(withD.filter(x => x.d >= 1800))].filter(Boolean);
}
function arcCoords(a, b, n = 64) { const it = d3.geoInterpolate([a.lon, a.lat], [b.lon, b.lat]); return d3.range(n + 1).map(i => it(i / n)); }
function drawMarks() {
  if (!map || !Object.keys(ovEls).length) return;
  const sug = suggestions().map(p => p.id), h = homeObj();
  for (const p of PLACES) {
    const o = ovEls['p' + p.id]; if (!o) continue;
    o.el.hidden = p.name === S.home;
    o.el.classList.toggle('sug', sug.includes(p.id));
    o.el.classList.toggle('dest', !!(plan.dest && plan.dest.id === p.id));
    o.el.classList.toggle('found', !!S.found[p.name]);
  }
  Object.assign(ovEls.home, { lon: h.lon, lat: h.lat });
  const d = ovEls.drop;
  if (plan.dest && plan.dest.id == null) { d.el.hidden = false; d.lon = plan.dest.lon; d.lat = plan.dest.lat; d.el.querySelector('.pinl').textContent = plan.dest.name; } else d.el.hidden = true;
  for (const k of ovComps()) {
    compOverlay(k);
    const o = ovEls['w' + k], t = S.trips[k]; if (!o) continue;
    o.el.hidden = !t;
    if (t) { o.el.classList.toggle('cur', k === S.sel); o.el.classList.toggle('done', !!t.done); const img = o.el.querySelector('img'), u = portraitURI(k); if (img.getAttribute('src') !== u) img.setAttribute('src', u); const pos = tripPos(t); o.lon = pos[0]; o.lat = pos[1]; walkerLabel(o.el, k, t); }
    const td = ovEls['t' + k];
    if (td) { const show = !!(t && !t.done && t.dest.id == null); td.el.hidden = !show; if (show) { td.lon = t.dest.lon; td.lat = t.dest.lat; const l = td.el.querySelector('.pinl'); if (l.textContent !== t.dest.name) l.textContent = t.dest.name; } }
  }
  if (mapReady && map.getSource('routes')) {
    const feats = [];
    for (const [k, t] of Object.entries(S.trips)) if (t && t.from && t.dest) feats.push({ type: 'Feature', properties: { c: k === S.sel ? '#d9604f' : '#b88a6a', w: k === S.sel ? 4.5 : 3 }, geometry: { type: 'LineString', coordinates: arcCoords(t.from, t.dest) } });
    if (plan.dest && !S.trips[S.sel]) feats.push({ type: 'Feature', properties: { c: '#2f7f6c', w: 4.5 }, geometry: { type: 'LineString', coordinates: arcCoords(h, plan.dest) } });
    map.getSource('routes').setData({ type: 'FeatureCollection', features: feats });
  }
  if (typeof qtMapUpdate === 'function') { try { qtMapUpdate(); } catch (e) { console.error(e); } } // épingles « besoin » (38_quetes.js)
  lodOverlay(); positionOverlay();
  if (typeof poiStateCheck === 'function') poiStateCheck();
}
function updateWalkers() {
  for (const k of ovComps()) { const o = ovEls['w' + k], t = S.trips[k]; if (o && t) { const pos = tripPos(t); o.lon = pos[0]; o.lat = pos[1]; walkerLabel(o.el, k, t); } }
  positionOverlay();
}
// étiquette sous le portrait d'un compagnon en route : « Pistache · 63 % »
function walkerLabel(el, k, t) {
  const l = el.querySelector('.wkl'); if (!l) return;
  const pend = t.journal.some(j => j.pending && !j.resolved);
  const txt = t.done ? `${CHARS[k].name} est rentré !` : `${CHARS[k].name} · ${Math.min(99, Math.floor(t.elapsed / t.total * 100))} %`;
  if (l.textContent !== txt) l.textContent = txt;
  el.classList.toggle('ask', pend && !t.done);
}
function starPath(x, y, r) { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); } return p + 'Z'; }
const portraitCache = {};
function portraitURI(k, mood = 'content') {
  if (!CHARS[k]) return '';
  const key = k + mood + JSON.stringify(S.outfits[k]);
  if (!portraitCache[key]) portraitCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawChar(k, S.outfits[k], mood, 'u' + k).replace('<svg ', '<svg width="320" height="350" '));
  return portraitCache[key];
}
$('ov').addEventListener('click', ev => {
  const m = ev.target.closest('.ovm'); if (!m) return;
  ev.stopPropagation();
  if (m.dataset.need) { if (typeof qtPinTap === 'function') qtPinTap(m, ev); return; }
  if (m.dataset.poi) { const o = ovEls['q' + m.dataset.poi]; if (o) choosePOI(o.poi); return; }
  if (m.dataset.comp) { selectComp(m.dataset.comp); openSheet('voyage'); return; }
  if (m.dataset.place) { choosePlace(PLACES[+m.dataset.place]); return; }
  if (m.dataset.home) { openSheet('maison'); }
});
function pickPoint(lon, lat) {
  if (S.trips[S.sel]) { openSheet('voyage'); return; }
  let best = null, bd = 1e9;
  for (const p of PLACES) { const d = kmBetween({ lat, lon }, p); if (d < bd) { bd = d; best = p; } }
  const z = map ? map.getZoom() : 5, snapKm = 900 / Math.pow(2, z - 2);
  if (best && bd < snapKm) return choosePlace(best);
  const land = isLand(lon, lat);
  let tags, name;
  if (!land) { tags = ['mer']; name = 'En pleine mer'; }
  else if (best && bd < 220) { tags = best.tags.filter(t => t !== 'ville' && t !== 'monument'); if (!tags.length) tags = ['campagne']; name = `Près de ${best.name}`; }
  else if (Math.abs(lat) > 60) { tags = ['neige', 'foret']; name = 'Terres du grand Nord'; }
  else if (lat > 14 && lat < 33 && lon > -17 && lon < 55) { tags = ['desert']; name = 'Au cœur du désert'; }
  else { tags = [pick(['foret', 'campagne', 'montagne']), 'campagne']; name = 'Coin sauvage'; }
  plan.dest = { id: null, name, country: '', lat, lon, tags: [...new Set(tags)], special: null };
  openSheet('voyage'); drawMarks();
}
function choosePlace(p) { if (S.trips[S.sel]) { openSheet('voyage'); return; } plan.dest = p; openSheet('voyage'); drawMarks(); }

// ================= FILTRE DES LIEUX (v14) : un petit bouton dans la colonne de la carte =================
(function poiFiltCSS() {
  const st = document.createElement('style'); st.id = 'poiFiltCSS';
  st.textContent = `
#zFilt{position:relative}
#zFilt svg{width:24px;height:24px}
#zFilt[aria-expanded="true"]{background:#ffe9a8}
#zFilt i{position:absolute;right:-5px;top:-5px;width:13px;height:13px;border-radius:50%;background:var(--fc,#f2b52e);border:2px solid var(--ink);display:none}
#zFilt.on i{display:block}
#poiFilt{position:absolute;right:calc(100% + 10px);top:0;width:218px;background:var(--paper);border:2.5px solid var(--ink);border-radius:16px;box-shadow:0 4px 0 rgba(74,53,40,.4);padding:6px;display:flex;flex-direction:column;gap:2px;animation:pfin .16s ease-out}
#poiFilt[hidden]{display:none}
@keyframes pfin{from{opacity:0;transform:translateX(6px)}}
#poiFilt h4{margin:2px 6px 4px;font:800 12px var(--display);color:var(--ink2);letter-spacing:.04em;text-transform:uppercase}
#poiFilt button{display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;border-radius:11px;padding:5px 6px;cursor:pointer;text-align:left;color:var(--ink);font-family:var(--body)}
#poiFilt button:hover{background:rgba(242,193,78,.18)}
#poiFilt button[aria-checked="true"]{background:#fff3c4;box-shadow:inset 0 0 0 2px var(--ink)}
#poiFilt .pfi{width:28px;height:28px;flex:none;border-radius:50%;background:var(--pc);border:2px solid #fffaf0;box-shadow:0 0 0 1px rgba(74,53,40,.5),0 1.5px 2px rgba(74,53,40,.35);display:flex;align-items:center;justify-content:center}
#poiFilt .pfi svg{width:16px;height:16px}
#poiFilt .pft{display:flex;flex-direction:column;min-width:0}
#poiFilt .pft b{font:800 14px/1.15 var(--display)}
#poiFilt .pft small{font:600 11.5px/1.2 var(--body);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
.poitip{pointer-events:none!important;margin:-11px 0 0 15px;white-space:nowrap;background:#fff8ea;border:2px solid #4a3528;border-radius:8px;padding:0 7px;font:700 12px/18px var(--display);color:#4a3528;box-shadow:0 2px 0 rgba(74,53,40,.3);z-index:1}
@media (max-width:420px){#poiFilt{width:200px}}
`;
  document.head.appendChild(st);
})();
const POI_FILT_LOOK = {
  utile: ['#f2b52e', '<path d="M12 2.5 L14.6 9 L21.5 9.5 L16.2 13.9 L17.9 20.8 L12 17 L6.1 20.8 L7.8 13.9 L2.5 9.5 L9.4 9Z" fill="#fff"/>'],
  tout: ['#8a7464', '<circle cx="7" cy="7" r="2.6" fill="#fff"/><circle cx="17" cy="7" r="2.6" fill="#fff"/><circle cx="7" cy="17" r="2.6" fill="#fff"/><circle cx="17" cy="17" r="2.6" fill="#fff"/>'],
  nourriture: [POI_CATS.restaurant[1], POI_GLYPH.fork],
  nature: [POI_CATS.parc[1], POI_GLYPH.tree],
  boutiques: [POI_CATS.boutique[1], POI_GLYPH.bag],
  culture: [POI_CATS.musee[1], POI_GLYPH.museum],
};
function buildPoiFilter() {
  const col = document.querySelector('.zoom'); if (!col || $('zFilt')) return;
  const b = document.createElement('button'); b.className = 'icon-btn'; b.id = 'zFilt'; b.hidden = true;
  b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false');
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L21.5 8 L12 13 L2.5 8Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4.5 12.2 L2.5 13.3 L12 18.3 L21.5 13.3 L19.5 12.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="12" cy="8" r="1.8" fill="#e0607e"/></svg><i></i>';
  col.insertBefore(b, col.firstChild);
  const pop = document.createElement('div'); pop.id = 'poiFilt'; pop.hidden = true; pop.setAttribute('role', 'menu'); pop.setAttribute('aria-label', 'Lieux affichés');
  col.appendChild(pop);
  renderPoiFilter();
}
function renderPoiFilter() {
  const b = $('zFilt'), pop = $('poiFilt'); if (!b || !pop) return;
  const cur = poiFilter(), lab = (POI_FILTERS.find(f => f[0] === cur) || POI_FILTERS[0])[1];
  b.setAttribute('aria-label', `Lieux affichés : ${lab}`); b.title = `Lieux affichés : ${lab}`;
  b.classList.toggle('on', cur !== 'utile'); b.style.setProperty('--fc', (POI_FILT_LOOK[cur] || POI_FILT_LOOK.utile)[0]);
  if (pop.hidden) return;
  let useTxt = 'Commandes, rêves, événement du jour';
  try { const u = [...poiUsefulNow(true).cats].map(c => POI_CATS[c][0]); if (u.length) useTxt = u.slice(0, 3).join(', ') + (u.length > 3 ? '…' : ''); } catch (e) {}
  const sub = { utile: useTxt, tout: 'Tous les lieux, sans chevauchement' };
  pop.innerHTML = '<h4>Lieux affichés</h4>' + POI_FILTERS.map(([id, label]) => { const [c, g] = POI_FILT_LOOK[id]; return `<button role="menuitemradio" aria-checked="${id === cur}" data-pf="${id}"><span class="pfi" style="--pc:${c}"><svg viewBox="0 0 24 24" aria-hidden="true">${g}</svg></span><span class="pft"><b>${esc(label)}</b>${sub[id] ? `<small>${esc(sub[id])}</small>` : ''}</span></button>`; }).join('');
}
function poiFiltOpen(on) {
  const b = $('zFilt'), pop = $('poiFilt'); if (!b || !pop) return;
  if (pop.hidden === !on) return;
  pop.hidden = !on; b.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (on) renderPoiFilter();
}
document.addEventListener('click', ev => {
  const t = ev.target;
  if (t.closest && t.closest('#zFilt')) { poiFiltOpen($('poiFilt').hidden); return; }
  const o = t.closest && t.closest('[data-pf]');
  if (o) { setPoiFilter(o.dataset.pf); poiFiltOpen(false); return; }
  if ($('poiFilt') && !$('poiFilt').hidden && !(t.closest && t.closest('#poiFilt'))) poiFiltOpen(false);
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') poiFiltOpen(false); });

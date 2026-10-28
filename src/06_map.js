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
const LAND_PAL = ['#f4e4b8', '#e9e3b0', '#efd9b4', '#e3e6b8', '#f2dcc0', '#e8dfb6', '#f6e8c6', '#e2dcb2'];
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
function tilesStyle() {
  const F = ['Noto Sans Regular'], FB = ['Noto Sans Bold'], FI = ['Noto Sans Italic'];
  const ink = '#4a3528', halo = '#fff8ea';
  return {
    version: 8, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f5ead0' } },
      { id: 'lc', type: 'fill', source: 'omt', 'source-layer': 'landcover', paint: { 'fill-color': ['match', ['get', 'class'], 'wood', '#cfe3b0', 'grass', '#dcebbd', 'farmland', '#efe7c0', 'ice', '#f6fafc', 'sand', '#f3dfb2', 'wetland', '#d6e8cf', 'rock', '#e4ddcc', '#e6e9c4'], 'fill-opacity': 0.9 } },
      { id: 'lu', type: 'fill', source: 'omt', 'source-layer': 'landuse', minzoom: 9, paint: { 'fill-color': ['match', ['get', 'class'], 'residential', '#f2e3cb', 'commercial', '#f3dcc8', 'industrial', '#ece0d2', 'cemetery', '#d9e6c6', 'school', '#f6e2cc', 'stadium', '#d9ebc0', 'pitch', '#cde6b4', '#efe4cc'], 'fill-opacity': 0.85 } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#c6e2a3', 'fill-opacity': 0.8 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#9fd1d8' } },
      { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': '#7cbccb', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 14, 1.6] } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': '#86c4d3', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 16, 3] } },
      { id: 'building', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#f2e2c8', 30, '#ead2b4', 80, '#dcc4a8'], 'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15, ['coalesce', ['get', 'render_height'], 8]], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.92 } },
      { id: 'b-admin4', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['==', ['get', 'admin_level'], 4], minzoom: 4, paint: { 'line-color': '#c7b18c', 'line-width': 1, 'line-dasharray': [2, 2] } },
      { id: 'b-admin2', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': '#a68b62', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 10, 2.4], 'line-dasharray': [3, 2] } },
      { id: 'rd-minor-c', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e1cfa8', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 2, 18, 18] } },
      { id: 'rd-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fffaf0', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1, 18, 15] } },
      { id: 'rd-path', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 14, filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]], paint: { 'line-color': '#b8946a', 'line-width': 1.4, 'line-dasharray': [2, 2] } },
      { id: 'rd-rail', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 8, filter: ['==', ['get', 'class'], 'rail'], paint: { 'line-color': '#b5a595', 'line-width': 1.2, 'line-dasharray': [3, 3] } },
      { id: 'rd-main-c', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'trunk']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#d9b77a', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.8, 18, 22] } },
      { id: 'rd-main', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'trunk']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffe9b0', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 0.4, 18, 18] } },
      { id: 'rd-mw-c', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 4, filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#c98f3e', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 4, 1, 18, 26] } },
      { id: 'rd-mw', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 4, filter: ['==', ['get', 'class'], 'motorway'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f6c86b', 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 4, 0.6, 18, 21] } },
      { id: 'poi-hit', type: 'circle', source: 'omt', 'source-layer': 'poi', minzoom: 13, paint: { 'circle-radius': 4, 'circle-opacity': 0 } },
      { id: 'rd-name', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14, layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': F, 'text-size': 12 }, paint: { 'text-color': '#6b5440', 'text-halo-color': halo, 'text-halo-width': 1.6 } },
      { id: 'water-name', type: 'symbol', source: 'omt', 'source-layer': 'water_name', layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': FI, 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 12, 10, 16], 'text-letter-spacing': 0.1 }, paint: { 'text-color': '#3f7f96', 'text-halo-color': '#cdeef2', 'text-halo-width': 1.5 } },
      { id: 'peak', type: 'symbol', source: 'omt', 'source-layer': 'mountain_peak', minzoom: 10, layout: { 'text-field': ['concat', '▲ ', ['get', 'name']], 'text-font': F, 'text-size': 11, 'text-anchor': 'top' }, paint: { 'text-color': '#7a6450', 'text-halo-color': halo, 'text-halo-width': 1.4 } },
      { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 10, filter: ['in', ['get', 'class'], ['literal', ['village', 'suburb', 'hamlet', 'neighbourhood', 'quarter']]], layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': F, 'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 16, 14] }, paint: { 'text-color': '#5b4636', 'text-halo-color': halo, 'text-halo-width': 1.6 } },
      { id: 'place-town', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 7, filter: ['==', ['get', 'class'], 'town'], layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': F, 'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 14, 16] }, paint: { 'text-color': ink, 'text-halo-color': halo, 'text-halo-width': 1.8 } },
      { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 3, filter: ['==', ['get', 'class'], 'city'], layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': FB, 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 12, 19] }, paint: { 'text-color': ink, 'text-halo-color': halo, 'text-halo-width': 2 } },
      { id: 'place-country', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 7, filter: ['==', ['get', 'class'], 'country'], layout: { 'text-field': ['upcase', ['coalesce', ['get', 'name:fr'], ['get', 'name']]], 'text-font': FB, 'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 6, 16], 'text-letter-spacing': 0.2 }, paint: { 'text-color': '#9a7f5a', 'text-halo-color': halo, 'text-halo-width': 1.4 } },
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
      { id: 'bg', type: 'background', paint: { 'background-color': '#9fd1d8' } },
      { id: 'coast-halo', type: 'line', source: 'c', paint: { 'line-color': '#c6e9ed', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 3, 8, 14], 'line-blur': 2 } },
      { id: 'land', type: 'fill', source: 'c', paint: { 'fill-color': ['get', 'fill'] } },
      { id: 'admin', type: 'line', source: 'a', minzoom: 3.5, paint: { 'line-color': '#c9b48e', 'line-width': 0.8, 'line-dasharray': [2, 2] } },
      { id: 'border', type: 'line', source: 'c', paint: { 'line-color': '#7a6048', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.6, 8, 1.6] } },
      { id: 'riv', type: 'line', source: 'r', filter: ['<=', ['get', 'rank'], ['step', ['zoom'], 4, 3, 6, 5, 8, 7, 10]], paint: { 'line-color': '#7fc0d6', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 9, 2.4] } },
      { id: 'lake', type: 'fill', source: 'l', paint: { 'fill-color': '#a6dbe3', 'fill-outline-color': '#6aaec4' } },
      { id: 'town-fill', type: 'fill', source: 'town', minzoom: 9.5, filter: ['==', ['get', 'kind'], 'town'], paint: { 'fill-color': '#f2dfc4', 'fill-outline-color': '#d9bf98', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9.5, 0, 10.5, 0.85] } },
      { id: 'town-road-c', type: 'line', source: 'town', minzoom: 10.5, filter: ['in', ['get', 'kind'], ['literal', ['main', 'road']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#d9b77a', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10.5, 2, 15, 16] } },
      { id: 'town-street-c', type: 'line', source: 'town', minzoom: 12.2, filter: ['==', ['get', 'kind'], 'street'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#e1cfa8', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12.2, 1.8, 16, 16] } },
      { id: 'town-street', type: 'line', source: 'town', minzoom: 12.2, filter: ['==', ['get', 'kind'], 'street'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#fffaf0', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12.2, 1, 16, 12] } },
      { id: 'town-road', type: 'line', source: 'town', minzoom: 10.5, filter: ['in', ['get', 'kind'], ['literal', ['main', 'road']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#ffe9b0', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10.5, 1, 15, 12] } },
      { id: 'town-park', type: 'fill', source: 'town', filter: ['==', ['get', 'kind'], 'park'], paint: { 'fill-color': '#c6e2a3' } },
      { id: 'town-3d', type: 'fill-extrusion', source: 'town', minzoom: 14, filter: ['in', ['get', 'kind'], ['literal', ['bldg', 'tree']]], paint: { 'fill-extrusion-color': ['get', 'c'], 'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.6, ['get', 'h']], 'fill-extrusion-base': ['case', ['==', ['get', 'kind'], 'tree'], 2, 0], 'fill-extrusion-opacity': 0.95 } },
      { id: 'rd-c', type: 'line', source: 'rd', minzoom: 4.5, filter: ['==', ['get', 'maj'], 1], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#d9a65a', 'line-width': ['interpolate', ['linear'], ['zoom'], 4.5, 1.2, 9, 4.4] } },
      { id: 'rd', type: 'line', source: 'rd', minzoom: 4.5, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['case', ['==', ['get', 'maj'], 1], '#ffe08a', '#fff6dc'], 'line-width': ['interpolate', ['linear'], ['zoom'], 4.5, 0.6, 9, ['case', ['==', ['get', 'maj'], 1], 2.6, 1.6]] } },
    ],
  };
}
function routeLayers() {
  map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'route-shadow', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff8ea', 'line-width': 7, 'line-opacity': 0.8 } });
  map.addLayer({ id: 'route', type: 'line', source: 'routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': ['get', 'w'], 'line-dasharray': [0.1, 2] } });
}
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
  map.on('load', () => { routeLayers(); mapReady = true; if (typeof liveOnMapLoad === 'function') { try { liveOnMapLoad(); } catch (e) { console.error(e); } } setTimeout(refreshPOIs, 50); const n = $('mapNote'); n.hidden = mapMode === 'tiles'; if (!n.hidden) setTimeout(() => n.classList.add('gone'), 9000); drawMarks(); });
  map.on('move', positionOverlay);
  map.on('zoom', () => { lodOverlay(); });
  map.on('moveend', refreshPOIs);
  let autoTilt = true;
  map.on('zoomend', () => { const z = map.getZoom(); if (autoTilt && z >= 15 && map.getPitch() < 5) map.easeTo({ pitch: 52, duration: 700 }); if (z < 12.5 && map.getPitch() > 5) map.easeTo({ pitch: 0, bearing: 0, duration: 500 }); upd3D(); });
  map.on('pitchend', upd3D); map.on('rotateend', upd3D);
  window.toggle3D = () => { const tilted = map.getPitch() > 5; if (tilted) { autoTilt = false; map.easeTo({ pitch: 0, bearing: 0, duration: 600 }); } else { autoTilt = true; map.easeTo({ pitch: 55, zoom: Math.max(map.getZoom(), 15.2), duration: 900 }); } };
  let idleT = 0; map.on('idle', () => { if (mapMode === 'tiles' && Date.now() - idleT > 600) { idleT = Date.now(); refreshPOIs(); } });
  map.on('click', e => { if (e.originalEvent && e.originalEvent.target.closest && e.originalEvent.target.closest('.ovm')) return; const tp = typedPlaceAt(e); if (tp) { choosePOI(tp); return; } pickPoint(e.lngLat.lng, e.lngLat.lat); });
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
  for (const s of SECRETS) add('s' + s.key, 'pin secret', `<div class="pinb gold"><svg viewBox="0 0 24 24"><path d="${starPath(12, 12.5, 9)}" fill="#fff"/></svg></div><span class="pinl">${esc(s.name)}</span>`, s.lon, s.lat, { secret: s.key });
  add('home', 'home', `<div class="homeb"><svg viewBox="0 0 60 60"><path d="M40 6 v12 h6 V10Z" fill="#c9604f" stroke="#5b4636" stroke-width="2.4"/><path d="M8 54 V28 L30 10 L52 28 V54Z" fill="#fff6e6" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/><path d="M4 30 L30 8 L56 30" fill="none" stroke="#d9604f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><rect x="24" y="36" width="12" height="18" rx="2" fill="#c98a5a" stroke="#5b4636" stroke-width="2.4"/><rect x="12" y="32" width="9" height="9" fill="#bfe1f2" stroke="#5b4636" stroke-width="2"/><rect x="39" y="32" width="9" height="9" fill="#bfe1f2" stroke="#5b4636" stroke-width="2"/></svg></div><span class="pinl home">Chez vous</span>`, 0, 0, { home: 1 });
  add('drop', 'drop', `<svg viewBox="0 0 30 40"><path d="M15 39 C4 24 2 16 2 13 A13 13 0 0 1 28 13 C28 16 26 24 15 39Z" fill="#e0607e" stroke="#4a3528" stroke-width="2.4"/><circle cx="15" cy="13" r="5" fill="#fff"/></svg><span class="pinl"></span>`, 0, 0, {});
  // destination d'un voyage en cours (drapeau) et compagnon en route : créés à la demande pour chaque individu (compOverlay)
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
  for (const s of SECRETS) { const o = ovEls['s' + s.key]; if (o) o.el.hidden = !S.secrets.includes(s.key); }
  Object.assign(ovEls.home, { lon: h.lon, lat: h.lat });
  const d = ovEls.drop;
  if (plan.dest && plan.dest.id == null && !plan.dest.secret) { d.el.hidden = false; d.lon = plan.dest.lon; d.lat = plan.dest.lat; d.el.querySelector('.pinl').textContent = plan.dest.name; } else d.el.hidden = true;
  for (const k of ovComps()) {
    compOverlay(k);
    const o = ovEls['w' + k], t = S.trips[k]; if (!o) continue;
    o.el.hidden = !t;
    if (t) { o.el.classList.toggle('cur', k === S.sel); o.el.classList.toggle('done', !!t.done); const img = o.el.querySelector('img'), u = portraitURI(k); if (img.getAttribute('src') !== u) img.setAttribute('src', u); const pos = tripPos(t); o.lon = pos[0]; o.lat = pos[1]; walkerLabel(o.el, k, t); }
    const td = ovEls['t' + k];
    if (td) { const show = !!(t && !t.done && t.dest.id == null && !t.dest.secret); td.el.hidden = !show; if (show) { td.lon = t.dest.lon; td.lat = t.dest.lat; const l = td.el.querySelector('.pinl'); if (l.textContent !== t.dest.name) l.textContent = t.dest.name; } }
  }
  if (mapReady && map.getSource('routes')) {
    const feats = [];
    for (const [k, t] of Object.entries(S.trips)) if (t && t.from && t.dest) feats.push({ type: 'Feature', properties: { c: k === S.sel ? '#d9604f' : '#b88a6a', w: k === S.sel ? 4.5 : 3 }, geometry: { type: 'LineString', coordinates: arcCoords(t.from, t.dest) } });
    if (plan.dest && !S.trips[S.sel]) feats.push({ type: 'Feature', properties: { c: '#2f7f6c', w: 4.5 }, geometry: { type: 'LineString', coordinates: arcCoords(h, plan.dest) } });
    map.getSource('routes').setData({ type: 'FeatureCollection', features: feats });
  }
  lodOverlay(); positionOverlay();
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
  if (m.dataset.poi) { const o = ovEls['q' + m.dataset.poi]; if (o) choosePOI(o.poi); return; }
  if (m.dataset.comp) { selectComp(m.dataset.comp); openSheet('voyage'); return; }
  if (m.dataset.secret) { chooseSecret(m.dataset.secret); return; }
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
function chooseSecret(key) {
  if (S.trips[S.sel]) { openSheet('voyage'); return; }
  const s = SECRETS.find(x => x.key === key);
  plan.dest = { id: null, secret: key, name: s.name, country: s.country, lat: s.lat, lon: s.lon, tags: s.tags, special: null };
  openSheet('voyage'); drawMarks();
}

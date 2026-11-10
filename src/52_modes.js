// ================= v37 : 3 MODES QUI SE JOUENT DIFFÉREMMENT (Exploration, Monde, Défis) =================
// Remplace QM_HTML.explo / .monde / .defi (46_quetes_modes.js) et réécrit qtPageHTML en version SOBRE :
// onglets (icône + nom), une ligne d'accroche, la vitrine en petit, repliée sous « Ce qu'on peut gagner ».
//
// 🧭 EXPLORATION = LE BROUILLARD. Le monde est couvert d'un brouillard doux (fill MapLibre « exFog », masque inversé),
//    sauf autour de la maison et des zones visitées. Zone = une zone fine RG_ZONES (17_regions.js) ou, ailleurs,
//    une cellule stable de 0,5° (id « c<ix>_<iy> »). Chaque zone a des secrets : ceux qui existent déjà (énigmes,
//    gardiens, lieux verrouillés), ceux de l'histoire, et des secrets GÉNÉRÉS depuis les vraies villes (GEO.p) : sans fin.
// 🌸 MONDE = « Aujourd'hui dans le monde » (s'appuie sur 44_monde.js) + une fête générée chaque jour de l'année + série 1 à 7 jours.
// 🏆 DÉFIS = épreuves chronométrées tirées chaque jour, Gaspard (45_equipage.js) progresse en même temps,
//    classement simulé de la semaine (vous, Gaspard, 8 voyageurs de 26_voyageurs.js), pierres d'étoile selon le rang.
//
// API POUR L'HISTOIRE (51_histoire.js) — fonctions globales (même portée) et aussi sur window :
//   exZoneAt(lon, lat)            → id de la zone du point (id RG_ZONES ou « c<ix>_<iy> »)
//   exZoneRevealed(zoneId)        → true si la zone est dévoilée (accepte aussi un id de région RG)
//   exZoneSecrets(zoneId)         → { found, total, list:[{ id, name, ico, lon, lat, kind, found }] }
//   exAddStorySecret(zoneId, { id, name, lon, lat, onFound })  → ajoute un secret d'histoire (à rappeler à chaque chargement ;
//                                   « trouvé » est sauvegardé ; onFound(trip) est appelé une seule fois, à l'arrivée à moins de 10 km)
//   exReveal(zoneIds)             → dévoile ces zones (ids RG_ZONES, régions RG ou cellules)
//   GAME.on('story:chapter', { n, zones }) → dévoile ces zones.
//   Objectif d'histoire lu pour le conseil : window.__story.goal() ou S.story.goal = { name, lon, lat, zone?, txt? }.
// Émet : GAME.emit('ex:reveal', { zones }), GAME.emit('ex:secret', { zone, id, story }).
// Sauvegarde : S.ex = { c:{cellule:1}, z:{zone:1}, f:{secret:date}, home, help }, S.md = { ser, tr, lb }. Tout est optionnel.
// Tests : window.__modes.

const md$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const mdNow = () => md$(() => wdNow(), Date.now());
const mdH = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const mdR = s => (mdH(s) % 10007) / 10007;
const mdKm = (a, b) => md$(() => d3.geoDistance([+a.lon, +a.lat], [+b.lon, +b.lat]) * 6371, 1e9);
const mdTuto = () => md$(() => tuOn(), false);
const mdDayOf = t => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const mdDay = () => mdDayOf(mdNow());
const mdDur = ms => { const m = Math.max(1, Math.round(ms / 60e3)); return m >= 60 * 24 ? `${Math.floor(m / 1440)} j ${Math.floor(m % 1440 / 60)} h` : m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
const mdNm = k => md$(() => CHARS[k].name, 'votre familier');
const mdFr = n => Math.round(n).toLocaleString('fr-FR');

// ======================================================================
// 🧭 EXPLORATION : le brouillard
// ======================================================================
const EX_CELL = 0.5, EX_FIND = 10, EX_LAND = 60000; // ~ cellules de 0,5° sur les terres émergées
function exState() {
  if (!S.ex || typeof S.ex !== 'object' || Array.isArray(S.ex)) S.ex = {};
  const X = S.ex;
  ['c', 'z', 'f'].forEach(k => { if (!X[k] || typeof X[k] !== 'object' || Array.isArray(X[k])) X[k] = {}; });
  if (X.home !== S.home) { X.home = S.home; md$(() => exRevealHome(X), 0); }
  return X;
}
const exCellOf = (lon, lat) => `c${Math.floor(+lon / EX_CELL)}_${Math.floor(+lat / EX_CELL)}`;
const exCellXY = key => { const m = /^c(-?\d+)_(-?\d+)$/.exec(key); return m ? [+m[1], +m[2]] : null; };
const exCellC = key => { const p = exCellXY(key); return p ? { lon: (p[0] + 0.5) * EX_CELL, lat: (p[1] + 0.5) * EX_CELL } : null; };
function exZoneAt(lon, lat) {
  const z = md$(() => rgZoneAt(lon, lat), null);
  return z && z.id ? z.id : exCellOf(lon, lat);
}
// cellules couvertes par une zone (zone RG = cellules de ses villes repères ; région RG = ses zones ou ses villes)
const EX_ZC = {};
function exZoneCells(id) {
  if (EX_ZC[id]) return EX_ZC[id];
  let out = [];
  if (exCellXY(id)) out = [id];
  else if (typeof RG_ZONES !== 'undefined' && RG_ZONES[id]) out = RG_ZPTS.filter(p => p[2] === id).map(p => exCellOf(p[0], p[1]));
  else if (md$(() => RG[id], null)) {
    const zs = Object.values(RG_ZONES).filter(z => z.r === id);
    if (zs.length) zs.forEach(z => out.push(...exZoneCells(z.id)));
    else out = md$(() => vyRegCities(id), []).slice(0, 60).map(c => exCellOf(c.lon, c.lat));
  }
  return (EX_ZC[id] = [...new Set(out)]);
}
function exRevealHome(X) {
  const h = homeObj(), [x, y] = exCellXY(exCellOf(h.lon, h.lat));
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) X.c[`c${x + dx}_${y + dy}`] = 1;
  const z = exZoneAt(h.lon, h.lat); X.z[z] = 1; exZoneCells(z).forEach(c => { X.c[c] = 1; });
}
function exZoneRevealed(id) {
  const X = exState();
  if (X.z[id]) return true;
  const cs = exZoneCells(id);
  return !!cs.length && cs.every(c => X.c[c]);
}
function exReveal(ids) {
  const X = exState(), nw = [];
  (Array.isArray(ids) ? ids : [ids]).filter(Boolean).forEach(id => {
    id = String(id); const cs = exZoneCells(id);
    if (!cs.length) return;
    if (!X.z[id] || cs.some(c => !X.c[c])) nw.push(id);
    X.z[id] = 1; cs.forEach(c => { X.c[c] = 1; });
    // une région : ses zones aussi
    Object.values(typeof RG_ZONES !== 'undefined' ? RG_ZONES : {}).forEach(z => { if (z.r === id) X.z[z.id] = 1; });
  });
  if (nw.length) { exDirty = true; md$(save, 0); GAME.emit('ex:reveal', { zones: nw }); md$(exMapTick, 0); }
  return nw;
}
GAME.on('story:chapter', e => { if (e && Array.isArray(e.zones)) exReveal(e.zones); });

// ---------- villes réelles par cellule (index paresseux) ----------
let EX_CI = null;
function exCities() {
  if (EX_CI) return EX_CI;
  EX_CI = {};
  md$(() => GEO.p, []).forEach(p => { const k = exCellOf(p[1], p[2]); (EX_CI[k] = EX_CI[k] || []).push({ name: p[0], lon: p[1], lat: p[2], r: p[3] }); });
  Object.values(EX_CI).forEach(l => l.sort((a, b) => a.r - b.r));
  return EX_CI;
}
function exNearCity(o) {
  const CI = exCities(), [x, y] = exCellXY(exCellOf(o.lon, o.lat));
  for (let r = 0; r <= 8; r++) {
    let best = null, bd = 1e9;
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      (CI[`c${x + dx}_${y + dy}`] || []).forEach(c => { const d = mdKm(o, c); if (d < bd) { bd = d; best = c; } });
    }
    if (best) return best;
  }
  return null;
}
function exZoneName(id) {
  if (typeof RG_ZONES !== 'undefined' && RG_ZONES[id]) return RG_ZONES[id].n;
  const R = md$(() => RG[id], null); if (R) return R.name || R.n || id;
  const C = exCellC(id); if (!C) return id;
  const big = (exCities()[id] || [])[0] || exNearCity(C);
  return big ? `Autour de ${big.name}` : 'Terres sauvages';
}

// ---------- secrets ----------
const EX_KINDS = [
  ['🔭', 'Le belvédère caché'], ['🗝️', 'La cave oubliée'], ['🪣', 'Le vieux puits'], ['🌿', 'Le jardin secret'], ['🕯️', 'La chapelle perdue'],
  ['🪨', 'La pierre gravée'], ['🌉', 'Le petit pont enchanté'], ['📜', 'La boîte aux lettres d’antan'], ['🦉', 'Le chêne aux chouettes'], ['⛲', 'La source cachée'],
  ['🏚️', 'La cabane du passeur'], ['🧭', 'La borne des voyageurs'],
];
const EX_STORY = {}; // zone → [secrets d'histoire] (rappelés au chargement par 51_histoire.js)
function exAddStorySecret(zid, o) {
  if (!zid || !o || !o.id || o.lon == null || o.lat == null) return false;
  const L = EX_STORY[zid] = EX_STORY[zid] || [], old = L.find(x => x.id === o.id);
  const s = { id: 's:' + o.id, sid: o.id, name: o.name || 'Une page d’Augustine', ico: '📔', lon: +o.lon, lat: +o.lat, kind: 'story', onFound: o.onFound };
  if (old) Object.assign(old, s); else L.push(s);
  EX_SC = {}; return true;
}
function exGenSecrets(id) {
  const out = [];
  exZoneCells(id).forEach(cell => {
    const cs = (exCities()[cell] || []).slice(0, 2);
    const bases = cs.length ? cs : [(() => { const C = exCellC(cell), n = exNearCity(C); return { name: n ? n.name : '', lon: C.lon, lat: C.lat, far: 1 }; })()];
    bases.forEach((b, i) => {
      const s = cell + ':' + i, K = EX_KINDS[mdH(s) % EX_KINDS.length], a = mdR(s + 'a') * Math.PI * 2, km = b.far ? 0 : 1.5 + mdR(s + 'k') * 4;
      const lat = b.lat + Math.sin(a) * km / 111.2, lon = b.lon + Math.cos(a) * km / (111.2 * Math.max(0.2, Math.cos(b.lat * Math.PI / 180)));
      out.push({ id: 'g:' + s, ico: K[0], name: b.name ? `${K[1]} ${b.far ? 'près ' : ''}${/^[AEIOUÉÈÎYH]/i.test(b.name) ? 'd’' : 'de '}${b.name}` : K[1], lon: +lon.toFixed(4), lat: +lat.toFixed(4), kind: 'gen', city: b.name });
    });
  });
  return out;
}
// secrets qui existent déjà dans le jeu, rangés par zone (calculé une fois)
let EX_OLD = null;
function exOldSecrets() {
  if (EX_OLD) return EX_OLD;
  EX_OLD = {};
  const add = o => { if (o.lon == null || o.lat == null) return; const z = exZoneAt(o.lon, o.lat); (EX_OLD[z] = EX_OLD[z] || []).push(o); };
  md$(() => MY_RIDDLES, []).forEach(R => { if (R.lon != null) add({ id: 'r:' + R.id, ico: '❓', name: R.name, lon: R.lon, lat: R.lat, kind: 'riddle', done: () => !!md$(() => myState().r[R.id].done, 0) }); });
  md$(() => MY_GUARDS, []).forEach(G => add({ id: 'gd:' + G.id, ico: '🦌', name: G.nm, lon: G.lon, lat: G.lat, kind: 'guard', myst: () => !md$(() => myState().g[G.id].d, 0), done: () => !!md$(() => myState().g[G.id].done, 0) }));
  md$(() => XP_PLACES, []).forEach(P => add({ id: 'lk:' + P.id, ico: '🔒', name: P.name, lon: P.lon, lat: P.lat, kind: 'lock', done: () => !!md$(() => xpState().won[P.id], 0) }));
  return EX_OLD;
}
let EX_SC = {};
function exSecretsRaw(id) { return EX_SC[id] || (EX_SC[id] = [].concat(exOldSecrets()[id] || [], EX_STORY[id] || [], exGenSecrets(id))); }
function exZoneSecrets(id) {
  const X = exState();
  const list = exSecretsRaw(id).map(s => ({ id: s.id, name: s.myst && s.myst() ? 'Un gardien mystérieux' : s.name, ico: s.ico, lon: s.lon, lat: s.lat, kind: s.kind, found: s.done ? s.done() : !!X.f[s.id] }));
  return { found: list.filter(s => s.found).length, total: list.length, list };
}
const exRevealedZones = () => { const X = exState(), z = new Set(Object.keys(X.z)); Object.keys(X.c).forEach(c => { if (!z.has(c) && !md$(() => rgZoneAt(...Object.values(exCellC(c))), null)) z.add(c); }); return [...z]; };
function exPct() { const n = Object.keys(exState().c).length, p = n / EX_LAND * 100; return p < 0.01 ? '< 0,01' : p.toLocaleString('fr-FR', { maximumFractionDigits: p < 1 ? 2 : 1 }); }

// ---------- une visite : dévoile la zone, trouve les secrets ----------
function exVisit(d, t) {
  if (!d || d.lon == null || mdTuto()) return null;
  const z = exZoneAt(d.lon, d.lat), X = exState(), was = exZoneRevealed(z);
  exReveal([z]); X.c[exCellOf(d.lon, d.lat)] = 1;
  const got = [];
  exSecretsRaw(z).forEach(s => {
    if (s.kind !== 'gen' && s.kind !== 'story') return;
    if (X.f[s.id] || mdKm(d, s) > EX_FIND) return;
    X.f[s.id] = Date.now(); got.push(s);
    if (s.kind === 'story') { md$(() => s.onFound && s.onFound(t || null), 0); }
    else if (t) {
      const c = 60 + (mdH(s.id) % 5) * 25; t.coins = (t.coins || 0) + c;
      if (mdR(s.id + 'it') < 0.4) md$(() => { const it = makeItem([`Trouvaille : ${s.name}`, 'd', 'statue', 2, null, '#c9b38a'], 0, `Secret : ${s.name}`, d.tags || [], { fixed: 2 }); it.special = true; t.bag.push(it); }, 0);
      md$(() => t.journal.push({ t: Date.now(), kind: 'mys', place: d.name, text: `${s.ico} Un secret ! ${mdNm(t.comp)} découvre ${s.name.charAt(0).toLowerCase() + s.name.slice(1)}. (+${c} pièces)`, chips: [['rare', 'secret trouvé']] }), 0);
    }
    GAME.emit('ex:secret', { zone: z, id: s.kind === 'story' ? s.sid : s.id, story: s.kind === 'story' });
  });
  if (t && !was) md$(() => t.journal.push({ t: Date.now(), kind: 'mys', place: d.name, text: `🌫️ Le brouillard se lève : ${exZoneName(z)} est dévoilé !`, chips: [['place', 'zone dévoilée']] }), 0);
  exDirty = true; md$(save, 0);
  return { zone: z, fresh: !was, got: got.map(s => s.id) };
}
if (typeof fireEvent === 'function') fireEvent = (orig => function (t, e) {
  const r = orig.apply(this, arguments);
  try { if (e && e.type === 'arrivee' && t && !t.tuto && !t.exArr) { t.exArr = 1; exVisit(t.dest, t); mdArrive(t); } } catch (err) { console.error('modes arrivée', err); }
  return r;
})(fireEvent);

// ---------- « Y aller » : un familier libre, le lieu, et la vérité sur la portée ----------
function mdGo(d) {
  if (!d || d.lon == null) return false;
  const m = $('modal'); if (m) m.hidden = true; md$(() => { qtPageOn = false; }, 0);
  if (S.trips && S.trips[S.sel]) {
    const k = compIds().find(c => !S.trips[c]);
    if (!k) { toast('Tous vos familiers sont en voyage : attendez un retour.'); return false; }
    S.sel = k; md$(renderAll, 0);
  }
  plan.dest = Object.assign({ id: null, country: '', tags: ['campagne'], special: null }, d);
  md$(() => openSheet('voyage'), 0); md$(drawMarks, 0); md$(() => zoomTo(d.lon, d.lat), 0);
  const c = md$(() => dfCheck(S.sel, plan.dest), null);
  if (c && !c.ok && c.msg) toast(c.msg);
  return c ? !!c.ok : true;
}

// ---------- LE conseil : une seule prochaine découverte ----------
function exAdvice() {
  const g = md$(() => (window.__story && typeof window.__story.goal === 'function' ? window.__story.goal() : null) || (S.story && S.story.goal) || null, null);
  if (g && g.lon != null) {
    const zone = g.zone || exZoneAt(g.lon, g.lat);
    return { story: 1, zone, name: g.name || exZoneName(zone), txt: g.txt || 'L’histoire continue ici.', d: { name: g.name || exZoneName(zone), lon: +g.lon, lat: +g.lat, tags: g.tags || ['campagne'] } };
  }
  const X = exState(), h = homeObj(), R = md$(() => dfRange(S.sel, null).km, 50) || 50;
  // cellules voisines des zones dévoilées, encore dans le brouillard
  const cand = new Set();
  Object.keys(X.c).forEach(c => { const [x, y] = exCellXY(c); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = `c${x + dx}_${y + dy}`; if (!X.c[k]) cand.add(k); }); });
  let best = null, bs = 1e12;
  cand.forEach(c => {
    const city = (exCities()[c] || [])[0], o = city || exCellC(c), km = mdKm(h, o);
    const sc = km + (km > R ? 5000 + km * 3 : 0) - (city ? 25 : 0);
    if (sc < bs) { bs = sc; best = { c, city, o, km }; }
  });
  if (!best) return null;
  const zone = exZoneAt(best.o.lon, best.o.lat), nm = best.city ? best.city.name : exZoneName(zone);
  return { zone, name: nm, km: best.km, far: best.km > R, txt: `${exZoneName(zone)} : levez le brouillard et trouvez ses secrets.`, d: { name: nm, lon: best.o.lon, lat: best.o.lat, tags: best.city ? ['ville'] : ['campagne'] } };
}
const exGoAdvice = () => { const A = exAdvice(); return A ? mdGo(A.d) : false; };

// ---------- la carte : brouillard, bord doux, zone conseillée, « ? » ----------
let exDirty = true, exMk = [], exMkSig = '', exHelpOn = false;
function exFogData() {
  const X = exState(), rows = {}, edges = [];
  Object.keys(X.c).forEach(c => { const p = exCellXY(c); if (p) (rows[p[1]] = rows[p[1]] || []).push(p[0]); });
  const holes = [];
  Object.entries(rows).forEach(([y, xs]) => {
    y = +y; xs.sort((a, b) => a - b);
    let s = xs[0], prev = xs[0];
    const push = (a, b) => { const x0 = a * EX_CELL, x1 = (b + 1) * EX_CELL, y0 = y * EX_CELL, y1 = (y + 1) * EX_CELL; holes.push([[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]); };
    for (let i = 1; i < xs.length; i++) { if (xs[i] !== prev + 1) { push(s, prev); s = xs[i]; } prev = xs[i]; }
    push(s, prev);
    xs.forEach(x => {
      const x0 = x * EX_CELL, x1 = x0 + EX_CELL, y0 = y * EX_CELL, y1 = y0 + EX_CELL;
      if (!X.c[`c${x - 1}_${y}`]) edges.push([[x0, y0], [x0, y1]]);
      if (!X.c[`c${x + 1}_${y}`]) edges.push([[x1, y0], [x1, y1]]);
      if (!X.c[`c${x}_${y - 1}`]) edges.push([[x0, y0], [x1, y0]]);
      if (!X.c[`c${x}_${y + 1}`]) edges.push([[x0, y1], [x1, y1]]);
    });
  });
  return {
    fog: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], ...holes] } },
    edge: { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: edges } },
  };
}
function exTargetData() {
  const A = md$(exAdvice, null); if (!A) return { type: 'FeatureCollection', features: [] };
  const cs = new Set(exZoneCells(A.zone)), segs = [];
  cs.forEach(c => { const [x, y] = exCellXY(c), x0 = x * EX_CELL, x1 = x0 + EX_CELL, y0 = y * EX_CELL, y1 = y0 + EX_CELL;
    if (!cs.has(`c${x - 1}_${y}`)) segs.push([[x0, y0], [x0, y1]]); if (!cs.has(`c${x + 1}_${y}`)) segs.push([[x1, y0], [x1, y1]]);
    if (!cs.has(`c${x}_${y - 1}`)) segs.push([[x0, y0], [x1, y0]]); if (!cs.has(`c${x}_${y + 1}`)) segs.push([[x0, y1], [x1, y1]]); });
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: segs } };
}
function exMapTick() {
  if (typeof map === 'undefined' || !map || !md$(() => mapReady, false) || !md$(() => map.isStyleLoaded(), true)) return;
  const vis = mdTuto() ? 'none' : 'visible';
  if (!map.getSource('exFog')) {
    const D = exFogData();
    const before = md$(() => (map.getStyle().layers.find(l => l.type === 'symbol') || {}).id, undefined);
    map.addSource('exFog', { type: 'geojson', data: D.fog });
    map.addSource('exEdge', { type: 'geojson', data: D.edge });
    map.addSource('exTgt', { type: 'geojson', data: exTargetData() });
    map.addLayer({ id: 'exFog', type: 'fill', source: 'exFog', paint: { 'fill-color': '#e2e4f1', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.42, 8, 0.52], 'fill-opacity-transition': { duration: 600 } } }, before);
    map.addLayer({ id: 'exEdge', type: 'line', source: 'exEdge', paint: { 'line-color': '#e2e4f1', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 4, 9, 26], 'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 4, 9, 22], 'line-opacity': 0.55 } }, before);
    map.addLayer({ id: 'exTgt', type: 'line', source: 'exTgt', paint: { 'line-color': '#e8963a', 'line-width': 3, 'line-dasharray': [2, 1.4], 'line-opacity': 0.9 } }, before);
    exDirty = false;
    map.on('moveend', exMarkers);
  } else if (exDirty) {
    const D = exFogData(); exDirty = false;
    md$(() => map.getSource('exFog').setData(D.fog), 0); md$(() => map.getSource('exEdge').setData(D.edge), 0); md$(() => map.getSource('exTgt').setData(exTargetData()), 0);
    exMkSig = ''; exMarkers();
  }
  ['exFog', 'exEdge', 'exTgt'].forEach(id => md$(() => { if (map.getLayoutProperty(id, 'visibility') !== vis) map.setLayoutProperty(id, 'visibility', vis); }, 0));
  if (vis === 'visible') exHelp();
}
// les secrets non trouvés des zones dévoilées : des « ? » quand on zoome
function exMarkers() {
  if (typeof maplibregl === 'undefined' || !map) return;
  const on = !mdTuto() && map.getZoom() >= 7, b = on ? map.getBounds() : null;
  const L = [];
  if (on) {
    const X = exState(), w = b.getWest(), e = b.getEast(), s = b.getSouth(), n = b.getNorth();
    const zs = new Set();
    for (let x = Math.floor(w / EX_CELL); x <= Math.floor(e / EX_CELL) && zs.size < 80; x++) for (let y = Math.floor(s / EX_CELL); y <= Math.floor(n / EX_CELL); y++) { const c = `c${x}_${y}`; if (X.c[c]) zs.add(exZoneAt((x + 0.5) * EX_CELL, (y + 0.5) * EX_CELL)); }
    zs.forEach(z => { exZoneSecrets(z).list.forEach(o => { if (!o.found && (o.kind === 'gen' || o.kind === 'story') && o.lon >= w && o.lon <= e && o.lat >= s && o.lat <= n) L.push(o); }); });
  }
  const sig = L.slice(0, 40).map(o => o.id).join('|');
  if (sig === exMkSig) return; exMkSig = sig;
  exMk.forEach(m => md$(() => m.remove(), 0)); exMk = [];
  L.slice(0, 40).forEach(o => {
    const el = document.createElement('button'); el.className = 'ex-q' + (o.kind === 'story' ? ' st' : ''); el.textContent = '?'; el.setAttribute('aria-label', 'Secret : ' + o.name); el.title = o.name;
    el.addEventListener('click', ev => { ev.stopPropagation(); mdGo({ name: o.name, lon: o.lon, lat: o.lat, tags: ['campagne'] }); });
    md$(() => exMk.push(new maplibregl.Marker({ element: el }).setLngLat([o.lon, o.lat]).addTo(map)), 0);
  });
}
// la première fois : une bulle d'aide courte (pas une fenêtre), qui s'efface seule
function exHelp() {
  const X = exState(); if (X.help || exHelpOn || S.firstRun || mdTuto() || !document.body) return;
  const m = $('modal'); if (m && !m.hidden) return;
  X.help = 1; md$(save, 0); exHelpOn = true;
  const d = document.createElement('div'); d.className = 'ex-help'; d.setAttribute('role', 'status');
  d.innerHTML = '<span>🌫️ Le monde est dans le <b>brouillard</b>. Voyagez pour le dévoiler, puis zoomez : des <b>?</b> cachent des secrets.</span><button aria-label="Fermer">✕</button>';
  d.querySelector('button').onclick = () => d.remove();
  document.body.appendChild(d); setTimeout(() => md$(() => d.remove(), 0), 9000);
}
setInterval(() => md$(exMapTick, 0), 1500);

// ======================================================================
// 🌸 MONDE : aujourd'hui dans le monde
// ======================================================================
function mdState() {
  if (!S.md || typeof S.md !== 'object' || Array.isArray(S.md)) S.md = {};
  const M = S.md;
  if (!M.ser || typeof M.ser !== 'object') M.ser = { d: 0, n: 0 };
  if (!M.tr || typeof M.tr !== 'object') M.tr = { act: null, res: {} };
  if (!M.tr.res || typeof M.tr.res !== 'object') M.tr.res = {};
  if (!M.lb || typeof M.lb !== 'object') M.lb = { w: 0, pts: 0, last: null };
  if (!M.fe || typeof M.fe !== 'object') M.fe = {};
  return M;
}
// une fête générée CHAQUE jour de l'année, dans une vraie ville pas trop loin
const MD_FETES = [
  ['🏮', 'Fête des lanternes', '#f2884e'], ['🥞', 'Journée des crêpes', '#e9c08a'], ['🪁', 'Festival des cerfs-volants', '#5fb0d9'], ['🌻', 'Fête des tournesols', '#f2c94c'],
  ['🎻', 'Concert dans la rue', '#b06a4a'], ['🧁', 'Marché des gourmandises', '#f6b8d0'], ['📚', 'Foire aux vieux livres', '#8a6a4a'], ['🎨', 'Journée des peintres', '#7aa6d9'],
  ['🍎', 'Fête de la pomme', '#d9302a'], ['🧀', 'Journée du fromage', '#f2d06a'], ['🌙', 'Nuit des étoiles', '#3b4a7a'], ['🎭', 'Carnaval des masques', '#9c6ad9'],
  ['🌷', 'Marché aux fleurs', '#f08aa6'], ['🍯', 'Fête du miel', '#e0a43a'], ['🎪', 'Petit cirque de passage', '#e05a5a'], ['🫖', 'Journée du thé', '#7aa67a'],
  ['🎃', 'Fête des courges', '#e8822a'], ['❄️', 'Marché du givre', '#a8d0f0'], ['🍂', 'Balade des feuilles d’or', '#c98a3a'], ['🐚', 'Journée des coquillages', '#f3d9c4'],
  ['🎶', 'Bal du village', '#5a8ad9'], ['🥐', 'Fête du pain', '#d9a05a'], ['🧶', 'Foire des tricoteuses', '#c46a9a'], ['🪴', 'Troc de plantes', '#6fae7d'],
  ['🍫', 'Journée du chocolat', '#7a4a30'], ['🎈', 'Lâcher de ballons', '#e85a8a'], ['🚲', 'Fête du vélo', '#4aa6a6'], ['🧺', 'Grand pique-nique', '#c9a35a'],
  ['🕯️', 'Nuit des bougies', '#f2d06a'], ['🪕', 'Festival folk', '#a0703a'], ['🍓', 'Fête des fraises', '#e04a5a'], ['🌈', 'Journée des couleurs', '#9c6ad9'],
];
function mdFete(day) {
  day = day || mdDay();
  const h = homeObj(), F = MD_FETES[mdH('fe' + day) % MD_FETES.length], CI = exCities(), [x, y] = exCellXY(exCellOf(h.lon, h.lat)), L = [];
  for (let dx = -7; dx <= 7; dx++) for (let dy = -6; dy <= 6; dy++) (CI[`c${x + dx}_${y + dy}`] || []).forEach(c => { const km = mdKm(h, c); if (km >= 15 && km <= 260 && c.r <= 9) L.push(c); });
  L.sort((a, b) => a.name < b.name ? -1 : 1);
  const c = L.length ? L[mdH('fc' + day) % L.length] : { name: h.name, lon: h.lon + 0.12, lat: h.lat + 0.08 };
  const y0 = Math.floor(day / 10000), m0 = Math.floor(day / 100) % 100, d0 = day % 100, base = new Date(y0, m0 - 1, d0).getTime();
  const st = base + (9 + mdH('fh' + day) % 4) * 3600e3, end = st + (6 + mdH('fd' + day) % 4) * 3600e3;
  return { id: 'f' + day, ico: F[0], nm: F[1], name: `${F[1]} ${/^[AEIOUÉÈÎYH]/i.test(c.name) ? 'd’' : 'de '}${c.name}`, city: c.name, lon: c.lon, lat: c.lat, start: st, end, def: [`Souvenir : ${F[1]}`, 'd', 'statue', 2, null, F[2]] };
}
function mdArrive(t) {
  const d = t.dest; if (!d || mdTuto()) return;
  const F = mdFete(), n = mdNow(), M = mdState();
  if (!M.fe[F.id] && n >= F.start && n < F.end && mdKm(d, F) <= 20) {
    M.fe[F.id] = 1;
    md$(() => wdGive(t, F.def, F.name), 0); md$(() => wdPhoto(t, F.name), 0);
    md$(() => t.journal.push({ t: Date.now(), kind: 'wld', place: d.name, tags: d.tags || ['ville'], text: `${F.ico} ${mdNm(t.comp)} arrive en pleine ${F.nm.charAt(0).toLowerCase() + F.nm.slice(1)} ! Un souvenir et une photo pour l’album.`, chips: [['rare', 'fête du jour']] }), 0);
  }
}
// la série de jours (1 à 7) : revenir chaque jour, la récompense grandit
const MD_SER = [0, 40, 60, 90, 120, 160, 220, 400];
function mdSerInfo() {
  const M = mdState(), today = mdDay(), yest = mdDayOf(mdNow() - 864e5);
  const claimed = M.ser.d === today, cont = M.ser.d === yest;
  const next = claimed ? M.ser.n : cont ? (M.ser.n % 7) + 1 : 1;
  return { claimed, n: claimed ? M.ser.n : cont ? M.ser.n : 0, next, coins: MD_SER[next] };
}
function mdSerClaim() {
  const I = mdSerInfo(); if (I.claimed || mdTuto()) return 0;
  const M = mdState(); M.ser = { d: mdDay(), n: I.next };
  md$(() => gainCoins(I.coins), 0);
  if (I.next === 7) md$(() => { const F = mdFete(); const it = makeItem([`Médaille des 7 jours`, 'd', 'statue', 3, null, '#e0a43a'], 0, 'Série de 7 jours', [], { fixed: 3 }); it.special = true; S.inv.push(it); }, 0);
  md$(save, 0); md$(() => toast(`Jour ${I.next} de votre série : +${I.coins} pièces${I.next === 7 ? ' et une médaille !' : ''}`), 0);
  return I.next;
}

// ======================================================================
// 🏆 DÉFIS : contre la montre, contre Gaspard, et le classement de la semaine
// ======================================================================
const MD_TAGM = { mer: ['mer', 'plage', 'port', 'phare'], foret: ['foret', 'parc', 'riviere', 'etang'], montagne: ['montagne', 'neige', 'belvedere'], ville: ['ville', 'monument', 'musee'] };
const MD_TPL = [
  { k: 'mer', ico: '🌊', mk: r => { const n = 2 + Math.floor(r * 3), h = 2 + Math.floor(r * 7) % 2; return { n, h, t: `${n} objets de la mer en ${h} h` }; } },
  { k: 'foret', ico: '🌲', mk: r => { const n = 3 + Math.floor(r * 3), h = 2 + Math.floor(r * 5) % 2; return { n, h, t: `${n} objets de forêt en ${h} h` }; } },
  { k: 'montagne', ico: '⛰️', mk: r => { const n = 2 + Math.floor(r * 2), h = 3; return { n, h, t: `${n} objets de montagne en ${h} h` }; } },
  { k: 'ville', ico: '🏙️', mk: r => { const n = 3 + Math.floor(r * 3), h = 2; return { n, h, t: `${n} objets de ville en ${h} h` }; } },
  { k: 'loin', ico: '🧭', mk: r => { const km = [120, 200, 300, 500][Math.floor(r * 4)]; return { n: 1, km, eve: 1, t: `Un lieu à plus de ${km} km avant ce soir` }; } },
  { k: 'rare', ico: '💎', mk: r => { const n = 1 + Math.floor(r * 2), h = 3; return { n, h, t: `${n} objet${n > 1 ? 's' : ''} rare${n > 1 ? 's' : ''} ou mieux en ${h} h` }; } },
  { k: 'trips', ico: '🎒', mk: r => { const n = 2 + Math.floor(r * 3), h = n + 1; return { n, h, t: `${n} voyages terminés en ${h} h` }; } },
  { k: 'craft', ico: '🧵', mk: r => { const n = 2 + Math.floor(r * 2); return { n, h: 1, t: `${n} créations à l’atelier en 1 h` }; } },
  { k: 'butin', ico: '🧺', mk: r => { const n = 6 + Math.floor(r * 7), h = 3; return { n, h, t: `${n} objets rapportés en ${h} h` }; } },
];
function mdTrials(day) {
  day = day || mdDay();
  const order = MD_TPL.map((T, i) => ({ T, w: mdH(`tr${day}:${i}`) })).sort((a, b) => a.w - b.w).slice(0, 3);
  return order.map(({ T }, i) => {
    const o = T.mk(mdR(`tp${day}:${T.k}`));
    return Object.assign({ id: `t${day}_${T.k}`, k: T.k, ico: T.ico, dif: o.km ? (o.km >= 300 ? 3 : 2) : o.n >= 4 ? 2 : 1 }, o);
  });
}
const mdTrDl = (T, st) => { if (!T.eve) return st + T.h * 3600e3; const e = new Date(st); e.setHours(23, 59, 0, 0); return Math.max(e.getTime(), st + 4 * 3600e3); };
const mdTrStones = (T, beat) => 3 + (T.dif || 1) + (beat ? 2 : 0);
function mdTrStart(id) {
  const M = mdState(), T = mdTrials().find(x => x.id === id);
  if (!T || mdTuto()) return false;
  if (M.tr.act) { toast('Une épreuve est déjà en cours.'); return false; }
  if (M.tr.res[id]) return false;
  const st = mdNow();
  M.tr.act = { id, k: T.k, ico: T.ico, t: T.t, goal: T.n, km: T.km || 0, dif: T.dif, n: 0, st, dl: mdTrDl(T, st), sp: 0.55 + mdR('gsp' + id) * 0.5 };
  md$(save, 0); toast(`C’est parti : ${T.t} ! Gaspard aussi s’y met…`);
  return true;
}
const mdRivP = A => Math.max(0, Math.min(1, (mdNow() - A.st) / ((A.dl - A.st) * A.sp)));
function mdTrFeed(ev) {
  const A = mdState().tr.act; if (!A || !ev) return;
  let add = 0;
  if (ev.type === 'craft') { if (A.k === 'craft') add = 1; }
  else {
    const d = ev.dest || {}, items = ev.items || [], tags = (d.tags || []).concat(d.cat ? [d.cat] : []);
    if (MD_TAGM[A.k]) { if (tags.some(x => MD_TAGM[A.k].includes(x))) add = items.length; }
    else if (A.k === 'loin') { if (mdKm(homeObj(), d) >= A.km) add = 1; }
    else if (A.k === 'rare') add = items.filter(it => (it.rarity || 0) >= 2).length;
    else if (A.k === 'trips') add = 1;
    else if (A.k === 'butin') add = items.length;
  }
  if (add) { A.n = Math.min(A.goal, A.n + add); md$(save, 0); }
  mdTrTick();
}
function mdTrTick() {
  const M = mdState(), A = M.tr.act; if (!A) return null;
  const now = mdNow();
  if (A.n >= A.goal) {
    const beat = mdRivP(A) < 1, st = mdTrStones(A, beat);
    M.tr.res[A.id] = beat ? 'win+' : 'win'; M.tr.act = null; M.tr.lastR = { t: A.t, r: 'win', beat, st };
    md$(() => gainStones(st), 0); mdLb().pts += 100 + (beat ? 50 : 0);
    md$(save, 0); md$(() => toast(`🏆 Épreuve réussie${beat ? ', avant Gaspard' : ''} ! +${st} pierres d’étoile`), 0);
    return 'win';
  }
  if (now >= A.dl) {
    M.tr.res[A.id] = 'lose'; M.tr.act = null; M.tr.lastR = { t: A.t, r: 'lose' };
    md$(save, 0); md$(() => toast('⏱️ Temps écoulé : Gaspard remporte cette épreuve. Revanche avec la suivante !'), 0);
    return 'lose';
  }
  return null;
}
GAME.on('trip:return', e => { if (mdTuto()) return; md$(() => { mdLb().pts += 10; }, 0); mdTrFeed(Object.assign({ type: 'return' }, e)); });
GAME.on('craft', e => { if (!mdTuto()) mdTrFeed(Object.assign({ type: 'craft' }, e)); });

// ---------- classement simulé de la semaine ----------
const MD_LBST = [25, 18, 14, 10, 8, 6, 5, 4, 3, 2];
const mdWeekOf = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
function mdLb() {
  const M = mdState(), w = mdWeekOf(mdNow()), L = M.lb;
  if (L.w !== w && !(L.w > w)) {
    if (L.w) {
      const R = mdRank(L.w, 1, L.pts), me = R.findIndex(p => p.me) + 1, st = MD_LBST[me - 1] || 2;
      md$(() => gainStones(st), 0);
      M.lb = { w, pts: 0, last: { w: L.w, rank: me, st, pts: L.pts } };
      md$(save, 0); md$(() => toast(`Fin de semaine : vous finissez ${me === 1 ? '1er' : me + 'e'} ! +${st} pierres d’étoile`), 0);
    } else { L.w = w; L.pts = L.pts || 0; }
  }
  return M.lb;
}
function mdRivals(w) {
  const P = md$(() => vyBuild().players, []), out = [], used = new Set();
  for (let i = 0; out.length < 8 && i < 40; i++) {
    const p = P.length ? P[mdH(`lb${w}:${i}`) % P.length] : null, nm = p ? p.name : ['Lina', 'Hugo', 'Maé', 'Noé', 'Zoé', 'Léo', 'Inès', 'Tom'][i % 8] + (i + 1);
    if (used.has(nm)) continue; used.add(nm);
    out.push({ nm, sp: p ? p.sp : '', skill: 0.25 + mdR(`sk${w}${nm}`) * 1.05 });
  }
  return out;
}
function mdRank(w, frac, pts) {
  const sc = (nm, sk) => Math.round(sk * 900 * Math.pow(frac, 0.85) + mdR(`n${w}${nm}${Math.floor(frac * 28)}`) * 40 * frac);
  const L = mdRivals(w).map(o => ({ nm: o.nm, sp: o.sp, pts: sc(o.nm, o.skill) }));
  L.push({ nm: 'Gaspard le renard', riv: 1, pts: sc('Gaspard', 0.85) }, { nm: 'Vous', me: 1, pts: pts });
  return L.sort((a, b) => b.pts - a.pts || (a.me ? -1 : b.me ? 1 : 0));
}
const mdRankNow = () => { const L = mdLb(), f = Math.max(0.02, Math.min(1, (mdNow() - L.w) / (7 * 864e5))); return mdRank(L.w, f, L.pts); };

// ======================================================================
// LES PAGES (sobres : un élément en grand, le reste replié)
// ======================================================================
const MD_OLD = { explo: QM_HTML.explo, monde: QM_HTML.monde, defi: QM_HTML.defi };
const mdCd = (ms, pre) => `<i class="md-cd" data-cd="${Math.round(ms)}" data-pre="${esc(pre || '')}">${esc(pre || '')}${mdDur(ms - mdNow())}</i>`;
const mdFold = (title, body, id) => body ? `<details class="md-fold"${id ? ` id="${id}"` : ''}><summary>${title}</summary><div>${body}</div></details>` : '';
const mdBar = (p, lbl, cls) => `<span class="md-bar ${cls || ''}"><i style="width:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%"></i><em>${lbl}</em></span>`;

function mdExploHTML() {
  if (mdTuto()) return '<p class="qt-hint">L’exploration s’ouvre après le tutoriel.</p>';
  const A = md$(exAdvice, null), zs = exRevealedZones().map(z => Object.assign({ z }, exZoneSecrets(z)));
  const f = zs.reduce((a, o) => a + o.found, 0), tt = zs.reduce((a, o) => a + o.total, 0);
  let h = '';
  if (A) h += `<div class="md-big md-x" id="exAdvice"><span class="md-k">${A.story ? '📔 L’histoire vous attend' : '🧭 Prochaine découverte'}</span>
    <b class="md-t">${esc(A.name)}</b><small>${esc(A.txt)}${A.km ? ` · ${mdFr(A.km)} km` : ''}</small>
    ${A.far ? '<small class="md-warn">Un peu loin pour votre portée : emportez des plats d’endurance ou une boussole.</small>' : ''}
    <button class="btn green" data-exgo="1">Y aller</button></div>`;
  h += `<div class="md-stats md-x"><span><b>${exPct()} %</b>Monde découvert</span><span><b>${zs.length}</b>zone${zs.length > 1 ? 's' : ''} dévoilée${zs.length > 1 ? 's' : ''}</span><span><b>${f}/${tt}</b>secrets</span></div>`;
  const rows = zs.sort((a, b) => (b.total - b.found) - (a.total - a.found)).slice(0, 40).map(o => `<div class="md-row"><span>${esc(exZoneName(o.z))}</span><small>${o.found}/${o.total} secret${o.total > 1 ? 's' : ''}</small><button class="btn cream sm" data-exzone="${esc(o.z)}">Voir</button></div>`).join('');
  h += mdFold(`🗺️ Secrets par zone <small>${zs.length}</small>`, rows, 'exZones');
  h += mdFold('🔎 Énigmes, traces, cartes et lieux verrouillés', md$(() => MD_OLD.explo(), ''), 'exOld');
  return h;
}
function exLookZone(z) {
  const cs = exZoneCells(z).map(exCellXY).filter(Boolean); if (!cs.length) return;
  const m = $('modal'); if (m) m.hidden = true; md$(() => { qtPageOn = false; closeSheet(); }, 0);
  const xs = cs.map(p => p[0]), ys = cs.map(p => p[1]);
  md$(() => map.fitBounds([[Math.min(...xs) * EX_CELL, Math.min(...ys) * EX_CELL], [(Math.max(...xs) + 1) * EX_CELL, (Math.max(...ys) + 1) * EX_CELL]], { padding: 60, maxZoom: 9, duration: 900 }), 0);
}

function mdMondeHTML() {
  if (mdTuto()) return '<p class="qt-hint">Le monde s’éveille après le tutoriel.</p>';
  const n = mdNow(), F = mdFete(), M = mdState(), lines = [];
  const moms = md$(() => WD_MOM.map(Mo => ({ Mo, st: wdMoState(Mo), soon: wdMoSoon(Mo) })), []);
  const evs = md$(() => wdEvents().filter(E => E.end > n), []);
  // la vedette : un moment rare maintenant > une fête ouverte > la fête du jour
  let V = null;
  const mNow = moms.find(o => o.st.now && !o.st.got);
  const eNow = evs.find(E => E.start <= n && !md$(() => wdState().ev[E.id], 0));
  if (mNow) V = { ico: mNow.Mo.ico, t: mNow.Mo.nm, w: mNow.Mo.where, cd: mNow.Mo.tide ? '' : 'c’est maintenant', go: 'm:' + mNow.Mo.id, rw: { k: 'season', def: mNow.Mo.it, ico: mNow.Mo.ico, mode: 'monde', tag: 'Saison + photo' } };
  else if (eNow) { const K = WD_EK[eNow.k]; V = { ico: K.ico, t: eNow.name, w: `${mdFr(mdKm(homeObj(), eNow))} km`, cdEnd: eNow.end, go: 'e:' + eNow.id, rw: { k: 'season', def: K.it, ico: K.ico, mode: 'monde', tag: 'Éphémère' } }; }
  else V = { ico: F.ico, t: F.name, w: `${mdFr(mdKm(homeObj(), F))} km`, cdEnd: n < F.start ? 0 : F.end, cdStart: n < F.start ? F.start : 0, go: 'f', got: !!M.fe[F.id], rw: { k: 'season', def: F.def, ico: F.ico, mode: 'monde', tag: 'Fête du jour', photo: 1 } };
  let h = `<div class="md-big md-m"><span class="md-k">🌸 Aujourd’hui dans le monde</span>${md$(() => qmRewardArt(Object.assign({ got: !!V.got }, V.rw), 76, { pills: false }), '')}
    <b class="md-t">${V.ico} ${esc(V.t)}</b><small>${esc(V.w)}${V.cdEnd ? ' · ' + mdCd(V.cdEnd, 'encore ') : V.cdStart ? ' · ' + mdCd(V.cdStart, 'ouvre dans ') : V.cd ? ' · ' + esc(V.cd) : ''}</small>
    ${V.got ? '<small class="md-ok">✔ Déjà fêté aujourd’hui</small>' : `<button class="btn green" data-mdgo="${esc(V.go)}">Y aller</button>`}</div>`;
  // la série
  const I = mdSerInfo();
  h += `<div class="md-ser md-m"><span class="md-k">Série de jours</span><span class="md-dots">${[1, 2, 3, 4, 5, 6, 7].map(i => `<i class="${i <= I.n ? 'on' : ''}${i === 7 ? ' big' : ''}">${i === 7 ? '🎁' : i}</i>`).join('')}</span>
    ${I.claimed ? `<small class="md-ok">✔ Jour ${I.n} récupéré · revenez demain</small>` : `<button class="btn cream sm" data-mdser="1">Cadeau du jour ${I.next} : ${COIN}${I.coins}</button>`}</div>`;
  // lignes compactes
  md$(() => wdWeather(), []).forEach(o => { const K = WD_K[o.k]; lines.push(`<div class="md-row"><span>${K.ico} ${esc(K.nm)} ${esc(o.z.de)}</span><small>${esc(K.eff)}</small></div>`); });
  if (V.go !== 'f') lines.push(`<div class="md-row"><span>${F.ico} ${esc(F.name)}</span><small>${n < F.start ? mdCd(F.start, 'dans ') : n < F.end ? mdCd(F.end, 'encore ') : 'terminée'}</small>${!M.fe[F.id] && n < F.end ? '<button class="btn cream sm" data-mdgo="f">Y aller</button>' : ''}</div>`);
  evs.filter(E => !V.go.endsWith(E.id)).forEach(E => { const K = WD_EK[E.k], got = md$(() => wdState().ev[E.id], 0); lines.push(`<div class="md-row"><span>${K.ico} ${esc(E.name)}</span><small>${got ? '✔' : E.start <= n ? mdCd(E.end, 'encore ') : mdCd(E.start, 'dans ')}</small>${got ? '' : `<button class="btn cream sm" data-mdgo="e:${esc(E.id)}">Y aller</button>`}</div>`); });
  moms.filter(o => (o.st.season || o.Mo.tide) && (!mNow || o !== mNow)).forEach(o => lines.push(`<div class="md-row"><span>${o.Mo.ico} ${esc(o.Mo.nm)}</span><small>${o.st.got ? '✔ cette année' : o.st.now ? 'maintenant' : esc(o.st.wait || 'de saison')}</small>${o.st.got ? '' : `<button class="btn cream sm" data-mdgo="m:${o.Mo.id}">Y aller</button>`}</div>`));
  h += `<div class="md-list">${lines.join('')}</div>`;
  // cette semaine (en petit)
  const wk = [];
  for (let i = 1; i <= 6; i++) { const d = mdDayOf(n + i * 864e5), G = mdFete(d); wk.push(`<li><b>${new Date(n + i * 864e5).toLocaleDateString('fr-FR', { weekday: 'short' })}</b> ${G.ico} ${esc(G.name)}</li>`); }
  moms.filter(o => !o.st.season && o.soon > 0 && o.soon <= 7).forEach(o => wk.push(`<li><b>dans ${o.soon} j</b> ${o.Mo.ico} ${esc(o.Mo.nm)}</li>`));
  h += mdFold('📅 Cette semaine', `<ul class="md-wk">${wk.join('')}</ul>`, 'mdWeek');
  return h;
}
function mdGoWorld(s) {
  if (s === 'f') { const F = mdFete(); return mdGo({ name: F.name, lon: F.lon, lat: F.lat, tags: ['ville'] }); }
  const d = md$(() => wdDestOf(s), null); return d ? mdGo(d) : false;
}

function mdDefiHTML() {
  if (mdTuto()) return md$(() => MD_OLD.defi(), '');
  mdTrTick();
  const M = mdState(), A = M.tr.act, n = mdNow(), T = mdTrials(), free = T.filter(x => !M.tr.res[x.id] && (!A || A.id !== x.id));
  const gimg = md$(() => eqRivalImg('content', 'md-gimg'), '');
  let h = '';
  if (A) {
    const p = mdRivP(A);
    h += `<div class="md-big md-d" id="mdTrial"><span class="md-k">⏱️ Épreuve en cours · ${mdCd(A.dl, 'reste ')}</span><b class="md-t">${A.ico} ${esc(A.t)}</b>
      ${mdBar(A.n / A.goal, `Vous ${A.n}/${A.goal}`, 'me')}${mdBar(p, `Gaspard ${Math.round(p * 100)} %`, 'riv')}
      <span class="md-gas">${gimg}<small>${p >= 1 ? 'Gaspard a fini ! Terminez quand même avant la fin du temps.' : 'Finissez avant Gaspard : +2 pierres d’étoile.'}</small></span>
      <button class="btn green" data-mdmap="1">Choisir un lieu</button></div>`;
  } else if (free.length) {
    const X = free[0];
    h += `<div class="md-big md-d" id="mdTrial"><span class="md-k">🏆 Épreuve du jour</span>${md$(() => qmRewardArt({ k: 'stones', n: mdTrStones(X, true), mode: 'defi' }, 64, { pills: false }), '')}<b class="md-t">${X.ico} ${esc(X.t)}</b>
      <span class="md-gas">${gimg}<small>Gaspard la tente aussi. Le chrono démarre quand vous acceptez.</small></span>
      <button class="btn green" data-mdtr="${X.id}">Relever le défi</button></div>`;
  } else {
    const tm = new Date(n); tm.setHours(24, 0, 0, 0);
    h += `<div class="md-big md-d" id="mdTrial"><span class="md-k">🏆 Épreuves du jour terminées</span><b class="md-t">Nouvelles épreuves ${mdCd(tm.getTime(), 'dans ')}</b></div>`;
  }
  if (M.tr.lastR) h += `<p class="md-last ${M.tr.lastR.r}">${M.tr.lastR.r === 'win' ? `✔ Gagnée : ${esc(M.tr.lastR.t)} (+${M.tr.lastR.st} pierres)` : `✗ Perdue : ${esc(M.tr.lastR.t)}`}</p>`;
  // classement
  const R = mdRankNow(), me = R.findIndex(p => p.me) + 1, L = mdLb(), wEnd = L.w + 7 * 864e5;
  const rowR = (p, i) => `<li class="${p.me ? 'me' : p.riv ? 'riv' : ''}"><b>${i + 1}</b><span>${esc(p.nm)}</span><em>${mdFr(p.pts)}</em><small>${STONE_SVG}${MD_LBST[i]}</small></li>`;
  h += `<div class="md-lb md-d" id="mdLb"><span class="md-k">Classement de la semaine · fin ${mdCd(wEnd, 'dans ')}</span><ol>${R.slice(0, 3).map(rowR).join('')}</ol>
    ${me > 3 ? `<ol start="${me}" class="md-me"><li class="me"><b>${me}</b><span>Vous</span><em>${mdFr(L.pts)}</em><small>${STONE_SVG}${MD_LBST[me - 1]}</small></li></ol>` : ''}
    ${L.last ? `<small class="md-ok">Semaine passée : ${L.last.rank === 1 ? '1er' : L.last.rank + 'e'} · +${L.last.st} pierres</small>` : ''}</div>`;
  h += mdFold('Tout le classement', `<ol class="md-all">${R.map(rowR).join('')}</ol>`, 'mdLbAll');
  // le reste, replié : autres épreuves + objectif du jour, livraison, contrats (ce sont aussi des épreuves) + défis au long cours
  const more = free.filter(x => !A && x !== free[0] || A).map(x => `<div class="md-row"><span>${x.ico} ${esc(x.t)}</span>${qmMeta('defi', x.dif, [])}<button class="btn cream sm" data-mdtr="${x.id}"${A ? ' disabled' : ''}>Relever</button></div>`).join('')
    + T.filter(x => M.tr.res[x.id]).map(x => `<div class="md-row done"><span>${x.ico} ${esc(x.t)}</span><small>${M.tr.res[x.id] === 'lose' ? '✗ perdue' : '✔ gagnée'}</small></div>`).join('');
  h += mdFold('⏱️ Les autres épreuves du jour', more, 'mdMore');
  h += mdFold('📦 Objectif du jour, livraison et contrats', md$(() => MD_OLD.defi().replace(/<h3 class="qt-h3" id="qmDefis">[\s\S]*$/, ''), '') + md$(() => { const E = eqState(); return E && E.con.length ? `<section class="eq-sec">${E.con.map(eqConHTML).join('')}${eqRivalHTML()}</section>` : ''; }, ''), 'mdOld');
  h += mdFold('🎯 Défis au long cours', md$(() => `<div class="qt-defis">${QT_DEFIS.map(qtDefiHTML).join('')}</div>`, ''), 'qmDefis');
  return h;
}
QM_HTML.explo = mdExploHTML; QM_HTML.monde = mdMondeHTML; QM_HTML.defi = mdDefiHTML;

// ---------- en-tête sobre ----------
const MD_PITCH = { hist: 'Le carnet d’Augustine, chapitre après chapitre.', explo: 'Levez le brouillard, trouvez les secrets.', monde: 'Revenez chaque jour : le monde change.', defi: 'Contre la montre, contre Gaspard.' };
QM_MODES.forEach(M => { if (MD_PITCH[M.id]) M.pitch = MD_PITCH[M.id]; if (M.id === 'hist') M.nm = 'Histoire'; });
qtPageHTML = function () {
  if (!QM_BY[qmTab]) qmTab = 'hist';
  const M = QM_BY[qmTab];
  if (qmTab === 'monde') md$(() => { const W = wdState(); wdEvNow().forEach(E => { W.seen[E.id] = 1; }); }, 0);
  delete qmSnap[qmTab];
  const tabs = QM_MODES.map(T => `<button class="qm-t qm-${T.id}${T.id === qmTab ? ' on' : ''}" data-qmtab="${T.id}" aria-pressed="${T.id === qmTab}"><span>${T.ico}</span>${T.nm}${T.id !== qmTab && md$(() => qmDot(T.id), false) ? '<i class="qm-dot" aria-label="nouveau"></i>' : ''}</button>`).join('');
  let body = '';
  try { body = QM_HTML[qmTab](); } catch (e) { console.error('quêtes onglet', e); }
  const vit = md$(() => qmVitHTML(qmTab), '');
  return `<div class="qt-page qm-page md-page qm-on-${qmTab}${md$(reduceMotion, false) ? ' qm-still' : ''}"><div class="qt-top"><h2>Quêtes</h2><button class="qt-x" data-closemodal="1" aria-label="Fermer">✕</button></div>
    <nav class="qm-tabs" aria-label="Modes de quête">${tabs}</nav>
    <p class="md-pitch qm-${qmTab}">${M.ico} <b>${esc(M.nm)}</b> · ${esc(M.pitch)}</p>
    <div class="qm-body" data-qmbody="${qmTab}">${body}</div>
    ${vit ? `<details class="md-win qm-${qmTab}"><summary>✨ Ce qu’on peut gagner</summary>${vit}</details>` : ''}
    <div class="qt-acts"><button class="btn green" data-closemodal="1">Fermer</button></div></div>`;
};
function mdRerender() {
  const m = $('modal'); if (!m || m.hidden || !m.querySelector('.md-page')) return;
  const mb = m.querySelector('.mbox'), y = mb ? mb.scrollTop : 0;
  showModal(qtPageHTML()); md$(qtBtns, 0); if (mb) mb.scrollTop = y;
}
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-exgo],[data-exzone],[data-mdgo],[data-mdser],[data-mdtr],[data-mdmap]');
  if (!el || el.disabled) return;
  const d = el.dataset; md$(() => sfx('pop'), 0);
  if (d.exgo) return exGoAdvice();
  if (d.exzone) return exLookZone(d.exzone);
  if (d.mdgo) return mdGoWorld(d.mdgo);
  if (d.mdser) { mdSerClaim(); return mdRerender(); }
  if (d.mdtr) { mdTrStart(d.mdtr); return mdRerender(); }
  if (d.mdmap) { const m = $('modal'); if (m) m.hidden = true; md$(() => { qtPageOn = false; openSheet('voyage'); }, 0); }
});
// comptes à rebours vivants + chrono des épreuves
setInterval(() => md$(() => {
  if (!S || mdTuto()) return;
  const r = mdTrTick(); md$(mdLb, 0);
  const m = $('modal'); if (!m || m.hidden) return;
  if (r && m.querySelector('.md-page')) return mdRerender();
  m.querySelectorAll('[data-cd]').forEach(e => { const ms = +e.dataset.cd - mdNow(); e.textContent = (e.dataset.pre || '') + (ms > 0 ? mdDur(ms) : '0 min'); });
}, 0), 20000);
// un lien de la vitrine vers un élément replié : on déplie d'abord
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-qmgo]'); if (!el) return;
  const m = $('modal'); if (!m) return;
  el.dataset.qmgo.split('|').forEach(id => { const t = m.querySelector('#' + CSS.escape(id)); if (t) { let p = t.closest('details'); while (p) { p.open = true; p = p.parentElement && p.parentElement.closest('details'); } } });
}, true);

// ---------- styles ----------
(function mdCSS() {
  const st = document.createElement('style'); st.id = 'mdCSS';
  st.textContent = `
.md-x{--c:var(--qx,#1f7f77);--cb:var(--qxb,#dcf2ee)}.md-m{--c:var(--qm,#c4487a);--cb:var(--qmb,#fde4ee)}.md-d{--c:var(--qd,#b7791f);--cb:var(--qdb,#fbefd6)}
.md-pitch{margin:6px 2px 10px;font-size:.86rem;color:var(--c,#555)}.md-pitch b{font-weight:800}
.md-pitch.qm-hist{--c:var(--qh)}.md-pitch.qm-explo{--c:var(--qx)}.md-pitch.qm-monde{--c:var(--qm)}.md-pitch.qm-defi{--c:var(--qd)}
.md-big{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;background:var(--cb);border:2px solid var(--c);border-radius:18px;padding:14px 12px;margin:0 0 10px}
.md-big .md-t{font-size:1.15rem;line-height:1.25}.md-big small{color:#5a5560;font-size:.82rem}.md-big .btn{min-width:150px;margin-top:4px}
.md-k{font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--c)}
.md-warn{color:#b0452a!important;font-weight:700}.md-ok{color:#2f8a4f!important;font-weight:700;font-size:.8rem}
.md-stats{display:flex;gap:6px;margin:0 0 10px}.md-stats span{flex:1;background:var(--cb);border-radius:12px;padding:8px 4px;text-align:center;font-size:.72rem;color:#5a5560}
.md-stats b{display:block;font-size:1.02rem;color:var(--c)}
.md-fold{margin:0 0 8px;border-radius:12px;background:rgba(0,0,0,.03)}.md-fold>summary{cursor:pointer;padding:10px 12px;font-weight:700;font-size:.9rem;list-style:none}
.md-fold>summary::-webkit-details-marker{display:none}.md-fold>summary::after{content:'▾';float:right;opacity:.5}.md-fold[open]>summary::after{content:'▴'}
.md-fold>summary small{opacity:.6;font-weight:600}.md-fold>div{padding:0 8px 8px}
.md-row{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid rgba(0,0,0,.06);font-size:.85rem}.md-row:last-child{border-bottom:0}
.md-row>span:first-child{flex:1;min-width:0}.md-row small{color:#6a6570;font-size:.76rem;text-align:right}.md-row.done{opacity:.6}
.md-list{background:rgba(0,0,0,.03);border-radius:12px;padding:2px 8px;margin:0 0 8px}
.md-ser{display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--cb);border-radius:14px;padding:10px;margin:0 0 10px}
.md-dots{display:flex;gap:5px}.md-dots i{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:.75rem;font-weight:800;background:#fff;color:#aaa;border:2px solid #e6dde4}
.md-dots i.on{background:var(--c);color:#fff;border-color:var(--c)}.md-dots i.big{width:34px;height:34px;font-size:1rem}
.md-wk{margin:0;padding:0 4px;list-style:none;font-size:.8rem}.md-wk li{padding:3px 0}.md-wk b{display:inline-block;min-width:52px;color:var(--qm,#c4487a)}
.md-bar{position:relative;display:block;width:100%;height:20px;border-radius:10px;background:#fff;overflow:hidden;border:1px solid rgba(0,0,0,.08)}
.md-bar i{position:absolute;inset:0 auto 0 0;background:#5cb87a;border-radius:10px;transition:width .6s}.md-bar.riv i{background:#e07a3a}
.md-bar em{position:relative;font-style:normal;font-size:.74rem;font-weight:800;line-height:20px;color:#333}
.md-gas{display:flex;align-items:center;gap:8px;text-align:left}.md-gas .md-gimg,.md-gas img{width:40px;height:40px;object-fit:contain}
.md-cd{font-style:normal;font-weight:700}
.md-last{font-size:.8rem;margin:-4px 4px 10px;font-weight:700}.md-last.win{color:#2f8a4f}.md-last.lose{color:#b0452a}
.md-lb{background:var(--cb);border-radius:14px;padding:10px 10px 8px;margin:0 0 8px}.md-lb ol,.md-all{margin:6px 0 0;padding:0;list-style:none}
.md-lb li,.md-all li{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:9px;font-size:.86rem}
.md-lb li b,.md-all li b{width:20px;text-align:center}.md-lb li span,.md-all li span{flex:1}.md-lb li em,.md-all li em{font-style:normal;font-weight:700}
.md-lb li small,.md-all li small{display:flex;align-items:center;gap:2px;font-size:.74rem;opacity:.8}.md-lb li small svg,.md-all li small svg{width:14px;height:14px}
li.me{background:#fff;box-shadow:inset 0 0 0 2px var(--qd,#b7791f)}li.riv span{color:#c2581f}
.md-me{border-top:1px dashed rgba(0,0,0,.15);padding-top:4px!important}
.md-win{margin:6px 0 8px;border-radius:12px;background:rgba(0,0,0,.03)}.md-win>summary{cursor:pointer;padding:9px 12px;font-size:.82rem;font-weight:700;color:#6a6570}
.md-win .qm-vitw{margin:0;padding:4px 6px 8px;background:none;border:0}.md-win .qm-vith{display:none}
.md-win .qra-w,.md-win .qra{--z:48px!important}.md-win .qm-vi b{font-size:.7rem}.md-win .qm-vi small{font-size:.62rem}
.ex-q{width:26px;height:26px;border-radius:50%;border:2px solid #fff;background:#7a5ac0;color:#fff;font-weight:900;font-size:15px;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;padding:0}
.ex-q.st{background:#e0a43a}
.ex-help{position:fixed;left:50%;top:116px;transform:translateX(-50%);z-index:60;max-width:min(340px,calc(100vw - 32px));display:flex;gap:8px;align-items:flex-start;background:#fffdf7;color:#3a3540;border-radius:14px;padding:10px 12px;font-size:.84rem;box-shadow:0 6px 20px rgba(0,0,0,.18);animation:exIn .4s ease}
.ex-help button{border:0;background:none;font-size:.9rem;cursor:pointer;color:#888}
@keyframes exIn{from{opacity:0;transform:translate(-50%,-6px)}}
@media (prefers-reduced-motion:reduce){.ex-help{animation:none}.md-bar i{transition:none}}
`;
  document.head.appendChild(st);
})();

window.exZoneAt = exZoneAt; window.exZoneRevealed = exZoneRevealed; window.exZoneSecrets = exZoneSecrets; window.exAddStorySecret = exAddStorySecret; window.exReveal = exReveal;
window.__modes = {
  ex: { state: exState, zoneAt: exZoneAt, revealed: exZoneRevealed, secrets: exZoneSecrets, addStory: exAddStorySecret, reveal: exReveal, visit: exVisit, advice: exAdvice, go: exGoAdvice, pct: exPct, name: exZoneName, zones: exRevealedZones, tick: () => { exDirty = true; exMapTick(); }, fog: exFogData },
  md: { state: mdState, fete: mdFete, ser: mdSerInfo, claim: mdSerClaim, trials: mdTrials, start: mdTrStart, feed: mdTrFeed, tick: mdTrTick, rank: mdRankNow, lb: mdLb, rivP: () => { const A = mdState().tr.act; return A ? mdRivP(A) : null; } },
  go: mdGo, plan: () => plan.dest, home: homeObj, emit: (e, d) => GAME.emit(e, d), look: exLookZone,
  layer: () => md$(() => !!map.getLayer('exFog') && map.getLayoutProperty('exFog', 'visibility'), false), view: z => { const h = homeObj(); md$(closeSheet, 0); md$(() => map.jumpTo({ center: [h.lon, h.lat], zoom: z }), 0); },
  html: { explo: mdExploHTML, monde: mdMondeHTML, defi: mdDefiHTML }, now: mdNow,
};

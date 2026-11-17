// ================= 81 · CARTE PAR RÉGIONS (v77) =================
// Demandes du joueur (17/11) : « on s'y perd, ça ne donne pas envie d'explorer ».
//  A. Moins de bruit : plus de noms de pays/villes ni de routes vus de loin (seuls les lieux du jeu ont un nom) ; de près, les rues restent.
//  B. Sur chaque épingle : un petit cadeau tant que le souvenir unique du lieu n'est pas trouvé, une coche ensuite.
//  C. Le monde s'ouvre région par région (les ~40 régions de 17_regions.js) : au départ, seulement la région de la maison.
//     Quelques voyages dans une région ouverte → elle est « explorée » et ouvre ses 2 voisines les plus proches.
//     Le reste est sous un voile clair, sans épingles, et la caméra ne sort pas de la zone ouverte.
//     Le brouillard d'avant n'est plus dessiné (sa logique reste : elle sert à l'histoire d'Augustine).
//  D. Récompense de région utile et difficile : réunir TOUTES les spécialités d'une région donne, en plus des pièces et de la médaille,
//     3 pierres d'étoile et +25 km de portée pour toujours.
const rc$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- A · moins de bruit ----------
function rcQuiet() {
  if (typeof map === 'undefined' || !map || !map.getLayer) return;
  const L = id => rc$(() => map.getLayer(id), null);
  const hide = id => { if (L(id) && map.getLayoutProperty(id, 'visibility') !== 'none') map.setLayoutProperty(id, 'visibility', 'none'); };
  const zr = (id, min) => { const l = L(id); if (l && l.minzoom !== min) map.setLayerZoomRange(id, min, 24); };
  hide('place-country'); hide('b-admin4');
  zr('place-city', 11); zr('place-town', 11.5); zr('place-small', 12.5); zr('water-name', 10);
  ['rd-main', 'rd-main-c', 'rd-mw', 'rd-mw-c', 'rd-rail'].forEach(id => zr(id, 9));
}

// ---------- C · état des régions ouvertes ----------
const RC_NEAR = 2;
function rcSt() {
  const s = rgState();
  if (!s.open || typeof s.open !== 'object') s.open = {};   // { regionId: { need, at } }
  if (!s.done || typeof s.done !== 'object') s.done = {};   // { regionId: date } : explorée, a ouvert ses voisines
  return s;
}
const rcTrips = id => ((rgState().seen[id] || {}).trips) || 0;
const rcOk = R => R && R.id !== 'grand_large';
function rcIsOpen(id) { return id === rc$(() => rgHome().id, '') || !!rcSt().open[id]; }
const rcNeed = id => (rcSt().open[id] || {}).need || 3;
function rcNearest(R, n) {
  const a = { lon: R.anchor[0], lat: R.anchor[1] };
  return REGIONS.filter(X => rcOk(X) && !rcIsOpen(X.id)).map(X => [kmBetween(a, { lon: X.anchor[0], lat: X.anchor[1] }), X]).sort((x, y) => x[0] - y[0]).slice(0, n).map(x => x[1]);
}
let rcSig = '';
// vérifie les régions explorées ; quiet = sans annonce (au chargement, pour les parties déjà commencées)
function rcCheck(quiet) {
  const s = rcSt(), home = rc$(() => rgHome().id, '');
  if (home && !s.open[home]) s.open[home] = { need: 3, at: Date.now() };
  // partie déjà commencée : toute région où l'on a voyagé ou trouvé un souvenir reste ouverte
  if (!s.mig) {
    s.mig = 1;
    Object.keys(s.seen).forEach(id => { if (RG[id] && rcOk(RG[id]) && rcTrips(id) > 0 && !s.open[id]) s.open[id] = { need: 3, at: Date.now() }; });
    rc$(() => PLACES.forEach(p => { if (S.found[p.name]) { const R = regionAt(p.lon, p.lat); if (rcOk(R) && !s.open[R.id]) s.open[R.id] = { need: 3, at: Date.now() }; } }));
    quiet = true;
  }
  let changed = false;
  for (let guard = 0; guard < 60; guard++) {
    const R = REGIONS.find(X => s.open[X.id] && !s.done[X.id] && rcTrips(X.id) >= rcNeed(X.id)); if (!R) break;
    s.done[R.id] = Date.now();
    const nw = rcNearest(R, RC_NEAR), nDone = Object.keys(s.done).length;
    nw.forEach(X => { s.open[X.id] = { need: Math.min(8, 3 + nDone), at: Date.now() }; });
    changed = true;
    if (!quiet && nw.length) {
      rc$(() => toast(`🗺️ ${R.short} explorée ! ${nw.length > 1 ? 'Nouvelles régions ouvertes' : 'Nouvelle région ouverte'} : ${nw.map(X => X.short).join(' et ')}.`));
      rc$(() => confetti(true));
    }
  }
  const sig = Object.keys(s.open).sort().join(',');
  if (changed || sig !== rcSig) { rcSig = sig; rcCellsCache = null; rc$(() => { exDirty = true; }); rc$(save); rc$(rcBounds); rc$(() => drawMarks()); }
}
// la région « en cours » : la plus récemment ouverte qui n'est pas encore explorée (la maison d'abord)
function rcFront() {
  const s = rcSt(), home = rc$(() => rgHome().id, '');
  if (home && !s.done[home]) return RG[home];
  const L = Object.keys(s.open).filter(id => RG[id] && !s.done[id]).sort((a, b) => (rcTrips(b) - rcTrips(a)) || ((s.open[b].at || 0) - (s.open[a].at || 0)));
  return L.length ? RG[L[0]] : null;
}

// ---------- C · le voile : tout ce qui n'est pas dans une région ouverte ----------
let rcCellsCache = null;
function rcCells() {
  if (rcCellsCache) return rcCellsCache;
  const s = rcSt(), ids = Object.keys(s.open).filter(id => RG[id]);
  const seeds = {};
  ids.forEach(id => { seeds[id] = [[RG[id].anchor[0], RG[id].anchor[1]]]; });
  rc$(() => PLACES.forEach(p => { const R = regionAt(p.lon, p.lat); if (seeds[R.id]) seeds[R.id].push([p.lon, p.lat]); }));
  rc$(() => RG_FR.forEach(([lon, lat, id]) => { if (seeds[id]) seeds[id].push([lon, lat]); }));
  let out = null;
  for (const G of [0.125, 0.25, 0.5, 1, 2]) {
    const set = new Set(); let over = false;
    for (const id of ids) {
      const q = [], seen = new Set();
      const push = (ix, iy) => { const k = ix + '_' + iy; if (seen.has(k)) return; seen.add(k); q.push([ix, iy]); };
      seeds[id].forEach(([lon, lat]) => { const ix = Math.floor(lon / G), iy = Math.floor(lat / G); set.add(ix + '_' + iy); push(ix, iy); });
      let n = 0;
      while (q.length) {
        const [ix, iy] = q.pop();
        const R = regionAt((ix + 0.5) * G, (iy + 0.5) * G);
        if (!R || R.id !== id) continue;
        set.add(ix + '_' + iy);
        if (++n > 5000) { over = true; break; }
        push(ix + 1, iy); push(ix - 1, iy); push(ix, iy + 1); push(ix, iy - 1);
      }
      if (over || set.size > 9000) { over = true; break; }
    }
    out = { set, G };
    if (!over) break;
  }
  return (rcCellsCache = out);
}
exFogData = function () {
  const { set, G } = rcCells(), edges = [], polys = [];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  set.forEach(k => { const i = k.indexOf('_'), x = +k.slice(0, i), y = +k.slice(i + 1); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
  const W = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
  if (!set.size) polys.push([W]);
  else {
    x0 -= 1; x1 += 1; y0 -= 1; y1 += 1;
    const bx0 = x0 * G, bx1 = (x1 + 1) * G, by0 = y0 * G, by1 = (y1 + 1) * G;
    polys.push([W, [[bx0, by0], [bx0, by1], [bx1, by1], [bx1, by0], [bx0, by0]]]);
    const rect = (a, b, y) => { const ax = a * G, bx = (b + 1) * G, ay = y * G, by = (y + 1) * G; polys.push([[[ax, ay], [bx, ay], [bx, by], [ax, by], [ax, ay]]]); };
    for (let y = y0; y <= y1; y++) {
      let s0 = null;
      for (let x = x0; x <= x1 + 1; x++) {
        const fog = x <= x1 && !set.has(x + '_' + y);
        if (fog && s0 === null) s0 = x;
        if (!fog && s0 !== null) { rect(s0, x - 1, y); s0 = null; }
        if (x <= x1 && !fog) {
          const cx0 = x * G, cx1 = cx0 + G, cy0 = y * G, cy1 = cy0 + G;
          if (!set.has((x - 1) + '_' + y)) edges.push([[cx0, cy0], [cx0, cy1]]);
          if (!set.has((x + 1) + '_' + y)) edges.push([[cx1, cy0], [cx1, cy1]]);
          if (!set.has(x + '_' + (y - 1))) edges.push([[cx0, cy0], [cx1, cy0]]);
          if (!set.has(x + '_' + (y + 1))) edges.push([[cx0, cy1], [cx1, cy1]]);
        }
      }
    }
  }
  return {
    fog: { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polys } },
    edge: { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: edges } },
  };
};
function rcPaint() {
  if (typeof map === 'undefined' || !map || !rc$(() => map.getLayer('exFog'), null)) return;
  if (map.getPaintProperty('exFog', 'fill-color') === '#f4ecd8') return;
  rc$(() => {
    map.setPaintProperty('exFog', 'fill-color', '#f4ecd8'); map.setPaintProperty('exFog', 'fill-antialias', false);
    map.setPaintProperty('exFog', 'fill-opacity', 0.86);
    map.setPaintProperty('exEdge', 'line-color', '#f4ecd8'); map.setPaintProperty('exEdge', 'line-opacity', 0.75);
    map.setPaintProperty('exEdge', 'line-width', ['interpolate', ['linear'], ['zoom'], 3, 4, 9, 22]);
    map.setPaintProperty('exEdge', 'line-blur', ['interpolate', ['linear'], ['zoom'], 3, 4, 9, 18]);
  });
}
// la caméra reste autour de la zone ouverte
function rcBounds() {
  if (typeof map === 'undefined' || !map || !map.setMaxBounds) return;
  const { set, G } = rcCells(); if (!set.size) return;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  set.forEach(k => { const i = k.indexOf('_'), x = +k.slice(0, i), y = +k.slice(i + 1); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
  const w = (x1 - x0 + 1) * G, h = (y1 - y0 + 1) * G, mx = Math.max(2.5, w * 0.45), my = Math.max(2, h * 0.45);
  const W = Math.max(-179.9, x0 * G - mx), E = Math.min(179.9, (x1 + 1) * G + mx), Sx = Math.max(-84, y0 * G - my), N = Math.min(84, (y1 + 1) * G + my);
  if (E - W > 300) { map.setMaxBounds(null); return; }
  rc$(() => map.setMaxBounds([[W, Sx], [E, N]]));
}

// ---------- C · épingles : rien dans les régions fermées ; B · cadeau / coche ----------
function rcPins() {
  if (typeof ovEls === 'undefined') return;
  for (const [key, o] of Object.entries(ovEls)) {
    const el = o.el; if (!el || !isFinite(o.lon) || !isFinite(o.lat)) continue;
    if (el.classList.contains('walker') || el.classList.contains('home') || el.classList.contains('dest') || el.classList.contains('tdest') || key === 'home') continue;
    const R = rc$(() => regionAt(o.lon, o.lat), null), lock = !!R && !rcIsOpen(R.id);
    if (lock && !el.hidden) { el.hidden = true; el.dataset.rcl = '1'; }
    else if (!lock && el.dataset.rcl) { el.hidden = false; delete el.dataset.rcl; }
  }
  if (typeof PLACES !== 'undefined') for (const p of PLACES) { const o = ovEls['p' + p.id]; if (o) o.el.classList.toggle('rc-got', !!S.found[p.name]); }
}
if (typeof pinHTML === 'function') pinHTML = (orig => function (p) {
  const h = orig.apply(this, arguments);
  return p && p.special ? h + `<i class="rc-b rc-gift" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="2.5" y="6.5" width="11" height="7.5" rx="1" fill="#f49ab4" stroke="#4a3528" stroke-width="1.2"/><rect x="1.5" y="4" width="13" height="3" rx="1" fill="#f7b8c8" stroke="#4a3528" stroke-width="1.2"/><path d="M8 4 V14" stroke="#fff3c9" stroke-width="2"/><path d="M8 4 Q4.5 0.5 4 3 Q4 4 8 4 Q11.5 0.5 12 3 Q12 4 8 4" fill="#f6c445" stroke="#4a3528" stroke-width="1.1" stroke-linejoin="round"/></svg></i><i class="rc-b rc-ok" aria-hidden="true">✓</i>` : h;
})(pinHTML);

// ---------- C · on ne part pas vers une région fermée ----------
function rcBlocked(d) {
  if (!d || !isFinite(d.lon) || !isFinite(d.lat)) return false;
  const R = rc$(() => regionAt(d.lon, d.lat), null); if (!R || !rcOk(R) || rcIsOpen(R.id)) return false;
  const F = rcFront(), left = F ? Math.max(1, rcNeed(F.id) - rcTrips(F.id)) : 0;
  rc$(() => toast(`🔒 ${R.name} n’est pas encore ouverte.${F ? ` Encore ${left} voyage${left > 1 ? 's' : ''} en ${F.short} pour ouvrir une nouvelle région.` : ''}`));
  return true;
}
if (typeof choosePlace === 'function') choosePlace = (orig => function (p) { if (rcBlocked(p)) return; return orig.apply(this, arguments); })(choosePlace);
if (typeof choosePOI === 'function') choosePOI = (orig => function (p) { if (rcBlocked(p)) return; return orig.apply(this, arguments); })(choosePOI);
if (typeof startTrip === 'function') startTrip = (orig => function () { if (rc$(() => rcBlocked(plan.dest), false)) return; return orig.apply(this, arguments); })(startTrip);

// ---------- C · la ligne « région en cours » en haut de la carte (remplace « Explorer… ») ----------
if (typeof cmGoal === 'function') cmGoal = (orig => function () {
  const r = orig.apply(this, arguments);
  rc$(() => {
    const g = document.getElementById('cmGoal'); if (!g) return;
    const old = g.querySelector('.cm-ge:not(.rc-ln)'); if (old) old.remove();
    const tuto = rc$(() => mdTuto(), false) || document.body.classList.contains('firstrun');
    const F = tuto ? null : rcFront();
    let b = g.querySelector('.rc-ln');
    if (!F) { if (b) b.remove(); return; }
    const t = Math.min(rcTrips(F.id), rcNeed(F.id)), nx = rcNearest(F, RC_NEAR);
    const h = `<span>🗺️</span>${esc(F.short)} · ${t}/${rcNeed(F.id)} voyages${nx.length ? ` <small>→ ouvre ${nx.map(X => esc(X.short)).join(', ')}</small>` : ''}<i>›</i>`;
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'cm-ge rc-ln'; g.appendChild(b); }
    b.dataset.rgopen = F.id;
    if (b.innerHTML !== h) b.innerHTML = h;
    g.hidden = !(typeof tab === 'undefined' || tab === 'carte');
  });
  return r;
})(cmGoal);
// l'ancien brouillard n'est plus dessiné : plus d'aide « voyagez pour dévoiler », plus de prime « lieu dévoilé »
if (typeof exHelp === 'function') exHelp = function () {};
if (typeof cmFogged === 'function') cmFogged = () => false;

// ---------- D · récompense de région : utile et difficile ----------
const RC_KM = 25, RC_STONES = 3;
if (typeof rgClaim === 'function') rgClaim = (orig => function (id) {
  const was = !!rgState().claimed[id];
  const r = orig.apply(this, arguments);
  if (!was && rgState().claimed[id]) { rc$(() => gainStones(RC_STONES)); rc$(save); rc$(() => toast(`🏅 Région complète : +${RC_STONES} pierres d’étoile et +${RC_KM} km de portée pour toujours !`)); }
  return r;
})(rgClaim);
if (typeof dfRange === 'function') dfRange = (orig => function () {
  const r = orig.apply(this, arguments);
  rc$(() => { const n = Object.keys(rgState().claimed || {}).length; if (!n || !r) return; const km = RC_KM * n; r.parts.push({ id: 'reg', lbl: `${n} région${n > 1 ? 's' : ''} complète${n > 1 ? 's' : ''}`, km }); r.km += km; r.sum += km; r.world = r.km >= DF_WORLD; });
  return r;
})(dfRange);
if (typeof rgDetail === 'function') rgDetail = (orig => function () {
  return String(orig.apply(this, arguments)).replace('pièces et la médaille', `pièces, ${RC_STONES} pierres d’étoile, +${RC_KM} km de portée pour toujours et la médaille`);
})(rgDetail);

// ---------- rafraîchissements ----------
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); rc$(rcPins); return r; })(drawMarks);
let rcBoot = false;
setInterval(() => {
  if (document.hidden) return;
  rc$(rcQuiet);
  if (document.body.classList.contains('firstrun') || rc$(() => mdTuto(), false)) return;
  if (!rcBoot) { rcBoot = true; rc$(() => rcCheck(true)); rc$(rcBounds); }
  else rc$(() => rcCheck(false));
  rc$(rcPaint); rc$(rcPins);
}, 2500);
window.__cm.rc = { st: () => rcSt(), cells: () => { const c = rcCells(); return { n: c.set.size, G: c.G }; }, check: q => rcCheck(q), front: () => (rcFront() || {}).id, open: id => { rcSt().open[id] = { need: 3, at: Date.now() }; rcCheck(true); }, trips: (id, n) => { const s = rgState(); (s.seen[id] = s.seen[id] || { trips: 0, first: Date.now() }).trips = n; } };

{
  const st = document.createElement('style');
  st.textContent = `
.ovc{display:none!important}
.ovm[hidden]{display:none!important}
.rc-b{position:absolute;left:11px;top:-56px;width:17px;height:17px;border-radius:50%;background:#fffaf0;border:1.5px solid #4a3528;display:flex;align-items:center;justify-content:center;font:900 10px/1 var(--body,system-ui);font-style:normal;box-shadow:0 1px 0 rgba(74,53,40,.3);pointer-events:none}
.rc-b svg{width:11px;height:11px;display:block}
.rc-ok{display:none;background:#6fbf73;color:#fff}
.pin.rc-got .rc-gift{display:none}.pin.rc-got .rc-ok{display:flex}
#ov.lx-far .rc-b{left:7px;top:-42px;width:14px;height:14px}#ov.lx-far .rc-b svg{width:9px;height:9px}
.cm-ge.rc-ln small{font-weight:700;color:#a5784f;margin-left:3px}
`;
  document.head.appendChild(st);
}

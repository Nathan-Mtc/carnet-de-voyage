// ================= 92 · FOND DE CARTE « CARTE ANCIENNE » (v88) =================
// Le joueur (18/11) : « on ne voit pas la carte en fond, on clique n'importe où et on tombe sur "Corse n'est pas accessible" ».
// Le voile des régions fermées (81) était presque opaque. Choix du joueur parmi 3 maquettes : A · Carte ancienne.
// 3 niveaux, la vraie carte toujours visible dessous :
//  1. région FERMÉE : teinte parchemin sépia translucide + fines hachures (comme une vieille carte) ;
//  2. région OUVERTE mais pas encore visitée : brume blanche légère, en nuages doux ;
//  3. DÉCOUVERT (là où les compagnons sont passés) : pleines couleurs.
// + la limite de la zone ouverte en pointillés orange, un nom « 🔒 » sur les régions fermées voisines,
// et une vraie fiche quand on touche une région fermée (comment l'ouvrir), au lieu d'un petit message.
const fd$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- 1 · le parchemin des régions fermées (remplace la peinture de 81) ----------
function fdHatch() {
  if (map.hasImage && map.hasImage('fdHatch')) return;
  const n = 24, cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d');
  c.strokeStyle = 'rgba(120,88,52,.32)'; c.lineWidth = 1.2;
  for (let i = -n; i <= n; i += 8) { c.beginPath(); c.moveTo(i, n); c.lineTo(i + n, 0); c.stroke(); }
  map.addImage('fdHatch', c.getImageData(0, 0, n, n), { pixelRatio: 2 });
}
rcPaint = function () {
  if (typeof map === 'undefined' || !map || !fd$(() => map.getLayer('exFog'), null)) return;
  if (map.getPaintProperty('exFog', 'fill-color') === '#e6cf9f') return;
  fd$(() => {
    map.setPaintProperty('exFog', 'fill-color', '#e6cf9f'); map.setPaintProperty('exFog', 'fill-antialias', false);
    map.setPaintProperty('exFog', 'fill-opacity', ['interpolate', ['linear'], ['zoom'], 3, 0.62, 9, 0.5]);
    fdHatch();
    if (!map.getLayer('fdHatch')) map.addLayer({ id: 'fdHatch', type: 'fill', source: 'exFog', paint: { 'fill-pattern': 'fdHatch', 'fill-opacity': 0.9 } }, 'exEdge');
    map.setPaintProperty('exEdge', 'line-color', '#e8963a'); map.setPaintProperty('exEdge', 'line-opacity', 0.55);
    map.setPaintProperty('exEdge', 'line-width', ['interpolate', ['linear'], ['zoom'], 3, 3, 9, 8]); map.setPaintProperty('exEdge', 'line-blur', ['interpolate', ['linear'], ['zoom'], 3, 2, 9, 6]);
  });
};

// ---------- 2 · la brume sur ce qui reste à visiter dans les régions ouvertes ----------
function fdCovered(lon, lat) {
  const X = fd$(() => bfX(), null); if (!X) return false;
  if (X.o.some(([a, b, km]) => fd$(() => kmBetween({ lon: a, lat: b }, { lon, lat }), 1e9) < km * 0.9)) return true;
  const c = fd$(() => exCellOf(lon, lat), ''); return (X.leg || []).includes(c) || !!(X.z && X.z[c]);
}
let fdSig = '';
function fdMistData() {
  const { set, G } = rcCells(), F = [];
  set.forEach(k => { const i = k.indexOf('_'), x = +k.slice(0, i), y = +k.slice(i + 1), lon = (x + 0.5) * G, lat = (y + 0.5) * G; if (!fdCovered(lon, lat)) F.push({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lon, lat] } }); });
  return { G, fc: { type: 'FeatureCollection', features: F } };
}
function fdMist() {
  if (typeof map === 'undefined' || !map || !map.getSource || !fd$(() => map.getLayer('exFog'), null)) return;
  const X = fd$(() => bfX(), { o: [], leg: [] }), sig = Object.keys(rcSt().open).sort().join(',') + '|' + X.o.length + '|' + (X.leg || []).length;
  if (sig === fdSig && map.getLayer('fdMist')) return;
  fdSig = sig;
  const { G, fc } = fdMistData();
  const k = 0.082 * (G / 0.125) * 2.4; // rayon en pixels au niveau de zoom 0 (≈ une cellule et un peu plus)
  if (map.getSource('fdMist')) map.getSource('fdMist').setData(fc);
  else {
    map.addSource('fdMist', { type: 'geojson', data: fc });
    map.addLayer({ id: 'fdMist', type: 'circle', source: 'fdMist', paint: { 'circle-color': '#ffffff', 'circle-blur': 1, 'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.3, 9, 0.26, 12, 0.14], 'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 0, k, 20, k * Math.pow(2, 20)] } }, 'exFog');
  }
  fd$(() => map.setLayoutProperty('fdMist', 'visibility', 'visible'));
}

// ---------- 3 · les noms des régions fermées voisines, et leur fiche ----------
function fdFront() {
  const open = Object.keys(rcSt().open), out = new Set();
  open.forEach(id => fd$(() => psEdgesOf(id), []).forEach(E => { const o = psOther(E, id); if (RG[o] && !rcIsOpen(o) && rcOk(RG[o])) out.add(o); }));
  return [...out];
}
function fdLabels() {
  if (typeof ovEls === 'undefined' || !document.getElementById('ov') || document.body.classList.contains('firstrun')) return;
  const L = fdFront(), keep = new Set(L.map(id => 'fdl' + id));
  Object.keys(ovEls).forEach(key => { if (key.startsWith('fdl') && !keep.has(key)) { ovEls[key].el.remove(); delete ovEls[key]; } });
  L.forEach(id => {
    const key = 'fdl' + id; if (ovEls[key] && ovEls[key].el.isConnected) return;
    const R = RG[id], el = document.createElement('div'); el.className = 'ovm fdl'; el.dataset.fdreg = id;
    el.innerHTML = `<span>🔒 ${esc(R.short)}</span>`;
    document.getElementById('ov').appendChild(el); ovEls[key] = { el, lon: R.anchor[0], lat: R.anchor[1] };
  });
  Object.keys(ovEls).forEach(key => { if (key.startsWith('fdl')) { ovEls[key].el.hidden = false; delete ovEls[key].el.dataset.rcl; } });
}
function fdCard(id) {
  if (document.getElementById('fdC')) return;
  const R = RG[id]; if (!R) return;
  const E = fd$(() => psAvail(), []).find(x => psTo(x) === id);
  const lib = fd$(() => psEdgesOf(id), []).filter(x => x[2] === 'libre').map(x => psOther(x, id)).find(o => rcIsOpen(o));
  let how, btn = '';
  if (E) { const T = PS_T[E[2]]; how = `Pour y aller : <b>${esc(E[3] || T.nm)} ${T.ico}</b>, depuis ${esc(RG[psFrom(E)].short)}. Il faut l’équipement du terrain, 2 provisions et un compagnon assez fort.`; btn = `<button class="btn green big wide" data-fdpass="${psKey(E)}">Voir le passage</button>`; }
  else if (lib) { const t = fd$(() => rcTrips(lib), 0), n = fd$(() => rcNeed(lib), 3); how = `Elle s’ouvrira toute seule quand vous aurez exploré <b>${esc(RG[lib].short)}</b> : ${Math.min(t, n)}/${n} voyages.`; }
  else how = 'Elle est encore trop loin. Explorez les régions voisines et franchissez leurs frontières : le chemin apparaîtra.';
  const el = document.createElement('div'); el.id = 'fdC'; el.className = 'ch-ov ch-route';
  el.innerHTML = `<div class="ch-card"><p class="cu-k">Région fermée</p><h3 class="ps-h">🔒 ${esc(R.name)}</h3><p class="ch-q">${esc(R.mood || '')}</p><p class="fd-how">${how}</p>${btn}<button class="cu-later" data-fdquit="1">Fermer</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
}
function fdClose() { const el = document.getElementById('fdC'); if (el) el.remove(); document.body.classList.remove('cu-on'); }
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-fdreg],[data-fdpass],[data-fdquit]'); if (!t) return;
  ev.stopPropagation(); ev.preventDefault();
  if (t.dataset.fdreg) return fdCard(t.dataset.fdreg);
  if (t.dataset.fdquit) return fdClose();
  if (t.dataset.fdpass) { fdClose(); fd$(() => psOpen(t.dataset.fdpass)); }
}, true);
// toucher un lieu d'une région fermée : la fiche plutôt qu'un petit message
rcBlocked = (orig => function (d) {
  if (!d || !isFinite(d.lon) || !isFinite(d.lat)) return false;
  const R = fd$(() => regionAt(d.lon, d.lat), null); if (!R || !rcOk(R) || rcIsOpen(R.id)) return false;
  fdCard(R.id); return true;
})(rcBlocked);
// toucher le fond de carte dans une région fermée
let fdClickOn = false;
function fdClick() {
  if (fdClickOn || typeof map === 'undefined' || !map || !map.on) return; fdClickOn = true;
  map.on('click', e => {
    if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest && e.originalEvent.target.closest('.ovm')) return;
    setTimeout(() => {
      if (document.getElementById('fdC') || document.body.classList.contains('sheet-open')) return;
      const R = fd$(() => regionAt(e.lngLat.lng, e.lngLat.lat), null); if (R && rcOk(R) && !rcIsOpen(R.id)) fdCard(R.id);
    }, 60);
  });
}

// ---------- rafraîchissement ----------
setInterval(() => { if (document.hidden) return; fd$(rcPaint); fd$(fdMist); fd$(fdLabels); fd$(fdClick); }, 2500);
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); fd$(fdLabels); return r; })(drawMarks);
if (typeof rcPins === 'function') rcPins = (orig => function () { const r = orig.apply(this, arguments); fd$(() => Object.keys(ovEls).forEach(k => { if (k.startsWith('fdl')) { ovEls[k].el.hidden = false; delete ovEls[k].el.dataset.rcl; } })); return r; })(rcPins);
window.__fd = { mist: () => fdMistData().fc.features.length, card: id => fdCard(id) };

{
  const css = document.createElement('style');
  css.textContent = `
.ovm.fdl{z-index:3;cursor:pointer}.fdl span{display:block;transform:translate(-50%,-50%);padding:3px 10px;border-radius:999px;background:rgba(255,250,240,.95);border:2px solid #4a3528;font:800 12px var(--body,system-ui);color:#4a3528;white-space:nowrap;box-shadow:0 2px 0 rgba(74,53,40,.25)}
#ov.lx-far .fdl span{font-size:10.5px;padding:2px 7px}
.fd-how{margin:0 0 12px;padding:9px 11px;border-radius:14px;background:#fff3d6;border:2px solid #e8c88a;font:600 13.5px/1.4 var(--body,system-ui);color:#4a3528;text-align:left}
`;
  document.head.appendChild(css);
}

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
const SCT_GRID = {}, SQ3 = Math.sqrt(3);
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
function sctKey(g, lon, lat) {
  const x = sctDl(lon, g.lon0) * g.kx, y = (lat - g.lat0) * g.ky;
  const qf = (SQ3 / 3 * x - y / 3) / g.R, rf = (2 / 3 * y) / g.R, sf = -qf - rf;
  let q = Math.round(qf), r = Math.round(rf); const s = Math.round(sf);
  const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
  return q + '_' + r;
}
function sctCenter(g, k) {
  const i = k.indexOf('_'), q = +k.slice(0, i), r = +k.slice(i + 1);
  const x = g.R * SQ3 * (q + r / 2), y = g.R * 1.5 * r;
  return [g.lon0 + x / g.kx, g.lat0 + y / g.ky];
}
function sctPoly(g, k) {
  const [lon, lat] = sctCenter(g, k), ring = [];
  for (let i = 0; i <= 6; i++) { const a = (Math.PI / 180) * (60 * (i % 6) - 30); ring.push([lon + g.R * 0.985 * Math.cos(a) / g.kx, lat + g.R * 0.985 * Math.sin(a) / g.ky]); }
  return ring;
}
function sctGrid(id) {
  if (SCT_GRID[id]) return SCT_GRID[id];
  const Rg = RG[id]; if (!Rg) return null;
  const lon0 = Rg.anchor[0], lat0 = Rg.anchor[1], kx = 111.32 * Math.max(0.15, Math.cos(lat0 * Math.PI / 180)), ky = 110.57;
  let p1 = sctFlood(id, 0.5, 4000); if (p1.over) p1 = sctFlood(id, 2, 4000);
  const st1 = p1.over ? 2 : 0.5;
  let area = 0; p1.out.forEach(([, lat]) => { area += (st1 * 111.32 * Math.cos(lat * Math.PI / 180)) * (st1 * ky); });
  area = Math.max(area, 3000);
  const R = Math.max(30, Math.sqrt(area / (2.598 * 17)));
  const g = { id, lon0, lat0, kx, ky, R, keys: new Set() };
  const step = Math.max(0.1, Math.min(3, R * 0.5 / ky));
  const p2 = sctFlood(id, step, 6000);
  p2.out.concat(p2.seeds).forEach(([lon, lat]) => g.keys.add(sctKey(g, lon, lat)));
  g.list = [...g.keys];
  return (SCT_GRID[id] = g);
}

// ---------- connaissance ----------
const SCT_LV = [
  { nm: 'Inconnue', red: 0 },
  { nm: 'Visiteur', red: 0, f: 0.04, fx: 'La région est sur votre carte.' },
  { nm: 'Habitué', red: 0.15, f: 0.12, fx: 'Trajets −15 % · les régions voisines s’ouvrent · un indice d’Augustine apparaît' },
  { nm: 'Connaisseur', red: 0.30, f: 0.28, fx: 'Trajets −30 %' },
  { nm: 'Comme chez soi', red: 0.45, f: 0.48, fx: 'Trajets −45 %' },
  { nm: 'Enfant du pays', red: 0.60, f: 0.72, fx: 'Trajets −60 %' },
];
function sctTh(T) { const th = []; let prev = 0; for (let i = 1; i <= 5; i++) { let v = Math.max(prev + 1, Math.round(SCT_LV[i].f * T)); if (i === 1) v = 1; th.push(v); prev = v; } return th; }
const sctDisc = id => sctSt().d[id] || {};
function sctInfo(id) {
  const g = sctGrid(id), D = sctDisc(id), n = Object.keys(D).length;
  const T = Math.max(g ? g.keys.size : 1, n), th = sctTh(T);
  let lvl = 0; th.forEach((v, i) => { if (n >= v) lvl = i + 1; });
  return { n, T, th, lvl, nm: SCT_LV[lvl].nm, red: SCT_LV[lvl].red, next: lvl < 5 ? th[lvl] : null };
}
const sctLvl = id => sct$(() => sctInfo(id).lvl, 0);
const sctStars = l => '★'.repeat(l) + '☆'.repeat(5 - l);
const sctRegOf = d => sct$(() => regionAt(d.lon, d.lat), null);
function sctKeyOf(d) { const R = sctRegOf(d); if (!R || !rcOk(R)) return null; const g = sctGrid(R.id); return g ? { R, k: sctKey(g, d.lon, d.lat) } : null; }
function sctKnown(d) { const K = sctKeyOf(d); return !K || !!sctDisc(K.R.id)[K.k]; }
const sctRed = d => { const R = sctRegOf(d); return R && rcOk(R) ? SCT_LV[sctLvl(R.id)].red : 0; };

// un lieu visité : on découvre son secteur (quiet = sans annonce)
function sctVisit(d, quiet) {
  const K = sct$(() => sctKeyOf(d), null); if (!K) return null;
  const s = sctSt(), id = K.R.id; if (!s.d[id]) s.d[id] = {};
  if (s.d[id][K.k]) return null;
  const before = sctLvl(id); s.d[id][K.k] = Date.now();
  const I = sctInfo(id); sctDirty = true;
  if (!quiet) setTimeout(() => sct$(() => {
    if (I.lvl > before) {
      toast(`⭐ ${K.R.short} : vous êtes « ${I.nm} » ! ${I.red ? `Trajets ${Math.round(I.red * 100)} % plus rapides dans la région.` : ''}`);
      sct$(() => confetti(true));
    } else toast(`🌫️ Nouveau secteur découvert en ${K.R.short} (${I.n}/${I.T})${I.next ? ` · niveau suivant à ${I.next}` : ''}`);
  }), 900);
  return { id, k: K.k, I, up: I.lvl > before };
}
// au retour d'un compagnon
GAME.on('trip:return', e => sct$(() => { if (e && e.dest && !(e.trip && e.trip.tuto)) { sctVisit(e.dest, false); sct$(save); sct$(() => rcCheck(false)); } }));
// mise en route : la maison est connue, et les anciens voyages comptent
function sctMig() {
  const s = sctSt(); if (s.mig) return; if (document.body.classList.contains('firstrun')) return;
  s.mig = 1;
  sct$(() => sctVisit(homeObj(), true));
  sct$(() => (bfX().o || []).forEach(([lon, lat]) => sctVisit({ lon, lat }, true)));
  sct$(() => PLACES.forEach(p => { if (S.found && S.found[p.name]) sctVisit(p, true); }));
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
    el.innerHTML = `Elle s’ouvrira quand vous serez <b>Habitué</b> de ${esc(RG[lib].short)} : ${Math.min(I.n, I.th[1])}/${I.th[1]} secteurs découverts. Visitez des lieux dans la brume là-bas.`;
  });
  return r;
})(fdCard);

// ---------- la carte : les secteurs dans la brume ----------
if (typeof fdMist === 'function') fdMist = function () { sct$(() => { if (map.getLayer('fdMist')) map.setLayoutProperty('fdMist', 'visibility', 'none'); }); };
let sctDirty = true, sctBuild = 0;
function sctOpenIds() { return Object.keys(rcSt().open).filter(id => RG[id] && rcOk(RG[id])); }
// v92 : plus d'hexagones dessinés (le joueur : « ces octogones qui se superposent, je n'ai pas envie de voir ça »).
// Chaque secteur dans la brume = un nuage doux (cercle flouté de la taille du secteur) ; l'indice = une lueur orange.
const sctPt = (g, k, extra) => { const c = sctCenter(g, k); return { type: 'Feature', properties: Object.assign({ r0: g.R * 1000 / (156543.03 * Math.cos(c[1] * Math.PI / 180)) }, extra || {}), geometry: { type: 'Point', coordinates: c } }; };
function sctFogFC() {
  const F = [], C = [], s = sctSt();
  sctOpenIds().forEach(id => {
    const g = SCT_GRID[id]; if (!g) return; const D = sctDisc(id), clue = !s.camp[id] && s.clue[id];
    g.list.forEach(k => { if (clue === k) C.push(sctPt(g, k)); else if (!D[k]) F.push(sctPt(g, k)); });
  });
  return { fog: { type: 'FeatureCollection', features: F }, clue: { type: 'FeatureCollection', features: C } };
}
const sctRad = f => ['interpolate', ['exponential', 2], ['zoom'], 0, ['*', ['get', 'r0'], f], 20, ['*', ['get', 'r0'], f * 1048576]];
function sctPaint() {
  if (typeof map === 'undefined' || !map || !map.getSource || !sct$(() => map.getLayer('exFog'), null)) return;
  const miss = sctOpenIds().find(id => !SCT_GRID[id]);
  if (miss) { sctGrid(miss); sctDirty = true; if (++sctBuild < 50) return; }
  if (!sctDirty && map.getLayer('sctFog')) return;
  sctDirty = false;
  const { fog, clue } = sctFogFC();
  if (map.getSource('sctFog') && map.getLayer('sctFog') && map.getLayer('sctFog').type === 'circle') { map.getSource('sctFog').setData(fog); map.getSource('sctClue').setData(clue); return; }
  ['sctFog', 'sctLine', 'sctClueF', 'sctClueL'].forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
  if (map.getSource('sctFog')) map.getSource('sctFog').setData(fog); else map.addSource('sctFog', { type: 'geojson', data: fog });
  if (map.getSource('sctClue')) map.getSource('sctClue').setData(clue); else map.addSource('sctClue', { type: 'geojson', data: clue });
  map.addLayer({ id: 'sctFog', type: 'circle', source: 'sctFog', paint: { 'circle-color': '#ffffff', 'circle-blur': 0.7, 'circle-radius': sctRad(1.6), 'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.62, 9, 0.5, 12, 0.3] } }, 'exFog');
  map.addLayer({ id: 'sctClueF', type: 'circle', source: 'sctClue', paint: { 'circle-color': '#f2a33a', 'circle-blur': 0.6, 'circle-radius': sctRad(1.3), 'circle-opacity': 0.5 } }, 'exFog');
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
  const R = RG[id], I = sctInfo(id), pct = Math.round(100 * Math.min(1, I.n / I.T));
  const lad = SCT_LV.slice(1).map((L, i) => { const lv = i + 1, ok = I.lvl >= lv; return `<li class="${ok ? 'ok' : lv === I.lvl + 1 ? 'cur' : ''}"><span>${ok ? '✓' : lv}</span><div><b>${L.nm} <small>${I.th[i]} secteur${I.th[i] > 1 ? 's' : ''}</small></b><small>${L.fx}</small></div></li>`; }).join('');
  const camp = sct$(() => augCampLine(id), '');
  return `<div class="ch-card sct-card"><p class="cu-k">Votre connaissance de la région</p><h3 class="ps-h">${esc(R.name)}</h3>
<p class="sct-lv"><b>${I.nm}</b> <i>${sctStars(I.lvl)}</i>${I.red ? ` <em>Trajets −${Math.round(I.red * 100)} %</em>` : ''}</p>
<div class="sct-bar"><i style="width:${pct}%"></i><span>${I.n}/${I.T} secteurs découverts</span></div>
<p class="sct-how">Chaque <b>coin dans la brume</b> (nuage blanc sur la carte) se découvre en y envoyant un compagnon. Deux lieux du même secteur comptent pour un.</p>
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
  const K = sct$(() => sctKeyOf(d), null); if (!K) return '';
  const I = sctInfo(K.R.id), out = [];
  const clue = sct$(() => augClueAt(d), false);
  if (clue) out.push(`<span class="sct-t clue">📖 Le camp d’Augustine est dans ce secteur !</span>`);
  if (!sctDisc(K.R.id)[K.k]) out.push(`<span class="sct-t new">🌫️ Secteur inconnu : +1 secteur en ${esc(K.R.short)} <small>(${I.n}/${I.T})</small></span>`);
  else out.push(`<span class="sct-t">Secteur déjà découvert</span>`);
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
window.__sct = { info: id => sctInfo(id), grid: id => { const g = sctGrid(id); return g && { R: g.R, n: g.keys.size }; }, visit: (lon, lat) => sctVisit({ lon, lat }, false), card: id => sctCard(id), ev: s => eval(s) };

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

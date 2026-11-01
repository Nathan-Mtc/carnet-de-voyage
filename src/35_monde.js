// ================= MONDE v19 : cartes postales rangées, cartes situées, nids cohérents =================
// Le joueur : « on fait défiler sans fin, il n'y a aucun tri ». Sac › Cartes : regroupement par région (sections repliables)
// ou par mois, vignettes compactes, doublons d'un même lieu regroupés (×N), carte en grand au toucher.
// Utilité, sans nouvelle mécanique : chaque section mène au codex de sa région, et on montre le compteur de régions visitées.
// Aussi : chaque carte retient où elle a été prise (lon, lat, type de lieu, région) pour que postcardSVG la dessine vraiment,
// et un nid (29_aventure.js) n'apparaît plus là où aucune espèce sauvage ne vit (21_nurserie.js, nsPickSp).

// ---------------- 1. les cartes retiennent leur lieu ----------------
function mdStampPhoto(p, pl) {
  if (!p || !pl || p.rg) return p;
  try {
    if (isFinite(+pl.lon) && isFinite(+pl.lat)) { p.lon = +pl.lon; p.lat = +pl.lat; const R = regionAt(p.lon, p.lat); if (R) p.rg = R.id; }
    const c = pl.cat || (pl.tags && POI_CATS[pl.tags[0]] ? pl.tags[0] : null); if (c && !p.cat) p.cat = c;
    if (!p.city && pl.city) p.city = pl.city;
  } catch (e) { /* rien */ }
  return p;
}
// anciennes cartes : on retrouve le lieu par son nom (grands lieux, villes de départ), sans rien casser
function mdGuessPlace(p) {
  if (!p) return null;
  if (isFinite(p.lon) && isFinite(p.lat)) return p;
  const n = p.place || '';
  const P = (typeof PLACES !== 'undefined' && PLACES.find(x => x.name === n)) || null;
  if (P) return { lon: P.lon, lat: P.lat, tags: P.tags };
  const H = typeof HOMES !== 'undefined' ? HOMES.find(h => h[0] === n) : null;
  if (H) return { lon: H[2], lat: H[1] };
  return null;
}
function mdRegionOf(p) {
  if (p.rg && typeof RG !== 'undefined' && RG[p.rg]) return RG[p.rg];
  const g = mdGuessPlace(p);
  if (!g) { // ancienne carte d'un lieu du quotidien : la provenance d'un objet rapporté du même endroit
    const it = (S.inv || []).find(x => x && x.from === p.place && x.origin && x.origin.region);
    return it && typeof RG !== 'undefined' ? RG[it.origin.region] || null : null;
  }
  try { return regionAt(g.lon, g.lat); } catch (e) { return null; }
}
if (typeof fireEvent === 'function') fireEvent = (orig => function (t, e) {
  const n0 = t && t.photos ? t.photos.length : 0;
  const r = orig.apply(this, arguments);
  try { if (t && t.photos) for (let i = n0; i < t.photos.length; i++) mdStampPhoto(t.photos[i], (typeof btCtx !== 'undefined' && btCtx && btCtx.name === t.photos[i].place ? btCtx : null) || t.dest); } catch (er) { /* rien */ }
  return r;
})(fireEvent);
if (typeof collect === 'function') collect = (orig => function () {
  try { const t = S.trips && S.trips[S.sel]; if (t && t.photos) t.photos.forEach(p => mdStampPhoto(p, t.dest)); } catch (e) { /* rien */ }
  return orig.apply(this, arguments);
})(collect);

// ---------------- 2. pas de nid là où aucune espèce ne vit ----------------
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  try {
    const t = S.trips[k];
    if (t && t !== before && typeof nsPickSp === 'function' && t.events && t.events.some(e => e.type === 'nid' || e.type === 'sauvage')) {
      if (!nsPickSp(t.dest)) { t.events = t.events.filter(e => e.type !== 'nid' && e.type !== 'sauvage'); save(); }
    }
  } catch (e) { console.error('monde départ', e); }
  return r;
})(startTrip);

// ---------------- 3. l'album trié ----------------
let mdSort = 'region', mdOpen = null;
const mdKey = p => (p.place || p.title || '?');
function mdGroups() {
  const all = (S.album || []).map((p, i) => ({ p, i }));
  // doublons d'un même lieu : une vignette (la plus récente), ×N
  const byPlace = new Map();
  for (const x of all) { const k = mdKey(x.p); let g = byPlace.get(k); if (!g) { g = { k, list: [] }; byPlace.set(k, g); } g.list.push(x); }
  const places = [...byPlace.values()].map(g => { g.list.sort((a, b) => (b.p.date || 0) - (a.p.date || 0)); g.last = g.list[0].p; g.R = mdRegionOf(g.last); return g; });
  const sec = new Map();
  if (mdSort === 'region') {
    for (const g of places) { const R = g.R, k = R ? R.id : '_'; let s = sec.get(k); if (!s) { s = { id: k, R, title: R ? R.name : 'Autres lieux', items: [] }; sec.set(k, s); } s.items.push(g); }
    const out = [...sec.values()];
    out.forEach(s => s.items.sort((a, b) => (b.last.date || 0) - (a.last.date || 0)));
    return out.sort((a, b) => b.items.reduce((m, g) => Math.max(m, g.last.date || 0), 0) - a.items.reduce((m, g) => Math.max(m, g.last.date || 0), 0));
  }
  const old = mdSort === 'old';
  places.sort((a, b) => old ? (a.list[a.list.length - 1].p.date || 0) - (b.list[b.list.length - 1].p.date || 0) : (b.last.date || 0) - (a.last.date || 0));
  for (const g of places) { const d = new Date((old ? g.list[g.list.length - 1].p.date : g.last.date) || 0), k = d.getFullYear() + '-' + d.getMonth(); let s = sec.get(k); if (!s) { s = { id: k, title: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), items: [] }; sec.set(k, s); } s.items.push(g); }
  return [...sec.values()];
}
function mdThumb(g) {
  const p = g.last, n = g.list.length;
  return `<button class="mdth" data-mdcard="${esc(g.k)}" aria-label="${esc(g.k)}${n > 1 ? `, ${n} cartes` : ''}"><span class="mdimg">${postcardSVG(p, 'md' + g.list[0].i)}</span>${n > 1 ? `<i class="mdn">×${n}</i>` : ''}<span class="mdcap"><b>${esc(g.k)}</b><small>${p.date ? new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</small></span></button>`;
}
function mdRenderAlbum(box) {
  const nCards = (S.album || []).length, groups = mdGroups(), nPlaces = groups.reduce((a, s) => a + s.items.length, 0);
  let nReg = 0, totReg = 0; try { totReg = REGIONS.length; nReg = REGIONS.filter(R => rgDiscovered(R.id)).length; } catch (e) { /* rien */ }
  let h = phead(null, 'Les cartes postales', `${nCards} carte${nCards > 1 ? 's' : ''} · ${nPlaces} lieu${nPlaces > 1 ? 'x' : ''}. Accrochez vos préférées aux murs de la maison.`);
  if (totReg) h += `<button class="mdreg" data-mdgo="reg"><b>${nReg}/${totReg}</b><span>régions visitées<small>Chaque voyage compte pour le codex des régions</small></span><em>Codex</em></button>`;
  if (!nCards) return void (box.innerHTML = h + `<p class="empty">L’album est vide. Chaque voyage rapporte des cartes postales.</p>`);
  h += `<div class="mdsort" role="group" aria-label="Trier">${[['region', 'Par région'], ['new', 'Récentes'], ['old', 'Anciennes']].map(([k, l]) => `<button class="${mdSort === k ? 'on' : ''}" data-mdsort="${k}" aria-pressed="${mdSort === k}">${l}</button>`).join('')}</div>`;
  groups.forEach((s, i) => {
    const n = s.items.reduce((a, g) => a + g.list.length, 0), open = mdOpen ? mdOpen.has(s.id) : i === 0;
    h += `<details class="mdsec" data-mdsec="${esc(String(s.id))}" ${open ? 'open' : ''} style="--rg:${s.R ? s.R.color : '#b9ad9a'}"><summary>${s.R && typeof rgIcon === 'function' ? rgIcon(s.R, 's') : ''}<b>${esc(s.title)}</b><small>${s.items.length} lieu${s.items.length > 1 ? 'x' : ''} · ${n} carte${n > 1 ? 's' : ''}</small>${s.R ? `<span class="mdcx" data-rgopen="${s.R.id}" role="button">Codex</span>` : ''}</summary><div class="mdgrid">${s.items.map(mdThumb).join('')}</div></details>`;
  });
  box.innerHTML = h;
}
function mdShowCard(k, idx) {
  const list = (S.album || []).filter(p => mdKey(p) === k).sort((a, b) => (b.date || 0) - (a.date || 0)); if (!list.length) return;
  const i = Math.max(0, Math.min(list.length - 1, idx || 0)), p = list[i], R = mdRegionOf(p);
  showModal(`<div class="mdbig"><figure class="pc">${postcardSVG(p, 'mdb' + i)}</figure><h2>${esc(p.title || p.place || '')}</h2><p class="small">${R ? esc(R.name) + ' · ' : ''}${p.date ? new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}${p.comp && CHARS[p.comp] ? ' · ' + esc(CHARS[p.comp].name) : ''}</p>${list.length > 1 ? `<div class="mdmore">${list.map((x, j) => `<button class="${j === i ? 'on' : ''}" data-mdcard="${esc(k)}" data-mdi="${j}">${new Date(x.date || 0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</button>`).join('')}</div>` : ''}<button class="btn green big" data-closemodal="1">Fermer</button></div>`);
}
if (typeof renderAlbum === 'function') renderAlbum = function (box) { try { return mdRenderAlbum(box); } catch (e) { console.error('album', e); box.innerHTML = '<p class="empty">Album indisponible.</p>'; } };
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-mdsort],[data-mdcard],[data-mdgo]'); if (!el) return;
  const d = el.dataset;
  if (d.mdsort) { mdSort = d.mdsort; mdOpen = null; renderPanel(); return; }
  if (d.mdcard) { mdShowCard(d.mdcard, +d.mdi || 0); return; }
  if (d.mdgo === 'reg') { sacView = 'reg'; tab = 'sac'; renderPanel(); try { $('panelBody').scrollTop = 0; } catch (e) {} }
});
document.addEventListener('toggle', ev => { const el = ev.target; if (!el || !el.matches || !el.matches('details.mdsec')) return; if (!mdOpen) mdOpen = new Set([...document.querySelectorAll('details.mdsec[open]')].map(x => x.dataset.mdsec)); if (el.open) mdOpen.add(el.dataset.mdsec); else mdOpen.delete(el.dataset.mdsec); }, true);

// ---------------- styles ----------------
(function mdStyle() {
  if (document.getElementById('md-style')) return;
  const st = document.createElement('style'); st.id = 'md-style';
  st.textContent = `.mdreg{display:flex;align-items:center;gap:10px;width:100%;margin:6px 0 10px;padding:8px 12px;border:2px solid #e3d6c0;border-radius:14px;background:#fffaf0;font:inherit;color:inherit;text-align:left;cursor:pointer}
.mdreg b{font-size:1.25rem;color:#4f88cf}.mdreg span{flex:1;display:flex;flex-direction:column;font-weight:700}.mdreg small{font-weight:500;opacity:.75}.mdreg em{font-style:normal;font-weight:700;color:#fff;background:#4f88cf;border-radius:999px;padding:3px 10px}
.mdsort{display:flex;gap:6px;margin:0 0 10px}.mdsort button{flex:1;padding:7px 4px;border:2px solid #e3d6c0;border-radius:999px;background:#fff;font:inherit;font-weight:700;cursor:pointer}.mdsort button.on{background:#5b4636;color:#fff;border-color:#5b4636}
.mdsec{margin:0 0 8px;border:2px solid #eadfcd;border-left:6px solid var(--rg);border-radius:14px;background:#fffdf8}
.mdsec summary{display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:pointer;list-style:none}.mdsec summary::-webkit-details-marker{display:none}
.mdsec summary b{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mdsec summary small{flex:1;opacity:.7;white-space:nowrap}
.mdcx{font-size:.8rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--rg);color:#fff}
.mdgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px;padding:0 8px 10px}
.mdth{position:relative;display:flex;flex-direction:column;padding:4px;border:none;border-radius:10px;background:#fff;box-shadow:0 2px 0 #e3d6c0;font:inherit;color:inherit;cursor:pointer;text-align:left;min-width:0}
.mdimg svg{display:block;width:100%;height:auto;border-radius:6px}.mdn{position:absolute;top:2px;right:2px;font-style:normal;font-weight:800;font-size:.75rem;background:#e5584f;color:#fff;border-radius:999px;padding:1px 7px}
.mdcap{display:flex;flex-direction:column;padding:3px 2px 0;line-height:1.15;min-width:0}.mdcap b{font-size:.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mdcap small{font-size:.7rem;opacity:.7}
.mdbig .pc svg{width:100%;height:auto;display:block}.mdbig h2{margin:8px 0 2px}.mdmore{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.mdmore button{padding:4px 10px;border:2px solid #e3d6c0;border-radius:999px;background:#fff;font:inherit;cursor:pointer}.mdmore button.on{background:#5b4636;color:#fff}
.cfnone{opacity:.8}.rgwh{display:block;font-size:.7rem;opacity:.75;line-height:1.15}
@media (min-width:900px){.mdgrid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}}`;
  document.head.appendChild(st);
})();
window.__monde = { groups: mdGroups, showCard: mdShowCard, stamp: mdStampPhoto,
  // outils de test (lecture seule, comme window.__butin)
  api: () => ({ S, POI_CATS, PLACES, lootFor, rgBeforeCollect, btRemember, nsPickSp, nsWhere, rgZoneAt, btWhereShort, postcardSVG, openSheet, renderPanel, setCtx: p => { btCtx = p; }, setSac: v => { sacView = v; } }) };

// ================= 93 · DEUX VUES : « MON COIN » ET « LE MONDE » (v89) =================
// Le joueur (18/11) : « les échelles sont démesurées, je dois zoomer longtemps pour revenir à mon emplacement ».
//  1. Deux vues, un seul bouton pour basculer (animation douce) :
//     - Mon coin : cadrée sur la portée de voyage du compagnon choisi, avec les lieux du quotidien ; noms de régions et passages cachés ;
//     - Le monde : toute la zone ouverte, avec les régions fermées voisines (🔒) et les passages.
//  2. La carte revient d'elle-même sur « Mon coin » au lancement et au retour d'un compagnon ;
//     on ne peut pas dézoomer au-delà de la zone ouverte.
const vw$ = (f, d) => { try { return f(); } catch (e) { return d; } };
let vwMode = 'coin';
function vwCoinBox() {
  const h = vw$(() => homeObj(), null); if (!h) return null;
  const km = Math.max(25, Math.min(400, vw$(() => dfRange(S.sel).km, 60) || 60));
  const dLat = km / 111, dLon = km / (111 * Math.max(0.2, Math.cos(h.lat * Math.PI / 180)));
  return [[h.lon - dLon, h.lat - dLat], [h.lon + dLon, h.lat + dLat]];
}
function vwWorldBox() {
  const { set, G } = vw$(() => rcCells(), { set: new Set(), G: 1 }); if (!set.size) return null;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  set.forEach(k => { const i = k.indexOf('_'), x = +k.slice(0, i), y = +k.slice(i + 1); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
  const mx = Math.max(1.2, (x1 - x0 + 1) * G * 0.35), my = Math.max(1, (y1 - y0 + 1) * G * 0.35);
  return [[x0 * G - mx, y0 * G - my], [(x1 + 1) * G + mx, (y1 + 1) * G + my]];
}
const vwPad = () => ({ top: 150, bottom: 190, left: 30, right: 70 });
function vwGo(mode, instant) {
  if (typeof map === 'undefined' || !map || !map.fitBounds) return;
  const B = mode === 'monde' ? vwWorldBox() : vwCoinBox(); if (!B) return;
  const c = vw$(() => map.cameraForBounds(B, { padding: vwPad() }), null); if (!c) return;
  const to = { center: c.center, zoom: Math.min(13, c.zoom), bearing: 0, pitch: 0 };
  vw$(() => instant ? map.jumpTo(to) : map.flyTo(Object.assign({ duration: 1400, essential: true }, to)));
  vwMode = mode; vwSync();
}
function vwMinZoom() {
  const B = vwWorldBox(); if (!B || !map.cameraForBounds) return;
  const c = vw$(() => map.cameraForBounds(B, { padding: vwPad() }), null); if (!c) return;
  const z = Math.max(1, c.zoom - 0.6); if (Math.abs((map.getMinZoom() || 0) - z) > 0.05) vw$(() => map.setMinZoom(z));
}
// la vue suit le zoom : on passe en « monde » quand on dézoome nettement au-delà de son coin
function vwAuto() {
  if (typeof map === 'undefined' || !map || !map.getZoom) return;
  const B = vwCoinBox(); if (!B || !map.cameraForBounds) return;
  const c = vw$(() => map.cameraForBounds(B, { padding: vwPad() }), null); if (!c) return;
  const cut = c.zoom - 0.8;
  const m = map.getZoom() < cut ? 'monde' : 'coin';
  if (m !== vwMode) { vwMode = m; vwSync(); }
}
function vwSync() {
  const ov = document.getElementById('ov'); if (ov) { ov.classList.toggle('vw-coin', vwMode === 'coin'); ov.classList.toggle('vw-monde', vwMode === 'monde'); }
  const b = document.getElementById('vwBtn'); if (b) { const toW = vwMode === 'coin'; b.innerHTML = `<span>${toW ? '🗺️' : '🏠'}</span><small>${toW ? 'Le monde' : 'Mon coin'}</small>`; b.setAttribute('aria-label', toW ? 'Voir le monde' : 'Revenir à mon coin'); }
}
function vwBtn() {
  const z = document.querySelector('.zoom'); if (!z || document.getElementById('vwBtn')) return;
  const b = document.createElement('button'); b.id = 'vwBtn'; b.type = 'button'; b.className = 'icon-btn vw-btn';
  const m = document.getElementById('cmMore'); if (m) m.insertAdjacentElement('beforebegin', b); else z.appendChild(b);
  vwSync();
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('#vwBtn'); if (!b) return;
  ev.stopPropagation(); ev.preventDefault();
  vwGo(vwMode === 'coin' ? 'monde' : 'coin');
}, true);
// au lancement : sur son coin
let vwBooted = false;
function vwBoot() {
  if (vwBooted || typeof map === 'undefined' || !map || !map.cameraForBounds || !vw$(() => map.getStyle(), null)) return;
  if (document.body.classList.contains('firstrun')) return;
  vwBooted = true; vwGo('coin', true);
  map.on('zoomend', () => vw$(vwAuto));
}
// au retour d'un compagnon : sur son coin
if (typeof collect === 'function') collect = (orig => function () { const r = orig.apply(this, arguments); setTimeout(() => vw$(() => { if (vwMode === 'monde') vwGo('coin'); }), 1200); return r; })(collect);
setInterval(() => { if (document.hidden) return; vw$(vwBtn); vw$(vwBoot); vw$(vwMinZoom); vw$(vwSync); }, 1500);
window.__vw = { go: m => vwGo(m), mode: () => vwMode };

{
  const css = document.createElement('style');
  css.textContent = `
#cmMore{display:none!important}
.vw-btn{flex-direction:column;gap:0;width:44px!important;min-width:0;height:44px!important;padding:0!important;overflow:hidden}
.vw-btn span{font-size:17px;line-height:1}.vw-btn small{font:800 8px/1.1 var(--body,system-ui);color:#4a3528;white-space:nowrap;letter-spacing:-.1px}
#ov.vw-coin .fdl,#ov.vw-coin .psg{display:none!important}
.ex-q{display:none!important} /* les « ? » de l’ancien carnet (secrets du brouillard) */
`;
  document.head.appendChild(css);
}

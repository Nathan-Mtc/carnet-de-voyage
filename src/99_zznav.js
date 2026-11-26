// ================= NAVIGUER EN TOUCHANT, SANS PINCER (v212) =================
// Le joueur : « éviter de tout le temps zoomer avec 2 doigts, sans boutons + et − ». Ses choix (26/11) :
//  - toucher un endroit vide de la carte dézoomée → la carte s'en rapproche ;
//  - toucher le nom d'une région (vue Monde) → la carte plonge dessus (avant : sa fiche) ;
//  - choisir une destination → la carte montre d'un coup la maison et le lieu ;
//  - au retour d'un voyage → la carte ne bouge pas.
const nv$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('navigation', e); return d; } };
const NV_FAR = 10.5; // en dessous de ce zoom, un toucher dans le vide = se rapprocher

// 1) toucher dans le vide : se rapprocher (sauf sur un lieu célèbre touché pile, ou une région fermée : leur fiche s'ouvre)
pickPoint = (orig => function (lon, lat) {
  const z = nv$(() => map.getZoom(), 20);
  if (z < NV_FAR && !nv$(() => S.trips[S.sel], false)) {
    const closed = nv$(() => { const R = regionAt(lon, lat); return R && rcOk(R) && !rcIsOpen(R.id); }, false);
    if (closed) return; // 92_fond ouvre la fiche de la région fermée
    const pt = nv$(() => map.project([lon, lat]), null);
    const onPlace = pt && nv$(() => PLACES.some(p => { const q = map.project([p.lon, p.lat]); return Math.hypot(q.x - pt.x, q.y - pt.y) < 26; }), false);
    if (!onPlace) { nv$(() => map.flyTo({ center: [lon, lat], zoom: Math.min(13, z + 2.5), duration: 700, essential: true })); return; }
  }
  return orig.apply(this, arguments);
})(pickPoint);

// 2) toucher le nom d'une région ouverte : la carte plonge dessus (la fiche reste dans le carnet et sur la fiche de départ)
window.addEventListener('click', ev => {
  const c = ev.target.closest && ev.target.closest('.sctl[data-sctreg]'); if (!c) return;
  ev.stopPropagation(); ev.preventDefault();
  const R = RG[c.dataset.sctreg]; if (!R) return;
  nv$(() => map.flyTo({ center: R.anchor, zoom: Math.max(nv$(() => map.getZoom(), 5) + 2, 8), duration: 900, essential: true }));
}, true);

// 3) choisir une destination : on voit la maison et le lieu ensemble (si l'un des deux est hors de l'écran)
const nvFrame = () => nv$(() => {
  const d = plan.dest, h = homeObj(); if (!d || !h || !isFinite(+d.lon) || d.tuto || document.body.classList.contains('firstrun')) return;
  const B = map.getBounds(); if (B.contains([+d.lon, +d.lat]) && B.contains([h.lon, h.lat])) return;
  const km = kmBetween(h, d); if (km < 0.05) return;
  map.fitBounds([[Math.min(d.lon, h.lon), Math.min(d.lat, h.lat)], [Math.max(d.lon, h.lon), Math.max(d.lat, h.lat)]], { padding: { top: 150, bottom: Math.round(innerHeight * 0.55), left: 50, right: 80 }, maxZoom: 15, duration: 900, essential: true });
});
choosePOI = (orig => function () { const r = orig.apply(this, arguments); setTimeout(nvFrame, 60); return r; })(choosePOI);
choosePlace = (orig => function () { const r = orig.apply(this, arguments); setTimeout(nvFrame, 60); return r; })(choosePlace);

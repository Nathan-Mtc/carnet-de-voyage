// ================= DES COMMERCES DANS CHAQUE VILLAGE (v169) =================
// Le joueur : « en dehors de Lyon, je ne vois que de la campagne : aucune boutique, restaurant, café, parc à visiter ».
// Deux causes : 1) les vrais lieux n'apparaissaient qu'au zoom 14 (on ne les voyait pas à l'échelle d'un village) ;
// 2) beaucoup de villages n'ont presque aucun commerce dans les données de la carte.
// - Les vrais lieux s'affichent dès le zoom 13.
// - Un village (ou un quartier de ville presque vide, comme une zone d'activités) qui a moins de 2 commerces connus reçoit un petit centre plausible et toujours le même (tirage fixé par le village) :
//   mairie, boulangerie, café, épicerie ou marché, restaurant, square. Un hameau : parfois un café ou une ferme.
const zv$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const ZV_SHOP = ['boulangerie', 'cafe', 'restaurant', 'marche', 'epicerie', 'fromagerie', 'boucherie', 'caviste', 'chocolaterie', 'poissonnerie', 'fleuriste', 'librairie', 'boutique', 'pharmacie', 'mairie', 'poste'];
// [catégorie, chance] pour un village, et pour un hameau
const ZV_SET = { village: [['mairie', .9], ['boulangerie', .85], ['cafe', .75], ['marche', .5], ['restaurant', .55], ['parc', .45], ['epicerie', .3], ['fleuriste', .15], ['pharmacie', .25]],
  hamlet: [['cafe', .25], ['ferme', .5], ['jardin', .25]],
  quartier: [['boulangerie', .8], ['cafe', .8], ['restaurant', .7], ['epicerie', .5], ['parc', .4], ['librairie', .2], ['fleuriste', .2], ['pharmacie', .3]] };
function zvPOIs(have) {
  if (!map || !mapReady) return [];
  let vil = [], real = [];
  zv$(() => { vil = map.queryRenderedFeatures({ layers: ['place-small'] }).filter(f => ['village', 'hamlet', 'suburb', 'neighbourhood', 'quarter'].includes(f.properties.class) && f.geometry.type === 'Point' && (f.properties['name:fr'] || f.properties.name)); });
  zv$(() => { real = map.queryRenderedFeatures({ layers: ['poi-hit'] }).map(f => { const p = f.properties || {}; return { cat: OSM_CAT[p.subclass] || OSM_CAT[p.class], g: f.geometry.coordinates }; }).filter(x => x.cat && ZV_SHOP.includes(x.cat)); });
  const out = [], seen = new Set();
  for (const f of vil.slice(0, 40)) {
    const [lon, lat] = f.geometry.coordinates, nm = f.properties['name:fr'] || f.properties.name, cls = f.properties.class;
    const key = nm + '@' + lon.toFixed(3) + ',' + lat.toFixed(3); if (seen.has(key)) continue; seen.add(key);
    const urb = !['village', 'hamlet'].includes(cls), R = urb ? 0.5 : 0.8;
    const kmLon = 111 * Math.cos(lat * Math.PI / 180), near = q => Math.hypot((q[0] - lon) * kmLon, (q[1] - lat) * 111) < R;
    const n = real.filter(x => near(x.g)).length + have.filter(p => ZV_SHOP.includes(p.cat) && near([p.lon, p.lat])).length;
    if (n >= 2) continue;
    const rn = rng(hashStr('zv' + key));
    for (const [cat, ch] of ZV_SET[urb ? 'quartier' : cls] || []) {
      if (rn() > ch || !POI_CATS[cat]) continue;
      const a = rn() * Math.PI * 2, d = (cls === 'hamlet' ? 0.05 : 0.08) + rn() * (cls === 'hamlet' ? 0.2 : 0.32);
      const plon = lon + Math.cos(a) * d / kmLon, plat = lat + Math.sin(a) * d / 111;
      if (zv$(() => !isLand(plon, plat), false)) continue;
      const tpl = (cat === 'mairie' ? ['Mairie de {V}'] : POI_NAMES[cat] || [POI_CATS[cat][0]]);
      const name = cat === 'mairie' ? `Mairie de ${nm}` : zv$(() => fillName(pick3(tpl.filter(t => !t.includes('{V}')).length ? tpl.filter(t => !t.includes('{V}')) : tpl, rn), rn, nm), POI_CATS[cat][0]);
      out.push({ id: 'zv' + hashStr(key + cat), cat, name, lon: plon, lat: plat, city: nm, imp: 0.3 + rn() * 0.3, gen: 'village' });
    }
  }
  return out;
}
tilesPOIs = (orig => function (z) {
  const out = orig.apply(this, arguments);
  if (z >= 13) zv$(() => out.push(...zvPOIs(out)));
  return out;
})(tilesPOIs);

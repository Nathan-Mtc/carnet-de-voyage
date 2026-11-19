// ================= 99 · RÉÉQUILIBRAGE DU BUTIN (v103, 19/11) =================
// Audit : 7 à 12 objets par « coup d'œil » de 2 minutes, une trouvaille épique un voyage sur deux, une légendaire dès le
// 3e voyage, 118 objets dans le sac après 17 voyages. Plus rien n'avait de valeur (raretés, pièces, merci des clients).
// Ligne directrice : la valeur vient de la distance et des clients, pas du hasard.
// Au retour (juste avant l'affichage du butin), sur ce qui a été trouvé au hasard :
//  1. les raretés hautes deviennent vraiment rares : épique et légendaire seulement sur un voyage ambitieux (≥ 60 km ou
//     séjour d'au moins 30 min), et pas toujours (épique 40 %, légendaire 20 %) ; rare gardé 60 % ;
//  2. un plafond selon la durée du séjour : 3 (coup d'œil), 4 (balade), 5 (exploration), 7 (grande exploration), 9 (expédition).
// Jamais retiré : ce qu'on a gagné en jouant un moment fort, ce que demande un client, les objets de quête (mot, appât, œuf),
// le souvenir unique du lieu.
const zb$ = (f, d) => { try { return f(); } catch (e) { return d; } };
// l'ambition du voyage, fixée au départ
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k], d = zb$(() => plan.dest, null), dur = zb$(() => plan.dur, '');
  const r = orig.apply(this, arguments);
  zb$(() => { const t = S.trips[k]; if (t && t !== before) t.zbAmb = (kmExact(homeObj(), d) >= 60 || ['moyen', 'long', 'expe'].includes(dur)) ? 1 : 0; });
  return r;
})(startTrip);
// ce qui est gagné pendant un moment fort joué : on le marque quand le moment se termine
setInterval(() => zb$(() => Object.values(S.trips || {}).forEach(t => {
  if (!t || !t.mf || !Array.isArray(t.bag)) return;
  if (t.mf.st !== 'done') { t.zbPre = t.bag.map(i => i && i.id); return; }
  if (t.zbMfOk) return; t.zbMfOk = 1;
  const pre = new Set(t.zbPre || []); t.bag.forEach(i => { if (i && !pre.has(i.id)) i.mfw = 1; });
})), 700);
const ZB_CAP = { eclair: 3, court: 4, moyen: 5, long: 7, expe: 9 };
const zbWanted = it => zb$(() => bqState().orders.some(o => o.req.some(r => r.name === it.name || (r.rid && RG_RES[r.rid] && RG_RES[r.rid].name === it.name))), false);
const zbSafe = it => !!(it.mfw || it.special || it.near === undefined && false || ['lettre', 'appat', 'oeuf'].includes(it.sub) || /\bde Lieu\b|Souvenir/.test(it.from || '') || zbWanted(it));
function zbTrim(t, items, bonus, rar) {
  const key = zb$(() => (DURS.find(d => (d.ms || 0) === (t.stay || 0)) || {}).key, null) || 'eclair';
  const amb = !!t.zbAmb, cap = (ZB_CAP[key] || 4) + (bonus || 0), gone = new Set();
  let free = items.filter(it => it && !zbSafe(it));
  if (rar) free.forEach(it => {
    const keep = [1, 1, 0.6, amb ? 0.4 : 0, amb ? 0.2 : 0][it.rarity] ?? 1;
    if (Math.random() >= keep) gone.add(it);
  });
  free = free.filter(it => !gone.has(it));
  if (free.length > cap) free.slice().sort((a, b) => (b.rarity - a.rarity) || (Math.random() - 0.5)).slice(cap).forEach(it => gone.add(it));
  if (!gone.size) return items;
  const ids = new Set([...gone].map(i => i.id));
  S.inv = S.inv.filter(i => !i || !ids.has(i.id));
  return items.filter(i => !i || !ids.has(i.id));
}
// avant tout le reste du retour (contrats, succès… comptent sur le vrai butin) : raretés et plafond sur le sac
if (typeof collect === 'function') collect = (orig => function () {
  zb$(() => Object.values(S.trips || {}).forEach(t => { if (t && t.done && !t.tuto && Array.isArray(t.bag) && !t.zbCut) { t.zbCut = 1; t.bag = zbTrim(t, t.bag, 0, true); } }));
  return orig.apply(this, arguments);
})(collect);
// à l'affichage : ce qui s'est ajouté au retour (coffres, morceaux de carte…) ne dépasse pas 2 objets de plus
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  zb$(() => { if (h && h.trip && Array.isArray(h.items) && !h.trip.tuto) { const keep = zbTrim(h.trip, h.items, 2, false); h.items.splice(0, h.items.length, ...keep); } });
  return orig.apply(this, arguments);
})(showHaul);

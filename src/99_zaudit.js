// ================= 99 · CORRECTIONS DE L'AUDIT COMPLET (v102, 19/11) =================
// 1. Chapitre 1 « Vivre un moment fort » : seul un moment JOUÉ et encore visible comptait (vérifié toutes les 2,5 s).
//    Un joueur qui ne joue pas les moments, ou qui ramasse vite, restait bloqué au chapitre 1. On compte au retour du voyage,
//    joué ou non (le compagnon l'a vécu).
const za$ = (f, d) => { try { return f(); } catch (e) { return d; } };
GAME.on('trip:return', e => za$(() => { const t = e && e.trip; if (t && !t.tuto && t.mf && (t.mf.st === 'done' || t.mf.st === 'auto' || t.mf.st === 'ready')) { const s = akSt(); if (!s.mf) { s.mf = 1; save(); } } }));
// 2. Chapitre 4 « Un nouveau compagnon » passait tout seul (le compte de départ des compagnons était pris avant la 1re éclosion).
//    On compte maintenant les compagnons au moment où le chapitre 4 commence.
za$(() => {
  const C = AK_CH.find(c => c.nm === 'Un nouveau compagnon'); if (!C) return;
  const base = () => { const s = akSt(); if (s.c4base == null && s.ch === 4) { s.c4base = Object.keys(S.comps || {}).length; save(); } return s.c4base == null ? 1e9 : s.c4base; };
  const more = () => Object.keys(S.comps || {}).length > base();
  C.steps[0].ok = () => (S.inv || []).some(i => i && i.sub === 'appat') || more();
  C.steps[1].ok = more;
});
// 3. Les récompenses affichées de l'étape « habitant » : voir 99_route.js (clé choisie d'après le texte de l'étape).
// 4. Chapitre 4 : dire ce qu'il manque pour l'appât, et où le trouver (le joueur ne savait pas où chercher le fromage)
za$(() => {
  const C = AK_CH.find(c => c.nm === 'Un nouveau compagnon'); if (!C) return;
  C.steps[0].sub = () => za$(() => {
    const R = RECIPES.find(r => /^hb_/.test(r.id) && sctSt().learn[r.sp]); if (!R) return 'Sa recette est dans son camp.';
    const miss = R.ing.filter(([k, n]) => za$(() => S.inv.filter(i => ING[k] && ING[k][0].includes(i.sub)).length, 0) < n).map(([k, n]) => { const c = za$(() => bqCatFor(k), null), w = c && POI_CATS[c] ? POI_CATS[c][0].toLowerCase() : ''; return `${n} ${ING[k] ? ING[k][1].toLowerCase() : k}${w ? ` (${w})` : ''}`; });
    return miss.length ? `« ${R.out[0]} » : il vous manque ${miss.join(', ')}.` : `Vous avez tout : fabriquez « ${R.out[0]} » à l’Herboristerie.`;
  }, '');
});
// 5. Les habitants revenaient presque à chaque voyage (7 voyages sur 10, souvent le même) tant qu'on ne les avait pas aidés,
//    et chassaient les autres moments forts. Après une rencontre, on laisse passer 3 voyages avant le suivant.
if (typeof psNeedGear === 'function') psNeedGear = (orig => function () { return za$(() => (S.ps && S.ps.habCd > 0) ? [] : orig.apply(this, arguments), []); })(psNeedGear);
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  za$(() => { if (S.ps && S.ps.habCd > 0) S.ps.habCd--; });
  const r = orig.apply(this, arguments);
  za$(() => { const t = S.trips[k]; if (t && t !== before && t.mf && String(t.mf.id || '').startsWith('hab_')) { S.ps.habCd = 4; save(); } });
  return r;
})(startTrip);

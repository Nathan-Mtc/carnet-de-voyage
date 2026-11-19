// ================= LE SAC S'ADAPTE AU LIEU (v162) =================
// Le joueur : « en préparation, j'aimerais plus de diversité que crampons et un truc à emporter à chaque fois, et que ce soit pertinent ».
// Chaque destination affiche 1 à 3 BESOINS tirés du réel : terrain (montagne, mer, marais…), heure (la nuit), saison
// (l'hiver en montagne, l'été dans le Sud), distance (la longue route), faune qui vit là, grande ville.
// Un lieu du quotidien à moins de 30 km : aucun besoin. Le Mont-Blanc la nuit en novembre : trois.
// - Chaque besoin se couvre de plusieurs façons (matériel équipé, plat du sac à provisions, appât).
// - Jamais obligatoire : couvert = meilleur butin et moins de risques ; manquant = trajet plus long (+15 %) et plus de risques.
// - Un compagnon « chez lui » (99_zfaune.js) n'a pas le besoin de son terrain (la marmotte n'a pas besoin de corde).
// - « Préparer pour moi » équipe et remplit le sac avec ce que vous avez déjà, et dit ce qui manque.
// - 7 nouveaux objets de matériel (corde, lanterne, bonnet et moufles, chapeau de paille, bottes de marais, ciré, plan de métro),
//   fabriqués à l'atelier comme les autres. Les 4 cases de matériel restent (repliées : « à la main »).
const sc$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('sac', e); return d; } };

// ---------- les nouveaux objets de matériel ----------
const SC_GEAR = [
  ['corde', ['Corde d’alpinisme', 'Corde d’alpinisme pro', 'Corde d’alpinisme légendaire'], 'Escalade et hauteurs', '#c98a5a', ['montagne'], '', 'corde', [['tissu', 2], ['laine', 1]], [['tissu', 3], ['metal', 2], ['laine', 2]]],
  ['lanterne', ['Lanterne de bivouac', 'Lanterne de bivouac pro', 'Lanterne de bivouac légendaire'], 'Marcher la nuit', '#f2c14e', [], 'night', 'lampe', [['verre', 1], ['metal', 1]], [['verre', 2], ['metal', 2], ['lumiere', 1]]],
  ['bonnet', ['Bonnet et moufles', 'Bonnet et moufles pro', 'Bonnet et moufles légendaires'], 'Le froid', '#e9809a', ['froid'], '', '', [['laine', 2]], [['laine', 3], ['plume', 1], ['tissu', 1]]],
  ['chapeau', ['Chapeau de paille', 'Chapeau de paille pro', 'Chapeau de paille légendaire'], 'Soleil et chaleur', '#e9c46a', ['desert'], '', '', [['feuille', 2], ['tissu', 1]], [['feuille', 3], ['tissu', 2], ['sable', 1]]],
  ['bottes', ['Bottes de marais', 'Bottes de marais pro', 'Bottes de marais légendaires'], 'Marais, rivières, boue', '#6fae5f', [], '', '', [['tissu', 1], ['metal', 1]], [['tissu', 2], ['metal', 1], ['coquillage', 1]]],
  ['cire', ['Ciré de marin', 'Ciré de marin pro', 'Ciré de marin légendaire'], 'Embruns et tempêtes', '#f2c94e', ['mer'], '', '', [['tissu', 2]], [['tissu', 3], ['coquillage', 2]]],
  ['plan', ['Plan de métro', 'Plan de métro pro', 'Plan de métro légendaire'], 'Les grandes villes', '#4f88cf', ['ville'], '', '', [['papier', 1]], [['papier', 2], ['metal', 1]]],
];
sc$(() => {
  for (const G of SC_GEAR) {
    if (XP_G[G[0]]) continue;
    const g = G.slice(0, 7); XP_GEAR.push(g); XP_G[G[0]] = g; G[1].forEach((n, i) => { XP_GBY[n] = { g: G[0], tier: i + 1 }; });
    RECIPES.push({ id: `xg_${G[0]}1`, kind: 'Équipement', out: xpGearDef(G[0], 1), ing: G[7], coins: 15 });
    RECIPES.push({ id: `xg_${G[0]}2`, kind: 'Équipement', out: xpGearDef(G[0], 2), ing: G[8], coins: 80 });
    ING['xgp_' + G[0]] = [['outil'], G[1][1]];
    RECIPES.push({ id: `xg_${G[0]}3`, kind: 'Équipement', out: xpGearDef(G[0], 3), ing: [['xgp_' + G[0], 1], ['gemme', 1]], coins: 150 });
  }
  if (!ING.papier) ING.papier = [['papier', 'carte', 'livre'], 'Papier'];
  // petits dessins
  ICO.scBonnet = ['#e9809a', c => iP('M10 22 Q10 8 20 8 Q30 8 30 22Z', c) + iR(8, 21, 24, 6, 3, '#fffaf2', 1.3) + iC(20, 7, 3, '#fffaf2', 1.1) + iP('M6 30 q0 -4 4 -4 h3 v8 h-4 q-3 0 -3 -4Z', c, 1.1) + iP('M34 30 q0 -4 -4 -4 h-3 v8 h4 q3 0 3 -4Z', c, 1.1)];
  ICO.scChapeau = ['#e9c46a', c => iP('M4 26 Q20 33 36 26 Q32 22 28 22 Q28 10 20 10 Q12 10 12 22 Q8 22 4 26Z', c) + iL('M12 21 Q20 25 28 21', '#d9604f', 2.4) + iL('M15 14 l2 6 M21 12 l0 7 M25 14 l-2 6', IL, 0.9)];
  ICO.scBottes = ['#6fae5f', c => iP('M8 8 H17 V26 Q17 31 22 31 H24 V35 H8Z', c) + iP('M21 8 H30 V26 Q30 31 35 31 H36 V35 H21 V31', c) + iL('M8 13 H17 M21 13 H30', '#fffaf2', 1.4)];
  ICO.scCire = ['#f2c94e', c => iP('M14 6 L20 9 L26 6 L34 13 L30 19 L28 17 V35 H12 V17 L10 19 L6 13Z', c) + iL('M20 10 V35', IL, 1.3) + iP('M15 5 Q20 1 25 5 L20 9Z', c, 1.1)];
  ICO_RULES.unshift([/bonnet et moufles/, 'scBonnet'], [/chapeau de paille/, 'scChapeau'], [/bottes de marais/, 'scBottes'], [/cire de marin/, 'scCire']);
});

// ---------- les besoins ----------
// gear : matériel qui couvre ; prov : sorte de plat qui couvre ; ter : terrain d'un compagnon qui en dispense ; bonus : facultatif (aucune pénalité)
const SC_NEEDS = {
  hauteur: { ico: '🧗', nm: 'La hauteur', gear: ['crampons', 'corde'], ter: ['montagne'], fx: 'grimper sans glisser' },
  froid: { ico: '🥶', nm: 'Le froid', gear: ['manteau', 'bonnet'], prov: 'chaud', ter: ['neige'], fx: 'rester au chaud' },
  mer: { ico: '🌊', nm: 'Les vagues', gear: ['palmes', 'cire'], ter: ['mer'], fx: 'nager et braver les embruns' },
  eau: { ico: '🥾', nm: 'Les pieds dans l’eau', gear: ['bottes', 'palmes'], ter: ['marais', 'riviere'], fx: 'traverser la boue et les gués' },
  chaleur: { ico: '☀️', nm: 'La chaleur', gear: ['gourde', 'chapeau'], prov: 'frais', ter: ['desert'], fx: 'ne pas avoir trop chaud' },
  nuit: { ico: '🌙', nm: 'La nuit', gear: ['lampe', 'lanterne'], fx: 'voir où l’on marche' },
  loin: { ico: '🍱', nm: 'La longue route', prov: 'end', fx: 'tenir la distance' },
  faune: { ico: '🔭', nm: 'La faune', gear: ['jumelles'], bait: 1, bonus: 1, fx: 'plus de chances de rencontre' },
  ville: { ico: '🚇', nm: 'La grande ville', gear: ['plan'], ter: ['ville'], bonus: 1, fx: 'trajet −10 % en métro' },
};
const SC_ORDER = ['hauteur', 'froid', 'mer', 'eau', 'chaleur', 'nuit', 'loin', 'faune', 'ville'];
const SC_SOUTH = ['paca', 'occitanie', 'corse', 'iberie', 'italie', 'mediterranee', 'afrique_nord', 'moyen_orient'];
function scKm(d) { return sc$(() => augOrigin(d).km, null) ?? sc$(() => kmExact(homeObj(), d), 0); }
// les besoins d'un lieu, maintenant (avec la raison tirée du réel)
function scNeedsOf(d) {
  if (!d || d.tuto) return [];
  const km = scKm(d) || 0; if (d.poi && km < 30) return []; // les lieux du quotidien, près de chez soi : juste récolter
  const T = faTerrOf(d), R = sc$(() => regionAt(d.lon, d.lat), null), rid = R ? R.id : '', sea = season(), lat = Math.abs(+d.lat || 0), out = [];
  const add = (id, why) => { if (!out.some(x => x.id === id)) out.push({ id, why }); };
  if (T.includes('montagne')) add('hauteur', 'Terrain de montagne');
  if (T.includes('neige')) add('froid', 'Neige');
  else if (T.includes('montagne') && sea === 'hiver') add('froid', 'Montagne en hiver');
  else if (lat >= 58 || rid === 'arctique') add('froid', 'Grand Nord');
  else if (sea === 'hiver' && lat >= 50 && km >= 250) add('froid', 'Hiver dans le Nord');
  if (T.includes('mer')) add('mer', 'Bord de mer');
  if (T.includes('marais') || T.includes('riviere')) add('eau', T.includes('marais') ? 'Marais' : 'Rivière, lac');
  if (T.includes('desert')) add('chaleur', 'Désert');
  else if (sea === 'été' && (SC_SOUTH.includes(rid) || lat < 40)) add('chaleur', 'Été dans le Sud');
  if (isNight() && T.some(t => t !== 'ville')) add('nuit', `Il fait nuit (${new Date().getHours()} h)`);
  if (km >= 250 && !d.poi) add('loin', `${Math.round(km).toLocaleString('fr-FR')} km de route`);
  const F = sc$(() => FA_SP.find(f => f.cond && !nsState().own[f.id] && faLives(f, d)), null);
  if (F) add('faune', `${F.nm} vit ici`);
  if (T.includes('ville') && km >= 30) add('ville', 'Grande ville');
  return SC_ORDER.map(id => out.find(x => x.id === id)).filter(Boolean).slice(0, 3).map(x => ({ ...x, F: x.id === 'faune' ? F : null }));
}
// couvert ? par quoi ?
function scCover(k, need) {
  const N = SC_NEEDS[need.id];
  if (N.ter && sc$(() => faCompTer(k).ter.some(t => N.ter.includes(t)), false)) return { by: `${faNm(k)} est ${faChez(k)}`, home: 1 };
  const it = sc$(() => xpEqItems(k).find(it => { const G = xpGearOf(it); return G && (N.gear || []).includes(G.g); }), null);
  if (it) return { by: it.name, gear: 1 };
  if (N.prov) { const rid = sc$(() => eqPlanProv().find(r => eqKindOf(r) === N.prov), null); if (rid) return { by: sc$(() => eqRName(rid), 'un plat'), prov: 1 }; }
  if (N.bait && need.F) { const b = sc$(() => nsState().bait, ''); if (b && sc$(() => HB_SP[b], '') === need.F.id) return { by: b, bait: 1 }; }
  return null;
}
function scState(k, d) {
  const L = scNeedsOf(d).map(n => ({ ...n, cov: scCover(k, n) }));
  const met = L.filter(n => n.cov && !n.cov.home).length, miss = L.filter(n => !n.cov && !SC_NEEDS[n.id].bonus).length;
  return { L, met, miss, ville: L.some(n => n.id === 'ville' && n.cov && !n.cov.home) };
}

// ---------- effets ----------
augRoadMs = (orig => function (d) {
  const A = orig.apply(this, arguments);
  sc$(() => {
    if (!d || d.tuto || !S.sel) return;
    const X = scState(S.sel, d); let f = 1 + 0.15 * X.miss; if (X.ville) f *= 0.9;
    if (f !== 1) { A.road = Math.max(60e3, Math.round(A.road * f / 5e3) * 5e3); A.sac = f; }
  });
  return A;
})(augRoadMs);
dfRiskOf = (orig => function (k, d) {
  const R = orig.apply(this, arguments);
  if (R && d) sc$(() => { const X = scState(k, d); R.r = Math.max(0.02, Math.min(0.95, R.r - 0.05 * X.met + 0.07 * X.miss)); if (R.no < R.r) R.no = R.r; });
  return R;
})(dfRiskOf);
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k], d = plan.dest, X = d ? sc$(() => scState(k, d), null) : null;
  const r = orig.apply(this, arguments);
  sc$(() => {
    const t = S.trips[k]; if (!t || t === before || t.tuto || !X || !X.L.length) return;
    t.sac = { met: X.L.filter(n => n.cov && !n.cov.home).map(n => n.id), miss: X.L.filter(n => !n.cov).map(n => n.id) };
    if (typeof t.luck === 'number') t.luck += 0.25 * X.met;
    const nm = faNm(k), ok = X.L.filter(n => n.cov).map(n => SC_NEEDS[n.id].nm.toLowerCase()), ko = X.L.filter(n => !n.cov && !SC_NEEDS[n.id].bonus).map(n => SC_NEEDS[n.id].nm.toLowerCase());
    if (ok.length || ko.length) t.journal.push({ t: Date.now(), kind: 'depart', text: `${nm} ${ok.length ? `est paré pour ${ok.join(', ')}` : ''}${ok.length && ko.length ? ', mais ' : ''}${ko.length ? `n’a rien prévu pour ${ko.join(', ')}` : ''}.` });
    save();
  });
  return r;
})(startTrip);
// jumelles ou appât pour la faune : un peu plus de chances de trouver un œuf
nsTripEgg = (orig => function (e) {
  const t = e && e.trip, N = nsState(), on = !!(t && t.sac && t.sac.met.includes('faune'));
  if (on) N.dry += 3;
  const r = orig.apply(this, arguments);
  if (on && !r) N.dry = Math.max(0, N.dry - 3);
  return r;
})(nsTripEgg);

// ---------- « Préparer pour moi » ----------
function scAuto(k, d) {
  const X = scState(k, d), done = [], left = [];
  const a = xpEq(k), needG = X.L.flatMap(n => SC_NEEDS[n.id].gear || []);
  const freeSlot = () => { for (let i = 0; i < XP_N; i++) if (!a[i]) return i; for (let i = 0; i < XP_N; i++) { const G = xpGearOf(S.inv.find(x => x.id === a[i])); if (!G || (G.g !== 'boussole' && !needG.includes(G.g))) return i; } return -1; };
  for (const n of X.L) {
    if (n.cov) continue;
    const N = SC_NEEDS[n.id]; let ok = false;
    for (const g of N.gear || []) { const it = sc$(() => ppOwned(k, g, 1), null); if (!it) continue; const s = freeSlot(); if (s < 0) break; a[s] = it.id; ok = true; done.push(it.name); break; }
    if (!ok && N.prov) {
      const st = sc$(() => eqStock(), {}), cur = eqPlanProv();
      const rid = Object.keys(st).find(r => eqKindOf(r) === N.prov && st[r] > cur.filter(x => x === r).length);
      if (rid && cur.length < 3) { plan.eqProv = cur.concat(rid); ok = true; done.push(sc$(() => eqRName(rid), 'un plat')); }
    }
    if (!ok && N.bait && n.F) { const b = S.inv.find(i => i && i.sub === 'appat' && sc$(() => HB_SP[i.name], '') === n.F.id); if (b) { nsState().bait = b.name; ok = true; done.push(b.name); } }
    if (!ok) left.push(n);
  }
  save(); renderAll();
  const miss = left.filter(n => !SC_NEEDS[n.id].bonus);
  toast(done.length ? `🎒 Ajouté : ${done.join(', ')}.${miss.length ? ` Il manque encore de quoi affronter ${miss.map(n => SC_NEEDS[n.id].nm.toLowerCase()).join(', ')} : à fabriquer à l’atelier.` : ' Tout est prêt !'}` : miss.length ? `Rien dans vos affaires pour ${miss.map(n => SC_NEEDS[n.id].nm.toLowerCase()).join(', ')} : touchez « Fabriquer ».` : 'Tout est déjà prêt !');
}

// ---------- l'affichage : « Ce qu'il faut ici » ----------
let scManOpen = false;
function scHTML(k, d) {
  const X = scState(k, d); if (!X.L.length) return '';
  const rows = X.L.map(n => {
    const N = SC_NEEDS[n.id], c = n.cov;
    let right;
    if (c) right = `<span class="sc-ok">✓ ${esc(c.by)}</span>`;
    else {
      const opts = (N.gear || []).map(g => ppNm(g, 1)).concat(N.prov ? [{ chaud: 'un plat chaud', frais: 'un plat frais', end: 'un plat d’endurance' }[N.prov]] : []).concat(N.bait && n.F ? [`l’appât « ${n.F.bait[0]} »`] : []);
      const g = (N.gear || []).find(g => !sc$(() => ppOwned(k, g, 1), null)) ;
      const A = g ? sc$(() => ppAction(k, g, 1), null) : null;
      right = `<span class="sc-ko">${N.bonus ? 'Facultatif' : 'Manquant'} · ${esc(opts.join(' ou '))}</span>${A && A.a === 'craft' ? `<button class="btn gold sm" data-prep="craft" data-pv="${esc(A.v)}" data-pg="${g}" data-pt="1" data-pk="${k}">Fabriquer</button>` : ''}`;
    }
    return `<li class="${c ? 'ok' : N.bonus ? 'opt' : 'ko'}"><span class="sc-i">${N.ico}</span><span class="sc-t"><b>${esc(N.nm)}</b><small>${esc(n.why)} · ${esc(N.fx)}</small></span><span class="sc-r">${right}</span></li>`;
  }).join('');
  const todo = X.L.some(n => !n.cov);
  const fx = [X.met ? `meilleur butin${X.met > 1 ? ` (×${X.met})` : ''}` : '', X.miss ? `trajet +${15 * X.miss} % et plus de risques` : '', X.ville ? 'métro : trajet −10 %' : ''].filter(Boolean).join(' · ');
  return `<div class="sc"><div class="sc-h"><b>🎒 Ce qu’il faut ici</b><small>${fx ? esc(fx) : 'tout est prêt'}</small></div><ul class="sc-l">${rows}</ul>${todo ? `<button class="btn green wide" data-scauto="1">Préparer pour moi</button>` : ''}</div>`;
}
renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  sc$(() => {
    const box = $('panelBody'), d = plan.dest, k = S.sel; if (!box || !d || S.trips[k] || d.tuto) return;
    const prep = box.querySelector('.dpt-prep') || box;
    const h = scHTML(k, d);
    if (h) { const at = prep.querySelector('.fa-tip') || prep.querySelector('.sct-tip') || prep.querySelector('.dpt-who2') || prep.querySelector('.trjline'); if (at) at.insertAdjacentHTML('afterend', h); else prep.insertAdjacentHTML('afterbegin', h); }
    // les 4 cases de matériel restent, repliées
    const wg = [...prep.querySelectorAll('.dpt-wg')].find(g => /Matériel/.test((g.querySelector('.dpt-wt') || {}).textContent || ''));
    if (wg && !wg.closest('details.sc-man')) {
      const det = document.createElement('details'); det.className = 'sc-man'; if (scManOpen || (typeof xpSlot !== 'undefined' && xpSlot != null)) det.open = true;
      det.innerHTML = '<summary>🧭 Matériel à la main (4 cases)</summary>';
      det.addEventListener('toggle', () => { scManOpen = det.open; });
      wg.before(det); det.appendChild(wg);
    }
  });
  return r;
})(renderVoyage);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-scauto]'); if (!b) return;
  ev.preventDefault(); sc$(() => scAuto(S.sel, plan.dest));
});
(function scStyle() {
  const st = document.createElement('style'); st.id = 'scStyle';
  st.textContent = `.sc{margin:6px 0 12px;padding:10px;border:2px solid var(--ink,#4a3528);border-radius:16px;background:#fffaf0;box-shadow:0 3px 0 rgba(74,53,40,.18)}
.sc-h{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 10px;margin-bottom:6px}.sc-h b{font:800 15px var(--display,inherit)}.sc-h small{font-size:12px;color:var(--ink2,#7a6250)}
.sc-l{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:6px}
.sc-l li{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:7px 9px;border-radius:12px;background:#fff;border:2px solid #f0c9c0}
.sc-l li.ok{border-color:#b9dfb0;background:#f3fbef}.sc-l li.opt{border-color:#e7dccb;border-style:dashed}
.sc-i{font-size:22px;flex:none}.sc-t{flex:1 1 140px;display:flex;flex-direction:column;min-width:0}.sc-t b{font-size:14px}.sc-t small{font-size:11.5px;color:var(--ink2,#7a6250)}
.sc-r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;justify-content:flex-end;flex:1 1 150px}
.sc-ok{font-size:12.5px;font-weight:700;color:#3f7f3a}.sc-ko{font-size:12px;color:#b8403a}.sc-l li.opt .sc-ko{color:var(--ink2,#7a6250)}
details.sc-man{margin:4px 0}details.sc-man>summary{cursor:pointer;font:800 12px var(--body,system-ui);letter-spacing:.04em;text-transform:uppercase;color:#9a8470;padding:6px 2px}`;
  document.head.appendChild(st);
})();
window.__sac = { needs: d => scNeedsOf(d), st: (k, d) => scState(k, d), auto: (k, d) => scAuto(k, d) };

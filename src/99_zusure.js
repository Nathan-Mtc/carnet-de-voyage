// ================= L'ÉQUIPEMENT SE MÉRITE ET S'USE (v176) =================
// Le joueur : « la difficulté pour fabriquer l'équipement doit suivre la difficulté d'accès des lieux » ; « oui pour l'usure ».
// 1) Fabriquer un équipement PRO demande des matériaux ★ rapportés de lieux à défi ; le LÉGENDAIRE, des matériaux ★★.
//    Pour ouvrir un défi ★★ il faut donc avoir réussi des ★ ; pour un ★★★, des ★★. (Le matériel de base reste au magasin.)
// 2) Chaque défi réussi use un peu l'équipement qui a ouvert le cadenas. Usé : il ne compte plus pour les défis
//    (il sert toujours pour les voyages ordinaires, rien d'autre ne change) ; on le répare avec des matériaux de défi.
const us$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('usure', e); return d; } };

// famille de lieux dont viennent les matériaux de chaque équipement
const US_FAM = { lampe: 'ancien', lanterne: 'ancien', plan: 'ancien', palmes: 'eau', bottes: 'eau', cire: 'eau', crampons: 'hauteur', corde: 'hauteur', bonnet: 'hauteur', manteau: 'hauteur', gourde: 'hauteur', jumelles: 'nature', boussole: 'nature', chapeau: 'nature', barque: 'eau', cotre: 'eau', navire: 'eau', machette: 'nature' };
const usFam = g => US_FAM[g] || 'nature';
const US_MAX = [0, 3, 4, 5]; // défis réussis avant d'être usé, selon la version (base, pro, légendaire)

// ---------- 1) les recettes ----------
function usPatch() {
  for (const fam of Object.keys(LD_FAM)) LD_FAM[fam].mats.forEach((nm, t) => { ING[`ldm_${fam}_${t}`] = [['defi'], nm]; });
  for (const r of RECIPES) {
    if (r.kind !== 'Équipement' || r._us) continue;
    const G = xpGearOf({ name: r.out[0] }); if (!G) continue;
    const f = usFam(G.g);
    if (G.tier === 2) r.ing = r.ing.concat([[`ldm_${f}_0`, 3]]);
    if (G.tier === 3) r.ing = r.ing.concat([[`ldm_${f}_1`, 2], [`ldm_${f}_0`, 3]]);
    r._us = 1;
  }
}
us$(usPatch);
// les recettes apprises plus tard auprès d'un habitant (barque, cotre…) suivent la même règle
if (typeof psSyncRecipes === 'function') psSyncRecipes = (orig => function () { const r = orig.apply(this, arguments); us$(usPatch); return r; })(psSyncRecipes);
us$(usPatch);
ingExtra = (orig => function (key, i) {
  if (typeof key === 'string' && key.startsWith('ldm_')) return !!(i && ING[key] && i.name === ING[key][1]);
  return orig.apply(this, arguments);
})(ingExtra);

// ---------- 2) l'usure ----------
const usTier = it => us$(() => xpGearOf(it).tier, 1);
const usMax = it => US_MAX[usTier(it)] || 3;
const usWorn = it => !!it && (it.wear || 0) >= usMax(it);
// le meilleur équipement utilisable pour un défi (pas usé, pas porté par un autre familier)
function usGear(k, g, t, worn) {
  return us$(() => S.inv.filter(it => {
    const G = xpGearOf(it); if (!G || G.g !== g || G.tier < t) return false;
    const by = xpWornBy(it.id); if (by && by !== k) return false;
    return worn ? usWorn(it) : !usWorn(it);
  }).sort((a, b) => usTier(b) - usTier(a) || (a.wear || 0) - (b.wear || 0))[0], null);
}
// coût d'une réparation : base = des pièces ; pro = matériaux ★ ; légendaire = matériaux ★★ et ★
const usCost = it => { const t = usTier(it), f = usFam(xpGearOf(it).g); return t <= 1 ? { coins: 10, ing: [] } : t === 2 ? { coins: 20, ing: [[`ldm_${f}_0`, 2]] } : { coins: 40, ing: [[`ldm_${f}_1`, 1], [`ldm_${f}_0`, 2]] }; };
const usCan = c => S.coins >= c.coins && c.ing.every(([key, n]) => ingCount(key) >= n);
const usCostTxt = c => [c.coins ? `${c.coins} pièces` : '', ...c.ing.map(([key, n]) => `${n} × ${ING[key][1]}`)].filter(Boolean).join(' + ');
function usRepair(id) {
  const it = S.inv.find(x => x && x.id === id); if (!it) return false;
  const c = usCost(it); if (!usCan(c)) return false;
  for (const [key, n] of c.ing) S.inv.filter(i => ingIt(key, i)).slice(0, n).forEach(x => S.inv.splice(S.inv.indexOf(x), 1));
  S.coins -= c.coins; it.wear = 0; save(); us$(() => renderTop());
  return true;
}
const usDots = it => { const m = usMax(it), w = Math.min(m, it.wear || 0); return `<span class="us-d" aria-label="usure ${w} sur ${m}">${'<i class="on"></i>'.repeat(m - w)}${'<i></i>'.repeat(w)}</span>`; };

// le cadenas « équipement » ne s'ouvre qu'avec un équipement en état
ldOpen = (orig => function (L, k) {
  if (L && L.t === 'g') return !!usGear(k, L.g, L.tier);
  return orig.apply(this, arguments);
})(ldOpen);
ldHint = (orig => function (L, k) {
  if (L && L.t === 'g') { const w = usGear(k, L.g, L.tier, true); if (w && !usGear(k, L.g, L.tier)) return `Équipement usé (« ${w.name} ») : à réparer, ${usCostTxt(usCost(w))}`; }
  return orig.apply(this, arguments);
})(ldHint);

// la fiche du défi : état de l'équipement et bouton « Réparer »
ldFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  us$(() => {
    const D = LD_CACHE[id], box = $('modal') && $('modal').querySelector('.ld-f'); if (!D || !box) return;
    const lis = box.querySelectorAll('.ld-l > li'), k = S.sel;
    D.locks.forEach((L, i) => {
      if (L.t !== 'g' || !lis[i]) return;
      const sp = lis[i].querySelector('span'); if (!sp) return;
      const ok = usGear(k, L.g, L.tier), w = !ok && usGear(k, L.g, L.tier, true);
      if (ok) sp.insertAdjacentHTML('beforeend', `<small class="us-l">${esc(ok.name)} ${usDots(ok)} encore ${usMax(ok) - (ok.wear || 0)} défi${usMax(ok) - (ok.wear || 0) > 1 ? 's' : ''}</small>`);
      else if (w) { const c = usCost(w), can = usCan(c); sp.insertAdjacentHTML('beforeend', `<button class="btn us-r" data-usrep="${w.id}" data-usld="${id}"${can ? '' : ' disabled aria-disabled="true"'}>Réparer · ${esc(usCostTxt(c))}</button>`); }
    });
  });
  return r;
})(ldFiche);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-usrep]'); if (!b || b.disabled) return;
  ev.stopPropagation();
  if (usRepair(b.dataset.usrep)) { toast('Réparé, comme neuf !'); ldFiche(b.dataset.usld); us$(() => ldRefresh()); }
});

// au retour d'un défi réussi : l'équipement qui a ouvert le cadenas s'use d'un cran
GAME.on('trip:return', e => us$(() => {
  const t = e && e.trip; if (!t || !t.ld || !t.ld.ok) return;
  const D = LD_CACHE[t.ld.id]; if (!D) return;
  const L = D.locks.find(x => x.t === 'g'); if (!L) return;
  const it = usGear(e.who, L.g, L.tier); if (!it) return;
  it.wear = (it.wear || 0) + 1; save();
  const left = usMax(it) - it.wear;
  setTimeout(() => toast(left > 0 ? `« ${it.name} » : encore ${left} défi${left > 1 ? 's' : ''} avant réparation` : `Équipement usé (« ${it.name} ») : à réparer avant le prochain défi`), 1800);
  us$(() => ldRefresh());
}));

// style
us$(() => {
  const st = document.createElement('style');
  st.textContent = `.us-l{display:flex!important;align-items:center;gap:6px;color:#3f7f3a!important}
.us-d{display:inline-flex;gap:2px}.us-d i{width:7px;height:7px;border-radius:50%;background:#d9cbb2;display:block}.us-d i.on{background:#3f7f3a}
.us-r{margin-top:6px;padding:6px 10px;font-size:13px;min-height:36px}.us-r[disabled]{opacity:.55}`;
  document.head.appendChild(st);
});
window.__us = { gear: usGear, repair: usRepair, cost: usCost, FAM: US_FAM };

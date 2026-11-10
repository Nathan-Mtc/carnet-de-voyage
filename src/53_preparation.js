// =====================================================================
// v38 : ÊTRE BLOQUÉ PAR LA PRÉPARATION, PARTOUT, AVEC LE CHEMIN POUR S'EN SORTIR
// 1. Un seul encadré « Il vous manque » : prepNeedHTML(gearList, ctx). Pour chaque matériel manquant : icône, nom et
//    UN bouton direct : Équiper (on le possède), Fabriquer (recette de l'atelier, onglet Équipement ; s'il manque des
//    ingrédients, l'encadré « Il manque » de 42_fideles.js), sinon Acheter (article du magasin, ajouté à la vitrine).
//    Fabriqué ou acheté depuis l'encadré : le matériel est équipé tout seul sur le bon familier.
// 2. Branché dans : histoire (51), lieux verrouillés (41 : épingle et panneau), conseils de la fiche de départ (50).
// 3. EXPLORATION (52) : chaque secret « gen » a une exigence selon son terrain (xpTerrOf de 41) ; à moins de 60 km de la
//    maison, aucune. Sans le matériel, le secret n'est pas trouvé et le butin le dit, avec l'encadré. « ? » : petite icône.
// 4. MONDE (44 et 52) : moments rares, lieux éphémères et fête du jour ont une préparation ; sans elle, pas de récompense.
// 5. DÉSORMAIS ACCESSIBLE : quand la portée ou le matériel rend atteignable ce qui ne l'était pas (lieux, lieux à cadenas,
//    secrets, moments) : un bandeau (toast), l'épingle ou le « ? » s'allume avec une étincelle, le cercle de portée
//    s'agrandit depuis l'ancien rayon. Mémoire : S.prep.locked = { familier: [ids] } (rien n'est annoncé deux fois).
// Enveloppes : exVisit, exMarkers, wdOnArrive, mdArrive, collect, showHaul, xpPinLab, xpGoHTML, styListHTML, dfTips,
// dfMapUpdate, xpEquip, craft, bqBuy, bqStock. Tests : window.__prep.
// =====================================================================
const pp$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const ppTuto = () => pp$(() => tuOn(), false) || pp$(() => document.body.classList.contains('firstrun'), false);
const ppKm = (a, b) => pp$(() => kmBetween(a, b), 1e9);
// article + nom de base, pour « Il fallait des crampons »
const PP_ART = { crampons: 'des crampons', palmes: 'des palmes', lampe: 'une lampe frontale', gourde: 'une gourde', manteau: 'un manteau polaire', jumelles: 'des jumelles', boussole: 'une boussole' };
const ppNm = (g, t) => pp$(() => xpGName(g, t || 1), g);
const ppHas = (k, g, t) => !!k && pp$(() => xpTierOf(k, g), 0) >= (t || 1);
const ppNorm = L => (L || []).map(x => (Array.isArray(x) ? [x[0], x[1] || 1] : [x, 1])).filter(x => pp$(() => !!XP_G[x[0]], false));
function ppState() {
  if (!S.prep || typeof S.prep !== 'object' || Array.isArray(S.prep)) S.prep = {};
  if (!S.prep.locked || typeof S.prep.locked !== 'object' || Array.isArray(S.prep.locked)) S.prep.locked = {};
  return S.prep;
}

// ---------------- le matériel de base accessible tôt : lampe et boussole aussi au magasin ----------------
try { ['lampe', 'boussole'].forEach(g => { if (!BQ_CAT.some(a => a.key === 'xg_' + g)) BQ_CAT.push({ key: 'xg_' + g, k: 't', lvl: 0, def: xpGearDef(g, 1) }); }); } catch (e) {}

// ---------------- quel bouton pour quel matériel ----------------
const ppRecipe = (g, t) => pp$(() => RECIPES.find(r => r.kind === 'Équipement' && (G => G && G.g === g && G.tier === t)(xpGearOf({ name: r.out[0] }))), null);
const ppShopKey = (g, t) => (t === 1 && pp$(() => BQ_CAT.some(a => a.key === 'xg_' + g), false) ? 'xg_' + g : null);
const ppPrice = key => pp$(() => bqArticle(bqStockArticle({ key })).price, 0);
function ppOwned(k, g, t) {
  return pp$(() => S.inv.filter(it => { const G = xpGearOf(it); if (!G || G.g !== g || G.tier < t) return false; const by = xpWornBy(it.id); return !by || by === k; }).sort((a, b) => xpGearOf(b).tier - xpGearOf(a).tier)[0], null);
}
function ppAction(k, g, t) {
  const own = ppOwned(k, g, t); if (own) return { a: 'eq', v: own.id, lbl: 'Équiper' };
  const R = ppRecipe(g, t), sk = ppShopKey(g, t);
  if (R && pp$(() => canCraft(R), false)) return { a: 'craft', v: R.id, lbl: 'Fabriquer' };
  if (sk && S.coins >= ppPrice(sk)) return { a: 'buy', v: sk, lbl: `Acheter (${ppPrice(sk)} pièces)` };
  if (R) return { a: 'craft', v: R.id, lbl: 'Fabriquer' };
  if (sk) return { a: 'buy', v: sk, lbl: 'Acheter' };
  return null;
}
// ctx : { k, why, title }
function prepNeedHTML(gearList, ctx) {
  ctx = ctx || {};
  const k = ctx.k && CHARS[ctx.k] ? ctx.k : S.sel, L = ppNorm(gearList).filter(([g, t]) => !ppHas(k, g, t));
  if (!L.length) return '';
  const rows = L.map(([g, t]) => {
    const A = ppAction(k, g, t);
    return `<div class="pp-row"><span class="pp-ico">${pp$(() => xpGIco(g, t), '')}</span><span class="pp-nm"><b>${esc(ppNm(g, t))}</b><small>${esc(pp$(() => XP_G[g][2], ''))}</small></span>${A ? `<button class="btn ${A.a === 'eq' ? 'green' : A.a === 'craft' ? 'gold' : 'cream'} sm" data-prep="${A.a}" data-pv="${esc(A.v)}" data-pg="${g}" data-pt="${t}" data-pk="${k}">${esc(A.lbl)}</button>` : '<small class="pp-none">Récompense d’expédition</small>'}</div>`;
  }).join('');
  return `<div class="pp-need" role="group" aria-label="Il vous manque"><b class="pp-h">${esc(ctx.title || 'Il vous manque')}${ctx.why ? ` <small>${esc(ctx.why)}</small>` : ''}</b>${rows}</div>`;
}

// ---------------- les actions ----------------
let ppWant = null; // { g, t, k, at } : ce qu'on est allé fabriquer ou acheter depuis l'encadré
function ppSlot(k, g) { const a = xpEq(k); for (let i = 0; i < 2; i++) { const G = a[i] && xpGearOf(S.inv.find(x => x.id === a[i])); if (G && G.g === g) return i; } return a[0] ? (a[1] ? 1 : 1) : 0; }
function ppEquip(k, id, quiet) {
  const it = S.inv.find(x => x.id === id), G = it && xpGearOf(it); if (!G || !CHARS[k]) return false;
  if (!xpEquip(k, ppSlot(k, G.g), id)) return false;
  if (!quiet) pp$(() => toast(`${it.name} équipé${pp$(() => compE(k), '')} sur ${CHARS[k].name}.`), 0);
  return true;
}
function ppRefresh() {
  pp$(() => renderTop(), 0);
  const b = $('panelBody'), y = b ? b.scrollTop : 0; pp$(() => { if (!$('sheet') || !$('sheet').hidden) renderPanel(); }, 0); if (b) b.scrollTop = y;
  document.querySelectorAll('.pp-need').forEach(box => box.querySelectorAll('[data-prep]').forEach(btn => { if (ppHas(btn.dataset.pk, btn.dataset.pg, +btn.dataset.pt)) btn.outerHTML = '<b class="pp-ok">✓ Équipé</b>'; }));
}
function ppMissHTML(R) {
  // l'encadré « Il manque » de 42_fideles.js, pour une recette de l'atelier (ses ingrédients ont les mêmes clés)
  const had = Object.prototype.hasOwnProperty.call(CM_R, R.id), old = CM_R[R.id];
  CM_R[R.id] = { ing: R.ing, def: R.out };
  try { return cfMissHTML(R.id); } catch (e) { return ''; } finally { if (had) CM_R[R.id] = old; else delete CM_R[R.id]; }
}
function ppOpenCraft(R) {
  pp$(() => { craftFilter = 'Équipement'; }, 0);
  const m = $('modal'); if (m) m.hidden = true;
  openSheet('atelier');
  setTimeout(() => {
    const b = document.querySelector(`#panelBody [data-craft="${R.id}"]`), card = b && b.closest('.rec');
    if (!card) return;
    pp$(() => obFlash(`[data-craft="${R.id}"]`, '.rec'), 0);
    pp$(() => card.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 0);
    if (!canCraft(R)) { const old = $('cfMiss'); if (old) old.remove(); const h = ppMissHTML(R); if (h) card.insertAdjacentHTML('afterend', h); }
  }, 90);
}
function ppOpenShop(key) {
  const m = $('modal'); if (m) m.hidden = true;
  pp$(() => { bView = 'magasin'; }, 0);
  openSheet('boutique');
  setTimeout(() => {
    pp$(() => obFlash(`[data-bbuy="${key}"]`, '.bq-art'), 0);
    const b = document.querySelector(`#panelBody [data-bbuy="${key}"]`); if (b) pp$(() => b.closest('.bq-art').scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 0);
  }, 90);
}
function prepDo(a, v, g, t, k) {
  t = +t || 1; k = CHARS[k] ? k : S.sel;
  if (a === 'eq') { if (ppEquip(k, v)) { pp$(() => sfx('pop'), 0); ppRefresh(); ppCheckSoon(); } return; }
  ppWant = { g, t, k, at: Date.now() };
  if (a === 'craft') { const R = pp$(() => RECIPES.find(r => r.id === v), null); if (R) ppOpenCraft(R); return; }
  if (a === 'buy') ppOpenShop(v);
}
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-prep]'); if (!el) return;
  ev.preventDefault(); ev.stopPropagation();
  prepDo(el.dataset.prep, el.dataset.pv, el.dataset.pg, el.dataset.pt, el.dataset.pk);
});
// la vitrine a toujours l'article qu'on est venu chercher
if (typeof bqStock === 'function') bqStock = (orig => function () {
  const items = orig.apply(this, arguments);
  try { if (ppWant && Array.isArray(items)) { const key = ppShopKey(ppWant.g, ppWant.t); if (key && !items.some(x => x && x.key === key)) items.push({ key, r: 'craft' }); } } catch (e) {}
  return items;
})(bqStock);
// fabriqué ou acheté depuis l'encadré : équipé tout seul
function ppAutoEquip() {
  const W = ppWant; if (!W || Date.now() - W.at > 30 * 60e3 || ppHas(W.k, W.g, W.t)) return;
  const it = ppOwned(W.k, W.g, W.t); if (!it) return;
  if (ppEquip(W.k, it.id, true)) { ppWant = null; setTimeout(() => pp$(() => toast(`${it.name} : équipé${pp$(() => compE(W.k), '')} sur ${CHARS[W.k].name}. Vous pouvez repartir !`), 0), 1300); pp$(save, 0); ppCheckSoon(); }
}
if (typeof craft === 'function') craft = (orig => function () { const r = orig.apply(this, arguments); try { ppAutoEquip(); } catch (e) {} return r; })(craft);
if (typeof bqBuy === 'function') bqBuy = (orig => function () { const r = orig.apply(this, arguments); try { ppAutoEquip(); } catch (e) {} return r; })(bqBuy);
if (typeof xpEquip === 'function') xpEquip = (orig => function () { const r = orig.apply(this, arguments); try { if (r) ppCheckSoon(); } catch (e) {} return r; })(xpEquip);

// ---------------- 2a. histoire ----------------
if (typeof styListHTML === 'function') styListHTML = (orig => function (n) {
  const h = orig.apply(this, arguments);
  try {
    const N = n || styState().n, s = styCh(N), C = styC(N);
    if (!C.gear || !s.miss || !/^Il manque du matériel/.test(s.miss) || styStep(N) !== 3) return h;
    const P = styTarget(N), k = (P && styWho(N, styDest(N, P), true).k) || S.sel, box = prepNeedHTML([C.gear], { k, why: `pour ${CHARS[k] ? CHARS[k].name : ''}` });
    const at = h.indexOf('class="sty-miss"'), end = at >= 0 ? h.indexOf('</small>', at) : -1;
    const st = at >= 0 ? h.lastIndexOf('<', at) : -1;
    return box && end >= 0 && st >= 0 ? h.slice(0, st) + box + h.slice(end + 8) : h; // v38b : l'encadré remplace le vieux texte rouge
  } catch (e) { console.error('préparation histoire', e); return h; }
})(styListHTML);

// ---------------- 2b. lieux verrouillés ----------------
const ppLockGear = (P, k) => (P.need || []).filter(([ty, a, n]) => ty === 'g' && !ppHas(k, a, n)).map(([, a, n]) => [a, n]);
if (typeof xpPinLab === 'function') xpPinLab = (orig => function (P) {
  const h = orig.apply(this, arguments);
  try { const box = xpState().won[P.id] ? '' : prepNeedHTML(ppLockGear(P, S.sel), { k: S.sel }); const at = h.lastIndexOf('<button class="btn green sm" data-xpgo'); return box && at >= 0 ? h.slice(0, at) + box + h.slice(at) : h; } catch (e) { return h; }
})(xpPinLab);
if (typeof xpGoHTML === 'function') xpGoHTML = (orig => function (d, k) {
  const h = orig.apply(this, arguments);
  try { const P = d && d.xpl ? XP_P[d.xpl] : null; if (!P) return h; const box = prepNeedHTML(ppLockGear(P, k), { k }); return box && h.endsWith('</div>') ? h.slice(0, -6) + box + '</div>' : h; } catch (e) { return h; }
})(xpGoHTML);

// ---------------- 2c. conseils de la fiche de départ : l'indice devient un vrai bouton ----------------
if (typeof dfTips === 'function') dfTips = (orig => function (k) {
  const L = orig.apply(this, arguments);
  try {
    return L.map(x => {
      if (x.a !== 'hint') return x;
      const g = /boussole/i.test(x.t) ? 'boussole' : pp$(() => Object.keys(XP_G).find(id => x.t.toLowerCase().includes(ppNm(id, 1).toLowerCase())), null);
      if (!g) return x;
      const A = ppAction(k, g, 1); if (!A) return x;
      return { a: 'prep', v: `${A.a}|${A.v}|${g}`, t: `${A.a === 'eq' ? 'Équiper' : A.a === 'craft' ? 'Fabriquer' : 'Acheter'} : ${ppNm(g, 1).toLowerCase()}`, fx: x.fx };
    });
  } catch (e) { return L; }
})(dfTips);
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-dftip][data-a="prep"]'); if (!el) return;
  ev.stopImmediatePropagation(); ev.preventDefault();
  const [a, v, g] = String(el.dataset.v).split('|'); prepDo(a, v, g, 1, S.sel);
}, true);

// ---------------- 3. exploration : chaque secret a son matériel ----------------
const PP_TERR_G = { montagne: 'crampons', mer: 'palmes', desert: 'gourde', froid: 'manteau' };
const PP_SC = {};
function prepSecretNeed(s) {
  if (!s || s.kind !== 'gen') return null;
  const key = `${s.lon},${s.lat}`; if (key in PP_SC) return PP_SC[key];
  let g = null;
  if (ppKm(homeObj(), s) > 60) {
    if (/^🗝/.test(s.ico || '') || /cave oubliée/.test(s.name || '')) g = 'lampe';
    else if (/^🦉/.test(s.ico || '') || /chouettes/.test(s.name || '')) g = 'jumelles';
    else { const pl = pp$(() => nearestPlace(s.lon, s.lat, 120), null); g = PP_TERR_G[pp$(() => xpTerrOf({ lon: s.lon, lat: s.lat, tags: pl ? pl.tags || [] : [] }), 'foret')] || null; }
  }
  return (PP_SC[key] = g);
}
const ppTripMiss = (t, o) => { if (!t) return; if (!Array.isArray(t.prepMiss)) t.prepMiss = []; if (!t.prepMiss.some(x => x.name === o.name)) t.prepMiss.push(o); };
if (typeof exVisit === 'function') exVisit = (orig => function (d, t) {
  const blocked = [];
  try {
    if (d && d.lon != null && !ppTuto()) {
      const X = exState(), z = exZoneAt(d.lon, d.lat), k = t ? t.comp : S.sel;
      exSecretsRaw(z).forEach(s => { if (s.kind !== 'gen' || X.f[s.id] || pp$(() => d3.geoDistance([+d.lon, +d.lat], [s.lon, s.lat]) * 6371, 1e9) > EX_FIND) return; const g = prepSecretNeed(s); if (g && !ppHas(k, g, 1)) { blocked.push([s, g]); X.f[s.id] = 1; } });
    }
  } catch (e) { console.error('préparation secrets', e); }
  let r;
  try { r = orig.apply(this, arguments); }
  finally {
    const X = pp$(() => exState(), null);
    blocked.forEach(([s, g]) => {
      if (X) delete X.f[s.id];
      if (t) { ppTripMiss(t, { name: s.name, g, txt: `Il fallait ${PP_ART[g] || ppNm(g)} pour l’atteindre.` }); pp$(() => t.journal.push({ t: Date.now(), kind: 'mys', place: d.name, text: `🔒 ${s.name} est tout près… Il fallait ${PP_ART[g] || ppNm(g)} pour l’atteindre.`, chips: [['back', 'matériel manquant']] }), 0); }
    });
    if (blocked.length) pp$(save, 0);
  }
  if (r) r.blocked = blocked.map(([s, g]) => ({ id: s.id, g }));
  return r;
})(exVisit);
// le « ? » porte la petite icône du matériel manquant (gris), puis s'allume quand il devient accessible
function ppDecorateQ() {
  pp$(() => exMk, []).forEach(m => {
    const el = pp$(() => m.getElement(), null); if (!el) return;
    const ll = m.getLngLat(), s = { kind: el.classList.contains('st') ? 'story' : 'gen', lon: +ll.lng.toFixed(4), lat: +ll.lat.toFixed(4), name: el.title || '' };
    const g = prepSecretNeed(s), no = !!(g && !ppHas(S.sel, g, 1)), sp = el.querySelector('.pp-qi');
    el.classList.toggle('pp-no', no);
    if (no && !sp) { el.insertAdjacentHTML('beforeend', `<span class="pp-qi" aria-hidden="true">${pp$(() => xpGIco(g, 1), '')}</span>`); el.setAttribute('aria-label', `${el.title} (il faut ${PP_ART[g] || ppNm(g)})`); }
    else if (!no && sp) { sp.remove(); el.setAttribute('aria-label', 'Secret : ' + el.title); }
    const fresh = ppFresh[ppSecId(s)]; el.classList.toggle('pp-new', !!(fresh && Date.now() - fresh < 6000));
  });
}
if (typeof exMarkers === 'function') exMarkers = (orig => function () { const r = orig.apply(this, arguments); try { ppDecorateQ(); } catch (e) {} return r; })(exMarkers);

// ---------------- 4. monde : moments, lieux éphémères, fête du jour ----------------
const PP_MOM = { sakura: ['jumelles'], aurore: ['manteau'], aurore_is: ['manteau'], maree: ['palmes'], lavande: ['gourde'], gnous: ['jumelles', 'gourde'], lucioles: ['lampe'], vendanges: ['gourde'], noel: ['manteau'], tulipes: ['jumelles'], minuit: ['manteau'], erables: ['jumelles'], holi: ['gourde'], carnaval: ['boussole'], lumieres: ['lampe'] };
const PP_EV = { nuit: ['lampe'], festival: ['gourde'], foraine: ['gourde'], brocante: ['boussole'], fromages: ['gourde'], feu: ['lampe'] };
function prepFeteNeed(F) {
  if (!F) return [];
  if (/nuit|bougies|lanternes|étoiles/i.test(F.nm)) return ['lampe'];
  if (/givre/i.test(F.nm)) return ['manteau'];
  if (/coquillages/i.test(F.nm)) return ['palmes'];
  if (/cerfs-volants|ballons|peintres/i.test(F.nm)) return ['jumelles'];
  return [['gourde', 'boussole', 'jumelles'][pp$(() => mdH(F.nm), 0) % 3]];
}
const prepMomentNeed = id => (PP_MOM[id] || ['jumelles']).slice();
const ppMissOf = (k, L) => L.filter(g => !ppHas(k, g, 1));
const ppNeedTxt = L => L.map(g => PP_ART[g] || ppNm(g)).join(' et ');
if (typeof wdOnArrive === 'function') wdOnArrive = (orig => function (t) {
  const keep = WD_MOM.slice(), evOn = [];
  try {
    const k = t.comp, d = t.dest, W = wdState();
    if (d && !t.wdArr && !ppTuto()) {
      const drop = WD_MOM.filter(M => { if (wdKm(d, M) > M.r) return false; const st = wdMoState(M); if (!st.now || st.got) return false; const miss = ppMissOf(k, prepMomentNeed(M.id)); if (!miss.length) return false; ppTripMiss(t, { name: M.nm, g: miss, txt: `Il fallait ${ppNeedTxt(miss)} pour en profiter.` }); wdJ(t, `${M.ico} « ${M.nm} » est là… mais ${wdNm(k)} n’est pas équipé${pp$(() => compE(k), '')} : il fallait ${ppNeedTxt(miss)}. Pas de récompense cette fois.`, [['back', 'matériel manquant']]); return true; });
      if (drop.length) { WD_MOM.length = 0; keep.filter(M => !drop.includes(M)).forEach(M => WD_MOM.push(M)); }
      const n = wdNow(), E = d.wdev ? wdEvById(d.wdev) : wdEvents().find(x => wdKm(d, x) <= 3);
      if (E && !W.ev[E.id] && ((E.start <= n && n < E.end) || (d.wdev === E.id && t.wdevOk))) {
        const miss = ppMissOf(k, PP_EV[E.k] || []);
        if (miss.length) { W.ev[E.id] = 1; evOn.push(E.id); ppTripMiss(t, { name: E.name, g: miss, txt: `Il fallait ${ppNeedTxt(miss)} pour en profiter.` }); wdJ(t, `${E.name} : ${wdNm(k)} arrive… mais il fallait ${ppNeedTxt(miss)}. Pas de récompense cette fois.`, [['back', 'matériel manquant']]); }
      }
    }
  } catch (e) { console.error('préparation monde', e); }
  try { return orig.apply(this, arguments); }
  finally { if (WD_MOM.length !== keep.length) { WD_MOM.length = 0; keep.forEach(M => WD_MOM.push(M)); } const W = pp$(() => wdState(), null); if (W) evOn.forEach(id => delete W.ev[id]); }
})(wdOnArrive);
if (typeof mdArrive === 'function') mdArrive = (orig => function (t) {
  let fid = null;
  try {
    const d = t.dest, F = mdFete(), n = mdNow(), M = mdState();
    if (d && !ppTuto() && !M.fe[F.id] && n >= F.start && n < F.end && mdKm(d, F) <= 20) {
      const miss = ppMissOf(t.comp, prepFeteNeed(F));
      if (miss.length) { M.fe[F.id] = 1; fid = F.id; ppTripMiss(t, { name: F.name, g: miss, txt: `Il fallait ${ppNeedTxt(miss)} pour en profiter.` }); pp$(() => t.journal.push({ t: Date.now(), kind: 'wld', place: d.name, tags: d.tags || ['ville'], text: `${F.ico} ${F.name} : il fallait ${ppNeedTxt(miss)}. Pas de souvenir cette fois.`, chips: [['back', 'matériel manquant']] }), 0); }
    }
  } catch (e) {}
  try { return orig.apply(this, arguments); } finally { if (fid) pp$(() => { delete mdState().fe[fid]; }, 0); }
})(mdArrive);

// ---------------- le butin : ce qui a manqué, avec l'encadré ----------------
function prepHaulHTML(list, k) {
  if (!Array.isArray(list) || !list.length) return '';
  const gs = []; list.forEach(o => [].concat(o.g).forEach(g => { if (!gs.includes(g)) gs.push(g); }));
  return `<div class="pp-haul">${list.slice(0, 4).map(o => `<p>🔒 <b>${esc(o.name)}</b> : ${esc(o.txt)}</p>`).join('')}${prepNeedHTML(gs, { k })}</div>`;
}
let ppHaulR = null;
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k]; ppHaulR = null;
  try { if (t && t.done && Array.isArray(t.prepMiss) && t.prepMiss.length) ppHaulR = { k, list: t.prepMiss.slice(), at: Date.now() }; } catch (e) {}
  const r = orig.apply(this, arguments); ppCheckSoon(); return r;
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const R = ppHaulR;
    if (R && h && h.comp === R.k && Date.now() - R.at < 30000) {
      ppHaulR = null;
      const mb = document.querySelector('#modal .mbox'), hd = mb && (mb.querySelector('.xp-haul') || mb.querySelector('.hhead'));
      if (hd) hd.insertAdjacentHTML('afterend', prepHaulHTML(R.list, R.k)); else if (mb) mb.insertAdjacentHTML('afterbegin', prepHaulHTML(R.list, R.k));
    }
  } catch (e) { console.error('préparation butin', e); }
  return r;
})(showHaul);

// ---------------- 5. DÉSORMAIS ACCESSIBLE ----------------
const ppSecId = s => `s:${s.lon},${s.lat}`;
const ppFresh = {}; // id → moment où il s'est allumé (étincelle)
function ppCandidates(k) {
  const h = homeObj(), R = pp$(() => dfRange(k, null), null); if (!R) return null;
  const inR = o => R.world || ppKm(h, o) <= R.km, out = {};
  // lieux : les 60 plus proches hors portée, plus ceux déjà mémorisés
  const far = PLACES.map(p => ({ p, km: ppKm(h, p) })).filter(o => o.km > R.km).sort((a, b) => a.km - b.km).slice(0, 60);
  const mem = new Set(ppState().locked[k] || []);
  far.forEach(o => { out['p:' + o.p.id] = { name: o.p.name, ok: false }; });
  PLACES.forEach(p => { if (mem.has('p:' + p.id)) out['p:' + p.id] = { name: p.name, ok: inR(p) }; });
  pp$(() => XP_PLACES, []).forEach(P => { if (xpState().won[P.id]) return; out['x:' + P.id] = { name: P.name, ok: inR(P) && !xpMiss(P, k).length }; });
  pp$(() => exRevealedZones(), []).slice(0, 40).forEach(z => pp$(() => exZoneSecrets(z).list, []).forEach(s => { if (s.found || s.kind !== 'gen') return; const g = prepSecretNeed(s); if (!g) return; out[ppSecId(s)] = { name: s.name, ok: inR(s) && ppHas(k, g, 1) }; }));
  pp$(() => WD_MOM, []).forEach(M => { const st = pp$(() => wdMoState(M), {}); if (st.got || !(st.now || st.season)) return; out['m:' + M.id] = { name: M.nm, ok: inR(M) && !ppMissOf(k, prepMomentNeed(M.id)).length }; });
  const F = pp$(() => mdFete(), null); if (F && !pp$(() => mdState().fe[F.id], 0) && mdNow() < F.end) out['f:' + F.id] = { name: F.name, ok: inR(F) && !ppMissOf(k, prepFeteNeed(F)).length };
  return out;
}
function prepCheck(quiet) {
  const k = S.sel; if (!k || !CHARS[k] || ppTuto() || !S.comps || !S.comps[k]) return [];
  const C = ppCandidates(k); if (!C) return [];
  const P = ppState(), first = !Array.isArray(P.locked[k]), mem = new Set(P.locked[k] || []), now = [];
  Object.entries(C).forEach(([id, o]) => { if (o.ok && mem.has(id)) now.push({ id, name: o.name }); });
  P.locked[k] = Object.entries(C).filter(([, o]) => !o.ok).map(([id]) => id).slice(0, 400);
  if (first || !now.length) { if (first) pp$(save, 0); return []; }
  now.forEach(o => { ppFresh[o.id] = Date.now(); });
  pp$(save, 0);
  if (!quiet) pp$(() => toast(now.length === 1 ? `Désormais accessible : ${now[0].name} ✨` : `${now.length} lieux désormais accessibles ✨`), 0);
  ppLightPins();
  return now;
}
let ppT = 0;
function ppCheckSoon() { clearTimeout(ppT); ppT = setTimeout(() => pp$(() => prepCheck(), 0), 250); }
function ppLightPins() {
  const n = Date.now();
  pp$(() => Object.entries(ovEls), []).forEach(([key, o]) => { if (!/^p/.test(key) || !o || !o.el) return; const f = ppFresh['p:' + key.slice(1)]; o.el.classList.toggle('pp-new', !!(f && n - f < 6000)); });
  pp$(() => xpMapUpdate(), 0); ppDecorateQ();
  setTimeout(() => { document.querySelectorAll('.pp-new').forEach(e => e.classList.remove('pp-new')); }, 6000);
}
setInterval(() => { if (!document.hidden) pp$(() => prepCheck(), 0); }, 4000);
setTimeout(() => pp$(() => prepCheck(true), 0), 1500);

// le cercle de portée s'agrandit depuis l'ancien rayon (l'ancien reste un instant en pointillés)
const ppRK = {};
let ppAnim = 0;
function ppCircle(h, km) { const g = d3.geoCircle().center([h.lon, h.lat]).radius(km / 111.195).precision(2)(); g.coordinates = g.coordinates.map(r => r.slice().reverse()); return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: g }] }; }
if (typeof dfMapUpdate === 'function') dfMapUpdate = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel; if (!k || !CHARS[k] || S.trips[k] || ppTuto() || !map.getSource('dfRange')) return r;
    const R = dfRange(k, plan.dest || null), old = ppRK[k]; ppRK[k] = R.km;
    if (!old || R.world || R.km <= old || dfPalier(R.km) === dfPalier(old) || reduceMotion()) return r;
    const h = homeObj(), id = ++ppAnim;
    if (!map.getSource('ppOld')) { map.addSource('ppOld', { type: 'geojson', data: ppCircle(h, old) }); map.addLayer({ id: 'ppOldL', type: 'line', source: 'ppOld', paint: { 'line-color': '#2f7f6c', 'line-width': 1.6, 'line-opacity': 0.55, 'line-dasharray': [1, 2] } }); }
    else map.getSource('ppOld').setData(ppCircle(h, old));
    const t0 = performance.now(), D = 900;
    const step = now => { if (id !== ppAnim) return; const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3); pp$(() => map.getSource('dfRange').setData(ppCircle(h, old + (R.km - old) * e)), 0); if (p < 1) requestAnimationFrame(step); else setTimeout(() => { if (id === ppAnim) pp$(() => map.getSource('ppOld').setData({ type: 'FeatureCollection', features: [] }), 0); }, 1600); };
    requestAnimationFrame(step);
  } catch (e) {}
  return r;
})(dfMapUpdate);

(function ppCSS() {
  const st = document.createElement('style');
  st.textContent = `
.pp-need{margin:8px 0;padding:8px 10px;border:2px dashed #e0a52a;border-radius:12px;background:#fff8e6;display:flex;flex-direction:column;gap:6px;text-align:left}
.pp-need .pp-h{font-size:13px;color:#7a4a1a}.pp-need .pp-h small{font-weight:600;color:#8a7a6a}
.pp-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.pp-row .pp-nm{flex:1 1 110px;min-width:0}.pp-row .btn{margin-left:auto}.pp-ico{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center}.pp-ico svg{width:34px;height:34px}
.pp-nm{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}.pp-nm b{font-size:13px}.pp-nm small{font-size:11px;color:#8a7a6a}
.pp-row .btn{flex:0 0 auto;min-height:36px}.pp-ok{color:#3f9a5f;font-size:13px}.pp-none{font-size:11px;color:#8a7a6a}
.pp-haul{margin:8px 0}.pp-haul p{margin:4px 0;font-size:13px}
.ex-q{position:relative}.ex-q.pp-no{background:#9a9188;filter:saturate(.4)}
.ex-q .pp-qi{position:absolute;right:-9px;bottom:-9px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);display:grid;place-items:center;pointer-events:none}
.ex-q .pp-qi svg{width:15px;height:15px}
.pp-new{animation:ppGlow 1.2s ease-out 3}.pp-new::after{content:'✨';position:absolute;right:-12px;top:-14px;font-size:14px;animation:ppSpark 1.2s ease-out 3;pointer-events:none}
@keyframes ppGlow{0%{filter:grayscale(1) brightness(.9)}60%{filter:grayscale(0) brightness(1.35) drop-shadow(0 0 6px #f2c14e)}100%{filter:none}}
@keyframes ppSpark{0%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(.8) translateY(-6px)}}
@media (prefers-reduced-motion:reduce){.pp-new,.pp-new::after{animation:none}.pp-new::after{opacity:1}}
`;
  document.head.appendChild(st);
})();

window.__prep = {
  needHTML: prepNeedHTML, action: ppAction, do: prepDo, secretNeed: prepSecretNeed, momentNeed: prepMomentNeed, feteNeed: prepFeteNeed, haulHTML: prepHaulHTML,
  check: prepCheck, state: ppState, want: () => ppWant, visit: (d, t) => exVisit(d, t), arrive: t => wdOnArrive(t), fete: t => mdArrive(t),
  api: () => ({ S, xpTierOf, xpEq, xpEquip, RECIPES, canCraft, showModal, openSheet, closeSheet: typeof closeSheet === 'function' ? closeSheet : null, makeItem, dfRange, homeObj, PLACES, bView: () => bView }),
};

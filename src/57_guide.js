// =====================================================================
// v40 : GUIDE PAS À PAS QUAND ON EST BLOQUÉ
// Proposé dans « Préparer le voyage » (renderVoyage) et dans l'étape bloquée de l'histoire (styListHTML), par un
// bouton « 🧭 Me guider ». Jamais lancé tout seul. Trois blocages, traités dans l'ordre :
//  1. matériel manquant (lieu à cadenas, lieu final de l'histoire, expédition très risquée) :
//     Boutique › Magasin › article, ou Foyer › Atelier › Équipement › recette (« Où le trouver » s'il manque des
//     ingrédients), puis Compagnons › Talents › case de matériel › l'objet ;
//  2. trop loin (50_difficulte.js) : boussole, plats d'endurance (Boutique › Comptoir › Préparer, puis sac à provisions),
//     compagnon de route ; la portée monte en direct dans la bulle ;
//  3. niveau de terrain (41_expedition.js) : 2 ou 3 lieux de ce terrain à portée, « Y aller », suivi du niveau.
//  Enfin : retour à la destination et « Partir ».
// Chaque étape est recalculée depuis l'état réel du jeu (objet possédé, équipé, écran ouvert…), toutes les 250 ms.
// Mémoire : S.guide = { on, k, d (destination), sty, r0, skip, step } : le guide reprend après un rechargement.
// Moteur léger (ni assombrissement ni blocage) : un halo + une flèche sur l'élément à toucher, une bulle, « Quitter ».
// Réutilise tuNav, tuSel, tuVis, tuModal (24_tuto.js). Enveloppes : renderVoyage, styListHTML, bqStock, startTrip.
// Tests : window.__guide.
// =====================================================================
const gd$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const gdOn = () => !!(S.guide && S.guide.on) && !gd$(() => tuOn(), false);
const gdNm = k => (CHARS[k] ? CHARS[k].name : '');
const gdKm = n => Math.round(n).toLocaleString('fr-FR');
const gdSame = (a, b) => !!(a && b && Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4);
function gdDest() {
  const d = S.guide && S.guide.d; if (!d) return null;
  return gd$(() => PLACES.find(p => p.name === d.name && gdSame(p, d)), null) || d;
}

// ---------------- ce qui bloque ----------------
function gdGearNeeds(k, d) {
  const out = [];
  if (d.xpl && XP_P[d.xpl]) ppLockGear(XP_P[d.xpl], k).forEach(x => out.push(x));
  if (d.sty) { const C = gd$(() => styC(d.sty), null); if (C && C.gear && !styGearOK(k, C)) out.push([C.gear[0], C.gear[1]]); }
  if (!out.length) { // expédition très risquée : le matériel de ce terrain
    const r = gd$(() => dfRiskOf(k, d), null);
    if (r && r.r >= 0.3) { const g = Object.keys(XP_G).find(g => g !== 'boussole' && XP_G[g][4].includes(r.c.terr)); if (g && !ppHas(k, g, 1)) out.push([g, 1]); }
  }
  return out.filter((x, i) => out.findIndex(y => y[0] === x[0]) === i);
}
function gdTerrNeed(k, d) {
  const P = d && d.xpl ? XP_P[d.xpl] : null; if (!P) return null;
  const n = P.need.find(([ty, a, l]) => ty === 'm' && xpLvl(k, a) < l);
  return n ? { terr: n[1], lvl: n[2] } : null;
}
function gdBlocks(k, d) {
  if (!d || !CHARS[k] || gd$(() => tuOn(), false)) return [];
  const L = gdGearNeeds(k, d).map(([g, t]) => ({ kind: 'gear', g, t }));
  if (!gd$(() => dfCheck(k, d).ok, true)) L.push({ kind: 'far' });
  const T = gdTerrNeed(k, d); if (T) L.push({ kind: 'terr', ...T });
  return L;
}

// ---------------- lancer, quitter, finir ----------------
function gdStart(k, d, o) {
  o = o || {};
  if (!CHARS[k] || !d) return false;
  const C = gd$(() => dfCheck(k, d), null), T = gdTerrNeed(k, d);
  S.guide = { on: 1, k, d: JSON.parse(JSON.stringify(d)), sty: o.sty || d.sty || 0, r0: C ? C.R.km : 0, terr: T, skip: {}, step: '', t0: Date.now() };
  const m = $('modal'); if (m && !m.hidden && m.querySelector('.qt-page')) { m.hidden = true; gd$(() => { qtPageOn = false; }, 0); }
  document.querySelectorAll('.gd-offer').forEach(e => e.remove());
  gdSig = ''; gdLastEl = null; save(); gdTick();
  return true;
}
function gdQuit() {
  S.guide = { on: 0, quit: Date.now() }; save(); gdHide();
  gd$(() => toast('Guide fermé. Vous pourrez le relancer avec « 🧭 Me guider ».'), 0);
}
function gdFinish(msg) {
  S.guide = { on: 0, done: Date.now() }; save(); gdHide();
  if (msg) gd$(() => toast(msg), 0);
}
// retour au panneau de départ de la destination guidée
function gdBackToDest() {
  const G = S.guide, d = gdDest(); if (!G || !d) return;
  const m = $('modal'); if (m && !m.hidden) m.hidden = true;
  if (S.sel !== G.k) gd$(() => selectComp(G.k), 0);
  plan.dest = d; gd$(() => openSheet('voyage'), 0); gd$(() => drawMarks(), 0);
  gd$(() => zoomTo(d.lon, d.lat), 0);
}
const gdAtPanel = () => tab === 'voyage' && S.sel === S.guide.k && gdSame(plan.dest, gdDest()) && !S.trips[S.guide.k];
const gdToPanel = txt => ({ id: 'back', el: tuSel('#nav [data-nav="carte"]'), back: 1, txt: txt || 'Revenez au départ : touchez « Carte ».', btn: '<button class="btn cream sm" data-gd="back">Y retourner</button>' });

// ---------------- les étapes ----------------
// une étape : { id, el, txt, btn (html en plus dans la bulle), wait }
function gdNav(t, sub, nm) {
  const n = tuNav(t, sub); if (!n) return null;
  const lbl = n.el ? ((n.el.querySelector('span') || n.el).textContent || '').trim() : '';
  return { id: `nav:${t}:${sub || ''}`, el: n.el, txt: n.txt || `${nm} Touchez « ${lbl || t} ».` };
}
// la case de matériel à remplir : une vide, sinon celle dont on n'a pas besoin ici
function gdSlot(k, g) {
  const a = xpEq(k), keep = gdGearNeeds(k, gdDest() || {}).map(x => x[0]).concat(['boussole', g]);
  for (let i = 0; i < 2; i++) { const G = a[i] && xpGearOf(S.inv.find(x => x.id === a[i])); if (G && G.g === g) return i; }
  for (let i = 0; i < 2; i++) if (!a[i]) return i;
  for (let i = 0; i < 2; i++) { const G = xpGearOf(S.inv.find(x => x.id === a[i])); if (!G || !keep.includes(G.g)) return i; }
  return 1;
}
function gdGearStep(k, g, t, pre) {
  const nm = ppNm(g, t), own = ppOwned(k, g, t), G = S.guide;
  pre = pre || `Il manque ${(PP_ART[g] && t === 1 ? PP_ART[g] : nm.toLowerCase())}.`;
  if (!own) {
    const R = ppRecipe(g, t), sk = ppShopKey(g, t), price = sk ? ppPrice(sk) : 0;
    if (sk && (S.coins >= price || !R || !canCraft(R))) {
      G.buy = sk;
      const n = gdNav('boutique', 'magasin', `${pre} Le magasin en vend.`); if (n) return { ...n, id: n.id + ':' + g };
      const b = tuVis(document.querySelector(`#panelBody [data-bbuy="${sk}"]`));
      if (S.coins < price) return { id: 'cash:' + g, el: b, txt: `${nm} : ${price} pièces, vous en avez ${S.coins}. Livrez des commandes au Comptoir, puis revenez.` };
      return { id: 'buy:' + g, el: b, txt: `Voici ${nm.toLowerCase()} (${price} pièces). Touchez le prix pour l’acheter.` };
    }
    if (R) {
      const n = gdNav('village', 'atelier', `${pre} On peut le fabriquer à l’atelier du Foyer.`); if (n) return { ...n, id: n.id + ':' + g };
      if (craftFilter !== 'Équipement') return { id: 'cf:' + g, el: tuSel('#panelBody [data-cf="Équipement"]'), txt: 'Touchez l’onglet « Équipement ».' };
      const b = document.querySelector(`#panelBody [data-craft="${R.id}"]`), card = b && b.closest('.rec');
      if (canCraft(R)) return { id: 'craft:' + g, el: b, txt: `Touchez « Fabriquer » : ${nm.toLowerCase()}.` };
      let box = $('cfMiss');
      if (card && (!box || box.dataset.rid !== R.id)) { if (box) box.remove(); const h = ppMissHTML(R); if (h) { card.insertAdjacentHTML('afterend', h); box = $('cfMiss'); } }
      return { id: 'miss:' + g, el: tuVis(box) || card, txt: `Il manque des ingrédients pour ${nm.toLowerCase()}. Voici où les trouver : touchez « Y aller ».` };
    }
    return { id: 'none:' + g, el: null, txt: `${nm} ne s’achète ni ne se fabrique : c’est une récompense d’expédition.`, btn: `<button class="btn cream sm" data-gd="skip" data-gs="g:${g}">Passer</button>` };
  }
  // le posséder ne suffit pas : l'équiper
  const n = gdNav('compagnons', 'talents', `Vous avez ${nm.toLowerCase()} : il faut maintenant l’équiper.`); if (n) return { ...n, id: n.id + ':eq:' + g };
  if (S.sel !== k) return { id: 'sel:' + k, el: tuSel(`#hudComps .hc-btn[data-sel="${k}"]`), txt: `Choisissez ${gdNm(k)} en haut.` };
  const slot = gdSlot(k, g);
  if (xpSlot !== slot) return { id: 'slot:' + g, el: tuSel(`#panelBody [data-xps="${slot}"]`), txt: `Touchez cette case de matériel de ${gdNm(k)}.` };
  return { id: 'pick:' + g, el: tuSel(`#panelBody [data-xpeq="${own.id}"]`), txt: `Choisissez ${own.name}.` };
}
function gdFarStep(k, d) {
  const G = S.guide, C = dfCheck(k, d);
  if (C.ok) return null;
  const sk = s => G.skip && G.skip[s];
  const skipBtn = s => `<button class="btn cream sm" data-gd="skip" data-gs="${s}">Autre solution</button>`;
  // 1. la boussole
  if (C.R.comp < 1 && !sk('comp')) {
    const R = ppRecipe('boussole', 1), key = ppShopKey('boussole', 1);
    if (dfCompItem(k) || (key && S.coins >= ppPrice(key)) || (R && canCraft(R))) {
      const s = gdGearStep(k, 'boussole', 1, `Une boussole agrandit la portée de ${gdNm(k)}.`);
      return { ...s, id: 'far:' + s.id, btn: (s.btn || '') + skipBtn('comp') };
    }
  }
  // 2. les plats d'endurance
  const sel = gd$(() => eqPlanProv(), []), st = gd$(() => eqStock(), {}), used = r => sel.filter(x => x === r).length;
  if (sel.length < 3 && !sk('end')) {
    const ready = Object.keys(st).find(r => eqKindOf(r) === 'end' && st[r] - used(r) > 0);
    if (ready) {
      if (!gdAtPanel()) return { ...gdToPanel(`Un plat d’endurance est prêt. Touchez « Carte » pour revenir au départ.`), id: 'far:back' };
      return { id: 'far:prov', el: tuSel(`#panelBody [data-eqpadd="${ready}"]`), txt: `Mettez « ${eqRName(ready)} » dans le sac à provisions : +90 km.` };
    }
    const c = gd$(() => cmState(), null), cook = c && c.sl.find(x => x && eqKindOf(x.rid) === 'end');
    if (cook) return { id: 'far:cook', el: tuVis(document.querySelector('#czBody .cm-sl, #czBody .cm-slot')), txt: `« ${eqRName(cook.rid)} » cuit… prêt dans ${Math.max(1, Math.ceil((cook.end - Date.now()) / 1000))} s.`, wait: 1, btn: skipBtn('end') };
    const recs = gd$(() => Object.keys(CM_R).filter(r => CM_R[r].shop === cmT().id && eqKindOf(r) === 'end' && cmUnlocked(CM_R[r])), []);
    if (recs.length) {
      const n = gdNav('boutique', 'comptoir', 'Des plats d’endurance : +90 km chacun. On les prépare au Comptoir.'); if (n) return { ...n, id: 'far:' + n.id, btn: skipBtn('end') };
      if (gd$(() => czTab, 'prep') !== 'prep') return { id: 'far:cztab', el: tuSel('[data-cztab="prep"]'), txt: 'Touchez « Préparer ».', btn: skipBtn('end') };
      const r = recs.find(x => cmCanIng(CM_R[x])) || recs[0], ok = cmCanIng(CM_R[r]);
      return { id: 'far:prep', el: tuSel(`#czBody [data-cmprep="${r}"]`), txt: ok ? `Touchez « Préparer » : ${eqRName(r).toLowerCase()} (endurance).` : `Il manque des ingrédients pour ${eqRName(r).toLowerCase()} : touchez « Préparer » pour voir où les trouver.`, btn: skipBtn('end') };
    }
  }
  // 3. un compagnon de route
  const free = gd$(() => compIds().filter(x => x !== k && eqFree(x)), []);
  if (!gd$(() => eqPlanDuo(), null) && free.length && !sk('duo')) {
    if (!gdAtPanel()) return { ...gdToPanel('Un compagnon de route ajoute de la portée. Touchez « Carte » pour revenir au départ.'), id: 'far:back2' };
    return { id: 'far:duo', el: tuSel(`#panelBody [data-eqduo="${free[0]}"]`), txt: `Emmenez ${gdNm(free[0])} comme compagnon de route : +50 km.`, btn: skipBtn('duo') };
  }
  return { id: 'far:none', el: null, txt: `Pour l’instant, c’est trop loin. Faites grandir ${gdNm(k)} (stade, vêtements d’explorateur) ou visez plus près.`, btn: '<button class="btn cream sm" data-gd="reset">Revoir les solutions</button>' };
}
// lieux de ce terrain, à portée, du plus proche au plus loin
let gdPl = [];
function gdTerrPlaces(k, terr) {
  const h = homeObj();
  return gd$(() => PLACES.filter(p => p.name !== S.home && xpTerrOf(p) === terr && dfCheck(k, p).ok).sort((a, b) => kmBetween(h, a) - kmBetween(h, b)).slice(0, 3), []);
}
function gdTerrStep(k, T) {
  const lv = xpLvl(k, T.terr), nm = XP_T[T.terr][1];
  if (lv >= T.lvl) return null;
  const line = `Voyagez en ${nm.toLowerCase()} pour progresser : <b>${lv}/${T.lvl}</b>`;
  if (S.trips[k]) return { id: 'terr:trip', el: null, txt: `${line}. ${gdNm(k)} est en route : revenez à son retour.`, wait: 1 };
  if (tab === 'voyage' && plan.dest && !gdSame(plan.dest, gdDest()) && xpTerrOf(plan.dest) === T.terr) return { id: 'terr:go', el: tuSel('#goBtn'), txt: `${line}. Touchez « Partir ».` };
  gdPl = gdTerrPlaces(k, T.terr);
  if (!gdPl.length) return { id: 'terr:none', el: null, txt: `${line}. Aucun lieu de ce terrain n’est à portée : agrandissez d’abord la portée (boussole, plats d’endurance).` };
  return { id: 'terr:list', el: null, txt: `${line}. Lieux à portée :`, btn: `<div class="gd-pl">${gdPl.map((p, i) => `<div class="gd-p"><span><b>${esc(p.name)}</b><small>${gdKm(kmBetween(homeObj(), p))} km</small></span><button class="btn green sm" data-gdgo="${i}">Y aller</button></div>`).join('')}</div>`, pins: 1 };
}
function gdStep() {
  const G = S.guide, k = G.k, d = gdDest();
  if (!d || !CHARS[k] || !S.comps[k]) return { id: 'end', el: null, txt: 'Ce compagnon n’est plus là.', btn: '' };
  if (S.trips[k] && !(G.terr && xpLvl(k, G.terr.terr) < G.terr.lvl)) return { id: 'away', el: null, txt: `${gdNm(k)} est en voyage : le guide reprend à son retour.`, wait: 1 };
  const modal = !S.trips[k] && tuNav(tab, null); if (modal && modal.txt) return { id: 'modal', el: modal.el, txt: modal.txt };
  for (const [g, t] of gdGearNeeds(k, d)) if (!(G.skip && G.skip['g:' + g])) return gdGearStep(k, g, t);
  const f = gdFarStep(k, d); if (f) return f;
  if (G.terr) { const s = gdTerrStep(k, G.terr); if (s) return s; }
  // prêt
  const pre = G.terr ? 'Vous êtes prêt ! ' : 'Tout est prêt ! ';
  if (!gdAtPanel()) return { ...gdToPanel(`${pre}Touchez « Carte » pour revenir à ${esc(d.name)}.`), id: 'ready:back' };
  const C = gd$(() => dfCheck(k, d), { ok: true });
  return { id: 'ready:go', el: tuSel('#goBtn'), txt: `${pre}${C.ok ? '' : 'Encore un peu loin, mais '}Touchez « Partir ».` };
}

// ---------------- affichage : halo, flèche, bulle ----------------
let gdEl = null, gdCur = null, gdLastEl = null, gdSig = '', gdPins = [];
function gdBuild() {
  if (gdEl) return gdEl;
  gdEl = document.createElement('div'); gdEl.id = 'guide'; gdEl.hidden = true; gdEl.setAttribute('aria-live', 'polite');
  gdEl.innerHTML = `<div class="gd-ring" aria-hidden="true"></div><div class="gd-arw" aria-hidden="true"><svg viewBox="0 0 40 48"><path d="M13 3 H27 V25 H37 L20 45 L3 25 H13Z" fill="#f6c445" stroke="#4a3528" stroke-width="3" stroke-linejoin="round"/></svg></div><div class="gd-bub" role="dialog" aria-label="Guide"><div class="gd-h"><b>🧭 Guide</b><span class="gd-r"></span></div><p class="gd-say"></p><div class="gd-x"></div><div class="gd-ft"><button class="gd-q" data-gd="quit">Quitter le guide</button></div></div>`;
  (document.querySelector('.game') || document.body).appendChild(gdEl);
  return gdEl;
}
function gdHide() { if (gdEl) gdEl.hidden = true; gdCur = null; gdLastEl = null; gdSig = ''; gdPinsOff(); }
function gdPinsOff() { gdPins.forEach(m => gd$(() => m.remove(), 0)); gdPins = []; }
function gdPinsOn() {
  if (gdPins.length || typeof maplibregl === 'undefined' || !gd$(() => map, null)) return;
  gdPl.forEach((p, i) => gd$(() => { const e = document.createElement('button'); e.className = 'gd-pin'; e.dataset.gdgo = i; e.textContent = i + 1; e.setAttribute('aria-label', p.name); gdPins.push(new maplibregl.Marker({ element: e }).setLngLat([p.lon, p.lat]).addTo(map)); }, 0));
}
function gdRangeTxt() {
  const G = S.guide, d = gdDest(); if (!d) return '';
  const C = gd$(() => dfCheck(G.k, d), null); if (!C || (C.ok && C.R.km <= G.r0)) return '';
  return C.R.km === G.r0 ? `Portée : <b>${gdKm(C.R.km)}</b> / ${gdKm(C.dist)} km` : `Portée : ${gdKm(G.r0)} → <b class="${C.ok ? 'ok' : ''}">${gdKm(C.R.km)}</b> / ${gdKm(C.dist)} km`;
}
function gdTick() {
  if (!gdOn()) { if (gdEl && !gdEl.hidden) gdHide(); return; }
  let st; try { st = gdStep(); } catch (e) { console.error('guide', e); return; }
  const G = S.guide;
  if (st.id !== G.step) { G.step = st.id; save(); }
  const el = gdBuild(); el.hidden = false;
  const rg = gdRangeTxt(), sig = [st.id, st.txt, st.btn || '', rg].join('|');
  if (sig !== gdSig) {
    gdSig = sig;
    el.querySelector('.gd-say').innerHTML = st.txt;
    el.querySelector('.gd-r').innerHTML = rg;
    el.querySelector('.gd-x').innerHTML = st.btn || '';
  }
  if (st.pins) gdPinsOn(); else gdPinsOff();
  gdCur = st;
  if (st.el && st.el !== gdLastEl) {
    gdLastEl = st.el;
    const r = st.el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 90) gd$(() => st.el.scrollIntoView({ block: 'center', behavior: gd$(() => reduceMotion(), false) ? 'auto' : 'smooth' }), 0);
  }
  gdPlace();
}
function gdPlace() {
  if (!gdEl || gdEl.hidden || !gdCur) return;
  const ring = gdEl.querySelector('.gd-ring'), arw = gdEl.querySelector('.gd-arw'), bub = gdEl.querySelector('.gd-bub');
  const gr = gdEl.getBoundingClientRect(), W = gr.width, H = gr.height, M = 10, bw = Math.min(340, W - 2 * M);
  bub.style.width = bw + 'px';
  const bh = bub.offsetHeight, el = gdCur.el && document.contains(gdCur.el) ? gdCur.el : null;
  if (!el) {
    ring.style.display = arw.style.display = 'none';
    bub.style.left = (W - bw) / 2 + 'px';
    const nav = $('nav'), nb = nav ? nav.getBoundingClientRect().top - gr.top : H;
    bub.style.top = Math.max(M, Math.min(H - bh - M, nb - bh - 12)) + 'px';
    return;
  }
  const r0 = el.getBoundingClientRect(), p = 5;
  const r = { left: r0.left - gr.left - p, top: r0.top - gr.top - p, width: r0.width + 2 * p, height: r0.height + 2 * p };
  r.bottom = r.top + r.height;
  ring.style.display = ''; Object.assign(ring.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  const up = r.top > H * 0.45; // l'élément est en bas : flèche et bulle au-dessus
  const cx = r.left + r.width / 2;
  arw.style.display = gdCur.wait ? 'none' : '';
  arw.classList.toggle('up', !up);
  arw.style.left = Math.max(2, Math.min(W - 42, cx - 20)) + 'px';
  arw.style.top = (up ? r.top - 50 : r.bottom + 2) + 'px';
  const top = up ? Math.max(M, r.top - 56 - bh) : Math.min(H - bh - M, r.bottom + 54);
  bub.style.left = Math.max(M, Math.min(W - bw - M, cx - bw / 2)) + 'px'; bub.style.top = top + 'px';
}
function gdLoop() { try { gdPlace(); } catch (e) {} requestAnimationFrame(gdLoop); }
requestAnimationFrame(gdLoop);
setInterval(gdTick, 250);
addEventListener('resize', () => { gdLastEl = null; });

// ---------------- les touchers ----------------
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-guide],[data-gd],[data-gdgo]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  if (b.dataset.guide === 'sty') return gdFromStory();
  if (b.dataset.guide) { const d = plan.dest; if (d) gdStart(S.sel, d); return; }
  if (b.dataset.gdgo != null) { const p = gdPl[+b.dataset.gdgo]; if (p) { gd$(() => choosePlace(p), 0); gd$(() => zoomTo(p.lon, p.lat), 0); gdTick(); } return; }
  const a = b.dataset.gd;
  if (a === 'quit') return gdQuit();
  if (a === 'back') { gdBackToDest(); return gdTick(); }
  if (a === 'skip') { S.guide.skip = S.guide.skip || {}; S.guide.skip[b.dataset.gs] = 1; save(); return gdTick(); }
  if (a === 'reset') { S.guide.skip = {}; save(); return gdTick(); }
}, true);
// « Carte » pendant une étape de retour : on rouvre le panneau de départ de la destination
document.addEventListener('click', ev => {
  if (!gdOn() || !gdCur || !gdCur.back) return;
  if (ev.target.closest && ev.target.closest('#nav [data-nav="carte"]')) setTimeout(() => { gdBackToDest(); gdTick(); }, 0);
}, true);
function gdFromStory() {
  const n = gd$(() => styState().n, 0); if (!n) return;
  const P = gd$(() => styTarget(n), null); if (!P) return;
  const d = styDest(n, P), k = gd$(() => styWho(n, d, !!P.fin).k, null) || S.sel;
  if (!k) return gd$(() => toast('Toute l’équipe est en voyage : attendez le retour d’un familier.'), 0);
  if (S.sel !== k) gd$(() => selectComp(k), 0);
  gdStart(k, d, { sty: n });
}

// ---------------- branchements ----------------
const gdBtn = (v, extra) => `<button class="btn gold gd-go${extra ? ' ' + extra : ''}" data-guide="${v}">🧭 Me guider</button>`;
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel, d = plan.dest;
    if (!box || !d || S.trips[k] || !CHARS[k] || gd$(() => tuOn(), false) || box.querySelector('.gd-go')) return r;
    if (gdOn() && S.guide.k === k && gdSame(S.guide.d, d)) return r;
    if (!gdBlocks(k, d).length) return r;
    const h = `<div class="gd-offer">${gdBtn('1')}<small>Je vous montre, étape par étape, quoi toucher pour pouvoir partir.</small></div>`;
    const at = box.querySelector('.dfc-far') || box.querySelector('.xpgo.miss') || box.querySelector('.dfc-top');
    if (at) at.insertAdjacentHTML('afterend', h); else box.insertAdjacentHTML('afterbegin', h);
  } catch (e) { console.error('guide panneau', e); }
  return r;
})(renderVoyage);
if (typeof styListHTML === 'function') styListHTML = (orig => function (n) {
  const h = orig.apply(this, arguments);
  try {
    const N = n || styState().n, s = styCh(N), st = styStep(N), go = '<button class="btn green" data-sty="go">Y aller</button>';
    if (!s.miss || st < 1 || st > 3 || h.indexOf(go) < 0) return h;
    return h.replace(go, gdBtn('sty', 'sm') + go);
  } catch (e) { return h; }
})(styListHTML);
// la vitrine a toujours l'article que le guide montre
if (typeof bqStock === 'function') bqStock = (orig => function () {
  const items = orig.apply(this, arguments);
  try { const key = gdOn() && S.guide.buy; if (key && Array.isArray(items) && !items.some(x => x && x.key === key)) items.push({ key, r: 'craft' }); } catch (e) {}
  return items;
})(bqStock);
// parti vers la destination guidée : le guide a fini
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const pd = plan.dest, r = orig.apply(this, arguments);
  try { if (gdOn() && S.trips[S.guide.k] && gdSame(pd, S.guide.d)) gdFinish(`Bon voyage ! Le guide a fini : ${gdNm(S.guide.k)} part vers ${S.guide.d.name}.`); } catch (e) {}
  return r;
})(startTrip);

// ---------------- styles ----------------
(function gdCSS() {
  const st = document.createElement('style'); st.id = 'guideCSS';
  st.textContent = `
#guide{position:absolute;inset:0;z-index:46;pointer-events:none}
#guide[hidden]{display:none}
.gd-ring{position:absolute;border-radius:14px;box-shadow:0 0 0 3px #fff6c9,0 0 0 6px rgba(246,196,69,.95),0 0 18px 8px rgba(246,196,69,.5);transition:left .2s,top .2s,width .2s,height .2s}
.gd-ring::after{content:"";position:absolute;inset:-6px;border-radius:18px;border:3px solid #f6c445;animation:gdRing 1.3s ease-out infinite}
@keyframes gdRing{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.25)}}
.gd-arw{position:absolute;width:40px;height:48px;animation:gdBob .9s ease-in-out infinite alternate;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))}
.gd-arw.up svg{transform:rotate(180deg)}
.gd-arw svg{width:100%;height:100%;display:block}
@keyframes gdBob{from{translate:0 -5px}to{translate:0 4px}}
.gd-bub{position:absolute;pointer-events:auto;background:#fffaf0;border:2.5px solid #4a3528;border-radius:16px;padding:10px 12px;box-shadow:0 6px 20px rgba(52,34,22,.3);font-size:14px;line-height:1.35;color:#3d2c20}
.gd-h{display:flex;justify-content:space-between;gap:8px;align-items:baseline;font-size:12.5px}
.gd-h b{color:#a5672b}
.gd-r{font-size:12px;color:#6b5847}.gd-r b{color:#c9604f}.gd-r b.ok{color:#3f8f5c}
.gd-say{margin:4px 0 6px}
.gd-x{display:flex;flex-wrap:wrap;gap:6px}
.gd-x:empty{display:none}
.gd-pl{display:flex;flex-direction:column;gap:6px;width:100%}
.gd-p{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff3dc;border-radius:10px;padding:5px 8px}
.gd-p span{display:flex;flex-direction:column}.gd-p small{color:#7a6552}
.gd-ft{display:flex;justify-content:flex-end;margin-top:6px}
.gd-q{background:none;border:0;color:#8a6f58;text-decoration:underline;font:inherit;font-size:12.5px;min-height:32px;cursor:pointer}
.gd-offer{display:flex;align-items:center;gap:10px;margin:8px 0;padding:8px 10px;background:#fff3dc;border:2px dashed #e0a52a;border-radius:14px}
.gd-offer small{color:#6b5847;line-height:1.3}
.gd-go{white-space:nowrap}
.gd-pin{width:30px;height:30px;border-radius:50%;background:#f6c445;border:3px solid #4a3528;font-weight:800;color:#4a3528;box-shadow:0 0 0 6px rgba(246,196,69,.45);cursor:pointer}
@media (prefers-reduced-motion:reduce){.gd-arw,.gd-ring::after{animation:none}}
`;
  document.head.appendChild(st);
})();

window.__guide = { S: () => S.guide, cur: () => gdCur && { id: gdCur.id, txt: gdEl && gdEl.querySelector('.gd-say').textContent, range: gdEl && gdEl.querySelector('.gd-r').textContent, target: gdCur.el || null }, blocks: (k, d) => gdBlocks(k || S.sel, d || plan.dest), start: gdStart, quit: gdQuit, tick: gdTick, places: () => gdPl.map(p => p.name) };

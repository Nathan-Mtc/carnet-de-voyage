// ================= 60 · PANNEAU DE DÉPART EN 2 ONGLETS (v43) =================
// Le joueur n'a pas aimé la version compacte (59, trop de changements) : on revient à l'ancien panneau,
// mais coupé en 2 onglets pour moins faire défiler sur téléphone :
//   🔍 « Le lieu »      : ce qu'on peut trouver ici (À trouver ici, œufs et rencontres, météo, type d'expédition) ;
//   🎒 « Préparation »  : qui part, chances, matériel, provisions, compagnon de route, énergie.
// L'en-tête (destination) et le bouton « Partir » restent visibles dans les deux onglets.
// Les éléments sont DÉPLACÉS (jamais recopiés) : leurs gestionnaires continuent de marcher.
// L'alerte de risque au toucher de « Partir » (59) est gardée.
let dptTab = 'prep', dptDest = null;
// v43 : lieux du quotidien = juste récolter. Pas de provisions, pas de compagnon de route, pas de fiche de stats :
// on ne garde que « Qui part ? », le lieu, « À trouver ici » et le bouton Récolter.
function dptPoi(box) {
  const d = plan.dest; if (!box || !d || !d.poi) return;
  try { if (plan.eqProv && plan.eqProv.length) plan.eqProv = []; } catch (e) {}
  const dfc = box.querySelector('.dfc');
  if (dfc) {
    // « À trouver ici » et tout ce qui suit (ex. « Lieu épuisé ») sont gardés
    const h = [...dfc.querySelectorAll('h4.dfh')].find(x => /trouver/i.test(x.textContent || ''));
    if (h) { const w = document.createElement('div'); w.className = 'dpt-poils'; let n = h; while (n) { const nx = n.nextElementSibling; if (!n.matches('.dftips')) w.appendChild(n); n = nx; } dfc.before(w); }
    dfc.remove();
  }
  box.querySelectorAll('.eqp, .eqd, .f3-go, .xpgo, .dfc-far, .gd-offer').forEach(e => e.remove());
}
function dptSplit(box) {
  dptPoi(box);
  const d = plan.dest;
  if (!box || !d || box.querySelector('.dpt-tabs')) return;
  const head = box.querySelector(':scope > .dhead'), gb = box.querySelector(':scope > .gobar');
  if (!head || !gb) return;
  // nouvelle destination → on ouvre « Le lieu » ; « Me guider » en cours → « Préparation »
  const key = d.id || d.name;
  if (key !== dptDest) { dptDest = key; dptTab = 'prep'; } // le joueur veut toujours arriver sur « Préparation »
  let guiding = false; try { guiding = !!gdOn(); } catch (e) {}
  if (guiding) dptTab = 'prep';
  // contenu de « Le lieu »
  const lieu = document.createElement('div'); lieu.className = 'dpt-lieu';
  box.querySelectorAll(':scope > .xpgo, :scope > .wdgo').forEach(e => lieu.appendChild(e)); // expédition et météo en haut
  const ls = box.querySelector('.dfc .dfls');
  if (ls) {
    const h = ls.previousElementSibling;
    if (h && h.matches('h4.dfh')) lieu.appendChild(h);
    lieu.appendChild(ls);
  }
  const nb = box.querySelector(':scope > .nsbait'); if (nb) { nb.classList.remove('dp-hide'); lieu.appendChild(nb); }
  if (nb) dptBaits(nb, d);
  if (!lieu.children.length) lieu.innerHTML = '<p class="dpt-none">Rien de particulier à trouver ici.</p>';
  const egg = head.querySelector('.dp-egg'); if (egg) egg.remove(); // l'onglet remplace la petite icône
  // le reste (sauf en-tête et Partir) = Préparation
  const prep = document.createElement('div'); prep.className = 'dpt-prep';
  [...box.children].forEach(e => { if (e !== head && e !== gb) prep.appendChild(e); });
  // « Qui part ? » reste en haut de la préparation
  const who = prep.querySelector(':scope > .trjwho'); if (who) prep.prepend(who);
  // v43 : « Compagnon de route » à droite de « Qui part ? » : le % de risque, juste en dessous, se met à jour sous les yeux
  const duo = prep.querySelector(':scope > .eqd');
  if (who && duo) {
    const row = document.createElement('div'); row.className = 'dpt-who2';
    who.before(row); row.appendChild(who); row.appendChild(duo); duo.classList.add('dpt-duo');
    const t = duo.querySelector('.eqp-t span'); if (t) t.innerHTML = 'Avec qui ? <i>facultatif</i>';
  }
  const warn = prep.querySelector('.dfc-far, .dfc.far') ? ' <i class="dpt-dot" aria-label="à préparer"></i>' : '';
  head.insertAdjacentHTML('afterend', `<div class="dpt-tabs" role="tablist"><button role="tab" data-dpttab="lieu" aria-selected="${dptTab === 'lieu'}">🔍 Le lieu</button><button role="tab" data-dpttab="prep" aria-selected="${dptTab === 'prep'}">🎒 Préparation${warn}</button></div>`);
  const tabs = box.querySelector('.dpt-tabs');
  tabs.after(lieu); lieu.after(prep);
  box.dataset.dpt = dptTab;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  try { const bx = document.getElementById('panelBody'); if (bx) bx.querySelectorAll('.evban').forEach(e => e.remove()); /* bandeau d'événement : décale tout, le joueur n'en veut pas ici */ dptSplit(bx); } catch (e) { console.error('départ onglets', e); }
  return r;
})(renderVoyage);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('button[data-dpttab]'); if (!b) return;
  ev.stopPropagation();
  dptTab = b.dataset.dpttab;
  const box = document.getElementById('panelBody'); if (!box) return;
  box.dataset.dpt = dptTab;
  box.querySelectorAll('.dpt-tabs [data-dpttab]').forEach(x => x.setAttribute('aria-selected', x.dataset.dpttab === dptTab));
  box.scrollTop = 0;
}, true);
// ---------------- appâts : nombre possédé, et où en trouver quand on n'en a pas ----------------
function dptBaits(nb, d) {
  nb.querySelectorAll('.nsbb b').forEach(b => { if (!/×\s*\d+\s*$/.test(b.textContent)) b.insertAdjacentText('beforeend', ' ×1'); });
  let bag = [], sc = [];
  try { bag = nsBaitsInBag(); sc = nsScores(d, null).sort((a, b) => b.w - a.w); } catch (e) { return; }
  const tot = sc.reduce((a, b) => a + b.w, 0) || 1;
  const sps = sc.slice(0, 3).filter(x => x.w > 0 && x.w / tot >= 0.06).map(x => x.sp).filter(Boolean);
  const lack = sps.filter(sp => !bag.some(b => b.sps.includes(sp)));
  if (!lack.length) return;
  const rows = lack.map(sp => `<div class="dpt-nob"><span><b>Pas d’appât pour ${esc((typeof NS_PLURAL !== 'undefined' && NS_PLURAL[sp]) || sp)}</b>${typeof NS_BAIT_HINT !== 'undefined' && NS_BAIT_HINT[sp] ? `Ils aiment : ${esc(NS_BAIT_HINT[sp])}.` : ''} À trouver en voyage, au comptoir ou au marché.</span></div>`).join('');
  nb.insertAdjacentHTML('beforeend', `<div class="dpt-nobs">${rows}<button class="btn cream sm" data-dptmk="1">🛒 Voir le marché</button></div>`);
}
// ---------------- « À trouver ici » : toucher un objet montre ce que c'est et à quoi il sert ----------------
let DPT_IT = [];
if (typeof dfLootHTML === 'function') dfLootHTML = (orig => function (d) {
  const h = orig.apply(this, arguments);
  try {
    DPT_IT = [];
    if (!h || d.poi) return h;
    const tbl = lootTable(d.tags || ['campagne']) || [];
    const common = tbl.slice().sort((a, b) => b.p - a.p).filter(x => x.d[3] < 2).slice(0, 4), rare = tbl.filter(x => x.d[3] >= 2).sort((a, b) => b.d[3] - a.d[3]).slice(0, 2);
    [...common, ...rare].forEach(x => DPT_IT.push({ name: x.d[0], cat: x.d[1], sub: x.d[2], rarity: x.d[3], look: x.d[4], color: x.d[5] }));
    if (d.special) DPT_IT.push({ name: d.special[0], cat: d.special[1], sub: d.special[2], rarity: 3, look: d.special[4], color: d.special[5], special: 1 });
    let i = 0;
    return h.replace(/<span class="dfl/g, () => `<span data-dptit="${i++}" role="button" tabindex="0" class="dfl`);
  } catch (e) { return h; }
})(dfLootHTML);
function dptItemInfo(el) {
  const it = DPT_IT[+el.dataset.dptit]; if (!it) return;
  const ls = el.closest('.dfls'); if (!ls) return;
  const old = ls.parentElement.querySelector('.dpt-info'), same = old && old.dataset.i === el.dataset.dptit;
  ls.querySelectorAll('.dpt-on').forEach(x => x.classList.remove('dpt-on'));
  if (old) old.remove();
  if (same) return;
  el.classList.add('dpt-on');
  const known = (S.dex && S.dex[it.name]) || (S.found && it.special && S.found[plan.dest && plan.dest.name]) || it.rarity < 3;
  let rar = ''; try { rar = RARITY[it.rarity] || ''; } catch (e) {}
  let uses = []; try { uses = (GAME.usesOf(it) || []).map(u => u.txt).filter(Boolean); } catch (e) {}
  uses = [...new Set(uses)].slice(0, 3);
  const nm = known ? it.name : (it.special ? 'Souvenir unique de ce lieu' : 'Objet rare encore inconnu');
  const txt = !known ? 'Trouvez-le une première fois pour le découvrir.' : uses.length ? `Sert à : ${uses.join(' · ')}` : (it.special ? 'Un souvenir unique, à poser au foyer.' : 'Se vend ou se recycle.');
  ls.insertAdjacentHTML('afterend', `<div class="dpt-info" data-i="${el.dataset.dptit}"><b>${esc(nm)}</b>${rar ? `<small>${esc(rar)}</small>` : ''}<span>${esc(txt)}</span></div>`);
}
// ---------------- « Expédition » : toucher explique ce qui attend le compagnon ----------------
function dptExpInfo(x) {
  const nx = x.nextElementSibling;
  if (nx && nx.classList.contains('dpt-xinfo')) { nx.remove(); return; }
  let nm = ''; try { nm = CHARS[S.sel].name; } catch (e) {}
  x.insertAdjacentHTML('afterend', `<div class="dpt-xinfo"><span>En expédition, ${esc(nm || 'votre compagnon')} rencontre des <b>choix risqués en route</b>. Le bon matériel, des provisions et un meilleur niveau sur ce terrain font monter ses chances ; la météo peut les faire baisser.</span><button class="btn green sm" data-dpttab="prep">🎒 Voir la préparation</button></div>`);
}
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest || !t.closest('#panelBody .dpt-lieu')) return;
  const it = t.closest('[data-dptit]'); if (it) { ev.stopPropagation(); return dptItemInfo(it); }
  if (t.closest('[data-dptmk]')) { ev.stopPropagation(); try { openBoutique('marche'); } catch (e) {} return; }
  const x = t.closest('.xpgo.expe'); if (x && !t.closest('button')) { ev.stopPropagation(); return dptExpInfo(x); }
});
document.addEventListener('keydown', ev => { const it = ev.target.closest && ev.target.closest('[data-dptit]'); if (it && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); dptItemInfo(it); } });

// ---------------- « Sans préparation » : vraie simulation (sans matériel ni provisions), jamais plus bas que le risque réel ----------------
let dptNoSim = false;
if (typeof dfRiskOf === 'function') dfRiskOf = (orig => function (k, d) {
  const R = orig.apply(this, arguments);
  if (!R || dptNoSim) return R;
  dptNoSim = true;
  try {
    const a = xpEq(k), oldEq = a.slice(), oldP = plan.eqProv, oldD = plan.eqDuo;
    a[0] = null; a[1] = null; plan.eqProv = []; plan.eqDuo = null;
    try { const R0 = orig.call(this, k, d); if (R0) R.no = Math.max(R0.r, R.no); }
    finally { a[0] = oldEq[0]; a[1] = oldEq[1]; plan.eqProv = oldP; plan.eqDuo = oldD; }
  } catch (e) {} finally { dptNoSim = false; }
  if (R.no < R.r) R.no = R.r;
  return R;
})(dfRiskOf);

// ---------------- « Ce qu'il porte » rangé : Matériel / Provisions / Vêtements, utile d'abord, touchable ----------------
if (typeof dfWearHTML === 'function') dfWearHTML = (orig => function (k, d, c, risk) {
  try {
    const terr = c.terr, R = dfRange(k, d), rk = () => { const x = dfRiskOf(k, d); return x ? x.r : 0; };
    const chip = (ico, nm, fx, on, attr) => `<button class="dfw${on ? '' : ' off'}" ${attr || 'disabled'}><span class="dfw-i">${ico}</span><span class="dfw-t"><b>${esc(nm)}</b><small>${fx}</small></span></button>`;
    const sortOn = l => l.sort((a, b) => b.on - a.on);
    // matériel : 4 cases, touchez pour changer
    const gear = xpEqItems(k).map((it, slot) => {
      if (!it) return { on: 1, h: `<button class="dfw dpt-add${xpSlot === slot ? ' sel' : ''}" data-xps="${slot}"><span class="dfw-i"><b>+</b></span><span class="dfw-t"><b>Case ${slot + 1} vide</b><small>Ajouter du matériel</small></span></button>` };
      const G = xpGearOf(it), fx = [];
      if (G && G.g === 'boussole') { const p = R.parts.find(x => x.id === 'comp'); if (p) fx.push(`+${p.km.toLocaleString('fr-FR')} km`); }
      else if (dfUseful(it, c)) {
        const p = R.parts.find(x => x.id === 'g:' + it.id); if (p) fx.push(`+${p.km} km`);
        if (risk) { const w = dfWithEq(k, slot, null, rk); if (w > risk.r + 0.004) fx.push(`−${Math.round((1 - risk.r / w) * 100)} % de risques`); }
      }
      return { on: fx.length ? 1 : 0, h: chip(itemIcon(it), it.name, fx.length ? fx.join(' · ') : 'inutile ici · toucher pour changer', fx.length, `data-xps="${slot}"${xpSlot === slot ? ' data-sel="1"' : ''}`) };
    });
    let pick = '';
    if (xpSlot != null && xpSlot >= 0 && xpSlot < XP_N) {
      const items = xpEqItems(k), mine = (S.inv || []).filter(it => xpGearOf(it)).sort((a, b) => (dfUseful(b, c) - dfUseful(a, c)) || (xpGearOf(b).tier - xpGearOf(a).tier));
      pick = `<div class="dpt-pick"><small>Case ${xpSlot + 1} : choisissez le matériel (vert = utile ici)</small><div class="dpt-pl">${mine.length ? mine.map(it => { const by = xpWornBy(it.id), cur = items[xpSlot] && items[xpSlot].id === it.id, use = dfUseful(it, c); return `<button class="dpt-pi${cur ? ' on' : ''}${use ? ' use' : ''}" data-xpeq="${it.id}" ${by && by !== k ? 'disabled' : ''}>${itemIcon(it)}<span>${esc(it.name)}${by && by !== k ? ` (${esc(xpName(by))})` : ''}</span></button>`; }).join('') : '<span class="dpt-pn">Pas de matériel : atelier › Équipement, ou magasin.</span>'}</div>${items[xpSlot] ? `<button class="btn cream sm" data-xpun="${xpSlot}">Retirer</button>` : ''}</div>`;
    }
    // provisions choisies
    const prov = dfCall(() => eqPlanProv(), []).map((rid, i) => {
      const kd = eqKindOf(rid), fx = kd === 'end' ? '+90 km' : kd === 'moral' ? '+1 objet · +30 km' : (kd === 'chaud' && (terr === 'froid' || terr === 'montagne')) || (kd === 'frais' && terr === 'desert') ? 'moins de risques · +30 km' : '+30 km';
      return { on: 1, h: chip(eqRIco(rid, 'dfp' + i), eqRName(rid), fx, true) };
    });
    // vêtements portés + ensembles
    const wear = dfCall(() => usWornItems(k), []).map(it => {
      const b = dfCall(() => usWearOf(it), null), f = dfCall(() => usFormOf(it), ''), fx = [];
      if (DF_EXPLO.includes(f)) fx.push('+40 km');
      if (b && b.t !== 'cm' && (b.t === terr || b.t === '*')) { fx.push(b.k === 'risk' ? `−${Math.round(b.v * 100)} % de risques` : `+${Math.round(b.v * 100)} % de butin`); if (!DF_EXPLO.includes(f)) fx.push('+20 km'); }
      return { on: fx.length ? 1 : 0, h: chip(itemIcon(it), it.name, fx.length ? fx.join(' · ') : 'rien ici', fx.length, `data-dptfi="${esc(it.id)}"`) };
    });
    dfCall(() => usSetsOf(k), []).filter(x => x.on).forEach(x => {
      const fx = x.St.fx.filter(([t]) => t === terr || t === '*').map(([, kk, v]) => (kk === 'risk' ? `−${Math.round(v * 100)} % de risques` : kk === 'loot' ? `+${Math.round(v * 100)} % de butin` : '')).filter(Boolean);
      if (x.St.id === 'explo') fx.push('+150 km');
      wear.push({ on: fx.length ? 1 : 0, h: chip(`<b class="dfw-set">${x.n}/4</b>`, 'Ensemble ' + x.St.nom, fx.length ? fx.join(' · ') : 'rien ici', fx.length) });
    });
    const grp = (t, l, more) => l.length || more ? `<div class="dpt-wg"><small class="dpt-wt">${t}</small><div class="dfws">${sortOn(l).map(x => x.h).join('')}</div>${more || ''}</div>` : '';
    return grp('🧭 Matériel', gear, pick) + grp('🍱 Provisions', prov) + grp('👕 Vêtements', wear) || `<p class="df-none">Rien d’équipé.</p>`;
  } catch (e) { console.error('porte', e); return orig.apply(this, arguments); }
})(dfWearHTML);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-dptfi]'); if (!b || !b.closest('#panelBody')) return;
  ev.stopPropagation(); try { openFiche(b.dataset.dptfi); } catch (e) {}
});
{
  const st = document.createElement('style');
  st.textContent = `.dpt-tabs{display:flex;gap:6px;margin:4px 0 12px;padding:4px;background:#f3eadc;border-radius:14px}
.dpt-tabs button{flex:1;padding:9px 6px;border:0;border-radius:11px;background:none;font:800 14px var(--body,system-ui);color:#8a7462;cursor:pointer;position:relative}
.dpt-tabs button[aria-selected="true"]{background:#fff;color:var(--ink,#4a3528);box-shadow:0 2px 0 #e2d4bf}
.dpt-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e0533d;vertical-align:middle;margin-left:4px}
#panelBody[data-dpt="lieu"] .dpt-prep,#panelBody[data-dpt="prep"] .dpt-lieu{display:none}
.dpt-lieu{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.dpt-lieu .nsbait{display:block!important}
.dpt-poils{margin:4px 2px 10px;display:flex;flex-direction:column;gap:6px}
.dfl[data-dptit]{cursor:pointer}.dfl.dpt-on{outline:3px solid var(--ink,#4a3528);outline-offset:1px}
.dpt-info{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border:2px solid var(--line,#e7dccb);border-radius:12px;background:#fff;font-size:13.5px;color:var(--ink2,#7a6250)}
.dpt-info b{font:800 14.5px var(--display,inherit);color:var(--ink,#4a3528)}.dpt-info small{font-weight:800;color:#a0805e}
.xpgo.expe{cursor:pointer}
.dpt-xinfo{display:flex;flex-direction:column;gap:8px;align-items:flex-start;margin-top:-4px;padding:8px 10px;border:2px dashed #b9cfe0;border-radius:12px;background:#f7fbfe;font-size:13.5px;color:var(--ink2,#7a6250)}
.dpt-nobs{display:flex;flex-direction:column;gap:6px;margin-top:6px;align-items:flex-start}
.dpt-nob{padding:7px 10px;border:2px solid #f0c9c0;border-radius:12px;background:#fff4f0;font-size:13px;color:var(--ink2,#7a6250)}.dpt-nob b{display:block;color:#b8403a;font-size:13.5px}
.dpt-who2{display:flex;gap:10px;align-items:flex-start;margin-bottom:6px}
.dpt-who2 .trjwho{flex:1 1 auto;min-width:0;margin:0!important}
.dpt-duo{flex:0 0 auto;max-width:44%;margin:0!important;padding:0 0 0 10px!important;border:0!important;border-left:2px dashed #e2d4bf!important;border-radius:0!important;background:none!important;box-shadow:none!important}
.dpt-duo>:not(.eqp-t):not(.eqd-l){display:none!important}
.dpt-duo .eqp-t{display:block;margin:0 0 6px 2px;font:800 12px var(--body,system-ui);letter-spacing:.04em;text-transform:uppercase;color:#9a8470;white-space:nowrap}
.dpt-duo .eqp-t i{font-style:normal;text-transform:none;letter-spacing:0;font-weight:700;color:#b5a08a}
.dpt-duo .eqp-t>:not(span){display:none}
.dpt-duo .eqd-l{display:flex;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:6px;padding-bottom:2px}
.dpt-duo .eqd-l::-webkit-scrollbar{display:none}
.dpt-duo .eqd-c{flex:0 0 auto;width:44px!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;display:flex;flex-direction:column;align-items:center;gap:3px;opacity:.6}
.dpt-duo .eqd-c img{width:40px!important;height:40px!important;border-radius:50%;border:2.5px dashed #d8c6aa;background:#fff;object-fit:cover;box-sizing:border-box}
.dpt-duo .eqd-c span{max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 10.5px var(--body,system-ui);color:var(--ink2,#7a6250)!important}
.dpt-duo .eqd-c.on{opacity:1}.dpt-duo .eqd-c.on img{border:3px solid #5fb36b;box-shadow:0 0 0 3px #d8f0d8}
.dpt-duo .eqd-c.on span{color:var(--ink,#4a3528)!important}
.dpt-who2 .trjwl{gap:8px!important}
.dpt-who2 .trjwb{width:52px}
.dpt-who2 .trjwb img,.dpt-who2 .trjwb .livep{width:44px!important;height:44px!important;max-width:44px}
/* « Sans préparation → avec votre équipement » : les pourcentages ne se coupent plus */
.dfc-cmp{flex-wrap:wrap;text-align:center}
.dfc-cmp b{display:inline-block;white-space:nowrap}
.dfc-cmp>span{white-space:nowrap}
.dpt-wg{display:flex;flex-direction:column;gap:4px;margin-bottom:6px}
.dpt-wt{font:800 11.5px var(--body,system-ui);color:#9a8470;letter-spacing:.03em}
button.dfw{font:inherit;text-align:left;cursor:pointer;color:inherit}button.dfw[disabled]{cursor:default;opacity:1}button.dfw.off[disabled]{opacity:.5}
.dfw[data-sel],.dfw.dpt-add.sel{outline:3px solid var(--ink,#4a3528);outline-offset:1px}
.dfw.dpt-add{border-style:dashed;background:#fffaf0}.dfw.dpt-add .dfw-i b{font:800 20px var(--display,inherit);color:#b49a7c}.dfw.dpt-add small{color:#9a8470}
.dpt-pick{display:flex;flex-direction:column;gap:6px;align-items:flex-start;padding:8px;border:2px solid var(--ink,#4a3528);border-radius:12px;background:#fff}
.dpt-pick small{font:700 12px var(--body,system-ui);color:var(--ink2,#7a6250)}
.dpt-pl{display:flex;flex-wrap:wrap;gap:6px}
.dpt-pi{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 3px;border:2px solid var(--line,#e2d3bd);border-radius:12px;background:#f7f2ea;font:800 12px var(--display,inherit);color:#8a7a6a;cursor:pointer}
.dpt-pi svg,.dpt-pi img{width:28px;height:28px}.dpt-pi.use{background:#ecf7ec;border-color:#5fb36b;color:var(--ink,#4a3528)}.dpt-pi.on{outline:3px solid var(--ink,#4a3528)}.dpt-pi[disabled]{opacity:.45}
.dpt-pn{font-size:12.5px;color:#9a8470}
.dpt-none{margin:6px 2px;color:#9a8470;font-size:14px}`;
  document.head.appendChild(st);
}

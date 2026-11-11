// ================= 59 · PANNEAU DE DÉPART COMPACT ET ALERTE DE RISQUE (v42) =================
// Le joueur (sur téléphone) : « Dans Préparer le voyage, il y a pas mal d'infos, il ne faut pas trop faire défiler.
// Je n'ai pas été bloqué avant de partir, j'avais 23 % de chances de réussir, et je n'ai même pas eu de message d'alerte. »
// 1. COMPACT (post-traitement du DOM, chargé en dernier) : « Qui part ? », une ligne de destination (nom, distance, durée),
//    UNE bande de synthèse (anneau de risque, portée, 3 petites stats), UNE rangée « matériel (2) + provisions (3) »
//    touchable, puis « Détails » replié avec tout le reste, et « Partir » collé en bas. Les éléments sont DÉPLACÉS (jamais
//    recopiés) : leurs gestionnaires délégués sur document continuent de marcher.
// 2. ALERTE AU TOUCHER DE « PARTIR » (capture du clic sur #goBtn) : chances < 50 % → fenêtre d'alerte ; < 25 % → départ
//    bloqué (« Trop dangereux sans préparation »). Chances = 1 − risque de xpRiskK (via dfRiskOf de 50). Les voyages qui ne
//    sont pas des expéditions n'ont pas de risque (ville, campagne proche…) : jamais d'alerte. Exceptions : tutoriel,
//    lieux du quotidien (poi), livraison urgente acceptée.
// 3. Risque élevé : une ligne rouge « ⚠️ » sous la bande de synthèse.
const DPC_WARN = 50, DPC_BLOCK = 25; // en % de chances de réussite
const dpc$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
let dpcMore = false, dpcProv = false, dpcPass = false;
const dpcGdOn = () => dpc$(() => gdOn(), false);

// ---------------- chances de réussite ----------------
function dpcRisk(k, d) {
  if (!d || !CHARS[k] || S.trips[k] || dpc$(() => dfTuto(), false) || d.poi) return null;
  if (dpc$(() => eqDelFor(d), null)) return null;
  const x = dpc$(() => dfRiskOf(k, d), null); if (!x || !(x.r > 0)) return null;
  const pct = Math.round((1 - x.r) * 100);
  return { x, pct, warn: pct < DPC_WARN, block: pct < DPC_BLOCK };
}

// ---------------- les 3 stats ----------------
function dpcStats(k, d) {
  const C = dfCheck(k, d), risk = dpc$(() => dfRiskOf(k, d), null), c = risk ? risk.c : dpc$(() => xpCtxOf(d), { terr: 'foret' });
  const F = dpc$(() => dfFlair(k, d, c), { L: 0, loot: 0, objs: 0, rare: 0 }), R = C.R, r = risk ? risk.r : 0;
  return {
    C, R, r, risk, F,
    end: R.world ? 1 : Math.min(1, R.km / Math.max(1, C.dist)), endOk: C.ok,
    fl: Math.min(1, 0.12 + F.L / 3 + F.loot),
    rb: 1 - r,
  };
}
function dpcBarsHTML(k, d) {
  const T = dpcStats(k, d), { C, R, r, risk, F } = T, kmTxt = R.world ? 'Monde entier' : `${R.km.toLocaleString('fr-FR')} km`;
  const row = (g, col, nm, cls, w, v, vc) => `<div class="dfs">${dfGly(g, col)}<span class="dfs-n">${nm}</span><span class="dfbar ${cls}"><i style="width:${Math.round(w * 100)}%"></i></span><span class="dfs-v${vc ? ' ' + vc : ''}">${v}</span></div>`;
  return `<div class="dfst dpc-bars">`
    + row('endu', '#c9853a', 'Endurance', 'end' + (C.ok ? '' : ' no'), R.world ? 1 : dfPos(R.km), `${C.dist.toLocaleString('fr-FR')} / ${esc(kmTxt)} ${C.ok ? '✓' : '✗'}`, C.ok ? 'ok' : 'no')
    + row('flair', '#d9a520', 'Flair', 'fl', T.fl, F.loot > 0.004 ? `+${Math.round(F.loot * 100)} % butin` : 'butin normal')
    + row('robu', '#5f8fb8', 'Robustesse', 'rb ' + (risk ? dfRC(r) : 'ok'), 1 - r, risk ? `${dfPct(1 - r)} de chances` : 'pas de risque ici')
    + `</div>`;
}

// ---------------- compactage du panneau ----------------
function dpcCompact(box) {
  const k = S.sel, d = plan.dest;
  if (!box || !d || !CHARS[k] || S.trips[k] || dpc$(() => dfTuto(), false) || box.querySelector('.eqdl.busy, .dpc-sum')) return;
  const gb = box.querySelector(':scope > .gobar'); if (!gb || !box.querySelector('#goBtn')) return;
  const T = dpcStats(k, d), { C, R } = T, Rk = dpcRisk(k, d);
  const who = box.querySelector(':scope > .trjwho'), dfc = box.querySelector('.dfc');
  // tout ce qui n'est pas gardé en haut part dans « Détails », dans l'ordre d'origine
  const rest = [...box.children].filter(e => e !== who && e !== gb);
  // ligne de destination
  const info = dpc$(() => trjPlanInfo(d, plan.dur), null), dur = info ? dpc$(() => trjLen(info.total), '') : '';
  const egg = box.querySelector('.dp-egg');
  let h = `<div class="dpc-dest"><span class="dpc-dn"><b>${esc(d.name)}</b><small>${C.dist.toLocaleString('fr-FR')} km${dur ? ` · ${esc(dur)} aller-retour` : ''}</small></span></div>`;
  // bande de synthèse
  const kmTxt = R.world ? 'Monde entier' : `${C.dist.toLocaleString('fr-FR')} / ${R.km.toLocaleString('fr-FR')} km`;
  const mini = (g, col, nm, w, cls) => `<span class="dpc-st${cls ? ' ' + cls : ''}" title="${nm}" aria-label="${nm} : ${Math.round(w * 100)} %">${dfGly(g, col)}<u><i style="width:${Math.max(6, Math.round(w * 100))}%"></i></u></span>`;
  h += `<div class="dpc-sum${Rk && Rk.warn ? ' hot' : ''}"><span class="dpc-ring"></span><span class="dpc-mid"><span class="dpc-km ${C.ok ? 'ok' : 'no'}">${dfGly('far', C.ok ? '#2f7f6c' : '#c9604f')}<b>${esc(kmTxt)} ${C.ok ? '✓' : '✗'}</b>${C.ex ? '<small>autorisé</small>' : ''}</span><span class="dpc-sts">`
    + mini('endu', '#c9853a', 'Endurance', T.end, C.ok ? '' : 'no')
    + mini('flair', '#d9a520', 'Flair', T.fl)
    + mini('robu', '#5f8fb8', 'Robustesse', T.rb, T.risk ? dfRC(T.r) : 'ok')
    + `</span></span></div>`;
  if (Rk && Rk.warn) h += `<p class="dpc-alert">⚠️ ${Rk.block ? `<b>Trop dangereux sans préparation</b> : ${Rk.pct} % de chances` : `<b>Expédition très risquée</b> : ${Rk.pct} % de chances`}. Préparez-vous avant de partir.</p>`;
  // matériel (2 cases) et provisions (3 cases)
  const items = dpc$(() => xpEqItems(k), [null, null]), c = T.risk ? T.risk.c : dpc$(() => xpCtxOf(d), null);
  h += `<div class="dpc-kit"><span class="dpc-grp"><small>Matériel</small><span class="dpc-row">${[0, 1].map(i => { const it = items[i]; const use = it && dpc$(() => dfUseful(it, c), true); return `<button class="dpc-s${it ? ' on' : ''}${it && !use ? ' off' : ''}${xpSlot === i ? ' sel' : ''}" data-xps="${i}" aria-label="${it ? esc(it.name) : 'Case de matériel vide'}" title="${it ? esc(it.name) + (use ? '' : ' (inutile ici)') : 'Équiper du matériel'}">${it ? itemIcon(it) : '<b>+</b>'}</button>`; }).join('')}</span></span><span class="dpc-grp dpc-pv"><small>Provisions</small></span></div>`;
  h += `<div class="dpc-pick"></div>`;
  h += `<details class="dpc-more"${dpcMore || dpcGdOn() ? ' open' : ''}><summary data-dpcmore="1">Détails <span aria-hidden="true">▾</span><small>trouvailles, stats, duo, météo, conseils…</small></summary><div class="dpc-in"></div></details>`;
  (who || gb).insertAdjacentHTML(who ? 'afterend' : 'beforebegin', h);
  const sum = box.querySelector('.dpc-sum'), more = box.querySelector('.dpc-more'), inner = more.querySelector('.dpc-in');
  const dest = box.querySelector('.dpc-dest'), pick = box.querySelector('.dpc-pick'), kit = box.querySelector('.dpc-kit');
  // l'anneau de risque (une seule information de risque)
  const ring = dfc && dfc.querySelector('.dfring'); if (ring) sum.querySelector('.dpc-ring').replaceWith(ring); else sum.querySelector('.dpc-ring').remove();
  // l'œuf (54) et son détail restent sous la main
  if (egg) dest.appendChild(egg);
  const nb = box.querySelector('.nsbait'); if (nb) dest.after(nb);
  // « Trop loin » et « Me guider » restent visibles
  let after = box.querySelector('.dpc-alert') || sum;
  ['.dfc-far', '.gd-offer'].forEach(s => { const e = box.querySelector(s); if (e) { after.after(e); after = e; } });
  // provisions : on déplace les 3 cases du sac (45)
  const sl = box.querySelector('.eqp .eqp-sl'), pv = kit.querySelector('.dpc-pv');
  if (sl) {
    sl.querySelectorAll('span.eqp-s').forEach(s => { s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0'); s.dataset.dpcprov = '1'; s.setAttribute('aria-label', 'Ajouter une provision'); s.innerHTML = '<b>+</b>'; });
    pv.appendChild(sl);
    if (dpcProv && !sl.querySelector('span.eqp-s')) dpcProv = false;
  } else pv.remove();
  // ce qu'on choisit : matériel (xpSlot de 41) ou provisions (liste de 45)
  if (xpSlot === 0 || xpSlot === 1) {
    const mine = (S.inv || []).filter(it => xpGearOf(it)).sort((a, b) => (dpc$(() => dfUseful(b, c), 0) - dpc$(() => dfUseful(a, c), 0)) || (xpGearOf(b).tier - xpGearOf(a).tier));
    pick.innerHTML = `<small>Case ${xpSlot + 1} : choisissez le matériel</small><div class="xpf-pick">${mine.length ? mine.map(it => { const by = xpWornBy(it.id), cur = items[xpSlot] && items[xpSlot].id === it.id, use = dpc$(() => dfUseful(it, c), true); return `<button class="xpp${cur ? ' on' : ''}${use ? '' : ' dpc-useless'}" data-xpeq="${it.id}" ${by && by !== k ? 'disabled' : ''} title="${esc(it.name)}${use ? ' : utile ici' : ' : inutile ici'}${by && by !== k ? ' (équipé par ' + esc(xpName(by)) + ')' : ''}">${itemIcon(it)}<small>${esc(XP_TIER[xpGearOf(it).tier - 1])}</small></button>`; }).join('') : '<span class="xpf-none">Pas de matériel : atelier › Équipement, ou magasin.</span>'}${items[xpSlot] ? `<button class="btn cream sm" data-xpun="${xpSlot}">Retirer</button>` : ''}</div>`;
  } else if (dpcProv || dpcGdOn()) {
    const av = box.querySelector('.eqp .eqp-av, .eqp .eqp-none');
    if (av) { pick.insertAdjacentHTML('afterbegin', '<small>Touchez un plat pour l’emporter</small>'); pick.appendChild(av); }
  }
  if (!pick.children.length) pick.remove();
  // le reste, replié ; les doublons de risque et de portée sont supprimés
  rest.forEach(e => { if (e.isConnected && !e.closest('.dpc-sum, .dpc-dest, .dpc-kit, .dpc-pick, .dpc-more') && e !== nb && !e.matches('.dfc-far, .gd-offer, .dpc-alert')) inner.appendChild(e); });
  inner.querySelectorAll('.dfc-top, .dfc-cmp, .dfc-note, .xp-risk, .eqp-fx, .dhead .dist').forEach(e => e.remove());
  // ce qui empêche de partir reste visible
  const go = box.querySelector('#goBtn');
  inner.querySelectorAll(':scope > .eqdl').forEach(e => more.before(e));
  if (go && go.disabled) inner.querySelectorAll(':scope > .wdgo').forEach(e => more.before(e));
  if (!inner.children.length) more.remove();
  if (Rk && Rk.warn && go) go.classList.add(Rk.block ? 'dpc-blk' : 'dpc-hot');
  box.appendChild(gb); // « Partir » toujours en dernier (sticky)
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  try { dpcCompact(document.getElementById('panelBody')); } catch (e) { console.error('départ compact', e); }
  return r;
})(renderVoyage);
const dpcRender = () => { const b = $('panelBody'), y = b ? b.scrollTop : 0; dpc$(() => renderPanel(), 0); if (b) b.scrollTop = y; };

// ---------------- fenêtre d'alerte ----------------
function dpcAlert(R) {
  const k = S.sel, d = plan.dest, nm = CHARS[k].name, P = d.xpl ? dpc$(() => XP_P[d.xpl], null) : null;
  const need = dpc$(() => gdGearNeeds(k, d), []), box = need.length ? dpc$(() => prepNeedHTML(need, { k, why: `pour ${nm}` }), '') : '';
  const miss = P ? dpc$(() => xpMiss(P, k), []) : [];
  let h = `<div class="dpc-al${R.block ? ' blk' : ''}"><h2>⚠️ Expédition très risquée : ${R.pct} % de chances</h2>`;
  if (R.block) h += `<p class="dpc-al-x"><b>Trop dangereux sans préparation.</b> En dessous de ${DPC_BLOCK} % de chances, ${esc(nm)} ne peut pas partir : équipez le bon matériel pour faire monter ses chances.</p>`;
  else h += `<p class="dpc-al-x">Moins d’une chance sur deux de réussir. Mieux vaut se préparer avant de partir.</p>`;
  h += `<div class="dpc-al-who"><img src="${portraitURI(k)}" alt="" width="40" height="44"><b>${esc(nm)} pour ce voyage</b></div>${dpcBarsHTML(k, d)}`;
  if (box) h += box;
  else if (miss.length) h += `<p class="dpc-al-m">Il manque : ${miss.map(m => esc(m.lbl)).join(', ')}.</p>`;
  h += `<div class="dpc-al-f"><b>En cas d’échec :</b><ul><li>↩️ demi-tour avant d’arriver</li><li>🎒 des objets perdus en route</li><li>🩹 ${esc(nm)} rentre blessé${dpc$(() => compE(k), '')} : repos au foyer (${P ? 40 : 20} min)</li></ul></div>`;
  h += `<div class="dpc-al-b">${typeof gdStart === 'function' ? '<button class="btn gold" data-dpcguide="1">🧭 Me guider</button>' : ''}<button class="btn green" data-closemodal="1">Se préparer</button></div>`;
  if (!R.block) h += `<button class="dpc-anyway" data-dpcgo="1">Partir quand même</button>`;
  showModal(h + `</div>`);
  dpc$(() => sfx('pop'), 0);
}
// toucher « Partir » : avant tous les autres gestionnaires (capture sur document)
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('#goBtn'); if (!b || b.disabled) return;
  const R = dpcRisk(S.sel, plan.dest);
  if (dpcPass) { dpcPass = false; if (R && !R.block) return; }
  if (!R || !R.warn) return;
  ev.preventDefault(); ev.stopPropagation();
  dpcAlert(R);
}, true);
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-dpcguide],[data-dpcgo],[data-dpcprov],[data-dpcmore]'); if (!el) return;
  if (el.dataset.dpcmore) { const det = el.closest('details'); dpcMore = det ? !det.open : !dpcMore; return; } // le navigateur ouvre/ferme lui-même
  ev.preventDefault(); ev.stopPropagation();
  if (el.dataset.dpcprov) { dpcProv = !dpcProv; dpc$(() => { xpSlot = null; }, 0); return dpcRender(); }
  const m = $('modal'); if (m) m.hidden = true;
  if (el.dataset.dpcguide) { const d = plan.dest; if (d) dpc$(() => gdStart(S.sel, d), 0); return; }
  if (el.dataset.dpcgo) { dpcPass = true; const g = $('goBtn'); if (g) g.click(); dpcPass = false; }
});
// clavier sur les cases vides de provisions
document.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.dataset && ev.target.dataset.dpcprov) { ev.preventDefault(); ev.target.click(); } });

// ---------------- style ----------------
{
  const st = document.createElement('style'); st.id = 'dpcCSS';
  st.textContent = `
.dpc-dest{display:flex;align-items:center;gap:8px;margin-top:-4px}
.dpc-dn{flex:1;min-width:0;display:flex;flex-direction:column}
.dpc-dn b{font:800 19px/1.1 var(--display,inherit);color:var(--ink,#4a3528);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpc-dn small{font:700 12.5px var(--body,inherit);color:var(--ink2,#7a6250)}
.dpc-dest .dp-egg{margin-left:0}
.dpc-sum{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border:2.5px solid var(--ink,#4a3528);border-radius:18px;background:linear-gradient(180deg,#fffdf6,#fff6e6);box-shadow:0 3px 0 rgba(74,53,40,.18)}
.dpc-sum.hot{border-color:#c9403a;background:linear-gradient(180deg,#fff6f1,#ffe9e2)}
.dpc-sum .dfring{width:58px;height:58px}.dpc-sum .dfring b{font-size:15px}
.dpc-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.dpc-km{display:flex;align-items:center;gap:6px;font:800 14px var(--display,inherit);color:var(--ink,#4a3528)}
.dpc-km.ok b{color:#2f7f4c}.dpc-km.no b{color:#b8403a}.dpc-km small{font:700 11px var(--body,inherit);color:var(--ink2,#7a6250)}
.dpc-sts{display:flex;gap:8px}
.dpc-st{flex:1;display:flex;align-items:center;gap:4px;min-width:0}
.dpc-st u{flex:1;height:7px;border-radius:5px;background:#efe4d2;overflow:hidden;text-decoration:none;display:block}
.dpc-st u i{display:block;height:100%;background:#c9853a;border-radius:5px}
.dpc-st:nth-child(2) u i{background:#e2b23a}.dpc-st:nth-child(3) u i{background:#3f9a5f}
.dpc-st.mid u i{background:#e0952f!important}.dpc-st.bad u i,.dpc-st.no u i{background:#d0463f!important}
.dpc-alert{margin:-6px 2px 0;font:700 12.5px/1.3 var(--body,inherit);color:#b8302a}
.dpc-alert b{font-weight:800}
.dpc-kit{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}
.dpc-grp{display:flex;flex-direction:column;gap:3px}
.dpc-grp>small{font:800 10.5px var(--body,inherit);letter-spacing:.05em;text-transform:uppercase;color:#9a8470}
.dpc-row,.dpc-pv .eqp-sl{display:flex;gap:6px}
.dpc-s,.dpc-pv .eqp-s{width:44px;height:44px;border-radius:12px;border:2px dashed #cdb894;background:#fff;display:flex;align-items:center;justify-content:center;padding:3px;cursor:pointer;position:relative}
.dpc-s svg{width:100%;height:100%}
.dpc-s.on{border-style:solid;border-color:var(--ink,#4a3528)}.dpc-s.off{opacity:.55;filter:grayscale(.6)}
.dpc-s.sel{box-shadow:0 0 0 3px #f6c445}
.dpc-s b,.dpc-pv span.eqp-s b{font:800 20px var(--display,inherit);color:#b49a72}
.dpc-pick{display:flex;flex-direction:column;gap:4px;padding:6px 8px;border-radius:14px;background:#fffaf0;border:2px solid #e2d3bd;margin-top:-4px}
.dpc-pick>small{font:800 11.5px var(--body,inherit);color:var(--ink2,#7a6250)}
.dpc-pick .eqp-av{display:flex;flex-wrap:wrap;gap:5px}
.xpp.dpc-useless{opacity:.55}
.dpc-more{border:2px solid #e2d3bd;border-radius:16px;background:#fffaf0}
.dpc-more>summary{list-style:none;cursor:pointer;padding:8px 12px;font:800 14px var(--display,inherit);color:var(--ink,#4a3528);display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.dpc-more>summary::-webkit-details-marker{display:none}
.dpc-more>summary small{font:600 11.5px var(--body,inherit);color:#9a8470}
.dpc-more[open]>summary span{display:inline-block;transform:rotate(180deg)}
.dpc-in{display:flex;flex-direction:column;gap:10px;padding:0 10px 10px}
.dpc-in>*{flex-shrink:0}
.dpc-in .dfc{margin:0}
#goBtn.dpc-hot{background:#e0952f}
#goBtn.dpc-blk{background:#c9604f}
.dpc-al{display:flex;flex-direction:column;gap:9px;text-align:left}
.dpc-al h2{margin:0;font:800 19px/1.2 var(--display,inherit);color:#b8302a}
.dpc-al-x{margin:0;font-size:13.5px;line-height:1.35}
.dpc-al.blk .dpc-al-x{padding:7px 9px;border-radius:12px;background:#ffe9e2;border:2px solid #e3a191}
.dpc-al-who{display:flex;align-items:center;gap:8px}.dpc-al-who img{width:40px;height:44px;object-fit:contain}
.dpc-al-who b{font:800 14px var(--display,inherit)}
.dpc-al-m{margin:0;font-weight:700;color:#a8352f}
.dpc-al-f{font-size:13px;line-height:1.35}.dpc-al-f ul{margin:3px 0 0;padding-left:4px;list-style:none}
.dpc-al-b{display:flex;gap:8px;flex-wrap:wrap}.dpc-al-b .btn{flex:1}
.dpc-anyway{align-self:center;background:none;border:0;padding:4px 8px;font:700 12.5px var(--body,inherit);color:#8a7a6a;text-decoration:underline;cursor:pointer}
`;
  document.head.appendChild(st);
}

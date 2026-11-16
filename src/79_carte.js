// ================= 79 · CARTE PLUS LISIBLE (v72) =================
// Les 10 conseils du 15/11, validés par le joueur :
//  1. moins de boutons : à droite, seulement « Menu » et une boussole qui déplie les autres (zoom, 3D, maison, monde) ;
//  2. la barre du haut montre l'état de chacun (en voyage + temps restant, rentré, métier) ; plus de « + » d'équipe ;
//  3. une seule monnaie visible (pièces) : toucher la bourse montre le rang et les pierres d'étoile ;
//  4. épingles moins grises hors de portée, et une étincelle sur les lieux jamais visités à portée ;
//  5 + 9. la zone orange en pointillés porte un nom, et une phrase « Prochaine étape » en haut y emmène ;
//  6. dans le brouillard, les lieux restent mystérieux (« ??? ») et chaque lieu dévoilé rapporte des pièces ;
//  7. les compagnons en route affichent leur temps restant et une petite jauge ;
//  8. un seul bandeau à la fois : les étiquettes d'événement se taisent quand la carte d'action est affichée ;
// 10. dans la fiche de départ, « À trouver ici » passe tout en haut.
const cm$ = (f, d) => { try { return f(); } catch (e) { return d; } };
const cmLeft = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; };

// ---------- 1 · la colonne de boutons ----------
function cmTray() {
  const z = document.querySelector('.zoom'); if (!z) return;
  let b = document.getElementById('cmMore');
  if (!b) {
    b = document.createElement('button'); b.id = 'cmMore'; b.className = 'icon-btn'; b.type = 'button';
    b.setAttribute('aria-label', 'Vue monde ou vue maison'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><path d="M12 5.5 L14.2 12 L12 18.5 L9.8 12Z" fill="#d9604f" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>';
    const g = document.getElementById('gear');
    if (g && g.parentElement === z) g.insertAdjacentElement('afterend', b); else z.prepend(b);
  }
  ['zHome', 'zWorld'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('cm-fold'); });
  /* v73 : le menu ne garde que la vue monde et la vue maison ; zoom au doigt */
  ['zIn', 'zOut', 'z3d'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('cm-gone'); });
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('#cmMore');
  const z = document.querySelector('.zoom'); if (!z) return;
  if (b) { const on = !z.classList.contains('cm-open'); z.classList.toggle('cm-open', on); b.setAttribute('aria-expanded', on); return; }
  // un bouton de la colonne utilisé, ou un toucher ailleurs : on replie (sauf zoom +/− qu'on enchaîne)
    if (z.classList.contains('cm-open')) { z.classList.remove('cm-open'); const m = document.getElementById('cmMore'); if (m) m.setAttribute('aria-expanded', 'false'); }
});

// ---------- 2 · la barre des compagnons ----------
const CM_JOBI = { jard: '🌱', cuis: '🍲', herbo: '🌿', forge: '⚒️', couture: '🧵', nurs: '🥚', comm: '🏪' };
function cmHudStatus() {
  document.querySelectorAll('#hudComps .hc-btn[data-sel]').forEach(b => {
    const k = b.dataset.sel, ch = CHARS[k]; if (!ch) return;
    const t = S.trips && S.trips[k], nm = b.querySelector('.nm'); if (!nm) return;
    let txt = ch.name, cls = '';
    if (t && t.done) { txt = 'Rentré !'; cls = 'done'; }
    else if (t) { txt = '⏳ ' + cmLeft(t.total - t.elapsed); cls = 'away'; }
    if (nm.textContent !== txt) nm.textContent = txt;
    nm.classList.toggle('cm-away', cls === 'away'); nm.classList.toggle('cm-done', cls === 'done');
    const j = cm$(() => fwJob(k), 'repos'), ic = !t && CM_JOBI[j];
    let jb = b.querySelector('.cm-job');
    if (ic) {
      if (!jb) { jb = document.createElement('span'); jb.className = 'cm-job'; b.appendChild(jb); }
      jb.textContent = ic; const lbl = cm$(() => AT_JOBNM[j], '') || ''; jb.title = lbl;
      b.setAttribute('aria-label', `${ch.name}${lbl ? ' : ' + lbl.replace(/^\S+\s/, '') : ''}`);
    } else if (jb) jb.remove();
  });
  const add = document.querySelector('#hudComps .hc-add'); if (add) add.remove();
}
if (typeof renderComps === 'function') renderComps = (orig => function () { const r = orig.apply(this, arguments); cm$(cmHudStatus); return r; })(renderComps);
setInterval(() => { if (!document.hidden) cm$(cmHudStatus); }, 5000);

// ---------- 3 · la bourse ----------
{
  let wasOpen = false;
  document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('#coins')) { const p = document.getElementById('pgRankPop'); wasOpen = !!(p && !p.hidden); } }, true);
  document.addEventListener('click', ev => {
    if (!(ev.target.closest && ev.target.closest('#coins'))) return;
    cm$(() => pgTogglePop(!wasOpen));
  });
}
if (typeof pgPopHTML === 'function') pgPopHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  const n = cm$(() => stonesN(), 0);
  return `<div class="cm-purse"><span>🪙 <b>${(S.coins || 0).toLocaleString('fr-FR')}</b> pièces</span><span>${cm$(() => STONE_SVG, '⭐')} <b>${n}</b> pierre${n > 1 ? 's' : ''} d’étoile <small>(catalogue du Foyer)</small></span></div>` + h;
})(pgPopHTML);

// ---------- 4 + 6 · épingles : étincelle à portée, mystère dans le brouillard ----------
function cmFogged(p) {
  const X = cm$(() => bfX(), null); if (!X) return false;
  if (X.o.some(([a, b, km]) => cm$(() => kmBetween({ lon: a, lat: b }, p), 1e9) < km)) return false;
  const c = cm$(() => exCellOf(p.lon, p.lat), ''); return !(X.leg || []).includes(c) && !(X.z && X.z[c]);
}
function cmPins() {
  if (typeof ovEls === 'undefined' || typeof PLACES === 'undefined') return;
  for (const p of PLACES) {
    const o = ovEls['p' + p.id]; if (!o) continue;
    const fog = !S.found[p.name] && cmFogged(p), far = o.el.classList.contains('dffar'), ex = o.el.classList.contains('dfexp');
    o.el.classList.toggle('cm-fog', fog);
    o.el.classList.toggle('cm-new', !fog && !far && !ex && !S.found[p.name]);
    const l = o.el.querySelector('.pinl'); if (l) { const t = fog ? '???' : p.name; if (l.textContent !== t) l.textContent = t; }
  }
}
// un lieu dévoilé par le brouillard : une petite récompense
if (typeof bfPlay === 'function') bfPlay = (orig => function () {
  const before = cm$(() => PLACES.filter(p => cmFogged(p)).map(p => p.id), []);
  const r = orig.apply(this, arguments);
  if (r && before.length) setTimeout(() => cm$(() => {
    const nw = PLACES.filter(p => before.includes(p.id) && !cmFogged(p));
    if (!nw.length) return;
    const g = 15 * nw.length; gainCoins(g); renderTop(); cmPins();
    toast(`✨ ${nw.length > 1 ? nw.length + ' lieux dévoilés' : nw[0].name + ' dévoilé'} : +${g} pièces !`);
  }), 3600);
  return r;
})(bfPlay);

// ---------- 5 + 9 · la prochaine étape ----------
// v73 : deux lignes — l'histoire (quête) en premier, l'exploration en dessous, en plus petit
function cmQuest() {
  const s = qtState(), L = QT_STORIES.filter(q => qtOpen(q) && !(s.st[q.id] || {}).done);
  const q = L.find(q => q.id === s.follow && s.st[q.id]) || L.find(q => s.st[q.id]) || L[0]; if (!q) return null;
  const rec = s.st[q.id]; if (!rec) return { h: `${esc(q.title)} <small>· nouvelle</small>` };
  const st = q.steps[rec.i]; if (!st) return null;
  const P = cm$(() => qtStepProg(st, rec), { n: 1, cur: 0 });
  return { h: `${esc(st.txt)}${P.n > 1 ? ` <small>${P.cur}/${P.n}</small>` : ''}` };
}
function cmGoal() {
  const tuto = cm$(() => mdTuto(), false) || document.body.classList.contains('firstrun');
  const A = tuto ? null : cm$(() => exAdvice(), null), Q = tuto ? null : cm$(cmQuest, null);
  let g = document.getElementById('cmGoal');
  if (!g) { g = document.createElement('div'); g.id = 'cmGoal'; const hud = document.querySelector('.hud'); if (!hud) return; hud.insertAdjacentElement('afterend', g); }
  const onMap = typeof tab === 'undefined' || tab === 'carte';
  g.hidden = !onMap || (!A && !Q);
  if (!g.hidden) {
    const h = (Q ? `<button type="button" class="cm-gq" data-cmq="1"><span>📜</span><b>Quête :</b> ${Q.h}<i>›</i></button>` : '')
      + (A ? `<button type="button" class="cm-ge" data-cmx="1"><span>🧭</span>Explorer ${esc(String(A.name).replace(/\s*\(.*\)\s*$/, ''))}<i>›</i></button>` : '');
    if (g.innerHTML !== h) g.innerHTML = h;
  }
  const show = onMap && !!A;
  // l'étiquette posée sur la zone orange
  if (typeof ovEls === 'undefined' || !$('ov')) return;
  let o = ovEls.cmTgt;
  if (!o || !o.el.isConnected) { const el = document.createElement('div'); el.className = 'ovm cm-tgt'; el.innerHTML = '<span>🧭 À explorer</span>'; $('ov').appendChild(el); o = ovEls.cmTgt = { el, lon: 0, lat: 0 }; }
  o.el.hidden = !show;
  if (show) { o.lon = A.d.lon; o.lat = A.d.lat; o.el.title = A.txt || ''; }
}
document.addEventListener('click', ev => {
  if (!(ev.target.closest && ev.target.closest('[data-cmq]'))) return;
  ev.stopPropagation(); cm$(() => qtOpenPage());
});
document.addEventListener('click', ev => {
  if (!(ev.target.closest && ev.target.closest('[data-cmx], .cm-tgt'))) return;
  ev.stopPropagation();
  cm$(() => exGoAdvice());
});

// ---------- 7 · les compagnons en route ----------
if (typeof walkerLabel === 'function') walkerLabel = (orig => function (el, k, t) {
  const r = orig.apply(this, arguments);
  cm$(() => {
    const l = el.querySelector('.wkl'); if (!l) return;
    const txt = t.done ? `${CHARS[k].name} est rentré !` : `${CHARS[k].name} · ${cmLeft(t.total - t.elapsed)}`;
    if (l.textContent !== txt) l.textContent = txt;
    let bar = el.querySelector('.cm-wbar');
    if (!bar) { bar = document.createElement('span'); bar.className = 'cm-wbar'; bar.innerHTML = '<i></i>'; el.appendChild(bar); }
    bar.hidden = !!t.done;
    bar.firstChild.style.width = Math.min(100, t.elapsed / t.total * 100).toFixed(0) + '%';
  });
  return r;
})(walkerLabel);

// ---------- tout rafraîchir avec la carte ----------
if (typeof drawMarks === 'function') drawMarks = (orig => function () {
  const r = orig.apply(this, arguments);
  cm$(cmTray); cm$(cmPins); cm$(cmGoal);
  if (typeof positionOverlay === 'function') cm$(positionOverlay);
  return r;
})(drawMarks);
setInterval(() => { if (!document.hidden) { cm$(cmPins); cm$(cmGoal); } }, 4000);
cm$(cmTray);

// ---------- 10 · « À trouver ici » en haut de la fiche de départ ----------
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  cm$(() => {
    const h = [...box.querySelectorAll('h4.dfh')].find(e => /^À trouver ici/.test(e.textContent)); if (!h) return;
    const ls = h.nextElementSibling && h.nextElementSibling.classList.contains('dfls') ? h.nextElementSibling : null; if (!ls) return;
    const w = document.createElement('div'); w.className = 'cm-loot';
    w.appendChild(h); w.appendChild(ls);
    const top = box.querySelector('.dpt-tabs, .dptabs, [role="tablist"]');
    if (top) top.insertAdjacentElement('beforebegin', w); else box.prepend(w);
  });
  return r;
})(renderVoyage);

{
  const st = document.createElement('style');
  st.textContent = `
.zoom .cm-gone{display:none!important}.zoom .cm-fold{display:none}.zoom.cm-open .cm-fold{display:flex}
#cmMore[aria-expanded="true"]{background:#ffe9a8}
.hc-btn .nm.cm-away{background:#fde3e9;color:#a3405a;border-radius:8px;padding:0 4px}
.hc-btn .nm.cm-done{background:#dff3d6;color:#2f7f3c;border-radius:8px;padding:0 4px}
.hc-btn .cm-job{position:absolute;right:-1px;top:2px;width:22px;height:22px;border-radius:50%;background:#fffaf0;border:2px solid #5b4636;font-size:12px;line-height:18px;text-align:center}
#hudComps{max-width:calc(100vw - 150px);overflow-x:auto;scrollbar-width:none}#hudComps::-webkit-scrollbar{display:none}
#pgRank,#stones{display:none!important}
#coins{cursor:pointer}
.cm-purse{display:flex;flex-direction:column;gap:4px;margin:0 0 8px;padding:0 0 8px;border-bottom:1.5px dashed #e2cfae;font-size:13.5px}
.cm-purse span{display:flex;align-items:center;gap:5px}.cm-purse svg{width:16px;height:16px}.cm-purse small{color:#8a6a4a}
.ovm.dffar{opacity:.6!important;filter:grayscale(.15)!important}
.ovm.cm-new .pinb{box-shadow:0 0 0 3px #fff6c9,0 0 14px 4px rgba(246,196,69,.75);animation:cmGlow 1.6s ease-in-out infinite alternate}
@keyframes cmGlow{from{box-shadow:0 0 0 3px #fff6c9,0 0 6px 1px rgba(246,196,69,.5)}to{box-shadow:0 0 0 3px #fff6c9,0 0 16px 6px rgba(246,196,69,.85)}}

.ovm.cm-fog .pinb::after{content:'?';position:absolute;right:-6px;top:-6px;width:17px;height:17px;border-radius:50%;background:#f2c14e;border:2px solid #5b4636;color:#5b4636;font:900 11px/13px var(--display,system-ui);text-align:center}
.ovm.cm-fog .pinl{font-style:italic;opacity:.8}
#cmGoal{position:absolute;z-index:6;top:102px;left:10px;max-width:calc(100% - 76px);display:flex;flex-direction:column;align-items:flex-start;gap:4px}
#cmGoal[hidden]{display:none}
#cmGoal button{display:flex;align-items:center;gap:5px;max-width:100%;border-radius:999px;color:#4a3528;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
#cmGoal button i{font-style:normal;font-weight:900;margin-left:2px}
.cm-gq{padding:6px 11px;border:2px solid #5b4636;background:rgba(255,250,240,.96);font:600 12.5px var(--body,system-ui);box-shadow:0 3px 0 rgba(74,53,40,.18)}
.cm-gq b{font-weight:800;color:#7a5bb5}.cm-gq small{font-weight:800;color:#8a6a4a;margin-left:3px}
.cm-ge{padding:3px 9px;border:1.5px solid rgba(91,70,54,.45);background:rgba(255,250,240,.82);font:600 11px var(--body,system-ui);color:#8a5a2a!important}
body.sheet-open #cmGoal,body.firstrun #cmGoal{display:none}
.ovm.cm-tgt span{display:block;transform:translate(-50%,-50%);padding:3px 9px;border-radius:999px;background:#e8963a;color:#fff;border:2px solid #fff;font:800 11.5px var(--body,system-ui);white-space:nowrap;box-shadow:0 2px 6px rgba(74,53,40,.25);cursor:pointer}
.walker .cm-wbar{position:absolute;left:50%;transform:translateX(-50%);bottom:-24px;width:46px;height:5px;border-radius:3px;background:rgba(255,255,255,.85);border:1.5px solid #5b4636;overflow:hidden}
.walker .cm-wbar i{display:block;height:100%;background:#f2c14e}
body:has(#tripCard:not([hidden])) .wdpin .wdn,body:has(#tripCard:not([hidden])) #liveBar{display:none!important}
.cm-loot{margin:0 0 10px;padding:8px 10px;border-radius:14px;background:#fff6e2;border:2px solid #ecd6ae}.cm-loot h4.dfh{margin-top:0}
`;
  document.head.appendChild(st);
}
window.__cm = { places: () => PLACES, choosePlace: p => choosePlace(p), closeSheet: () => closeSheet(), renderComps: () => renderComps(), drawMarks: () => drawMarks(), startTrip: () => startTrip(), km: (a, b) => kmBetween(a, b), home: () => homeObj() };

// v74 : plus de lieux cachés « notés sur la carte » (ex. Clocher aux pigeons, posé sur la maison) : on reçoit un objet à la place ;
// plus de grand rectangle orange de zone à explorer ni d'étiquette « À explorer » (la ligne « Explorer… » en haut suffit).
if (typeof avAddPlace === 'function') avAddPlace = () => null;
if (typeof exTargetData === 'function') exTargetData = () => ({ type: 'FeatureCollection', features: [] });
{ const st = document.createElement('style'); st.textContent = '.ovm.avpin,.ovm.cm-tgt{display:none!important}'; document.head.appendChild(st); }

// ================= v75 · une carte qui donne envie =================
// A. Un seul objectif à la fois : la carte du bas. Les urgences (retour, choix, œuf, commande) passent devant ;
//    sinon la quête d'abord, puis le conseil habituel (Augustine, exploration…) ; une pastille « 1/2 › » passe de l'un à l'autre.
cmGoal = function () { const g = document.getElementById('cmGoal'); if (g) g.remove(); };
let cmObjI = 0;
const CM_URG = a => !!a && (['collect', 'choose', 'hatch', 'deliver'].includes(a.kind) || (a.kind === 'cs' && a.adv && ['prep', 'defi', 'hurt'].includes(a.adv.src)));
function cmQuestAct() {
  const s = qtState(), L = QT_STORIES.filter(q => qtOpen(q) && !(s.st[q.id] || {}).done);
  const q = L.find(q => q.id === s.follow && s.st[q.id]) || L.find(q => s.st[q.id]) || L[0]; if (!q) return null;
  const rec = s.st[q.id], st = rec && q.steps[rec.i];
  return { kind: 'cmq', q, rec, st, k: `cmq:${q.id}:${rec ? rec.i : 'new'}:${st ? cm$(() => qtStepProg(st, rec).cur, 0) : 0}` };
}
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (CM_URG(a) || cm$(() => csTuto(), false) || document.body.classList.contains('firstrun')) return a;
  const Q = cm$(cmQuestAct, null); if (!Q) return a;
  return cmObjI % 2 === 0 ? Q : a;
})(nextAction);
const cmHasCycle = () => { cmObjI++; const b = cm$(() => nextAction(), null); cmObjI--; return !!b && b.kind !== 'cmq' && !CM_URG(b); };
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = cm$(() => (!document.body.classList.contains('firstrun') ? nextAction() : null), null);
  if (a && a.kind === 'cmq') {
    const { q, rec, st } = a, who = cm$(() => qtCli(q.who).name, '');
    box.hidden = false; box.className = 'tripcard act act-cmq'; box.dataset.k = ''; box.dataset.kind = 'cmq'; box.dataset.sig = cm$(() => actionSig(a), '');
    const face = cm$(() => qtFace(q.who), '📜');
    if (!rec) box.innerHTML = `<span class="acic">${face}</span><div class="tcx"><span class="ack">Nouvelle quête · ${esc(who)}</span><b class="act-t">${esc(q.title)}</b><span class="acs">${esc(q.pitch || '')}</span></div><button class="btn green" data-cmqs="${q.id}">Commencer</button>`;
    else {
      const P = cm$(() => qtStepProg(st, rec), { n: 1, cur: 0 });
      box.innerHTML = `<span class="acic">${face}</span><div class="tcx"><span class="ack">Quête · ${esc(q.title)} · ${rec.i + 1}/${q.steps.length}</span><b class="act-t">${esc(st.txt)}${P.n > 1 ? ` (${P.cur}/${P.n})` : ''}</b><span class="acs">${esc((st.story || '').replace(/[«»]/g, '').trim())}</span></div><button class="btn green" data-cmq="1">Voir</button>`;
    }
  } else orig.apply(this, arguments);
  cm$(() => {
    box.querySelectorAll('.qt-tc').forEach(e => e.remove()); box.classList.remove('qt-on');
    if (box.hidden || CM_URG(a) || !a) return;
    const two = a.kind === 'cmq' ? cmHasCycle() : !!cm$(cmQuestAct, null);
    if (two) box.insertAdjacentHTML('beforeend', `<button type="button" class="cm-sw" data-cmsw="1" aria-label="Voir l’autre objectif">${a.kind === 'cmq' ? 1 : 2}/2 ›</button>`);
  });
})(renderActionCard);
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-cmsw], [data-cmqs]'); if (!t) return;
  ev.stopPropagation();
  if (t.dataset.cmsw) cmObjI = (cmObjI + 1) % 2;
  else cm$(() => qtStart(t.dataset.cmqs));
  cm$(() => renderTripCard());
}, true);

// B. Une carte plus chaude : brouillard couleur parchemin et léger, nuit douce au lieu d'un voile bleu-gris, couleurs un peu plus vives.
function cmWarm() {
  if (typeof map === 'undefined' || !map || !map.getLayer) return;
  cm$(() => { if (map.getLayer('exFog')) { map.setPaintProperty('exFog', 'fill-color', '#f6e7c6'); map.setPaintProperty('exFog', 'fill-opacity', ['interpolate', ['linear'], ['zoom'], 2, 0.26, 8, 0.36]); } });
}
setInterval(() => { if (!document.hidden) cm$(cmWarm); }, 3000);

// C. Des lieux dessinés : chaque lieu devient un petit médaillon illustré (sites célèbres dessinés à part, sinon selon le paysage).
const CM_O = 'stroke="#4a3528" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
const cmSky = c => `<rect width="48" height="48" fill="${c}"/>`;
const cmSun = (x, y, r, c = '#ffd45a') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const cmGnd = (c, y = 38) => `<path d="M0 ${y} Q12 ${y - 3} 24 ${y} T48 ${y} V48 H0Z" fill="${c}" ${CM_O}/>`;
const cmSea = (y = 32) => `<rect y="${y}" width="48" height="${48 - y}" fill="#5aa6d6"/><path d="M6 ${y + 5} q3 -2 6 0 M24 ${y + 8} q3 -2 6 0 M36 ${y + 4} q3 -2 6 0" fill="none" stroke="#e8f8ff" stroke-width="1.4" stroke-linecap="round"/>`;
const cmFir = (x, y, s = 1, c = '#4f9a5f') => `<path d="M${x} ${y - 14 * s} L${x + 6 * s} ${y} H${x - 6 * s}Z" fill="${c}" ${CM_O}/>`;
const cmPeak = (pts, snow, c = '#9aa7be') => `<path d="${pts}" fill="${c}" ${CM_O}/>${snow ? `<path d="${snow}" fill="#fff" ${CM_O}/>` : ''}`;
const CM_ART = {
  // --- par paysage ---
  montagne: cmSky('#cfe8f5') + cmPeak('M-2 40 L16 14 L30 40Z', 'M11 23 L16 14 L21 23 L18 21 L15 24Z') + cmPeak('M18 40 L33 18 L50 40Z', 'M28 26 L33 18 L38 26 L35 24 L32 27Z', '#b3bdd0') + cmGnd('#9fd08a', 40),
  neige: cmSky('#dcecf8') + `<circle cx="10" cy="10" r="1.3" fill="#fff"/><circle cx="36" cy="8" r="1.3" fill="#fff"/><circle cx="24" cy="14" r="1" fill="#fff"/>` + cmGnd('#ffffff', 34) + cmFir(16, 36, 1.1, '#4f8f6a') + cmFir(32, 38, 0.9, '#5ea07a'),
  lac: cmSky('#d8eff7') + `<path d="M-2 30 Q12 18 26 30 Q36 22 50 30 V48 H-2Z" fill="#8fcf7f" ${CM_O}/>` + `<ellipse cx="24" cy="40" rx="24" ry="9" fill="#6fb6dc" ${CM_O}/>` + `<path d="M22 37 h8 l-2 3 h-5z" fill="#fff" ${CM_O}/><path d="M26 37 V30 L30 36Z" fill="#ffe3a8" ${CM_O}/>`,
  mer: cmSky('#ffeec4') + cmSun(34, 17, 7) + cmSea(30),
  foret: cmSky('#e5f4d6') + cmFir(12, 38, 1.1, '#5aa36a') + cmFir(26, 40, 1.4, '#3f8a56') + cmFir(39, 38, 1, '#6db57a') + cmGnd('#8cc46f', 40),
  ville: cmSky('#ffe6d0') + `<rect x="5" y="22" width="12" height="18" fill="#f3b08a" ${CM_O}/><path d="M4 22 L11 15 L18 22Z" fill="#d9604f" ${CM_O}/><rect x="18" y="16" width="12" height="24" fill="#f6d79a" ${CM_O}/><path d="M17 16 L24 9 L31 16Z" fill="#c0603f" ${CM_O}/><rect x="31" y="24" width="12" height="16" fill="#a9cbe6" ${CM_O}/><path d="M30 24 L37 18 L44 24Z" fill="#d9604f" ${CM_O}/><path d="M9 27h4M22 21h4M22 27h4M35 29h4" stroke="#4a3528" stroke-width="2"/>` + cmGnd('#e8d6b0', 41),
  monument: cmSky('#fbe8c4') + `<path d="M8 20 L24 10 L40 20Z" fill="#f2dcae" ${CM_O}/><rect x="8" y="20" width="32" height="3" fill="#e9cf9a" ${CM_O}/><path d="M11 23v14M18 23v14M25 23v14M32 23v14M38 23v14" stroke="#4a3528" stroke-width="3.2"/><path d="M11 23v14M18 23v14M25 23v14M32 23v14M38 23v14" stroke="#f6e6c2" stroke-width="1.6"/><rect x="6" y="37" width="36" height="4" fill="#e9cf9a" ${CM_O}/>`,
  desert: cmSky('#fff1c8') + cmSun(35, 13, 6) + `<path d="M-2 36 Q14 24 30 36 Q40 30 50 34 V48 H-2Z" fill="#f0c27a" ${CM_O}/><path d="M14 38 V26 M14 31 h-4 v-4 M14 29 h4 v-4" fill="none" stroke="#4a3528" stroke-width="4" stroke-linecap="round"/><path d="M14 38 V26 M14 31 h-4 v-4 M14 29 h4 v-4" fill="none" stroke="#6fb06a" stroke-width="2.2" stroke-linecap="round"/>`,
  campagne: cmSky('#e8f4d8') + `<path d="M-2 32 Q14 22 30 32 T50 30 V48 H-2Z" fill="#b8d977" ${CM_O}/><path d="M-2 40 Q18 32 50 40 V48 H-2Z" fill="#f0d68a" ${CM_O}/><rect x="28" y="22" width="9" height="9" fill="#fff4e0" ${CM_O}/><path d="M27 22 L32.5 17 L38 22Z" fill="#d9604f" ${CM_O}/><circle cx="14" cy="25" r="5" fill="#6fb06a" ${CM_O}/>`,
  ile: cmSky('#d6f2ef') + cmSea(33) + `<ellipse cx="24" cy="35" rx="13" ry="4" fill="#f6dca2" ${CM_O}/><path d="M24 34 Q22 24 25 16" fill="none" stroke="#8a5a3a" stroke-width="2.4" stroke-linecap="round"/><path d="M25 16 q-8 -2 -11 4 M25 16 q8 -2 11 4 M25 16 q-3 -6 -9 -6 M25 16 q4 -6 10 -5" fill="none" stroke="#3f9a5a" stroke-width="2.6" stroke-linecap="round"/>`,
  agrumes: cmSky('#fff3cf') + cmGnd('#a7cf7a', 40) + `<rect x="22" y="28" width="4" height="12" fill="#a5784f" ${CM_O}/><circle cx="24" cy="22" r="11" fill="#5fa86a" ${CM_O}/><circle cx="19" cy="20" r="2.4" fill="#f5a623"/><circle cx="27" cy="17" r="2.4" fill="#f5a623"/><circle cx="29" cy="25" r="2.4" fill="#f5a623"/><circle cx="21" cy="27" r="2.4" fill="#f5a623"/>`,
  // --- sites célèbres ---
  'Paris': cmSky('#ffe1d6') + `<path d="M24 5 L27 18 L31 30 L35 42 H29 Q24 34 19 42 H13 L17 30 L21 18Z" fill="#b07a54" ${CM_O}/><path d="M19 30 H29 M21 18 H27" stroke="#4a3528" stroke-width="1.6"/>` + cmGnd('#9fd08a', 42),
  'Chamonix': cmSky('#cfe6f7') + cmPeak('M-4 42 L22 10 L52 42Z', 'M14 20 L22 10 L31 21 L27 19 L24 23 L20 19Z') + cmFir(8, 44, 0.8) + cmFir(40, 44, 0.9),
  'Zermatt': cmSky('#d8ebf8') + cmPeak('M6 42 L28 6 L44 42Z', 'M23 15 L28 6 L33 16 L30 14 L27 18Z', '#8f9cb3') + cmGnd('#9fd08a', 42),
  'Mont-Saint-Michel': cmSky('#fde9c9') + `<rect y="36" width="48" height="12" fill="#e8d3a6"/><path d="M8 38 Q14 22 24 20 Q34 22 40 38Z" fill="#c9b48e" ${CM_O}/><path d="M17 30 h14 v-6 h-14z" fill="#efe3c8" ${CM_O}/><path d="M24 4 L26 16 H22Z" fill="#8f9cb3" ${CM_O}/><rect x="21" y="16" width="6" height="8" fill="#efe3c8" ${CM_O}/>`,
  'Rome': cmSky('#ffe5c7') + `<path d="M4 40 V20 Q24 12 44 20 V40Z" fill="#e6c08c" ${CM_O}/><path d="M9 26 a2.5 3 0 0 1 5 0 v4 h-5z M17 25 a2.5 3 0 0 1 5 0 v5 h-5z M26 25 a2.5 3 0 0 1 5 0 v5 h-5z M34 26 a2.5 3 0 0 1 5 0 v4 h-5z M9 35 a2.5 3 0 0 1 5 0 v5 h-5z M17 34 a2.5 3 0 0 1 5 0 v6 h-5z M26 34 a2.5 3 0 0 1 5 0 v6 h-5z M34 35 a2.5 3 0 0 1 5 0 v5 h-5z" fill="#8a5a3a"/>`,
  'Londres': cmSky('#dfe7f2') + `<rect x="18" y="14" width="12" height="28" fill="#d9b77a" ${CM_O}/><path d="M17 14 L24 3 L31 14Z" fill="#6f7f9b" ${CM_O}/><circle cx="24" cy="20" r="4" fill="#fffaf0" ${CM_O}/><path d="M24 20 V17.5 M24 20 H26" stroke="#4a3528" stroke-width="1.2"/>` + cmGnd('#9fd08a', 42),
  'Gizeh': cmSky('#ffeec4') + cmSun(38, 11, 5) + `<path d="M2 40 L17 16 L32 40Z" fill="#e9b96a" ${CM_O}/><path d="M24 40 L35 24 L46 40Z" fill="#d9a65a" ${CM_O}/>` + `<rect y="40" width="48" height="8" fill="#f0c27a"/>`,
  'Tokyo': cmSky('#ffe3e3') + cmSun(35, 13, 6, '#ef6b6b') + cmPeak('M2 42 L22 14 L44 42Z', 'M16 22 L22 14 L28 22 L25 20 L22 24 L19 20Z', '#8fa3c7') + cmGnd('#f7b8c8', 42),
  'Kyoto': cmSky('#fde5e9') + `<path d="M8 14 Q24 10 40 14 L39 17 Q24 14 9 17Z" fill="#e0533d" ${CM_O}/><rect x="11" y="21" width="26" height="3" fill="#e0533d" ${CM_O}/><rect x="13" y="16" width="4" height="26" fill="#e0533d" ${CM_O}/><rect x="31" y="16" width="4" height="26" fill="#e0533d" ${CM_O}/>` + cmGnd('#9fd08a', 42),
  'Sydney': cmSky('#d8eef8') + cmSea(36) + `<path d="M8 36 Q12 18 20 14 Q18 26 20 36Z M18 36 Q24 16 32 12 Q30 26 32 36Z M30 36 Q34 22 42 20 Q40 30 42 36Z" fill="#fffaf0" ${CM_O}/>`,
  'New York': cmSky('#ffe7cf') + `<rect x="4" y="26" width="8" height="16" fill="#a9b8cf" ${CM_O}/><rect x="13" y="18" width="9" height="24" fill="#c3cfe0" ${CM_O}/><path d="M23 42 V14 h3 V8 h2 V3 h1 v5 h2 v6 h3 v28Z" fill="#9aa9c2" ${CM_O}/><rect x="36" y="22" width="8" height="20" fill="#b7c4d8" ${CM_O}/>` + `<rect y="42" width="48" height="6" fill="#5aa6d6"/>`,
  'Venise': cmSky('#ffe8d2') + `<path d="M4 30 V20 Q12 12 20 20 V30Z" fill="#f2c79a" ${CM_O}/><path d="M28 30 V16 h12 v14Z" fill="#e8a27c" ${CM_O}/>` + cmSea(30) + `<path d="M8 38 Q24 44 40 36 L38 39 Q24 46 10 40Z" fill="#3a2a22" ${CM_O}/><path d="M30 31 L34 44" stroke="#4a3528" stroke-width="1.5"/>`,
  'Amsterdam': cmSky('#e5f0fa') + cmGnd('#9fd08a', 38) + `<path d="M19 40 L21 22 H27 L29 40Z" fill="#c8775a" ${CM_O}/><path d="M18 22 L24 15 L30 22Z" fill="#6f5a4a" ${CM_O}/><path d="M24 18 L12 8 M24 18 L36 8 M24 18 L12 28 M24 18 L36 28" stroke="#4a3528" stroke-width="3"/><path d="M24 18 L12 8 M24 18 L36 8 M24 18 L12 28 M24 18 L36 28" stroke="#fffaf0" stroke-width="1.5"/>` + `<rect y="42" width="48" height="6" fill="#f49ab4"/>`,
  'Santorin': cmSky('#d9eefc') + cmSea(38) + `<rect x="10" y="24" width="20" height="14" fill="#fffaf0" ${CM_O}/><path d="M13 24 a7 7 0 0 1 14 0Z" fill="#3a7bd5" ${CM_O}/><rect x="31" y="28" width="10" height="10" fill="#fffaf0" ${CM_O}/><path d="M18 31 h4 v7 h-4z" fill="#3a7bd5"/>`,
  'Istanbul': cmSky('#ffe6d6') + `<path d="M12 40 V28 h24 v12Z" fill="#e9dccb" ${CM_O}/><path d="M14 28 a10 9 0 0 1 20 0Z" fill="#a9b8cf" ${CM_O}/><path d="M6 40 V12 l1.5 -5 l1.5 5 V40Z M39 40 V12 l1.5 -5 l1.5 5 V40Z" fill="#e9dccb" ${CM_O}/>` + cmGnd('#9fd08a', 42),
  'Grand Canyon': cmSky('#ffe9cc') + `<path d="M-2 18 H16 L20 30 L28 30 L32 18 H50 V48 H-2Z" fill="#d9774f" ${CM_O}/><path d="M-2 26 H18 M30 26 H50 M-2 34 H20 M28 34 H50" stroke="#a9503a" stroke-width="2"/><path d="M20 30 Q24 36 28 30 L30 48 H18Z" fill="#5aa6d6"/>`,
  'Dune du Pilat': cmSky('#fff0d0') + cmSea(32) + `<path d="M-2 44 Q16 14 34 30 Q42 36 50 34 V48 H-2Z" fill="#f2cf8c" ${CM_O}/>` + cmFir(42, 34, 0.7),
  'Machu Picchu': cmSky('#e3f1e6') + `<path d="M20 40 Q26 4 36 8 Q42 20 44 40Z" fill="#5f9f6a" ${CM_O}/><path d="M-2 40 L8 30 H22 V40Z" fill="#c9b48e" ${CM_O}/><path d="M2 34 H20 M0 37 H22" stroke="#8a6a4a" stroke-width="1.4"/>` + cmGnd('#8cc46f', 42),
  'Allée des baobabs': cmSky('#ffe0b8') + cmSun(24, 30, 9, '#ffb36b') + cmGnd('#d9a066', 40) + [10, 24, 38].map(x => `<path d="M${x - 2.5} 40 V20 h5 V40Z" fill="#a5784f" ${CM_O}/><path d="M${x - 6} 18 Q${x} 12 ${x + 6} 18 Q${x} 16 ${x - 6} 18Z" fill="#5f9f6a" ${CM_O}/>`).join(''),
  'Rovaniemi': cmSky('#2f3f6b') + `<path d="M-2 18 Q12 6 24 16 T50 12" fill="none" stroke="#7fe0b0" stroke-width="5" opacity=".75" stroke-linecap="round"/><path d="M-2 24 Q16 14 30 22 T50 20" fill="none" stroke="#b58ef0" stroke-width="3" opacity=".6" stroke-linecap="round"/>` + cmGnd('#ffffff', 38) + cmFir(14, 40, 1, '#3f7a5a') + cmFir(32, 42, 1.2, '#4f8f6a'),
  'Reykjavik': cmSky('#c9dcef') + `<path d="M-2 22 Q14 10 30 20 T50 16" fill="none" stroke="#7fe0b0" stroke-width="4" opacity=".7" stroke-linecap="round"/>` + `<path d="M24 38 Q20 26 24 14 Q28 26 24 38Z" fill="#eaf7ff" ${CM_O}/>` + cmGnd('#8f9cb3', 38),
  'Rio de Janeiro': cmSky('#ffe4c4') + cmSea(34) + `<path d="M4 36 Q10 12 18 14 Q22 22 22 36Z" fill="#6fa36a" ${CM_O}/><path d="M24 36 Q28 24 34 22 Q40 24 42 36Z" fill="#7fb07a" ${CM_O}/>`,
  'Barcelone': cmSky('#ffe6cf') + `<path d="M8 40 V18 Q10 8 12 18 V40Z M16 40 V12 Q18 2 20 12 V40Z M28 40 V12 Q30 2 32 12 V40Z M36 40 V18 Q38 8 40 18 V40Z" fill="#e3b77e" ${CM_O}/><rect x="6" y="30" width="36" height="10" fill="#d9a46a" ${CM_O}/>`,
  'Berlin': cmSky('#e8eef6') + `<rect x="6" y="18" width="36" height="5" fill="#e6d3ad" ${CM_O}/><path d="M9 23 v17 M17 23 v17 M24 23 v17 M31 23 v17 M39 23 v17" stroke="#4a3528" stroke-width="3.6"/><path d="M9 23 v17 M17 23 v17 M24 23 v17 M31 23 v17 M39 23 v17" stroke="#efe0c0" stroke-width="2"/><path d="M20 18 L24 12 L28 18Z" fill="#7aa36a" ${CM_O}/>` + cmGnd('#9fd08a', 42),
  'Édimbourg': cmSky('#dfe6ef') + `<path d="M-2 42 L10 26 H40 L50 42Z" fill="#8f9cb3" ${CM_O}/><rect x="12" y="16" width="24" height="10" fill="#c9b8a0" ${CM_O}/><path d="M12 16 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 h3 v3" fill="none" stroke="#4a3528" stroke-width="1.4"/><rect x="28" y="8" width="6" height="8" fill="#c9b8a0" ${CM_O}/>`,
  'Prague': cmSky('#ffe9d9') + `<rect x="8" y="24" width="32" height="16" fill="#f3e2c7" ${CM_O}/><path d="M13 24 V12 L16 6 L19 12 V24Z M29 24 V12 L32 6 L35 12 V24Z" fill="#7d8a6a" ${CM_O}/>` + `<rect y="40" width="48" height="8" fill="#5aa6d6"/>`,
  'Marrakech': cmSky('#ffe3c2') + cmSun(37, 12, 5) + `<rect x="18" y="12" width="12" height="30" fill="#d9774f" ${CM_O}/><rect x="20" y="7" width="8" height="5" fill="#d9774f" ${CM_O}/><circle cx="24" cy="5" r="1.6" fill="#f6c445"/><path d="M22 18 h4 v4 h-4z M22 28 h4 v4 h-4z" fill="#8a3f2a"/>` + cmGnd('#f0c27a', 42),
  'Le Cap': cmSky('#e3f0fa') + cmSea(36) + `<path d="M2 38 L10 18 H38 L46 38Z" fill="#8f9cb3" ${CM_O}/><path d="M10 18 Q24 15 38 18" fill="none" stroke="#fff" stroke-width="2.4"/>`,
  'Geiranger': cmSky('#d6ebf5') + `<path d="M-2 40 L4 10 L18 40Z" fill="#6f8f7a" ${CM_O}/><path d="M30 40 L44 8 L50 40Z" fill="#6f8f7a" ${CM_O}/><path d="M14 40 L18 30 H30 L34 40Z" fill="#5aa6d6"/><path d="M40 16 V36" stroke="#eaf7ff" stroke-width="2"/>`,
};
CM_ART['Calanques'] = cmSky('#fff0d6') + cmSea(32) + `<path d="M-2 32 L6 14 L14 20 L16 32Z M30 32 L36 12 L46 18 L50 32Z" fill="#efe6d6" ${CM_O}/>`;
CM_ART['Highlands'] = CM_ART['Édimbourg'];
CM_ART['Banff'] = CM_ART.lac.replace('#8fcf7f', '#8f9cb3');
CM_ART['Merzouga'] = CM_ART.desert;
function cmArt(p) {
  const tg = (p.tags || [])[0];
  const svg = CM_ART[p.name] || CM_ART[tg]; if (!svg) return null;
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${svg}</svg>`;
}
if (typeof pinHTML === 'function') pinHTML = (orig => function (p) {
  const a = cm$(() => cmArt(p), null); if (!a) return orig.apply(this, arguments);
  return `<div class="pinb cm-ill${CM_ART[p.name] ? ' cm-star' : ''}" style="--pc:${TAGC[p.tags[0]]}">${a}</div><span class="pinl">${esc(p.name)}</span>`;
})(pinHTML);

{
  const st = document.createElement('style');
  st.textContent = `
.tripcard{position:relative}
.cm-sw{position:absolute;right:12px;top:-13px;padding:2px 9px;border-radius:999px;border:2px solid #5b4636;background:#fffaf0;color:#4a3528;font:800 11.5px var(--body,system-ui);box-shadow:0 2px 0 rgba(74,53,40,.2);cursor:pointer}
.act-cmq .acic .qt-face{width:100%;height:100%;object-fit:contain}
#cvAmb[data-ph="night"] .veil{background:radial-gradient(120% 90% at 50% 35%,rgba(255,196,140,.10),rgba(96,92,160,.20))!important}
#cvAmb[data-ph="night"] .glow{opacity:.35!important}
#mapBox canvas.maplibregl-canvas{filter:saturate(1.12) brightness(1.02)}
.pin .pinb.cm-ill{left:-22px;top:-52px;width:44px;height:44px;border-radius:50%;transform:none;background:var(--pc);border:3px solid #4a3528;padding:2px;box-shadow:0 3px 0 rgba(74,53,40,.35);overflow:visible}
.pin .pinb.cm-ill svg{width:100%;height:100%;transform:none;border-radius:50%;display:block;background:#fffaf0}
.pin .pinb.cm-ill::before{content:'';position:absolute;left:50%;bottom:-9px;width:12px;height:12px;background:var(--pc);border:3px solid #4a3528;border-top:0;border-left:0;transform:translateX(-50%) rotate(45deg);z-index:-1}
.pin .pinb.cm-ill.cm-star{width:52px;height:52px;left:-26px;top:-60px;border-color:#7a4f2a;box-shadow:0 0 0 3px #ffe9a8,0 3px 0 4px rgba(74,53,40,.3)}
.pin:hover .pinb.cm-ill{transform:scale(1.08)}
#ov[data-z="far"] .pin .pinb.cm-ill{transform:scale(.72);transform-origin:50% 100%}
.ovm.cm-fog .pinb.cm-ill svg{filter:saturate(.7)}
.ovm.cm-fog .pinb.cm-ill::after{right:-4px;top:-4px}
`;
  document.head.appendChild(st);
}
window.__cm.art = p => cmArt(p); window.__cm.render = () => renderTripCard();

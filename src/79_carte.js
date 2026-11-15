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
    b.setAttribute('aria-label', 'Plus de boutons : zoom, 3D, maison, monde'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><path d="M12 5.5 L14.2 12 L12 18.5 L9.8 12Z" fill="#d9604f" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>';
    const g = document.getElementById('gear');
    if (g && g.parentElement === z) g.insertAdjacentElement('afterend', b); else z.prepend(b);
  }
  ['zIn', 'zOut', 'z3d', 'zHome', 'zWorld'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('cm-fold'); });
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('#cmMore');
  const z = document.querySelector('.zoom'); if (!z) return;
  if (b) { const on = !z.classList.contains('cm-open'); z.classList.toggle('cm-open', on); b.setAttribute('aria-expanded', on); return; }
  // un bouton de la colonne utilisé, ou un toucher ailleurs : on replie (sauf zoom +/− qu'on enchaîne)
  if (ev.target.closest('#zIn,#zOut')) return;
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
function cmGoal() {
  const tuto = cm$(() => mdTuto(), false) || document.body.classList.contains('firstrun');
  const A = tuto ? null : cm$(() => exAdvice(), null);
  let g = document.getElementById('cmGoal');
  if (!g) { g = document.createElement('button'); g.id = 'cmGoal'; g.type = 'button'; const hud = document.querySelector('.hud'); if (!hud) return; hud.insertAdjacentElement('afterend', g); }
  const show = !!A && (typeof tab === 'undefined' || tab === 'carte');
  g.hidden = !show;
  if (show) { const h = `<span>🧭</span><b>Prochaine étape :</b> ${esc((A.story ? '' : 'explorer ') + String(A.name).replace(/\s*\(.*\)\s*$/, ''))}<i>›</i>`; if (g.innerHTML !== h) g.innerHTML = h; }
  // l'étiquette posée sur la zone orange
  if (typeof ovEls === 'undefined' || !$('ov')) return;
  let o = ovEls.cmTgt;
  if (!o || !o.el.isConnected) { const el = document.createElement('div'); el.className = 'ovm cm-tgt'; el.innerHTML = '<span>🧭 À explorer</span>'; $('ov').appendChild(el); o = ovEls.cmTgt = { el, lon: 0, lat: 0 }; }
  o.el.hidden = !show;
  if (show) { o.lon = A.d.lon; o.lat = A.d.lat; o.el.title = A.txt || ''; }
}
document.addEventListener('click', ev => {
  if (!(ev.target.closest && ev.target.closest('#cmGoal, .cm-tgt'))) return;
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
.zoom .cm-fold{display:none}.zoom.cm-open .cm-fold{display:flex}
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
#cmGoal{position:absolute;z-index:6;top:104px;left:10px;max-width:calc(100% - 76px);display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:999px;border:2px solid #5b4636;background:rgba(255,250,240,.95);color:#4a3528;font:600 12.5px var(--body,system-ui);box-shadow:0 3px 0 rgba(74,53,40,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cmGoal b{font-weight:800;color:#c0603f}#cmGoal i{font-style:normal;font-weight:900;margin-left:2px}
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

// ================= PAGE QUÊTES EN 4 MODES (v33) =================
// Le joueur : « Dans les onglets de quête, on retrouve des éléments similaires et des doublons. On doit bien voir la différence
// entre les modes : récompenses pas identiques, difficulté pas similaire. »
// La page Quêtes est reconstruite ici en 4 onglets bien distincts (chacun n'affiche QUE son contenu, sans défilement vers une section) :
//   📖 Histoires   (histoires + gardiens)                         → tenues, recettes exclusives, familiers légendaires
//   🧭 Exploration (énigmes, traques, cartes déchirées, cadenas)  → titres, trésors uniques, lieux secrets
//   🌸 Monde       (météo, lieux éphémères, moments de saison)    → objets de saison, photos d'album
//   🏆 Défis       (objectif du jour, livraison, défis + contrats + rival) → SEULE source de pierres d'étoile
// Pièces et XP du familier : en bonus partout (plus généreux en Exploration et en Défis).
// Chaque carte porte une pastille de difficulté (1 à 3 ●) et une étiquette du type de récompense (couleur de l'onglet) : qmMeta().
// Les anciennes enveloppes de qtPageHTML (43, 44, 45) sont remplacées : qtPageHTML est réécrite ici et appelle leurs fonctions HTML.
// Expose window.__qm (tests).

const QM_MODES = [
  { id: 'hist', ico: '📖', nm: 'Histoires', pitch: 'Suivez le fil, rencontrez des personnages.', rw: 'Tenues, recettes exclusives, familiers légendaires.' },
  { id: 'explo', ico: '🧭', nm: 'Exploration', pitch: 'Cherchez par vous-même.', rw: 'Titres, trésors uniques, lieux secrets.' },
  { id: 'monde', ico: '🌸', nm: 'Monde', pitch: 'Soyez au bon endroit au bon moment.', rw: 'Objets de saison, photos d’album.' },
  { id: 'defi', ico: '🏆', nm: 'Défis', pitch: 'Dur et répétable.', rw: 'Pierres d’étoile.' },
];
const QM_BY = {}; QM_MODES.forEach(M => { QM_BY[M.id] = M; });
const qmCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const qmTuto = () => qmCall(() => tuOn(), false);
let qmTab = 'hist', qmSnap = {}, qmAllLocks = false;

// pastille de difficulté + étiquettes du type de récompense (même couleur que l'onglet)
function qmMeta(mode, dif, tags) {
  const d = Math.max(1, Math.min(3, Math.round(dif || 1)));
  return `<span class="qm-meta"><i class="qm-dif" title="Difficulté ${d} sur 3" aria-label="Difficulté ${d} sur 3">${'●'.repeat(d)}<em>${'●'.repeat(3 - d)}</em></i>${(tags || []).filter(Boolean).map(t => `<i class="qm-tag qm-${mode}">${esc(t)}</i>`).join('')}</span>`;
}

// ---------------- points rouges des onglets ----------------
function qmDotsLive() {
  const o = {};
  o.hist = qmCall(() => MY_GUARDS.some(G => { const g = myGRec(G.id); return g.d && !g.done && (g.t || 0) >= G.offers.length; }), false);
  o.explo = qmCall(() => MY_MAPS.some(M => myComplete(M.id) && !myState().x[M.id]), false);
  return o;
}
const qmDot = id => !!(qmSnap[id] || qmDotsLive()[id]);

// ---------------- contenu de chaque onglet ----------------
function qmHistHTML() {
  const s = qtState(), f = QT_BY[s.follow];
  let h = f ? qtStoryHTML(f, true) : '<p class="qt-hint">Touchez « Suivre » sur une histoire : son étape s’affiche sur la carte.</p>';
  h += `<h3 class="qt-h3">Histoires <small>${qtDoneN()}/${QT_STORIES.length} terminées</small></h3><div class="qt-stories">${QT_STORIES.filter(q => q !== f).map(q => qtStoryHTML(q)).join('')}</div>`;
  if (!qmTuto() && typeof MY_GUARDS !== 'undefined') {
    const known = MY_GUARDS.filter(G => myGRec(G.id).d), un = MY_GUARDS.length - known.length;
    h += `<h3 class="qt-h3" id="myGardiens">🦌 Gardiens légendaires <small>${known.length}/${MY_GUARDS.length} · gagnez leur confiance</small></h3><div class="my-gs">${known.map(myGuardHTML).join('')}</div>`;
    if (un) h += `<p class="qt-hint qm-small">${un} gardien${un > 1 ? 's' : ''} encore inconnu${un > 1 ? 's' : ''} : en voyage, écoutez les rumeurs.</p>`;
  }
  return h;
}
function qmLockDif(P) { const s = P.need.reduce((a, n) => a + (n[0] === 'g' ? n[2] * 1.5 : n[2] / 2), 0); return s <= 4 ? 1 : s <= 7 ? 2 : 3; }
function qmLocksHTML() {
  if (typeof XP_PLACES === 'undefined') return '';
  const X = xpState(), won = XP_PLACES.filter(P => X.won[P.id]).length;
  const rows = XP_PLACES.filter(P => !X.won[P.id]).map(P => {
    const cs = qmCall(() => xpConds(P, S.sel), []), ok = cs.filter(c => c.ok).length;
    return { P, cs, ok, r: cs.length ? ok / cs.length : 0 };
  }).sort((a, b) => b.r - a.r || qmLockDif(a.P) - qmLockDif(b.P));
  const show = qmAllLocks ? rows : rows.slice(0, 5);
  let h = `<h3 class="qt-h3" id="qmLocks">🔒 Lieux verrouillés <small>${won}/${XP_PLACES.length} conquis · conditions pour ${esc(qmCall(() => CHARS[S.sel].name, 'votre familier'))}</small></h3>`;
  h += show.map(({ P, cs }) => `<div class="qm-lock"><span class="qm-li">🔒</span><div><b>${esc(P.name)}</b>${qmMeta('explo', qmLockDif(P), [P.item[2] === 'outil' ? 'Matériel légendaire' : 'Trésor légendaire', 'Titre'])}<span class="qm-conds">${cs.map(c => `<i class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'} ${esc(c.lbl)}</i>`).join('')}</span></div><button class="btn cream sm" data-qmlock="${P.id}">Voir sur la carte</button></div>`).join('');
  if (rows.length > 5) h += `<button class="qm-more" data-qmmore="1">${qmAllLocks ? 'Voir moins' : `Voir les ${rows.length - 5} autres`}</button>`;
  return h;
}
function qmExploHTML() {
  if (qmTuto() || typeof myRiddlesHTML !== 'function') return '<p class="qt-hint">L’exploration s’ouvre après le tutoriel.</p>';
  return `<section class="my-sec">${qmCall(myRiddlesHTML, '')}${qmCall(wdTrailHTML, '')}${qmCall(() => myMapsHTML().replace('Cartes déchirées <small>', '🗺️ Cartes déchirées <small>'), '')}</section>${qmCall(qmLocksHTML, '')}`;
}
function qmMondeHTML() {
  if (qmTuto() || typeof wdWxHTML !== 'function') return '<p class="qt-hint">Le monde s’éveille après le tutoriel.</p>';
  return `<section class="wd-sec">${qmCall(wdWxHTML, '')}${qmCall(wdEventsHTML, '')}${qmCall(wdMomentsHTML, '')}</section>`;
}
function qmDefiHTML() {
  let h = qmCall(qtDayHTML, '');
  const tu = qmTuto(), E = !tu && typeof eqState === 'function' ? qmCall(() => { eqTick(); return eqState(); }, null) : null;
  if (E && E.del) h += `<h3 class="qt-h3" id="eqLivr">📦 Livraison : apporter votre produit dans une autre ville</h3>${qmCall(() => eqDelCardHTML(E.del), '')}`;
  const open = QT_DEFIS.filter(d => !qtState().df[d.id]).length;
  h += `<h3 class="qt-h3" id="qmDefis">🏆 Défis <small>${E && E.con.length ? `${E.con.length} contrat${E.con.length > 1 ? 's' : ''} pressé${E.con.length > 1 ? 's' : ''} · ` : ''}${open} au long cours</small></h3>`;
  if (E) h += `<section class="eq-sec">${E.con.map(eqConHTML).join('')}${E.con.length || (E.riv && E.riv.last) ? qmCall(eqRivalHTML, '') : ''}</section>`;
  h += `<div class="qt-defis">${QT_DEFIS.map(qtDefiHTML).join('')}</div>`;
  return h;
}
const QM_HTML = { hist: qmHistHTML, explo: qmExploHTML, monde: qmMondeHTML, defi: qmDefiHTML };

// ---------------- la page ----------------
qtPageHTML = function () {
  if (!QM_BY[qmTab]) qmTab = 'hist';
  const M = QM_BY[qmTab];
  if (qmTab === 'monde') qmCall(() => { const W = wdState(); wdEvNow().forEach(E => { W.seen[E.id] = 1; }); }, 0);
  delete qmSnap[qmTab];
  const tabs = QM_MODES.map(T => `<button class="qm-t qm-${T.id}${T.id === qmTab ? ' on' : ''}" data-qmtab="${T.id}" aria-pressed="${T.id === qmTab}"><span>${T.ico}</span>${T.nm}${T.id !== qmTab && qmDot(T.id) ? '<i class="qm-dot" aria-label="nouveau"></i>' : ''}</button>`).join('');
  let body = '';
  try { body = QM_HTML[qmTab](); } catch (e) { console.error('quêtes onglet', e); }
  return `<div class="qt-page qm-page qm-on-${qmTab}"><div class="qt-top"><h2>Quêtes</h2><button class="qt-x" data-closemodal="1" aria-label="Fermer">✕</button></div>
    <nav class="qm-tabs" aria-label="Modes de quête">${tabs}</nav>
    <p class="qm-pitch qm-${qmTab}"><b>${M.pitch}</b><span>→ ${M.rw}</span><small>Pièces et XP en bonus</small></p>
    <div class="qm-body" data-qmbody="${qmTab}">${body}</div>
    <div class="qt-acts"><button class="btn green" data-closemodal="1">Fermer</button></div></div>`;
};
qtOpenPage = function () {
  // points rouges : ce qui était nouveau AVANT l'ouverture (l'objectif du jour et les fêtes sont alors marqués « vus »)
  qmSnap = { defi: qmCall(qtDot, false), monde: qmCall(() => wdDot(), false) };
  const live = qmDotsLive();
  if (!qmSnap[qmTab] && !live[qmTab]) { const t = QM_MODES.find(T => qmSnap[T.id] || live[T.id]); if (t) qmTab = t.id; }
  qtPageOn = true;
  try { const s = qtState(); s.seen = qtDay().d; save(); } catch (e) {}
  qmCall(() => { const W = wdState(); wdEvNow().forEach(E => { W.seen[E.id] = 1; }); save(); }, 0);
  showModal(qtPageHTML()); qtBtns();
  const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0;
};
try { window.__qt.page = qtOpenPage; window.__qt.list = qtOpenPage; } catch (e) {}
function qmShow(id) {
  if (!QM_BY[id]) return;
  qmTab = id; qtPageOn = true;
  const m = $('modal'); if (!m || m.hidden || !m.querySelector('.qt-page')) return qtOpenPage();
  showModal(qtPageHTML()); const mb = m.querySelector('.mbox'); if (mb) mb.scrollTop = 0;
}
function qmLockGo(id) {
  const P = typeof XP_P !== 'undefined' ? XP_P[id] : null; if (!P) return;
  const m = $('modal'); if (m) m.hidden = true; qtPageOn = false;
  qmCall(() => closeSheet(), 0);
  qmCall(() => { xpOpen = P.id; xpPinSig = ''; }, 0);
  qmCall(() => map.flyTo({ center: [P.lon, P.lat], zoom: 6, essential: true }), 0);
  setTimeout(() => qmCall(() => { xpPinSig = ''; xpMapUpdate(); }, 0), 1600);
}
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-qmtab],[data-qmlock],[data-qmmore]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.qmtab) { qmCall(() => sfx('pop'), 0); return qmShow(d.qmtab); }
  if (d.qmlock) return qmLockGo(d.qmlock);
  if (d.qmmore) { qmAllLocks = !qmAllLocks; const m = $('modal'), mb = m && m.querySelector('.mbox'), y = mb ? mb.scrollTop : 0; showModal(qtPageHTML()); if (mb) mb.scrollTop = y; }
});
window.__qm = { tab: qmShow, cur: () => qmTab, html: () => qtPageHTML(), meta: qmMeta, dots: () => Object.assign({}, qmSnap, qmDotsLive()), MODES: QM_MODES };

// ---------------- styles ----------------
(function qmCSS() {
  const st = document.createElement('style'); st.id = 'qmCSS';
  st.textContent = `
.qm-page{--qh:#7a52c0;--qhb:#efe6fb;--qx:#1f7f77;--qxb:#dcf2ee;--qm:#c4487a;--qmb:#fde4ee;--qd:#a8720a;--qdb:#fdf0d0;max-width:100%;overflow-x:hidden}
.qm-page *{max-width:100%}
.qm-page .qt-top{margin:0 0 8px;top:-18px;padding:8px 46px 8px;border-radius:0}.qm-page .qt-x{right:2px;top:50%;transform:translateY(-50%)}
.qm-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:2px 0 8px}
.qm-t{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 2px 6px;border-radius:14px;border:2.5px solid var(--c);background:#fffaf0;color:var(--c);font:800 11.5px/1.1 var(--display,inherit);cursor:pointer;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 2px 0 rgba(74,53,40,.25)}
.qm-t span{font-size:19px;line-height:1.1}
.qm-t.on{background:var(--c);color:#fff;box-shadow:0 2px 0 rgba(74,53,40,.45)}
.qm-t.qm-hist{--c:var(--qh)}.qm-t.qm-explo{--c:var(--qx)}.qm-t.qm-monde{--c:var(--qm)}.qm-t.qm-defi{--c:var(--qd)}
.qm-dot{position:absolute;right:5px;top:4px;width:11px;height:11px;border-radius:50%;background:#e5484d;border:2px solid #fff}
.qm-pitch{margin:0 0 8px;padding:7px 10px;border-radius:12px;border-left:5px solid var(--c);background:var(--cb);display:flex;flex-direction:column;gap:1px;font:600 12.5px/1.3 var(--body,inherit)}
.qm-pitch b{font:800 14px/1.2 var(--display,inherit);color:var(--c)}.qm-pitch span{font-weight:800}.qm-pitch small{font-size:11px;opacity:.7}
.qm-pitch.qm-hist{--c:var(--qh);--cb:var(--qhb)}.qm-pitch.qm-explo{--c:var(--qx);--cb:var(--qxb)}.qm-pitch.qm-monde{--c:var(--qm);--cb:var(--qmb)}.qm-pitch.qm-defi{--c:var(--qd);--cb:var(--qdb)}
.qm-body{min-width:0}.qm-body .qt-h3:first-child{margin-top:4px}
.qm-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:2px 0 1px;font-style:normal}
.qm-dif{font:800 10px/1 system-ui,sans-serif;letter-spacing:1px;color:#4a3528;font-style:normal;white-space:nowrap}.qm-dif em{font-style:normal;opacity:.22}
.qm-tag{font:800 10.5px/1.5 var(--display,inherit);font-style:normal;padding:0 7px;border-radius:999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qm-tag.qm-hist{background:var(--qhb,#efe6fb);color:var(--qh,#7a52c0)}.qm-tag.qm-explo{background:var(--qxb,#dcf2ee);color:var(--qx,#1f7f77)}.qm-tag.qm-monde{background:var(--qmb,#fde4ee);color:var(--qm,#c4487a)}.qm-tag.qm-defi{background:var(--qdb,#fdf0d0);color:var(--qd,#a8720a)}
.qm-page .qt-story,.qm-page .qt-defi,.qm-page .my-row,.qm-page .wd-row,.qm-page .eqc,.qm-page .my-g,.qm-page .qt-drow,.qm-lock{min-width:0}
.qm-page .qt-story>div,.qm-page .qt-defi>div,.qm-page .my-row>div,.qm-page .wd-row>div,.qm-page .eqc>div,.qm-page .my-g>div{min-width:0;overflow-wrap:anywhere}
.qm-lock{display:flex;align-items:center;gap:8px;background:#fffaf0;border:2px solid rgba(74,53,40,.3);border-radius:14px;padding:6px 8px;margin-bottom:6px}
.qm-lock>div{flex:1;min-width:0;display:flex;flex-direction:column;font:600 12px/1.25 var(--body,inherit)}.qm-lock b{font:800 13.5px/1.2 var(--display,inherit)}
.qm-li{font-size:20px;flex:none}
.qm-lock .btn{flex:none;max-width:92px;white-space:normal;line-height:1.1}
.qm-conds{display:flex;flex-wrap:wrap;gap:3px 6px;margin-top:2px}.qm-conds i{font-style:normal;font-size:11px;font-weight:700}.qm-conds .ok{color:#2f7f3a}.qm-conds .no{color:#b0482f}
.qm-more{display:block;margin:0 auto 6px;border:none;background:none;color:var(--qx);font:800 12.5px var(--display,inherit);text-decoration:underline;cursor:pointer}
.qm-small{font-size:12px;padding:6px 9px}
`;
  document.head.appendChild(st);
})();

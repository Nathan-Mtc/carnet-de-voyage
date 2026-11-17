// ================= 82 · LE GRAND TRI (v78) =================
// Le joueur (17/11) : « enrichir le jeu sans créer une usine à gaz ». Une seule boucle : Partir → Vivre le voyage → Rapporter → Préparer.
// Validé « lance tout » : on RETIRE ce qui encombre, on FUSIONNE les doublons. Rien n'est supprimé des sauvegardes :
// on cache les entrées et on neutralise ce qui tournait en arrière-plan, pour pouvoir revenir en arrière si besoin.
const tr$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- RETIRÉS ----------
// 1. Les voyageurs du monde simulés (26) : plus affichés sur la carte (CSS plus bas).
// 2. L'ancien brouillard (62) : plus d'animation de cercles au retour ; les cercles sont enregistrés d'un coup
//    (l'histoire d'Augustine s'en sert encore pour ses « secrets »).
if (typeof bfPlay === 'function') bfPlay = function () {
  const X = tr$(() => bfX(), null); if (!X || !X.pend || !X.pend.length) return false;
  const P = X.pend.splice(0); P.forEach(p => tr$(() => bfCommit(p.lon, p.lat, p.km)));
  tr$(() => { exDirty = true; }); tr$(save); return true;
};
// 3. Cartes postales (Sac › Cartes) et 4. Trésors à part (Sac › Trésors) : sous-onglets retirés.
// 5. Concours de style, tournois, machine à souvenirs, événements mondiaux : sections du Menu et épingles de la carte retirées.
const TR_HIDE_SUB = { sac: ['album', 'tresors'], compagnons: ['reves'], menu: ['col', 'adresses', 'hist'] };
function trSubs() {
  if (typeof SUBTABS === 'undefined') return;
  for (const [t, ks] of Object.entries(TR_HIDE_SUB)) {
    const L = SUBTABS[t]; if (!Array.isArray(L)) continue;
    for (let i = L.length - 1; i >= 0; i--) if (ks.includes(L[i][0])) L.splice(i, 1);
    if (L.length && ks.includes(tr$(() => getSub(t), ''))) tr$(() => setSub(t, L[0][0]));
  }
  if (typeof sacView !== 'undefined' && (sacView === 'album' || sacView === 'tresors')) sacView = 'sac';
  if (typeof compView !== 'undefined' && compView === 'reves') compView = 'garde';
}
if (typeof renderPanel === 'function') renderPanel = (orig => function () { tr$(trSubs); return orig.apply(this, arguments); })(renderPanel);
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  tr$(() => {
    box.querySelectorAll('.msec').forEach(s => { const h = s.querySelector('h3'); const t = h ? h.textContent.trim() : ''; if (/^(Rendez-vous|Aujourd’hui|Événement)$/.test(t)) s.remove(); });
    box.querySelectorAll('[data-menu="event"]').forEach(b => { const row = b.closest('.mrow'); if (row) row.remove(); });
  });
  return r;
})(renderMenu);

// ---------- FUSIONNÉS ----------
// A. Une seule page Quêtes : 📖 Histoire (le carnet d'Augustine) · 🏘️ Habitants (leurs histoires) · ☀️ Du jour.
//    Les anciens onglets Exploration, Monde et Défis disparaissent ; les gardiens légendaires (mystères) aussi.
if (typeof QM_MODES !== 'undefined' && typeof QM_HTML !== 'undefined') {
  const NEW = [
    { id: 'hist', ico: '📖', nm: 'Histoire', pitch: 'Le carnet d’Augustine.', rw: '' },
    { id: 'hab', ico: '🏘️', nm: 'Habitants', pitch: 'Les histoires des gens que vous rencontrez.', rw: '' },
    { id: 'jour', ico: '☀️', nm: 'Du jour', pitch: 'Trois petites quêtes chaque jour.', rw: '' },
  ];
  QM_MODES.splice(0, QM_MODES.length, ...NEW);
  Object.keys(QM_BY).forEach(k => { delete QM_BY[k]; }); NEW.forEach(M => { QM_BY[M.id] = M; });
  const stripG = h => { const d = document.createElement('div'); d.innerHTML = h; d.querySelectorAll('#myGardiens').forEach(e => e.remove()); return d.innerHTML; };
  const hist0 = QM_HTML.hist;
  QM_HTML.hist = function () { return stripG(tr$(() => hist0(), '')); };
  QM_HTML.hab = function () {
    const s = qtState(), f = QT_BY[s.follow];
    let h = f ? qtStoryHTML(f, true) : '<p class="qt-hint">Touchez « Suivre » sur une histoire : son étape s’affiche sur l’écran principal.</p>';
    h += `<h3 class="qt-h3">Histoires des habitants <small>${qtDoneN()}/${QT_STORIES.length} terminées</small></h3><div class="qt-stories">${QT_STORIES.filter(q => q !== f).map(q => qtStoryHTML(q)).join('')}</div>`;
    return h;
  };
  QM_HTML.jour = function () {
    const d = document.createElement('div'), qv = typeof questView !== 'undefined' ? questView : 'jour';
    tr$(() => { questView = 'jour'; renderQuests(d); });
    tr$(() => { questView = qv; });
    d.querySelectorAll('.phead,.filters').forEach(e => e.remove());
    return `<div class="tr-jour">${d.innerHTML}</div>`;
  };
  if (typeof qmDotsLive === 'function') qmDotsLive = () => ({ jour: tr$(() => S.daily.quests.some(q => q.prog >= q.goal && !q.claimed), false) });
  if (typeof qmTab !== 'undefined' && !QM_BY[qmTab]) tr$(() => { qmTab = 'hist'; });
  if (typeof qmShow === 'function') qmShow = (orig => function (id) { return orig.call(this, QM_BY[id] ? id : 'hist'); })(qmShow);
}
// les quêtes du jour se réclament aussi depuis la fenêtre des quêtes
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('.tr-jour [data-claimq]'); if (!b) return;
  ev.stopPropagation();
  const q = S.daily.quests[+b.dataset.claimq]; if (!q || q.claimed || q.prog < q.goal) return;
  q.claimed = true; gainCoins(q.reward); tr$(() => addXP(S.sel, 40)); save(); tr$(renderAll); toast(`+${q.reward} pièces, +40 expérience.`);
  tr$(() => qmShow('jour'));
}, true);

// B. Trésors et mystères : plus de marqueurs ni de zones sur la carte (ils deviendront des surprises du « moment fort » du voyage).
function trMapLayers() {
  if (typeof map === 'undefined' || !map || !map.getLayer) return;
  ['tz-fill', 'tz-halo', 'tz-line', 'mys-fill', 'mys-line'].forEach(id => tr$(() => { if (map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none') map.setLayoutProperty(id, 'visibility', 'none'); }));
}
setInterval(() => { if (!document.hidden) tr$(trMapLayers); }, 2500);

// C. Grandir la maison et la boutique avec des matériaux : fusionné dans les grades des ateliers (on ne construit plus).
if (typeof pgBuildHTML === 'function') pgBuildHTML = () => '';

// D. Boutique : le Comptoir garde la préparation et les commandes ; l'onglet Clients fidèles disparaît.
if (typeof czTabsHTML === 'function') czTabsHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  return h.replace(/<button role="tab" data-cztab="cli"[\s\S]*?<\/button>/, '');
})(czTabsHTML);
if (typeof czGo === 'function') czGo = (orig => function (w) { return orig.call(this, w === 'cli' ? 'prep' : w); })(czGo);
tr$(() => { if (czTab === 'cli') czTab = 'prep'; });

{
  const st = document.createElement('style');
  st.textContent = `
#vyLay,.vy-lay,.vypin{display:none!important}
.ovm.tzm,.ovm.myspin,.ovm.wdpin{display:none!important}
.cz-lv{pointer-events:none}
.tr-jour .quests{margin-top:2px}
.qm-tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}
.qm-t.qm-hab{--c:var(--qx,#1f7f77)}.qm-t.qm-jour{--c:var(--qd,#a8720a)}
.qm-tag.qm-hab{background:var(--qxb,#dcf2ee);color:var(--qx,#1f7f77)}.qm-tag.qm-jour{background:var(--qdb,#fdf0d0);color:var(--qd,#a8720a)}
`;
  document.head.appendChild(st);
}
// v79b : les trésors sont retirés : plus de notes « la zone du trésor s'est resserrée » au retour
if (typeof tzHaulDecorate === 'function') tzHaulDecorate = function () {};

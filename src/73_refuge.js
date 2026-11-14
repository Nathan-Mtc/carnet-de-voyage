// ================= 73 · LE REFUGE PASSE AU FOYER (v46) =================
// Le joueur : « Équipe dans Compagnons ne sert à rien, surtout que nous avons le foyer ». L'onglet Équipe (choisir les 3
// compagnons qui voyagent, les autres restent au refuge) quitte Compagnons ; une section « Le refuge » apparaît en bas
// du Foyer SEULEMENT quand il y a plus de 3 compagnons. Les œufs restent à la Nurserie.
(function () {
  try {
    const A = SUBTABS.compagnons, i = A.findIndex(x => x[0] === 'refuge'); if (i >= 0) A.splice(i, 1);
    Object.assign(TAB_ALIAS, { refuge: ['village', 'foyer'], equipe: ['village', 'foyer'] });
    if (typeof compView !== 'undefined' && compView === 'refuge') compView = 'garde';
  } catch (e) { console.error('refuge', e); }
})();
if (typeof openCompagnons === 'function') openCompagnons = (orig => function (v) { if (v === 'refuge') { openSheet('village'); return; } return orig.apply(this, arguments); })(openCompagnons);
function rfgHTML() {
  const ids = compIds().filter(k => CHARS[k]); if (ids.length <= 3) return '';
  const team = teamIds(), rest = ids.filter(k => !team.includes(k));
  return `<section class="rfg"><h3 class="rfh">Le refuge <small>${rest.length} au repos</small></h3>
    <p class="rfnote">Seuls 3 compagnons partent en voyage : choisissez qui fait partie de l’équipe.</p>
    <h4 class="rfg-h">L’équipe <small>${team.length}/3</small></h4><div class="rfgrid">${team.map(k => compCard(k, true)).join('')}</div>
    ${rest.length ? `<h4 class="rfg-h">Au refuge</h4><div class="rfgrid">${rest.map(k => compCard(k, false)).join('')}</div>` : ''}</section>`;
}
if (typeof renderVillageTab === 'function') renderVillageTab = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try { if (typeof villView !== 'undefined' && villView === 'foyer' && (typeof hmRoom === 'undefined' || hmRoom === 'chambres') && box && !box.querySelector('.rfg')) { const h = rfgHTML(); if (h) box.insertAdjacentHTML('beforeend', h); } } catch (e) { console.error('refuge foyer', e); }
  return r;
})(renderVillageTab);
{
  const st = document.createElement('style');
  st.textContent = `.rfg{margin-top:14px}.rfg-h{margin:8px 2px 4px;font:800 13px var(--body,system-ui);color:#9a8470;text-transform:uppercase;letter-spacing:.04em}.rfg-h small{font-weight:700}`;
  document.head.appendChild(st);
}

// ================= 54 · PANNEAU DE DÉPART ALLÉGÉ (v39) =================
// Demande du joueur : « enlever la carte postale au-dessus de "temps passé sur place", enlever le temps passé
// sur place ; œufs/rencontres et appât → juste une petite icône ; un "Qui part ?" plus authentique ».
// On nettoie le panneau APRÈS tous les autres modules (ce fichier est chargé en dernier).
let dpBaitOpen = false;
function dpClean(box) {
  if (!box) return;
  // 1. Carte postale, carte d'identité du lieu, souvenir unique
  box.querySelectorAll(':scope > .pc.hero, :scope > .btcard').forEach(e => e.remove());
  [...box.children].forEach(e => {
    const t = (e.textContent || '').trim();
    if (/^Souvenir unique/.test(t) && e.tagName !== 'BUTTON') {
      let n = e.nextElementSibling; e.remove();
      while (n && (n.classList.contains('loot') || (n.classList.contains('small') && /Souvenir unique/.test(n.textContent)))) { const nx = n.nextElementSibling; n.remove(); n = nx; }
    }
  });
  // 2. Temps passé sur place (on garde la durée choisie par défaut)
  [...box.children].forEach(e => { if (/^(Temps passé sur place|Durée du voyage|Durée de la récolte)$/.test((e.textContent || '').trim())) e.remove(); });
  box.querySelectorAll(':scope > .durs').forEach(e => e.remove());
  // 3. Œufs, rencontres et appât : une petite icône qui déplie le détail au toucher
  const nb = box.querySelector(':scope > .nsbait');
  if (nb) {
    nb.classList.toggle('dp-hide', !dpBaitOpen);
    const head = box.querySelector(':scope > .dhead');
    if (head && !head.querySelector('.dp-egg')) {
      const n = nb.querySelectorAll('.nsposs > *').length;
      head.insertAdjacentHTML('beforeend', `<button class="dp-egg${dpBaitOpen ? ' on' : ''}" data-dpegg="1" aria-label="Œufs et rencontres possibles ici" title="Œufs et rencontres possibles">🥚${n ? `<b>${n}</b>` : ''}</button>`);
    }
  }
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  try { dpClean(document.getElementById('panelBody')); } catch (e) { console.error('départ', e); }
  return r;
})(renderVoyage);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-dpegg]'); if (!b) return;
  ev.stopPropagation(); dpBaitOpen = !dpBaitOpen;
  const box = document.getElementById('panelBody'), nb = box && box.querySelector('.nsbait');
  if (nb) nb.classList.toggle('dp-hide', !dpBaitOpen);
  b.classList.toggle('on', dpBaitOpen);
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.nsbait.dp-hide{display:none!important}
.dp-egg{margin-left:auto;align-self:center;display:inline-flex;align-items:center;gap:3px;padding:4px 9px;border-radius:999px;border:2px solid var(--line,#e7dccb);background:#fff;font-size:16px;line-height:1;cursor:pointer}
.dp-egg b{font:800 12px var(--body,system-ui);color:var(--ink,#4a3528)}.dp-egg.on{border-color:var(--ink,#4a3528);background:#fff3d6}
/* « Qui part ? » : une rangée de portraits ronds, comme la barre du haut de l'application */
.trjwho{display:block!important;margin:0 0 12px!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important}
.trjwho .trjwk{display:block;margin:0 0 6px 2px;font:800 12px var(--body,system-ui);letter-spacing:.04em;text-transform:uppercase;color:#9a8470}
.trjwho .trjwl{display:flex!important;gap:12px!important;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none;flex-wrap:nowrap!important}
.trjwho .trjwl::-webkit-scrollbar{display:none}
.trjwb{flex:0 0 auto;display:flex!important;flex-direction:column;align-items:center;gap:4px;width:64px;padding:0!important;background:none!important;border:0!important;box-shadow:none!important;border-radius:0!important;cursor:pointer}
.trjwb img,.trjwb .livep{width:54px!important;height:54px!important;max-width:54px;flex:none;border-radius:50%;background:var(--tint,#fde8d4);border:3px solid #e7dccb;box-sizing:border-box;overflow:hidden;position:static!important;transform:none!important;margin:0!important}
.trjwb .livep svg,.trjwb .livep img{width:100%!important;height:100%!important;border:0}
.trjwb b{font:800 12px var(--body,system-ui)!important;color:#7a6656;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trjwb.on img,.trjwb.on .livep{border-color:#5fb36b;box-shadow:0 0 0 3px #d8f0d8}
.trjwb.on b{color:var(--ink,#4a3528)}
.trjwb:not(.on){opacity:.75}`;
  document.head.appendChild(st);
}

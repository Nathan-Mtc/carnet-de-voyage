// ================= 60 · PANNEAU DE DÉPART EN 2 ONGLETS (v43) =================
// Le joueur n'a pas aimé la version compacte (59, trop de changements) : on revient à l'ancien panneau,
// mais coupé en 2 onglets pour moins faire défiler sur téléphone :
//   🔍 « Le lieu »      : ce qu'on peut trouver ici (À trouver ici, œufs et rencontres, météo, type d'expédition) ;
//   🎒 « Préparation »  : qui part, chances, matériel, provisions, compagnon de route, énergie.
// L'en-tête (destination) et le bouton « Partir » restent visibles dans les deux onglets.
// Les éléments sont DÉPLACÉS (jamais recopiés) : leurs gestionnaires continuent de marcher.
// L'alerte de risque au toucher de « Partir » (59) est gardée.
let dptTab = 'prep', dptDest = null;
function dptSplit(box) {
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
  const ls = box.querySelector('.dfc .dfls');
  if (ls) {
    const h = ls.previousElementSibling;
    if (h && h.matches('h4.dfh')) lieu.appendChild(h);
    lieu.appendChild(ls);
  }
  const nb = box.querySelector(':scope > .nsbait'); if (nb) { nb.classList.remove('dp-hide'); lieu.appendChild(nb); }
  box.querySelectorAll(':scope > .xpgo, :scope > .wdgo').forEach(e => lieu.appendChild(e));
  if (!lieu.children.length) lieu.innerHTML = '<p class="dpt-none">Rien de particulier à trouver ici.</p>';
  const egg = head.querySelector('.dp-egg'); if (egg) egg.remove(); // l'onglet remplace la petite icône
  // le reste (sauf en-tête et Partir) = Préparation
  const prep = document.createElement('div'); prep.className = 'dpt-prep';
  [...box.children].forEach(e => { if (e !== head && e !== gb) prep.appendChild(e); });
  // « Qui part ? » reste en haut de la préparation
  const who = prep.querySelector(':scope > .trjwho'); if (who) prep.prepend(who);
  const warn = prep.querySelector('.dfc-far, .dfc.far') ? ' <i class="dpt-dot" aria-label="à préparer"></i>' : '';
  head.insertAdjacentHTML('afterend', `<div class="dpt-tabs" role="tablist"><button role="tab" data-dpt="lieu" aria-selected="${dptTab === 'lieu'}">🔍 Le lieu</button><button role="tab" data-dpt="prep" aria-selected="${dptTab === 'prep'}">🎒 Préparation${warn}</button></div>`);
  const tabs = box.querySelector('.dpt-tabs');
  tabs.after(lieu); lieu.after(prep);
  box.dataset.dpt = dptTab;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  try { dptSplit(document.getElementById('panelBody')); } catch (e) { console.error('départ onglets', e); }
  return r;
})(renderVoyage);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-dpt]'); if (!b) return;
  ev.stopPropagation();
  dptTab = b.dataset.dpt;
  const box = document.getElementById('panelBody'); if (!box) return;
  box.dataset.dpt = dptTab;
  box.querySelectorAll('[data-dpt]').forEach(x => x.setAttribute('aria-selected', x.dataset.dpt === dptTab));
  box.scrollTop = 0;
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.dpt-tabs{display:flex;gap:6px;margin:4px 0 12px;padding:4px;background:#f3eadc;border-radius:14px}
.dpt-tabs button{flex:1;padding:9px 6px;border:0;border-radius:11px;background:none;font:800 14px var(--body,system-ui);color:#8a7462;cursor:pointer;position:relative}
.dpt-tabs button[aria-selected="true"]{background:#fff;color:var(--ink,#4a3528);box-shadow:0 2px 0 #e2d4bf}
.dpt-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e0533d;vertical-align:middle;margin-left:4px}
#panelBody[data-dpt="lieu"] .dpt-prep,#panelBody[data-dpt="prep"] .dpt-lieu{display:none}
.dpt-lieu{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.dpt-lieu .nsbait{display:block!important}
.dpt-none{margin:6px 2px;color:#9a8470;font-size:14px}`;
  document.head.appendChild(st);
}

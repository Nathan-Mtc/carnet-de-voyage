// ================= 68 · GARDE-ROBE ALLÉGÉE (v45) =================
// Le joueur (12/11) : « dans Habits il y a tellement de choses qu'il m'a fallu 4 captures sur téléphone ».
// Décisions : un seul écran — le miroir au centre ; toucher une case ouvre la liste de CET emplacement (une ligne par
// vêtement : icône, nom, UN bonus) ; une ligne « Bonus portés » sous le miroir (le détail des ensembles se déplie) ;
// les tenues enregistrées s'ouvrent avec le bouton « Tenues » du miroir. Systèmes retirés (doublons des ensembles) :
// tenues météo (pluie, froid, soleil, charme, route), tenue régionale, « Débloque : choix d'aventure » affiché.
// On garde : le bonus de chaque vêtement (47_usages.js usWearOf) et les ensembles (Marin breton, Jardinier…).
let grOpen = false, grSaved = false;
// les systèmes retirés : plus d'effet ni d'affichage
if (typeof cpWear === 'function') cpWear = function () { return { th: {}, set: null, reg: null, avN: 0 }; };
if (typeof cpItemEffects === 'function') cpItemEffects = function () { return []; };
if (typeof cpItemBadges === 'function') cpItemBadges = function () { return ''; };
if (typeof cpItemFxHTML === 'function') cpItemFxHTML = function () { return ''; };
const gr$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
function grBonusLine(k) {
  const bs = gr$(() => usBonusOf(k).filter(b => !b.set), []), g = new Map();
  bs.forEach(b => { const key = b.t + b.k; g.set(key, { ...b, v: (g.get(key) ? g.get(key).v : 0) + b.v }); });
  const sets = gr$(() => usSetsOf(k), []).filter(x => x.on);
  const chips = [...g.values()].map(b => `<span class="gr-c">${gr$(() => usBonusTxt(b.t, b.k, Math.min(US_CAP[b.k], b.v)), '')}</span>`)
    .concat(sets.map(x => `<span class="gr-c set">Ensemble ${esc(x.St.nom)}</span>`));
  return `<details class="gr-bonus"><summary><b>✨ Bonus portés</b>${chips.length ? chips.join('') : '<span class="gr-none">aucun pour l’instant</span>'}<i class="gr-more">ensembles ▾</i></summary>${gr$(() => usWardHTML(k), '')}</details>`;
}
if (typeof renderWardrobe === 'function') renderWardrobe = (orig => function (k) {
  const html = orig.apply(this, arguments);
  try {
    const T = document.createElement('template'); T.innerHTML = html;
    const R = T.content;
    R.querySelectorAll('.cpwsum, .cpset, .wrshop, .uswr').forEach(e => e.remove());
    const stage = R.querySelector('.wrstage');
    if (stage) stage.insertAdjacentHTML('afterend', grBonusLine(k));
    const panel = R.querySelector('.wrpanel');
    if (panel) {
      if (!grOpen) panel.remove();
      else {
        panel.classList.add('gr-panel');
        // une ligne par vêtement : icône, nom, UN bonus
        panel.querySelectorAll('.wrv[data-wput]').forEach(b => {
          const it = (S.inv || []).find(x => x.id === b.dataset.wput), w = it ? gr$(() => usWearOf(it), null) : null;
          const ico = b.querySelector('.wrvi'), tag = b.querySelector('.wrtag');
          b.innerHTML = `${ico ? ico.outerHTML : ''}<span class="gr-vt"><b>${esc(it ? it.name : '')}</b><small>${w && w.txt ? esc(w.txt) : 'pour le style'}</small></span>${tag ? tag.outerHTML : ''}`;
          b.classList.add('gr-v');
        });
        panel.querySelector('.wrph') && panel.querySelector('.wrph').insertAdjacentHTML('beforeend', '<button class="gr-x" data-grclose="1" aria-label="Fermer la liste">×</button>');
      }
    }
    const sh = R.querySelector('#wrSaved'), sv = R.querySelector('.wrsaved');
    if (!grSaved) { if (sh) sh.remove(); if (sv) sv.remove(); }
    const box = document.createElement('div'); box.appendChild(R.cloneNode(true));
    return box.innerHTML;
  } catch (e) { console.error('garde-robe', e); return html; }
})(renderWardrobe);
// toucher une case : ouvre sa liste (retoucher la même case la referme)
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const cl = t.closest('[data-grclose]'); if (cl) { ev.stopPropagation(); grOpen = false; gr$(() => stRefresh(), 0); return; }
  const sl = t.closest('[data-wslot]');
  if (sl && !sl.closest('.gr-bonus')) { grOpen = !(grOpen && gr$(() => stSlot, '') === sl.dataset.wslot); grSaved = false; return; }
  const sv = t.closest('[data-wjump="saved"]');
  if (sv) { ev.stopPropagation(); grSaved = !grSaved; grOpen = false; gr$(() => stRefresh(), 0); setTimeout(() => { const s = document.getElementById('wrSaved'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); }
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.gr-bonus{margin:8px 0;padding:6px 10px;border:2px solid var(--line,#e7dccb);border-radius:14px;background:#fff}
.gr-bonus summary{display:flex;flex-wrap:wrap;align-items:center;gap:5px;cursor:pointer;list-style:none}.gr-bonus summary::-webkit-details-marker{display:none}
.gr-bonus summary>b{font:800 13.5px var(--display,inherit);color:var(--ink,#4a3528);margin-right:2px}
.gr-c{padding:2px 8px;border-radius:999px;background:#ecf7ec;border:1.5px solid #9fd0a6;font:700 12px var(--body,system-ui);color:#2f7f4c}.gr-c.set{background:#f3ecfb;border-color:#c4b0e6;color:#5e4a8a}
.gr-none{font-size:12.5px;color:#9a8470}.gr-more{margin-left:auto;font-style:normal;font-size:11.5px;color:#9a8470}.gr-bonus[open] .gr-more{visibility:hidden}
.gr-bonus .uswr{margin-top:6px;border:0;padding:0;background:none}.gr-bonus .uswl{display:none}
.gr-panel{position:relative}.gr-x{margin-left:auto;width:28px;height:28px;border-radius:50%;border:2px solid var(--ink,#4a3528);background:#fff;font:800 16px/1 var(--body,system-ui);cursor:pointer}
.gr-panel .wrgrid{grid-template-columns:1fr!important;gap:5px!important}
.gr-panel .wrv.gr-v{display:flex!important;flex-direction:row!important;align-items:center;gap:8px;padding:5px 8px!important;min-height:0!important;text-align:left}
.gr-v .wrvi{width:34px;height:34px;flex:none}.gr-v .wrvi svg,.gr-v .wrvi img{width:34px;height:34px}
.gr-vt{flex:1;min-width:0;display:flex;flex-direction:column}.gr-vt b{font:800 13.5px var(--display,inherit);color:var(--ink,#4a3528);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gr-vt small{font-size:12px;color:#2f7f4c}
.gr-v .wrtag{position:static!important;flex:none}`;
  document.head.appendChild(st);
}

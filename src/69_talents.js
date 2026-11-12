// ================= 69 · TALENTS SUR UN ÉCRAN (v45) =================
// Le joueur : « dans Talents on a pas mal de choses aussi, il faudrait que ça tienne sur quasi un écran, même système ».
// Même principe que la garde-robe (68) : l'en-tête du compagnon + l'arbre de talents (l'élément principal) ; dessous,
// 3 boutons — Nourrir · Matériel · Spécialité — qui ouvrent UN panneau à la fois (retoucher le referme).
// Retirés : la phrase d'aide sous l'arbre et la rangée « gagner de l'expérience » (expliqué dans le carnet › Guide).
let tlOpen = '';
const TL_P = [['feed', '.pg-feed', '🍖', 'Nourrir'], ['mat', '.xpf', '🎒', 'Matériel'], ['spe', '.eqf', '🎓', 'Spécialité']];
if (typeof renderCompagnons === 'function') renderCompagnons = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (typeof compView === 'undefined' || compView !== 'talents' || !box) return r;
    const cpt = box.querySelector('.cpt'); if (!cpt) return r;
    cpt.querySelectorAll('.cpthint, .cpxp').forEach(e => e.remove());
    const parts = TL_P.map(([id, sel, ic, nm]) => ({ id, ic, nm, el: cpt.querySelector(sel) })).filter(p => p.el);
    if (!parts.length) return r;
    if (tlOpen && !parts.some(p => p.id === tlOpen)) tlOpen = '';
    const tree = cpt.querySelector('.cptree');
    const row = document.createElement('div'); row.className = 'tl-row';
    row.innerHTML = parts.map(p => `<button class="tl-b${tlOpen === p.id ? ' on' : ''}" data-tlp="${p.id}" aria-expanded="${tlOpen === p.id}"><span>${p.ic}</span>${p.nm}</button>`).join('');
    const pane = document.createElement('div'); pane.className = 'tl-pane';
    parts.forEach(p => { if (p.id === tlOpen) pane.appendChild(p.el); else p.el.remove(); });
    if (tree) tree.after(row); else cpt.appendChild(row);
    if (tlOpen) row.after(pane);
  } catch (e) { console.error('talents', e); }
  return r;
})(renderCompagnons);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-tlp]'); if (!b) return;
  ev.stopPropagation();
  tlOpen = tlOpen === b.dataset.tlp ? '' : b.dataset.tlp;
  const p = $('panelBody'), y = p ? p.scrollTop : 0; renderPanel(); if (p) p.scrollTop = y;
  if (tlOpen) setTimeout(() => { const x = document.querySelector('.tl-pane'); if (x && x.scrollIntoView) x.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 40);
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.tl-row{display:flex;gap:6px;margin:8px 0 6px}
.tl-b{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;border:2px solid var(--line,#e2d3bd);border-radius:14px;background:#fff;font:800 12.5px var(--body,system-ui);color:var(--ink,#4a3528);cursor:pointer;box-shadow:0 2px 0 rgba(74,53,40,.12)}
.tl-b span{font-size:18px;line-height:1}.tl-b.on{border-color:var(--ink,#4a3528);background:#fff3c9}
.tl-pane>*{margin-top:0!important}
.eqf-am{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.eqf-am span{display:inline-flex;align-items:center;gap:5px;padding:2px 8px 2px 2px;border-radius:999px;background:#fff3f6;border:1.5px solid #f0c4d2;font-size:12px;color:var(--ink2,#7a6250)}
.eqf-am img,.eqf-am .livep{width:26px!important;height:26px!important;max-width:26px;border-radius:50%;flex:none;overflow:hidden;position:static!important;transform:none!important}.eqf-am .livep svg,.eqf-am .livep img{width:100%!important;height:100%!important}`;
  document.head.appendChild(st);
}

// ================= 64 · RECOMMENCER UNE NOUVELLE PARTIE (v43) =================
// Le joueur veut refaire le tutoriel depuis le début. Menu › Aide : « Recommencer une partie », avec confirmation
// en deux temps (rien n'est effacé sans le second « Oui, tout effacer »). Efface la sauvegarde puis recharge la page.
let rcAsk = false;
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const h = rcAsk
      ? `<div class="rc-ask"><b>Tout effacer et recommencer ?</b><span>Compagnons, objets, pièces, boutique, histoire : tout repart de zéro. Impossible de revenir en arrière.</span><div><button class="btn cream sm" data-rcgo="no">Non, garder ma partie</button><button class="btn sm rc-yes" data-rcgo="yes">Oui, tout effacer</button></div></div>`
      : `<button class="rc-btn" data-rcgo="ask">🔄 Recommencer une nouvelle partie</button>`;
    box.insertAdjacentHTML('beforeend', `<section class="msec rc">${h}</section>`);
  } catch (e) { console.error('recommencer', e); }
  return r;
})(renderMenu);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-rcgo]'); if (!b) return;
  ev.stopPropagation();
  const v = b.dataset.rcgo;
  if (v === 'yes') {
    try { save = function () {}; } catch (e) {}
    try { localStorage.removeItem(SAVE); } catch (e) {}
    location.reload();
    return;
  }
  rcAsk = v === 'ask';
  const p = $('panelBody'), y = p ? p.scrollTop : 0; renderPanel(); if (p) p.scrollTop = y;
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.msec.rc{padding:8px 0 4px;border:0;background:none;box-shadow:none}
.rc-btn{width:100%;padding:10px;border:2px dashed #d8b9b0;border-radius:14px;background:#fff8f5;font:800 14px var(--body,system-ui);color:#b8403a;cursor:pointer}
.rc-ask{display:flex;flex-direction:column;gap:6px;padding:10px;border:2.5px solid #c9403a;border-radius:14px;background:#fff1ee}
.rc-ask b{font:800 15px var(--display,inherit);color:#b8403a}.rc-ask span{font-size:13px;color:var(--ink2,#7a6250)}
.rc-ask div{display:flex;gap:8px;flex-wrap:wrap}.rc-yes{background:#d0463f!important;color:#fff!important;border-color:#8a2a24!important}`;
  document.head.appendChild(st);
}

// ================= 61 · FENÊTRES PLUS HAUTES SUR TÉLÉPHONE (v43) =================
// Le joueur : « on perd de la place, le nom du lieu est déjà à la moitié de l'écran, il faudrait rehausser le tout,
// y compris les autres onglets (boutique…) ». Sur téléphone, toute fenêtre ouverte monte jusqu'en haut de l'écran ;
// la barre compagnons / pièces est cachée pendant ce temps, et les pièces s'affichent dans le titre de la fenêtre.
// Le titre et le haut du panneau de départ sont aussi resserrés.
{
  const st = document.createElement('style');
  st.textContent = `@media (max-width:900px){
body.sheet-open #sheet{top:calc(6px + env(safe-area-inset-top,0px));height:auto}
body.sheet-open .hud{display:none}
.sheethead{padding:6px 8px 6px 12px;gap:8px}
.sheethead svg{width:26px;height:26px}
#sheetTitle{font-size:19px}
#sheetClose{width:32px;height:32px}
#panelBody{padding-top:10px}
}
#sheetCoins{display:none}
@media (max-width:900px){#sheetCoins{display:inline-flex;align-items:center;gap:4px;padding:2px 9px 2px 4px;border:2px solid var(--ink,#4a3528);border-radius:999px;background:#fff8e6;font:800 15px var(--display,inherit);color:var(--ink,#4a3528);white-space:nowrap}
#sheetCoins .coin,#sheetCoins svg,#sheetCoins img{width:18px!important;height:18px!important}}
/* « Qui part ? » plus serré */
.trjwho{margin-bottom:4px!important}
.trjwho .trjwk{margin-bottom:4px}
.trjwho .trjwl{gap:10px!important;padding-bottom:2px}
.trjwb{width:56px}
.trjwb img,.trjwb .livep{width:46px!important;height:46px!important;max-width:46px}`;
  document.head.appendChild(st);
}
// pièces recopiées dans le titre de la fenêtre
{
  const head = document.querySelector('#sheet .sheethead'), close = document.getElementById('sheetClose'), src = document.getElementById('coins');
  if (head && close && src) {
    const c = document.createElement('span'); c.id = 'sheetCoins'; c.setAttribute('aria-label', 'Pièces');
    head.insertBefore(c, close);
    const sync = () => { c.innerHTML = src.innerHTML; c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); };
    sync();
    try { new MutationObserver(sync).observe(src, { childList: true, subtree: true, characterData: true }); } catch (e) {}
  }
}

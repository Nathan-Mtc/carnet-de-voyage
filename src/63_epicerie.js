// ================= 63 · ÉPICERIE DE BASE DU MAGASIN (v43) =================
// Le joueur : « le magasin, il n'y a pas grand-chose ; mais si on avait tout, ça impacterait le marché mondial ».
// Décisions (questions du 11/11) : un rayon PERMANENT de matières premières COMMUNES utiles à VOS commerces,
// un peu plus cher que leur valeur (+20 %), limité à 10 achats par jour ; des LOTS ×5 (un peu moins chers à l'unité)
// à partir du niveau 2 de la boutique. Jamais de rare ni de spécialité régionale : ça reste le rôle du marché mondial.
const EP_MAX = 10, EP_LOT = 5, EP_LOT_LVL = 2;
function epState() {
  const dk = dayKey();
  if (!S.ep || S.ep.day !== dk) S.ep = { day: dk, n: 0 };
  return S.ep;
}
// les ingrédients des recettes de vos commerces, les plus utilisés d'abord
function epKeys() {
  const cnt = {};
  let shops = [];
  try { shops = bqOwned(); } catch (e) {}
  shops.forEach(id => (CM_LINES[id] || []).forEach(R => (R.ing || []).forEach(([k, n]) => { if (k !== 'far' && ING[k]) cnt[k] = (cnt[k] || 0) + (n || 1); })));
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 8);
}
window.__ep = { keys: () => epKeys(), item: k => epItem(k), owned: () => bqOwned() };
function epItem(k) {
  let it = null;
  // l'article le plus « simple » de cette famille (le nom le plus court parmi les objets communs du jeu)
  try {
    const subs = ING[k][0], seen = new Set(); let best = null;
    Object.values(LOOT).forEach(l => l.forEach(d => { if ((d[1] === 'm' || d[1] === 'n') && d[3] === 0 && subs.includes(d[2]) && !seen.has(d[0])) { seen.add(d[0]); const lab = String(ING[k][1] || '').split(' ')[0].toLowerCase(), w = d[0].split(/[ ’']/).length - (lab && d[0].toLowerCase().includes(lab) ? 10 : 0); if (!best || w < best.w || (w === best.w && d[0].length < best.d[0].length)) best = { d, w }; } }));
    if (best) it = bqItemOf(best.d);
  } catch (e) {}
  if (!it) try { it = bqSampleIng(k); } catch (e) {}
  if (!it || !it.name || it.rarity > 0) return null;
  const v = Math.max(1, value(Object.assign({}, it, { id: '' })) || 1);
  return { k, it, one: Math.max(2, Math.ceil(v * 1.2)), lot: Math.max(8, Math.ceil(v * EP_LOT * 1.05)) };
}
function epHTML() {
  const E = epState(), left = EP_MAX - E.n;
  let lvl = 0; try { lvl = bqState().lvl || 0; } catch (e) {}
  const lots = lvl >= EP_LOT_LVL;
  const rows = epKeys().map(epItem).filter(Boolean).map(x => {
    let have = 0; try { have = cmHave(x.k); } catch (e) {}
    const ok1 = left > 0 && S.coins >= x.one, ok5 = left > 0 && S.coins >= x.lot;
    return `<div class="ep-r"><span class="ep-i">${itemIcon(x.it)}</span><span class="ep-t"><b>${esc(x.it.name)}</b><small>${esc(cmIngName(x.k))} · vous en avez <b>${have}</b></small></span>
      <span class="ep-b"><button class="btn ${ok1 ? 'gold' : 'cream'} sm" data-epbuy="${x.k}:1" ${ok1 ? '' : 'disabled'}>×1 · ${coins(x.one)}</button>${lots ? `<button class="btn ${ok5 ? 'green' : 'cream'} sm" data-epbuy="${x.k}:${EP_LOT}" ${ok5 ? '' : 'disabled'}>×${EP_LOT} · ${coins(x.lot)}</button>` : ''}</span></div>`;
  }).join('');
  if (!rows) return '';
  return `<section class="ep"><div class="ep-h"><b>🧺 Épicerie de base</b><span class="ep-n${left ? '' : ' no'}">${left}/${EP_MAX} achats aujourd’hui</span></div>
    <p class="ep-p">Les ingrédients courants de vos recettes, toujours en rayon. Un peu plus chers qu’au marché ; les produits rares et les spécialités, eux, se trouvent en voyage ou au marché mondial.${lots ? '' : ` <i>Bientôt : des lots ×${EP_LOT} moins chers, en montant le niveau de la boutique.</i>`}</p>${rows}</section>`;
}
function epBuy(k, n, el) {
  const E = epState(); if (E.n >= EP_MAX) { toast(`Plus d’achats à l’épicerie aujourd’hui (${EP_MAX} par jour). Revenez demain, ou passez par le marché mondial.`); return; }
  const x = epItem(k); if (!x) return;
  const price = n > 1 ? x.lot : x.one;
  if (S.coins < price) { toast('Pas assez de pièces. Vendez vos produits au Comptoir !'); return; }
  S.coins -= price; E.n++;
  for (let i = 0; i < n; i++) {
    const it = makeItem([x.it.name, x.it.cat, x.it.sub, 0, x.it.look || null, x.it.color], 0, 'Épicerie du magasin', [], { fixed: 0 });
    it.paid = Math.round(price / n);
    S.inv.push(it); S.dex[it.name] = true;
  }
  S.stats.shopBought = (S.stats.shopBought || 0) + 1;
  save();
  try { bqFly(el, x.it); } catch (e) {}
  const b = $('panelBody'), y = b ? b.scrollTop : 0;
  renderTop(); renderPanel(); if (b) b.scrollTop = y;
  toast(`Acheté : ${n > 1 ? n + ' × ' : ''}« ${x.it.name} ». Dans le sac !`);
}
if (typeof renderMagasin === 'function') renderMagasin = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const h = epHTML();
    if (h) { const at = box.querySelector('.bq-pass') || box.querySelector('.bq-tmw'); if (at) at.insertAdjacentHTML('afterend', h); else box.insertAdjacentHTML('beforeend', h); }
  } catch (e) { console.error('épicerie', e); }
  return r;
})(renderMagasin);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-epbuy]'); if (!b || b.disabled) return;
  ev.stopPropagation();
  const [k, n] = b.dataset.epbuy.split(':'); epBuy(k, +n || 1, b);
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.ep{display:flex;flex-direction:column;gap:6px;padding:10px;border:2.5px solid var(--ink,#4a3528);border-radius:18px;background:#fffaf0;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.ep-h{display:flex;align-items:center;justify-content:space-between;gap:8px}.ep-h>b{font:800 16px var(--display,inherit);color:var(--ink,#4a3528)}
.ep-n{font:800 12px var(--body,system-ui);padding:2px 8px;border-radius:999px;background:#e3f3d8;color:#2f7f4c}.ep-n.no{background:#fde4df;color:#b8403a}
.ep-p{margin:0;font-size:12.5px;line-height:1.35;color:var(--ink2,#7a6250)}.ep-p i{color:#9a8470}
.ep-r{display:flex;align-items:center;gap:8px;padding:5px 6px;border:1.6px solid var(--line,#e2d3bd);border-radius:12px;background:#fff}
.ep-i{width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center}.ep-i svg,.ep-i img{width:34px;height:34px}
.ep-t{flex:1;min-width:0;display:flex;flex-direction:column}.ep-t>b{font:800 13.5px var(--display,inherit);color:var(--ink,#4a3528);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ep-t small{font-size:11.5px;color:var(--ink2,#7a6250)}
.ep-b{display:flex;flex-direction:column;gap:4px;flex:none}.ep-b .btn{white-space:nowrap;padding:4px 8px;font-size:12.5px}`;
  document.head.appendChild(st);
}

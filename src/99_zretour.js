// ================= 99 · LA FENÊTRE DE RETOUR, SIMPLIFIÉE (v104, 19/11) =================
// Audit : objets, pièces, expérience, cartes postales, progrès, « à savoir », rencontres, troc… tout s'affichait d'un coup ;
// le joueur ne lisait plus rien. Maintenant :
//  1. en haut, le compagnon et le nombre d'objets (et les pièces s'il y en a) ;
//  2. « ✓ Ce que ça permet » : les clients qu'on peut livrer grâce à ce voyage, la brume levée dans la région ;
//  3. les objets ;
//  4. tout le reste est rangé dans « Plus de nouvelles », replié.
const zh$ = (f, d) => { try { return f(); } catch (e) { return d; } };
let zhBefore = null, zhLastPermet = '', zhBusy = false;
function zhSnap() {
  const ready = new Set(zh$(() => bqState().orders.filter(o => bqReady(o)).map(o => o.id), []));
  const pct = {}; zh$(() => sctOpenIds().forEach(id => { pct[id] = sctInfo(id).pct; }));
  const fog = []; zh$(() => Object.values(S.trips || {}).forEach(t => { if (t && t.done && t.dest) { const K = sctNear(t.dest); if (K && !K.near) fog.push(K.R.short); } }));
  return { ready, pct, fog };
}
if (typeof collect === 'function') collect = (orig => function () { zhBefore = zh$(zhSnap, null); return orig.apply(this, arguments); })(collect);
function zhPermet(h) {
  const L = [], B = zhBefore || { ready: new Set(), pct: {} };
  zh$(() => bqState().orders.forEach(o => {
    if (B.ready.has(o.id) || !zh$(() => bqReady(o), false)) return;
    const c = BQC(o.client), r = o.req[0];
    L.push(`<li class="ok">✓ De quoi livrer <b>${esc(c.name)}</b>${r ? ` (${esc(r.name || '')})` : ''}</li>`);
  }));
  (B.fog || []).forEach(nm => L.push(`<li>🌫️ Un nouveau coin de <b>${esc(nm)}</b> sort de la brume</li>`));
  if (!L.length) L.push(`<li class="nil">Rien à livrer pour l’instant : ces objets serviront à vos prochains clients, à la cuisine ou à l’atelier.</li>`);
  return `<div class="zh-ok"><p class="zh-k">Ce que ça permet</p><ul>${L.join('')}</ul></div>`;
}
function zhRework(h) {
  const box = zh$(() => document.querySelector('#modal:not([hidden]) .mbox'), null); if (!box || !box.querySelector(':scope > .haul')) return;
  let more = box.querySelector(':scope > details.zh-more');
  if (!box.querySelector(':scope > .zh-ok') || !more) {
    if (more) more.remove();
    zhLastPermet = zhLastPermet || zhPermet(h);
    // en-tête : seulement les objets (et les nouveautés)
    box.querySelectorAll('.hhead .hstats > span').forEach(sp => { if (/exp\.|carte postale|cartes postales/.test(sp.textContent)) sp.remove(); });
    box.querySelector(':scope > .hhead').insertAdjacentHTML('afterend', zhLastPermet);
    box.querySelector(':scope > .haul').insertAdjacentHTML('afterend', '<details class="zh-more"><summary>Plus de nouvelles</summary><div class="zh-in"></div></details>');
    more = box.querySelector(':scope > details.zh-more');
  }
  const inn = more.querySelector('.zh-in');
  // tout ce qui n'est ni l'en-tête, ni « ce que ça permet », ni les objets, ni le bouton : dans « Plus de nouvelles »
  [...box.children].forEach(el => { if (el === more || el.parentNode !== box || el.matches('.hhead,.zh-ok,.haul,.jr-bar') || el.querySelector('[data-closemodal]') || el.matches('[data-closemodal]')) return; inn.appendChild(el); });
  [...box.querySelector(':scope > .haul').children].forEach(el => { if (!el.classList.contains('hcard')) inn.appendChild(el); });
  const n = inn.children.length, sm = more.querySelector('summary'), tx = `Plus de nouvelles (${n})`;
  if (more.hidden !== !n) more.hidden = !n; if (sm.textContent !== tx) sm.textContent = tx;
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  zhLastPermet = '';
  const r = orig.apply(this, arguments);
  zhLastPermet = zh$(() => zhPermet(h), '');
  zh$(() => zhRework(h));
  return r;
})(showHaul);
// d'autres modules redessinent la fenêtre après coup : on réapplique la mise en ordre à chaque changement
zh$(() => new MutationObserver(() => { if (zhBusy || !zhLastPermet) return; zhBusy = true; zh$(() => zhRework({})); zhBusy = false; }).observe(document.getElementById('modal'), { childList: true, subtree: true }));
document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('#modal [data-closemodal]')) zhLastPermet = ''; }, true);
{
  const css = document.createElement('style');
  css.textContent = `
.zh-ok{margin:8px 0 10px;padding:9px 12px;border-radius:14px;background:#eaf6e6;border:2px solid #9fd08e}
.zh-k{margin:0 0 4px;font:800 12px var(--display,system-ui);letter-spacing:.05em;text-transform:uppercase;color:#3d6b2a}
.zh-ok ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
.zh-ok li{font:600 14px/1.35 var(--body,system-ui);color:#2f4a24}.zh-ok li.nil{color:#6b7a5f;font-size:13px}
.zh-more{margin:6px 0 8px;border-radius:12px;background:#f6f0e4;padding:6px 10px}
.zh-more summary{cursor:pointer;font:800 13px var(--display,system-ui);color:#7a6a5c}
.zh-in{margin-top:8px;display:flex;flex-direction:column;gap:8px}
`;
  document.head.appendChild(css);
}

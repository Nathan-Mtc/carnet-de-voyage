// ================= DÉFIS : SAVOIR D'UN COUP D'ŒIL SI ON A LES PRÉREQUIS (v185) =================
// Le joueur : « les prérequis ne sont pas instinctifs : on ne sait pas si on les possède ».
// Dans la fiche d'un défi :
//  - chaque cadenas a, à droite, une pastille claire : ✓ (vert) ou ce qu'on a sur ce qu'il faut (« 1/3 », « niv. 4/15 », ✗) ;
//  - une ligne « Vous avez : … » dit ce qu'on possède réellement (la version de base au lieu de la pro, un familier forêt…) ;
//  - en haut, les familiers disponibles avec leur score (« Mochi 3/4 ») : un toucher et la fiche se recalcule pour lui.
const d3$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('défis3', e); return d; } };
const D3_SEAS = { hiver: 'l’hiver', 'été': 'l’été', automne: 'l’automne', printemps: 'le printemps' };
function d3Have(L, k, open) {
  switch (L.t) {
    case 'g': {
      const best = d3$(() => S.inv.filter(it => { const G = xpGearOf(it); return G && G.g === L.g; }).sort((a, b) => xpGearOf(b).tier - xpGearOf(a).tier)[0], null);
      const T = ['', 'de base', 'pro', 'légendaire'];
      if (open) return { pill: '✓', txt: '' };
      if (!best) return { pill: '✗', txt: 'Vous n’en avez pas encore.' };
      const bt = xpGearOf(best).tier, worn = d3$(() => usWorn(best), false);
      if (bt >= L.tier && worn) return { pill: '✗', txt: `Vous l’avez, mais il est usé : réparez-le.` };
      if (bt >= L.tier) return { pill: '✗', txt: `Le vôtre est porté par un autre familier.` };
      return { pill: `${T[bt]}`, txt: `Vous avez la version ${T[bt]} : il faut la version ${T[L.tier]}.` };
    }
    case 'c': {
      const ter = d3$(() => faCompTer(k).ter, []), lv = d3$(() => S.prog[k].lvl, 1), ok = ter.includes(L.ter);
      const nm = d3$(() => faNm(k), ''), tn = t => d3$(() => FA_TER[t][1].toLowerCase(), t);
      if (open) return { pill: '✓', txt: '' };
      if (!ok) return { pill: '✗', txt: `${nm} est un familier ${ter.length ? ter.map(tn).join(' / ') : 'sans terrain'}, pas ${tn(L.ter)}.` };
      return { pill: `${lv}/${L.lvl}`, txt: `${nm} est niveau ${lv} sur ${L.lvl}.` };
    }
    case 'l': { const lv = d3$(() => S.prog[k].lvl, 1); return open ? { pill: '✓', txt: '' } : { pill: `${lv}/${L.lvl}`, txt: `${d3$(() => faNm(k), '')} est niveau ${lv} sur ${L.lvl}.` }; }
    case 'm': {
      if (open) return { pill: '✓', txt: '' };
      if (L.m === 'nuit') return { pill: '✗', txt: `Il est ${new Date().getHours()} h : la nuit commence à 21 h.` };
      return { pill: '✗', txt: `Nous sommes en ${d3$(() => season(), '')} : revenez à ${D3_SEAS[L.m] || L.m}.` };
    }
    case 'i': { const n = d3$(() => ldMatN(LD_FAM[L.fam].mats[L.tier]), 0); return { pill: open ? '✓' : `${Math.min(n, L.n)}/${L.n}`, txt: '' }; }
  }
  return { pill: open ? '✓' : '✗', txt: '' };
}
// les familiers qu'on peut envoyer (pas en voyage)
const d3Comps = () => d3$(() => Object.keys(S.comps || {}).filter(k => !(S.trips && S.trips[k])), []);

ldFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  d3$(() => {
    const D = LD_CACHE[id], box = $('modal') && $('modal').querySelector('.ld-f'); if (!D || !box) return;
    const k = S.sel, st = ldState(D, k), lis = box.querySelectorAll('.ld-l > li');
    D.locks.forEach((L, i) => {
      const li = lis[i]; if (!li) return;
      const H = d3Have(L, k, st.o[i]), sp = li.querySelector('span');
      li.insertAdjacentHTML('beforeend', `<em class="d3-p${st.o[i] ? ' ok' : ''}">${esc(H.pill)}</em>`);
      if (sp && H.txt) { const sm = sp.querySelector('b'); (sm || sp).insertAdjacentHTML('afterend', `<small class="d3-h">${esc(H.txt)}</small>`); }
    });
    // le choix du familier, avec le score de chacun
    const C = d3Comps();
    if (C.length > 1) {
      const chips = C.map(c => { const s = ldState(D, c); return { c, n: s.n, all: s.all }; }).sort((a, b) => b.n - a.n)
        .map(x => `<button class="d3-c${x.c === k ? ' on' : ''}${x.all ? ' all' : ''}" data-d3c="${x.c}" data-d3ld="${id}"><b>${esc(d3$(() => faNm(x.c), x.c))}</b><small>${x.all ? '✓ prêt' : `${x.n}/${D.locks.length}`}</small></button>`).join('');
      const kk = box.querySelector('.ld-k'); if (kk) kk.insertAdjacentHTML('afterend', `<div class="d3-cs" role="group" aria-label="Avec quel familier ?">${chips}</div>`);
    }
  });
  return r;
})(ldFiche);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-d3c]'); if (!b) return;
  ev.stopPropagation();
  d3$(() => { if (typeof selectComp === 'function') selectComp(b.dataset.d3c); else S.sel = b.dataset.d3c; });
  d3$(() => renderTop()); d3$(() => renderComps());
  ldFiche(b.dataset.d3ld); d3$(() => ldRefresh());
}, true);

d3$(() => {
  const st = document.createElement('style');
  st.textContent = `.ld-l li>span{flex:1;min-width:0}
.d3-p{flex:none;margin-left:auto;align-self:flex-start;min-width:44px;padding:3px 7px;border-radius:999px;background:#fde3e0;color:#a3403a;font:800 12.5px/1.2 var(--body,system-ui);font-style:normal;text-align:center}
.d3-p.ok{background:#3f7f3a;color:#fff}
.ld-l small.d3-h{color:#a3403a;font-weight:700}
.d3-cs{display:flex;gap:6px;overflow-x:auto;margin:0 0 8px;padding-bottom:2px;scrollbar-width:none}.d3-cs::-webkit-scrollbar{display:none}
.d3-c{flex:none;display:flex;flex-direction:column;align-items:center;gap:0;min-height:44px;padding:5px 11px;border-radius:12px;border:2px solid #eadcc4;background:#fffaf0;color:#4a3528;font-family:inherit}
.d3-c b{font-size:13px}.d3-c small{font-size:11.5px;color:#7a6250;font-weight:700}
.d3-c.on{border-color:#4a3528;background:#fff3c4}.d3-c.all small{color:#3f7f3a}`;
  document.head.appendChild(st);
});

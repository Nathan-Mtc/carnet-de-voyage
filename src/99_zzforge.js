// ================= FORGE ET ATELIER : « IL MANQUE », COMME À LA BOUTIQUE (v180) =================
// Le joueur : « dans la forge, quand on n'a pas les matériaux, montrer les matériaux manquants, du même principe que dans la boutique ».
// Le bouton « Fabriquer » d'une recette incomplète n'est plus mort : un toucher ouvre, juste sous la recette, l'encadré de la
// boutique (47_usages.js : usMissAtHTML) : chaque matériau manquant, combien on en a, où le trouver au plus près (« Y aller »)
// et, s'il se vend, « Acheter ». Un deuxième toucher (ou la croix) le referme.
const zf$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('forge', e); return d; } };
let zfOpen = null; // recette dont l'encadré est ouvert

// où trouver les matériaux de défi (l'encadré de la boutique ne les connaît pas)
function zfWhere(key) {
  const m = /^ldm_(\w+)_(\d)$/.exec(key || '');
  if (m) return zf$(() => `Se rapporte des lieux à défi ${'★'.repeat(+m[2] + 1)} « ${LD_FAM[m[1]].nm.toLowerCase()} » (touchez « Défis » sur la carte).`, '');
  if (key === 'gemme') return 'Une pierre précieuse trouvée en voyage, à tailler ici à l’atelier.';
  if (/^xg[pb]_/.test(key || '')) return 'À fabriquer d’abord, dans cette même liste.';
  return '';
}
function zfMissHTML(r) {
  let h = zf$(() => usMissAtHTML(r), '');
  if (!h) { // il ne manque que des pièces
    if (r.coins && S.coins < r.coins) h = `<div class="cf-miss" id="cfMiss"><div class="cf-mh"><b>Il manque pour « ${esc(r.out[0])} »</b><button class="cf-x" data-cfx="1" aria-label="Fermer">✕</button></div><p class="cf-lt">${r.coins - S.coins} pièces : vendez des objets ou servez des clients à la boutique.</p></div>`;
    return h;
  }
  // préciser l'origine des matériaux spéciaux
  const box = document.createElement('div'); box.innerHTML = h;
  const miss = r.ing.filter(([k, n]) => zf$(() => ingCount(k), 0) < n);
  box.querySelectorAll('.cf-mi').forEach((el, i) => { const w = miss[i] && zfWhere(miss[i][0]); if (!w) return; el.querySelectorAll('.cf-lt').forEach(x => { if (!x.closest('.cf-locs')) x.remove(); }); el.insertAdjacentHTML('beforeend', `<p class="cf-lt">${esc(w)}</p>`); });
  if (r.coins && S.coins < r.coins) box.firstElementChild.insertAdjacentHTML('beforeend', `<p class="cf-lt">Et ${r.coins - S.coins} pièces de plus.</p>`);
  return box.innerHTML;
}
function zfShow(btn, rid) {
  const old = document.getElementById('cfMiss'); if (old) old.remove();
  document.querySelectorAll('#panelBody .zf-sel').forEach(e => e.classList.remove('zf-sel'));
  if (zfOpen === rid) { zfOpen = null; return; }
  const r = RECIPES.find(x => x.id === rid), card = btn.closest('.atl-r, .rec'); if (!r || !card) return;
  const h = zfMissHTML(r); if (!h) { zfOpen = null; return; }
  zfOpen = rid; card.classList.add('zf-sel'); card.insertAdjacentHTML('afterend', h);
  const box = document.getElementById('cfMiss'); if (box) { box.classList.add('zf-box'); zf$(() => box.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); }
}

// la Forge (et les autres ateliers du Foyer) : le bouton « Fabriquer » d'une recette incomplète devient touchable
hmStationHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  return typeof h === 'string' ? h.replace(/data-ststart="([^"]+)" disabled>Fabriquer</g, 'data-zfmiss="$1" aria-disabled="true">Fabriquer<') : h;
})(hmStationHTML);
// l'atelier classique (onglets Vêtements, Décoration, Équipement…)
renderAtelier = (orig => function (box) {
  const res = orig.apply(this, arguments);
  zf$(() => {
    if (!box) return;
    box.querySelectorAll('.rec [data-craft][disabled]').forEach(b => { b.removeAttribute('disabled'); b.setAttribute('aria-disabled', 'true'); b.classList.add('zf-off'); b.dataset.zfmiss = b.dataset.craft; b.removeAttribute('data-craft'); });
  });
  return res;
})(renderAtelier);
// rouvrir l'encadré après un nouveau rendu (achat, retour sur l'écran…)
const zfReopen = () => zf$(() => { if (!zfOpen) return; const b = document.querySelector(`#panelBody [data-zfmiss="${CSS.escape(zfOpen)}"]`); const id = zfOpen; zfOpen = null; if (b) zfShow(b, id); });
renderPanel = (orig => function () { const r = orig.apply(this, arguments); zfReopen(); return r; })(renderPanel);

document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const b = t.closest('[data-zfmiss]');
  if (b && b.closest('#panelBody')) { ev.stopPropagation(); ev.preventDefault(); zfShow(b, b.dataset.zfmiss); return; }
  const x = t.closest('.zf-box [data-cfx]');
  if (x) { ev.stopPropagation(); zfOpen = null; x.closest('.cf-miss').remove(); document.querySelectorAll('#panelBody .zf-sel').forEach(e => e.classList.remove('zf-sel')); return; }
  if (t.closest('.zf-box [data-cfbuy]')) setTimeout(() => zf$(() => { const p = $('panelBody'), top = p ? p.scrollTop : 0; renderPanel(); const p2 = $('panelBody'); if (p2) p2.scrollTop = top; }), 80);
  if (t.closest('.zf-box [data-cfgo]')) zfOpen = null;
}, true);

zf$(() => {
  const st = document.createElement('style');
  st.textContent = `.atl-g>.cf-miss{grid-column:1/-1;margin:2px 0 4px}
.recipes>.cf-miss{margin:2px 0 8px}
.zf-sel{outline:3px solid #e8b13a;outline-offset:1px}
.zf-off{opacity:.6}`;
  document.head.appendChild(st);
});

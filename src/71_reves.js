// ================= 71 · RÊVES : UN SEUL RÊVE À LA FOIS, ET PLUS EXIGEANTS (v45) =================
// Le joueur : « dans Rêves on a beaucoup trop de choses, même principe ici ; et il faudrait des rêves plus durs ».
// • Écran : seulement le rêve du compagnon choisi en haut (les 3 cartes l'une sous l'autre, c'était trop) ; les rêves
//   réalisés se replient ; les « Quêtes du jour et succès » et le « Grand Carnet » quittent cet écran (quêtes : bouton
//   Quêtes de la carte ; succès : carnet › Cadeaux ; Grand Carnet : carnet › Collections).
// • Plus durs : 2 fois plus de lieux à visiter et d'objets à rapporter (étapes « 2 … » → « 4 … »), voyages lointains 1,5 fois plus longs.
(function () {
  try {
    DREAMS.forEach(d => (d.steps || []).forEach(st => {
      if (st.rvH) return; st.rvH = 1;
      if ((st.t === 'visit' || st.t === 'item') && st.n >= 2) { // (« un/une » : on garde 1, le texte resterait faux)
        const o = st.n, n = o * 2; st.n = n;
        if (st.txt) st.txt = st.txt.replace(new RegExp('\\b' + o + '\\b'), String(n));
      }
      if (st.t === 'km' && st.km) { const o = st.km, n = Math.round(o * 1.5 / 10) * 10; st.km = n; if (st.txt) st.txt = st.txt.replace(String(o).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), String(n)).replace(String(o), String(n)); }
    }));
  } catch (e) { console.error('rêves plus durs', e); }
})();
if (typeof renderReves === 'function') renderReves = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    // un seul rêve : celui du compagnon choisi (le premier de la liste)
    const cs = box.querySelector('.rvcomps'); if (cs) [...cs.children].slice(1).forEach(e => e.remove());
    // quêtes/succès et Grand Carnet : ailleurs
    box.querySelectorAll('h3.rvh').forEach(h => {
      const t = h.textContent.trim(), nx = h.nextElementSibling;
      if (/^Quêtes du jour|^Le Grand Carnet/.test(t)) { if (nx && (nx.id === 'rvQuests' || nx.id === 'rvCarnet')) nx.remove(); h.remove(); }
      else if (/^Rêves réalisés/.test(t)) {
        const d = document.createElement('details'); d.className = 'rv-done';
        const n = nx && nx.classList.contains('rvmem') ? nx.children.length : 0;
        d.innerHTML = `<summary>🌟 Rêves réalisés <small>${n}</small></summary>`;
        if (nx) d.appendChild(nx);
        h.replaceWith(d);
      }
    });
    const hd = box.querySelector('.rvhead p'); if (hd) hd.textContent = 'Réalisez le rêve de chaque compagnon pour gagner une récompense unique.';
  } catch (e) { console.error('rêves', e); }
  return r;
})(renderReves);
// les succès s'ouvraient dans Rêves : on les envoie vers le carnet › Cadeaux
if (typeof openAchievements === 'function') openAchievements = function () { try { cnView = 'reglages'; } catch (e) {} openSheet('menu'); };
// le Grand Carnet rejoint carnet › Collections
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try { if (typeof cnView !== 'undefined' && cnView === 'col' && typeof carnetHTML === 'function') { const c = box.querySelector('.cn'); if (c) c.insertAdjacentHTML('beforeend', `<details class="cn-f rv-gc" style="--fc:#c9a35a"><summary><span class="cn-fi">📜</span><b>Le Grand Carnet</b></summary><div>${carnetHTML()}</div></details>`); } } catch (e) {}
  return r;
})(renderMenu);
{
  const st = document.createElement('style');
  st.textContent = `.rv-done{margin:10px 0;padding:4px 10px;border:2px solid var(--line,#e7dccb);border-radius:14px;background:#fff}
.rv-done summary{cursor:pointer;padding:6px 0;font:800 14px var(--display,inherit);color:var(--ink,#4a3528);list-style:none}.rv-done summary small{margin-left:4px;color:#9a8470}
.rv-done summary::-webkit-details-marker{display:none}.rv-gc>div{padding-bottom:8px}`;
  document.head.appendChild(st);
}

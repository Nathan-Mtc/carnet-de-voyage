// ================= 70 · NOURRIR FAIT GRANDIR (v45) =================
// Le joueur : « nourrir ne sert quasi à rien à part rusher le niveau 10 » → choix (12/11) : « il grandit à vue d'œil ».
// Chaque repas compte : bébé → jeune → adulte. La taille se voit dans le miroir de la garde-robe, la fiche Talents et au
// foyer. Les portraits ronds (têtes) ne changent pas. Les compagnons existants démarrent selon leur niveau (pas de
// rapetissement surprise). S.grow[k] = nombre de repas.
const GW_ST = [[0, 'Bébé', 0.8], [6, 'Jeune', 0.9], [18, 'Adulte', 1]];
function gwN(k) {
  if (!S.grow || typeof S.grow !== 'object') S.grow = {};
  if (S.grow[k] == null) { const lv = (S.prog && S.prog[k] && S.prog[k].lvl) || 1; S.grow[k] = lv >= 8 ? 18 : lv >= 4 ? 6 : 0; }
  return S.grow[k];
}
function gwStage(k) { const n = gwN(k); let i = 0; GW_ST.forEach((s, j) => { if (n >= s[0]) i = j; }); return i; }
const gwScale = k => GW_ST[gwStage(k)][2];
// un repas : +1 croissance ; changement de stade = petite fête
if (typeof pgFeed === 'function') pgFeed = (orig => function (k, id) {
  const before = gwStage(k);
  const r = orig.apply(this, arguments);
  try {
    if (r) {
      S.grow[k] = gwN(k) + 1; save();
      const after = gwStage(k);
      if (after > before) setTimeout(() => { try { pgCele(`${CHARS[k].name} a grandi ! Le voilà ${GW_ST[after][1].toLowerCase()}.`); } catch (e) { toast(`${CHARS[k].name} a grandi !`); } }, 400);
    }
  } catch (e) { console.error('croissance', e); }
  return r;
})(pgFeed);
// le panneau Nourrir : où en est sa croissance
if (typeof pgFeedHTML === 'function') pgFeedHTML = (orig => function (k) {
  let h = orig.apply(this, arguments);
  try {
    const i = gwStage(k), n = gwN(k), nx = GW_ST[i + 1];
    const bar = nx ? Math.min(1, (n - GW_ST[i][0]) / (nx[0] - GW_ST[i][0])) : 1;
    const line = `<div class="gw"><span class="gw-st">🌱 ${GW_ST[i][1]}</span><span class="gw-bar"><i style="width:${Math.round(bar * 100)}%"></i></span><small>${nx ? `encore ${nx[0] - n} repas pour devenir ${nx[1].toLowerCase()}` : 'il a fini de grandir'}</small></div>`;
    h = h.replace('</div>', '</div>' + line); // juste sous l'en-tête « Nourrir »
  } catch (e) {}
  return h;
})(pgFeedHTML);
// la taille, visible : miroir, fiche Talents, foyer
if (typeof renderCompagnons === 'function') renderCompagnons = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    box.querySelectorAll('[data-wrchar]').forEach(e => e.style.setProperty('--gs', gwScale(e.dataset.wrchar)));
    const hd = box.querySelector('.cpthd .cptch'); if (hd) hd.style.setProperty('--gs', gwScale(S.sel));
  } catch (e) {}
  return r;
})(renderCompagnons);
if (typeof fyCompHTML === 'function') fyCompHTML = (orig => function (k) {
  const h = orig.apply(this, arguments);
  try { return h.replace(/--w:([\d.]+)%/, (m, w) => `--w:${(+w * gwScale(k)).toFixed(1)}%`); } catch (e) { return h; }
})(fyCompHTML);
{
  const st = document.createElement('style');
  st.textContent = `.wrchar>svg,.cpthd .cptch>svg{transform:scale(var(--gs,1));transform-origin:50% 92%;transition:transform .5s}
.gw{display:flex;align-items:center;gap:8px;margin:4px 0 6px}.gw-st{flex:none;font:800 12.5px var(--body,system-ui);color:#2f7f4c}
.gw-bar{flex:1;height:8px;border-radius:999px;background:#eef5e9;overflow:hidden;border:1.5px solid #cfe3c4}.gw-bar i{display:block;height:100%;background:linear-gradient(90deg,#9fd08a,#5fb36b)}
.gw small{flex:none;font-size:11.5px;color:var(--ink2,#7a6250)}`;
  document.head.appendChild(st);
}

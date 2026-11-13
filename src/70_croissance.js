// ================= 70 · GRANDIR : BÉBÉ, JEUNE, ADULTE (v45-v46) =================
// Le joueur : « nourrir ne sert quasi à rien à part rusher le niveau 10 » → la croissance se VOIT (taille + animation).
// v46 : le joueur veut que la croissance suive le NIVEAU (bébé niv. 1-4, jeune 5-9, adulte 10+), avec une animation
// propre à chaque stade ; nourrir donne de l'expérience, donc fait grandir plus vite.
const GW_ST = [[1, 'Bébé', 0.8], [5, 'Jeune', 0.9], [10, 'Adulte', 1]];
const GW_ANIM = ['gw-bebe', 'gw-jeune', 'gw-adulte'];
function gwStage(k) { const L = (S.prog && S.prog[k] && S.prog[k].lvl) || 1; return L >= 10 ? 2 : L >= 5 ? 1 : 0; }
const gwScale = k => GW_ST[gwStage(k)][2];
// passage de stade = petite fête (au moment où il prend le niveau)
if (typeof addXP === 'function') addXP = (orig => function (k) {
  const before = S.prog && S.prog[k] ? gwStage(k) : 0;
  const r = orig.apply(this, arguments);
  try { const after = gwStage(k); if (after > before) setTimeout(() => { try { pgCele(`${CHARS[k].name} a grandi ! ${['', 'Le voilà jeune.', 'Le voilà adulte.'][after]}`); } catch (e) { toast(`${CHARS[k].name} a grandi !`); } }, 600); } catch (e) {}
  return r;
})(addXP);
// le panneau Nourrir : où en est sa croissance
if (typeof pgFeedHTML === 'function') pgFeedHTML = (orig => function (k) {
  let h = orig.apply(this, arguments);
  try {
    const i = gwStage(k), L = S.prog[k].lvl, nx = GW_ST[i + 1];
    const bar = nx ? Math.min(1, (L - GW_ST[i][0]) / (nx[0] - GW_ST[i][0])) : 1;
    const line = `<div class="gw"><span class="gw-st">🌱 ${GW_ST[i][1]}</span><span class="gw-bar"><i style="width:${Math.round(bar * 100)}%"></i></span><small>${nx ? `devient ${nx[1].toLowerCase()} au niveau ${nx[0]}` : 'il a fini de grandir'}</small></div>`;
    h = h.replace('</div>', '</div>' + line);
  } catch (e) {}
  return h;
})(pgFeedHTML);
// la taille, visible : miroir, fiche Talents, foyer
if (typeof renderCompagnons === 'function') renderCompagnons = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    box.querySelectorAll('[data-wrchar]').forEach(e => { e.style.setProperty('--gs', gwScale(e.dataset.wrchar)); e.classList.add(GW_ANIM[gwStage(e.dataset.wrchar)]); });
    const hd = box.querySelector('.cpthd .cptch'); if (hd) { hd.style.setProperty('--gs', gwScale(S.sel)); hd.classList.add(GW_ANIM[gwStage(S.sel)]); }
    const rt = box.querySelector('.tl-root'); if (rt) rt.classList.add(GW_ANIM[gwStage(S.sel)]);
  } catch (e) {}
  return r;
})(renderCompagnons);
if (typeof fyCompHTML === 'function') fyCompHTML = (orig => function (k) {
  const h = orig.apply(this, arguments);
  try { return h.replace(/--w:([\d.]+)%/, (m, w) => `--w:${(+w * gwScale(k)).toFixed(1)}%`); } catch (e) { return h; }
})(fyCompHTML);
{
  const st = document.createElement('style');
  st.textContent = `.wrchar>svg,.cpthd .cptch>svg{scale:var(--gs,1);transform-origin:50% 92%;transition:scale .5s}
.gw-bebe>svg{animation:gwWaddle 1.1s ease-in-out infinite;transform-origin:50% 95%}
.gw-jeune>svg{animation:gwHop 1.4s ease-in-out infinite}
.gw-adulte>svg{animation:gwProud 3.2s ease-in-out infinite;transform-origin:50% 95%}
@keyframes gwWaddle{0%,100%{rotate:-4deg}50%{rotate:4deg}}
@keyframes gwHop{0%,60%,100%{translate:0 0}30%{translate:0 -6%}}
@keyframes gwProud{0%,100%{scale:var(--gs,1)}50%{scale:calc(var(--gs,1) * 1.03)}}
@media (prefers-reduced-motion:reduce){.gw-bebe>svg,.gw-jeune>svg,.gw-adulte>svg{animation:none}}
.gw{display:flex;align-items:center;gap:8px;margin:4px 0 6px}.gw-st{flex:none;font:800 12.5px var(--body,system-ui);color:#2f7f4c}
.gw-bar{flex:1;height:8px;border-radius:999px;background:#eef5e9;overflow:hidden;border:1.5px solid #cfe3c4}.gw-bar i{display:block;height:100%;background:linear-gradient(90deg,#9fd08a,#5fb36b)}
.gw small{flex:none;font-size:11.5px;color:var(--ink2,#7a6250)}`;
  document.head.appendChild(st);
}

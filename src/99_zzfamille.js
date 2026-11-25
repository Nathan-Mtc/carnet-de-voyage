// ================= LES FAMILIERS SUR LA CARTE : LE BUT DU JEU SE VOIT (v199) =================
// Le joueur : « on ne comprend pas le but du jeu : l'exploration et la découverte de nouveaux familiers ; ce n'est pas intuitif ».
// 1) Sur la carte, chaque espèce sauvage de votre région pas encore adoptée a sa pastille, posée sur un VRAI lieu proche où elle
//    vit (son terrain, sa zone : faLives) : silhouette noire si jamais vue, portrait si déjà aperçue (traces, rencontre).
// 2) Toucher la pastille : qui c'est (ou « ? ? ? »), l'indice, les conditions (nuit, saison, appât) et « Y aller ».
// 3) Un bouton 🐾 « 3/12 » dans la colonne de droite : les familiers de votre région, trouvés sur le total.
// v200 (le joueur : « ce serait mieux un radar : on touche l'icône, un filtre rayon X passe sur la carte et on voit des formes bouger ») :
//    les pastilles ne s'affichent plus en permanence. Le bouton devient un RADAR : un balayage passe sur la carte, les formes
//    des familiers apparaissent et bougent ; on les touche pour savoir où les trouver. Retoucher le bouton éteint le radar.
const zf2$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('familiers carte', e); return d; } };
const ZF_TERCATS = { mer: ['plage', 'port', 'phare'], riviere: ['riviere', 'etang'], marais: ['etang'], foret: ['foret', 'parc', 'sentier'], montagne: ['sentier', 'belvedere', 'camping'], campagne: ['ferme', 'jardin', 'camping', 'verger'], ville: ['parc', 'rue', 'cafe'], neige: ['sentier', 'belvedere'] };
const zfHome = () => zf2$(() => rgHome().id, null);
const zfSps = rid => zf2$(() => FA_SP.filter(f => f.reg && f.reg[rid]).sort((a, b) => a.tier - b.tier || b.reg[rid] - a.reg[rid]), []);
const zfSt = sp => zf2$(() => faStage(sp), 0);
// le chemin vers une espèce : sa zone si elle n'habite qu'une zone de la région, sinon le lieu le plus proche de son terrain où elle vit
const zfLocC = new Map();
function zfLoc(f, rid) {
  const key = f.id + '|' + rid + '|' + S.home, c = zfLocC.get(key); if (c && Date.now() - c.t < 120e3) return c.v;
  let v = null;
  zf2$(() => {
    const zf = f.zf && f.zf[rid];
    for (const ter of f.ter) for (const cat of ZF_TERCATS[ter] || []) {
      if (v) break; const step = { t: 'visit', cat: [cat] }, L = qtLoc(step);
      if (L && faLives(f, Object.assign({ cat, tags: [] }, L.poi || {}, { lon: L.lon, lat: L.lat }))) v = { step, lon: L.lon, lat: L.lat, label: L.label, cat };
    }
    if (!v && zf && zf[0] && RG_ZONES[zf[0]]) { const Z = RG_ZONES[zf[0]], [lon, lat] = Z.pts.split(' ')[0].split(',').map(Number); v = { step: { zone: zf[0] }, lon, lat, label: Z.n }; }
  });
  zfLocC.set(key, { t: Date.now(), v }); return v;
}
const zfPic = (sp, st) => zf2$(() => nsPortrait(sp, null, null, st ? 'content' : 'curieux'), '');

// ---------- les pastilles ----------
const zfMk = new Map();
let zfRadar = false, zfRadT = null;
function zfRadarSet(on) {
  zfRadar = !!on; clearTimeout(zfRadT);
  zf2$(() => {
    const cc = map.getCanvasContainer(); let ov = document.getElementById('zfRad');
    if (zfRadar && !ov) { ov = document.createElement('div'); ov.id = 'zfRad'; ov.innerHTML = '<i class="zf-sw"></i>'; const cv = cc.querySelector('canvas'); cc.insertBefore(ov, cv ? cv.nextSibling : cc.firstChild); }
    if (!zfRadar && ov) ov.remove();
    let chip = document.getElementById('zfChip');
    if (zfRadar && !chip) { chip = document.createElement('button'); chip.id = 'zfChip'; chip.addEventListener('click', ev => { ev.stopPropagation(); zfList(); }); map.getContainer().appendChild(chip); }
    if (!zfRadar && chip) chip.remove();
  });
  zfRefresh();
  if (zfRadar) zfRadT = setTimeout(() => zfRadarSet(false), 90e3); // il s'éteint tout seul au bout d'une minute et demie
}
function zfRefresh() {
  if (typeof map === 'undefined' || !map || !mapReady || typeof maplibregl === 'undefined') return;
  const rid = zfHome(), seen = new Set();
  if (rid && zfRadar) for (const f of zfSps(rid)) {
    const st = zfSt(f.id); if (st >= 2) continue;
    const L = zfLoc(f, rid); if (!L) continue;
    const id = f.id; seen.add(id);
    let m = zfMk.get(id);
    if (!m) {
      const el = document.createElement('div'); el.className = 'zfm'; el.setAttribute('role', 'button'); el.tabIndex = 0;
      const hsh = zf2$(() => hashStr(id), 7); el.style.setProperty('--dx', ((hsh % 21) - 10) + 'px'); el.style.setProperty('--dy', (((hsh >> 5) % 17) - 8) + 'px'); el.style.setProperty('--dur', (2.4 + (hsh % 9) / 4) + 's'); el.style.setProperty('--del', ((hsh >> 3) % 12) / 10 + 's');
      el.addEventListener('click', ev => { ev.stopPropagation(); zfFiche(id); });
      m = new maplibregl.Marker({ element: el, anchor: 'bottom', opacity: '1', opacityWhenCovered: '1' }).setLngLat([L.lon, L.lat]).addTo(map); zfMk.set(id, m);
    } else m.setLngLat([L.lon, L.lat]);
    // v201 : NE JAMAIS remplacer className — MapLibre y a mis « maplibregl-marker » (position absolue). L'écraser faisait
    // glisser les formes d'une ville à l'autre selon le zoom (le joueur : « dézoomé il est sur Marseille, zoomé sur Lyon »).
    const el = m.getElement(), key = st + '' + f.tier;
    if (el.dataset.k !== key || !el.firstChild) { el.dataset.k = key; ['s0', 's1', 's2', 't0', 't1', 't2'].forEach(c => el.classList.remove(c)); el.classList.add('zfm', 's' + st, 't' + f.tier); el.setAttribute('aria-label', st ? `${f.nm} : où le trouver` : 'Familier inconnu : où le trouver'); el.innerHTML = `<span class="zfm-c"><img src="${zfPic(id, st)}" alt=""></span><span class="zfm-q">${st ? '' : '?'}</span>`; }
  }
  for (const [id, m] of zfMk) if (!seen.has(id)) { m.remove(); zfMk.delete(id); }
  zfBtn();
}
zf2$(() => { const hook = () => zf2$(() => { map.on('moveend', zfRefresh); map.on('load', zfRefresh); }); if (typeof map !== 'undefined' && map) hook(); });
setInterval(() => zf2$(() => { if (!document.hidden) zfRefresh(); }), 4000);
GAME.on('trip:return', () => setTimeout(() => zf2$(zfRefresh), 2500));
GAME.on('comp:new', () => setTimeout(() => zf2$(zfRefresh), 800));

// ---------- la fiche d'une espèce ----------
function zfFiche(sp) {
  const f = zf2$(() => FA_SP.find(x => x.id === sp), null); if (!f) return;
  const rid = zfHome(), st = zfSt(sp), L = zfLoc(f, rid), cond = zf2$(() => faCondTx(f), []);
  const km = L ? zf2$(() => Math.round(kmBetween(homeObj(), L)), null) : null;
  let go = '';
  if (L) { const i = zf2$(() => CF_GO.push({ step: L.step, name: st ? f.nm : 'Un familier inconnu', why: 'trouver ' + (st ? f.art : 'ce familier') }) - 1, -1); if (i >= 0) go = `<button class="btn green big wide" data-cfgo="${i}">Y aller · ${esc(L.label)}${km != null ? ` (${km} km)` : ''}</button>`; }
  const tier = ['Commun', 'Rare', 'Légendaire'][f.tier] || '';
  showModal(`<div class="zf-f s${st}"><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    <div class="zf-fp"><img class="${st ? '' : 'sil'}" src="${zfPic(sp, st)}" alt=""></div>
    <p class="cn-k">${tier} · ${st ? 'déjà aperçu' : 'jamais vu'}</p><h2>${st ? esc(f.nm) : '? ? ?'}</h2>
    <p class="zf-cl">🔎 ${esc(zf2$(() => faClue(sp, st ? 1 : 0), f.clue[0]))}</p>
    ${cond.length ? `<ul class="zf-co">${cond.map(c => `<li>${c.includes('nuit') ? '🌙' : c.includes('appât') ? '🧺' : '🍂'} ${esc(c.charAt(0).toUpperCase() + c.slice(1))}${c.includes('appât') ? (zf2$(() => sctSt().learn[sp], 0) ? ' <small>(recette connue : Herboristerie)</small>' : ' <small>(recette dans un camp d’Augustine)</small>') : ''}</li>`).join('')}</ul>` : '<p class="zf-ez">Pas de condition : partez voyager là où il vit, il finira par se montrer.</p>'}
    <p class="zf-how">En voyage dans son coin, un œuf peut apparaître : il éclôt à la Couveuse.</p>
    ${go}</div>`);
}

// ---------- le bouton 🐾 et la liste ----------
function zfBtn() {
  const host = document.querySelector('.zoom'); if (!host) return;
  let b = $('zfBtn');
  if (!b) { b = document.createElement('button'); b.id = 'zfBtn'; b.className = 'icon-btn zf-b'; b.addEventListener('click', ev => { ev.stopPropagation(); zfRadarSet(!zfRadar); }); host.insertBefore(b, host.firstChild); }
  const rid = zfHome(), L = rid ? zfSps(rid) : [], n = L.filter(f => zfSt(f.id) >= 2).length;
  const tx = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".6"/><path d="M12 12 L19 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="15" r="1.6" fill="currentColor"/></svg><small>${n}/${L.length}</small>`; if (b.innerHTML !== tx) b.innerHTML = tx;
  b.classList.toggle('on', zfRadar); b.setAttribute('aria-pressed', zfRadar ? 'true' : 'false');
  const chip = document.getElementById('zfChip'); if (chip) { const left = L.filter(f => zfSt(f.id) < 2).length, c2 = `📡 ${left} familier${left > 1 ? 's' : ''} à trouver · <b>Liste</b>`; if (chip.innerHTML !== c2) chip.innerHTML = c2; }
  b.setAttribute('aria-label', `Radar à familiers : ${n} trouvés sur ${L.length}`);
}
function zfList() {
  const rid = zfHome(); if (!rid) return;
  const L = zfSps(rid), n = L.filter(f => zfSt(f.id) >= 2).length;
  showModal(`<div class="zf-l"><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    <p class="cn-k">Le but du jeu</p><h2>Les familiers de ${esc(RG[rid].short || RG[rid].name)}</h2>
    <p class="zf-lp">Explorez pour les trouver tous : <b>${n}/${L.length}</b> adoptés. Allumez le radar : les formes qui bougent sur la carte montrent où en chercher.</p>
    <div class="zf-g">${L.map(f => { const st = zfSt(f.id); return `<button class="zf-gi s${st}" data-zfsp="${f.id}"><img class="${st ? '' : 'sil'}" src="${zfPic(f.id, st)}" alt=""><b>${st ? esc(f.nm) : '? ? ?'}</b><small>${st >= 2 ? '✓ Adopté' : st ? 'Aperçu' : ['Commun', 'Rare', 'Légendaire'][f.tier]}</small></button>`; }).join('')}</div>
    <button class="btn ${zfRadar ? 'cream' : 'green'} sm" data-zfrad="1">${zfRadar ? 'Éteindre le radar' : '📡 Allumer le radar'}</button></div>`);
}
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const a = t.closest('[data-zfsp]'); if (a) { ev.stopPropagation(); const sp = a.dataset.zfsp; if (zfSt(sp) >= 2) return; zfFiche(sp); return; }
  const h = t.closest('[data-zfrad]'); if (h) { ev.stopPropagation(); const m = $('modal'); if (m) m.hidden = true; zfRadarSet(!zfRadar); }
}, true);

zf2$(() => {
  const st = document.createElement('style');
  st.textContent = `#zfRad{position:absolute;inset:0;pointer-events:none;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(40,170,160,.10),rgba(10,60,70,.38) 75%),repeating-linear-gradient(0deg,rgba(120,255,230,.10) 0 1px,transparent 1px 34px),repeating-linear-gradient(90deg,rgba(120,255,230,.10) 0 1px,transparent 1px 34px);animation:zfin .5s ease-out}
#zfRad .zf-sw{position:absolute;left:50%;top:50%;width:220vmax;height:220vmax;margin:-110vmax 0 0 -110vmax;background:conic-gradient(from 0deg,rgba(120,255,230,0) 0deg,rgba(120,255,230,0) 300deg,rgba(120,255,230,.32) 355deg,rgba(200,255,245,.55) 360deg);animation:zfsw 3.2s linear infinite;border-radius:50%}
@keyframes zfsw{to{transform:rotate(360deg)}}@keyframes zfin{from{opacity:0}to{opacity:1}}
@keyframes zfwan{0%{transform:translate(0,0)}33%{transform:translate(var(--dx),calc(var(--dy) * -1))}66%{transform:translate(calc(var(--dx) * -.6),var(--dy))}100%{transform:translate(0,0)}}
@keyframes zffade{from{opacity:0}to{opacity:1}}
.zfm .zfm-c,.zfm .zfm-q{animation:zffade .6s ease-out var(--del,0s) both,zfwan var(--dur,3s) ease-in-out var(--del,0s) infinite}
.zfm .zfm-c{box-shadow:0 0 0 3px rgba(120,255,230,.55),0 0 14px rgba(120,255,230,.8)!important;background:rgba(220,255,250,.9)!important}
#zfChip{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 140px);z-index:7;max-width:86%;padding:8px 14px;min-height:40px;border-radius:999px;border:2px solid #2b8f86;background:#effffb;color:#1d5c56;font:700 13px var(--body,system-ui);box-shadow:0 3px 0 #2b8f86}
.zf-b.on{background:#2b8f86!important;color:#fff!important}.zf-b.on small{color:#fff}
@media (prefers-reduced-motion:reduce){#zfRad .zf-sw{animation:none;opacity:.4}.zfm .zfm-c,.zfm .zfm-q{animation:none}}
.zfm{width:48px;height:54px;cursor:pointer}.zfm-c{position:absolute;left:2px;top:0;width:44px;height:44px;border-radius:50%;background:#fffaf0;border:2.5px solid #4a3528;overflow:hidden;box-shadow:0 2px 0 rgba(74,53,40,.35);display:grid;place-items:center}
.zfm-c::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-5px;border:5px solid transparent;border-top-color:#4a3528}
.zfm-c img{width:54px;height:54px;object-fit:cover;margin-top:8px}.zfm.s0 .zfm-c img{filter:brightness(0);opacity:.5}.zfm.s1 .zfm-c{border-style:dashed;border-color:#7a5aa8}
.zfm.t1 .zfm-c{border-color:#3d6fb0}.zfm.t2 .zfm-c{border-color:#c98a1a;box-shadow:0 0 0 3px rgba(232,177,58,.45)}
.zfm-q{position:absolute;right:-2px;top:-4px;min-width:16px;height:16px;border-radius:999px;background:#4a3528;color:#fff;font:800 11px/16px system-ui;text-align:center}.zfm.s1 .zfm-q{display:none}
.zf-b{flex-direction:column;gap:0;width:44px!important;height:44px!important;padding:0!important;color:#2b8f86}.zf-b small{font:800 10px/1.1 var(--body,system-ui);color:#4a3528}
.zf-f,.zf-l{position:relative;text-align:left}.zf-f .ld-x,.zf-l .ld-x{position:absolute;right:0;top:0}
.zf-fp{width:120px;height:120px;margin:0 auto 6px;border-radius:50%;background:#fbf0dc;overflow:hidden;display:grid;place-items:center}.zf-fp img{width:140px;height:140px;object-fit:cover;margin-top:18px}.zf-fp img.sil,.zf-gi img.sil{filter:brightness(0);opacity:.45}
.zf-f h2,.zf-l h2{margin:0 0 6px;font:800 22px var(--display,inherit);color:#4a3528}.zf-cl{font:600 14px/1.4 var(--body,system-ui);color:#4a3528}
.zf-co{margin:6px 0;padding:0;list-style:none}.zf-co li{margin:0 0 4px;padding:6px 9px;border-radius:10px;background:#fff3c4;font:600 13px var(--body,system-ui);color:#5b4636}.zf-co small{color:#7a6250}
.zf-ez,.zf-how{font:600 12.5px/1.35 var(--body,system-ui);color:#7a6250}.zf-f .btn{margin-top:8px}
.zf-lp{font:600 13.5px var(--body,system-ui);color:#4a3528}.zf-g{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0 10px}
.zf-gi{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;border-radius:14px;border:2px solid #eadcc4;background:#fffaf0;font-family:inherit;color:#4a3528;min-height:44px}
.zf-gi img{width:58px;height:58px;object-fit:cover;border-radius:50%;background:#fbf0dc}.zf-gi b{font:800 12.5px var(--body,system-ui)}.zf-gi small{font:700 11px var(--body,system-ui);color:#7a6250}.zf-gi.s2{border-color:#9cc98f;background:#f3faef}.zf-gi.s2 small{color:#3f7f3a}`;
  document.head.appendChild(st);
});
window.__zf = { refresh: zfRefresh, loc: zfLoc, sps: zfSps };

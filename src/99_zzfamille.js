// ================= LES FAMILIERS SUR LA CARTE : LE BUT DU JEU SE VOIT (v199) =================
// Le joueur : « on ne comprend pas le but du jeu : l'exploration et la découverte de nouveaux familiers ; ce n'est pas intuitif ».
// 1) Sur la carte, chaque espèce sauvage de votre région pas encore adoptée a sa pastille, posée sur un VRAI lieu proche où elle
//    vit (son terrain, sa zone : faLives) : silhouette noire si jamais vue, portrait si déjà aperçue (traces, rencontre).
// 2) Toucher la pastille : qui c'est (ou « ? ? ? »), l'indice, les conditions (nuit, saison, appât) et « Y aller ».
// 3) Un bouton 🐾 « 3/12 » dans la colonne de droite : les familiers de votre région, trouvés sur le total.
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
function zfRefresh() {
  if (typeof map === 'undefined' || !map || !mapReady || typeof maplibregl === 'undefined') return;
  const rid = zfHome(), seen = new Set();
  if (rid && !(S.zf2 && S.zf2.hide)) for (const f of zfSps(rid)) {
    const st = zfSt(f.id); if (st >= 2) continue;
    const L = zfLoc(f, rid); if (!L) continue;
    const id = f.id; seen.add(id);
    let m = zfMk.get(id);
    if (!m) {
      const el = document.createElement('div'); el.className = 'zfm'; el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.addEventListener('click', ev => { ev.stopPropagation(); zfFiche(id); });
      m = new maplibregl.Marker({ element: el, anchor: 'bottom', opacity: '1', opacityWhenCovered: '1' }).setLngLat([L.lon, L.lat]).addTo(map); zfMk.set(id, m);
    } else m.setLngLat([L.lon, L.lat]);
    const el = m.getElement(), cls = 'zfm s' + st + ' t' + f.tier;
    if (el.className !== cls || !el.firstChild) { el.className = cls; el.setAttribute('aria-label', st ? `${f.nm} : où le trouver` : 'Familier inconnu : où le trouver'); el.innerHTML = `<span class="zfm-c"><img src="${zfPic(id, st)}" alt=""></span><span class="zfm-q">${st ? '' : '?'}</span>`; }
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
  if (!b) { b = document.createElement('button'); b.id = 'zfBtn'; b.className = 'icon-btn zf-b'; b.addEventListener('click', ev => { ev.stopPropagation(); zfList(); }); host.insertBefore(b, host.firstChild); }
  const rid = zfHome(), L = rid ? zfSps(rid) : [], n = L.filter(f => zfSt(f.id) >= 2).length;
  const tx = `<span>🐾</span><small>${n}/${L.length}</small>`; if (b.innerHTML !== tx) b.innerHTML = tx;
  b.setAttribute('aria-label', `Familiers de votre région : ${n} trouvés sur ${L.length}`);
}
function zfList() {
  const rid = zfHome(); if (!rid) return;
  const L = zfSps(rid), n = L.filter(f => zfSt(f.id) >= 2).length, hide = !!(S.zf2 && S.zf2.hide);
  showModal(`<div class="zf-l"><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    <p class="cn-k">Le but du jeu</p><h2>Les familiers de ${esc(RG[rid].short || RG[rid].name)}</h2>
    <p class="zf-lp">Explorez pour les trouver tous : <b>${n}/${L.length}</b> adoptés. Chaque pastille sur la carte montre où en chercher un.</p>
    <div class="zf-g">${L.map(f => { const st = zfSt(f.id); return `<button class="zf-gi s${st}" data-zfsp="${f.id}"><img class="${st ? '' : 'sil'}" src="${zfPic(f.id, st)}" alt=""><b>${st ? esc(f.nm) : '? ? ?'}</b><small>${st >= 2 ? '✓ Adopté' : st ? 'Aperçu' : ['Commun', 'Rare', 'Légendaire'][f.tier]}</small></button>`; }).join('')}</div>
    <button class="btn cream sm" data-zfhide="1">${hide ? 'Montrer les pastilles sur la carte' : 'Masquer les pastilles sur la carte'}</button></div>`);
}
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const a = t.closest('[data-zfsp]'); if (a) { ev.stopPropagation(); const sp = a.dataset.zfsp; if (zfSt(sp) >= 2) return; zfFiche(sp); return; }
  const h = t.closest('[data-zfhide]'); if (h) { ev.stopPropagation(); S.zf2 = S.zf2 || {}; S.zf2.hide = !S.zf2.hide; save(); zfRefresh(); zfList(); }
}, true);

zf2$(() => {
  const st = document.createElement('style');
  st.textContent = `.zfm{width:40px;height:46px;cursor:pointer;position:relative}.zfm-c{position:absolute;left:2px;top:0;width:36px;height:36px;border-radius:50%;background:#fffaf0;border:2.5px solid #4a3528;overflow:hidden;box-shadow:0 2px 0 rgba(74,53,40,.35);display:grid;place-items:center}
.zfm-c::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-5px;border:5px solid transparent;border-top-color:#4a3528}
.zfm-c img{width:44px;height:44px;object-fit:cover;margin-top:6px}.zfm.s0 .zfm-c img{filter:brightness(0);opacity:.5}.zfm.s1 .zfm-c{border-style:dashed;border-color:#7a5aa8}
.zfm.t1 .zfm-c{border-color:#3d6fb0}.zfm.t2 .zfm-c{border-color:#c98a1a;box-shadow:0 0 0 3px rgba(232,177,58,.45)}
.zfm-q{position:absolute;right:-2px;top:-4px;min-width:16px;height:16px;border-radius:999px;background:#4a3528;color:#fff;font:800 11px/16px system-ui;text-align:center}.zfm.s1 .zfm-q{display:none}
.zf-b{flex-direction:column;gap:0;width:44px!important;height:44px!important;padding:0!important}.zf-b span{font-size:16px;line-height:1}.zf-b small{font:800 10px/1.1 var(--body,system-ui);color:#4a3528}
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

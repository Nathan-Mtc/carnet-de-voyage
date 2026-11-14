// ================= 75 · AMÉNAGER SA MAISON, SOUVENIRS DE VOYAGE (v51) =================
// Le joueur : « j'aimerais pouvoir personnaliser un peu comme Animal Crossing » ; « le joueur doit utiliser cet onglet,
// sinon il ne sert à rien : augmente son utilité ». Choix (14/11) : meubles + murs et sol ; souvenirs → meubles ;
// recharger avant de partir (Entrée, Chambres : 74) ; la maison prépare le voyage (provisions, matériel : 74).
// 1. AMÉNAGER : dans chaque pièce, « ✏️ Aménager » montre une grille ; on choisit une décoration du sac et on touche une
//    case (les tableaux et cartes vont au mur : cases contre un mur). Toucher un objet posé : tourner, déplacer, ranger.
//    Les objets posés comptent dans le CONFORT existant (49_foyer3d.js : +butin, −risques) : chaque objet posé est rangé
//    dans S.f3d.d sous une clé « hmN » déclarée comme emplacement (F3_SLOT), donc tous les effets existants s'appliquent.
//    Les anciens emplacements 3D sont vidés dans le salon (une fois, puis à chaque « Poser chez moi » du sac).
// 2. MURS ET SOL : papiers peints et sols achetés une fois (pièces), utilisables dans toutes les pièces.
// 3. SOUVENIRS : un lieu ★★ (35 %) ou ★★★ (toujours) rapporte un souvenir à poser chez soi, lié à son terrain ;
//    posé, chacun donne −5 % de risques sur ce terrain (jusqu'à −20 %). Affiché au départ.
// État : S.hm = { n, p: { clé: { r: pièce, x, y, m: retourné } }, r: { pièce: { w, f } }, own: { w: [], f: [] } }.
const HM_WALLS = {
  peche: ['Pêche rayé', '#f7d9bd', 'stripe', 0], rose: ['Rose rayé', '#f5d6e2', 'stripe', 0], menthe: ['Menthe à pois', '#d6ead0', 'dots', 0],
  creme: ['Crème uni', '#f6e8d4', 'plain', 60], lambris: ['Lambris', '#e5c9a0', 'wood', 120], lavande: ['Lavande à pois', '#e4dbf3', 'dots', 120],
  fleurs: ['Fleuri', '#f4d9cf', 'flowers', 180], ciel: ['Ciel étoilé', '#3b4778', 'stars', 250],
};
const HM_FLOORS = {
  miel: ['Parquet miel', '#e3b98a', 'planks', 0], carreau: ['Carrelage crème', '#f1e6d4', 'tiles', 0],
  clair: ['Parquet clair', '#ecd5b2', 'planks', 80], fonce: ['Parquet noyer', '#b78a62', 'planks', 120],
  damier: ['Damier menthe', '#d5ebd2', 'check', 150], moquette: ['Moquette rose', '#f2c7d2', 'carpet', 150], nuit: ['Moquette nuit', '#6d5a8c', 'carpet', 200],
};
const HM_MAXI = 12; // objets par pièce
let hmPick = null, hmSel = null, hmMove = false, hmEdTab = 'o';
function hmS() {
  if (!S.hm || typeof S.hm !== 'object') S.hm = {};
  const H = S.hm;
  if (!H.p || typeof H.p !== 'object') H.p = {};
  if (!H.r || typeof H.r !== 'object') H.r = {};
  if (!H.own || typeof H.own !== 'object') H.own = {};
  if (!Array.isArray(H.own.w)) H.own.w = []; if (!Array.isArray(H.own.f)) H.own.f = [];
  if (typeof H.n !== 'number') H.n = 0;
  return H;
}
hmCustom = id => { const C = hmS().r[id] || {}; return { w: HM_WALLS[C.w], f: HM_FLOORS[C.f] }; };
const hmOwn = (t, id) => (t === 'w' ? HM_WALLS : HM_FLOORS)[id][3] === 0 || hmS().own[t].includes(id);
// ---------------- les objets posés deviennent des emplacements de confort ----------------
const hmWallIt = it => !!it && it.sub !== 'mappemonde' && (['herbier', 'cartemur'].includes(it.sub) || /tableau|carte|horloge|pendule|affiche|planisph/i.test(it.name || ''));
function hmReg(key, it) { if (typeof F3_SLOT !== 'undefined' && !F3_SLOT[key]) F3_SLOT[key] = [key, 'H', 0, 0, 0, 0, it && it.sub === 'tapis' ? 'r' : 'f', 'Chez vous', [], /^\b$/, '']; }
function hmRegAll() { try { const d = S.f3d && S.f3d.d; Object.keys(hmS().p).forEach(k => hmReg(k, d && d[k])); } catch (e) {} }
if (typeof f3State === 'function') f3State = (orig => function () { hmRegAll(); return orig.apply(this, arguments); })(f3State);
const hmBlkOf = id => hm$(() => HM_ISO[id](hmLvl(hmR(id))).blk || [], []);
const hmIn = (blk, x, y) => blk.some(([a, b, w, d]) => x + .5 > a && x + .5 < a + w && y + .5 > b && y + .5 < b + d);
function hmHere(room) { const D = f3State(), H = hmS(); return Object.entries(H.p).filter(([k, p]) => p.r === room && D.d[k]).map(([k, p]) => ({ k, p, it: D.d[k], w: hmWallIt(D.d[k]) })); }
function hmCanAt(room, it, x, y, skip, blk) {
  if (x < 0 || y < 0 || x > 8 || y > 8) return false;
  const here = hmHere(room).filter(o => o.k !== skip), w = hmWallIt(it);
  if (here.length >= HM_MAXI && !skip) return false;
  if (w) return (x === 0 || y === 0) && !here.some(o => o.w && o.p.x === x && o.p.y === y);
  return !hmIn(blk || hmBlkOf(room), x, y) && !here.some(o => !o.w && o.p.x === x && o.p.y === y);
}
function hmFree(room, it) { const blk = hmBlkOf(room); for (let s = 8; s >= 0; s--) for (let x = 0; x <= 8; x++) { const y = s - x + 4; if (y >= 0 && y <= 8 && hmCanAt(room, it, x, y, null, blk)) return [x, y]; } for (let x = 0; x <= 8; x++) for (let y = 0; y <= 8; y++) if (hmCanAt(room, it, x, y, null, blk)) return [x, y]; return null; }
// les anciens emplacements 3D (et « Poser chez moi » depuis le sac) arrivent dans le salon
function hmMig() {
  try {
    const D = f3State(), H = hmS();
    F3_SLOTS.forEach(sl => { const it = D.d[sl[0]]; if (!it) return; let r = 'salon', at = hmFree(r, it); if (!at) { r = 'chambres'; at = hmFree(r, it); } if (!at) return; const key = 'hm' + (++H.n); hmReg(key, it); D.d[key] = it; delete D.d[sl[0]]; H.p[key] = { r, x: at[0], y: at[1], m: 0 }; });
  } catch (e) { console.error('aménager migration', e); }
}
// ---------------- dessin des objets posés et de la grille ----------------
function hmItemSVG(o, sel) {
  const { it, p } = o, ico = hm$(() => itemIcon(it), '');
  if (o.w) {
    const L = p.y > 0 && p.x === 0, a0 = (L ? p.y : p.x) + .5 - .7, z0 = 2.5, w = 1.4, h = 1.4;
    const M = L ? [-w * HIA / 100, w * HIB / 100, 0, h * HIU / 100, HIOX - a0 * HIA, HIOY + a0 * HIB - (z0 + h) * HIU] : [w * HIA / 100, w * HIB / 100, 0, h * HIU / 100, HIOX + a0 * HIA, HIOY + a0 * HIB - (z0 + h) * HIU];
    return `<g class="hm-pi${sel ? ' sel' : ''}" transform="matrix(${M.map(v => +v.toFixed(3)).join(' ')})">${ico.replace('<svg ', '<svg width="100" height="100" ')}</g>`;
  }
  const [cx, cy] = hIP(p.x + .5, p.y + .5, 0);
  if (it.sub === 'tapis') return `<g class="hm-pi${sel ? ' sel' : ''}">${hIEll(p.x + .5, p.y + .5, 1, it.color || '#f2a58c')}${hIEll(p.x + .5, p.y + .5, .65, 'none', 0, 'stroke="#fff" stroke-opacity=".8" stroke-width="2"')}</g>`;
  const big = /plante|lampe|lanterne|statue|mappemonde/.test(it.sub || '') ? 50 : 40;
  return `<g class="hm-pi${sel ? ' sel' : ''}"${p.m ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : ''}><ellipse cx="${cx}" cy="${cy}" rx="${big * .34}" ry="${big * .12}" fill="#4a3026" opacity=".18"/>${ico.replace('<svg ', `<svg x="${cx - big / 2}" y="${cy - big + 4}" width="${big}" height="${big}" `)}</g>`;
}
hmExtra = (R, D) => {
  const here = hm$(() => hmHere(R.id), []), walls = here.filter(o => o.w), floors = here.filter(o => !o.w).sort((a, b) => (a.p.x + a.p.y) - (b.p.x + b.p.y));
  let s = walls.concat(floors).map(o => hmItemSVG(o, hmEdit && hmSel === o.k)).join(''), top = '';
  if (hmEdit) {
    const pk = hmPick && S.inv.find(i => i.id === hmPick), mv = hmMove && hmSel && f3State().d[hmSel], probe = pk || mv;
    for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) {
      const occ = here.find(o => o.p.x === x && o.p.y === y), blk = hmIn(D.blk || [], x, y);
      const ok = probe ? hmCanAt(R.id, probe, x, y, mv ? hmSel : null, D.blk || []) : false;
      const cls = occ && occ.k === hmSel ? 'sel' : ok ? 'ok' : occ ? 'occ' : blk ? 'blk' : '';
      top += hIPath(hIFq(x + .06, y + .06, .88, .88), 'transparent', `class="hm-cell ${cls}" data-hmcell="${x},${y}"`);
    }
  }
  return { s, top };
};
// ---------------- le panneau d'aménagement ----------------
function hmComfortHTML() {
  const E = hm$(() => f3Eff(), null), c = hm$(() => f3Comfort(), 0); if (!E) return '';
  const nx = F3_LV.find(L => L[1] > c);
  return `<div class="hm-cf"><b>🏡 Maison ${esc(E.nm.toLowerCase())}</b><span>${E.p ? `+${f3Pct(E.p)} % de butin · −${f3Pct(E.p)} % de risques en voyage` : 'Pas encore de bonus : posez des décorations'}</span>${nx ? `<small>Encore ${nx[1] - c} point${nx[1] - c > 1 ? 's' : ''} de confort pour « ${nx[0]} »</small>` : '<small>Confort au maximum !</small>'}</div>`;
}
function hmSwHTML(t) {
  const C = (t === 'w' ? HM_WALLS : HM_FLOORS), cur = (hmS().r[hmRoom] || {})[t];
  return `<div class="hm-sw">${Object.entries(C).map(([id, v]) => { const own = hmOwn(t, id); return `<button data-hm${t === 'w' ? 'wall' : 'floor'}="${id}" class="${cur === id ? 'on' : ''}"><i class="hm-swp p-${v[2]}" style="--c:${v[1]}"></i><b>${esc(v[0])}</b><small>${own ? (cur === id ? '✓ posé' : 'à vous') : `${v[3]} 🪙`}</small></button>`; }).join('')}</div>`;
}
function hmEditHTML(R) {
  const tabs = `<div class="hm-et">${[['o', '🪑 Objets'], ['w', '🖼️ Murs'], ['f', '🟫 Sol']].map(([k, l]) => `<button data-hmedtab="${k}" class="${hmEdTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  if (hmEdTab !== 'o') return `<div class="hm-ed">${tabs}${hmSwHTML(hmEdTab)}<p class="hm-tip">Acheté une fois, utilisable dans toutes les pièces.</p></div>`;
  const D = f3State(), sel = hmSel && D.d[hmSel];
  const cnt = {}, list = (S.inv || []).filter(it => hm$(() => f3IsDeco(it), false)).filter(it => { const k = it.name + '|' + (it.rarity | 0); cnt[k] = (cnt[k] || 0) + 1; return cnt[k] === 1; });
  const nOf = it => cnt[it.name + '|' + (it.rarity | 0)];
  const pk = hmPick && S.inv.find(i => i.id === hmPick);
  const hint = hmMove && sel ? `Touchez la nouvelle case de « ${esc(sel.name)} ».` : pk ? `Touchez une case verte pour poser « ${esc(pk.name)} »${hmWallIt(pk) ? ' (au mur)' : ''}.` : sel ? '' : 'Choisissez un objet ci-dessous, puis touchez une case. Touchez un objet posé pour le déplacer.';
  return `<div class="hm-ed">${tabs}${sel ? `<div class="hm-act"><b>${esc(sel.name)}</b><span>+${hm$(() => f3Pts(sel, hmSel), 1)} confort${sel.sv ? ' · souvenir' : ''}</span><div>${hmWallIt(sel) ? '' : '<button data-hmact="rot">↻ Tourner</button>'}<button data-hmact="move" class="${hmMove ? 'on' : ''}">✋ Déplacer</button><button data-hmact="store">📦 Ranger</button></div></div>` : ''}
    ${hint ? `<p class="hm-hint">${hint}</p>` : ''}
    <div class="hm-tray">${list.length ? list.map(it => `<button data-hmpick="${esc(it.id)}" class="${hmPick === it.id ? 'on' : ''}${it.sv ? ' sv' : ''}">${hm$(() => itemIcon(it), '')}<small>${esc(it.name)}</small>${nOf(it) > 1 ? `<i>×${nOf(it)}</i>` : ''}</button>`).join('') : '<p class="hm-tip">Aucune décoration dans le sac : fabriquez-en à l’atelier, ou rapportez des souvenirs des lieux ★★ et ★★★.</p>'}</div>
    ${hmComfortHTML()}</div>`;
}
const hmSvInv = () => (S.inv || []).filter(it => it && it.sv);
hmPanelExtra = (box, R, at) => {
  if (at === 'top' && hmEdit) { box.insertAdjacentHTML('beforeend', hmEditHTML(R)); return; }
  if (at !== 'end' || hmEdit) return;
  if (R.id === 'salon') box.insertAdjacentHTML('beforeend', hmComfortHTML() + `<button class="btn green hm-go" data-hmedit="1">✏️ Aménager la maison</button>`);
  if (R.id === 'entree') { const n = hmSvInv().length; if (n) box.insertAdjacentHTML('beforeend', `<button class="hm-sv" data-hmedit="1"><span>📦</span><b>${n} souvenir${n > 1 ? 's' : ''} de voyage à déballer</b><small>Posez-les chez vous : chacun réduit les risques sur son terrain.</small></button>`); }
};
// ---------------- clics ----------------
function hmRe() { const b = $('panelBody'), t = b ? b.scrollTop : 0; renderPanel(); const b2 = $('panelBody'); if (b2) b2.scrollTop = t; }
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest || !t.closest('#panelBody')) return;
  const e = t.closest('[data-hmedit],[data-hmedtab],[data-hmpick],[data-hmcell],[data-hmact],[data-hmwall],[data-hmfloor]'); if (!e) return;
  ev.stopPropagation(); const d = e.dataset, H = hmS();
  if (d.hmedit) { hmEdit = !hmEdit; hmPick = hmSel = null; hmMove = false; hmEdTab = 'o'; if (hmEdit) { const r = hmR(hmRoom); if (!r || r.id === 'jardin' || (r.lock && hmLvl(r) < 1)) hmRoom = 'salon'; } return hmRe(); }
  if (d.hmedtab) { hmEdTab = d.hmedtab; return hmRe(); }
  if (d.hmpick) { hmPick = hmPick === d.hmpick ? null : d.hmpick; hmSel = null; hmMove = false; return hmRe(); }
  if (d.hmact) {
    const it = f3State().d[hmSel]; if (!it) { hmSel = null; return hmRe(); }
    if (d.hmact === 'rot') H.p[hmSel].m = H.p[hmSel].m ? 0 : 1;
    if (d.hmact === 'move') hmMove = !hmMove;
    if (d.hmact === 'store') { f3Take(hmSel); delete H.p[hmSel]; hm$(() => toast(`${it.name} retourne dans le sac.`), 0); hmSel = null; hmMove = false; }
    save(); return hmRe();
  }
  if (d.hmcell) {
    const [x, y] = d.hmcell.split(',').map(Number), room = hmRoom;
    if (hmPick) {
      const it = S.inv.find(i => i.id === hmPick); if (!it) { hmPick = null; return hmRe(); }
      if (!hmCanAt(room, it, x, y)) { hm$(() => toast(hmHere(room).length >= HM_MAXI ? `${HM_MAXI} objets au plus par pièce.` : hmWallIt(it) ? 'Un tableau se pose contre un mur.' : 'Cette case est prise.'), 0); return; }
      const key = 'hm' + (++H.n), before = f3Eff(); hmReg(key, it);
      if (f3Place(key, it.id)) {
        H.p[key] = { r: room, x, y, m: 0 }; save(); const E = f3Eff();
        hm$(() => toast(`${it.name} : +${f3Pts(it, key)} confort${E.i > before.i ? ` · maison « ${E.nm} » !` : ''}`), 0);
        if (!S.inv.some(i => i.name === it.name && (i.rarity | 0) === (it.rarity | 0))) hmPick = null; else hmPick = S.inv.find(i => i.name === it.name && (i.rarity | 0) === (it.rarity | 0)).id;
      }
      return hmRe();
    }
    if (hmMove && hmSel) { const it = f3State().d[hmSel]; if (it && hmCanAt(room, it, x, y, hmSel)) { H.p[hmSel].x = x; H.p[hmSel].y = y; hmMove = false; save(); } return hmRe(); }
    const here = hmHere(room), o = here.find(q => !q.w && q.p.x === x && q.p.y === y) || here.find(q => q.w && q.p.x === x && q.p.y === y);
    hmSel = o ? (hmSel === o.k ? null : o.k) : null; hmMove = false; return hmRe();
  }
  if (d.hmwall || d.hmfloor) {
    const tp = d.hmwall ? 'w' : 'f', id = d.hmwall || d.hmfloor, C = tp === 'w' ? HM_WALLS : HM_FLOORS, v = C[id]; if (!v) return;
    if (!hmOwn(tp, id)) {
      if ((S.coins || 0) < v[3]) { hm$(() => toast(`Il manque ${v[3] - (S.coins || 0)} pièces.`), 0); return; }
      S.coins -= v[3]; H.own[tp].push(id); hm$(() => renderTop(), 0); hm$(() => toast(`${v[0]} acheté !`), 0);
    }
    H.r[hmRoom] = Object.assign({}, H.r[hmRoom], { [tp]: id }); save(); return hmRe();
  }
}, true);
// en quittant l'aménagement par un onglet ou une pièce : on garde le mode, mais on lâche l'objet tenu
document.addEventListener('click', ev => { const r = ev.target.closest && ev.target.closest('[data-hmroom],[data-hmnav]'); if (r) { hmPick = hmSel = null; hmMove = false; } }, true);
if (typeof fyRender === 'function') fyRender = (orig => function (box) { hmMig(); if (hmEdit) { const r = hmR(hmRoom); if (r && (r.id === 'jardin' || (r.lock && hmLvl(r) < 1))) hmEdit = false; } return orig.apply(this, arguments); })(fyRender);
// ---------------- souvenirs de voyage ----------------
const HM_SV = { montagne: ['Cloche d’alpage', 'statue', '#c9a35a'], mer: ['Lanterne de port', 'lanterne', '#3f8ac0'], foret: ['Mousse en bocal', 'bocal', '#5fb36b'], ville: ['Boule à neige', 'bocal', '#a9c8e8'], desert: ['Sablier des dunes', 'statue', '#e0a96a'], froid: ['Bougie de givre', 'lanterne', '#9fd0ea'], campagne: ['Moulin miniature', 'plante', '#d98a5f'] };
const hmSvN = terr => hm$(() => Object.values(f3State().d).filter(it => it && it.sv === terr).length, 0);
if (typeof collect === 'function') collect = (orig => function () {
  try {
    const k = S.sel, t = S.trips && S.trips[k];
    if (t && t.done && !t.tuto && !t.hmSv && Array.isArray(t.bag) && t.dest) {
      t.hmSv = 1;
      const g = hm$(() => sgOf(t.dest), null), st = g ? g.s : 1;
      if (st >= 3 || (st === 2 && Math.random() < 0.35)) {
        const terr = hm$(() => xpTerrOf(t.dest), 'campagne'), B = HM_SV[terr] || HM_SV.campagne, pl = String(t.dest.name || '').split(',')[0].slice(0, 24);
        const it = makeItem([`${B[0]} · ${pl}`, 'd', B[1], st, null, B[2]], 0, t.dest.name, t.dest.tags || [], { fixed: st });
        it.sv = HM_SV[terr] ? terr : 'campagne'; t.bag.push(it);
      }
    }
  } catch (e) { console.error('souvenir', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof xpRiskK === 'function') xpRiskK = (orig => function (k, c) {
  const r = orig.apply(this, arguments);
  try { if (r > 0 && c && c.terr) { const n = Math.min(4, hmSvN(c.terr)); if (n) return Math.max(0.03, r * (1 - 0.05 * n)); } } catch (e) {}
  return r;
})(xpRiskK);
if (typeof f3GoHTML === 'function') f3GoHTML = (orig => function (k, d) {
  const h = orig.apply(this, arguments);
  try { const terr = xpTerrOf(d), n = Math.min(4, hmSvN(terr)); if (n) return h.replace(/<\/div>$/, `<span class="ok">${n} souvenir${n > 1 ? 's' : ''} exposé${n > 1 ? 's' : ''} : −${5 * n} % de risques ${F3_TW[terr] || ''}</span></div>`); } catch (e) {}
  return h;
})(f3GoHTML);
try { GAME.addUses(it => it && it.sv ? [{ txt: `Souvenir : posé chez vous, −5 % de risques ${F3_TW[it.sv] || ''} (jusqu’à −20 %)`, kind: 'decorer' }] : []); } catch (e) {}
// ---------------- plus de doublons : Atelier et Nurserie s'ouvrent depuis leur pièce ----------------
if (typeof renderPanel === 'function') renderPanel = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    if (typeof tab !== 'undefined' && tab === 'village' && !hm$(() => pgTuto(), false)) {
      const b = $('panelBody'); b.querySelectorAll('.subtabs [data-sub="atelier"], .subtabs [data-sub="nurserie"]').forEach(e => e.remove());
      if ((villView === 'atelier' || villView === 'nurserie') && !b.querySelector('[data-hmhome]')) { const st = b.querySelector('.subtabs'); const h = `<button class="btn cream sm hm-home" data-hmhome="1">← La maison</button>`; if (st) st.insertAdjacentHTML('afterend', h); else b.insertAdjacentHTML('afterbegin', h); }
    }
  } catch (e) {}
  return r;
})(renderPanel);
document.addEventListener('click', ev => { const e = ev.target.closest && ev.target.closest('[data-hmhome]'); if (!e) return; ev.stopPropagation(); const back = villView; try { villView = 'foyer'; setSub('village', 'foyer'); } catch (x) {} hmRoom = back === 'nurserie' ? 'nurserie' : 'atelier'; renderPanel(); }, true);
window.__am = { S: () => hmS(), here: r => hmHere(r), edit: v => { hmEdit = v; } };
{
  const st = document.createElement('style');
  st.textContent = `.hm-cell{stroke:#fff;stroke-opacity:.75;stroke-width:1;stroke-dasharray:3 2;cursor:pointer}.hm-cell.ok{fill:rgba(95,179,107,.32);stroke:#5fb36b;stroke-dasharray:none}
.hm-cell.blk{fill:rgba(74,48,38,.06)}.hm-cell.occ{fill:rgba(242,193,78,.18)}.hm-cell.sel{fill:rgba(242,193,78,.5);stroke:#e0a01e;stroke-width:2;stroke-dasharray:none}
.hm-pi.sel{filter:drop-shadow(0 0 3px #ffd866) drop-shadow(0 0 2px #e0a01e)}
.hm-ed{margin:8px 0;padding:10px;border-radius:18px;background:#fff;border:2px solid #f2d9a8}
.hm-et{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}.hm-et button{padding:7px 0;border-radius:12px;border:2px solid transparent;background:#fbf4e8;font:800 13px var(--body,system-ui);color:var(--ink2,#7a6250);cursor:pointer}.hm-et button.on{background:#fff7d6;border-color:#f2c14e;color:var(--ink,#4a3528)}
.hm-hint{margin:0 2px 8px;font-size:12.5px;color:#2f7f4c;font-weight:700}
.hm-tray{display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}.hm-tray>p{margin:0}
.hm-tray button{position:relative;flex:none;width:76px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px;border:2px solid var(--line,#eadfce);border-radius:14px;background:#fffdf8;cursor:pointer;font:inherit}
.hm-tray button.on{border-color:#5fb36b;background:#f1faee}.hm-tray button.sv{border-color:#f2c14e}.hm-tray svg{width:44px;height:44px}.hm-tray small{font-size:10.5px;line-height:1.15;color:var(--ink,#4a3528);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-align:center}
.hm-tray i{position:absolute;top:3px;right:5px;font:800 10.5px system-ui;font-style:normal;color:#9a8470}
.hm-act{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-bottom:8px;padding:8px 10px;border-radius:12px;background:#fff7d6}.hm-act b{font-size:13.5px}.hm-act span{font-size:12px;color:#9a8470}
.hm-act div{display:flex;gap:6px;width:100%}.hm-act div button{flex:1;padding:7px 0;border-radius:10px;border:2px solid #ecd9b6;background:#fff;font:800 12.5px var(--body,system-ui);color:var(--ink,#4a3528);cursor:pointer}.hm-act div button.on{border-color:#5fb36b;background:#f1faee}
.hm-cf{display:flex;flex-direction:column;gap:1px;margin:10px 0 6px;padding:10px 12px;border-radius:14px;background:#fff7ea}.hm-cf b{font:800 14px var(--display,inherit);color:var(--ink,#4a3528)}.hm-cf span{font-size:12.5px;color:#2f7f4c;font-weight:700}.hm-cf small{font-size:11.5px;color:#a8927c}
.hm-sw{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.hm-sw button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border:2px solid var(--line,#eadfce);border-radius:12px;background:#fff;cursor:pointer;font:inherit}.hm-sw button.on{border-color:#f2c14e;background:#fff7d6}
.hm-sw b{font-size:10.5px;line-height:1.15;text-align:center;color:var(--ink,#4a3528)}.hm-sw small{font-size:10.5px;color:#9a8470}
.hm-swp{width:38px;height:38px;border-radius:10px;background:var(--c);box-shadow:inset 0 0 0 1.5px rgba(74,53,40,.25)}
.hm-swp.p-stripe{background:repeating-linear-gradient(90deg,var(--c) 0 6px,rgba(255,255,255,.4) 6px 10px),var(--c)}.hm-swp.p-dots,.hm-swp.p-carpet{background:radial-gradient(#fff9 1.6px,transparent 2px) 0 0/8px 8px,var(--c)}
.hm-swp.p-wood,.hm-swp.p-planks{background:repeating-linear-gradient(0deg,var(--c) 0 7px,rgba(74,48,38,.18) 7px 8px),var(--c)}.hm-swp.p-tiles{background:linear-gradient(90deg,#fff8 1px,transparent 1px) 0 0/10px 10px,linear-gradient(#fff8 1px,transparent 1px) 0 0/10px 10px,var(--c)}
.hm-swp.p-check{background:conic-gradient(var(--c) 25%,rgba(74,48,38,.12) 0 50%,var(--c) 0 75%,rgba(74,48,38,.12) 0) 0 0/14px 14px}.hm-swp.p-stars{background:radial-gradient(#ffe9a8 1.2px,transparent 1.6px) 0 0/9px 9px,var(--c)}.hm-swp.p-flowers{background:radial-gradient(#fff 2px,#f2c14e 2.2px 3px,transparent 3.4px) 0 0/12px 12px,var(--c)}
.hm-sv{display:grid;grid-template-columns:auto 1fr;gap:0 10px;align-items:center;width:100%;margin:10px 0;padding:10px 12px;border-radius:16px;border:2px dashed #f2c14e;background:#fffaf0;text-align:left;cursor:pointer;font:inherit}
.hm-sv span{grid-row:span 2;font-size:26px}.hm-sv b{font-size:14px;color:var(--ink,#4a3528)}.hm-sv small{font-size:12px;color:#9a8470}
.hm-home{margin:0 0 8px}`;
  document.head.appendChild(st);
}

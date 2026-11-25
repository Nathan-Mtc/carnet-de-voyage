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
// v203 : un radar vide au début, ce n'est pas parlant (le joueur : « j'ai aucune piste ») :
// à la première ouverture, le carnet d'Augustine donne 2 pistes près de chez vous (des espèces communes, sur leur vrai lieu)
function zoFirst() {
  const st = zoSt(); if (st.first || st.L.length) return; st.first = Date.now();
  const rid = zfHome(); const C = zfSps(rid).filter(f => zfSt(f.id) < 2 && f.tier === 0); let n = 0;
  for (const f of C.concat(zfSps(rid).filter(f => zfSt(f.id) < 2 && f.tier > 0))) { if (n >= 2) break; const Lc = zfLoc(f, rid); if (!Lc) continue; zoAdd(f.id, 'savoir', Lc.poi || { name: Lc.label, lon: Lc.lon, lat: Lc.lat, cat: Lc.cat || 'sentier', tags: [] }, `Carnet d’Augustine : « J’ai souvent vu ${f.art} vers ${Lc.label} »`, 'Augustine'); n++; }
  if (n) { save(); setTimeout(() => zf2$(() => toast(`📖 Le carnet d’Augustine vous donne ${n} piste${n > 1 ? 's' : ''} pour commencer : touchez les formes !`)), 600); }
}
function zfRadarSet(on) {
  if (on) zf2$(zoFirst);
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
// ================= v202 : LE RADAR = VOS OBSERVATIONS (le joueur : « un truc plus réel, pas un scan sorti de nulle part ») =================
// Le radar ne devine plus rien : il affiche ce que VOUS SAVEZ, et d'où vous le savez :
//  ✨ vu    — en voyage, un familier a senti une présence là où il est allé (la brume y est donc levée)
//  👣 trace — empreintes, plumes, poils rapportés d'un voyage, à l'endroit exact
//  🔊 bruit — ce qu'on a entendu lors d'un voyage parti la nuit
//  📚 savoir — un vrai musée, une bibliothèque ou un parc animalier vous apprend où vit une espèce de la région
//  👁️ témoin — un client de la boutique raconte ce qu'il a vu
// Plusieurs indices au même endroit = on est presque sûr. Toucher une forme : les indices, puis « Y aller ».
const ZO_SRC = { vu: ['✨', 'Présence sentie'], trace: ['👣', 'Traces'], bruit: ['🔊', 'Bruits de la nuit'], savoir: ['📚', 'Savoir'], temoin: ['👁️', 'Témoignage'] };
const ZO_TRACE = { riviere: ['Empreintes palmées dans la vase', 'Des poils mouillés sur une pierre'], marais: ['Des traces dans la boue', 'Une plume grise dans les roseaux'], foret: ['Des poils accrochés à une branche', 'Une noisette rongée', 'Des empreintes sous les feuilles'], montagne: ['Des empreintes dans la neige', 'Un terrier entre les rochers'], neige: ['Des empreintes dans la neige fraîche'], mer: ['Des plumes sur le sable', 'Des empreintes au bord de l’eau'], campagne: ['Un terrier au bord du champ', 'Des empreintes dans la terre'], ville: ['Une plume sur un rebord de fenêtre', 'Des petites empreintes dans un parc'], desert: ['Des traces dans le sable'], jungle: ['Une grande plume colorée'] };
const ZO_SOUND = { riviere: 'un clapotis et un petit sifflement', marais: 'des coassements', foret: 'un hululement', montagne: 'un sifflement strident', neige: 'un cri dans le froid', mer: 'des cris au-dessus des vagues', campagne: 'un glapissement', ville: 'un roucoulement', desert: 'un cri dans la nuit chaude', jungle: 'des cris perçants' };
const ZO_KNOW = ['musee', 'bibliotheque', 'zoo'];
function zoSt() { if (!S.obs || !Array.isArray(S.obs.L)) S.obs = { L: [], day: {} }; if (!S.obs.day) S.obs.day = {}; return S.obs; }
const zoPick = a => a[Math.floor(Math.random() * a.length)];
const zoDest = d => d ? { id: d.id, name: d.name, lon: +d.lon, lat: +d.lat, cat: d.cat, tags: d.tags || [], poi: d.poi !== false, city: d.city, sub: d.sub } : null;
function zoAdd(sp, src, d, tx, who) {
  if (!d || !isFinite(d.lon)) return null;
  const o = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), sp, src, lon: +d.lon, lat: +d.lat, place: d.name || '', dest: zoDest(d), tx: tx || '', who: who || '', at: Date.now() };
  const st = zoSt(); st.L.push(o); if (st.L.length > 120) st.L.splice(0, st.L.length - 120);
  return o;
}
// les espèces (de la région du lieu) qui peuvent vivre à cet endroit, pas encore adoptées
function zoLiving(d) {
  return zf2$(() => FA_SP.filter(f => zfSt(f.id) < 2 && faLives(f, Object.assign({ tags: [] }, d))), []);
}
GAME.on('trip:return', e => zf2$(() => {
  const t = e && e.trip, d = t && t.dest; if (!d || !isFinite(+d.lon)) return;
  const got = [], L = zoLiving(d);
  const h = new Date(t.startedAt || Date.now()).getHours(), night = h < 6 || h >= 21;
  if (L.length && Math.random() < 0.35) { const f = zoPick(L); zoAdd(f.id, 'vu', d, 'Une présence sentie en chemin'); got.push(`✨ une présence près de ${d.name}`); }
  if (L.length && Math.random() < 0.3) { const f = zoPick(L), tx = zoPick(ZO_TRACE[f.ter[0]] || ['Des traces']); zoAdd(f.id, 'trace', d, tx); got.push(`👣 ${tx.toLowerCase()}`); }
  if (night && L.length && Math.random() < 0.55) { const N = L.filter(f => f.cond && f.cond.night); const f = zoPick(N.length ? N : L), tx = `On a entendu ${ZO_SOUND[f.ter[0]] || 'un cri'}`; zoAdd(f.id, 'bruit', d, tx); got.push(`🔊 ${tx.toLowerCase()}`); }
  // les lieux de savoir : une espèce de la région, avec l'endroit où elle vit
  if (ZO_KNOW.includes(d.cat)) {
    const st = zoSt(), k = (d.name || '') + '|' + dayKey(); if (!st.day[k]) {
      st.day[k] = 1; const rid = zfHome(), C = zfSps(rid).filter(f => zfSt(f.id) < 2), f = zoPick(C);
      if (f) { const Lc = zfLoc(f, rid); if (Lc) { const dd = Lc.poi || { name: Lc.label, lon: Lc.lon, lat: Lc.lat, cat: Lc.cat }; zoAdd(f.id, 'savoir', dd, `${d.name} : « ${zfSt(f.id) ? f.nm : 'Cette espèce'} vit vers ${Lc.label} »`); got.push(`📚 ${d.name} vous apprend où vit une espèce`); } }
    }
  }
  if (!got.length) return;
  save(); setTimeout(() => zf2$(() => toast(`📡 Nouvelle observation : ${got[0]}${got.length > 1 ? ` (+${got.length - 1})` : ''}. Voir le radar.`)), 3800);
  setTimeout(() => zf2$(zfRefresh), 4000);
}));
// les témoignages des clients
GAME.on('order:done', e => zf2$(() => {
  if (Math.random() > 0.4) return; const c = e && e.client; if (!c) return;
  const rid = zfHome(), C = zfSps(rid).filter(f => zfSt(f.id) < 2), f = zoPick(C); if (!f) return;
  const Lc = zfLoc(f, rid); if (!Lc) return; const dd = Lc.poi || { name: Lc.label, lon: Lc.lon, lat: Lc.lat, cat: Lc.cat };
  zoAdd(f.id, 'temoin', dd, `« J’ai vu ${zfSt(f.id) ? f.art : 'une drôle de bête'} vers ${Lc.label} ! »`, c.name); save();
  setTimeout(() => zf2$(() => toast(`👁️ ${c.name} a vu un animal vers ${Lc.label} : c’est sur le radar.`)), 2600);
}));
// regrouper les observations : une forme par espèce et par coin (~1 km)
function zoGroups() {
  const G = new Map();
  for (const o of zoSt().L) {
    if (zfSt(o.sp) >= 2) continue;
    const k = o.sp + '|' + o.lon.toFixed(2) + '|' + o.lat.toFixed(2);
    let g = G.get(k); if (!g) { g = { k, sp: o.sp, lon: o.lon, lat: o.lat, obs: [] }; G.set(k, g); }
    g.obs.push(o);
  }
  return [...G.values()];
}
function zfRefresh() {
  if (typeof map === 'undefined' || !map || !mapReady || typeof maplibregl === 'undefined') return;
  const seen = new Set();
  if (zfRadar) for (const g of zoGroups()) {
    const f = zf2$(() => FA_SP.find(x => x.id === g.sp), null); if (!f) continue;
    const st = zfSt(g.sp), id = g.k; seen.add(id);
    let m = zfMk.get(id);
    if (!m) {
      const el = document.createElement('div'); el.className = 'zfm'; el.setAttribute('role', 'button'); el.tabIndex = 0;
      const hsh = zf2$(() => hashStr(id), 7); el.style.setProperty('--dx', ((hsh % 21) - 10) + 'px'); el.style.setProperty('--dy', (((hsh >> 5) % 17) - 8) + 'px'); el.style.setProperty('--dur', (2.4 + (hsh % 9) / 4) + 's'); el.style.setProperty('--del', ((hsh >> 3) % 12) / 10 + 's');
      el.addEventListener('click', ev => { ev.stopPropagation(); zfFiche(g.sp, id); });
      m = new maplibregl.Marker({ element: el, anchor: 'bottom', opacity: '1', opacityWhenCovered: '1' }).setLngLat([g.lon, g.lat]).addTo(map); zfMk.set(id, m);
    }
    // v201 : NE JAMAIS remplacer className — MapLibre y a mis « maplibregl-marker » (position absolue).
    const el = m.getElement(), srcs = [...new Set(g.obs.map(o => o.src))], key = st + '' + f.tier + srcs.join('') + g.obs.length;
    if (el.dataset.k !== key || !el.firstChild) {
      el.dataset.k = key; ['s0', 's1', 's2', 't0', 't1', 't2', 'sure'].forEach(c => el.classList.remove(c)); el.classList.add('zfm', 's' + st, 't' + f.tier); if (srcs.length >= 2 || g.obs.length >= 3) el.classList.add('sure');
      el.setAttribute('aria-label', `${st ? f.nm : 'Familier inconnu'} : ${g.obs.length} indice${g.obs.length > 1 ? 's' : ''}`);
      el.innerHTML = `<span class="zfm-c"><img src="${zfPic(g.sp, st)}" alt=""></span><span class="zfm-s">${srcs.map(x => ZO_SRC[x][0]).join('')}</span>`;
    }
  }
  for (const [id, m] of zfMk) if (!seen.has(id)) { m.remove(); zfMk.delete(id); }
  zfBtn();
}
zf2$(() => { const hook = () => zf2$(() => { map.on('moveend', zfRefresh); map.on('load', zfRefresh); }); if (typeof map !== 'undefined' && map) hook(); });
setInterval(() => zf2$(() => { if (!document.hidden) zfRefresh(); }), 4000);
GAME.on('trip:return', () => setTimeout(() => zf2$(zfRefresh), 2500));
GAME.on('comp:new', () => setTimeout(() => zf2$(zfRefresh), 800));

// ---------- la fiche d'une espèce ----------
function zfFiche(sp, gk) {
  const f = zf2$(() => FA_SP.find(x => x.id === sp), null); if (!f) return;
  const rid = zfHome(), st = zfSt(sp), L = zfLoc(f, rid), cond = zf2$(() => faCondTx(f), []);
  const g = gk ? zoGroups().find(x => x.k === gk) : null, O = (g ? g.obs : zoSt().L.filter(o => o.sp === sp)).slice(-6).reverse();
  const ago = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 60 ? `il y a ${Math.max(1, m)} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`; };
  const obsH = O.length ? `<div class="zo-l"><p class="zo-h">Vos indices${g ? ` · ${esc(g.obs[0].place || '')}` : ''}</p>${O.map(o => `<div class="zo-i"><span>${ZO_SRC[o.src][0]}</span><p><b>${esc(o.tx || ZO_SRC[o.src][1])}</b><small>${o.who ? esc(o.who) + ' · ' : ''}${esc(o.place || '')} · ${ago(o.at)}</small></p></div>`).join('')}</div>` : '<p class="zf-ez">Aucun indice pour l’instant : voyagez, écoutez la nuit, visitez un musée ou servez vos clients.</p>';
  const dest = g ? (g.obs.find(o => o.dest) || {}).dest : null;
  const km = dest ? zf2$(() => Math.round(kmBetween(homeObj(), dest)), null) : L ? zf2$(() => Math.round(kmBetween(homeObj(), L)), null) : null;
  let go = '';
  if (dest) { go = `<button class="btn green big wide" data-zogo="${esc(gk)}">Y aller${km != null ? ` · ${km} km` : ''}</button>`; }
  else if (L) { const i = zf2$(() => CF_GO.push({ step: L.step, name: st ? f.nm : 'Un familier inconnu', why: 'trouver ' + (st ? f.art : 'ce familier') }) - 1, -1); if (i >= 0) go = `<button class="btn green big wide" data-cfgo="${i}">Y aller${km != null ? ` · ${km} km` : ''}</button>`; }
  const tier = ['Commun', 'Rare', 'Légendaire'][f.tier] || '';
  showModal(`<div class="zf-f s${st}"><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    <div class="zf-fp"><img class="${st ? '' : 'sil'}" src="${zfPic(sp, st)}" alt=""></div>
    <p class="cn-k">${tier} · ${st ? 'déjà aperçu' : 'jamais vu'}</p><h2>${st ? esc(f.nm) : '? ? ?'}</h2>
    <p class="zf-cl">🔎 ${esc(zf2$(() => faClue(sp, st ? 1 : 0), f.clue[0]))}</p>
    ${cond.length ? `<ul class="zf-co">${cond.map(c => `<li>${c.includes('nuit') ? '🌙' : c.includes('appât') ? '🧺' : '🍂'} ${esc(c.charAt(0).toUpperCase() + c.slice(1))}${c.includes('appât') ? (zf2$(() => sctSt().learn[sp], 0) ? ' <small>(recette connue : Herboristerie)</small>' : ' <small>(recette dans un camp d’Augustine)</small>') : ''}</li>`).join('')}</ul>` : '<p class="zf-ez">Pas de condition : partez voyager là où il vit, il finira par se montrer.</p>'}
    ${obsH}
    <p class="zf-how">En voyage là où il vit, un œuf peut apparaître : il éclôt à la Couveuse.</p>
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
  const chip = document.getElementById('zfChip'); if (chip) { const G = zoGroups(), c2 = G.length ? `📡 ${G.length} piste${G.length > 1 ? 's' : ''}` : '📡 Aucune piste'; if (chip.innerHTML !== c2) chip.innerHTML = c2; }
  b.setAttribute('aria-label', `Radar à familiers : ${n} trouvés sur ${L.length}`);
}
function zfList() {
  const rid = zfHome(); if (!rid) return;
  const L = zfSps(rid), n = L.filter(f => zfSt(f.id) >= 2).length;
  showModal(`<div class="zf-l"><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    <p class="cn-k">Le but du jeu</p><h2>Les familiers de ${esc(RG[rid].short || RG[rid].name)}</h2>
    <p class="zf-lp">Explorez pour les trouver tous : <b>${n}/${L.length}</b> adoptés. Le radar montre vos indices : ce que vos familiers ont senti, les traces, les bruits de la nuit, ce que disent les musées et vos clients.</p>
    <div class="zf-g">${L.map(f => { const st = zfSt(f.id); return `<button class="zf-gi s${st}" data-zfsp="${f.id}"><img class="${st ? '' : 'sil'}" src="${zfPic(f.id, st)}" alt=""><b>${st ? esc(f.nm) : '? ? ?'}</b><small>${st >= 2 ? '✓ Adopté' : (n => n ? `${n} indice${n > 1 ? 's' : ''}` : st ? 'Aperçu' : ['Commun', 'Rare', 'Légendaire'][f.tier])(zoSt().L.filter(o => o.sp === f.id).length)}</small></button>`; }).join('')}</div>
    <button class="btn ${zfRadar ? 'cream' : 'green'} sm" data-zfrad="1">${zfRadar ? 'Éteindre le radar' : '📡 Allumer le radar'}</button></div>`);
}
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const z = t.closest('[data-zogo]'); if (z) { ev.stopPropagation(); const g = zoGroups().find(x => x.k === z.dataset.zogo), o = g && g.obs.find(o => o.dest); if (!o) return; const m = $('modal'); if (m) m.hidden = true; zfRadarSet(false); zf2$(() => map.flyTo({ center: [o.dest.lon, o.dest.lat], zoom: 14 })); zf2$(() => choosePOI(o.dest)); return; }
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
.zfm .zfm-c,.zfm .zfm-q,.zfm .zfm-s{animation:zffade .6s ease-out var(--del,0s) both,zfwan var(--dur,3s) ease-in-out var(--del,0s) infinite}
.zfm .zfm-c{box-shadow:0 0 0 3px rgba(120,255,230,.55),0 0 14px rgba(120,255,230,.8)!important;background:rgba(220,255,250,.9)!important}
#zfChip{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 140px);z-index:7;padding:5px 12px;min-height:34px;border-radius:999px;border:2px solid #2b8f86;background:#effffb;color:#1d5c56;font:800 13px var(--body,system-ui);box-shadow:0 2px 0 #2b8f86;white-space:nowrap}
.zf-b.on{background:#2b8f86!important;color:#fff!important}.zf-b.on small{color:#fff}
@media (prefers-reduced-motion:reduce){#zfRad .zf-sw{animation:none;opacity:.4}.zfm .zfm-c,.zfm .zfm-q,.zfm .zfm-s{animation:none}}
.zfm{width:48px;height:54px;cursor:pointer}.zfm-c{position:absolute;left:2px;top:0;width:44px;height:44px;border-radius:50%;background:#fffaf0;border:2.5px solid #4a3528;overflow:hidden;box-shadow:0 2px 0 rgba(74,53,40,.35);display:grid;place-items:center}
.zfm-c::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-5px;border:5px solid transparent;border-top-color:#4a3528}
.zfm-c img{width:54px;height:54px;object-fit:cover;margin-top:8px}.zfm.s0 .zfm-c img{filter:brightness(0);opacity:.5}.zfm.s1 .zfm-c{border-style:dashed;border-color:#7a5aa8}
.zfm.t1 .zfm-c{border-color:#3d6fb0}.zfm.t2 .zfm-c{border-color:#c98a1a;box-shadow:0 0 0 3px rgba(232,177,58,.45)}
.zfm-s{position:absolute;left:50%;transform:translateX(-50%);top:-14px;padding:0 4px;border-radius:999px;background:#effffb;border:1.5px solid #2b8f86;font-size:10px;line-height:14px;white-space:nowrap}
.zfm:not(.sure) .zfm-c{opacity:.75}.zfm.sure .zfm-c{border-width:3px}
.zo-l{margin:8px 0}.zo-h{margin:0 0 5px;font:800 12px var(--body,system-ui);letter-spacing:.3px;text-transform:uppercase;color:#7a6250}
.zo-i{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid #efe3cc}.zo-i>span{font-size:18px;line-height:1.2}.zo-i p{margin:0;display:grid}.zo-i b{font:700 13px/1.3 var(--body,system-ui);color:#4a3528}.zo-i small{font:600 11.5px var(--body,system-ui);color:#7a6250}
.zfm-q{position:absolute;right:-2px;top:-4px;min-width:16px;height:16px;border-radius:999px;background:#4a3528;color:#fff;font:800 11px/16px system-ui;text-align:center}.zfm.s1 .zfm-q{display:none}
.zf-b{flex-direction:column;gap:0;width:44px!important;height:44px!important;padding:0!important;color:#2b8f86}.zf-b small{font:800 10px/1.1 var(--body,system-ui);color:#4a3528}
.zf-f,.zf-l{position:relative;text-align:left;min-width:0;max-width:100%;overflow-wrap:anywhere}.zf-f .btn{white-space:normal;max-width:100%;height:auto;min-height:48px;line-height:1.2}.zf-f .ld-x,.zf-l .ld-x{position:absolute;right:0;top:0}
.zf-fp{width:120px;height:120px;margin:0 auto 6px;border-radius:50%;background:#fbf0dc;overflow:hidden;display:grid;place-items:center}.zf-fp img{width:140px;height:140px;object-fit:cover;margin-top:18px}.zf-fp img.sil,.zf-gi img.sil{filter:brightness(0);opacity:.45}
.zf-f h2,.zf-l h2{margin:0 0 6px;font:800 22px var(--display,inherit);color:#4a3528}.zf-cl{font:600 14px/1.4 var(--body,system-ui);color:#4a3528}
.zf-co{margin:6px 0;padding:0;list-style:none}.zf-co li{margin:0 0 4px;padding:6px 9px;border-radius:10px;background:#fff3c4;font:600 13px var(--body,system-ui);color:#5b4636}.zf-co small{color:#7a6250}
.zf-ez,.zf-how{font:600 12.5px/1.35 var(--body,system-ui);color:#7a6250}.zf-f .btn{margin-top:8px}
.zf-lp{font:600 13.5px var(--body,system-ui);color:#4a3528}.zf-g{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0 10px}
.zf-gi{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;border-radius:14px;border:2px solid #eadcc4;background:#fffaf0;font-family:inherit;color:#4a3528;min-height:44px}
.zf-gi img{width:58px;height:58px;object-fit:cover;border-radius:50%;background:#fbf0dc}.zf-gi b{font:800 12.5px var(--body,system-ui)}.zf-gi small{font:700 11px var(--body,system-ui);color:#7a6250}.zf-gi.s2{border-color:#9cc98f;background:#f3faef}.zf-gi.s2 small{color:#3f7f3a}`;
  document.head.appendChild(st);
});
window.__zf = { refresh: zfRefresh, loc: zfLoc, sps: zfSps, groups: zoGroups, obs: () => zoSt().L, trip: (d, night) => GAME.emit('trip:return', { trip: { dest: d, startedAt: night ? new Date().setHours(23) : Date.now() }, items: [] }), order: c => GAME.emit('order:done', { client: c, items: [] }), home: () => zfHome(), sp: () => zfSps(zfHome()).map(f => f.id + ':' + f.ter.join('/')) };

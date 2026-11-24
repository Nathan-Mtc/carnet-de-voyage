// ================= LE CARNET DE RÉGION ET LE GARDIEN DE LA FRONTIÈRE (v186) =================
// Le joueur : « on avance trop vite dans l'histoire, on n'a pas le temps d'explorer la région en profondeur ».
// Décidé avec lui (24/11) :
//  A. CARNET DE RÉGION : 20 tampons par région, en 6 thèmes (Explorer, Défis, Saveurs, Faune, Rencontres, Saisons).
//     Certains vont vite, d'autres demandent du temps (4 saisons). Chaque tampon rapporte des PIERRES D'ÉTOILE
//     (3, ou 6 pour les plus durs) ; un thème complet +5 ; la page entière +30 et un titre.
//  C. LE GARDIEN DE LA FRONTIÈRE : pour lancer une traversée (96), il faut EN PLUS de l'habitant, de l'équipement, des provisions
//     et du niveau : 14 tampons du carnet de la région qu'on quitte, la version PRO de l'équipement du passage, un familier
//     plus fort, et 3 matériaux ★★ de défis (dépensés au départ). Puis les 3 étapes de la traversée. Réussi : trophée + pierres.
// Tout se suit au retour des voyages (GAME 'trip:return'), à l'atelier (craft / cmStart) et au comptoir ('order:done').
const zr$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('carnet région', e); return d; } };
function zrSt() {
  if (!S.zr || typeof S.zr !== 'object') S.zr = {};
  const s = S.zr; if (!s.r) s.r = {}; if (!s.gd) s.gd = {}; return s;
}
function zrR(rid) {
  const s = zrSt(); if (!s.r[rid]) s.r[rid] = {};
  const r = s.r[rid];
  for (const k of ['pl', 'cat', 'city', 'ldf', 'seas', 'got', 'th']) if (!r[k] || typeof r[k] !== 'object') r[k] = {};
  if (!Array.isArray(r.pts)) r.pts = [];
  for (const k of ['night', 'ld2', 'use', 'serve', 'rare', 'mf']) r[k] = +r[k] || 0;
  return r;
}
const zrRegOf = (lon, lat) => zr$(() => { const R = regionAt(lon, lat); return R && R.id !== 'grand_large' ? R.id : null; }, null);
const zrKm = (a, b) => { const R = 6371, t = Math.PI / 180, dl = (b[1] - a[1]) * t, dn = (b[0] - a[0]) * t, x = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const zrFar = r => { let m = 0; for (let i = 0; i < r.pts.length; i++) for (let j = i + 1; j < r.pts.length; j++) m = Math.max(m, zrKm(r.pts[i], r.pts[j])); return Math.round(m); };
// les espèces sauvages d'une région (02_faune_dessin.js) ; à défaut, toutes
const zrSpecies = rid => zr$(() => { const L = FA_SP.filter(f => f.reg && f.reg[rid]); return L.length ? L : FA_SP; }, []);
const zrStage = sp => zr$(() => faStage(sp), 0);
const zrN = (o) => Object.keys(o || {}).length;

// ---------- les 20 tampons ----------
// [id, thème, intitulé, besoin, valeur actuelle (rid, r), difficile ?]
const ZR_TH = [['exp', '🗺️', 'Explorer'], ['def', '🔒', 'Défis'], ['sav', '🍲', 'Saveurs'], ['fau', '🐾', 'Faune'], ['ren', '🤝', 'Rencontres'], ['sai', '🍂', 'Saisons']];
const ZR_ST = [
  ['e_pl', 'exp', 'Visiter 10 lieux différents', 10, (id, r) => zrN(r.pl)],
  ['e_cat', 'exp', 'Visiter 5 sortes de lieux (boulangerie, brocante, parc…)', 5, (id, r) => zrN(r.cat)],
  ['e_city', 'exp', 'Voyager dans 3 villes ou villages différents', 3, (id, r) => zrN(r.city)],
  ['e_night', 'exp', 'Partir de nuit (entre 21 h et 6 h)', 1, (id, r) => r.night],
  ['e_far', 'exp', 'Visiter deux lieux à plus de 60 km l’un de l’autre', 60, (id, r) => zrFar(r), 1, 'km'],
  ['d_anc', 'def', 'Réussir un défi « lieu ancien »', 1, (id, r) => r.ldf.ancien || 0],
  ['d_eau', 'def', 'Réussir un défi « lieu d’eau »', 1, (id, r) => r.ldf.eau || 0],
  ['d_hau', 'def', 'Réussir un défi « lieu en hauteur »', 1, (id, r) => r.ldf.hauteur || 0],
  ['d_nat', 'def', 'Réussir un défi « lieu sauvage »', 1, (id, r) => r.ldf.nature || 0],
  ['d_2', 'def', 'Réussir 3 défis ★★ ou plus', 3, (id, r) => r.ld2, 1],
  ['s_got', 'sav', 'Rapporter une spécialité de la région', 1, id => zr$(() => RG[id].res.filter(x => rgGot(x.id)).length, 0)],
  ['s_use', 'sav', 'Fabriquer ou cuisiner avec une spécialité de la région', 1, (id, r) => r.use],
  ['s_serve', 'sav', 'Servir une spécialité de la région à un client', 1, (id, r) => r.serve],
  ['f_meet', 'fau', 'Rencontrer 2 espèces sauvages de la région', 2, id => zrSpecies(id).filter(f => zrStage(f.id) >= 1).length],
  ['f_own', 'fau', 'Adopter une espèce de la région', 1, id => zrSpecies(id).filter(f => zrStage(f.id) >= 2).length],
  ['f_rare', 'fau', 'Trouver l’espèce rare de la région', 1, id => { const L = zrSpecies(id).filter(f => f.tier >= 1); return (L.length ? L : zrSpecies(id)).filter(f => zrStage(f.id) >= 1).length ? 1 : 0; }, 1],
  ['r_rare', 'ren', 'Rapporter 3 objets rares (★★ ou mieux)', 3, (id, r) => r.rare],
  ['r_mf', 'ren', 'Vivre 5 moments forts en route', 5, (id, r) => r.mf, 1],
  ['sa_2', 'sai', 'Voyager dans la région à 2 saisons différentes', 2, (id, r) => zrN(r.seas)],
  ['sa_4', 'sai', 'Voyager dans la région aux 4 saisons', 4, (id, r) => zrN(r.seas), 1],
];
const ZR_NEED = 14; // tampons pour que le gardien accepte de vous recevoir
const zrVal = (rid, T) => zr$(() => T[4](rid, zrR(rid)), 0);
const zrDone = (rid, T) => zrVal(rid, T) >= T[3];
const zrCount = rid => ZR_ST.filter(T => zrR(rid).got[T[0]] || zrDone(rid, T)).length;

// ---------- les récompenses : des pierres d'étoile ----------
function zrCheck(rid, quiet) {
  if (!rid || !RG[rid]) return 0;
  const r = zrR(rid), news = []; let gain = 0;
  for (const T of ZR_ST) if (!r.got[T[0]] && zrDone(rid, T)) { r.got[T[0]] = Date.now(); const g = T[5] ? 6 : 3; gain += g; news.push(T); }
  for (const [th] of ZR_TH) if (!r.th[th] && ZR_ST.filter(T => T[1] === th).every(T => r.got[T[0]])) { r.th[th] = Date.now(); gain += 5; }
  if (!r.full && ZR_ST.every(T => r.got[T[0]])) { r.full = Date.now(); gain += 30; }
  if (!gain) return 0;
  zr$(() => gainStones(gain)); zr$(save);
  if (!quiet) {
    const R = RG[rid], nm = R.short || R.name;
    const msg = r.full && Date.now() - r.full < 3000 ? `📒 Carnet de ${nm} complet ! +${gain} pierres d’étoile. Vous voilà « Connaisseur de ${nm} ».`
      : news.length === 1 ? `📒 Tampon ${nm} : ${news[0][2]} (+${gain} ⭐)` : `📒 ${news.length} tampons ${nm} (+${gain} ⭐)`;
    setTimeout(() => zr$(() => toast(msg)), 2600);
  }
  return gain;
}
const zrOpenIds = () => zr$(() => { const h = rgHome().id, L = [h, ...Object.keys(rcSt().open || {})]; return [...new Set(L)].filter(id => RG[id] && id !== 'grand_large'); }, []);

// ---------- ce qu'on suit ----------
GAME.on('trip:return', e => zr$(() => {
  const t = e && e.trip, d = t && t.dest; if (!d || !isFinite(+d.lon)) return;
  const rid = zrRegOf(+d.lon, +d.lat); if (!rid) return;
  const r = zrR(rid);
  r.pl[(d.name || '') + '|' + (+d.lon).toFixed(3) + '|' + (+d.lat).toFixed(3)] = 1;
  if (d.cat) r.cat[d.cat] = 1;
  const city = d.city || d.name; if (city) r.city[city] = 1;
  if (r.pts.length < 60) r.pts.push([+(+d.lon).toFixed(3), +(+d.lat).toFixed(3)]);
  const h = new Date(t.startedAt || Date.now()).getHours(); if (h < 6 || h >= 21) r.night++;
  r.seas[zr$(() => season(), 'été')] = 1;
  if (t.mf && (t.mf.st === 'done' || t.mf.st === undefined || t.tvRes)) r.mf++;
  r.rare += (e.items || []).filter(it => it && (it.rarity || 0) >= 2).length;
  if (t.ld && t.ld.ok) { const D = LD_CACHE[t.ld.id]; if (D) { const lr = zrRegOf(D.p.lon, D.p.lat) || rid, R2 = zrR(lr); R2.ldf[D.fam] = (R2.ldf[D.fam] || 0) + 1; if (D.s >= 2) R2.ld2++; if (lr !== rid) zrCheck(lr); } }
  zr$(save); zrCheck(rid);
}));
// fabriquer ou cuisiner avec une spécialité régionale : on regarde quelles spécialités ont quitté le sac
const zrRidCount = () => { const m = {}; for (const it of S.inv || []) if (it && it.rid && RG_RES[it.rid]) { const g = RG_RES[it.rid].region; m[g] = (m[g] || 0) + 1; } return m; };
const zrUsed = (before) => { const after = zrRidCount(); for (const g of Object.keys(before)) if ((after[g] || 0) < before[g]) { zrR(g).use++; zrCheck(g); } };
craft = (orig => function () { const b = zrRidCount(); const res = orig.apply(this, arguments); zr$(() => zrUsed(b)); return res; })(craft);
if (typeof cmStart === 'function') cmStart = (orig => function () { const b = zrRidCount(); const res = orig.apply(this, arguments); zr$(() => zrUsed(b)); return res; })(cmStart);
GAME.on('order:done', e => zr$(() => {
  const seen = new Set();
  for (const it of (e && e.items) || []) if (it && it.rid && RG_RES[it.rid]) seen.add(RG_RES[it.rid].region);
  for (const g of seen) { zrR(g).serve++; zrCheck(g); }
}));
// les tampons « en direct » (faune, spécialités rapportées) : vérification de temps en temps
setInterval(() => zr$(() => { if (document.hidden) return; for (const id of zrOpenIds()) zrCheck(id); }), 6000);

// ---------- la page du carnet ----------
let zrCur = null;
function zrHTML(rid) {
  const ids = zrOpenIds(); if (!rid || !ids.includes(rid)) rid = zr$(() => rcFront().id, ids[0]) || ids[0];
  if (!ids.includes(rid)) rid = ids[0];
  zrCur = rid; const R = RG[rid]; if (!R) return '';
  zrCheck(rid, true);
  const r = zrR(rid), n = zrCount(rid), nm = R.short || R.name, col = R.color || '#b08a5a';
  const tabs = ids.length > 1 ? `<div class="zr-tabs">${ids.map(id => `<button class="${id === rid ? 'on' : ''}" data-zrtab="${id}">${esc(RG[id].short || RG[id].name)} <small>${zrCount(id)}/20</small></button>`).join('')}</div>` : '';
  const th = ZR_TH.map(([t, ico, tn]) => {
    const L = ZR_ST.filter(T => T[1] === t), k = L.filter(T => r.got[T[0]]).length;
    return `<h4 class="zr-th">${ico} ${esc(tn)} <small>${k}/${L.length}${r.th[t] ? ' · ✓ +5 ⭐' : ''}</small></h4><div class="zr-g">${L.map(T => {
      const ok = !!r.got[T[0]], v = zrVal(rid, T), need = T[3];
      const pr = ok ? `+${T[5] ? 6 : 3} ⭐` : T[6] === 'km' ? `${Math.min(v, need)}/${need} km` : need > 1 ? `${Math.min(v, need)}/${need}` : 'à faire';
      return `<div class="zr-s${ok ? ' ok' : ''}${T[5] ? ' hard' : ''}"><span class="zr-c">${ok ? '✓' : T[5] ? '★' : ''}</span><b>${esc(T[2])}</b><small>${pr}</small></div>`;
    }).join('')}</div>`;
  }).join('');
  const st = zr$(() => S.stones || 0, 0);
  return `<div class="zr-p" style="--zc:${col}">
    <div class="zr-h"><div><p class="cn-k">Carnet de région</p><h2>${esc(R.name)}</h2></div><button class="ld-x" data-closemodal="1" aria-label="Fermer"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="#4a3528" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>
    ${tabs}
    <div class="zr-bar"><span style="width:${Math.round(n / 20 * 100)}%"></span><i style="left:${ZR_OPEN / 20 * 100}%" title="Régions voisines"></i><i style="left:${ZR_NEED / 20 * 100}%" title="Gardien"></i></div>
    <p class="zr-sum"><b>${n}/20 tampons</b> · ⭐ ${st} pierres d’étoile${r.full ? ` · <b>Connaisseur de ${esc(nm)}</b>` : ''}</p>
    <p class="zr-gd">${n >= ZR_OPEN ? `🗺️ ${ZR_OPEN} tampons : les régions voisines s’ouvrent dès que vous êtes Habitué de ${esc(nm)}.` : `🗺️ Pour ouvrir les régions voisines : ${ZR_OPEN} tampons (encore ${ZR_OPEN - n}) et être Habitué de ${esc(nm)}.`}</p>
    <p class="zr-gd">${n >= ZR_NEED ? `👑 Le gardien de la frontière vous attend : touchez un passage de ${esc(nm)} sur la carte.` : `👑 Le gardien de la frontière ne reçoit que les vrais connaisseurs : ${ZR_NEED} tampons de ${esc(nm)} (encore ${ZR_NEED - n}).`}</p>
    ${th}
    <p class="zr-n">Chaque tampon rapporte 3 pierres d’étoile (6 pour ceux marqués ★), un thème complet +5, la page entière +30.</p>
  </div>`;
}
function zrPage(rid) { zr$(() => showModal(zrHTML(rid || zrCur))); }
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const b = t.closest('[data-zrtab],[data-zropen]'); if (!b) return;
  ev.stopPropagation(); ev.preventDefault();
  zrPage(b.dataset.zrtab || b.dataset.zropen || null);
}, true);

// ---------- dans Quêtes › Histoire, et dans l'histoire ----------
if (typeof QM_HTML !== 'undefined' && QM_HTML.hist) QM_HTML.hist = (orig => function () {
  const h = orig.apply(this, arguments);
  const ids = zrOpenIds(); if (!ids.length) return h;
  const card = `<div class="zr-q"><p class="cn-k">Carnets de région</p>${ids.map(id => { const n = zrCount(id); return `<button class="zr-qb" data-zropen="${id}"><span>📒</span><b>${esc(RG[id].short || RG[id].name)}</b><small>${n}/20 tampons${n >= ZR_NEED ? ' · 👑 gardien prêt' : ''}</small><i>›</i></button>`; }).join('')}</div>`;
  return h.replace('</div>', '</div>' + card); // juste après « Le but »
})(QM_HTML.hist);
zr$(() => { akGo.zr = () => { zr$(() => csCloseModal()); zrPage(); }; });
const zrFrontId = () => zr$(() => rcFront().id, null) || zr$(() => rgHome().id, null);
const zrStep = alt => ({ tx: () => { const id = zrFrontId(); return `Remplir le carnet de ${id ? (RG[id].short || RG[id].name) : 'votre région'}`; }, ct: () => { const id = zrFrontId(); return id ? `${Math.min(zrCount(id), ZR_NEED)}/${ZR_NEED} tampons` : ''; },
  sub: 'Explorez, relevez des défis, goûtez, rencontrez : le gardien de la frontière ne reçoit que les connaisseurs.', ok: () => { const id = zrFrontId(); return !id || zrCount(id) >= ZR_NEED || !!zr$(() => alt && alt(), false); }, go: 'zr', btn: 'Carnet' });
zr$(() => { const C = AK_CH.find(c => c.nm === 'La première frontière'); if (C && !C.steps.some(s => s.go === 'zr')) C.steps.unshift(zrStep(() => akPsDone() >= 1)); }); // une partie déjà avancée n'est pas bloquée
akLoop = (orig => function () { const C = orig.apply(this, arguments); zr$(() => { if (C && C.steps && !C.steps.some(s => s.go === 'zr')) { const last = C.steps[C.steps.length - 1]; C.steps.splice(Math.max(0, C.steps.length - 1), 0, zrStep(() => last && last.ok())); } }); return C; })(akLoop);

// ================= v187 : CHANGER DE RÉGION DEMANDE AUSSI LE CARNET =================
// Le joueur : « je parlais aussi pour changer de région ». Une région n'est plus « explorée » (et n'ouvre ses voisines)
// qu'avec : être Habitué (94, comme avant) ET 10 tampons de son carnet. Les régions déjà explorées le restent.
const ZR_OPEN = 10;
rcCheck = (orig => function (quiet) {
  const s = rcSt(), held = {};
  // on retient les régions Habituées mais pas assez tamponnées : orig ne doit pas les marquer explorées
  zr$(() => { for (const X of REGIONS) if (s.open[X.id] && !s.done[X.id] && zrCount(X.id) < ZR_OPEN) { held[X.id] = 1; s.done[X.id] = -1; } });
  try { return orig.apply(this, arguments); }
  finally { let fix = 0; for (const id of Object.keys(held)) if (s.done[id] === -1) { delete s.done[id]; fix = 1; } if (fix) zr$(save); }
})(rcCheck);
// la fiche d'une région encore fermée le dit
if (typeof fdCard === 'function') fdCard = (orig => function (id) {
  const r = orig.apply(this, arguments);
  zr$(() => {
    const el = document.querySelector('#fdC .fd-how'); if (!el || el.querySelector('.zr-fd')) return;
    const lib = psEdgesOf(id).filter(x => x[2] === 'libre').map(x => psOther(x, id)).find(o => rcIsOpen(o)) || zr$(() => rcFront().id, null); if (!lib || !RG[lib]) return;
    const n = zrCount(lib);
    el.insertAdjacentHTML('beforeend', ` <span class="zr-fd">Il faut aussi <b>${ZR_OPEN} tampons</b> du carnet de ${esc(RG[lib].short || RG[lib].name)} (vous en avez ${n}). <button class="zr-gdgo" data-zropen="${lib}">Voir le carnet</button></span>`);
  });
  return r;
})(fdCard);

// ================= C. LE GARDIEN DE LA FRONTIÈRE =================
const ZR_GD_NM = {
  'La forêt de Brocéliande': 'La fontaine de Barenton', 'Le Marais poitevin': 'La Venise verte', 'La descente du Rhône': 'Le défilé de Donzère', 'La Garonne': 'Le canal des Deux-Mers',
  'La Camargue': 'Les Saintes-Maries-de-la-Mer', 'La traversée vers la Corse': 'Le phare de la Giraglia', 'Le Rhin': 'Le rocher de la Lorelei', 'Le Jura': 'Le Crêt de la Neige',
  'Le col du Grand-Saint-Bernard': 'L’hospice du Grand-Saint-Bernard', 'Les Alpes': 'Le Mont-Blanc', 'Les Pyrénées': 'Le pic du Midi de Bigorre', 'Les Pyrénées basques': 'La Rhune',
  'La Manche': 'Le Mont-Saint-Michel', 'La Manche, depuis Saint-Malo': 'Le fort National', 'Le pas de Calais': 'Le cap Gris-Nez', 'Les bouches de Bonifacio': 'Les falaises de Bonifacio',
  'Le col du Simplon': 'L’hospice du Simplon', 'Le détroit de Gibraltar': 'Le rocher de Gibraltar', 'L’Himalaya': 'L’Everest', 'Le Sahara': 'L’oasis de Siwa', 'Le cercle polaire': 'Le cap Nord',
};
const ZR_GD_FAM = { montagne: 'hauteur', glace: 'hauteur', desert: 'hauteur', riviere: 'eau', marais: 'eau', mer: 'eau', ocean: 'eau', foret: 'nature', jungle: 'nature' };
const zrGdNm = E => ZR_GD_NM[E[3]] || `Le gardien de ${E[3] || PS_T[E[2]].nm}`;
function zrGdReq(E, k) {
  const from = psFrom(E), g = PS_T[E[2]].gear, fam = ZR_GD_FAM[E[2]] || 'hauteur', mat = LD_FAM[fam].mats[1];
  const n = zrCount(from), lv = zr$(() => psLv(E), 3) + 2, myLv = zr$(() => S.prog[k].lvl, 1);
  const pro = zr$(() => S.inv.some(it => { const G = xpGearOf(it); return G && G.g === g && G.tier >= 2 && !(typeof usWorn === 'function' && usWorn(it)); }), false);
  const nm = zr$(() => xpGName(g, 2), g), mN = zr$(() => ldMatN(mat), 0);
  const L = [
    [n >= ZR_NEED, `📒 ${ZR_NEED} tampons du carnet de ${RG[from].short || RG[from].name} · vous en avez ${n}`, 'zr'],
    [pro, `🎒 ${nm} (version pro, en état)`, ''],
    [myLv >= lv, `⭐ ${zr$(() => faNm(k), '')} niveau ${lv} · niveau ${myLv}`, ''],
    [mN >= 3, `💎 3 × ${mat} (défis ★★ « ${LD_FAM[fam].nm.toLowerCase()} », dépensés au départ) · ${mN}/3`, ''],
  ];
  return { L, ok: L.every(x => x[0]), mat, fam };
}
tvReq = (orig => function (E, k) {
  const R = orig.apply(this, arguments);
  zr$(() => {
    const cur = tvSt()[psKey(E)]; if (cur && cur.stage > 0) return; // le gardien est déjà passé : on finit la traversée
    const G = zrGdReq(E, k);
    R.html += `<div class="zr-gdb"><p class="zr-gdh">👑 Le gardien : <b>${esc(zrGdNm(E))}</b></p><ul class="ps-req">${G.L.map(([ok, tx, go]) => `<li class="${ok ? 'ok' : ''}">${esc(tx)}${!ok && go ? ` <button class="zr-gdgo" data-zropen="${psFrom(E)}">Voir le carnet</button>` : ''}</li>`).join('')}</ul></div>`;
    R.ok = R.ok && G.ok;
  });
  return R;
})(tvReq);
// au départ de la 1re étape : les matériaux ★★ sont donnés au gardien
tvGo = (orig => function (key) {
  const E = PS_EDGES.find(x => psKey(x) === key), k = S.sel, cur = zr$(() => tvSt()[key], null), st0 = cur ? cur.stage : 0;
  const G = E && st0 === 0 ? zrGdReq(E, k) : null;
  const before = S.trips && S.trips[k];
  const res = orig.apply(this, arguments);
  zr$(() => {
    if (!G || !G.ok) return; const t = S.trips && S.trips[k]; if (!t || t === before) return;
    let left = 3; for (let i = S.inv.length - 1; i >= 0 && left > 0; i--) if (S.inv[i] && S.inv[i].name === G.mat && S.inv[i].sub === 'defi') { S.inv.splice(i, 1); left--; }
    save(); toast(`👑 ${zrGdNm(E)} vous laisse passer. Trois étapes vous attendent !`);
  });
  return res;
})(tvGo);
// passage franchi : le trophée du gardien
setInterval(() => zr$(() => {
  const s = zrSt();
  for (const key of Object.keys(psSt().done || {})) {
    if (s.gd[key]) continue; s.gd[key] = Date.now();
    const E = PS_EDGES.find(x => psKey(x) === key); if (!E || E[2] === 'libre') continue;
    if (Date.now() - psSt().done[key] > 10 * 60e3) continue; // anciens passages : pas de trophée rétroactif
    const it = makeItem([`Trophée · ${zrGdNm(E)}`, 'd', 'tresor', 4, null, '#e8b13a'], 0, zrGdNm(E), ['gardien'], { fixed: 4 }); it.special = true; S.inv.push(it);
    gainStones(15); save();
    setTimeout(() => zr$(() => toast(`👑 Trophée du gardien : ${zrGdNm(E)} ! +15 pierres d’étoile`)), 4000);
  }
}), 3000);

// ---------- style ----------
zr$(() => {
  const st = document.createElement('style');
  st.textContent = `.zr-p{width:100%;text-align:left}.zr-h{display:flex;align-items:flex-start;gap:8px}.zr-h>div{flex:1}.zr-h h2{margin:0;font:800 22px/1.15 var(--display,inherit);color:#4a3528}
.zr-tabs{display:flex;gap:6px;overflow-x:auto;margin:8px 0 6px;scrollbar-width:none}.zr-tabs::-webkit-scrollbar{display:none}
.zr-tabs button{flex:none;min-height:40px;padding:5px 11px;border-radius:12px;border:2px solid #eadcc4;background:#fffaf0;font:800 13px var(--body,system-ui);color:#4a3528}.zr-tabs button.on{border-color:#4a3528;background:#fff3c4}.zr-tabs small{color:#7a6250}
.zr-bar{position:relative;height:12px;border-radius:999px;background:#efe3cc;margin:10px 0 6px;overflow:visible}.zr-bar span{display:block;height:100%;border-radius:999px;background:var(--zc,#b08a5a)}
.zr-bar i{position:absolute;top:-4px;width:3px;height:20px;border-radius:2px;background:#e8b13a}
.zr-sum{margin:0 0 4px;font:600 13px var(--body,system-ui);color:#4a3528}.zr-gd{margin:0 0 6px;padding:7px 10px;border-radius:12px;background:#fff3c4;font:600 12.5px/1.35 var(--body,system-ui);color:#6b4f20}
.zr-th{margin:12px 0 6px;font:800 15px var(--display,inherit);color:#4a3528}.zr-th small{font:700 12px var(--body,system-ui);color:#7a6250}
.zr-g{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.zr-s{position:relative;display:flex;flex-direction:column;gap:2px;padding:8px 8px 7px 40px;min-height:52px;border-radius:12px;background:#fbf3e4;border:1.5px dashed #d9c7a6}
.zr-s b{font:700 12.5px/1.25 var(--body,system-ui);color:#4a3528}.zr-s small{font:800 11.5px var(--body,system-ui);color:#7a6250}
.zr-c{position:absolute;left:7px;top:9px;width:26px;height:26px;border-radius:50%;border:2px dashed #cdb894;display:grid;place-items:center;font:800 13px/1 system-ui;color:#c8a85a}
.zr-s.ok{background:#fffaf0;border:1.5px solid var(--zc,#b08a5a)}.zr-s.ok .zr-c{border:2px solid var(--zc,#b08a5a);background:var(--zc,#b08a5a);color:#fff;transform:rotate(-12deg)}.zr-s.ok small{color:#3f7f3a}
.zr-n{margin:12px 0 0;font:600 12px var(--body,system-ui);color:#7a6250}
.zr-q{margin:10px 0}.zr-qb{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:0 0 6px;padding:8px 10px;border-radius:14px;border:2px solid #eadcc4;background:#fffaf0;text-align:left;color:#4a3528;font-family:inherit}
.zr-qb span{font-size:20px}.zr-qb b{font:800 14px var(--display,inherit)}.zr-qb small{flex:1;text-align:right;font:700 12px var(--body,system-ui);color:#7a6250}.zr-qb i{font-style:normal;font-weight:800}
.zr-gdb{margin:8px 0 4px;padding:8px;border-radius:14px;background:#fff3c4;border:2px solid #e8b13a}.zr-gdh{margin:0 0 6px;font:700 13.5px var(--body,system-ui);color:#4a3528;text-align:left}
.zr-gdgo{margin-left:6px;padding:3px 9px;min-height:30px;border-radius:9px;border:1.5px solid #7a3a30;background:#fffaf0;font:800 11.5px var(--body,system-ui);color:#7a3a30}
.psg .psg-b::after{content:'👑';position:absolute;top:-13px;right:-9px;font-size:14px}`;
  document.head.appendChild(st);
});
window.__zr = { st: zrSt, count: zrCount, check: zrCheck, page: zrPage, gd: (key, k) => zrGdReq(PS_EDGES.find(x => psKey(x) === key), k || S.sel), ST: ZR_ST };

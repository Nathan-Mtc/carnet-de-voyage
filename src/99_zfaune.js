// ================= FAUNE (v161) : terrains, rencontres, carnet naturaliste =================
// Demande : « développer le nombre de compagnons, les hybrides… sans alourdir le joueur ».
// 1. Chaque espèce a UN terrain (les hybrides en ont deux) parmi 10. Sur son terrain, le compagnon est meilleur,
//    d'autant plus que l'espèce est rare : trajet plus court, brume levée plus loin, choix risqués plus sûrs, passages plus faciles.
//    La fiche de départ dit simplement « X est chez lui ici », ou propose le bon compagnon. Pas de talents à retenir.
// 2. Rencontres : une espèce vit dans de vraies régions et un vrai milieu ; les rares demandent en plus un moment
//    (la nuit, une saison) OU un appât ; les légendaires demandent tout. Les traces trouvées en voyage font avancer l'enquête.
// 3. Compédium = carnet naturaliste par région (« Faune des Alpes 2/4 ») : silhouette + indice, puis nom + 2e indice, puis fiche.
//    Compléter une faune donne un vrai cadeau (un œuf aux couleurs rares de cette faune et une planche à exposer).
// Données et dessins : 02_faune_dessin.js (FA_SP, FA, FA_OLD, FA_TER).
const fa$ = (f, d) => { try { return f(); } catch (e) { console.error('faune', e); return d; } };
function faSt() { if (!S.fa || typeof S.fa !== 'object') S.fa = {}; const s = S.fa; if (!s.tr) s.tr = {}; if (!s.grp) s.grp = {}; return s; }

// ---------- 1. inscrire les nouvelles espèces dans les tables du jeu ----------
const FA_HAB = { montagne: 'banquise', neige: 'banquise', mer: 'bassin', riviere: 'bassin', marais: 'bassin', foret: 'bambou', campagne: 'bambou', ville: 'bambou', desert: 'dune', jungle: 'jungle' };
const FA_TIERW = [1, 0.55, 0.32];
fa$(() => {
  for (const f of FA_SP) {
    if (!SP_IDS.includes(f.id)) SP_IDS.push(f.id);
    if (!SP_INFO[f.id]) SP_INFO[f.id] = faInfo(f);
    const reg = Object.fromEntries(Object.entries(f.reg).map(([r, w]) => [r, +(w * FA_TIERW[f.tier]).toFixed(2)]));
    const tags = { montagne: { montagne: 1 }, mer: { mer: 1, ile: 0.6 }, riviere: { lac: 1 }, foret: { foret: 1 }, campagne: { campagne: 1 }, ville: { ville: 1 }, marais: { lac: 0.8, campagne: 0.4 } }[f.ter[0]] || {};
    NS_SP[f.id] = { reg, tags, zf: f.zf };
    NS_BAITS[f.id] = { subs: {}, names: { [f.bait[0]]: 1.6 } };
    NS_PLURAL[f.id] = f.pl;
    NS_BAIT_HINT[f.id] = `« ${f.bait[0]} », à préparer à l’Herboristerie du foyer`;
    fa$(() => { SX_SP_NM[f.id] = f.pl; });
    fa$(() => { FLAG_COL[f.id] = f.col; VY_COL[f.id] = f.col; ST_TINT[f.id] = f.tint; ST_TINT2[f.id] = f.col; });
    fa$(() => { MK_SP_BASE[f.id] = [110, 170, 260][f.tier]; });
    fa$(() => { PG_SP_POW[f.id] = ['flair', 'endu', 'etoile'][f.tier]; });
    fa$(() => { CP_DEX[f.id] = f.dex; });
    const H = NS_HABS.find(h => h.id === FA_HAB[f.ter[0]]); if (H && H.sps && !H.sps.includes(f.id)) H.sps.push(f.id);
    // l'appât : une recette de l'Herboristerie (apprise dans un camp d'Augustine, ou en trouvant ses traces)
    if (!HB_BAITS.some(b => b[0] === f.id)) HB_BAITS.push([f.id, f.bait[0], f.bait[1], f.bait[2]]);
    HB_SP[f.bait[0]] = f.id;
    let R = RECIPES.find(r => r.id === 'hb_' + f.id);
    if (!R) { R = { id: 'hb_' + f.id, kind: 'Herboristerie', out: [f.bait[0], 'n', 'appat', 1, null, f.bait[2]], ing: f.bait[1], coins: 0, sp: f.id }; RECIPES.push(R); }
    AUG_HB[f.id] = R;
  }
  augSyncHB();
});
// les camps d'Augustine apprennent d'abord l'appât des espèces rares qui en ont besoin
// (les légendaires, on les découvre en enquêtant : leurs traces donnent la recette)
augSpFor = (orig => function (id) {
  const s = sctSt(), L = FA_SP.filter(f => f.tier === 1 && f.cond && f.cond.bait && f.reg[id] && !s.learn[f.id]);
  if (L.length) return { sp: L.sort((a, b) => b.reg[id] - a.reg[id])[0].id, where: id };
  return orig.apply(this, arguments);
})(augSpFor);

// ---------- 2. terrains ----------
const FA_JUNGLE = ['amerique_sud', 'asie_sud_est', 'afrique_ouest', 'ocean_indien', 'mexique_caraibes', 'pacifique'];
const FA_CAT = {
  plage: 'mer', port: 'mer', phare: 'mer', poissonnerie: 'mer', riviere: 'riviere', etang: 'riviere', foret: 'foret', parc: 'foret', sentier: 'foret', belvedere: 'montagne',
  ferme: 'campagne', verger: 'campagne', jardin: 'campagne', campagne: 'campagne', route: 'campagne', camping: 'campagne', zoo: 'campagne',
};
const FA_TAG = { montagne: 'montagne', neige: 'neige', lac: 'riviere', mer: 'mer', ile: 'mer', foret: 'foret', ville: 'ville', monument: 'ville', desert: 'desert', campagne: 'campagne' };
function faTerrOf(p) {
  if (!p) return [];
  const T = new Set(), tags = p.tags || [], cat = p.cat;
  tags.forEach(t => { if (FA_TAG[t]) T.add(FA_TAG[t]); });
  if (cat) T.add(FA_CAT[cat] || 'ville');
  if (cat === 'etang') T.add('marais');
  if (cat === 'belvedere' || cat === 'sentier') { const R = fa$(() => regionAt(p.lon, p.lat), null); if (R && ['suisse'].includes(R.id)) T.add('montagne'); }
  const R = fa$(() => regionAt(p.lon, p.lat), null), Z = fa$(() => rgZoneAt(p.lon, p.lat), null);
  if (Z && (Z.id === 'alpes' || Z.id === 'alpes_sud') && (cat === 'sentier' || cat === 'belvedere' || cat === 'camping')) T.add('montagne');
  // la Camargue (delta du Rhône) : marais
  if (+p.lat < 43.75 && +p.lat > 43.3 && +p.lon > 4.1 && +p.lon < 4.95 && (T.has('campagne') || T.has('riviere') || T.has('mer'))) T.add('marais');
  if (R && FA_JUNGLE.includes(R.id) && T.has('foret')) T.add('jungle');
  if (!T.size) T.add('campagne');
  return [...T];
}
const faSpTer = sp => (FA[sp] || FA_OLD[sp] || {}).ter || [];
const faSpTier = sp => (FA[sp] || FA_OLD[sp] || {}).tier || 0;
function faCompTer(k) {
  const c = S.comps && S.comps[k]; if (!c) return { ter: [], tier: 0, sps: [] };
  const sps = c.hybrid && c.hybrid.b ? [c.hybrid.a || c.sp, c.hybrid.b] : [c.sp];
  return { ter: [...new Set(sps.flatMap(faSpTer))], tier: Math.max(...sps.map(faSpTier)), sps };
}
function faMatch(k, place) {
  if (!k || !place || place.tuto) return null;
  const C = faCompTer(k); if (!C.ter.length) return null;
  const T = faTerrOf(place), t = C.ter.find(x => T.includes(x));
  return t ? { ter: t, tier: C.tier } : null;
}
const FA_B = { time: [0.15, 0.25, 0.35], fog: [1.3, 1.6, 2], risk: [0.10, 0.15, 0.25], tv: [1, 2, 3] };
const faBonusTx = M => `trajet −${Math.round(FA_B.time[M.tier] * 100)} %, brume levée ×${String(FA_B.fog[M.tier]).replace('.', ',')}, choix risqués +${Math.round(FA_B.risk[M.tier] * 100)} %`;
const faChez = k => `chez ${fa$(() => compE(k), '') ? 'elle' : 'lui'}`;
const faNm = k => fa$(() => CHARS[k].name, 'Votre compagnon');

// trajet plus court (même calcul que les camps et la connaissance de la région)
augRoadMs = (orig => function (d) {
  const A = orig.apply(this, arguments);
  fa$(() => { const M = faMatch(S.sel, d); if (!M) return; const b = FA_B.time[M.tier]; A.fa = b; A.road = Math.max(60e3, Math.round(A.road * (1 - b) / 5e3) * 5e3); });
  return A;
})(augRoadMs);
// au départ : brume, nuit (pour les rencontres)
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  fa$(() => {
    const t = S.trips[k]; if (!t || t === before || t.tuto) return;
    t.faNight = isNight() ? 1 : 0;
    const M = faMatch(k, t.dest); if (M) { t.faM = M; t.faRk = FA_B.fog[M.tier]; }
    save();
  });
  return r;
})(startTrip);
// choix risqués : le terrain remplace l'ancienne « affinité » (pas de doublon)
sxBonus = (k, kind) => fa$(() => { const t = S.trips[k], M = t && (t.faM || faMatch(k, t.dest)); return M ? FA_B.risk[M.tier] : 0; }, 0);
sxBonusTx = (k, kind) => fa$(() => { const t = S.trips[k], M = t && (t.faM || faMatch(k, t.dest)); return M ? `${FA_TER[M.ter][0]} ${faNm(k)} est ${faChez(k)} ${FA_TER[M.ter][2]} : +${Math.round(FA_B.risk[M.tier] * 100)} % de réussite.` : ''; }, '');
// passages : niveau requis plus bas sur un terrain familier
const FA_PS = { montagne: 'montagne', riviere: 'riviere', marais: 'marais', foret: 'foret', mer: 'mer', ocean: 'mer', desert: 'desert', glace: 'neige', jungle: 'jungle' };
tvLvBonus = (k, E) => { const t = FA_PS[E[2]]; return t && faCompTer(k).ter.includes(t) ? FA_B.tv[faCompTer(k).tier] : 0; };

// ---------- 3. rencontres : région + milieu + moment + appât ----------
let FA_CTX = null, FA_BAIT = null;
function faCondOk(f) {
  const c = f.cond || {};
  const night = FA_CTX ? FA_CTX.night : isNight(), sea = FA_CTX ? FA_CTX.season : season();
  if (c.night && !night) return false;
  if (c.season && !c.season.includes(sea)) return false;
  if (c.bait && !(FA_CTX ? FA_CTX.bait : FA_BAIT || []).includes(f.id)) return false;
  return true;
}
// lieu + milieu (sans les conditions)
function faLives(f, place) {
  const R = nsRegionOf(place); if (!R || !f.reg[R.id]) return false;
  const zf = f.zf && f.zf[R.id]; if (zf) { const Z = fa$(() => rgZoneAt(place.lon, place.lat), null); if (!Z || !zf.includes(Z.id)) return false; }
  const T = faTerrOf(place); return f.ter.some(t => T.includes(t));
}
nsSpOk = (orig => function (sp, place) {
  const f = FA[sp]; if (!f) return orig.apply(this, arguments);
  if (!place || !nsState().found) return false; // le tout premier œuf reste celui d'Augustine
  return faLives(f, place) && faCondOk(f);
})(nsSpOk);
nsScores = (orig => function (place, baitSps) {
  const keep = FA_BAIT; FA_BAIT = baitSps || [];
  try { return orig.apply(this, arguments); } finally { FA_BAIT = keep; }
})(nsScores);
nsTripEgg = (orig => function (e) {
  const t = e && e.trip, keep = FA_CTX;
  FA_CTX = { night: !!(t && t.faNight) || isNight(), season: season(), bait: (t && t.bait && t.bait.sps) || [] };
  try { return orig.apply(this, arguments); } finally { FA_CTX = keep; }
})(nsTripEgg);
// traces : l'espèce vit ici mais il manquait le moment ou l'appât → l'enquête avance (et l'appât est appris)
function faTraces(t) {
  if (!t || !t.dest || t.tuto) return null;
  if (fa$(() => akSt().ch, 9) < 5) return null; // pas de pistes avant d'avoir adopté son premier compagnon sauvage (chapitre 4)
  const N = nsState(), s = faSt();
  FA_CTX = { night: !!t.faNight || isNight(), season: season(), bait: (t.bait && t.bait.sps) || [] };
  try {
    const L = FA_SP.filter(f => f.cond && !N.own[f.id] && !s.tr[f.id] && faLives(f, t.dest) && !faCondOk(f));
    if (!L.length || Math.random() > 0.6) return null;
    const f = L[0]; s.tr[f.id] = Date.now(); N.seen[f.id] = 1;
    let learned = false;
    if (f.cond.bait) { const A = sctSt(); if (!A.learn[f.id]) { A.learn[f.id] = 1; augSyncHB(); learned = true; } }
    return { f, learned };
  } finally { FA_CTX = null; }
}
function faCondTx(f) {
  const c = f.cond || {}, out = [];
  if (c.night) out.push('ne sort que la nuit (départ entre 21 h et 6 h)');
  if (c.season) out.push(`seulement ${c.season.length > 1 ? 'en ' + c.season.slice(0, -1).join(', ') + ' et en ' + c.season.slice(-1) : 'en ' + c.season[0]}`.replace('en été', 'l’été').replace('en automne', 'à l’automne').replace('en hiver', 'l’hiver').replace('en printemps', 'au printemps'));
  if (c.bait) out.push(`il faut l’appât « ${f.bait[0]} »`);
  return out;
}
GAME.on('trip:return', e => fa$(() => {
  const X = faTraces(e && e.trip); if (!X) return;
  save();
  const f = X.f, html = `<div class="nsfind fatr"><span class="fatri">🐾</span><div><span class="nsfk">Des traces !</span><b>Celles ${/^[aeéiouhy]/i.test(f.nm) ? 'd’' : 'de '}${esc(f.nm.toLowerCase())}</b><span>${esc(faCap(faCondTx(f).join(' ; ')))}.${X.learned ? ' Augustine avait noté la recette : elle est à l’Herboristerie.' : ''} <small>Carnet naturaliste mis à jour.</small></span></div></div>`;
  const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox');
  if (box && box.querySelector('.haul')) { const btn = box.querySelector('button[data-closemodal]'); if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
  else toast(`🐾 Des traces de ${f.nm.toLowerCase()} ! Le carnet naturaliste a une nouvelle piste.`);
}));
const faCap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

// ---------- 4. fiche de départ : « chez lui ici », ou le bon compagnon ----------
function faTipHTML(d) {
  const k = S.sel, M = faMatch(k, d);
  if (M) return `<div class="fa-tip ok">${FA_TER[M.ter][0]} <span><b>${esc(faNm(k))} est ${faChez(k)} ici</b> : ${faBonusTx(M)}.</span></div>`;
  const best = teamIds().filter(x => x !== k && !S.trips[x]).map(x => ({ x, M: faMatch(x, d) })).filter(o => o.M).sort((a, b) => b.M.tier - a.M.tier)[0];
  if (!best) return '';
  return `<div class="fa-tip">${FA_TER[best.M.ter][0]} <span>${esc(faCap(FA_TER[best.M.ter][1].toLowerCase()))} : <b>${esc(faNm(best.x))}</b> y serait ${faChez(best.x)} (${faBonusTx(best.M)}).</span><button class="btn sm" data-fasel="${best.x}">Prendre ${esc(faNm(best.x))}</button></div>`;
}
trjDecorate = (orig => function (box) {
  const r = orig.apply(this, arguments);
  fa$(() => {
    if (!box) return;
    const old = box.querySelector('.fa-tip');
    if (S.trips[S.sel] || !plan.dest || plan.dest.tuto) { if (old) old.remove(); return; }
    const h = faTipHTML(plan.dest); if (!h) { if (old) old.remove(); return; }
    if (old) { if (old.outerHTML !== h) old.outerHTML = h; return; }
    const a = box.querySelector('.sct-tip') || box.querySelector('.trjline') || box.querySelector('.dhead, .poihead'); if (a) a.insertAdjacentHTML('afterend', h);
  });
  return r;
})(trjDecorate);

// ---------- 5. le carnet naturaliste ----------
const FA_GRP = [
  { id: 'france', nm: 'Faune de France', sub: 'Partout, près de chez vous', sps: ['pigeon', 'ecureuil', 'renardroux', 'herisson', 'chat', 'hibou'] },
  { id: 'eaux', nm: 'Rivières et étangs', sub: 'Au bord de l’eau douce', sps: ['loutre', 'martin'] },
  { id: 'alpes', nm: 'Faune des Alpes', sub: 'Savoie, Isère, Alpes du Sud, Suisse', sps: ['marmotte', 'chamois', 'bouquetin', 'lynx'] },
  { id: 'sud', nm: 'Pyrénées et Corse', sub: 'Les montagnes du Sud', sps: ['isard', 'mouflon'] },
  { id: 'cotes', nm: 'Côtes et falaises', sub: 'Bretagne, Manche, Atlantique', sps: ['goeland', 'macareux', 'phoque'] },
  { id: 'marais', nm: 'Marais et campagnes', sub: 'Camargue et Alsace', sps: ['flamant', 'taureau', 'cigogne'] },
  { id: 'nord', nm: 'Grand Nord', sub: 'Banquise et forêts boréales', sps: ['renard'] },
  { id: 'asie', nm: 'Faune d’Asie', sub: 'Chine, Japon, Corée', sps: ['panda', 'tanuki'] },
  { id: 'ameriques', nm: 'Faune des Amériques', sub: 'Du Mexique à l’Amazonie', sps: ['capy', 'axo', 'paresseux'] },
  { id: 'afrique', nm: 'Afrique et océan Indien', sub: 'Déserts et îles', sps: ['fennec', 'lemur'] },
  { id: 'oceanie', nm: 'Faune d’Océanie', sub: 'Australie et Pacifique', sps: ['quokka'] },
];
let faSel = null, faOpenGrp = null;
const faStage = sp => { const N = nsState(); return N.own[sp] ? 2 : (N.seen[sp] || faSt().tr[sp]) ? 1 : 0; };
const faGrpDone = G => G.sps.every(sp => nsState().own[sp]);
function faRegList(sp) {
  const d = NS_SP[sp] || {}, f = FA[sp];
  const zn = id => { const z = f && f.zf && f.zf[id]; return z ? z.map(x => RG_ZONES[x] ? RG_ZONES[x].n : x).join(', ') : null; };
  return Object.entries(d.reg || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => zn(id) || (RG[id] ? RG[id].short : id)).join(', ');
}
function faClue(sp, i) {
  const f = FA[sp]; if (f) return f.clue[i];
  const t = FA_TER[faSpTer(sp)[0]] || FA_TER.campagne;
  return i === 0 ? `Il vit ${t[2]}, loin d’ici… quelque part ${faRegList(sp).split(',')[0] ? 'du côté de ' + faRegList(sp).split(',')[0] : 'dans le monde'}.` : `On le trouve ${t[2]} : ${faRegList(sp)}.`;
}
function faCard(sp) {
  const st = faStage(sp), on = faSel === sp, src = fa$(() => nsPortrait(sp, null, null, st === 2 ? 'content' : 'curieux'), '');
  const f = FA[sp], tier = faSpTier(sp), t = FA_TER[faSpTer(sp)[0]];
  return `<button class="fa-c st${st} t${tier}${on ? ' on' : ''}" data-fasp="${sp}" style="--tint:${spTint(sp)}"><span class="fa-ci"><img src="${src}" alt=""></span><b>${st ? esc(spName(sp)) : '? ? ?'}</b><small>${t ? t[0] : ''} ${st === 2 ? 'Adopté' : st === 1 ? 'Sur la piste' : FA_TIER[tier]}</small>${f && f.cond && st < 2 ? `<i class="fa-cd">${f.cond.night ? '🌙' : ''}${f.cond.season ? '🍂' : ''}${f.cond.bait ? '🧺' : ''}</i>` : ''}</button>`;
}
function faFiche(sp) {
  const st = faStage(sp), f = FA[sp], tier = faSpTier(sp), ter = faSpTer(sp), N = nsState();
  const T = FA_TER[ter[0]] || FA_TER.campagne, M = { ter: ter[0], tier };
  let art;
  if (st === 2) art = fa$(() => drawChar(nsLook(sp, null, null), NO_OUTFIT, 'rire', 'fafi'), '');
  else art = `<img class="${st ? 'faseen' : 'sil'}" src="${fa$(() => nsPortrait(sp, null, null, 'curieux'), '')}" alt="">`;
  const pals = (SPECIES[sp] || {}).palettes || [], got = pals.filter(P => N.pals[sp + ':' + P.id]).length;
  const cond = f ? faCondTx(f) : [], D = CP_DEX[sp];
  let h = `<article class="fa-f st${st}" id="faFiche" style="--tint:${spTint(sp)}"><button class="cpfclose" data-fasp="" aria-label="Fermer">×</button>`;
  h += `<div class="fa-fa">${art}</div><div class="fa-fb"><span class="fa-fk">${FA_TIER[tier]} · ${T[0]} ${esc(T[1])}</span><h3>${st ? esc(spName(sp)) : '? ? ?'}</h3>`;
  if (st === 0) h += `<p class="fa-clue">🔎 ${esc(faClue(sp, 0))}</p>`;
  else {
    h += `<p class="fa-where">📍 ${esc(faRegList(sp))}</p><p class="fa-clue">🔎 ${esc(faClue(sp, 1))}</p>`;
    if (cond.length && st < 2) h += `<ul class="fa-cond">${cond.map(c => `<li>${c.includes('nuit') ? '🌙' : c.includes('appât') ? '🧺' : '🍂'} ${esc(faCap(c))}${c.includes('appât') ? (sctSt().learn[sp] ? ' <small>(recette connue)</small>' : ' <small>(recette inconnue : un camp d’Augustine dans la région vous l’apprendra)</small>') : ''}</li>`).join('')}</ul>`;
  }
  if (st === 2) {
    if (D && D[2]) h += `<p class="fa-bio">${esc(D[2])}</p>`;
    h += `<div class="fa-bon"><b>${T[0]} Chez ${f && f.fem ? 'elle' : 'lui'} ${esc(T[2])}</b><span>${faBonusTx(M)}, passages ${FA_B.tv[tier]} niveau${FA_B.tv[tier] > 1 ? 'x' : ''} plus tôt</span></div>`;
    h += `<p class="fa-pal">🎨 Couleurs trouvées : ${got}/${pals.length}</p>`;
  }
  return h + `</div></article>`;
}
function faRender(box) {
  const N = nsState(), s = faSt(), own = SP_IDS.filter(sp => N.own[sp]).length, hy = Object.values(N.hyb), npal = nsPalCount();
  const ready = nsTierReady();
  let h = `<div class="fa">`;
  h += `<div class="fa-hd"><div><h2>Carnet naturaliste</h2><p>Chaque faune vit dans de vrais endroits. Suivez les indices, trouvez les traces, adoptez-les tous.</p></div><div class="fa-st"><span><b>${own}</b>/${SP_IDS.length}<small>espèces</small></span><span><b>${npal}</b><small>couleurs</small></span><span><b>${hy.length}</b><small>hybrides</small></span></div></div>`;
  if (ready.length) h += `<div class="fa-tiers">${ready.map(t => `<button class="btn gold sm" data-ns-tier="${t.id}">🎁 ${esc(t.txt)} : ${esc(t.rw)}</button>`).join('')}</div>`;
  if (faSel && SP_IDS.includes(faSel)) h += faFiche(faSel);
  for (const G of FA_GRP) {
    const n = G.sps.filter(sp => N.own[sp]).length, done = n === G.sps.length, claimed = s.grp[G.id];
    const open = faOpenGrp === G.id || G.sps.includes(faSel) || (faOpenGrp == null && G.id === 'france');
    h += `<section class="fa-g${done ? ' done' : ''}${open ? ' open' : ''}"><button class="fa-gh" data-fagrp="${G.id}"><span><b>${esc(G.nm)}</b><small>${esc(G.sub)}</small></span><i class="fa-gn">${n}/${G.sps.length}</i></button>`;
    if (open) {
      h += `<div class="fa-gg">${G.sps.map(faCard).join('')}</div>`;
      h += done && !claimed ? `<button class="btn gold wide" data-faclaim="${G.id}">🎁 Faune complète : recevoir l’œuf rare et la planche</button>` : claimed ? `<p class="fa-gok">✓ Planche « ${esc(G.nm)} » reçue</p>` : `<p class="fa-grw">🎁 Complétez cette faune : un œuf aux couleurs rares et une planche naturaliste à exposer.</p>`;
    }
    h += `</section>`;
  }
  h += `<section class="fa-g open"><div class="fa-gh"><span><b>Les hybrides</b><small>Deux terrains à la fois</small></span><i class="fa-gn">${hy.length}</i></div>`;
  h += hy.length ? `<div class="fa-hy">${hy.map(x => `<span class="fa-hc"><img src="${fa$(() => nsPortrait(x.a, x.genes, { a: x.a, b: x.b, t: x.t }), '')}" alt=""><b>${esc(spName(x.a))} × ${esc(spName(x.b))}</b><small>${faSpTer(x.a).concat(faSpTer(x.b)).filter((v, i, a) => a.indexOf(v) === i).map(t => FA_TER[t][0]).join(' ')}</small></span>`).join('')}</div>` : `<p class="nsempty">Aucun hybride pour l’instant : l’enclos de la nurserie croise deux compagnons. Un hybride est chez lui sur les deux terrains de ses parents.</p>`;
  h += `</section></div>`;
  box.innerHTML = h;
}
function faClaim(id) {
  const G = FA_GRP.find(g => g.id === id), s = faSt(); if (!G || s.grp[id] || !faGrpDone(G)) return;
  s.grp[id] = Date.now();
  fa$(() => nsGiftEgg('quete', `Carnet naturaliste : ${G.nm}`, { sp: pick(G.sps), luck: 4 }));
  fa$(() => { const it = makeItem([`Planche naturaliste : ${G.nm}`, 'd', 'herbier', 3, null, '#8fbf6a'], 0, 'Carnet naturaliste', [], { fixed: 3 }); S.inv.push(it); S.dex[it.name] = true; });
  save(); renderAll();
  toast(`🎁 ${G.nm} complète ! Un œuf aux couleurs rares est à la nurserie, et la planche est dans votre sac.`);
  fa$(() => confetti(false));
}
nsRenderCompedium = (orig => function (box) { try { return faRender(box); } catch (e) { console.error('carnet naturaliste', e); return orig.apply(this, arguments); } })(nsRenderCompedium);
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-fasp],[data-fagrp],[data-faclaim],[data-fasel]'); if (!el) return;
  const d = el.dataset;
  if (d.fasel != null) { ev.preventDefault(); fa$(() => selectComp(d.fasel)); return; }
  if (d.faclaim) { faClaim(d.faclaim); return; }
  if (d.fagrp) { faOpenGrp = faOpenGrp === d.fagrp ? '' : d.fagrp; faSel = null; renderPanel(); return; }
  if (d.fasp != null) { faSel = d.fasp && faSel !== d.fasp ? d.fasp : null; renderPanel(); if (faSel) setTimeout(() => fa$(() => { const f = $('faFiche'); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }), 30); }
});
// le palier « Les 10 espèces » garde son sens avec plus d'espèces
fa$(() => { const t = NS_TIERS.find(x => x.id === 't7'); if (t) t.txt = '10 espèces adoptées'; });

(function faStyle() {
  const st = document.createElement('style'); st.id = 'faStyle';
  st.textContent = `.fa-tip{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:6px 0;padding:7px 10px;border-radius:12px;background:#f3f7e8;border:1px dashed #9cbf86;font-size:12.5px;line-height:1.35;color:var(--ink,#4a3528)}
.fa-tip.ok{background:#e6f5df;border-style:solid}.fa-tip span{flex:1;min-width:180px}.fa-tip .btn{flex:none}
.fa{padding-bottom:10px}.fa-hd{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;justify-content:space-between;margin-bottom:8px}.fa-hd h2{margin:0;font-family:Caveat,Fredoka,sans-serif;font-size:30px}.fa-hd p{margin:2px 0 0;font-size:12.5px;color:var(--muted,#7b6a5c);max-width:420px}
.fa-st{display:flex;gap:6px}.fa-st span{background:#fffaf0;border:2px solid var(--line,#e7dccb);border-radius:12px;padding:3px 9px;text-align:center;font-size:12px}.fa-st b{font-size:16px}.fa-st small{display:block;color:var(--muted,#7b6a5c);font-size:10.5px}
.fa-tiers{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.fa-g{background:#fffdf6;border:2px solid var(--line,#e7dccb);border-radius:16px;margin:8px 0;overflow:hidden;background-image:repeating-linear-gradient(0deg,transparent 0 23px,rgba(140,170,200,.13) 23px 24px)}
.fa-g.done{border-color:#8fbf6a}.fa-gh{all:unset;box-sizing:border-box;display:flex;width:100%;align-items:center;gap:8px;padding:9px 12px;cursor:pointer}.fa-gh span{flex:1;display:flex;flex-direction:column}.fa-gh b{font-family:Caveat,Fredoka,sans-serif;font-size:22px;line-height:1}.fa-gh small{font-size:11.5px;color:var(--muted,#7b6a5c)}
.fa-gn{font-style:normal;font-weight:700;background:#fff3c4;border:2px solid var(--ink,#4a3528);border-radius:999px;padding:1px 9px;font-size:13px}.fa-g.done .fa-gn{background:#cfeab8}
.fa-gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;padding:0 10px 8px}
.fa-c{all:unset;box-sizing:border-box;position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 4px;border-radius:14px;background:var(--tint,#fff3dc);border:2px solid transparent;cursor:pointer;text-align:center}
.fa-c.on{border-color:var(--ink,#4a3528)}.fa-c.t1{box-shadow:inset 0 0 0 2px #a8d0f0}.fa-c.t2{box-shadow:inset 0 0 0 2px #f2c14e}
.fa-ci img{width:64px;height:70px;object-fit:contain;display:block}.fa-c.st0 .fa-ci img{filter:brightness(0) opacity(.28)}.fa-c.st1 .fa-ci img{filter:grayscale(1) opacity(.65)}
.fa-c b{font-size:12px;line-height:1.1}.fa-c small{font-size:10.5px;color:var(--muted,#7b6a5c)}.fa-cd{position:absolute;top:3px;right:5px;font-style:normal;font-size:11px}
.fa-grw,.fa-gok{margin:0 10px 10px;font-size:12px;color:var(--muted,#7b6a5c)}.fa-gok{color:#3f7f3a;font-weight:600}.fa-g>.btn.wide{display:block;width:calc(100% - 20px);margin:0 10px 10px}
.fa-f{position:relative;display:flex;flex-wrap:wrap;gap:10px;background:var(--tint,#fff3dc);border:2px solid var(--ink,#4a3528);border-radius:18px;padding:10px;margin:8px 0}
.fa-fa{flex:0 0 120px;display:flex;align-items:center;justify-content:center}.fa-fa svg,.fa-fa img{width:120px;height:132px}.fa-fa img.sil{filter:brightness(0) opacity(.3)}.fa-fa img.faseen{filter:grayscale(1) opacity(.7)}
.fa-fb{flex:1;min-width:190px}.fa-fk{font-size:11px;font-weight:700;color:var(--muted,#7b6a5c);text-transform:uppercase;letter-spacing:.3px}.fa-fb h3{margin:1px 0 4px;color:var(--ink,#4a3528);font-family:Caveat,Fredoka,sans-serif;font-size:26px}
.fa-clue{font-family:Caveat,Fredoka,sans-serif;font-size:17.5px;line-height:1.15;color:var(--ink,#4a3528);margin:4px 0}.fa-where,.fa-bio,.fa-pal{font-size:12.5px;margin:4px 0}
.fa-cond{list-style:none;padding:0;margin:6px 0;font-size:12.5px}.fa-cond li{margin:3px 0}.fa-cond small{color:var(--muted,#7b6a5c)}
.fa-bon{background:#e6f5df;border-radius:12px;padding:6px 9px;font-size:12px;display:flex;flex-direction:column;gap:2px;margin:6px 0}
.fa-hy{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;padding:0 10px 10px}.fa-hc{display:flex;flex-direction:column;align-items:center;text-align:center;font-size:11px}.fa-hc img{width:64px;height:70px}
.nsfind.fatr .fatri{font-size:30px;flex:none;width:46px;text-align:center}`;
  document.head.appendChild(st);
})();
window.__fa = { ter: p => faTerrOf(p), match: (k, p) => faMatch(k, p), traces: t => faTraces(t), st: () => faSt(), claim: id => faClaim(id), grp: FA_GRP };

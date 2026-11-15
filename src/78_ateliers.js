// ================= 78 · LES ATELIERS DU FOYER (v59) =================
// Le joueur : « on ne comprend pas qui est prêt, qui fait quoi ; il faut refaire le foyer : il doit servir à préparer
// les expéditions et à créer des équipements (forge, plantation, éclosion…) ; attention aux doublons avec Compagnons ;
// on supprime tout simplement la fatigue ; refais d'un coup, même style 3D ».
// • Chaque pièce est un ATELIER (façon planque de Tarkov) : on lance une fabrication, elle prend du temps et continue
//   pendant les voyages, puis on vient la récupérer. Recettes = celles du jeu (RECIPES) rangées par atelier :
//   Forge = matériel d'expédition, Couture = vêtements, Cuisine = plats (appâts, nourrir), Herboristerie = appâts par
//   espèce (nouvelles recettes), Salon = décorations. On ne fait que FABRIQUER ici : on équipe et on nourrit dans
//   l'onglet Compagnons (pas de doublon).
// • Niveaux : Forge = construction « Atelier agrandi », Cuisine = « Coin repas », Couture et Herboristerie ont les leurs.
//   Niveau : +25 % de vitesse ; dès le niveau 2, deux fabrications à la fois. Un familier ARTISAN (poste) : +50 %.
//   L'équipe de voyage ne travaille jamais (74 : hmWorkHTML).
// • Fatigue et énergie supprimées : plus aucun effet (f3Nrg neutre) ni affichage.
// État : S.hm.st[atelier] = [{ rid, t0, ms, m: chef-d'œuvre }], S.hm.lv[atelier] = niveau (Couture, Herboristerie).
// ---------------- postes d'artisans (40_foyer.js) ----------------
try { [['cuis', 'Cuisinier', 'cuisine', '#fff0dc', ''], ['herbo', 'Herboriste', 'prépare', '#e6f3e2', ''], ['forge', 'Forgeron', 'forge', '#f3e0d0', ''], ['couture', 'Couturier', 'coud', '#f6e6f0', '']].forEach(j => { FW_J[j[0]] = j; }); } catch (e) { console.error('postes', e); }
// ---------------- fatigue supprimée ----------------
if (typeof f3Nrg === 'function') f3Nrg = () => ({ b: 0, ch: 0, n: 100 });
if (typeof fyC === 'function') fyC = (orig => function () { const c = orig.apply(this, arguments); if (c) c.nrg = 100; return c; })(fyC);
if (typeof f3GoHTML === 'function') f3GoHTML = (orig => function () { return String(orig.apply(this, arguments)).replace(/<span[^>]*><b>Énergie[\s\S]*?<\/span>/, ''); })(f3GoHTML);
// ---------------- herboristerie : un appât par espèce ----------------
Object.assign(ING, { hb_fruit: [['fruit', 'pomme', 'agrume'], 'Fruit'], hb_veg: [['legume'], 'Légume'], hb_mer: [['mer'], 'Produit de la mer'], hb_from: [['fromage'], 'Fromage'], hb_pain: [['pain'], 'Pain'], hb_sucre: [['sucre'], 'Sucré'], hb_boi: [['boisson'], 'Boisson'] });
const HB_BAITS = [
  ['panda', 'Boulettes de bambou', [['hb_veg', 2], ['feuille', 1]], '#7fbf6a'], ['capy', 'Bouquet d’agrumes', [['hb_fruit', 2], ['feuille', 1]], '#f2a33a'],
  ['axo', 'Pâtée aux crevettes', [['hb_mer', 1], ['feuille', 1]], '#f08a9a'], ['renard', 'Croquettes fromagères', [['hb_from', 1], ['hb_pain', 1]], '#f2c14e'],
  ['fennec', 'Barre aux dattes', [['hb_sucre', 2]], '#b07a4a'], ['tanuki', 'Thé aux galettes', [['hb_boi', 1], ['hb_pain', 1]], '#7fae4f'],
  ['paresseux', 'Salade d’hibiscus', [['hb_veg', 1], ['feuille', 2]], '#e5587f'], ['lemur', 'Brochette de fruits', [['hb_fruit', 2], ['hb_sucre', 1]], '#e5584f'],
  ['phoque', 'Filet de hareng', [['hb_mer', 2]], '#8fb3c9'], ['quokka', 'Feuillage tendre', [['feuille', 2], ['hb_fruit', 1]], '#8fd07a'],
];
try {
  HB_BAITS.forEach(([sp, nm, ing, col]) => {
    if (!RECIPES.some(r => r.id === 'hb_' + sp)) RECIPES.push({ id: 'hb_' + sp, kind: 'Herboristerie', out: [nm, 'n', 'appat', 1, null, col], ing, coins: 0, sp });
    if (NS_BAITS[sp]) NS_BAITS[sp].names[nm] = 1.6;
    if (typeof NS_BAIT_HINT !== 'undefined' && NS_BAIT_HINT[sp] && !NS_BAIT_HINT[sp].includes(nm)) NS_BAIT_HINT[sp] += ` ; ou « ${nm} » de l’Herboristerie du foyer`;
  });
} catch (e) { console.error('herboristerie', e); }
// v60 : seuls les appâts de l'Herboristerie attirent les animaux (la nourriture ordinaire ne sert plus d'appât)
const HB_SP = {}; HB_BAITS.forEach(([sp, nm]) => { HB_SP[nm] = sp; });
if (typeof nsBaitPower === 'function') nsBaitPower = function (it, sp) { if (!it || it.sub !== 'appat') return 0; return HB_SP[String(it.name || '').replace(/ \(chef-d’œuvre\)$/, '')] === sp ? 1.6 : 0; };
try { HB_BAITS.forEach(([sp, nm]) => { if (NS_BAIT_HINT[sp] != null) NS_BAIT_HINT[sp] = `« ${nm} », à préparer à l’Herboristerie du foyer`; }); } catch (e) {}
// ---------------- niveaux, vitesse, places ----------------
const AT_UP = { couture: [300, 900, 2000], herbo: [250, 800, 1800] };
function atS() { const H = hmS(); if (!H.st || typeof H.st !== 'object') H.st = {}; if (!H.lv || typeof H.lv !== 'object') H.lv = {}; return H; }
function atLvl(id) { if (id === 'forge') return hm$(() => pgLvl('atelier'), 0); if (id === 'cuisine') return hm$(() => pgLvl('repas'), 0); if (id === 'salon') return 1; return atS().lv[id] | 0; }
const atSlots = id => atLvl(id) >= 2 || (id === 'couture' && agBest(hmR('couture')).g >= 2) ? 2 : 1;
const atWorkers = R => R.j ? hm$(() => fwWho(R.j).filter(k => !teamIds().includes(k)).length, 0) : 0;
const atSpeed = R => (1 + .25 * atLvl(R.id)) / (1 - AG_SPD[agBest(R).g] * (atWorkers(R) ? 1 : 0));
const AT_MIN = [6, 15, 30, 60, 120];
const atMs = (r, R) => Math.round(AT_MIN[Math.max(0, Math.min(4, r.out[3] | 0))] * 60e3 / atSpeed(R));
const atQ = id => { const H = atS(); if (!Array.isArray(H.st[id])) H.st[id] = []; return H.st[id]; };
const atOwned = r => { try { return !(BQ_RIDS.has(r.id) && !bqRecOwned(r.id)); } catch (e) { return true; } };
const atRecipes = R => RECIPES.filter(r => r.kind === R.st && atOwned(r));
const atTime = ms => { const m = Math.max(1, Math.ceil(ms / 60e3)); return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') : ''}` : `${m} min`; };
// ---------------- lancer, récupérer ----------------
function atStart(R, rid, quiet, t0) {
  const r = RECIPES.find(x => x.id === rid), q = atQ(R.id); if (!r || !canCraft(r) || q.length >= atSlots(R.id)) return false;
  const H = atS(); if (!H.last || typeof H.last !== 'object') H.last = {}; H.last[R.id] = rid;
  const used = [];
  for (const [key, n] of r.ing) { const c = S.inv.filter(i => ingIt(key, i)).sort((a, b) => (a.rid ? 1 : 0) - (b.rid ? 1 : 0) || a.rarity - b.rarity); c.slice(0, n).forEach(x => { used.push(x); S.inv.splice(S.inv.indexOf(x), 1); }); }
  S.coins -= r.coins || 0;
  if (R.id === 'herbo' && used.length && agRoll(R)) { const x = used[0]; S.inv.push(x); hm$(() => toast(`${agWho(R)} a économisé un ingrédient : « ${x.name} » reste dans le sac.`), 0); }
  q.push({ rid, t0: t0 || Date.now(), ms: atMs(r, R), m: Math.random() < 0.12 + hm$(() => lvlLuck(S.sel), 0) * 0.2 || (R.id === 'forge' && agRoll(R)) ? 1 : 0 });
  save(); hm$(() => renderTop(), 0); if (!quiet) hm$(() => toast(`${r.out[0]} : c’est parti ! Prêt dans ${atTime(atMs(r, R))}.`), 0);
  return true;
}
function atCollect(R, i, quiet) {
  const q = atQ(R.id), j = q[i]; if (!j || Date.now() - j.t0 < j.ms) return null;
  const r = RECIPES.find(x => x.id === j.rid); q.splice(i, 1); if (!r) { save(); return null; }
  const it = makeItem(r.out, 0, `Fabriqué à la ${R.nm}`, [], { fixed: Math.min(4, (r.out[3] | 0) + (j.m ? 1 : 0)) });
  if (j.m) it.name += ' (chef-d’œuvre)';
  S.inv.push(it); S.dex[r.out[0]] = true; S.stats.crafted = (S.stats.crafted || 0) + 1; hm$(() => bump('craft'), 0);
  if (R.id === 'cuisine' && agRoll(R)) { const it2 = makeItem(r.out, 0, `Fabriqué à la ${R.nm}`, [], { fixed: r.out[3] | 0 }); S.inv.push(it2); hm$(() => setTimeout(() => toast(`${agWho(R)} en a fait une part de plus : 2 × « ${r.out[0]} » !`), 1600), 0); }
  agGain(R); save();
  if (!quiet) hm$(() => toast(j.m ? `Un chef-d’œuvre ! « ${it.name} » rejoint votre sac.` : `« ${it.name} » rejoint votre sac.`), 0);
  return it;
}
// ---------------- l'artisan : il range ce qui est prêt et relance tout seul la dernière recette, même jeu fermé ----------------
function atAuto() { return false; // v62 : retiré (« il va vider le stock ») ; les bonus d'artisan sont à choisir par le joueur
  let any = false;
  try {
    const H = atS(); if (!H.log || typeof H.log !== 'object') H.log = {};
    HM_ROOMS.filter(R => R.st && R.j && atWorkers(R) > 0).forEach(R => {
      const q = atQ(R.id), last = H.last && H.last[R.id], now = Date.now();
      for (let n = 0; n < 60; n++) {
        let bi = -1, be = Infinity; q.forEach((j, i) => { const e = j.t0 + j.ms; if (e <= now && e < be) { be = e; bi = i; } }); if (bi < 0) break;
        const it = atCollect(R, bi, true); if (it) { (H.log[R.id] = H.log[R.id] || []).push(it.name); any = true; }
        if (last && !atStart(R, last, true, be)) break;
      }
      if (last && !q.length && atStart(R, last, true)) any = true;
    });
    if (any) save();
  } catch (e) { console.error('artisan', e); }
  return any;
}
function atLogHTML(R) {
  const H = atS(), L = H.log && H.log[R.id]; if (!L || !L.length) return '';
  const c = {}; L.forEach(n => { c[n] = (c[n] || 0) + 1; }); H.log[R.id] = []; save();
  const who = hm$(() => fwWho(R.j).filter(k => !teamIds().includes(k)).map(k => CHARS[k].name).join(' et '), 'Votre artisan');
  return `<div class="atl-log">🧺 <b>${esc(who)}</b> a rangé dans votre sac : ${Object.entries(c).map(([n, k]) => `${k} × ${esc(n)}`).join(', ')}</div>`;
}
// ---------------- l'artisan progresse : grades de plus en plus longs à atteindre ----------------
const AG_N = ['Apprenti', 'Compagnon', 'Artisan', 'Maître', 'Grand maître'], AG_AT = [0, 20, 60, 150, 400];
const AG_SPD = [.1, .2, .3, .4, .5], AG_CH = [.03, .05, .08, .12, .16];
const AG_FX = { jardin: 'déniche une graine rare en récoltant', cuisine: 'fait une part de plus (2 plats au lieu d’un)', herbo: 'économise un ingrédient', forge: 'réussit un chef-d’œuvre (version plus rare)', couture: null, nurserie: 'fait naître un bébé plus rare (une étoile de plus)' };
const AG_TIT = { jardin: 'jardinier', cuisine: 'cuisinier', herbo: 'herboriste', forge: 'forgeron', couture: 'couturier', nurserie: 'gardien' };
function agXP(k, room) { const H = hmS(); if (!H.ax || typeof H.ax !== 'object') H.ax = {}; return ((H.ax[k] || {})[room]) | 0; }
function agGrade(n) { let g = 0; while (g < 4 && n >= AG_AT[g + 1]) g++; return g; }
function agOf(k, room) { const n = agXP(k, room), g = agGrade(n), a = AG_AT[g], b = AG_AT[g + 1]; return { n, g, f: b ? (n - a) / (b - a) : 1, next: b }; }
const agTeam = () => hm$(() => teamIds(), []);
const agWorkers = R => R && R.j ? hm$(() => fwWho(R.j).filter(k => !agTeam().includes(k)), []) : [];
function agBest(R) { let best = { g: -1, k: null }; agWorkers(R).forEach(k => { const g = agOf(k, R.id).g; if (g > best.g) best = { g, k }; }); if (best.g < 0) best.g = 0; return best; }
const agWho = R => { const b = agBest(R); return b.k ? CHARS[b.k].name : 'Votre artisan'; };
const agRoll = R => agWorkers(R).length > 0 && Math.random() < AG_CH[agBest(R).g];
function agGain(R) {
  const H = hmS(); if (!H.ax || typeof H.ax !== 'object') H.ax = {};
  agWorkers(R).forEach(k => { const o = H.ax[k] = H.ax[k] || {}, g0 = agGrade(o[R.id] | 0); o[R.id] = (o[R.id] | 0) + 1; const g1 = agGrade(o[R.id]); if (g1 > g0) hm$(() => setTimeout(() => toast(`${CHARS[k].name} devient ${AG_N[g1]} ${AG_TIT[R.id] || ''} !`), 2600), 0); });
}
// le potager : chaque récolte fait progresser le jardinier, qui déniche parfois une graine rare
if (typeof famHarvest === 'function') famHarvest = (orig => function () {
  const r = orig.apply(this, arguments);
  try { if (r) { const R = hmR('jardin'); if (agRoll(R)) { const rare = FAM_SEEDS.filter(x => x[2] >= 15), s = rare[Math.floor(Math.random() * rare.length)]; if (s) { famPush(famMk([s[0], 'm', 'graine', 2, null, '#c9a36b'], 'Jardin du foyer', [], 2)); hm$(() => toast(`${agWho(R)} a déniché une graine rare : « ${s[0]} » !`), 0); } } agGain(R); save(); } } catch (e) { console.error('jardinier', e); }
  return r;
})(famHarvest);
// la couveuse : chaque éclosion fait progresser le gardien, qui fait parfois naître un bébé plus rare
if (typeof addComp === 'function') addComp = (orig => function (o = {}) {
  try { const R = hmR('nurserie'), how = typeof o.from === 'string' ? o.from : (o.from && o.from.how) || 'oeuf'; if (how === 'oeuf' && agWorkers(R).length) { if (agRoll(R)) { o = Object.assign({}, o, { rarity: Math.min(4, (typeof o.rarity === 'number' ? o.rarity : hm$(() => geneRarityOf(o.genes || defaultGenes(o.sp), o.sp), 1)) + 1) }); hm$(() => setTimeout(() => toast(`${agWho(R)} a veillé sur l’œuf : le bébé est plus rare !`), 2000), 0); } agGain(R); } } catch (e) {}
  return orig.call(this, o);
})(addComp);
// la petite jauge sous chaque artisan, et l'encadré qui explique
function agBar(k, room) { const A = agOf(k, room); return `<span class="ag"><i style="width:${Math.round(A.f * 100)}%"></i></span><small class="ag-t">${AG_N[A.g]}${A.next ? ` · ${A.n}/${A.next}` : ''}</small>`; }
function agBoxHTML(R) {
  const SPD = g => R.st ? `${Math.round(AG_SPD[g] * 100)} % plus vite` : R.id === 'jardin' ? 'le potager pousse plus vite' : 'les œufs éclosent plus vite';
  const w = agWorkers(R); if (!w.length) return `<div class="ag-box"><b>Pourquoi un artisan ?</b> Avec lui, ${R.st ? `l’atelier va ${Math.round(AG_SPD[0] * 100)} % plus vite` : SPD(0)}${AG_FX[R.id] ? `, et a une petite chance qu’il ${AG_FX[R.id]}` : R.id === 'couture' ? ' et, une fois Artisan, coud deux vêtements à la fois' : ''}. Plus il travaille ici, plus il monte en grade et meilleur il devient.</div>`;
  const b = agBest(R), k = b.k, A = agOf(k, R.id), g = A.g, nx = g < 4 ? g + 1 : null;
  const fx = AG_FX[R.id] ? `${Math.round(AG_CH[g] * 100)} % de chance qu’il ${AG_FX[R.id]}` : g >= 2 ? 'coud deux vêtements à la fois' : 'deux vêtements à la fois au grade Artisan';
  return `<div class="ag-box"><b>${esc(CHARS[k].name)}, ${AG_N[g]} ${AG_TIT[R.id] || ''}</b> · ${A.n} ${R.id === 'jardin' ? 'récolte' : R.id === 'nurserie' ? 'éclosion' : 'fabrication'}${A.n > 1 ? 's' : ''}<br>Maintenant : ${SPD(g)} · ${fx}.${nx ? `<br><span>Grade ${AG_N[nx]} à ${AG_AT[nx]} : ${R.st ? `${Math.round(AG_SPD[nx] * 100)} % plus vite` : ''}${R.st && AG_FX[R.id] ? ' · ' : ''}${AG_FX[R.id] ? `${Math.round(AG_CH[nx] * 100)} % de chance` : ''}.</span>` : ''}</div>`;
}
if (typeof hmWorkHTML === 'function') hmWorkHTML = (orig => function (R) {
  let h = orig.apply(this, arguments);
  try {
    if (!R || !R.j || R.j === 'comm') return h;
    const T = document.createElement('template'); T.innerHTML = h;
    T.content.querySelectorAll('.hm-wk[data-fk]').forEach(b => { const k = b.dataset.fk, sm = b.querySelector('small'); if (sm) sm.insertAdjacentHTML('beforebegin', agBar(k, R.id)); });
    const wl = T.content.querySelector('.hm-wl'); if (wl) wl.remove();
    const who = T.content.querySelector('.hm-who'); if (who) who.insertAdjacentHTML('beforebegin', agBoxHTML(R));
    const d = document.createElement('div'); d.appendChild(T.content.cloneNode(true)); h = d.innerHTML;
  } catch (e) { console.error('artisan', e); }
  return h;
})(hmWorkHTML);
// ---------------- l'écran de l'atelier ----------------
const atIcon = r => hm$(() => itemIcon({ name: r.out[0], cat: r.out[1], sub: r.out[2], rarity: r.out[3], look: r.out[4], color: r.out[5] }), '');
hmStationHTML = R => {
  atAuto(); const log = atLogHTML(R);
  const q = atQ(R.id), slots = atSlots(R.id), now = Date.now(), full = q.length >= slots, noArt = !!R.j && !agWorkers(R).length; // v63 : pas d'artisan, pas de fabrication
  let h = `<section class="atl">${log}<h3 class="hm-h">En fabrication <small>${q.length}/${slots}</small></h3><div class="atl-q">`;
  q.forEach((j, i) => { const r = RECIPES.find(x => x.id === j.rid); if (!r) return; const f = Math.min(1, (now - j.t0) / j.ms), done = f >= 1;
    h += `<div class="atl-j${done ? ' done' : ''}"><span class="atl-i">${atIcon(r)}</span><b>${esc(r.out[0])}</b>${done ? `<button class="btn green sm" data-stget="${i}">Récupérer</button>` : `<span class="atl-bar"><i data-stbar="${j.t0},${j.ms}" style="width:${Math.round(f * 100)}%"></i></span><small data-stleft="${j.t0},${j.ms}">encore ${atTime(j.ms - (now - j.t0))}</small>`}</div>`; });
  for (let i = q.length; i < slots; i++) h += `<div class="atl-j free"><span class="atl-i">＋</span><b>Place libre</b><small>${noArt ? 'Il faut d’abord un artisan ↑' : 'Choisissez une recette ci-dessous'}</small></div>`;
  if (slots < 2 && R.id !== 'salon') h += `<p class="hm-tip">Au niveau 2, l’atelier fabrique deux choses à la fois.</p>`;
  h += `</div>`;
  const L = atRecipes(R).map(r => [r, canCraft(r)]).sort((a, b) => b[1] - a[1]);
  h += `<h3 class="hm-h">Recettes <small>${L.filter(x => x[1]).length} possibles</small></h3><div class="atl-g">${L.map(([r, ok]) => `<div class="atl-r${ok ? ' ok' : ''}"><span class="atl-i">${atIcon(r)}</span><b>${esc(r.out[0])}</b><small>⏱ ${atTime(atMs(r, R))}${r.coins ? ` · ${r.coins} 🪙` : ''}</small>
    <span class="atl-n">${r.ing.map(([k, n]) => { const c = hm$(() => ingCount(k), 0); return `<i class="${c >= n ? 'ok' : ''}">${Math.min(c, n)}/${n} ${esc((ING[k] && ING[k][1]) || k)}</i>`; }).join('')}</span>
    ${noArt ? `<button class="btn cream sm" data-stneed="1">Fabriquer</button>` : `<button class="btn ${ok && !full ? 'green' : 'cream'} sm" data-ststart="${r.id}"${ok && !full ? '' : ' disabled'}>${full && ok ? 'Atelier occupé' : 'Fabriquer'}</button>`}</div>`).join('') || '<p class="hm-none">Pas encore de recette ici.</p>'}</div>`;
  if (R.id === 'cuisine') h += `<p class="hm-tip">Les en-cas à vendre se préparent au comptoir de la Boutique. Pour nourrir un compagnon : onglet Compagnons.</p>`;
  if (R.id === 'forge' || R.id === 'couture') h += `<p class="hm-tip">On s’équipe au départ (onglet Préparation) ou dans l’onglet Compagnons.</p>`;
  if (AT_UP[R.id]) { const l = atLvl(R.id), c = AT_UP[R.id][l]; h += `<div class="atl-up"><b>${esc(R.nm)} · niveau ${l}/3</b>${c != null ? `<small>Niveau ${l + 1} : +25 % de vitesse${l + 1 === 2 ? ', deux fabrications à la fois' : ''}</small><button class="btn ${(S.coins || 0) >= c ? 'green' : 'cream'} sm" data-stup="${R.id}"${(S.coins || 0) >= c ? '' : ' disabled'}>Améliorer · ${c} 🪙</button>` : '<small>Niveau maximum</small>'}</div>`; }
  return h + `</section>`;
};
document.addEventListener('click', ev => {
  const n = ev.target.closest && ev.target.closest('[data-stneed]'); if (!n || !n.closest('#panelBody')) return; ev.stopPropagation();
  const w = document.querySelector('#panelBody .hm-work'); if (w) { w.scrollIntoView({ block: 'center', behavior: 'smooth' }); w.classList.remove('need'); void w.offsetWidth; w.classList.add('need'); }
  hm$(() => toast('Choisissez d’abord un artisan : touchez un familier.'), 0);
}, true);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-ststart],[data-stget],[data-stup]'); if (!b || b.disabled || !b.closest('#panelBody')) return;
  ev.stopPropagation(); const R = hmR(hmRoom); if (!R) return;
  if (b.dataset.ststart) atStart(R, b.dataset.ststart);
  if (b.dataset.stget != null) atCollect(R, +b.dataset.stget);
  if (b.dataset.stup) { const id = b.dataset.stup, l = atLvl(id), c = AT_UP[id] && AT_UP[id][l]; if (c != null && (S.coins || 0) >= c) { S.coins -= c; atS().lv[id] = l + 1; save(); hm$(() => renderTop(), 0); hm$(() => toast(`${R.nm} : niveau ${l + 1} !`), 0); } }
  const p = $('panelBody'), top = p ? p.scrollTop : 0; renderPanel(); const p2 = $('panelBody'); if (p2) p2.scrollTop = top;
}, true);
// les barres avancent toutes seules ; quand une fabrication finit, l'écran se met à jour
setInterval(() => {
  try {
    const now = Date.now(); let fin = false;
    document.querySelectorAll('#panelBody [data-stbar]').forEach(e => { const [t0, ms] = e.dataset.stbar.split(',').map(Number), f = Math.min(1, (now - t0) / ms); e.style.width = Math.round(f * 100) + '%'; if (f >= 1) fin = true; });
    document.querySelectorAll('#panelBody [data-stleft]').forEach(e => { const [t0, ms] = e.dataset.stleft.split(',').map(Number); e.textContent = `encore ${atTime(ms - (now - t0))}`; });
    if (atAuto() && document.querySelector('#panelBody .atl')) fin = true;
    if (fin && !hmEdit) renderPanel();
  } catch (e) {}
}, 5000);
// ---------------- pastilles et étape du moment ----------------
if (typeof hmDot === 'function') hmDot = (orig => function (R) { if (R && R.st) { const n = atQ(R.id).filter(j => Date.now() - j.t0 >= j.ms).length; if (n) return n; } return orig.apply(this, arguments); })(hmDot);
try { const T = hm$(() => teamIds(), []), F = fwState(); T.forEach(k => { if (F.job && F.job[k] && F.job[k] !== 'repos') F.job[k] = 'repos'; }); } catch (e) {}
hmStNext = () => {
  const now = Date.now(), ST = HM_ROOMS.filter(R => R.st);
  for (const R of ST) { const j = atQ(R.id).find(x => now - x.t0 >= x.ms), r = j && RECIPES.find(x => x.id === j.rid); if (r) return { r: R.id, t: `${r.out[0]} est prêt à la ${R.nm} !`, b: 'Récupérer', ready: 1 }; }
  return null;
};
// ---------------- les ateliers en 3D (même style que 76) ----------------
Object.assign(HM_ISO, {
  forge: () => ({ s: '', g: '', blk: [[0, 0, 3.4, 1.8], [3.6, 3.6, 2, 1.4], [6.4, 0, 2.6, 1.4], [0, 4.2, 1.2, 2.4], [9.6, .6, 1.2, 1.2]], spots: [] }),
  couture: () => ({ s: '', g: '', blk: [[1.6, 1.6, 2.4, 1.4], [6, 0, 3.2, .9], [0, 5, 1, 3], [4.6, 3.8, 1.2, 1.2], [9.6, .6, 1.2, 1.2]], spots: [] }),
  herbo: () => ({ s: '', g: '', blk: [[4.3, 3.2, 1.8, 1.6], [0, 0, 4, .9], [6, 0, 3.2, 1.4], [0, 4.4, 1, 3.4], [9.6, .6, 1.2, 1.2]], spots: [] }),
});
Object.assign(H3R, {
  forge(l) {
    h3Shell('#c9b8a6', '#9a8a7a', { pat: 'wood', tiles: 1 }); h3Win('L', 7, 2.6, 2, 1.8);
    // le foyer de forge en briques, avec ses braises
    hB(0, 0, 0, 3.2, 1.6, 1.2, '#b0603c', .06); hB(.2, .2, 1.2, 2.8, 1.2, 2.2, '#a0563a', .08); hB(.8, .5, 3.4, 1.6, .9, 2.4, '#8a4a32', .06);
    hB(.6, 1.55, .5, 2, .08, .7, '#2a1a14', .02, { ns: 1 }); const coal = hB(.75, 1.2, 1.2, 1.7, .5, .12, '#ff7a30', .04, { e: '#ff5a10', ei: 1.4, ns: 1 }); const fl = hLt(1.6, 2, 1.5, '#ff8a40', 1.4, 8);
    h3Anim(t => { coal.material.emissiveIntensity = 1.2 + Math.sin(t * 7) * .25 + Math.sin(t * 13) * .15; fl.intensity = (hmNight() ? 2.2 : 1.4) * (1 + Math.sin(t * 9) * .12); });
    for (let k = 0; k < 4; k++) { const sp = h3Sprite('spark', 1.6, 1.6, 1.5, .25); h3Anim(t => { const u = (t * .7 + k / 4) % 1; sp.position.set(1.2 + k * .25 + Math.sin(u * 8) * .1, 1.4 + u * 1.6, 1.6); sp.material.opacity = 1 - u; }); }
    // soufflet, enclume, baquet d'eau
    hB(3.3, .3, .6, .9, .7, .25, '#8a5a3c', .1); hB(3.3, .3, .85, .9, .7, .08, '#5a3a28', .03);
    hB(3.9, 3.8, 0, 1, .8, .7, '#5f666d', .08); hB(3.6, 3.75, .7, 1.7, 1, .35, '#7d858c', .1, { metal: .6, rough: .35 }); hCo(5.3, 4.25, .75, .25, .5, '#7d858c', { metal: .6, rough: .35 }).rotation.z = Math.PI / 2;
    hCy(1.4, 5.6, 0, .55, .8, '#9a6a4a', { tex: 'wood' }); hCy(1.4, 5.6, .75, .5, .04, '#4f8fb0', { op: .85, rough: .05 }); [0, 1, 2].forEach(k => hB(.9, 5.1, .2 + k * .25, 1, 1, .04, '#5f666d', .01, { ns: 1 }));
    // râtelier d'outils au mur, lingots, sacs de charbon
    hB(6.4, .02, 2.2, 2.6, .08, 1.6, '#b98a5e', .03); [6.7, 7.2, 7.7, 8.2, 8.6].forEach((x, k) => { hB(x, .1, 2.4, .08, .08, 1.1, '#7a5236', .01); hB(x - .12, .08, 3.3 - (k % 2) * .2, .32, .12, .22, '#8a8f95', .03, { metal: .6, rough: .35 }); });
    hB(6.4, 0, 0, 2.6, 1.4, .9, '#c99a6a', .05); [[6.7, .3], [7.2, .4], [7.7, .3]].forEach(([x, y]) => hB(x, y, .9, .4, .25, .15, '#e0a01e', .04, { metal: .8, rough: .25 })); hB(8.3, .3, .9, .4, .25, .15, '#c0c6cc', .04, { metal: .8, rough: .25 });
    hSp(.6, 5, .45, .5, '#4a3a30', 1, .9, 1); hSp(.6, 6.1, .4, .45, '#4a3a30', 1, .9, 1);
    if (l >= 2) { hB(.03, 8, 2.4, .05, 1.6, 1.2, '#f3e6cf', .01); hB(.06, 8.2, 2.6, .03, 1.2, .8, '#7fb3e0', .01); }
    h3Plant(10.2, 1.2, .9, '#8a8f95');
  },
  couture(l) {
    h3Shell('#f4c6d8', '#e9c48e', { pat: 'flowers' }); h3Win('R', 2, 2.6, 2.4, 2.2);
    // table de couture avec sa machine
    h3Legs(1.6, 1.6, 2.4, 1.4, .85, '#b98a5e', .06); hB(1.6, 1.6, .85, 2.4, 1.4, .1, '#c99a6a', .04);
    hB(2.2, 1.8, .95, 1.2, .6, .35, '#f6f1e7', .1); hB(2.25, 1.9, 1.3, .3, .4, .55, '#f6f1e7', .08); hB(2.25, 1.9, 1.75, 1.1, .4, .25, '#f6f1e7', .1); hB(3.2, 1.95, 1.4, .12, .3, .35, '#e5587f', .03);
    const needle = hCy(2.4, 2.1, 1.25, .02, .3, '#c9c2b8', { metal: .7, rough: .3 }); h3Anim(t => { needle.position.y = 1.2 + Math.abs(Math.sin(t * 9)) * .12; });
    hCy(3.3, 2.05, 1.85, .1, .2, '#7fb3e0'); hB(1.8, 2.2, .96, .6, .5, .03, '#f7a8bd', .01);
    // mannequin avec une veste
    hCy(5.2, 4.2, 0, .35, .06, '#8a6448'); hCy(5.2, 4.2, 0, .04, 1.2, '#8a6448'); hSp(5.2, 4.2, 1.7, .45, '#e0685a', 1, 1.25, .8); hSp(5.2, 4.2, 2.35, .14, '#c9b8a6');
    [1.5, 1.8].forEach(z => hSp(5.2, 4.55, z, .045, '#f2c14e'));
    // étagère de rouleaux de tissu
    hB(6, 0, 0, 3.2, .8, 2.6, '#c99a6a', .04); [[.5, ['#e0685a', '#7fb3e0', '#f2c14e', '#9fd08a']], [1.35, ['#c9a0dc', '#f7a8bd', '#fffaf0', '#7fc38a']], [2.2, ['#6fa8dc', '#f2a58c', '#e5587f', '#b98a5e']]].forEach(([z, cs]) => { hB(6.05, .05, z - .05, 3.1, .7, .05, '#b98a5e', .01); cs.forEach((c, k) => { const r = hCy(6.4 + k * .75, .45, z, .3, .7, c, { tex: 'fabric' }); r.rotation.x = Math.PI / 2; r.position.y = z + .3; }); });
    // corbeilles de laine
    [[1.2, 5.2, '#f2c14e'], [1.2, 6.4, '#7fb3e0']].forEach(([x, y, c]) => { hCy(x - .6, y, 0, .45, .45, '#d9a86a', { rt: .5, tex: 'wood' }); [[-.15, 0], [.15, .1], [0, -.18]].forEach(([dx, dy], k) => hSp(x - .6 + dx, y + dy, .55, .18, k ? h3Shade(c, -.1 * k) : c, 1, 1, 1, { tex: 'fabric' })); });
    hCy(4.4, 7.4, 0, 2, .03, '#f7c8dd', { ns: 1, seg: 40, tex: 'fabric' });
    if (l >= 2) { hB(.03, 2, 2.6, .05, 2, 1.4, '#fffaf0', .02); hB(.06, 2.2, 2.8, .03, 1.6, 1, '#cfe3f5', .01); }
    h3Plant(10.2, 1.2, .9, '#f7a8bd');
  },
  herbo(l) {
    h3Shell('#b7d8a8', '#c9a37a', { pat: 'wood' }); h3Win('L', 5, 2.6, 2.2, 2);
    // le chaudron qui bouillonne
    hCy(5.2, 4, 0, .75, .2, '#3b3b3b'); [[-.5, 0], [.5, .2], [0, -.5]].forEach(([dx, dy]) => hB(5.2 + dx - .08, 4 + dy - .08, 0, .16, .16, .5, '#5a5a5a', .03)); hSp(5.2, 4, .95, .75, '#3b3b3b', 1, .75, 1, { metal: .4, rough: .5 });
    const brew = hCy(5.2, 4, 1.35, .6, .05, '#7fd07a', { e: '#5fd06a', ei: .6, ns: 1 }); hLt(5.2, 4, 1.8, '#9fffa0', .6, 5); hTo(5.2, 4, 1.38, .62, .06, '#3b3b3b');
    for (let k = 0; k < 4; k++) { const b = hSp(5.2, 4, 1.45, .08, '#a9f0a0', 1, 1, 1, { op: .8, ns: 1 }); h3Anim(t => { const u = (t * .8 + k / 4) % 1; b.position.set(5.2 + Math.cos(k * 1.7) * .3, 1.45 + u * .9, 4 + Math.sin(k * 1.7) * .3); b.scale.setScalar(1 + u); b.material.opacity = .8 * (1 - u); }); }
    h3Anim(t => { brew.material.emissiveIntensity = .5 + Math.sin(t * 3) * .15; });
    // étagères de bocaux
    hB(0, 0, 0, 4, .8, .9, '#c99a6a', .05); hB(0, 0, 2.6, 4, .55, .1, '#b98a5e', .02); hB(0, 0, 3.6, 4, .55, .1, '#b98a5e', .02);
    ['#e0685a', '#f2c14e', '#7fc38a', '#c9a0dc', '#6fa8dc', '#f7a8bd'].forEach((c, k) => { hCy(.4 + k * .6, .3, 2.7, .18, .45, '#e8f4f8', { op: .45, rough: .05 }); hCy(.4 + k * .6, .3, 2.72, .15, .3, c); hCy(.4 + k * .6, .3, 3.15, .14, .07, '#b98a5e'); hCy(.6 + k * .55, .3, 3.7, .13 + (k % 2) * .04, .35, ['#7fc38a', '#e0a01e', '#c9a0dc'][k % 3], { op: .8 }); });
    hCy(1, .4, .9, .25, .25, '#9a8a7a', { rt: .3 }); hCy(1, .4, 1.1, .05, .35, '#7a6a5a');
    // herbes qui sèchent au plafond
    for (let k = 0; k < 6; k++) { const g = new THREE.Group(); g.position.set(6.4 + (k % 3) * .9, 5.3, .5 + Math.floor(k / 3) * .6); H3P.add(g); const P = H3P; H3P = g; hCy(0, 0, -.5, .01, .5, '#7a5236'); [0, 1, 2, 3].forEach(m => hSp(Math.cos(m * 1.6) * .08, Math.sin(m * 1.6) * .08, -.75 - m * .05, .1, ['#7fbf6a', '#9b86d6', '#c9d4a6'][k % 3], .7, 1.6, .7)); H3P = P; h3Anim(t => { g.rotation.z = Math.sin(t * 1.2 + k) * .06; }); }
    hB(6, 0, 0, 3.2, 1.4, .95, '#c99a6a', .05); [[6.4, .5], [7.3, .6], [8.2, .4]].forEach(([x, y], k) => h3Plant(x + .2, y + .2, .55, ['#d98a5f', '#7fb3e0', '#f7a8bd'][k], .95));
    if (l >= 2) { hB(.03, 1.5, 2.5, .05, 2.2, 1.5, '#f3e6cf', .01); [2, 2.6, 3.2].forEach((y, k) => hSp(.08, y, 3.2, .14, ['#7fbf6a', '#e5587f', '#9b86d6'][k], .3, 1, 1)); }
    h3Plant(10.2, 1.2, 1.1);
  },
});
{
  const st = document.createElement('style');
  st.textContent = `.atl{margin:8px 0}.atl-q{display:flex;flex-direction:column;gap:6px}
.atl-j{display:grid;grid-template-columns:40px 1fr auto;grid-template-rows:auto auto;gap:2px 10px;align-items:center;padding:8px 10px;border:2px solid var(--line,#eadfce);border-radius:14px;background:#fff}
.atl-j.done{border-color:#9fd08a;background:#f3faef}.atl-j.free{border-style:dashed;background:#fffaf2;opacity:.8}.atl-j .atl-i{grid-row:span 2}.atl-j b{font-size:13px;color:var(--ink,#4a3528)}.atl-j .btn{grid-row:span 2}
.atl-j small{font-size:11.5px;color:#9a8470}.atl-bar{grid-column:2;height:8px;border-radius:9px;background:#eee4d6;overflow:hidden}.atl-bar i{display:block;height:100%;background:linear-gradient(90deg,#f2c14e,#e0a01e);transition:width .6s}
.atl-i{display:flex;align-items:center;justify-content:center;width:40px;height:40px;font-size:22px;color:#c9b8a6}.atl-i svg{width:40px;height:40px}
.atl-g{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.atl-r{display:grid;grid-template-columns:40px 1fr;gap:0 8px;align-items:center;padding:8px;border:2px solid var(--line,#eadfce);border-radius:14px;background:#fffdf8;opacity:.78}.atl-r.ok{opacity:1;border-color:#9fd08a;background:#f6fbf3}
.atl-r .atl-i{grid-row:span 2}.atl-r b{font-size:12.5px;line-height:1.15;color:var(--ink,#4a3528)}.atl-r small{font-size:11px;color:#9a8470}
.atl-n{grid-column:span 2;display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}.atl-n i{font-style:normal;font-size:10.5px;padding:1px 6px;border-radius:8px;background:#f7efe3;color:#a8927c}.atl-n i.ok{background:#e6f5e2;color:#2f7f4c;font-weight:700}
.atl-r .btn{grid-column:span 2;margin-top:6px;width:100%}
.ag{display:block;width:58px;height:4px;margin:3px 0 1px;border-radius:4px;background:#efe6d8;overflow:hidden}.ag i{display:block;height:100%;background:#c9a35a;border-radius:4px}.ag-t{font-size:10px!important;color:#a8927c!important;letter-spacing:.01em}
.ag-box{margin:0 0 8px;padding:8px 11px;border-radius:12px;background:#fbf6ec;border:1.5px solid #efe2c8;font-size:12px;line-height:1.45;color:#7a6250}.ag-box b{color:var(--ink,#4a3528)}.ag-box span{color:#a8927c}
.hm-work.need{animation:agNeed 1.2s ease 2}@keyframes agNeed{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 4px #f2c14e;border-radius:16px}}
.atl-log{margin:0 0 8px;padding:9px 12px;border-radius:14px;background:#f1faee;border:2px solid #cfe8c4;font-size:13px;color:#2f5f3c}
.atl-up{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin:12px 0 4px;padding:10px 12px;border-radius:14px;background:#fff7ea}.atl-up b{font-size:13.5px;color:var(--ink,#4a3528)}.atl-up small{flex:1 1 100%;font-size:12px;color:#9a8470}.atl-up .btn{margin-left:auto}`;
  document.head.appendChild(st);
}
window.__at = { addComp: o => addComp(o), q: id => atQ(id) };

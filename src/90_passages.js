// ================= 90 · LES PASSAGES ENTRE RÉGIONS, L'ÉQUIPEMENT ET LES HABITANTS (v86) =================
// Décidé avec le joueur (17/11) : de vraies frontières géographiques. Pour aller en Italie depuis Lyon : les Alpes (crampons),
// ou le tour par l'Espagne, l'Afrique du Nord et la barque vers la Sicile. Chaque région prépare la suivante.
//  - Les régions sont reliées par des PASSAGES (PS_EDGES) : plaine (ouverte), montagne, rivière, marais, forêt, mer, océan, désert, glace, jungle.
//  - Plaine : la région voisine s'ouvre quand la région est explorée (81). Les autres : il faut FRANCHIR le passage, une fois.
//  - Franchir demande : l'ÉQUIPEMENT du terrain (fabriqué à la Forge), 2 PROVISIONS (nourriture) et un compagnon d'un certain NIVEAU.
//  - La recette de l'équipement s'apprend auprès d'un HABITANT, rencontré en voyage (un moment fort) : il demande un service
//    (rapporter quelques objets) ; on lui donne dans Quêtes › Habitants ; la recette arrive à la Forge.
//  - Les trouvailles rares des mini-jeux (truffe, edelweiss, daurade…) entrent dans les équipements les plus durs (navire, manteau polaire).
const ps$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- les types de passage ----------
const PS_T = {
  montagne: { ico: '⛰️', nm: 'Massif', gear: 'crampons', lv: 3 }, riviere: { ico: '🛶', nm: 'Fleuve', gear: 'barque', lv: 2 }, marais: { ico: '🪷', nm: 'Marais', gear: 'barque', lv: 2 },
  foret: { ico: '🌲', nm: 'Forêt profonde', gear: 'lanterne', lv: 2 }, mer: { ico: '⛵', nm: 'Bras de mer', gear: 'cotre', lv: 4 }, ocean: { ico: '🚢', nm: 'Océan', gear: 'navire', lv: 7 },
  desert: { ico: '🏜️', nm: 'Désert', gear: 'gourde', lv: 5 }, glace: { ico: '❄️', nm: 'Glaces', gear: 'manteau', lv: 6 }, jungle: { ico: '🌴', nm: 'Jungle', gear: 'machette', lv: 5 },
};
// [région A, région B, type, nom du passage]
const PS_EDGES = [
  ['idf', 'hdf', 'libre'], ['idf', 'normandie', 'libre'], ['idf', 'cvl', 'libre'], ['idf', 'grandest', 'libre'], ['idf', 'bfc', 'libre'], ['hdf', 'normandie', 'libre'], ['hdf', 'grandest', 'libre'],
  ['normandie', 'bretagne', 'libre'], ['normandie', 'pdl', 'libre'], ['normandie', 'cvl', 'libre'], ['bretagne', 'pdl', 'foret', 'La forêt de Brocéliande'], ['pdl', 'cvl', 'libre'],
  ['pdl', 'naquitaine', 'marais', 'Le Marais poitevin'], ['cvl', 'naquitaine', 'libre'], ['cvl', 'bfc', 'libre'], ['cvl', 'ara', 'libre'], ['grandest', 'bfc', 'libre'], ['bfc', 'ara', 'libre'],
  ['ara', 'paca', 'riviere', 'La descente du Rhône'], ['ara', 'occitanie', 'libre'], ['ara', 'naquitaine', 'libre'], ['occitanie', 'naquitaine', 'riviere', 'La Garonne'], ['occitanie', 'paca', 'marais', 'La Camargue'],
  ['paca', 'corse', 'mer', 'La traversée vers la Corse'], ['hdf', 'benelux', 'libre'], ['grandest', 'benelux', 'libre'], ['grandest', 'allemagne', 'riviere', 'Le Rhin'], ['bfc', 'suisse', 'montagne', 'Le Jura'],
  ['ara', 'suisse', 'montagne', 'Le col du Grand-Saint-Bernard'], ['ara', 'italie', 'montagne', 'Les Alpes'], ['paca', 'italie', 'libre'], ['occitanie', 'iberie', 'montagne', 'Les Pyrénées'], ['naquitaine', 'iberie', 'montagne', 'Les Pyrénées basques'],
  ['normandie', 'britanniques', 'mer', 'La Manche'], ['bretagne', 'britanniques', 'mer', 'La Manche, depuis Saint-Malo'], ['hdf', 'britanniques', 'mer', 'Le pas de Calais'], ['corse', 'italie', 'mer', 'Les bouches de Bonifacio'],
  ['benelux', 'allemagne', 'libre'], ['allemagne', 'suisse', 'libre'], ['suisse', 'italie', 'montagne', 'Le col du Simplon'], ['allemagne', 'scandinavie', 'mer', 'La Baltique'], ['allemagne', 'europe_est', 'libre'],
  ['italie', 'europe_est', 'libre'], ['italie', 'mediterranee', 'mer', 'L’Adriatique'], ['iberie', 'afrique_nord', 'mer', 'Le détroit de Gibraltar'], ['italie', 'afrique_nord', 'mer', 'La Sicile et la Tunisie'],
  ['mediterranee', 'moyen_orient', 'mer', 'La mer Égée'], ['europe_est', 'mediterranee', 'libre'], ['europe_est', 'asie_centrale', 'libre'], ['europe_est', 'moyen_orient', 'mer', 'Le Bosphore'],
  ['scandinavie', 'arctique', 'glace', 'Le cercle polaire'], ['britanniques', 'scandinavie', 'mer', 'La mer du Nord'], ['britanniques', 'canada', 'ocean', 'L’Atlantique Nord'], ['iberie', 'usa_est', 'ocean', 'L’Atlantique'],
  ['afrique_nord', 'afrique_ouest', 'desert', 'Le Sahara'], ['afrique_nord', 'moyen_orient', 'desert', 'Le Sinaï'], ['afrique_nord', 'afrique_est', 'desert', 'Le désert de Nubie'], ['afrique_ouest', 'afrique_est', 'jungle', 'La forêt du Congo'],
  ['afrique_est', 'afrique_sud', 'libre'], ['afrique_sud', 'ocean_indien', 'mer', 'Le canal du Mozambique'], ['afrique_est', 'ocean_indien', 'mer', 'L’océan Indien'], ['afrique_est', 'moyen_orient', 'mer', 'La mer Rouge'],
  ['moyen_orient', 'asie_centrale', 'desert', 'Le désert d’Arabie'], ['moyen_orient', 'inde', 'desert', 'Le désert du Thar'], ['afrique_ouest', 'amerique_sud', 'ocean', 'L’Atlantique Sud'],
  ['asie_centrale', 'chine', 'montagne', 'Les monts Célestes'], ['inde', 'chine', 'montagne', 'L’Himalaya'], ['inde', 'asie_sud_est', 'jungle', 'Les jungles birmanes'], ['chine', 'coree', 'libre'], ['coree', 'japon', 'mer', 'Le détroit de Corée'],
  ['chine', 'japon', 'mer', 'La mer de Chine'], ['chine', 'asie_sud_est', 'jungle', 'Les forêts du Mékong'], ['asie_sud_est', 'australie', 'mer', 'Les îles de la Sonde'], ['australie', 'pacifique', 'ocean', 'La mer de Tasman'],
  ['inde', 'ocean_indien', 'mer', 'La mer d’Arabie'], ['asie_centrale', 'arctique', 'glace', 'La Sibérie'], ['japon', 'pacifique', 'ocean', 'Le Pacifique'], ['canada', 'usa_est', 'libre'], ['canada', 'usa_ouest', 'libre'],
  ['usa_est', 'usa_ouest', 'desert', 'Les grandes plaines et le désert'], ['usa_ouest', 'mexique_caraibes', 'desert', 'Le désert de Sonora'], ['usa_est', 'mexique_caraibes', 'mer', 'Le golfe du Mexique'],
  ['mexique_caraibes', 'amerique_sud', 'jungle', 'La jungle du Darién'], ['canada', 'arctique', 'glace', 'Le Grand Nord'], ['usa_ouest', 'pacifique', 'ocean', 'Le Pacifique'], ['amerique_sud', 'pacifique', 'ocean', 'Le Pacifique Sud'],
];
const psKey = E => E[0] + '~' + E[1];
const psOther = (E, id) => E[0] === id ? E[1] : E[0];

// ---------- équipement : recettes, et les habitants qui les apprennent ----------
// ING : une « trouvaille rare » = une plante ou un poisson de rareté 3+ (cueillette, pêche)
try { Object.assign(ING, { p_rare: [['feuille', 'fleur', 'legume', 'mer', 'fruit'], 'Trouvaille rare (cueillette ou pêche)'], provision: [['plat', 'pain', 'sucre', 'boisson', 'fromage', 'legume', 'fruit', 'mer'], 'Provision'] }); } catch (e) {}
if (typeof ingExtra === 'function') ingExtra = (orig => function (key, i) { if (key === 'p_rare') return !!(i && i.rarity >= 3); if (key === 'provision') return !!(i && i.cat === 'n'); return orig.apply(this, arguments); })(ingExtra);
const PS_GEAR = {
  crampons: { nm: 'Crampons', ing: [['metal', 2], ['cristal', 1], ['laine', 1]], col: '#8f9cb3', hab: { who: 'Jules', job: 'guide de haute montagne', ico: '🧗', ask: [['pierre', 3]], txt: 'Je t’apprends à forger des crampons si tu me rapportes 3 belles pierres pour baliser le sentier.' } },
  barque: { nm: 'Barque calfatée', ing: [['bois', 3], ['tissu', 1], ['feuille', 2]], col: '#a5784f', hab: { who: 'Bernat', job: 'éclusier', ico: '🛶', ask: [['bois', 2]], txt: 'Rapporte-moi 2 morceaux de bois pour réparer mon écluse, et je te montre comment construire une barque.' } },
  lanterne: { nm: 'Lanterne de marche', ing: [['verre', 1], ['metal', 1], ['lumiere', 1]], col: '#f2c14e', hab: { who: 'Maëlle', job: 'conteuse de la forêt', ico: '🕯️', ask: [['champignon', 2]], txt: 'Les sentiers ne se laissent traverser qu’avec une vraie lanterne. Apporte-moi 2 champignons pour ma soupe, je te dirai comment la faire.' } },
  cotre: { nm: 'Cotre de mer', ing: [['bois', 4], ['tissu', 2], ['mer', 2]], col: '#3b6fb0', hab: { who: 'Yann', job: 'vieux marin', ico: '⚓', ask: [['mer', 3]], txt: 'Ramène-moi 3 poissons de ta pêche, et je t’apprends à construire un cotre qui tient la mer.' } },
  navire: { nm: 'Grand voilier', ing: [['bois', 6], ['tissu', 3], ['metal', 2], ['p_rare', 1]], col: '#7a4f2a', hab: { who: 'Capitaine Rosa', job: 'capitaine au long cours', ico: '🧭', ask: [['coquillage', 3], ['p_rare', 1]], txt: 'Traverser l’océan, ça se mérite. Rapporte-moi 3 coquillages et une trouvaille rare, et je te confie les plans de mon voilier.' } },
  gourde: { nm: 'Gourde d’expédition', ing: [['tissu', 1], ['metal', 1], ['fruit', 2]], col: '#7fbf9f', hab: { who: 'Amira', job: 'guide caravanière', ico: '🐪', ask: [['fruit', 3]], txt: 'Dans le désert, l’eau, c’est la vie. Apporte-moi 3 fruits et je t’apprends à coudre une vraie gourde.' } },
  manteau: { nm: 'Manteau polaire', ing: [['laine', 3], ['tissu', 1], ['p_rare', 1]], col: '#9fd1d8', hab: { who: 'Aslak', job: 'éleveur de rennes', ico: '🦌', ask: [['laine', 2], ['p_rare', 1]], txt: 'Le froid du Nord ne pardonne pas. 2 pelotes de laine et une trouvaille rare, et je te montre comment coudre un manteau polaire.' } },
  machette: { nm: 'Machette', ing: [['metal', 2], ['bois', 1], ['pierre', 1]], col: '#6f9a5f', hab: { who: 'Kofi', job: 'pisteur de la jungle', ico: '🌿', ask: [['plume', 2]], txt: 'Rapporte-moi 2 plumes pour mon chapeau, et je t’apprends à forger une machette qui ouvre n’importe quel sentier.' } },
};
function psSt() {
  if (!S.ps || typeof S.ps !== 'object') S.ps = {};
  const s = S.ps; if (!s.done) s.done = {}; if (!s.learn) s.learn = {}; if (!s.hab) s.hab = {};
  return s;
}
const psRid = g => 'ps_' + g;
function psSyncRecipes() {
  const s = psSt();
  for (const [g, G] of Object.entries(PS_GEAR)) if (s.learn[g] && !RECIPES.some(r => r.id === psRid(g))) RECIPES.push({ id: psRid(g), kind: 'Équipement', out: [G.nm, 'm', 'outil', 2, null, G.col], ing: G.ing, coins: 0 });
}
ps$(psSyncRecipes);
const psHas = g => (S.inv || []).some(i => i && String(i.name || '').replace(/ \(chef-d’œuvre\)$/, '').replace(/ (pro|légendaires?)$/, '') === PS_GEAR[g].nm);
const psProv = () => (S.inv || []).filter(i => i && i.cat === 'n' && i.sub !== 'appat').length;

// ---------- quelles régions s'ouvrent seules (plaine) ----------
const psEdgesOf = id => PS_EDGES.filter(E => E[0] === id || E[1] === id);
rcNearest = function (R) { return psEdgesOf(R.id).filter(E => E[2] === 'libre').map(E => RG[psOther(E, R.id)]).filter(X => X && !rcIsOpen(X.id)); };
// les passages franchissables : depuis une région ouverte vers une région fermée
function psAvail() { return PS_EDGES.filter(E => E[2] !== 'libre' && (rcIsOpen(E[0]) !== rcIsOpen(E[1])) && !psSt().done[psKey(E)]); }
const psFrom = E => rcIsOpen(E[0]) ? E[0] : E[1];
const psTo = E => rcIsOpen(E[0]) ? E[1] : E[0];
function psLv(E) { const n = Object.keys(psSt().done).length; return Math.min(10, PS_T[E[2]].lv + Math.floor(n / 3)); }

// ---------- sur la carte : une icône sur chaque passage ----------
function psPins() {
  if (typeof ovEls === 'undefined' || !document.getElementById('ov') || document.body.classList.contains('firstrun')) return;
  const L = psAvail(), keep = new Set(L.map(E => 'psg' + psKey(E)));
  Object.keys(ovEls).forEach(key => { if (key.startsWith('psg') && !keep.has(key)) { ovEls[key].el.remove(); delete ovEls[key]; } });
  L.forEach(E => {
    const key = 'psg' + psKey(E); if (ovEls[key] && ovEls[key].el.isConnected) return;
    const A = RG[psFrom(E)], B = RG[psTo(E)]; if (!A || !B) return;
    const f = 0.38, lon = A.anchor[0] + (B.anchor[0] - A.anchor[0]) * f, lat = A.anchor[1] + (B.anchor[1] - A.anchor[1]) * f;
    const el = document.createElement('div'); el.className = 'ovm psg'; el.dataset.psg = psKey(E);
    el.innerHTML = `<span class="psg-b">${PS_T[E[2]].ico}</span><span class="psg-t">${ps$(() => esc(E[3] || PS_T[E[2]].nm), '')}</span>`;
    document.getElementById('ov').appendChild(el); ovEls[key] = { el, lon, lat };
  });
  Object.keys(ovEls).forEach(key => { if (key.startsWith('psg')) { ovEls[key].el.hidden = false; delete ovEls[key].el.dataset.rcl; } });
}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); ps$(psPins); ps$(() => positionOverlay()); return r; })(drawMarks);
if (typeof rcPins === 'function') rcPins = (orig => function () { const r = orig.apply(this, arguments); ps$(() => Object.keys(ovEls).forEach(k => { if (k.startsWith('psg')) { ovEls[k].el.hidden = false; delete ovEls[k].el.dataset.rcl; } })); return r; })(rcPins);
document.addEventListener('click', ev => { const m = ev.target.closest && ev.target.closest('.psg'); if (!m) return; ev.stopPropagation(); psOpen(m.dataset.psg); });
// une région fermée : dire quel passage y mène
rcBlocked = (orig => function (d) {
  if (!d || !isFinite(d.lon) || !isFinite(d.lat)) return false;
  const R = ps$(() => regionAt(d.lon, d.lat), null); if (!R || !rcOk(R) || rcIsOpen(R.id)) return false;
  const E = psAvail().find(x => psTo(x) === R.id);
  if (E) { ps$(() => toast(`🔒 ${R.name} : il faut d’abord franchir ${E[3] || PS_T[E[2]].nm} ${PS_T[E[2]].ico}. Touchez l’icône sur la carte.`)); return true; }
  return orig.apply(this, arguments);
})(rcBlocked);

// ---------- l'habitant : un moment fort en voyage ----------
function psNeedGear() {
  const s = psSt(), out = [];
  psAvail().forEach(E => { const g = PS_T[E[2]].gear; if (!s.learn[g] && !s.hab[g] && !out.some(x => x.g === g)) out.push({ g, E }); });
  return out;
}
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  ps$(() => {
    const t = S.trips[k]; if (!t || t === before) return;
    const N = psNeedGear(); if (!N.length) return;
    const here = ps$(() => regionAt(t.dest.lon, t.dest.lat).id, '');
    const C = N.filter(x => psFrom(x.E) === here); const pickN = (C.length ? C : N)[0];
    if (Math.random() >= (C.length ? 0.55 : 0.25)) return;
    t.mf = { k: 'choix', v: 3, hab: pickN.g, edge: psKey(pickN.E), at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
// on se branche sur l'affichage des situations (85) : un habitant est une situation spéciale
const PS_HABSX = g => {
  const H = PS_GEAR[g].hab;
  return { id: 'hab_' + g, k: 'campagne', tier: 'u', ico: H.ico, q: `{n} rencontre ${H.who}, ${H.job}. « ${H.txt} »`, o: [
    Sf('Accepter de l’aider', `${H.who} sourit : « Je compte sur toi ! » (à donner dans Quêtes › Habitants)`, { loot: 0, hab: g }),
    Sf('Pas maintenant', `${H.who} hausse les épaules : « Reviens me voir quand tu veux. »`, { loot: 0 })] };
};
if (typeof sxS === 'function') { /* sxS est une const : on passe par SX_BY */ }
const psHabSync = () => ps$(() => Object.keys(PS_GEAR).forEach(g => { SX_BY['hab_' + g] = PS_HABSX(g); }));
psHabSync();
// les trajets avec un habitant utilisent l'identifiant de situation hab_<g>
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  ps$(() => { const t = S.trips[k]; if (t && t !== before && t.mf && t.mf.v === 3) { t.mf.v = 2; t.mf.id = 'hab_' + t.mf.hab; t.mf.kind = 'campagne'; save(); } });
  return r;
})(startTrip);
// l'effet « hab » : on note la demande de l'habitant
if (typeof sxApply === 'function') sxApply = (orig => function (k, t, e) {
  const fx = orig.apply(this, arguments);
  if (e && e.hab) { const s = psSt(); if (!s.hab[e.hab] && !s.learn[e.hab]) { s.hab[e.hab] = { at: Date.now() }; fx.push(`🏘️ ${PS_GEAR[e.hab].hab.who} attend votre aide (Quêtes › Habitants)`); ps$(save); } }
  return fx;
})(sxApply);

// ---------- Quêtes › Habitants : les savoir-faire à apprendre ----------
const psCount = key => ps$(() => ingCount(key), 0);
function psHabHTML() {
  const s = psSt(), L = Object.keys(s.hab).filter(g => !s.learn[g]);
  const lern = Object.keys(s.learn);
  let h = '';
  if (L.length) h += `<h3 class="qt-h3">🏘️ Savoir-faire à apprendre</h3>` + L.map(g => {
    const G = PS_GEAR[g], H = G.hab, ok = H.ask.every(([key, n]) => psCount(key) >= n);
    return `<div class="ps-hab"><span class="ps-hi">${H.ico}</span><div><b>${esc(H.who)}, ${esc(H.job)}</b><span>Apprend : <b>${esc(G.nm)}</b></span><div class="ps-need">${H.ask.map(([key, n]) => { const c = psCount(key); return `<i class="${c >= n ? 'ok' : ''}">${esc(ING[key] ? ING[key][1] : key)} ${Math.min(c, n)}/${n}</i>`; }).join('')}</div></div><button class="btn ${ok ? 'green' : 'cream'} sm" data-pshab="${g}" ${ok ? '' : 'disabled'}>Donner</button></div>`;
  }).join('');
  if (lern.length) h += `<p class="ps-learned">Savoir-faire appris : ${lern.map(g => `<b>${esc(PS_GEAR[g].nm)}</b>`).join(', ')} (à fabriquer à la Forge).</p>`;
  return h;
}
if (typeof QM_HTML !== 'undefined' && QM_HTML.hab) QM_HTML.hab = (orig => function () { return ps$(psHabHTML, '') + orig.apply(this, arguments); })(QM_HTML.hab);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-pshab]'); if (!b || b.disabled) return;
  ev.stopPropagation();
  const g = b.dataset.pshab, G = PS_GEAR[g], s = psSt();
  if (!G.hab.ask.every(([key, n]) => psCount(key) >= n)) return;
  for (const [key, n] of G.hab.ask) { let left = n; for (let i = S.inv.length - 1; i >= 0 && left > 0; i--) { const it = S.inv[i]; if (it && ps$(() => ingIt(key, it), false) && !ps$(() => styleWornBy(it.id), false)) { S.inv.splice(i, 1); left--; } } }
  s.learn[g] = Date.now(); delete s.hab[g]; psSyncRecipes(); ps$(save);
  ps$(() => toast(`📜 ${G.hab.who} vous apprend : ${G.nm} ! La recette est à la Forge.`)); ps$(() => confetti(true));
  ps$(() => qmShow('hab'));
}, true);

// ---------- la fenêtre du passage ----------
const PS_TXT = {
  montagne: ['{n} chausse ses crampons au pied de {e}. La neige craque sous les pattes, le vent siffle sur les crêtes.', 'Passer par le col balisé', 'Couper par le glacier', 'Au sommet du col, toute la région nouvelle s’étend sous les nuages.'],
  riviere: ['{n} met sa barque à l’eau sur {e}. Le courant est fort, les berges défilent.', 'Suivre le chenal tranquille', 'Prendre les rapides', 'La barque accoste de l’autre côté : une nouvelle région commence ici.'],
  marais: ['{e} : un labyrinthe de canaux, de roseaux et de hérons. {n} pousse sa barque à la perche.', 'Suivre le canal principal', 'Se fier aux hérons', 'Au sortir des roseaux, la terre ferme d’une nouvelle région.'],
  foret: ['{e} : les arbres sont si serrés que le jour ne passe plus. {n} allume sa lanterne.', 'Suivre les pierres moussues', 'Écouter les voix de la forêt', 'La lumière revient entre les troncs : une nouvelle région s’ouvre.'],
  mer: ['{n} hisse la voile pour {e}. Les vagues frappent la coque, les mouettes accompagnent le cotre.', 'Longer la côte', 'Filer au large', 'Terre en vue ! Le cotre accoste sur une nouvelle rive.'],
  ocean: ['{e} : des jours de mer, rien que l’horizon. {n} tient la barre du grand voilier.', 'Suivre la route des alizés', 'Traverser la tempête', 'Après des jours en mer, un nouveau continent apparaît à l’aube !'],
  desert: ['{e} : des dunes à perte de vue. {n} remplit sa gourde et règle son pas sur la caravane.', 'Marcher de puits en puits', 'Traverser de nuit, guidé par les étoiles', 'Une oasis, puis des palmiers, puis une ville : la traversée est réussie.'],
  glace: ['{e} : la banquise craque, le froid mord. {n} serre son manteau polaire.', 'Suivre les traces des rennes', 'Couper par la glace fine', 'Au bout de la nuit polaire, les aurores accueillent {n} dans une nouvelle région.'],
  jungle: ['{e} : la jungle est si dense qu’il faut s’ouvrir un chemin à la machette. {n} avance pas à pas.', 'Suivre la rivière', 'Couper à travers les lianes', 'La canopée s’écarte : une nouvelle région, pleine de vie, s’offre à {n}.'],
};
let PSX = null;
function psOpen(key) {
  const E = PS_EDGES.find(x => psKey(x) === key); if (!E || psSt().done[key]) return;
  const T = PS_T[E[2]], g = T.gear, G = PS_GEAR[g], A = RG[psFrom(E)], B = RG[psTo(E)], k = S.sel, s = psSt();
  const lv = psLv(E), myLv = ps$(() => S.prog[k].lvl, 1), away = !!(S.trips && S.trips[k]);
  const okG = psHas(g), okP = psProv() >= 2, okL = myLv >= lv;
  const gearLine = okG ? `✓ ${esc(G.nm)}` : s.learn[g] ? `${esc(G.nm)} : à fabriquer à la Forge` : s.hab[g] ? `${esc(G.nm)} : aidez ${esc(G.hab.who)} (Quêtes › Habitants)` : `${esc(G.nm)} : un habitant pourra vous l’apprendre en voyage en ${esc(A.short)}`;
  const el = document.createElement('div'); el.id = 'psG'; el.className = 'ch-ov ch-' + ({ mer: 'mer', ocean: 'mer', riviere: 'mer', marais: 'mer', desert: 'desert' }[E[2]] || 'route');
  el.innerHTML = `<div class="ch-card"><div class="ch-hero"><span class="ch-ico">${T.ico}</span><img src="${ps$(() => portraitURI(k), '')}" alt=""><span class="sx-tier sx-l">Passage</span></div>
    <p class="cu-k">${esc(A.short)} → ${esc(B.name)}</p><h3 class="ps-h">${esc(E[3] || T.nm)}</h3>
    <p class="ch-q">De l’autre côté : ${esc(B.mood || B.name)}</p>
    <ul class="ps-req"><li class="${okG ? 'ok' : ''}">🎒 ${gearLine}</li><li class="${okP ? 'ok' : ''}">🍞 2 provisions (nourriture) · vous en avez ${psProv()}</li><li class="${okL ? 'ok' : ''}">⭐ ${esc(ps$(() => CHARS[k].name, ''))} niveau ${lv} minimum · niveau ${myLv}</li></ul>
    ${away ? `<p class="sx-aff" style="background:#fde3e0;color:#b5443a">${esc(ps$(() => CHARS[k].name, ''))} est en voyage : choisissez un autre compagnon en haut de l’écran.</p>` : ''}
    <button class="btn green big wide" data-psgo="${key}" ${okG && okP && okL && !away ? '' : 'disabled'}>Franchir avec ${esc(ps$(() => CHARS[k].name, ''))}</button><button class="cu-later" data-psquit="1">Plus tard</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
  PSX = { key, E, k };
}
function psClose() { const el = document.getElementById('psG'); if (el) el.remove(); document.body.classList.remove('cu-on'); PSX = null; ps$(() => drawMarks()); ps$(() => renderTripCard()); }
function psGo() {
  const { E, k } = PSX, T = PS_TXT[E[2]], card = document.querySelector('#psG .ch-card');
  // les provisions sont consommées
  let left = 2; for (let i = S.inv.length - 1; i >= 0 && left > 0; i--) { const it = S.inv[i]; if (it && it.cat === 'n' && it.sub !== 'appat') { S.inv.splice(i, 1); left--; } }
  ps$(save);
  const n = ps$(() => CHARS[k].name, ''), fill = s => s.replace(/\{n\}/g, n).replace(/\{e\}/g, E[3] || PS_T[E[2]].nm);
  card.innerHTML = `<div class="ch-hero"><span class="ch-ico">${PS_T[E[2]].ico}</span><img src="${ps$(() => portraitURI(k, 'surpris'), '')}" alt=""></div><p class="ch-q">${esc(fill(T[0]))}</p>
    <button class="ch-opt" data-psway="safe"><b>${esc(T[1])}</b><span class="ch-tags"><i class="ok">Sans risque</i></span></button>
    <button class="ch-opt risk" data-psway="risk"><b>${esc(T[2])}</b><span class="ch-tags"><i class="ko">⚠️ 40 % de risque : 1 provision de plus</i><i class="gold">⭐ Découverte rare</i></span></button>`;
}
function psWay(way) {
  const { E, k, key } = PSX, T = PS_TXT[E[2]], to = psTo(E), B = RG[to], s = psSt();
  const n = ps$(() => CHARS[k].name, ''), fill = x => x.replace(/\{n\}/g, n);
  const fx = [];
  if (way === 'risk') {
    if (Math.random() < 0.6) { ps$(() => gainStones(2)); fx.push('⭐ +2 pierres d’étoile'); const tags = (B.anchor && B.anchor[3]) || ['campagne']; const pool = ps$(() => lootTable(tags), []); const top = pool.slice().sort((a, b) => b.d[3] - a.d[3])[0]; if (top) { const it = ps$(() => makeItem(top.d, 1.5, B.name, tags, { fixed: Math.max(3, top.d[3]) }), null); if (it) { S.inv.push(it); S.dex[it.name] = true; fx.push('🎁 ' + it.name + ' (rare)'); } } }
    else { let left = 1; for (let i = S.inv.length - 1; i >= 0 && left > 0; i--) { const it = S.inv[i]; if (it && it.cat === 'n' && it.sub !== 'appat') { S.inv.splice(i, 1); left--; } } fx.push('🍞 Une provision de plus a été mangée en route'); }
  }
  s.done[key] = Date.now();
  rcSt().open[to] = { need: Math.min(8, 3 + Object.keys(rcSt().done || {}).length), at: Date.now() };
  ps$(() => addXP(k, 60)); fx.push(`✨ +60 expérience pour ${n}`);
  fx.unshift(`🗺️ Nouvelle région : ${B.name}`);
  ps$(() => rcCheck(true)); ps$(save);
  const card = document.querySelector('#psG .ch-card');
  card.innerHTML = `<div class="ch-hero"><span class="ch-ico">${PS_T[E[2]].ico}</span><img src="${ps$(() => portraitURI(k, 'rire'), '')}" alt=""><span class="sx-tier sx-l">Passage franchi !</span></div><p class="ch-q">${esc(fill(T[3]))}</p><ul class="ch-fx">${fx.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn green big wide" data-psquit="1">Découvrir ${esc(B.short)}</button>`;
  ps$(() => confetti(true));
  ps$(() => { const m = map; m.flyTo({ center: [B.anchor[0], B.anchor[1]], zoom: Math.max(4.5, m.getZoom() - 0.5), duration: 1600 }); });
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-psgo],[data-psway],[data-psquit]'); if (!b || !PSX && !b.dataset.psquit) return;
  ev.stopPropagation(); ev.preventDefault();
  if (b.dataset.psquit) return psClose();
  if (b.dataset.psgo && !b.disabled) return psGo();
  if (b.dataset.psway) return psWay(b.dataset.psway);
}, true);
// la ligne de région en haut : signaler les passages
if (typeof cmGoal === 'function') cmGoal = (orig => function () {
  const r = orig.apply(this, arguments);
  ps$(() => { const b = document.querySelector('#cmGoal .rc-ln small'); const L = psAvail(); if (b && L.length && !b.dataset.ps) { b.dataset.ps = 1; b.insertAdjacentText('beforeend', ` · ${L.length} passage${L.length > 1 ? 's' : ''} ${L.slice(0, 2).map(E => PS_T[E[2]].ico).join('')}`); } });
  return r;
})(cmGoal);
window.__ps = { avail: () => psAvail().map(psKey), open: k => psOpen(k), st: () => psSt(), learn: g => { psSt().learn[g] = 1; psSyncRecipes(); }, hab: g => { psSt().hab[g] = { at: Date.now() }; } };

{
  const css = document.createElement('style');
  css.textContent = `
.ovm.psg{z-index:5;cursor:pointer}.psg .psg-b{position:absolute;left:-19px;top:-40px;width:38px;height:38px;border-radius:12px;background:#fff3c9;border:2.5px solid #4a3528;display:flex;align-items:center;justify-content:center;font-size:21px;box-shadow:0 3px 0 rgba(74,53,40,.3);animation:chB 1.8s ease-in-out infinite}
.psg .psg-t{position:absolute;left:0;top:2px;transform:translateX(-50%);padding:1px 7px;border-radius:9px;background:#fffaf0;border:1.5px solid #4a3528;font:800 11px var(--body,system-ui);color:#4a3528;white-space:nowrap}
#ov.lx-far .psg .psg-t{display:none}
.ps-h{margin:0 0 4px;font:800 21px var(--display,system-ui);color:#4a3528}
.ps-req{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:5px;text-align:left}.ps-req li{padding:7px 10px;border-radius:12px;background:#fde3e0;font:700 13px var(--body,system-ui);color:#7a3a30}.ps-req li.ok{background:#dff3d6;color:#2f7f3c}
.ps-hab{display:flex;gap:9px;align-items:center;margin:0 0 7px;padding:9px 10px;border-radius:14px;background:#eef6fb;border:2px solid #b9d6e8}
.ps-hi{font-size:30px}.ps-hab>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;text-align:left}.ps-hab b{font:800 13.5px var(--display,system-ui);color:#4a3528}.ps-hab span{font:600 12.5px var(--body,system-ui);color:#4a3528}
.ps-need{display:flex;flex-wrap:wrap;gap:4px}.ps-need i{font-style:normal;padding:1px 7px;border-radius:999px;background:#fde3e0;font:700 11px var(--body,system-ui);color:#7a3a30}.ps-need i.ok{background:#dff3d6;color:#2f7f3c}
.ps-learned{margin:0 0 10px;padding:7px 10px;border-radius:12px;background:#dff3d6;font:600 12.5px var(--body,system-ui);color:#2f5f2c;text-align:left}
`;
  document.head.appendChild(css);
}

// ================= 96 · LES TRAVERSÉES : UN VRAI VOYAGE, LIÉ À L'HISTOIRE (v91) =================
// Le joueur (18/11), devant « Les Alpes : crampons, 2 provisions, niveau 3 » : « c'est ridicule, il faut un lien avec l'histoire,
// personne ne va suivre l'histoire et c'est trop simple » ; « que les items nécessaires à la traversée soient logiques ».
//  1. Le chemin vient de l'histoire : un passage est caché tant qu'on ne le connaît pas. La page du camp d'Augustine révèle
//     LE chemin qu'elle a pris ; devenir Connaisseur d'une région révèle les autres (les gens du coin en parlent).
//  2. L'habitant est un ami d'Augustine : il demande d'abord son « Mot d'Augustine » (trouvé dans chacun de ses camps).
//  3. Préparer avec logique : l'équipement du terrain (recettes refaites : crampons = métal + sangles…), des provisions du bon
//     genre (Chaleur pour la montagne et la glace, Fraîcheur pour le désert et la jungle, Endurance pour l'eau et la forêt),
//     et connaître la région de départ (Connaisseur pour les grands passages, Habitué pour les petits).
//  4. La traversée = 3 vrais voyages (approche, cœur du passage, arrivée), chacun avec un choix. Au cœur, l'audace peut
//     faire faire demi-tour (tout recommencer) ; la prudence coûte une provision de plus (sans elle : demi-tour).
const tv$ = (f, d) => { try { return f(); } catch (e) { return d; } };
function tvSt() { if (!S.tv || typeof S.tv !== 'object') S.tv = {}; return S.tv; } // { cléPassage: { stage, k, at } }

// ---------- 3 · préparer : équipement logique, provisions du bon genre, connaissance ----------
const TV_T = {
  montagne: { pk: 'chaud', kn: 3, lv: 5, st: ['Le pied du massif', 'Le col', 'La descente'], tag: 'montagne', kind: 'montagne' },
  glace: { pk: 'chaud', kn: 3, lv: 7, st: ['Le dernier village', 'La banquise', 'Les aurores'], tag: 'neige', kind: 'montagne' },
  desert: { pk: 'frais', kn: 3, lv: 6, st: ['La dernière oasis', 'Les dunes', 'Les palmiers'], tag: 'desert', kind: 'desert' },
  jungle: { pk: 'frais', kn: 3, lv: 6, st: ['La lisière', 'La jungle profonde', 'La rivière'], tag: 'foret', kind: 'foret' },
  mer: { pk: 'end', kn: 3, lv: 4, st: ['Le port', 'La pleine mer', 'L’autre rive'], tag: 'mer', kind: 'port' },
  ocean: { pk: 'end', kn: 4, lv: 8, st: ['Le grand port', 'L’océan', 'Terre en vue'], tag: 'mer', kind: 'port' },
  riviere: { pk: 'end', kn: 2, lv: 2, st: ['L’embarcadère', 'Les rapides', 'L’autre rive'], tag: 'lac', kind: 'eau' },
  marais: { pk: 'end', kn: 2, lv: 2, st: ['L’entrée du marais', 'Les canaux', 'La terre ferme'], tag: 'lac', kind: 'eau' },
  foret: { pk: 'end', kn: 2, lv: 3, st: ['L’orée', 'Le cœur de la forêt', 'La clairière'], tag: 'foret', kind: 'foret' },
};
tv$(() => Object.entries(TV_T).forEach(([t, D]) => { if (PS_T[t]) PS_T[t].lv = D.lv; }));
const TV_PK = { chaud: ['Chaleur', 'contre le froid : chocolat chaud, soupe, fondue…'], frais: ['Fraîcheur', 'contre la chaleur : citronnade, jus, glaces…'], end: ['Endurance', 'pour tenir la distance : gâteau du voyageur…'] };
// des recettes d'équipement qui ont du sens
const TV_GEAR = {
  crampons: { ing: [['metal', 3], ['tissu', 1]], why: 'des pointes de métal et des sangles' },
  barque: { ing: [['bois', 4], ['metal', 1]], why: 'des planches et des clous' },
  lanterne: { ing: [['verre', 1], ['metal', 1], ['lumiere', 1]], why: 'du verre, une armature et une flamme' },
  cotre: { ing: [['bois', 5], ['tissu', 2], ['metal', 1]], why: 'une coque, une voile et une ancre' },
  navire: { ing: [['bois', 6], ['tissu', 3], ['metal', 2], ['papier', 1]], why: 'coque, voiles, ancre et une carte marine' },
  gourde: { ing: [['tissu', 2], ['metal', 1]], why: 'une poche cousue et un bouchon' },
  manteau: { ing: [['laine', 4], ['tissu', 1], ['plume', 2]], why: 'de la laine, une doublure et du duvet' },
  machette: { ing: [['metal', 2], ['bois', 1], ['pierre', 1]], why: 'une lame, un manche et une pierre à aiguiser' },
};
tv$(() => Object.entries(TV_GEAR).forEach(([g, D]) => { const G = PS_GEAR[g]; if (G) G.ing.splice(0, G.ing.length, ...D.ing); }));
const tvTerr = E => TV_T[E[2]] || TV_T.riviere;
const tvProvs = pk => tv$(() => (S.inv || []).filter(it => it && it.mk && eqKindOf(it.mk.rid) === pk && !tv$(() => styleWornBy(it.id), false)), []);
function tvEat(pk, n) { let left = n; for (let i = S.inv.length - 1; i >= 0 && left > 0; i--) { const it = S.inv[i]; if (it && it.mk && tv$(() => eqKindOf(it.mk.rid), null) === pk) { S.inv.splice(i, 1); left--; } } return n - left; }

// ---------- 2 · l'habitant, ami d'Augustine : son mot d'abord ----------
try { ING.aug_mot = [['lettre'], 'Mot d’Augustine (dans ses camps)']; } catch (e) {}
const TV_HAB = {
  crampons: ['Augustine ? Elle a dormi dans mon refuge avant de passer le col. Si tu viens de sa part, aide-moi à baliser le sentier : 3 belles pierres, et je t’apprends à forger des crampons.', [['pierre', 3]]],
  barque: ['Augustine m’avait aidé à réparer mon écluse, il y a longtemps. Rapporte-moi 2 morceaux de bois, et je te montre comment construire une barque.', [['bois', 2]]],
  lanterne: ['Augustine n’avait peur de rien dans cette forêt, grâce à sa lanterne. Apporte-moi 2 champignons pour ma soupe, je te dirai comment la faire.', [['champignon', 2]]],
  cotre: ['J’ai fait traverser Augustine sur mon cotre ! Ramène-moi 3 poissons de ta pêche, et je t’apprends à en construire un.', [['mer', 3]]],
  navire: ['Augustine a embarqué sur mon voilier, un matin de brume. Rapporte-moi 3 coquillages et un vieux papier pour mes cartes, et je te confie mes plans.', [['coquillage', 3], ['papier', 1]]],
  gourde: ['Augustine a traversé les dunes avec ma caravane. Apporte-moi 3 fruits, et je t’apprends à coudre une vraie gourde.', [['fruit', 3]]],
  manteau: ['Augustine a passé un hiver chez nous. 2 pelotes de laine, et je te montre comment coudre un manteau polaire.', [['laine', 2]]],
  machette: ['Augustine savait se frayer un chemin partout. Rapporte-moi 2 plumes pour mon chapeau, et je t’apprends à forger une machette.', [['plume', 2]]],
};
tv$(() => {
  Object.entries(TV_HAB).forEach(([g, [txt, ask]]) => { const H = PS_GEAR[g] && PS_GEAR[g].hab; if (!H) return; H.txt = `${txt} Mais montre-moi d’abord son mot, que je sache que tu viens de sa part.`; H.ask = [['aug_mot', 1]].concat(ask); });
  psHabSync();
});
function tvGiveMot(id) {
  const c = augCamps()[id]; if (!c || c.mot) return;
  c.mot = 1;
  const it = tv$(() => makeItem(['Mot d’Augustine', 'm', 'lettre', 3, 'lettre', '#e8d3a8'], 0, `Camp d’Augustine (${RG[id].short})`, [], { fixed: 3 }), null);
  if (it) { S.inv.push(it); tv$(() => { S.dex[it.name] = true; }); }
}
GAME.on('trip:return', () => tv$(() => { let ch = 0; Object.keys(augCamps()).forEach(id => { if (!augCamps()[id].mot) { tvGiveMot(id); ch = 1; } }); if (ch) save(); }));
tv$(() => { if (!document.body.classList.contains('firstrun')) { let ch = 0; Object.keys(augCamps()).forEach(id => { if (!augCamps()[id].mot) { tvGiveMot(id); ch = 1; } }); if (ch) save(); } });

// ---------- 1 · le chemin vient de l'histoire ----------
// le chemin d'Augustine depuis une région : le plus aventureux vers une région encore fermée
function tvRouteOf(id) {
  const c = augCamps()[id]; if (!c) return null;
  if (c.route && PS_EDGES.some(E => psKey(E) === c.route)) return c.route;
  const A = { lon: RG[id].anchor[0], lat: RG[id].anchor[1] };
  const L = psEdgesOf(id).filter(E => E[2] !== 'libre' && RG[psOther(E, id)] && rcOk(RG[psOther(E, id)]) && !rcIsOpen(psOther(E, id)))
    .sort((a, b) => (tvTerr(b).lv - tvTerr(a).lv) || (kmExact(A, { lon: RG[psOther(b, id)].anchor[0], lat: RG[psOther(b, id)].anchor[1] }) - kmExact(A, { lon: RG[psOther(a, id)].anchor[0], lat: RG[psOther(a, id)].anchor[1] })));
  c.route = L.length ? psKey(L[0]) : 'none'; tv$(save);
  return L.length ? c.route : null;
}
function tvKnown(E) {
  const key = psKey(E), from = psFrom(E);
  if (tvSt()[key]) return true;
  if (tvRouteOf(from) === key) return true;
  return tv$(() => sctLvl(from), 0) >= 3;
}
psAvail = (orig => function () { return orig.apply(this, arguments).filter(E => tv$(() => tvKnown(E), true)); })(psAvail);
augNext = function (id) {
  const key = tvRouteOf(id), E = key && PS_EDGES.find(x => psKey(x) === key);
  if (!E) { const L = psEdgesOf(id).find(x => x[2] === 'libre' && !rcIsOpen(psOther(x, id))); return L ? { id: psOther(L, id), how: 'par la route' } : null; }
  return { id: psOther(E, id), how: `par ${E[3] || PS_T[E[2]].nm} ${PS_T[E[2]].ico}` };
};
// une région fermée dont le chemin est encore inconnu
if (typeof fdCard === 'function') fdCard = (orig => function (id) {
  const r = orig.apply(this, arguments);
  tv$(() => {
    const el = document.querySelector('#fdC .fd-how'); if (!el || !/trop loin/.test(el.textContent)) return;
    const E = psEdgesOf(id).find(x => x[2] !== 'libre' && rcIsOpen(psOther(x, id)) && !psSt().done[psKey(x)]); if (!E) return;
    const from = psOther(E, id);
    el.innerHTML = `Le chemin vers ${esc(RG[id].short)} est encore <b>inconnu</b>. Trouvez le <b>camp d’Augustine</b> en ${esc(RG[from].short)} : sa page vous dira par où elle est passée. Les gens du coin en parlent aussi quand on est <b>Connaisseur</b> de ${esc(RG[from].short)}.`;
  });
  return r;
})(fdCard);

// ---------- 4 · la traversée en 3 étapes ----------
function tvWays(E) {
  const A = RG[psFrom(E)], B = RG[psTo(E)], T = tvTerr(E);
  const I = d3.geoInterpolate([A.anchor[0], A.anchor[1]], [B.anchor[0], B.anchor[1]]);
  let tM = 0.5; for (let i = 1; i < 60; i++) { const p = I(i / 60), R = tv$(() => regionAt(p[0], p[1]), null); if (!R || R.id !== A.id) { tM = i / 60; break; } }
  const pts = [I(Math.max(0.05, tM * 0.72)), I(Math.max(0.02, tM - 1 / 90)), I(tM + (1 - tM) * 0.22)];
  return pts.map((p, i) => {
    const city = tv$(() => nearestCityName(p[0], p[1]), '');
    return { name: i === 1 ? `${E[3] || PS_T[E[2]].nm} · ${T.st[1]}` : `${T.st[i]}${city ? ' · ' + city : ''}`, lon: p[0], lat: p[1], country: '', tags: [T.tag], cat: T.tag, tv: psKey(E), tvStage: i };
  });
}
// ces étapes ne sont ni « trop loin » ni « bloquées »
if (typeof dfExempt === 'function') dfExempt = (orig => function (d) { return (d && d.tv) ? true : orig.apply(this, arguments); })(dfExempt);
if (typeof rcBlocked === 'function') rcBlocked = (orig => function (d) { return (d && d.tv) ? false : orig.apply(this, arguments); })(rcBlocked);

// les choix de chaque étape (des situations de 85, rangées dans SX_BY)
const TV_SX = {
  montagne: [['Au pied du massif, le sentier se divise. Le guide conseille la route balisée ; un chemin de chamois monte tout droit.', 'Suivre la route balisée', 'Prendre le chemin des chamois'],
    ['Au col, le vent se lève et la neige tombe à gros flocons. La descente est encore loin.', 'Bivouaquer à l’abri des rochers (1 provision Chaleur de plus)', 'Foncer avant que la tempête ne grossisse'],
    ['La descente s’ouvre sur une vallée inconnue. Un vieux sentier part vers un alpage.', 'Descendre tranquillement', 'Explorer l’alpage']],
  glace: [['Au dernier village, les chiens de traîneau aboient. Partir maintenant, ou attendre le bon vent ?', 'Attendre le bon vent', 'Partir tout de suite'],
    ['La banquise craque sous les pattes. La nuit polaire tombe.', 'Monter un igloo et se réchauffer (1 provision Chaleur de plus)', 'Traverser la glace fine de nuit'],
    ['Les aurores éclairent un paysage immense.', 'Suivre les traces des rennes', 'Explorer la côte gelée']],
  desert: [['À la dernière oasis, une caravane va partir. La suivre, ou couper par les dunes ?', 'Suivre la caravane', 'Couper par les dunes'],
    ['Au milieu des dunes, la chaleur écrase tout. Le prochain puits est loin.', 'Attendre la nuit à l’ombre (1 provision Fraîcheur de plus)', 'Continuer sous le soleil'],
    ['Des palmiers à l’horizon ! Un marché anime la première ville.', 'Se reposer au marché', 'Fouiller les ruines au bord de la route']],
  jungle: [['À la lisière, la jungle forme un mur vert. Un pisteur propose un détour.', 'Suivre le pisteur', 'Ouvrir son propre chemin'],
    ['Au cœur de la jungle, l’air est brûlant et les rivières en crue.', 'Faire une pause à l’ombre (1 provision Fraîcheur de plus)', 'Traverser la rivière en crue'],
    ['Une rivière calme mène vers un village.', 'Suivre la rivière', 'Grimper à un arbre géant pour voir le chemin']],
  mer: [['Au port, le ciel est gris. Le capitaine hésite à larguer les amarres.', 'Attendre la marée suivante', 'Partir avec le vent'],
    ['En pleine mer, une houle énorme se lève. La côte n’est plus visible.', 'Réduire la voile et tenir bon (1 provision Endurance de plus)', 'Garder le cap à pleine vitesse'],
    ['L’autre rive approche. Une crique cachée semble attirer les mouettes.', 'Accoster au port', 'Explorer la crique']],
  ocean: [['Au grand port, le voilier attend. L’équipage annonce des semaines de mer.', 'Charger encore des vivres', 'Partir à l’aube'],
    ['Au milieu de l’océan, une tempête approche.', 'Contourner la tempête (1 provision Endurance de plus)', 'Traverser la tempête'],
    ['Terre en vue ! Une île inconnue se dessine avant le continent.', 'Accoster directement', 'Faire escale sur l’île']],
  riviere: [['À l’embarcadère, le courant est fort aujourd’hui.', 'Attendre que le courant baisse', 'Mettre la barque à l’eau'],
    ['Les rapides grondent. Les rochers affleurent partout.', 'Porter la barque le long de la rive (1 provision Endurance de plus)', 'Sauter les rapides'],
    ['L’autre rive est calme. Un moulin tourne au loin.', 'Accoster tranquillement', 'Suivre le bras secret de la rivière']],
  marais: [['À l’entrée du marais, la brume cache les canaux.', 'Attendre que la brume se lève', 'Partir dans la brume'],
    ['Au milieu des canaux, tout se ressemble : roseaux, roseaux, roseaux.', 'Revenir sur ses pas et marquer le chemin (1 provision Endurance de plus)', 'Se fier aux hérons'],
    ['La terre ferme ! Un village de pêcheurs fume au loin.', 'Rejoindre le village', 'Explorer une île de roseaux']],
  foret: [['À l’orée, la forêt est si sombre qu’on n’y voit rien.', 'Allumer la lanterne et avancer doucement', 'Courir jusqu’à la première clairière'],
    ['Au cœur de la forêt, le sentier disparaît. Des voix étranges résonnent.', 'Camper et attendre le jour (1 provision Endurance de plus)', 'Suivre les voix'],
    ['Une clairière baignée de lumière : la sortie est proche.', 'Sortir de la forêt', 'Chercher le vieux chêne dont parlent les contes']],
};
const tvSxId = (terr, i) => `tv_${terr}_${i}`;
function tvSxBuild() {
  Object.entries(TV_SX).forEach(([terr, L]) => {
    const T = TV_T[terr];
    L.forEach(([q, safe, risk], i) => {
      const o = i === 1
        ? [Sf(safe, '{n} prend son temps : prudence au cœur du passage.', { loot: 0, tv: 'safe' }), Rk(risk + ' (sinon : demi-tour)', 0.5, 'Quelle audace ! {n} passe en un temps record et rapporte une trouvaille rare.', { tv: 'ok', loot: 2, luck: 1, stones: 1 }, 'C’est trop dangereux : {n} doit faire demi-tour. Il faudra recommencer la traversée.', { tv: 'ko' })]
        : [Sf(safe, '{n} avance sans se presser.', { loot: 1, tv: 'ok' }), Rk(risk, i === 0 ? 0.65 : 0.6, '{n} gagne du temps et trouve quelque chose en route.', { tv: 'ok', time: 0.6, loot: 1, luck: 1 }, '{n} se perd un peu, mais retrouve le chemin.', { tv: 'ok', time: 1.3 })];
      SX_BY[tvSxId(terr, i)] = { id: tvSxId(terr, i), k: T.kind, tier: 'c', ico: PS_T[terr] ? PS_T[terr].ico : '🧭', q, o };
    });
  });
}
tv$(tvSxBuild);
// les effets « tv »
sxApply = (orig => function (k, t, e) {
  const fx = orig.apply(this, arguments);
  if (e && e.tv && t && t.tv) {
    const D = TV_T[t.tv.terr] || TV_T.riviere;
    if (e.tv === 'safe') {
      if (tvEat(D.pk, 1)) { t.tvRes = 'ok'; fx.push(`🍲 1 provision ${TV_PK[D.pk][0]} mangée`); fx.push('✅ Étape réussie'); }
      else { t.tvRes = 'ko'; fx.push(`❌ Plus de provision ${TV_PK[D.pk][0]} : demi-tour, il faudra recommencer`); }
    } else { t.tvRes = e.tv; fx.push(e.tv === 'ok' ? '✅ Étape réussie' : '↩️ Demi-tour : la traversée est à recommencer'); }
    tv$(save);
  }
  return fx;
})(sxApply);

// la fenêtre du passage (remplace celle de 90)
let tvLvBonus = (k, E) => 0; // v161 : 99_zfaune.js (terrain familier)
function tvReq(E, k) {
  const T = tvTerr(E), g = PS_T[E[2]].gear, G = PS_GEAR[g], s = psSt(), from = psFrom(E), A = RG[from];
  const I = tv$(() => sctInfo(from), { lvl: 0, pct: 0, th: [0, 6, 15, 30, 50], nm: 'Inconnue' }), st = (tvSt()[psKey(E)] || {}).stage || 0;
  const lvB = tv$(() => tvLvBonus(k, E), 0) || 0, lv = Math.max(1, psLv(E) - lvB), myLv = tv$(() => S.prog[k].lvl, 1), nP = tvProvs(T.pk).length, need = 3 - st;
  const okG = psHas(g), okK = I.lvl >= T.kn, okL = myLv >= lv, okP = nP >= 1;
  const gearTx = okG ? `✓ ${esc(G.nm)} (n’importe quelle version)` : PS_SHARED.includes(g) ? `${esc(G.nm)} : au magasin ou à l’atelier, ou ${esc(G.hab.who)} vous en offrira en voyage en ${esc(A.short)}` : s.learn[g] ? `${esc(G.nm)} : à fabriquer à l’atelier (${esc(TV_GEAR[g].why)})` : s.hab[g] ? `${esc(G.nm)} : aidez ${esc(G.hab.who)} (Quêtes › Habitants)` : `${esc(G.nm)} : ${esc(G.hab.who)}, ${esc(G.hab.job)}, vous l’apprendra. On le croise en voyage en ${esc(A.short)}.`;
  return { T, okG, okK, okL, okP, ok: okG && okK && okL && okP, st, html: `<ul class="ps-req">
<li class="${okG ? 'ok' : ''}">🎒 ${gearTx}</li>
<li class="${nP >= need ? 'ok' : okP ? 'mid' : ''}">🍲 ${need} provision${need > 1 ? 's' : ''} ${TV_PK[T.pk][0]} (une par étape, plus une de réserve conseillée) · vous en avez ${nP}<small>${TV_PK[T.pk][1]}</small></li>
<li class="${okK ? 'ok' : ''}">🗺️ Être ${SCT_LV[T.kn].nm} de ${esc(A.short)} · vous êtes ${esc(I.nm)} (${I.pct}/${I.th[T.kn - 1]} % découverts)</li>
<li class="${okL ? 'ok' : ''}">⭐ ${esc(tv$(() => CHARS[k].name, ''))} niveau ${lv} minimum${lvB ? ` <small>(−${lvB} : terrain familier)</small>` : ''} · niveau ${myLv}</li></ul>` };
}
psOpen = function (key) {
  const E = PS_EDGES.find(x => psKey(x) === key); if (!E || psSt().done[key]) return;
  document.getElementById('psG') && document.getElementById('psG').remove();
  const T = PS_T[E[2]], A = RG[psFrom(E)], B = RG[psTo(E)], k = S.sel, R = tvReq(E, k);
  const W = tvWays(E), cur = tvSt()[key], runK = Object.keys(S.trips || {}).find(x => S.trips[x] && S.trips[x].tv && S.trips[x].tv.key === key);
  const away = !!(S.trips && S.trips[k]), aug = tvRouteOf(psFrom(E)) === key;
  const steps = `<ol class="tv-steps">${W.map((w, i) => `<li class="${i < R.st ? 'ok' : i === R.st ? 'cur' : ''}"><span>${i < R.st ? '✓' : i + 1}</span><b>${esc(R.T.st[i])}</b></li>`).join('')}</ol>`;
  let btn;
  if (runK) btn = `<p class="sx-aff">${esc(tv$(() => CHARS[runK].name, ''))} est en route : étape ${S.trips[runK].tv.stage + 1} sur 3.</p>`;
  else btn = `${away ? `<p class="sx-aff" style="background:#fde3e0;color:#b5443a">${esc(tv$(() => CHARS[k].name, ''))} est en voyage : choisissez un autre compagnon en haut de l’écran.</p>` : ''}<button class="btn green big wide" data-tvgo="${key}" ${R.ok && !away ? '' : 'disabled'}>Partir pour l’étape ${R.st + 1}</button>`;
  const el = document.createElement('div'); el.id = 'psG'; el.className = 'ch-ov ch-' + ({ mer: 'mer', ocean: 'mer', riviere: 'mer', marais: 'mer', desert: 'desert' }[E[2]] || 'route');
  el.innerHTML = `<div class="ch-card"><div class="ch-hero"><span class="ch-ico">${T.ico}</span><img src="${tv$(() => portraitURI(k), '')}" alt=""><span class="sx-tier sx-l">Traversée</span></div>
    <p class="cu-k">${esc(A.short)} → ${esc(B.name)}</p><h3 class="ps-h">${esc(E[3] || T.nm)}</h3>
    ${aug ? '<p class="tv-aug">📖 Le chemin d’Augustine</p>' : ''}
    <p class="ch-q">De l’autre côté : ${esc(B.mood || B.name)}</p>
    ${steps}${R.html}${cur && cur.fail ? `<p class="tv-fail">↩️ Dernière tentative : demi-tour. Préparez-vous mieux et repartez.</p>` : ''}
    ${btn}<button class="cu-later" data-psquit="1">Plus tard</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
  PSX = { key, E, k };
};
function tvGo(key) {
  const E = PS_EDGES.find(x => psKey(x) === key), k = S.sel; if (!E || !k || (S.trips && S.trips[k])) return;
  const R = tvReq(E, k); if (!R.ok) return;
  const s = tvSt(), cur = s[key] || (s[key] = { stage: 0 }), W = tvWays(E)[cur.stage];
  tvEat(R.T.pk, 1);
  plan.dest = W; if (!plan.dur) plan.dur = 'eclair';
  tv$(() => psClose());
  startTrip();
  const t = S.trips[k]; if (!t) { save(); return; }
  t.tv = { key, stage: cur.stage, terr: E[2] };
  t.mf = { k: 'choix', v: 2, id: tvSxId(E[2], cur.stage), kind: R.T.kind, at: cur.stage === 1 ? 0.35 : 0.45, st: 'wait' };
  cur.k = k; cur.at = Date.now(); delete cur.fail;
  tv$(() => t.journal.push({ t: Date.now(), kind: 'depart', text: `Étape ${cur.stage + 1} sur 3 de la traversée : ${W.name}.` }));
  save(); tv$(() => renderAll()); tv$(() => toast(`${PS_T[E[2]].ico} Étape ${cur.stage + 1} sur 3 : ${R.T.st[cur.stage]}. Bonne route !`));
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-tvgo]'); if (!b || b.disabled) return;
  ev.stopPropagation(); ev.preventDefault(); tvGo(b.dataset.tvgo);
}, true);
// au retour : étape suivante, demi-tour, ou passage franchi
GAME.on('trip:return', e => tv$(() => {
  const t = e && e.trip; if (!t || !t.tv) return;
  const key = t.tv.key, E = PS_EDGES.find(x => psKey(x) === key), s = tvSt(), cur = s[key] || (s[key] = { stage: 0 }); if (!E) return;
  const D = TV_T[E[2]] || TV_T.riviere;
  let res = t.tvRes;
  if (!res) { // le moment n'a pas été joué : le compagnon a pris le chemin prudent
    if (t.tv.stage === 1) res = tvEat(D.pk, 1) ? 'ok' : 'ko'; else res = 'ok';
  }
  if (res === 'ko') { cur.stage = 0; cur.fail = 1; save(); setTimeout(() => tv$(() => toast(`↩️ ${E[3] || PS_T[E[2]].nm} : demi-tour ! La traversée est à recommencer depuis le début.`)), 1200); return; }
  cur.stage = t.tv.stage + 1;
  if (cur.stage < 3) { save(); setTimeout(() => tv$(() => toast(`${PS_T[E[2]].ico} Étape ${cur.stage} réussie ! Prochaine : ${D.st[cur.stage]}. Touchez le passage sur la carte.`)), 1200); return; }
  // franchi !
  const to = psTo(E), B = RG[to];
  psSt().done[key] = Date.now(); delete s[key];
  rcSt().open[to] = { need: 3, at: Date.now() };
  tv$(() => addXP(t.comp || e.who, 80));
  tv$(() => rcCheck(true)); save();
  setTimeout(() => tv$(() => {
    showModal(`<div class="cn-page"><p class="cn-k">Traversée réussie</p><h2>${PS_T[E[2]].ico} ${esc(E[3] || PS_T[E[2]].nm)}</h2><p class="cn-txt">${esc((PS_TXT[E[2]] || ['', '', '', 'Une nouvelle région s’ouvre.'])[3].replace(/\{n\}/g, tv$(() => CHARS[t.comp || e.who].name, '')))} Augustine est passée par ici avant vous. Son camp vous attend quelque part en ${esc(B.short)}.</p>
<ul class="cn-steps aug-gain"><li><span>🗺️</span><div><b>Nouvelle région : ${esc(B.name)}</b><small>Découvrez la région pour trouver le camp d’Augustine.</small></div></li><li><span>✨</span><div><b>+80 expérience</b><small>pour ${esc(tv$(() => CHARS[t.comp || e.who].name, ''))}</small></div></li></ul><button class="btn green big wide" data-closemodal="1">Découvrir ${esc(B.short)}</button></div>`);
    confetti(true); drawMarks();
    map.flyTo({ center: [B.anchor[0], B.anchor[1]], zoom: Math.max(4.5, map.getZoom() - 0.5), duration: 1600 });
  }), 1600);
}));
// le chapitre « La première frontière » explique la traversée
tv$(() => { const C = AK_CH.find(c => c.nm === 'La première frontière'); if (C) C.steps[0].sub = 'Équipement, provisions du bon genre, connaître la région : puis 3 étapes. Touchez l’icône du passage sur la carte.'; });
window.__tv = { ways: key => tvWays(PS_EDGES.find(x => psKey(x) === key)), st: () => tvSt(), known: key => tvKnown(PS_EDGES.find(x => psKey(x) === key)), go: key => tvGo(key) };

{
  const css = document.createElement('style');
  css.textContent = `
.tv-aug{margin:-2px 0 6px;display:inline-block;padding:2px 10px;border-radius:999px;background:#ffe7c9;border:1.5px dashed #e0701a;font:800 12px var(--body,system-ui);color:#9a4a0e}
.tv-steps{list-style:none;display:flex;gap:4px;margin:0 0 8px;padding:0}.tv-steps li{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 2px;border-radius:12px;background:#f4efe6}
.tv-steps li span{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e7dcc4;font:900 12px var(--display,system-ui);color:#6a5040}
.tv-steps li b{font:700 11px/1.2 var(--body,system-ui);color:#4a3528;text-align:center}.tv-steps li.ok span{background:#7fc462;color:#fff}.tv-steps li.cur{background:#fff3c9;box-shadow:0 0 0 2px #f2c14e}.tv-steps li.cur span{background:#f2c14e;color:#4a3528}
.ps-req li small{display:block;font-weight:600;font-size:11.5px;opacity:.85}.ps-req li.mid{background:#fff3c9;color:#6b4f12}
.tv-fail{margin:0 0 8px;padding:6px 10px;border-radius:12px;background:#fde3e0;font:700 12.5px var(--body,system-ui);color:#b5443a}
`;
  document.head.appendChild(css);
}

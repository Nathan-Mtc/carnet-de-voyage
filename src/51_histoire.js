// ================= v37 : L'HISTOIRE « LE CARNET D'AUGUSTINE » (saison 1) =================
// Augustine, vieille panda roux exploratrice et ancienne propriétaire de la maison, a disparu. Son carnet a perdu 8 pages,
// cachées dans le monde. Chaque CHAPITRE (données ci-dessous, STY_CHAPS) vise un TYPE de lieu, résolu au début du chapitre
// vers le lieu RÉEL le plus proche de la maison (styResolve), et chaque chapitre s'éloigne un peu plus.
// L'histoire avance PAR L'EXPLORATION, jamais par la vente : indice → dévoiler N zones → trouver K secrets (dont 1 secret
// d'Augustine) → atteindre le lieu final PRÉPARÉ (portée de 50_difficulte.js, matériel de 41_expedition.js) → page trouvée,
// BD de fin, objet d'Augustine (du vrai matériel, plus fort), GAME.emit('story:chapter', { n, zones }).
// Brouillard (52_modes.js, s'il existe) : exZoneRevealed(id), exZoneSecrets(id), exAddStorySecret(id, {...}), exReveal(ids).
// Sinon, repli interne : une zone est dévoilée quand un voyage revient de ses environs (ou de la même zone de RG_ZONES).
// Une seule checklist (styListHTML) : en haut de la page Histoire, sur la carte d'action, cible entourée + flèche sur la carte.
// État : S.story = { season, n (chapitre en cours, 1 à 8), ch: { n: {...} }, ch0: choix, end, conv, annex }.
// Enveloppes : nextAction, renderActionCard, QM_HTML.hist. Tests : window.__sty.

const styCall = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const styTuto = () => styCall(() => tuOn(), false) || styCall(() => document.body.classList.contains('firstrun'), false);
const STY_SEASON = 1;

// ---------------- les lieux réels par type (s'ajoutent à PLACES et XP_PLACES) ----------------
// [nom, lat, lon]
const STY_SPOTS = {
  sommet: [['Puy de Dôme', 45.772, 2.964], ['Mont Ventoux', 44.174, 5.279], ['Pic du Midi de Bigorre', 42.936, 0.142], ['Mont Tremblant', 46.211, -74.585], ['Mont Washington', 44.270, -71.303], ['Ben Nevis', 56.797, -5.004], ['Mont Fuji', 35.361, 138.727], ['Montagne de la Table', -33.963, 18.403], ['Mont Olympe', 40.086, 22.358], ['Ballon d’Alsace', 47.822, 6.840], ['Mont Aigoual', 44.121, 3.581], ['Mont Mitchell', 35.765, -82.265], ['Mont Rainier', 46.853, -121.760], ['Mont Kosciuszko', -36.456, 148.263]],
  cote: [['Phare d’Eckmühl', 47.797, -4.372], ['Phare de Cordouan', 45.586, -1.174], ['Phare du Planier', 43.199, 5.230], ['Phare de la Hague', 49.717, -1.942], ['Phare de Pointe-au-Père', 48.517, -68.469], ['Phare de Peggy’s Cove', 44.492, -63.918], ['Phare de Portland Head', 43.623, -70.208], ['Phare du cap Hatteras', 35.250, -75.529], ['Phare de Fastnet', 51.389, -9.603], ['Phare de Lindesnes', 57.982, 7.047], ['Phare du cap de Bonne-Espérance', -34.357, 18.497], ['Phare du cap Roca', 38.781, -9.499], ['Phare de Nividic', 48.446, -5.149], ['Phare d’Alexandrie (vestiges)', 31.214, 29.885]],
  grotte: [['Gouffre de Padirac', 44.858, 1.750], ['Grotte Chauvet', 44.389, 4.416], ['Grottes de Han', 50.123, 5.187], ['Grotte de Postojna', 45.783, 14.204], ['Caverne de Saint-Léonard', 45.587, -73.596], ['Mammoth Cave', 37.187, -86.100], ['Grottes de Waitomo', -38.261, 175.104], ['Cuevas del Drach', 39.535, 3.330], ['Grotte de Lascaux', 45.054, 1.169], ['Grottes de Luray', 38.664, -78.483], ['Gouffre de Proumeyssac', 44.902, 0.953]],
  desert: [['Bardenas Reales', 42.200, -1.470], ['Désert de Tabernas', 37.050, -2.390], ['Erg Chebbi (Merzouga)', 31.080, -4.013], ['Vallée de la Mort', 36.505, -117.079], ['White Sands', 32.780, -106.172], ['Désert d’Atacama', -23.863, -69.135], ['Désert de Gobi', 43.500, 103.500], ['Wadi Rum', 29.576, 35.420], ['Désert du Namib', -24.733, 15.293], ['Désert d’Agafay', 31.452, -8.168], ['Désert des Agriates', 42.700, 9.160]],
  froid: [['Glacier du Vatnajökull', 64.400, -16.800], ['Svalbard', 78.223, 15.646], ['Rovaniemi', 66.503, 25.729], ['Iqaluit', 63.749, -68.522], ['Churchill, baie d’Hudson', 58.768, -94.165], ['Kiruna', 67.856, 20.225], ['Nuuk (Groenland)', 64.181, -51.694], ['Tromsø', 69.649, 18.955], ['Mer de Glace', 45.922, 6.917], ['Yellowknife', 62.454, -114.372]],
  ile: [['Île de Madère', 32.750, -16.980], ['Îles Féroé', 62.010, -6.770], ['Île de Flores (Açores)', 39.440, -31.200], ['Îles Lofoten', 68.209, 13.880], ['Seychelles', -4.620, 55.450], ['Îles Galápagos', -0.700, -90.500], ['Île de Sable', 43.934, -59.915], ['Îles de la Madeleine', 47.380, -61.860], ['Île Maurice', -20.348, 57.552], ['Île de Pâques', -27.113, -109.350], ['Île de Skye', 57.270, -6.210], ['Bora-Bora', -16.500, -151.741]],
};
// continent grossier d'un point (pour « un autre continent »)
function styCont(lat, lon) {
  if (lat < -60) return 'ant';
  if (lon >= -170 && lon <= -30) return lat >= 13 ? 'nam' : 'sam';
  if (lon > 110 && lat < -10) return 'oce';
  if (lon > 150 || lon < -170) return 'oce';
  if (lon >= -30 && lon <= 50 && lat >= 35) return 'eur';
  if (lon >= -20 && lon <= 52 && lat < 35) return 'afr';
  return 'asi';
}

// ---------------- les 8 chapitres (DONNÉES) ----------------
// type : quel lieu chercher (résolu par styResolve) · zn : zones à dévoiler · sk : secrets (dont 1 d'Augustine)
// gear : matériel demandé pour atteindre le lieu final ([type, niveau] de XP_GEAR) · rw : objet d'Augustine gagné
// intro / fin : cases de BD [scène, personnages, texte] ; {lieu} {final} {maison} {comp} sont remplacés
// choix : { q, a: [texte, texte], k } ; k = nom du choix, relu à la fin de la saison
// sec : noms des secrets ordinaires · aug : le secret d'Augustine de ce chapitre
const STY_CHAPS = [
  { n: 1, type: 'maison', nm: 'Le grenier', tag: 'Autour de la maison', zn: 2, sk: 2, gear: null,
    hint: 'Augustine notait : « Mes premiers pas d’exploratrice ? Juste autour de {maison}. Le vieux {final} garde mon secret. »',
    sec: ['Une plume rousse coincée dans une grille', 'Une vieille carte postale signée « A. »'],
    aug: ['Le banc d’Augustine', 'Ses initiales gravées dans le bois : « A. — 1962 ».'],
    rw: { name: 'Boussole d’Augustine', g: 'boussole', tier: 2, col: '#c9a35a', why: 'Une boussole pro : votre portée grandit beaucoup.' },
    intro: [['grenier', ['me'], 'Au grenier de la maison, {comp} trouve un vieux carnet couvert de poussière.'], ['grenier', ['aug'], '« Le carnet d’Augustine, exploratrice. » Une photo : une vieille panda roux, chapeau sur la tête.'], ['grenier', ['me'], 'Huit pages ont été arrachées ! Il reste un indice : tout commence autour de {maison}.']],
    fin: [['parc', ['me'], 'Sous le {final}, une boîte en fer. Dedans : la page 1 du carnet !'], ['parc', ['mou'], 'Monsieur Moustache s’approche : « Augustine ? Je l’ai connue. Elle ne s’est jamais perdue… elle se cachait. »'], ['parc', ['gas'], 'Derrière un arbre, Gaspard le renard ricane : « Son trésor sera à moi ! »']] },
  { n: 2, type: 'sommet', nm: 'Le sommet', tag: 'Le sommet le plus proche', zn: 2, sk: 3, gear: ['crampons', 1],
    hint: '« Pour voir loin, il faut monter. J’ai laissé la page 2 tout en haut : {lieu}. »',
    sec: ['Un cairn de pierres bien rangées', 'Un piolet rouillé gravé « A. »'],
    aug: ['Le refuge d’Augustine', 'Sur le registre du refuge, sa signature, et un dessin de sommet.'],
    rw: { name: 'Palmes d’Augustine', g: 'palmes', tier: 2, col: '#4fb3d9', why: 'Des palmes pro, pour la côte du prochain chapitre.' },
    intro: [['sommet', ['mou'], 'Monsieur Moustache lit la page 1 : « {lieu}… Elle adorait ce sommet. »'], ['sommet', ['me'], 'Là-haut, il faudra des crampons. Le magasin et l’atelier en ont.'], ['sommet', ['gas'], 'Gaspard est déjà en route, avec un énorme sac à dos.']],
    fin: [['sommet', ['gas'], 'Au sommet, Gaspard a glissé dans une crevasse ! Il appelle à l’aide.']],
    choix: { k: 'gaspard', q: 'Que faites-vous ?', a: ['Tendre la corde à Gaspard', 'Prendre la page et filer'], r: ['Gaspard, remonté, bougonne un « merci ». Il n’oubliera pas.', 'Vous filez avec la page 2. Gaspard crie de rage.'] },
    fin2: [['sommet', ['me'], 'La page 2 était sous le cairn : « Ensuite, j’ai suivi le vent jusqu’à la mer. »']] },
  { n: 3, type: 'cote', nm: 'La lumière du phare', tag: 'La côte la plus proche', zn: 2, sk: 3, gear: ['palmes', 1],
    hint: '« Le gardien du phare a gardé ma page 3 : {lieu}. Mais le chemin passe sous l’eau. »',
    sec: ['Une bouteille avec un message effacé', 'Un coquillage peint en rouge'],
    aug: ['La barque d’Augustine', 'Une petite barque nommée « Augustine », retournée sur le sable.'],
    rw: { name: 'Lanterne d’Augustine', g: 'lampe', tier: 2, col: '#f2c14e', why: 'Une lampe pro : la grotte du prochain chapitre est très sombre.' },
    intro: [['phare', ['me'], 'La page 2 parle de {lieu}. On entend déjà les vagues.'], ['phare', ['mou'], '« La page est au pied du phare, sous l’eau à marée haute. Prenez des palmes ! »']],
    fin: [['phare', ['me'], 'Au pied de {final}, un coffre bien fermé : la page 3 !'], ['phare', ['aug'], 'Un souvenir dessiné : Augustine jeune, avec un mystérieux animal lumineux.'], ['phare', ['me'], '« Mon familier n’aime pas le bruit. Je l’emmène sous terre. »']] },
  { n: 4, type: 'grotte', nm: 'Sous la terre', tag: 'La grotte la plus proche', zn: 2, sk: 3, gear: ['lampe', 1],
    hint: '« Sous {lieu}, il fait noir comme dans un four. Ma page 4 brille un peu. »',
    sec: ['Des empreintes de petite patte', 'Une fresque de lucioles sur la paroi'],
    aug: ['Le campement d’Augustine', 'Une tasse ébréchée et une couverture rouge, bien pliée.'],
    rw: { name: 'Gourde d’Augustine', g: 'gourde', tier: 2, col: '#7fbf9f', why: 'Une gourde pro : le désert du prochain chapitre est brûlant.' },
    intro: [['grotte', ['me'], 'Direction {lieu}. Une lampe frontale sera indispensable.'], ['grotte', ['gas'], 'Gaspard attend à l’entrée : « Cette fois, je passe devant ! »']],
    fin: [['grotte', ['me'], 'Au fond de la grotte, un cristal qui chante. La page 4 est coincée dessous.']],
    choix: { k: 'cristal', q: 'Le cristal est magnifique…', a: ['Le laisser à sa place', 'L’emporter pour la boutique'], r: ['Le cristal reste. La grotte semble vous remercier.', 'Le cristal ira en vitrine. Une lucarne s’éteint dans la grotte…'] },
    fin2: [['grotte', ['aug'], 'Page 4 : « Mon familier a besoin de chaleur et de silence. J’ai pensé au désert. »']] },
  { n: 5, type: 'desert', nm: 'Le sable qui chante', tag: 'Le désert le plus proche', zn: 2, sk: 3, gear: ['gourde', 1],
    hint: '« Dans {lieu}, j’ai planté ma page 5 sous l’unique arbre. »',
    sec: ['Une rose des sables', 'Une boussole tombée d’un sac'],
    aug: ['La tente d’Augustine', 'Les piquets de sa tente, encore plantés, avec un ruban rouge.'],
    rw: { name: 'Manteau d’Augustine', g: 'manteau', tier: 2, col: '#9fd1d8', why: 'Un manteau pro : le grand froid vous attend.' },
    intro: [['desert', ['mou'], '« {lieu}. Prenez de l’eau, beaucoup d’eau. »'], ['desert', ['me'], 'Sans gourde, impossible d’atteindre l’arbre solitaire.'], ['desert', ['gas'], 'Gaspard a une carte… mais elle est à l’envers.']],
    fin: [['desert', ['me'], 'Sous l’arbre solitaire de {final}, la page 5.'], ['desert', ['aug'], '« Mon familier a grandi. Il lui faut du froid, des aurores et de la neige. »'], ['desert', ['mou'], '« Elle est partie vers le grand froid. Couvrez-vous ! »']] },
  { n: 6, type: 'froid', nm: 'Le grand froid', tag: 'Le grand froid le plus proche', zn: 2, sk: 3, gear: ['manteau', 1],
    hint: '« À {lieu}, sous les aurores, ma page 6 dort dans la glace. »',
    sec: ['Une moufle rouge', 'Un igloo à la porte ronde'],
    aug: ['Le traîneau d’Augustine', 'Un traîneau gravé d’une patte de panda roux.'],
    rw: { name: 'Jumelles d’Augustine', g: 'jumelles', tier: 2, col: '#3b4a7a', why: 'Des jumelles pro, pour repérer les animaux rares.' },
    intro: [['froid', ['me'], 'Direction {lieu}. Le vent pique le museau.'], ['froid', ['gas'], 'Gaspard grelotte : « Ce trésor… a intérêt à être chaud. »']],
    fin: [['froid', ['me'], 'Sous les aurores de {final}, la page 6 dans un bloc de glace.']],
    choix: { k: 'partage', q: 'Gaspard grelotte à côté de vous.', a: ['Partager votre couverture', 'Garder vos forces'], r: ['Gaspard se blottit. « Peut-être… qu’on pourrait chercher ensemble ? »', 'Gaspard repart seul dans la tempête.'] },
    fin2: [['froid', ['aug'], 'Page 6 : « Pour finir, j’ai traversé l’océan. Sur un autre continent, j’ai caché la carte. »']] },
  { n: 7, type: 'continent', nm: 'L’autre rive', tag: 'Un autre continent', zn: 2, sk: 3, gear: ['jumelles', 1],
    hint: '« Sur un autre continent, à {lieu}, la page 7 est une carte. Il faut de bons yeux pour la lire. »',
    sec: ['Une plume d’oiseau rare', 'Une lettre adressée à « M. Moustache »'],
    aug: ['L’auberge d’Augustine', 'L’aubergiste se souvient : « Une vieille panda roux, si gentille ! »'],
    rw: { name: 'Rose des vents d’Augustine', g: 'boussole', tier: 3, col: '#e0a52a', why: 'Une boussole légendaire : assez de portée pour le sanctuaire.' },
    intro: [['continent', ['mou'], '« {lieu}… Là-bas, tout est différent. Emportez des jumelles. »'], ['continent', ['me'], 'C’est le plus long voyage jamais tenté. Préparez la portée !']],
    fin: [['continent', ['me'], 'À {final}, la page 7 : une carte, avec une île entourée de rouge.'], ['continent', ['mou'], 'Monsieur Moustache sourit : « Le sanctuaire. Elle m’en a parlé, une seule fois. »'], ['continent', ['gas'], 'Gaspard a vu la carte, lui aussi. La course finale commence !']] },
  { n: 8, type: 'ile', nm: 'Le sanctuaire', tag: 'Le sanctuaire secret', zn: 2, sk: 3, gear: ['boussole', 1],
    hint: '« Mon sanctuaire est à {lieu}. Il faut une très bonne boussole pour le trouver. »',
    sec: ['Un jardin de fleurs lumineuses', 'Un ponton couvert de lanternes'],
    aug: ['La porte d’Augustine', 'Une petite porte ronde, peinte en rouge, dans la colline.'],
    rw: { name: 'Chapeau d’Augustine', look: 'explorateur', slot: 'tete', col: '#e3cf9c', why: 'Son chapeau d’exploratrice : on voyage plus loin avec.' },
    intro: [['ile', ['me'], 'Dernière page : {lieu}. Le carnet est presque complet.'], ['ile', ['gas'], 'Gaspard est déjà sur la plage, essoufflé.']],
    fin: [['sanct', ['aug'], 'Derrière la porte ronde : Augustine ! Bien vivante, avec son familier légendaire.'], ['sanct', ['aug', 'me'], '« Vous avez retrouvé toutes mes pages. Le carnet est à vous, maintenant. »'], ['sanct', ['ending'], '']] },
];
const STY_N = STY_CHAPS.length;

// ---------------- état (créé à la demande : les anciennes sauvegardes restent valables) ----------------
function styState() {
  if (!S.story || typeof S.story !== 'object' || Array.isArray(S.story)) S.story = {};
  const T = S.story;
  if (!T.season) T.season = STY_SEASON;
  if (!(T.n >= 1 && T.n <= STY_N)) T.n = 1;
  if (!T.ch || typeof T.ch !== 'object') T.ch = {};
  if (!T.cx || typeof T.cx !== 'object') T.cx = {};
  if (!T.conv) styConvert(T);
  return T;
}
const styHome = () => styCall(() => homeObj(), { name: 'Lyon', lat: 45.764, lon: 4.8357 });
const styKm = (a, b) => styCall(() => kmBetween(a, b), 1e9);
const styFill = (s, C, s2) => String(s || '').replace(/\{lieu\}/g, s2 && s2.t ? s2.t.lieu : '').replace(/\{final\}/g, s2 && s2.t ? s2.t.name : '').replace(/\{maison\}/g, styHome().name).replace(/\{comp\}/g, styCall(() => CHARS[S.sel].name, 'Pistache'));

// candidats d'un type : nos lieux réels + PLACES + XP_PLACES qui correspondent
function styCands(type) {
  const out = [], P = p => (Array.isArray(p) ? { name: p[0], lat: p[2], lon: p[3], tags: p[4] || [] } : p);
  const add = (name, lat, lon, tags) => { if (isFinite(lat) && isFinite(lon)) out.push({ name, lat: +lat, lon: +lon, tags: tags || [] }); };
  const TG = { sommet: ['montagne'], cote: ['mer'], grotte: ['montagne', 'foret'], desert: ['desert'], froid: ['neige'], ile: ['ile', 'mer'] };
  if (type === 'continent') {
    Object.keys(STY_SPOTS).forEach(t => STY_SPOTS[t].forEach(([n, la, lo]) => add(n, la, lo, TG[t])));
    styCall(() => PLACES.forEach(p => { p = P(p); add(p.name, p.lat, p.lon, p.tags); }), 0);
    return out;
  }
  (STY_SPOTS[type] || []).forEach(([n, la, lo]) => add(n, la, lo, TG[type]));
  styCall(() => PLACES.forEach(p => { p = P(p); const t = p.tags || [];
    if ((type === 'sommet' && t.includes('montagne') && !t.includes('ville')) || (type === 'froid' && t.includes('neige') && Math.abs(p.lat) > 55) || (type === 'ile' && t.includes('ile'))) add(p.name, p.lat, p.lon, t); }), 0);
  styCall(() => XP_PLACES.forEach(X => { if ((type === 'grotte' && X.ctx === 'cave') || (type === 'desert' && X.terr === 'desert' && X.ctx !== 'wild') || (type === 'froid' && X.terr === 'froid')) add(X.name, X.lat, X.lon, X.tags); }), 0);
  return out;
}
// RÉSOLUTION d'un chapitre pour une maison donnée : le lieu réel le plus proche, au moins aussi loin que le chapitre d'avant
function styResolve(n, home, prevKm, used) {
  const C = STY_CHAPS[n - 1]; home = home || styHome(); prevKm = prevKm || 0; used = used || [];
  const off = (la, lo, dla, dlo) => ({ lat: +(la + dla).toFixed(4), lon: +(lo + dlo).toFixed(4) });
  let t;
  if (C.type === 'maison') {
    let p = null;
    try { if (home.name === styHome().name) p = nearestPOI(x => ['parc', 'jardin'].includes(x.cat)); } catch (e) { p = null; }
    const o = p && styKm(home, p) <= 6 ? { lat: p.lat, lon: p.lon } : off(home.lat, home.lon, 0.012, 0.016);
    t = { name: `kiosque ${p && p.name ? 'près de ' + p.name : 'du vieux parc de ' + home.name}`, lieu: `les rues de ${home.name}`, ...o, tags: ['campagne', 'ville'] };
    t.km = styKm(home, t);
    const z = [{ nm: `Le nord de ${home.name}`, ...off(home.lat, home.lon, 0.03, 0.004) }, { nm: `Le sud de ${home.name}`, ...off(home.lat, home.lon, -0.028, -0.01) }];
    return { t, z: styZoneIds(n, z), a: { nm: C.aug[0], ...off(home.lat, home.lon, -0.016, 0.026) }, r: [1.6, 1, 1] };
  }
  const contH = styCont(home.lat, home.lon), min = Math.max(prevKm, 30);
  let L = styCands(C.type).filter(c => !used.includes(c.name)).map(c => ({ c, d: styKm(home, c) }));
  if (C.type === 'continent') L = L.filter(x => styCont(x.c.lat, x.c.lon) !== contH);
  L.sort((a, b) => a.d - b.d);
  const pick = L.find(x => x.d >= min) || L[L.length - 1] || { c: { name: 'Île mystérieuse', lat: 0, lon: 0, tags: ['ile'] }, d: 0 };
  const c = pick.c, lieu = C.type === 'ile' ? `${c.name}` : c.name;
  t = { name: C.type === 'ile' ? `sanctuaire secret (${c.name})` : c.name, lieu, lat: c.lat, lon: c.lon, tags: (c.tags || []).slice(), km: pick.d, base: c.name };
  // les 2 zones : les abords (côté maison) et les environs (de l'autre côté)
  const dla = home.lat - c.lat, dlo = home.lon - c.lon, L2 = Math.hypot(dla, dlo) || 1, ux = dla / L2, uy = dlo / L2;
  const z = [{ nm: `Les abords de ${c.name}`, ...off(c.lat, c.lon, 0.22 * ux, 0.22 * uy) }, { nm: `Les environs de ${c.name}`, ...off(c.lat, c.lon, -0.2 * uy, 0.2 * ux) }];
  return { t, z: styZoneIds(n, z), a: { nm: C.aug[0], ...off(c.lat, c.lon, 0.05, -0.07) }, r: [35, 18, 15] };
}
function styZoneIds(n, z) {
  const seen = {};
  const za = exFn('exZoneAt');
  return z.map((o, i) => { const R = za ? styCall(() => za(o.lon, o.lat), null) : styCall(() => rgZoneAt(o.lon, o.lat).id, null), r = R && typeof R === 'object' ? R.id : R; const id = r && !seen[r] ? r : `sty${n}_${i + 1}`; seen[id] = 1; return { id, ...o }; });
}
// chapitre n : son état (résolu une seule fois, au début du chapitre)
function styCh(n) {
  const T = styState();
  if (!T.ch[n]) {
    const prev = T.ch[n - 1], used = Object.values(T.ch).map(x => x && x.t && x.t.base).filter(Boolean);
    const R = styResolve(n, styHome(), prev && prev.t ? prev.t.km : 0, used);
    T.ch[n] = { st: 'intro', t: R.t, z: R.z, a: R.a, r: R.r, rev: {}, sec: 0, augF: 0, home: styHome().name };
  }
  return T.ch[n];
}
const styC = (n) => STY_CHAPS[(n || styState().n) - 1];

// ---------------- progression ----------------
const exFn = nm => { const f = styCall(() => window[nm], null) || styCall(() => styExLook(nm), null); return typeof f === 'function' ? f : null; };
function styExLook(nm) { switch (nm) { case 'exZoneRevealed': return typeof exZoneRevealed === 'function' ? exZoneRevealed : null; case 'exZoneSecrets': return typeof exZoneSecrets === 'function' ? exZoneSecrets : null; case 'exAddStorySecret': return typeof exAddStorySecret === 'function' ? exAddStorySecret : null; case 'exReveal': return typeof exReveal === 'function' ? exReveal : null; } return null; }
const styRev = (s, z) => !!(s.rev[z.id] || styCall(() => { const f = exFn('exZoneRevealed'); return f ? f(z.id) === true : false; }, false));
const styRevN = s => s.z.filter(z => styRev(s, z)).length;
function styExSec(s) {
  const f = exFn('exZoneSecrets'); if (!f) return 0;
  let n = 0; s.z.forEach(z => styCall(() => { const r = f(z.id) || {}, L = Array.isArray(r) ? r : r.list || []; L.forEach(x => { if (x && !String(x.id || '').startsWith('sty_') && (x.found || x.got || x.done)) n++; }); }, 0));
  return n;
}
const stySecN = (s, C) => Math.min(C.sk - 1, Math.max(s.sec, styExSec(s))) + (s.augF ? 1 : 0);
// étape : 0 lire le début · 1 dévoiler · 2 secrets · 3 lieu final · 4 page à lire · 5 fini
function styStep(n) {
  const s = styCh(n), C = styC(n);
  if (s.st === 'done') return 5; if (s.st === 'fin') return 4; if (s.st === 'intro') return 0;
  if (styRevN(s) < C.zn) return 1;
  if (stySecN(s, C) < C.sk) return 2;
  return 3;
}
// le matériel pour le lieu final
const styGearName = (g, tier) => styCall(() => xpGName(g, tier), g);
function styGearOK(k, C) { if (!C.gear) return true; return styCall(() => xpTierOf(k, C.gear[0]), 0) >= C.gear[1]; }
// voyage revenu : une seule étape avance par voyage (on ne saute rien)
function styOnReturn(dest, who) {
  if (!dest || styTuto()) return;
  const T = styState(); if (T.end) return;
  const n = T.n, s = styCh(n), C = styC(n), st = styStep(n), near = (p, r) => styKm(dest, p) <= r;
  if (st === 0 || st >= 4) return;
  let msg = '';
  if (st === 1) {
    const z = s.z.find(z => !styRev(s, z) && (near(z, s.r[0]) || styCall(() => rgZoneAt(dest.lon, dest.lat).id === z.id, false)));
    if (z) { s.rev[z.id] = Date.now(); const f = exFn('exReveal'); if (f) styCall(() => f([z.id]), 0); const k = styRevN(s); msg = `Carnet d’Augustine : ${z.nm} dévoilé (${k}/${C.zn}).${k >= C.zn ? ' Cherchez maintenant les secrets !' : ''}`; }
    else if (near(s.t, s.r[0] * 2)) msg = 'Le carnet reste muet : dévoilez d’abord les zones de l’indice.';
  } else if (st === 2) {
    if (!s.augF && near(s.a, s.r[1])) { s.augF = 1; msg = `Secret d’Augustine : ${C.aug[0]}. ${C.aug[1]}`; }
    else if (s.z.some(z => near(z, s.r[0])) || near(s.t, s.r[0])) {
      if (s.sec < C.sk - 1) { msg = `Secret trouvé : ${C.sec[s.sec % C.sec.length]} (${stySecN({ ...s, sec: s.sec + 1 }, C)}/${C.sk}).`; s.sec++; }
      else if (!s.augF) msg = `Il reste le secret d’Augustine : ${C.aug[0]}. Touchez « Y aller » dans le carnet.`;
    }
  } else if (st === 3 && near(s.t, s.r[2])) {
    if (!styGearOK(who, C)) msg = `Sans ${styGearName(C.gear[0], C.gear[1]).toLowerCase()}, impossible d’atteindre ${s.t.name}. Équipez-le (Compagnons › Talents), puis repartez.`;
    else { styPage(n); return; }
  }
  if (msg) { save(); styToastLater(msg); styRefresh(); }
}
function styToastLater(msg) { setTimeout(() => styCall(() => toast(msg), 0), 900); }
// PAGE TROUVÉE : objet d'Augustine, événement pour l'exploration, BD de fin à lire
function styPage(n) {
  const T = styState(), s = styCh(n), C = styC(n);
  s.st = 'fin'; s.at = Date.now();
  const it = styGive(C.rw); s.item = it ? it.name : '';
  GAME.emit('story:chapter', { n, zones: s.z.map(z => z.id) });
  save();
  styToastLater(`Page ${n} du carnet retrouvée ! Vous recevez : ${C.rw.name}.`);
  T.pend = n; styRefresh();
  setTimeout(styAutoBD, 1600);
}
// les objets d'Augustine : du vrai matériel (version « pro » ou légendaire), reconnu par 41_expedition.js
STY_CHAPS.forEach(C => { const R = C.rw; if (R && R.g) styCall(() => { XP_GBY[R.name] = { g: R.g, tier: R.tier }; }, 0); });
function styGive(R) {
  if (!R) return null;
  const def = R.g ? [R.name, 'm', 'outil', R.tier >= 3 ? 4 : 3, null, R.col] : [R.name, 'v', R.slot, 4, R.look, R.col];
  const it = styCall(() => makeItem(def, 0, 'Le carnet d’Augustine', [], { fixed: def[3], special: true }), null);
  if (!it) return null;
  it.aug = 1; S.inv.push(it); S.dex[it.name] = true;
  return it;
}

// ---------------- « Y aller » : le bon familier, le bon lieu, ou ce qui manque ----------------
function styTarget(n) {
  const s = styCh(n), C = styC(n), st = styStep(n);
  if (st === 1) { const z = s.z.find(z => !styRev(s, z)) || s.z[0]; return { name: z.nm, lat: z.lat, lon: z.lon }; }
  if (st === 2) { if (s.sec < C.sk - 1 || s.augF) { const z = s.z[s.sec % s.z.length]; return { name: z.nm, lat: z.lat, lon: z.lon }; } return { name: s.a.nm, lat: s.a.lat, lon: s.a.lon, aug: 1 }; }
  if (st === 3) return { name: s.t.name, lat: s.t.lat, lon: s.t.lon, fin: 1 };
  return null;
}
const styDest = (n, P) => ({ id: null, name: P.name.charAt(0).toUpperCase() + P.name.slice(1), country: '', lat: P.lat, lon: P.lon, tags: (styCh(n).t.tags || []).slice(), special: null, sty: n });
function styWho(n, d, fin) {
  const team = styCall(() => teamIds(), Object.keys(S.comps || {})).filter(k => CHARS[k] && S.comps[k]);
  const free = team.filter(k => !S.trips[k]); if (!free.length) return { k: null };
  const C = styC(n), score = k => (fin && !styGearOK(k, C) ? 0 : 2) + (styCall(() => dfCheck(k, d).ok, true) ? 1 : 0) + (k === S.sel ? 0.5 : 0);
  return { k: free.slice().sort((a, b) => score(b) - score(a))[0] };
}
// ce qui manque pour une étape (texte clair avec la solution), ou ''
function styMiss(n, k, d, fin) {
  const C = styC(n);
  if (!k) return 'Toute l’équipe est en voyage : attendez le retour d’un familier.';
  if (fin && !styGearOK(k, C)) {
    const g = C.gear[0], nm = styGearName(g, C.gear[1]), where = ['lampe', 'boussole'].includes(g) ? 'fabriquez-la à l’atelier (onglet Équipement)' : 'achetez-le au magasin ou fabriquez-le à l’atelier';
    return `Il manque du matériel : ${nm}. Pour l’avoir, ${where}, puis équipez-le à ${CHARS[k].name} (Compagnons › Talents).`;
  }
  const R = styCall(() => dfCheck(k, d), null);
  if (R && !R.ok) return R.msg;
  return '';
}
function styGo() {
  const T = styState(), n = T.n, s = styCh(n), st = styStep(n);
  if (st === 0 || st === 4) return styRead();
  const P = styTarget(n); if (!P) return;
  const d = styDest(n, P), who = styWho(n, d, !!P.fin), miss = styMiss(n, who.k, d, !!P.fin);
  s.miss = miss; save();
  if (miss) { styCall(() => toast(miss), 0); styRefresh(); return { ok: false, msg: miss }; }
  styCall(() => { const m = $('modal'); if (m && m.querySelector('.qt-page')) { m.hidden = true; qtPageOn = false; } }, 0);
  styCall(() => selectComp(who.k), 0);
  plan.dest = d;
  styCall(() => openSheet('voyage'), 0); styCall(() => drawMarks(), 0);
  styCall(() => zoomTo(d.lon, d.lat, n === 1 ? 11 : 6), 0);
  setTimeout(() => styCall(() => toast(`Carnet d’Augustine : ${CHARS[who.k].name} part vers ${d.name}. Choisissez la durée, puis partez !`), 0), 300);
  return { ok: true, k: who.k, dest: d };
}

// ---------------- LA checklist (une seule, partout) ----------------
function styLines(n) {
  const s = styCh(n), C = styC(n), st = styStep(n), rv = styRevN(s), sc = stySecN(s, C);
  const zl = n === 1 ? 'les rues autour de la maison' : `les environs de ${s.t.base || s.t.lieu}`;
  return [
    { i: 1, tx: `Dévoiler ${zl}`, ct: `${rv}/${C.zn} zones` },
    { i: 2, tx: `Trouver ${C.sk} secrets`, ct: `${sc}/${C.sk}`, sub: `dont celui d’Augustine ${s.augF ? '✓' : '☐'}` },
    { i: 3, tx: `Atteindre ${s.t.name}`, ct: '', sub: C.gear ? `préparez : portée + ${styGearName(C.gear[0], C.gear[1]).toLowerCase()}` : 'tout près de la maison' },
  ].map(L => ({ ...L, ok: st > L.i, on: st === L.i }));
}
function styListHTML(n, mini) {
  const T = styState(); n = n || T.n;
  const s = styCh(n), st = styStep(n);
  if (st === 0) return `<div class="sty-list"><div class="sty-l on"><i>☐</i><span><b>Lire le début du chapitre ${n}</b></span><button class="btn green" data-sty="read">Lire</button></div></div>`;
  if (st >= 4) return `<div class="sty-list"><div class="sty-l on"><i>📜</i><span><b>Page ${n} retrouvée !</b><small>Lisez la fin du chapitre</small></span><button class="btn gold" data-sty="read">Lire</button></div></div>`;
  return `<div class="sty-list${mini ? ' mini' : ''}">${styLines(n).map(L => `<div class="sty-l${L.ok ? ' ok' : ''}${L.on ? ' on' : ''}" data-styl="${L.i}"><i>${L.ok ? '✓' : '☐'}</i><span><b>${esc(L.tx)}</b>${L.ct ? ` <em>(${esc(L.ct)})</em>` : ''}${L.sub && !mini ? `<small>${esc(L.sub)}</small>` : ''}${L.on && s.miss ? `<small class="sty-miss">⚠ ${esc(s.miss)}</small>` : ''}</span>${L.on ? '<button class="btn green" data-sty="go">Y aller</button>' : ''}</div>`).join('')}</div>`;
}

// ---------------- la BD plein écran (3 à 4 cases, bouton « Passer ») ----------------
const STY_SC = { grenier: [['ville'], 20], parc: [['campagne'], 16], sommet: [['montagne', 'neige'], 11], phare: [['mer'], 18], grotte: [['montagne', 'foret'], 22], desert: [['desert'], 13], froid: [['neige'], 22], continent: [null, 10], ile: [['ile', 'mer'], 17], sanct: [['ile', 'foret'], 19] };
const STY_AUG_OUT = { tete: 'explorateur', cou: 'echarpe', haut: 'none', bas: 'none', mains: 'none', pieds: 'bottes', dos: 'none' };
let styUid = 0;
function styWhoSVG(w, i, flash) {
  const u = 'sty' + (++styUid);
  const svg = w === 'me' ? styCall(() => drawChar(S.sel, S.outfits[S.sel], 'rire', u), '')
    : w === 'aug' ? styCall(() => drawChar('pistache', STY_AUG_OUT, 'content', u), '')
    : w === 'gas' ? styCall(() => clientSVG(EQ_RIVAL, 'content', u), '')
    : w === 'mou' ? styCall(() => clientSVG(BQC('moustache'), 'joie', u), '') : '';
  return svg ? `<span class="sty-who sty-${w}${flash && w === 'aug' ? ' flash' : ''} p${i}">${svg}</span>` : '';
}
function styCase(n, P) {
  const s = styCh(n), sc = STY_SC[P[0]] || STY_SC.parc, aug = P[1].includes('aug') && n < 8;
  const card = styCall(() => postcardSVG({ place: P[0] === 'grenier' ? 'Le grenier' : s.t.name, title: s.t.base || s.t.name, tags: sc[0] || s.t.tags, hour: sc[1], lon: s.t.lon, lat: s.t.lat }, 'sty' + (++styUid)), '');
  return `<figure class="sty-case${aug ? ' flash' : ''}"><div class="sty-pic">${card}${P[1].map((w, i) => styWhoSVG(w, i, aug)).join('')}</div><figcaption>${esc(styFill(P[2], null, s))}</figcaption></figure>`;
}
// fin de saison : le texte dépend des 3 choix
function styEnding() {
  const T = styState(), cx = T.cx, kind = (cx.gaspard === 0) + (cx.cristal === 0) + (cx.partage === 0);
  const gas = cx.gaspard === 0 && cx.partage === 0;
  return (kind >= 2 ? 'Augustine sourit : « Vous avez le cœur d’une vraie exploratrice. » Son familier légendaire vient se blottir contre vous.' : 'Augustine hoche la tête : « Vous êtes têtu, comme moi à votre âge. » Son familier vous observe, curieux.')
    + (gas ? ' Gaspard, ému, rend la carte qu’il avait volée : désormais, c’est un ami.' : ' Gaspard s’enfuit en jurant de trouver la saison prochaine avant vous.');
}
// file de cases : { n, P } case, { ch } choix, { fn } action, { end } fin de saison
function styQueue(n, which) {
  const C = styC(n), q = [];
  if (which === 'intro') { C.intro.forEach(P => q.push({ n, P })); q.push({ fn: () => { const s = styCh(n); if (s.st === 'intro') s.st = 'go'; styExReg(); } }); return q; }
  C.fin.forEach(P => { if (P[1][0] === 'ending') q.push({ n, txt: styEnding }); else q.push({ n, P }); });
  if (C.choix) { q.push({ n, ch: C.choix }); (C.fin2 || []).forEach(P => q.push({ n, P })); }
  q.push({ n, rw: C.rw });
  q.push({ fn: () => { const T = styState(), s = styCh(n); if (C.choix && T.cx[C.choix.k] == null) T.cx[C.choix.k] = 0; if (s.st !== 'fin') return; s.st = 'done'; if (n < STY_N) { T.n = n + 1; styCh(T.n); } else T.end = 1; } });
  if (n < STY_N) styQueue(n + 1, 'intro').forEach(x => q.push(x)); else q.push({ end: 1 });
  return q;
}
let styQ = null, styQi = 0;
function styRead(replay) {
  const T = styState(), n = replay || T.n, st = replay ? 4 : styStep(n);
  if (!replay && st !== 0 && st !== 4) return;
  styQ = replay ? styQueue(n, 'intro').filter(x => !x.fn).concat(styQueue(n, 'fin').filter(x => !x.fn && !x.end && x.n === n && !x.ch).map(x => x)) : styQueue(n, st === 0 ? 'intro' : 'fin');
  if (replay) styQ.push({ close: 1 });
  styQi = 0; styShow();
}
function styShow() {
  while (styQ && styQ[styQi] && styQ[styQi].fn) { styCall(styQ[styQi].fn, 0); styQi++; save(); }
  let el = $('styBD');
  const x = styQ && styQ[styQi];
  if (!x || x.close) { if (el) el.remove(); styQ = null; styRefresh(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'styBD'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Le carnet d’Augustine'); document.body.appendChild(el); }
  const C = x.n ? styC(x.n) : null, head = C ? `<p class="sty-k">Le carnet d’Augustine · Chapitre ${x.n} : ${esc(C.nm)}</p>` : '';
  let body = '', btns = '<button class="btn green" data-sty="next">Suite</button>';
  if (x.P) body = styCase(x.n, x.P);
  else if (x.txt) body = `<figure class="sty-case"><div class="sty-pic">${styCall(() => postcardSVG({ place: 'Sanctuaire', tags: ['ile', 'foret'], hour: 19 }, 'sty' + (++styUid)), '')}${styWhoSVG('aug', 0)}${styWhoSVG('me', 1)}${styWhoSVG('gas', 2)}</div><figcaption>${esc(x.txt())}</figcaption></figure>`;
  else if (x.ch) { const T = styState(), got = T.cx[x.ch.k];
    body = `<figure class="sty-case"><div class="sty-pic">${styCall(() => postcardSVG({ place: styCh(x.n).t.name, tags: styCh(x.n).t.tags, hour: 15 }, 'sty' + (++styUid)), '')}${styWhoSVG('me', 0)}${styWhoSVG('gas', 1)}</div><figcaption><b>${esc(x.ch.q)}</b>${got != null ? `<br>${esc(x.ch.r[got])}` : ''}</figcaption></figure>`;
    if (got == null) btns = x.ch.a.map((a, i) => `<button class="btn ${i ? 'cream' : 'pink'}" data-sty="choice" data-i="${i}">${esc(a)}</button>`).join(''); }
  else if (x.rw) body = `<div class="sty-rw"><p class="sty-big">📜 Page ${x.n} retrouvée !</p><p>Augustine avait laissé ceci pour vous :</p><p class="sty-big">${esc(x.rw.name)}</p><p>${esc(x.rw.why)}</p><small>Équipez-le dans Compagnons › Talents.</small></div>`;
  else if (x.end) { body = `<div class="sty-rw sty-endsc"><p class="sty-big">Fin de la saison ${STY_SEASON}</p><p>Le carnet d’Augustine est complet. Merci, explorateur !</p><p class="sty-big">La suite bientôt…</p><small>En attendant, l’Exploration, le Monde et les Défis continuent sans fin.</small></div>`; btns = '<button class="btn green" data-sty="next">Fermer</button>'; }
  el.innerHTML = `<div class="sty-bd">${head}<button class="sty-skip" data-sty="skip">Passer ⏭</button>${body}<div class="sty-acts">${btns}</div><p class="sty-dots">${styQ.filter(y => !y.fn).map((y, i) => `<i class="${styQ.filter(z => !z.fn).indexOf(x) === i ? 'on' : ''}"></i>`).join('')}</p></div>`;
}
function styNext() { if (!styQ) return; styQi++; styShow(); }
function stySkip() {
  if (!styQ) return;
  const rest = styQ.slice(styQi); styQ = null;
  rest.forEach(x => { if (x.fn) styCall(x.fn, 0); });
  save(); const el = $('styBD'); if (el) el.remove();
  if (rest.some(x => x.end)) { styQ = [{ end: 1 }]; styQi = 0; styShow(); return; }
  styRefresh();
}
function styChoose(i) {
  const x = styQ && styQ[styQi]; if (!x || !x.ch) return;
  const T = styState(); if (T.cx[x.ch.k] == null) { T.cx[x.ch.k] = i; save(); }
  styShow();
}
function styExReg() {
  const f = exFn('exAddStorySecret'); if (!f) return;
  const T = styState(), n = T.n, s = styCh(n), C = styC(n);
  if (s.st !== 'go' || s.augF || styExReg.done === n) return; styExReg.done = n;
  styCall(() => f(s.z[0].id, { id: 'sty_aug' + n, name: C.aug[0], lon: s.a.lon, lat: s.a.lat, onFound: () => { const s2 = styCh(n); if (!s2.augF && styStep(n) === 2) { s2.augF = 1; save(); styRefresh(); } } }), 0);
}
// après une page trouvée : la BD s'ouvre dès que la fenêtre du butin est fermée (jamais au lancement du jeu)
let styAutoN = 0;
function styAutoBD() {
  const T = styState(); if (!T.pend || $('styBD')) return;
  const m = $('modal');
  if (m && !m.hidden) { if (++styAutoN < 120) setTimeout(styAutoBD, 1000); return; }
  T.pend = 0; styAutoN = 0; if (styStep(T.n) === 4) styRead();
}

// ---------------- conversion des anciennes sauvegardes : les histoires deviennent 3 « récits annexes » ----------------
function styConvert(T) {
  T.conv = 1;
  const q = styCall(() => qtState(), null), ids = styCall(() => QT_STORIES.map(x => x.id), []);
  const pick = [];
  const add = id => { if (id && ids.includes(id) && !pick.includes(id) && pick.length < 3) pick.push(id); };
  if (q) { add(q.follow); ids.forEach(id => { const r = q.st[id]; if (r && !r.done) add(id); }); }
  ['gouter', 'alpes', 'capitaine'].forEach(add); ids.forEach(add);
  T.annex = pick;
  T.oldDone = q ? ids.filter(id => !pick.includes(id) && q.st[id] && q.st[id].done).length : 0;
}

// ---------------- la page Histoire (sobre : le chapitre en cours en grand, le reste replié) ----------------
function styHistHTML() {
  const T = styState(), n = T.n, s = styCh(n), C = styC(n);
  let h = '';
  if (T.end) h += `<div class="sty-hero sty-done"><p class="sty-k">Le carnet d’Augustine · Saison ${T.season}</p><h3>Fin de la saison ${STY_SEASON}</h3><p>Les 8 pages sont retrouvées. La suite bientôt !</p><button class="btn cream" data-sty="replay" data-n="${STY_N}">Revoir la fin</button></div>`;
  else h += `<div class="sty-hero"><p class="sty-k">Le carnet d’Augustine · Saison ${T.season} · Chapitre ${n}/${STY_N}</p><h3>${esc(C.nm)}</h3><p class="sty-tag">${esc(C.tag)} : <b>${esc(s.t.lieu)}</b></p>${styStep(n) ? `<p class="sty-hint">${esc(styFill(C.hint, C, s))}</p>` : ''}${styListHTML(n)}</div>`;
  const done = STY_CHAPS.filter(c => T.ch[c.n] && T.ch[c.n].st === 'done');
  if (done.length) h += `<details class="sty-more"><summary>Revoir les chapitres <small>${done.length}/${STY_N}</small></summary>${done.map(c => `<div class="sty-rv"><span><b>${c.n}. ${esc(c.nm)}</b><small>${esc(T.ch[c.n].t.lieu)}${T.ch[c.n].item ? ' · ' + esc(T.ch[c.n].item) : ''}</small></span><button class="btn cream" data-sty="replay" data-n="${c.n}">Revoir</button></div>`).join('')}</details>`;
  const ann = styCall(() => (T.annex || []).map(id => QT_BY[id]).filter(Boolean), []);
  if (ann.length) h += `<details class="sty-more"><summary>Récits annexes <small>${ann.filter(q => (qtState().st[q.id] || {}).done).length}/${ann.length}${T.oldDone ? ` · ${T.oldDone} ancien${T.oldDone > 1 ? 's' : ''} terminé${T.oldDone > 1 ? 's' : ''}` : ''}</small></summary><div class="qt-stories">${ann.map(q => styCall(() => qtStoryHTML(q), '')).join('')}</div></details>`;
  if (!styTuto() && typeof MY_GUARDS !== 'undefined') {
    const known = styCall(() => MY_GUARDS.filter(G => myGRec(G.id).d), []);
    h += `<details class="sty-more" id="myGardiens"><summary>🦌 Gardiens légendaires <small>${known.length}/${MY_GUARDS.length}</small></summary>${known.length ? `<div class="my-gs">${known.map(G => styCall(() => myGuardHTML(G), '')).join('')}</div>` : '<p class="qt-hint qm-small">En voyage, écoutez les rumeurs.</p>'}</details>`;
  }
  return h;
}
try { QM_HTML.hist = styHistHTML; } catch (e) { console.error('histoire', e); }
function styOpenPage() { styCall(() => qtOpenPage(), 0); styCall(() => qmShow('hist'), 0); }

// ---------------- la carte d'action de l'écran principal ----------------
nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && a.kind !== 'idle' && a.kind !== 'away') return a;
  try {
    if (styTuto()) return a;
    const T = styState(); if (T.end) return a;
    const n = T.n, s = styCh(n), st = styStep(n);
    return { kind: 'story', k: `sty${n}:${st}:${styRevN(s)}:${stySecN(s, styC(n))}:${s.miss ? 1 : 0}`, n, st, base: a };
  } catch (e) { return a; }
})(nextAction);
renderActionCard = (orig => function (box) {
  let a = null; try { a = !document.body.classList.contains('firstrun') ? nextAction() : null; } catch (e) { a = null; }
  if (!a || a.kind !== 'story') return orig.apply(this, arguments);
  const n = a.n, C = styC(n), s = styCh(n), L = styLines(n).find(x => x.on);
  box.hidden = false; box.className = 'tripcard act act-story'; box.dataset.k = ''; box.dataset.kind = 'story';
  const ic = styCall(() => `<img src="${portraitURI(S.sel, 'curieux')}" alt="">`, '📖');
  let title = '', sub = '', btn = '<button class="btn green" data-sty="go">Y aller</button>';
  if (a.st === 0) { title = n === 1 ? 'Un vieux carnet au grenier…' : `Chapitre ${n} : ${C.nm}`; sub = 'Une nouvelle page à lire'; btn = '<button class="btn green" data-sty="read">Lire</button>'; }
  else if (a.st === 4) { title = `Page ${n} retrouvée !`; sub = 'Lisez la fin du chapitre'; btn = '<button class="btn gold" data-sty="read">Lire</button>'; }
  else { title = `${L.tx}${L.ct ? ` (${L.ct})` : ''}`; sub = s.miss ? `⚠ ${s.miss}` : styLines(n).map(x => `${x.ok ? '✓' : '☐'} ${x.i === 1 ? 'Dévoiler' : x.i === 2 ? 'Secrets' : 'Lieu final'}`).join(' · '); }
  box.dataset.sig = actionSig(a);
  box.innerHTML = `<span class="acic">${ic}</span><div class="tcx" data-sty="page"><span class="ack">Le carnet d’Augustine · Chapitre ${n}</span><b class="act-t">${esc(title)}</b><span class="acs">${esc(sub)}</span></div>${btn}`;
})(renderActionCard);

// l'objectif courant, lu par l'Exploration (52_modes.js) : { name, lon, lat, zone, txt }
function styGoal() {
  const T = styState(); if (T.end || styTuto()) { T.goal = null; return null; }
  const n = T.n, P = styCall(() => styTarget(n), null), L = styCall(() => styLines(n).find(x => x.on), null);
  if (!P) { T.goal = null; return null; }
  const s = styCh(n), z = s.z.find(z => z.lat === P.lat && z.lon === P.lon);
  T.goal = { name: P.name, lon: P.lon, lat: P.lat, zone: z ? z.id : styCall(() => exFn('exZoneAt')(P.lon, P.lat), null), txt: L ? `${L.tx}${L.ct ? ` (${L.ct})` : ''}` : '' };
  return T.goal;
}
window.__story = { goal: () => styCall(styGoal, null) };
function styRefresh() {
  styCall(styGoal, 0);
  styCall(() => { const box = $('tripCard'); if (box && typeof renderTripCard === 'function') renderTripCard(); }, 0);
  styCall(() => { const m = $('modal'); if (m && !m.hidden && m.querySelector('.qm-on-hist')) { const sc = m.querySelector('.mbox').scrollTop; showModal(qtPageHTML()); qtBtns(); m.querySelector('.mbox').scrollTop = sc; } }, 0);
  styMapUpdate();
}

// ---------------- sur la carte : zone cible entourée, flèche au bord de l'écran ----------------
let styMapHooked = false;
function styMapUpdate() {
  if (typeof map === 'undefined' || !map || typeof ovEls === 'undefined') return;
  const T = styState(), n = T.n, on = !styTuto() && !T.end && typeof tab !== 'undefined' && tab === 'carte';
  const P = on ? styCall(() => styTarget(n), null) : null;
  let ring = ovEls.styRing;
  if (!P) { if (ring) { ring.el.remove(); delete ovEls.styRing; } const ar = $('styArrow'); if (ar) ar.hidden = true; return; }
  if (!ring || !ring.el.isConnected) {
    const el = document.createElement('div'); el.className = 'ovm sty-ring'; el.innerHTML = '<i></i><span></span>';
    const ov = $('ov'); if (!ov) return; ov.appendChild(el); ring = ovEls.styRing = { el, lon: P.lon, lat: P.lat };
  }
  ring.lon = P.lon; ring.lat = P.lat; ring.el.querySelector('span').textContent = '📖 ' + P.name;
  styCall(() => positionOverlay(), 0);
  if (!styMapHooked) { styMapHooked = true; styCall(() => map.on('move', styArrow), 0); }
  styArrow();
}
function styArrow() {
  const r = ovEls && ovEls.styRing; let ar = $('styArrow');
  const c = styCall(() => map.getContainer(), null); if (!c) return;
  if (!ar) { ar = document.createElement('button'); ar.id = 'styArrow'; ar.className = 'sty-arrow'; ar.setAttribute('aria-label', 'Aller vers l’objectif du carnet'); ar.dataset.sty = 'fly'; ar.innerHTML = '<b>➤</b>'; c.appendChild(ar); }
  if (!r) { ar.hidden = true; return; }
  const W = c.clientWidth, H = c.clientHeight, p = map.project([r.lon, r.lat]);
  const inside = p.x > 10 && p.y > 70 && p.x < W - 10 && p.y < H - 150;
  ar.hidden = inside; if (inside) return;
  const cx = W / 2, cy = H / 2, dx = p.x - cx, dy = p.y - cy, k = Math.min((W / 2 - 34) / Math.abs(dx || 1e-6), (H / 2 - 120) / Math.abs(dy || 1e-6));
  ar.style.left = (cx + dx * k - 22).toFixed(0) + 'px'; ar.style.top = (cy + dy * k - 22).toFixed(0) + 'px';
  ar.querySelector('b').style.transform = `rotate(${Math.atan2(dy, dx).toFixed(3)}rad)`;
}
setInterval(() => styCall(styMapUpdate, 0), 1500);

// ---------------- branchements ----------------
GAME.on('trip:return', d => styCall(() => styOnReturn(d && d.dest, d && d.who), 0));
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-sty]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const a = b.dataset.sty;
  if (a === 'go') styGo(); else if (a === 'read') { styState().pend = 0; styRead(); } else if (a === 'next') styNext(); else if (a === 'skip') stySkip();
  else if (a === 'choice') styChoose(+b.dataset.i); else if (a === 'replay') styRead(+b.dataset.n);
  else if (a === 'page') styOpenPage();
  else if (a === 'fly') { const r = ovEls.styRing; if (r) styCall(() => zoomTo(r.lon, r.lat, Math.max(map.getZoom(), 5)), 0); }
}, true);

// ---------------- styles ----------------
try {
  const st = document.createElement('style');
  st.textContent = `
.sty-hero{background:#fff7e8;border:2px solid #e8cf9f;border-radius:16px;padding:12px;margin:4px 0 12px}
.sty-hero h3{margin:2px 0 4px;font-size:1.35em}.sty-k{margin:0;padding-right:92px;font-size:.78em;color:#8a6a4a;text-transform:uppercase;letter-spacing:.04em}
.sty-tag{margin:0 0 6px;font-size:.9em}.sty-hint{font-style:italic;background:#fffdf6;border-left:4px solid #c98a5a;padding:6px 8px;margin:6px 0;border-radius:6px}
.sty-list{display:flex;flex-direction:column;gap:6px}.sty-l{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:#fff;opacity:.6}
.sty-l.on{opacity:1;box-shadow:0 0 0 2px #7fbf7f}.sty-l.ok{opacity:.8}.sty-l.ok b{text-decoration:line-through}.sty-l>i{font-style:normal;font-size:1.1em}
.sty-l>span{flex:1;min-width:0}.sty-l small{display:block;color:#8a6a4a;font-size:.8em}.sty-l em{font-style:normal;color:#5b8a4a}.sty-l .btn{flex:none;padding:6px 10px}
.sty-miss{color:#b4462e!important;font-weight:600}
.sty-more{margin:8px 0;background:#fffaf0;border-radius:12px;padding:6px 10px}.sty-more summary{cursor:pointer;font-weight:700;padding:4px 0}.sty-more summary small{font-weight:400;color:#8a6a4a}
.sty-rv{display:flex;align-items:center;gap:8px;padding:4px 0}.sty-rv span{flex:1}.sty-rv small{display:block;color:#8a6a4a}
#styBD{position:fixed;inset:0;z-index:9000;background:rgba(40,28,20,.92);display:flex;align-items:center;justify-content:center;padding:12px}
.sty-bd{position:relative;width:100%;max-width:440px;max-height:100%;overflow:auto;background:#fff7e8;border-radius:18px;padding:14px 14px 10px;color:#4a3626}
.sty-skip{position:absolute;top:8px;right:8px;border:0;background:#efe0c4;border-radius:999px;padding:6px 12px;font-weight:700;color:#5b4636}
.sty-case{margin:22px 0 8px}.sty-pic{position:relative;border:3px solid #5b4636;border-radius:12px;overflow:hidden;background:#cfe6f0}.sty-pic>svg{display:block;width:100%;height:auto}
.sty-who{position:absolute;bottom:-4px;width:30%}.sty-who svg{width:100%;height:auto;display:block}.sty-who.p0{left:2%}.sty-who.p1{right:2%}.sty-who.p2{left:31%;width:30%}
.sty-case.flash .sty-pic,.sty-who.flash{filter:sepia(.55) saturate(.8)}
.sty-case figcaption{background:#fff;border:2px solid #5b4636;border-radius:12px;padding:8px 10px;margin-top:-6px;position:relative;font-size:1.02em;line-height:1.35}
.sty-acts{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}.sty-acts .btn{flex:1}
.sty-dots{text-align:center;margin:6px 0 0}.sty-dots i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e2cfae;margin:0 3px}.sty-dots i.on{background:#c98a5a}
.sty-rw{text-align:center;padding:30px 6px 10px}.sty-big{font-size:1.3em;font-weight:800;margin:6px 0}.sty-endsc{padding-top:40px}
.sty-ring{pointer-events:none;z-index:4}.sty-ring i{position:absolute;left:-34px;top:-34px;width:68px;height:68px;border-radius:50%;border:3px dashed #e5584f;box-shadow:0 0 0 4px rgba(229,88,79,.18);animation:styPulse 1.6s ease-in-out infinite}
.sty-ring span{position:absolute;left:0;top:38px;transform:translateX(-50%);white-space:nowrap;background:#fff7e8;border:2px solid #e5584f;border-radius:999px;padding:1px 8px;font-size:12px;font-weight:700;color:#7a3a2a}
@keyframes styPulse{50%{transform:scale(1.12)}}
.sty-arrow{position:absolute;z-index:30;width:44px;height:44px;border-radius:50%;border:2px solid #e5584f;background:#fff7e8;color:#e5584f;font-size:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.sty-arrow b{display:block;line-height:1}
@media (prefers-reduced-motion:reduce){.sty-ring i{animation:none}}`;
  document.head.appendChild(st);
} catch (e) {}

// ---------------- tests ----------------
window.__sty = {
  state: () => styState(), chaps: STY_CHAPS, resolve: (n, home) => styResolve(n, typeof home === 'string' ? (h => ({ name: h[0], lat: h[1], lon: h[2] }))(HOMES.find(x => x[0] === home)) : home),
  ch: n => styCh(n || styState().n), step: n => styStep(n || styState().n), lines: n => styLines(n || styState().n), target: n => styTarget(n || styState().n),
  go: () => styGo(), read: n => styRead(n), next: () => styNext(), skip: () => stySkip(), choose: i => styChoose(i),
  ret: (dest, who) => styOnReturn(dest, who || S.sel), T: () => ({ S, GAME, xpEq, styGive, closeSheet, renderTripCard, dfCheck: typeof dfCheck === "function" ? dfCheck : null }), page: () => styHistHTML(), open: () => styOpenPage(), miss: (k, fin) => styMiss(styState().n, k, styDest(styState().n, styTarget(styState().n)), fin),
};

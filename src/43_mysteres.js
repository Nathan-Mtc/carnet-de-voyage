// ================= MYSTÈRES : ÉNIGMES, GARDIENS, CARTES DÉCHIRÉES (v30, étape 2, bloc A) =================
// Le joueur : « Il faut vraiment développer l'aspect aventure et quêtes. » Du CHALLENGE : galérer pour trouver, être fier de réussir.
// Sans nouvel écran : page Quêtes (3 sections), carte (zone d'indice, épingles des lieux secrets), panneau de départ,
// aventure vécue (journal à l'arrivée) et butin.
// 1. ÉNIGMES : 28 lieux réels (3 près de la maison, France, Europe, monde), 3 niveaux (facile, moyen, difficile) qui se débloquent.
//    Le joueur suit une énigme, trouve LUI-MÊME l'endroit sur la carte et y envoie un familier (case « Chercher ici » au départ).
//    Verdict à l'arrivée : à moins de X km (30, 20 ou 15 km selon le niveau). Raté : « Ce n'est pas ici… le vent souffle vers l'ouest ».
//    3 indices : un texte, puis une zone large, puis une zone plus petite (cercle décalé, jamais centré sur la réponse). L'indice 2
//    demande 1 essai, l'indice 3 en demande 2. Chaque indice réduit un peu les pièces. Récompense UNIQUE à chaque fois (v33 : plus de pierres d'étoile).
// 2. GARDIENS : 10 créatures rares (dessin des clients + cape dorée et aura). Découverts par une rumeur (voyage proche) ou une énigme.
//    3 à 5 visites, chacune avec SON offrande (et parfois une condition : nuit, matériel, niveau de terrain). Puis : familier rare
//    (une espèce cousine qu'il vous confie) ou bénédiction permanente, au choix.
// 3. CARTES DÉCHIRÉES : 5 cartes de 4 morceaux (voyages dans une zone, rarement ; énigmes ; lieux verrouillés de 41_expedition.js).
//    Complète : épingle du lieu secret sur la carte, expédition finale (choix risqués de 41_expedition.js), très gros trésor unique.
// État : S.mys = { cur, r: {id: {h, tries, done, by, at}}, g: {id: {d, t, done, at}}, m: {id: [morceaux]}, x: {id: 1} }.
// Enveloppes : qtPageHTML, startTrip, fireEvent, collect, showHaul, renderVoyage, drawMarks, xpIsExpe, xpRiskK, xpGain.
// Expose window.__mys (tests).

// ---------------- énigmes ----------------
// tier 1 facile, 2 moyen, 3 difficile ; cats : énigme « près de chez vous » (un type de lieu à moins de 30 km de la maison)
// rw : it (objet unique), pc (morceau de carte), gd (révèle un gardien), ti (titre)
const MY_TIER = ['', 'facile', 'moyen', 'difficile'];
const MY_TOL = [0, 30, 20, 15];           // km : distance maximale pour réussir
const MY_RBIG = [0, 150, 350, 800];       // km : rayon de la zone large (indice 2)
const MY_RSMALL = [0, 40, 90, 200];       // km : rayon de la petite zone (indice 3)
// v33 : plus de pierres d'étoile ici (réservées à l'onglet Défis) ; pièces et XP du familier plus généreuses en Exploration
const MY_STONES = [0, 0, 0, 0], MY_COINS = [0, 150, 350, 700], MY_XPB = [0, 30, 50, 80];
const MY_HOME_KM = 30;
const MR4 = (n, cat, sub, look, col) => [n, cat, sub, 4, look, col];
const MY_RIDDLES = [
  // ----- faciles -----
  { id: 'pain', tier: 1, cats: ['boulangerie'], name: 'Une boulangerie près de chez vous', q: 'Avant l’aube, on y pétrit la farine. Son odeur chaude réveille tout le quartier.', h1: 'C’est tout près de chez vous : suivez votre nez ! Zoomez bien sur votre quartier.', miss: 'Ce n’est pas ici… ça ne sent pas le pain chaud. Cherchez tout près de chez vous.', rw: { it: MR4('Fouet doré du boulanger', 'm', 'metal', null, '#e0a52a'), ti: 'Fin nez du quartier' } },
  { id: 'parc', tier: 1, cats: ['parc', 'jardin'], name: 'Un parc près de chez vous', q: 'On y court sur l’herbe, on y donne du pain aux canards, et les grands arbres y font de l’ombre aux bancs.', h1: 'Un coin de verdure en ville, à quelques minutes de chez vous.', miss: 'Ce n’est pas ici… il manque l’herbe et les grands arbres. Cherchez près de chez vous.', rw: { gd: 'cerf', ti: 'Promeneur du dimanche' } },
  { id: 'livres', tier: 1, cats: ['bibliotheque', 'librairie'], name: 'Une bibliothèque près de chez vous', q: 'Des milliers d’histoires y dorment en silence, rangées par ordre alphabétique.', h1: 'On y chuchote. On peut parfois emporter les histoires chez soi.', miss: 'Ce n’est pas ici… pas un livre à l’horizon. Cherchez près de chez vous.', rw: { it: MR4('Marque-page enchanté', 'm', 'papier', null, '#b45a8c'), ti: 'Rat de bibliothèque' } },
  { id: 'eiffel', tier: 1, name: 'La tour Eiffel', lon: 2.2945, lat: 48.8584, q: 'Là où la dame de fer regarde la Seine.', h1: 'Elle a plus de 130 ans, mesure 330 mètres et scintille toutes les heures la nuit.', rw: { it: MR4('Béret de la dame de fer', 'v', 'tete', 'beret', '#5b6b8a'), ti: 'Parisien d’honneur' } },
  { id: 'msm', tier: 1, name: 'Le Mont-Saint-Michel', lon: -1.5115, lat: 48.6361, q: 'Une abbaye que la mer encercle deux fois par jour.', h1: 'Au fond d’une baie, entre Bretagne et Normandie. La marée y monte « à la vitesse d’un cheval au galop ».', rw: { pc: 'corsaire', ti: 'Gardien de la baie' } },
  { id: 'avignon', tier: 1, name: 'Le pont d’Avignon', lon: 4.8044, lat: 43.9539, q: 'Le pont qui ne va qu’à moitié, et sur lequel on danse en chanson.', h1: 'Sur le Rhône, dans la cité des papes.', rw: { it: MR4('Foulard des papes', 'v', 'cou', 'foulard', '#8a3f9a'), ti: 'Danseur du pont' } },
  { id: 'confluence', tier: 1, name: 'La Confluence de Lyon', lon: 4.8183, lat: 45.7314, q: 'Les deux fleuves s’y embrassent, sous le regard d’une basilique perchée.', h1: 'Le Rhône et la Saône se rejoignent au sud de la ville des Lumières.', rw: { it: MR4('Lanterne des Lumières', 'm', 'lumiere', null, '#f2c14e'), ti: 'Ami des deux fleuves' } },
  { id: 'pilat', tier: 1, name: 'La dune du Pilat', lon: -1.2131, lat: 44.5893, q: 'La plus haute dune d’Europe, face à l’océan.', h1: 'Plus de 100 mètres de sable, au bord du bassin d’Arcachon.', rw: { it: MR4('Sablier de la grande dune', 'm', 'sable', null, '#e9c48a'), ti: 'Roi de la dune' } },
  { id: 'bigben', tier: 1, name: 'Big Ben', lon: -0.1246, lat: 51.5007, q: 'Une grosse cloche sonne l’heure au bord d’un fleuve, à côté du Parlement.', h1: 'De l’autre côté de la Manche, au bord de la Tamise.', rw: { it: MR4('Écharpe de Westminster', 'v', 'cou', 'echarpe', '#c0392b'), ti: 'Ponctuel comme Big Ben' } },
  // ----- moyennes -----
  { id: 'moulin', tier: 2, name: 'Le moulin de Daudet (Fontvieille)', lon: 4.7104, lat: 43.7167, q: 'Ses ailes ne moulent plus de blé : un écrivain y a rêvé ses lettres, entre les oliviers et les cigales.', h1: 'Les « Lettres de mon moulin » d’Alphonse Daudet, près d’Arles.', rw: { it: MR4('Plume de l’écrivain', 'm', 'plume', null, '#d9c7a0'), ti: 'Lettré de Provence' } },
  { id: 'creach', tier: 2, name: 'Le phare du Créac’h (Ouessant)', lon: -5.1293, lat: 48.4594, q: 'Sur l’île la plus à l’ouest de France, un œil géant lance deux éclairs blancs toutes les dix secondes.', h1: 'Un phare rayé noir et blanc, sur une île au large du Finistère.', rw: { pc: 'corsaire', ti: 'Veilleur d’Ouessant' } },
  { id: 'puy', tier: 2, name: 'Le puy de Dôme', lon: 2.9642, lat: 45.7725, q: 'Un vieux géant de feu endormi, coiffé d’un temple romain, veille sur une ville de pneus.', h1: 'Le plus célèbre volcan d’Auvergne, au-dessus de Clermont-Ferrand.', rw: { it: MR4('Pierre de lave du géant', 'm', 'pierre', null, '#6b4a3a'), ti: 'Dompteur de volcans' } },
  { id: 'gavarnie', tier: 2, name: 'Le cirque de Gavarnie', lon: -0.0089, lat: 42.6964, q: 'Un immense amphithéâtre de roche où tombe la plus haute cascade de France.', h1: 'Dans les Pyrénées, tout contre l’Espagne.', rw: { gd: 'lynx', ti: 'Écho des Pyrénées' } },
  { id: 'sagrada', tier: 2, name: 'La Sagrada Família', lon: 2.1744, lat: 41.4036, q: 'Une église que l’on construit depuis plus de cent ans… et qui n’est toujours pas finie.', h1: 'L’œuvre de Gaudí, en Catalogne, au bord de la Méditerranée.', rw: { it: MR4('Mosaïque de Gaudí', 'm', 'verre', null, '#4fb3d9'), ti: 'Bâtisseur patient' } },
  { id: 'colisee', tier: 2, name: 'Le Colisée', lon: 12.4922, lat: 41.8902, q: 'Les gladiateurs y combattaient sous les cris de cinquante mille spectateurs.', h1: 'Dans la ville où mènent tous les chemins.', rw: { it: MR4('Cape du gladiateur', 'v', 'dos', 'cape', '#b33a2e'), ti: 'Champion de l’arène' } },
  { id: 'venise', tier: 2, name: 'Les canaux de Venise', lon: 12.3155, lat: 45.4408, q: 'Une ville sans voitures, où les rues sont des canaux et les taxis des gondoles.', h1: 'Au fond de l’Adriatique, sur une lagune.', rw: { it: MR4('Masque de Murano', 'm', 'verre', null, '#d4a5e8'), ti: 'Gondolier d’honneur' } },
  { id: 'pise', tier: 2, name: 'La tour de Pise', lon: 10.3966, lat: 43.723, q: 'Une tour blanche penche depuis huit cents ans… mais ne tombe jamais.', h1: 'En Toscane, pas loin de la mer.', rw: { it: MR4('Tour penchée miniature', 'd', 'statue', null, '#f2ead8'), ti: 'Équilibriste' } },
  { id: 'neusch', tier: 2, name: 'Le château de Neuschwanstein', lon: 10.7498, lat: 47.5576, q: 'Le château de conte de fées d’un roi rêveur, perché au pied des montagnes bavaroises.', h1: 'En Allemagne, tout au sud, près de l’Autriche.', rw: { pc: 'alpes', ti: 'Rêveur de châteaux' } },
  { id: 'stonehenge', tier: 2, name: 'Stonehenge', lon: -1.8262, lat: 51.1789, q: 'Des pierres géantes dressées en cercle dans une plaine, alignées sur le soleil du plus long jour.', h1: 'Dans le sud de l’Angleterre, loin de toute ville.', rw: { gd: 'lievre', ti: 'Druide du solstice' } },
  // ----- difficiles -----
  { id: 'fuji', tier: 3, name: 'Le mont Fuji', lon: 138.7274, lat: 35.3606, q: 'Une montagne parfaite au sommet blanc, que l’on peint depuis toujours, à l’ouest de la grande capitale.', h1: 'Un volcan sacré du Japon. Zoomez bien : la capitale n’est pas la réponse !', rw: { pc: 'dragon', ti: 'Pèlerin du Fuji' } },
  { id: 'pyramides', tier: 3, name: 'Les pyramides de Gizeh', lon: 31.1342, lat: 29.9792, q: 'La seule des Sept Merveilles du monde antique encore debout.', h1: 'Au bord du désert, près du Nil.', rw: { pc: 'pharaon', ti: 'Enfant du Nil' } },
  { id: 'petra', tier: 3, name: 'Pétra', lon: 35.4444, lat: 30.3285, q: 'Une ville rose taillée dans la roche, cachée au bout d’un canyon étroit.', h1: 'Dans le désert de Jordanie.', rw: { pc: 'pharaon', ti: 'Explorateur de la cité rose' } },
  { id: 'angkor', tier: 3, name: 'Angkor Vat', lon: 103.867, lat: 13.4125, q: 'Le plus grand temple du monde, que la jungle a longtemps avalé.', h1: 'Au Cambodge, près d’un grand lac.', rw: { pc: 'dragon', ti: 'Ami de la jungle' } },
  { id: 'tajmahal', tier: 3, name: 'Le Taj Mahal', lon: 78.0421, lat: 27.1751, q: 'Un palais de marbre blanc, bâti par amour au bord d’une rivière sacrée.', h1: 'En Inde, au sud de la capitale.', rw: { pc: 'dragon', ti: 'Cœur de marbre' } },
  { id: 'uluru', tier: 3, name: 'Uluru', lon: 131.0369, lat: -25.3444, q: 'Un rocher rouge géant et sacré, posé tout seul au milieu d’un continent-île.', h1: 'Au cœur de l’Australie, très loin de la mer.', rw: { it: MR4('Pierre rouge d’Uluru', 'm', 'pierre', null, '#c4562e'), ti: 'Cœur du désert rouge' } },
  { id: 'iguazu', tier: 3, name: 'Les chutes d’Iguazú', lon: -54.4367, lat: -25.6953, q: 'Des centaines de cascades grondent à la frontière de trois pays, autour de la « Gorge du Diable ».', h1: 'Entre l’Argentine et le Brésil.', rw: { pc: 'jungle', gd: 'loutre', ti: 'Voix de la Gorge du Diable' } },
  { id: 'liberte', tier: 3, name: 'La statue de la Liberté', lon: -74.0445, lat: 40.6892, q: 'Une dame verte brandit sa torche à l’entrée d’un grand port.', h1: 'Un cadeau de la France, de l’autre côté de l’Atlantique.', rw: { it: MR4('Torche de la liberté', 'm', 'lumiere', null, '#7fbf9f'), ti: 'Lumière du monde' } },
  { id: 'paques', tier: 3, name: 'L’île de Pâques', lon: -109.3497, lat: -27.1127, q: 'Des géants de pierre tournent le dos à l’océan, sur l’île habitée la plus isolée du monde.', h1: 'En plein Pacifique, très loin à l’ouest du Chili.', rw: { pc: 'jungle', ti: 'Ami des Moaï' } },
];
const MY_R = {}; MY_RIDDLES.forEach(R => { MY_R[R.id] = R; });

// ---------------- gardiens ----------------
// offrandes : ING (03_data.js) ; c : condition (night, g : [matériel, niveau], m : [terrain, niveau])
// csp : espèce du familier rare qu'il vous confie ; bless : bénédiction permanente
const MY_BLESS = {
  chance: ['Chance', '+ objets rares en voyage'], prud: ['Prudence', '−20 % de risques en expédition'], vit: ['Vitesse', 'voyages 8 % plus courts'],
  terr: ['Maîtrise', '+30 % d’XP de terrain'], or: ['Fortune', '+15 % de pièces en voyage'], flair: ['Flair', 'morceaux de carte 2 fois plus fréquents'],
};
const MY_GUARDS = [
  { id: 'cerf', nm: 'Le cerf blanc', sp: 'faon', where: 'Forêt de Brocéliande', lon: -2.17, lat: 48.02, tags: ['foret'], csp: 'renard', cn: 'Brume', bless: 'chance', aura: '#fff6d8',
    rum: 'Un vieux bûcheron raconte qu’un cerf tout blanc apparaît parfois dans une forêt de légendes, en Bretagne…',
    offers: [{ k: 'champignon', t: 'des champignons des sous-bois' }, { k: 'feuille', t: 'de la mousse fraîche' }, { k: 'fruit', t: 'des baies de sorbier', c: { night: 1 } }, { k: 'lumiere', t: 'un éclat de lune', c: { m: ['foret', 2] } }] },
  { id: 'lynx', nm: 'Le lynx des Pyrénées', sp: 'chat', where: 'Cirque de Gavarnie', lon: -0.01, lat: 42.7, tags: ['montagne', 'neige'], csp: 'fennec', cn: 'Pyrène', bless: 'prud', aura: '#ffe2a8',
    rum: 'Un berger jure avoir vu deux oreilles pointues et une queue courte filer sur les crêtes des Pyrénées…',
    offers: [{ k: 'plume', t: 'une plume pour jouer' }, { k: 'mer', t: 'une truite bien fraîche', c: { night: 1 } }, { k: 'laine', t: 'de la laine pour sa tanière', c: { g: ['crampons', 1] } }] },
  { id: 'lievre', nm: 'Le lièvre des Highlands', sp: 'lapin', where: 'Highlands (Cairngorms)', lon: -3.67, lat: 57.08, tags: ['montagne', 'campagne'], csp: 'quokka', cn: 'Bruyère', bless: 'vit', aura: '#e8f4ff',
    rum: 'Dans un pub d’Écosse, on parle d’un lièvre qui devient tout blanc l’hiver et court plus vite que le vent des Highlands…',
    offers: [{ k: 'graine', t: 'des graines de bruyère' }, { k: 'pomme', t: 'une pomme croquante' }, { k: 'feuille', t: 'des fleurs de chardon', c: { m: ['montagne', 2] } }, { k: 'ble', t: 'une gerbe de blé' }] },
  { id: 'renard', nm: 'Le renard des neiges', sp: 'renard', where: 'Laponie (Saariselkä)', lon: 27.0, lat: 68.4, tags: ['neige', 'foret'], csp: 'renard', cn: 'Aurore', bless: 'terr', aura: '#dff4ff',
    rum: 'Les éleveurs de rennes parlent d’un renard blanc comme la neige qui danse sous les aurores de Laponie…',
    offers: [{ k: 'flocon', t: 'un flocon éternel' }, { k: 'mer', t: 'un poisson pêché sous la glace' }, { k: 'laine', t: 'une couverture de laine', c: { g: ['manteau', 1] } }, { k: 'lumiere', t: 'un éclat d’aurore', c: { night: 1 } }] },
  { id: 'harfang', nm: 'Le harfang des neiges', sp: 'chouette', where: 'Baie d’Hudson (Churchill)', lon: -94.17, lat: 58.77, tags: ['neige', 'mer'], csp: 'phoque', cn: 'Neigeux', bless: 'flair', aura: '#f2fbff',
    rum: 'Un trappeur canadien raconte qu’une grande chouette blanche aux yeux d’or veille sur la baie d’Hudson…',
    offers: [{ k: 'plume', t: 'une plume pour son nid' }, { k: 'flocon', t: 'un flocon éternel', c: { night: 1 } }, { k: 'mer', t: 'un poisson de la baie' }, { k: 'cristal', t: 'un cristal de glace', c: { g: ['jumelles', 1] } }] },
  { id: 'canard', nm: 'Le canard mandarin', sp: 'canard', where: 'Kyoto (rivière Kamo)', lon: 135.77, lat: 35.01, tags: ['ville', 'monument'], csp: 'tanuki', cn: 'Sakura', bless: 'or', aura: '#ffe0ec',
    rum: 'Une marchande de thé de Kyoto parle d’un canard aux plumes d’or qui glisse sur la rivière à l’aube…',
    offers: [{ k: 'insecte', t: 'une libellule (un insecte)' }, { k: 'feuille', t: 'un pétale de cerisier', c: { night: 1 } }, { k: 'sucre', t: 'un mochi bien sucré' }] },
  { id: 'tortue', nm: 'La tortue géante', sp: 'tortue', where: 'Îles Galápagos', lon: -90.35, lat: -0.74, tags: ['mer', 'ile'], csp: 'capy', cn: 'Darwin', bless: 'prud', aura: '#e6ffd8',
    rum: 'Un vieux marin raconte qu’une tortue de deux cents ans attend les voyageurs patients sur une île volcanique du Pacifique…',
    offers: [{ k: 'feuille', t: 'des feuilles de cactus' }, { k: 'fruit', t: 'des goyaves bien mûres' }, { k: 'agrume', t: 'un agrume juteux' }, { k: 'coquillage', t: 'un coquillage pour sa carapace', c: { g: ['palmes', 1] } }, { k: 'sable', t: 'du sable chaud', c: { m: ['mer', 3] } }] },
  { id: 'loutre', nm: 'La loutre géante', sp: 'loutre', where: 'Amazonie (Manaus)', lon: -60.0, lat: -3.1, tags: ['foret', 'lac'], csp: 'paresseux', cn: 'Yara', bless: 'chance', aura: '#d8fff0',
    rum: 'Un piroguier raconte qu’une loutre grande comme un homme rit dans les rivières d’Amazonie…',
    offers: [{ k: 'mer', t: 'un poisson de rivière' }, { k: 'coquillage', t: 'un coquillage brillant' }, { k: 'fruit', t: 'des fruits de la forêt', c: { g: ['jumelles', 1] } }, { k: 'insecte', t: 'un papillon (un insecte, comme le morpho bleu)' }] },
  { id: 'manchot', nm: 'Le manchot royal', sp: 'pingouin', where: 'Patagonie (Punta Tombo)', lon: -65.22, lat: -44.05, tags: ['mer', 'neige'], csp: 'phoque', cn: 'Pinpin', bless: 'or', aura: '#fff1c8',
    rum: 'Les gauchos de Patagonie parlent d’un manchot à collier d’or qui salue les bateaux…',
    offers: [{ k: 'mer', t: 'un poisson d’argent' }, { k: 'coquillage', t: 'un galet rond pour son nid' }, { k: 'flocon', t: 'un flocon éternel', c: { m: ['mer', 3] } }] },
  { id: 'grenouille', nm: 'La grenouille dorée', sp: 'grenouille', where: 'Panama (El Valle)', lon: -80.13, lat: 8.6, tags: ['foret'], csp: 'axo', cn: 'Doré', bless: 'flair', aura: '#fff3a8',
    rum: 'Un guide de Panama raconte qu’une grenouille dorée, presque disparue, fait signe de la patte au bord d’un ruisseau…',
    offers: [{ k: 'feuille', t: 'une feuille de bananier' }, { k: 'fruit', t: 'un fruit sauvage', c: { night: 1 } }, { k: 'insecte', t: 'une luciole (un insecte)', c: { night: 1 } }, { k: 'cristal', t: 'une goutte de rosée cristallisée', c: { m: ['foret', 4] } }, { k: 'champignon', t: 'un champignon lumineux' }] },
];
const MY_G = {}; MY_GUARDS.forEach(G => { MY_G[G.id] = G; });
const MY_G_VISIT = 60, MY_G_RUM = 1200; // km

// ---------------- cartes déchirées ----------------
// zone : [lon, lat, rayon km] où l'on trouve, rarement, un morceau ; locks : lieux verrouillés (41_expedition.js) qui en donnent un
const MY_MAPS = [
  { id: 'corsaire', nm: 'Carte du corsaire', zone: [-3.2, 48.2, 320], zn: 'Bretagne et Normandie', locks: ['epave'],
    sec: { name: 'Crique secrète de Cézembre', lon: -2.0717, lat: 48.6747, tags: ['mer', 'ile'] }, tr: MR4('Coffre du corsaire Surcouf', 'd', 'statue', null, '#a0703a'), ti: 'Corsaire légendaire', stones: 25, coins: 1500 },
  { id: 'alpes', nm: 'Carte des cristalliers', zone: [7.6, 46.2, 320], zn: 'les Alpes', locks: ['montblanc', 'cervin'],
    sec: { name: 'Grotte de cristal du Grimsel', lon: 8.33, lat: 46.57, tags: ['montagne', 'neige'] }, tr: MR4('Géode des cristalliers', 'm', 'cristal', null, '#b39ce0'), ti: 'Cristallier des Alpes', stones: 25, coins: 1500 },
  { id: 'pharaon', nm: 'Carte du pharaon', zone: [31, 27, 1300], zn: 'l’Égypte et le Proche-Orient', locks: ['sahara'],
    sec: { name: 'Tombeau oublié de la Vallée des Rois', lon: 32.6014, lat: 25.7402, tags: ['desert', 'monument'] }, tr: MR4('Masque d’or du pharaon', 'd', 'statue', null, '#e0b13a'), ti: 'Héritier du pharaon', stones: 30, coins: 2000 },
  { id: 'jungle', nm: 'Carte de la cité d’or', zone: [-68, -12, 2600], zn: 'l’Amérique du Sud', locks: ['machu', 'amazonie', 'cenote'],
    sec: { name: 'Cité d’or de Paititi', lon: -71.6, lat: -12.6, tags: ['foret', 'montagne'] }, tr: MR4('Soleil d’or de Paititi', 'd', 'statue', null, '#f2c14e'), ti: 'Découvreur de la cité d’or', stones: 35, coins: 2500 },
  { id: 'dragon', nm: 'Carte du dragon de jade', zone: [108, 28, 3200], zn: 'l’Asie', locks: ['everest'],
    sec: { name: 'Grotte du dragon de jade (baie d’Ha Long)', lon: 107.18, lat: 20.91, tags: ['mer', 'ile'] }, tr: MR4('Dragon de jade', 'd', 'statue', null, '#3fae7a'), ti: 'Ami du dragon de jade', stones: 40, coins: 3000 },
];
const MY_M = {}; MY_MAPS.forEach(M => { M.coins += M.stones * 40; M.stones = 0; M.rid = MY_RIDDLES.filter(R => R.rw.pc === M.id).map(R => R.id); MY_M[M.id] = M; });

// ---------------- état et outils ----------------
function myState() {
  if (!S.mys || typeof S.mys !== 'object' || Array.isArray(S.mys)) S.mys = {};
  const M = S.mys;
  ['r', 'g', 'm', 'x'].forEach(k => { if (!M[k] || typeof M[k] !== 'object' || Array.isArray(M[k])) M[k] = {}; });
  if (typeof M.cur !== 'string') M.cur = '';
  return M;
}
const myCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const myRec = id => { const M = myState(); if (!M.r[id] || typeof M.r[id] !== 'object') M.r[id] = { h: 0, tries: 0 }; return M.r[id]; };
const myGRec = id => { const M = myState(); if (!M.g[id] || typeof M.g[id] !== 'object') M.g[id] = { d: 0, t: 0 }; return M.g[id]; };
const myPieces = id => { const M = myState(); if (!Array.isArray(M.m[id])) M.m[id] = [0, 0, 0, 0]; return M.m[id]; };
const myComplete = id => myPieces(id).every(Boolean);
const myHash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const myRnd = s => (myHash(s) % 10007) / 10007;
const myKm = (a, b) => myCall(() => d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]) * 6371, 1e9);
const myTuto = () => myCall(() => tuOn(), false);
const myNm = k => (CHARS[k] ? CHARS[k].name : '');
const myP = { rum: null, piece: null }; // tests : probabilités forcées
const myDoneN = tier => MY_RIDDLES.filter(R => (!tier || R.tier === tier) && (myState().r[R.id] || {}).done).length;
// niveaux : moyen après 3 faciles, difficile après 4 moyennes
const MY_UNLOCK = [0, 0, 3, 4];
const myTierOpen = tier => tier <= 1 || myDoneN(tier - 1) >= MY_UNLOCK[tier];
const myAvail = R => !!R && myTierOpen(R.tier);
const myCur = () => { const M = myState(), R = MY_R[M.cur]; return R && myAvail(R) && !myRec(R.id).done ? R : null; };
// cible d'une énigme « près de chez vous » : le lieu de ce type le plus proche (s'il est chargé)
function myTarget(R) {
  if (!R.cats) return { lon: R.lon, lat: R.lat };
  const L = myCall(() => qtLoc({ t: 'visit', cat: R.cats }), null);
  return L && myKm(homeObj(), L) <= MY_HOME_KM ? { lon: L.lon, lat: L.lat } : null;
}
const MY_DIRS = ['l’est', 'le nord-est', 'le nord', 'le nord-ouest', 'l’ouest', 'le sud-ouest', 'le sud', 'le sud-est'];
function myDir(from, to) {
  let dl = to.lon - from.lon; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
  const dx = dl * Math.cos((from.lat + to.lat) / 2 * Math.PI / 180), dy = to.lat - from.lat;
  return MY_DIRS[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
}
// verdict d'une énigme pour une destination
function myCheck(R, d) {
  if (!R || !d) return { ok: false, txt: '' };
  if (R.cats) {
    const ok = !!(d.poi && R.cats.includes(d.cat) && myKm(homeObj(), d) <= MY_HOME_KM);
    return { ok, km: 0, txt: ok ? '' : R.miss };
  }
  const km = myKm(d, R), tol = MY_TOL[R.tier];
  if (km <= tol) return { ok: true, km };
  const heat = km < tol * 4 ? 'Vous brûlez !' : km < 300 ? 'Vous chauffez…' : km < 1500 ? 'C’est encore loin.' : 'C’est très, très loin d’ici.';
  return { ok: false, km, txt: `Ce n’est pas ici… le vent souffle vers ${myDir(d, R)}. ${heat}` };
}
// récompense (les indices réduisent les pièces, jamais l'objet unique)
const myRwTags = R => [R.rw.it ? 'Trésor unique' : R.rw.pc ? 'Morceau de carte' : 'Secret de gardien', 'Titre'];
function myRwVals(R) { const h = myRec(R.id).h || 0; return { stones: 0, coins: Math.round(MY_COINS[R.tier] * (1 - 0.2 * h)), xp: MY_XPB[R.tier], h }; }
function myRwTxt(R) {
  const v = myRwVals(R), a = [];
  if (R.rw.it) a.push(R.rw.it[0]);
  if (R.rw.pc) a.push(`un morceau de la ${MY_M[R.rw.pc].nm.toLowerCase()}`);
  if (R.rw.gd) a.push('le secret d’un gardien légendaire');
  a.push(`le titre « ${R.rw.ti} »`);
  return `${a.join(' · ')} · ${v.coins} pièces · +${v.xp} XP`;
}

// ---------------- dessins ----------------
const MY_SCROLL = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 9 Q8 5 12 5 H30 Q34 5 34 9 V31 Q34 35 30 35 H12 Q8 35 8 31Z" fill="#f3dfae" stroke="#5b4636" stroke-width="2.2"/><text x="21" y="28" text-anchor="middle" font-size="20" font-weight="900" fill="#7a4fa0" font-family="Georgia,serif">?</text></svg>';
const MY_XMARK = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 10 L14 6 L26 10 L34 6 V30 L26 34 L14 30 L6 34Z" fill="#f3dfae" stroke="#5b4636" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 6 V30 M26 10 V34" stroke="#c9a46a" stroke-width="1.4"/><path d="M17 15 l8 8 M25 15 l-8 8" stroke="#c0392b" stroke-width="3.2" stroke-linecap="round"/></svg>';
// gardien : dessin des clients (18_boutique.js) avec une cape dorée ; l'aura est en CSS
const myGuardC = G => ({ id: 'gd_' + G.id, name: G.nm, sp: G.sp, cloth: '#e0b13a', acc: null, accC: '#f2c14e', look: { g: 'cape', pat: '', c2: '#fff3c4', x: ['collier'] } });
const myGuardImg = (G, known, cls = '') => { const u = myCall(() => clientURI(myGuardC(G), 'content'), ''); return `<span class="my-gimg${known ? '' : ' sil'} ${cls}" style="--au:${G.aura}">${u ? `<img src="${u}" alt="${known ? esc(G.nm) : 'Silhouette inconnue'}">` : ''}</span>`; };
// carte déchirée : 4 morceaux aux bords déchirés qui se raccordent (SVG simple, style carte ancienne)
function myMapSVG(M) {
  const have = myPieces(M.id), full = have.every(Boolean), u = 'mm' + M.id, r = i => myRnd(M.id + ':' + i);
  const V = [], Hh = [];
  for (let y = 0; y <= 120; y += 10) V.push([80 + (y % 60 ? (r('v' + y) - 0.5) * 9 : 0), y]);
  for (let x = 0; x <= 160; x += 10) Hh.push([x, 60 + (x % 80 ? (r('h' + x) - 0.5) * 9 : 0)]);
  const Vt = V.filter(p => p[1] <= 60), Vb = V.filter(p => p[1] >= 60), Hl = Hh.filter(p => p[0] <= 80), Hr = Hh.filter(p => p[0] >= 80);
  const P = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z';
  const polys = [P([[0, 0], ...Vt, ...Hl.slice().reverse()]), P([...Vt, ...Hr, [160, 0]]), P([[0, 120], ...Hl, ...Vb]), P([...Vb, [160, 120], ...Hr.slice().reverse()])];
  const off = [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]];
  // l'art : mer, île, montagnes, arbres, chemin en pointillé, rose des vents et la croix rouge
  const land = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = 34 + r('l' + i) * 18; land.push([80 + Math.cos(a) * rr * 1.55, 62 + Math.sin(a) * rr]); }
  const blob = 'M' + land.map((p, i) => { const q = land[(i + 1) % 16]; return `${p[0].toFixed(1)} ${p[1].toFixed(1)} Q${((p[0] + q[0]) / 2 + (r('q' + i) - 0.5) * 8).toFixed(1)} ${((p[1] + q[1]) / 2 + (r('w' + i) - 0.5) * 8).toFixed(1)}`; }).join(' ') + ` ${land[0][0].toFixed(1)} ${land[0][1].toFixed(1)}Z`;
  const X = [104 + r('x') * 18, 76 + r('y') * 18];
  let art = `<rect width="160" height="120" fill="#e9dcb6"/><path d="${blob}" fill="#f3e2b4" stroke="#8a6a3e" stroke-width="1.6"/>`;
  for (let i = 0; i < 4; i++) art += `<path d="M${(10 + i * 38 + r('s' + i) * 10).toFixed(0)} ${i % 2 ? 112 : 8} q3 -3 6 0 t6 0" fill="none" stroke="#8fb3b0" stroke-width="1.3"/>`;
  for (let i = 0; i < 3; i++) { const x = 60 + r('m' + i) * 40, y = 42 + r('n' + i) * 16; art += `<path d="M${(x - 7).toFixed(0)} ${y.toFixed(0)} L${x.toFixed(0)} ${(y - 10).toFixed(0)} L${(x + 7).toFixed(0)} ${y.toFixed(0)}Z" fill="#d8c08a" stroke="#6b5130" stroke-width="1.2" stroke-linejoin="round"/>`; }
  for (let i = 0; i < 4; i++) { const x = 42 + r('t' + i) * 30, y = 70 + r('u' + i) * 18; art += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3.6" fill="#9cb87a" stroke="#5b6b3a" stroke-width="1"/>`; }
  art += `<path d="M36 34 C 58 44, 66 66, 86 70 S ${(X[0] - 14).toFixed(0)} ${(X[1] - 4).toFixed(0)}, ${X[0].toFixed(0)} ${X[1].toFixed(0)}" fill="none" stroke="#a04a32" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  art += `<g transform="translate(20 22)"><circle r="11" fill="none" stroke="#6b5130" stroke-width="1"/><path d="M0 -13 L3 0 L0 13 L-3 0Z M-13 0 L0 -3 L13 0 L0 3Z" fill="#6b5130"/><text y="-15" text-anchor="middle" font-size="7" font-weight="900" fill="#6b5130" font-family="Georgia,serif">N</text></g>`;
  art += `<path d="M${X[0] - 5} ${X[1] - 5} l10 10 M${X[0] + 5} ${X[1] - 5} l-10 10" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>`;
  let s = `<svg class="my-map" viewBox="-4 -4 168 128" role="img" aria-label="${esc(M.nm)} : ${have.filter(Boolean).length} morceaux sur 4"><defs><g id="${u}a">${art}</g>${polys.map((p, i) => `<clipPath id="${u}c${i}"><path d="${p}"/></clipPath>`).join('')}</defs>`;
  polys.forEach((p, i) => {
    if (have[i]) s += `<g transform="translate(${full ? 0 : off[i][0]} ${full ? 0 : off[i][1]})"><g clip-path="url(#${u}c${i})"><use href="#${u}a"/></g><path d="${p}" fill="none" stroke="#8a6a3e" stroke-width="1.2"/></g>`;
    else { const cx = i % 2 ? 120 : 40, cy = i < 2 ? 30 : 90; s += `<path d="${p}" fill="rgba(255,250,240,.45)" stroke="#b9a58a" stroke-width="1.2" stroke-dasharray="3 3"/><text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="20" font-weight="900" fill="#c9b796" font-family="Georgia,serif">?</text>`; }
  });
  return s + '</svg>';
}

// ---------------- actions ----------------
function myFollow(id) { const R = MY_R[id]; if (!myAvail(R) || myRec(id).done) return false; myState().cur = id; save(); myZoneUpd(); return true; }
// indice suivant : le 1er tout de suite, le 2e après 1 essai, le 3e après 2 essais
const myHintOk = (R, n) => { const r = myRec(R.id); return n === (r.h || 0) + 1 && n <= 3 && (r.tries || 0) >= n - 1; };
function myHint(id) {
  const R = MY_R[id], r = myRec(id); if (!R || r.done) return false;
  const n = (r.h || 0) + 1; if (!myHintOk(R, n)) return false;
  r.h = n; save(); myZoneUpd();
  return true;
}
function myDiscover(gid, how) {
  const G = MY_G[gid], g = myGRec(gid); if (!G || g.d) return false;
  g.d = 1; g.at = Date.now(); g.how = how || ''; save(); return true;
}
// prochain morceau manquant d'une carte
function myAddPiece(mid) {
  const p = myPieces(mid), i = p.indexOf(0); if (i < 0) return -1;
  p[i] = Date.now(); save();
  if (myComplete(mid)) setTimeout(() => { try { myMapUpdate(); } catch (e) {} }, 50);
  return i;
}
// condition d'une offrande pour un familier
function myCond(c, k) {
  if (!c) return { ok: true, txt: '' };
  if (c.night) return { ok: myCall(() => isNight(), false), txt: 'seulement la nuit (21 h à 6 h)' };
  if (c.g) { const [g, n] = c.g; return { ok: myCall(() => xpTierOf(k, g), 0) >= n, txt: `avec ${myCall(() => xpGName(g, n), g).toLowerCase()} équipé${n > 1 ? 's' : ''}` }; }
  if (c.m) { const [tr, n] = c.m; return { ok: myCall(() => xpLvl(k, tr), 1) >= n, txt: `${myCall(() => XP_T[tr][1], tr)} niveau ${n} au moins` }; }
  return { ok: true, txt: '' };
}
const myOffer = G => G.offers[Math.min(G.offers.length - 1, myGRec(G.id).t || 0)];
const myOfferMatch = o => it => myCall(() => qtIngMatch(o.k)(it), false) && !it.special && !it.mys && !it.qt && !it.xpr;
const myHave = o => S.inv.filter(myOfferMatch(o)).length;
function myChoose(gid, how) {
  const G = MY_G[gid], g = myGRec(gid); if (!G || g.done || (g.t || 0) < G.offers.length) return false;
  if (how === 'comp') {
    let genes = null; try { genes = randomGenes(G.csp, 5); } catch (e) {}
    const id = addComp({ sp: G.csp, name: G.cn, rarity: 4, genes, from: { how: 'gardien', place: G.where } });
    g.done = 'comp'; g.cid = id;
    toast(`${G.nm} vous confie ${G.cn}, un familier rare. Prenez-en bien soin !`);
  } else {
    g.done = 'bless'; toast(`Bénédiction du gardien : ${MY_BLESS[G.bless][0]} (${MY_BLESS[G.bless][1]}) pour toujours !`);
  }
  g.at = Date.now(); save(); return true;
}
// v36 : une offrande précieuse (pierre taillée) rend la bénédiction 50 % plus forte
const myBless = kind => MY_GUARDS.filter(G => G.bless === kind && myGRec(G.id).done === 'bless').reduce((a, G) => a + (myGRec(G.id).gem ? 1.5 : 1), 0);
const myGemOk = it => !!(it && it.cut && it.sub === 'gemme' && !it.special && !it.mys && !it.qt);

// ---------------- aller sur la carte ----------------
function myFree() { if (S.trips[S.sel]) { toast(`${myNm(S.sel)} est déjà en voyage. Choisissez un autre compagnon en haut.`); return false; } return true; }
function myToMap() { const m = $('modal'); if (m) m.hidden = true; if (tab !== 'carte') myCall(() => closeSheet(), 0); }
function mySearch(id) {
  const R = MY_R[id]; if (!R) return;
  myFollow(id); myToMap();
  const r = myRec(id), Z = myZone(R);
  if (Z && typeof map !== 'undefined' && map) {
    const dlat = Z.r / 111.2, dlon = dlat / Math.max(0.2, Math.cos(Z.lat * Math.PI / 180));
    myCall(() => map.fitBounds([[Z.lon - dlon, Z.lat - dlat], [Z.lon + dlon, Z.lat + dlat]], { padding: { top: 130, bottom: 170, left: 40, right: 70 }, duration: 900 }), 0);
  }
  toast(r.h >= 2 ? 'La réponse est quelque part dans le cercle violet. Touchez l’endroit exact, puis envoyez un familier !' : 'À vous de trouver ! Touchez l’endroit sur la carte (zoomez bien), puis envoyez un familier.');
}
function myGoGuard(gid) {
  const G = MY_G[gid]; if (!G || !myFree()) return;
  myToMap(); plan.dest = { id: null, name: G.where, country: '', lat: G.lat, lon: G.lon, tags: G.tags.slice(), special: null };
  openSheet('voyage'); drawMarks();
}
const mySecDest = M => ({ id: null, mysx: M.id, name: M.sec.name, country: '', lat: M.sec.lat, lon: M.sec.lon, tags: M.sec.tags.slice(), special: null });
function myGoSecret(mid) {
  const M = MY_M[mid]; if (!M || !myComplete(mid) || !myFree()) return;
  myToMap(); plan.dest = mySecDest(M); openSheet('voyage'); drawMarks();
  myCall(() => zoomTo(M.sec.lon, M.sec.lat), 0);
}

// ---------------- la zone d'indice sur la carte ----------------
function myZone(R) {
  const r = myRec(R.id); if (!R || r.done || (r.h || 0) < 2) return null;
  const T = myTarget(R); if (!T) return null;
  const rad = R.cats ? (r.h >= 3 ? 1.2 : 3.5) : (r.h >= 3 ? MY_RSMALL : MY_RBIG)[R.tier];
  // centre décalé (toujours autour de la réponse), stable pour une énigme et un indice
  const a = myRnd(R.id + 'a' + r.h) * Math.PI * 2, d = (0.25 + 0.35 * myRnd(R.id + 'd' + r.h)) * rad;
  const lat = T.lat + Math.sin(a) * d / 111.2, lon = T.lon + Math.cos(a) * d / (111.2 * Math.max(0.2, Math.cos(T.lat * Math.PI / 180)));
  return { lon, lat, r: rad };
}
let myZoneSig = '';
function myZoneUpd() {
  if (typeof map === 'undefined' || !map || typeof mapReady === 'undefined' || !mapReady) return;
  if (!map.getSource('mys-zone')) {
    try {
      map.addSource('mys-zone', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      const before = map.getLayer('route-shadow') ? 'route-shadow' : undefined;
      map.addLayer({ id: 'mys-fill', type: 'fill', source: 'mys-zone', paint: { 'fill-color': '#9b6fd0', 'fill-opacity': 0.1 } }, before);
      map.addLayer({ id: 'mys-line', type: 'line', source: 'mys-zone', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#7a4fa0', 'line-width': 2.6, 'line-dasharray': [1.2, 1.8] } }, before);
      myZoneSig = '';
    } catch (e) { return; }
  }
  const R = myTuto() ? null : myCur(), Z = R ? myZone(R) : null;
  const sig = Z ? `${R.id}:${Z.lon.toFixed(3)}:${Z.lat.toFixed(3)}:${Z.r}` : '';
  if (sig === myZoneSig) return; myZoneSig = sig;
  const feats = Z ? [{ type: 'Feature', properties: {}, geometry: d3.geoCircle().center([Z.lon, Z.lat]).radius(Z.r / 111.195).precision(Z.r > 100 ? 2 : 0.5)() }] : [];
  try { map.getSource('mys-zone').setData({ type: 'FeatureCollection', features: feats }); } catch (e) {}
}

// ---------------- épingles des lieux secrets ----------------
let myPinSig = '';
function myMapUpdate() {
  myZoneUpd();
  if (typeof map === 'undefined' || !map || typeof ovEls === 'undefined' || !$('ov')) return;
  const on = tab === 'carte' && !document.body.classList.contains('firstrun') && !myTuto();
  const list = on ? MY_MAPS.filter(M => myComplete(M.id)) : [];
  const sig = list.map(M => M.id + (myState().x[M.id] ? '+' : '')).join(','), alive = list.every((M, i) => ovEls['ms' + i] && ovEls['ms' + i].el.isConnected);
  if (sig === myPinSig && alive) return;
  myPinSig = sig;
  for (const key of Object.keys(ovEls)) if (key.startsWith('ms')) { ovEls[key].el.remove(); delete ovEls[key]; }
  list.forEach((M, i) => {
    const el = document.createElement('div'), won = !!myState().x[M.id];
    el.className = 'ovm myspin' + (won ? ' won' : ''); el.dataset.mysx = M.id;
    el.innerHTML = `<div class="mysb">${MY_XMARK}</div><span class="xpn">${esc(M.sec.name)}</span>`;
    $('ov').appendChild(el); ovEls['ms' + i] = { el, lon: M.sec.lon, lat: M.sec.lat };
  });
  if (typeof positionOverlay === 'function') positionOverlay();
}
try { $('ov').addEventListener('click', ev => { const m = ev.target.closest('.myspin'); if (m) myGoSecret(m.dataset.mysx); }); } catch (e) {}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); try { myMapUpdate(); } catch (e) {} return r; })(drawMarks);
let myHooked = false;
setInterval(() => {
  try {
    if (document.hidden) return;
    if (!myHooked && typeof map !== 'undefined' && map && map.on) { myHooked = true; map.on('moveend', () => { try { myMapUpdate(); } catch (e) {} }); }
    myMapUpdate();
  } catch (e) {}
}, 2000);

// ---------------- départ ----------------
if (typeof xpIsExpe === 'function') xpIsExpe = (orig => function (d) { return d && d.mysx ? true : orig.apply(this, arguments); })(xpIsExpe);
if (typeof xpRiskK === 'function') xpRiskK = (orig => function () { const r = orig.apply(this, arguments); const n = myBless('prud'); return n && r > 0 ? Math.max(0.03, r * Math.pow(0.8, n)) : r; })(xpRiskK);
if (typeof xpGain === 'function') xpGain = (orig => function (k, terr, n) { const b = myBless('terr'); return orig.call(this, k, terr, b ? Math.round(n * (1 + 0.3 * b)) : n); })(xpGain);
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, dest = plan.dest, off = !!plan.mysOff, before = S.trips[k];
  const r = orig.apply(this, arguments);
  plan.mysOff = false;
  try {
    const t = S.trips[k];
    if (t && t !== before && !t.tuto && dest && !myTuto()) {
      const R = myCur(); if (R && !off && !dest.mysx) t.mys = R.id;
      const v = myBless('vit'); if (v && t.out > 0) { const f = Math.pow(0.92, v); t.out = Math.round(t.out * f); t.stay = Math.round((t.stay || 0) * f); t.total = 2 * t.out + t.stay; }
      const c = myBless('chance'); if (c) t.luck += 0.5 * c;
      if (dest.mysx) t.journal.push({ t: Date.now(), kind: 'mys', text: `${myNm(k)} déplie la ${MY_M[dest.mysx].nm.toLowerCase()} reconstituée. La croix rouge l’attend : ${dest.name}. Courage !`, chips: [['place', 'lieu secret']] });
      save();
    }
  } catch (e) { console.error('mystères départ', e); }
  return r;
})(startTrip);
function myGoHTML(d, k) {
  let h = '';
  const R = myCur();
  if (R && !d.mysx) {
    const on = !plan.mysOff;
    h += `<div class="mygo"><span class="mygo-i">${MY_SCROLL}</span><span class="mygo-x"><b>Énigme suivie · ${MY_TIER[R.tier]}</b><small>« ${esc(R.q)} »</small></span><button class="mygo-t${on ? ' on' : ''}" data-mystry="1" aria-pressed="${on}">${on ? '✓ Chercher ici' : 'Chercher ici ?'}</button></div>`;
  }
  const G = MY_GUARDS.find(x => myGRec(x.id).d && !myGRec(x.id).done && (myGRec(x.id).t || 0) < x.offers.length && myKm(x, d) <= MY_G_VISIT);
  if (G) {
    const o = myOffer(G), c = myCond(o.c, k), n = myHave(o), g = myGRec(G.id);
    h += `<div class="mygo g">${myGuardImg(G, true, 's')}<span class="mygo-x"><b>${esc(G.nm)} · confiance ${g.t || 0}/${G.offers.length}</b><small>Offrande : ${esc(o.t)} · vous en avez <b class="${n ? 'ok' : 'no'}">${n}</b>${c.txt ? ` · ${esc(c.txt)} <b class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'}</b>` : ''}</small></span></div>`;
  }
  if (d.mysx) { const M = MY_M[d.mysx], won = myState().x[M.id]; h += `<div class="mygo sec"><span class="mygo-i">${MY_XMARK}</span><span class="mygo-x"><b>Lieu secret : expédition finale</b><small>${won ? 'Trésor déjà trouvé.' : `Trésor unique : ${esc(M.tr[0])} · titre « ${esc(M.ti)} » · ${M.coins} pièces`}</small></span></div>`; }
  return h;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel, d = plan.dest;
    if (box && d && !S.trips[k] && CHARS[k] && !myTuto()) {
      const html = myGoHTML(d, k);
      if (html) { const gb = box.querySelector('.gobar'); if (gb) gb.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
    }
  } catch (e) { console.error('mystères panneau', e); }
  return r;
})(renderVoyage);

// ---------------- à l'arrivée : le moment fort ----------------
function myJ(t, text, chips) { t.journal.push({ t: Date.now(), kind: 'mys', place: t.dest.name, text, chips: chips || [] }); S.unseen[t.comp] = (S.unseen[t.comp] || 0) + 1; }
function myLog(t, o) { (t.mysLog = Array.isArray(t.mysLog) ? t.mysLog : []).push(o); }
function myOnArrive(t) {
  const k = t.comp, n = myNm(k), d = t.dest; if (!d || t.mysArr) return; t.mysArr = 1;
  // 1. énigme
  const R = t.mys ? MY_R[t.mys] : null;
  if (R && !myRec(R.id).done) {
    const V = myCheck(R, d), r = myRec(R.id);
    r.tries = (r.tries || 0) + 1;
    if (V.ok) {
      myJ(t, `En approchant, ${n} reconnaît chaque détail de l’énigme… « ${R.q} » Son cœur bat très fort !`, [['ask', 'on approche…']]);
      r.done = 1; r.by = k; r.at = Date.now(); if (myState().cur === R.id) myState().cur = '';
      const v = myRwVals(R), got = [];
      if (R.rw.it) { const it = makeItem(R.rw.it, 0, `Énigme : ${R.name}`, d.tags || [], { fixed: R.rw.it[3] }); it.special = true; it.mys = 1; t.bag.push(it); got.push(it.name); }
      if (R.rw.pc) { const i = myAddPiece(R.rw.pc); if (i >= 0) got.push(`morceau ${i + 1}/4 de la ${MY_M[R.rw.pc].nm.toLowerCase()}`); }
      if (R.rw.gd && myDiscover(R.rw.gd, 'énigme')) got.push(`le secret de ${MY_G[R.rw.gd].nm.toLowerCase()}`);
      const X = myCall(() => xpState(), null); if (X) (X.titles[k] = Array.isArray(X.titles[k]) ? X.titles[k] : []).push(R.rw.ti);
      t.coins = (t.coins || 0) + v.coins; myCall(() => xpGain(k, t.xpTerr || xpTerrOf(d), v.xp), 0);
      myJ(t, `Trouvé ! C’est bien ici : ${R.name}. Sous une pierre plate, un petit coffret attendait ${n}.`, [['rare', 'énigme résolue'], ['place', R.rw.ti]]);
      myLog(t, { k: 'ok', id: R.id, got, stones: v.stones, coins: v.coins, h: v.h });
    } else {
      myJ(t, `${n} cherche partout… mais rien ne correspond à l’énigme. ${V.txt}`, [['back', 'pas ici']]);
      myLog(t, { k: 'ko', id: R.id, txt: V.txt, tries: r.tries });
    }
  }
  // 2. gardien : visite avec offrande
  const G = MY_GUARDS.find(x => myGRec(x.id).d && !myGRec(x.id).done && (myGRec(x.id).t || 0) < x.offers.length && myKm(x, d) <= MY_G_VISIT);
  if (G) {
    const g = myGRec(G.id), o = myOffer(G), c = myCond(o.c, k);
    if (!c.ok) { myJ(t, `${G.nm} reste caché… Il ne se montrera que ${c.txt}.`, [['wild', 'gardien caché']]); myLog(t, { k: 'gcond', g: G.id, txt: c.txt }); }
    else {
      const m = myOfferMatch(o), low = a => a.filter(m).sort((x, y) => (x.rarity || 0) - (y.rarity || 0))[0]; let it = low(S.inv), from = S.inv;
      if (!it) { it = low(t.bag); from = t.bag; }
      let gem = false; if (!it) { it = S.inv.filter(myGemOk).sort((x, y) => (x.rarity || 0) - (y.rarity || 0))[0]; from = S.inv; gem = !!it; }
      if (it) {
        from.splice(from.indexOf(it), 1); g.t = (g.t || 0) + 1; g.last = Date.now(); if (gem) g.gem = (g.gem || 0) + 1;
        const full = g.t >= G.offers.length;
        myJ(t, `${G.nm} sort doucement de sa cachette. ${n} pose ${o.t} devant lui… Il s’approche et accepte l’offrande${gem ? ` précieuse (${it.name}) : sa bénédiction sera plus forte` : ''} !${full ? ' Il a désormais toute confiance en vous.' : ''}`, [['friend', `confiance ${g.t}/${G.offers.length}`]]);
        myLog(t, { k: 'gvisit', g: G.id, t: g.t, of: o.t, it: it.name, full });
      } else { myJ(t, `${G.nm} observe ${n} de loin… Il espérait ${o.t}.`, [['wild', 'sans offrande']]); myLog(t, { k: 'gwait', g: G.id, of: o.t }); }
    }
  }
  // 3. rumeur d'un gardien (voyage proche)
  const near = MY_GUARDS.filter(x => !myGRec(x.id).d).map(x => ({ x, km: myKm(x, d) })).filter(o => o.km <= MY_G_RUM).sort((a, b) => a.km - b.km)[0];
  if (near) {
    const p = myP.rum != null ? myP.rum : near.km < 100 ? 0.6 : near.km < 400 ? 0.35 : 0.15;
    if (Math.random() < p && myDiscover(near.x.id, 'rumeur')) { myJ(t, `Au coin du feu, une rumeur : « ${near.x.rum} »`, [['rumor', 'rumeur de gardien']]); myLog(t, { k: 'rum', g: near.x.id }); }
  }
  // 4. morceau de carte déchirée (rare, dans des zones précises)
  if (!d.poi && !d.mysx) {
    const M = MY_MAPS.find(x => !myComplete(x.id) && myKm({ lon: x.zone[0], lat: x.zone[1] }, d) <= x.zone[2]);
    if (M) {
      const p = myP.piece != null ? myP.piece : (0.07 + (t.dur === 'expe' || t.dur === 'long' ? 0.05 : 0)) * (1 + myBless('flair'));
      if (Math.random() < p) { const i = myAddPiece(M.id); if (i >= 0) { myJ(t, `Coincé entre deux pierres, ${n} trouve un vieux parchemin déchiré : un morceau de la ${M.nm.toLowerCase()} !`, [['rumor', `morceau ${i + 1}/4`]]); myLog(t, { k: 'piece', m: M.id, i, how: 'voyage' }); } }
    }
  }
  save();
}
if (typeof fireEvent === 'function') fireEvent = (orig => function (t, e) {
  const r = orig.apply(this, arguments);
  try { if (e && e.type === 'arrivee' && t && !t.tuto && !myTuto()) myOnArrive(t); } catch (err) { console.error('mystères arrivée', err); }
  return r;
})(fireEvent);

// ---------------- au retour : lieux verrouillés, lieu secret, butin ----------------
let myHaul = null;
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  myHaul = null;
  try {
    if (t && t.done && !t.tuto && !myTuto()) {
      const log = Array.isArray(t.mysLog) ? t.mysLog.slice() : [];
      if (t.mys && !t.mysArr) log.push({ k: 'noarr', id: t.mys });
      // lieu verrouillé conquis pour la première fois : un morceau de carte
      const lock = t.xpe && t.xpe.lock;
      if (lock && !t.xpFail && !myCall(() => xpState().won[lock], 1)) {
        const M = MY_MAPS.find(x => x.locks.includes(lock) && !myComplete(x.id));
        if (M) { const i = myAddPiece(M.id); if (i >= 0) log.push({ k: 'piece', m: M.id, i, how: 'lieu verrouillé' }); }
      }
      // expédition finale vers un lieu secret
      if (t.dest && t.dest.mysx) {
        const M = MY_M[t.dest.mysx], X = myState();
        if (!t.xpFail && !X.x[M.id]) {
          X.x[M.id] = { k, at: Date.now() };
          const it = makeItem(M.tr, 0, `Trésor : ${M.sec.name}`, M.sec.tags, { fixed: 4 }); it.special = true; it.mys = 1; t.bag.push(it);
          const XS = myCall(() => xpState(), null); if (XS) (XS.titles[k] = Array.isArray(XS.titles[k]) ? XS.titles[k] : []).push(M.ti);
          t.coins = (t.coins || 0) + M.coins; myCall(() => xpGain(k, t.xpTerr || xpTerrOf(t.dest), 100), 0);
          log.push({ k: 'secret', m: M.id, it: it.name });
        } else if (t.xpFail) log.push({ k: 'secretko', m: M.id });
      }
      const fo = myBless('or'); if (fo && t.coins > 0) t.coins = Math.round(t.coins * (1 + 0.15 * fo));
      if (log.length) myHaul = { k, log, at: Date.now() };
      save();
    }
  } catch (e) { console.error('mystères retour', e); }
  return orig.apply(this, arguments);
})(collect);
function myHaulHTML(H) {
  const n = myNm(H.k), rows = [];
  for (const L of H.log) {
    if (L.k === 'ok') { const R = MY_R[L.id]; rows.push(`<div class="myh big ok"><span class="myh-i">${MY_SCROLL}</span><span><b>J’ai trouvé ! Énigme résolue : ${esc(R.name)}</b><small>« ${esc(R.q)} »</small><small class="myh-rw">${L.got.map(esc).join(' · ')}${L.got.length ? ' · ' : ''}titre « ${esc(R.rw.ti)} » · +${L.coins} pièces${L.h ? ` <em>(${L.h} indice${L.h > 1 ? 's' : ''})</em>` : ' <em>sans indice, bravo !</em>'}</small></span></div>`); }
    else if (L.k === 'ko') rows.push(`<div class="myh ko"><span class="myh-i">${MY_SCROLL}</span><span><b>${esc(L.txt)}</b><small>Aucune pénalité : réessayez quand vous voulez. Essai n° ${L.tries}.${myHintOk(MY_R[L.id], (myRec(L.id).h || 0) + 1) ? ' Un nouvel indice est disponible dans Quêtes.' : ''}</small></span></div>`);
    else if (L.k === 'noarr') rows.push(`<div class="myh ko"><span class="myh-i">${MY_SCROLL}</span><span><b>${esc(n)} n’a pas pu chercher la réponse de l’énigme.</b><small>Le voyage s’est arrêté avant l’arrivée. Retentez votre chance !</small></span></div>`);
    else if (L.k === 'piece') { const M = MY_M[L.m]; rows.push(`<div class="myh piece"><span class="myh-m">${myMapSVG(M)}</span><span><b>Morceau de carte : ${esc(M.nm)} (${myPieces(M.id).filter(Boolean).length}/4)</b><small>${L.how === 'lieu verrouillé' ? 'Caché au sommet du lieu conquis !' : L.how === 'voyage' ? `Trouvé en voyage (${esc(M.zn)}).` : ''}${myComplete(M.id) ? ` Carte complète : le lieu secret « ${esc(M.sec.name)} » est sur la carte du monde !` : ''}</small></span></div>`); }
    else if (L.k === 'rum') { const G = MY_G[L.g]; rows.push(`<div class="myh rum">${myGuardImg(G, true, 's')}<span><b>Rumeur : un gardien légendaire !</b><small>« ${esc(G.rum)} » ${esc(G.nm)} vous attend : ${esc(G.where)}. Voir Quêtes › Gardiens.</small></span></div>`); }
    else if (L.k === 'gvisit') { const G = MY_G[L.g]; rows.push(`<div class="myh g">${myGuardImg(G, true, 's')}<span><b>${esc(G.nm)} : confiance ${L.t}/${G.offers.length}</b><small>Il a accepté ${esc(L.of)} (${esc(L.it)}).${L.full ? ' Il vous fait entièrement confiance : choisissez sa récompense dans Quêtes.' : ` Prochaine offrande : ${esc(myOffer(G).t)}.`}</small></span></div>`); }
    else if (L.k === 'gwait') { const G = MY_G[L.g]; rows.push(`<div class="myh g wait">${myGuardImg(G, true, 's')}<span><b>${esc(G.nm)} est resté à distance.</b><small>Il espérait ${esc(L.of)}. Trouvez-en et revenez !</small></span></div>`); }
    else if (L.k === 'gcond') { const G = MY_G[L.g]; rows.push(`<div class="myh g wait">${myGuardImg(G, true, 's')}<span><b>${esc(G.nm)} ne s’est pas montré.</b><small>Il ne vient que ${esc(L.txt)}.</small></span></div>`); }
    else if (L.k === 'secret') { const M = MY_M[L.m]; rows.push(`<div class="myh big ok"><span class="myh-i">${MY_XMARK}</span><span><b>Le trésor du lieu secret est à vous : ${esc(L.it)} !</b><small>${esc(M.sec.name)} · titre « ${esc(M.ti)} » · +${M.coins} pièces · +100 XP</small></span></div>`); }
    else if (L.k === 'secretko') { const M = MY_M[L.m]; rows.push(`<div class="myh ko"><span class="myh-i">${MY_XMARK}</span><span><b>Demi-tour avant ${esc(M.sec.name)}…</b><small>Le trésor vous attend toujours. Mieux équipé, retentez l’expédition !</small></span></div>`); }
  }
  return rows.length ? `<div class="my-haul">${rows.join('')}</div>` : '';
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const H = myHaul;
    if (H && h && h.comp === H.k && Date.now() - H.at < 30000) {
      myHaul = null;
      const html = myHaulHTML(H), mb = document.querySelector('#modal .mbox'), hd = mb && mb.querySelector('.hhead');
      if (html) { if (hd) hd.insertAdjacentHTML('afterend', html); else if (mb) mb.insertAdjacentHTML('afterbegin', html); }
    }
  } catch (e) { console.error('mystères butin', e); }
  return r;
})(showHaul);

// ---------------- page Quêtes : Énigmes, Gardiens, Cartes déchirées ----------------
let myWhere = '';
function myRiddleBig(R, followed) {
  const r = myRec(R.id), tol = R.cats ? `un lieu de ce type à moins de ${MY_HOME_KM} km de chez vous` : `à moins de ${MY_TOL[R.tier]} km du bon endroit`;
  const hint = (i, lbl, body) => {
    const used = (r.h || 0) >= i, ok = myHintOk(R, i);
    return `<li class="${used ? 'on' : ''}"><i>${i}</i><div>${used ? body : `<b>${lbl}</b><small>${ok ? 'Réduit un peu la récompense.' : `Disponible après ${i - 1} essai${i > 2 ? 's' : ''} (et l’indice ${i - 1}).`}</small>`}</div>${!used && ok ? `<button class="btn cream sm" data-myshint="${R.id}">Voir</button>` : ''}</li>`;
  };
  const art = myCall(() => qmRewardArt(qmRiddleRw(R, 'explo'), 84), '');
  return `<div class="my-big" id="qmq-ri_${R.id}"><div class="my-bh">${art || `<span class="my-bi">${MY_SCROLL}</span>`}<div><span class="bqc-kick">${followed ? 'Énigme suivie' : 'Énigme à suivre'} · ${MY_TIER[R.tier]}</span>${myCall(() => qmMeta('explo', R.tier, []), '')}<p class="my-q">« ${esc(R.q)} »</p><small class="my-rwl">${esc(myCall(() => qmRName(qmRiddleRw(R, 'explo')), ''))} · titre « ${esc(R.rw.ti)} »</small></div></div>
    <ol class="my-hints">${hint(1, 'Indice 1 : un indice écrit', `<b>${esc(R.h1)}</b>`)}${hint(2, 'Indice 2 : une grande zone sur la carte', '<b>Une grande zone violette est tracée sur la carte.</b>')}${hint(3, 'Indice 3 : une zone plus petite', '<b>La zone violette s’est resserrée.</b>')}</ol>
    <details class="qmc-more my-howd"><summary aria-label="Comment jouer">+</summary><div>Trouvez l’endroit vous-même sur la carte et envoyez-y un familier : il faut arriver ${tol}. Essais : <b>${r.tries || 0}</b> · un essai raté ne coûte que du temps.</div></details>
    <div class="my-acts">${followed ? '' : `<button class="btn cream" data-mysfollow="${R.id}">Suivre</button>`}<button class="btn green" data-myssearch="${R.id}">Chercher sur la carte</button></div></div>`;
}
function myRiddlesHTML() {
  const cur = myCur(), first = cur || MY_RIDDLES.find(R => myAvail(R) && !myRec(R.id).done);
  let h = `<h3 class="qt-h3" id="myEnigmes">🧩 Énigmes <small>${myDoneN()}/${MY_RIDDLES.length} · un indice culturel, devinez le lieu célèbre</small></h3>`;
  h += first ? myRiddleBig(first, first === cur) : '<p class="qt-hint">Toutes les énigmes ouvertes sont résolues. Bravo !</p>';
  for (const tier of [1, 2, 3]) {
    const list = MY_RIDDLES.filter(R => R.tier === tier), open = myTierOpen(tier);
    h += `<div class="my-tier"><b class="my-tt t${tier}">${MY_TIER[tier]}</b><small>${list.filter(R => myRec(R.id).done).length}/${list.length}${open ? '' : ` · se débloque après ${MY_UNLOCK[tier] - myDoneN(tier - 1)} énigme${MY_UNLOCK[tier] - myDoneN(tier - 1) > 1 ? 's' : ''} ${MY_TIER[tier - 1]}${MY_UNLOCK[tier] - myDoneN(tier - 1) > 1 ? 's' : ''} de plus`}</small></div>`;
    if (!open) continue;
    h += `<div class="my-list">${list.filter(R => R !== first).map(R => { const r = myRec(R.id), rw = myCall(() => Object.assign(qmRiddleRw(R, 'explo'), { got: !!r.done }), null); return qmCard({ id: 'ri_' + R.id, mode: 'explo', cls: r.done ? 'done' : '', art: rw ? qmRewardArt(rw, 64, { pills: !r.done }) : '', t: r.done ? esc(R.name) : `« ${esc(R.q.length > 56 ? R.q.slice(0, 54) + '…' : R.q)} »`, line: `Titre « ${esc(R.rw.ti)} »${r.tries && !r.done ? ` · ${r.tries} essai${r.tries > 1 ? 's' : ''}` : ''}`, dif: r.done ? 0 : R.tier, more: r.done || R.q.length <= 56 ? '' : `« ${esc(R.q)} »`, btn: r.done ? '<span class="qt-ok">✔</span>' : `<button class="btn cream sm" data-mysfollow="${R.id}">Suivre</button>` }); }).join('')}</div>`;
  }
  return h;
}
function myWhereHTML(o) {
  let rows = '';
  try {
    if (typeof CF_GO !== 'undefined' && CF_GO.length > 200) CF_GO.length = 0;
    rows = cfLocs(o.k).map(L => { const i = CF_GO.push({ step: L.step, name: cmIngName(o.k), why: 'offrande d’un gardien' }) - 1; return `<div class="cf-loc"><span class="cf-pin">${myCall(() => btIco(L.step.region ? 'reg' : 'lieu'), '')}</span><span class="cf-lx"><b>${esc(L.label)}</b><small>${esc(L.sub || '')}${L.km != null ? `${L.sub ? ' · ' : ''}${fmtDist(L.km)}` : ''}</small></span><button class="btn gold sm" data-cfgo="${i}">Y aller</button></div>`; }).join('');
  } catch (e) {}
  return `<div class="cf-miss my-where"><div class="cf-mh"><b>Où trouver : ${esc(cmIngName(o.k))}</b><button class="cf-x" data-myswhere="" aria-label="Fermer">✕</button></div><div class="cf-mi"><div class="cf-mih"><span class="cf-ii">${myCall(() => cmIngIcon(o.k), '')}</span><span class="cf-mx"><b>${esc(o.t)}</b><span>Vous en avez <b class="cf-cnt">${myHave(o)}/1</b></span></span></div>${rows ? `<div class="cf-locs"><small class="cf-lt">Où le trouver, au plus près :</small>${rows}</div>` : '<p class="cf-lt">En voyage : événements, marchands ambulants et marché mondial.</p>'}</div></div>`;
}
function myGuardHTML(G) {
  const g = myGRec(G.id), N = G.offers.length;
  const gart = (myst, got) => myCall(() => qmRewardArt({ k: 'guard', G, mode: 'hist', myst, got }, 72), '') || myGuardImg(G, !myst);
  if (!g.d) return `<div class="my-g sil" id="qmq-gd_${G.id}">${gart(true, false)}<div><b>Gardien inconnu</b><small>Écoutez les rumeurs en voyage.</small></div></div>`;
  const pips = Array.from({ length: N }, (_, i) => `<i class="${i < (g.t || 0) ? 'on' : ''}"></i>`).join('');
  let body = '';
  if (g.done === 'comp') body = `<small class="my-gd">Il vous a confié ${esc(myCall(() => S.comps[g.cid].name, G.cn))}, un familier rare.</small>`;
  else if (g.done === 'bless') body = `<small class="my-gd">Bénédiction : <b>${esc(MY_BLESS[G.bless][0])}</b> · ${esc(MY_BLESS[G.bless][1])}${g.gem ? ' · <b>renforcée (×1,5) par une pierre taillée</b>' : ''}</small>`;
  else if ((g.t || 0) >= N) body = `<small>Il vous fait entièrement confiance. Choisissez :</small><div class="my-acts"><button class="btn green sm" data-mysch="${G.id}:comp">Familier rare (${esc(myCall(() => spName(G.csp), G.csp).toLowerCase())})</button><button class="btn gold sm" data-mysch="${G.id}:bless">Bénédiction : ${esc(MY_BLESS[G.bless][1])}</button></div>`;
  else {
    const o = myOffer(G), c = myCond(o.c, S.sel), n = myHave(o);
    body = `<div class="my-off"><span class="my-oi">${myCall(() => cmIngIcon(o.k), '')}</span><span><small>Visite ${(g.t || 0) + 1}/${N} : il aime</small><b>${esc(o.t)}</b><small>Vous en avez ${n}${c.txt ? ` · ${esc(c.txt)}` : ''}</small></span></div><div class="my-acts"><button class="btn cream sm" data-myswhere="${G.id}">Où la trouver</button><button class="btn gold sm" data-mysgg="${G.id}">Y aller</button></div>${myWhere === G.id ? myWhereHTML(o) : ''}`;
  }
  return `<div class="my-g${g.done ? ' done' : ''}" id="qmq-gd_${G.id}">${gart(false, !!g.done)}<div><b>${esc(G.nm)}</b><small>${esc(G.where)} · familier légendaire ou bénédiction</small>${g.done ? '' : myCall(() => qmMeta('hist', Math.max(1, Math.min(3, N - 2)), []), '')}<span class="my-pips" aria-label="Confiance ${g.t || 0} sur ${N}">${pips}</span>${body}</div></div>`;
}
function myMapsHTML() {
  return `<h3 class="qt-h3" id="myCartes">Cartes déchirées <small>4 morceaux chacune</small></h3><div class="my-maps">${MY_MAPS.map(M => {
    const n = myPieces(M.id).filter(Boolean).length, full = n === 4, won = myState().x[M.id];
    return `<div class="my-mc${full ? ' full' : ''}" id="myMap_${M.id}"><span class="my-mcv">${myMapSVG(M)}${myCall(() => qmRewardArt({ k: 'item', def: M.tr, mode: 'explo', myst: !full && !won, got: !!won }, 46, { pills: false }), '')}</span><b>${esc(M.nm)}</b>${won ? '' : myCall(() => qmMeta('explo', M.zone[2] > 1000 ? 3 : 2, []), '')}<small>${full ? (won ? `Trésor trouvé : ${esc(M.tr[0])} ✔` : `Lieu secret révélé : ${esc(M.sec.name)}`) : `${n}/4 morceaux · en voyage (${esc(M.zn)}), énigmes${M.locks.length ? ', lieux à cadenas' : ''}`}</small>${full && !won ? `<button class="btn green sm" data-mysx="${M.id}">Expédition finale</button>` : ''}</div>`;
  }).join('')}</div>`;
}
function mySectionsHTML() {
  const known = MY_GUARDS.filter(G => myGRec(G.id).d).length;
  return `<section class="my-sec">${myRiddlesHTML()}<h3 class="qt-h3" id="myGardiens">Gardiens légendaires <small>${known}/${MY_GUARDS.length} découverts</small></h3><div class="my-gs">${MY_GUARDS.map(myGuardHTML).join('')}</div>${myMapsHTML()}</section>`;
}
if (typeof qtPageHTML === 'function') qtPageHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  try {
    if (myTuto()) return h;
    const at = h.indexOf('<h3 class="qt-h3">Histoires');
    return at >= 0 ? h.slice(0, at) + mySectionsHTML() + h.slice(at) : h;
  } catch (e) { console.error('mystères page', e); return h; }
})(qtPageHTML);
function myRefresh() {
  const m = $('modal'); if (!m || m.hidden || !m.querySelector('.qt-page')) return;
  const mb = m.querySelector('.mbox'), y = mb.scrollTop; showModal(qtPageHTML()); mb.scrollTop = y;
}

// ---------------- « Sert à… » : offrandes ----------------
try { GAME.addUses(it => myCall(() => myGemOk(it) && MY_GUARDS.some(G => { const g = myGRec(G.id); return g.d && !g.done && (g.t || 0) < G.offers.length; }) ? [{ txt: 'Offrande précieuse pour un gardien : bénédiction plus forte', kind: 'recette' }] : [], [])); } catch (e) {}
try { GAME.addUses(it => myCall(() => MY_GUARDS.filter(G => { const g = myGRec(G.id); return g.d && !g.done && (g.t || 0) < G.offers.length && myOfferMatch(myOffer(G))(it); }).slice(0, 1).map(G => ({ txt: `Offrande pour ${G.nm.toLowerCase()} (${G.where})`, kind: 'recette' })), [])); } catch (e) {}

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-mysfollow],[data-myshint],[data-myssearch],[data-myswhere],[data-mysgg],[data-mysch],[data-mysx],[data-mystry]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.mystry) { plan.mysOff = !plan.mysOff; const b = $('panelBody'), y = b ? b.scrollTop : 0; myCall(() => renderPanel(), 0); if (b) b.scrollTop = y; return; }
  if (d.mysx && !el.closest('.qt-page')) return; // épingle : gérée par la carte
  if (d.mysfollow) { myFollow(d.mysfollow); myRefresh(); const e = $('myEnigmes'); if (e) e.scrollIntoView({ block: 'start' }); return; }
  if (d.myshint) { if (myHint(d.myshint)) { myCall(() => sfx('pop'), 0); toast(myRec(d.myshint).h >= 2 ? 'Indice : une zone violette est tracée sur la carte.' : 'Indice dévoilé !'); } myRefresh(); return; }
  if (d.myssearch) return mySearch(d.myssearch);
  if (d.myswhere != null) { myWhere = myWhere === d.myswhere ? '' : d.myswhere; myRefresh(); return; }
  if (d.mysgg) return myGoGuard(d.mysgg);
  if (d.mysch) { const [g, how] = d.mysch.split(':'); myChoose(g, how); myRefresh(); return; }
  if (d.mysx) return myGoSecret(d.mysx);
});

// ---------------- style ----------------
(function myCSS() {
  const st = document.createElement('style'); st.id = 'myCSS';
  st.textContent = `
.my-sec{display:flex;flex-direction:column;gap:8px}
.my-big{display:flex;flex-direction:column;gap:8px;padding:10px;border:2.5px solid var(--ink,#4a3528);border-radius:18px;background:linear-gradient(180deg,#f6ecff,#fffaf0)}
.my-bh{display:flex;gap:8px;align-items:flex-start}.my-bi{width:42px;height:42px;flex:none}.my-bi svg{width:100%;height:100%}
.my-q{margin:2px 0 0;font:800 17px/1.25 var(--display,inherit);color:#4a2e6a}
.my-hints{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.my-hints li{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:12px;background:#fff;border:1.6px dashed #c9b6e0;font-size:13px}
.my-hints li.on{border-style:solid;border-color:#9b6fd0;background:#f3eafc}
.my-hints li>div{flex:1;min-width:0}.my-hints b{display:block;font-weight:800}.my-hints small{color:var(--ink2,#7a6250)}
.my-hints i{width:22px;height:22px;flex:none;border-radius:50%;background:#7a4fa0;color:#fff;font:800 12px/22px var(--display,inherit);text-align:center;font-style:normal}
.my-how{margin:0;font-size:12.5px;line-height:1.35;color:var(--ink2,#7a6250)}
.my-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.my-big .my-acts .btn{flex:1}
.my-tier{display:flex;align-items:baseline;gap:8px;margin-top:4px}.my-tier small{font-size:12px;color:var(--ink2,#7a6250)}
.my-tt{padding:1px 10px;border-radius:999px;color:#fff;font:800 12px var(--display,inherit);text-transform:capitalize}
.my-tt.t1{background:#3f9a5f}.my-tt.t2{background:#d98a2a}.my-tt.t3{background:#b23f5f}
.my-list{display:flex;flex-direction:column;gap:4px}
.my-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:12px;background:#fffaf0;border:1.6px solid var(--line,#e2d3bd)}
.my-row>div{flex:1;min-width:0}.my-row b{display:block;font-size:13px;line-height:1.25}.my-row small{font-size:11.5px;color:var(--ink2,#7a6250)}
.my-row.done{background:#eef7ee}.my-ri{width:26px;height:26px;flex:none;border-radius:50%;background:#efe4fa;color:#7a4fa0;font:900 15px/26px Georgia,serif;text-align:center}
.my-row.done .my-ri{background:#d6efd9;color:#2f7f4c}
.my-gs{display:flex;flex-direction:column;gap:6px}
.my-g{display:flex;gap:10px;align-items:flex-start;padding:8px;border:2px solid var(--line,#e2d3bd);border-radius:16px;background:#fffaf0}
.my-g>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.my-g>div>b{font:800 15px var(--display,inherit)}.my-g small{font-size:12px;color:var(--ink2,#7a6250)}
.my-g.done{background:#fff6d8;border-color:#e0a52a}.my-g.sil{background:#f2ede6}
.my-gimg{position:relative;width:64px;height:64px;flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle,var(--au,#fff3c4) 0 45%,rgba(242,193,78,.55) 62%,transparent 72%)}
.my-gimg img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 4px rgba(242,193,78,.9))}
.my-gimg.sil{background:radial-gradient(circle,#ddd3c6 0 50%,transparent 72%)}.my-gimg.sil img{filter:brightness(0) opacity(.45)}
.my-gimg.s{width:44px;height:44px}
.my-pips{display:flex;gap:4px}.my-pips i{width:16px;height:9px;border-radius:5px;background:#ece2d0;border:1.4px solid rgba(74,53,40,.3)}.my-pips i.on{background:#e0a52a;border-color:#a8781a}
.my-off{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:12px;background:#fff;border:1.6px solid #e0a52a}
.my-off>span:last-child{display:flex;flex-direction:column}.my-off b{font-size:13.5px}
.my-oi{width:34px;height:34px;flex:none}.my-oi svg{width:100%;height:100%}
.my-gd{padding:4px 8px;border-radius:10px;background:#fff3c4}
.my-where{margin-top:4px}
.my-maps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.my-mc{display:flex;flex-direction:column;gap:3px;padding:6px;border:2px solid var(--line,#e2d3bd);border-radius:14px;background:#fffaf0}
.my-mc b{font:800 13px var(--display,inherit)}.my-mc small{font-size:11.5px;line-height:1.25;color:var(--ink2,#7a6250)}
.my-mc.full{border-color:#e0a52a;background:#fff6d8}
.my-map{width:100%;height:auto;display:block}
.mygo{display:flex;align-items:center;gap:8px;margin:8px 0;padding:7px 9px;border:2.5px solid #9b6fd0;border-radius:16px;background:#f6ecff}
.mygo.g{border-color:#e0a52a;background:#fff8dc}.mygo.sec{border-color:#c0392b;background:#fff1ea}
.mygo-i{width:36px;height:36px;flex:none}.mygo-i svg{width:100%;height:100%}
.mygo-x{flex:1;min-width:0;display:flex;flex-direction:column}.mygo-x b{font:800 14px var(--display,inherit)}.mygo-x small{font-size:12px;line-height:1.3;color:var(--ink2,#7a6250)}
.mygo-x .ok{color:#2f7f4c}.mygo-x .no{color:#c9604f}
.mygo-t{flex:none;padding:6px 10px;border-radius:999px;border:2px solid #7a4fa0;background:#fff;color:#7a4fa0;font:800 12.5px var(--display,inherit);cursor:pointer}
.mygo-t.on{background:#7a4fa0;color:#fff}
.my-haul{display:flex;flex-direction:column;gap:6px;margin:8px 0}
.myh{display:flex;align-items:center;gap:8px;padding:8px 10px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#f6ecff}
.myh>span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}.myh b{font:800 14.5px/1.2 var(--display,inherit)}.myh small{font-size:12.5px;line-height:1.3;color:var(--ink2,#7a6250)}
.myh.big b{font-size:16px}.myh.ok{background:linear-gradient(180deg,#fff6c8,#fffaf0);border-color:#e0a52a}
.myh.ko{background:#f3eefa;border-color:#9b6fd0}.myh.g,.myh.rum{background:#fff8dc;border-color:#e0a52a}.myh.wait{background:#f6f1e8;border-color:#c9b796}
.myh.piece{background:#f3e9d2;border-color:#8a6a3e}
.myh-i{width:42px;height:42px;flex:none}.myh-i svg{width:100%;height:100%}.myh-m{width:84px;flex:none}
.myh-rw{color:#7a5a10 !important;font-weight:700}
.myspin{z-index:3}.myspin .mysb{width:38px;height:38px;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 0 rgba(74,53,40,.35));animation:myBob 1.8s ease-in-out infinite}
.myspin .mysb svg{width:100%;height:100%}.myspin.won .mysb{animation:none;opacity:.8}
@keyframes myBob{50%{transform:translate(-50%,-112%)}}
@media (prefers-reduced-motion:reduce){.myspin .mysb{animation:none}}
`;
  document.head.appendChild(st);
})();

window.__mys = {
  state: myState, RIDDLES: MY_RIDDLES, GUARDS: MY_GUARDS, MAPS: MY_MAPS, follow: myFollow, hint: myHint, check: (id, d) => myCheck(MY_R[id], d), zone: id => myZone(MY_R[id]),
  discover: myDiscover, piece: myAddPiece, choose: myChoose, bless: myBless, mapUpdate: myMapUpdate, svg: id => myMapSVG(MY_M[id]), p: myP, secretDest: id => mySecDest(MY_M[id]),
  goSecret: myGoSecret, goGuard: myGoGuard, search: mySearch, refresh: myRefresh, arrive: myOnArrive,
  api: () => ({ S, plan, startTrip, collect, tick, openSheet, closeSheet, drawMarks, choosePlace, poiDest, map, PLACES, makeItem, showModal, qtPageHTML }),
};

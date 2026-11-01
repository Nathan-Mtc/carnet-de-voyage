// ================= TRÉSORS UNIQUES (v15) : « waouh, tu l’as trouvé où ? » =================
// Soixante trésors cachés sur de VRAIS lieux : 35 lieux célèbres du monde, 25 lieux discrets de France.
// Récompenses : objets uniques au nom gravé (non échangeables), variantes de compagnons EXCLUSIVES (œuf ; palettes
// TREASURE_PALS de 01_draw_chars.js, jamais tirées par randomGenes), recettes secrètes (spécialités de la région).
// UN SEUL système d’indices : une devinette (carnet), 3 rumeurs de plus en plus précises, et UNE zone de recherche.
//  - Zone : un cercle dont le centre est décalé (toujours autour du vrai lieu, cercles emboîtés). Rayon = R0 × 0,38^points.
//    Une rumeur = 1 point ; un voyage qui traverse la zone = 0,6 à 2,2 points (plus le compagnon passe près, plus ça
//    resserre ; le journal le dit : « Pistache a senti quelque chose par ici… »). Sous 5 km, le lieu est révélé par son nom.
//  - La zone n’est dessinée sur la carte QUE pour le trésor suivi (un seul, choisi dans le carnet) : pointillé doré léger.
// Sources de rumeurs (aucune nouvelle boucle) : bouts de carte en voyage (remplacent treasureMap), certains clients de la
// boutique, « Saluer » un voyageur simulé, paliers du Compédium et du codex des régions.
// Découverte : au retour d’un voyage passé à moins du rayon de découverte (2 à 10 km), RÉVÉLATION quand le joueur ouvre
// son sac (jamais de fenêtre spontanée), annonce en haut du butin.
// Absorbe : SECRETS / S.secrets / treasureMap / chapitre « Lieux secrets » / épingles des lieux secrets (migration).
// État : S.treasures = { follow, z: { id: { p, rum, hits, seen, found, by, byName, sp } }, dry, firstRum, unseen, rumN,
//        greet, regMs, recipes, filter, mig }.
// Enveloppe : startTrip, fireEvent, collect, renderSacTab, subDot, renderNav, drawMarks, renderVoyage, renderAtelier,
// itemIcon, decorArt, value, styleGuard, bqMatch, bqOrderCard, openFiche, vySayHi, vyFeedText, nsClaimTier, rgClaim,
// nsRenderCompedium. Expose : openTresors, tzFoundN, tzRumorN, tzMapPiece, tzUnroll, window.__tresors (tests).

// ---------------- le catalogue ----------------
// [id, zone, lieu, pays/région, lat, lon, rayon km, tags, type, récompense, devinette, [3 rumeurs], histoire ({n} = compagnon)]
const TZ_RAW = [
  // ===== FRANCE : lieux discrets (25), dont 8 en Auvergne-Rhône-Alpes =====
  ['perouges', 'fr', 'Pérouges', 'Ain', 45.9041, 5.1789, 3, ['monument', 'campagne'], 'objet', { item: ['Feuille d’or du tilleul de Pérouges', 'd', 'rl_feuille', 3, null, '#e3c14a'], art: 'la' },
    'Derrière des remparts de galets roulés, un tilleul planté pour la Liberté veille sur des pavés qui n’ont pas bougé depuis des siècles.',
    ['On parle d’une cité médiévale perchée sur une butte, à moins d’une heure de Lyon.', 'Ses ruelles sont pavées de galets ronds, et on y mange une galette au sucre célèbre.', 'C’est dans l’Ain : la cité médiévale de Pérouges, sur la place du Tilleul.'],
    'Sur la place du Tilleul, un arbre planté en 1792 pour fêter la Liberté perd chaque automne des milliers de feuilles. Une seule, dit-on, tombe en or. {n} l’a attrapée au vol.'],
  ['puydome', 'fr', 'Sommet du puy de Dôme', 'Puy-de-Dôme', 45.7725, 2.9642, 4, ['montagne'], 'objet', { item: ['Écharpe des vents du puy de Dôme', 'v', 'cou', 3, 'echarpe', '#7fb6d9'], art: 'l’' },
    'Je suis le plus haut d’une famille de géants endormis. Un temple romain dort sur mon crâne, et un petit train grimpe en spirale jusqu’à moi.',
    ['Une rumeur parle d’un volcan éteint, en plein milieu de la France.', 'Il domine une chaîne de près de quatre-vingts volcans, à l’ouest de Clermont-Ferrand.', 'Le sommet du puy de Dôme : les parapentes s’y envolent tout l’été.'],
    'Au sommet, le vent souffle si fort qu’il arrache parfois les écharpes des randonneurs. Celle-ci tournoyait au-dessus du temple de Mercure depuis des années : {n} l’a enfin rattrapée.'],
  ['garabit', 'fr', 'Viaduc de Garabit', 'Cantal', 44.9747, 3.1819, 4, ['monument', 'montagne'], 'objet', { item: ['Rivet rouge de Garabit', 'd', 'rl_boulon', 3, null, '#d0503f'], art: 'le' },
    'Une dentelle de fer rouge enjambe une vallée noyée. Son père a ensuite construit une tour bien plus célèbre, à Paris.',
    ['On murmure qu’un trésor dort sous un grand pont de fer, dans le Massif central.', 'Ce viaduc ferroviaire tout rouge franchit la Truyère, dans le Cantal.', 'Le viaduc de Garabit, signé Gustave Eiffel, près de Saint-Flour.'],
    'Gustave Eiffel a fait poser des centaines de milliers de rivets sur ce viaduc. Le dernier, peint en rouge vif, n’a jamais été enfoncé : il attendait un compagnon assez curieux. C’était {n}.'],
  ['choranche', 'fr', 'Grotte de Choranche', 'Vercors (Isère)', 45.0746, 5.3984, 4, ['montagne', 'foret'], 'objet', { item: ['Couronne de cristal de Choranche', 'v', 'tete', 4, 'couronne', '#cfeaf7'], art: 'la' },
    'Sous une falaise du Vercors, des milliers de pailles de pierre pendent au-dessus d’un lac si calme qu’il double le plafond.',
    ['Les anciens chasseurs de lieux secrets parlaient d’une grotte aux cristaux, dans le Vercors.', 'Elle s’ouvre au pied des falaises de la vallée de la Bourne, près de Pont-en-Royans.', 'La grotte de Choranche et ses fistuleuses, des stalactites fines comme des pailles.'],
    'Les fistuleuses de Choranche poussent d’un millimètre par an. Celle que {n} a rapportée s’était détachée toute seule, il y a des siècles, et s’était enroulée en forme de couronne.'],
  ['merdeglace', 'fr', 'Mer de Glace', 'Chamonix (Haute-Savoie)', 45.9285, 6.9205, 5, ['montagne', 'neige'], 'variante', { sp: 'renard', pal: 'givre_merdeglace', eye: 'bleu' },
    'Un fleuve qui ne coule presque pas descend du plus haut sommet d’Europe de l’Ouest. On y entre par une grotte qu’il faut retailler chaque année.',
    ['Un renard au pelage de givre aurait été aperçu en Haute-Savoie, près d’un glacier.', 'C’est le plus long glacier de France, au-dessus de Chamonix.', 'Prenez le petit train à crémaillère du Montenvers : la Mer de Glace vous attend.'],
    'Dans la grotte de glace, un petit œuf brillait comme un glaçon. Il avait l’air d’attendre {n} depuis des années. Il est tout froid… et il bouge !'],
  ['annecy', 'fr', 'Lac d’Annecy (Talloires)', 'Haute-Savoie', 45.8411, 6.2147, 6, ['lac', 'montagne'], 'variante', { sp: 'capy', pal: 'turquoise_annecy', eye: 'bleu' },
    'On me dit le plus pur d’Europe. Entre deux massifs, mes eaux turquoise reflètent un château, et une vieille prison posée sur une île.',
    ['Une rumeur parle d’un lac de montagne d’une couleur incroyable, en Haute-Savoie.', 'L’œuf dormirait sur la rive est, du côté de Talloires.', 'Le lac d’Annecy, face au roc de Chère.'],
    'Au large de Talloires, un œuf flottait doucement parmi les nénuphars, aussi turquoise que l’eau. {n} l’a ramené jusqu’à la rive avec mille précautions.'],
  ['pontdarc', 'fr', 'Pont d’Arc', 'Ardèche', 44.3819, 4.4167, 4, ['montagne', 'lac'], 'recette', { out: ['Lampe à huile de Chauvet', 'd', 'lanterne', 3, null, '#e9a35f'], ing: [['pierre_lave', 2], ['noix_grenoble', 1]], coins: 20, story: 'La lampe des tout premiers peintres : une pierre creusée, une mèche, et de l’huile de noix.' },
    'Une rivière a percé une arche géante dans la roche. Tout près, des lions et des mammouths peints il y a trente-six mille ans dorment dans le noir.',
    ['Une recette oubliée viendrait des gorges d’une rivière, au sud de la région Auvergne-Rhône-Alpes.', 'Les canoës y passent sous une arche naturelle, près de Vallon.', 'Le Pont d’Arc, en Ardèche, à deux pas de la grotte Chauvet.'],
    'Sur un rocher près de l’arche, quelqu’un a gravé une recette très ancienne : comment fabriquer une lampe qui ne fume pas. {n} l’a recopiée dans le carnet.'],
  ['aiguilhe', 'fr', 'Rocher Saint-Michel d’Aiguilhe', 'Le Puy-en-Velay (Haute-Loire)', 45.0505, 3.8825, 3, ['monument', 'montagne'], 'recette', { out: ['Col de dentelle du Puy', 'v', 'cou', 3, 'foulard', '#fbf8f0'], ing: [['soie_lyon', 1], ['pierre_lave', 1]], coins: 25, story: 'Tissé au carreau avec un fil de soie de Lyon, les fuseaux posés sur une pierre de lave.' },
    'Une chapelle perchée sur une aiguille de lave, au bout de 268 marches. En bas, des dentellières font danser leurs fuseaux.',
    ['Une recette de dentelle se cache en Haute-Loire.', 'Cherchez un piton volcanique coiffé d’une chapelle, au Puy-en-Velay.', 'Le rocher Saint-Michel d’Aiguilhe.'],
    'Une dentellière assise au pied du rocher a confié à {n} le motif secret de son arrière-grand-mère. Il tient sur un petit papier plié en quatre.'],
  ['armen', 'fr', 'Phare d’Ar-Men', 'Chaussée de Sein (Finistère)', 48.0500, -4.9983, 8, ['mer'], 'variante', { sp: 'phoque', pal: 'ecume_armen', eye: 'def' },
    'Au bout du bout du monde, on m’a bâti sur un rocher que la mer ne découvre presque jamais. Les gardiens m’appelaient « l’enfer des enfers ».',
    ['Un phoque à la robe d’écume nagerait au large de la pointe du Finistère.', 'Au-delà de l’île de Sein, une tour se dresse en pleine mer.', 'Le phare d’Ar-Men, au bout de la chaussée de Sein.'],
    'Entre deux vagues, au pied du phare, un œuf gris perle roulait dans l’écume. Les phoques gris de l’archipel l’avaient poussé jusqu’à {n}.'],
  ['creach', 'fr', 'Phare du Créac’h', 'Ouessant (Finistère)', 48.4594, -5.1293, 5, ['mer', 'ile'], 'objet', { item: ['Lentille de Fresnel du Créac’h', 'd', 'rl_lentille', 4, null, '#f6e08a'], art: 'la' },
    'Sur l’île la plus à l’ouest, je suis l’un des phares les plus puissants du monde. Mes rayures noires et blanches guident les cargos du grand rail.',
    ['On parle d’un phare rayé, sur une île de Bretagne.', 'L’île est à l’ouest de Brest : « Qui voit Ouessant voit son sang ».', 'Le phare du Créac’h, sur la côte nord-ouest d’Ouessant.'],
    'Au musée des phares, un vieux gardien a confié à {n} un éclat de l’ancienne lentille. Le soir, il projette encore deux éclats blancs toutes les dix secondes.'],
  ['pontdugard', 'fr', 'Pont du Gard', 'Gard', 43.9475, 4.5353, 3, ['monument', 'campagne'], 'objet', { item: ['Pierre gravée du Pont du Gard', 'd', 'rl_pierre', 3, null, '#e3c38f'], art: 'la' },
    'Trois étages d’arches dorées portaient l’eau d’une source jusqu’à une ville romaine. Les tailleurs de pierre y ont laissé leurs signatures.',
    ['Un trésor dort sur un ouvrage romain, dans le Gard.', 'Cet aqueduc enjambe le Gardon, entre Uzès et Nîmes.', 'Le Pont du Gard, bien sûr. Cherchez les marques gravées sur les pierres.'],
    'Il y a deux mille ans, un tailleur de pierre a gravé son nom sur ce petit bloc, puis l’a caché sous le troisième étage. {n} l’a trouvé en suivant un lézard.'],
  ['vaucluse', 'fr', 'Fontaine-de-Vaucluse', 'Vaucluse', 43.9177, 5.1330, 3, ['lac', 'montagne'], 'variante', { sp: 'axo', pal: 'emeraude_vaucluse', eye: 'or' },
    'Au pied d’une falaise, une source si profonde que personne n’en a jamais vu le fond. Un poète y soupirait pour sa Laure.',
    ['Une eau verte et mystérieuse cache un œuf, en Provence.', 'La source jaillit au fond d’une vallée close, près de L’Isle-sur-la-Sorgue.', 'La Fontaine-de-Vaucluse, au bout du chemin de la source.'],
    'Au bord du gouffre, là où l’eau est la plus verte, un œuf émeraude dérivait. {n} jure l’avoir vu cligner des yeux.'],
  ['pilat', 'fr', 'Dune du Pilat', 'Gironde', 44.5893, -1.2131, 3, ['desert', 'mer'], 'recette', { out: ['Sablier de la grande dune', 'd', 'bocal', 3, null, '#f2cf9a'], ing: [['sable_dune', 2], ['pin_landes', 1]], coins: 15, story: 'Un sablier en bois de pin des Landes, rempli du sable le plus fin de la grande dune.' },
    'Là où la mer se fait sable et monte plus haut que les pins, le vent déplace une montagne de quelques mètres chaque année.',
    ['Une recette se cacherait dans le sable, au bord de l’Atlantique.', 'Au sud du bassin d’Arcachon, la plus haute dune d’Europe.', 'La dune du Pilat. Grimpez-la, et regardez vers le banc d’Arguin.'],
    'En haut de la dune, le vent a déterré une petite boîte en fer. Dedans : le mode d’emploi d’un sablier qui mesure exactement le temps d’une marée.'],
  ['gavarnie', 'fr', 'Cirque de Gavarnie', 'Hautes-Pyrénées', 42.6964, -0.0089, 6, ['montagne', 'neige'], 'objet', { item: ['Cape de la Grande Cascade', 'v', 'dos', 4, 'cape', '#bfe3f6'], art: 'la' },
    'Un poète m’a appelé « le colosseum de la nature ». Une cascade y tombe de plus de quatre cents mètres, face à l’Espagne.',
    ['Une cape légendaire flotterait dans les Pyrénées.', 'Au bout d’une vallée des Hautes-Pyrénées, un amphithéâtre de falaises géantes.', 'Le cirque de Gavarnie et sa Grande Cascade.'],
    'La Grande Cascade tombe de si haut que l’eau se change en brume avant de toucher le sol. Cette brume s’est posée sur les épaules de {n} et n’a plus voulu partir : c’est devenu une cape.'],
  ['gordes', 'fr', 'Gordes', 'Luberon (Vaucluse)', 43.9115, 5.2003, 3, ['monument', 'campagne'], 'recette', { out: ['Panier de savons de Gordes', 'd', 'bocal', 3, null, '#b9a6e6'], ing: [['lavande', 2], ['savon_marseille', 1]], coins: 15, story: 'Des savons à la lavande, séchés quarante jours dans une cabane de pierre sèche.' },
    'Un village de pierre sèche accroché à son rocher, face au Luberon. Plus bas, une abbaye se cache derrière des rangs violets.',
    ['Un savonnier de Provence a perdu sa recette dans un village perché.', 'Le village est dans le Vaucluse, juste au-dessus de l’abbaye de Sénanque.', 'Gordes, dans le Luberon.'],
    'Dans une borie, une petite cabane de pierre, {n} a trouvé un carnet de savonnier. La dernière page porte une recette à la lavande, signée d’une abeille.'],
  ['valensole', 'fr', 'Plateau de Valensole', 'Alpes-de-Haute-Provence', 43.8372, 5.9836, 8, ['campagne'], 'variante', { sp: 'fennec', pal: 'lavande_valensole', eye: 'violet' },
    'Un plateau où l’été peint des rangs violets jusqu’à l’horizon, et où le bourdonnement des abeilles couvre le chant des cigales.',
    ['Un petit fennec aux couleurs de lavande se cacherait en Haute-Provence.', 'Les champs de lavande les plus photographiés de France sont sur un grand plateau, près de Manosque.', 'Le plateau de Valensole, au bout d’un rang de lavande.'],
    'Au bout d’un rang de lavande, entre deux ruches, un œuf mauve sentait si bon que les abeilles lui tournaient autour. {n} l’a emporté tout doucement.'],
  ['calanques', 'fr', 'Calanque d’En-Vau', 'Bouches-du-Rhône', 43.2024, 5.4977, 3, ['mer'], 'objet', { item: ['Coquille d’argent d’En-Vau', 'd', 'rl_coquille', 3, null, '#dfe6ee'], art: 'la' },
    'Une crique d’eau turquoise enfermée entre deux falaises blanches, qu’on ne rejoint qu’à pied ou en bateau, entre une grande ville et un petit port.',
    ['Une coquille d’argent brillerait au fond d’une crique, près de Marseille.', 'La crique est dans le parc national, du côté de Cassis.', 'La calanque d’En-Vau et son aiguille de calcaire.'],
    'Au fond de la calanque, l’eau est si claire qu’on voit chaque caillou. Un seul brillait : une coquille couleur de lune, que {n} a remontée en retenant son souffle.'],
  ['verdon', 'fr', 'Gorges du Verdon', 'Alpes-de-Haute-Provence', 43.7378, 6.3639, 10, ['montagne', 'lac'], 'objet', { item: ['Foulard émeraude du Verdon', 'v', 'cou', 3, 'foulard', '#3fb8a0'], art: 'le' },
    'Le plus grand canyon d’Europe : une rivière couleur de jade s’est creusé un chemin entre des falaises de sept cents mètres.',
    ['Un foulard couleur de jade aurait été emporté par une rivière de Provence.', 'La rivière finit dans le lac de Sainte-Croix, au pied de Moustiers.', 'Les gorges du Verdon, entre le Point Sublime et le lac.'],
    'Les vautours des gorges se le disputaient depuis des semaines. L’un d’eux l’a laissé tomber juste devant {n}, comme un cadeau.'],
  ['rocamadour', 'fr', 'Rocamadour', 'Lot', 44.7997, 1.6178, 3, ['monument', 'campagne'], 'recette', { out: ['Petit rocamadour à la violette', 'n', 'fromage', 3, null, '#f6efe0'], ing: [['fromage_causses', 2], ['violette', 1]], coins: 10, story: 'Un petit fromage des Causses, affiné sur un lit de violettes de Toulouse.' },
    'Une cité de pèlerins accrochée à flanc de falaise, avec ses chapelles empilées, et une épée plantée dans la roche.',
    ['Une recette de fromage se cache dans le Lot.', 'Le village est collé à la falaise d’un canyon ; on dit qu’une épée y est fichée dans la paroi.', 'Rocamadour, en haut du grand escalier.'],
    'Une bergère des Causses a glissé sa recette secrète dans le sac de {n}, avec un clin d’œil : « Ne la donne qu’à quelqu’un qui aime vraiment le fromage. »'],
  ['etretat', 'fr', 'Falaises d’Étretat', 'Seine-Maritime', 49.7072, 0.1905, 4, ['mer', 'monument'], 'objet', { item: ['Aiguille creuse d’Étretat', 'd', 'rl_aiguille', 4, null, '#f4f1ea'], art: 'l’' },
    'Une arche de craie boit la Manche comme un éléphant, et une aiguille cacherait, dit-on, le trésor des rois de France.',
    ['Un gentleman-cambrioleur aurait caché un trésor sur la côte normande.', 'Cherchez des falaises blanches et des arches, entre Le Havre et Fécamp.', 'Étretat, au pied de l’Aiguille, près de la Porte d’Aval.'],
    'Dans le roman, l’Aiguille est creuse et cache un trésor. {n} a trouvé une minuscule aiguille de craie, creuse elle aussi… avec un message à l’intérieur : « Bravo. A. L. »'],
  ['cordouan', 'fr', 'Phare de Cordouan', 'Estuaire de la Gironde', 45.5865, -1.1737, 6, ['mer', 'monument'], 'objet', { item: ['Couronne du roi des phares', 'v', 'tete', 4, 'couronne', '#f2c14e'], art: 'la' },
    'On m’appelle le roi des phares, ou le Versailles de la mer. J’ai une chapelle et un appartement royal, au milieu d’un estuaire.',
    ['Une couronne dormirait à l’embouchure du plus grand estuaire d’Europe.', 'Le phare se dresse en mer, entre Royan et la pointe de Grave.', 'Le phare de Cordouan, à l’entrée de la Gironde.'],
    'Dans l’appartement du roi, qu’aucun roi n’a jamais habité, une couronne dorée attendait sur un coussin de velours. Elle va parfaitement à {n}.'],
  ['valsansretour', 'fr', 'Val sans Retour', 'Brocéliande (Morbihan)', 48.0008, -2.2858, 4, ['foret'], 'objet', { item: ['Lanterne aux lucioles de Morgane', 'd', 'lanterne', 4, null, '#e8f59a'], art: 'la' },
    'Une fée y enfermait les chevaliers infidèles. Au fond de la vallée, un arbre d’or et un miroir d’eau gardent la forêt des légendes.',
    ['Les anciens chasseurs de lieux secrets parlaient d’un village de lucioles, en Brocéliande.', 'La vallée se cache près de Tréhorenteuc, dans le Morbihan.', 'Le Val sans Retour, près du Miroir aux fées.'],
    'La nuit tombait sur le Miroir aux fées quand mille lucioles se sont posées sur une vieille lanterne. {n} l’a soulevée sans un bruit : elles sont restées.'],
  ['colmar', 'fr', 'Petite Venise de Colmar', 'Haut-Rhin', 48.0727, 7.3600, 3, ['ville', 'monument'], 'recette', { out: ['Kougelhopf aux mirabelles', 'n', 'sucre', 3, null, '#e9b86b'], ing: [['mirabelle', 2], ['bretzel', 1]], coins: 10, story: 'Le gâteau en couronne d’Alsace, garni de mirabelles de Lorraine.' },
    'Des maisons à colombages roses, bleues et jaunes se mirent dans un canal où glissent des barques fleuries. On dirait un conte.',
    ['Une recette de pâtissier dort au bord d’un canal, en Alsace.', 'Le quartier des maraîchers de cette ville porte le nom d’une ville d’Italie.', 'La Petite Venise de Colmar.'],
    'Un batelier de la Petite Venise a sorti de sa poche une recette tachée de beurre. « Ma grand-mère la tenait d’une cigogne », assure-t-il à {n}.'],
  ['stcirq', 'fr', 'Saint-Cirq-Lapopie', 'Lot', 44.4646, 1.6697, 3, ['monument', 'campagne'], 'objet', { item: ['Béret de peintre de Saint-Cirq', 'v', 'tete', 3, 'beret', '#3b5aa8'], art: 'le' },
    'Perché au-dessus d’une rivière, ce village a tant séduit un poète qu’il disait avoir cessé de désirer être ailleurs.',
    ['Un béret de peintre aurait été oublié dans un village perché du Lot.', 'Le village domine la rivière Lot, à l’est de Cahors.', 'Saint-Cirq-Lapopie, près de la maison du poète.'],
    'Des générations de peintres sont venues peindre le village. L’un d’eux a laissé son béret sur un muret, avec une tache de chaque couleur du coucher de soleil.'],
  ['chambord', 'fr', 'Château de Chambord', 'Loir-et-Cher', 47.6162, 1.5170, 4, ['monument', 'foret'], 'objet', { item: ['Clé de l’escalier de Chambord', 'd', 'rl_cle', 4, null, '#e3c14a'], art: 'la' },
    'Quatre cents pièces, un toit comme une ville miniature, et un escalier où deux personnes peuvent monter sans jamais se croiser.',
    ['Une clé dorée aurait été perdue dans un château de la Loire.', 'C’est le plus grand château du Val de Loire, au cœur d’une immense forêt.', 'Chambord, en haut de l’escalier à double révolution.'],
    '{n} a monté l’escalier pendant qu’un enfant le descendait : ils se sont vus sans jamais se croiser. Tout en haut, une clé dorée attendait sur la dernière marche.'],
  // ===== MONDE : lieux célèbres (35) =====
  ['paris', 'monde', 'Tour Eiffel', 'Paris, France', 48.8584, 2.2945, 3, ['ville', 'monument'], 'objet', { item: ['Boulon doré de la tour Eiffel', 'd', 'rl_boulon', 4, null, '#f2c14e'], art: 'le' },
    'Une dame de fer de trois cent trente mètres, qu’on repeint tous les sept ans et qui scintille à chaque heure de la nuit.',
    ['Le boulon le plus célèbre du monde serait caché en France.', 'Il est à Paris, au bord de la Seine, sur le Champ-de-Mars.', 'Tout en haut de la tour Eiffel.'],
    'La tour compte des millions de rivets… et un seul boulon doré, posé en secret par un ouvrier en 1889. {n} l’a repéré grâce à un reflet au coucher du soleil.'],
  ['londres', 'monde', 'Big Ben', 'Londres, Royaume-Uni', 51.5007, -0.1246, 3, ['ville', 'monument'], 'objet', { item: ['Clochette de Big Ben', 'd', 'rl_cloche', 4, null, '#c9a35a'], art: 'la' },
    'Mon nom est celui d’une cloche, pas d’une tour. Je sonne au bord d’un fleuve, juste à côté d’un parlement.',
    ['Une cloche miniature dormirait au Royaume-Uni.', 'Elle est à Londres, au bord de la Tamise.', 'Dans la tour Elizabeth, qu’on appelle Big Ben.'],
    'Les horlogers de Westminster règlent l’heure avec de vieilles pièces posées sur le balancier. Ils ont offert à {n} une clochette qui sonne exactement comme la grande.'],
  ['rome', 'monde', 'Colisée', 'Rome, Italie', 41.8902, 12.4922, 3, ['ville', 'monument'], 'objet', { item: ['Laurier d’or du Colisée', 'v', 'tete', 4, 'fleurs', '#e3c14a'], art: 'le' },
    'Cinquante mille spectateurs criaient sur mes gradins. Aujourd’hui, les chats et les touristes se partagent mes arches.',
    ['Une couronne de laurier dort en Italie.', 'Dans la Ville éternelle, au bout de la voie des Forums impériaux.', 'Le Colisée, à Rome.'],
    'Dans un recoin des souterrains, là où attendaient les gladiateurs, une couronne de laurier dorée brillait encore. Un chat romain a montré le chemin à {n}.'],
  ['barcelone', 'monde', 'Sagrada Família', 'Barcelone, Espagne', 41.4036, 2.1744, 3, ['ville', 'monument'], 'objet', { item: ['Tesselle de la Sagrada Família', 'd', 'rl_mosaique', 3, null, '#4fbfb0'], art: 'la' },
    'Commencée il y a plus d’un siècle, toujours en chantier : ses tours ressemblent à des châteaux de sable mouillé, et ses colonnes à une forêt.',
    ['Un éclat de mosaïque serait caché en Espagne.', 'À Barcelone, dans la basilique d’un architecte qui aimait les formes de la nature.', 'La Sagrada Família, l’œuvre de Gaudí.'],
    'Un ouvrier du chantier a tendu à {n} un petit carreau de céramique : « Il en manquait un sur une tour. Garde-le, on en refera un autre. »'],
  ['santorin', 'monde', 'Oia', 'Santorin, Grèce', 36.4618, 25.3753, 5, ['ile', 'mer'], 'objet', { item: ['Dôme bleu d’Oia', 'd', 'rl_dome', 3, null, '#3f7fc4'], art: 'le' },
    'Des maisons blanches coiffées de coupoles bleues dévalent une falaise volcanique, et tout le monde applaudit le coucher du soleil.',
    ['Un petit dôme bleu dormirait sur une île grecque.', 'L’île est un ancien volcan en forme de croissant, dans les Cyclades.', 'Le village d’Oia, à la pointe de Santorin.'],
    'Au moment où le soleil a touché la mer, tout le monde a applaudi. {n} a trouvé, posé sur un muret blanc, un dôme miniature du bleu exact du ciel.'],
  ['gizeh', 'monde', 'Pyramide de Khéops', 'Gizeh, Égypte', 29.9792, 31.1342, 4, ['desert', 'monument'], 'objet', { item: ['Œil d’Horus de Khéops', 'd', 'rl_oeil', 4, null, '#4f88cf'], art: 'l’' },
    'La dernière des sept merveilles encore debout. Plus de deux millions de blocs, et un sphinx qui garde l’entrée depuis quarante-cinq siècles.',
    ['Une amulette très ancienne dort en Afrique du Nord.', 'Au bord du Nil, sur un plateau près du Caire.', 'Au pied de la grande pyramide de Khéops, à Gizeh.'],
    'Le vent du désert a balayé le sable au pied de la pyramide et dévoilé une amulette bleue. Les archéologues l’ont regardée, puis ont souri à {n} : « Elle t’a choisi. »'],
  ['angkor', 'monde', 'Angkor Vat', 'Siem Reap, Cambodge', 13.4125, 103.8670, 5, ['monument', 'foret'], 'objet', { item: ['Statuette de jade d’Angkor', 'd', 'statue', 4, null, '#7fc4a0'], art: 'la' },
    'Le plus grand temple du monde se reflète dans ses douves, ses cinq tours en bouton de lotus grignotées par la jungle.',
    ['Les anciens chasseurs de lieux secrets parlaient d’un temple oublié, au Cambodge.', 'Près de la ville de Siem Reap, au nord du grand lac Tonlé Sap.', 'Angkor Vat, au lever du soleil.'],
    'Les racines d’un arbre géant serraient une statuette de jade comme un trésor. Elles se sont écartées doucement quand {n} s’est approché.'],
  ['curieuse', 'monde', 'Île Curieuse', 'Seychelles', -4.2834, 55.7294, 6, ['ile', 'mer'], 'objet', { item: ['Carapace dorée de Curieuse', 'd', 'rl_carapace', 4, null, '#e3b94a'], art: 'la' },
    'Une petite île de granit rose où des tortues géantes, plus vieilles que nos arrière-grands-parents, se promènent sous les cocotiers.',
    ['Les anciens chasseurs de lieux secrets parlaient d’une île aux tortues, dans l’océan Indien.', 'C’est aux Seychelles, tout près de l’île de Praslin.', 'L’île Curieuse et ses tortues géantes d’Aldabra.'],
    'Une tortue de plus de cent ans s’est arrêtée devant {n}, a cligné des yeux, puis a poussé du nez une petite carapace dorée. Un héritage de famille, sans doute.'],
  ['madere', 'monde', 'Jardins du Monte', 'Funchal, Madère', 32.6763, -16.9017, 6, ['ile', 'campagne'], 'objet', { item: ['Couronne de fleurs éternelles de Madère', 'v', 'tete', 4, 'fleurs', '#f6c2cf'], art: 'la' },
    'Sur une île de l’Atlantique où c’est le printemps toute l’année, un jardin dévale la montagne, et on en redescend en luge d’osier.',
    ['Les anciens chasseurs de lieux secrets parlaient d’un jardin suspendu, au milieu de l’océan.', 'L’île est portugaise, au large du Maroc.', 'Les jardins du Monte, au-dessus de Funchal, à Madère.'],
    'Les fleurs de ce jardin ne fanent jamais tout à fait. Un jardinier en a tressé une couronne pour {n}, avant de le faire redescendre en luge d’osier.'],
  ['grandcanyon', 'monde', 'Grand Canyon', 'Arizona, États-Unis', 36.0617, -112.1077, 8, ['desert', 'monument'], 'objet', { item: ['Plume de condor du Grand Canyon', 'd', 'rl_plume', 3, null, '#4a4a5a'], art: 'la' },
    'Une rivière a mis des millions d’années à creuser ces gorges rouges, si profondes qu’on y voit le temps empilé en couches.',
    ['Une plume géante aurait été perdue dans l’Ouest américain.', 'Dans l’Arizona, sur la rive sud d’un immense canyon.', 'Le Grand Canyon, au belvédère de Mather Point.'],
    'Un condor de Californie a plané longtemps au-dessus de {n}, puis a laissé tomber une plume presque aussi grande que lui. C’est un oiseau très rare : quelle chance !'],
  ['newyork', 'monde', 'Statue de la Liberté', 'New York, États-Unis', 40.6892, -74.0445, 3, ['ville', 'monument'], 'objet', { item: ['Flambeau de la Liberté', 'd', 'rl_flambeau', 4, null, '#f2c14e'], art: 'le' },
    'Une géante de cuivre devenue verte, offerte par la France, lève sa torche à l’entrée d’un port immense.',
    ['Une flamme miniature brillerait en Amérique du Nord.', 'Sur une petite île, face à Manhattan.', 'La statue de la Liberté, à New York.'],
    'Le flambeau d’origine, remplacé il y a longtemps, a perdu une étincelle. Elle a fini dans une petite torche dorée que {n} a trouvée au pied du piédestal.'],
  ['sydney', 'monde', 'Opéra de Sydney', 'Sydney, Australie', -33.8568, 151.2153, 3, ['ville', 'mer'], 'objet', { item: ['Voile de nacre de l’Opéra', 'd', 'rl_voile', 3, null, '#f4f1ea'], art: 'la' },
    'Des coques blanches comme des voiles gonflées, ou des coquillages ouverts, au bord d’une baie enjambée par un pont en forme de cintre.',
    ['Une voile de nacre serait cachée en Australie.', 'Dans la plus grande ville du pays, au bord de la baie de Port Jackson.', 'L’Opéra de Sydney.'],
    'Le toit de l’Opéra est couvert d’un million de tuiles. {n} en a trouvé une, tombée dans la baie, polie par la mer comme une nacre.'],
  ['reykjavik', 'monde', 'Hallgrímskirkja', 'Reykjavik, Islande', 64.1417, -21.9266, 4, ['ville', 'neige'], 'objet', { item: ['Pull aux aurores de Hallgrímur', 'v', 'haut', 3, 'pull', '#4f6fa8'], art: 'le' },
    'Une église en forme d’orgues de basalte domine la capitale la plus au nord du monde.',
    ['Un pull tricoté d’aurores se cache sur une île de glace et de feu.', 'Dans la capitale de l’Islande.', 'Au pied de l’église Hallgrímskirkja, à Reykjavik.'],
    'Une tricoteuse de Reykjavik tricote un pull chaque hiver avec la lumière des aurores. Cette année, elle l’a offert à {n}, qui frissonnait.'],
  ['geiranger', 'monde', 'Les Sept Sœurs', 'Geirangerfjord, Norvège', 62.1063, 7.0946, 6, ['montagne', 'mer'], 'objet', { item: ['Bonnet des Sept Sœurs', 'v', 'tete', 3, 'bonnet', '#4b6fa8'], art: 'le' },
    'Sept cascades dansent sur une falaise, face à un prétendant qui ne les épousera jamais, au fond d’un fjord en forme de S.',
    ['Un bonnet aurait été emporté par une cascade de Norvège.', 'Au fond du plus célèbre des fjords norvégiens.', 'Les Sept Sœurs, dans le fjord de Geiranger.'],
    'Les sept cascades ont chacune donné un fil d’eau gelée à {n}. Une vieille dame du fjord en a tricoté un bonnet, qui garde la fraîcheur… pour l’été.'],
  ['patagonie', 'monde', 'Glacier Perito Moreno', 'Patagonie, Argentine', -50.4967, -73.1377, 8, ['montagne', 'neige'], 'objet', { item: ['Éclat bleu du Perito Moreno', 'd', 'rl_gem', 4, null, '#8fd0f0'], art: 'l’' },
    'Un mur de glace bleue de soixante mètres avance dans un lac et se brise dans un fracas de tonnerre.',
    ['Un éclat de glace bleue dormirait au bout de l’Amérique du Sud.', 'En Argentine, en Patagonie, dans le parc des Glaciers.', 'Le glacier Perito Moreno, près d’El Calafate.'],
    'Un pan de glace s’est effondré dans le lac. Un minuscule éclat, bleu comme un saphir, a atterri dans les pattes de {n}. Il ne fond pas.'],
  ['muraille', 'monde', 'Grande Muraille (Mutianyu)', 'Pékin, Chine', 40.4319, 116.5704, 5, ['monument', 'montagne'], 'objet', { item: ['Lanterne de la Grande Muraille', 'd', 'lanterne', 3, null, '#e5584f'], art: 'la' },
    'Un dragon de pierre ondule sur des milliers de kilomètres de crêtes. Ses tours de guet allumaient des feux pour prévenir d’un danger.',
    ['Une lanterne rouge serait cachée en Asie, sur un rempart.', 'Au nord de Pékin, sur une portion restaurée au milieu des forêts.', 'La Grande Muraille, à Mutianyu.'],
    'Dans une tour de guet, une lanterne rouge brillait encore, comme si quelqu’un veillait. Le gardien l’a confiée à {n} : « Allume-la quand tu as besoin de courage. »'],
  ['venise', 'monde', 'Pont du Rialto', 'Venise, Italie', 45.4380, 12.3359, 3, ['ville', 'mer'], 'recette', { out: ['Sorbet du Rialto', 'n', 'glace', 3, null, '#f6e07a'], ing: [['citron_amalfi', 2], ['gelato', 1]], coins: 10, story: 'Un sorbet au citron d’Amalfi, servi sur une boule de gelato.' },
    'Une ville sans voitures, posée sur l’eau. Son plus vieux pont de pierre porte des boutiques sur son dos.',
    ['Une recette de glacier se cache en Italie.', 'Dans une ville de canaux, au bord d’une lagune.', 'Sur le pont du Rialto, à Venise.'],
    'Un gondolier qui chantait faux a récité à {n} la recette de sa grand-mère, glacière sur le Grand Canal. En échange, il a voulu une photo.'],
  ['lisbonne', 'monde', 'Tour de Belém', 'Lisbonne, Portugal', 38.6916, -9.2160, 3, ['ville', 'mer'], 'recette', { out: ['Pastel de Belém à l’orange', 'n', 'sucre', 3, null, '#e9b86b'], ing: [['orange_valence', 2], ['churros', 1]], coins: 10, story: 'Une pâte croustillante, une crème à l’orange, et une pincée de cannelle.' },
    'Une tour de dentelle de pierre garde l’entrée d’un fleuve d’où partaient les grands navigateurs vers les Indes.',
    ['Une recette de pâtisserie dort au Portugal.', 'Dans la capitale, au bord du Tage, d’où partaient les caravelles.', 'Près de la tour de Belém, à Lisbonne.'],
    'Les moines de Belém gardaient leur recette dans un coffre. Un pâtissier en a laissé échapper une version à l’orange devant {n}… exprès, sans doute.'],
  ['istanbul', 'monde', 'Grand Bazar', 'Istanbul, Turquie', 41.0107, 28.9681, 3, ['ville', 'monument'], 'recette', { out: ['Plateau de mezzé du Bosphore', 'n', 'plat', 3, null, '#d9733f'], ing: [['olive_kalamata', 1], ['feta', 1], ['loukoum', 1]], coins: 15, story: 'Des olives, de la feta et des loukoums : le plateau des grands jours.' },
    'Le plus vieux marché couvert du monde : soixante rues, des milliers de boutiques, dans une ville posée sur deux continents.',
    ['Une recette de fête se cache entre l’Europe et l’Asie.', 'Dans une ville coupée en deux par le Bosphore.', 'Le Grand Bazar d’Istanbul.'],
    'Un marchand de loukoums a offert le thé à {n}, puis, en confidence, la façon de préparer le plateau des grands jours.'],
  ['marrakech', 'monde', 'Place Jemaa el-Fna', 'Marrakech, Maroc', 31.6258, -7.9891, 3, ['ville', 'desert'], 'recette', { out: ['Thé à la menthe de Jemaa el-Fna', 'n', 'boisson', 3, null, '#7fae4f'], ing: [['menthe_souk', 2], ['datte_souk', 1]], coins: 10, story: 'Versé de très haut pour faire mousser, avec une datte pour chaque invité.' },
    'Le soir, une grande place se remplit de conteurs, de musiciens et de fumées de grillades, au pied du minaret de la ville rouge.',
    ['Une recette de thé se cache en Afrique du Nord.', 'Dans la ville rouge, au pied de l’Atlas.', 'Sur la place Jemaa el-Fna, à Marrakech.'],
    'Un conteur de la place a raconté à {n} l’histoire du tout premier thé à la menthe… et la recette était cachée dans l’histoire.'],
  ['tokyo', 'monde', 'Temple Sensō-ji', 'Asakusa, Tokyo', 35.7148, 139.7967, 4, ['ville', 'monument'], 'recette', { out: ['Sakura mochi d’Asakusa', 'n', 'sucre', 3, null, '#f6b3cb'], ing: [['mochi_doux', 1], ['matcha', 1], ['cerisier', 1]], coins: 15, story: 'Un mochi rose au thé matcha, enveloppé dans une fleur de cerisier.' },
    'Une immense lanterne rouge pend sous la Porte du Tonnerre du plus vieux temple de la plus grande ville du monde.',
    ['Une recette de douceur se cache au Japon.', 'Dans la capitale, dans un vieux quartier au bord de la Sumida.', 'Le temple Sensō-ji, à Asakusa (Tokyo).'],
    'Sous la grande lanterne, un vendeur de gâteaux a tiré pour {n} un papier de bonne fortune. Au dos : une recette, et le mot « daikichi », la grande chance.'],
  ['montreal', 'monde', 'Mont Royal', 'Montréal, Canada', 45.5040, -73.5878, 4, ['ville', 'foret'], 'recette', { out: ['Tire d’érable du mont Royal', 'n', 'sucre', 3, null, '#d9a35f'], ing: [['sirop_erable', 2], ['bleuets', 1]], coins: 10, story: 'Du sirop d’érable bouillant versé sur la neige, roulé sur un bâton, avec des bleuets.' },
    'Une montagne qui a donné son nom à la ville, une croix illuminée, et l’hiver, du sirop qu’on verse sur la neige.',
    ['Une recette sucrée dort au Canada.', 'Au Québec, sur la colline au milieu d’une grande ville francophone.', 'Au belvédère du mont Royal, à Montréal.'],
    'Une cabane à sucre cachée dans les érables a offert à {n} la tire sur la neige… et la recette, griffonnée sur une écorce de bouleau.'],
  ['edimbourg', 'monde', 'Château d’Édimbourg', 'Édimbourg, Écosse', 55.9486, -3.1999, 3, ['ville', 'monument'], 'recette', { out: ['Panier-goûter écossais', 'v', 'dos', 3, 'sac', '#b5484d'], ing: [['scone', 1], ['the_cinq_heures', 1], ['tartan', 1]], coins: 20, story: 'Un panier doublé de tartan, avec des scones encore tièdes et une théière.' },
    'Un château posé sur un ancien volcan domine une vieille ville où l’on tire un coup de canon chaque jour à une heure.',
    ['Une recette de goûter se cache au Royaume-Uni, sur un rocher.', 'Dans la capitale de l’Écosse.', 'Le château d’Édimbourg, au bout du Royal Mile.'],
    'À une heure pile, le canon a tonné. Le temps que {n} se remette de sa surprise, un joueur de cornemuse lui avait glissé la recette d’un goûter parfait.'],
  ['machupicchu', 'monde', 'Machu Picchu', 'Pérou', -13.1631, -72.5450, 5, ['montagne', 'monument'], 'recette', { out: ['Chullo de Machu Picchu', 'v', 'tete', 3, 'bonnet', '#d9733f'], ing: [['alpaga', 2], ['quinoa', 1]], coins: 20, story: 'Le bonnet à oreilles des Andes, tricoté en laine d’alpaga.' },
    'Une cité inca suspendue entre deux pics, dans les nuages, que le monde a redécouverte il y a un peu plus d’un siècle.',
    ['Un modèle de tricot se cache dans la cordillère des Andes.', 'Au Pérou, au-dessus de la vallée de l’Urubamba.', 'La citadelle du Machu Picchu.'],
    'Un lama très digne a mâchonné le sac de {n}, puis a laissé tomber un modèle de tricot. Les tricoteuses du village ont ri : « C’est le sien ! »'],
  ['rio', 'monde', 'Christ Rédempteur', 'Rio de Janeiro, Brésil', -22.9519, -43.2105, 4, ['ville', 'mer'], 'recette', { out: ['Café glacé à la passion de Rio', 'n', 'boisson', 3, null, '#f2a93b'], ing: [['fruit_passion', 2], ['cafe_colombie', 1]], coins: 10, story: 'Un café frappé, une pulpe de fruit de la passion, et beaucoup de glaçons.' },
    'Les bras grands ouverts au sommet d’une montagne, il veille sur une baie, un pain de sucre et des plages qui dansent.',
    ['Une recette rafraîchissante se cache en Amérique du Sud.', 'Au Brésil, au-dessus d’une grande ville de bord de mer.', 'Le Christ Rédempteur du Corcovado, à Rio de Janeiro.'],
    'Au sommet, un vendeur ambulant a préparé pour {n} une boisson incroyable. Il a écrit la recette sur une serviette en papier, en échange d’un sourire.'],
  ['rovaniemi', 'monde', 'Cercle polaire', 'Rovaniemi, Finlande', 66.5436, 25.8473, 6, ['neige', 'foret'], 'variante', { sp: 'renard', pal: 'aurore_laponie', eye: 'vairon' },
    'Sur la ligne invisible du cercle polaire, un village où un vieux monsieur à barbe blanche reçoit des lettres du monde entier.',
    ['Un renard aux couleurs d’aurore boréale vivrait en Laponie.', 'En Finlande, juste sur le cercle arctique.', 'Le village du père Noël, à Rovaniemi.'],
    'Sous une aurore boréale, un œuf vert et rose brillait dans la neige, exactement sur la ligne du cercle polaire. {n} a dû poser une patte de chaque côté pour le prendre.'],
  ['svalbard', 'monde', 'Longyearbyen', 'Svalbard, Norvège', 78.2232, 15.6267, 10, ['neige', 'mer'], 'variante', { sp: 'phoque', pal: 'banquise_svalbard', eye: 'bleu' },
    'La ville la plus au nord du monde : on n’y sort pas sans guide à cause des ours, et l’été, le soleil ne s’y couche jamais.',
    ['Les anciens chasseurs de lieux secrets parlaient d’une cabane au bout du monde, dans l’Arctique.', 'Sur un archipel norvégien, à mi-chemin entre la Norvège et le pôle Nord.', 'Longyearbyen, au Svalbard.'],
    'Près de la cabane du bout du monde, un œuf blanc comme la banquise attendait, bien au chaud entre deux phoques endormis. Ils ont laissé {n} le prendre.'],
  ['merzouga', 'monde', 'Erg Chebbi', 'Merzouga, Maroc', 31.0997, -4.0119, 8, ['desert'], 'variante', { sp: 'fennec', pal: 'rose_merzouga', eye: 'or' },
    'Des dunes orange hautes comme des immeubles, au bord du Sahara, où l’on part à dos de dromadaire pour voir le soleil se lever.',
    ['Un fennec couleur de dune se cache au Sahara.', 'Au Maroc, au pied du grand erg Chebbi.', 'Le village de Merzouga.'],
    'Au lever du soleil, une rose des sables s’est ouverte comme une fleur : à l’intérieur, un petit œuf orangé. Les caravaniers n’avaient jamais vu ça.'],
  ['kyoto', 'monde', 'Fushimi Inari', 'Kyoto, Japon', 34.9671, 135.7727, 4, ['monument', 'foret'], 'variante', { sp: 'tanuki', pal: 'sakura_kyoto', eye: 'rose' },
    'Des milliers de portiques vermillon forment un tunnel qui grimpe dans la montagne, gardés par des renards de pierre.',
    ['Un tanuki rose comme un cerisier serait né au Japon.', 'Dans l’ancienne capitale impériale, au sud-est de la ville.', 'Le sanctuaire Fushimi Inari, à Kyoto.'],
    'Au millième portique, un tanuki de céramique tenait un œuf rose. {n} l’a salué poliment, et le tanuki lui a fait un clin d’œil.'],
  ['morondava', 'monde', 'Allée des Baobabs', 'Morondava, Madagascar', -20.2508, 44.4183, 6, ['foret', 'campagne'], 'variante', { sp: 'lemur', pal: 'baobab_morondava', eye: 'or' },
    'Des arbres géants plantés la tête en bas bordent une piste de terre rouge, et le coucher du soleil les change en silhouettes.',
    ['Un lémurien couleur de coucher de soleil vivrait dans l’océan Indien.', 'Sur la côte ouest de Madagascar.', 'L’allée des Baobabs, près de Morondava.'],
    'Au creux d’un baobab de plusieurs siècles, un œuf orangé gardait la chaleur de la journée. Une famille de lémuriens a regardé {n} l’emporter en applaudissant.'],
  ['rottnest', 'monde', 'Rottnest Island', 'Perth, Australie', -32.0064, 115.5133, 8, ['ile', 'mer'], 'variante', { sp: 'quokka', pal: 'soleil_rottnest', eye: 'def' },
    'Une île où vit l’animal le plus souriant du monde, et où les vélos remplacent les voitures, au large d’une grande ville de l’Ouest australien.',
    ['Un quokka doré se cacherait au large de l’Australie.', 'L’île est en face de Perth, dans l’océan Indien.', 'Rottnest Island, l’île des quokkas.'],
    'Un quokka a pris la pose pour un selfie avec {n}, puis a poussé du bout du nez un œuf doré caché sous un buisson. Il souriait encore plus que d’habitude.'],
  ['xochimilco', 'monde', 'Canaux de Xochimilco', 'Mexico, Mexique', 19.2575, -99.0997, 5, ['lac', 'ville'], 'variante', { sp: 'axo', pal: 'trajinera_xochimilco', eye: 'def' },
    'Des barques peintes de toutes les couleurs glissent sur les canaux de jardins flottants : c’est le dernier refuge sauvage d’un animal qui sourit sous l’eau.',
    ['Un axolotl aux couleurs de fête vivrait au Mexique.', 'Au sud de la capitale, dans les canaux des anciens Aztèques.', 'Xochimilco, à bord d’une trajinera.'],
    'Une barque nommée « Lupita » a pris {n} à son bord. Au milieu d’un canal, un œuf rose et turquoise flottait parmi les fleurs. Les mariachis ont joué une fanfare.'],
  ['iguazu', 'monde', 'Chutes d’Iguazú', 'Argentine et Brésil', -25.6953, -54.4367, 6, ['foret', 'lac'], 'variante', { sp: 'capy', pal: 'arcenciel_iguazu', eye: 'vert' },
    'Des centaines de cascades en fer à cheval, entre deux pays, et un gouffre que l’on appelle la Gorge du Diable.',
    ['Un capybara couleur d’arc-en-ciel vivrait près d’immenses chutes d’Amérique du Sud.', 'Entre l’Argentine et le Brésil.', 'Les chutes d’Iguazú, au bord de la Gorge du Diable.'],
    'Dans la brume des chutes, un arc-en-ciel s’est posé sur un œuf. Quand la brume s’est levée, les couleurs sont restées. {n} est rentré trempé, mais ravi.'],
  ['monteverde', 'monde', 'Forêt de nuages de Monteverde', 'Costa Rica', 10.3010, -84.7950, 8, ['foret', 'montagne'], 'variante', { sp: 'paresseux', pal: 'nuage_monteverde', eye: 'vert' },
    'Une forêt où les nuages passent entre les arbres, couverte de mousses et d’orchidées, que l’on traverse sur des ponts suspendus.',
    ['Un paresseux couleur de nuage se cache en Amérique centrale.', 'Au Costa Rica, dans la cordillère de Tilarán.', 'La forêt de nuages de Monteverde.'],
    'Sur un pont suspendu, au milieu des nuages, un paresseux a mis dix minutes à tendre un œuf à {n}. {n} a attendu patiemment : ça valait le coup.'],
  ['taktsang', 'monde', 'Nid du Tigre (Taktsang)', 'Paro, Bhoutan', 27.4916, 89.3632, 6, ['montagne', 'monument'], 'variante', { sp: 'panda', pal: 'drapeaux_taktsang', eye: 'def' },
    'Un monastère accroché à une falaise, très haut au-dessus de la vallée, là où un sage serait arrivé sur le dos d’une tigresse volante.',
    ['Un panda roux aux mille couleurs vivrait dans l’Himalaya.', 'Au Bhoutan, au-dessus de la vallée de Paro.', 'Le monastère du Nid du Tigre (Taktsang).'],
    'Les drapeaux de prière claquaient au vent. L’un d’eux s’est enroulé autour d’un petit œuf, qui en a gardé toutes les couleurs. Les moines ont béni le voyage de {n}.'],
];
const TZ = TZ_RAW.map(([id, z, place, country, lat, lon, rad, tags, type, rw, riddle, rum, story]) => ({ id, z, place, country, lat, lon, rad, tags, type, rw, riddle, rum, story }));
const TZ_BY = Object.fromEntries(TZ.map(T => [T.id, T]));
// anciens lieux secrets → trésors (et l’objet de l’ancien butin qui DEVIENT l’objet unique)
const TZ_SECRET_MAP = { grotte: 'choranche', lucioles: 'valsansretour', tortues: 'curieuse', temple: 'angkor', jardin: 'madere', banquise: 'svalbard' };
const TZ_LEGACY_ITEM = { grotte: 'Couronne de cristal', lucioles: 'Lanterne de lucioles', tortues: 'Carapace dorée', temple: 'Statuette de jade', jardin: 'Couronne de fleurs éternelles' };
const TZ_CLIENTS = ['eucalypso', 'hulotte', 'leonie', 'ondine', 'pingo', 'clochette', 'filou'];
const TZ_REG_MS = [3, 6, 10, 15, 22, 30];
const TZ_K = 0.38, TZ_REVEAL = 5, TZ_GO = 100;

// ---------------- outils ----------------
const tzH = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const tzTuto = () => { try { return typeof tuOn === 'function' && tuOn(); } catch (e) { return false; } };
const tzName = k => (CHARS[k] && CHARS[k].name) || 'Votre compagnon';
const tzIl = k => (typeof compE === 'function' && compE(k) ? 'elle' : 'il');
const tzStory = (T, k) => T.story.replace(/\{n\}/g, tzName(k));
const tzPct = T => { const h = tzH(T.id + '|pct'); return T.z === 'fr' ? 0.4 + h * 3.1 : 1.6 + h * 11.5; };
const tzPctTxt = T => tzPct(T).toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const tzDate = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const TZ_R = 6371, tzRad = Math.PI / 180;
function tzBearing(a, b) { const f1 = a.lat * tzRad, f2 = b.lat * tzRad, dl = (b.lon - a.lon) * tzRad; return Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)); }
const tzAng = (a, b) => d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]);
// distance (km) d’un point au trajet (arc de grand cercle a → b) et position le long du trajet (0 = départ, 1 = arrivée)
function tzSeg(a, b, p) {
  const d13 = tzAng(a, p), d12 = tzAng(a, b);
  if (d12 < 1e-9) return { d: d13 * TZ_R, k: 1 };
  const t = tzBearing(a, p) - tzBearing(a, b);
  const dxt = Math.asin(Math.max(-1, Math.min(1, Math.sin(d13) * Math.sin(t))));
  let dat = Math.acos(Math.max(-1, Math.min(1, Math.cos(d13) / Math.max(1e-12, Math.cos(dxt)))));
  if (Math.cos(t) < 0) dat = -dat;
  if (dat <= 0) return { d: d13 * TZ_R, k: 0 };
  if (dat >= d12) return { d: tzAng(b, p) * TZ_R, k: 1 };
  return { d: Math.abs(dxt) * TZ_R, k: dat / d12 };
}
// point à `km` d’un point, dans une direction (radians)
function tzDest(p, brg, km) {
  const d = km / TZ_R, f1 = p.lat * tzRad, l1 = p.lon * tzRad;
  const f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(brg));
  const l2 = l1 + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2));
  return { lon: ((l2 / tzRad + 540) % 360) - 180, lat: f2 / tzRad };
}

// ---------------- état ----------------
function tzState() {
  if (!S.treasures || typeof S.treasures !== 'object' || Array.isArray(S.treasures)) S.treasures = {};
  const st = S.treasures;
  if (typeof st.follow !== 'string') st.follow = '';
  if (!st.z || typeof st.z !== 'object') st.z = {};
  for (const k of ['dry', 'unseen', 'rumN', 'regMs', 'mig']) if (typeof st[k] !== 'number') st[k] = 0;
  if (typeof st.firstRum !== 'string') st.firstRum = '';
  if (!st.greet || typeof st.greet !== 'object') st.greet = { day: 0, n: 0 };
  if (!Array.isArray(st.recipes)) st.recipes = [];
  if (!['all', 'fr', 'monde'].includes(st.filter)) st.filter = 'all';
  return st;
}
const tzZ = id => { const st = tzState(); return st.z[id] || (st.z[id] = { p: 0, rum: 0, hits: 0 }); };
const tzFound = id => !!(tzState().z[id] && tzState().z[id].found);
const tzActive = id => { const z = tzState().z[id]; return !!(z && (z.rum || z.hits || z.seen)) || tzState().follow === id; };
function tzFoundN() { try { return TZ.filter(T => tzFound(T.id)).length; } catch (e) { return 0; } }
function tzRumorN() { try { return tzState().rumN; } catch (e) { return 0; } }
// zone de recherche : rayon brut (km), révélé (sous 5 km), centre (décalé, cercles emboîtés autour du vrai lieu)
const tzR0 = T => 300 + 300 * tzH(T.id + '|r');
const tzRaw = T => Math.max(0.5, tzR0(T) * Math.pow(TZ_K, tzZ(T.id).p));
const tzRevealed = T => tzFound(T.id) || tzRaw(T) <= TZ_REVEAL;
const tzDispR = T => tzRevealed(T) ? Math.max(2, T.rad) : tzRaw(T);
function tzCenter(T) {
  if (tzRevealed(T)) return { lon: T.lon, lat: T.lat };
  return tzDest(T, tzH(T.id + '|a') * Math.PI * 2, (0.3 + 0.45 * tzH(T.id + '|f')) * tzRaw(T));
}
const tzProg = T => tzRevealed(T) ? 1 : Math.max(0, Math.min(1, Math.log(tzR0(T) / tzRaw(T)) / Math.log(tzR0(T) / TZ_REVEAL)));
function tzZoneTxt(T) {
  if (tzFound(T.id)) return `Trouvé : ${T.place}`;
  if (tzRevealed(T)) return `Lieu révélé : ${T.place}`;
  const r = tzRaw(T), km = r >= 20 ? Math.round(r / 10) * 10 : Math.round(r);
  const q = r > 250 ? 'toute une région' : r > 80 ? (T.z === 'fr' ? 'quelques départements' : 'une grande région') : r > 25 ? 'une vallée, une côte, une ville…' : 'tout près !';
  return `≈ ${km.toLocaleString('fr-FR')} km autour du centre · ${q}`;
}
const tzZoneShort = T => tzFound(T.id) ? 'Trouvé' : tzRevealed(T) ? 'Lieu révélé' : `Zone ≈ ${tzKm(tzRaw(T))}`;
const tzCanGo = T => !tzFound(T.id) && (tzRevealed(T) || tzRaw(T) <= TZ_GO);
const TZ_KIND = { objet: 'un objet unique au nom gravé', variante: 'une variante de compagnon exclusive', recette: 'une recette secrète' };
const tzHomeKm = T => kmBetween(homeObj(), T);

// ---------------- récompenses ----------------
const tzPal = T => (SPECIES[T.rw.sp] && SPECIES[T.rw.sp].palettes.find(p => p.id === T.rw.pal)) || null;
function tzGenes(T) { const p = tzPal(T); if (!p) return null; return { pal: p.id, base: p.base, accent: p.accent, belly: p.belly, pattern: p.pat || 'uni', patCol: p.pc || p.accent, eye: T.rw.eye || 'def', special: 'none' }; }
function tzRewardName(T) { if (T.type === 'objet') return T.rw.item[0]; if (T.type === 'recette') return T.rw.out[0]; const p = tzPal(T); return p ? p.name : T.place; }
function tzRewardPhrase(T) {
  if (T.type === 'objet') { const a = T.rw.art || 'le', n = T.rw.item[0]; return (a === 'l’' ? 'l’' : a + ' ') + n.charAt(0).toLowerCase() + n.slice(1); }
  if (T.type === 'recette') return `la recette secrète « ${T.rw.out[0]} »`;
  return `l’œuf exclusif « ${tzRewardName(T)} »`;
}
const tzItemOf = T => ({ name: T.rw.item[0], cat: T.rw.item[1], sub: T.rw.item[2], rarity: T.rw.item[3], look: T.rw.item[4], color: T.rw.item[5], tresor: T.id });
const tzRecipeId = T => 'tz_' + T.id;
function tzRewardArt(T, big) {
  if (T.type === 'objet') return itemIcon(tzItemOf(T));
  if (T.type === 'recette') { const o = T.rw.out; return `<span class="tzscroll${big ? ' big' : ''}">${TZ_SCROLL}<span class="tzsci">${itemIcon({ name: o[0], cat: o[1], sub: o[2], rarity: o[3], look: o[4], color: o[5] })}</span></span>`; }
  const g = tzGenes(T);
  if (big || typeof nsPortrait !== 'function') return typeof drawEgg === 'function' ? drawEgg(T.rw.sp, g, 0, 'tze' + T.id + (big ? 'b' : '')) : '';
  try { return `<img alt="" src="${nsPortrait(T.rw.sp, g, null, 'content')}">`; } catch (e) { return drawEgg(T.rw.sp, g, 0, 'tze' + T.id); }
}
// petites icônes d’objets uniques (« reliques » : posées sur une étagère de la maison, sous une cloche de verre)
const TZ_L = '#5b4636';
const TZ_GLY = {
  boulon: c => `<path d="M13 6 H27 L31 11 L27 16 H13 L9 11Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M15 9 H25" stroke="#fff" stroke-width="1.4" opacity=".7"/><rect x="16.5" y="16" width="7" height="16" rx="1.5" fill="${c}" stroke="${TZ_L}" stroke-width="1.5"/><path d="M16.5 20 l7 -2 M16.5 24 l7 -2 M16.5 28 l7 -2" stroke="${TZ_L}" stroke-width="1.1"/>`,
  cle: c => `<circle cx="13" cy="12" r="7" fill="none" stroke="${TZ_L}" stroke-width="5"/><circle cx="13" cy="12" r="7" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M18 17 L31 30 M25 24 L29 20 M28.5 27.5 L31.5 24.5" stroke="${TZ_L}" stroke-width="4.4" stroke-linecap="round"/><path d="M18 17 L31 30 M25 24 L29 20 M28.5 27.5 L31.5 24.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  cloche: c => `<path d="M20 4 v3" stroke="${TZ_L}" stroke-width="2" stroke-linecap="round"/><path d="M11 26 C11 14 13 8 20 8 C27 8 29 14 29 26 L32 29 H8Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="20" cy="31" r="2.6" fill="${c}" stroke="${TZ_L}" stroke-width="1.4"/><path d="M15 12 C14 16 14 20 14.5 24" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6"/>`,
  coquille: c => `<path d="M20 30 C9 30 5 20 8 13 C12 7 28 7 32 13 C35 20 31 30 20 30Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6"/><path d="M20 30 V9 M20 30 L12 10 M20 30 L28 10 M20 30 L8 16 M20 30 L32 16" stroke="${TZ_L}" stroke-width="1" opacity=".7"/><path d="M16 30 h8 l-2 3 h-4Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.2"/>`,
  feuille: c => `<path d="M20 31 C9 25 6 15 10 9 C13 5 18 7 20 11 C22 7 27 5 30 9 C34 15 31 25 20 31Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 31 V12 M20 18 L14 13 M20 23 L26 17" stroke="${TZ_L}" stroke-width="1.1" fill="none"/><path d="M20 31 L20 34" stroke="${TZ_L}" stroke-width="1.6"/>`,
  lentille: c => `<path d="M8 31 V17 a12 12 0 0 1 24 0 V31Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6"/><path d="M11 31 V18 a9 9 0 0 1 18 0 V31 M14.5 31 V19 a5.5 5.5 0 0 1 11 0 V31" fill="none" stroke="${TZ_L}" stroke-width="1.1"/><circle cx="20" cy="22" r="2.6" fill="#fff"/><path d="M20 6 V2 M10 9 L7 6 M30 9 L33 6" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  pierre: c => `<path d="M7 31 L9 12 L20 8 L31 12 L33 31Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12 L20 15 L31 12 M20 15 V31" stroke="${TZ_L}" stroke-width="1" opacity=".55"/><path d="M12 21 l3 5 l3 -5 M23 19 h5 M25.5 19 v7" stroke="#7a4e2c" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  aiguille: c => `<path d="M14 33 L18 5 L22 7 L26 33Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 12 L21 13 M18.5 18 L22.5 19 M17.5 24 L23.5 25" stroke="${TZ_L}" stroke-width="1" opacity=".5"/><ellipse cx="20" cy="18" rx="1.4" ry="3" fill="#5b4636" opacity=".7"/><path d="M5 33 q4 -3 8 0 M27 33 q4 -3 8 0" stroke="#4f97c4" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  mosaique: c => `<rect x="8" y="8" width="24" height="24" rx="3" fill="#fff8ea" stroke="${TZ_L}" stroke-width="1.6"/>${[[10, 10, c], [18.5, 10, '#f2c14e'], [27, 10, '#e5684f'], [10, 18.5, '#e5684f'], [18.5, 18.5, c], [27, 18.5, '#7fae4f'], [10, 27, '#f2c14e'], [18.5, 27, '#7fae4f'], [27, 27, c]].map(([x, y, f]) => `<rect x="${x - 0.5}" y="${y - 0.5}" width="4" height="4" rx=".8" fill="${f}" stroke="${TZ_L}" stroke-width=".6" transform="translate(${x === 10 ? 0 : x === 18.5 ? -0.5 : -1} ${y === 10 ? 0 : y === 18.5 ? -0.5 : -1})"/>`).join('')}`,
  dome: c => `<rect x="10" y="20" width="20" height="13" fill="#fbf8f0" stroke="${TZ_L}" stroke-width="1.5"/><path d="M10 20 C10 11 30 11 30 20Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.5"/><path d="M20 12 V7 M18 8.5 h4" stroke="${TZ_L}" stroke-width="1.4" stroke-linecap="round"/><rect x="17.5" y="25" width="5" height="8" rx="2.5" fill="${c}" stroke="${TZ_L}" stroke-width="1.1"/><path d="M14 15 q2 -2 5 -2.6" stroke="#fff" stroke-width="1.3" fill="none" opacity=".7"/>`,
  oeil: c => `<path d="M5 18 C10 10 30 10 35 18 C30 25 10 25 5 18Z" fill="#fff8ea" stroke="${TZ_L}" stroke-width="1.6"/><circle cx="20" cy="18" r="5" fill="${c}" stroke="${TZ_L}" stroke-width="1.4"/><circle cx="20" cy="18" r="2" fill="${TZ_L}"/><path d="M5 18 C10 10 30 10 35 18" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M14 23 L12 31 M20 24 C22 29 26 31 30 28" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  carapace: c => `<path d="M6 25 C6 13 34 13 34 25Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6"/><path d="M15 16 L13 25 M25 16 L27 25 M15 16 h10 M10 20 h4 M26 20 h4 M17 21 h6" stroke="${TZ_L}" stroke-width="1.1" opacity=".75" fill="none"/><path d="M4 25 H36" stroke="${TZ_L}" stroke-width="2" stroke-linecap="round"/><path d="M11 25 v4 M29 25 v4" stroke="${TZ_L}" stroke-width="2.4" stroke-linecap="round"/>`,
  flambeau: c => `<path d="M17 33 L15 17 H25 L23 33Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.5" stroke-linejoin="round"/><rect x="13" y="14" width="14" height="4" rx="1.5" fill="${c}" stroke="${TZ_L}" stroke-width="1.4"/><path d="M20 3 C26 8 25 13 20 14 C15 13 14 8 20 3Z" fill="#f6a03a" stroke="${TZ_L}" stroke-width="1.3"/><path d="M20 7 C22.5 9.5 22 12 20 12.5 C18 12 17.5 9.5 20 7Z" fill="#fff3b0"/>`,
  voile: c => `<path d="M6 30 C8 18 14 10 20 8 C16 16 15 24 16 30Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M15 30 C17 19 23 12 30 11 C25 18 24 25 25 30Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M24 30 C26 23 30 19 35 18 C32 23 32 27 33 30Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 31 H36" stroke="#4f97c4" stroke-width="2" stroke-linecap="round"/>`,
  gem: c => `<path d="M20 33 L6 15 L12 8 H28 L34 15Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 15 H34 M12 8 L16 15 L20 33 L24 15 L28 8 M16 15 L20 8 L24 15" stroke="${TZ_L}" stroke-width="1" fill="none" opacity=".7"/><path d="M13 12 l3 -2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  plume: c => `<path d="M9 33 C11 20 20 8 33 5 C31 16 24 27 9 33Z" fill="${c}" stroke="${TZ_L}" stroke-width="1.6"/><path d="M9 33 L29 10" stroke="#fff" stroke-width="1.2" opacity=".7"/><path d="M14 26 l-3 -3 M18 21 l-4 -3 M22 17 l-3 -4 M25 21 l3 1 M21 25 l3 2" stroke="${TZ_L}" stroke-width=".9" opacity=".6"/>`,
};
const tzStar = (x, y, r) => typeof starPath === 'function' ? starPath(x, y, r) : '';
function tzRelicSVG(g, c) {
  const f = TZ_GLY[g] || TZ_GLY.gem;
  return `<svg viewBox="0 0 40 40"><circle cx="20" cy="19" r="16" fill="#fff3c4" opacity=".55"/><ellipse cx="20" cy="35.6" rx="12.5" ry="2.8" fill="#e9c46a" stroke="${TZ_L}" stroke-width="1.1"/>${f(c || '#e9c46a')}<path d="${tzStar(33.5, 6.5, 3.4)}" fill="#fff6c2" stroke="${TZ_L}" stroke-width=".8"/></svg>`;
}
function tzRelicDecor(g, c) {
  const f = TZ_GLY[g] || TZ_GLY.gem;
  return `<rect x="18" y="84" width="64" height="12" rx="3" fill="#a87a50" stroke="${TZ_L}" stroke-width="2"/><rect x="24" y="78" width="52" height="8" rx="2" fill="#c99a6a" stroke="${TZ_L}" stroke-width="2"/><g transform="translate(26 22) scale(1.2)">${f(c || '#e9c46a')}</g><path d="M26 78 V40 a24 24 0 0 1 48 0 V78" fill="#e8f4f8" fill-opacity=".28" stroke="${TZ_L}" stroke-width="2"/><path d="M33 44 a18 18 0 0 1 10 -14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="${tzStar(80, 22, 6)}" fill="#fff6c2" stroke="${TZ_L}" stroke-width="1.2"/>`;
}
const TZ_SCROLL = `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M14 10 H80 a8 8 0 0 1 0 16 H86 V64 a8 8 0 0 1 -8 8 H20 a8 8 0 0 1 0 -16 H14Z" fill="#f6e9cc" stroke="${TZ_L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 10 a8 8 0 0 0 0 16 h6 M86 56 a8 8 0 0 0 -8 8" fill="none" stroke="${TZ_L}" stroke-width="2.2"/><path d="M28 32 H72 M28 40 H64 M28 48 H70" stroke="#c9a97a" stroke-width="2.4" stroke-linecap="round"/><circle cx="72" cy="58" r="7" fill="#d9604f" stroke="${TZ_L}" stroke-width="1.8"/><path d="M69 58 h6 M72 55 v6" stroke="#fff" stroke-width="1.6"/></svg>`;
// silhouettes « ? ? ? » (le type de récompense se devine, pas le reste)
const TZ_SIL = {
  objet: '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="#efe2c4"/><path d="M30 8 L36 22 L51 23 L39.5 32.5 L43 47 L30 39 L17 47 L20.5 32.5 L9 23 L24 22Z" fill="#b9a68a"/><text x="30" y="37" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="20" fill="#fff8ea">?</text></svg>',
  variante: '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="#efe2c4"/><path d="M30 9 C42 9 49 28 49 37 C49 47 41 53 30 53 C19 53 11 47 11 37 C11 28 18 9 30 9Z" fill="#b9a68a"/><text x="30" y="41" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="22" fill="#fff8ea">?</text></svg>',
  recette: '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="#efe2c4"/><path d="M14 14 H44 a5 5 0 0 1 0 10 H47 V43 a5 5 0 0 1 -5 5 H17 a5 5 0 0 1 0 -10 H14Z" fill="#b9a68a"/><text x="31" y="40" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="20" fill="#fff8ea">?</text></svg>',
};
const TZ_CHEST = '<path d="M5 13 H25 V25 H5Z" fill="#c98a4f" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M5 13 C5 5 25 5 25 13Z" fill="#e3a65f" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M5 13 H25" stroke="currentColor" stroke-width="2"/><rect x="12.5" y="11" width="5" height="6" rx="1.2" fill="#f6c445" stroke="currentColor" stroke-width="1.5"/><path d="M9 8 V25 M21 8 V25" stroke="#f6c445" stroke-width="1.8"/>';

// ---------------- rumeurs ----------------
// cible d’une nouvelle rumeur : le trésor suivi s’il lui en manque, sinon un trésor déjà en piste, de préférence proche
function tzPickTarget(near, opt = {}) {
  const st = tzState(), c = TZ.filter(T => !tzFound(T.id) && tzZ(T.id).rum < 3);
  if (!c.length) return null;
  if (!opt.notFollow && st.follow && c.some(T => T.id === st.follow)) return st.follow;
  const at = near && isFinite(near.lon) && isFinite(near.lat) ? near : homeObj();
  if (opt.nearest) return c.slice().sort((a, b) => kmBetween(at, a) - kmBetween(at, b))[0].id;
  const w = c.map(T => (tzActive(T.id) ? 3 : 1) / (1 + kmBetween(at, T) / 700));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i].id; }
  return c[0].id;
}
// une rumeur de plus : +1 point de zone ; la première rumeur fait suivre ce trésor si aucun ne l’est
function tzGiveRumor(id, src, near) {
  const st = tzState();
  let T = id && TZ_BY[id];
  if (!T || tzFound(T.id) || tzZ(T.id).rum >= 3) { const t2 = tzPickTarget(near); T = t2 && TZ_BY[t2]; }
  if (!T) return null;
  const z = tzZ(T.id), wasRev = tzRevealed(T);
  z.rum++; z.p += 1; st.rumN++; st.unseen++;
  st.last = { id: T.id, i: z.rum - 1, src: src || '', at: Date.now() };
  if (!st.follow || tzFound(st.follow)) st.follow = T.id;
  save();
  try { renderNav(); drawMarks(); } catch (e) {}
  return { T, i: z.rum - 1, text: T.rum[z.rum - 1], reveal: !wasRev && tzRevealed(T) };
}
// bout de carte (objet du sac) : sa rumeur vise un trésor proche du lieu du voyage
function tzMapPiece(place, near) {
  let n = near && isFinite(near.lon) ? near : null;
  if (!n && typeof place === 'string') { const p = PLACES.find(x => x.name === place); if (p) n = p; }
  let tid = '';
  try { tid = tzPickTarget(n) || ''; } catch (e) {}
  return { id: uidGen(), name: 'Bout de carte', cat: 't', sub: tid, rarity: 2, from: (typeof place === 'string' ? place : place && place.name) || 'En voyage', tags: [], date: Date.now(), color: '#efe2c4' };
}
function tzUnroll(itemId) {
  const it = S.inv.find(i => i.id === itemId); if (!it) return;
  S.inv.splice(S.inv.indexOf(it), 1);
  const sub = TZ_SECRET_MAP[it.sub] || it.sub;
  const r = tzGiveRumor(sub, 'carte');
  if (!r) { gainCoins(40); save(); renderAll(); toast('Tous les trésors sont trouvés : le bout de carte se revend 40 pièces.'); return; }
  save(); renderAll();
  setTimeout(() => { openTresors(); tzOpenFiche(r.T.id, { newRum: r.i }); }, 0);
}
function tzRumorToast(who, r) { if (!r) return; toast(`${who} : « ${r.text} » (nouvelle rumeur dans Sac › Trésors)`); }

// ---------------- en voyage : le compagnon « sent » quelque chose ----------------
function tzPlanSense(t) {
  if (!t || !t.from || !t.dest || tzTuto()) return;
  const st = tzState(), plans = [];
  for (const T of TZ) {
    if (tzFound(T.id)) continue;
    const s = tzSeg(t.from, t.dest, T);
    if (s.d <= T.rad) { plans.push({ id: T.id, k: s.k, lvl: 3 }); continue; }
    const r = tzRaw(T), sc = tzSeg(t.from, t.dest, tzCenter(T)), fol = st.follow === T.id;
    if ((fol && sc.d < r) || (tzActive(T.id) && sc.d < 0.5 * r)) plans.push({ id: T.id, k: sc.k, lvl: 2, q: 1 - sc.d / r });
    else if (s.d < Math.max(25, 3 * T.rad)) plans.push({ id: T.id, k: s.k, lvl: 1 });
  }
  plans.sort((a, b) => b.lvl - a.lvl || (b.q || 0) - (a.q || 0));
  const { fa } = tripPhases(t);
  for (const p of plans.slice(0, 2)) {
    const at = p.k >= 0.999 ? Math.min(0.97, fa + 0.004) : Math.max(0.03, Math.min(0.95, p.k * fa));
    t.events.push({ at, type: 'tzsense', tz: p.id, lvl: p.lvl });
  }
  if (plans.length) t.events.sort((a, b) => a.at - b.at);
}
function tzFireSense(t, e) {
  const k = t.comp, n = tzName(k), il = tzIl(k), place = eventPlace(t, e), T = TZ_BY[e.tz]; if (!T) return;
  const fol = tzState().follow === T.id;
  const text = e.lvl === 3 ? `${n} s’arrête net, gratte le sol et remue la queue : ${il} a trouvé quelque chose ! Surprise au retour…`
    : e.lvl === 2 ? `${n} a senti quelque chose par ici… La zone du trésor${fol ? ' suivi' : ''} va se resserrer à son retour.`
    : `${n} lève le museau : ${il} a senti quelque chose par ici… Un trésor dort peut-être dans les environs.`;
  t.journal.push({ t: Date.now(), place: place.name, tags: place.tags || ['campagne'], kind: 'tzsense', text, tz: T.id, lvl: e.lvl });
  S.unseen[k] = (S.unseen[k] || 0) + 1;
}

// ---------------- au retour : découverte, zone qui se resserre, bouts de carte ----------------
function tzBeforeCollect(t, k) {
  const st = tzState(), res = { k, found: [], zone: [], notes: [] };
  const from = t.from, dest = t.dest; if (!from || !dest) return res;
  for (const T of TZ) {
    if (tzFound(T.id)) continue;
    const s = tzSeg(from, dest, T);
    if (s.d <= T.rad) { res.found.push(T); continue; }
    const r = tzRaw(T), sc = tzSeg(from, dest, tzCenter(T)), fol = st.follow === T.id, act = tzActive(T.id), near = s.d < Math.max(25, 3 * T.rad);
    if (!((fol && sc.d < r) || (act && sc.d < 0.5 * r) || near)) continue;
    const q = Math.max(0, Math.min(1, 1 - sc.d / r));
    let pts = 0.6 + 1.6 * q * q; if (near && !act) pts = Math.max(pts, 1);
    res.zone.push({ T, pts, r0: r, wasRev: tzRevealed(T), fol });
  }
  res.zone.sort((a, b) => b.fol - a.fol || b.pts - a.pts);
  res.zone = res.zone.slice(0, 3);
  for (const zz of res.zone) { const z = tzZ(zz.T.id); z.p += zz.pts; z.hits++; z.seen = 1; zz.r1 = tzRaw(zz.T); zz.rev = !zz.wasRev && tzRevealed(zz.T); }
  // trouvés : la récompense part dans le sac (objet) ; l’œuf et la recette arrivent juste après le rangement
  for (const T of res.found) {
    const z = tzZ(T.id);
    z.found = Date.now(); z.by = k; z.byName = tzName(k); z.trip = dest.name || '';
    if (st.follow === T.id) st.follow = '';
    if (T.type === 'objet') {
      const it = makeItem(T.rw.item, 0, T.place, T.tags, { fixed: T.rw.item[3] });
      it.tresor = T.id; it.edition = 'Trésor unique'; it.desc = tzStory(T, k);
      try { if (typeof regionAt === 'function') it.origin = { region: regionAt(T.lon, T.lat).id, place: T.place, km: kmBetween(homeObj(), T) }; } catch (e) {}
      t.bag.push(it); res.item = res.item || {}; res.item[T.id] = it;
    }
    if (T.type === 'recette' && !st.recipes.includes(T.id)) st.recipes.push(T.id);
  }
  if (res.found.length && !st.follow) { const nx = TZ.find(T => !tzFound(T.id) && tzZ(T.id).rum > 0); if (nx) st.follow = nx.id; }
  // bouts de carte : la toute première rumeur arrive vers le 3e voyage (un trésor proche de chez soi), puis régulièrement
  const hasMap = t.bag.some(i => i.cat === 't');
  if (!st.firstRum && (S.stats.trips || 0) >= 2) {
    const id = tzPickTarget(homeObj(), { nearest: true, notFollow: true });
    if (id) { const m = tzMapPiece(dest.name, homeObj()); m.sub = id; t.bag.push(m); st.firstRum = id; st.dry = 0; res.notes.push('Un bout de carte ! Dépliez-le pour lire votre première rumeur de trésor.'); }
  } else if (hasMap) st.dry = 0;
  else if ((S.stats.trips || 0) >= 2) {
    st.dry++;
    if (st.dry >= 4 || (st.dry >= 2 && Math.random() < 0.3)) { t.bag.push(tzMapPiece(dest.name, dest)); st.dry = 0; }
  }
  return res;
}
function tzAfterCollect(res) {
  const st = tzState();
  res.eggs = {};
  for (const T of res.found) {
    if (T.type !== 'variante') continue;
    const genes = tzGenes(T), o = { sp: T.rw.sp, genes, rarity: 4, from: { how: 'tresor', place: T.place, tz: T.id }, ms: 120e3, known: true };
    let egg = null;
    try { egg = typeof nsAddEgg === 'function' ? nsAddEgg(o) : null; } catch (e) { console.error(e); }
    if (!egg) { const id = addEgg({ sp: o.sp, genes, rarity: 4, from: o.from, hatchMs: o.ms }); egg = S.eggs.find(x => x.id === id); if (egg) egg.known = true; }
    if (egg) { egg.tz = T.id; res.eggs[T.id] = egg; }
    tzZ(T.id).sp = T.rw.sp;
  }
  // codex des régions : un palier de régions découvertes = une rumeur
  try {
    if (typeof REGIONS !== 'undefined' && typeof rgDiscovered === 'function') {
      const n = REGIONS.filter(R => rgDiscovered(R.id)).length, idx = TZ_REG_MS.filter(x => n >= x).length;
      if (idx > st.regMs) { st.regMs = idx; const r = tzGiveRumor(null, 'codex', res.dest); if (r) res.notes.push(`Codex : ${n} régions découvertes, une rumeur offerte ! « ${r.text} »`); }
    }
  } catch (e) { console.error(e); }
  save();
  try { renderNav(); drawMarks(); } catch (e) {}
  tzHaulDecorate(res);
}
// dans la fenêtre du butin que le joueur vient d’ouvrir : annonce en haut, notes de zone, puis la révélation
function tzHaulDecorate(res) {
  const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox');
  const zl = res.zone.map(zz => zz.rev ? `<b>Lieu révélé :</b> ${esc(zz.T.place)} ! Le trésor « ${esc(tzShortRiddle(zz.T))} » vous attend là-bas.` : `La zone du trésor${zz.fol ? ' suivi' : ''} s’est resserrée : <b>${tzKm(zz.r0)} → ${tzKm(zz.r1)}</b>.`);
  const notes = zl.concat(res.notes.map(esc));
  if (!box) { if (res.found.length) toast(`Trésor unique trouvé : ${tzRewardName(res.found[0])} ! (Sac › Trésors)`); else if (zl.length) toast(zl[0].replace(/<[^>]+>/g, '')); return; }
  if (res.found.length) box.insertAdjacentHTML('afterbegin', `<button class="tzban" data-tzrevagain="1"><span class="tzbi"><svg viewBox="0 0 30 30" aria-hidden="true">${TZ_CHEST}</svg></span><span><small>Trésor unique trouvé !</small><b>${res.found.map(T => esc(tzRewardName(T))).join(' · ')}</b></span><em>Revoir</em></button>`);
  if (notes.length) {
    const btn = [...box.querySelectorAll('button[data-closemodal]')].pop();
    const html = `<ul class="tznotes">${notes.map(x => `<li><svg viewBox="0 0 30 30" aria-hidden="true">${TZ_CHEST}</svg><span>${x}</span></li>`).join('')}</ul>`;
    if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
  }
  if (res.found.length) { tzLastReveal = res; tzShowReveal(res, 0); }
}
const tzKm = r => `${(r >= 20 ? Math.round(r / 10) * 10 : Math.max(1, Math.round(r))).toLocaleString('fr-FR')} km`;
const tzShortRiddle = T => { const s = T.riddle.split(/[.:]/)[0]; return s.length > 70 ? s.slice(0, 66).trim() + '…' : s; };

// ---------------- la RÉVÉLATION (dans la fenêtre du butin, ouverte par le joueur) ----------------
let tzLastReveal = null;
function tzRevealHTML(T, res, i) {
  const k = res.k, n = tzName(k), egg = res.eggs && res.eggs[T.id], more = i < res.found.length - 1;
  const kind = T.type === 'objet' ? `${RARITY[T.rw.item[3]]} · objet unique · non échangeable` : T.type === 'variante' ? `Œuf exclusif · ${esc(typeof spName === 'function' ? spName(T.rw.sp) : T.rw.sp)} « ${esc(tzRewardName(T))} »` : 'Recette secrète · débloquée à l’atelier (Merveilles)';
  const art = T.type === 'variante' ? (typeof drawEgg === 'function' ? drawEgg(T.rw.sp, egg ? egg.genes : tzGenes(T), 0, 'tzrv' + T.id) : '') : tzRewardArt(T, true);
  const sp = [0, 1, 2, 3, 4, 5, 6, 7].map(j => `<i style="--a:${j * 45}deg;--d:${(1.25 + j * 0.05).toFixed(2)}s"></i>`).join('');
  return `<div class="tzrbox" role="dialog" aria-label="Trésor unique trouvé : ${esc(tzRewardName(T))}">
    <span class="tzkick">Trésor unique · ${esc(T.place)}</span>
    <div class="tzstage"><div class="tzrays"></div><div class="tzsparks">${sp}</div>
      <div class="tzchest"><svg viewBox="0 0 120 90" aria-hidden="true"><g class="tzlid"><path d="M10 44 C10 14 110 14 110 44Z" fill="#e3a65f" stroke="${TZ_L}" stroke-width="3" stroke-linejoin="round"/><path d="M34 22 V44 M86 22 V44" stroke="#f6c445" stroke-width="6"/><path d="M10 44 H110" stroke="${TZ_L}" stroke-width="3"/></g><path d="M10 44 H110 V84 H10Z" fill="#c98a4f" stroke="${TZ_L}" stroke-width="3" stroke-linejoin="round"/><path d="M34 44 V84 M86 44 V84" stroke="#f6c445" stroke-width="6"/><rect x="51" y="40" width="18" height="20" rx="3" fill="#f6c445" stroke="${TZ_L}" stroke-width="2.4"/><circle cx="60" cy="50" r="3" fill="${TZ_L}"/><path d="M14 80 H106" stroke="#a8703a" stroke-width="3" opacity=".6"/></svg></div>
      <div class="tzglow"></div><div class="tzart t-${T.type}">${art}</div></div>
    <div class="tzplate"><span>${esc(tzRewardName(T))}</span></div>
    <span class="tzkind">${kind}</span>
    <p class="tzstory">${esc(tzStory(T, k))}</p>
    <div class="tzrare"><b>Seulement ${tzPctTxt(T)} %</b> des voyageurs l’ont trouvé.</div>
    <div class="tzby"><img src="${portraitURI(k, 'rire')}" alt=""><span>Trouvé par <b>${esc(n)}</b> · ${esc(tzDate(tzZ(T.id).found || Date.now()))}</span></div>
    ${T.type === 'variante' ? `<p class="tzhint">L’œuf est à la nurserie (Village) : il éclora dans deux minutes.</p>` : T.type === 'recette' ? `<p class="tzhint">À fabriquer à l’atelier avec des spécialités de la région.</p>` : `<p class="tzhint">Rangé dans votre sac. ${T.rw.item[1] === 'v' ? 'Il se porte !' : 'Exposez-le dans la maison.'}</p>`}
    <button class="btn gold big wide" data-tzrevok="${i}">${more ? 'Trésor suivant !' : 'Voir tout le butin'}</button>
  </div>`;
}
function tzShowReveal(res, i) {
  const m = $('modal'); if (!m || m.hidden) return;
  let ov = m.querySelector('.tzrev');
  if (!ov) { ov = document.createElement('div'); ov.className = 'tzrev'; m.appendChild(ov); }
  ov.classList.toggle('rm', typeof reduceMotion === 'function' && reduceMotion());
  ov.innerHTML = tzRevealHTML(res.found[i], res, i);
  ov.hidden = false; ov.dataset.i = i;
  if (typeof confetti === 'function' && !ov.classList.contains('rm')) setTimeout(() => { try { confetti(true); } catch (e) {} }, 1350);
  const b = ov.querySelector('[data-tzrevok]'); if (b) setTimeout(() => { try { b.focus({ preventScroll: true }); } catch (e) {} }, 2700);
}
function tzCloseReveal() { const m = $('modal'), ov = m && m.querySelector('.tzrev'); if (ov) ov.remove(); }
// la révélation vit dans la fenêtre du butin : elle disparaît avec elle (fermeture, ou autre contenu affiché)
if (typeof showModal === 'function') showModal = (orig => function () { tzCloseReveal(); return orig.apply(this, arguments); })(showModal);
(function tzWatchModal() { const m = $('modal'); if (!m || typeof MutationObserver === 'undefined') return; new MutationObserver(() => { if (m.hidden) tzCloseReveal(); }).observe(m, { attributes: true, attributeFilter: ['hidden'] }); })();

// ---------------- le CARNET DES TRÉSORS (Sac › Trésors) ----------------
const tzDots = T => { const n = tzZ(T.id).rum; return `<span class="tzdots" aria-label="${n} rumeur${n > 1 ? 's' : ''} sur 3">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; };
function tzCard(T) {
  const st = tzState(), z = tzZ(T.id), fol = st.follow === T.id;
  if (z.found) {
    return `<button class="tzc got" data-tzopen="${T.id}"><span class="tzsil got t-${T.type}">${tzRewardArt(T)}</span><span class="tzct"><b>${esc(tzRewardName(T))}</b><i>${esc(T.place)} · ${esc(new Date(z.found).toLocaleDateString('fr-FR'))}</i><span class="tzwho">${CHARS[z.by] ? `<img src="${portraitURI(z.by)}" alt="">` : ''}${esc(z.byName || '')}</span></span></button>`;
  }
  const rev = tzRevealed(T);
  return `<button class="tzc${fol ? ' on' : ''}${tzActive(T.id) ? ' act' : ''}" data-tzopen="${T.id}"><span class="tzsil">${TZ_SIL[T.type]}</span><span class="tzct"><b>${rev ? esc(T.place) : '? ? ?'}</b><i>« ${esc(T.riddle)} »</i><span class="tzmeta">${tzDots(T)}<em>${tzActive(T.id) ? esc(tzZoneShort(T)) : (T.z === 'fr' ? 'France' : 'Monde')}</em></span></span>${fol ? '<span class="tzflag">Suivi</span>' : ''}</button>`;
}
function tzZoneBlock(T) {
  return `<div class="tzzone"><div class="tzzh"><span>Zone de recherche</span><b>${esc(tzZoneTxt(T))}</b></div><span class="tzzbar"><i style="width:${(tzProg(T) * 100).toFixed(0)}%"></i></span><small>${tzRevealed(T) ? `Partez à ${esc(T.place)} : il suffit de passer à moins de ${T.rad} km.` : tzCanGo(T) ? 'La zone est assez petite : partez l’explorer ! Chaque passage la resserre.' : 'Chaque rumeur la resserre, et chaque voyage qui la traverse aussi (plus votre compagnon passe près du centre, mieux c’est).'}</small></div>`;
}
function tzRumList(T, hi) {
  const n = tzZ(T.id).rum;
  return `<ol class="tzrums">${T.rum.map((r, i) => i < n ? `<li class="${hi === i ? 'new' : ''}"><b>Rumeur ${i + 1}</b>${esc(r)}</li>` : `<li class="no"><b>Rumeur ${i + 1}</b>Encore inconnue : clients, voyageurs salués, bouts de carte…</li>`).join('')}</ol>`;
}
function tzActs(T) {
  const st = tzState(), fol = st.follow === T.id;
  return `<div class="tzacts">${fol ? `<button class="btn cream sm" data-tzmap="${T.id}">Voir la zone</button>` : `<button class="btn gold sm" data-tzfollow="${T.id}">Suivre</button>`}${tzCanGo(T) ? `<button class="btn green sm" data-tzgo="${T.id}">${tzRevealed(T) ? 'Partir !' : 'Explorer la zone'}</button>` : ''}${fol ? `<button class="tzghost" data-tzunfollow="1">Ne plus suivre</button>` : ''}</div>`;
}
function tzHero(T) {
  return `<section class="tzhero"><div class="tzhh"><span class="tzsil big">${TZ_SIL[T.type]}</span><div><span class="tzk">Trésor suivi · ${esc(TZ_KIND[T.type])}</span><h3>${tzRevealed(T) ? esc(T.place) : '? ? ?'}</h3><p class="tzriddle">« ${esc(T.riddle)} »</p></div></div>${tzRumList(T)}${tzZoneBlock(T)}${tzActs(T)}</section>`;
}
function renderTresors(box) {
  const st = tzState(), f = st.filter, list = TZ.filter(T => f === 'all' || T.z === f);
  const nF = TZ.filter(T => tzFound(T.id)).length, frF = TZ.filter(T => T.z === 'fr' && tzFound(T.id)).length, frN = TZ.filter(T => T.z === 'fr').length, mF = nF - frF, mN = TZ.length - frN;
  st.unseen = 0;
  let h = phead(null, 'Carnet des trésors', 'Soixante trésors uniques cachés sur de vrais lieux. Lisez la devinette, réunissez les rumeurs, suivez un trésor : sa zone dorée apparaît sur la carte et se resserre jusqu’au lieu exact.');
  h += `<div class="tzsum"><div class="tzbig"><b>${nF}<small>/${TZ.length}</small></b><span>trouvés</span></div><div class="tzbars"><span>France <b>${frF}/${frN}</b> · Monde <b>${mF}/${mN}</b></span><span class="tzbar"><i style="width:${(nF / TZ.length * 100).toFixed(1)}%"></i></span><span>${st.rumN} rumeur${st.rumN > 1 ? 's' : ''} récoltée${st.rumN > 1 ? 's' : ''}</span></div></div>`;
  h += `<div class="filters tzf">${[['all', 'Tous', TZ.length], ['fr', 'France', frN], ['monde', 'Monde', mN]].map(([v, l, n]) => `<button data-tzf="${v}" aria-pressed="${f === v}">${l} <small>${n}</small></button>`).join('')}</div>`;
  const fol = st.follow && TZ_BY[st.follow] && !tzFound(st.follow) ? TZ_BY[st.follow] : null;
  if (fol && list.includes(fol)) h += tzHero(fol);
  else if (!fol && !st.rumN) h += `<p class="tzempty">Pas encore de rumeur. Continuez à voyager : un bout de carte finira par tomber d’une vieille bouteille… Les clients de la boutique et les voyageurs que vous saluez en connaissent aussi.</p>`;
  const run = list.filter(T => !tzFound(T.id) && tzActive(T.id) && T !== fol).sort((a, b) => tzZ(b.id).rum - tzZ(a.id).rum || tzProg(b) - tzProg(a));
  const todo = list.filter(T => !tzFound(T.id) && !tzActive(T.id));
  const got = list.filter(T => tzFound(T.id)).sort((a, b) => tzZ(b.id).found - tzZ(a.id).found);
  if (run.length) h += `<h3 class="tzh">En piste <small>${run.length}</small></h3><div class="tzgrid">${run.map(tzCard).join('')}</div>`;
  if (got.length) h += `<h3 class="tzh">Trouvés <small>${got.length}</small></h3><div class="tzgrid">${got.map(tzCard).join('')}</div>`;
  if (todo.length) h += `<h3 class="tzh">À découvrir <small>${todo.length}</small></h3><div class="tzgrid">${todo.map(tzCard).join('')}</div>`;
  h += `<p class="small tzfoot">Les rumeurs viennent des bouts de carte rapportés de voyage, de certains clients de la boutique, des voyageurs que vous saluez, et des paliers du Compédium et du codex des régions. Les malins devinent le lieu dès la devinette !</p>`;
  box.innerHTML = h;
  save(); try { renderNav(); } catch (e) {}
}
function tzOpenFiche(id, opt = {}) {
  const T = TZ_BY[id]; if (!T) return;
  const z = tzZ(T.id);
  let h;
  if (z.found) {
    h = `<div class="tzfiche got"><span class="tzkick">Trésor unique · ${esc(T.z === 'fr' ? 'France' : 'Monde')}</span><div class="tzfart t-${T.type}">${tzRewardArt(T, T.type !== 'variante')}</div><div class="tzplate sm"><span>${esc(tzRewardName(T))}</span></div><span class="tzkind">${esc(T.place)} · ${esc(T.country)}</span><p class="tzstory">${esc(tzStory(T, z.by))}</p><div class="tzrare"><b>Seulement ${tzPctTxt(T)} %</b> des voyageurs l’ont trouvé.</div><div class="tzby">${CHARS[z.by] ? `<img src="${portraitURI(z.by, 'rire')}" alt="">` : ''}<span>Trouvé par <b>${esc(z.byName || '')}</b> · ${esc(tzDate(z.found))}</span></div><p class="tzriddle sm">« ${esc(T.riddle)} »</p>${T.type === 'recette' ? '<button class="btn green" data-tzatelier="1">Voir à l’atelier</button>' : ''}<button class="btn cream" data-tzclose="1">Fermer</button></div>`;
  } else {
    h = `<div class="tzfiche"><span class="tzkick">Trésor à trouver · ${esc(T.z === 'fr' ? 'France' : 'Monde')}</span><span class="tzsil big">${TZ_SIL[T.type]}</span><h2>${tzRevealed(T) ? esc(T.place) : '? ? ?'}</h2><span class="tzkind">Récompense : ${esc(TZ_KIND[T.type])}</span><p class="tzriddle">« ${esc(T.riddle)} »</p>${tzRumList(T, opt.newRum)}${tzActive(T.id) || tzZ(T.id).rum ? tzZoneBlock(T) : ''}${tzActs(T)}<button class="btn cream" data-tzclose="1">Fermer</button></div>`;
  }
  showModal(h);
}
function openTresors(id) {
  sacView = 'tresors'; openSheet('sac', true); try { $('panelBody').scrollTop = 0; } catch (e) {}
  if (id) tzOpenFiche(id);
}
// partir : vers le lieu révélé, ou au centre de la zone pour l’explorer (un compagnon libre de l’équipe si besoin)
function tzGo(id) {
  const T = TZ_BY[id]; if (!T || !tzCanGo(T)) return;
  $('modal').hidden = true;
  if (S.trips[S.sel]) { const free = (typeof teamIds === 'function' ? teamIds() : []).find(k => !S.trips[k]); if (free) selectComp(free); }
  let d;
  if (tzRevealed(T)) d = { id: null, name: T.place, country: T.country, lat: T.lat, lon: T.lon, tags: T.tags.slice(), special: null, tz: T.id };
  else { const c = tzCenter(T); d = { id: null, name: 'Zone du trésor suivi', country: '', lat: c.lat, lon: c.lon, tags: T.tags.slice(), special: null, tz: T.id, tzx: 1 }; }
  if (S.trips[S.sel]) { toast(`Toute l’équipe est en voyage. Le trésor attendra le retour de ${tzName(S.sel)} !`); return; }
  if (typeof closeSheet === 'function') closeSheet();
  choosePlace(d);
  try { zoomTo(d.lon, d.lat, Math.max(zoomT.k, tzRevealed(T) ? 40 : 12)); } catch (e) {}
}
function tzMapView(id) {
  const T = TZ_BY[id]; if (!T) return;
  const st = tzState(); if (st.follow !== id) { st.follow = id; save(); }
  $('modal').hidden = true;
  if (typeof closeSheet === 'function') closeSheet();
  drawMarks();
  try {
    const c = tzCenter(T), ring = d3.geoCircle().center([c.lon, c.lat]).radius(tzDispR(T) / 111.195).precision(6)().coordinates[0];
    const lons = ring.map(p => p[0]), lats = ring.map(p => p[1]);
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: { top: 120, bottom: 150, left: 40, right: 70 }, maxZoom: 13, duration: 900 });
  } catch (e) { console.error(e); }
}

// ---------------- la zone sur la carte (trésor suivi seulement) ----------------
let tzZoneSig = '';
function tzMapEnsure() {
  if (typeof map === 'undefined' || !map || typeof mapReady === 'undefined' || !mapReady) return false;
  if (map.getSource('tz-zone')) return true;
  try {
    map.addSource('tz-zone', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    const before = map.getLayer('route-shadow') ? 'route-shadow' : undefined;
    map.addLayer({ id: 'tz-fill', type: 'fill', source: 'tz-zone', paint: { 'fill-color': '#f6c445', 'fill-opacity': 0.07 } }, before);
    map.addLayer({ id: 'tz-halo', type: 'line', source: 'tz-zone', layout: { 'line-join': 'round' }, paint: { 'line-color': '#fff8ea', 'line-width': 5, 'line-opacity': 0.6 } }, before);
    map.addLayer({ id: 'tz-line', type: 'line', source: 'tz-zone', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#d9a21e', 'line-width': 2.4, 'line-dasharray': [1.4, 2.2] } }, before);
    tzZoneSig = '';
  } catch (e) { console.error(e); return false; }
  return true;
}
function tzMapUpdate() {
  const st = tzState(), T = st.follow && TZ_BY[st.follow] && !tzFound(st.follow) ? TZ_BY[st.follow] : null;
  // le petit coffre au centre de la zone (marqueur HTML : il réserve sa place, aucune icône de lieu dessous)
  let o = typeof ovEls !== 'undefined' ? ovEls.tz : null;
  if (!o && T && $('ov')) {
    const el = document.createElement('div'); el.className = 'ovm tzm'; el.dataset.tzpin = '1';
    el.innerHTML = `<div class="tzpin"><svg viewBox="0 0 30 30" aria-hidden="true">${TZ_CHEST}</svg></div><span class="pinl tzl"></span>`;
    $('ov').appendChild(el); o = ovEls.tz = { el, lon: 0, lat: 0 };
  }
  if (o) {
    o.el.hidden = !T;
    if (T) { const c = tzCenter(T); o.lon = c.lon; o.lat = c.lat; const l = o.el.querySelector('.tzl'), txt = tzRevealed(T) ? T.place : 'Trésor suivi'; if (l.textContent !== txt) l.textContent = txt; o.el.classList.toggle('rev', tzRevealed(T)); o.el.setAttribute('aria-label', txt); }
  }
  if (!tzMapEnsure()) return;
  const c = T ? tzCenter(T) : null, r = T ? tzDispR(T) : 0;
  const sig = T ? `${T.id}:${c.lon.toFixed(4)}:${c.lat.toFixed(4)}:${r.toFixed(2)}` : '';
  if (sig === tzZoneSig) return;
  tzZoneSig = sig;
  const feats = T ? [{ type: 'Feature', properties: {}, geometry: d3.geoCircle().center([c.lon, c.lat]).radius(r / 111.195).precision(r > 100 ? 2 : 1)() }] : [];
  try { map.getSource('tz-zone').setData({ type: 'FeatureCollection', features: feats }); } catch (e) {}
}

// ---------------- recettes secrètes (atelier › Merveilles) ----------------
const TZ_RECIPES = [];
function tzRegisterRecipes() {
  if (typeof RG_RES === 'undefined') return;
  for (const T of TZ) {
    if (T.type !== 'recette' || RECIPES.some(r => r.id === tzRecipeId(T))) continue;
    const ok = T.rw.ing.every(([rid]) => RG_RES[rid]); if (!ok) { console.warn('trésor : spécialité inconnue', T.id); continue; }
    const r = { id: tzRecipeId(T), kind: 'Voyage', multi: true, secret: T.id, out: T.rw.out, coins: T.rw.coins, story: T.rw.story,
      regions: [...new Set(T.rw.ing.map(([rid]) => RG_RES[rid].region))], ing: T.rw.ing.map(([rid, n]) => { if (!ING['r:' + rid]) ING['r:' + rid] = [[], RG_RES[rid].name]; return ['r:' + rid, n]; }) };
    RECIPES.push(r); TZ_RECIPES.push(r);
  }
}
const tzRecipeOpen = r => tzState().recipes.includes(r.secret);
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (craftFilter === 'Voyage' && box) {
      const open = TZ_RECIPES.filter(tzRecipeOpen), left = TZ_RECIPES.length - open.length;
      let h = `<h3 class="tzrh"><svg viewBox="0 0 30 30" aria-hidden="true">${TZ_CHEST}</svg>Recettes secrètes des trésors <small>${open.length}/${TZ_RECIPES.length}</small></h3>`;
      h += open.length ? `<div class="recipes rgrecs tzrecs">${open.map(x => (typeof rgRecipeCard === 'function' ? rgRecipeCard(x) : '').replace('<div class="rx">', `<div class="rx"><span class="tzrk">Recette secrète · ${esc(TZ_BY[x.secret].place)}</span>`)).join('')}</div>` : '';
      if (left) h += `<p class="small tzrleft">${left} recette${left > 1 ? 's' : ''} secrète${left > 1 ? 's' : ''} attend${left > 1 ? 'ent' : ''} encore dans le carnet des trésors (Sac › Trésors).</p>`;
      box.insertAdjacentHTML('beforeend', h);
    }
  } catch (e) { console.error(e); }
  return r;
})(renderAtelier);
if (typeof GAME !== 'undefined') GAME.addUses(it => {
  if (!it || !it.rid) return [];
  return TZ_RECIPES.filter(r => tzRecipeOpen(r) && r.ing.some(([k]) => k === 'r:' + it.rid)).map(r => ({ txt: `Atelier : ${r.out[0]}`, kind: 'recette' }));
});

// ---------------- protections : un trésor unique ne se vend pas, ne se livre pas ----------------
if (typeof styleGuard === 'function') styleGuard = (orig => function (id, verb, go) {
  const it = S.inv.find(i => i.id === id);
  if (it && it.tresor && /vend|vente|livr/.test(String(verb))) { toast(`« ${it.name} » est un trésor unique : il ne se vend pas et ne s’échange pas.`); return; }
  return orig.apply(this, arguments);
})(styleGuard);
if (typeof bqMatch === 'function') bqMatch = (orig => function (r, it) { if (it && it.tresor) return false; return orig.apply(this, arguments); })(bqMatch);
if (typeof value === 'function') value = (orig => function (it) { if (it && it.tresor) return 2500; return orig.apply(this, arguments); })(value);
// icônes des objets uniques (reliques sous cloche) ; petite étoile dorée sur les vêtements uniques
if (typeof itemIcon === 'function') itemIcon = (orig => function (it) {
  if (it && it.cat === 'd' && typeof it.sub === 'string' && it.sub.startsWith('rl_')) return tzRelicSVG(it.sub.slice(3), it.color);
  const s = orig.apply(this, arguments);
  if (it && it.tresor && it.cat === 'v' && s.includes('viewBox="0 0 40 40"')) return s.replace(/<\/svg>$/, `<path d="${tzStar(33, 7, 4.2)}" fill="#fff6c2" stroke="#5b4636" stroke-width=".9"/></svg>`);
  return s;
})(itemIcon);
if (typeof decorArt === 'function') decorArt = (orig => function (kind) { if (typeof kind === 'string' && kind.startsWith('rl_')) return tzRelicDecor(kind.slice(3), arguments[1]); return orig.apply(this, arguments); })(decorArt);
if (typeof PLACEMENT !== 'undefined') for (const g of Object.keys(TZ_GLY)) PLACEMENT['rl_' + g] = 'shelf';
// au retour : la carte d’un trésor unique brille dans le butin
if (typeof haulCard === 'function') haulCard = (orig => function (it) { const h = orig.apply(this, arguments); return it && it.tresor ? h.replace('class="hcard ', 'class="hcard tzh ') : h; })(haulCard);
// fiche d’un objet unique : plaque, provenance, rareté, « inestimable »
if (typeof openFiche === 'function') openFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  try {
    const it = S.inv.find(i => i.id === id), f = document.querySelector('#modal .fiche');
    if (it && it.tresor && f && TZ_BY[it.tresor]) {
      const T = TZ_BY[it.tresor], z = tzZ(T.id);
      f.classList.add('tzofiche');
      const h2 = f.querySelector('h2'); if (h2) h2.outerHTML = `<div class="tzplate sm"><span>${esc(it.name)}</span></div>`;
      const anchor = f.querySelector('.obfrar') || f.querySelector('.tzplate');
      if (anchor) anchor.insertAdjacentHTML('afterend', `<span class="tzkind">Trésor unique · ${esc(T.place)}${z.byName ? ` · trouvé par ${esc(z.byName)}` : ''}${z.found ? `, le ${esc(new Date(z.found).toLocaleDateString('fr-FR'))}` : ''}</span><div class="tzrare sm"><b>Seulement ${tzPctTxt(T)} %</b> des voyageurs l’ont trouvé.</div>`);
      f.querySelectorAll('[data-sellq], [data-obgo="sell"]').forEach(b => b.remove());
      const v = f.querySelector('.obval'); if (v) v.innerHTML = '<span class="obvl">Valeur</span><b>Inestimable</b><span class="tzne">Non échangeable</span>';
    }
  } catch (e) { console.error(e); }
  return r;
})(openFiche);

// ---------------- les autres sources de rumeurs (systèmes existants) ----------------
// 1. certains clients de la boutique (l’étiquette « Rumeur » est affichée sur la commande)
const tzOrderRumor = o => !!(o && TZ_CLIENTS.includes(o.client) && tzH('ord' + o.id) < 0.7);
if (typeof bqOrderCard === 'function') bqOrderCard = (orig => function (o) {
  const h = orig.apply(this, arguments);
  try { if (tzOrderRumor(o) && !tzTuto()) return h.replace('<div class="bq-rew">', `<div class="bq-rew"><span class="bq-bonus tzrumchip" title="Ce client vous confiera une rumeur sur un trésor unique"><svg viewBox="0 0 30 30" aria-hidden="true">${TZ_CHEST}</svg>Rumeur</span>`); } catch (e) {}
  return h;
})(bqOrderCard);
if (typeof GAME !== 'undefined') GAME.on('order:done', ({ order, client }) => {
  try {
    if (!tzOrderRumor(order) || tzTuto()) return;
    const r = tzGiveRumor(null, 'client');
    if (r) setTimeout(() => tzRumorToast(`${client.name} vous glisse une rumeur`, r), 1500);
  } catch (e) { console.error(e); }
});
// 2. « Saluer » un voyageur simulé : parfois une rumeur (trois par jour au plus)
if (typeof vySayHi === 'function') vySayHi = (orig => function (id) {
  const had = !!(typeof vyState === 'function' && vyState().hi[id]);
  const r0 = orig.apply(this, arguments);
  try {
    if (had || tzTuto() || !(typeof vyState === 'function' && vyState().hi[id]) || tzH('hi' + id) >= 0.4) return r0;
    const st = tzState(), dk = dayKey(); if (st.greet.day !== dk) st.greet = { day: dk, n: 0 };
    if (st.greet.n >= 3) return r0;
    const t = typeof vyById === 'function' ? vyById(id) : null;
    const r = tzGiveRumor(null, 'salut', t && t.dest);
    if (r) { st.greet.n++; save(); setTimeout(() => tzRumorToast(`${t ? t.p.comp : 'Un voyageur'} vous chuchote une rumeur`, r), 1600); }
  } catch (e) { console.error(e); }
  return r0;
})(vySayHi);
// 3. les voyageurs simulés trouvent eux aussi des trésors (fil du monde)
function tzFeedFind(e) {
  if (!e || e.kind !== 'back' || !e.t || !e.t.dest) return null;
  if (tzH('vyf' + e.t.id) >= 0.4) return null;
  let best = null, bd = 260;
  for (const T of TZ) { const d = kmBetween(e.t.dest, T); if (d < bd) { bd = d; best = T; } }
  return best;
}
if (typeof vyFeedText === 'function') vyFeedText = (orig => function (e) {
  try { const T = tzFeedFind(e); if (T) return `<b>${esc(e.t.p.name)}</b> a trouvé ${esc(tzRewardPhrase(T))} ! <span class="tzfeed">Trésor unique</span>`; } catch (er) {}
  return orig.apply(this, arguments);
})(vyFeedText);
// 4. paliers du Compédium et du codex des régions
if (typeof nsClaimTier === 'function') nsClaimTier = (orig => function (id) {
  const N = typeof nsState === 'function' ? nsState() : null, before = !!(N && N.tiers[id]);
  const r0 = orig.apply(this, arguments);
  try { if (N && !before && N.tiers[id]) { const r = tzGiveRumor(null, 'compedium'); if (r) setTimeout(() => tzRumorToast('Le Compédium vous offre une rumeur', r), 1800); } } catch (e) { console.error(e); }
  return r0;
})(nsClaimTier);
if (typeof rgClaim === 'function') rgClaim = (orig => function (id) {
  const before = !!(typeof rgState === 'function' && rgState().claimed[id]);
  const r0 = orig.apply(this, arguments);
  try { if (!before && rgState().claimed[id]) { const R = RG[id], r = tzGiveRumor(null, 'codex', R ? { lon: R.anchor[0], lat: R.anchor[1] } : null); if (r) setTimeout(() => tzRumorToast('Le codex des régions vous offre une rumeur', r), 1800); } } catch (e) { console.error(e); }
  return r0;
})(rgClaim);

// ---------------- branchements : voyage, retour, navigation, carte ----------------
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  const t = S.trips[k];
  if (t && t !== before) { try { tzPlanSense(t); save(); } catch (e) { console.error('trésors', e); } }
  return r;
})(startTrip);
fireEvent = (orig => function (t, e) { if (e && e.type === 'tzsense') { try { return tzFireSense(t, e); } catch (er) { console.error(er); return; } } return orig.apply(this, arguments); })(fireEvent);
collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  let res = null;
  if (t && t.done && !tzTuto()) { try { res = tzBeforeCollect(t, k); res.dest = t.dest; } catch (e) { console.error('trésors', e); res = null; } }
  const r = orig.apply(this, arguments);
  if (res && !S.trips[k]) { try { tzAfterCollect(res); } catch (e) { console.error('trésors', e); } }
  return r;
})(collect);
if (typeof renderSacTab === 'function') renderSacTab = (orig => function (box) { if (sacView === 'tresors') return renderTresors(box); return orig.apply(this, arguments); })(renderSacTab);
if (typeof subDot === 'function') subDot = (orig => function (t, k) { if (t === 'sac' && k === 'tresors') { try { return tzState().unseen > 0; } catch (e) { return false; } } return orig.apply(this, arguments); })(subDot);
if (typeof renderNav === 'function') renderNav = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    if (!tzState().unseen) return r;
    const b = document.querySelector('#nav [data-nav="sac"]'); if (!b || b.querySelector('.tb')) return r;
    b.insertAdjacentHTML('beforeend', '<i class="tb" title="Nouvelle rumeur de trésor">!</i>');
  } catch (e) {}
  return r;
})(renderNav);
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); try { tzMapUpdate(); positionOverlay(); } catch (e) { console.error(e); } return r; })(drawMarks);
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const d = plan.dest, T = d && d.tz && TZ_BY[d.tz];
    if (T && !S.trips[S.sel] && box) {
      const n = tzName(S.sel);
      box.insertAdjacentHTML('afterbegin', `<div class="tzvban"><svg viewBox="0 0 30 30" aria-hidden="true">${TZ_CHEST}</svg><p><b>${d.tzx ? 'Exploration de la zone' : 'Trésor unique'}</b> ${d.tzx ? `${esc(n)} fouillera le centre de la zone : elle se resserrera à son retour.` : `${esc(n)} passera à moins de ${T.rad} km : le trésor sera à vous à son retour !`}</p></div>`);
    }
  } catch (e) { console.error(e); }
  return r;
})(renderVoyage);
// Compédium : les variantes exclusives ont leur rangée
if (typeof nsRenderCompedium === 'function') nsRenderCompedium = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const V = TZ.filter(T => T.type === 'variante'), N = typeof nsState === 'function' ? nsState() : { pals: {} };
    const got = V.filter(T => N.pals[T.rw.sp + ':' + T.rw.pal]).length;
    const h = `<h3 class="cph">Variantes exclusives des trésors <small>${got}/${V.length}</small></h3><div class="tzcpx">${V.map(T => { const has = N.pals[T.rw.sp + ':' + T.rw.pal], p = tzPal(T); return `<button class="tzcpv${has ? ' on' : ''}" data-tzopen="${T.id}" title="${has ? esc(p.name) : 'Variante exclusive à trouver'}">${has ? `<img alt="" src="${nsPortrait(T.rw.sp, tzGenes(T), null, 'content')}">` : TZ_SIL.variante}<span>${has ? esc(p.name) : esc(spName(T.rw.sp))}</span></button>`; }).join('')}</div><p class="small">Une seule façon de les obtenir : trouver le trésor de leur lieu (Sac › Trésors).</p>`;
    const sp = box.querySelector('.cpsp'); if (sp) sp.insertAdjacentHTML('afterend', h); else box.insertAdjacentHTML('beforeend', h);
  } catch (e) { console.error(e); }
  return r;
})(nsRenderCompedium);

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-tzopen],[data-tzf],[data-tzfollow],[data-tzunfollow],[data-tzmap],[data-tzgo],[data-tzrevok],[data-tzrevagain],[data-tzclose],[data-tzatelier]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.tzrevok != null) { const i = +d.tzrevok, res = tzLastReveal; if (res && i + 1 < res.found.length) tzShowReveal(res, i + 1); else tzCloseReveal(); return; }
  if (d.tzrevagain) { if (tzLastReveal) tzShowReveal(tzLastReveal, 0); return; }
  if (d.tzclose) { $('modal').hidden = true; return; }
  if (d.tzopen) { tzOpenFiche(d.tzopen); return; }
  if (d.tzf) { tzState().filter = d.tzf; save(); renderPanel(); return; }
  if (d.tzfollow) { const st = tzState(); st.follow = d.tzfollow; save(); drawMarks(); toast('Trésor suivi : sa zone dorée apparaît sur la carte.'); if (!$('modal').hidden && document.querySelector('#modal .tzfiche')) tzOpenFiche(d.tzfollow); if (tab === 'sac') renderPanel(); return; }
  if (d.tzunfollow) { tzState().follow = ''; save(); drawMarks(); $('modal').hidden = true; if (tab === 'sac') renderPanel(); return; }
  if (d.tzmap) { tzMapView(d.tzmap); return; }
  if (d.tzgo) { tzGo(d.tzgo); return; }
  if (d.tzatelier) { $('modal').hidden = true; craftFilter = 'Voyage'; openSheet('atelier'); return; }
});
(function tzPinClick() { const ov = $('ov'); if (ov) ov.addEventListener('click', ev => { const m = ev.target.closest('.tzm'); if (!m) return; const st = tzState(); if (st.follow) openTresors(st.follow); }); })();

// ---------------- mise en place et migration des anciennes sauvegardes ----------------
(function tzInit() {
  try {
    const st = tzState();
    if (typeof SUBTABS !== 'undefined' && SUBTABS.sac && !SUBTABS.sac.some(x => x[0] === 'tresors')) SUBTABS.sac.splice(1, 0, ['tresors', 'Trésors', 'tresors']);
    if (typeof NAV_ICONS !== 'undefined') NAV_ICONS.tresors = '<path d="M4 14 H26 V26 H4Z" fill="#c98a4f" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 14 C4 5 26 5 26 14Z" fill="#e3a65f" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 14 H26" stroke="currentColor" stroke-width="2"/><path d="M10 8 V26 M20 8 V26" stroke="#f6c445" stroke-width="2.4"/><rect x="12.5" y="12" width="5" height="6.5" rx="1.2" fill="#f6c445" stroke="currentColor" stroke-width="1.6"/><path d="M25 3.5 l.9 2 2.1.3 -1.6 1.4 .5 2.1 -1.9 -1.1 -1.9 1.1 .5 -2.1 -1.6 -1.4 2.1 -.3Z" fill="#fff3b0" stroke="currentColor" stroke-width="1"/>';
    if (typeof TAB_ALIAS !== 'undefined') { TAB_ALIAS.tresors = ['sac', 'tresors']; TAB_ALIAS.carnet_tresors = ['sac', 'tresors']; }
    if (typeof COMP_FROM !== 'undefined') COMP_FROM.tresor = 'Né d’un œuf de trésor';
    if (typeof LIVE_KIND !== 'undefined') LIVE_KIND.tzsense = ['#d9a21e', '<path d="M4 11 H20 V20 H4Z" fill="#fff"/><path d="M4 11 C4 4 20 4 20 11Z" fill="#fff"/><rect x="10" y="9.5" width="4" height="4.5" rx="1" fill="#d9a21e"/>', 'Trésor'];
    tzRegisterRecipes();
    // migration (une seule fois) : lieux secrets débloqués → une rumeur ; lieux secrets trouvés → trésors trouvés ;
    // anciennes cartes au trésor du sac → bouts de carte ; l’objet de l’ancien butin devient l’objet unique
    if (!st.mig) {
      const by = S.sel && S.comps && S.comps[S.sel] ? S.sel : (typeof teamIds === 'function' ? teamIds()[0] : '') || 'pistache';
      let nF = 0, nR = 0;
      for (const s of (typeof SECRETS !== 'undefined' ? SECRETS : [])) {
        const id = TZ_SECRET_MAP[s.key], T = TZ_BY[id]; if (!T) continue;
        const was = (S.found && S.found[s.name]) || (Array.isArray(S.secrets) && S.secrets.includes(s.key)); if (!was) continue;
        const z = tzZ(id);
        if (S.found && S.found[s.name]) {
          z.found = z.found || Date.now(); z.by = by; z.byName = tzName(by); z.legacy = 1; z.rum = Math.max(z.rum, 1); nF++;
          const old = TZ_LEGACY_ITEM[s.key] && S.inv.find(i => i.name === TZ_LEGACY_ITEM[s.key] && !i.tresor);
          if (old && T.type === 'objet') { const d = T.rw.item; Object.assign(old, { name: d[0], cat: d[1], sub: d[2], rarity: d[3], look: d[4] || null, color: d[5] || null, tresor: id, edition: 'Trésor unique', desc: tzStory(T, by), from: T.place }); S.dex[d[0]] = true; }
          if (T.type === 'variante') z.legacyEgg = 1;
        } else if (Array.isArray(S.secrets) && S.secrets.includes(s.key)) { z.rum = Math.max(z.rum, 1); z.p += 1; st.rumN++; nR++; if (!st.follow) st.follow = id; }
      }
      for (const it of S.inv) if (it && it.cat === 't') { if (TZ_SECRET_MAP[it.sub]) it.sub = TZ_SECRET_MAP[it.sub]; it.name = 'Bout de carte'; it.rarity = Math.min(it.rarity, 2); }
      try { if (typeof REGIONS !== 'undefined' && typeof rgDiscovered === 'function') { const n = REGIONS.filter(R => rgDiscovered(R.id)).length; st.regMs = TZ_REG_MS.filter(x => n >= x).length; } } catch (e) {}
      if ((S.stats && S.stats.trips) >= 3 && !st.firstRum && (nR || nF)) st.firstRum = 'migration';
      st.mig = 1;
      if (nF || nR) { st.unseen = 1; setTimeout(() => { try { toast(`Vos anciens lieux secrets sont devenus des trésors uniques : ${nF ? `${nF} trouvé${nF > 1 ? 's' : ''}` : ''}${nF && nR ? ', ' : ''}${nR ? `${nR} rumeur${nR > 1 ? 's' : ''}` : ''}. Voir Sac › Trésors.`); } catch (e) {} }, 2500); }
      save();
    }
    // l’œuf de la variante d’un ancien lieu secret trouvé (créé dès que la nurserie est prête)
    for (const T of TZ) { const z = st.z[T.id]; if (z && z.legacyEgg && T.type === 'variante') { try { const o = { sp: T.rw.sp, genes: tzGenes(T), rarity: 4, from: { how: 'tresor', place: T.place, tz: T.id }, ms: 60e3, known: true }; const e = typeof nsAddEgg === 'function' ? nsAddEgg(o) : null; if (!e) addEgg({ sp: o.sp, genes: o.genes, rarity: 4, from: o.from, hatchMs: o.ms }); z.sp = T.rw.sp; delete z.legacyEgg; save(); } catch (e) { console.error(e); } } }
  } catch (e) { console.error('trésors', e); }
})();

// ---------------- styles ----------------
(function tzCSS() {
  const st = document.createElement('style'); st.id = 'tresorsCSS';
  st.textContent = `
/* carnet */
.tzsum{display:flex;gap:12px;align-items:center;background:linear-gradient(180deg,#fff6dc,#fdeec4);border:2.5px solid var(--ink);border-radius:16px;padding:9px 12px;margin:0 0 8px;box-shadow:0 3px 0 rgba(74,53,40,.22)}
.tzbig{display:flex;flex-direction:column;align-items:center;min-width:64px}
.tzbig b{font:800 30px/1 var(--display);color:#a8701a}.tzbig b small{font-size:15px;color:var(--ink2)}
.tzbig span{font:700 12px var(--display);color:var(--ink2)}
.tzbars{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--ink2)}
.tzbars b{color:var(--ink)}
.tzbar{display:block;height:10px;border-radius:99px;background:#efe2c4;border:1.5px solid var(--ink);overflow:hidden}
.tzbar i{display:block;height:100%;background:linear-gradient(90deg,#f6c445,#e9a03a);border-radius:99px}
.tzf{margin-bottom:8px}
.tzh{display:flex;align-items:center;gap:6px;margin:12px 0 6px;font:800 16px var(--display)}
.tzh small{font:700 12px var(--body);background:#efe2c4;border-radius:99px;padding:0 7px;color:var(--ink2)}
.tzgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media (min-width:700px){.tzgrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.tzc{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;background:#fffaf0;border:2px solid var(--line);border-radius:16px;padding:9px 8px 8px;cursor:pointer;color:var(--ink);font-family:var(--body);min-width:0;transition:transform .12s}
.tzc:hover{transform:translateY(-2px)}
.tzc.act{border-color:#e3b94a;background:#fff8e4}
.tzc.on{border-color:var(--ink);box-shadow:0 3px 0 #d9a21e,0 0 0 3px #f6c44555}
.tzc.got{background:linear-gradient(180deg,#fff9e8,#fff);border-color:#e3b94a}
.tzsil{display:flex;align-items:center;justify-content:center;width:54px;height:54px;flex:none}
.tzsil svg,.tzsil img{width:100%;height:100%;object-fit:contain}
.tzsil.big{width:74px;height:74px}
.tzsil.got{width:58px;height:58px;border-radius:50%;background:radial-gradient(circle,#fff6c2 0,#fff6c200 70%)}
.tzsil.got.t-variante img{width:120%;height:120%;margin-top:6px}
.tzct{display:flex;flex-direction:column;gap:3px;min-width:0;width:100%}
.tzct b{font:800 14.5px/1.15 var(--display)}
.tzct i{font-size:12px;line-height:1.3;color:var(--ink2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.tzc.got .tzct i{-webkit-line-clamp:2}
.tzmeta{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}
.tzmeta em{font:700 11px var(--body);font-style:normal;color:#9a6f12;background:#fff1c9;border-radius:99px;padding:0 6px}
.tzdots{display:inline-flex;gap:3px}
.tzdots i{width:9px;height:9px;border-radius:50%;background:#e7dcc4;border:1.5px solid #b9a68a}
.tzdots i.on{background:#f6c445;border-color:#a8701a}
.tzflag{position:absolute;top:-7px;right:-4px;background:#f6c445;border:2px solid var(--ink);border-radius:99px;font:800 11px/16px var(--display);padding:0 7px;box-shadow:0 2px 0 rgba(74,53,40,.3)}
.tzwho{display:inline-flex;align-items:center;justify-content:center;gap:4px;font:700 11.5px var(--body);color:var(--ink2)}
.tzc .tzwho img{width:22px!important;height:24px!important;max-width:22px;object-fit:contain;flex:none}
.tzempty{background:#fffaf0;border:2px dashed #e3cf9a;border-radius:14px;padding:10px 12px;font-size:13.5px;color:var(--ink2);margin:4px 0}
.tzfoot{margin-top:12px}
.tzhero{background:linear-gradient(170deg,#fff7dd,#fffaf0 60%);border:2.5px solid var(--ink);border-radius:18px;padding:11px 12px 12px;box-shadow:0 4px 0 #d9a21e;margin:4px 0 6px;display:flex;flex-direction:column;gap:8px}
.tzhh{display:flex;gap:10px;align-items:flex-start}
.tzk{font:800 11px var(--display);text-transform:uppercase;letter-spacing:.04em;color:#a8701a}
.tzhero h3{margin:1px 0 2px;font:800 19px/1.1 var(--display)}
.tzriddle{margin:0;font:600 14px/1.45 var(--body);font-style:italic;color:#5a4232}
.tzriddle.sm{font-size:12.5px;color:var(--ink2)}
.tzrums{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;text-align:left;width:100%}
.tzrums li{background:#fff;border:1.5px solid #ecd59a;border-radius:11px;padding:5px 9px;font-size:13px;line-height:1.35}
.tzrums li b{display:block;font:800 11px var(--display);text-transform:uppercase;letter-spacing:.04em;color:#a8701a}
.tzrums li.no{background:transparent;border-style:dashed;border-color:#d9ccb2;color:#a8998a}
.tzrums li.no b{color:#b9a68a}
.tzrums li.new{animation:tzNew 1.6s ease-out;border-color:#d9a21e;box-shadow:0 0 0 3px #f6c44566}
@keyframes tzNew{0%{transform:scale(.96);background:#fff3b0}100%{transform:none;background:#fff}}
.tzzone{background:#fff;border:1.5px solid #ecd59a;border-radius:12px;padding:7px 10px;display:flex;flex-direction:column;gap:4px;text-align:left;width:100%}
.tzzh{display:flex;flex-direction:column}
.tzzh span{font:800 11px var(--display);text-transform:uppercase;letter-spacing:.04em;color:#a8701a}
.tzzh b{font:700 13.5px var(--body)}
.tzzbar{display:block;height:8px;border-radius:99px;background:repeating-linear-gradient(90deg,#efe2c4 0 6px,#f7efdc 6px 9px);border:1.5px solid #c9b48e;overflow:hidden}
.tzzbar i{display:block;height:100%;background:linear-gradient(90deg,#f6c445,#d9a21e)}
.tzzone small{font-size:12px;color:var(--ink2);line-height:1.35}
.tzacts{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center}
.tzghost{background:none;border:0;color:var(--ink2);text-decoration:underline;font:700 12.5px var(--body);cursor:pointer;padding:4px}
.tzfiche{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.tzfiche .tzriddle{font-size:15px}
.tzfart{width:120px;height:120px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle,#fff3b0 0,#fff3b000 70%)}
.tzfart svg,.tzfart img{width:100%;height:100%;object-fit:contain}
.tzfart.t-variante img{width:130%;height:130%}
.tzkick{font:800 11.5px var(--display);text-transform:uppercase;letter-spacing:.06em;color:#a8701a}
.tzkind{font:700 13px var(--body);color:var(--ink2)}
/* plaque gravée */
.tzplate{position:relative;display:inline-block;max-width:100%;padding:8px 22px 9px;border-radius:10px;background:linear-gradient(180deg,#fbe7a2 0,#f2c552 45%,#d9a21e 100%);border:2.5px solid #7a5a1e;box-shadow:inset 0 2px 0 rgba(255,255,255,.7),inset 0 -3px 0 rgba(122,90,30,.35),0 4px 0 rgba(74,53,40,.35)}
.tzplate::before,.tzplate::after{content:"";position:absolute;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:#a8701a;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
.tzplate::before{left:7px}.tzplate::after{right:7px}
.tzplate span{display:block;font:800 19px/1.15 var(--display);color:#6a4a12;letter-spacing:.02em;text-shadow:0 1px 0 rgba(255,246,200,.85),0 -1px 0 rgba(90,60,10,.45);text-wrap:balance}
.tzplate.sm span{font-size:17px}
.tzrare{background:#2f2a4a;color:#fff3c4;border-radius:12px;padding:6px 12px;font-size:13.5px}
.tzrare b{color:#ffd96a}
.tzrare.sm{font-size:12.5px;padding:4px 10px;margin:2px 0}
.tzby{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink2)}
.tzby img{width:30px;height:33px;object-fit:contain}
.tzstory{margin:0;font-size:14px;line-height:1.5}
.tzhint{margin:0;font-size:12.5px;color:var(--ink2)}
/* bandeau du butin, notes */
.tzban{display:flex;align-items:center;gap:10px;width:100%;border:2.5px solid var(--ink);border-radius:16px;padding:7px 10px;background:linear-gradient(90deg,#ffe48a,#f6c445 60%,#ffe9a8);box-shadow:0 3px 0 #a8701a;cursor:pointer;text-align:left;color:var(--ink);font-family:var(--body);animation:tzBan .6s cubic-bezier(.2,1.6,.4,1)}
@keyframes tzBan{from{transform:translateY(-8px) scale(.96);opacity:0}}
.tzban .tzbi svg{width:34px;height:34px;color:var(--ink)}
.tzban>span:nth-child(2){flex:1;display:flex;flex-direction:column;min-width:0}
.tzban small{font:800 11px var(--display);text-transform:uppercase;letter-spacing:.05em;color:#7a4e12}
.tzban b{font:800 16px/1.15 var(--display)}
.tzban em{font:800 12px var(--display);font-style:normal;background:#fff8ea;border:2px solid var(--ink);border-radius:99px;padding:1px 8px}
.tznotes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;width:100%}
.tznotes li{display:flex;align-items:center;gap:7px;text-align:left;background:#fff8e4;border:1.5px solid #ecd59a;border-radius:11px;padding:5px 8px;font-size:13px;line-height:1.35}
.tznotes svg{width:22px;height:22px;flex:none;color:var(--ink)}
/* révélation */
.tzrev{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;padding:14px;background:radial-gradient(ellipse at 50% 38%,rgba(255,226,140,.55) 0,rgba(74,53,40,.86) 60%,rgba(40,28,22,.94) 100%);animation:tzFade .35s ease-out;overflow:auto}
@keyframes tzFade{from{opacity:0}}
.tzrbox{position:relative;width:100%;max-width:420px;max-height:100%;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;background:linear-gradient(180deg,#fffaf0,#fff3d6);border:3px solid var(--ink);border-radius:26px;padding:14px 18px 18px;box-shadow:0 0 0 6px rgba(246,196,69,.35),0 10px 0 rgba(0,0,0,.35);animation:tzPop .5s cubic-bezier(.2,1.5,.4,1)}
@keyframes tzPop{from{transform:scale(.85) translateY(20px);opacity:0}}
.tzstage{position:relative;width:220px;height:190px;flex:none;margin:-2px 0 -4px}
.tzrays{position:absolute;left:50%;top:44%;width:300px;height:300px;margin:-150px 0 0 -150px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,214,90,.55) 0 10deg,rgba(255,214,90,0) 10deg 22deg);-webkit-mask:radial-gradient(circle,#000 25%,transparent 68%);mask:radial-gradient(circle,#000 25%,transparent 68%);opacity:0;animation:tzRaysIn .6s 1.15s ease-out forwards,tzSpin 14s linear infinite}
@keyframes tzRaysIn{to{opacity:1}}
@keyframes tzSpin{to{transform:rotate(360deg)}}
.tzglow{position:absolute;left:50%;top:52%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;background:radial-gradient(circle,#fff8c8 0,rgba(255,236,150,.8) 30%,rgba(255,220,120,0) 70%);opacity:0;transform:scale(.3);animation:tzBurst .7s 1.15s ease-out forwards}
@keyframes tzBurst{60%{opacity:1;transform:scale(1.25)}to{opacity:.85;transform:scale(1)}}
.tzchest{position:absolute;left:50%;bottom:0;width:132px;margin-left:-66px;animation:tzDrop .5s cubic-bezier(.3,1.6,.5,1) both,tzShake .5s .55s ease-in-out}
.tzchest svg{width:100%;height:auto;overflow:visible;filter:drop-shadow(0 5px 0 rgba(74,53,40,.35))}
.tzlid{transform-box:fill-box;transform-origin:50% 100%;animation:tzLid .4s 1.1s cubic-bezier(.3,1.4,.5,1) forwards}
@keyframes tzDrop{from{transform:translateY(-60px) scale(.7);opacity:0}}
@keyframes tzShake{20%{transform:rotate(-4deg)}40%{transform:rotate(4deg)}60%{transform:rotate(-3deg)}80%{transform:rotate(2deg)}}
@keyframes tzLid{to{transform:scaleY(-.42);filter:brightness(.7)}}
.tzart{position:absolute;left:50%;top:6px;width:112px;height:112px;margin-left:-56px;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(70px) scale(.3);animation:tzRise .75s 1.3s cubic-bezier(.2,1.5,.4,1) forwards;filter:drop-shadow(0 0 10px rgba(255,236,150,.95))}
.tzart svg,.tzart img{width:100%;height:100%;object-fit:contain}
.tzart.t-variante{width:96px;height:112px;margin-left:-48px}
@keyframes tzRise{to{opacity:1;transform:translateY(0) scale(1)}}
.tzsparks{position:absolute;left:50%;top:44%}
.tzsparks i{position:absolute;width:10px;height:10px;margin:-5px;background:#fff3a0;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);opacity:0;transform:rotate(var(--a)) translateY(0);animation:tzSpark 1.1s var(--d) ease-out forwards}
@keyframes tzSpark{20%{opacity:1}to{opacity:0;transform:rotate(var(--a)) translateY(-110px) scale(1.4)}}
.tzrbox>.tzplate,.tzrbox>.tzkind,.tzrbox>.tzstory,.tzrbox>.tzrare,.tzrbox>.tzby,.tzrbox>.tzhint,.tzrbox>button{opacity:0;animation:tzUp .45s ease-out forwards}
.tzrbox>.tzplate{animation:tzPlate .55s 1.85s cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes tzPlate{from{opacity:0;transform:scale(.6) rotate(-3deg)}to{opacity:1;transform:none}}
.tzrbox>.tzkind{animation-delay:2.05s}.tzrbox>.tzstory{animation-delay:2.2s}.tzrbox>.tzrare{animation-delay:2.4s}.tzrbox>.tzby{animation-delay:2.5s}.tzrbox>.tzhint{animation-delay:2.55s}.tzrbox>button{animation-delay:2.65s}
@keyframes tzUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tzrev.rm *,.tzrev.rm{animation:none!important;opacity:1!important}
.tzrev.rm .tzart{transform:none}.tzrev.rm .tzlid{transform:scaleY(-.42);filter:brightness(.7)}.tzrev.rm .tzglow{transform:none}.tzrev.rm .tzsparks{display:none}
@media (max-height:700px){.tzstage{width:180px;height:150px}.tzart{width:90px;height:90px;margin-left:-45px}.tzchest{width:108px;margin-left:-54px}.tzrbox .tzstory{font-size:13px}}
/* recette secrète (parchemin) */
.tzscroll{position:relative;display:block;width:100%;height:100%}
.tzscroll>svg{width:100%;height:100%}
.tzsci{position:absolute;left:30%;top:24%;width:40%;height:52%}
.tzsci svg{width:100%;height:100%}
/* carte */
.tzm .tzpin{position:absolute;left:-17px;top:-17px;width:34px;height:34px;border-radius:50%;background:#fff3c4;border:2.5px solid #4a3528;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(246,196,69,.45),0 3px 0 rgba(74,53,40,.35);cursor:pointer;color:#4a3528;animation:tzPin 2.4s ease-in-out infinite}
.tzm .tzpin svg{width:24px;height:24px}
@keyframes tzPin{50%{box-shadow:0 0 0 8px rgba(246,196,69,.15),0 3px 0 rgba(74,53,40,.35)}}
.tzm .tzl{top:21px;background:#fff3c4!important;border-color:#a8701a!important}
#ov[data-z="far"] .tzm .tzl{display:none}
/* voyage, atelier, compédium, boutique, fil */
.tzvban{display:flex;align-items:center;gap:8px;background:#fff6d6;border:2px solid #d9a21e;border-radius:14px;padding:6px 10px;margin:0 0 8px}
.tzvban svg{width:28px;height:28px;flex:none;color:var(--ink)}
.tzvban p{margin:0;font-size:13px;line-height:1.35}
.tzrh{display:flex;align-items:center;gap:6px;margin:14px 0 6px;font:800 16px var(--display)}
.tzrh svg{width:24px;height:24px;color:var(--ink)}
.tzrh small{font:700 12px var(--body);color:var(--ink2)}
.tzrk{display:block;font:800 10.5px var(--display);text-transform:uppercase;letter-spacing:.05em;color:#a8701a}
.tzrleft{margin-top:6px}
.tzcpx{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px}
.tzcpv{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fffaf0;border:2px dashed #d9ccb2;border-radius:12px;padding:5px 4px;cursor:pointer;font:700 11px/1.2 var(--body);color:var(--ink2)}
.tzcpv.on{border:2px solid #e3b94a;background:#fff8e4;color:var(--ink)}
.tzcpv img,.tzcpv svg{width:52px;height:52px;object-fit:contain}
.tzrumchip{background:#fff1c9!important;border-color:#e3b94a!important;color:#7a4e12!important}
.tzrumchip svg{width:16px;height:16px;color:#4a3528;margin-right:2px;vertical-align:-3px}
.tzfeed{display:inline-block;font:800 10px/15px var(--display);background:#f6c445;color:#4a3528;border-radius:99px;padding:0 6px;margin-left:2px;vertical-align:1px}
.je.k-tzsense{border-color:#e3b94a;background:#fff8e4}
.je.k-tzsense p::before{content:"";display:inline-block;width:16px;height:16px;margin-right:5px;vertical-align:-3px;background:radial-gradient(circle,#f6c445 0 40%,transparent 42%),radial-gradient(circle,#fff3b0 0 70%,transparent 72%)}
.tzofiche .tzplate{margin-top:2px}
.hcard.tzh{border-color:#d9a21e!important;box-shadow:0 0 0 3px #f6c44599,0 0 18px rgba(246,196,69,.75)!important;background:linear-gradient(180deg,#fff6d0,#fffaf0)!important}
.tzne{font:800 11px var(--display);text-transform:uppercase;letter-spacing:.04em;background:#2f2a4a;color:#ffd96a;border-radius:99px;padding:1px 8px}
`;
  document.head.appendChild(st);
})();

// pour les tests
window.__tresors = {
  TZ, TZ_BY, state: () => tzState(), radius: id => tzRaw(TZ_BY[id]), dispR: id => tzDispR(TZ_BY[id]), center: id => tzCenter(TZ_BY[id]), revealed: id => tzRevealed(TZ_BY[id]),
  give: (id, src) => tzGiveRumor(id, src || 'test'), follow: id => { tzState().follow = id; save(); drawMarks(); }, seg: tzSeg, open: openTresors, fiche: tzOpenFiche,
  reveal: () => tzLastReveal && tzShowReveal(tzLastReveal, 0), mapPiece: tzMapPiece, unroll: tzUnroll, recipes: () => TZ_RECIPES, feedFind: tzFeedFind, go: tzGo, mapView: tzMapView,
};

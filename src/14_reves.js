// ================= LES RÊVES DES COMPAGNONS (fil rouge du jeu) =================
// « Réalise les rêves de tes compagnons. » Chaque compagnon a un rêve en cours, fait d'étapes concrètes.
// Types d'étapes :
//   visit : visiter n lieux  { cat: 'boulangerie' | [cats], tag: 'mer' }  (un lieu compte s'il a la bonne catégorie OU le bon tag)
//   item  : rapporter n objets { ing: clé de ING } | { sub: sous-type } | { name: nom précis } ; src = où aller (catégorie, tag ou lieu célèbre)
//   craft : fabriquer une recette { id: id de RECIPES } (compte pour tous les compagnons dont le rêve en cours la demande)
//   place : visiter un lieu célèbre { name: nom dans PLACES }
//   km    : faire un voyage d'au moins { km } kilomètres
// Une visite et les objets rapportés comptent pour le compagnon qui voyage.
const DREAMS = [
  // ---------- Pistache : pommes, fruits, pain, forêts ----------
  { id: 'p_baguette', who: 'pistache', wish: 'goûter la meilleure baguette du monde', quote: 'Je rêve d’une baguette toute chaude, qui craque quand on la casse. Rien que d’y penser, ma queue frétille !',
    steps: [{ t: 'visit', cat: 'boulangerie', n: 2, txt: 'Visiter 2 boulangeries', short: 'Boulangeries' },
      { t: 'item', sub: 'farine', n: 1, src: 'boulangerie', txt: 'Rapporter un peu de farine', short: 'Farine' }],
    reward: { coins: 60, build: 'boulangerie', item: ['Toque de la baguette d’or', 'v', 'tete', 2, 'bonnet', '#fff6e2'] } },
  { id: 'p_confiture', who: 'pistache', wish: 'faire sa propre confiture', quote: 'Je rêve de remplir un pot de confiture avec des fruits du marché, et de le manger à la cuillère en cachette.',
    steps: [{ t: 'visit', cat: 'marche', n: 1, txt: 'Visiter un marché', short: 'Marché' },
      { t: 'item', ing: 'fruit', n: 2, src: 'marche', txt: 'Rapporter 2 fruits', short: 'Fruits' },
      { t: 'craft', id: 'confiture', txt: 'Fabriquer la confiture des bois', short: 'Confiture' }],
    reward: { coins: 90, item: ['Pot de confiture de Pistache', 'd', 'bocal', 2, null, '#c94a6a'] } },
  { id: 'p_tarte', who: 'pistache', wish: 'cuisiner une tarte aux pommes', quote: 'Je rêve d’une tarte aux pommes dorée, comme celles qui refroidissent sur le rebord des fenêtres.',
    steps: [{ t: 'item', ing: 'pomme', n: 2, src: 'marche', txt: 'Rapporter 2 pommes', short: 'Pommes' },
      { t: 'item', ing: 'sucre', n: 1, src: 'boulangerie', txt: 'Rapporter une douceur sucrée', short: 'Sucre' },
      { t: 'craft', id: 'tarte', txt: 'Fabriquer la tarte aux pommes', short: 'Tarte' }],
    reward: { coins: 130, build: 'potager', item: ['Tablier de pâtissière', 'v', 'haut', 2, 'tshirt', '#f3b6b0'] } },
  { id: 'p_echarpe', who: 'pistache', wish: 'tricoter une écharpe d’automne', quote: 'Je range tous mes trésors dans mon écharpe. Je rêve d’en avoir une nouvelle, faite de feuilles rousses.',
    steps: [{ t: 'visit', cat: 'parc', n: 2, txt: 'Visiter 2 parcs', short: 'Parcs' },
      { t: 'item', ing: 'feuille', n: 3, src: 'parc', txt: 'Rapporter 3 feuilles, fleurs ou mousses', short: 'Feuilles' },
      { t: 'item', ing: 'laine', n: 1, src: 'laverie', txt: 'Rapporter une laine (laverie, coiffeur, ferme)', short: 'Laine' },
      { t: 'craft', id: 'echarpe', txt: 'Fabriquer l’écharpe de feuilles', short: 'Écharpe' }],
    reward: { coins: 180, build: 'atelier_couture', item: ['Écharpe rousse de Pistache', 'v', 'cou', 3, 'echarpe', '#d9733f'] } },
  { id: 'p_broceliande', who: 'pistache', wish: 'se perdre dans la forêt de Brocéliande', quote: 'On dit qu’il y a des fées dans la forêt de Brocéliande. Je rêve d’en voir une, même toute petite.',
    steps: [{ t: 'place', name: 'Brocéliande', txt: 'Voyager jusqu’à Brocéliande', short: 'Brocéliande' },
      { t: 'item', name: 'Mousse enchantée', n: 1, src: 'Brocéliande', txt: 'Rapporter la Mousse enchantée', short: 'Mousse' },
      { t: 'km', km: 400, txt: 'Faire un voyage de 400 km ou plus', short: '400 km' }],
    reward: { coins: 240, item: ['Couronne de feuilles des fées', 'v', 'tete', 3, 'fleurs', '#8fbf6a'] } },
  { id: 'p_herbier', who: 'pistache', wish: 'faire pousser sa propre plante', quote: 'Je rêve de planter une graine et de la regarder grandir, un peu chaque jour, jusqu’à ce qu’elle soit plus grande que moi.',
    steps: [{ t: 'visit', cat: 'fleuriste', n: 1, txt: 'Visiter un fleuriste', short: 'Fleuriste' },
      { t: 'item', ing: 'graine', n: 3, src: 'parc', txt: 'Rapporter 3 graines', short: 'Graines' },
      { t: 'craft', id: 'plante', txt: 'Fabriquer une plante en pot', short: 'Plante' }],
    reward: { coins: 300, build: 'serre', item: ['Arrosoir de Pistache', 'd', 'plante', 3, null, '#7fbf5a'] } },
  { id: 'p_noel', who: 'pistache', wish: 'visiter le marché de Noël de Strasbourg', quote: 'Des lumières partout, des bretzels, du pain d’épices… Je rêve de me promener au marché de Noël avec un bonnet tout chaud.',
    steps: [{ t: 'place', name: 'Strasbourg', txt: 'Voyager jusqu’à Strasbourg', short: 'Strasbourg' },
      { t: 'item', name: 'Bretzel de Noël', n: 1, src: 'Strasbourg', txt: 'Rapporter le Bretzel de Noël', short: 'Bretzel' },
      { t: 'item', ing: 'sucre', n: 4, src: 'boulangerie', txt: 'Rapporter 4 douceurs sucrées', short: 'Douceurs' }],
    reward: { coins: 420, item: ['Bonnet de Noël de Pistache', 'v', 'tete', 3, 'bonnet', '#c94a4a'] } },
  { id: 'p_erables', who: 'pistache', wish: 'voir les forêts d’érables du Canada', quote: 'Les feuilles d’érable sont mes préférées. Je rêve de voir une forêt entière devenir rousse comme moi.',
    steps: [{ t: 'km', km: 5000, txt: 'Faire un voyage de 5 000 km ou plus', short: '5 000 km' },
      { t: 'place', name: 'Montréal', txt: 'Voyager jusqu’à Montréal', short: 'Montréal' },
      { t: 'item', name: 'Sirop d’érable', n: 1, src: 'Montréal', txt: 'Rapporter le Sirop d’érable', short: 'Sirop' },
      { t: 'place', name: 'Banff', txt: 'Voyager jusqu’à Banff', short: 'Banff' }],
    reward: { coins: 800, item: ['Cape feuille d’érable', 'v', 'dos', 4, 'cape', '#d9603f'] } },

  // ---------- Mochi : calme, agrumes, thé, eau ----------
  { id: 'm_terrasse', who: 'mochi', wish: 'boire un thé au calme', quote: 'Je rêve d’une tasse bien chaude, d’un banc à l’ombre… et de rien d’autre. Peut-être une petite sieste.',
    steps: [{ t: 'visit', cat: 'cafe', n: 1, txt: 'Visiter un café', short: 'Café' },
      { t: 'visit', cat: 'parc', n: 1, txt: 'Visiter un parc', short: 'Parc' }],
    reward: { coins: 60, build: 'salon_the', item: ['Tasse fumante de Mochi', 'd', 'bocal', 2, null, '#b9d8c0'] } },
  { id: 'm_agrumes', who: 'mochi', wish: 'goûter tous les agrumes de Menton', quote: 'À Menton, il paraît que les citrons sont gros comme ma tête. Je rêve d’une salade d’agrumes, au soleil.',
    steps: [{ t: 'place', name: 'Menton', txt: 'Voyager jusqu’à Menton', short: 'Menton' },
      { t: 'item', ing: 'agrume', n: 3, src: 'Menton', txt: 'Rapporter 3 agrumes', short: 'Agrumes' },
      { t: 'craft', id: 'salade', txt: 'Fabriquer la salade d’agrumes', short: 'Salade' }],
    reward: { coins: 90, item: ['Mandarine porte-bonheur', 'n', 'agrume', 3, null, '#f2963b'] } },
  { id: 'm_eau', who: 'mochi', wish: 'écouter le bruit de l’eau', quote: 'Le clapotis de l’eau, c’est ma musique préférée. Je rêve de m’asseoir au bord d’un étang et de fermer les yeux.',
    steps: [{ t: 'visit', cat: ['etang', 'riviere'], tag: 'lac', n: 2, txt: 'Visiter 2 lieux au bord de l’eau (étang, rivière, lac)', short: 'Bord de l’eau' },
      { t: 'item', ing: 'pierre', n: 2, src: 'riviere', txt: 'Rapporter 2 galets ou pierres', short: 'Galets' }],
    reward: { coins: 130, build: 'fontaine', item: ['Galet zen', 'm', 'pierre', 3, null, '#a9b4bc'] } },
  { id: 'm_montagne', who: 'mochi', wish: 'prendre un bain chaud à la montagne', quote: 'Je rêve d’une source chaude en montagne, avec de la neige tout autour, et des moufles pour ne pas avoir froid aux pattes.',
    steps: [{ t: 'visit', tag: 'montagne', n: 1, txt: 'Visiter un lieu de montagne', short: 'Montagne' },
      { t: 'item', ing: 'laine', n: 2, src: 'laverie', txt: 'Rapporter 2 laines (laverie, coiffeur, ferme)', short: 'Laines' },
      { t: 'craft', id: 'moufles', txt: 'Fabriquer des moufles tricotées', short: 'Moufles' }],
    reward: { coins: 180, item: ['Bonnet des sources chaudes', 'v', 'tete', 3, 'bonnet', '#e9a0a0'] } },
  { id: 'm_lecture', who: 'mochi', wish: 'lire une histoire sous un arbre', quote: 'Je rêve d’un gros livre, d’un arbre bien large… Je lirai trois pages, puis je ferai une sieste. C’est le plan parfait.',
    steps: [{ t: 'visit', cat: 'librairie', n: 1, txt: 'Visiter une librairie', short: 'Librairie' },
      { t: 'visit', cat: 'bibliotheque', n: 1, txt: 'Visiter une bibliothèque', short: 'Bibliothèque' },
      { t: 'item', ing: 'papier', n: 3, src: 'librairie', txt: 'Rapporter 3 papiers anciens', short: 'Papiers' },
      { t: 'craft', id: 'globe', txt: 'Fabriquer la mappemonde de voyageur', short: 'Mappemonde' }],
    reward: { coins: 240, build: 'bibliotheque', item: ['Pull de lecture de Mochi', 'v', 'haut', 3, 'pull', '#9cc3a0'] } },
  { id: 'm_kyoto', who: 'mochi', wish: 'boire le thé dans un jardin de Kyoto', quote: 'Je rêve d’un jardin japonais, avec des pierres bien rangées, un petit pont et un thé vert qui fume doucement.',
    steps: [{ t: 'km', km: 5000, txt: 'Faire un voyage de 5 000 km ou plus', short: '5 000 km' },
      { t: 'place', name: 'Kyoto', txt: 'Voyager jusqu’à Kyoto', short: 'Kyoto' },
      { t: 'item', name: 'Haori de Kyoto', n: 1, src: 'Kyoto', txt: 'Rapporter le Haori de Kyoto', short: 'Haori' }],
    reward: { coins: 300, item: ['Kimono de thé de Mochi', 'v', 'haut', 3, 'sweat', '#7fae8f'] } },
  { id: 'm_lanternes', who: 'mochi', wish: 'allumer une lanterne pour la nuit', quote: 'Je rêve d’une petite lumière douce, pour regarder la nuit tomber sans avoir besoin de dormir… enfin, pas tout de suite.',
    steps: [{ t: 'visit', cat: 'patrimoine', n: 1, txt: 'Visiter une église ou un château', short: 'Château' },
      { t: 'item', ing: 'lumiere', n: 1, src: 'patrimoine', txt: 'Rapporter une lumière (cierge, cire, éclat de lune)', short: 'Lumière' },
      { t: 'item', ing: 'cristal', n: 1, src: 'poissonnerie', txt: 'Rapporter un cristal (glace pilée, cristal de roche)', short: 'Cristal' },
      { t: 'craft', id: 'lanterne', txt: 'Fabriquer la lanterne de lune', short: 'Lanterne' }],
    reward: { coins: 420, item: ['Lanterne de Mochi', 'd', 'lanterne', 4, null, '#f6e08a'] } },
  { id: 'm_aurores', who: 'mochi', wish: 'contempler les aurores boréales', quote: 'Je rêve de m’allonger dans la neige et de regarder le ciel danser en vert et en violet. Sans bouger. Toute la nuit.',
    steps: [{ t: 'km', km: 2000, txt: 'Faire un voyage de 2 000 km ou plus', short: '2 000 km' },
      { t: 'place', name: 'Rovaniemi', txt: 'Voyager jusqu’à Rovaniemi', short: 'Rovaniemi' },
      { t: 'item', name: 'Lumière boréale', n: 1, src: 'Rovaniemi', txt: 'Rapporter la Lumière boréale', short: 'Aurore' }],
    reward: { coins: 800, build: 'observatoire', item: ['Écharpe aurore boréale', 'v', 'cou', 4, 'echarpe', '#7fd0b0'] } },

  // ---------- Bulle : mer, glaces, eau, fête ----------
  { id: 'b_glace', who: 'bulle', wish: 'manger une glace à trois boules', quote: 'Je rêve d’une glace énorme, qui fond et qui coule sur mes petites pattes ! Bloup, j’en fais déjà des bulles.',
    steps: [{ t: 'visit', cat: 'glacier', n: 2, txt: 'Visiter 2 glaciers', short: 'Glaciers' },
      { t: 'item', sub: 'glace', n: 2, src: 'glacier', txt: 'Rapporter 2 glaces', short: 'Glaces' }],
    reward: { coins: 60, build: 'glacier', item: ['Bonnet sorbet de Bulle', 'v', 'tete', 2, 'bonnet', '#f6b8d0'] } },
  { id: 'b_collier', who: 'bulle', wish: 'porter un collier de coquillages', quote: 'Je rêve de voir la mer, la vraie, et de ramasser des coquillages pour me faire un collier qui fait cling-cling.',
    steps: [{ t: 'visit', tag: 'mer', n: 1, txt: 'Visiter un lieu au bord de la mer', short: 'La mer' },
      { t: 'item', ing: 'coquillage', n: 3, src: 'Calanques', txt: 'Rapporter 3 coquillages', short: 'Coquillages' },
      { t: 'craft', id: 'collier', txt: 'Fabriquer le collier de coquillages', short: 'Collier' }],
    reward: { coins: 90, item: ['Collier cling-cling de Bulle', 'v', 'cou', 3, 'foulard', '#f6cdb8'] } },
  { id: 'b_soupe', who: 'bulle', wish: 'cuisiner la soupe des pêcheurs', quote: 'Des crevettes, des moules, des sardines… Je rêve d’une grande soupe de la mer à partager avec tout le monde !',
    steps: [{ t: 'visit', cat: 'poissonnerie', n: 1, txt: 'Visiter une poissonnerie', short: 'Poissonnerie' },
      { t: 'item', ing: 'mer', n: 3, src: 'poissonnerie', txt: 'Rapporter 3 produits de la mer', short: 'Fruits de mer' },
      { t: 'craft', id: 'soupe', txt: 'Fabriquer la soupe de la mer', short: 'Soupe' }],
    reward: { coins: 130, build: 'port', item: ['Ciré de petite pêcheuse', 'v', 'haut', 3, 'sweat', '#f6d36b'] } },
  { id: 'b_plongeon', who: 'bulle', wish: 'plonger dans un lac de montagne', quote: 'Je rêve de faire le plus grand plouf de l’histoire, dans un lac tout bleu entouré de montagnes !',
    steps: [{ t: 'visit', cat: 'piscine', n: 2, txt: 'S’entraîner dans 2 piscines', short: 'Piscines' },
      { t: 'place', name: 'Annecy', txt: 'Voyager jusqu’au lac d’Annecy', short: 'Annecy' }],
    reward: { coins: 180, item: ['Bonnet de bain à pois', 'v', 'tete', 3, 'bonnet', '#58c2b0'] } },
  { id: 'b_venise', who: 'bulle', wish: 'danser au carnaval de Venise', quote: 'Des masques, des costumes, de la musique sur l’eau… Je rêve de danser sur une gondole jusqu’au bout de la nuit !',
    steps: [{ t: 'km', km: 400, txt: 'Faire un voyage de 400 km ou plus', short: '400 km' },
      { t: 'place', name: 'Venise', txt: 'Voyager jusqu’à Venise', short: 'Venise' },
      { t: 'item', name: 'Masque de carnaval', n: 1, src: 'Venise', txt: 'Rapporter le Masque de carnaval', short: 'Masque' }],
    reward: { coins: 240, build: 'kiosque', item: ['Masque à paillettes de Bulle', 'm', 'masque', 3, null, '#b07ccf'] } },
  { id: 'b_bocal', who: 'bulle', wish: 'garder la mer dans un bocal', quote: 'Je rêve de mettre un petit bout de plage dans un bocal, pour l’écouter quand il pleut… Enfin, j’adore aussi la pluie.',
    steps: [{ t: 'visit', tag: 'mer', n: 2, txt: 'Visiter 2 lieux au bord de la mer', short: 'La mer' },
      { t: 'item', ing: 'sable', n: 1, src: 'Calanques', txt: 'Rapporter du sable', short: 'Sable' },
      { t: 'item', ing: 'coquillage', n: 2, src: 'Calanques', txt: 'Rapporter 2 coquillages', short: 'Coquillages' },
      { t: 'craft', id: 'bocal', txt: 'Fabriquer le bocal de coquillages', short: 'Bocal' }],
    reward: { coins: 300, item: ['Bocal de bulles', 'd', 'bocal', 3, null, '#9fd8e4'] } },
  { id: 'b_phare', who: 'bulle', wish: 'voir la lumière d’un phare', quote: 'Je rêve de grimper en haut d’un phare et de faire coucou aux bateaux, avec la grande lumière qui tourne.',
    steps: [{ t: 'place', name: 'Mont-Saint-Michel', txt: 'Voyager jusqu’au Mont-Saint-Michel', short: 'Mont-St-Michel' },
      { t: 'visit', tag: 'mer', n: 3, txt: 'Visiter 3 lieux au bord de la mer', short: 'La mer' },
      { t: 'item', ing: 'lumiere', n: 1, src: 'patrimoine', txt: 'Rapporter une lumière (cierge, éclat de lune…)', short: 'Lumière' }],
    reward: { coins: 420, build: 'phare', item: ['Bonnet marin de Bulle', 'v', 'tete', 3, 'bonnet', '#3e6e9e'] } },
  { id: 'b_lagon', who: 'bulle', wish: 'nager dans un lagon turquoise', quote: 'Je rêve d’une eau si claire qu’on voit les poissons depuis la surface, et de nager avec une tortue, tout doucement.',
    steps: [{ t: 'km', km: 8000, txt: 'Faire un voyage de 8 000 km ou plus', short: '8 000 km' },
      { t: 'place', name: 'Bali', txt: 'Voyager jusqu’à Bali', short: 'Bali' },
      { t: 'item', name: 'Collier de frangipanier', n: 1, src: 'Bali', txt: 'Rapporter le Collier de frangipanier', short: 'Collier' },
      { t: 'item', ing: 'coquillage', n: 3, src: 'Bali', txt: 'Rapporter 3 coquillages', short: 'Coquillages' }],
    reward: { coins: 800, item: ['Couronne de corail', 'v', 'tete', 4, 'couronne', '#f08a7a'] } },
  // ---------- v13 : rêves simples des nouvelles espèces (« who » = espèce ; aucun ne débloque de bâtiment) ----------
  { id: 'r_neige', who: 'renard', wish: 'voir tomber la première neige', quote: 'Je rêve de flocons qui tombent tout doucement, et de faire des traces de pattes partout dans la neige fraîche.',
    steps: [{ t: 'visit', tag: 'neige', n: 1, txt: 'Visiter un lieu enneigé', short: 'Neige' },
      { t: 'item', sub: 'flocon', n: 1, src: 'neige', txt: 'Rapporter un flocon', short: 'Flocon' }],
    reward: { coins: 90, item: ['Bonnet de givre', 'v', 'tete', 2, 'bonnet', '#cfe8f7'] } },
  { id: 'r_aurore', who: 'renard', wish: 'contempler une aurore boréale', quote: 'Il paraît que le ciel du Grand Nord danse en vert et en violet. Je rêve de le regarder toute la nuit, la queue autour du museau.',
    steps: [{ t: 'place', name: 'Rovaniemi', txt: 'Voyager jusqu’à Rovaniemi', short: 'Rovaniemi' },
      { t: 'item', ing: 'lumiere', n: 1, src: 'Rovaniemi', txt: 'Rapporter une lumière', short: 'Lumière' }],
    reward: { coins: 300, item: ['Cape aurore', 'v', 'dos', 3, 'cape', '#9fe0d0'] } },
  { id: 'f_dune', who: 'fennec', wish: 'dormir au sommet d’une dune', quote: 'Je rêve d’une dune toute chaude, d’un ciel plein d’étoiles, et de mes grandes oreilles qui écoutent le vent.',
    steps: [{ t: 'visit', tag: 'desert', n: 1, txt: 'Visiter un désert', short: 'Désert' },
      { t: 'item', ing: 'sable', n: 2, src: 'desert', txt: 'Rapporter 2 sables', short: 'Sable' }],
    reward: { coins: 90, item: ['Chèche des dunes', 'v', 'cou', 2, 'foulard', '#e8cfa0'] } },
  { id: 'f_the', who: 'fennec', wish: 'boire un thé dans un café animé', quote: 'Je rêve d’un petit verre de thé bien sucré, et d’écouter toutes les conversations du café. Discrètement.',
    steps: [{ t: 'visit', cat: 'cafe', n: 2, txt: 'Visiter 2 cafés', short: 'Cafés' },
      { t: 'item', sub: 'boisson', n: 1, src: 'cafe', txt: 'Rapporter une boisson', short: 'Boisson' }],
    reward: { coins: 160, item: ['Lanterne des sables', 'd', 'lanterne', 2, null, '#e3a94a'] } },
  { id: 't_festin', who: 'tanuki', wish: 'organiser un grand festin', quote: 'Je rêve d’une table qui déborde : des brioches, des gâteaux, et tous mes amis autour. Je goûterai tout. Deux fois.',
    steps: [{ t: 'visit', cat: 'restaurant', n: 2, txt: 'Visiter 2 restaurants', short: 'Restaurants' },
      { t: 'item', ing: 'sucre', n: 2, src: 'boulangerie', txt: 'Rapporter 2 douceurs sucrées', short: 'Douceurs' }],
    reward: { coins: 100, item: ['Bonnet de cuisinier', 'v', 'tete', 2, 'bonnet', '#fff6e2'] } },
  { id: 't_kyoto', who: 'tanuki', wish: 'se promener dans les ruelles de Kyoto', quote: 'Je rêve des petites lanternes de Kyoto, le soir, quand les ruelles sentent le thé et les gâteaux de riz.',
    steps: [{ t: 'place', name: 'Kyoto', txt: 'Voyager jusqu’à Kyoto', short: 'Kyoto' },
      { t: 'item', name: 'Haori de Kyoto', n: 1, src: 'Kyoto', txt: 'Rapporter le Haori de Kyoto', short: 'Haori' }],
    reward: { coins: 400, item: ['Lanterne de Kyoto', 'd', 'lanterne', 3, null, '#e5584f'] } },
  { id: 'pa_hamac', who: 'paresseux', wish: 'faire la sieste dans un hamac', quote: 'Je rêve d’un hamac entre deux arbres… et de ne plus bouger. Pendant très, très longtemps.',
    steps: [{ t: 'visit', cat: 'parc', n: 2, txt: 'Visiter 2 parcs', short: 'Parcs' },
      { t: 'item', ing: 'feuille', n: 2, src: 'parc', txt: 'Rapporter 2 feuilles ou fleurs', short: 'Feuilles' }],
    reward: { coins: 90, item: ['Coussin de feuilles', 'd', 'tapis', 2, null, '#8fbf6a'] } },
  { id: 'pa_ile', who: 'paresseux', wish: 'écouter la pluie sur une île tropicale', quote: 'Je rêve d’une forêt tropicale où il pleut doucement, et de fermer les yeux en écoutant chaque goutte.',
    steps: [{ t: 'visit', tag: 'ile', n: 1, txt: 'Visiter une île', short: 'Île' },
      { t: 'item', ing: 'fruit', n: 2, src: 'marche', txt: 'Rapporter 2 fruits', short: 'Fruits' }],
    reward: { coins: 200, item: ['Collier d’orchidées', 'v', 'cou', 3, 'foulard', '#e8c0e6'] } },
  { id: 'l_marche', who: 'lemur', wish: 'goûter tous les fruits du marché', quote: 'Je rêve d’un étal plein de fruits de toutes les couleurs. Je sauterai de caisse en caisse pour tout goûter !',
    steps: [{ t: 'visit', cat: 'marche', n: 2, txt: 'Visiter 2 marchés', short: 'Marchés' },
      { t: 'item', ing: 'fruit', n: 2, src: 'marche', txt: 'Rapporter 2 fruits', short: 'Fruits' }],
    reward: { coins: 100, item: ['Bandeau rayé', 'v', 'tete', 2, 'bonnet', '#f4f1ea'] } },
  { id: 'l_baobabs', who: 'lemur', wish: 'grimper en haut d’un baobab', quote: 'Les baobabs touchent le ciel. Je rêve de grimper tout en haut et de regarder le soleil se coucher sur Madagascar.',
    steps: [{ t: 'place', name: 'Allée des baobabs', txt: 'Voyager jusqu’à l’Allée des baobabs', short: 'Baobabs' },
      { t: 'item', ing: 'graine', n: 1, src: 'Allée des baobabs', txt: 'Rapporter une graine', short: 'Graine' }],
    reward: { coins: 400, item: ['Cape de la savane', 'v', 'dos', 3, 'cape', '#e3a94a'] } },
  { id: 'ph_plage', who: 'phoque', wish: 'faire la planche à la plage', quote: 'Je rêve de flotter sur le dos, le ventre au soleil, pendant que les vagues me bercent. Plouf.',
    steps: [{ t: 'visit', cat: 'plage', n: 2, txt: 'Visiter 2 plages', short: 'Plages' },
      { t: 'item', ing: 'coquillage', n: 2, src: 'plage', txt: 'Rapporter 2 coquillages', short: 'Coquillages' }],
    reward: { coins: 90, item: ['Bouée à rayures', 'v', 'cou', 2, 'foulard', '#e5584f'] } },
  { id: 'ph_islande', who: 'phoque', wish: 'nager dans les eaux d’Islande', quote: 'Je rêve d’une eau glacée et transparente, avec des geysers qui fument au loin. Brrr… et miam, du poisson !',
    steps: [{ t: 'place', name: 'Reykjavik', txt: 'Voyager jusqu’à Reykjavik', short: 'Reykjavik' },
      { t: 'item', ing: 'mer', n: 2, src: 'mer', txt: 'Rapporter 2 produits de la mer', short: 'La mer' }],
    reward: { coins: 380, item: ['Pull islandais douillet', 'v', 'haut', 3, 'pull', '#e9e2d0'] } },
  { id: 'q_piquenique', who: 'quokka', wish: 'faire un pique-nique au soleil', quote: 'Je rêve d’une nappe à carreaux dans l’herbe, de pommes croquantes… et de sourire à tout le monde.',
    steps: [{ t: 'visit', cat: ['parc', 'jardin'], n: 2, txt: 'Visiter 2 parcs ou jardins', short: 'Parcs' },
      { t: 'item', ing: 'pomme', n: 2, src: 'marche', txt: 'Rapporter 2 pommes', short: 'Pommes' }],
    reward: { coins: 90, item: ['Panier de pique-nique', 'v', 'dos', 2, 'sac', '#c99a5a'] } },
  { id: 'q_sydney', who: 'quokka', wish: 'voir l’océan depuis Sydney', quote: 'Mes cousins vivent tout près de Sydney. Je rêve de leur rendre visite et de faire des selfies avec tout le monde !',
    steps: [{ t: 'place', name: 'Sydney', txt: 'Voyager jusqu’à Sydney', short: 'Sydney' },
      { t: 'item', name: 'Chapeau de surf', n: 1, src: 'Sydney', txt: 'Rapporter le Chapeau de surf', short: 'Chapeau' }],
    reward: { coins: 400, item: ['Planche de surf miniature', 'd', 'statue', 3, null, '#58c2b0'] } },
];
const TAG_POIS = { mer: ['plage', 'port', 'phare'], lac: ['etang', 'riviere'], montagne: ['sentier', 'belvedere'], foret: ['foret', 'parc', 'camping'], campagne: ['campagne', 'ferme', 'jardin'], ile: ['plage'] };
const DREAM_SUBS = { farine: 'Farine', glace: 'Glace' }; // sous-types utilisés en plus des ingrédients de l'atelier
const DREAM_BUILD_NAMES = { boulangerie: 'la boulangerie', potager: 'le potager', phare: 'le phare', fontaine: 'la fontaine', atelier_couture: 'l’atelier de couture', salon_the: 'le salon de thé', kiosque: 'le kiosque à musique', observatoire: 'l’observatoire', serre: 'la serre', port: 'le petit port', bibliotheque: 'la bibliothèque', glacier: 'le glacier' };
const DREAM_THANKS = {
  pistache: ['Merci, merci, merci ! C’était encore mieux que dans mes rêves !', 'Je n’arrive pas à y croire… Tu es la meilleure !'],
  mochi: ['… Merci. Je me sens tellement bien, là.', 'C’était parfait. Je crois que je vais faire une petite sieste de bonheur.'],
  bulle: ['Bloup bloup ! Tu es la meilleure personne du monde !', 'Je fais des bulles de joie ! Regarde, regarde !'],
};
const DREAM_TINT = { pistache: '#ffe3cf', mochi: '#efe4cf', bulle: '#ffe1ec' };
// v13 : les rêves sont attachés à l'ESPÈCE. dreamKey(k) : 'pistache' pour tout panda roux, 'mochi' pour un capybara, 'bulle' pour un axolotl,
// sinon l'id de l'espèce (renard, fennec…). Chaque individu suit sa propre progression (S.dreams[id]).
const DREAM_SP = { panda: 'pistache', capy: 'mochi', axo: 'bulle' };
const dreamKey = k => { const sp = typeof spOf === 'function' ? spOf(k) : k; return DREAM_SP[sp] || sp; };
const dreamTint = k => DREAM_TINT[dreamKey(k)] || (typeof spTint === 'function' ? spTint(k) : '#fff3dc');
const dreamThanks = k => DREAM_THANKS[dreamKey(k)] || ['Merci ! C’était encore plus beau que dans mes rêves !', 'Mon cœur fait des bonds… Merci, merci !'];
const dreamComps = () => typeof teamIds === 'function' ? teamIds() : Object.keys(S.comps || {});
const dreamsOf = k => DREAMS.filter(d => d.who === dreamKey(k));
const dreamById = id => DREAMS.find(d => d.id === id);
const lcfirst = s => s.charAt(0).toLowerCase() + s.slice(1);
const ucfirst = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- état (anciennes sauvegardes comprises) ----------
function ensureDreams() {
  if (!S.dreams || typeof S.dreams !== 'object') S.dreams = {};
  for (const k of Object.keys(S.comps || {})) {
    const D = S.dreams[k] = Object.assign({ cur: null, done: [], prog: {}, at: {} }, S.dreams[k] || {});
    if (!Array.isArray(D.done)) D.done = [];
    if (!D.prog || typeof D.prog !== 'object') D.prog = {};
    if (!D.at || typeof D.at !== 'object') D.at = {};
    const cur = dreamById(D.cur);
    if (!cur || cur.who !== dreamKey(k) || D.done.includes(D.cur)) {
      const nx = dreamsOf(k).find(d => !D.done.includes(d.id));
      if ((nx ? nx.id : null) !== D.cur) D.prog = {};
      D.cur = nx ? nx.id : null;
    }
  }
  return S.dreams;
}
ensureDreams();
const curDream = k => { ensureDreams(); return S.dreams[k] ? dreamById(S.dreams[k].cur) || null : null; };
const nextDreamAfter = d => { const l = dreamsOf(d.who), i = l.indexOf(d); return l[i + 1] || null; };
const stepGoal = st => st.n || 1;
const stepProg = (k, i) => { const d = curDream(k), st = d && d.steps[i]; return st ? Math.min(stepGoal(st), S.dreams[k].prog[i] || 0) : 0; };
const stepDone = (k, i) => { const d = curDream(k); return !!d && stepProg(k, i) >= stepGoal(d.steps[i]); };
const dreamReady = k => { const d = curDream(k); return !!d && d.steps.every((_, i) => stepDone(k, i)); };
const nextStepIdx = k => { const d = curDream(k); return d ? d.steps.findIndex((_, i) => !stepDone(k, i)) : -1; };
function dreamUnlocks() { ensureDreams(); const out = []; for (const k of Object.keys(S.dreams)) for (const id of (S.dreams[k].done || [])) { const d = dreamById(id); if (d && d.reward.build) out.push(d.reward.build); } return out; }
// pour le village : quel rêve débloque ce bâtiment ? (lu par villageLockText)
function dreamForBuilding(id) {
  const d = DREAMS.find(x => x.reward.build === id); if (!d) return null;
  // le nom d'un compagnon de la bonne espèce s'il y en a un, sinon le nom de l'espèce (« un panda roux »)
  const own = Object.keys(S.comps || {}).find(k => dreamKey(k) === d.who);
  const sp = typeof spOf === 'function' ? spOf(d.who) : d.who;
  return { who: own || null, whoName: own ? CHARS[own].name : (typeof spArticle === 'function' ? spArticle(sp) : d.who), title: ucfirst(d.wish) };
}
function dreamBuildName(id) {
  try { if (typeof VILLAGE_BUILDINGS !== 'undefined' && Array.isArray(VILLAGE_BUILDINGS)) { const b = VILLAGE_BUILDINGS.find(x => x.id === id); if (b) return b.name; } } catch (e) {}
  return ucfirst(DREAM_BUILD_NAMES[id] || id);
}

// ---------- correspondances objet / lieu ----------
function itemMatches(st, it) {
  if (!it || st.t !== 'item') return false;
  if (st.name) return it.name === st.name || it.name === st.name + ' (chef-d’œuvre)';
  if (st.ing) return ING[st.ing] && ING[st.ing][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n');
  if (st.sub) return it.sub === st.sub;
  return false;
}
function destMatches(st, dest) {
  if (!dest) return false;
  const tags = dest.tags || [];
  if (st.t === 'place') return dest.name === st.name;
  if (st.t !== 'visit') return false;
  const cats = st.cat ? [].concat(st.cat) : [];
  if (cats.length && (cats.includes(dest.cat) || (!dest.cat && cats.some(c => tags.includes(c))))) return true;
  if (!st.tag) return false;
  // un lieu du quotidien ne compte pour un paysage que s'il en est vraiment un (une poissonnerie en ville n'est pas « la mer »)
  if (dest.cat) return (TAG_POIS[st.tag] || []).includes(dest.cat);
  return tags.includes(st.tag);
}

// ---------- progression ----------
function dreamAdvance(k, fn) {
  const d = curDream(k); if (!d) return [];
  const D = S.dreams[k], gains = [];
  d.steps.forEach((st, i) => {
    const before = stepProg(k, i), goal = stepGoal(st);
    if (before >= goal) return;
    const add = fn(st, i); if (!add) return;
    D.prog[i] = Math.min(goal, before + add);
    gains.push({ k, d, st, i, now: D.prog[i], goal });
  });
  return gains;
}
// le sous-onglet Rêves (onglet Compagnons) est-il affiché ? (ancien onglet 'reves' accepté aussi)
const revesShown = () => tab === 'reves' || (tab === 'compagnons' && typeof compView !== 'undefined' && compView === 'reves');
let _dreamFlash = null; // étape tout juste réussie (petite animation sur la carte de rêve)
GAME.on('trip:return', ({ who, trip, dest, items }) => {
  if (!who || !S.dreams) return;
  const gains = dreamAdvance(who, st => {
    if (st.t === 'visit' || st.t === 'place') return destMatches(st, dest) ? 1 : 0;
    if (st.t === 'km') return trip && trip.dist >= st.km ? 1 : 0;
    if (st.t === 'item') return (items || []).filter(it => itemMatches(st, it)).length;
    return 0;
  });
  if (!gains.length) return;
  save(); _dreamFlash = { k: who, idx: gains.map(g => g.i), t: Date.now() };
  renderGoal(); if (revesShown()) renderPanel();
  announceGains(gains);
});
GAME.on('craft', ({ id }) => {
  if (!S.dreams) return;
  const all = [];
  for (const k of dreamComps()) all.push(...dreamAdvance(k, st => st.t === 'craft' && st.id === id ? 1 : 0));
  if (!all.length) return;
  save(); _dreamFlash = { k: all[0].k, idx: all.map(g => g.i), t: Date.now() };
  renderGoal(); if (revesShown()) renderPanel();
  const g = all[0], name = CHARS[g.k].name;
  setTimeout(() => toast(dreamReady(g.k) ? `Toutes les étapes du rêve de ${name} sont faites ! Réalisez-le depuis la carte.` : `Rêve de ${name} : « ${g.st.txt} », c’est fait !`), 900);
});
function announceGains(gains) {
  const k = gains[0].k, name = CHARS[k].name, ready = dreamReady(k);
  const lines = gains.map(g => `<li class="${g.now >= g.goal ? 'ok' : ''}">${stepIcon(g.st)}<span>${esc(g.st.txt)}</span><b>${g.now >= g.goal ? DREAM_CHECK : `${g.now}/${g.goal}`}</b></li>`).join('');
  const html = `<div class="dgain"><div class="dgh"><img src="${portraitURI(k, 'amour')}" alt=""><b>Le rêve de ${name} avance !</b></div><ul>${lines}</ul>${ready ? `<p class="dgready">Toutes les étapes sont faites : réalisez le rêve depuis la carte !</p>` : ''}</div>`;
  const m = $('modal'), btn = m && !m.hidden ? m.querySelector('.mbox > button:last-child') : null;
  if (btn) btn.insertAdjacentHTML('beforebegin', html);
  else toast(ready ? `Toutes les étapes du rêve de ${name} sont faites !` : `Rêve de ${name} : ${gains.map(g => `${g.st.short} ${Math.min(g.now, g.goal)}/${g.goal}`).join(', ')}`);
}

// ---------- icônes ----------
const DREAM_CHECK = '<svg class="dck" viewBox="0 0 20 20" aria-label="fait"><circle cx="10" cy="10" r="9" fill="#5fbf7f" stroke="#3a8f5a" stroke-width="1.6"/><path d="M5.6 10.4 L8.6 13.2 L14.4 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DREAM_ICON = '<path d="M7 20 C2 20 2 13 7 13 C7 7 15 6 17 11 C22 9 27 13 24 18 C27 21 23 25 20 23 C17 26 10 25 7 20Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 21 C10 17 11 13.5 13 13.5 C14 13.5 15 14.5 15 15.5 C15 14.5 16 13.5 17 13.5 C19 13.5 20 17 15 21Z" fill="#f08aa6" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="26" r="2" fill="#fff3e2" stroke="currentColor" stroke-width="1.5"/>';
const DREAM_GLYPH = {
  pin: '<path d="M12 22 C6 15 5 12 5 9.5 a7 7 0 0 1 14 0 C19 12 18 15 12 22Z" fill="#fff"/><circle cx="12" cy="9.5" r="2.6" fill="#000" fill-opacity=".25"/>',
  plane: '<path d="M3 13 L21 5 L16 20 L12 14Z" fill="#fff"/><path d="M12 14 L21 5" stroke="#000" stroke-opacity=".25" stroke-width="1.4"/>',
  hammer: '<path d="M10 11 L19 20" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><path d="M3 8 L9 2 L15 7 L12 10 L9 8 L7 10Z" fill="#fff"/>',
};
function sampleItem(st) {
  const all = [].concat(...Object.values(LOOT), ...PLACES.map(p => p.special ? [p.special] : []));
  const def = all.find(d => st.name ? d[0] === st.name : st.ing ? ING[st.ing][0].includes(d[2]) && (d[1] === 'm' || d[1] === 'n') : d[2] === st.sub);
  return def ? { name: def[0], cat: def[1], sub: def[2], rarity: def[3], look: def[4] || null, color: def[5] || null } : { name: '', cat: 'm', sub: 'pierre', rarity: 0 };
}
function stepIcon(st) {
  try {
    if (st.t === 'visit') {
      const c = st.cat ? POI_CATS[[].concat(st.cat)[0]] : null;
      if (c) return `<span class="dic" style="--pc:${c[1]}"><svg viewBox="0 0 24 24">${POI_GLYPH[c[2]]}</svg></span>`;
      const ti = typeof TAG_ICON === 'object' && TAG_ICON[st.tag];
      return `<span class="dic" style="--pc:${TAGC[st.tag] || '#8a7464'}"><svg viewBox="0 0 24 24">${ti || DREAM_GLYPH.pin}</svg></span>`;
    }
    if (st.t === 'place') { const p = PLACES.find(x => x.name === st.name); return `<span class="dic" style="--pc:${p ? TAGC[p.tags[0]] || '#d9604f' : '#d9604f'}"><svg viewBox="0 0 24 24">${DREAM_GLYPH.pin}</svg></span>`; }
    if (st.t === 'km') return `<span class="dic" style="--pc:#5aa3a8"><svg viewBox="0 0 24 24">${DREAM_GLYPH.plane}</svg></span>`;
    if (st.t === 'craft') { const r = RECIPES.find(x => x.id === st.id); return `<span class="dic dit">${r ? itemIcon({ name: r.out[0], cat: r.out[1], sub: r.out[2], rarity: r.out[3], look: r.out[4], color: r.out[5] }) : ''}<i class="dham"><svg viewBox="0 0 24 24">${DREAM_GLYPH.hammer}</svg></i></span>`; }
    if (st.t === 'item') return `<span class="dic dit">${itemIcon(sampleItem(st))}</span>`;
  } catch (e) {}
  return '<span class="dic"></span>';
}

// ---------- « Partir » : trouver la bonne destination ----------
const dreamPoiZoom = () => Math.pow(2, (typeof mapMode !== 'undefined' && mapMode === 'tiles' ? 16 : 14.6) - 1.5);
function shownPOIs() { const out = []; try { for (const o of Object.values(ovEls)) if (o && o.poi && o.poi.cat) out.push(o.poi); } catch (e) {} return out; }
function genPOIsNear(h, test) {
  // carte intégrée : on génère les lieux du quartier autour de la maison, anneau par anneau
  if (typeof genCell !== 'function' || typeof mapMode === 'undefined' || mapMode !== 'local') return [];
  const gx0 = Math.floor(h.lon / CELL), gy0 = Math.floor(h.lat / CELL), m = 0.35;
  let towns = [];
  try {
    towns = geoLayersCities().filter(c => Math.abs(c.lon - h.lon) < m + 0.12 && Math.abs(c.lat - h.lat) < m + 0.12);
    towns.push(...gridVillages({ getWest: () => h.lon - m, getEast: () => h.lon + m, getSouth: () => h.lat - m, getNorth: () => h.lat + m }));
  } catch (e) { return []; }
  const found = [];
  for (let r = 0; r <= 12; r++) {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      try { for (const p of genCell(gx0 + dx, gy0 + dy, towns).pois) if (p.cat && test(p)) found.push(p); } catch (e) {}
    }
    if (found.length) break;
  }
  return found;
}
function nearestPOI(test, allowGen = true) {
  const h = homeObj(); let best = null, bd = 1e9;
  const look = arr => arr.forEach(p => { const d = kmBetween(h, p); if (d < bd) { bd = d; best = p; } });
  look(shownPOIs().filter(test));
  if ((!best || bd > 3) && allowGen) look(genPOIsNear(h, test));
  return best && bd <= 40 ? best : null;
}
function poiTest(st) {
  const cats = st.cat ? [].concat(st.cat) : null;
  return p => cats ? cats.includes(p.cat) : (TAG_POIS[st.tag] || []).includes(p.cat);
}
function nearestPlaceWith(test, minKm = 0) {
  const h = homeObj();
  return PLACES.filter(p => p.name !== S.home && test(p)).map(p => ({ p, d: kmBetween(h, p) })).filter(x => x.d >= minKm).sort((a, b) => a.d - b.d).map(x => x.p)[0] || null;
}
function goDreamPlace(p, why) {
  if (!p) return false;
  if (typeof choosePlace === 'function') choosePlace(p); else { plan.dest = p; openSheet('voyage'); }
  if (typeof zoomTo === 'function') zoomTo(p.lon, p.lat, Math.max(zoomT.k, 3));
  if (why) setTimeout(() => toast(why), 250);
  return true;
}
function goDreamPOI(p, why) {
  if (!p) return false;
  if (typeof choosePOI === 'function') choosePOI(p); else { plan.dest = poiDest(p); openSheet('voyage'); }
  if (typeof zoomTo === 'function') zoomTo(p.lon, p.lat, Math.max(zoomT.k, dreamPoiZoom()));
  const km = kmBetween(homeObj(), p);
  setTimeout(() => toast(why || `${p.name} : c’est le plus proche (${fmtDist(km)}). Choisissez la durée, puis partez !`), 250);
  return true;
}
function searchAroundHome(test, label) {
  // vraie carte : les lieux n'existent qu'une fois affichés, on zoome sur le quartier puis on cherche
  const h = homeObj();
  if (typeof zoomTo === 'function') zoomTo(h.lon, h.lat, dreamPoiZoom());
  toast(`On cherche ${label} près de chez vous…`);
  let tries = 0;
  const retry = () => {
    const p = nearestPOI(test, false);
    if (p) return goDreamPOI(p);
    if (++tries < 6) return setTimeout(retry, 700);
    toast(`Touchez ${label} sur la carte (son icône ronde) pour y envoyer ${CHARS[S.sel].name}.`);
  };
  setTimeout(retry, 1200);
}
function srcStep(st) {
  // étape « rapporter » : où aller ? (catégorie de lieu, tag de paysage ou lieu célèbre)
  const s = st.src;
  if (!s) return null;
  if (POI_CATS[s]) return { t: 'visit', cat: s };
  if (PLACES.some(p => p.name === s)) return { t: 'place', name: s };
  return { t: 'visit', tag: s };
}
const catLabel = c => { const l = POI_CATS[c] ? POI_CATS[c][0].toLowerCase() : c; return (/^[aeiouéèêh]/.test(l) ? 'un ' : ['boulangerie', 'piscine', 'librairie', 'bibliotheque', 'epicerie', 'poissonnerie', 'pharmacie', 'ferme', 'boutique', 'laverie', 'gare', 'chocolaterie', 'mairie', 'fromagerie', 'boucherie', 'route', 'rue', 'plage', 'friperie', 'ecole'].includes(c) ? 'une ' : 'un ') + l; };
function goDreamStep(st) {
  const k = S.sel;
  if (st.t === 'craft') {
    const r = RECIPES.find(x => x.id === st.id);
    if (r) { craftFilter = r.kind; const miss = r.ing.filter(([key, n]) => ingCount(key) < n).map(([key, n]) => `${n - ingCount(key)} × ${ING[key][1].toLowerCase()}`); if (miss.length) setTimeout(() => toast(`Pour « ${r.out[0]} », il manque : ${miss.join(', ')}.`), 300); }
    openSheet('atelier');
    setTimeout(() => { const b = document.querySelector(`#panelBody [data-craft="${st.id}"]`); if (b && b.scrollIntoView) b.closest('.rec').scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 80);
    return;
  }
  if (st.t === 'item') { const s = srcStep(st); if (s) return goDreamStep(s); openSheet('voyage'); return; }
  if (st.t === 'place') { const p = PLACES.find(x => x.name === st.name); if (goDreamPlace(p, `Cap sur ${p.name} ! Choisissez la durée du voyage, puis partez.`)) return; }
  if (st.t === 'km') {
    const p = nearestPlaceWith(() => true, st.km);
    if (goDreamPlace(p, `${p ? p.name : ''} est à plus de ${st.km.toLocaleString('fr-FR')} km : parfait pour ce rêve !`)) return;
  }
  if (st.t === 'visit') {
    const test = poiTest(st), cats = st.cat ? [].concat(st.cat) : [];
    const poi = (cats.length || st.tag) ? nearestPOI(test) : null;
    if (poi) return void goDreamPOI(poi);
    if (st.tag) { const p = nearestPlaceWith(x => x.tags.includes(st.tag)); if (goDreamPlace(p, `${p.name} est le lieu ${TAGQ[st.tag] || ''} le plus proche. Choisissez la durée, puis partez !`)) return; }
    if (cats.length) return void searchAroundHome(test, catLabel(cats[0]));
  }
  openSheet('voyage');
  void k;
}
function dreamGo(k) {
  if (k && S.sel !== k) selectComp(k);
  k = S.sel;
  const t = S.trips[k];
  if (t) { if (t.done) collect(); else openSheet('voyage'); return; }
  const d = curDream(k); if (!d) { openSheet('reves'); return; }
  if (dreamReady(k)) return claimDream(k);
  if (tab !== 'carte') { tab = 'carte'; renderPanel(); }
  goDreamStep(d.steps[nextStepIdx(k)]);
}

// ---------- réaliser le rêve ----------
function claimDream(k) {
  const d = curDream(k); if (!d || !dreamReady(k)) return;
  const D = S.dreams[k], r = d.reward, p = S.prog[k];
  gainCoins(r.coins);
  const it = makeItem(r.item, 0, `Rêve de ${CHARS[k].name}`, [], { fixed: r.item[3], special: true });
  { const nm = CHARS[k].name; it.name = it.name.replace(/ (?:de |d’)(?:Pistache|Mochi|Bulle)$/, ` ${/^[aeiouyéèêh]/i.test(nm) ? 'd’' : 'de '}${nm}`); } // « Bonnet marin de Bulle » devient « … de Perle »
  S.inv.push(it); S.dex[it.name] = true;
  // un niveau de plus, offert par le rêve
  p.lvl++; p.xp = Math.min(p.xp, needXP(p.lvl) - 1);
  const talent = talentsOf(k).find(x => x[0] === p.lvl);
  D.done.push(d.id); D.at[d.id] = Date.now(); D.prog = {};
  const nx = nextDreamAfter(d); D.cur = nx ? nx.id : null;
  S.stats.dreams = (S.stats.dreams || 0) + 1;
  save();
  GAME.emit('dream:done', { who: k, dream: d });
  renderAll();
  const card = typeof haulCard === 'function' ? haulCard(it, 0, false) : itemChip(it);
  const hearts = Array.from({ length: 9 }, (_, i) => `<i style="--x:${(i * 11 + 4) % 96}%;--d:${(i * 0.37).toFixed(2)}s;--s:${0.7 + (i % 3) * 0.25}"></i>`).join('');
  showModal(`<div class="dcel"><div class="dcel-sky" aria-hidden="true">${hearts}</div><div class="dcel-art">${drawChar(k, S.outfits[k], 'amour', 'dcel')}</div>
    <span class="dcel-k">Rêve réalisé !</span><h2>${CHARS[k].name} a pu ${esc(d.wish)}</h2><p class="dcel-q">« ${esc(pick(dreamThanks(k)))} »</p>
    <div class="dcel-rw"><span class="dcel-chip gold">${COIN}<b>+${r.coins}</b> pièces</span><span class="dcel-chip lvl"><b>Niveau ${p.lvl}</b>${talent ? ` · talent ${esc(talent[1])}` : ''}</span>${r.build ? `<span class="dcel-chip bld"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M5 25 V13 L15 5 L25 13 V25Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="12" y="16" width="6" height="9" fill="#d9604f" stroke="currentColor" stroke-width="1.6"/></svg>Nouveau au village : <b>${esc(dreamBuildName(r.build))}</b></span>` : ''}</div>
    <div class="haul one">${card}</div>
    ${nx ? `<p class="dcel-next">Nouveau rêve : <b>${CHARS[k].name} rêve de ${esc(nx.wish)}</b></p>` : `<p class="dcel-next"><b>Tous les rêves de ${CHARS[k].name} sont réalisés !</b></p>`}
    <button class="btn green big wide" data-closemodal="1">Merveilleux !</button></div>`);
  if (typeof confetti === 'function') setTimeout(() => confetti(true), 350);
  if (typeof checkAch === 'function') setTimeout(() => { try { checkAch(); } catch (e) {} }, 50);
}

// ---------- carte de rêve (écran principal, à la place du bandeau d'objectif) ----------
function stepChips(k, d, cls = '') {
  const nxt = nextStepIdx(k), fl = _dreamFlash && _dreamFlash.k === k && Date.now() - _dreamFlash.t < 4000 ? _dreamFlash.idx : [];
  return `<ol class="dsteps ${cls}">` + d.steps.map((st, i) => {
    const pr = stepProg(k, i), g = stepGoal(st), done = pr >= g;
    return `<li class="${done ? 'done' : i === nxt ? 'next' : ''}${fl.includes(i) ? ' flash' : ''}" title="${esc(st.txt)}">${stepIcon(st)}<span class="dst">${esc(cls ? st.txt : st.short)}</span><span class="dsn">${done ? DREAM_CHECK : g > 1 ? `${pr}/${g}` : '<i class="dbox"></i>'}</span></li>`;
  }).join('') + '</ol>';
}
function goLabel(k) {
  const t = S.trips[k];
  if (t) return t.done ? ['green', 'Ouvrir', 'le sac'] : ['cream', 'En route', 'Journal'];
  const d = curDream(k);
  if (!d) return ['cream', 'Bravo', 'Voir'];
  if (dreamReady(k)) return ['gold', 'Réaliser', 'le rêve !'];
  const st = d.steps[nextStepIdx(k)], s = st.t === 'item' ? srcStep(st) || st : st;
  if (st.t === 'craft') return ['pink', 'Fabriquer', 'Atelier'];
  let where = '';
  if (s.t === 'place') where = s.name;
  else if (s.t === 'km') where = `${st.km.toLocaleString('fr-FR')} km`;
  else if (s.cat) where = POI_CATS[[].concat(s.cat)[0]][0];
  else if (s.tag) where = TAGL[s.tag] || s.tag;
  return ['green', 'Partir', where];
}
function renderDreamCard(box) {
  ensureDreams();
  const k = S.sel, ch = CHARS[k], d = curDream(k), list = dreamsOf(k), D = S.dreams[k];
  box.className = 'goal dream' + (d && dreamReady(k) ? ' ready' : '');
  box.title = '';
  box.style.setProperty('--tint', dreamTint(k));
  const [col, l1, l2] = goLabel(k);
  if (!d) {
    box.innerHTML = `<div class="dtop"><button class="dface" data-dream-open="1" aria-label="Voir les rêves"><img src="${portraitURI(k, 'amour')}" alt=""></button><div class="dbub" data-dream-open="1"><span class="dk">Tous les rêves de ${ch.name} sont réalisés</span><b>${ch.name} est comblé${typeof compE === 'function' ? compE(k) : 'e'} de bonheur !</b></div><button class="btn cream dgo" data-dream-open="1"><b>Voir</b><small>Souvenirs</small></button></div>`;
    return;
  }
  const n = list.indexOf(d) + 1;
  box.innerHTML = `<div class="dtop"><button class="dface" data-dream-open="1" aria-label="Voir tous les rêves"><img src="${portraitURI(k, dreamReady(k) ? 'amour' : 'content')}" alt=""><i class="dheart"></i></button>
    <div class="dbub" data-dream-open="1" title="${esc(d.quote)}"><span class="dk">${ch.name} rêve de… <em>${n}/${list.length}</em></span><b>${esc(ucfirst(d.wish))}</b></div>
    <button class="btn ${col} dgo${!(S.stats && S.stats.started) && !S.trips[k] ? ' dhint' : ''}" data-dream-go="${k}"><b>${l1}</b>${l2 ? `<small>${esc(l2)}</small>` : ''}</button></div>
    ${stepChips(k, d)}`;
  void D;
}

// ---------- onglet « Rêves » ----------
function dreamCompHTML(k) {
  const ch = CHARS[k], d = curDream(k), list = dreamsOf(k), D = S.dreams[k], p = S.prog[k];
  const doneN = D.done.length, nx = d ? nextDreamAfter(d) : null;
  let h = `<article class="rvc ${S.sel === k ? 'sel' : ''} ${d && dreamReady(k) ? 'ready' : ''}" style="--tint:${dreamTint(k)}"><header><img src="${portraitURI(k, d && dreamReady(k) ? 'amour' : 'content')}" alt=""><div><b>${ch.name}</b><span>Niveau ${p.lvl} · ${doneN}/${list.length} rêves réalisés</span><span class="rvbar"><i style="width:${(doneN / list.length * 100).toFixed(0)}%"></i></span></div></header>`;
  if (!d) return h + `<p class="rvq">Tous les rêves de ${ch.name} sont réalisés. Merci pour tout !</p></article>`;
  const [col, l1, l2] = goLabel(k);
  h += `<div class="rvbub"><span class="dk">Rêve ${list.indexOf(d) + 1} · ${ch.name} rêve de…</span><b>${esc(ucfirst(d.wish))}</b><p>« ${esc(d.quote)} »</p></div>`;
  h += stepChips(k, d, 'full');
  h += `<div class="rvfoot"><span class="rvrw">${coins(d.reward.coins)}<span>+ 1 niveau</span>${d.reward.build ? `<span class="bld">+ ${esc(dreamBuildName(d.reward.build))}</span>` : ''}</span><button class="btn ${col} sm" data-dream-go="${k}">${l1} ${l2 && col !== 'gold' ? `· ${esc(l2)}` : l2 ? esc(l2) : ''}</button></div>`;
  if (nx) h += `<div class="rvnext" aria-label="Prochain rêve, encore secret"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="#f2c14e" stroke="currentColor" stroke-width="1.8"/><path d="M8 10 V7.5 a4 4 0 0 1 8 0 V10" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span>Ensuite :</span><b class="blur">${esc(ucfirst(nx.wish))}</b></div>`;
  return h + '</article>';
}
function renderReves(box) {
  ensureDreams();
  const ks = dreamComps().filter(k => S.dreams[k]), total = ks.reduce((a, k) => a + dreamsOf(k).length, 0), done = ks.reduce((a, k) => a + S.dreams[k].done.length, 0);
  let html = `<div class="rvhead"><div class="rvhi"><svg viewBox="0 0 30 30" aria-hidden="true">${DREAM_ICON}</svg></div><div><h2>Les rêves de l’équipe</h2><p>Réalisez les rêves de vos compagnons : chacun leur fait gagner un niveau, et certains font grandir le village.</p></div><span class="rvtot"><b>${done}</b>/${total}</span></div>`;
  html += `<div class="rvcomps">${[S.sel, ...ks.filter(k => k !== S.sel)].map(dreamCompHTML).join('')}</div>`;
  // souvenirs
  const mem = [];
  for (const k of Object.keys(S.dreams).filter(k => CHARS[k])) for (const id of S.dreams[k].done) { const d = dreamById(id); if (d) mem.push({ k, d, at: S.dreams[k].at[id] || 0 }); }
  mem.sort((a, b) => b.at - a.at);
  html += `<h3 class="rvh">Rêves réalisés</h3>`;
  html += mem.length ? `<div class="rvmem">${mem.map(m => `<div class="rvm" style="--tint:${dreamTint(m.k)}"><img src="${portraitURI(m.k, 'amour')}" alt=""><b>${esc(ucfirst(m.d.wish))}</b><span>${CHARS[m.k].name}${m.at ? ' · ' + new Date(m.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>${m.d.reward.build ? `<i>${esc(dreamBuildName(m.d.reward.build))}</i>` : ''}</div>`).join('')}</div>` : `<p class="rvempty">Aucun rêve réalisé pour l’instant. Le premier ne prend que quelques minutes : touchez « Partir » !</p>`;
  html += `<h3 class="rvh">Quêtes du jour et succès</h3><div class="rvquests" id="rvQuests"></div>`;
  html += `<h3 class="rvh">Le Grand Carnet</h3><div id="rvCarnet">${typeof carnetHTML === 'function' ? carnetHTML() : ''}</div>`;
  box.innerHTML = html;
  const q = box.querySelector('#rvQuests');
  if (q && typeof renderQuests === 'function') { try { if (questView === 'col') questView = 'jour'; renderQuests(q); const ph = q.querySelector('.phead'); if (ph) ph.remove(); const cb = q.querySelector('[data-qv="col"]'); if (cb) cb.remove(); /* les collections vivent dans Sac & Album */ } catch (e) { console.error(e); } }
}
// onglet « Rêves » en attendant la navigation à 4 onglets (ne s'applique que si 10_ui ne le gère pas déjà)
if (typeof renderRevesTab !== 'function') { // 10_ui.js gère déjà l'onglet (renderRevesTab -> renderReves) : pas de double prise en charge
  renderPanel = (orig => function () {
    if (tab !== 'reves') return orig.apply(this, arguments);
    renderNav(); renderTripCard(); renderGoal();
    const sheet = $('sheet'); sheet.hidden = false; document.body.classList.add('sheet-open');
    $('sheetTitle').textContent = 'Les rêves'; $('sheetIcon').innerHTML = DREAM_ICON; sheet.dataset.kind = 'reves';
    renderReves($('panelBody'));
  })(renderPanel);
}

// ---------- atelier : les recettes demandées par un rêve en cours sont signalées ----------
function dreamCraftWants() { const out = {}; for (const k of dreamComps()) { const d = curDream(k); if (d) d.steps.forEach((st, i) => { if (st.t === 'craft' && !stepDone(k, i)) (out[st.id] = out[st.id] || []).push(k); }); } return out; }
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const want = dreamCraftWants();
    for (const [id, ks] of Object.entries(want)) {
      const b = box.querySelector(`[data-craft="${id}"]`), rec = b && b.closest('.rec'), t = rec && rec.querySelector('.rx b');
      if (t) { rec.classList.add('dwant'); t.insertAdjacentHTML('afterend', `<span class="dwant-t">Rêve de ${ks.map(k => CHARS[k].name).join(' et ')}</span>`); }
    }
  } catch (e) { console.error(e); }
  return r;
})(renderAtelier);

// ---------- « Sert à… » ----------
GAME.addUses(it => {
  if (!it || !S.dreams) return [];
  const out = [];
  for (const k of dreamComps()) {
    const D = S.dreams[k]; if (!D) continue;
    for (const d of dreamsOf(k).filter(x => !D.done.includes(x.id))) {
      const isCur = d.id === D.cur;
      let txt = null;
      d.steps.forEach((st, i) => {
        if (txt || (isCur && stepDone(k, i))) return;
        if (itemMatches(st, it)) txt = lcfirst(st.txt);
        else if (st.t === 'craft') { const r = RECIPES.find(x => x.id === st.id); if (r && (it.cat === 'm' || it.cat === 'n') && r.ing.some(([key]) => ING[key][0].includes(it.sub))) txt = `ingrédient de « ${r.out[0]} »`; }
      });
      if (txt) { out.push({ txt: `Rêve de ${CHARS[k].name}${isCur ? '' : ' (à venir)'} : ${txt}`, kind: 'reve' }); break; }
    }
  }
  return out;
});

// ---------- clics ----------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-dream-go],[data-dream-open]'); if (!el || el.disabled) return;
  if (el.dataset.dreamGo) return dreamGo(el.dataset.dreamGo);
  if (el.dataset.dreamOpen) openSheet('reves');
});

// ---------- styles ----------
(function injectRevesCSS() {
  const st = document.createElement('style'); st.id = 'revesCSS';
  st.textContent = `
#goal.goal.dream{display:block;padding:8px 9px 8px;width:min(560px,calc(100% - 440px));min-width:340px;border-radius:20px;background:linear-gradient(180deg,#fffdf6,var(--paper) 60%)}
#goal.dream .gstep{display:none}
body.sheet-open #goal.goal.dream{display:none} /* comme l'ancien bandeau : le panneau ouvert ne doit pas recouvrir la carte de rêve */
@media (min-width:1500px){body.sheet-open #goal.goal.dream{display:block;left:calc((100% - 470px) / 2);width:min(520px,calc(100% - 900px));min-width:340px}}
#goal.dream.ready{background:linear-gradient(180deg,#fffbe6,#fff3c4);animation:glow 1.2s ease-in-out infinite alternate}
.dtop{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px}
.dface{position:relative;width:50px;height:50px;padding:0;border-radius:50%;border:2.5px solid var(--ink);background:var(--tint);cursor:pointer;flex:none}
.dface img{width:100%;height:100%;border-radius:50%;display:block}
.dheart{position:absolute;right:-5px;bottom:-3px;width:20px;height:20px;background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath d='M15 26 C4 18 3 12 6 8 C9 4 14 6 15 10 C16 6 21 4 24 8 C27 12 26 18 15 26Z' fill='%23f08aa6' stroke='%234a3528' stroke-width='2.6' stroke-linejoin='round'/%3E%3C/svg%3E");animation:dbeat 1.6s ease-in-out infinite}
@keyframes dbeat{0%,100%{transform:scale(1)}12%{transform:scale(1.22)}24%{transform:scale(1)}}
.dbub{position:relative;min-width:0;background:#fff;border:2px solid var(--ink);border-radius:16px;padding:4px 10px 5px;cursor:pointer;box-shadow:0 2px 0 rgba(74,53,40,.18)}
.dbub::before{content:"";position:absolute;left:-9px;top:50%;width:7px;height:7px;border-radius:50%;background:#fff;border:2px solid var(--ink);transform:translateY(-2px)}
.dbub::after{content:"";position:absolute;left:-15px;top:50%;width:4px;height:4px;border-radius:50%;background:#fff;border:1.6px solid var(--ink);transform:translateY(6px)}
.dk{display:flex;align-items:center;gap:6px;font:700 11px var(--display);color:var(--rust);letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.dk em{font-style:normal;color:var(--muted);background:var(--paper2);border-radius:999px;padding:0 6px;letter-spacing:0}
.dbub b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font:700 15.5px/1.15 var(--display);color:var(--ink)}
.dgo{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;min-width:92px;max-width:120px;padding:6px 10px 7px;line-height:1.05}
.dgo b{font:800 18px/1 var(--display)}
.dgo.dhint{animation:dhint 1.1s ease-in-out infinite alternate} /* tout premier lancement : c'est ici qu'on commence */
@keyframes dhint{to{box-shadow:0 4px 0 var(--ink),0 0 0 6px rgba(95,191,127,.45)}}
@media (prefers-reduced-motion:reduce){.dgo.dhint{animation:none;box-shadow:0 4px 0 var(--ink),0 0 0 5px rgba(95,191,127,.45)}}
.dgo small{font:700 11.5px/1.1 var(--display);opacity:.92;max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.dsteps{list-style:none;margin:7px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:5px}
.dsteps li{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 8px 0 3px;border-radius:999px;background:#fff;border:2px solid var(--line);font:700 12.5px var(--display);color:var(--ink2);white-space:nowrap}
.dsteps li.next{border-color:var(--ink);background:#fff3c4;color:var(--ink);box-shadow:0 2px 0 rgba(74,53,40,.25)}
.dsteps li.done{background:#e6f6e9;border-color:#9fd3ae;color:var(--greenD)}
.dsteps li.done .dst{text-decoration:line-through;text-decoration-color:rgba(58,143,90,.5)}
.dsteps li.flash{animation:dflash 1.1s ease-out 2}
@keyframes dflash{0%{transform:scale(1)}30%{transform:scale(1.12);box-shadow:0 0 0 4px rgba(246,196,69,.6)}100%{transform:scale(1)}}
.dsn{font-variant-numeric:tabular-nums;color:var(--ink);display:inline-flex;align-items:center}
.dck{width:17px;height:17px;display:block}
.dbox{display:inline-block;width:13px;height:13px;border:2px solid var(--ink2);border-radius:4px;background:#fff}
.dic{position:relative;width:21px;height:21px;flex:none;border-radius:50%;background:var(--pc,#efe2c4);border:1.6px solid var(--ink);display:inline-flex;align-items:center;justify-content:center}
.dic svg{width:14px;height:14px}
.dic.dit{background:#fffaf0}.dic.dit svg{width:17px;height:17px}
.dic .dham{position:absolute;right:-5px;bottom:-4px;width:12px;height:12px;border-radius:50%;background:var(--pink);border:1.4px solid var(--ink);display:flex}
.dic .dham svg{width:9px;height:9px;margin:auto}
@media (max-width:900px){
 #goal.goal.dream{width:auto;min-width:0;padding:6px 7px 7px}
 .dface{width:42px;height:42px}.dheart{width:17px;height:17px}
 .dbub{padding:3px 8px 4px}.dbub b{font-size:14.5px}
 .dgo{min-width:78px;padding:5px 8px 6px}.dgo b{font-size:16.5px}.dgo small{font-size:11px;max-width:84px}
 .dsteps{gap:4px;margin-top:6px}.dsteps li{height:26px;font-size:12px;padding:0 7px 0 2px}
}
@media (max-width:360px){.dk em{display:none}.dsteps li .dst{max-width:76px;overflow:hidden;text-overflow:ellipsis}}
/* gains au retour de voyage */
.dgain{width:100%;background:#fff;border:2px solid var(--ink);border-radius:16px;padding:8px 10px;text-align:left;animation:sheetIn .45s cubic-bezier(.2,1.4,.4,1) .3s both}
.dgh{display:flex;align-items:center;gap:8px;font:700 15px var(--display)}
.dgh img{width:34px;height:34px;border-radius:50%;background:#fff3dc;border:2px solid var(--ink)}
.dgain ul{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}
.dgain li{display:flex;align-items:center;gap:7px;font:600 13.5px var(--body)}
.dgain li span:not(.dic){flex:1}
.dgain li b{font:800 13.5px var(--display);display:inline-flex}
.dgain li.ok{color:var(--greenD)}
.dgready{margin:6px 0 0;padding:5px 8px;border-radius:10px;background:#fff3c4;font:700 13.5px var(--display);color:var(--ink)}
/* célébration */
.dcel{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.dcel-sky{position:absolute;inset:-10px -12px 40% -12px;pointer-events:none;overflow:hidden}
.dcel-sky i{position:absolute;left:var(--x);bottom:-20px;width:18px;height:18px;transform:scale(var(--s));background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath d='M15 26 C4 18 3 12 6 8 C9 4 14 6 15 10 C16 6 21 4 24 8 C27 12 26 18 15 26Z' fill='%23f08aa6' stroke='%234a3528' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E");animation:dfloat 3.4s ease-in var(--d) infinite;opacity:0}
.dcel-sky i:nth-child(3n){background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath d='M15 3 L18.5 11 L27 11.8 L20.5 17.4 L22.6 26 L15 21.4 L7.4 26 L9.5 17.4 L3 11.8 L11.5 11Z' fill='%23f6c445' stroke='%234a3528' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E")}
@keyframes dfloat{0%{opacity:0;translate:0 0}15%{opacity:1}100%{opacity:0;translate:10px -260px}}
.dcel-art{position:relative;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle at 50% 45%,#fff 0 40%,var(--tint,#ffe3cf) 41% 100%);border:3px solid var(--ink);box-shadow:0 0 0 8px #fff3c4,0 0 0 11px var(--ink);display:flex;align-items:center;justify-content:center;overflow:hidden;margin-top:6px;animation:dpop .6s cubic-bezier(.2,1.6,.4,1) both}
.dcel-art svg{width:150px;height:auto;margin-top:16px}
@keyframes dpop{0%{transform:scale(.4) rotate(-8deg);opacity:0}100%{transform:none;opacity:1}}
.dcel-k{margin-top:10px;font:800 13px var(--display);letter-spacing:.12em;text-transform:uppercase;color:#fff;background:var(--pink);border:2.5px solid var(--ink);border-radius:999px;padding:3px 14px;box-shadow:0 3px 0 var(--ink)}
.dcel h2{margin:2px 0 0;font:800 22px/1.15 var(--display)}
.dcel-q{margin:0;font:600 15px var(--body);color:var(--ink2);font-style:italic}
.dcel-rw{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.dcel-chip{display:inline-flex;align-items:center;gap:5px;border:2px solid var(--ink);border-radius:999px;padding:3px 10px;font:700 13.5px var(--display);background:#fff}
.dcel-chip .coin{width:18px;height:18px}
.dcel-chip.gold{background:#fff3c4}.dcel-chip.lvl{background:#e6f6e9}.dcel-chip.bld{background:#fde3ea}
.dcel-chip svg{width:20px;height:20px;color:var(--ink)}
.dcel-next{margin:0;font-size:14px;color:var(--ink2)}
.dcel .haul.one{margin:0}
/* onglet Rêves */
.rvhead{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.rvhead h2{margin:0;font:800 20px var(--display)}.rvhead p{margin:2px 0 0;font-size:13.5px;color:var(--ink2)}
.rvhi{width:46px;height:46px;flex:none;border-radius:14px;background:#fde3ea;border:2.5px solid var(--ink);display:flex;align-items:center;justify-content:center;color:var(--ink)}.rvhi svg{width:32px;height:32px}
.rvtot{margin-left:auto;flex:none;font:700 14px var(--display);color:var(--ink2);background:#fff;border:2px solid var(--ink);border-radius:999px;padding:2px 10px}.rvtot b{font-size:17px;color:var(--ink)}
.rvcomps{display:flex;flex-direction:column;gap:10px}
.rvc{background:#fff;border:2.5px solid var(--ink);border-radius:18px;padding:10px;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.rvc.sel{background:linear-gradient(180deg,var(--tint),#fff 70px)}
.rvc.ready{box-shadow:0 0 0 3px var(--gold),0 3px 0 rgba(74,53,40,.3)}
.rvc header{display:flex;align-items:center;gap:10px}
.rvc header img,.rvc header .livep{width:48px;height:48px;flex:none;border-radius:50%;border:2.5px solid var(--ink);background:var(--tint);overflow:hidden}
.rvc header div{flex:1;display:flex;flex-direction:column;gap:2px}
.rvc header b{font:800 17px var(--display)}.rvc header span{font-size:12.5px;color:var(--ink2)}
.rvbar{display:block;height:7px;border-radius:999px;background:#f1e4c8;border:1.5px solid var(--ink);overflow:hidden}.rvbar i{display:block;height:100%;background:var(--pink)}
.rvbub{margin-top:8px;background:var(--paper);border:2px solid var(--line);border-radius:14px;padding:7px 10px}
.rvbub b{display:block;font:800 17px/1.2 var(--display)}
.rvbub p,.rvq{margin:4px 0 0;font-size:13.5px;color:var(--ink2);font-style:italic}
.dsteps.full{flex-direction:column;gap:4px}
.dsteps.full li{height:auto;min-height:32px;border-radius:12px;padding:3px 8px 3px 4px;white-space:normal;font-size:13.5px}
.dsteps.full li .dst{flex:1}
.dsteps.full .dic{width:24px;height:24px}
.rvfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap}
.rvrw{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font:700 12.5px var(--display);color:var(--ink2)}
.rvrw .bld{color:var(--pinkD)}
.rvnext{display:flex;align-items:center;gap:6px;margin-top:8px;padding:6px 8px;border:2px dashed var(--line);border-radius:12px;font:700 12.5px var(--display);color:var(--muted)}
.rvnext svg{width:18px;height:18px;flex:none;color:var(--ink2)}
.rvnext .blur{filter:blur(4.5px);user-select:none;color:var(--ink)}
.rvh{margin:16px 0 8px;font:800 16px var(--display);display:flex;align-items:center;gap:8px}
.rvh::after{content:"";flex:1;height:2px;background:var(--line);border-radius:2px}
.rvmem{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}
.rvm{position:relative;background:var(--tint);border:2px solid var(--ink);border-radius:14px;padding:8px 8px 9px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;transform:rotate(-1deg)}
.rvm:nth-child(2n){transform:rotate(1.2deg)}
.rvm img,.rvm .livep{width:40px;height:40px;flex:none;border-radius:50%;background:#fff;border:2px solid var(--ink);overflow:hidden}
.rvm b{font:700 13px/1.15 var(--display)}.rvm span{font-size:11.5px;color:var(--ink2)}
.rvm i{font:700 10.5px var(--display);font-style:normal;color:#fff;background:var(--pinkD);border-radius:999px;padding:1px 7px}
.rvempty{margin:0;padding:10px;border:2px dashed var(--line);border-radius:12px;font-size:13.5px;color:var(--ink2)}
.rvquests .filters{margin-top:0}
.rec.dwant{box-shadow:0 0 0 3px #b9a6ef,0 3px 0 rgba(74,53,40,.3)}
.dwant-t{display:inline-block;align-self:flex-start;margin:1px 0 2px;font:700 11.5px var(--display);color:#6d4fc0;background:#ece4fd;border-radius:999px;padding:1px 8px}
`;
  document.head.appendChild(st);
})();
window.__reves = { api: () => ({ S, plan, GAME, makeItem, LOOT, POI_CATS, PLACES, ING, RECIPES, showHaul: typeof showHaul === 'function' ? showHaul : null, closeSheet, openSheet, selectComp }), DREAMS, curDream, dreamReady, claimDream, dreamGo, dreamUnlocks, renderReves, ensureDreams, nearestPOI, goDreamStep };

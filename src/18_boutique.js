// ================= LA BOUTIQUE : le cœur du jeu =================
// Clients animaux et commandes (Comptoir), réputation et niveaux, magasin du jour (Magasin), vente aux passants (Marché).
// Boucle : voyager -> récolter -> fabriquer -> livrer -> pièces et réputation -> acheter, construire, grandir.
// Exposé : renderBoutique(box), openBoutique(sub), shopBadge(), shopReady().
// État : S.shop = { rep, lvl, orders: [], served, stock: { day, items }, clients: {}, next, recipes: [], seq }.
// Bus : émet 'order:done' { order, client } et 'rep:level' { level }.

// ---------------- les clients ----------------
// sp : espèce (dessin), likes : clés d'ingrédients (ING) préférées, cats : lieux du quotidien, tags : paysages,
// rich : générosité, lvl : niveau de boutique à partir duquel il vient, acc : accessoire dessiné
const BQ_CLIENTS = [
  { id: 'noisette', name: 'Noisette', sp: 'herisson', label: 'la hérissonne', pers: 'Gourmande', cloth: '#f3aec1', acc: 'noeud', accC: '#e5687f', likes: ['sucre', 'fruit', 'pain'], cats: ['boulangerie', 'chocolaterie', 'marche'], tags: ['foret'], rich: 1, lvl: 0,
    lines: ['Pour l’anniversaire de ma grand-mère, il me faut quelque chose de très spécial…', 'J’ai promis un goûter à toute ma classe de piano !', 'Mes piquants frissonnent rien que d’y penser…'] },
  { id: 'ondine', name: 'Capitaine Ondine', sp: 'loutre', label: 'la loutre', pers: 'Aventurière', cloth: '#3e5f8a', acc: 'capitaine', accC: '#fbf8f0', likes: ['mer', 'coquillage', 'sable'], cats: ['poissonnerie', 'port', 'plage'], tags: ['mer', 'lac'], rich: 1.1, lvl: 0,
    lines: ['Mon bateau repart demain à l’aube : je dois charger la cale !', 'Un marin ne part jamais sans provisions. Jamais !', 'J’ai parié avec un phoque que je trouverais ça chez vous.'] },
  { id: 'roussette', name: 'Roussette', sp: 'renard', label: 'la renarde', pers: 'Coquette', cloth: '#7a4fa0', acc: 'perles', accC: '#fbf8f0', likes: ['tissu', 'fleur'], cats: ['mode', 'friperie', 'fleuriste'], tags: ['ville'], rich: 1.15, lvl: 0,
    lines: ['Le bal du printemps approche et je n’ai RIEN à me mettre.', 'Il me faut de quoi assortir mon nouveau foulard, vous comprenez.', 'On m’a dit que votre boutique avait du goût. Prouvez-le-moi !'] },
  { id: 'pompon', name: 'Pompon', sp: 'lapin', label: 'le lapin', pers: 'Jardinier', cloth: '#7fae4f', acc: 'chapeau', accC: '#e9c46a', likes: ['legume', 'graine', 'fleur'], cats: ['jardin', 'marche', 'fleuriste'], tags: ['campagne'], rich: 1, lvl: 0,
    lines: ['Mon potager fait la tête cette année. Il faut le consoler.', 'Je prépare un concours de la plus belle carotte… chut !', 'Ma voisine la tortue m’a demandé ça. Elle est un peu lente pour venir.'] },
  { id: 'hulotte', name: 'Madame Hulotte', sp: 'chouette', label: 'la chouette', pers: 'Savante', cloth: '#5f7ab8', acc: 'lunettes', accC: '#c9a35a', likes: ['papier', 'lumiere'], cats: ['librairie', 'bibliotheque', 'musee'], tags: ['monument'], rich: 1.2, lvl: 1,
    lines: ['J’écris une encyclopédie des choses jolies. Il me manque un chapitre.', 'Hou hou ! Mes élèves de l’école du soir en ont besoin.', 'La science n’attend pas… enfin, si, un peu. Prenez votre temps.'] },
  { id: 'bruno', name: 'Bruno', sp: 'ours', label: 'l’ours', pers: 'Gros dormeur', cloth: '#c94a4a', acc: 'echarpe', accC: '#f6d36b', likes: ['sucre', 'fruit', 'fromage'], cats: ['epicerie', 'ferme', 'parc'], tags: ['foret', 'montagne'], rich: 1.05, lvl: 0,
    lines: ['L’hiver arrive, il me faut des réserves pour hiberner tranquille.', 'J’ai rêvé de ça trois nuits de suite. C’est un signe.', 'Pas pressé… mais un peu quand même, mon ventre gargouille.'] },
  { id: 'mimi', name: 'Mimi', sp: 'souris', label: 'la souris', pers: 'Timide', cloth: '#f6c2cf', acc: 'fleur', accC: '#f6d36b', likes: ['fromage', 'graine'], cats: ['fromagerie', 'epicerie', 'boulangerie'], tags: ['campagne'], rich: 0.95, lvl: 0,
    lines: ['Euh… bonjour… si ce n’est pas trop demander…', 'C’est pour la fête de famille. On est quarante-trois.', 'Je… je reviendrai si ce n’est pas possible. Merci !'] },
  { id: 'filou', name: 'Filou', sp: 'raton', label: 'le raton laveur', pers: 'Collectionneur', cloth: '#5c6b94', acc: 'casquette', accC: '#e9a03a', likes: ['metal', 'verre', 'papier'], cats: ['puces', 'bricolage', 'rue'], tags: ['ville'], rich: 1.1, lvl: 0,
    lines: ['Il me manque une seule pièce pour compléter ma collection !', 'Je ne vole rien, moi, j’achète. Comme tout le monde.', 'Ça brille ? Alors ça m’intéresse.'] },
  { id: 'chips', name: 'Chips', sp: 'ecureuil', label: 'l’écureuil', pers: 'Énergique', cloth: '#f2c14e', acc: 'none', likes: ['fruit', 'graine', 'bois'], cats: ['parc', 'foret', 'marche'], tags: ['foret'], rich: 1, lvl: 0,
    lines: ['Vite vite vite ! Enfin… quand vous pouvez ! Mais vite !', 'J’ai oublié où j’ai caché mes réserves. Encore.', 'C’est pour construire la plus grande cabane de la forêt !'] },
  { id: 'gaston', name: 'Gaston', sp: 'blaireau', label: 'le blaireau', pers: 'Bricoleur', cloth: '#b07a4f', acc: 'none', likes: ['bois', 'metal', 'pierre'], cats: ['bricolage', 'route', 'puces'], tags: ['montagne'], rich: 1.05, lvl: 1,
    lines: ['Je refais le toit de mon terrier. Avec une véranda !', 'Un bon bricoleur a toujours le bon matériau sous la patte.', 'Ma pelle s’est cassée. Rien de grave, mais il me faut du solide.'] },
  { id: 'capucine', name: 'Capucine', sp: 'canard', label: 'la cane', pers: 'Bavarde', cloth: '#58c2b0', acc: 'noeud', accC: '#f39ab0', likes: ['pain', 'legume', 'boisson'], cats: ['boulangerie', 'etang', 'cafe'], tags: ['lac'], rich: 1, lvl: 0,
    lines: ['Vous savez quoi ? Ma cousine se marie ! Il faut tout préparer !', 'Coin ! Pardon. Je voulais dire : bonjour !', 'On fait un pique-nique au bord de l’étang, vous êtes invités !'] },
  { id: 'rainette', name: 'Rainette', sp: 'grenouille', label: 'la grenouille', pers: 'Rêveuse', cloth: '#f2e6a0', acc: 'fleur', accC: '#f39ab0', likes: ['fleur', 'feuille'], cats: ['etang', 'riviere', 'jardin'], tags: ['lac'], rich: 1, lvl: 1,
    lines: ['Je décore mon nénuphar pour la nuit des lucioles.', 'J’ai fait un vœu sous la pluie… et c’est ça que j’ai demandé.', 'Croâ… c’est joli, non ? Dites que c’est joli.'] },
  { id: 'moustache', name: 'Monsieur Moustache', sp: 'chat', label: 'le chat', pers: 'Élégant', cloth: '#3b3f5a', acc: 'monocle', accC: '#e3b94a', likes: ['boisson', 'tissu', 'sucre'], cats: ['cafe', 'mode', 'chocolaterie'], tags: ['ville'], rich: 1.3, lvl: 1,
    lines: ['Je reçois la comtesse à cinq heures. Tout doit être parfait.', 'Je n’accepte que le meilleur. Ronron.', 'Mes moustaches ne mentent jamais : vous avez ce qu’il faut.'] },
  { id: 'biscotte', name: 'Biscotte', sp: 'chien', label: 'le chien', pers: 'Joyeux', cloth: '#e5584f', acc: 'echarpe', accC: '#bfe1f2', likes: ['plat', 'pain', 'fromage'], cats: ['boucherie', 'boulangerie', 'parc'], tags: ['campagne'], rich: 1, lvl: 0,
    lines: ['Ouaf ! C’est pour la fête du quartier, tout le monde vient !', 'J’ai été très sage cette semaine. Très très sage.', 'Ma queue remue toute seule rien que d’y penser !'] },
  { id: 'frisette', name: 'Frisette', sp: 'mouton', label: 'la brebis', pers: 'Douce', cloth: '#9cc3e8', acc: 'fleur', accC: '#f6c2cf', likes: ['laine', 'tissu', 'fleur'], cats: ['ferme', 'friperie', 'coiffeur'], tags: ['montagne', 'campagne'], rich: 1, lvl: 0,
    lines: ['Je tricote une couverture pour tous les agneaux du pré.', 'Bêêê… pardon, c’est l’émotion.', 'Pour mon salon de thé, il me faut une touche de douceur.'] },
  { id: 'clochette', name: 'Clochette', sp: 'faon', label: 'la faonne', pers: 'Poétique', cloth: '#a6cf8e', acc: 'fleur', accC: '#fff8f0', likes: ['fleur', 'feuille', 'fruit'], cats: ['parc', 'foret', 'fleuriste'], tags: ['foret', 'montagne'], rich: 1.1, lvl: 2,
    lines: ['J’écris un poème sur le monde entier. Il me manque une rime.', 'La forêt m’a soufflé votre nom ce matin.', 'Chaque objet raconte un voyage. Racontez-moi celui-ci.'] },
  { id: 'eucalypso', name: 'Eucalypso', sp: 'koala', label: 'le koala', pers: 'Grand voyageur', cloth: '#e9a03a', acc: 'chapeau', accC: '#c9a97a', likes: ['feuille', 'boisson', 'bois'], cats: ['cafe', 'jardin'], tags: ['ile', 'desert'], rich: 1.35, lvl: 2,
    lines: ['J’ai fait le tour du monde trois fois. Il me manque un souvenir.', 'Chez moi, en Australie, personne ne me croira !', 'Je collectionne les trésors de chaque région. Vous m’aidez ?'] },
  { id: 'pingo', name: 'Pingo', sp: 'pingouin', label: 'le manchot', pers: 'Explorateur polaire', cloth: '#d9604f', acc: 'echarpe', accC: '#f6d36b', likes: ['cristal', 'flocon', 'mer'], cats: ['poissonnerie', 'glacier', 'port'], tags: ['neige', 'mer'], rich: 1.4, lvl: 3,
    lines: ['Mon expédition part pour le pôle. Il me faut le meilleur équipement.', 'Brrr… non, je plaisante, je n’ai jamais froid.', 'Le grand nord m’attend. Mais pas sans ça !'] },
  { id: 'grignote', name: 'Grignote', sp: 'hamster', label: 'le hamster', pers: 'Économe', cloth: '#f6d36b', acc: 'casquette', accC: '#58c2b0', likes: ['graine', 'sucre', 'fruit'], cats: ['marche', 'jardin', 'boulangerie'], tags: ['campagne'], rich: 0.9, lvl: 0,
    lines: ['Je fais des provisions. On n’a jamais trop de provisions !', 'Mes joues sont pleines, mais mon garde-manger est vide.', 'Un bon prix, hein ? Je compte chaque pièce.'] },
  { id: 'leonie', name: 'Grand-mère Léonie', sp: 'tortue', label: 'la tortue', pers: 'Sage centenaire', cloth: '#c9a3d9', acc: 'perles', accC: '#fbf8f0', likes: ['fleur', 'cristal', 'papier'], cats: ['fleuriste', 'librairie', 'puces'], tags: ['ile', 'monument'], rich: 1.5, lvl: 4,
    lines: ['En cent vingt ans, je n’ai jamais vu de merveille pareille. Trouvez-m’en une.', 'Prenez votre temps, mon petit. Moi, j’ai tout le mien.', 'C’est pour mes arrière-arrière-petits-enfants.'] },
];
const BQC = id => BQ_CLIENTS.find(c => c.id === id);
const BQ_SPN = { herisson: 'hérisson', loutre: 'loutre', renard: 'renard', lapin: 'lapin', chouette: 'chouette', ours: 'ours', souris: 'souris', raton: 'raton laveur', ecureuil: 'écureuil', blaireau: 'blaireau', canard: 'cane', grenouille: 'grenouille', chat: 'chat', chien: 'chien', mouton: 'brebis', faon: 'faon', koala: 'koala', pingouin: 'manchot', hamster: 'hamster', tortue: 'tortue' };
const bqWho = c => `${c.name} ${c.label}`;

// ---------------- niveaux de réputation ----------------
// chaque niveau débloque du concret : commandes simultanées, clients plus riches, rayons du magasin, décor, titre
const BQ_LEVELS = [
  { name: 'Échoppe', rep: 0, slots: 3, rich: 1, stock: 6, title: 'Petite échoppe de quartier', reach: 'Des clients du quartier' },
  { name: 'Boutique', rep: 50, slots: 3, rich: 1.15, stock: 7, title: 'Adresse que l’on recommande', reach: 'Des clients de toute la région', perks: ['+15 % de pièces par commande', 'Rayon décoration et recettes au magasin', 'Auvent rayé et enseigne peinte', 'Clients de toute la région'] },
  { name: 'Maison réputée', rep: 160, slots: 4, rich: 1.3, stock: 8, title: 'Maison qui compte en France', reach: 'Des clients de toute la France', perks: ['4 commandes à la fois', '+30 % de pièces par commande', 'Nouveaux vêtements et matériaux', 'Plantes et seconde étagère', 'Clients de toute la France'] },
  { name: 'Grand comptoir', rep: 360, slots: 4, rich: 1.5, stock: 9, title: 'Renommée dans toute l’Europe', reach: 'Des clients de toute l’Europe', perks: ['+50 % de pièces par commande', 'Articles rares au magasin', 'Lanternes et tapis dans la boutique', 'Clients de toute l’Europe'] },
  { name: 'Comptoir du monde', rep: 700, slots: 4, rich: 1.75, stock: 10, title: 'Célèbre aux quatre coins du monde', reach: 'Des clients du monde entier', perks: ['+75 % de pièces par commande', 'Commandes de Merveilles et de souvenirs', 'Guirlande et mappemonde géante', 'Clients du monde entier'] },
  { name: 'Légende du voyage', rep: 1200, slots: 4, rich: 2, stock: 10, title: 'Légende des voyageurs', reach: 'Les clients les plus exigeants', perks: ['Pièces doublées par commande', 'Articles légendaires au magasin', 'Enseigne dorée qui scintille'] },
];
const bqLv = i => BQ_LEVELS[Math.max(0, Math.min(BQ_LEVELS.length - 1, i))];

// ---------------- les commerces (v13, phase B) ----------------
// Le joueur choisit son premier commerce au premier lancement ; d'autres s'ouvrent avec la réputation.
// keys : ingrédients (ING) demandés · cats : lieux du quotidien où chercher · itemCats : types d'objets demandés
// crafts : recettes demandées (ids ou fonction) · bsubs / bcats / bkinds : ce qui touche la spécialité (pièces × mult)
// perks : avantages affichés · fast, slot, rep, tip, recx, cheap, eggs : effets réels
const BQ_SHOPS = [
  { id: 'boulangerie', name: 'Boulangerie-pâtisserie', short: 'Boulangerie', em: 'pain', aw: '#e3a04b', aw2: '#fff4dc', wall: '#fbe9cf', wall2: '#f4d9b0', front: '#f6e2c0', door: '#b06a3a',
    phrase: 'L’odeur du pain chaud attire tout le quartier dès l’aube.',
    stars: [['Baguette croustillante', 'n', 'pain', 0, null, '#e3b06b'], ['Brioche dorée', 'n', 'pain', 2, null, '#e3a04b'], ['Tarte aux pommes', 'n', 'pomme', 2, null, '#e5a04b']],
    keys: ['pain', 'farine', 'sucre', 'fruit', 'pomme'], cats: ['boulangerie', 'chocolaterie', 'marche', 'ferme'], itemCats: ['n', 'm'],
    crafts: ['painmaison', 'tarte', 'confiture', 'bs_brioche', 'bs_tarte_citron', 'croque', 'sandrando', 'bonhommechoc'],
    bsubs: ['pain', 'farine', 'sucre', 'pomme'], mult: 1.35, cheap: { subs: ['farine', 'sucre'], f: 0.75 },
    perks: ['Commandes de pain et de gâteaux : +35 % de pièces', 'Farine et sucre 25 % moins chers au magasin'],
    lines: ['Ça sent bon jusque dans la rue ! Vous avez ce qu’il me faut ?', 'C’est pour un goûter d’anniversaire : il faut que ça sente bon le beurre !', 'Votre pain est le meilleur du quartier, tout le monde le dit.'] },
  { id: 'cafe', name: 'Café-salon de thé', short: 'Salon de thé', em: 'tasse', aw: '#8a5a3a', aw2: '#f6e7d2', wall: '#f3e6d6', wall2: '#e8d3bb', front: '#e9d6bf', door: '#6b4a32',
    phrase: 'Des fauteuils moelleux, du thé fumant et des petits gâteaux.',
    stars: [['Chocolat chaud à la chantilly', 'n', 'boisson', 2, null, '#8a5a3a'], ['Macaron de Paris', 'n', 'sucre', 1, null, '#f39ab0'], ['Thé au jasmin', 'n', 'boisson', 1, null, '#c9d48a']],
    keys: ['boisson', 'sucre', 'agrume', 'fruit'], cats: ['cafe', 'chocolaterie', 'epicerie', 'marche'], itemCats: ['n'],
    crafts: ['chantilly', 'salade', 'bonhommechoc', 'confiture', 'tarte'],
    bsubs: ['boisson', 'sucre'], mult: 1.3, fast: 0.7,
    perks: ['Boissons et douceurs : +30 % de pièces', 'Les clients arrivent plus souvent (30 % d’attente en moins)'],
    lines: ['Une petite pause douceur, voilà ce qu’il me faut.', 'Je reçois mes amies cet après-midi : il me faut de quoi faire un goûter chic.', 'Votre salon est si douillet… je pourrais y rester des heures.'] },
  { id: 'restaurant', name: 'Restaurant', short: 'Restaurant', em: 'cloche', aw: '#d9604f', aw2: '#fff4ea', wall: '#f8e4d8', wall2: '#f0cfbd', front: '#f3dccb', door: '#8a3a2f',
    phrase: 'Une petite table chaleureuse où chaque plat raconte un voyage.',
    stars: [['Fondue des copains', 'n', 'fromage', 3, null, '#f2c14e'], ['Soupe du potager', 'n', 'legume', 2, null, '#8fbf5a'], ['Croque-monsieur doré', 'n', 'pain', 2, null, '#e3b06b']],
    keys: ['plat', 'legume', 'fromage', 'pain', 'mer'], cats: ['restaurant', 'boucherie', 'fromagerie', 'marche', 'poissonnerie'], itemCats: ['n'],
    crafts: ['soupe', 'soupepotager', 'fondue', 'plateau', 'croque', 'sandrando'], anyFood: 1,
    bsubs: ['plat', 'legume', 'fromage', 'mer'], mult: 1.35, slot: 1,
    perks: ['Plats cuisinés, fromages et légumes : +35 % de pièces', 'Une commande de plus à la fois au comptoir'],
    lines: ['On est quatre à table ce soir, et tout le monde a faim !', 'J’ai une faim de loup… enfin, de blaireau.', 'Le chef peut-il me préparer quelque chose de réconfortant ?'] },
  { id: 'fleuriste', name: 'Fleuriste', short: 'Fleuriste', em: 'fleur', aw: '#e07a9a', aw2: '#fff0f4', wall: '#fbe8ee', wall2: '#f4d2dc', front: '#e9f2df', door: '#5f9a6a',
    phrase: 'Des bouquets de toutes les couleurs, cueillis aux quatre coins du monde.',
    stars: [['Bouquet du voyageur', 'd', 'plante', 2, null, '#f39ab0'], ['Vase de fleurs fraîches', 'd', 'plante', 2, null, '#f39ab0'], ['Couronne du jardin', 'v', 'tete', 3, 'fleurs', '#f6c2cf']],
    keys: ['fleur', 'feuille', 'graine'], cats: ['fleuriste', 'jardin', 'parc', 'marche'], itemCats: ['m', 'd'],
    crafts: ['bs_bouquet', 'vasefleurs', 'couronnejardin', 'herbjardin', 'plante', 'herbier'],
    bsubs: ['fleur', 'feuille', 'graine', 'plante'], mult: 1.3, rep: 1.3,
    perks: ['Fleurs et bouquets : +30 % de pièces', '+30 % de réputation à chaque commande'],
    lines: ['Un bouquet pour dire pardon… c’est une longue histoire.', 'Ma grand-mère adore les fleurs des pays lointains.', 'Il me faut de quoi fleurir tout mon balcon !'] },
  { id: 'mode', name: 'Boutique de mode', short: 'Mode', em: 'cintre', aw: '#9a6fd6', aw2: '#f8f0ff', wall: '#f1e8fb', wall2: '#e2d4f4', front: '#f6eefb', door: '#5c4a8a',
    phrase: 'Des tenues sur mesure pour compagnons élégants.',
    stars: [['Pull douillet', 'v', 'haut', 2, 'pull', '#f1e3c8'], ['Cape cousue main', 'v', 'dos', 2, 'cape', '#c9604f'], ['Bonnet tricoté', 'v', 'tete', 2, 'bonnet', '#e9a03a']],
    keys: ['tissu', 'laine', 'plume'], cats: ['mode', 'friperie', 'coiffeur'], itemCats: ['v'],
    crafts: r => r.kind === 'Vêtement',
    bcats: ['v'], mult: 1.4, cheap: { cats: ['v'], f: 0.8 },
    perks: ['Vêtements fabriqués : +40 % de pièces', 'Vêtements 20 % moins chers au magasin'],
    lines: ['Il me faut une tenue pour le grand bal des saisons !', 'Quelque chose de chic, mais pas trop. Vous voyez ?', 'Mon compagnon veut ressembler à une star. Aidez-moi !'] },
  { id: 'animalerie', name: 'Animalerie', short: 'Animalerie', em: 'patte', aw: '#3faf9a', aw2: '#effaf6', wall: '#e4f4ee', wall2: '#cfe9df', front: '#f3efe2', door: '#2f7f6c',
    phrase: 'Œufs, friandises et accessoires pour compagnons heureux.',
    stars: [{ egg: null }, ['Sachet de graines', 'm', 'graine', 0, null, '#a9784f'], ['Panier douillet', 'd', 'tapis', 1, null, '#f3aec1']],
    keys: ['graine', 'fruit', 'mer', 'legume'], cats: ['jardin', 'marche', 'poissonnerie', 'zoo'], itemCats: ['m', 'n'],
    crafts: ['tapis', 'patchwork', 'plante'], pets: 1,
    bkinds: ['egg', 'comp', 'bait'], mult: 1.3, eggs: 1,
    perks: ['Œufs plus fréquents et 20 % moins chers au magasin', 'Clients qui cherchent des œufs et des compagnons : +30 %'],
    lines: ['Mon petit a besoin de friandises, il fait la grève de la sieste.', 'On m’a dit que vous connaissiez tous les compagnons du monde !', 'Je prépare un grand panier douillet… il ne manque plus qu’un locataire.'] },
  { id: 'glacier', name: 'Glacier', short: 'Glacier', em: 'cornet', aw: '#f08aa6', aw2: '#e6f8f2', wall: '#fdeef2', wall2: '#d9f1ea', front: '#fff6f8', door: '#58b8a0',
    phrase: 'Des boules de glace aux parfums du monde entier.',
    stars: [['Coupe glacée des grands jours', 'n', 'glace', 3, null, '#f6a6b8'], ['Sorbet au citron', 'n', 'glace', 1, null, '#f2e27a'], ['Salade d’agrumes', 'n', 'agrume', 2, null, '#f2c14e']],
    keys: ['glace', 'sucre', 'fruit', 'agrume'], cats: ['glacier', 'marche', 'plage', 'chocolaterie'], itemCats: ['n'],
    crafts: ['coupeg', 'salade', 'confiture'],
    bsubs: ['glace', 'agrume'], mult: 1.35, tip: 10,
    perks: ['Glaces et agrumes : +35 % de pièces', 'Pourboire : +10 pièces à chaque commande'],
    lines: ['Vite, vite, avant que ça fonde !', 'Il fait si chaud… j’ai besoin de fraîcheur, vite !', 'C’est pour fêter la fin de l’école, toute la classe arrive !'] },
  { id: 'librairie', name: 'Librairie-papeterie', short: 'Librairie', em: 'livre', aw: '#6f64b0', aw2: '#f4f0ff', wall: '#eeeaf8', wall2: '#ddd6ef', front: '#efe7d8', door: '#4a4378',
    phrase: 'Des livres, des cartes anciennes et du papier qui sent bon.',
    stars: [['Mappemonde de voyageur', 'd', 'mappemonde', 2, null, '#c9a97a'], ['Nœud papillon en origami', 'v', 'cou', 1, 'noeud', '#f2d48f'], ['Plan de Paris ancien', 'm', 'papier', 1, null, '#efe2c4']],
    keys: ['papier', 'bois', 'feuille'], cats: ['librairie', 'bibliotheque', 'poste', 'ecole'], itemCats: ['m', 'd'],
    crafts: ['globe', 'noeudpapier', 'herbier', 'herbjardin'],
    bsubs: ['papier', 'mappemonde', 'herbier'], mult: 1.3, recx: 2,
    perks: ['Papier, cartes et herbiers : +30 % de pièces', 'Recettes offertes deux fois plus souvent'],
    lines: ['Je cherche de quoi écrire la suite de mes mémoires.', 'Une jolie carte pour mon prochain voyage, s’il vous plaît.', 'Le papier qui sent bon, c’est mon petit bonheur.'] },
  { id: 'epicerie', name: 'Épicerie du monde', short: 'Épicerie', em: 'bocal', aw: '#6f9a4f', aw2: '#f6f3dc', wall: '#eef3e0', wall2: '#dde8c6', front: '#f4ecd6', door: '#4f6f3a',
    phrase: 'Des bocaux et des spécialités rapportés de chaque région.',
    stars: [['Calisson', 'n', 'sucre', 1, null, '#f6e3c4'], ['Huile d’olive', 'n', 'fruit', 0, null, '#a8b45a'], ['Sel de Guérande', 'm', 'sable', 0, null, '#f4f1ea']],
    keys: ['fromage', 'fruit', 'sucre', 'legume'], cats: ['epicerie', 'fromagerie', 'marche'], itemCats: ['n', 'm'],
    crafts: ['plateau', 'confiture', 'salade'], reach: 1, anyFood: 1,
    bkinds: ['reg'], mult: 1.35,
    perks: ['Spécialités régionales : +35 % de pièces', 'Clients venus de plus loin, dès le début'],
    lines: ['Avez-vous ce petit goût de là-bas que je ne retrouve nulle part ?', 'Je cuisine un plat de mon enfance, il me manque l’ingrédient secret.', 'Vos étagères, c’est un tour du monde !'] },
  { id: 'brocante', name: 'Brocante des voyageurs', short: 'Brocante', em: 'lampe', aw: '#b98a4a', aw2: '#fbf1dc', wall: '#f4ead8', wall2: '#e6d4b4', front: '#e8dcc4', door: '#7a5a3a',
    phrase: 'Des trésors chinés : lampes, vases et souvenirs du monde.',
    stars: [['Lanterne de verre', 'd', 'lanterne', 2, null, '#bfe3f6'], ['Mobile de coquillages', 'd', 'bocal', 2, null, '#f6cdb8'], ['Statuette sculptée', 'd', 'statue', 3, null, '#c99a6a']],
    keys: ['metal', 'verre', 'bois', 'pierre', 'coquillage'], cats: ['puces', 'bricolage', 'rue'], itemCats: ['d', 'm'],
    crafts: r => r.kind === 'Décoration' && !r.multi, souv: 1,
    bcats: ['d'], mult: 1.35,
    perks: ['Décorations : +35 % de pièces', 'Souvenirs du monde demandés plus tôt (et bien payés)'],
    lines: ['Ça a l’air vieux… et c’est exactement ce que je cherche !', 'Pour ma collection de petites merveilles, il me manque une pièce.', 'Je décore mon nouveau terrier, il me faut du caractère.'] },
];
const BQS = id => BQ_SHOPS.find(x => x.id === id) || null;
// v19 : chaque commerce a SES habitués (des têtes différentes d'un commerce à l'autre)
const BQ_SHOP_CLIENTS = {
  boulangerie: ['noisette', 'mimi', 'capucine', 'grignote', 'biscotte', 'moustache'],
  cafe: ['frisette', 'roussette', 'chips', 'capucine', 'moustache', 'eucalypso', 'hulotte'],
  restaurant: ['bruno', 'biscotte', 'ondine', 'grignote', 'pompon', 'gaston', 'pingo'],
  fleuriste: ['pompon', 'roussette', 'frisette', 'chips', 'rainette', 'clochette', 'leonie'],
  mode: ['roussette', 'frisette', 'ondine', 'noisette', 'moustache', 'eucalypso', 'pingo'],
  animalerie: ['chips', 'biscotte', 'mimi', 'pompon', 'ondine', 'rainette', 'clochette'],
  glacier: ['noisette', 'capucine', 'grignote', 'ondine', 'chips', 'moustache', 'pingo'],
  librairie: ['filou', 'mimi', 'capucine', 'bruno', 'hulotte', 'gaston', 'leonie', 'eucalypso'],
  epicerie: ['bruno', 'mimi', 'grignote', 'capucine', 'ondine', 'eucalypso', 'moustache'],
  brocante: ['filou', 'chips', 'ondine', 'bruno', 'gaston', 'hulotte', 'leonie'],
};
// ouverture d'un nouveau commerce : niveau de boutique requis et prix
const BQ_SHOP_SLOTS = [{ lvl: 0, cost: 0 }, { lvl: 1, cost: 300 }, { lvl: 2, cost: 900 }, { lvl: 4, cost: 2500 }];
const bqType = () => { const s = S.shop; return s && s.type && BQS(s.type) ? BQS(s.type) : null; };
const bqOwned = () => ((S.shop && S.shop.owned) || []).filter(BQS);
// prochain commerce à ouvrir : { i, lvl, cost, ok } ou null s'il n'y en a plus
function bqNextSlot() { const n = bqOwned().length, sl = BQ_SHOP_SLOTS[n]; if (!n || !sl) return null; return { i: n, lvl: sl.lvl, cost: sl.cost, ok: bqState().lvl >= sl.lvl }; }
// choix en attente : ancienne sauvegarde sans spécialité, ou nouveau commerce débloqué pas encore vu
const bqChoicePending = () => { try { return !bqType() && !(S.firstRun); } catch (e) { return false; } };
function bqSlotNew() { const n = bqNextSlot(); return !!(n && n.ok && (S.shop.slotSeen || 0) < n.i + 1); }

// ---------------- recettes vendues au magasin ----------------
const BQ_RECIPES = [
  { id: 'bs_brioche', kind: 'Cuisine', out: ['Brioche dorée', 'n', 'pain', 2, null, '#e3a04b'], ing: [['farine', 2], ['sucre', 1]], coins: 0, lvl: 1, price: 60 },
  { id: 'bs_tarte_citron', kind: 'Cuisine', out: ['Tarte au citron meringuée', 'n', 'agrume', 2, null, '#f2d43b'], ing: [['agrume', 2], ['sucre', 1], ['farine', 1]], coins: 0, lvl: 1, price: 70 },
  { id: 'bs_bouquet', kind: 'Décoration', out: ['Bouquet du voyageur', 'd', 'plante', 2, null, '#f39ab0'], ing: [['fleur', 3]], coins: 5, lvl: 2, price: 90 },
  { id: 'bs_bonnet', kind: 'Vêtement', out: ['Bonnet tricoté à pompon', 'v', 'tete', 2, 'bonnet', '#e5584f'], ing: [['laine', 2], ['tissu', 1]], coins: 10, lvl: 2, price: 90 },
  { id: 'bs_lampe_coq', kind: 'Décoration', out: ['Lampe coquillage', 'd', 'lampe', 3, null, '#f6cdb8'], ing: [['coquillage', 2], ['verre', 1]], coins: 20, lvl: 3, price: 140 },
  { id: 'bs_panier', kind: 'Cuisine', out: ['Panier garni', 'n', 'plat', 3, null, '#d9a35f'], ing: [['fruit', 1], ['pain', 1], ['fromage', 1]], coins: 10, lvl: 3, price: 140 },
  { id: 'bs_cape', kind: 'Vêtement', out: ['Cape du grand voyageur', 'v', 'dos', 3, 'cape', '#2f7f6c'], ing: [['tissu', 3], ['plume', 1]], coins: 30, lvl: 4, price: 200 },
];
const BQ_RIDS = new Set(BQ_RECIPES.map(r => r.id));
BQ_RECIPES.forEach(r => { if (!RECIPES.some(x => x.id === r.id)) RECIPES.push({ id: r.id, kind: r.kind, out: r.out, ing: r.ing, coins: r.coins, shop: 1 }); });

// ---------------- catalogue du magasin ----------------
// k : 'v' vêtement, 'd' déco, 'm' matériau, 'r' recette, lvl : niveau de boutique requis
const BQ_CAT = [
  // vêtements (formes que drawChar sait dessiner)
  ['v', 0, ['Bonnet rayé de la boutique', 'v', 'tete', 0, 'bonnet', '#f08aa6']], ['v', 0, ['Écharpe pistache', 'v', 'cou', 0, 'echarpe', '#a9cf8e']], ['v', 0, ['Chaussettes à cœurs', 'v', 'pieds', 0, 'chaussettes', '#f39ab0']],
  ['v', 0, ['T-shirt du voyageur', 'v', 'haut', 0, 'tshirt', '#bfe1f2']], ['v', 0, ['Casquette de livreur', 'v', 'tete', 0, 'casquette', '#d9604f']],
  ['v', 1, ['Béret moutarde', 'v', 'tete', 1, 'beret', '#e3b04b']], ['v', 1, ['Nœud papillon à pois', 'v', 'cou', 1, 'noeud', '#5c6b94']], ['v', 1, ['Short de marin', 'v', 'bas', 1, 'short', '#3e5f8a']], ['v', 1, ['Gants fleuris', 'v', 'mains', 1, 'gants', '#9cc38a']],
  ['v', 2, ['Pull du comptoir', 'v', 'haut', 2, 'pull', '#c9734a']], ['v', 2, ['Jupe à fleurs', 'v', 'bas', 2, 'jupe', '#f6a6b8']], ['v', 2, ['Sac à dos de globe-trotteur', 'v', 'dos', 2, 'sac', '#7fae4f']], ['v', 2, ['Bottes de pluie jaunes', 'v', 'pieds', 2, 'bottes', '#f6d36b']],
  ['v', 3, ['Cape de marchand', 'v', 'dos', 3, 'cape', '#7a4fa0']], ['v', 3, ['Couronne de fleurs des champs', 'v', 'tete', 3, 'fleurs', '#f6c2cf']],
  ['v', 4, ['Sweat du Comptoir du monde', 'v', 'haut', 3, 'sweat', '#2f7f6c']], ['v', 5, ['Couronne du marchand légendaire', 'v', 'tete', 4, 'couronne', '#f2c14e']],
  // meubles et décos pour la maison
  ['d', 0, ['Plante verte', 'd', 'plante', 0, null, '#7fbf6a']], ['d', 0, ['Bocal de bonbons', 'd', 'bocal', 0, null, '#f3aec1']], ['d', 0, ['Tapis rayé', 'd', 'tapis', 0, null, '#e9a0a0']],
  ['d', 1, ['Lanterne en papier', 'd', 'lanterne', 1, null, '#f6d36b']], ['d', 1, ['Herbier de montagne', 'd', 'herbier', 1, null, '#9cc38a']],
  ['d', 2, ['Mappemonde ancienne', 'd', 'mappemonde', 2, null, '#c9a97a']], ['d', 2, ['Lampe de comptoir', 'd', 'lampe', 2, null, '#f6e08a']],
  ['d', 3, ['Poêle en faïence', 'd', 'cheminee', 3, null, '#9fd0d8']], ['d', 3, ['Chat porte-bonheur', 'd', 'statue', 3, null, '#f2c14e']],
  ['d', 4, ['Lanterne du bout du monde', 'd', 'lanterne', 3, null, '#9fe0d0']], ['d', 5, ['Fontaine de jade', 'd', 'statue', 4, null, '#7fc4a0']],
  // graines et matériaux de base
  ['m', 0, ['Sac de farine', 'm', 'farine', 0, null, '#f4efe2']], ['m', 0, ['Pelote de laine', 'm', 'laine', 0, null, '#efe6d2']], ['m', 0, ['Planche de bois', 'm', 'bois', 0, null, '#c99a6a']],
  ['m', 0, ['Sachet de graines', 'm', 'graine', 0, null, '#a9784f']], ['m', 0, ['Sucre en morceaux', 'n', 'sucre', 0, null, '#f6efe0']], ['m', 0, ['Pomme rouge', 'n', 'pomme', 0, null, '#e5584f']],
  ['m', 1, ['Bobine de fil', 'm', 'tissu', 0, null, '#e9a0a0']], ['m', 1, ['Papier kraft', 'm', 'papier', 0, null, '#d9b98a']], ['m', 1, ['Pot de miel', 'n', 'sucre', 0, null, '#f2b13e']],
  ['m', 2, ['Éclat de cristal', 'm', 'cristal', 1, null, '#bfe3f6']], ['m', 2, ['Plume d’oie', 'm', 'plume', 1, null, '#fbf8f0']], ['m', 3, ['Coquillages de brocante', 'm', 'coquillage', 1, null, '#f6cdb8']],
].map(([k, lvl, def], i) => ({ key: k + i, k, lvl, def }));
BQ_RECIPES.forEach(r => BQ_CAT.push({ key: 'r_' + r.id, k: 'r', lvl: r.lvl, rec: r.id }));
// v21 : outils (k 't', « Objets fabriqués ») et graines (ressources), clés stables (ajoutées à la fin)
[['t', 0, ['Carte de région', 'm', 'outil', 1, null, '#efe2c4']], ['t', 0, ['Filet à papillons', 'm', 'outil', 1, null, '#7fae4f']],
  ['t', 1, ['Pelle de voyage', 'm', 'outil', 1, null, '#a87a50']], ['t', 1, ['Canne à pêche', 'm', 'outil', 1, null, '#d9c38f']], ['t', 1, ['Loupe de naturaliste', 'm', 'outil', 1, null, '#9fd8f0']],
  ['t', 2, ['Lampe frontale', 'm', 'outil', 2, null, '#f2c14e']], ['t', 2, ['Boussole', 'm', 'outil', 2, null, '#c9a35a']], ['t', 3, ['Burin de lapidaire', 'm', 'outil', 1, null, '#8f9cb3']],
  ['m', 0, ['Pépins de pomme', 'm', 'graine', 0, null, '#c9a07a']], ['m', 0, ['Graines de fraisier', 'm', 'graine', 0, null, '#e9a0a0']],
  ['m', 1, ['Bulbe de tulipe', 'm', 'graine', 0, null, '#9c6b4a']], ['m', 1, ['Graines de tournesol', 'm', 'graine', 0, null, '#a8b45a']],
].forEach(([k, lvl, def], i) => BQ_CAT.push({ key: 'n' + k + i, k, lvl, def }));
// les 4 rayons du magasin, comme au marché mondial
const BQ_MCATS = [['comp', 'Compagnons', 'Œufs de compagnons'], ['mode', 'Vêtements', 'Vêtements et accessoires'], ['res', 'Ressources', 'Ingrédients, matériaux et graines'], ['craft', 'Objets fabriqués', 'Objets fabriqués et outils']];
let bqMCat = 'comp';
function bqMCatOf(x) { if (x.r) return x.r; if (x.o) return 'comp'; if (x.x) return x.x.it.cat === 'v' ? 'mode' : 'res'; const a = BQ_CAT.find(y => y.key === x.key) || {}; return a.k === 'v' ? 'mode' : a.k === 'm' ? 'res' : 'craft'; }

// ---------------- état ----------------
let bView = 'comptoir';
function bqState() {
  if (!S.shop || typeof S.shop !== 'object') S.shop = {};
  const s = S.shop;
  if (typeof s.rep !== 'number' || !isFinite(s.rep)) s.rep = 0;
  if (typeof s.lvl !== 'number') s.lvl = 0;
  if (!Array.isArray(s.orders)) s.orders = [];
  if (typeof s.served !== 'number') s.served = 0;
  if (!s.stock || typeof s.stock !== 'object') s.stock = { day: 0, items: [] };
  if (!Array.isArray(s.stock.items)) s.stock.items = [];
  if (!s.clients || typeof s.clients !== 'object') s.clients = {};
  if (!Array.isArray(s.recipes)) s.recipes = [];
  if (typeof s.next !== 'number') s.next = 0;
  if (typeof s.seq !== 'number') s.seq = 0;
  if (typeof s.earned !== 'number') s.earned = 0;
  // commerces (phase B) : type actif, commerces ouverts ; une ancienne sauvegarde n'a pas encore de spécialité
  if (s.type && !BQS(s.type)) s.type = null;
  if (!Array.isArray(s.owned)) s.owned = [];
  if (s.type && !s.owned.includes(s.type)) s.owned.push(s.type);
  if (typeof s.slotSeen !== 'number') s.slotSeen = s.owned.length;
  s.orders = s.orders.filter(o => o && Array.isArray(o.req) && BQC(o.client));
  // v19 : les commandes appartiennent à UN commerce ; celles des autres commerces attendent (s.park) qu'on y revienne
  if (!s.park || typeof s.park !== 'object') s.park = {};
  if (s.type && s.orders.some(o => o.shop !== s.type)) {
    s.orders.forEach(o => { if (o.shop !== s.type && o.shop && s.owned.includes(o.shop)) (s.park[o.shop] = s.park[o.shop] || []).push(o); });
    s.orders = s.orders.filter(o => o.shop === s.type);
  }
  s.lvl = bqLevelOf(s.rep);
  return s;
}
function bqLevelOf(rep) { let l = 0; BQ_LEVELS.forEach((L, i) => { if (rep >= L.rep) l = i; }); return l; }
const bqHome = () => { try { return typeof rgHome === 'function' ? rgHome() : null; } catch (e) { return null; } };
const bqRound5 = n => Math.max(5, Math.round(n / 5) * 5);

// ---------------- pierres d'étoile (v22) ----------------
// S.stones : seconde monnaie, rare (0 par défaut, les anciennes sauvegardes démarrent à 0).
// On en gagne avec certaines commandes du comptoir (Normal : 1 fois sur 3, Défi : 2 ou 3), les défis et la fin des histoires (5 à 10).
// PRÉVU POUR PLUS TARD : un tirage façon Dokkan Battle (invocation). Le tirage n'existe pas encore : ne pas dépenser S.stones ailleurs.
function stonesN() { if (typeof S.stones !== 'number' || !isFinite(S.stones) || S.stones < 0) S.stones = 0; return S.stones; }
function gainStones(n) {
  n = Math.max(0, Math.round(n || 0)); stonesN(); if (!n) return 0;
  S.stones += n;
  try { renderTop(); const e = document.getElementById('stones'); if (e) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } } catch (e) {}
  return n;
}
// petite étoile cristal (facettes claires et foncées)
const STONE_SVG = '<svg class="stone" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.4 L12.4 7.1 L18.6 7.6 L13.8 11.6 L15.3 17.8 L10 14.5 L4.7 17.8 L6.2 11.6 L1.4 7.6 L7.6 7.1Z" fill="#9fdcf6" stroke="#3d4f99" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 1.4 L10 10 L1.4 7.6 L7.6 7.1Z M10 10 L15.3 17.8 L10 14.5Z M10 10 L18.6 7.6 L13.8 11.6Z" fill="#c7b6ff"/><path d="M10 1.4 L12.4 7.1 L10 10Z M10 10 L4.7 17.8 L6.2 11.6Z" fill="#e8f8ff"/><path d="M10 1.4 V10 L18.6 7.6 M10 10 L15.3 17.8 M10 10 L4.7 17.8 M10 10 L1.4 7.6" fill="none" stroke="#3d4f99" stroke-width=".5" opacity=".55"/><circle cx="7.2" cy="5.6" r=".9" fill="#fff"/></svg>';
const stonesHTML = n => `<span class="money stonem">${STONE_SVG}${Math.round(n)}</span>`;
const stonesWord = n => `${n} pierre${n > 1 ? 's' : ''} d’étoile`;
// solde discret dans le HUD, à côté des pièces (créé à la volée : rien à changer dans shell.html)
if (typeof renderTop === 'function') renderTop = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const c = document.getElementById('coins'); if (!c) return r;
    let e = document.getElementById('stones');
    if (!e) { e = document.createElement('button'); e.id = 'stones'; e.type = 'button'; e.className = 'stonep'; c.insertAdjacentElement('afterend', e); }
    const n = stonesN(); e.innerHTML = STONE_SVG + '<b>' + n + '</b>'; e.setAttribute('aria-label', stonesWord(n));
  } catch (e) {}
  return r;
})(renderTop);
document.addEventListener('click', ev => { if (!ev.target.closest('#stones')) return; const n = stonesN(); toast(`${stonesWord(n)}. Gardez-les précieusement : elles serviront bientôt à un tirage spécial !`); });

// ---------------- objets : compter, réserver, consommer ----------------
function bqWorn() { const s = new Set(); for (const o of Object.values(S.outfits || {})) if (o && o.worn) for (const [sl, id] of Object.entries(o.worn)) if (id && o[sl] && o[sl] !== 'none') s.add(id); return s; }
function bqMatch(r, it) {
  if (!it) return false;
  if (r.k === 'ing') return (it.cat === 'm' || it.cat === 'n') && ING[r.key] && ING[r.key][0].includes(it.sub);
  if (r.k === 'item' || r.k === 'craft') return it.name === r.name || it.name === r.name + ' (chef-d’œuvre)';
  if (r.k === 'reg') return it.rid === r.rid;
  if (r.k === 'bait') return bqIsBait(it);
  return false;
}
// animalerie : les œufs (S.eggs) et les compagnons (S.comps) demandés ; jamais le dernier compagnon, jamais un voyageur
function bqPetTake(r, usedComps) {
  if (r.k === 'egg') { const c = (S.eggs || []).filter(e => e && (!r.sp || e.sp === r.sp)).sort((a, b) => (a.rarity || 0) - (b.rarity || 0)); return c.slice(0, r.n).map(e => ({ egg: e.id })); }
  const team = typeof teamIds === 'function' ? teamIds() : [], all = Object.keys(S.comps || {});
  const c = all.filter(k => !usedComps.has(k) && (typeof spOf === 'function' ? spOf(k) : '') === r.sp && !S.trips[k])
    .sort((a, b) => (team.includes(a) ? 1 : 0) - (team.includes(b) ? 1 : 0) || (S.comps[a].rarity || 0) - (S.comps[b].rarity || 0) || ((S.prog[a] || {}).lvl || 1) - ((S.prog[b] || {}).lvl || 1));
  const max = Math.max(0, all.length - 1 - usedComps.size);
  return c.slice(0, Math.min(r.n, max)).map(k => ({ comp: k }));
}
// les objets demandés précisément d'abord, puis les ingrédients génériques ; un objet porté seulement en dernier recours
// (la livraison demande alors l'accord du joueur, via styleGuard)
function bqAllocate(o) {
  const worn = bqWorn(), used = new Set(), out = [], usedComps = new Set();
  const order = o.req.map((r, i) => ({ r, i })).sort((a, b) => (a.r.k === 'ing') - (b.r.k === 'ing'));
  for (const { r, i } of order) {
    if (r.k === 'egg' || r.k === 'comp') { const take = bqPetTake(r, usedComps); take.forEach(x => x.comp && usedComps.add(x.comp)); out[i] = { have: take.length, take, pet: 1 }; continue; }
    const c = S.inv.filter(it => !used.has(it) && bqMatch(r, it))
      .sort((a, b) => (worn.has(a.id) ? 1 : 0) - (worn.has(b.id) ? 1 : 0) || (r.k === 'reg' ? 0 : (a.rid ? 1 : 0) - (b.rid ? 1 : 0)) || ((a.special || a.edition) ? 1 : 0) - ((b.special || b.edition) ? 1 : 0) || a.rarity - b.rarity);
    const take = c.slice(0, r.n); take.forEach(x => used.add(x));
    out[i] = { have: Math.min(c.length, r.n), take };
  }
  return out;
}
const bqReady = o => bqAllocate(o).every((a, i) => a.have >= o.req[i].n);
function shopReady() { try { return bqState().orders.filter(bqReady).length; } catch (e) { return 0; } }
// pastille près de l'onglet Boutique : nombre de clients qui attendent (shopReady() : commandes livrables)
function shopBadge() { try { return bqState().orders.length; } catch (e) { return 0; } }
function shopBadgeText() { const n = shopBadge(), r = shopReady(); return r ? `${r} commande${r > 1 ? 's' : ''} prête${r > 1 ? 's' : ''} à livrer !` : n ? `${n} client${n > 1 ? 's' : ''} attend${n > 1 ? 'ent' : ''} !` : ''; }

// ---------------- génération des commandes ----------------
const BQ_NEAR_CATS = ['boulangerie', 'cafe', 'marche', 'epicerie', 'fleuriste', 'librairie', 'parc', 'rue', 'fromagerie', 'chocolaterie', 'glacier', 'jardin', 'poste', 'bricolage', 'mode', 'friperie', 'puces', 'boucherie', 'bibliotheque', 'musee', 'coiffeur', 'ferme', 'etang', 'riviere', 'pharmacie', 'route'];
const bqPoiOK = c => typeof POI_CATS !== 'undefined' && POI_CATS[c] && LOOT[c];
// meilleur lieu du quotidien pour un ingrédient : celui où il tombe le plus souvent (objets communs)
const _bqCatFor = {};
function bqCatFor(key, prefer) {
  const subs = ING[key] ? ING[key][0] : []; if (!subs.length) return null;
  const score = c => { const l = LOOT[c] || []; const tot = l.reduce((a, d) => a + 1 / (1 + d[3] * 1.6), 0); return l.filter(d => (d[1] === 'm' || d[1] === 'n') && subs.includes(d[2])).reduce((a, d) => a + 1 / (1 + d[3] * 1.6), 0) / (tot || 1); };
  const pf = (prefer || []).filter(c => bqPoiOK(c) && score(c) >= 0.25).sort((a, b) => score(b) - score(a));
  if (pf.length) return pf[0];
  if (!(key in _bqCatFor)) { const all = BQ_NEAR_CATS.filter(bqPoiOK).map(c => ({ c, s: score(c) })).sort((a, b) => b.s - a.s); _bqCatFor[key] = all.length && all[0].s >= 0.12 ? all[0].c : null; }
  return _bqCatFor[key];
}
const bqItemOf = (def, extra = {}) => ({ name: def[0], cat: def[1], sub: def[2], rarity: def[3], look: def[4] || null, color: def[5] || null, ...extra });
function bqSampleIng(key) {
  const subs = ING[key] ? ING[key][0] : [];
  for (const l of Object.values(LOOT)) { const d = l.find(x => (x[1] === 'm' || x[1] === 'n') && subs.includes(x[2]) && x[3] === 0); if (d) return bqItemOf(d); }
  return { name: '', cat: 'm', sub: subs[0] || 'pierre', rarity: 0 };
}
function bqReqValue(r) {
  try {
    if (r.k === 'ing') return value({ ...bqSampleIng(r.key), id: '' }) * r.n;
    if (r.k === 'item') return value(bqItemOf(r.def)) * r.n;
    if (r.k === 'reg') { const x = RG_RES[r.rid], R = RG[x.region], km = kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }); return value({ name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, rid: x.id, origin: { region: R.id, km } }) * r.n; }
    if (r.k === 'egg') return (r.sp ? 150 : 95) * 0.25 * r.n;
    if (r.k === 'comp') return (typeof mkCompPrice === 'function' ? mkCompPrice({ sp: r.sp, rarity: 0, lvl: 1 }) : 180) * 0.3 * r.n;
    if (r.k === 'bait') return 35 * r.n;
    if (r.k === 'craft') { const rc = RECIPES.find(x => x.id === r.id); const ingV = rc.ing.reduce((a, [key, n]) => a + (key.startsWith('r:') ? bqReqValue({ k: 'reg', rid: key.slice(2), n }) : value({ ...bqSampleIng(key), id: '' }) * n), 0); return (ingV + (rc.coins || 0) + value(bqItemOf(rc.out)) * 0.5) * r.n; }
  } catch (e) {}
  return 10 * (r.n || 1);
}
const bqPick = (arr, w) => { if (!arr.length) return null; if (!w) return arr[Math.floor(Math.random() * arr.length)]; const ws = arr.map(w), t = ws.reduce((a, b) => a + b, 0); let r = Math.random() * t; for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[0]; };
function bqRegionsFor(L) {
  if (typeof REGIONS === 'undefined') return [];
  const home = bqHome();
  if (L <= 1) return home ? [home] : [];
  const g = L === 2 ? 0 : L === 3 ? 1 : 9;
  return REGIONS.filter(R => R.g <= g && R.id !== 'grand_large');
}
const bqRecOwned = id => !BQ_RIDS.has(id) || bqState().recipes.includes(id);
// recettes ordinaires faciles à réaliser près de chez soi
const BQ_EASY_CRAFT = ['tarte', 'confiture', 'herbier', 'plante', 'moufles', 'tapis', 'globe', 'salade', 'collier', 'bocal', 'pull', 'echarpe'];
const BQ_GEN = {
  ing(c, L, easy) {
    const keys = c.likes.filter(k => ING[k] && bqCatFor(k, c.cats));
    const key = bqPick(keys.length ? keys : ['sucre', 'fruit', 'papier', 'fleur'].filter(k => bqCatFor(k)));
    if (!key) return null;
    return { k: 'ing', key, n: easy ? 2 : 2 + (L >= 2 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0), src: { cat: bqCatFor(key, c.cats) } };
  },
  item(c, L) {
    const cats = c.cats.filter(bqPoiOK); const cat = bqPick(cats); if (!cat) return null;
    const pool = LOOT[cat].filter(d => d[3] <= (L >= 3 ? 1 : 0) && d[1] !== 't');
    const def = bqPick(pool, d => d[3] ? 0.5 : 1); if (!def) return null;
    return { k: 'item', name: def[0], def, n: 1, src: { cat } };
  },
  craft(c, L) {
    const pool = RECIPES.filter(r => !r.multi && bqRecOwned(r.id) && (BQ_EASY_CRAFT.includes(r.id) || (L >= 2 && r.out[3] <= 3)) && r.ing.every(([k]) => !k.startsWith('r:')));
    const r = bqPick(pool, r => (c.likes.some(k => r.ing.some(([x]) => x === k)) ? 3 : 1)); if (!r) return null;
    return { k: 'craft', id: r.id, name: r.out[0], def: r.out, n: 1 };
  },
  reg(c, L) {
    const regs = bqRegionsFor(L); if (!regs.length) return null;
    const maxR = [0, 0, 1, 1, 2, 3][L] || 0;
    const pool = [];
    regs.forEach(R => R.res.forEach(x => { if (x.rar <= maxR && bqRegSense(x)) pool.push(x); }));
    const x = bqPick(pool, x => (c.likes.some(k => ING[k] && ING[k][0].includes(x.sub)) ? 3 : 1) * (x.rar ? 0.6 : 1)); if (!x) return null;
    return { k: 'reg', rid: x.id, name: x.name, n: x.rar === 0 && L >= 2 && Math.random() < 0.5 ? 2 : 1, src: { region: x.region } };
  },
  tag(c, L) {
    const tag = bqPick(c.tags.filter(t => LOOT[t])); if (!tag) return null;
    const def = bqPick(LOOT[tag].filter(d => d[3] === 0 && d[1] !== 't')); if (!def) return null;
    return { k: 'item', name: def[0], def, n: 1, src: { tag } };
  },
  merveille(c, L) {
    if (typeof RG_RECIPES === 'undefined') return null;
    const r = bqPick(RG_RECIPES.filter(r => r.out[3] <= (L >= 5 ? 4 : 3))); if (!r) return null;
    return { k: 'craft', id: r.id, name: r.out[0], def: r.out, n: 1, wonder: 1 };
  },
  souvenir(c, L) {
    const p = bqPick(PLACES.filter(p => p.name !== S.home && p.special && (L >= 5 || zoneOfSafe(p) !== 'monde'))); if (!p) return null;
    return { k: 'item', name: p.special[0], def: [p.special[0], p.special[1], p.special[2], 3, p.special[4], p.special[5]], n: 1, src: { place: p.name }, souvenir: 1 };
  },
};
const zoneOfSafe = p => { try { return typeof zoneOf === 'function' ? zoneOf(p) : 'fr'; } catch (e) { return 'fr'; } };
function bqGenFor(c, L, served) {
  const easy = served < 2;
  const W = easy ? { ing: 5, item: 2 } : [
    { ing: 4, item: 3, craft: 1.5 },
    { ing: 3, item: 2, craft: 2, reg: 3, tag: 1.5 },
    { ing: 2, item: 1.5, craft: 2, reg: 4, tag: 2 },
    { ing: 1.5, item: 1, craft: 2, reg: 4.5, tag: 2, souvenir: 1 },
    { ing: 1, item: 1, craft: 1.5, reg: 4, tag: 1.5, souvenir: 1.5, merveille: 2 },
    { ing: 1, item: 1, craft: 1.5, reg: 4, tag: 1.5, souvenir: 1.5, merveille: 3 },
  ][L];
  const kinds = Object.keys(W);
  const req = [];
  for (let tries = 0; tries < 12 && !req.length; tries++) { const g = bqPick(kinds, k => W[k]); const r = BQ_GEN[g](c, L, easy); if (r) req.push(r); }
  if (!req.length) req.push({ k: 'ing', key: 'sucre', n: 2, src: { cat: 'boulangerie' } });
  if (!easy && L >= 2 && Math.random() < 0.35) {
    const g = bqPick(['ing', 'item', 'reg'].filter(k => W[k]), k => W[k]); const r = BQ_GEN[g](c, L, false);
    if (r && !req.some(x => x.k === r.k && (x.key || x.name || x.rid) === (r.key || r.name || r.rid))) req.push(r);
  }
  return req;
}
// ---------------- commandes selon le commerce ----------------
const bqIsBait = it => { try { if (typeof nsBaitSps === 'function' && it && nsBaitSps(it).length) return true; if (typeof baitOf === 'function') return !!baitOf(it); if (typeof isBait === 'function') return !!isBait(it); } catch (e) {} return !!(it && (it.bait || it.sub === 'appat' || it.sub === 'appât')); };
const bqSpIds = () => (typeof SP_IDS !== 'undefined' ? SP_IDS : ['panda', 'capy', 'axo']);
const bqSpName = sp => { try { return typeof spName === 'function' ? spName(sp) : sp; } catch (e) { return sp; } };
const bqCraftOK = (T, r) => typeof T.crafts === 'function' ? T.crafts(r) : T.crafts.includes(r.id);
// v19 : ce que vend vraiment le commerce (sous-types de ses ingrédients et de sa spécialité, ses types d'objets, ses produits phares)
const bqShopSubs = T => new Set([].concat(...T.keys.map(k => ING[k] ? ING[k][0] : []), T.bsubs || []));
function bqFitDef(T, d) {
  if (!T || !d) return !T;
  if ((T.stars || []).some(x => Array.isArray(x) && x[0] === d[0])) return true;
  const cats = T.itemCats.concat(T.bcats || []);
  if (!cats.includes(d[1])) return false;
  return bqShopSubs(T).has(d[2]) || !!(T.bcats && T.bcats.includes(d[1])) || !!(T.anyFood && d[1] === 'n');
}
// une demande est-elle cohérente avec le commerce ?
function bqFitReq(T, r) {
  if (!T || !r) return true;
  if (r.k === 'egg' || r.k === 'comp' || r.k === 'bait') return !!T.pets;
  if (r.k === 'ing') return T.keys.includes(r.key);
  if (r.k === 'reg') { const x = RG_RES[r.rid]; return !!x && bqFitDef(T, [x.name, x.cat, x.sub, x.rar]); }
  if (r.k === 'craft' && !r.wonder) { const rc = RECIPES.find(x => x.id === r.id); return !!rc && (bqCraftOK(T, rc) || bqFitDef(T, rc.out)); }
  return bqFitDef(T, r.def);
}
const BQ_GEN_SHOP = {
  ing(T, c, L, easy) {
    const keys = T.keys.filter(k => ING[k] && bqCatFor(k, T.cats));
    const key = bqPick(keys, k => (c.likes.includes(k) ? 2 : 1)); if (!key) return null;
    return { k: 'ing', key, n: easy ? 2 : 2 + (L >= 2 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0), src: { cat: bqCatFor(key, T.cats) } };
  },
  item(T, c, L) {
    // uniquement ce que vend vraiment le commerce, trouvé dans ses lieux du quotidien
    const opts = [];
    T.cats.filter(bqPoiOK).forEach(cat => LOOT[cat].forEach(d => { if (d[3] <= (L >= 3 ? 1 : 0) && d[1] !== 't' && bqFitDef(T, d)) opts.push({ cat, d }); }));
    const o = bqPick(opts, o => o.d[3] ? 0.5 : 1); if (!o) return null;
    return { k: 'item', name: o.d[0], def: o.d, n: 1, src: { cat: o.cat } };
  },
  craft(T, c, L, easy) {
    const pool = RECIPES.filter(r => !r.multi && bqCraftOK(T, r) && bqRecOwned(r.id) && r.ing.every(([k]) => !k.startsWith('r:')) && r.out[3] <= (easy ? 2 : L >= 2 ? 4 : 3));
    const r = bqPick(pool, r => (r.out[3] <= 2 ? 2 : 1)); if (!r) return null;
    return { k: 'craft', id: r.id, name: r.out[0], def: r.out, n: 1 };
  },
  reg(T, c, L) {
    const regs = bqRegionsFor(Math.min(5, L + (T.reach || 0))); if (!regs.length) return null;
    const subs = bqShopSubs(T), maxR = [0, 0, 1, 1, 2, 3][L] || 0, pool = [];
    regs.forEach(R => R.res.forEach(x => { if (x.rar <= maxR && bqRegSense(x) && bqFitDef(T, [x.name, x.cat, x.sub, x.rar])) pool.push(x); }));
    const x = bqPick(pool, x => (subs.has(x.sub) ? 3 : 1) * (x.rar ? 0.6 : 1)); if (!x) return null;
    return { k: 'reg', rid: x.id, name: x.name, n: 1, src: { region: x.region } };
  },
  egg(T, c, L) { const sp = L >= 2 && Math.random() < 0.5 ? bqPick(bqSpIds()) : null; return { k: 'egg', sp, n: 1, name: sp ? `Œuf de ${bqSpName(sp).toLowerCase()}` : 'Œuf de compagnon' }; },
  comp(T, c, L) { const sp = bqPick(bqSpIds()); return { k: 'comp', sp, n: 1, name: bqSpName(sp) }; },
  bait() { return S.inv.some(bqIsBait) ? { k: 'bait', n: 1, name: 'Appât pour compagnons' } : null; },
  souvenir(T, c, L) {
    const ps = PLACES.filter(p => p.name !== S.home && p.special && (L >= 5 || zoneOfSafe(p) !== 'monde') && bqFitDef(T, p.special)); const p = bqPick(ps); if (!p) return null;
    return { k: 'item', name: p.special[0], def: [p.special[0], p.special[1], p.special[2], 3, p.special[4], p.special[5]], n: 1, src: { place: p.name }, souvenir: 1 };
  },
  merveille(T, c, L) {
    if (typeof RG_RECIPES === 'undefined') return null;
    const r = bqPick(RG_RECIPES.filter(r => r.out[3] <= (L >= 5 ? 4 : 3) && bqFitDef(T, r.out))); if (!r) return null;
    return { k: 'craft', id: r.id, name: r.out[0], def: r.out, n: 1, wonder: 1 };
  },
};
function bqGenShop(T, c, L, served) {
  const easy = served < 2;
  let W = easy ? { ing: 5, item: 2, craft: T.itemCats.includes('v') ? 3 : 0 } : [
    { ing: 4, item: 3, craft: 2 },
    { ing: 3, item: 2, craft: 2.5, reg: 2 },
    { ing: 2.5, item: 2, craft: 3, reg: 3 },
    { ing: 2, item: 1.5, craft: 3, reg: 3.5, souvenir: 0.5 },
    { ing: 1.5, item: 1, craft: 3, reg: 3.5, souvenir: 1, merveille: 1 },
    { ing: 1.5, item: 1, craft: 3, reg: 3.5, souvenir: 1, merveille: 1.5 },
  ][L];
  W = Object.assign({}, W);
  if (T.itemCats.includes('v')) W.craft = (W.craft || 0) * 1.8; // mode : surtout des vêtements fabriqués
  if (T.reach) W.reg = Math.max(W.reg || 0, easy ? 1.5 : 4); // épicerie : spécialités régionales dès le début
  if (T.souv && !easy) W.souvenir = (W.souvenir || 0) + 1.2;
  if (T.pets && (served >= 1 || !easy)) { W.egg = 3.2; if (L >= 1) W.comp = 2.4; W.bait = 1; }
  const kinds = Object.keys(W).filter(k => W[k] > 0), req = [];
  for (let t = 0; t < 14 && !req.length; t++) { const g = bqPick(kinds, k => W[k]); const r = BQ_GEN_SHOP[g](T, c, L, easy); if (r && bqFitReq(T, r)) req.push(r); }
  if (!req.length) { const r = BQ_GEN_SHOP.ing(T, c, L, true) || BQ_GEN_SHOP.item(T, c, L); if (r) req.push(r); }
  if (!easy && L >= 2 && Math.random() < 0.35 && !req.some(r => r.k === 'comp')) {
    const g = bqPick(['ing', 'item', 'reg'].filter(k => W[k]), k => W[k]); const r = g && BQ_GEN_SHOP[g](T, c, L, false);
    if (r && bqFitReq(T, r) && !req.some(x => x.k === r.k && (x.key || x.name || x.rid) === (r.key || r.name || r.rid))) req.push(r);
  }
  return req;
}
// sous-types touchés par une demande (pour la spécialité du commerce)
function bqReqSubs(r) {
  if (r.k === 'ing') return ING[r.key] ? ING[r.key][0] : [];
  if (r.k === 'reg') return RG_RES[r.rid] ? [RG_RES[r.rid].sub] : [];
  if (r.def) return [r.def[2]];
  return [];
}
function bqIsSpec(T, req) {
  if (!T) return false;
  return req.some(r => (T.bkinds && T.bkinds.includes(r.k)) || (T.bsubs && bqReqSubs(r).some(x => T.bsubs.includes(x))) || (T.bcats && r.def && T.bcats.includes(r.def[1])));
}
function bqNewOrder(forceEasy) {
  const s = bqState(), L = s.lvl, now = Date.now(), T = bqType();
  const busy = new Set(s.orders.map(o => o.client));
  let pool = BQ_CLIENTS.filter(c => c.lvl <= L && !busy.has(c.id) && !((s.clients[c.id] || {}).away > now));
  if (forceEasy) pool = pool.filter(c => c.cats.some(bqPoiOK));
  // v19 : les habitués du commerce ouvert (d'autres clients seulement s'ils sont tous déjà au comptoir)
  const own = T && BQ_SHOP_CLIENTS[T.id];
  if (own) { const p = pool.filter(c => own.includes(c.id)); if (p.length) pool = p; }
  if (!pool.length) return null;
  // les clients qui aiment ce que vend le commerce viennent plus souvent
  const fit = c => T ? (c.likes.some(k => T.keys.includes(k)) || c.cats.some(x => T.cats.includes(x)) ? 3 : 1) : 1;
  const c = bqPick(pool, c => fit(c) / (1 + ((s.clients[c.id] || {}).served || 0) * 0.3) * (c.lvl === L && L > 0 ? 1.6 : 1));
  const req = T ? bqGenShop(T, c, L, forceEasy ? 0 : s.served) : bqGenFor(c, L, forceEasy ? 0 : s.served);
  const val = req.reduce((a, r) => a + bqReqValue(r), 0);
  const deadline = !forceEasy && Math.random() < 0.3 ? now + (24 + Math.floor(Math.random() * 24)) * 3600e3 : 0;
  const spec = bqIsSpec(T, req);
  const coinsR = bqRound5(((25 + 2.5 * val) * bqLv(L).rich * c.rich * (deadline ? 1.25 : 1) * (spec ? T.mult || 1 : 1)) + (T && T.tip ? T.tip : 0));
  const rep = Math.round(Math.min(90, (12 + val / 5 + L * 2 + req.length * 3 + (req.some(r => r.wonder) ? 15 : 0)) * (T && T.rep ? T.rep : 1)));
  // la phrase du client : celle du commerce, la sienne, ou une demande d'adoption
  const cr = req.find(r => r.k === 'comp');
  // (deux clients au comptoir ne disent jamais la même phrase)
  const usedL = new Set(s.orders.map(x => x.line)), fresh = l => { const f = (l || []).filter(x => !usedL.has(x)); return f.length ? pick(f) : null; };
  const line = cr ? `Je rêve d’adopter ${typeof spArticle === 'function' ? spArticle(cr.sp) : 'un compagnon'}. Son panier est déjà prêt !` : (T && Math.random() < 0.7 && fresh(T.lines)) || fresh(c.lines) || pick(c.lines);
  const o = { id: uidGen(), client: c.id, line, req, coins: coinsR, rep, at: now, deadline, seq: ++s.seq, shop: T ? T.id : null, spec: spec ? 1 : 0 };
  // parfois une récompense en plus : une recette du magasin pas encore connue, ou un objet rare
  if (!forceEasy && Math.random() < 0.22 * (T && T.recx ? T.recx : 1)) {
    const rec = BQ_RECIPES.find(r => r.lvl <= L + 1 && !s.recipes.includes(r.id));
    if (rec && Math.random() < 0.5) o.bonus = { rec: rec.id };
    else { const tags = (T ? T.cats : c.cats.concat(c.tags)).filter(x => LOOT[x]); const pl = [].concat(...tags.map(t => LOOT[t])).filter(d => d[3] === 2 && d[1] !== 't' && (!T || bqFitDef(T, d))); const d = bqPick(pl); if (d) o.bonus = { def: d }; }
  }
  return o;
}
// rythme d'arrivée : très rapide au début, puis une commande toutes les 20 à 40 minutes
function bqInterval(served) { const m = served < 3 ? 2 + Math.random() * 2 : served < 8 ? 8 + Math.random() * 7 : 20 + Math.random() * 20, T = bqType(); return Math.round(m * 60e3 * (T && T.fast ? T.fast : 1)); }
// commandes simultanées : selon le niveau, plus une pour le restaurant
const bqSlots = () => { const s = bqState(), T = bqType(); return bqLv(s.lvl).slots + (T && T.slot ? T.slot : 0); };
function bqTickOrders() {
  const s = bqState(), now = Date.now(), slots = bqSlots();
  let changed = false;
  // délais dépassés : le client repart (il reviendra)
  const gone = s.orders.filter(o => o.deadline && now > o.deadline);
  if (gone.length) { gone.forEach(o => { const cs = s.clients[o.client] || (s.clients[o.client] = {}); cs.away = now + 2 * 3600e3; toast(`${BQC(o.client).name} n’a pas pu attendre plus longtemps, mais reviendra plus tard.`); }); s.orders = s.orders.filter(o => !gone.includes(o)); changed = true; }
  // premières commandes : tout de suite
  if (!s.orders.length && !s.served && !s.started) {
    s.started = now;
    // deux premiers clients, deux demandes différentes
    const sig = o => JSON.stringify(o.req.map(r => [r.k, r.key || r.name || r.rid || r.sp || '']));
    for (let i = 0; i < 2; i++) { let o = null; for (let t = 0; t < 5; t++) { o = bqNewOrder(true); if (!o || !s.orders.some(x => sig(x) === sig(o))) break; } if (o) s.orders.push(o); }
    s.next = now + bqInterval(0); changed = true;
  }
  if (!s.next) s.next = now + bqInterval(s.served);
  let guard = 0;
  while (s.orders.length < slots && now >= s.next && guard++ < 6) {
    const o = bqNewOrder(false); if (o) s.orders.push(o);
    s.next = Math.max(s.next, now - 3600e3) + bqInterval(s.served);
    changed = true;
  }
  if (s.orders.length >= slots && now >= s.next) s.next = now + 60e3; // file pleine : le prochain client attend dehors
  if (!s.orders.length && s.next > now + 120e3) { s.next = now + 90e3; changed = true; } // comptoir vide : quelqu'un arrive bientôt
  return changed;
}

// ---------------- libellés et icônes des demandes ----------------
// petit œuf ou petit compagnon dessiné (animalerie, marché mondial)
function bqEggSVG(sp, uid) {
  try { if (typeof drawEgg === 'function') { const s = drawEgg(sp || null, null, 0, uid || ('bqe' + uidGen())); if (typeof s === 'string' && s.includes('<svg')) return s; } } catch (e) {}
  try { if (typeof eggArt === 'function') return eggArt({ sp, col: ['#fff3e2', '#f3aec1'] }, 0, uid || ('bqe' + uidGen())); } catch (e) {}
  return '';
}
function bqCompSVG(look, uid) { try { return drawChar(look, null, 'content', uid || ('bqc' + uidGen())); } catch (e) { return ''; } }
function bqReqIcon(r) {
  try {
    if (r.k === 'egg') return bqEggSVG(r.sp, 'bqre' + (r.sp || 'x'));
    if (r.k === 'comp') return bqCompSVG({ sp: r.sp, genes: null, hybrid: null }, 'bqrc' + r.sp);
    if (r.k === 'bait') { const b = S.inv.find(bqIsBait); return itemIcon(b || { name: 'Appât', cat: 'm', sub: 'graine', rarity: 1, color: '#e9a03a' }); }
    if (r.k === 'ing') return itemIcon(bqSampleIng(r.key));
    if (r.k === 'item' || r.k === 'craft') return itemIcon(bqItemOf(r.def));
    if (r.k === 'reg') { const x = RG_RES[r.rid]; return itemIcon({ name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, color: x.color }); }
  } catch (e) {}
  return '';
}
function bqReqLabel(r) {
  if (r.k === 'ing') return ING[r.key] ? ING[r.key][1] : r.key;
  if (r.k === 'reg') return RG_RES[r.rid] ? RG_RES[r.rid].name : r.rid;
  if (r.k === 'egg') return r.sp ? `Œuf de ${bqSpName(r.sp).toLowerCase()}` : 'Un œuf de compagnon';
  if (r.k === 'comp') return `Un ${bqSpName(r.sp).toLowerCase()} à adopter`;
  return r.name;
}
function bqReqWhere(r) {
  const s = r.src || {};
  if (r.k === 'craft') return r.wonder ? 'Merveille à fabriquer (atelier)' : 'À fabriquer à l’atelier';
  if (r.k === 'egg') return 'Magasin, marché mondial ou voyage';
  if (r.k === 'comp') return 'Marché mondial, œufs ou rencontres (pas un voyageur)';
  if (r.k === 'bait') return 'Un appât du sac : fruits, poisson, thé…';
  if (s.cat && POI_CATS[s.cat]) return `${POI_CATS[s.cat][0]} près de chez vous`;
  if (s.tag) return `Lieu ${TAGQ[s.tag] || TAGL[s.tag] || s.tag}`;
  if (s.place) return `Souvenir de ${s.place}`;
  if (s.region && typeof RG !== 'undefined' && RG[s.region]) { const R = RG[s.region], h = bqHome(); return h && h.id === R.id ? `Spécialité de votre région (${R.short})` : `Spécialité ${rgDe(R)}`; }
  return '';
}
function bqRarity(r) { if (r.k === 'comp') return 2; if (r.k === 'egg') return r.sp ? 2 : 1; if (r.k === 'reg') return RG_RES[r.rid] ? RG_RES[r.rid].rar : 0; if (r.def) return r.def[3] || 0; return 0; }

// ---------------- livrer, refuser, partir chercher ----------------
function bqDeliver(id, srcEl, depth = 0, petOK = false) {
  const s = bqState(), o = s.orders.find(x => x.id === id); if (!o || !bqReady(o)) return;
  const c = BQC(o.client), alloc = bqAllocate(o), given = [];
  // confier un compagnon : on demande d'abord (c'est le joueur qui a touché « Livrer », ce n'est pas une fenêtre spontanée)
  const pets = [].concat(...alloc.filter(a => a.pet).map(a => a.take)), comps = pets.filter(x => x.comp).map(x => x.comp);
  if (comps.length && !petOK) {
    const k = comps[0], ch = CHARS[k], p = S.prog[k] || { lvl: 1 };
    showModal(`<div class="bq-adopt"><img class="bq-adimg" src="${portraitURI(k, 'rire')}" alt=""><h2>Confier ${esc(ch ? ch.name : '')} à ${esc(c.name)} ?</h2><p>${esc(ch ? ch.species : '')} · niveau ${p.lvl} · ${RARITY[(S.comps[k] || {}).rarity || 0]}. ${esc(c.name)} promet d’en prendre grand soin. Ce compagnon quittera votre refuge.</p><div class="bq-adacts"><button class="btn cream" data-closemodal="1">Garder</button><button class="btn green" data-bqadopt="${o.id}">Confier</button></div></div>`);
    return;
  }
  // un vêtement porté par un compagnon : on demande avant de le livrer (un objet à la fois)
  const worn = bqWorn(), wornIt = [].concat(...alloc.filter(a => !a.pet).map(a => a.take)).find(it => worn.has(it.id));
  if (wornIt && depth < 8 && typeof styleGuard === 'function') { styleGuard(wornIt.id, 'livrer', () => bqDeliver(id, srcEl, depth + 1, petOK)); return; }
  if (comps.length && typeof removeComp === 'function') { for (const k of comps) if (!removeComp(k, { quiet: true, why: 'client' })) { toast('Ce compagnon ne peut pas partir pour l’instant.'); return; } }
  else if (comps.length) return;
  pets.filter(x => x.egg).forEach(x => { S.eggs = (S.eggs || []).filter(e => e.id !== x.egg); });
  alloc.filter(a => !a.pet).forEach(a => a.take.forEach(it => { const i = S.inv.indexOf(it); if (i >= 0) { S.inv.splice(i, 1); given.push(it); } }));
  s.orders = s.orders.filter(x => x !== o);
  const lv0 = s.lvl;
  s.rep += o.rep; s.served++; s.earned += o.coins;
  const cs = s.clients[c.id] || (s.clients[c.id] = {}); cs.served = (cs.served || 0) + 1; cs.last = Date.now();
  S.stats.orders = (S.stats.orders || 0) + 1;
  let bonusTxt = '';
  if (o.bonus && o.bonus.rec && !s.recipes.includes(o.bonus.rec)) { s.recipes.push(o.bonus.rec); const r = BQ_RECIPES.find(x => x.id === o.bonus.rec); bonusTxt = ` et la recette « ${r.out[0]} »`; }
  else if (o.bonus && o.bonus.def) { const it = makeItem(o.bonus.def, 1, `Cadeau de ${c.name}`, [], { fixed: Math.max(2, o.bonus.def[3]) }); S.inv.push(it); S.dex[it.name] = true; bonusTxt = ` et « ${it.name} »`; }
  gainCoins(o.coins);
  if (s.orders.length < bqSlots()) s.next = Math.min(s.next || Infinity, Date.now() + (s.served < 3 ? 60e3 : 4 * 60e3));
  s.lvl = bqLevelOf(s.rep);
  save();
  try { GAME.emit('order:done', { order: o, client: c, items: given }); } catch (e) {}
  bqHearts(srcEl);
  setTimeout(() => {
    renderTop(); renderPanel();
    if (s.lvl > lv0) bqLevelUp(s.lvl);
    else if (typeof reactionPopup === 'function') reactionPopup(S.sel, 'rire', `${c.name} repart le sourire aux lèvres ! +${o.coins} pièces, +${o.rep} réputation${bonusTxt}.`);
  }, 650);
}
function bqLevelUp(L) {
  const lv = bqLv(L);
  try { GAME.emit('rep:level', { level: L }); } catch (e) {}
  if (typeof confetti === 'function') { try { confetti(true); } catch (e) {} }
  // règle du joueur : aucune fenêtre ne s'ouvre toute seule → une notification non bloquante (les avantages restent affichés au comptoir)
  toast(`Votre boutique devient « ${lv.name} » !${(lv.perks || [])[0] ? ' ' + lv.perks[0] + '.' : ''}`);
}
function bqRefuse(id) {
  const s = bqState(), o = s.orders.find(x => x.id === id); if (!o) return;
  const c = BQC(o.client), cs = s.clients[c.id] || (s.clients[c.id] = {});
  cs.away = Date.now() + 2 * 3600e3;
  s.orders = s.orders.filter(x => x !== o);
  s.next = Math.min(s.next || Infinity, Date.now() + 5 * 60e3);
  save(); renderPanel();
  toast(`${c.name} comprend très bien et reviendra plus tard.`);
}
// le premier élément qui manque : où aller le chercher ?
function bqGo(id) {
  const s = bqState(), o = s.orders.find(x => x.id === id); if (!o) return;
  const alloc = bqAllocate(o), i = o.req.findIndex((r, j) => alloc[j].have < r.n);
  if (i < 0) return bqDeliver(id);
  const r = o.req[i];
  // œufs et compagnons : le marché mondial (ou le magasin pour un œuf)
  if (r.k === 'egg' || r.k === 'comp' || r.k === 'bait') {
    if (r.k === 'bait') { try { obFilter = 'comp'; } catch (e) {} if (typeof openSheet === 'function') openSheet('sac'); toast('Un appât, c’est un objet qui attire un compagnon : fruits, poisson, thé… Regardez « Pour mes compagnons ».'); return; }
    if (typeof openMarche === 'function') { openMarche('comp', r.sp || ''); return; }
    return openBoutique('magasin');
  }
  // un compagnon libre
  if (S.trips[S.sel] && r.k !== 'craft') {
    const free = (typeof teamIds === 'function' ? teamIds() : Object.keys(S.comps || {})).find(k => !S.trips[k]);
    if (!free) { toast('Toute l’équipe est en voyage. Attendez le retour de l’un d’eux, ou changez l’équipe au refuge !'); return; }
    selectComp(free);
  }
  const step = bqStepFor(r);
  if (!step) { openSheet('voyage'); return; }
  if (step.region) {
    closeSheet();
    if (typeof regionGo === 'function') regionGo(step.region); else openSheet('voyage');
    return;
  }
  if (step.t !== 'craft') closeSheet();
  if (typeof goDreamStep === 'function') { try { goDreamStep(step); } catch (e) { console.error(e); openSheet('voyage'); } }
  else openSheet('voyage');
  if (step.t !== 'craft') setTimeout(() => toast(`Pour ${BQC(o.client).name} : ${bqReqLabel(r).toLowerCase()} · ${bqReqWhere(r).toLowerCase()}. Choisissez la durée, puis partez !`), 900);
}
function bqStepFor(r) {
  if (r.k === 'craft') {
    const rc = RECIPES.find(x => x.id === r.id);
    if (rc && !canCraft(rc)) {
      // il manque un ingrédient : on va d'abord le chercher
      const miss = rc.ing.find(([key, n]) => ingCount(key) < n);
      if (miss && miss[0].startsWith('r:')) { const x = RG_RES[miss[0].slice(2)]; return bqStepFor({ k: 'reg', rid: x.id, src: { region: x.region } }); }
      if (miss) { const cat = bqCatFor(miss[0]); if (cat) return { t: 'visit', cat }; }
    }
    return { t: 'craft', id: r.id };
  }
  const s = r.src || {};
  if (s.cat) return { t: 'visit', cat: s.cat };
  if (s.tag) return { t: 'visit', tag: s.tag };
  if (s.place) return { t: 'place', name: s.place };
  if (s.region) { const h = bqHome(); if (h && h.id === s.region) return { t: 'visit', cat: 'marche' }; return { region: s.region }; }
  return null;
}

// ---------------- magasin ----------------
// prix réduits par la spécialité du commerce (farine à la boulangerie, vêtements à la mode, œufs à l'animalerie)
function bqCheapF(it, egg) { const T = bqType(); if (!T) return 1; if (egg) return T.eggs ? 0.8 : 1; const c = T.cheap; if (!c || !it) return 1; return (c.subs && c.subs.includes(it.sub)) || (c.cats && c.cats.includes(it.cat)) ? c.f : 1; }
function bqArticle(a) {
  const art = bqArticle0(a);
  // coup de cœur du jour : −30 %
  if (a && a.cc && art) { art.was = art.price; art.price = bqRound5(art.price * 0.7); art.cc = 1; }
  return art;
}
function bqArticle0(a) {
  if (a.k === 'o') { const sn = a.sp ? bqSpName(a.sp).toLowerCase() : '', nm = a.sp ? `Œuf ${/^[aeiouyéèh]/.test(sn) ? 'd’' : 'de '}${sn}` : 'Œuf commun'; return { egg: { sp: a.sp }, it: { name: nm, cat: 'o', rarity: a.sp ? 2 : 1 }, price: bqRound5(a.price * bqCheapF(null, 1)), name: nm }; }
  if (a.k === 'r') { const r = BQ_RECIPES.find(x => x.id === a.rec); return { rec: r, it: bqItemOf(r.out), price: r.price, name: `Recette : ${r.out[0]}` }; }
  if (a.k === 'x') return { it: a.it, price: a.price, name: a.it.name, rare: a.lt ? 0 : 1 };
  const it = bqItemOf(a.def);
  return { it, price: bqRound5(value({ ...it, id: '' }) * 1.5 * bqCheapF(it)), name: it.name };
}
// v22 : VITRINE DU JOUR. 10 à 12 articles par rayon (catalogue + objets du monde entier, LOOT), renouvelés chaque jour
// (graine dayKey), et 1 « coup de cœur » à −30 % par rayon. Les prix suivent value() × 1,5 comme le reste du magasin.
const BQ_PER = L => 10 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0);
const BQ_NOSHOP = new Set(['outil', 'coffre', 'cle', 'gemme', 'fragment']);
function bqLootPool(f) {
  const seen = new Set(), out = [];
  try { Object.values(LOOT).forEach(a => a.forEach(d => { if (!Array.isArray(d) || seen.has(d[0]) || !f(d)) return; seen.add(d[0]); out.push(d); })); } catch (e) {}
  return out;
}
function bqStock() {
  const s = bqState(), dk = dayKey(), L = s.lvl, T = bqType(), tid = T ? T.id : '';
  if (s.stock.day === dk && s.stock.lvl === L && (s.stock.type || '') === tid && s.stock.items.length && s.stock.v === 3) return s.stock.items;
  // les articles achetés aujourd'hui restent achetés, même si l'on change de commerce
  const keep = s.stock.day === dk ? new Set([...(s.stock.sold || []), ...s.stock.items.filter(x => x.sold).map(x => x.key)]) : new Set();
  seed(dk * 13 + 7 + L * 101 + [...tid].reduce((a, ch) => a + ch.charCodeAt(0) * 31, 0));
  const sh = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(srand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const per = BQ_PER(L), ok = BQ_CAT.filter(a => a.lvl <= L && !(a.k === 'r' && s.recipes.includes(a.rec)));
  const lootArt = (d, r) => { const it = bqItemOf(d); return { key: 'l' + hashStr(d[0]).toString(36), r, x: { it, lt: 1, price: bqRound5(value({ ...it, id: '' }) * 1.5 * bqCheapF(it)) } }; };
  // un rayon : environ 55 % d'articles du catalogue de la boutique, le reste en objets du monde entier
  const shelf = (r, cat, loot) => { const c = sh(cat).slice(0, Math.ceil(per * 0.55)).map(a => ({ key: a.key, r })); return sh(c.concat(sh(loot).slice(0, per - c.length).map(d => lootArt(d, r)))); };
  const rMax = Math.min(3, 1 + Math.floor(L / 2));
  const mode = shelf('mode', ok.filter(a => a.k === 'v'), bqLootPool(d => d[1] === 'v' && d[3] <= rMax && d[4]));
  const res = shelf('res', ok.filter(a => a.k === 'm'), bqLootPool(d => (d[1] === 'm' || d[1] === 'n') && d[3] <= (L >= 3 ? 2 : 1) && !BQ_NOSHOP.has(d[2])));
  const craft = shelf('craft', ok.filter(a => a.k === 'd' || a.k === 't' || a.k === 'r'), bqLootPool(d => d[1] === 'd' && d[3] <= rMax));
  // parfois un article rare d'une région (dès « Maison réputée »)
  if (L >= 2 && srand() < 0.6 && typeof REGIONS !== 'undefined') {
    const pool = []; REGIONS.forEach(R => R.res.forEach(x => { if (x.rar >= 2 && x.rar <= (L >= 5 ? 4 : 3)) pool.push(x); }));
    const x = pool[Math.floor(srand() * pool.length)];
    if (x) { const R = RG[x.region], km = kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }); const it = { name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, color: x.color, rid: x.id, origin: { region: R.id, place: R.short, km } }; (x.cat === 'v' ? mode : res).push({ key: 'x_' + x.id, r: x.cat === 'v' ? 'mode' : 'res', x: { it, price: bqRound5(value({ ...it, id: '' }) * 1.6) } }); }
  }
  // œufs : un œuf commun (espèce surprise), puis des œufs d'espèces précises ; l'animalerie en a deux communs
  const comp = [{ key: 'o_commun', r: 'comp', o: { sp: null, price: 120 } }];
  if (T && T.eggs) comp.push({ key: 'o_commun2', r: 'comp', o: { sp: null, price: 120 } });
  sh(bqSpIds()).slice(0, per - comp.length).forEach(sp => comp.push({ key: 'o_' + sp, r: 'comp', o: { sp, price: 220 } }));
  // un coup de cœur par rayon (jamais un article déjà acheté aujourd'hui)
  // un coup de cœur par rayon, parmi les articles les plus chers (jamais un article déjà acheté aujourd'hui)
  const pr = x => { try { return bqArticle0(bqStockArticle(x)).price; } catch (e) { return 0; } };
  [comp, mode, res, craft].forEach(list => { const c = list.filter(x => !keep.has(x.key)).sort((a, b) => pr(b) - pr(a)); const top = c.slice(0, Math.max(1, Math.ceil(c.length / 3))); const x = top[Math.floor(srand() * top.length)]; if (x) x.cc = 1; });
  const items = [...comp, ...mode, ...res, ...craft];
  // articles du niveau suivant : visibles mais verrouillés, pour donner envie
  if (L < BQ_LEVELS.length - 1) ['v', 'm', 'd', 't'].forEach(k => sh(BQ_CAT.filter(a => a.k === k && a.lvl === L + 1)).slice(0, 2).forEach(a => items.push({ key: a.key, locked: 1 })));
  items.forEach(x => { if (keep.has(x.key)) x.sold = 1; });
  s.stock = { day: dk, lvl: L, type: tid, items, sold: [...keep], v: 3 };
  save();
  return items;
}
function bqStockArticle(x) {
  if (x.o) return { k: 'o', sp: x.o.sp, price: x.o.price, cc: x.cc };
  if (x.x) return { k: 'x', it: x.x.it, price: x.x.price, lt: x.x.lt, cc: x.cc };
  const a = BQ_CAT.find(y => y.key === x.key); return a ? Object.assign({}, a, { cc: x.cc }) : null;
}

// v22 : MARCHANDS DE PASSAGE. Toutes les 3 heures, un client du comptoir revient d'une région lointaine (REGIONS)
// et vend 4 à 6 spécialités de là-bas (RG_RES). Encadré en haut du magasin, compte à rebours, aucune notification.
const BQ_PASS_MS = 3 * 3600e3;
const bqPassSlot = () => Math.floor(Date.now() / BQ_PASS_MS);
function bqPass() {
  if (typeof REGIONS === 'undefined' || !REGIONS.length) return null;
  const slot = bqPassSlot(), r = rng(hashStr('passage' + slot + '|' + (S.home || '')) || 1), h = bqHome(), me = homeObj();
  const far = [], other = [];
  REGIONS.forEach(R => { if (!R.res || R.res.length < 4 || R.id === 'grand_large' || (h && R.id === h.id)) return; other.push(R); try { if (kmBetween(me, { lon: R.anchor[0], lat: R.anchor[1] }) > 1500) far.push(R); } catch (e) {} });
  const pool = far.length ? far : other; if (!pool.length) return null;
  const R = pool[Math.floor(r() * pool.length)], c = BQ_CLIENTS[Math.floor(r() * BQ_CLIENTS.length)];
  // ses plus belles spécialités d'abord (les plus rares), dans un ordre mélangé
  const n = Math.min(R.res.length, 4 + Math.floor(r() * 3));
  const res = R.res.slice().sort((a, b) => b.rar - a.rar).slice(0, n); for (let i = res.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [res[i], res[j]] = [res[j], res[i]]; }
  const km = (() => { try { return kmBetween(me, { lon: R.anchor[0], lat: R.anchor[1] }); } catch (e) { return 0; } })();
  const items = res.slice(0, n).map(x => { const it = { name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, color: x.color, rid: x.id, origin: { region: R.id, place: R.short, km } }; return { id: x.id, it, price: bqRound5(value({ ...it, id: '' }) * 1.6) }; });
  const s = bqState(); if (!s.pass || typeof s.pass !== 'object' || s.pass.slot !== slot) s.pass = { slot, sold: [] };
  if (!Array.isArray(s.pass.sold)) s.pass.sold = [];
  return { slot, R, c, km, items, sold: s.pass.sold, end: (slot + 1) * BQ_PASS_MS };
}
function bqPassBuy(id, el) {
  const P = bqPass(); if (!P) return; const x = P.items.find(y => y.id === id); if (!x || P.sold.includes(id)) return;
  if (S.coins < x.price) { toast('Pas assez de pièces. Livrez une commande au Comptoir !'); return; }
  S.coins -= x.price; P.sold.push(id);
  const it = makeItem([x.it.name, x.it.cat, x.it.sub, x.it.rarity, null, x.it.color], 0, `${P.c.name}, marchand de passage`, [], { fixed: x.it.rarity });
  it.rid = x.it.rid; it.origin = Object.assign({}, x.it.origin); it.paid = x.price;
  S.inv.push(it); S.dex[it.name] = true; S.stats.shopBought = (S.stats.shopBought || 0) + 1;
  save(); bqFly(el, x.it); renderTop(); renderPanel(); toast(`Acheté à ${P.c.name} : « ${it.name} », tout droit ${rgDe(P.R)} !`);
}
function bqPassHTML() {
  const P = bqPass(); if (!P) return '';
  const cards = P.items.map(x => {
    const sold = P.sold.includes(x.id), can = S.coins >= x.price;
    return `<div class="bq-pi${sold ? ' sold' : ''}" style="--rc:${RARC[x.it.rarity] || RARC[0]}"><span class="bq-aico">${itemIcon(x.it)}</span><b>${esc(x.it.name)}</b><small>${esc(RARITY[x.it.rarity] || '')}</small>${sold ? '<span class="bq-sold">Acheté</span>' : `<button class="btn ${can ? 'gold' : 'cream'} sm" data-bqpass="${esc(x.id)}" ${can ? '' : 'disabled'}>${coins(x.price)}</button>`}</div>`;
  }).join('');
  return `<section class="bq-pass" style="--pc:${P.R.color || '#c98a5a'}"><div class="bq-ph"><img src="${clientURI(P.c, 'content')}" alt=""><div><small>Marchand de passage</small><b>${esc(P.c.name)}, tout droit ${esc(rgDe(P.R))}</b><span>Des spécialités introuvables ici${P.km ? `, à ${Math.round(P.km).toLocaleString('fr-FR')} km` : ''}. Repart dans <b data-bqcd="${P.end}">${fmtDur(P.end - Date.now())}</b></span></div></div><div class="bq-prow">${cards}</div></section>`;
}
function bqBuy(key, el) {
  const s = bqState(), x = bqStock().find(y => y.key === key); if (!x || x.sold || x.locked) return;
  const a = bqStockArticle(x); if (!a) return;
  const art = bqArticle(a);
  if (S.coins < art.price) { toast('Pas assez de pièces. Livrez une commande au Comptoir !'); return; }
  S.coins -= art.price; x.sold = 1; if (!Array.isArray(s.stock.sold)) s.stock.sold = []; if (!s.stock.sold.includes(key)) s.stock.sold.push(key);
  let msg;
  if (art.egg) { if (typeof addEgg === 'function') { const eid = addEgg({ sp: art.egg.sp || undefined, from: { how: 'magasin', place: 'La boutique' }, hatchMs: 3 * 60e3 }), eg = (S.eggs || []).find(x => x.id === eid); if (eg) eg.paid = art.price; } msg = `${art.name} acheté ! Il éclora au refuge dans 3 minutes.`; }
  else if (art.rec) { if (!s.recipes.includes(art.rec.id)) s.recipes.push(art.rec.id); msg = `Nouvelle recette à l’atelier : « ${art.rec.out[0]} » !`; }
  else {
    const it = makeItem([art.it.name, art.it.cat, art.it.sub, art.it.rarity, art.it.look, art.it.color], 0, 'La boutique', [], { fixed: art.it.rarity });
    if (art.it.rid) { it.rid = art.it.rid; it.origin = Object.assign({}, art.it.origin); } else { const h = bqHome(); if (h) it.origin = { region: h.id, place: 'La boutique', km: 0 }; }
    it.paid = art.price;
    S.inv.push(it); S.dex[it.name] = true; msg = `Acheté : « ${it.name} ». Il vous attend dans le sac.`;
  }
  S.stats.shopBought = (S.stats.shopBought || 0) + 1;
  save();
  if (!art.egg) bqFly(el, art.it);
  renderTop(); renderPanel(); toast(msg);
}

// ---------------- petites animations ----------------
function bqFX() { let l = document.getElementById('fxLayer'); if (!l) { l = document.createElement('div'); l.id = 'fxLayer'; document.body.appendChild(l); } return l; }
function bqFly(el, it) {
  try {
    if (!el || (typeof reduceMotion === 'function' && reduceMotion())) return;
    const r = el.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'bq-fly'; d.innerHTML = itemIcon(it); d.style.left = (r.left + r.width / 2 - 24) + 'px'; d.style.top = (r.top - 10) + 'px';
    bqFX().appendChild(d); setTimeout(() => d.remove(), 1100);
  } catch (e) {}
}
function bqHearts(el) {
  try {
    const card = el && el.closest ? el.closest('.bq-order') : null; if (card) card.classList.add('bq-served');
    if (!el || (typeof reduceMotion === 'function' && reduceMotion())) return;
    const r = (card || el).getBoundingClientRect(), L = bqFX();
    for (let i = 0; i < 8; i++) { const h = document.createElement('i'); h.className = 'bq-heart'; h.style.left = (r.left + 30 + Math.random() * 60) + 'px'; h.style.top = (r.top + 30 + Math.random() * 20) + 'px'; h.style.setProperty('--dx', (Math.random() * 80 - 40).toFixed(0) + 'px'); h.style.animationDelay = (i * 0.05).toFixed(2) + 's'; h.innerHTML = '<svg viewBox="0 0 20 20"><path d="M10 17.5C3 12.5 1.5 9.5 1.5 6.8 1.5 4.2 3.5 2.5 5.8 2.5c1.8 0 3.2 1 4.2 2.6 1-1.6 2.4-2.6 4.2-2.6 2.3 0 4.3 1.7 4.3 4.3 0 2.7-1.5 5.7-8.5 10.7Z" fill="#f08aa6" stroke="#5b4636" stroke-width="1.4"/></svg>'; L.appendChild(h); setTimeout(() => h.remove(), 1300); }
  } catch (e) {}
}

// ---------------- dessin des clients (portrait en buste) ----------------
// Même grammaire que les familiers (drawChar) : tête lissée, contour brun, yeux à iris et reflets,
// joues à reflet, ombrage doux par dégradés. Chaque client a sa tenue et ses accessoires (BQ_LOOK).
// viewBox 120 × 120 inchangé : la tête autour de (60, 57), les épaules en bas, les pattes posées devant.
const BQ_SP = {
  herisson: { fur: '#f0d4b0', dark: '#8a6446', light: '#fbeedd', inner: '#d9a07e', iris: '#6a4632', rx: 26, ry: 23, hy: 59, shape: 'narrow' },
  loutre: { fur: '#b08260', dark: '#7a5338', light: '#f4e0c6', inner: '#7a5338', iris: '#5a3a28', rx: 31, ry: 25, hy: 57, shape: 'wide' },
  renard: { fur: '#ee915a', dark: '#c9603a', light: '#fff5ea', inner: '#fbe2cc', iris: '#a0603a', rx: 30, ry: 25, hy: 58, shape: 'cheeks' },
  lapin: { fur: '#f6f1e8', dark: '#dccfbf', light: '#ffffff', inner: '#f6b8c8', iris: '#8a4a5a', rx: 28, ry: 25, hy: 60, shape: 'pear', nose: '#ee8fa6' },
  chouette: { fur: '#b8916f', dark: '#86603f', light: '#f6e8d2', inner: '#86603f', iris: '#e8a23a', rx: 31, ry: 27, hy: 57, shape: 'owl' },
  ours: { fur: '#a8774f', dark: '#7a5338', light: '#ecd2aa', inner: '#d9a982', iris: '#5a3a28', rx: 31, ry: 27, hy: 58, shape: 'pear' },
  souris: { fur: '#bdb7c9', dark: '#8a8496', light: '#f6f2f8', inner: '#f6b8c8', iris: '#4a3a5a', rx: 26, ry: 23, hy: 61, shape: 'narrow', nose: '#ee8fa6' },
  raton: { fur: '#aeadb9', dark: '#4e4e5c', light: '#f6f4f0', inner: '#5e5e6c', iris: '#8a6a4a', rx: 30, ry: 25, hy: 58, shape: 'cheeks', paw: '#5e5e6c', ring: 1 },
  ecureuil: { fur: '#de7f45', dark: '#b05a2f', light: '#fbe6cc', inner: '#f6c49e', iris: '#5a3a28', rx: 28, ry: 24, hy: 59, shape: 'pear' },
  blaireau: { fur: '#f4f2ee', dark: '#3f3f4b', light: '#ffffff', inner: '#9a9aa6', iris: '#7a5a3a', rx: 29, ry: 25, hy: 58, shape: 'narrow', paw: '#6a6a76', ring: 1 },
  canard: { fur: '#f7d66f', dark: '#e0ac45', light: '#fff4c8', inner: '#e0ac45', iris: '#3d4a6a', rx: 29, ry: 27, hy: 57, shape: 'round', arm: 'wing' },
  grenouille: { fur: '#94d283', dark: '#62a556', light: '#e2f4d2', inner: '#62a556', iris: '#8a5a2a', rx: 35, ry: 22, hy: 63, shape: 'wide', arm: 'frog' },
  chat: { fur: '#eda866', dark: '#c97a3a', light: '#fff5ea', inner: '#f6b8c8', iris: '#7aa34a', rx: 30, ry: 25, hy: 58, shape: 'cheeks', nose: '#ee8fa6' },
  chien: { fur: '#ecd3a5', dark: '#b88758', light: '#fffaf2', inner: '#b88758', iris: '#6a4632', rx: 29, ry: 26, hy: 58, shape: 'round' },
  mouton: { fur: '#f3dcc6', dark: '#cfae92', light: '#fff4ea', inner: '#f6c2cf', iris: '#7a5a3a', rx: 24, ry: 23, hy: 61, shape: 'narrow', nose: '#d99a9a', wool: '#fbf8f0' },
  faon: { fur: '#cf9660', dark: '#a06a3a', light: '#fdf0de', inner: '#fbe2cc', iris: '#5a3a28', rx: 27, ry: 25, hy: 59, shape: 'narrow' },
  koala: { fur: '#adaebb', dark: '#7a7b88', light: '#f0f0f4', inner: '#f8f6fa', iris: '#4a3a3a', rx: 30, ry: 25, hy: 60, shape: 'pear' },
  pingouin: { fur: '#454b64', dark: '#2a2e40', light: '#fbfbf6', inner: '#2a2e40', iris: '#3d5a8a', rx: 29, ry: 26, hy: 58, shape: 'round', arm: 'flip' },
  hamster: { fur: '#f3c48e', dark: '#d99a5f', light: '#fffaf0', inner: '#f6b8c8', iris: '#4a3028', rx: 32, ry: 25, hy: 60, shape: 'puffy', nose: '#ee8fa6' },
  tortue: { fur: '#a3cf90', dark: '#6f9f5f', light: '#e0f0d2', inner: '#6f9f5f', iris: '#5a4a2a', rx: 25, ry: 23, hy: 54, shape: 'round', arm: 'frog' },
};
// tenue de chaque client : g = vêtement, c2 = 2e couleur, pat = motif, hat = forme du chapeau, x = petits accessoires
const BQ_LOOK = {
  noisette: { g: 'tablier', c2: '#fff8ee', x: ['coeurpoche'] },
  ondine: { g: 'marin', c2: '#fbf8f0', x: [] },
  roussette: { g: 'robe', c2: '#fbf0ff', x: ['boucles'] },
  pompon: { g: 'salopette', c2: '#f6ead0', pat: 'carreaux', hat: 'paille', x: ['carotte'] },
  hulotte: { g: 'cardigan', c2: '#fbf6ea', x: ['plume', 'broche'] },
  bruno: { g: 'pull', pat: 'torsade', x: [] },
  mimi: { g: 'robe', c2: '#fffaf6', pat: 'pois', x: [] },
  filou: { g: 'gilet', c2: '#e9e2d0', pat: 'raye', x: ['sac', 'cle'] },
  chips: { g: 'sweat', c2: '#fff3d0', x: ['bandeau', 'sacados'] },
  gaston: { g: 'salopette', c2: '#f3d9b0', pat: 'carreaux', x: ['crayon', 'outil'] },
  capucine: { g: 'cardigan', c2: '#fff6f0', x: ['collier'] },
  rainette: { g: 'cape', c2: '#f39ab0', x: ['collier'] },
  moustache: { g: 'veste', c2: '#fbf8f0', x: ['noeudpap', 'mouchoir', 'montre'] },
  biscotte: { g: 'sweat', c2: '#fffaf2', x: ['medaille'] },
  frisette: { g: 'cardigan', c2: '#fff8f0', pat: 'pois', x: ['broche'] },
  clochette: { g: 'cape', c2: '#fbf3e0', x: ['couronne'] },
  eucalypso: { g: 'gilet', c2: '#f4ead4', hat: 'explo', x: ['camera', 'badge'] },
  pingo: { g: 'doudoune', c2: '#fbf8f0', x: ['masqueski'] },
  grignote: { g: 'pull', pat: 'raye', c2: '#fffaf0', x: ['bourse'] },
  leonie: { g: 'chale', c2: '#f6eefa', x: ['demilune'] },
};
const bqHash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
function bqLookOf(c) {
  if (c.look && typeof c.look === 'object') return c.look;
  if (BQ_LOOK[c.id]) return BQ_LOOK[c.id];
  const h = bqHash(c.id + (c.cloth || ''));
  return { g: ['pull', 'gilet', 'tablier', 'robe', 'veste', 'sweat', 'cardigan', 'salopette', 'cape', 'chale', 'marin', 'doudoune'][h % 12], pat: ['', 'raye', 'pois', 'carreaux', 'torsade'][(h >> 5) % 5],
    c2: ['#fbf8f0', '#fff3d0', '#e6f0f8', '#fde8ee', '#eef6e2'][(h >> 8) % 5], x: [['sac'], ['badge'], ['collier'], ['noeudpap'], ['bourse'], ['broche'], ['boucles'], ['camera'], []][(h >> 11) % 9] };
}
function bqHeadD(P) {
  const { rx, ry, hy } = P, N = 44, pts = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a); let r = 1, xk = 1, yk = 1;
    if (P.shape === 'cheeks' && sa > 0.15 && sa < 0.8 && Math.abs(ca) > 0.55) r = i % 2 ? 1.09 : 1;
    else if (P.shape === 'puffy') { if (sa > 0) xk = 1 + 0.07 * sa; else yk = 0.96; }
    else if (P.shape === 'pear' && sa > 0) xk = 1 + 0.05 * sa;
    else if (P.shape === 'narrow' && sa > 0) xk = 1 - 0.1 * sa;
    else if (P.shape === 'wide' && sa < 0) yk = 0.88;
    else if (P.shape === 'owl' && sa < 0) xk = 1 - 0.05 * sa;
    pts.push([60 + ca * rx * r * xk, P.hy + sa * ry * r * yk]);
  }
  return smooth(pts);
}
// petit nuage (laine, fourrure) : contour extérieur seul
const bqCloud = (pts, fill, L) => `<g>${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${L}" stroke-width="1.8"/>`).join('')}${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${(r - 1).toFixed(1)}" fill="${fill}"/>`).join('')}</g>`;
const bqMir = s => `${s}<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`;
const BQ_SVGC = new Map(), BQ_URIC = new Map();
function clientSVG(c, mood, uid) {
  const look = bqLookOf(c), key = [c.id, c.sp, c.cloth, c.acc, c.accC, look.g, mood, uid || ''].join('|');
  const hit = BQ_SVGC.get(key); if (hit) return hit;
  if (BQ_SVGC.size > 240) BQ_SVGC.clear();
  const s = bqDrawClient(c, mood, uid, look); BQ_SVGC.set(key, s); return s;
}
function bqDrawClient(c, mood, uid, look) {
  const P = BQ_SP[c.sp] || BQ_SP.ours, sp = BQ_SP[c.sp] ? c.sp : 'ours';
  const L = '#5b4636', sw = `stroke="${L}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`, s1 = `stroke="${L}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`;
  const joy = mood === 'joie', u = 'bq' + String(uid || c.id).replace(/[^\w-]/g, '');
  const { rx, ry, hy } = P, top = hy - ry, H = bqHeadD(P), F = `url(#${u}hg)`;
  const C = c.cloth || '#9cc3e8', C2 = look.c2 || '#fbf8f0', A = c.accC || '#f39ab0', CG = `url(#${u}cg)`, X = look.x || [];
  const BODY = 'M12 121 C13 103 24 91 42 87 Q60 83 78 87 C96 91 107 103 108 121Z';
  let s = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="bq-cl" role="img" aria-label="${esc(c.name)}, ${BQ_SPN[c.sp] || ''}"><defs>`
    + `<radialGradient id="${u}hg" gradientUnits="userSpaceOnUse" cx="${60 - rx * 0.3}" cy="${top + ry * 0.55}" r="${rx * 1.55}"><stop offset="0" stop-color="${shade(P.fur, 1.13)}"/><stop offset=".55" stop-color="${P.fur}"/><stop offset="1" stop-color="${shade(P.fur, 0.85)}"/></radialGradient>`
    + `<linearGradient id="${u}cg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${shade(C, 1.12)}"/><stop offset="1" stop-color="${shade(C, 0.88)}"/></linearGradient>`
    + `<clipPath id="${u}hc"><path d="${H}"/></clipPath><clipPath id="${u}bc"><path d="${BODY}"/></clipPath></defs>`;
  // ---- dos : piquants, queue, carapace, laine ----
  if (sp === 'herisson') {
    const layer = (r1, r2, off, fill) => { let d = ''; for (let k = 0; k <= 20; k++) { const a = (160 + k * 11 + off) * Math.PI / 180, b1 = a - 0.09, b2 = a + 0.09; d += `${k ? 'L' : 'M'}${(60 + Math.cos(b1) * r2).toFixed(1)} ${(hy - 2 + Math.sin(b1) * r2).toFixed(1)} L${(60 + Math.cos(a) * r1).toFixed(1)} ${(hy - 2 + Math.sin(a) * r1).toFixed(1)} L${(60 + Math.cos(b2) * r2).toFixed(1)} ${(hy - 2 + Math.sin(b2) * r2).toFixed(1)} `; } return `<path d="${d}L60 ${hy}Z" fill="${fill}" ${sw}/>`; };
    s += layer(42, 28, 0, P.dark) + layer(36, 24, 5.5, shade(P.dark, 1.25));
    let t = ''; for (let k = 1; k < 20; k += 2) { const a = (160 + k * 11 + 5.5) * Math.PI / 180; t += `M${(60 + Math.cos(a) * 29).toFixed(1)} ${(hy - 2 + Math.sin(a) * 29).toFixed(1)} L${(60 + Math.cos(a) * 34).toFixed(1)} ${(hy - 2 + Math.sin(a) * 34).toFixed(1)} `; }
    s += `<path d="${t}" stroke="#f3dcc0" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
  }
  if (sp === 'ecureuil') s += plume([90, 121], [116, 104], [117, 54], [95, 38], 11, 14, P.fur, P.light, 0.22, L, 'bqtail');
  if (sp === 'tortue') {
    s += `<path d="M5 121 C3 90 26 74 60 74 C94 74 117 90 115 121Z" fill="#a8793f" ${sw}/><path d="M11 121 C11 95 30 80 60 80 C90 80 109 95 109 121Z" fill="#d4aa66"/>`
      + `<path d="M5 112 l6 -1 M7 99 l6 2 M14 87 l5 4 M26 79 l3 5 M115 112 l-6 -1 M113 99 l-6 2 M106 87 l-5 4 M94 79 l-3 5" stroke="${L}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`
      + `<path d="M18 104 L26 92 L40 86 M102 104 L94 92 L80 86" fill="none" stroke="#a8793f" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  if (sp === 'mouton') { const w = []; for (let k = 0; k <= 9; k++) { const a = (165 + k * 23.3) * Math.PI / 180; w.push([+(60 + Math.cos(a) * 30).toFixed(1), +(hy - 3 + Math.sin(a) * 28).toFixed(1), 10]); } s += bqCloud(w, P.wool, L); }
  // ---- corps et vêtement ----
  s += `<g clip-path="url(#${u}bc)">` + bqGarment(look, C, C2, A, CG, L, s1) + `<ellipse cx="60" cy="86" rx="25" ry="6.5" fill="#3a2a22" opacity=".13"/><ellipse cx="27" cy="100" rx="7" ry="4" fill="#fff" opacity=".16" transform="rotate(-30 27 100)"/></g>`;
  s += `<path d="${BODY}" fill="none" ${sw}/>`;
  // ---- autour du cou (avant la tête) ----
  if (look.g === 'doudoune' && c.acc !== 'echarpe') { const f = []; for (let k = 0; k <= 8; k++) { const a = (200 - k * 27.5) * Math.PI / 180; f.push([+(60 + Math.cos(a) * 26).toFixed(1), +(82 - Math.sin(a) * 9).toFixed(1), 5.5]); } s += bqCloud(f, '#fbf4e6', L); }
  if (sp === 'tortue') s += `<path d="M48 70 L46 92 Q60 97 74 92 L72 70Z" fill="${F}" ${sw}/><path d="M51 82 q9 3 18 0 M50 87 q10 3 20 0" fill="none" stroke="${P.dark}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  s += bqNeck(c.acc, X, look, A, C, C2, L, sw, s1);
  // ---- oreilles (derrière la tête) ----
  s += bqEars(sp, P, F, L, sw, s1, top, false);
  // ---- tête ----
  if (sp === 'grenouille') s += `<path d="${H}" fill="${F}" ${sw}/>` + bqMir(`<circle cx="46" cy="${hy - 17}" r="10.5" fill="${F}" ${sw}/><ellipse cx="46" cy="${hy - 9.5}" rx="9" ry="4.4" fill="${F}"/>`);
  else s += `<path d="${H}" fill="${F}"/>`;
  s += `<g clip-path="url(#${u}hc)">${bqMarks(sp, P, top, L)}${X.includes('bandeau') ? `<rect x="20" y="${top + 4}" width="80" height="7" fill="${A === '#f39ab0' ? '#e5584f' : A}"/><path d="M20 ${top + 7.5} H100" stroke="#fff" stroke-width="1.6" opacity=".9"/>` : ''}${X.includes('masqueski') ? `<rect x="20" y="${top + 6}" width="80" height="4" fill="#3d4258"/>` : ''}</g>`;
  if (sp !== 'grenouille') s += `<path d="${H}" fill="none" ${sw}/>`;
  if (X.includes('bandeau')) s += `<path d="M${60 - rx + 2} ${top + 4.5} Q60 ${top - 1} ${60 + rx - 2} ${top + 4.5} M${60 - rx + 1} ${top + 11} Q60 ${top + 5} ${60 + rx - 1} ${top + 11}" fill="none" stroke="${L}" stroke-width="1.2" opacity=".55"/>`;
  // ---- visage ----
  s += bqFace(sp, P, joy, u, L, s1, top);
  if (sp === 'mouton') s += bqCloud([[42, top + 9, 6], [49, top + 3, 7], [60, top + 1, 7.5], [71, top + 3, 7], [78, top + 9, 6]], P.wool, L) + `<path d="M46 ${top + 4} q3 -3 6 0 M57 ${top + 1} q3 -3 6 0 M68 ${top + 4} q3 -3 6 0" fill="none" stroke="#d9cbb8" stroke-width="1.3" stroke-linecap="round"/>`;
  s += bqEars(sp, P, F, L, sw, s1, top, true);
  // ---- chapeau, lunettes, fleur ----
  s += bqHeadAcc(c.acc, X, look, sp, P, A, C, L, sw, s1, top);
  if (sp === 'lapin') s += bqEars('lapinH', P, F, L, sw, s1, top, false);
  // ---- bras et pattes ----
  s += bqArms(P, look, C, C2, CG, L, sw, s1);
  s += bqFront(X, A, C, L, sw, s1);
  return s + `</svg>`;
}
function bqGarment(look, C, C2, A, CG, L, s1) {
  const base = col => `<rect x="0" y="78" width="120" height="44" fill="${col}"/>`;
  const dk = shade(C, 0.8), col2 = `<path d="M49 86 L54 95 L60 89 L66 95 L71 86" fill="${C2}" ${s1}/>`;
  const pat = (p, col, on) => {
    if (p === 'raye') return `<path d="M0 101 H120 M0 110 H120 M0 119 H120" stroke="${col}" stroke-width="3.6" opacity="${on || 0.75}"/>`;
    if (p === 'pois') { let d = ''; for (let y = 94; y < 122; y += 8) for (let x = (y / 8) % 2 ? 6 : 10; x < 120; x += 9) d += `<circle cx="${x}" cy="${y}" r="1.5"/>`; return `<g fill="${col}" opacity="${on || 0.8}">${d}</g>`; }
    if (p === 'carreaux') return `<path d="M0 93 H120 M0 101 H120 M0 109 H120 M0 117 H120 M20 80 V122 M28 80 V122 M36 80 V122 M44 80 V122 M52 80 V122 M60 80 V122 M68 80 V122 M76 80 V122 M84 80 V122 M92 80 V122 M100 80 V122" stroke="${col}" stroke-width="2.2" opacity="${on || 0.45}"/>`;
    if (p === 'torsade') return [44, 76].map(x => `<path d="M${x} 92 q4 3 0 6 q-4 3 0 6 q4 3 0 6 q-4 3 0 6 q4 3 0 6" fill="none" stroke="${shade(C, 0.78)}" stroke-width="1.8" stroke-linecap="round"/><path d="M${x} 92 q-4 3 0 6 q4 3 0 6 q-4 3 0 6 q4 3 0 6 q-4 3 0 6" fill="none" stroke="${shade(C, 1.2)}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`).join('') + `<path d="M54 94 V122 M66 94 V122" stroke="${shade(C, 0.85)}" stroke-width="1.2" stroke-dasharray="1.6 1.6"/>`;
    return '';
  };
  const strap = (d, col, w = 3.6) => `<path d="${d}" fill="none" stroke="${L}" stroke-width="${w + 2.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const rib = `<path d="M41 88 Q60 98 79 88" fill="none" stroke="${L}" stroke-width="7.5" stroke-linecap="round"/><path d="M41 88 Q60 98 79 88" fill="none" stroke="${shade(C, 0.86)}" stroke-width="5" stroke-linecap="round"/><path d="M41 88 Q60 98 79 88" fill="none" stroke="${shade(C, 0.7)}" stroke-width="5" stroke-dasharray=".8 2.2"/>`;
  switch (look.g) {
    case 'tablier': return base(CG) + col2 + strap('M45 97 L47 87 M75 97 L73 87', C2, 3)
      + `<path d="M40 97 Q60 92 80 97 L85 122 H35Z" fill="${C2}" ${s1}/><path d="M41 99.5 Q60 95 79 99.5" fill="none" stroke="${A}" stroke-width="2.2" stroke-dasharray="0.1 3.4" stroke-linecap="round"/>`
      + `<path d="M51 105 H69 V113 Q60 117 51 113Z" fill="${shade(C2, 0.95)}" ${s1}/>` + ((look.x || []).includes('coeurpoche') ? `<path d="${heartD(60, 109.5, 2.6)}" fill="${A}"/>` : '');
    case 'salopette': return base(C2) + pat(look.pat || 'carreaux', shade(C2, 0.7)) + col2
      + `<path d="M44 99 H76 L79 122 H41Z" fill="${CG}" ${s1}/>` + strap('M46 100 L41 86 M74 100 L79 86', C)
      + `<circle cx="46.5" cy="101" r="2.2" fill="#f2c14e" ${s1}/><circle cx="73.5" cy="101" r="2.2" fill="#f2c14e" ${s1}/><rect x="52" y="105" width="16" height="10" rx="2" fill="${shade(C, 0.92)}" ${s1}/><path d="M53.6 106.6 H66.4" stroke="${shade(C, 1.35)}" stroke-width="1" stroke-dasharray="1.6 1.4"/>`;
    case 'gilet': return base(C2) + pat(look.pat, shade(C2, 0.82), 0.5) + col2
      + bqMir(`<path d="M0 78 H45 C47 92 52 104 57 114 L57 122 H0Z" fill="${CG}" ${s1}/><path d="M28 104 h13 v8 h-13Z" fill="${shade(C, 0.92)}" ${s1}/><path d="M28 104 h13 l-1.5 4 h-10Z" fill="${dk}" ${s1}/><circle cx="53.5" cy="106" r="1.6" fill="${shade(C, 0.6)}"/><circle cx="56" cy="114" r="1.6" fill="${shade(C, 0.6)}"/>`);
    case 'cardigan': return base(C2) + `<path d="M50 86 Q53 95 60 92 Q67 95 70 86" fill="none" stroke="${shade(C2, 0.85)}" stroke-width="1.4"/>`
      + bqMir(`<path d="M0 78 H48 C50 92 53 104 55 122 H0Z" fill="${CG}" ${s1}/><path d="M48.5 82 C50.5 94 53 106 54.5 122" fill="none" stroke="${shade(C, 0.84)}" stroke-width="3.2"/>${look.pat === 'pois' ? `<g fill="${shade(C, 1.3)}"><circle cx="30" cy="98" r="1.4"/><circle cx="40" cy="104" r="1.4"/><circle cx="24" cy="110" r="1.4"/><circle cx="36" cy="116" r="1.4"/><circle cx="44" cy="94" r="1.4"/></g>` : ''}<circle cx="51.5" cy="100" r="1.7" fill="${C2}" ${s1}/><circle cx="53" cy="111" r="1.7" fill="${C2}" ${s1}/>`);
    case 'pull': return base(CG) + pat(look.pat, look.pat === 'raye' ? C2 : shade(C, 0.8)) + rib;
    case 'robe': return base(CG) + pat(look.pat, shade(C, 1.32)) + bqMir(`<path d="M60 88 C57 97 46 98 42 89 C48 90 55 89 60 88Z" fill="${C2}" ${s1}/>`) + `<circle cx="60" cy="101" r="1.7" fill="${C2}" ${s1}/><circle cx="60" cy="110" r="1.7" fill="${C2}" ${s1}/>`;
    case 'veste': return base(CG) + `<path d="M47 86 L60 112 L73 86Z" fill="${C2}" ${s1}/>` + bqMir(`<path d="M46 85 L60 112 L49 104 L41 97 L48 93Z" fill="${shade(C, 0.78)}" ${s1}/><path d="M24 104 h12" stroke="${shade(C, 0.7)}" stroke-width="1.6" stroke-linecap="round"/>`) + `<circle cx="60" cy="116" r="1.8" fill="${shade(C, 0.55)}"/>`;
    case 'marin': return base(CG) + bqMir(`<path d="M46 85 L58 104 L46 100 L40 94 L47 92Z" fill="${shade(C, 0.8)}" ${s1}/><circle cx="52" cy="104" r="1.9" fill="#f2c14e" ${s1}/><circle cx="51" cy="113" r="1.9" fill="#f2c14e" ${s1}/><path d="M14 98 Q22 90 32 91 L33 97 Q24 97 17 103Z" fill="#f2c14e" ${s1}/><path d="M17 103 l-1 4 M20 100 l-1 4 M23 98 l-.5 4" stroke="#c9963a" stroke-width="1.2" stroke-linecap="round"/>`) + `<path d="M53 86 Q60 92 67 86 L64 96 Q60 98 56 96Z" fill="${C2}" ${s1}/>`;
    case 'doudoune': return base(CG) + `<path d="M6 103 Q60 111 114 103 M4 115 Q60 123 116 115" fill="none" stroke="${shade(C, 0.75)}" stroke-width="1.6"/><path d="M14 98 Q60 106 106 98 M10 110 Q60 118 110 110" fill="none" stroke="#fff" stroke-width="2.4" opacity=".22"/><path d="M60 90 V122" stroke="${shade(C, 0.62)}" stroke-width="1.6"/><rect x="58.3" y="96" width="3.4" height="6" rx="1.4" fill="#e9e2d0" ${s1}/>`;
    case 'chale': return base(C2) + `<path d="M51 87 Q60 94 69 87" fill="none" stroke="${shade(C2, 0.8)}" stroke-width="1.4"/>`
      + `<path d="M0 90 C22 85 44 86 60 92 C76 86 98 85 120 90 V106 C96 104 72 108 60 121 C48 108 24 104 0 106Z" fill="${CG}" ${s1}/><path d="M6 101 C26 99 46 103 60 114 C74 103 94 99 114 101" fill="none" stroke="${shade(C, 1.3)}" stroke-width="1.6" stroke-dasharray="0.1 4" stroke-linecap="round"/><path d="M57 119 l-1 3 M60 121 v2 M63 119 l1 3" stroke="${shade(C, 0.75)}" stroke-width="1.4" stroke-linecap="round"/>`;
    case 'cape': return base(CG) + [-60, -32, 0, 32, 60].map(a => `<ellipse cx="60" cy="98" rx="6" ry="11" transform="rotate(${a} 60 86)" fill="${shade(C, 0.9)}" ${s1}/>`).join('') + `<circle cx="60" cy="95" r="3.4" fill="${C2}" ${s1}/><circle cx="59" cy="94" r="1" fill="#fff" opacity=".8"/>`;
    case 'sweat': return base(CG) + `<path d="M36 88 Q60 101 84 88" fill="none" stroke="${L}" stroke-width="9.4" stroke-linecap="round"/><path d="M36 88 Q60 101 84 88" fill="none" stroke="${shade(C, 0.86)}" stroke-width="7" stroke-linecap="round"/>`
      + `<path d="M54 96 V107 M66 96 V107" stroke="${C2}" stroke-width="1.6" stroke-linecap="round"/><rect x="52.8" y="106" width="2.4" height="3.4" rx="1" fill="${shade(C2, 0.8)}"/><rect x="64.8" y="106" width="2.4" height="3.4" rx="1" fill="${shade(C2, 0.8)}"/><path d="M40 122 L44 112 Q60 109 76 112 L80 122" fill="${shade(C, 0.93)}" ${s1}/>`;
    default: return base(CG) + col2;
  }
}
function bqNeck(acc, X, look, A, C, C2, L, sw, s1) {
  let s = '';
  if (acc === 'echarpe') {
    const st = lumHex(A) > 0.7 ? shade(A, 0.8) : shade(A, 1.35);
    s += `<path d="M71 92 L74 117 L83 115 L80 90Z" fill="${A}" ${sw}/><path d="M73 104 L81 103 M73.8 109 L82 108" stroke="${st}" stroke-width="2.2"/><path d="M75 117 l-.5 3 M78 116.5 v3 M81 116 l.5 3" stroke="${L}" stroke-width="1.3" stroke-linecap="round"/>`
      + `<path d="M35 84 Q60 95 85 84 L87 92 Q60 104 33 92Z" fill="${A}" ${sw}/><path d="M42 89 Q60 98 78 89" fill="none" stroke="${st}" stroke-width="2.2" stroke-dasharray="3 3"/>`;
  }
  if (acc === 'perles') {
    const strand = (dy, n, r) => { let g = ''; for (let i = 0; i <= n; i++) { const t = i / n, x = 42 + t * 36, y = 88 + dy + Math.sin(t * Math.PI) * (6 + dy); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${A}" stroke="${L}" stroke-width="1"/><circle cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.32).toFixed(1)}" fill="#fff"/>`; } return g; };
    s += strand(0, 9, 2.3) + (look.g === 'chale' ? strand(4, 10, 2) : '');
  }
  if (X.includes('medaille')) s += `<path d="M38 85 Q60 96 82 85" fill="none" stroke="${L}" stroke-width="5.6" stroke-linecap="round"/><path d="M38 85 Q60 96 82 85" fill="none" stroke="#5c6b94" stroke-width="3.4" stroke-linecap="round"/><circle cx="60" cy="96" r="4.2" fill="#f2c14e" ${s1}/><path d="${heartD(60, 96, 1.8)}" fill="#e5584f"/>`;
  if (X.includes('collier')) s += `<path d="M44 87 Q60 99 76 87" fill="none" stroke="#c9a35a" stroke-width="1.2"/><path d="M60 95 q-3.2 3.6 0 7.2 q3.2 -3.6 0 -7.2Z" fill="${A}" ${s1}/><circle cx="59" cy="97.6" r=".9" fill="#fff"/>`;
  if (X.includes('noeudpap')) s += `<g transform="translate(60 91)"><path d="M0 0 L-8 -4.5 Q-9.6 0 -8 4.5Z M0 0 L8 -4.5 Q9.6 0 8 4.5Z" fill="${A}" ${s1}/><rect x="-2" y="-2.2" width="4" height="4.4" rx="1.2" fill="${shade(A, 0.82)}" ${s1}/></g>`;
  if (X.includes('camera')) s += `<path d="M40 88 L51 102 M80 88 L69 102" stroke="${L}" stroke-width="1.6"/><rect x="49" y="99" width="22" height="14" rx="3" fill="#4a4a56" ${s1}/><rect x="52" y="97" width="6" height="3" rx="1" fill="#4a4a56" ${s1}/><circle cx="60" cy="106" r="4.6" fill="#7fb6d9" ${s1}/><circle cx="58.6" cy="104.6" r="1.4" fill="#fff" opacity=".85"/><circle cx="67" cy="102" r="1" fill="#f2c14e"/>`;
  if (X.includes('cle')) s += `<path d="M46 87 L58 100 M74 87 L62 100" stroke="#a87a50" stroke-width="1.2"/><circle cx="60" cy="102" r="3" fill="none" stroke="#e3b94a" stroke-width="2"/><path d="M60 105 V112 M60 109 h2.6 M60 111.4 h2" stroke="#e3b94a" stroke-width="2" stroke-linecap="round"/>`;
  if (X.includes('bourse')) s += `<path d="M46 87 L56 99 M74 87 L64 99" stroke="#a87a50" stroke-width="1.2"/><path d="M55 100 Q60 97 65 100 Q70 108 65 112 H55 Q50 108 55 100Z" fill="#c98a5a" ${s1}/><path d="M55.5 101 Q60 103 64.5 101" fill="none" stroke="${L}" stroke-width="1.2"/><circle cx="60" cy="107" r="2.6" fill="#f2c14e" ${s1}/>`;
  if (X.includes('sacados')) s += `<path d="M36 89 L33 122 M84 89 L87 122" stroke="${L}" stroke-width="6" stroke-linecap="round"/><path d="M36 89 L33 122 M84 89 L87 122" stroke="#c9603a" stroke-width="3.8" stroke-linecap="round"/>`;
  if (X.includes('sac')) s += `<path d="M84 88 L34 122" stroke="${L}" stroke-width="5.4" stroke-linecap="round"/><path d="M84 88 L34 122" stroke="#a87a50" stroke-width="3.4" stroke-linecap="round"/>`;
  return s;
}
function bqEars(sp, P, F, L, sw, s1, top, front) {
  const { rx, hy } = P;
  if (front) {
    if (sp === 'chien') return bqMir(`<path d="M39 ${top + 3} C26 ${top + 1} 21 ${hy + 6} 25 ${hy + 16} C29 ${hy + 22} 37 ${hy + 15} 40 ${hy + 2} C41 ${hy - 8} 43 ${top + 6} 39 ${top + 3}Z" fill="${P.dark}" ${sw}/><path d="M33 ${top + 10} C29 ${hy} 29 ${hy + 9} 31 ${hy + 13}" fill="none" stroke="${shade(P.dark, 1.25)}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`);
    return '';
  }
  const pointy = (inner, tip) => bqMir(`<path d="M35 ${hy - 7} Q30 ${top - 6} 34 ${top - 16} Q46 ${top - 10} 55 ${top + 3}Z" fill="${F}" ${sw}/><path d="M38.5 ${hy - 11} Q35 ${top - 4} 36.4 ${top - 10} Q45 ${top - 6} 50.5 ${top + 3.5}Z" fill="${inner}"/>${tip ? `<path d="M33.4 ${top - 9} Q33.4 ${top - 13.5} 34 ${top - 16} Q39 ${top - 13} 42.4 ${top - 10.4} Q38 ${top - 8.4} 33.4 ${top - 9}Z" fill="${tip}" ${s1}/>` : ''}`);
  switch (sp) {
    case 'renard': return pointy(P.inner, '#6b4a3c');
    case 'chat': return pointy(P.inner) + bqMir(`<path d="M39 ${top} l3 4 M37.5 ${top - 4} l3.5 3" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`);
    case 'raton': return bqMir(`<path d="M35 ${hy - 9} Q31 ${top - 3} 35 ${top - 11} Q46 ${top - 6} 53 ${top + 4}Z" fill="${F}" ${sw}/><path d="M38.5 ${hy - 12} Q35.5 ${top - 1} 37 ${top - 6} Q44.5 ${top - 3} 49.5 ${top + 4}Z" fill="${P.inner}" stroke="${P.light}" stroke-width="1.6" stroke-linejoin="round"/>`);
    case 'ecureuil': return bqMir(`<path d="M37 ${hy - 10} Q34 ${top - 3} 36.5 ${top - 10} Q47 ${top - 5} 52 ${top + 4}Z" fill="${F}" ${sw}/><path d="M39.5 ${hy - 13} Q37.5 ${top - 1} 38.4 ${top - 5} Q45 ${top - 2} 49 ${top + 4}Z" fill="${P.inner}"/><path d="M36.5 ${top - 10} q-3 -4 -1 -8 M36.5 ${top - 10} q1 -5 4.5 -6.6 M36.5 ${top - 10} q-.5 -6 1.5 -8.6" fill="none" stroke="${P.dark}" stroke-width="1.8" stroke-linecap="round"/>`);
    case 'ours': return bqMir(`<circle cx="${60 - rx + 6}" cy="${top + 5}" r="8.5" fill="${F}" ${sw}/><circle cx="${60 - rx + 6.5}" cy="${top + 5.5}" r="4.6" fill="${P.inner}"/>`);
    case 'loutre': return bqMir(`<circle cx="${60 - rx + 3}" cy="${hy - 12}" r="4.8" fill="${F}" ${sw}/><circle cx="${60 - rx + 3.4}" cy="${hy - 11.6}" r="2.2" fill="${P.inner}"/>`);
    case 'herisson': return bqMir(`<circle cx="40" cy="${top + 4}" r="5" fill="${F}" ${sw}/><circle cx="40.4" cy="${top + 4.4}" r="2.5" fill="${P.inner}"/>`);
    case 'hamster': return bqMir(`<circle cx="${60 - rx + 9}" cy="${top + 4}" r="6.4" fill="${F}" ${sw}/><circle cx="${60 - rx + 9.4}" cy="${top + 4.6}" r="3.6" fill="${P.inner}"/>`);
    case 'blaireau': return bqMir(`<circle cx="${60 - rx + 6}" cy="${top + 7}" r="5.4" fill="${P.dark}" ${sw}/><path d="M${60 - rx + 2} ${top + 4} q4 -3.4 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
    case 'souris': return bqMir(`<circle cx="${60 - rx + 1}" cy="${top + 1}" r="13.5" fill="${F}" ${sw}/><circle cx="${60 - rx + 2}" cy="${top + 2}" r="8.6" fill="${P.inner}"/><ellipse cx="${60 - rx}" cy="${top - 1}" rx="3.4" ry="2.2" fill="#fff" opacity=".45"/>`);
    case 'koala': { const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 13.5 * (i % 2 ? 1.07 : 0.98); pts.push([60 - rx + 1 + Math.cos(a) * r, top + 5 + Math.sin(a) * r]); } const ip = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 8 * (i % 2 ? 1.12 : 0.95); ip.push([60 - rx + 2 + Math.cos(a) * r, top + 6 + Math.sin(a) * r]); } return bqMir(`<path d="${smooth(pts)}" fill="${F}" ${sw}/><path d="${smooth(ip)}" fill="${P.inner}"/>`); }
    case 'chouette': return bqMir(`<path d="M37 ${top + 9} L28 ${top - 8} Q40 ${top - 4} 49 ${top + 4}Z" fill="${P.dark}" ${sw}/><path d="M33 ${top - 2} L40 ${top + 4}" stroke="${shade(P.dark, 1.3)}" stroke-width="1.4" stroke-linecap="round"/>`);
    case 'faon': return bqMir(`<g transform="rotate(-28 ${60 - rx + 2} ${top + 8})"><ellipse cx="${60 - rx - 6}" cy="${top + 8}" rx="13" ry="6.6" fill="${F}" ${sw}/><ellipse cx="${60 - rx - 5}" cy="${top + 8}" rx="8.6" ry="3.6" fill="${P.inner}"/></g>`);
    case 'mouton': return bqMir(`<g transform="rotate(18 ${60 - rx} ${hy - 4})"><ellipse cx="${60 - rx - 6}" cy="${hy - 4}" rx="9.5" ry="4.6" fill="${F}" ${sw}/><ellipse cx="${60 - rx - 5.5}" cy="${hy - 4}" rx="6" ry="2.4" fill="${P.inner}"/></g>`);
    case 'lapinH': return `<g transform="rotate(-9 51 ${top + 4})"><path d="M47 ${top + 6} C41 ${top - 12} 40 ${top - 28} 46 ${top - 31} C52 ${top - 33} 57 ${top - 14} 56 ${top + 5}Z" fill="${F}" ${sw}/><path d="M48.6 ${top + 2} C45 ${top - 12} 44.6 ${top - 24} 47 ${top - 26} C50.4 ${top - 27} 53 ${top - 12} 53 ${top + 2}Z" fill="${P.inner}"/></g>`
      + `<g transform="rotate(16 69 ${top + 4})"><path d="M64 ${top + 5} C63 ${top - 14} 68 ${top - 30} 73 ${top - 30} C78 ${top - 30} 76 ${top - 12} 73 ${top + 6}Z" fill="${F}" ${sw}/><path d="M66.6 ${top + 1} C66 ${top - 12} 69 ${top - 24} 72 ${top - 25} C74 ${top - 24} 73 ${top - 12} 70.6 ${top + 1}Z" fill="${P.inner}"/><path d="M64.6 ${top - 13} Q69 ${top - 17} 75.6 ${top - 15}" fill="none" stroke="${L}" stroke-width="1.3" opacity=".5"/></g>`;
  }
  return '';
}
// marques du pelage, dessinées à l'intérieur de la tête
function bqMarks(sp, P, top, L) {
  const { rx, ry, hy } = P, Lt = P.light, D = P.dark;
  switch (sp) {
    case 'herisson': { let d = `M${60 - rx - 4} ${top - 4} L${60 - rx - 4} ${hy - 4}`; for (let k = 0; k <= 10; k++) { const x = 60 - rx + k * (rx * 2 / 10), y = top + 11 + Math.abs(k - 5) * -0.9 + (k % 2 ? 4 : 0); d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; } return `<path d="${d} L${60 + rx + 4} ${hy - 4} L${60 + rx + 4} ${top - 4}Z" fill="${D}"/><path d="M50 ${top + 3} l2 5 M60 ${top + 2} v6 M70 ${top + 3} l-2 5" stroke="#f3dcc0" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`; }
    case 'loutre': return `<path d="M${60 - rx} ${hy + 1} C${60 - rx + 7} ${hy - 5} 50 ${hy} 60 ${hy + 2} C70 ${hy} ${60 + rx - 7} ${hy - 5} ${60 + rx} ${hy + 1} V${hy + ry + 2} H${60 - rx}Z" fill="${Lt}"/><ellipse cx="60" cy="${top + 5}" rx="16" ry="7" fill="${D}" opacity=".25"/>`;
    case 'renard': return `<path d="M${60 - rx - 4} ${hy + 1} C42 ${hy + 3} 50 ${hy + 3} 60 ${hy + 5} C70 ${hy + 3} 78 ${hy + 3} ${60 + rx + 4} ${hy + 1} V${hy + ry + 4} H${60 - rx - 4}Z" fill="${Lt}"/><ellipse cx="60" cy="${top + 4}" rx="14" ry="7" fill="${D}" opacity=".3"/><ellipse cx="47" cy="${hy - 9}" rx="3" ry="1.8" fill="${Lt}" opacity=".85"/><ellipse cx="73" cy="${hy - 9}" rx="3" ry="1.8" fill="${Lt}" opacity=".85"/>`;
    case 'chouette': return `<circle cx="49" cy="${hy + 1}" r="12.5" fill="${Lt}"/><circle cx="71" cy="${hy + 1}" r="12.5" fill="${Lt}"/><path d="M48 ${hy - 13} Q56 ${hy - 12} 60 ${hy - 3} Q64 ${hy - 12} 72 ${hy - 13}" fill="none" stroke="${D}" stroke-width="2.4" stroke-linecap="round"/><path d="M52 ${top + 7} l2 2.4 l2 -2.4 M58 ${top + 4} l2 2.4 l2 -2.4 M64 ${top + 7} l2 2.4 l2 -2.4" fill="none" stroke="${D}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 ${hy + 13} q2.4 2 4.8 0 M83 ${hy + 13} q2.4 2 4.8 0" fill="none" stroke="${D}" stroke-width="1.3" stroke-linecap="round"/>`;
    case 'ours': case 'souris': case 'faon': case 'koala': case 'chien': case 'mouton': case 'lapin': {
      let m = '';
      if (sp === 'faon') m += `<g fill="${Lt}"><circle cx="52" cy="${top + 6}" r="1.9"/><circle cx="60" cy="${top + 4}" r="1.6"/><circle cx="68" cy="${top + 6}" r="1.9"/><circle cx="45" cy="${top + 10}" r="1.4"/><circle cx="75" cy="${top + 10}" r="1.4"/><circle cx="56" cy="${top + 9.5}" r="1.1"/><circle cx="64" cy="${top + 9.5}" r="1.1"/></g>`;
      if (sp === 'chien') m += `<ellipse cx="71" cy="${hy - 1}" rx="9" ry="8" fill="${shade(P.fur, 0.86)}"/><path d="M57 ${top - 1} Q60 ${hy - 6} 55.5 ${hy + 2} H64.5 Q60 ${hy - 6} 63 ${top - 1}Z" fill="${Lt}" opacity=".9"/>`;
      if (sp === 'koala') m += `<ellipse cx="60" cy="${hy + 17}" rx="15" ry="7" fill="${Lt}"/>`;
      if (sp === 'ours') m += `<ellipse cx="60" cy="${top + 4}" rx="15" ry="6" fill="${D}" opacity=".22"/>`;
      return m;
    }
    case 'raton': return `<ellipse cx="48" cy="${hy - 9}" rx="9.5" ry="4.2" fill="${Lt}"/><ellipse cx="72" cy="${hy - 9}" rx="9.5" ry="4.2" fill="${Lt}"/><path d="M57 ${top - 1} L60 ${hy - 4} L63 ${top - 1}Z" fill="${shade(P.fur, 0.72)}"/>`
      + `<path d="M${60 - rx - 2} ${hy - 4} C44 ${hy - 9} 54 ${hy - 6} 60 ${hy - 1} C66 ${hy - 6} 76 ${hy - 9} ${60 + rx + 2} ${hy - 4} C88 ${hy + 6} 72 ${hy + 9} 64.5 ${hy + 4} Q60 ${hy + 2} 55.5 ${hy + 4} C48 ${hy + 9} 32 ${hy + 6} ${60 - rx - 2} ${hy - 4}Z" fill="${D}"/><path d="M${60 - rx} ${hy + 6} C40 ${hy + 9} 50 ${hy + 10} 60 ${hy + 9} C70 ${hy + 10} 80 ${hy + 9} ${60 + rx} ${hy + 6} V${hy + ry + 2} H${60 - rx}Z" fill="${Lt}"/>`;
    case 'ecureuil': return `<ellipse cx="45" cy="${hy + 8}" rx="9.5" ry="7" fill="${Lt}"/><ellipse cx="75" cy="${hy + 8}" rx="9.5" ry="7" fill="${Lt}"/><ellipse cx="60" cy="${hy + 13}" rx="11" ry="7" fill="${Lt}"/><circle cx="49" cy="${hy + 1}" r="6.4" fill="${Lt}" opacity=".55"/><circle cx="71" cy="${hy + 1}" r="6.4" fill="${Lt}" opacity=".55"/><path d="M60 ${top} V${hy - 8}" stroke="${D}" stroke-width="5" stroke-linecap="round" opacity=".35"/>`;
    case 'blaireau': return `<path d="M${60 - rx - 2} ${top + 10} C${60 - rx + 2} ${hy + 6} 40 ${hy + 16} 44 ${hy + ry + 2} H${60 - rx - 2}Z M${60 + rx + 2} ${top + 10} C${60 + rx - 2} ${hy + 6} 80 ${hy + 16} 76 ${hy + ry + 2} H${60 + rx + 2}Z" fill="${P.inner}" opacity=".55"/>`
      + bqMir(`<path d="M40 ${top - 2} C44 ${hy - 10} 47 ${hy} 53.6 ${hy + 7} L56.4 ${hy + 5} C54.4 ${hy - 2} 53 ${hy - 12} 54 ${top - 2}Z" fill="${D}"/>`);
    case 'canard': return `<ellipse cx="60" cy="${hy + 12}" rx="22" ry="10" fill="${Lt}" opacity=".8"/>`;
    case 'grenouille': return `<ellipse cx="60" cy="${hy + 13}" rx="25" ry="8" fill="${Lt}"/><g fill="${D}" opacity=".45"><circle cx="40" cy="${hy - 3}" r="2.6"/><circle cx="36" cy="${hy + 3}" r="1.6"/><circle cx="81" cy="${hy - 2}" r="2.8"/><circle cx="60" cy="${hy - 13}" r="2"/></g>`;
    case 'chat': return `<path d="M54 ${top + 1} q1.6 4.6 0 9 M60 ${top} v9.5 M66 ${top + 1} q-1.6 4.6 0 9 M${60 - rx - 1} ${hy + 2} h7 M${60 - rx} ${hy + 7} h6 M${60 + rx + 1} ${hy + 2} h-7 M${60 + rx} ${hy + 7} h-6" stroke="${D}" stroke-width="2.6" stroke-linecap="round" opacity=".75"/><ellipse cx="55.5" cy="${hy + 10}" rx="5.4" ry="4.2" fill="${Lt}"/><ellipse cx="64.5" cy="${hy + 10}" rx="5.4" ry="4.2" fill="${Lt}"/><ellipse cx="60" cy="${hy + 14}" rx="5" ry="3.4" fill="${Lt}"/>`;
    case 'pingouin': return `<path d="M60 ${hy - 6} C56 ${hy - 15} 40 ${hy - 15} 37.5 ${hy - 2} C36 ${hy + 12} 48 ${hy + ry + 2} 60 ${hy + ry + 2} C72 ${hy + ry + 2} 84 ${hy + 12} 82.5 ${hy - 2} C80 ${hy - 15} 64 ${hy - 15} 60 ${hy - 6}Z" fill="${Lt}"/>`;
    case 'hamster': return `<ellipse cx="44" cy="${hy + 9}" rx="11.5" ry="9" fill="${Lt}"/><ellipse cx="76" cy="${hy + 9}" rx="11.5" ry="9" fill="${Lt}"/><ellipse cx="60" cy="${hy + 12}" rx="9" ry="7.5" fill="${Lt}"/><path d="M60 ${top} V${hy - 9}" stroke="${D}" stroke-width="6" stroke-linecap="round" opacity=".3"/>`;
    case 'tortue': return `<g fill="${D}" opacity=".35"><ellipse cx="52" cy="${top + 6}" rx="4.6" ry="3.4"/><ellipse cx="62" cy="${top + 4}" rx="4" ry="3"/><ellipse cx="71" cy="${top + 8}" rx="4.4" ry="3.2"/><ellipse cx="44" cy="${top + 11}" rx="3" ry="2.4"/></g><ellipse cx="60" cy="${hy + 15}" rx="17" ry="7" fill="${Lt}"/>`;
  }
  return '';
}
function bqFace(sp, P, joy, u, L, s1, top) {
  const { hy } = P, Lt = P.light;
  const frog = sp === 'grenouille', owl = sp === 'chouette', koala = sp === 'koala';
  const ex = frog ? 14 : koala ? 12.5 : 11, ey = frog ? hy - 17 : sp === 'canard' ? hy - 2 : hy + 0.5;
  const erx = owl ? 4.8 : frog ? 4.4 : 3.9, ery = owl ? 5.3 : frog ? 5 : 4.6;
  const ink = P.ring ? '#fff6ea' : '#2a2130';
  let s = '', ny = hy + 6.5, my = ny + 2.6, bx = ex + 9, by = ey + 7.5;
  // museau clair
  const muz = { ours: [10.5, 7.5], souris: [7.5, 5.2], faon: [8.5, 6.5], koala: [0, 0], chien: [11, 7.6], mouton: [8, 6], herisson: [8, 6], lapin: [0, 0] }[sp];
  if (muz && muz[0]) s += `<ellipse cx="60" cy="${hy + 9}" rx="${muz[0]}" ry="${muz[1]}" fill="${Lt}"${sp === 'herisson' ? ` ${s1}` : ''}/><ellipse cx="57" cy="${hy + 6.6}" rx="${muz[0] * 0.4}" ry="${muz[1] * 0.3}" fill="#fff" opacity=".35"/>`;
  if (sp === 'lapin') s += `<circle cx="56.4" cy="${hy + 9}" r="4.6" fill="${Lt}"/><circle cx="63.6" cy="${hy + 9}" r="4.6" fill="${Lt}"/>`;
  if (sp === 'loutre') s += `<ellipse cx="55.4" cy="${hy + 9.5}" rx="5.6" ry="4.3" fill="${shade(Lt, 1.06)}"/><ellipse cx="64.6" cy="${hy + 9.5}" rx="5.6" ry="4.3" fill="${shade(Lt, 1.06)}"/><g fill="${P.dark}" opacity=".6"><circle cx="53" cy="${hy + 9.5}" r=".7"/><circle cx="55.6" cy="${hy + 11.4}" r=".7"/><circle cx="67" cy="${hy + 9.5}" r=".7"/><circle cx="64.4" cy="${hy + 11.4}" r=".7"/></g>`;
  // anneaux clairs autour des yeux (masque sombre)
  if (P.ring) s += [60 - ex, 60 + ex].map(x => `<ellipse cx="${x}" cy="${ey}" rx="${erx + 1.4}" ry="${ery + 1.4}" fill="#7a7a88"/>`).join('');
  // yeux
  s += [60 - ex, 60 + ex].map((x, i) => joy
    ? `<path d="M${x - erx - 0.4} ${ey + 1.2} Q${x} ${ey - ery - 1.6} ${x + erx + 0.4} ${ey + 1.2}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`
    : eyeOpen(x, ey, erx, ery, P.iris, u, i)).join('');
  if (owl && !joy) s += [60 - ex, 60 + ex].map(x => `<path d="M${x - erx - 1.6} ${ey - ery + 0.6} Q${x} ${ey - ery - 2.4} ${x + erx + 1.6} ${ey - ery + 0.6}" fill="none" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>`).join('');
  if (sp === 'tortue' && !joy) s += [60 - ex, 60 + ex].map(x => `<path d="M${x - erx - 0.6} ${ey - 1.4} Q${x} ${ey - ery - 1.4} ${x + erx + 0.6} ${ey - 1.4} L${x + erx + 0.6} ${ey - ery - 1.6} L${x - erx - 0.6} ${ey - ery - 1.6}Z" fill="${P.fur}"/><path d="M${x - erx - 0.6} ${ey - 1.4} Q${x} ${ey - ery - 1.4} ${x + erx + 0.6} ${ey - 1.4}" fill="none" stroke="${L}" stroke-width="1.5" stroke-linecap="round"/>`).join('');
  // joues
  const bk = joy ? 1.2 : 1, blush = mixHex('#f49a98', P.fur, 0.12);
  if (frog) { bx = 25; by = hy + 4; }
  s += [-1, 1].map(k => `<ellipse cx="${60 + k * bx}" cy="${by}" rx="${(4.4 * bk).toFixed(1)}" ry="${(2.6 * bk).toFixed(1)}" fill="${blush}" opacity="${joy ? 0.75 : 0.6}"/><ellipse cx="${60 + k * bx - 1.6}" cy="${by - 1}" rx="1.1" ry=".6" fill="#fff" opacity=".7"/>`).join('');
  // nez, bec, bouche
  const nose = (y, w, col) => `<path d="M${60 - w} ${y - 1.2} Q60 ${y - 2.6} ${60 + w} ${y - 1.2} Q${60 + w * 0.8} ${y + 1.8} 60 ${y + 2.6} Q${60 - w * 0.8} ${y + 1.8} ${60 - w} ${y - 1.2}Z" fill="${col}" stroke="${L}" stroke-width="1" stroke-linejoin="round"/><ellipse cx="${60 - w * 0.35}" cy="${y - 1}" rx="${(w * 0.32).toFixed(1)}" ry=".6" fill="#fff" opacity=".75"/>`;
  const wM = y => `<path d="M60 ${y - 0.6} V${y + 1.2} M55.4 ${y + 0.6} Q57.7 ${y + 3.4} 60 ${y + 1.2} Q62.3 ${y + 3.4} 64.6 ${y + 0.6}" fill="none" stroke="${L}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const openM = (y, w = 4.6) => `<path d="M60 ${y - 0.6} V${y + 0.6}" stroke="${L}" stroke-width="1.5" stroke-linecap="round"/><path d="M${60 - w} ${y + 0.6} Q60 ${y + 1.6} ${60 + w} ${y + 0.6} Q${60 + w * 0.8} ${y + 7} 60 ${y + 7} Q${60 - w * 0.8} ${y + 7} ${60 - w} ${y + 0.6}Z" fill="#8c3a4c" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="60" cy="${y + 5.2}" rx="${w * 0.5}" ry="1.5" fill="#f4889f"/>`;
  const teeth = y => `<rect x="58.2" y="${y}" width="3.6" height="3" rx=".7" fill="#fff" stroke="${L}" stroke-width=".9"/><path d="M60 ${y} v2.6" stroke="${L}" stroke-width=".6"/>`;
  const whisk = y => `<path d="M${46} ${y} l-10 -1.6 M46 ${y + 3} l-9 2 M74 ${y} l10 -1.6 M74 ${y + 3} l9 2" stroke="${L}" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>`;
  switch (sp) {
    case 'chouette': s += `<path d="M56.4 ${hy + 3.4} Q60 ${hy + 1.8} 63.6 ${hy + 3.4} Q62.6 ${hy + 8.6} 60 ${hy + 11.4} Q57.4 ${hy + 8.6} 56.4 ${hy + 3.4}Z" fill="#f2b03b" ${s1}/><ellipse cx="58.6" cy="${hy + 4.4}" rx="1.2" ry=".7" fill="#fff" opacity=".7"/>` + (joy ? `<path d="M57.6 ${hy + 9.4} Q60 ${hy + 13} 62.4 ${hy + 9.4}" fill="#8c3a4c" ${s1}/>` : ''); break;
    case 'pingouin': s += `<path d="M56 ${hy + 4.4} Q60 ${hy + 2.8} 64 ${hy + 4.4} Q62.2 ${hy + 9.4} 60 ${hy + 10.6} Q57.8 ${hy + 9.4} 56 ${hy + 4.4}Z" fill="#f5a33c" ${s1}/>` + (joy ? `<path d="M57.6 ${hy + 8.6} Q60 ${hy + 12.6} 62.4 ${hy + 8.6}" fill="#8c3a4c" ${s1}/>` : ''); break;
    case 'canard': s += (joy ? `<path d="M50 ${hy + 9} Q60 ${hy + 17} 70 ${hy + 9}Z" fill="#8c3a4c" ${s1}/>` : '')
      + `<path d="M47 ${hy + 5} Q60 ${hy - 0.5} 73 ${hy + 5} Q75 ${hy + 11} 60 ${hy + (joy ? 9.6 : 13)} Q45 ${hy + 11} 47 ${hy + 5}Z" fill="#f59a45" ${s1}/><path d="M50 ${hy + 4.4} Q60 ${hy + 1} 70 ${hy + 4.4}" fill="none" stroke="#ffd08a" stroke-width="1.6" stroke-linecap="round"/><circle cx="56.6" cy="${hy + 5}" r=".9" fill="${L}"/><circle cx="63.4" cy="${hy + 5}" r=".9" fill="${L}"/>`
      + (joy ? '' : `<path d="M49.6 ${hy + 9} Q60 ${hy + 11.6} 70.4 ${hy + 9}" fill="none" stroke="${L}" stroke-width="1.2" opacity=".7"/>`); break;
    case 'grenouille': s += `<circle cx="57" cy="${hy - 1}" r=".9" fill="${L}"/><circle cx="63" cy="${hy - 1}" r=".9" fill="${L}"/>` + (joy ? `<path d="M42 ${hy + 4} Q60 ${hy + 7} 78 ${hy + 4} Q72 ${hy + 16} 60 ${hy + 16} Q48 ${hy + 16} 42 ${hy + 4}Z" fill="#8c3a4c" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="60" cy="${hy + 12.6}" rx="7" ry="2.4" fill="#f4889f"/>` : `<path d="M42 ${hy + 4} Q60 ${hy + 14} 78 ${hy + 4}" fill="none" stroke="${L}" stroke-width="1.8" stroke-linecap="round"/><path d="M40.6 ${hy + 2} q1.4 1 1.4 2.4 M79.4 ${hy + 2} q-1.4 1 -1.4 2.4" fill="none" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>`); break;
    case 'tortue': s += `<circle cx="57.6" cy="${hy + 5}" r=".9" fill="${L}"/><circle cx="62.4" cy="${hy + 5}" r=".9" fill="${L}"/>` + (joy ? openM(hy + 8, 6) : `<path d="M52 ${hy + 9} Q60 ${hy + 14} 68 ${hy + 9}" fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/>`); break;
    case 'koala': s += `<ellipse cx="60" cy="${hy + 5}" rx="5.6" ry="7" fill="#4a4a58" stroke="${L}" stroke-width="1"/><ellipse cx="58.2" cy="${hy + 1.8}" rx="1.6" ry="2.4" fill="#fff" opacity=".45"/>` + (joy ? openM(hy + 12.6, 4) : `<path d="M56 ${hy + 13.4} Q60 ${hy + 16} 64 ${hy + 13.4}" fill="none" stroke="${L}" stroke-width="1.5" stroke-linecap="round"/>`); break;
    default: {
      const big = { ours: 4.2, chien: 4.4, raton: 3.4, blaireau: 3.6, loutre: 4.4, herisson: 3.2, faon: 3.2 }[sp] || 2.6;
      if (sp === 'herisson') ny = hy + 5;
      if (sp === 'hamster' || sp === 'souris' || sp === 'lapin') ny = hy + 7;
      my = ny + 2.6;
      s += nose(ny, big, P.nose || '#4a3528');
      if (joy) s += openM(my, sp === 'chien' ? 5 : 4.4) + (sp === 'chien' ? `<path d="M57 ${my + 5} Q57 ${my + 11} 60 ${my + 11} Q63 ${my + 11} 63 ${my + 5}Z" fill="#f4889f" stroke="${L}" stroke-width="1.2"/><path d="M60 ${my + 6} v3" stroke="#d66a80" stroke-width="1"/>` : '');
      else s += wM(my);
      if (['lapin', 'ecureuil', 'hamster'].includes(sp)) s += teeth(joy ? my + 1.2 : my + 2.4);
      if (['chat', 'souris', 'loutre', 'raton', 'renard'].includes(sp)) s += whisk(ny + 3);
    }
  }
  return s;
}
function bqHeadAcc(acc, X, look, sp, P, A, C, L, sw, s1, top) {
  const { rx, hy } = P, ex = sp === 'grenouille' ? 14 : sp === 'koala' ? 12.5 : 11, ey = sp === 'grenouille' ? hy - 17 : sp === 'canard' ? hy - 2 : hy + 0.5;
  let s = '';
  const glasses = (r, col, half) => [60 - ex, 60 + ex].map(x => half
    ? `<path d="M${x - r} ${ey + 0.6} H${x + r} Q${x + r} ${ey + r} ${x} ${ey + r} Q${x - r} ${ey + r} ${x - r} ${ey + 0.6}Z" fill="#dff0fa" fill-opacity=".35" stroke="${col}" stroke-width="1.8"/>`
    : `<circle cx="${x}" cy="${ey}" r="${r}" fill="#dff0fa" fill-opacity=".3" stroke="${col}" stroke-width="2"/><path d="M${x - r * 0.5} ${ey - r * 0.2} l${r * 0.4} ${-r * 0.4}" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>`).join('')
    + `<path d="M${60 - ex + r} ${ey + (half ? 1.4 : -0.6)} Q60 ${ey - (half ? 1 : 3)} ${60 + ex - r} ${ey + (half ? 1.4 : -0.6)}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
  if (X.includes('demilune')) s += glasses(5.6, '#c9a35a', 1) + `<path d="M${60 - ex - 5.6} ${ey + 1} Q${60 - rx} ${hy + 20} 46 ${hy + 28}" fill="none" stroke="#c9a35a" stroke-width=".9" stroke-dasharray="1.2 1"/>`;
  if (X.includes('masqueski')) s += `<path d="M${60 - rx + 4} ${top + 8} Q60 ${top + 4} ${60 + rx - 4} ${top + 8}" fill="none" stroke="${L}" stroke-width="5.6"/><path d="M${60 - rx + 4} ${top + 8} Q60 ${top + 4} ${60 + rx - 4} ${top + 8}" fill="none" stroke="#3d4258" stroke-width="3.6"/><rect x="45" y="${top + 1}" width="30" height="11" rx="5.5" fill="#f6d36b" ${sw}/><rect x="47.4" y="${top + 3.2}" width="11.6" height="6.6" rx="3.3" fill="#7fc8e8"/><rect x="61" y="${top + 3.2}" width="11.6" height="6.6" rx="3.3" fill="#7fc8e8"/><path d="M49 ${top + 7.6} l3.6 -3 M62.6 ${top + 7.6} l3.6 -3" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`;
  if (X.includes('crayon')) s += `<g transform="translate(${60 + rx - 3} ${top + 10}) rotate(-62)"><rect x="-2" y="-13" width="4" height="19" fill="#f2c14e" ${s1}/><path d="M-2 6 L0 11 L2 6Z" fill="#f6dcb0" ${s1}/><path d="M-.6 9 L0 11 L.6 9Z" fill="${L}"/><rect x="-2" y="-15.4" width="4" height="3" rx="1" fill="#f39ab0" ${s1}/></g>`;
  if (X.includes('boucles')) s += [-1, 1].map(k => `<path d="M${60 + k * (rx - 2.6)} ${hy + 8} v3" stroke="#c9a35a" stroke-width="1"/><circle cx="${60 + k * (rx - 2.6)}" cy="${hy + 13}" r="2.4" fill="#fbf8f0" ${s1}/>`).join('');
  if (X.includes('couronne')) { const fl = [[40, top + 10, '#f6c2cf'], [49, top + 4, '#fff8f0'], [60, top + 2, '#f6d36b'], [71, top + 4, '#fff8f0'], [80, top + 10, '#f6c2cf']]; s += `<path d="M${60 - rx + 2} ${top + 13} Q60 ${top - 4} ${60 + rx - 2} ${top + 13}" fill="none" stroke="#7fae4f" stroke-width="2.2"/>` + [[44, top + 7, -40], [55, top + 2, -15], [66, top + 2, 15], [76, top + 7, 40]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.8" transform="rotate(${a} ${x} ${y})" fill="#9cc88a" ${s1}/>`).join('') + fl.map(([x, y, f]) => [0, 1, 2, 3, 4].map(k => `<circle cx="${(x + Math.cos(k * 1.257) * 2.6).toFixed(1)}" cy="${(y + Math.sin(k * 1.257) * 2.6).toFixed(1)}" r="2.2" fill="${f}" stroke="${L}" stroke-width=".9"/>`).join('') + `<circle cx="${x}" cy="${y}" r="1.4" fill="#f2c14e"/>`).join(''); }
  const flower = (x, y, r) => `<g transform="translate(${x} ${y})"><ellipse cx="-6" cy="5" rx="4.4" ry="2" transform="rotate(30 -6 5)" fill="#8fbf6a" ${s1}/>${[0, 1, 2, 3, 4].map(k => `<ellipse cx="${(Math.cos(k * 1.257 - 1.57) * r).toFixed(1)}" cy="${(Math.sin(k * 1.257 - 1.57) * r).toFixed(1)}" rx="${(r * 0.75).toFixed(1)}" ry="${(r * 0.62).toFixed(1)}" transform="rotate(${(k * 72).toFixed(0)} ${(Math.cos(k * 1.257 - 1.57) * r).toFixed(1)} ${(Math.sin(k * 1.257 - 1.57) * r).toFixed(1)})" fill="${A}" stroke="${L}" stroke-width="1.2"/>`).join('')}<circle r="${(r * 0.62).toFixed(1)}" fill="#f2c14e" stroke="${L}" stroke-width="1.1"/><circle cx="-.8" cy="-.8" r="${(r * 0.22).toFixed(1)}" fill="#fff" opacity=".8"/></g>`;
  switch (acc) {
    case 'noeud': s += `<g transform="translate(${60 + rx * 0.62} ${top + 6}) rotate(18)"><path d="M0 0 C-3 -8 -13 -8 -12 0 C-13 8 -3 8 0 0Z M0 0 C3 -8 13 -8 12 0 C13 8 3 8 0 0Z" fill="${A}" ${s1}/><path d="M-3 1 L-6 10 L-2.6 8.6 L-1 11 Z M3 1 L6 10 L2.6 8.6 L1 11Z" fill="${shade(A, 0.86)}" ${s1}/><path d="M-9 -2 q3 -1 5 1 M9 -2 q-3 -1 -5 1" fill="none" stroke="${shade(A, 0.75)}" stroke-width="1.1" stroke-linecap="round"/><rect x="-3" y="-3.4" width="6" height="6.8" rx="2.4" fill="${shade(A, 0.92)}" ${s1}/></g>`; break;
    case 'fleur': if (!X.includes('couronne')) s += flower(sp === 'lapin' ? 74 : sp === 'grenouille' ? 60 : 60 - rx * 0.62, sp === 'lapin' ? top + 4 : sp === 'grenouille' ? hy - 22 : top + 7, 3.6); break;
    case 'chapeau': {
      const by = top + 6, w = rx + 9;
      if (look.hat === 'explo') s += `<path d="M44 ${by} C43 ${by - 18} 77 ${by - 18} 76 ${by}Z" fill="${A}" ${sw}/><path d="M50 ${by - 12} Q60 ${by - 8} 70 ${by - 12}" fill="none" stroke="${shade(A, 0.75)}" stroke-width="1.6" stroke-linecap="round"/><path d="M${60 - w} ${by + 2} Q60 ${by - 7} ${60 + w} ${by + 2} Q60 ${by + 7} ${60 - w} ${by + 2}Z" fill="${shade(A, 1.08)}" ${sw}/><path d="M44.4 ${by - 3} Q60 ${by - 5} 75.6 ${by - 3} L75.8 ${by + 0.6} Q60 ${by - 1.6} 44.2 ${by + 0.6}Z" fill="#7a5338"/>`;
      else s += `<path d="M${60 - w} ${by + 2} Q60 ${by - 7} ${60 + w} ${by + 2} Q60 ${by + 8} ${60 - w} ${by + 2}Z" fill="${A}" ${sw}/><path d="M${60 - w + 5} ${by + 2} Q60 ${by - 3} ${60 + w - 5} ${by + 2}" fill="none" stroke="${shade(A, 0.8)}" stroke-width="1" stroke-dasharray="2 2"/><path d="M45 ${by} C45 ${by - 17} 75 ${by - 17} 75 ${by}Z" fill="${A}" ${sw}/><path d="M48 ${by - 9} Q60 ${by - 11} 72 ${by - 9}" fill="none" stroke="${shade(A, 0.8)}" stroke-width="1" stroke-dasharray="2 2"/><path d="M45.2 ${by - 4} Q60 ${by - 6} 74.8 ${by - 4} L75 ${by - 0.4} Q60 ${by - 2.4} 45 ${by - 0.4}Z" fill="#e5584f"/>${look.hat === 'paille' ? `<circle cx="70" cy="${by - 3}" r="2.4" fill="#fff" ${s1}/>` : ''}`;
      break;
    }
    case 'capitaine': { const by = top + 6; s += `<path d="M41 ${by} C40 ${by - 15} 80 ${by - 15} 79 ${by}Z" fill="${A}" ${sw}/><path d="M40 ${by - 1} H80 L79 ${by + 4} H41Z" fill="#2f3b5c" ${sw}/><path d="M44 ${by + 4} Q60 ${by + 12} 76 ${by + 4}Z" fill="#2a2e40" ${sw}/><circle cx="60" cy="${by - 6}" r="3.4" fill="#f2c14e" ${s1}/><path d="M60 ${by - 8} v4 M58.4 ${by - 5.4} q1.6 1.6 3.2 0" fill="none" stroke="${L}" stroke-width=".9" stroke-linecap="round"/><path d="M47 ${by + 1.4} H73" stroke="#f2c14e" stroke-width="1.2" stroke-dasharray="2.6 1.6"/>`; break; }
    case 'casquette': { const by = top + 8; s += `<path d="M38 ${by} C37 ${by - 21} 83 ${by - 21} 82 ${by}Z" fill="${A}" ${sw}/><path d="M60 ${by - 15.6} V${by} M49 ${by - 13} Q47 ${by - 6} 47 ${by} M71 ${by - 13} Q73 ${by - 6} 73 ${by}" fill="none" stroke="${shade(A, 0.8)}" stroke-width="1.2"/><path d="M38 ${by - 1} Q60 ${by - 4} 82 ${by - 1} L82 ${by + 1.8} Q60 ${by - 1.4} 38 ${by + 1.8}Z" fill="${shade(A, 0.82)}" ${s1}/><path d="M74 ${by - 1} C88 ${by - 3} 98 ${by} 96 ${by + 4} C90 ${by + 6} 80 ${by + 4} 72 ${by + 2}Z" fill="${shade(A, 0.9)}" ${sw}/><circle cx="60" cy="${by - 16}" r="2.4" fill="${shade(A, 0.85)}" ${s1}/><ellipse cx="50" cy="${by - 10}" rx="5" ry="2.4" fill="#fff" opacity=".25" transform="rotate(-25 50 ${by - 10})"/>`; break; }
    case 'lunettes': s += glasses(6.4, A); break;
    case 'monocle': { const by = top + 5; s += `<circle cx="${60 + ex}" cy="${ey}" r="6.4" fill="#dff0fa" fill-opacity=".3" stroke="${A}" stroke-width="2"/><path d="M${60 + ex - 3} ${ey - 2} l2.6 -2.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><path d="M${60 + ex + 5} ${ey + 4} C${80} ${hy + 22} 74 ${hy + 30} 70 ${hy + 33}" fill="none" stroke="${A}" stroke-width="1" stroke-dasharray="1.4 1"/>`
      + `<path d="M46 ${by} L47.6 ${by - 20} Q60 ${by - 22} 72.4 ${by - 20} L74 ${by}Z" fill="#3b3f5a" ${sw}/><path d="M46.8 ${by - 6} Q60 ${by - 8} 73.2 ${by - 6} L73.6 ${by - 2} Q60 ${by - 4} 46.4 ${by - 2}Z" fill="${A}"/><path d="M38 ${by + 1} Q60 ${by - 6} 82 ${by + 1} Q60 ${by + 6} 38 ${by + 1}Z" fill="#3b3f5a" ${sw}/><path d="M51 ${by - 18} V${by - 9}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".2"/>`; break; }
  }
  return s;
}
function bqArms(P, look, C, C2, CG, L, sw, s1) {
  const sl = ['salopette', 'gilet', 'chale', 'cardigan'].includes(look.g) ? (look.g === 'cardigan' ? CG : C2) : look.g === 'cape' ? shade(C, 0.9) : CG;
  const paw = P.paw || P.fur, k = P.arm || 'paw';
  let hand;
  if (k === 'wing') hand = `<path d="M40 110 C46 106 54 108 55 113 C52 113 50 115 51 118 C48 117 45 119 45 121 C42 119 38 116 40 110Z" fill="${P.fur}" ${s1}/><path d="M47 111 l3 3 M44 113 l2 4" stroke="${P.dark}" stroke-width="1.2" stroke-linecap="round"/>`;
  else if (k === 'flip') hand = `<path d="M39 112 C44 106 54 107 58 115 C52 118 44 119 39 112Z" fill="${P.fur}" ${s1}/><path d="M44 111 Q49 110 53 113" fill="none" stroke="#6a7090" stroke-width="1.2" stroke-linecap="round"/>`;
  else if (k === 'frog') hand = `<ellipse cx="45" cy="113" rx="6.2" ry="5" fill="${paw}" ${s1}/>${[[49.5, 108.6], [52, 112.4], [50.6, 116.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${shade(paw, 1.08)}" ${s1}/>`).join('')}`;
  else hand = `<ellipse cx="46" cy="113" rx="7" ry="5.8" transform="rotate(-35 46 113)" fill="${paw}" ${s1}/><path d="M49.6 109.6 l1.6 1.4 M51 112.6 l1.8 .8" stroke="${L}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/><ellipse cx="44" cy="111" rx="2.2" ry="1.3" transform="rotate(-35 44 111)" fill="#fff" opacity=".3"/>`;
  return bqMir(`<path d="M19 102 C20 112 28 120 37 120 L46 109 C40 104 34 98 29 94 C24 95 20 98 19 102Z" fill="${sl}" ${sw}/><path d="M24 104 C27 110 31 114 36 116" fill="none" stroke="#3a2a22" stroke-width="2.4" stroke-linecap="round" opacity=".12"/>`
    + `<path d="M35.4 118.4 L44.4 107.6 L47.4 110 L38.6 121Z" fill="${look.g === 'pull' || look.g === 'sweat' ? shade(C, 0.84) : look.g === 'doudoune' ? '#fbf4e6' : shade(typeof sl === 'string' && sl[0] === '#' ? sl : C, 0.9)}" ${s1}/>` + hand);
}
// devant : sac, poches, petits objets portés sur la poitrine
function bqFront(X, A, C, L, sw, s1) {
  let s = '';
  if (X.includes('sac')) s += `<path d="M12 104 H34 L33 121 H13Z" fill="#c98a5a" ${sw}/><path d="M11 103 H35 L33 112 Q23 115 13 112Z" fill="#a87a50" ${sw}/><circle cx="23" cy="112" r="1.8" fill="#f2c14e" ${s1}/>`;
  if (X.includes('badge')) s += `<circle cx="38" cy="96" r="4.6" fill="${A === '#f39ab0' ? '#f2c14e' : '#f6d36b'}" ${s1}/><path d="${starD(38, 96.3, 2.8)}" fill="#e5584f"/>`;
  if (X.includes('broche')) s += `<g transform="translate(40 96)">${[0, 1, 2, 3, 4].map(k => `<circle cx="${(Math.cos(k * 1.257) * 2.2).toFixed(1)}" cy="${(Math.sin(k * 1.257) * 2.2).toFixed(1)}" r="1.9" fill="${A}" stroke="${L}" stroke-width=".9"/>`).join('')}<circle r="1.5" fill="#f2c14e"/></g>`;
  if (X.includes('plume')) s += `<rect x="68" y="97" width="11" height="8" rx="1.4" fill="${shade(C, 0.9)}" ${s1}/><path d="M74 98 C76 92 80 88 86 84 C84 90 80 95 75 98Z" fill="#fbf8f0" ${s1}/><path d="M75 98 L84 86" stroke="${L}" stroke-width=".8"/>`;
  if (X.includes('mouchoir')) s += `<path d="M70 99 L73 95 L75 98 L77 94.6 L80 99Z" fill="${A}" ${s1}/><path d="M69 99 H81" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>`;
  if (X.includes('montre')) s += `<path d="M44 108 Q50 113 56 107" fill="none" stroke="#e3b94a" stroke-width="1.2" stroke-dasharray="1.6 .8"/>`;
  if (X.includes('carotte')) s += `<path d="M62.6 103 l-2.4 -6 M64 103 l.6 -7 M65.4 103 l3.6 -5.4" stroke="#6faf5f" stroke-width="2" stroke-linecap="round"/><path d="M61 102.4 H67 L66.4 105.4 H61.6Z" fill="#f2963b" ${s1}/>`;
  if (X.includes('outil')) s += `<rect x="62.6" y="97.4" width="4.8" height="7.6" rx="1.8" fill="#e5584f" ${s1}/><path d="M63.4 103.4 H66.6" stroke="#a6a6b2" stroke-width="1.6"/>`;
  return s;
}
const clientURI = (c, mood) => {
  const k = [c.id, c.sp, c.cloth, c.acc, c.accC, mood].join('|'); let v = BQ_URIC.get(k);
  if (!v) { if (BQ_URIC.size > 240) BQ_URIC.clear(); v = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clientSVG(c, mood).replace('<svg ', '<svg width="120" height="120" ')); BQ_URIC.set(k, v); }
  return v;
};

// ---------------- les commerces dessinés : emblème et façade ----------------
// emblème dans une boîte de 40 × 40, centré en (20, 20)
function bqEmblem(em) {
  const L = '#5b4636', sw = `stroke="${L}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  switch (em) {
    case 'pain': return `<path d="M5 25 C5 11 35 11 35 25 C35 30 5 30 5 25Z" fill="#e3a04b" ${sw}/><path d="M12 17 l3 6 M19 15.5 l3 6.5 M26 17 l3 6" stroke="#fff3dc" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'tasse': return `<path d="M9 31 H31" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/><path d="M8 17 H27 V23 C27 30 8 30 8 23Z" fill="#fff8ea" ${sw}/><path d="M27 19 h3 a3 3 0 0 1 0 6 h-3" fill="none" ${sw}/><path d="M14 13 q-2 -3 0 -6 M20 13 q-2 -3 0 -6" fill="none" stroke="#c98a5a" stroke-width="2" stroke-linecap="round"/><path d="M11 21 H24" stroke="#8a5a3a" stroke-width="3" stroke-linecap="round"/>`;
    case 'cloche': return `<path d="M5 29 H35" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/><path d="M8 27 C8 15 32 15 32 27Z" fill="#dfe6ee" ${sw}/><circle cx="20" cy="13" r="2.4" fill="#dfe6ee" ${sw}/><path d="M13 21 q2 -3 5 -3.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'fleur': return `<path d="M20 22 V35 M20 30 q-6 -1 -8 -6 q6 0 8 6" fill="#7fbf6a" ${sw}/>` + [0, 72, 144, 216, 288].map(a => `<ellipse cx="20" cy="9" rx="4.6" ry="6" fill="#f39ab0" ${sw} transform="rotate(${a} 20 15)"/>`).join('') + `<circle cx="20" cy="15" r="3.6" fill="#f6d36b" ${sw}/>`;
    case 'cintre': return `<path d="M20 9 a3 3 0 1 1 3 3 c-1.5 0 -3 1 -3 2.5 V15" fill="none" ${sw}/><path d="M20 15 L6 22 H34Z" fill="none" ${sw}/><path d="M13 21 L10 34 H30 L27 21 Q20 24 13 21Z" fill="#c9a3f0" ${sw}/><path d="M17 27 h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    case 'patte': return `<ellipse cx="20" cy="26" rx="8" ry="7" fill="#f6b8c8" ${sw}/>` + [[9, 17, 3.6], [15, 10, 3.8], [25, 10, 3.8], [31, 17, 3.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="#f6b8c8" ${sw}/>`).join('');
    case 'cornet': return `<path d="M13 20 L20 36 L27 20Z" fill="#e3b06b" ${sw}/><path d="M15 23 l9 4 M16.5 27 l6 3" stroke="#b9783f" stroke-width="1.4"/><circle cx="16" cy="16" r="6" fill="#f6a6b8" ${sw}/><circle cx="24" cy="15" r="6" fill="#bfe6d4" ${sw}/><circle cx="20" cy="9" r="5" fill="#fff3dc" ${sw}/><circle cx="21" cy="4.5" r="1.8" fill="#e5584f"/>`;
    case 'livre': return `<path d="M4 11 C10 9 16 10 20 13 C24 10 30 9 36 11 V31 C30 29 24 30 20 33 C16 30 10 29 4 31Z" fill="#fff8ea" ${sw}/><path d="M20 13 V33" stroke="${L}" stroke-width="2"/><path d="M8 16 q5 -1 9 1 M8 21 q5 -1 9 1 M23 17 q5 -2 9 -1 M23 22 q5 -2 9 -1" stroke="#9a8fd0" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    case 'bocal': return `<rect x="11" y="6" width="18" height="6" rx="2" fill="#d9604f" ${sw}/><path d="M10 13 H30 V32 a3 3 0 0 1 -3 3 H13 a3 3 0 0 1 -3 -3Z" fill="#cfe8f2" ${sw}/><circle cx="16" cy="25" r="3" fill="#f2c14e"/><circle cx="23" cy="28" r="3" fill="#e5584f"/><circle cx="22" cy="21" r="2.5" fill="#7fbf6a"/><rect x="13" y="15" width="14" height="5" rx="1.5" fill="#fff8ea" stroke="${L}" stroke-width="1.4"/>`;
    case 'lampe': return `<path d="M20 4 V8" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/><path d="M13 12 C13 8 27 8 27 12Z" fill="#b98a4a" ${sw}/><rect x="13" y="12" width="14" height="16" rx="3" fill="#f6e08a" ${sw}/><path d="M20 15 v10" stroke="#fff6c9" stroke-width="3" stroke-linecap="round"/><path d="M11 28 H29 L27 33 H13Z" fill="#b98a4a" ${sw}/>`;
    default: return `<rect x="8" y="12" width="24" height="20" rx="3" fill="#fff8ea" ${sw}/><path d="M6 13 L10 6 H30 L34 13Z" fill="#f3aec1" ${sw}/>`;
  }
}
// un produit phare dessiné dans un rectangle (objet du jeu ou œuf)
function bqStarSVG(st, x, y, w, uid) {
  if (st && !Array.isArray(st) && 'egg' in st) return bqEggSVG(st.egg, uid).replace('<svg ', `<svg x="${x}" y="${y - w * 0.1}" width="${w}" height="${w * 1.1}" `);
  return `<svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 40 40">${itemIcon(bqItemOf(st)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
}
// façade d'un commerce (choix du commerce, onglets des commerces ouverts)
function bqFacadeSVG(T, uid, opt = {}) {
  const L = '#5b4636', sw = `stroke="${L}" stroke-width="2.4" stroke-linejoin="round"`, u = 'bf' + (uid || T.id);
  let s = `<svg viewBox="0 0 200 172" xmlns="http://www.w3.org/2000/svg" class="bq-fac" role="img" aria-label="${esc(T.name)}">`;
  s += `<defs><linearGradient id="${u}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9f6"/><stop offset="1" stop-color="#f4fbff"/></linearGradient><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4f3fa"/><stop offset="1" stop-color="#b9dcec"/></linearGradient></defs>`;
  s += `<rect width="200" height="172" fill="url(#${u}k)"/><ellipse cx="38" cy="16" rx="16" ry="6" fill="#fff" opacity=".9"/><ellipse cx="170" cy="11" rx="12" ry="4.5" fill="#fff" opacity=".8"/>`;
  // la maison
  s += `<rect x="14" y="20" width="172" height="136" fill="${T.front}" ${sw}/><rect x="14" y="20" width="172" height="136" fill="${T.wall2}" opacity=".35"/>`;
  s += `<rect x="8" y="12" width="184" height="12" rx="4" fill="${T.door}" ${sw}/>`;
  // enseigne
  const n = T.short, fs = n.length > 11 ? 12.5 : 14.5, bw = Math.min(150, 26 + n.length * fs * 0.6);
  s += `<rect x="${100 - bw / 2}" y="29" width="${bw}" height="22" rx="7" fill="#fff8ea" ${sw}/><text x="100" y="44.5" text-anchor="middle" font-family="Baloo 2, Fredoka, Trebuchet MS, sans-serif" font-weight="800" font-size="${fs}" fill="#4a3528">${esc(n)}</text>`;
  // auvent rayé
  for (let i = 0; i < 8; i++) { const x = 16 + i * 21; s += `<path d="M${x} 56 H${x + 21} V68 a10.5 7 0 0 1 -21 0Z" fill="${i % 2 ? T.aw2 : T.aw}" ${sw}/>`; }
  // vitrine avec les produits phares
  s += `<rect x="22" y="80" width="94" height="58" rx="5" fill="url(#${u}g)" ${sw}/><path d="M26 86 l14 -4 M28 96 l20 -8" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`;
  s += `<rect x="24" y="124" width="90" height="5" rx="2" fill="${T.door}" opacity=".8"/>`;
  (T.stars || []).slice(0, 3).forEach((st, i) => { s += bqStarSVG(st, 27 + i * 29, 96, 28, u + 's' + i); });
  // jardinière
  s += `<rect x="20" y="139" width="98" height="9" rx="3" fill="${T.door}" ${sw}/>` + [30, 44, 58, 72, 86, 100, 110].map((x, i) => `<circle cx="${x}" cy="137" r="${3.4 + (i % 2)}" fill="${['#f39ab0', '#f6d36b', '#fff', '#9fd0f0'][i % 4]}" stroke="${L}" stroke-width="1.2"/>`).join('');
  // porte et son emblème
  s += `<path d="M128 156 V88 a22 14 0 0 1 44 0 V156Z" fill="${T.door}" ${sw}/><circle cx="150" cy="96" r="13" fill="#fff8ea" ${sw}/><g transform="translate(139 85) scale(.55)">${bqEmblem(T.em)}</g>`;
  s += `<circle cx="164" cy="128" r="2.6" fill="#f2c14e" stroke="${L}" stroke-width="1.4"/><rect x="132" y="113" width="30" height="10" rx="3" fill="#fff8ea" stroke="${L}" stroke-width="1.4"/><text x="147" y="120.6" text-anchor="middle" font-family="Baloo 2, Trebuchet MS, sans-serif" font-weight="800" font-size="6" letter-spacing=".2" fill="#4a3528">OUVERT</text>`;
  // trottoir
  s += `<rect y="156" width="200" height="16" fill="#e8dcc6"/><path d="M0 157 H200" stroke="${L}" stroke-width="2.4"/><path d="M30 164 h18 M84 166 h22 M140 163 h20" stroke="#cdbb98" stroke-width="2" stroke-linecap="round"/>`;
  if (opt.lock) s += `<rect width="200" height="172" fill="#f4efe6" opacity=".6"/>`;
  return s + `</svg>`;
}
const bqFacadeURI = (T, uid) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bqFacadeSVG(T, uid).replace('<svg ', '<svg width="200" height="172" '));

// ---------------- choisir, ouvrir et changer de commerce ----------------
// mode : 'first' (premier lancement), 'free' (ancienne sauvegarde : gratuit), 'buy' (un commerce de plus)
let bqCh = null;
function bqChooseOpen(mode, next) {
  bqCh = { mode, next: next || null, pick: null };
  if (mode === 'first' && S.firstRun) { S.firstRun.stage = 'commerce'; save(); }
  bqChooseRender();
}
function bqChooseRender() {
  const C = bqCh; if (!C) return;
  const owned = bqOwned(), slot = bqNextSlot(), cost = C.mode === 'buy' && slot ? slot.cost : 0;
  if (C.pick) {
    const T = BQS(C.pick);
    const stars = T.stars.map((st, i) => { const egg = !Array.isArray(st); return `<li><span class="bqc-si">${egg ? bqEggSVG(st.egg, 'bqcs' + i) : itemIcon(bqItemOf(st))}</span><b>${egg ? 'Œufs de compagnons' : esc(st[0])}</b></li>`; }).join('');
    const uses = [...new Set(T.keys)].map(k => ING[k] ? `<i>${esc(ING[k][1])}</i>` : '').join('');
    showModal(`<div class="bqc bqc-one"><div class="bqc-big">${bqFacadeSVG(T, 'bqcbig')}</div><span class="bqc-kick">${C.mode === 'first' ? 'Votre premier commerce' : C.mode === 'buy' ? 'Nouveau commerce' : 'Votre spécialité'}</span><h2>${esc(T.name)}</h2><p class="bqc-ph">${esc(T.phrase)}</p>
      <h3>Produits phares</h3><ul class="bqc-stars">${stars}</ul>
      <h3>Ressources utilisées</h3><p class="bqc-uses">${uses}</p>
      <h3>Avantages</h3><ul class="bqc-perks">${T.perks.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      <div class="bqc-acts"><button class="btn cream" data-bqcback="1">Voir les autres</button><button class="btn green" data-bqcopen="${T.id}" ${cost && S.coins < cost ? 'disabled' : ''}>${cost ? `Ouvrir · ${coins(cost)}` : 'Ouvrir ce commerce'}</button></div>
      ${cost && S.coins < cost ? `<p class="small">Il vous manque ${cost - S.coins} pièces.</p>` : ''}</div>`);
    const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0;
    return;
  }
  const list = BQ_SHOPS.filter(T => !owned.includes(T.id));
  const head = C.mode === 'first' ? `<span class="bqc-kick">Dernière étape</span><h2>Quel commerce ouvrez-vous ?</h2><p class="bqc-ph">Vos compagnons rapporteront de voyage de quoi servir vos clients. Vous pourrez ouvrir d’autres commerces plus tard.</p>`
    : C.mode === 'buy' ? `<span class="bqc-kick">Votre réputation grandit</span><h2>Ouvrir un nouveau commerce</h2><p class="bqc-ph">Coût : ${coins(cost)}. Vous passerez de l’un à l’autre quand vous voudrez.</p>`
    : `<span class="bqc-kick">Nouveau</span><h2>Choisissez la spécialité de votre boutique</h2><p class="bqc-ph">C’est gratuit. Les clients et leurs commandes s’adapteront à votre commerce.</p>`;
  showModal(`<div class="bqc">${head}<div class="bqc-grid">${list.map(T => `<button class="bqc-card" data-bqcpick="${T.id}" style="--aw:${T.aw}"><span class="bqc-fac">${bqFacadeSVG(T, 'g' + T.id)}</span><b>${esc(T.name)}</b><span>${esc(T.phrase)}</span></button>`).join('')}</div>${C.mode !== 'first' ? '<button class="btn cream" data-bqcclose="1">Plus tard</button>' : ''}</div>`);
  const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0;
}
function bqOpenShop(id) {
  const C = bqCh, T = BQS(id); if (!C || !T) return;
  const s = bqState(), slot = bqNextSlot(), cost = C.mode === 'buy' && slot ? slot.cost : 0;
  if (C.mode === 'buy' && (!slot || !slot.ok)) return;
  if (cost && S.coins < cost) { toast('Pas assez de pièces pour ouvrir ce commerce.'); return; }
  if (cost) S.coins -= cost;
  if (!s.owned.includes(id)) s.owned.push(id);
  s.type = id; s.slotSeen = Math.max(s.slotSeen || 0, s.owned.length);
  // une partie qui commence : les premiers clients viennent pour ce commerce
  if (!s.served) { s.orders = []; s.started = 0; s.next = 0; }
  else s.next = Math.min(s.next || Infinity, Date.now() + 60e3);
  s.stock.items = []; // le magasin s'adapte au commerce
  bqCh = null; save();
  try { GAME.emit('shop:open', { type: id, mode: C.mode }); } catch (e) {}
  if (C.mode === 'first') { if (S.firstRun) S.firstRun.stage = 'done'; bqTickOrders(); save(); return (C.next || firstRunNext)(); }
  $('modal').hidden = true;
  bqTickOrders(); save(); bView = 'comptoir';
  renderTop(); renderPanel();
  toast(C.mode === 'buy' ? `Votre ${T.short.toLowerCase()} ouvre ses portes ! Changez de commerce en haut du comptoir.` : `Votre boutique devient : ${T.name} !`);
}
function bqSwitch(id) {
  const s = bqState(); if (!s.owned.includes(id) || s.type === id) return;
  // les clients du commerce quitté l'attendent ; ceux du commerce choisi reviennent au comptoir
  const old = s.type; if (old && s.orders.length) s.park[old] = (s.park[old] || []).concat(s.orders).slice(-5);
  s.type = id; s.orders = (s.park[id] || []).filter(o => o && Array.isArray(o.req) && BQC(o.client)); delete s.park[id];
  s.next = Math.min(s.next || Infinity, Date.now() + 3 * 60e3); save(); renderPanel();
  const X = BQS(id), nm = X.short.toLowerCase(), m = ['restaurant', 'cafe', 'glacier'].includes(id);
  toast(`Bienvenue ${m ? 'au ' : /^[aeiouéè]/.test(nm) ? 'à l’' : 'à la '}${nm} ! Les prochains clients viendront pour ${m ? 'lui' : 'elle'}.`);
}
// barre des commerces, en haut du comptoir
function bqShopsBar() {
  const s = bqState(), T = bqType();
  if (!T) return `<div class="bq-pick"><span class="bq-pdot" aria-hidden="true"></span><div><b>Choisissez la spécialité de votre boutique</b><span>Boulangerie, salon de thé, fleuriste, animalerie… Les clients s’adapteront. C’est gratuit.</span></div><button class="btn gold sm" data-bqchoose="free">Choisir</button></div>`;
  const nx = bqNextSlot(), isNew = bqSlotNew();
  let h = `<div class="bq-shops" role="tablist" aria-label="Mes commerces">`;
  h += bqOwned().map(id => { const X = BQS(id); return `<button role="tab" class="bq-shopc" data-bqswitch="${id}" aria-selected="${id === s.type}" style="--aw:${X.aw}"><span class="bq-shopi"><svg viewBox="0 0 40 40" aria-hidden="true">${bqEmblem(X.em)}</svg></span><span>${esc(X.short)}</span></button>`; }).join('');
  if (nx) h += nx.ok ? `<button class="bq-shopc add" data-bqchoose="buy">${isNew ? '<i class="bq-pdot"></i>' : ''}<span class="bq-shopi">+</span><span>Ouvrir · ${coins(nx.cost)}</span></button>`
    : `<span class="bq-shopc lock" title="Débloqué au niveau ${nx.lvl + 1} de la boutique"><span class="bq-shopi"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="10" rx="2.5" fill="#cfc5b4" stroke="#5b4636" stroke-width="2"/><path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 V10.5" stroke="#5b4636" stroke-width="2.2" fill="none"/></svg></span><span>${bqOwned().length + 1}ᵉ commerce : niv. ${nx.lvl + 1}</span></span>`;
  h += `</div><div class="bq-perkl">${T.perks.map(p => `<i>${esc(p)}</i>`).join('')}</div>`;
  if (isNew) { s.slotSeen = nx.i + 1; save(); } // vu : le point rouge s'éteint au prochain affichage
  return h;
}
// (l'étape du premier lancement est branchée dans 22_marche.js, chargé après 20_collection.js)

// ---------------- la boutique dessinée ----------------
function bqShopSVG(L, mini) {
  const s0 = bqState(), night = isNight(), ink = '#5b4636', sw = `stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"`;
  L = L == null ? s0.lvl : L;
  const W = 360, H = 210;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="bq-shop" preserveAspectRatio="xMidYMid slice" role="img" aria-label="La boutique, niveau ${esc(bqLv(L).name)}">`;
  // le décor suit le commerce ouvert (couleurs du mur, auvent, enseigne, produits sur les étagères, emblème du comptoir)
  const TT = bqType(), pid = 'bqwp' + L + (TT ? TT.id : '') + (mini ? 'm' : '');
  const wA = TT ? TT.wall : L >= 1 ? '#f8e6cc' : '#f3e2c8', wB = TT ? TT.wall2 : '#f6dcc0';
  s += `<defs><pattern id="${pid}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${wA}"/>${L >= 1 || TT ? `<rect width="12" height="24" fill="${wB}" opacity=".7"/>` : '<circle cx="6" cy="6" r="1.6" fill="#e9cfae"/><circle cx="18" cy="18" r="1.6" fill="#e9cfae"/>'}</pattern></defs>`;
  // mur et sol
  s += `<rect width="${W}" height="${H}" fill="url(#${pid})"/>`;
  s += `<rect y="168" width="${W}" height="42" fill="#c99a6a"/>` + [0, 1, 2].map(i => `<path d="M0 ${178 + i * 11} H${W}" stroke="#b5875a" stroke-width="1.2"/>`).join('') + `<rect y="164" width="${W}" height="6" fill="#a87a50"/>`;
  if (L >= 3) s += `<ellipse cx="180" cy="192" rx="120" ry="12" fill="#d9604f" opacity=".9" ${sw}/><ellipse cx="180" cy="192" rx="96" ry="7" fill="none" stroke="#f6d36b" stroke-width="2.4"/>`;
  // fenêtre (à gauche)
  const sky = night ? '#3b4a7a' : '#bfe1f2';
  s += `<rect x="16" y="${L >= 1 ? 52 : 36}" width="76" height="70" rx="8" fill="${sky}" ${sw}/>`;
  const wy = L >= 1 ? 52 : 36;
  s += night ? `<circle cx="72" cy="${wy + 18}" r="7" fill="#f4efd2"/><circle cx="34" cy="${wy + 14}" r="1.4" fill="#fff"/><circle cx="50" cy="${wy + 26}" r="1.2" fill="#fff"/>` : `<circle cx="72" cy="${wy + 18}" r="9" fill="#fbd76a"/><ellipse cx="38" cy="${wy + 20}" rx="13" ry="5" fill="#fff" opacity=".9"/>`;
  s += `<path d="M16 ${wy + 50} C34 ${wy + 40} 60 ${wy + 46} 92 ${wy + 40} V${wy + 62} a8 8 0 0 1 -8 8 H24 a8 8 0 0 1 -8 -8Z" fill="#9fc79a"/>`;
  s += `<path d="M54 ${wy} V${wy + 70} M16 ${wy + 35} H92" stroke="${ink}" stroke-width="2.4"/><rect x="12" y="${wy + 68}" width="84" height="7" rx="3" fill="#d9b48a" ${sw}/>`;
  if (L >= 2) s += `<g transform="translate(20 ${wy + 52})"><path d="M2 14 L4 22 H16 L18 14Z" fill="#d98763" ${sw}/><path d="M10 14 C8 6 2 4 0 2 C6 2 10 8 10 14Z M10 14 C12 4 18 2 22 0 C20 8 14 12 10 14Z" fill="#7fbf6a" stroke="${ink}" stroke-width="1.6"/></g>`;
  // étagères (à droite), avec les trésors du sac
  const shelfX = 258, inv = S.inv.slice().sort((a, b) => b.rarity - a.rarity || b.date - a.date).filter(i => i.cat !== 't');
  const shelves = L >= 2 ? [70, 112] : [92];
  shelves.forEach((y, si) => {
    s += `<rect x="${shelfX}" y="${y}" width="92" height="6" rx="2" fill="#a87a50" ${sw}/><path d="M${shelfX + 8} ${y + 6} l4 8 M${shelfX + 84} ${y + 6} l-4 8" stroke="${ink}" stroke-width="2.2"/>`;
    for (let i = 0; i < 3; i++) {
      const it = inv[si * 3 + i], x = shelfX + 6 + i * 28;
      if (it) s += `<svg x="${x}" y="${y - 26}" width="26" height="26" viewBox="0 0 40 40">${itemIcon(it).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
      else if (TT && TT.stars[(si * 3 + i) % 3]) s += bqStarSVG(TT.stars[(si * 3 + i) % 3], x, y - 26, 26, pid + 'st' + si + i);
      else s += `<rect x="${x + 4}" y="${y - 18}" width="16" height="18" rx="4" fill="${['#f3aec1', '#bfe3f6', '#f6d36b'][i]}" ${sw}/><rect x="${x + 6}" y="${y - 22}" width="12" height="5" rx="2" fill="#c9a97a" stroke="${ink}" stroke-width="1.6"/>`;
    }
  });
  if (L >= 4) s += `<g transform="translate(296 132)"><path d="M10 34 H30 M20 34 V26" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="14" r="13" fill="#9cc8e2" ${sw}/><path d="M12 8 c4 -2 8 2 6 6 c-2 4 -6 2 -8 6 M26 6 c4 2 4 8 0 10" fill="#cfe2a8" stroke="${ink}" stroke-width="1.2"/></g>`;
  else if (L >= 2) s += `<g transform="translate(318 132)"><path d="M2 20 L4 32 H24 L26 20Z" fill="#d98763" ${sw}/><path d="M14 20 C12 10 6 6 0 6 C4 12 8 16 14 20Z M14 20 C16 8 22 4 28 4 C26 12 20 16 14 20Z M14 20 C14 10 14 4 13 -2 C18 6 18 14 14 20Z" fill="#6fae7d" stroke="${ink}" stroke-width="1.6"/></g>`;
  // auvent / enseigne
  const hasAw = L >= 1 || !!TT;
  if (hasAw) {
    let aw = '';
    for (let i = 0; i < 12; i++) aw += `<path d="M${i * 30} 0 H${i * 30 + 30} V22 a15 9 0 0 1 -30 0Z" fill="${i % 2 ? (TT ? TT.aw2 : '#fff8ea') : L >= 5 ? '#2f7f6c' : TT ? TT.aw : '#d9604f'}" ${sw}/>`;
    s += aw;
  } else s += `<rect x="0" y="0" width="${W}" height="10" fill="#a87a50"/>`;
  const sign = TT ? TT.short : bqLv(L).name, gold = L >= 5;
  s += `<g transform="translate(180 ${hasAw ? 40 : 22})"><path d="M-20 -14 V-6 M20 -14 V-6" stroke="${ink}" stroke-width="2"/><rect x="${-12 - sign.length * (sign.length > 14 ? 3.9 : 4.4)}" y="-6" width="${24 + sign.length * (sign.length > 14 ? 7.8 : 8.8)}" height="26" rx="8" fill="${gold ? '#f6c445' : '#fff8ea'}" ${sw}/><text x="0" y="12.5" text-anchor="middle" font-family="Baloo 2, Fredoka, sans-serif" font-weight="800" font-size="${sign.length > 14 ? 13.5 : 15}" fill="${gold ? '#7a4a12' : '#4a3528'}">${esc(sign)}</text></g>`;
  if (gold) s += [[100, 40], [262, 36], [130, 70], [236, 76]].map(([x, y]) => `<path d="${starPath(x, y, 5)}" fill="#fff6c9" stroke="#c98f1e" stroke-width="1"/>`).join('');
  if (L >= 4) { let g = `<path d="M96 58 Q180 82 264 58" fill="none" stroke="${ink}" stroke-width="1.4"/>`; for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, x = 96 + t * 168, y = 58 + Math.sin(t * Math.PI) * 12; g += `<path d="M${x - 5} ${y} L${x + 5} ${y} L${x} ${y + 10}Z" fill="${['#f08aa6', '#f6c445', '#5fbf7f', '#5f87c9'][i % 4]}" stroke="${ink}" stroke-width="1"/>`; } s += g; }
  if (L >= 3) [104, 256].forEach(x => { s += `<path d="M${x} ${L >= 1 ? 30 : 10} V58" stroke="${ink}" stroke-width="1.6"/><rect x="${x - 8}" y="58" width="16" height="22" rx="6" fill="#f6d36b" ${sw}/><circle cx="${x}" cy="69" r="13" fill="#f6d36b" opacity=".25"/>`; });
  // le compagnon derrière le comptoir (ou un compagnon resté à la maison)
  const k = CHARS[S.sel] && !S.trips[S.sel] ? S.sel : (typeof teamIds === 'function' ? teamIds() : []).find(x => !S.trips[x]);
  if (k) s += drawChar(k, S.outfits[k], s0.orders.length && !mini ? 'content' : 'rire', 'bqk' + (mini ? 'm' : '') + L).replace('<svg ', `<svg x="128" y="${mini ? 56 : 52}" width="104" height="114" `);
  else s += `<g transform="translate(180 112)"><rect x="-34" y="-16" width="68" height="30" rx="6" fill="#fff8ea" ${sw}/><text y="4" text-anchor="middle" font-family="Caveat, cursive" font-size="15" fill="#4a3528">En voyage !</text></g>`;
  // le comptoir
  s += `<rect x="96" y="128" width="168" height="46" rx="6" fill="#c98a5a" ${sw}/><rect x="90" y="122" width="180" height="10" rx="4" fill="#e3b07a" ${sw}/>`;
  s += `<path d="M110 140 H250 M110 156 H250" stroke="#a87a50" stroke-width="2" opacity=".6"/>`;
  if (TT) s += `<circle cx="180" cy="151" r="15" fill="#fff8ea" ${sw}/><g transform="translate(167 138) scale(.65)">${bqEmblem(TT.em)}</g>`;
  s += `<g transform="translate(118 112)"><path d="M0 10 C0 0 16 0 16 10Z" fill="#f2c14e" ${sw}/><rect x="-3" y="9" width="22" height="4" rx="2" fill="#c9a35a" ${sw}/><circle cx="8" cy="-1" r="2.2" fill="#f2c14e" stroke="${ink}" stroke-width="1.4"/></g>`;
  s += `<g transform="translate(230 100)"><rect x="0" y="6" width="26" height="18" rx="3" fill="#7fb6d9" ${sw}/><rect x="4" y="0" width="18" height="8" rx="2" fill="#bfe1f2" ${sw}/><circle cx="13" cy="15" r="3" fill="#f6d36b"/></g>`;
  // les clients qui attendent
  if (!mini) {
    const os = s0.orders.slice(0, 2);
    os.forEach((o, i) => {
      const c = BQC(o.client); if (!c) return;
      const ready = bqReady(o), x = i === 0 ? 262 : 4, y = i === 0 ? 92 : 104, sz = i === 0 ? 92 : 80;
      s += clientSVG(c, ready ? 'joie' : 'content', 'shop' + i).replace('<svg ', `<svg x="${x}" y="${y}" width="${sz}" height="${sz}" `);
      if (ready) s += `<g transform="translate(${x + sz - 18} ${y + 6})"><circle r="11" fill="#5fbf7f" ${sw}/><path d="M-5 0 L-1.5 4 L5 -4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    });
  }
  return s + `</svg>`;
}

// ---------------- affichage ----------------
const BQ_ICONS = {
  boutique: '<path d="M4 12 L6 5 H24 L26 12Z" fill="#f3aec1" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 12 q2.75 3 5.5 0 q2.75 3 5.5 0 q2.75 3 5.5 0 q2.75 3 5.5 0" fill="#fff3e2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><rect x="6" y="14" width="18" height="12" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><rect x="12.5" y="18" width="5" height="8" rx="1" fill="#c98a5a" stroke="currentColor" stroke-width="1.5"/>',
  comptoir: '<path d="M5 21 C5 12 25 12 25 21Z" fill="#f6c445" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="3" y="21" width="24" height="4" rx="2" fill="#c98a5a" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="10.5" r="2.3" fill="#f6c445" stroke="currentColor" stroke-width="1.6"/>',
  magasin: '<path d="M7 11 H23 L25 26 H5Z" fill="#9fd1d8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 11 C10 4 20 4 20 11" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15 l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4Z" fill="#f6c445" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>',
};
const BQ_STAR = '<svg class="bq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8 L12.4 7.2 L18.2 7.6 L13.8 11.4 L15.2 17.2 L10 14.1 L4.8 17.2 L6.2 11.4 L1.8 7.6 L7.6 7.2Z" fill="#f6c445" stroke="#5b4636" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function bqSubtabs() {
  const s = bqState(), r = shopReady();
  const mk = typeof mkUnseen === 'function' ? mkUnseen() : 0, pend = bqChoicePending() || bqSlotNew();
  const t = [['comptoir', 'Comptoir', BQ_ICONS.comptoir, r ? `<i class="bq-sdot">${r}</i>` : pend ? '<i class="bq-rdot" aria-label="Nouveau"></i>' : ''], ['magasin', 'Magasin', BQ_ICONS.magasin, ''], ['marche', typeof renderMarche === 'function' ? 'Marché mondial' : 'Marché', (typeof NAV_ICONS !== 'undefined' && NAV_ICONS.marche) || '', mk ? '<i class="bq-rdot" aria-label="Ventes conclues"></i>' : '']];
  void s;
  return `<div class="subtabs bq-subs" role="tablist">${t.map(([k, l, ic, b]) => `<button role="tab" data-bsub="${k}" aria-selected="${bView === k}">${b}<svg viewBox="0 0 30 30" aria-hidden="true">${ic}</svg><span>${l}</span></button>`).join('')}</div>`;
}
function bqRepHTML() {
  const s = bqState(), L = s.lvl, lv = bqLv(L), nx = BQ_LEVELS[L + 1];
  const f = nx ? (s.rep - lv.rep) / (nx.rep - lv.rep) : 1;
  return `<div class="bq-rep"><div class="bq-lvbadge" aria-hidden="true"><b>${L + 1}</b></div><div class="bq-repx"><div class="bq-reph"><b>${esc(lv.name)}</b><span>${esc(lv.title)}</span></div><div class="bq-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(f * 100)}" aria-label="Réputation"><i style="width:${(Math.max(0.03, f) * 100).toFixed(1)}%"></i><span>${BQ_STAR}${nx ? `${s.rep - lv.rep} / ${nx.rep - lv.rep}` : `${s.rep} · niveau maximum`}</span></div>${nx ? `<div class="bq-next"><span>Prochain : <b>${esc(nx.name)}</b></span>${(nx.perks || []).slice(0, 2).map(p => `<i>${esc(p)}</i>`).join('')}</div>` : ''}</div></div>`;
}
function bqOrderCard(o) {
  const c = BQC(o.client), alloc = bqAllocate(o), ready = alloc.every((a, i) => a.have >= o.req[i].n), now = Date.now();
  const lines = o.req.map((r, i) => { const a = alloc[i], ok = a.have >= r.n, rar = bqRarity(r); return `<li class="${ok ? 'ok' : ''}" style="--rc:${RARC[rar]}"><span class="bq-ri">${bqReqIcon(r)}</span><span class="bq-rx"><b>${r.n > 1 ? r.n + ' × ' : ''}${esc(bqReqLabel(r))}</b><i>${esc(bqReqWhere(r))}</i></span><em>${ok ? '<svg viewBox="0 0 20 20" aria-label="prêt"><circle cx="10" cy="10" r="9" fill="#5fbf7f" stroke="#3a8f5a" stroke-width="1.6"/><path d="M5.6 10.4 L8.6 13.2 L14.4 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : `${a.have}/${r.n}`}</em></li>`; }).join('');
  let bonus = '';
  if (o.bonus && o.bonus.rec) { const r = BQ_RECIPES.find(x => x.id === o.bonus.rec); bonus = `<span class="bq-bonus" title="Recette offerte"><span class="bq-bi">${itemIcon(bqItemOf(r.out))}</span>Recette</span>`; }
  else if (o.bonus && o.bonus.def) bonus = `<span class="bq-bonus" title="${esc(o.bonus.def[0])}"><span class="bq-bi">${itemIcon(bqItemOf(o.bonus.def, { rarity: 2 }))}</span>Cadeau rare</span>`;
  const dl = o.deadline ? `<span class="bq-dl" data-bqcd="${o.deadline}">${fmtDur(o.deadline - now)}</span>` : '';
  const regGo = o.req.find((r, i) => alloc[i].have < r.n);
  const goLbl = !regGo ? '' : regGo.k === 'egg' || regGo.k === 'comp' ? 'Au marché' : regGo.k === 'bait' ? 'Nurserie' : regGo.k === 'craft' && canCraft(RECIPES.find(x => x.id === regGo.id) || { ing: [], coins: 0 }) ? 'Fabriquer' : 'Partir chercher';
  return `<article class="bq-order${ready ? ' ready' : ''}" data-oid="${o.id}">${ready ? '<span class="bq-ribbon">Prêt à livrer !</span>' : ''}
    <div class="bq-oh"><img class="bq-face" src="${clientURI(c, ready ? 'joie' : 'content')}" alt=""><div class="bq-ohx"><b>${esc(c.name)}</b><span>${esc(BQ_SPN[c.sp] || '')} · ${esc(c.pers)}${o.shop && BQS(o.shop) && bqOwned().length > 1 ? ` · <em class="bq-oshop">${esc(BQS(o.shop).short)}</em>` : ''}</span><p>« ${esc(o.line)} »</p></div></div>
    <ul class="bq-req">${lines}</ul>
    <div class="bq-rew"><span class="bq-coins">${coins(o.coins)}</span><span class="bq-repg">${BQ_STAR}+${o.rep}</span>${o.spec && BQS(o.shop) ? `<span class="bq-spec" title="${esc(BQS(o.shop).perks[0])}">Spécialité</span>` : ''}${bonus}${dl}</div>
    <div class="bq-acts">${ready ? `<button class="btn green bq-deliver" data-bdeliver="${o.id}">Livrer</button>` : `<button class="btn gold bq-go" data-bgo="${o.id}">${goLbl}</button>`}<button class="bq-refuse" data-brefuse="${o.id}" aria-label="Refuser la commande de ${esc(c.name)}">Refuser</button></div>
  </article>`;
}
function renderComptoir(box) {
  const s = bqState(); bqTickOrders();
  const lv = bqLv(s.lvl), now = Date.now();
  // v14 : sur téléphone, les commandes passent avant la réputation et les avantages (la 1re commande se voit sans défiler)
  const phone = typeof matchMedia === 'function' && matchMedia('(max-width:520px)').matches;
  let bar = bqShopsBar(), perks = '';
  if (phone) { const m = bar.match(/<div class="bq-perkl">[\s\S]*?<\/div>/); if (m) { perks = m[0]; bar = bar.replace(m[0], ''); } }
  let h = bar + `<div class="bq-hero">${bqShopSVG()}</div>` + (phone ? '' : bqRepHTML());
  const ready = shopReady();
  h += `<div class="bq-intro${phone ? ' bq-intro-s' : ''}"><b>${s.orders.length ? (ready ? `${ready} commande${ready > 1 ? 's' : ''} prête${ready > 1 ? 's' : ''} à livrer !` : `${s.orders.length} client${s.orders.length > 1 ? 's' : ''} attend${s.orders.length > 1 ? 'ent' : ''} au comptoir`) : 'Le comptoir est calme…'}</b><span>Réunissez ce qu’ils demandent en voyage ou à l’atelier, puis livrez : pièces et réputation garanties.</span></div>`;
  h += `<div class="bq-orders">` + s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).map(bqOrderCard).join('');
  for (let i = s.orders.length; i < bqSlots(); i++) h += `<div class="bq-slot"><svg viewBox="0 0 30 30" aria-hidden="true">${BQ_ICONS.comptoir}</svg><span>${i === s.orders.length ? `Prochain client dans <b data-bqcd="${s.next}">${fmtDur(s.next - now)}</b>` : 'Place libre au comptoir'}</span></div>`;
  h += `</div>`;
  if (phone) h += bqRepHTML() + perks;
  const served = Object.entries(s.clients).filter(([, v]) => v.served).length;
  h += `<p class="small bq-foot">${s.served} commande${s.served > 1 ? 's' : ''} livrée${s.served > 1 ? 's' : ''} · ${served}/${BQ_CLIENTS.length} clients déjà servis · ${coins(s.earned)} gagnées au comptoir. ${lv.reach}.</p>`;
  box.innerHTML = h;
}
function renderMagasin(box) {
  const s = bqState(), items = bqStock();
  const mid = new Date(); mid.setHours(24, 0, 0, 0);
  let h = phead(null, 'Le magasin', `La vitrine du jour. Vous avez ${coins(S.coins)} et ${stonesHTML(stonesN())}.`);
  h += `<p class="bq-tmw"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#fff8ea" stroke="#5b4636" stroke-width="1.8"/><path d="M10 5.5 V10 L13 12" fill="none" stroke="#5b4636" stroke-width="1.8" stroke-linecap="round"/></svg>Nouveaux articles demain · dans <b data-bqcd="${mid.getTime()}">${fmtDur(mid.getTime() - Date.now())}</b></p>`;
  try { h += bqPassHTML(); } catch (e) { console.error('marchand', e); }
  const ic = k => { try { const c = MK_CATS.find(x => x[0] === k); return c ? `<svg viewBox="0 0 30 30" aria-hidden="true">${c[2]}</svg>` : ''; } catch (e) { return ''; } };
  bqMCat = 'craft'; // v24 : le magasin ne vend plus que les objets fabriqués et outils (compagnons, œufs, vêtements, ressources : au marché mondial)
  if (false) h += `<div class="mk-cats bq-mcats" role="tablist">${BQ_MCATS.map(([k, l]) => { const n = items.filter(x => !x.locked && !x.sold && bqMCatOf(x) === k).length; return `<button role="tab" data-bmcat="${k}" aria-selected="${bqMCat === k}">${ic(k)}<span>${l}${n ? ` <small>${n}</small>` : ''}</span></button>`; }).join('')}</div>`;
  const cat = BQ_MCATS.find(c => c[0] === bqMCat), mine = items.filter(x => bqMCatOf(x) === bqMCat);
  const open = mine.filter(x => !x.locked), locked = mine.filter(x => x.locked);
  open.sort((a, b) => (b.cc ? 1 : 0) - (a.cc ? 1 : 0));
  h += `<h3 class="bq-h3">${cat[2]}</h3>` + (open.length ? `<div class="bq-grid">${open.map(x => bqShopCard(x)).join('')}</div>` : `<p class="small">Rien dans ce rayon aujourd’hui : revenez demain.</p>`);
  if (locked.length) h += `<h3 class="bq-h3 bq-lockh">Au niveau « ${esc(bqLv(s.lvl + 1).name)} »</h3><div class="bq-grid">${locked.map(x => bqShopCard(x)).join('')}</div><p class="small">Livrez des commandes au Comptoir pour gagner de la réputation et débloquer ces articles.</p>`;
  box.innerHTML = h;
}
document.addEventListener('click', ev => { const el = ev.target.closest('[data-bmcat]'); if (!el) return; bqMCat = el.dataset.bmcat; renderPanel(); });
document.addEventListener('click', ev => { const el = ev.target.closest('[data-bqpass]'); if (!el || el.disabled) return; bqPassBuy(el.dataset.bqpass, el); });
function bqShopCard(x) {
  const a = bqStockArticle(x); if (!a) return '';
  const art = bqArticle(a), it = art.it, can = S.coins >= art.price;
  if (art.egg) {
    const btn = (art.cc && !x.sold ? `<s class="bq-was">${coins(art.was)}</s>` : '') + (x.sold ? '<span class="bq-sold">Acheté</span>' : `<button class="btn ${can ? 'gold' : 'cream'} sm" data-bbuy="${x.key}" ${can ? '' : 'disabled'}>${coins(art.price)}</button>`);
    return `<div class="bq-art bq-eggart${x.sold ? ' sold' : ''}${art.cc ? ' cc' : ''}" style="--rc:${RARC[it.rarity]}"><div class="bq-aico bq-eggi">${bqEggSVG(art.egg.sp, 'bqse' + x.key)}</div><b>${esc(art.name)}</b><span>${art.egg.sp ? `${esc(bqSpName(art.egg.sp))} garanti` : 'Espèce surprise'} · éclot en 3 min</span>${btn}</div>`;
  }
  const sub = it.sub === 'outil' && typeof famUseLine === 'function' ? esc(famUseLine(it) || 'Outil') : art.rec ? `Recette · ${art.rec.kind}` : it.rid ? `${RARITY[it.rarity]} · spécialité ${typeof RG !== 'undefined' && RG[it.origin.region] ? esc(rgDe(RG[it.origin.region])) : ''}` : `${RARITY[it.rarity]} · ${it.cat === 'v' ? SLOT_LABEL[it.sub] : CAT_LABEL[it.cat]}`;
  const btn = x.locked ? `<span class="bq-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="10" rx="2.5" fill="#cfc5b4" stroke="#5b4636" stroke-width="2"/><path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 V10.5" stroke="#5b4636" stroke-width="2.2" fill="none"/></svg>Niveau ${a.lvl + 1}</span>` : x.sold ? '<span class="bq-sold">Acheté</span>' : `${art.cc ? `<s class="bq-was">${coins(art.was)}</s>` : ''}<button class="btn ${can ? 'gold' : 'cream'} sm" data-bbuy="${x.key}" ${can ? '' : 'disabled'}>${coins(art.price)}</button>`;
  return `<div class="bq-art${x.locked ? ' locked' : ''}${x.sold ? ' sold' : ''}${art.rare && !art.cc ? ' rare' : ''}${art.cc ? ' cc' : ''}" style="--rc:${RARC[it.rarity]}"><div class="bq-aico">${itemIcon(it)}${art.rec ? '<i class="bq-recb">Recette</i>' : ''}</div><b>${esc(art.rec ? art.rec.out[0] : art.name)}</b><span>${sub}</span>${btn}</div>`;
}
function renderBoutique(box) {
  bqState();
  if (bView === 'magasin') renderMagasin(box);
  else if (bView === 'marche' && typeof renderMarche === 'function') renderMarche(box);
  else if (bView === 'marche' && typeof renderMarket === 'function') {
    renderMarket(box);
    box.insertAdjacentHTML('afterbegin', `<div class="bq-tip">${BQ_STAR}<span>Vendre aux passants, c’est bien pour vider le sac. Mais une commande du <b>Comptoir</b> rapporte souvent <b>3 à 5 fois plus</b>.</span><button class="btn cream sm" data-bsub="comptoir">Comptoir</button></div>`);
  } else { bView = 'comptoir'; renderComptoir(box); }
  box.insertAdjacentHTML('afterbegin', bqSubtabs());
}
function openBoutique(sub) {
  if (sub && ['comptoir', 'magasin', 'marche'].includes(sub)) bView = sub;
  if (typeof openSheet === 'function') openSheet('boutique');
  const b = $('panelBody'); if (b) b.scrollTop = 0;
}

// ---------------- branchements ----------------
// onglet : tant que la navigation (10_ui.js) ne connaît pas 'boutique', on l'affiche nous-mêmes
const BQ_SELF_TAB = !(typeof NAV !== 'undefined' && Array.isArray(NAV) && NAV.some(x => x[0] === 'boutique'));
if (typeof SHEET_TITLES !== 'undefined' && !SHEET_TITLES.boutique) SHEET_TITLES.boutique = 'La boutique';
if (typeof NAV_ICONS !== 'undefined' && !NAV_ICONS.boutique) NAV_ICONS.boutique = BQ_ICONS.boutique;
if (BQ_SELF_TAB && typeof renderPanel === 'function') renderPanel = (orig => function () {
  const r = orig.apply(this, arguments);
  if (tab === 'boutique') {
    try {
      const sheet = $('sheet'); sheet.hidden = false; document.body.classList.add('sheet-open');
      $('sheetTitle').textContent = SHEET_TITLES.boutique || 'La boutique'; $('sheetIcon').innerHTML = BQ_ICONS.boutique;
      sheet.dataset.kind = 'boutique'; sheet.dataset.sub = bView;
      renderBoutique($('panelBody'));
    } catch (e) { console.error('boutique', e); }
  }
  return r;
})(renderPanel);

// « Sert à… » : « Commande de Noisette la hérissonne »
// (kind 'client' : contrat phase B ; 'commande' gardé pour compatibilité)
if (typeof USE_KIND !== 'undefined') { if (!USE_KIND.client) USE_KIND.client = ['Client', '#ffe1ec', '#b8456a']; if (!USE_KIND.commande) USE_KIND.commande = USE_KIND.client; }
if (typeof USE_ORDER !== 'undefined' && !USE_ORDER.includes('client')) USE_ORDER.unshift('client');
if (typeof GAME !== 'undefined') GAME.addUses(it => {
  if (!it || !S.shop || !Array.isArray(S.shop.orders)) return [];
  const out = [];
  S.shop.orders.forEach(o => { const c = BQC(o.client); if (c && o.req.some(r => bqMatch(r, it) || (r.k === 'craft' && (RECIPES.find(x => x.id === r.id) || { ing: [] }).ing.some(([key]) => key.startsWith('r:') ? it.rid === key.slice(2) : ING[key] && ING[key][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n'))))) out.push({ txt: `Commande de ${bqWho(c)}`, kind: 'client' }); });
  return out;
});
// les commandes passent avant les autres usages dans « Sert à… »
if (typeof GAME !== 'undefined' && Array.isArray(GAME._uses) && GAME._uses.length > 1) GAME._uses.unshift(GAME._uses.pop());

// recettes achetées au magasin : verrouillées à l'atelier tant qu'on ne les a pas
if (typeof canCraft === 'function') canCraft = (orig => function (r) { if (r && BQ_RIDS.has(r.id) && !bqRecOwned(r.id)) return false; return orig.apply(this, arguments); })(canCraft);
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    let n = 0;
    box.querySelectorAll('[data-craft]').forEach(b => { if (BQ_RIDS.has(b.dataset.craft) && !bqRecOwned(b.dataset.craft)) { const card = b.closest('.rec'); if (card) { card.remove(); n++; } } });
    box.querySelectorAll('[data-craft]').forEach(b => { if (BQ_RIDS.has(b.dataset.craft)) { const x = b.closest('.rec'); const nm = x && x.querySelector('.rx b'); if (nm && !nm.querySelector('.bq-new')) nm.insertAdjacentHTML('beforeend', ' <i class="bq-new">Boutique</i>'); } });
    const list = box.querySelector('.recipes');
    if (n && list) list.insertAdjacentHTML('afterend', `<button class="bq-recmore" data-bopen="magasin">${n} recette${n > 1 ? 's' : ''} de plus à découvrir au Magasin de la boutique</button>`);
  } catch (e) { console.error(e); }
  return r;
})(renderAtelier);

// au retour de voyage ou après une fabrication : prévenir quand une commande devient livrable
let bqReadyIds = new Set();
function bqCheckReady(where) {
  const s = bqState(), now = s.orders.filter(bqReady), nw = now.filter(o => !bqReadyIds.has(o.id));
  bqReadyIds = new Set(now.map(o => o.id));
  if (!nw.length) return;
  const names = nw.map(o => BQC(o.client).name).join(' et ');
  const sw = bqSwapNote && nw.find(o => o.client === bqSwapNote.client) ? bqSwapNote : null; bqSwapNote = null;
  const html = `<div class="bq-haul"><img src="${clientURI(BQC(nw[0].client), 'joie')}" alt=""><span><b>Commande prête !</b><small>${sw ? `${esc(BQC(sw.client).name)} a changé d’avis : « ${esc(sw.name)} » lui suffit. ` : ''}${esc(names)} ${nw.length > 1 ? 'peuvent' : 'peut'} être servi${nw.length > 1 ? 's' : ''} à la boutique.</small></span><button class="btn green sm" data-bopen="comptoir">Livrer</button></div>`;
  const m = $('modal'), btn = where === 'haul' && m && !m.hidden ? m.querySelector('.mbox > button:last-child') : null;
  if (btn) btn.insertAdjacentHTML('beforebegin', html);
  else toast(`Commande prête : ${names} attend${nw.length > 1 ? 'ent' : ''} à la boutique !`);
  if (typeof renderNav === 'function') renderNav();
}
let bqSwapNote = null;
if (typeof GAME !== 'undefined') {
  // tout début de partie : tant qu'aucun client n'a été servi, la première commande demande un objet ordinaire que le voyageur vient de rapporter
  // (le joueur comprend dès le 1er retour que ses trouvailles servent à ses clients)
  GAME.on('trip:return', e => {
    try {
      const s = bqState(); if (s.served || !s.orders.length || s.orders.some(bqReady)) return;
      const T = bqType(), got = (e && e.items || []).filter(it => it && !it.rid && !it.special && !it.edition && (it.rarity || 0) <= 1 && ['n', 'm', 'v', 'd'].includes(it.cat));
      if (!got.length) return;
      const fits = it => T && (T.keys || []).some(k => ING[k] && ING[k][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n'));
      const it = got.find(fits) || got.find(x => T && (T.itemCats || []).includes(x.cat)) || got[0];
      const o = s.orders[0]; if (o.tuto || (typeof tutoActive === 'function' && tutoActive())) return; // le tutoriel garde sa commande, stable
      o.req = [{ k: 'item', name: it.name, def: [it.name, it.cat, it.sub, 0, it.look || null, it.color || null], n: 1, src: { place: it.from || '' } }];
      // plus de changement en silence : le client le dit (sa phrase change) et la fenêtre du retour l’annonce (bqCheckReady)
      o.line = `Oh, vous rapportez « ${it.name} » ? J’ai changé d’avis : c’est exactement ce qu’il me faut !`; o.changed = 1;
      bqSwapNote = { client: o.client, name: it.name }; try { bqReadyIds.delete(o.id); } catch (er) {} // annoncée comme prête au retour
      save();
    } catch (er) { console.error('boutique', er); }
  });
  GAME.on('trip:return', () => setTimeout(() => bqCheckReady('haul'), 30));
  GAME.on('craft', () => setTimeout(() => bqCheckReady('craft'), 30));
}

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-bsub],[data-bdeliver],[data-bgo],[data-brefuse],[data-bbuy],[data-bopen],[data-bqadopt],[data-bqchoose],[data-bqcpick],[data-bqcback],[data-bqcopen],[data-bqcclose],[data-bqswitch]'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.bqadopt) { $('modal').hidden = true; return bqDeliver(d.bqadopt, null, 0, true); }
  if (d.bqchoose) return bqChooseOpen(d.bqchoose === 'buy' ? 'buy' : 'free');
  if (d.bqcpick) { if (bqCh) { bqCh.pick = d.bqcpick; bqChooseRender(); } return; }
  if (d.bqcback) { if (bqCh) { bqCh.pick = null; bqChooseRender(); } return; }
  if (d.bqcopen) return bqOpenShop(d.bqcopen);
  if (d.bqcclose) { bqCh = null; $('modal').hidden = true; return; }
  if (d.bqswitch) return bqSwitch(d.bqswitch);
  if (d.bsub) { bView = d.bsub; renderPanel(); const b = $('panelBody'); if (b) b.scrollTop = 0; return; }
  if (d.bdeliver) return bqDeliver(d.bdeliver, el);
  if (d.bgo) return bqGo(d.bgo);
  if (d.brefuse) return bqRefuse(d.brefuse);
  if (d.bbuy) return bqBuy(d.bbuy, el);
  if (d.bopen) { const m = $('modal'); if (m) m.hidden = true; openBoutique(d.bopen); return; }
});

// horloge : arrivée des clients, délais, comptes à rebours
let bqLastPass = null, bqLastDay = null;
function bqTick() {
  try {
    const changed = bqTickOrders();
    if (changed) { save(); if (tab === 'boutique' && bView === 'comptoir') renderPanel(); else if (typeof renderNav === 'function') renderNav(); }
    const now = Date.now();
    document.querySelectorAll('[data-bqcd]').forEach(e => { e.textContent = fmtDur(+e.dataset.bqcd - now); });
    // le marchand de passage repart : le suivant s'installe (le magasin se redessine s'il est ouvert)
    const ps = bqPassSlot(); if (ps !== bqLastPass) { const was = bqLastPass; bqLastPass = ps; if (was != null && tab === 'boutique' && bView === 'magasin') renderPanel(); }
    if (bqLastDay !== dayKey()) { const was = bqLastDay; bqLastDay = dayKey(); if (was != null && tab === 'boutique' && bView === 'magasin') renderPanel(); }
  } catch (e) { console.error('boutique', e); }
}
bqState(); bqTickOrders(); bqReadyIds = new Set(bqState().orders.filter(bqReady).map(o => o.id));
setInterval(bqTick, 4000);

// ---------------- styles ----------------
(function bqCSS() {
  const st = document.createElement('style'); st.id = 'boutiqueCSS';
  st.textContent = `
.bq-subs{margin-bottom:10px}
.bq-subs .bq-sdot{position:absolute;top:0;right:calc(50% - 24px);min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--green);color:#fff;border:2px solid #fff;font:800 11px/14px var(--display);font-style:normal}
.bq-hero{border:3px solid var(--ink);border-radius:20px;overflow:hidden;background:#f8e6cc;box-shadow:0 4px 0 rgba(74,53,40,.35);line-height:0}
.bq-shop{width:100%;height:auto;display:block}
.bq-shop .cc .root{animation:none}
.bq-rep{display:flex;gap:10px;align-items:center;margin:12px 0 4px;background:#fff;border:2.5px solid var(--ink);border-radius:18px;padding:10px 12px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.bq-lvbadge{flex:none;width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#f6c445 60%,#e0a52a);border:3px solid var(--ink);display:grid;place-items:center;box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}
.bq-lvbadge b{font:800 24px/1 var(--display);color:#7a4a12}
.bq-repx{flex:1;min-width:0}
.bq-reph{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px}
.bq-reph b{font:800 19px/1.1 var(--display)}
.bq-reph span{font-size:12.5px;color:var(--ink2);font-style:italic}
.bq-bar{position:relative;height:22px;margin-top:5px;background:#f2e3c4;border:2.5px solid var(--ink);border-radius:12px;overflow:hidden}
.bq-bar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(#ffd96a,#f2b33a);border-right:2px solid var(--ink);transition:width .6s cubic-bezier(.2,1.2,.4,1)}
.bq-bar span{position:relative;display:flex;align-items:center;justify-content:center;gap:4px;height:100%;font:800 12.5px/1 var(--display)}
.bq-star{width:15px;height:15px;flex:none;vertical-align:-2px}
.bq-next{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;align-items:center;font-size:12px;color:var(--ink2)}
.bq-next span{margin-right:2px}
.bq-next i{font-style:normal;background:#fff3c9;border:1.5px solid #e9cf86;border-radius:8px;padding:1px 6px;color:#7a5a12;font-weight:700}
.bq-intro{margin:12px 2px 8px;display:flex;flex-direction:column;gap:2px}
.bq-intro b{font:800 18px/1.15 var(--display)}
.bq-intro span{font-size:13px;color:var(--muted)}
.bq-orders{display:flex;flex-direction:column;gap:12px}
.bq-order{position:relative;background:#fffdf7;border:2.5px solid var(--ink);border-radius:18px;padding:12px;box-shadow:0 4px 0 rgba(74,53,40,.3);transition:transform .25s,opacity .4s}
.bq-order.ready{background:#effaf2;border-color:#2f7f6c;box-shadow:0 4px 0 #2f7f6c,0 0 0 4px rgba(95,191,127,.25);animation:bqGlow 1.6s ease-in-out infinite alternate}
@keyframes bqGlow{to{box-shadow:0 4px 0 #2f7f6c,0 0 0 7px rgba(95,191,127,.12)}}
.bq-order.bq-served{transform:scale(.96) translateY(-6px);opacity:0}
.bq-ribbon{position:absolute;top:-11px;right:14px;background:var(--green);color:#fff;font:800 13px/1 var(--display);padding:5px 10px 4px;border:2px solid var(--ink);border-radius:10px;text-shadow:0 1px 0 var(--greenD);transform:rotate(2deg)}
.bq-oh{display:flex;gap:10px;align-items:flex-start}
.bq-face{flex:none;width:66px;height:66px;border-radius:16px;background:#fbeed8;border:2px solid var(--ink)}
.bq-order.ready .bq-face{background:#d9f2e2}
.bq-ohx{min-width:0;flex:1}
.bq-ohx b{font:800 17px/1.1 var(--display);display:block}
.bq-ohx span{font-size:12px;color:var(--ink2);font-weight:700}
.bq-ohx p{margin:4px 0 0;font:600 16.5px/1.2 var(--hand);color:#6a4a3a}
.bq-req{list-style:none;margin:10px 0 8px;padding:0;display:flex;flex-direction:column;gap:6px}
.bq-req li{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-left:5px solid var(--rc);border-radius:12px;padding:5px 8px}
.bq-req li.ok{border-color:#9fd8b4;border-left-color:var(--rc);background:#f3fbf6}
.bq-ri{flex:none;width:34px;height:34px}.bq-ri svg{width:100%;height:100%}
.bq-rx{flex:1;min-width:0;display:flex;flex-direction:column}
.bq-rx b{font:700 14.5px/1.2 var(--display)}
.bq-rx i{font-style:normal;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bq-req em{flex:none;font:800 14px var(--display);font-style:normal;color:var(--ink2)}
.bq-req em svg{width:22px;height:22px;display:block}
.bq-rew{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.bq-rew>span{display:inline-flex;align-items:center;gap:4px;background:#fff6dc;border:2px solid #ead9a6;border-radius:10px;padding:2px 8px;font:800 14px var(--display)}
.bq-rew .bq-coins .money{font:800 15px var(--display)}
.bq-bonus{background:#f3ebff!important;border-color:#d2c2f2!important;color:#5a3f9a}
.bq-bi{width:20px;height:20px;display:inline-block}.bq-bi svg{width:100%;height:100%}
.bq-dl{background:#ffece6!important;border-color:#f2c4b4!important;color:#b0482f}
.bq-dl::before{content:"";width:12px;height:12px;border-radius:50%;border:2px solid currentColor;box-sizing:border-box;margin-right:2px}
.bq-acts{display:flex;align-items:center;gap:10px;margin-top:10px}
.bq-acts .btn{flex:1}
.bq-deliver{font-size:18px;animation:pulse .8s ease-in-out infinite alternate}
.bq-refuse{flex:none;background:none;border:0;color:var(--muted);font:700 13px var(--display);text-decoration:underline;cursor:pointer;padding:6px}
.bq-slot{display:flex;align-items:center;gap:10px;border:2.5px dashed #d9c39a;border-radius:18px;padding:12px 14px;color:var(--ink2);font-size:14px;background:rgba(255,255,255,.4)}
.bq-slot svg{width:30px;height:30px;flex:none;opacity:.7}
.bq-foot{margin-top:12px}
.bq-h3{margin:14px 0 8px;font:800 16px var(--display)}
.bq-lockh{color:var(--muted)}
.bq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}
.bq-art{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:10px 6px 8px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.bq-art.rare{background:linear-gradient(#fff,#f6efff);border-color:#7a5fb8}
.bq-art.rare::before{content:"Rare";position:absolute;top:-9px;left:8px;background:#9a6fd6;color:#fff;font:800 11px/1 var(--display);padding:3px 7px;border-radius:8px;border:2px solid var(--ink)}
.bq-aico{position:relative;width:58px;height:58px;border-radius:14px;background:#fbf3e3;border:2px solid var(--rc);display:grid;place-items:center}
.bq-aico svg{width:46px;height:46px}
.bq-recb{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);background:var(--teal);color:#fff;font:800 10px/1 var(--display);font-style:normal;padding:2px 5px;border-radius:6px;white-space:nowrap}
.bq-art b{font:700 13.5px/1.15 var(--display);margin-top:4px}
.bq-art>span{font-size:11px;color:var(--muted);line-height:1.2}
.bq-art .btn{margin-top:auto}
.bq-art.locked{background:#f4efe6;border-style:dashed;box-shadow:none}
.bq-art.locked .bq-aico{filter:grayscale(.85) opacity(.55)}
.bq-art.sold{opacity:.55}
.bq-lock,.bq-sold{margin-top:auto;display:inline-flex;align-items:center;gap:3px;font:800 12.5px var(--display);color:var(--muted)}
.bq-lock svg{width:16px;height:16px}
.bq-tip{display:flex;align-items:center;gap:8px;background:#fff6dc;border:2px solid #ead9a6;border-radius:14px;padding:8px 10px;margin-bottom:10px;font-size:13px}
.bq-tip span{flex:1}
.bq-fly{position:fixed;width:48px;height:48px;z-index:60;pointer-events:none;animation:bqFly 1s cubic-bezier(.2,1.4,.5,1) forwards}
.bq-fly svg{width:100%;height:100%;filter:drop-shadow(0 3px 0 rgba(74,53,40,.3))}
@keyframes bqFly{0%{transform:scale(.4);opacity:0}25%{transform:translateY(-34px) scale(1.25);opacity:1}100%{transform:translateY(-90px) scale(.7);opacity:0}}
.bq-heart{position:fixed;width:22px;height:22px;z-index:60;pointer-events:none;animation:bqHeart 1.1s ease-out forwards}
.bq-heart svg{width:100%;height:100%}
@keyframes bqHeart{0%{transform:scale(.3);opacity:0}20%{opacity:1;transform:scale(1.1)}100%{transform:translate(var(--dx),-110px) scale(.8);opacity:0}}
.bq-lvup{text-align:center}
.bq-lvart{border:3px solid var(--ink);border-radius:18px;overflow:hidden;line-height:0;margin-bottom:10px}
.bq-kick{font:800 12px var(--display);text-transform:uppercase;letter-spacing:.08em;color:var(--teal)}
.bq-lvup h2{margin:2px 0}
.bq-title{font:600 19px var(--hand);margin:0 0 8px;color:var(--ink2)}
.bq-perks{list-style:none;padding:0;margin:0 0 12px;display:flex;flex-direction:column;gap:5px;text-align:left}
.bq-perks li{background:#effaf2;border:2px solid #9fd8b4;border-radius:12px;padding:6px 10px 6px 30px;position:relative;font-weight:700;font-size:14px}
.bq-perks li::before{content:"";position:absolute;left:9px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:var(--green);border:2px solid #2f7f6c}
.bq-haul{display:flex;align-items:center;gap:10px;background:#effaf2;border:2.5px solid #2f7f6c;border-radius:16px;padding:8px 10px;margin:10px 0;text-align:left}
.bq-haul img{width:48px;height:48px;flex:none;border-radius:12px;background:#d9f2e2;border:2px solid var(--ink)}
.bq-haul span{flex:1;display:flex;flex-direction:column}
.bq-haul b{font:800 15px var(--display)}
.bq-haul small{font-size:12.5px;color:var(--ink2)}
.bq-new{font-style:normal;font:800 10.5px var(--display);background:#ffe1ec;color:#b8456a;border-radius:6px;padding:1px 5px;vertical-align:2px}
.bq-recmore{display:block;width:100%;margin-top:10px;background:#fff6dc;border:2px dashed #e0b84a;border-radius:14px;padding:10px;font:700 14px var(--display);color:#7a5a12;cursor:pointer}
@media (max-width:520px){.bq-hero{height:104px}.bq-hero svg.bq-shop{width:100%;height:100%}.bq-intro-s{margin:10px 2px 6px}.bq-intro-s>span{display:none}.bq-orders+.bq-rep{margin-top:14px}}
@media (max-width:420px){.bq-face{width:58px;height:58px}.bq-ohx p{font-size:15.5px}.bq-grid{grid-template-columns:repeat(2,1fr)}}
@media (prefers-reduced-motion:reduce){.bq-order.ready,.bq-deliver{animation:none}}
/* commerces (phase B) */
.bq-subs button{position:relative}
.bq-rdot{position:absolute;top:2px;right:calc(50% - 22px);width:12px;height:12px;border-radius:50%;background:var(--rust,#d9604f);border:2px solid #fff;box-shadow:0 0 0 1.5px var(--ink)}
.bq-pick{display:flex;align-items:center;gap:10px;background:#fff6dc;border:2.5px solid var(--goldD,#c9952a);border-radius:18px;padding:10px 12px;margin-bottom:10px;box-shadow:0 3px 0 rgba(74,53,40,.25);position:relative}
.bq-pick>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.bq-pick b{font:800 15.5px/1.2 var(--display)}.bq-pick span{font-size:12.5px;color:var(--ink2);line-height:1.3}
.bq-pick .btn{flex:none}
.bq-pdot{flex:none;width:12px;height:12px;border-radius:50%;background:var(--rust,#d9604f);border:2px solid #fff;box-shadow:0 0 0 1.5px var(--ink)}
.bq-shops{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 6px;margin:0 -2px 2px;scrollbar-width:none}
.bq-shops::-webkit-scrollbar{display:none}
.bq-shopc{position:relative;flex:none;display:inline-flex;align-items:center;gap:6px;padding:4px 11px 4px 4px;border-radius:999px;border:2.5px solid var(--line);background:#fff;font:800 13.5px var(--display);color:var(--ink2);cursor:pointer;white-space:nowrap}
.bq-shopc[aria-selected="true"]{border-color:var(--ink);background:color-mix(in srgb,var(--aw) 22%,#fff);color:var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.3)}
.bq-shopi{width:30px;height:30px;border-radius:50%;background:#fff8ea;border:2px solid var(--ink);display:grid;place-items:center;font:800 20px/1 var(--display);color:var(--ink)}
.bq-shopi svg{width:24px;height:24px}
.bq-shopc.add{border-style:dashed;border-color:var(--ink);background:#fff6dc;color:var(--ink)}
.bq-shopc.add .bq-pdot{position:absolute;top:-4px;right:-4px}
.bq-shopc.lock{cursor:default;opacity:.75;border-style:dashed}
.bq-shopc.lock .bq-shopi svg{width:16px;height:16px}
.bq-perkl{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}
.bq-perkl i{font-style:normal;font:700 11.5px/1.25 var(--display);background:#effaf2;border:1.5px solid #9fd8b4;color:#2f6f50;border-radius:8px;padding:2px 7px}
.bq-spec{background:#effaf2!important;border-color:#9fd8b4!important;color:#2f6f50}
.bq-oshop{font-style:normal;color:var(--teal)}
.bq-eggi svg{width:40px!important;height:48px!important}
.bq-adopt{display:flex;flex-direction:column;align-items:center;gap:8px}
.bq-adimg{width:110px;height:120px;border-radius:20px;background:#fff3e2;border:2.5px solid var(--ink)}
.bq-adacts{display:flex;gap:10px;width:100%}.bq-adacts .btn{flex:1}
/* choix du commerce */
.bqc{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;text-align:center}
.bqc-kick{font:800 12px var(--display);letter-spacing:.08em;text-transform:uppercase;color:#fff;background:var(--teal);border:2px solid var(--ink);border-radius:999px;padding:3px 12px 1px}
.bqc h2{margin:0}
.bqc-ph{margin:0;font-size:14px;color:var(--ink2);line-height:1.4;text-wrap:balance}
.bqc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%;margin:4px 0}
.bqc-card{display:flex;flex-direction:column;align-items:stretch;gap:3px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:5px 5px 8px;cursor:pointer;text-align:left;box-shadow:0 3px 0 rgba(74,53,40,.3);font:inherit;color:var(--ink);transition:transform .15s}
.bqc-card:hover{transform:translateY(-2px)}.bqc-card:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(74,53,40,.3)}
.bqc-fac{display:block;line-height:0;border-radius:11px;border:2px solid var(--line);overflow:hidden;background:#e4f3fa}.bqc-fac svg{width:100%;height:auto}
.bqc-card b{font:800 14.5px/1.15 var(--display);padding:0 3px;margin-top:2px}
.bqc-card span{font-size:11.5px;line-height:1.3;color:var(--ink2);padding:0 3px}
.bqc-big{width:100%;max-width:300px;border:3px solid var(--ink);border-radius:18px;overflow:hidden;line-height:0}
.bqc-big svg{width:100%;height:auto}
.bqc h3{margin:6px 0 0;font:800 15px var(--display);align-self:flex-start}
.bqc-stars{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%}
.bqc-stars li{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:6px 4px}
.bqc-si{width:42px;height:42px;display:grid;place-items:center}.bqc-si svg{width:100%;height:100%}
.bqc-stars b{font:700 11.5px/1.15 var(--display)}
.bqc-uses{display:flex;flex-wrap:wrap;gap:4px;width:100%}
.bqc-uses i{font-style:normal;font:700 12px var(--display);background:#fff3e2;border:1.5px solid #e9cfae;border-radius:8px;padding:2px 8px}
.bqc-perks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;width:100%;text-align:left}
.bqc-perks li{background:#effaf2;border:2px solid #9fd8b4;border-radius:12px;padding:6px 10px 6px 30px;position:relative;font-weight:700;font-size:13.5px}
.bqc-perks li::before{content:"";position:absolute;left:9px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:var(--green);border:2px solid #2f7f6c}
.bqc-acts{display:flex;gap:8px;width:100%;margin-top:6px}.bqc-acts .btn{flex:1;min-width:0;padding-left:8px;padding-right:8px;font-size:16px;white-space:nowrap}
@media (max-width:420px){.bqc-acts .btn{font-size:14.5px}}
.mbox:has(.bqc){max-width:560px}
@media (min-width:700px){.bqc-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.hright{position:relative}.stonep{position:absolute;top:calc(100% + 3px);right:52px;z-index:2;display:inline-flex;align-items:center;gap:2px;background:rgba(255,255,255,.75);border:2px solid var(--ink);border-radius:999px;padding:1px 7px 1px 3px;font:800 13px var(--display);color:#3d4f99;cursor:pointer;box-shadow:0 2px 0 var(--ink);align-self:center}
.stonep .stone{width:18px;height:18px}.stonep.bump{animation:purseBump .45s cubic-bezier(.2,1.8,.4,1)}
.money .stone,.stonem .stone{width:16px;height:16px}.stonem{color:#3d4f99;font-weight:800}
.bq-tmw{display:flex;align-items:center;gap:6px;margin:-4px 0 10px;font:700 12.5px var(--display);color:var(--ink2)}.bq-tmw svg{width:16px;height:16px;flex:none}
.bq-pass{border:2.5px solid var(--ink);border-radius:18px;background:linear-gradient(135deg,#fff8ea,#fdeedd);box-shadow:0 3px 0 rgba(74,53,40,.25),inset 0 0 0 4px color-mix(in srgb,var(--pc) 28%,transparent);padding:10px;margin:0 0 12px}
.bq-ph{display:flex;align-items:center;gap:8px}.bq-ph img{width:58px;height:58px;flex:none;border-radius:50%;background:color-mix(in srgb,var(--pc) 30%,#fff);border:2px solid var(--ink)}
.bq-ph div{display:flex;flex-direction:column;min-width:0;line-height:1.2}.bq-ph small{font:800 10.5px var(--display);text-transform:uppercase;letter-spacing:.04em;color:#fff;background:var(--pc);border:1.5px solid var(--ink);border-radius:8px;padding:2px 6px;align-self:flex-start}
.bq-ph b{font:800 15px var(--display);margin-top:2px}.bq-ph span{font-size:12px;color:var(--ink2)}.bq-ph span b{font-size:12.5px}
.bq-prow{display:flex;gap:6px;overflow-x:auto;padding:8px 2px 2px;scrollbar-width:thin}
.bq-pi{flex:none;width:96px;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;background:#fff;border:2px solid var(--ink);border-radius:12px;padding:6px 4px}
.bq-pi .bq-aico{width:46px;height:46px}.bq-pi .bq-aico svg{width:36px;height:36px}.bq-pi b{font:700 11.5px/1.1 var(--display)}.bq-pi small{font-size:10px;color:var(--muted)}.bq-pi .btn{margin-top:auto}.bq-pi.sold{opacity:.55}
.bq-art.cc{grid-column:span 2;background:linear-gradient(#fff,#ffeef3);border-color:#e0607e;box-shadow:0 3px 0 #c24a68}
.bq-art.cc::before{content:"Coup de cœur · −30 %";position:absolute;top:-10px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#e0607e;color:#fff;font:800 12px/1 var(--display);padding:4px 9px;border-radius:9px;border:2px solid var(--ink)}
.bq-was{font-size:11.5px;color:var(--muted);text-decoration:line-through;margin-top:auto}.bq-was+.btn{margin-top:2px}
`;
  document.head.appendChild(st);
})();

window.__boutique = {
  open: openBoutique, render: renderBoutique, badge: shopBadge, ready: shopReady, state: bqState, tick: bqTick, stock: bqStock, pass: bqPass, stones: stonesN, gainStones,
  clients: BQ_CLIENTS, levels: BQ_LEVELS, clientSVG, shopSVG: bqShopSVG,
  // tests : fournir ce qu'une commande demande
  fill(id) {
    const o = bqState().orders.find(x => !id || x.id === id); if (!o) return null;
    o.req.forEach(r => {
      for (let i = bqAllocate(o)[o.req.indexOf(r)].have; i < r.n; i++) {
        let it;
        if (r.k === 'egg') { addEgg({ sp: r.sp || undefined, from: 'test' }); continue; }
        if (r.k === 'comp') { addComp({ sp: r.sp, from: 'test' }); continue; }
        if (r.k === 'bait') it = makeItem(['Appât test', 'm', 'appat', 1], 0, 'Test', []);
        else if (r.k === 'ing') it = makeItem([bqSampleIng(r.key).name || 'Ingrédient', bqSampleIng(r.key).cat, bqSampleIng(r.key).sub, 0], 0, 'Test', []);
        else if (r.k === 'reg') { const x = RG_RES[r.rid]; it = rgMakeRes(x, RG[x.region].anchor[2], [], { place: RG[x.region].anchor[2], km: 300 }); }
        else it = makeItem(r.def, 0, 'Test', [], { fixed: r.def[3] });
        S.inv.push(it);
      }
    });
    save(); return o.id;
  },
  shops: BQ_SHOPS, choose: (mode) => bqChooseOpen(mode || 'free'), openShop: id => bqOpenShop(id), switchTo: id => bqSwitch(id), type: () => bqType(), facade: bqFacadeSVG,
  newOrder(easy) { const o = bqNewOrder(!!easy); if (o) { bqState().orders.push(o); save(); } return o; },
  deliver: id => bqDeliver(id), refuse: id => bqRefuse(id), go: id => bqGo(id), buy: key => bqBuy(key), addRep(n) { const s = bqState(), l0 = s.lvl; s.rep += n; s.lvl = bqLevelOf(s.rep); save(); if (s.lvl > l0) bqLevelUp(s.lvl); },
};

// v21b : « pas 500 km pour une orange » : un produit courant se demande seulement s'il vient de pas trop loin.
function bqRegKm(x) { try { const R = RG[x.region]; return R && R.anchor ? kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }) : 0; } catch (e) { return 0; } }
function bqRegSense(x) { const km = bqRegKm(x), r = x.rar || 0; return r === 0 ? km < 300 : r === 1 ? km < 1200 : true; }

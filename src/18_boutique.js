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
  { name: 'Maison réputée', rep: 160, slots: 4, rich: 1.3, stock: 8, title: 'Maison qui compte en France', reach: 'Des clients de toute la France', perks: ['4 commandes à la fois', '+30 % de pièces par commande', 'Nouveaux vêtements et matériaux', 'Plantes, vitrine et seconde étagère', 'Clients de toute la France'] },
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
    lines: ['Deux croissants et une baguette bien cuite, s’il vous plaît !', 'C’est pour un goûter d’anniversaire : il faut que ça sente bon le beurre !', 'Votre pain est le meilleur du quartier, tout le monde le dit.'] },
  { id: 'cafe', name: 'Café-salon de thé', short: 'Salon de thé', em: 'tasse', aw: '#8a5a3a', aw2: '#f6e7d2', wall: '#f3e6d6', wall2: '#e8d3bb', front: '#e9d6bf', door: '#6b4a32',
    phrase: 'Des fauteuils moelleux, du thé fumant et des petits gâteaux.',
    stars: [['Chocolat chaud à la chantilly', 'n', 'boisson', 2, null, '#8a5a3a'], ['Macaron de Paris', 'n', 'sucre', 1, null, '#f39ab0'], ['Thé au jasmin', 'n', 'boisson', 1, null, '#c9d48a']],
    keys: ['boisson', 'sucre', 'agrume', 'fruit'], cats: ['cafe', 'chocolaterie', 'epicerie', 'marche'], itemCats: ['n'],
    crafts: ['chantilly', 'salade', 'bonhommechoc', 'confiture', 'tarte'],
    bsubs: ['boisson', 'sucre'], mult: 1.3, fast: 0.7,
    perks: ['Boissons et douceurs : +30 % de pièces', 'Les clients arrivent plus souvent (30 % d’attente en moins)'],
    lines: ['Un thé bien chaud et quelque chose de sucré, je vous prie.', 'Je reçois mes amies cet après-midi : il me faut de quoi faire un goûter chic.', 'Votre salon est si douillet… je pourrais y rester des heures.'] },
  { id: 'restaurant', name: 'Restaurant', short: 'Restaurant', em: 'cloche', aw: '#d9604f', aw2: '#fff4ea', wall: '#f8e4d8', wall2: '#f0cfbd', front: '#f3dccb', door: '#8a3a2f',
    phrase: 'Une petite table chaleureuse où chaque plat raconte un voyage.',
    stars: [['Fondue des copains', 'n', 'fromage', 3, null, '#f2c14e'], ['Soupe du potager', 'n', 'legume', 2, null, '#8fbf5a'], ['Croque-monsieur doré', 'n', 'pain', 2, null, '#e3b06b']],
    keys: ['plat', 'legume', 'fromage', 'pain', 'mer'], cats: ['restaurant', 'boucherie', 'fromagerie', 'marche', 'poissonnerie'], itemCats: ['n'],
    crafts: ['soupe', 'soupepotager', 'fondue', 'plateau', 'croque', 'sandrando'],
    bsubs: ['plat', 'legume', 'fromage', 'mer'], mult: 1.35, slot: 1,
    perks: ['Plats cuisinés, fromages et légumes : +35 % de pièces', 'Une commande de plus à la fois au comptoir'],
    lines: ['Une table pour quatre, et le plat du jour pour tout le monde !', 'J’ai une faim de loup… enfin, de blaireau.', 'Le chef peut-il me préparer quelque chose de réconfortant ?'] },
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
    crafts: ['mobile', 'plante', 'collier'], pets: 1,
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
    lines: ['Trois boules ! Non, quatre ! Avec un parapluie en papier !', 'Il fait si chaud… j’ai besoin de fraîcheur, vite !', 'C’est pour fêter la fin de l’école, toute la classe arrive !'] },
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
    crafts: ['plateau', 'confiture', 'salade'], reach: 1,
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
  s.lvl = bqLevelOf(s.rep);
  return s;
}
function bqLevelOf(rep) { let l = 0; BQ_LEVELS.forEach((L, i) => { if (rep >= L.rep) l = i; }); return l; }
const bqHome = () => { try { return typeof rgHome === 'function' ? rgHome() : null; } catch (e) { return null; } };
const bqRound5 = n => Math.max(5, Math.round(n / 5) * 5);

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
    regs.forEach(R => R.res.forEach(x => { if (x.rar <= maxR) pool.push(x); }));
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
const BQ_GEN_SHOP = {
  ing(T, c, L, easy) {
    const keys = T.keys.filter(k => ING[k] && bqCatFor(k, T.cats));
    const key = bqPick(keys, k => (c.likes.includes(k) ? 2 : 1)); if (!key) return null;
    return { k: 'ing', key, n: easy ? 2 : 2 + (L >= 2 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0), src: { cat: bqCatFor(key, T.cats) } };
  },
  item(T, c, L) {
    const cat = bqPick(T.cats.filter(x => bqPoiOK(x) && LOOT[x].some(d => T.itemCats.includes(d[1])))); if (!cat) return null;
    const subs = new Set([].concat(...T.keys.map(k => ING[k] ? ING[k][0] : []), T.bsubs || []));
    let defs = LOOT[cat].filter(d => d[3] <= (L >= 3 ? 1 : 0) && T.itemCats.includes(d[1]));
    const fitting = defs.filter(d => subs.has(d[2]) || (T.bcats && T.bcats.includes(d[1]))); if (fitting.length) defs = fitting; // ce que vend vraiment le commerce
    const def = bqPick(defs, d => d[3] ? 0.5 : 1); if (!def) return null;
    return { k: 'item', name: def[0], def, n: 1, src: { cat } };
  },
  craft(T, c, L, easy) {
    const pool = RECIPES.filter(r => !r.multi && bqCraftOK(T, r) && bqRecOwned(r.id) && r.ing.every(([k]) => !k.startsWith('r:')) && r.out[3] <= (easy ? 2 : L >= 2 ? 4 : 3));
    const r = bqPick(pool, r => (r.out[3] <= 2 ? 2 : 1)); if (!r) return null;
    return { k: 'craft', id: r.id, name: r.out[0], def: r.out, n: 1 };
  },
  reg(T, c, L) {
    const regs = bqRegionsFor(Math.min(5, L + (T.reach || 0))); if (!regs.length) return null;
    const subs = new Set([].concat(...T.keys.map(k => ING[k] ? ING[k][0] : []))), maxR = [0, 0, 1, 1, 2, 3][L] || 0, pool = [];
    regs.forEach(R => R.res.forEach(x => { if (x.rar <= maxR && (T.reach || subs.has(x.sub) || T.itemCats.includes(x.cat) && x.cat !== 'm')) pool.push(x); }));
    const x = bqPick(pool, x => (subs.has(x.sub) ? 3 : 1) * (x.rar ? 0.6 : 1)); if (!x) return null;
    return { k: 'reg', rid: x.id, name: x.name, n: 1, src: { region: x.region } };
  },
  egg(T, c, L) { const sp = L >= 2 && Math.random() < 0.5 ? bqPick(bqSpIds()) : null; return { k: 'egg', sp, n: 1, name: sp ? `Œuf de ${bqSpName(sp).toLowerCase()}` : 'Œuf de compagnon' }; },
  comp(T, c, L) { const sp = bqPick(bqSpIds()); return { k: 'comp', sp, n: 1, name: bqSpName(sp) }; },
  bait() { return S.inv.some(bqIsBait) ? { k: 'bait', n: 1, name: 'Appât pour compagnons' } : null; },
  souvenir(T, c, L) { return BQ_GEN.souvenir(c, Math.max(L, 3)); },
  merveille(T, c, L) { return BQ_GEN.merveille(c, L); },
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
  for (let t = 0; t < 14 && !req.length; t++) { const g = bqPick(kinds, k => W[k]); const r = BQ_GEN_SHOP[g](T, c, L, easy); if (r) req.push(r); }
  if (!req.length) { const r = BQ_GEN_SHOP.ing(T, c, L, true) || BQ_GEN.ing(c, L, true); if (r) req.push(r); }
  if (!easy && L >= 2 && Math.random() < 0.35 && !req.some(r => r.k === 'comp')) {
    const g = bqPick(['ing', 'item', 'reg'].filter(k => W[k]), k => W[k]); const r = g && BQ_GEN_SHOP[g](T, c, L, false);
    if (r && !req.some(x => x.k === r.k && (x.key || x.name || x.rid) === (r.key || r.name || r.rid))) req.push(r);
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
  const line = cr ? `Je rêve d’adopter ${typeof spArticle === 'function' ? spArticle(cr.sp) : 'un compagnon'}. Son panier est déjà prêt !` : T && Math.random() < 0.55 ? pick(T.lines) : pick(c.lines);
  const o = { id: uidGen(), client: c.id, line, req, coins: coinsR, rep, at: now, deadline, seq: ++s.seq, shop: T ? T.id : null, spec: spec ? 1 : 0 };
  // parfois une récompense en plus : une recette du magasin pas encore connue, ou un objet rare
  if (!forceEasy && Math.random() < 0.22 * (T && T.recx ? T.recx : 1)) {
    const rec = BQ_RECIPES.find(r => r.lvl <= L + 1 && !s.recipes.includes(r.id));
    if (rec && Math.random() < 0.5) o.bonus = { rec: rec.id };
    else { const tags = c.cats.filter(x => LOOT[x]).concat(c.tags.filter(x => LOOT[x])); const pl = [].concat(...tags.map(t => LOOT[t])).filter(d => d[3] === 2 && d[1] !== 't'); const d = bqPick(pl); if (d) o.bonus = { def: d }; }
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
  if (!s.orders.length && !s.served && !s.started) { s.started = now; for (let i = 0; i < 2; i++) { const o = bqNewOrder(true); if (o) s.orders.push(o); } s.next = now + bqInterval(0); changed = true; }
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
  if (a.k === 'o') { const nm = a.sp ? `Œuf de ${bqSpName(a.sp).toLowerCase()}` : 'Œuf commun'; return { egg: { sp: a.sp }, it: { name: nm, cat: 'o', rarity: a.sp ? 2 : 1 }, price: bqRound5(a.price * bqCheapF(null, 1)), name: nm }; }
  if (a.k === 'r') { const r = BQ_RECIPES.find(x => x.id === a.rec); return { rec: r, it: bqItemOf(r.out), price: r.price, name: `Recette : ${r.out[0]}` }; }
  if (a.k === 'x') return { it: a.it, price: a.price, name: a.it.name, rare: 1 };
  const it = bqItemOf(a.def);
  return { it, price: bqRound5(value({ ...it, id: '' }) * 1.5 * bqCheapF(it)), name: it.name };
}
function bqStock() {
  const s = bqState(), dk = dayKey(), L = s.lvl, T = bqType(), tid = T ? T.id : '';
  if (s.stock.day === dk && s.stock.lvl === L && (s.stock.type || '') === tid && s.stock.items.length) return s.stock.items;
  // les articles achetés aujourd'hui restent achetés, même si l'on change de commerce
  const keep = s.stock.day === dk ? new Set([...(s.stock.sold || []), ...s.stock.items.filter(x => x.sold).map(x => x.key)]) : new Set();
  seed(dk * 13 + 7 + L * 101 + [...tid].reduce((a, ch) => a + ch.charCodeAt(0) * 31, 0));
  const sh = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(srand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const n = bqLv(L).stock;
  const ok = BQ_CAT.filter(a => a.lvl <= L && !(a.k === 'r' && s.recipes.includes(a.rec)));
  // un panaché : vêtements, décos, matériaux, et une recette dès le niveau 2
  const byK = k => sh(ok.filter(a => a.k === k));
  const out = [];
  const plan = { v: Math.ceil(n * 0.35), d: Math.ceil(n * 0.2), m: Math.ceil(n * 0.25), r: L >= 1 ? 1 : 0 };
  for (const [k, c] of Object.entries(plan)) out.push(...byK(k).slice(0, c));
  for (const a of sh(ok)) { if (out.length >= n) break; if (!out.includes(a)) out.push(a); }
  const items = out.slice(0, n).map(a => ({ key: a.key }));
  // parfois un article rare (dès « Maison réputée »)
  if (L >= 2 && srand() < 0.6 && typeof REGIONS !== 'undefined') {
    const pool = []; REGIONS.forEach(R => R.res.forEach(x => { if (x.rar >= 2 && x.rar <= (L >= 5 ? 4 : 3)) pool.push(x); }));
    const x = pool[Math.floor(srand() * pool.length)];
    if (x) { const R = RG[x.region], km = kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }); const it = { name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, color: x.color, rid: x.id, origin: { region: R.id, place: R.short, km } }; items.push({ key: 'x_' + x.id, x: { it, price: bqRound5(value({ ...it, id: '' }) * 1.6) } }); }
  }
  // œufs de compagnons : un œuf commun (espèce surprise) chaque jour, parfois un œuf d'une espèce précise ; l'animalerie en a plus
  const sps = bqSpIds();
  items.unshift({ key: 'o_commun', o: { sp: null, price: 120 } });
  if (T && T.eggs) items.unshift({ key: 'o_commun2', o: { sp: null, price: 120 } });
  if (srand() < (T && T.eggs ? 1 : 0.35)) { const sp = sps[Math.floor(srand() * sps.length)]; items.unshift({ key: 'o_' + sp, o: { sp, price: 220 } }); }
  if (T && T.eggs && L >= 2) { const sp = sps[Math.floor(srand() * sps.length)]; if (!items.some(x => x.key === 'o_' + sp)) items.unshift({ key: 'o_' + sp, o: { sp, price: 220 } }); }
  // articles du niveau suivant : visibles mais verrouillés, pour donner envie
  if (L < BQ_LEVELS.length - 1) sh(BQ_CAT.filter(a => a.lvl === L + 1)).slice(0, 3).forEach(a => items.push({ key: a.key, locked: 1 }));
  items.forEach(x => { if (keep.has(x.key)) x.sold = 1; });
  s.stock = { day: dk, lvl: L, type: tid, items, sold: [...keep] };
  save();
  return items;
}
function bqStockArticle(x) { if (x.o) return { k: 'o', sp: x.o.sp, price: x.o.price }; if (x.x) return { k: 'x', it: x.x.it, price: x.x.price }; return BQ_CAT.find(a => a.key === x.key); }
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
const BQ_SP = {
  herisson: { fur: '#c49a72', dark: '#7a5a3f', face: '#f6e3c8', ears: 'round', er: 7, back: 'spikes' },
  loutre: { fur: '#a87a56', dark: '#7a5338', face: '#f2dcc0', ears: 'round', er: 6.5, whisk: 1 },
  renard: { fur: '#ec8a4f', dark: '#c9603a', face: '#fff5ea', ears: 'pointy', tip: '#5b4636', cheeks: 1 },
  lapin: { fur: '#f4efe6', dark: '#d9cfc0', face: '#fffaf2', ears: 'long', inner: '#f6b8c8' },
  chouette: { fur: '#b08a6a', dark: '#8a6448', face: '#f2e2c8', ears: 'tufts', beak: '#f2b03b', disc: 1 },
  ours: { fur: '#a0704f', dark: '#7a5338', face: '#e9cfa8', ears: 'round', er: 10 },
  souris: { fur: '#b9b4c4', dark: '#8a8496', face: '#f4f0f6', ears: 'big', inner: '#f6b8c8', whisk: 1 },
  raton: { fur: '#a6a6b2', dark: '#6a6a78', face: '#f4f2ee', ears: 'pointy', mask: '#4a4a56', inner: '#5b5b66', tip: '#5b5b66' },
  ecureuil: { fur: '#d9783f', dark: '#b05a2f', face: '#fbe6cc', ears: 'tufts', back: 'tail' },
  blaireau: { fur: '#5f5f6a', dark: '#3d3d48', face: '#f4f2ee', ears: 'round', er: 6, stripe: 1 },
  canard: { fur: '#f6d36b', dark: '#e3b04b', face: null, ears: 'none', beak: '#f2963b', bill: 1, tuft: 1 },
  grenouille: { fur: '#8fcf7f', dark: '#6faf5f', face: '#d8f0c8', ears: 'frog', wide: 1 },
  chat: { fur: '#e9a25f', dark: '#c97a3a', face: '#fff5ea', ears: 'pointy', inner: '#f6b8c8', whisk: 1, stripes: 1 },
  chien: { fur: '#e9cfa0', dark: '#b08050', face: '#fffaf2', ears: 'floppy' },
  mouton: { fur: '#f2dcc8', dark: '#d9bfa8', face: '#f8e8da', ears: 'side', wool: 1 },
  faon: { fur: '#c9905a', dark: '#a06a3a', face: '#fbe6cc', ears: 'side', spots: 1 },
  koala: { fur: '#a9aab6', dark: '#7a7b88', face: '#e8e8ee', ears: 'big', inner: '#f4f2f6', bignose: 1 },
  pingouin: { fur: '#3d4258', dark: '#262a3a', face: '#fbfbf6', ears: 'none', beak: '#f2a03a', pface: 1 },
  hamster: { fur: '#f2c08a', dark: '#d99a5f', face: '#fffaf0', ears: 'round', er: 6.5, puffy: 1 },
  tortue: { fur: '#9cc88a', dark: '#6f9f5f', face: '#d8ecc8', ears: 'none', back: 'shell' },
};
function clientSVG(c, mood, uid) {
  const P = BQ_SP[c.sp] || BQ_SP.ours, L = '#5b4636', sw = 'stroke="#5b4636" stroke-width="2.4" stroke-linejoin="round"';
  const joy = mood === 'joie', u = 'bq' + (uid || c.id);
  let s = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="bq-cl" role="img" aria-label="${esc(c.name)}, ${BQ_SP[c.sp] ? BQ_SPN[c.sp] : ''}">`;
  // dos : piquants, queue, carapace, laine
  if (P.back === 'spikes') { let d = 'M22 70'; for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.05 + i * 0.09), r1 = 44, r2 = 34; d += ` L${(60 + Math.cos(a) * r1).toFixed(1)} ${(60 + Math.sin(a) * r1).toFixed(1)} L${(60 + Math.cos(a + 0.045) * r2).toFixed(1)} ${(60 + Math.sin(a + 0.045) * r2).toFixed(1)}`; } s += `<path d="${d} L98 70Z" fill="${P.dark}" ${sw}/>`; }
  if (P.back === 'tail') s += `<path d="M86 112 C112 108 116 70 100 52 C92 42 104 30 112 38 C122 50 120 96 96 116Z" fill="${P.fur}" ${sw}/><path d="M104 46 C110 56 112 80 102 100" fill="none" stroke="${P.dark}" stroke-width="2" opacity=".6"/>`;
  if (P.back === 'shell') s += `<path d="M10 116 C8 86 30 70 60 70 C90 70 112 86 110 116Z" fill="#8a6a3a" ${sw}/><path d="M24 108 L36 86 L60 80 L84 86 L96 108 M36 86 L44 108 M84 86 L76 108 M60 80 L60 96" fill="none" stroke="#5b4636" stroke-width="1.6" opacity=".7"/>`;
  // oreilles derrière la tête
  const ear = (x, y, side) => {
    const m = side < 0 ? '' : ` transform="translate(${2 * 60} 0) scale(-1 1)"`;
    switch (P.ears) {
      case 'round': return `<g${m}><circle cx="${x}" cy="${y}" r="${P.er}" fill="${P.fur}" ${sw}/><circle cx="${x}" cy="${y}" r="${P.er * 0.5}" fill="${P.dark}" opacity=".55"/></g>`;
      case 'big': return `<g${m}><circle cx="${x - 4}" cy="${y + 2}" r="15" fill="${P.fur}" ${sw}/><circle cx="${x - 4}" cy="${y + 2}" r="9" fill="${P.inner}"/></g>`;
      case 'pointy': return `<g${m}><path d="M${x - 12} ${y + 14} L${x - 6} ${y - 14} L${x + 10} ${y + 6}Z" fill="${P.fur}" ${sw}/><path d="M${x - 9} ${y + 8} L${x - 6} ${y - 6} L${x + 4} ${y + 5}Z" fill="${P.inner || P.face || '#fff5ea'}"/>${P.tip ? `<path d="M${x - 8.4} ${y - 3} L${x - 6} ${y - 14} L${x - 1} ${y - 6}Z" fill="${P.tip}"/>` : ''}</g>`;
      case 'long': return `<g${m}><path d="M${x + 2} ${y + 14} C${x - 12} ${y - 10} ${x - 10} ${y - 34} ${x - 2} ${y - 36} C${x + 6} ${y - 34} ${x + 12} ${y - 10} ${x + 10} ${y + 12}Z" fill="${P.fur}" ${sw}/><path d="M${x + 3} ${y + 6} C${x - 4} ${y - 10} ${x - 4} ${y - 26} ${x} ${y - 28} C${x + 4} ${y - 26} ${x + 7} ${y - 10} ${x + 7} ${y + 6}Z" fill="${P.inner}"/></g>`;
      case 'tufts': return `<g${m}><path d="M${x - 8} ${y + 12} L${x - 6} ${y - 10} L${x + 8} ${y + 6}Z" fill="${P.dark}" ${sw}/></g>`;
      case 'floppy': return `<g${m}><path d="M${x + 4} ${y} C${x - 14} ${y - 4} ${x - 18} ${y + 30} ${x - 8} ${y + 36} C${x} ${y + 40} ${x + 6} ${y + 20} ${x + 8} ${y + 8}Z" fill="${P.dark}" ${sw}/></g>`;
      case 'side': return `<g${m}><ellipse cx="${x - 10}" cy="${y + 16}" rx="12" ry="6" transform="rotate(-25 ${x - 10} ${y + 16})" fill="${P.fur}" ${sw}/><ellipse cx="${x - 10}" cy="${y + 16}" rx="7" ry="3" transform="rotate(-25 ${x - 10} ${y + 16})" fill="#f6c2cf"/></g>`;
      case 'frog': return `<g${m}><circle cx="${x + 4}" cy="${y + 8}" r="11" fill="${P.fur}" ${sw}/></g>`;
      default: return '';
    }
  };
  // corps et vêtement
  s += `<path d="M14 120 C14 96 34 86 60 86 C86 86 106 96 106 120Z" fill="${c.cloth}" ${sw}/><path d="M48 88 Q60 98 72 88" fill="none" stroke="#5b4636" stroke-width="2" opacity=".5"/>`;
  if (P.ears !== 'floppy') s += ear(36, 34, -1) + ear(36, 34, 1);
  if (P.wool) s += `<g fill="#fbf8f0" ${sw}>${[[34, 40], [46, 30], [60, 27], [74, 30], [86, 40], [92, 54], [28, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('')}</g>`;
  // tête
  const hrx = P.wide ? 36 : P.puffy ? 34 : 31, hry = P.wide ? 25 : 28;
  s += `<ellipse cx="60" cy="58" rx="${hrx}" ry="${hry}" fill="${P.fur}" ${sw}/>`;
  if (P.ears === 'floppy') s += ear(34, 40, -1) + ear(34, 40, 1);
  if (P.wool) s += `<g fill="#fbf8f0">${[[42, 36], [54, 32], [66, 32], [78, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/>`).join('')}</g>`;
  if (P.stripe) s += `<path d="M54 31 C55 44 56 56 60 64 C64 56 65 44 66 31 C63 30 57 30 54 31Z" fill="#f4f2ee"/>`;
  if (P.stripes) s += `<path d="M52 32 l2 8 M60 30 v9 M68 32 l-2 8" stroke="${P.dark}" stroke-width="3" stroke-linecap="round"/>`;
  if (P.spots) s += `<g fill="#fff3e2" opacity=".85"><circle cx="42" cy="40" r="2.6"/><circle cx="50" cy="35" r="2"/><circle cx="76" cy="38" r="2.4"/><circle cx="70" cy="34" r="1.8"/></g>`;
  if (P.pface) s += `<path d="M60 76 C40 76 34 64 38 52 C41 44 50 44 56 49 L60 52 L64 49 C70 44 79 44 82 52 C86 64 80 76 60 76Z" fill="${P.face}"/>`;
  if (P.cheeks) s += `<path d="M30 60 C36 74 50 80 60 78 C70 80 84 74 90 60 C80 66 70 66 60 70 C50 66 40 66 30 60Z" fill="${P.face}"/>`;
  if (P.disc) s += `<circle cx="48" cy="56" r="11" fill="${P.face}"/><circle cx="72" cy="56" r="11" fill="${P.face}"/>`;
  if (P.mask) s += `<path d="M30 56 C36 48 52 50 60 56 C68 50 84 48 90 56 C86 64 72 64 60 60 C48 64 34 64 30 56Z" fill="${P.mask}"/>`;
  if (P.tuft) s += `<path d="M58 31 C54 22 60 20 62 24 C64 18 70 22 64 31" fill="${P.fur}" ${sw}/>`;
  // museau
  const beak = !!P.beak;
  if (P.face && !beak && !P.pface && !P.cheeks) s += `<ellipse cx="60" cy="${P.wide ? 66 : 68}" rx="${P.wide ? 22 : 15}" ry="${P.wide ? 8 : 10}" fill="${P.face}"/>`;
  else if (P.cheeks) s += `<ellipse cx="60" cy="69" rx="10" ry="7" fill="${P.face}"/>`;
  // yeux
  const ey = P.ears === 'frog' ? 46 : 57, ex = P.ears === 'frog' ? 18 : 12;
  if (P.ears === 'frog') s += `<circle cx="${60 - ex}" cy="${ey}" r="9" fill="#fff" ${sw}/><circle cx="${60 + ex}" cy="${ey}" r="9" fill="#fff" ${sw}/>`;
  [60 - ex, 60 + ex].forEach(x => {
    if (joy) s += `<path d="M${x - 4.5} ${ey + 1} Q${x} ${ey - 5} ${x + 4.5} ${ey + 1}" fill="none" stroke="#3a2a22" stroke-width="2.6" stroke-linecap="round"/>`;
    else s += `<ellipse cx="${x}" cy="${ey}" rx="${P.ears === 'frog' ? 4.6 : 4.2}" ry="${P.ears === 'frog' ? 5 : 5}" fill="#3a2a22"/><circle cx="${x + 1.4}" cy="${ey - 1.8}" r="1.6" fill="#fff"/>`;
  });
  // bec, nez, bouche
  if (P.bill) s += `<ellipse cx="60" cy="69" rx="12" ry="6" fill="${P.beak}" ${sw}/><path d="M50 69 H70" stroke="#5b4636" stroke-width="1.4" opacity=".6"/>`;
  else if (beak) s += `<path d="M55 64 L65 64 L60 73Z" fill="${P.beak}" ${sw}/>`;
  else {
    const ny = P.wide ? 62 : 64;
    if (P.bignose) s += `<ellipse cx="60" cy="${ny}" rx="7" ry="8.5" fill="#3a3a48"/>`;
    else s += `<ellipse cx="60" cy="${ny}" rx="3.6" ry="2.6" fill="#4a3528"/>`;
    s += joy ? `<path d="M53 ${ny + 4} Q60 ${ny + 12} 67 ${ny + 4}Z" fill="#c45a6a" stroke="#4a3528" stroke-width="1.6" stroke-linejoin="round"/>` : P.wide ? `<path d="M48 ${ny + 4} Q60 ${ny + 10} 72 ${ny + 4}" fill="none" stroke="#4a3528" stroke-width="2" stroke-linecap="round"/>` : `<path d="M55 ${ny + 4} q2.5 3 5 0 q2.5 3 5 0" fill="none" stroke="#4a3528" stroke-width="1.8" stroke-linecap="round"/>`;
    if (P.whisk) s += `<path d="M42 66 h-10 M42 70 l-9 3 M78 66 h10 M78 70 l9 3" stroke="#5b4636" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`;
  }
  if (P.puffy) s += `<ellipse cx="36" cy="68" rx="9" ry="7" fill="${P.face}"/><ellipse cx="84" cy="68" rx="9" ry="7" fill="${P.face}"/>`;
  s += `<ellipse cx="${60 - ex - 9}" cy="${ey + 9}" rx="5" ry="3" fill="#f49a98" opacity=".7"/><ellipse cx="${60 + ex + 9}" cy="${ey + 9}" rx="5" ry="3" fill="#f49a98" opacity=".7"/>`;
  // accessoire
  const a = c.accC || '#f39ab0';
  switch (c.acc) {
    case 'noeud': s += `<g transform="translate(80 33) rotate(15)"><path d="M0 0 L-11 -7 L-11 7Z M0 0 L11 -7 L11 7Z" fill="${a}" ${sw}/><circle r="3.4" fill="${a}" ${sw}/></g>`; break;
    case 'fleur': s += `<g transform="translate(${P.ears === 'long' ? 76 : 38} ${P.ears === 'long' ? 34 : 36})">${[0, 1, 2, 3, 4].map(k => `<circle cx="${(Math.cos(k * 1.256) * 5).toFixed(1)}" cy="${(Math.sin(k * 1.256) * 5).toFixed(1)}" r="4" fill="${a}" stroke="#5b4636" stroke-width="1.2"/>`).join('')}<circle r="2.8" fill="#f2c14e"/></g>`; break;
    case 'chapeau': s += `<ellipse cx="60" cy="${33}" rx="34" ry="7" fill="${a}" ${sw}/><path d="M42 33 C42 16 78 16 78 33Z" fill="${a}" ${sw}/><path d="M43 29 H77" stroke="#d9604f" stroke-width="3.4"/>`; break;
    case 'capitaine': s += `<path d="M36 36 C36 22 84 22 84 36Z" fill="${a}" ${sw}/><path d="M34 36 H86 L82 41 H38Z" fill="#2f3b5c" ${sw}/><circle cx="60" cy="30" r="3" fill="#f2c14e"/>`; break;
    case 'casquette': s += `<path d="M36 40 C36 22 84 22 84 40Z" fill="${a}" ${sw}/><path d="M80 38 C92 38 98 41 96 43 L80 43Z" fill="${a}" ${sw}/>`; break;
    case 'lunettes': s += `<circle cx="${60 - ex}" cy="${ey}" r="8" fill="#fff" fill-opacity=".25" stroke="${a}" stroke-width="2.2"/><circle cx="${60 + ex}" cy="${ey}" r="8" fill="#fff" fill-opacity=".25" stroke="${a}" stroke-width="2.2"/><path d="M${60 - ex + 8} ${ey} H${60 + ex - 8}" stroke="${a}" stroke-width="2"/>`; break;
    case 'monocle': s += `<circle cx="${60 + ex}" cy="${ey}" r="8" fill="#fff" fill-opacity=".25" stroke="${a}" stroke-width="2.2"/><path d="M${60 + ex + 6} ${ey + 6} C${80} 82 76 92 72 96" fill="none" stroke="${a}" stroke-width="1.4"/><path d="M48 33 C48 18 72 18 72 33Z M42 33 H78" fill="#3b3f5a" stroke="#5b4636" stroke-width="2.4"/>`; break;
    case 'echarpe': s += `<path d="M34 86 C44 94 76 94 86 86 L88 94 C74 102 46 102 32 94Z" fill="${a}" ${sw}/><path d="M74 96 L78 116 L86 114 L82 94Z" fill="${a}" ${sw}/>`; break;
    case 'perles': s += `<g fill="${a}" stroke="#5b4636" stroke-width="1.2">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<circle cx="${(40 + i * 5).toFixed(1)}" cy="${(90 + Math.sin(i / 8 * Math.PI) * 6).toFixed(1)}" r="2.6"/>`).join('')}</g>`; break;
  }
  return s + `</svg>`;
}
const clientURI = (c, mood) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clientSVG(c, mood).replace('<svg ', '<svg width="120" height="120" '));

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
  s.type = id; s.next = Math.min(s.next || Infinity, Date.now() + 3 * 60e3); save(); renderPanel();
  toast(`Bienvenue à la ${BQS(id).short.toLowerCase()} ! Les prochains clients viendront pour elle.`.replace('à la Restaurant', 'au restaurant'));
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
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="bq-shop" role="img" aria-label="La boutique, niveau ${esc(bqLv(L).name)}">`;
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
  let h = bqShopsBar() + `<div class="bq-hero">${bqShopSVG()}</div>` + bqRepHTML();
  const ready = shopReady();
  h += `<div class="bq-intro"><b>${s.orders.length ? (ready ? `${ready} commande${ready > 1 ? 's' : ''} prête${ready > 1 ? 's' : ''} à livrer !` : `${s.orders.length} client${s.orders.length > 1 ? 's' : ''} attend${s.orders.length > 1 ? 'ent' : ''} au comptoir`) : 'Le comptoir est calme…'}</b><span>Réunissez ce qu’ils demandent en voyage ou à l’atelier, puis livrez : pièces et réputation garanties.</span></div>`;
  h += `<div class="bq-orders">` + s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).map(bqOrderCard).join('');
  for (let i = s.orders.length; i < bqSlots(); i++) h += `<div class="bq-slot"><svg viewBox="0 0 30 30" aria-hidden="true">${BQ_ICONS.comptoir}</svg><span>${i === s.orders.length ? `Prochain client dans <b data-bqcd="${s.next}">${fmtDur(s.next - now)}</b>` : 'Place libre au comptoir'}</span></div>`;
  h += `</div>`;
  const served = Object.entries(s.clients).filter(([, v]) => v.served).length;
  h += `<p class="small bq-foot">${s.served} commande${s.served > 1 ? 's' : ''} livrée${s.served > 1 ? 's' : ''} · ${served}/${BQ_CLIENTS.length} clients déjà servis · ${coins(s.earned)} gagnées au comptoir. ${lv.reach}.</p>`;
  box.innerHTML = h;
}
function renderMagasin(box) {
  const s = bqState(), items = bqStock();
  let h = phead(null, 'Le magasin', `Les articles du jour, changés chaque matin. Vous avez ${coins(S.coins)}.`);
  const grp = [['o', 'Œufs de compagnons'], ['v', 'Vêtements et accessoires'], ['d', 'Meubles et décos'], ['m', 'Graines et matériaux'], ['r', 'Recettes à débloquer'], ['x', 'Article rare du jour']];
  const open = items.filter(x => !x.locked), locked = items.filter(x => x.locked);
  for (const [k, title] of grp) {
    const list = open.filter(x => (x.o ? 'o' : x.x ? 'x' : (BQ_CAT.find(a => a.key === x.key) || {}).k) === k); if (!list.length) continue;
    h += `<h3 class="bq-h3">${title}</h3><div class="bq-grid">${list.map(x => bqShopCard(x)).join('')}</div>`;
  }
  if (locked.length) h += `<h3 class="bq-h3 bq-lockh">Au niveau « ${esc(bqLv(s.lvl + 1).name)} »</h3><div class="bq-grid">${locked.map(x => bqShopCard(x)).join('')}</div><p class="small">Livrez des commandes au Comptoir pour gagner de la réputation et débloquer ces articles.</p>`;
  h += `<p class="small">Le stock change chaque jour. Plus votre boutique est réputée, plus il y a d’articles, et plus ils sont beaux.</p>`;
  box.innerHTML = h;
}
function bqShopCard(x) {
  const a = bqStockArticle(x); if (!a) return '';
  const art = bqArticle(a), it = art.it, can = S.coins >= art.price;
  if (art.egg) {
    const btn = x.sold ? '<span class="bq-sold">Acheté</span>' : `<button class="btn ${can ? 'gold' : 'cream'} sm" data-bbuy="${x.key}" ${can ? '' : 'disabled'}>${coins(art.price)}</button>`;
    return `<div class="bq-art bq-eggart${x.sold ? ' sold' : ''}" style="--rc:${RARC[it.rarity]}"><div class="bq-aico bq-eggi">${bqEggSVG(art.egg.sp, 'bqse' + x.key)}</div><b>${esc(art.name)}</b><span>${art.egg.sp ? `${esc(bqSpName(art.egg.sp))} garanti` : 'Espèce surprise'} · éclot en 3 min</span>${btn}</div>`;
  }
  const sub = art.rec ? `Recette · ${art.rec.kind}` : it.rid ? `${RARITY[it.rarity]} · spécialité ${typeof RG !== 'undefined' && RG[it.origin.region] ? esc(rgDe(RG[it.origin.region])) : ''}` : `${RARITY[it.rarity]} · ${it.cat === 'v' ? SLOT_LABEL[it.sub] : CAT_LABEL[it.cat]}`;
  const btn = x.locked ? `<span class="bq-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="10" rx="2.5" fill="#cfc5b4" stroke="#5b4636" stroke-width="2"/><path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 V10.5" stroke="#5b4636" stroke-width="2.2" fill="none"/></svg>Niveau ${a.lvl + 1}</span>` : x.sold ? '<span class="bq-sold">Acheté</span>' : `<button class="btn ${can ? 'gold' : 'cream'} sm" data-bbuy="${x.key}" ${can ? '' : 'disabled'}>${coins(art.price)}</button>`;
  return `<div class="bq-art${x.locked ? ' locked' : ''}${x.sold ? ' sold' : ''}${art.rare ? ' rare' : ''}" style="--rc:${RARC[it.rarity]}"><div class="bq-aico">${itemIcon(it)}${art.rec ? '<i class="bq-recb">Recette</i>' : ''}</div><b>${esc(art.rec ? art.rec.out[0] : art.name)}</b><span>${sub}</span>${btn}</div>`;
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
  const html = `<div class="bq-haul"><img src="${clientURI(BQC(nw[0].client), 'joie')}" alt=""><span><b>Commande prête !</b><small>${esc(names)} ${nw.length > 1 ? 'peuvent' : 'peut'} être servi${nw.length > 1 ? 's' : ''} à la boutique.</small></span><button class="btn green sm" data-bopen="comptoir">Livrer</button></div>`;
  const m = $('modal'), btn = where === 'haul' && m && !m.hidden ? m.querySelector('.mbox > button:last-child') : null;
  if (btn) btn.insertAdjacentHTML('beforebegin', html);
  else toast(`Commande prête : ${names} attend${nw.length > 1 ? 'ent' : ''} à la boutique !`);
  if (typeof renderNav === 'function') renderNav();
}
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
      const o = s.orders[0];
      o.req = [{ k: 'item', name: it.name, def: [it.name, it.cat, it.sub, 0, it.look || null, it.color || null], n: 1, src: { place: it.from || '' } }];
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
function bqTick() {
  try {
    const changed = bqTickOrders();
    if (changed) { save(); if (tab === 'boutique' && bView === 'comptoir') renderPanel(); else if (typeof renderNav === 'function') renderNav(); }
    const now = Date.now();
    document.querySelectorAll('[data-bqcd]').forEach(e => { e.textContent = fmtDur(+e.dataset.bqcd - now); });
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
`;
  document.head.appendChild(st);
})();

window.__boutique = {
  open: openBoutique, render: renderBoutique, badge: shopBadge, ready: shopReady, state: bqState, tick: bqTick, stock: bqStock,
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

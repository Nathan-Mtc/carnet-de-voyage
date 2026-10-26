// ================= LIEUX DU QUOTIDIEN =================
// cat: [libellé, couleur, glyphe, base, fréquence dans un quartier]
const POI_CATS = {
  boulangerie: ['Boulangerie', '#d9a05a', 'bread', 'ville', 10],
  cafe: ['Café', '#9c6b4a', 'cup', 'ville', 8],
  restaurant: ['Restaurant', '#d9604f', 'fork', 'ville', 8],
  marche: ['Marché', '#7fae4f', 'basket', 'ville', 3],
  epicerie: ['Épicerie fine', '#c98f4f', 'cheese', 'ville', 3],
  poissonnerie: ['Poissonnerie', '#4f97c4', 'fish', 'mer', 1],
  fleuriste: ['Fleuriste', '#e07a9a', 'flower', 'ville', 3],
  librairie: ['Librairie', '#7a6fb8', 'book', 'ville', 3],
  parc: ['Parc', '#5fa274', 'tree', 'foret', 6],
  rue: ['Rue', '#a89a8a', 'sign', 'ville', 0],
  route: ['Route', '#8a8378', 'road', 'campagne', 0],
  plage: ['Plage', '#e9b84a', 'umbrella', 'mer', 0],
  port: ['Port', '#3e6e9e', 'anchor', 'mer', 0],
  glacier: ['Glacier', '#f08aa6', 'cone', 'ville', 2],
  piscine: ['Piscine', '#4fb3d9', 'pool', 'lac', 1],
  gare: ['Gare', '#6b6f8a', 'train', 'ville', 0],
  musee: ['Musée', '#c39a4c', 'museum', 'monument', 2],
  patrimoine: ['Église ou château', '#9a7a5a', 'church', 'monument', 3],
  belvedere: ['Point de vue', '#5aa3a8', 'eye', 'montagne', 0],
  ecole: ['École', '#e9a03a', 'pencil', 'ville', 4],
  sport: ['Terrain de sport', '#4f9f78', 'ball', 'ville', 3],
  mode: ['Boutique de vêtements', '#b07ccf', 'shirt', 'ville', 4],
  friperie: ['Friperie', '#a8566a', 'shirt', 'ville', 2],
  cinema: ['Cinéma', '#3b3f5a', 'film', 'ville', 2],
  bricolage: ['Quincaillerie', '#7a8a9a', 'hammer', 'ville', 2],
  camping: ['Camping', '#6f9a5f', 'tent', 'foret', 0],
  jouets: ['Magasin de jouets', '#f2a03a', 'star', 'ville', 2],
  zoo: ['Zoo ou aquarium', '#8aa84f', 'paw', 'foret', 0],
  hotel: ['Hôtel', '#c9a35a', 'bed', 'ville', 3],
  poste: ['Bureau de poste', '#e3a92e', 'mail', 'ville', 2],
  pharmacie: ['Pharmacie', '#3faf72', 'cross', 'ville', 4],
  boutique: ['Boutique', '#c97a9a', 'bag', 'ville', 4],
  foret: ['Bois', '#4f8a5f', 'pine', 'foret', 0],
  campagne: ['Champs', '#a7b65a', 'wheat', 'campagne', 0],
  ferme: ['Ferme', '#b9824f', 'barn', 'campagne', 0],
};
Object.assign(LOOT, {
  boulangerie: [['Baguette tradition', 'n', 'pain', 0, null, '#e3b06b'], ['Croissant au beurre', 'n', 'sucre', 0, null, '#e9b86b'], ['Pain au chocolat', 'n', 'sucre', 0, null, '#c98a4f'], ['Farine de blé', 'm', 'farine', 0, null, '#f4efe2'], ['Chouquettes', 'n', 'sucre', 1, null, '#e3b06b'], ['Tablier de boulanger', 'v', 'haut', 1, 'tshirt', '#f4efe2'], ['Toque de boulanger', 'v', 'tete', 2, 'bonnet', '#ffffff'], ['Fève de galette', 'm', 'medaille', 3, null, '#f2c14e'], ['Croissant d’or', 'n', 'sucre', 4, null, '#f2c14e']],
  cafe: [['Café crème', 'n', 'boisson', 0, null, '#c99a6a'], ['Chocolat chaud', 'n', 'boisson', 0, null, '#8a5a3a'], ['Grain de café', 'm', 'graine', 0, null, '#6b4a32'], ['Ticket de caisse', 'm', 'papier', 0, null, '#f4efe2'], ['Tasse ébréchée', 'd', 'bocal', 1, null, '#e9dcc8'], ['Écharpe de terrasse', 'v', 'cou', 1, 'echarpe', '#c9604f'], ['Béret de poète', 'v', 'tete', 2, 'beret', '#3a3a4a'], ['Cuillère en argent', 'm', 'metal', 3, null, '#cfd6dc']],
  restaurant: [['Plat du jour', 'n', 'plat', 0, null, '#d9733f'], ['Soupe à l’oignon', 'n', 'plat', 0, null, '#d9a35a'], ['Serviette brodée', 'm', 'tissu', 0, null, '#f4efe2'], ['Bouchon de liège', 'm', 'bois', 0, null, '#c99a6a'], ['Nœud papillon de serveur', 'v', 'cou', 1, 'noeud', '#2f2f3a'], ['Tablier à carreaux', 'v', 'haut', 1, 'tshirt', '#d96b5f'], ['Toque de chef étoilé', 'v', 'tete', 3, 'bonnet', '#ffffff'], ['Recette secrète', 'm', 'papier', 3, null, '#efe2c4']],
  marche: [['Tomate du marché', 'n', 'legume', 0, null, '#e5584f'], ['Carotte fane', 'n', 'legume', 0, null, '#f08a3a'], ['Pomme reinette', 'n', 'pomme', 0, null, '#d9a03a'], ['Fraises', 'n', 'fruit', 0, null, '#e5584f'], ['Mandarine', 'n', 'agrume', 0, null, '#f2a93b'], ['Graines de potager', 'm', 'graine', 0, null, '#a9784f'], ['Panier en osier', 'v', 'dos', 1, 'sac', '#c99a5a'], ['Chapeau de maraîcher', 'v', 'tete', 1, 'chapeau', '#d9b46a'], ['Citrouille géante', 'n', 'legume', 3, null, '#f08a3a']],
  epicerie: [['Fromage de chèvre', 'n', 'fromage', 0, null, '#f6f0e0'], ['Pot de miel', 'n', 'sucre', 0, null, '#f2b13e'], ['Olives', 'n', 'legume', 0, null, '#6f8a3f'], ['Bocal en verre', 'm', 'verre', 0, null, '#d6eef2'], ['Torchon à carreaux', 'm', 'tissu', 0, null, '#d96b5f'], ['Comté affiné', 'n', 'fromage', 1, null, '#f2d06b'], ['Confiture maison', 'n', 'fruit', 1, null, '#c94a6a'], ['Truffe noire', 'n', 'legume', 4, null, '#3a2e2a']],
  poissonnerie: [['Sardines', 'n', 'mer', 0, null, '#9fb6c9'], ['Crevettes roses', 'n', 'mer', 0, null, '#f2908a'], ['Maquereau', 'n', 'mer', 0, null, '#5f87a8'], ['Écaille irisée', 'm', 'coquillage', 1, null, '#bfe3f6'], ['Huîtres', 'n', 'mer', 1, null, '#c9c3b8'], ['Bottes de pêcheur', 'v', 'pieds', 1, 'bottes', '#f6d36b'], ['Perle d’huître', 'm', 'perle', 3, null, '#f7eef2'], ['Homard bleu', 'n', 'mer', 4, null, '#3e6e9e']],
  fleuriste: [['Rose rouge', 'm', 'fleur', 0, null, '#e5584f'], ['Tulipe', 'm', 'fleur', 0, null, '#f39ab0'], ['Pétales de pivoine', 'm', 'fleur', 0, null, '#f6c2cf'], ['Graines de tournesol', 'm', 'graine', 0, null, '#7a5a3a'], ['Couronne de fleurs', 'v', 'tete', 1, 'fleurs', '#f6c2cf'], ['Plante en pot', 'd', 'plante', 1, null, '#7fbf6a'], ['Bouquet de mariée', 'm', 'fleur', 2, null, '#fff8f0'], ['Orchidée bleue', 'm', 'fleur', 3, null, '#7f9fe0'], ['Rose éternelle', 'm', 'fleur', 4, null, '#c94a6a']],
  librairie: [['Marque-page', 'm', 'papier', 0, null, '#e7c46a'], ['Vieux roman', 'm', 'papier', 0, null, '#b5876a'], ['Carte routière', 'm', 'papier', 0, null, '#bfe1f2'], ['Carnet de croquis', 'm', 'papier', 1, null, '#f4efe2'], ['Écharpe de lecteur', 'v', 'cou', 1, 'echarpe', '#7a6fb8'], ['Herbier ancien', 'd', 'herbier', 2, null, '#8fbf7f'], ['Mappemonde de bureau', 'd', 'mappemonde', 2, null, '#c9a97a'], ['Première édition', 'm', 'papier', 3, null, '#c9604f'], ['Grimoire mystérieux', 'm', 'papier', 4, null, '#5a3a6a']],
  parc: [['Feuille de platane', 'm', 'feuille', 0, null, '#a8c45a'], ['Gland', 'm', 'graine', 0, null, '#a9784f'], ['Plume de pigeon', 'm', 'plume', 0, null, '#b5b8c4'], ['Pâquerette', 'm', 'fleur', 0, null, '#fff8f0'], ['Caillou tout rond', 'm', 'pierre', 0, null, '#bdb5aa'], ['Ballon perdu', 'm', 'plastique', 1, null, '#e5584f'], ['Casquette oubliée', 'v', 'tete', 1, 'casquette', '#4f86c9'], ['Pièce ancienne', 'm', 'medaille', 2, null, '#c9a35a'], ['Trèfle à quatre feuilles', 'm', 'feuille', 3, null, '#5fbf5f'], ['Plume de paon', 'm', 'plume', 3, null, '#3fa6a6']],
  rue: [['Ticket de bus', 'm', 'papier', 0, null, '#bfe1f2'], ['Capsule de bouteille', 'm', 'metal', 0, null, '#c9604f'], ['Caillou', 'm', 'pierre', 0, null, '#a9a39a'], ['Affiche déchirée', 'm', 'papier', 0, null, '#f2d48f'], ['Bouton de manteau', 'm', 'plastique', 0, null, '#5b4636'], ['Craie de trottoir', 'm', 'pierre', 0, null, '#f3aec1'], ['Gant perdu', 'v', 'mains', 1, 'gants', '#c9604f'], ['Clé rouillée', 'm', 'metal', 1, null, '#a87a50'], ['Billet de loterie gagnant', 'm', 'papier', 3, null, '#f2c14e'], ['Bague perdue', 'm', 'metal', 4, null, '#f2c14e']],
  route: [['Gravier', 'm', 'pierre', 0, null, '#bdb5aa'], ['Coquelicot', 'm', 'fleur', 0, null, '#e5584f'], ['Boulon', 'm', 'metal', 0, null, '#9aa4ac'], ['Mûres du talus', 'n', 'fruit', 0, null, '#5a3a6a'], ['Plume de buse', 'm', 'plume', 1, null, '#a87a50'], ['Catadioptre', 'm', 'plastique', 1, null, '#f2a03a'], ['Gilet de sécurité', 'v', 'haut', 1, 'tshirt', '#f6e04a'], ['Vieille plaque émaillée', 'm', 'metal', 3, null, '#3b4a7a']],
  plage: [['Sable fin', 'm', 'sable', 0, null, '#f2dca6'], ['Coquillage', 'm', 'coquillage', 0, null, '#f6cdb8'], ['Galet poli', 'm', 'pierre', 0, null, '#bdb5aa'], ['Bois flotté', 'm', 'bois', 0, null, '#c9b49a'], ['Algue', 'm', 'feuille', 0, null, '#5f8a4a'], ['Bob de plage', 'v', 'tete', 0, 'chapeau', '#f39ab0'], ['Verre de mer', 'm', 'verre', 1, null, '#9fd8c4'], ['Short de bain', 'v', 'bas', 1, 'short', '#58c2b0'], ['Étoile de mer', 'm', 'corail', 2, null, '#f2905a'], ['Message dans une bouteille', 'm', 'verre', 3, null, '#bfe3d6'], ['Perle noire', 'm', 'perle', 4, null, '#3a3a4a']],
  port: [['Bout de corde', 'm', 'tissu', 0, null, '#d9c39a'], ['Filet de pêche', 'm', 'tissu', 0, null, '#7a8a6a'], ['Sardine fraîche', 'n', 'mer', 0, null, '#9fb6c9'], ['Bouée miniature', 'm', 'plastique', 1, null, '#e5584f'], ['Marinière', 'v', 'haut', 1, 'pull', '#f4f1ea'], ['Casquette de capitaine', 'v', 'tete', 2, 'casquette', '#2f3b5c'], ['Ancre miniature', 'm', 'metal', 3, null, '#5c6b94'], ['Longue-vue', 'm', 'metal', 3, null, '#c9a35a']],
  glacier: [['Glace vanille', 'n', 'glace', 0, null, '#fbf0d0'], ['Glace fraise', 'n', 'glace', 0, null, '#f6a6b8'], ['Sorbet citron', 'n', 'agrume', 0, null, '#f6e07a'], ['Cornet croustillant', 'n', 'sucre', 0, null, '#d9a36b'], ['Cuillère en bois', 'm', 'bois', 0, null, '#d9b48a'], ['Bonnet sorbet', 'v', 'tete', 2, 'bonnet', '#f6a6b8'], ['Glace arc-en-ciel', 'n', 'glace', 3, null, '#b9a6e6']],
  piscine: [['Bonnet de bain', 'v', 'tete', 0, 'bonnet', '#4fb3d9'], ['Serviette rayée', 'm', 'tissu', 0, null, '#f39ab0'], ['Short de bain bleu', 'v', 'bas', 0, 'short', '#4f86c9'], ['Tongs', 'v', 'pieds', 1, 'chaussettes', '#58c2b0'], ['Bouée canard', 'm', 'plastique', 1, null, '#f6d36b'], ['Médaille de natation', 'm', 'medaille', 2, null, '#e3b94a']],
  gare: [['Billet de train', 'm', 'papier', 0, null, '#f2d48f'], ['Horaires jaunis', 'm', 'papier', 0, null, '#efe2c4'], ['Sandwich jambon-beurre', 'n', 'pain', 0, null, '#e3b06b'], ['Écharpe de voyageur', 'v', 'cou', 1, 'echarpe', '#5c6b94'], ['Valise vintage', 'v', 'dos', 2, 'sac', '#a8566a'], ['Montre à gousset', 'm', 'metal', 3, null, '#c9a35a'], ['Billet de l’Orient-Express', 'm', 'papier', 4, null, '#a8394a']],
  musee: [['Ticket d’entrée', 'm', 'papier', 0, null, '#f4efe2'], ['Pinceau d’artiste', 'm', 'bois', 1, null, '#c9734a'], ['Éclat de mosaïque', 'm', 'verre', 1, null, '#7fc4d9'], ['Reproduction miniature', 'd', 'statue', 1, null, '#e8d6ae'], ['Béret de peintre', 'v', 'tete', 1, 'beret', '#c94a4a'], ['Fragment antique', 'm', 'eclat', 3, null, '#d9c38f'], ['Tableau perdu', 'd', 'herbier', 4, null, '#c9a35a']],
  patrimoine: [['Pierre taillée', 'm', 'pierre', 0, null, '#c9b8a6'], ['Cierge', 'm', 'lumiere', 0, null, '#fbf0d0'], ['Éclat de vitrail', 'm', 'verre', 1, null, '#7f9fe0'], ['Écusson brodé', 'm', 'tissu', 1, null, '#3b4a7a'], ['Cloche miniature', 'm', 'metal', 2, null, '#c9a35a'], ['Cape de chevalier', 'v', 'dos', 3, 'cape', '#3b4a7a'], ['Couronne ancienne', 'v', 'tete', 4, 'couronne', '#f2c14e']],
  belvedere: [['Caillou du belvédère', 'm', 'pierre', 0, null, '#bdb5aa'], ['Bonnet de randonneur', 'v', 'tete', 0, 'bonnet', '#5aa3a8'], ['Carte panoramique', 'm', 'papier', 1, null, '#bfe1f2'], ['Fleur des sommets', 'm', 'fleur', 1, null, '#cdb8ea'], ['Plume d’aigle', 'm', 'plume', 2, null, '#8a6448'], ['Éclat de lumière', 'm', 'lumiere', 3, null, '#f6e08a']],
  ecole: [['Crayon de couleur', 'm', 'bois', 0, null, '#e5584f'], ['Gomme parfumée', 'm', 'plastique', 0, null, '#f6c2cf'], ['Craie blanche', 'm', 'pierre', 0, null, '#ffffff'], ['Cahier à spirale', 'm', 'papier', 0, null, '#4f86c9'], ['Goûter', 'n', 'sucre', 0, null, '#c98a4f'], ['Cartable', 'v', 'dos', 1, 'sac', '#c9604f'], ['Bon point', 'm', 'papier', 1, null, '#f2c14e'], ['Diplôme', 'm', 'papier', 3, null, '#f4efe2']],
  sport: [['Ballon de foot', 'm', 'plastique', 0, null, '#ffffff'], ['Gourde', 'm', 'plastique', 0, null, '#58c2b0'], ['Casquette de supporter', 'v', 'tete', 0, 'casquette', '#d9604f'], ['Chaussettes de sport', 'v', 'pieds', 0, 'chaussettes', '#ffffff'], ['Sifflet', 'm', 'metal', 1, null, '#c9cdd2'], ['Maillot de l’équipe', 'v', 'haut', 1, 'tshirt', '#4f86c9'], ['Médaille d’or', 'm', 'medaille', 3, null, '#f2c14e'], ['Coupe miniature', 'd', 'statue', 4, null, '#f2c14e']],
  mode: [['T-shirt basique', 'v', 'haut', 0, 'tshirt', '#fbf6ec'], ['Sweat à capuche', 'v', 'haut', 0, 'sweat', '#b8d8f0'], ['Bonnet côtelé', 'v', 'tete', 0, 'bonnet', '#cdbfe9'], ['Écharpe en laine', 'v', 'cou', 0, 'echarpe', '#bfe3d6'], ['Short en jean', 'v', 'bas', 0, 'short', '#7f9fc4'], ['Chaussettes à motifs', 'v', 'pieds', 0, 'chaussettes', '#f6d88a'], ['Pull doux', 'v', 'haut', 1, 'pull', '#f6c2cf'], ['Jupe plissée', 'v', 'bas', 1, 'jupe', '#f4b7c4'], ['Gants en cuir', 'v', 'mains', 1, 'gants', '#8a5a3a'], ['Cape de défilé', 'v', 'dos', 3, 'cape', '#2f2f3a'], ['Béret de créateur', 'v', 'tete', 3, 'beret', '#e0607e']],
  friperie: [['Pull de grand-père', 'v', 'haut', 0, 'pull', '#b9b48a'], ['Foulard rétro', 'v', 'cou', 0, 'foulard', '#e3b04b'], ['Moufles tricotées main', 'v', 'mains', 0, 'moufles', '#d96b5f'], ['Bouton doré', 'm', 'metal', 0, null, '#e3b94a'], ['Chute de tissu', 'm', 'tissu', 0, null, '#c9b8ea'], ['Chapeau vintage', 'v', 'tete', 1, 'chapeau', '#8a6448'], ['Bottes d’occasion', 'v', 'pieds', 1, 'bottes', '#8a5a3a'], ['Veste des années 80', 'v', 'haut', 3, 'sweat', '#e0607e'], ['Broche ancienne', 'm', 'medaille', 4, null, '#9a6fd6']],
  cinema: [['Pop-corn', 'n', 'sucre', 0, null, '#fbe6a6'], ['Ticket de cinéma', 'm', 'papier', 0, null, '#e5584f'], ['Bonbons acidulés', 'n', 'sucre', 0, null, '#f39ab0'], ['Affiche de film', 'm', 'papier', 1, null, '#3b4a7a'], ['Lunettes 3D', 'm', 'plastique', 1, null, '#d9604f'], ['Pellicule', 'm', 'plastique', 2, null, '#3a3a3a'], ['Étoile de cinéma', 'm', 'medaille', 4, null, '#f2c14e']],
  bricolage: [['Clou', 'm', 'metal', 0, null, '#9aa4ac'], ['Vis', 'm', 'metal', 0, null, '#b5bcc2'], ['Ficelle', 'm', 'tissu', 0, null, '#d9c39a'], ['Planche de bois', 'm', 'bois', 0, null, '#c99a6a'], ['Gants de jardin', 'v', 'mains', 0, 'gants', '#7fae4f'], ['Pot de peinture', 'm', 'plastique', 1, null, '#4f97c4'], ['Salopette de bricoleur', 'v', 'bas', 1, 'short', '#5c6b94'], ['Boîte à outils dorée', 'm', 'metal', 3, null, '#f2c14e']],
  camping: [['Guimauve grillée', 'n', 'sucre', 0, null, '#fbf0e0'], ['Bâton de marche', 'm', 'bois', 0, null, '#a87a50'], ['Pomme de pin', 'm', 'graine', 0, null, '#8a6448'], ['Lampe torche', 'm', 'lumiere', 1, null, '#f6e08a'], ['Bonnet de feu de camp', 'v', 'tete', 1, 'bonnet', '#d9733f'], ['Plaid à carreaux', 'm', 'tissu', 1, null, '#c94a4a'], ['Lanterne de camping', 'd', 'lanterne', 2, null, '#f6d36b'], ['Boussole ancienne', 'm', 'metal', 3, null, '#c9a35a']],
  jouets: [['Bille en verre', 'm', 'verre', 0, null, '#7fc4d9'], ['Toupie', 'm', 'bois', 0, null, '#e5584f'], ['Ruban cadeau', 'm', 'tissu', 0, null, '#f39ab0'], ['Peluche', 'm', 'tissu', 1, null, '#c9a985'], ['Cerf-volant', 'm', 'tissu', 1, null, '#58c2b0'], ['Bonnet à oreilles', 'v', 'tete', 2, 'bonnet', '#f6c2cf'], ['Boîte à musique', 'd', 'bocal', 3, null, '#f2d48f']],
  zoo: [['Graines pour oiseaux', 'm', 'graine', 0, null, '#d9b46a'], ['Laine de lama', 'm', 'laine', 0, null, '#efe2c4'], ['Casquette safari', 'v', 'tete', 0, 'casquette', '#c9b48a'], ['Plume de perroquet', 'm', 'plume', 1, null, '#5fbf7f'], ['Écaille de poisson tropical', 'm', 'coquillage', 1, null, '#f6a63b'], ['Peluche panda roux', 'm', 'tissu', 2, null, '#ec9c6f'], ['Faux œuf de dinosaure', 'm', 'pierre', 3, null, '#b9cc8a']],
  hotel: [['Savonnette parfumée', 'm', 'plastique', 0, null, '#f6c2cf'], ['Chocolat sur l’oreiller', 'n', 'sucre', 0, null, '#6b4a32'], ['Chaussons d’hôtel', 'v', 'pieds', 0, 'chaussettes', '#fbf6ec'], ['Étiquette de bagage', 'm', 'papier', 0, null, '#efe2c4'], ['Peignoir moelleux', 'v', 'haut', 1, 'sweat', '#ffffff'], ['Clé de chambre', 'm', 'metal', 1, null, '#c9a35a'], ['Clé de la suite royale', 'm', 'metal', 4, null, '#f2c14e']],
  poste: [['Timbre', 'm', 'papier', 0, null, '#d96b5f'], ['Enveloppe', 'm', 'papier', 0, null, '#f4efe2'], ['Carte postale vierge', 'm', 'papier', 0, null, '#bfe1f2'], ['Colis mystère', 'm', 'papier', 2, null, '#c99a6a'], ['Sacoche de facteur', 'v', 'dos', 2, 'sac', '#3b5aa8'], ['Timbre rare', 'm', 'papier', 4, null, '#9a6fd6']],
  pharmacie: [['Pansement', 'm', 'tissu', 0, null, '#f2d0b0'], ['Bonbon à la menthe', 'n', 'sucre', 0, null, '#bfe3d6'], ['Tisane', 'n', 'boisson', 0, null, '#a6cf8e'], ['Baume à lèvres', 'm', 'plastique', 0, null, '#f6c2cf'], ['Écharpe chaude', 'v', 'cou', 1, 'echarpe', '#4fbf7f'], ['Herbes médicinales', 'm', 'feuille', 1, null, '#7fae4f'], ['Élixir doré', 'n', 'boisson', 3, null, '#f2c14e']],
  ferme: [['Œufs frais', 'n', 'plat', 0, null, '#f6ead2'], ['Lait de la ferme', 'n', 'boisson', 0, null, '#fbf8f0'], ['Paille', 'm', 'ble', 0, null, '#e7c46a'], ['Plume de poule', 'm', 'plume', 0, null, '#f4efe2'], ['Pomme du verger', 'n', 'pomme', 0, null, '#d9a03a'], ['Laine de mouton', 'm', 'laine', 0, null, '#f4efe2'], ['Bottes en caoutchouc', 'v', 'pieds', 1, 'bottes', '#5f8a4a'], ['Chapeau de fermier', 'v', 'tete', 1, 'chapeau', '#c9a35a'], ['Fer à cheval porte-bonheur', 'm', 'metal', 3, null, '#9aa4ac']],
  boutique: [['Sac en papier', 'm', 'papier', 0, null, '#d9b48a'], ['Ruban', 'm', 'tissu', 0, null, '#e07a9a'], ['Bougie parfumée', 'm', 'lumiere', 0, null, '#f6e0c0'], ['Porte-clés', 'm', 'metal', 0, null, '#c9a35a'], ['Tote bag', 'v', 'dos', 1, 'sac', '#f4efe2'], ['Mug souvenir', 'd', 'bocal', 1, null, '#ffffff'], ['Objet de collection', 'm', 'medaille', 3, null, '#9a6fd6']],
});
// Spécialité unique à chaque lieu ({P} = nom du lieu)
const SPECIALTY = {
  boulangerie: ['Brioche de {P}', 'n', 'sucre', 2, null, '#e9b86b'], cafe: ['Mélange maison de {P}', 'n', 'boisson', 2, null, '#8a5a3a'], restaurant: ['Plat signature de {P}', 'n', 'plat', 2, null, '#d9733f'],
  marche: ['Panier garni de {P}', 'n', 'legume', 2, null, '#7fae4f'], epicerie: ['Pot secret de {P}', 'n', 'sucre', 2, null, '#f2b13e'], poissonnerie: ['Pêche du jour de {P}', 'n', 'mer', 2, null, '#5f87a8'],
  fleuriste: ['Bouquet de {P}', 'm', 'fleur', 2, null, '#e07a9a'], librairie: ['Ex-libris de {P}', 'm', 'papier', 2, null, '#7a6fb8'], parc: ['Feuille d’or de {P}', 'm', 'feuille', 2, null, '#f2c14e'],
  rue: ['Plaque émaillée « {P} »', 'm', 'metal', 2, null, '#3b5aa8'], route: ['Borne de la {P}', 'm', 'pierre', 2, null, '#e9e2d6'], plage: ['Sable doré de {P}', 'm', 'sable', 2, null, '#f2c14e'],
  port: ['Pavillon de {P}', 'm', 'tissu', 2, null, '#3e6e9e'], glacier: ['Parfum secret de {P}', 'n', 'glace', 2, null, '#b9a6e6'], musee: ['Catalogue de {P}', 'm', 'papier', 2, null, '#c39a4c'],
  patrimoine: ['Médaille de {P}', 'm', 'medaille', 2, null, '#c9a35a'], gare: ['Billet pour {P}', 'm', 'papier', 2, null, '#f2d48f'], mode: ['Pièce unique de {P}', 'v', 'cou', 2, 'foulard', '#b07ccf'],
  friperie: ['Trouvaille de {P}', 'v', 'tete', 2, 'chapeau', '#a8566a'],
};
const SPEC_DEFAULT = ['Souvenir de {P}', 'm', 'medaille', 2, null, '#c9a35a'];
Object.assign(TAGC, Object.fromEntries(Object.entries(POI_CATS).map(([k, v]) => [k, v[1]])));
Object.assign(TAGL, Object.fromEntries(Object.entries(POI_CATS).map(([k, v]) => [k, v[0]])));
Object.assign(FOOD_TASTE.pistache, { love: ['pomme', 'fruit', 'pain'] });
Object.assign(FOOD_TASTE.mochi, { love: ['agrume', 'boisson'] });
Object.assign(FOOD_TASTE.bulle, { love: ['mer', 'glace'] });
Object.assign(ING, { tissu: [['tissu', 'laine'], 'Tissu'], metal: [['metal', 'medaille'], 'Métal'], verre: [['verre', 'cristal'], 'Verre'], bois: [['bois'], 'Bois'], farine: [['farine'], 'Farine'] });
RECIPES.push(
  { id: 'painmaison', kind: 'Cuisine', out: ['Pain de campagne maison', 'n', 'pain', 2, null, '#c98a4f'], ing: [['farine', 2]], coins: 0 },
  { id: 'capecousue', kind: 'Vêtement', out: ['Cape cousue main', 'v', 'dos', 2, 'cape', '#c9604f'], ing: [['tissu', 3]], coins: 10 },
  { id: 'sacvoyage', kind: 'Vêtement', out: ['Sac de voyage', 'v', 'dos', 2, 'sac', '#a87a50'], ing: [['tissu', 2], ['bois', 1]], coins: 10 },
  { id: 'bonnettric', kind: 'Vêtement', out: ['Bonnet tricoté', 'v', 'tete', 2, 'bonnet', '#e9a03a'], ing: [['tissu', 2]], coins: 5 },
  { id: 'lanverre', kind: 'Décoration', out: ['Lanterne de verre', 'd', 'lanterne', 2, null, '#bfe3f6'], ing: [['verre', 2], ['metal', 1]], coins: 10 },
  { id: 'mobile', kind: 'Décoration', out: ['Mobile de coquillages', 'd', 'bocal', 2, null, '#f6cdb8'], ing: [['coquillage', 2], ['bois', 1]], coins: 5 },
  { id: 'statuebois', kind: 'Décoration', out: ['Statuette sculptée', 'd', 'statue', 3, null, '#c99a6a'], ing: [['bois', 4]], coins: 20 },
);
const POI_GLYPH = {
  bread: '<path d="M3 15 C3 7 21 7 21 15 C21 18 3 18 3 15Z" fill="#fff"/><path d="M8 10.5 l2 4 M12 10 l2 4 M16 10.5 l2 4" stroke="#000" stroke-opacity=".28" stroke-width="1.6"/>',
  cup: '<path d="M4 9 H16 V14 C16 19 4 19 4 14Z" fill="#fff"/><path d="M16 10.5 h2 a2 2 0 0 1 0 4 h-2" stroke="#fff" stroke-width="2" fill="none"/><path d="M8 3.5 q2 2 0 4 M12 3.5 q2 2 0 4" stroke="#fff" stroke-width="1.6" fill="none"/>',
  fork: '<path d="M7 3 V9 M5 3 V8 a2 2 0 0 0 4 0 V3 M7 10 V21" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 3 C13 6 13 11 16 12 V21" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  basket: '<path d="M3 10 H21 L19 20 H5Z" fill="#fff"/><path d="M7 10 C7 4 17 4 17 10" stroke="#fff" stroke-width="2" fill="none"/>',
  cheese: '<path d="M3 18 L19 6 L21 18Z" fill="#fff"/><circle cx="15" cy="14" r="1.6" fill="#000" fill-opacity=".25"/>',
  fish: '<path d="M3 12 C7 6 15 6 18 12 C15 18 7 18 3 12Z M18 12 L22 8 V16Z" fill="#fff"/>',
  flower: '<circle cx="12" cy="7" r="3.6" fill="#fff"/><circle cx="7" cy="11" r="3.6" fill="#fff"/><circle cx="17" cy="11" r="3.6" fill="#fff"/><circle cx="9" cy="16" r="3.6" fill="#fff"/><circle cx="15" cy="16" r="3.6" fill="#fff"/>',
  book: '<path d="M3 5 C7 4 10 5 12 7 C14 5 17 4 21 5 V19 C17 18 14 19 12 20 C10 19 7 18 3 19Z" fill="#fff"/>',
  tree: '<circle cx="12" cy="10" r="7" fill="#fff"/><rect x="11" y="15" width="2.4" height="7" fill="#fff"/>',
  sign: '<rect x="3" y="5" width="18" height="9" rx="2" fill="#fff"/><path d="M12 14 V22" stroke="#fff" stroke-width="2.4"/>',
  road: '<path d="M7 22 L10.5 2 H13.5 L17 22Z" fill="#fff"/><path d="M12 5 v3 M12 11 v3 M12 17 v3" stroke="#000" stroke-opacity=".3" stroke-width="1.4"/>',
  umbrella: '<path d="M2 12 C3 4 21 4 22 12Z" fill="#fff"/><path d="M12 12 V20 q0 2 -2 1.4" stroke="#fff" stroke-width="2" fill="none"/>',
  anchor: '<circle cx="12" cy="5" r="2.2" stroke="#fff" stroke-width="2" fill="none"/><path d="M12 7 V21 M5 14 C5 19.5 19 19.5 19 14 M8 11 H16" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  cone: '<circle cx="12" cy="8" r="5.4" fill="#fff"/><path d="M6.8 10 L12 22 L17.2 10Z" fill="#fff"/>',
  pool: '<path d="M2 10 q5 -4 10 0 q5 4 10 0 M2 16 q5 -4 10 0 q5 4 10 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="3" fill="#fff"/><path d="M8 21 L10 17 M16 21 L14 17" stroke="#fff" stroke-width="2"/><rect x="7.5" y="6" width="9" height="4" rx="1" fill="#000" fill-opacity=".28"/>',
  museum: '<path d="M3 8 L12 3 L21 8Z M4 21 H20 V19 H4Z M6 9 h2 v9 h-2Z M11 9 h2 v9 h-2Z M16 9 h2 v9 h-2Z" fill="#fff"/>',
  church: '<path d="M12 1.5 V6 M10 3.5 H14" stroke="#fff" stroke-width="2"/><path d="M5 22 V12 L12 6 L19 12 V22Z" fill="#fff"/>',
  eye: '<path d="M2 12 C6 5 18 5 22 12 C18 19 6 19 2 12Z" fill="#fff"/><circle cx="12" cy="12" r="3.4" fill="#000" fill-opacity=".3"/>',
  pencil: '<path d="M4 20 L5 15 L16 4 L20 8 L9 19Z" fill="#fff"/>',
  ball: '<circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 7 l4 3 -1.5 4.5 h-5 L8 10Z" fill="#000" fill-opacity=".3"/>',
  shirt: '<path d="M8 3 L3 7 L6 11 L8 9 V21 H16 V9 L18 11 L21 7 L16 3 Q12 6 8 3Z" fill="#fff"/>',
  film: '<rect x="3" y="6" width="18" height="12" rx="2" fill="#fff"/><path d="M3 10 H21 M3 14 H21" stroke="#000" stroke-opacity=".28"/>',
  hammer: '<path d="M5 20 L14 11" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M11 6 L17 3 L21 7 L18 13 L15 10Z" fill="#fff"/>',
  tent: '<path d="M2 20 L12 4 L22 20Z" fill="#fff"/><path d="M12 10 L9 20 H15Z" fill="#000" fill-opacity=".3"/>',
  star: '<path d="M12 2 L14.8 8.6 L22 9.2 L16.5 13.8 L18.2 21 L12 17.2 L5.8 21 L7.5 13.8 L2 9.2 L9.2 8.6Z" fill="#fff"/>',
  paw: '<circle cx="12" cy="15" r="4.5" fill="#fff"/><circle cx="6.5" cy="10" r="2.2" fill="#fff"/><circle cx="10" cy="6.5" r="2.2" fill="#fff"/><circle cx="14" cy="6.5" r="2.2" fill="#fff"/><circle cx="17.5" cy="10" r="2.2" fill="#fff"/>',
  bed: '<path d="M3 19 V7 M3 15 H21 V19 M21 15 V11 H10 V15" stroke="#fff" stroke-width="2.2" fill="none"/><circle cx="6.5" cy="12" r="2" fill="#fff"/>',
  mail: '<rect x="3" y="6" width="18" height="12" rx="2" fill="#fff"/><path d="M3 7 L12 13 L21 7" stroke="#000" stroke-opacity=".3" stroke-width="1.6" fill="none"/>',
  cross: '<path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9Z" fill="#fff"/>',
  pine: '<path d="M12 2 L20 15 H4Z M12 7 L21 20 H3Z" fill="#fff"/><rect x="10.5" y="19" width="3" height="4" fill="#fff"/>',
  wheat: '<path d="M12 22 V4" stroke="#fff" stroke-width="2"/><ellipse cx="9" cy="7" rx="3" ry="1.8" transform="rotate(-35 9 7)" fill="#fff"/><ellipse cx="15" cy="7" rx="3" ry="1.8" transform="rotate(35 15 7)" fill="#fff"/><ellipse cx="9" cy="12" rx="3" ry="1.8" transform="rotate(-35 9 12)" fill="#fff"/><ellipse cx="15" cy="12" rx="3" ry="1.8" transform="rotate(35 15 12)" fill="#fff"/><ellipse cx="9" cy="17" rx="3" ry="1.8" transform="rotate(-35 9 17)" fill="#fff"/><ellipse cx="15" cy="17" rx="3" ry="1.8" transform="rotate(35 15 17)" fill="#fff"/>',
  barn: '<path d="M3 22 V11 L12 4 L21 11 V22Z" fill="#fff"/><path d="M9 22 V15 H15 V22 M9 15 L15 22 M15 15 L9 22" stroke="#000" stroke-opacity=".3" stroke-width="1.4" fill="none"/>',
  bag: '<path d="M5 8 H19 L20 21 H4Z" fill="#fff"/><path d="M9 8 C9 3 15 3 15 8" stroke="#fff" stroke-width="2" fill="none"/>',
};
const OSM_CAT = {
  bakery: 'boulangerie', pastry: 'boulangerie', cafe: 'cafe', coffee: 'cafe', tea: 'cafe', pub: 'cafe', bar: 'cafe', biergarten: 'cafe',
  restaurant: 'restaurant', fast_food: 'restaurant', food_court: 'restaurant', marketplace: 'marche', greengrocer: 'marche', supermarket: 'marche', convenience: 'marche', farm: 'marche',
  deli: 'epicerie', cheese: 'epicerie', butcher: 'epicerie', wine: 'epicerie', alcohol: 'epicerie', chocolate: 'epicerie', confectionery: 'glacier', grocery: 'epicerie',
  seafood: 'poissonnerie', fishmonger: 'poissonnerie', florist: 'fleuriste', garden_centre: 'fleuriste', books: 'librairie', library: 'librairie', newsagent: 'librairie', stationery: 'librairie',
  park: 'parc', playground: 'parc', garden: 'parc', dog_park: 'parc', beach: 'plage', beach_resort: 'plage', harbour: 'port', marina: 'port', ferry_terminal: 'port', harbor: 'port',
  ice_cream: 'glacier', swimming_pool: 'piscine', water_park: 'piscine', swimming: 'piscine', station: 'gare', railway: 'gare', halt: 'gare', bus_station: 'gare',
  museum: 'musee', gallery: 'musee', art_gallery: 'musee', arts_centre: 'musee', place_of_worship: 'patrimoine', castle: 'patrimoine', monument: 'patrimoine', memorial: 'patrimoine', ruins: 'patrimoine', attraction: 'patrimoine',
  viewpoint: 'belvedere', school: 'ecole', kindergarten: 'ecole', college: 'ecole', university: 'ecole', stadium: 'sport', sports_centre: 'sport', pitch: 'sport', fitness_centre: 'sport', golf: 'sport',
  clothes: 'mode', shoes: 'mode', boutique: 'mode', fashion: 'mode', second_hand: 'friperie', charity: 'friperie', cinema: 'cinema', theatre: 'cinema', hardware: 'bricolage', doityourself: 'bricolage',
  campsite: 'camping', camp_site: 'camping', toys: 'jouets', gift: 'boutique', zoo: 'zoo', aquarium: 'zoo', hotel: 'hotel', hostel: 'hotel', guest_house: 'hotel', lodging: 'hotel', post_office: 'poste', post: 'poste',
  farm: 'ferme', farmyard: 'ferme', wood: 'foret', forest: 'foret', pharmacy: 'pharmacie', chemist: 'pharmacie', shop: 'boutique', jewelry: 'boutique', cosmetics: 'boutique', variety_store: 'boutique', department_store: 'mode',
};
const NOMS = ['Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefèvre', 'Roux', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Faure', 'André', 'Mercier', 'Blanc', 'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'Perrin', 'Morel', 'Leroy'];
const ARBRES = ['des Tilleuls', 'des Lilas', 'des Cèdres', 'des Roses', 'Bellevue', 'du Moulin', 'des Acacias', 'des Platanes', 'du Château', 'des Mésanges', 'des Oliviers', 'du Lavoir'];
const VOIES = ['Victor-Hugo', 'Jean-Jaurès', 'de la République', 'Pasteur', 'des Lilas', 'du Marché', 'de la Gare', 'Voltaire', 'des Écoles', 'du Moulin', 'Gambetta', 'de la Paix', 'des Fleurs', 'du Commerce', 'Émile-Zola', 'des Tanneurs', 'du Four', 'des Remparts', 'Saint-Jean', 'de la Fontaine'];
const POI_NAMES = {
  boulangerie: ['Boulangerie {N}', 'Au Bon Pain', 'Le Fournil {N}', 'Maison {N}', 'La Mie Dorée'], cafe: ['Café du Centre', 'Le Bistrot {N}', 'Café de la Place', 'Chez {N}', 'Le Petit Zinc'],
  restaurant: ['Restaurant {N}', 'La Table de {N}', 'Le Petit Bouchon', 'Pizzeria Bella', 'L’Auberge {A}'], marche: ['Marché couvert', 'Marché du samedi', 'Halle {A}'],
  epicerie: ['Épicerie {N}', 'La Fromagerie', 'Comptoir {N}'], poissonnerie: ['Poissonnerie {N}', 'La Marée'], fleuriste: ['Fleurs de {N}', 'Le Jardin Fleuri', 'L’Atelier Floral'],
  librairie: ['Librairie {N}', 'Bibliothèque municipale', 'Le Bouquiniste'], parc: ['Parc {A}', 'Jardin {A}', 'Square {A}'], glacier: ['Glacier {N}', 'Les Délices Glacés'], piscine: ['Piscine municipale', 'Centre aquatique'],
  musee: ['Musée {A}', 'Musée des Beaux-Arts', 'Galerie {N}'], patrimoine: ['Église Saint-{S}', 'Chapelle {A}', 'Château {A}'], ecole: ['École {A}', 'Collège {N}', 'Groupe scolaire {A}'],
  sport: ['Stade {N}', 'Gymnase {A}', 'City stade'], mode: ['Boutique {N}', 'Mode & Co', 'L’Atelier {N}'], friperie: ['Friperie {N}', 'Seconde Vie', 'Le Grenier'],
  cinema: ['Cinéma Le Rex', 'Cinéma {A}', 'Théâtre municipal'], bricolage: ['Quincaillerie {N}', 'Brico {N}'], jouets: ['La Boîte à Jouets', 'Jouets {N}'], hotel: ['Hôtel {A}', 'Hôtel du Commerce', 'Hôtel de la Gare'],
  poste: ['Bureau de poste'], pharmacie: ['Pharmacie {N}', 'Pharmacie du Centre', 'Pharmacie {A}'], boutique: ['Bazar {N}', 'Cadeaux & Merveilles', 'La Petite Boutique'], gare: ['Gare de {V}'], zoo: ['Parc animalier {A}'],
  camping: ['Camping {A}'], belvedere: ['Belvédère {A}'], plage: ['Plage {A}', 'Plage des Sablettes', 'Plage du Phare'], port: ['Port de {V}', 'Port de plaisance'],
};
const BOIS_N = ['Bois {A}', 'Forêt communale', 'Bois du Loup', 'Bosquet {A}', 'Bois Joli'];
const CHAMP_N = ['Champs {A}', 'Prés {A}', 'Champ de blé', 'Prairie fleurie', 'Les Grands Prés'];
const FERME_N = ['Ferme {N}', 'Ferme du {A2}', 'Les Ruchers {A}', 'Ferme équestre'];
const VIL_A = ['Saint-', 'Sainte-', 'Le ', 'La ', 'Les ', 'Mont', 'Ville', 'Bourg-', 'Pont-', ''];
const VIL_B = ['Martin', 'Pierre', 'Clair', 'Roche', 'Fontaine', 'Val', 'Chêne', 'Bois', 'Moulin', 'Champ', 'Prés', 'Rivière', 'Combe', 'Bel', 'Vigne', 'Saule', 'Pin', 'Font', 'Mesnil', 'Bruyère'];
const VIL_C = ['', '', '', '-sur-Loire', '-les-Bains', '-en-Bresse', '-du-Lac', '-le-Vieux', '-la-Forêt', '-des-Prés', '-sur-Mer', '-le-Château'];
const SAINTS = ['Pierre', 'Martin', 'Jean', 'Nicolas', 'Michel', 'Étienne', 'Laurent', 'Joseph'];

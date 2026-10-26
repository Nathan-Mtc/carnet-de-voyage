// ================= DONNÉES =================
const PLACES = [
  ['Paris', 'France', 48.8566, 2.3522, ['ville', 'monument'], ['Béret de Montmartre', 'v', 'tete', 3, 'beret', '#3b4a7a']],
  ['Lyon', 'France', 45.764, 4.8357, ['ville'], ['Foulard des canuts', 'v', 'cou', 3, 'foulard', '#b45a8c']],
  ['Marseille', 'France', 43.2965, 5.3698, ['ville', 'mer'], ['Marinière du Vieux-Port', 'v', 'haut', 3, 'pull', '#f4f1ea']],
  ['Calanques', 'France', 43.21, 5.45, ['mer'], ['Perle des Calanques', 'm', 'perle', 3]],
  ['Annecy', 'France', 45.8992, 6.1294, ['lac', 'montagne', 'ville'], ['Écharpe du lac d’Annecy', 'v', 'cou', 3, 'echarpe', '#7fc4d9']],
  ['Chamonix', 'France', 45.9237, 6.8694, ['montagne', 'neige'], ['Bonnet du Mont-Blanc', 'v', 'tete', 3, 'bonnet', '#e8eef5']],
  ['Lac du Bourget', 'France', 45.73, 5.87, ['lac'], ['Plume de cygne argentée', 'm', 'plume', 3]],
  ['Grenoble', 'France', 45.1885, 5.7245, ['ville', 'montagne'], ['Noix dorée', 'n', 'fruit', 3]],
  ['Vercors', 'France', 45.05, 5.5, ['montagne', 'foret'], ['Cape du Vercors', 'v', 'dos', 3, 'cape', '#5f8a5a']],
  ['Beaufortain', 'France', 45.72, 6.57, ['montagne', 'campagne'], ['Meule de beaufort', 'n', 'fromage', 3]],
  ['Bordeaux', 'France', 44.8378, -0.5792, ['ville'], ['Canelé doré', 'n', 'sucre', 3]],
  ['Dune du Pilat', 'France', 44.589, -1.2125, ['desert', 'mer'], ['Sable chantant du Pilat', 'm', 'sable', 3]],
  ['Mont-Saint-Michel', 'France', 48.6361, -1.5115, ['monument', 'mer'], ['Éclat d’abbaye', 'm', 'eclat', 3]],
  ['Carnac', 'France', 47.584, -3.078, ['monument', 'campagne'], ['Ciré breton', 'v', 'haut', 3, 'sweat', '#f6d36b']],
  ['Brocéliande', 'France', 48.02, -2.2, ['foret'], ['Mousse enchantée', 'm', 'mousse', 3]],
  ['Strasbourg', 'France', 48.5734, 7.7521, ['ville'], ['Bretzel de Noël', 'n', 'sucre', 3]],
  ['Nice', 'France', 43.7102, 7.262, ['mer', 'ville'], ['Chapeau de la Prom’', 'v', 'tete', 3, 'chapeau', '#7fb6d9']],
  ['Menton', 'France', 43.7747, 7.4975, ['mer', 'agrumes'], ['Citron de Menton', 'n', 'agrume', 3]],
  ['Bonifacio', 'France', 41.387, 9.159, ['mer', 'ile'], ['Foulard du maquis', 'v', 'cou', 3, 'foulard', '#8aa86b']],
  ['Valensole', 'France', 43.837, 5.983, ['campagne'], ['Bouquet de lavande', 'm', 'fleur', 3]],
  ['Genève', 'Suisse', 46.2044, 6.1432, ['ville', 'lac'], ['Chocolat de Genève', 'n', 'sucre', 3]],
  ['Zermatt', 'Suisse', 46.0207, 7.7491, ['montagne', 'neige'], ['Pull du Cervin', 'v', 'haut', 3, 'pull', '#c94a4a']],
  ['Venise', 'Italie', 45.4408, 12.3155, ['ville', 'monument'], ['Masque de carnaval', 'm', 'masque', 3]],
  ['Rome', 'Italie', 41.9028, 12.4964, ['ville', 'monument'], ['Couronne de laurier', 'v', 'tete', 3, 'fleurs', '#a6cf8e']],
  ['Toscane', 'Italie', 43.35, 11.0, ['campagne'], ['Chapeau toscan', 'v', 'tete', 3, 'chapeau', '#c9734a']],
  ['Barcelone', 'Espagne', 41.3874, 2.1686, ['ville', 'mer'], ['Éventail de Barcelone', 'm', 'eventail', 3]],
  ['Lisbonne', 'Portugal', 38.7223, -9.1393, ['ville', 'mer'], ['Pastel de nata', 'n', 'sucre', 3]],
  ['Amsterdam', 'Pays-Bas', 52.3676, 4.9041, ['ville'], ['Chaussettes à tulipes', 'v', 'pieds', 3, 'chaussettes', '#f39ab0']],
  ['Londres', 'Royaume-Uni', 51.5072, -0.1276, ['ville', 'monument'], ['Imperméable de Londres', 'v', 'haut', 3, 'sweat', '#c9a97a']],
  ['Édimbourg', 'Royaume-Uni', 55.9533, -3.1883, ['ville', 'monument'], ['Écharpe en tartan', 'v', 'cou', 3, 'echarpe', '#b5484d']],
  ['Highlands', 'Écosse', 57.12, -4.71, ['montagne', 'lac'], ['Kilt des Highlands', 'v', 'bas', 3, 'jupe', '#3f6e5a']],
  ['Reykjavik', 'Islande', 64.1466, -21.9426, ['neige', 'mer'], ['Pull islandais', 'v', 'haut', 3, 'pull', '#e9e2d0']],
  ['Geiranger', 'Norvège', 62.1, 7.2, ['montagne', 'mer'], ['Bonnet du fjord', 'v', 'tete', 3, 'bonnet', '#4b6fa8']],
  ['Rovaniemi', 'Finlande', 66.5, 25.73, ['neige', 'foret'], ['Lumière boréale', 'm', 'lumiere', 4]],
  ['Berlin', 'Allemagne', 52.52, 13.405, ['ville'], ['Sweat de Kreuzberg', 'v', 'haut', 3, 'sweat', '#5c5f6e']],
  ['Prague', 'Tchéquie', 50.0755, 14.4378, ['ville', 'monument'], ['Marionnette de Prague', 'm', 'masque', 3]],
  ['Vienne', 'Autriche', 48.2082, 16.3738, ['ville'], ['Sachertorte', 'n', 'sucre', 3]],
  ['Santorin', 'Grèce', 36.3932, 25.4615, ['ile', 'mer'], ['Sandales de Santorin', 'v', 'pieds', 3, 'chaussettes', '#e9d2a6']],
  ['Istanbul', 'Turquie', 41.0082, 28.9784, ['ville', 'monument'], ['Loukoum à la rose', 'n', 'sucre', 3]],
  ['Marrakech', 'Maroc', 31.6295, -7.9811, ['ville', 'desert'], ['Babouches brodées', 'v', 'pieds', 3, 'chaussettes', '#e3b04b']],
  ['Merzouga', 'Maroc', 31.0802, -4.0134, ['desert'], ['Chèche indigo', 'v', 'cou', 3, 'foulard', '#3e4f8f']],
  ['Gizeh', 'Égypte', 29.9792, 31.1342, ['desert', 'monument'], ['Scarabée doré', 'm', 'scarabee', 4]],
  ['Kyoto', 'Japon', 35.0116, 135.7681, ['ville', 'monument', 'foret'], ['Haori de Kyoto', 'v', 'haut', 3, 'sweat', '#c75b7a']],
  ['Tokyo', 'Japon', 35.6762, 139.6503, ['ville'], ['Casquette de Shibuya', 'v', 'tete', 3, 'casquette', '#ef6a90']],
  ['Bali', 'Indonésie', -8.34, 115.09, ['ile', 'foret'], ['Collier de frangipanier', 'v', 'cou', 3, 'foulard', '#fbe6a6']],
  ['Sydney', 'Australie', -33.8688, 151.2093, ['ville', 'mer'], ['Chapeau de surf', 'v', 'tete', 3, 'chapeau', '#f2c14e']],
  ['New York', 'États-Unis', 40.7128, -74.006, ['ville', 'monument'], ['Casquette de Brooklyn', 'v', 'tete', 3, 'casquette', '#2f3b5c']],
  ['Montréal', 'Canada', 45.5017, -73.5673, ['ville'], ['Sirop d’érable', 'n', 'sucre', 3]],
  ['Banff', 'Canada', 51.1784, -115.5708, ['montagne', 'lac', 'foret'], ['Chemise de bûcheron', 'v', 'haut', 3, 'pull', '#c0443e']],
  ['Grand Canyon', 'États-Unis', 36.1069, -112.1129, ['desert', 'monument'], ['Pierre rouge du canyon', 'm', 'pierre', 3]],
  ['Rio de Janeiro', 'Brésil', -22.9068, -43.1729, ['mer', 'ville'], ['Tongs de Copacabana', 'v', 'pieds', 3, 'chaussettes', '#58c2b0']],
  ['Machu Picchu', 'Pérou', -13.1631, -72.545, ['montagne', 'monument'], ['Poncho des Andes', 'v', 'haut', 3, 'pull', '#d9733f']],
  ['Patagonie', 'Argentine', -50.94, -73.4, ['montagne', 'neige'], ['Bonnet de Patagonie', 'v', 'tete', 3, 'bonnet', '#5aa3a8']],
  ['Le Cap', 'Afrique du Sud', -33.9249, 18.4241, ['mer', 'ville'], ['Coquillage du Cap', 'm', 'coquillage', 3]],
  ['Allée des baobabs', 'Madagascar', -20.25, 44.42, ['foret', 'campagne'], ['Graine de baobab', 'm', 'graine', 3]],
].map(([name, country, lat, lon, tags, special], i) => ({ id: i, name, country, lat, lon, tags, special }));

const SECRETS = [
  { key: 'grotte', name: 'Grotte aux cristaux', country: 'Vercors', lat: 44.93, lon: 5.42, tags: ['montagne'], loot: [['Couronne de cristal', 'v', 'tete', 4, 'couronne', '#cfeaf7'], ['Cœur de cristal', 'm', 'cristal', 4]] },
  { key: 'lucioles', name: 'Village des lucioles', country: 'Brocéliande', lat: 47.96, lon: -2.32, tags: ['foret'], loot: [['Lanterne de lucioles', 'd', 'lanterne', 4, null, '#e8f59a'], ['Cape de nuit étoilée', 'v', 'dos', 4, 'cape', '#33406e']] },
  { key: 'tortues', name: 'Île aux tortues', country: 'Seychelles', lat: -4.62, lon: 55.45, tags: ['ile', 'mer'], loot: [['Carapace dorée', 'm', 'coquillage', 4], ['Collier de nacre', 'v', 'cou', 4, 'foulard', '#f3ece4']] },
  { key: 'temple', name: 'Temple oublié', country: 'Cambodge', lat: 13.41, lon: 103.87, tags: ['monument', 'foret'], loot: [['Statuette de jade', 'd', 'statue', 4, null, '#7fc4a0'], ['Masque ancien', 'm', 'masque', 4]] },
  { key: 'jardin', name: 'Jardin suspendu', country: 'Madère', lat: 32.75, lon: -16.98, tags: ['campagne', 'ile'], loot: [['Couronne de fleurs éternelles', 'v', 'tete', 4, 'fleurs', '#f6c2cf'], ['Graine d’arbre-monde', 'm', 'graine', 4]] },
  { key: 'banquise', name: 'Cabane du bout du monde', country: 'Svalbard', lat: 78.22, lon: 15.65, tags: ['neige'], loot: [['Bonnet aurore', 'v', 'tete', 4, 'bonnet', '#9fe0d0'], ['Lumière boréale', 'm', 'lumiere', 4]] },
];

const HOMES = [['Paris', 48.8566, 2.3522], ['Lyon', 45.764, 4.8357], ['Marseille', 43.2965, 5.3698], ['Bordeaux', 44.8378, -0.5792], ['Lille', 50.6292, 3.0573], ['Toulouse', 43.6047, 1.4442], ['Nantes', 47.2184, -1.5536], ['Strasbourg', 48.5734, 7.7521], ['Annecy', 45.8992, 6.1294], ['Grenoble', 45.1885, 5.7245], ['Bruxelles', 50.8503, 4.3517], ['Genève', 46.2044, 6.1432], ['Montréal', 45.5017, -73.5673]];

const TAGC = { montagne: '#8f9cb3', neige: '#a9cbe6', lac: '#6fa9d2', mer: '#4f97c4', foret: '#5fa274', ville: '#d98763', monument: '#c39a4c', desert: '#dba85c', campagne: '#a7b65a', ile: '#3fb5a2', agrumes: '#eab53a' };
const TAGL = { montagne: 'Montagne', neige: 'Neige', lac: 'Lac', mer: 'Mer', foret: 'Forêt', ville: 'Ville', monument: 'Monument', desert: 'Désert', campagne: 'Campagne', ile: 'Île', agrumes: 'Agrumes' };

// [nom, catégorie, sous-type, rareté, modèle, couleur]
const LOOT = {
  montagne: [['Bonnet des cimes', 'v', 'tete', 0, 'bonnet', '#d96b5f'], ['Moufles d’alpage', 'v', 'mains', 0, 'moufles', '#e9a24f'], ['Chaussettes de randonnée', 'v', 'pieds', 0, 'chaussettes', '#a9c48a'], ['Écharpe en laine de brebis', 'v', 'cou', 1, 'echarpe', '#efe6d2'], ['Cristal de roche', 'm', 'cristal', 1], ['Edelweiss séché', 'm', 'fleur', 2], ['Laine d’alpage', 'm', 'laine', 0], ['Fromage d’alpage', 'n', 'fromage', 0], ['Myrtilles sauvages', 'n', 'fruit', 0]],
  neige: [['Bottes fourrées', 'v', 'pieds', 1, 'bottes', '#b98a62'], ['Moufles de neige', 'v', 'mains', 0, 'moufles', '#9cc3e8'], ['Flocon éternel', 'm', 'flocon', 2], ['Glace bleue', 'm', 'cristal', 1], ['Laine de renne', 'm', 'laine', 1], ['Chocolat chaud', 'n', 'sucre', 0]],
  lac: [['Ciré de pêcheur', 'v', 'haut', 0, 'sweat', '#f6d36b'], ['Casquette de batelier', 'v', 'tete', 0, 'casquette', '#3e5f8a'], ['Galet poli', 'm', 'pierre', 0], ['Plume de cygne', 'm', 'plume', 1], ['Perche grillée', 'n', 'mer', 0]],
  mer: [['Marinière', 'v', 'haut', 0, 'pull', '#f4f1ea'], ['Bob de plage', 'v', 'tete', 0, 'chapeau', '#f39ab0'], ['Short de bain', 'v', 'bas', 0, 'short', '#58c2b0'], ['Coquillage nacré', 'm', 'coquillage', 0], ['Verre de mer', 'm', 'cristal', 1], ['Sable doré', 'm', 'sable', 0], ['Perle rose', 'm', 'perle', 3], ['Crevettes grises', 'n', 'mer', 0], ['Glace à la vanille', 'n', 'sucre', 0]],
  foret: [['Cape de mousse', 'v', 'dos', 1, 'cape', '#6f9a5f'], ['Bonnet gland', 'v', 'tete', 0, 'bonnet', '#b07a4f'], ['Feuille d’érable rousse', 'm', 'feuille', 0], ['Champignon doré', 'm', 'champignon', 2], ['Pomme de pin', 'm', 'graine', 0], ['Mousse des sous-bois', 'm', 'mousse', 0], ['Mûres sauvages', 'n', 'fruit', 0], ['Pomme des bois', 'n', 'pomme', 0]],
  ville: [['Béret', 'v', 'tete', 0, 'beret', '#c9b8ea'], ['Sweat urbain', 'v', 'haut', 0, 'sweat', '#b8d8f0'], ['Sac en toile', 'v', 'dos', 0, 'sac', '#e9dcc0'], ['Ticket de tram ancien', 'm', 'papier', 0], ['Lumière de réverbère', 'm', 'lumiere', 3], ['Croissant', 'n', 'sucre', 0], ['Crêpe', 'n', 'sucre', 0]],
  monument: [['Carte postale ancienne', 'm', 'papier', 1], ['Éclat d’histoire', 'm', 'eclat', 2], ['Médaille souvenir', 'm', 'medaille', 1], ['Foulard de musée', 'v', 'cou', 1, 'foulard', '#c9a35a'], ['Pierre taillée', 'm', 'pierre', 0]],
  desert: [['Chèche', 'v', 'cou', 0, 'foulard', '#e8cfa0'], ['Sandales tressées', 'v', 'pieds', 0, 'chaussettes', '#c99a62'], ['Sable rose', 'm', 'sable', 0], ['Rose des sables', 'm', 'pierre', 2], ['Dattes', 'n', 'sucre', 0]],
  campagne: [['Chapeau de paille', 'v', 'tete', 0, 'chapeau', '#e9c46a'], ['Salopette', 'v', 'bas', 0, 'short', '#7f9fc4'], ['Blé doré', 'm', 'ble', 0], ['Plume de coq', 'm', 'plume', 0], ['Graines de tournesol', 'm', 'graine', 0], ['Miel de fleurs', 'n', 'sucre', 0], ['Pomme du verger', 'n', 'pomme', 0]],
  ile: [['Chemise à fleurs', 'v', 'haut', 1, 'tshirt', '#f6a6b8'], ['Collier de fleurs', 'v', 'cou', 1, 'foulard', '#f9d36b'], ['Noix de coco', 'n', 'fruit', 0], ['Sable blanc', 'm', 'sable', 0], ['Corail ancien', 'm', 'corail', 3]],
  agrumes: [['Mandarine', 'n', 'agrume', 0], ['Zeste confit', 'm', 'feuille', 1], ['Citron doux', 'n', 'agrume', 1]],
};
const SEASON_LOOT = [['Châtaignes grillées', 'n', 'sucre', 0], ['Écharpe d’automne', 'v', 'cou', 1, 'echarpe', '#d9893e'], ['Feuille d’érable rousse', 'm', 'feuille', 0]];
const NIGHT_LOOT = [['Éclat de lune', 'm', 'lune', 2], ['Bonnet étoilé', 'v', 'tete', 2, 'bonnet', '#3b4a7a']];
const WONDERS = { arc: ['Éclat d’arc-en-ciel', 'm', 'lumiere', 3], etoile: ['Poussière d’étoile', 'm', 'lune', 3], orage: ['Goutte d’orage', 'm', 'cristal', 2] };
const SHOP_DECOR = [['Plante verte', 'd', 'plante', 0, null, '#7fbf6a'], ['Tapis rayé', 'd', 'tapis', 0, null, '#e9a0a0'], ['Lanterne en papier', 'd', 'lanterne', 1, null, '#f6d36b'], ['Mappemonde ancienne', 'd', 'mappemonde', 2, null, '#c9a97a'], ['Bocal de bonbons', 'd', 'bocal', 0, null, '#f3aec1'], ['Herbier de montagne', 'd', 'herbier', 1, null, '#9cc38a']];
const RARITY = ['Commun', 'Peu commun', 'Rare', 'Épique', 'Légendaire'];
const RARC = ['#9a95a3', '#4f9f78', '#4f88cf', '#9a6fd6', '#d99a25'];
const FOOD_TASTE = { pistache: { love: ['pomme', 'fruit'], hate: ['mer'] }, mochi: { love: ['agrume'], hate: ['mer'] }, bulle: { love: ['mer'], hate: ['agrume'] } };
const DURS = [
  { key: 'eclair', label: 'Balade éclair', ms: 60e3, ev: 4, luck: 0, hint: '1 min, pour tester' },
  { key: 'court', label: 'Petite escapade', ms: 10 * 60e3, ev: 6, luck: 0.5, hint: '10 min' },
  { key: 'moyen', label: 'Voyage', ms: 60 * 60e3, ev: 8, luck: 1, hint: '1 h' },
  { key: 'long', label: 'Grand voyage', ms: 4 * 3600e3, ev: 10, luck: 1.6, hint: '4 h' },
  { key: 'expe', label: 'Expédition', ms: 12 * 3600e3, ev: 13, luck: 2.4, hint: '12 h' },
];
const PLAYERS = [['Lina', 'Tofu', 'mochi'], ['Sacha', 'Praline', 'pistache'], ['Noé', 'Gnocchi', 'bulle'], ['Jade', 'Mistral', 'pistache'], ['Yanis', 'Bigoudi', 'mochi'], ['Chloé', 'Pixel', 'bulle'], ['Maël', 'Biscuit', 'pistache'], ['Inès', 'Nuage', 'bulle'], ['Hugo', 'Caramel', 'mochi'], ['Léa', 'Paprika', 'pistache']];

const TALENTS = {
  pistache: [[2, 'Flair', 'Une trouvaille de plus à chaque voyage.'], [4, 'Grimpeuse', 'Ses choix audacieux réussissent bien plus souvent.'], [6, 'Chasseuse de trésors', 'Trouve trois fois plus de cartes au trésor.']],
  mochi: [[2, 'Négociateur', 'Marchands moins chers, comptoir plus généreux.'], [4, 'Zen absolu', 'Ne rate jamais rien et ne perd jamais de pièces.'], [6, 'Ami des oiseaux', 'Pépin rapporte un objet à chaque voyage.']],
  bulle: [[2, 'Nageuse', 'Trouvailles doublées près de l’eau.'], [4, 'Porte-bonheur', 'Arcs-en-ciel et étoiles filantes bien plus fréquents.'], [6, 'Plongeuse', 'Objets beaucoup plus rares près de l’eau.']],
};

const ANIMALS = {
  montagne: ['une marmotte', 'Elle siffle trois fois pour dire bonjour.'], neige: ['un harfang des neiges', 'Il fixe {n} de ses grands yeux jaunes.'],
  foret: ['un écureuil roux', 'Il partage une noisette avec {n}.'], mer: ['un dauphin', 'Il saute juste devant {n} !'], lac: ['un cygne', 'Il glisse majestueusement à côté de {n}.'],
  ville: ['un pigeon', 'Il roucoule. {n} fait semblant de ne pas avoir peur.'], monument: ['un chat errant', 'Il guide {n} jusqu’à un recoin secret.'],
  desert: ['un fennec', 'Ses immenses oreilles font rire {n}.'], campagne: ['un lapin', 'Il fait la course avec {n}.'], ile: ['une tortue', 'Elle avance si lentement que {n} s’assoit pour l’attendre.'], agrumes: ['un merle', 'Il chipe un zeste et s’envole.'],
};
const HELPS = [
  ['Une boulangère cherche quelqu’un pour livrer ses croissants.', 'Livrer les croissants', ['Croissant tout chaud', 'n', 'sucre', 1]],
  ['Un vieux marin a perdu sa casquette dans le vent.', 'L’aider à la chercher', ['Casquette de marin', 'v', 'tete', 2, 'casquette', '#2f3b5c']],
  ['Une fermière a besoin d’aide pour rentrer ses poules.', 'Rattraper les poules', ['Plume de poule dorée', 'm', 'plume', 2]],
  ['Un enfant n’arrive pas à faire voler son cerf-volant.', 'Lui montrer comment faire', ['Ruban de cerf-volant', 'v', 'cou', 2, 'echarpe', '#f39ab0']],
  ['Une libraire range des cartons de vieux livres.', 'Porter les cartons', ['Carte ancienne', 'm', 'papier', 2]],
  ['Un jardinier a perdu ses lunettes dans les fleurs.', 'Fouiller les massifs', ['Graines rares', 'm', 'graine', 2]],
];

const RECIPES = [
  { id: 'pull', kind: 'Vêtement', out: ['Pull douillet', 'v', 'haut', 2, 'pull', '#f1e3c8'], ing: [['laine', 3]], coins: 20 },
  { id: 'moufles', kind: 'Vêtement', out: ['Moufles tricotées', 'v', 'mains', 1, 'moufles', '#b8d8f0'], ing: [['laine', 2]], coins: 0 },
  { id: 'echarpe', kind: 'Vêtement', out: ['Écharpe de feuilles', 'v', 'cou', 2, 'echarpe', '#d9893e'], ing: [['feuille', 3], ['laine', 1]], coins: 10 },
  { id: 'collier', kind: 'Vêtement', out: ['Collier de coquillages', 'v', 'cou', 2, 'foulard', '#f6cdb8'], ing: [['coquillage', 3]], coins: 0 },
  { id: 'bonnetc', kind: 'Vêtement', out: ['Bonnet champignon', 'v', 'tete', 3, 'bonnet', '#e0604f'], ing: [['champignon', 1], ['laine', 2]], coins: 15 },
  { id: 'cape', kind: 'Vêtement', out: ['Cape de plumes', 'v', 'dos', 3, 'cape', '#f4f1ea'], ing: [['plume', 3]], coins: 25 },
  { id: 'givre', kind: 'Vêtement', out: ['Couronne de givre', 'v', 'tete', 4, 'couronne', '#cfe8f7'], ing: [['cristal', 2], ['flocon', 1]], coins: 40 },
  { id: 'lampe', kind: 'Décoration', out: ['Lampe de cristal', 'd', 'lampe', 3, null, '#bfe3f6'], ing: [['cristal', 2]], coins: 15 },
  { id: 'bocal', kind: 'Décoration', out: ['Bocal de coquillages', 'd', 'bocal', 1, null, '#f6cdb8'], ing: [['coquillage', 2], ['sable', 1]], coins: 0 },
  { id: 'herbier', kind: 'Décoration', out: ['Herbier encadré', 'd', 'herbier', 2, null, '#8fbf6a'], ing: [['feuille', 3]], coins: 5 },
  { id: 'tapis', kind: 'Décoration', out: ['Tapis tressé', 'd', 'tapis', 1, null, '#e7c46a'], ing: [['ble', 3]], coins: 0 },
  { id: 'plante', kind: 'Décoration', out: ['Plante en pot', 'd', 'plante', 1, null, '#6fae7d'], ing: [['graine', 2]], coins: 5 },
  { id: 'lanterne', kind: 'Décoration', out: ['Lanterne de lune', 'd', 'lanterne', 4, null, '#f4efd2'], ing: [['lumiere', 1], ['cristal', 1]], coins: 30 },
  { id: 'globe', kind: 'Décoration', out: ['Mappemonde de voyageur', 'd', 'mappemonde', 2, null, '#c9a97a'], ing: [['papier', 3]], coins: 10 },
  { id: 'chem', kind: 'Décoration', out: ['Cheminée de pierre', 'd', 'cheminee', 2, null, '#c99a7a'], ing: [['pierre', 4]], coins: 40 },
  { id: 'tarte', kind: 'Cuisine', out: ['Tarte aux pommes', 'n', 'pomme', 2], ing: [['pomme', 2], ['sucre', 1]], coins: 0 },
  { id: 'salade', kind: 'Cuisine', out: ['Salade d’agrumes', 'n', 'agrume', 2], ing: [['agrume', 2]], coins: 0 },
  { id: 'soupe', kind: 'Cuisine', out: ['Soupe de la mer', 'n', 'mer', 2], ing: [['mer', 2]], coins: 0 },
  { id: 'confiture', kind: 'Cuisine', out: ['Confiture des bois', 'n', 'fruit', 2], ing: [['fruit', 2], ['sucre', 1]], coins: 0 },
];
const ING = {
  laine: [['laine'], 'Laine'], cristal: [['cristal'], 'Cristal'], flocon: [['flocon'], 'Flocon éternel'], feuille: [['feuille', 'fleur', 'mousse'], 'Feuille, fleur ou mousse'],
  plume: [['plume'], 'Plume'], champignon: [['champignon'], 'Champignon'], coquillage: [['coquillage', 'perle', 'corail'], 'Coquillage'], sable: [['sable'], 'Sable'],
  ble: [['ble'], 'Blé'], graine: [['graine'], 'Graine'], lumiere: [['lumiere', 'lune'], 'Lumière ou éclat de lune'], papier: [['papier'], 'Papier ancien'], pierre: [['pierre', 'eclat'], 'Pierre'],
  pomme: [['pomme'], 'Pomme'], sucre: [['sucre'], 'Douceur sucrée'], agrume: [['agrume'], 'Agrume'], mer: [['mer'], 'Produit de la mer'], fruit: [['fruit'], 'Fruit des bois'],
};
const QUEST_T = [
  { type: 'visit', tag: true, goal: 1, txt: t => `Voyager vers un lieu ${TAGQ[t]}` },
  { type: 'items_tag', tag: true, goal: 3, txt: t => `Rapporter 3 objets d’un lieu ${TAGQ[t]}` },
  { type: 'rare', goal: 1, txt: () => 'Rapporter un objet rare ou mieux' },
  { type: 'craft', goal: 1, txt: () => 'Fabriquer un objet à l’atelier' },
  { type: 'sell', goal: 1, txt: () => 'Vendre un objet' },
  { type: 'feed_love', goal: 1, txt: () => 'Offrir un plat adoré à un compagnon' },
  { type: 'postcards', goal: 3, txt: () => 'Recevoir 3 cartes postales' },
  { type: 'decor', goal: 1, txt: () => 'Placer un objet dans la maison' },
  { type: 'choices', goal: 2, txt: () => 'Répondre à 2 choix pendant un voyage' },
  { type: 'help', goal: 1, txt: () => 'Aider un habitant en voyage' },
];
const TAGQ = { montagne: 'de montagne', neige: 'enneigé', lac: 'au bord d’un lac', mer: 'au bord de la mer', foret: 'en forêt', ville: 'en ville', monument: 'avec un monument', desert: 'dans le désert', campagne: 'à la campagne', ile: 'sur une île', agrumes: 'aux agrumes' };
const HOUSE_SLOTS = [
  { id: 'w0', kind: 'wall', label: 'Mur gauche', x: 52, y: 44, w: 110, h: 84 },
  { id: 'w1', kind: 'wall', label: 'Mur droit', x: 478, y: 44, w: 110, h: 84 },
  { id: 's0', kind: 'shelf', label: 'Étagère 1', x: 386, y: 156, w: 50, h: 46 },
  { id: 's1', kind: 'shelf', label: 'Étagère 2', x: 438, y: 156, w: 50, h: 46 },
  { id: 's2', kind: 'shelf', label: 'Étagère 3', x: 490, y: 156, w: 50, h: 46 },
  { id: 's3', kind: 'shelf', label: 'Étagère 4', x: 542, y: 156, w: 50, h: 46 },
  { id: 'f0', kind: 'floor', label: 'Coin gauche', x: 20, y: 214, w: 120, h: 130 },
  { id: 'f1', kind: 'floor', label: 'Près du mur', x: 150, y: 214, w: 96, h: 120 },
  { id: 'f2', kind: 'floor', label: 'Sous l’étagère', x: 400, y: 230, w: 96, h: 110 },
  { id: 'f3', kind: 'floor', label: 'Coin droit', x: 510, y: 214, w: 110, h: 130 },
  { id: 'r0', kind: 'rug', label: 'Tapis', x: 200, y: 318, w: 240, h: 44 },
];
const PLACEMENT = { herbier: 'wall', tapis: 'rug', bocal: 'shelf', mappemonde: 'shelf', lampe: 'floor', lanterne: 'floor', plante: 'floor', cheminee: 'floor', statue: 'floor' };

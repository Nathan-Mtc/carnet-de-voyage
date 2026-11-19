// ================= FAUNE (v161) : les nouvelles espèces et leurs pièces de dessin =================
// Chargé juste après 01_draw_chars.js (avant 20_collection.js, qui relit les compagnons sauvegardés).
// - FA_SP : la fiche de chaque nouvelle espèce (terrain, rareté, régions, conditions de rencontre, appât, indices…).
// - De nouvelles pièces de dessin (oreilles, cornes, becs, queues…) ajoutées aux dictionnaires EARS / SNOUTS / TAILS,
//   et les entrées SPECIES correspondantes. Le dessin reste « par pièces » : une espèce = une silhouette + des pièces + des palettes.
// La logique de jeu (bonus de terrain, rencontres, carnet naturaliste) est dans 99_zfaune.js.

// ---------- les 10 terrains ----------
const FA_TER = {
  montagne: ['🏔️', 'Montagne', 'en montagne'], mer: ['🌊', 'Mer', 'au bord de la mer'], riviere: ['🏞️', 'Rivière et lac', 'près de l’eau douce'],
  foret: ['🌲', 'Forêt', 'en forêt'], campagne: ['🌾', 'Campagne', 'à la campagne'], ville: ['🏙️', 'Ville', 'en ville'],
  neige: ['❄️', 'Neige', 'dans la neige'], desert: ['🏜️', 'Désert', 'dans le désert'], jungle: ['🌴', 'Jungle', 'dans la jungle'], marais: ['🪷', 'Marais', 'dans les marais'],
};
const FA_TIER = ['Commune', 'Rare', 'Légendaire'];
const FA_FR = ['ara', 'paca', 'bretagne', 'normandie', 'grandest', 'idf', 'occitanie', 'naquitaine', 'hdf', 'bfc', 'pdl', 'cvl', 'corse'];
const faAll = (w, more) => Object.assign(Object.fromEntries(FA_FR.map(r => [r, w])), more || {});

// ---------- les nouvelles espèces ----------
// ter : terrain(s) ; tier : 0 commune, 1 rare, 2 légendaire ; reg : régions (poids) ; zf : zones précises d'une région ;
// cond : moment et appât exigés (night, season, bait) ; bait : [nom de l'appât, ingrédients, couleur] ; clue : [indice 1, indice 2]
const FA_SP = [
  { id: 'marmotte', nm: 'Marmotte', art: 'une marmotte', pl: 'les marmottes', fem: 1, ter: ['montagne'], tier: 0,
    reg: { ara: 2.4, paca: 2, suisse: 2.4, italie: 1.4, occitanie: 1, allemagne: 0.6 }, zf: { ara: ['alpes'], paca: ['alpes_sud'] },
    bait: ['Bouquet des alpages', [['feuille', 2], ['hb_veg', 1]], '#e9b2c8'],
    clue: ['Un long sifflement résonne entre les rochers, là-haut, quand on monte dans les Alpes.', 'Elle se dore au soleil devant son terrier, dans les alpages des Alpes et des Pyrénées.'],
    perso: 'Gourmande', bio: 'Elle siffle pour prévenir tout le monde du moindre danger, puis retourne se dorer au soleil sur son rocher préféré.',
    love: 'les fleurs des alpages, les siestes au soleil', hate: 'les aigles, se lever tôt', dex: ['2 baguettes', '5 croissants', 'Elle dort six mois par an, roulée en boule au fond de son terrier.'],
    names: ['Sifflette', 'Edelweiss', 'Galette', 'Tome', 'Rocaille', 'Myrtille', 'Biscotte', 'Sommet'], tint: '#f2e4d2', col: '#b48a62', egg: { a: '#ead7bd', b: '#8fb86a', m: 'leaves2' },
    lines: { hello: ['Fuiiit ! Coucou !'], tap: ['Fuiiit ! Tu as entendu ? C’était moi !', 'Une petite sieste au soleil ?', 'Ça sent les fleurs des alpages…'], away: ['Il fait bon sur mon rocher !', 'Je siffle pour dire bonjour à tout le monde !'] } },
  { id: 'chamois', nm: 'Chamois', art: 'un chamois', pl: 'les chamois', ter: ['montagne'], tier: 1, cond: { bait: 1 },
    reg: { ara: 2.2, paca: 1.6, suisse: 2, bfc: 1.2, grandest: 0.8, italie: 1 }, zf: { ara: ['alpes'], paca: ['alpes_sud'] },
    bait: ['Pierre à sel', [['pierre', 1], ['hb_veg', 1]], '#e8e2d6'],
    clue: ['Des petits sabots ont gratté la roche, sur les pentes les plus raides.', 'Le chamois est méfiant : il ne s’approche que d’une pierre à sel, à préparer à l’Herboristerie.'],
    perso: 'Agile', bio: 'Il saute de rocher en rocher sur des pentes où personne n’ose aller, et s’arrête toujours pour admirer la vue.',
    love: 'le sel, les falaises, les pentes raides', hate: 'le bruit, les chiens', dex: ['1 vélo', '30 croissants', 'Ses sabots ont une semelle souple : il colle à la roche comme une ventouse.'],
    names: ['Crochet', 'Corniche', 'Saute-Roc', 'Galop', 'Silex', 'Éclair', 'Cime', 'Granit'], tint: '#efe1d0', col: '#a8784e', egg: { a: '#e9d6bd', b: '#6e5646', m: 'dunes' },
    lines: { tap: ['Hop ! Hop ! Je saute partout !', 'Tu as vu cette falaise ? Facile !', 'Un peu de sel ? Juste un peu…'], away: ['Quelle vue d’en haut !', 'J’ai sauté le plus gros rocher !'] } },
  { id: 'bouquetin', nm: 'Bouquetin', art: 'un bouquetin', pl: 'les bouquetins', ter: ['montagne'], tier: 2, cond: { bait: 1, season: ['été', 'automne'] },
    reg: { ara: 1.6, paca: 1, suisse: 1.6, italie: 1.2 }, zf: { ara: ['alpes'], paca: ['alpes_sud'] },
    bait: ['Lichen des cimes', [['feuille', 1], ['cristal', 1]], '#bfd8a6'],
    clue: ['On raconte qu’un seigneur aux grandes cornes veille sur les plus hauts sommets des Alpes.', 'Il ne descend des cimes qu’en été et en automne, et seulement pour le lichen des cimes.'],
    perso: 'Majestueux', bio: 'Ses cornes immenses racontent son âge. Il marche lentement, très fier, comme un roi sur son royaume de rochers.',
    love: 'les sommets, le lichen, la solitude', hate: 'la foule, les vallées', dex: ['1 frigo', '400 croissants', 'Ses cornes gagnent un anneau chaque année, comme les arbres.'],
    names: ['Majesté', 'Grand-Paradis', 'Barbichu', 'Glacier', 'Mont-Blanc', 'Torrent', 'Vanoise', 'Roc'], tint: '#eee6da', col: '#b39b7d', egg: { a: '#efe4d2', b: '#cdb48c', m: 'snow' },
    lines: { tap: ['Les sommets m’appellent.', 'Admire mes cornes. Prends ton temps.', 'Là-haut, le monde est tout petit.'], away: ['Je règne sur ce sommet.', 'L’air est pur, ici.'] } },
  { id: 'isard', nm: 'Isard', art: 'un isard', pl: 'les isards', ter: ['montagne'], tier: 0,
    reg: { occitanie: 2.4, naquitaine: 1.2, iberie: 1 },
    bait: ['Herbes des estives', [['feuille', 2]], '#9fcf7a'],
    clue: ['Un cousin du chamois bondit dans les montagnes du Sud-Ouest.', 'L’isard vit dans les Pyrénées : cherchez-le sur les sentiers de montagne d’Occitanie.'],
    perso: 'Curieux', bio: 'Le petit cousin pyrénéen du chamois. Il est curieux de tout et s’approche des randonneurs pour voir ce qu’ils mangent.',
    love: 'les herbes des estives, les pique-niques des randonneurs', hate: 'la pluie', dex: ['1 trottinette', '25 croissants', 'Les bergers des Pyrénées l’appellent « le petit sauteur ».'],
    names: ['Gave', 'Pic', 'Estive', 'Garbure', 'Ossau', 'Bergère', 'Sarrat', 'Brèche'], tint: '#f4e7d4', col: '#c79a62', egg: { a: '#f4e6cf', b: '#c79a62', m: 'dunes' } },
  { id: 'lynx', nm: 'Lynx', art: 'un lynx', pl: 'les lynx', ter: ['foret'], tier: 2, cond: { bait: 1, season: ['hiver', 'automne'], night: 1 },
    reg: { bfc: 1.6, grandest: 1.2, ara: 1, suisse: 1.4, allemagne: 1, scandinavie: 1.2 },
    bait: ['Pâté forestier', [['hb_from', 1], ['hb_pain', 1]], '#a3704a'],
    clue: ['Des empreintes rondes dans la neige des forêts du Jura… mais aucun bruit.', 'Le lynx ne sort que la nuit, à l’automne ou en hiver, et seulement pour un pâté forestier.'],
    perso: 'Mystérieux', bio: 'Le fantôme des forêts : on ne l’entend jamais arriver. Ses pinceaux sur les oreilles captent le moindre froissement.',
    love: 'la neige, le silence, les nuits sans lune', hate: 'les clochettes, le soleil de midi', dex: ['1 chien', '300 croissants', 'Ses grosses pattes poilues lui servent de raquettes dans la neige.'],
    names: ['Pinceau', 'Fantôme', 'Murmure', 'Givre', 'Jura', 'Sapin', 'Ombre', 'Comète'], tint: '#f2e8da', col: '#d9b483', egg: { a: '#f3e5cf', b: '#7a5638', m: 'snow' },
    lines: { tap: ['Chut… j’écoute.', 'Tu ne m’as pas entendu arriver, hein ?', 'La nuit, la forêt est à moi.'], away: ['Je me fonds dans les sapins…', 'Personne ne m’a vu.'] } },
  { id: 'macareux', nm: 'Macareux', art: 'un macareux', pl: 'les macareux', ter: ['mer'], tier: 0, bird: 1,
    reg: { bretagne: 2.2, britanniques: 2.4, scandinavie: 2.2, normandie: 0.6 },
    bait: ['Lançons frais', [['hb_mer', 1]], '#9fc2d6'],
    clue: ['Un petit clown au bec orange plonge du haut des falaises.', 'Le macareux niche sur les îles de Bretagne et des pays du Nord : allez voir la mer.'],
    perso: 'Clown', bio: 'Son bec arc-en-ciel fait rire tout le monde. Il vole un peu de travers, mais il nage comme une fusée.',
    love: 'les poissons argentés, les falaises', hate: 'les tempêtes, les goélands voleurs', dex: ['1 bouteille d’eau', '3 croissants', 'Il peut tenir dix petits poissons dans son bec en même temps.'],
    names: ['Clown', 'Arlequin', 'Rigolo', 'Sept-Îles', 'Falaise', 'Plongeon', 'Berlingot', 'Pingouin'], tint: '#eef0f4', col: '#3b3a44', egg: { a: '#f2f4f8', b: '#f07a3a', m: 'waves' },
    lines: { tap: ['Regarde mon bec ! Il a toutes les couleurs !', 'Plouf ! Je plonge !', 'Dix poissons dans le bec, record !'], away: ['La mer est belle !', 'J’ai plongé du haut de la falaise !'] } },
  { id: 'goeland', nm: 'Goéland', art: 'un goéland', pl: 'les goélands', ter: ['mer'], tier: 0, bird: 1,
    reg: { bretagne: 2.4, normandie: 2.2, hdf: 1.8, pdl: 1.8, naquitaine: 1.6, paca: 1.2, occitanie: 1, corse: 1.2, britanniques: 1.6, benelux: 1, mediterranee: 1 },
    bait: ['Frites oubliées', [['hb_pain', 1]], '#f2c94e'],
    clue: ['Quelqu’un crie très fort sur le port et vole les frites des touristes.', 'Le goéland vit sur toutes les côtes : ports, plages et phares.'],
    perso: 'Effronté', bio: 'Il crie, il chaparde, il se dispute pour une frite… mais il connaît chaque port par cœur et ne se perd jamais.',
    love: 'les frites, les ports, le vent', hate: 'les parasols fermés', dex: ['1 parapluie ouvert', '12 croissants', 'Il boit l’eau de mer : il recrache le sel par le bec.'],
    names: ['Frite', 'Criard', 'Mouette', 'Embrun', 'Capitaine', 'Chapardeur', 'Jetée', 'Marin'], tint: '#eef2f6', col: '#a8b4c4', egg: { a: '#f2f5f8', b: '#9ab0c4', m: 'waves' },
    lines: { tap: ['Kiaaa ! Kiaaa !', 'Une frite ? Tu as une frite ?', 'Je connais tous les ports !'], away: ['Kiaaa ! Le vent est parfait !', 'J’ai trouvé une frite !'] } },
  { id: 'flamant', nm: 'Flamant rose', art: 'un flamant rose', pl: 'les flamants roses', ter: ['marais'], tier: 0, bird: 1,
    reg: { paca: 2.4, occitanie: 1.6, iberie: 1.2, afrique_nord: 0.8 }, zf: { paca: ['provence'] },
    bait: ['Crevettes roses', [['hb_mer', 1], ['hb_sucre', 1]], '#f6a9b8'],
    clue: ['Des centaines de silhouettes roses dorment sur une patte, dans les étangs du Sud.', 'Le flamant rose vit dans les marais de Camargue et les étangs du Languedoc.'],
    perso: 'Élégant', bio: 'Il dort sur une patte et danse en groupe. Il est rose parce qu’il mange des petites crevettes roses.',
    love: 'les crevettes, la danse, les étangs salés', hate: 'l’eau froide, les flaques boueuses', dex: ['1 porte-manteau', '6 croissants', 'Il mange la tête à l’envers, le bec dans l’eau.'],
    names: ['Rosette', 'Ballerine', 'Guimauve', 'Saline', 'Grenadine', 'Camargue', 'Pétale', 'Flamenco'], tint: '#fde8ee', col: '#f6a9b8', egg: { a: '#ffe3ea', b: '#f29ab0', m: 'bubbles' },
    lines: { tap: ['Regarde, je tiens sur une patte !', 'On danse ?', 'Des crevettes roses, mes préférées !'], away: ['J’ai dansé avec mille flamants !', 'L’étang est tout rose !'] } },
  { id: 'taureau', nm: 'Taureau de Camargue', art: 'un taureau de Camargue', pl: 'les taureaux de Camargue', ter: ['marais'], tier: 1, cond: { bait: 1 },
    reg: { paca: 2, occitanie: 1.2 }, zf: { paca: ['provence'] },
    bait: ['Foin de Camargue', [['feuille', 2], ['hb_veg', 1]], '#d9c27a'],
    clue: ['Des cornes en forme de lyre dépassent des roseaux, dans le delta du Rhône.', 'Le petit taureau de Camargue ne s’approche que pour le foin de Camargue.'],
    perso: 'Fougueux', bio: 'Petit, noir et plein d’énergie. Il galope dans les marais avec les chevaux blancs et adore qu’on le félicite.',
    love: 'les marais, le galop, les applaudissements', hate: 'le rouge, l’attente', dex: ['1 scooter', '250 croissants', 'Il vit en liberté avec les chevaux blancs de Camargue.'],
    names: ['Lyre', 'Gardian', 'Mistral', 'Fougue', 'Sansouïre', 'Tonnerre', 'Fanfaron', 'Rhône'], tint: '#efe4df', col: '#6b4f45', egg: { a: '#e9ddd6', b: '#3a2a26', m: 'dunes' },
    lines: { tap: ['Brrr ! On galope ?', 'Bravo ! Bravo à moi !', 'Les marais, c’est mon royaume !'], away: ['J’ai galopé avec les chevaux blancs !', 'Quelle course !'] } },
  { id: 'cigogne', nm: 'Cigogne', art: 'une cigogne', pl: 'les cigognes', fem: 1, ter: ['campagne'], tier: 0, bird: 1,
    reg: { grandest: 2.6, allemagne: 1.6, iberie: 0.8, afrique_nord: 0.6, europe_est: 1 },
    bait: ['Grenouilles en chocolat', [['hb_sucre', 1], ['hb_mer', 1]], '#8a5a3a'],
    clue: ['Un grand nid tout en haut des cheminées d’un village à colombages.', 'La cigogne niche en Alsace, dans les campagnes du Grand Est.'],
    perso: 'Voyageuse', bio: 'Chaque automne elle part en Afrique, chaque printemps elle revient sur la même cheminée. On dit qu’elle porte bonheur.',
    love: 'les grands voyages, les cheminées, les grenouilles', hate: 'les éoliennes, l’hiver', dex: ['1 adulte', '80 croissants', 'Elle claque du bec pour dire bonjour : on appelle ça « craqueter ».'],
    names: ['Bretzel', 'Colombage', 'Kougelhopf', 'Plume', 'Strasbourg', 'Bonheur', 'Échasse', 'Riquewihr'], tint: '#f4f4f6', col: '#e5483a', egg: { a: '#ffffff', b: '#e5483a', m: 'leaves2' },
    lines: { tap: ['Clac clac clac ! (ça veut dire bonjour)', 'Je reviens toujours sur ma cheminée.', 'L’Afrique ? J’y vais chaque hiver !'], away: ['Clac clac ! Quelle belle campagne !', 'J’ai vu mille cheminées !'] } },
  { id: 'herisson', nm: 'Hérisson', art: 'un hérisson', pl: 'les hérissons', ter: ['campagne'], tier: 1, cond: { night: 1 },
    reg: faAll(1.6, { britanniques: 1.2, benelux: 1.2, allemagne: 1.2 }),
    bait: ['Écuelle de croquettes', [['hb_pain', 1], ['hb_veg', 1]], '#c99a6a'],
    clue: ['Quelque chose renifle et grignote sous les haies des jardins…', 'Le hérisson ne sort que la nuit : partez entre 21 h et 6 h vers un jardin ou une campagne.'],
    perso: 'Timide', bio: 'Il se roule en boule au moindre bruit, puis déroule le bout du nez pour vérifier. La nuit, il fait le tour de tous les jardins.',
    love: 'les jardins la nuit, les croquettes, les feuilles mortes', hate: 'les tondeuses, les grands bruits', dex: ['1 pamplemousse', '4 croissants', 'Il a environ 6 000 piquants, tout doux quand il est détendu.'],
    names: ['Piquant', 'Châtaigne', 'Bogue', 'Mousse', 'Pelote', 'Noisette', 'Brosse', 'Sous-Bois'], tint: '#f2e8da', col: '#7a5a44', egg: { a: '#e9dcc8', b: '#7a5a44', m: 'leaves' },
    lines: { tap: ['Oh ! Tu m’as fait peur… (il se roule en boule)', 'La nuit, je fais le tour des jardins.', 'Une croquette ? Merci…'], away: ['Je renifle sous toutes les haies !', 'Il fait nuit, c’est parfait.'] } },
  { id: 'ecureuil', nm: 'Écureuil roux', art: 'un écureuil roux', pl: 'les écureuils roux', ter: ['foret'], tier: 0,
    reg: faAll(2, { britanniques: 1, allemagne: 1.4, suisse: 1.6, scandinavie: 1.2, europe_est: 1.2, italie: 1 }),
    bait: ['Noisettes grillées', [['hb_fruit', 1], ['hb_pain', 1]], '#b5774a'],
    clue: ['Des coques de noisettes tombent d’un arbre… quelqu’un mange là-haut.', 'L’écureuil roux vit dans tous les bois et les parcs de France.'],
    perso: 'Étourdi', bio: 'Il cache des noisettes partout pour l’hiver… et en oublie la moitié. Grâce à lui, des forêts entières poussent.',
    love: 'les noisettes, les pommes de pin, grimper', hate: 'les écureuils gris, les chats', dex: ['1 pomme de pin', '2 croissants', 'Il oublie où il cache ses noisettes : de nouveaux arbres poussent.'],
    names: ['Noisette', 'Pomme-de-pin', 'Roussette', 'Gland', 'Panache', 'Sapinette', 'Ficelle', 'Châtaigne'], tint: '#fbe6d6', col: '#d9773a', egg: { a: '#fbe8d2', b: '#d9773a', m: 'leaves' },
    lines: { tap: ['Où est-ce que j’ai caché ma noisette ?', 'Hop, je grimpe !', 'Ma queue, c’est mon parapluie !'], away: ['J’ai caché des noisettes partout !', 'Quelle forêt !'] } },
  { id: 'renardroux', nm: 'Renard roux', art: 'un renard roux', pl: 'les renards roux', ter: ['campagne'], tier: 0,
    reg: faAll(1.6, { britanniques: 1.6, allemagne: 1.4, benelux: 1.2, italie: 1, iberie: 1, europe_est: 1, scandinavie: 1, usa_est: 1, canada: 0.8 }),
    bait: ['Panier de mûres', [['hb_fruit', 2]], '#6a3a5a'],
    clue: ['Une queue rousse disparaît au bord d’un champ, au petit matin.', 'Le renard roux vit dans toutes les campagnes de France.'],
    perso: 'Malin', bio: 'Rusé et curieux, il connaît tous les raccourcis entre les champs. Il fait semblant de dormir… mais il voit tout.',
    love: 'les mûres, les poulaillers (il dit que non), les raccourcis', hate: 'les chiens qui aboient', dex: ['1 chat et demi', '40 croissants', 'Il saute en l’air et plonge le nez dans la neige pour attraper les mulots.'],
    names: ['Goupil', 'Rouquin', 'Malice', 'Roublard', 'Flamme', 'Caramel', 'Paprika', 'Brindille'], tint: '#fde6d2', col: '#e98a3c', egg: { a: '#fde6d2', b: '#e98a3c', m: 'leaves2' },
    lines: { tap: ['Je connais un raccourci…', 'Moi ? Je n’ai rien fait !', 'Hihi, je t’ai eu !'], away: ['J’ai trouvé un raccourci !', 'Personne ne m’a vu passer.'] } },
  { id: 'hibou', nm: 'Hibou grand-duc', art: 'un hibou grand-duc', pl: 'les hiboux grands-ducs', ter: ['foret'], tier: 1, cond: { night: 1 }, bird: 1,
    reg: faAll(1.2, { iberie: 1, italie: 1, allemagne: 1, scandinavie: 1, europe_est: 1 }),
    bait: ['Mulot en peluche', [['laine', 1], ['hb_pain', 1]], '#a8907e'],
    clue: ['« Hou… hou… » : une voix grave, la nuit, au fond des bois.', 'Le grand-duc ne se montre que la nuit, en forêt ou près des falaises.'],
    perso: 'Sage', bio: 'Avec ses grands yeux orange, il voit tout dans le noir. Il parle peu, mais quand il parle, tout le monde écoute.',
    love: 'la nuit, le silence, les vieilles histoires', hate: 'le soleil, les questions bêtes', dex: ['1 aspirateur', '25 croissants', 'Il peut tourner la tête presque complètement, sans bouger les épaules.'],
    names: ['Minuit', 'Sage', 'Plume-Grise', 'Lune', 'Grimoire', 'Hulotte', 'Orage', 'Prosper'], tint: '#f1e4d0', col: '#b8875a', egg: { a: '#f1dcb8', b: '#5a3a26', m: 'leaves' },
    lines: { tap: ['Hou… hou…', 'La nuit porte conseil.', 'Je t’écoute. Avec mes deux grands yeux.'], away: ['Hou… quelle belle nuit.', 'Je vois tout, d’ici.'] } },
  { id: 'loutre', nm: 'Loutre', art: 'une loutre', pl: 'les loutres', fem: 1, ter: ['riviere'], tier: 0,
    reg: { bretagne: 2, naquitaine: 2, occitanie: 1.6, ara: 1.2, pdl: 1.6, normandie: 1, cvl: 1, britanniques: 1.4, scandinavie: 1.2, europe_est: 1 },
    bait: ['Écrevisses', [['hb_mer', 2]], '#e5584f'],
    clue: ['Quelqu’un a fait un toboggan dans la boue, au bord de la rivière.', 'La loutre vit au bord des rivières et des étangs, surtout dans l’Ouest et le Sud-Ouest.'],
    perso: 'Joueuse', bio: 'Elle fait du toboggan dans la boue, jongle avec des cailloux et dort sur le dos en se tenant la main avec ses amies.',
    love: 'les toboggans, les écrevisses, jongler', hate: 'l’eau sale, rester sage', dex: ['1 guitare', '30 croissants', 'Elle a toujours un caillou préféré, rangé sous son bras.'],
    names: ['Galet', 'Toboggan', 'Plouf', 'Ricochet', 'Loire', 'Nénuphar', 'Clapotis', 'Bulle'], tint: '#efe4da', col: '#8a6248', egg: { a: '#e6d2bc', b: '#6fb8d9', m: 'waves' },
    lines: { tap: ['Regarde mon caillou préféré !', 'On fait du toboggan ?', 'Plouf ! Plouf ! Plouf !'], away: ['J’ai fait mille ricochets !', 'L’eau est parfaite !'] } },
  { id: 'martin', nm: 'Martin-pêcheur', art: 'un martin-pêcheur', pl: 'les martins-pêcheurs', ter: ['riviere'], tier: 1, cond: { bait: 1 }, bird: 1,
    reg: faAll(1.2, { britanniques: 1, allemagne: 1, italie: 0.8, benelux: 1 }),
    bait: ['Vairons', [['hb_mer', 1], ['feuille', 1]], '#8fb3c9'],
    clue: ['Un éclair bleu file au ras de l’eau, puis plus rien.', 'Le martin-pêcheur se laisse approcher pour des vairons, au bord des rivières.'],
    perso: 'Vif', bio: 'Le plus bel oiseau des rivières : bleu turquoise et orange. Il attend sans bouger sur sa branche, puis plonge comme une flèche.',
    love: 'les petits poissons, les branches au-dessus de l’eau', hate: 'l’eau trouble, attendre (sauf pour pêcher)', dex: ['1 crayon', '1 croissant', 'Il plonge si vite qu’on ne voit qu’un éclair bleu.'],
    names: ['Éclair', 'Saphir', 'Turquoise', 'Flèche', 'Lagon', 'Agrume', 'Plongeon', 'Azur'], tint: '#e2f2fa', col: '#3fa9d6', egg: { a: '#d6eef8', b: '#f29a4a', m: 'bubbles' },
    lines: { tap: ['Chut… un poisson !', 'Zou ! Tu as vu ? Trop rapide !', 'Bleu dessus, orange dessous. Classe, non ?'], away: ['J’ai attrapé un vairon !', 'L’eau est claire, ici.'] } },
  { id: 'pigeon', nm: 'Pigeon voyageur', art: 'un pigeon voyageur', pl: 'les pigeons voyageurs', ter: ['ville'], tier: 0, bird: 1,
    reg: faAll(2, { benelux: 1.6, britanniques: 1.6, italie: 1.4, iberie: 1.2, allemagne: 1.2, suisse: 1 }),
    bait: ['Graines de tournesol', [['hb_veg', 1], ['hb_pain', 1]], '#d9b85a'],
    clue: ['Roucoulements sur les toits et les places : il est partout en ville.', 'Le pigeon voyageur vit dans toutes les villes : boulangeries, places, gares.'],
    perso: 'Fidèle', bio: 'Il retrouve toujours son chemin, même à des centaines de kilomètres. Autrefois, il portait les lettres.',
    love: 'les miettes, les places, retrouver sa maison', hate: 'les filets, les statues sans pigeon', dex: ['1 bouteille de lait', '3 croissants', 'Il se repère avec le soleil et le champ magnétique de la Terre.'],
    names: ['Facteur', 'Roucou', 'Miette', 'Gare-du-Nord', 'Boussole', 'Courrier', 'Gris-Gris', 'Colis'], tint: '#eceef2', col: '#a7acb8', egg: { a: '#e6e8ee', b: '#7a8494', m: 'leaves2' },
    lines: { tap: ['Rou-rou ! Je connais le chemin !', 'Une miette ? Merci !', 'Je retrouve toujours la maison.'], away: ['Rou-rou ! Belle place !', 'Je connais déjà le chemin du retour.'] } },
  { id: 'chat', nm: 'Chat des toits', art: 'un chat des toits', pl: 'les chats des toits', ter: ['ville'], tier: 1, cond: { night: 1 },
    reg: faAll(1.6, { italie: 1.6, iberie: 1.4, mediterranee: 1.6, benelux: 1, britanniques: 1 }),
    bait: ['Bol de lait tiède', [['hb_from', 1], ['hb_boi', 1]], '#f6f0e2'],
    clue: ['Deux yeux brillent sur les toits, quand la ville s’endort.', 'Le chat des toits ne descend que la nuit : partez entre 21 h et 6 h vers la ville.'],
    perso: 'Indépendant', bio: 'Il vit sur les toits, connaît toutes les gouttières et n’appartient à personne. Mais il a choisi de vous suivre.',
    love: 'les toits, la lune, les siestes au soleil', hate: 'l’eau, les portes fermées', dex: ['1 coussin', '5 croissants', 'Il retombe toujours sur ses pattes.'],
    names: ['Gouttière', 'Minou', 'Pacha', 'Moustache', 'Réglisse', 'Caramel', 'Ardoise', 'Lune'], tint: '#fbeee0', col: '#e6a868', egg: { a: '#fff3e2', b: '#e6a868', m: 'leaves2' },
    lines: { tap: ['Miaou. (C’est tout.)', 'Les toits, la nuit… c’est chez moi.', 'Je te laisse me caresser. Une fois.'], away: ['Je me promène sur les toits.', 'La lune est belle, ce soir.'] } },
  { id: 'mouflon', nm: 'Mouflon de Corse', art: 'un mouflon de Corse', pl: 'les mouflons de Corse', ter: ['montagne'], tier: 1, cond: { bait: 1 },
    reg: { corse: 2.6, mediterranee: 0.6 },
    bait: ['Maquis en fleurs', [['feuille', 2], ['hb_fruit', 1]], '#c9a6d8'],
    clue: ['Des cornes enroulées comme des escargots, sur les crêtes de l’île de Beauté.', 'Le mouflon ne vit qu’en Corse et ne s’approche que pour un bouquet de maquis en fleurs.'],
    perso: 'Fier', bio: 'Le gardien des montagnes corses. Ses cornes enroulées le rendent très fier, et il a raison.',
    love: 'le maquis, les crêtes, le vent du large', hate: 'les sentiers trop fréquentés', dex: ['1 valise', '200 croissants', 'Il vit en Corse depuis des milliers d’années.'],
    names: ['Maquis', 'Bonifacio', 'Escargot', 'Granit', 'Bastia', 'Myrte', 'Libecciu', 'Cortenais'], tint: '#f2e2d4', col: '#9a5a3a', egg: { a: '#f2e2cc', b: '#9a5a3a', m: 'dunes' },
    lines: { tap: ['Admire mes cornes enroulées.', 'Le maquis sent bon, aujourd’hui.', 'Les crêtes, c’est chez moi.'], away: ['Le vent du large est parfait.', 'Je veille sur la montagne.'] } },
];
const FA = Object.fromEntries(FA_SP.map(f => [f.id, f]));
// terrain et rareté des espèces d'avant (les mêmes règles pour tout le monde)
const FA_OLD = {
  panda: { ter: ['foret'], tier: 0 }, capy: { ter: ['riviere'], tier: 0 }, axo: { ter: ['marais'], tier: 0 }, renard: { ter: ['neige'], tier: 1 },
  fennec: { ter: ['desert'], tier: 1 }, tanuki: { ter: ['ville'], tier: 0 }, paresseux: { ter: ['jungle'], tier: 1 }, lemur: { ter: ['jungle'], tier: 1 },
  phoque: { ter: ['mer'], tier: 1 }, quokka: { ter: ['campagne'], tier: 0 },
};
// fiche « SP_INFO » d'une nouvelle espèce (lue par 20_collection.js avant de relire les compagnons sauvegardés)
function faInfo(f) {
  const HAB = { montagne: ['montagne'], mer: ['mer', 'ile'], riviere: ['lac'], foret: ['foret'], campagne: ['campagne'], ville: ['ville'], neige: ['neige'], desert: ['desert'], jungle: ['foret', 'ile'], marais: ['lac', 'campagne'] };
  const L = f.lines || {};
  return { name: f.nm, art: f.art, tpl: f.bird || f.ter[0] === 'riviere' ? 'bulle' : 'pistache', temper: f.tier === 2 ? 0 : f.ter[0] === 'riviere' || f.ter[0] === 'mer' ? 'eau' : 2, hab: HAB[f.ter[0]] || ['campagne'], tint: f.tint,
    names: f.names, perso: f.perso, bio: f.bio, love: f.love, hate: f.hate,
    lines: { hello: L.hello || [(L.tap || ['Coucou !'])[0]], pet: ['Mmh, encore !'], click: ['Hihi !'], wake: ['Hein ? On part ?'], idle: [(L.tap || ['On part explorer ?'])[1] || 'On part explorer ?'],
      love: 'Oh, mon préféré ! Merci !', like: 'Miam, merci !', hate: 'Hum… non merci.', tap: L.tap || ['Coucou !', 'On part explorer ?'], night: ['…zzz…'], away: L.away || ['Coucou de la route !'] } };
}

// =====================================================================
// PIÈCES DE DESSIN
// =====================================================================
const faStroke = (d, w, col, L) => `<path d="${d}" stroke="${L}" stroke-width="${w + 3.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const faHorn = c => c.horn || '#e6d6b4';
Object.assign(EARS, {
  rond(ch, c, L) {
    const k = ch.head.rx / 94, y = 150 - ch.head.ry + 16;
    return earPair(ch, 60 * k, y, 12, 'rond', `<ellipse cx="0" cy="0" rx="16" ry="14" fill="${c.fur}" stroke="${L}" stroke-width="2"/><ellipse cx="0" cy="2" rx="8.5" ry="7.5" fill="${c.inner}"/>`);
  },
  chamois(ch, c, L) {
    const k = ch.head.rx / 94, yT = 150 - ch.head.ry, H = faHorn(c);
    const ears = earPair(ch, 74 * k, yT + 40, 64, 'chamois', `<path d="M-14 16 C-16 -4 -6 -30 0 -34 C6 -30 16 -4 14 16Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-7 12 C-8 0 -3 -18 0 -22 C3 -18 8 0 7 12Z" fill="${c.inner}"/>`);
    const horns = [-1, 1].map(s => faStroke(`M${160 + s * 18} ${yT + 16} C${160 + s * 16} ${yT - 8} ${160 + s * 16} ${yT - 28} ${160 + s * 26} ${yT - 36} C${160 + s * 36} ${yT - 42} ${160 + s * 42} ${yT - 32} ${160 + s * 35} ${yT - 25}`, 8, H, L)).join('');
    return `<g class="ear e-cornes">${horns}</g>` + ears;
  },
  bouquetin(ch, c, L) {
    const k = ch.head.rx / 94, yT = 150 - ch.head.ry, H = faHorn(c);
    const ears = earPair(ch, 80 * k, yT + 44, 70, 'chamois', `<path d="M-13 15 C-15 -4 -6 -26 0 -30 C6 -26 15 -4 13 15Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-6 11 C-7 0 -3 -15 0 -18 C3 -15 7 0 6 11Z" fill="${c.inner}"/>`);
    const horns = [-1, 1].map(s => {
      const X = v => 160 + s * v, A = [X(12), yT + 18], B = [X(4), yT - 44], C = [X(46), yT - 104], D = [X(84), yT - 66];
      let r = `<path d="M${A[0]} ${A[1]} C${B[0]} ${B[1]} ${C[0]} ${C[1]} ${D[0]} ${D[1]} C${X(64)} ${yT - 74} ${X(34)} ${yT - 46} ${X(36)} ${yT + 18}Z" fill="${H}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;
      [0.18, 0.3, 0.42, 0.54, 0.66, 0.78].forEach(t => { const P = bez(A, B, C, D, t); r += `<path d="M${(P[0] - s * 2).toFixed(1)} ${(P[1] + 3).toFixed(1)} l${s * 15} ${(-4 - t * 6).toFixed(1)}" stroke="${shade(H, 0.72)}" stroke-width="2.6" stroke-linecap="round"/>`; });
      return r;
    }).join('');
    return `<g class="ear e-cornes">${horns}</g>` + ears;
  },
  mouflon(ch, c, L) {
    const k = ch.head.rx / 94, yT = 150 - ch.head.ry, H = faHorn(c);
    const horns = [-1, 1].map(s => {
      const X = v => 160 + s * v, d = `M${X(30)} ${yT + 18} C${X(64)} ${yT - 22} ${X(116)} ${yT + 18} ${X(96)} ${yT + 66} C${X(84)} ${yT + 94} ${X(52)} ${yT + 80} ${X(58)} ${yT + 58} C${X(62)} ${yT + 44} ${X(78)} ${yT + 46} ${X(78)} ${yT + 58}`;
      return faStroke(d, 15, H, L) + `<path d="${d}" stroke="${shade(H, 0.75)}" stroke-width="2" stroke-dasharray="2 6" fill="none" stroke-linecap="round"/>`;
    }).join('');
    const ears = earPair(ch, 60 * k, yT + 30, 30, 'chamois', `<path d="M-12 14 C-14 -4 -6 -24 0 -28 C6 -24 14 -4 12 14Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-6 10 C-7 0 -3 -14 0 -17 C3 -14 7 0 6 10Z" fill="${c.inner}"/>`);
    return ears + `<g class="ear e-cornes">${horns}</g>`;
  },
  taureau(ch, c, L) {
    const k = ch.head.rx / 94, yT = 150 - ch.head.ry, H = faHorn(c);
    const horns = [-1, 1].map(s => { const X = v => 160 + s * v; return `<path d="M${X(44)} ${yT + 24} C${X(86)} ${yT + 16} ${X(100)} ${yT - 8} ${X(92)} ${yT - 34} C${X(90)} ${yT - 6} ${X(76)} ${yT + 30} ${X(44)} ${yT + 42}Z" fill="${H}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${X(86)} ${yT - 16} q${s * 4} -8 ${s * 5} -16" stroke="${shade(H, 0.6)}" stroke-width="4" stroke-linecap="round" fill="none"/>`; }).join('');
    const ears = earPair(ch, 92 * k, yT + 54, 74, 'taureau', `<ellipse cx="0" cy="-6" rx="12" ry="20" fill="${c.fur}" stroke="${L}" stroke-width="2"/><ellipse cx="0" cy="-4" rx="6" ry="12" fill="${c.inner}"/>`);
    return `<g class="ear e-cornes">${horns}</g>` + ears;
  },
  lynx(ch, c, L) {
    const k = ch.head.rx / 94, yT = 150 - ch.head.ry, { rx } = ch.head;
    const ruff = [-1, 1].map(s => { const X = v => 160 + s * v; return `<path d="M${X(rx - 14)} ${150 - 6} L${X(rx + 18)} ${150 + 4} L${X(rx - 2)} ${150 + 14} L${X(rx + 22)} ${150 + 28} L${X(rx - 4)} ${150 + 34} L${X(rx + 14)} ${150 + 50} L${X(rx - 26)} ${150 + 52}Z" fill="${c.light}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`; }).join('');
    return ruff + earPair(ch, 58 * k, yT + 28, 14, 'lynx', `<path d="M-23 20 C-24 -6 -10 -40 0 -46 C10 -40 24 -6 23 20Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-12 16 C-12 -2 -5 -26 0 -30 C5 -26 12 -2 12 16Z" fill="${c.inner}"/><path d="M0 -44 L-2 -68 M1 -44 L4 -64" stroke="${c.dark}" stroke-width="4.2" stroke-linecap="round"/>`);
  },
  ecureuil(ch, c, L) {
    const k = ch.head.rx / 94, y = 150 - ch.head.ry + 24;
    return earPair(ch, 54 * k, y, 14, 'ecureuil', `<path d="M-18 18 C-20 -4 -8 -32 0 -36 C8 -32 20 -4 18 18Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-9 14 C-10 0 -4 -18 0 -22 C4 -18 10 0 9 14Z" fill="${c.inner}"/>${faStroke('M-1 -33 q-5 -12 -3 -22 M1 -33 q6 -10 6 -20', 3.6, c.fur, L)}`);
  },
  chat(ch, c, L) {
    const k = ch.head.rx / 94, y = 150 - ch.head.ry + 24;
    return earPair(ch, 58 * k, y, 18, 'chat', `<path d="M-24 18 L-6 -38 Q0 -45 6 -38 L24 18Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-12 12 L-3 -24 Q0 -28 3 -24 L12 12Z" fill="${c.inner}"/>`);
  },
  herisson(ch, c, L) {
    const { rx, ry } = ch.head; let s = ''; const N = 15;
    for (let i = 0; i < N; i++) {
      const a = Math.PI * (1.03 + 0.94 * i / (N - 1)), ca = Math.cos(a), sa = Math.sin(a);
      const bx = 160 + ca * rx * 0.84, by = 150 + sa * ry * 0.84, tx = 160 + ca * rx * 1.3, ty = 150 + sa * ry * 1.34, w = 14;
      s += `<path d="M${(bx - sa * w).toFixed(1)} ${(by + ca * w).toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} L${(bx + sa * w).toFixed(1)} ${(by - ca * w).toFixed(1)}Z" fill="${i % 2 ? c.dark : shade(c.dark, 1.12)}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
    }
    return `<g class="ear e-herisson">${s}</g>`;
  },
  hibou(ch, c, L) {
    const k = ch.head.rx / 94, y = 150 - ch.head.ry + 22;
    return earPair(ch, 62 * k, y, 30, 'hibou', `<path d="M-16 16 C-18 -6 -10 -30 -2 -42 C4 -28 14 -8 16 16Z" fill="${c.fur}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M-7 10 C-7 -4 -4 -18 -1 -28" stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  },
});
Object.assign(SNOUTS, {
  marmotte(m, c, L) {
    return `<ellipse cx="160" cy="${m - 6}" rx="28" ry="19" fill="${c.light}"/>
      <path d="M151 ${m - 19} Q160 ${m - 24} 169 ${m - 19} Q166 ${m - 10} 160 ${m - 9} Q154 ${m - 10} 151 ${m - 19}Z" fill="#3b2a2a"/><ellipse cx="156" cy="${m - 19}" rx="2.6" ry="1.4" fill="#fff" opacity=".6"/>
      <rect x="152.6" y="${m + 1}" width="7" height="10" rx="2.2" fill="#fffaf0" stroke="${L}" stroke-width="1.4"/><rect x="160.4" y="${m + 1}" width="7" height="10" rx="2.2" fill="#fffaf0" stroke="${L}" stroke-width="1.4"/>`;
  },
  chevre(m, c, L) {
    return `<ellipse cx="160" cy="${m - 8}" rx="30" ry="22" fill="${c.light}"/><ellipse cx="160" cy="${m - 22}" rx="22" ry="6" fill="#fff" opacity=".25"/>
      <ellipse cx="${160 - 8}" cy="${m - 14}" rx="3.4" ry="4.4" fill="#3b2a2a" transform="rotate(-18 ${160 - 8} ${m - 14})"/><ellipse cx="${160 + 8}" cy="${m - 14}" rx="3.4" ry="4.4" fill="#3b2a2a" transform="rotate(18 ${160 + 8} ${m - 14})"/>
      <path d="M160 ${m - 10} v8" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/>`;
  },
  barbe(m, c, L) {
    return SNOUTS.chevre(m, c, L) + `<path d="M150 ${m + 8} Q160 ${m + 40} 170 ${m + 8} Q160 ${m + 14} 150 ${m + 8}Z" fill="${shade(c.furH, 0.82)}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
  },
  taureau(m, c, L) {
    const p = mixHex('#efb3aa', c.light, 0.35);
    return `<ellipse cx="160" cy="${m - 6}" rx="40" ry="25" fill="${p}" stroke="${L}" stroke-width="1.8"/><ellipse cx="160" cy="${m - 22}" rx="26" ry="6" fill="#fff" opacity=".3"/>
      <ellipse cx="${160 - 15}" cy="${m - 10}" rx="5.5" ry="7" fill="${shade(p, 0.55)}"/><ellipse cx="${160 + 15}" cy="${m - 10}" rx="5.5" ry="7" fill="${shade(p, 0.55)}"/>`;
  },
  chat(m, c, L) {
    return `<ellipse cx="${160 - 11}" cy="${m - 6}" rx="13" ry="10" fill="${c.light}"/><ellipse cx="${160 + 11}" cy="${m - 6}" rx="13" ry="10" fill="${c.light}"/>
      <path d="M153 ${m - 16} L167 ${m - 16} L160 ${m - 8}Z" fill="#f08aa0" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M${160 - 22} ${m - 8} l-26 -5 M${160 - 22} ${m - 3} l-26 3 M${160 + 22} ${m - 8} l26 -5 M${160 + 22} ${m - 3} l26 3" stroke="${L}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`;
  },
  herisson(m, c, L) {
    return `<ellipse cx="160" cy="${m - 8}" rx="22" ry="17" fill="${c.light}"/><ellipse cx="160" cy="${m - 18}" rx="7.5" ry="5.5" fill="#3b2a2a"/><ellipse cx="157.5" cy="${m - 20}" rx="2.4" ry="1.3" fill="#fff" opacity=".6"/>`;
  },
  ecureuil(m, c, L) {
    return `<ellipse cx="160" cy="${m - 7}" rx="22" ry="15" fill="${c.light}"/><path d="M153 ${m - 18} Q160 ${m - 22} 167 ${m - 18} Q165 ${m - 11} 160 ${m - 10} Q155 ${m - 11} 153 ${m - 18}Z" fill="#3b2a2a"/>`;
  },
  bec(m, c, L) {
    const B = c.beak || '#f2b33a';
    return `<path d="M146 ${m - 24} Q160 ${m - 32} 174 ${m - 24} Q170 ${m - 12} 160 ${m - 2} Q150 ${m - 12} 146 ${m - 24}Z" fill="${B}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M151 ${m - 23} Q160 ${m - 28} 169 ${m - 23}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>${c.spot ? `<circle cx="165" cy="${m - 12}" r="3.4" fill="${c.spot}"/>` : ''}`;
  },
  macareux(m, c, L) {
    return `<path d="M140 ${m - 28} Q160 ${m - 37} 180 ${m - 28} Q178 ${m - 4} 160 ${m + 12} Q142 ${m - 4} 140 ${m - 28}Z" fill="#f07a3a" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M141 ${m - 27} Q160 ${m - 35} 179 ${m - 27} Q177 ${m - 19} 160 ${m - 16} Q143 ${m - 19} 141 ${m - 27}Z" fill="#6f7a8c"/><path d="M147 ${m - 8} Q160 ${m - 2} 173 ${m - 8}" stroke="#f6d36b" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  },
  flamant(m, c, L) {
    return `<path d="M148 ${m - 26} Q160 ${m - 32} 172 ${m - 26} Q173 ${m - 10} 166 ${m} Q161 ${m + 12} 156 ${m + 16} Q148 ${m + 2} 148 ${m - 26}Z" fill="${c.beak || '#f8dde0'}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M150 ${m - 2} Q158 ${m} 166 ${m} Q161 ${m + 12} 156 ${m + 16} Q150 ${m + 6} 150 ${m - 2}Z" fill="#2f2a30"/>`;
  },
  cigogne(m, c, L) {
    return `<path d="M149 ${m - 26} Q160 ${m - 31} 171 ${m - 26} L162.5 ${m + 32} Q160 ${m + 37} 157.5 ${m + 32}Z" fill="${c.beak || '#e5483a'}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M154 ${m - 22} L159 ${m + 22}" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>`;
  },
  martin(m, c, L) {
    return `<path d="M150 ${m - 26} Q160 ${m - 30} 170 ${m - 26} L161.5 ${m + 28} Q160 ${m + 31} 158.5 ${m + 28}Z" fill="${c.beak || '#2f2a30'}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
  },
  hibou(m, c, L) {
    return `<path d="M152 ${m - 26} Q160 ${m - 30} 168 ${m - 26} Q167 ${m - 10} 160 ${m - 2} Q153 ${m - 10} 152 ${m - 26}Z" fill="${c.beak || '#c9a35a'}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M160 ${m - 2} q-1 4 -4 5" stroke="${L}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  },
});
Object.assign(SNOUT_K, { chevre: 0.9, taureau: 0.85 });
Object.assign(TAILS, {
  ecureuil(ch, c, L, g) { const x0 = 160 + g.tw - 10; return plume([x0 - 8, 306], [x0 + 74, 322], [x0 + 104, 206], [x0 + 26, 140], 36, 16, c.fur, c.fur, 0, L, 't-ecureuil'); },
  marmotte(ch, c, L, g) { const x0 = 160 + g.tw - 10; return plume([x0 - 6, 306], [x0 + 30, 318], [x0 + 46, 298], [x0 + 42, 274], 15, 8, c.dark, c.dark, 0, L, 't-marmotte'); },
  court(ch, c, L, g) { const x0 = 160 + g.tw - 8; return `<g class="swish t-court" style="transform-origin:${x0}px 292px"><ellipse cx="${x0 + 12}" cy="282" rx="10" ry="15" fill="${c.dark}" stroke="${L}" stroke-width="2" transform="rotate(34 ${x0 + 12} 282)"/></g>`; },
  oiseau(ch, c, L, g) {
    const x0 = 160 + g.tw - 14;
    return `<g class="swish t-oiseau" style="transform-origin:${x0}px 300px">${[[14, 46], [34, 30], [52, 14]].map(([a, r]) => `<ellipse cx="${x0 + 16}" cy="${300 - r * 0.2}" rx="11" ry="30" fill="${c.dark}" stroke="${L}" stroke-width="2" transform="rotate(${a + 40} ${x0} 304)"/>`).join('')}</g>`;
  },
  chat(ch, c, L, g) {
    const x0 = 160 + g.tw - 8, d = `M${x0 - 6} 302 C${x0 + 52} 312 ${x0 + 70} 262 ${x0 + 48} 222 C${x0 + 38} 204 ${x0 + 54} 190 ${x0 + 66} 198`;
    return `<g class="swish t-chat" style="transform-origin:${x0}px 302px">${faStroke(d, 18, c.fur, L)}</g>`;
  },
  lynx(ch, c, L, g) { const x0 = 160 + g.tw - 8; return `<g class="swish t-court" style="transform-origin:${x0}px 296px">${capsule(x0 - 4, 296, x0 + 24, 278, 20, c.fur, L)}<circle cx="${x0 + 26}" cy="276" r="9" fill="${c.dark}"/></g>`; },
  loutre(ch, c, L, g) { const x0 = 160 + g.tw - 8; return `<g class="swish t-loutre" style="transform-origin:${x0}px 300px"><path d="M${x0 - 8} 290 C${x0 + 40} 296 ${x0 + 72} 298 ${x0 + 96} 284 C${x0 + 74} 312 ${x0 + 30} 320 ${x0 - 8} 316Z" fill="${c.fur}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/></g>`; },
  herisson(ch, c, L, g) {
    let s = ''; const cx = 160, cy = 268, rx = g.tw + 24, ry = 52, N = 14;
    for (let i = 0; i < N; i++) {
      const a = Math.PI * (0.92 + 1.16 * i / (N - 1)), ca = Math.cos(a), sa = Math.sin(a);
      const bx = cx + ca * rx * 0.8, by = cy + sa * ry * 0.8, tx = cx + ca * rx * 1.18, ty = cy + sa * ry * 1.22, w = 13;
      s += `<path d="M${(bx - sa * w).toFixed(1)} ${(by + ca * w).toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} L${(bx + sa * w).toFixed(1)} ${(by - ca * w).toFixed(1)}Z" fill="${i % 2 ? c.dark : shade(c.dark, 1.12)}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
    }
    return `<g class="t-herisson">${s}<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.86}" ry="${ry * 0.86}" fill="${c.dark}"/></g>`;
  },
  taureau(ch, c, L, g) { const x0 = 160 + g.tw - 8, d = `M${x0 - 4} 290 C${x0 + 26} 292 ${x0 + 34} 270 ${x0 + 30} 248`; return `<g class="swish t-taureau" style="transform-origin:${x0}px 290px">${faStroke(d, 6, c.fur, L)}<ellipse cx="${x0 + 30}" cy="242" rx="8" ry="12" fill="${c.dark}" stroke="${L}" stroke-width="1.8"/></g>`; },
});
// marques sur la tête (bandeaux, disques, joues…)
MARKS = (orig => function (ch, c, L, uid) {
  const clip = s => `<g clip-path="url(#${uid}hc)">${s}</g>`, e = ch.eye;
  switch (ch.sp) {
    case 'chamois': case 'isard': return clip([-1, 1].map(s => `<path d="M${160 + s * 52} 86 C${160 + s * 40} 120 ${160 + s * (e.dx + 4)} 150 ${160 + s * 22} 184 L${160 + s * 10} 182 C${160 + s * (e.dx - 10)} 150 ${160 + s * 26} 118 ${160 + s * 36} 84Z" fill="${c.dark}" opacity=".88"/>`).join(''));
    case 'macareux': return clip(`<ellipse cx="160" cy="166" rx="${ch.head.rx * 0.82}" ry="${ch.head.ry * 0.62}" fill="${c.light}"/>`) + [-1, 1].map(s => `<path d="M${160 + s * (e.dx - 6)} ${e.y - 18} l${s * 10} -6" stroke="#f2a03a" stroke-width="3" stroke-linecap="round"/>`).join('');
    case 'martin': return clip(`<ellipse cx="160" cy="214" rx="40" ry="20" fill="#ffffff" opacity=".9"/>${[-1, 1].map(s => `<ellipse cx="${160 + s * 64}" cy="${e.y + 8}" rx="26" ry="14" fill="#f29a4a"/>`).join('')}`);
    case 'hibou': return clip([-1, 1].map(s => `<circle cx="${160 + s * e.dx}" cy="${e.y}" r="${e.rx * 2.3}" fill="${c.light}" opacity=".9"/>`).join('') + `<path d="M160 100 L160 150" stroke="${c.dark}" stroke-width="3" opacity=".25"/>`);
    case 'lynx': return clip([-1, 1].map(s => [[54, 176, 3.4], [64, 186, 3], [46, 190, 2.6], [70, 168, 2.6]].map(([dx, y, r]) => `<circle cx="${160 + s * dx}" cy="${y}" r="${r}" fill="${c.dark}" opacity=".7"/>`).join('')).join('') + `<path d="M150 92 l2 18 M160 88 l0 20 M170 92 l-2 18" stroke="${c.dark}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`);
    case 'renardroux': return clip(`<path d="M${160 - ch.head.rx} 170 Q${160 - 40} 150 160 176 Q${160 + 40} 150 ${160 + ch.head.rx} 170 L${160 + ch.head.rx} 240 L${160 - ch.head.rx} 240Z" fill="${c.light}"/>`);
    case 'taureau': return [-1, 1].map(s => `<ellipse cx="${160 + s * e.dx}" cy="${e.y}" rx="${e.rx * 1.7}" ry="${e.ry * 1.5}" fill="${c.light}" opacity=".55"/>`).join('');
    case 'pigeon': return clip(`<ellipse cx="160" cy="226" rx="90" ry="22" fill="#8fc7a8" opacity=".55"/><ellipse cx="160" cy="232" rx="90" ry="14" fill="#b39ad8" opacity=".5"/>`);
    case 'cigogne': return '';
    default: return orig.apply(this, arguments);
  }
})(MARKS);
// becs : redessinés par-dessus la bouche
const FA_BEAKS = ['bec', 'macareux', 'flamant', 'cigogne', 'martin', 'hibou'];
face =(orig => function (key, ch) {
  const s = orig.apply(this, arguments);
  return ch && ch.parts && FA_BEAKS.includes(ch.parts.snout) ? s + snoutOf(ch) : s;
})(face);
// pattes d'oiseau : fines, à trois doigts
legsAndFeet = (orig => function (o, g, ch) {
  if (!(ch && ch.spec && ch.spec.shape && ch.spec.shape.birdLegs)) return orig.apply(this, arguments);
  const c = ch.c, L = c.line, F = c.feet || '#f2a03a';
  return [-1, 1].map(s => { const x = 160 + s * 20; return faStroke(`M${x} 300 L${x} 326`, 6, F, L) + faStroke(`M${x - 11} 332 L${x} 326 L${x + 11} 332 M${x} 326 L${x} 334`, 4.5, F, L); }).join('');
})(legsAndFeet);

// ---------- silhouettes et palettes ----------
const faMam = (more) => Object.assign({ tw: 42, head: { rx: 94, ry: 76 }, eye: { dx: 38, y: 150, rx: 12, ry: 13.5 }, mouthY: 192, mouth: 'w', blush: { dx: 62, y: 174 }, iris: '#5a4030', belly: 'patch', torso: 'std', legs: true }, more || {});
const faBird = (more) => Object.assign({ tw: 46, head: { rx: 92, ry: 78 }, eye: { dx: 40, y: 146, rx: 12, ry: 13.5 }, mouthY: 188, mouth: 'small', blush: { dx: 64, y: 172 }, iris: '#3a2a2a', belly: 'round', torso: 'round', legs: true, birdLegs: true, beak: true, limbDark: true }, more || {});
const FA_DRAW = {
  marmotte: { shape: faMam({ tw: 50, head: { rx: 96, ry: 78 }, torso: 'round', belly: 'round', iris: '#4a3428' }), parts: { ears: 'rond', tail: 'marmotte', snout: 'marmotte', mask: null, arms: 'arm', hands: 'paw' }, graft: ['snout', 'ears'],
    pals: [PAL('naturel', 'Naturel', 0, '#b48a62', '#5e4433', '#ead7bd'), PAL('blonde', 'Blonde des alpages', 0, '#d6b48a', '#7a5a40', '#f6ead6'), PAL('cendre', 'Cendrée', 0, '#9c9188', '#4e4642', '#e6e0da'), PAL('roux', 'Rousse', 1, '#c98a52', '#5a3a26', '#f4e0c8')], sh: ['peche', 'menthe', 'nuit', 'or', 'arcenciel', 'cristal'] },
  chamois: { shape: faMam({ tw: 40, head: { rx: 90, ry: 76 }, iris: '#7a4a2e' }), parts: { ears: 'chamois', tail: 'court', snout: 'chevre', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'snout'], graftNames: { ears: 'Cornes' },
    pals: [PAL('naturel', 'Pelage d’été', 0, '#a8784e', '#3a2a24', '#f1e2cc', { x: { horn: '#2f2622' } }), PAL('hiver', 'Pelage d’hiver', 0, '#6e5a4e', '#2a201c', '#e8dccb', { x: { horn: '#2f2622' } }), PAL('clair', 'Fauve clair', 0, '#c9a27a', '#4a3428', '#f8ecd8', { x: { horn: '#2f2622' } }), PAL('ardoise', 'Ardoise', 1, '#8a8a94', '#3a3a44', '#eef0f4', { x: { horn: '#2a2a30' } })], sh: ['lavande', 'peche', 'nuit', 'or', 'arcenciel', 'cristal'] },
  bouquetin: { shape: faMam({ tw: 44, head: { rx: 92, ry: 78 }, mouthY: 188, iris: '#8a6a3a' }), parts: { ears: 'bouquetin', tail: 'court', snout: 'barbe', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'snout'], graftNames: { ears: 'Cornes', snout: 'Barbiche' },
    pals: [PAL('naturel', 'Naturel', 0, '#b39b7d', '#5a4a3c', '#efe4d2', { x: { horn: '#cdb48c' } }), PAL('gris', 'Gris des cimes', 0, '#9b9389', '#4e4842', '#ece8e2', { x: { horn: '#d6c4a2' } }), PAL('brun', 'Brun', 0, '#8a6a52', '#3e2e24', '#e6d6c4', { x: { horn: '#cdb48c' } }), PAL('neige', 'Neige éternelle', 1, '#e8e4dc', '#9a9086', '#ffffff', { x: { horn: '#c9b48c' } })], sh: ['ciel', 'aurore', 'nuit', 'or', 'arcenciel', 'cristal'] },
  isard: { shape: faMam({ tw: 40, head: { rx: 90, ry: 76 }, iris: '#7a4a2e' }), parts: { ears: 'chamois', tail: 'court', snout: 'chevre', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'snout'], graftNames: { ears: 'Cornes' },
    pals: [PAL('naturel', 'Naturel', 0, '#c79a62', '#4a3428', '#f4e6cf', { x: { horn: '#2f2622' } }), PAL('miel', 'Miel', 0, '#d9b07a', '#5a4030', '#fbf0de', { x: { horn: '#2f2622' } }), PAL('hiver', 'Pelage d’hiver', 0, '#7a6454', '#2e2420', '#ece0d0', { x: { horn: '#2f2622' } }), PAL('roux', 'Roux des estives', 1, '#d08a52', '#5a3424', '#fbe8d2', { x: { horn: '#2f2622' } })], sh: ['peche', 'menthe', 'corail', 'or', 'arcenciel', 'cristal'] },
  lynx: { shape: faMam({ tw: 44, head: { rx: 92, ry: 76 }, iris: '#9a8a3a', eye: { dx: 38, y: 148, rx: 12, ry: 13 } }), parts: { ears: 'lynx', tail: 'lynx', snout: 'chat', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'tail'], graftNames: { ears: 'Pinceaux' },
    pals: [PAL('naturel', 'Naturel', 0, '#d9b483', '#5a4030', '#fbf1e2', { pc: '#8a6040' }), PAL('gris', 'Gris boréal', 0, '#c7bba8', '#4e4640', '#f8f4ee', { pc: '#6e6258' }), PAL('fauve', 'Fauve', 0, '#c99a62', '#4a3020', '#f6e6cc', { pc: '#6a4428' }), PAL('neige', 'Lynx des neiges', 1, '#eee8de', '#8a8076', '#ffffff', { pc: '#9a9086' })], sh: ['lavande', 'aurore', 'nuit', 'or', 'arcenciel', 'cristal'], pats: 'taches' },
  macareux: { shape: faBird({ iris: '#2a2830' }), parts: { ears: null, tail: 'oiseau', snout: 'macareux', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['snout', 'tail'], graftNames: { snout: 'Bec' },
    pals: [PAL('naturel', 'Naturel', 0, '#3b3a44', '#1f1e26', '#ffffff', { x: { line: '#2a2830', feet: '#f07a3a', inner: '#2a2830' } }), PAL('brun', 'Jeune', 0, '#5a5058', '#2e2830', '#f4f0f2', { x: { feet: '#f09a5a' } }), PAL('ardoise', 'Ardoise', 0, '#4a5466', '#262c38', '#f4f6fa', { x: { feet: '#f07a3a' } }), PAL('arctique', 'Arctique', 1, '#2f3a52', '#161c2a', '#e8f4fb', { x: { feet: '#f2603a' } })], sh: ['ciel', 'ocean', 'nuit', 'or', 'arcenciel', 'cristal'] },
  goeland: { shape: faBird({ iris: '#c9a23a' }), parts: { ears: null, tail: 'oiseau', snout: 'bec', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['snout', 'tail'], graftNames: { snout: 'Bec' },
    pals: [PAL('naturel', 'Argenté', 0, '#f4f6f8', '#8a96a6', '#ffffff', { x: { beak: '#f2c23a', spot: '#e5483a', feet: '#efb0a8', line: '#5a6270' } }), PAL('brun', 'Jeune tacheté', 0, '#c9bba8', '#7a6a5a', '#efe8de', { x: { beak: '#3a3438', feet: '#d9a8a0' } }), PAL('marin', 'Marin', 0, '#e8ecf0', '#4a5260', '#ffffff', { x: { beak: '#f2c23a', spot: '#e5483a', feet: '#f2c23a' } }), PAL('tempete', 'Tempête', 1, '#b8c2cc', '#4a5460', '#eef2f6', { x: { beak: '#f2c23a', spot: '#e5483a', feet: '#efb0a8' } })], sh: ['ciel', 'ocean', 'nuit', 'or', 'arcenciel', 'cristal'] },
  flamant: { shape: faBird({ iris: '#e0a030' }), parts: { ears: null, tail: 'oiseau', snout: 'flamant', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['snout', 'tail'], graftNames: { snout: 'Bec' },
    pals: [PAL('naturel', 'Rose', 0, '#f6a9b8', '#d9607e', '#ffe3ea', { x: { feet: '#e9809a', line: '#8a4a5a' } }), PAL('pale', 'Rose pâle', 0, '#fbd2da', '#e5869c', '#fff2f5', { x: { feet: '#ef9aae' } }), PAL('corail', 'Corail', 0, '#f69a8a', '#d0584e', '#ffe6e0', { x: { feet: '#e9806a' } }), PAL('fuchsia', 'Fuchsia', 1, '#ef7aa8', '#b8366e', '#ffe0ee', { x: { feet: '#e0608e' } })], sh: ['lavande', 'peche', 'nuit', 'or', 'arcenciel', 'cristal'] },
  taureau: { shape: faMam({ tw: 50, head: { rx: 96, ry: 80 }, mouthY: 200, iris: '#4a3428', limbDark: true, torso: 'round', belly: 'round' }), parts: { ears: 'taureau', tail: 'taureau', snout: 'taureau', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'snout'], graftNames: { ears: 'Cornes' },
    pals: [PAL('naturel', 'Noir de Camargue', 0, '#6b4f45', '#2e2220', '#c49a86', { x: { horn: '#f2e6cc', inner: '#8a6a5e', line: '#2e2220' } }), PAL('brun', 'Brun', 0, '#8a6450', '#3a2a22', '#d6b4a0', { x: { horn: '#f2e6cc' } }), PAL('fauve', 'Fauve', 0, '#a87a5a', '#4a3226', '#e6ccb4', { x: { horn: '#f2e6cc' } }), PAL('sable', 'Sable', 1, '#d6b48a', '#6a4a34', '#f6e8d2', { x: { horn: '#fff6e0' } })], sh: ['corail', 'peche', 'nuit', 'or', 'arcenciel', 'cristal'] },
  cigogne: { shape: faBird({ iris: '#3a2a2a', mouthY: 184 }), parts: { ears: null, tail: 'oiseau', snout: 'cigogne', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['snout', 'arms'], graftNames: { snout: 'Bec', arms: 'Ailes' },
    pals: [PAL('naturel', 'Blanche', 0, '#ffffff', '#2f2a30', '#ffffff', { x: { beak: '#e5483a', feet: '#e5483a', line: '#4a4048', fur2: '#eceaee' } }), PAL('creme', 'Crème', 0, '#f6efe4', '#3a3030', '#fffaf2', { x: { beak: '#e5483a', feet: '#e5483a' } }), PAL('noire', 'Cigogne noire', 0, '#4a4450', '#1f1a22', '#ffffff', { x: { beak: '#e5483a', feet: '#e5483a' } }), PAL('aube', 'Aube', 1, '#fde6d6', '#6a4a5a', '#ffffff', { x: { beak: '#f0603a', feet: '#f0603a' } })], sh: ['ciel', 'rose', 'nuit', 'or', 'arcenciel', 'cristal'] },
  herisson: { shape: faMam({ tw: 48, head: { rx: 90, ry: 74 }, torso: 'round', belly: 'round', iris: '#2f2420', eye: { dx: 34, y: 152, rx: 10.5, ry: 12 } }), parts: { ears: 'herisson', tail: 'herisson', snout: 'herisson', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'tail'], graftNames: { ears: 'Piquants', tail: 'Dos piquant' },
    pals: [PAL('naturel', 'Naturel', 0, '#d9c2a2', '#7a5a44', '#f3e6d2'), PAL('chataigne', 'Châtaigne', 0, '#c9a682', '#5a3e2e', '#efe0cc'), PAL('blond', 'Blond', 0, '#ead8bc', '#a88a6a', '#fbf4e8'), PAL('albinos', 'Albinos', 1, '#fbf4ee', '#e6d6cc', '#ffffff', { x: { iris: '#e0607a' } })], sh: ['lavande', 'menthe', 'nuit', 'or', 'arcenciel', 'cristal'] },
  ecureuil: { shape: faMam({ tw: 40, head: { rx: 90, ry: 76 }, iris: '#4a2a1a', eye: { dx: 36, y: 150, rx: 12.5, ry: 14 } }), parts: { ears: 'ecureuil', tail: 'ecureuil', snout: 'ecureuil', mask: null, arms: 'arm', hands: 'paw' }, graft: ['tail', 'ears'],
    pals: [PAL('naturel', 'Roux', 0, '#d9773a', '#8a4020', '#fbe8d2'), PAL('noir', 'Noir', 0, '#5a4038', '#2a1e1a', '#e8dcd2'), PAL('brun', 'Brun', 0, '#a8643a', '#5a3020', '#f2dcc6'), PAL('gris', 'Gris argenté', 1, '#a59a94', '#5a524e', '#f4f0ee')], sh: ['peche', 'corail', 'nuit', 'or', 'arcenciel', 'cristal'] },
  renardroux: { shape: faMam({ tw: 42, head: { rx: 96, ry: 76 }, iris: '#8a5a2a' }), parts: { ears: 'renard', tail: 'renard', snout: 'renard', mask: null, arms: 'arm', hands: 'paw' }, graft: ['tail', 'ears'],
    pals: [PAL('naturel', 'Roux', 0, '#e98a3c', '#4a2f26', '#fff3e6', { x: { tip: '#ffffff', inner: '#3a2620' } }), PAL('charbonnier', 'Charbonnier', 0, '#d4723a', '#2a1e1a', '#fbe8d6', { x: { tip: '#ffffff' } }), PAL('fauve', 'Fauve', 0, '#e6a060', '#5a3a28', '#fff6ea', { x: { tip: '#ffffff' } }), PAL('argent', 'Argenté', 1, '#8f8a8e', '#2e2a2e', '#f4f2f4', { x: { tip: '#ffffff' } })], sh: ['peche', 'corail', 'nuit', 'or', 'arcenciel', 'cristal'] },
  hibou: { shape: faBird({ tw: 50, head: { rx: 96, ry: 80 }, iris: '#f08a2a', eye: { dx: 40, y: 146, rx: 14, ry: 15 }, belly: 'round' }), parts: { ears: 'hibou', tail: 'oiseau', snout: 'hibou', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['ears', 'snout'], graftNames: { ears: 'Aigrettes', snout: 'Bec' },
    pals: [PAL('naturel', 'Naturel', 0, '#b8875a', '#5a3a26', '#f1dcb8', { x: { feet: '#d9b47a' }, pc: '#6a4a30' }), PAL('gris', 'Gris', 0, '#9a9088', '#4a423c', '#ece6de', { x: { feet: '#c9b494' } }), PAL('fauve', 'Fauve', 0, '#c99a62', '#5a3a20', '#f6e6c8', { x: { feet: '#d9b47a' } }), PAL('neige', 'Harfang', 1, '#f6f6f8', '#8a8e9a', '#ffffff', { x: { feet: '#e6e6ea', iris: '#f2c23a' }, pat: 'taches', pc: '#5a5e6a' })], sh: ['lavande', 'nuit', 'aurore', 'or', 'arcenciel', 'cristal'] },
  loutre: { shape: faMam({ tw: 44, head: { rx: 92, ry: 74 }, iris: '#2f2420', eye: { dx: 36, y: 146, rx: 11, ry: 12.5 }, mouthY: 196 }), parts: { ears: 'rond', tail: 'loutre', snout: 'phoque', mask: null, arms: 'arm', hands: 'paw' }, graft: ['tail', 'snout'],
    pals: [PAL('naturel', 'Naturel', 0, '#8a6248', '#4a3428', '#e6d2bc'), PAL('chocolat', 'Chocolat', 0, '#6e4a36', '#3a2620', '#dcc6b0'), PAL('miel', 'Miel', 0, '#a8805a', '#5a4030', '#f0e0cc'), PAL('perle', 'Perle', 1, '#d8ccc2', '#7a6e66', '#fbf8f4')], sh: ['ciel', 'ocean', 'menthe', 'or', 'arcenciel', 'cristal'] },
  martin: { shape: faBird({ iris: '#2a2030' }), parts: { ears: null, tail: 'oiseau', snout: 'martin', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['snout', 'arms'], graftNames: { snout: 'Bec', arms: 'Ailes' },
    pals: [PAL('naturel', 'Turquoise', 0, '#3fa9d6', '#1f6f9a', '#f29a4a', { x: { feet: '#e5584f', line: '#1f4a6a' } }), PAL('azur', 'Azur', 0, '#4a8fe0', '#24508a', '#f6a85a', { x: { feet: '#e5584f' } }), PAL('emeraude', 'Émeraude', 0, '#3fc0a8', '#1f7a6a', '#f2a04a', { x: { feet: '#e5584f' } }), PAL('saphir', 'Saphir', 1, '#3a5ad6', '#1a2a7a', '#f6b45a', { x: { feet: '#e5584f' } })], sh: ['ciel', 'ocean', 'nuit', 'or', 'arcenciel', 'cristal'] },
  pigeon: { shape: faBird({ iris: '#e0603a' }), parts: { ears: null, tail: 'oiseau', snout: 'bec', mask: null, arms: 'flipper', hands: 'flipper' }, graft: ['snout', 'tail'], graftNames: { snout: 'Bec' },
    pals: [PAL('naturel', 'Gris des villes', 0, '#a7acb8', '#5a6070', '#d9dce4', { x: { beak: '#5a5560', feet: '#e9809a' } }), PAL('blanc', 'Blanc', 0, '#f6f6f8', '#a8acb8', '#ffffff', { x: { beak: '#e6c8b8', feet: '#e9809a' } }), PAL('brun', 'Brun', 0, '#a8907e', '#5a483e', '#e6dcd2', { x: { beak: '#5a5560', feet: '#e9809a' } }), PAL('ardoise', 'Bleu ardoise', 1, '#7a88a8', '#3a4460', '#d6dcec', { x: { beak: '#4a4650', feet: '#e9809a' } })], sh: ['lavande', 'menthe', 'nuit', 'or', 'arcenciel', 'cristal'] },
  chat: { shape: faMam({ tw: 42, head: { rx: 94, ry: 76 }, iris: '#8ab83a', eye: { dx: 38, y: 150, rx: 12.5, ry: 14 } }), parts: { ears: 'chat', tail: 'chat', snout: 'chat', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'tail'],
    pals: [PAL('naturel', 'Roux tigré', 0, '#e6a868', '#9a6038', '#fff3e2', { pc: '#c47a3a', pat: 'rayures' }), PAL('noir', 'Noir', 0, '#4a4448', '#1f1a1e', '#6a6268', { x: { iris: '#f2c23a' } }), PAL('gris', 'Gris', 0, '#a6a2a8', '#5a565c', '#f2f0f4', { pc: '#7a767c' }), PAL('blanc', 'Blanc', 0, '#f6f2ee', '#c9c0b8', '#ffffff', { x: { iris: '#6aa8e0' } }), PAL('ecaille', 'Écaille de tortue', 1, '#c98a52', '#3a2a24', '#f6e6d2', { pc: '#3a2a24', pat: 'taches' })], sh: ['lavande', 'peche', 'nuit', 'or', 'arcenciel', 'cristal'] },
  mouflon: { shape: faMam({ tw: 44, head: { rx: 92, ry: 76 }, iris: '#8a6a3a' }), parts: { ears: 'mouflon', tail: 'court', snout: 'chevre', mask: null, arms: 'arm', hands: 'paw' }, graft: ['ears', 'snout'], graftNames: { ears: 'Cornes' },
    pals: [PAL('naturel', 'Naturel', 0, '#9a5a3a', '#3a2a24', '#f2e2cc', { x: { horn: '#cdb48c' } }), PAL('brun', 'Brun du maquis', 0, '#7a4a32', '#2e201a', '#ecdcc6', { x: { horn: '#d6c09a' } }), PAL('fauve', 'Fauve', 0, '#b8784a', '#4a3020', '#f6e6d0', { x: { horn: '#cdb48c' } }), PAL('granit', 'Granit', 1, '#9a8e88', '#3e3836', '#f2eeec', { x: { horn: '#e0d0b0' } })], sh: ['corail', 'peche', 'nuit', 'or', 'arcenciel', 'cristal'] },
};
for (const f of FA_SP) {
  const D = FA_DRAW[f.id]; if (!D || SPECIES[f.id]) continue;
  const S0 = SPECIES[f.id] = { name: f.nm, habitat: f.clue[1], shape: D.shape, parts: D.parts, graft: D.graft, graftNames: D.graftNames, palettes: [...D.pals, ...sharedPals(D.sh)], patterns: ALL_PATS, egg: f.egg };
  S0.id = f.id;
  const p = S0.palettes[0];
  S0.defGenes = { pal: p.id, base: p.base, accent: p.accent, belly: p.belly, pattern: p.pat || D.pats || 'uni', patCol: p.pc || mixHex(p.base, p.accent, 0.55), eye: 'def', special: 'none' };
  S0.traits = Object.fromEntries(S0.graft.map(t => [t, (S0.graftNames && S0.graftNames[t]) || TRAIT_NAMES[t]]));
}

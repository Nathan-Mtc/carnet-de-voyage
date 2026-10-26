// ================= RÉGIONS DU MONDE : l'exploration alimente l'économie =================
// 1. ~40 régions de jeu (France découpée finement, grands ensembles ailleurs), regionAt(lon, lat).
// 2. Provenance : chaque objet garde it.origin = { region, place, km } (fabriqué : { region, place, made, multi }).
// 3. Butin régional au retour : une partie du butin devient une spécialité de la région, bonus de rareté selon la distance.
// 4. Recettes multi-régions (atelier, filtre « Merveilles »).
// 5. Codex des régions (Sac & Album › Régions).
// 6. Valeur au marché selon la provenance (« Venu de loin : +40 % »).
// 7. Bloc « Ce que tu peux trouver là-bas » : région et spécialités.
// Tout passe par des enveloppes de fonctions globales (collect, craft, ingCount, value, openFiche, renderBag, haulCard,
// renderAtelier, renderSacTab, liveFindHTML, renderMarket) : les autres fichiers restent presque intacts.

// ---------------- icônes (glyphes blancs sur pastille colorée) ----------------
const RG_GLYPH = {
  mont: '<path d="M2 19.5 L8.6 7.5 L12.4 13.4 L15 10 L22 19.5Z" fill="#fff"/><path d="M7.2 10 L8.6 7.5 L10 10 L8.6 9.3Z" fill="var(--rg)" opacity=".55"/>',
  vague: '<path d="M2.5 10 q2.4 -3 4.8 0 t4.8 0 t4.8 0 t4.8 0 M2.5 16 q2.4 -3 4.8 0 t4.8 0 t4.8 0 t4.8 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
  fleur: '<g fill="#fff">' + [0, 1, 2, 3, 4].map(k => `<circle cx="${(12 + Math.cos(k * 1.2566 - 1.57) * 5).toFixed(1)}" cy="${(12 + Math.sin(k * 1.2566 - 1.57) * 5).toFixed(1)}" r="3.6"/>`).join('') + '</g><circle cx="12" cy="12" r="2.4" fill="var(--rg)"/>',
  soleil: '<circle cx="12" cy="12" r="5" fill="#fff"/><g stroke="#fff" stroke-width="2.2" stroke-linecap="round">' + [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `<path d="M${(12 + c * 7.6).toFixed(1)} ${(12 + s * 7.6).toFixed(1)} L${(12 + c * 9.8).toFixed(1)} ${(12 + s * 9.8).toFixed(1)}"/>`; }).join('') + '</g>',
  feuille: '<path d="M12 21 V15 M12 15 L6 17 L7 14 L3.5 11.5 L6 10.5 L5 7 L8.5 8 L9.5 5.5 L12 8 L14.5 5.5 L15.5 8 L19 7 L18 10.5 L20.5 11.5 L17 14 L18 17Z" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>',
  chateau: '<path d="M3 20.5 V8 H5.5 V10 H7.5 V8 H10 V12 H14 V8 H16.5 V10 H18.5 V8 H21 V20.5Z" fill="#fff"/><path d="M10.5 20.5 V16.5 a1.5 1.5 0 0 1 3 0 V20.5Z" fill="var(--rg)"/>',
  tour: '<path d="M12 2.5 L13.4 9 L17.5 21 H14.5 L12 15.5 L9.5 21 H6.5 L10.6 9Z" fill="#fff"/><path d="M8.6 13.5 H15.4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  pagode: '<path d="M12 2.5 L13 4.5 H16.5 L14.8 7 H9.2 L7.5 4.5 H11Z M5.5 9 H18.5 L16.5 12 H7.5Z M3.5 14.5 H20.5 L18 17.5 H6Z" fill="#fff"/><path d="M8.5 17.5 V21 M15.5 17.5 V21 M10 7 V9 M14 7 V9 M8.5 12 V14.5 M15.5 12 V14.5" stroke="#fff" stroke-width="1.8"/>',
  palmier: '<path d="M12.5 21.5 C12 16.5 12 12 13.5 8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M13.5 8 C9 4.5 5 6 3.5 9 C7 7.5 10 8 13.5 8Z M13.5 8 C17 4 21 5 22 8 C18.5 7 16 7.5 13.5 8Z M13.5 8 C12 3.5 14.5 2 17.5 2.5 C15 4 14 6 13.5 8Z" fill="#fff"/>',
  flocon: '<g stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.5 V21.5 M3.8 7.2 L20.2 16.8 M20.2 7.2 L3.8 16.8"/><path d="M9.5 4.5 L12 6.5 L14.5 4.5 M9.5 19.5 L12 17.5 L14.5 19.5" fill="none"/></g>',
  cactus: '<path d="M10 21 V5.5 a2 2 0 0 1 4 0 V21Z M10 14 H7 a2 2 0 0 1 -2 -2 V9 a1.5 1.5 0 0 1 3 0 V11 H10Z M14 12 H17 V8 a1.5 1.5 0 0 1 3 0 V11.5 a2.5 2.5 0 0 1 -2.5 2.5 H14Z" fill="#fff"/>',
  pomme: '<path d="M12 8 C8 5.5 4 8 4.5 13 C5 18 8.5 21 12 19.5 C15.5 21 19 18 19.5 13 C20 8 16 5.5 12 8Z" fill="#fff"/><path d="M12 8 C12 6 13 4 15 3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  colonne: '<path d="M3 8 L12 3 L21 8Z M3.5 19 H20.5 V21 H3.5Z" fill="#fff"/><path d="M6.5 9.5 V17.5 M12 9.5 V17.5 M17.5 9.5 V17.5" stroke="#fff" stroke-width="2.6"/>',
  dome: '<path d="M12 2.5 C12 5 7 7.5 7 12 H17 C17 7.5 12 5 12 2.5Z M5 12.5 H19 V21 H5Z" fill="#fff"/><path d="M10.5 21 V17 a1.5 1.5 0 0 1 3 0 V21Z" fill="var(--rg)"/>',
  arbre: '<path d="M3 9 C5 5.5 19 5.5 21 9 C18 11 6 11 3 9Z" fill="#fff"/><path d="M12 21 V10 M12 13 L8 10 M12 13 L16 10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  etoile: '<path d="M12 2.5 L14.6 9 L21.5 9.4 L16.2 13.8 L17.9 20.6 L12 16.9 L6.1 20.6 L7.8 13.8 L2.5 9.4 L9.4 9Z" fill="#fff"/>',
  raisin: '<g fill="#fff">' + [[9, 9], [15, 9], [12, 13.5], [6.5, 13], [17.5, 13], [9, 17.5], [15, 17.5], [12, 21]].map(([x, y]) => `<circle cx="${x}" cy="${y - 1}" r="2.8"/>`).join('') + '</g><path d="M12 6 C12 4 13.5 2.5 16 2.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  tulipe: '<path d="M7 4 L9.5 7 L12 3.5 L14.5 7 L17 4 V10 a5 5 0 0 1 -10 0Z" fill="#fff"/><path d="M12 15 V21.5 M12 19 C9 19 7 17 6.5 15 M12 19 C15 19 17 17 17.5 15" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  torii: '<path d="M2.5 5.5 Q12 3 21.5 5.5 L20.8 8 H3.2Z M5 10.5 H19 V12.6 H5Z" fill="#fff"/><path d="M7 7.5 V21 M17 7.5 V21" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="10" rx="2.5" fill="#fff"/><path d="M8.5 10.5 V8 a3.5 3.5 0 0 1 7 0 V10.5" stroke="#fff" stroke-width="2.4" fill="none"/><circle cx="12" cy="15" r="1.6" fill="var(--rg)"/>',
};

// ---------------- les régions ----------------
// res : [id, nom, type, sous-type, rareté, couleur]
// anchor : [lon, lat, nom du lieu de départ conseillé, tags de butin]
const REGIONS = [
  // ---- France (13)
  { id: 'ara', g: 0, name: 'Auvergne-Rhône-Alpes', short: 'Rhône-Alpes', icon: 'mont', color: '#5b8fd0', mood: 'Des volcans endormis aux sommets enneigés, avec Lyon et ses traboules au milieu.', anchor: [4.8357, 45.764, 'Lyon', ['ville']],
    res: [['soie_lyon', 'Soie de Lyon', 'm', 'tissu', 2, '#e9a0c0'], ['bleu_auvergne', 'Bleu d’Auvergne', 'n', 'fromage', 1, '#c9d4e0'], ['noix_grenoble', 'Noix de Grenoble', 'n', 'fruit', 0, '#b07a4f'], ['pierre_lave', 'Pierre de lave', 'm', 'pierre', 0, '#7a7484'], ['cristal_alpes', 'Cristal des Alpes', 'm', 'cristal', 3, '#bfe3f6']] },
  { id: 'paca', g: 0, name: 'Provence-Alpes-Côte d’Azur', short: 'Provence', icon: 'fleur', color: '#9b7fd6', mood: 'Le chant des cigales, les champs violets et la mer qui scintille.', anchor: [5.3698, 43.2965, 'Marseille', ['ville', 'mer']],
    res: [['lavande', 'Brin de lavande', 'm', 'fleur', 0, '#9b86d6'], ['huile_olive', 'Huile d’olive', 'n', 'fruit', 0, '#a8b45a'], ['savon_marseille', 'Savon de Marseille', 'm', 'pierre', 1, '#dcd0a6'], ['calisson', 'Calisson', 'n', 'sucre', 1, '#f6e3c4'], ['ocre_roussillon', 'Ocre du Roussillon', 'm', 'sable', 2, '#d9733f'], ['jasmin_grasse', 'Jasmin de Grasse', 'm', 'fleur', 3, '#fff8f0']] },
  { id: 'bretagne', g: 0, name: 'Bretagne', short: 'Bretagne', icon: 'vague', color: '#3f7fc4', mood: 'Phares, landes et embruns : ici, même la pluie a du charme.', anchor: [-3.37, 47.75, 'Lorient', ['mer', 'campagne']],
    res: [['sel_guerande', 'Sel de Guérande', 'm', 'sable', 0, '#f4f1ea'], ['beurre_sale', 'Beurre salé', 'n', 'fromage', 0, '#f6e08a'], ['granit_rose', 'Galet de granit rose', 'm', 'pierre', 1, '#e9a6a0'], ['crepe_dentelle', 'Crêpe dentelle', 'n', 'sucre', 1, '#e3b06b'], ['goemon', 'Goémon doré', 'm', 'feuille', 2, '#a8a04a'], ['perle_brume', 'Perle de brume', 'm', 'perle', 3, '#d6e4ee']] },
  { id: 'normandie', g: 0, name: 'Normandie', short: 'Normandie', icon: 'pomme', color: '#5fa86a', mood: 'Des vergers à perte de vue et des falaises de craie blanche.', anchor: [0.11, 49.49, 'Le Havre', ['mer', 'campagne']],
    res: [['pomme_cidre', 'Pomme à cidre', 'n', 'pomme', 0, '#e5584f'], ['galet_etretat', 'Galet d’Étretat', 'm', 'pierre', 0, '#dcd6c8'], ['camembert', 'Camembert', 'n', 'fromage', 1, '#f6efd8'], ['caramel_normand', 'Caramel au beurre normand', 'n', 'sucre', 1, '#d99a4f'], ['dentelle_alencon', 'Dentelle d’Alençon', 'm', 'tissu', 2, '#fffaf0'], ['vitrail_rouen', 'Vitrail de Rouen', 'm', 'verre', 3, '#6fa9d2']] },
  { id: 'grandest', g: 0, name: 'Grand Est', short: 'Grand Est', icon: 'chateau', color: '#d9604f', mood: 'Maisons à colombages, cigognes sur les toits et marchés de Noël.', anchor: [7.7521, 48.5734, 'Strasbourg', ['ville', 'campagne']],
    res: [['bretzel', 'Bretzel', 'n', 'pain', 0, '#c9843f'], ['mirabelle', 'Mirabelle de Lorraine', 'n', 'fruit', 0, '#f2c14e'], ['pain_epices', 'Pain d’épices', 'n', 'sucre', 1, '#b9783f'], ['plume_cigogne', 'Plume de cigogne', 'm', 'plume', 1, '#f4f1ea'], ['boule_verre', 'Boule de verre soufflé', 'm', 'verre', 2, '#9fd8f0'], ['etoile_noel', 'Étoile du marché de Noël', 'm', 'lumiere', 3, '#f6d36b']] },
  { id: 'idf', g: 0, name: 'Île-de-France', short: 'Paris', icon: 'tour', color: '#c9a35a', mood: 'Les quais de Seine, les toits gris et l’odeur des croissants chauds.', anchor: [2.3522, 48.8566, 'Paris', ['ville', 'monument']],
    res: [['baguette_doree', 'Baguette dorée', 'n', 'pain', 0, '#e3b06b'], ['pave_montmartre', 'Pavé de Montmartre', 'm', 'pierre', 0, '#a9a49a'], ['macaron_paris', 'Macaron de Paris', 'n', 'sucre', 1, '#f39ab0'], ['plan_paris', 'Plan de Paris ancien', 'm', 'papier', 1, '#efe2c4'], ['rivet_dame', 'Rivet de la Dame de fer', 'm', 'metal', 2, '#9a7a5a'], ['vitrail_chapelle', 'Vitrail de la Sainte-Chapelle', 'm', 'verre', 3, '#4f6fd0']] },
  { id: 'occitanie', g: 0, name: 'Occitanie', short: 'Occitanie', icon: 'soleil', color: '#e5784f', mood: 'Villes roses, cités fortifiées et sommets des Pyrénées.', anchor: [1.4442, 43.6047, 'Toulouse', ['ville', 'campagne']],
    res: [['brique_rose', 'Brique rose de Toulouse', 'm', 'pierre', 0, '#e08a6a'], ['fromage_causses', 'Fromage de brebis des Causses', 'n', 'fromage', 0, '#f3ecd6'], ['violette', 'Violette de Toulouse', 'm', 'fleur', 1, '#8a5fc8'], ['laine_pyrenees', 'Laine des Pyrénées', 'm', 'laine', 1, '#f4f0e6'], ['croix_occitane', 'Croix occitane dorée', 'm', 'medaille', 2, '#e3b94a'], ['eclat_carcassonne', 'Éclat de Carcassonne', 'm', 'eclat', 3, '#c9b48a']] },
  { id: 'naquitaine', g: 0, name: 'Nouvelle-Aquitaine', short: 'Aquitaine', icon: 'raisin', color: '#9a5f9a', mood: 'Grandes dunes, forêts de pins et vagues de l’Atlantique.', anchor: [-0.5792, 44.8378, 'Bordeaux', ['ville', 'mer']],
    res: [['huitre', 'Huître du bassin', 'n', 'mer', 0, '#c9cdd2'], ['sable_dune', 'Sable de la grande dune', 'm', 'sable', 0, '#f2cf9a'], ['pin_landes', 'Pomme de pin des Landes', 'm', 'graine', 0, '#a9784f'], ['canele', 'Canelé', 'n', 'sucre', 1, '#a9582f'], ['piment_espelette', 'Piment d’Espelette', 'n', 'legume', 1, '#d9403f'], ['perle_arcachon', 'Perle d’Arcachon', 'm', 'perle', 3, '#f3eef6']] },
  { id: 'hdf', g: 0, name: 'Hauts-de-France', short: 'Hauts-de-France', icon: 'chateau', color: '#e3a03a', mood: 'Beffrois, plages immenses et géants de carnaval.', anchor: [3.0573, 50.6292, 'Lille', ['ville']],
    res: [['gaufre_fourree', 'Gaufre fourrée', 'n', 'sucre', 0, '#e9b86b'], ['chicoree', 'Chicorée', 'n', 'boisson', 0, '#8a5a3a'], ['galet_opale', 'Galet de la Côte d’Opale', 'm', 'pierre', 0, '#b8c4c8'], ['maroilles', 'Maroilles', 'n', 'fromage', 1, '#e9a24f'], ['dentelle_calais', 'Dentelle de Calais', 'm', 'tissu', 2, '#f6f0ff'], ['masque_carnaval', 'Masque de carnaval', 'm', 'masque', 3, '#e07a9a']] },
  { id: 'bfc', g: 0, name: 'Bourgogne-Franche-Comté', short: 'Bourgogne', icon: 'raisin', color: '#a0405f', mood: 'Toits vernissés, forêts du Jura et horlogers patients.', anchor: [5.0415, 47.322, 'Dijon', ['ville', 'campagne']],
    res: [['cassis', 'Cassis de Bourgogne', 'n', 'fruit', 0, '#5a2f6a'], ['escargot', 'Coquille d’escargot', 'm', 'coquillage', 0, '#c9a07a'], ['moutarde', 'Moutarde de Dijon', 'n', 'legume', 1, '#e3c14a'], ['comte', 'Comté affiné', 'n', 'fromage', 1, '#f2d06b'], ['horloge_jura', 'Rouage d’horloger du Jura', 'm', 'metal', 2, '#c9a35a'], ['tuile_vernissee', 'Tuile vernissée', 'm', 'pierre', 3, '#e9b04b']] },
  { id: 'pdl', g: 0, name: 'Pays de la Loire', short: 'Pays de la Loire', icon: 'vague', color: '#2fa592', mood: 'Marais salants, îles sablonneuses et éléphants mécaniques.', anchor: [-1.5536, 47.2184, 'Nantes', ['ville', 'mer']],
    res: [['berlingot', 'Berlingot nantais', 'n', 'sucre', 0, '#f39ab0'], ['ardoise', 'Ardoise d’Angers', 'm', 'pierre', 0, '#5c6b78'], ['muguet', 'Brin de muguet', 'm', 'fleur', 1, '#f4f8f0'], ['rillettes', 'Rillettes du Mans', 'n', 'plat', 1, '#d9a36b'], ['rouage_elephant', 'Rouage d’éléphant mécanique', 'm', 'metal', 3, '#8a7a5a']] },
  { id: 'cvl', g: 0, name: 'Centre-Val de Loire', short: 'Val de Loire', icon: 'chateau', color: '#4f97c4', mood: 'Châteaux de conte de fées le long du fleuve royal.', anchor: [0.6848, 47.3941, 'Tours', ['ville', 'monument']],
    res: [['tuffeau', 'Pierre de tuffeau', 'm', 'pierre', 0, '#f2ead6'], ['chevre_cendre', 'Chèvre cendré', 'n', 'fromage', 0, '#e9e6de'], ['tatin', 'Tarte Tatin', 'n', 'pomme', 1, '#c97a3a'], ['rose_chateau', 'Rose de château', 'm', 'fleur', 1, '#e5687f'], ['cle_chateau', 'Clé de château', 'm', 'metal', 2, '#b08a3a'], ['tapisserie', 'Tapisserie royale', 'm', 'tissu', 3, '#7a4fa0']] },
  { id: 'corse', g: 0, name: 'Corse', short: 'Corse', icon: 'mont', color: '#4f9f5f', mood: 'L’île de beauté : montagnes dans la mer et parfum de maquis.', anchor: [9.1559, 41.3875, 'Bonifacio', ['ile', 'mer']],
    res: [['chataigne_corse', 'Châtaigne corse', 'n', 'fruit', 0, '#9a5f3a'], ['maquis', 'Brin de maquis', 'm', 'feuille', 0, '#6f8f4f'], ['clementine_corse', 'Clémentine de Corse', 'n', 'agrume', 0, '#f2963b'], ['miel_maquis', 'Miel du maquis', 'n', 'sucre', 1, '#e9a83a'], ['oeil_lucie', 'Œil de sainte Lucie', 'm', 'coquillage', 2, '#f2c4a0'], ['corail_rouge', 'Corail rouge', 'm', 'corail', 3, '#e5484f']] },
  // ---- Europe
  { id: 'suisse', g: 1, name: 'Suisse', short: 'Suisse', icon: 'mont', color: '#e5584f', mood: 'Lacs miroirs, chalets fleuris et cloches dans les alpages.', anchor: [6.1432, 46.2044, 'Genève', ['lac', 'ville']],
    res: [['chocolat_suisse', 'Chocolat des alpages', 'n', 'sucre', 0, '#7a4a2f'], ['gruyere', 'Gruyère', 'n', 'fromage', 0, '#f2d06b'], ['cloche_doree', 'Cloche de vache dorée', 'm', 'metal', 1, '#e3b94a'], ['engrenage_horloger', 'Engrenage d’horloger', 'm', 'metal', 2, '#b5bcc2'], ['cristal_gothard', 'Cristal du Gothard', 'm', 'cristal', 3, '#d6ecfa']] },
  { id: 'benelux', g: 1, name: 'Belgique & Pays-Bas', short: 'Benelux', icon: 'tulipe', color: '#f2963b', mood: 'Canaux, moulins, tulipes et gaufres croustillantes.', anchor: [4.9041, 52.3676, 'Amsterdam', ['ville', 'lac']],
    res: [['bulbe_tulipe', 'Bulbe de tulipe', 'm', 'graine', 0, '#c97a5a'], ['gaufre_liege', 'Gaufre de Liège', 'n', 'sucre', 0, '#e3b06b'], ['fromage_croute', 'Fromage à croûte rouge', 'n', 'fromage', 0, '#e5584f'], ['praline_belge', 'Praline belge', 'n', 'sucre', 1, '#6a3f2a'], ['sabot', 'Sabot en bois', 'm', 'bois', 1, '#f2c14e'], ['faience_bleue', 'Carreau de faïence bleue', 'm', 'verre', 2, '#3f6fc4'], ['diamant_anvers', 'Diamant d’Anvers', 'm', 'cristal', 4, '#eaf6ff']] },
  { id: 'allemagne', g: 1, name: 'Allemagne & Autriche', short: 'Allemagne', icon: 'chateau', color: '#c99a4f', mood: 'Forêts profondes, châteaux perchés et valses de Vienne.', anchor: [13.405, 52.52, 'Berlin', ['ville', 'foret']],
    res: [['strudel', 'Strudel aux pommes', 'n', 'pomme', 0, '#d9a35f'], ['saucisse', 'Saucisse grillée', 'n', 'plat', 0, '#c9603f'], ['partition_vienne', 'Partition de Vienne', 'm', 'papier', 1, '#f2ead6'], ['casse_noisette', 'Casse-noisette en bois', 'm', 'bois', 1, '#c94a4a'], ['coucou', 'Coucou de la Forêt-Noire', 'm', 'bois', 2, '#7a5a3a'], ['etoile_nuremberg', 'Étoile de Nuremberg', 'm', 'lumiere', 3, '#f6e08a']] },
  { id: 'italie', g: 1, name: 'Italie', short: 'Italie', icon: 'colonne', color: '#4f9f78', mood: 'Ruelles ensoleillées, gondoles et glaces à chaque coin de rue.', anchor: [12.4964, 41.9028, 'Rome', ['ville', 'monument']],
    res: [['basilic', 'Basilic de Gênes', 'm', 'feuille', 0, '#4f9f4f'], ['citron_amalfi', 'Citron d’Amalfi', 'n', 'agrume', 0, '#f2d43b'], ['parmesan', 'Meule de parmesan', 'n', 'fromage', 1, '#f2dc8a'], ['gelato', 'Gelato à la pistache', 'n', 'glace', 1, '#a9d48a'], ['verre_murano', 'Verre de Murano', 'm', 'verre', 2, '#e97ab0'], ['masque_venise', 'Masque de Venise', 'm', 'masque', 3, '#d9b44a']] },
  { id: 'iberie', g: 1, name: 'Espagne & Portugal', short: 'Ibérie', icon: 'soleil', color: '#e9b93a', mood: 'Azulejos, flamenco et orangers sous un soleil généreux.', anchor: [2.1734, 41.3851, 'Barcelone', ['ville', 'mer']],
    res: [['orange_valence', 'Orange de Valence', 'n', 'agrume', 0, '#f2963b'], ['churros', 'Churros', 'n', 'sucre', 0, '#d9a35f'], ['liege', 'Écorce de liège', 'm', 'bois', 0, '#c99a6a'], ['azulejo', 'Azulejo', 'm', 'verre', 1, '#4f88cf'], ['eventail_andalou', 'Éventail andalou', 'm', 'eventail', 2, '#e3605f'], ['safran', 'Safran de la Mancha', 'm', 'fleur', 3, '#e9603a']] },
  { id: 'britanniques', g: 1, name: 'Îles Britanniques', short: 'Britannia', icon: 'chateau', color: '#5f87c9', mood: 'Collines vertes, brume des Highlands et thé à cinq heures.', anchor: [-0.1276, 51.5072, 'Londres', ['ville', 'monument']],
    res: [['scone', 'Scone', 'n', 'pain', 0, '#e3b06b'], ['the_cinq_heures', 'Thé de cinq heures', 'n', 'boisson', 0, '#b9783f'], ['tartan', 'Tartan écossais', 'm', 'tissu', 1, '#c94a4a'], ['trefle_irlande', 'Trèfle d’Irlande', 'm', 'feuille', 1, '#4fbf5f'], ['pierre_levee', 'Éclat de pierre levée', 'm', 'pierre', 2, '#9aa0a8'], ['brume_highlands', 'Brume des Highlands', 'm', 'lumiere', 3, '#c9d8e8']] },
  { id: 'scandinavie', g: 1, name: 'Scandinavie & Islande', short: 'Scandinavie', icon: 'etoile', color: '#5fb0d0', mood: 'Fjords vertigineux, maisons rouges et aurores dansantes.', anchor: [10.7522, 59.9139, 'Oslo', ['mer', 'foret']],
    res: [['brioche_cannelle', 'Brioche à la cannelle', 'n', 'pain', 0, '#d9a35f'], ['saumon', 'Saumon fumé', 'n', 'mer', 0, '#f08a6a'], ['galet_fjord', 'Galet de fjord', 'm', 'pierre', 0, '#7a8a98'], ['laine_feroe', 'Laine des Féroé', 'm', 'laine', 1, '#e9e2d0'], ['cheval_bois', 'Petit cheval en bois peint', 'm', 'bois', 1, '#d9403f'], ['aurore', 'Lumière d’aurore boréale', 'm', 'lumiere', 4, '#7fe0b0']] },
  { id: 'europe_est', g: 1, name: 'Europe de l’Est', short: 'Europe de l’Est', icon: 'dome', color: '#c94a6a', mood: 'Bulbes dorés, forêts de bouleaux et contes au coin du feu.', anchor: [14.4378, 50.0755, 'Prague', ['ville', 'monument']],
    res: [['pierogi', 'Pierogi', 'n', 'plat', 0, '#f2dcb0'], ['paprika', 'Paprika de Hongrie', 'n', 'legume', 0, '#d9403f'], ['miel_tilleul', 'Miel de tilleul', 'n', 'sucre', 0, '#f2c14e'], ['poupee_gigogne', 'Poupée gigogne', 'm', 'bois', 1, '#e5584f'], ['cristal_boheme', 'Cristal de Bohême', 'm', 'cristal', 2, '#d6ecfa'], ['ambre_baltique', 'Ambre de la Baltique', 'm', 'eclat', 3, '#f2a03a']] },
  { id: 'mediterranee', g: 1, name: 'Grèce & Méditerranée', short: 'Méditerranée', icon: 'colonne', color: '#3e8fd0', mood: 'Maisons blanches, volets bleus et temples au bord de l’eau.', anchor: [25.4615, 36.3932, 'Santorin', ['ile', 'mer']],
    res: [['olive_kalamata', 'Olive de Kalamata', 'n', 'fruit', 0, '#5a3f5a'], ['feta', 'Feta', 'n', 'fromage', 0, '#f8f6ee'], ['loukoum', 'Loukoum à la rose', 'n', 'sucre', 1, '#f6a6b8'], ['eponge', 'Éponge de mer', 'm', 'corail', 1, '#e9c47a'], ['amphore', 'Tesson d’amphore', 'm', 'pierre', 2, '#d9805a'], ['oeil_bleu', 'Œil bleu porte-bonheur', 'm', 'verre', 3, '#2f6fd0']] },
  // ---- Afrique & Moyen-Orient
  { id: 'afrique_nord', g: 2, name: 'Afrique du Nord', short: 'Maghreb & Égypte', icon: 'cactus', color: '#d99a4c', mood: 'Souks parfumés, dunes dorées et pyramides millénaires.', anchor: [-7.9811, 31.6295, 'Marrakech', ['ville', 'desert']],
    res: [['datte_souk', 'Datte du souk', 'n', 'sucre', 0, '#8a5a3a'], ['menthe_souk', 'Menthe fraîche du souk', 'm', 'feuille', 0, '#5fbf6f'], ['huile_argan', 'Huile d’argan', 'n', 'fruit', 1, '#e3b14a'], ['babouche', 'Babouche brodée', 'm', 'tissu', 1, '#f2c14e'], ['papyrus', 'Papyrus du Nil', 'm', 'papier', 2, '#e9d6a0'], ['scarabee_or', 'Scarabée d’or', 'm', 'scarabee', 3, '#e9b93a']] },
  { id: 'afrique_ouest', g: 2, name: 'Afrique de l’Ouest', short: 'Afrique de l’Ouest', icon: 'arbre', color: '#e0903a', mood: 'Marchés colorés, baobabs géants et musique jusqu’au soir.', anchor: [-17.4677, 14.7167, 'Dakar', ['ville', 'mer']],
    res: [['mangue_casamance', 'Mangue de Casamance', 'n', 'fruit', 0, '#f2a93b'], ['feve_cacao', 'Fève de cacao', 'm', 'graine', 0, '#7a4a2f'], ['bissap', 'Jus de bissap', 'n', 'boisson', 0, '#a0204f'], ['tissu_wax', 'Tissu wax', 'm', 'tissu', 1, '#e9603a'], ['perle_verre', 'Perle de verre recyclé', 'm', 'perle', 2, '#4fb0d0'], ['masque_sculpte', 'Masque sculpté', 'm', 'masque', 3, '#8a5a3a']] },
  { id: 'afrique_est', g: 2, name: 'Afrique des savanes', short: 'Savanes', icon: 'arbre', color: '#c9a03a', mood: 'Girafes au coucher du soleil et hauts plateaux couverts de café.', anchor: [36.8219, -1.2921, 'Nairobi', ['campagne', 'desert']],
    res: [['cafe_plateaux', 'Café des hauts plateaux', 'n', 'boisson', 0, '#6a3f2a'], ['perle_masai', 'Perle masaï', 'm', 'perle', 1, '#e5484f'], ['plume_calao', 'Plume de calao', 'm', 'plume', 1, '#3a3a4a'], ['ebene', 'Bois d’ébène', 'm', 'bois', 2, '#3a2a2a'], ['tanzanite', 'Tanzanite', 'm', 'cristal', 4, '#6f5fd0']] },
  { id: 'afrique_sud', g: 2, name: 'Afrique australe', short: 'Afrique australe', icon: 'soleil', color: '#e0784a', mood: 'Le cap des tempêtes, les dunes rouges et les fleurs géantes.', anchor: [18.4241, -33.9249, 'Le Cap', ['mer', 'montagne']],
    res: [['rooibos', 'Rooibos', 'n', 'boisson', 0, '#c9603f'], ['sable_namib', 'Sable rouge du Namib', 'm', 'sable', 0, '#e0784a'], ['protea', 'Fleur de protéa', 'm', 'fleur', 1, '#f08aa6'], ['oeuf_autruche', 'Coquille d’œuf d’autruche', 'm', 'coquillage', 1, '#f6efe0'], ['diamant_cap', 'Diamant du Cap', 'm', 'cristal', 4, '#f0f8ff']] },
  { id: 'ocean_indien', g: 2, name: 'Océan Indien', short: 'Océan Indien', icon: 'palmier', color: '#2fb5a2', mood: 'Lagons turquoise, vanille et volcans endormis sous les tropiques.', anchor: [55.4504, -20.8789, 'La Réunion', ['ile', 'montagne']],
    res: [['litchi', 'Litchi', 'n', 'fruit', 0, '#e5687f'], ['cauri', 'Coquillage cauri', 'm', 'coquillage', 0, '#f6e6d0'], ['sable_noir', 'Sable noir volcanique', 'm', 'sable', 0, '#4a4a52'], ['vanille', 'Gousse de vanille', 'n', 'sucre', 1, '#5a3f2a'], ['ylang', 'Fleur d’ylang-ylang', 'm', 'fleur', 1, '#f2e06b'], ['coco_mer', 'Coco de mer', 'm', 'graine', 3, '#6a4a2f']] },
  { id: 'moyen_orient', g: 2, name: 'Moyen-Orient', short: 'Moyen-Orient', icon: 'dome', color: '#c9604f', mood: 'Coupoles turquoise, épices et contes des mille et une nuits.', anchor: [55.2708, 25.2048, 'Dubaï', ['ville', 'desert']],
    res: [['pistache_iran', 'Pistaches d’Iran', 'n', 'fruit', 0, '#a9c46a'], ['halva', 'Halva', 'n', 'sucre', 0, '#e9d6b0'], ['eau_rose', 'Eau de rose', 'm', 'fleur', 1, '#f6a6b8'], ['encens', 'Larme d’encens', 'm', 'eclat', 1, '#e9d08a'], ['fil_persan', 'Fil de tapis persan', 'm', 'tissu', 2, '#b9304f'], ['perle_golfe', 'Perle du Golfe', 'm', 'perle', 3, '#f6f0e6']] },
  // ---- Asie & Océanie
  { id: 'asie_centrale', g: 3, name: 'Route de la soie', short: 'Route de la soie', icon: 'dome', color: '#3fa0b0', mood: 'Caravanes, yourtes dans les steppes et dômes bleus de Samarcande.', anchor: [66.9597, 39.6542, 'Samarcande', ['ville', 'desert']],
    res: [['abricot_sec', 'Abricot sec', 'n', 'fruit', 0, '#f2a03a'], ['pain_bazar', 'Pain rond du bazar', 'n', 'pain', 0, '#d9a35f'], ['feutre_yourte', 'Feutre de yourte', 'm', 'laine', 0, '#d9c8a6'], ['ceramique_bleue', 'Céramique bleue', 'm', 'verre', 2, '#2f8fc4'], ['plume_aigle', 'Plume d’aigle royal', 'm', 'plume', 2, '#7a5a3a'], ['lapis', 'Lapis-lazuli', 'm', 'cristal', 3, '#2f4fb0']] },
  { id: 'inde', g: 3, name: 'Inde & Himalaya', short: 'Inde', icon: 'dome', color: '#f2963b', mood: 'Mille couleurs, mille épices, et les plus hautes montagnes du monde.', anchor: [78.0421, 27.1751, 'Agra', ['ville', 'monument']],
    res: [['the_darjeeling', 'Thé de Darjeeling', 'n', 'boisson', 0, '#c97a3a'], ['cardamome', 'Cardamome', 'n', 'legume', 0, '#8fbf6a'], ['mangue_inde', 'Mangue dorée', 'n', 'fruit', 1, '#f2b03b'], ['lotus', 'Fleur de lotus', 'm', 'fleur', 1, '#f6a6c8'], ['soie_benares', 'Soie de Bénarès', 'm', 'tissu', 2, '#d9304f'], ['saphir', 'Saphir du Cachemire', 'm', 'cristal', 4, '#2f5fd0']] },
  { id: 'chine', g: 3, name: 'Chine', short: 'Chine', icon: 'pagode', color: '#d9403f', mood: 'Montagnes dans la brume, lanternes rouges et forêts de bambous.', anchor: [116.4074, 39.9042, 'Pékin', ['ville', 'monument']],
    res: [['the_jasmin', 'Thé au jasmin', 'n', 'boisson', 0, '#c9d48a'], ['brioche_vapeur', 'Brioche vapeur', 'n', 'pain', 0, '#f8f2e6'], ['bambou', 'Pousse de bambou', 'm', 'bois', 0, '#8fbf5f'], ['lanterne_rouge', 'Papier de lanterne rouge', 'm', 'papier', 1, '#e5484f'], ['porcelaine', 'Porcelaine bleue et blanche', 'm', 'verre', 2, '#3f6fc4'], ['jade', 'Pierre de jade', 'm', 'cristal', 3, '#5fbf8a']] },
  { id: 'japon', g: 3, name: 'Japon', short: 'Japon', icon: 'torii', color: '#f08aa6', mood: 'Cerisiers en fleurs, temples paisibles et néons de Tokyo.', anchor: [135.7681, 35.0116, 'Kyoto', ['ville', 'monument']],
    res: [['cerisier', 'Fleur de cerisier', 'm', 'fleur', 0, '#f6c2cf'], ['mochi_doux', 'Mochi', 'n', 'sucre', 0, '#f8e6ee'], ['matcha', 'Thé matcha', 'n', 'boisson', 1, '#7fae4f'], ['washi', 'Papier washi', 'm', 'papier', 1, '#f6efe0'], ['eventail_papier', 'Éventail de papier', 'm', 'eventail', 2, '#e5687f'], ['akoya', 'Perle d’Akoya', 'm', 'perle', 3, '#f8f0f4']] },
  { id: 'coree', g: 3, name: 'Corée', short: 'Corée', icon: 'pagode', color: '#5c7bc4', mood: 'Palais aux toits courbes, montagnes d’automne et marchés de nuit.', anchor: [126.978, 37.5665, 'Séoul', ['ville', 'montagne']],
    res: [['kimchi', 'Kimchi', 'n', 'legume', 0, '#e5584f'], ['gateau_riz', 'Gâteau de riz', 'n', 'sucre', 0, '#f6e6f0'], ['hanji', 'Papier hanji', 'm', 'papier', 1, '#f2ead6'], ['ginseng', 'Racine de ginseng', 'n', 'legume', 2, '#e3c48a'], ['celadon', 'Céladon vert', 'm', 'verre', 3, '#9fd0b0']] },
  { id: 'asie_sud_est', g: 3, name: 'Asie du Sud-Est', short: 'Asie du Sud-Est', icon: 'palmier', color: '#4fae5f', mood: 'Rizières en terrasses, temples dorés et marchés flottants.', anchor: [115.1889, -8.4095, 'Bali', ['ile', 'foret']],
    res: [['riz_parfume', 'Riz parfumé', 'n', 'plat', 0, '#f8f6ee'], ['fruit_dragon', 'Fruit du dragon', 'n', 'fruit', 0, '#e94f8a'], ['orchidee', 'Fleur d’orchidée', 'm', 'fleur', 1, '#c97ad9'], ['batik', 'Tissu batik', 'm', 'tissu', 1, '#3f6fa0'], ['lanterne_soie', 'Lanterne de soie', 'm', 'papier', 2, '#f2c14e'], ['perle_sud', 'Perle des mers du Sud', 'm', 'perle', 4, '#f6e6c0']] },
  { id: 'australie', g: 3, name: 'Australie', short: 'Australie', icon: 'soleil', color: '#e5784f', mood: 'Le grand désert rouge, les koalas et la plus longue barrière de corail.', anchor: [151.2093, -33.8688, 'Sydney', ['ville', 'mer']],
    res: [['eucalyptus', 'Feuille d’eucalyptus', 'm', 'feuille', 0, '#8fb0a0'], ['macadamia', 'Noix de macadamia', 'n', 'fruit', 0, '#e9d0a0'], ['boomerang', 'Boomerang peint', 'm', 'bois', 1, '#c97a3a'], ['ocre_rouge', 'Ocre du désert rouge', 'm', 'sable', 1, '#c9503f'], ['coquillage_recif', 'Coquillage du récif', 'm', 'coquillage', 2, '#f6b8a0'], ['opale', 'Opale', 'm', 'cristal', 3, '#a0e0e8']] },
  { id: 'pacifique', g: 3, name: 'Îles du Pacifique', short: 'Pacifique', icon: 'palmier', color: '#2fb0c8', mood: 'Atolls, colliers de fleurs et fougères géantes du bout du monde.', anchor: [174.7633, -36.8485, 'Auckland', ['ile', 'mer']],
    res: [['tiare', 'Fleur de tiaré', 'm', 'fleur', 0, '#fff8f0'], ['fruit_pain', 'Fruit de l’arbre à pain', 'n', 'fruit', 0, '#a9c46a'], ['fougere', 'Fougère argentée', 'm', 'feuille', 1, '#c9d8d0'], ['kiwi_dore', 'Kiwi doré', 'n', 'fruit', 1, '#d9c43a'], ['pounamu', 'Pierre verte pounamu', 'm', 'cristal', 3, '#3f9f6f'], ['perle_noire', 'Perle noire de Tahiti', 'm', 'perle', 4, '#3a3f4f']] },
  // ---- Amériques, pôles et océans
  { id: 'canada', g: 4, name: 'Canada', short: 'Canada', icon: 'feuille', color: '#d9404f', mood: 'Forêts infinies, lacs sauvages et érables rouges en automne.', anchor: [-73.5673, 45.5017, 'Montréal', ['ville', 'foret']],
    res: [['sirop_erable', 'Sirop d’érable', 'n', 'sucre', 0, '#c9782f'], ['bleuets', 'Bleuets sauvages', 'n', 'fruit', 0, '#4f5fb0'], ['erable_rouge', 'Feuille d’érable rouge', 'm', 'feuille', 0, '#d9404f'], ['flanelle', 'Flanelle à carreaux', 'm', 'tissu', 1, '#c94a4a'], ['plume_huard', 'Plume de huard', 'm', 'plume', 2, '#2f3a4a'], ['ammolite', 'Ammolite', 'm', 'cristal', 3, '#e9a03a']] },
  { id: 'usa_est', g: 4, name: 'Amérique du Nord : Est', short: 'Côte Est', icon: 'tour', color: '#4f6fb8', mood: 'Gratte-ciel, forêts dorées en automne et phares du Maine.', anchor: [-74.006, 40.7128, 'New York', ['ville']],
    res: [['bagel', 'Bagel', 'n', 'pain', 0, '#d9a35f'], ['tarte_citrouille', 'Tarte à la citrouille', 'n', 'plat', 0, '#e9903a'], ['ticket_jazz', 'Ticket de concert de jazz', 'm', 'papier', 1, '#f2d48f'], ['patchwork', 'Couverture en patchwork', 'm', 'tissu', 1, '#e9a0a0'], ['homard', 'Homard du Maine', 'n', 'mer', 2, '#e5484f'], ['feuille_vermont', 'Feuille dorée du Vermont', 'm', 'feuille', 3, '#f2b03b']] },
  { id: 'usa_ouest', g: 4, name: 'Amérique du Nord : Ouest', short: 'Grand Ouest', icon: 'cactus', color: '#d9824f', mood: 'Canyons rouges, séquoias géants et routes à perte de vue.', anchor: [-112.1401, 36.0544, 'Grand Canyon', ['desert', 'montagne']],
    res: [['avocat', 'Avocat de Californie', 'n', 'fruit', 0, '#6f9f3f'], ['piment_vert', 'Piment vert grillé', 'n', 'legume', 0, '#5f9f3f'], ['pomme_sequoia', 'Pomme de pin de séquoia', 'm', 'graine', 1, '#8a5a3a'], ['plume_faucon', 'Plume de faucon', 'm', 'plume', 1, '#b0804f'], ['turquoise', 'Turquoise', 'm', 'cristal', 2, '#3fbfb0'], ['pepite', 'Pépite d’or', 'm', 'metal', 3, '#f2c14e']] },
  { id: 'mexique_caraibes', g: 4, name: 'Mexique & Caraïbes', short: 'Mexique & Caraïbes', icon: 'cactus', color: '#e94f7a', mood: 'Pyramides dans la jungle, fêtes colorées et plages de sable blanc.', anchor: [-99.1332, 19.4326, 'Mexico', ['ville', 'monument']],
    res: [['ananas_antilles', 'Ananas des Antilles', 'n', 'fruit', 0, '#e9c43a'], ['piment_jalapeno', 'Piment jalapeño', 'n', 'legume', 0, '#4f9f3f'], ['chocolat_azteque', 'Chocolat épicé', 'n', 'sucre', 1, '#6a3a2a'], ['papel_picado', 'Papel picado', 'm', 'papier', 1, '#f08aa6'], ['conque', 'Conque rose', 'm', 'coquillage', 2, '#f6a6a0'], ['obsidienne', 'Obsidienne', 'm', 'cristal', 3, '#2a2a3a']] },
  { id: 'amerique_sud', g: 4, name: 'Amérique du Sud', short: 'Amérique du Sud', icon: 'mont', color: '#4fa27a', mood: 'L’Amazonie, les Andes et les lamas qui regardent passer les nuages.', anchor: [-43.1729, -22.9068, 'Rio de Janeiro', ['ville', 'mer']],
    res: [['quinoa', 'Grain de quinoa', 'm', 'graine', 0, '#e9d6a0'], ['cafe_colombie', 'Café de Colombie', 'n', 'boisson', 0, '#6a3f2a'], ['fruit_passion', 'Fruit de la passion', 'n', 'fruit', 0, '#7a3f8a'], ['alpaga', 'Laine d’alpaga', 'm', 'laine', 1, '#f2e6d0'], ['plume_toucan', 'Plume de toucan', 'm', 'plume', 2, '#f2963b'], ['emeraude', 'Émeraude', 'm', 'cristal', 4, '#2fbf6f']] },
  { id: 'arctique', g: 4, name: 'Pôles & banquise', short: 'Pôles', icon: 'flocon', color: '#7fb0d8', mood: 'Le silence blanc, les ours polaires et la nuit qui dure des mois.', anchor: [25.7294, 66.5039, 'Rovaniemi', ['neige', 'foret']],
    res: [['neige_polaire', 'Neige polaire', 'm', 'flocon', 0, '#f4f8fc'], ['lichen', 'Lichen des rennes', 'm', 'mousse', 0, '#c9d4a0'], ['plume_harfang', 'Plume de harfang', 'm', 'plume', 1, '#fbfbf6'], ['eclat_iceberg', 'Éclat d’iceberg', 'm', 'cristal', 2, '#9fd8f0'], ['aurore_bouteille', 'Aurore en bouteille', 'm', 'lumiere', 4, '#8fe0c0']] },
  { id: 'grand_large', g: 4, name: 'Grand large', short: 'Grand large', icon: 'vague', color: '#2f6fa8', mood: 'Rien que l’océan à l’horizon, des baleines et des secrets au fond de l’eau.', anchor: [-30, 38, 'En plein océan', ['mer']],
    res: [['corde_marin', 'Corde de marin', 'm', 'tissu', 0, '#d9c48a'], ['ecume', 'Écume de mer', 'm', 'coquillage', 0, '#e9f4f8'], ['bouteille_mer', 'Bouteille à la mer', 'm', 'verre', 1, '#8fd0c0'], ['algue_lumineuse', 'Algue phosphorescente', 'm', 'lumiere', 2, '#5fe0c0'], ['perle_abysses', 'Perle des abysses', 'm', 'perle', 3, '#3f5fa0']] },
];
const RG_GROUPS = ['France', 'Europe', 'Afrique & Moyen-Orient', 'Asie & Océanie', 'Amériques, pôles & océans'];
const RG = {}; REGIONS.forEach(R => { RG[R.id] = R; R.res = R.res.map(([id, name, cat, sub, rar, color]) => ({ id, name, cat, sub, rar, color, region: R.id })); });
const RG_RES = {}; REGIONS.forEach(R => R.res.forEach(x => { RG_RES[x.id] = x; }));
const rgDef = x => [x.name, x.cat, x.sub, x.rar, null, x.color];
// « de » + nom de région, avec le bon article (du Japon, de l’océan Indien, des Pôles, d’Italie…)
const RG_DE = { grandest: 'du ', benelux: 'du ', afrique_nord: 'du ', moyen_orient: 'du ', japon: 'du ', canada: 'du ', pacifique: 'du ', usa_ouest: 'du ', mexique_caraibes: 'du ', grand_large: 'du ', cvl: 'du ', ocean_indien: 'de l’', mediterranee: 'de la ', usa_est: 'de la ', asie_centrale: 'de la ', pdl: 'des ', hdf: 'des ', afrique_est: 'des ', arctique: 'des ' };
const rgDe = R => R ? (RG_DE[R.id] || (/^[AEIOUÉÎaeiouéî]/.test(R.short) ? 'd’' : 'de ')) + (R.id === 'ocean_indien' ? 'océan Indien' : R.short) : '';
const rgIcon = (R, cls = '', locked = false) => `<i class="rgb ${cls}${locked ? ' lk' : ''}" style="--rg:${locked ? '#b9ad9a' : R.color}" aria-hidden="true"><svg viewBox="0 0 24 24">${RG_GLYPH[locked ? 'lock' : R.icon] || RG_GLYPH.etoile}</svg></i>`;

// ---------------- regionAt(lon, lat) ----------------
// Les données GEO n'ont pas les régions administratives sous forme de surfaces (GEO.a = traits de frontières seulement) :
// on trouve le pays (point dans le polygone), puis, en France métropolitaine, la région par le chef-lieu le plus proche
// (environ 200 villes repères, ce qui suit bien les vraies frontières). À défaut : pays voisins, puis grandes zones.
const RG_FR_PTS = {
  ara: '4.84,45.76 5.72,45.19 3.08,45.78 4.39,45.43 6.13,45.9 5.92,45.57 4.89,44.93 2.44,44.93 3.88,45.04 3.33,46.57 5.23,46.2 4.6,44.73 2.6,46.34 3.42,46.13 4.07,46.04 6.48,46.37 4.75,44.56 5.65,46.26 6.06,46.33 3.09,45.03 3.74,45.55 3.55,45.86 4.67,45.24 5.27,45.59 6.39,45.68 6.66,45.2 5.69,45.76 2.33,45.22 4.12,45.14 4.72,45.99 4.7,44.38 5.14,44.36 5.37,44.75 6.87,45.92 2.83,45.6 3.9,46.3 4.23,45.27',
  paca: '5.37,43.3 7.26,43.7 5.93,43.12 4.81,43.95 6.08,44.56 6.24,44.09 5.45,43.53 6.46,43.54 4.63,43.68 6.65,44.39 6.64,44.9 4.81,44.14 5.94,44.2 5.4,43.88 5.79,43.83 5.05,44.05 5.07,44.24 6.64,43.27 6.74,43.43 6.51,43.85 6.89,43.95 7.5,43.78 4.45,43.45',
  occitanie: '1.44,43.6 3.88,43.61 4.36,43.84 2.9,42.7 2.35,43.21 2.15,43.93 2.57,44.35 1.44,44.45 1.35,44.02 0.59,43.65 0.08,43.23 1.6,42.96 3.5,44.52 4.08,44.12 3.22,43.34 2.03,44.61 0.72,43.11 4.42,44.01 4.65,44.26 1.98,42.45 0.41,42.85 1.25,44.86 3.86,44.85 0.24,43.97 -0.05,43.1',
  naquitaine: '-0.58,44.84 1.26,45.83 0.34,46.58 -1.15,46.16 -0.37,43.3 -1.47,43.49 -0.5,43.89 0.62,44.2 0.72,45.18 0.16,45.65 -0.46,46.32 1.87,46.17 1.77,45.27 1.53,45.16 0.48,44.85 -1.17,44.66 -0.49,46.84 2.31,45.55 0.55,46.82 -1.03,45.62 -1.08,45 -1.23,44.2 0.93,46.43 -0.88,42.95 1.27,44.75 -0.13,44.4',
  bretagne: '-1.68,48.11 -4.49,48.39 -4.1,48 -2.76,47.66 -2.76,48.51 -3.37,47.75 -2,48.65 -3.83,48.58 -1.2,48.35 -2.08,47.65 -2.96,48.07 -1.2,48.12 -3.46,48.73 -2.05,48.45 -1.48,47.9 -3.03,47.58',
  normandie: '1.1,49.44 -0.37,49.18 0.11,49.49 -1.62,49.64 1.15,49.02 0.09,48.43 -1.09,49.12 1.08,49.92 0.23,49.15 -1.36,48.68 -0.02,48.74 1.48,49.09 1.78,49.28 0.63,48.76 0.55,48.52 1.42,50.05 -1.6,48.84 -0.57,48.57 1.35,48.85',
  hdf: '3.06,50.63 2.3,49.89 2.78,50.29 2.08,49.43 3.62,49.56 1.86,50.95 2.38,51.03 1.61,50.73 3.29,49.85 2.83,49.42 1.83,50.1 3.32,49.38 2.59,49.21 3.97,50.28 4.08,49.92 3.4,49.05 1.72,49.7 2.47,50.53 3.52,50.36',
  idf: '2.35,48.86 2.13,48.8 2.66,48.54 2.06,49.04 2.44,48.63 2.88,48.96 1.83,48.64 3.3,48.56 2.7,48.4 2.16,48.43 2.7,48.27 1.72,48.99 3.08,48.81 2.68,49.05 2.3,49.1',
  cvl: '1.91,47.9 0.69,47.39 2.4,47.08 1.33,47.59 1.49,48.45 1.69,46.81 1.37,48.74 2.73,48 2.07,47.22 1.07,47.79 1,47.13 2.5,46.72 2.63,47.69 0.82,48.32 1.06,46.63 1.33,48.07 0.24,47.17 2.44,47.49 2.9,47.6 1.75,48.2',
  pdl: '-1.55,47.22 -0.55,47.47 0.2,48 -0.77,48.07 -1.43,46.67 -2.21,47.27 -0.88,47.06 -0.08,47.26 -1.78,46.5 -0.62,48.3 -0.81,46.47 -0.7,47.83 -0.08,47.7 -1.38,47.72 -2.43,47.33 0.37,48.35 -2.25,47 -1.18,47.52',
  grandest: '7.75,48.57 6.18,49.12 6.18,48.69 4.03,49.26 7.34,47.75 7.36,48.08 4.07,48.3 6.45,48.17 4.37,48.96 4.72,49.77 5.16,48.77 5.14,48.11 5.38,49.16 4.95,48.64 5.33,47.86 4.94,49.7 7.79,48.82 7.07,49.11 3.95,49.04 3.72,48.72 4.37,48.11 4.58,48.72 6.95,48.28 5.76,49.52 5.7,48.36 6.85,47.95 7.05,48.55',
  bfc: '5.04,47.32 6.02,47.24 3.57,47.8 4.83,46.31 3.16,46.99 4.85,46.78 6.86,47.64 6.15,47.62 5.55,46.67 3.28,48.2 4.34,47.62 4.3,46.95 6.35,46.9 6.8,47.51 5.86,46.39 3.91,47.49 3.52,47.46 4.58,47.86 4.12,46.45 5.22,46.63 2.93,47.41 5.59,47.45 3.93,47.06 6.38,47.82 3.7,46.7',
};
const RG_FR = []; for (const [id, s] of Object.entries(RG_FR_PTS)) s.split(' ').forEach(p => { const [lon, lat] = p.split(',').map(Number); RG_FR.push([lon, lat, id]); });
const RG_ISO = {
  CHE: 'suisse', LIE: 'suisse', BEL: 'benelux', NLD: 'benelux', LUX: 'benelux', DEU: 'allemagne', AUT: 'allemagne',
  ITA: 'italie', SMR: 'italie', VAT: 'italie', MCO: 'paca', ESP: 'iberie', PRT: 'iberie', AND: 'iberie',
  GBR: 'britanniques', IRL: 'britanniques', IMN: 'britanniques', JEY: 'britanniques', GGY: 'britanniques',
  NOR: 'scandinavie', SWE: 'scandinavie', DNK: 'scandinavie', FIN: 'scandinavie', ALD: 'scandinavie', ISL: 'scandinavie', FRO: 'scandinavie',
  POL: 'europe_est', CZE: 'europe_est', SVK: 'europe_est', HUN: 'europe_est', ROU: 'europe_est', BGR: 'europe_est', UKR: 'europe_est', BLR: 'europe_est', MDA: 'europe_est', LTU: 'europe_est', LVA: 'europe_est', EST: 'europe_est', SVN: 'europe_est', BIH: 'europe_est', SRB: 'europe_est', KOS: 'europe_est', MKD: 'europe_est',
  GRC: 'mediterranee', CYP: 'mediterranee', CYN: 'mediterranee', TUR: 'mediterranee', MLT: 'mediterranee', HRV: 'mediterranee', MNE: 'mediterranee', ALB: 'mediterranee',
  MAR: 'afrique_nord', DZA: 'afrique_nord', TUN: 'afrique_nord', LBY: 'afrique_nord', EGY: 'afrique_nord', SAH: 'afrique_nord', MRT: 'afrique_nord',
  SEN: 'afrique_ouest', GMB: 'afrique_ouest', GNB: 'afrique_ouest', GIN: 'afrique_ouest', SLE: 'afrique_ouest', LBR: 'afrique_ouest', CIV: 'afrique_ouest', GHA: 'afrique_ouest', TGO: 'afrique_ouest', BEN: 'afrique_ouest', NGA: 'afrique_ouest', NER: 'afrique_ouest', MLI: 'afrique_ouest', BFA: 'afrique_ouest', CPV: 'afrique_ouest', TCD: 'afrique_ouest', CMR: 'afrique_ouest', SHN: 'afrique_ouest',
  KEN: 'afrique_est', TZA: 'afrique_est', UGA: 'afrique_est', ETH: 'afrique_est', SOM: 'afrique_est', SOL: 'afrique_est', ERI: 'afrique_est', DJI: 'afrique_est', SDN: 'afrique_est', SDS: 'afrique_est', RWA: 'afrique_est', BDI: 'afrique_est', COD: 'afrique_est', COG: 'afrique_est', GAB: 'afrique_est', GNQ: 'afrique_est', CAF: 'afrique_est', STP: 'afrique_est',
  AGO: 'afrique_sud', ZMB: 'afrique_sud', ZWE: 'afrique_sud', MOZ: 'afrique_sud', MWI: 'afrique_sud', NAM: 'afrique_sud', BWA: 'afrique_sud', ZAF: 'afrique_sud', LSO: 'afrique_sud', SWZ: 'afrique_sud',
  MDG: 'ocean_indien', MUS: 'ocean_indien', SYC: 'ocean_indien', COM: 'ocean_indien', MDV: 'ocean_indien', IOT: 'ocean_indien', IOA: 'ocean_indien', ATF: 'ocean_indien',
  SAU: 'moyen_orient', ARE: 'moyen_orient', OMN: 'moyen_orient', YEM: 'moyen_orient', QAT: 'moyen_orient', BHR: 'moyen_orient', KWT: 'moyen_orient', IRQ: 'moyen_orient', IRN: 'moyen_orient', SYR: 'moyen_orient', JOR: 'moyen_orient', LBN: 'moyen_orient', ISR: 'moyen_orient', PSX: 'moyen_orient',
  KAZ: 'asie_centrale', UZB: 'asie_centrale', TKM: 'asie_centrale', KGZ: 'asie_centrale', TJK: 'asie_centrale', AFG: 'asie_centrale', MNG: 'asie_centrale', GEO: 'asie_centrale', ARM: 'asie_centrale', AZE: 'asie_centrale',
  IND: 'inde', NPL: 'inde', BTN: 'inde', BGD: 'inde', LKA: 'inde', PAK: 'inde', KAS: 'inde',
  CHN: 'chine', HKG: 'chine', MAC: 'chine', TWN: 'chine', JPN: 'japon', KOR: 'coree', PRK: 'coree',
  THA: 'asie_sud_est', VNM: 'asie_sud_est', LAO: 'asie_sud_est', KHM: 'asie_sud_est', MMR: 'asie_sud_est', MYS: 'asie_sud_est', SGP: 'asie_sud_est', IDN: 'asie_sud_est', PHL: 'asie_sud_est', BRN: 'asie_sud_est', TLS: 'asie_sud_est',
  AUS: 'australie', HMD: 'australie', NFK: 'australie', ATC: 'australie',
  NZL: 'pacifique', FJI: 'pacifique', PNG: 'pacifique', SLB: 'pacifique', VUT: 'pacifique', NCL: 'pacifique', PYF: 'pacifique', WSM: 'pacifique', TON: 'pacifique', FSM: 'pacifique', MHL: 'pacifique', MNP: 'pacifique', GUM: 'pacifique', ASM: 'pacifique', PLW: 'pacifique', KIR: 'pacifique', NIU: 'pacifique', COK: 'pacifique', PCN: 'pacifique', NRU: 'pacifique', TUV: 'pacifique', WLF: 'pacifique',
  CAN: 'canada', SPM: 'canada', GRL: 'arctique', ATA: 'arctique', SGS: 'arctique', FLK: 'amerique_sud',
  MEX: 'mexique_caraibes', GTM: 'mexique_caraibes', BLZ: 'mexique_caraibes', HND: 'mexique_caraibes', SLV: 'mexique_caraibes', NIC: 'mexique_caraibes', CRI: 'mexique_caraibes', PAN: 'mexique_caraibes', CUB: 'mexique_caraibes', JAM: 'mexique_caraibes', HTI: 'mexique_caraibes', DOM: 'mexique_caraibes', PRI: 'mexique_caraibes', BHS: 'mexique_caraibes', VIR: 'mexique_caraibes', VGB: 'mexique_caraibes', AIA: 'mexique_caraibes', CYM: 'mexique_caraibes', TCA: 'mexique_caraibes', MSR: 'mexique_caraibes', BMU: 'mexique_caraibes', TTO: 'mexique_caraibes', BRB: 'mexique_caraibes', GRD: 'mexique_caraibes', LCA: 'mexique_caraibes', VCT: 'mexique_caraibes', KNA: 'mexique_caraibes', ATG: 'mexique_caraibes', DMA: 'mexique_caraibes', ABW: 'mexique_caraibes', CUW: 'mexique_caraibes', MAF: 'mexique_caraibes', BLM: 'mexique_caraibes', SXM: 'mexique_caraibes',
  BRA: 'amerique_sud', ARG: 'amerique_sud', CHL: 'amerique_sud', PER: 'amerique_sud', BOL: 'amerique_sud', ECU: 'amerique_sud', COL: 'amerique_sud', VEN: 'amerique_sud', GUY: 'amerique_sud', SUR: 'amerique_sud', PRY: 'amerique_sud', URY: 'amerique_sud',
};
// grandes zones, quand on n'est dans aucun pays connu (ou outre-mer)
function rgZone(lon, lat) {
  if (lat > 66 || lat < -60) return 'arctique';
  if (lon > -170 && lon < -50 && lat > 5 && lat < 32 && !(lon < -118 && lat < 25)) return 'mexique_caraibes';
  if (lon > -82 && lon < -34 && lat <= 12 && lat > -56) return 'amerique_sud';
  if (lon > -170 && lon < -52 && lat >= 32) return lon < -100 ? 'usa_ouest' : lat > 48 ? 'canada' : 'usa_est';
  if (lon > 40 && lon < 80 && lat < -5 && lat > -30) return 'ocean_indien';
  if ((lon > 130 || lon < -120) && lat < 30 && lat > -50) return lon > 110 && lon < 155 && lat < -10 ? 'australie' : 'pacifique';
  return null;
}
let RG_POLY = null;
function rgPolys() {
  if (RG_POLY) return RG_POLY;
  RG_POLY = [];
  if (typeof GEO === 'undefined' || !GEO.c) return RG_POLY;
  for (const [, iso, , , polys] of GEO.c) for (const rings of polys) {
    const rs = rings.map(arr => { const out = new Float64Array(arr.length); let x = 0, y = 0; for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out[i] = x / 100; out[i + 1] = y / 100; } return out; });
    const o = rs[0]; let a = 180, b = 90, c = -180, d = -90;
    for (let i = 0; i < o.length; i += 2) { if (o[i] < a) a = o[i]; if (o[i] > c) c = o[i]; if (o[i + 1] < b) b = o[i + 1]; if (o[i + 1] > d) d = o[i + 1]; }
    RG_POLY.push({ iso, rs, bb: [a, b, c, d] });
  }
  return RG_POLY;
}
function rgInRing(r, x, y) { let ins = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
function rgCountry(lon, lat) {
  for (const p of rgPolys()) {
    const b = p.bb; if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    if (!rgInRing(p.rs[0], lon, lat)) continue;
    let hole = false; for (let k = 1; k < p.rs.length; k++) if (rgInRing(p.rs[k], lon, lat)) { hole = true; break; }
    if (!hole) return p.iso;
  }
  return null;
}
function rgFrance(lon, lat) {
  if (lon > 8.4 && lat < 43.1) return 'corse';
  let best = 'ara', bd = 1e9; const k = Math.cos(lat * Math.PI / 180);
  for (const [x, y, id] of RG_FR) { const dx = (x - lon) * k, dy = y - lat, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = id; } }
  return best;
}
const rgMetro = (lon, lat) => lon > -5.6 && lon < 10 && lat > 41.2 && lat < 51.3;
function rgFromIso(iso, lon, lat) {
  if (!iso) return null;
  if (iso === 'FRA') return rgMetro(lon, lat) ? rgFrance(lon, lat) : rgZone(lon, lat) || 'ocean_indien';
  if (iso === 'USA') return lat > 51 && lon < -129 ? 'arctique' : lon < -150 && lat < 30 ? 'pacifique' : lon < -100 ? 'usa_ouest' : 'usa_est';
  if (iso === 'CAN') return lat > 62 ? 'arctique' : 'canada';
  if (iso === 'RUS') return lat > 64 ? 'arctique' : lon < 45 ? 'europe_est' : 'asie_centrale';
  if (iso === 'NOR' && lat > 74) return 'arctique';
  if (iso === 'ESP' && lon < -12) return 'iberie';
  if (iso === 'PRT' && lon < -20) return 'grand_large';
  if (iso === 'ITA' && lon < 7.56 && lat < 43.82) return 'paca'; // Menton : la frontière simplifiée passe un peu trop à l'ouest
  if (iso === 'CHL' && lon < -100) return 'pacifique';
  if (iso === 'ECU' && lon < -85) return 'pacifique';
  return RG_ISO[iso] || null;
}
const _rgCache = new Map();
function regionAt(lon, lat) {
  lon = +lon; lat = +lat;
  if (!isFinite(lon) || !isFinite(lat)) return RG.grand_large;
  while (lon > 180) lon -= 360; while (lon < -180) lon += 360;
  const key = Math.round(lon * 50) + ':' + Math.round(lat * 50);
  if (_rgCache.has(key)) return RG[_rgCache.get(key)];
  let id = null;
  try {
    id = rgFromIso(rgCountry(lon, lat), lon, lat);
    // côte simplifiée : on regarde un peu autour (un port, une plage)
    if (!id) for (const r of [0.08, 0.2, 0.4]) { for (let a = 0; a < 8 && !id; a++) { const x = lon + Math.cos(a * Math.PI / 4) * r / Math.max(0.3, Math.cos(lat * Math.PI / 180)), y = lat + Math.sin(a * Math.PI / 4) * r; id = rgFromIso(rgCountry(x, y), lon, lat); } if (id) break; }
  } catch (e) { id = null; }
  if (!id && rgMetro(lon, lat) && lat > 42.3 && lon > -5 && lon < 8.2 && !(lon < -1.8 && lat < 46.2)) id = rgFrance(lon, lat); // tout près des côtes françaises
  if (!id) id = rgZone(lon, lat) || 'grand_large';
  if (_rgCache.size > 4000) _rgCache.clear();
  _rgCache.set(key, id);
  return RG[id];
}

// ---------------- état (sauvegarde) ----------------
function rgState() {
  if (!S.regions || typeof S.regions !== 'object') S.regions = {};
  const s = S.regions;
  if (!s.seen || typeof s.seen !== 'object') s.seen = {};       // { regionId: { trips, first, last } }
  if (!s.got || typeof s.got !== 'object') s.got = {};          // { resourceId: nombre trouvé }
  if (!s.claimed || typeof s.claimed !== 'object') s.claimed = {}; // récompenses de région récupérées
  if (typeof s.sel !== 'string') s.sel = '';
  return s;
}
rgState();
const rgHome = () => { const h = homeObj(); return regionAt(h.lon, h.lat); };
const rgDiscovered = id => !!rgState().seen[id] || rgHome().id === id;
const rgGot = rid => !!rgState().got[rid];
const rgGotCount = R => R.res.filter(x => rgGot(x.id)).length;
const rgComplete = R => rgGotCount(R) === R.res.length;
function rgPlaceLabel(dest) { return (dest && (dest.poi ? (dest.city || dest.name) : dest.name)) || ''; }

// ---------------- provenance ----------------
const _rgGuess = new Map(); // anciens objets : provenance devinée une seule fois par lieu (affichage rapide du sac)
function originOf(it) {
  if (!it) return null;
  if (it.origin && RG[it.origin.region]) return it.origin;
  // anciens objets : on devine la région quand le lieu est connu (sans rien modifier)
  const n = it.from; if (!n || typeof n !== 'string') return null;
  const ck = S.home + '|' + n; if (_rgGuess.has(ck)) return _rgGuess.get(ck);
  const g = rgGuessOrigin(n); if (_rgGuess.size > 2000) _rgGuess.clear(); _rgGuess.set(ck, g); return g;
}
function rgGuessOrigin(n) {
  const p = PLACES.find(x => x.name === n) || (typeof SECRETS !== 'undefined' ? SECRETS.find(x => x.name === n) : null) || (HOMES.find(h => h[0] === n) ? (h => ({ lon: h[2], lat: h[1] }))(HOMES.find(h => h[0] === n)) : null);
  if (!p) return null;
  return { region: regionAt(p.lon, p.lat).id, place: n, guess: 1, km: kmBetween(homeObj(), p) };
}
function rgPill(it, mode) {
  const o = originOf(it); if (!o) return '';
  const R = RG[o.region], place = o.place && o.place !== R.short ? o.place : '';
  const txt = o.made ? `Fabriqué à ${esc(o.place || S.home)}` : `${esc(R.short)}${place && mode !== 'short' ? ' · ' + esc(place) : ''}`;
  return `<span class="rgp${o.made ? ' made' : ''}" style="--rg:${R.color}" title="${esc(R.name)}${o.place ? ' · ' + esc(o.place) : ''}">${rgIcon(R, 's')}<span>${txt}</span></span>`;
}

// ---------------- valeur au marché ----------------
function valueBonus(it) {
  const out = [], o = originOf(it); if (!o) return out;
  if (o.multi && o.multi.length >= 2) out.push({ txt: `Merveille de ${o.multi.length} régions`, pct: 60 });
  else if (o.with && o.with.length) out.push({ txt: 'Savoir-faire régional', pct: 20 });
  if (!o.made) {
    const km = o.km || 0, pct = km >= 8000 ? 50 : km >= 4000 ? 40 : km >= 1500 ? 30 : km >= 600 ? 20 : km >= 150 ? 10 : 0;
    if (pct) out.push({ txt: 'Venu de loin', pct });
  }
  if (it.rid) out.push({ txt: 'Spécialité régionale', pct: 15 });
  return out;
}
const valueBonusPct = it => Math.min(100, valueBonus(it).reduce((a, b) => a + b.pct, 0));
if (typeof value === 'function') value = (orig => function (it) { const v = orig(it); try { return Math.round(v * (1 + valueBonusPct(it) / 100)); } catch (e) { return v; } })(value);
const rgBonusHTML = it => { const b = valueBonus(it); return b.length ? `<span class="rgval">${b.map(x => `<i>${esc(x.txt)} : <b>+${x.pct} %</b></i>`).join('')}</span>` : ''; };

// ---------------- butin régional ----------------
const RG_RAR_W = [1, 0.55, 0.28, 0.11, 0.035];
// la distance ne paie que si le voyage dure : balade éclair = presque rien, expédition = plein bonus
const RG_DUR_F = { eclair: 0.05, court: 0.25, moyen: 0.55, long: 0.8, expe: 1 };
// et les épiques / légendaires régionaux restent très rares en voyage court
const RG_DUR_TOP = { eclair: 0.12, court: 0.3, moyen: 0.85, long: 1, expe: 1.15 };
const rgDurF = dur => RG_DUR_F[dur] != null ? RG_DUR_F[dur] : 1;
function rgDistBonus(km, dur) { return Math.min(0.8, Math.max(0, km) / 7000) * rgDurF(dur); }
function rgRarityWeights(km, luck, dur) { const b = rgDistBonus(km, dur) + Math.min(0.3, Math.max(0, luck || 0) * 0.08), top = RG_DUR_TOP[dur] != null ? RG_DUR_TOP[dur] : 1; return RG_RAR_W.map((w, r) => w * Math.pow(1 + b, r) * (r >= 3 ? top : 1)); }
const rgShortTrip = dur => dur === 'eclair' || dur === 'court';
function rgPickRes(R, km, luck, preferNew, dur, maxRar) {
  let pool = R.res; if (maxRar != null) { const lo = pool.filter(x => x.rar <= maxRar); if (lo.length) pool = lo; }
  if (preferNew) { const nf = pool.filter(x => !rgGot(x.id)); if (nf.length) pool = nf; }
  const W = rgRarityWeights(km, luck, dur), w = pool.map(x => W[x.rar]);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[0];
}
function rgMakeRes(x, place, tags, origin) {
  const it = makeItem(rgDef(x), 0, place, tags || [], { fixed: x.rar });
  it.rid = x.id; it.origin = Object.assign({}, origin, { region: x.region });
  return it;
}
// probabilités affichées (pour l'aperçu avant de partir)
function rgResChances(R, km, luck, dur) { const W = rgRarityWeights(km, luck, dur), tot = R.res.reduce((a, x) => a + W[x.rar], 0); return R.res.map(x => ({ x, p: W[x.rar] / tot })); }
function rgDreamNeeds(k, it) {
  try {
    if (typeof curDream !== 'function' || typeof itemMatches !== 'function') return false;
    const d = curDream(k); if (d && d.steps && d.steps.some(st => itemMatches(st, it))) return true;
    // ingrédient d'une recette demandée par un rêve en cours (n'importe quel compagnon) : on le garde aussi
    for (const c of Object.keys(CHARS)) { const dc = curDream(c); if (dc && dc.steps && dc.steps.some((st, i) => st.t === 'craft' && !(typeof stepDone === 'function' && stepDone(c, i)) && (RECIPES.find(x => x.id === st.id) || { ing: [] }).ing.some(([key]) => ING[key] && ING[key][0].includes(it.sub)))) return true; }
    return false;
  } catch (e) { return false; }
}
let rgLastHaul = null;
function rgBeforeCollect(t) {
  const st = rgState(), dest = t.dest || {}, R = regionAt(dest.lon, dest.lat), h = homeObj();
  const km = kmBetween(h, dest), place = rgPlaceLabel(dest), tags = dest.tags || [];
  const isNew = !st.seen[R.id] || !st.seen[R.id].trips;
  // 1. provenance des objets du sac
  for (const it of t.bag) {
    if (!it || it.origin) continue;
    let reg = R, pl = place, k2 = km;
    if (it.from && it.from !== dest.name) {
      const p = PLACES.find(x => x.name === it.from);
      if (p) { reg = regionAt(p.lon, p.lat); pl = p.name; k2 = kmBetween(h, p); }
      else if (it.from === 'En pleine mer') { reg = RG.grand_large; pl = it.from; }
    }
    it.origin = { region: reg.id, place: pl, km: k2 };
  }
  // 2. une partie du butin devient une spécialité de la région (jamais un objet utile au rêve en cours)
  const elig = t.bag.map((it, i) => ({ it, i })).filter(({ it }) => it && !it.rid && !it.special && !it.edition && (it.cat === 'm' || it.cat === 'n') && it.rarity <= 1 && !rgDreamNeeds(t.comp, it));
  const maxConv = Math.max(1, Math.ceil(t.bag.length * 0.35)), origin = { place, km };
  const made = [];
  elig.sort(() => Math.random() - 0.5).forEach(({ i }, n) => { if (made.length < maxConv && (n === 0 || Math.random() < 0.22)) { const x = rgPickRes(R, km, t.luck, false, t.dur), it = rgMakeRes(x, dest.name || place, tags, origin); t.bag[i] = it; made.push(it); } });
  if (!made.length) { const it = rgMakeRes(rgPickRes(R, km, t.luck, false, t.dur), dest.name || place, tags, origin); t.bag.push(it); made.push(it); }
  // 3. première visite : une spécialité garantie en plus, de préférence encore inconnue
  let bonus = null;
  if (isNew) { bonus = rgMakeRes(rgPickRes(R, km, (t.luck || 0) + 1.5, true, t.dur, rgShortTrip(t.dur) ? 1 : null), dest.name || place, tags, origin); t.bag.push(bonus); }
  const newRes = [...new Set(t.bag.filter(it => it.rid && !rgGot(it.rid)).map(it => it.rid))];
  // 4. codex
  const s = st.seen[R.id] || (st.seen[R.id] = { trips: 0, first: Date.now() });
  s.trips++; s.last = Date.now();
  t.bag.forEach(it => { if (it.rid) st.got[it.rid] = (st.got[it.rid] || 0) + 1; });
  rgLastHaul = { R, isNew, made: made.length + (bonus ? 1 : 0), newRes, km, complete: rgComplete(R) && newRes.length > 0 };
}
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  rgLastHaul = null;
  if (t) { try { rgBeforeCollect(t); } catch (e) { console.error('régions', e); } }
  const n0 = S.inv.length, dest = t && t.dest;
  const r = orig.apply(this, arguments);
  // objets ajoutés pendant le rangement (bonus du jour, village…) : provenance aussi
  if (dest) { try { const home = rgHome(), R = regionAt(dest.lon, dest.lat), km = kmBetween(homeObj(), dest); S.inv.slice(n0).forEach(it => { if (!it || it.origin) return; it.origin = it.from === dest.name ? { region: R.id, place: rgPlaceLabel(dest), km } : { region: home.id, place: it.from || S.home, km: 0 }; }); save(); } catch (e) {} }
  if (rgLastHaul) { try { rgHaulBanner(rgLastHaul); } catch (e) { console.error(e); } }
  return r;
})(collect);
function rgHaulBanner(h) {
  const m = $('modal'); if (!m || m.hidden) { if (h.isNew) toast(`Nouvelle région découverte : ${h.R.name} !`); return; }
  const box = m.querySelector('.haul'); if (!box) return;
  const n = REGIONS.filter(R => rgDiscovered(R.id)).length;
  const txt = h.isNew ? `<b>Nouvelle région : ${esc(h.R.name)}</b><small>${n}/${REGIONS.length} régions découvertes · une spécialité offerte !</small>`
    : `<b>${esc(h.R.name)}</b><small>${h.made} spécialité${h.made > 1 ? 's' : ''} régionale${h.made > 1 ? 's' : ''}${h.newRes.length ? ` · ${h.newRes.length} nouvelle${h.newRes.length > 1 ? 's' : ''} pour le codex` : ''} · ${rgGotCount(h.R)}/${h.R.res.length}</small>`;
  box.insertAdjacentHTML('beforebegin', `<button class="rgban${h.isNew ? ' new' : ''}" style="--rg:${h.R.color}" data-rgopen="${h.R.id}">${rgIcon(h.R, 'm')}<span>${txt}</span><em>Codex</em></button>`);
  if (h.complete) box.insertAdjacentHTML('afterend', `<p class="rgdone">Toutes les spécialités ${esc(rgDe(h.R))} sont réunies ! Récompense à récupérer dans Sac & Album › Régions.</p>`);
}

// ---------------- recettes multi-régions ----------------
// ing : [idRessource, nombre]. Résultat de grande valeur, avec une histoire.
const RG_RECIPES = [
  { id: 'rg_foulard_lavande', out: ['Foulard de soie lavande', 'v', 'cou', 3, 'foulard', '#b9a6e6'], ing: [['soie_lyon', 1], ['lavande', 2]], coins: 30, story: 'Tissé dans la soie de Lyon, puis teint au soleil dans un champ de lavande de Provence.' },
  { id: 'rg_cheminee_lave', out: ['Cheminée de lave et d’ardoise', 'd', 'cheminee', 3, null, '#7a7484'], ing: [['pierre_lave', 2], ['ardoise', 1]], coins: 40, story: 'Des pierres de volcan d’Auvergne et un toit d’ardoise d’Angers : on s’y réchauffe deux fois mieux.' },
  { id: 'rg_tatin_caramel', out: ['Tarte Tatin au caramel normand', 'n', 'pomme', 3, null, '#c97a3a'], ing: [['tatin', 1], ['caramel_normand', 1]], coins: 10, story: 'La tarte renversée du Val de Loire, nappée d’un caramel au beurre de Normandie.' },
  { id: 'rg_statue_granit', out: ['Statue de granit et de tuffeau', 'd', 'statue', 3, null, '#e9a6a0'], ing: [['granit_rose', 2], ['tuffeau', 1]], coins: 30, story: 'Un petit gardien taillé dans le granit rose de Bretagne, posé sur un socle de pierre des châteaux.' },
  { id: 'rg_crepe_erable', out: ['Crêpe dentelle au sirop d’érable', 'n', 'sucre', 3, null, '#d99a4f'], ing: [['crepe_dentelle', 1], ['sirop_erable', 1]], coins: 10, story: 'Une crêpe bretonne toute fine, qui a traversé l’Atlantique pour rencontrer l’érable du Canada.' },
  { id: 'rg_matcha_calisson', out: ['Thé matcha au calisson', 'n', 'boisson', 3, null, '#9fc46a'], ing: [['matcha', 1], ['calisson', 1]], coins: 15, story: 'Le thé vert de Kyoto, servi avec un calisson d’Aix : la Provence et le Japon dans la même tasse.' },
  { id: 'rg_lanterne_washi', out: ['Lanterne de washi au sel de Guérande', 'd', 'lanterne', 3, null, '#f6efe0'], ing: [['washi', 2], ['sel_guerande', 1]], coins: 30, story: 'Du papier washi du Japon, et des cristaux de sel de Guérande qui scintillent quand on l’allume.' },
  { id: 'rg_diademe', out: ['Diadème de cristal en fleurs', 'v', 'tete', 4, 'couronne', '#f6c2cf'], ing: [['cristal_alpes', 1], ['cerisier', 2]], coins: 60, story: 'Un cristal des Alpes serti de fleurs de cerisier du Japon : il ne fane jamais.' },
  { id: 'rg_pull_tartan', out: ['Pull d’alpaga à motif tartan', 'v', 'haut', 3, 'pull', '#c94a4a'], ing: [['alpaga', 2], ['tartan', 1]], coins: 40, story: 'Laine des Andes, motif des Highlands : le pull le plus chaud des deux hémisphères.' },
  { id: 'rg_cape_aurore', out: ['Cape d’aurore et de perle noire', 'v', 'dos', 4, 'cape', '#5fd0b0'], ing: [['aurore', 1], ['perle_noire', 1]], coins: 80, story: 'Une lumière des pôles cousue avec une perle de Tahiti : du nord au sud du monde.' },
  { id: 'rg_tapis_tulipes', out: ['Tapis persan aux tulipes', 'd', 'tapis', 3, null, '#b9304f'], ing: [['fil_persan', 1], ['bulbe_tulipe', 2]], coins: 40, story: 'Noué avec un fil persan, il porte des tulipes de Hollande dans ses motifs.' },
  { id: 'rg_herbier_monde', out: ['Herbier du tour du monde', 'd', 'herbier', 3, null, '#d9404f'], ing: [['lavande', 1], ['cerisier', 1], ['erable_rouge', 1]], coins: 30, story: 'Un brin de Provence, une fleur du Japon, une feuille du Canada : trois saisons, trois pays.' },
  { id: 'rg_chocolat_epice', out: ['Chocolat chaud vanille et piment', 'n', 'boisson', 4, null, '#6a3a2a'], ing: [['chocolat_azteque', 1], ['vanille', 1], ['piment_espelette', 1]], coins: 20, story: 'Le cacao du Mexique, la vanille de l’océan Indien et une pincée d’Espelette : ça réveille !' },
  { id: 'rg_echarpe_benares', out: ['Écharpe de Bénarès et des Féroé', 'v', 'cou', 3, 'echarpe', '#d9304f'], ing: [['soie_benares', 1], ['laine_feroe', 1]], coins: 40, story: 'Une soie brodée d’Inde doublée de laine des îles Féroé, pour les voyages en toutes saisons.' },
  { id: 'rg_lampe_murano', out: ['Lampe de porcelaine et de Murano', 'd', 'lampe', 4, null, '#e97ab0'], ing: [['porcelaine', 1], ['verre_murano', 1]], coins: 60, story: 'Un pied de porcelaine bleue de Chine, un abat-jour en verre soufflé de Venise.' },
  { id: 'rg_bocal_plages', out: ['Bocal des trois plages', 'd', 'bocal', 3, null, '#e0784a'], ing: [['sable_dune', 1], ['sable_noir', 1], ['sable_namib', 1]], coins: 20, story: 'Trois couches de sable : la grande dune, une plage volcanique et le désert du Namib.' },
  { id: 'rg_mappemonde_azulejos', out: ['Mappemonde en azulejos', 'd', 'mappemonde', 3, null, '#4f88cf'], ing: [['azulejo', 2], ['plan_paris', 1]], coins: 40, story: 'Une carte du monde en carreaux de Lisbonne, dessinée d’après un vieux plan de Paris.' },
  { id: 'rg_plante_lotus', out: ['Jardin de lotus et de jasmin', 'd', 'plante', 4, null, '#f6a6c8'], ing: [['lotus', 1], ['jasmin_grasse', 1]], coins: 50, story: 'Un lotus d’Inde qui pousse à côté d’un jasmin de Grasse : le parfum le plus doux du village.' },
  { id: 'rg_bonnet_wax', out: ['Bonnet de feutre en wax', 'v', 'tete', 3, 'bonnet', '#e9603a'], ing: [['feutre_yourte', 1], ['tissu_wax', 1]], coins: 30, story: 'Du feutre des steppes recouvert de tissu wax de Dakar : chaud et plein de couleurs.' },
  { id: 'rg_couronne_corail', out: ['Couronne de corail et d’Akoya', 'v', 'tete', 4, 'couronne', '#e5484f'], ing: [['corail_rouge', 1], ['akoya', 1]], coins: 80, story: 'Corail de Corse et perle du Japon : un trésor de deux mers.' },
  { id: 'rg_chaussettes_pyrenees', out: ['Chaussettes Pyrénées-Andes', 'v', 'pieds', 2, 'chaussettes', '#f2e6d0'], ing: [['laine_pyrenees', 1], ['alpaga', 1]], coins: 10, story: 'Tricotées avec la laine de deux grandes montagnes, l’une en France, l’autre en Amérique du Sud.' },
];
// intégration à l'atelier : clés d'ingrédient « r:id » (comptées par spécialité précise)
RG_RECIPES.forEach(r => {
  r.kind = 'Voyage'; r.multi = true;
  r.regions = [...new Set(r.ing.map(([id]) => RG_RES[id].region))];
  r.ing = r.ing.map(([id, n]) => { ING['r:' + id] = [[], RG_RES[id].name]; return ['r:' + id, n]; });
  RECIPES.push(r);
});
const rgInvOf = rid => S.inv.filter(i => i.rid === rid);
if (typeof ingCount === 'function') ingCount = (orig => function (key) { if (typeof key === 'string' && key.startsWith('r:')) return rgInvOf(key.slice(2)).length; return orig.apply(this, arguments); })(ingCount);
function rgCraftMulti(r) {
  if (!canCraft(r)) return;
  const used = [];
  for (const [key, n] of r.ing) { const c = rgInvOf(key.slice(2)).sort((a, b) => a.rarity - b.rarity).slice(0, n); c.forEach(x => { S.inv.splice(S.inv.indexOf(x), 1); used.push(x); }); }
  S.coins -= r.coins;
  const k = S.sel, master = Math.random() < 0.12 + lvlLuck(k) * 0.2, home = rgHome();
  const it = makeItem(r.out, 0, `Fabriqué par ${CHARS[k].name}`, [], { fixed: Math.min(4, r.out[3] + (master ? 1 : 0)) });
  if (master) it.name += ' (chef-d’œuvre)';
  it.desc = r.story;
  it.origin = { region: home.id, place: S.home, made: 1, multi: r.regions.slice(), with: used.map(x => x.name) };
  S.inv.push(it); S.dex[r.out[0]] = true; S.stats.crafted++;
  addXP(k, 40); bump('craft'); save();
  renderTop(); renderComps(); renderPanel();
  reactionPopup(k, 'amour', master ? `Un chef-d’œuvre de ${r.regions.length} régions : « ${r.out[0]} » !` : `Une merveille de ${r.regions.length} régions : « ${it.name} » !`);
  if (typeof confetti === 'function') { try { confetti(it.rarity >= 4); } catch (e) {} }
  try { GAME.emit('craft', { id: r.id, item: it, who: k }); } catch (e) {}
}
if (typeof craft === 'function') craft = (orig => function (id) {
  const r = RECIPES.find(x => x.id === id);
  if (r && r.multi) return rgCraftMulti(r);
  const before = S.inv.slice(), n0 = S.stats.crafted;
  const res = orig.apply(this, arguments);
  if (S.stats.crafted > n0) { // « fabriqué à » la maison, avec les spécialités utilisées
    const was = new Set(before), now = new Set(S.inv), it = S.inv.find(x => !was.has(x) && r && x.name.startsWith(r.out[0])) || S.inv[S.inv.length - 1], gone = before.filter(x => !now.has(x)), reg = gone.filter(x => x.rid); // l'objet fabriqué (pas une récompense ajoutée juste après)
    if (it && !it.origin) {
      it.origin = { region: rgHome().id, place: S.home, made: 1 };
      if (reg.length) {
        const regs = [...new Set(reg.map(x => RG_RES[x.rid].region))];
        it.origin.with = reg.map(x => x.name);
        if (regs.length >= 2) it.origin.multi = regs;
        it.desc = `Fabriqué à ${S.home} avec ${[...new Set(reg.map(x => x.name.toLowerCase()))].join(', ')}${regs.length >= 2 ? `, venus ${regs.map(id => rgDe(RG[id])).join(' et ')}` : ` ${rgDe(RG[regs[0]])}`}.`;
      }
      save();
    }
  }
  return res;
})(craft);
// les spécialités ne partent pas dans les recettes ordinaires tant qu'il y a autre chose
// (géré dans craft() de 10_ui.js et buildVillage() de 15_village.js : tri « objets ordinaires d'abord »)

// ---------------- « Sert à… » ----------------
if (typeof GAME !== 'undefined') GAME.addUses(it => {
  if (!it || !it.rid || !RG_RES[it.rid]) return [];
  const out = [], seen = new Set();
  RG_RECIPES.forEach(r => { if (r.ing.some(([k]) => k === 'r:' + it.rid) && !seen.has(r.out[0])) { seen.add(r.out[0]); out.push({ txt: `Atelier : ${r.out[0]}`, kind: 'recette' }); } });
  const R = RG[RG_RES[it.rid].region];
  out.push({ txt: `Codex : ${R.short} ${rgGotCount(R)}/${R.res.length}`, kind: 'collection' });
  return out;
});
// les recettes « Merveilles » passent avant les recettes ordinaires (sinon elles finissent cachées dans « +N »)
if (typeof GAME !== 'undefined' && Array.isArray(GAME._uses) && GAME._uses.length > 1) GAME._uses.unshift(GAME._uses.pop());

// ---------------- affichage de la provenance ----------------
if (typeof haulCard === 'function') haulCard = (orig => function (it) {
  const h = orig.apply(this, arguments); const p = rgPill(it, 'short');
  return p ? h.replace(/<\/div>$/, `${p}</div>`) : h;
})(haulCard);
if (typeof openFiche === 'function') openFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  try {
    const it = S.inv.find(i => i.id === id), f = document.querySelector('#modal .fiche'); if (!it || !f) return r;
    const o = originOf(it), anchor = f.querySelector('.frar');
    let h = '';
    if (o) { const R = RG[o.region]; h += `<div class="rgfo" style="--rg:${R.color}">${rgIcon(R, 'm')}<span><b>${o.made ? `Fabriqué à ${esc(o.place || S.home)}` : esc(R.name)}</b><small>${o.made ? esc(R.name) : esc(o.place || '')}${!o.made && o.km ? ` · ${o.km.toLocaleString('fr-FR')} km de la maison` : ''}</small></span></div>`; }
    if (it.desc) h += `<p class="rgdesc">${esc(it.desc)}</p>`;
    else if (o && o.multi) h += `<p class="rgdesc">Fabriqué avec des trésors ${o.multi.map(id => esc(rgDe(RG[id]))).join(', ')}.</p>`;
    else if (it.rid) h += `<p class="rgdesc">${esc(RG[RG_RES[it.rid].region].mood)}</p>`;
    h += rgBonusHTML(it);
    if (h && anchor) { const old = anchor.nextElementSibling; if (o && old && old.classList.contains('small') && /^(Édition|Trouvé)/.test(old.textContent) && !it.edition) old.remove(); anchor.insertAdjacentHTML('afterend', h); }
  } catch (e) { console.error(e); }
  return r;
})(openFiche);
if (typeof renderBag === 'function') renderBag = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const byId = new Map(S.inv.map(i => [i.id, i]));
    box.querySelectorAll('.bi button.itx[data-fiche]').forEach(b => {
      const it = byId.get(b.dataset.fiche); if (!it) return;
      const p = rgPill(it); if (!p) return;
      const fr = b.querySelector('.from');
      if (fr) { if (it.edition) fr.innerHTML = `<em>${esc(it.edition)}</em>`; else fr.remove(); }
      const sp = b.querySelector('span'); if (sp) sp.insertAdjacentHTML('afterend', p);
    });
  } catch (e) { console.error(e); }
  return r;
})(renderBag);
if (typeof renderMarket === 'function') renderMarket = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    box.querySelectorAll('.bi').forEach(row => {
      const b = row.querySelector('[data-list]'); if (!b) return;
      const it = S.inv.find(i => i.id === b.dataset.list); if (!it) return;
      const pct = valueBonusPct(it), p = rgPill(it, 'short'), sp = row.querySelector('.itx span');
      if (sp && pct) { sp.insertAdjacentHTML('beforeend', ` · <b class="rgmk" title="${esc(valueBonus(it).map(x => x.txt + ' +' + x.pct + ' %').join(', '))}">+${pct} %</b>`); }
      if (sp && p) sp.insertAdjacentHTML('afterend', p);
      // trois prix : sur téléphone, les boutons passent sur leur propre ligne, avec leur nom
      const bs = row.querySelectorAll('[data-list]');
      if (bs.length >= 3) { row.classList.add('mk3'); const lab = { '0.85': 'Rapide', '1.1': 'Juste', '1.5': 'Ambitieux' }; bs.forEach(x => { if (lab[x.dataset.p] && !x.querySelector('.mkl')) x.insertAdjacentHTML('beforeend', `<small class="mkl">${lab[x.dataset.p]}</small>`); }); }
    });
  } catch (e) { console.error(e); }
  return r;
})(renderMarket);

// ---------------- atelier : filtre « Merveilles » ----------------
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const f = box.querySelector('.filters');
    if (f && !f.querySelector('[data-cf="Voyage"]')) { const n = RG_RECIPES.filter(x => canCraft(x)).length; f.insertAdjacentHTML('beforeend', `<button data-cf="Voyage" aria-pressed="${craftFilter === 'Voyage'}" class="rgcf">${RG_GLYPH_MINI} Merveilles${n ? ` <small class="rgn">${n}</small>` : ''}</button>`); }
    if (craftFilter === 'Voyage') {
      const list = box.querySelector('.recipes');
      const have = rr => rr.ing.reduce((a, [k, n]) => a + Math.min(ingCount(k), n), 0) / rr.ing.reduce((a, [, n]) => a + n, 0);
      const sorted = RG_RECIPES.slice().sort((a, b) => (canCraft(b) - canCraft(a)) || have(b) - have(a));
      if (list) list.outerHTML = `<p class="rgintro">Des recettes rares qui réunissent les spécialités de plusieurs régions. Le résultat raconte son voyage, et vaut <b>+60 %</b> au marché.</p><div class="recipes rgrecs">${sorted.map(rgRecipeCard).join('')}</div>`;
    }
  } catch (e) { console.error(e); }
  return r;
})(renderAtelier);
const RG_GLYPH_MINI = '<svg class="rgmini" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#9fd1d8" stroke="currentColor" stroke-width="2"/><path d="M5 9 c3 -2 5 1 7 0 s3 -3 6 -1 M4.5 15 c3 1 4 -2 7 -1 s4 3 8 1" stroke="#5fa274" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
function rgRecipeCard(r) {
  const out = { name: r.out[0], cat: r.out[1], sub: r.out[2], rarity: r.out[3], look: r.out[4], color: r.out[5] }, ok = canCraft(r);
  const ings = r.ing.map(([key, n]) => { const x = RG_RES[key.slice(2)], R = RG[x.region], have = ingCount(key), known = rgGot(x.id) || have > 0; return `<li class="${have >= n ? 'have' : ''}" style="--rg:${R.color}">${rgIcon(R, 's', !rgDiscovered(R.id))}<span>${known ? esc(x.name) : `Spécialité ${esc(rgDe(R))}`}</span><b>${Math.min(have, n)}/${n}</b></li>`; }).join('') + (r.coins ? `<li class="${S.coins >= r.coins ? 'have' : ''} rgcoin">${coins(r.coins)}</li>` : '');
  return `<div class="rec rgrec ${ok ? 'ok' : ''}" style="--rc:${RARC[out.rarity]}"><div class="ico big">${itemIcon(out)}</div><div class="rx"><b>${esc(out.name)}</b><span class="rr">${RARITY[out.rarity]}${out.cat === 'v' ? ' · ' + SLOT_LABEL[out.sub] : ' · ' + CAT_LABEL[out.cat]} · ${r.regions.length} régions</span><p class="rgstory">${esc(r.story)}</p><ul class="rging">${ings}</ul></div><button data-craft="${r.id}" ${ok ? '' : 'disabled'}>Fabriquer</button></div>`;
}

// ---------------- « Ce que tu peux trouver là-bas » : région et spécialités ----------------
if (typeof liveFindHTML === 'function') liveFindHTML = (orig => function (d) {
  let h = orig.apply(this, arguments);
  try {
    const R = regionAt(d.lon, d.lat), km = kmBetween(homeObj(), d), dd = DURS.find(x => x.key === plan.dur) || DURS[0];
    const ch = rgResChances(R, km, dd.luck, dd.key).sort((a, b) => (rgGot(a.x.id) - rgGot(b.x.id)) || b.x.rar - a.x.rar);
    const show = [ch.find(c => !rgGot(c.x.id) && (!rgShortTrip(dd.key) || c.x.rar <= 1)) || ch.find(c => !rgGot(c.x.id)) || ch[0], ch.filter(c => c.x.rar <= 1).sort((a, b) => b.p - a.p)[0]].filter((c, i, a) => c && a.indexOf(c) === i).slice(0, 2);
    const isNew = !rgDiscovered(R.id) || !(rgState().seen[R.id] || {}).trips;
    const extra = `<div class="cfreg" style="--rg:${R.color}"><div class="cfrh">${rgIcon(R, 'm')}<span><b>${esc(R.name)}</b><small>${isNew ? 'Nouvelle région : une spécialité garantie !' : `${rgGotCount(R)}/${R.res.length} spécialités trouvées`}${km >= 1000 ? (rgShortTrip(dd.key) ? ' · si loin : partez plus longtemps pour les raretés' : km >= 4000 ? ' · si loin : les raretés bien plus fréquentes' : ' · loin : raretés plus fréquentes') : ''}</small></span></div><div class="cfrs">${show.map(c => { const it = { name: c.x.name, cat: c.x.cat, sub: c.x.sub, rarity: c.x.rar, color: c.x.color }, known = rgGot(c.x.id); return `<span style="--rc:${RARC[c.x.rar]}"><span class="cfic">${itemIcon(it)}</span><span class="cfrx"><em>${known ? esc(c.x.name) : esc(c.x.name)}</em><i>${RARITY[c.x.rar]}${known ? '' : ' · nouveau'}</i></span></span>`; }).join('')}</div></div>`;
    h = h.replace(/<\/div>$/, extra + '</div>');
  } catch (e) { console.error(e); }
  return h;
})(liveFindHTML);

// ---------------- codex : Sac & Album › Régions ----------------
if (typeof SUBTABS !== 'undefined' && SUBTABS.sac && !SUBTABS.sac.some(x => x[0] === 'reg')) { SUBTABS.sac.splice(2, 0, ['reg', 'Régions', 'reg']); const al = SUBTABS.sac.find(x => x[0] === 'album'); if (al) al[1] = 'Cartes'; } // 4 sous-onglets : libellé court pour tenir sur téléphone
if (typeof NAV_ICONS !== 'undefined') NAV_ICONS.reg = '<circle cx="15" cy="15" r="11" fill="#9fd1d8" stroke="currentColor" stroke-width="2"/><path d="M6 11 c3 -3 6 1 8 -1 s2 -4 6 -2 l1.5 3 c-2 2 -4 0 -5 2 s1 4 -1 6 c-2 1 -3 -2 -5 -1 s-3 3 -5 1Z" fill="#8fcf7f" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M21 4.5 l1 2.2 2.4 .3 -1.8 1.6 .5 2.4 -2.1 -1.2 -2.1 1.2 .5 -2.4 -1.8 -1.6 2.4 -.3Z" fill="#f6c445" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>';
if (typeof TAB_ALIAS !== 'undefined') { TAB_ALIAS.regions = ['sac', 'reg']; TAB_ALIAS.codex = ['sac', 'reg']; }
if (typeof renderSacTab === 'function') renderSacTab = (orig => function (box) { if (sacView === 'reg') return renderRegions(box); return orig.apply(this, arguments); })(renderSacTab);
const RG_REWARD = 150;
const rgMedal = R => [`Médaille ${rgDe(R)}`, 'm', 'medaille', 3, null, R.color];
function rgClaim(id) {
  const R = RG[id], st = rgState(); if (!R || st.claimed[id] || !rgComplete(R)) return;
  st.claimed[id] = Date.now();
  gainCoins(RG_REWARD);
  const it = makeItem(rgMedal(R), 0, R.name, [], { fixed: 3 }); it.special = true; it.origin = { region: R.id, place: R.short, km: kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }) };
  S.inv.push(it); S.dex[it.name] = true; save(); renderTop(); renderPanel();
  if (typeof confetti === 'function') { try { confetti(true); } catch (e) {} }
  toast(`Région complète : ${R.name} ! +${RG_REWARD} pièces et la ${it.name.toLowerCase()}.`);
}
function regionGo(id) {
  const R = RG[id]; if (!R) return;
  if (S.trips[S.sel]) { toast(`${CHARS[S.sel].name} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; }
  const [lon, lat, name, tags] = R.anchor;
  let p = PLACES.filter(x => x.name !== S.home && regionAt(x.lon, x.lat).id === id).map(x => ({ x, d: kmBetween(x, { lon, lat }) })).sort((a, b) => a.d - b.d).map(o => o.x)[0];
  if (!p || kmBetween(p, { lon, lat }) > 400) p = { id: null, name, country: '', lat, lon, tags: tags.slice(), special: null };
  if (typeof choosePlace === 'function') choosePlace(p); else { plan.dest = p; openSheet('voyage'); }
  if (typeof zoomTo === 'function') { try { zoomTo(p.lon, p.lat, Math.max(zoomT.k, 6)); } catch (e) {} }
  setTimeout(() => toast(`Cap sur ${p.name} (${R.short}) ! Choisissez la durée, puis partez.`), 250);
}
function rgTile(R) {
  const st = rgState(), disc = rgDiscovered(R.id), got = rgGotCount(R), n = R.res.length, done = got === n, claim = done && !st.claimed[R.id], trips = (st.seen[R.id] || {}).trips || 0;
  return `<button class="rgt ${disc ? 'disc' : 'lock'}${done ? ' done' : ''}${st.sel === R.id ? ' on' : ''}" style="--rg:${R.color}" data-rgsel="${R.id}" aria-label="${esc(R.name)}${disc ? '' : ', à découvrir'}">${claim ? '<i class="rgbang">!</i>' : done ? '<i class="rgstar">★</i>' : ''}${rgIcon(R, 'l', !disc)}<b>${esc(R.short)}</b><span class="rgdots">${R.res.map(x => `<i class="${rgGot(x.id) ? 'on' : ''}"></i>`).join('')}</span><small>${disc ? (trips ? `${trips} voyage${trips > 1 ? 's' : ''}` : 'Chez vous') : 'À découvrir'}</small></button>`;
}
function rgDetail(R) {
  const st = rgState(), disc = rgDiscovered(R.id), got = rgGotCount(R), n = R.res.length, done = got === n, claimed = st.claimed[R.id], trips = (st.seen[R.id] || {}).trips || 0;
  const km = kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }), home = rgHome().id === R.id;
  let h = `<div class="rgd${disc ? '' : ' lock'}" style="--rg:${R.color}"><div class="rgdh">${rgIcon(R, 'xl', !disc)}<div><span class="rgk">${esc(RG_GROUPS[R.g])}${home ? ' · votre région' : ''}</span><h3>${esc(R.name)}</h3><p>${esc(R.mood)}</p></div></div>`;
  h += `<div class="rgchips"><span>${trips} voyage${trips > 1 ? 's' : ''}</span><span>${got}/${n} spécialités</span><span>${home ? 'À la maison' : km.toLocaleString('fr-FR') + ' km'}</span></div>`;
  h += `<div class="rgres">${R.res.map(x => { const g = rgGot(x.id), it = { name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, color: x.color }; return `<div class="rgr ${g ? 'got' : ''}" style="--rc:${RARC[x.rar]}"><span class="rgri">${itemIcon(it)}</span><span class="rgrx"><b>${g ? esc(x.name) : '? ? ?'}</b><i>${RARITY[x.rar]}${g ? ` · ${x.cat === 'n' ? 'nourriture' : 'matériau'}` : ''}</i></span>${g && st.got[x.id] > 1 ? `<em>×${st.got[x.id]}</em>` : ''}</div>`; }).join('')}</div>`;
  h += `<div class="rgrew ${done ? (claimed ? 'claimed' : 'ready') : ''}"><span class="rgmed">${itemIcon({ name: 'Médaille', cat: 'm', sub: 'medaille', rarity: 3, color: R.color })}</span><span><b>${done ? (claimed ? 'Région complète !' : 'Toutes les spécialités sont réunies !') : 'Récompense de la région'}</b><small>Toutes les spécialités : ${RG_REWARD} pièces et la médaille ${esc(rgDe(R))}</small></span>${done && !claimed ? `<button class="btn gold sm" data-rgclaim="${R.id}">Récupérer</button>` : claimed ? '<span class="tagok">✓</span>' : `<span class="rgcnt">${got}/${n}</span>`}</div>`;
  h += `<button class="btn green big wide" data-rggo="${R.id}" ${S.trips[S.sel] ? 'disabled' : ''}>${S.trips[S.sel] ? `${CHARS[S.sel].name} est en voyage` : `Y aller avec ${CHARS[S.sel].name}`}</button>`;
  return h + `</div>`;
}
function renderRegions(box) {
  const st = rgState(), nDisc = REGIONS.filter(R => rgDiscovered(R.id)).length, nRes = REGIONS.reduce((a, R) => a + R.res.length, 0), nGot = REGIONS.reduce((a, R) => a + rgGotCount(R), 0);
  if (!RG[st.sel]) st.sel = rgHome().id;
  const claim = REGIONS.filter(R => rgComplete(R) && !st.claimed[R.id]).length;
  let h = phead(null, 'Les régions du monde', 'Chaque région a ses spécialités. Plus elle est loin et plus le voyage est long, plus elles sont rares. Les recettes « Merveilles » de l’atelier les mélangent.');
  h += `<div class="rgsum"><div class="rgbig"><b>${nDisc}<small>/${REGIONS.length}</small></b><span>régions</span></div><div class="rgbars"><span>Régions découvertes</span><span class="rgbar"><i style="width:${(nDisc / REGIONS.length * 100).toFixed(1)}%"></i></span><span>Spécialités : <b>${nGot}/${nRes}</b>${claim ? ` · <b class="rgcl">${claim} récompense${claim > 1 ? 's' : ''} !</b>` : ''}</span></div></div>`;
  h += rgDetail(RG[st.sel]);
  RG_GROUPS.forEach((g, gi) => {
    const list = REGIONS.filter(R => R.g === gi), d = list.filter(R => rgDiscovered(R.id)).length;
    h += `<h3 class="rgh">${esc(g)} <small>${d}/${list.length}</small></h3><div class="rggrid">${list.map(rgTile).join('')}</div>`;
  });
  box.innerHTML = h;
}
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-rgsel],[data-rggo],[data-rgclaim],[data-rgopen]'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.rgsel) { rgState().sel = d.rgsel; save(); renderPanel(); const c = document.querySelector('#panelBody .rgd'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
  if (d.rggo) { regionGo(d.rggo); return; }
  if (d.rgclaim) { rgClaim(d.rgclaim); return; }
  if (d.rgopen) { rgState().sel = d.rgopen; $('modal').hidden = true; sacView = 'reg'; tab = 'sac'; renderPanel(); $('panelBody').scrollTop = 0; return; }
});
// badge « Sac & Album » : une récompense de région à récupérer compte comme une collection complète
if (typeof renderNav === 'function') renderNav = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const n = REGIONS.filter(R => rgComplete(R) && !rgState().claimed[R.id]).length; if (!n) return r;
    const b = document.querySelector('#nav [data-nav="sac"]'); if (!b) return r;
    const i = b.querySelector('.tb'); if (i) i.textContent = (+i.textContent || 0) + n; else b.insertAdjacentHTML('beforeend', `<i class="tb">${n}</i>`);
  } catch (e) {}
  return r;
})(renderNav);

// ---------------- styles ----------------
(function rgCSS() {
  const st = document.createElement('style'); st.id = 'regionsCSS';
  st.textContent = `
.rgb{--sz:22px;display:inline-flex;align-items:center;justify-content:center;flex:none;width:var(--sz);height:var(--sz);border-radius:50%;background:var(--rg);border:2px solid var(--ink);box-shadow:inset 0 -3px 0 rgba(0,0,0,.14);font-style:normal}
.rgb svg{width:66%;height:66%;display:block}
.rgb.s{--sz:16px;border-width:1.5px;box-shadow:none}
.rgb.m{--sz:30px}
.rgb.l{--sz:40px;border-width:2.5px}
.rgb.xl{--sz:58px;border-width:3px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.14),0 3px 0 rgba(74,53,40,.35)}
.rgb.lk{background:#cfc5b4;border-color:#9a8a76}
.rgp{display:inline-flex;align-items:center;gap:4px;max-width:100%;align-self:flex-start;background:color-mix(in srgb,var(--rg) 14%,#fff);border:1.5px solid color-mix(in srgb,var(--rg) 55%,#fff);border-radius:999px;padding:1px 8px 1px 2px;margin:2px 0 1px;font:700 11.5px/16px var(--body);color:var(--ink)!important;white-space:nowrap}
.rgp>span{overflow:hidden;text-overflow:ellipsis;min-width:0;color:var(--ink)!important;font-weight:700!important;font-size:11.5px!important}
.rgp.made{background:#fff8ea;border-style:dashed}
.hcard .rgp{align-self:center;font-size:10.5px;padding:0 6px 0 1px;margin-top:2px}
.hcard .rgp>span{font-size:10.5px!important}
.rgfo{display:flex;align-items:center;gap:9px;background:color-mix(in srgb,var(--rg) 12%,#fff);border:2px solid var(--rg);border-radius:14px;padding:6px 12px 6px 7px;max-width:100%;text-align:left}
.rgfo span{display:flex;flex-direction:column;min-width:0}
.rgfo b{font:800 15px/1.15 var(--display)}
.rgfo small{font:600 12px/1.25 var(--body);color:var(--ink2)}
.rgdesc{margin:2px 4px;font:italic 600 13px/1.35 var(--body);color:var(--ink2);text-align:center;max-width:340px}
.rgval{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.rgval i{font-style:normal;background:#fff3c4;border:1.5px solid #e3b94a;border-radius:999px;padding:1px 9px;font:700 12px/18px var(--body);color:#7a5a10}
.rgval i b{color:#b06a00}
.rgmk{background:#fff3c4;border-radius:999px;padding:0 5px;font:800 11px/16px var(--body);color:#8a6410;white-space:nowrap}
.rgban{display:flex;align-items:center;gap:10px;width:100%;margin:2px 0 8px;padding:7px 10px 7px 8px;border:2.5px solid var(--ink);border-radius:16px;background:color-mix(in srgb,var(--rg) 18%,#fff);box-shadow:0 3px 0 rgba(74,53,40,.3);cursor:pointer;text-align:left;color:var(--ink);font-family:var(--body)}
.rgban>span{flex:1;display:flex;flex-direction:column;min-width:0}
.rgban b{font:800 15.5px/1.15 var(--display)}
.rgban small{font:600 12px/1.3 var(--body);color:var(--ink2)}
.rgban em{font:800 12px var(--display);font-style:normal;background:#fff;border:2px solid var(--ink);border-radius:10px;padding:3px 8px 1px}
.rgban.new{background:linear-gradient(100deg,color-mix(in srgb,var(--rg) 30%,#fff),#fff3c4);animation:rgpop .6s cubic-bezier(.2,1.6,.4,1)}
.rgban.new .rgb{animation:rgspin 1.2s ease-out}
@keyframes rgpop{from{transform:scale(.85);opacity:0}}
@keyframes rgspin{from{transform:rotate(-200deg) scale(.4)}}
.rgdone{margin:8px 0 0;font:700 13px/1.35 var(--body);color:#8a6410;background:#fff3c4;border-radius:12px;padding:6px 10px}
/* aperçu avant de partir */
.cfreg{border-top:2px dashed #e7dcc4;padding-top:7px;display:flex;flex-direction:column;gap:6px}
.cfrh{display:flex;align-items:center;gap:8px}
.cfrh span{display:flex;flex-direction:column;min-width:0}
.cfrh b{font:800 14.5px/1.15 var(--display)}
.cfrh small{font:700 11.5px/1.25 var(--body);color:var(--ink2)}
.cfrs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cfrs>span{display:flex;align-items:center;gap:6px;min-width:0;background:color-mix(in srgb,var(--rg) 9%,#fff);border-radius:12px;padding:3px 6px 3px 3px}
.cfrs .cfic{width:36px;height:36px;border-radius:11px;background:#fffaf0;border:2.5px solid var(--rc);padding:4px;display:flex;flex:none}
.cfrs .cfic svg{width:100%;height:100%}
.cfrx{display:flex;flex-direction:column;min-width:0}
.cfrx em{font:700 12px/1.2 var(--body);font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cfrx i{font:800 10.5px var(--display);font-style:normal;color:var(--rc)}
/* atelier */
.filters .rgcf{display:inline-flex;align-items:center;gap:4px}
.rgmini{width:16px;height:16px}
.filters small.rgn{background:var(--rust);color:#fff;border-radius:999px;padding:0 6px;font-weight:800}
.rgintro{margin:0;font:600 13px/1.4 var(--body);color:var(--ink2)}
.rgrec{align-items:flex-start;background:linear-gradient(180deg,#fff,#fffaf0)}
.rgrec .rx{flex:1;min-width:0}
.rgstory{margin:3px 0 5px;font:italic 600 12.5px/1.35 var(--body);color:var(--ink2)}
.rging{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}
.rging li{display:inline-flex;align-items:center;gap:4px;background:#f6f0e4;border:1.5px solid #e3d3b2;border-radius:999px;padding:1px 8px 1px 2px;font:700 12px/18px var(--body);color:var(--ink2)}
.rging li.have{background:color-mix(in srgb,var(--rg,#5fbf7f) 16%,#fff);border-color:var(--rg,#5fbf7f);color:var(--ink)}
.rging li.rgcoin{padding-left:6px}
.rging li b{font:800 12px var(--display)}
.rgrec>button{align-self:center}
/* codex */
.rgsum{display:flex;align-items:center;gap:12px;background:#fff;border:2.5px solid var(--ink);border-radius:18px;padding:8px 12px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.rgbig{display:flex;flex-direction:column;align-items:center;line-height:1}
.rgbig b{font:800 34px/1 var(--display);color:var(--teal)}
.rgbig b small{font-size:18px;color:var(--ink2)}
.rgbig span{font:800 12px var(--display);color:var(--ink2);text-transform:uppercase;letter-spacing:.06em}
.rgbars{flex:1;display:flex;flex-direction:column;gap:3px;font:600 12.5px/1.25 var(--body);color:var(--ink2);min-width:0}
.rgbar{display:block;height:10px;border-radius:999px;background:#efe6d2;border:2px solid var(--ink);overflow:hidden}
.rgbar i{display:block;height:100%;background:linear-gradient(90deg,#5fbf7f,#f2c14e);border-radius:999px}
.rgcl{color:var(--rust)}
.rgd{background:color-mix(in srgb,var(--rg) 10%,#fff);border:2.5px solid var(--ink);border-radius:20px;padding:12px;display:flex;flex-direction:column;gap:9px;box-shadow:0 4px 0 color-mix(in srgb,var(--rg) 60%,var(--ink))}
.rgd.lock{background:#f6f1e7}
.rgdh{display:flex;gap:11px;align-items:center}
.rgdh>div{min-width:0}
.rgdh h3{margin:0;font:800 20px/1.1 var(--display)}
.rgdh p{margin:2px 0 0;font:italic 600 13px/1.35 var(--body);color:var(--ink2)}
.rgk{font:800 11px var(--display);text-transform:uppercase;letter-spacing:.06em;color:color-mix(in srgb,var(--rg) 70%,var(--ink))}
.rgchips{display:flex;flex-wrap:wrap;gap:5px}
.rgchips span{background:#fff;border:2px solid var(--ink);border-radius:999px;padding:0 9px;font:800 12.5px/20px var(--display)}
.rgres{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.rgr{display:flex;align-items:center;gap:7px;background:#fff;border:1.5px solid var(--line);border-left:4px solid var(--rc);border-radius:12px;padding:4px 7px 4px 4px;min-width:0;position:relative}
.rgri{width:36px;height:36px;flex:none;border-radius:10px;background:#fffaf0;padding:4px;display:flex}
.rgri svg{width:100%;height:100%}
.rgr:not(.got) .rgri svg{filter:brightness(0) opacity(.18)}
.rgr:not(.got){background:#faf6ee}
.rgrx{display:flex;flex-direction:column;min-width:0}
.rgrx b{font:700 13px/1.2 var(--body);overflow:hidden;text-overflow:ellipsis}
.rgr:not(.got) .rgrx b{color:#b3a48e;letter-spacing:.1em}
.rgrx i{font:800 10.5px var(--display);font-style:normal;color:var(--rc)}
.rgr em{position:absolute;right:6px;top:3px;font:800 11px var(--display);font-style:normal;color:var(--ink2)}
.rgrew{display:flex;align-items:center;gap:9px;background:#fff;border:2px dashed #d9c49a;border-radius:14px;padding:6px 9px 6px 6px}
.rgrew.ready{border:2.5px solid var(--gold);background:#fff8dc;animation:rgglow 1.1s ease-in-out infinite alternate}
.rgrew.claimed{border-style:solid;border-color:var(--green);background:#eef8ef}
@keyframes rgglow{to{box-shadow:0 0 0 5px rgba(246,196,69,.35)}}
.rgrew>span:nth-child(2){flex:1;display:flex;flex-direction:column;min-width:0}
.rgrew b{font:800 13.5px/1.2 var(--display)}
.rgrew small{font:600 11.5px/1.3 var(--body);color:var(--ink2)}
.rgmed{width:36px;height:36px;flex:none;display:flex}
.rgmed svg{width:100%;height:100%}
.rgrew:not(.ready):not(.claimed) .rgmed svg{filter:grayscale(1) opacity(.5)}
.rgcnt{font:800 14px var(--display);color:var(--ink2)}
.rgh{display:flex;align-items:baseline;gap:6px;margin:6px 0 -2px}
.rgh small{font:700 12.5px var(--display);color:var(--ink2)}
.rggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:7px}
.rgt{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px 6px;background:#fff;border:2px solid var(--ink);border-radius:16px;box-shadow:0 3px 0 rgba(74,53,40,.3);cursor:pointer;color:var(--ink);font-family:var(--body);min-width:0}
.rgt:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(74,53,40,.3)}
.rgt b{font:800 13px/1.1 var(--display);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rgt small{font:700 10.5px/1.1 var(--body);color:var(--ink2)}
.rgt.disc{background:color-mix(in srgb,var(--rg) 12%,#fff)}
.rgt.lock{background:#f3eee4;border-color:#b9ad9a;box-shadow:0 3px 0 rgba(74,53,40,.15)}
.rgt.lock b{color:#9a8a76}
.rgt.on{outline:3px solid var(--teal);outline-offset:2px}
.rgt.done{background:linear-gradient(180deg,#fff8dc,color-mix(in srgb,var(--rg) 14%,#fff))}
.rgdots{display:flex;gap:3px}
.rgdots i{width:7px;height:7px;border-radius:50%;background:#e3d8c4;border:1px solid rgba(74,53,40,.25)}
.rgdots i.on{background:var(--rg);border-color:var(--ink)}
.rgt .rgbang,.rgt .rgstar{position:absolute;top:-6px;right:-5px;width:20px;height:20px;border-radius:50%;border:2px solid var(--ink);font:800 12px/16px var(--display);font-style:normal;text-align:center;z-index:1}
.rgt .rgbang{background:var(--rust);color:#fff;animation:pulse .8s infinite alternate}
.rgt .rgstar{background:var(--gold);color:var(--ink)}
.rgd [data-rggo]{white-space:normal;text-align:center;height:auto;line-height:1.2;text-wrap:balance;padding-top:10px;padding-bottom:10px}
.bi.mk3 .mkl{display:none}
@media (max-width:560px){.bi.mk3{row-gap:6px}.bi.mk3 .itx b{font-size:14.5px}.bi.mk3 .acts{flex:1 1 100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.bi.mk3 .acts button{flex-direction:column;justify-content:center;gap:0;padding:5px 4px;line-height:1.15}.bi.mk3 .mkl{display:block;font:700 11px/1.2 var(--body);color:#5a7a70}}
@media (max-width:420px){.rggrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.rgt b{font-size:12px}.rgres{grid-template-columns:1fr 1fr}.rgrx b{font-size:12px}.rgdh h3{font-size:18px}.rgb.xl{--sz:50px}.cfrs{grid-template-columns:1fr}}
`;
  document.head.appendChild(st);
})();

// ---------------- outils de test ----------------
window.__regions = { api: () => ({ S, plan, PLACES, startTrip, tick, collect, selectComp, openSheet, renderPanel, craft, canCraft, openFiche, value, RECIPES, $, setCraftFilter: v => { craftFilter = v; }, setMktView: v => { mktView = v; } }), REGIONS, RG, RG_RES, RG_RECIPES, regionAt, originOf, valueBonus, rgState, regionGo, rgClaim, rgResChances, rgPickRes, give(rid, n = 1) { const x = RG_RES[rid]; for (let i = 0; i < n; i++) { const it = rgMakeRes(x, RG[x.region].anchor[2], [], { place: RG[x.region].anchor[2], km: kmBetween(homeObj(), { lon: RG[x.region].anchor[0], lat: RG[x.region].anchor[1] }) }); S.inv.push(it); rgState().got[rid] = (rgState().got[rid] || 0) + 1; } save(); } };

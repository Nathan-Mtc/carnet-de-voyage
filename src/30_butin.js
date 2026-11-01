// ================= BUTIN v16 : chaque lieu est (presque) unique, partir loin vaut le coup =================
// Le joueur : « pourquoi partir si on a les mêmes items ? Chaque lieu doit être quasi unique, sans créer une infinité de contenu à la main ».
// 1. Carte d'identité procédurale d'un lieu (graine = id + nom + ville + région) : 1-2 spécialités maison, un objet signature rare,
//    un accessoire au style du lieu, une « humeur du jour ». Sous-type déduit de p.osm.subclass ou du nom (pizza, crêpe, sushi…).
// 2. Produits et noms locaux par pays (et par région en France) ; plus le lieu est loin et dépaysant, plus le butin change.
// 3. « Où le trouver » : section des fiches d'objets, recherche dans le Sac, commandes de la boutique et étapes des rêves.
// 4. Campagne : fermes, bois, champs, rivières, chapelles, lavoirs donnent des objets de terroir de la région.
// Tout passe par des enveloppes (lootFor, eventPlace, poiDest, openFiche, renderBag, liveFindHTML, bqReqWhere, bqStepFor,
// srcStep, goDreamStep) : les fichiers des autres agents ne sont pas modifiés.

// ---------------- hasard déterministe ----------------
function btHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function btRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const btPick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
const btNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
// « de La Bella Napoli », « du Comptoir », « d’Au Bon Pain »
function btDe(P) {
  P = String(P || '');
  if (/^Le /.test(P)) return 'du ' + P.slice(3);
  if (/^Les /.test(P)) return 'des ' + P.slice(4);
  if (/^[AEIOUYÉÈÊHaeiouyéèê]/.test(P) && !/^(Hu|Ha|He|Ho)/.test(P)) return 'd’' + P;
  return 'de ' + P;
}
const BT_PAL = ['#e5584f', '#f2a03a', '#f2c14e', '#7fae4f', '#4f9f78', '#4fb3d9', '#4f88cf', '#7a6fb8', '#b07ccf', '#e07a9a', '#c98f4f', '#9c6b4a', '#f6a6c1', '#9fd8f0', '#c9b8ea', '#a8b45a'];
const BT_SUBCOL = { pain: '#e3b06b', sucre: '#e9a0b0', boisson: '#9c6b4a', plat: '#d9733f', legume: '#7fae4f', fruit: '#e5584f', fromage: '#f2d06b', mer: '#5f87a8', pomme: '#e5584f', agrume: '#f2b13e', glace: '#f6a6c1',
  fleur: '#e07a9a', feuille: '#7fae4f', mousse: '#5fa274', champignon: '#c98f4f', pierre: '#a9a49a', sable: '#f2cf9a', coquillage: '#f3d6c8', plume: '#f4f1ea', papier: '#efe2c4', tissu: '#c9b8ea', metal: '#b9c4cc', verre: '#9fd8f0', bois: '#a9784f', laine: '#f4f0e6', cristal: '#bfe3f0', graine: '#b07a4f', ble: '#e3c06b', farine: '#f6efe0' };
const BT_NSUB = ['pain', 'sucre', 'boisson', 'plat', 'legume', 'fruit', 'fromage', 'mer', 'pomme', 'agrume', 'glace'];
const btCatOf = sub => (BT_NSUB.includes(sub) ? 'n' : typeof PLACEMENT !== 'undefined' && PLACEMENT[sub] ? 'd' : 'm');
const btCol = (sub, seed) => BT_SUBCOL[sub] || BT_PAL[seed % BT_PAL.length];

// ================= DONNÉES : pays =================
// listes : « Nom|rareté » (pain, sucre, boisson, plat) ; « Nom|sous-type|rareté » (prod, nature, artisan) ; « Nom|emplacement|forme|rareté » (vet)
// fs / fp / fn : parfums sucrés, salés, et qualificatifs « nature » pour les spécialités maison. loc : noms locaux des objets ordinaires (BT_LOC_KEYS).
const BT_LOC_KEYS = ['Baguette tradition', 'Croissant au beurre', 'Pain au chocolat', 'Café crème', 'Chocolat chaud du café', 'Plat du jour', 'Soupe à l’oignon', 'Glace vanille', 'Tomate du marché', 'Madeleine'];
const BT_PAYS = {
  ITA: { n: 'Italie', fs: 'à la pistache de Sicile|au limoncello|à la ricotta|façon tiramisu', fp: 'au pesto|à la burrata|à la truffe d’Ombrie|au basilic', fn: 'd’olivier|de citronnier|de cyprès',
    pain: 'Focaccia|0;Ciabatta|0;Grissini|0;Panettone|1', sucre: 'Cornetto alla crema|0;Cannolo sicilien|1;Sfogliatella|1;Biscotti|0', boisson: 'Espresso|0;Cappuccino|0;Granita al limone|1', plat: 'Risotto|0;Lasagne|0;Gnocchi|1;Arancini|1',
    prod: 'Mozzarella di bufala|fromage|1;Tomates San Marzano|legume|0;Citron d’Amalfi|agrume|1;Parmesan affiné|fromage|1', nature: 'Feuille d’olivier|feuille|0;Pomme de pin parasol|graine|0;Éclat de marbre de Carrare|pierre|2',
    artisan: 'Masque de Venise|statue|2;Carte postale de la Riviera|papier|0;Perle de verre de Murano|verre|1', vet: 'Foulard en soie de Côme|cou|foulard|2;Chapeau de gondolier|tete|chapeau|1',
    loc: 'Pane casereccio|Cornetto|Saccottino al cioccolato|Cappuccino|Cioccolata calda|Piatto del giorno|Minestrone|Gelato alla vaniglia|Pomodoro del mercato|Amaretto' },
  ESP: { n: 'Espagne', fs: 'à la crème catalane|au turrón|à la fleur d’oranger', fp: 'au chorizo|au safran|à l’aïoli|au jambon ibérique', fn: 'd’oranger|d’amandier',
    pain: 'Pan con tomate|0;Ensaïmada|1', sucre: 'Churros|0;Turrón|1;Polvorón|0', boisson: 'Café con leche|0;Chocolate caliente|0;Horchata|1', plat: 'Paella|1;Tortilla de patatas|0;Tapas variées|0;Gazpacho|0',
    prod: 'Orange de Valence|agrume|0;Manchego|fromage|1;Olives de Séville|legume|0', nature: 'Fleur d’oranger|fleur|0;Coquille de pèlerin|coquillage|1', artisan: 'Éventail peint|papier|1;Azulejo de Séville|pierre|1;Castagnettes|bois|1',
    vet: 'Mantille en dentelle|cou|foulard|2;Espadrilles|pieds|chaussettes|0', loc: 'Barra de pan|Cruasán|Napolitana de chocolate|Café con leche|Chocolate caliente|Menú del día|Sopa de ajo|Helado de vainilla|Tomate del mercado|Magdalena' },
  GBR: { n: 'Royaume-Uni', fs: 'à la confiture de fraise|au toffee|au lemon curd', fp: 'à la sauce menthe|au cheddar|au haddock', fn: 'de bruyère|de lande',
    pain: 'Crumpet|0;Scone|0;Muffin anglais|0', sucre: 'Shortbread|0;Sticky toffee pudding|1;Victoria sponge|1', boisson: 'Thé à la crème|0;Earl Grey|0;Thé au lait|0', plat: 'Fish and chips|0;Shepherd’s pie|1;Full breakfast|0',
    prod: 'Cheddar affiné|fromage|1;Marmelade d’orange|agrume|0', nature: 'Brin de bruyère|fleur|0;Galet de Cornouailles|pierre|0', artisan: 'Théière fleurie|bocal|1;Timbre de collection|papier|1;Tartan écossais|tissu|2',
    vet: 'Casquette en tweed|tete|casquette|1;Bottes de pluie|pieds|bottes|0;Kilt tartan|bas|jupe|2', loc: 'Bloomer loaf|Croissant|Chocolate twist|White coffee|Hot chocolate|Daily special|Onion soup|Vanilla ice cream|Market tomato|Fairy cake' },
  DEU: { n: 'Allemagne', fs: 'à la cannelle|à la cerise noire|au pavot', fp: 'au chou rouge|à la moutarde douce|au cumin', fn: 'de sapin|de tilleul',
    pain: 'Bretzel|0;Pain de seigle|0;Pumpernickel|1', sucre: 'Forêt-Noire|1;Strudel aux pommes|0;Stollen|1;Lebkuchen|0', boisson: 'Café filtre|0;Schorle de pomme|0', plat: 'Currywurst|0;Spätzle|0;Schnitzel|1',
    prod: 'Choucroute|legume|0;Saucisse de Nuremberg|plat|0', nature: 'Aiguille de sapin|feuille|0;Pomme de pin de Bavière|graine|0', artisan: 'Coucou de la Forêt-Noire|statue|2;Casse-noisette en bois|statue|1;Boule de Noël soufflée|verre|1',
    vet: 'Chapeau tyrolien|tete|chapeau|1;Gilet en loden|haut|pull|1', loc: 'Bauernbrot|Hörnchen|Schokocroissant|Milchkaffee|Heiße Schokolade|Tagesgericht|Zwiebelsuppe|Vanilleeis|Markttomate|Butterkuchen' },
  CHE: { n: 'Suisse', fs: 'au chocolat suisse|à la meringue|à la crème double', fp: 'à la raclette|au gruyère|façon fondue', fn: 'd’edelweiss|d’alpage',
    pain: 'Tresse au beurre|0;Pain de seigle valaisan|1', sucre: 'Läckerli|0;Meringue double-crème|1;Carac|0', boisson: 'Chocolat chaud au malt|0;Thé des Alpes|0', plat: 'Rösti|0;Fondue moitié-moitié|1;Raclette|1',
    prod: 'Gruyère d’alpage|fromage|1;Vacherin|fromage|1', nature: 'Edelweiss|fleur|2;Cristal de roche|cristal|2', artisan: 'Cloche de vache|metal|1;Rouage d’horloger|metal|2;Couteau de poche miniature|metal|1',
    vet: 'Gilet brodé d’edelweiss|haut|pull|2;Moufles des Alpes|mains|moufles|1', loc: 'Pain bis|Gipfeli|Pain au chocolat suisse|Café renversé|Chocolat chaud suisse|Assiette du jour|Soupe à l’orge|Glace à la crème|Tomate du Valais|Biscôme' },
  BEL: { n: 'Belgique', fs: 'au spéculoos|au sucre perlé|à la cassonade', fp: 'à la bière brune|au fromage de Herve|aux chicons', fn: 'de houblon',
    pain: 'Cramique|0;Craquelin|1', sucre: 'Gaufre de Liège|0;Spéculoos|0;Praline belge|1', boisson: 'Chocolat chaud belge|0;Café liégeois|1', plat: 'Frites en cornet|0;Moules-frites|1;Carbonnade flamande|1;Waterzooi|1',
    prod: 'Chicons|legume|0;Fromage de Herve|fromage|1', nature: 'Cône de houblon|fleur|0', artisan: 'Dentelle de Bruges|tissu|2;Planche de BD|papier|1;Marionnette liégeoise|statue|1',
    vet: 'Écharpe des Diables rouges|cou|echarpe|1', loc: 'Pain gris|Croissant|Couque au chocolat|Café crème belge|Chocolat chaud belge|Plat du jour bruxellois|Soupe aux chicons|Glace vanille de Bruges|Tomate crevette|Cougnou' },
  PRT: { n: 'Portugal', fs: 'à la cannelle|au porto|façon pastel de nata', fp: 'à la morue|au piri-piri|au chouriço', fn: 'de liège|d’eucalyptus',
    pain: 'Pão de Deus|0;Broa de milho|0', sucre: 'Pastel de nata|0;Bola de Berlim|0;Ovos moles|1', boisson: 'Bica|0;Galão|0', plat: 'Bacalhau|1;Caldo verde|0;Bifana|0;Sardines grillées|0',
    prod: 'Sardines en boîte|mer|0;Fromage de Serra|fromage|1', nature: 'Écorce de liège|bois|0;Coquillage de l’Algarve|coquillage|0', artisan: 'Azulejo bleu|pierre|1;Coq de Barcelos|statue|1;Guitare portugaise miniature|statue|2',
    vet: 'Écharpe de fado|cou|echarpe|1', loc: 'Pão|Croissant português|Pão de chocolate|Galão|Chocolate quente|Prato do dia|Sopa de cebola|Gelado de baunilha|Tomate do mercado|Queque' },
  GRC: { n: 'Grèce', fs: 'au miel de thym|à la pistache d’Égine|au yaourt grec', fp: 'à la feta|à l’origan|aux olives de Kalamata', fn: 'd’olivier|de bougainvillier',
    pain: 'Koulouri|0;Pita|0', sucre: 'Baklava|1;Loukoumades|0;Galaktoboureko|1', boisson: 'Frappé|0;Café grec|0', plat: 'Moussaka|1;Souvlaki|0;Salade grecque|0;Spanakopita|0',
    prod: 'Feta|fromage|0;Olives de Kalamata|legume|0;Miel de thym|sucre|1', nature: 'Branche d’olivier|feuille|0;Pierre blanche des Cyclades|pierre|1;Éponge de la mer Égée|coquillage|1',
    artisan: 'Amphore miniature|bocal|2;Œil porte-bonheur|verre|1;Fragment de colonne|pierre|2', vet: 'Sandales de Santorin|pieds|chaussettes|1;Couronne d’olivier|tete|couronne|2',
    loc: 'Psomi|Kroisan|Kroisan sokolata|Freddo cappuccino|Zesti sokolata|Piato imeras|Soupa|Pagoto vanilia|Ntomata agoras|Koulouraki' },
  JPN: { n: 'Japon', fs: 'au matcha|au yuzu|au sésame noir|à la fleur de cerisier|au haricot rouge', fp: 'au miso|au shiso|à la sauce teriyaki|au wasabi', fn: 'de cerisier|de bambou|d’érable momiji',
    pain: 'Melon pan|0;Pain au curry|0;Shokupan|0', sucre: 'Mochi|0;Dorayaki|0;Taiyaki|0;Wagashi de saison|1', boisson: 'Thé matcha|0;Café glacé de kissaten|0;Ramune|0', plat: 'Bol de ramen|0;Onigiri|0;Bento|0;Okonomiyaki|1',
    prod: 'Riz japonais|legume|0;Yuzu|agrume|1;Wasabi frais|legume|1', nature: 'Pétale de cerisier|fleur|0;Feuille de momiji|feuille|0;Pousse de bambou|feuille|0',
    artisan: 'Maneki-neko|statue|1;Daruma|statue|1;Papier washi|papier|1;Lanterne de papier|lanterne|2', vet: 'Yukata d’été|haut|tshirt|2;Geta en bois|pieds|bottes|1;Furoshiki|cou|foulard|0',
    loc: 'Shokupan|Kurowassan|Choko kurowassan|Kafe ore|Hotto chokoreto|Higawari teishoku|Miso shiru|Banira aisu|Tomato du marché|Kasutera' },
  CHN: { n: 'Chine', fs: 'au sésame|à la pâte de lotus|au gingembre confit', fp: 'au poivre du Sichuan|à la sauce soja|aux cinq épices', fn: 'de pivoine|de bambou|de lotus',
    pain: 'Mantou|0;Baozi|0', sucre: 'Gâteau de lune|1;Tanghulu|0;Tartelette aux œufs|0', boisson: 'Thé oolong|0;Thé au jasmin|0;Thé aux perles|0', plat: 'Raviolis jiaozi|0;Canard laqué|2;Nouilles tirées|0;Dim sum|0',
    prod: 'Litchis|fruit|0;Thé pu-erh|boisson|1', nature: 'Feuille de bambou|feuille|0;Fleur de lotus|fleur|1;Jade brut|pierre|2', artisan: 'Lanterne rouge|lanterne|1;Éventail de soie|tissu|1;Bol en porcelaine bleue|bocal|2;Papier découpé|papier|0',
    vet: 'Veste en soie brodée|haut|pull|2;Chaussons de kung-fu|pieds|chaussettes|0', loc: 'Mianbao|Kesong|Qiaokeli mianbao|Natie|Re qiaokeli|Jinri tecai|Tang du jour|Xiangcao bingqilin|Xihongshi|Jidan gao' },
  KOR: { n: 'Corée', fs: 'au sésame grillé|à la patate douce|au yuja|au haricot rouge', fp: 'au kimchi|au gochujang|à l’ail noir', fn: 'de mugunghwa|de ginkgo',
    pain: 'Pain au lait de Séoul|0;Gyeran-ppang|0', sucre: 'Hotteok|0;Bungeoppang|0;Tteok de riz|0', boisson: 'Thé au yuja|0;Latte de Séoul|0;Sikhye|1', plat: 'Bibimbap|0;Tteokbokki|0;Kimbap|0;Poulet frit coréen|1',
    prod: 'Kimchi maison|legume|0;Ginseng rouge|legume|2', nature: 'Feuille de ginkgo|feuille|0;Fleur de mugunghwa|fleur|1', artisan: 'Éventail hanji|papier|1;Céladon miniature|bocal|2;Masque de Hahoe|statue|2',
    vet: 'Hanbok de fête|haut|pull|2;Bonnet de Séoul|tete|bonnet|1', loc: 'Ppang|Keurowasang|Chokolet keurowasang|Kape rate|Hat chokolet|Oneurui menyu|Guk du jour|Banilla aiseukeurim|Tomato|Kasutera' },
  IND: { n: 'Inde', fs: 'à la cardamome|au safran|à la mangue|à l’eau de rose', fp: 'au curry|façon tandoori|au garam masala|à la coriandre', fn: 'de lotus|de jasmin|de souci',
    pain: 'Naan au fromage|0;Chapati|0;Paratha|0', sucre: 'Gulab jamun|0;Ladoo|0;Jalebi|0;Kulfi|1', boisson: 'Masala chai|0;Lassi à la mangue|0', plat: 'Dal|0;Biryani|1;Samoussas|0;Thali|1',
    prod: 'Mangue Alphonso|fruit|1;Épices du bazar|graine|0;Paneer|fromage|0', nature: 'Guirlande de soucis|fleur|0;Fleur de lotus|fleur|1', artisan: 'Éléphant sculpté|statue|1;Tissu imprimé au bloc|tissu|1;Lampe à huile diya|lanterne|1',
    vet: 'Sari de soie|haut|pull|2;Bracelets de verre|mains|gants|1', loc: 'Pav|Croissant de Bombay|Chocolate puff|Masala coffee|Garam chocolate|Thali du jour|Shorba|Kulfi vanille|Tamatar|Nankhatai' },
  MAR: { n: 'Maroc', fs: 'à la fleur d’oranger|au miel et sésame|aux dattes|aux amandes', fp: 'au ras-el-hanout|au citron confit|au cumin', fn: 'd’arganier|de rose du Dadès',
    pain: 'Khobz|0;Msemen|0;Harcha|0', sucre: 'Corne de gazelle|1;Chebakia|0;Makrout|0', boisson: 'Thé à la menthe|0;Jus d’orange de Marrakech|0', plat: 'Tajine|1;Couscous|0;Pastilla|1;Harira|0',
    prod: 'Dattes Medjool|fruit|0;Huile d’argan|fruit|1;Olives au citron|legume|0', nature: 'Rose du Dadès|fleur|1;Sable du désert|sable|0', artisan: 'Lanterne ciselée|lanterne|2;Tapis berbère|tapis|2;Poterie de Safi|bocal|1',
    vet: 'Babouches|pieds|chaussettes|1;Djellaba douce|haut|sweat|1', loc: 'Khobz|Croissant du souk|Pain au chocolat|Café nous-nous|Chocolat chaud|Plat du jour|Harira|Glace vanille|Tomate du souk|Ghriba' },
  EGY: { n: 'Égypte', fs: 'au sésame|aux dattes|au miel du Nil', fp: 'au cumin|à la sauce tahini|aux fèves', fn: 'de papyrus|de lotus bleu',
    pain: 'Aish baladi|0;Feteer|1', sucre: 'Basbousa|0;Konafa|1;Om Ali|1', boisson: 'Thé à l’hibiscus|0;Jus de canne|0', plat: 'Koshari|0;Ta’ameya|0;Ful medames|0',
    prod: 'Dattes du Nil|fruit|0;Fèves|legume|0', nature: 'Feuille de papyrus|papier|1;Sable du désert|sable|0;Lotus bleu|fleur|2', artisan: 'Scarabée porte-bonheur|statue|1;Petite pyramide|statue|1;Lanterne de Ramadan|lanterne|1',
    vet: 'Foulard du Nil|cou|foulard|1;Galabeya|haut|tshirt|1', loc: 'Aish|Croissant du Caire|Pain au chocolat|Ahwa|Chocolat chaud|Plat du jour|Shorba|Glace vanille|Tomate du marché|Ghorayeba' },
  USA: { n: 'États-Unis', fs: 'au beurre de cacahuète|au sirop d’érable|à la myrtille|façon cheesecake', fp: 'au barbecue|au cheddar|aux jalapeños', fn: 'de séquoia|de magnolia',
    pain: 'Bagel|0;Pretzel moelleux|0;Corn bread|0', sucre: 'Donut|0;Brownie|0;Cookie géant|0;Tarte à la citrouille|1', boisson: 'Milkshake|0;Root beer|0;Café allongé|0', plat: 'Burger|0;Hot-dog|0;Mac and cheese|0;Pancakes|0',
    prod: 'Myrtilles|fruit|0;Beurre de cacahuète|sucre|0', nature: 'Cône de séquoia|graine|1;Feuille d’érable rouge|feuille|0', artisan: 'Plaque d’immatriculation|metal|1;Jukebox miniature|statue|2;Carte postale de la Route 66|papier|0',
    vet: 'Casquette de baseball|tete|casquette|0;Chemise à carreaux|haut|sweat|1;Bottes de cow-boy|pieds|bottes|2', loc: 'Sourdough bread|Croissant|Chocolate croissant|Latte|Hot cocoa|Daily special|Onion soup|Vanilla ice cream|Farmers market tomato|Cupcake' },
  CAN: { n: 'Canada', fs: 'au sirop d’érable|au caramel|aux bleuets', fp: 'façon poutine|au saumon fumé|au fromage en grains', fn: 'd’érable|de bouleau',
    pain: 'Bagel de Montréal|0;Pain banique|1', sucre: 'Queue de castor|0;Tarte au sucre|0;Barre Nanaimo|1;Tire d’érable|1', boisson: 'Café double-double|0;Chocolat chaud à l’érable|0', plat: 'Poutine|0;Tourtière|1;Fèves au lard|0',
    prod: 'Sirop d’érable|sucre|1;Bleuets sauvages|fruit|0;Saumon fumé|mer|1', nature: 'Feuille d’érable rouge|feuille|0;Écorce de bouleau|bois|0;Plume de huard|plume|2', artisan: 'Inukshuk miniature|statue|2;Raquette à neige miniature|bois|1',
    vet: 'Tuque à pompon|tete|bonnet|0;Chemise de bûcheron|haut|sweat|1;Mitaines|mains|moufles|0', loc: 'Pain de ménage|Croissant|Chocolatine|Café au lait|Chocolat chaud|Spécial du jour|Soupe aux pois|Crème glacée vanille|Tomate du marché|Galette à la mélasse' },
  MEX: { n: 'Mexique', fs: 'à la cannelle|au dulce de leche|à la goyave|au cacao', fp: 'au mole|au chipotle|à la coriandre|à l’avocat', fn: 'de cactus|d’œillet d’Inde',
    pain: 'Concha|0;Pan de muerto|1;Tortilla de maïs|0', sucre: 'Churro mexicain|0;Alegría|0;Flan au caramel|0', boisson: 'Champurrado|0;Horchata|0;Agua de jamaica|0', plat: 'Tacos al pastor|0;Guacamole|0;Tamales|0;Enchiladas|1',
    prod: 'Avocat|fruit|0;Piment|legume|0;Cacao cru|graine|1', nature: 'Fleur de cempasúchil|fleur|1;Raquette de cactus|feuille|0', artisan: 'Alebrije peint|statue|2;Piñata miniature|papier|1;Papel picado|papier|0;Crâne en sucre|statue|1',
    vet: 'Sombrero brodé|tete|chapeau|1;Poncho rayé|dos|cape|1', loc: 'Bolillo|Cuernito|Pan de chocolate|Café de olla|Chocolate caliente|Comida corrida|Sopa de cebolla|Nieve de vainilla|Jitomate del mercado|Mantecada' },
  BRA: { n: 'Brésil', fs: 'au fruit de la passion|à la noix de coco|façon brigadeiro|à l’açaï', fp: 'aux haricots noirs|au manioc|au lait de coco', fn: 'de palmier|d’orchidée',
    pain: 'Pão de queijo|0;Pão francês|0', sucre: 'Brigadeiro|0;Quindim|1;Bolo de rolo|1', boisson: 'Cafezinho|0;Jus de goyave|0;Guaraná|0', plat: 'Feijoada|1;Coxinha|0;Moqueca|1',
    prod: 'Açaï|fruit|0;Noix du Brésil|graine|0;Mangue|fruit|0', nature: 'Plume de toucan|plume|2;Orchidée sauvage|fleur|1;Feuille de palmier|feuille|0', artisan: 'Ruban porte-bonheur|tissu|0;Tambour de samba|statue|1;Masque de carnaval|statue|2',
    vet: 'Tongs colorées|pieds|chaussettes|0;Coiffe de carnaval|tete|fleurs|2', loc: 'Pão francês|Croissant|Pão de chocolate|Café com leite|Chocolate quente|Prato feito|Caldo|Sorvete de baunilha|Tomate da feira|Bolinho' },
  PER: { n: 'Pérou', fs: 'à la lucuma|au chocolat de Cusco|au fruit de la passion', fp: 'au citron vert|au piment ají|au quinoa', fn: 'd’alpaga|de maïs violet',
    pain: 'Pan chuta|0;Pan de yema|0', sucre: 'Alfajor|0;Picarones|0;Suspiro limeño|1', boisson: 'Chicha morada|0;Infusion de muña|0', plat: 'Ceviche|1;Lomo saltado|0;Causa limeña|0',
    prod: 'Quinoa|graine|0;Pomme de terre violette|legume|0;Maïs géant|ble|0', nature: 'Laine d’alpaga|laine|1;Pierre inca|pierre|2', artisan: 'Flûte de Pan|bois|1;Retable d’Ayacucho|statue|2;Tissu andin|tissu|1',
    vet: 'Bonnet chullo|tete|bonnet|1;Poncho d’alpaga|dos|cape|2', loc: 'Pan francés|Cachito|Pan de chocolate|Café pasado|Chocolate caliente|Menú del día|Sopa criolla|Helado de vainilla|Tomate del mercado|Bizcocho' },
  AUS: { n: 'Australie', fs: 'à la macadamia|au fruit de la passion|façon lamington', fp: 'à la betterave|au barbecue', fn: 'd’eucalyptus|de mimosa',
    pain: 'Damper|0;Pain à la banane|0', sucre: 'Lamington|0;Pavlova|1;Biscuit Anzac|0', boisson: 'Flat white|0;Long black|0', plat: 'Meat pie|0;Avocado toast|0;Barbecue de plage|1',
    prod: 'Noix de macadamia|graine|0;Mangue de Bowen|fruit|1', nature: 'Feuille d’eucalyptus|feuille|0;Coquillage de la Grande Barrière|coquillage|1;Opale brute|cristal|3', artisan: 'Boomerang peint|bois|1;Didgeridoo miniature|bois|2',
    vet: 'Chapeau de brousse|tete|chapeau|1;Tongs de surf|pieds|chaussettes|0', loc: 'Sourdough|Croissant|Choc croissant|Flat white|Hot chocolate|Daily special|Pumpkin soup|Vanilla gelato|Market tomato|Lamington' },
  ISL: { n: 'Islande', fs: 'au skyr|à la réglisse|à la myrtille arctique', fp: 'à l’agneau fumé|au lichen', fn: 'de mousse arctique|de lupin',
    pain: 'Pain de seigle géothermal|1;Kleina|0', sucre: 'Snúður|0;Skyr à la myrtille|0', boisson: 'Café de Reykjavik|0;Chocolat chaud islandais|0', plat: 'Soupe d’agneau|0;Hot-dog islandais|0;Poisson séché|0',
    prod: 'Skyr|fromage|0;Morue séchée|mer|0', nature: 'Pierre de lave noire|pierre|0;Mousse arctique|mousse|0;Plume de macareux|plume|2;Sable noir|sable|1', artisan: 'Pelote de laine islandaise|laine|1;Rune gravée|pierre|2',
    vet: 'Pull islandais|haut|pull|2;Bonnet de Reykjavik|tete|bonnet|1', loc: 'Rúgbrauð|Smjördeigshorn|Súkkulaðihorn|Kaffi|Kakó|Réttur dagsins|Kjötsúpa|Vanilluís|Tómatur|Kleina' },
  NOR: { n: 'Norvège', fs: 'à la cardamome|au fromage brun|à la mûre arctique', fp: 'au saumon|à l’aneth', fn: 'de bouleau|de pin du Nord',
    pain: 'Lefse|0;Pain croustillant|0', sucre: 'Skolebrød|0;Kanelbolle|0;Krumkake|1', boisson: 'Café noir des fjords|0;Chocolat chaud|0', plat: 'Saumon fumé|0;Fårikål|1;Boulettes de poisson|0',
    prod: 'Fromage brun|fromage|1;Mûre arctique|fruit|1;Hareng mariné|mer|0', nature: 'Écorce de bouleau|bois|0;Bois de renne|bois|2;Galet des fjords|pierre|0', artisan: 'Troll sculpté|statue|1;Pelote à motif norvégien|laine|1',
    vet: 'Pull norvégien|haut|pull|2;Moufles à flocons|mains|moufles|1', loc: 'Brød|Croissant|Sjokoladecroissant|Kaffe med melk|Varm sjokolade|Dagens rett|Løksuppe|Vaniljeis|Tomat|Bolle' },
};
// pays voisins sans fiche : on emprunte celle d'un cousin (sinon : spécialités de la région du monde)
const BT_ISO_ALIAS = { AUT: 'DEU', LIE: 'CHE', IRL: 'GBR', IMN: 'GBR', SWE: 'NOR', DNK: 'NOR', FIN: 'NOR', FRO: 'ISL', LUX: 'BEL', AND: 'ESP', SMR: 'ITA', VAT: 'ITA', CYP: 'GRC', TWN: 'CHN', TUN: 'MAR', DZA: 'MAR', NZL: 'AUS' };

// ================= DONNÉES : France, région par région =================
// pain, plat : spécialités des commerces ; ter : terroir (fermes, champs, bois, rivières, chapelles, lavoirs)
const BT_FR = {
  ara: { fs: 'à la praline rose|à la noix|à la myrtille', fp: 'au saint-marcellin|à la tomme|aux herbes du coin', pain: 'Brioche aux pralines|1', plat: 'Gratin dauphinois|0', ter: 'Miel de châtaignier|sucre|0' }, // v19 : le détail est par zone (BT_ZONE)
  paca: { fs: 'à la lavande|au calisson|à la fleur de figuier', fp: 'au pistou|à la tapenade|aux herbes de Provence', pain: 'Fougasse|0;Pompe à l’huile|1', plat: 'Bouillabaisse|1;Ratatouille niçoise|0;Socca|0', ter: 'Brin de thym sauvage|feuille|0;Figue de Solliès|fruit|0;Miel de lavande|sucre|1;Cigale en céramique|statue|1' },
  bretagne: { fs: 'au caramel au beurre salé|au sarrasin|à la fraise de Plougastel', fp: 'au beurre salé|à l’andouille|aux algues', pain: 'Kouign-amann|1;Far breton|0', plat: 'Galette complète|0;Cotriade|1', ter: 'Galet de lande|pierre|0;Brin d’ajonc|fleur|0;Bolée de cidre doux|boisson|0;Artichaut de Saint-Pol|legume|0' },
  normandie: { fs: 'à la pomme|au caramel normand|à la crème d’Isigny', fp: 'au camembert|à la crème normande|au cidre doux', pain: 'Fallue|1;Teurgoule|0', plat: 'Moules à la normande|0;Tarte normande|0', ter: 'Lait de vache normande|boisson|0;Pomme d’api|pomme|0;Fleur de pommier|fleur|0' },
  grandest: { fs: 'à la mirabelle|à la bergamote de Nancy|au pain d’épices', fp: 'au munster|au lard fumé|à la choucroute', pain: 'Kougelhopf|1;Bretzel au beurre|0', plat: 'Tarte flambée|0;Quiche lorraine|0;Baeckeoffe|1', ter: 'Mirabelle cueillie|fruit|0;Feuille de houblon|feuille|0;Branche de sapin des Vosges|feuille|0' },
  idf: { fs: 'façon Paris-Brest|à la rose|au miel de Paris', fp: 'au brie de Meaux|à la moutarde de Meaux', pain: 'Baguette de concours|1;Opéra|1', plat: 'Croque-monsieur|0;Hachis parmentier|0', ter: 'Brie de Meaux|fromage|1;Champignon de Paris|champignon|0;Plume de pigeon de Paris|plume|0' },
  occitanie: { fs: 'à la violette de Toulouse|au miel des Cévennes|à la crème catalane', fp: 'au roquefort|à l’ail rose|au canard', pain: 'Fouace aveyronnaise|1;Croustade|1', plat: 'Cassoulet|1;Aligot|0', ter: 'Ail rose de Lautrec|legume|0;Châtaigne des Cévennes|fruit|0;Laine de brebis|laine|0' },
  naquitaine: { fs: 'au rhum vanillé|au chocolat de Bayonne|à la cerise d’Itxassou', fp: 'au piment d’Espelette|aux cèpes|au jambon de Bayonne', pain: 'Gâteau basque|1;Broye|0', plat: 'Garbure|0;Axoa|0', ter: 'Cèpe de Bordeaux|champignon|1;Résine de pin|bois|0;Noix du Périgord|fruit|0' },
  hdf: { fs: 'à la cassonade|à la chicorée|au sucre de betterave', fp: 'au maroilles|à la bière du Nord|au hareng', pain: 'Merveilleux|1;Tarte au sucre|0', plat: 'Welsh|0;Carbonade|1;Potjevleesch|1', ter: 'Betterave sucrière|legume|0;Fleur de lin bleu|fleur|0;Endive de pleine terre|legume|0' },
  bfc: { fs: 'au cassis|au pain d’épices de Dijon|à l’anis de Flavigny', fp: 'au comté|à la moutarde|au morbier', pain: 'Gougère|0;Galette comtoise|1', plat: 'Bœuf bourguignon|1;Œufs en meurette|0', ter: 'Feuille de vigne|feuille|0;Lait du Jura|boisson|0;Noisette sauvage|fruit|0' },
  pdl: { fs: 'au petit-beurre|à la fleur de sel|à la fraise nantaise', fp: 'au beurre blanc|à la mâche nantaise|au sel de Noirmoutier', pain: 'Gâteau nantais|1;Fouée|0', plat: 'Rillettes du Mans|0;Brochet au beurre blanc|1', ter: 'Mâche nantaise|legume|0;Fleur de sel|sable|0;Pomme de terre de Noirmoutier|legume|1' },
  cvl: { fs: 'façon tatin|au nougat de Tours|au miel de Sologne', fp: 'au chèvre|aux rillons|aux champignons de cave', pain: 'Tarte Tatin|1;Pithiviers|1', plat: 'Rillons de Tours|0;Matelote de Loire|1', ter: 'Champignon de cave|champignon|0;Crottin de chèvre|fromage|0;Fougère de Sologne|feuille|0' },
  corse: { fs: 'à la châtaigne corse|au brocciu|à la clémentine', fp: 'au figatellu|au brocciu|à la menthe sauvage', pain: 'Fiadone|1;Canistrelli|0', plat: 'Soupe corse|0;Civet de sanglier|1', ter: 'Branche de myrte|feuille|0;Châtaigne corse|fruit|0;Immortelle|fleur|1' },
};

// ================= v19 : DONNÉES par ZONE (départements) =================
// Une région, c'est grand : à Lyon on trouve des objets lyonnais, en Auvergne des objets auvergnats (zones : 17_regions.js, RG_ZONES).
// Même format que BT_PAYS ; les listes vont aux types de lieux par BT_LISTS (boulangerie : pain + sucre ; parc : nature ; boutique : artisan + vet…).
const BT_ZONE = {
  lyon: { fs: 'à la praline rose|façon coussin de Lyon|aux bugnes|au chocolat des Pentes', fp: 'à la lyonnaise|aux échalotes|au saint-marcellin|façon mâchon|aux herbes des Monts d’Or|à la cervelle de canut', fn: 'des quais du Rhône|de la Croix-Rousse|de Fourvière|des bords de Saône|du parc de la Tête d’Or',
    pain: 'Tarte à la praline|0;Brioche aux pralines|0;Bugnes lyonnaises|0;Pain lyonnais au levain|0;Ficelle aux gratons|0;Tarte au sucre lyonnaise|0;Brioche de Saint-Jean|1',
    sucre: 'Praline rose|0;Coussin de Lyon|1;Papillote lyonnaise|0;Bugne dorée|0;Quenelle en chocolat|1;Cocon de soie en pâte d’amande|1;Guimauve des Halles|0;Chocolat des Pentes|0',
    boisson: 'Café des Pentes|0;Sirop de cassis du Lyonnais|0;Jus de pomme des Monts du Lyonnais|0;Diabolo grenadine du bouchon|0;Chocolat chaud de la Croix-Rousse|0;Pot de limonade du bouchon|1',
    plat: 'Quenelle sauce Nantua|0;Salade lyonnaise|0;Saucisson brioché|0;Tablier de sapeur|1;Gratin de cardons|1;Andouillette lyonnaise|0;Gâteau de foies de volaille|1;Gratons lyonnais|0;Œuf en cocotte du mâchon|0;Oreiller de la Belle Aurore|2',
    prod: 'Saint-marcellin|fromage|0;Cervelle de canut|fromage|0;Rigotte de Condrieu|fromage|1;Saint-félicien|fromage|1;Rosette de Lyon|plat|0;Jésus de Lyon|plat|1;Cerises des Monts du Lyonnais|fruit|0;Cardon du Val de Saône|legume|1;Pomme des coteaux du Lyonnais|pomme|0;Échalotes des Halles|legume|0',
    nature: 'Feuille de platane des quais|feuille|0;Galet du Rhône|pierre|0;Plume de cygne de la Tête d’Or|plume|0;Rose de la roseraie|fleur|1;Marron d’Inde du parc|graine|0;Feuille de ginkgo du jardin botanique|feuille|1;Brin de buis de Fourvière|feuille|0;Plume de goéland du Rhône|plume|0;Fleur de lotus des grandes serres|fleur|2;Pierre dorée du Beaujolais|pierre|1',
    artisan: 'Soie des canuts|tissu|1;Marionnette de Guignol|statue|1;Marionnette de Gnafron|statue|2;Lumignon du 8 décembre|lanterne|0;Bobine de soie|tissu|0;Plaque de traboule|metal|1;Ticket de la ficelle|papier|0;Gravure de Fourvière|papier|0;Petit lion de Lyon|statue|1;Mouchoir de canut|tissu|0;Médaille de Fourvière|medaille|1;Pavé de la Croix-Rousse|pierre|0;Carte de la fresque des Lyonnais|papier|0;Navette de métier à tisser|bois|2',
    vet: 'Foulard de soie lyonnais|cou|foulard|1;Casquette de gone|tete|casquette|0;Tablier à carreaux du bouchon|haut|tshirt|0;Écharpe des canuts|cou|echarpe|1;Bonnet de la Croix-Rousse|tete|bonnet|0;Bicorne de Guignol|tete|chapeau|1' },
  alpes: { fs: 'à la myrtille des Alpes|à la noix de l’Isère|au miel de montagne|à la chartreuse sans alcool', fp: 'au reblochon|à la tomme de Savoie|au beaufort|au bleu du Vercors|aux diots', fn: 'd’alpage|des cimes|du lac d’Annecy|du Vercors',
    pain: 'Gâteau de Savoie|0;Pain de seigle des alpages|0;Tarte aux myrtilles|0;Brioche de Saint-Genix|1;Gâteau aux noix|1;Rissole savoyarde|0',
    sucre: 'Roseau du lac|1;Noix confite|0;Pâte de fruits à la myrtille|0;Bonbon des cimes|0;Galet en chocolat du lac|1',
    boisson: 'Lait d’alpage|0;Infusion de génépi|1;Jus de pomme de Savoie|0;Chocolat chaud du refuge|0',
    plat: 'Tartiflette|0;Fondue savoyarde|1;Raclette|0;Gratin dauphinois|0;Ravioles du Dauphiné|0;Croziflette|0;Diots de Savoie|0;Polenta du refuge|0',
    prod: 'Reblochon|fromage|0;Tomme de Savoie|fromage|0;Beaufort d’alpage|fromage|1;Bleu du Vercors|fromage|1;Abondance|fromage|1;Myrtilles des Alpes|fruit|0;Miel de montagne|sucre|0',
    nature: 'Brin de génépi|fleur|1;Edelweiss|fleur|2;Pierre de lauze|pierre|0;Pomme de pin d’arolle|graine|0;Plume de chocard|plume|0;Gentiane jaune|fleur|1;Galet du lac d’Annecy|pierre|0;Rhododendron des Alpes|fleur|0',
    artisan: 'Cloche de vache|metal|0;Cuillère en bois sculptée|bois|0;Marmotte en bois|statue|1;Carte de randonnée|papier|0;Bâton de berger|bois|0;Luge ancienne|bois|1;Chalet miniature|statue|2',
    vet: 'Bonnet de ski|tete|bonnet|0;Pull à edelweiss|haut|pull|1;Moufles savoyardes|mains|moufles|0;Chaussettes de rando|pieds|chaussettes|0' },
  auvergne: { fs: 'à la myrtille du Cantal|au miel d’Auvergne|à la verveine du Velay', fp: 'au bleu d’Auvergne|au cantal|au saint-nectaire|aux lentilles du Puy|à la fourme d’Ambert', fn: 'des volcans|des puys|des estives',
    pain: 'Pompe aux pommes|0;Cornet de Murat|1;Pain de seigle auvergnat|0;Tarte à la myrtille du Cantal|0',
    sucre: 'Pâte de fruits de Clermont|0;Miel de châtaignier|0;Cornet de Murat|1;Pastille à la verveine|0',
    boisson: 'Eau de source des volcans|0;Infusion de verveine du Velay|1;Lait des estives|0',
    plat: 'Truffade|0;Aligot|0;Potée auvergnate|0;Pounti|1;Chou farci|0;Salade de lentilles du Puy|0',
    prod: 'Cantal entre-deux|fromage|0;Saint-nectaire fermier|fromage|1;Salers|fromage|2;Fourme d’Ambert|fromage|1;Lentilles vertes du Puy|legume|0;Jambon d’Auvergne|plat|0;Myrtilles sauvages du Cantal|fruit|0',
    nature: 'Pouzzolane rouge|pierre|0;Fleur de gentiane|fleur|0;Brin de bruyère|fleur|0;Plume de milan royal|plume|1;Basalte des orgues|pierre|1;Arnica des montagnes|fleur|1',
    artisan: 'Dentelle du Puy|tissu|1;Couteau de Thiers miniature|metal|1;Cloche de Salers|metal|0;Statuette de vache Salers|statue|1;Carte des volcans|papier|0',
    vet: 'Béret auvergnat|tete|beret|0;Gilet de laine des Combrailles|haut|pull|1;Sabots de berger|pieds|bottes|0' },
  drome_ardeche: { fs: 'à la crème de marrons|au nougat|à l’abricot de la Drôme|à la pogne', fp: 'au picodon|à la caillette|aux ravioles|aux olives de Nyons', fn: 'des gorges|de la lavande de la Drôme|des châtaigneraies',
    pain: 'Pogne de Romans|0;Suisse de Valence|0;Tarte à la crème de marrons|0;Fougasse aux olives de Nyons|1',
    sucre: 'Nougat de Montélimar|0;Crème de marrons|0;Marron glacé|1;Abricot confit|0',
    boisson: 'Jus d’abricot de la Drôme|0;Sirop de châtaigne|0;Limonade des gorges|0',
    plat: 'Caillette ardéchoise|0;Ravioles de Romans|0;Bombine|1;Crique ardéchoise|0',
    prod: 'Picodon|fromage|0;Châtaignes d’Ardèche|fruit|0;Abricots de la Drôme|fruit|0;Olives de Nyons|fruit|1;Pêches de la vallée du Rhône|fruit|0;Truffe noire du Tricastin|champignon|2',
    nature: 'Brin de lavande de la Drôme|fleur|0;Galet de l’Ardèche|pierre|0;Feuille de châtaignier|feuille|0;Bogue de châtaigne|graine|0;Fossile des gorges|pierre|1;Plume de vautour des Baronnies|plume|1',
    artisan: 'Céramique de Dieulefit|statue|1;Panier en osier|bois|0;Carte des gorges|papier|0;Grotte peinte miniature|statue|2',
    vet: 'Chapeau de cueilleur d’abricots|tete|chapeau|0;Foulard provençal|cou|foulard|0;Sandales de canoë|pieds|chaussettes|0' },
  loire: { fs: 'au chocolat stéphanois|à la myrtille du Pilat', fp: 'à la fourme de Montbrison|à la râpée|au sarasson', fn: 'du Pilat|des gorges de la Loire|du Forez',
    pain: 'Brioche de la Loire|0;Tarte aux myrtilles du Pilat|0', sucre: 'Chocolat stéphanois|0;Barre de pâte de fruits du Forez|0',
    boisson: 'Eau minérale du Forez|0;Jus de pomme du Roannais|0', plat: 'Râpée stéphanoise|0;Barboton|0',
    prod: 'Fourme de Montbrison|fromage|1;Sarasson|fromage|0;Myrtilles du Pilat|fruit|0',
    nature: 'Bruyère du Pilat|fleur|0;Pierre des gorges de la Loire|pierre|0;Plume de héron de la Loire|plume|0',
    artisan: 'Ruban de Saint-Étienne|tissu|0;Vélo miniature|statue|1;Plaque de mineur|metal|1;Lampe de mineur|lampe|2', vet: 'Écharpe verte du stade|cou|echarpe|0' },
  ain: { fs: 'à la crème de Bresse|au sucre de la galette bressane', fp: 'à la crème de Bresse|au bleu de Gex|à la volaille de Bresse', fn: 'des Dombes|de la Bresse|du Bugey',
    pain: 'Galette bressane|0;Tarte au sucre de Bresse|0', sucre: 'Galette bressane|0;Gaufre de Bresse|0',
    plat: 'Poulet de Bresse à la crème|1;Grenouilles des Dombes|1;Gratin de cardons|0',
    prod: 'Bleu de Gex|fromage|1;Crème de Bresse|fromage|0;Volaille de Bresse|plat|2',
    nature: 'Plume de héron des Dombes|plume|0;Roseau des étangs|feuille|0;Nénuphar des Dombes|fleur|0',
    artisan: 'Émail bressan|medaille|1;Peigne en corne|statue|0', vet: 'Bonnet de pêcheur des Dombes|tete|bonnet|0' },
  provence: { fs: 'à la lavande|au calisson|à la fleur de figuier', fp: 'au pistou|à la tapenade|aux herbes de Provence', fn: 'des calanques|du Luberon|de la Sainte-Victoire',
    nature: 'Brin de thym sauvage|feuille|0;Pomme de pin d’Alep|graine|0;Cigale en terre cuite|statue|1;Galet des calanques|pierre|0', artisan: 'Santon de Provence|statue|1;Tissu provençal|tissu|0;Navette de Marseille|sucre|0' },
  cote_azur: { fs: 'au citron de Menton|à la fleur d’oranger|à la violette', fp: 'à la niçoise|au pistou|à la socca', fn: 'de la Promenade|des caps|de l’Esterel',
    nature: 'Branche de mimosa|fleur|0;Galet de la baie|pierre|0;Feuille de palmier|feuille|0', prod: 'Citron de Menton|agrume|1;Olives de Nice|fruit|0;Fleur de courgette|legume|0' },
  alpes_sud: { fs: 'au miel de lavande|à la pomme des Hautes-Alpes', fp: 'aux tourtons|au fromage de chèvre', fn: 'du Queyras|des Écrins',
    nature: 'Brin de lavande de Valensole|fleur|0;Edelweiss du Queyras|fleur|2;Pierre de l’Ubaye|pierre|0', plat: 'Tourtons du Champsaur|0;Oreilles d’âne|1' },
};
// quel produit pour quel commerce, quand la liste est mélangée (une fromagerie vend du fromage, pas des cerises)
const BT_CAT_SUBS = { fromagerie: ['fromage'], boucherie: ['plat'], poissonnerie: ['mer'], caviste: ['boisson', 'fruit', 'pomme'], fleuriste: ['fleur', 'feuille', 'graine'], glacier: ['glace', 'sucre', 'fruit'], chocolaterie: ['sucre'] };

// ---------------- v19 : moins de répétitions ----------------
// S.butin.recent : les noms des derniers objets rapportés (60 au plus) ; ce qui vient de tomber pèse moins au prochain tirage
function btRecentList() { const B = btState(); if (!Array.isArray(B.recent)) B.recent = []; return B.recent; }
function btRecentN(name) { if (!name) return 0; let n = 0; for (const x of btRecentList()) if (x === name) n++; return n; }
function btRemember(items) { const L = btRecentList(); (items || []).forEach(it => { if (it && it.name) L.push(it.name); }); if (L.length > 60) L.splice(0, L.length - 60); }
// tirage pondéré : un objet commun pèse plus qu'un rare, un objet tout juste rapporté pèse moins
function btFreshPick(defs) {
  if (!defs || !defs.length) return null;
  const w = defs.map(d => 1 / (1 + (d[3] || 0) * 1.2) / (1 + 1.6 * btRecentN(d[0])));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < defs.length; i++) { r -= w[i]; if (r <= 0) return defs[i]; }
  return defs[defs.length - 1];
}

// ================= DONNÉES : spécialités maison, par sous-type =================
// b : bases (« Nom » ou « Nom|sous-type|forme|cat »), f : qualificatifs propres au type, k : parfums régionaux à mêler (fs, fp, fn)
const BT_SPEC = {
  bouchon: { cat: 'restaurant', l: 'bouchon lyonnais', c: 'n', s: 'plat', k: 'fp', b: ['Quenelle', 'Saucisson brioché', 'Tablier de sapeur', 'Salade lyonnaise', 'Cervelle de canut|fromage', 'Gratin de cardons'], f: ['de la Mère', 'à l’ancienne', 'sauce Nantua', 'du mâchon', 'aux échalotes'] },
  pizza: { cat: 'restaurant', l: 'pizzeria', c: 'n', s: 'plat', k: 'fp', b: ['Pizza', 'Calzone', 'Focaccia garnie', 'Pizza blanche'], f: ['au pesto', 'quatre fromages', 'à la truffe', 'margherita', 'aux cèpes', 'à la burrata', 'diavola', 'aux artichauts'] },
  creperie: { cat: 'restaurant', l: 'crêperie', c: 'n', s: 'sucre', k: 'fs', b: ['Crêpe', 'Galette', 'Crêpe dentelle', 'Crêpe flambée'], f: ['au caramel beurre salé', 'au sucre et citron', 'complète', 'aux pommes', 'au chocolat-noisette', 'à la confiture de lait'] },
  japonais: { cat: 'restaurant', l: 'restaurant japonais', c: 'n', s: 'plat', k: 'fp', b: ['Bol de ramen', 'Sushi', 'Onigiri', 'Bento', 'Gyoza'], f: ['au saumon', 'au miso', 'au sésame', 'au shiso', 'au thon', 'à l’anguille grillée'] },
  chinois: { cat: 'restaurant', l: 'restaurant chinois', c: 'n', s: 'plat', k: 'fp', b: ['Raviolis vapeur', 'Nouilles sautées', 'Bao', 'Riz cantonais'], f: ['au porc laqué', 'aux légumes croquants', 'au gingembre', 'à la sauce aigre-douce'] },
  kebab: { cat: 'restaurant', l: 'kebab', c: 'n', s: 'plat', k: 'fp', b: ['Kebab', 'Durum', 'Assiette grillade', 'Pita falafel'], f: ['sauce blanche', 'à la harissa', 'aux crudités', 'au fromage fondu', 'au sumac'] },
  burger: { cat: 'restaurant', l: 'burger', c: 'n', s: 'plat', k: 'fp', b: ['Burger', 'Cheeseburger', 'Burger végé', 'Cornet de frites'], f: ['au bacon croustillant', 'au cheddar fondu', 'à l’oignon confit', 'sauce barbecue', 'au bleu'] },
  indien: { cat: 'restaurant', l: 'restaurant indien', c: 'n', s: 'plat', k: 'fp', b: ['Curry', 'Naan', 'Biryani', 'Samoussa'], f: ['au poulet tikka', 'aux lentilles', 'au paneer', 'au fromage', 'à la mangue'] },
  libanais: { cat: 'restaurant', l: 'restaurant libanais', c: 'n', s: 'plat', k: 'fp', b: ['Assiette de mezze', 'Falafels', 'Houmous', 'Manakish'], f: ['au zaatar', 'à la grenade', 'au sésame', 'au persil frais'] },
  mexicain: { cat: 'restaurant', l: 'restaurant mexicain', c: 'n', s: 'plat', k: 'fp', b: ['Tacos', 'Burrito', 'Quesadilla', 'Nachos'], f: ['al pastor', 'au guacamole', 'au piment doux', 'aux haricots noirs'] },
  asiatique: { cat: 'restaurant', l: 'restaurant asiatique', c: 'n', s: 'plat', k: 'fp', b: ['Pad thaï', 'Bol de phở', 'Bò bún', 'Rouleaux de printemps'], f: ['à la citronnelle', 'au lait de coco', 'aux cacahuètes', 'à la menthe fraîche'] },
  italien: { cat: 'restaurant', l: 'trattoria', c: 'n', s: 'plat', k: 'fp', b: ['Pâtes fraîches', 'Risotto', 'Lasagnes', 'Gnocchi'], f: ['au pesto', 'à la truffe', 'aux cèpes', 'alla carbonara', 'au citron'] },
  mer: { cat: 'restaurant', l: 'restaurant de poisson', c: 'n', s: 'mer', k: 'fp', b: ['Plateau de la mer', 'Moules', 'Poisson grillé', 'Soupe de poisson'], f: ['marinières', 'au beurre blanc', 'à la plancha', 'au safran'] },
  vege: { cat: 'restaurant', l: 'restaurant végétarien', c: 'n', s: 'plat', k: 'fp', b: ['Bowl', 'Salade', 'Galette de légumes', 'Velouté'], f: ['aux graines', 'au potimarron', 'à l’avocat', 'au tofu fumé'] },
  restaurant: { cat: 'restaurant', l: 'restaurant', c: 'n', s: 'plat', k: 'fp', b: ['Plat mijoté', 'Tarte salée', 'Gratin', 'Assiette du chef'], f: ['aux champignons', 'au fromage du coin', 'aux herbes', 'à l’ancienne', 'du marché'] },
  gaufre: { cat: 'cafe', l: 'gaufrerie', c: 'n', s: 'sucre', k: 'fs', b: ['Gaufre', 'Gaufre fourrée', 'Gaufrette'], f: ['au sucre', 'au chocolat', 'à la chantilly', 'au sucre perlé', 'à la confiture'] },
  the: { cat: 'cafe', l: 'salon de thé', c: 'n', s: 'boisson', k: 'fs', b: ['Thé', 'Infusion', 'Scone', 'Part de cake'], f: ['au jasmin', 'à la rose', 'aux agrumes', 'à la bergamote'] },
  pub: { cat: 'cafe', l: 'bar', c: 'n', s: 'boisson', k: 'fs', b: ['Limonade maison', 'Cocktail sans alcool', 'Planche apéritive', 'Sirop maison'], f: ['au citron', 'à la menthe', 'aux herbes', 'à la framboise'] },
  cafe: { cat: 'cafe', l: 'café', c: 'n', s: 'boisson', k: 'fs', b: ['Café', 'Latte', 'Chocolat chaud', 'Cookie'], f: ['à la noisette', 'au caramel', 'à la cannelle', 'à la vanille', 'au miel'] },
  patisserie: { cat: 'boulangerie', l: 'pâtisserie', c: 'n', s: 'sucre', k: 'fs', b: ['Tarte', 'Éclair', 'Entremets', 'Chou', 'Financier'], f: ['au citron', 'à la framboise', 'au chocolat', 'à la pistache', 'au praliné'] },
  boulangerie: { cat: 'boulangerie', l: 'boulangerie', c: 'n', s: 'pain', k: 'fs', b: ['Pain', 'Brioche', 'Viennoiserie', 'Fougasse', 'Gaufre'], f: ['aux noix', 'au levain', 'aux graines', 'au beurre', 'au sucre'] },
  glacier: { cat: 'glacier', l: 'glacier', c: 'n', s: 'glace', k: 'fs', b: ['Glace', 'Sorbet', 'Coupe glacée', 'Esquimau'], f: ['à la fraise des bois', 'au caramel', 'au citron', 'à la pistache', 'à la menthe'] },
  chocolaterie: { cat: 'chocolaterie', l: 'chocolaterie', c: 'n', s: 'sucre', k: 'fs', b: ['Tablette', 'Praline', 'Ganache', 'Truffe'], f: ['au caramel', 'au praliné', 'à l’orange', 'au piment doux'] },
  epicerie: { cat: 'epicerie', l: 'épicerie', c: 'n', s: 'sucre', k: 'fs', b: ['Confiture', 'Pot de miel', 'Biscuits', 'Pâte à tartiner'], f: ['maison', 'aux figues', 'à l’ancienne', 'aux épices'] },
  fromagerie: { cat: 'fromagerie', l: 'fromagerie', c: 'n', s: 'fromage', k: 'fp', b: ['Fromage affiné', 'Tomme', 'Petit chèvre', 'Crème fermière'], f: ['aux herbes', 'au poivre', 'cendré', 'à la truffe'] },
  boucherie: { cat: 'boucherie', l: 'boucherie', c: 'n', s: 'plat', k: 'fp', b: ['Saucisson', 'Terrine', 'Pâté en croûte', 'Jambon'], f: ['aux noisettes', 'au poivre', 'aux herbes', 'fumé'] },
  poissonnerie: { cat: 'poissonnerie', l: 'poissonnerie', c: 'n', s: 'mer', k: 'fp', b: ['Pêche du jour', 'Rillettes de poisson', 'Coquillages', 'Soupe de la marée'], f: ['au citron', 'aux algues', 'à l’aneth', 'au safran'] },
  marche: { cat: 'marche', l: 'marché', c: 'n', s: 'legume', k: 'fp', b: ['Panier', 'Cagette de fruits|fruit', 'Botte de légumes', 'Sachet d’herbes'], f: ['de saison', 'du producteur', 'du matin', 'bio'] },
  caviste: { cat: 'caviste', l: 'caviste', c: 'n', s: 'boisson', k: 'fs', b: ['Jus de raisin', 'Limonade artisanale', 'Sirop', 'Jus de pomme'], f: ['pétillant', 'à la fleur de sureau', 'au cassis', 'aux agrumes'] },
  fleuriste: { cat: 'fleuriste', l: 'fleuriste', c: 'm', s: 'fleur', k: 'fn', b: ['Bouquet', 'Couronne', 'Brin', 'Composition'], f: ['de pivoines', 'de renoncules', 'de roses anciennes', 'de fleurs sauvages', 'd’hortensias'] },
  librairie: { cat: 'librairie', l: 'librairie', c: 'm', s: 'papier', b: ['Marque-page', 'Carnet', 'Recueil', 'Carte illustrée'], f: ['illustré', 'à la reliure dorée', 'de poèmes', 'de voyage'] },
  bibliotheque: { cat: 'bibliotheque', l: 'bibliothèque', c: 'm', s: 'papier', b: ['Marque-page', 'Fiche de prêt', 'Vieux grimoire', 'Carte illustrée'], f: ['ancien', 'tamponné', 'de contes', 'du fonds rare'] },
  musee: { cat: 'musee', l: 'musée', c: 'm', s: 'papier', b: ['Affiche', 'Carte postale', 'Catalogue', 'Reproduction'], f: ['de l’expo du moment', 'd’un tableau ancien', 'de la collection'] },
  patrimoine: { cat: 'patrimoine', l: 'église ou château', c: 'm', s: 'pierre', b: ['Fragment de vitrail|verre', 'Médaille|metal', 'Pierre taillée', 'Clé de voûte'], f: ['ancien', 'du clocher', 'des anciens maîtres', 'des bâtisseurs'] },
  chapelle: { cat: 'patrimoine', l: 'chapelle', c: 'm', s: 'pierre', b: ['Fragment de vitrail|verre', 'Petite cloche|metal', 'Pierre moussue|mousse', 'Bouquet votif|fleur'], f: ['de la chapelle', 'du pèlerin', 'ancien', 'du vallon'] },
  lavoir: { cat: 'riviere', l: 'lavoir', c: 'm', s: 'tissu', b: ['Savon|pierre', 'Linge brodé', 'Pince à linge|bois', 'Galet de lavoir|pierre'], f: ['d’antan', 'parfumé', 'du lavoir', 'des lavandières'] },
  moulin: { cat: 'campagne', l: 'moulin', c: 'm', s: 'ble', b: ['Farine|farine', 'Sac de grain', 'Pierre meulière|pierre', 'Épi'], f: ['du moulin', 'moulu à la meule', 'd’autrefois'] },
  verger: { cat: 'ferme', l: 'verger', c: 'n', s: 'fruit', k: 'fs', b: ['Panier de pommes|pomme', 'Poires', 'Cerises', 'Compote|sucre'], f: ['du verger', 'oubliées', 'juste cueillies'] },
  parc: { cat: 'parc', l: 'parc', c: 'm', s: 'feuille', k: 'fn', b: ['Feuille', 'Graines|graine', 'Fleur|fleur', 'Brindille|bois'], f: ['du vieux chêne', 'de la roseraie', 'du grand tilleul', 'du bassin'] },
  jardin: { cat: 'jardin', l: 'jardin', c: 'n', s: 'legume', k: 'fp', b: ['Radis', 'Courgette', 'Bouquet d’herbes', 'Fraises|fruit'], f: ['du potager', 'du carré partagé', 'bio', 'de la voisine'] },
  foret: { cat: 'foret', l: 'bois', c: 'm', s: 'mousse', k: 'fn', b: ['Champignon|champignon', 'Mousse', 'Pomme de pin|graine', 'Bâton de marche|bois', 'Plume de geai|plume'], f: ['des sous-bois', 'du vieux chêne', 'de la clairière', 'du sentier'] },
  campagne: { cat: 'campagne', l: 'champs', c: 'm', s: 'ble', k: 'fn', b: ['Gerbe de blé', 'Coquelicot|fleur', 'Bouquet des champs|fleur', 'Épi doré'], f: ['du bord du chemin', 'des moissons', 'du talus', 'sauvage'] },
  ferme: { cat: 'ferme', l: 'ferme', c: 'n', s: 'fromage', k: 'fs', b: ['Fromage frais', 'Œufs frais|plat', 'Confiture|sucre', 'Miel|sucre', 'Lait cru|boisson', 'Pain de campagne|pain'], f: ['fermier', 'du matin', 'des prés', 'de la basse-cour'] },
  riviere: { cat: 'riviere', l: 'rivière', c: 'm', s: 'pierre', k: 'fn', b: ['Galet poli', 'Plume de héron|plume', 'Roseau|feuille', 'Coquille d’eau douce|coquillage'], f: ['du gué', 'de la berge', 'du vieux moulin', 'du courant'] },
  etang: { cat: 'etang', l: 'étang', c: 'm', s: 'feuille', k: 'fn', b: ['Nénuphar|fleur', 'Plume de canard|plume', 'Roseau', 'Galet vert|pierre'], f: ['de l’étang', 'du ponton', 'des libellules'] },
  sentier: { cat: 'sentier', l: 'sentier', c: 'm', s: 'pierre', k: 'fn', b: ['Caillou', 'Cristal|cristal', 'Fleur d’altitude|fleur', 'Carte du sentier|papier'], f: ['du sommet', 'du col', 'du refuge'] },
  belvedere: { cat: 'belvedere', l: 'point de vue', c: 'm', s: 'papier', b: ['Carte postale', 'Croquis', 'Caillou du panorama|pierre'], f: ['du panorama', 'au coucher du soleil', 'du belvédère'] },
  plage: { cat: 'plage', l: 'plage', c: 'm', s: 'coquillage', k: 'fn', b: ['Coquillage', 'Sable|sable', 'Bois flotté|bois', 'Verre de mer|verre'], f: ['nacré', 'doré', 'de la marée', 'poli par les vagues'] },
  port: { cat: 'port', l: 'port', c: 'm', s: 'tissu', b: ['Nœud marin', 'Écaille|coquillage', 'Plume de mouette|plume', 'Bout de filet'], f: ['du port', 'du quai', 'des pêcheurs'] },
  phare: { cat: 'phare', l: 'phare', c: 'm', s: 'verre', b: ['Éclat de lentille', 'Plume de goéland|plume', 'Carnet du gardien|papier'], f: ['du phare', 'de la lanterne', 'des tempêtes'] },
  mode: { cat: 'mode', l: 'boutique de vêtements', c: 'v', b: ['Foulard|cou|foulard', 'Bonnet|tete|bonnet', 'T-shirt|haut|tshirt', 'Chaussettes|pieds|chaussettes', 'Sweat|haut|sweat'], f: ['à fleurs', 'rayé', 'pastel', 'brodé'] },
  friperie: { cat: 'friperie', l: 'friperie', c: 'v', b: ['Béret|tete|beret', 'Écharpe|cou|echarpe', 'Pull|haut|pull', 'Jupe|bas|jupe'], f: ['vintage', 'des années 70', 'rapiécé', 'en velours'] },
  boutique: { cat: 'boutique', l: 'boutique', c: 'd', s: 'statue', b: ['Bibelot', 'Petite lampe|lampe', 'Bocal décoré|bocal', 'Plante en pot|plante'], f: ['de la vitrine', 'fait main', 'en céramique'] },
  jouets: { cat: 'jouets', l: 'magasin de jouets', c: 'd', s: 'statue', b: ['Peluche', 'Toupie', 'Petit train', 'Figurine'], f: ['en bois', 'à remonter', 'arc-en-ciel'] },
  puces: { cat: 'puces', l: 'marché aux puces', c: 'd', s: 'statue', b: ['Bibelot', 'Vieille clé|metal|-|m', 'Carte ancienne|papier|-|m', 'Globe|mappemonde'], f: ['rétro', 'des années folles', 'oublié'] },
  cinema: { cat: 'cinema', l: 'cinéma', c: 'm', s: 'papier', b: ['Ticket', 'Affiche', 'Pop-corn|sucre|-|n'], f: ['de la séance de minuit', 'du film culte', 'de l’avant-première'] },
  gare: { cat: 'gare', l: 'gare', c: 'm', s: 'papier', b: ['Billet', 'Horaire', 'Plaque de quai|metal'], f: ['ancien', 'pour nulle part', 'de collection'] },
  poste: { cat: 'poste', l: 'bureau de poste', c: 'm', s: 'papier', b: ['Timbre', 'Carte postale', 'Enveloppe'], f: ['de collection', 'oblitéré', 'rare'] },
  hotel: { cat: 'hotel', l: 'hôtel', c: 'm', s: 'metal', b: ['Clé', 'Savonnette|pierre', 'Papier à lettres|papier'], f: ['dorée', 'de la suite', 'parfumée'] },
  pharmacie: { cat: 'pharmacie', l: 'pharmacie', c: 'n', s: 'boisson', b: ['Tisane', 'Baume|fleur|-|m', 'Pastille|sucre'], f: ['à la camomille', 'à l’arnica', 'au tilleul'] },
  coiffeur: { cat: 'coiffeur', l: 'salon de coiffure', c: 'm', s: 'tissu', b: ['Barrette|metal', 'Ruban', 'Chouchou'], f: ['nacré', 'pailleté', 'à fleurs'] },
  laverie: { cat: 'laverie', l: 'laverie', c: 'm', s: 'tissu', b: ['Chaussette orpheline', 'Sachet de lessive|fleur', 'Pince à linge|bois'], f: ['parfumée', 'à la lavande', 'perdue'] },
  bricolage: { cat: 'bricolage', l: 'quincaillerie', c: 'm', s: 'metal', b: ['Clou', 'Planche|bois', 'Vis', 'Pot de peinture|verre'], f: ['doré', 'de chêne', 'de précision'] },
  piscine: { cat: 'piscine', l: 'piscine', c: 'v', b: ['Bonnet de bain|tete|bonnet', 'Serviette|cou|echarpe', 'Bouée|statue|-|d'], f: ['à pois', 'à rayures', 'fluo'] },
  zoo: { cat: 'zoo', l: 'zoo', c: 'm', s: 'plume', b: ['Plume', 'Peluche|statue|-|d', 'Carte des animaux|papier'], f: ['de flamant', 'de panda roux', 'de perroquet'] },
  jeux: { cat: 'jeux', l: 'aire de jeux', c: 'm', s: 'verre', b: ['Bille', 'Craie|pierre', 'Ballon|tissu'], f: ['agate', 'de couleur', 'géante'] },
  camping: { cat: 'camping', l: 'camping', c: 'n', s: 'sucre', b: ['Guimauve grillée', 'Bâton de feu de camp|bois|-|m', 'Carte des étoiles|papier|-|m'], f: ['au feu de camp', 'des étoiles', 'de la veillée'] },
  sport: { cat: 'sport', l: 'terrain de sport', c: 'm', s: 'tissu', b: ['Fanion', 'Sifflet|metal', 'Médaille|metal'], f: ['du club', 'd’or', 'du tournoi'] },
  ecole: { cat: 'ecole', l: 'école', c: 'm', s: 'papier', b: ['Crayon|bois', 'Cahier', 'Bon point'], f: ['de couleur', 'à spirale', 'doré'] },
  mairie: { cat: 'mairie', l: 'mairie', c: 'm', s: 'metal', b: ['Médaille', 'Cocarde|tissu', 'Plan du village|papier'], f: ['de la ville', 'commémorative', 'des fêtes'] },
  rue: { cat: 'rue', l: 'rue', c: 'm', s: 'metal', b: ['Plaque', 'Pavé|pierre', 'Affichette|papier'], f: ['émaillée', 'de la rue', 'ancienne'] },
  _: { cat: '', l: 'lieu', c: 'm', s: 'papier', b: ['Souvenir', 'Carte postale', 'Badge|metal'], f: ['du coin', 'de collection', 'illustré'] },
};
BT_SPEC.route = BT_SPEC.rue; BT_SPEC.etang = BT_SPEC.etang || BT_SPEC.riviere;
const BT_SEASON = {
  fs: { automne: 'à la châtaigne|à la citrouille|aux pommes', hiver: 'à la cannelle|aux épices de Noël', printemps: 'à la fraise|à la fleur de sureau', 'été': 'à la pêche|au melon|à l’abricot' },
  fp: { automne: 'aux cèpes|à la courge', hiver: 'au fromage fondu|à la truffe', printemps: 'aux asperges|aux petits pois', 'été': 'à la tomate|au basilic' },
  fn: { automne: 'd’automne|aux feuilles rousses', hiver: 'givré|de l’hiver', printemps: 'du printemps|en bourgeons', 'été': 'd’été|au soleil' },
};
// objet signature (rare, propre au lieu) : « Nom|sous-type déco »
const BT_SIG = {
  food: ['Enseigne miniature|statue', 'Lampe du comptoir|lampe', 'Bocal de la recette secrète|bocal', 'Affiche peinte|herbier'],
  culture: ['Vitrail miniature|lanterne', 'Maquette|statue', 'Gravure encadrée|herbier', 'Globe ancien|mappemonde'],
  shop: ['Mannequin miniature|statue', 'Tapis de l’entrée|tapis', 'Lampe de vitrine|lampe', 'Enseigne miniature|statue'],
  nature: ['Herbier|herbier', 'Plante|plante', 'Lanterne|lanterne', 'Statuette de mousse|statue'],
};
const BT_SIG_SUB = { bouchon: 'Nappe à carreaux du bouchon|tapis', pizza: 'Pelle à pizza gravée|statue', creperie: 'Billig miniature|cheminee', japonais: 'Lanterne rouge|lanterne', chinois: 'Lanterne rouge|lanterne', cafe: 'Moulin à café gravé|statue', the: 'Théière de collection|bocal',
  boulangerie: 'Four à pain miniature|cheminee', patisserie: 'Pièce montée miniature|statue', librairie: 'Bibliothèque miniature|statue', fleuriste: 'Serre miniature|plante', ferme: 'Grange miniature|statue', foret: 'Herbier des sous-bois|herbier',
  glacier: 'Cornet géant en céramique|statue', fromagerie: 'Cloche à fromage gravée|bocal', poissonnerie: 'Bocal de la marée|bocal', musee: 'Tableau miniature|herbier', phare: 'Lanterne du gardien|lanterne', lavoir: 'Tapis de linge brodé|tapis', moulin: 'Moulin miniature|statue', chapelle: 'Vitrail de la chapelle|lanterne' };
// accessoire au style du lieu : « Nom|emplacement|forme »
const BT_STY = {
  food: ['Foulard de service|cou|foulard', 'Casquette du comptoir|tete|casquette', 'Béret de terrasse|tete|beret', 'Sac de courses|dos|sac'],
  culture: ['Écharpe de lecture|cou|echarpe', 'Béret d’artiste|tete|beret', 'Sac à livres|dos|sac'],
  shop: ['Nœud de vitrine|cou|noeud', 'Sweat de la boutique|haut|sweat', 'Chaussettes à motifs|pieds|chaussettes'],
  nature: ['Chapeau de paille|tete|chapeau', 'Bottes de balade|pieds|bottes', 'Bonnet des champs|tete|bonnet', 'Couronne de fleurs|tete|fleurs'],
};
const BT_STY_SUB = { bouchon: 'Tablier à carreaux|haut|tshirt', pizza: 'Foulard à carreaux|cou|foulard', creperie: 'Marinière|haut|tshirt', japonais: 'Furoshiki noué|cou|foulard', kebab: 'Casquette du grill|tete|casquette', burger: 'Casquette du diner|tete|casquette', the: 'Chapeau à voilette|tete|chapeau',
  pub: 'Casquette gavroche|tete|casquette', boulangerie: 'Toque de mitron|tete|chapeau', patisserie: 'Nœud praliné|cou|noeud', glacier: 'Bonnet sorbet|tete|bonnet', ferme: 'Salopette des champs|bas|short', friperie: 'Veste rétro|haut|pull', mode: 'Écharpe de créateur|cou|echarpe' };
const BT_GROUP = cat => (['boulangerie', 'cafe', 'restaurant', 'glacier', 'chocolaterie', 'epicerie', 'fromagerie', 'boucherie', 'poissonnerie', 'marche', 'caviste'].includes(cat) ? 'food'
  : ['librairie', 'musee', 'bibliotheque', 'cinema', 'patrimoine', 'mairie', 'ecole', 'poste', 'gare'].includes(cat) ? 'culture'
  : ['mode', 'friperie', 'boutique', 'jouets', 'bricolage', 'coiffeur', 'laverie', 'pharmacie', 'puces', 'hotel'].includes(cat) ? 'shop' : 'nature');
// lieux de campagne (terroir garanti ou presque, même tout près de chez soi)
const BT_RURAL = ['ferme', 'campagne', 'foret', 'riviere', 'etang', 'jardin', 'sentier', 'patrimoine', 'route', 'camping', 'belvedere', 'chapelle', 'lavoir', 'moulin', 'verger', 'champ', 'bois', 'prairie'];
// quels produits locaux pour quel commerce
const BT_LISTS = { boulangerie: ['pain', 'sucre'], cafe: ['boisson', 'sucre'], restaurant: ['plat'], glacier: ['sucre'], chocolaterie: ['sucre'], marche: ['prod'], epicerie: ['prod', 'sucre'], fromagerie: ['prod'], boucherie: ['plat', 'prod'],
  poissonnerie: ['prod'], caviste: ['boisson'], ferme: ['prod', 'nature'], fleuriste: ['nature'], parc: ['nature'], jardin: ['nature', 'prod'], foret: ['nature'], campagne: ['nature', 'prod'], riviere: ['nature'], etang: ['nature'], sentier: ['nature'],
  belvedere: ['nature'], plage: ['nature'], camping: ['nature', 'plat'], port: ['prod', 'nature'], phare: ['nature', 'artisan'], librairie: ['artisan'], musee: ['artisan'], patrimoine: ['artisan'], puces: ['artisan'], boutique: ['artisan', 'vet'],
  mode: ['vet'], friperie: ['vet'], jouets: ['artisan'], hotel: ['plat', 'artisan'], _: ['artisan', 'nature'] };
const BT_FRMAP = { pain: 'pain', sucre: 'pain', plat: 'plat', boisson: 'ter', prod: 'ter', nature: 'ter', artisan: 'ter', vet: 'ter' };

// ---------------- lecture des listes ----------------
const _btDefC = new Map();
function btDef(list, s, seed = 0) {
  const ck = list + '#' + s; if (_btDefC.has(ck)) return _btDefC.get(ck);
  const p = s.split('|'); let d;
  if (['pain', 'sucre', 'boisson', 'plat'].includes(list)) d = [p[0], 'n', list, +p[1] || 0, null, btCol(list, btHash(p[0]))];
  else if (list === 'vet') d = [p[0], 'v', p[1], +p[3] || 0, p[2], BT_PAL[btHash(p[0]) % BT_PAL.length]];
  else d = [p[0], btCatOf(p[1]), p[1], +p[2] || 0, null, btCol(p[1], btHash(p[0]))];
  _btDefC.set(ck, d); void seed; return d;
}
const btSplit = s => (s ? s.split(';').filter(Boolean) : []);
const btFlav = s => (s ? s.split('|').filter(Boolean) : []);
function btCountryData(iso) { return BT_PAYS[iso] || BT_PAYS[BT_ISO_ALIAS[iso]] || null; }

// ================= ANALYSE D'UN LIEU =================
// sous-type : p.osm.subclass d'abord, puis le nom
const BT_SUBRX = [
  ['bouchon', /bouchon|machon|\bmere (brazier|lea|cottivet|jean|bourgeois)|cafe comptoir/], ['pizza', /pizz|napoli|napoletan|forno a legna/], ['creperie', /crep|galette|krampouez|billig/], ['japonais', /sushi|japon|ramen|izakaya|yakitori|bento|udon|tokyo|sakura|maki/], ['chinois', /chin|wok|dim ?sum|pekin|canton|shanghai|panda d/],
  ['kebab', /kebab|doner|shawarma|anatoli|grill turc/], ['burger', /burger|diner|fast.?food/], ['indien', /indi|curry|tandoor|bombay|taj |masala|bollywood/], ['libanais', /liban|falafel|mezze|beyrouth/],
  ['mexicain', /mexic|taco|burrito|taqueria|cantina/], ['asiatique', /thai|bangkok|pho |vietnam|saigon|bo bun|asia/], ['italien', /trattoria|osteria|italia|pasta|ristorante|napoli|roma|venezia/],
  ['mer', /huitre|fruits de mer|maree|seafood|crustace|oyster/], ['vege', /vege|vegan|veggie|green/], ['gaufre', /gaufr|waffle/], ['the', /salon de the|tea|the et|teahouse/], ['pub', /\bpub\b|\bbar\b|biergarten|taverne|brasserie/],
  ['patisserie', /patiss|pastry|gateau|cake|douceur/], ['chapelle', /chapelle|oratoire|calvaire/], ['lavoir', /lavoir/], ['moulin', /moulin|mill/], ['verger', /verger|orchard/],
];
const BT_SUBCAT = { bouchon: 'restaurant', pizza: 'restaurant', creperie: 'restaurant', japonais: 'restaurant', chinois: 'restaurant', kebab: 'restaurant', burger: 'restaurant', indien: 'restaurant', libanais: 'restaurant', mexicain: 'restaurant', asiatique: 'restaurant', italien: 'restaurant', mer: 'restaurant', vege: 'restaurant',
  gaufre: 'cafe', the: 'cafe', pub: 'cafe', patisserie: 'boulangerie', chapelle: 'patrimoine', lavoir: 'riviere', moulin: 'campagne', verger: 'ferme' };
const BT_OSMSUB = { pastry: 'patisserie', confectionery: 'patisserie', ice_cream: 'glacier', pub: 'pub', bar: 'pub', biergarten: 'pub', tea: 'the', tea_shop: 'the', fast_food: 'burger', seafood: 'mer', chapel: 'chapelle', wayside_shrine: 'chapelle', watermill: 'moulin', windmill: 'moulin', orchard: 'verger', lavoir: 'lavoir', wash_house: 'lavoir' };
function btSub(p) {
  if (!p) return '_';
  const sc = btNorm(p.osm && (p.osm.subclass || p.osm.class)), nm = ' ' + btNorm(p.name) + ' ', cat = p.cat || '';
  let sub = null;
  for (const [k, rx] of BT_SUBRX) { if (rx.test(nm)) { sub = k; break; } }
  if (!sub && sc) { sub = BT_OSMSUB[sc] || null; if (!sub) for (const [k, rx] of BT_SUBRX) { if (rx.test(' ' + sc.replace(/_/g, ' ') + ' ')) { sub = k; break; } } }
  // un sous-type n'a de sens que dans sa famille (une « Boulangerie du Moulin » reste une boulangerie)
  if (sub && BT_SUBCAT[sub] && cat && BT_SUBCAT[sub] !== cat && !(BT_RURAL.includes(cat) && BT_RURAL.includes(BT_SUBCAT[sub]) && ['chapelle', 'lavoir', 'moulin', 'verger'].includes(sub)) && !(cat === 'cafe' && sub === 'gaufre') && !(cat === 'restaurant' && sub === 'creperie')) sub = null;
  if (sub === 'burger' && cat !== 'restaurant') sub = null;
  return sub || (BT_SPEC[cat] ? cat : '_');
}
const btFlags = p => { const nm = btNorm(p && p.name) + ' ' + btNorm(p && p.osm && p.osm.subclass); return { bio: /\bbio\b|organic|nature|ferme/.test(nm), vintage: /vintage|retro|brocante|antiq|occasion|second/.test(nm), luxe: /palace|royal|grand |prestige|maison /.test(nm) }; };

let _btHomeK = '', _btHome = null;
function btHomeInfo() {
  const h = homeObj(), k = h.name + h.lon;
  if (k !== _btHomeK) { _btHomeK = k; let iso = null; try { iso = rgCountry(h.lon, h.lat); } catch (e) { iso = null; } _btHome = { h, R: regionAt(h.lon, h.lat), iso: iso || 'FRA' }; }
  return _btHome;
}
let _btHZk = '', _btHZ = null;
function btHomeZone() { const h = homeObj(), k = h.name + h.lon; if (k !== _btHZk) { _btHZk = k; try { _btHZ = typeof rgZoneAt === 'function' ? rgZoneAt(h.lon, h.lat) : null; } catch (e) { _btHZ = null; } } return _btHZ; }
const _btInfoC = new Map();
function btInfo(pl) {
  const H = btHomeInfo(), lon = +pl.lon, lat = +pl.lat;
  const R = regionAt(lon, lat);
  const key = [pl.pid || (pl.poi ? '' : pl.id) || '', pl.name || '', pl.city || '', R ? R.id : ''].join('|');
  const ck = key + '@' + _btHomeK; if (_btInfoC.has(ck)) return _btInfoC.get(ck);
  let iso = null; try { iso = rgCountry(lon, lat); } catch (e) { iso = null; }
  if (!iso && R && R.g === 0) iso = 'FRA';
  const km = kmBetween(H.h, { lon, lat }), foreign = !!iso && iso !== H.iso, otherReg = !!(R && H.R && R.id !== H.R.id);
  let exo = Math.pow(Math.min(1, km / 8000), 0.55);
  if (foreign) exo = Math.max(exo, 0.35);
  if (R && H.R && R.g !== H.R.g) exo += 0.15;
  if (!otherReg) exo = Math.min(exo, 0.08);
  exo = Math.max(0, Math.min(1, exo));
  const cat = pl.cat || (pl.tags && pl.tags[0]) || '';
  const C = iso === 'FRA' ? null : btCountryData(iso), F = R && BT_FR[R.id] ? BT_FR[R.id] : null;
  let sub = btSub(Object.assign({}, pl, { cat }));
  let Z = null; try { Z = typeof rgZoneAt === 'function' && (iso === 'FRA' || !iso) ? rgZoneAt(lon, lat) : null; } catch (e) { Z = null; }
  if (sub === 'bouchon' && !(Z && Z.id === 'lyon')) sub = cat === 'restaurant' ? 'restaurant' : '_'; // un vrai bouchon, c'est à Lyon
  const HZ = btHomeZone(), otherZone = !!(Z && (!HZ || HZ.id !== Z.id));
  const I = { key, R, iso, C, F: iso === 'FRA' || (!iso && F) ? F : null, Z, ZD: Z && BT_ZONE[Z.id] ? BT_ZONE[Z.id] : null, otherZone, km, foreign, otherReg, exo, cat, sub, grp: BT_GROUP(BT_SUBCAT[sub] || cat), rural: BT_RURAL.includes(cat) || BT_RURAL.includes(sub) || (!pl.poi && (pl.tags || []).some(t => t === 'campagne' || t === 'foret')) };
  if (_btInfoC.size > 3000) _btInfoC.clear();
  _btInfoC.set(ck, I);
  return I;
}
// parfums régionaux selon le type (sucré, salé, nature)
function btLocalFlav(I, k) { if (!k) return []; if (I.ZD && I.ZD[k]) return btFlav(I.ZD[k]); const src = I.C || I.F; if (!src) return []; return btFlav(src[k] || ''); }

// ---------------- carte d'identité (stable) ----------------
const _btIdC = new Map();
function btIdentity(pl, I) {
  I = I || btInfo(pl);
  const sk = I.key + '|' + season(); if (_btIdC.has(sk)) return _btIdC.get(sk);
  const seed = btHash(I.key), r = btRng(seed), T = BT_SPEC[I.sub] || BT_SPEC[I.cat] || BT_SPEC._, P = pl.name || 'ce lieu', fl = btFlags(pl);
  const loc = btLocalFlav(I, T.k), sea = T.k ? btFlav(BT_SEASON[T.k][season()]) : [];
  const mk = (seasonal, i) => {
    const bs = btPick(T.b, r).split('|');
    let f;
    const x = r();
    if (seasonal && sea.length) f = btPick(sea, btRng(seed + 77 + i));
    else if (loc.length && x < (I.otherReg || I.foreign ? 0.6 : 0.4)) f = btPick(loc, r);
    else f = btPick(T.f, r);
    let base = bs[0];
    if (fl.bio && T.c === 'n' && r() < 0.5) base += ' bio';
    if (fl.vintage && T.c !== 'n' && r() < 0.6) f = 'vintage';
    const sub = bs[1] || T.s || 'papier', c = bs[3] || (bs[2] && bs[2] !== '-' ? 'v' : (T.c === 'v' && !bs[2] ? 'v' : (T.c === 'v' ? btCatOf(sub) : (bs[1] ? btCatOf(sub) : T.c))));
    const name = `${base} ${f} ${btDe(P)}`.replace(/\s+/g, ' ');
    return c === 'v' ? [name, 'v', bs[1] || 'cou', 1, bs[2] && bs[2] !== '-' ? bs[2] : 'foulard', BT_PAL[(seed >>> 3) % BT_PAL.length]] : [name, c, sub, 1, null, btCol(sub, seed + i)];
  };
  const specs = [mk(false, 0)];
  if (r() < 0.55) { const s2 = mk(true, 1); if (s2[0] !== specs[0][0]) specs.push(s2); }
  const sigs = BT_SIG[I.grp] || BT_SIG.nature, sg = (BT_SIG_SUB[I.sub] && r() < 0.6 ? BT_SIG_SUB[I.sub] : btPick(sigs, r)).split('|');
  const sig = [`${sg[0]} ${btDe(P)}`, 'd', sg[1], 2, null, BT_PAL[(seed >>> 7) % BT_PAL.length]];
  const sts = BT_STY[I.grp] || BT_STY.nature, st = (BT_STY_SUB[I.sub] && r() < 0.6 ? BT_STY_SUB[I.sub] : btPick(sts, r)).split('|');
  const sty = [`${st[0]} ${btDe(P)}`, 'v', st[1], 1, st[2], BT_PAL[(seed >>> 11) % BT_PAL.length]];
  const id = { key: I.key, seed, sub: I.sub, label: (BT_SPEC[I.sub] || T).l, specs, sig, sty };
  if (_btIdC.size > 2000) _btIdC.clear();
  _btIdC.set(sk, id);
  return id;
}
// humeur du jour : un petit coup de pouce différent chaque jour, propre à chaque lieu
const BT_MOODS = [
  { id: 'vedette', t: 'Spécialité à l’honneur', d: 'la spécialité maison sort plus souvent', spec: 0.3 },
  { id: 'calme', t: 'Journée tranquille', d: 'le butin habituel, sans surprise' },
  { id: 'arrivage', t: 'Arrivage du terroir', d: 'davantage de produits locaux', loc: 0.2, ter: 0.2 },
  { id: 'fete', t: 'Jour de fête', d: 'accessoires et décorations plus fréquents', sty: 0.15 },
  { id: 'genereux', t: 'Patron généreux', d: 'un petit cadeau local en plus', extra: 1 },
  { id: 'collection', t: 'Jour de collection', d: 'l’objet signature se montre plus volontiers', sig: 0.08 },
];
function btMood(key) { return BT_MOODS[btHash(key + '#' + dayKey()) % BT_MOODS.length]; }

// ================= ÉTAT =================
function btState() { if (!S.butin || typeof S.butin !== 'object') S.butin = {}; if (!S.butin.seen || typeof S.butin.seen !== 'object') S.butin.seen = {}; return S.butin; }
btState();

// ================= GÉNÉRATION =================
let btCtx = null;
function btResolve(place) {
  if (place && typeof place === 'object') return place;
  if (typeof place !== 'string' || !place) return null;
  if (btCtx && btCtx.name === place) return btCtx;
  for (const k in (S.trips || {})) { const t = S.trips[k]; if (t && t.dest && t.dest.name === place) return t.dest; }
  return (typeof PLACES !== 'undefined' && PLACES.find(p => p.name === place)) || null;
}
let _btWantT = 0, _btWant = new Set();
function btWanted() {
  if (Date.now() - _btWantT < 3000) return _btWant;
  const s = new Set();
  try { for (const c of (typeof teamIds === 'function' ? teamIds() : Object.keys(S.comps || {}))) { const d = typeof curDream === 'function' ? curDream(c) : null; if (d && d.steps) d.steps.forEach(st => { if (st.name) s.add(st.name); }); } } catch (e) { /* rien */ }
  try { if (typeof bqState === 'function') (bqState().orders || []).forEach(o => (o.req || []).forEach(r => { if (r.def) s.add(r.def[0]); if (r.name) s.add(r.name); })); } catch (e) { /* rien */ }
  _btWant = s; _btWantT = Date.now(); return s;
}
const btPlaceRef = pl => ({ name: pl.name, cat: pl.cat || null, lon: +pl.lon, lat: +pl.lat, city: pl.city || '', pid: pl.pid || (pl.poi ? null : pl.id), poi: !!pl.poi, osm: pl.osm ? { class: pl.osm.class, subclass: pl.osm.subclass } : null });
function btTag(it, k, pl, I) { it.bt = { k, key: I.key, sub: I.sub, iso: I.iso || null, p: btPlaceRef(pl) }; if (k === 'sig' && pl.poi && I.km < 40) it.near = 1; return it; } // seule la signature d'un lieu du quotidien est un « souvenir » (cf. poiNear)
// un produit local (pays, région de France, ou à défaut spécialité de la région du monde)
function btLocalDefs(I, cat) {
  const lists = BT_LISTS[cat] || BT_LISTS[BT_SUBCAT[I.sub]] || BT_LISTS._;
  let out = [];
  if (I.C) lists.forEach(l => btSplit(I.C[l]).forEach(s => out.push(btDef(l, s))));
  else if (I.ZD) { // v19 : la zone d'abord (Lyon, Alpes, Auvergne…), la région seulement pour combler
    lists.forEach(l => btSplit(I.ZD[l]).forEach(s => out.push(btDef(l, s))));
    if (!out.length && I.F) lists.forEach(l => { const fl = BT_FRMAP[l]; if (fl !== 'ter') btSplit(I.F[fl]).forEach(s => out.push(btDef(fl, s))); });
  }
  else if (I.F) lists.forEach(l => { const fl = BT_FRMAP[l]; btSplit(I.F[fl]).forEach(s => out.push(btDef(fl === 'ter' ? 'ter' : fl, s))); });
  const subs = BT_CAT_SUBS[cat]; if (subs) { const f = out.filter(d => subs.includes(d[2])); if (f.length) out = f; }
  return out;
}
function btLocalItem(I, luck, place, tags, catLetter, rural, minRar) {
  let defs = btLocalDefs(I, rural ? 'campagne' : I.cat);
  if (catLetter) { const same = defs.filter(d => d[1] === catLetter); if (same.length) defs = same; }
  const maxR = I.exo > 0.6 ? 2 : 1;
  defs = defs.filter(d => d[3] <= maxR + 1);
  if (!defs.length || (I.R && Math.random() < 0.25 && !I.C && !I.ZD)) {
    // spécialité de la région du monde (codex des régions) : seulement si elle a du sens ICI (zone, type de lieu)
    const R = I.R; if (!R || !R.res) return null;
    const pl = btResolve(place) || {};
    const res = R.res.filter(x => x.rar <= maxR && (typeof rgResFits !== 'function' || rgResFits(x, Object.assign({ cat: I.cat }, pl))));
    if (!res.length) return null;
    const x = btFreshPick(res.map(r => [r.name, r.cat, r.sub, r.rar, null, r.color, r]))[6];
    return typeof rgMakeRes === 'function' ? rgMakeRes(x, place, tags, { place, km: I.km }) : null;
  }
  const d = btFreshPick(defs);
  const rar = Math.max(minRar || 0, Math.min(3, d[3] + (I.exo > 0.6 && Math.random() < 0.2 ? 1 : 0)));
  const it = makeItem(d, luck, place, tags, { fixed: rar });
  return it;
}
// v19 : un objet du coin (zone, sinon région ou pays) pour remplacer une spécialité du codex qui n'a pas sa place ici (17_regions.js)
function btZoneGift(dest, t, minRar) {
  if (!dest || !isFinite(+dest.lon)) return null;
  const pl = Object.assign({}, dest, { cat: dest.cat || (dest.tags && POI_CATS[dest.tags[0]] ? dest.tags[0] : null) }), I = btInfo(pl);
  if (!I.ZD && !I.F && !I.C) return null;
  const rural = I.rural && !btLocalDefs(I, I.cat).length;
  const it = btLocalItem(Object.assign({}, I, { R: null }), (t && t.luck) || 0, dest.name, dest.tags || [], null, rural, minRar);
  if (it) { btTag(it, 'loc', pl, I); if (I.km < 40 && pl.poi) it.near = 1; }
  return it;
}
// le tas d'objets courants d'un lieu (même règle que lootFor)
function btPoolOf(tags) { tags = tags || []; let pool = []; if (typeof POI_CATS !== 'undefined' && POI_CATS[tags[0]] && LOOT[tags[0]]) pool = LOOT[tags[0]].slice(); else tags.forEach(t => { if (LOOT[t]) pool = pool.concat(LOOT[t]); }); return pool.filter(d => d[1] !== 't'); }
// enrichit le butin d'un lieu (appelé après lootFor)
function btEnrich(out, tags, luck, placeArg, comp, n) {
  const pl = btResolve(placeArg);
  if (!pl || !isFinite(+pl.lon) || !isFinite(+pl.lat)) return out;
  if (!pl.poi && pl.id == null) return out; // « Sur la route », « En pleine mer » : rien de propre
  const I = btInfo(pl), id = btIdentity(pl, I), mood = btMood(I.key), want = btWanted();
  const pName = typeof placeArg === 'string' ? placeArg : pl.name;
  // 1. produits locaux et noms locaux
  let pLoc = I.foreign ? 0.18 + 0.5 * I.exo : I.otherReg ? 0.06 + 0.3 * I.exo : I.ZD ? (I.otherZone ? 0.24 : 0.14) : 0; // v19 : à Lyon, des objets lyonnais
  const pool0 = btPoolOf(tags);
  if (pLoc && mood.loc) pLoc += mood.loc;
  for (let i = 0; i < out.length; i++) {
    const it = out[i];
    if (!it || it.special || it.edition || it.rid || it.tresor || it.bt || want.has(it.name)) continue;
    // v19 : un objet courant déjà rapporté plusieurs fois récemment laisse souvent sa place à un autre du même lieu
    const rn = btRecentN(it.name);
    if (rn >= 2 && pool0.length > 3 && Math.random() < Math.min(0.9, 0.35 * rn)) { const d = btFreshPick(pool0.filter(x => x[0] !== it.name && x[3] <= it.rarity + 1)); if (d) { const nw = makeItem(d, luck, it.from, tags); out[i] = nw; continue; } }
    if (pLoc && Math.random() < pLoc) { const nw = btLocalItem(I, luck, pName, tags, it.cat === 'v' ? 'v' : null, false); if (nw) { btTag(nw, 'loc', pl, I); out[i] = nw; continue; } }
    if (I.C && I.C.loc) { const j = BT_LOC_KEYS.indexOf(it.name), L = I.C.loc.split('|'); if (j >= 0 && L[j]) { it.fr = it.name; it.name = L[j]; it.bt = { k: 'nom', iso: I.iso }; } }
  }
  if (!comp) return out;
  const arrival = n >= 2, S2 = btState(), first = !S2.seen[I.key];
  const add = it => { if (it) out.push(it); };
  if (arrival) {
    // 2. spécialité maison
    let pS = Math.min(0.8, 0.42 + 0.4 * I.exo + (mood.spec || 0)); if (!pl.poi) pS *= 0.6;
    if (Math.random() < pS) {
      const d = id.specs.length > 1 && Math.random() < 0.38 ? id.specs[1] : id.specs[0];
      const it = makeItem(d, luck, pName, tags, { fixed: I.exo > 0.55 ? 2 : 1 }); add(btTag(it, 'spec', pl, I));
    }
    // 3. objet signature (rare) : plus probable la première fois et loin de chez soi
    const pG = first ? 0.3 : Math.min(0.3, 0.035 + 0.1 * I.exo + (mood.sig || 0) + Math.max(0, luck || 0) * 0.015);
    if (Math.random() < pG) { const it = makeItem(id.sig, luck, pName, tags, { fixed: I.km > 3000 ? 3 : 2, special: true }); add(btTag(it, 'sig', pl, I)); }
    // 4. accessoire au style du lieu
    if (Math.random() < 0.08 + 0.1 * I.exo + (mood.sty || 0)) { const it = makeItem(id.sty, luck, pName, tags, { fixed: I.exo > 0.6 ? 2 : 1 }); add(btTag(it, 'sty', pl, I)); }
    // 5. humeur « patron généreux » : un cadeau local
    if (mood.extra) { const it = btLocalItem(I, luck, pName, tags, null, I.rural); if (it) add(btTag(it, 'loc', pl, I)); }
    S2.seen[I.key] = (S2.seen[I.key] || 0) + 1;
    const ks = Object.keys(S2.seen); if (ks.length > 3000) ks.slice(0, 1000).forEach(k => delete S2.seen[k]);
  }
  // 6. campagne : un produit du terroir, même tout près de chez soi
  if (I.rural) {
    const pT = (arrival ? 0.55 : 0.3) + (I.cat === 'ferme' ? 0.15 : 0) + (mood.ter || 0);
    if (Math.random() < pT) {
      let it = null;
      if (I.F || I.C || I.ZD) it = btLocalItem(Object.assign({}, I, { exo: I.km > 150 ? 0.7 : 0.2 }), luck, pName, tags, null, true);
      if (it) { if (I.km > 150 && it.rarity < 1) it.rarity = 1; add(btTag(it, 'ter', pl, I)); }
    }
  }
  return out;
}
if (typeof lootFor === 'function') lootFor = (orig => function (tags, luck, place, n = 1, comp = null) {
  const out = orig.apply(this, arguments);
  try { btEnrich(out, tags || [], luck || 0, place, comp, n); } catch (e) { console.error('butin', e); }
  try { if (comp && typeof famLoot === 'function') famLoot(out, tags || [], luck || 0, place, n, comp); } catch (e) { console.error('familles', e); } // v20 : nature, graines, pierres, coffres, clés, fragments (36_familles.js)
  return out;
})(lootFor);
// le lieu courant d'un événement (pour que lootFor sache où l'on est)
if (typeof eventPlace === 'function') eventPlace = (orig => function () { const p = orig.apply(this, arguments); btCtx = p || null; return p; })(eventPlace);
// on garde l'identité OSM d'un lieu du quotidien quand on le choisit (id stable, sous-type)
if (typeof poiDest === 'function') poiDest = (orig => function (p) {
  const d = orig.apply(this, arguments);
  try { if (p && d) { if (p.id != null) d.pid = String(p.id); if (p.osm) d.osm = { class: p.osm.class, subclass: p.osm.subclass }; } } catch (e) { /* rien */ }
  return d;
})(poiDest);
// v19 : on retient ce qui a été rapporté (moins de répétitions aux voyages suivants)
if (typeof collect === 'function') collect = (orig => function () {
  const t = S.trips && S.trips[S.sel];
  const r = orig.apply(this, arguments);
  try { if (t && t.bag) { btRemember(t.bag); save(); } } catch (e) { console.error('butin', e); }
  return r;
})(collect);
// simulation (tests, aperçu) : le butin d'arrivée d'un lieu
function btSimulate(pl, times = 1, luck = 0.5) {
  const tags = pl.tags || [pl.cat, (POI_CATS[pl.cat] || [])[3] || 'ville'].filter(Boolean), k = S.sel || Object.keys(S.comps || {})[0];
  const out = []; for (let i = 0; i < times; i++) { btCtx = pl; out.push(...lootFor(tags, luck, pl.name, 3, k)); }
  btCtx = null; return out;
}

// ================= « OÙ LE TROUVER ? » =================
let _btCat = null;
function btCatalog() {
  if (_btCat) return _btCat;
  const M = new Map();
  const add = (def, src) => { if (!def || !def[0]) return; let e = M.get(def[0]); if (!e) { e = { def, src: [] }; M.set(def[0], e); } if (!e.src.some(x => x.k === src.k && x.v === src.v)) e.src.push(src); };
  try { Object.entries(LOOT).forEach(([k, arr]) => arr.forEach(d => add(d, POI_CATS[k] ? { k: 'cat', v: k } : { k: 'tag', v: k }))); } catch (e) { /* rien */ }
  try { SEASON_LOOT.forEach(d => add(d, { k: 'saison' })); NIGHT_LOOT.forEach(d => add(d, { k: 'nuit' })); Object.values(WONDERS).forEach(d => add(d, { k: 'meteo' })); } catch (e) { /* rien */ }
  try { REGIONS.forEach(R => R.res.forEach(x => add(rgDef(x), { k: 'reg', v: R.id }))); } catch (e) { /* rien */ }
  const listCats = l => Object.keys(BT_LISTS).filter(c => c !== '_' && BT_LISTS[c].includes(l));
  Object.entries(BT_PAYS).forEach(([iso, C]) => {
    ['pain', 'sucre', 'boisson', 'plat', 'prod', 'nature', 'artisan', 'vet'].forEach(l => btSplit(C[l]).forEach(s => add(btDef(l, s), { k: 'pays', v: iso, cats: listCats(l) })));
    if (C.loc) C.loc.split('|').forEach((nm, j) => { const L = M.get(BT_LOC_KEYS[j]); if (nm && L) add([nm, L.def[1], L.def[2], L.def[3], L.def[4], L.def[5]], { k: 'pays', v: iso, cats: L.src.filter(x => x.k === 'cat').map(x => x.v), fr: BT_LOC_KEYS[j] }); });
  });
  Object.entries(BT_ZONE).forEach(([zid, Z]) => ['pain', 'sucre', 'boisson', 'plat', 'prod', 'nature', 'artisan', 'vet'].forEach(l => btSplit(Z[l]).forEach(s => add(btDef(l, s), { k: 'zone', v: zid, cats: listCats(l) }))));
  Object.entries(BT_FR).forEach(([rid, F]) => ['pain', 'plat', 'ter'].forEach(l => btSplit(F[l]).forEach(s => add(btDef(l, s), { k: 'fr', v: rid, cats: l === 'ter' ? ['ferme', 'campagne', 'foret', 'riviere'] : l === 'pain' ? ['boulangerie'] : ['restaurant'] }))));
  const recs = [].concat(typeof RECIPES !== 'undefined' ? RECIPES : [], typeof ECO_RECIPES !== 'undefined' ? ECO_RECIPES : [], typeof RG_RECIPES !== 'undefined' ? RG_RECIPES : [], typeof BQ_RECIPES !== 'undefined' ? BQ_RECIPES : []);
  recs.forEach(r => { if (r && Array.isArray(r.out)) add(r.out, { k: 'rec', v: r.id }); });
  try { ECO_CAPS.forEach(row => row.forEach(d => { if (Array.isArray(d)) add(d, { k: 'caps' }); })); } catch (e) { /* rien */ }
  try { SHOP_DECOR.forEach(d => add(d, { k: 'shop' })); BQ_SHOPS.forEach(T => (T.stars || []).forEach(d => add(d, { k: 'shop' }))); } catch (e) { /* rien */ }
  // spécialités maison : une entrée par sous-type (« Pizza … » : chaque pizzeria a la sienne)
  Object.entries(BT_SPEC).forEach(([sub, T]) => { if (sub === '_' || sub === 'route') return; T.b.forEach(b => { const p = b.split('|'), c = p[3] || (p[2] && p[2] !== '-' ? 'v' : T.c); add([`${p[0]} maison`, c, p[1] || T.s || 'cou', 1, p[2] && p[2] !== '-' ? p[2] : null, btCol(p[1] || T.s, btHash(p[0]))], { k: 'spec', v: sub }); }); });
  _btCat = M; return M;
}
const btTagLbl = t => (typeof TAGQ !== 'undefined' && TAGQ[t] ? `Lieu ${TAGQ[t]}` : `Lieu : ${(typeof TAGL !== 'undefined' && TAGL[t]) || t}`);
const btCatL = c => (POI_CATS[c] ? POI_CATS[c][0] : c);
const btIsoName = iso => (BT_PAYS[iso] ? BT_PAYS[iso].n : iso);
function btHomeRegion() { try { return btHomeInfo().R; } catch (e) { return null; } }
// sources d'un objet (objet possédé ou simple nom)
function btSources(itOrName) {
  const it = typeof itOrName === 'object' ? itOrName : null, name = it ? it.name : itOrName, out = [];
  if (it && it.bt && it.bt.p) {
    const p = it.bt.p, where = `${p.name}${p.city && p.city !== p.name ? ', ' + p.city : ''}`;
    const txt = it.bt.k === 'sig' ? `Objet signature de ${where} : rare, propre à ce lieu` : it.bt.k === 'sty' ? `Accessoire au style de ${where}` : it.bt.k === 'spec' ? `Spécialité maison de ${where}` : `Rapporté de ${where}`;
    out.push({ txt, ico: 'lieu', step: { fn: () => btGoPlace(p) }, go: 'Y aller', d: kmBetween(homeObj(), p) });
  }
  const C = btCatalog(); let e = C.get(name) || (it && it.fr ? C.get(it.fr) : null);
  if (it && it.rid && !e && typeof RG_RES !== 'undefined' && RG_RES[it.rid]) e = { src: [{ k: 'reg', v: RG_RES[it.rid].region }] };
  const srcs = e ? e.src.slice() : [];
  if (it && it.bt && it.bt.iso && it.bt.k === 'nom' && !srcs.some(s => s.k === 'pays')) srcs.push({ k: 'pays', v: it.bt.iso, cats: [] });
  const cats = srcs.filter(s => s.k === 'cat').map(s => s.v);
  if (cats.length) out.push({ txt: `${cats.slice(0, 4).map(btCatL).join(', ')}${cats.length > 4 ? '…' : ''}`, ico: 'cat', step: { t: 'visit', cat: cats }, go: 'Y aller', d: 1 });
  const hr = btHomeRegion();
  srcs.forEach(s => {
    if (s.k === 'tag') out.push({ txt: btTagLbl(s.v), ico: 'tag', step: { t: 'visit', tag: s.v }, go: 'Y aller', d: 5 });
    else if (s.k === 'zone') {
      const Z = typeof RG_ZONES !== 'undefined' ? RG_ZONES[s.v] : null; if (!Z) return;
      const HZ = btHomeZone(), home = HZ && HZ.id === Z.id, cs = (s.cats || []).filter(c => POI_CATS[c]);
      const extra = cs.length ? ` · ${cs.slice(0, 3).map(c => btCatL(c).toLowerCase()).join(', ')}` : '';
      out.push({ txt: home ? `Près de chez vous (${Z.n})${extra}` : `${Z.n}${extra}`, ico: 'reg', step: home ? { t: 'visit', cat: cs.length ? cs : ['marche'] } : { fn: () => btGoZone(Z) }, go: home ? 'Y aller' : 'Voir sur la carte', d: home ? 3 : 300 });
    }
    else if (s.k === 'reg' || s.k === 'fr') {
      const R = RG[s.v]; if (!R) return;
      // v19 : une spécialité du codex limitée à certaines zones (bleu d'Auvergne…) : on montre la zone et le type de lieu
      const W = s.k === 'reg' && it && it.rid && typeof RG_RES_WHERE !== 'undefined' ? RG_RES_WHERE[it.rid] : (s.k === 'reg' && !it && typeof RG_RES !== 'undefined' ? (() => { const x = Object.values(RG_RES).find(r => r.name === name); return x ? RG_RES_WHERE[x.id] : null; })() : null);
      if (W && W.z) { const HZ = btHomeZone(), hz = HZ && W.z.includes(HZ.id), Z = RG_ZONES[W.z[0]]; out.push({ txt: hz ? `Près de chez vous : ${W.w}` : `${W.w[0].toUpperCase()}${W.w.slice(1)}`, ico: 'reg', step: hz ? { t: 'visit', cat: W.c.filter(c => POI_CATS[c]) } : { fn: () => btGoZone(Z) }, go: hz ? 'Y aller' : 'Voir sur la carte', d: hz ? 3 : 300 }); return; }
      const home = hr && hr.id === R.id;
      const extra = s.cats && s.cats.length ? ` · ${s.cats.slice(0, 3).map(c => btCatL(c).toLowerCase()).join(', ')}` : '';
      out.push({ txt: home ? `Votre région (${R.short})${extra || ' · marché, fermes'}` : `Région : ${R.name}${extra}`, ico: 'reg', step: home ? { t: 'visit', cat: s.cats && s.cats.length ? s.cats : ['marche', 'ferme'] } : { region: R.id }, go: home ? 'Y aller' : 'Voir sur la carte', d: home ? 3 : 500 });
    } else if (s.k === 'pays') out.push({ txt: `${btIsoName(s.v)}${s.cats && s.cats.length ? ' · ' + s.cats.slice(0, 3).map(c => btCatL(c).toLowerCase()).join(', ') : ''}${s.fr ? ` (là-bas, le « ${s.fr.toLowerCase()} » s’appelle ainsi)` : ''}`, ico: 'pays', step: { fn: () => btGoCountry(s.v) }, go: 'Y aller', d: 2000 });
    else if (s.k === 'spec') { const T = BT_SPEC[s.v]; out.push({ txt: `Spécialité maison des ${T.l}s : chaque lieu a sa propre recette`, ico: 'lieu', step: { fn: () => btGoSub(s.v) }, go: 'Y aller', d: 2 }); }
    else if (s.k === 'rec') out.push({ txt: 'À fabriquer à l’atelier (recette)', ico: 'rec', step: (typeof RECIPES !== 'undefined' && RECIPES.some(r => r.id === s.v)) ? { t: 'craft', id: s.v } : { fn: () => openSheet('atelier') }, go: 'Atelier', d: 0 });
    else if (s.k === 'caps') out.push({ txt: 'Machine à souvenirs (capsules)', ico: 'shop', step: { fn: () => (typeof ecoGo === 'function' ? ecoGo('machine') : openSheet('village')) }, go: 'Ouvrir', d: 0 });
    else if (s.k === 'shop') out.push({ txt: 'Magasin de votre boutique', ico: 'shop', step: { fn: () => (typeof openBoutique === 'function' ? openBoutique('magasin') : openSheet('boutique')) }, go: 'Ouvrir', d: 0 });
    else if (s.k === 'saison') out.push({ txt: 'En automne : bois, champs, parcs et rues', ico: 'tag', step: { t: 'visit', cat: ['parc', 'foret', 'campagne'] }, go: 'Y aller', d: 4 });
    else if (s.k === 'nuit') out.push({ txt: 'La nuit, partout (voyager le soir)', ico: 'tag', step: { fn: () => openSheet('voyage') }, go: 'Partir', d: 6 });
    else if (s.k === 'meteo') out.push({ txt: 'Une météo rare en voyage (arc-en-ciel, étoile filante…)', ico: 'tag', step: { fn: () => openSheet('voyage') }, go: 'Partir', d: 9 });
  });
  if (!out.length) out.push({ txt: 'Événements de voyage, marchands ambulants et marché mondial', ico: 'tag', step: { fn: () => (typeof openMarche === 'function' ? openMarche() : openSheet('voyage')) }, go: 'Marché', d: 99 });
  return out;
}
// la meilleure piste : objet de lieu > près de chez soi > région > pays > fabrication
function btBest(srcs) { const tr = srcs.filter(s => s.go !== 'Atelier' && s.go !== 'Ouvrir' && s.go !== 'Marché'); return (tr.length ? tr : srcs).slice().sort((a, b) => a.d - b.d)[0]; }
function btStepFor(name) { const s = btBest(btSources(name)); return s ? s.step : null; }
function btWhereShort(name) { const s = btBest(btSources(name)); return s ? s.txt : ''; }

// ---------------- aller chercher ----------------
function btFreeComp() {
  if (!S.trips[S.sel]) return true;
  const free = (typeof teamIds === 'function' ? teamIds() : Object.keys(S.comps || {})).find(k => !S.trips[k]);
  if (!free) { toast('Toute l’équipe est en voyage. Attendez le retour de l’un d’eux !'); return false; }
  selectComp(free); return true;
}
function btRun(step) {
  if (!step) return;
  const m = $('modal'); if (m) m.hidden = true;
  const travel = step.fn ? null : step.t !== 'craft';
  if ((travel || step.region) && !btFreeComp()) return;
  if (step.fn) { try { step.fn(); } catch (e) { console.error('butin', e); openSheet('voyage'); } return; }
  if (step.region) { if (typeof closeSheet === 'function') closeSheet(); if (typeof regionGo === 'function') regionGo(step.region); else openSheet('voyage'); return; }
  if (step.t !== 'craft' && typeof closeSheet === 'function') closeSheet();
  try { goDreamStep(step); } catch (e) { console.error('butin', e); openSheet('voyage'); }
}
function btGoPlace(p) {
  if (!btFreeComp()) return;
  if (typeof closeSheet === 'function') closeSheet();
  if (p.poi) {
    const poi = { id: p.pid, cat: p.cat && POI_CATS[p.cat] ? p.cat : 'boutique', name: p.name, lon: p.lon, lat: p.lat, city: p.city, osm: p.osm };
    return goDreamPOI(poi, `Cap sur ${p.name} ! Choisissez la durée, puis partez.`);
  }
  const P = PLACES.find(x => x.name === p.name);
  if (P) return goDreamPlace(P, `Cap sur ${P.name} ! Choisissez la durée, puis partez.`);
  if (typeof zoomTo === 'function') zoomTo(p.lon, p.lat, 12);
}
function btGoCountry(iso) {
  if (!btFreeComp()) return;
  if (typeof closeSheet === 'function') closeSheet();
  const h = homeObj(), isoOf = p => { try { return rgCountry(p.lon, p.lat); } catch (e) { return null; } };
  const isos = [iso].concat(Object.keys(BT_ISO_ALIAS).filter(k => BT_ISO_ALIAS[k] === iso));
  const p = PLACES.filter(x => x.name !== S.home && isos.includes(isoOf(x))).map(x => ({ x, d: kmBetween(h, x) })).sort((a, b) => a.d - b.d)[0];
  if (p) return goDreamPlace(p.x, `${p.x.name} : le lieu le plus proche en ${btIsoName(iso)}. Choisissez la durée, puis partez !`);
  const rid = typeof RG_ISO !== 'undefined' ? RG_ISO[iso] : null;
  if (rid && typeof regionGo === 'function') return regionGo(rid);
  openSheet('voyage');
}
function btGoZone(Z) {
  if (!Z) return; if (!btFreeComp()) return;
  if (typeof closeSheet === 'function') closeSheet();
  const P = PLACES.filter(x => x.name !== S.home && (typeof rgZoneAt !== 'function' || (rgZoneAt(x.lon, x.lat) || {}).id === Z.id))[0];
  if (P) return goDreamPlace(P, `Cap sur ${P.name} (${Z.n}) ! Choisissez la durée, puis partez.`);
  const [lon, lat] = Z.pts.split(' ')[0].split(',').map(Number);
  const p = { id: null, name: Z.c, country: 'France', lat, lon, tags: ['ville', 'campagne'], special: null };
  if (typeof choosePlace === 'function') choosePlace(p); else { plan.dest = p; openSheet('voyage'); }
  if (typeof zoomTo === 'function') { try { zoomTo(lon, lat, 8); } catch (e) {} }
}
function btGoSub(sub) {
  if (!btFreeComp()) return;
  if (typeof closeSheet === 'function') closeSheet();
  const T = BT_SPEC[sub] || BT_SPEC._, cat = BT_SUBCAT[sub] || T.cat || sub;
  const test = p => p.cat === cat && btSub(p) === sub, poi = nearestPOI(test);
  if (poi) return goDreamPOI(poi, `${poi.name} : la ${T.l} la plus proche. Sa spécialité maison n’existe nulle part ailleurs !`);
  const any = nearestPOI(p => p.cat === cat);
  if (any) return goDreamPOI(any, `Pas de ${T.l} tout près : ${any.name} a aussi sa spécialité maison.`);
  if (POI_CATS[cat]) return searchAroundHome(p => p.cat === cat, catLabel(cat));
  openSheet('voyage');
}

// ---------------- affichage ----------------
const BT_IC = {
  lieu: '<path d="M12 21 C7 15 5 12 5 9 a7 7 0 0 1 14 0 c0 3-2 6-7 12Z" fill="#f3aec1" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="2.6" fill="#fff" stroke="currentColor" stroke-width="1.5"/>',
  cat: '<path d="M4 10 V20 H20 V10" fill="#fff3e2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10 L5 4 H19 L21 10Z" fill="#f6d88a" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  tag: '<path d="M3 19 L9 9 L13 15 L16 11 L21 19Z" fill="#bfe3d6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="17" cy="6" r="2.2" fill="#f6c445"/>',
  reg: '<path d="M4 6 L9 4 L15 6 L20 4 V18 L15 20 L9 18 L4 20Z" fill="#d9ccf5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  pays: '<circle cx="12" cy="12" r="8.4" fill="#9fd1f0" stroke="currentColor" stroke-width="1.8"/><path d="M7 9 q3 -2 5 1 t5 1 M6 15 q4 2 7 -1" fill="none" stroke="#4f9f78" stroke-width="2"/>',
  rec: '<path d="M5 20 L14 11" stroke="#a87a50" stroke-width="3.4" stroke-linecap="round"/><path d="M11.5 5 L18 3 L21 6 L19 12.5 L15.5 9 L13.5 9.5Z" fill="#b9c4cc" stroke="currentColor" stroke-width="1.7"/>',
  shop: '<rect x="4" y="8" width="16" height="12" rx="2" fill="#f6c2cf" stroke="currentColor" stroke-width="1.8"/><path d="M8 8 a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="1.8"/>',
};
const btIco = k => `<svg class="btic" viewBox="0 0 24 24" aria-hidden="true">${BT_IC[k] || BT_IC.tag}</svg>`;
let BT_GO = [];
function btWhereHTML(itOrName, max = 4) {
  const srcs = btSources(itOrName); if (BT_GO.length > 300) BT_GO = [];
  const best = btBest(srcs);
  const rows = srcs.slice(0, max).map(s => { const i = BT_GO.push(s.step) - 1; return `<div class="btrow">${btIco(s.ico)}<span>${esc(s.txt)}</span><button class="btn ${s === best ? 'gold' : 'cream'} sm" data-btgo="${i}">${esc(s.go)}</button></div>`; }).join('');
  return `<div class="obsec btwhere"><h3>Où le trouver</h3><div class="btrows">${rows}</div></div>`;
}
// fiche d'un objet (possédé ou non) depuis la recherche
function btInfoModal(name) {
  const e = btCatalog().get(name), own = S.inv.filter(i => i.name === name || i.fr === name);
  const it = own[0] || (e ? { name, cat: e.def[1], sub: e.def[2], rarity: e.def[3] || 0, look: e.def[4] || null, color: e.def[5] || null } : null);
  if (!it) return;
  if (own[0] && typeof openFiche === 'function') return openFiche(own[0].id);
  const lab = it.cat === 'v' ? (SLOT_LABEL[it.sub] || 'Vêtement') : (CAT_LABEL[it.cat] || '');
  showModal(`<div class="fiche btfiche" style="--rc:${RARC[it.rarity] || RARC[0]}"><div class="fico">${itemIcon(it)}</div><h2>${esc(name)}</h2><span class="frar">${RARITY[it.rarity] || ''} · ${esc(lab)}</span><p class="btnot">Pas encore dans votre sac.</p>${btWhereHTML(name, 5)}<div class="obff"><button class="btn green sm" data-btclose="1">Fermer</button></div></div>`);
}
// fiche d'objet : section « Où le trouver »
if (typeof openFiche === 'function') openFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  try {
    const it = S.inv.find(i => i.id === id), f = document.querySelector('#modal .fiche');
    if (it && f && !it.tresor && !f.querySelector('.btwhere')) {
      let extra = '';
      if (it.fr) extra = `<p class="btnot">En France, on dirait : « ${esc(it.fr)} ».</p>`;
      const html = extra + btWhereHTML(it), anchor = f.querySelector('.obval') || f.querySelector('.obff');
      if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else f.insertAdjacentHTML('beforeend', html);
    }
  } catch (e) { console.error('butin', e); }
  return r;
})(openFiche);

// ---------------- recherche dans le sac ----------------
let btQ = '';
function btSearch(q, max = 12) {
  q = btNorm(q).trim(); if (q.length < 2) return [];
  const words = q.split(/\s+/), out = [], seen = new Set();
  const match = s => { const n = btNorm(s); return words.every(w => n.includes(w)); };
  // objets possédés d'abord (spécialités de lieux comprises)
  S.inv.forEach(it => { if (!seen.has(it.name) && (match(it.name) || (it.fr && match(it.fr)))) { seen.add(it.name); out.push({ name: it.name, it, own: true }); } });
  for (const [name, e] of btCatalog()) {
    if (seen.has(name)) continue;
    const extra = e.src.map(s => s.k === 'pays' ? btIsoName(s.v) : (s.k === 'reg' || s.k === 'fr') && RG[s.v] ? RG[s.v].name : '').join(' ');
    if (match(name) || (extra && match(extra))) { seen.add(name); out.push({ name, def: e.def }); }
  }
  const st = n => (btNorm(n).startsWith(words[0]) ? 0 : 1);
  return out.sort((a, b) => (b.own ? 1 : 0) - (a.own ? 1 : 0) || st(a.name) - st(b.name) || a.name.localeCompare(b.name)).slice(0, max);
}
function btResultsHTML() {
  if (btNorm(btQ).trim().length < 2) return '';
  const res = btSearch(btQ);
  if (!res.length) return `<p class="btnone">Aucun objet ne correspond à « ${esc(btQ)} ».</p>`;
  if (BT_GO.length > 300) BT_GO = [];
  return res.map(r => {
    const it = r.it || { name: r.name, cat: r.def[1], sub: r.def[2], rarity: r.def[3] || 0, look: r.def[4] || null, color: r.def[5] || null };
    const n = S.inv.filter(i => i.name === r.name || i.fr === r.name).length;
    const best = btBest(btSources(r.it || r.name)), gi = BT_GO.push(best.step) - 1;
    return `<div class="btres" style="--rc:${RARC[it.rarity] || RARC[0]}"><button class="btri" data-btinfo="${esc(r.name)}" aria-label="Où trouver ${esc(r.name)}"><span class="btico">${itemIcon(it)}</span><span class="btrt"><b>${esc(r.name)}</b><small>${n ? `Dans le sac ×${n}` : 'Pas encore trouvé'} · ${esc(best.txt)}</small></span></button><button class="btn gold sm" data-btgo="${gi}">${esc(best.go)}</button></div>`;
  }).join('');
}
if (typeof renderBag === 'function') renderBag = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const host = box || $('panelBody'); if (!host || host.querySelector('.btsearch')) return r;
    const html = `<div class="btsearch"><label class="btsl"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15 L20 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg><input class="btq" type="search" autocomplete="off" placeholder="Chercher un objet (ex. lavande, mochi, Italie…)" value="${esc(btQ)}"></label><div class="btlist">${btResultsHTML()}</div></div>`;
    const head = host.querySelector('.phead') || host.querySelector('.obhead');
    if (head) head.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html);
  } catch (e) { console.error('butin', e); }
  return r;
})(renderBag);

// ---------------- aperçu du lieu avant de partir ----------------
function btCardHTML(d) {
  if (!d || (!d.poi && d.id == null) || !isFinite(+d.lon)) return '';
  const I = btInfo(d), id = btIdentity(d, I), mood = btMood(I.key), S2 = btState();
  const loc = I.C ? `Produits locaux : ${I.C.n} · ` : I.F && I.otherReg && I.R ? `Produits locaux : ${I.R.short} · ` : '';
  const owned = n => S.inv.some(i => i.name === n);
  const specs = id.specs.map(s => `<li>${owned(s[0]) ? '<b>✓</b> ' : ''}${esc(s[0])}</li>`).join('');
  return `<div class="btcard"><div class="btch"><b>Carte d’identité du lieu</b><small>${esc(id.label)}${I.km >= 1 ? ' · ' + Math.round(I.km).toLocaleString('fr-FR') + ' km' : ''}</small></div><ul>${specs}</ul>
    <p><span class="btk">Objet signature</span> ${S2.seen[I.key] ? esc(id.sig[0]) : '??? (plus probable à la première visite)'}</p>
    <p><span class="btk">Humeur du jour</span> ${esc(mood.t)} : ${esc(mood.d)}.</p>${loc || I.rural ? `<p class="btsm">${esc(loc)}${I.rural ? 'Produits du terroir' : ''}${I.exo > 0.3 ? ' · Loin de chez vous : butin très différent !' : ''}</p>` : ''}</div>`;
}
if (typeof liveFindHTML === 'function') liveFindHTML = (orig => function (d) {
  let h = orig.apply(this, arguments);
  try { h += btCardHTML(d); } catch (e) { console.error('butin', e); }
  return h;
})(liveFindHTML);

// ---------------- commandes et rêves : même « Où le trouver » ----------------
if (typeof bqReqWhere === 'function') bqReqWhere = (orig => function (r) { const w = orig.apply(this, arguments); if (w || !r || !r.def) return w; try { return btWhereShort(r.def[0]); } catch (e) { return w; } })(bqReqWhere);
if (typeof bqStepFor === 'function') bqStepFor = (orig => function (r) { const s = orig.apply(this, arguments); if (s || !r || !r.def) return s; try { return btStepFor(r.def[0]); } catch (e) { return s; } })(bqStepFor);
if (typeof srcStep === 'function') srcStep = (orig => function (st) { const s = orig.apply(this, arguments); if (s || !st || !st.name) return s; try { return btStepFor(st.name); } catch (e) { return s; } })(srcStep);
if (typeof goDreamStep === 'function') goDreamStep = (orig => function (st) { if (st && st.fn) { try { return st.fn(); } catch (e) { console.error('butin', e); } return; } return orig.apply(this, arguments); })(goDreamStep);

// ---------------- événements ----------------
document.addEventListener('input', e => {
  if (!e.target || !e.target.classList || !e.target.classList.contains('btq')) return;
  btQ = e.target.value; const w = e.target.closest('.btsearch'), l = w && w.querySelector('.btlist'); if (l) l.innerHTML = btResultsHTML();
});
document.addEventListener('click', e => {
  const g = e.target.closest && e.target.closest('[data-btgo]');
  if (g) { e.preventDefault(); e.stopPropagation(); btRun(BT_GO[+g.dataset.btgo]); return; }
  const inf = e.target.closest && e.target.closest('[data-btinfo]');
  if (inf) { e.preventDefault(); e.stopPropagation(); btInfoModal(inf.dataset.btinfo); return; }
  const c = e.target.closest && e.target.closest('[data-btclose]');
  if (c) { e.preventDefault(); $('modal').hidden = true; }
}, true);

// ---------------- styles ----------------
(function () {
  const css = `.btwhere .btrows{display:flex;flex-direction:column;gap:6px}.btrow{display:flex;align-items:center;gap:8px;background:#fff8ec;border-radius:12px;padding:6px 8px;font-size:.88rem;line-height:1.2}.btrow span{flex:1}.btrow .btn{flex:none}
.btic{width:22px;height:22px;flex:none;color:#5b4636}.btnot{font-size:.85rem;opacity:.8;margin:4px 0}
.btsearch{margin:6px 0 10px}.btsl{display:flex;align-items:center;gap:6px;background:#fff;border:2px solid #e8d9c4;border-radius:999px;padding:4px 12px}.btsl svg{width:20px;height:20px;color:#9a8670;flex:none}
.btsl input{border:0;outline:0;flex:1;font:inherit;font-size:1rem;background:transparent;min-width:0;padding:6px 0}.btlist{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.btres{display:flex;align-items:center;gap:6px;background:#fff;border-radius:14px;padding:5px 6px;border-left:5px solid var(--rc)}.btri{display:flex;align-items:center;gap:8px;flex:1;min-width:0;background:none;border:0;text-align:left;font:inherit;cursor:pointer;padding:0;color:inherit}
.btico{width:38px;height:38px;flex:none;display:grid;place-items:center}.btico svg{width:36px;height:36px}.btrt{display:flex;flex-direction:column;min-width:0}.btrt b{font-size:.92rem;line-height:1.15}.btrt small{font-size:.75rem;opacity:.75;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.btnone{font-size:.88rem;opacity:.75;padding:4px 8px}
.btcard{background:#fff8ec;border:2px dashed #e3c99a;border-radius:14px;padding:8px 10px;margin:8px 0;font-size:.86rem}.btcard ul{margin:4px 0 6px 18px;padding:0}.btcard p{margin:3px 0}.btch{display:flex;justify-content:space-between;gap:6px;align-items:baseline}.btch small{opacity:.7}
.btk{display:inline-block;background:#f3e6cf;border-radius:8px;padding:0 6px;font-size:.75rem;font-weight:700;margin-right:4px}.btsm{font-size:.78rem;opacity:.8}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();
window.__butin = { info: btInfo, identity: btIdentity, mood: btMood, simulate: btSimulate, sources: btSources, search: btSearch, sub: btSub, infoModal: btInfoModal };

// ================= 88 · PLUS DE SITUATIONS, ET CHAQUE LIEU A LES SIENNES (v84) =================
// Le joueur (17/11) : la piscine, le sport, les aires de jeux, les parcs et le zoo recevaient les situations de la campagne
// (une vache dans une piscine !) ; « et pour les magasins de vêtements ? ». On ajoute leurs propres situations,
// on étoffe le château et le désert, et la fromagerie, l'épicerie, le marché, la boucherie et le caviste ont aussi le coup de main en cuisine.
const s2$ = (f, d) => { try { return f(); } catch (e) { return d; } };
try {
  Object.assign(SX_KIND, { parc: 'parc', jardin: 'parc', zoo: 'zoo', piscine: 'piscine', sport: 'sport', jeux: 'jeux', mode: 'mode', friperie: 'mode', boutique: 'mode', jouets: 'mode', coiffeur: 'mode', fleuriste: 'mode' });
  Object.assign(SX_AFF, { parc: ['quokka', 'lemur', 'renard'], zoo: ['lemur', 'paresseux'], piscine: ['axo', 'phoque', 'capy'], sport: ['renard', 'lemur', 'quokka'], jeux: ['lemur', 'quokka', 'panda'], mode: ['renard', 'panda'] });
  const NEW = [
    // ---------- PARCS ET JARDINS ----------
    X('pa_cerfvolant', 'parc', 'c', '🪁', 'Le cerf-volant d’un enfant s’est pris dans le plus haut arbre de {p}. Il pleure à chaudes larmes.', [
      Sf('Le consoler et repartir', '{n} lui offre un sourire et une caresse.'),
      Rk('Grimper le décrocher', 0.6, 'Cerf-volant sauvé ! Les parents remercient {n} avec un goûter… et la grand-mère sort un trésor de son sac.', { loot: 3, luck: 0.4 }, 'La branche craque : {n} atterrit dans un massif de fleurs, le sac à moitié vidé.', W),
      Ast('Fabriquer un long bâton', ['bois'], 'du bois', 'Avec un long bâton, {n} décroche le cerf-volant sans même grimper. La famille est ravie !', { loot: 3, luck: 0.5 })]),
    X('pa_kiosque', 'parc', 'c', '🎺', 'Une fanfare joue sous le kiosque de {p}. Le chef cherche quelqu’un pour taper sur la grosse caisse.', [
      Sf('Écouter assis sur un banc', '{n} bat la mesure avec la patte.'),
      Rk('Monter jouer avec eux', 0.65, '{n} garde le rythme comme un pro ! La fanfare partage la recette du concert.', { coins: 70, loot: 1 }, '{n} rate tous les temps… le public rit, et il faut rendre la baguette cassée.', { coins: -20 })]),
    X('pa_canards', 'parc', 'c', '🦆', 'Une famille de canards traverse l’allée de {p}. Un caneton est resté coincé derrière une grille.', [
      Sf('Prévenir le jardinier', 'Le jardinier s’en occupe et offre une fleur à {n}.'),
      Rk('Le libérer soi-même', 0.7, 'Le caneton rejoint sa maman ! Le jardinier, ému, ouvre à {n} la serre qu’il ne montre à personne.', { loot: 3, luck: 0.6 }, '{n} se coince à son tour… il faut appeler le jardinier, et le sac est tout froissé.', { lose: 0.2 })]),
    X('pa_serre', 'parc', 'u', '🌺', 'La grande serre de {p} est fermée, mais la porte n’est pas verrouillée. Une odeur de fleurs rares s’en échappe.', [
      Sf('Attendre l’ouverture', '{n} visite la serre aux heures prévues.', { time: 1.15 }),
      Rk('Se glisser à l’intérieur', 0.55, 'Une orchidée qui ne fleurit qu’une fois tous les dix ans ! Le botaniste, ravi d’avoir un témoin, offre une bouture.', { loot: 3, luck: 1 }, 'L’arroseur automatique se déclenche : {n} ressort trempé, le sac en moins.', W)]),
    X('pa_statue', 'parc', 'l', '🗽', 'À la tombée du jour, la statue du parc de {p} semble cligner de l’œil à {n}. On raconte qu’elle garde un secret depuis deux siècles.', [
      Sf('Se frotter les yeux et rentrer', '{n} rentre en se demandant s’il a rêvé.'),
      Rk('Examiner le socle de la statue', 0.6, 'Une pierre se déboîte : derrière, une boîte en fer pleine de souvenirs d’un ancien jardinier… et une carte !', { loot: 3, luck: 1.6, stones: 2, lead: 1 }, 'Un gardien siffle : le parc ferme, il faut partir tout de suite.', SLOW)], 'nuit'),

    // ---------- ZOO ET AQUARIUM ----------
    X('z_soigneur', 'zoo', 'c', '🦒', 'La soigneuse de {p} est débordée : c’est l’heure du repas de tous les animaux en même temps.', [
      Sf('Regarder le repas des girafes', '{n} regarde les girafes manger, fasciné.'),
      Rk('L’aider à nourrir les animaux', 0.7, 'Tout le monde a mangé ! La soigneuse fait visiter à {n} les coulisses du zoo.', { loot: 3, luck: 0.5, boost: 1 }, 'Un singe chipe le seau… et une partie du sac de {n} avec.', W)]),
    X('z_pingouins', 'zoo', 'c', '🐧', 'Un petit pingouin s’est échappé de son enclos et file vers la sortie de {p} !', [
      Sf('Prévenir un gardien', 'Le gardien rattrape le pingouin et remercie {n}.'),
      Rk('Le rattraper soi-même', 0.55, '{n} le rattrape d’un plongeon ! Le directeur du zoo lui offre une visite privée et un souvenir.', { loot: 3, coins: 40 }, 'Le pingouin glisse plus vite que {n}, qui s’étale dans une flaque.', { lose: 0.25 }),
      Ast('L’attirer avec un poisson', ['mer'], 'un poisson', 'Le pingouin revient en se dandinant ! Le zoo remercie {n} comme un héros.', { loot: 3, luck: 0.6, coins: 40 })]),
    X('z_aquarium', 'zoo', 'u', '🐙', 'Dans le grand aquarium de {p}, une pieuvre tape contre la vitre et montre quelque chose du bout d’un tentacule.', [
      Sf('Lui faire coucou et repartir', 'La pieuvre fait coucou en retour. Adorable.'),
      Rk('Suivre ce qu’elle montre', 0.6, 'Une trappe de service mène à la réserve des trésors de l’aquarium : coquillages, perles, cartes marines !', { loot: 3, luck: 1 }, 'Un employé surprend {n} : retour à la sortie, et vite.', SLOW)]),
    X('z_naissance', 'zoo', 'l', '🐘', 'Grand événement à {p} : un bébé éléphant va naître aujourd’hui ! Les soigneurs cherchent quelqu’un de calme pour rassurer la maman.', [
      Sf('Laisser faire les soigneurs', '{n} attend dehors et entend un petit barrissement. Il est né !'),
      Rk('Rester auprès de la maman', 0.7, 'Tout s’est bien passé ! Le bébé s’appellera comme {n}… et le zoo lui fait un cadeau inoubliable.', { loot: 3, luck: 1.6, stones: 2, coins: 80 }, 'La maman s’agite : les soigneurs demandent à {n} de sortir.', SLOW)]),

    // ---------- PISCINE ----------
    X('pi_plongeoir', 'piscine', 'c', '🤿', 'Au plongeoir de {p}, les plus courageux sautent de 5 mètres sous les applaudissements.', [
      Sf('Rester au petit bain', '{n} fait la planche, tranquille.'),
      Rk('Sauter de tout en haut', 0.55, 'Splash parfait ! Toute la piscine applaudit et le maître-nageur offre une récompense à {n}.', { loot: 2, coins: 50 }, 'Plat magistral ! Ça pique… et le sac est trempé.', { lose: 0.25 })]),
    X('pi_bague', 'piscine', 'c', '💍', 'Une dame a perdu sa bague au fond du grand bassin de {p}. Elle est désespérée.', [
      Sf('Prévenir le maître-nageur', 'Il plongera à la fermeture. La dame remercie {n}.'),
      Rk('Plonger la chercher', 0.6, '{n} remonte la bague ! La dame, émue, lui offre un souvenir de famille et lui parle de son village natal.', { loot: 2, luck: 1, lead: 1 }, 'Il y a trop de monde, {n} ne trouve rien et boit la tasse.', SLOW)]),
    X('pi_course', 'piscine', 'u', '🏊', 'Une course de nage commence à {p}. Il manque un concurrent dans la ligne 4.', [
      Sf('Encourager depuis le bord', '{n} encourage tout le monde.'),
      Rk('Prendre la ligne 4', 0.5, 'Victoire sur le fil ! {n} monte sur le podium et repart avec la médaille.', { loot: 3, coins: 60, luck: 0.5 }, 'Crampe au milieu du bassin : {n} finit dernier, et doit payer l’inscription.', { coins: -25 })]),
    X('pi_toboggan', 'piscine', 'c', '🌀', 'Le nouveau toboggan géant de {p} ouvre aujourd’hui. La file d’attente est immense… mais il y a un escalier de service.', [
      Sf('Faire la queue', '{n} attend son tour et s’amuse comme un fou.', { time: 1.15 }),
      Rk('Prendre l’escalier de service', 0.5, 'Personne n’a rien vu ! {n} glisse le premier et trouve un objet oublié dans la cabine.', { loot: 2, time: 0.7 }, 'Le maître-nageur siffle : {n} est renvoyé au bout de la file.', SLOW)]),

    // ---------- TERRAINS DE SPORT ----------
    X('sp_match', 'sport', 'c', '⚽', 'Un match de quartier à {p} : une équipe a un joueur en moins et le match va commencer.', [
      Sf('Regarder depuis la touche', '{n} applaudit les plus beaux buts.'),
      Rk('Rejoindre l’équipe', 0.55, 'But décisif de {n} ! L’équipe le porte en triomphe et partage le goûter de la victoire.', { loot: 3, luck: 0.3 }, 'Défaite… et {n} a déchiré son sac en glissant sur le terrain.', { lose: 0.25 })]),
    X('sp_ballon', 'sport', 'c', '🏀', 'Un ballon passe par-dessus le grillage de {p} et roule vers un terrain vague plein de broussailles.', [
      Sf('Laisser les joueurs le chercher', 'Les joueurs le retrouvent et saluent {n}.'),
      Rk('Aller le chercher dans les broussailles', 0.65, 'En cherchant le ballon, {n} trouve une vieille cachette d’enfants pleine de trésors oubliés !', { loot: 3, luck: 0.6 }, 'Les ronces ! {n} ressort griffé, le sac troué.', W)]),
    X('sp_marathon', 'sport', 'u', '🏃', 'Le départ d’une course à pied passe juste devant {n}. On peut s’inscrire au dernier moment.', [
      Sf('Encourager les coureurs', '{n} tend des gobelets d’eau aux coureurs.'),
      Rk('Courir avec eux', 0.5, '{n} franchit la ligne d’arrivée parmi les premiers ! Médaille, panier de récompense et ovation.', { loot: 3, coins: 70, luck: 0.4 }, 'Point de côté au 3e kilomètre : {n} rentre à pied, très fatigué.', { time: 1.4 })]),
    X('sp_champion', 'sport', 'l', '🏆', 'Une ancienne championne s’entraîne seule sur la piste de {p}. Elle propose à {n} un défi : la battre au sprint.', [
      Sf('Décliner en souriant', 'Elle rit et signe un autographe pour {n}.'),
      Rk('Relever le défi', 0.4, 'Incroyable, {n} gagne d’un museau ! Elle lui offre sa médaille d’or, son bien le plus précieux.', { loot: 2, luck: 2, stones: 2, coins: 100 }, 'Elle est bien trop rapide… mais elle donne de bons conseils à {n}.', { boost: 1 })]),

    // ---------- AIRES DE JEUX ----------
    X('j_bac', 'jeux', 'c', '🏗️', 'Dans le bac à sable de {p}, des enfants jurent qu’un trésor de pirate est enterré.', [
      Sf('Les laisser creuser', '{n} les regarde creuser en riant.'),
      Rk('Creuser avec eux', 0.6, 'Ils avaient raison ! Une petite boîte enterrée par d’autres enfants il y a longtemps.', { loot: 3, luck: 0.5 }, 'Rien, à part du sable partout… jusque dans le sac.', { lose: 0.2 })]),
    X('j_balancoire', 'jeux', 'c', '🎠', 'Un concours improvisé : qui ira le plus haut sur la balançoire de {p} ?', [
      Sf('Juste se balancer doucement', '{n} profite d’un moment de douceur.'),
      Rk('Aller le plus haut possible', 0.6, 'Tout là-haut, {n} aperçoit quelque chose coincé sur le toit du kiosque… et va le chercher !', { loot: 2, luck: 0.6, lead: 1 }, 'Chute dans le sable ! Rien de cassé, mais quelques objets ont volé.', { lose: 0.25 })]),
    X('j_toupie', 'jeux', 'c', '🪀', 'Un vieux monsieur sur un banc de {p} défie tous les enfants à la toupie. Personne ne l’a jamais battu.', [
      Sf('Regarder les parties', '{n} apprend quelques astuces en regardant.'),
      Rk('L’affronter', 0.45, '{n} le bat ! Il éclate de rire et offre sa plus vieille toupie, sculptée à la main.', { loot: 2, luck: 1.2 }, 'La toupie de {n} file sous le banc… perdue, avec la mise.', { coins: -15 })]),
    X('j_tresor', 'jeux', 'u', '🗺️', 'Les enfants de {p} organisent une chasse au trésor et cherchent un capitaine pour l’équipe des petits.', [
      Sf('Leur souhaiter bonne chance', '{n} leur donne un indice au passage.'),
      Rk('Devenir capitaine', 0.65, 'L’équipe des petits gagne ! Ils partagent le trésor avec leur capitaine.', { loot: 3, luck: 0.5, time: 1.15 }, 'L’équipe se perd dans le parc… la chasse dure tout l’après-midi.', { time: 1.5 })]),

    // ---------- BOUTIQUES DE VÊTEMENTS, FRIPERIES, BOUTIQUES ----------
    X('md_cabine', 'mode', 'c', '👗', 'Dans une boutique de {p}, la vendeuse propose à {n} d’essayer la nouvelle collection en avant-première.', [
      Sf('Juste regarder les vitrines', '{n} admire les tenues et repart avec un catalogue.'),
      Rk('Défiler dans la boutique', 0.6, '{n} fait sensation ! La vendeuse lui offre un accessoire de la collection.', { loot: 2, luck: 0.8 }, 'Un ourlet craque… il faut payer la retouche.', { coins: -30 })]),
    X('md_friperie', 'mode', 'c', '🧥', 'Au fond d’une friperie de {p}, une malle remplie de vieux vêtements attend d’être triée. « Tout ce que tu trouves, c’est 10 pièces. »', [
      Sf('Prendre le premier pull', '{n} repart avec un pull tout doux.', { loot: 1, coins: -10 }),
      Rk('Fouiller toute la malle', 0.55, 'Tout au fond : une veste ancienne, d’une grande maison de couture ! Et ce n’est que 10 pièces.', { loot: 2, luck: 1.4, coins: -10 }, 'Rien que des chaussettes dépareillées… et {n} a passé des heures à fouiller.', { time: 1.3, coins: -10 })]),
    X('md_soldes', 'mode', 'c', '🛍️', 'C’est le premier jour des soldes à {p} ! Une foule attend devant la boutique avant l’ouverture.', [
      Sf('Revenir plus tard', '{n} passe en fin de journée et trouve une petite affaire.'),
      Rk('Se faufiler devant', 0.5, '{n} entre le premier et attrape la plus belle pièce à moitié prix !', { loot: 2, luck: 0.8, coins: 30 }, 'Bousculade ! {n} ressort les mains vides et le sac de travers.', { lose: 0.3 })]),
    X('md_couturiere', 'mode', 'u', '🧵', 'Une couturière de {p} doit livrer une robe de mariée ce soir. Il lui manque une paire de pattes pour tenir le tissu.', [
      Sf('Lui souhaiter bon courage', 'Elle remercie {n} d’un bouton doré.'),
      Rk('L’aider jusqu’au bout', 0.7, 'La robe est prête à temps ! La couturière offre à {n} un vêtement cousu main et lui confie des chutes de tissu rare.', { loot: 3, luck: 1, time: 1.2 }, 'Une épingle pique {n}, qui renverse la boîte de boutons… il faut tout ramasser.', SLOW),
      Ast('Lui offrir de la laine', ['laine'], 'de la laine', 'Exactement ce qu’il lui manquait ! En échange, elle coud un vêtement unique pour {n}.', { loot: 3, luck: 1.2 })]),
    X('md_createur', 'mode', 'l', '✂️', 'Un grand créateur de mode cherche un modèle pour son défilé de ce soir à {p}. Il a repéré {n} dans la rue !', [
      Sf('Refuser timidement', 'Il glisse sa carte dans la patte de {n}. Peut-être une autre fois.'),
      Rk('Défiler sur le podium', 0.6, 'Ovation ! {n} est la révélation du défilé. Le créateur lui offre une pièce unique de sa collection.', { loot: 3, luck: 2, stones: 2, coins: 100 }, 'Trac sur le podium… {n} trébuche, et le défilé continue sans lui.', SLOW)]),

    // ---------- CHÂTEAU (en plus) ----------
    X('c_bibli', 'chateau', 'c', '📜', 'La bibliothèque du château de {p} est ouverte exceptionnellement. Un livre semble dépasser plus que les autres.', [
      Sf('Feuilleter les livres exposés', '{n} lit l’histoire du château.'),
      Rk('Tirer le livre', 0.55, 'La bibliothèque pivote ! Un passage secret mène à un cabinet de curiosités.', { loot: 3, luck: 1 }, 'Rien ne bouge, mais une pile de livres s’effondre sur {n}.', { lose: 0.2 })]),
    X('c_tournoi', 'chateau', 'u', '🏇', 'Un tournoi de chevalerie est reconstitué au pied de {p}. On cherche un écuyer.', [
      Sf('Regarder depuis les gradins', '{n} acclame le chevalier en bleu.'),
      Rk('Devenir écuyer', 0.65, 'Le chevalier gagne ! Il partage les honneurs, et un trophée, avec son écuyer.', { loot: 3, luck: 0.6, coins: 40 }, 'Le cheval s’emballe et {n} lâche tout ce qu’il portait.', W)]),
    X('c_jardins', 'chateau', 'c', '🌹', 'Les jardins de {p} forment un labyrinthe de buis. Au centre, dit-on, une fontaine exauce les vœux.', [
      Sf('Rester dans les allées', '{n} se promène parmi les roses.'),
      Rk('Trouver le centre du labyrinthe', 0.5, '{n} atteint la fontaine ! Au fond de l’eau brillent des pièces d’or et un vieux médaillon.', { loot: 2, luck: 1, coins: 60 }, '{n} tourne en rond dans le labyrinthe pendant des heures.', { time: 1.6 })]),

    // ---------- DÉSERT (en plus) ----------
    X('d_caravane', 'desert', 'c', '🐪', 'Une caravane de chameaux s’arrête pour la nuit. Le chef propose à {n} de partager le thé… et une partie de dés.', [
      Sf('Partager le thé et dormir', '{n} passe une belle soirée sous les étoiles.'),
      Rk('Jouer aux dés', 0.5, '{n} gagne ! Le chef de la caravane paie en épices et en tissus précieux.', { loot: 3, luck: 0.8 }, '{n} perd… il faut payer en pièces.', { coins: -40 })]),
    X('d_cite', 'desert', 'u', '🏺', 'Le vent a dégagé le haut d’une tour de pierre ensablée. Une entrée sombre s’ouvre au ras du sable.', [
      Sf('Prendre une photo et repartir', 'Une photo unique, que personne d’autre n’a.'),
      Rk('Descendre dans la tour', 0.5, 'Une salle intacte depuis des siècles, pleine d’objets anciens !', { loot: 3, luck: 1.4, lead: 1 }, 'Le sable glisse et bouche l’entrée : {n} ressort par une fissure, sans tout son sac.', WL)]),
    X('d_nomade', 'desert', 'c', '🧕', 'Une vieille nomade a perdu une de ses chèvres derrière les dunes. Le soleil tape fort.', [
      Sf('Lui indiquer la direction', 'Elle remercie {n} d’une datte bien sucrée.'),
      Rk('Partir chercher la chèvre', 0.65, 'La chèvre est retrouvée ! La nomade offre à {n} un bijou de sa famille.', { loot: 2, luck: 1 }, 'La chaleur est écrasante : {n} doit rentrer à l’ombre, épuisé.', SLOW)]),
  ];
  NEW.forEach(s => { SX.push(s); SX_BY[s.id] = s; });
} catch (e) { console.error('situations 2', e); }

// ---------- la cuisine aussi à la fromagerie, l'épicerie, le marché, la boucherie, chez le caviste ----------
try {
  Object.assign(CK_SHOPS, { fromagerie: 'epic', epicerie: 'epic', marche: 'epic', boucherie: 'epic', caviste: 'epic' });
  Object.assign(CK_ING, { pain: ['🥖', 'Pain'], raisin: ['🍇', 'Raisin'], jambon: ['🥓', 'Jambon'], salade: ['🥬', 'Salade'], olive: ['🫒', 'Olives'], pomme_t: ['🥔', 'Pommes de terre'] });
  CK_REC.epic = [
    ['Plateau de fromages', '🧀', ['fromage', 'raisin', 'pain', 'miel'], 'Trancher', 'Affiner', ['Plateau de fromages', 'n', 'fromage', 1, null, '#f2d36a']],
    ['Panier du marché', '🧺', ['pomme', 'carotte', 'salade', 'fromage'], 'Choisir', 'Emballer', ['Panier du marché', 'n', 'legume', 1, null, '#7fbf6a']],
    ['Sandwich jambon-beurre', '🥪', ['pain', 'beurre', 'jambon', 'salade'], 'Trancher', 'Griller', ['Jambon-beurre', 'n', 'pain', 1, null, '#e2b46a']],
    ['Raclette', '🫕', ['fromage', 'pomme_t', 'jambon', 'oignon'], 'Couper', 'Fondre', ['Raclette du chalet', 'n', 'plat', 2, null, '#f0c76a']],
  ];
  CK_PLACE.epic = 'le commerce';
} catch (e) { console.error('cuisine épicerie', e); }

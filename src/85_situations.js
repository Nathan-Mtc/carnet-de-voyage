// ================= 85 · LES SITUATIONS D'AVENTURE (v81) =================
// Le joueur (17/11) : « une très grande pluralité de situations, qui rend quasi chaque voyage unique ; c'est l'aventure ».
// Remplace les 8 scènes de 84 par ~60 situations écrites, sur 12 genres de lieux, avec :
//  - des variations selon l'heure (nuit), la saison, le vrai lieu et sa région, l'espèce du compagnon (à l'aise : +20 % de réussite) ;
//  - une option « astucieuse » qui n'apparaît que si on possède le bon objet (il est utilisé) ;
//  - des situations en 2 temps (un choix mène à un second) ;
//  - des conséquences variées : temps du voyage, butin gagné ou perdu, pièces, bonus pour le prochain voyage, piste rare, pierres d'étoile ;
//  - 3 raretés : courante, peu fréquente, légendaire (très rare, grosses récompenses).
// Les lieux de nature gardent la cueillette (83) une fois sur deux ; l'autre fois, une situation d'aventure.
const sx$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- genres de lieux ----------
const SX_KIND = {
  ville: 'ville', rue: 'ville', mairie: 'ville', librairie: 'ville', boutique: 'ville', mode: 'ville', friperie: 'ville', jouets: 'ville', coiffeur: 'ville', laverie: 'ville', pharmacie: 'ville', cinema: 'ville', ecole: 'ville', poste: 'ville', hotel: 'ville', bricolage: 'ville', fleuriste: 'ville',
  marche: 'marche', boulangerie: 'marche', cafe: 'marche', restaurant: 'marche', glacier: 'marche', chocolaterie: 'marche', epicerie: 'marche', fromagerie: 'marche', boucherie: 'marche', caviste: 'marche', puces: 'marche',
  gare: 'gare', route: 'gare',
  port: 'port', phare: 'port', poissonnerie: 'port', mer: 'port',
  plage: 'plage', ile: 'plage',
  monument: 'monu', musee: 'monu', patrimoine: 'monu', bibliotheque: 'monu',
  chateau: 'chateau',
  foret: 'foret', sentier: 'foret', camping: 'foret',
  montagne: 'montagne', neige: 'montagne', belvedere: 'montagne',
  lac: 'eau', riviere: 'eau', etang: 'eau',
  desert: 'desert',
  campagne: 'campagne', ferme: 'campagne', verger: 'campagne', jardin: 'campagne', parc: 'campagne', agrumes: 'campagne', zoo: 'campagne',
};
function sxKindOf(d) { if (!d) return 'campagne'; const tags = [d.cat, ...(d.tags || [])]; if (/château|chateau|citadelle|forteresse/i.test(d.name || '')) return 'chateau'; for (const t of tags) if (t && SX_KIND[t]) return SX_KIND[t]; return 'campagne'; }
const SX_AFF = { port: ['axo', 'phoque', 'capy'], plage: ['axo', 'phoque', 'quokka'], eau: ['axo', 'capy', 'phoque'], montagne: ['panda', 'lemur'], chateau: ['panda', 'lemur'], foret: ['tanuki', 'renard', 'panda'], desert: ['fennec'], ville: ['renard', 'tanuki'], marche: ['capy', 'quokka', 'renard'], campagne: ['quokka', 'capy', 'lemur'], gare: ['renard'], monu: ['tanuki', 'paresseux'] };
const SX_SP_NM = { panda: 'les pandas roux', capy: 'les capybaras', axo: 'les axolotls', renard: 'les renards', fennec: 'les fennecs', tanuki: 'les tanukis', paresseux: 'les paresseux', lemur: 'les lémuriens', phoque: 'les phoques', quokka: 'les quokkas' };

// ---------- petits constructeurs ----------
// options : S = sûre, R = risquée (p = chance de réussite), A = astucieuse (besoin d'un objet : liste de familles d'objets)
// effets : loot (trouvailles), luck (qualité), time (× temps restant), coins, lead (piste), stones, boost (trouvailles au prochain voyage), lose (part du sac perdue), next (2e temps)
const Sf = (lb, tx, e = {}) => ({ t: 'S', lb, ok: Object.assign({ tx, loot: 1 }, e) });
const Rk = (lb, p, okTx, okE, koTx, koE) => ({ t: 'R', lb, p, ok: Object.assign({ tx: okTx }, okE), ko: Object.assign({ tx: koTx }, koE) });
const Ast = (lb, need, nm, tx, e) => ({ t: 'A', lb, need, nm, ok: Object.assign({ tx }, e) });
const X = (id, k, tier, ico, q, o, when) => ({ id, k, tier, ico, q, o, when });
const W = { lose: 0.35 }, WL = { lose: 0.5 }, SLOW = { time: 1.4 };

const SX = [
  // ================= VILLE =================
  X('v_toits', 'ville', 'c', '🏙️', '{n} se perd dans un dédale de ruelles de {p}. Une vieille dame montre un passage par les toits…', [
    Sf('Retrouver la grande avenue', '{n} prend son temps et flâne devant les vitrines.'),
    Rk('Passer par les toits', 0.6, 'Quelle vue sur {p} ! {n} file de toit en toit et déniche des trésors oubliés sur une terrasse.', { time: 0.5, loot: 3, luck: 0.3 }, 'Une tuile glisse : {n} se rattrape de justesse, mais une partie du sac tombe dans la cour.', W),
    Ast('Lui offrir une fleur pour son aide', ['fleur'], 'une fleur', 'Ravie, la vieille dame l’accompagne elle-même par un raccourci et lui confie un souvenir de famille.', { time: 0.6, loot: 2, luck: 0.6 })]),
  X('v_tram', 'ville', 'c', '🚋', 'Le dernier tram part dans une minute. {n} peut courir l’attraper… ou rentrer tranquillement à pied.', [
    Sf('Rentrer à pied', '{n} rentre à pied en sifflotant.'),
    Rk('Courir après le tram', 0.55, '{n} saute dans le tram au dernier moment : retour express, et un voyageur lui offre un souvenir.', { time: 0.5, loot: 2 }, 'Raté ! En courant, {n} renverse son sac sur les pavés.', W)]),
  X('v_musicien', 'ville', 'c', '🎻', 'Sur une place de {p}, un musicien de rue cherche quelqu’un pour tenir son chapeau pendant qu’il joue.', [
    Sf('Écouter un morceau et repartir', '{n} écoute, applaudit, et repart le cœur léger.'),
    Rk('Danser devant la foule', 0.65, 'La foule adore ! Le chapeau se remplit et le musicien partage la recette avec {n}.', { coins: 60, loot: 1 }, '{n} trébuche sur un pavé… les rires fusent, mais quelques objets roulent dans le caniveau.', { lose: 0.25 })]),
  X('v_chat', 'ville', 'c', '🐈', 'Un chat de gouttière a volé quelque chose de brillant et file vers les jardins de {p}.', [
    Sf('Le laisser filer', 'Après tout, ce n’était pas à {n}.'),
    Rk('Le suivre dans les jardins', 0.5, 'Le chat mène {n} à sa cachette : un vrai petit trésor de choses brillantes !', { loot: 3, luck: 0.5 }, '{n} se prend les pattes dans une haie et perd du temps.', SLOW),
    Ast('L’amadouer avec du pain', ['pain', 'plat'], 'un morceau de pain', 'Le chat ronronne et laisse {n} choisir dans son trésor.', { loot: 3, luck: 0.8 })]),
  X('v_librairie', 'ville', 'u', '📚', 'Dans une librairie poussiéreuse de {p}, un vieux livre tombe d’une étagère. Une carte dépasse des pages.', [
    Sf('Le remettre en place', '{n} range le livre. Le libraire lui offre un marque-page.'),
    Rk('Feuilleter le livre en cachette', 0.6, 'La carte indique un lieu secret !', { lead: 1, loot: 1 }, 'Le libraire gronde {n} et le fait sortir sans rien.', SLOW),
    Ast('Acheter le livre', ['coins:40'], '40 pièces', 'Le livre est à {n} : la carte indique un lieu secret, et le libraire ajoute un cadeau.', { lead: 1, loot: 2 })]),
  X('v_nuit', 'ville', 'u', '🏮', 'La nuit tombe sur {p}. Des lanternes s’allument une à une le long d’une ruelle qu’on ne voit pas le jour.', [
    Sf('Rentrer avant qu’il fasse trop noir', '{n} rentre sagement.'),
    Rk('Suivre les lanternes', 0.6, 'Au bout de la ruelle, un marché de nuit ! {n} y fait des trouvailles introuvables le jour.', { loot: 3, luck: 0.7 }, 'La ruelle tourne en rond… {n} met des heures à en sortir.', { time: 1.5 })], 'nuit'),
  X('v_parade', 'ville', 'l', '🎉', 'Une grande parade traverse {p} ! On cherche un compagnon pour monter sur le char de tête.', [
    Sf('Regarder depuis le trottoir', '{n} applaudit les chars et ramasse des confettis.'),
    Rk('Monter sur le char', 0.7, '{n} devient la star de la parade ! Toute la ville l’acclame et les cadeaux pleuvent.', { loot: 4, luck: 1, coins: 120, stones: 1 }, 'Le char penche : {n} dégringole dans la foule et perd une partie de son sac.', W)]),

  // ================= MARCHÉ, CAFÉS, BOULANGERIES =================
  X('m_marchand', 'marche', 'c', '🧺', 'Un marchand de {p} propose un panier « surprise » : il ne dit pas ce qu’il y a dedans.', [
    Sf('Passer son chemin', '{n} goûte les échantillons et continue sa route.'),
    Rk('Acheter le panier à l’aveugle', 0.55, 'Le panier est rempli de bonnes choses de la région !', { loot: 3, coins: -20 }, 'Le panier est rempli de… cailloux. Le marchand a déjà disparu.', { coins: -20 }),
    Ast('Proposer un troc', ['fruit', 'legume', 'fromage'], 'un produit frais', 'Le marchand adore le troc : il ouvre le panier et laisse {n} choisir le meilleur.', { loot: 3, luck: 0.6 })]),
  X('m_four', 'marche', 'c', '🥖', 'Le boulanger de {p} a mal au dos. Il demande si quelqu’un peut sortir les pains du four.', [
    Sf('S’excuser, on est pressé', '{n} achète un croissant pour la route.'),
    Rk('Sortir les pains du four', 0.7, 'Pas un seul pain brûlé ! Le boulanger remplit le sac de {n} et lui promet un accueil royal la prochaine fois.', { loot: 2, boost: 2 }, 'Aïe, c’est chaud ! {n} lâche une fournée… et doit la rembourser.', { coins: -30 })]),
  X('m_concours', 'marche', 'u', '🏆', 'Un concours de dégustation commence sur le marché de {p}. Il faut reconnaître trois produits les yeux bandés.', [
    Sf('Regarder le concours', '{n} goûte les restes après le concours.'),
    Rk('Participer', 0.5, '{n} reconnaît tout ! Premier prix : un panier du terroir.', { loot: 3, luck: 0.6, coins: 50 }, '{n} confond le sel et le sucre… les juges rient, mais il faut payer l’inscription.', { coins: -25 })]),
  X('m_pickpocket', 'marche', 'u', '🫣', 'Dans la foule du marché, {n} sent une patte se glisser dans son sac !', [
    Sf('Serrer son sac et partir', '{n} s’éloigne vite de la foule, rien n’a disparu.', { loot: 0 }),
    Rk('Rattraper le voleur', 0.55, '{n} le rattrape ! Le voleur rend tout ce qu’il avait pris… et bien plus encore.', { loot: 3, luck: 0.3 }, 'Le voleur est trop rapide : il disparaît avec une partie du sac.', WL)]),
  X('m_epices', 'marche', 'c', '🌶️', 'Un étal d’épices embaume tout le marché de {p}. La marchande cherche quelqu’un pour goûter une nouvelle recette… très piquante.', [
    Sf('Goûter du bout de la langue', '{n} goûte prudemment : délicieux, et la marchande lui offre un sachet.'),
    Rk('Croquer franchement', 0.5, 'Ça pique… mais {n} tient bon ! La marchande, impressionnée, lui confie ses meilleurs produits.', { loot: 3, luck: 0.5 }, '{n} pleure, tousse et doit s’asseoir une heure à l’ombre.', SLOW)]),
  X('m_chef', 'marche', 'l', '👨‍🍳', 'Un grand chef cuisine en plein marché de {p}. Son commis vient de partir : il cherche une paire de pattes, tout de suite.', [
    Sf('Laisser la place à d’autres', '{n} regarde le spectacle et repart avec une recette notée sur un ticket.'),
    Rk('Devenir son commis du jour', 0.6, 'Le chef est conquis ! Il offre à {n} un ustensile de légende et l’adresse de ses fournisseurs secrets.', { loot: 3, luck: 1.2, stones: 1, boost: 2 }, 'La sauce brûle… le chef soupire et renvoie {n} sans rien.', SLOW)]),

  // ================= GARE ET ROUTES =================
  X('g_quai', 'gare', 'c', '🚂', 'Deux trains partent en même temps : l’omnibus qui s’arrête partout, et l’express… dont {n} n’a pas le billet.', [
    Sf('Prendre l’omnibus', '{n} regarde défiler les paysages, tranquille.'),
    Rk('Se glisser dans l’express', 0.5, 'Personne n’a rien vu : retour express, et un voyageur généreux partage son pique-nique.', { time: 0.5, loot: 2 }, 'Le contrôleur ! {n} doit payer une amende et descendre à la gare suivante.', { coins: -40, time: 1.3 })]),
  X('g_valise', 'gare', 'c', '🧳', 'Une valise abandonnée trône au milieu du hall. Personne autour.', [
    Sf('La signaler au guichet', 'Le chef de gare remercie {n} d’un petit cadeau.'),
    Rk('Retrouver son propriétaire', 0.6, 'C’est celle d’une exploratrice ! Pour la remercier, elle lui parle d’un lieu extraordinaire.', { lead: 1, loot: 1 }, '{n} court partout dans la gare… et rate son train.', SLOW)]),
  X('g_autostop', 'gare', 'c', '🚐', 'Le car ne passe plus avant demain. Une camionnette de livreur ralentit au bord de la route.', [
    Sf('Attendre le car', '{n} campe sous l’abribus et repart au matin.', { time: 1.2 }),
    Rk('Monter avec le livreur', 0.65, 'Le livreur fait sa tournée : {n} l’aide à décharger et reçoit sa part.', { time: 0.6, loot: 2 }, 'Le livreur s’est trompé de route… grand détour !', { time: 1.5 })]),
  X('g_draisine', 'gare', 'u', '🛤️', 'Une vieille draisine dort sur une voie désaffectée. La voie file droit vers {p}.', [
    Sf('La laisser là', '{n} prend le chemin habituel.'),
    Rk('Pomper et partir !', 0.55, 'La draisine file comme le vent ! {n} arrive en avance et découvre une gare oubliée pleine de trouvailles.', { time: 0.4, loot: 3, luck: 0.4 }, 'Un aiguillage rouillé bloque tout : {n} doit pousser la draisine pendant des heures.', { time: 1.6 })]),
  X('g_orient', 'gare', 'l', '🚃', 'Un train ancien, tout de bois verni, s’arrête en gare. Le contrôleur sourit : « Il reste une place, mais nous ne disons jamais où nous allons. »', [
    Sf('Décliner poliment', 'Le train repart dans un nuage de vapeur. {n} se demandera longtemps où il allait.'),
    Rk('Monter à bord', 0.75, 'Un voyage magique à travers des paysages inconnus ! {n} revient les bras chargés de merveilles.', { loot: 4, luck: 1.4, stones: 2, lead: 1 }, 'Le train s’arrête au milieu de nulle part : {n} rentre à pied, très tard.', { time: 1.6 })]),

  // ================= PORT =================
  X('p_peche', 'port', 'c', '⛵', 'Un pêcheur de {p} propose d’emmener {n} en mer, malgré les nuages qui arrivent.', [
    Sf('Rester sur le quai', '{n} aide à démêler les filets et reçoit un petit poisson.'),
    Rk('Embarquer quand même', 0.6, 'Belle pêche ! Le pêcheur partage sa prise et ramène {n} au port en un rien de temps.', { loot: 3, time: 0.6 }, 'La houle se lève : il faut jeter une partie du chargement par-dessus bord.', W)]),
  X('p_phare', 'port', 'c', '🗼', 'Le gardien du phare de {p} a perdu ses lunettes. Sans elles, il ne peut pas allumer la lumière ce soir.', [
    Sf('Lui souhaiter bonne chance', '{n} lui laisse une lampe de poche.'),
    Rk('Fouiller les rochers au pied du phare', 0.6, '{n} retrouve les lunettes ! Du haut du phare, le gardien lui montre un endroit secret sur la côte.', { lead: 1, loot: 1 }, 'Une vague éclabousse tout : {n} rentre trempé, le sac allégé.', W)]),
  X('p_mouette', 'port', 'c', '🐦', 'Une mouette chipe le casse-croûte de {n} et s’envole vers les bateaux.', [
    Sf('Tant pis pour le casse-croûte', '{n} rachète un sandwich au port.', { loot: 0, coins: -10 }),
    Rk('La poursuivre sur les bateaux', 0.5, 'De bateau en bateau… la mouette lâche tout sur un pont où des marins partagent leur repas !', { loot: 2, luck: 0.3 }, 'Plouf ! {n} tombe à l’eau entre deux coques.', W),
    Ast('Lui lancer un coquillage brillant', ['coquillage', 'perle'], 'un coquillage', 'La mouette lâche le casse-croûte pour le coquillage… et revient avec un cadeau de la mer !', { loot: 2, luck: 0.6 })]),
  X('p_regate', 'port', 'u', '🚤', 'Une régate va partir ! Un équipage cherche un mousse de dernière minute.', [
    Sf('Encourager depuis la jetée', '{n} agite son mouchoir et ramasse des souvenirs de la course.'),
    Rk('Monter à bord', 0.5, 'Victoire ! L’équipage partage la coupe et les lots avec {n}.', { loot: 3, coins: 80, luck: 0.4 }, 'Dessalés ! Le bateau chavire et le sac de {n} prend l’eau.', WL)]),
  X('p_epave', 'port', 'l', '⚓', 'À marée très basse, l’épave d’un vieux trois-mâts apparaît devant {p}. On ne la voit que quelques heures par an.', [
    Sf('La photographier depuis la plage', '{n} prend une photo inoubliable.'),
    Rk('Explorer l’épave', 0.55, 'Dans la cale, un coffre de capitaine intact ! {n} a fait la découverte de sa vie.', { loot: 4, luck: 1.5, stones: 2 }, 'La marée remonte d’un coup : {n} fuit l’épave en abandonnant une partie de son sac.', WL)]),

  // ================= PLAGE ET ÎLES =================
  X('pl_maree', 'plage', 'c', '🌊', 'La marée monte. {n} peut traverser la grève à pied tout de suite, ou attendre la prochaine barque.', [
    Sf('Attendre la barque', '{n} patiente au soleil.'),
    Rk('Traverser à pied', 0.6, '{n} traverse juste à temps et ramasse des merveilles laissées par la mer.', { time: 0.5, loot: 3 }, 'L’eau monte trop vite : {n} s’en sort, mais une partie du sac part avec les vagues.', W)]),
  X('pl_bouteille', 'plage', 'u', '🍾', 'Une bouteille scellée roule dans l’écume, aux pieds de {n}.', [
    Sf('La rapporter telle quelle', '{n} glisse la bouteille dans son sac sans l’ouvrir.'),
    Rk('L’ouvrir tout de suite', 0.8, 'Un message ancien, et une carte ! Une piste vers un lieu proche.', { lead: 1 }, 'La bouteille éclate sur un rocher : il n’en reste rien.', { loot: 0 })]),
  X('pl_chateau', 'plage', 'c', '🏖️', 'Des enfants organisent un concours de châteaux de sable. Le gagnant remporte le seau magique !', [
    Sf('Juste regarder', '{n} aide un petit à creuser ses douves.'),
    Rk('Construire le plus beau château', 0.55, 'Quel chef-d’œuvre ! {n} gagne le seau… et tout ce qu’il contient.', { loot: 3, luck: 0.4 }, 'Une vague emporte le château… et quelques affaires de {n}.', { lose: 0.25 })]),
  X('pl_crabe', 'plage', 'c', '🦀', 'Un crabe géant garde l’entrée d’une petite grotte marine. Quelque chose brille au fond.', [
    Sf('Ne pas le déranger', '{n} salue le crabe de loin.'),
    Rk('Passer en douce', 0.5, '{n} se faufile : la grotte est pleine de coquillages et de perles !', { loot: 3, luck: 0.7 }, 'Pincé ! {n} recule en lâchant une partie de son sac.', W),
    Ast('Lui offrir des algues', ['algue', 'feuille', 'mer'], 'quelque chose à grignoter', 'Le crabe mange tranquillement et laisse {n} explorer la grotte.', { loot: 3, luck: 0.8 })]),
  X('pl_tortues', 'plage', 'l', '🐢', 'Cette nuit, des bébés tortues éclosent sur la plage de {p} et cherchent la mer. Les lumières de la ville les attirent du mauvais côté.', [
    Sf('Regarder sans les toucher', '{n} assiste à un spectacle inoubliable.'),
    Rk('Les guider vers la mer toute la nuit', 0.8, 'Toutes les tortues ont rejoint la mer ! Au matin, les gardiens de la plage remercient {n} comme un héros.', { loot: 3, luck: 1.2, stones: 2, boost: 2 }, '{n} s’endort d’épuisement avant la fin… mais le cœur content.', { time: 1.3 })], 'nuit'),

  // ================= MUSÉES ET MONUMENTS =================
  X('mo_porte', 'monu', 'c', '🏛️', 'Derrière une tapisserie, {n} remarque une petite porte entrouverte. La visite guidée continue de l’autre côté.', [
    Sf('Suivre la visite guidée', '{n} apprend plein de choses et achète une carte postale.'),
    Rk('Pousser la petite porte', 0.55, 'Un passage secret ! {n} ressort par les jardins, les bras chargés de merveilles.', { loot: 3, luck: 0.6, time: 0.7 }, 'Un gardien l’attrape : {n} doit vider une partie de son sac avant de repartir.', W)]),
  X('mo_enigme', 'monu', 'c', '🗿', 'Une inscription ancienne de {p} pose une énigme : « Plus j’ai de gardiens, moins je suis gardé. Qui suis-je ? »', [
    Sf('Laisser l’énigme aux savants', '{n} recopie l’inscription dans son carnet.'),
    Rk('Répondre « un secret »', 0.6, 'Une pierre pivote ! Derrière, une niche oubliée depuis des siècles.', { loot: 2, luck: 0.8, lead: 1 }, 'Rien ne bouge… {n} passe des heures à chercher d’autres réponses.', SLOW)]),
  X('mo_restaurateur', 'monu', 'c', '🖌️', 'Une restauratrice repeint une fresque de {p}. Elle a besoin de quelqu’un de très patient pour tenir l’échafaudage.', [
    Sf('Lui souhaiter bon courage', '{n} admire son travail un moment.'),
    Rk('Tenir l’échafaudage', 0.7, 'La fresque est finie ! La restauratrice offre à {n} un fragment ancien qu’elle a retrouvé.', { loot: 2, luck: 0.7, time: 1.15 }, 'L’échafaudage tremble et la peinture coule partout… sur le sac de {n}.', { lose: 0.25 })]),
  X('mo_nuitmusee', 'monu', 'u', '🌙', 'Le musée de {p} ferme. {n} pourrait se cacher derrière une statue et voir le musée la nuit…', [
    Sf('Sortir avec les visiteurs', '{n} sort sagement à la fermeture.'),
    Rk('Rester caché', 0.5, 'La nuit, les salles semblent vivantes ! {n} découvre une réserve secrète.', { loot: 3, luck: 1 }, 'L’alarme ! {n} passe la nuit à expliquer au gardien ce qu’il faisait là.', { time: 1.5, coins: -30 })]),
  X('mo_crypte', 'monu', 'l', '🕯️', 'Sous {p}, une crypte s’ouvre pour la première fois depuis cent ans. Les archéologues cherchent un volontaire assez petit pour passer dans le tunnel.', [
    Sf('Laisser sa place', 'Les archéologues offrent tout de même un souvenir à {n}.'),
    Rk('Se glisser dans le tunnel', 0.65, '{n} découvre une salle intacte ! Son nom figurera dans le rapport de fouilles.', { loot: 4, luck: 1.6, stones: 2 }, 'Le tunnel s’effondre à moitié : {n} sort couvert de poussière, sans son sac au complet.', WL)]),

  // ================= CHÂTEAUX =================
  X('c_douves', 'chateau', 'c', '🏰', 'Le pont-levis de {p} est relevé. Il faudrait traverser les douves… ou attendre la prochaine visite.', [
    Sf('Attendre la visite', '{n} pique-nique au bord des douves.'),
    Rk('Traverser les douves', 0.5, '{n} grimpe par une vieille poterne et visite seul les tours !', { loot: 3, luck: 0.5, time: 0.7 }, 'Les douves sont plus profondes que prévu : tout est trempé.', W)]),
  X('c_fantome', 'chateau', 'u', '👻', 'Une silhouette pâle traverse le grand couloir de {p}. Elle fait signe à {n} de la suivre.', [
    Sf('Faire semblant de n’avoir rien vu', '{n} sort du château à pas pressés.'),
    Rk('Suivre la silhouette', 0.55, 'C’était la dame du château ! Elle montre à {n} sa chambre au trésor.', { loot: 3, luck: 1, lead: 1 }, 'La silhouette disparaît dans un mur… {n} se perd dans les couloirs pendant des heures.', { time: 1.6 })], 'nuit'),
  X('c_banquet', 'chateau', 'c', '🍗', 'Un grand banquet médiéval se prépare dans la cour de {p}. Il manque un serveur.', [
    Sf('Regarder la fête', '{n} danse au son des vielles.'),
    Rk('Servir au banquet', 0.65, 'Pas un plat renversé ! Le seigneur du jour offre à {n} une part du festin.', { loot: 3 }, 'Un plateau entier finit par terre… {n} doit tout payer.', { coins: -40 })]),
  X('c_tour', 'chateau', 'u', '🗝️', 'Une clé rouillée est accrochée au-dessus de la porte du donjon de {p}. Elle est très haut.', [
    Sf('La laisser là', '{n} continue la visite.'),
    Rk('Grimper la chercher', 0.5, 'La clé ouvre une petite chambre au sommet du donjon : un coffre poussiéreux attend {n} !', { loot: 3, luck: 1 }, '{n} glisse et atterrit dans un tas de foin, en perdant une partie de son sac.', W),
    Ast('Construire une échelle', ['bois'], 'du bois', 'Avec une échelle bien solide, {n} atteint la clé sans risque et ouvre la chambre secrète.', { loot: 3, luck: 1 })]),

  // ================= FORÊT =================
  X('f_renard', 'foret', 'c', '🦊', 'Des traces fraîches de renard s’enfoncent dans les fougères, loin du sentier.', [
    Sf('Rester sur le sentier', '{n} suit le sentier balisé et cueille quelques mûres.'),
    Rk('Suivre les traces', 0.6, 'Les traces mènent à un terrier abandonné…', { loot: 1, next: { q: 'Au fond du terrier, quelque chose brille. Le passage est étroit.', o: [
      Sf('Ne pas s’y risquer', '{n} reprend la route avec ce qu’il a trouvé.', { loot: 0 }),
      Rk('S’y glisser', 0.55, 'La cachette du renard : il collectionnait les trésors !', { loot: 3, luck: 0.9 }, 'Coincé ! {n} met une heure à ressortir et y laisse quelques affaires.', W)] } }, '{n} se perd dans les fougères et tourne en rond.', SLOW)]),
  X('f_orage', 'foret', 'c', '⛈️', 'L’orage gronde au-dessus de la forêt. Une cabane de bûcheron se trouve à l’écart du chemin.', [
    Sf('Continuer sous la pluie', '{n} arrive trempé mais à l’heure.', { loot: 0 }),
    Rk('Courir jusqu’à la cabane', 0.7, 'Le bûcheron accueille {n} près du feu et lui offre ses plus belles trouvailles de la saison.', { loot: 2, luck: 0.5, time: 1.2 }, 'La cabane est fermée à clé… {n} attend sous l’auvent, et l’orage dure longtemps.', { time: 1.5 })]),
  X('f_champi', 'foret', 'c', '🍄', 'Un cercle parfait de champignons pousse dans une clairière. On dit qu’il ne faut jamais entrer dedans.', [
    Sf('Faire le tour du cercle', '{n} respecte la légende et cueille quelques champignons à côté.'),
    Rk('Entrer dans le cercle', 0.5, 'Une lumière étrange… {n} se retrouve ailleurs dans la forêt, entouré de trésors !', { loot: 3, luck: 1.2, time: 0.6 }, 'Tout tourne… {n} se réveille des heures plus tard, sans savoir où il est.', { time: 1.7 })]),
  X('f_hibou', 'foret', 'u', '🦉', 'Un hibou blessé est tombé au pied d’un chêne. Il ne peut plus voler.', [
    Sf('Le mettre à l’abri dans un buisson', '{n} lui fait un petit nid de feuilles.'),
    Rk('Le soigner et le porter jusqu’au refuge', 0.75, 'Le garde forestier remercie {n} et lui confie les secrets de la forêt.', { loot: 2, lead: 1, time: 1.2 }, 'Le hibou se débat et s’envole… en emportant quelque chose du sac !', { lose: 0.2 }),
    Ast('Lui faire une attelle', ['bois', 'laine'], 'du bois ou de la laine', 'L’attelle tient parfaitement ! Le hibou guide {n} vers son trésor caché dans le chêne creux.', { loot: 3, luck: 0.8 })]),
  X('f_lucioles', 'foret', 'u', '✨', 'Des milliers de lucioles s’allument dans le sous-bois et dessinent un chemin lumineux.', [
    Sf('Les admirer de loin', '{n} reste émerveillé un long moment.'),
    Rk('Suivre le chemin de lumière', 0.65, 'Les lucioles mènent à une clairière où poussent des plantes qu’on ne voit nulle part ailleurs !', { loot: 3, luck: 1.1 }, 'Les lucioles s’éteignent d’un coup : {n} rentre à tâtons.', SLOW)], 'nuit'),
  X('f_druide', 'foret', 'l', '🌳', 'Au cœur de la forêt, un arbre millénaire. Une vieille ermite vit dans ses racines et propose à {n} une épreuve.', [
    Sf('La saluer et repartir', 'L’ermite sourit et glisse une graine dans la patte de {n}.'),
    Rk('Accepter l’épreuve', 0.6, '{n} réussit l’épreuve ! L’ermite lui offre un présent de l’arbre ancien, et lui parle d’un autre lieu sacré.', { loot: 3, luck: 1.8, stones: 2, lead: 1 }, '{n} échoue… l’ermite le renvoie avec un sourire triste.', SLOW)]),

  // ================= MONTAGNE =================
  X('mt_col', 'montagne', 'c', '🏔️', 'Deux chemins pour passer le col : le long sentier en lacets, ou l’arête rocheuse, plus courte et plus exposée.', [
    Sf('Prendre les lacets', '{n} monte lentement mais sûrement.'),
    Rk('Passer par l’arête', 0.55, 'Quelle vue ! {n} passe le col en un temps record et déniche des cristaux dans la roche.', { time: 0.5, loot: 3, luck: 0.4 }, 'Un rocher roule : {n} s’abrite, mais une partie du sac dévale la pente.', W)]),
  X('mt_marmottes', 'montagne', 'c', '🐿️', 'Les marmottes sifflent l’alerte : un aigle tourne au-dessus de l’alpage. Un petit est resté loin du terrier.', [
    Sf('Ne pas s’en mêler', 'La nature fait sa vie. {n} reprend sa route.'),
    Rk('Ramener le petit au terrier', 0.65, 'Sauvé ! La famille marmotte offre à {n} les trésors cachés dans son terrier.', { loot: 3, luck: 0.6 }, 'L’aigle fond vers {n}, qui lâche son sac pour courir se mettre à l’abri.', W)]),
  X('mt_refuge', 'montagne', 'c', '🛖', 'Le gardien du refuge annonce de la neige pour ce soir. Il reste une place pour la nuit.', [
    Sf('Dormir au refuge', '{n} passe une nuit douillette et repart à l’aube.', { time: 1.2, loot: 1, luck: 0.3 }),
    Rk('Redescendre avant la neige', 0.6, '{n} redescend juste à temps, avec une belle avance.', { time: 0.5, loot: 1 }, 'La neige arrive plus tôt que prévu : {n} redescend péniblement, le sac allégé.', W)]),
  X('mt_crevasse', 'montagne', 'u', '🧗', 'Une crevasse coupe le glacier en deux. Un pont de neige semble tenir… peut-être.', [
    Sf('Faire le grand tour', '{n} contourne le glacier, c’est long.', { time: 1.3 }),
    Rk('Traverser le pont de neige', 0.5, 'Le pont tient ! De l’autre côté, une grotte de glace bleue pleine de cristaux.', { loot: 3, luck: 1, time: 0.6 }, 'Le pont s’effondre derrière {n} ! Il s’en sort, mais une partie du sac est tombée dans la crevasse.', WL),
    Ast('S’encorder avec de la laine tressée', ['laine'], 'de la laine', 'Bien encordé, {n} traverse sans peur et explore la grotte de glace.', { loot: 3, luck: 1, time: 0.6 })]),
  X('mt_sommet', 'montagne', 'l', '🌄', 'Le ciel est parfaitement clair : une occasion unique de monter au sommet pour le lever du soleil.', [
    Sf('Rester au chalet', '{n} regarde le lever du soleil depuis la fenêtre.'),
    Rk('Partir à 3 heures du matin', 0.6, 'Au sommet, le soleil se lève sur une mer de nuages. {n} y trouve un cristal légendaire.', { loot: 3, luck: 1.8, stones: 2, boost: 1 }, 'Le vent se lève : {n} doit renoncer à mi-pente, épuisé.', { time: 1.4 })]),

  // ================= RIVIÈRES ET LACS =================
  X('e_gue', 'eau', 'c', '🌉', 'Le pont est fermé. {n} peut faire le grand détour, ou passer à gué par la rivière.', [
    Sf('Faire le détour', '{n} longe la rivière et observe les hérons.', { time: 1.15 }),
    Rk('Passer à gué', 0.6, 'Les pierres tiennent bon : {n} gagne un temps fou et trouve des merveilles sur la berge.', { time: 0.5, loot: 2 }, 'Plouf ! {n} glisse dans l’eau et une partie du sac part avec le courant.', W)]),
  X('e_radeau', 'eau', 'c', '🛶', 'Un radeau est amarré au bord du lac de {p}. Sur l’île au milieu, on aperçoit une petite chapelle.', [
    Sf('Faire le tour du lac à pied', '{n} profite de la balade.'),
    Rk('Prendre le radeau', 0.6, 'L’île est un paradis ! {n} y trouve des trésors oubliés par les pèlerins.', { loot: 3, luck: 0.7 }, 'Le radeau prend l’eau à mi-chemin : {n} revient à la nage, le sac allégé.', W)]),
  X('e_castors', 'eau', 'c', '🦫', 'Des castors construisent un barrage, mais une grosse branche leur résiste.', [
    Sf('Les regarder travailler', '{n} observe les castors, fasciné.'),
    Rk('Les aider à tirer la branche', 0.7, 'Le barrage est fini ! Les castors montrent à {n} leur réserve secrète.', { loot: 3, luck: 0.4 }, 'La branche cède d’un coup : {n} tombe dans l’eau.', W),
    Ast('Leur apporter du bois', ['bois'], 'du bois', 'Les castors adorent ! Ils construisent en un rien de temps et offrent leurs plus belles trouvailles.', { loot: 3, luck: 0.8 })]),
  X('e_brume', 'eau', 'u', '🌫️', 'Une brume épaisse couvre le lac de {p}. Au loin, on entend une cloche, comme celle d’un village englouti.', [
    Sf('Attendre que la brume se lève', '{n} attend sur la rive en buvant un thé.', { time: 1.2 }),
    Rk('Suivre le son de la cloche', 0.5, 'La brume s’ouvre sur un ponton oublié… et un coffre au bout !', { loot: 3, luck: 1.2, lead: 1 }, 'La brume se referme : {n} tourne en rond toute la matinée.', { time: 1.6 })]),
  X('e_poissonroi', 'eau', 'l', '🐟', 'Un poisson immense, aux écailles dorées, fait des cercles sous la surface. Les pêcheurs du coin le cherchent depuis des années.', [
    Sf('Le laisser tranquille', '{n} le regarde disparaître dans les profondeurs. Quel souvenir !'),
    Rk('Tenter de l’approcher', 0.45, 'Le poisson-roi se laisse caresser… et dépose à ses pieds une écaille d’or !', { loot: 3, luck: 2, stones: 2 }, 'D’un coup de queue, il éclabousse tout et disparaît avec une partie du sac.', WL)]),

  // ================= DÉSERT =================
  X('d_dunes', 'desert', 'c', '🏜️', 'Une caravane suit la longue piste. Les dunes, elles, coupent tout droit… si l’on sait se repérer.', [
    Sf('Suivre la caravane', '{n} voyage avec les nomades et partage leur thé.'),
    Rk('Couper par les dunes', 0.55, '{n} lit les étoiles et arrive bien avant tout le monde, avec des trouvailles plein le sac.', { time: 0.5, loot: 3 }, 'Une tempête de sable ! {n} s’abrite, mais le vent emporte une partie du sac.', W)]),
  X('d_oasis', 'desert', 'c', '🌴', 'Au loin, une oasis scintille. Est-ce un mirage ?', [
    Sf('Continuer tout droit', '{n} garde le cap et économise son eau.'),
    Rk('Aller voir', 0.5, 'L’oasis est bien réelle ! Dattes, eau fraîche et un marchand qui s’y repose.', { loot: 3, luck: 0.5 }, 'Mirage… {n} a fait un long détour pour rien.', { time: 1.5 })]),
  X('d_scarabee', 'desert', 'u', '🪲', 'Un scarabée doré pousse une petite boule vers une ruine à moitié ensablée.', [
    Sf('Ne pas le suivre', '{n} continue sa route.'),
    Rk('Le suivre dans la ruine', 0.55, 'La ruine cache une salle décorée de fresques… et une niche oubliée !', { loot: 3, luck: 1, lead: 1 }, 'Le sable s’écoule sous les pattes de {n} : il ressort à grand-peine, sans tout son sac.', W)]),
  X('d_etoiles', 'desert', 'l', '🌌', 'Cette nuit, une pluie d’étoiles filantes traverse le ciel du désert. Les nomades disent qu’une étoile tombe parfois vraiment.', [
    Sf('Faire un vœu et dormir', '{n} fait un vœu… et dort à la belle étoile.'),
    Rk('Chercher l’étoile tombée', 0.5, 'Au petit matin, {n} trouve une pierre encore tiède, qui brille doucement !', { loot: 2, luck: 2, stones: 3 }, 'Rien, à part du sable à perte de vue. {n} rentre bredouille et fatigué.', { time: 1.4 })], 'nuit'),

  // ================= CAMPAGNE, PARCS ET JARDINS =================
  X('cp_vache', 'campagne', 'c', '🐄', 'Une vache s’est échappée et broute au milieu du chemin. La fermière court derrière elle, essoufflée.', [
    Sf('Laisser passer', '{n} attend que la vache s’éloigne.'),
    Rk('Aider à la rattraper', 0.65, 'Vache ramenée ! La fermière remplit le sac de {n} de bons produits de la ferme.', { loot: 3 }, 'La vache fonce dans la mare… et {n} avec.', W)]),
  X('cp_epouvantail', 'campagne', 'c', '🌾', 'Un épouvantail semble pointer du doigt un vieux puits au fond du champ.', [
    Sf('Continuer sa route', '{n} salue l’épouvantail.'),
    Rk('Descendre dans le puits', 0.5, 'Au fond du puits sec, une cachette ! Quelqu’un y avait mis ses économies il y a longtemps.', { loot: 2, coins: 90, luck: 0.6 }, 'La corde du seau casse : {n} remonte par ses propres moyens, sans tout son sac.', W)]),
  X('cp_moisson', 'campagne', 'c', '🚜', 'C’est la moisson ! Les fermiers manquent de bras avant la pluie.', [
    Sf('Leur souhaiter bon courage', '{n} les encourage de la voix.'),
    Rk('Aider à rentrer le blé', 0.7, 'Tout est rentré avant la pluie ! Le repas de moisson est inoubliable, et {n} repart chargé.', { loot: 3, boost: 1, time: 1.15 }, 'L’averse arrive trop tôt : tout le monde est trempé, {n} aussi.', { time: 1.3 })]),
  X('cp_kermesse', 'campagne', 'u', '🎪', 'Une fête de village bat son plein. Au stand de tir aux pommes, le gros lot fait rêver tout le monde.', [
    Sf('Faire un tour de manège', '{n} s’amuse comme un petit fou.', { coins: -10 }),
    Rk('Tenter le gros lot', 0.4, 'Dans le mille ! {n} repart avec le gros lot sous les applaudissements.', { loot: 3, luck: 1, coins: 50 }, 'Raté… trois fois. {n} a dépensé ses pièces pour rien.', { coins: -40 })]),
  X('cp_arcenciel', 'campagne', 'l', '🌈', 'Après l’averse, un double arc-en-ciel se pose au bout du pré, tout près.', [
    Sf('Le prendre en photo', '{n} prend la plus belle photo de sa vie.'),
    Rk('Courir jusqu’au pied de l’arc-en-ciel', 0.4, 'Incroyable : il y a vraiment quelque chose au pied de l’arc-en-ciel !', { loot: 3, luck: 2, stones: 3, coins: 100 }, 'L’arc-en-ciel recule à chaque pas… {n} finit couvert de boue, très loin du chemin.', { time: 1.5 })]),
];
const SX_BY = {}; SX.forEach(s => { SX_BY[s.id] = s; });
const SX_W = { c: 1, u: 0.35, l: 0.06 };
// on évite de revoir les mêmes situations : les 12 dernières sont écartées tant que possible
function sxPick(kind) {
  const night = sx$(() => isNight(), false), seen = (S.sxSeen = Array.isArray(S.sxSeen) ? S.sxSeen : []);
  let L = SX.filter(s => s.k === kind && (!s.when || (s.when === 'nuit' && night)));
  if (L.length < 3) L = L.concat(SX.filter(s => s.k === 'campagne' && !s.when));
  let C = L.filter(s => !seen.includes(s.id)); if (!C.length) C = L;
  const tot = C.reduce((a, s) => a + SX_W[s.tier], 0); let r = Math.random() * tot, P = C[0];
  for (const s of C) { r -= SX_W[s.tier]; if (r <= 0) { P = s; break; } }
  seen.push(P.id); if (seen.length > 12) seen.splice(0, seen.length - 12);
  return P;
}

// ---------- accroché au voyage (remplace le tirage de 84) ----------
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  sx$(() => {
    const t = S.trips[k]; if (!t || t === before) return;
    if (t.mf && t.mf.k === 'cueil' && Math.random() < 0.5) return; // la moitié du temps, la cueillette
    const kind = sxKindOf(t.dest), s = sxPick(kind);
    t.mf = { k: 'choix', v: 2, id: s.id, kind, at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
const sxS = t => t && t.mf && (t.mf.v === 2 ? SX_BY[t.mf.id] : null);
const sxName = k => sx$(() => CHARS[k].name, 'Votre compagnon');
const sxSp = k => sx$(() => CHARS[k].sp, '');
const sxRegion = t => sx$(() => regionAt(t.dest.lon, t.dest.lat).short, '');
const sxFill = (s, k, t, p) => String(s).replace(/\{n\}/g, sxName(k)).replace(/\{p\}/g, (t && t.dest && t.dest.name) || 'ce lieu').replace(/\{r\}/g, sxRegion(t)).replace(/\{lp\}/g, p || '');
const sxAff = (k, kind) => (SX_AFF[kind] || []).includes(sxSp(k));
// v161 : bonus de réussite des choix risqués (99_zfaune.js le remplace par le bonus de terrain)
let sxBonus = (k, kind) => sxAff(k, kind) ? 0.2 : 0;
let sxBonusTx = (k, kind) => sxAff(k, kind) ? `🐾 ${sxName(k)} est à l’aise ici : ${SX_SP_NM[sxSp(k)] || 'son espèce'} adorent ce genre d’endroit (+20 % de réussite).` : '';
function sxHave(need) {
  for (const n of need) {
    if (n.startsWith('coins:')) { if ((S.coins || 0) >= +n.slice(6)) return { coins: +n.slice(6) }; continue; }
    const it = (S.inv || []).find(i => i && (i.sub === n || (typeof ING !== 'undefined' && ING[n] && ING[n][0].includes(i.sub))) && !sx$(() => styleWornBy(i.id), false));
    if (it) return { it };
  }
  return null;
}

// ---------- remplacements de 84 : annonce, carte d'action, fenêtre ----------
chTick = function () {
  if (!S || !S.trips) return;
  let ch = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || !t.mf) continue;
    (t.journal || []).forEach(j => { if (j && j.pending && !j.resolved && (j.kind === 'aide' || j.kind === 'marchand')) { j.resolved = true; j.skip = 1; ch = true; } });
    if (t.mf.k !== 'choix') continue;
    if (t.done) { if (t.mf.st === 'wait' || t.mf.st === 'ready') { sxAuto(k, t); ch = true; } continue; }
    if (t.mf.st === 'wait' && t.elapsed >= t.total * t.mf.at) {
      t.mf.st = 'ready'; ch = true;
      const s = sxS(t); sx$(() => toast(`${s ? s.ico : '❓'} ${sxName(k)} doit faire un choix !`));
    }
  }
  if (ch) { sx$(save); sx$(() => renderTripCard()); }
};
function sxAuto(k, t) { if (!t.mf || t.mf.k !== 'choix' || (t.mf.st !== 'wait' && t.mf.st !== 'ready')) return; t.mf.st = 'auto'; const s = sxS(t); if (s) sx$(() => chLoot(t, 1, 0)); sx$(save); }
chAuto = t => { const k = Object.keys(S.trips).find(x => S.trips[x] === t); sxAuto(k, t); };
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = sx$(() => nextAction(), null);
  if (!a || a.kind !== 'chmf' || !sxS(a.t)) return orig.apply(this, arguments);
  const s = sxS(a.t);
  box.hidden = false; box.className = 'tripcard act act-cu' + (s.tier === 'l' ? ' sx-leg' : ''); box.dataset.kind = 'chmf'; box.dataset.k = a.k; box.dataset.sig = sx$(() => actionSig(a), '');
  box.innerHTML = `<span class="acic"><img src="${sx$(() => portraitURI(a.k, 'surpris'), '')}" alt=""></span><div class="tcx"><span class="ack">${s.tier === 'l' ? '✨ Moment légendaire' : 'Moment fort'} · ${esc(a.t.dest.name || '')}</span><b class="act-t">${s.ico} ${esc(sxName(a.k))} doit choisir</b><span class="acs">À décider avant son retour, sinon il prend le chemin sûr.</span></div><button class="btn green" data-chplay="${a.k}">Choisir</button>`;
})(renderActionCard);

function sxTags(o, k, kind) {
  const e = o.ok, T = [];
  if (o.t === 'R') { const p = Math.min(0.95, o.p + sxBonus(k, kind)); T.push(`<i class="ko">⚠️ ${Math.round((1 - p) * 100)} % de risque</i>`); }
  if (o.t === 'S') T.push('<i class="ok">Sans risque</i>');
  if (o.t === 'A') T.push(`<i class="gold">Utilise ${esc(o.nm)}</i>`, '<i class="ok">Réussite assurée</i>');
  if (e.time && e.time < 1) T.push(`<i>⏱️ Retour ${e.time <= 0.5 ? '2× ' : ''}plus tôt</i>`);
  if (e.time && e.time > 1) T.push('<i>⏱️ Plus long</i>');
  if (e.loot) T.push(`<i>🎒 +${e.loot}${e.luck >= 1 ? ' rares' : ''}</i>`);
  if (e.coins > 0) T.push(`<i>🪙 +${e.coins}</i>`);
  if (e.lead) T.push('<i class="gold">📜 Une piste</i>');
  if (e.stones) T.push(`<i class="gold">⭐ +${e.stones}</i>`);
  if (e.boost) T.push(`<i>🎁 Bonus au prochain voyage</i>`);
  if (e.next) T.push('<i>❓ Et ensuite…</i>');
  if (o.t === 'R' && o.ko) { if (o.ko.lose) T.push(`<i class="ko">Sinon : ${o.ko.lose >= 0.5 ? 'la moitié' : 'une partie'} du sac perdue</i>`); else if (o.ko.time) T.push('<i class="ko">Sinon : voyage plus long</i>'); else if (o.ko.coins) T.push(`<i class="ko">Sinon : ${o.ko.coins} pièces</i>`); }
  return T.join('');
}
function sxRender(k, t, step) {
  const s = sxS(t), kind = t.mf.kind, n = sxName(k);
  const q = step ? step.q : s.q, opts = step ? step.o : s.o;
  const aff = sxBonusTx(k, kind);
  const html = opts.map((o, i) => {
    if (o.t === 'A' && !sxHave(o.need)) return '';
    return `<button class="ch-opt ${o.t === 'R' ? 'risk' : o.t === 'A' ? 'lead' : ''}" data-sxpick="${i}"><b>${o.t === 'A' ? '💡 ' : ''}${esc(sxFill(o.lb, k, t))}</b><span class="ch-tags">${sxTags(o, k, kind)}</span></button>`;
  }).join('');
  return `<div class="ch-hero"><span class="ch-ico">${s.ico}</span><img src="${sx$(() => portraitURI(k, 'surpris'), '')}" alt="">${s.tier !== 'c' ? `<span class="sx-tier sx-${s.tier}">${s.tier === 'l' ? '✨ Légendaire' : 'Peu fréquent'}</span>` : ''}</div>
    <p class="cu-k">Moment fort · ${esc(t.dest.name || '')}${sxRegion(t) ? ' · ' + esc(sxRegion(t)) : ''}</p><p class="ch-q">${esc(sxFill(q, k, t))}</p>
    ${aff && !step ? `<p class="sx-aff">${esc(aff)}</p>` : ''}
    ${html}${step ? '' : '<button class="cu-later" data-chquit="1">Plus tard</button>'}`;
}
chOpen = function (k) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.k !== 'choix' || t.mf.st !== 'ready' || t.done) { sx$(() => toast('Ce moment est passé.')); return; }
  if (!sxS(t)) { const s = sxPick(t.mf.kind || 'campagne'); t.mf.v = 2; t.mf.id = s.id; }
  const el = document.createElement('div'); el.id = 'chG'; el.className = 'ch-ov ch-' + ({ port: 'mer', plage: 'mer', eau: 'mer', desert: 'desert', monu: 'monu', chateau: 'monu', foret: 'route', montagne: 'route', campagne: 'route' }[t.mf.kind] || 'ville'); el.dataset.k = k;
  const s0 = sxS(t), st0 = t.mf.stp != null && s0.o[t.mf.stp] && s0.o[t.mf.stp].ok.next ? s0.o[t.mf.stp].ok.next : null;
  el.innerHTML = `<div class="ch-card">${sxRender(k, t, st0)}</div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
  CHX = { k, step: st0 };
};
let CHX = null;
function sxApply(k, t, e) {
  const fx = [];
  if (e.time) { const left = t.total - t.elapsed; t.total = Math.round(t.elapsed + left * e.time); fx.push(e.time < 1 ? (e.time <= 0.5 ? '⏱️ Retour deux fois plus tôt' : '⏱️ Retour plus tôt') : '⏱️ Le voyage dure plus longtemps'); }
  if (e.loot) sx$(() => chLoot(t, e.loot, e.luck || 0), []).forEach(i => fx.push('🎒 ' + i.name));
  if (e.coins) { if (e.coins > 0) sx$(() => gainCoins(e.coins)); else S.coins = Math.max(0, (S.coins || 0) + e.coins); fx.push(e.coins > 0 ? `🪙 +${e.coins} pièces` : `🪙 ${e.coins} pièces`); sx$(renderTop); }
  if (e.stones) { sx$(() => gainStones(e.stones)); fx.push(`⭐ +${e.stones} pierre${e.stones > 1 ? 's' : ''} d’étoile`); }
  if (e.boost) { S.sxBoost = (S.sxBoost || 0) + e.boost; fx.push(`🎁 +${e.boost} trouvaille${e.boost > 1 ? 's' : ''} au prochain voyage`); }
  if (e.lose) {
    const bag = t.bag || [], nLose = bag.length ? Math.max(1, Math.ceil(bag.length * e.lose)) : 0;
    for (let i = 0; i < nLose; i++) { const j = Math.floor(Math.random() * bag.length); const it = bag.splice(j, 1)[0]; if (it) fx.push('❌ ' + it.name + ' perdu'); }
    if (!nLose) { const left = t.total - t.elapsed; t.total = Math.round(t.elapsed + left * 1.3); fx.push('⏱️ Le voyage dure plus longtemps'); }
  }
  if (e.lead) {
    const P = sx$(() => chPickLeadPlace(t), null);
    if (P) { const L = chLeads(); L.push({ id: Date.now().toString(36), place: P.name, lon: P.lon, lat: P.lat, from: t.dest.name, txt: `${sxName(k)} a trouvé une piste vers ${P.name}.`, until: Date.now() + 3 * 86400000 }); fx.push(`📜 Nouvelle piste : ${P.name} (3 jours)`); }
  }
  return fx;
}
chPick = function () {};
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-sxpick]'); if (!b || !CHX) return;
  ev.stopPropagation(); ev.preventDefault();
  const k = CHX.k, t = S.trips[k]; if (!t || !t.mf || t.mf.st !== 'ready') { sx$(() => chClose()); CHX = null; return; }
  const s = sxS(t), opts = CHX.step ? CHX.step.o : s.o, o = opts[+b.dataset.sxpick]; if (!o) return;
  let e, mood = 'content';
  if (o.t === 'S') e = o.ok;
  else if (o.t === 'A') { const h = sxHave(o.need); if (!h) return; if (h.it) { const i = S.inv.indexOf(h.it); if (i >= 0) S.inv.splice(i, 1); } if (h.coins) S.coins -= h.coins; e = o.ok; mood = 'rire'; }
  else { const p = Math.min(0.95, o.p + sxBonus(k, t.mf.kind)); if (Math.random() < p) { e = o.ok; mood = 'rire'; } else { e = o.ko; mood = 'triste'; } }
  const fx = sxApply(k, t, e);
  if (o.t === 'A') fx.unshift(`💡 ${o.nm} utilisé${/^une /.test(o.nm) ? 'e' : ''}`);
  const txt = sxFill(e.tx, k, t);
  sx$(() => t.journal.push({ t: Date.now(), kind: 'mfchoix', text: txt }));
  const card = document.querySelector('#chG .ch-card'); if (!card) return;
  if (e.next) {
    CHX.step = e.next; t.mf.stp = +b.dataset.sxpick;
    card.innerHTML = `<p class="ch-q sx-res">${esc(txt)}</p>${fx.length ? `<ul class="ch-fx">${fx.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}` + sxRender(k, t, e.next);
    sx$(save); return;
  }
  t.mf.st = 'done'; t.mf.pick = o.t; sx$(save);
  card.innerHTML = `<div class="ch-hero"><span class="ch-ico">${s.ico}</span><img src="${sx$(() => portraitURI(k, mood), '')}" alt=""></div><p class="ch-q">${esc(txt)}</p>${fx.length ? `<ul class="ch-fx">${fx.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<button class="btn green big wide" data-chquit="1">Continuer</button>`;
  CHX = null;
}, true);
// le bonus « au prochain voyage » : des trouvailles en plus au retour du voyage suivant
if (typeof collect === 'function') collect = (orig => function () {
  sx$(() => {
    if (!S.sxBoost) return;
    const t = Object.values(S.trips || {}).find(x => x && x.done && x.mf && x.mf.st !== 'wait'); if (!t) return;
    const n = Math.min(4, S.sxBoost); S.sxBoost = 0; chLoot(t, n, 0.5);
  });
  return orig.apply(this, arguments);
})(collect);
window.__sx = { n: () => SX.length, kinds: () => { const o = {}; SX.forEach(s => { o[s.k] = (o[s.k] || 0) + 1; }); return o; }, force: (k, id) => { const t = S.trips[k]; if (!t) return; const s = SX_BY[id] || SX[0]; t.mf = { k: 'choix', v: 2, id: s.id, kind: s.k, at: 0, st: 'ready' }; } };

{
  const st = document.createElement('style');
  st.textContent = `
.sx-tier{position:absolute;right:10px;top:10px;padding:2px 9px;border-radius:999px;font:800 11px var(--display,system-ui);border:2px solid #4a3528}
.sx-tier.sx-u{background:#dff0fb;color:#2f6f9a}.sx-tier.sx-l{background:linear-gradient(90deg,#ffe9a8,#ffd1e8,#d6ecff);color:#7a4f10}
.sx-aff{margin:-4px 0 10px;padding:6px 9px;border-radius:12px;background:#eef8e6;font:700 12.5px var(--body,system-ui);color:#2f7f3c}
.sx-res{padding:8px 10px;border-radius:14px;background:#f6efe2}
.tripcard.sx-leg{box-shadow:0 0 0 3px #ffe9a8,0 4px 0 rgba(74,53,40,.25)}
`;
  document.head.appendChild(st);
}

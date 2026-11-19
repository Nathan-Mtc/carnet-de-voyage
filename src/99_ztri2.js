// ================= 99 · DEUXIÈME TRI (v105, 19/11) =================
// Après l'audit, le joueur garde : la machine à souvenirs, le marché mondial, le compédium, l'arbre de talents.
// On retire ce qui ne sert pas la boucle « vos clients ↔ le monde » (rien n'est effacé des sauvegardes) :
//  1. les contrats des collectionneurs et le rival Gaspard (45) : plus de nouveaux contrats, plus de section, plus de
//     800 pièces tombées du ciel quand une épique sort ;
//  2. les collections par type de lieu (paliers « Parc atteint ! Récompense à récupérer ») : plus de paliers au retour,
//     sous-onglet Sac › Collections retiré ;
//  3. les cartes postales et le tournoi de style étaient déjà retirés de l'interface (82) ; le compteur de cartes postales
//     a quitté la fenêtre de retour (99_zretour).
const t2$ = (f, d) => { try { return f(); } catch (e) { return d; } };
// 1. contrats
if (typeof eqNewContract === 'function') eqNewContract = function () { return null; };
if (typeof eqContractsOnReturn === 'function') eqContractsOnReturn = function () {};
if (typeof eqSecHTML === 'function') eqSecHTML = function () { return ''; };
t2$(() => { const E = eqState(); if (E.con && E.con.length) { E.con = []; if (E.riv) E.riv.cid = null; save(); } });
// 2. collections par type de lieu
if (typeof checkTiers === 'function') checkTiers = function () { return []; };
t2$(() => { if (SUBTABS.sac) for (let i = SUBTABS.sac.length - 1; i >= 0; i--) if (SUBTABS.sac[i][0] === 'col') SUBTABS.sac.splice(i, 1); });
if (typeof renderPanel === 'function') renderPanel = (orig => function () { t2$(() => { if (typeof sacView !== 'undefined' && sacView === 'col') sacView = 'sac'; }); return orig.apply(this, arguments); })(renderPanel);

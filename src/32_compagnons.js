// ================= COMPAGNONS UNIQUES (v17, vague 2) =================
// Retour du joueur : « personnaliser ne sert à rien en jeu, les talents sont à développer pour avoir un familier unique,
// le Compédium n'est pas aussi abouti qu'un Pokédex ». Moins de texte, plus d'images.
// 1. TALENTS EN ARBRE : 3 branches (Explorateur, Trouvailles, Charmeur), 3 talents chacune, le dernier est la « signature ».
//    1 point par niveau gagné (+ points offerts par les rêves) : le joueur CHOISIT, deux pandas n'ont pas les mêmes talents.
//    Branché via talentsOf (05_logic_a.js) : hasEff(k, eff) lit les talents appris. Effets nouveaux : vite, eclair, cache, rare,
//    ami, renom, fan (appliqués ci-dessous) ; anciens : flair, audace, tresor, nego, zen, oiseau, hab2, chance, habLuck.
//    Anciennes sauvegardes : les talents déjà débloqués par niveau restent acquis (gratuits, « leg »).
// 2. LA TENUE SERT : chaque vêtement a un petit effet (pluie, froid, soleil, charme, route) ; 3 pièces du même thème ou de
//    la même région = bonus d'ensemble. Les options d'aventure débloquées (29_aventure.js, besoins « wear: ») sont affichées.
// 3. COMPÉDIUM façon Pokédex (enveloppe nsRenderCompedium) : grille numérotée, silhouettes, fiches, mini-carte, variantes.
// 4. Sous-onglets : Garde-robe · Talents · Rêves · Compédium · Équipe · Tournoi.
// État : S.tl = { [k]: { n: { E1: 1, … }, leg: ['T3'], bonus: 0 } }, S.tlMig = 1.

// ---------------- 1. ARBRE DE TALENTS ----------------
const CP_BR = [
  { id: 'E', name: 'Explorateur', col: '#4f9f6a', soft: '#dff1e2', x: 17 },
  { id: 'T', name: 'Trouvailles', col: '#d99a1e', soft: '#fbefcf', x: 50 },
  { id: 'C', name: 'Charmeur', col: '#e0668c', soft: '#fde3eb', x: 83 },
];
const CP_EFF = {
  vite: 'Voyages 12 % plus courts', eclair: 'Voyages 20 % plus courts', cache: 'Un lieu caché en plus à chaque voyage',
  audace: 'Choix audacieux bien plus réussis', zen: 'Ne rate jamais rien', hab2: 'Trouvailles ×2 dans son habitat',
  flair: 'Une trouvaille de plus par voyage', rare: 'Objets plus rares partout', chance: 'Arcs-en-ciel et étoiles filantes fréquents',
  tresor: 'Bouts de carte au trésor ×3', habLuck: 'Objets bien plus rares dans son habitat',
  ami: 'Apprivoiser : +12 % de chances', nego: 'Marchands moins chers, ventes mieux payées', renom: '+2 réputation par commande livrée',
  fan: 'Commandes : +20 % de pièces', oiseau: 'Pépin rapporte un objet à chaque voyage',
};
const CP_L = '#5b4636';
const CP_ICO = {
  vite: `<path d="M7 4 h6 v9 l6 3 a2 2 0 0 1 1 2 v2 H5 V4Z" fill="#fff" stroke="${CP_L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M1 9 h4 M2 13 h3" stroke="${CP_L}" stroke-width="1.6" stroke-linecap="round"/>`,
  eclair: `<path d="M13 2 L5 13 h6 l-2 9 L19 10 h-6 l2 -8Z" fill="#fff3b0" stroke="${CP_L}" stroke-width="1.6" stroke-linejoin="round"/>`,
  cache: `<path d="M3 6 l6-2 6 2 6-2 v14 l-6 2 -6-2 -6 2Z" fill="#fff" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 9 l4 4 M18 9 l-4 4" stroke="#d9604f" stroke-width="2" stroke-linecap="round"/><path d="M5 16 q4 0 7 -4" fill="none" stroke="${CP_L}" stroke-width="1.3" stroke-dasharray="1.6 1.6"/>`,
  audace: `<path d="M2 20 L9 8 L13 14 L16 10 L22 20Z" fill="#fff" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 8 V2 l5 2 -5 2" fill="#f08aa6" stroke="${CP_L}" stroke-width="1.2"/>`,
  zen: `<path d="M12 19 C7 15 8 9 12 5 C16 9 17 15 12 19Z" fill="#fff" stroke="${CP_L}" stroke-width="1.5"/><path d="M12 19 C6 19 3 15 3 12 C7 12 10 14 12 19Z M12 19 C18 19 21 15 21 12 C17 12 14 14 12 19Z" fill="#fde3eb" stroke="${CP_L}" stroke-width="1.4"/>`,
  hab2: `<path d="M12 3 C7 10 6 13 6 15 a6 6 0 0 0 12 0 C18 13 17 10 12 3Z" fill="#bfe6f2" stroke="${CP_L}" stroke-width="1.5"/><path d="M9 15 a3 3 0 0 0 3 3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  flair: `<circle cx="10" cy="10" r="6" fill="#fff" stroke="${CP_L}" stroke-width="1.8"/><path d="M14.5 14.5 L20 20" stroke="${CP_L}" stroke-width="2.6" stroke-linecap="round"/><path d="M7.5 9 a3 3 0 0 1 3 -3" fill="none" stroke="#9fd1d8" stroke-width="1.6" stroke-linecap="round"/>`,
  rare: `<path d="M5 9 L8 4 H16 L19 9 L12 20Z" fill="#c9b8ea" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 9 H19 M9 9 L12 20 L15 9 M8 4 L9 9 M16 4 L15 9" fill="none" stroke="${CP_L}" stroke-width="1"/>`,
  chance: `<path d="M3 18 a9 9 0 0 1 18 0" fill="none" stroke="#f08aa6" stroke-width="2.6"/><path d="M6 18 a6 6 0 0 1 12 0" fill="none" stroke="#f6c445" stroke-width="2.6"/><path d="M9 18 a3 3 0 0 1 6 0" fill="none" stroke="#7fc8a0" stroke-width="2.6"/>`,
  tresor: `<path d="M3 11 H21 V20 H3Z" fill="#e3a65f" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 11 C3 5 21 5 21 11Z" fill="#f2c27f" stroke="${CP_L}" stroke-width="1.5"/><rect x="10" y="10" width="4" height="5" rx="1" fill="#f6c445" stroke="${CP_L}" stroke-width="1.1"/>`,
  habLuck: `<path d="M2 18 q3 -3 6 0 t6 0 t6 0" fill="none" stroke="#4fa8c8" stroke-width="2" stroke-linecap="round"/><path d="M7 8 L9.5 4 H14.5 L17 8 L12 15Z" fill="#9fe0d0" stroke="${CP_L}" stroke-width="1.4" stroke-linejoin="round"/>`,
  ami: `<path d="M12 20 C4 14 4 9 7 7 C9.5 5.5 11.5 7 12 9 C12.5 7 14.5 5.5 17 7 C20 9 20 14 12 20Z" fill="#f6a6c1" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/>`,
  nego: `<path d="M3 12 L11 4 H20 V13 L12 21Z" fill="#fff3b0" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="16" cy="8" r="1.6" fill="${CP_L}"/>`,
  renom: `<path d="M8 2 L10.5 9 M16 2 L13.5 9" stroke="#e9789a" stroke-width="2.8"/><circle cx="12" cy="15" r="6" fill="#f6c445" stroke="${CP_L}" stroke-width="1.5"/><path d="M12 12 l1 2 2 .3 -1.5 1.4 .4 2 -1.9 -1 -1.9 1 .4 -2 -1.5 -1.4 2 -.3Z" fill="#fff"/>`,
  fan: `<path d="M12 3 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8Z" fill="#f6c445" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/>`,
  oiseau: `<path d="M4 14 C4 9 9 6 13 8 L17 5 L16 9 C19 11 19 16 15 18 C11 20 5 19 4 14Z" fill="#9fd1d8" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="14" cy="10.5" r="1" fill="${CP_L}"/><path d="M17.5 9 L21 10 L17.5 11.5" fill="#f6c445" stroke="${CP_L}" stroke-width="1"/>`,
  // thèmes de vêtements
  pluie: `<path d="M3 12 a9 9 0 0 1 18 0Z" fill="#9fd1d8" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12 V19 a2 2 0 0 1 -4 0" fill="none" stroke="${CP_L}" stroke-width="1.6" stroke-linecap="round"/><path d="M5 17 v2 M18 16 v2" stroke="#4fa8c8" stroke-width="1.6" stroke-linecap="round"/>`,
  froid: `<path d="M12 2 V22 M3.3 7 L20.7 17 M3.3 17 L20.7 7" stroke="#6fa8d8" stroke-width="2.2" stroke-linecap="round"/><path d="M9.5 3.5 L12 6 L14.5 3.5 M9.5 20.5 L12 18 L14.5 20.5" fill="none" stroke="#6fa8d8" stroke-width="1.6" stroke-linecap="round"/>`,
  soleil: `<circle cx="12" cy="12" r="5" fill="#f6c445" stroke="${CP_L}" stroke-width="1.5"/><path d="M12 2 v3 M12 19 v3 M2 12 h3 M19 12 h3 M5 5 l2 2 M17 17 l2 2 M5 19 l2 -2 M17 7 l2 -2" stroke="#e9a03a" stroke-width="1.8" stroke-linecap="round"/>`,
  charme: `<path d="M12 20 C4 14 4 9 7 7 C9.5 5.5 11.5 7 12 9 C12.5 7 14.5 5.5 17 7 C20 9 20 14 12 20Z" fill="#f6a6c1" stroke="${CP_L}" stroke-width="1.5" stroke-linejoin="round"/><path d="M19 3 l.8 1.7 1.7.8 -1.7.8 -.8 1.7 -.8 -1.7 -1.7 -.8 1.7 -.8Z" fill="#f6c445"/>`,
  route: `<path d="M7 4 h6 v9 l6 3 a2 2 0 0 1 1 2 v2 H5 V4Z" fill="#e9b07a" stroke="${CP_L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M1 9 h4 M2 13 h3" stroke="${CP_L}" stroke-width="1.6" stroke-linecap="round"/>`,
  aventure: `<circle cx="12" cy="12" r="9" fill="#fff" stroke="${CP_L}" stroke-width="1.6"/><path d="M12 5 L15 12 L12 19 L9 12Z" fill="#d9604f" stroke="${CP_L}" stroke-width="1.1" stroke-linejoin="round"/><path d="M12 12 L15 12 L12 19Z" fill="#fff"/>`,
  region: `<path d="M12 22 C6 15 5 12 5 9.5 a7 7 0 0 1 14 0 C19 12 18 15 12 22Z" fill="#f08aa6" stroke="${CP_L}" stroke-width="1.5"/><circle cx="12" cy="9.5" r="2.6" fill="#fff"/>`,
};
const cpIco = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${CP_ICO[id] || ''}</svg>`;
// les 3 talents de chaque branche ; certaines espèces remplacent une case (leurs anciens talents deviennent leurs talents uniques)
const CP_GEN = { E: [['Pas léger', 'vite'], ['Sentiers cachés', 'cache'], ['Grand voyageur', 'eclair']], T: [['Flair', 'flair'], ['Œil de lynx', 'rare'], ['Porte-bonheur', 'chance']], C: [['Main tendre', 'ami'], ['Petite star', 'renom'], ['Coqueluche', 'fan']] };
const CP_SP = {
  panda: { E3: ['Grimpeuse', 'audace'], T3: ['Chasseuse de trésors', 'tresor'] },
  capy: { C2: ['Négociateur', 'nego'], E3: ['Zen absolu', 'zen'], C3: ['Ami des oiseaux', 'oiseau'] },
  axo: { E3: ['Nageuse', 'hab2'], T2: ['Plongeuse', 'habLuck'] },
  renard: { E3: ['Pisteur des neiges', 'hab2'], T1: ['Flair polaire', 'flair'], T3: ['Plongeon dans la neige', 'habLuck'] },
  fennec: { E3: ['Grandes oreilles', 'hab2'], C2: ['Marchand des sables', 'nego'], T3: ['Trésors des dunes', 'tresor'] },
  tanuki: { C2: ['Farceur', 'nego'], T1: ['Fouineur', 'flair'], E3: ['Mille déguisements', 'eclair'] },
  paresseux: { E3: ['Ami des lianes', 'hab2'], C3: ['Zen absolu', 'zen'], T3: ['Rêveur', 'chance'] },
  lemur: { E2: ['Acrobate', 'audace'], E3: ['Cueilleur', 'hab2'], T3: ['Œil de lune', 'habLuck'] },
  phoque: { E3: ['Nageur', 'hab2'], C3: ['Zen sur la glace', 'zen'], T3: ['Plongeur', 'habLuck'] },
  quokka: { C2: ['Sourire magique', 'nego'], C3: ['Sourire contagieux', 'fan'] },
};
const CP_SIG_LVL = 5; // le talent signature s'ouvre au niveau 5
const cpSp = k => (typeof spOf === 'function' ? spOf(k) : k);
function cpTree(k) {
  const sp = cpSp(k), o = CP_SP[sp] || {}, out = [];
  for (const B of CP_BR) CP_GEN[B.id].forEach((g, i) => { const id = B.id + (i + 1), [name, eff] = o[id] || g; out.push({ id, br: B.id, tier: i + 1, name, eff, B }); });
  return out;
}
const cpOldTalentsOf = talentsOf; // l'ancienne table par espèce (TALENTS, 03_data.js)
function cpMigrate() {
  if (S.tlMig) return;
  S.tlMig = 1;
  if (!S.tl || typeof S.tl !== 'object') S.tl = {};
  // les talents déjà débloqués par niveau restent acquis, gratuitement
  for (const k of Object.keys(S.prog || {})) {
    if (!S.comps || !S.comps[k] || S.tl[k]) continue;
    const lvl = S.prog[k].lvl || 1, tree = cpTree(k), leg = [];
    for (const t of cpOldTalentsOf(k) || []) if (lvl >= t[0]) { const n = tree.find(x => x.eff === t[3] && !leg.includes(x.id)); if (n) leg.push(n.id); }
    S.tl[k] = { n: {}, leg, bonus: 0 };
  }
}
function cpState(k) {
  if (!S.tl || typeof S.tl !== 'object') S.tl = {};
  cpMigrate();
  let T = S.tl[k];
  if (!T || typeof T !== 'object') T = S.tl[k] = { n: {}, leg: [], bonus: 0 };
  if (!T.n || typeof T.n !== 'object') T.n = {};
  if (!Array.isArray(T.leg)) T.leg = [];
  if (typeof T.bonus !== 'number') T.bonus = 0;
  return T;
}
const cpHas = (k, id) => { const T = cpState(k); return !!T.n[id] || T.leg.includes(id); };
const cpPtsTotal = k => Math.max(0, ((S.prog[k] && S.prog[k].lvl) || 1) - 1) + cpState(k).bonus;
const cpPtsUsed = k => { const T = cpState(k); return Object.keys(T.n).filter(id => T.n[id] && !T.leg.includes(id)).length; };
const cpPtsFree = k => Math.max(0, cpPtsTotal(k) - cpPtsUsed(k));
function cpCan(k, node) {
  if (cpHas(k, node.id)) return 'on';
  const lvl = (S.prog[k] && S.prog[k].lvl) || 1;
  if (node.tier > 1 && !cpHas(k, node.br + (node.tier - 1))) return 'lock';
  if (node.tier === 3 && lvl < CP_SIG_LVL) return 'lock';
  return cpPtsFree(k) > 0 ? 'can' : 'wait';
}
function cpLearn(k, id) {
  const node = cpTree(k).find(x => x.id === id); if (!node || cpCan(k, node) !== 'can') return false;
  cpState(k).n[id] = 1; save(); return true;
}
const cpResetCost = k => 40 * ((S.prog[k] && S.prog[k].lvl) || 1);
function cpReset(k) {
  const c = cpResetCost(k), T = cpState(k);
  if (!Object.keys(T.n).length) return;
  if (S.coins < c) { toast(`Il faut ${c} pièces.`); return; }
  S.coins -= c; T.n = {}; save();
  try { renderTop(); } catch (e) {}
}
// les rêves offrent des points de talent (14_reves.js)
function cpAddTalentPoint(k, n = 1) { cpState(k).bonus += n; }
// talentsOf : pour un compagnon, les talents APPRIS (format [niveau, nom, description, effet]) ; hasEff s'appuie dessus
talentsOf = (orig => k => {
  try {
    if (S.comps && S.comps[k] && S.prog && S.prog[k]) return cpTree(k).filter(n => cpHas(k, n.id)).map(n => [0, n.name, CP_EFF[n.eff] || '', n.eff]);
  } catch (e) { console.error(e); }
  return orig(k);
})(talentsOf);

// ---------------- 2. LA TENUE SERT ----------------
const CP_WEAR = {
  pluie: { name: 'Pluie', looks: ['cape', 'bottes'], txt: '+1 trouvaille sous la pluie', set: '+2 trouvailles sous la pluie' },
  froid: { name: 'Grand froid', looks: ['echarpe', 'bonnet', 'moufles', 'gants', 'pull'], txt: 'Objets plus rares dans la neige et en montagne', set: 'Objets bien plus rares dans la neige et en montagne' },
  soleil: { name: 'Plage', looks: ['chapeau', 'casquette', 'short', 'tshirt', 'jupe'], txt: '+1 trouvaille à la mer, sur les îles et au désert', set: '+2 trouvailles à la mer, sur les îles et au désert' },
  charme: { name: 'Charme', looks: ['couronne', 'noeud', 'beret', 'fleurs', 'foulard'], txt: 'Apprivoiser : +6 %', set: 'Apprivoiser : +14 %' },
  route: { name: 'Baroudeur', looks: ['sac', 'chaussettes', 'sweat'], txt: 'Voyages 5 % plus courts', set: 'Voyages 10 % plus courts' },
};
const cpThemeOf = look => Object.keys(CP_WEAR).find(t => CP_WEAR[t].looks.includes(look)) || null;
// options d'aventure débloquées par un vêtement (besoins « wear:emplacement:look » des scènes de 29_aventure.js)
let _cpAvWear = null;
function cpAvWear() {
  if (_cpAvWear) return _cpAvWear;
  const m = {};
  const walk = n => { if (!n || typeof n !== 'object') return; (n.o || []).forEach(o => { (o.need || []).forEach(x => { if (/^wear:/.test(x)) { const key = x.slice(5); m[key] = (m[key] || 0) + 1; } }); walk(o.go); }); };
  try { (typeof AV_SCENES !== 'undefined' ? AV_SCENES : []).forEach(walk); } catch (e) {}
  return (_cpAvWear = m);
}
function cpWear(k) {
  const o = (S.outfits && S.outfits[k]) || {}, th = {}, regs = {}, av = cpAvWear();
  let avN = 0;
  for (const sl of (typeof ST_SLOT_IDS !== 'undefined' ? ST_SLOT_IDS : Object.keys(o))) {
    const look = o[sl]; if (!look || look === 'none' || typeof look !== 'string') continue;
    const t = cpThemeOf(look); if (t) th[t] = (th[t] || 0) + 1;
    avN += av[sl + ':' + look] || 0;
    try { const it = typeof stWorn === 'function' ? stWorn(k, sl) : null, og = it && !it.orig && typeof originOf === 'function' ? originOf(it) : null; if (og && og.region && !og.made) regs[og.region] = (regs[og.region] || 0) + 1; } catch (e) {}
  }
  const set = Object.keys(th).find(t => th[t] >= 3) || null;
  const reg = Object.keys(regs).find(r => regs[r] >= 3) || null;
  return { th, set, reg, avN };
}
const cpRegName = id => { try { return RG[id].short; } catch (e) { return id; } };
// v19 : résumé clair des bonus de la tenue actuelle (icônes + valeurs), en haut de la garde-robe
const CP_WEAR_VAL = {
  pluie: [['+1', 'trouvaille sous la pluie'], ['+2', 'trouvailles sous la pluie']],
  froid: [['Rare+', 'objets en neige et montagne'], ['Rare++', 'objets en neige et montagne']],
  soleil: [['+1', 'trouvaille mer, îles, désert'], ['+2', 'trouvailles mer, îles, désert']],
  charme: [['+6 %', 'pour apprivoiser'], ['+14 %', 'pour apprivoiser']],
  route: [['−5 %', 'de durée de voyage'], ['−10 %', 'de durée de voyage']],
};
function cpWearBar(k) {
  const W = cpWear(k), ks = Object.keys(W.th).sort((a, b) => W.th[b] - W.th[a]);
  const chips = ks.map(t => { const v = CP_WEAR_VAL[t][W.set === t ? 1 : 0]; return `<span class="cpwi ${W.set === t ? 'set' : ''}" title="${esc(W.set === t ? CP_WEAR[t].set : CP_WEAR[t].txt)}">${cpIco(t)}<b>${v[0]}</b><small>${esc(v[1])}</small></span>`; });
  if (W.reg) chips.push(`<span class="cpwi set" title="Tenue complète de la région">${cpIco('region')}<b>Rare+</b><small>objets en ${esc(cpRegName(W.reg))}</small></span>`);
  if (W.avN) chips.push(`<span class="cpwi av" title="Options d’aventure débloquées">${cpIco('aventure')}<b>+${W.avN}</b><small>choix d’aventure</small></span>`);
  return `<div class="cpwsum"><span class="cpwh">${cpIco('fan')}<b>Bonus de la tenue</b>${W.set ? '<em>Tenue complète !</em>' : ''}</span><div class="cpwb" aria-label="Ce que la tenue apporte">${chips.length ? chips.join('') : `<span class="cpwe">${cpIco('charme')}<i>Aucun bonus pour l’instant : chaque vêtement en apporte un.</i></span>`}</div></div>`;
}
// v19 : la « tenue complète » mise en valeur : 3 pièces d'un même thème, les manquantes en aperçu
function cpSetBlock(k, pick) {
  const all = Object.keys(CP_WEAR).map(t => cpSetInfo(k, t));
  const best = all.slice().sort((a, b) => (b.n - a.n) || (b.miss.filter(m => m.own).length - a.miss.filter(m => m.own).length))[0];
  const S0 = all.find(x => x.t === pick) || best, W = CP_WEAR[S0.t], need = Math.max(0, 3 - S0.n);
  const ghosts = S0.miss.slice(0, need);
  const cell = (look, sl, cls, extra) => `<button class="cpsc ${cls}" data-wslot="${sl}" aria-label="${esc(cpLookName(look))}">${itemIcon({ cat: 'v', sub: sl, look, color: cls === 'got' ? (IC[look] || '#e9c46a') : '#e9dfcf' })}${extra || ''}<small>${esc(cpLookName(look))}</small></button>`;
  let h = `<div class="cpset ${S0.done ? 'done' : ''}"><div class="cpsh">${cpIco(S0.t)}<span><b>Tenue complète ${esc(W.name)}</b><small>${S0.done ? 'Bonus doublé : ' + esc(W.set) : `Encore ${need} pièce${need > 1 ? 's' : ''} pour : ${esc(cpLc(W.set))}`}</small></span><em>${S0.n}/3</em></div>`;
  h += `<div class="cpsg">${S0.worn.slice(0, 3).map(w => cell(w.look, w.sl, 'got', '<i class="cpsok">✓</i>')).join('')}${ghosts.map(m => cell(m.look, m.sl, 'miss' + (m.own ? ' own' : ''), m.own ? '<i class="cpsown">Dans le sac</i>' : '<i class="cpsq">?</i>')).join('')}</div>`;
  h += `<div class="cpsth">${all.map(x => `<button class="cpst ${x.t === S0.t ? 'on' : ''} ${x.done ? 'done' : ''}" data-wset="${x.t}" aria-pressed="${x.t === S0.t}" title="${esc(CP_WEAR[x.t].name)}">${cpIco(x.t)}<b>${x.n}/3</b></button>`).join('')}</div></div>`;
  return h;
}
// v19 : sur les cartes de vêtements, l'effet en icône ET en mots courts
function cpItemFxHTML(it) {
  if (!it || it.cat !== 'v') return '';
  const fx = cpItemEffects(it);
  return `<span class="cpfx">${fx.length ? fx.map(f => `<span class="${f.kind}">${cpIco(f.ico)}${esc(f.txt)}</span>`).join('') : '<span class="none">Pour le style</span>'}</span>`;
}
function cpItemBadges(it) {
  if (!it || it.cat !== 'v') return '';
  const t = cpThemeOf(it.look), av = cpAvWear()[it.sub + ':' + it.look];
  if (!t && !av) return '';
  return `<span class="cpib">${t ? `<i title="${esc(CP_WEAR[t].txt)}">${cpIco(t)}</i>` : ''}${av ? `<i title="Débloque des choix d’aventure">${cpIco('aventure')}</i>` : ''}</span>`;
}

// ---------------- v19 : l'effet d'un vêtement, en icône ET en mots courts ----------------
// options d'aventure débloquées par « emplacement:look » → libellés (« traverser le ruisseau à pied »)
let _cpAvLab = null;
function cpAvLabels() {
  if (_cpAvLab) return _cpAvLab;
  const m = {};
  const walk = n => { if (!n || typeof n !== 'object') return; (n.o || []).forEach(o => { (o.need || []).forEach(x => { if (/^wear:/.test(x) && o.a) { const key = x.slice(5), a = String(o.a).replace(/\{[^}]*\}/g, '').trim(); (m[key] = m[key] || []).includes(a) || m[key].push(a); } }); walk(o.go); }); };
  try { (typeof AV_SCENES !== 'undefined' ? AV_SCENES : []).forEach(walk); } catch (e) {}
  return (_cpAvLab = m);
}
const cpLc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
// [{ ico, txt, kind }] : ce que le vêtement apporte (rien de nouveau : thèmes CP_WEAR, choix d'aventure, région)
function cpItemEffects(it) {
  const out = []; if (!it || it.cat !== 'v') return out;
  const t = cpThemeOf(it.look);
  if (t) out.push({ ico: t, txt: CP_WEAR[t].txt, kind: 'th', th: t });
  const av = cpAvLabels()[it.sub + ':' + it.look];
  if (av && av.length) out.push({ ico: 'aventure', txt: `Débloque : ${cpLc(av[0])}${av.length > 1 ? ` (+${av.length - 1})` : ''}`, kind: 'av' });
  try { const og = !it.orig && typeof originOf === 'function' ? originOf(it) : null; if (og && og.region && !og.made) out.push({ ico: 'region', txt: `Pièce de la tenue ${cpRegName(og.region)}`, kind: 'reg' }); } catch (e) {}
  return out;
}
const cpLookSlot = look => { for (const s of SLOTS) if (s[2].some(x => x[1] === look)) return s[0]; return null; };
const cpLookName = look => { for (const s of SLOTS) for (const [l, v] of s[2]) if (v === look) return l; return { chapeau: 'Chapeau', couronne: 'Couronne' }[look] || look; };
// tenue complète d'un thème : 3 pièces portées ; les pièces manquantes possibles (et celles qui sont déjà dans le sac)
function cpSetInfo(k, t) {
  const o = (S.outfits && S.outfits[k]) || {}, W = CP_WEAR[t];
  const worn = ST_SLOT_IDS.filter(sl => o[sl] && cpThemeOf(o[sl]) === t).map(sl => ({ sl, look: o[sl] }));
  const usedSl = new Set(worn.map(w => w.sl)), miss = [];
  for (const look of W.looks) {
    const sl = cpLookSlot(look); if (!sl || usedSl.has(sl) || o[sl] === look) continue;
    let own = false; try { own = typeof stOwned === 'function' && stOwned(k, sl).some(x => x.look === look); } catch (e) {}
    miss.push({ sl, look, own });
  }
  miss.sort((a, b) => b.own - a.own);
  return { t, n: Math.min(3, worn.length), worn, miss, done: worn.length >= 3 };
}

// ---------------- effets en jeu ----------------
// au départ : durée, chance, événements en plus (talents + tenue)
function cpApplyTrip(k, t) {
  if (!t || t.cpDone || !S.comps || !S.comps[k]) return;
  t.cpDone = 1;
  const dest = t.dest || {}, tags = dest.tags || [], W = cpWear(k), fx = [];
  const has = x => tags.includes(x);
  let f = 1;
  if (hasEff(k, 'vite')) f *= 0.88;
  if (hasEff(k, 'eclair')) f *= 0.8;
  if (W.th.route) f *= W.set === 'route' ? 0.9 : 0.95;
  if (f < 1 && t.out > 0) { t.out = Math.round(t.out * f); t.stay = Math.round((t.stay || 0) * f); t.total = 2 * t.out + t.stay; fx.push('route'); }
  if (hasEff(k, 'rare')) t.luck += 0.6;
  if (W.th.froid && (has('neige') || has('montagne'))) { t.luck += W.set === 'froid' ? 1 : 0.5; fx.push('froid'); }
  try { if (W.reg && typeof nsRegionOf === 'function') { const R = nsRegionOf(dest); if (R && R.id === W.reg) { t.luck += 0.8; fx.push('region'); } } } catch (e) {}
  const add = (type, at) => t.events.push({ at, type });
  if (hasEff(k, 'cache')) add('decouverte', 0.52);
  if (W.th.pluie) {
    let wx = '';
    try { wx = avWeather(t, avBiome(tags, dest.lat)); } catch (e) {}
    if (wx === 'pluie') { add('trouvaille', 0.62); if (W.set === 'pluie') add('trouvaille', 0.74); fx.push('pluie'); }
  }
  if (W.th.soleil && (has('mer') || has('ile') || has('desert'))) { add('trouvaille', 0.66); if (W.set === 'soleil') add('trouvaille', 0.78); fx.push('soleil'); }
  t.events.sort((a, b) => a.at - b.at);
  t.cpFx = fx;
}
if (typeof GAME !== 'undefined') {
  GAME.on('trip:start', ({ who, trip }) => { try { cpApplyTrip(who, trip); save(); } catch (e) { console.error('talents départ', e); } });
  // Charmeur : réputation et pièces en plus à chaque commande livrée
  GAME.on('order:done', ({ order }) => {
    try {
      const team = typeof teamIds === 'function' ? teamIds() : [];
      let rep = 0, c = 0;
      if (team.some(k => hasEff(k, 'renom'))) rep = 2;
      if (team.some(k => hasEff(k, 'fan'))) c = Math.round(((order && order.coins) || 0) * 0.2);
      if (rep && typeof bqState === 'function') bqState().rep += rep;
      if (c) gainCoins(c);
      if (rep || c) save();
    } catch (e) { console.error(e); }
  });
}
// apprivoisement : talent « ami » et tenue « charme »
let cpTameK = null;
if (typeof nsResolveTame === 'function') nsResolveTame = (orig => function (t) { const was = cpTameK; cpTameK = t && t.comp; try { return orig.apply(this, arguments); } finally { cpTameK = was; } })(nsResolveTame);
if (typeof nsTameChance === 'function') nsTameChance = (orig => function () {
  let p = orig.apply(this, arguments);
  try {
    const k = cpTameK || S.sel;
    if (k && S.comps && S.comps[k]) { let b = hasEff(k, 'ami') ? 0.12 : 0; const W = cpWear(k); if (W.th.charme) b += W.set === 'charme' ? 0.14 : 0.06; if (b) p = Math.max(0.03, Math.min(0.97, p + b)); }
  } catch (e) {}
  return p;
})(nsTameChance);

// ---------------- rendu de l'arbre ----------------
let cpSelNode = null, cpResetAsk = false;
const CP_Y = { 1: 66, 2: 44, 3: 21 };
renderTalents = function (k) {
  const ch = CHARS[k], p = S.prog[k], need = needXP(p.lvl), f = Math.min(1, p.xp / need), tree = cpTree(k), free = cpPtsFree(k);
  if (cpSelNode && !tree.some(n => n.id === cpSelNode)) cpSelNode = null;
  let h = `<div class="cpt" style="--tint:${typeof stTint === 'function' ? stTint(k) : '#fff3dc'}">`;
  h += `<div class="cpthd"><div class="cptch">${drawChar(k, S.outfits[k], free ? 'rire' : 'fier', 'tl' + k)}</div><div class="cptx"><b>${esc(ch.name)}</b><span class="cptlv">Niv. ${p.lvl}</span><div class="tlbar"><i style="width:${(f * 100).toFixed(1)}%"></i></div></div><span class="cptpts ${free ? 'on' : ''}" aria-label="${free} point${free > 1 ? 's' : ''} à placer"><b>${free}</b><small>point${free > 1 ? 's' : ''}</small></span></div>`;
  // l'arbre : le compagnon en bas, trois branches qui montent
  const line = (x1, y1, x2, y2, on, col) => `<path d="M${x1} ${y1} C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}" class="${on ? 'on' : ''}" style="--bc:${col}" vector-effect="non-scaling-stroke"/>`;
  let lines = '';
  for (const B of CP_BR) {
    lines += line(50, 90, B.x, CP_Y[1], cpHas(k, B.id + '1'), B.col);
    lines += line(B.x, CP_Y[1], B.x, CP_Y[2], cpHas(k, B.id + '2'), B.col);
    lines += line(B.x, CP_Y[2], B.x, CP_Y[3], cpHas(k, B.id + '3'), B.col);
  }
  h += `<div class="cptree"><svg class="cptl" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  h += CP_BR.map(B => `<span class="cpbr" style="left:${B.x}%;--bc:${B.col};--bs:${B.soft}">${esc(B.name)}</span>`).join('');
  h += tree.map(n => { const st = cpCan(k, n); return `<button class="cpn st-${st} t${n.tier} ${cpSelNode === n.id ? 'sel' : ''}" data-cpn="${n.id}" style="left:${n.B.x}%;top:${CP_Y[n.tier]}%;--bc:${n.B.col};--bs:${n.B.soft}" aria-label="${esc(n.name)}${st === 'on' ? ' (appris)' : ''}">${cpIco(n.eff)}${n.tier === 3 ? '<i class="cpsig">★</i>' : ''}${st === 'on' ? '<i class="cpok">✓</i>' : st === 'lock' ? '<i class="cplk"></i>' : ''}</button>`; }).join('');
  h += `<span class="cproot"><img src="${portraitURI(k, 'content')}" alt=""></span></div>`;
  // le talent choisi
  const n = tree.find(x => x.id === cpSelNode);
  if (n) {
    const st = cpCan(k, n);
    h += `<div class="cptinfo" style="--bc:${n.B.col};--bs:${n.B.soft}"><span class="cpti">${cpIco(n.eff)}</span><div><b>${esc(n.name)}${n.tier === 3 ? ' <i class="cpsigt">Signature</i>' : ''}</b><span>${esc(CP_EFF[n.eff] || '')}</span></div>${st === 'on' ? '<span class="cptag">Appris</span>' : st === 'can' ? `<button class="btn green sm" data-cplearn="${n.id}">Apprendre</button>` : `<span class="cptag off">${st === 'wait' ? 'Niveau suivant' : n.tier === 3 && p.lvl < CP_SIG_LVL ? `Niv. ${CP_SIG_LVL}` : 'Bloqué'}</span>`}</div>`;
  } else h += `<p class="cpthint">${free ? `Touchez un talent pour l’apprendre.` : `Un point par niveau, et des points en cadeau dans les rêves.`}</p>`;
  // gagner de l'expérience, en icônes
  h += `<div class="cpxp" aria-label="Gagner de l’expérience"><span><svg viewBox="0 0 30 30">${NAV_ICONS.carte}</svg><small>Voyages</small></span><span><svg viewBox="0 0 30 30">${NAV_ICONS.reves}</svg><small>Rêves : +1 niv.</small></span><span><svg viewBox="0 0 30 30">${NAV_ICONS.atelier}</svg><small>Atelier</small></span><span><svg viewBox="0 0 30 30">${NAV_ICONS.quetes}</svg><small>Quêtes</small></span></div>`;
  if (cpPtsUsed(k)) h += cpResetAsk ? `<div class="cpreset ask"><span>Rendre tous les points ?</span><button class="btn cream sm" data-cpreset="no">Non</button><button class="btn gold sm" data-cpreset="ok">${coins(cpResetCost(k))}</button></div>` : `<div class="cpreset"><button class="btn cream sm" data-cpreset="ask">↺ Réinitialiser · ${coins(cpResetCost(k))}</button></div>`;
  return h + `</div>`;
};

// ---------------- 3. COMPÉDIUM façon Pokédex ----------------
const CP_DEX = {
  panda: ['4 pommes empilées', '20 croissants', 'Grimpe aux arbres pour goûter les fruits avant tout le monde. Sa queue lui sert de couverture.'],
  capy: ['6 pommes', '200 croissants', 'Le plus zen du monde : les oiseaux s’assoient sur sa tête et il ne dit rien.'],
  axo: ['1 crayon', '3 croissants', 'Sourit tout le temps, même sous l’eau. Ses branchies frisent quand il est content.'],
  renard: ['3 bonnets de laine', '15 croissants', 'Plonge tête la première dans la neige pour attraper… des flocons.'],
  fennec: ['2 pommes (sans les oreilles)', '6 croissants', 'Ses oreilles entendent un biscuit tomber à l’autre bout du désert.'],
  tanuki: ['4 pommes', '30 croissants', 'Farceur de génie : il se déguise en feuille, en théière, en n’importe quoi.'],
  paresseux: ['5 pommes', '25 croissants', 'Fait une sieste, puis une autre. Il bouge si lentement que la mousse pousse sur lui.'],
  lemur: ['4 pommes + une queue', '12 croissants', 'Bain de soleil les bras ouverts. Sa queue rayée est plus longue que lui.'],
  phoque: ['7 pommes', '300 croissants', 'Applaudit pour tout et pour rien. Glisse sur le ventre plus vite qu’il ne nage.'],
  quokka: ['4 pommes', '18 croissants', 'L’animal le plus souriant du monde : il fait coucou à tous les passants.'],
};
const CP_TIER_GOAL = { t1: ['sp', 2], t2: ['sp', 4], t3: ['pal', 10], t4: ['sp', 6], t5: ['hyb', 1], t6: ['pal', 20], t7: ['sp', 10], t8: ['hyb', 5] };
let cpDexSel = null, cpDexPal = null;
const cpNum = i => 'n° ' + String(i).padStart(3, '0');
const cpHybPairs = () => { const out = []; SP_IDS.forEach((a, i) => SP_IDS.slice(i + 1).forEach(b => out.push([a, b].sort()))); return out; };
// petite carte du monde (projection simple), calculée une fois à partir des pays de la carte
let _cpWorld = null;
function cpWorldPath() {
  if (_cpWorld != null) return _cpWorld;
  let d = '';
  try {
    const W = 360, H = 180;
    for (const f of (typeof landFeatures !== 'undefined' && landFeatures) || []) {
      for (const poly of f.geometry.coordinates) {
        const ring = poly[0]; if (!ring || ring.length < 4) continue;
        let last = null, pts = [];
        for (const [lon, lat] of ring) { if (lat < -58) continue; const x = (lon + 180) / 360 * W, y = (90 - lat) / 180 * H; if (!last || Math.abs(x - last[0]) + Math.abs(y - last[1]) > 2.2) { pts.push([x, y]); last = [x, y]; } }
        if (pts.length < 3) continue;
        d += 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
      }
    }
  } catch (e) { d = ''; }
  return (_cpWorld = d);
}
function cpMiniMap(sp) {
  const reg = (typeof NS_SP !== 'undefined' && NS_SP[sp] && NS_SP[sp].reg) || {};
  const dots = Object.entries(reg).map(([id, w]) => { const R = typeof RG !== 'undefined' && RG[id]; if (!R || !R.anchor) return ''; const x = (R.anchor[0] + 180), y = (90 - R.anchor[1]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2.5 + w * 1.6).toFixed(1)}" class="cpdot"><title>${esc(R.name)}</title></circle>`; }).join('');
  return `<svg class="cpmap" viewBox="0 8 360 150" aria-label="Où la trouver"><rect x="0" y="0" width="360" height="180" fill="#bfe1f2"/><path d="${cpWorldPath()}" fill="#d9ecc0" stroke="#9cbf86" stroke-width=".6"/>${dots}</svg>`;
}
function cpPalGenes(sp, pal) { try { const P = SPECIES[sp].palettes.find(x => x.id === pal); if (P) return { ...SPECIES[sp].defGenes, pal: P.id, base: P.base, accent: P.accent, belly: P.belly }; } catch (e) {} return null; }
function cpDexFiche(sp, N) {
  const i = SP_IDS.indexOf(sp), own = N.own[sp], seen = own || N.seen[sp], hab = typeof nsHabOf === 'function' ? nsHabOf(sp) : null, H = hab && typeof NS_HAB !== 'undefined' ? NS_HAB[hab] : null;
  const pals = (typeof SPECIES !== 'undefined' && SPECIES[sp] ? SPECIES[sp].palettes : []), D = CP_DEX[sp] || ['?', '?', ''];
  const pal = cpDexPal && N.pals[sp + ':' + cpDexPal] ? cpDexPal : null;
  let art;
  if (seen) { try { art = drawChar(nsLook(sp, pal ? cpPalGenes(sp, pal) : null, null), NO_OUTFIT, own ? 'rire' : 'curieux', 'cpdx'); } catch (e) { art = `<img src="${nsPortrait(sp, null, null, 'content')}" alt="">`; } }
  else art = `<img class="sil" src="${nsPortrait(sp, null, null, 'content')}" alt="">`;
  let h = `<article class="cpf ${seen ? '' : 'unk'}" id="cpFiche" style="--tint:${typeof spTint === 'function' ? spTint(sp) : '#fff3dc'}"><button class="cpfx" data-cpdex="" aria-label="Fermer">×</button>`;
  h += `<div class="cpfart"><span class="cpfn">${cpNum(i + 1)}</span><div class="cpfa">${art}</div></div>`;
  h += `<div class="cpfb"><h3>${seen ? esc(spName(sp)) : '? ? ?'}</h3>`;
  h += `<div class="cpfst">${H ? `<span class="cpft">${typeof nsHabIco === 'function' ? nsHabIco(hab) : ''}${esc(H.name)}</span>` : ''}<span class="cpfm"><small>Taille</small>${seen ? esc(D[0]) : '?'}</span><span class="cpfm"><small>Poids</small>${seen ? esc(D[1]) : '?'}</span></div>`;
  if (seen) h += `<p class="cpfd">${esc(D[2])}</p>`;
  h += `</div><div class="cpfmap"><small>Où la trouver</small>${cpMiniMap(sp)}</div>`;
  h += `<div class="cpfpal"><small>Couleurs ${pals.filter(P => N.pals[sp + ':' + P.id]).length}/${pals.length}</small><div>${pals.map(P => { const got = N.pals[sp + ':' + P.id]; return got ? `<button class="cppc ${pal === P.id ? 'on' : ''}" data-cppal="${P.id}" style="--a:${P.base};--b:${P.accent};--c:${P.belly}" title="${esc(P.name)}" aria-label="${esc(P.name)}"></button>` : `<span class="cppc no" style="--rc:${RARC[P.r || 0]}">?</span>`; }).join('')}</div></div>`;
  const hy = Object.values(N.hyb).filter(x => x.a === sp || x.b === sp);
  if (hy.length) h += `<div class="cpfhy"><small>Hybrides</small><div>${hy.map(x => `<img src="${nsPortrait(x.a, x.genes, { a: x.a, b: x.b, t: x.t })}" alt="" title="${esc(spName(x.a))} × ${esc(spName(x.b))}">`).join('')}</div></div>`;
  return h + `</article>`;
}
function cpRenderDex(box) {
  const N = nsState(), nsp = nsSpCount(), npal = nsPalCount(), tot = SP_IDS.reduce((a, sp) => a + nsPalTotal(sp), 0), nhy = nsHybCount(), pairs = cpHybPairs();
  const pct = Math.floor(100 * (nsp + npal + nhy) / Math.max(1, SP_IDS.length + tot + pairs.length));
  let h = `<div class="cpdx">`;
  h += `<div class="cphero"><div class="cpring" style="--p:${pct}"><b>${pct}<small>%</small></b></div><div class="cpstats"><span>${cpIco('fan')}<b>${nsp}</b>/${SP_IDS.length}<small>espèces</small></span><span><i class="cpsw"></i><b>${npal}</b>/${tot}<small>couleurs</small></span><span>${cpIco('ami')}<b>${nhy}</b>/${pairs.length}<small>hybrides</small></span></div></div>`;
  // paliers : visibles, avec leur cadeau
  const ready = nsTierReady(), cur = { sp: nsp, pal: npal, hyb: nhy };
  h += `<div class="cptr" aria-label="Récompenses">${NS_TIERS.map(t => {
    const got = N.tiers[t.id], ok = !got && t.ok(), g = CP_TIER_GOAL[t.id], v = g ? Math.min(cur[g[0]], g[1]) : 0;
    const ico = /œuf/.test(t.rw) ? DREAM_GIFT_SVG.egg : /trophée/.test(t.rw) ? `<svg viewBox="0 0 30 30">${NAV_ICONS.concours}</svg>` : COIN;
    return `<div class="cpti2 ${got ? 'got' : ok ? 'ok' : ''}" title="${esc(t.txt)} : ${esc(t.rw)}"><span class="cptic">${ico}${got ? '<i class="cpok">✓</i>' : ''}</span><small>${g ? `${g[1]} ${g[0] === 'sp' ? 'esp.' : g[0] === 'pal' ? 'coul.' : 'hyb.'}` : esc(t.txt)}</small>${ok ? `<button class="btn gold sm" data-ns-tier="${t.id}">Prendre</button>` : got ? '' : g ? `<span class="cptb"><i style="width:${(100 * v / g[1]).toFixed(0)}%"></i></span>` : ''}</div>`;
  }).join('')}</div>${ready.length ? '' : ''}`;
  // fiche ouverte
  if (cpDexSel && SP_IDS.includes(cpDexSel)) h += cpDexFiche(cpDexSel, N);
  // grille numérotée
  h += `<div class="cpgrid">${SP_IDS.map((sp, i) => { const own = N.own[sp], seen = own || N.seen[sp]; return `<button class="cpg ${own ? 'own' : seen ? 'seen' : 'unk'} ${cpDexSel === sp ? 'on' : ''}" data-cpdex="${sp}" style="--tint:${typeof spTint === 'function' ? spTint(sp) : '#fff3dc'}" aria-label="${cpNum(i + 1)} ${seen ? esc(spName(sp)) : 'inconnu'}"><span class="cpgn">${String(i + 1).padStart(3, '0')}</span><img src="${nsPortrait(sp, null, null, 'content')}" alt="">${own ? `<i class="cpgo">${cpIco('fan')}</i>` : ''}<b>${seen ? esc(spName(sp)) : '???'}</b><span class="cpgp">${[...Array(nsPalTotal(sp))].map((_, j) => `<i class="${j < nsPalCount(sp) ? 'on' : ''}"></i>`).join('')}</span></button>`; }).join('')}</div>`;
  // hybrides
  h += `<h3 class="cph">Hybrides <small>${nhy}/${pairs.length}</small></h3><div class="cphyg">${pairs.map(([a, b], i) => { const x = N.hyb[a + '+' + b]; let src = ''; try { src = x ? nsPortrait(x.a, x.genes, { a: x.a, b: x.b, t: x.t }) : ''; } catch (e) {} return `<span class="cphg ${x ? 'own' : ''}" title="${x ? esc(spName(a)) + ' × ' + esc(spName(b)) : '?'}"><small>${String(SP_IDS.length + i + 1).padStart(3, '0')}</small>${x ? `<img src="${src}" alt="">` : '<i>?</i>'}</span>`; }).join('')}</div>`;
  box.innerHTML = h + `</div>`;
}
if (typeof nsRenderCompedium === 'function') nsRenderCompedium = (orig => function (box) {
  try { return cpRenderDex(box); } catch (e) { console.error('compédium', e); return orig.apply(this, arguments); }
})(nsRenderCompedium);

// ---------------- 4. sous-onglets ----------------
(function cpTabs() {
  try {
    const A = SUBTABS.compagnons, order = ['garde', 'talents', 'reves', 'compedium', 'refuge', 'tournoi'];
    A.sort((a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99));
    const L = { garde: 'Habits', talents: 'Talents', reves: 'Rêves', compedium: 'Compédium', refuge: 'Équipe' };
    A.forEach(x => { if (L[x[0]]) x[1] = L[x[0]]; });
  } catch (e) {}
})();

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-cpn],[data-cplearn],[data-cpreset],[data-cpdex],[data-cppal]'); if (!el) return;
  const d = el.dataset, k = S.sel;
  if (d.cpn != null) { cpSelNode = cpSelNode === d.cpn ? null : d.cpn; cpResetAsk = false; renderPanel(); return; }
  if (d.cplearn) {
    if (cpLearn(k, d.cplearn)) {
      renderPanel();
      const b = document.querySelector(`[data-cpn="${d.cplearn}"]`); if (b) b.classList.add('pop');
      try { if (typeof sfx === 'function') sfx('pop'); } catch (e) {}
    }
    return;
  }
  if (d.cpreset) { if (d.cpreset === 'ask') cpResetAsk = true; else { if (d.cpreset === 'ok') cpReset(k); cpResetAsk = false; } renderPanel(); return; }
  if (d.cpdex != null) { cpDexSel = d.cpdex && cpDexSel !== d.cpdex ? d.cpdex : null; cpDexPal = null; renderPanel(); if (cpDexSel) setTimeout(() => { const f = $('cpFiche'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30); return; }
  if (d.cppal) { cpDexPal = cpDexPal === d.cppal ? null : d.cppal; renderPanel(); }
});

// ---------------- styles ----------------
(function cpCSS() {
  const st = document.createElement('style'); st.id = 'cpCSS';
  st.textContent = `
.cpt{display:flex;flex-direction:column;gap:8px}
.cpthd{display:flex;align-items:center;gap:10px;background:linear-gradient(180deg,var(--tint),#fff);border:2.5px solid var(--ink);border-radius:18px;padding:6px 10px}
.cptch{width:62px;height:66px;flex:none}.cptch svg{width:100%;height:100%}
.cptx{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}.cptx b{font:800 18px var(--display)}.cptlv{font:700 12.5px var(--display);color:var(--ink2)}
.cptpts{flex:none;width:58px;height:58px;border-radius:50%;border:2.5px solid var(--ink);background:#eee6d6;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.cptpts b{font:800 24px var(--display)}.cptpts small{font:700 10px var(--display);color:var(--ink2)}
.cptpts.on{background:radial-gradient(circle,#fff6c8,#f6c445);animation:cppulse 1.2s ease-in-out infinite alternate}
.cptree{position:relative;width:100%;max-width:420px;margin:0 auto;aspect-ratio:1/0.92;background:radial-gradient(ellipse at 50% 100%,#e8f4d8 0 30%,transparent 70%),#fffaf0;border:2.5px solid var(--ink);border-radius:22px;overflow:hidden}
.cptl{position:absolute;inset:0;width:100%;height:100%}
.cptl path{fill:none;stroke:#d8ccb8;stroke-width:4;stroke-dasharray:3 6;stroke-linecap:round}
.cptl path.on{stroke:var(--bc);stroke-dasharray:none;stroke-width:6}
.cpbr{position:absolute;top:1.5%;transform:translateX(-50%);font:800 10.5px var(--display);text-transform:uppercase;letter-spacing:.03em;color:var(--bc);background:var(--bs);border:1.6px solid var(--bc);border-radius:999px;padding:1px 7px;white-space:nowrap}
.cpn{position:absolute;width:15%;aspect-ratio:1;max-width:58px;transform:translate(-50%,-50%);border-radius:50%;border:3px solid var(--bc);background:#fff;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 3px 0 rgba(74,53,40,.25);transition:transform .15s}
.cpn svg{width:64%;height:64%}
.cpn.t3{width:18%;max-width:68px;border-width:3.5px;box-shadow:0 0 0 4px var(--bs),0 3px 0 rgba(74,53,40,.25)}
.cpn.st-on{background:var(--bc)}.cpn.st-on svg{filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))}
.cpn.st-can{animation:cpcan 1.1s ease-in-out infinite alternate}
.cpn.st-lock,.cpn.st-wait{background:#f1ebe0;border-color:#cbbfae}.cpn.st-lock svg{opacity:.35;filter:grayscale(1)}.cpn.st-wait svg{opacity:.7}
.cpn.sel{transform:translate(-50%,-50%) scale(1.14);outline:3px solid var(--ink);outline-offset:2px}
.cpn.pop{animation:cppop .5s cubic-bezier(.3,1.7,.5,1)}
.cpn i{position:absolute;font-style:normal}
.cpsig{top:-9px;right:-7px;font-size:15px;color:#f6c445;text-shadow:0 0 2px #5b4636,0 0 2px #5b4636}
.cpok{right:-5px;bottom:-4px;width:18px;height:18px;border-radius:50%;background:#5fbf7f;border:2px solid var(--ink);color:#fff;font:800 11px/14px var(--display);text-align:center}
.cplk{right:-4px;bottom:-4px;width:16px;height:16px;border-radius:5px;background:#cbbfae no-repeat center/11px url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='5' y='10' width='14' height='11' rx='2.5' fill='%23fff'/%3E%3Cpath d='M8 10 V7.5 a4 4 0 0 1 8 0 V10' fill='none' stroke='%23fff' stroke-width='2.4'/%3E%3C/svg%3E");border:1.6px solid var(--ink)}
.cproot{position:absolute;left:50%;top:90%;width:16%;max-width:62px;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;border:3px solid var(--ink);background:var(--tint);overflow:hidden}
.cproot img,.cproot .livep,.cproot svg{width:100%;height:100%;display:block}
.cptinfo{display:flex;align-items:center;gap:10px;background:var(--bs);border:2.5px solid var(--bc);border-radius:16px;padding:7px 10px}
.cpti{width:42px;height:42px;flex:none;border-radius:50%;background:#fff;border:2.5px solid var(--bc);display:flex;align-items:center;justify-content:center}.cpti svg{width:28px;height:28px}
.cptinfo div{flex:1;min-width:0;display:flex;flex-direction:column}.cptinfo b{font:800 15.5px var(--display)}.cptinfo span{font-size:13px;color:var(--ink2)}
.cpsigt{font:800 10px var(--display);font-style:normal;color:#fff;background:#d99a1e;border-radius:999px;padding:1px 6px;vertical-align:2px}
.cptag{flex:none;font:700 12px var(--display);color:#fff;background:var(--bc);border-radius:999px;padding:3px 9px}.cptag.off{background:#b5a894}
.cpthint{margin:0;text-align:center;font:700 13px var(--display);color:var(--ink2)}
.cpxp{display:flex;justify-content:space-around;gap:4px}
.cpxp span{display:flex;flex-direction:column;align-items:center;gap:1px}.cpxp svg{width:28px;height:28px;color:var(--ink)}.cpxp small{font:700 10.5px var(--display);color:var(--ink2)}
.cpreset{display:flex;justify-content:center;align-items:center;gap:6px}.cpreset.ask span{font:700 13px var(--display)}
@keyframes cpcan{to{box-shadow:0 0 0 6px rgba(246,196,69,.55),0 3px 0 rgba(74,53,40,.25)}}
@keyframes cppulse{to{transform:scale(1.07)}}
@keyframes cppop{0%{transform:translate(-50%,-50%) scale(.6)}100%{transform:translate(-50%,-50%) scale(1)}}
/* tenue */
.cpwsum{display:flex;flex-direction:column;gap:2px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:7px 9px 4px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.cpwh{display:flex;align-items:center;gap:6px}.cpwh svg{width:20px;height:20px}.cpwh b{font:800 15px var(--display)}
.cpwh em{margin-left:auto;font:800 11.5px var(--display);font-style:normal;color:#8a5a00;background:linear-gradient(180deg,#fff3b0,#f6c445);border:2px solid #d99a1e;border-radius:999px;padding:0 8px;animation:cpglow 1.6s ease-in-out infinite alternate}
@keyframes cpglow{to{box-shadow:0 0 10px #f6c445}}
.cpset{display:flex;flex-direction:column;gap:8px;background:linear-gradient(180deg,#fff7e6,#fff);border:2.5px solid var(--ink);border-radius:18px;padding:9px 10px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.cpset.done{background:linear-gradient(180deg,#fff3b0,#fff 70%);border-color:#d99a1e;box-shadow:0 0 0 3px #f6e08a,0 3px 0 rgba(74,53,40,.25)}
.cpsh{display:flex;align-items:center;gap:8px}.cpsh>svg{width:30px;height:30px;flex:none}
.cpsh span{flex:1;min-width:0;display:flex;flex-direction:column}.cpsh b{font:800 15.5px/1.15 var(--display)}.cpsh small{font:600 12px/1.2 var(--body);color:var(--ink2)}
.cpsh em{flex:none;font:800 16px var(--display);font-style:normal;background:#fff;border:2.5px solid var(--ink);border-radius:12px;padding:1px 8px}
.cpsg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.cpsc{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px 5px;border-radius:14px;background:#fff;border:2.5px solid var(--greenD,#3a8f5a);cursor:pointer;color:var(--ink)}
.cpsc>svg{width:44px;height:44px}
.cpsc small{font:700 11.5px/1.1 var(--display);text-align:center}
.cpsc.miss{border:2.5px dashed #c9b9a6;background:#fbf7f0}.cpsc.miss>svg{opacity:.45;filter:grayscale(1)}
.cpsc.miss.own{border-color:var(--teal,#3f9c95);background:#eaf7f5}.cpsc.miss.own>svg{opacity:.8;filter:none}
.cpsok,.cpsq{position:absolute;top:-7px;right:-5px;width:20px;height:20px;border-radius:50%;font:800 12px/16px var(--display);font-style:normal;text-align:center;border:2px solid #fff}
.cpsok{background:#5fbf7f;color:#fff}.cpsq{background:#c9b9a6;color:#fff}
.cpsown{position:absolute;top:-8px;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--teal,#3f9c95);color:#fff;border-radius:999px;padding:0 6px;font:800 10px/16px var(--display);font-style:normal;border:2px solid #fff}
.cpsth{display:flex;gap:5px;justify-content:center;flex-wrap:wrap}
.cpst{display:flex;align-items:center;gap:3px;background:#fff;border:2px solid var(--line);border-radius:999px;padding:1px 8px 1px 3px;cursor:pointer;color:var(--ink)}
.cpst svg{width:20px;height:20px}.cpst b{font:800 11.5px var(--display)}
.cpst.on{border-color:var(--ink);box-shadow:0 2px 0 var(--ink)}.cpst.done{background:#fff3b0}
.cpfx{display:flex;flex-direction:column;gap:3px;width:100%;margin-top:3px}
.cpfx span{display:flex;align-items:center;gap:4px;font:700 11.5px/1.15 var(--display);text-align:left;color:#2f7f6c;background:#e6f6e9;border-radius:8px;padding:2px 5px}
.cpfx span.av{color:#a4473a;background:#fde9e4}.cpfx span.reg{color:#7a4d8f;background:#f1e8f7}
.cpfx span.none{color:var(--muted);background:#f4efe6;font-weight:600}
.cpfx svg{width:16px;height:16px;flex:none}
@media (prefers-reduced-motion:reduce){.cpwh em{animation:none}}
.cpwb{display:flex;gap:6px;overflow-x:auto;padding:6px 2px 4px;scrollbar-width:none;align-items:stretch}
.cpwi{flex:none;display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;align-items:center;column-gap:4px;max-width:150px;background:#fff;border:2px solid var(--ink);border-radius:12px;padding:3px 8px 3px 4px}
.cpwi svg{grid-row:1/3;width:26px;height:26px}.cpwi b{font:800 13px var(--display)}.cpwi small{font:600 10.5px/1.15 var(--body);color:var(--ink2);grid-column:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cpwi.set{background:linear-gradient(180deg,#fff6c8,#fff);border-color:#d99a1e;box-shadow:0 0 0 2px #f6e08a}
.cpwi.av{background:#fde9e4}
.cpwnext,.cpwe{flex:none;display:flex;align-items:center;gap:4px;font:700 11.5px var(--display);color:var(--ink2);border:2px dashed var(--line);border-radius:12px;padding:3px 8px}.cpwnext svg,.cpwe svg{width:18px;height:18px}.cpwe i{font-style:normal}
.cpib{position:absolute;top:4px;left:4px;display:flex;gap:2px}
.cpib i{width:20px;height:20px;border-radius:50%;background:#fff;border:1.6px solid var(--ink);display:flex;align-items:center;justify-content:center}.cpib svg{width:15px;height:15px}
.wrv{position:relative}
/* compédium */
.cpdx{display:flex;flex-direction:column;gap:10px}
.cphero{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#e9473f,#c9302c);border:2.5px solid var(--ink);border-radius:20px;padding:10px 12px;color:#fff}
.cpring{--p:0;flex:none;width:76px;height:76px;border-radius:50%;background:conic-gradient(#f6c445 calc(var(--p)*1%),rgba(255,255,255,.25) 0);display:flex;align-items:center;justify-content:center;border:2.5px solid var(--ink)}
.cpring b{width:58px;height:58px;border-radius:50%;background:#fff;color:var(--ink);display:flex;align-items:center;justify-content:center;font:800 22px var(--display)}.cpring small{font-size:12px}
.cphero .cpstats{flex:1;display:flex;flex-direction:column;gap:3px;margin:0}
.cphero .cpstats span{flex:none;display:flex;flex-direction:row;align-items:center;gap:5px;background:none;border:none;border-radius:0;padding:0;color:#fff;font:700 13px var(--display)}.cphero .cpstats b{font:800 17px var(--display);color:#fff}.cphero .cpstats small{font-size:12px}.cphero .cpstats small{opacity:.9;font-weight:600}
.cphero .cpstats svg{width:18px;height:18px}
.cpsw{width:16px;height:16px;border-radius:50%;background:conic-gradient(#f08aa6 0 25%,#f6c445 0 50%,#7fc8a0 0 75%,#9fd1d8 0);border:1.6px solid var(--ink)}
.cptr{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
.cpti2{flex:none;width:76px;display:flex;flex-direction:column;align-items:center;gap:3px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 4px}
.cpti2.ok{border-color:#d99a1e;background:#fff8dc;animation:cpcan 1.1s ease-in-out infinite alternate}.cpti2.got{opacity:.6}
.cptic{position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center}.cptic svg{width:32px;height:32px;color:var(--ink)}.cptic .coin{width:30px;height:30px}
.cpti2 small{font:700 10.5px var(--display);color:var(--ink2);text-align:center}
.cptb{width:90%;height:6px;border-radius:999px;background:#efe4cf;overflow:hidden}.cptb i{display:block;height:100%;background:#5fbf7f}
.cpgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:7px}
.cpg{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;background:linear-gradient(180deg,var(--tint),#fff);border:2.5px solid var(--ink);border-radius:16px;padding:14px 4px 6px;cursor:pointer}
.cpg img{width:62px;height:66px;object-fit:contain}
.cpg.unk{background:#e9e4dc}.cpg.unk img{filter:brightness(0);opacity:.55}
.cpg.seen img{filter:saturate(.65)}
.cpg.on{outline:3px solid #e9473f;outline-offset:1px}
.cpg b{font:800 12.5px var(--display)}
.cpgn{position:absolute;left:6px;top:3px;font:800 10.5px var(--display);color:var(--ink2)}
.cpgo{position:absolute;right:4px;top:3px}.cpgo svg{width:16px;height:16px}
.cpgp{display:flex;gap:2px;flex-wrap:wrap;justify-content:center}.cpgp i{width:6px;height:6px;border-radius:50%;background:#d8ccb8}.cpgp i.on{background:#e9473f}
.cpf{position:relative;display:grid;grid-template-columns:130px 1fr;gap:8px 10px;background:linear-gradient(180deg,var(--tint),#fff 60%);border:2.5px solid var(--ink);border-radius:20px;padding:10px;animation:dgpop .35s ease both}
.cpfx{position:absolute;right:6px;top:4px;width:30px;height:30px;border:none;background:none;font:800 22px var(--display);color:var(--ink2);cursor:pointer}
.cpfart{position:relative;grid-row:span 1}
.cpfn{font:800 12px var(--display);color:#c9302c}
.cpfa{width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,#fff 0 55%,rgba(255,255,255,0) 72%);display:flex;align-items:center;justify-content:center}
.cpfa svg,.cpfa img{width:116px;height:auto;animation:cpbob 2.6s ease-in-out infinite}.cpfa img.sil{filter:brightness(0);opacity:.55;animation:none}
.cpfb{min-width:0;display:flex;flex-direction:column;gap:5px;padding-top:6px}
.cpfb h3{margin:0;font:800 20px var(--display)}
.cpfst{display:flex;flex-wrap:wrap;gap:4px}
.cpft,.cpfm{display:inline-flex;align-items:center;gap:3px;background:#fff;border:1.6px solid var(--ink);border-radius:999px;padding:1px 7px;font:700 11.5px var(--display)}
.cpft svg{width:16px;height:16px}.cpfm small{color:var(--ink2);font-weight:600;margin-right:2px}
.cpfd{margin:0;font-size:13px;line-height:1.3;color:var(--ink2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cpfmap,.cpfpal,.cpfhy{grid-column:1/-1}
.cpfmap small,.cpfpal small,.cpfhy small{display:block;font:800 10.5px var(--display);text-transform:uppercase;letter-spacing:.05em;color:var(--rust);margin-bottom:3px}
.cpmap{width:100%;height:auto;display:block;border:2px solid var(--ink);border-radius:12px}
.cpdot{fill:#e9473f;fill-opacity:.75;stroke:#fff;stroke-width:1.4;animation:cpping 1.8s ease-in-out infinite}
.cpfpal div,.cpfhy div{display:flex;flex-wrap:wrap;gap:6px}
.cppc{width:32px;height:32px;border-radius:50%;border:2.5px solid var(--ink);background:conic-gradient(var(--a) 0 50%,var(--b) 0 75%,var(--c) 0);padding:0;cursor:pointer}
.cppc.on{outline:3px solid #e9473f;outline-offset:1px}
.cppc.no{display:inline-flex;align-items:center;justify-content:center;background:#efe9df;border:2.5px dashed var(--rc);font:800 13px var(--display);color:#b5a894}
.cpfhy img{width:44px;height:48px;object-fit:contain;background:#fff;border:2px solid var(--ink);border-radius:12px}
.cpf.unk .cpfb h3{color:#9a8f80}
.cphyg{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:4px}
.cphg{position:relative;aspect-ratio:1;border-radius:10px;background:#e9e4dc;border:1.6px solid #cbbfae;display:flex;align-items:center;justify-content:center}
.cphg small{position:absolute;left:3px;top:1px;font:700 8.5px var(--display);color:#9a8f80}
.cphg i{font:800 14px var(--display);font-style:normal;color:#b5a894}
.cphg.own{background:#fff;border:2px solid var(--ink)}.cphg img{width:88%;height:88%;object-fit:contain}
@keyframes cpbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes cpping{0%,100%{fill-opacity:.55}50%{fill-opacity:1}}
@media (max-width:420px){.subtabs:has(button:nth-child(6)) button span{font-size:9.6px;letter-spacing:-.4px}.subtabs:has(button:nth-child(6)) button svg{width:20px;height:20px}.cpf{grid-template-columns:110px 1fr}.cpfa{width:110px;height:110px}.cpfa svg,.cpfa img{width:100px}}
@media (prefers-reduced-motion:reduce){.cpn.st-can,.cptpts.on,.cpfa svg,.cpdot,.cpti2.ok{animation:none}}
`;
  document.head.appendChild(st);
})();
try { cpMigrate(); } catch (e) { console.error(e); }
window.__comp = { tree: cpTree, learn: cpLearn, free: cpPtsFree, wear: cpWear, state: cpState, apply: cpApplyTrip };

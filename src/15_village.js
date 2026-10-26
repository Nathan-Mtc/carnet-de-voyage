// ================= LE VILLAGE DES COMPAGNONS =================
// Le village grandit grâce aux rêves (qui débloquent les bâtiments, via dreamUnlocks()) et aux matériaux rapportés de voyage
// (qui servent à les construire). Chaque bâtiment construit donne un bonus à chaque retour de voyage.
// Expose : VILLAGE_BUILDINGS, renderVillage(box), villageBuildable(), villageUnlocked(), villageBuilt(id), buildVillage(id).
// Émet : 'building:built' { id }. Écoute : 'trip:return'. Enregistre : GAME.addUses (« Village : … », « Atelier : … »).

// ---- sauvegarde (anciennes parties : S.village absent)
function villageState() {
  if (!S.village || typeof S.village !== 'object') S.village = { built: [] };
  if (!Array.isArray(S.village.built)) S.village.built = [];
  return S.village;
}
villageState();

// ---- catalogue (ids imposés par le contrat commun)
const VILLAGE_BUILDINGS = [
  { id: 'boulangerie', name: 'Boulangerie', the: 'La boulangerie', fem: 1, desc: 'Une petite boulangerie qui sent bon le pain chaud.', bonus: '+1 objet de nourriture du lieu visité, à chaque retour de voyage.', cost: [['farine', 2]], coins: 60 },
  { id: 'potager', name: 'Potager', the: 'Le potager', desc: 'Des rangs de légumes et de fraises, soignés par les trois compagnons.', bonus: '+1 légume ou fruit du potager à chaque retour.', cost: [['graine', 3], ['bois', 2]], coins: 30 },
  { id: 'phare', name: 'Phare', the: 'Le phare', desc: 'Sa lumière guide les voyageurs vers des endroits oubliés.', bonus: '15 % de chances de rapporter une carte au trésor (lieu secret).', cost: [['pierre', 4], ['verre', 2]], coins: 120 },
  { id: 'fontaine', name: 'Fontaine', the: 'La fontaine', fem: 1, desc: 'Une fontaine à vœux au milieu des fleurs.', bonus: '+15 pièces à chaque retour : un vœu exaucé !', cost: [['pierre', 3], ['coquillage', 2]], coins: 60 },
  { id: 'atelier_couture', name: 'Atelier de couture', short: 'Couture', the: 'L’atelier de couture', desc: 'Fils, boutons et rubans pour coudre de jolies tenues.', bonus: '+1 pelote de laine à chaque retour (pour les pulls et moufles de l’atelier).', cost: [['tissu', 3], ['plume', 2]], coins: 60 },
  { id: 'salon_the', name: 'Salon de thé', the: 'Le salon de thé', desc: 'On s’y repose en racontant ses voyages.', bonus: '+20 expérience pour le compagnon qui rentre de voyage.', cost: [['feuille', 3], ['sucre', 2]], coins: 50 },
  { id: 'kiosque', name: 'Kiosque', the: 'Le kiosque', desc: 'Journaux, cartes et nouvelles du monde entier.', bonus: '+1 papier ancien à chaque retour (pour les mappemondes de l’atelier).', cost: [['papier', 3], ['metal', 2]], coins: 50 },
  { id: 'observatoire', name: 'Observatoire', the: 'L’observatoire', desc: 'Une coupole pour regarder les étoiles filantes.', bonus: '25 % de chances de rapporter une poussière d’étoile (épique).', cost: [['verre', 3], ['metal', 3], ['papier', 2]], coins: 150 },
  { id: 'serre', name: 'Serre', the: 'La serre', fem: 1, desc: 'Une serre de verre où poussent des plantes du monde entier.', bonus: '+1 graine à chaque retour (pour les plantes en pot).', cost: [['verre', 3], ['graine', 2]], coins: 80 },
  { id: 'port', name: 'Port', the: 'Le port', desc: 'Un ponton de bois et un petit bateau à voile.', bonus: '+1 produit de la mer à chaque retour (le plat préféré de Bulle).', cost: [['bois', 4], ['coquillage', 2]], coins: 100 },
  { id: 'bibliotheque', name: 'Bibliothèque', the: 'La bibliothèque', fem: 1, desc: 'Des livres de voyage pour savoir où chercher les trésors.', bonus: '20 % de chances de rapporter un objet rare en plus.', cost: [['papier', 4], ['bois', 3]], coins: 120 },
  { id: 'glacier', name: 'Glacier', the: 'Le glacier', desc: 'Des glaces à toutes les saveurs, même les plus étranges.', bonus: '+1 sorbet des bois à chaque retour (Pistache adore).', cost: [['sucre', 2], ['fruit', 2]], coins: 60 },
];
const VB = id => VILLAGE_BUILDINGS.find(b => b.id === id);

// ---- état
const villageBuilt = id => villageState().built.includes(id);
function villageUnlocked() {
  let ids = [];
  try { if (typeof dreamUnlocks === 'function') ids = dreamUnlocks() || []; } catch (e) {}
  const v = villageState();
  return new Set([...ids, ...(v.dbg || []), ...v.built]);
}
const villageCanPay = b => b.cost.every(([k, n]) => ING[k] && ingCount(k) >= n) && S.coins >= b.coins;
function villageBuildable() { const u = villageUnlocked(); return VILLAGE_BUILDINGS.filter(b => u.has(b.id) && !villageBuilt(b.id) && villageCanPay(b)); }
// quel rêve débloque ce bâtiment ? (lit le catalogue du module Rêves s'il existe, sans en dépendre)
function villageDreamFor(id) {
  try {
    if (typeof dreamForBuilding === 'function') { const d = dreamForBuilding(id); if (d) return d; }
    if (typeof DREAMS === 'undefined') return null;
    let found = null;
    const walk = (o, who, depth) => {
      if (found || !o || typeof o !== 'object' || depth > 4) return;
      if (!Array.isArray(o) && [o.unlock, o.unlocks, o.building, o.batiment].includes(id)) { found = Object.assign({ who }, o); return; }
      for (const [k, v] of Object.entries(o)) walk(v, CHARS[k] ? k : who, depth + 1);
    };
    walk(DREAMS, null, 0);
    return found;
  } catch (e) { return null; }
}
function villageLockText(id) {
  const d = villageDreamFor(id);
  if (!d) return 'Débloqué par un rêve de compagnon.';
  const who = d.who && CHARS[d.who] ? CHARS[d.who].name : null, t = d.title || d.name || d.txt || d.text;
  return `Débloqué par le rêve${who ? ' de ' + who : ''}${t ? ` : « ${t} »` : ''}.`;
}

// ---- construction
function buildVillage(id) {
  const b = VB(id); if (!b || villageBuilt(id) || !villageUnlocked().has(id) || !villageCanPay(b)) return false;
  for (const [key, n] of b.cost) {
    const subs = ING[key][0];
    const cands = S.inv.filter(i => subs.includes(i.sub) && (i.cat === 'm' || i.cat === 'n')).sort((a, c) => a.rarity - c.rarity);
    cands.slice(0, n).forEach(c => S.inv.splice(S.inv.indexOf(c), 1));
  }
  S.coins -= b.coins;
  villageState().built.push(id);
  villSel = id; villFresh = id;
  save();
  try { GAME.emit('building:built', { id }); } catch (e) {}
  renderTop(); renderPanel();
  const m = $('modal');
  m.querySelector('.mbox').innerHTML = `<div class="vcele"><span class="vck">Nouveau bâtiment !</span><svg viewBox="-6 -6 92 92" class="vbig">${villageArt(id)}</svg><h2>${esc(b.the)} est ${b.fem ? 'construite' : 'construit'} !</h2><p class="vbon"><b>Bonus :</b> ${esc(b.bonus)}</p><p class="small">Le bonus s’applique automatiquement à chaque retour de voyage.</p><button class="btn green big" data-vclose="1">Super !</button></div>`;
  m.hidden = false;
  if (typeof confetti === 'function') { try { confetti(true); } catch (e) {} }
  setTimeout(() => { villFresh = null; }, 1600);
  return true;
}

// ---- dessins (chaque bâtiment dans un carré 0..80)
const VL = '#5b4636';
const vs = `stroke="${VL}" stroke-width="2" stroke-linejoin="round"`;
const vShadow = (rx = 32) => `<ellipse cx="40" cy="73" rx="${rx}" ry="5" fill="#3d5a2a" opacity=".16"/>`;
const VILLAGE_ART = {
  boulangerie: () => vShadow() + `<rect x="56" y="12" width="8" height="16" fill="#c97a5a" ${vs}/><rect x="11" y="32" width="58" height="40" rx="3" fill="#fff1dc" ${vs}/><path d="M5 35 Q40 4 75 35Z" fill="#d98a4f" ${vs}/><g transform="rotate(-10 40 24)"><ellipse cx="40" cy="24" rx="14" ry="4.6" fill="#e9b46a" ${vs}/><path d="M33 22.5 l3 3 M39 22 l3 3 M45 22.5 l3 3" stroke="${VL}" stroke-width="1.4" stroke-linecap="round"/></g><rect x="9" y="38" width="62" height="8" fill="#fff" ${vs}/>${[0, 1, 2, 3, 4].map(i => `<rect x="${10 + i * 12.4}" y="39" width="6.2" height="6" fill="#f3aec1"/>`).join('')}<path d="M9 46 ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `a3.9 3.9 0 0 0 7.75 0`).join(' ')}" fill="#f3aec1" ${vs}/><rect x="15" y="54" width="12" height="11" rx="1.5" fill="#bfe1f2" ${vs}/><rect x="53" y="54" width="12" height="11" rx="1.5" fill="#bfe1f2" ${vs}/><path d="M33 72 V59 a7 7 0 0 1 14 0 V72Z" fill="#c98a5a" ${vs}/><circle cx="44" cy="65" r="1.2" fill="${VL}"/>`,
  potager: () => vShadow(34) + `<rect x="7" y="30" width="66" height="40" rx="5" fill="#b98457" ${vs}/>${[39, 49, 59].map(y => `<path d="M12 ${y} H68" stroke="#93613a" stroke-width="3" stroke-linecap="round"/>`).join('')}${[15, 27, 39, 51, 63].map((x, i) => `<path d="M${x} 37 q-4 -6 0 -9 q4 3 0 9Z M${x} 37 q5 -4 7 -2 q-2 4 -7 2Z" fill="#6faf4f" stroke="${VL}" stroke-width="1.2"/>` + `<path d="M${x + 1} 49 l-2 -7 M${x + 1} 49 l2 -7" stroke="#5f9f3f" stroke-width="2" stroke-linecap="round"/><path d="M${x - 2} 49 h6 l-3 6Z" fill="#f2963b" stroke="${VL}" stroke-width="1.2"/>` + (i % 2 ? `<circle cx="${x + 1}" cy="58" r="3.2" fill="#e5584f" stroke="${VL}" stroke-width="1.2"/>` : `<circle cx="${x + 1}" cy="58" r="3.6" fill="#8fcf7f" stroke="${VL}" stroke-width="1.2"/>`)).join('')}<path d="M5 66 H75" stroke="#f3e3c3" stroke-width="3"/>${[6, 22, 38, 54, 70].map(x => `<rect x="${x - 2}" y="60" width="5" height="13" rx="1.5" fill="#f3e3c3" stroke="${VL}" stroke-width="1.4"/>`).join('')}<path d="M64 30 V8 M57 14 H71" stroke="#a87a50" stroke-width="2.5" stroke-linecap="round"/><circle cx="64" cy="9" r="4" fill="#f2d48f" ${vs}/><path d="M58 7 H70 L64 1Z" fill="#d9604f" ${vs}/>`,
  phare: () => vShadow(28) + `<path d="M6 66 Q14 60 24 66 T44 66 T64 66 T76 66 V74 H6Z" fill="#8fd0ea" opacity=".9"/><path d="M14 74 Q16 60 28 62 Q40 55 52 62 Q64 60 66 74Z" fill="#b9b3a8" ${vs}/><path d="M33 13 L67 6 V22Z M47 13 L13 6 V22Z" fill="#fbe08a" opacity=".55"/><path d="M30 64 L33 22 H47 L50 64Z" fill="#fff" ${vs}/><path d="M32.4 32 H47.6 L48.2 41 H31.8Z M31.5 49 H48.5 L49.1 58 H30.9Z" fill="#e5684f"/><path d="M30 64 L33 22 H47 L50 64Z" fill="none" ${vs}/><rect x="28" y="20" width="24" height="4" rx="1" fill="#e5684f" ${vs}/><rect x="33" y="10" width="14" height="10" fill="#fbe08a" ${vs}/><path d="M40 10 V20" stroke="${VL}" stroke-width="1.4"/><path d="M31 11 L40 3 L49 11Z" fill="#e5684f" ${vs}/><path d="M37 64 V57 a3 3 0 0 1 6 0 V64Z" fill="#c98a5a" ${vs}/>`,
  fontaine: () => vShadow(34) + `<path d="M40 22 Q26 12 18 42 M40 22 Q54 12 62 42" fill="none" stroke="#8fd0ea" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="40" cy="58" rx="32" ry="12" fill="#e6dccb" ${vs}/><ellipse cx="40" cy="57" rx="26" ry="8" fill="#8fd0ea" ${vs}/><path d="M24 57 q4 -2 8 0 M44 59 q4 -2 8 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8 58 V64 A32 12 0 0 0 72 64 V58 A32 12 0 0 1 8 58Z" fill="#d8cdb8" ${vs}/><rect x="36" y="30" width="8" height="26" fill="#e6dccb" ${vs}/><ellipse cx="40" cy="30" rx="12" ry="4" fill="#e6dccb" ${vs}/><ellipse cx="40" cy="29" rx="8" ry="2.2" fill="#8fd0ea"/><circle cx="40" cy="22" r="4" fill="#8fd0ea" ${vs}/><circle cx="18" cy="46" r="1.6" fill="#8fd0ea"/><circle cx="62" cy="46" r="1.6" fill="#8fd0ea"/><path d="M14 66 l2 -5 l2 5 M64 66 l2 -5 l2 5" stroke="#5f9f3f" stroke-width="1.6" fill="none"/><circle cx="16" cy="60" r="2.4" fill="#f39ab0"/><circle cx="66" cy="60" r="2.4" fill="#f6c445"/>`,
  atelier_couture: () => vShadow() + `<rect x="12" y="34" width="56" height="38" rx="2" fill="#ece3fa" ${vs}/><path d="M6 37 L40 11 L74 37Z" fill="#9b86d6" ${vs}/><rect x="34" y="19" width="12" height="3" rx="1" fill="#c98a5a" ${vs} stroke-width="1.4"/><rect x="35.5" y="22" width="9" height="7" fill="#f08aa6" stroke="${VL}" stroke-width="1.4"/><path d="M35.5 24.5 h9 M35.5 26.5 h9" stroke="#c45a78" stroke-width="1"/><rect x="34" y="29" width="12" height="3" rx="1" fill="#c98a5a" stroke="${VL}" stroke-width="1.4"/><path d="M46 25 q8 -2 8 6" stroke="#f08aa6" stroke-width="1.4" fill="none"/><rect x="17" y="43" width="23" height="19" rx="2" fill="#bfe1f2" ${vs}/><circle cx="28.5" cy="47.5" r="2" fill="#f6e3c4" stroke="${VL}" stroke-width="1.2"/><path d="M25.5 50 h6 l3.5 11 h-13Z" fill="#f39ab0" stroke="${VL}" stroke-width="1.3"/><path d="M47 72 V50 H61 V72Z" fill="#c98a5a" ${vs}/><circle cx="58" cy="62" r="1.2" fill="${VL}"/><path d="M12 72 H68" stroke="${VL}" stroke-width="2"/>`,
  salon_the: () => vShadow(34) + `<rect x="9" y="35" width="46" height="37" rx="2" fill="#d6f0e2" ${vs}/><path d="M4 38 Q32 13 60 38Z" fill="#7cc7a8" ${vs}/><g><ellipse cx="32" cy="27" rx="7" ry="5" fill="#fff" stroke="${VL}" stroke-width="1.6"/><path d="M25 27 q-5 -1 -5 -5 M39 27 q4 0 4 -4" stroke="${VL}" stroke-width="1.6" fill="none"/><path d="M28 22.5 h8" stroke="${VL}" stroke-width="1.6"/><circle cx="32" cy="20.5" r="1.6" fill="#f08aa6" stroke="${VL}" stroke-width="1"/></g><rect x="13" y="45" width="10" height="11" rx="1.5" fill="#bfe1f2" ${vs}/><path d="M28 72 V57 a7 7 0 0 1 14 0 V72Z" fill="#c98a5a" ${vs}/><path d="M67 33 V71" stroke="${VL}" stroke-width="2"/><path d="M54 37 Q67 21 80 37Z" fill="#f3aec1" ${vs}/><path d="M60 36 Q63 30 67 25 M74 36 Q71 30 67 25" stroke="#fff" stroke-width="1.6" fill="none"/><rect x="59" y="57" width="16" height="3" rx="1" fill="#c98a5a" ${vs} stroke-width="1.4"/><path d="M62 60 V70 M72 60 V70" stroke="${VL}" stroke-width="1.6"/><path d="M63 52 h5 v3.5 a2.5 2.5 0 0 1 -5 0Z" fill="#fff" stroke="${VL}" stroke-width="1.2"/>`,
  kiosque: () => vShadow(26) + `<rect x="23" y="33" width="34" height="39" rx="3" fill="#5fa274" ${vs}/><rect x="27" y="39" width="11" height="14" rx="1" fill="#f6d36b" stroke="${VL}" stroke-width="1.4"/><path d="M29 43 h7 M29 46 h5 M29 49 h7" stroke="${VL}" stroke-width="1"/><rect x="42" y="39" width="11" height="14" rx="1" fill="#f3aec1" stroke="${VL}" stroke-width="1.4"/><circle cx="47.5" cy="44" r="2.5" fill="#fff"/><rect x="18" y="56" width="44" height="6" rx="1.5" fill="#c98a5a" ${vs}/><rect x="22" y="52" width="9" height="4" fill="#fff" stroke="${VL}" stroke-width="1.2"/><rect x="34" y="51" width="9" height="5" fill="#bfe1f2" stroke="${VL}" stroke-width="1.2"/><rect x="47" y="52" width="9" height="4" fill="#fff" stroke="${VL}" stroke-width="1.2"/><path d="M19 33 Q40 4 61 33Z" fill="#3a8f5a" ${vs}/><path d="M30 31 Q35 16 40 11 M50 31 Q45 16 40 11" stroke="#6fbf8a" stroke-width="1.6" fill="none"/><rect x="19" y="30" width="42" height="5" rx="1.5" fill="#f6c445" ${vs}/><circle cx="40" cy="10" r="3.2" fill="#f6c445" ${vs}/><path d="M26 72 V62 M54 72 V62" stroke="${VL}" stroke-width="2"/>`,
  observatoire: () => vShadow(30) + `<path d="M12 12 l1 2.5 2.5 .5-2 1.6.6 2.6-2.1-1.4-2.2 1.4.7-2.6-2-1.6 2.5-.5Z M69 8 l.9 2 2 .4-1.5 1.3.4 2-1.8-1-1.8 1 .4-2-1.5-1.3 2-.4Z" fill="#f6c445" stroke="${VL}" stroke-width="1"/><rect x="14" y="44" width="52" height="28" rx="2" fill="#e6dccb" ${vs}/><path d="M14 52 H66 M14 62 H66 M27 44 V52 M53 44 V52 M40 52 V62 M22 62 V72 M58 62 V72" stroke="#c9bba2" stroke-width="1.4"/><path d="M12 46 A28 28 0 0 1 68 46Z" fill="#dfe7f5" ${vs}/><path d="M22 34 A20 20 0 0 1 36 22" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M37 19 L45 18.5 L46.5 46 H37.5Z" fill="#3b4a7a" ${vs}/><g transform="rotate(32 42 30)"><rect x="38.5" y="6" width="8" height="24" rx="2" fill="#a87a50" ${vs}/><rect x="37.5" y="5" width="10" height="4" rx="1" fill="#f6c445" stroke="${VL}" stroke-width="1.4"/></g><path d="M34 72 V61 a6 6 0 0 1 12 0 V72Z" fill="#7a8fb8" ${vs}/>`,
  serre: () => vShadow(34) + `<rect x="7" y="60" width="66" height="12" rx="2" fill="#e6dccb" ${vs}/><path d="M8 60 V40 Q40 12 72 40 V60Z" fill="#d6f2fa" ${vs}/>${[[17, 55, '#6faf4f', 7], [31, 52, '#8fcf7f', 8], [48, 54, '#5f9f5f', 7], [62, 53, '#8fcf7f', 6]].map(([x, y, c, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${VL}" stroke-width="1.3"/>`).join('')}<circle cx="29" cy="48" r="2" fill="#f39ab0"/><circle cx="35" cy="53" r="2" fill="#f6c445"/><circle cx="60" cy="50" r="2" fill="#f39ab0"/><circle cx="15" cy="51" r="1.8" fill="#fff"/><path d="M8 60 V40 Q40 12 72 40 V60Z" fill="#bfe6f5" fill-opacity=".35" ${vs}/><path d="M24 60 V30 M40 60 V26 M56 60 V30 M8 44 H72" stroke="${VL}" stroke-width="1.4" fill="none"/><path d="M14 38 Q22 28 30 25" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M36 72 V62 H44 V72" fill="#c98a5a" stroke="${VL}" stroke-width="1.6"/>`,
  port: () => `<rect x="2" y="44" width="76" height="32" rx="8" fill="#8fd0ea" ${vs}/><path d="M8 54 q4 -3 8 0 t8 0 M30 68 q4 -3 8 0 t8 0 M8 70 q4 -3 8 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="4" y="36" width="42" height="9" rx="1.5" fill="#c98a5a" ${vs}/><path d="M14 36 V45 M24 36 V45 M34 36 V45" stroke="#a87a50" stroke-width="1.4"/>${[8, 22, 38].map(x => `<rect x="${x}" y="45" width="5" height="13" rx="1" fill="#a87a50" stroke="${VL}" stroke-width="1.4"/>`).join('')}<rect x="9" y="24" width="12" height="12" rx="1" fill="#e9b07a" ${vs}/><path d="M9 30 H21 M15 24 V36" stroke="${VL}" stroke-width="1.2"/><circle cx="32" cy="29" r="5.5" fill="none" stroke="#e5684f" stroke-width="3.4"/><circle cx="32" cy="29" r="7.2" fill="none" stroke="${VL}" stroke-width="1"/><path d="M58 22 V60" stroke="${VL}" stroke-width="2"/><path d="M59.5 22 L74 52 H59.5Z" fill="#fff" ${vs}/><path d="M56.5 26 L47 50 H56.5Z" fill="#f3aec1" ${vs}/><path d="M58 22 l8 -3 -8 -2" fill="#f6c445" stroke="${VL}" stroke-width="1.2"/><path d="M44 58 H76 L70 68 H50Z" fill="#e5684f" ${vs}/><path d="M48 62 H72" stroke="#fff" stroke-width="1.8"/>`,
  bibliotheque: () => vShadow(34) + `<rect x="7" y="66" width="66" height="6" rx="1" fill="#e6dccb" ${vs}/><rect x="11" y="61" width="58" height="6" rx="1" fill="#efe5d4" ${vs}/><rect x="14" y="38" width="52" height="23" fill="#efe0c5" ${vs}/><path d="M36 61 V48 a4 4 0 0 1 8 0 V61Z" fill="#8a6448" ${vs}/>${[15.5, 26.5, 48.5, 59.5].map(x => `<rect x="${x}" y="38" width="6" height="23" fill="#fff" stroke="${VL}" stroke-width="1.6"/><path d="M${x + 3} 41 V58" stroke="#d9cbb3" stroke-width="1.2"/>`).join('')}<rect x="10" y="32" width="60" height="6" rx="1" fill="#f6ead2" ${vs}/><path d="M7 33 L40 12 L73 33Z" fill="#f6ead2" ${vs}/><path d="M31 27 Q35.5 24 40 26.5 Q44.5 24 49 27 V21 Q44.5 18 40 20.5 Q35.5 18 31 21Z" fill="#fff" stroke="${VL}" stroke-width="1.4"/><path d="M40 20.5 V26.5" stroke="${VL}" stroke-width="1.2"/><path d="M33 22 h4 M43 22 h4" stroke="#9b86d6" stroke-width="1"/>`,
  glacier: () => vShadow() + `<rect x="12" y="40" width="56" height="32" rx="3" fill="#fff" ${vs}/>${[0, 1, 2, 3].map(i => `<rect x="${15.5 + i * 14}" y="41" width="7" height="30" fill="#fbd3df"/>`).join('')}<rect x="12" y="40" width="56" height="32" rx="3" fill="none" ${vs}/><rect x="19" y="47" width="42" height="12" rx="2" fill="#bfe1f2" ${vs}/>${[[26, '#f39ab0'], [34, '#bfe6d0'], [42, '#fbe08a'], [50, '#c9a0e0']].map(([x, c]) => `<circle cx="${x + 2}" cy="55" r="3.2" fill="${c}" stroke="${VL}" stroke-width="1.1"/>`).join('')}<rect x="8" y="35" width="64" height="7" rx="2" fill="#f08aa6" ${vs}/><path d="M8 42 ${[0, 1, 2, 3, 4, 5, 6, 7].map(() => 'a4 4 0 0 0 8 0').join(' ')}" fill="#f08aa6" ${vs}/><path d="M33.5 23 L40 37 L46.5 23Z" fill="#e9b46a" ${vs}/><path d="M36 26 l6 4 M38 32 l4 -5" stroke="#b9853f" stroke-width="1"/><circle cx="40" cy="19" r="7.5" fill="#f39ab0" ${vs}/><circle cx="40" cy="10.5" r="5.8" fill="#bfe6d0" ${vs}/><circle cx="41.5" cy="4" r="2.4" fill="#e5584f" stroke="${VL}" stroke-width="1.2"/><path d="M30 72 V63 H38 V72" fill="#c98a5a" stroke="${VL}" stroke-width="1.6"/>`,
};
function villageArt(id) { const f = VILLAGE_ART[id]; return f ? f() : ''; }
const VLOCK = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0 V-5 a6 6 0 0 1 12 0 V0" fill="none" stroke="${VL}" stroke-width="3"/><rect x="-9" y="-1" width="18" height="15" rx="3.5" fill="#f2c14e" stroke="${VL}" stroke-width="2"/><circle cx="0" cy="5" r="2" fill="${VL}"/><path d="M0 6 V10" stroke="${VL}" stroke-width="2" stroke-linecap="round"/></g>`;

// ---- vue SVG du village (4 × 4 cases, la maison des compagnons au centre)
let villSel = null, villFresh = null;
const VCELLS = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1]]; // tour du village, dans le sens des aiguilles d'une montre
function villageSVG() {
  const night = isNight(), u = villageUnlocked();
  let s = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" class="vsvg" role="img" aria-label="Vue du village des compagnons">`;
  s += `<defs><pattern id="vgr" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#bfe3a0"/><path d="M6 10 l2 -4 l2 4 M26 30 l2 -4 l2 4" stroke="#a6d388" stroke-width="1.6" fill="none"/><circle cx="32" cy="9" r="1.4" fill="#d7efc2"/><circle cx="12" cy="31" r="1.2" fill="#d7efc2"/></pattern>`;
  s += `<pattern id="vlk" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#ead6ae"/><rect width="4" height="10" fill="#e2cb9d"/></pattern></defs>`;
  s += `<rect width="400" height="400" rx="22" fill="url(#vgr)"/>`;
  // chemin en anneau autour du centre + allées vers chaque parcelle
  s += `<g fill="none" stroke-linecap="round">`;
  const spokes = [[150, 100, 150, 88], [250, 100, 250, 88], [300, 150, 312, 150], [300, 250, 312, 250], [150, 300, 150, 312], [250, 300, 250, 312], [100, 150, 88, 150], [100, 250, 88, 250], [104, 104, 86, 86], [296, 104, 314, 86], [296, 296, 314, 314], [104, 296, 86, 314]];
  s += `<rect x="100" y="100" width="200" height="200" rx="34" stroke="#d9be8c" stroke-width="22"/>` + spokes.map(p => `<path d="M${p[0]} ${p[1]} L${p[2]} ${p[3]}" stroke="#d9be8c" stroke-width="16"/>`).join('');
  s += `<rect x="100" y="100" width="200" height="200" rx="34" stroke="#f3e1bb" stroke-width="16"/>` + spokes.map(p => `<path d="M${p[0]} ${p[1]} L${p[2]} ${p[3]}" stroke="#f3e1bb" stroke-width="10"/>`).join('');
  s += `<rect x="100" y="100" width="200" height="200" rx="34" stroke="#e7cf9f" stroke-width="2" stroke-dasharray="3 9"/></g>`;
  // centre : place, arbres, maison des compagnons
  s += `<ellipse cx="200" cy="236" rx="74" ry="34" fill="#f3e1bb" stroke="#d9be8c" stroke-width="3"/><ellipse cx="200" cy="236" rx="50" ry="21" fill="none" stroke="#e7cf9f" stroke-width="2" stroke-dasharray="4 6"/>`;
  const tree = (x, y, r, c) => `<ellipse cx="${x}" cy="${y + r + 4}" rx="${r * .9}" ry="${r * .28}" fill="#3d5a2a" opacity=".16"/><rect x="${x - 3}" y="${y + r * .4}" width="6" height="${r * .9}" rx="2" fill="#a87a50" stroke="${VL}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${VL}" stroke-width="2"/><circle cx="${x - r * .35}" cy="${y - r * .3}" r="${r * .28}" fill="#fff" opacity=".22"/>`;
  s += tree(132, 140, 15, '#8fcf7f') + tree(270, 136, 13, '#7cc28a') + tree(282, 168, 10, '#9bd68a') + tree(120, 180, 9, '#7cc28a');
  [[136, 270, '#f39ab0'], [146, 278, '#f6c445'], [262, 276, '#f39ab0'], [272, 268, '#fff'], [254, 284, '#c9a0e0'], [124, 262, '#fff']].forEach(([x, y, c]) => { s += `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}" stroke="${VL}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="1" fill="#f6c445"/>`; });
  // maison
  s += `<g transform="translate(152 128)"><ellipse cx="48" cy="86" rx="46" ry="6" fill="#3d5a2a" opacity=".16"/><rect x="66" y="10" width="11" height="22" fill="#c97a5a" ${vs}/><rect x="10" y="40" width="76" height="46" rx="3" fill="#fff3e2" ${vs}/><path d="M2 44 L48 8 L94 44Z" fill="#d9604f" ${vs}/><path d="M16 38 L48 13 L80 38" stroke="#e98a7a" stroke-width="2" fill="none"/><circle cx="48" cy="30" r="7" fill="${night ? '#fbe08a' : '#bfe1f2'}" ${vs}/><path d="M48 23 V37 M41 30 H55" stroke="${VL}" stroke-width="1.4"/><rect x="16" y="52" width="18" height="15" rx="2" fill="${night ? '#fbe08a' : '#bfe1f2'}" ${vs}/><path d="M25 52 V67" stroke="${VL}" stroke-width="1.4"/><rect x="62" y="52" width="18" height="15" rx="2" fill="${night ? '#fbe08a' : '#bfe1f2'}" ${vs}/><path d="M71 52 V67" stroke="${VL}" stroke-width="1.4"/><rect x="14" y="67" width="22" height="5" rx="2" fill="#8fcf7f" stroke="${VL}" stroke-width="1.4"/><rect x="60" y="67" width="22" height="5" rx="2" fill="#8fcf7f" stroke="${VL}" stroke-width="1.4"/><path d="M39 86 V64 a9 9 0 0 1 18 0 V86Z" fill="#c98a5a" ${vs}/><circle cx="53" cy="76" r="1.5" fill="${VL}"/></g>`;
  s += `<g data-vhome="1" class="vhome"><rect x="166" y="104" width="68" height="18" rx="9" fill="#fff8ea" stroke="${VL}" stroke-width="2"/><text x="200" y="117.5" class="vtxt">Maison</text></g>`;
  // compagnons à la maison
  const home = Object.keys(CHARS).filter(k => !S.trips[k]);
  home.forEach((k, i) => { const w = 44, x = 200 - (home.length * 40) / 2 + i * 40 - 2; s += `<g class="vchar" data-hc="${k}">${drawChar(k, S.outfits[k], night ? 'dodo' : 'content', 'vl' + k).replace('<svg ', `<svg x="${x}" y="${258 - w * 1.06}" width="${w}" height="${w * 1.1}" `)}</g>`; });
  // parcelles
  VILLAGE_BUILDINGS.forEach((b, i) => {
    const [cx, cy] = VCELLS[i], x = cx * 100 + 10, y = cy * 100 + 8, built = villageBuilt(b.id), open = u.has(b.id), sel = villSel === b.id;
    const state = built ? 'built' : open ? 'open' : 'locked', label = b.short || b.name;
    s += `<g class="vplot ${state}${sel ? ' sel' : ''}${villFresh === b.id ? ' fresh' : ''}" data-vplot="${b.id}" role="button" tabindex="0" aria-label="${esc(b.name)} : ${built ? 'construit' : open ? 'à construire' : 'verrouillé'}"><g transform="translate(${x} ${y})">`;
    if (sel) s += `<rect x="-6" y="-4" width="92" height="92" rx="16" fill="#fff8ea" fill-opacity=".55" stroke="#2f7f6c" stroke-width="3.5"/>`;
    if (built) s += `<g class="vart">${villageArt(b.id)}</g><rect x="${40 - label.length * 3.2 - 7}" y="73" width="${label.length * 6.4 + 14}" height="15" rx="7.5" fill="#fff8ea" stroke="${VL}" stroke-width="1.6"/><text x="40" y="84.5" class="vlab">${esc(label)}</text>`;
    else if (open) { const ok = villageCanPay(b); s += `<rect x="4" y="6" width="72" height="68" rx="12" fill="#fff8ea" fill-opacity=".45" stroke="${VL}" stroke-width="2" stroke-dasharray="6 5"/><g opacity=".3">${villageArt(b.id)}</g><rect x="${40 - label.length * 3.2 - 7}" y="-1" width="${label.length * 6.4 + 14}" height="15" rx="7.5" fill="#fff8ea" stroke="${VL}" stroke-width="1.4" stroke-dasharray="3 2"/><text x="40" y="10.5" class="vlab">${esc(label)}</text><g class="vbtn${ok ? ' ok' : ''}"><rect x="2" y="64" width="76" height="22" rx="11" fill="${ok ? '#5fbf7f' : '#f6c445'}" stroke="${VL}" stroke-width="2"/><text x="40" y="79.5" class="vtxt">Construire</text></g>`; }
    else s += `<rect x="6" y="10" width="68" height="64" rx="12" fill="url(#vlk)" stroke="#c9ad7c" stroke-width="2"/><path d="M6 22 H74 M6 62 H74" stroke="#b8996a" stroke-width="1.4" stroke-dasharray="2 4"/>${[[10, 14], [70, 14], [10, 70], [70, 70]].map(([px, py]) => `<rect x="${px - 2}" y="${py - 6}" width="4" height="10" rx="1" fill="#a87a50"/>`).join('')}${VLOCK(40, 38, 1.05)}`;
    s += `</g></g>`;
  });
  if (night) s += `<rect width="400" height="400" rx="22" fill="#2f3d6b" opacity=".18" pointer-events="none"/>`;
  return s + `</svg>`;
}

// ---- panneau Village > Bâtiments
const costHTML = b => b.cost.map(([k, n]) => { const have = ING[k] ? ingCount(k) : 0; return `<li class="${have >= n ? 'have' : ''}">${ING[k] ? esc(ING[k][1]) : k} <b>${Math.min(have, n)}/${n}</b></li>`; }).join('') + (b.coins ? `<li class="${S.coins >= b.coins ? 'have' : ''}">${coins(b.coins)}</li>` : '');
const miniArt = (id, locked) => `<svg viewBox="-4 -4 88 88" class="vmini">${locked ? `<rect x="6" y="10" width="68" height="64" rx="12" fill="url(#vlk)" stroke="#c9ad7c" stroke-width="2"/>${VLOCK(40, 38, 1.4)}` : villageArt(id)}</svg>`;
function villageCard(b) {
  const built = villageBuilt(b.id), open = villageUnlocked().has(b.id), ok = villageCanPay(b);
  let h = `<div class="vcard ${built ? 'built' : open ? 'open' : 'locked'}"><div class="vch">${miniArt(b.id, !open)}<div><span class="vst">${built ? 'Construit' : open ? 'Prêt à construire' : 'Verrouillé'}</span><h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p></div></div>`;
  h += `<p class="vbon"><b>${built ? 'Bonus actif' : 'Bonus'} :</b> ${esc(b.bonus)}</p>`;
  if (!open) h += `<p class="vlock">${VLOCK_ICON} ${esc(villageLockText(b.id))}</p>`;
  else if (!built) h += `<div class="vcost"><b>Matériaux</b><ul>${costHTML(b)}</ul></div><button class="btn ${ok ? 'green' : 'cream'} wide" data-vbuild="${b.id}" ${ok ? '' : 'disabled'}>${ok ? 'Construire !' : 'Il manque des matériaux'}</button>${ok ? '' : `<p class="small">Les matériaux se trouvent en voyage. Touchez un objet du sac : « Sert à… » vous dit s’il sert à ce bâtiment.</p>`}`;
  return h + `</div>`;
}
const VLOCK_ICON = `<svg viewBox="-10 -12 20 28" width="16" height="20" aria-hidden="true">${VLOCK(0, 0, 1)}</svg>`;
function renderVillage(box) {
  const v = villageState(), u = villageUnlocked();
  const n = v.built.length, nOpen = VILLAGE_BUILDINGS.filter(b => u.has(b.id) && !villageBuilt(b.id)).length;
  if (villSel && !VB(villSel)) villSel = null;
  if (!villSel) { const f = VILLAGE_BUILDINGS.find(b => u.has(b.id) && !villageBuilt(b.id)); villSel = f ? f.id : null; }
  let html = phead(null, 'Le village', 'Chaque rêve réalisé débloque un bâtiment. Construisez-le avec les matériaux rapportés de voyage : il vous donnera un bonus à chaque retour.');
  html += `<div class="vprog"><b>${n}/${VILLAGE_BUILDINGS.length}</b><span class="vbar"><i style="width:${(n / VILLAGE_BUILDINGS.length * 100).toFixed(0)}%"></i></span><span>${nOpen ? `${nOpen} à construire` : n === VILLAGE_BUILDINGS.length ? 'Village complet !' : 'Réalisez des rêves pour en débloquer'}</span></div>`;
  html += `<div class="vbox">${villageSVG()}</div>`;
  html += villSel ? villageCard(VB(villSel)) : `<p class="small vhint">Touchez une parcelle pour voir le bâtiment. Les parcelles avec un cadenas se débloquent en réalisant les rêves des compagnons.</p>`;
  const order = b => villageBuilt(b.id) ? 1 : u.has(b.id) ? 0 : 2;
  html += `<h3>Tous les bâtiments</h3><div class="vlist">` + VILLAGE_BUILDINGS.slice().sort((a, b) => order(a) - order(b)).map(b => {
    const built = villageBuilt(b.id), open = u.has(b.id);
    return `<button class="vrow ${built ? 'built' : open ? 'open' : 'locked'}${villSel === b.id ? ' on' : ''}" data-vsel="${b.id}">${miniArt(b.id, !open)}<span class="vrx"><b>${esc(b.name)}</b><span>${built ? esc(b.bonus) : open ? (villageCanPay(b) ? 'Prêt à construire !' : 'Débloqué · il manque des matériaux') : esc(villageLockText(b.id))}</span></span><span class="vtag">${built ? '✓' : open ? (villageCanPay(b) ? '!' : '…') : VLOCK_ICON}</span></button>`;
  }).join('') + `</div>`;
  box.innerHTML = html;
}

// ---- clics
document.addEventListener('click', ev => {
  const p = ev.target.closest('[data-vplot]');
  if (p) { villSel = p.dataset.vplot; renderPanel(); const c = document.querySelector('#panelBody .vcard'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
  if (ev.target.closest('[data-vhome]')) { villView = 'maison'; renderPanel(); return; }
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.vsel) { villSel = d.vsel; renderPanel(); const sv = document.querySelector('#panelBody .vbox'); if (sv && sv.scrollIntoView) sv.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
  if (d.vbuild) { buildVillage(d.vbuild); return; }
  if (d.vclose) { $('modal').hidden = true; return; }
});
document.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest && ev.target.closest('[data-vplot]')) { ev.preventDefault(); villSel = ev.target.closest('[data-vplot]').dataset.vplot; renderPanel(); } });

// ---- bonus des bâtiments, à chaque retour de voyage
const VBONUS_ITEMS = {
  potager: [['Carotte du potager', 'n', 'legume', 0, null, '#f2963b'], ['Fraises du potager', 'n', 'fruit', 0, null, '#e5584f'], ['Pomme du verger', 'n', 'pomme', 0, null, '#d9604f']],
  atelier_couture: ['Pelote de laine', 'm', 'laine', 0, null, '#f3aec1'],
  kiosque: ['Papier ancien', 'm', 'papier', 0, null, '#f2e3bf'],
  observatoire: ['Poussière d’étoile', 'm', 'lune', 3, null, '#f6e9a8'],
  serre: ['Graines de la serre', 'm', 'graine', 0, null, '#a8c97a'],
  port: ['Sardines du port', 'n', 'mer', 0, null, '#9fb8cf'],
  glacier: ['Sorbet des bois', 'n', 'fruit', 1, null, '#c94f7c'],
  pain: ['Pain de campagne', 'n', 'pain', 0, null, '#d9a35f'],
};
function villageTripBonus(e) {
  const who = e.who, dest = e.dest || {}, place = dest.name || 'Village', items = [], notes = [];
  const mk = (def, from) => makeItem(def, 0, from, [], { fixed: def[3] });
  if (villageBuilt('boulangerie')) {
    const foods = (dest.tags || []).flatMap(t => (LOOT[t] || []).filter(d => d[1] === 'n'));
    const def = foods.length ? pick(foods) : VBONUS_ITEMS.pain;
    items.push([mk(def, 'Boulangerie du village'), 'Boulangerie']);
  }
  if (villageBuilt('potager')) items.push([mk(pick(VBONUS_ITEMS.potager), 'Potager du village'), 'Potager']);
  if (villageBuilt('phare') && typeof treasureMap === 'function' && Math.random() < 0.15) items.push([treasureMap(place), 'Phare']);
  if (villageBuilt('atelier_couture')) items.push([mk(VBONUS_ITEMS.atelier_couture, 'Atelier de couture'), 'Atelier de couture']);
  if (villageBuilt('kiosque')) items.push([mk(VBONUS_ITEMS.kiosque, 'Kiosque du village'), 'Kiosque']);
  if (villageBuilt('observatoire') && Math.random() < 0.25) items.push([mk(VBONUS_ITEMS.observatoire, 'Observatoire du village'), 'Observatoire']);
  if (villageBuilt('serre')) items.push([mk(VBONUS_ITEMS.serre, 'Serre du village'), 'Serre']);
  if (villageBuilt('port')) items.push([mk(VBONUS_ITEMS.port, 'Port du village'), 'Port']);
  if (villageBuilt('glacier')) items.push([mk(VBONUS_ITEMS.glacier, 'Glacier du village'), 'Glacier']);
  if (villageBuilt('bibliotheque') && Math.random() < 0.2) { const r = lootFor(dest.tags && dest.tags.length ? dest.tags : ['campagne'], 3, place, 1, who)[0]; if (r) { r.rarity = Math.max(2, r.rarity); items.push([r, 'Bibliothèque']); } }
  if (villageBuilt('fontaine')) { gainCoins(15); notes.push('Fontaine : +15 pièces'); }
  if (villageBuilt('salon_the') && S.prog[who]) { addXP(who, 20); notes.push(`Salon de thé : +20 exp. pour ${CHARS[who].name}`); }
  if (!items.length && !notes.length) return;
  items.forEach(([it]) => { S.inv.push(it); S.dex[it.name] = true; });
  save();
  const lines = items.map(([it, src]) => `${src} : ${it.name}`).concat(notes);
  const m = $('modal'), haul = !m.hidden && m.querySelector('.haul');
  if (haul) { // ajout au récapitulatif du retour
    if (typeof haulCard === 'function') items.forEach(([it], i) => haul.insertAdjacentHTML('beforeend', haulCard(it, i, false).replace('</div>', '<span class="hvil">Village</span></div>')));
    let ul = m.querySelector('.hextra');
    if (!ul) { const btn = m.querySelector('.mbox > button:last-child'); ul = document.createElement('ul'); ul.className = 'hextra'; if (btn) btn.before(ul); else m.querySelector('.mbox').appendChild(ul); }
    ul.insertAdjacentHTML('beforeend', `<li class="vil"><b>Bonus du village</b> · ${lines.map(esc).join(' · ')}</li>`);
  } else toast(`Bonus du village : ${lines.join(', ')}`);
}
if (typeof GAME !== 'undefined') {
  GAME.on('trip:return', e => {
    if (tab === 'sac') sacView = 'sac'; // le butin s'ouvre toujours sur le sac
    try { villageTripBonus(e || {}); } catch (err) { console.error('village bonus', err); }
    renderTop(); renderPanel();
  });
  // « Sert à… » : recettes de l'atelier et bâtiments du village qui utilisent cet objet
  GAME.addUses(it => {
    if (!it || !(it.cat === 'm' || it.cat === 'n')) return [];
    const uses = k => ING[k] && ING[k][0].includes(it.sub), out = [];
    VILLAGE_BUILDINGS.forEach(b => { if (!villageBuilt(b.id) && b.cost.some(([k]) => uses(k))) out.push({ txt: `Village : ${b.name}`, kind: 'batiment' }); });
    const seen = new Set();
    RECIPES.forEach(r => { if (r.ing.some(([k]) => uses(k)) && !seen.has(r.out[0])) { seen.add(r.out[0]); out.push({ txt: `Atelier : ${r.out[0]}`, kind: 'recette' }); } });
    return out;
  });
}

// ---- outils de test
window.__debugUnlock = (ids = 'all') => { const v = villageState(); v.dbg = ids === 'all' ? VILLAGE_BUILDINGS.map(b => b.id) : [].concat(ids); save(); renderAll(); return v.dbg; };
window.__village = {
  build: buildVillage, buildable: villageBuildable, unlocked: () => [...villageUnlocked()], B: VILLAGE_BUILDINGS,
  giveMats(id) { const b = VB(id); for (const [k, n] of b.cost) for (let i = 0; i < n; i++) S.inv.push(makeItem(['Test ' + k, 'm', ING[k][0][0], 0], 0, 'Test', [], { fixed: 0 })); S.coins += b.coins; save(); renderAll(); },
  reset() { S.village = { built: [] }; save(); renderAll(); },
  on: (e, f) => GAME.on(e, f), openSheet: n => openSheet(n), itemUses: it => itemUses(it), select: id => { villSel = id; renderPanel(); }, collect: () => collect(), selectComp: k => selectComp(k),
};

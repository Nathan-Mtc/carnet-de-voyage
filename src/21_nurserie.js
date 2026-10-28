// ================= NURSERIE : ŒUFS, RENCONTRES, APPÂTS, REFUGE ET COMPÉDIUM (v13, phase B) =================
// « Explore le vrai monde pour trouver, élever et échanger des compagnons uniques. »
// 1. Œufs régionaux trouvés au retour de voyage (GAME.on('trip:return')) : l'espèce dépend de la région (17_regions.js)
//    et du paysage (tags du lieu). Plus de chances : long voyage, première visite d'une région, appât.
// 2. Rencontres en chemin : un événement de voyage « sauvage » (journal, choix habituel) à apprivoiser avec un objet aimé.
// 3. Appâts : objets qui attirent une espèce (à emporter en partant, panneau de voyage).
// 4. Refuge (habitats à construire et agrandir avec les matériaux) + nurserie (couveuse, enclos des croisements).
// 5. Compédium (Compagnons › Compédium) : espèces, variantes, hybrides, paliers de récompenses.
// 6. Œufs offerts : 2ᵉ rêve de chaque compagnon, chapitres du Grand Carnet, paliers du Compédium.
// Aucune fenêtre spontanée : les nouveautés passent par la carte d'action, les points rouges, les toasts,
// ou s'ajoutent aux fenêtres que le joueur vient d'ouvrir lui-même (butin du retour, rêve réalisé).
// Enveloppe : startTrip, fireEvent, autoResolve, journalEntry, liveAskText, renderVoyage, nextAction, hatchEggScreen,
// claimChapter, renderCompagnons, openCompagnons. Expose : window.__nurse (tests).

// ---------------- état (sauvegarde) ----------------
function nsState() {
  if (!S.nurse || typeof S.nurse !== 'object') S.nurse = {};
  const N = S.nurse;
  for (const [k, v] of Object.entries({ hab: {}, cool: {}, seen: {}, own: {}, pals: {}, pats: {}, eyes: {}, specs: {}, hyb: {}, tiers: {}, gifts: {} })) if (!N[k] || typeof N[k] !== 'object' || Array.isArray(N[k])) N[k] = v;
  for (const k of ['found', 'dry', 'tamed', 'wild', 'crosses']) if (typeof N[k] !== 'number') N[k] = 0;
  if (typeof N.couv !== 'number' || N.couv < 1) N.couv = 1;     // couveuse : niveau 1 à 3 (places)
  if (typeof N.enclos !== 'number') N.enclos = 0;                // enclos des croisements : 0 = pas construit
  if (N.cross && (typeof N.cross !== 'object' || !N.cross.res)) N.cross = null;
  if (typeof N.bait !== 'string') N.bait = '';                   // nom de l'appât choisi pour le prochain départ
  if (!Array.isArray(S.eggs)) S.eggs = [];
  return N;
}

// ---------------- espèces : où les trouver ----------------
// reg : poids par région (17_regions.js) ; tags : poids par paysage (tags des lieux)
const NS_SP = {
  panda: { reg: { chine: 3, inde: 2.5, asie_centrale: 1, coree: 1, japon: 0.6, asie_sud_est: 0.6 }, tags: { foret: 1.2, montagne: 1.4 } },
  capy: { reg: { amerique_sud: 3, mexique_caraibes: 1 }, tags: { lac: 1.4, campagne: 0.7 } },
  axo: { reg: { mexique_caraibes: 3 }, tags: { lac: 1.6, mer: 0.2 } },
  renard: { reg: { arctique: 3, scandinavie: 2.5, canada: 2, britanniques: 0.4, usa_est: 0.4, suisse: 0.5 }, tags: { neige: 1.8, montagne: 0.6 } },
  fennec: { reg: { afrique_nord: 3, moyen_orient: 2.5, asie_centrale: 1, afrique_est: 0.6, usa_ouest: 0.4 }, tags: { desert: 2 } },
  tanuki: { reg: { japon: 3, coree: 2.5, chine: 1 }, tags: { foret: 1, ville: 0.6, campagne: 0.5 } },
  paresseux: { reg: { amerique_sud: 3, mexique_caraibes: 2 }, tags: { foret: 0.9, ile: 0.5 } },
  lemur: { reg: { ocean_indien: 3, afrique_est: 0.8, afrique_sud: 0.6 }, tags: { foret: 0.7, ile: 1 } },
  phoque: { reg: { arctique: 2.5, grand_large: 2, scandinavie: 1.6, britanniques: 1.2, bretagne: 1.2, normandie: 0.8, canada: 1, pacifique: 0.6 }, tags: { mer: 1.4, neige: 0.8 } },
  quokka: { reg: { australie: 3, pacifique: 1.6 }, tags: { ile: 1, campagne: 0.5 } },
};
const NS_PLURAL = { panda: 'les pandas roux', capy: 'les capybaras', axo: 'les axolotls', renard: 'les renards polaires', fennec: 'les fennecs', tanuki: 'les tanukis', paresseux: 'les paresseux', lemur: 'les lémuriens', phoque: 'les phoques', quokka: 'les quokkas' };
const nsLow = sp => spName(sp).toLowerCase();
// score d'une espèce pour un lieu : région + paysage ; une espèce hors de chez elle reste possible, mais rare
function nsSpScore(sp, regId, tags) {
  const d = NS_SP[sp]; if (!d) return 0;
  const t = (tags || []).reduce((a, x) => a + (d.tags[x] || 0), 0);
  return 0.05 + (d.reg[regId] || 0) + t * 0.7;
}
function nsRegionOf(o) { try { if (typeof regionAt === 'function' && o && isFinite(o.lon) && isFinite(o.lat)) return regionAt(o.lon, o.lat); } catch (e) {} return null; }
function nsScores(place, baitSps) {
  const R = nsRegionOf(place), rid = R ? R.id : '', tags = (place && place.tags) || [];
  return SP_IDS.map(sp => { let w = nsSpScore(sp, rid, tags); if (baitSps && baitSps.includes(sp)) w *= 4; return { sp, w }; });
}
function nsPickSp(place, baitSps) {
  const l = nsScores(place, baitSps), tot = l.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * tot; for (const x of l) { r -= x.w; if (r <= 0) return x.sp; }
  return l[0].sp;
}
// texte « où le trouver » (Compédium)
function nsWhere(sp) {
  const d = NS_SP[sp]; if (!d) return '';
  const regs = Object.entries(d.reg).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => (typeof RG !== 'undefined' && RG[id] ? RG[id].short : id));
  const tags = Object.entries(d.tags).sort((a, b) => b[1] - a[1]).filter(x => x[1] >= 0.5).slice(0, 2).map(([t]) => (TAGL[t] || t).toLowerCase());
  return regs.join(', ') + (tags.length ? ` · paysages : ${tags.join(', ')}` : '');
}

// ---------------- appâts ----------------
// puissance d'attirance (0 à 1,4) : par nom exact d'objet, ou par sous-type de nourriture et de matériau
const NS_BAITS = {
  panda: { subs: { pomme: 1, fruit: 0.6 }, names: { 'Pousse de bambou': 1.4, 'Noisettes': 1, 'Myrtilles sauvages': 0.9 } },
  capy: { subs: { agrume: 1, legume: 0.5 }, names: { 'Nénuphar': 1.1, 'Roseau': 1, 'Clémentine': 1.2 } },
  axo: { subs: { mer: 0.6 }, names: { 'Crevettes grises': 1.2, 'Perche grillée': 1, 'Écaille de brochet': 1, 'Truite arc-en-ciel': 1.4, 'Nénuphar': 0.6 } },
  renard: { subs: { fromage: 1 }, names: { 'Saumon fumé': 1.4, 'Lichen des rennes': 1.2, 'Gruyère': 1.2 } },
  fennec: { subs: { sucre: 0.5 }, names: { 'Dattes': 1.4, 'Datte du souk': 1.4, 'Figue de barbarie': 1.2, 'Loukoum à la rose': 1 } },
  tanuki: { subs: { boisson: 1, pain: 0.8, plat: 0.6 }, names: { 'Thé matcha': 1.4, 'Mochi': 1.2, 'Thé au jasmin': 1.2 } },
  paresseux: { subs: { legume: 0.6 }, names: { 'Mangue': 1.2, 'Ananas': 1, 'Noix de coco': 1, 'Fruit de la passion': 1.4, 'Mangue de Casamance': 1.2, 'Fruit du dragon': 1.2, 'Feuille de palmier': 1, 'Hamac tressé': 1 } },
  lemur: { subs: { fruit: 1, agrume: 0.6 }, names: { 'Litchi': 1.4, 'Gousse de vanille': 1.2 } },
  phoque: { subs: { mer: 1 }, names: { 'Saumon fumé': 1.2, 'Sardines du port': 1.4, 'Crevettes grises': 1 } },
  quokka: { subs: { feuille: 0.6, pomme: 0.6 }, names: { 'Feuille d’eucalyptus': 1.4, 'Noix de macadamia': 1.2, 'Pomme du verger': 1 } },
};
const NS_BAIT_HINT = { panda: 'pommes, noisettes, pousses de bambou', capy: 'agrumes, nénuphars', axo: 'crevettes, petits poissons d’eau douce', renard: 'fromage, saumon fumé', fennec: 'dattes, figues, douceurs', tanuki: 'thé, pain, mochi', paresseux: 'fruits tropicaux, feuilles de palmier', lemur: 'fruits, litchis, vanille', phoque: 'poisson, sardines, fruits de mer', quokka: 'feuilles d’eucalyptus, pommes' };
function nsBaitPower(it, sp) {
  const B = NS_BAITS[sp]; if (!B || !it) return 0;
  const byName = B.names[it.name] || B.names[String(it.name || '').replace(/ \(chef-d’œuvre\)$/, '')] || 0;
  const bySub = (it.cat === 'n' || it.cat === 'm') ? (B.subs[it.sub] || 0) : 0;
  return Math.max(byName, bySub);
}
function nsBaitSps(it) { return SP_IDS.filter(sp => nsBaitPower(it, sp) >= 0.6).sort((a, b) => nsBaitPower(it, b) - nsBaitPower(it, a)); }
// les appâts du sac, groupés par nom : [{ name, it, n, sps }]
function nsBaitsInBag() {
  const g = new Map();
  for (const it of S.inv) { const sps = nsBaitSps(it); if (!sps.length) continue; const e = g.get(it.name); if (e) e.n++; else g.set(it.name, { name: it.name, it, n: 1, sps }); }
  return [...g.values()].sort((a, b) => nsBaitPower(b.it, b.sps[0]) - nsBaitPower(a.it, a.sps[0]));
}

// ---------------- habitats du refuge ----------------
const NS_HABS = [
  { id: 'prairie', name: 'Prairie du refuge', short: 'Prairie', sps: null, color: '#a7cf7a', desc: 'Un coin d’herbe tendre pour les nouveaux venus de toutes les espèces.', lv: [{ cap: 2 }] },
  { id: 'bambou', name: 'Forêt de bambous', short: 'Bambous', sps: ['panda', 'tanuki'], color: '#7cbf6a', desc: 'Des tiges qui chantent dans le vent et des feuilles à grignoter.',
    lv: [{ cap: 2, cost: [['bois', 2], ['feuille', 2]], coins: 40 }, { cap: 4, cost: [['bois', 4], ['graine', 2]], coins: 120 }, { cap: 6, cost: [['bois', 6], ['pierre', 3], ['feuille', 4]], coins: 300 }] },
  { id: 'bassin', name: 'Bassin aux nénuphars', short: 'Bassin', sps: ['axo', 'capy'], color: '#6fb8d9', desc: 'Une eau claire et tiède, des galets chauds pour la sieste.',
    lv: [{ cap: 2, cost: [['pierre', 2], ['coquillage', 1]], coins: 40 }, { cap: 4, cost: [['pierre', 4], ['verre', 2]], coins: 120 }, { cap: 6, cost: [['pierre', 6], ['coquillage', 4], ['feuille', 3]], coins: 300 }] },
  { id: 'banquise', name: 'Petite banquise', short: 'Banquise', sps: ['renard', 'phoque'], color: '#9fcbe6', desc: 'De la neige fraîche toute l’année et un bassin glacé pour plonger.',
    lv: [{ cap: 2, cost: [['cristal', 2], ['pierre', 1]], coins: 50 }, { cap: 4, cost: [['cristal', 3], ['laine', 2]], coins: 140 }, { cap: 6, cost: [['cristal', 5], ['flocon', 1], ['laine', 3]], coins: 320 }] },
  { id: 'dune', name: 'Dune dorée', short: 'Dune', sps: ['fennec'], color: '#e9c27a', desc: 'Du sable chaud, une oasis et des terriers frais pour la sieste.',
    lv: [{ cap: 2, cost: [['sable', 3]], coins: 40 }, { cap: 4, cost: [['sable', 4], ['pierre', 2]], coins: 120 }, { cap: 6, cost: [['sable', 6], ['verre', 2], ['feuille', 2]], coins: 300 }] },
  { id: 'jungle', name: 'Jungle', short: 'Jungle', sps: ['paresseux', 'lemur', 'quokka'], color: '#5fa86a', desc: 'Lianes, grandes feuilles et fruits sucrés tout en haut des arbres.',
    lv: [{ cap: 2, cost: [['feuille', 3], ['bois', 1]], coins: 40 }, { cap: 4, cost: [['feuille', 4], ['graine', 3]], coins: 120 }, { cap: 6, cost: [['bois', 5], ['feuille', 6], ['fruit', 2]], coins: 300 }] },
];
const NS_HAB = Object.fromEntries(NS_HABS.map(h => [h.id, h]));
const NS_COUV = [{ slots: 1, f: 0.5 }, { slots: 2, f: 0.45, cost: [['verre', 2], ['plume', 2]], coins: 80 }, { slots: 3, f: 0.4, cost: [['verre', 3], ['laine', 3], ['lumiere', 1]], coins: 200 }];
const NS_ENCLOS = [null, { delay: 20 * 60e3, cool: 3 * 3600e3, cost: [['bois', 3], ['pierre', 2]], coins: 100 }, { delay: 10 * 60e3, cool: 2 * 3600e3, cost: [['bois', 5], ['metal', 2]], coins: 250 }];
const NS_HATCH_MIN = [10, 30, 90, 240, 480]; // temps d'éclosion par rareté (hors couveuse)
const nsHabOf = sp => (NS_HABS.find(h => h.sps && h.sps.includes(sp)) || {}).id || null;
const nsHabLvl = id => id === 'prairie' ? 1 : (nsState().hab[id] || 0);
const nsCap = id => { const l = nsHabLvl(id); return l ? NS_HAB[id].lv[l - 1].cap : 0; };
// répartition des pensionnaires (hors équipe) : leur habitat s'il a de la place, sinon la prairie, sinon la tente
function nsLayout() {
  const team = teamIds(), by = Object.fromEntries(NS_HABS.map(h => [h.id, []])), tent = [], where = {};
  const rest = compIds().filter(k => !team.includes(k) && S.comps[k]).sort((a, b) => (S.comps[a].born || 0) - (S.comps[b].born || 0));
  for (const k of rest) {
    const h = nsHabOf(S.comps[k].sp);
    if (h && by[h].length < nsCap(h)) { by[h].push(k); where[k] = h; }
    else if (by.prairie.length < nsCap('prairie')) { by.prairie.push(k); where[k] = 'prairie'; }
    else { tent.push(k); where[k] = 'tente'; }
  }
  return { by, tent, where, team };
}
// y a-t-il de la place pour un nouveau compagnon de cette espèce (sp inconnue : n'importe quelle place) ?
function nsRoomFor(sp) {
  if (teamIds().length < 3) return true;
  const L = nsLayout();
  if (L.by.prairie.length < nsCap('prairie')) return true;
  if (sp) { const h = nsHabOf(sp); return !!h && L.by[h].length < nsCap(h); }
  return NS_HABS.some(h => h.id !== 'prairie' && L.by[h.id].length < nsCap(h.id));
}
function nsRoomText(sp) {
  const h = sp ? NS_HAB[nsHabOf(sp)] : null;
  return h ? (nsHabLvl(h.id) ? `Plus de place au refuge : agrandissez « ${h.name} » au village.` : `Plus de place au refuge : construisez « ${h.name} » au village.`) : 'Plus de place au refuge : construisez un habitat au village.';
}

// ---------------- payer des matériaux (mêmes règles que les bâtiments du village) ----------------
const nsCanPay = (cost, c) => (cost || []).every(([k, n]) => ING[k] && ingCount(k) >= n) && S.coins >= (c || 0);
function nsPay(cost, c) {
  if (!nsCanPay(cost, c)) return false;
  for (const [key, n] of cost || []) {
    const subs = ING[key][0];
    const cands = S.inv.filter(i => subs.includes(i.sub) && (i.cat === 'm' || i.cat === 'n')).sort((a, b) => (a.rid ? 1 : 0) - (b.rid ? 1 : 0) || a.rarity - b.rarity);
    cands.slice(0, n).forEach(x => S.inv.splice(S.inv.indexOf(x), 1));
  }
  S.coins -= c || 0;
  return true;
}
const nsCostHTML = (cost, c) => `<ul class="nscost">${(cost || []).map(([k, n]) => { const have = ING[k] ? ingCount(k) : 0; return `<li class="${have >= n ? 'ok' : ''}">${ING[k] ? esc(ING[k][1]) : k} <b>${Math.min(have, n)}/${n}</b></li>`; }).join('')}${c ? `<li class="${S.coins >= c ? 'ok' : ''}">${coins(c)}</li>` : ''}</ul>`;

// ---------------- dessins ----------------
const NSL = '#5b4636';
const nsLook = (sp, genes, hybrid) => ({ sp, genes: genes || defaultGenes(sp), hybrid: hybrid || null });
const _nsPort = {};
function nsPortrait(sp, genes, hybrid, mood) {
  const key = JSON.stringify([sp, genes, hybrid, mood]);
  if (!_nsPort[key]) { try { _nsPort[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawChar(nsLook(sp, genes, hybrid), NO_OUTFIT, mood || 'content', 'np' + Object.keys(_nsPort).length).replace('<svg ', '<svg width="320" height="350" ')); } catch (e) { _nsPort[key] = ''; } }
  return _nsPort[key];
}
// l'œuf (dessin de l'agent ART) ; un œuf de croisement reste mystérieux jusqu'à l'éclosion
const nsEggArt = (e, crack, uid) => eggArt(e, crack, uid);
// décor de chaque habitat dans une case de 126 × 156
const NS_ART = {
  prairie: () => `<rect width="126" height="156" fill="#d3ecb3"/>${[[14, 30], [40, 18], [96, 26], [112, 54], [20, 120], [104, 132], [64, 146]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3" fill="${['#f39ab0', '#fff', '#f6c445', '#c9a0e0'][i % 4]}" stroke="${NSL}" stroke-width="1"/>`).join('')}
    <g transform="translate(28 22)"><path d="M0 34 V14 L24 -2 L48 14 V34Z" fill="#fff3e2" stroke="${NSL}" stroke-width="2" stroke-linejoin="round"/><path d="M-4 16 L24 -4 L52 16" fill="none" stroke="#d9604f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 34 V22 a6 6 0 0 1 12 0 V34Z" fill="#c98a5a" stroke="${NSL}" stroke-width="1.6"/><path d="M24 14 c-4 -3 -4 -7 -1.4 -7 c1 0 1.4 .8 1.4 1.4 c0 -.6 .4 -1.4 1.4 -1.4 c2.6 0 2.6 4 -1.4 7Z" fill="#f08aa6" stroke="${NSL}" stroke-width="1"/></g>
    <path d="M4 66 H122" stroke="#e7cf9f" stroke-width="2" stroke-dasharray="2 5"/>${[8, 30, 96, 118].map(x => `<rect x="${x - 2}" y="58" width="4" height="12" rx="1" fill="#f3e3c3" stroke="${NSL}" stroke-width="1.2"/>`).join('')}<path d="M6 62 H120" stroke="#f3e3c3" stroke-width="2.4"/>`,
  bambou: () => `<rect width="126" height="156" fill="#cfe8b0"/><ellipse cx="88" cy="40" rx="30" ry="10" fill="#bfe0a0"/>${[[8, 0.9], [22, 1], [36, 0.8], [96, 0.95], [112, 1]].map(([x, s]) => `<g transform="translate(${x} 0)"><rect x="-3.5" y="${8 + (1 - s) * 30}" width="7" height="${70 * s}" rx="3" fill="#8fc46a" stroke="${NSL}" stroke-width="1.4"/>${[0, 1, 2].map(i => `<path d="M-3.5 ${30 + i * 18 + (1 - s) * 30} h7" stroke="${NSL}" stroke-width="1.2"/>`).join('')}<path d="M3 ${22 + (1 - s) * 30} q10 -6 14 -2 q-6 6 -14 2Z M-3 ${44 + (1 - s) * 30} q-10 -6 -14 -2 q6 6 14 2Z" fill="#6faf4f" stroke="${NSL}" stroke-width="1"/></g>`).join('')}
    <ellipse cx="66" cy="62" rx="14" ry="6" fill="#a9b4bc" stroke="${NSL}" stroke-width="1.4"/><path d="M50 64 q-2 -12 6 -14 M54 64 q2 -10 8 -10" stroke="#5f9f3f" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  bassin: () => `<rect width="126" height="156" fill="#cfe8b0"/><ellipse cx="66" cy="40" rx="54" ry="30" fill="#8fd0ea" stroke="${NSL}" stroke-width="2"/><path d="M30 38 q6 -4 12 0 M74 48 q6 -4 12 0 M56 26 q5 -3 10 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>${[[40, 46, 8], [92, 32, 7], [70, 56, 6]].map(([x, y, r]) => `<path d="M${x} ${y} m${r} 0 a${r} ${r * 0.6} 0 1 1 -2 -${r * 0.4} L${x} ${y}Z" fill="#7cc28a" stroke="${NSL}" stroke-width="1.2"/>`).join('')}<circle cx="93" cy="31" r="3" fill="#f6a6c1" stroke="${NSL}" stroke-width="1"/>
    ${[[8, 14], [118, 20], [12, 56]].map(([x, y]) => `<path d="M${x} ${y + 18} V${y} M${x + 4} ${y + 18} V${y + 4}" stroke="#7aa24a" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="${x}" cy="${y}" rx="2" ry="5" fill="#a8774f"/>`).join('')}${[[24, 70], [100, 68], [112, 76]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#c9c2b6" stroke="${NSL}" stroke-width="1.2"/>`).join('')}`,
  banquise: () => `<rect width="126" height="156" fill="#eaf4fb"/><path d="M0 46 Q30 34 63 44 T126 40 V0 H0Z" fill="#a9d6ee"/><path d="M8 30 l18 -6 l14 4 l-6 8 l-22 2Z M78 22 l20 -4 l16 6 l-10 7 l-20 0Z" fill="#fff" stroke="#7fa8c8" stroke-width="1.4" stroke-linejoin="round"/>
    <g transform="translate(92 54)"><path d="M-18 12 a18 16 0 0 1 36 0Z" fill="#fff" stroke="#7fa8c8" stroke-width="1.6"/><path d="M-12 2 h24 M-16 8 h32 M-6 -4 v6 M6 -4 v6 M-10 2 v6 M0 2 v6 M10 2 v6" stroke="#bcd4e6" stroke-width="1"/><path d="M-5 12 V6 a5 5 0 0 1 10 0 V12Z" fill="#7fa8c8"/></g>${[[16, 70], [40, 58], [60, 80], [110, 92]].map(([x, y]) => `<g fill="#fff" stroke="#9fc0da" stroke-width="1"><circle cx="${x}" cy="${y}" r="2"/></g>`).join('')}`,
  dune: () => `<rect width="126" height="156" fill="#f7e6bb"/><path d="M0 40 Q30 18 62 36 T126 30 V0 H0Z" fill="#bfe1f2"/><circle cx="108" cy="14" r="7" fill="#fbd76a"/><path d="M0 50 Q32 30 66 48 T126 44" fill="none" stroke="#e9c27a" stroke-width="5" stroke-linecap="round"/><path d="M0 76 Q40 60 80 76 T126 74" fill="none" stroke="#efd08e" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(18 36)"><path d="M-4 30 V4 a4 4 0 0 1 8 0 V30Z M-4 18 H-9 a3 3 0 0 1 -3 -3 V9 a2.4 2.4 0 0 1 4.8 0 V13 H-4Z M4 14 H9 V7 a2.4 2.4 0 0 1 4.8 0 V13 a4 4 0 0 1 -4 4 H4Z" fill="#7fae4f" stroke="${NSL}" stroke-width="1.4"/><circle cx="0" cy="2" r="2" fill="#f39ab0"/></g>
    <ellipse cx="94" cy="62" rx="20" ry="6" fill="#8fd0ea" stroke="${NSL}" stroke-width="1.4"/><path d="M98 60 C97 50 98 42 101 34" stroke="#a87a50" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M101 34 c-8 -6 -14 -3 -16 1 c6 -2 11 -1 16 -1Z M101 34 c6 -7 13 -6 15 -2 c-6 -1 -10 0 -15 2Z M101 34 c-2 -8 2 -10 7 -10 c-4 2 -6 5 -7 10Z" fill="#6faf4f" stroke="${NSL}" stroke-width="1"/>`,
  jungle: () => `<rect width="126" height="156" fill="#b9dfa0"/><path d="M14 0 V70 M112 0 V64" stroke="#8a6448" stroke-width="7"/><path d="M14 0 V70 M112 0 V64" stroke="#a87a50" stroke-width="4"/>
    ${[[14, 8, -20], [14, 30, 200], [112, 12, 200], [112, 36, -20]].map(([x, y, r]) => `<path d="M${x} ${y} q18 -10 30 4 q-16 10 -30 -4Z" fill="#5fa24f" stroke="${NSL}" stroke-width="1.2" transform="rotate(${r} ${x} ${y})"/>`).join('')}<path d="M14 20 Q63 52 112 22" fill="none" stroke="#6f9a3f" stroke-width="2.4"/>${[30, 46, 62, 78, 94].map((x, i) => `<path d="M${x} ${28 + Math.sin(i) * 6} v${10 + i % 3 * 5}" stroke="#6f9a3f" stroke-width="1.6"/><circle cx="${x}" cy="${40 + Math.sin(i) * 6 + i % 3 * 5}" r="2.6" fill="${['#f39ab0', '#f6c445', '#e5584f'][i % 3]}" stroke="${NSL}" stroke-width=".8"/>`).join('')}
    <path d="M44 74 q-6 -18 4 -22 q2 12 -4 22Z M84 74 q6 -18 -4 -22 q-2 12 4 22Z" fill="#4f9a4f" stroke="${NSL}" stroke-width="1.1"/>`,
};
// petit pictogramme d'habitat (onglets, listes)
const NS_HAB_ICON = {
  prairie: '<path d="M4 20 H20" stroke="#5fa274" stroke-width="2.4" stroke-linecap="round"/><path d="M7 20 q0 -6 -3 -9 M12 20 q0 -8 0 -12 M17 20 q0 -6 3 -9" stroke="#5fa274" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12" cy="7" r="2.4" fill="#f39ab0"/>',
  bambou: '<rect x="6" y="3" width="4" height="18" rx="2" fill="#8fc46a" stroke="currentColor" stroke-width="1.2"/><rect x="14" y="5" width="4" height="16" rx="2" fill="#8fc46a" stroke="currentColor" stroke-width="1.2"/><path d="M6 9 h4 M6 15 h4 M14 11 h4 M14 16 h4" stroke="currentColor" stroke-width="1"/><path d="M10 7 q5 -3 7 -1 q-3 3 -7 1Z" fill="#5f9f3f"/>',
  bassin: '<ellipse cx="12" cy="14" rx="9" ry="5.5" fill="#8fd0ea" stroke="currentColor" stroke-width="1.4"/><path d="M10 13 a3 2 0 1 1 3 1.4 L10 13Z" fill="#7cc28a" stroke="currentColor" stroke-width="1"/><circle cx="15.5" cy="11.5" r="1.6" fill="#f6a6c1"/>',
  banquise: '<path d="M3 17 L8 10 L12 13 L16 7 L21 17Z" fill="#fff" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 19 H22" stroke="#7fb8d8" stroke-width="2.4" stroke-linecap="round"/>',
  dune: '<circle cx="17" cy="6" r="3" fill="#fbd76a"/><path d="M2 18 Q7 10 12 15 T22 14 V20 H2Z" fill="#f0cf8a" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
  jungle: '<path d="M12 21 V10" stroke="#8a6448" stroke-width="2.4"/><path d="M12 11 q-8 -6 -9 2 q6 -2 9 -2Z M12 11 q8 -6 9 2 q-6 -2 -9 -2Z M12 10 q-2 -8 4 -8 q-1 4 -4 8Z" fill="#5fa24f" stroke="currentColor" stroke-width="1"/>',
};
const nsHabIco = id => `<svg viewBox="0 0 24 24" aria-hidden="true">${NS_HAB_ICON[id] || ''}</svg>`;
// la couveuse : un dôme de verre chauffé par une lampe ; l'enclos : une barrière en cœur
const NS_COUV_ART = lvl => `<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="60" cy="94" rx="48" ry="5" fill="#3d5a2a" opacity=".14"/><rect x="14" y="70" width="92" height="22" rx="6" fill="#e9b07a" stroke="${NSL}" stroke-width="2.4"/><path d="M20 81 H100" stroke="#c98a5a" stroke-width="2"/><path d="M18 70 V48 a42 38 0 0 1 84 0 V70Z" fill="#dff2fb" fill-opacity=".75" stroke="${NSL}" stroke-width="2.4"/><path d="M30 46 a30 26 0 0 1 22 -22" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="54" y="2" width="12" height="9" rx="2" fill="#f6c445" stroke="${NSL}" stroke-width="2"/><circle cx="60" cy="16" r="6" fill="#fff3b0" stroke="${NSL}" stroke-width="1.6"/><g class="nsglow"><circle cx="60" cy="16" r="14" fill="#fff3b0" opacity=".35"/></g>${'★'.repeat(lvl).split('').map((_, i) => `<path d="${typeof starPath === 'function' ? starPath(30 + i * 10, 87, 3.4) : ''}" fill="#fff8ea" stroke="${NSL}" stroke-width=".8"/>`).join('')}</svg>`;
const NS_ENCLOS_ART = () => `<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="60" cy="92" rx="52" ry="6" fill="#3d5a2a" opacity=".14"/><ellipse cx="60" cy="72" rx="52" ry="18" fill="#cfe8b0" stroke="${NSL}" stroke-width="2"/>${[14, 30, 46, 74, 90, 106].map(x => `<rect x="${x - 3}" y="${56 + Math.abs(60 - x) * 0.18}" width="6" height="22" rx="2" fill="#f3e3c3" stroke="${NSL}" stroke-width="1.5"/>`).join('')}<path d="M10 64 Q60 52 110 64" stroke="#f3e3c3" stroke-width="4" fill="none"/><path d="M10 64 Q60 52 110 64" stroke="${NSL}" stroke-width="1" fill="none" opacity=".5"/><path d="M60 46 C40 30 44 12 56 14 C60 15 60 19 60 21 C60 19 61 15 65 14 C77 12 80 30 60 46Z" fill="#f08aa6" stroke="${NSL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M52 22 q2 -4 6 -3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

// ---------------- les œufs ----------------
function nsHatchMs(rarity) { return NS_HATCH_MIN[Math.max(0, Math.min(4, rarity | 0))] * 60e3; }
// crée un œuf (via addEgg de 20_collection.js), connu ou mystère, puis le met au chaud s'il reste une place
function nsAddEgg(o) {
  const id = addEgg({ sp: o.sp, genes: o.genes, rarity: o.rarity, hybrid: o.hybrid, from: o.from, hatchMs: o.ms });
  const e = S.eggs.find(x => x.id === id);
  if (e) { e.ms = o.ms; e.known = o.known !== false; if (o.parents) e.parents = o.parents; }
  nsCouvFill(); save();
  return e;
}
// un œuf d'une espèce donnée (ou d'une espèce pas encore vue) : récompenses de rêve, de quête, de palier
function nsGiftEgg(how, place, opt = {}) {
  const N = nsState();
  let sp = opt.sp;
  if (!sp) { const unseen = SP_IDS.filter(x => !N.own[x] && !(opt.not || []).includes(x)); sp = pick(unseen.length ? unseen : SP_IDS.filter(x => !(opt.not || []).includes(x))); }
  const genes = rollGenes(sp, opt.luck || 0.6), rarity = geneRarityOf(genes, sp);
  N.seen[sp] = 1;
  return nsAddEgg({ sp, genes, rarity, from: { how, place }, ms: nsHatchMs(Math.min(rarity, opt.maxR == null ? 4 : opt.maxR)) });
}
// couveuse : les œufs qui attendent y entrent dès qu'une place se libère, et éclosent alors plus vite
const nsCouvSlots = () => NS_COUV[Math.min(3, nsState().couv) - 1].slots;
const nsInCouv = () => S.eggs.filter(e => e && e.inc && e.ready > Date.now());
function nsCouvFill() {
  const now = Date.now(), f = NS_COUV[Math.min(3, nsState().couv) - 1].f;
  let free = nsCouvSlots() - nsInCouv().length;
  for (const e of S.eggs.filter(x => x && !x.inc && x.ready > now).sort((a, b) => a.got - b.got)) {
    if (free <= 0) break;
    e.inc = now; e.ready = now + Math.max(0, e.ready - now) * f; free--;
  }
}
// réchauffer un œuf avec un objet (kind 'eclore') : laine ou plume = 2× plus vite ; lumière = éclosion immédiate
const NS_ECLORE = [{ subs: ['lumiere', 'lune'], f: 0, txt: 'Nurserie : fait éclore un œuf tout de suite' }, { subs: ['laine', 'plume'], f: 0.5, txt: 'Nurserie : réchauffe un œuf (éclosion 2× plus rapide)' }];
const nsWarmDef = it => it && (it.cat === 'm' || it.cat === 'n') ? NS_ECLORE.find(w => w.subs.includes(it.sub)) : null;
function nsWarmItems() { // le moins précieux d'abord, un par effet
  const out = [];
  for (const w of NS_ECLORE) { const it = S.inv.filter(i => (i.cat === 'm' || i.cat === 'n') && w.subs.includes(i.sub)).sort((a, b) => a.rarity - b.rarity || (a.rid ? 1 : 0) - (b.rid ? 1 : 0))[0]; if (it) out.push({ it, w }); }
  return out;
}
function nsWarm(eggId, itemId) {
  const e = S.eggs.find(x => x.id === eggId), it = S.inv.find(i => i.id === itemId), w = nsWarmDef(it), now = Date.now();
  if (!e || !it || !w || e.ready <= now || (w.f && e.warm)) return false;
  S.inv.splice(S.inv.indexOf(it), 1);
  e.ready = now + Math.max(0, e.ready - now) * w.f; if (w.f) e.warm = 1;
  save(); renderAll();
  toast(w.f ? `L’œuf est bien au chaud sous « ${it.name} » : il éclora deux fois plus vite.` : `« ${it.name} » illumine l’œuf… il remue déjà !`);
  return true;
}
const nsEggLabel = e => e.known && e.sp ? `Œuf de ${nsLow(e.sp)}` : e.from && e.from.how === 'croisement' ? 'Œuf du croisement' : 'Œuf mystère';

// ---------------- 1. œufs trouvés en voyage ----------------
const NS_EGG_P = { eclair: 0.12, court: 0.22, moyen: 0.32, long: 0.45, expe: 0.6 };
function nsTripEgg(e) {
  const N = nsState(), t = e.trip; if (!t || !t.dest) return null;
  if (S.eggs.length >= 8) return null; // le nid est plein : on fait d'abord éclore
  const dest = t.dest, baitSps = t.bait ? t.bait.sps : null, trips = (S.stats && S.stats.trips) || 0;
  let p = NS_EGG_P[t.dur] != null ? NS_EGG_P[t.dur] : 0.2;
  if (t.nsFirst) p += 0.15;                  // première visite dans cette région
  if (baitSps && baitSps.length) p += 0.2;   // un appât dans le sac
  p += Math.min(0.25, N.dry * 0.05);         // un peu de chance en plus à chaque voyage sans œuf
  if (!N.found) p = 1; // le premier œuf est garanti dès le premier retour de voyage
  if (Math.random() >= p) { N.dry++; return null; }
  N.dry = 0; N.found++;
  const sp = nsPickSp(dest, baitSps), luck = ((DURS.find(x => x.key === t.dur) || {}).luck || 0) * 0.4 + (baitSps && baitSps.includes(sp) ? 0.4 : 0);
  const genes = N.found === 1 ? defaultGenes(sp) : rollGenes(sp, luck), rarity = geneRarityOf(genes, sp);
  N.seen[sp] = 1;
  const R = nsRegionOf(dest);
  return nsAddEgg({ sp, genes, rarity, from: { how: 'oeuf', region: R ? R.id : null, place: dest.name }, ms: nsHatchMs(rarity) });
}
function nsEggFoundHTML(egg) {
  const inC = egg.inc && egg.ready > Date.now(), R = egg.from && egg.from.region && typeof RG !== 'undefined' ? RG[egg.from.region] : null;
  const first = nsState().found === 1;
  return `<div class="nsfind"><span class="nsfe">${nsEggArt(egg, 0, 'nf' + egg.id)}</span><div><span class="nsfk">Trouvé en chemin !</span><b>${esc(nsEggLabel(egg))}</b><span>${R ? `${esc(R.short)} · ` : ''}${inC ? `Il est au chaud dans la couveuse : éclosion dans ${fmtDur(egg.ready - Date.now())}.` : `Il attend une place dans la couveuse (${fmtDur(egg.ready - Date.now())}).`}</span>${first ? `<em>Les œufs se trouvent en voyage : plus le voyage est long, plus il y a de chances. Chaque région a ses espèces !</em>` : ''}</div><button class="btn gold sm" data-ns-go="nurserie">Nurserie</button></div>`;
}

// ---------------- 2. rencontres en chemin ----------------
// au départ : une chance sur six environ, plus dans le bon habitat ou avec un appât ; l'événement arrive tard dans le voyage
function nsPlanWild(t) {
  const N = nsState(), sc = nsScores(t.dest, t.bait ? t.bait.sps : null), best = Math.max(...sc.map(x => x.w));
  let p = 0.17;
  if (best >= 1) p = 0.24;                       // le lieu est l'habitat d'une espèce
  if (t.bait && t.bait.sps.length) p += 0.12;
  if (!N.wild && ((S.stats && S.stats.trips) || 0) >= 3) p = 1; // la première rencontre arrive vite
  if (Math.random() >= p) return;
  const last = Math.max(0.5, ...t.events.filter(e => e.at < 0.95).map(e => e.at));
  t.events.push({ at: Math.min(0.94, (last + 0.97) / 2), type: 'sauvage' });
  t.events.sort((a, b) => a.at - b.at);
}
function nsFireWild(t, e) {
  const N = nsState(), k = t.comp, n = CHARS[k].name, place = eventPlace(t, e), now = Date.now();
  const sp = nsPickSp(t.dest, t.bait ? t.bait.sps : null); // l'espèce de la destination : le voyageur la ramène dans ses souvenirs
  const genes = rollGenes(sp, 0.4), rarity = geneRarityOf(genes, sp);
  N.seen[sp] = 1; N.wild++;
  const pal = rarity >= 2 ? genesText({ sp, genes }) : '';
  const R = nsRegionOf(t.dest);
  t.journal.push({ t: now, place: t.dest.name, tags: place.tags || ['campagne'], kind: 'sauvage', sp, genes, rarity, region: R ? R.id : null, pending: true,
    text: `Un ${nsLow(sp)} sauvage${pal ? ` aux couleurs rares (${pal.split(' · ')[0]})` : ''} observe ${n}… Il a l’air curieux. Peut-être qu’un petit cadeau l’apprivoiserait ?` });
  S.unseen[k] = (S.unseen[k] || 0) + 1;
}
// chances d'apprivoiser avec un objet (appât, plat adoré…) ; sans objet : une caresse, rarement suffisante
function nsTameChance(sp, it, src) {
  if (!it) return 0.12;
  const b = nsBaitPower(it, sp), T = FOOD_TASTE[sp] || FOOD_TASTE.def;
  let p = b > 0 ? 0.35 + 0.4 * b : it.cat === 'n' ? (T.love.includes(it.sub) ? 0.6 : T.hate.includes(it.sub) ? 0.04 : 0.22) : 0.08;
  p += 0.04 * (it.rarity || 0); if (src === 'bait') p += 0.08;
  return Math.max(0.03, Math.min(0.95, p));
}
function nsTameOffers(t, j) {
  const cands = [];
  if (t.bait && t.bait.item) cands.push({ src: 'bait', it: t.bait.item });
  for (const it of t.bag) if (it.cat === 'n' || nsBaitPower(it, j.sp) > 0) cands.push({ src: 'bag', it });
  for (const it of S.inv) if (it.cat === 'n' || nsBaitPower(it, j.sp) > 0) cands.push({ src: 'inv', it });
  const seen = new Set(), out = [];
  cands.map(c => ({ ...c, p: nsTameChance(j.sp, c.it, c.src) })).sort((a, b) => b.p - a.p || a.it.rarity - b.it.rarity).forEach(c => { if (out.length < 3 && !seen.has(c.it.name) && c.p >= 0.2) { seen.add(c.it.name); out.push(c); } });
  return out;
}
function nsResolveTame(t, j, src, itemId, auto) {
  if (!t || !j || j.resolved) return;
  const k = t.comp, n = CHARS[k].name, N = nsState(), nm = nsLow(j.sp);
  let it = null;
  if (src === 'bait' && t.bait && t.bait.item) { it = t.bait.item; t.bait.item = null; }
  else if (src === 'bag') { it = t.bag.find(x => x.id === itemId); if (it) t.bag.splice(t.bag.indexOf(it), 1); }
  else if (src === 'inv') { it = S.inv.find(x => x.id === itemId); if (it) S.inv.splice(S.inv.indexOf(it), 1); }
  j.resolved = true; j.auto = !!auto;
  if (src === 'leave') { j.outcome = `${n} salue le ${nm}, qui retourne tranquillement se cacher.`; return; }
  if (!nsRoomFor(j.sp)) { j.outcome = `Le ${nm} voudrait bien suivre ${n}… mais le refuge est plein. ${nsRoomText(j.sp)}`; if (it) (src === 'inv' ? S.inv : t.bag).push(it); return; }
  const p = nsTameChance(j.sp, it, src), ok = Math.random() < p, what = it ? `« ${it.name} »` : 'une caresse';
  if (!auto) S.stats.choices = (S.stats.choices || 0) + 1;
  if (ok) {
    const id = addComp({ sp: j.sp, genes: j.genes, rarity: j.rarity, from: { how: 'rencontre', region: j.region, place: j.place } });
    N.tamed++; j.tamed = id;
    j.outcome = `${auto ? `${n} a décidé tout seul : ` : ''}${n} offre ${what}. Le ${nm} s’approche, renifle… et décide de le suivre ! ${CHARS[id].name} rejoint ${teamIds().includes(id) ? 'l’équipe' : 'le refuge'}.`;
  } else j.outcome = `${auto ? `${n} a décidé tout seul : ` : ''}${n} offre ${what}. Le ${nm} ${it ? 'le grignote' : 'ronronne un instant'}… puis file se cacher. Une autre fois !`;
}
function nsAutoTame(t, j) {
  if (t.bait && t.bait.item && nsBaitPower(t.bait.item, j.sp) > 0) return nsResolveTame(t, j, 'bait', null, true);
  // sans réponse du joueur (la rencontre arrive tard, souvent quelques secondes avant le retour) : le voyageur offre lui-même sa meilleure trouvaille du voyage
  if (nsRoomFor(j.sp)) { const o = nsTameOffers(t, j).find(x => x.src !== 'inv'); return nsResolveTame(t, j, o ? o.src : 'pet', o ? o.it.id : null, true); }
  j.resolved = true; j.auto = true; j.outcome = `Personne n’a répondu : le ${nsLow(j.sp)} s’éloigne doucement.`;
}
function nsWildHTML(t, j, i) {
  const time = new Date(j.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), k = t.comp;
  let h = `<article class="je k-sauvage"><header><span>${time}${j.place ? ' · ' + esc(j.place) : ''}</span>${j.pending && !j.resolved ? '<em class="need">À toi de choisir</em>' : ''}</header>`;
  h += `<div class="nswild"><span class="nswa r${j.rarity || 0}" style="--rc:${RARC[j.rarity || 0]}"><img src="${nsPortrait(j.sp, j.genes, null, j.resolved ? (j.tamed ? 'amour' : 'content') : 'curieux')}" alt="${esc(spName(j.sp))}"></span><div><span class="nswk">Rencontre sauvage · ${RARITY[j.rarity || 0]}</span><p>${esc(j.text)}</p></div></div>`;
  if (!j.resolved) {
    const room = nsRoomFor(j.sp), offs = nsTameOffers(t, j);
    if (!room) h += `<p class="nsnote">${esc(nsRoomText(j.sp))}</p>`;
    h += `<div class="opts nstame">${room ? offs.map(o => `<button data-ns-tame="${i}" data-k="${k}" data-src="${o.src}" data-id="${o.it.id}"><span class="nsti">${itemIcon(o.it)}</span><span class="nstx">Offrir « ${esc(o.it.name)} »<small>${o.src === 'bait' ? 'votre appât · ' : o.src === 'bag' ? 'trouvé en route · ' : ''}${Math.round(o.p * 100)} % de réussite</small></span></button>`).join('') + `<button data-ns-tame="${i}" data-k="${k}" data-src="pet"><span class="nstx">Une caresse<small>${Math.round(nsTameChance(j.sp) * 100)} % de réussite</small></span></button>` : ''}<button data-ns-tame="${i}" data-k="${k}" data-src="leave"><span class="nstx">Le laisser partir</span></button></div>`;
    if (room && !offs.length) h += `<p class="small">Il aime : ${esc(NS_BAIT_HINT[j.sp] || 'les bonnes choses')}. Emportez un appât la prochaine fois !</p>`;
  } else {
    h += `<p class="out">${esc(j.outcome || '')}</p>`;
    if (j.tamed && S.comps[j.tamed]) h += `<div class="nswon"><span class="nswp"><img src="${portraitURI(j.tamed, 'amour')}" alt=""></span><b>${esc(CHARS[j.tamed].name)}</b><button class="btn cream sm" data-ns-go="refuge">Voir le refuge</button></div>`;
  }
  return h + `</article>`;
}

// ---------------- 4. croisements ----------------
const nsCoolLeft = k => Math.max(0, (nsState().cool[k] || 0) - Date.now());
const nsCrossCost = (a, b) => (S.comps[a] && S.comps[b] && S.comps[a].sp === S.comps[b].sp ? 40 : 90);
let nsPickA = null, nsPickB = null;
function nsCanCross(a, b) {
  const N = nsState();
  if (!N.enclos || N.cross || !a || !b || a === b || !S.comps[a] || !S.comps[b]) return false;
  return !S.trips[a] && !S.trips[b] && !nsCoolLeft(a) && !nsCoolLeft(b);
}
function nsStartCross(pay) {
  const N = nsState(), a = nsPickA, b = nsPickB; if (!nsCanCross(a, b)) return false;
  if (pay === 'coins') { const c = nsCrossCost(a, b); if (S.coins < c) return false; S.coins -= c; }
  else { const food = S.inv.filter(i => i.cat === 'n').sort((x, y) => x.rarity - y.rarity || (x.rid ? 1 : 0) - (y.rid ? 1 : 0)); if (food.length < 3) return false; food.slice(0, 3).forEach(x => S.inv.splice(S.inv.indexOf(x), 1)); }
  const A = S.comps[a], B = S.comps[b], E = NS_ENCLOS[Math.min(2, N.enclos)];
  let res = null; try { res = mixGenes(A.genes, B.genes, A.sp, B.sp); } catch (e) { res = null; }
  if (!res || !res.sp) res = { sp: pick([A.sp, B.sp]), genes: rollGenes(pick([A.sp, B.sp]), 1), hybrid: null };
  const now = Date.now();
  N.cross = { a, b, names: [A.name, B.name], start: now, ready: now + E.delay, res };
  N.cool[a] = N.cool[b] = now + E.cool; N.crosses++;
  nsPickA = nsPickB = null;
  save(); renderAll();
  toast(`${A.name} et ${B.name} passent du temps ensemble à l’enclos… Un œuf arrive dans ${fmtDur(E.delay)} !`);
  return true;
}
function nsCrossTick() {
  const N = nsState(), c = N.cross; if (!c || c.ready > Date.now()) return false;
  const r = c.res, rarity = (() => { try { return Math.max(geneRarity(r.genes, r.sp, r.hybrid) || 0, r.hybrid ? 3 : 0); } catch (e) { return r.hybrid ? 3 : 1; } })();
  N.cross = null;
  nsAddEgg({ sp: r.sp, genes: r.genes, rarity, hybrid: r.hybrid, known: false, parents: c.names, from: { how: 'croisement', place: `${c.names[0]} × ${c.names[1]}` }, ms: nsHatchMs(Math.min(3, rarity)) });
  toast(`L’enclos des croisements : ${c.names[0]} et ${c.names[1]} ont un œuf ! Il est à la nurserie.`);
  return true;
}

// ---------------- 5. Compédium ----------------
function nsSee(c) {
  if (!c || !c.sp) return;
  const N = nsState(), g = c.genes || {};
  N.seen[c.sp] = 1; N.own[c.sp] = 1;
  const pal = typeof palOf === 'function' ? palOf(g, c.sp) : null;
  if (pal) N.pals[c.sp + ':' + pal.id] = 1;
  if (g.pattern && g.pattern !== 'uni') N.pats[g.pattern] = 1;
  if (g.eye && g.eye !== 'def') N.eyes[g.eye] = 1;
  if (g.special && g.special !== 'none') N.specs[g.special] = 1;
  if (c.hybrid && c.hybrid.a && c.hybrid.b) N.hyb[[c.hybrid.a, c.hybrid.b].sort().join('+')] = { a: c.hybrid.a, b: c.hybrid.b, t: c.hybrid.t || null, genes: g };
}
const nsSpCount = () => SP_IDS.filter(sp => nsState().own[sp]).length;
const nsPalCount = sp => Object.keys(nsState().pals).filter(x => !sp || x.startsWith(sp + ':')).length;
const nsPalTotal = sp => (typeof SPECIES !== 'undefined' && SPECIES[sp] ? SPECIES[sp].palettes.length : 0);
const nsHybCount = () => Object.keys(nsState().hyb).length;
const NS_TIERS = [
  { id: 't1', txt: '2 espèces adoptées', ok: () => nsSpCount() >= 2, rw: '100 pièces', give: () => gainCoins(100) },
  { id: 't2', txt: '4 espèces adoptées', ok: () => nsSpCount() >= 4, rw: 'un œuf d’une espèce inconnue', give: () => nsGiftEgg('quete', 'Compédium : 4 espèces', { luck: 0.6, maxR: 2 }) },
  { id: 't3', txt: '10 variantes de couleurs', ok: () => nsPalCount() >= 10, rw: '250 pièces', give: () => gainCoins(250) },
  { id: 't4', txt: '6 espèces adoptées', ok: () => nsSpCount() >= 6, rw: 'un œuf rare', give: () => nsGiftEgg('quete', 'Compédium : 6 espèces', { luck: 2.5 }) },
  { id: 't5', txt: 'Un premier hybride', ok: () => nsHybCount() >= 1, rw: '400 pièces et un trophée', give: () => { gainCoins(400); const it = makeItem(['Trophée du Compédium', 'd', 'statue', 3, null, '#c9a0e0'], 0, 'Compédium', [], { fixed: 3 }); S.inv.push(it); S.dex[it.name] = true; } },
  { id: 't6', txt: '20 variantes de couleurs', ok: () => nsPalCount() >= 20, rw: '600 pièces', give: () => gainCoins(600) },
  { id: 't7', txt: 'Les 10 espèces', ok: () => nsSpCount() >= 10, rw: 'un œuf légendaire et 1 000 pièces', give: () => { gainCoins(1000); nsGiftEgg('quete', 'Compédium complet', { luck: 5 }); } },
  { id: 't8', txt: '5 hybrides différents', ok: () => nsHybCount() >= 5, rw: '1 500 pièces et un trophée doré', give: () => { gainCoins(1500); const it = makeItem(['Trophée des hybrides', 'd', 'statue', 4, null, '#f2c14e'], 0, 'Compédium', [], { fixed: 4 }); S.inv.push(it); S.dex[it.name] = true; } },
];
const nsTierReady = () => NS_TIERS.filter(t => !nsState().tiers[t.id] && t.ok());
function nsClaimTier(id) {
  const t = NS_TIERS.find(x => x.id === id), N = nsState(); if (!t || N.tiers[id] || !t.ok()) return;
  N.tiers[id] = Date.now(); t.give(); save(); renderAll();
  toast(`Compédium : ${t.txt} ! Récompense : ${t.rw}.`);
  if (typeof confetti === 'function') { try { confetti(false); } catch (e) {} }
}

// ---------------- habitats : construire et agrandir ----------------
function nsUpgrade(kind) {
  const N = nsState();
  let lv, name, ok = false;
  if (kind === 'couv') { lv = NS_COUV[N.couv]; if (!lv || !nsPay(lv.cost, lv.coins)) return false; N.couv++; name = `La couveuse (${N.couv} places)`; ok = true; nsCouvFill(); }
  else if (kind === 'enclos') { lv = NS_ENCLOS[N.enclos + 1]; if (!lv || !nsPay(lv.cost, lv.coins)) return false; N.enclos++; name = N.enclos === 1 ? 'L’enclos des croisements' : 'L’enclos des croisements (plus rapide)'; ok = true; }
  else { const H = NS_HAB[kind]; if (!H || kind === 'prairie') return false; const cur = N.hab[kind] || 0; lv = H.lv[cur]; if (!lv || !nsPay(lv.cost, lv.coins)) return false; N.hab[kind] = cur + 1; name = `${H.name} (${lv.cap} places)`; ok = true; }
  if (!ok) return false;
  save();
  try { GAME.emit('habitat:built', { id: kind }); GAME.emit('building:built', { id: kind }); } catch (e) {}
  renderAll();
  toast(`${name} : c’est prêt !`);
  if (typeof confetti === 'function') { try { confetti(false); } catch (e) {} }
  return true;
}

// ================= AFFICHAGE : VILLAGE =================
// ---- Refuge : la vue vivante, les compagnons se promènent dans leurs habitats
const NS_ZONES = { bambou: [6, 6], prairie: [137, 6], bassin: [268, 6], banquise: [6, 170], dune: [137, 170], jungle: [268, 170] };
function nsSceneSVG() {
  const L = nsLayout(), night = isNight();
  let s = `<svg viewBox="0 0 400 332" xmlns="http://www.w3.org/2000/svg" class="nsscene" role="img" aria-label="Le refuge et ses habitats">`;
  s += `<defs>${Object.entries(NS_ZONES).map(([id, [x, y]]) => `<clipPath id="nsz${id}"><rect x="${x}" y="${y}" width="126" height="156" rx="18"/></clipPath>`).join('')}<pattern id="nsgr" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#bfe3a0"/><path d="M6 10 l2 -4 l2 4 M26 30 l2 -4 l2 4" stroke="#a6d388" stroke-width="1.6" fill="none"/></pattern></defs>`;
  s += `<rect width="400" height="332" rx="22" fill="url(#nsgr)"/><path d="M134 0 V332 M265 0 V332 M0 166 H400" stroke="#f3e1bb" stroke-width="8"/><path d="M134 0 V332 M265 0 V332 M0 166 H400" stroke="#e7cf9f" stroke-width="1.6" stroke-dasharray="3 7"/>`;
  for (const [id, [x, y]] of Object.entries(NS_ZONES)) {
    const H = NS_HAB[id], lvl = nsHabLvl(id), res = L.by[id] || [], cap = nsCap(id);
    s += `<g class="nszone ${lvl ? 'on' : 'off'}" data-ns-zone="${id}" role="button" tabindex="0" aria-label="${esc(H.name)} : ${lvl ? `${res.length} sur ${cap}` : 'à construire'}"><g clip-path="url(#nsz${id})"><g transform="translate(${x} ${y})"${lvl ? '' : ' opacity=".42"'}>${NS_ART[id]()}</g></g>`;
    s += `<rect x="${x}" y="${y}" width="126" height="156" rx="18" fill="none" stroke="${lvl ? NSL : '#b8996a'}" stroke-width="${lvl ? 2.4 : 2}"${lvl ? '' : ' stroke-dasharray="6 5"'}/>`;
    if (!lvl) {
      s += `<g transform="translate(${x + 63} ${y + 96})"><rect x="-50" y="-15" width="100" height="30" rx="15" fill="#fff8ea" stroke="${NSL}" stroke-width="2"/><text y="5" class="nst">À construire</text></g>`;
    } else {
      // les pensionnaires se promènent (3 par rangée, deux rangées)
      const walkers = id === 'prairie' ? [...res, ...L.team.filter(k => CHARS[k] && !S.trips[k])].slice(0, 6) : res.slice(0, 6);
      walkers.forEach((k, i) => {
        const row = Math.floor(i / 3), col = i % 3, w = 42, cx = x + 20 + col * 30 + (row ? 6 : 0) + (walkers.length === 1 ? 24 : 0), cy = y + (id === 'prairie' ? 112 : 104) + row * 40 - (walkers.length > 3 ? 18 : 0);
        const dx = 8 + ((i * 5) % 10), dur = 5 + ((i * 13) % 5), dl = -((i * 17) % 7);
        s += `<ellipse cx="${cx + dx / 2}" cy="${cy + 1}" rx="${w * 0.42 + dx / 2}" ry="4" fill="#3d5a2a" opacity=".1"/><g class="nsw" style="--dx:${dx}px;--dur:${dur}s;--dl:${dl}s"><g class="nsb" style="--dl:${dl / 3}s" data-hc="${k}">${drawChar(k, S.outfits[k], night ? 'dodo' : 'content', 'ns' + k).replace('<svg ', `<svg x="${cx - w / 2}" y="${cy - w * 1.1}" width="${w}" height="${w * 1.1}" `)}</g></g>`;
      });
      if (res.length > 6) s += `<text x="${x + 116}" y="${y + 150}" class="nst" text-anchor="end">+${res.length - 6}</text>`;
    }
    const lab = `${H.short}${lvl ? ` ${res.length}/${cap}` : ''}`, lw = lab.length * 6.2 + 14;
    s += `<rect x="${x + 6}" y="${y + 6}" width="${lw}" height="17" rx="8.5" fill="#fff8ea" stroke="${NSL}" stroke-width="1.6"/><text x="${x + 6 + lw / 2}" y="${y + 18.5}" class="nsl">${esc(lab)}</text></g>`;
  }
  // la tente : ceux qui attendent une place
  if (L.tent.length) {
    s += `<g transform="translate(200 300)"><path d="M-26 22 L0 -14 L26 22Z" fill="#f6c445" stroke="${NSL}" stroke-width="2" stroke-linejoin="round"/><path d="M0 -14 L-6 22 M0 -14 L6 22" stroke="${NSL}" stroke-width="1.4"/><text y="34" class="nsl">Tente : ${L.tent.length}</text></g>`;
  }
  if (night) s += `<rect width="400" height="332" rx="22" fill="#2f3d6b" opacity=".18" pointer-events="none"/>`;
  return s + `</svg>`;
}
function nsRenderRefuge(box) {
  const L = nsLayout(), N = nsState(), n = compIds().length - L.team.length, built = NS_HABS.filter(h => h.id !== 'prairie' && nsHabLvl(h.id)).length;
  const eggs = S.eggs.length, ready = readyEggs().length;
  let h = `<div class="nshead"><div><h2>Le refuge</h2><p>${n} pensionnaire${n > 1 ? 's' : ''} · ${built}/5 habitats · l’équipe (${L.team.length}/3) vit à la maison.</p></div><button class="btn cream sm" data-ns-team="1">Équipe</button></div>`;
  if (eggs) h += `<button class="nsbanner${ready ? ' hot' : ''}" data-ns-go="nurserie"><span class="nsbe">${nsEggArt(S.eggs[0], ready ? 1 : 0, 'rfb')}</span><span><b>${ready ? `${ready} œuf${ready > 1 ? 's' : ''} prêt${ready > 1 ? 's' : ''} à éclore !` : `${eggs} œuf${eggs > 1 ? 's' : ''} à la nurserie`}</b><small>${ready ? 'Touchez pour les faire éclore' : 'Ils grandissent au chaud'}</small></span></button>`;
  h += `<div class="nsbox">${nsSceneSVG()}</div>`;
  h += `<p class="nshint">Touchez un compagnon pour le caresser, ou un habitat pour l’agrandir. Chaque habitat accueille un nombre limité de pensionnaires.</p>`;
  if (L.tent.length) h += `<p class="nsnote">${L.tent.map(k => esc(CHARS[k] ? CHARS[k].name : '')).join(', ')} ${L.tent.length > 1 ? 'dorment' : 'dort'} sous la tente : ${esc(nsRoomText(S.comps[L.tent[0]].sp).replace('Plus de place au refuge : ', '').replace(/^./, c => c.toUpperCase()))}</p>`;
  h += `<div class="nsres">` + NS_HABS.filter(H => nsHabLvl(H.id) || (L.by[H.id] || []).length).map(H => { const r = L.by[H.id]; return `<div class="nsrr"><span class="nsri" style="--hc:${H.color}">${nsHabIco(H.id)}</span><div class="nsrx"><b>${esc(H.name)} <small>${r.length}/${nsCap(H.id)}</small></b><span class="nsfaces">${r.length ? r.map(k => `<button class="nsface" data-comp-info="${k}" title="${esc(CHARS[k].name)}"><img src="${portraitURI(k)}" alt="${esc(CHARS[k].name)}"></button>`).join('') : '<i>Personne pour l’instant</i>'}</span></div></div>`; }).join('') + `</div>`;
  box.innerHTML = h;
}
// ---- Nurserie : couveuse, œufs, enclos des croisements
function nsEggCard(e) {
  const now = Date.now(), ok = e.ready <= now, inC = e.inc && !ok, warm = nsWarmItems().filter(x => !(x.w.f && e.warm));
  const total = e.ms || nsHatchMs(e.rarity || 0), left = Math.max(0, e.ready - now), f = ok ? 1 : Math.max(0.04, Math.min(0.97, 1 - left / Math.max(total, left + 1)));
  const room = ok ? nsRoomFor(e.known ? e.sp : null) : true;
  let h = `<div class="nsegg${ok ? ' ok' : ''}${inC ? ' inc' : ''}"><span class="nsei">${nsEggArt(e, ok ? 2 : 0, 'ne' + e.id)}</span><div class="nsex"><b>${esc(nsEggLabel(e))}</b><span class="small">${esc(COMP_FROM[e.from && e.from.how] || 'Œuf')}${e.from && e.from.place ? ' · ' + esc(e.from.place) : ''}</span>`;
  if (ok) h += room ? `<button class="btn gold sm" data-ns-hatch="${e.id}">Faire éclore</button>` : `<span class="nsnote sm">${esc(nsRoomText(e.known ? e.sp : null))}</span><button class="btn cream sm" data-ns-go="habitats">Habitats</button>`;
  else {
    h += `<span class="nsbar"><i style="width:${(f * 100).toFixed(0)}%"></i></span><span class="nstime" data-ns-left="${e.id}">${inC ? 'Au chaud · ' : 'En attente · '}${fmtDur(left)}</span>`;
    if (warm.length) h += `<span class="nswarm">${warm.map(x => `<button class="btn cream sm" data-ns-warm="${e.id}" data-id="${x.it.id}" title="${esc(x.w.txt)}"><span class="nsti">${itemIcon(x.it)}</span>${x.w.f ? 'Réchauffer' : 'Illuminer'}</button>`).join('')}</span>`;
  }
  return h + `</div></div>`;
}
function nsRenderNurserie(box) {
  const N = nsState(), C = NS_COUV[Math.min(3, N.couv) - 1], nx = NS_COUV[N.couv], now = Date.now();
  const incs = S.eggs.filter(e => e.inc || e.ready <= now), wait = S.eggs.filter(e => !e.inc && e.ready > now);
  let h = `<div class="nshead"><div><h2>La nurserie</h2><p>Les œufs trouvés en voyage, reçus en cadeau ou nés à l’enclos grandissent ici.</p></div></div>`;
  // couveuse
  h += `<section class="nscard couv"><div class="nsch"><span class="nsart">${NS_COUV_ART(N.couv)}</span><div><span class="nsk">Couveuse · niveau ${N.couv}</span><h3>${C.slots} place${C.slots > 1 ? 's' : ''} au chaud</h3><p>Les œufs y éclosent ${Math.round(1 / C.f * 10) / 10} fois plus vite. Ils y entrent tout seuls dès qu’une place est libre.</p></div></div>`;
  h += `<div class="nsslots">${Array.from({ length: C.slots }, (_, i) => { const e = S.eggs.filter(x => x.inc && x.ready > now).sort((a, b) => a.inc - b.inc)[i]; return e ? '' : `<div class="nsslot"><span>Place libre</span></div>`; }).join('')}</div>`;
  h += incs.length ? `<div class="nseggs">${incs.map(nsEggCard).join('')}</div>` : (wait.length ? '' : `<p class="nsempty">Aucun œuf pour l’instant. Partez en voyage : chaque région cache ses propres œufs ! Plus le voyage est long, plus vous avez de chances, surtout avec un appât.</p>`);
  if (wait.length) h += `<h4 class="nsh4">En attente d’une place <small>${wait.length}</small></h4><div class="nseggs">${wait.map(nsEggCard).join('')}</div>`;
  if (nx) h += `<div class="nsup"><span><b>Agrandir la couveuse :</b> ${nx.slots} places, encore plus rapide</span>${nsCostHTML(nx.cost, nx.coins)}<button class="btn ${nsCanPay(nx.cost, nx.coins) ? 'green' : 'cream'} sm" data-ns-up="couv" ${nsCanPay(nx.cost, nx.coins) ? '' : 'disabled'}>Agrandir</button></div>`;
  h += `</section>`;
  // enclos des croisements
  h += `<section class="nscard encl"><div class="nsch"><span class="nsart">${NS_ENCLOS_ART()}</span><div><span class="nsk">Enclos des croisements${N.enclos ? ` · niveau ${N.enclos}` : ''}</span><h3>${N.enclos ? 'Deux compagnons, un œuf' : 'À construire'}</h3><p>Choisissez deux compagnons : leur œuf mélange leurs couleurs. Entre deux espèces différentes, un <b>hybride</b> très rare peut naître ! Les parents restent avec vous.</p></div></div>`;
  if (!N.enclos) { const E = NS_ENCLOS[1]; h += `<div class="nsup">${nsCostHTML(E.cost, E.coins)}<button class="btn ${nsCanPay(E.cost, E.coins) ? 'green' : 'cream'}" data-ns-up="enclos" ${nsCanPay(E.cost, E.coins) ? '' : 'disabled'}>Construire l’enclos</button></div>`; }
  else if (N.cross) {
    const c = N.cross, f = Math.min(1, (now - c.start) / Math.max(1, c.ready - c.start));
    h += `<div class="nscross"><span class="nsp">${S.comps[c.a] ? `<img src="${portraitURI(c.a, 'amour')}" alt="">` : ''}<b>${esc(c.names[0])}</b></span><span class="nsheart">♥</span><span class="nsp">${S.comps[c.b] ? `<img src="${portraitURI(c.b, 'amour')}" alt="">` : ''}<b>${esc(c.names[1])}</b></span></div><span class="nsbar"><i style="width:${(f * 100).toFixed(0)}%"></i></span><p class="small nstime">Un œuf arrive dans <span data-ns-cross="1">${fmtDur(c.ready - now)}</span>.</p>`;
  } else {
    const ids = compIds().filter(k => CHARS[k]);
    if (nsPickA && !S.comps[nsPickA]) nsPickA = null; if (nsPickB && !S.comps[nsPickB]) nsPickB = null;
    h += `<p class="nsstep">${!nsPickA ? '1. Touchez le premier parent' : !nsPickB ? '2. Touchez le second parent' : '3. Lancez le croisement'}</p><div class="nspick">${ids.map(k => { const cl = nsCoolLeft(k), away = !!S.trips[k], on = k === nsPickA || k === nsPickB; return `<button class="nspk${on ? ' on' : ''}" data-ns-pick="${k}" ${cl || away ? 'disabled' : ''} aria-pressed="${on}"><img src="${portraitURI(k)}" alt=""><b>${esc(CHARS[k].name)}</b><small>${away ? 'En voyage' : cl ? `Repos ${fmtDur(cl)}` : esc(CHARS[k].species)}</small></button>`; }).join('')}</div>`;
    if (nsPickA && nsPickB) {
      const A = S.comps[nsPickA], B = S.comps[nsPickB], same = A.sp === B.sp, cost = nsCrossCost(nsPickA, nsPickB), food = S.inv.filter(i => i.cat === 'n').length;
      h += `<div class="nsmix"><b>${esc(A.name)} × ${esc(B.name)}</b><span>${same ? 'Même espèce : de nouvelles couleurs et motifs, parfois une mutation rare.' : `Espèces différentes : surtout des mélanges de couleurs, et environ <b>15 %</b> de chances d’un hybride (${esc(spName(A.sp))} × ${esc(spName(B.sp))}) !`}</span><span class="small">Délai : ${fmtDur(NS_ENCLOS[Math.min(2, N.enclos)].delay)} · puis repos des parents ${fmtDur(NS_ENCLOS[Math.min(2, N.enclos)].cool)}</span><div class="nsmb"><button class="btn green" data-ns-cross="coins" ${S.coins >= cost ? '' : 'disabled'}>Payer ${coins(cost)}</button><button class="btn cream" data-ns-cross="food" ${food >= 3 ? '' : 'disabled'}>Offrir un festin (3 plats)</button></div></div>`;
    }
    if (ids.length < 2) h += `<p class="small">Il faut au moins deux compagnons.</p>`;
    const nx2 = NS_ENCLOS[N.enclos + 1];
    if (nx2) h += `<div class="nsup"><span><b>Améliorer l’enclos :</b> œuf en ${fmtDur(nx2.delay)}, repos ${fmtDur(nx2.cool)}</span>${nsCostHTML(nx2.cost, nx2.coins)}<button class="btn ${nsCanPay(nx2.cost, nx2.coins) ? 'green' : 'cream'} sm" data-ns-up="enclos" ${nsCanPay(nx2.cost, nx2.coins) ? '' : 'disabled'}>Améliorer</button></div>`;
  }
  h += `</section>`;
  box.innerHTML = h;
}
// ---- Habitats : construire, agrandir ; puis les bâtiments du village (bonus de voyage)
let nsHabSel = null;
function nsHabCard(H) {
  const lvl = nsHabLvl(H.id), L = nsLayout(), r = (L.by[H.id] || []).length, nx = H.lv[lvl], can = nx && nx.cost && nsCanPay(nx.cost, nx.coins);
  let h = `<article class="nshab${lvl ? ' on' : ''}${nsHabSel === H.id ? ' sel' : ''}" id="nshab-${H.id}" style="--hc:${H.color}"><span class="nsha"><svg viewBox="0 0 126 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${NS_ART[H.id]()}</svg>${lvl ? '' : '<i class="nslock">À construire</i>'}</span><div class="nshx">`;
  h += `<span class="nsk">${lvl ? `Niveau ${lvl}${H.lv.length > 1 ? `/${H.lv.length}` : ''} · ${r}/${nsCap(H.id)} places` : 'Pas encore construit'}</span><h3>${esc(H.name)}</h3><p>${esc(H.desc)}</p>`;
  h += `<span class="nssps">${(H.sps || SP_IDS.slice(0, 0)).map(sp => `<i title="${esc(spName(sp))}"><img src="${nsPortrait(sp)}" alt="">${esc(spName(sp))}</i>`).join('') || '<i class="all">Toutes les espèces</i>'}</span>`;
  if (nx && nx.cost) h += `<div class="nsup"><span><b>${lvl ? 'Agrandir' : 'Construire'} :</b> ${nx.cap} places</span>${nsCostHTML(nx.cost, nx.coins)}<button class="btn ${can ? 'green' : 'cream'} sm" data-ns-up="${H.id}" ${can ? '' : 'disabled'}>${lvl ? 'Agrandir' : 'Construire'}</button></div>`;
  else if (lvl && H.id !== 'prairie') h += `<span class="nsmax">Habitat au maximum !</span>`;
  return h + `</div></article>`;
}
function nsRenderHabitats(box) {
  let h = `<div class="nshead"><div><h2>Les habitats</h2><p>Chaque habitat accueille certaines espèces. Construisez-le, puis agrandissez-le avec les matériaux rapportés de voyage pour accueillir plus de compagnons.</p></div></div>`;
  h += `<div class="nshabs">${NS_HABS.map(nsHabCard).join('')}</div>`;
  if (typeof villageBuildingsHTML === 'function') h += villageBuildingsHTML();
  box.innerHTML = h;
  if (nsHabSel) { const el = document.getElementById('nshab-' + nsHabSel); if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: 'center' }), 30); nsHabSel = null; }
}

// ================= AFFICHAGE : COMPÉDIUM =================
function nsRenderCompedium(box) {
  const N = nsState(), nsp = nsSpCount(), npal = nsPalCount(), tot = SP_IDS.reduce((a, sp) => a + nsPalTotal(sp), 0), nhy = nsHybCount();
  let h = `<div class="nshead cp"><div><h2>Le Compédium</h2><p>Toutes les espèces du monde, leurs couleurs et leurs hybrides. Complétez-le pour gagner des récompenses !</p></div></div>`;
  h += `<div class="cpstats"><span><b>${nsp}</b>/10<small>espèces</small></span><span><b>${npal}</b>/${tot}<small>couleurs</small></span><span><b>${nhy}</b>/45<small>hybrides</small></span></div>`;
  // paliers
  const ready = nsTierReady();
  h += `<h3 class="cph">Récompenses${ready.length ? ` <i class="cpdot">${ready.length}</i>` : ''}</h3><ol class="cptiers">${NS_TIERS.map(t => { const got = N.tiers[t.id], ok = !got && t.ok(); return `<li class="${got ? 'got' : ok ? 'ok' : ''}"><span class="cpti">${got ? '✓' : ok ? '★' : '☆'}</span><span class="cptx"><b>${esc(t.txt)}</b><small>${esc(t.rw)}</small></span>${ok ? `<button class="btn gold sm" data-ns-tier="${t.id}">Récupérer</button>` : got ? '<span class="tagok">Reçu</span>' : ''}</li>`; }).join('')}</ol>`;
  // espèces
  h += `<h3 class="cph">Les espèces</h3><div class="cpsp">` + SP_IDS.map(sp => {
    const own = N.own[sp], seen = N.seen[sp], S0 = typeof SPECIES !== 'undefined' ? SPECIES[sp] : null, pals = S0 ? S0.palettes : [], got = nsPalCount(sp), H = NS_HAB[nsHabOf(sp)];
    return `<article class="cpc ${own ? 'own' : seen ? 'seen' : 'unk'}" style="--tint:${spTint(sp)}"><span class="cpp"><img src="${nsPortrait(sp, null, null, own ? 'content' : 'curieux')}" alt=""></span><div class="cpx"><span class="cpk">${own ? 'Adopté' : seen ? 'Déjà vu' : 'Jamais vu'}</span><h4>${own || seen ? esc(spName(sp)) : '? ? ?'}</h4><span class="cpl"><b>Habitat :</b> ${esc(S0 ? S0.habitat : '')}${H ? ` · au refuge : ${esc(H.short.toLowerCase())}` : ''}</span><span class="cpl"><b>Où le trouver :</b> ${esc(nsWhere(sp))}</span><span class="cpl"><b>Appâts :</b> ${esc(NS_BAIT_HINT[sp] || '')}</span><span class="cpv"><span class="cpbar"><i style="width:${pals.length ? (got / pals.length * 100).toFixed(0) : 0}%"></i></span><small>${got}/${pals.length} couleurs</small></span><span class="cpsw">${pals.map(p => { const has = N.pals[sp + ':' + p.id]; return `<i class="${has ? 'on' : ''} r${p.r}" title="${has ? esc(p.name) : 'Couleur à découvrir'}" style="--a:${p.base};--b:${p.accent}">${has ? '' : '?'}</i>`; }).join('')}</span></div></article>`;
  }).join('') + `</div>`;
  // motifs, yeux, particularités
  const chips = (obj, list, got) => Object.entries(list).filter(([id]) => id !== 'uni' && id !== 'def' && id !== 'none').map(([id, d]) => `<i class="${got[id] ? 'on' : ''}" style="--rc:${RARC[d.r || 0]}">${got[id] ? esc(d.name) : '? ? ?'}</i>`).join('');
  if (typeof PATTERNS !== 'undefined') h += `<h3 class="cph">Motifs, yeux et particularités</h3><div class="cpchips"><b>Motifs</b>${chips('p', PATTERNS, N.pats)}</div><div class="cpchips"><b>Yeux</b>${chips('e', EYES, N.eyes)}</div><div class="cpchips"><b>Particularités</b>${chips('s', SPECIALS, N.specs)}</div>`;
  // hybrides
  const hy = Object.values(N.hyb);
  h += `<h3 class="cph">Les hybrides <small>${nhy}/45</small></h3>`;
  h += hy.length ? `<div class="cphy">${hy.map(x => `<div class="cphc"><img src="${nsPortrait(x.a, x.genes, { a: x.a, b: x.b, t: x.t })}" alt=""><b>${esc(spName(x.a))} × ${esc(spName(x.b))}</b></div>`).join('')}</div>` : `<p class="nsempty">Aucun hybride pour l’instant. Construisez l’enclos des croisements (Village › Nurserie) et croisez deux espèces différentes : avec un peu de chance…</p>`;
  box.innerHTML = h;
}

// ================= ENVELOPPES =================
// départ : l'appât choisi part dans le sac du voyageur ; on note la première visite de la région ; on prévoit une rencontre
startTrip = (orig => function () {
  const N = nsState(), k = S.sel, before = S.trips[k], dest = plan.dest;
  let bait = null;
  if (N.bait && dest) { const it = S.inv.find(i => i.name === N.bait && nsBaitSps(i).length); if (it) bait = it; }
  const r = orig.apply(this, arguments);
  const t = S.trips[k];
  if (t && t !== before) {
    try {
      if (bait && S.inv.includes(bait)) { S.inv.splice(S.inv.indexOf(bait), 1); t.bait = { name: bait.name, sps: nsBaitSps(bait), item: bait }; }
      N.bait = '';
      const R = nsRegionOf(t.dest); if (R) { t.nsReg = R.id; try { t.nsFirst = typeof rgState === 'function' ? !(rgState().seen[R.id] && rgState().seen[R.id].trips) : false; } catch (e) {} }
      nsPlanWild(t);
      save();
    } catch (e) { console.error('nurserie départ', e); }
  }
  return r;
})(startTrip);
fireEvent = (orig => function (t, e) { if (e && e.type === 'sauvage') { try { return nsFireWild(t, e); } catch (er) { console.error(er); return; } } return orig.apply(this, arguments); })(fireEvent);
// une rencontre sauvage attend la réponse du joueur jusqu'au retour (les talents Flair et Oiseau ajoutent des événements juste après elle)
autoResolve = (orig => function (t) { orig.apply(this, arguments); try { if (t && t.elapsed < t.total) return; for (const j of t.journal) if (j.kind === 'sauvage' && j.pending && !j.resolved) nsAutoTame(t, j); } catch (e) { console.error(e); } })(autoResolve);
journalEntry = (orig => function (t, j, i) { if (j && j.kind === 'sauvage') { try { return nsWildHTML(t, j, i); } catch (e) { console.error(e); } } return orig.apply(this, arguments); })(journalEntry);
if (typeof liveAskText === 'function') liveAskText = (orig => function (n, j) { return j && j.kind === 'sauvage' ? `${n} rencontre un ${nsLow(j.sp)} sauvage ! Choisis` : orig.apply(this, arguments); })(liveAskText);
if (typeof LIVE_KIND !== 'undefined' && !LIVE_KIND.sauvage) LIVE_KIND.sauvage = ['#e0884a', '<ellipse cx="12" cy="16" rx="5" ry="4.2" fill="#fff"/><circle cx="6" cy="10" r="2.2" fill="#fff"/><circle cx="10" cy="6.5" r="2.2" fill="#fff"/><circle cx="14.5" cy="6.5" r="2.2" fill="#fff"/><circle cx="18.5" cy="10" r="2.2" fill="#fff"/>', 'Rencontre sauvage'];
// la carte d'action : « Faire éclore » seulement pour un œuf qui a une place au refuge
nextAction = (orig => function () {
  let a = orig.apply(this, arguments);
  if (a && a.kind === 'hatch' && !nsRoomFor(a.egg.known ? a.egg.sp : null)) {
    const alt = readyEggs().find(e => nsRoomFor(e.known ? e.sp : null));
    if (alt) return { kind: 'hatch', egg: alt };
    const keep = S.eggs; S.eggs = S.eggs.filter(e => e.ready > Date.now());
    try { a = orig.apply(this, arguments); } finally { S.eggs = keep; }
  }
  return a;
})(nextAction);
hatchEggScreen = (orig => function (egg, first) {
  if (!first && egg && !nsRoomFor(egg.known ? egg.sp : null)) { toast(nsRoomText(egg.known ? egg.sp : null)); nsHabSel = nsHabOf(egg.sp); openSheet('habitats'); return; }
  return orig.apply(this, arguments);
})(hatchEggScreen);
// récompense des chapitres du Grand Carnet : un œuf d'une espèce pas encore adoptée (ajouté à la fenêtre ouverte par le joueur)
if (typeof claimChapter === 'function') claimChapter = (orig => function () {
  const before = (S.goal && S.goal.done && S.goal.done.length) || 0;
  const r = orig.apply(this, arguments);
  try {
    const after = (S.goal && S.goal.done && S.goal.done.length) || 0;
    if (after > before) { const e = nsGiftEgg('quete', 'Grand Carnet', { luck: 1, maxR: 2 }); nsInjectGift(e, 'Le Grand Carnet vous offre aussi'); }
  } catch (e) { console.error(e); }
  return r;
})(claimChapter);
function nsInjectGift(egg, label) {
  if (!egg) return;
  setTimeout(() => {
    const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox'); if (!box) { toast(`${label} : ${nsEggLabel(egg).toLowerCase()} !`); return; }
    const btn = box.querySelector('button[data-closemodal]:last-of-type') || box.lastElementChild;
    const html = `<div class="nsfind gift"><span class="nsfe">${nsEggArt(egg, 0, 'ng' + egg.id)}</span><div><span class="nsfk">${esc(label)}</span><b>${esc(nsEggLabel(egg))} !</b><span>Il est à la nurserie (Village).</span></div></div>`;
    if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
  }, 40);
}
// Compagnons › Compédium (et Équipe)
if (typeof renderCompagnons === 'function') renderCompagnons = (orig => function (box) { if (compView === 'compedium') return nsRenderCompedium(box); return orig.apply(this, arguments); })(renderCompagnons);
if (typeof openCompagnons === 'function') openCompagnons = (orig => function (sub) {
  if (sub === 'compedium' || sub === 'compendium') { const was = tab === 'compagnons' && compView; compView = 'compedium'; openSheet('compagnons', true); if (was !== compView) $('panelBody').scrollTop = 0; return; }
  return orig.apply(this, arguments);
})(openCompagnons);
// panneau de voyage : espèces de la région et appât à emporter
renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!S.trips[S.sel] && plan.dest && box) {
      const go = box.querySelector('.gobar'); if (go && !box.querySelector('.nsbait')) go.insertAdjacentHTML('beforebegin', nsBaitPanel(plan.dest));
    }
  } catch (e) { console.error(e); }
  return r;
})(renderVoyage);
function nsBaitPanel(dest) {
  const N = nsState(), bag = nsBaitsInBag();
  if (N.bait && !bag.some(b => b.name === N.bait)) N.bait = '';
  const sel = bag.find(b => b.name === N.bait), sc = nsScores(dest, sel ? sel.sps : null).sort((a, b) => b.w - a.w), tot = sc.reduce((a, b) => a + b.w, 0);
  const top = sc.slice(0, 3).filter(x => x.w / tot >= 0.06);
  let h = `<div class="nsbait"><div class="nsbh"><b>Œufs et rencontres possibles</b><span class="small">selon la région et le paysage</span></div><div class="nsposs">${top.map(x => { const pc = x.w / tot, lv = pc >= 0.45 ? 3 : pc >= 0.2 ? 2 : 1; return `<span class="nspo${N.own[x.sp] ? '' : ' new'}"><img src="${nsPortrait(x.sp)}" alt=""><b>${esc(spName(x.sp))}</b><i class="nsdots" aria-label="${['', 'rare', 'possible', 'fréquent'][lv]}">${'●'.repeat(lv)}${'○'.repeat(3 - lv)}</i>${N.own[x.sp] ? '' : '<em>Nouveau</em>'}</span>`; }).join('')}</div>`;
  h += `<div class="nsbh"><b>Emporter un appât</b><span class="small">plus de chances d’œuf et de rencontre</span></div>`;
  h += bag.length ? `<div class="nsbl">${bag.slice(0, 6).map(b => `<button class="nsbb${b.name === N.bait ? ' on' : ''}" data-ns-bait="${esc(b.name)}" aria-pressed="${b.name === N.bait}"><span class="nsti">${itemIcon(b.it)}</span><span><b>${esc(b.name)}${b.n > 1 ? ` ×${b.n}` : ''}</b><small>Attire ${esc(b.sps.slice(0, 2).map(sp => NS_PLURAL[sp]).join(' et '))}</small></span></button>`).join('')}</div>` : `<p class="small nsnob">Pas d’appât dans le sac. Les dattes attirent les fennecs, le poisson les phoques, les fruits les lémuriens, le thé les tanukis…</p>`;
  return h + `</div>`;
}
// « Sert à… »
if (typeof GAME !== 'undefined' && GAME.addUses) {
  GAME.addUses(it => {
    const out = [];
    if (!it) return out;
    const sps = nsBaitSps(it);
    if (sps.length) out.push({ txt: `Attire ${sps.slice(0, 2).map(sp => NS_PLURAL[sp]).join(' et ')}`, kind: 'attirer' });
    const w = nsWarmDef(it); if (w) out.push({ txt: w.txt, kind: 'eclore' });
    if (it.cat === 'm' || it.cat === 'n') {
      const uses = k => ING[k] && ING[k][0].includes(it.sub);
      for (const H of NS_HABS) { const nx = H.lv[nsHabLvl(H.id)]; if (nx && nx.cost && nx.cost.some(([k]) => uses(k))) out.push({ txt: `Refuge : ${H.name}`, kind: 'batiment' }); }
      const N = nsState(), c2 = NS_COUV[N.couv], e2 = NS_ENCLOS[N.enclos + 1];
      if (c2 && c2.cost.some(([k]) => uses(k))) out.push({ txt: 'Nurserie : couveuse', kind: 'batiment' });
      if (e2 && e2.cost.some(([k]) => uses(k))) out.push({ txt: 'Nurserie : enclos des croisements', kind: 'batiment' });
    }
    return out;
  });
}
if (typeof USE_KIND !== 'undefined') { if (!USE_KIND.attirer) USE_KIND.attirer = ['Appât', '#fde3ea', '#c45a78']; if (!USE_KIND.eclore) USE_KIND.eclore = ['Nurserie', '#fff3c4', '#9a6f12']; }
if (typeof NAV_ICONS !== 'undefined') {
  NAV_ICONS.nurserie = '<path d="M15 4 C21 4 25 13 25 18 C25 24 20.5 27 15 27 C9.5 27 5 24 5 18 C5 13 9 4 15 4Z" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><circle cx="11" cy="15" r="2.2" fill="#f3aec1"/><circle cx="18.5" cy="12" r="1.6" fill="#9fd1d8"/><circle cx="17.5" cy="20.5" r="2.6" fill="#f6c445"/><path d="M8 18 L11 20 L13 17.5 L15.5 20 L18 17.5 L21 19.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>';
  NAV_ICONS.habitats = '<path d="M3 25 H27" stroke="#5fa274" stroke-width="2.6" stroke-linecap="round"/><rect x="5" y="8" width="4" height="17" rx="2" fill="#8fc46a" stroke="currentColor" stroke-width="1.5"/><path d="M5 14 h4 M5 19 h4" stroke="currentColor" stroke-width="1.2"/><ellipse cx="19.5" cy="20.5" rx="7" ry="4" fill="#8fd0ea" stroke="currentColor" stroke-width="1.6"/><path d="M14 11 L18 6 L21 9 L24 5 L28 11Z" fill="#fff" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>';
  NAV_ICONS.compedium = '<rect x="5" y="4" width="20" height="23" rx="3" fill="#d9ccf5" stroke="currentColor" stroke-width="2"/><path d="M9 4 V27" stroke="currentColor" stroke-width="2"/><ellipse cx="17.5" cy="17" rx="3.4" ry="2.8" fill="#fff"/><circle cx="13.6" cy="12.4" r="1.6" fill="#fff"/><circle cx="16.4" cy="10.4" r="1.6" fill="#fff"/><circle cx="19.6" cy="10.4" r="1.6" fill="#fff"/><circle cx="22" cy="12.6" r="1.5" fill="#fff"/>';
}
// points rouges et pastille du Village
function nsNurseDot() { return readyEggs().some(e => nsRoomFor(e.known ? e.sp : null)) || (!!nsState().cross && nsState().cross.ready <= Date.now()); }
function nsCompDot() { return nsTierReady().length > 0; }
function nsVillageBadge() { return readyEggs().length + (typeof villageBuildable === 'function' ? villageBuildable().length : 0); }

// ================= ÉVÉNEMENTS =================
// retour de voyage : peut-être un œuf, ajouté à la fenêtre du butin que le joueur vient d'ouvrir
GAME.on('trip:return', e => {
  try {
    const egg = nsTripEgg(e || {}); if (!egg) return;
    save();
    const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox');
    if (box && box.querySelector('.haul')) { const btn = box.querySelector('button[data-closemodal]'); const html = nsEggFoundHTML(egg); if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
    else toast(`${nsEggLabel(egg)} trouvé en chemin ! Il est à la nurserie.`);
    renderNav();
  } catch (err) { console.error('nurserie retour', err); }
});
// 2e rêve réalisé : un œuf d'une autre espèce, ajouté à la fenêtre de fête du rêve
GAME.on('dream:done', ({ who, dream }) => {
  try {
    if (typeof dreamsOf !== 'function' || !dream) return;
    const i = dreamsOf(who).indexOf(dream), N = nsState(), key = who + ':' + dream.id;
    if (i !== 1 || N.gifts[key]) return;
    N.gifts[key] = 1;
    const e = nsGiftEgg('quete', `Rêve de ${CHARS[who] ? CHARS[who].name : ''}`, { not: [spOf(who)], luck: 1.2, maxR: 2 });
    save(); nsInjectGift(e, 'Un cadeau pour ce rêve');
  } catch (err) { console.error(err); }
});
GAME.on('comp:new', ({ comp }) => { try { nsSee(comp); save(); } catch (e) {} });
document.addEventListener('click', ev => {
  const z = ev.target.closest('[data-ns-zone]');
  if (z && !ev.target.closest('[data-hc]')) { nsHabSel = z.dataset.nsZone; villView = 'habitats'; renderPanel(); $('panelBody').scrollTop = 0; return; }
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.nsGo) { if ($('modal')) $('modal').hidden = true; if (d.nsGo === 'refuge' || d.nsGo === 'nurserie' || d.nsGo === 'habitats') { villView = d.nsGo; openSheet('village', true); $('panelBody').scrollTop = 0; } return; }
  if (d.nsTeam) { if (typeof openCompagnons === 'function') openCompagnons('refuge'); return; }
  if (d.nsHatch) { const e = S.eggs.find(x => x.id === d.nsHatch); if (e) hatchEggScreen(e, false); return; }
  if (d.nsWarm) { nsWarm(d.nsWarm, d.id); return; }
  if (d.nsUp) { nsUpgrade(d.nsUp); return; }
  if (d.nsPick) { const k = d.nsPick; if (nsPickA === k) nsPickA = null; else if (nsPickB === k) nsPickB = null; else if (!nsPickA) nsPickA = k; else if (!nsPickB) nsPickB = k; else nsPickB = k; renderPanel(); return; }
  if (d.nsCross) { nsStartCross(d.nsCross); return; }
  if (d.nsTier) { nsClaimTier(d.nsTier); return; }
  if (d.nsBait != null) { const N = nsState(); N.bait = N.bait === d.nsBait ? '' : d.nsBait; save(); renderPanel(); return; }
  if (d.nsTame != null) {
    const k = d.k || S.sel, t = S.trips[k], j = t && t.journal[+d.nsTame]; if (!j) return;
    nsResolveTame(t, j, d.src, d.id, false); save(); renderAll(); return;
  }
});
document.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest && ev.target.closest('[data-ns-zone]')) { ev.preventDefault(); nsHabSel = ev.target.closest('[data-ns-zone]').dataset.nsZone; villView = 'habitats'; renderPanel(); } });
// chaque seconde : couveuse, enclos, comptes à rebours affichés
setInterval(() => {
  try {
    const before = S.eggs.filter(e => e.inc).length;
    const crossed = nsCrossTick();
    nsCouvFill();
    if (crossed || S.eggs.filter(e => e.inc).length !== before) { save(); if (tab === 'village') renderPanel(); else renderNav(); }
    if (tab === 'village' && villView === 'nurserie') {
      const now = Date.now();
      document.querySelectorAll('[data-ns-left]').forEach(el => { const e = S.eggs.find(x => x.id === el.dataset.nsLeft); if (!e) return; if (e.ready <= now) { renderPanel(); return; } el.textContent = (e.inc ? 'Au chaud · ' : 'En attente · ') + fmtDur(e.ready - now); });
      const c = nsState().cross, cs = document.querySelector('[data-ns-cross="1"]'); if (c && cs) cs.textContent = fmtDur(c.ready - now);
    }
  } catch (e) {}
}, 1000);

// ================= MISE EN PLACE =================
(function nsInit() {
  try {
    const N = nsState();
    for (const c of Object.values(S.comps || {})) nsSee(c);
    // anciennes parties : les bâtiments du village déjà construits donnent un coup de pouce au refuge
    const B = S.village && S.village.built || [];
    if (B.includes('port') && !N.hab.bassin) N.hab.bassin = 1;
    if (B.includes('serre') && !N.hab.jungle) N.hab.jungle = 1;
    if (B.includes('potager') && !N.hab.bambou) N.hab.bambou = 1;
    if (B.includes('glacier') && !N.hab.banquise) N.hab.banquise = 1;
    nsCrossTick(); nsCouvFill();
    save();
  } catch (e) { console.error('nurserie', e); }
})();

// ================= STYLES =================
(function nsCSS() {
  const st = document.createElement('style'); st.id = 'nsCSS';
  st.textContent = `
.nshead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
.nshead h2{margin:0;font:800 21px/1.1 var(--display)}.nshead p{margin:3px 0 0;font-size:13.5px;color:var(--ink2);line-height:1.35}
.nshead .btn{flex:none}
.nsbox{border:3px solid var(--ink);border-radius:24px;overflow:hidden;box-shadow:0 4px 0 rgba(74,53,40,.3);background:#bfe3a0}
.nsscene{display:block;width:100%;height:auto}
.nsscene .nsl{font:800 10.5px var(--display);fill:${NSL};text-anchor:middle}
.nsscene .nst{font:800 12px var(--display);fill:${NSL};text-anchor:middle}
.nszone{cursor:pointer}.nszone.off:hover rect{stroke:#2f7f6c}
.nsw{animation:nsWalk var(--dur) ease-in-out infinite;animation-delay:var(--dl);transform-box:fill-box;transform-origin:50% 100%}
.nsb{animation:nsBob .7s ease-in-out infinite alternate;animation-delay:var(--dl);transform-box:fill-box;transform-origin:50% 100%;cursor:pointer}
@keyframes nsWalk{0%,8%{transform:translateX(0) scaleX(1)}42%,50%{transform:translateX(var(--dx)) scaleX(1)}54%,58%{transform:translateX(var(--dx)) scaleX(-1)}92%,96%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}
@keyframes nsBob{from{transform:translateY(0)}to{transform:translateY(-2.5px)}}
@media (prefers-reduced-motion:reduce){.nsw,.nsb{animation:none}}
.nshint{margin:7px 2px 4px;font-size:12.5px;color:var(--ink2)}
.nsnote{margin:6px 0;padding:7px 10px;background:#fff3c4;border:2px solid var(--goldD);border-radius:12px;font:700 13px/1.35 var(--display);color:var(--ink)}
.nsnote.sm{display:block;padding:4px 8px;font-size:12px;margin:2px 0}
.nsbanner{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 8px;padding:6px 10px 6px 6px;background:#fffaf0;border:2.5px solid var(--ink);border-radius:16px;box-shadow:0 3px 0 rgba(74,53,40,.3);cursor:pointer;text-align:left;color:var(--ink)}
.nsbanner.hot{background:#fff3c4;animation:glow 1.2s ease-in-out infinite alternate}
.nsbanner .nsbe svg{width:34px;height:42px;display:block}.nsbanner b{display:block;font:800 15px var(--display)}.nsbanner small{font-size:12.5px;color:var(--ink2)}
.nsres{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:7px;margin-top:6px}
.nsrr{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 8px}
.nsri{flex:none;width:36px;height:36px;border-radius:11px;background:var(--hc);border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;color:var(--ink)}.nsri svg{width:24px;height:24px}
.nsrx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.nsrx b{font:800 14px var(--display)}.nsrx b small{color:var(--muted);font-weight:700}
.nsfaces{display:flex;gap:4px;flex-wrap:wrap}.nsfaces i{font-size:12px;color:var(--muted)}
.nsface{width:34px;height:36px;padding:0;border:2px solid var(--ink);border-radius:10px;background:#fff8ea;overflow:hidden;cursor:pointer}.nsface img{width:100%;height:100%;display:block}
.nscard{background:#fff;border:2.5px solid var(--ink);border-radius:20px;padding:10px;margin:0 0 12px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.nscard.couv{background:linear-gradient(180deg,#fff7dc,#fff 55%)}.nscard.encl{background:linear-gradient(180deg,#fde9ef,#fff 55%)}
.nsch{display:flex;gap:10px;align-items:center}
.nsart{flex:none;width:96px}.nsart svg{width:100%;height:auto;display:block}
.nsglow{animation:nsGlow 1.6s ease-in-out infinite alternate}@keyframes nsGlow{to{opacity:.4}}
.nsk{font:800 11px/1.2 var(--display);color:var(--rust);letter-spacing:.05em;text-transform:uppercase}
.nsch h3,.nshx h3{margin:2px 0;font:800 17px/1.15 var(--display)}.nsch p,.nshx p{margin:0;font-size:13px;color:var(--ink2);line-height:1.35}
.nsslots{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.nsslots:empty{display:none}
.nsslot{flex:1;min-width:90px;height:44px;border:2px dashed var(--line);border-radius:12px;display:flex;align-items:center;justify-content:center;font:700 12.5px var(--display);color:var(--muted);background:rgba(255,255,255,.6)}
.nseggs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:7px;margin-top:8px}
.nsegg{display:flex;gap:8px;align-items:center;background:#fffaf0;border:2px solid var(--line);border-radius:16px;padding:6px 8px}
.nsegg.inc{border-color:#f2c14e;background:linear-gradient(90deg,#fff3c4,#fffaf0 60%)}
.nsegg.ok{border-color:var(--ink);background:#fff3c4;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.nsei{flex:none;width:52px}.nsei svg{width:52px;height:62px;display:block}
.nsegg.ok .nsei{animation:eggIdle 1.6s ease-in-out infinite;transform-origin:50% 90%}
.nsex{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;align-items:flex-start}.nsex b{font:800 14.5px var(--display)}.nsex .small{margin:0;font-size:12px}
.nsbar{display:block;width:100%;height:9px;border-radius:999px;background:#f1e4c8;border:1.5px solid var(--ink);overflow:hidden}.nsbar i{display:block;height:100%;background:linear-gradient(90deg,#f6c445,#f39ab0)}
.nstime{font:700 12px var(--display);color:var(--ink2)}
.nswarm{display:flex;gap:4px;flex-wrap:wrap}.nswarm .btn{padding:4px 8px 3px;font-size:12.5px;box-shadow:0 2px 0 var(--ink)}
.nsti{display:inline-flex;width:22px;height:22px;flex:none}.nsti svg{width:100%;height:100%}
.nsh4{margin:12px 0 0;font:800 14px var(--display)}.nsh4 small{color:var(--muted)}
.nsup{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:10px;padding-top:8px;border-top:2px dashed var(--line)}
.nsup>span{flex-basis:100%;font-size:13px}
.nscost{display:flex;flex-wrap:wrap;gap:4px;margin:0;padding:0;list-style:none;flex:1;min-width:0}
.nscost li{font:700 12px var(--display);padding:2px 8px;border-radius:999px;background:#fbeee0;border:1.5px solid var(--line);color:var(--ink2)}.nscost li.ok{background:#e6f6e9;border-color:#9fd3ae;color:var(--greenD)}.nscost .money svg{width:13px;height:13px}
.nsempty{margin:8px 0 0;padding:10px;border:2px dashed var(--line);border-radius:12px;font-size:13px;color:var(--ink2)}
.nsstep{margin:10px 0 6px;font:800 14px var(--display);color:var(--teal)}
.nspick{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
.nspk{flex:none;width:76px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 3px 5px;background:#fff;border:2px solid var(--line);border-radius:14px;cursor:pointer;color:var(--ink)}
.nspk img{width:50px;height:54px}.nspk b{font:800 12.5px var(--display);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nspk small{font-size:10.5px;color:var(--muted);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nspk.on{border-color:var(--ink);background:#fde3ea;box-shadow:0 3px 0 var(--ink)}.nspk:disabled{opacity:.45;cursor:default}
.nsmix{display:flex;flex-direction:column;gap:4px;margin-top:6px;padding:8px 10px;background:#fffaf0;border:2px solid var(--ink);border-radius:14px}
.nsmix>b{font:800 15px var(--display)}.nsmix>span{font-size:13px;color:var(--ink2)}.nsmix .small{margin:0}
.nsmb{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}.nsmb .btn{flex:1;min-width:140px;padding:8px 10px 6px;font-size:14.5px}
.nscross{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0 6px}
.nsp{display:flex;flex-direction:column;align-items:center}.nsp img{width:64px;height:70px}.nsp b{font:800 13px var(--display)}
.nsheart{font-size:28px;color:var(--pink);animation:pulse .8s ease-in-out infinite alternate}
.nshabs{display:flex;flex-direction:column;gap:9px}
.nshab{display:flex;gap:10px;background:#fff;border:2.5px solid var(--line);border-radius:18px;padding:8px;align-items:flex-start}
.nshab.on{border-color:var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.22)}.nshab.sel{outline:3px solid var(--teal);outline-offset:2px}
.nsha{position:relative;flex:none;width:96px;height:80px;border-radius:14px;overflow:hidden;border:2px solid var(--ink);background:var(--hc)}.nsha svg{width:100%;height:100%;display:block}
.nshab:not(.on) .nsha svg{opacity:.5;filter:saturate(.6)}
.nslock{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);font:800 10.5px var(--display);font-style:normal;white-space:nowrap;background:#fff8ea;border:1.5px solid var(--ink);border-radius:999px;padding:1px 7px}
.nshx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.nssps{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.nssps i{display:inline-flex;align-items:center;gap:3px;font:700 11.5px var(--display);font-style:normal;background:#f6ead2;border-radius:999px;padding:1px 8px 1px 2px}.nssps i img{width:20px;height:22px}.nssps i.all{padding:1px 8px}
.nshab .nsup{margin-top:6px}
.nsmax{font:800 12.5px var(--display);color:var(--greenD);margin-top:4px}
.nsbait{margin:10px 0;padding:9px;background:#fffaf0;border:2px solid var(--line);border-radius:16px;display:flex;flex-direction:column;gap:6px}
.nsbh{display:flex;flex-direction:column;gap:0}.nsbh b{font:800 14px var(--display)}.nsbh .small{margin:0;font-size:11.5px;color:var(--muted)}
.nsposs{display:flex;gap:6px;flex-wrap:wrap}
.nspo{position:relative;flex:1;min-width:92px;display:flex;flex-direction:column;align-items:center;gap:0;background:#fff;border:2px solid var(--line);border-radius:14px;padding:4px 4px 5px}
.nspo img{width:44px;height:48px}.nspo b{font:800 12px var(--display);text-align:center}.nsdots{font-style:normal;color:var(--goldD);font-size:11px;letter-spacing:1px}
.nspo em{position:absolute;top:-7px;right:-4px;font:800 9.5px var(--display);font-style:normal;background:var(--pink);color:#fff;border:1.5px solid var(--ink);border-radius:999px;padding:0 5px}
.nsbl{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:5px}
.nsbb{display:flex;align-items:center;gap:6px;text-align:left;padding:5px 7px;background:#fff;border:2px solid var(--line);border-radius:12px;cursor:pointer;color:var(--ink);min-width:0}
.nsbb b{display:block;font:800 12.5px/1.15 var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nsbb small{display:block;font-size:11px;color:var(--ink2);line-height:1.2}.nsbb>span:last-child{min-width:0}
.nsbb.on{border-color:var(--ink);background:#fde3ea;box-shadow:0 2px 0 var(--ink)}
.nsnob{margin:0}
.nswild{display:flex;gap:9px;align-items:center}
.nswa{flex:none;width:66px;height:72px;border-radius:16px;background:radial-gradient(circle at 50% 60%,#fff 0 40%,#fde3ea 41%);border:2.5px solid var(--ink);overflow:hidden}.nswa.r2,.nswa.r3,.nswa.r4{border-color:var(--rc);box-shadow:0 0 0 2px var(--rc)}
.nswa img{width:100%;height:100%;display:block}
.nswk{font:800 11px var(--display);color:#c0602a;letter-spacing:.04em;text-transform:uppercase}.nswild p{margin:2px 0 0}
.nstame button{display:flex;align-items:center;gap:6px;text-align:left}.nstx{display:flex;flex-direction:column}.nstx small{font:600 11.5px var(--body);opacity:.8}
.nswon{display:flex;align-items:center;gap:8px;margin-top:4px}.nswp{flex:none;width:50px;height:54px;overflow:hidden;border:2px solid var(--ink);border-radius:12px;background:#fff8ea}.nswp>*{width:100%!important;height:100%!important;position:static!important;display:block}.nswon b{flex:1;font:800 15px var(--display)}
.je.k-sauvage{border-color:#e0884a}
.nsfind{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:linear-gradient(90deg,#fff3c4,#fffaf0);border:2.5px solid var(--ink);border-radius:16px;padding:7px 9px;box-shadow:0 3px 0 rgba(74,53,40,.25);animation:dpop .6s cubic-bezier(.2,1.6,.4,1) both}
.nsfind .nsfe{flex:none}.nsfind .nsfe svg{width:46px;height:56px;display:block;animation:eggIdle 2.2s ease-in-out infinite;transform-origin:50% 90%}
.nsfind>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.nsfind b{font:800 16px var(--display)}.nsfind span{font-size:12.5px;color:var(--ink2)}.nsfind em{font-size:12px;font-style:normal;color:var(--teal);margin-top:2px}
.nsfk{font:800 11px var(--display)!important;color:var(--rust)!important;letter-spacing:.05em;text-transform:uppercase}
.nsfind .btn{flex:none}
.cpstats{display:flex;gap:6px;margin:0 0 6px}.cpstats span{flex:1;display:flex;flex-direction:column;align-items:center;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:5px 4px;font:700 13px var(--display);color:var(--ink2)}.cpstats b{font:800 24px/1 var(--display);color:var(--ink)}.cpstats small{font-size:11.5px}
.cph{margin:14px 0 7px;font:800 16px var(--display);display:flex;align-items:center;gap:8px}.cph::after{content:"";flex:1;height:2px;background:var(--line);border-radius:2px}.cph small{color:var(--muted);font-size:13px}
.cpdot{font-style:normal;min-width:20px;height:20px;border-radius:999px;background:var(--rust);color:#fff;font:800 12px/18px var(--display);text-align:center;border:2px solid #fff}
.cptiers{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.cptiers li{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:5px 8px}
.cptiers li.ok{border-color:var(--ink);background:#fff3c4}.cptiers li.got{background:#eef8f0;opacity:.8}
.cpti{flex:none;width:24px;text-align:center;font:800 16px var(--display);color:var(--goldD)}.cptiers li.got .cpti{color:var(--greenD)}
.cptx{flex:1;min-width:0;display:flex;flex-direction:column}.cptx b{font:800 13.5px var(--display)}.cptx small{font-size:12px;color:var(--ink2)}
.cpsp{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}
.cpc{display:flex;gap:9px;background:linear-gradient(90deg,var(--tint),#fff 55%);border:2.5px solid var(--line);border-radius:18px;padding:7px}
.cpc.own{border-color:var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.22)}
.cpp{flex:none;width:70px;height:76px;border-radius:14px;background:#fff;border:2px solid var(--ink);overflow:hidden;display:flex;align-items:center;justify-content:center}.cpp img{width:100%;height:100%}
.cpc.unk .cpp img{filter:brightness(0) opacity(.28)}.cpc.unk .cpp{background:#efe6d6}.cpc.seen .cpp img{filter:grayscale(.7) opacity(.75)}
.cpx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cpk{font:800 10.5px var(--display);letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}.cpc.own .cpk{color:var(--greenD)}
.cpx h4{margin:0;font:800 16px/1.1 var(--display)}
.cpl{font-size:12px;line-height:1.3;color:var(--ink2)}.cpl b{color:var(--ink);font-weight:700}
.cpv{display:flex;align-items:center;gap:6px;margin-top:2px}.cpv small{flex:none;font:700 11.5px var(--display);color:var(--ink2)}
.cpbar{flex:1;height:8px;border-radius:999px;background:#f1e4c8;border:1.5px solid var(--ink);overflow:hidden}.cpbar i{display:block;height:100%;background:linear-gradient(90deg,#f2c14e,#5fbf7f)}
.cpsw{display:flex;gap:3px;flex-wrap:wrap}.cpsw i{width:17px;height:17px;border-radius:50%;border:1.5px solid var(--line);background:#f6efe2;font:800 9px/14px var(--display);font-style:normal;text-align:center;color:#c9b89a}
.cpsw i.on{background:linear-gradient(135deg,var(--a) 0 55%,var(--b) 56%);border-color:var(--ink)}.cpsw i.on.r3,.cpsw i.on.r4{box-shadow:0 0 0 2px #f6c445}
.cpchips{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-bottom:6px}.cpchips b{font:800 12.5px var(--display);margin-right:4px;min-width:84px}
.cpchips i{font:700 11.5px var(--display);font-style:normal;padding:1px 8px;border-radius:999px;border:1.5px dashed var(--line);color:var(--muted);background:#fff}.cpchips i.on{border:1.5px solid var(--rc);color:var(--rc);background:#fff}
.cphy{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px}
.cphc{display:flex;flex-direction:column;align-items:center;background:#fff;border:2.5px solid #9a6fd6;border-radius:14px;padding:4px}.cphc img{width:64px;height:70px}.cphc b{font:800 11.5px var(--display);text-align:center}
@media (max-width:420px){.subtabs:has(button:nth-child(5)) button span{font-size:10.5px;letter-spacing:-.25px}.subtabs:has(button:nth-child(5)) button svg{width:22px;height:22px}.cpsp,.nsres,.nseggs{grid-template-columns:1fr}.nsha{width:80px;height:70px}.nsart{width:78px}.nshead h2{font-size:19px}}
`;
  document.head.appendChild(st);
})();

window.__nurse = {
  state: nsState, layout: nsLayout, roomFor: nsRoomFor, scores: nsScores, pickSp: nsPickSp, tripEgg: nsTripEgg, giftEgg: nsGiftEgg, addEgg: nsAddEgg,
  couvFill: nsCouvFill, upgrade: nsUpgrade, pay: nsPay, startCross: nsStartCross, crossTick: nsCrossTick, pick: (a, b) => { nsPickA = a; nsPickB = b; },
  baitPower: nsBaitPower, baitSps: nsBaitSps, baits: nsBaitsInBag, tameChance: nsTameChance, resolveTame: nsResolveTame, planWild: nsPlanWild, tiers: () => NS_TIERS.map(t => ({ id: t.id, ok: t.ok(), got: !!nsState().tiers[t.id] })), claimTier: nsClaimTier,
  HABS: NS_HABS, NS_SP, NS_BAITS,
  // pour les tests (le jeu vit dans une fonction : on expose les fonctions globales utiles, dans leur dernière version)
  api: {
    get S() { return S; }, get plan() { return plan; }, PLACES, DURS,
    startTrip: () => startTrip(), tick: ms => tick(ms), collect: () => collect(), nextAction: () => nextAction(), renderAll: () => renderAll(), renderPanel: () => renderPanel(),
    openSheet: (n, k) => openSheet(n, k), closeSheet: () => closeSheet(), village: v => { villView = v; openSheet('village', true); $('panelBody').scrollTop = 0; },
    hatch: id => hatchEggScreen(S.eggs.find(e => e.id === id), false), item: (def, r = 0) => makeItem(def, 0, 'Test', [], { fixed: r }), save: () => save(),
    openCompagnons: s => openCompagnons(s), dreamsOf: k => dreamsOf(k), teamIds: () => teamIds(), emit: (e, d) => GAME.emit(e, d), readyEggs: () => readyEggs(),
  },
};

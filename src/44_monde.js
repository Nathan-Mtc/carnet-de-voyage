// ================= LE MONDE QUI VIT (v31, étape 2, bloc B) =================
// Le joueur veut du challenge et une vraie aventure. Sans nouvel écran : page Quêtes (section « Monde » + petits onglets),
// carte (petites icônes quand on zoome), panneau de départ, aventure vécue (bandeau météo) et butin.
// 1. MOMENTS RARES : 15 moments liés à des lieux réels, selon la vraie date et l'heure locale du lieu (cerisiers, aurores,
//    marée basse simulée…). Y être au bon moment : objet unique + photo unique (une fois par an et par moment).
// 2. MÉTÉO DU JOUR : chaque jour (graine dayKey), 4 régions ont une météo marquante. Tempête : bord de mer fermé, risques ×2 ;
//    brouillard, neige, canicule : risques ×1,5 (et le voyage devient une expédition à choix risqués) ; grand beau : meilleur
//    butin et lieux à cadenas plus faciles (maîtrise demandée −2). Panneau de départ, bandeau de l'aventure, scène (avWeather).
// 3. LIEUX ÉPHÉMÈRES : 3 par jour, 2 à 4 h, près de la maison (et un en Europe). Épingle avec compte à rebours (zoom),
//    objet + spécialité uniques, petit événement à l'arrivée. Pas de notification : un point sur le bouton Quêtes.
// 4. PISTES D'ANIMAUX (v33 : des « traques ») : un animal sauvage laisse des traces dans la nature, 3 ou 4 étapes. On ne devine
//    rien (ça, ce sont les énigmes) : une patte sur la carte montre où mènent les traces, il suffit de les suivre jusqu'au bout.
//    Au bout : un trésor unique (moulage d'empreinte), un titre de pisteur, des pièces et de l'XP (onglet Exploration).
// État : S.wld = { mo: {id: année}, ev: {id: 1}, seen: {id: 1}, tr: piste en cours | null, trN, trLast }.
// Enveloppes : startTrip, fireEvent, collect, showHaul, renderVoyage, drawMarks, xpRiskK, xpIsExpe, xpConds, avWeather,
// avRender, qtPageHTML, qtBtns. Expose window.__wld (tests).

// ---------------- temps (décalable pour les tests) ----------------
let WD_OFF = 0, WD_FWX = null;
const wdNow = () => Date.now() + WD_OFF;
const wdDate = () => new Date(wdNow());
const wdDayOf = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const wdDay = () => wdDayOf(wdDate());
const wdMD = () => { const d = wdDate(); return (d.getMonth() + 1) * 100 + d.getDate(); };
const wdHourAt = lon => { const d = wdDate(); return ((d.getUTCHours() + d.getUTCMinutes() / 60 + (+lon || 0) / 15) % 24 + 24) % 24; };
const wdCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const wdH = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const wdR = s => (wdH(s) % 10007) / 10007;
const wdKm = (a, b) => wdCall(() => d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]) * 6371, 1e9);
const wdTuto = () => wdCall(() => tuOn(), false);
const wdNm = k => (CHARS[k] ? CHARS[k].name : '');
const wdOff = (o, deg, km) => { const a = deg * Math.PI / 180; return { lat: o.lat + Math.sin(a) * km / 111.2, lon: o.lon + Math.cos(a) * km / (111.2 * Math.max(0.2, Math.cos(o.lat * Math.PI / 180))) }; };
const wdDir = (a, b) => wdCall(() => myDir(a, b), 'plus loin');
const wdDur = ms => { const m = Math.max(1, Math.round(ms / 60e3)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
const wdHHMM = ms => { const d = new Date(ms); return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`; };
function wdState() {
  if (!S.wld || typeof S.wld !== 'object' || Array.isArray(S.wld)) S.wld = {};
  const W = S.wld;
  ['mo', 'ev', 'seen'].forEach(k => { if (!W[k] || typeof W[k] !== 'object' || Array.isArray(W[k])) W[k] = {}; });
  if (W.tr && (typeof W.tr !== 'object' || !Array.isArray(W.tr.pts))) W.tr = null;
  if (typeof W.trN !== 'number') W.trN = 0;
  return W;
}
// le lieu nommé le plus proche (03_data.js), pour nommer un point
function wdNear(o, max = 45) {
  let best = null, bd = max;
  wdCall(() => PLACES.forEach(p => { const P = { lon: p.lon != null ? p.lon : p[3], lat: p.lat != null ? p.lat : p[2] }, km = wdKm(o, P); if (km < bd) { bd = km; best = p.name || p[0]; } }), 0);
  return best;
}
const W4 = (n, cat, sub, look, col) => [n, cat, sub, 4, look, col];
const W3 = (n, cat, sub, look, col) => [n, cat, sub, 3, look, col];

// ---------------- 1. moments rares ----------------
// win : [MMJJ début, MMJJ fin] (peut passer l'année) ; h : heures locales du lieu ; tide : marée basse simulée
const WD_MOM = [
  { id: 'sakura', ico: '🌸', nm: 'Cerisiers en fleurs', where: 'Kyoto (Japon)', lon: 135.768, lat: 35.0116, r: 120, tags: ['ville', 'monument'], win: [325, 415], when: 'fin mars à mi-avril', txt: 'Les cerisiers sont en fleurs ! Une pluie de pétales roses tombe sur {n}, et une vieille dame lui offre un cadeau sous les branches.', it: W4('Kimono des cerisiers', 'v', 'haut', 'pull', '#f4b6c8') },
  { id: 'aurore', ico: '🌌', nm: 'Aurores boréales de Laponie', where: 'Laponie (Abisko)', lon: 18.83, lat: 68.35, r: 350, tags: ['neige', 'foret'], win: [901, 331], h: [20, 3], when: 'nuits de septembre à mars', txt: 'Le ciel s’allume de vert et de violet ! Un renne s’approche de {n} pour regarder les aurores avec lui.', it: W4('Éclat d’aurore boréale', 'm', 'lumiere', null, '#7fe0c0') },
  { id: 'aurore_is', ico: '✨', nm: 'Aurores d’Islande', where: 'Islande (Þingvellir)', lon: -21.13, lat: 64.26, r: 250, tags: ['neige', 'montagne'], win: [901, 331], h: [20, 3], when: 'nuits de septembre à mars', txt: 'Au-dessus des volcans, le ciel danse en rubans verts. Un macareux ensommeillé tient compagnie à {n}.', it: W4('Bonnet des aurores islandaises', 'v', 'tete', 'bonnet', '#5fc0a8') },
  { id: 'maree', ico: '🌊', nm: 'Grande marée basse', where: 'Mont-Saint-Michel', lon: -1.5115, lat: 48.6361, r: 25, tags: ['mer', 'monument'], tide: 1, when: 'à marée basse, deux fois par jour', txt: 'La mer s’est retirée très loin : {n} marche sur le sable jusqu’au Mont et trouve une coquille gravée.', it: W4('Coquille de la grande marée', 'm', 'coquillage', null, '#f2d7b0') },
  { id: 'lavande', ico: '💜', nm: 'Lavande en fleurs', where: 'Plateau de Valensole (Provence)', lon: 5.98, lat: 43.84, r: 60, tags: ['campagne'], win: [615, 731], when: 'juin et juillet', txt: 'Des champs violets à perte de vue, et des abeilles qui chantent. {n} en ramène un bouquet qui sent bon l’été.', it: W4('Bouquet de lavande de Valensole', 'm', 'fleur', null, '#9a7fd0') },
  { id: 'gnous', ico: '🦓', nm: 'Grande migration des gnous', where: 'Serengeti (Tanzanie)', lon: 34.83, lat: -2.33, r: 300, tags: ['desert', 'campagne'], win: [701, 1031], when: 'juillet à octobre', txt: 'Des milliers de gnous passent devant {n} dans un nuage de poussière ! Un petit zèbre reste près de lui.', it: W4('Statue de la grande migration', 'd', 'statue', null, '#c9a35a') },
  { id: 'lucioles', ico: '🪲', nm: 'Nuit des lucioles', where: 'Vallée de la Dordogne (Périgord)', lon: 1.1, lat: 44.85, r: 70, tags: ['foret', 'campagne'], win: [601, 731], h: [21, 1], when: 'nuits de juin et juillet', txt: 'Dans le noir, des centaines de petites lumières clignotent autour de {n}. Une luciole se pose sur son nez !', it: W4('Lanterne à lucioles', 'm', 'lumiere', null, '#e8f07a') },
  { id: 'vendanges', ico: '🍇', nm: 'Vendanges', where: 'Côte de Beaune (Bourgogne)', lon: 4.8, lat: 47.02, r: 60, tags: ['campagne'], win: [901, 1010], when: 'septembre', txt: 'Les vendangeurs chantent dans les vignes. {n} remplit un panier et reçoit la plus belle grappe du domaine.', it: W4('Grappe dorée de Bourgogne', 'n', 'fruit', null, '#8a3f6a') },
  { id: 'noel', ico: '🎄', nm: 'Marché de Noël', where: 'Strasbourg', lon: 7.7521, lat: 48.5734, r: 25, tags: ['ville'], win: [1127, 1224], h: [10, 21], when: 'décembre, de 10 h à 21 h', txt: 'Cannelle, chalets en bois et grand sapin : {n} boit un chocolat chaud et un artisan lui offre une boule de verre.', it: W4('Boule de Noël de Strasbourg', 'd', 'statue', null, '#c0392b') },
  { id: 'tulipes', ico: '🌷', nm: 'Champs de tulipes', where: 'Keukenhof (Pays-Bas)', lon: 4.546, lat: 52.27, r: 40, tags: ['campagne'], win: [401, 510], when: 'avril', txt: 'Des rayures rouges, jaunes et roses jusqu’à l’horizon ! Un jardinier offre à {n} une tulipe presque noire, très rare.', it: W4('Tulipe noire', 'm', 'fleur', null, '#3a2a4a') },
  { id: 'minuit', ico: '🌞', nm: 'Soleil de minuit', where: 'Cap Nord (Norvège)', lon: 25.78, lat: 71.17, r: 350, tags: ['neige', 'mer'], win: [520, 725], h: [22, 2], when: 'juin, vers minuit', txt: 'Il est minuit et le soleil ne se couche pas ! {n} pique-nique face à la mer dorée avec un macareux.', it: W4('Écharpe du soleil de minuit', 'v', 'cou', 'echarpe', '#f2a03a') },
  { id: 'erables', ico: '🍁', nm: 'Feuillage d’automne', where: 'Laurentides (Québec)', lon: -74.5, lat: 46.2, r: 250, tags: ['foret'], win: [920, 1025], when: 'fin septembre à octobre', txt: 'Les érables sont rouges, orange et or. {n} saute dans un tas de feuilles et trouve la plus belle de la forêt.', it: W4('Feuille d’érable écarlate', 'm', 'feuille', null, '#d9452a') },
  { id: 'holi', ico: '🎨', nm: 'Holi, la fête des couleurs', where: 'Mathura (Inde)', lon: 77.67, lat: 27.49, r: 300, tags: ['ville'], win: [301, 325], when: 'en mars (pleine lune)', txt: 'Pouf ! Un nuage de poudre rose et bleue : {n} est tout coloré et rit avec les enfants du quartier.', it: W4('Foulard aux mille couleurs', 'v', 'cou', 'foulard', '#e85fa0') },
  { id: 'carnaval', ico: '🎭', nm: 'Carnaval de Venise', where: 'Venise', lon: 12.3155, lat: 45.4408, r: 25, tags: ['ville', 'monument'], win: [201, 305], when: 'février', txt: 'Masques dorés et capes de velours glissent sur les canaux. Un gondolier masqué offre un chapeau à {n}.', it: W4('Tricorne du carnaval de Venise', 'v', 'tete', 'beret', '#8a3f9a') },
  { id: 'lumieres', ico: '🕯', nm: 'Fête des Lumières', where: 'Lyon', lon: 4.8357, lat: 45.764, r: 15, tags: ['ville', 'monument'], win: [1205, 1208], h: [18, 24], when: 'début décembre, le soir', txt: 'Les façades s’illuminent et des milliers de lumignons brillent aux fenêtres. {n} en reçoit un, encore tiède.', it: W4('Lumignon du 8 décembre', 'm', 'lumiere', null, '#ffd76a') },
];
const WD_M = {}; WD_MOM.forEach(M => { WD_M[M.id] = M; });
const wdInWin = (v, w) => (w[0] <= w[1] ? v >= w[0] && v <= w[1] : v >= w[0] || v <= w[1]);
const wdInH = (h, w) => (w[0] <= w[1] ? h >= w[0] && h < w[1] : h >= w[0] || h < w[1]);
// marée basse simulée : un cycle de 12 h 25, basse mer pendant 2 h
const WD_TIDE = 12.42 * 3600e3, WD_LOW = 2 * 3600e3;
const wdTidePos = () => ((wdNow() - 3 * 3600e3) % WD_TIDE + WD_TIDE) % WD_TIDE;
function wdMoState(M) {
  const season = !M.win || wdInWin(wdMD(), M.win);
  let now = season, wait = '';
  if (season && M.h) { const h = wdHourAt(M.lon); now = wdInH(h, M.h); if (!now) wait = `il est ${Math.floor(h)} h là-bas : revenez vers ${M.h[0]} h (heure locale)`; }
  if (M.tide) { const p = wdTidePos(); now = p < WD_LOW; wait = now ? `marée basse encore ${wdDur(WD_LOW - p)}` : `prochaine marée basse dans ${wdDur(WD_TIDE - p)}`; }
  return { season, now, wait, got: wdState().mo[M.id] === wdDate().getFullYear() };
}
// jours avant le début de la saison (0 si en cours)
function wdMoSoon(M) {
  if (!M.win) return 0;
  const d = wdDate(); for (let i = 0; i <= 60; i++) { const x = new Date(d.getTime() + i * 864e5), md = (x.getMonth() + 1) * 100 + x.getDate(); if (wdInWin(md, M.win)) return i; }
  return 999;
}

// ---------------- 2. météo du jour ----------------
// risk : multiplicateur des risques ; close : terrains fermés ; favor : meilleur butin, cadenas plus faciles ; wx : scène de l'aventure
const WD_K = {
  tempete: { ico: '⛈', nm: 'Tempête', risk: 2, close: ['mer'], wx: 'pluie', eff: 'risques ×2, bord de mer fermé' },
  sable: { ico: '🌪', nm: 'Tempête de sable', risk: 2, close: [], wx: 'nuages', eff: 'risques ×2' },
  brouillard: { ico: '🌫', nm: 'Brouillard', risk: 1.5, close: [], wx: 'nuages', eff: 'risques ×1,5' },
  neige: { ico: '❄', nm: 'Grosses chutes de neige', risk: 1.5, close: [], wx: 'neige', eff: 'risques ×1,5' },
  canicule: { ico: '🔥', nm: 'Canicule', risk: 1.5, close: [], wx: 'clair', eff: 'risques ×1,5' },
  grandbeau: { ico: '☀', nm: 'Grand beau', risk: 0.6, favor: 1, close: [], wx: 'clair', eff: 'meilleur butin, lieux à cadenas plus faciles' },
};
const WD_Z = [
  { id: 'bretagne', de: 'en Bretagne', lon: -3.2, lat: 48.15, r: 160, k: ['tempete', 'brouillard', 'grandbeau'] },
  { id: 'normandie', de: 'en Normandie', lon: -0.4, lat: 49.1, r: 130, k: ['tempete', 'brouillard', 'grandbeau'] },
  { id: 'atlantique', de: 'sur la côte atlantique', lon: -1.2, lat: 45.6, r: 170, k: ['tempete', 'canicule', 'grandbeau'] },
  { id: 'sud', de: 'dans le Sud', lon: 5.4, lat: 43.6, r: 170, k: ['canicule', 'grandbeau', 'tempete'] },
  { id: 'alpes', de: 'sur les Alpes', lon: 6.7, lat: 45.8, r: 140, k: ['brouillard', 'neige', 'grandbeau'] },
  { id: 'pyrenees', de: 'sur les Pyrénées', lon: 0.3, lat: 42.8, r: 150, k: ['brouillard', 'neige', 'grandbeau'] },
  { id: 'auvergne', de: 'en Auvergne', lon: 2.9, lat: 45.4, r: 130, k: ['brouillard', 'neige', 'grandbeau'] },
  { id: 'alsace', de: 'en Alsace', lon: 7.5, lat: 48.3, r: 110, k: ['brouillard', 'canicule', 'grandbeau'] },
  { id: 'paris', de: 'en Île-de-France', lon: 2.35, lat: 48.85, r: 110, k: ['canicule', 'brouillard', 'grandbeau'] },
  { id: 'suisse', de: 'sur les Alpes suisses', lon: 8.2, lat: 46.6, r: 130, k: ['neige', 'brouillard', 'grandbeau'] },
  { id: 'ecosse', de: 'en Écosse', lon: -4.2, lat: 57.0, r: 250, k: ['tempete', 'brouillard', 'grandbeau'] },
  { id: 'islande', de: 'en Islande', lon: -19.0, lat: 64.9, r: 300, k: ['tempete', 'neige', 'grandbeau'] },
  { id: 'laponie', de: 'en Laponie', lon: 25.0, lat: 68.0, r: 350, k: ['neige', 'grandbeau'] },
  { id: 'andalousie', de: 'en Andalousie', lon: -4.5, lat: 37.4, r: 250, k: ['canicule', 'grandbeau'] },
  { id: 'sahara', de: 'sur le Sahara', lon: 5.0, lat: 25.0, r: 900, k: ['sable', 'canicule'] },
];
const WD_ZB = {}; WD_Z.forEach(z => { WD_ZB[z.id] = z; });
let wdWxC = { d: 0, l: [] };
function wdWeather() {
  if (WD_FWX) return WD_FWX.map(o => ({ z: WD_ZB[o.z], k: o.k })).filter(o => o.z && WD_K[o.k]);
  const d = wdDay(); if (wdWxC.d === d) return wdWxC.l;
  const m = Math.floor(d / 100) % 100;
  const ok = k => (k === 'canicule' ? m >= 6 && m <= 8 : k === 'neige' ? m >= 11 || m <= 4 : true);
  const l = WD_Z.slice().sort((a, b) => wdH(d + a.id) - wdH(d + b.id)).slice(0, 4).map(z => {
    const ks = z.k.filter(ok), k = ks.length ? ks[wdH(d + ':' + z.id) % ks.length] : 'grandbeau';
    return { z: z.id, k };
  });
  wdWxC = { d, l: l.map(o => ({ z: WD_ZB[o.z], k: o.k })) };
  return wdWxC.l;
}
// météo marquante à un endroit (ou null)
function wdAt(d) {
  if (!d || d.lon == null) return null;
  const o = wdWeather().find(x => wdKm(d, x.z) <= x.z.r);
  return o ? { z: o.z, k: o.k, K: WD_K[o.k] } : null;
}
const wdWxTxt = w => `${w.K.ico} ${w.K.nm} ${w.z.de} aujourd’hui : ${w.K.eff}`;
const wdClosed = (w, d) => !!(w && d && !d.poi && w.K.close.length && w.K.close.includes(wdCall(() => xpTerrOf(d), '')));
const wdFavor = d => { const w = wdAt(d); return !!(w && w.K.favor); };
// météo qui s'applique à un familier : son voyage, ou le départ en préparation
function wdWxFor(k) {
  const t = S.trips && S.trips[k];
  if (t) return t.wdx && WD_K[t.wdx.k] ? WD_K[t.wdx.k] : null;
  if (k === S.sel && plan && plan.dest) { const w = wdAt(plan.dest); return w ? w.K : null; }
  return null;
}

// ---------------- 3. lieux éphémères ----------------
const WD_EVK = [
  { id: 'nuit', ico: '🏮', nm: 'Marché de nuit', h: [18, 23], it: W3('Lampion du marché de nuit', 'm', 'lumiere', null, '#f2884e'), dish: W3('Crêpe du marché de nuit', 'n', 'sucre', null, '#e9c08a'), txt: 'Lampions, odeurs de crêpes et musique douce : {n} flâne entre les stands du marché de nuit.' },
  { id: 'festival', ico: '🎶', nm: 'Festival de musique', h: [14, 23], it: W3('Foulard du festival', 'v', 'cou', 'foulard', '#5fb0d9'), dish: W3('Barbe à papa du festival', 'n', 'sucre', null, '#f6b8d0'), txt: 'Sur la grande scène, un groupe joue et toute la foule danse. {n} tape dans ses pattes en rythme !' },
  { id: 'foraine', ico: '🎡', nm: 'Fête foraine', h: [13, 22], it: W3('Peluche de la fête foraine', 'd', 'statue', null, '#f08aa6'), dish: W3('Pomme d’amour', 'n', 'fruit', null, '#d9302a'), txt: 'Grande roue, autos tamponneuses et chamboule-tout : {n} gagne une peluche du premier coup !' },
  { id: 'brocante', ico: '🧺', nm: 'Brocante géante', h: [7, 14], it: W3('Vieille boussole de brocante', 'm', 'metal', null, '#c9a35a'), dish: W3('Tarte de grand-mère', 'n', 'sucre', null, '#d9a05a'), txt: 'Des kilomètres de stands ! {n} fouille dans un vieux coffre et déniche un trésor pour trois fois rien.' },
  { id: 'fromages', ico: '🧀', nm: 'Foire aux fromages', h: [9, 16], it: W3('Cloche à fromage de la foire', 'd', 'statue', null, '#f2d06a'), dish: W3('Tartine de la foire aux fromages', 'n', 'ble', null, '#f0c060'), txt: 'Ça sent bon le lait et le foin. {n} goûte vingt fromages et repart avec la recette du fermier.' },
  { id: 'feu', ico: '🎆', nm: 'Feu d’artifice', h: [21, 23.75], it: W3('Fusée du feu d’artifice', 'm', 'lumiere', null, '#b39ce0'), dish: W3('Chocolat chaud du feu d’artifice', 'n', 'sucre', null, '#7a4a30'), txt: 'Boum ! Des fleurs de lumière éclatent dans le ciel. {n} est assis aux premières loges, les yeux brillants.' },
];
const WD_EK = {}; WD_EVK.forEach(K => { WD_EK[K.id] = K; });
const WD_EU = [['Bruxelles', 4.3517, 50.8503], ['Genève', 6.1432, 46.2044], ['Turin', 7.6869, 45.0703], ['Barcelone', 2.1734, 41.3851], ['Fribourg-en-Brisgau', 7.8421, 47.999], ['Lausanne', 6.6323, 46.5197], ['Luxembourg', 6.1319, 49.6116], ['Bruges', 3.2247, 51.2093], ['Saint-Sébastien', -1.9812, 43.3183], ['Cologne', 6.9603, 50.9375], ['Milan', 9.19, 45.4642], ['Amsterdam', 4.9041, 52.3676], ['Londres', -0.1276, 51.5072]];
let wdEvC = { key: '', l: [] };
function wdEvents() {
  const d = wdDay(), H = homeObj(), key = d + ':' + H.name; if (wdEvC.key === key) return wdEvC.l;
  const y = Math.floor(d / 10000), m = Math.floor(d / 100) % 100, dd = d % 100, base = new Date(y, m - 1, dd).getTime();
  const ks = WD_EVK.slice().sort((a, b) => wdH(d + a.id) - wdH(d + b.id)).slice(0, 3), l = [];
  ks.forEach((K, i) => {
    const s = d + ':' + i, dur = K.id === 'feu' ? 2 : 2 + (wdH(s + 'd') % 3), span = Math.max(0, K.h[1] - K.h[0] - dur);
    const st = K.h[0] + Math.round(wdR(s + 'h') * span * 4) / 4;
    let o, name;
    const eu = WD_EU.filter(c => { const km = wdKm(H, { lon: c[1], lat: c[2] }); return km > 60 && km < 900; });
    if (i === 2 && eu.length) { const c = eu[wdH(s + 'c') % eu.length]; o = { lon: c[1], lat: c[2] }; name = `${K.nm} de ${c[0]}`; }
    else { o = wdOff(H, wdR(s + 'a') * 360, 12 + wdR(s + 'k') * 70); const n = wdNear(o, 40); name = n ? `${K.nm} près de ${n}` : `${K.nm} en pleine campagne`; }
    l.push({ id: `e${d}_${i}`, k: K.id, name, lon: +o.lon.toFixed(4), lat: +o.lat.toFixed(4), start: base + st * 3600e3, end: base + (st + dur) * 3600e3, tags: i === 2 ? ['ville'] : ['campagne'] });
  });
  wdEvC = { key, l }; return l;
}
const wdEvNow = () => { const n = wdNow(); return wdEvents().filter(E => E.start <= n && n < E.end); };
const wdEvById = id => wdEvents().find(E => E.id === id) || null;
const wdDot = () => !wdTuto() && wdEvNow().some(E => !wdState().seen[E.id] && !wdState().ev[E.id]);

// ---------------- 4. pistes d'animaux ----------------
const WD_TRW = ['la forêt', 'la rivière', 'les collines', 'les champs', 'le petit bois', 'l’étang', 'les haies', 'le vallon'];
function wdTrailSp(H) {
  let sp = null;
  wdCall(() => { const sc = nsScores({ lon: H.lon, lat: H.lat, tags: ['foret', 'montagne', 'campagne'] }, null).filter(x => x.w > 0).sort((a, b) => b.w - a.w); if (sc.length) sp = sc[0].sp; }, 0);
  if (!sp) { const L = ['renard', 'tanuki', 'lemur', 'quokka', 'fennec']; sp = L[wdH('sp' + wdDay() + wdState().trN) % L.length]; }
  return sp;
}
function wdTrailNew() {
  const W = wdState(), H = homeObj(), s = 'tr' + wdDay() + ':' + W.trN, n = 3 + (wdR(s + 'n') < 0.5 ? 1 : 0);
  const pts = [wdOff(H, wdR(s + 'a') * 360, 6 + wdR(s + 'k') * 14)];
  for (let i = 1; i < n; i++) {
    const prev = pts[i - 1], a0 = Math.floor(wdR(s + 'd' + i) * 8);
    let p = null;
    for (let j = 0; j < 8 && !p; j++) { const q = wdOff(prev, ((a0 + j) % 8) * 45, 10 + wdR(s + 'm' + i) * 10); if (wdKm(H, q) <= 45) p = q; }
    pts.push(p || wdOff(prev, a0 * 45, 12));
  }
  const near = wdNear(pts[0], 40);
  W.tr = { id: s, sp: wdTrailSp(H), pts: pts.map(p => ({ lon: +p.lon.toFixed(4), lat: +p.lat.toFixed(4), w: WD_TRW[wdH(s + p.lon) % WD_TRW.length] })), i: 0, tries: 0, near: near || '', at: Date.now() };
  W.trLast = wdDay(); W.trN++; save();
  return W.tr;
}
const wdTrTol = (T, i) => (i === 0 ? 4 : Math.max(4, 0.35 * wdKm(T.pts[i - 1], T.pts[i])));
function wdTrHint(T) {
  if (!T) return '';
  if (T.i === 0) return `Des traces fraîches de ${wdCall(() => nsLow(T.sp), T.sp)} ont été vues ${T.near ? `près de ${T.near}` : 'près de chez vous'}. Envoyez un familier à l’épingle (patte) !`;
  const a = T.pts[T.i - 1], b = T.pts[T.i], km = Math.max(5, Math.round(wdKm(a, b) / 5) * 5);
  return `Les traces filent vers ${b.w}, ~${km} km plus vers ${wdDir(a, b)}. Une patte les marque sur la carte : suivez-les !`;
}
const wdSpName = sp => wdCall(() => nsLow(sp), sp);
function wdRareGenes(sp) {
  let best = null, br = -1;
  for (let i = 0; i < 40 && br < 2; i++) { const g = wdCall(() => rollGenes(sp, 3), null), r = g ? wdCall(() => geneRarityOf(g, sp), 0) : 0; if (g && r > br) { best = g; br = r; } }
  return { genes: best, rarity: Math.max(2, br) };
}

// ---------------- à l'arrivée ----------------
function wdLog(t, o) { (t.wdLog = Array.isArray(t.wdLog) ? t.wdLog : []).push(o); }
function wdJ(t, text, chips) { t.journal.push({ t: Date.now(), kind: 'wld', place: t.dest.name, tags: t.dest.tags || ['campagne'], text, chips: chips || [] }); S.unseen[t.comp] = (S.unseen[t.comp] || 0) + 1; }
const wdTx = (s, k) => wdCall(() => avTxt(s, k), String(s).replace(/\{n\}/g, wdNm(k)));
function wdPhoto(t, title, extra) { const p = { id: uidGen(), comps: [t.comp], tags: t.dest.tags || ['campagne'], place: t.dest.name, country: '', hour: new Date().getHours(), weather: 'clair', title, date: Date.now(), ...extra }; t.photos.push(p); return p; }
function wdGive(t, def, from, extra) { const it = makeItem(def, 0, from, t.dest.tags || [], { fixed: def[3] }); it.special = true; it.wd = 1; Object.assign(it, extra || {}); t.bag.push(it); return it; }
function wdOnArrive(t) {
  const k = t.comp, d = t.dest, W = wdState(); if (!d || t.wdArr) return; t.wdArr = 1;
  // 1. moment rare
  for (const M of WD_MOM) {
    if (wdKm(d, M) > M.r) continue;
    const st = wdMoState(M);
    if (!st.now) { if (st.season || M.tide) { wdJ(t, `${wdNm(k)} est au bon endroit pour « ${M.nm} »… mais pas au bon moment : ${st.wait}.`, [['rumor', 'pas le bon moment']]); wdLog(t, { k: 'mowait', m: M.id, wait: st.wait }); } continue; }
    if (st.got) { wdJ(t, wdTx(`« ${M.nm} » : toujours aussi magnifique. {n} en profite, les yeux grands ouverts.`, k), [['photo', M.nm]]); continue; }
    W.mo[M.id] = wdDate().getFullYear();
    const it = wdGive(t, M.it, `Moment rare : ${M.nm}`), ph = wdPhoto(t, `${wdNm(k)} : ${M.nm}`, { wdm: M.id });
    wdJ(t, wdTx(M.txt, k), [['rare', 'moment rare'], ['photo', 'photo unique']]);
    wdLog(t, { k: 'mo', m: M.id, it: it.name, ph: ph.title });
  }
  // 2. lieu éphémère
  const E = d.wdev ? wdEvById(d.wdev) : wdEvents().find(x => wdKm(d, x) <= 3);
  if (E) {
    const n = wdNow(), K = WD_EK[E.k], open = (E.start <= n && n < E.end) || (d.wdev === E.id && t.wdevOk);
    if (!open) { wdJ(t, `${wdNm(k)} arrive : ${E.name}… ${n >= E.end ? 'trop tard, la fête est finie ! Il ne reste que des confettis.' : 'trop tôt, les stands ne sont pas encore montés.'}`, [['back', n >= E.end ? 'fini' : 'trop tôt']]); wdLog(t, { k: 'evko', e: E.id, name: E.name, late: n >= E.end }); }
    else if (!W.ev[E.id]) {
      W.ev[E.id] = 1;
      const a = wdGive(t, K.it, E.name), b = wdGive(t, K.dish, E.name);
      wdJ(t, wdTx(K.txt, k), [['place', E.name], ['rare', 'objets uniques']]);
      wdLog(t, { k: 'ev', e: E.id, name: E.name, ico: K.ico, its: [a.name, b.name] });
    }
  }
  // 3. piste d'animal
  const T = W.tr;
  if (T && T.i < T.pts.length) {
    const P = T.pts[T.i], km = wdKm(d, P);
    if (km <= wdTrTol(T, T.i)) {
      T.i++;
      if (T.i >= T.pts.length) {
        // v33 : récompense d'Exploration (trésor unique + titre + pièces + XP), plus d'œuf ni de pierres d'étoile
        const sn = wdSpName(T.sp), it = wdGive(t, [`Empreinte moulée du ${sn}`, 'd', 'statue', 4, null, '#b08a5a'], `Traque : ${sn}`), ti = `Pisteur du ${sn}`;
        const X = wdCall(() => xpState(), null); if (X) { const a = Array.isArray(X.titles[k]) ? X.titles[k] : (X.titles[k] = []); if (!a.includes(ti)) a.push(ti); }
        const cn = 150 + 60 * T.pts.length; t.coins = (t.coins || 0) + cn; wdCall(() => xpGain(k, t.xpTerr || xpTerrOf(d), 20 * T.pts.length), 0);
        wdJ(t, `Au bout des traces, dans un nid de feuilles : un ${sn} sauvage ! ${wdNm(k)} l’observe sans bruit, puis moule une empreinte parfaite dans la terre.`, [['wild', 'traque réussie'], ['rare', 'trésor unique']]);
        wdLog(t, { k: 'trend', sp: T.sp, it: it.name, ti, coins: cn }); W.tr = null; W.trDone = (W.trDone || 0) + 1;
      } else {
        const h = wdTrHint(T); wdJ(t, `${wdNm(k)} retrouve les traces du ${wdSpName(T.sp)} ! ${h}`, [['wild', `piste ${T.i}/${T.pts.length}`]]);
        wdLog(t, { k: 'tr', sp: T.sp, i: T.i, n: T.pts.length, h });
      }
    } else if (km < 120 && T.i > 0) {
      T.tries = (T.tries || 0) + 1;
      const heat = km < 8 ? 'Vous brûlez !' : km < 25 ? 'Vous chauffez…' : 'C’est encore loin.';
      const txt = `Pas de traces ici… elles doivent être plus vers ${wdDir(d, P)}. ${heat}`;
      wdJ(t, `${wdNm(k)} renifle partout. ${txt}`, [['back', 'pas de traces']]); wdLog(t, { k: 'trko', txt });
    }
  }
  save();
}
if (typeof fireEvent === 'function') fireEvent = (orig => function (t, e) {
  const r = orig.apply(this, arguments);
  try { if (e && e.type === 'arrivee' && t && !t.tuto && !wdTuto()) wdOnArrive(t); } catch (err) { console.error('monde arrivée', err); }
  return r;
})(fireEvent);

// ---------------- départ : météo, fermetures, risques ----------------
if (typeof xpRiskK === 'function') xpRiskK = (orig => function () {
  const r = orig.apply(this, arguments);
  try { const K = wdWxFor(arguments[0]); if (K && r > 0) return Math.max(0.03, Math.min(0.9, r * K.risk)); } catch (e) {}
  return r;
})(xpRiskK);
if (typeof xpIsExpe === 'function') xpIsExpe = (orig => function (d) {
  if (orig.apply(this, arguments)) return true;
  try { if (d && !d.poi && !wdTuto()) { const w = wdAt(d); if (w && w.K.risk > 1) return true; } } catch (e) {}
  return false;
})(xpIsExpe);
// grand beau : la maîtrise demandée par les lieux à cadenas baisse de 2 aujourd'hui
if (typeof xpConds === 'function') xpConds = (orig => function (P, k) {
  const out = orig.apply(this, arguments);
  try {
    if (P && wdFavor(P)) P.need.forEach(([ty, a, n], i) => { const c = out[i]; if (ty === 'm' && c && !c.ok && xpLvl(k, a) >= n - 2) { c.ok = true; c.lbl += ' (−2 grâce au grand beau)'; } });
  } catch (e) {}
  return out;
})(xpConds);
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, dest = plan.dest, tu = wdTuto();
  let w = null;
  try { if (dest && !tu) { w = wdAt(dest); if (wdClosed(w, dest)) { toast(`${w.K.ico} ${w.K.nm} ${w.z.de} : ce lieu est fermé aujourd’hui. Choisissez une autre destination !`); return; } } } catch (e) {}
  const before = S.trips[k], r = orig.apply(this, arguments);
  try {
    const t = S.trips[k];
    if (t && t !== before && !t.tuto && dest && !tu) {
      if (w) {
        t.wdx = { z: w.z.id, k: w.k };
        if (w.K.favor) t.luck += 0.6;
        t.journal.push({ t: Date.now(), kind: 'wld', text: `${wdWxTxt(w)}.${w.K.favor ? ` ${wdNm(k)} part le cœur léger.` : ` ${wdNm(k)} resserre son sac : prudence !`}` });
      }
      if (dest.wdev) { const E = wdEvById(dest.wdev), n = wdNow(); t.wdevOk = !!(E && E.start <= n && n < E.end); }
      save();
    }
  } catch (e) { console.error('monde départ', e); }
  return r;
})(startTrip);
function wdGoHTML(d) {
  let h = '';
  const w = wdAt(d);
  if (w) h += `<div class="wdgo k-${w.k}${wdClosed(w, d) ? ' shut' : ''}">${esc(wdWxTxt(w))}${wdClosed(w, d) ? '<b> · fermé aujourd’hui</b>' : ''}</div>`;
  const M = WD_MOM.find(x => wdKm(d, x) <= x.r);
  if (M) { const st = wdMoState(M); if (st.season || M.tide) h += `<div class="wdgo mo">${M.ico} Moment rare : ${esc(M.nm)} · ${st.got ? 'déjà vécu cette année' : st.now ? '<b>c’est maintenant !</b>' : esc(st.wait)}</div>`; }
  const E = d.wdev ? wdEvById(d.wdev) : null;
  if (E) { const n = wdNow(), K = WD_EK[E.k]; h += `<div class="wdgo ev">${K.ico} ${esc(E.name)} · ${n < E.start ? `ouvre à ${wdHHMM(E.start)}` : n < E.end ? `<b>encore ${wdDur(E.end - n)}</b>` : 'terminé'} · ${esc(K.it[0])}, ${esc(K.dish[0])}</div>`; }
  return h;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const k = S.sel, d = plan.dest;
    if (box && d && !S.trips[k] && CHARS[k] && !wdTuto()) {
      const html = wdGoHTML(d);
      if (html) { const gb = box.querySelector('.gobar'); if (gb) gb.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
      if (wdClosed(wdAt(d), d)) { const b = box.querySelector('#goBtn'); if (b) b.disabled = true; }
    }
  } catch (e) { console.error('monde panneau', e); }
  return r;
})(renderVoyage);

// ---------------- aventure vécue : la scène suit la météo du jour ----------------
function wdTripWx(t) {
  if (!t || !t.dest || t.tuto) return null;
  if (t.wdx && WD_K[t.wdx.k] && WD_ZB[t.wdx.z]) return { z: WD_ZB[t.wdx.z], k: t.wdx.k, K: WD_K[t.wdx.k] };
  return null;
}
if (typeof avWeather === 'function') avWeather = (orig => function (t) {
  try { if (!(typeof AV_FORCE !== 'undefined' && AV_FORCE.wx)) { const w = wdTripWx(t); if (w) return w.K.wx; } } catch (e) {}
  return orig.apply(this, arguments);
})(avWeather);
if (typeof avRender === 'function') avRender = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const v = $('avView'), t = typeof avK !== 'undefined' && avK ? S.trips[avK] : null, w = wdTripWx(t), sp = v && !v.hidden && v.querySelector('.avh span');
    if (w && sp && !sp.querySelector('.wdav')) sp.insertAdjacentHTML('beforeend', ` <i class="wdav">· ${w.K.ico} ${esc(w.K.nm.toLowerCase())} ${esc(w.z.de)}</i>`);
  } catch (e) {}
  return r;
})(avRender);

// ---------------- au retour : le butin ----------------
let wdHaul = null;
if (typeof collect === 'function') collect = (orig => function () {
  const k = S.sel, t = S.trips[k];
  wdHaul = null;
  try { if (t && t.done && !t.tuto && Array.isArray(t.wdLog) && t.wdLog.length) wdHaul = { k, log: t.wdLog.slice(), at: Date.now() }; } catch (e) {}
  return orig.apply(this, arguments);
})(collect);
function wdHaulHTML(H) {
  const rows = H.log.map(L => {
    if (L.k === 'mo') { const M = WD_M[L.m]; return `<div class="wdh ok"><span class="wdh-i">${M.ico}</span><span><b>Moment rare : ${esc(M.nm)} !</b><small>${esc(L.it)} · photo « ${esc(L.ph)} » (album)</small></span></div>`; }
    if (L.k === 'mowait') { const M = WD_M[L.m]; return `<div class="wdh"><span class="wdh-i">${M.ico}</span><span><b>${esc(M.nm)} : pas le bon moment.</b><small>${esc(L.wait)}.</small></span></div>`; }
    if (L.k === 'ev') return `<div class="wdh ok"><span class="wdh-i">${L.ico}</span><span><b>${esc(L.name)}</b><small>Souvenirs uniques : ${L.its.map(esc).join(' · ')}</small></span></div>`;
    if (L.k === 'evko') return `<div class="wdh"><span class="wdh-i">🎪</span><span><b>${esc(L.name)} : ${L.late ? 'la fête était finie' : 'trop tôt'}.</b><small>Les lieux éphémères ne durent que quelques heures : regardez le compte à rebours sur la carte.</small></span></div>`;
    if (L.k === 'tr') return `<div class="wdh tr"><span class="wdh-i">🐾</span><span><b>Piste du ${esc(wdSpName(L.sp))} : étape ${L.i}/${L.n}</b><small>${esc(L.h)}</small></span></div>`;
    if (L.k === 'trko') return `<div class="wdh"><span class="wdh-i">🐾</span><span><b>Pas de traces ici.</b><small>${esc(L.txt)}</small></span></div>`;
    if (L.k === 'trend') return `<div class="wdh ok"><span class="wdh-i">🐾</span><span><b>Traque réussie : un ${esc(wdSpName(L.sp))} sauvage !</b><small>${L.it ? `${esc(L.it)} · titre « ${esc(L.ti)} » · +${L.coins} pièces` : 'Œuf de variante rare (nurserie)'}</small></span></div>`;
    return '';
  }).join('');
  return rows ? `<div class="wd-haul">${rows}</div>` : '';
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const H = wdHaul;
    if (H && h && h.comp === H.k && Date.now() - H.at < 30000) {
      wdHaul = null;
      const html = wdHaulHTML(H), mb = document.querySelector('#modal .mbox'), hd = mb && mb.querySelector('.hhead');
      if (html) { if (hd) hd.insertAdjacentHTML('afterend', html); else if (mb) mb.insertAdjacentHTML('afterbegin', html); }
    }
  } catch (e) { console.error('monde butin', e); }
  return r;
})(showHaul);

// ---------------- aller quelque part ----------------
function wdDestOf(s) {
  const [ty, id] = String(s).split(':');
  if (ty === 'm') { const M = WD_M[id]; return M && { id: null, name: M.where, country: '', lat: M.lat, lon: M.lon, tags: M.tags.slice(), special: null, wdm: M.id }; }
  if (ty === 'e') { const E = wdEvById(id); return E && { id: null, name: E.name, country: '', lat: E.lat, lon: E.lon, tags: E.tags.slice(), special: null, wdev: E.id }; }
  if (ty === 'p') { const T = wdState().tr, P = T && T.pts[T.i]; return P && { id: null, name: `Traces du ${wdSpName(T.sp)}`, country: '', lat: P.lat, lon: P.lon, tags: ['foret', 'campagne'], special: null }; }
  return null;
}
function wdGo(s) {
  const d = wdDestOf(s); if (!d) return;
  const m = $('modal'); if (m) m.hidden = true;
  if (S.trips[S.sel]) { wdCall(() => openSheet('voyage'), 0); toast(`${wdNm(S.sel)} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; }
  plan.dest = d; openSheet('voyage'); drawMarks();
  wdCall(() => zoomTo(d.lon, d.lat), 0);
}
function wdLook(o) {
  const m = $('modal'); if (m) m.hidden = true;
  wdCall(() => closeSheet(), 0);
  wdCall(() => map.flyTo({ center: [o.lon, o.lat], zoom: 8, essential: true }), 0);
}

// ---------------- carte : petites icônes quand on zoome ----------------
const WD_ZOOM = 4, WD_ZOOM_EV = 5;
let wdPinSig = '', wdHooked = false;
function wdPinList() {
  const z = map.getZoom(), c = map.getContainer(), Wd = c.clientWidth, Hh = c.clientHeight, out = [];
  const inView = o => { const p = map.project([o.lon, o.lat]); return p.x > 12 && p.y > 50 && p.x < Wd - 12 && p.y < Hh - 50 ? Math.hypot(p.x - Wd / 2, p.y - Hh / 2) : -1; };
  const n = wdNow();
  if (z >= WD_ZOOM_EV) {
    wdEvents().filter(E => E.start <= n && n < E.end).forEach(E => { const dd = inView(E); if (dd >= 0) out.push({ key: 'e:' + E.id, lon: E.lon, lat: E.lat, ico: WD_EK[E.k].ico, lbl: `${WD_EK[E.k].nm} · ${wdDur(E.end - n)}`, cls: 'ev', d: dd - 1e4 }); });
    const T = wdState().tr; if (T && T.i < T.pts.length) { const P = T.pts[T.i], dd = inView(P); if (dd >= 0) out.push({ key: 'p:' + T.id + T.i, go: true, lon: P.lon, lat: P.lat, ico: '🐾', lbl: `Traces ${T.i + 1}/${T.pts.length}`, cls: 'tr', d: dd - 5e3 }); }
  }
  if (z >= WD_ZOOM) WD_MOM.forEach(M => { const st = wdMoState(M); if (!st.season && !M.tide) return; const dd = inView(M); if (dd >= 0) out.push({ key: 'm:' + M.id, lon: M.lon, lat: M.lat, ico: M.ico, lbl: '', cls: 'mo' + (st.now ? ' now' : ''), d: dd }); });
  return out.sort((a, b) => a.d - b.d).slice(0, 4);
}
function wdMapUpdate() {
  if (typeof map === 'undefined' || !map || typeof ovEls === 'undefined' || !$('ov')) return;
  const on = tab === 'carte' && !document.body.classList.contains('firstrun') && !wdTuto();
  const list = on ? wdPinList() : [];
  const sig = list.map(o => o.key + o.lbl + o.cls).join(','), alive = list.every((o, i) => ovEls['wd' + i] && ovEls['wd' + i].el.isConnected);
  if (sig === wdPinSig && alive) return;
  wdPinSig = sig;
  for (const key of Object.keys(ovEls)) if (key.startsWith('wd')) { ovEls[key].el.remove(); delete ovEls[key]; }
  list.forEach((o, i) => {
    const el = document.createElement('div');
    el.className = 'ovm wdpin ' + o.cls; el.dataset.wdgo = o.cls.startsWith('tr') && !o.go ? 'look:' + o.lon + ':' + o.lat : (o.key.startsWith('p:') ? 'p:0' : o.key);
    el.innerHTML = `<span class="wdb" aria-hidden="true">${o.ico}</span>${o.lbl ? `<span class="wdn">${esc(o.lbl)}</span>` : ''}`;
    el.setAttribute('aria-label', o.lbl || (WD_M[o.key.slice(2)] || {}).nm || 'Lieu');
    $('ov').appendChild(el); ovEls['wd' + i] = { el, lon: o.lon, lat: o.lat };
  });
  if (typeof positionOverlay === 'function') positionOverlay();
}
try {
  $('ov').addEventListener('click', ev => {
    const m = ev.target.closest('.wdpin'); if (!m) return;
    const g = m.dataset.wdgo;
    if (g.startsWith('look:')) { const [, lon, lat] = g.split(':'); toast('Dernières traces repérées ici. Devinez où elles mènent (Quêtes › Pistes) !'); wdLook({ lon: +lon, lat: +lat }); return; }
    wdGo(g);
  });
} catch (e) {}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); try { wdMapUpdate(); } catch (e) {} return r; })(drawMarks);
setInterval(() => {
  try {
    if (document.hidden) return;
    if (!wdHooked && typeof map !== 'undefined' && map && map.on) { wdHooked = true; map.on('moveend', () => { try { wdMapUpdate(); } catch (e) {} }); }
    wdMapUpdate();
  } catch (e) {}
}, 2000);

// ---------------- bouton Quêtes : un petit point quand un lieu éphémère est ouvert ----------------
if (typeof qtBtns === 'function') qtBtns = (orig => function () {
  const r = orig.apply(this, arguments);
  try { const d = document.querySelector('#qtBtns .qt-dot'); if (d && d.hidden && wdDot()) d.hidden = false; } catch (e) {}
  return r;
})(qtBtns);

// ---------------- page Quêtes : section « Monde » et petits onglets ----------------
const wdMoDif = M => Math.min(3, (M.tide ? 1 : M.h ? 2 : 1) + (wdKm(homeObj(), M) > 3000 ? 1 : 0));
function wdMomentsHTML() {
  const rows = WD_MOM.map(M => ({ M, st: wdMoState(M), soon: wdMoSoon(M) }));
  const now = rows.filter(o => o.st.season || o.M.tide).sort((a, b) => (b.st.now - a.st.now) || (a.st.got - b.st.got));
  const soon = rows.filter(o => !o.st.season && !o.M.tide && o.soon <= 45).sort((a, b) => a.soon - b.soon);
  const row = (o, s) => `<div class="wd-row${o.st.got ? ' done' : ''}${o.st.now ? ' now' : ''}"><span class="wd-ri">${o.M.ico}</span><div><b>${esc(o.M.nm)}</b><small>${esc(o.M.where)} · ${s}</small>${o.st.got ? '' : wdCall(() => qmMeta('monde', wdMoDif(o.M), [o.M.it[1] === 'v' ? 'Tenue de saison' : 'Objet de saison', 'Photo d’album']), '')}</div>${o.st.got ? '<span class="wd-ok">✔</span>' : `<button class="btn ${o.st.now ? 'green' : 'cream'} sm" data-wdgo="m:${o.M.id}">Y aller</button>`}</div>`;
  let h = `<h3 class="qt-h3">🌸 Moments de saison <small>vraie date, heure locale du lieu</small></h3>`;
  h += now.length ? `<p class="wd-sub">En ce moment</p>${now.map(o => row(o, o.st.got ? 'déjà vécu cette année' : o.st.now ? '<b>c’est maintenant !</b>' : esc(o.st.wait))).join('')}` : '';
  h += soon.length ? `<p class="wd-sub">Bientôt</p>${soon.map(o => row(o, `dans ${o.soon} jour${o.soon > 1 ? 's' : ''} · ${esc(o.M.when)}`)).join('')}` : '';
  if (!now.length && !soon.length) h += '<p class="qt-hint">Aucun moment rare en ce moment. Revenez bientôt !</p>';
  return h;
}
function wdWxHTML() {
  if (!wdWeather().length) return '';
  return `<h3 class="qt-h3">⛅ Météo du jour <small>elle change les risques et le butin</small></h3><div class="wd-wx">${wdWeather().map(o => { const K = WD_K[o.k]; return `<span class="wd-wc k-${o.k}">${K.ico} <b>${esc(K.nm)}</b> ${esc(o.z.de)}<small>${esc(K.eff)}</small></span>`; }).join('')}</div>`;
}
function wdEventsHTML() {
  const n = wdNow(), W = wdState(), l = wdEvents().filter(E => E.end > n);
  let h = `<h3 class="qt-h3">🎪 Lieux éphémères <small>quelques heures seulement</small></h3>`;
  if (!l.length) return h + '<p class="qt-hint">Plus de fête aujourd’hui. Demain, de nouveaux lieux apparaîtront !</p>';
  return h + l.map(E => {
    const K = WD_EK[E.k], open = E.start <= n, got = W.ev[E.id], km = Math.round(wdKm(homeObj(), E));
    return `<div class="wd-row ev${open ? ' now' : ''}${got ? ' done' : ''}"><span class="wd-ri">${K.ico}</span><div><b>${esc(E.name)}</b><small>${open ? `<b>ouvert · encore ${wdDur(E.end - n)}</b>` : `de ${wdHHMM(E.start)} à ${wdHHMM(E.end)}`} · ${km} km · ${esc(K.it[0])}, ${esc(K.dish[0])}</small>${got ? '' : wdCall(() => qmMeta('monde', E.tags[0] === 'ville' ? 2 : 1, ['Objet de saison']), '')}</div>${got ? '<span class="wd-ok">✔</span>' : open ? `<button class="btn green sm" data-wdgo="e:${E.id}">Y aller</button>` : ''}</div>`;
  }).join('');
}
function wdTrailHTML() {
  const W = wdState(), T = W.tr, dif = T ? Math.max(1, T.pts.length - 2) : 1;
  let h = `<h3 class="qt-h3" id="wdPistes">🐾 Traques <small>suivez les traces d’un animal dans la nature · ${W.trDone || 0} réussie${(W.trDone || 0) > 1 ? 's' : ''}</small></h3>`;
  const meta = wdCall(() => qmMeta('explo', dif, ['Trésor unique', 'Titre']), '');
  if (T) {
    const pips = T.pts.map((_, i) => `<i class="${i < T.i ? 'on' : ''}"></i>`).join('');
    return h + `<div class="wd-tr"><span class="wd-ri">🐾</span><div><b>Traque du ${esc(wdSpName(T.sp))} · ${T.i + 1}/${T.pts.length}</b>${meta}<span class="my-pips">${pips}</span><small>${esc(wdTrHint(T))}</small><div class="my-acts"><button class="btn green sm" data-wdgo="p:0">Suivre les traces</button></div></div></div>`;
  }
  if (W.trLast === wdDay()) return h + '<p class="qt-hint">Nouvelles traces demain !</p>';
  return h + `<div class="wd-tr"><span class="wd-ri">🐾</span><div><b>Des traces fraîches près de chez vous</b>${meta}<small>Un animal sauvage est passé par la forêt et les champs. Suivez ses traces de lieu en lieu (3 ou 4 étapes).</small><div class="my-acts"><button class="btn gold sm" data-wdtr="1">Commencer la traque</button></div></div></div>`;
}
function wdSectionHTML() {
  return `<section class="wd-sec"><h3 class="qt-h3" id="wdMonde">Le monde qui vit <small>météo, moments rares, fêtes, pistes</small></h3>${wdCall(wdWxHTML, '')}${wdCall(wdEventsHTML, '')}${wdCall(wdMomentsHTML, '')}${wdCall(wdTrailHTML, '')}</section>`;
}
if (typeof qtPageHTML === 'function') qtPageHTML = (orig => function () {
  let h = orig.apply(this, arguments);
  try {
    if (wdTuto()) return h;
    const W = wdState(); wdEvNow().forEach(E => { W.seen[E.id] = 1; });
    const hist = '<h3 class="qt-h3">Histoires', defi = '<h3 class="qt-h3">Défis';
    let at = h.indexOf(hist); if (at < 0) at = h.indexOf('<div class="qt-acts">');
    if (at < 0) return h;
    h = h.slice(0, at) + wdSectionHTML() + h.slice(at);
    // ancres (sans toucher aux titres existants)
    const add = (needle, id) => { const i = h.indexOf(needle); if (i >= 0) h = h.slice(0, i) + `<i class="wd-anc" id="${id}"></i>` + h.slice(i); return i >= 0; };
    const big = h.indexOf('<div class="qt-big">'), hi = h.indexOf(hist);
    const tabs = [];
    if ((big >= 0 && big < hi) ? add('<div class="qt-big">', 'wdA_hist') : add(hist, 'wdA_hist')) tabs.push(['wdA_hist', 'Histoires']);
    if (h.includes('id="myEnigmes"')) tabs.push(['myEnigmes', 'Énigmes']);
    if (h.includes('id="myGardiens"')) tabs.push(['myGardiens', 'Gardiens']);
    tabs.push(['wdMonde', 'Monde']);
    if (add(defi, 'wdA_def')) tabs.push(['wdA_def', 'Défis']);
    const bar = `<nav class="wd-tabs" aria-label="Sections de la page Quêtes">${tabs.map(([id, l]) => `<button data-wdtab="${id}">${l}</button>`).join('')}</nav>`;
    const top = h.indexOf('<div class="qt-top">'), end = top >= 0 ? h.indexOf('</div>', top) : -1;
    if (end >= 0) h = h.slice(0, end + 6) + bar + h.slice(end + 6);
  } catch (e) { console.error('monde page', e); }
  return h;
})(qtPageHTML);
function wdRefresh() {
  const m = $('modal'); if (!m || m.hidden || !m.querySelector('.qt-page')) return;
  const mb = m.querySelector('.mbox'), y = mb.scrollTop; showModal(qtPageHTML()); mb.scrollTop = y;
}

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-wdgo],[data-wdtab],[data-wdtr],[data-wdlook]');
  if (!el || el.disabled || el.closest('#ov')) return;
  const d = el.dataset;
  if (d.wdtab) { const t = document.getElementById(d.wdtab), mb = el.closest('.mbox'); if (t && mb) { mb.scrollLeft = 0; mb.scrollTo({ top: Math.max(0, mb.scrollTop + t.getBoundingClientRect().top - mb.getBoundingClientRect().top - 84), behavior: 'smooth' }); } else if (t) t.scrollIntoView({ block: 'start' }); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); return; }
  if (d.wdtr) { if (!wdState().tr) { wdTrailNew(); wdCall(() => sfx('pop'), 0); toast('Traque lancée ! Une patte marque les traces sur la carte.'); } wdRefresh(); return; }
  if (d.wdlook) { const T = wdState().tr; if (T && T.i > 0) { wdLook(T.pts[T.i]); } return; }
  if (d.wdgo) wdGo(d.wdgo);
});

// ---------------- style ----------------
(function wdCSS() {
  const st = document.createElement('style'); st.id = 'wdCSS';
  st.textContent = `
.qt-page{min-width:0}
.wd-tabs{position:sticky;top:33px;z-index:4;display:flex;flex-wrap:wrap;gap:5px;margin:0 0 8px;padding:6px 0;background:var(--paper,#fffaf0)}
.wd-tabs button{padding:4px 9px;border-radius:999px;border:2px solid var(--line,#e2d3bd);background:#fff;font:800 12px var(--display,inherit);color:var(--ink,#4a3528);cursor:pointer}
.wd-tabs button.on{background:var(--ink,#4a3528);color:#fff;border-color:var(--ink,#4a3528)}
.qt-page [id]{scroll-margin-top:84px}.wd-anc{display:block;height:0}
.wd-sec{display:flex;flex-direction:column;gap:5px}
.wd-h4{margin:8px 0 2px;font:800 14.5px var(--display,inherit)}.wd-h4 small{font:600 11.5px var(--body,inherit);color:var(--ink2,#7a6250)}
.wd-sub{margin:2px 0 0;font:800 11.5px var(--display,inherit);text-transform:uppercase;letter-spacing:.04em;color:var(--ink2,#7a6250)}
.wd-row,.wd-tr{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:12px;background:#fffaf0;border:1.6px solid var(--line,#e2d3bd)}
.wd-row>div,.wd-tr>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.wd-row b,.wd-tr>div>b{font-size:13px;line-height:1.25}
.wd-row small,.wd-tr small{font-size:11.5px;line-height:1.3;color:var(--ink2,#7a6250)}
.wd-row.now{border-color:#3f9a5f;background:#eef8ee}.wd-row.ev.now{border-color:#e0a52a;background:#fff8dc}.wd-row.done{opacity:.7}
.wd-ri{width:30px;height:30px;flex:none;border-radius:50%;background:#fff;border:1.5px solid var(--line,#e2d3bd);display:flex;align-items:center;justify-content:center;font-size:17px}
.wd-ok{color:#2f7f4c;font-weight:900}
.wd-wx{display:flex;flex-wrap:wrap;gap:5px}
.wd-wc{display:flex;flex-direction:column;flex:1 1 150px;padding:5px 8px;border-radius:12px;background:#f2f7fb;border:1.6px solid #b9cfe0;font-size:12.5px}
.wd-wc small{font-size:11px;color:var(--ink2,#7a6250)}.wd-wc.k-grandbeau{background:#fff8dc;border-color:#e0c06a}.wd-wc.k-tempete,.wd-wc.k-sable{background:#eef0f6;border-color:#8f9ab8}
.wd-tr{border:2px solid #8a6a3e;background:#f6efe2;align-items:flex-start}
.wdgo{margin:6px 0;padding:5px 9px;border-radius:12px;border:2px solid #b9cfe0;background:#f2f7fb;font-size:12.5px;line-height:1.3;color:var(--ink,#4a3528)}
.wdgo.k-grandbeau{border-color:#e0c06a;background:#fff8dc}.wdgo.shut{border-color:#c9604f;background:#fff1ea}.wdgo.mo{border-color:#9bd1a8;background:#eef8ee}.wdgo.ev{border-color:#e0a52a;background:#fff8dc}
.wdav{font-style:normal}
.wd-haul{display:flex;flex-direction:column;gap:6px;margin:8px 0}
.wdh{display:flex;align-items:center;gap:8px;padding:7px 10px;border:2px solid var(--line,#e2d3bd);border-radius:14px;background:#f6f1e8}
.wdh>span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}.wdh b{font:800 14px/1.2 var(--display,inherit)}.wdh small{font-size:12px;line-height:1.3;color:var(--ink2,#7a6250)}
.wdh.ok{background:linear-gradient(180deg,#fff6c8,#fffaf0);border-color:#e0a52a}.wdh.tr{background:#f3e9d2;border-color:#8a6a3e}
.wdh-i{width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center;font-size:22px}
.wdpin{z-index:3}.wdpin .wdb{display:flex;align-items:center;justify-content:center;width:24px;height:24px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(255,250,240,.9);border:1.5px solid rgba(74,53,40,.55);font-size:13px;box-shadow:0 1px 0 rgba(74,53,40,.25)}
.wdpin.mo{opacity:.85}.wdpin.mo.now .wdb{border-color:#3f9a5f;box-shadow:0 0 0 3px rgba(63,154,95,.25)}
.wdpin.ev .wdb{width:30px;height:30px;font-size:17px;border:2px solid #e0a52a;background:#fff8dc}.wdpin.tr .wdb{border-color:#8a6a3e;background:#f3e9d2}
.wdpin .wdn{position:absolute;left:0;top:14px;transform:translateX(-50%);white-space:nowrap;font:800 10.5px var(--display,inherit);color:var(--ink,#4a3528);background:rgba(255,250,240,.92);border:1.5px solid var(--ink,#4a3528);border-radius:999px;padding:0 6px}
`;
  document.head.appendChild(st);
})();

window.__wld = {
  state: wdState, MOMENTS: WD_MOM, ZONES: WD_Z, KINDS: WD_K, weather: wdWeather, at: wdAt, closed: d => wdClosed(wdAt(d), d), events: wdEvents, eventsNow: wdEvNow,
  moState: id => wdMoState(WD_M[id]), dest: wdDestOf, go: wdGo, trailNew: wdTrailNew, trailHint: () => wdTrHint(wdState().tr), mapUpdate: wdMapUpdate, dot: wdDot,
  setDate: iso => { WD_OFF = iso ? new Date(iso).getTime() - Date.now() : 0; wdWxC = { d: 0, l: [] }; wdEvC = { key: '', l: [] }; return wdDay(); },
  forceWx: l => { WD_FWX = l || null; return wdWeather().map(o => o.z.id + ':' + o.k); },
  risk: (...a) => xpRiskK(...a), conds: (P, k) => xpConds(P, k), avWx: t => wdCall(() => avWeather(t, 'ville'), null), now: wdNow, sectionHTML: wdSectionHTML, refresh: wdRefresh,
};

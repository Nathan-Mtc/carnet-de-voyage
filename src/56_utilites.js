// ================= 56 · v39 : CHAQUE OBJET SERT À QUELQUE CHOSE DE PRÉCIS =================
// Le joueur : « je trouve une clé, elle ouvre tel coffre ; je trouve tel truc, il sert à ça ». Pas 150 000 systèmes :
// TROIS mécanismes, réutilisés par TYPE d'objet, et une seule ligne d'utilité par objet.
// 1. CLÉS ET COFFRES : 8 types (bois, fer, bronze, argent, or, cristal, ancienne, marine). On ÉTEND FAM_LOCKS (36_familles.js) :
//    famOpenChest, famChestItem, famKeyItem servent pour tous (aucun doublon). Coffres cachés dans les secrets générés
//    de l'exploration (52_modes.js, enveloppes exGenSecrets/exVisit) et parfois au bout d'une étape de quête (qtGrant).
// 2. OBJETS DE PASSAGE : 8 (corde, piolet, rame, torche, lanterne, échelle, pass, filet), CONSOMMÉS dans les choix
//    risqués d'expédition (option ajoutée par avNode, forcée par avChance) et demandés par certains secrets.
//    Des objets flous existants le deviennent par leur nom (Bout de corde, Lanterne berbère, Ticket d'entrée…).
// 3. TROC : 13 habitants (clients de la boutique, BQ_CLIENTS), chacun dans un type de lieu, échangent un TYPE d'objet
//    contre une clé, un objet de passage ou un ingrédient rare. Rencontre à l'arrivée (bouton « Échanger » dans le butin),
//    puis échange possible depuis la fiche de l'objet.
// Décorations : on garde les vraies (plantes, herbiers, mappemondes, lampes, tapis) ; 9 bibelots sans intérêt quittent
// les tables de butin (pas les sacs). utilOf(it) → { k, ico, txt } : fiche (en tête) et carte du butin (pastille bas-gauche).
// Sauvegarde : S.ut = { met:{id:date}, n } optionnel. Aucune fenêtre spontanée. Tests : window.__ut.

const ut$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
let UT_OFF = 0, UT_FORCE = 0, UT_LAST = null;
const utState = () => { if (!S.ut || typeof S.ut !== 'object') S.ut = {}; if (!S.ut.met || typeof S.ut.met !== 'object') S.ut.met = {}; if (typeof S.ut.n !== 'number') S.ut.n = 0; return S.ut; };
const utH = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const utLow = s => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);

// ---------------- 1. CLÉS ET COFFRES (8 types, dans le système existant) ----------------
Object.assign(FAM_LOCKS, {
  bronze: { de: 'en bronze', r: 2, col: '#c07a3a', w: 18, kw: 20 },
  argent: { de: 'en argent', r: 3, col: '#c9d2dc', w: 8, kw: 10 },
  cristal: { de: 'de cristal', r: 4, col: '#9fd8f0', w: 1, kw: 2 },
  marine: { de: 'marin', kde: 'marine', r: 2, col: '#3f86b8', w: 0, kw: 4 }, // coffres marins : seulement cachés près de la mer
});
Object.keys(FAM_LOCKS).forEach(l => { FAM_CHEST_BY[famChestName(l)] = l; FAM_KEY_BY[famKeyName(l)] = l; });
const UT_LOCKS = ['bois', 'fer', 'bronze', 'argent', 'or', 'cristal', 'ancienne', 'marine'];
const UT_LOCK_BASE = { bronze: 'fer', argent: 'or', cristal: 'ancienne', marine: 'fer' };
const utChestPl = l => 'coffres ' + (l === 'marine' ? 'marins' : FAM_LOCKS[l].de);
const UT_SEA = ['mer', 'plage', 'port', 'phare', 'ile', 'poissonnerie'];

// ---------------- 2. OBJETS DE PASSAGE ----------------
const UT_PASS = {
  corde: { nom: 'Corde', ico: '🧗', obs: 'falaises et crevasses', v: 'Lancer la corde', col: '#e9a03a', re: /grimp|escalad|falaise|paroi|rocher|crevasse|corniche|sommet|ravin|descend/i },
  piolet: { nom: 'Piolet', ico: '⛏️', obs: 'glaciers et pentes gelées', v: 'Planter le piolet', col: '#8f9cb3', re: /glac|neige|gel|givr|congère|banquise|pente/i },
  rame: { nom: 'Rame', ico: '🛶', obs: 'rivières et lacs', v: 'Prendre la rame', col: '#b07a4f', re: /nag|rivi|lac\b|eau|courant|barque|bateau|gué|vague|plong/i },
  torche: { nom: 'Torche', ico: '🔥', obs: 'grottes et tunnels', v: 'Allumer la torche', col: '#f08a3a', re: /grotte|tunnel|cave|souterr|sombre|obscur|caverne|mine/i },
  lanterne: { nom: 'Lanterne', ico: '🏮', obs: 'nuits et brouillards', v: 'Allumer la lanterne', col: '#f2c14e', re: /nuit|brouillard|brume|noir|étoile|tempête/i },
  echelle: { nom: 'Échelle', ico: '🪜', obs: 'murs et toits', v: 'Poser l’échelle', col: '#c9a35a', re: /mur|toit|grille|clôture|fenêtre|balcon|branche|arbre/i },
  pass: { nom: 'Pass de visite', ico: '🎫', obs: 'portes gardées', v: 'Montrer le pass', col: '#e5687f', re: /garde|entrée|porte|guichet|portail|fermé|interdit|musée|palais|foule/i },
  filet: { nom: 'Filet de pêche', ico: '🎣', obs: 'bêtes à attraper', v: 'Lancer le filet', col: '#7fae4f', re: /attrap|poisson|pêch|saisir|papillon|poursuiv/i },
};
const UT_PASS_BIOME = { montagne: 'corde', neige: 'piolet', mer: 'rame', lac: 'rame', foret: 'echelle', jungle: 'corde', ville: 'pass', quartier: 'pass', desert: 'lanterne', campagne: 'echelle' };
const UT_PASS_TAG = { montagne: 'corde', neige: 'piolet', glacier: 'piolet', mer: 'rame', lac: 'rame', etang: 'rame', riviere: 'rame', port: 'filet', plage: 'filet', poissonnerie: 'filet', foret: 'torche', sentier: 'corde', camping: 'lanterne', desert: 'lanterne', phare: 'lanterne', ville: 'pass', musee: 'pass', monument: 'pass', patrimoine: 'pass', zoo: 'pass', campagne: 'echelle', ferme: 'echelle', bricolage: 'echelle' };
// objets flous existants qui DEVIENNENT des objets de passage (par leur nom ; aucune donnée modifiée)
const UT_PASS_NAMES = { 'Bout de corde': 'corde', 'Corde à sauter': 'corde', 'Filet de pêche': 'filet', 'Sac en filet': 'filet', 'Lampe torche': 'torche', 'Bougie de table': 'torche', 'Cierge parfumé': 'torche', 'Lanterne berbère': 'lanterne', 'Lanterne de quai': 'lanterne', 'Lanterne de camping': 'lanterne', 'Rayon de phare en bocal': 'lanterne', 'Ticket de visite': 'pass', 'Ticket d’entrée': 'pass', 'Ticket du zoo': 'pass', 'Ticket de match': 'pass', 'Ticket de cinéma': 'pass', 'Ticket de manège': 'pass' };
Object.keys(UT_PASS).forEach(k => { UT_PASS_NAMES[UT_PASS[k].nom] = k; });
const utPassOf = it => (it && !it.mk && (it.utp || UT_PASS_NAMES[famName(it)])) || null;
function utPassItem(k, from) {
  k = UT_PASS[k] ? k : Object.keys(UT_PASS)[Math.floor(Math.random() * 8)];
  const P = UT_PASS[k], it = makeItem([P.nom, 'm', 'outil', 1, null, P.col], 0, from || 'En voyage', [], { fixed: 1 }); it.utp = k; return it;
}
const utPassList = (k, t) => [].concat(t && t.bag ? t.bag : [], S.inv || []).filter(i => utPassOf(i) === k);
const utHasPass = (k, t) => utPassList(k, t).length > 0;
function utTakePass(k, t) {
  const i = utPassList(k, t).sort((a, b) => a.rarity - b.rarity)[0]; if (!i) return false;
  for (const L of [t && t.bag, S.inv]) { const x = L ? L.indexOf(i) : -1; if (x >= 0) { L.splice(x, 1); return true; } }
  return false;
}
function utPassFor(txt, biome) { for (const k in UT_PASS) if (UT_PASS[k].re.test(txt || '')) return k; return UT_PASS_BIOME[biome] || 'corde'; }

// expédition : une option de plus dans un choix risqué (« Lancer la corde » : passage sûr, consomme 1 corde)
if (typeof avNode === 'function') avNode = (orig => function (j) {
  const n = orig.apply(this, arguments);
  if (!n || UT_OFF || !Array.isArray(n.o) || n.o.length > 3 || n.o.some(o => o.ut)) return n;
  const i = n.o.findIndex(o => o.p != null && o.p < 1 && !o.need);
  if (i < 0) return n;
  const o = n.o[i], k = utPassFor(String(o.a || '') + ' ' + String(n.q || ''), j && j.biome), P = UT_PASS[k];
  return Object.assign({}, n, { o: n.o.concat([{ a: P.v, h: `1 ${utLow(P.nom)} (consommé) : passage sûr`, need: ['pass:' + k], ut: k, alias: i }]) });
})(avNode);
if (typeof avNeedOk === 'function') avNeedOk = (orig => function (k, need, t) {
  if (need && need.some(n => /^pass:/.test(n))) return need.some(n => /^pass:/.test(n) ? utHasPass(n.slice(5), t) : orig.call(this, k, [n], t));
  return orig.apply(this, arguments);
})(avNeedOk);
if (typeof avNeedIcon === 'function') avNeedIcon = (orig => function (need) {
  const p = need && need.find(n => /^pass:/.test(n)); if (p && UT_PASS[p.slice(5)]) return `<b class="utpi" aria-hidden="true">${UT_PASS[p.slice(5)].ico}</b>`;
  return orig.apply(this, arguments);
})(avNeedIcon);
if (typeof avChance === 'function') avChance = (orig => function () { return UT_FORCE ? 1 : orig.apply(this, arguments); })(avChance);
if (typeof avChoose === 'function') avChoose = (orig => function (t, j, oi, auto) {
  if (!t || !j || j.resolved || UT_OFF) return orig.apply(this, arguments);
  const n = ut$(() => avNode(j), null), o = n && n.o[oi];
  if (!o || !o.ut) return orig.apply(this, arguments);
  if (!utHasPass(o.ut, t)) return auto ? orig.call(this, t, j, o.alias, auto) : undefined;
  utTakePass(o.ut, t);
  let r; UT_FORCE++;
  try { r = orig.call(this, t, j, o.alias, auto); } finally { UT_FORCE--; }
  const P = UT_PASS[o.ut];
  if (j.steps && j.steps.length) j.steps[j.steps.length - 1].a = `${P.v} (−1 ${utLow(P.nom)})`;
  if (r === 'done') j.outcome = `${P.ico} Passage sûr grâce à : ${P.nom} (−1). ` + (j.outcome || '');
  S.ut = utState(); S.ut.pass = (S.ut.pass || 0) + 1; ut$(save);
  return r;
})(avChoose);

// ---------------- exploration : coffres et passages dans les secrets générés (52_modes.js) ----------------
const UT_SEC_PASS = { '🔭': 'corde', '🗝️': 'torche', '🪣': 'echelle', '🌿': 'echelle', '🕯️': 'lanterne', '🪨': 'piolet', '🌉': 'rame', '📜': 'pass', '🦉': 'corde', '⛲': 'filet', '🏚️': 'rame', '🧭': 'pass' };
const UT_SEC_LOCK = ['bois', 'bois', 'fer', 'fer', 'fer', 'bronze', 'bronze', 'argent', 'or', 'ancienne', 'cristal'];
if (typeof exGenSecrets === 'function') exGenSecrets = (orig => function () {
  const out = orig.apply(this, arguments);
  out.forEach(s => {
    const h = utH(s.id + ':ut');
    if (h % 3 === 0) { s.utChest = UT_SEC_LOCK[(h >>> 3) % UT_SEC_LOCK.length]; s.ico = '🧰'; }
    if ((h >>> 7) % 4 === 0) s.utNeed = UT_SEC_PASS[s.ico] || ['corde', 'torche', 'echelle', 'rame'][(h >>> 9) % 4];
  });
  return out;
})(exGenSecrets);
function utJ(t, place, text, chip) { ut$(() => t.journal.push({ t: Date.now(), kind: 'mys', place, text, chips: [['rare', chip]] })); }
if (typeof exVisit === 'function') exVisit = (orig => function (d, t) {
  if (UT_OFF || !d || d.lon == null) return orig.apply(this, arguments);
  const blocked = [], cand = []; let X = null;
  try {
    const z = exZoneAt(d.lon, d.lat); X = exState();
    exSecretsRaw(z).forEach(s => {
      if (s.kind !== 'gen' || X.f[s.id] || mdKm(d, s) > EX_FIND) return;
      if (s.utNeed && !mdTuto()) { if (t && utHasPass(s.utNeed, t)) s.utUse = 1; else { X.f[s.id] = 1; blocked.push(s); return; } }
      cand.push(s);
    });
  } catch (e) {}
  let r;
  try { r = orig.apply(this, arguments); } finally { blocked.forEach(s => { delete X.f[s.id]; }); }
  try {
    blocked.forEach(s => { if (t) { const P = UT_PASS[s.utNeed]; utJ(t, d.name, `${P.ico} ${s.name} est tout près, mais hors d’atteinte : il faudrait 1 ${utLow(P.nom)} (${P.obs}).`, 'passage'); } });
    cand.forEach(s => {
      if (!X.f[s.id]) { delete s.utUse; return; }
      if (s.utUse) { delete s.utUse; utTakePass(s.utNeed, t); const P = UT_PASS[s.utNeed]; utJ(t, d.name, `${P.ico} ${P.nom} (−1) : ${mdNm(t.comp)} atteint ${utLow(s.name)}.`, 'passage'); }
      if (!t) return;
      const from = `Secret : ${s.name}`, i = t.bag.findIndex(x => x.from === from && /^Trouvaille/.test(x.name));
      if (i >= 0) t.bag.splice(i, 1); // plus de « Trouvaille » décorative : un objet utile à la place
      if (s.utChest) {
        const lock = (d.tags || []).some(x => UT_SEA.includes(x)) && utH(s.id) % 2 ? 'marine' : s.utChest;
        t.bag.push(famChestItem(from, d.tags || [], lock));
        utJ(t, d.name, `🧰 Un secret ! ${famChestName(lock)} caché ici. Il s’ouvre avec une ${famKeyName(lock).toLowerCase()}.`, 'coffre');
      } else if (i >= 0) t.bag.push(utPassItem(UT_PASS_TAG[(d.tags || [])[0]], from));
    });
    if (blocked.length || cand.length) ut$(save);
  } catch (e) { console.error('utilités secrets', e); }
  return r;
})(exVisit);
// quêtes : parfois un coffre au bout d'une étape
if (typeof qtGrant === 'function') qtGrant = (orig => function (rw, from) {
  let txt = orig.apply(this, arguments);
  try {
    if (!UT_OFF && utH(String(from) + JSON.stringify(rw || {})) % 3 === 0) {
      const lock = ['bronze', 'argent', 'fer'][utH(from) % 3];
      famPush(famChestItem(`Récompense : ${from}`, [], lock));
      if (typeof txt === 'string') txt += ` + ${famChestName(lock)}`;
    }
  } catch (e) {}
  return txt;
})(qtGrant);
// butin : quelques objets de passage selon le lieu ; plus rien de purement décoratif à jeter
if (typeof famLoot === 'function') famLoot = (orig => function (out, tags, luck, place, n) {
  const r = orig.apply(this, arguments);
  try { if (!UT_OFF && n >= 2 && Math.random() < 0.1) { const k = (tags || []).map(x => UT_PASS_TAG[x]).find(Boolean); out.push(utPassItem(k, typeof place === 'string' ? place : (place && place.name) || 'En voyage')); } } catch (e) {}
  return r;
})(famLoot);
// coffres : un vrai butin utile en plus (objets de passage, outil pour les coffres rares)
if (typeof famChestLoot === 'function') famChestLoot = (orig => function (lock, chest) {
  const base = UT_LOCK_BASE[lock], R = orig.call(this, base || lock, chest);
  if (base) { R.L = FAM_LOCKS[lock]; R.items.forEach(i => { i.from = famChestName(lock); }); R.coins = Math.round(R.coins * ({ bronze: 1.3, argent: 0.8, cristal: 1.2, marine: 1.3 })[lock]); }
  if (!UT_OFF) {
    const from = famChestName(lock), nb = FAM_LOCKS[lock].r >= 3 ? 2 : 1;
    for (let i = 0; i < nb; i++) R.items.push(utPassItem(lock === 'marine' && !i ? 'rame' : null, from));
    if (lock === 'argent' || lock === 'cristal') R.items.push(famToolItem(null, from));
    if (lock === 'marine') { const c = famNatureItem(UT_SEA, from, 'coquillage', true); if (c) R.items.push(c); }
  }
  return R;
})(famChestLoot);

// ---------------- 3. TROC AVEC LES HABITANTS (clients de la boutique) ----------------
const utSub = (...s) => it => s.includes(it.sub) && !it.mk;
const UT_TROC = [
  { id: 'ondine', ico: '🦦', lieu: 'la côte', tags: ['mer', 'plage', 'port', 'phare', 'poissonnerie'], quoi: 'coquillages', m: utSub('coquillage', 'perle', 'corail'), n: 3, don: ['pass', 'rame'] },
  { id: 'filou', ico: '🦝', lieu: 'les puces et la rue', tags: ['puces', 'rue', 'ville', 'boutique'], quoi: 'bibelots', m: it => it.cat === 'd' && ['bocal', 'lanterne'].includes(it.sub) && !utPassOf(it), n: 2, don: ['cle', 'fer'] },
  { id: 'hulotte', ico: '🦉', lieu: 'les musées et monuments', tags: ['musee', 'monument', 'bibliotheque', 'librairie', 'patrimoine', 'ecole'], quoi: 'statuettes', m: it => it.cat === 'd' && it.sub === 'statue' && !it.relic && !it.tresor, n: 2, don: ['cle', 'ancienne'] },
  { id: 'rainette', ico: '🐸', lieu: 'les étangs et rivières', tags: ['etang', 'riviere'], quoi: 'insectes', m: utSub('insecte', 'scarabee'), n: 2, don: ['pass', 'filet'] },
  { id: 'gaston', ico: '🦡', lieu: 'la montagne', tags: ['montagne', 'bricolage', 'route', 'belvedere'], quoi: 'pierres précieuses', m: it => it.sub === 'gemme', n: 1, don: ['cle', 'argent'] },
  { id: 'pingo', ico: '🐧', lieu: 'le grand froid', tags: ['neige', 'glacier'], quoi: 'médailles', m: utSub('medaille'), n: 2, don: ['pass', 'piolet'] },
  { id: 'moustache', ico: '🐱', lieu: 'les gares et cafés', tags: ['gare', 'cafe', 'cinema', 'hotel', 'poste'], quoi: 'vieux papiers', m: it => it.sub === 'papier' && !it.mk && !utPassOf(it), n: 3, don: ['pass', 'pass'] },
  { id: 'grignote', ico: '🐹', lieu: 'la campagne', tags: ['campagne', 'marche', 'jardin', 'ferme', 'epicerie'], quoi: 'bouts de plastique', m: utSub('plastique'), n: 3, don: ['pass', 'echelle'] },
  { id: 'clochette', ico: '🦌', lieu: 'la forêt', tags: ['foret', 'parc', 'sentier', 'camping'], quoi: 'bougies et lumières', m: it => ['lumiere', 'lune'].includes(it.sub) && !it.mk && !utPassOf(it), n: 2, don: ['pass', 'torche'] },
  { id: 'leonie', ico: '🐢', lieu: 'les îles', tags: ['ile', 'agrumes'], quoi: 'trésors uniques et reliques', m: it => !!(it.tresor || it.relic || it.sub === 'fragment' || it.sub === 'relique' || it.sub === 'masque'), n: 1, don: ['cle', 'cristal'] },
  { id: 'eucalypso', ico: '🐨', lieu: 'le désert', tags: ['desert', 'belvedere'], quoi: 'pierres et éclats', m: utSub('pierre', 'eclat', 'sable'), n: 3, don: ['pass', 'corde'] },
  { id: 'capucine', ico: '🦆', lieu: 'les lacs', tags: ['lac', 'piscine', 'boulangerie'], quoi: 'plumes', m: utSub('plume'), n: 3, don: ['cle', 'marine'] },
  { id: 'bruno', ico: '🐻', lieu: 'les fermes et le zoo', tags: ['zoo', 'jouets', 'ferme', 'fromagerie', 'chocolaterie'], quoi: 'curiosités', m: it => !it.mk && !it.tresor && !it.relic && ut$(() => famOf(it), '') === 'tresors' && !famIsChest(it) && !famIsKey(it) && !famGemOf(it) && it.cat !== 'd' && !['fragment', 'relique', 'masque'].includes(it.sub), n: 2, don: ['rare'] },
];
UT_TROC.forEach(T => { const C = ut$(() => BQ_CLIENTS.find(c => c.id === T.id), null); T.qui = C ? C.name : T.id; T.label = C ? C.label : ''; });
const UT_TROC_BY = Object.fromEntries(UT_TROC.map(T => [T.id, T]));
const utTrocFor = it => (it && !it.mk && !it.qt ? UT_TROC.find(T => ut$(() => T.m(it), false)) : null) || null;
function utDonTxt(T) { const d = T.don; return d[0] === 'cle' ? famKeyName(d[1]) : d[0] === 'pass' ? UT_PASS[d[1]].nom : 'un ingrédient rare'; }
const utTrocTxt = T => `${T.n} ${T.quoi} → 1 ${utDonTxt(T).replace(/^un /, '')}`;
const utWorn = it => ut$(() => Object.values(S.outfits || {}).some(o => o && Object.values(o).includes(it.id)), false);
const utGoods = T => (S.inv || []).filter(i => !utWorn(i) && ut$(() => T.m(i), false)).sort((a, b) => a.rarity - b.rarity);
function utTrade(id) {
  const T = UT_TROC_BY[id]; if (!T) return null;
  const g = utGoods(T);
  if (g.length < T.n) { toast(`${T.qui} veut ${T.n} ${T.quoi} : vous en avez ${g.length}.`); return null; }
  g.slice(0, T.n).forEach(i => S.inv.splice(S.inv.indexOf(i), 1));
  const from = `Troc : ${T.qui}`, d = T.don; let it;
  if (d[0] === 'cle') it = famKeyItem(from, d[1]);
  else if (d[0] === 'pass') it = utPassItem(d[1], from);
  else { const pool = [].concat(...T.tags.map(x => LOOT[x] || [])).filter(x => x[1] === 'n'); const def = pool.sort((a, b) => b[3] - a[3])[Math.floor(Math.random() * Math.min(4, pool.length))] || ['Miel de lavande', 'n', 'sucre', 3, null, '#f2c14e']; it = makeItem(def, 0, from, T.tags.slice(0, 1), { fixed: Math.max(3, def[3]) }); }
  famPush(it); const U = utState(); U.n++; U.met[T.id] = U.met[T.id] || Date.now();
  ut$(save); ut$(() => { renderTop(); renderPanel(); });
  toast(`${T.ico} Échange avec ${T.qui} : +1 ${it.name} !`);
  return it;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-uttroc]'); if (!b || b.disabled) return;
  const it = utTrade(b.dataset.uttroc), box = b.closest('.uttroc');
  if (it && box) { b.remove(); const s = box.querySelector('small'); if (s) s.innerHTML = `✔ Échange fait : <b>+1 ${esc(it.name)}</b>`; }
});
function utTrocHere(dest) {
  const tags = (dest && dest.tags) || []; if (!tags.length) return null;
  const c = UT_TROC.filter(T => tags.some(x => T.tags.includes(x)));
  return c.length ? c[utH(dest.name || '') % c.length] : null;
}
function utTrocBoxHTML(T) {
  const g = utGoods(T).length, ok = g >= T.n;
  return `<div class="uttroc"><span class="utav" aria-hidden="true">${T.ico}</span><div><b>${esc(T.qui)}</b> ${esc(T.label)} vit ici (${esc(T.lieu)}).<small>Troc : ${esc(utTrocTxt(T))} · vous en avez ${g}</small></div>${ok ? `<button class="btn green sm" data-uttroc="${T.id}">Échanger</button>` : ''}</div>`;
}
if (typeof collect === 'function') collect = (orig => function () {
  const t = S.trips && S.trips[S.sel]; UT_LAST = t ? t.dest : null;
  try { return orig.apply(this, arguments); } finally { UT_LAST = null; }
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const T = UT_OFF ? null : utTrocHere(UT_LAST), haul = T && document.querySelector('#modal .haul');
    if (haul) { utState().met[T.id] = utState().met[T.id] || Date.now(); haul.insertAdjacentHTML('beforeend', utTrocBoxHTML(T)); ut$(save); }
  } catch (e) { console.error('troc', e); }
  return r;
})(showHaul);

// ---------------- 4. UNE LIGNE D'UTILITÉ ----------------
const UT_TROC_FIRST = new Set(['plastique', 'medaille', 'insecte', 'scarabee', 'gemme', 'fragment', 'relique', 'masque']);
function utilOf(it) {
  const V = { k: 'vendre', ico: '🪙', txt: 'À vendre au marché' };
  if (!it) return V;
  if (it.mk) return { k: 'vendre', ico: '🧺', txt: 'À vendre aux clients de la boutique' };
  const ky = ut$(() => famIsKey(it), null); if (ky) return { k: 'ouvrir', ico: '🔑', txt: `Ouvre : ${utChestPl(ky)}` };
  const ch = ut$(() => famIsChest(it), null); if (ch) return { k: 'ouvrir', ico: '🧰', txt: `S’ouvre avec : ${famKeyName(ch).toLowerCase()}` };
  if (!UT_OFF) { const p = utPassOf(it); if (p) { const P = UT_PASS[p]; return { k: 'passage', ico: P.ico, txt: `Passage : ${P.obs} (${utLow(P.nom)})` }; } }
  if (it.cat === 'v') { const b = ut$(() => usWearOf(it), null); return { k: 'porter', ico: '👕', txt: `Porter : ${b && b.txt ? b.txt : 'un bonus en voyage'}` }; }
  const G = ut$(() => usGearOf([it.name]), null); if (G) return { k: 'expedition', ico: '🎒', txt: `Expédition : ${ut$(() => XP_G[G.g][2], 'matériel')}` };
  const tl = ut$(() => famToolOf(it), null); if (tl) { const d = FAM_TOOLS.find(x => x[0] === tl); return { k: 'expedition', ico: '🧭', txt: d ? d[4] : 'Outil d’aventure' }; }
  const sd = ut$(() => famSeedOf(it), null); if (sd) return { k: 'planter', ico: '🌱', txt: `Planter : ${sd.out[0]}` };
  const T = UT_OFF ? null : utTrocFor(it), troc = T ? { k: 'troc', ico: '🤝', txt: `Troc : ${T.qui} (${T.lieu})` } : null;
  if (troc && (it.cat === 'd' || it.tresor || it.relic || UT_TROC_FIRST.has(it.sub))) return troc;
  const cm = ut$(() => usCmRecipes(it)[0], null); if (cm) return { k: 'cuisiner', ico: cm.R.def[1] === 'n' ? '🍳' : '🧺', txt: `Sert à : ${cm.R.def[0]}` };
  const at = ut$(() => usAtRecipes(it)[0], null); if (at) return { k: 'construire', ico: '🔨', txt: `Sert à : ${at.r.out[0]}` };
  const K = ut$(() => usKinds(it), []);
  if (K.includes('construire')) return { k: 'construire', ico: '🔨', txt: 'Sert à : construire la maison et la boutique' };
  if (K.includes('cuisiner')) return { k: 'cuisiner', ico: '🍳', txt: 'Sert à : préparer des plats au commerce' };
  if (K.includes('offrande')) return { k: 'offrande', ico: '🎁', txt: 'Offrande aux gardiens' };
  if (it.cat === 'n' || K.includes('familier')) return { k: 'familier', ico: '🐾', txt: 'Nourrir vos familiers' };
  if (troc) return troc;
  if (K.includes('confort')) return { k: 'confort', ico: '🛋️', txt: 'Confort du foyer (à poser chez vous)' };
  return V;
}
const utConcrete = it => !['confort', 'vendre'].includes(utilOf(it).k);

// pastilles d'usage (47) : ouvrir, passage, troc
Object.assign(US_K, {
  ouvrir: { nom: 'Ouvrir', c: '#b8892a', g: '<circle cx="7" cy="10" r="3.6" fill="none" stroke="#fff" stroke-width="2"/><path d="M10.5 10 H17 M14.5 10 V13 M16.5 10 V12.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' },
  passage: { nom: 'Passage', c: '#5f8f6a', g: '<path d="M4 16 Q8 4 16 4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="16" cy="4.5" r="1.8" fill="#fff"/><path d="M4 16 L9 16" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' },
  troc: { nom: 'Troc', c: '#7a6fc4', g: '<path d="M4 8 H15 L12 5 M16 12 H5 L8 15" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
});
if (Array.isArray(US_MAIN_ORDER)) US_MAIN_ORDER.splice(4, 0, 'passage', 'troc');
if (typeof usKinds === 'function') usKinds = (orig => function (it) {
  const r = orig.apply(this, arguments);
  if (!it || UT_OFF) return r;
  const add = [];
  if (ut$(() => famIsKey(it) || famIsChest(it), null)) add.push('ouvrir');
  if (utPassOf(it)) add.push('passage');
  if (utTrocFor(it)) add.push('troc');
  return add.length ? add.concat(r.filter(k => !add.includes(k))) : r;
})(usKinds);
GAME.addUses(it => {
  if (!it || UT_OFF) return [];
  const out = [], p = utPassOf(it), T = utTrocFor(it);
  if (p) out.push({ txt: `Passage : ${UT_PASS[p].obs} (consommé en expédition)`, kind: 'passage' });
  if (T) out.push({ txt: `Troc avec ${T.qui} (${T.lieu}) : ${utTrocTxt(T)}`, kind: 'troc' });
  return out;
});
GAME.addAction(it => {
  const T = !UT_OFF && it && S.inv.includes(it) ? utTrocFor(it) : null; if (!T) return [];
  const met = !!utState().met[T.id], g = utGoods(T).length;
  return [{ label: `Troc : ${T.qui}`, kind: 'troc', ico: `<b class="utbig">${T.ico}</b>`, ready: met && g >= T.n, hint: met ? `${utTrocTxt(T)} (vous en avez ${g})` : `À rencontrer en voyage : ${T.lieu}`, run: () => (met ? utTrade(T.id) : toast(`${T.ico} ${T.qui} vit dans ${T.lieu} : partez-y, puis échangez ${utTrocTxt(T)}.`)) }];
});
if (typeof usFicheHTML === 'function') usFicheHTML = (orig => function (it) {
  const h = orig.apply(this, arguments);
  try { const u = utilOf(it); return h.replace('<div class="usfiche">', `<div class="usfiche"><p class="utline"><span aria-hidden="true">${u.ico}</span> ${esc(u.txt)}</p>`); } catch (e) { return h; }
})(usFicheHTML);
if (typeof haulCard === 'function') haulCard = (orig => function (it) {
  const h = orig.apply(this, arguments);
  try { const u = utilOf(it); return h.replace(/<\/div>$/, `<i class="utb" title="${esc(u.txt)}" aria-label="${esc(u.txt)}">${u.ico}</i></div>`); } catch (e) { return h; }
})(haulCard);
{
  const st = document.createElement('style');
  st.textContent = `.utline{margin:0 0 8px;padding:7px 10px;border-radius:12px;background:#fff4d6;border:2px solid #e6c27a;font:800 14px var(--body,system-ui);color:#5b3a12;line-height:1.3}
.haul .hcard .utb,.hcard .utb{position:absolute;bottom:5px;left:5px;width:22px;height:22px;border-radius:50%;background:#fffdf7;border:1.5px solid #e7dccb;display:grid;place-items:center;font-style:normal;font-size:13px;line-height:1;z-index:2}
.uttroc{grid-column:1/-1;flex:1 1 100%;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:9px 11px;margin-top:4px;border-radius:14px;background:#efeafb;border:2px solid #b7a8e6;text-align:left;font-size:13px;color:#3f2f63}
.uttroc small{display:block;margin-top:2px;font-size:12px}.uttroc .utav{font-size:28px;line-height:1}.uttroc>div{flex:1;min-width:0}.uttroc .btn{flex:none}
.utpi{font-style:normal;font-size:15px;line-height:1}.utbig{font-size:26px;line-height:1}`;
  document.head.appendChild(st);
}

// ---------------- 3 bis. DÉCORATIONS EN TROP : retirées des tables de butin (pas des sacs) ----------------
const UT_RETIRE = ['Tasse ébréchée', 'Soucoupe fleurie', 'Mug souvenir', 'Cloche à fromage', 'Théière fleurie', 'Reproduction miniature', 'Moulage en plâtre', 'Banc miniature', 'Toboggan miniature'];
const UT_REMOVED = [];
function utRetire() { Object.keys(LOOT).forEach(k => { const L = LOOT[k]; for (let i = L.length - 1; i >= 0; i--) if (UT_RETIRE.includes(L[i][0])) UT_REMOVED.push([k, i, L.splice(i, 1)[0]]); }); }
function utRestore() { UT_REMOVED.slice().reverse().forEach(([k, i, d]) => LOOT[k].splice(i, 0, d)); UT_REMOVED.length = 0; }
utRetire();

// ---------------- 5. MESURE (tests) : % des objets de butin qui ont une utilité concrète ----------------
function utSample(N) {
  const out = [], dex = Object.assign({}, S.dex);
  Object.keys(LOOT).forEach(k => { for (let i = 0; i < N; i++) out.push(...ut$(() => lootFor([k], 0, 'Mesure', 2), [])); });
  S.dex = dex; return out;
}
function utMeasure(N = 20) {
  const inv = S.inv; S.inv = [];
  const pct = (L, f) => Math.round(1000 * L.filter(f).length / Math.max(1, L.length)) / 10;
  utRestore(); UT_OFF = 1; ut$(() => usCache.clear());
  const A = utSample(N), before = pct(A, it => !!(ut$(() => famIsKey(it) || famIsChest(it), null)) || ut$(() => usKinds(it), []).some(k => k !== 'confort'));
  utRetire(); UT_OFF = 0; ut$(() => usCache.clear());
  const B = utSample(N), after = pct(B, utConcrete);
  const rest = {}; B.filter(it => !utConcrete(it)).forEach(it => { rest[it.name] = (rest[it.name] || 0) + 1; });
  const kinds = {}; B.forEach(it => { const k = utilOf(it).k; kinds[k] = (kinds[k] || 0) + 1; });
  S.inv = inv; ut$(() => usCache.clear());
  return { before, after, nBefore: A.length, nAfter: B.length, retires: UT_RETIRE.length, kinds, rest: Object.entries(rest).sort((a, b) => b[1] - a[1]).slice(0, 25) };
}
window.__ut = { utilOf, measure: utMeasure, trade: utTrade, troc: UT_TROC, pass: UT_PASS, locks: UT_LOCKS, passItem: utPassItem, hasPass: utHasPass, trocHere: utTrocHere, state: utState,
  secrets: z => exSecretsRaw(z), zoneAt: (lon, lat) => exZoneAt(lon, lat), visit: (d, t) => exVisit(d, t), keyItem: l => famKeyItem('Test', l), openChest: id => famOpenChest(id),
  scenes: () => AV_SCENES, node: j => avNode(j), choose: (t, j, oi) => avChoose(t, j, oi), fiche: id => openFiche(id) };

// ================= MARCHÉ MONDIAL (v13, phase B) =================
// Un marché simulé en 4 catégories : Compagnons & œufs · Vêtements & accessoires · Ressources régionales · Objets fabriqués & recettes.
// Des « joueurs du monde » simulés (pseudo + région) vendent : le stock tourne au fil du temps, les prix suivent la rareté,
// la provenance (une ressource du Japon est chère en France) et une petite tendance du marché (↑ ↓).
// Le joueur achète, met en vente (objets, compagnons, œufs) et voit ses annonces se vendre avec le temps, selon la justesse du prix.
// Aucune fenêtre spontanée : une vente conclue = une petite notification + un point rouge sur l'onglet.
// Exposé : removeComp(id, opt), renderMarche(box), openMarche(cat, sp), mkUnseen(), mkFair(it), mkCompPrice(o), window.__marche.
// Enveloppé : renderNav (point rouge de l'onglet Boutique).
// État : S.mkt = { list: [], mine: [], unseen: 0, sold: 0, earned: 0, last: 0 }.

// ---------- retirer un compagnon (vente, adoption par un client) ----------
// Refuse un compagnon en voyage et le dernier compagnon. Renvoie true si le compagnon est parti.
function removeComp(id, opt = {}) {
  const c = S.comps && S.comps[id];
  const no = msg => { if (!opt.quiet) toast(msg); return false; };
  if (!c) return false;
  if (S.trips && S.trips[id]) return no(`${c.name} est en voyage : attendez son retour.`);
  if (Object.keys(S.comps).length <= 1) return no('C’est votre dernier compagnon : il reste avec vous !');
  delete S.comps[id];
  // l'équipe : on garde au moins un compagnon
  let team = (S.team || []).filter(k => k !== id && S.comps[k]);
  if (!team.length) team = Object.keys(S.comps).filter(k => !(S.trips && S.trips[k])).slice(0, 3);
  if (!team.length) team = Object.keys(S.comps).slice(0, 1);
  S.team = team;
  if (S.sel === id || !S.comps[S.sel]) { S.sel = team[0]; try { plan.dest = null; } catch (e) {} }
  // les tables indexées par compagnon
  for (const k of ['trips', 'outfits', 'prog', 'unseen', 'dreams']) if (S[k] && typeof S[k] === 'object') delete S[k][id];
  try { if (S.style && S.style.colors) delete S.style.colors[id]; } catch (e) {}
  // les autres modules : une table dont d'autres clés sont des compagnons perd aussi celle-ci
  const ids = new Set(Object.keys(S.comps));
  for (const [k, v] of Object.entries(S)) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || k === 'comps' || !(id in v)) continue;
    if (Object.keys(v).some(x => ids.has(x))) delete v[id];
  }
  // la fiche de dessin (sauf les anciennes clés, encore utilisées comme modèles)
  if (!['pistache', 'mochi', 'bulle'].includes(id)) delete CHARS[id];
  try { for (const key of Object.keys(portraitCache)) if (key.startsWith(id)) delete portraitCache[key]; } catch (e) {}
  save();
  try { GAME.emit('comp:removed', { id, comp: c, why: opt.why || '' }); } catch (e) {}
  try { if (window.__colBooted) renderAll(); } catch (e) { console.error(e); }
  return true;
}

// ---------- vendeurs simulés ----------
const MK_PEOPLE = [['Yuki', 'japon'], ['Kenji', 'japon'], ['Minji', 'coree'], ['Wei', 'chine'], ['Priya', 'inde'], ['Linh', 'asie_sud_est'], ['Aru', 'asie_centrale'],
  ['Mia', 'australie'], ['Moana', 'pacifique'], ['Sven', 'scandinavie'], ['Hanna', 'allemagne'], ['Giulia', 'italie'], ['Mateo', 'iberie'], ['Olivia', 'britanniques'],
  ['Noah', 'suisse'], ['Pieter', 'benelux'], ['Zofia', 'europe_est'], ['Eleni', 'mediterranee'], ['Yasmine', 'afrique_nord'], ['Amara', 'afrique_ouest'],
  ['Zawadi', 'afrique_est'], ['Thandi', 'afrique_sud'], ['Rivo', 'ocean_indien'], ['Omar', 'moyen_orient'], ['Aiyana', 'canada'], ['Ava', 'usa_est'], ['Jake', 'usa_ouest'],
  ['Diego', 'mexique_caraibes'], ['Camila', 'amerique_sud'], ['Nuka', 'arctique'], ['Maëlle', 'bretagne'], ['Elio', 'paca'], ['Jeanne', 'normandie'], ['Hugo', 'occitanie'],
  ['Léa', 'naquitaine'], ['Inès', 'grandest'], ['Lucas', 'idf'], ['Lina', 'ara'], ['Chiara', 'corse'], ['Tom', 'hdf']];
const MK_SUF = ['', '42', '_voyage', '.lune', '7', '_cosy', 'Panda', '_explo', '99', '.bulle'];
const mkPeople = () => MK_PEOPLE.filter(([, r]) => typeof RG !== 'undefined' && RG[r]);
function mkSeller(region) {
  const pool = mkPeople(), local = region ? pool.filter(p => p[1] === region) : [];
  const [n, r] = local.length && Math.random() < 0.8 ? pick(local) : pick(pool);
  return { name: n + pick(MK_SUF), region: r };
}

// ---------- tendance du marché : un indice qui ondule doucement avec le temps ----------
const mkHash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; };
function mkIdx(key, t = Date.now()) {
  const h = mkHash(key);
  return 1 + 0.13 * Math.sin(2 * Math.PI * t / (5.5 * 3600e3) + h) + 0.06 * Math.sin(2 * Math.PI * t / (50 * 60e3) + h * 1.7);
}
function mkTrend(key) { const a = mkIdx(key), b = mkIdx(key, Date.now() - 40 * 60e3), d = (a - b) / b; return d > 0.02 ? 1 : d < -0.02 ? -1 : 0; }
const mkR5 = n => Math.max(5, Math.round(n / 5) * 5);

// ---------- prix ----------
const MK_SP_BASE = { panda: 110, capy: 110, axo: 110, renard: 170, fennec: 160, tanuki: 150, paresseux: 150, lemur: 160, phoque: 170, quokka: 150 };
const MK_RAR_F = [1, 1.7, 3.2, 6.5, 14];
// prix d'un compagnon : espèce, rareté des gènes (geneRarity), hybride, niveau
function mkCompPrice(o) {
  const base = MK_SP_BASE[o.sp] || 150, r = Math.max(0, Math.min(4, o.rarity || 0));
  return mkR5(base * MK_RAR_F[r] * (o.hybrid ? 2.2 : 1) * (1 + 0.12 * Math.max(0, (o.lvl || 1) - 1)) * mkIdx('c:' + o.sp));
}
const mkEggPrice = sp => mkR5((sp ? 150 : 95) * mkIdx('e:' + (sp || 'x')));
// ce qui a été acheté (marché, magasin, ou né d'un œuf acheté) ne se revend pas plus cher que son prix d'achat : pas de boucle d'argent
const mkPaid = o => (o && typeof o.paid === 'number' && o.paid > 0 ? o.paid : 0);
const mkCapP = (o, p) => { const q = mkPaid(o); return q ? Math.min(p, q) : p; };
const mkItemKey = it => it.rid ? 'r:' + it.rid : 'i:' + it.cat + (it.sub || '');
// prix indicatif d'un objet au marché mondial (rareté, provenance lointaine, tendance)
function mkFair(it) {
  try {
    // provenance : plus la spécialité vient de loin, plus elle est rare ici (une ressource du Japon est chère en France)
    const km = it.rid && it.origin && !it.origin.made ? (typeof it.origin.km === 'number' ? it.origin.km : mkRegOrigin({ region: it.origin.region }).km) : 0;
    return mkR5(value({ ...it, id: it.id || '' }) * (1 + Math.min(1.6, km / 5000)) * mkIdx(mkItemKey(it)));
  } catch (e) { return 10; }
}
function mkRegOrigin(x) { const R = RG[x.region]; let km = 0; try { km = kmBetween(homeObj(), { lon: R.anchor[0], lat: R.anchor[1] }); } catch (e) {} return { region: R.id, place: R.short, km }; }

// ---------- état ----------
const MK_CATS = [
  ['comp', 'Compagnons & œufs', '<path d="M6.5 11 C3.5 6 7 3 10.5 7.5 M23.5 11 C26.5 6 23 3 19.5 7.5" fill="#cf7752" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="15" cy="16.5" rx="11" ry="9.5" fill="#ec9c6f" stroke="currentColor" stroke-width="2"/><ellipse cx="10.4" cy="19.4" rx="4.6" ry="3.6" fill="#fff5ea"/><ellipse cx="19.6" cy="19.4" rx="4.6" ry="3.6" fill="#fff5ea"/><circle cx="11" cy="15.4" r="1.7" fill="currentColor"/><circle cx="19" cy="15.4" r="1.7" fill="currentColor"/>'],
  ['mode', 'Vêtements & accessoires', '<path d="M9 6 L4 10 L7 15 L9 14 V26 H21 V14 L23 15 L26 10 L21 6 Q15 10 9 6Z" fill="#c9a3f0" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'],
  ['res', 'Ressources régionales', '<circle cx="15" cy="15" r="11" fill="#9fd1d8" stroke="currentColor" stroke-width="2"/><path d="M6 11 c4 -3 6 2 9 0 s4 -4 8 -1 M5 18 c4 1 5 -2 9 -1 s5 4 10 1" stroke="#5fa274" stroke-width="2.4" fill="none" stroke-linecap="round"/>'],
  ['craft', 'Objets fabriqués & recettes', '<path d="M6 24 L17 13" stroke="#a87a50" stroke-width="4" stroke-linecap="round"/><path d="M14 7 L22 4 L26 8 L23 16 L19 12 L16 13Z" fill="#b9c4cc" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'],
];
const MK_TARGET = { comp: 9, mode: 8, res: 14, craft: 8 };
let mkAuto = -1, mkView = 'acheter', mkCat = 'comp', mkRegion = '', mkSp = '', mkOpenRow = null;
const mkArt = new Map(); // dessins mis en cache (compagnons, œufs)
function mkState() {
  if (!S.mkt || typeof S.mkt !== 'object') S.mkt = {};
  const m = S.mkt;
  if (!Array.isArray(m.list)) m.list = [];
  if (!Array.isArray(m.mine)) m.mine = [];
  for (const k of ['unseen', 'sold', 'earned', 'last']) if (typeof m[k] !== 'number' || !isFinite(m[k])) m[k] = 0;
  m.list = m.list.filter(l => l && l.id && l.data && MK_CATS.some(c => c[0] === l.cat));
  m.mine = m.mine.filter(l => l && l.id && l.data);
  return m;
}
const mkUnseen = () => { try { return mkState().unseen; } catch (e) { return 0; } };
// catégorie d'un objet du sac
function mkCatOf(it) {
  if (it.cat === 'v') return 'mode';
  if (it.cat === 'd' || it.cat === 't') return 'craft';
  if (typeof it.from === 'string' && /^Fabriqué/.test(it.from)) return 'craft';
  return 'res';
}

// ---------- génération des annonces simulées ----------
const mkW = (arr, w) => { const ws = arr.map(w), t = ws.reduce((a, b) => a + b, 0); let r = Math.random() * t; for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
const MK_RW = [1, 0.6, 0.28, 0.09, 0.025];
function mkGen(cat, region) {
  const now = Date.now(), l = { id: 'm' + uidGen(), cat, at: now, exp: now + (15 + Math.random() * 75) * 60e3 };
  const sps = typeof SP_IDS !== 'undefined' ? SP_IDS : ['panda', 'capy', 'axo'];
  if (cat === 'comp') {
    if (Math.random() < 0.35) { const sp = Math.random() < 0.5 ? pick(sps) : null; l.kind = 'egg'; l.data = { sp }; l.fair = mkEggPrice(sp); }
    else {
      let sp = pick(sps), genes = null, hybrid = null;
      if (Math.random() < 0.06 && typeof mixGenes === 'function') {
        const b = pick(sps.filter(x => x !== sp));
        for (let i = 0; i < 8 && !hybrid; i++) { const m = mixGenes(null, null, sp, b); if (m && m.hybrid) { sp = m.sp; genes = m.genes; hybrid = m.hybrid; } }
      }
      if (!genes) { try { genes = typeof randomGenes === 'function' ? randomGenes(sp, Math.random() * 2.5) : null; } catch (e) {} }
      let rarity = 0; try { rarity = typeof geneRarity === 'function' ? geneRarity(genes, sp, hybrid) : 0; } catch (e) {}
      const names = (typeof SP_INFO !== 'undefined' && SP_INFO[sp] && SP_INFO[sp].names) || ['Petit'];
      const lvl = 1 + Math.floor(Math.random() * Math.random() * 7);
      l.kind = 'comp'; l.data = { sp, genes, hybrid, rarity, lvl, name: pick(names) }; l.fair = mkCompPrice(l.data);
    }
  } else if (cat === 'mode') {
    const all = [].concat(...Object.values(LOOT)).filter(d => d[1] === 'v' && d[4]);
    const def = mkW(all, d => MK_RW[d[3]] || 0.02);
    l.kind = 'item'; l.data = { name: def[0], cat: 'v', sub: def[2], rarity: def[3], look: def[4] || null, color: def[5] || null };
  } else if (cat === 'res') {
    const pool = []; REGIONS.forEach(R => { if (R.id !== 'grand_large' && (!region || R.id === region)) R.res.forEach(x => pool.push(x)); });
    const x = mkW(pool, x => MK_RW[x.rar] || 0.02);
    l.kind = 'item'; l.data = { name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar, color: x.color, rid: x.id, origin: mkRegOrigin(x) };
    l.region = x.region;
  } else {
    const recs = typeof BQ_RECIPES !== 'undefined' ? BQ_RECIPES.filter(r => !(S.shop && (S.shop.recipes || []).includes(r.id))) : [];
    if (recs.length && Math.random() < 0.25) { const r = pick(recs); l.kind = 'recipe'; l.data = { rec: r.id, name: r.out[0], def: r.out }; l.fair = mkR5(r.price * 1.2 * mkIdx('rec:' + r.id)); }
    else {
      const pool = RECIPES.filter(r => r.out[1] !== 'v' || Math.random() < 0.3);
      const r = mkW(pool, r => MK_RW[Math.min(4, r.out[3])] + 0.05);
      const o = r.out;
      l.kind = 'item'; l.data = { name: o[0], cat: o[1], sub: o[2], rarity: o[3], look: o[4] || null, color: o[5] || null, made: 1 };
      if (r.multi && Array.isArray(r.multi)) l.data.origin = { multi: r.multi.slice(), made: 1, region: (typeof rgHome === 'function' ? rgHome().id : 'idf') };
    }
  }
  if (l.kind === 'item') l.fair = mkFair(l.data);
  l.seller = mkSeller(l.region || (l.data.origin && l.data.origin.region));
  l.price = mkR5(l.fair * (0.85 + Math.random() * 0.4));
  return l;
}
// le stock tourne : les annonces expirent (achetées par d'autres), de nouvelles arrivent peu à peu
function mkRotate(full) {
  const m = mkState(), now = Date.now(); let changed = false;
  const n0 = m.list.length; m.list = m.list.filter(l => l.exp > now); if (m.list.length !== n0) changed = true;
  for (const [cat] of MK_CATS) {
    let have = m.list.filter(l => l.cat === cat).length, add = 0;
    while (have < MK_TARGET[cat] && (full || add < 2)) { try { m.list.push(mkGen(cat)); } catch (e) { console.error(e); break; } have++; add++; changed = true; }
  }
  // une région filtrée : quelques annonces de plus pour elle
  if (mkRegion && m.list.filter(l => l.cat === 'res' && l.region === mkRegion).length < 3) { for (let i = 0; i < 4; i++) m.list.push(mkGen('res', mkRegion)); changed = true; }
  m.last = now;
  return changed;
}

// ---------- mes annonces ----------
// délai de vente selon la justesse du prix (prix / prix du marché)
function mkDelay(ratio, cat) {
  const base = cat === 'comp' ? 6 : 4;
  if (ratio > 1.45) return Math.random() < 0.15 ? base * 12 * 60e3 * (0.6 + Math.random()) : null;
  const f = ratio <= 0.9 ? 0.35 : ratio <= 1.05 ? 1 : ratio <= 1.2 ? 2.5 : 6;
  return base * f * 60e3 * (0.6 + Math.random() * 0.8);
}
const mkEta = (ratio, cat) => { const base = cat === 'comp' ? 6 : 4; if (ratio > 1.45) return 'peut-être jamais'; const f = ratio <= 0.9 ? 0.35 : ratio <= 1.05 ? 1 : ratio <= 1.2 ? 2.5 : 6; const m = Math.max(1, Math.round(base * f)); return `≈ ${m} min`; };
function mkPost(kind, cat, data, price, fair, extra = {}) {
  const m = mkState(), d = mkDelay(price / fair, cat), now = Date.now();
  const l = Object.assign({ id: 'p' + uidGen(), kind, cat, data, price, fair, at: now, sellAt: d == null ? null : now + d, buyer: mkSeller() }, extra);
  m.mine.push(l); save();
  return l;
}
function mkListItem(id, mult) {
  const it = S.inv.find(i => i.id === id); if (!it) return;
  const go = () => {
    const i = S.inv.indexOf(it); if (i < 0) return;
    S.inv.splice(i, 1);
    for (const o of Object.values(S.outfits || {})) if (o && o.worn && o.worn[it.sub] === it.id) { o[it.sub] = 'none'; o.worn[it.sub] = null; }
    const fair = mkFair(it), price = mkCapP(it, mkR5(fair * mult));
    mkPost('item', mkCatOf(it), it, price, fair);
    mkOpenRow = null; renderTop(); renderPanel(); toast(`« ${it.name} » en vente à ${price} pièces au marché mondial.`);
  };
  if (typeof styleGuard === 'function') styleGuard(id, 'mettre en vente', go); else go();
}
function mkListComp(id, mult) {
  const c = S.comps[id]; if (!c) return;
  const snap = { comp: JSON.parse(JSON.stringify(c)), prog: Object.assign({}, S.prog[id] || { xp: 0, lvl: 1 }) };
  const lvl = snap.prog.lvl || 1, fair = mkCompPrice({ sp: c.sp, rarity: c.rarity, hybrid: c.hybrid, lvl });
  if (!removeComp(id, { why: 'marche' })) return;
  const price = mkCapP(c, mkR5(fair * mult));
  mkPost('comp', 'comp', { sp: c.sp, genes: c.genes, hybrid: c.hybrid || null, rarity: c.rarity || 0, lvl, name: c.name }, price, fair, { snap });
  mkOpenRow = null; renderPanel(); toast(`${c.name} est proposé${c.fem ? 'e' : ''} au marché mondial pour ${price} pièces.`);
}
function mkListEgg(id, mult) {
  const e = (S.eggs || []).find(x => x.id === id); if (!e) return;
  S.eggs = S.eggs.filter(x => x !== e);
  const fair = mkEggPrice(e.sp), price = mkCapP(e, mkR5(fair * mult));
  mkPost('egg', 'comp', { sp: e.sp || null }, price, fair, { egg: e });
  mkOpenRow = null; renderPanel(); toast(`Œuf mis en vente à ${price} pièces.`);
}
// retirer une annonce : l'objet, l'œuf ou le compagnon revient tel quel
function mkUnlist(id) {
  const m = mkState(), l = m.mine.find(x => x.id === id); if (!l || l.sold) return;
  m.mine = m.mine.filter(x => x !== l);
  if (l.kind === 'item') S.inv.push(l.data);
  else if (l.kind === 'egg') { S.eggs = S.eggs || []; S.eggs.push(l.egg || { id: 'e' + uidGen(), sp: l.data.sp, from: { how: 'marche' }, got: Date.now(), ready: Date.now() }); }
  else if (l.kind === 'comp') mkRestoreComp(l);
  save(); renderAll(); toast('Annonce retirée.');
}
function mkRestoreComp(l) {
  const sn = l.snap;
  if (!sn || !sn.comp || S.comps[sn.comp.id]) { addComp({ sp: l.data.sp, genes: l.data.genes, rarity: l.data.rarity, hybrid: l.data.hybrid, name: l.data.name, from: { how: 'marche' } }); return; }
  const c = sn.comp, id = c.id;
  S.comps[id] = c;
  try { buildChar(c); ensureCompState(id); } catch (e) { console.error(e); }
  S.prog[id] = sn.prog;
  if ((S.team || []).length < 3) S.team = [...(S.team || []), id];
  try { if (typeof ensureDreams === 'function') ensureDreams(); } catch (e) {}
}
function mkLower(id) {
  const m = mkState(), l = m.mine.find(x => x.id === id); if (!l || l.sold) return;
  l.price = mkR5(l.price * 0.9);
  const d = mkDelay(l.price / l.fair, l.cat); l.sellAt = d == null ? null : Date.now() + d;
  save(); renderPanel(); toast(`Nouveau prix : ${l.price} pièces.`);
}
// vente rapide aux passants (objets seulement) : immédiate, moins chère
function mkQuick(id) {
  const it = S.inv.find(i => i.id === id); if (!it) return;
  const go = () => {
    const i = S.inv.indexOf(it); if (i < 0) return;
    const p = typeof sellPrice === 'function' ? sellPrice(it) : Math.round(value(it) * 0.6);
    S.inv.splice(i, 1); gainCoins(p); S.stats.sold = (S.stats.sold || 0) + 1; try { bump('sell'); } catch (e) {}
    for (const o of Object.values(S.outfits || {})) if (o && o.worn && o.worn[it.sub] === it.id) { o[it.sub] = 'none'; o.worn[it.sub] = null; }
    save(); renderTop(); renderComps(); renderPanel(); toast(`Vendu à un passant : +${p} pièces.`);
  };
  if (typeof styleGuard === 'function') styleGuard(id, 'vendre', go); else go();
}

// ---------- acheter ----------
function mkBuy(id) {
  const m = mkState(), l = m.list.find(x => x.id === id); if (!l) return;
  if (S.coins < l.price) { toast('Pas assez de pièces. Livrez une commande au comptoir, ou vendez au marché !'); return; }
  S.coins -= l.price;
  m.list = m.list.filter(x => x !== l);
  const R = typeof RG !== 'undefined' ? RG[l.seller.region] : null, from = { how: 'marche', place: l.seller.name, region: l.seller.region };
  let msg;
  if (l.kind === 'comp') {
    const d = l.data, cid = addComp({ sp: d.sp, genes: d.genes, rarity: d.rarity, hybrid: d.hybrid, name: d.name, from });
    if (S.prog[cid] && d.lvl > 1) S.prog[cid].lvl = d.lvl;
    if (S.comps[cid]) S.comps[cid].paid = l.price;
    msg = `${d.name} vous rejoint ! ${(S.team || []).includes(cid) ? 'Dans l’équipe.' : 'Au refuge.'}`;
  } else if (l.kind === 'egg') { const eid = addEgg({ sp: l.data.sp || undefined, from, hatchMs: 2 * 60e3 }), eg = (S.eggs || []).find(x => x.id === eid); if (eg) eg.paid = l.price; msg = 'Œuf acheté : il éclora au refuge dans 2 minutes.'; }
  else if (l.kind === 'recipe') { const s = bqState(); if (!s.recipes.includes(l.data.rec)) s.recipes.push(l.data.rec); msg = `Nouvelle recette à l’atelier : « ${l.data.name} » !`; }
  else {
    const d = l.data, it = makeItem([d.name, d.cat, d.sub, d.rarity, d.look, d.color], 0, `Marché mondial · ${l.seller.name}`, [], { fixed: d.rarity });
    if (d.rid) it.rid = d.rid;
    it.origin = d.origin ? Object.assign({}, d.origin) : R ? { region: R.id, place: R.short, km: mkRegOrigin({ region: R.id }).km } : undefined;
    if (!it.origin) delete it.origin;
    if (d.made && it.origin) it.origin.made = 1;
    it.paid = l.price;
    S.inv.push(it); S.dex[it.name] = true;
    msg = `Acheté : « ${it.name} » (${R ? R.short : 'monde'}). Il vous attend dans le sac.`;
  }
  S.stats.mkBought = (S.stats.mkBought || 0) + 1;
  save(); renderTop(); renderPanel(); toast(msg);
  try { GAME.emit('market:buy', { listing: l }); } catch (e) {}
}

// ---------- les ventes se concluent avec le temps ----------
function mkProcess(silent) {
  const m = mkState(), now = Date.now(), done = [];
  for (const l of m.mine) if (!l.sold && l.sellAt && now >= l.sellAt) { l.sold = now; done.push(l); gainCoins(l.price); m.sold++; m.earned += l.price; S.stats.sold = (S.stats.sold || 0) + 1; try { bump('sell'); } catch (e) {} }
  if (!done.length) return false;
  m.unseen += done.length;
  // les annonces vendues restent affichées une heure
  m.mine = m.mine.filter(l => !l.sold || now - l.sold < 3600e3);
  save();
  const nm = l => l.kind === 'comp' ? l.data.name : l.kind === 'egg' ? 'un œuf' : `« ${l.data.name} »`;
  const R = l => (typeof RG !== 'undefined' && RG[l.buyer.region] ? RG[l.buyer.region].short : '');
  if (done.length === 1) { const l = done[0]; toast(`Vendu ! ${l.buyer.name} (${R(l)}) a acheté ${nm(l)} : +${l.price} pièces.`); }
  else toast(`${silent ? 'Pendant votre absence : ' : ''}${done.length} ventes au marché mondial, +${done.reduce((a, l) => a + l.price, 0)} pièces !`);
  try { GAME.emit('market:sold', { listings: done }); } catch (e) {}
  return true;
}

// ---------- affichage ----------
const MK_ARROW = t => t > 0 ? '<i class="mk-tr up" title="Prix en hausse">↑</i>' : t < 0 ? '<i class="mk-tr dn" title="Prix en baisse">↓</i>' : '<i class="mk-tr eq" title="Prix stable">→</i>';
function mkFlag(region) { const R = typeof RG !== 'undefined' ? RG[region] : null; return R ? `<span class="mk-flag">${rgIcon(R, 's')}<span>${esc(R.short)}</span></span>` : ''; }
function mkIcon(l) {
  const k = l.id + (l.kind === 'comp' ? 'c' : l.kind === 'egg' ? 'e' : '');
  if (l.kind === 'comp') { if (!mkArt.has(k)) mkArt.set(k, bqCompSVG({ sp: l.data.sp, genes: l.data.genes, hybrid: l.data.hybrid }, 'mk' + l.id)); return mkArt.get(k); }
  if (l.kind === 'egg') { if (!mkArt.has(k)) mkArt.set(k, bqEggSVG(l.data.sp, 'mke' + l.id)); return mkArt.get(k); }
  if (l.kind === 'recipe') return itemIcon(bqItemOf(l.data.def)) + '<i class="mk-recb">Recette</i>';
  return itemIcon(l.data);
}
function mkTitle(l) {
  const d = l.data;
  if (l.kind === 'comp') return `${esc(d.name)} <small>${esc(d.hybrid ? `${spName(d.hybrid.a)} × ${spName(d.hybrid.b)}` : spName(d.sp))} · niv. ${d.lvl}</small>`;
  if (l.kind === 'egg') return d.sp ? `Œuf de ${esc(spName(d.sp).toLowerCase())}` : 'Œuf mystère';
  if (l.kind === 'recipe') return `Recette : ${esc(d.name)}`;
  return esc(d.name);
}
function mkSub(l) {
  const d = l.data;
  if (l.kind === 'comp') { let g = ''; try { g = typeof geneLabel === 'function' ? geneLabel(d.genes, d.sp) : ''; } catch (e) {} g = String(g || '').split(' · ').filter(x => !/^Hybride$/i.test(x)).join(' · '); return `<b style="color:${RARC[d.rarity || 0]}">${RARITY[d.rarity || 0]}</b>${d.hybrid ? ' · <b class="mk-hyb">Hybride</b>' : ''}${g ? ' · ' + esc(g) : ''}`; }
  if (l.kind === 'egg') return d.sp ? `${esc(spName(d.sp))} garanti · éclot en 2 min` : 'Espèce surprise · éclot en 2 min';
  if (l.kind === 'recipe') return 'Débloque la recette à l’atelier';
  const R = d.origin && typeof RG !== 'undefined' ? RG[d.origin.region] : null, km = d.origin && d.origin.km;
  return `<b style="color:${RARC[d.rarity]}">${RARITY[d.rarity]}</b> · ${d.cat === 'v' ? SLOT_LABEL[d.sub] : CAT_LABEL[d.cat] || ''}${d.rid && R ? ` · ${esc(rgDe(R).replace(/^./, c => c.toUpperCase()))}${km > 150 ? ` <i class="mk-far">${km.toLocaleString('fr-FR')} km</i>` : ''}` : ''}`;
}
const mkKeyOf = l => l.kind === 'comp' ? 'c:' + l.data.sp : l.kind === 'egg' ? 'e:' + (l.data.sp || 'x') : l.kind === 'recipe' ? 'rec:' + l.data.rec : mkItemKey(l.data);
function mkRowBuy(l) {
  const can = S.coins >= l.price, deal = l.price <= l.fair * 0.92;
  return `<article class="mk-row k-${l.kind}" style="--rc:${RARC[(l.data.rarity) || 0]}"><span class="mk-ic">${mkIcon(l)}</span><div class="mk-x"><b class="mk-t">${mkTitle(l)}</b><span class="mk-s">${mkSub(l)}</span><span class="mk-by"><span class="mk-av">${esc(l.seller.name[0])}</span>${esc(l.seller.name)} ${mkFlag(l.seller.region)}</span></div>
    <div class="mk-p"><button class="btn ${can ? 'gold' : 'cream'} sm" data-mkbuy="${l.id}" ${can ? '' : 'disabled'}>${coins(l.price)}</button><span class="mk-fair">${MK_ARROW(mkTrend(mkKeyOf(l)))} ${deal ? '<b class="mk-deal">Bonne affaire</b>' : `moy. ${l.fair}`}</span></div></article>`;
}
// ce que le joueur peut vendre dans la catégorie
function mkSellables(cat) {
  if (cat === 'comp') {
    const n = Object.keys(S.comps || {}).length;
    const cs = Object.keys(S.comps || {}).map(k => ({ t: 'comp', k, c: S.comps[k], ok: !S.trips[k] && n > 1 }));
    const es = (S.eggs || []).map(e => ({ t: 'egg', k: e.id, e }));
    return [...cs, ...es];
  }
  return S.inv.filter(it => mkCatOf(it) === cat && (cat !== 'res' || !mkRegion || (it.origin && it.origin.region === mkRegion))).slice().sort((a, b) => b.rarity - a.rarity || (b.rid ? 1 : 0) - (a.rid ? 1 : 0)).map(it => ({ t: 'item', k: it.id, it }));
}
function mkRowSell(x) {
  let ic, ti, sub, fair, extra = '';
  if (x.t === 'comp') {
    const p = S.prog[x.k] || { lvl: 1 }; ic = `<img src="${portraitURI(x.k)}" alt="">`; ti = `${esc(x.c.name)} <small>${esc(CHARS[x.k] ? CHARS[x.k].species : spName(x.c.sp))} · niv. ${p.lvl}</small>`;
    fair = mkCompPrice({ sp: x.c.sp, rarity: x.c.rarity, hybrid: x.c.hybrid, lvl: p.lvl });
    sub = `<b style="color:${RARC[x.c.rarity || 0]}">${RARITY[x.c.rarity || 0]}</b>${x.c.hybrid ? ' · <b class="mk-hyb">Hybride</b>' : ''}${(S.team || []).includes(x.k) ? ' · dans l’équipe' : ''}`;
    if (!x.ok) extra = `<span class="mk-no">${S.trips[x.k] ? 'En voyage' : 'Dernier compagnon'}</span>`;
  } else if (x.t === 'egg') {
    ic = bqEggSVG(x.e.sp, 'mks' + x.k); ti = x.e.sp ? `Œuf de ${esc(spName(x.e.sp).toLowerCase())}` : 'Œuf mystère'; fair = mkEggPrice(x.e.sp); sub = 'Œuf de compagnon';
  } else {
    const it = x.it; ic = itemIcon(it); ti = esc(it.name); fair = mkFair(it);
    sub = `<b style="color:${RARC[it.rarity]}">${RARITY[it.rarity]}</b> · ${it.cat === 'v' ? SLOT_LABEL[it.sub] : CAT_LABEL[it.cat] || ''}`;
    try { if (typeof rgPill === 'function') sub += ' ' + rgPill(it, 'short'); } catch (e) {}
  }
  const t = mkTrend(x.t === 'comp' ? 'c:' + x.c.sp : x.t === 'egg' ? 'e:' + (x.e.sp || 'x') : mkItemKey(x.it));
  const open = mkOpenRow === x.k && !extra;
  let acts = extra;
  if (!extra) acts = `${x.t === 'item' ? `<button class="mk-quick" data-mkquick="${x.k}" title="Vente immédiate à un passant">Passant ${coins(typeof sellPrice === 'function' ? sellPrice(x.it) : 0)}</button>` : ''}<button class="btn ${open ? 'cream' : 'gold'} sm" data-mkopen="${x.k}">${open ? 'Fermer' : 'Vendre'}</button>`;
  let h = `<article class="mk-row sell${open ? ' open' : ''}"><span class="mk-ic">${ic}</span><div class="mk-x"><b class="mk-t">${ti}</b><span class="mk-s">${sub}</span><span class="mk-by">Prix du marché ~${fair} ${MK_ARROW(t)}</span></div><div class="mk-p">${acts}</div>`;
  const obj = x.c || x.e || x.it, paid = mkPaid(obj);
  if (open && paid) h += `<p class="small mk-paid">Acheté ${paid} pièces : il ne se revend pas plus cher que son prix d’achat.</p>`;
  if (open) h += `<div class="mk-prices">${[[0.85, 'Rapide'], [1, 'Juste prix'], [1.3, 'Ambitieux']].map(([f, lab]) => `<button data-mkprice="${x.t}:${x.k}:${f}"><b>${lab}</b>${coins(mkCapP(obj, mkR5(fair * f)))}<small>${mkEta(mkCapP(obj, mkR5(fair * f)) / fair, x.t === 'item' ? 'x' : 'comp')}</small></button>`).join('')}</div>`;
  return h + `</article>`;
}
function mkRowMine(l) {
  const now = Date.now();
  let st;
  if (l.sold) st = `<b class="mk-ok">Vendu à ${esc(l.buyer.name)}</b> ${mkFlag(l.buyer.region)}`;
  else if (l.sellAt) st = `Un acheteur s’intéresse… <span class="mk-eta" data-mkcd="${l.sellAt}">${fmtDur(l.sellAt - now)}</span>`;
  else st = '<span class="mk-warn">Trop cher : personne n’achète à ce prix</span>';
  const ic = l.kind === 'comp' ? mkIcon(l) : l.kind === 'egg' ? mkIcon(l) : itemIcon(l.data);
  const acts = l.sold ? `<span class="money ok">+${l.price}</span>` : `<span class="money">${COIN}${l.price}</span><span class="mk-btns">${!l.sellAt || l.price > l.fair * 1.1 ? `<button class="mk-quick" data-mklow="${l.id}">−10 %</button>` : ''}<button class="mk-quick" data-mkun="${l.id}">Retirer</button></span>`;
  return `<article class="mk-row mine${l.sold ? ' done' : ''}"><span class="mk-ic">${ic}</span><div class="mk-x"><b class="mk-t">${mkTitle(l)}</b><span class="mk-s">${st}</span><span class="mk-by">Prix du marché ~${l.fair}</span></div><div class="mk-p">${acts}</div></article>`;
}
function renderMarche(box) {
  const m = mkState(); mkProcess(); mkRotate();
  const mine = m.mine.filter(l => !l.sold).length;
  if (m.unseen && mkAuto !== m.sold) { mkAuto = m.sold; mkView = 'annonces'; } // des ventes conclues : on les montre d'abord
  if (mkView === 'annonces' && m.unseen) { m.unseen = 0; save(); setTimeout(() => { try { renderNav(); } catch (e) {} }, 0); }
  const online = 1180 + Math.round(240 * Math.sin(Date.now() / 3.6e6)) + (mkHash(dayKey()) % 90);
  let h = `<div class="mk-ban"><span class="mk-glob" aria-hidden="true"><svg viewBox="0 0 30 30">${MK_CATS[2][2]}</svg></span><div><b>Marché mondial <span>(bientôt avec de vrais joueurs)</span></b><small>${online.toLocaleString('fr-FR')} voyageurs simulés · ${m.list.length} annonces · le stock tourne en continu</small></div></div>`;
  h += `<div class="filters mk-views"><button data-mkview="acheter" aria-pressed="${mkView === 'acheter'}">Acheter</button><button data-mkview="vendre" aria-pressed="${mkView === 'vendre'}">Vendre</button><button data-mkview="annonces" aria-pressed="${mkView === 'annonces'}">Mes annonces${mine ? ` <small>${mine}</small>` : ''}${m.unseen ? '<i class="mk-dot" aria-label="Ventes conclues"></i>' : ''}</button></div>`;
  if (mkView !== 'annonces') {
    h += `<div class="mk-cats" role="tablist">${MK_CATS.map(([k, l, ic]) => `<button role="tab" data-mkcat="${k}" aria-selected="${mkCat === k}"><svg viewBox="0 0 30 30" aria-hidden="true">${ic}</svg><span>${l}</span></button>`).join('')}</div>`;
    if (mkCat === 'res' && typeof REGIONS !== 'undefined') {
      const home = typeof rgHome === 'function' ? rgHome() : null;
      h += `<div class="mk-reg"><label for="mkRegion">Région</label><select id="mkRegion"><option value="">Toutes les régions du monde</option>${home ? `<option value="${home.id}" ${mkRegion === home.id ? 'selected' : ''}>Ma région (${esc(home.short)})</option>` : ''}${RG_GROUPS.map((g, gi) => `<optgroup label="${esc(g)}">${REGIONS.filter(R => R.g === gi && R.id !== 'grand_large').map(R => `<option value="${R.id}" ${mkRegion === R.id ? 'selected' : ''}>${esc(R.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
    }
    if (mkCat === 'comp' && mkSp) h += `<div class="mk-chip">Espèce : <b>${esc(spName(mkSp))}</b><button data-mkclr="1" aria-label="Retirer le filtre">✕</button></div>`;
  }
  if (mkView === 'acheter') {
    let list = m.list.filter(l => l.cat === mkCat);
    if (mkCat === 'res' && mkRegion) list = list.filter(l => l.region === mkRegion);
    if (mkCat === 'comp' && mkSp) { const f = list.filter(l => l.data.sp === mkSp); list = f.length ? f : list; if (!f.length) h += `<p class="small">Aucun ${esc(spName(mkSp).toLowerCase())} en vente pour l’instant : revenez dans quelques minutes, le stock tourne.</p>`; }
    list.sort((a, b) => (a.kind === 'egg') - (b.kind === 'egg') || (b.data.rarity || 0) - (a.data.rarity || 0) || a.price - b.price);
    h += list.length ? `<div class="mk-list">${list.map(mkRowBuy).join('')}</div>` : `<p class="empty">Pas d’annonce ici pour l’instant. De nouvelles arrivent toutes les minutes.</p>`;
    h += `<p class="small">Vous avez ${coins(S.coins)}. Les prix suivent la rareté et la provenance : une spécialité lointaine coûte plus cher. ↑ prix en hausse, ↓ en baisse.</p>`;
  } else if (mkView === 'vendre') {
    const xs = mkSellables(mkCat);
    h += `<p class="small mk-help">${mkCat === 'comp' ? 'Proposez un compagnon ou un œuf : un joueur du monde l’adoptera. Un compagnon en voyage, ou votre dernier compagnon, ne peut pas être vendu.' : 'Vente immédiate à un passant, ou annonce au marché mondial : plus cher, mais il faut attendre un acheteur. Plus le prix est juste, plus la vente est rapide.'}</p>`;
    h += xs.length ? `<div class="mk-list">${xs.map(mkRowSell).join('')}</div>` : `<p class="empty">Rien à vendre dans cette catégorie. Vos compagnons rapportent de quoi vendre à chaque voyage !</p>`;
  } else {
    const all = m.mine.slice().sort((a, b) => (a.sold ? 1 : 0) - (b.sold ? 1 : 0) || b.at - a.at);
    h += all.length ? `<div class="mk-list">${all.map(mkRowMine).join('')}</div>` : `<p class="empty">Aucune annonce. Touchez « Vendre » pour proposer un objet, un œuf ou un compagnon.</p>`;
    h += `<p class="small">${m.sold} vente${m.sold > 1 ? 's' : ''} au total · ${coins(m.earned)} gagnées au marché mondial.</p>`;
  }
  box.innerHTML = h;
}
function openMarche(cat, sp) {
  if (cat && MK_CATS.some(c => c[0] === cat)) mkCat = cat;
  mkSp = sp || ''; mkView = 'acheter';
  if (typeof openBoutique === 'function') openBoutique('marche');
}
// le joueur voit tout de suite ses ventes en ouvrant le marché
if (typeof openBoutique === 'function') openBoutique = (orig => function (sub) { if (sub === 'marche' && mkUnseen()) mkView = 'annonces'; return orig.apply(this, arguments); })(openBoutique);

// ---------- branchements ----------
// premier lancement : l'étape du choix du commerce, après l'éclosion et le nom du premier compagnon
if (typeof FIRST_RUN_STEPS !== 'undefined' && typeof bqChooseOpen === 'function') FIRST_RUN_STEPS.push(next => bqChooseOpen('first', next));
if (typeof startFirstRun === 'function') startFirstRun = (orig => function () {
  const F = S.firstRun;
  if (F && F.stage === 'commerce') { document.body.classList.add('firstrun'); return bqChooseOpen('first', firstRunNext); }
  return orig.apply(this, arguments);
})(startFirstRun);
if (typeof COMP_FROM !== 'undefined' && !COMP_FROM.marche) COMP_FROM.marche = 'Adopté au marché mondial';
// « Sert à… » : prix indicatif au marché mondial
if (typeof USE_KIND !== 'undefined' && !USE_KIND.vendre) USE_KIND.vendre = ['Marché', '#f1ece4', '#7a5f50'];
if (typeof GAME !== 'undefined') GAME.addUses(it => { if (!it || !it.name || it.cat === 't') return []; const p = mkFair(it); return p ? [{ txt: `Se vend ~${p} pièces au marché mondial`, kind: 'vendre' }] : []; });
// point rouge sur l'onglet Boutique : ventes conclues, ou commerce à choisir / à ouvrir
if (typeof renderNav === 'function') renderNav = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const b = document.querySelector('#nav [data-nav="boutique"]');
    const pend = (typeof bqChoicePending === 'function' && bqChoicePending()) || (typeof bqSlotNew === 'function' && bqSlotNew());
    if (b && (mkUnseen() || pend) && !b.querySelector('.mk-ndot')) b.insertAdjacentHTML('beforeend', `<i class="mk-ndot" aria-label="${mkUnseen() ? 'Ventes conclues au marché' : 'Nouveau commerce à choisir'}"></i>`);
  } catch (e) {}
  return r;
})(renderNav);

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-mkview],[data-mkcat],[data-mkbuy],[data-mkopen],[data-mkprice],[data-mkquick],[data-mkun],[data-mklow],[data-mkclr]'); if (!el || el.disabled) return;
  const d = el.dataset, body = $('panelBody'), top = body ? body.scrollTop : 0;
  if (d.mkview) { mkView = d.mkview; mkOpenRow = null; renderPanel(); if (body) body.scrollTop = 0; return; }
  if (d.mkcat) { mkCat = d.mkcat; mkOpenRow = null; if (d.mkcat !== 'comp') mkSp = ''; renderPanel(); return; }
  if (d.mkclr) { mkSp = ''; renderPanel(); return; }
  if (d.mkbuy) { mkBuy(d.mkbuy); if (body) body.scrollTop = top; return; }
  if (d.mkopen) { mkOpenRow = mkOpenRow === d.mkopen ? null : d.mkopen; renderPanel(); if (body) body.scrollTop = top; return; }
  if (d.mkquick) { mkQuick(d.mkquick); if (body) body.scrollTop = top; return; }
  if (d.mkun) { mkUnlist(d.mkun); return; }
  if (d.mklow) { mkLower(d.mklow); if (body) body.scrollTop = top; return; }
  if (d.mkprice) {
    const [t, k, f] = d.mkprice.split(':'), mult = parseFloat(f);
    if (t === 'item') mkListItem(k, mult); else if (t === 'comp') mkListComp(k, mult); else if (t === 'egg') mkListEgg(k, mult);
    if (body) body.scrollTop = top;
  }
});
document.addEventListener('change', ev => { if (ev.target && ev.target.id === 'mkRegion') { mkRegion = ev.target.value; mkRotate(); save(); renderPanel(); } });

// horloge : ventes, rotation du stock, comptes à rebours
function mkTick() {
  try {
    const sold = mkProcess(), rot = Date.now() - mkState().last > 30e3 ? mkRotate() : false;
    if (sold || rot) save();
    const onMk = tab === 'boutique' && typeof bView !== 'undefined' && bView === 'marche';
    if (sold) { if (onMk && !mkOpenRow) renderPanel(); else renderNav(); renderTop(); }
    else if (rot && onMk && mkView === 'acheter' && !mkOpenRow) { const b = $('panelBody'), t = b ? b.scrollTop : 0; renderPanel(); if (b) b.scrollTop = t; }
    const now = Date.now();
    document.querySelectorAll('[data-mkcd]').forEach(e => { e.textContent = fmtDur(+e.dataset.mkcd - now); });
  } catch (e) { console.error('marché', e); }
}
// au chargement : l'ancien marché (annonces en cours) rejoint le marché mondial ; ventes conclues pendant l'absence
(function mkInit() {
  try {
    const m = mkState();
    if (S.market && Array.isArray(S.market.mine) && S.market.mine.length) {
      for (const o of S.market.mine) if (o && o.item && !o.sold) { const fair = mkFair(o.item); m.mine.push({ id: 'p' + uidGen(), kind: 'item', cat: mkCatOf(o.item), data: o.item, price: o.price, fair, at: o.listedAt || Date.now(), sellAt: o.sellAt, buyer: mkSeller() }); }
      S.market.mine = [];
    }
    mkRotate(true);
    if (mkProcess(true)) { /* notification déjà affichée */ }
    save();
  } catch (e) { console.error('marché', e); }
})();
setInterval(mkTick, 5000);

// ---------- styles ----------
(function mkCSS() {
  const st = document.createElement('style'); st.id = 'marcheCSS';
  st.textContent = `
.mk-ban{display:flex;align-items:center;gap:10px;background:linear-gradient(100deg,#e6f4fb,#fff6dc);border:2.5px solid var(--ink);border-radius:18px;padding:9px 12px;margin-bottom:10px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.mk-glob{flex:none;width:42px;height:42px;border-radius:50%;background:#fff;border:2px solid var(--ink);display:grid;place-items:center;color:var(--ink)}.mk-glob svg{width:32px;height:32px}
.mk-ban>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.mk-ban b{font:800 16.5px/1.2 var(--display)}.mk-ban b span{font:700 13px var(--display);color:var(--teal)}
.mk-ban small{font-size:12px;color:var(--ink2)}
.mk-views{margin-bottom:8px}.mk-views button{position:relative}
.mk-dot,.mk-ndot{position:absolute;width:12px;height:12px;border-radius:50%;background:var(--rust,#d9604f);border:2px solid #fff;box-shadow:0 0 0 1.5px var(--ink)}
.mk-dot{top:-5px;right:-5px}
#nav button{position:relative}.mk-ndot{top:3px;left:calc(50% - 20px)}
.mk-cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-bottom:8px}
.mk-cats button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px 5px;border-radius:14px;border:2.5px solid var(--line);background:#fff;cursor:pointer;color:var(--ink2);font:700 11.5px/1.15 var(--display);text-align:center}
.mk-cats button svg{width:26px;height:26px;color:var(--ink)}
.mk-cats button[aria-selected="true"]{border-color:var(--ink);background:#fff3c4;color:var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.3)}
.mk-reg{display:flex;align-items:center;gap:8px;margin-bottom:8px}.mk-reg label{font:800 13.5px var(--display)}.mk-reg select{flex:1;min-width:0;font:700 14px var(--display);padding:6px 8px;border:2px solid var(--ink);border-radius:12px;background:#fff;color:var(--ink)}
.mk-chip{display:inline-flex;align-items:center;gap:6px;background:#fff3c4;border:2px solid var(--ink);border-radius:999px;padding:3px 4px 3px 12px;margin-bottom:8px;font:700 13px var(--display)}
.mk-chip button{width:24px;height:24px;border-radius:50%;border:0;background:#fff;cursor:pointer;font-weight:800}
.mk-list{display:flex;flex-direction:column;gap:7px}
.mk-row{display:flex;flex-wrap:wrap;align-items:center;gap:9px;background:#fff;border:2.5px solid var(--line);border-left:6px solid var(--rc,#9a95a3);border-radius:16px;padding:7px 8px;box-shadow:0 2px 0 rgba(74,53,40,.15)}
.mk-row.k-comp{background:linear-gradient(90deg,#fff7ec,#fff 60%)}
.mk-ic{position:relative;flex:none;width:52px;height:52px;border-radius:14px;background:#fbf3e3;border:2px solid var(--line);display:grid;place-items:center;overflow:hidden}
.mk-ic svg{width:42px;height:42px}.k-comp .mk-ic svg,.mk-row.sell .mk-ic img{width:50px;height:54px}.k-egg .mk-ic svg{width:38px;height:46px}
.mk-ic img{width:50px;height:54px}
.mk-recb{position:absolute;bottom:1px;left:50%;transform:translateX(-50%);background:var(--teal);color:#fff;font:800 9px/1 var(--display);font-style:normal;padding:2px 4px;border-radius:5px}
.mk-x{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.mk-t{font:800 14.5px/1.2 var(--display)}.mk-t small{font:700 11.5px var(--display);color:var(--ink2)}
.mk-s{font-size:11.5px;color:var(--ink2);line-height:1.3}.mk-s .rgp{vertical-align:middle}
.mk-by{display:flex;align-items:center;flex-wrap:wrap;gap:4px;font:700 11.5px var(--display);color:var(--muted)}
.mk-av{width:16px;height:16px;border-radius:50%;background:#f3aec1;color:#fff;display:inline-grid;place-items:center;font:800 10px/1 var(--display)}
.mk-flag{display:inline-flex;align-items:center;gap:3px;background:#f6f1e7;border-radius:8px;padding:0 6px 0 2px;color:var(--ink2)}
.mk-flag .rgb{width:15px;height:15px}
.mk-far{font-style:normal;color:#b0482f;font-weight:700}
.mk-hyb{color:#9a6fd6}
.mk-p{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.mk-fair{font:700 11px var(--display);color:var(--muted);white-space:nowrap}
.mk-tr{font-style:normal;font-weight:800;font-size:13px}.mk-tr.up{color:#c9483a}.mk-tr.dn{color:#2f9f6a}.mk-tr.eq{color:var(--muted)}
.mk-deal{color:#2f9f6a}
.mk-quick{background:#fff;border:2px solid var(--line);border-radius:10px;padding:3px 7px;font:700 12px var(--display);color:var(--ink2);cursor:pointer;white-space:nowrap}
.mk-quick .money{font-size:12px}.mk-quick .coin{width:12px;height:12px}
.mk-row.sell .mk-p{flex-direction:row;align-items:center}
.mk-btns{display:flex;gap:4px}
.mk-no{font:700 11.5px var(--display);color:var(--muted);background:#f4efe6;border-radius:8px;padding:3px 7px}
.mk-prices{flex-basis:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mk-prices button{display:flex;flex-direction:column;align-items:center;gap:1px;background:#fff6dc;border:2px solid var(--ink);border-radius:12px;padding:5px 3px;cursor:pointer;font:700 12px var(--display);color:var(--ink);box-shadow:0 2px 0 rgba(74,53,40,.3)}
.mk-prices button:nth-child(2){background:#effaf2}
.mk-prices small{font-size:10.5px;color:var(--ink2)}
.mk-row.open{border-color:var(--ink)}
.mk-row.mine.done{background:#effaf2}
.mk-ok{color:#2f7f6c}.mk-warn{color:#b0482f;font-weight:700}.mk-eta{font-weight:800;color:var(--ink)}
.mk-help{margin:0 0 8px}
@media (max-width:420px){.mk-cats button span{font-size:10.5px}.mk-row.sell .mk-p{flex-basis:100%;justify-content:flex-end}.mk-row.mine .mk-p{flex-direction:row;align-items:center;flex-basis:100%;justify-content:flex-end}}
`;
  document.head.appendChild(st);
})();

window.__marche = {
  removeComp, renderMarche, openMarche, state: mkState, rotate: mkRotate, process: mkProcess, buy: mkBuy, fair: mkFair, compPrice: mkCompPrice,
  listItem: mkListItem, listComp: mkListComp, listEgg: mkListEgg, unlist: mkUnlist,
  // tests : avancer le temps des annonces
  rush() { mkState().mine.forEach(l => { if (!l.sold) l.sellAt = Date.now() - 1; }); return mkProcess(); },
  set(v) { if (v.view) mkView = v.view; if (v.cat) mkCat = v.cat; if ('region' in v) mkRegion = v.region; if ('sp' in v) mkSp = v.sp; if ('row' in v) mkOpenRow = v.row; },
  S: () => S,
};

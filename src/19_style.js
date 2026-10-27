// ================= COMPAGNONS : garde-robe, rêves, talents, concours de style =================
// Onglet « Compagnons » (étape Boutique + Compagnons). Expose renderCompagnons(box) et openCompagnons(sub).
// État : S.style = { contest: { week, entries, paid }, trophies: [], colors: { idObjet: couleur }, saved: { compagnon: [3 tenues] } }.
// Une tenue portée vit dans S.outfits[k] : o[slot] = forme dessinée, o.worn[slot] = id de l'objet du sac, o.col[forme] = couleur.

// ---------- état ----------
const ST_SLOT_IDS = SLOTS.map(s => s[0]);
const ST_LEFT = ['tete', 'cou', 'haut', 'mains'], ST_RIGHT = ['dos', 'bas', 'pieds'];
const ST_TINT = { pistache: '#ffe1cc', mochi: '#f3e6d3', bulle: '#ffe0ea' };
const ST_TINT2 = { pistache: '#f7b98f', mochi: '#dcc0a0', bulle: '#f6b3c8' };
function stWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return { y, w, key: y * 100 + w };
}
function stDaysLeft() { const d = new Date(), day = d.getDay() || 7; return 8 - day; } // jusqu'à lundi
function styleState() {
  if (!S.style || typeof S.style !== 'object') S.style = {};
  const s = S.style;
  if (!s.contest || typeof s.contest !== 'object') s.contest = { week: 0, entries: [] };
  if (!Array.isArray(s.contest.entries)) s.contest.entries = [];
  if (typeof s.contest.paid !== 'number') s.contest.paid = 0;
  if (!Array.isArray(s.trophies)) s.trophies = [];
  if (!s.colors || typeof s.colors !== 'object') s.colors = {};
  if (!s.saved || typeof s.saved !== 'object') s.saved = {};
  for (const k of Object.keys(CHARS)) {
    if (!Array.isArray(s.saved[k])) s.saved[k] = [null, null, null];
    while (s.saved[k].length < 3) s.saved[k].push(null);
    if (!S.outfits[k] || typeof S.outfits[k] !== 'object') S.outfits[k] = { ...CHARS[k].outfit, col: {} };
    const o = S.outfits[k];
    for (const sl of ST_SLOT_IDS) if (typeof o[sl] !== 'string') o[sl] = 'none';
    if (!o.col || typeof o.col !== 'object') o.col = {};
    if (!o.worn || typeof o.worn !== 'object') o.worn = {};
  }
  const wk = stWeek().key;
  if (s.contest.week !== wk) s.contest = { week: wk, entries: [], paid: 0 };
  return s;
}
try { styleState(); } catch (e) { console.error(e); }

// ---------- vêtements ----------
const stLookLabel = look => { for (const s of SLOTS) for (const [l, v] of s[2]) if (v === look) return l; return { chapeau: 'Chapeau', couronne: 'Couronne' }[look] || look; };
const stOrigId = (k, slot) => `orig:${k}:${slot}`;
// le vêtement de départ d'un compagnon (son écharpe, sa mandarine, ses bottes) reste toujours disponible pour lui
function stOrigItem(k, slot) {
  const look = CHARS[k].outfit[slot]; if (!look || look === 'none') return null;
  return { id: stOrigId(k, slot), name: `${stLookLabel(look)} de ${CHARS[k].name}`, cat: 'v', sub: slot, look, rarity: 0, color: IC[look], from: 'Tenue de départ', tags: [], orig: k };
}
function stItem(id, k) {
  if (!id) return null;
  if (String(id).startsWith('orig:')) { const [, kk, slot] = String(id).split(':'); return CHARS[kk] && (!k || kk === k) ? stOrigItem(kk, slot) : null; }
  return S.inv.find(i => i.id === id) || null;
}
const stColor = it => (S.style && S.style.colors[it.id]) || it.color || IC[it.look] || '#e9c46a';
const stIcon = it => itemIcon({ ...it, color: stColor(it) });
// ce que porte k sur un emplacement : objet du sac, vêtement de départ, ou ancien vêtement sans objet
function stWorn(k, slot) {
  const o = S.outfits[k]; if (!o) return null;
  const look = o[slot]; if (!look || look === 'none') return null;
  const id = o.worn && o.worn[slot];
  const it = stItem(id, k);
  if (it) return it;
  const orig = stOrigItem(k, slot);
  if (orig && orig.look === look) return orig;
  return { id: `old:${k}:${slot}`, name: stLookLabel(look), cat: 'v', sub: slot, look, rarity: 0, color: (o.col && o.col[look]) || IC[look], from: 'Ancienne tenue', tags: [], old: true };
}
function stOwned(k, slot) {
  const list = S.inv.filter(i => i.cat === 'v' && i.sub === slot && i.look).sort((a, b) => b.rarity - a.rarity || (b.date || 0) - (a.date || 0));
  const orig = stOrigItem(k, slot);
  return orig ? [orig, ...list] : list;
}
// qui porte l'objet id ? (renvoie la clé du compagnon ou null)
function styleWornBy(id) {
  if (!id) return null;
  for (const [k, o] of Object.entries(S.outfits)) if (o && o.worn) for (const sl of ST_SLOT_IDS) if (o.worn[sl] === id && o[sl] && o[sl] !== 'none') return k;
  return null;
}
const styleIsWorn = id => !!styleWornBy(id);
// un compagnon ne garde jamais un vêtement qui a quitté le sac (vendu, livré, mis en vente…) ; un objet n'habille qu'un compagnon
function styleSanitize() {
  let ch = false; const ids = new Set(S.inv.map(i => i.id)), seen = new Set();
  for (const [k, o] of Object.entries(S.outfits || {})) {
    if (!o || !o.worn) continue;
    for (const sl of ST_SLOT_IDS) {
      const id = o.worn[sl]; if (!id) continue;
      const orig = String(id).startsWith('orig:');
      if ((!orig && !ids.has(id)) || (orig && !String(id).startsWith(`orig:${k}:`)) || seen.has(id)) { o[sl] = 'none'; o.worn[sl] = null; ch = true; continue; }
      seen.add(id);
    }
  }
  if (S.style && S.style.colors) for (const id of Object.keys(S.style.colors)) if (!id.startsWith('orig:') && !ids.has(id) && Math.random() < 0.02) delete S.style.colors[id]; // petit ménage
  return ch;
}
function styleEquip(k, it, quiet) {
  styleState();
  const o = S.outfits[k], sl = it.sub; let lent = null;
  for (const [k2, o2] of Object.entries(S.outfits)) if (k2 !== k && o2.worn && o2.worn[sl] === it.id) { o2[sl] = 'none'; o2.worn[sl] = null; lent = k2; GAME.emit('outfit:change', { who: k2, slot: sl }); }
  o[sl] = it.look; o.worn[sl] = it.id; o.col[it.look] = stColor(it);
  S.stats.worn = (S.stats.worn || 0) + 1;
  if (!quiet) { save(); GAME.emit('outfit:change', { who: k, slot: sl, item: it.id }); }
  return lent;
}
function styleUnequip(k, slot, quiet) {
  const o = S.outfits[k]; if (!o) return;
  o[slot] = 'none'; if (o.worn) o.worn[slot] = null;
  if (!quiet) { save(); GAME.emit('outfit:change', { who: k, slot }); }
}
// bouton « Essayer / Retirer » du sac
function styleToggleWear(k, it) {
  const o = S.outfits[k];
  if (o.worn && o.worn[it.sub] === it.id && o[it.sub] !== 'none') { styleUnequip(k, it.sub); renderAll(); reactionPopup(k, 'content', 'Hop, rangé !'); return; }
  const lent = styleEquip(k, it);
  renderAll();
  reactionPopup(k, 'rire', lent ? `${CHARS[lent].name} me prête « ${it.name} » !` : `Comment tu me trouves avec « ${it.name} » ?`);
}
// avant de vendre, livrer ou utiliser un objet : si un compagnon le porte, on demande
function styleGuard(id, verb, go) {
  const k = styleWornBy(id), it = S.inv.find(i => i.id === id);
  if (!k || !it) return go();
  styleGuard._go = () => { styleUnequip(k, it.sub, true); go(); renderComps(); };
  showModal(`<div class="stgm">${drawChar(k, S.outfits[k], 'triste', 'stg')}</div><h2>${CHARS[k].name} le porte !</h2><p>${CHARS[k].name} porte « <b>${esc(it.name)}</b> » en ce moment. Voulez-vous le lui retirer pour le ${esc(verb)} ?</p><div class="stgb"><button class="btn cream" data-stg="no">Le garder</button><button class="btn gold" data-stg="ok">Retirer et ${esc(verb)}</button></div>`);
}
// toute sauvegarde vérifie qu'aucun compagnon ne porte un objet disparu
if (typeof save === 'function') save = (orig => function () {
  try { if (styleSanitize()) setTimeout(() => { try { renderComps(); } catch (e) {} }, 0); } catch (e) {}
  return orig.apply(this, arguments);
})(save);

// ---------- couleurs ----------
const ST_DYES = [['#f4b7c4', 'Rose bonbon'], ['#f6a68a', 'Corail'], ['#f8cf9c', 'Pêche'], ['#f6e08a', 'Citron'], ['#c6e6a4', 'Pistache'], ['#a9dcc8', 'Menthe'], ['#b8d8f0', 'Ciel'], ['#9fb6e8', 'Myrtille'], ['#c9b8ea', 'Lavande'], ['#e8c0e6', 'Lilas'], ['#fbf6ec', 'Crème'], ['#d9b48a', 'Caramel']];
function stHSL(hex) {
  const n = parseInt(String(hex || '#cccccc').slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return { h, s, l };
}
const ST_FAM = {
  rose: c => { const { h, s, l } = stHSL(c); return (h >= 290 || h < 14) && s >= 0.3 && l >= 0.58; },
  jaune: c => { const { h, s, l } = stHSL(c); return h >= 38 && h < 66 && s >= 0.4 && l >= 0.45; },
  bleu: c => { const { h, s } = stHSL(c); return h >= 185 && h < 250 && s >= 0.2; },
  vert: c => { const { h, s } = stHSL(c); return h >= 70 && h < 175 && s >= 0.15; },
  violet: c => { const { h, s } = stHSL(c); return h >= 250 && h < 300 && s >= 0.2; },
  sombre: c => stHSL(c).l < 0.42,
  clair: c => { const { s, l } = stHSL(c); return l >= 0.74 && (s >= 0.2 || l >= 0.9); },
  chaud: c => { const { h, s, l } = stHSL(c); return (h < 50 || h >= 340) && s >= 0.35 && l >= 0.35; },
  dore: c => { const { h, s, l } = stHSL(c); return h >= 35 && h < 55 && s >= 0.45 && l >= 0.45 && l < 0.82; },
  brun: c => { const { h, s, l } = stHSL(c); return h >= 15 && h < 45 && l < 0.7 && l >= 0.25 && s < 0.65; },
};
function stHueFam(c) { const { h, s, l } = stHSL(c); if (s < 0.18 || l > 0.94) return 'neutre'; return h < 15 || h >= 330 ? 'rouge' : h < 40 ? 'orange' : h < 70 ? 'jaune' : h < 170 ? 'vert' : h < 250 ? 'bleu' : 'violet'; }
function styleDye(k, slot, color) {
  const it = stWorn(k, slot); if (!it) return;
  const o = S.outfits[k];
  if (it.old) { if (color) o.col[it.look] = color; else delete o.col[it.look]; }
  else { if (color) S.style.colors[it.id] = color; else delete S.style.colors[it.id]; o.col[it.look] = stColor(it); }
  save(); GAME.emit('outfit:change', { who: k, slot, color });
}

// ---------- tenues enregistrées ----------
function stSnapshot(k) { const out = {}; for (const sl of ST_SLOT_IDS) { const it = stWorn(k, sl); out[sl] = it && !it.old ? it.id : null; } return { slots: out, at: Date.now() }; }
function stOutfitOf(k, snap) {
  const o = { tete: 'none', cou: 'none', haut: 'none', bas: 'none', mains: 'none', pieds: 'none', dos: 'none', col: {} };
  for (const sl of ST_SLOT_IDS) { const it = stItem(snap.slots[sl], k); if (it) { o[sl] = it.look; o.col[it.look] = stColor(it); } }
  return o;
}
function styleSaveOutfit(k, i) { styleState().saved[k][i] = stSnapshot(k); save(); }
function styleLoadOutfit(k, i) {
  const snap = styleState().saved[k][i]; if (!snap) return 0;
  let miss = 0;
  for (const sl of ST_SLOT_IDS) {
    const id = snap.slots[sl];
    if (!id) { styleUnequip(k, sl, true); continue; }
    const it = stItem(id, k);
    if (it) styleEquip(k, it, true); else { miss++; styleUnequip(k, sl, true); }
  }
  save(); GAME.emit('outfit:change', { who: k, load: i });
  return miss;
}

// ---------- concours de style ----------
// critères mesurables sur la tenue ; chaque critère renvoie entre 0 et 1
function stCtx(k) {
  const list = [];
  for (const sl of ST_SLOT_IDS) {
    const it = stWorn(k, sl); if (!it) continue;
    const og = !it.orig && !it.old && typeof originOf === 'function' ? originOf(it) : null;
    const reg = og && typeof RG !== 'undefined' && RG[og.region] ? og.region : null;
    list.push({ slot: sl, it, look: it.look, color: (S.outfits[k].col && S.outfits[k].col[it.look]) || stColor(it), rarity: it.rarity || 0, name: it.name || '', tags: it.tags || [], region: reg, group: reg ? RG[reg].g : null, multi: og && og.multi ? og.multi : null });
  }
  const by = {}; list.forEach(x => by[x.slot] = x);
  return { k, list, by, n: list.length };
}
const ST_CR = {
  slots: n => c => Math.min(1, c.n / n),
  look: (...ls) => c => c.list.some(x => ls.includes(x.look)) ? 1 : 0,
  looks: (n, ...ls) => c => Math.min(1, c.list.filter(x => ls.includes(x.look)).length / n),
  not: (...ls) => c => c.n && !c.list.some(x => ls.includes(x.look)) ? 1 : 0,
  col: (fam, n) => c => Math.min(1, c.list.filter(x => ST_FAM[fam](x.color)).length / n),
  allCol: fam => c => c.n >= 3 ? c.list.filter(x => ST_FAM[fam](x.color)).length / c.n : 0,
  tags: (tags, n) => c => Math.min(1, c.list.filter(x => x.tags.some(t => tags.includes(t))).length / n),
  name: (re, n) => c => Math.min(1, c.list.filter(x => re.test(x.name)).length / n),
  regions: n => c => { const s = new Set(); c.list.forEach(x => { if (x.region) s.add(x.region); (x.multi || []).forEach(r => s.add(r)); }); return Math.min(1, s.size / n); },
  region: (id, n) => c => Math.min(1, c.list.filter(x => x.region === id).length / n),
  france: n => c => Math.min(1, new Set(c.list.filter(x => x.group === 0).map(x => x.region)).size / n),
  rarity: avg => c => c.n ? Math.min(1, c.list.reduce((a, x) => a + x.rarity, 0) / c.n / avg) : 0,
  rare: (r, n) => c => Math.min(1, c.list.filter(x => x.rarity >= r).length / n),
  hues: n => c => Math.min(1, new Set(c.list.map(x => stHueFam(x.color)).filter(f => f !== 'neutre')).size / n),
  comp: k => Object.assign(c => c.k === k ? 1 : 0, { bonus: 1 }),
};
// j : juré qui y tient le plus (0 Madame Froufrou : élégance · 1 Capitaine Moustache : le thème · 2 Lulu Paillettes : couleurs et fantaisie)
const ST_THEMES = [
  { id: 'montagne', name: 'Hiver à la montagne', desc: 'Il neige sur les sommets : il faut être bien emmitouflé !', prize: ['Bonnet des cimes', 'v', 'tete', 3, 'bonnet', '#9fb6e8'],
    crit: [{ txt: 'Un bonnet bien chaud', f: ST_CR.look('bonnet'), w: 2, j: 1 }, { txt: 'Une écharpe ou un foulard', f: ST_CR.look('echarpe', 'foulard'), w: 1.5, j: 0 }, { txt: 'Des gants ou des moufles', f: ST_CR.look('gants', 'moufles'), w: 1.5, j: 1 }, { txt: 'Un pull ou un sweat', f: ST_CR.look('pull', 'sweat'), w: 1, j: 0 }, { txt: 'Un objet trouvé à la montagne ou dans la neige', f: ST_CR.tags(['montagne', 'neige'], 1), w: 1.5, j: 1 }, { txt: 'Pas de short par ce froid', f: ST_CR.not('short'), w: 0.5, j: 2 }] },
  { id: 'plage', name: 'Journée à la plage', desc: 'Soleil, sable chaud et petites vagues : tenue légère exigée.', prize: ['Chapeau de paille des vagues', 'v', 'tete', 3, 'chapeau', '#f6e08a'],
    crit: [{ txt: 'Un chapeau ou une casquette contre le soleil', f: ST_CR.look('chapeau', 'casquette'), w: 2, j: 1 }, { txt: 'Un t-shirt', f: ST_CR.look('tshirt'), w: 1, j: 0 }, { txt: 'Un short ou une jupe', f: ST_CR.look('short', 'jupe'), w: 1.5, j: 1 }, { txt: 'Deux couleurs claires et ensoleillées', f: ST_CR.col('clair', 2), w: 1, j: 2 }, { txt: 'Un objet rapporté de la mer, d’une île ou d’une plage', f: ST_CR.tags(['mer', 'ile', 'plage', 'port', 'piscine', 'glacier'], 1), w: 1.5, j: 1 }, { txt: 'Pas de moufles à la plage !', f: ST_CR.not('moufles', 'bonnet'), w: 1, j: 2 }, { txt: 'Bulle, la reine de l’eau', f: ST_CR.comp('bulle'), w: 0.5, j: 2 }] },
  { id: 'gala', name: 'Gala chic', desc: 'Tapis rouge et petits fours : on sort le grand jeu.', prize: ['Nœud de gala nuit étoilée', 'v', 'cou', 3, 'noeud', '#3b4a7a'],
    crit: [{ txt: 'Un nœud papillon', f: ST_CR.look('noeud'), w: 2, j: 0 }, { txt: 'Au moins 5 vêtements', f: ST_CR.slots(5), w: 1.5, j: 0 }, { txt: 'Des vêtements rares (Rare en moyenne)', f: ST_CR.rarity(2), w: 1.5, j: 0 }, { txt: 'Une cape pour l’entrée', f: ST_CR.look('cape'), w: 1, j: 1 }, { txt: 'Une touche sombre ou dorée', f: c => Math.max(ST_CR.col('sombre', 1)(c), ST_CR.col('dore', 1)(c)), w: 1, j: 2 }, { txt: 'Pas de bottes de pluie au gala', f: ST_CR.not('bottes'), w: 0.5, j: 0 }] },
  { id: 'piquenique', name: 'Pique-nique champêtre', desc: 'Une nappe à carreaux dans l’herbe, et un panier plein de bonnes choses.', prize: ['Couronne de pâquerettes', 'v', 'tete', 3, 'fleurs', '#fff8f0'],
    crit: [{ txt: 'Des fleurs ou un chapeau', f: ST_CR.look('fleurs', 'chapeau'), w: 2, j: 2 }, { txt: 'Un sac ou un panier sur le dos', f: ST_CR.look('sac'), w: 1.5, j: 1 }, { txt: 'Du vert ou du jaune', f: c => Math.min(1, ST_CR.col('vert', 1)(c) + ST_CR.col('jaune', 1)(c)), w: 1.5, j: 2 }, { txt: 'Un objet de la campagne, d’un parc, d’une ferme ou de la forêt', f: ST_CR.tags(['campagne', 'parc', 'ferme', 'foret', 'agrumes'], 1), w: 1.5, j: 1 }, { txt: 'Au moins 3 vêtements', f: ST_CR.slots(3), w: 1, j: 0 }] },
  { id: 'monde', name: 'Tour du monde', desc: 'Une tenue qui raconte un grand voyage : des objets de trois régions différentes.', prize: ['Cape des grands voyageurs', 'v', 'dos', 3, 'cape', '#9fb6e8'],
    crit: [{ txt: 'Des objets de 3 régions différentes', f: ST_CR.regions(3), w: 3, j: 1 }, { txt: 'Un sac à dos de voyageur', f: ST_CR.look('sac'), w: 1, j: 1 }, { txt: 'Au moins 4 vêtements', f: ST_CR.slots(4), w: 1, j: 0 }, { txt: 'Au moins 3 couleurs différentes', f: ST_CR.hues(3), w: 1, j: 2 }] },
  { id: 'rose', name: 'Tout en rose', desc: 'Du rose, du rose, et encore du rose. Lulu Paillettes préside le jury !', prize: ['Écharpe barbe à papa', 'v', 'cou', 3, 'echarpe', '#f4b7c4'],
    crit: [{ txt: 'Au moins 4 vêtements roses', f: ST_CR.col('rose', 4), w: 3, j: 2 }, { txt: 'Que du rose (rien d’autre)', f: ST_CR.allCol('rose'), w: 1.5, j: 2 }, { txt: 'Un nœud ou des fleurs', f: ST_CR.look('noeud', 'fleurs'), w: 1, j: 0 }, { txt: 'Bulle, déjà toute rose', f: ST_CR.comp('bulle'), w: 0.5, j: 2 }] },
  { id: 'bretagne', name: 'Spécial Bretagne', desc: 'Crêpes, phares et crachin : une tenue qui sent les embruns bretons.', prize: ['Ciré jaune de Bretagne', 'v', 'haut', 3, 'sweat', '#f6d36b'],
    crit: [{ txt: 'Un objet venu de Bretagne', f: ST_CR.region('bretagne', 1), w: 2.5, j: 1 }, { txt: 'Des bottes de pluie pour le crachin', f: ST_CR.look('bottes'), w: 1.5, j: 1 }, { txt: 'Du jaune (comme un ciré)', f: ST_CR.col('jaune', 1), w: 1, j: 2 }, { txt: 'Du bleu marine ou du blanc, façon marinière', f: c => Math.min(1, ST_CR.col('bleu', 1)(c) + ST_CR.col('clair', 1)(c) * 0.5), w: 1, j: 0 }, { txt: 'Un objet rapporté de la mer ou d’un port', f: ST_CR.tags(['mer', 'port', 'plage', 'poissonnerie'], 1), w: 1, j: 1 }] },
  { id: 'pluie', name: 'Jour de pluie', desc: 'Plic, ploc ! Les flaques sont faites pour sauter dedans.', prize: ['Bottes arc-en-flaque', 'v', 'pieds', 3, 'bottes', '#9fb6e8'],
    crit: [{ txt: 'Des bottes de pluie', f: ST_CR.look('bottes'), w: 2.5, j: 1 }, { txt: 'Une cape ou un sweat à capuche', f: ST_CR.look('cape', 'sweat'), w: 1.5, j: 1 }, { txt: 'Une couleur vive : jaune ou bleu', f: c => Math.min(1, ST_CR.col('jaune', 1)(c) + ST_CR.col('bleu', 1)(c)), w: 1, j: 2 }, { txt: 'Un chapeau ou une casquette', f: ST_CR.look('chapeau', 'casquette'), w: 1, j: 0 }, { txt: 'Bulle, qui adore la pluie', f: ST_CR.comp('bulle'), w: 0.5, j: 2 }] },
  { id: 'sport', name: 'Champion du sport', desc: 'Échauffement, sifflet, c’est parti ! Une tenue pour courir (même Mochi).', prize: ['Casquette de champion', 'v', 'tete', 3, 'casquette', '#f6a68a'],
    crit: [{ txt: 'Une casquette', f: ST_CR.look('casquette'), w: 1.5, j: 1 }, { txt: 'Un t-shirt ou un sweat', f: ST_CR.look('tshirt', 'sweat'), w: 1.5, j: 1 }, { txt: 'Un short', f: ST_CR.look('short'), w: 1.5, j: 1 }, { txt: 'Des chaussettes', f: ST_CR.look('chaussettes'), w: 1, j: 0 }, { txt: 'Deux couleurs vives différentes', f: ST_CR.hues(2), w: 1, j: 2 }, { txt: 'Pas de cape (on se prend les pieds dedans)', f: ST_CR.not('cape'), w: 0.5, j: 0 }] },
  { id: 'foret', name: 'Petit explorateur des bois', desc: 'Loupe, carnet et sac à dos : en route pour la grande forêt.', prize: ['Sac d’explorateur mousse', 'v', 'dos', 3, 'sac', '#a9dcc8'],
    crit: [{ txt: 'Un sac à dos', f: ST_CR.look('sac'), w: 2, j: 1 }, { txt: 'Un chapeau, un bonnet ou un béret', f: ST_CR.look('chapeau', 'bonnet', 'beret'), w: 1, j: 0 }, { txt: 'Du vert ou du brun', f: c => Math.min(1, ST_CR.col('vert', 1)(c) + ST_CR.col('brun', 1)(c)), w: 1.5, j: 2 }, { txt: 'Un objet trouvé en forêt ou dans un parc', f: ST_CR.tags(['foret', 'parc', 'camping'], 1), w: 1.5, j: 1 }, { txt: 'De bonnes bottes ou des chaussettes', f: ST_CR.look('bottes', 'chaussettes'), w: 1, j: 0 }, { txt: 'Pistache, l’exploratrice', f: ST_CR.comp('pistache'), w: 0.5, j: 2 }] },
  { id: 'royal', name: 'Royauté d’un jour', desc: 'Sa Majesté fait son entrée ! Couronne et cape de rigueur.', prize: ['Couronne de sucre d’orge', 'v', 'tete', 3, 'couronne', '#f4b7c4'],
    crit: [{ txt: 'Une couronne', f: ST_CR.look('couronne'), w: 2.5, j: 1 }, { txt: 'Une cape royale', f: ST_CR.look('cape'), w: 2, j: 1 }, { txt: 'Un objet Épique ou Légendaire', f: ST_CR.rare(3, 1), w: 1.5, j: 0 }, { txt: 'Du doré ou du violet', f: c => Math.min(1, ST_CR.col('dore', 1)(c) + ST_CR.col('violet', 1)(c)), w: 1, j: 2 }, { txt: 'Au moins 4 vêtements', f: ST_CR.slots(4), w: 1, j: 0 }] },
  { id: 'pastel', name: 'Douceur pastel', desc: 'Des couleurs tendres comme des macarons : tout en douceur.', prize: ['Pull guimauve', 'v', 'haut', 3, 'pull', '#e8c0e6'],
    crit: [{ txt: 'Au moins 4 vêtements de couleur claire', f: ST_CR.col('clair', 4), w: 2.5, j: 2 }, { txt: '3 couleurs différentes', f: ST_CR.hues(3), w: 1.5, j: 2 }, { txt: 'Rien de sombre', f: c => c.n && !c.list.some(x => ST_FAM.sombre(x.color)) ? 1 : 0, w: 1, j: 0 }, { txt: 'Au moins 5 vêtements', f: ST_CR.slots(5), w: 1, j: 0 }] },
  { id: 'cocooning', name: 'Cocooning chez Mochi', desc: 'Un plaid, un thé bien chaud et des chaussettes moelleuses. Zen.', prize: ['Chaussettes nuage', 'v', 'pieds', 3, 'chaussettes', '#fbf6ec'],
    crit: [{ txt: 'Un pull tout doux', f: ST_CR.look('pull'), w: 2, j: 1 }, { txt: 'Des chaussettes moelleuses', f: ST_CR.look('chaussettes'), w: 1.5, j: 1 }, { txt: 'Une écharpe', f: ST_CR.look('echarpe'), w: 1, j: 0 }, { txt: 'Des couleurs chaudes', f: ST_CR.col('chaud', 2), w: 1, j: 2 }, { txt: 'Mochi, maître du cocooning', f: ST_CR.comp('mochi'), w: 0.8, j: 2 }, { txt: 'Pas de bottes à la maison', f: ST_CR.not('bottes'), w: 0.5, j: 0 }] },
  { id: 'arcenciel', name: 'Arc-en-ciel', desc: 'Toutes les couleurs à la fois ! Le jury veut un vrai feu d’artifice.', prize: ['Cape arc-en-ciel', 'v', 'dos', 3, 'cape', '#c9b8ea'],
    crit: [{ txt: '5 couleurs différentes', f: ST_CR.hues(5), w: 3, j: 2 }, { txt: 'Au moins 6 vêtements', f: ST_CR.slots(6), w: 1.5, j: 0 }, { txt: 'Un objet Rare ou mieux', f: ST_CR.rare(2, 1), w: 1, j: 0 }, { txt: 'Un objet trouvé un jour d’arc-en-ciel… ou un objet magique', f: ST_CR.name(/arc|étoil|lune|magique|enchant/i, 1), w: 0.5, j: 1 }] },
  { id: 'france', name: 'Tour de France', desc: 'Une tenue cocorico : des objets de trois régions de France.', prize: ['Béret tricolore', 'v', 'tete', 3, 'beret', '#9fb6e8'],
    crit: [{ txt: 'Des objets de 3 régions de France', f: ST_CR.france(3), w: 3, j: 1 }, { txt: 'Un béret, bien sûr', f: ST_CR.look('beret'), w: 1.5, j: 0 }, { txt: 'Du bleu, du blanc ou du rouge', f: c => Math.min(1, ST_CR.hues(2)(c)), w: 1, j: 2 }, { txt: 'Au moins 4 vêtements', f: ST_CR.slots(4), w: 1, j: 0 }] },
];
const ST_JURY = [
  { name: 'Madame Froufrou', role: 'Chouette styliste', col: '#c9a07a',
    say: ['Mes plumes se hérissent !', 'Hmm. On a déjà vu plus chic.', 'Joli, mais je reste sur ma faim.', 'Très, très élégant. Hou hou !', 'Hou hou ! Un chef-d’œuvre de la mode !'] },
  { name: 'Capitaine Moustache', role: 'Morse globe-trotter', col: '#a8907c',
    say: ['Moussaillon, tu t’es trompé de semaine ?', 'Je cherche le thème avec ma longue-vue…', 'Le thème est là… à moitié.', 'Ça sent le voyage, j’aime ça !', 'Par mes moustaches ! C’est exactement le thème !'] },
  { name: 'Lulu Paillettes', role: 'Souris fantaisie', col: '#c7c3cf',
    say: ['Snif. Je suis triste pour ce pauvre compagnon.', 'Bof bof… où sont les paillettes ?', 'Mignon ! Mais il manque un petit truc…', 'Trop mignon, mon cœur fait boum !', 'Kyaaa ! Ça brille de partout !'] },
];
function stJuryFace(i) {
  const L = '#5b4636';
  if (i === 0) return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 14 L13 4 L19 11 M38 14 L35 4 L29 11" fill="#c9a07a" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="24" cy="27" rx="17" ry="17" fill="#c9a07a" stroke="${L}" stroke-width="2"/><ellipse cx="24" cy="33" rx="10" ry="9" fill="#f3e2c6"/><circle cx="17" cy="23" r="6.5" fill="#fff" stroke="${L}" stroke-width="1.8"/><circle cx="31" cy="23" r="6.5" fill="#fff" stroke="${L}" stroke-width="1.8"/><circle cx="17.5" cy="23.5" r="3" fill="${L}"/><circle cx="30.5" cy="23.5" r="3" fill="${L}"/><circle cx="16.5" cy="22.3" r="1" fill="#fff"/><circle cx="29.5" cy="22.3" r="1" fill="#fff"/><path d="M24 26 l-3 4 h6Z" fill="#f2a93b" stroke="${L}" stroke-width="1.4" stroke-linejoin="round"/><path d="M33 8 l5 -3 v6Z M33 8 l-5 -3 v6Z" fill="#f08aa6" stroke="${L}" stroke-width="1.2" stroke-linejoin="round" transform="translate(4 2)"/></svg>`;
  if (i === 1) return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="28" rx="18" ry="16" fill="#a8907c" stroke="${L}" stroke-width="2"/><path d="M9 15 H39 L36 8 H12Z" fill="#3b4a7a" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><rect x="7" y="14" width="34" height="4" rx="2" fill="#2f3b5c" stroke="${L}" stroke-width="1.6"/><circle cx="24" cy="11" r="2" fill="#f6c445"/><circle cx="18" cy="24" r="2.4" fill="${L}"/><circle cx="30" cy="24" r="2.4" fill="${L}"/><path d="M19 37 v7 M29 37 v7" stroke="#fffaf0" stroke-width="3.2" stroke-linecap="round"/><path d="M19 37 v7 M29 37 v7" stroke="${L}" stroke-width="1" stroke-linecap="round" opacity=".4"/><path d="M10 33 C14 28 20 29 24 31 C28 29 34 28 38 33 C34 37 28 36 24 34 C20 36 14 37 10 33Z" fill="#f3ead8" stroke="${L}" stroke-width="1.6"/><ellipse cx="24" cy="29" rx="3" ry="2" fill="#6b4a3c"/></svg>`;
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="10" cy="15" r="9" fill="#c7c3cf" stroke="${L}" stroke-width="2"/><circle cx="38" cy="15" r="9" fill="#c7c3cf" stroke="${L}" stroke-width="2"/><circle cx="10" cy="15" r="5" fill="#f6b3c8"/><circle cx="38" cy="15" r="5" fill="#f6b3c8"/><ellipse cx="24" cy="29" rx="15" ry="14" fill="#c7c3cf" stroke="${L}" stroke-width="2"/><circle cx="18.5" cy="27" r="2.6" fill="${L}"/><circle cx="29.5" cy="27" r="2.6" fill="${L}"/><circle cx="17.7" cy="26" r=".9" fill="#fff"/><circle cx="28.7" cy="26" r=".9" fill="#fff"/><circle cx="24" cy="33" r="2.2" fill="#f08aa6" stroke="${L}" stroke-width="1"/><ellipse cx="14" cy="33" rx="2.6" ry="1.6" fill="#f6a6b8"/><ellipse cx="34" cy="33" rx="2.6" ry="1.6" fill="#f6a6b8"/><path d="M38 34 l1.2 2.6 2.8.4 -2 2 .5 2.8 -2.5-1.3 -2.5 1.3.5-2.8 -2-2 2.8-.4Z" fill="#f6e08a" stroke="${L}" stroke-width="1"/></svg>`;
}
function styleTheme() { const w = stWeek(); return ST_THEMES[(w.y * 53 + w.w) % ST_THEMES.length]; }
const stLcf = s => s.charAt(0).toLowerCase() + s.slice(1);
function styleJudge(k, th) {
  th = th || styleTheme();
  const c = stCtx(k);
  const res = th.crit.map(cr => { let v = 0; try { v = Math.max(0, Math.min(1, cr.f(c) || 0)); } catch (e) {} return { cr, v }; });
  const tot = res.reduce((a, r) => a + r.cr.w, 0), overall = res.reduce((a, r) => a + r.v * r.cr.w, 0) / tot;
  const jury = ST_JURY.map((J, j) => {
    const mine = res.filter(r => r.cr.j === j), wsum = mine.reduce((a, r) => a + r.cr.w, 0);
    const focus = wsum ? mine.reduce((a, r) => a + r.v * r.cr.w, 0) / wsum : overall;
    let sc = c.n ? 0.55 * overall + 0.45 * focus : 0;
    const stars = Math.max(1, Math.min(5, Math.round(sc * 5 + 0.25)));
    const pool = (mine.length ? mine : res);
    const good = pool.filter(r => r.v >= 0.99).sort((a, b) => b.cr.w - a.cr.w)[0] || res.filter(r => r.v >= 0.99).sort((a, b) => b.cr.w - a.cr.w)[0];
    const bad = pool.filter(r => r.v < 0.99 && !r.cr.f.bonus).sort((a, b) => b.cr.w * (1 - b.v) - a.cr.w * (1 - a.v))[0] || res.filter(r => r.v < 0.99 && !r.cr.f.bonus).sort((a, b) => b.cr.w * (1 - b.v) - a.cr.w * (1 - a.v))[0];
    let txt = J.say[stars - 1];
    if (!c.n) txt = ['Euh… il est venu sans vêtements ?', 'Tout nu au concours ? Quelle audace !', 'Hihi, il a oublié de s’habiller !'][j];
    else {
      if (good) txt += ` J’ai adoré : ${stLcf(good.cr.txt)}.`;
      if (bad) txt += ` ${good ? 'Mais il' : 'Il'} manquait : ${stLcf(bad.cr.txt)}${bad.v > 0 ? ' (presque !)' : ''}.`;
      else txt += ' Rien à redire !';
    }
    return { s: stars, txt };
  });
  const avg = jury.reduce((a, j) => a + j.s, 0) / 3;
  return { res, overall, jury, avg: Math.round(avg * 10) / 10, stars: Math.max(1, Math.min(5, Math.round(avg))) };
}
const ST_PRIZE_COINS = [0, 20, 50, 100, 200, 350]; // cumulé : on ne paie que la différence avec le meilleur palier déjà atteint
const ST_MEDALS = { 3: ['bronze', '#d9905a', 'Trophée de bronze'], 4: ['argent', '#b9c4cc', 'Trophée d’argent'], 5: ['or', '#f2c14e', 'Trophée d’or'] };
const stTriesLeft = () => Math.max(0, 3 - styleState().contest.entries.length);
const stBest = () => { const e = styleState().contest.entries; return e.length ? e.reduce((a, b) => (b.avg > a.avg ? b : a)) : null; };
function styleEnter(k) {
  const s = styleState(), th = styleTheme();
  if (stTriesLeft() <= 0) { toast('Plus d’essai cette semaine : revenez lundi pour un nouveau thème !'); return null; }
  const J = styleJudge(k, th), prevBest = stBest();
  const o = S.outfits[k], looks = {}; ST_SLOT_IDS.forEach(sl => looks[sl] = o[sl]);
  const entry = { who: k, avg: J.avg, stars: J.stars, at: Date.now(), jury: J.jury.map(j => [j.s, j.txt]), look: { ...looks, col: { ...o.col } } };
  s.contest.entries.push(entry);
  const rec = !prevBest || J.avg > prevBest.avg;
  // récompenses des nouveaux paliers atteints
  const gains = [], tier = J.stars;
  if (tier > s.contest.paid) {
    const c = ST_PRIZE_COINS[tier] - ST_PRIZE_COINS[s.contest.paid];
    if (c > 0) { gainCoins(c); gains.push(coins(c)); }
    for (let t = s.contest.paid + 1; t <= tier; t++) {
      if (ST_MEDALS[t]) {
        const [id, col, lab] = ST_MEDALS[t];
        s.trophies.push({ week: s.contest.week, theme: th.id, name: th.name, medal: id, stars: t, who: k, at: Date.now() });
        const tr = { id: uidGen(), name: `${lab} : ${th.name}`, cat: 'd', sub: 'statue', rarity: t === 5 ? 4 : t === 4 ? 3 : 2, color: col, from: 'Concours de style', tags: [], date: Date.now(), trophy: id };
        S.inv.push(tr); S.dex[tr.name] = true; gains.push(`<b>${esc(tr.name)}</b> (à exposer dans la maison)`);
      }
      if (t === 4) {
        const it = makeItem(th.prize, 0, `Concours : ${th.name}`, [], { fixed: th.prize[3] }); it.edition = 'Exclusif concours'; it.contest = th.id;
        S.inv.push(it); S.dex[it.name] = true; gains.push(`<b class="rar r${it.rarity}">« ${esc(it.name)} »</b>, vêtement exclusif`);
      }
    }
    s.contest.paid = tier;
  }
  addXP(k, 15 * J.stars);
  save();
  try { GAME.emit('contest:done', { score: J.avg, stars: J.stars, who: k, theme: th.id, best: rec }); } catch (e) {}
  return { J, entry, gains, rec, th };
}

// ---------- rendu ----------
let stSlot = null, stJoy = 0, stJoyLine = '';
const ST_JOY = {
  pistache: ['Tadaa ! Prête pour l’aventure !', 'Ça me va bien, hein ?', 'Je vais faire tourner les têtes… et les pigeons !', 'Je suis la plus jolie de la forêt !'],
  mochi: ['Mmh. Élégant et confortable.', 'Pépin dit que ça me va bien.', 'Je me sens… très zen là-dedans.', 'Un capybara chic. C’est moi.'],
  bulle: ['Bloup ! Trop jolie !', 'On va à la plage habillée comme ça ?', 'Je fais des bulles de joie !', 'Bloup bloup, je brille !'],
};
const ST_DYE_LINE = { pistache: 'Ooh, cette couleur ! On dirait un fruit !', mochi: 'Une couleur douce. J’approuve.', bulle: 'Bloup ! Une nouvelle couleur !' };
function stStars(n, max = 5) { let h = ''; for (let i = 1; i <= max; i++) h += `<i class="sts ${i <= Math.round(n) ? 'on' : ''}" style="--d:${i * 0.12}s">★</i>`; return `<span class="stst" aria-label="${n} étoiles sur ${max}">${h}</span>`; }
function stSelector() {
  return `<div class="stsel" role="tablist" aria-label="Choisir un compagnon">${Object.keys(CHARS).map(k => {
    const p = S.prog[k], t = S.trips[k];
    return `<button role="tab" class="stc" data-stc="${k}" aria-selected="${S.sel === k}" style="--tint:${ST_TINT[k]};--tint2:${ST_TINT2[k]}"><img src="${portraitURI(k, S.sel === k ? 'rire' : 'content')}" alt=""><span><b>${CHARS[k].name}</b><i>niv. ${p.lvl}${t ? (t.done ? ' · rentré !' : ' · en voyage') : ''}</i></span></button>`;
  }).join('')}</div>`;
}
function stSlotBtn(k, sl) {
  const it = stWorn(k, sl), n = stOwned(k, sl).length, lab = SLOT_LABEL[sl];
  const ic = it ? stIcon(it) : itemIcon({ cat: 'v', sub: sl, look: sl === 'dos' ? 'sac' : null, color: '#efe4d0' });
  return `<button class="wrs ${it ? 'full' : 'vide'} ${stSlot === sl ? 'on' : ''}" data-wslot="${sl}" aria-pressed="${stSlot === sl}" aria-label="${lab} : ${it ? esc(it.name) : 'vide'}"><span class="wri" style="--rc:${it ? RARC[it.rarity] : 'var(--ink)'}">${ic}${it ? '' : '<em>+</em>'}</span><b>${lab}</b>${n ? `<i class="wrn">${n}</i>` : ''}</button>`;
}
function stCharSVG(k, mood, uid) { return drawChar(k, S.outfits[k], mood, uid); }
function renderWardrobe(k) {
  const ch = CHARS[k];
  if (!stSlot || !ST_SLOT_IDS.includes(stSlot)) stSlot = ST_SLOT_IDS.find(sl => stOwned(k, sl).length && !stWorn(k, sl)) || 'tete';
  const joy = Date.now() - stJoy < 1600, worn = ST_SLOT_IDS.filter(sl => stWorn(k, sl)).length;
  let h = `<div class="wr" style="--tint:${ST_TINT[k]};--tint2:${ST_TINT2[k]}">`;
  h += `<div class="wrstage"><svg class="wrgar" viewBox="0 0 300 26" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4 Q150 26 300 4" fill="none" stroke="#a87a50" stroke-width="1.6"/>${[...Array(9)].map((_, i) => { const x = 18 + i * 33, y = 4 + Math.sin(Math.PI * x / 300) * 11; return `<path d="M${x - 8} ${y - 1} L${x + 8} ${y - 1} L${x} ${y + 12}Z" fill="${['#f4b7c4', '#f6e08a', '#a9dcc8', '#b8d8f0', '#c9b8ea'][i % 5]}" stroke="#7a5f50" stroke-width="1"/>`; }).join('')}</svg>`;
  h += `<div class="wrcol">${ST_LEFT.map(sl => stSlotBtn(k, sl)).join('')}</div>`;
  h += `<div class="wrmid"><div class="wrchar ${joy ? 'joy' : ''}" data-wrchar="${k}">${stCharSVG(k, joy ? 'rire' : 'content', 'wr' + k)}${joy ? `<span class="wrspark" aria-hidden="true">${'<i>★</i>'.repeat(6)}</span>` : ''}</div>${joy && stJoyLine ? `<p class="wrsay">${esc(stJoyLine)}</p>` : ''}<span class="wrplate">${ch.name} <small>${worn} vêtement${worn > 1 ? 's' : ''}</small></span></div>`;
  h += `<div class="wrcol">${ST_RIGHT.map(sl => stSlotBtn(k, sl)).join('')}<button class="wrs wrsave" data-wjump="saved" aria-label="Tenues enregistrées"><span class="wri"><svg viewBox="0 0 40 40"><path d="M10 6 H30 V34 L20 27 L10 34Z" fill="#f4b7c4" stroke="#5b4636" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 11 l1.8 3.6 4 .6 -2.9 2.8.7 4 -3.6-1.9 -3.6 1.9.7-4 -2.9-2.8 4-.6Z" fill="#fff8ea"/></svg></span><b>Tenues</b></button></div>`;
  h += `</div>`;
  // emplacement choisi
  const it = stWorn(k, stSlot), list = stOwned(k, stSlot), lab = SLOT_LABEL[stSlot];
  h += `<div class="wrpanel"><div class="wrph"><span class="wrpk">${lab}</span><b>${it ? esc(it.name) : 'Rien pour l’instant'}</b>${it ? `<button class="btn cream sm" data-wunwear="${stSlot}">Retirer</button>` : ''}</div>`;
  if (it) {
    const cur = (S.outfits[k].col && S.outfits[k].col[it.look]) || stColor(it), base = it.color || IC[it.look];
    h += `<div class="wrdye"><span class="wrdl">Teinture</span><div class="wrsw">${ST_DYES.map(([c, n]) => `<button class="sw" data-wdye="${c}" style="--c:${c}" aria-pressed="${cur.toLowerCase() === c}" title="${n}" aria-label="Teindre en ${n}"></button>`).join('')}<button class="sw reset" data-wdye="" style="--c:${base}" title="Couleur d’origine" aria-label="Couleur d’origine" aria-pressed="${cur.toLowerCase() === String(base).toLowerCase()}"><svg viewBox="0 0 20 20"><path d="M6 7 a6 6 0 1 1 -1 6" fill="none" stroke="#5b4636" stroke-width="2" stroke-linecap="round"/><path d="M3 4 v4 h4" fill="none" stroke="#5b4636" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>`;
  }
  if (list.length) {
    h += `<div class="wrgrid">${list.map(x => {
      const on = !!(it && it.id === x.id), by = on ? k : x.orig ? null : styleWornBy(x.id);
      const prov = x.orig ? 'Tenue de départ' : (typeof rgPill === 'function' && rgPill(x, 'short')) || esc(x.from || '');
      return `<button class="wrv ${on ? 'on' : ''}" data-wput="${x.id}" style="--rc:${RARC[x.rarity]}" aria-pressed="${on}"><span class="wrvi">${stIcon(x)}</span><b>${esc(x.name)}</b><i style="color:${RARC[x.rarity]}">${RARITY[x.rarity]}${x.edition ? ' · ' + esc(x.edition) : ''}</i><span class="wrvp">${prov}</span>${on ? '<em class="wrtag">Porté</em>' : by && by !== k ? `<em class="wrtag lend">Porté par ${CHARS[by].name}</em>` : ''}</button>`;
    }).join('')}</div>`;
  } else h += `<p class="wrempty">Aucun vêtement « ${lab.toLowerCase()} » dans le sac pour l’instant.</p>`;
  if (!it) h += `<div class="wrshop"><svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.boutique}</svg><span>Trouve des vêtements en voyage ou au magasin.</span><button class="btn gold sm" data-wshop="1">Magasin</button></div>`;
  h += `</div>`;
  // tenues enregistrées
  const saved = styleState().saved[k];
  h += `<h3 id="wrSaved">Tenues enregistrées</h3><div class="wrsaved">${saved.map((sn, i) => sn ? `<div class="wrout"><div class="wroc">${drawChar(k, stOutfitOf(k, sn), 'content', `so${k}${i}`)}</div><b>Tenue ${i + 1}</b><div class="wrob"><button class="btn green sm" data-wload="${i}">Mettre</button><button class="btn cream sm" data-wsave="${i}" title="Remplacer par la tenue actuelle">Enregistrer</button></div></div>` : `<div class="wrout vide"><div class="wroc"><span>+</span></div><b>Tenue ${i + 1}</b><div class="wrob"><button class="btn cream sm" data-wsave="${i}">Enregistrer</button></div></div>`).join('')}</div>`;
  // petit rappel du concours
  const th = styleTheme(), left = stTriesLeft();
  h += `<button class="wrcontest" data-stgo="concours"><svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.concours}</svg><span><i>Concours de la semaine</i><b>${esc(th.name)}</b></span><em>${left ? `${left} essai${left > 1 ? 's' : ''}` : 'Terminé'}</em></button>`;
  return h + `</div>`;
}
function renderTalents(k) {
  const ch = CHARS[k], p = S.prog[k], need = needXP(p.lvl), f = Math.min(1, p.xp / need);
  let h = `<div class="tlhead" style="--tint:${ST_TINT[k]}"><div class="tlch">${drawChar(k, S.outfits[k], 'fier', 'tl' + k)}</div><div class="tlx"><span class="kick">${esc(ch.species)} · ${esc(ch.perso)}</span><b>${ch.name}</b><span class="tllv">Niveau ${p.lvl}</span><div class="tlbar"><i style="width:${(f * 100).toFixed(1)}%"></i></div><span class="small">${p.xp} / ${need} exp. · encore ${need - p.xp} pour le niveau ${p.lvl + 1}</span></div></div>`;
  h += `<h3>Talents</h3><ol class="tlist">${TALENTS[k].map(([l, n, d]) => {
    const on = p.lvl >= l, next = !on && TALENTS[k].find(x => p.lvl < x[0]) && TALENTS[k].find(x => p.lvl < x[0])[0] === l;
    return `<li class="tl ${on ? 'on' : next ? 'next' : ''}"><span class="tlb">${on ? '<svg viewBox="0 0 20 20"><path d="M5 10.5 l3.5 3.5 L15 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : l}</span><div><b>${esc(n)}</b><span>${esc(d)}</span><i>${on ? 'Débloqué' : `Niveau ${l}${next ? ` · encore ${l - p.lvl} niveau${l - p.lvl > 1 ? 'x' : ''}` : ''}`}</i></div></li>`;
  }).join('')}<li class="tl ${p.lvl >= 7 ? 'on' : ''}"><span class="tlb">+</span><div><b>Chance grandissante</b><span>Chaque niveau rend les trouvailles rares un peu plus fréquentes (actuellement +${Math.round(lvlLuck(k) * 100)} %).</span></div></li></ol>`;
  h += `<h3>Gagner de l’expérience</h3><ul class="tlhow"><li><b>Voyages et récoltes</b><span>Chaque voyage rapporte de l’expérience.</span></li><li><b>Rêves réalisés</b><span>Un niveau entier d’un coup !</span></li><li><b>Plats adorés</b><span>${esc(ch.name)} adore ${esc(ch.love)}.</span></li><li><b>Atelier et quêtes</b><span>+25 par objet fabriqué, +40 par quête du jour.</span></li><li><b>Concours de style</b><span>+15 par étoile obtenue.</span></li></ul>`;
  h += `<p class="small">${esc(ch.bio)} N’aime pas : ${esc(ch.hate)}.</p>`;
  return h;
}
function renderContest(k) {
  const s = styleState(), th = styleTheme(), J = styleJudge(k, th), left = stTriesLeft(), best = stBest(), w = stWeek(), dl = stDaysLeft();
  let h = `<div class="cthero"><span class="ctrib">Concours de style · semaine ${w.w}</span><h2>${esc(th.name)}</h2><p>${esc(th.desc)}</p><div class="ctmeta"><span>${dl > 1 ? `Encore ${dl} jours` : 'Dernier jour !'}</span><span class="cttry" aria-label="${left} essais restants">${[0, 1, 2].map(i => `<i class="${i < left ? 'on' : ''}"></i>`).join('')} ${left} essai${left > 1 ? 's' : ''}</span></div></div>`;
  h += `<div class="ctjury">${ST_JURY.map((j, i) => `<div class="ctj"><span class="ctjf">${stJuryFace(i)}</span><b>${j.name}</b><i>${j.role}</i></div>`).join('')}</div>`;
  h += `<h3>Ce que le jury regarde</h3><ul class="ctcrit">${J.res.map(r => `<li class="${r.v >= 0.99 ? 'ok' : r.v > 0 ? 'mid' : ''}"><span class="ctck">${r.v >= 0.99 ? '✓' : r.v > 0 ? '½' : ''}</span><span>${esc(r.cr.txt)}</span></li>`).join('')}</ul>`;
  h += `<div class="ctstage" style="--tint:${ST_TINT[k]}"><div class="ctch">${drawChar(k, S.outfits[k], 'fier', 'ct' + k)}</div><div class="ctgo"><b>${CHARS[k].name} est prêt${k === 'mochi' ? '' : 'e'} ?</b><span class="small">Les cases cochées ci-dessus plaisent au jury. Ajustez la tenue à la garde-robe, puis inscrivez-vous.</span><button class="btn green big" data-ctenter="${k}" ${left ? '' : 'disabled'}>${left ? `Inscrire ${CHARS[k].name} !` : 'Plus d’essai'}</button><button class="btn cream sm" data-stgo="garde">Modifier la tenue</button></div></div>`;
  if (best) h += `<h3>Meilleur résultat de la semaine</h3><div class="ctbest"><div class="ctbc">${drawChar(best.who, best.look, 'amour', 'cb')}</div><div><b>${CHARS[best.who].name}</b>${stStars(best.stars)}<span class="ctavg">${String(best.avg).replace('.', ',')} / 5</span><span class="small">${s.contest.entries.length} essai${s.contest.entries.length > 1 ? 's' : ''} sur 3</span></div></div>`;
  h += `<h3>Récompenses</h3><ol class="ctlad">${[1, 2, 3, 4, 5].map(t => `<li class="${s.contest.paid >= t ? 'got' : ''}"><span class="ctls">${t}★</span><span>${coins(ST_PRIZE_COINS[t] - ST_PRIZE_COINS[t - 1])}${ST_MEDALS[t] ? ` + ${ST_MEDALS[t][2].toLowerCase()}` : ''}${t === 4 ? ` + « ${esc(th.prize[0])} »` : ''}</span>${s.contest.paid >= t ? '<i>✓</i>' : ''}</li>`).join('')}</ol>`;
  const tr = s.trophies.slice().reverse();
  h += `<h3>Vitrine des trophées</h3>`;
  h += tr.length ? `<div class="cttro">${tr.slice(0, 18).map(t => `<div class="ctt m-${t.medal}" title="${esc(t.name)}"><svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.concours}</svg><b>${esc(t.name)}</b><i>${t.medal === 'or' ? 'Or' : t.medal === 'argent' ? 'Argent' : 'Bronze'} · ${CHARS[t.who] ? CHARS[t.who].name : ''}</i></div>`).join('')}</div><p class="small">Chaque trophée arrive aussi dans le sac : posez-le dans la maison pour l’exposer.</p>` : `<p class="wrempty">Pas encore de trophée. Trois étoiles suffisent pour le bronze !</p>`;
  return h;
}
function renderCompagnons(box) {
  styleState(); styleSanitize();
  const k = S.sel;
  let h = stSelector();
  if (compView === 'reves') { box.innerHTML = h + `<div class="streves" id="stReves"></div>`; const d = box.querySelector('#stReves'); if (typeof renderReves === 'function') renderReves(d); else d.innerHTML = `<p class="empty">Les rêves arrivent bientôt.</p>`; return; }
  if (compView === 'talents') h += renderTalents(k);
  else if (compView === 'concours') h += renderContest(k);
  else h += renderWardrobe(k);
  box.innerHTML = h;
}
function openCompagnons(sub) {
  const m = { garde: 'garde', garderobe: 'garde', 'garde-robe': 'garde', tenues: 'garde', reves: 'reves', quetes: 'reves', succes: 'reves', talents: 'talents', concours: 'concours' };
  const was = tab === 'compagnons' && compView;
  if (sub && m[sub]) compView = m[sub];
  openSheet('compagnons', true);
  if (was !== compView) $('panelBody').scrollTop = 0;
}
function styleSubDot(k) { return k === 'concours' && styleState().contest.entries.length === 0; }
function stRefresh() { if (tab === 'compagnons') renderPanel(); }

// ---------- verdict du jury ----------
function stShowResult(r) {
  const { J, gains, rec, th, entry } = r, k = entry.who;
  showModal(`<div class="ctres"><span class="ctrib">${esc(th.name)}</span><div class="ctrc">${drawChar(k, S.outfits[k], J.stars >= 4 ? 'amour' : J.stars >= 3 ? 'rire' : 'triste', 'ctr')}</div><h2>${J.stars >= 4 ? 'Bravo !' : J.stars >= 3 ? 'Joli défilé !' : 'Le jury a parlé…'}</h2>
  <div class="ctvs">${J.jury.map((j, i) => `<div class="ctv" style="--d:${0.25 + i * 0.45}s"><span class="ctjf">${stJuryFace(i)}</span><div><b>${ST_JURY[i].name}</b>${stStars(j.s)}<p>${esc(j.txt)}</p></div></div>`).join('')}</div>
  <div class="ctfin" style="--d:1.7s"><span>Note finale</span>${stStars(J.stars)}<b>${String(J.avg).replace('.', ',')} / 5</b>${rec ? '<em>Meilleur score de la semaine !</em>' : ''}</div>
  ${gains.length ? `<div class="ctgain" style="--d:2s"><b>Gagné :</b> ${gains.join(' · ')}</div>` : `<p class="small">${J.stars < 5 ? `Un palier plus haut rapporte plus. Il reste ${stTriesLeft()} essai${stTriesLeft() > 1 ? 's' : ''}.` : ''}</p>`}
  <button class="btn green big wide" data-closemodal="1">${J.stars >= 3 ? 'Super !' : 'Je ferai mieux !'}</button></div>`);
  if (J.stars >= 4 && typeof confetti === 'function') setTimeout(() => { try { confetti(J.stars >= 5); } catch (e) {} }, 1800);
}

// ---------- bouton « Habiller » après un toucher sur un portrait du haut ----------
function stDressPill(k) {
  let p = document.getElementById('stDress');
  if (!p) { p = document.createElement('button'); p.id = 'stDress'; p.className = 'stdress'; (document.querySelector('.game') || document.body).appendChild(p); }
  p.dataset.stdress = k;
  p.innerHTML = `<svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS.garde}</svg><span>Habiller ${CHARS[k].name}</span>`;
  const btn = document.querySelector(`#hudComps .hc-btn[data-sel="${k}"]`), talk = document.getElementById('ccTalk');
  const r = btn ? btn.getBoundingClientRect() : { left: 16, bottom: 90, width: 60 };
  let top = r.bottom + 8;
  if (talk && talk.classList.contains('on') && talk.classList.contains('below')) { const tr = talk.getBoundingClientRect(); top = Math.max(top, parseFloat(talk.style.top) + tr.height + 8); }
  p.hidden = false; p.classList.remove('on');
  const pw = p.offsetWidth || 170;
  p.style.left = Math.max(10, Math.min(innerWidth - pw - 10, r.left + r.width / 2 - 30)) + 'px';
  p.style.top = top + 'px';
  requestAnimationFrame(() => p.classList.add('on'));
  clearTimeout(stDressPill.t); stDressPill.t = setTimeout(() => { p.classList.remove('on'); setTimeout(() => { if (!p.classList.contains('on')) p.hidden = true; }, 250); }, 4200);
}

// ---------- clics ----------
document.addEventListener('click', ev => {
  const el = ev.target.closest('button,[data-stc]');
  const pill = document.getElementById('stDress');
  if (pill && !pill.hidden && !(el && el.id === 'stDress')) { if (!(el && el.matches('.hc-btn'))) { pill.classList.remove('on'); pill.hidden = true; } }
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (el.matches('.hc-btn[data-sel]')) { if (tab !== 'compagnons') setTimeout(() => stDressPill(d.sel), 30); return; }
  if (d.stdress) { el.classList.remove('on'); el.hidden = true; S.sel = d.stdress; stSlot = null; openCompagnons('garde'); return; }
  if (d.stg) { $('modal').hidden = true; const go = styleGuard._go; styleGuard._go = null; if (d.stg === 'ok' && go) go(); return; }
  if (d.stc) { if (S.sel !== d.stc) { S.sel = d.stc; S.unseen[d.stc] = 0; stSlot = null; save(); renderAll(); } return; }
  if (d.stgo) { openCompagnons(d.stgo); return; }
  if (d.wslot) { stSlot = d.wslot; stRefresh(); return; }
  if (d.wjump) { const s = document.getElementById('wrSaved'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
  const k = S.sel;
  if (d.wput) {
    const it = stItem(d.wput, k); if (!it) return;
    const cur = stWorn(k, it.sub);
    if (cur && cur.id === it.id) { styleUnequip(k, it.sub); stJoy = 0; renderAll(); return; }
    const lent = styleEquip(k, it);
    stJoy = Date.now(); stJoyLine = lent ? `Merci ${CHARS[lent].name} de me le prêter !` : pick(ST_JOY[k]);
    renderAll(); stJoyBack(); return;
  }
  if (d.wunwear) { styleUnequip(k, d.wunwear); stJoy = 0; renderAll(); return; }
  if (d.wdye !== undefined && el.closest('.wrdye')) { styleDye(k, stSlot, d.wdye || null); stJoy = Date.now(); stJoyLine = ST_DYE_LINE[k]; renderAll(); stJoyBack(); return; }
  if (d.wsave) { styleSaveOutfit(k, +d.wsave); stRefresh(); toast(`Tenue ${+d.wsave + 1} de ${CHARS[k].name} enregistrée.`); return; }
  if (d.wload) { const miss = styleLoadOutfit(k, +d.wload); stJoy = Date.now(); stJoyLine = pick(ST_JOY[k]); renderAll(); stJoyBack(); const sc = $('panelBody'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); toast(miss ? `Tenue ${+d.wload + 1} chargée, mais ${miss} vêtement${miss > 1 ? 's ont' : ' a'} quitté le sac.` : `Tenue ${+d.wload + 1} : c’est parti !`); return; }
  if (d.wshop) { if (typeof openBoutique === 'function') openBoutique('magasin'); else openSheet('boutique'); return; }
  if (d.ctenter) { const r = styleEnter(d.ctenter); if (!r) return; renderAll(); stShowResult(r); return; }
});
// la joie retombe doucement : le compagnon revient à son air content
function stJoyBack() {
  clearTimeout(stJoyBack.t);
  stJoyBack.t = setTimeout(() => {
    const c = document.querySelector('[data-wrchar]'); if (!c || tab !== 'compagnons' || compView !== 'garde') return;
    const k = c.dataset.wrchar; c.classList.remove('joy'); c.innerHTML = stCharSVG(k, 'content', 'wr' + k + 'b');
    const say = document.querySelector('.wrsay'); if (say) say.remove();
  }, 1700);
}

// ---------- styles ----------
(function stCSS() {
  const css = `
#sheet[data-kind="compagnons"] .phead{display:none}
@media (min-width:901px){#sheet[data-kind="compagnons"]{width:min(500px,calc(100% - 32px))}}
.stsel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.stc{display:flex;align-items:center;gap:6px;min-width:0;background:#fff;border:2.5px solid var(--line);border-radius:16px;padding:4px 6px 4px 4px;cursor:pointer;color:var(--ink);text-align:left;transition:transform .15s}
.stc img,.stc .livep{width:38px!important;height:42px!important;flex:none;background:var(--tint);border-radius:11px;border:2px solid var(--ink)!important;overflow:hidden;box-sizing:border-box}
.stc span{display:flex;flex-direction:column;min-width:0}
.stc b{font:800 14px/1.1 var(--display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stc i{font:600 11px/1.2 var(--body);font-style:normal;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stc[aria-selected="true"]{background:var(--tint);border-color:var(--ink);box-shadow:0 3px 0 var(--ink);transform:translateY(-1px)}
.stc[aria-selected="true"] i{color:var(--ink2)}
.wr{display:flex;flex-direction:column;gap:10px}
.wrstage{position:relative;display:grid;grid-template-columns:62px minmax(0,1fr) 62px;gap:4px;align-items:center;padding:20px 6px 10px;border:3px solid var(--ink);border-radius:24px;box-shadow:0 4px 0 rgba(74,53,40,.35);overflow:hidden;
  background:radial-gradient(ellipse 46% 12% at 50% 86%,rgba(255,255,255,.55) 0 98%,transparent 100%),linear-gradient(transparent 78%,#e7c89c 78%,#d9b48a 100%),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 14px,transparent 14px 28px),linear-gradient(180deg,#fffaf0,var(--tint) 70%)}
.wrgar{position:absolute;left:0;right:0;top:0;width:100%;height:24px;pointer-events:none}
.wrcol{display:flex;flex-direction:column;gap:8px;align-items:center;z-index:1}
.wrs{position:relative;width:60px;display:flex;flex-direction:column;align-items:center;gap:1px;background:none;border:0;padding:0;cursor:pointer;color:var(--ink);-webkit-tap-highlight-color:transparent}
.wri{position:relative;width:52px;height:52px;border-radius:50%;background:#fff;border:2.5px solid var(--ink);box-shadow:0 3px 0 var(--ink);display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box;transition:transform .18s cubic-bezier(.3,1.6,.5,1)}
.wrs.full .wri{border-color:var(--rc);box-shadow:0 3px 0 var(--ink),inset 0 0 0 2px #fff}
.wri svg{width:100%;height:100%}
.wrs.vide .wri{border-style:dashed;background:rgba(255,255,255,.65);box-shadow:none}
.wrs.vide .wri svg{opacity:.45}
.wri em{position:absolute;right:-3px;bottom:-3px;width:19px;height:19px;border-radius:50%;background:var(--green);color:#fff;border:2px solid var(--ink);font:800 15px/14px var(--display);font-style:normal;text-align:center}
.wrs b{font:700 12px/1.2 var(--display);background:rgba(255,250,240,.9);border-radius:6px;padding:0 4px}
.wrs.on .wri{background:#ffe9a8;transform:scale(1.1) rotate(-4deg);outline:3px solid #fff;outline-offset:1px}
.wrs.on b{background:var(--ink);color:#fff}
.wrs:active .wri{transform:scale(.94)}
.wrn{position:absolute;top:-4px;left:2px;min-width:18px;height:18px;border-radius:999px;background:var(--teal);color:#fff;border:2px solid #fff;font:800 11px/14px var(--display);font-style:normal;text-align:center;padding:0 3px;box-sizing:border-box}
.wrsave .wri{background:#fff3f6}
.wrmid{position:relative;display:flex;flex-direction:column;align-items:center;min-width:0}
.wrchar{position:relative;width:100%;max-width:240px}
.wrchar svg.cc{display:block;width:100%;height:auto}
.wrchar.joy svg.cc .root{transform-box:view-box;transform-origin:160px 334px;animation:ccHop .62s cubic-bezier(.3,1.3,.5,1) 2}
.wrspark{position:absolute;inset:0;pointer-events:none}
.wrspark i{position:absolute;left:50%;top:45%;font:800 20px/1 var(--display);font-style:normal;color:#f6c445;-webkit-text-stroke:1.5px #7a5f50;animation:wrSpark 1.1s ease-out forwards;opacity:0}
.wrspark i:nth-child(1){--x:-90px;--y:-80px}.wrspark i:nth-child(2){--x:90px;--y:-70px;animation-delay:.08s;color:#f4b7c4}.wrspark i:nth-child(3){--x:-100px;--y:10px;animation-delay:.16s;color:#a9dcc8}.wrspark i:nth-child(4){--x:96px;--y:20px;animation-delay:.1s}.wrspark i:nth-child(5){--x:-30px;--y:-120px;animation-delay:.2s;color:#c9b8ea}.wrspark i:nth-child(6){--x:40px;--y:-115px;animation-delay:.05s;color:#f4b7c4}
@keyframes wrSpark{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.2) rotate(40deg)}}
.wrsay{position:absolute;top:-6px;left:50%;transform:translateX(-50%);margin:0;background:#fffaf0;border:2.5px solid var(--ink);border-radius:14px;padding:4px 10px;font:700 13px/1.2 var(--display);text-align:center;width:max-content;max-width:100%;box-shadow:0 3px 0 rgba(74,53,40,.3);animation:wrSay .3s cubic-bezier(.3,1.6,.5,1);z-index:2}
@keyframes wrSay{from{opacity:0;transform:translate(-50%,8px) scale(.8)}}
.wrplate{margin-top:-6px;background:#a87a50;color:#fff8ea;border:2.5px solid var(--ink);border-radius:10px;padding:1px 12px 0;font:800 16px/1.3 var(--display);box-shadow:0 3px 0 var(--ink);text-align:center;z-index:1}
.wrplate small{display:block;font:600 11px/1.2 var(--body);opacity:.9;padding-bottom:2px}
.wrpanel{display:flex;flex-direction:column;gap:9px;background:#fff;border:2.5px solid var(--ink);border-radius:18px;padding:10px;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.wrph{display:flex;align-items:center;gap:8px;min-width:0}
.wrpk{flex:none;background:var(--ink);color:#fff;border-radius:8px;padding:1px 8px;font:700 13px/1.4 var(--display)}
.wrph b{flex:1;min-width:0;font:800 16px/1.15 var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.btn.sm{font-size:14px;padding:7px 11px 5px;border-radius:12px;box-shadow:0 3px 0 var(--ink)}
.wrdye{display:flex;flex-direction:column;gap:5px}
.wrdl{font:700 12px var(--display);color:var(--ink2);letter-spacing:.04em;text-transform:uppercase}
.wrsw{display:flex;flex-wrap:wrap;gap:7px}
.sw{width:30px;height:30px;border-radius:50%;background:var(--c);border:2.5px solid var(--ink);cursor:pointer;padding:0;box-shadow:0 2px 0 var(--ink);transition:transform .15s}
.sw:hover{transform:translateY(-2px)}
.sw[aria-pressed="true"]{outline:3px solid var(--teal);outline-offset:2px;transform:scale(1.08)}
.sw.reset{display:flex;align-items:center;justify-content:center}.sw.reset svg{width:17px;height:17px;background:rgba(255,255,255,.8);border-radius:50%;padding:1px}
.wrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px}
.wrv{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;background:#fffaf0;border:2.5px solid var(--line);border-radius:14px;padding:6px 4px 6px;cursor:pointer;color:var(--ink);text-align:center;min-width:0;transition:transform .15s}
.wrv:hover{transform:translateY(-2px);border-color:var(--rc)}
.wrv:active{transform:scale(.96)}
.wrv.on{background:#e6f6e9;border-color:var(--greenD);box-shadow:0 3px 0 var(--greenD)}
.wrvi{width:46px;height:46px;border-radius:12px;background:#fff;border:2px solid var(--rc);display:flex;padding:5px;box-sizing:border-box}
.wrvi svg{width:100%;height:100%}
.wrv b{font:700 12.5px/1.15 var(--display);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px}
.wrv>i{font:700 11px/1.2 var(--body);font-style:normal}
.wrvp{font-size:10.5px;color:var(--muted);max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.wrvp .rgp{font-size:10.5px;max-width:100%}
.wrtag{position:absolute;top:-8px;right:-4px;background:var(--green);color:#fff;border:2px solid #fff;border-radius:999px;padding:0 7px;font:800 11px/16px var(--display);font-style:normal;box-shadow:0 1px 0 rgba(0,0,0,.2)}
.wrtag.lend{background:#b9a6d9;max-width:92%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wrempty{margin:0;color:var(--muted);font-size:13.5px;text-align:center;padding:4px}
.wrshop{display:flex;align-items:center;gap:8px;background:#fff3c4;border:2px dashed var(--goldD);border-radius:14px;padding:7px 9px}
.wrshop svg{width:30px;height:30px;flex:none;color:var(--ink)}
.wrshop span{flex:1;font:700 13.5px/1.25 var(--display)}
.wrsaved{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.wrout{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:6px 5px 7px;box-shadow:0 3px 0 rgba(74,53,40,.3);min-width:0}
.wrout.vide{border-style:dashed;background:#fffaf0;box-shadow:none}
.wroc{width:100%;aspect-ratio:1/1;background:linear-gradient(180deg,#fff8ea,var(--tint));border-radius:11px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.wroc svg{width:94%;height:auto}
.wroc span{font:800 30px var(--display);color:var(--line)}
.wrout>b{font:800 13px var(--display)}
.wrob{display:flex;flex-direction:column;gap:5px;width:100%}
.wrob .btn{width:100%;padding:6px 2px 4px;font-size:12.5px;min-width:0;overflow:hidden;text-overflow:ellipsis}
.wrcontest{display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#fff3c4,#ffe1ec);border:2.5px solid var(--ink);border-radius:16px;padding:8px 12px;box-shadow:0 3px 0 var(--ink);cursor:pointer;color:var(--ink);text-align:left}
.wrcontest svg{width:36px;height:36px;flex:none}
.wrcontest span{flex:1;display:flex;flex-direction:column;min-width:0}
.wrcontest i{font:700 11.5px var(--display);font-style:normal;color:var(--rust);text-transform:uppercase;letter-spacing:.05em}
.wrcontest b{font:800 16px/1.15 var(--display)}
.wrcontest em{font:800 12.5px var(--display);font-style:normal;background:#fff;border:2px solid var(--ink);border-radius:999px;padding:1px 8px;white-space:nowrap}
.streves{display:flex;flex-direction:column;gap:12px}.streves>*{flex-shrink:0}
.stgm{width:120px}.stgm svg{width:100%;height:auto}
.stgb{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
/* talents */
.tlhead{display:flex;gap:12px;align-items:center;background:linear-gradient(180deg,#fffaf0,var(--tint));border:2.5px solid var(--ink);border-radius:20px;padding:8px 12px 8px 6px;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.tlch{width:104px;flex:none}.tlch svg{width:100%;height:auto;display:block}
.tlx{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}
.tlx>b{font:800 24px/1 var(--display)}
.tllv{align-self:flex-start;background:var(--gold);border:2px solid var(--ink);border-radius:999px;padding:0 10px;font:800 14px/1.5 var(--display)}
.tlbar{height:12px;border:2px solid var(--ink);border-radius:999px;background:#fff;overflow:hidden}.tlbar i{display:block;height:100%;background:linear-gradient(90deg,#f6c445,#f2a93b)}
.tlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.tl{display:flex;gap:10px;align-items:flex-start;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 10px;opacity:.75}
.tl.on{opacity:1;border-color:var(--greenD);background:#f1faf3}.tl.next{opacity:1;border-color:var(--goldD);border-style:dashed;background:#fffbea}
.tlb{flex:none;width:30px;height:30px;border-radius:50%;background:#efe4d0;border:2px solid var(--ink);font:800 14px/26px var(--display);text-align:center}
.tl.on .tlb{background:var(--green)}.tlb svg{width:20px;height:20px;margin-top:3px}
.tl div{display:flex;flex-direction:column;gap:1px}.tl b{font:800 15px var(--display)}.tl span{font-size:13.5px;color:var(--ink2)}.tl i{font:700 12px var(--display);font-style:normal;color:var(--teal)}
.tlhow{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.tlhow li{background:#fffaf0;border:2px solid var(--line);border-radius:12px;padding:6px 9px;display:flex;flex-direction:column}.tlhow b{font:700 13.5px var(--display)}.tlhow span{font-size:12.5px;color:var(--ink2)}
/* concours */
.cthero{position:relative;background:linear-gradient(135deg,#ffe1ec,#fff3c4 60%,#e1f0e9);border:3px solid var(--ink);border-radius:22px;padding:12px 14px 10px;box-shadow:0 4px 0 rgba(74,53,40,.35);text-align:center}
.ctrib{display:inline-block;background:var(--rust);color:#fff;border:2px solid var(--ink);border-radius:999px;padding:1px 12px;font:800 12px/1.5 var(--display);letter-spacing:.04em;text-transform:uppercase}
.cthero h2{margin:6px 0 2px;font:800 26px/1.05 var(--display);text-wrap:balance}
.cthero p{margin:0;color:var(--ink2);font-size:14px;line-height:1.35}
.ctmeta{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:7px;font:700 13px var(--display)}
.cttry{display:inline-flex;align-items:center;gap:3px}.cttry i{width:11px;height:11px;border-radius:50%;border:2px solid var(--ink);background:#fff}.cttry i.on{background:var(--pink)}
.ctjury{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.ctj{display:flex;flex-direction:column;align-items:center;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 4px;text-align:center;min-width:0}
.ctjf{width:46px;height:46px;flex:none;display:block}.ctjf svg{width:100%;height:100%}
.ctj b{font:800 12.5px/1.15 var(--display)}.ctj i{font-size:11px;font-style:normal;color:var(--muted)}
.ctcrit{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.ctcrit li{display:flex;gap:8px;align-items:center;background:#fff;border:2px solid var(--line);border-radius:12px;padding:5px 9px;font-size:14px}
.ctck{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid var(--line);font:800 13px/18px var(--display);text-align:center;color:#fff}
.ctcrit li.ok{border-color:#9fd3ae;background:#f1faf3}.ctcrit li.ok .ctck{background:var(--green);border-color:var(--greenD)}
.ctcrit li.mid .ctck{background:var(--gold);border-color:var(--goldD);color:var(--ink)}
.ctstage{display:flex;gap:10px;align-items:center;background:linear-gradient(180deg,#fffaf0,var(--tint));border:2.5px solid var(--ink);border-radius:20px;padding:8px 12px 10px 6px}
.ctch{width:120px;flex:none}.ctch svg{width:100%;height:auto;display:block}
.ctgo{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}.ctgo>b{font:800 17px var(--display)}
.ctgo .btn.big{white-space:normal;text-align:center}
.ctbest{display:flex;gap:10px;align-items:center;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:6px 10px 6px 4px}
.ctbc{width:76px;flex:none}.ctbc svg{width:100%;height:auto;display:block}
.ctbest>div:last-child{display:flex;flex-direction:column;gap:2px}.ctbest b{font:800 16px var(--display)}
.ctavg{font:800 15px var(--display);color:var(--ink2)}
.stst{display:inline-flex;gap:1px}
.sts{font:800 20px/1 var(--display);font-style:normal;color:#e7dcc4;-webkit-text-stroke:1.2px #a89880}
.sts.on{color:#f6c445;-webkit-text-stroke:1.2px #a87a1e}
.ctlad{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.ctlad li{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:4px 9px;font-size:13.5px}
.ctlad li.got{background:#f1faf3;border-color:#9fd3ae}
.ctls{flex:none;width:34px;font:800 15px var(--display);color:var(--goldD)}
.ctlad li span:nth-child(2){flex:1}.ctlad li i{font-style:normal;font-weight:800;color:var(--greenD)}
.cttro{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:7px}
.ctt{display:flex;flex-direction:column;align-items:center;text-align:center;background:linear-gradient(180deg,#fffaf0,#f6ead2);border:2px solid var(--ink);border-radius:14px;padding:6px 4px}
.ctt svg{width:36px;height:36px}.ctt.m-argent svg{filter:grayscale(1) brightness(1.15)}.ctt.m-bronze svg{filter:sepia(.6) hue-rotate(-20deg) saturate(1.3) brightness(.9)}
.ctt b{font:700 11.5px/1.15 var(--display)}.ctt i{font-size:10.5px;font-style:normal;color:var(--muted)}
.ctres{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.ctrc{width:110px}.ctrc svg{width:100%;height:auto}
.ctvs{display:flex;flex-direction:column;gap:6px;width:100%}
.ctv{display:flex;gap:8px;align-items:flex-start;text-align:left;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 8px;animation:ctIn .45s cubic-bezier(.3,1.5,.5,1) both;animation-delay:var(--d)}
.ctv b{font:800 14px var(--display);margin-right:6px}.ctv p{margin:2px 0 0;font-size:13.5px;line-height:1.3;color:var(--ink2)}
.ctv .sts{font-size:16px}
.ctfin,.ctgain{animation:ctIn .5s cubic-bezier(.3,1.5,.5,1) both;animation-delay:var(--d)}
.ctfin{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;font:700 14px var(--display)}.ctfin b{font:800 20px var(--display)}.ctfin em{flex-basis:100%;font-style:normal;color:var(--rust);font-weight:800}
.ctfin .sts{font-size:26px}
.ctgain{background:#fff3c4;border:2px dashed var(--goldD);border-radius:12px;padding:6px 10px;font-size:13.5px}
@keyframes ctIn{from{opacity:0;transform:translateY(10px) scale(.95)}}
/* bouton « Habiller » sous un portrait */
.stdress{position:fixed;z-index:31;display:flex;align-items:center;gap:5px;background:var(--gold);border:2.5px solid var(--ink);border-radius:999px;padding:4px 12px 3px 6px;font:800 14px var(--display);color:var(--ink);box-shadow:0 3px 0 var(--ink);cursor:pointer;opacity:0;transform:translateY(-6px) scale(.9);transition:opacity .18s,transform .28s cubic-bezier(.3,1.6,.5,1)}
.stdress.on{opacity:1;transform:none}
.stdress svg{width:24px;height:24px;background:#fff;border-radius:50%;border:1.5px solid var(--ink)}
@media (max-width:420px){.wrstage{grid-template-columns:58px minmax(0,1fr) 58px;padding:20px 3px 10px}.wrs{width:56px}.wri{width:48px;height:48px;padding:7px}.wrgrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.wrv b{font-size:12px}.sw{width:27px;height:27px}.wrsw{gap:6px}.stc{padding:3px 4px 3px 3px;gap:4px}.stc img,.stc .livep{width:32px!important;height:36px!important}.stc b{font-size:13px}.ctch{width:100px}.cthero h2{font-size:23px}}
@media (prefers-reduced-motion:reduce){.wrspark,.wrchar.joy svg.cc .root{display:none;animation:none!important}.ctv,.ctfin,.ctgain{animation:none}}
`;
  const st = document.createElement('style'); st.id = 'stCSS'; st.textContent = css; document.head.appendChild(st);
})();

window.__style = { api: () => ({ GAME, openSheet, closeSheet, selectComp, save, renderPanel, openAchievements: typeof openAchievements === 'function' ? openAchievements : null, setQuestView: v => { questView = v; }, tabDebug: window.__tabDebug }), renderCompagnons, styleGuard, styleState, styleEquip, styleUnequip, styleDye, styleSaveOutfit, styleLoadOutfit, styleJudge, styleEnter, styleTheme, styleSanitize, styleWornBy, ST_THEMES, openCompagnons, stWeek };

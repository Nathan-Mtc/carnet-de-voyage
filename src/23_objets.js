// ================= OBJETS : à quoi sert chaque objet récolté ou fabriqué =================
// Le joueur : « il faut que les items récoltés et créés soient mis en avant, qu'on comprenne à quoi ils servent ».
// Ce module n'écrit dans aucun autre fichier : il ENVELOPPE des fonctions existantes.
//  - renderBag   : sac organisé par usage (filtres en pastilles, cartes groupées ×N, une ligne d'usage, tri « utile maintenant »)
//  - openFiche   : fiche d'objet claire (« À quoi ça sert » avec un bouton d'action par usage, valeur, rareté expliquée)
//  - haulCard    : chaque objet rapporté de voyage montre son usage principal
//  - showHaul    : résumé en bas du butin (« 2 objets pour une commande · 1 vêtement ») et boutons d'action directs
//  - GAME.on('craft') : petite carte non bloquante après une fabrication
// Les usages viennent de GAME.usesOf(objet) (clés : eclore, attirer, habiller, client, vendre, recette, reve, batiment) ;
// tout usage inconnu est affiché tel quel. Un module peut fournir { txt, kind, go: () => … } : le bouton appelle go().

// ---------- petites icônes (24×24, traits en currentColor) ----------
const OB_IC = {
  client: '<path d="M4 10 V20 H20 V10" fill="#fff3e2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 10 L5 4 H19 L21 10Z" fill="#f3aec1" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><rect x="7" y="13" width="4.5" height="7" rx="1" fill="#c98a5a" stroke="currentColor" stroke-width="1.3"/><circle cx="16" cy="15.5" r="2.4" fill="#f6c445" stroke="currentColor" stroke-width="1.3"/>',
  reve: '<path d="M6.5 19 H17.5 a3.8 3.8 0 0 0 .7-7.5 a5.4 5.4 0 0 0-10.3-1.8 A4.6 4.6 0 0 0 6.5 19Z" fill="#d9ccf5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12.5 10.2 l1.1 2.3 2.5.3-1.8 1.8.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.8 2.5-.3Z" fill="#f6c445" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>',
  habiller: '<path d="M8 4 L3 8 L6 12 L8 10.5 V20 H16 V10.5 L18 12 L21 8 L16 4 Q12 7 8 4Z" fill="#bfe3d6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 16.5 l-1.7-1.6 a1 1 0 0 1 1.7-1.1 a1 1 0 0 1 1.7 1.1Z" fill="#f08aa6"/>',
  attirer: '<ellipse cx="12" cy="15.5" rx="4.6" ry="3.8" fill="#f6c9a0" stroke="currentColor" stroke-width="1.7"/><circle cx="6.3" cy="10" r="2" fill="#f6c9a0" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="6.5" r="2" fill="#f6c9a0" stroke="currentColor" stroke-width="1.5"/><circle cx="14.6" cy="6.5" r="2" fill="#f6c9a0" stroke="currentColor" stroke-width="1.5"/><circle cx="18.2" cy="10" r="2" fill="#f6c9a0" stroke="currentColor" stroke-width="1.5"/>',
  eclore: '<path d="M12 3 C7.5 3 5 10 5 14 a7 7 0 0 0 14 0 C19 10 16.5 3 12 3Z" fill="#fff3d0" stroke="currentColor" stroke-width="1.8"/><circle cx="9.5" cy="12" r="1.6" fill="#f3aec1"/><circle cx="14.5" cy="15.5" r="2" fill="#a9dcc8"/><circle cx="12.5" cy="8" r="1.2" fill="#c9b8ea"/>',
  nourrir: '<path d="M3.5 12 H20.5 C20.5 17 17 20 12 20 C7 20 3.5 17 3.5 12Z" fill="#fff8ea" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 12 C6 8 9 7 10 9 C11 6 15 6 15.5 9 C17 8 19 9.5 18 12" fill="#e9a35f" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  recette: '<path d="M5 20 L14 11" stroke="#a87a50" stroke-width="3.4" stroke-linecap="round"/><path d="M11.5 5 L18 3 L21 6 L19 12.5 L15.5 9 L13.5 9.5Z" fill="#b9c4cc" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  batiment: '<path d="M4 20 V11 L12 4.5 L20 11 V20Z" fill="#fff3e2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M2.5 11.5 L12 3.5 L21.5 11.5" fill="none" stroke="#d9604f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="10" y="14" width="4" height="6" fill="#c98a5a" stroke="currentColor" stroke-width="1.3"/>',
  maison: '<path d="M8 20 H16 M12 20 V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6 12 L9 4 H15 L18 12Z" fill="#f6e08a" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  tresor: '<path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20Z" fill="#efe2c4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M6 15 q4 -6 8 -2 q2 2 4 -3" fill="none" stroke="#c9604f" stroke-width="1.5" stroke-dasharray="2 1.6"/>',
  vendre: '<circle cx="12" cy="12" r="8.4" fill="#f2c14e" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="#a87a1e" stroke-width="1.4"/>',
  collection: '<path d="M12 3 L14.6 8.6 L20.7 9.2 L16.1 13.3 L17.4 19.3 L12 16.2 L6.6 19.3 L7.9 13.3 L3.3 9.2 L9.4 8.6Z" fill="#f6c445" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  autre: '<circle cx="12" cy="12" r="8" fill="#fff" stroke="currentColor" stroke-width="1.8"/><path d="M12 8 v5 M12 16 v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  tout: '<path d="M6 9 H18 L19.5 20 H4.5Z" fill="#e9b07a" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 9 C8.5 3.5 15.5 3.5 15.5 9" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="12.5" width="6" height="3.6" rx="1" fill="#f2c14e" stroke="currentColor" stroke-width="1.3"/>',
};
const obIco = (k, cls = '') => `<svg class="obic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${OB_IC[k] || OB_IC.autre}</svg>`;

// ---------- les usages : couleur, filtre (groupe), bouton d'action ----------
// grp : comp (pour mes compagnons) · client · fab (pour fabriquer) · vendre · col
const OB_K = {
  client: { grp: 'client', c: '#b8456a', b: '#ffe4ec', ic: 'client' },
  reve: { grp: 'comp', c: '#6d4fc0', b: '#efe8fd', ic: 'reve' },
  habiller: { grp: 'comp', c: '#23715f', b: '#dff2ea', ic: 'habiller' },
  attirer: { grp: 'comp', c: '#a85a1e', b: '#ffeedd', ic: 'attirer' },
  eclore: { grp: 'comp', c: '#2f6ea3', b: '#e1eefa', ic: 'eclore' },
  nourrir: { grp: 'comp', c: '#9a5a1a', b: '#fdf0dc', ic: 'nourrir' },
  recette: { grp: 'fab', c: '#2f7360', b: '#e3f3ea', ic: 'recette' },
  batiment: { grp: 'fab', c: '#a8561e', b: '#ffe8d4', ic: 'batiment' },
  maison: { grp: '', c: '#8a6a10', b: '#fff4cc', ic: 'maison' },
  tresor: { grp: '', c: '#a8402f', b: '#fde6df', ic: 'tresor' },
  collection: { grp: 'col', c: '#3d6fa0', b: '#e2eefa', ic: 'collection' },
  vendre: { grp: 'vendre', c: '#7a5f50', b: '#f4ede2', ic: 'vendre' },
  autre: { grp: '', c: '#7a5f50', b: '#f4ede2', ic: 'autre' },
};
const OB_ALIAS = { commande: 'client', clients: 'client', boutique: 'client', appat: 'attirer', oeuf: 'eclore', couveuse: 'eclore', vente: 'vendre', marche: 'vendre', atelier: 'recette', village: 'batiment', usage: 'autre', codex: 'collection' };
const OB_GROUPS = [
  ['tout', 'Tout', 'tout'],
  ['comp', 'Pour mes compagnons', 'habiller'],
  ['client', 'Pour mes clients', 'client'],
  ['fab', 'Pour fabriquer', 'recette'],
  ['vendre', 'À vendre', 'vendre'],
  ['col', 'Collection', 'collection'],
];
// part approximative des trouvailles de chaque rareté (voyage moyen, sans chance particulière)
const OB_PCT = [70, 22, 6, 1.5, 0.3];
const OB_RNOTE = ['Le quotidien du voyageur.', 'Un peu plus rare : se garde bien.', 'Une belle trouvaille.', 'Très rare : fait sensation.', 'Exceptionnel : presque introuvable.'];

const obName = k => (k && typeof CHARS !== 'undefined' && CHARS[k] && CHARS[k].name) || 'votre compagnon';
const obSel = () => (typeof S !== 'undefined' && S.sel && CHARS[S.sel] ? S.sel : (typeof teamIds === 'function' ? teamIds()[0] : null));
const obLc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const obPl = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const obFmtPct = p => p >= 9.5 ? Math.round(p) + ' %' : p >= 1 ? (Math.round(p * 10) / 10).toLocaleString('fr-FR') + ' %' : p >= 0.1 ? (Math.round(p * 10) / 10).toLocaleString('fr-FR') + ' %' : 'moins de 0,1 %';
const obSafe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };

// fonctions fournies par d'autres modules dans un usage ({ go }) : retrouvées par leur numéro
let OB_FNS = [];
const obFn = f => { OB_FNS.push(f); return OB_FNS.length - 1; };

// ---------- commandes de la boutique qui demandent cet objet ----------
function obOrders(it) {
  const out = [];
  try {
    if (typeof bqState !== 'function' || typeof bqMatch !== 'function' || typeof BQC !== 'function') return out;
    const ingOf = (rc) => rc && rc.ing.some(([key]) => (typeof key === 'string' && key.startsWith('r:')) ? it.rid === key.slice(2) : ING[key] && ING[key][0].includes(it.sub) && (it.cat === 'm' || it.cat === 'n'));
    for (const o of bqState().orders) {
      const c = BQC(o.client); if (!c || !Array.isArray(o.req)) continue;
      let direct = false, ing = null;
      for (const r of o.req) {
        if (bqMatch(r, it)) direct = true;
        else if (r.k === 'craft') { const rc = RECIPES.find(x => x.id === r.id); if (ingOf(rc)) ing = rc; }
      }
      if (direct || ing) out.push({ o, c, direct, ing, ready: typeof bqReady === 'function' ? bqReady(o) : false });
    }
  } catch (e) {}
  return out;
}

// ---------- tous les usages d'un objet, du plus utile au moins utile ----------
// chaque usage : { k, txt (phrase complète), line (ligne courte), sub (précision), act (bouton), go, arg, prio, now }
function obInfo(it) {
  const uses = [], seen = new Set(), who = obSel(), wn = obName(who);
  const add = u => { const key = u.k + '|' + u.line; if (seen.has(key)) return; seen.add(key); uses.push(u); };
  // 1. commandes des clients (détaillées : on sait quelle commande ouvrir)
  const ords = obOrders(it);
  ords.forEach(x => add({ k: 'client', txt: x.direct ? `Commande de ${typeof bqWho === 'function' ? bqWho(x.c) : x.c.name}` : `Ingrédient de « ${x.ing.out[0]} », commandé par ${x.c.name}`, line: x.direct ? `Commande de ${x.c.name}` : `Pour la commande de ${x.c.name}`, sub: x.ready ? 'Commande prête : livrez-la !' : 'Il manque encore quelque chose à la commande', act: x.ready ? 'Livrer' : 'Voir', go: 'order', arg: x.o.id, prio: x.ready ? 100 : 90, now: true, ready: x.ready }));
  // 2. usages déclarés par les autres modules (GAME.usesOf)
  let raw = [];
  try { raw = (typeof GAME !== 'undefined' && GAME.usesOf) ? (GAME.usesOf(it) || []) : []; } catch (e) {}
  for (const u of raw) {
    if (!u || !u.txt) continue;
    const k = OB_ALIAS[u.kind] || (OB_K[u.kind] ? u.kind : 'autre'), txt = String(u.txt);
    const ext = typeof u.go === 'function' ? { go: 'fn', arg: obFn(u.go) } : null;
    if (k === 'client') { if (ords.length) continue; add({ k, txt, line: txt, act: 'Voir', go: 'order', prio: 85, now: true, ...ext }); continue; }
    if (k === 'reve') {
      const later = /à venir/.test(txt), head = txt.split(' : ')[0].replace(/\s*\(à venir\)/, ''), rest = txt.split(' : ').slice(1).join(' : ');
      add({ k, txt: later ? `${head} (rêve suivant)` : head, line: later ? `${head} (plus tard)` : head, sub: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '', act: 'Voir le rêve', go: 'reve', prio: later ? 22 : 95, now: !later, ...ext });
      continue;
    }
    if (k === 'recette') {
      const nm = txt.replace(/^Atelier\s*:\s*/, ''), r = RECIPES.find(x => x.out[0] === nm), ok = r && typeof canCraft === 'function' && obSafe(() => canCraft(r), false);
      add({ k, txt: `Pour fabriquer « ${nm} »`, line: `Pour fabriquer : ${nm}`, sub: ok ? 'Vous avez tout : prêt à fabriquer !' : 'Recette de l’atelier', act: 'Fabriquer', go: r ? 'craft' : 'atelier', arg: r ? r.id : '', prio: ok ? 62 : 35, ready: ok, ...ext });
      continue;
    }
    if (k === 'batiment') { const nm = txt.replace(/^Village\s*:\s*/, ''); add({ k, txt: `Pour construire « ${nm} »`, line: `Pour construire : ${nm}`, sub: 'Bâtiment du village', act: 'Construire', go: 'village', prio: 30, ...ext }); continue; }
    if (k === 'collection') { const codex = /^Codex/.test(txt); add({ k, txt, line: txt, sub: codex ? 'Codex des régions' : '', act: codex ? 'Codex' : 'Voir', go: codex ? 'codex' : 'col', prio: 10, ...ext }); continue; }
    if (k === 'habiller') { add({ k, txt, line: txt, act: 'Porter', go: 'wear', prio: 72, ...ext }); continue; }
    if (k === 'attirer') { add({ k, txt, line: txt, sub: 'Emportez-le en voyage', act: 'Emporter comme appât', go: 'bait', prio: 76, ...ext }); continue; }
    if (k === 'eclore') { add({ k, txt, line: txt, sub: 'À la couveuse de la nurserie', act: 'Couveuse', go: 'egg', prio: 78, ...ext }); continue; }
    if (k === 'vendre') { add({ k, txt, line: txt, act: 'Vendre', go: 'sell', prio: 18, ...ext }); continue; }
    add({ k: 'autre', txt, line: txt, act: ext ? 'Y aller' : '', prio: 20, ...ext });
  }
  // 3. usages propres à la nature de l'objet
  if (it.cat === 'v' && !uses.some(u => u.k === 'habiller')) {
    const by = obSafe(() => typeof styleWornBy === 'function' ? styleWornBy(it.id) : null, null);
    add({ k: 'habiller', txt: by ? `Porté par ${obName(by)}` : `Un vêtement pour ${wn}`, line: by ? `Porté par ${obName(by)}` : `Habille ${wn}`, sub: `Se porte : ${(SLOT_LABEL[it.sub] || '').toLowerCase()}`, act: by === who ? 'Garde-robe' : 'Porter', go: 'wear', prio: by ? 50 : 70, worn: by });
  }
  if (it.cat === 'n') {
    const t = obSafe(() => who ? tasteOf(who, it) : 'like', 'like');
    if (t !== 'hate') add({ k: 'nourrir', txt: t === 'love' ? `Le plat adoré de ${wn} : beaucoup d’expérience` : `Un repas pour ${wn}`, line: t === 'love' ? `Plat adoré de ${wn}` : `Régale ${wn}`, sub: t === 'love' ? 'Donne beaucoup d’expérience' : 'Donne un peu d’expérience', act: 'Donner', go: 'feed', prio: t === 'love' ? 45 : 12 });
  }
  if (it.cat === 'd') add({ k: 'maison', txt: 'Décore la maison : plus de confort', line: 'Décore la maison', sub: 'Plus de confort, plus d’expérience', act: 'Poser chez moi', go: 'house', prio: 25 });
  if (it.cat === 't') add({ k: 'tresor', txt: 'Révèle un lieu secret sur la carte', line: 'Révèle un lieu secret', sub: 'Trésors légendaires garantis là-bas', act: 'Déplier', go: 'unroll', prio: 80 });
  const rare = it.rarity >= 2 || it.special || it.edition;
  if (rare && !uses.some(u => u.k === 'collection' && !/^Codex/.test(u.line))) add({ k: 'collection', txt: 'Objet de collection : à garder précieusement', line: 'Objet de collection', sub: `${RARITY[it.rarity]} : plus c’est rare, plus ça vaut cher`, act: '', go: '', prio: 9 });
  const val = obSafe(() => value(it), 0);
  if (!uses.some(u => u.k === 'vendre')) add({ k: 'vendre', txt: `Vendre au marché, environ ${val} pièces`, line: `À vendre · ${val} pièces`, sub: 'Au marché, au prix que vous choisissez', act: 'Vendre', go: 'sell', prio: 5 });
  uses.sort((a, b) => b.prio - a.prio);
  // plusieurs recettes : on l'annonce sur la ligne courte
  const nRec = uses.filter(u => u.k === 'recette').length;
  const main = uses[0];
  const grps = new Set();
  uses.forEach(u => { const g = (OB_K[u.k] || OB_K.autre).grp; if (g && g !== 'vendre' && g !== 'col') grps.add(g); });
  if (it.cat === 'n' && !uses.some(u => u.k === 'nourrir' && u.prio >= 45)) grps.delete('comp');
  const useful = uses.filter(u => u.k !== 'vendre' && u.k !== 'collection' && u.prio >= 20).length;
  if (!useful || uses.some(u => u.k === 'vendre' && u.prio > 5)) grps.add('vendre');
  if (rare) grps.add('col');
  return { uses, main, nRec, grps, now: uses.some(u => u.now), ready: uses.some(u => u.ready), val, rare };
}
const obKind = u => OB_K[u.k] || OB_K.autre;
const obLineHTML = (inf, cls = '') => { const u = inf.main, K = obKind(u); return `<span class="obu ${cls}${u.now ? ' now' : ''}" style="--uc:${K.c};--ub:${K.b}">${obIco(K.ic)}<span>→ ${esc(u.line)}${u.k === 'recette' && inf.nRec > 1 ? ` <small>+${inf.nRec - 1}</small>` : ''}</span></span>`; };

// ---------- provenance : petite pastille de région ----------
function obRegion(it) {
  try {
    if (typeof originOf !== 'function' || typeof RG === 'undefined') return null;
    const o = originOf(it); if (!o || !RG[o.region]) return null;
    return { o, R: RG[o.region] };
  } catch (e) { return null; }
}
function obRegPill(it) {
  const g = obRegion(it); if (!g) return '';
  const { o, R } = g;
  return `<span class="obreg${o.made ? ' made' : ''}" title="${esc(o.made ? 'Fabriqué à ' + (o.place || S.home) : R.name + (o.place ? ' · ' + o.place : ''))}">${o.made ? obIco('recette') : rgIcon(R, 's')}<span>${esc(o.made ? 'Fait main' : R.short)}</span></span>`;
}

// ---------- pourquoi c'est précieux ----------
function obRarePct(it) {
  try {
    if (it.rid && typeof RG_RES !== 'undefined' && RG_RES[it.rid] && typeof rgResChances === 'function') {
      const x = RG_RES[it.rid], R = RG[x.region], ch = rgResChances(R, 0, 0, 'moyen').find(c => c.x.id === it.rid);
      if (ch) return { p: ch.p * 100, where: `des spécialités trouvées ${rgDe(R).replace(/^du /, 'au ').replace(/^de la /, 'en ').replace(/^des /, 'aux ').replace(/^de l’/, 'à l’').replace(/^d’/, 'en ').replace(/^de /, 'en ')}` };
    }
    if (Array.isArray(it.tags) && it.tags.length && typeof lootTable === 'function') {
      const row = lootTable(it.tags).find(x => x.d[0] === it.name);
      if (row) {
        let p = row.p, base = row.d[3];
        for (let r = base; r < it.rarity; r++) p *= 0.08 * Math.pow(0.5, r - base);
        if (it.rarity === base && base < 4) p *= 0.92;
        return { p: p * 100, where: it.from ? `des trouvailles à ${it.from}` : 'des trouvailles de ce lieu' };
      }
    }
  } catch (e) {}
  return { p: OB_PCT[it.rarity] || 1, where: `des objets trouvés en voyage sont ${obLc(RARITY[it.rarity])}s`, generic: true };
}
function obRareHTML(it) {
  if (!(it.rarity >= 2 || it.special || it.edition)) return '';
  const made = /^Fabriqué/.test(it.from || '') || (it.origin && it.origin.made);
  let lead;
  if (made) lead = /chef-d’œuvre/.test(it.name) ? 'Un chef-d’œuvre : réussi environ une fabrication sur huit.' : 'Fabriqué de vos mains : il a fallu réunir chaque ingrédient.';
  else if (it.edition) lead = `${esc(it.edition)} : le tout premier exemplaire trouvé.`;
  else { const r = obRarePct(it); lead = r.generic ? `Seulement ${obFmtPct(r.p)} ${esc(r.where)}.` : `Seulement ${obFmtPct(r.p)} ${esc(r.where)}.`; }
  const x = Math.max(1, Math.round(obSafe(() => value(it), 0) / Math.max(1, obSafe(() => value({ ...it, rarity: 0, special: false, edition: null, id: '' }), 6))));
  return `<div class="obrare" style="--rc:${RARC[it.rarity]}"><span class="obrs">${'★'.repeat(it.rarity + 1)}</span><div><b>Pourquoi c’est précieux</b><p>${lead}${x >= 2 ? ` Il vaut environ <b>${x} fois</b> le même objet en commun.` : ''}</p><p class="obwhy">Plus c’est rare, plus ça vaut cher, plus ça attire de compagnons rares et impressionne les clients.</p></div></div>`;
}

// ---------- légende des raretés ----------
function obLegendHTML() {
  return `<div class="oblegend" id="obLegend"><b class="oblh">Les raretés</b><div class="oblrows">${RARITY.map((n, r) => `<div class="oblr r${r}" style="--rc:${RARC[r]}"><span class="oblsw">${'★'.repeat(r + 1)}</span><span class="obln"><b>${n}</b><i>${OB_RNOTE[r]}</i></span><span class="oblp">≈ ${obFmtPct(OB_PCT[r])}<small>des trouvailles</small></span></div>`).join('')}</div><p class="obwhy">Plus c’est rare, plus ça vaut cher, plus ça attire de compagnons rares et impressionne les clients. Les longs voyages et les pays lointains rapportent plus de raretés.</p></div>`;
}

// ================= LE SAC =================
let obFilter = 'tout', obLegend = false, obLastBag = (typeof bagFilter !== 'undefined' ? bagFilter : 'all');
function obGroupInv() {
  const groups = new Map();
  for (const it of S.inv) {
    if (!it) continue;
    const key = [it.name, it.rarity, it.cat, it.rid || '', it.edition || '', it.special ? 1 : 0, it.color || ''].join('|');
    let g = groups.get(key);
    if (!g) { g = { key, items: [] }; groups.set(key, g); }
    g.items.push(it);
  }
  const out = [];
  for (const g of groups.values()) {
    const worn = obSafe(() => typeof styleWornBy === 'function' ? g.items.filter(x => styleWornBy(x.id)) : [], []);
    g.items.sort((a, b) => (worn.includes(a) - worn.includes(b)) || (b.date || 0) - (a.date || 0));
    g.it = g.items[0]; g.n = g.items.length; g.worn = worn.length;
    g.date = Math.max(...g.items.map(x => x.date || 0));
    g.inf = obInfo(g.it);
    out.push(g);
  }
  out.sort((a, b) => (b.inf.now - a.inf.now) || (b.inf.ready - a.inf.ready) || (b.it.rarity - a.it.rarity) || (b.inf.main.prio - a.inf.main.prio) || (b.date - a.date));
  return out;
}
function obCard(g, i) {
  const it = g.it, inf = g.inf;
  return `<button class="obc r${it.rarity}${inf.now ? ' now' : ''}" data-fiche="${esc(it.id)}" style="--rc:${RARC[it.rarity]};--d:${Math.min(i, 14) * 0.025}s" aria-label="${esc(it.name)}, ${RARITY[it.rarity]}${g.n > 1 ? ', ' + g.n + ' exemplaires' : ''}. ${esc(inf.main.line)}">
<span class="obtop">${obRegPill(it)}${g.n > 1 ? `<span class="obx">×${g.n}</span>` : ''}</span>
<span class="obi">${itemIcon(it)}${g.worn ? '<em class="obworn">Porté</em>' : ''}</span>
<b class="obnm">${esc(it.name)}</b><span class="obrar">${RARITY[it.rarity]}${it.edition ? ' · Édition' : it.special ? ' · Unique' : ''}</span>
${obLineHTML(inf)}</button>`;
}
function obRenderBag(box) {
  if (typeof bagFilter !== 'undefined' && bagFilter !== obLastBag) { obFilter = bagFilter === 'v' ? 'comp' : 'tout'; obLastBag = bagFilter; }
  OB_FNS = [];
  const all = obGroupInv(), total = S.inv.length;
  const cnt = {}; OB_GROUPS.forEach(([k]) => { cnt[k] = 0; });
  all.forEach(g => { cnt.tout += g.n; g.inf.grps.forEach(k => { if (k in cnt) cnt[k] += g.n; }); });
  if (obFilter !== 'tout' && !cnt[obFilter]) obFilter = obFilter in cnt ? obFilter : 'tout';
  const list = obFilter === 'tout' ? all : all.filter(g => g.inf.grps.has(obFilter));
  const nowN = all.filter(g => g.inf.now).reduce((a, g) => a + g.n, 0);
  let h = `<div class="obhead"><div class="obht"><b>Mon sac</b><span>${obPl(total, 'objet', 'objets')} · touchez un objet pour savoir à quoi il sert</span></div><button class="obhelp" data-oblegend="1" aria-expanded="${obLegend}" aria-controls="obLegend" title="Les raretés">?</button></div>`;
  if (obLegend) h += obLegendHTML();
  h += `<div class="obfil" role="tablist" aria-label="Trier le sac par usage">${OB_GROUPS.map(([k, l, ic]) => `<button role="tab" class="obf-${k}${cnt[k] ? '' : ' zero'}" data-obf="${k}" aria-selected="${obFilter === k}">${obIco(ic)}<span>${l}</span><i>${cnt[k]}</i></button>`).join('')}</div>`;
  if (nowN && (obFilter === 'tout' || obFilter === 'client' || obFilter === 'comp')) h += `<p class="obnowtip"><span class="obdot"></span>${obPl(nowN, 'objet est attendu', 'objets sont attendus')} en ce moment par une commande ou un rêve : ${nowN > 1 ? 'ils sont' : 'il est'} en tête.</p>`;
  if (!total) h += `<div class="obempty">${obIco('tout', 'big')}<p>Le sac est vide. Envoyez un compagnon en voyage : il reviendra avec des vêtements, des matériaux et des spécialités locales.</p><button class="btn gold sm" data-obgo="voyage">Partir en voyage</button></div>`;
  else if (!list.length) h += `<div class="obempty">${obIco(OB_GROUPS.find(x => x[0] === obFilter)[2], 'big')}<p>${{ comp: 'Rien pour vos compagnons pour l’instant : vêtements, appâts et objets de rêve arrivent avec les voyages.', client: 'Aucun objet demandé par vos clients pour l’instant. Regardez ce qu’ils veulent au comptoir.', fab: 'Aucun ingrédient de recette pour l’instant.', vendre: 'Tout ce que vous avez sert à quelque chose !', col: 'Pas encore d’objet rare. Les longs voyages lointains en rapportent plus.' }[obFilter] || ''}</p>${obFilter === 'client' ? '<button class="btn gold sm" data-obgo="order">Voir les commandes</button>' : ''}</div>`;
  else h += `<div class="obgrid">${list.map(obCard).join('')}</div>`;
  if (total) h += `<p class="small obfoot">Les objets identiques sont regroupés (×N). En tête : ce qui sert maintenant, puis les plus rares.</p>`;
  box.innerHTML = h;
}
if (typeof renderBag === 'function') renderBag = (orig => function (box) {
  try { return obRenderBag(box); } catch (e) { console.error('objets', e); return orig.apply(this, arguments); }
})(renderBag);

// ================= LA FICHE D'OBJET =================
function obStory(it, hasDesc) {
  if (hasDesc) return '';
  const from = it.from || '';
  const d = it.date ? new Date(it.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
  if (it.desc) return esc(it.desc);
  if (it.edition) return `${esc(it.edition)} : le premier exemplaire jamais trouvé${from ? `, à ${esc(from)}` : ''}.`;
  if (it.special && from && !/^Récompense/.test(from)) return `Le souvenir unique de ${esc(from)}.`;
  if (/^Fabriqué/.test(from)) return `${esc(from)}${d ? `, le ${d}` : ''}.`;
  if (/^(Cadeau|Récompense|Coffre|Collection|Brocante|Test)/.test(from)) return `${esc(from)}${d ? `, le ${d}` : ''}.`;
  if (from) return `Rapporté de ${esc(from)}${d ? ` le ${d}` : ''}.`;
  return '';
}
function obRowHTML(u, it) {
  const K = obKind(u);
  let attrs = '';
  if (u.go === 'feed') attrs = `data-feed="${esc(it.id)}"`;
  else if (u.go === 'unroll') attrs = `data-unroll="${esc(it.id)}"`;
  else if (u.go) attrs = `data-obgo="${u.go}" data-obarg="${esc(u.arg == null ? '' : u.arg)}" data-obid="${esc(it.id)}"`;
  const tag = u.act && u.go ? 'button' : 'div';
  return `<${tag} class="obrow${u.ready ? ' ready' : ''}${u.now ? ' now' : ''}" ${tag === 'button' ? attrs : ''} style="--uc:${K.c};--ub:${K.b}"><span class="obri">${obIco(K.ic)}</span><span class="obrt"><b>${esc(u.txt)}</b>${u.sub ? `<small>${esc(u.sub)}</small>` : ''}</span>${tag === 'button' ? `<span class="obra">${esc(u.act)}</span>` : ''}</${tag}>`;
}
function obFicheHTML(it, keep) {
  OB_FNS = [];
  const inf = obInfo(it), n = S.inv.filter(x => x.name === it.name && x.rarity === it.rarity).length;
  const kind = it.cat === 'v' ? `Vêtement · ${SLOT_LABEL[it.sub] || ''}` : (CAT_LABEL[it.cat] || '');
  const sp = obSafe(() => sellPrice(it), 0);
  // au plus 2 recettes et 2 bâtiments détaillés : les autres sont résumés en une ligne
  const uses = [], nK = {}, more = {};
  for (const u of inf.uses) {
    if (u.k === 'collection' && !u.go) continue;
    if (u.k === 'recette' || u.k === 'batiment') { nK[u.k] = (nK[u.k] || 0) + 1; if (nK[u.k] > 2 && inf.uses.filter(x => x.k === u.k).length > 3) { more[u.k] = (more[u.k] || 0) + 1; continue; } }
    uses.push(u);
  }
  if (more.recette) { const i = uses.map(u => u.k).lastIndexOf('recette'); uses.splice(i + 1, 0, { k: 'recette', txt: `Et ${obPl(more.recette, 'autre recette', 'autres recettes')} à l’atelier`, sub: 'Toutes les recettes qui l’utilisent', act: 'Atelier', go: 'atelier', prio: 0 }); }
  if (more.batiment) { const i = uses.map(u => u.k).lastIndexOf('batiment'); uses.splice(i + 1, 0, { k: 'batiment', txt: `Et ${obPl(more.batiment, 'autre bâtiment', 'autres bâtiments')} du village`, act: 'Village', go: 'village', prio: 0 }); }
  let h = `<div class="fiche obf r${it.rarity}" style="--rc:${RARC[it.rarity]}">`;
  h += `<div class="obfh"><span class="obfray" aria-hidden="true"></span><div class="fico obfi">${itemIcon(it)}</div>${n > 1 ? `<span class="obfx">×${n} dans le sac</span>` : ''}</div>`;
  h += `<h2>${esc(it.name)}</h2><span class="obfrar"><i>${'★'.repeat(it.rarity + 1)}</i>${RARITY[it.rarity]}</span><span class="frar obfk">${esc(kind)}${it.special && !it.edition ? ' · Souvenir unique' : ''}</span>`;
  h += keep.rgfo || '';
  const story = obStory(it, !!keep.rgdesc);
  h += keep.rgdesc || (story ? `<p class="rgdesc obst">${story}</p>` : '');
  h += obRareHTML(it);
  h += `<div class="obsec"><h3>À quoi ça sert</h3><div class="obrows">${uses.map(u => obRowHTML(u, it)).join('')}</div></div>`;
  h += keep.extra || '';
  h += `<div class="obval"><span class="obvl">Valeur estimée</span><b>${coins(inf.val)}</b>${keep.rgval || ''}</div>`;
  h += `<div class="obff"><button class="btn cream sm" data-sellq="${esc(it.id)}" title="Vendu tout de suite, moins cher qu’au marché">Vente rapide ${coins(sp)}</button><button class="btn green sm" data-fclose="1">Fermer</button></div>`;
  return h + `</div>`;
}
if (typeof openFiche === 'function') openFiche = (orig => function (id) {
  const r = orig.apply(this, arguments);
  try {
    const it = S.inv.find(i => i.id === id), f = document.querySelector('#modal .fiche');
    if (!it || !f) return r;
    const pick = sel => { const e = f.querySelector(sel); return e ? e.outerHTML : ''; };
    const known = ['fico', 'frar', 'small', 'fuses', 'facts', 'btn', 'rgfo', 'rgdesc', 'rgval', 'uses'];
    const extra = [...f.children].filter(e => e.tagName !== 'H2' && !known.some(c => e.classList.contains(c))).map(e => e.outerHTML).join('');
    const rgdesc = pick('.rgdesc');
    f.outerHTML = obFicheHTML(it, { rgfo: pick('.rgfo'), rgdesc: rgdesc ? rgdesc.replace('class="rgdesc"', 'class="rgdesc obst"') : '', rgval: pick('.rgval'), extra: extra ? `<div class="obextra">${extra}</div>` : '' });
    const mb = document.querySelector('#modal .mbox'); if (mb) { mb.scrollTop = 0; mb.classList.add('obmbox'); }
  } catch (e) { console.error('objets', e); }
  return r;
})(openFiche);

// ================= RETOUR DE VOYAGE =================
if (typeof haulCard === 'function') haulCard = (orig => function (it, i, isNew) {
  let h = orig.apply(this, arguments);
  try {
    OB_FNS = OB_FNS.length > 200 ? [] : OB_FNS;
    const inf = obInfo(it);
    h = h.replace('class="hcard ', `class="hcard obh${isNew ? ' obnew' : ''}${inf.now ? ' obnow' : ''} `);
    if (isNew) h = h.replace(/(<span class="hico">)/, `<span class="obspark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>$1`);
    h = h.replace(/<\/div>$/, `${obLineHTML(inf, 'sm')}</div>`);
    if (it.id) h = h.replace('class="hcard ', `data-fiche="${esc(it.id)}" role="button" tabindex="0" aria-label="Voir la fiche : ${esc(it.name)}" class="hcard `);
  } catch (e) { console.error('objets', e); }
  return h;
})(haulCard);
const OB_SUM = {
  client: n => obPl(n, 'objet pour une commande', 'objets pour une commande'),
  reve: n => obPl(n, 'objet pour un rêve', 'objets pour un rêve'),
  habiller: n => obPl(n, 'vêtement', 'vêtements'),
  attirer: n => obPl(n, 'appât', 'appâts'),
  eclore: n => obPl(n, 'objet pour la couveuse', 'objets pour la couveuse'),
  recette: n => obPl(n, 'ingrédient', 'ingrédients'),
  batiment: n => obPl(n, 'matériau pour le village', 'matériaux pour le village'),
  nourrir: n => obPl(n, 'plat adoré', 'plats adorés'),
  maison: n => obPl(n, 'décoration', 'décorations'),
  tresor: n => obPl(n, 'carte au trésor', 'cartes au trésor'),
  collection: n => obPl(n, 'objet de collection', 'objets de collection'),
  vendre: n => obPl(n, 'à vendre', 'à vendre'),
  autre: n => obPl(n, 'autre objet', 'autres objets'),
};
function obHaulSummary(h) {
  const m = $('modal'); if (!m || m.hidden) return;
  const box = m.querySelector('.mbox'); if (!box || !box.querySelector('.haul') || box.querySelector('.obsum')) return;
  const items = (h.items || []).filter(Boolean); if (!items.length) return;
  const by = {}, acts = [], seenAct = new Set(), who = h.comp && CHARS[h.comp] ? h.comp : obSel();
  const pushAct = (key, html) => { if (seenAct.has(key) || acts.length >= 3) return; seenAct.add(key); acts.push(html); };
  const infs = items.map(it => ({ it, inf: obInfo(it) }));
  infs.forEach(x => { const u = x.inf.uses.find(v => !(v.k === 'reve' && !v.now)) || x.inf.main; x.top = u; by[u.k] = (by[u.k] || 0) + 1; });
  const order = ['client', 'reve', 'habiller', 'attirer', 'eclore', 'recette', 'batiment', 'nourrir', 'maison', 'tresor', 'collection', 'autre', 'vendre'];
  const parts = order.filter(k => by[k]).map(k => `<span style="--uc:${(OB_K[k] || OB_K.autre).c};--ub:${(OB_K[k] || OB_K.autre).b}">${obIco((OB_K[k] || OB_K.autre).ic)}${(OB_SUM[k] || OB_SUM.autre)(by[k])}</span>`);
  // boutons d'action directs, du plus utile au moins utile
  const bqShown = !!box.querySelector('.bq-haul');
  const sorted = infs.slice().sort((a, b) => b.top.prio - a.top.prio);
  for (const { it, top } of sorted) {
    const u = top;
    if (u.k === 'client' && u.go === 'order') { const c = obOrders(it)[0]; if (c && !(bqShown && c.ready)) pushAct('o' + c.o.id, `<button class="btn ${c.ready ? 'green' : 'gold'} sm" data-obgo="order" data-obarg="${esc(c.o.id)}">${c.ready ? `Livrer à ${esc(c.c.name)}` : `Commande de ${esc(c.c.name)}`}</button>`); }
    else if (u.k === 'reve' && u.now) pushAct('reve', `<button class="btn gold sm" data-obgo="reve">Voir le rêve</button>`);
    else if (u.k === 'habiller' && !u.worn) pushAct('wear', `<button class="btn gold sm" data-obgo="wear" data-obid="${esc(it.id)}" data-obwho="${esc(who || '')}">Habiller ${esc(obName(who))}</button>`);
    else if (u.k === 'attirer') pushAct('bait', `<button class="btn gold sm" data-obgo="${u.go}" data-obarg="${esc(u.arg == null ? '' : u.arg)}" data-obid="${esc(it.id)}">Emporter l’appât</button>`);
    else if (u.k === 'eclore') pushAct('egg', `<button class="btn gold sm" data-obgo="${u.go}" data-obarg="${esc(u.arg == null ? '' : u.arg)}" data-obid="${esc(it.id)}">Couveuse</button>`);
    else if (u.k === 'recette' && u.ready) pushAct('c' + u.arg, `<button class="btn gold sm" data-obgo="craft" data-obarg="${esc(u.arg)}">Fabriquer</button>`);
    else if (u.k === 'tresor') pushAct('t', `<button class="btn gold sm" data-unroll="${esc(it.id)}" data-obclose="1">Déplier la carte</button>`);
  }
  const html = `<div class="obsum"><b>Ce que vous rapportez</b><div class="obsp">${parts.join('<i class="obsep">·</i>')}</div>${acts.length ? `<div class="obsa">${acts.join('')}</div>` : ''}</div>`;
  const last = box.querySelector(':scope > button:last-child');
  const hextra = box.querySelector(':scope > .hextra');
  if (hextra) hextra.insertAdjacentHTML('beforebegin', html);
  else if (last) last.insertAdjacentHTML('beforebegin', html);
  else box.insertAdjacentHTML('beforeend', html);
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  // un court délai : la boutique ajoute « Commande prête ! » juste après (on évite le doublon)
  try { setTimeout(() => { try { obHaulSummary(h); } catch (e) { console.error('objets', e); } }, 70); } catch (e) {}
  return r;
})(showHaul);

// ================= APRÈS UNE FABRICATION : petite carte non bloquante =================
function obCraftCard(it, who) {
  if (!it || !S.inv.includes(it)) return;
  OB_FNS = [];
  let el = document.getElementById('obCraft');
  if (!el) { el = document.createElement('div'); el.id = 'obCraft'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); (document.getElementById('app') || document.body).appendChild(el); }
  const inf = obInfo(it), u = inf.uses.find(x => x.act && x.go && x.k !== 'collection') || inf.main;
  let btn = '';
  if (u.go === 'feed') btn = `<button class="btn gold sm" data-feed="${esc(it.id)}" data-obclose="1">${esc(u.act)}</button>`;
  else if (u.go === 'unroll') btn = `<button class="btn gold sm" data-unroll="${esc(it.id)}" data-obclose="1">${esc(u.act)}</button>`;
  else if (u.go && u.act) btn = `<button class="btn ${u.ready ? 'green' : 'gold'} sm" data-obgo="${u.go}" data-obarg="${esc(u.arg == null ? '' : u.arg)}" data-obid="${esc(it.id)}" data-obwho="${esc(who || '')}">${esc(u.act === 'Voir' && u.k === 'client' ? 'Livrer' : u.act)}</button>`;
  el.className = `obcraft r${it.rarity}`;
  el.style.setProperty('--rc', RARC[it.rarity]);
  el.innerHTML = `<button class="obcx" data-obclose="1" aria-label="Fermer">×</button><span class="obci">${itemIcon(it)}</span><div class="obct"><span class="obck">Nouvel objet fabriqué</span><b>${esc(it.name)}</b><span class="obcr">${RARITY[it.rarity]}</span>${obLineHTML(inf, 'sm')}</div><div class="obcb">${btn}<button class="obcl" data-fiche="${esc(it.id)}">Fiche</button></div>`;
  el.hidden = false; el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
  clearTimeout(obCraftCard.t); obCraftCard.t = setTimeout(obCraftHide, 9000);
}
function obCraftHide() { const el = document.getElementById('obCraft'); if (!el || el.hidden) return; el.classList.remove('in'); el.classList.add('out'); setTimeout(() => { if (el.classList.contains('out')) el.hidden = true; }, 260); }
if (typeof GAME !== 'undefined') GAME.on('craft', ({ item, who }) => { setTimeout(() => { try { obCraftCard(item, who); } catch (e) { console.error('objets', e); } }, 60); });

// ================= ACTIONS : ouvrir le bon écran =================
function obFlash(sel, up) {
  setTimeout(() => {
    try {
      const pb = $('panelBody'); if (!pb) return;
      let e = pb.querySelector(sel); if (!e) return;
      if (up) e = e.closest(up) || e;
      if (e.scrollIntoView) e.scrollIntoView({ block: 'center', behavior: 'smooth' });
      e.classList.remove('obflash'); void e.offsetWidth; e.classList.add('obflash');
      setTimeout(() => e.classList.remove('obflash'), 2600);
    } catch (e) {}
  }, 140);
}
const obCss = s => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'));
function obGo(go, arg, id, who) {
  const it = id ? S.inv.find(i => i.id === id) : null;
  switch (go) {
    case 'order':
      if (typeof openBoutique === 'function') openBoutique('comptoir'); else openSheet('boutique');
      obFlash(arg ? `[data-oid="${obCss(arg)}"]` : '.bq-order');
      return;
    case 'wear': {
      const k = who && CHARS[who] ? who : obSel();
      if (k && k !== S.sel) { S.sel = k; if (S.unseen) S.unseen[k] = 0; }
      if (it && it.cat === 'v' && k) {
        try { stSlot = it.sub; } catch (e) {}
        const by = obSafe(() => typeof styleWornBy === 'function' ? styleWornBy(it.id) : null, null);
        if (by !== k) {
          if (typeof styleEquip === 'function') { styleEquip(k, it); try { stJoy = Date.now(); stJoyLine = `Comment tu me trouves avec « ${it.name} » ?`; } catch (e) {} }
          else { const o = S.outfits[k]; if (o) { o.col = o.col || {}; o.worn = o.worn || {}; o[it.sub] = it.look; o.col[it.look] = it.color; o.worn[it.sub] = it.id; S.stats.worn = (S.stats.worn || 0) + 1; } }
          save();
        }
      }
      renderTop(); renderComps();
      if (typeof openCompagnons === 'function') openCompagnons('garde'); else openSheet('compagnons');
      try { if (typeof stJoyBack === 'function') stJoyBack(); } catch (e) {}
      return;
    }
    case 'craft': {
      const r = RECIPES.find(x => x.id === arg);
      if (r && r.kind) { try { craftFilter = r.kind; } catch (e) {} }
      openSheet('atelier');
      if (r) obFlash(`[data-craft="${obCss(r.id)}"]`, '.rec');
      return;
    }
    case 'atelier': openSheet('atelier'); return;
    case 'village': try { villView = 'habitats'; } catch (e) {} openSheet('village', true); return; // habitats du refuge et bâtiments
    case 'reve': if (typeof openCompagnons === 'function') openCompagnons('reves'); else openSheet('reves'); return;
    case 'bait':
      if (typeof openNurserie === 'function') { try { openNurserie('appats', id); return; } catch (e) {} }
      {
        // l'appât est présélectionné dans le panneau de voyage de la nurserie (nsBaitPanel), pour un compagnon libre
        let ok = false;
        try { if (it && typeof nsState === 'function' && typeof nsBaitSps === 'function' && nsBaitSps(it).length) { nsState().bait = it.name; ok = true; save(); } } catch (e) {}
        const free = typeof teamIds === 'function' ? teamIds().find(k => !S.trips[k]) : null;
        if (free && free !== S.sel && typeof selectComp === 'function') selectComp(free);
        openSheet('voyage');
        toast(!free ? 'Toute l’équipe est en voyage : l’appât partira avec le prochain départ.' : ok ? `« ${it.name} » partira dans le sac au prochain voyage. Choisissez où aller !` : 'Choisissez où partir : emportez l’appât en voyage pour attirer un compagnon.');
      }
      return;
    case 'egg':
      if (typeof openNurserie === 'function') { try { openNurserie('couveuse', id); return; } catch (e) {} }
      try { villView = 'nurserie'; } catch (e) {}
      openSheet('village', true); return;
    case 'sell':
      try { mktView = 'vendre'; } catch (e) {}
      if (typeof openBoutique === 'function') openBoutique('marche'); else openSheet('marche');
      if (id) obFlash(`[data-list="${obCss(id)}"]`, '.bi');
      return;
    case 'house': openSheet('maison'); return;
    case 'codex': openSheet('regions'); return;
    case 'col': openSheet('collections'); return;
    case 'voyage': openSheet('voyage'); return;
    case 'fn': { const f = OB_FNS[+arg]; if (typeof f === 'function') { try { f(it); } catch (e) { console.error(e); } } return; }
  }
}
document.addEventListener('click', ev => {
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.obf) { obFilter = d.obf; renderPanel(); return; }
  if (d.oblegend) { obLegend = !obLegend; renderPanel(); if (obLegend) setTimeout(() => { const l = document.getElementById('obLegend'); if (l && l.scrollIntoView) l.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30); return; }
  const inCraft = el.closest('#obCraft');
  if (d.obclose || inCraft) { if (inCraft) obCraftHide(); else { const m = $('modal'); if (m && el.closest('#modal')) m.hidden = true; } }
  if (d.obgo) {
    const m = $('modal'); if (m && el.closest('#modal')) m.hidden = true;
    obGo(d.obgo, d.obarg, d.obid, d.obwho);
  }
});

// ================= STYLES =================
(function obCSS() {
  const st = document.createElement('style'); st.id = 'objetsCSS';
  st.textContent = `
.obic{width:18px;height:18px;flex:none;display:block}
.obic.big{width:44px;height:44px}
.obhead{display:flex;align-items:center;gap:10px}
.obht{flex:1;min-width:0;display:flex;flex-direction:column}
.obht b{font:800 19px/1.1 var(--display)}
.obht span{font:600 13px/1.3 var(--body);color:var(--ink2)}
.obhelp{flex:none;width:34px;height:34px;border-radius:50%;border:2.5px solid var(--ink);background:#fff;font:800 18px/1 var(--display);color:var(--ink);box-shadow:0 3px 0 var(--ink);cursor:pointer}
.obhelp[aria-expanded="true"]{background:var(--gold)}
.obhelp:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
.obfil{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.obfil button{position:relative;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;align-items:center;column-gap:5px;row-gap:2px;min-height:50px;padding:5px 7px 6px;background:#fff;border:2px solid var(--line);border-radius:14px;font:700 12.5px/1.1 var(--display);color:var(--ink);text-align:left;cursor:pointer;min-width:0}
.obfil button .obic{width:22px;height:22px;grid-row:1;grid-column:1}
.obfil button span{grid-row:2;grid-column:1 / 3;overflow-wrap:anywhere}
.obfil button i{grid-row:1;grid-column:2;justify-self:end;min-width:22px;height:19px;padding:0 6px;border-radius:999px;background:var(--paper2);color:var(--ink2);font:800 11.5px/19px var(--display);font-style:normal;text-align:center}
.obfil button[aria-selected="true"]{background:var(--tealsoft);border-color:var(--teal);box-shadow:0 3px 0 var(--teal)}
.obfil button[aria-selected="true"] i{background:var(--teal);color:#fff}
.obfil button.zero{opacity:.6}
.obfil button.obf-client:not(.zero) i{background:#ffe1ec;color:#b8456a}
.obnowtip{margin:0;display:flex;align-items:center;gap:7px;font:700 13px/1.3 var(--body);color:#8a3a58;background:#fff0f5;border:1.5px solid #f3b9cc;border-radius:12px;padding:6px 10px}
.obdot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--pink);box-shadow:0 0 0 3px #ffd5e2;animation:obpulse 1.2s ease-in-out infinite alternate}
@keyframes obpulse{to{box-shadow:0 0 0 6px rgba(240,138,166,.15)}}
.obgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:9px}
.obc{position:relative;isolation:isolate;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 7px 8px;background:#fff;border:3px solid var(--rc);border-radius:16px;box-shadow:0 3px 0 color-mix(in srgb,var(--rc) 70%,#4a3528);color:var(--ink);text-align:center;cursor:pointer;animation:obIn .32s ease-out both;animation-delay:var(--d,0s);min-width:0}
.obc:active{transform:translateY(2px);box-shadow:0 1px 0 var(--rc)}
@keyframes obIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.obc.r0{border-color:#c9c3cf;box-shadow:0 3px 0 #b3acba}
.obc.r1{background:linear-gradient(#f1faf5,#fff 60%)}
.obc.r2{background:linear-gradient(#eaf2fd,#fff 60%)}
.obc.r3{background:linear-gradient(#f1e8fe,#fff 62%);box-shadow:0 3px 0 #7a52b8,0 0 0 3px rgba(154,111,214,.18)}
.obc.r4{background:linear-gradient(#fff2c4,#fffbea 62%);border-color:#e0a21f;box-shadow:0 3px 0 #b07a10,0 0 12px rgba(242,193,78,.55)}
.obc.r4::after,.obf.r4 .obfh::after,.obcraft.r4::after{content:"";position:absolute;top:0;bottom:0;left:-70%;width:45%;z-index:2;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.9),transparent);transform:skewX(-18deg);animation:obshine 2.8s ease-in-out infinite}
.obc.r3::after{content:"";position:absolute;top:0;bottom:0;left:-70%;width:40%;z-index:2;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent);transform:skewX(-18deg);animation:obshine 4.2s ease-in-out infinite}
@keyframes obshine{0%,55%{left:-70%}100%{left:130%}}
.obtop{align-self:stretch;display:flex;align-items:center;justify-content:space-between;gap:4px;min-height:18px}
.obreg{display:inline-flex;align-items:center;gap:3px;min-width:0;max-width:calc(100% - 34px);background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:0 6px 0 1px;font:700 10.5px/16px var(--display);color:var(--ink2)}
.obreg>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.obreg .obic{width:14px;height:14px;color:var(--ink)}
.obreg.made{background:#e3f3ea;border-color:#a9d6bf;color:#2f7360}
.obx{margin-left:auto;flex:none;background:var(--ink);color:#fff;border-radius:999px;padding:0 7px;font:800 12px/19px var(--display)}
.obi{position:relative;width:58px;height:58px;display:flex;align-items:center;justify-content:center;margin:1px 0}
.obi svg{width:100%;height:100%;filter:drop-shadow(0 2px 0 rgba(74,53,40,.15))}
.obc.r3 .obi svg,.obc.r4 .obi svg{animation:obfloat 1.8s ease-in-out infinite alternate}
@keyframes obfloat{to{transform:translateY(-3px) rotate(-3deg)}}
.obworn{position:absolute;right:-14px;bottom:-2px;background:var(--teal);color:#fff;border-radius:999px;padding:0 6px;font:800 9.5px/16px var(--display);font-style:normal;text-transform:uppercase}
.obnm{font:800 13.5px/1.15 var(--display);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.3em;width:100%;overflow-wrap:anywhere}
.obrar{font:800 10.5px/1.2 var(--display);text-transform:uppercase;letter-spacing:.05em;color:var(--rc)}
.obc.r0 .obrar{color:#8b8593}.obc.r4 .obrar{color:#b07a10}
.obu{display:flex;align-items:flex-start;gap:5px;align-self:stretch;margin-top:5px;padding:5px 7px;border-radius:10px;background:var(--ub);color:var(--uc);font:800 12.5px/1.2 var(--display);text-align:left}
.obu .obic{width:16px;height:16px;margin-top:0;color:var(--ink)}
.obu>span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-width:0;overflow-wrap:anywhere}
.obu small{font-size:11px;opacity:.75}
.obu.now{background:var(--uc);color:#fff;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}
.obu.now .obic{color:var(--ink);background:#fff;border-radius:50%;padding:1px}
.obu.sm{font-size:10.5px;padding:3px 5px;gap:3px;margin-top:3px;border-radius:8px}
.obu.sm .obic{width:13px;height:13px}
.obc.now{border-style:solid}
.obempty{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:16px 10px;background:#fff;border:2px dashed var(--line);border-radius:16px}
.obempty p{margin:0;color:var(--ink2);font-weight:600;line-height:1.4}
.obfoot{margin:2px 0 0;text-align:center}
.oblegend{background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:10px 12px;box-shadow:0 3px 0 rgba(74,53,40,.3);display:flex;flex-direction:column;gap:8px}
.oblh{font:800 16px var(--display)}
.oblrows{display:flex;flex-direction:column;gap:5px}
.oblr{display:flex;align-items:center;gap:8px;border:2.5px solid var(--rc);border-radius:12px;padding:4px 8px;position:relative;overflow:hidden;isolation:isolate}
.oblr.r0{border-color:#c9c3cf}.oblr.r4{background:linear-gradient(90deg,#fff2c4,#fff);border-color:#e0a21f}.oblr.r4::after{content:"";position:absolute;top:0;bottom:0;left:-70%;width:35%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.95),transparent);transform:skewX(-18deg);animation:obshine 2.8s ease-in-out infinite}
.oblr.r1{background:#f1faf5}.oblr.r2{background:#eef5fd}.oblr.r3{background:#f4edfe}
.oblsw{flex:none;width:58px;color:var(--rc);font-size:11px;letter-spacing:-1px;text-align:left}
.oblr.r0 .oblsw{color:#9a95a3}.oblr.r4 .oblsw{color:#c98f1e}
.obln{flex:1;display:flex;flex-direction:column;min-width:0}
.obln b{font:800 14px/1.1 var(--display);color:var(--rc)}.oblr.r0 .obln b{color:#7d7884}.oblr.r4 .obln b{color:#a8700a}
.obln i{font:600 11.5px/1.25 var(--body);font-style:normal;color:var(--ink2)}
.oblp{flex:none;display:flex;flex-direction:column;align-items:flex-end;font:800 13px/1.1 var(--display)}
.oblp small{font:600 10px var(--body);color:var(--muted)}
.obwhy{margin:0;font:700 13px/1.35 var(--body);color:#7a4f10;background:#fff6d8;border-radius:10px;padding:6px 9px}
/* fiche */
.mbox.obmbox{gap:8px;padding-top:14px}
.obf{display:flex;flex-direction:column;align-items:center;gap:7px;width:100%}
.obfh{position:relative;isolation:isolate;overflow:hidden;width:132px;height:118px;display:flex;align-items:center;justify-content:center;border:3px solid var(--rc);border-radius:26px;background:radial-gradient(circle at 50% 42%,#fff 0,color-mix(in srgb,var(--rc) 22%,#fff) 100%);box-shadow:0 4px 0 color-mix(in srgb,var(--rc) 70%,#4a3528)}
.obf.r0 .obfh{border-color:#c9c3cf;box-shadow:0 4px 0 #b3acba}
.obf.r4 .obfh{border-color:#e0a21f;background:radial-gradient(circle at 50% 42%,#fffbe6 0,#fbe3a3 100%)}
.obfray{position:absolute;inset:-50%;z-index:-1;opacity:0}
.obf.r2 .obfray,.obf.r3 .obfray,.obf.r4 .obfray{opacity:.6;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.85) 0 10deg,transparent 10deg 30deg);animation:obspin 9s linear infinite}
@keyframes obspin{to{transform:rotate(360deg)}}
.obfi{width:86px;height:86px;display:flex;align-items:center;justify-content:center}
.obfi svg{width:100%;height:100%;filter:drop-shadow(0 3px 0 rgba(74,53,40,.18))}
.obfx{position:absolute;right:6px;bottom:6px;background:var(--ink);color:#fff;border-radius:999px;padding:0 7px;font:800 11px/18px var(--display)}
.obf h2{margin:2px 0 0}
.obfrar{display:inline-flex;align-items:center;gap:6px;background:var(--rc);color:#fff;border-radius:999px;padding:2px 12px 1px;font:800 14px/22px var(--display);letter-spacing:.04em;text-transform:uppercase;text-shadow:0 1px 0 rgba(0,0,0,.25);box-shadow:inset 0 -3px 0 rgba(0,0,0,.15)}
.obfrar i{font-style:normal;font-size:11px;letter-spacing:-1px}
.obf.r0 .obfrar{background:#9a95a3}
.obf.r4 .obfrar{background:linear-gradient(90deg,#d99a25,#f2c14e,#d99a25);color:#5b3a00;text-shadow:0 1px 0 rgba(255,255,255,.5)}
.obfk{font:700 13px var(--display);color:var(--ink2)}
.obst{margin:0 4px}
.obrare{display:flex;gap:9px;align-items:flex-start;width:100%;text-align:left;background:color-mix(in srgb,var(--rc) 10%,#fff);border:2px solid var(--rc);border-radius:14px;padding:8px 10px}
.obrs{flex:none;color:var(--rc);font-size:13px;letter-spacing:-1px;margin-top:1px;writing-mode:vertical-rl;text-orientation:upright;line-height:1}
.obrare>div{display:flex;flex-direction:column;gap:4px;min-width:0}
.obrare b{font:800 14.5px/1.15 var(--display)}
.obrare p{margin:0;font:600 13px/1.4 var(--body)}
.obrare .obwhy{font-size:12.5px}
.obsec{width:100%;display:flex;flex-direction:column;gap:6px;text-align:left}
.obsec h3{margin:4px 0 0;font:800 13px var(--display);color:var(--ink);letter-spacing:.08em;text-transform:uppercase}
.obrows{display:flex;flex-direction:column;gap:6px}
.obrow{display:flex;align-items:center;gap:9px;width:100%;padding:7px 8px;background:#fff;border:2px solid color-mix(in srgb,var(--uc) 40%,#fff);border-radius:14px;color:var(--ink);text-align:left;font:inherit}
button.obrow{cursor:pointer;box-shadow:0 2px 0 color-mix(in srgb,var(--uc) 45%,#fff)}
button.obrow:active{transform:translateY(2px);box-shadow:none}
.obrow.now,.obrow.ready{border-color:var(--uc);background:var(--ub)}
.obri{flex:none;width:32px;height:32px;border-radius:50%;background:var(--ub);border:2px solid var(--uc);display:flex;align-items:center;justify-content:center}
.obri .obic{width:20px;height:20px;color:var(--ink)}
.obrt{flex:1;min-width:0;display:flex;flex-direction:column}
.obrt b{font:800 14px/1.2 var(--display);overflow-wrap:anywhere}
.obrt small{font:600 12px/1.25 var(--body);color:var(--ink2)}
.obra{flex:none;max-width:44%;background:var(--uc);color:#fff;border-radius:11px;padding:7px 10px 6px;font:800 13px/1.1 var(--display);text-align:center;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2)}
.obextra{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px}
.obval{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 10px;width:100%;background:#fff8e0;border:2px solid #ecd28a;border-radius:14px;padding:6px 10px}
.obvl{font:700 13px var(--display);color:#8a6a1a}
.obval>b{font:800 18px var(--display)}
.obval .rgval{width:100%}
.obff{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;width:100%}
/* retour de voyage */
.hcard.obh .obu{align-self:stretch}
.hcard.r2.obh{box-shadow:0 3px 0 var(--rc),0 0 0 3px rgba(79,136,207,.18)}
.hcard.obnew{box-shadow:0 3px 0 var(--rc),0 0 0 3px rgba(240,138,166,.35)}
.obspark{position:absolute;inset:0;pointer-events:none;z-index:3}
.obspark i{position:absolute;width:9px;height:9px;background:#f6c445;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);opacity:0;animation:obtw 1.6s ease-in-out infinite;animation-delay:calc(var(--d,0s) + .5s)}
.obspark i:nth-child(1){left:12%;top:22%}.obspark i:nth-child(2){right:12%;top:14%;animation-delay:calc(var(--d,0s) + .9s);background:#f08aa6}.obspark i:nth-child(3){left:20%;top:52%;animation-delay:calc(var(--d,0s) + 1.3s);background:#9fd1d8}.obspark i:nth-child(4){right:16%;top:46%;animation-delay:calc(var(--d,0s) + 1.1s)}
@keyframes obtw{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.15) rotate(30deg)}}
.obsum{width:100%;display:flex;flex-direction:column;gap:6px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:8px 10px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.obsum>b{font:800 14px var(--display)}
.obsp{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 5px}
.obsp>span{display:inline-flex;align-items:center;gap:4px;background:var(--ub);color:var(--uc);border-radius:999px;padding:2px 9px 2px 4px;font:800 12.5px/18px var(--display)}
.obsp .obic{width:16px;height:16px;color:var(--ink)}
.obsep{display:none}
.obsa{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
/* carte après fabrication */
#obCraft{position:absolute;z-index:30;left:12px;right:12px;margin:0 auto;bottom:calc(92px + env(safe-area-inset-bottom,0px));max-width:400px;display:flex;align-items:center;gap:10px;padding:9px 10px 9px 9px;background:var(--paper);border:3px solid var(--rc);border-radius:20px;box-shadow:0 5px 0 rgba(74,53,40,.4);overflow:hidden;isolation:isolate}
#obCraft.r0{border-color:#9a95a3}
#obCraft.in{animation:obCin .45s cubic-bezier(.2,1.4,.4,1) both}
#obCraft.out{animation:obCout .25s ease-in both}
@keyframes obCin{from{opacity:0;transform:translateY(30px) scale(.9)}to{opacity:1;transform:none}}
@keyframes obCout{to{opacity:0;transform:translateY(20px)}}
.obci{flex:none;width:58px;height:58px;border-radius:16px;border:2.5px solid var(--rc);background:radial-gradient(circle at 50% 40%,#fff 0,color-mix(in srgb,var(--rc) 20%,#fff) 100%);display:flex;align-items:center;justify-content:center}
.obci svg{width:44px;height:44px}
.obct{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;text-align:left}
.obck{font:800 10.5px var(--display);letter-spacing:.06em;text-transform:uppercase;color:var(--teal)}
.obct b{font:800 15px/1.15 var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.obcr{font:800 10.5px var(--display);color:var(--rc);text-transform:uppercase;letter-spacing:.04em}
#obCraft.r0 .obcr{color:#8b8593}
.obcb{flex:none;display:flex;flex-direction:column;gap:5px;align-items:stretch}
.obcl{background:none;border:0;font:700 12.5px var(--display);color:var(--ink2);text-decoration:underline;cursor:pointer;padding:2px}
.obcx{position:absolute;top:2px;right:6px;background:none;border:0;font:800 18px/1 var(--display);color:var(--ink2);cursor:pointer;padding:2px 4px;z-index:3}
@media (min-width:901px){#obCraft{left:16px;right:auto;width:400px;bottom:calc(24px + env(safe-area-inset-bottom,0px))}}
@media (max-width:900px){body:not(.sheet-open) #obCraft{bottom:calc(176px + env(safe-area-inset-bottom,0px))}}
/* repère quand une action ouvre un autre écran */
.obflash{animation:obfl 1.2s ease-in-out 2!important;position:relative;z-index:1}
@keyframes obfl{0%,100%{box-shadow:0 0 0 0 rgba(246,196,69,0)}50%{box-shadow:0 0 0 5px rgba(246,196,69,.95),0 0 18px 6px rgba(246,196,69,.6)}}
@media (max-width:420px){.obgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.obfil button{font-size:12px}.obc{padding:6px 6px 7px}.obu{font-size:12px}}
@media (prefers-reduced-motion:reduce){.obc,.obc::after,.obc .obi svg,.obfray,.obspark i,.oblr::after,#obCraft.in,.obdot,.obf .obfh::after,#obCraft::after{animation:none!important}}
`;
  document.head.appendChild(st);
})();

// ---------- outils de test ----------
window.__objets = {
  info: it => obInfo(it), groups: () => obGroupInv(), go: obGo, craftCard: obCraftCard,
  ctx: () => ({ S, GAME, RECIPES, ING, LOOT, makeItem, value, openSheet, openFiche, renderAll, craft, canCraft,
    RG_RES: typeof RG_RES !== 'undefined' ? RG_RES : null, bqState: typeof bqState === 'function' ? bqState : null,
    curDream: typeof curDream === 'function' ? curDream : null, showHaul, collect }),
};

// ---- Butin : toucher un objet ouvre sa fiche, avec un bouton pour revenir au butin
(function () {
  let haulSave = null;
  document.addEventListener('click', ev => {
    const back = ev.target.closest('[data-hback]');
    if (back && haulSave) { ev.stopPropagation(); ev.preventDefault(); const m = $('modal'); m.querySelector('.mbox').innerHTML = haulSave; m.hidden = false; haulSave = null; return; }
    const card = ev.target.closest('.hcard[data-fiche]');
    if (!card) { if (!ev.target.closest('.fiche')) haulSave = null; return; }
    haulSave = $('modal').querySelector('.mbox').innerHTML;
    ev.stopPropagation(); ev.preventDefault();
    openFiche(card.dataset.fiche);
    const f = $('modal').querySelector('.fiche');
    if (f) f.insertAdjacentHTML('afterbegin', '<button class="btn sm obhback" data-hback="1">← Retour au butin</button>');
  }, true);
  document.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('.hcard[data-fiche]')) { ev.preventDefault(); ev.target.click(); } });
  const st = document.createElement('style');
  st.textContent = '.hcard[data-fiche]{cursor:pointer}.hcard[data-fiche]:active{transform:scale(.97)}.obhback{align-self:flex-start;margin-bottom:6px}';
  document.head.appendChild(st);
})();

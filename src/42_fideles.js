// ================= CLIENTS FIDÈLES : DE VRAIS AVANTAGES (v29) =================
// Le joueur : « Dans Clients, ça n'apporte rien. Il faut montrer que tel client va nous donner tel avantage. »
// - chaque client (BQ_CLIENTS) a 2 avantages UNIQUES liés à son personnage, débloqués à 1 ❤ puis à 3 ❤ (CF_PERKS) ;
//   les cœurs sont ceux de 33_boutique.js (S.shop.v2.fid[id] = { h: points, g: cœurs }) ;
// - les avantages s'appliquent vraiment : cmDur et cmDefiP (37_commerce.js) appellent cfDurMul et cfDefiAdd ;
//   cmSell, cmStart, cmComptoir et cmPaint sont enveloppés ; cadeaux du jour et de la semaine donnés à l'ouverture du comptoir ;
// - les pierres d'étoile et objets rares des anciennes commandes spéciales : une vente à un client fidèle (1 ❤ et plus)
//   peut rapporter un petit cadeau (pierre d'étoile ou objet rare) ;
// - ses produits préférés (ingrédients qu'il aime) comptent double pour l'amitié ;
// - onglet Clients du comptoir : une carte par client (visage, cœurs, avantage actuel, prochain avantage, comment gagner ses cœurs) ;
// - recette impossible : au toucher (recette ou ingrédient manquant), un encadré DANS la page montre ce qui manque,
//   « Vous en avez 0/2 », les lieux les plus proches avec leur distance, « Y aller » et, s'il existe, l'achat au magasin ou au marché.
// État ajouté (anciennes sauvegardes : absent = rien de débloqué) : fid[id].pk (avantages uniques déjà donnés),
// fid[id].dd (dernier cadeau du jour), fid[id].wk (dernier cadeau de la semaine), fid[id].sn (avantages déjà vus).
// Expose window.__cf (tests).

// [cœurs, icône, texte, effet]
// effets : prep (−p du temps, recettes avec keys, toutes si absent), pay3 (+p sur ses achats 3★), pay (+p sur tous ses achats),
// tip (+n pièces par achat), rep (+n réputation par achat), repAll (+n réputation à chaque vente, tous clients), defi (+p chance du défi rapide),
// star2 (produits avec keys : 2★ d'office), gift (chance p d'un cadeau rare à chaque achat), day (n objets par jour), coins (n pièces par jour),
// week (pierres, matériel, objet rare ou ingrédient lointain chaque semaine), once (recette exclusive, lieu secret, matériel : une fois).
const CF_PERKS = {
  noisette: [[1, '🌰', '−20 % de temps de préparation sur les recettes aux fruits et fruits secs', { k: 'prep', keys: ['fruit', 'graine', 'pomme'], p: 0.2 }],
    [3, '🌰', '−35 % de temps de préparation sur les recettes aux fruits et fruits secs', { k: 'prep', keys: ['fruit', 'graine', 'pomme'], p: 0.35 }]],
  leonie: [[1, '📣', '+3 réputation à chacun de ses achats : tout le monde l’écoute', { k: 'rep', n: 3 }],
    [3, '📜', 'Vous offre une recette exclusive de votre commerce', { k: 'once', what: 'rec' }]],
  moustache: [[1, '🪙', 'Pourboire élégant : +8 pièces à chacun de ses achats', { k: 'tip', n: 8 }],
    [3, '🗺️', 'Vous indique un lieu secret sur la carte', { k: 'once', what: 'secret' }]],
  pompon: [[1, '🌱', '1 graine rare pour le jardin chaque jour', { k: 'day', what: 'seed', n: 1 }],
    [3, '🌱', '2 graines rares pour le jardin chaque jour', { k: 'day', what: 'seed', n: 2 }]],
  roussette: [[1, '⭐', 'Paie +15 % les produits 3★', { k: 'pay3', p: 0.15 }],
    [3, '⭐', 'Paie +30 % les produits 3★', { k: 'pay3', p: 0.3 }]],
  pingo: [[1, '💎', '1 pierre d’étoile chaque semaine', { k: 'week', what: 'stones', n: 1 }],
    [3, '💎', '2 pierres d’étoile chaque semaine', { k: 'week', what: 'stones', n: 2 }]],
  gaston: [[1, '🧰', 'Vous offre une gourde d’expédition (matériel de base)', { k: 'once', what: 'gear', g: 'gourde' }],
    [3, '🧰', '1 matériel d’expédition de base chaque semaine', { k: 'week', what: 'gear', n: 1 }]],
  ondine: [[1, '🐚', '1 coquillage chaque jour', { k: 'day', what: 'ing', ing: 'coquillage', n: 1 }],
    [3, '🐚', '2 coquillages chaque jour', { k: 'day', what: 'ing', ing: 'coquillage', n: 2 }]],
  hulotte: [[1, '🦉', 'Défi rapide 10 % plus souvent (plus d’étoiles)', { k: 'defi', p: 0.1 }],
    [3, '🦉', 'Défi rapide 20 % plus souvent (plus d’étoiles)', { k: 'defi', p: 0.2 }]],
  bruno: [[1, '🍯', '1 douceur sucrée chaque jour', { k: 'day', what: 'ing', ing: 'sucre', n: 1 }],
    [3, '🍯', '2 douceurs sucrées chaque jour', { k: 'day', what: 'ing', ing: 'sucre', n: 2 }]],
  mimi: [[1, '🧀', 'Les produits au fromage sortent à 2★', { k: 'star2', keys: ['fromage'] }],
    [3, '🧀', 'Les produits au fromage, aux graines ou à la farine sortent à 2★', { k: 'star2', keys: ['fromage', 'graine', 'farine'] }]],
  filou: [[1, '🎁', '1 chance sur 3 de recevoir un objet rare à chacun de ses achats', { k: 'gift', p: 0.33 }],
    [3, '🎁', '3 chances sur 5 de recevoir un objet rare à chacun de ses achats', { k: 'gift', p: 0.6 }]],
  chips: [[1, '⚡', 'Vous donne un coup de main : −10 % de temps sur toutes les recettes', { k: 'prep', p: 0.1 }],
    [3, '⚡', 'Vous donne un coup de main : −20 % de temps sur toutes les recettes', { k: 'prep', p: 0.2 }]],
  capucine: [[1, '💬', 'Bavarde : +1 réputation à CHAQUE vente, tous clients confondus', { k: 'repAll', n: 1 }],
    [3, '💬', 'Bavarde : +2 réputation à CHAQUE vente, tous clients confondus', { k: 'repAll', n: 2 }]],
  rainette: [[1, '🌸', '1 fleur ou feuille chaque jour', { k: 'day', what: 'ing', ing: 'feuille', n: 1 }],
    [3, '🌸', '2 fleurs ou feuilles chaque jour', { k: 'day', what: 'ing', ing: 'feuille', n: 2 }]],
  biscotte: [[1, '🦴', 'Paie +20 % tous ses achats', { k: 'pay', p: 0.2 }],
    [3, '🦴', 'Paie +40 % tous ses achats', { k: 'pay', p: 0.4 }]],
  frisette: [[1, '🧶', '1 laine chaque jour', { k: 'day', what: 'ing', ing: 'laine', n: 1 }],
    [3, '🧶', '2 laines chaque jour', { k: 'day', what: 'ing', ing: 'laine', n: 2 }]],
  clochette: [[1, '🍀', '1 objet rare chaque semaine (décoration, clé ou pierre précieuse)', { k: 'week', what: 'rare', tier: 'n', n: 1 }],
    [3, '🍀', '1 objet épique ou légendaire chaque semaine', { k: 'week', what: 'rare', tier: 'd', n: 1 }]],
  grignote: [[1, '💰', 'Partage ses économies : 20 pièces chaque jour', { k: 'coins', n: 20 }],
    [3, '💰', 'Partage ses économies : 50 pièces chaque jour', { k: 'coins', n: 50 }]],
  eucalypso: [[1, '🌍', '1 ingrédient venu de loin chaque semaine', { k: 'week', what: 'far', n: 1 }],
    [3, '🌍', '1 ingrédient venu de loin chaque jour', { k: 'day', what: 'far', n: 1 }]],
};
const cfCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const cfWeek = () => Math.floor((Date.now() / 864e5 + 3) / 7);
const CF_SEEDS = [['Graine de tournesol géant', '#e9b949'], ['Graine d’edelweiss', '#e8eef2'], ['Graine de lotus bleu', '#6f9fd8'], ['Graine de pivoine rare', '#f08aa6']];
function cfFid(id) { const f = b2Fid(id); if (!Array.isArray(f.pk)) f.pk = []; return f; }
const cfLvl = id => cfCall(() => (b2().fid[id] ? b2().fid[id].g || 0 : 0), 0);
// avantages actifs d'un client (même genre : seul le plus fort compte)
function cfActive(id) {
  const P = CF_PERKS[id], g = cfLvl(id); if (!P || !g) return [];
  const out = {}; P.forEach(([h, , , e], i) => { if (g >= h) out[e.k === 'once' ? 'once' + i : e.k + (e.what || '')] = e; });
  return Object.values(out);
}
const cfAllActive = k => { const out = []; for (const c of BQ_CLIENTS) for (const e of cfActive(c.id)) if (e.k === k) out.push(e); return out; };
const cfHasKey = (R, keys) => !keys || R.ing.some(([k]) => keys.includes(k));
// branchés dans 37_commerce.js
function cfDurMul(R) { return cfCall(() => cfAllActive('prep').reduce((m, e) => (cfHasKey(R, e.keys) ? m * (1 - e.p) : m), 1), 1); }
function cfDefiAdd() { return cfCall(() => cfAllActive('defi').reduce((a, e) => a + e.p, 0), 0); }

// ---------------- cadeaux ----------------
function cfMk(def, from, extra) { const it = makeItem(def, 0, from, [], { fixed: def[3] || 0 }); if (extra) Object.assign(it, extra); S.inv.push(it); S.dex[it.name] = true; return it; }
function cfIngItem(k, from) { const s = bqSampleIng(k); return cfMk([s.name, s.cat === 'n' ? 'n' : 'm', s.sub, s.rarity || 0, s.look || null, s.color || null], from); }
function cfFarItem(from) { const x = cmFarRes(); if (!x) return null; const it = cfMk([x.name, x.cat, x.sub, x.rar || 0, null, x.color || null], from); it.rid = x.id; return it; }
function cfGive(c, e, n) {
  const from = `Cadeau de ${c.name}`; let txt = '';
  if (e.what === 'seed') { for (let i = 0; i < n; i++) { const [nm, col] = CF_SEEDS[Math.floor(Math.random() * CF_SEEDS.length)]; cfMk([nm, 'm', 'graine', 2, null, col], from); } txt = `${n} graine${n > 1 ? 's' : ''} rare${n > 1 ? 's' : ''}`; }
  else if (e.what === 'ing') { let last = null; for (let i = 0; i < n; i++) last = cfIngItem(e.ing, from); txt = n > 1 ? `${n} × ${cmIngName(e.ing).toLowerCase()}` : `« ${last.name} »`; }
  else if (e.what === 'far') { const it = cfFarItem(from); txt = it ? `« ${it.name} » (venu de loin)` : ''; }
  else if (e.what === 'stones') { const s = gainStones(n); txt = s ? stonesWord(s) : ''; }
  else if (e.what === 'gear' && typeof xpGearDef === 'function') { const g = e.g || XP_GEAR.filter(x => x[0] !== 'lampe')[Math.floor(Math.random() * 5)][0]; const it = cfMk(xpGearDef(g, 1), from); txt = `« ${it.name} »`; }
  else if (e.what === 'rare') { const r = cmRareItem(e.tier || 'n'); if (r) { const it = cfMk(r.def, from); txt = `« ${it.name} »`; } }
  return txt;
}
// cadeaux du jour, de la semaine et avantages uniques (une fois) : donnés à l'ouverture du comptoir et après une vente
function cfPayouts(quiet) {
  const dk = dayKey(), wk = cfWeek(), got = [];
  for (const c of BQ_CLIENTS) {
    const P = CF_PERKS[c.id], g = cfLvl(c.id); if (!P || !g) continue;
    const f = cfFid(c.id), parts = [];
    P.forEach(([h, , , e]) => {
      if (g < h || e.k !== 'once' || f.pk.includes(h)) return;
      if (e.what === 'rec') {
        const T = cmT(); if (!T) return; const st = cmState(), R = (CM_LINES[T.id] || []).find(x => x.x && !st.unl.includes(x.id));
        if (R) { st.unl.push(R.id); parts.push(`la recette exclusive « ${R.def[0]} »`); } else { gainCoins(300); parts.push('300 pièces (vous avez déjà toutes les recettes exclusives)'); }
      } else if (e.what === 'secret') {
        const h0 = bqHome(), r = typeof tzGiveRumor === 'function' ? tzGiveRumor(null, c.name, h0 ? { lon: h0.anchor[0], lat: h0.anchor[1] } : null) : null;
        if (r) { parts.push('un lieu secret (regardez la carte)'); setTimeout(() => { try { tzRumorToast(c.name + ' vous indique un lieu secret', r); } catch (er) {} }, 1800); } else { gainCoins(150); parts.push('150 pièces'); }
      } else if (e.what === 'gear') { const t = cfGive(c, e, 1); if (t) parts.push(t); }
      f.pk.push(h);
    });
    for (const e of cfActive(c.id)) {
      if ((e.k === 'day' || e.k === 'coins') && f.dd !== dk) {
        if (e.k === 'coins') { gainCoins(e.n); parts.push(`${e.n} pièces`); } else { const t = cfGive(c, e, e.n); if (t) parts.push(t); }
      }
      if (e.k === 'week' && f.wk !== wk) { const t = cfGive(c, e, e.n); if (t) parts.push(t); }
    }
    if (cfActive(c.id).some(e => e.k === 'day' || e.k === 'coins')) f.dd = dk;
    if (cfActive(c.id).some(e => e.k === 'week')) f.wk = wk;
    if (parts.length) got.push(`${c.name} : ${parts.join(', ')}`);
  }
  if (got.length) { save(); try { renderTop(); } catch (e) {} if (!quiet) setTimeout(() => toast(`Cadeaux de vos fidèles — ${got.join(' · ')}`), 700); }
  return got;
}

// ---------------- la vente : avantages appliqués ----------------
let cfLast = null;
function cfOnSale(b, it) {
  const c = BQC(b.cid), T = BQS(b.shop), R = CM_R[it.mk.rid]; if (!c || !R) return;
  const s = bqState(), p = it.mk.p, parts = []; let extra = 0, rep = 0;
  for (const e of cfActive(c.id)) {
    if (e.k === 'tip') { extra += e.n; parts.push(`pourboire +${e.n}`); }
    if (e.k === 'pay3' && it.mk.st >= 3) { const x = Math.round(p * e.p); extra += x; parts.push(`produit 3★ +${x}`); }
    if (e.k === 'pay') { const x = Math.round(p * e.p); extra += x; parts.push(`+${x} pièces`); }
    if (e.k === 'rep') rep += e.n;
  }
  for (const e of cfAllActive('repAll')) rep += e.n;
  if (T && T.id === 'epicerie' && R.ing.some(([k]) => k === 'far')) { const x = Math.round(p * 0.25); extra += x; parts.push(`venu de loin +${x}`); }
  // amitié : produit préféré (ingrédient aimé) et brocante = un point de plus
  const liked = R.ing.some(([k]) => (c.likes || []).includes(k));
  if (liked) cfCall(() => b2Heart(c.id, 1), 0);
  if (T && T.id === 'brocante') cfCall(() => b2Heart(c.id, 1), 0);
  // petit cadeau d'un client fidèle (remplace les récompenses des commandes spéciales)
  const g = cfLvl(c.id); let gift = '';
  if (g >= 1) {
    let ch = (g >= 3 ? 0.2 : 0.12) * (T && T.id === 'librairie' ? 2 : 1); const ge = cfActive(c.id).find(e => e.k === 'gift'); if (ge) ch = Math.max(ch, ge.p);
    if (Math.random() < ch) {
      if (!ge && Math.random() < 0.5) { const n = gainStones(1); /* v33 : modeste */ if (n) gift = stonesWord(n); }
      else { const r = cmRareItem(g >= 3 || ge ? 'n' : 'f'); if (r) gift = `« ${cfMk(r.def, `Cadeau de ${c.name}`).name} »`; }
    }
  }
  if (extra) { gainCoins(extra); s.earned += extra; }
  if (rep) { s.rep += rep; const lv0 = s.lvl; s.lvl = bqLevelOf(s.rep); if (s.lvl > lv0) cfCall(() => bqLevelUp(s.lvl), 0); }
  cfLast = { cid: c.id, base: p, extra, rep, gift, liked };
  cfPayouts(true);
  save();
  const msg = [extra || rep ? `${parts.join(', ')}${rep ? `${parts.length ? ', ' : ''}+${rep} réputation` : ''}` : '', gift ? `cadeau : ${gift}` : '', liked ? 'son produit préféré : amitié ×2' : ''].filter(Boolean).join(' · ');
  if (msg) setTimeout(() => toast(`${c.name} — ${msg}`), 1300);
  cfCall(() => renderTop(), 0);
}
if (typeof cmSell === 'function') cmSell = (orig => function (bid) {
  const c = cmState(), b = c.buy.find(x => x.id === bid);
  const it = b ? cmProducts(b.shop).filter(x => x.mk.rid === b.rid).sort((a, z) => z.mk.st - a.mk.st)[0] : null;
  const r = orig.apply(this, arguments);
  try { if (b && it && !S.inv.includes(it) && !cmState().buy.includes(b)) { cfOnSale(b, it); if (cmOnComptoir()) { const t = $('czTabs'); if (t) t.innerHTML = czTabsHTML(); } } } catch (e) { console.error('fidèles vente', e); }
  return r;
})(cmSell);
// produits « 2★ d'office » (Mimi)
if (typeof cmStart === 'function') cmStart = (orig => function (rid) {
  const before = cfCall(() => cmState().sl.map(x => x), []);
  const r = orig.apply(this, arguments);
  try {
    const R = CM_R[rid], keys = new Set(); cfAllActive('star2').forEach(e => e.keys.forEach(k => keys.add(k)));
    if (R && keys.size && R.ing.some(([k]) => keys.has(k))) cmState().sl.forEach((x, i) => { if (x && !before[i] && x.rid === rid && x.st < 2) { x.st = 2; save(); } });
  } catch (e) {}
  return r;
})(cmStart);
if (typeof cmComptoir === 'function') { const o = cmComptoir; cmComptoir = function (box) { cfCall(() => cfPayouts(), 0); return o.apply(this, arguments); }; if (typeof renderComptoir === 'function') renderComptoir = cmComptoir; }

// ---------------- onglet Clients ----------------
const CF_HEART = '<svg viewBox="0 0 20 18" aria-hidden="true"><path d="M10 17 C3 11.5 1 8.6 1 5.6 A4.4 4.4 0 0 1 10 3.6 A4.4 4.4 0 0 1 19 5.6 C19 8.6 17 11.5 10 17Z"/></svg>';
function cfNewPerks() { let n = 0; for (const c of BQ_CLIENTS) { const P = CF_PERKS[c.id], g = cfLvl(c.id); if (!P || !g) continue; const f = b2().fid[c.id]; n += P.filter(([h]) => g >= h).length > ((f && f.sn) || 0) ? 1 : 0; } return n; }
function cfCardHTML(c) {
  const P = CF_PERKS[c.id] || [], f = b2().fid[c.id] || { h: 0, g: 0 }, g = f.g || 0, nx = B2_HEART[g], prev = g ? B2_HEART[g - 1] : 0;
  const pc = nx ? Math.round(Math.max(0, Math.min(1, (f.h - prev) / (nx - prev))) * 100) : 100, left = nx ? nx - f.h : 0;
  const hearts = Array.from({ length: 4 }, (_, i) => `<i class="${i < g ? 'on' : ''}">${CF_HEART}</i>`).join('');
  const now = P.filter(([h]) => g >= h), next = P.find(([h]) => g < h);
  const cur = now.length ? now.slice(P[1] && now.length > 1 && P[0][3].k === P[1][3].k ? -1 : 0).map(([h, ic, t, e]) => `<div class="cf-now"><span class="cf-ic">${ic}</span><span><em>Avantage actuel</em>${esc(t)}${e.k === 'once' ? ' <b class="cf-done">✔ reçu</b>' : ''}</span></div>`).join('')
    : `<div class="cf-now off"><span class="cf-ic">${P[0] ? P[0][1] : '❤'}</span><span><em>Pas encore d’avantage</em>À 1 ❤ : ${esc(P[0] ? P[0][2] : '')}</span></div>`;
  const nxt = now.length && next ? `<div class="cf-next">À ${next[0]} ${CF_HEART} : <b>${esc(next[2])}</b></div>` : !next && now.length ? '<div class="cf-next">Tous ses avantages sont débloqués.</div>' : P[1] ? `<div class="cf-next">Puis à ${P[1][0]} ${CF_HEART} : <b>${esc(P[1][2])}</b></div>` : '';
  const T = cmT(), fav = T ? (CM_LINES[T.id] || []).filter(R => !R.egg && R.ing.some(([k]) => (c.likes || []).includes(k))) : [];
  const how = fav.length ? `Vendez-lui ses produits préférés (amitié ×2) : <span class="cf-fav">${fav.slice(0, 4).map(R => `<i title="${esc(R.def[0])}">${cmIcon(R, 'cff' + c.id + R.id)}</i>`).join('')}</span>`
    : `Vendez-lui vos produits. Ses goûts : ${(c.likes || []).map(k => esc(cmIngName(k).toLowerCase())).join(', ')}.`;
  return `<article class="cf-card${g ? ' fid' : ''}" data-cfcli="${c.id}"><img class="cf-face" src="${cfCall(() => czURI(c, g ? 'joie' : 'content'), '')}" alt=""><div class="cf-main">
    <div class="cf-top"><b>${esc(c.name)}</b><small>${esc(c.label || '')}</small><span class="cf-hs" aria-label="${g} cœur${g > 1 ? 's' : ''} sur 4">${hearts}</span></div>
    <div class="cf-bar"><i style="width:${pc}%"></i></div><small class="cf-to">${nx ? `Encore ${left} point${left > 1 ? 's' : ''} d’amitié pour le prochain cœur (1 vente = 1 point)` : 'Amitié au maximum !'}</small>
    ${cur}${nxt}<div class="cf-how">${how}</div></div></article>`;
}
function cfClientsHTML() {
  const T = cmT(), v = b2(), ids = new Set((T && BQ_SHOP_CLIENTS[T.id]) || []);
  Object.entries(v.fid).forEach(([id, f]) => { if (f && f.h > 0 && BQC(id)) ids.add(id); });
  const list = [...ids].map(id => BQC(id)).filter(Boolean).sort((a, b) => ((v.fid[b.id] || {}).h || 0) - ((v.fid[a.id] || {}).h || 0));
  // les avantages affichés sont « vus » (pastille de l'onglet)
  list.forEach(c => { const f = v.fid[c.id], P = CF_PERKS[c.id]; if (f && P) f.sn = P.filter(([h]) => (f.g || 0) >= h).length; });
  return `<section class="cf-list" id="b2fid"><h3 class="cz-h">${CZ_IC.cli}<span>Vos clients et leurs avantages</span></h3>
    <p class="cf-intro">Chaque client a <b>son avantage</b>, débloqué par ses cœurs. Une vente = 1 point d’amitié (2 pour son produit préféré). Les fidèles offrent parfois une <b>pierre d’étoile</b> ou un <b>objet rare</b>.</p>
    ${list.map(cfCardHTML).join('')}</section>`;
}

// ---------------- recette impossible : ce qui manque, où le trouver ----------------
let cfOpen = null, CF_GO = [];
const cfScore = (c, subs) => { const l = LOOT[c] || []; const tot = l.reduce((a, d) => a + 1 / (1 + d[3] * 1.6), 0); return l.filter(d => (d[1] === 'm' || d[1] === 'n') && subs.includes(d[2])).reduce((a, d) => a + 1 / (1 + d[3] * 1.6), 0) / (tot || 1); };
function cfLocs(k) {
  const h = homeObj(), out = [];
  if (k === 'far') {
    const R0 = cfCall(() => regionAt(h.lon, h.lat), null);
    REGIONS.filter(R => R.anchor && R.res && R.res.length && R.id !== (R0 && R0.id) && R.id !== 'grand_large').map(R => ({ R, d: kmBetween(h, { lon: R.anchor[0], lat: R.anchor[1] }) })).sort((a, b) => a.d - b.d).slice(0, 3)
      .forEach(({ R, d }) => out.push({ label: R.short || R.name, sub: 'Spécialités de la région', km: d, step: { region: R.id } }));
    return out;
  }
  const subs = ING[k] ? ING[k][0] : [], T = cmT();
  const cats = [...new Set([...((T && T.cats) || []), ...BQ_NEAR_CATS])].filter(c => cfCall(() => bqPoiOK(c), !!LOOT[c])).map(c => ({ c, s: cfScore(c, subs) })).filter(x => x.s >= 0.12).sort((a, b) => b.s - a.s).slice(0, 6);
  const seen = new Set();
  for (const { c } of cats) {
    const step = { t: 'visit', cat: [c] }, L = qtLoc(step); if (!L || seen.has(L.label)) continue; seen.add(L.label);
    out.push({ label: L.label, sub: POI_CATS[c] ? POI_CATS[c][0] : c, km: qtKm(L), step });
  }
  out.sort((a, b) => a.km - b.km);
  // moins de 3 lieux chargés autour de la maison : on complète avec les pistes de « Où le trouver » (30_butin.js)
  if (out.length < 3) {
    const nm = cfCall(() => bqSampleIng(k).name, ''), have = new Set(out.map(o => JSON.stringify(o.step)));
    cfCall(() => btSources(nm), []).filter(s => (s.go === 'Y aller' || s.go === 'Voir sur la carte') && !have.has(JSON.stringify(s.step))).slice(0, 3 - out.length)
      .forEach(s => { const L = s.step && !s.step.fn ? qtLoc(s.step) : null; out.push({ label: L ? L.label : s.txt, sub: L ? s.txt : 'Où le trouver', km: L ? qtKm(L) : null, step: s.step }); });
    if (!out.length && cats[0]) out.push({ label: POI_CATS[cats[0].c] ? POI_CATS[cats[0].c][0] : cats[0].c, sub: 'Le plus proche de chez vous', km: null, step: { t: 'visit', cat: [cats[0].c] } });
  }
  return out.slice(0, 3);
}
// un raccourci d'achat : magasin de la boutique (articles du jour) ou marché mondial ; le moins cher
function cfShop(k) {
  const subs = ING[k] ? ING[k][0] : [], ok = it => !!it && !it.mk && (k === 'far' ? cmIsFar(it) && it.cat !== 'v' : subs.includes(it.sub) && (it.cat === 'm' || it.cat === 'n'));
  let best = null; const cand = o => { if (!best || o.price < best.price) best = o; };
  try { bqStock().forEach(x => { if (x.sold || x.locked) return; const a = bqStockArticle(x); if (!a) return; const art = bqArticle(a); if (art && !art.egg && !art.rec && ok(art.it)) cand({ kind: 'shop', key: x.key, price: art.price, name: art.it.name, where: 'au magasin' }); }); } catch (e) {}
  try { mkState().list.forEach(l => { if (l && l.kind === 'item' && ok(l.data)) cand({ kind: 'mk', key: l.id, price: l.price, name: l.data.name, where: 'au marché' }); }); } catch (e) {}
  return best;
}
function cfMissHTML(rid, only) {
  const R = CM_R[rid]; if (!R) return '';
  const miss = R.ing.filter(([k, n]) => cmHave(k) < n && (!only || k === only));
  if (!miss.length) return '';
  if (CF_GO.length > 200) CF_GO = [];
  const rows = miss.map(([k, n]) => {
    const h = cmHave(k), locs = cfLocs(k), buy = cfShop(k), nm = cmIngName(k);
    const lr = locs.map(L => { const i = CF_GO.push({ step: L.step, name: nm, why: R.def[0] }) - 1; return `<div class="cf-loc"><span class="cf-pin">${typeof btIco === 'function' ? btIco(L.step.region ? 'reg' : 'lieu') : ''}</span><span class="cf-lx"><b>${esc(L.label)}</b><small>${esc(L.sub || '')}${L.km != null ? `${L.sub ? ' · ' : ''}${fmtDist(L.km)}` : ''}</small></span><button class="btn gold sm" data-cfgo="${i}">Y aller</button></div>`; }).join('');
    return `<div class="cf-mi"><div class="cf-mih"><span class="cf-ii">${cmIngIcon(k)}</span><span class="cf-mx"><b>${esc(nm)}</b><span>Vous en avez <b class="cf-cnt">${h}/${n}</b></span></span></div>
      ${lr ? `<div class="cf-locs"><small class="cf-lt">Où le trouver, au plus près :</small>${lr}</div>` : '<p class="cf-lt">En voyage : événements, marchands ambulants et marché mondial.</p>'}
      ${buy ? `<button class="btn cream sm cf-buy" data-cfbuy="${buy.kind}:${esc(buy.key)}">Acheter ${buy.where} (≈ ${buy.price} pièces)</button>` : ''}</div>`;
  }).join('');
  return `<div class="cf-miss" id="cfMiss" data-rid="${rid}"><div class="cf-mh"><b>Il manque pour « ${esc(R.def[0])} »</b><button class="cf-x" data-cfx="1" aria-label="Fermer">✕</button></div>${rows}</div>`;
}
function cfPlace() {
  const old = $('cfMiss'); if (old) old.remove();
  if (!cfOpen) return null;
  const card = document.querySelector(`#czBody [data-cfcard="${cfOpen.rid}"]`); if (!card) return null;
  const html = cfMissHTML(cfOpen.rid, cfOpen.k); if (!html) { cfOpen = null; return null; }
  card.insertAdjacentHTML('afterend', html); card.classList.add('cf-sel');
  return $('cfMiss');
}
function cfShowMiss(rid, k) {
  document.querySelectorAll('#czBody .cf-sel').forEach(e => e.classList.remove('cf-sel'));
  if (cfOpen && cfOpen.rid === rid && cfOpen.k === (k || null) && $('cfMiss')) { cfOpen = null; cfPlace(); return; }
  cfOpen = { rid, k: k || null };
  const box = cfPlace();
  if (box) try { box.scrollIntoView({ behavior: cfCall(() => czRM(), false) ? 'auto' : 'smooth', block: 'nearest' }); } catch (e) {}
}
// le comptoir se redessine (ventes, préparations) : l'encadré reste ouvert
if (typeof cmPaint === 'function') cmPaint = (orig => function () { const r = orig.apply(this, arguments); try { if (cfOpen && !$('cfMiss')) cfPlace(); } catch (e) {} return r; })(cmPaint);
if (typeof czPaintBody === 'function') czPaintBody = (orig => function () { const r = orig.apply(this, arguments); try { if (czTab !== 'prep') cfOpen = null; else if (cfOpen) cfPlace(); } catch (e) {} return r; })(czPaintBody);
// au toucher : recette impossible ou ingrédient manquant (avant cmStart, qui ne montrerait qu'un message)
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-cmprep],[data-cfing]'); if (!el || !el.closest('#czBody')) return;
  const rid = el.dataset.cmprep || el.dataset.cfr, R = CM_R[rid]; if (!R || !cfCall(() => cmUnlocked(R), false)) return;
  const k = el.dataset.cfing || null;
  if (k ? cmHave(k) >= (R.ing.find(x => x[0] === k) || [0, 0])[1] : cmCanIng(R)) return;
  ev.stopPropagation(); ev.preventDefault();
  cfShowMiss(rid, k);
}, true);
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-cfgo],[data-cfx],[data-cfbuy]'); if (!el) return;
  const d = el.dataset;
  if (d.cfx) { cfOpen = null; cfPlace(); document.querySelectorAll('#czBody .cf-sel').forEach(e => e.classList.remove('cf-sel')); return; }
  if (d.cfgo) { const g = CF_GO[+d.cfgo]; if (!g) return; cfOpen = null; qtGo({ step: g.step, name: g.name, why: g.why }); return; }
  if (d.cfbuy) {
    const i = d.cfbuy.indexOf(':'), kind = d.cfbuy.slice(0, i), key = d.cfbuy.slice(i + 1), v0 = bView;
    try { if (kind === 'shop') bqBuy(key, el); else mkBuy(key); } catch (e) { console.error('fidèles achat', e); }
    try { bView = v0; save(); renderTop(); cmPaint(true); } catch (e) {}
  }
});

// ---------------- textes : plus de commandes spéciales ----------------
try {
  BQ_SHOPS.forEach(T => { if (!Array.isArray(T.perks)) return; T.perks = T.perks.filter(p => !/commande/i.test(p)); if (CM_ADV[T.id] && !T.perks.includes(CM_ADV[T.id][1])) T.perks.push(CM_ADV[T.id][1]); });
  BQ_LEVELS.forEach(L => { if (Array.isArray(L.perks)) L.perks = L.perks.filter(p => !/commande/i.test(p)); });
} catch (e) {}
setTimeout(() => { try { if (S && !S.firstRun) cfPayouts(true); } catch (e) {} }, 1500);

try { if (window.__cm) { window.__cm.sell = cmSell; window.__cm.start = cmStart; } } catch (e) {} // les tests passent par les versions enveloppées
window.__cf = { PERKS: CF_PERKS, active: cfActive, dur: R => cmDur(typeof R === 'string' ? CM_R[R] : R), durMul: cfDurMul, defiAdd: cfDefiAdd, payouts: cfPayouts, last: () => cfLast,
  setHearts: (id, g) => { const f = cfFid(id); f.g = g; f.h = g ? B2_HEART[g - 1] : 0; save(); }, miss: cfMissHTML, locs: cfLocs, shop: cfShop,
  env: () => ({ tab, plan, bView, S }), clientsHTML: () => cfClientsHTML() };

(function cfCSS() {
  const st = document.createElement('style'); st.id = 'cfCSS';
  st.textContent = `
.cf-intro{margin:0 2px 10px;font:600 12.5px/1.35 var(--body);color:#6b5546}
.cf-card{display:flex;gap:10px;align-items:flex-start;background:#fffaf0;border:1.5px solid #dcc29c;border-radius:16px;box-shadow:0 3px 0 #ecdcbf;padding:9px;margin-bottom:9px}
.cf-card.fid{border-color:#e0a52a;background:#fff8e6}
.cf-face{width:56px;height:56px;flex:none;border-radius:50%;background:#f6ead6;border:2px solid #5b4636;object-fit:cover;object-position:top}
.cf-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.cf-top{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}.cf-top b{font:800 15px/1.1 var(--display)}.cf-top small{font:600 11.5px var(--body);opacity:.7}
.cf-hs{margin-left:auto;display:flex;gap:2px}.cf-hs i{width:16px;height:15px;display:block}.cf-hs svg{width:100%;height:100%;fill:#eadfcd;stroke:#b79c7c;stroke-width:1.3}.cf-hs i.on svg{fill:#e5487a;stroke:#9c2f52}
.cf-bar{height:6px;border-radius:4px;background:#eadfcd;overflow:hidden}.cf-bar i{display:block;height:100%;background:#e5487a}
.cf-to{font:600 11px var(--body);opacity:.7}
.cf-now{display:flex;gap:7px;align-items:center;background:#e9f7ee;border:1.5px solid #3a8f5a;border-radius:11px;padding:5px 7px;font:700 12.5px/1.25 var(--body)}
.cf-now.off{background:#f4efe6;border-color:#cbb89c;color:#7a6455}
.cf-now em{display:block;font:800 10.5px var(--display);font-style:normal;text-transform:uppercase;letter-spacing:.04em;color:#2f7f3a}.cf-now.off em{color:#9a8574}
.cf-ic{font-size:20px;line-height:1;flex:none}.cf-done{color:#2f7f3a;font-weight:800}
.cf-next{font:600 12px/1.3 var(--body);color:#7a5a20}.cf-next svg{width:12px;height:11px;fill:#e5487a;vertical-align:-1px}
.cf-how{font:600 11.5px/1.3 var(--body);color:#6b5546;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.cf-fav{display:inline-flex;gap:3px}.cf-fav i{width:24px;height:24px;display:inline-block;background:#fff;border:1.3px solid #dcc29c;border-radius:7px;padding:1px;box-sizing:border-box}.cf-fav svg{width:100%;height:100%}
.cm-r.cf-sel{outline:3px solid #e0a52a;outline-offset:1px}
.cm-ing[data-cfing]:not(.ok){cursor:pointer}
.cf-miss{grid-column:1/-1;background:#fff3d6;border:2.5px solid #5b4636;border-radius:16px;padding:8px 9px;text-align:left;box-shadow:0 3px 0 rgba(91,70,54,.25);animation:b2pop .25s ease-out}
.cf-mh{display:flex;align-items:center;gap:8px;margin-bottom:6px}.cf-mh b{flex:1;font:800 14px/1.2 var(--display)}
.cf-x{width:30px;height:30px;flex:none;border-radius:50%;border:2px solid #5b4636;background:#fffaf0;font:800 14px/1 system-ui;color:#5b4636;cursor:pointer}
.cf-mi{background:#fffaf0;border-radius:12px;padding:6px 7px;margin-bottom:6px;display:flex;flex-direction:column;gap:5px}
.cf-mih{display:flex;align-items:center;gap:9px}.cf-ii{width:44px;height:44px;flex:none;border:2px solid #d9604f;border-radius:12px;background:#fff;padding:3px;box-sizing:border-box}.cf-ii svg{width:100%;height:100%}
.cf-mx{display:flex;flex-direction:column;font:600 12.5px var(--body)}.cf-mx>b{font:800 14px var(--display)}.cf-cnt{color:#c0392b}
.cf-lt{font:700 11px var(--body);opacity:.75;margin:0}
.cf-locs{display:flex;flex-direction:column;gap:4px}
.cf-loc{display:flex;align-items:center;gap:7px;border:1.5px solid #e5d3b5;border-radius:10px;padding:4px 6px;background:#fff}
.cf-pin svg{width:22px;height:22px;display:block;color:#5b4636}.cf-lx{flex:1;min-width:0;display:flex;flex-direction:column;font:600 11.5px/1.25 var(--body)}.cf-lx b{font:800 13px/1.2 var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cf-buy{align-self:flex-start}
`;
  document.head.appendChild(st);
})();

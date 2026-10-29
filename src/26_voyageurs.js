// ================= VOYAGEURS DU MONDE (simulés) — v14 =================
// Demande du joueur : « voir en temps réel des joueurs qui envoient leur familier en expédition ».
// Pas encore de serveur : une population SIMULÉE, toujours présentée comme telle (badge « simulé » dans la fiche et dans le fil).
// - Déterministe selon l'heure : la même population et les mêmes voyages pour un même instant (sauf le petit groupe de voisins,
//   calculé autour de la maison du joueur). Pseudos et régions : ceux des vendeurs du marché simulé (MK_PEOPLE, MK_SUF de 22_marche.js).
// - Mêmes règles de durée que le joueur : trajet aller-retour selon la distance (tripRoundMs) + séjour (DURS). Position : tripPos.
// - Carte : petits portraits HTML peu nombreux (#vyLay, SOUS la surcouche #ov du joueur), qui évitent les zones réservées (poiBlocked)
//   et les lieux affichés (couche poi-sym), + pointillé très léger vers leur destination (couche MapLibre 'vy-line', sous les routes).
//   Mise à jour une fois par seconde, uniquement pour les voyageurs visibles ; au déplacement de la carte, simple reprojection.
// - Fiche non bloquante (#vyCard) avec « Saluer » : un cœur, et une petite chance de recevoir un cadeau à son retour.
// - Fil du monde : section du menu (renderMenu enveloppée), actualisée en temps réel. AUCUNE fenêtre spontanée.
// Exposé : vyActive(now), vyFeed(n), vyOpenCard(id), vyCloseCard(), vySetHidden(bool), vyGoTo(id), window.__voyageurs.
// Enveloppé : renderMenu (20_collection.js).
// État : S.vy = { hide: false, hi: { idVoyage: { at, end, gift, pl, comp, dest, tags, done } } }.

// ---------- hasard déterministe ----------
const vyHash = s => { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function vyRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const vyPick = (r, a) => a[Math.floor(r() * a.length)];
function vyWPick(r, list, wf) {
  const ws = list.map(wf), tot = ws.reduce((a, b) => a + b, 0);
  let x = r() * tot;
  for (let i = 0; i < list.length; i++) { x -= ws[i]; if (x <= 0) return list[i]; }
  return list[list.length - 1];
}
// distance rapide (équirectangulaire) pour les tris ; la vraie (kmExact) pour la durée
const vyKmFast = (a, b) => { const k = Math.cos((a.lat + b.lat) * Math.PI / 360), dx = (a.lon - b.lon) * k, dy = a.lat - b.lat; return Math.sqrt(dx * dx + dy * dy) * 111.2; };
const vyKm = (a, b) => (typeof kmExact === 'function' ? kmExact(a, b) : d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]) * 6371);

// ---------- français : « à Kyoto », « au Havre », « d’Annecy » ----------
function vyTo(n) {
  if (/^Le /.test(n)) return 'au ' + n.slice(3);
  if (/^Les /.test(n)) return 'aux ' + n.slice(4);
  if (/^Lac /.test(n)) return 'au l' + n.slice(1);
  return 'à ' + n;
}
function vyDe(n) {
  if (/^Le /.test(n)) return 'du ' + n.slice(3);
  if (/^Les /.test(n)) return 'des ' + n.slice(4);
  if (/^Lac /.test(n)) return 'du l' + n.slice(1);
  return /^[aeiouyâàéèêëîïôûAEIOUYÂÀÉÈÊÎÏÔÛ]/.test(n) ? 'd’' + n : 'de ' + n;
}
// lieux génériques du quotidien : [catégorie (butin), nom, « vers … », « à … », « de … »]
const VY_SPOTS = [
  ['parc', 'le parc', 'au parc', 'du parc'], ['boulangerie', 'la boulangerie', 'à la boulangerie', 'de la boulangerie'],
  ['marche', 'le marché', 'au marché', 'du marché'], ['bibliotheque', 'la bibliothèque', 'à la bibliothèque', 'de la bibliothèque'],
  ['cafe', 'le café du coin', 'au café du coin', 'du café du coin'], ['fleuriste', 'le fleuriste', 'chez le fleuriste', 'de chez le fleuriste'],
  ['jardin', 'le jardin public', 'au jardin public', 'du jardin public'], ['librairie', 'la librairie', 'à la librairie', 'de la librairie'],
  ['musee', 'le musée', 'au musée', 'du musée'], ['glacier', 'le glacier', 'chez le glacier', 'de chez le glacier'],
  ['fromagerie', 'la fromagerie', 'à la fromagerie', 'de la fromagerie'], ['etang', 'l’étang', 'à l’étang', 'de l’étang'],
  ['chocolaterie', 'la chocolaterie', 'à la chocolaterie', 'de la chocolaterie'], ['piscine', 'la piscine', 'à la piscine', 'de la piscine'],
];
const vyDestTo = d => d.to || vyTo(d.name);
const vyDestDe = d => d.de || vyDe(d.name);

// ---------- villes (GEO) ----------
let VY_CITIES = null;
function vyCities() {
  if (!VY_CITIES) VY_CITIES = (typeof GEO !== 'undefined' && GEO.p ? GEO.p : []).filter(c => c[3] <= 8).map(([name, lon, lat, r]) => ({ name, lon, lat, r }));
  return VY_CITIES;
}
const VY_REGC = {};
function vyRegCities(reg) {
  if (VY_REGC[reg]) return VY_REGC[reg];
  const R = RG[reg], a = { lon: R.anchor[0], lat: R.anchor[1] }, rad = R.g === 0 ? 240 : R.g === 1 ? 750 : 1500, maxR = R.g <= 1 ? 7 : 6;
  const list = vyCities().filter(c => c.r <= maxR && vyKmFast(a, c) < rad);
  return (VY_REGC[reg] = list);
}
function vyHomeIn(reg, r) {
  const R = RG[reg], list = vyRegCities(reg);
  for (let t = 0; t < 7 && list.length; t++) {
    const c = vyWPick(r, list, c => 1 / Math.pow(1 + c.r, 1.4));
    let ok = true;
    try { if (typeof regionAt === 'function') ok = regionAt(c.lon, c.lat).id === reg; } catch (e) {}
    if (ok) return { name: c.name, lon: c.lon, lat: c.lat };
  }
  return { name: R.anchor[2], lon: R.anchor[0], lat: R.anchor[1] };
}
// un point à d km d'un autre (cap aléatoire)
function vyOffset(o, r, d0, d1) {
  const a = r() * Math.PI * 2, d = d0 + (d1 - d0) * Math.sqrt(r());
  return { lon: o.lon + Math.cos(a) * d / (111.2 * Math.max(0.2, Math.cos(o.lat * Math.PI / 180))), lat: o.lat + Math.sin(a) * d / 111.2 };
}

// ---------- la population ----------
const VY_WORLD = 260, VY_NEAR = 28;
const VY_STYLE = {
  // P : longueur d'un créneau (un voyage au plus par créneau), go : chance de partir pendant ce créneau
  local: { P: [45, 110], go: 0.35, durs: [['eclair', 3], ['court', 5], ['moyen', 2]] },
  voisin: { P: [60, 140], go: 0.85, durs: [['court', 3], ['moyen', 5], ['long', 1]] },
  region: { P: [150, 300], go: 0.72, durs: [['court', 3], ['moyen', 4], ['long', 2]] },
  monde: { P: [540, 960], go: 0.62, durs: [['moyen', 3], ['long', 4], ['expe', 2]] },
};
let VY = null;
function vySpecies(r, reg) {
  const ids = typeof SP_IDS !== 'undefined' ? SP_IDS : Object.keys(SPECIES);
  const tags = (RG[reg] && RG[reg].anchor[3]) || [];
  const hab = sp => (typeof SP_INFO !== 'undefined' && SP_INFO[sp] && SP_INFO[sp].hab) || [];
  const local = ids.filter(sp => hab(sp).some(t => tags.includes(t)));
  if (local.length && r() < 0.45) return vyPick(r, local);
  return vyWPick(r, ids, sp => ['panda', 'capy', 'axo'].includes(sp) ? 2 : 1);
}
function vyGenes(sp, r) {
  // randomGenes tire au hasard : on lui prête notre hasard déterministe le temps de l'appel
  const M = Math.random; let g = null;
  Math.random = r;
  try { g = typeof randomGenes === 'function' ? randomGenes(sp, 0.7) : null; } catch (e) { g = null; } finally { Math.random = M; }
  return g || (SPECIES[sp] ? { ...SPECIES[sp].defGenes } : null);
}
function vyDests(home, style, r, close) {
  const out = [];
  if (style === 'local' || style === 'voisin') {
    const spots = VY_SPOTS.slice();
    for (let i = 0; i < 5; i++) {
      const s = spots.splice(Math.floor(r() * spots.length), 1)[0], p = style === 'voisin' ? vyOffset(home, r, close ? 0.25 : 0.4, close ? 1.1 : 2.6) : vyOffset(home, r, 0.5, 4.5);
      out.push({ name: s[1], to: s[2], de: s[3], tags: [s[0]], lon: p.lon, lat: p.lat, spot: 1 });
    }
    const near = vyCities().filter(c => { const d = vyKmFast(home, c); return d > 4 && d < 28 && c.name !== home.name; });
    if (near.length) { const c = vyPick(r, near); out.push({ name: c.name, tags: ['ville'], lon: c.lon, lat: c.lat }); }
  } else {
    const [k0, k1] = style === 'region' ? [35, 650] : [900, 16000];
    const pl = (typeof PLACES !== 'undefined' ? PLACES : []).filter(p => { const d = vyKmFast(home, p); return d > k0 && d < k1; });
    const ci = vyCities().filter(c => c.r <= (style === 'region' ? 6 : 3) && c.name !== home.name && (d => d > k0 && d < k1)(vyKmFast(home, c)));
    for (let i = 0; i < 6; i++) {
      if (pl.length && (r() < 0.45 || !ci.length)) { const p = vyPick(r, pl); if (!out.some(d => d.name === p.name)) out.push({ name: p.name, tags: (p.tags || ['ville']).slice(), lon: p.lon, lat: p.lat }); }
      else if (ci.length) { const c = vyPick(r, ci); if (!out.some(d => d.name === c.name)) out.push({ name: c.name, tags: ['ville'], lon: c.lon, lat: c.lat }); }
    }
  }
  for (const d of out) d.km = vyKm(home, d);
  return out;
}
function vyMkPlayer(i, name, reg, home, style, r, near) {
  const sp = vySpecies(r, reg), genes = vyGenes(sp, r);
  const names = (typeof SP_INFO !== 'undefined' && SP_INFO[sp] && SP_INFO[sp].names) || ['Petit'];
  const St = VY_STYLE[style], P = (St.P[0] + (St.P[1] - St.P[0]) * r()) * 60e3;
  return { i, name, reg, home, style, near, sp, genes, comp: vyPick(r, names), fem: r() < 0.5, P, off: r() * P, go: St.go, seed: vyHash(name + i), dests: vyDests(home, style, r, near && vyKmFast(home, homeObj()) < 1.2) };
}
function vyBuild() {
  const key = (S && S.home) || '';
  if (VY && VY.key === key) return VY;
  const t0 = performance.now();
  const people = (typeof MK_PEOPLE !== 'undefined' ? MK_PEOPLE : [['Lina', 'ara']]).filter(([, rg]) => typeof RG !== 'undefined' && RG[rg]);
  const sufs = (typeof MK_SUF !== 'undefined' ? MK_SUF : ['']).concat(['_mochi', '.étoile', '_rêve', '23', '.pomme', '_nuage', 'Kawa', '.miel', '_balade', '88', '.thé', '_pistache']);
  const used = new Set(), players = [];
  const uname = (r, n) => { for (let k = 0; k < 24; k++) { const s = n + vyPick(r, sufs); if (!used.has(s)) { used.add(s); return s; } } const s = n + (100 + Math.floor(r() * 900)); used.add(s); return s; };
  // le monde : plus de voyageurs en France, puis en Europe
  const wt = p => [3.6, 1.7, 0.75, 0.75, 0.8][RG[p[1]].g] || 0.8;
  for (let i = 0; i < VY_WORLD; i++) {
    const r = vyRng(vyHash('vy-monde:' + i));
    const x = r(), style = x < 0.24 ? 'local' : x < 0.6 ? 'region' : 'monde';
    // les grands voyageurs viennent de partout : leurs trajets se répartissent sur tout le globe
    const [n, reg] = vyWPick(r, people, style === 'monde' ? (p => (RG[p[1]].g === 0 ? 1.3 : 1)) : wt);
    players.push(vyMkPlayer(i, uname(r, n), reg, vyHomeIn(reg, r), style, r, false));
  }
  // quelques voisins, autour de la maison du joueur (ses lieux du quotidien)
  const h = homeObj();
  let hreg = 'idf'; try { if (typeof regionAt === 'function') hreg = regionAt(h.lon, h.lat).id; } catch (e) {}
  const loc = people.filter(p => p[1] === hreg), fr = people.filter(p => RG[p[1]].g === 0);
  for (let j = 0; j < VY_NEAR; j++) {
    const r = vyRng(vyHash('vy-voisin:' + key + ':' + j));
    const [n] = loc.length && r() < 0.4 ? vyPick(r, loc) : vyPick(r, fr.length ? fr : people);
    const p = j < 9 ? vyOffset(h, r, 0.15, 1) : vyOffset(h, r, 0.4, 2.6); // les plus proches : dans le quartier
    players.push(vyMkPlayer(VY_WORLD + j, uname(r, n), hreg, { name: h.name, lon: p.lon, lat: p.lat }, 'voisin', r, true));
  }
  VY = { key, players, ms: +(performance.now() - t0).toFixed(1) };
  VY_TC.clear();
  return VY;
}

// ---------- les voyages : un au plus par créneau, mêmes durées que le joueur ----------
const VY_TC = new Map();
const VY_ORDER = ['eclair', 'court', 'moyen', 'long', 'expe'];
function vyDurMs(key) { const d = (typeof DURS !== 'undefined' ? DURS : []).find(x => x.key === key); return d ? d.ms : 0; }
function vyTrip(p, k) {
  const id = p.i + ':' + k;
  if (VY_TC.has(id)) return VY_TC.get(id);
  const r = vyRng(vyHash(id + '|' + p.seed + '|' + VY.key));
  let t = null;
  if (r() < p.go && p.dests.length) {
    const d = vyPick(r, p.dests), road = typeof tripRoundMs === 'function' ? tripRoundMs(d.km) : 120e3, out = Math.round(road / 2);
    let di = VY_ORDER.indexOf(vyWPick(r, VY_STYLE[p.style].durs, x => x[1])[0]);
    while (di > 0 && 2 * out + vyDurMs(VY_ORDER[di]) > p.P * 0.94) di--;
    const stay = vyDurMs(VY_ORDER[di]), total = 2 * out + stay;
    if (total <= p.P * 0.94) {
      const start = k * p.P - p.off + r() * (p.P - total), x = r();
      // ce qu'il rapporte (pour le fil) : rien de spécial, un objet rare / épique / légendaire, ou un œuf
      const find = x < 0.5 ? 0 : x < 0.72 ? 2 : x < 0.83 ? 3 : x < 0.85 ? 4 : x < 0.91 ? 'oeuf' : 1;
      t = { id, p, from: p.home, dest: d, km: d.km, out, stay, total, dur: VY_ORDER[di], start, end: start + total, find, elapsed: 0 };
    }
  }
  if (VY_TC.size > 5000) VY_TC.clear();
  VY_TC.set(id, t);
  return t;
}
const vySlot = (p, now) => Math.floor((now + p.off) / p.P);
function vyActive(now = Date.now()) {
  if (!vyReady()) return [];
  const out = [];
  for (const p of vyBuild().players) {
    const t = vyTrip(p, vySlot(p, now));
    if (t && now >= t.start && now < t.end) { t.elapsed = now - t.start; out.push(t); }
  }
  return out;
}
function vyById(id) {
  if (!id || !vyReady()) return null;
  const [i, k] = String(id).split(':').map(Number), p = vyBuild().players[i];
  return p ? vyTrip(p, k) : null;
}
function vyPhase(t) {
  if (typeof tripPhase === 'function') return tripPhase(t);
  const f = t.elapsed / t.total; return f < t.out / t.total ? 'aller' : f < (t.out + t.stay) / t.total ? 'sejour' : 'retour';
}
function vyPos(t, now = Date.now()) {
  t.elapsed = Math.max(0, Math.min(t.total, now - t.start));
  if (typeof tripPos === 'function') return tripPos(t);
  return [t.dest.lon, t.dest.lat];
}
function vyReady() { return typeof S !== 'undefined' && S && typeof RG !== 'undefined' && typeof homeObj === 'function' && typeof SPECIES !== 'undefined'; }

// ---------- le fil du monde ----------
const vyE = t => (t.p.fem ? 'e' : '');
const vyOf = n => (/^[aeiouyhâàéèêëîïôûAEIOUYHÂÀÉÈÊÎÏÔÛ]/.test(n) ? 'd’' : 'de ') + n; // « de Lina », « d’Elio », « d’Hugo »
function vyFeed(n = 8, now = Date.now()) {
  if (!vyReady()) return [];
  const H = 2 * 3600e3, ev = [];
  for (const p of vyBuild().players) {
    const k = vySlot(p, now);
    // les petites sorties du quotidien à l'autre bout du monde : une sur quatre seulement (le fil reste varié)
    if (p.style === 'local' && vyHash(p.name) % 4) continue;
    for (const kk of [k - 2, k - 1, k]) {
      const t = vyTrip(p, kk); if (!t) continue;
      if (t.start <= now && t.start > now - H) ev.push({ at: t.start, kind: 'go', t });
      const arr = t.start + t.out;
      if (t.stay >= 30 * 60e3 && t.km > 30 && arr <= now && arr > now - H) ev.push({ at: arr, kind: 'arr', t });
      if (t.end <= now && t.end > now - H) ev.push({ at: t.end, kind: 'back', t });
    }
  }
  ev.sort((a, b) => b.at - a.at);
  return ev.slice(0, n);
}
function vyFeedText(e) {
  const t = e.t, p = t.p, P = `<b>${esc(p.name)}</b>`, C = esc(p.comp), D = esc(vyDestTo(t.dest)), F = esc(vyDestDe(t.dest));
  if (e.kind === 'go') return t.dest.spot ? `${P} a emmené ${C} ${D}` : `${P} a envoyé ${C} ${D}`;
  if (e.kind === 'arr') return `${C}, le familier ${/^d’/.test(vyOf(p.name)) ? 'd’' : 'de '}${P}, est arrivé${vyE(t)} ${D}`;
  const f = t.find;
  const what = f === 'oeuf' ? ' avec un œuf mystère !' : f >= 2 ? ` avec un objet ${RARITY[f].toLowerCase()} !` : f === 1 ? ' avec plein de souvenirs.' : '.';
  return `${P} est de retour ${F}${what}`;
}
function vyAgo(ms) {
  const m = Math.floor(ms / 60e3);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60); return `il y a ${h} h${m % 60 >= 10 ? ' ' + String(m % 60).padStart(2, '0') : ''}`;
}

// ---------- portraits ----------
const VY_PORT = new Map();
const vyLook = p => ({ sp: p.sp, genes: p.genes, hybrid: null });
function vyPortrait(p) {
  let u = VY_PORT.get(p.i);
  if (!u) {
    let svg = '';
    try { svg = drawChar(vyLook(p), {}, 'content', 'vy' + p.i); } catch (e) { svg = ''; }
    // recadré sur la tête : petit portrait rond lisible
    svg = svg.replace('viewBox="0 0 320 350"', 'viewBox="48 16 224 224" width="96" height="96"');
    u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    if (VY_PORT.size > 120) VY_PORT.clear();
    VY_PORT.set(p.i, u);
  }
  return u;
}
const VY_COL = { panda: '#e0884a', capy: '#c99a6a', axo: '#f08aa6', renard: '#8fb6d8', fennec: '#e3b06b', tanuki: '#a8826a', paresseux: '#b39a7a', lemur: '#9a9aa8', phoque: '#8fb0c8', quokka: '#c9a07a' };

// ---------- état sauvegardé ----------
function vyState() {
  if (!S.vy || typeof S.vy !== 'object') S.vy = { hide: false, hi: {} };
  if (typeof S.vy.hide !== 'boolean') S.vy.hide = false;
  if (!S.vy.hi || typeof S.vy.hi !== 'object') S.vy.hi = {};
  return S.vy;
}
function vySetHidden(b) { vyState().hide = !!b; save(); vyUpdate(true); if (b) vyCloseCard(); }

// ---------- styles ----------
(function vyCSS() {
  if (document.getElementById('vyCSS')) return;
  const st = document.createElement('style'); st.id = 'vyCSS';
  st.textContent = `
#vyLay{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}
body.firstrun #vyLay,body.firstrun #vyCard{display:none!important}
.vy{position:absolute;left:0;top:0;will-change:transform;pointer-events:auto;cursor:pointer;opacity:0;transition:opacity .6s ease}
.vy.in{opacity:1}
.vy::before{content:"";position:absolute;left:-19px;top:-19px;width:38px;height:38px;border-radius:50%}
.vy .vyb{position:absolute;left:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#fffaf0;border:2px solid var(--vc,#c9a07a);box-shadow:0 0 0 1.5px rgba(255,250,240,.9),0 2px 3px rgba(74,53,40,.28);overflow:hidden;display:block;transition:transform .2s}
.vy .vyb img{display:block;width:100%;height:100%}
.vy.go .vyb{animation:vybob 1.1s ease-in-out infinite alternate}
.vy.sej .vyb::after{content:"";position:absolute;right:1px;top:1px;width:5px;height:5px;border-radius:50%;background:#f6c445;box-shadow:0 0 0 1px #fffaf0}
.vy:hover .vyb{transform:scale(1.15)}
.vy.sel{z-index:3}
.vy.sel .vyb{transform:scale(1.3);border-color:var(--ink);animation:none}
#vyLay[data-z="far"] .vy .vyb{left:-10px;top:-10px;width:20px;height:20px;border-width:1.8px}
@keyframes vybob{from{transform:translateY(0)}to{transform:translateY(-2px)}}
.vyheart{position:absolute;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;pointer-events:none;animation:vyheart 1.3s ease-out forwards;z-index:4}
.vyheart svg{width:100%;height:100%}
@keyframes vyheart{0%{opacity:0;transform:var(--p) translateY(0) scale(.4)}20%{opacity:1;transform:var(--p) translateY(-10px) scale(1.15)}100%{opacity:0;transform:var(--p) translateY(-46px) scale(.9)}}
#vyCard{position:absolute;left:50%;transform:translateX(-50%);width:min(400px,calc(100% - 24px));z-index:5;display:grid;grid-template-columns:62px 1fr;gap:4px 11px;align-items:center;background:var(--paper);border:2.5px solid var(--ink);border-radius:18px;box-shadow:0 4px 0 rgba(74,53,40,.4);padding:9px 12px 8px 9px;font-family:var(--body);color:var(--ink);animation:vyin .28s cubic-bezier(.2,1.4,.4,1)}
@keyframes vyin{from{opacity:0;transform:translateX(-50%) translateY(10px)}}
#vyCard .vyp{grid-row:span 2;width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 50% 60%,var(--vt,#ffe9d6) 0 60%,#fff6e8 61%);border:2px solid var(--vc,#c9a07a);overflow:hidden}
#vyCard .vyp svg{width:100%;height:100%;display:block}
#vyCard .vyh{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;padding-right:22px;min-width:0}
#vyCard .vyh b{font:800 17px/1.1 var(--display)}
#vyCard .vyh .vyo{font:700 14px var(--display);color:var(--ink2)}
#vyCard .vyg{display:block;font-size:12.5px;color:var(--muted);line-height:1.25}
#vyCard .vyw{grid-column:1/-1;font-size:13.5px;line-height:1.3;margin-top:2px}
#vyCard .vyw b{font-weight:700}
#vyCard .vybar{grid-column:1/-1;height:6px;border-radius:99px;background:#efe2c8;overflow:hidden;position:relative}
#vyCard .vybar i{position:absolute;left:0;top:0;bottom:0;background:var(--vc,#c9a07a);border-radius:99px;transition:width 1s linear}
#vyCard .vyf{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:3px}
#vyCard .vysim{display:inline-flex;align-items:center;gap:5px;font:700 11px var(--display);color:var(--muted);letter-spacing:.02em}
#vyCard .vysim i{font-style:normal;background:#efe6d6;border:1px solid var(--line);color:var(--ink2);border-radius:99px;padding:0 6px;text-transform:uppercase;font-size:10px;letter-spacing:.06em}
.vyhi{display:inline-flex;align-items:center;gap:6px;border:2.5px solid var(--ink);border-radius:999px;background:var(--pink);color:#fff;font:800 14px var(--display);padding:4px 13px 3px 10px;box-shadow:0 3px 0 rgba(74,53,40,.4);cursor:pointer;text-shadow:0 1.5px 0 var(--pinkD)}
.vyhi svg{width:16px;height:16px}
.vyhi:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(74,53,40,.4)}
.vyhi[disabled]{background:#fff;color:var(--pinkD);text-shadow:none;cursor:default;box-shadow:0 2px 0 rgba(74,53,40,.25)}
#vyCard .vyx{position:absolute;right:6px;top:6px;width:28px;height:28px;border:0;background:none;color:var(--ink2);cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center}
#vyCard .vyx:hover{background:#f3e6cf}
#vyCard .vyx svg{width:16px;height:16px}
.msec.vysec .vybadge,.vybadge{font:800 10px var(--display);text-transform:uppercase;letter-spacing:.07em;background:#efe6d6;color:var(--ink2);border:1px solid var(--line);border-radius:999px;padding:1px 7px 0;margin-left:6px;vertical-align:2px}
.vynow{font-size:13px;color:var(--ink2);margin:0 0 6px;line-height:1.35}
.vynow b{color:var(--ink)}
.vyfeed{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.vyfeed li{display:flex;align-items:center;gap:9px;padding:5px 6px;border-radius:12px;font-size:13.5px;line-height:1.3;color:var(--ink)}
.vyfeed li.go{cursor:pointer}
.vyfeed li.go:hover{background:#fbf0dc}
.vyfeed li.fresh{animation:vyfresh 1.2s ease}
@keyframes vyfresh{from{background:#fff1c9}}
.vyfeed .vyfp{flex:none;width:30px;height:30px;border-radius:50%;border:1.8px solid var(--vc,#c9a07a);background:#fffaf0;overflow:hidden}
.vyfeed .vyfp img{width:100%;height:100%;display:block}
.vyfeed .vyft{flex:1;min-width:0}
.vyfeed .vyft small{display:block;font-size:11.5px;color:var(--muted)}
.vynote{font-size:11.5px;color:var(--muted);margin:6px 2px 0;line-height:1.35}
.vysw{appearance:none;-webkit-appearance:none;flex:none;width:46px;height:28px;border-radius:99px;background:#e6d8bf;border:2px solid var(--ink);position:relative;cursor:pointer;transition:background .2s}
.vysw::after{content:"";position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid var(--ink);box-sizing:border-box;transition:transform .2s}
.vysw:checked{background:var(--green)}
.vysw:checked::after{transform:translateX(18px)}
@media (prefers-reduced-motion:reduce){.vy.go .vyb,.vyheart,#vyCard{animation:none}}
`;
  document.head.appendChild(st);
})();

// ---------- la couche sur la carte ----------
let vyLay = null, vyInit = false, vyEls = new Map(), vySel = null, vyLineSig = '', vyLast = 0, vyStats = { active: 0, near: 0, cand: 0, shown: 0, ms: 0, mode: '' };
const VY_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 C5 15.5 2.5 12.5 2.5 8.6 C2.5 5.6 4.8 3.5 7.5 3.5 C9.4 3.5 11 4.6 12 6.2 C13 4.6 14.6 3.5 16.5 3.5 C19.2 3.5 21.5 5.6 21.5 8.6 C21.5 12.5 19 15.5 12 21Z" fill="currentColor" stroke="#4a3528" stroke-width="1.6" stroke-linejoin="round"/></svg>';
function vyMapOK() { return typeof map !== 'undefined' && map && typeof mapReady !== 'undefined' && mapReady; }
function vySetup() {
  if (vyInit || !vyMapOK()) return;
  const ov = $('ov'); if (!ov || !ov.parentNode) return;
  vyInit = true;
  vyLay = document.createElement('div'); vyLay.id = 'vyLay'; vyLay.setAttribute('aria-label', 'Voyageurs simulés');
  ov.parentNode.insertBefore(vyLay, ov); // sous la surcouche du joueur : ses marqueurs restent toujours devant
  vyLay.addEventListener('click', ev => {
    const m = ev.target.closest('.vy'); if (!m) return;
    ev.stopPropagation();
    if (vySel === m.dataset.vy) vyCloseCard(); else vyOpenCard(m.dataset.vy);
  });
  try {
    map.addSource('vy', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: 'vy-line', type: 'line', source: 'vy', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#7a5a44', 'line-opacity': ['case', ['==', ['get', 's'], 1], 0.6, 0.26], 'line-width': ['case', ['==', ['get', 's'], 1], 2, 1.3], 'line-dasharray': [1.2, 2.8] },
    }, map.getLayer('route-shadow') ? 'route-shadow' : undefined);
  } catch (e) { console.error(e); }
  map.on('move', vyPlace);
  map.on('moveend', () => vyUpdate(true));
  map.on('dragstart', () => vyCloseCard());
  map.on('click', () => vyCloseCard());
  vyUpdate(true);
}
// règles d'affichage selon le zoom : distance minimale du voyage et nombre maximal de portraits
function vyMode(z) {
  if (z < 3.6) return { id: 'monde', minKm: 700, n: 9 };
  if (z < 6.6) return { id: 'pays', minKm: 60, n: 10 };
  if (z < 10) return { id: 'region', minKm: 3, n: 7 };
  if (z < 14) return { id: 'ville', minKm: 0, n: 3 };
  return { id: 'quartier', minKm: 0, n: 2 };
}
// zones déjà prises : interface, marqueurs du joueur (poiBlocked), lieux affichés (poi-sym), fiche ouverte
function vyReserved(W, H) {
  let rects = [];
  try { if (typeof poiBlocked === 'function') rects = poiBlocked(W, H).slice(); } catch (e) { rects = []; }
  const ct = map.getContainer().getBoundingClientRect();
  for (const id of ['vyCard', 'liveBar', 'toast']) { const el = $(id); if (el && !el.hidden && el.offsetParent !== null) { const r = el.getBoundingClientRect(); if (r.width) rects.push([r.left - ct.left - 4, r.top - ct.top - 4, r.right - ct.left + 4, r.bottom - ct.top + 4]); } }
  try {
    if (map.getLayer('poi-sym')) for (const f of map.queryRenderedFeatures({ layers: ['poi-sym'] })) {
      const q = map.project(f.geometry.coordinates), hw = +f.properties.hw || 15;
      rects.push([q.x - hw - 2, q.y - hw - 2, q.x + hw + 2 + (+f.properties.lb ? 120 : 0), q.y + hw + 2]);
    }
  } catch (e) {}
  return rects;
}
function vyUpdate(force) {
  if (!vyInit) return;
  const now = Date.now();
  if (force !== true && now - vyLast < 600) return;
  vyLast = now;
  const t0 = performance.now();
  const off = vyState().hide || document.body.classList.contains('firstrun');
  if (off) { for (const el of vyEls.values()) el.remove(); vyEls.clear(); vySetLines([]); vyStats.shown = 0; return; }
  const ct = map.getContainer(), W = ct.clientWidth, H = ct.clientHeight, z = map.getZoom(), M = vyMode(z);
  vyLay.dataset.z = M.id === 'monde' ? 'far' : '';
  const act = vyActive(now), area = Math.max(0.7, (W * H) / (390 * 700));
  const budget = Math.max(1, Math.round(M.n * Math.min(2, Math.pow(area, 0.5))));
  const h = homeObj();
  // candidats : à l'écran, assez longs pour ce zoom
  const cands = [];
  for (const t of act) {
    const near = t.p.near;
    if (t.km < M.minKm && !(t.p.style === 'voisin' && M.id !== 'monde' && M.id !== 'pays' && near)) continue;
    if (M.id === 'monde' && t.p.style !== 'monde') continue;
    const pos = vyPos(t, now), q = map.project(pos);
    if (q.x < 16 || q.y < 16 || q.x > W - 16 || q.y > H - 16) continue;
    // stabilité : ceux déjà affichés d'abord, puis les voisins du joueur, puis un ordre fixe
    const pri = (vyEls.has(t.id) ? 0 : 1) * 10 + (t.id === vySel ? -20 : 0) + (near ? 0 : 1) * (M.id === 'ville' || M.id === 'quartier' ? 4 : 0) + (vyHash(t.id) % 1000) / 1000;
    cands.push({ t, pos, x: q.x, y: q.y, pri });
  }
  cands.sort((a, b) => a.pri - b.pri);
  // place libre : grille simple de rectangles
  const res = vyReserved(W, H), mine = [];
  const hit = r => res.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]) || mine.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
  const R = M.id === 'monde' ? 11 : 14, gap = M.id === 'monde' ? 12 : 18;
  const keep = []; let rej = 0;
  for (const c of cands) {
    if (keep.length >= budget && c.t.id !== vySel) continue;
    const r = [c.x - R, c.y - R, c.x + R, c.y + R];
    if (hit(r) && c.t.id !== vySel) { rej++; continue; }
    mine.push([c.x - R - gap, c.y - R - gap, c.x + R + gap, c.y + R + gap]);
    keep.push(c);
  }
  // DOM : on garde, on crée, on retire
  const ids = new Set(keep.map(c => c.t.id));
  for (const [id, el] of vyEls) if (!ids.has(id)) { el.remove(); vyEls.delete(id); }
  for (const c of keep) {
    let el = vyEls.get(c.t.id);
    const ph = vyPhase(c.t);
    if (!el) {
      el = document.createElement('div'); el.className = 'vy'; el.dataset.vy = c.t.id;
      el.style.setProperty('--vc', VY_COL[c.t.p.sp] || '#c9a07a');
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', `${c.t.p.comp}, le familier ${vyOf(c.t.p.name)} (voyageur simulé)`);
      el.innerHTML = `<i class="vyb"><img alt="" src="${vyPortrait(c.t.p)}"></i>`;
      vyLay.appendChild(el); vyEls.set(c.t.id, el);
      requestAnimationFrame(() => el.classList.add('in'));
    }
    el._pos = c.pos;
    el.classList.toggle('go', ph !== 'sejour'); el.classList.toggle('sej', ph === 'sejour'); el.classList.toggle('sel', c.t.id === vySel);
    el.style.transform = `translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px)`;
  }
  vySetLines(keep, h);
  vyStats = { active: act.length, near: act.filter(t => t.p.near).length, cand: cands.length, shown: keep.length, ms: +(performance.now() - t0).toFixed(2), mode: M.id, budget, rej, res: res.length };
  if (vySel) vyCardRefresh();
}
// au déplacement de la carte : simple reprojection des portraits affichés
function vyPlace() {
  if (!vyEls.size) return;
  for (const el of vyEls.values()) {
    if (!el._pos) continue;
    const q = map.project(el._pos);
    el.style.transform = `translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`;
  }
  const c = $('vyCard'); void c;
}
// pointillé très léger : de la position actuelle vers la destination (ou vers la maison au retour)
function vySetLines(keep, h) {
  if (!map.getSource('vy')) return;
  const feats = [];
  for (const c of keep) {
    const t = c.t, ph = vyPhase(t); if (ph === 'sejour') continue;
    const to = ph === 'aller' ? t.dest : t.from;
    const n = t.km > 300 ? 28 : t.km > 40 ? 8 : 2, it = d3.geoInterpolate(c.pos, [to.lon, to.lat]);
    const coords = []; for (let i = 0; i <= n; i++) coords.push(it(i / n));
    feats.push({ type: 'Feature', properties: { s: t.id === vySel ? 1 : 0 }, geometry: { type: 'LineString', coordinates: coords } });
  }
  const sig = keep.map(c => c.t.id + (c.t.id === vySel ? '*' : '') + vyPhase(c.t)).join(';') + '|' + Math.floor(Date.now() / 3000);
  if (sig === vyLineSig) return;
  vyLineSig = sig;
  map.getSource('vy').setData({ type: 'FeatureCollection', features: feats });
}

// ---------- la fiche d'un voyageur (non bloquante) ----------
function vyWhere(t) {
  const ph = vyPhase(t), home = t.from.name;
  const clock = typeof trjClock === 'function' ? trjClock(t.end) : '';
  const back = clock ? ` · retour ${clock}` : '';
  if (ph === 'aller') return `part ${esc(vyDe(home))} vers <b>${esc(t.dest.name)}</b>${back}`;
  if (ph === 'sejour') return t.dest.spot ? `se promène <b>${esc(vyDestTo(t.dest))}</b>${back}` : `explore <b>${esc(t.dest.name)}</b>${back}`;
  return `rentre ${esc(vyDestDe(t.dest))} vers <b>${esc(home)}</b>${back}`;
}
function vyCardHTML(t) {
  const p = t.p, hi = vyState().hi[t.id];
  const gl = typeof geneLabel === 'function' ? geneLabel(p.genes, p.sp) : '';
  const sp = typeof spName === 'function' ? spName(p.sp) : (SPECIES[p.sp] || {}).name || '';
  let svg = '';
  try { svg = drawChar(vyLook(p), {}, 'content', 'vyc' + p.i).replace('viewBox="0 0 320 350"', 'viewBox="30 0 260 260"'); } catch (e) {}
  const tint = (typeof SP_INFO !== 'undefined' && SP_INFO[p.sp] && SP_INFO[p.sp].tint) || '#ffe9d6';
  return `<button class="vyx" data-vy-close aria-label="Fermer la fiche"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>
<div class="vyp" style="--vt:${tint}">${svg}</div>
<div class="vyh"><b>${esc(p.comp)}</b><span class="vyo">${esc(vyOf(p.name))}</span></div>
<span class="vyg">${esc(sp)}${gl ? ' ' + esc(gl) : ''}</span>
<p class="vyw" id="vyWhere">${vyWhere(t)}</p>
<div class="vybar"><i id="vyBar" style="width:${(Math.min(1, t.elapsed / t.total) * 100).toFixed(1)}%"></i></div>
<div class="vyf"><span class="vysim"><i>Simulé</i>voyageurs simulés par le jeu</span>${hi ? `<button class="vyhi" disabled>${VY_HEART} Salué${p.fem ? 'e' : ''}</button>` : `<button class="vyhi" data-vy-hi="${t.id}">${VY_HEART} Saluer</button>`}</div>`;
}
function vyCardPlace(el) {
  // juste au-dessus de la carte d'action / du fil du voyage / de la barre du bas
  const ct = map.getContainer().getBoundingClientRect();
  let top = ct.bottom;
  for (const id of ['liveBar', 'tripCard', 'nav']) { const e = $(id); if (!e || e.hidden || e.offsetParent === null) continue; const r = e.getBoundingClientRect(); if (r.height && r.top < top && r.top > ct.top + ct.height * 0.4) top = r.top; }
  el.style.bottom = Math.round(ct.bottom - top + 10) + 'px';
}
function vyOpenCard(id) {
  const t = vyById(id); if (!t) return;
  t.elapsed = Math.max(0, Math.min(t.total, Date.now() - t.start));
  if (Date.now() >= t.end) { if (typeof toast === 'function') toast(`${t.p.comp} est déjà rentré${vyE(t)} chez ${t.p.name}.`); return; }
  vySel = id;
  let el = $('vyCard');
  if (!el) { el = document.createElement('div'); el.id = 'vyCard'; el.setAttribute('role', 'region'); el.setAttribute('aria-live', 'polite'); $('ov').parentNode.appendChild(el); }
  el.style.setProperty('--vc', VY_COL[t.p.sp] || '#c9a07a');
  el.setAttribute('aria-label', `Fiche de ${t.p.comp}, voyageur simulé`);
  el.innerHTML = vyCardHTML(t); el.hidden = false; el.dataset.id = id;
  vyCardPlace(el);
  for (const [k, e] of vyEls) e.classList.toggle('sel', k === id);
  vyLineSig = ''; vyUpdate(true);
}
function vyCloseCard() {
  const el = $('vyCard'); if (el) { el.hidden = true; el.innerHTML = ''; }
  if (!vySel) return;
  vySel = null;
  for (const e of vyEls.values()) e.classList.remove('sel');
  vyLineSig = ''; if (vyInit) vyUpdate(true);
}
function vyCardRefresh() {
  const el = $('vyCard'); if (!el || el.hidden || !vySel) return;
  const t = vyById(vySel); if (!t || Date.now() >= t.end) { vyCloseCard(); return; }
  t.elapsed = Date.now() - t.start;
  const w = $('vyWhere'), b = $('vyBar'), h = vyWhere(t);
  if (w && w.innerHTML !== h) w.innerHTML = h;
  if (b) b.style.width = (Math.min(1, t.elapsed / t.total) * 100).toFixed(1) + '%';
  vyCardPlace(el);
}
// « Saluer » : un cœur qui s'envole, et une petite chance de cadeau au retour
function vySayHi(id) {
  const t = vyById(id); if (!t) return;
  const st = vyState(); if (st.hi[id]) return;
  const gift = Math.random() < 0.3;
  st.hi[id] = { at: Date.now(), end: t.end, gift, pl: t.p.name, comp: t.p.comp, fem: t.p.fem, dest: t.dest.name, de: vyDestDe(t.dest), tags: (t.dest.tags || ['ville']).slice(), done: 0 };
  save();
  const el = vyEls.get(id);
  if (el && el._pos) for (let i = 0; i < 3; i++) {
    const q = map.project(el._pos), hz = document.createElement('div');
    hz.className = 'vyheart'; hz.style.color = ['#f08aa6', '#e0607e', '#f6a6bd'][i];
    hz.style.setProperty('--p', `translate(${(q.x + (i - 1) * 9).toFixed(1)}px,${(q.y - 14).toFixed(1)}px)`);
    hz.style.animationDelay = (i * 0.16) + 's';
    hz.innerHTML = VY_HEART; vyLay.appendChild(hz); setTimeout(() => hz.remove(), 1700 + i * 160);
  }
  if (typeof toast === 'function') toast(`Vous saluez ${t.p.comp} ! ${t.p.fem ? 'Elle' : 'Il'} agite la patte.`);
  const c = $('vyCard'); if (c && !c.hidden && vySel === id) { c.innerHTML = vyCardHTML(t); vyCardPlace(c); }
}
// au retour d'un voyageur salué : parfois un petit cadeau (objet du lieu visité, ou quelques pièces)
function vyGifts() {
  const st = vyState(), now = Date.now(); let ch = false;
  for (const [id, h] of Object.entries(st.hi)) {
    if (now - h.at > 3 * 864e5) { delete st.hi[id]; ch = true; continue; }
    if (h.done || now < h.end) continue;
    h.done = 1; ch = true;
    if (!h.gift) continue;
    try {
      if (Math.random() < 0.65 && typeof lootFor === 'function') {
        const it = lootFor(h.tags && h.tags.length ? h.tags : ['ville'], 1.2, h.dest, 1)[0];
        if (it) {
          it.from = `Cadeau de ${h.pl} (simulé)`;
          S.inv.push(it); S.dex[it.name] = true;
          if (typeof toast === 'function') toast(`${h.comp} est rentré${h.fem ? 'e' : ''} ${h.de} et vous offre « ${it.name} » ! (voyageur simulé)`);
        }
      } else {
        const n = 15 + Math.floor(Math.random() * 30);
        if (typeof gainCoins === 'function') gainCoins(n);
        if (typeof toast === 'function') toast(`${h.comp} est rentré${h.fem ? 'e' : ''} ${h.de} et vous envoie ${n} pièces ! (voyageur simulé)`);
      }
    } catch (e) { console.error(e); }
  }
  if (ch) { save(); try { if (typeof renderTop === 'function') renderTop(); } catch (e) {} }
}
// depuis le fil : aller voir un voyageur sur la carte
function vyGoTo(id) {
  const t = vyById(id); if (!t || Date.now() >= t.end) return;
  if (vyState().hide) vySetHidden(false);
  if (typeof closeSheet === 'function' && tab !== 'carte') closeSheet();
  const pos = vyPos(t), z = t.km > 2000 ? 2.6 : t.km > 400 ? 4.8 : t.km > 40 ? 7.5 : 12.5;
  vySel = id;
  map.flyTo({ center: pos, zoom: z, speed: 1.5, essential: true });
  map.once('moveend', () => vyOpenCard(id));
}

// ---------- le fil du monde, dans le menu ----------
function vyFeedHTML() {
  const now = Date.now();
  return vyFeed(8, now).map(e => {
    const live = now < e.t.end && e.kind !== 'back';
    return `<li class="${live ? 'go' : ''}" ${live ? `data-vy-go="${e.t.id}" role="button" tabindex="0" title="Voir sur la carte"` : ''} data-k="${e.t.id}|${e.kind}" style="--vc:${VY_COL[e.t.p.sp] || '#c9a07a'}"><span class="vyfp"><img alt="" src="${vyPortrait(e.t.p)}"></span><span class="vyft">${vyFeedText(e)}<small>${vyAgo(now - e.at)}${live ? ' · voir sur la carte' : ''}</small></span></li>`;
  }).join('');
}
function vyNowText() {
  const act = vyActive(), near = act.filter(t => t.p.near || vyKmFast(homeObj(), t.from) < 30).length;
  return `En ce moment, <b>${act.length} familiers</b> sont en voyage dans le monde${near ? `, dont <b>${near}</b> près de chez vous` : ''}.`;
}
function vyMenu(box) {
  if (!box || !vyReady()) return;
  const secs = box.querySelectorAll('.msec'), last = secs[secs.length - 1];
  const sec = document.createElement('section'); sec.className = 'msec vysec';
  sec.innerHTML = `<header><h3>Voyageurs du monde<span class="vybadge">simulé</span></h3></header><p class="vynow" id="vyNow">${vyNowText()}</p><ul class="vyfeed" id="vyFeed">${vyFeedHTML()}</ul><p class="vynote">Ces voyageurs et leurs familiers sont simulés par le jeu : ce ne sont pas de vrais joueurs.</p>`;
  if (last) box.insertBefore(sec, last); else box.appendChild(sec);
  const set = last && last.querySelector('header h3') && /glages/.test(last.querySelector('header h3').textContent) ? last : sec;
  set.insertAdjacentHTML('beforeend', `<div class="mrow set"><label for="vyShow"><b>Voyageurs sur la carte</b><span>Les petits portraits des familiers simulés en voyage.</span></label><input type="checkbox" id="vyShow" class="vysw" ${vyState().hide ? '' : 'checked'}></div>`);
}
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try { vyMenu(box); } catch (e) { console.error(e); }
  return r;
})(renderMenu);
let vyFeedSig = '';
function vyFeedLive() {
  const ul = $('vyFeed'); if (!ul) { vyFeedSig = ''; return; }
  const now = Date.now(), f = vyFeed(8, now), sig = f.map(e => e.t.id + e.kind).join(';') + '|' + Math.floor(now / 30e3);
  if (sig === vyFeedSig) return;
  const old = new Set([...ul.children].map(li => li.dataset.k));
  vyFeedSig = sig; ul.innerHTML = vyFeedHTML();
  if (old.size) for (const li of ul.children) if (!old.has(li.dataset.k)) li.classList.add('fresh');
  const n = $('vyNow'); if (n) { const h = vyNowText(); if (n.innerHTML !== h) n.innerHTML = h; }
}

// ---------- interactions ----------
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-vy-hi],[data-vy-close],[data-vy-go]'); if (!b) return;
  if (b.dataset.vyHi) { ev.stopPropagation(); return vySayHi(b.dataset.vyHi); }
  if (b.hasAttribute('data-vy-close')) { ev.stopPropagation(); return vyCloseCard(); }
  if (b.dataset.vyGo) return vyGoTo(b.dataset.vyGo);
});
document.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.dataset && ev.target.dataset.vyGo) { ev.preventDefault(); vyGoTo(ev.target.dataset.vyGo); } });
document.addEventListener('change', ev => { if (ev.target && ev.target.id === 'vyShow') vySetHidden(!ev.target.checked); });

// ---------- la boucle : une fois par seconde, rien quand l'onglet est caché ----------
let vyN = 0;
setInterval(() => {
  if (document.hidden) return;
  try {
    if (!vyReady()) return;
    vyState();
    if (!vyInit) vySetup();
    if (vyInit) vyUpdate();
    if (typeof tab !== 'undefined' && tab === 'menu') vyFeedLive();
    if (++vyN % 5 === 0) vyGifts();
    const c = $('vyCard'); if (c && !c.hidden && typeof tab !== 'undefined' && tab !== 'carte') vyCloseCard();
  } catch (e) { console.error(e); }
}, 1000);

// pour les tests
window.__voyageurs = {
  build: () => vyBuild(), active: n => vyActive(n), feed: (n, t) => vyFeed(n, t), feedText: e => vyFeedText(e), open: vyOpenCard, close: vyCloseCard, hi: vySayHi, goTo: vyGoTo,
  setHidden: vySetHidden, update: () => vyUpdate(true), gifts: vyGifts, byId: vyById,
  stats: () => Object.assign({}, vyStats), shown: () => [...vyEls.keys()], get sel() { return vySel; },
};

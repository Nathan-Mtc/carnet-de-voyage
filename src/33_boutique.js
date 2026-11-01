// ================= BOUTIQUE VIVANTE (v17, vague 2) =================
// Le Comptoir devient une scène animée : les clients animaux entrent, regardent la VITRINE (6 objets du sac exposés),
// font la queue avec une bulle-image, et on les sert d'un toucher. Ventes passives quand on est absent,
// clients fidèles (cœurs, cadeaux, rumeurs de trésor), petits événements (client pressé, critique, raton voleur),
// décoration légère (façade, enseigne, 3 décorations) qui augmente l'attrait.
// Le Marché mondial gagne une « place du marché » : étals par région, demandes, enchère, tendances de la semaine.
// État : S.shop.v2 (boutique) et S.mkt.dem / S.mkt.auc (marché). Anciennes sauvegardes : tout est créé à la demande.
// Économie : la vitrine vend au plus à value() × 1,1 (et jamais au-dessus du prix payé) ; les demandes refusent
// les objets achetés ; l'enchère reste sous le prix juste × 1,3. Les objets uniques de trésor (it.tresor) sont exclus.

const B2_DECOS = [
  { id: 'plante', name: 'Grande plante', price: 80, a: 1, slot: 2 },
  { id: 'tableau', name: 'Tableau', price: 150, a: 2, slot: 0 },
  { id: 'lampions', name: 'Lampions', price: 120, a: 2, slot: 1 },
  { id: 'horloge', name: 'Horloge', price: 180, a: 2, slot: 0 },
  { id: 'aquarium', name: 'Aquarium', price: 320, a: 3, slot: 1 },
  { id: 'tapis', name: 'Tapis rond', price: 140, a: 1, slot: 2 },
];
const B2_FAC = ['', '#f08aa6', '#5f9fd0', '#6fb07f', '#e9a03a', '#9a6fd6', '#d9604f'];
const B2_SIGN = [['#fff8ea', '#4a3528', 'Bois clair'], ['#f6c445', '#7a4a12', 'Doré'], ['#3b4a3f', '#fff8ea', 'Ardoise'], ['#2b2140', '#ff8fd0', 'Néon']];
const B2_FAC_COST = 40, B2_SIGN_COST = 60, B2_HEART = [3, 7, 12, 18];
const B2_INK = '#5b4636';

function b2() {
  const s = bqState();
  if (!s.v2 || typeof s.v2 !== 'object') s.v2 = {};
  const v = s.v2;
  if (!Array.isArray(v.vit)) v.vit = [];
  if (!Array.isArray(v.dec)) v.dec = [];
  if (!Array.isArray(v.on)) v.on = [];
  if (!v.fid || typeof v.fid !== 'object') v.fid = {};
  if (!Array.isArray(v.log)) v.log = [];
  for (const k of ['fac', 'sign', 'last', 'acc', 'sold']) if (typeof v[k] !== 'number' || !isFinite(v[k])) v[k] = 0;
  if (!v.last) v.last = Date.now();
  v.vit = v.vit.filter(it => it && it.id && !it.tresor).slice(0, 6);
  v.on = v.on.filter(o => o && (o.it || B2_DECOS.some(d => d.id === o.d))).slice(0, 3);
  return v;
}
// exposable / vendable : ni trésor unique, ni bout de carte, ni vêtement porté, ni œuf
const b2Ok = it => !!(it && it.id && !it.tresor && it.cat !== 't' && it.cat !== 'o' && !it.cap && !bqWorn().has(it.id));
const b2MaxRar = () => b2().vit.reduce((a, it) => Math.max(a, it.rarity || 0), 0);
function b2Price(it) {
  const base = value(it), rich = 1 + 0.05 * b2MaxRar();
  let p = Math.min(base * 1.1, base * 0.92 * rich);
  if (it.paid > 0) p = Math.min(p, it.paid);
  return Math.max(3, Math.round(p));
}
function b2Attract() {
  const v = b2(); let a = 0;
  v.on.forEach(o => { a += o.d ? (B2_DECOS.find(x => x.id === o.d) || { a: 0 }).a : Math.min(3, 1 + (o.it.rarity || 0)); });
  if (v.fac) a++; if (v.sign) a++;
  return a + Math.min(3, Math.floor(v.vit.length / 2));
}
// plus d'attrait : les commandes arrivent un peu plus souvent (au plus 30 %)
if (typeof bqInterval === 'function') bqInterval = (orig => function () { const r = orig.apply(this, arguments); try { return Math.round(r / (1 + Math.min(0.3, b2Attract() * 0.025))); } catch (e) { return r; } })(bqInterval);

// ---------------- vitrine ----------------
function b2Expose(id) {
  const v = b2(), it = S.inv.find(x => x.id === id);
  if (!it || !b2Ok(it)) return;
  if (v.vit.length >= 6) { toast('La vitrine est pleine (6 objets). Touchez un objet exposé pour le reprendre.'); return; }
  S.inv.splice(S.inv.indexOf(it), 1); v.vit.push(it); save(); renderPanel();
}
function b2Unexpose(id) {
  const v = b2(), it = v.vit.find(x => x.id === id); if (!it) return;
  v.vit.splice(v.vit.indexOf(it), 1); S.inv.push(it); save(); renderPanel();
}
// ventes passives : pendant qu'on n'est pas au comptoir, des clients de passage achètent en vitrine (1 à 3 par heure)
function b2Passive(now) {
  const v = b2(), dt = Math.min(12 * 3600e3, Math.max(0, now - v.last)); v.last = now;
  if (!v.vit.length) { v.acc = 0; return 0; }
  v.acc += dt * (0.6 + b2Attract() * 0.12 + b2MaxRar() * 0.1) / 3600e3;
  let n = 0;
  while (v.acc >= 1 && v.vit.length) {
    v.acc -= 1;
    const it = v.vit[Math.floor(Math.random() * v.vit.length)], p = b2Price(it);
    const pool = BQ_CLIENTS.filter(c => c.lvl <= bqState().lvl), c = pick(pool.length ? pool : BQ_CLIENTS);
    v.vit.splice(v.vit.indexOf(it), 1);
    gainCoins(p); bqState().earned += p; v.sold++;
    v.log.push({ name: it.name, it: { name: it.name, cat: it.cat, sub: it.sub, rarity: it.rarity, color: it.color, look: it.look }, p, c: c.id, at: now });
    b2Fid(c.id).h += 1; n++;
  }
  if (v.acc > 3) v.acc = 3;
  v.log = v.log.slice(-12);
  if (n) { save(); try { renderTop(); renderNav(); } catch (e) {} }
  return n;
}

// ---------------- clients fidèles ----------------
function b2Fid(id) { const v = b2(); return v.fid[id] || (v.fid[id] = { h: 0, g: 0 }); }
function b2Heart(cid, n) {
  const c = BQC(cid); if (!c) return '';
  const f = b2Fid(cid); f.h += n;
  let msg = '';
  while (f.g < B2_HEART.length && f.h >= B2_HEART[f.g]) {
    const g = f.g++;
    if (g % 2 === 1) {
      let r = null; try { if (typeof tzGiveRumor === 'function') r = tzGiveRumor(null, c.name, bqHome() ? { lon: bqHome().anchor[0], lat: bqHome().anchor[1] } : null); } catch (e) {}
      if (r && typeof tzRumorToast === 'function') { tzRumorToast(c.name + ' vous chuchote', r); msg = 'rumeur'; }
      else { gainCoins(40); toast(`${c.name} vous glisse 40 pièces : « Pour votre gentillesse ! »`); msg = 'cadeau'; }
    } else {
      const T = bqType(), def = T && T.stars ? T.stars[g === 0 ? 0 : 2] : ['Petit bouquet', 'm', 'fleur', 1, null, '#f3aec1'];
      const it = makeItem(def, 1, `Cadeau de ${c.name}`, [], { fixed: Math.max(g === 0 ? 1 : 2, def[3] || 0) });
      S.inv.push(it); S.dex[it.name] = true;
      toast(`${c.name} vous offre « ${it.name} » ! Votre amitié grandit.`); msg = 'cadeau';
    }
  }
  return msg;
}
if (typeof GAME !== 'undefined') GAME.on('order:done', e => { try { if (e && e.client) { b2Heart(e.client.id, 2); save(); } } catch (er) {} });

// ---------------- la scène dessinée ----------------
function b2DecoSVG(id) {
  const sw = `stroke="${B2_INK}" stroke-width="2" stroke-linejoin="round"`;
  switch (id) {
    case 'plante': return `<path d="M12 28 L14 40 H26 L28 28Z" fill="#d98763" ${sw}/><path d="M20 28 C18 16 8 12 3 12 C7 20 13 25 20 28Z M20 28 C22 14 30 8 37 6 C34 16 27 24 20 28Z M20 28 C20 16 20 8 19 1 C25 10 24 20 20 28Z" fill="#6fae7d" ${sw}/>`;
    case 'tableau': return `<rect x="3" y="6" width="34" height="28" rx="2" fill="#e3b07a" ${sw}/><rect x="7" y="10" width="26" height="20" fill="#bfe1f2"/><path d="M7 30 L15 20 L21 26 L25 22 L33 30Z" fill="#7fbf6a"/><circle cx="27" cy="15" r="3" fill="#fbd76a"/>`;
    case 'lampions': return [6, 20, 34].map((x, i) => `<path d="M${x} 0 V6" stroke="${B2_INK}" stroke-width="1.4"/><ellipse cx="${x}" cy="14" rx="6" ry="8" fill="${['#f08aa6', '#f6c445', '#5fbf7f'][i]}" ${sw}/><path d="M${x - 3} 6 h6 M${x - 3} 22 h6" stroke="${B2_INK}" stroke-width="2"/>`).join('');
    case 'horloge': return `<circle cx="20" cy="20" r="16" fill="#fff8ea" ${sw}/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#e3b07a" stroke-width="2"/><path d="M20 20 V11 M20 20 L26 23" stroke="${B2_INK}" stroke-width="2.4" stroke-linecap="round" class="b2-hand"/>`;
    case 'aquarium': return `<rect x="3" y="10" width="34" height="26" rx="4" fill="#9fd1e8" ${sw}/><path d="M3 16 H37" stroke="#fff" stroke-width="1.5" opacity=".7"/><g class="b2-fish"><path d="M12 24 q6 -6 12 0 q-6 6 -12 0Z M24 24 l5 -4 v8Z" fill="#f6a04b" stroke="${B2_INK}" stroke-width="1.2"/></g><path d="M8 36 q3 -6 6 0 M28 36 q2 -8 5 0" fill="#6fae7d"/>`;
    case 'tapis': return `<ellipse cx="20" cy="33" rx="19" ry="6" fill="#d9604f" ${sw}/><ellipse cx="20" cy="33" rx="13" ry="3.6" fill="none" stroke="#f6d36b" stroke-width="2"/>`;
  }
  return '';
}
const B2_SLOT = [{ x: 66, y: 46, s: 44 }, { x: 122, y: 100, s: 34 }, { x: 62, y: 134, s: 54 }];
function b2SVG() {
  const s = bqState(), v = b2(), T = bqType(), W = 360, H = 230, sw = `stroke="${B2_INK}" stroke-width="2.4" stroke-linejoin="round"`;
  const wA = T ? T.wall : '#f8e6cc', wB = T ? T.wall2 : '#f6dcc0', aw = v.fac ? B2_FAC[v.fac] : T ? T.aw : '#d9604f', aw2 = T ? T.aw2 : '#fff8ea', door = v.fac ? B2_FAC[v.fac] : T ? T.door : '#b06a3a';
  let g = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
  g += `<defs><pattern id="b2wp" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${wA}"/><rect width="12" height="24" fill="${wB}" opacity=".7"/></pattern></defs>`;
  g += `<rect width="${W}" height="${H}" fill="url(#b2wp)"/><rect y="190" width="${W}" height="40" fill="#c99a6a"/>` + [0, 1, 2].map(i => `<path d="M0 ${199 + i * 10} H${W}" stroke="#b5875a" stroke-width="1.2"/>`).join('') + `<rect y="186" width="${W}" height="6" fill="#a87a50"/>`;
  // porte d'entrée (les clients arrivent par là)
  g += `<path d="M8 188 V84 a26 26 0 0 1 52 0 V188Z" fill="#4a3528" opacity=".18"/><path d="M12 188 V86 a22 22 0 0 1 44 0 V188Z" fill="${door}" ${sw}/><circle cx="34" cy="92" r="11" fill="#bfe1f2" ${sw}/><circle cx="49" cy="142" r="3" fill="#f6c445" stroke="${B2_INK}" stroke-width="1.5"/><path d="M34 62 V70" stroke="${B2_INK}" stroke-width="1.6"/><path d="M28 70 q6 10 12 0Z" fill="#f6c445" stroke="${B2_INK}" stroke-width="1.6" class="b2-bell"/>`;
  // étagères de la vitrine (les objets sont posés en HTML par-dessus, pour pouvoir les toucher)
  [84, 134].forEach(y => { g += `<rect x="246" y="${y}" width="108" height="7" rx="2" fill="#a87a50" ${sw}/><path d="M256 ${y + 7} l4 8 M344 ${y + 7} l-4 8" stroke="${B2_INK}" stroke-width="2.2"/>`; });
  g += `<rect x="242" y="34" width="116" height="10" rx="3" fill="#e3b07a" ${sw}/><text x="300" y="54" text-anchor="middle" font-family="Caveat, cursive" font-size="13" fill="#4a3528" opacity=".8">Vitrine</text>`;
  // le compagnon derrière le comptoir
  const k = CHARS[S.sel] && !S.trips[S.sel] ? S.sel : (typeof teamIds === 'function' ? teamIds() : []).find(x => !S.trips[x]);
  if (k) { try { g += drawChar(k, S.outfits[k], 'rire', 'b2k').replace('<svg ', `<svg x="146" y="66" width="72" height="80" class="b2-me" `); } catch (e) {} }
  // comptoir
  g += `<rect x="118" y="142" width="128" height="46" rx="6" fill="#c98a5a" ${sw}/><rect x="112" y="136" width="140" height="10" rx="4" fill="#e3b07a" ${sw}/><path d="M128 156 H236 M128 172 H236" stroke="#a87a50" stroke-width="2" opacity=".6"/>`;
  if (T) g += `<circle cx="182" cy="165" r="14" fill="#fff8ea" ${sw}/><g transform="translate(170 153) scale(.6)">${bqEmblem(T.em)}</g>`;
  g += `<g transform="translate(214 116)"><rect x="0" y="6" width="26" height="16" rx="3" fill="#7fb6d9" ${sw}/><rect x="4" y="0" width="18" height="8" rx="2" fill="#bfe1f2" ${sw}/><circle cx="13" cy="14" r="3" fill="#f6d36b"/></g>`;
  // auvent + enseigne
  for (let i = 0; i < 12; i++) g += `<path d="M${i * 30} 0 H${i * 30 + 30} V18 a15 8 0 0 1 -30 0Z" fill="${i % 2 ? aw2 : aw}" ${sw}/>`;
  const SG = B2_SIGN[v.sign] || B2_SIGN[0], name = T ? T.short : 'Ma boutique', w = 30 + name.length * 8.4;
  g += `<g transform="translate(182 36)"><path d="M${-w / 2 + 12} -12 V-2 M${w / 2 - 12} -12 V-2" stroke="${B2_INK}" stroke-width="2"/><rect x="${-w / 2}" y="-2" width="${w}" height="26" rx="8" fill="${SG[0]}" ${sw}/><text x="0" y="16.5" text-anchor="middle" font-family="Baloo 2, Fredoka, sans-serif" font-weight="800" font-size="15" fill="${SG[1]}"${v.sign === 3 ? ' class="b2-neon"' : ''}>${esc(name)}</text></g>`;
  // décorations posées (3 emplacements : mur, comptoir, sol)
  v.on.forEach((o, i) => {
    const P = B2_SLOT[o.d ? (B2_DECOS.find(x => x.id === o.d) || {}).slot ?? i : i] || B2_SLOT[i];
    const inner = o.d ? b2DecoSVG(o.d) : itemIcon(o.it).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    g += `<svg x="${P.x}" y="${P.y}" width="${P.s}" height="${P.s}" viewBox="0 0 40 40" class="b2-deco">${inner}</svg>`;
  });
  return g + '</svg>';
}
function b2ShelfHTML() {
  const v = b2(); let h = '';
  for (let i = 0; i < 6; i++) {
    const it = v.vit[i], x = 69.5 + (i % 3) * 9.6, y = i < 3 ? 23.5 : 45.2;
    h += it ? `<button class="b2v" data-b2pane="vit" style="left:${x}%;top:${y}%;--rc:${RARC[it.rarity || 0]}" aria-label="${esc(it.name)} en vitrine">${itemIcon(it)}</button>`
      : `<button class="b2v empty" data-b2pane="vit" style="left:${x}%;top:${y}%" aria-label="Exposer un objet">+</button>`;
  }
  return h;
}
// emplacements (en % de la largeur) : commandes à gauche du comptoir, vitrine à droite
const B2_QO = [17, 1], B2_QV = [62, 79, 45], B2_BROWSE = [80, 70];
function b2SceneHTML() {
  const s = bqState(), v = b2(), now = Date.now();
  const os = s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).slice(0, 2);
  let cl = os.map((o, i) => {
    const c = BQC(o.client), ready = bqReady(o), al = bqAllocate(o), miss = o.req.find((r, j) => al[j].have < r.n);
    const bub = ready ? '<svg viewBox="0 0 20 20" class="b2ok"><circle cx="10" cy="10" r="9" fill="#5fbf7f" stroke="#3a8f5a" stroke-width="1.6"/><path d="M5.6 10.4 L8.6 13.2 L14.4 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : bqReqIcon(miss || o.req[0]);
    return `<button class="b2c ord${ready ? ' ready' : ''}" data-b2ord="${o.id}" style="left:${B2_QO[i]}%" aria-label="${esc(c.name)} : ${ready ? 'commande prête, toucher pour livrer' : 'voir sa commande'}"><span class="b2b">${bub}</span><img src="${clientURI(c, ready ? 'joie' : 'content')}" alt=""></button>`;
  }).join('');
  if (s.orders.length > 2) cl += `<span class="b2more" style="left:1%">+${s.orders.length - 2}</span>`;
  const log = v.log.filter(x => !x.seen);
  const tick = log.length ? `<div class="b2tick"><b>Pendant votre absence</b><span class="b2ti">${log.slice(-5).map(x => itemIcon(x.it)).join('')}</span><span>${log.length} vente${log.length > 1 ? 's' : ''} · ${coins(log.reduce((a, x) => a + x.p, 0))}</span><button class="btn green sm" data-b2logok="1">Super !</button></div>` : '';
  const a = b2Attract();
  return `<div class="b2scene" id="b2scene"><div class="b2bg">${b2SVG()}</div><div class="b2shelf">${b2ShelfHTML()}</div><div class="b2layer" id="b2layer">${cl}</div>${tick}<span class="b2attr" title="Attrait de la boutique : plus de clients">${'<i></i>'.repeat(Math.min(6, Math.ceil(a / 2)))}<b>Attrait ${a}</b></span>${!v.vit.length ? '<button class="b2hint" data-b2pane="vit">Exposez des objets en vitrine : les clients de passage les achèteront, même en votre absence !</button>' : ''}</div>`;
}

// ---------------- clients de passage (animés) ----------------
const b2L = { cl: [], next: 0, seq: 0 };
const B2_RATON = { id: 'b2raton', name: 'Raton chapardeur', sp: 'raton', label: 'le raton', cloth: '#3a3a48', acc: '', accC: '#000', rich: 1, lvl: 0 };
function b2Spawn(now) {
  const s = bqState(), v = b2(), a = b2Attract(), maxW = a >= 6 ? 3 : 2, dk = dayKey();
  if (b2L.cl.length >= maxW) return;
  let kind = 'walk';
  const cheap = v.vit.filter(it => (it.rarity || 0) <= 1);
  if (cheap.length && v.thief !== dk && b2L.seq >= 2 && Math.random() < 0.14) { kind = 'raton'; v.thief = dk; }
  else if (v.vit.length && v.crit !== dk && b2L.seq >= 1 && Math.random() < 0.12) { kind = 'critique'; v.crit = dk; }
  else if (v.vit.length && Math.random() < 0.22) kind = 'presse';
  let c = B2_RATON;
  if (kind !== 'raton') {
    const pool = BQ_CLIENTS.filter(x => x.lvl <= s.lvl && !b2L.cl.some(y => y.c.id === x.id) && !s.orders.some(o => o.client === x.id));
    const rich = b2MaxRar() >= 2;
    c = bqPick(pool.length ? pool : BQ_CLIENTS, x => (rich ? (x.rich || 1) * (x.rich || 1) : 1) * (1 + Math.min(4, (v.fid[x.id] || { h: 0 }).h) * 0.3));
  }
  b2L.cl.push({ id: 'w' + (++b2L.seq), c, kind, st: 'enter', x: -24, t: now + 60, born: now });
}
function b2Wanted() { return new Set(b2L.cl.map(x => x.want).filter(Boolean)); }
function b2Step(now) {
  const v = b2();
  if (now >= b2L.next && document.visibilityState !== 'hidden') { b2Spawn(now); b2L.next = now + 15000 / (1 + b2Attract() * 0.08) * (0.7 + Math.random() * 0.6); }
  for (const w of b2L.cl.slice()) {
    if (now < w.t) continue;
    if (w.kind === 'raton') {
      if (w.st === 'enter') { w.st = 'sneak'; w.x = 80; w.t = now + 2400; }
      else if (w.st === 'sneak') { const it = v.vit.filter(x => (x.rarity || 0) <= 1)[0]; if (it) { v.vit.splice(v.vit.indexOf(it), 1); w.loot = it; save(); b2Shelf(); } w.st = 'run'; w.x = -26; w.t = now + 4700; }
      else if (w.st === 'run') { if (w.loot) toast(`Le raton a filé avec « ${w.loot.name} » ! La prochaine fois, touchez-le pour le rattraper.`); b2L.cl.splice(b2L.cl.indexOf(w), 1); }
      else b2L.cl.splice(b2L.cl.indexOf(w), 1);
      continue;
    }
    if (w.st === 'enter') { w.st = 'browse'; w.x = B2_BROWSE[b2L.cl.filter(x => x.st === 'browse').length % 2]; w.t = now + 2600 + Math.random() * 2600; }
    else if (w.st === 'browse') {
      const taken = b2Wanted(), free = v.vit.filter(it => !taken.has(it.id));
      if (free.length) { w.want = bqPick(free, it => 1 + (it.rarity || 0) * (w.c.rich || 1)).id; w.st = 'queue'; w.q = now; w.t = now + 1000; }
      else { w.st = 'sigh'; w.empty = 1; w.t = now + 2200; }
    } else if (w.st === 'queue') {
      const P = w.kind === 'presse' ? 14000 : 32000;
      if (!v.vit.some(it => it.id === w.want)) { w.st = 'browse'; w.want = null; w.t = now + 1500; }
      else if (now - w.q > P) { w.st = 'leave'; w.sad = 1; w.want = null; w.x = -26; w.t = now + 2600; }
      else { if (now - w.q > P * 0.6) w.sigh = 1; w.t = now + 1000; }
    } else if (w.st === 'sigh' || w.st === 'joy') { w.st = 'leave'; w.want = null; w.x = -26; w.t = now + 2600; }
    else if (w.st === 'leave') b2L.cl.splice(b2L.cl.indexOf(w), 1);
  }
  // places dans la file de la vitrine
  b2L.cl.filter(w => w.st === 'queue').sort((a, b) => a.q - b.q).forEach((w, i) => { w.x = B2_QV[i] ?? B2_QV[2]; });
}
function b2Bubble(w) {
  const v = b2();
  if (w.kind === 'raton') return w.loot ? itemIcon(w.loot) : '';
  if (w.st === 'joy') return '<svg viewBox="0 0 20 20"><path d="M10 17.5C3 12.5 1.5 9.5 1.5 6.8 1.5 4.2 3.5 2.5 5.8 2.5c1.8 0 3.2 1 4.2 2.6 1-1.6 2.4-2.6 4.2-2.6 2.3 0 4.3 1.7 4.3 4.3 0 2.7-1.5 5.7-8.5 10.7Z" fill="#f08aa6" stroke="#5b4636" stroke-width="1.4"/></svg>';
  if (w.st === 'sigh' || (w.st === 'leave' && w.sad)) return '<svg viewBox="0 0 30 20"><circle cx="8" cy="12" r="5" fill="#e8e2d8"/><circle cx="17" cy="9" r="6" fill="#e8e2d8"/><circle cx="25" cy="12" r="4" fill="#e8e2d8"/></svg>';
  if (w.st === 'queue') { const it = v.vit.find(x => x.id === w.want); return it ? itemIcon(it) : ''; }
  if (w.st === 'browse') return '<svg viewBox="0 0 20 20"><circle cx="5" cy="10" r="2" fill="#5b4636"/><circle cx="10" cy="10" r="2" fill="#5b4636"/><circle cx="15" cy="10" r="2" fill="#5b4636"/></svg>';
  return '';
}
function b2Paint() {
  const layer = document.getElementById('b2layer'); if (!layer) return;
  const now = Date.now(), seen = new Set();
  for (const w of b2L.cl) {
    seen.add(w.id);
    let el = layer.querySelector(`[data-b2w="${w.id}"]`);
    if (!el) {
      el = document.createElement('button'); el.className = 'b2c b2-new'; el.dataset.b2w = w.id;
      el.innerHTML = `<span class="b2b"></span><img src="${clientURI(w.c, 'content')}" alt="">${w.kind === 'critique' ? '<i class="b2tag crit">Critique</i>' : w.kind === 'presse' ? '<i class="b2tag fast">Pressé</i>' : ''}`;
      el.style.left = (w.st === 'enter' ? -24 : w.x) + '%';
      layer.appendChild(el); void el.offsetWidth; el.classList.remove('b2-new');
    }
    el.style.left = w.x + '%';
    el.setAttribute('aria-label', w.kind === 'raton' ? 'Raton voleur : touchez-le pour le rattraper !' : `${w.c.name}${w.st === 'queue' ? ' attend : toucher pour servir' : ''}`);
    const cls = `b2c st-${w.st} k-${w.kind}${w.sigh ? ' sighing' : ''}${w.st === 'queue' ? ' want' : ''}`;
    if (el.className !== cls) el.className = cls;
    const b = b2Bubble(w), key = w.st + (w.want || '') + (w.loot ? 'l' : '') + (w.sad ? 's' : '');
    if (el.dataset.k !== key) { el.dataset.k = key; el.querySelector('.b2b').innerHTML = b; }
    if (w.kind === 'presse' && w.st === 'queue') el.style.setProperty('--pt', Math.max(0, 1 - (now - w.q) / 14000).toFixed(2));
  }
  layer.querySelectorAll('[data-b2w]').forEach(el => { if (!seen.has(el.dataset.b2w)) el.remove(); });
}
function b2Shelf() { const sh = document.querySelector('#b2scene .b2shelf'); if (sh) sh.innerHTML = b2ShelfHTML(); }
function b2Pop(el, txt) {
  try {
    const r = el.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'b2pop'; d.innerHTML = txt; d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + 10) + 'px';
    bqFX().appendChild(d); setTimeout(() => d.remove(), 1400);
  } catch (e) {}
}
function b2Serve(id, el) {
  const w = b2L.cl.find(x => x.id === id); if (!w) return;
  const v = b2(), s = bqState(), now = Date.now();
  if (w.kind === 'raton') {
    if (w.st === 'leave') return;
    if (w.loot) { v.vit.push(w.loot); toast(`Rattrapé ! « ${w.loot.name} » retourne en vitrine. +3 réputation`); } else toast('Ouste ! Le raton détale les mains vides. +3 réputation');
    w.loot = null; s.rep += 3; w.st = 'leave'; w.x = -26; w.t = now + 2000; b2Pop(el, `+3 ${BQ_STAR}`);
    save(); b2Shelf(); b2Paint(); return;
  }
  if (w.st !== 'queue') { if (w.st === 'browse') b2Pop(el, '…'); return; }
  const it = v.vit.find(x => x.id === w.want); if (!it) return;
  const p = b2Price(it), tip = w.kind === 'presse' && now - w.q < 9000 ? Math.max(5, Math.round(p * 0.25)) : 0, lv0 = s.lvl;
  v.vit.splice(v.vit.indexOf(it), 1); v.sold++;
  gainCoins(p + tip); s.earned += p + tip;
  let rep = 1; if (w.kind === 'critique') rep = 12;
  s.rep += rep; s.lvl = bqLevelOf(s.rep);
  bqFly(el, it); bqHearts(el); b2Pop(el, `+${p + tip} ${COIN}${tip ? ' <small>pourboire !</small>' : ''}`);
  b2Heart(w.c.id, 1);
  if (w.kind === 'critique') toast(`Le critique note dans son carnet : « Une boutique délicieuse ! » +${rep} réputation`);
  w.st = 'joy'; w.want = null; w.t = now + 1300;
  save(); b2Shelf(); b2Paint(); try { renderTop(); } catch (e) {}
  if (s.lvl > lv0) bqLevelUp(s.lvl);
  const hb = document.getElementById('b2fid'); if (hb) hb.outerHTML = b2FidHTML();
}

// ---------------- cartes de commande (visuelles) ----------------
function b2Card(o) {
  const c = BQC(o.client), al = bqAllocate(o), ready = al.every((a, i) => a.have >= o.req[i].n), now = Date.now();
  const miss = o.req.find((r, i) => al[i].have < r.n);
  const big = o.req.map((r, i) => { const ok = al[i].have >= r.n; return `<span class="b2ri${ok ? ' ok' : ''}${i === 0 ? ' first' : ''}" style="--rc:${RARC[bqRarity(r)]}" title="${esc(bqReqLabel(r))}">${bqReqIcon(r)}<i>${ok ? '✓' : `${al[i].have}/${r.n}`}</i></span>`; }).join('');
  let bonus = '';
  if (o.bonus && o.bonus.rec) { const r = BQ_RECIPES.find(x => x.id === o.bonus.rec); if (r) bonus = `<span class="b2bon">${itemIcon(bqItemOf(r.out))}</span>`; }
  else if (o.bonus && o.bonus.def) bonus = `<span class="b2bon">${itemIcon(bqItemOf(o.bonus.def, { rarity: 2 }))}</span>`;
  const goLbl = !miss ? '' : miss.k === 'egg' || miss.k === 'comp' ? 'Au marché' : miss.k === 'bait' ? 'Nurserie' : miss.k === 'craft' && canCraft(RECIPES.find(x => x.id === miss.id) || { ing: [], coins: 0 }) ? 'Fabriquer' : 'Partir chercher';
  return `<article class="b2card bq-order${ready ? ' ready' : ''}" data-oid="${o.id}">
    <div class="b2ch"><img src="${clientURI(c, ready ? 'joie' : 'content')}" alt=""><b>${esc(c.name)}</b>${o.deadline ? `<span class="bq-dl" data-bqcd="${o.deadline}">${fmtDur(o.deadline - now)}</span>` : ''}<button class="b2x" data-brefuse="${o.id}" aria-label="Refuser la commande de ${esc(c.name)}">×</button></div>
    <div class="b2big">${big}</div>
    ${miss ? `<p class="b2lbl">${esc(bqReqLabel(miss))}</p>` : '<p class="b2lbl ok">Tout est prêt !</p>'}
    <div class="b2rw">${coins(o.coins)}<span>${BQ_STAR}+${o.rep}</span>${bonus}</div>
    <div class="b2act">${ready ? `<button class="btn green" data-bdeliver="${o.id}">Livrer</button>` : `<button class="btn gold sm" data-bgo="${o.id}">${goLbl}</button><button class="btn cream sm" data-b2where="${o.id}">Où le trouver</button>`}</div>
  </article>`;
}
function b2Where(oid) {
  const o = bqState().orders.find(x => x.id === oid); if (!o) return;
  const al = bqAllocate(o), r = o.req.find((q, i) => al[i].have < q.n); if (!r) return;
  if ((r.k === 'item' || r.k === 'reg') && typeof btInfoModal === 'function') { try { btInfoModal(bqReqLabel(r)); return; } catch (e) {} }
  toast(`${bqReqLabel(r)} : ${bqReqWhere(r) || 'en voyage'}`);
}
function b2FidHTML() {
  const v = b2(), list = Object.entries(v.fid).filter(([id, f]) => f.h > 0 && BQC(id)).sort((a, b) => b[1].h - a[1].h).slice(0, 8);
  if (!list.length) return '<div id="b2fid"></div>';
  return `<div id="b2fid" class="b2fid"><h3 class="bq-h3">Clients fidèles</h3><div class="b2fl">${list.map(([id, f]) => {
    const c = BQC(id), nx = B2_HEART[f.g], prev = f.g ? B2_HEART[f.g - 1] : 0, pc = nx ? Math.round((f.h - prev) / (nx - prev) * 100) : 100;
    const gift = nx ? (f.g % 2 ? '<svg viewBox="0 0 30 30"><path d="M5 8 H25 V24 H5Z" fill="#efe2c4" stroke="#5b4636" stroke-width="2"/><path d="M9 13 h12 M9 17 h8" stroke="#5b4636" stroke-width="1.6"/></svg>' : '<svg viewBox="0 0 30 30"><rect x="5" y="12" width="20" height="13" rx="2" fill="#f08aa6" stroke="#5b4636" stroke-width="2"/><rect x="4" y="8" width="22" height="6" rx="2" fill="#f3aec1" stroke="#5b4636" stroke-width="2"/><path d="M15 8 V25" stroke="#f6c445" stroke-width="3"/></svg>') : '';
    return `<div class="b2f" title="${esc(bqWho(c))}"><img src="${clientURI(c, 'joie')}" alt=""><b>${esc(c.name)}</b><span class="b2hs">${'<i></i>'.repeat(Math.min(4, f.g))}${'<i class="o"></i>'.repeat(Math.max(0, 4 - f.g))}</span><span class="b2fb"><i style="width:${pc}%"></i></span>${gift ? `<span class="b2fg" title="${f.g % 2 ? 'Une rumeur de trésor' : 'Un cadeau'}">${gift}</span>` : ''}</div>`;
  }).join('')}</div></div>`;
}

// ---------------- panneaux : vitrine et décoration ----------------
let b2Pane = '';
function b2PaneHTML() {
  const v = b2();
  if (b2Pane === 'vit') {
    const xs = S.inv.filter(b2Ok).sort((a, b) => (b.rarity || 0) - (a.rarity || 0) || value(b) - value(a));
    return `<div class="b2pane"><div class="b2ph"><b>Vitrine ${v.vit.length}/6</b><span>Touchez un objet pour l’exposer ou le reprendre. Les objets rares attirent des clients plus riches.</span></div>
      <div class="b2vit">${v.vit.map(it => `<button class="b2it on" data-b2un="${it.id}" style="--rc:${RARC[it.rarity || 0]}">${itemIcon(it)}<i>${b2Price(it)}</i></button>`).join('')}${'<span class="b2it vide"></span>'.repeat(6 - v.vit.length)}</div>
      ${xs.length ? `<div class="b2grid">${xs.slice(0, 40).map(it => `<button class="b2it" data-b2ex="${it.id}" style="--rc:${RARC[it.rarity || 0]}" aria-label="Exposer ${esc(it.name)}">${itemIcon(it)}<i>${b2Price(it)}</i></button>`).join('')}</div>` : '<p class="empty">Le sac est vide : vos compagnons rapportent des objets à chaque voyage.</p>'}</div>`;
  }
  if (b2Pane === 'deco') {
    const dIt = S.inv.filter(it => it.cat === 'd' && b2Ok(it));
    let h = `<div class="b2pane"><div class="b2ph"><b>Décorer · attrait ${b2Attract()}</b><span>Plus d’attrait, plus de clients. 3 décorations au maximum.</span></div>`;
    h += `<div class="b2row"><span class="b2rl">Façade <small>${B2_FAC_COST}</small></span>${B2_FAC.map((c, i) => `<button class="b2sw${v.fac === i ? ' on' : ''}" data-b2fac="${i}" style="--c:${c || (bqType() ? bqType().aw : '#d9604f')}" aria-label="Couleur ${i}"></button>`).join('')}</div>`;
    h += `<div class="b2row"><span class="b2rl">Enseigne <small>${B2_SIGN_COST}</small></span>${B2_SIGN.map(([bg, fg, n], i) => `<button class="b2sg${v.sign === i ? ' on' : ''}" data-b2sign="${i}" style="background:${bg};color:${fg}">${n}</button>`).join('')}</div>`;
    h += `<div class="b2grid deco">${B2_DECOS.map(d => { const own = v.dec.includes(d.id), on = v.on.some(o => o.d === d.id); return `<button class="b2dc${on ? ' on' : ''}" data-b2deco="${d.id}"><svg viewBox="0 0 40 40">${b2DecoSVG(d.id)}</svg><b>${esc(d.name)}</b><i>${on ? 'Posée' : own ? 'Poser' : coins(d.price)} · +${d.a}</i></button>`; }).join('')}
      ${dIt.map(it => `<button class="b2dc" data-b2decit="${it.id}">${itemIcon(it)}<b>${esc(it.name)}</b><i>Du sac · +${Math.min(3, 1 + (it.rarity || 0))}</i></button>`).join('')}
      ${v.on.filter(o => o.it).map(o => `<button class="b2dc on" data-b2decoff="${o.it.id}">${itemIcon(o.it)}<b>${esc(o.it.name)}</b><i>Posée</i></button>`).join('')}</div></div>`;
    return h;
  }
  return '';
}
function b2Deco(id) {
  const v = b2(), d = B2_DECOS.find(x => x.id === id); if (!d) return;
  const on = v.on.findIndex(o => o.d === id);
  if (on >= 0) { v.on.splice(on, 1); }
  else if (!v.dec.includes(id)) { if (S.coins < d.price) { toast('Pas assez de pièces pour cette décoration.'); return; } S.coins -= d.price; v.dec.push(id); if (v.on.length < 3) v.on.push({ d: id }); }
  else { if (v.on.length >= 3) { toast('3 décorations au maximum : retirez-en une d’abord.'); return; } v.on.push({ d: id }); }
  save(); renderTop(); renderPanel();
}
function b2DecoItem(id, off) {
  const v = b2();
  if (off) { const o = v.on.find(x => x.it && x.it.id === id); if (o) { v.on.splice(v.on.indexOf(o), 1); S.inv.push(o.it); } }
  else { const it = S.inv.find(x => x.id === id); if (!it || !b2Ok(it)) return; if (v.on.length >= 3) { toast('3 décorations au maximum : retirez-en une d’abord.'); return; } S.inv.splice(S.inv.indexOf(it), 1); v.on.push({ it }); }
  save(); renderPanel();
}
function b2Style(k, i) {
  const v = b2(), cost = k === 'fac' ? B2_FAC_COST : B2_SIGN_COST;
  if (v[k] === i) return;
  if (S.coins < cost) { toast('Pas assez de pièces.'); return; }
  S.coins -= cost; v[k] = i; save(); renderTop(); renderPanel();
}

// ---------------- nouveau Comptoir ----------------
const B2_TOOL = {
  vit: '<path d="M4 8 H26 V25 H4Z" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><path d="M4 16 H26" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="12.5" r="2.4" fill="#f08aa6"/><rect x="16" y="10" width="5" height="5" fill="#9fd1d8"/><circle cx="12" cy="21" r="2.4" fill="#f6c445"/><path d="M18 23 l3 -5 l3 5Z" fill="#7fbf6a"/>',
  deco: '<path d="M8 25 V14 L15 8 L22 14 V25Z" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><path d="M5 15 L15 6 L25 15" fill="none" stroke="#f08aa6" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="18" r="3" fill="#f6c445" stroke="currentColor" stroke-width="1.5"/><path d="M23 5 l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2-.3Z" fill="#f6c445"/>',
};
if (typeof renderComptoir === 'function') renderComptoir = function (box) {
  const s = bqState(); bqTickOrders(); b2Passive(Date.now());
  let h = bqShopsBar() + b2SceneHTML();
  h += `<div class="b2tools"><button class="b2tool${b2Pane === 'vit' ? ' on' : ''}" data-b2pane="vit"><svg viewBox="0 0 30 30">${B2_TOOL.vit}</svg><span>Vitrine <b>${b2().vit.length}/6</b></span></button><button class="b2tool${b2Pane === 'deco' ? ' on' : ''}" data-b2pane="deco"><svg viewBox="0 0 30 30">${B2_TOOL.deco}</svg><span>Décorer</span></button></div>`;
  h += b2PaneHTML();
  const now = Date.now();
  h += `<div class="b2cards">${s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).map(b2Card).join('')}`;
  if (s.orders.length < bqSlots()) h += `<div class="b2card b2wait"><svg viewBox="0 0 30 30">${BQ_ICONS.comptoir}</svg><span>Prochaine commande</span><b data-bqcd="${s.next}">${fmtDur(s.next - now)}</b></div>`;
  h += '</div>' + b2FidHTML() + bqRepHTML();
  box.innerHTML = h;
  setTimeout(b2Paint, 0);
};

// ================= MARCHÉ : place animée =================
let b2Tr = null;
function b2Trends() {
  const wk = Math.floor((Date.now() / 864e5 + 3) / 7);
  if (b2Tr && b2Tr.wk === wk) return b2Tr.list;
  let h = (wk * 7919) % 233280; const r = () => (h = (h * 9301 + 49297) % 233280) / 233280;
  const pool = Object.values(RG_RES).filter(x => x && (x.rar || 0) <= 2 && typeof RG !== 'undefined' && RG[x.region]), list = [];
  for (let n = 0; list.length < 3 && n < 60 && pool.length; n++) { const x = pool[Math.floor(r() * pool.length)]; if (!list.some(o => o.x.region === x.region)) list.push({ x, pct: [40, 30, 20][list.length] }); }
  b2Tr = { wk, list }; return list;
}
if (typeof mkFair === 'function') mkFair = (orig => function (it) {
  const p = orig.apply(this, arguments);
  try { const t = it && it.rid && b2Trends().find(o => o.x.id === it.rid); return t ? mkR5(p * (1 + t.pct / 100)) : p; } catch (e) { return p; }
})(mkFair);
const b2ResIt = x => ({ name: x.name, cat: x.cat, sub: x.sub, rarity: x.rar || 0, color: x.color, rid: x.id, origin: { region: x.region } });
function b2GoStep(step, label) {
  if (!step) { openSheet('voyage'); return; }
  if (step.region) { closeSheet(); if (typeof regionGo === 'function') regionGo(step.region); else openSheet('voyage'); }
  else { if (step.t !== 'craft') closeSheet(); if (typeof goDreamStep === 'function') { try { goDreamStep(step); } catch (e) { openSheet('voyage'); } } else openSheet('voyage'); }
  if (label) setTimeout(() => toast(label), 900);
}
// demandes de joueurs simulés
const b2DemOk = it => b2Ok(it) && !(it.paid > 0);
function b2DemHave(d) { return S.inv.filter(it => b2DemOk(it) && (d.x.rid ? it.rid === d.x.rid : it.name === d.x.name)); }
function b2DemGen() {
  const own = [...new Map(S.inv.filter(it => b2DemOk(it) && ['n', 'm', 'v', 'd'].includes(it.cat)).map(it => [it.rid || it.name, it])).values()];
  let x;
  if (own.length && Math.random() < 0.6) { const it = pick(own); x = { name: it.name, cat: it.cat, sub: it.sub, rarity: it.rarity || 0, color: it.color, look: it.look, rid: it.rid }; if (it.origin) x.origin = { region: it.origin.region }; }
  else { const tr = b2Trends(), pool = Object.values(RG_RES).filter(q => (q.rar || 0) <= 2); const r = tr.length && Math.random() < 0.4 ? pick(tr).x : pick(pool); if (!r) return null; x = b2ResIt(r); }
  const n = x.rarity >= 2 ? 1 : 1 + Math.floor(Math.random() * 3);
  const sel = mkSeller(x.origin && x.origin.region);
  return { id: 'd' + uidGen(), x, n, pay: mkR5(mkFair(x) * n * 1.25), who: sel, exp: Date.now() + (3 + Math.random() * 5) * 3600e3 };
}
function b2Dem() {
  const m = mkState(), now = Date.now();
  if (!Array.isArray(m.dem)) m.dem = [];
  if (typeof m.demNext !== 'number') m.demNext = 0;
  m.dem = m.dem.filter(d => d && d.x && (d.done ? now - d.done < 4000 : d.exp > now));
  let k = 0;
  while (m.dem.filter(d => !d.done).length < 3 && now >= m.demNext && k++ < 5) { const d = b2DemGen(); if (!d) break; m.dem.push(d); }
  return m.dem;
}
function b2DemServe(id) {
  const m = mkState(), d = (m.dem || []).find(x => x.id === id); if (!d || d.done) return;
  const have = b2DemHave(d).sort((a, b) => (a.rarity || 0) - (b.rarity || 0)); if (have.length < d.n) return;
  have.slice(0, d.n).forEach(it => S.inv.splice(S.inv.indexOf(it), 1));
  gainCoins(d.pay); m.earned += d.pay; m.sold++; d.done = Date.now(); m.demNext = Date.now() + 8 * 60e3;
  save(); renderTop(); renderPanel();
  toast(`${d.who.name} est ravi·e : +${d.pay} pièces !`);
}
// l'enchère du jour (une nouvelle toutes les 2 heures)
const B2_AW = 2 * 3600e3;
function b2Auc(now) {
  const m = mkState(); let a = m.auc;
  if (a && (!a.lot || !a.lot.data)) a = m.auc = null;
  if (!a || (a.done && now >= a.next)) {
    const cands = [];
    for (let i = 0; i < 8; i++) { try { const l = mkGen(pick(['comp', 'comp', 'res', 'mode']), ''); if (l && (l.kind === 'comp' || l.kind === 'item')) cands.push(l); } catch (e) {} }
    if (!cands.length) return null;
    cands.sort((x, y) => ((y.data.rarity || 0) + (y.data.hybrid ? 2 : 0) + (y.data.genes ? 1 : 0)) - ((x.data.rarity || 0) + (x.data.hybrid ? 2 : 0) + (x.data.genes ? 1 : 0)));
    const lot = cands[0], fair = lot.fair || lot.price || 100;
    let end = (Math.floor(now / B2_AW) + 1) * B2_AW; if (end - now < 15 * 60e3) end += B2_AW;
    a = m.auc = { id: 'a' + uidGen(), lot, fair, bid: mkR5(fair * 0.45), who: lot.seller ? lot.seller.name : 'Yuki', me: false, mine: 0, max: mkR5(fair * (0.95 + Math.random() * 0.35)), end, nb: now + 5000, n: 0 };
  }
  return a;
}
const b2Step5 = a => Math.max(5, mkR5(a.bid * 0.06));
function b2AucTick(now) {
  const m = mkState(), a = m.auc; if (!a || a.done) return false;
  if (now >= a.end) {
    a.done = 1; a.next = a.end + 60e3;
    if (a.me) {
      if (S.coins >= a.bid) { const l = Object.assign({}, a.lot, { id: 'm' + uidGen(), price: a.bid }); m.list.push(l); mkBuy(l.id); toast(`Enchère remportée pour ${a.bid} pièces !`); }
      else toast('Enchère remportée… mais il manque des pièces : le lot repart.');
    } else if (a.mine) toast(`${a.who} a remporté l’enchère à ${a.bid} pièces.`);
    save(); return true;
  }
  if (now < a.nb) return false;
  const nx = a.bid + b2Step5(a);
  if (nx <= a.max && (a.me || nx < a.max * 0.72)) {
    a.bid = nx; a.me = false; a.n++; a.who = mkSeller('').name;
    if (a.end - now < 15000) a.end = now + 15000;
    a.nb = now + (a.mine ? 3000 + Math.random() * 4000 : 9000 + Math.random() * 16000);
    return true;
  }
  a.nb = now + 5000; return false;
}
function b2Bid() {
  const a = mkState().auc, now = Date.now(); if (!a || a.done || a.me) return;
  const nx = a.bid + b2Step5(a);
  if (S.coins < nx) { toast('Pas assez de pièces pour surenchérir.'); return; }
  a.bid = nx; a.me = true; a.mine = 1; a.who = 'Vous'; a.n++; a.nb = now + 2500 + Math.random() * 4000;
  if (a.end - now < 15000) a.end = now + 15000;
  save(); b2AucPaint(true);
}
function b2AucHTML() {
  const a = b2Auc(Date.now()); if (!a) return '';
  const l = a.lot, d = l.data, nx = a.bid + b2Step5(a);
  const title = l.kind === 'comp' ? `${d.name || spName(d.sp)}${d.hybrid ? ' · hybride' : d.genes ? ' · variante' : ''}` : d.name;
  return `<div class="b2auc${a.done ? ' done' : ''}" id="b2auc"><div class="b2aimg" style="--rc:${RARC[d.rarity || 0]}">${mkIcon(l)}</div><div class="b2ax"><b>${esc(title)}</b><span class="b2ar">${RARITY[d.rarity || 0] || ''}</span>
    <div class="b2abid"><span data-b2a="bid">${coins(a.bid)}</span><small data-b2a="who">${a.me ? 'Vous menez !' : esc(a.who)}</small></div>
    <span class="b2acd">${a.done ? 'Terminée' : `<b data-bqcd="${a.end}">${fmtDur(a.end - Date.now())}</b>`}</span></div>
    ${a.done ? '' : `<button class="btn ${a.me ? 'cream' : 'gold'} b2abtn" data-b2bid="1" ${a.me ? 'disabled' : ''}>${a.me ? 'En tête' : `Enchérir ${coins(nx)}`}</button>`}</div>`;
}
function b2AucPaint(flash) {
  const el = document.getElementById('b2auc'); if (!el) return;
  const n = document.createElement('div'); n.innerHTML = b2AucHTML(); const ne = n.firstElementChild; if (!ne) return;
  if (flash) ne.classList.add('flash');
  el.replaceWith(ne);
}
// la place : des étals par région, avec un vendeur et ses articles
function b2PlaceHTML() {
  const m = mkState(), g = new Map();
  m.list.forEach(l => { const r = (l.seller && l.seller.region) || l.region; if (!r || !RG[r]) return; if (!g.has(r)) g.set(r, []); g.get(r).push(l); });
  const st = [...g.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 4);
  return `<div class="b2place"><div class="b2bunt"></div>${st.map(([r, ls], i) => {
    const R = RG[r], c = BQ_CLIENTS[(mkHash(r) + i * 7) % BQ_CLIENTS.length];
    const cat = Object.entries(ls.reduce((o, l) => (o[l.cat] = (o[l.cat] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1])[0][0];
    return `<button class="b2stall" data-b2stall="${r}:${cat}" style="--aw:${R.color};animation-delay:${i * 0.4}s"><span class="b2aw"></span><img class="b2sel" src="${clientURI(c, 'content')}" alt=""><span class="b2goods">${ls.slice(0, 3).map(l => `<span class="b2g">${mkIcon(l)}<i>${l.price}</i></span>`).join('')}</span><span class="b2flag">${rgIcon(R, 's')}${esc(R.short)}</span></button>`;
  }).join('')}</div>`;
}
function b2MarcheHTML() {
  const m = mkState(); mkProcess(); mkRotate();
  const online = 1180 + Math.round(240 * Math.sin(Date.now() / 3.6e6)) + (mkHash(dayKey()) % 90);
  let h = `<div class="mk-ban"><span class="mk-glob" aria-hidden="true"><svg viewBox="0 0 30 30">${MK_CATS[2][2]}</svg></span><div><b>Place du marché <span>(simulé)</span></b><small>${online.toLocaleString('fr-FR')} voyageurs simulés · ${m.list.length} annonces</small></div></div>`;
  h += b2PlaceHTML();
  const tr = b2Trends();
  if (tr.length) h += `<h3 class="bq-h3">À la mode cette semaine</h3><div class="b2trs">${tr.map(t => `<div class="b2tr"><span class="b2tri">${itemIcon(b2ResIt(t.x))}</span><b>${esc(t.x.name)}</b><em>+${t.pct} %</em><span class="b2trf">${rgIcon(RG[t.x.region], 's')}${esc(RG[t.x.region].short)}</span><button class="btn cream sm" data-b2trend="${t.x.id}">Où la trouver</button></div>`).join('')}</div>`;
  h += `<h3 class="bq-h3">Enchère</h3>` + b2AucHTML();
  const dem = b2Dem();
  h += `<h3 class="bq-h3">Ils cherchent…</h3><div class="b2dems">${dem.map(d => {
    const have = b2DemHave(d).length, ok = have >= d.n, R = RG[d.who.region];
    return `<div class="b2dem${d.done ? ' done' : ''}${ok ? ' ok' : ''}"><span class="b2who">${R ? rgIcon(R, 's') : ''}<b>${esc(d.who.name)}</b></span><span class="b2di" style="--rc:${RARC[d.x.rarity || 0]}">${itemIcon(d.x)}<i>×${d.n}</i></span><span class="b2dn">${esc(d.x.name)}</span><span class="b2dp">${coins(d.pay)}</span>${d.done ? '<span class="b2dok">Servi !</span>' : ok ? `<button class="btn green sm" data-b2dem="${d.id}">Servir</button>` : `<button class="btn cream sm" data-b2demw="${d.id}">${have}/${d.n} · Où ?</button>`}</div>`;
  }).join('') || '<p class="empty">Pas de demande pour l’instant.</p>'}</div>`;
  h += `<div class="filters mk-views"><button data-mkview="place" aria-pressed="true">Place</button><button data-mkview="acheter" aria-pressed="false">Acheter</button><button data-mkview="vendre" aria-pressed="false">Vendre</button><button data-mkview="annonces" aria-pressed="false">Mes annonces</button></div>`;
  h += `<div class="mk-cats" role="tablist">${MK_CATS.map(([k, l, ic]) => `<button role="tab" data-b2mk="${k}" aria-selected="false"><svg viewBox="0 0 30 30" aria-hidden="true">${ic}</svg><span>${l}</span></button>`).join('')}</div>`;
  h += `<p class="small">Vendeurs, demandes et enchérisseurs sont simulés en attendant de vrais joueurs.</p>`;
  return h;
}
if (typeof renderMarche === 'function') {
  try { mkView = 'place'; } catch (e) {}
  renderMarche = (orig => function (box) {
    const m = mkState();
    if (mkView !== 'place' || (m.unseen && mkAuto !== m.sold)) {
      orig.apply(this, arguments);
      const vb = box.querySelector('.mk-views'); if (vb) vb.insertAdjacentHTML('afterbegin', '<button data-mkview="place" aria-pressed="false">Place</button>');
      return;
    }
    box.innerHTML = b2MarcheHTML();
  })(renderMarche);
}

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-b2w],[data-b2ord],[data-b2pane],[data-b2ex],[data-b2un],[data-b2deco],[data-b2decit],[data-b2decoff],[data-b2fac],[data-b2sign],[data-b2logok],[data-b2where],[data-b2stall],[data-b2trend],[data-b2dem],[data-b2demw],[data-b2bid],[data-b2mk]');
  if (!el || el.disabled) return;
  const d = el.dataset, body = $('panelBody'), top = body ? body.scrollTop : 0, keep = () => { if (body) body.scrollTop = top; };
  if (d.b2w) return b2Serve(d.b2w, el);
  if (d.b2ord) {
    const o = bqState().orders.find(x => x.id === d.b2ord); if (!o) return;
    if (bqReady(o)) return bqDeliver(o.id, el);
    const card = document.querySelector(`.b2card[data-oid="${o.id}"]`); if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.remove('b2flash'); void card.offsetWidth; card.classList.add('b2flash'); }
    return;
  }
  if (d.b2pane) { b2Pane = b2Pane === d.b2pane && !el.closest('.b2scene') ? '' : d.b2pane; renderPanel(); keep(); if (b2Pane) { const p = document.querySelector('.b2pane'); if (p && el.closest('.b2scene')) p.scrollIntoView({ block: 'nearest' }); } return; }
  if (d.b2ex) { b2Expose(d.b2ex); keep(); return; }
  if (d.b2un) { b2Unexpose(d.b2un); keep(); return; }
  if (d.b2deco) { b2Deco(d.b2deco); keep(); return; }
  if (d.b2decit) { b2DecoItem(d.b2decit); keep(); return; }
  if (d.b2decoff) { b2DecoItem(d.b2decoff, true); keep(); return; }
  if (d.b2fac) { b2Style('fac', +d.b2fac); keep(); return; }
  if (d.b2sign) { b2Style('sign', +d.b2sign); keep(); return; }
  if (d.b2logok) { b2().log.forEach(x => { x.seen = 1; }); save(); const t = el.closest('.b2tick'); if (t) t.remove(); return; }
  if (d.b2where) return b2Where(d.b2where);
  if (d.b2stall) { const [r, cat] = d.b2stall.split(':'); mkView = 'acheter'; mkCat = cat; mkRegion = cat === 'res' ? r : ''; mkSp = ''; renderPanel(); if (body) body.scrollTop = 0; return; }
  if (d.b2mk) { mkView = 'acheter'; mkCat = d.b2mk; mkSp = ''; renderPanel(); if (body) body.scrollTop = 0; return; }
  if (d.b2trend) { const x = RG_RES[d.b2trend]; if (x) b2GoStep(bqStepFor({ k: 'reg', rid: x.id, src: { region: x.region } }), `${x.name} : spécialité ${rgDe(RG[x.region])}. Choisissez un compagnon et partez !`); return; }
  if (d.b2dem) { b2DemServe(d.b2dem); keep(); return; }
  if (d.b2demw) {
    const dm = (mkState().dem || []).find(x => x.id === d.b2demw); if (!dm) return;
    if (typeof btInfoModal === 'function') { try { btInfoModal(dm.x.name); return; } catch (e) {} }
    if (dm.x.rid && RG_RES[dm.x.rid]) { const x = RG_RES[dm.x.rid]; b2GoStep(bqStepFor({ k: 'reg', rid: x.id, src: { region: x.region } }), `${x.name} : spécialité ${rgDe(RG[x.region])}.`); }
    else toast(`${dm.x.name} : cherchez-en en voyage.`);
    return;
  }
  if (d.b2bid) return b2Bid();
});

// ---------------- horloge (1 s) ----------------
function b2Tick() {
  try {
    const now = Date.now(), sc = document.getElementById('b2scene');
    if (sc) { b2().last = now; b2Step(now); b2Paint(); }
    else {
      if (b2L.cl.length) { const v = b2(); b2L.cl.forEach(w => { if (w.loot) v.vit.push(w.loot); }); b2L.cl = []; }
      b2L.next = now + 1500;
      if (now % 15000 < 1000) b2Passive(now);
    }
    if (b2AucTick(now)) { save(); b2AucPaint(true); }
  } catch (e) { console.error('boutique2', e); }
}
setInterval(b2Tick, 1000);
try { b2(); } catch (e) {}

// ---------------- styles ----------------
(function b2CSS() {
  const st = document.createElement('style');
  st.textContent = `
.b2scene{position:relative;aspect-ratio:360/230;border:2.5px solid var(--ink);border-radius:18px;overflow:hidden;margin:4px 0 8px;box-shadow:0 4px 0 rgba(91,70,54,.18);background:#f8e6cc;user-select:none}
.b2bg,.b2bg svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.b2-bell{transform-origin:34px 70px;animation:b2swing 3s ease-in-out infinite}
@keyframes b2swing{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(14deg)}92%{transform:rotate(-12deg)}}
.b2-me{animation:b2breath 3.4s ease-in-out infinite;transform-origin:182px 146px}
@keyframes b2breath{50%{transform:translateY(1.5px)}}
.b2-fish{animation:b2fish 4s ease-in-out infinite}@keyframes b2fish{50%{transform:translateX(-6px)}}
.b2-neon{filter:drop-shadow(0 0 3px #ff8fd0)}
.b2shelf{position:absolute;inset:0;pointer-events:none}
.b2v{position:absolute;width:8.6%;aspect-ratio:1;padding:0;border:0;background:none;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 2px 0 rgba(91,70,54,.25))}
.b2v svg{width:100%;height:100%}
.b2v.empty{border:2px dashed #b9a68a;border-radius:10px;color:#a8927a;font:800 18px/1 'Baloo 2',sans-serif;background:rgba(255,248,234,.5)}
.b2layer{position:absolute;inset:0;pointer-events:none}
.b2c{position:absolute;bottom:0;width:19%;padding:0;border:0;background:none;pointer-events:auto;cursor:pointer;transition:left 2.3s linear;-webkit-tap-highlight-color:transparent}
.b2c.b2-new{transition:none}
.b2c img{width:100%;display:block;animation:b2idle 2.4s ease-in-out infinite;transform-origin:50% 100%}
.b2c.st-enter img,.b2c.st-leave img,.b2c.st-sneak img{animation:b2walk .42s ease-in-out infinite}
.b2c.st-browse img{animation:b2look 1.6s ease-in-out infinite}
.b2c.st-joy img{animation:b2jump .5s ease-out 2}
.b2c.k-raton.st-run{transition:left 4.6s cubic-bezier(.4,0,.9,.6)}
.b2c.k-raton img{filter:saturate(.7)}
.b2c.k-raton.st-run img{animation:b2walk .22s ease-in-out infinite}
.b2c.sighing img,.b2c.st-sigh img{filter:grayscale(.35) brightness(.96);animation:b2sigh 2s ease-in-out infinite}
@keyframes b2idle{50%{transform:scaleY(.975)}}
@keyframes b2walk{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6%) rotate(3deg)}}
@keyframes b2look{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes b2jump{50%{transform:translateY(-16%)}}
@keyframes b2sigh{50%{transform:translateY(3%) scaleY(.96)}}
.b2b{position:absolute;left:50%;bottom:92%;transform:translateX(-50%);width:62%;aspect-ratio:1;background:#fff;border:2px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;padding:7%;box-sizing:border-box;box-shadow:0 2px 0 rgba(91,70,54,.2);animation:b2pop .35s ease-out}
.b2b:empty{display:none}
.b2b svg{width:100%;height:100%}
.b2b::after{content:'';position:absolute;bottom:-7px;left:44%;border:5px solid transparent;border-top:6px solid var(--ink)}
@keyframes b2pop{0%{transform:translateX(-50%) scale(.3)}70%{transform:translateX(-50%) scale(1.12)}}
.b2c.want .b2b{border-color:#3a8f5a;animation:b2pop .35s ease-out,b2pulse 1.4s ease-in-out infinite .4s}
.b2c.k-presse.want .b2b{background:conic-gradient(#ffe1a8 calc(var(--pt,1)*360deg),#fff 0)}
@keyframes b2pulse{50%{box-shadow:0 0 0 4px rgba(95,191,127,.35)}}
.b2c.ord.ready .b2b{border-color:#3a8f5a;animation:b2pulse 1.4s ease-in-out infinite}
.b2tag{position:absolute;top:-4%;right:-6%;font:800 9.5px/1 'Baloo 2',sans-serif;padding:2px 5px;border-radius:8px;border:1.5px solid var(--ink);font-style:normal}
.b2tag.crit{background:#2b2140;color:#fff}.b2tag.fast{background:#ffe1a8}
.b2more{position:absolute;bottom:4%;font:800 12px 'Baloo 2',sans-serif;background:#fff8ea;border:2px solid var(--ink);border-radius:10px;padding:0 6px}
.b2attr{position:absolute;left:2%;top:13%;display:flex;align-items:center;gap:2px;background:rgba(255,248,234,.92);border:1.5px solid var(--ink);border-radius:10px;padding:1px 6px;font:700 10.5px 'Baloo 2',sans-serif}
.b2attr i{width:8px;height:8px;background:#f08aa6;border-radius:50%;border:1px solid var(--ink)}
.b2attr b{margin-left:3px}
.b2hint{position:absolute;right:2%;top:58%;width:32%;font:700 10.5px/1.15 'Baloo 2',sans-serif;background:#fff8ea;border:2px solid var(--ink);border-radius:10px;padding:4px 6px;animation:b2pulse 2s infinite;cursor:pointer}
.b2tick{position:absolute;left:50%;top:22%;transform:translateX(-50%);background:#fff8ea;border:2.5px solid var(--ink);border-radius:14px;padding:6px 10px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;box-shadow:0 4px 0 rgba(91,70,54,.2);animation:b2pop2 .5s ease-out;z-index:3}
@keyframes b2pop2{0%{transform:translateX(-50%) scale(.5);opacity:0}}
.b2ti{display:flex;gap:2px}.b2ti svg{width:26px;height:26px}
.b2pop{position:fixed;z-index:60;transform:translateX(-50%);font:800 16px 'Baloo 2',sans-serif;color:#7a4a12;background:#fff3c4;border:2px solid #5b4636;border-radius:12px;padding:1px 8px;pointer-events:none;animation:b2up 1.4s ease-out forwards;white-space:nowrap}
.b2pop svg{width:14px;height:14px;vertical-align:-2px}.b2pop small{font-size:10px}
@keyframes b2up{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1}100%{opacity:0;transform:translate(-50%,-60px)}}
.b2tools{display:flex;gap:6px;margin:0 0 8px}
.b2tool{flex:1;display:flex;align-items:center;gap:6px;justify-content:center;border:2px solid var(--ink);border-radius:14px;background:#fff8ea;padding:5px 8px;font:700 13px 'Baloo 2',sans-serif;cursor:pointer}
.b2tool svg{width:26px;height:26px}.b2tool.on{background:#ffe1ec}
.b2pane{border:2px solid var(--ink);border-radius:14px;background:#fffaf1;padding:8px;margin:0 0 10px}
.b2ph{display:flex;flex-direction:column;margin-bottom:6px}.b2ph span{font-size:11.5px;color:var(--ink2)}
.b2vit{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:6px;background:#e3b07a33;border-radius:10px;margin-bottom:6px}
.b2grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:5px;max-height:220px;overflow:auto}
.b2it{position:relative;aspect-ratio:1;border:2px solid var(--rc,#cbbfae);border-radius:10px;background:#fff;padding:3px;cursor:pointer}
.b2it svg{width:100%;height:100%}.b2it.vide{border-style:dashed;background:none}
.b2it i{position:absolute;bottom:-2px;right:-2px;font:800 9.5px/1 'Baloo 2',sans-serif;background:#fff3c4;border:1px solid var(--ink);border-radius:6px;padding:1px 3px;font-style:normal}
.b2it.on{box-shadow:0 0 0 2px #fff,0 0 0 4px #5fbf7f}
.b2row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:6px}
.b2rl{font:700 12px 'Baloo 2',sans-serif;min-width:70px}.b2rl small{color:var(--ink2)}
.b2sw{width:26px;height:26px;border-radius:50%;border:2px solid var(--ink);background:var(--c);cursor:pointer}
.b2sw.on,.b2sg.on{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--ink)}
.b2sg{border:2px solid var(--ink);border-radius:8px;font:800 11px 'Baloo 2',sans-serif;padding:2px 7px;cursor:pointer}
.b2grid.deco{grid-template-columns:repeat(auto-fill,minmax(86px,1fr));max-height:none}
.b2dc{display:flex;flex-direction:column;align-items:center;border:2px solid #cbbfae;border-radius:12px;background:#fff;padding:4px;cursor:pointer;font-size:11px}
.b2dc svg{width:40px;height:40px}.b2dc b{font-size:11.5px;line-height:1.1;text-align:center}.b2dc i{font-style:normal;color:var(--ink2);font-size:10.5px}
.b2dc.on{border-color:#5fbf7f;background:#effaf2}
.b2cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:10px}
.b2card{position:relative;border:2.5px solid var(--ink);border-radius:16px;background:#fff8ea;padding:6px 8px 8px;display:flex;flex-direction:column;gap:4px}
.b2card.ready{background:#effaf2;border-color:#3a8f5a}
.b2card.b2flash{animation:b2fl 1s ease-out}@keyframes b2fl{30%{box-shadow:0 0 0 6px #f6c445}}
.b2ch{display:flex;align-items:center;gap:5px}.b2ch img{width:34px;height:34px;border-radius:50%;background:#fff;border:1.5px solid var(--ink)}.b2ch b{font-size:13px;flex:1;line-height:1.1}
.b2x{border:0;background:none;font-size:18px;line-height:1;color:var(--ink2);cursor:pointer;padding:0 2px}
.b2big{display:flex;justify-content:center;gap:4px;flex-wrap:wrap}
.b2ri{position:relative;width:44px;height:44px;border:2px solid var(--rc);border-radius:12px;background:#fff;padding:3px}
.b2ri.first{width:66px;height:66px}.b2ri svg{width:100%;height:100%}
.b2ri i{position:absolute;bottom:-5px;right:-5px;font:800 10.5px/1 'Baloo 2',sans-serif;background:#fff;border:1.5px solid var(--ink);border-radius:8px;padding:2px 4px;font-style:normal}
.b2ri.ok i{background:#5fbf7f;color:#fff}
.b2lbl{margin:2px 0 0;text-align:center;font:700 12px/1.15 'Baloo 2',sans-serif}.b2lbl.ok{color:#2f7f6c}
.b2rw{display:flex;justify-content:center;align-items:center;gap:8px;font-weight:800;font-size:13px}.b2rw .bq-star{width:14px;height:14px;vertical-align:-2px}
.b2bon svg{width:22px;height:22px}
.b2act{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}.b2act .btn{flex:1;min-width:0;white-space:nowrap}
.b2wait{align-items:center;justify-content:center;border-style:dashed;background:none;font-size:12px;color:var(--ink2)}.b2wait svg{width:30px;height:30px;opacity:.6}
.b2fl{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}
.b2f{position:relative;flex:0 0 74px;display:flex;flex-direction:column;align-items:center;border:2px solid var(--ink);border-radius:12px;background:#fff8ea;padding:4px}
.b2f img{width:48px;height:48px}.b2f b{font-size:11px;line-height:1.1;text-align:center}
.b2hs{display:flex;gap:2px;margin:2px 0}.b2hs i{width:9px;height:9px;background:#f08aa6;border:1px solid var(--ink);border-radius:50% 50% 50% 0;transform:rotate(-45deg)}.b2hs i.o{background:#fff}
.b2fb{width:90%;height:5px;border-radius:3px;background:#efe2c4;overflow:hidden}.b2fb i{display:block;height:100%;background:#f08aa6}
.b2fg{position:absolute;top:-6px;right:-6px;width:22px;height:22px}.b2fg svg{width:100%;height:100%}
.b2place{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:26px 8px 10px;border:2.5px solid var(--ink);border-radius:18px;background:linear-gradient(#bfe1f2 0 30%,#e9d6b8 30%);background-image:linear-gradient(#bfe1f2 0 22%,transparent 22%),radial-gradient(circle at 10px 10px,#d9c29e 3px,transparent 3.5px);background-size:auto,20px 20px;background-color:#e9d6b8;margin-bottom:8px;overflow:hidden}
.b2bunt{position:absolute;top:0;left:0;right:0;height:18px;background:repeating-linear-gradient(90deg,#f08aa6 0 14px,#f6c445 14px 28px,#5fbf7f 28px 42px,#5f9fd0 42px 56px);clip-path:polygon(0 0,100% 0,100% 30%,${Array.from({ length: 24 }, (_, i) => `${100 - (i + 0.5) * 100 / 24}% 100%,${100 - (i + 1) * 100 / 24}% 30%`).join(',')})}
.b2stall{position:relative;display:flex;flex-direction:column;align-items:center;border:2px solid var(--ink);border-radius:12px 12px 8px 8px;background:#fff8ea;padding:22px 4px 4px;cursor:pointer;overflow:visible}
.b2aw{position:absolute;top:-2px;left:-2px;right:-2px;height:20px;border:2px solid var(--ink);border-radius:10px 10px 0 0;background:repeating-linear-gradient(90deg,var(--aw) 0 12px,#fff8ea 12px 24px)}
.b2sel{width:56px;height:56px;margin-bottom:-6px;animation:b2look 2.6s ease-in-out infinite;animation-delay:inherit}
.b2goods{display:flex;gap:3px;background:#c98a5a;border:2px solid var(--ink);border-radius:6px;padding:3px;width:100%;justify-content:center;box-sizing:border-box}
.b2g{position:relative;width:34px;height:34px;background:#fff8ea;border-radius:6px}.b2g svg{width:100%;height:100%}
.b2g i{position:absolute;bottom:-4px;right:-3px;font:800 9px/1 'Baloo 2',sans-serif;background:#fff3c4;border:1px solid var(--ink);border-radius:5px;padding:1px 2px;font-style:normal}
.b2flag{display:flex;align-items:center;gap:3px;font:700 11px 'Baloo 2',sans-serif;margin-top:3px}
.b2trs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.b2tr{display:flex;flex-direction:column;align-items:center;gap:2px;border:2px solid var(--ink);border-radius:12px;background:#fff8ea;padding:5px 4px;text-align:center;font-size:11px}
.b2tri svg{width:40px;height:40px}.b2tr b{font-size:11.5px;line-height:1.1}.b2tr em{font:800 15px 'Baloo 2',sans-serif;color:#2f7f6c;font-style:normal;animation:b2pulse 2s infinite;border-radius:8px;padding:0 4px}
.b2trf{display:flex;align-items:center;gap:2px;font-size:10.5px}.b2tr .btn{font-size:10.5px;padding:3px 6px}
.b2auc{display:flex;align-items:center;gap:8px;border:2.5px solid var(--ink);border-radius:16px;background:linear-gradient(135deg,#fff3c4,#ffe1ec);padding:8px;margin-bottom:6px;flex-wrap:wrap}
.b2auc.flash{animation:b2fl .8s ease-out}.b2auc.done{opacity:.7}
.b2aimg{width:72px;height:72px;border:2.5px solid var(--rc);border-radius:14px;background:#fff;padding:3px;flex:none}.b2aimg svg{width:100%;height:100%}
.b2ax{flex:1;min-width:120px;display:flex;flex-direction:column}.b2ax b{font-size:14px;line-height:1.1}.b2ar{font-size:11px;color:var(--ink2)}
.b2abid{display:flex;align-items:baseline;gap:6px;font:800 18px 'Baloo 2',sans-serif}.b2abid small{font-size:11px;font-weight:700;color:var(--ink2)}
.b2acd b{font:800 13px 'Baloo 2',sans-serif;color:#b0482f}
.b2abtn{flex-basis:100%}
.b2dems{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.b2dem{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:'i w p' 'i n b';align-items:center;gap:0 8px;border:2px solid var(--ink);border-radius:14px;background:#fff8ea;padding:5px 8px}
.b2dem.ok{background:#effaf2}.b2dem.done{opacity:.6}
.b2who{grid-area:w;display:flex;align-items:center;gap:3px;font-size:12px}.b2di{grid-area:i;position:relative;width:46px;height:46px;border:2px solid var(--rc);border-radius:12px;background:#fff;padding:2px}.b2di svg{width:100%;height:100%}
.b2di i{position:absolute;bottom:-5px;right:-6px;font:800 11px/1 'Baloo 2',sans-serif;background:#fff3c4;border:1.5px solid var(--ink);border-radius:8px;padding:2px 4px;font-style:normal}
.b2dn{grid-area:n;font:700 12px/1.1 'Baloo 2',sans-serif}.b2dp{grid-area:p;font-weight:800}.b2dem .btn,.b2dok{grid-area:b}.b2dok{color:#2f7f6c;font-weight:800}
@media (prefers-reduced-motion:reduce){.b2c,.b2c img,.b2sel,.b2b,.b2-bell,.b2-me,.b2-fish{animation:none!important;transition:none!important}}
@media (min-width:700px){.b2scene{max-width:640px;margin-left:auto;margin-right:auto}.b2place{grid-template-columns:repeat(4,1fr)}}
`;
  document.head.appendChild(st);
})();

window.__bq2 = { b2, L: b2L, serve: b2Serve, passive: b2Passive, expose: b2Expose, dem: b2Dem, auc: b2Auc, trends: b2Trends, attract: b2Attract, price: b2Price, step: b2Step, paint: b2Paint };

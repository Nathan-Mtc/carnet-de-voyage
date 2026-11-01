// ================= BOUTIQUE VIVANTE (v17, allégée en v19) =================
// Le Comptoir est une scène dessinée : les clients qui ont passé commande attendent devant le comptoir, avec une
// bulle-image (toucher = livrer ou voir la commande). Clients fidèles : cœurs, cadeaux, rumeurs de trésor.
// v19 : la vitrine, les ventes passives et la décoration du commerce sont retirées. Les objets exposés ou posés
// reviennent dans le sac, les anciennes décorations achetées aussi (en objets « déco ») ; rien n'est remboursé.
// Le Marché mondial : place du marché (étals par région, tendances, enchère) et onglet « Quêtes » (demandes des voyageurs).
// État : S.shop.v2.fid (fidélité) et S.mkt.dem / S.mkt.auc (marché). Anciennes sauvegardes : migrées une fois (v2.mig19).
// Économie : les quêtes refusent les objets achetés ; l'enchère reste sous le prix juste × 1,3. Les trésors uniques sont exclus.

const B2_HEART = [3, 7, 12, 18];
const B2_INK = '#5b4636';
// anciennes décorations achetées (v17) : [nom, sous-type, rareté, couleur, prix payé]
const B2_OLD_DECOS = { plante: ['Grande plante', 'plante', 1, '#6fae7d', 80], tableau: ['Tableau', 'herbier', 1, '#e3b07a', 150], lampions: ['Lampions', 'lanterne', 1, '#f6c445', 120], horloge: ['Horloge', 'statue', 2, '#e3b07a', 180], aquarium: ['Aquarium', 'bocal', 2, '#9fd1e8', 320], tapis: ['Tapis rond', 'tapis', 1, '#d9604f', 140] };

function b2() {
  const s = bqState();
  if (!s.v2 || typeof s.v2 !== 'object') s.v2 = {};
  const v = s.v2;
  if (!v.fid || typeof v.fid !== 'object') v.fid = {};
  if (!v.mig19) {
    // migration v19 : tout ce qui était en vitrine ou posé en décoration revient dans le sac
    v.mig19 = 1; let back = 0;
    (Array.isArray(v.vit) ? v.vit : []).forEach(it => { if (it && it.id) { S.inv.push(it); back++; } });
    (Array.isArray(v.on) ? v.on : []).forEach(o => { if (o && o.it && o.it.id) { S.inv.push(o.it); back++; } });
    (Array.isArray(v.dec) ? v.dec : []).forEach(id => {
      const d = B2_OLD_DECOS[id]; if (!d) return;
      const it = makeItem([d[0], 'd', d[1], d[2], null, d[3]], 1, 'Ancienne décoration de la boutique', [], { fixed: d[2] });
      it.paid = d[4]; S.inv.push(it); back++; // revente plafonnée au prix payé : pas de boucle d'argent
    });
    ['vit', 'on', 'dec', 'fac', 'sign', 'log', 'acc', 'last', 'sold', 'thief', 'crit'].forEach(k => { delete v[k]; });
    if (back) { try { save(); } catch (e) {} }
  }
  return v;
}
// vendable aux quêtes du marché : ni trésor unique, ni bout de carte, ni œuf, ni vêtement porté
const b2Ok = it => !!(it && it.id && !it.tresor && it.cat !== 't' && it.cat !== 'o' && !it.cap && !bqWorn().has(it.id));

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
      const T = bqType(), st = T ? T.stars.filter(Array.isArray) : [];
      const def = st.length ? st[g === 0 ? 0 : st.length - 1] : ['Petit bouquet', 'm', 'fleur', 1, null, '#f3aec1'];
      const it = makeItem(def, 1, `Cadeau de ${c.name}`, [], { fixed: Math.max(g === 0 ? 1 : 2, def[3] || 0) });
      S.inv.push(it); S.dex[it.name] = true;
      toast(`${c.name} vous offre « ${it.name} » ! Votre amitié grandit.`); msg = 'cadeau';
    }
  }
  return msg;
}
if (typeof GAME !== 'undefined') GAME.on('order:done', e => { try { if (e && e.client) { b2Heart(e.client.id, 2); save(); } } catch (er) {} });

// ---------------- la scène dessinée (apparence par défaut du commerce) ----------------
function b2SVG() {
  const T = bqType(), W = 360, H = 230, sw = `stroke="${B2_INK}" stroke-width="2.4" stroke-linejoin="round"`;
  const wA = T ? T.wall : '#f8e6cc', wB = T ? T.wall2 : '#f6dcc0', aw = T ? T.aw : '#d9604f', aw2 = T ? T.aw2 : '#fff8ea', door = T ? T.door : '#b06a3a';
  let g = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
  g += `<defs><pattern id="b2wp" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${wA}"/><rect width="12" height="24" fill="${wB}" opacity=".7"/></pattern></defs>`;
  g += `<rect width="${W}" height="${H}" fill="url(#b2wp)"/><rect y="190" width="${W}" height="40" fill="#c99a6a"/>` + [0, 1, 2].map(i => `<path d="M0 ${199 + i * 10} H${W}" stroke="#b5875a" stroke-width="1.2"/>`).join('') + `<rect y="186" width="${W}" height="6" fill="#a87a50"/>`;
  // porte d'entrée
  g += `<path d="M8 188 V84 a26 26 0 0 1 52 0 V188Z" fill="#4a3528" opacity=".18"/><path d="M12 188 V86 a22 22 0 0 1 44 0 V188Z" fill="${door}" ${sw}/><circle cx="34" cy="92" r="11" fill="#bfe1f2" ${sw}/><circle cx="49" cy="142" r="3" fill="#f6c445" stroke="${B2_INK}" stroke-width="1.5"/><path d="M34 62 V70" stroke="${B2_INK}" stroke-width="1.6"/><path d="M28 70 q6 10 12 0Z" fill="#f6c445" stroke="${B2_INK}" stroke-width="1.6" class="b2-bell"/>`;
  // étagères : les produits phares du commerce (décor fixe)
  const stars = (T ? T.stars : []).filter(Array.isArray);
  [84, 134].forEach((y, row) => {
    const list = row ? stars.slice().reverse() : stars;
    list.forEach((d, i) => { try { g += itemIcon(bqItemOf(d)).replace('<svg ', `<svg x="${258 + i * 32 + (row ? 8 : 0)}" y="${y - 29}" width="30" height="30" `); } catch (e) {} });
    g += `<rect x="246" y="${y}" width="108" height="7" rx="2" fill="#a87a50" ${sw}/><path d="M256 ${y + 7} l4 8 M344 ${y + 7} l-4 8" stroke="${B2_INK}" stroke-width="2.2"/>`;
  });
  // le compagnon derrière le comptoir
  const k = CHARS[S.sel] && !S.trips[S.sel] ? S.sel : (typeof teamIds === 'function' ? teamIds() : []).find(x => !S.trips[x]);
  if (k) { try { g += drawChar(k, S.outfits[k], 'rire', 'b2k').replace('<svg ', `<svg x="146" y="66" width="72" height="80" class="b2-me" `); } catch (e) {} }
  // comptoir
  g += `<rect x="118" y="142" width="128" height="46" rx="6" fill="#c98a5a" ${sw}/><rect x="112" y="136" width="140" height="10" rx="4" fill="#e3b07a" ${sw}/><path d="M128 156 H236 M128 172 H236" stroke="#a87a50" stroke-width="2" opacity=".6"/>`;
  if (T) g += `<circle cx="182" cy="165" r="14" fill="#fff8ea" ${sw}/><g transform="translate(170 153) scale(.6)">${bqEmblem(T.em)}</g>`;
  g += `<g transform="translate(214 116)"><rect x="0" y="6" width="26" height="16" rx="3" fill="#7fb6d9" ${sw}/><rect x="4" y="0" width="18" height="8" rx="2" fill="#bfe1f2" ${sw}/><circle cx="13" cy="14" r="3" fill="#f6d36b"/></g>`;
  // auvent + enseigne aux couleurs du commerce
  for (let i = 0; i < 12; i++) g += `<path d="M${i * 30} 0 H${i * 30 + 30} V18 a15 8 0 0 1 -30 0Z" fill="${i % 2 ? aw2 : aw}" ${sw}/>`;
  const name = T ? T.short : 'Ma boutique', w = 30 + name.length * 8.4;
  g += `<g transform="translate(182 36)"><path d="M${-w / 2 + 12} -12 V-2 M${w / 2 - 12} -12 V-2" stroke="${B2_INK}" stroke-width="2"/><rect x="${-w / 2}" y="-2" width="${w}" height="26" rx="8" fill="#fff8ea" ${sw}/><text x="0" y="16.5" text-anchor="middle" font-family="Baloo 2, Fredoka, sans-serif" font-weight="800" font-size="15" fill="#4a3528">${esc(name)}</text></g>`;
  return g + '</svg>';
}
// les clients qui attendent leur commande, à gauche du comptoir
const B2_QO = [17, 1];
function b2SceneHTML() {
  const s = bqState();
  const os = s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).slice(0, 2);
  let cl = os.map((o, i) => {
    const c = BQC(o.client), ready = bqReady(o), al = bqAllocate(o), miss = o.req.find((r, j) => al[j].have < r.n);
    const bub = ready ? '<svg viewBox="0 0 20 20" class="b2ok"><circle cx="10" cy="10" r="9" fill="#5fbf7f" stroke="#3a8f5a" stroke-width="1.6"/><path d="M5.6 10.4 L8.6 13.2 L14.4 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : bqReqIcon(miss || o.req[0]);
    return `<button class="b2c ord${ready ? ' ready' : ''}" data-b2ord="${o.id}" style="left:${B2_QO[i]}%" aria-label="${esc(c.name)} : ${ready ? 'commande prête, toucher pour livrer' : 'voir sa commande'}"><span class="b2b">${bub}</span><img src="${clientURI(c, ready ? 'joie' : 'content')}" alt=""></button>`;
  }).join('');
  if (s.orders.length > 2) cl += `<span class="b2more" style="left:1%">+${s.orders.length - 2}</span>`;
  return `<div class="b2scene" id="b2scene"><div class="b2bg">${b2SVG()}</div><div class="b2layer">${cl}</div></div>`;
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

// ---------------- nouveau Comptoir ----------------
if (typeof renderComptoir === 'function') renderComptoir = function (box) {
  const s = bqState(); bqTickOrders(); b2();
  let h = bqShopsBar() + b2SceneHTML();
  const now = Date.now();
  h += `<div class="b2cards">${s.orders.slice().sort((a, b) => bqReady(b) - bqReady(a) || a.seq - b.seq).map(b2Card).join('')}`;
  if (s.orders.length < bqSlots()) h += `<div class="b2card b2wait"><svg viewBox="0 0 30 30">${BQ_ICONS.comptoir}</svg><span>Prochaine commande</span><b data-bqcd="${s.next}">${fmtDur(s.next - now)}</b></div>`;
  h += '</div>' + b2FidHTML() + bqRepHTML();
  box.innerHTML = h;
};
// tutoriel : la commande guidée demande aussi un produit que vend vraiment le commerce
if (typeof tuPickReq === 'function') tuPickReq = (orig => function () {
  const r = orig.apply(this, arguments), T = bqType();
  try { if (T && (!r || !bqFitReq(T, r))) { const x = BQ_GEN_SHOP.item(T, null, 0); if (x) return { k: 'item', name: x.name, def: [x.def[0], x.def[1], x.def[2], 0, x.def[4] || null, x.def[5] || null], n: 1, src: x.src }; } } catch (e) {}
  return r;
})(tuPickReq);

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
// prix habituel (sans la mode de la semaine), pour l'afficher barré
const b2FairBase = typeof mkFair === 'function' ? mkFair : null;
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
// quêtes : demandes de voyageurs simulés (onglet « Quêtes » du marché)
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
  toast(`Quête accomplie : ${d.who.name} est ravi·e, +${d.pay} pièces !`);
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
function b2TrendHTML(t) {
  const it = b2ResIt(t.x), now = mkFair(it), was = b2FairBase ? b2FairBase(it) : 0;
  return `<div class="b2tr"><span class="b2tri">${itemIcon(it)}</span><b>${esc(t.x.name)}</b><em><i aria-hidden="true">↑</i> Prix de vente +${t.pct} % cette semaine</em>${was && was < now ? `<span class="b2trp"><s aria-label="Prix habituel">${was}</s><b aria-label="Prix cette semaine">${coins(now)}</b></span>` : `<span class="b2trp"><b>${coins(now)}</b></span>`}<span class="b2trf">${rgIcon(RG[t.x.region], 's')}${esc(RG[t.x.region].short)}</span><button class="btn cream sm" data-b2trend="${t.x.id}">Où la trouver</button></div>`;
}
function b2MarcheHTML() {
  const m = mkState(); mkProcess(); mkRotate();
  const online = 1180 + Math.round(240 * Math.sin(Date.now() / 3.6e6)) + (mkHash(dayKey()) % 90);
  let h = `<div class="mk-ban"><span class="mk-glob" aria-hidden="true"><svg viewBox="0 0 30 30">${MK_CATS[2][2]}</svg></span><div><b>Place du marché <span>(simulé)</span></b><small>${online.toLocaleString('fr-FR')} voyageurs simulés · ${m.list.length} annonces</small></div></div>`;
  h += b2PlaceHTML();
  const tr = b2Trends();
  if (tr.length) h += `<h3 class="bq-h3">À la mode cette semaine</h3><p class="small b2trh">Ces spécialités se vendent plus cher au marché mondial jusqu’à la fin de la semaine.</p><div class="b2trs">${tr.map(b2TrendHTML).join('')}</div>`;
  h += `<h3 class="bq-h3">Enchère</h3>` + b2AucHTML();
  h += `<div class="mk-cats" role="tablist">${MK_CATS.map(([k, l, ic]) => `<button role="tab" data-b2mk="${k}" aria-selected="false"><svg viewBox="0 0 30 30" aria-hidden="true">${ic}</svg><span>${l}</span></button>`).join('')}</div>`;
  h += `<p class="small">Vendeurs, quêtes et enchérisseurs sont simulés en attendant de vrais joueurs.</p>`;
  return mkViewsBar() + h;
}
// onglet « Quêtes » : les objets que cherchent les voyageurs (on les leur vend, plus cher que le prix du marché)
function b2QuetesHTML() {
  const dem = b2Dem();
  let h = `<div class="mk-ban"><span class="mk-glob" aria-hidden="true"><svg viewBox="0 0 30 30">${MK_CATS[2][2]}</svg></span><div><b>Quêtes des voyageurs</b><small>Ils cherchent ces objets et paient plus que le prix du marché. Objets achetés exclus.</small></div></div>`;
  h += `<div class="b2dems">${dem.map(d => {
    const have = b2DemHave(d).length, ok = have >= d.n, R = RG[d.who.region];
    return `<div class="b2dem${d.done ? ' done' : ''}${ok ? ' ok' : ''}"><span class="b2who">${R ? rgIcon(R, 's') : ''}<b>${esc(d.who.name)}</b></span><span class="b2di" style="--rc:${RARC[d.x.rarity || 0]}">${itemIcon(d.x)}<i>×${d.n}</i></span><span class="b2dn">${esc(d.x.name)}</span><span class="b2dp">${coins(d.pay)}</span>${d.done ? '<span class="b2dok">Servi !</span>' : ok ? `<button class="btn green sm" data-b2dem="${d.id}">Servir</button>` : `<button class="btn cream sm" data-b2demw="${d.id}">${have}/${d.n} · Où ?</button>`}</div>`;
  }).join('') || '<p class="empty">Pas de quête pour l’instant : revenez un peu plus tard.</p>'}</div>`;
  h += `<p class="small">Une nouvelle quête arrive quelques minutes après chaque quête servie.</p>`;
  return mkViewsBar() + h;
}
if (typeof renderMarche === 'function') {
  try { mkView = 'place'; } catch (e) {}
  renderMarche = (orig => function (box) {
    const m = mkState();
    if (m.unseen && mkAuto !== m.sold) return orig.apply(this, arguments); // des ventes conclues : « Mes annonces » d'abord
    if (mkView === 'place') box.innerHTML = b2MarcheHTML();
    else if (mkView === 'quetes') box.innerHTML = b2QuetesHTML();
    else orig.apply(this, arguments);
  })(renderMarche);
}


// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-b2ord],[data-b2where],[data-b2stall],[data-b2trend],[data-b2dem],[data-b2demw],[data-b2bid],[data-b2mk]');
  if (!el || el.disabled) return;
  const d = el.dataset, body = $('panelBody'), top = body ? body.scrollTop : 0, keep = () => { if (body) body.scrollTop = top; };
  if (d.b2ord) {
    const o = bqState().orders.find(x => x.id === d.b2ord); if (!o) return;
    if (bqReady(o)) return bqDeliver(o.id, el);
    const card = document.querySelector(`.b2card[data-oid="${o.id}"]`); if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.remove('b2flash'); void card.offsetWidth; card.classList.add('b2flash'); }
    return;
  }
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

// ---------------- horloge (1 s) : l'enchère ----------------
function b2Tick() {
  try { if (b2AucTick(Date.now())) { save(); b2AucPaint(true); } } catch (e) { console.error('boutique2', e); }
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
.b2layer{position:absolute;inset:0;pointer-events:none}
.b2c{position:absolute;bottom:0;width:19%;padding:0;border:0;background:none;pointer-events:auto;cursor:pointer;transition:left 2.3s linear;-webkit-tap-highlight-color:transparent}
.b2c img{width:100%;display:block;animation:b2idle 2.4s ease-in-out infinite;transform-origin:50% 100%}
@keyframes b2idle{50%{transform:scaleY(.975)}}
@keyframes b2look{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
.b2b{position:absolute;left:50%;bottom:92%;transform:translateX(-50%);width:62%;aspect-ratio:1;background:#fff;border:2px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;padding:7%;box-sizing:border-box;box-shadow:0 2px 0 rgba(91,70,54,.2);animation:b2pop .35s ease-out}
.b2b:empty{display:none}
.b2b svg{width:100%;height:100%}
.b2b::after{content:'';position:absolute;bottom:-7px;left:44%;border:5px solid transparent;border-top:6px solid var(--ink)}
@keyframes b2pop{0%{transform:translateX(-50%) scale(.3)}70%{transform:translateX(-50%) scale(1.12)}}
@keyframes b2pulse{50%{box-shadow:0 0 0 4px rgba(95,191,127,.35)}}
.b2c.ord.ready .b2b{border-color:#3a8f5a;animation:b2pulse 1.4s ease-in-out infinite}
.b2more{position:absolute;bottom:4%;font:800 12px 'Baloo 2',sans-serif;background:#fff8ea;border:2px solid var(--ink);border-radius:10px;padding:0 6px}
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
.b2tri svg{width:40px;height:40px}.b2tr>b{font-size:11.5px;line-height:1.1}.b2tr em{font:800 11px/1.15 'Baloo 2',sans-serif;color:#2f7f6c;font-style:normal;background:#e3f6ec;border:1.5px solid #3a8f5a;border-radius:8px;padding:2px 4px}
.b2tr em i{font-style:normal;display:inline-block;animation:b2up2 1.6s ease-in-out infinite}@keyframes b2up2{50%{transform:translateY(-2px)}}
.b2trh{margin:-4px 0 6px}.b2trp{display:flex;align-items:center;gap:4px;font:800 13px 'Baloo 2',sans-serif}.b2trp s{color:var(--ink2);font-weight:700;text-decoration-thickness:2px}
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
@media (prefers-reduced-motion:reduce){.b2c,.b2c img,.b2sel,.b2b,.b2-bell,.b2-me,.b2tr em i{animation:none!important;transition:none!important}}
@media (min-width:700px){.b2scene{max-width:640px;margin-left:auto;margin-right:auto}.b2place{grid-template-columns:repeat(4,1fr)}}
`;
  document.head.appendChild(st);
})();

window.__bq2 = { b2, dem: b2Dem, quetes: b2QuetesHTML, auc: b2Auc, trends: b2Trends, fairBase: b2FairBase,
  // tests (v19) : cohérence des commandes
  S: () => S, newOrder: bqNewOrder, fit: bqFitReq, label: bqReqLabel, tickOrders: bqTickOrders, switchTo: bqSwitch, type: bqType, state: bqState, makeItem,
  tuPick: () => (typeof tuPickReq === 'function' ? tuPickReq() : null), openShop: openBoutique, render: () => renderPanel(), setMk: v => { mkView = v; } };

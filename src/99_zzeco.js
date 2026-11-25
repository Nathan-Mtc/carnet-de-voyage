// ================= LA BOUTIQUE : DES MERCIS VARIÉS, PARTOUT (v195) =================
// Le joueur : « la boutique qu'on tient donne toujours les mêmes récompenses ; l'argent ne sert pas à grand-chose ».
// Décidé : 1) chaque client remercie à sa façon ; 2) le prix suit la distance (déjà en place pour les demandes régionales, 98).
// Avant : le « merci » du client (98 : recette, appât, chemin, passage, matériel, provisions, objet rare) n'existait que pour les
// demandes à plus de 60 km ; au comptoir, les ventes ne donnaient que pièces et réputation.
// Maintenant :
//  - TOUTE demande a son merci (près de chez soi : un merci plus petit, mais toujours utile) ;
//  - Gaston et Pingo (le matériel) RÉPARENT d'abord un équipement usé ;
//  - AU COMPTOIR, les clients fidèles remercient aussi : à leur 3e, 8e, 15e, 25e… achat, et parfois (1 sur 6) un petit geste.
const ze$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('éco', e); return d; } };
function zeSt() { if (!S.zeco || typeof S.zeco !== 'object') S.zeco = {}; if (!S.zeco.f) S.zeco.f = {}; return S.zeco; }

// 1) toute demande a son merci
bqNewOrder = (orig => function (forceEasy) {
  const o = orig.apply(this, arguments);
  ze$(() => { if (!o || o.merci || forceEasy || !o.mr) return; o.merci = MR_MERCI[o.client] || 'provisions'; o.small = 1; delete o.bonus; });
  return o;
})(bqNewOrder);
// un objet rare d'ici (pas de région lointaine) : une belle trouvaille des lieux qu'aime ce client, qui sert à quelque chose
function zeLocalRare(c) {
  const cats = (c.cats || []).filter(x => LOOT[x]), pool = [].concat(...cats.map(x => LOOT[x])).filter(d => d[3] >= 1 && d[3] <= 2 && d[1] !== 't' && !/\{/.test(d[0]) && ze$(() => ldUseful(d), true));
  const d = pool[Math.floor(Math.random() * pool.length)]; if (!d) return null;
  const it = makeItem(d, 1, `Cadeau de ${c.name}`, [], { fixed: Math.max(1, d[3]) }); S.inv.push(it); S.dex[it.name] = true;
  return `« ${it.name} »`;
}
// réparer gratuitement l'équipement le plus usé
function zeRepair(c) {
  const L = ze$(() => S.inv.filter(it => xpGearOf(it) && (it.wear || 0) > 0).sort((a, b) => (b.wear || 0) - (a.wear || 0)), []);
  const it = L[0]; if (!it) return null; it.wear = 0;
  return `une réparation : « ${it.name} » est comme neuf`;
}
mrGive = (orig => function (o, c) {
  if (o && (o.merci === 'outil')) { const t = ze$(() => zeRepair(c), null); if (t) return t; }
  if (o && o.small) {
    const f = { provisions: () => mrProv(1), rare: () => zeLocalRare(c), passage: () => mrChemin(ze$(() => rgHome().id, '')), outil: () => mrOutil(c) }[o.merci];
    if (f) { const t = ze$(f, null); if (t) return t; }
  }
  return orig.apply(this, arguments);
})(mrGive);

// 2) au comptoir : les clients fidèles remercient aussi
const ZE_STEPS = [3, 8, 15, 25, 40, 60, 90];
cmSell = (orig => function (bid) {
  const b = ze$(() => cmState().buy.find(x => x.id === bid), null), n0 = ze$(() => cmState().sold, 0);
  const r = orig.apply(this, arguments);
  ze$(() => {
    if (!b || cmState().sold === n0) return; // pas vendu (pas encore en vitrine)
    const c = BQC(b.cid); if (!c) return;
    const st = zeSt(), n = st.f[c.id] = (st.f[c.id] || 0) + 1, step = ZE_STEPS.includes(n);
    if (!step && Math.random() > 1 / 6) return;
    const o = { merci: MR_MERCI[c.id] || 'provisions', small: step ? 0 : 1, req: [] };
    const t = mrGive(o, c); if (!t) return;
    save();
    setTimeout(() => ze$(() => toast(step ? `🎁 ${c.name}, fidèle depuis ${n} achats, vous remercie avec ${t} !` : `🎁 ${c.name} vous laisse un petit merci : ${t}.`)), 1400);
  });
  return r;
})(cmSell);

// ================= v196 : DES PIÈCES QUI SERVENT (améliorer l'existant) =================
// 1) les constructions du Foyer et de la boutique coûtent aussi des pièces (48) ; ateliers niveau 3 = bonus (78) ;
// 2) le magasin a une OFFRE DU JOUR rare et chère ; 3) toucher ses pièces montre « Mes envies ».
const ZE_OFFER_KINDS = ['egg', 'deco', 'bait', 'rec'];
function zeOffer() {
  const st = zeSt(), dk = dayKey();
  if (st.offer && st.offer.day === dk) return st.offer;
  const r = (hashStr(String(dk)) >>> 0), kind = ZE_OFFER_KINDS[r % ZE_OFFER_KINDS.length];
  let o = null;
  if (kind === 'egg') { const L = ze$(() => FA_SP.filter(f => f.tier >= 1), []); const f = L[r % Math.max(1, L.length)]; if (f) o = { kind, sp: f.id, nm: `Œuf rare : ${ze$(() => spName(f.id), f.id)}`, why: 'Une espèce rare, garantie, éclosion à la Couveuse', price: 1200 }; }
  if (kind === 'deco') { const P = []; for (const L of Object.values(LOOT)) for (const d of L) if (d[1] === 'd' && FY_EFF[d[2]] && d[3] >= 2 && !/\{/.test(d[0])) P.push(d); const d = P[r % Math.max(1, P.length)]; if (d) o = { kind, def: d, nm: d[0], why: `Décoration rare du Foyer : ${FY_EFF[d[2]][2]}`, price: 700 }; }
  if (kind === 'bait') { const L = ze$(() => FA_SP.filter(f => !(sctSt().learn || {})[f.id] && typeof augBaitNm === 'function'), []); const f = L[r % Math.max(1, L.length)]; if (f) o = { kind, sp: f.id, nm: `Recette d’appât : ${augBaitNm(f.id)}`, why: `Attire les ${ze$(() => augPlural(f.id), 'animaux')} (Herboristerie)`, price: 500 }; }
  if (kind === 'rec') { const s = bqState(), x = BQ_RECIPES.filter(x => !s.recipes.includes(x.id))[r % 7]; if (x) o = { kind, rid: x.id, nm: `Recette : ${x.out[0]}`, why: 'Une recette du magasin, à fabriquer à l’atelier', price: 600 }; }
  if (!o) { const P = []; for (const L of Object.values(LOOT)) for (const d of L) if (d[1] === 'd' && FY_EFF[d[2]] && d[3] >= 2) P.push(d); const d = P[r % Math.max(1, P.length)]; o = d ? { kind: 'deco', def: d, nm: d[0], why: `Décoration rare du Foyer : ${FY_EFF[d[2]][2]}`, price: 700 } : null; }
  st.offer = o ? Object.assign(o, { day: dk, sold: 0 }) : { day: dk, none: 1 }; ze$(save);
  return st.offer;
}
function zeBuyOffer() {
  const o = zeOffer(); if (!o || o.none || o.sold || (S.coins || 0) < o.price) return false;
  S.coins -= o.price; o.sold = 1;
  if (o.kind === 'egg') { addEgg({ sp: o.sp, rarity: 3, from: { how: 'magasin' } }); const e = S.eggs[S.eggs.length - 1]; if (e) e.known = true; }
  else if (o.kind === 'deco') { const it = makeItem(o.def, 1, 'Offre du jour', [], { fixed: Math.max(2, o.def[3]) }); S.inv.push(it); S.dex[it.name] = true; }
  else if (o.kind === 'bait') { sctSt().learn[o.sp] = 1; ze$(() => augSyncHB()); }
  else if (o.kind === 'rec') { const s = bqState(); if (!s.recipes.includes(o.rid)) s.recipes.push(o.rid); }
  save(); ze$(() => renderTop()); toast(`🎁 Offre du jour : ${o.nm} !`);
  return true;
}
renderMagasin = (orig => function (box) {
  const r = orig.apply(this, arguments);
  ze$(() => {
    const o = zeOffer(); if (!o || o.none || !box) return;
    const can = (S.coins || 0) >= o.price;
    const h = `<div class="ze-of${o.sold ? ' sold' : ''}"><span class="ze-ofk">Offre du jour</span><b>${esc(o.nm)}</b><small>${esc(o.why)}</small>${o.sold ? '<span class="bq-sold">Acheté · nouvelle offre demain</span>' : `<button class="btn ${can ? 'gold' : 'cream'} sm" data-zeoffer="1"${can ? '' : ' disabled'}>🪙 ${o.price.toLocaleString('fr-FR')}${can ? '' : ` · encore ${o.price - (S.coins || 0)}`}</button>`}</div>`;
    const t = box.querySelector('.bq-tmw'); if (t) t.insertAdjacentHTML('afterend', h); else box.insertAdjacentHTML('afterbegin', h);
  });
  return r;
})(renderMagasin);
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-zeoffer]'); if (!b || b.disabled) return; ev.stopPropagation(); if (zeBuyOffer()) ze$(() => renderPanel()); }, true);

// 3) « Mes envies » : ce que les pièces peuvent offrir, du moins cher au plus cher
function zeWishes() {
  const L = [];
  ze$(() => { for (const B of PG_B) { const l = pgLvl(B.id); if (l >= 3) continue; const c = pgCan(B.id); if (!c.rankOk) continue; L.push({ nm: `${B.nm} ${l ? 'niveau ' + (l + 1) : ''}`.trim(), p: c.coins, more: c.miss.length ? '+ matériaux' : '', eff: B.eff(l + 1) }); } });
  ze$(() => { for (const id of Object.keys(AT_UP)) { const l = atLvl(id), c = AT_UP[id][l]; if (c != null) L.push({ nm: `${hmR(id).nm} niveau ${l + 1}`, p: c, eff: '+25 % de vitesse' + (l + 1 === 2 ? ', deux à la fois' : l + 1 === 3 ? ', +10 % de chefs-d’œuvre' : '') }); } });
  ze$(() => { const n = bqNextSlot(); if (n && n.ok) L.push({ nm: 'Un commerce de plus', p: n.cost, eff: 'une nouvelle spécialité à la boutique' }); });
  ze$(() => { const o = zeOffer(); if (o && !o.none && !o.sold) L.push({ nm: `Offre du jour : ${o.nm}`, p: o.price, eff: o.why, offer: 1 }); });
  ze$(() => { for (const it of S.inv) if (xpGearOf(it) && usWorn(it)) { const c = usCost(it); L.push({ nm: `Réparer « ${it.name} »`, p: c.coins, more: c.ing.length ? '+ matériaux' : '', eff: 'il retrouve ses défis' }); } });
  return L.sort((a, b) => a.p - b.p);
}
pgPopHTML = (orig => function () {
  const h = orig.apply(this, arguments);
  const W = zeWishes().slice(0, 7); if (!W.length) return h;
  const c = S.coins || 0;
  const list = `<div class="ze-w"><p class="ze-wh">Mes envies</p>${W.map(w => `<div class="ze-wi${c >= w.p ? ' ok' : ''}"><span><b>${esc(w.nm)}</b><small>${esc(w.eff || '')}</small></span><em>${c >= w.p ? `🪙 ${w.p.toLocaleString('fr-FR')}${w.more ? ' ' + esc(w.more) : ''}` : `encore ${(w.p - c).toLocaleString('fr-FR')}`}</em></div>`).join('')}</div>`;
  const i = h.indexOf('</div>'); return i > 0 && h.startsWith('<div class="cm-purse">') ? h.slice(0, i + 6) + list + h.slice(i + 6) : list + h;
})(pgPopHTML);
ze$(() => {
  const st = document.createElement('style');
  st.textContent = `.ze-of{display:grid;gap:3px;margin:8px 0 10px;padding:12px 12px 10px;border-radius:16px;border:2.5px solid #e8b13a;background:linear-gradient(135deg,#fff6d6,#fffaf0);box-shadow:0 3px 0 #e8b13a;text-align:left}
.ze-of b{font:800 16px var(--display,inherit);color:#4a3528}.ze-of small{font:600 12.5px var(--body,system-ui);color:#6b5340}.ze-of .btn{justify-self:start;margin-top:5px}.ze-of.sold{opacity:.7}
.ze-ofk{justify-self:start;padding:2px 9px;border-radius:999px;background:#e8b13a;color:#fff;font:800 11px var(--body,system-ui);letter-spacing:.3px;text-transform:uppercase}
.ze-w{margin:8px 0 6px;text-align:left}.ze-wh{margin:0 0 5px;font:800 12px var(--body,system-ui);letter-spacing:.4px;text-transform:uppercase;color:#7a6250}
.ze-wi{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #efe3cc}.ze-wi span{flex:1;min-width:0;display:grid}.ze-wi b{font:700 13px var(--body,system-ui);color:#4a3528}.ze-wi small{font:600 11.5px var(--body,system-ui);color:#7a6250}
.ze-wi em{flex:none;font:800 12px var(--body,system-ui);font-style:normal;color:#a3403a}.ze-wi.ok em{color:#3f7f3a}`;
  document.head.appendChild(st);
});

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

// ================= LES AMÉLIORATIONS DES PIÈCES DU FOYER (v197) =================
// Le joueur : « on peut pas avoir d'autres améliorations pour chaque pièce du foyer ? » — « ça y ; pas de pièces inutiles ».
// Chaque pièce a 3 améliorations achetées en pièces, chacune avec un VRAI effet branché sur le jeu :
//  Potager : parcelles +2 (36) · arrosage −30 % de pousse (36) · ruche : un pot de miel par jour
//  Cuisine : grand four 30 % de double portion (78) · feu vif −40 % de temps (78) · livre de grand-mère : 3 plats rares
//  Herboristerie : séchoir 35 % d'appât en double (78) · alambic : appâts bien plus attirants · serre rare : un ingrédient d'appât par jour
//  Forge : enclume +15 % de chefs-d'œuvre (78) · établi : réparations moitié prix (99_zusure) · soufflet −40 % de temps (78)
//  Couture : machine à coudre, 3 à la fois (78) · patrons rares : 2 vêtements rares · métier à tisser : laine → tissu
//  Couveuse : lampe chauffante −30 % d'incubation · nid douillet 10 œufs au lieu de 8 (21) · berceuse : naissance au niveau 3
//  Observatoire : lunette, une pierre d'étoile par jour · carte du ciel : un objet de plus en voyage de nuit · comète : une pierre précieuse par semaine
// (v198 : la Cheminée et la Chambre d'amis restent hors du Foyer, à la demande du joueur.)
const fu$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('foyer+', e); return d; } };
function fuSt() { if (!S.fu || typeof S.fu !== 'object') S.fu = {}; if (!S.fu.own) S.fu.own = {}; if (!S.fu.day) S.fu.day = {}; return S.fu; }
function fuHas(id) { try { return !!(S && S.fu && S.fu.own && S.fu.own[id]); } catch (e) { return false; } }
const FU_P = [400, 1000, 2500], FU_PO = [800, 1500, 3000];
const FU = {
  jardin: [['jar_plots', '🌱', 'Parcelles en plus', '2 parcelles de plus à semer'], ['jar_eau', '💧', 'Arrosage automatique', 'Les plantes poussent 30 % plus vite'], ['jar_ruche', '🐝', 'Ruche', 'Un pot de miel chaque jour (ingrédient de cuisine)']],
  cuisine: [['cui_four', '🔥', 'Grand four', '30 % de chances de faire une double portion'], ['cui_feu', '⏱️', 'Feu vif', 'Les plats cuisent 40 % plus vite'], ['cui_livre', '📖', 'Livre de grand-mère', '3 plats rares qui font beaucoup grandir les familiers']],
  herbo: [['her_seche', '🌾', 'Séchoir à plantes', '35 % de chances d’un appât en double'], ['her_alambic', '⚗️', 'Alambic', 'Des appâts bien plus attirants'], ['her_serre', '🪴', 'Serre aux plantes rares', 'Un ingrédient d’appât offert chaque jour']],
  forge: [['for_enclume', '🔨', 'Enclume de maître', '+15 % de chefs-d’œuvre à la Forge'], ['for_etabli', '🧰', 'Établi de réparation', 'Réparations moitié prix'], ['for_soufflet', '💨', 'Soufflet géant', 'On forge 40 % plus vite']],
  couture: [['cou_machine', '🧵', 'Machine à coudre', '3 vêtements en même temps'], ['cou_patrons', '📐', 'Patrons rares', '2 vêtements rares à coudre'], ['cou_metier', '🧶', 'Métier à tisser', 'Transformer la laine en tissu']],
  nurserie: [['nid_lampe', '💡', 'Lampe chauffante', 'Les œufs éclosent 30 % plus vite'], ['nid_nid', '🪺', 'Nid douillet', '10 œufs au nid au lieu de 8'], ['nid_berceuse', '🎵', 'Berceuse', 'Les familiers naissent au niveau 3']],
  observ: [['obs_lunette', '🔭', 'Lunette', 'Une pierre d’étoile chaque jour'], ['obs_carte', '🗺️', 'Carte du ciel', 'Un objet de plus en voyage de nuit'], ['obs_comete', '☄️', 'Guetteur de comètes', 'Une pierre précieuse chaque semaine']],
};
const fuPrice = (room, i) => (room === 'observ' ? FU_PO : FU_P)[i];
function fuBuy(room, id) {
  const L = FU[room]; if (!L) return false; const i = L.findIndex(x => x[0] === id); if (i < 0 || fuHas(id)) return false;
  const p = fuPrice(room, i); if ((S.coins || 0) < p) return false;
  S.coins -= p; fuSt().own[id] = Date.now(); fu$(() => fuSyncRecipes()); save(); fu$(() => renderTop());
  toast(`${L[i][1]} ${L[i][2]} : c’est installé ! ${L[i][3]}.`);
  fu$(() => fuDaily(true));
  return true;
}

// ---------- les recettes débloquées (cuisine, couture) ----------
function fuSyncRecipes() {
  const add = r => { if (!RECIPES.some(x => x.id === r.id)) RECIPES.push(r); };
  add({ id: 'fu_gratin', kind: 'Cuisine', fu: 'cui_livre', out: ['Gratin de grand-mère', 'n', 'plat', 3, null, '#e0a050'], ing: [['legume', 2], ['fromage', 1], ['pain', 1]], coins: 10 });
  add({ id: 'fu_tarte', kind: 'Cuisine', fu: 'cui_livre', out: ['Tarte des bois de grand-mère', 'n', 'plat', 3, null, '#8a4a7a'], ing: [['fruit', 3], ['sucre', 1], ['pain', 1]], coins: 10 });
  add({ id: 'fu_soupe', kind: 'Cuisine', fu: 'cui_livre', out: ['Soupe du voyageur', 'n', 'plat', 3, null, '#c98a3a'], ing: [['legume', 2], ['champignon', 1], ['feuille', 1]], coins: 10 });
  fu$(() => { const V = BQ_CAT.filter(a => a.k === 'v' && a.def && a.def[3] >= 3 && a.def[4]).slice(0, 2); V.forEach((a, i) => add({ id: 'fu_patron' + i, kind: 'Vêtement', fu: 'cou_patrons', out: a.def, ing: [['tissu', 4], ['laine', 2], ['cristal', 1]], coins: 60 })); });
  fu$(() => { const d = ldDefFor('tissu', 'friperie'); if (d) add({ id: 'fu_tissu', kind: 'Vêtement', fu: 'cou_metier', out: d, ing: [['laine', 2]], coins: 0 }); });
}
fu$(fuSyncRecipes);

// ---------- les effets ----------
// Alambic : les appâts attirent bien plus (1,6 → 2,4)
nsBaitPower = (orig => function () { const v = orig.apply(this, arguments); return v > 0 && fuHas('her_alambic') ? v * 1.5 : v; })(nsBaitPower);
// Lampe chauffante : incubation −30 %
nsHatchMs = (orig => function () { const v = orig.apply(this, arguments); return fuHas('nid_lampe') ? Math.round(v * 0.7) : v; })(nsHatchMs);
// Berceuse : un familier né d'un œuf commence au niveau 3
GAME.on('comp:new', e => fu$(() => { if (!fuHas('nid_berceuse') || !e || !e.id) return; const P = S.prog[e.id]; if (P && (P.lvl || 1) < 3) { P.lvl = 3; P.xp = 0; save(); } }));
// Carte du ciel : un objet utile de plus au retour d'un voyage parti la nuit
GAME.on('trip:return', e => fu$(() => {
  if (!fuHas('obs_carte')) return; const t = e && e.trip; if (!t || !t.dest) return;
  const h = new Date(t.startedAt || Date.now()).getHours(); if (h >= 6 && h < 21) return;
  const pool = lootTable([t.dest.cat || 'parc']).map(x => x.d).filter(d => !/\{/.test(d[0]) && fu$(() => ldUseful(d), true)); const d = pool[Math.floor(Math.random() * pool.length)]; if (!d) return;
  const it = makeItem(d, 1, t.dest.name || 'La nuit', []); S.inv.push(it); save();
  setTimeout(() => fu$(() => toast(`🗺️ La carte du ciel a guidé le voyage de nuit : « ${it.name} » en plus !`)), 3200);
}));
// les cadeaux quotidiens (ruche, serre, lunette) et hebdomadaires (comète)
const fuWeek = () => { const d = new Date(); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() * 100 + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); };
function fuDaily(quiet) {
  if (document.body.classList.contains('firstrun')) return;
  const st = fuSt(), dk = dayKey(), wk = fuWeek(), got = [];
  if (fuHas('jar_ruche') && st.day.ruche !== dk) { st.day.ruche = dk; const it = makeItem(['Pot de miel du Foyer', 'n', 'sucre', 1, null, '#e8b13a'], 0, 'Ruche du Foyer', [], { fixed: 1 }); S.inv.push(it); got.push('🐝 un pot de miel'); }
  if (fuHas('her_serre') && st.day.serre !== dk) {
    st.day.serre = dk;
    const keys = []; fu$(() => RECIPES.filter(r => r.kind === 'Herboristerie' && atOwned(r)).forEach(r => r.ing.forEach(([k]) => { if (ING[k] && !/^r:/.test(k)) keys.push(k); })));
    const k = keys[Math.floor(Math.random() * keys.length)] || 'feuille', d = fu$(() => ldDefFor(k, 'jardin'), null);
    if (d) { const it = makeItem(d, 0, 'Serre du Foyer', []); S.inv.push(it); got.push(`🪴 « ${it.name} »`); }
  }
  if (fuHas('obs_lunette') && st.day.lune !== dk) { st.day.lune = dk; fu$(() => gainStones(1)); got.push('🔭 une pierre d’étoile'); }
  if (fuHas('obs_comete') && st.day.comete !== wk) { st.day.comete = wk; const it = fu$(() => famGemItem({ name: 'Le ciel' }, 'Comète'), null); if (it) { S.inv.push(it); got.push(`☄️ « ${it.name} »`); } }
  if (!got.length) return;
  save();
  setTimeout(() => fu$(() => toast(`Le Foyer vous offre ${got.join(', ')}.`)), quiet ? 600 : 2500);
}
setInterval(() => fu$(() => { if (!document.hidden) fuDaily(); }), 60e3);
setTimeout(() => fu$(() => fuDaily()), 8000);

// ---------- dans chaque pièce : la rangée « Améliorations » ----------
fyRender = (orig => function (box) {
  const r = orig.apply(this, arguments);
  fu$(() => {
    if (!box || fu$(() => pgTuto(), false)) return;
    const R = hmR(hmRoom), L = R && FU[R.id]; if (!L) return;
    if (R.lock && hmLvl(R) < 1) return; // l'Observatoire se construit d'abord
    const c = S.coins || 0;
    const cards = L.map(([id, ico, nm, eff], i) => { const own = fuHas(id), p = fuPrice(R.id, i);
      return `<div class="fu-c${own ? ' own' : ''}"><span class="fu-i">${ico}</span><span class="fu-x"><b>${esc(nm)}</b><small>${esc(eff)}</small></span>${own ? '<span class="fu-ok">✓ Installé</span>' : `<button class="btn ${c >= p ? 'green' : 'cream'} sm" data-fubuy="${R.id}:${id}"${c >= p ? '' : ' disabled'}>🪙 ${p.toLocaleString('fr-FR')}</button>`}</div>`; }).join('');
    const h = `<div class="fu-w"><h3 class="hm-h">Améliorations · ${L.filter(x => fuHas(x[0])).length}/3</h3>${cards}</div>`;
    const up = box.querySelector('.hm-up'); if (up) up.insertAdjacentHTML('beforebegin', h); else box.insertAdjacentHTML('beforeend', h);
  });
  return r;
})(fyRender);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-fubuy]'); if (!b || b.disabled) return;
  ev.stopPropagation(); const [room, id] = b.dataset.fubuy.split(':');
  if (fuBuy(room, id)) { const p = $('panelBody'), top = p ? p.scrollTop : 0; fu$(() => renderPanel()); const p2 = $('panelBody'); if (p2) p2.scrollTop = top; }
}, true);
// et dans « Mes envies »
zeWishes = (orig => function () {
  const W = orig.apply(this, arguments);
  fu$(() => { for (const [room, L] of Object.entries(FU)) { const R = hmR(room); if (!R || (R.lock && hmLvl(R) < 1)) continue; const i = L.findIndex(x => !fuHas(x[0])); if (i < 0) continue; W.push({ nm: `${R.nm} : ${L[i][2]}`, p: fuPrice(room, i), eff: L[i][3] }); } });
  return W.sort((a, b) => a.p - b.p);
})(zeWishes);
fu$(() => {
  const st = document.createElement('style');
  st.textContent = `.fu-w{margin:14px 0 4px}.fu-c{display:flex;align-items:center;gap:10px;margin:0 0 7px;padding:9px 10px;border-radius:14px;background:#fffaf0;border:2px solid #eadcc4}
.fu-c.own{border-color:#9cc98f;background:#f3faef}.fu-i{flex:none;width:36px;height:36px;border-radius:11px;background:#fbf0dc;display:grid;place-items:center;font-size:20px}
.fu-x{flex:1;min-width:0;display:grid;text-align:left}.fu-x b{font:800 14px var(--display,inherit);color:#4a3528}.fu-x small{font:600 12px/1.3 var(--body,system-ui);color:#7a6250}
.fu-ok{flex:none;font:800 12px var(--body,system-ui);color:#3f7f3a}.fu-c .btn{flex:none}`;
  document.head.appendChild(st);
});

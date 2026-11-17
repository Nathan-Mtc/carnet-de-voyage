// ================= 89 · MOMENT FORT : LE STYLISTE (v85) =================
// 5e mini-jeu (17/11), demandé pour les boutiques de vêtements : « je veux un mini-jeu pour les vêtements ».
// Dans une boutique de vêtements, une friperie ou une boutique, la vendeuse est débordée : 3 clients défilent,
// chacun avec une envie (« un week-end à la plage », « une soirée chic »…). Le compagnon sert de mannequin :
// on choisit une pièce par emplacement (tête, haut, bas, pieds), le compagnon la porte aussitôt, puis on présente la tenue.
// Chaque pièce qui colle à l'envie du client compte. Récompense : de VRAIS vêtements (portables dans Compagnons › Habits)
// pour les tenues réussies, et un pourboire. 70 secondes, 3 clients.
const sy$ = (f, d) => { try { return f(); } catch (e) { return d; } };
const SY_SHOPS = { mode: 1, friperie: 1, boutique: 1 };
const SY_NM = { paille: 'Chapeau de paille', bob: 'Bob', canotier: 'Canotier', bainb: 'Bonnet de bain', hawai: 'Chemise hawaïenne', maillot: 'Maillot rayé', tshirt: 'T-shirt', mariniere: 'Marinière', bain: 'Short de bain', short: 'Short', tongs: 'Tongs', sandales: 'Sandales', bonnet: 'Bonnet', chullo: 'Bonnet péruvien', explorateur: 'Chapeau d’explorateur', chapka: 'Chapka', pull: 'Pull douillet', poncho: 'Poncho', jacquard: 'Pull jacquard', cire: 'Ciré', jean: 'Jean', salopette: 'Salopette', godillots: 'Godillots', bottes: 'Bottes', apres: 'Après-ski', hautforme: 'Haut-de-forme', beret: 'Béret', diademe: 'Diadème', cloche: 'Chapeau cloche', veste: 'Veste de soirée', kimono: 'Kimono', gilet: 'Gilet', jupe: 'Jupe', plissee: 'Jupe plissée', babouches: 'Babouches', chaussons: 'Chaussons', sweat: 'Sweat', baskets: 'Baskets', casquette: 'Casquette', pompon: 'Bonnet à pompon', capitaine: 'Casquette de capitaine', sorciere: 'Chapeau de sorcière', couronne: 'Couronne', sombrero: 'Sombrero', noel: 'Bonnet de Noël', tutu: 'Tutu', kilt: 'Kilt', peignoir: 'Peignoir', securite: 'Gilet fluo', tablier: 'Tablier', sabots: 'Sabots', cuissardes: 'Cuissardes', rayees: 'Chaussettes rayées', chaussettes: 'Chaussettes', calecon: 'Caleçon', kasa: 'Chapeau de paille conique', toque: 'Toque', bandeau: 'Bandeau' };
// envies des clients : pour chaque emplacement, les formes qui conviennent ; couleurs de la gamme
const SY_THEMES = [
  { id: 'plage', ico: '🏖️', who: 'Une loutre en vacances', ask: 'Je pars à la plage ce week-end : quelque chose de léger !', ok: { tete: ['paille', 'bob', 'canotier', 'bainb'], haut: ['hawai', 'maillot', 'tshirt', 'mariniere'], bas: ['bain', 'short'], pieds: ['tongs', 'sandales'] }, pal: ['#f2a33a', '#5ab4dc', '#f49ab4', '#f7e27a'] },
  { id: 'rando', ico: '🥾', who: 'Une chèvre randonneuse', ask: 'Je monte au refuge demain. Il fera frais là-haut !', ok: { tete: ['bonnet', 'chullo', 'explorateur', 'chapka'], haut: ['pull', 'poncho', 'jacquard', 'cire'], bas: ['jean', 'salopette'], pieds: ['godillots', 'bottes', 'apres'] }, pal: ['#a5784f', '#6f9a5f', '#c98f5a', '#8f9cb3'] },
  { id: 'chic', ico: '🥂', who: 'Un hibou très élégant', ask: 'Je suis invité à un grand dîner ce soir. Il me faut de l’allure.', ok: { tete: ['hautforme', 'beret', 'diademe', 'cloche'], haut: ['veste', 'kimono', 'gilet'], bas: ['jupe', 'plissee', 'kilt'], pieds: ['babouches', 'cuissardes', 'chaussettes'] }, pal: ['#3b4a7a', '#7a2f4a', '#2f2622', '#d9b13a'] },
  { id: 'hiver', ico: '❄️', who: 'Un pingouin frileux', ask: 'Il neige en ville ! Je veux avoir bien chaud.', ok: { tete: ['bonnet', 'pompon', 'chapka', 'chullo'], haut: ['pull', 'sweat', 'jacquard', 'poncho'], bas: ['jean', 'salopette'], pieds: ['bottes', 'apres', 'chaussons'] }, pal: ['#d9604f', '#3b6fb0', '#f4f1e6', '#6f9a5f'] },
  { id: 'fete', ico: '🎭', who: 'Un raton farceur', ask: 'C’est la fête costumée du quartier ! Je veux qu’on me remarque.', ok: { tete: ['sorciere', 'couronne', 'sombrero', 'noel'], haut: ['kimono', 'hawai', 'securite'], bas: ['tutu', 'kilt'], pieds: ['rayees', 'cuissardes', 'sabots'] }, pal: ['#8f62d0', '#f2c14e', '#e0533d', '#3fae8a'] },
  { id: 'marin', ico: '⚓', who: 'Un vieux phoque marin', ask: 'Je reprends la mer demain matin. Quelque chose de pratique !', ok: { tete: ['capitaine', 'bob', 'bonnet'], haut: ['mariniere', 'cire', 'maillot', 'pull'], bas: ['jean', 'salopette', 'short'], pieds: ['bottes', 'godillots'] }, pal: ['#3b4a7a', '#f4f1e6', '#e8c04f', '#d9604f'] },
  { id: 'sport', ico: '🏃', who: 'Un lièvre sportif', ask: 'Je cours un marathon dimanche. Je veux être à l’aise !', ok: { tete: ['casquette', 'bob', 'bandeau'], haut: ['tshirt', 'sweat', 'maillot'], bas: ['short', 'jean'], pieds: ['baskets', 'chaussettes'] }, pal: ['#5ab4dc', '#7fc462', '#f2a33a', '#e0533d'] },
  { id: 'jardin', ico: '🌻', who: 'Une taupe jardinière', ask: 'Je passe la journée au potager. Il me faut une tenue qui ne craint rien.', ok: { tete: ['paille', 'kasa', 'bob'], haut: ['tablier', 'gilet', 'tshirt'], bas: ['salopette', 'jean'], pieds: ['sabots', 'bottes'] }, pal: ['#6f9a5f', '#c98f5a', '#f2c14e', '#a5784f'] },
];
const SY_SLOTS = [['tete', 'Tête'], ['haut', 'Haut'], ['bas', 'Bas'], ['pieds', 'Pieds']];
const SY_ALL = {}; SY_THEMES.forEach(T => Object.entries(T.ok).forEach(([sl, L]) => { (SY_ALL[sl] = SY_ALL[sl] || new Set()); L.forEach(f => SY_ALL[sl].add(f)); }));
const SY_TIME = 70, SY_N = 3;

if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  sy$(() => {
    const t = S.trips[k]; if (!t || t === before) return;
    const d = t.dest || {}; if (![d.cat, ...(d.tags || [])].some(x => SY_SHOPS[x]) || Math.random() >= 0.55) return;
    t.mf = { k: 'style', at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
const syName = k => sy$(() => CHARS[k].name, 'Votre compagnon');
const syItem = (sl, f, col, rar) => [SY_NM[f] || f, 'v', sl, rar, f, col];
function syAuto(t) { if (!t.mf || t.mf.k !== 'style' || (t.mf.st !== 'wait' && t.mf.st !== 'ready')) return; t.mf.st = 'auto'; const T = SY_THEMES[Math.floor(Math.random() * SY_THEMES.length)]; const it = sy$(() => makeItem(syItem('tete', T.ok.tete[0], T.pal[0], 0), 0, t.dest.name, t.dest.tags || [], { fixed: 0 }), null); if (it) t.bag.push(it); sy$(save); }
function syTick() {
  if (!S || !S.trips) return;
  let ch = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || !t.mf || t.mf.k !== 'style') continue;
    if (t.done) { if (t.mf.st === 'wait' || t.mf.st === 'ready') { syAuto(t); ch = true; } continue; }
    if (t.mf.st === 'wait' && t.elapsed >= t.total * t.mf.at) { t.mf.st = 'ready'; ch = true; sy$(() => toast(`👗 La boutique a besoin de ${syName(k)} comme mannequin !`)); }
  }
  if (ch) { sy$(save); sy$(() => renderTripCard()); }
}
setInterval(() => { if (!document.hidden) sy$(syTick); }, 2000);
if (typeof collect === 'function') collect = (orig => function () { sy$(() => Object.values(S.trips).forEach(t => { if (t && t.done && t.mf) syAuto(t); })); return orig.apply(this, arguments); })(collect);
function syReady() { for (const [k, t] of Object.entries(S.trips || {})) if (t && !t.done && t.mf && t.mf.k === 'style' && t.mf.st === 'ready') return { k, t }; return null; }
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && ['collect', 'cumf', 'chmf', 'pemf', 'ckmf'].includes(a.kind)) return a;
  if (document.body.classList.contains('firstrun')) return a;
  const R = sy$(syReady, null);
  return R ? { kind: 'stmf', k: R.k, t: R.t } : a;
})(nextAction);
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = sy$(() => nextAction(), null);
  if (!a || a.kind !== 'stmf') return orig.apply(this, arguments);
  box.hidden = false; box.className = 'tripcard act act-cu'; box.dataset.kind = 'stmf'; box.dataset.k = a.k; box.dataset.sig = sy$(() => actionSig(a), '');
  box.innerHTML = `<span class="acic"><img src="${sy$(() => portraitURI(a.k, 'rire'), '')}" alt=""></span><div class="tcx"><span class="ack">Moment fort · ${esc(a.t.dest.name || '')}</span><b class="act-t">👗 Le styliste du jour</b><span class="acs">La boutique est débordée : à jouer avant son retour.</span></div><button class="btn green" data-stplay="${a.k}">Jouer</button>`;
})(renderActionCard);
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-stplay]'); if (!b) return; ev.stopPropagation(); ev.preventDefault(); syOpen(b.dataset.stplay); }, true);

// ================= LE MINI-JEU =================
let SY = null;
const syShuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
function syOptions(T) {
  const o = {};
  for (const [sl] of SY_SLOTS) {
    const good = syShuffle(T.ok[sl]).slice(0, 2);
    const bad = syShuffle([...(SY_ALL[sl] || [])].filter(f => !T.ok[sl].includes(f))).slice(0, 2);
    o[sl] = syShuffle(good.concat(bad)).map(f => ({ f, good: T.ok[sl].includes(f), col: T.ok[sl].includes(f) ? T.pal[Math.floor(Math.random() * T.pal.length)] : ['#9aa3ad', '#c9b8a6', '#b5c3a0', '#d9a0c0', '#8fb3c9'][Math.floor(Math.random() * 5)] }));
  }
  return o;
}
function syMannequin() {
  const o = Object.assign({ tete: 'none', cou: 'none', haut: 'none', bas: 'none', mains: 'none', pieds: 'none', dos: 'none' }, {}), col = {};
  for (const [sl] of SY_SLOTS) { const p = SY.pick[sl]; if (p) { o[sl] = p.f; col[p.f] = p.col; } }
  o.col = col;
  const svg = sy$(() => drawChar(SY.k, o, SY.mood || 'content', 'stm' + (++SY.n)), '');
  SY.el.querySelector('.st-model').innerHTML = svg;
}
function syOpen(k) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.k !== 'style' || t.mf.st !== 'ready' || t.done) { sy$(() => toast('Ce moment est passé.')); return; }
  if (SY) return;
  const themes = syShuffle(SY_THEMES).slice(0, SY_N);
  const el = document.createElement('div'); el.id = 'stG'; el.className = 'st-ov';
  el.innerHTML = `<div class="st-top"><div class="ck-time"><i></i></div><div class="ck-dots">${themes.map(() => '<i></i>').join('')}</div></div>
    <div class="st-client"></div>
    <div class="st-floor"><div class="st-mirror"><div class="st-model"></div></div></div>
    <div class="st-racks"></div>
    <div class="cu-card cu-intro"><p class="cu-k">Moment fort · ${esc(t.dest.name || '')}</p><h3>Le styliste du jour</h3>
      <p class="ck-lead">La vendeuse est débordée ! ${esc(syName(k))} sert de mannequin. ${SY_N} clients vont entrer, chacun avec une envie.</p>
      <ol class="pe-how"><li>Lisez ce que veut le client.</li><li>Choisissez <b>une pièce par emplacement</b> : ${esc(syName(k))} l’essaie aussitôt.</li><li><b>Présentez</b> la tenue. Chaque pièce qui colle à l’envie compte !</li></ol>
      <p class="cu-tip">Les tenues réussies vous rapportent de vrais vêtements à porter.</p>
      <button class="btn green big wide" data-stgo="1">Ouvrir la boutique !</button><button class="cu-later" data-stquit="1">Plus tard</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
  SY = { k, t, el, themes, i: 0, time: 0, run: 0, res: [], pick: {}, n: 0, last: performance.now() };
  syMannequin(); requestAnimationFrame(syLoop);
}
function syClose() { if (!SY) return; SY.el.remove(); SY = null; document.body.classList.remove('cu-on'); sy$(() => renderTripCard()); }
function syClient() {
  const T = SY.themes[SY.i]; SY.pick = {}; SY.opts = syOptions(T); SY.mood = 'content'; syMannequin();
  SY.el.querySelector('.st-client').innerHTML = `<span class="st-ci">${T.ico}</span><div><small>Client ${SY.i + 1}/${SY.themes.length} · ${esc(T.who)}</small><b>« ${esc(T.ask)} »</b></div>`;
  SY.el.querySelector('.st-client').classList.remove('in'); void SY.el.offsetWidth; SY.el.querySelector('.st-client').classList.add('in');
  syRacks();
}
function syRacks() {
  const R = SY.el.querySelector('.st-racks');
  R.innerHTML = SY_SLOTS.map(([sl, nm]) => `<div class="st-row"><span class="st-sl">${nm}</span>${SY.opts[sl].map((p, j) => `<button class="st-op${SY.pick[sl] === p ? ' on' : ''}" data-stsl="${sl}" data-stj="${j}" aria-label="${esc(SY_NM[p.f] || p.f)}">${sy$(() => vMiniIcon(sl, p.f, p.col), '')}<small>${esc(SY_NM[p.f] || p.f)}</small></button>`).join('')}</div>`).join('')
    + `<button class="btn green big wide st-go" data-stshow="1" ${SY_SLOTS.every(([sl]) => SY.pick[sl]) ? '' : 'disabled'}>Présenter la tenue</button>`;
}
function syShow() {
  const T = SY.themes[SY.i], good = SY_SLOTS.filter(([sl]) => SY.pick[sl] && SY.pick[sl].good).length;
  const stars = good >= 4 ? 3 : good === 3 ? 2 : good === 2 ? 1 : 0;
  SY.res.push({ T, good, stars, pick: { ...SY.pick } });
  const dot = SY.el.querySelectorAll('.ck-dots i')[SY.i]; if (dot) dot.className = stars >= 3 ? 'p' : stars >= 2 ? 'g' : 'b';
  SY.mood = stars >= 2 ? 'rire' : 'surpris'; syMannequin();
  const say = ['« Euh… ce n’est pas du tout ce que j’imaginais. »', '« Mouais, ça peut aller. »', '« Très joli ! Je prends. »', '« Exactement ce que je voulais ! Merveilleux ! »'][stars];
  SY.el.querySelector('.st-racks').innerHTML = `<div class="st-verdict"><div class="cu-stars">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</div><p>${esc(say)}</p><p class="st-why">${SY_SLOTS.map(([sl, nm]) => `<span class="${SY.pick[sl].good ? 'ok' : 'ko'}">${SY.pick[sl].good ? '✓' : '✗'} ${esc(SY_NM[SY.pick[sl].f] || SY.pick[sl].f)}</span>`).join('')}</p></div>`;
  sy$(() => sfx('pop'));
  setTimeout(() => { if (!SY || !SY.run) return; SY.i++; if (SY.i >= SY.themes.length) syEnd(); else syClient(); }, 1700);
}
document.addEventListener('click', ev => {
  if (!SY) return;
  const b = ev.target.closest && ev.target.closest('[data-stgo],[data-stquit],[data-stdone],[data-stsl],[data-stshow]'); if (!b) return;
  ev.stopPropagation();
  if (b.dataset.stsl) { const sl = b.dataset.stsl, p = SY.opts[sl][+b.dataset.stj]; SY.pick[sl] = p; syMannequin(); syRacks(); sy$(() => sfx('pop')); return; }
  if (b.dataset.stshow) { if (!b.disabled) syShow(); return; }
  if (b.dataset.stgo) { SY.el.querySelector('.cu-intro').remove(); SY.run = 1; SY.time = 0; syClient(); return; }
  syClose();
}, true);
function syLoop(now) {
  if (!SY) return;
  const dt = Math.min(0.05, (now - SY.last) / 1000); SY.last = now;
  if (SY.run && !SY.ended) {
    SY.time += dt;
    const tb = SY.el.querySelector('.ck-time i'); if (tb) { const f = Math.max(0, 1 - SY.time / SY_TIME); tb.style.width = f * 100 + '%'; tb.style.background = f < 0.2 ? '#e0533d' : f < 0.45 ? '#f2c14e' : '#7fc462'; }
    if (SY.time >= SY_TIME) syEnd();
  }
  requestAnimationFrame(syLoop);
}
function syEnd() {
  if (!SY || SY.ended) return;
  SY.ended = 1; SY.run = 0;
  const t = SY.t, got = [];
  SY.res.forEach(r => {
    if (r.stars < 2) return;
    const goods = SY_SLOTS.map(([sl]) => [sl, r.pick[sl]]).filter(([, p]) => p && p.good);
    const [sl, p] = goods[Math.floor(Math.random() * goods.length)];
    const it = sy$(() => makeItem(syItem(sl, p.f, p.col, r.stars >= 3 ? 2 : 1), 0, t.dest.name, t.dest.tags || [], { fixed: r.stars >= 3 ? 2 : 1 }), null);
    if (it) { t.bag.push(it); got.push(it); }
  });
  const tip = SY.res.reduce((a, r) => a + r.stars * 10, 0); if (tip) sy$(() => gainCoins(tip));
  const stars = got.length >= 3 && SY.res.every(r => r.stars >= 3) ? 3 : got.length >= 2 ? 2 : got.length >= 1 ? 1 : 0;
  t.mf.st = 'done'; t.mf.res = { stars, n: got.length }; sy$(save); sy$(renderTop);
  sy$(() => t.journal.push({ t: Date.now(), kind: 'style', text: `${syName(SY.k)} a été le mannequin vedette d’une boutique : ${got.length} vêtement${got.length > 1 ? 's' : ''} offert${got.length > 1 ? 's' : ''}.` }));
  SY.mood = stars >= 2 ? 'rire' : 'triste'; syMannequin();
  const card = document.createElement('div'); card.className = 'cu-card cu-end';
  card.innerHTML = `<p class="cu-k">${['Journée difficile', 'Quelques ventes', 'Belle journée', 'Styliste de génie'][stars]}</p><div class="cu-stars">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</div>
    <div class="cu-loot">${got.map(it => `<span class="cu-li" style="--rc:${sy$(() => RARC[it.rarity], '#ccc')}">${sy$(() => vMiniIcon(it.sub, it.look, it.color), '')}<b>${esc(it.name)}</b></span>`).join('') || '<span class="cu-none">Aucun vêtement cette fois…</span>'}${tip ? `<span class="cu-li" style="--rc:#f2c14e"><span class="ck-em">🪙</span><b>Pourboires : ${tip} pièces</b></span>` : ''}</div>
    <p class="cu-tip">${got.length ? `${esc(syName(SY.k))} rapporte ces vêtements à son retour : à porter dans Compagnons › Habits.` : 'Relisez bien l’envie du client : plage, montagne, soirée…'}</p>
    <button class="btn green big wide" data-stdone="1">Super !</button>`;
  SY.el.appendChild(card);
}
window.__st = { force: k => { const t = S.trips[k]; if (t) t.mf = { k: 'style', at: 0, st: 'ready' }; }, st: () => SY && { i: SY.i, opts: SY.opts && Object.fromEntries(Object.entries(SY.opts).map(([s, L]) => [s, L.map(p => p.good)])) } };

{
  const css = document.createElement('style');
  css.textContent = `
.st-ov{position:fixed;inset:0;z-index:9000;overflow:hidden;user-select:none;-webkit-user-select:none;background:linear-gradient(#fbeee6 0 52%,#e9d4c2 52%);display:flex;flex-direction:column}
.st-ov::before{content:'';position:absolute;left:0;right:0;top:0;height:52%;background:repeating-linear-gradient(90deg,rgba(217,160,192,.18) 0 22px,transparent 22px 44px);pointer-events:none}
.st-top{position:relative;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 10px) 10px 6px;z-index:2}
.st-client{position:relative;margin:2px 10px 0;padding:8px 10px;border-radius:16px;background:#fffaf0;border:2.5px solid #4a3528;box-shadow:0 3px 0 rgba(74,53,40,.2);display:flex;align-items:center;gap:8px;z-index:2;min-height:54px}
.st-client.in{animation:chIn .35s ease-out}.st-ci{font-size:32px}.st-client small{display:block;font:800 10.5px var(--display,system-ui);letter-spacing:.04em;text-transform:uppercase;color:#a5784f}.st-client b{font:700 13.5px/1.3 var(--body,system-ui);color:#4a3528}
.st-floor{position:relative;flex:0 0 auto;display:flex;justify-content:center;padding:6px 0 0;z-index:1}
.st-mirror{width:150px;height:170px;border-radius:80px 80px 12px 12px;background:radial-gradient(120% 80% at 50% 20%,#ffffff,#e6eef3);border:4px solid #c9a03a;box-shadow:0 0 0 3px #4a3528,0 6px 0 rgba(74,53,40,.25);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.st-model svg{width:150px;height:auto;display:block;margin-bottom:-6px}
.st-racks{position:relative;flex:1;overflow:auto;padding:8px 8px calc(env(safe-area-inset-bottom,0px) + 10px);z-index:2}
.st-row{display:grid;grid-template-columns:40px repeat(4,1fr);gap:5px;align-items:center;margin-bottom:5px}
.st-sl{font:800 11px var(--display,system-ui);color:#7a5f48;text-align:right}
.st-op{display:flex;flex-direction:column;align-items:center;gap:0;padding:3px 2px 4px;border-radius:12px;background:#fffaf0;border:2px solid #d9c4a8;cursor:pointer;min-width:0}
.st-op svg{width:46px;height:46px;display:block}.st-op small{font:700 9.5px/1.1 var(--body,system-ui);color:#4a3528;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-op.on{border-color:#4a3528;background:#fff3c9;box-shadow:0 0 0 2px #f2c14e}
.st-go{margin-top:4px}.st-go[disabled]{opacity:.45}
.st-verdict{text-align:center;padding:6px;border-radius:16px;background:#fffaf0;border:2.5px solid #4a3528;animation:chIn .3s ease-out}.st-verdict p{margin:4px 0;font:700 14px var(--body,system-ui);color:#4a3528}
.st-why{display:flex;flex-wrap:wrap;justify-content:center;gap:4px}.st-why span{padding:2px 8px;border-radius:999px;font:700 11.5px var(--body,system-ui)}.st-why .ok{background:#dff3d6;color:#2f7f3c}.st-why .ko{background:#fde3e0;color:#b5443a}
.st-ov .cu-card{z-index:6}.st-ov .cu-li svg{width:34px;height:34px}
`;
  document.head.appendChild(css);
}

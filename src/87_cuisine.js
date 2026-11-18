// ================= 87 · MOMENT FORT : AIDER EN CUISINE (v83) =================
// 3e mini-jeu (17/11) : boulangeries, cafés, restaurants, glaciers, chocolateries. Un seul moment fort par voyage :
// dans ces commerces, la cuisine arrive une fois sur deux (sinon une situation d'aventure, 85).
// 3 commandes à préparer en 75 secondes, chacune en 3 gestes :
//   1. les INGRÉDIENTS dans l'ordre de la fiche (des intrus traînent sur le plan de travail) ;
//   2. PÉTRIR / FOUETTER : tapoter vite pour remplir la jauge avant qu'elle ne retombe ;
//   3. CUIRE : toucher quand l'aiguille passe dans la zone dorée (trop tôt = pas cuit, trop tard = brûlé).
// Recettes locales selon le commerce et la région (pizza en Italie, galette en Bretagne, onigiri au Japon…).
// Les plats réussis rentrent dans le sac : ingrédients d'appâts (pain, sucré, boisson…) ou à vendre ; le commerçant laisse un pourboire.
const ck$ = (f, d) => { try { return f(); } catch (e) { return d; } };
const CK_SHOPS = { boulangerie: 'boul', cafe: 'cafe', restaurant: 'resto', glacier: 'glace', chocolaterie: 'choco', creperie: 'cafe', patisserie: 'boul' };
const CK_ING = { farine: ['🌾', 'Farine'], eau: ['💧', 'Eau'], sel: ['🧂', 'Sel'], levure: ['🫧', 'Levure'], beurre: ['🧈', 'Beurre'], lait: ['🥛', 'Lait'], sucre: ['🍬', 'Sucre'], oeuf: ['🥚', 'Œuf'], choco: ['🍫', 'Chocolat'], creme: ['🍦', 'Crème'], fraise: ['🍓', 'Fraise'], noix: ['🌰', 'Noisettes'], tomate: ['🍅', 'Tomate'], fromage: ['🧀', 'Fromage'], herbe: ['🌿', 'Herbes'], oignon: ['🧅', 'Oignon'], aubergine: ['🍆', 'Aubergine'], poivron: ['🫑', 'Poivron'], riz: ['🍚', 'Riz'], poisson: ['🐟', 'Poisson'], miel: ['🍯', 'Miel'], citron: ['🍋', 'Citron'], pomme: ['🍎', 'Pomme'], glace: ['🧊', 'Glace pilée'], cafe: ['☕', 'Café'], carotte: ['🥕', 'Carotte'], champi: ['🍄', 'Champignon'] };
// [nom, emoji du plat, ingrédients, geste 2, geste 3, objet obtenu]
const CK_REC = {
  boul: [['Baguette', '🥖', ['farine', 'eau', 'sel', 'levure'], 'Pétrir', 'Enfourner', ['Baguette du fournil', 'n', 'pain', 1, null, '#d9a85c']],
    ['Croissant', '🥐', ['farine', 'beurre', 'lait', 'sucre'], 'Feuilleter', 'Dorer', ['Croissant au beurre', 'n', 'pain', 1, null, '#e2b46a']],
    ['Tarte aux pommes', '🥧', ['farine', 'beurre', 'pomme', 'sucre'], 'Abaisser', 'Cuire', ['Tarte aux pommes', 'n', 'sucre', 1, null, '#d98a4f']]],
  cafe: [['Chocolat chaud', '☕', ['lait', 'choco', 'sucre', 'creme'], 'Fouetter', 'Chauffer', ['Chocolat chaud', 'n', 'boisson', 1, null, '#8a5a3a']],
    ['Crêpe', '🥞', ['farine', 'oeuf', 'lait', 'beurre'], 'Fouetter', 'Retourner', ['Crêpe dorée', 'n', 'sucre', 1, null, '#e8c07a']],
    ['Café crème', '☕', ['cafe', 'lait', 'sucre', 'creme'], 'Mousser', 'Chauffer', ['Café crème', 'n', 'boisson', 0, null, '#a5784f']]],
  resto: [['Ratatouille', '🍲', ['aubergine', 'tomate', 'poivron', 'oignon'], 'Couper', 'Mijoter', ['Ratatouille maison', 'n', 'plat', 1, null, '#d9604f']],
    ['Omelette', '🍳', ['oeuf', 'beurre', 'fromage', 'herbe'], 'Battre', 'Cuire', ['Omelette baveuse', 'n', 'plat', 1, null, '#f2d36a']],
    ['Soupe', '🥣', ['carotte', 'oignon', 'eau', 'sel'], 'Éplucher', 'Mijoter', ['Soupe du jour', 'n', 'plat', 0, null, '#e89a4f']]],
  glace: [['Glace à la fraise', '🍨', ['lait', 'fraise', 'sucre', 'glace'], 'Turbiner', 'Refroidir', ['Glace à la fraise', 'n', 'sucre', 1, null, '#f49ab4']],
    ['Sorbet citron', '🍧', ['citron', 'sucre', 'eau', 'glace'], 'Turbiner', 'Refroidir', ['Sorbet citron', 'n', 'sucre', 1, null, '#f7e27a']]],
  choco: [['Truffes', '🍫', ['choco', 'beurre', 'creme', 'noix'], 'Tempérer', 'Refroidir', ['Truffes au chocolat', 'n', 'sucre', 2, null, '#5a3a2a']],
    ['Pâte à tartiner', '🫙', ['noix', 'choco', 'lait', 'sucre'], 'Mixer', 'Chauffer', ['Pâte à tartiner maison', 'n', 'sucre', 1, null, '#8a5a3a']]],
};
const CK_REG = {
  italie: ['Pizza', '🍕', ['farine', 'tomate', 'fromage', 'herbe'], 'Étaler', 'Enfourner', ['Pizza napolitaine', 'n', 'plat', 2, null, '#e0533d']],
  bretagne: ['Galette', '🫓', ['farine', 'oeuf', 'fromage', 'beurre'], 'Étaler', 'Retourner', ['Galette complète', 'n', 'plat', 2, null, '#c98f5a']],
  japon: ['Onigiri', '🍙', ['riz', 'poisson', 'sel', 'herbe'], 'Façonner', 'Presser', ['Onigiri', 'n', 'plat', 2, null, '#f4f1e6']],
  ara: ['Gratin dauphinois', '🥘', ['beurre', 'lait', 'creme', 'fromage'], 'Trancher', 'Gratiner', ['Gratin dauphinois', 'n', 'plat', 2, null, '#f0c76a']],
  iberie: ['Churros', '🥨', ['farine', 'eau', 'sucre', 'choco'], 'Pétrir', 'Frire', ['Churros', 'n', 'sucre', 2, null, '#d9a05c']],
};
const CK_TIME = 75, CK_N = 3;

if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  ck$(() => {
    const t = S.trips[k]; if (!t || t === before) return;
    const d = t.dest || {}, sh = [d.cat, ...(d.tags || [])].map(x => CK_SHOPS[x]).find(Boolean); if (!sh || Math.random() >= 0.55) return;
    t.mf = { k: 'cuis', sh, reg: ck$(() => regionAt(d.lon, d.lat).id, ''), at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
const ckName = k => ck$(() => CHARS[k].name, 'Votre compagnon');
const CK_PLACE = { boul: 'la boulangerie', cafe: 'le café', resto: 'le restaurant', glace: 'le glacier', choco: 'la chocolaterie' };
function ckAuto(t) { if (!t.mf || t.mf.k !== 'cuis' || (t.mf.st !== 'wait' && t.mf.st !== 'ready')) return; t.mf.st = 'auto'; const R = CK_REC[t.mf.sh][0]; const it = ck$(() => makeItem(R[5], 0, t.dest.name, t.dest.tags || [], { fixed: R[5][3] }), null); if (it) t.bag.push(it); ck$(save); }
function ckTick() {
  if (!S || !S.trips) return;
  let ch = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || !t.mf || t.mf.k !== 'cuis') continue;
    if (t.done) { if (t.mf.st === 'wait' || t.mf.st === 'ready') { ckAuto(t); ch = true; } continue; }
    if (t.mf.st === 'wait' && t.elapsed >= t.total * t.mf.at) { t.mf.st = 'ready'; ch = true; ck$(() => toast(`👩‍🍳 On a besoin de ${ckName(k)} en cuisine !`)); }
  }
  if (ch) { ck$(save); ck$(() => renderTripCard()); }
}
setInterval(() => { if (!document.hidden) ck$(ckTick); }, 2000);
if (typeof collect === 'function') collect = (orig => function () { ck$(() => Object.values(S.trips).forEach(t => { if (t && t.done && t.mf) ckAuto(t); })); return orig.apply(this, arguments); })(collect);
function ckReady() { for (const [k, t] of Object.entries(S.trips || {})) if (t && !t.done && t.mf && t.mf.k === 'cuis' && t.mf.st === 'ready') return { k, t }; return null; }
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && ['collect', 'cumf', 'chmf', 'pemf'].includes(a.kind)) return a;
  if (document.body.classList.contains('firstrun')) return a;
  const R = ck$(ckReady, null);
  return R ? { kind: 'ckmf', k: R.k, t: R.t } : a;
})(nextAction);
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = ck$(() => nextAction(), null);
  if (!a || a.kind !== 'ckmf') return orig.apply(this, arguments);
  box.hidden = false; box.className = 'tripcard act act-cu'; box.dataset.kind = 'ckmf'; box.dataset.k = a.k; box.dataset.sig = ck$(() => actionSig(a), '');
  box.innerHTML = `<span class="acic"><img src="${ck$(() => portraitURI(a.k, 'rire'), '')}" alt=""></span><div class="tcx"><span class="ack">Moment fort · ${esc(a.t.dest.name || '')}</span><b class="act-t">👩‍🍳 Coup de main en cuisine</b><span class="acs">${esc(CK_PLACE[a.t.mf.sh])} est débordé : à jouer avant son retour.</span></div><button class="btn green" data-ckplay="${a.k}">Jouer</button>`;
})(renderActionCard);
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-ckplay]'); if (!b) return; ev.stopPropagation(); ev.preventDefault(); ckOpen(b.dataset.ckplay); }, true);

// ================= LE MINI-JEU =================
let CK = null;
function ckRecipes(t) {
  const L = CK_REC[t.mf.sh].slice(), reg = CK_REG[t.mf.reg];
  const out = []; if (reg) out.push(reg);
  while (out.length < CK_N) out.push(L[Math.floor(Math.random() * L.length)]);
  return out.sort(() => Math.random() - 0.5);
}
function ckOpen(k) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.k !== 'cuis' || t.mf.st !== 'ready' || t.done) { ck$(() => toast('Ce moment est passé.')); return; }
  if (CK) return;
  const recs = ckRecipes(t);
  const el = document.createElement('div'); el.id = 'ckG'; el.className = 'ck-ov ck-' + t.mf.sh;
  el.innerHTML = `<div class="ck-wall"></div><div class="ck-shelf"><span>🫙</span><span>🍶</span><span>🥄</span><span>🍳</span><span>🫖</span></div>
    <div class="ck-top"><div class="ck-time"><i></i></div><div class="ck-dots">${recs.map(() => '<i></i>').join('')}</div><div class="cu-hearts"><i></i><i></i><i></i></div></div>
    <div class="ck-ticket"></div>
    <div class="ck-stage"></div>
    <div class="ck-me"><img alt="" src="${ck$(() => portraitURI(k), '')}"><span class="ck-toque"></span></div>
    <div class="cu-card cu-intro"><p class="cu-k">Moment fort · ${esc(t.dest.name || '')}</p><h3>Coup de main en cuisine</h3>
      <p class="ck-lead">${esc(CK_PLACE[t.mf.sh].replace(/^./, m => m.toUpperCase()))} est débordé ! ${esc(ckName(k))} enfile un tablier. ${CK_N} commandes à préparer :</p>
      <div class="ck-menu">${recs.map(r => `<span><b>${r[1]}</b>${esc(r[0])}</span>`).join('')}</div>
      <ol class="pe-how"><li>Posez les <b>ingrédients dans l’ordre</b> de la fiche. Attention aux intrus !</li><li><b>Tapotez vite</b> pour pétrir ou fouetter.</li><li>Touchez quand l’aiguille passe dans la <b>zone dorée</b> pour la cuisson.</li></ol>
      <button class="btn green big wide" data-ckgo="1">En cuisine !</button><button class="cu-later" data-ckquit="1">Plus tard</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
  CK = { k, t, el, recs, i: 0, ph: 'intro', time: 0, err: 0, res: [], last: performance.now() };
  requestAnimationFrame(ckLoop);
}
function ckClose() { if (!CK) return; CK.el.remove(); CK = null; document.body.classList.remove('cu-on'); ck$(() => renderTripCard()); }
function ckMood(m) { const img = CK && CK.el.querySelector('.ck-me img'); if (!img) return; img.src = ck$(() => portraitURI(CK.k, m), img.src); const me = CK.el.querySelector('.ck-me'); me.classList.remove('hop', 'oops'); void me.offsetWidth; me.classList.add(m === 'surpris' || m === 'triste' ? 'oops' : 'hop'); clearTimeout(CK.mt); CK.mt = setTimeout(() => { if (CK) img.src = ck$(() => portraitURI(CK.k), img.src); }, 900); }
function ckPop(txt, cls) { const s = CK.el.querySelector('.ck-stage'); const p = document.createElement('span'); p.className = 'ck-pop ' + (cls || ''); p.textContent = txt; s.appendChild(p); setTimeout(() => p.remove(), 900); }
function ckTicket() {
  const r = CK.recs[CK.i]; if (!r) return;
  const tk = CK.el.querySelector('.ck-ticket');
  const ingDone = CK.ph === 'ing' ? CK.step : 4;
  tk.innerHTML = `<span class="ck-tn">Commande ${CK.i + 1}/${CK.recs.length}</span><b>${r[1]} ${esc(r[0])}</b><div class="ck-steps">${r[2].map((x, j) => `<span class="${j < ingDone ? 'ok' : j === ingDone && CK.ph === 'ing' ? 'cur' : ''}">${CK_ING[x][0]}</span>`).join('<i>›</i>')}<i>›</i><span class="${CK.ph === 'mix' ? 'cur' : CK.ph === 'cook' || CK.ph === 'plate' ? 'ok' : ''}">${esc(r[3])}</span><i>›</i><span class="${CK.ph === 'cook' ? 'cur' : CK.ph === 'plate' ? 'ok' : ''}">${esc(r[4])}</span></div>`;
}
function ckStartRec() {
  const r = CK.recs[CK.i]; CK.ph = 'ing'; CK.step = 0; CK.q = { ok: true, mix: 0, cook: 0 };
  const pool = Object.keys(CK_ING).filter(x => !r[2].includes(x)).sort(() => Math.random() - 0.5).slice(0, 2);
  const all = r[2].concat(pool).sort(() => Math.random() - 0.5);
  CK.el.querySelector('.ck-stage').innerHTML = `<div class="ck-bowl"><span class="ck-bin"></span></div><div class="ck-counter">${all.map(x => `<button class="ck-ing" data-ckin="${x}"><span>${CK_ING[x][0]}</span><small>${esc(CK_ING[x][1])}</small></button>`).join('')}</div>`;
  ckTicket();
}
function ckIng(btn) {
  const r = CK.recs[CK.i], want = r[2][CK.step], x = btn.dataset.ckin;
  if (x === want) {
    btn.classList.add('used'); btn.disabled = true; CK.step++;
    const bin = CK.el.querySelector('.ck-bin'); bin.insertAdjacentHTML('beforeend', `<i>${CK_ING[x][0]}</i>`);
    ck$(() => sfx('pop'));
    if (CK.step >= r[2].length) ckMix(); else ckTicket();
  } else {
    CK.err++; CK.q.ok = false; btn.classList.remove('bad'); void btn.offsetWidth; btn.classList.add('bad');
    ckPop(`Pas de ${CK_ING[x][1].toLowerCase()} ici !`, 'ko'); ckMood('surpris');
    const hs = CK.el.querySelectorAll('.cu-hearts i'); if (hs[3 - CK.err]) hs[3 - CK.err].classList.add('off');
    ck$(() => navigator.vibrate && navigator.vibrate(50));
    if (CK.err >= 3) ckEnd();
  }
}
function ckMix() {
  const r = CK.recs[CK.i]; CK.ph = 'mix'; CK.mix = 0; CK.mixT = 0; ckTicket();
  CK.el.querySelector('.ck-stage').innerHTML = `<p class="ck-ask">${esc(r[3])} ! Tapotez vite le saladier</p><button class="ck-bowl big" data-ckmix="1"><span class="ck-bin">${r[2].map(x => `<i>${CK_ING[x][0]}</i>`).join('')}</span><span class="ck-spoon">🥄</span></button><div class="ck-gauge"><i></i></div>`;
}
function ckCook() {
  const r = CK.recs[CK.i]; CK.ph = 'cook'; CK.nd = 0; CK.dir = 1; CK.spd = 0.9 + CK.i * 0.35; CK.zone = 0.55 + Math.random() * 0.25; ckTicket();
  CK.el.querySelector('.ck-stage').innerHTML = `<p class="ck-ask">${esc(r[4])} : touchez dans la zone dorée</p><button class="ck-oven" data-ckcook="1"><span class="ck-dish">${r[1]}</span><span class="ck-fire">🔥</span></button><div class="ck-heat"><span class="ck-zone" style="left:${(CK.zone - 0.09) * 100}%;width:18%"></span><span class="ck-perf" style="left:${(CK.zone - 0.035) * 100}%;width:7%"></span><i class="ck-nd"></i><small class="l">Pas cuit</small><small class="r">Brûlé</small></div>`;
}
function ckPlate(q) {
  const r = CK.recs[CK.i]; CK.ph = 'plate'; ckTicket();
  const score = (CK.q.ok ? 1 : 0) + (CK.q.mix >= 1 ? 1 : 0) + q;
  CK.res.push({ r, score });
  const dot = CK.el.querySelectorAll('.ck-dots i')[CK.i]; if (dot) dot.className = score >= 3 ? 'p' : score >= 2 ? 'g' : 'b';
  const msg = score >= 3 ? 'Parfait ! Le chef applaudit' : score >= 2 ? 'Très bien !' : 'Bon… ça se mange';
  CK.el.querySelector('.ck-stage').innerHTML = `<div class="ck-plate ${score >= 3 ? 'perfect' : ''}"><span>${r[1]}</span></div><p class="ck-ask">${esc(msg)}</p>`;
  ckMood(score >= 2 ? 'rire' : 'content');
  setTimeout(() => { if (!CK || CK.ph !== 'plate') return; CK.i++; if (CK.i >= CK.recs.length) ckEnd(); else ckStartRec(); }, 1100);
}
document.addEventListener('pointerdown', ev => {
  if (!CK) return;
  const m = ev.target.closest && ev.target.closest('[data-ckmix]');
  if (m && CK.ph === 'mix') { CK.mix = Math.min(1, CK.mix + 0.085); m.classList.remove('tap'); void m.offsetWidth; m.classList.add('tap'); if (CK.mix >= 1) { CK.q.mix = 1; ckPop('Pâte parfaite !', 'ok'); setTimeout(() => { if (CK && CK.ph === 'mixd') ckCook(); }, 350); CK.ph = 'mixd'; } return; }
  const o = ev.target.closest && ev.target.closest('[data-ckcook]');
  if (o && CK.ph === 'cook') {
    const d = Math.abs(CK.nd - CK.zone), q = d < 0.035 ? 1 : d < 0.09 ? 0.6 : 0;
    ckPop(q === 1 ? 'Cuisson parfaite !' : q ? 'Bien cuit' : CK.nd < CK.zone ? 'Pas assez cuit…' : 'Un peu brûlé…', q ? 'ok' : 'ko');
    if (!q) ckMood('surpris');
    CK.ph = 'cooked'; setTimeout(() => { if (CK) ckPlate(q); }, 500);
  }
}, true);
document.addEventListener('click', ev => {
  if (!CK) return;
  const b = ev.target.closest && ev.target.closest('[data-ckgo],[data-ckquit],[data-ckdone],[data-ckin]'); if (!b) return;
  ev.stopPropagation();
  if (b.dataset.ckin) { if (CK.ph === 'ing') ckIng(b); return; }
  if (b.dataset.ckgo) { CK.el.querySelector('.cu-intro').remove(); CK.time = 0; CK.run = 1; ckStartRec(); return; }
  ckClose();
}, true);
function ckLoop(now) {
  if (!CK) return;
  const dt = Math.min(0.05, (now - CK.last) / 1000); CK.last = now;
  if (CK.run && CK.ph !== 'end') {
    CK.time += dt;
    const tb = CK.el.querySelector('.ck-time i'); if (tb) { const f = Math.max(0, 1 - CK.time / CK_TIME); tb.style.width = f * 100 + '%'; tb.style.background = f < 0.2 ? '#e0533d' : f < 0.45 ? '#f2c14e' : '#7fc462'; }
    if (CK.ph === 'mix') {
      CK.mixT += dt; CK.mix = Math.max(0, CK.mix - dt * 0.22);
      const g = CK.el.querySelector('.ck-gauge i'); if (g) g.style.width = CK.mix * 100 + '%';
      if (CK.mixT > 5) { ckPop('Pâte un peu grumeleuse', 'ko'); CK.ph = 'mixd'; setTimeout(() => { if (CK) ckCook(); }, 350); }
    }
    if (CK.ph === 'cook') {
      CK.nd += CK.dir * dt * CK.spd; if (CK.nd >= 1) { CK.nd = 1; CK.dir = -1; } if (CK.nd <= 0) { CK.nd = 0; CK.dir = 1; }
      const n = CK.el.querySelector('.ck-nd'); if (n) n.style.left = CK.nd * 100 + '%';
      const f = CK.el.querySelector('.ck-fire'); if (f) f.style.transform = `scale(${0.8 + CK.nd * 0.6})`;
    }
    if (CK.time >= CK_TIME) ckEnd();
  }
  requestAnimationFrame(ckLoop);
}
function ckEnd() {
  if (!CK || CK.ph === 'end') return;
  CK.ph = 'end';
  const t = CK.t, good = CK.res.filter(x => x.score >= 2), perf = CK.res.filter(x => x.score >= 3);
  const stars = perf.length >= 3 ? 3 : good.length >= 2 ? 2 : good.length >= 1 ? 1 : 0;
  const got = [];
  CK.res.forEach(x => { if (x.score < 1) return; const def = x.r[5].slice(); if (x.score >= 3) def[3] = Math.min(4, def[3] + 1); const it = ck$(() => makeItem(def, 0, t.dest.name, t.dest.tags || [], { fixed: def[3] }), null); if (it) { t.bag.push(it); got.push(it); } });
  const tip = good.length * 15 + perf.length * 10; if (tip) ck$(() => gainCoins(tip));
  t.mf.st = 'done'; t.mf.res = { stars, n: got.length }; ck$(save); ck$(renderTop);
  ck$(() => t.journal.push({ t: Date.now(), kind: 'cuisine', text: `${ckName(CK.k)} a donné un coup de main en cuisine : ${got.length} plat${got.length > 1 ? 's' : ''} réussi${got.length > 1 ? 's' : ''}.` }));
  const card = document.createElement('div'); card.className = 'cu-card cu-end';
  card.innerHTML = `<p class="cu-k">${['Service difficile', 'Ça a dépanné', 'Beau service', 'Service étoilé'][stars]}</p><div class="cu-stars">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}">★</i>`).join('')}</div>
    <div class="cu-loot">${got.map(it => `<span class="cu-li" style="--rc:${ck$(() => RARC[it.rarity], '#ccc')}"><span class="ck-em">${(CK.res.find(x => x.r[5][0] === it.name) || { r: ['', '🍽️'] }).r[1]}</span><b>${esc(it.name)}</b></span>`).join('') || '<span class="cu-none">Aucun plat servi…</span>'}${tip ? `<span class="cu-li" style="--rc:#f2c14e"><span class="ck-em">🪙</span><b>Pourboire : ${tip} pièces</b></span>` : ''}</div>
    <p class="cu-tip">${got.length ? `${esc(ckName(CK.k))} rapporte les plats à son retour : à vendre, ou pour les appâts de l’Herboristerie.` : 'Regardez bien la fiche : les ingrédients se posent dans l’ordre.'}</p>
    <button class="btn green big wide" data-ckdone="1">Super !</button>`;
  CK.el.appendChild(card); ckMood(stars >= 2 ? 'rire' : 'triste');
}
window.__ck = { force: (k, sh, reg) => { const t = S.trips[k]; if (t) t.mf = { k: 'cuis', sh: sh || 'boul', reg: reg || '', at: 0, st: 'ready' }; }, st: () => CK && { ph: CK.ph, i: CK.i, step: CK.step, want: CK.recs[CK.i] && CK.recs[CK.i][2][CK.step], nd: CK.nd, zone: CK.zone }, end: () => { if (CK) CK.time = CK_TIME; } };

{
  const st = document.createElement('style');
  st.textContent = `
.ck-ov{position:fixed;inset:0;z-index:9000;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation;background:#f6e8cf}
.ck-wall{position:absolute;left:0;right:0;top:0;height:58%;background:linear-gradient(rgba(255,255,255,.0),rgba(255,240,215,.35)),repeating-linear-gradient(0deg,transparent 0 38px,rgba(74,53,40,.12) 38px 40px),repeating-linear-gradient(90deg,#fdf7ec 0 38px,rgba(74,53,40,.12) 38px 40px)}
.ck-boul .ck-wall{background-color:#fdf3e2}.ck-cafe .ck-wall{filter:hue-rotate(-12deg)}.ck-glace .ck-wall{background:repeating-linear-gradient(90deg,#fde6ef 0 30px,#fff6fa 30px 60px)}.ck-choco .ck-wall{background:repeating-linear-gradient(90deg,#f1e2d4 0 30px,#fbf1e8 30px 60px)}
.ck-shelf{position:absolute;left:8%;right:8%;top:calc(env(safe-area-inset-top,0px) + 168px);height:14px;background:#b5844f;border:2px solid #4a3528;border-radius:4px;display:flex;justify-content:space-around;align-items:flex-end}
.ck-shelf span{font-size:26px;transform:translateY(-14px)}
.ck-ov::after{content:'';position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(#c98f5a,#a8703f);border-top:4px solid #4a3528;z-index:0}
.ck-top{position:absolute;left:10px;right:10px;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;align-items:center;gap:8px;z-index:2}
.ck-time{flex:1;height:14px;border-radius:999px;background:#e7dcc4;border:2.5px solid #4a3528;overflow:hidden}.ck-time i{display:block;height:100%;width:100%;background:#7fc462}
.ck-dots{display:flex;gap:4px}.ck-dots i{width:16px;height:16px;border-radius:50%;background:#fffaf0;border:2px solid #4a3528}.ck-dots i.p{background:#ffd95a}.ck-dots i.g{background:#7fc462}.ck-dots i.b{background:#d9cfbf}
.ck-ticket{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 40px);transform:translateX(-50%) rotate(-1deg);width:min(92vw,370px);padding:7px 10px 8px;background:#fffef8;border:2px solid #4a3528;border-radius:4px 4px 12px 12px;box-shadow:0 3px 0 rgba(74,53,40,.2);z-index:2;text-align:center}
.ck-ticket b{display:block;font:800 16px var(--display,system-ui);color:#4a3528}.ck-tn{font:800 10.5px var(--display,system-ui);letter-spacing:.06em;text-transform:uppercase;color:#a5784f}
.ck-steps{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:3px;margin-top:4px}.ck-steps span{min-width:28px;padding:2px 5px;border-radius:9px;background:#f3ece0;font:800 12px var(--body,system-ui);color:#6a5040;font-size:18px;line-height:1.2}
.ck-steps span:nth-last-child(-n+3){font-size:11.5px;padding:4px 6px}.ck-steps span.ok{background:#dff3d6;opacity:.75}.ck-steps span.cur{background:#ffe9a8;box-shadow:0 0 0 2px #e8a83a}.ck-steps i{font-style:normal;color:#a5784f;font-weight:900}
.ck-stage{position:absolute;left:0;right:0;top:34%;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px}
.ck-bowl{position:relative;width:150px;height:84px;border-radius:0 0 80px 80px;background:linear-gradient(#fff,#e6eef3);border:3px solid #4a3528;border-top-width:5px;display:flex;align-items:flex-start;justify-content:center;padding-top:8px}
.ck-bowl.big{width:200px;height:116px;cursor:pointer}.ck-bowl.tap{animation:ckTap .12s}@keyframes ckTap{50%{transform:scale(.95) rotate(-2deg)}}
.ck-bin{display:flex;flex-wrap:wrap;justify-content:center;gap:2px;max-width:85%}.ck-bin i{font-style:normal;font-size:24px;animation:ckIn .3s ease-out}@keyframes ckIn{from{transform:translateY(-40px);opacity:0}}
.ck-spoon{position:absolute;right:-6px;top:-24px;font-size:42px;transform:rotate(30deg)}
.ck-counter{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(94vw,380px);margin-top:10px}
.ck-ing{padding:8px 4px 6px;border-radius:16px;background:#fffaf0;border:2.5px solid #4a3528;box-shadow:0 4px 0 rgba(74,53,40,.3);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px}
.ck-ing span{font-size:34px;line-height:1.1}.ck-ing small{font:700 11.5px var(--body,system-ui);color:#4a3528}
.ck-ing.used{opacity:.3;transform:scale(.92)}.ck-ing.bad{animation:ckBad .35s}@keyframes ckBad{25%{transform:translateX(-6px);background:#fde3e0}75%{transform:translateX(6px);background:#fde3e0}}
.ck-ask{margin:0;padding:5px 12px;border-radius:999px;background:rgba(255,250,240,.95);border:2px solid #4a3528;font:800 14px var(--display,system-ui);color:#4a3528}
.ck-gauge,.ck-heat{position:relative;width:min(80vw,300px);height:22px;border-radius:999px;background:#e7dcc4;border:2.5px solid #4a3528;overflow:hidden}
.ck-gauge i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f2c14e,#7fc462)}
.ck-heat{overflow:visible;background:linear-gradient(90deg,#f6e7c6,#f2c14e 55%,#e0533d)}.ck-zone{position:absolute;top:0;bottom:0;background:rgba(255,236,150,.85);border-left:2px dashed #4a3528;border-right:2px dashed #4a3528}.ck-perf{position:absolute;top:0;bottom:0;background:#ffd95a}
.ck-nd{position:absolute;top:-8px;bottom:-8px;width:6px;margin-left:-3px;border-radius:3px;background:#4a3528;left:0}.ck-heat small{position:absolute;top:26px;font:700 11px var(--body,system-ui);color:#6a5040}.ck-heat .l{left:0}.ck-heat .r{right:0}
.ck-oven{position:relative;width:190px;height:130px;border-radius:18px;background:linear-gradient(#5a4a44,#3a302a);border:3px solid #4a3528;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 0 0 10px #6f5f58}
.ck-dish{font-size:54px;z-index:1}.ck-fire{position:absolute;bottom:6px;font-size:28px;transition:transform .1s}
.ck-plate{width:150px;height:150px;border-radius:50%;background:radial-gradient(#fff 55%,#e6eef3 56%,#fff 70%);border:3px solid #4a3528;display:flex;align-items:center;justify-content:center;font-size:70px;animation:ckIn .35s ease-out}.ck-plate.perfect{box-shadow:0 0 0 6px #ffe9a8,0 0 30px 10px rgba(255,217,90,.6)}
.ck-pop{position:absolute;top:-6px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;font:800 14px var(--display,system-ui);white-space:nowrap;animation:ckPopA .9s ease-out forwards;z-index:5}.ck-pop.ok{background:#dff3d6;color:#2f7f3c;border:2px solid #2f7f3c}.ck-pop.ko{background:#fde3e0;color:#b5443a;border:2px solid #b5443a}
@keyframes ckPopA{from{opacity:0;transform:translate(-50%,10px)}20%{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-20px)}}
.ck-me{position:absolute;left:4px;bottom:calc(env(safe-area-inset-bottom,0px) + 4px);width:96px;z-index:3;pointer-events:none}.ck-me img{width:96px;filter:drop-shadow(0 3px 0 rgba(74,53,40,.25))}.ck-me.hop img{animation:cuHop .45s ease-out}.ck-me.oops img{animation:cuOops .4s ease-out}
.ck-toque{position:absolute;left:30px;top:8px;width:36px;height:26px;background:#fff;border:2.5px solid #4a3528;border-radius:16px 16px 4px 4px;box-shadow:inset 0 -6px 0 #eee}
.ck-lead{margin:0 0 8px;font:600 13.5px var(--body,system-ui);color:#4a3528}.ck-menu{display:flex;justify-content:center;gap:6px;margin-bottom:8px}.ck-menu span{display:flex;flex-direction:column;align-items:center;padding:6px 8px;border-radius:14px;background:#fff3e2;font:700 11.5px var(--body,system-ui);color:#4a3528}.ck-menu b{font-size:30px}
.ck-em{font-size:26px}
.ck-ov .cu-card{z-index:6}.ck-ov .cu-hearts{padding:5px 7px}
`;
  document.head.appendChild(st);
}

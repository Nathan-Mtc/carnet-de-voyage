// =====================================================================
// v41 : NE JAMAIS SE PERDRE, ET VOIR QU'ON PROGRESSE
// 1. UN SEUL CONSEIL : nextAdvice() → { src, ico, txt, kick, sub, btn, go, dot }, une seule règle de priorité :
//    a. urgent : retour de voyage, choix en voyage, commande prête (nextAction de 20/21), client qui attend une
//       préparation finie (37), épreuve qui expire dans moins d'une heure (52), familier blessé sélectionné (41),
//       œuf prêt ;
//    b. l'étape de l'histoire (51) — si elle est bloquée, « Me guider » (57) ;
//    c. le guide en cours (57, S.guide) ;
//    d. la découverte conseillée de l'Exploration (52) ;
//    e. l'objectif du jour (38), puis l'épreuve du jour (52).
//    Affiché : carte d'action de l'écran principal (enveloppes nextAction / renderActionCard), en-tête de la page Quêtes
//    (enveloppe qtPageHTML) ; la « découverte » de l'Exploration passe au second plan si le conseil est ailleurs.
// 2. UN SEUL POINT ROUGE (.cs-dot), sur l'élément visible qui mène au conseil. Les autres pastilles (onglets, barre du
//    bas, sous-onglets, Quêtes, menu, marché, familiers…) deviennent bleu-gris (CSS sous body.cs-on, hors tutoriel).
// 3. progressToast(ico, titre, détail) : bandeau « ⭐ Progrès ! » en haut, avec file d'attente. Remplace pgCele (48 : rang,
//    stade, paliers), et les toasts « Page n du carnet », « … équipé sur … », « Désormais accessible » ; ajoute niveau de
//    terrain (enveloppe xpGain), nouveau matériel obtenu et palier de portée (S.cs = { pal, gear }, optionnel).
// Rien n'est supprimé. Tests : window.__cs.
// =====================================================================
const cs$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const csTuto = () => cs$(() => tuOn(), false) || cs$(() => document.body.classList.contains('firstrun'), false);
const csNm = k => cs$(() => compName(k), (CHARS[k] || {}).name || '');
const csE = k => cs$(() => compE(k), '');
const CS_TOP = '#modal:not([hidden]) .cs-adv .btn';
const CS_CARD = '#tripCard:not([hidden]) .btn';
const csCloseModal = () => { const m = $('modal'); if (m && !m.hidden) { m.hidden = true; cs$(() => { qtPageOn = false; }, 0); } };
const csQuests = t => { cs$(() => { qmTab = t; }, 0); const m = $('modal'); if (m && !m.hidden && m.querySelector('.md-page')) cs$(mdRerender, 0); else cs$(qtOpenPage, 0); };

// ---------- a. l'urgent ----------
function csFromAction(a) {
  if (!a) return null;
  const k = a.k, n = k ? csNm(k) : '';
  const run = ds => () => { csCloseModal(); cs$(() => runAction({ dataset: ds }), 0); };
  if (a.kind === 'collect') return { src: 'action', ico: '🎒', kick: 'Retour de voyage', txt: `${n} est rentré${csE(k)} !`, sub: a.t && a.t.dest ? a.t.dest.name : '', btn: 'Ouvrir le sac', go: run({ act: 'collect', k }), dot: [CS_TOP, CS_CARD, `#hudComps .hc-btn[data-sel="${k}"]`, '#nav [data-nav="carte"]'] };
  if (a.kind === 'choose') return { src: 'action', ico: '❓', kick: 'En voyage', txt: cs$(() => liveAskText(compName(k), a.j).replace(/ ! Choisis$/, ' !'), `${n} hésite !`), sub: a.j.text || '', btn: 'Choisir', go: run({ act: 'choose', k }), dot: [CS_TOP, CS_CARD, `#hudComps .hc-btn[data-sel="${k}"]`] };
  if (a.kind === 'deliver') { const c = cs$(() => BQC(a.o.client), { name: '' }); return { src: 'action', ico: '📦', kick: 'Boutique', txt: `Commande prête : ${c.name}`, sub: 'Tout est dans le sac : il ne reste qu’à livrer !', btn: 'Livrer', go: run({ act: 'deliver', id: a.o.id }), dot: [CS_TOP, CS_CARD, '#nav [data-nav="boutique"]'] }; }
  if (a.kind === 'hatch') return { src: 'action', ico: '🥚', kick: 'Nurserie', txt: 'Un œuf va éclore !', sub: 'Il remue… aidez-le à sortir', btn: 'Faire éclore', go: run({ act: 'hatch', id: a.egg.id }), dot: [CS_TOP, CS_CARD, '#nav [data-nav="village"]'] };
  return null;
}
function csPrep() {
  const T = cs$(() => cmT(), null); if (!T) return null;
  const c = cs$(() => cmState(), null); if (!c || !Array.isArray(c.buy)) return null;
  const stock = new Set(cs$(() => cmProducts(T.id), []).map(it => it.mk.rid));
  const b = c.buy.find(x => x.shop === T.id && stock.has(x.rid)); if (!b) return null;
  const R = CM_R[b.rid], cl = cs$(() => BQC(b.cid), { name: 'Un client' });
  return { src: 'prep', ico: '🧁', kick: 'Préparation prête', txt: `${cl.name} attend : ${R ? R.def[0] : 'votre produit'}`, sub: 'Votre préparation est finie : vendez-la au comptoir avant qu’il reparte !', btn: 'Vendre',
    go: () => { csCloseModal(); cs$(() => { bView = 'comptoir'; }, 0); cs$(() => openSheet('boutique'), 0); }, dot: [CS_TOP, CS_CARD, '#nav [data-nav="boutique"]'] };
}
function csDefiSoon() {
  const A = cs$(() => mdState().tr.act, null); if (!A) return null;
  const left = A.dl - cs$(mdNow, Date.now()); if (!(left > 0 && left < 3600e3) || A.n >= A.goal) return null;
  return { src: 'defi', ico: '⏱️', kick: 'Épreuve qui expire', txt: `${A.t} : plus que ${cs$(() => mdDur(left), Math.ceil(left / 60e3) + ' min')}`, sub: `${A.n}/${A.goal} · Gaspard la tente aussi`, btn: 'Voir', go: () => csQuests('defi'), dot: [CS_TOP, CS_CARD, '#qtBtns .qt-mb'] };
}
function csHurt() {
  const k = S.sel; if (!k || S.trips[k] || !(cs$(() => xpHurtLeft(k), 0) > 0)) return null;
  const o = cs$(() => teamIds(), []).find(c => c !== k && CHARS[c] && S.comps[c] && !S.trips[c] && !(cs$(() => xpHurtLeft(c), 0) > 0)); if (!o) return null;
  return { src: 'hurt', ico: '🩹', kick: 'Familier blessé', txt: `${csNm(k)} se repose : partez avec ${csNm(o)}`, sub: `Repos au foyer encore ${cs$(() => xpMin(xpHurtLeft(k)), '')}`, btn: 'Changer', go: () => { csCloseModal(); cs$(() => selectComp(o), 0); }, dot: [CS_TOP, CS_CARD, `#hudComps .hc-btn[data-sel="${o}"]`] };
}
// ---------- b. l'histoire ----------
function csStory() {
  if (typeof styState !== 'function') return null;
  const T = cs$(styState, null); if (!T || T.end) return null;
  const n = T.n, C = styC(n), s = styCh(n), st = styStep(n), L = cs$(() => styLines(n).find(x => x.on), null);
  let txt, btn = 'Y aller', go = () => { csCloseModal(); styGo(); };
  if (st === 0) { txt = n === 1 ? 'Un vieux carnet au grenier…' : `Chapitre ${n} : ${C.nm}`; btn = 'Lire'; go = () => { csCloseModal(); styState().pend = 0; styRead(); }; }
  else if (st === 4) { txt = `Page ${n} retrouvée !`; btn = 'Lire'; go = () => { csCloseModal(); styState().pend = 0; styRead(); }; }
  else {
    txt = L ? `${L.tx}${L.ct ? ` (${L.ct})` : ''}` : C.nm;
    if (s.miss && typeof gdFromStory === 'function') { btn = '🧭 Me guider'; go = () => { csCloseModal(); gdFromStory(); }; }
  }
  return { src: 'story', ico: '📔', kick: `Le carnet d’Augustine · Chapitre ${n}`, txt, sub: s.miss && st >= 1 && st <= 3 ? `⚠ ${s.miss}` : '', btn, go, dot: [CS_TOP, CS_CARD, '#qtBtns .qt-mb'] };
}
// ---------- c. le guide ----------
function csGuide() {
  if (!(S.guide && S.guide.on) || typeof gdTick !== 'function') return null;
  const d = S.guide.d || {};
  return { src: 'guide', ico: '🧭', kick: 'Le guide', txt: `Préparer le départ vers ${d.name || 'votre destination'}`, sub: 'Suivez la bulle, étape par étape.', btn: 'Continuer', go: () => { csCloseModal(); cs$(gdTick, 0); }, dot: [CS_TOP, CS_CARD] };
}
// ---------- d. la découverte ----------
function csExplo() {
  if (typeof exAdvice !== 'function') return null;
  const A = cs$(exAdvice, null); if (!A || A.story) return null;
  return { src: 'explo', ico: '🧭', kick: 'Prochaine découverte', txt: A.name, sub: A.txt, btn: 'Y aller', go: () => { csCloseModal(); cs$(exGoAdvice, 0); }, dot: [CS_TOP, CS_CARD, '#qtBtns .qt-mb'] };
}
// ---------- e. objectif du jour, épreuve du jour ----------
function csDaily() {
  const o = cs$(() => qtDay().list.find(x => !x.done), null);
  if (o) return { src: 'daily', ico: '🎯', kick: 'Objectif du jour', txt: `Trouver : ${o.name}`, sub: o.where || '', btn: 'Voir', go: () => csQuests('defi'), dot: [CS_TOP, CS_CARD, '#qtBtns .qt-mb'] };
  const M = cs$(mdState, null), X = M && !M.tr.act ? cs$(() => mdTrials().find(x => !M.tr.res[x.id]), null) : null;
  if (X) return { src: 'defi', ico: '🏆', kick: 'Épreuve du jour', txt: `${X.ico} ${X.t}`, sub: 'Gaspard la tente aussi.', btn: 'Voir', go: () => csQuests('defi'), dot: [CS_TOP, CS_CARD, '#qtBtns .qt-mb'] };
  return null;
}

let csOrigNA = nextAction;
function csCompute(a) {
  if (csTuto()) return csFromAction(a);
  const act = csFromAction(a);
  if (act && a.kind !== 'hatch') return act;              // retour de voyage, choix, commande prête
  return csPrep() || csDefiSoon() || csHurt() || act        // a. urgent (l'œuf après)
    || csStory() || csGuide() || csExplo() || csDaily() || null;
}
function nextAdvice() { return cs$(() => csCompute(csOrigNA()), null); }

// ---------- 1. carte d'action ----------
nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  try {
    if (csTuto()) return a;
    const A = csCompute(a);
    if (!A || A.src === 'action' || A.src === 'story') return a;
    return { kind: 'cs', k: `cs:${A.src}:${A.txt}`, adv: A };
  } catch (e) { return a; }
})(nextAction);
renderActionCard = (orig => function (box) {
  let a = null; try { a = !document.body.classList.contains('firstrun') ? nextAction() : null; } catch (e) { a = null; }
  if (!a || a.kind !== 'cs') { const r = orig.apply(this, arguments); csDotsSoon(); return r; }
  const A = a.adv;
  box.hidden = false; box.className = `tripcard act act-cs act-${A.src}`; box.dataset.k = ''; box.dataset.kind = 'cs';
  box.dataset.sig = actionSig(a);
  box.innerHTML = `<span class="acic"><span class="cs-ic">${A.ico}</span></span><div class="tcx"><span class="ack">${esc(A.kick)}</span><b class="act-t">${esc(A.txt)}</b><span class="acs">${esc(A.sub || '')}</span></div><button class="btn green" data-csgo="1">${esc(A.btn)}</button>`;
  csDotsSoon();
})(renderActionCard);

// ---------- 1. en-tête de la page Quêtes ----------
if (typeof qtPageHTML === 'function') qtPageHTML = (orig => function () {
  let h = orig.apply(this, arguments);
  try {
    if (csTuto()) return h;
    const A = nextAdvice(); if (!A) return h;
    const box = `<div class="cs-adv cs-${A.src}"><span class="cs-ic">${A.ico}</span><span class="cs-tx"><small>Le conseil du moment · ${esc(A.kick)}</small><b>${esc(A.txt)}</b></span><button class="btn green" data-csgo="1">${esc(A.btn)}</button></div>`;
    const i = h.indexOf('<nav class="qm-tabs"');
    if (i >= 0) h = h.slice(0, i) + box + h.slice(i);
    // la découverte de l'Exploration suit le conseil ; si le conseil est ailleurs, elle passe au second plan
    if (A.src !== 'story' && A.src !== 'explo') h = h.replace('class="md-big md-x" id="exAdvice"', 'class="md-big md-x cs-later" id="exAdvice"');
  } catch (e) { console.error('conseil quêtes', e); }
  setTimeout(csDots, 0);
  return h;
})(qtPageHTML);

document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-csgo]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  cs$(() => sfx('pop'), 0);
  const A = nextAdvice(); if (A && A.go) cs$(A.go, 0);
}, true);

// ---------- 2. un seul point rouge ----------
const csVis = el => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && !el.closest('[hidden]'); };
let csDotT = 0;
function csDotsSoon() { clearTimeout(csDotT); csDotT = setTimeout(csDots, 30); }
function csDots() {
  const on = !csTuto();
  document.body.classList.toggle('cs-on', on);
  let tgt = null;
  if (on) {
    const A = nextAdvice();
    if (A && A.dot) for (const s of A.dot) { const el = [...document.querySelectorAll(s)].find(csVis); if (el) { tgt = el; break; } }
  }
  document.querySelectorAll('.cs-dot').forEach(d => { if (!tgt || d.parentElement !== tgt) d.remove(); });
  document.querySelectorAll('.cs-host').forEach(e => { if (e !== tgt) e.classList.remove('cs-host'); });
  if (tgt && !tgt.querySelector(':scope > .cs-dot')) { tgt.classList.add('cs-host'); tgt.insertAdjacentHTML('beforeend', '<i class="cs-dot" aria-label="À faire maintenant"></i>'); }
}
setInterval(() => cs$(csDots, 0), 600);

// ---------- 3. la fête des progrès ----------
let csQ = [], csBusy = false;
function progressToast(ico, titre, detail) {
  csQ.push({ ico: ico || '⭐', t: String(titre || ''), d: String(detail || '') });
  if (!csBusy) csNextProg();
}
function csNextProg() {
  const p = csQ.shift(); if (!p) { csBusy = false; return; }
  csBusy = true;
  let el = $('csProg');
  if (!el) { el = document.createElement('div'); el.id = 'csProg'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.innerHTML = `<span class="csp-i">${esc(p.ico)}</span><span class="csp-x"><b>Progrès ! <em>${esc(p.t)}</em></b>${p.d ? `<small>${esc(p.d)}</small>` : ''}</span>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  cs$(() => sfx('pop'), 0);
  clearTimeout(csNextProg.h);
  csNextProg.h = setTimeout(() => { el.classList.remove('on'); setTimeout(csNextProg, 380); }, 2600);
}
// 48 : rang, stade, pouvoir, paliers du passeport, bâtiment
if (typeof pgCele === 'function') pgCele = function (msg) {
  const m = String(msg || ''); let r;
  if ((r = m.match(/^Nouveau rang : (.+?) ! (.*)$/))) return progressToast('🏅', `Rang ${r[1]}`, r[2]);
  if ((r = m.match(/^(.+?) devient (.+?) ! (.*)$/))) return progressToast('🌟', `${r[1]} : ${r[2]}`, r[3]);
  if ((r = m.match(/^(.+?) : nouveau pouvoir ! (.*)$/))) return progressToast('🌟', `${r[1]} : nouveau pouvoir`, r[2]);
  if ((r = m.match(/^Passeport : (.*?) ! (.*)$/))) return progressToast('🛂', `Passeport : ${r[1]}`, r[2]);
  if ((r = m.match(/^(.+? construite?) ! (.*)$/))) return progressToast('🏠', r[1], r[2]);
  return progressToast('⭐', m, '');
};
// toasts disparates → bandeau commun (par motif, prudemment)
toast = (orig => function (msg) {
  try {
    if (!csTuto()) {
      const m = String(msg || ''); let r;
      if ((r = m.match(/^Page (\d+) du carnet retrouvée ! Vous recevez : (.+?)\.?$/))) return progressToast('📔', `Page ${r[1]} du carnet`, `Vous recevez : ${r[2]}`);
      if ((r = m.match(/^Désormais accessible : (.+?) ✨$/))) return progressToast('🔓', 'Désormais accessible', r[1]);
      if ((r = m.match(/^(\d+) lieux désormais accessibles ✨$/))) return progressToast('🔓', 'Désormais accessible', `${r[1]} nouveaux lieux`);
      if ((r = m.match(/^(.+?) ?: équipée? sur (.+?)\. Vous pouvez repartir !$/)) || (r = m.match(/^(.+?) équipée? sur (.+?)\.$/))) return progressToast('🎒', 'Matériel équipé', `${r[1]} sur ${r[2]}`);
    }
  } catch (e) {}
  return orig.apply(this, arguments);
})(toast);
// 41 : niveau de terrain
if (typeof xpGain === 'function') xpGain = (orig => function (k, terr) {
  const r = orig.apply(this, arguments);
  try { if (r && r.l1 > r.l0 && !csTuto()) progressToast('⛰️', `${(XP_T[terr] || [])[1] || 'Terrain'} niv. ${r.l1}`, csNm(k)); } catch (e) {}
  return r;
})(xpGain);
// nouveau matériel obtenu, palier de portée (mémoire S.cs : rien n'est annoncé deux fois, rien à l'ancienne sauvegarde)
function csWatch() {
  if (!S || csTuto()) return;
  const first = !S.cs || typeof S.cs !== 'object';
  if (first) S.cs = { pal: {}, gear: [] };
  if (!S.cs.pal || typeof S.cs.pal !== 'object') S.cs.pal = {};
  if (!Array.isArray(S.cs.gear)) S.cs.gear = [];
  let ch = first;
  const gear = (S.inv || []).filter(it => it && cs$(() => xpGearOf(it), null));
  const known = new Set(S.cs.gear);
  gear.forEach(it => { if (known.has(it.id)) return; S.cs.gear.push(it.id); ch = true; if (!first) progressToast('🎒', 'Nouveau matériel', it.name); });
  if (S.cs.gear.length > 300) S.cs.gear = S.cs.gear.slice(-300);
  if (typeof dfRange === 'function' && typeof DF_PAL !== 'undefined') cs$(() => compIds(), []).forEach(k => {
    if (!CHARS[k] || !S.comps[k]) return;
    const km = cs$(() => dfRange(k, null).km, 0); if (!km) return;
    const i = DF_PAL.findIndex(p => km < p[0]), was = S.cs.pal[k];
    if (was == null) { S.cs.pal[k] = i; ch = true; return; }
    if (i > was) { S.cs.pal[k] = i; ch = true; progressToast('🧭', `Portée : ${DF_PAL[i][1]}`, `${csNm(k)} · ${Math.round(km).toLocaleString('fr-FR')} km`); }
  });
  if (ch) cs$(save, 0);
}
setInterval(() => cs$(csWatch, 0), 2000);

// ---------- styles ----------
try {
  const st = document.createElement('style'); st.id = 'csCSS';
  st.textContent = `
.cs-adv{display:flex;align-items:center;gap:10px;margin:2px 0 10px;padding:10px 10px 10px 12px;border-radius:16px;background:#fff7e8;border:2px solid #e8cf9f}
.cs-adv .cs-ic{font-size:24px;line-height:1;flex:none}.cs-adv .cs-tx{flex:1;min-width:0;display:flex;flex-direction:column}
.cs-adv small{font-size:.7rem;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#8a6a4a}.cs-adv b{font-size:.98rem;line-height:1.25}
.cs-adv .btn{flex:none;padding:8px 12px}
.act-cs .cs-ic{display:grid;place-items:center;width:100%;height:100%;font-size:30px}
.md-big.cs-later{padding:8px 10px;gap:3px;background:rgba(0,0,0,.03);border-width:1px}.md-big.cs-later .md-t{font-size:.98rem}.md-big.cs-later .btn{min-width:0;padding:6px 12px}
.cs-host{position:relative}
.cs-dot{position:absolute;top:-5px;right:-5px;width:13px;height:13px;border-radius:50%;background:#e5484d;border:2px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,.25);z-index:5;pointer-events:none;animation:csPing 1.6s ease-in-out infinite}
@keyframes csPing{50%{transform:scale(1.18)}}
body.cs-on .tb,body.cs-on .tb.soft,body.cs-on .bq-sdot,body.cs-on i.cpdot{background:#8fa3b8!important;color:#fff}
body.cs-on .sdot,body.cs-on .bq-rdot,body.cs-on .bq-pdot,body.cs-on .mdot,body.cs-on .mk-dot,body.cs-on .mk-ndot,body.cs-on .qt-dot,body.cs-on .qm-dot{background:#8fa3b8!important;width:9px!important;height:9px!important;box-shadow:none!important;border-width:1.5px!important}
body.cs-on .obdot{background:#8fa3b8!important;box-shadow:0 0 0 3px #e3eaf1!important;animation:none!important}
body.cs-on .st.done{background:#8fa3b8!important;animation:none!important}
#csProg{position:fixed;z-index:9500;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translate(-50%,-170%);display:flex;align-items:center;gap:10px;width:max-content;max-width:min(420px,calc(100vw - 32px));padding:8px 16px 8px 10px;border-radius:999px;border:2.5px solid #a8781a;background:linear-gradient(#fff6d0,#f6d77a);color:#4a3528;box-shadow:0 5px 0 rgba(120,80,20,.25),0 8px 18px rgba(0,0,0,.18);transition:transform .38s cubic-bezier(.3,1.4,.5,1);pointer-events:none}
#csProg.on{transform:translate(-50%,0)}
#csProg .csp-i{font-size:24px;line-height:1;flex:none}
#csProg .csp-x{display:flex;flex-direction:column;min-width:0}
#csProg b{font:800 14px/1.2 var(--display,inherit)}#csProg b em{font-style:normal;color:#8a4a10}
#csProg small{font-size:12px;line-height:1.2;color:#6a5040;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (prefers-reduced-motion:reduce){.cs-dot{animation:none}#csProg{transition:none}}`;
  document.head.appendChild(st);
} catch (e) {}

// ---------- tests ----------
window.__cs = {
  advice: () => { const A = nextAdvice(); return A && { src: A.src, txt: A.txt, kick: A.kick, btn: A.btn }; },
  progress: (i, t, d) => progressToast(i, t, d), dots: () => csDots(), watch: () => csWatch(), q: () => csQ.length,
  T: () => ({ S, BQ_SHOP_CLIENTS: typeof BQ_SHOP_CLIENTS !== 'undefined' ? BQ_SHOP_CLIENTS : {}, cmT, cmState, CM_R, cmUnlocked: typeof cmUnlocked === 'function' ? cmUnlocked : null, mdState, renderTripCard, qtOpenPage, toast, pgCele, xpGain }),
};

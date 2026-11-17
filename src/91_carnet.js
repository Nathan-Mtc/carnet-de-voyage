// ================= 91 · LE CARNET D'AUGUSTINE, NOUVELLE VERSION : L'HISTOIRE EST LE GUIDE (v87) =================
// Le joueur (17/11) : « le joueur doit être guidé ; au début, "Le goûter de Noisette" et "1/3 voyages", on ne comprend pas
// quoi faire ni le but du jeu ; l'histoire et la quête, je ne comprends plus la différence ».
// Décisions :
//  - LE BUT : Augustine, l'ancienne propriétaire de la maison, est partie suivre les compagnons sauvages à travers le monde
//    et n'est jamais revenue. Son carnet raconte son voyage : on suit ses traces, région après région.
//  - L'HISTOIRE (fil principal, toujours visible) suit la boucle du jeu, une seule chose à apprendre par étape :
//    premier voyage → moment fort → explorer sa région → l'habitant → l'équipement → le premier passage → un nouveau compagnon,
//    puis chaque nouvelle région est un chapitre.
//  - LES QUÊTES (facultatives) : les histoires des habitants, dans Quêtes › Habitants, à partir du chapitre 4. Plus sur la carte.
//  - En haut de la carte, UNE seule ligne : l'étape en cours. La carte du bas : les urgences, sinon cette même étape.
// L'ancien carnet (51, secrets dans le brouillard) est clos.
const ak$ = (f, d) => { try { return f(); } catch (e) { return d; } };
function akSt() {
  if (!S.cn || typeof S.cn !== 'object') S.cn = { ch: 1, read: {}, seen: {}, base: { trips: ak$(() => S.stats.trips, 0) || 0, comps: Object.keys(S.comps || {}).length }, mf: 0 };
  return S.cn;
}
ak$(akSt);
// l'ancien carnet est terminé
if (typeof styState === 'function') styState = (orig => function () { const T = orig.apply(this, arguments); if (T && !T.end) T.end = true; return T; })(styState);

const akHome = () => ak$(() => rgHome(), null);
const akFront = () => ak$(() => rcFront(), null);
const akPsDone = () => ak$(() => Object.keys(psSt().done).length, 0);
const akLearned = () => ak$(() => Object.keys(psSt().learn), []);
const akHabAsked = () => ak$(() => Object.keys(psSt().hab), []);
const akTrips = () => (ak$(() => S.stats.trips, 0) || 0) - akSt().base.trips;
const akGo = {
  read: () => akPage(akSt().ch),
  map: () => { ak$(() => { $('modal').hidden = true; }); ak$(() => { tab = 'carte'; renderPanel(); }); ak$(() => toast('Touchez un lieu sur la carte pour y envoyer un compagnon.')); },
  hab: () => { ak$(() => qtOpenPage()); ak$(() => qmShow('hab')); },
  forge: () => { ak$(() => { $('modal').hidden = true; }); ak$(() => { hmRoom = 'forge'; }); ak$(() => openSheet('village')); },
  herbo: () => { ak$(() => { $('modal').hidden = true; }); ak$(() => { hmRoom = 'herbo'; }); ak$(() => openSheet('village')); },
  couv: () => { ak$(() => { $('modal').hidden = true; }); ak$(() => { hmRoom = 'nurserie'; }); ak$(() => openSheet('village')); },
  passage: () => { ak$(() => { $('modal').hidden = true; }); const L = ak$(() => psAvail(), []); if (L.length) ak$(() => psOpen(psKey(L[0]))); else akGo.map(); },
};
// les chapitres : des étapes vérifiées d'après l'état du jeu
const AK_CH = [
  { nm: 'Le carnet au grenier', page: 'Si tu lis ces lignes, c’est que tu as trouvé mon carnet. Je m’appelle Augustine. Toute ma vie, j’ai suivi les compagnons sauvages à travers le monde : chaque région m’a appris un savoir-faire, chaque frontière m’a demandé du courage. Je suis repartie pour un dernier voyage… Si je ne suis pas revenue, suis mes traces. Commence près de chez toi.',
    steps: [{ tx: 'Lire la première page du carnet', ok: () => !!akSt().read[1], go: 'read', btn: 'Lire' },
      { tx: 'Envoyer un compagnon en voyage', sub: 'Touchez un lieu sur la carte.', ok: () => akTrips() >= 1 || ak$(() => Object.values(S.trips).some(Boolean), false), go: 'map', btn: 'Partir' },
      { tx: 'Vivre un moment fort en route', sub: 'Une cueillette, une pêche, un choix… la carte du bas vous prévient.', ok: () => akSt().mf >= 1, go: 'map', btn: 'Voir' }] },
  { nm: 'Explorer sa région', page: 'Avant de partir loin, apprends à connaître ton pays. Chaque coin a ses trésors, ses marchés, ses chemins. C’est en explorant sa région qu’on découvre où elle s’ouvre vers le reste du monde.',
    steps: [{ tx: () => `Explorer ${ak$(() => akHome().short, 'votre région')}`, ct: () => { const H = akHome(); return H ? `${Math.min(ak$(() => rcTrips(H.id), 0), ak$(() => rcNeed(H.id), 3))}/${ak$(() => rcNeed(H.id), 3)} voyages` : ''; }, sub: 'Voyagez dans votre région : les régions voisines en plaine s’ouvriront.', ok: () => { const H = akHome(); return !!H && !!ak$(() => rcSt().done[H.id], false); }, go: 'map', btn: 'Partir' }] },
  { nm: 'Le savoir des habitants', page: 'Aux frontières, il y a toujours quelqu’un qui sait : un guide, un marin, un éclusier. Rends-leur service, ils t’apprendront à franchir ce qui semble infranchissable. C’est comme ça que j’ai appris à forger mes premiers crampons.',
    steps: [{ tx: 'Rencontrer un habitant en voyage', sub: () => { const L = ak$(() => psAvail(), []); return L.length ? `Près d’un passage (${L.slice(0, 2).map(E => E[3] || PS_T[E[2]].nm).join(', ')}), un habitant pourra vous aider.` : 'Voyagez près des frontières de votre région.'; }, ok: () => akHabAsked().length + akLearned().length > 0, go: 'map', btn: 'Partir' },
      { tx: 'Lui rendre service', sub: 'Rapportez-lui ce qu’il demande, puis « Donner » dans Quêtes › Habitants.', ok: () => akLearned().length > 0, go: 'hab', btn: 'Voir' }] },
  { nm: 'L’atelier', page: 'Un bon équipement, c’est la moitié du voyage. Prends le temps de le fabriquer avec ce que tu as rapporté : chaque région prépare la suivante.',
    steps: [{ tx: () => `Fabriquer ${ak$(() => akLearned().map(g => PS_GEAR[g].nm).join(' ou '), 'l’équipement')} à la Forge`, sub: 'Un compagnon doit travailler à la Forge.', ok: () => akLearned().some(g => ak$(() => psHas(g), false)) || akPsDone() > 0, go: 'forge', btn: 'Forge' }] },
  { nm: 'La première frontière', page: 'Je me souviens de ma première frontière : j’avais peur, j’avais froid, et de l’autre côté, un monde entier m’attendait. Prends des provisions, choisis ton meilleur compagnon, et lance-toi.',
    steps: [{ tx: 'Franchir un passage', sub: 'Équipement + 2 provisions + un compagnon assez fort. Touchez l’icône du passage sur la carte.', ok: () => akPsDone() >= 1, go: 'passage', btn: 'Y aller' }] },
  { nm: 'Un nouveau compagnon', page: 'Chaque région a ses compagnons sauvages. Avec le bon appât, ils viennent à toi. Les miens m’ont suivie jusqu’au bout du monde.',
    steps: [{ tx: 'Fabriquer un appât à l’Herboristerie', ok: () => (S.inv || []).some(i => i && i.sub === 'appat') || akSt().bait || Object.keys(S.comps || {}).length > akSt().base.comps, go: 'herbo', btn: 'Herboristerie' },
      { tx: 'Partir avec l’appât et faire éclore un œuf', sub: 'L’appât attire les animaux : l’œuf rejoint la Couveuse.', ok: () => Object.keys(S.comps || {}).length > akSt().base.comps, go: 'couv', btn: 'Couveuse' }] },
];
// au-delà : un chapitre par nouvelle région, sur les traces d'Augustine
function akLoop(n) {
  const F = akFront(), done = akPsDone();
  return { nm: F ? `Sur ses traces : ${F.short}` : 'Sur ses traces', page: F ? `${F.name}. ${F.mood || ''} J’y suis passée moi aussi. Cherche ce qui la rend unique, puis trouve le chemin vers la suite.` : 'Le monde est grand. Continue.',
    steps: [{ tx: () => F ? `Explorer ${F.short}` : 'Explorer une nouvelle région', ct: () => F ? `${Math.min(ak$(() => rcTrips(F.id), 0), ak$(() => rcNeed(F.id), 3))}/${ak$(() => rcNeed(F.id), 3)} voyages` : '', ok: () => !F || !!ak$(() => rcSt().done[F.id], false), go: 'map', btn: 'Partir' },
      { tx: 'Franchir un nouveau passage', ct: () => `${akPsDone()} franchi${akPsDone() > 1 ? 's' : ''}`, ok: () => akPsDone() > (akSt().loopPs != null ? akSt().loopPs : done), go: 'passage', btn: 'Y aller' }] };
}
const akChap = n => n <= AK_CH.length ? AK_CH[n - 1] : akLoop(n);
const akVal = v => typeof v === 'function' ? ak$(v, '') : (v || '');
function akStep() {
  const s = akSt();
  for (let guard = 0; guard < 20; guard++) {
    const C = akChap(s.ch), i = C.steps.findIndex(x => !ak$(x.ok, false));
    if (i >= 0) return { n: s.ch, C, i, st: C.steps[i] };
    // chapitre terminé : on passe au suivant (la page se lit dans le carnet)
    s.ch++; if (s.ch > AK_CH.length) s.loopPs = akPsDone();
    s.newPage = s.ch; ak$(save);
    ak$(() => toast(`📖 Chapitre ${s.ch - 1} terminé : une nouvelle page du carnet !`));
  }
  return null;
}
// un moment fort joué compte pour le chapitre 1
setInterval(() => ak$(() => { const s = akSt(); if (s.mf) return; if (Object.values(S.trips || {}).some(t => t && t.mf && t.mf.st === 'done')) { s.mf = 1; save(); } if ((S.inv || []).some(i => i && i.sub === 'appat')) s.bait = 1; }), 2500);

// ---------- la page du carnet ----------
function akPage(n) {
  const s = akSt(), C = akChap(n); s.read[n] = 1; if (s.newPage === n || s.newPage === n - 1) s.newPage = 0; ak$(save);
  ak$(() => showModal(`<div class="cn-page"><p class="cn-k">Le carnet d’Augustine · Page ${n}</p><h2>${esc(C.nm)}</h2><p class="cn-txt">${esc(C.page)}</p><p class="cn-sig">— Augustine</p><button class="btn green big wide" data-closemodal="1">Fermer le carnet</button></div>`));
  ak$(() => renderTripCard()); ak$(() => cmGoal());
}
// ---------- le conseil (carte du bas et en-tête des quêtes) : l'étape de l'histoire ----------
if (typeof csStory === 'function') csStory = function () {
  if (document.body.classList.contains('firstrun')) return null;
  const s = akSt();
  if (s.newPage) { const n = s.newPage; return { src: 'story', ico: '📔', kick: `Le carnet d’Augustine · Page ${n}`, txt: `Une nouvelle page : « ${akChap(n).nm} »`, sub: 'Lisez la suite de l’histoire.', btn: 'Lire', go: () => { ak$(() => csCloseModal()); akPage(n); }, dot: [] }; }
  const P = akStep(); if (!P) return null;
  const ct = akVal(P.st.ct);
  return { src: 'story', ico: '📔', kick: `Chapitre ${P.n} · ${P.C.nm}`, txt: `${akVal(P.st.tx)}${ct ? ` (${ct})` : ''}`, sub: akVal(P.st.sub), btn: P.st.btn || 'Y aller', go: () => { ak$(() => csCloseModal()); (akGo[P.st.go] || akGo.map)(); }, dot: [] };
};
// ---------- la ligne du haut : seulement l'étape de l'histoire ----------
if (typeof cmGoal === 'function') cmGoal = (orig => function () {
  const r = orig.apply(this, arguments);
  ak$(() => {
    const g = document.getElementById('cmGoal'); if (!g) return;
    g.querySelectorAll('.cm-gq:not(.cn-ln),.rc-ln,.cm-ge').forEach(e => e.remove());
    const tuto = ak$(() => mdTuto(), false) || document.body.classList.contains('firstrun');
    const P = tuto ? null : akStep(); if (!P) { g.hidden = true; return; }
    const ct = akVal(P.st.ct), s = akSt();
    const h = `<span>📖</span><b>Chapitre ${P.n} :</b> ${esc(akVal(P.st.tx))}${ct ? ` <small>${esc(ct)}</small>` : ''}${s.newPage ? ' <em class="cn-new">page !</em>' : ''}<i>›</i>`;
    let b = g.querySelector('.cn-ln'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'cm-gq cn-ln'; b.dataset.cnln = '1'; g.prepend(b); }
    if (b.innerHTML !== h) b.innerHTML = h;
    g.hidden = !(typeof tab === 'undefined' || tab === 'carte');
  });
  return r;
})(cmGoal);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-cnln],[data-cngo],[data-cnpage]'); if (!b) return;
  ev.stopPropagation(); ev.preventDefault();
  if (b.dataset.cnpage) return akPage(+b.dataset.cnpage);
  const s = akSt(); if (s.newPage) return akPage(s.newPage);
  if (b.dataset.cngo) { const P = akStep(); if (P) (akGo[P.st.go] || akGo.map)(); return; }
  ak$(() => qtOpenPage()); ak$(() => qmShow('hist'));
}, true);
// la quête suivie des habitants ne s'affiche plus sur la carte : c'est facultatif
if (typeof cmQuest === 'function') cmQuest = () => null;

// ---------- Quêtes › Histoire : le carnet ----------
if (typeof QM_HTML !== 'undefined') {
  QM_HTML.hist = function () {
    const s = akSt(), P = akStep(), n = P ? P.n : s.ch;
    let h = `<div class="cn-goal"><b>Le but :</b> suivre les traces d’Augustine à travers le monde, région après région, avec vos compagnons.</div>`;
    if (P) {
      h += `<div class="cn-cur"><p class="cn-k">Chapitre ${n}</p><h3>${esc(P.C.nm)}</h3><ul class="cn-steps">${P.C.steps.map((x, i) => { const ok = ak$(x.ok, false), ct = akVal(x.ct); return `<li class="${ok ? 'ok' : i === P.i ? 'cur' : ''}"><span>${ok ? '✓' : i === P.i ? '›' : '·'}</span><div><b>${esc(akVal(x.tx))}${ct ? ` <small>${esc(ct)}</small>` : ''}</b>${i === P.i && akVal(x.sub) ? `<small>${esc(akVal(x.sub))}</small>` : ''}</div>${i === P.i ? `<button class="btn green sm" data-cngo="1">${esc(x.btn || 'Y aller')}</button>` : ''}</li>`; }).join('')}</ul></div>`;
    }
    const pages = []; for (let i = 1; i <= n; i++) if (i < n || s.read[i]) pages.push(i);
    if (akSt().read[n] || n === 1) { /* la page en cours se lit depuis l'étape */ }
    if (pages.length) h += `<h3 class="qt-h3">Pages retrouvées <small>${pages.length}</small></h3><div class="cn-pages">${pages.map(i => `<button class="cn-pg${s.read[i] ? '' : ' new'}" data-cnpage="${i}"><span>📄</span><b>${i}. ${esc(akChap(i).nm)}</b></button>`).join('')}</div>`;
    return h;
  };
  if (QM_HTML.hab) QM_HTML.hab = (orig => function () {
    if (akSt().ch >= 4) return orig.apply(this, arguments);
    return ak$(() => psHabHTML(), '') + `<p class="qt-hint">D’autres habitants vous confieront leurs histoires plus tard (à partir du chapitre 4 du carnet). Pour l’instant, suivez le carnet d’Augustine.</p>`;
  })(QM_HTML.hab);
  try { QM_BY.hist.nm = 'Histoire'; QM_BY.hab.nm = 'Quêtes'; QM_MODES.forEach(M => { if (M.id === 'hab') M.nm = 'Quêtes'; }); } catch (e) {}
}
window.__cn = { st: () => akSt(), step: () => { const P = akStep(); return P && { n: P.n, i: P.i, tx: akVal(P.st.tx) }; }, set: ch => { akSt().ch = ch; } };

{
  const css = document.createElement('style');
  css.textContent = `
.cn-ln small{font-weight:800;color:#8a6a4a;margin-left:3px}.cn-ln .cn-new{font-style:normal;margin-left:5px;padding:0 6px;border-radius:999px;background:#e0533d;color:#fff;font:800 10.5px var(--display,system-ui)}
.cn-page{padding:6px 4px 2px;background:repeating-linear-gradient(#fffdf6 0 27px,#efe3cc 27px 28px);border-radius:12px;text-align:left}
.cn-page h2{margin:2px 0 8px;font:800 22px var(--display,system-ui);color:#4a3528}.cn-k{margin:0;font:800 11px var(--display,system-ui);letter-spacing:.06em;text-transform:uppercase;color:#a5784f}
.cn-txt{font:italic 600 15px/28px Georgia,'Times New Roman',serif;color:#4a3528;margin:0 0 6px}.cn-sig{text-align:right;font:italic 700 15px Georgia,serif;color:#7a5238;margin:0 0 12px}
.cn-goal{margin:0 0 10px;padding:8px 10px;border-radius:14px;background:#fff3d6;border:2px solid #e8c88a;font:600 13px var(--body,system-ui);color:#4a3528}
.cn-cur{padding:10px;border-radius:16px;background:#fffaf0;border:2.5px solid #4a3528;margin-bottom:10px}.cn-cur h3{margin:0 0 6px;font:800 18px var(--display,system-ui);color:#4a3528}
.cn-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}.cn-steps li{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:12px;background:#f6efe2}
.cn-steps li>span{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e7dcc4;font:900 13px var(--display,system-ui);color:#6a5040;flex:none}
.cn-steps li.ok{opacity:.7}.cn-steps li.ok>span{background:#7fc462;color:#fff}.cn-steps li.cur{background:#fff3c9;box-shadow:0 0 0 2px #f2c14e}.cn-steps li.cur>span{background:#f2c14e;color:#4a3528}
.cn-steps li>div{flex:1;min-width:0;display:flex;flex-direction:column}.cn-steps b{font:700 13.5px var(--body,system-ui);color:#4a3528}.cn-steps small{font:600 12px var(--body,system-ui);color:#7a5f48}
.cn-pages{display:flex;flex-direction:column;gap:5px}.cn-pg{display:flex;gap:8px;align-items:center;padding:7px 10px;border-radius:12px;background:#fffaf0;border:2px solid #e7dcc4;text-align:left;cursor:pointer}.cn-pg b{font:700 13px var(--body,system-ui);color:#4a3528}.cn-pg.new{border-color:#e0533d}
`;
  document.head.appendChild(css);
}

// ---------- la carte du bas, au repos : l'étape de l'histoire ----------
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && !['idle', 'away', 'story', 'cmq'].includes(a.kind) && !(a.kind === 'cs' && a.adv && ['story', 'guide', 'explo', 'daily'].includes(a.adv.src))) return a;
  if (document.body.classList.contains('firstrun') || ak$(() => mdTuto(), false)) return a;
  const s = akSt(), P = akStep(); if (!P && !s.newPage) return a;
  return { kind: 'akst', k: s.newPage ? 'p' + s.newPage : `${P.n}:${P.i}:${akVal(P.st.ct)}` };
})(nextAction);
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = ak$(() => nextAction(), null);
  if (!a || a.kind !== 'akst') return orig.apply(this, arguments);
  const s = akSt(), P = akStep();
  box.hidden = false; box.className = 'tripcard act act-story'; box.dataset.kind = 'akst'; box.dataset.sig = ak$(() => actionSig(a), '');
  if (s.newPage) { const n = s.newPage; box.innerHTML = `<span class="acic"><span class="cs-ic">📔</span></span><div class="tcx"><span class="ack">Le carnet d’Augustine · Page ${n}</span><b class="act-t">Une nouvelle page : « ${esc(akChap(n).nm)} »</b><span class="acs">Lisez la suite de l’histoire.</span></div><button class="btn green" data-cnpage="${n}">Lire</button>`; return; }
  const ct = akVal(P.st.ct);
  box.innerHTML = `<span class="acic"><span class="cs-ic">📔</span></span><div class="tcx"><span class="ack">Chapitre ${P.n} · ${esc(P.C.nm)}</span><b class="act-t">${esc(akVal(P.st.tx))}${ct ? ` (${esc(ct)})` : ''}</b><span class="acs">${esc(akVal(P.st.sub) || 'Le carnet d’Augustine')}</span></div><button class="btn green" data-cngo="1">${esc(P.st.btn || 'Y aller')}</button>`;
})(renderActionCard);

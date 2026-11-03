// ================= PAGE QUÊTES EN 4 MODES (v33) =================
// Le joueur : « Dans les onglets de quête, on retrouve des éléments similaires et des doublons. On doit bien voir la différence
// entre les modes : récompenses pas identiques, difficulté pas similaire. »
// La page Quêtes est reconstruite ici en 4 onglets bien distincts (chacun n'affiche QUE son contenu, sans défilement vers une section) :
//   📖 Histoires   (histoires + gardiens)                         → tenues, recettes exclusives, familiers légendaires
//   🧭 Exploration (énigmes, traques, cartes déchirées, cadenas)  → titres, trésors uniques, lieux secrets
//   🌸 Monde       (météo, lieux éphémères, moments de saison)    → objets de saison, photos d'album
//   🏆 Défis       (objectif du jour, livraison, défis + contrats + rival) → SEULE source de pierres d'étoile
// Pièces et XP du familier : en bonus partout (plus généreux en Exploration et en Défis).
// Chaque carte porte une pastille de difficulté (1 à 3 ●) et une étiquette du type de récompense (couleur de l'onglet) : qmMeta().
// Les anciennes enveloppes de qtPageHTML (43, 44, 45) sont remplacées : qtPageHTML est réécrite ici et appelle leurs fonctions HTML.
// Expose window.__qm (tests).

const QM_MODES = [
  { id: 'hist', ico: '📖', nm: 'Histoires', pitch: 'Suivez le fil, rencontrez des personnages.', rw: 'Tenues, recettes exclusives, familiers légendaires.' },
  { id: 'explo', ico: '🧭', nm: 'Exploration', pitch: 'Cherchez par vous-même.', rw: 'Titres, trésors uniques, lieux secrets.' },
  { id: 'monde', ico: '🌸', nm: 'Monde', pitch: 'Soyez au bon endroit au bon moment.', rw: 'Objets de saison, photos d’album.' },
  { id: 'defi', ico: '🏆', nm: 'Défis', pitch: 'Dur et répétable.', rw: 'Pierres d’étoile.' },
];
const QM_BY = {}; QM_MODES.forEach(M => { QM_BY[M.id] = M; });
const qmCall = (f, d) => { try { return f(); } catch (e) { return d; } };
const qmTuto = () => qmCall(() => tuOn(), false);
let qmTab = 'hist', qmSnap = {}, qmAllLocks = false;

// pastille de difficulté + étiquettes du type de récompense (même couleur que l'onglet)
function qmMeta(mode, dif, tags) {
  const d = Math.max(1, Math.min(3, Math.round(dif || 1)));
  return `<span class="qm-meta"><i class="qm-dif" title="Difficulté ${d} sur 3" aria-label="Difficulté ${d} sur 3">${'●'.repeat(d)}<em>${'●'.repeat(3 - d)}</em></i>${(tags || []).filter(Boolean).map(t => `<i class="qm-tag qm-${mode}">${esc(t)}</i>`).join('')}</span>`;
}

// ---------------- points rouges des onglets ----------------
function qmDotsLive() {
  const o = {};
  o.hist = qmCall(() => MY_GUARDS.some(G => { const g = myGRec(G.id); return g.d && !g.done && (g.t || 0) >= G.offers.length; }), false);
  o.explo = qmCall(() => MY_MAPS.some(M => myComplete(M.id) && !myState().x[M.id]), false);
  return o;
}
const qmDot = id => !!(qmSnap[id] || qmDotsLive()[id]);

// ---------------- contenu de chaque onglet ----------------
function qmHistHTML() {
  const s = qtState(), f = QT_BY[s.follow];
  let h = f ? qtStoryHTML(f, true) : '<p class="qt-hint">Touchez « Suivre » sur une histoire : son étape s’affiche sur la carte.</p>';
  h += `<h3 class="qt-h3">Histoires <small>${qtDoneN()}/${QT_STORIES.length} terminées</small></h3><div class="qt-stories">${QT_STORIES.filter(q => q !== f).map(q => qtStoryHTML(q)).join('')}</div>`;
  if (!qmTuto() && typeof MY_GUARDS !== 'undefined') {
    const known = MY_GUARDS.filter(G => myGRec(G.id).d), un = MY_GUARDS.length - known.length;
    h += `<h3 class="qt-h3" id="myGardiens">🦌 Gardiens légendaires <small>${known.length}/${MY_GUARDS.length} · gagnez leur confiance</small></h3><div class="my-gs">${known.map(myGuardHTML).join('')}</div>`;
    if (un) h += `<p class="qt-hint qm-small">${un} gardien${un > 1 ? 's' : ''} encore inconnu${un > 1 ? 's' : ''} : en voyage, écoutez les rumeurs.</p>`;
  }
  return h;
}
function qmLockDif(P) { const s = P.need.reduce((a, n) => a + (n[0] === 'g' ? n[2] * 1.5 : n[2] / 2), 0); return s <= 4 ? 1 : s <= 7 ? 2 : 3; }
function qmLocksHTML() {
  if (typeof XP_PLACES === 'undefined') return '';
  const X = xpState(), won = XP_PLACES.filter(P => X.won[P.id]).length;
  const rows = XP_PLACES.filter(P => !X.won[P.id]).map(P => {
    const cs = qmCall(() => xpConds(P, S.sel), []), ok = cs.filter(c => c.ok).length;
    return { P, cs, ok, r: cs.length ? ok / cs.length : 0 };
  }).sort((a, b) => b.r - a.r || qmLockDif(a.P) - qmLockDif(b.P));
  const show = qmAllLocks ? rows : rows.slice(0, 5);
  let h = `<h3 class="qt-h3" id="qmLocks">🔒 Lieux verrouillés <small>${won}/${XP_PLACES.length} conquis · conditions pour ${esc(qmCall(() => CHARS[S.sel].name, 'votre familier'))}</small></h3>`;
  h += show.map(({ P, cs }) => qmCard({ id: 'lk_' + P.id, mode: 'explo', art: qmRewardArt({ k: 'item', def: P.item, mode: 'explo', coins: 300 }, 64), t: esc(P.name), line: `Titre « ${esc(P.title)} »`,
    body: `<span class="qm-conds">${cs.map(c => `<i class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'} ${esc(c.lbl)}</i>`).join('')}</span>`, dif: qmLockDif(P), btn: `<button class="btn cream sm" data-qmlock="${P.id}">Y aller</button>` })).join('');
  if (rows.length > 5) h += `<button class="qm-more" data-qmmore="1">${qmAllLocks ? 'Voir moins' : `Voir les ${rows.length - 5} autres`}</button>`;
  return h;
}
function qmExploHTML() {
  if (qmTuto() || typeof myRiddlesHTML !== 'function') return '<p class="qt-hint">L’exploration s’ouvre après le tutoriel.</p>';
  return `<section class="my-sec">${qmCall(myRiddlesHTML, '')}${qmCall(wdTrailHTML, '')}${qmCall(() => myMapsHTML().replace('Cartes déchirées <small>', '🗺️ Cartes déchirées <small>'), '')}</section>${qmCall(qmLocksHTML, '')}`;
}
function qmMondeHTML() {
  if (qmTuto() || typeof wdWxHTML !== 'function') return '<p class="qt-hint">Le monde s’éveille après le tutoriel.</p>';
  return `<section class="wd-sec">${qmCall(wdWxHTML, '')}${qmCall(wdEventsHTML, '')}${qmCall(wdMomentsHTML, '')}</section>`;
}
function qmDefiHTML() {
  let h = qmCall(qtDayHTML, '');
  const tu = qmTuto(), E = !tu && typeof eqState === 'function' ? qmCall(() => { eqTick(); return eqState(); }, null) : null;
  if (E && E.del) h += `<h3 class="qt-h3" id="eqLivr">📦 Livraison : apporter votre produit dans une autre ville</h3>${qmCall(() => eqDelCardHTML(E.del), '')}`;
  const open = QT_DEFIS.filter(d => !qtState().df[d.id]).length;
  h += `<h3 class="qt-h3" id="qmDefis">🏆 Défis <small>${E && E.con.length ? `${E.con.length} contrat${E.con.length > 1 ? 's' : ''} pressé${E.con.length > 1 ? 's' : ''} · ` : ''}${open} au long cours</small></h3>`;
  if (E) h += `<section class="eq-sec">${E.con.map(eqConHTML).join('')}${E.con.length || (E.riv && E.riv.last) ? qmCall(eqRivalHTML, '') : ''}</section>`;
  h += `<div class="qt-defis">${QT_DEFIS.map(qtDefiHTML).join('')}</div>`;
  return h;
}
const QM_HTML = { hist: qmHistHTML, explo: qmExploHTML, monde: qmMondeHTML, defi: qmDefiHTML };

// ---------------- v34 : VIGNETTES DE RÉCOMPENSE (le butin se voit avant de se lire) ----------------
// Le joueur : « Il est difficile de voir ce qu'on peut obtenir. On n'est pas attiré par la lecture descriptive. »
// qmRewardArt(rw, taille, opts) dessine la récompense : tenue PORTÉE par le familier sélectionné, recette sur une assiette,
// familier / gardien (silhouette « ? » puis portrait doré), titre sur une banderole, trésor avec halo de rareté,
// lieu secret (bout de carte avec un X), objet de saison (polaroïd), pierres d'étoile « ×N ». Pièces et XP : pastilles dessous.
// rw = { k: 'cloth'|'rec'|'egg'|'guard'|'title'|'item'|'secret'|'season'|'stones', def, sp, G, ti, n, coins, xp, rar, tag, got, myst, bonus, ico }
const QM_DF = { tete: 'bonnet', cou: 'echarpe', haut: 'pull', bas: 'short', mains: 'gants', pieds: 'bottes', dos: 'sac' };
const qmCharC = new Map();
let qmUid = 0;
// le familier sélectionné, dessiné en portant le vêtement (sans toucher à sa vraie tenue)
function qmWearSVG(def) {
  const k = S.sel, base = (S.outfits && S.outfits[k]) || CHARS[k].outfit, slot = def[2];
  const key = k + '|' + def[0] + '|' + JSON.stringify(base);
  if (qmCharC.has(key)) return qmCharC.get(key);
  const ok = f => !!f && f !== 'none' && !!(IC[f] || (VX[slot] && VX[slot][f]));
  let f = ok(def[4]) ? def[4] : (QM_DF[slot] || 'bonnet');
  const g = qmCall(() => vFormOf(def[0], slot, f), f); if (ok(g)) f = g;
  const o = Object.assign({}, base, { col: Object.assign({}, base.col || {}), worn: Object.assign({}, base.worn || {}) });
  o[slot] = f; o.col[f] = def[5] || IC[f]; delete o.worn[slot];
  const svg = qmCall(() => drawChar(k, o, 'rire', 'qmw' + (++qmUid)), '');
  if (qmCharC.size > 80) qmCharC.clear();
  qmCharC.set(key, svg); return svg;
}
const QM_PLATE = '<svg class="qra-plate" viewBox="0 0 60 24" aria-hidden="true"><ellipse cx="30" cy="12" rx="28" ry="10" fill="#fff" stroke="#5b4636" stroke-width="2"/><ellipse cx="30" cy="11" rx="19" ry="6" fill="#f4ecdf" stroke="#e2d4bf" stroke-width="1.2"/></svg>';
const QM_SECRET = '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M5 12 L17 7 L29 11 L41 5 L55 10 L53 50 L41 55 L29 50 L16 55 L7 50Z" fill="#f3dfae" stroke="#5b4636" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 7 L16 55 M41 5 L41 55" stroke="#d9bd84" stroke-width="1.3"/><path d="M8 34 Q14 28 22 33 Q26 36 22 42 Q14 46 8 42Z" fill="#a9d4ec" stroke="#5b4636" stroke-width="1.2"/><path d="M30 22 l4 -7 l4 7Z M36 24 l3 -5 l3 5Z" fill="#b9a68a" stroke="#5b4636" stroke-width="1.1" stroke-linejoin="round"/><circle cx="24" cy="18" r="3" fill="#8cc28a" stroke="#5b4636" stroke-width="1"/><path d="M14 47 Q24 40 30 44 T44 32" fill="none" stroke="#a0703a" stroke-width="1.8" stroke-dasharray="2.5 2.5"/><path d="M40 28 l8 8 M48 28 l-8 8" stroke="#d9302a" stroke-width="3.6" stroke-linecap="round"/></svg>';
const qmRName = rw => {
  if (!rw) return '';
  if (rw.k === 'cloth' || rw.k === 'item' || rw.k === 'season') return rw.def ? rw.def[0] : '';
  if (rw.k === 'rec') { const R = qmRecOf(); return R ? R.def[0] : 'Recette exclusive'; }
  if (rw.k === 'egg') return `Œuf de ${qmCall(() => spName(rw.sp), rw.sp).toLowerCase()}`;
  if (rw.k === 'guard') return rw.G ? (rw.myst ? 'Gardien inconnu' : rw.G.nm) : 'Gardien';
  if (rw.k === 'title') return `Titre « ${rw.ti} »`;
  if (rw.k === 'secret') return rw.tag || 'Lieu secret';
  if (rw.k === 'stones') return `${rw.n} pierre${rw.n > 1 ? 's' : ''} d’étoile`;
  return '';
};
// la prochaine recette exclusive de votre commerce (celle que donnera la quête)
function qmRecOf() { return qmCall(() => { const T = cmT(), st = cmState(); return T ? (CM_LINES[T.id] || []).find(x => x.x && !st.unl.includes(x.id)) || null : null; }, null); }
function qmPills(rw) {
  const a = [];
  if (rw.coins) a.push(`<i class="qra-pc">${COIN}${rw.coins}</i>`);
  if (rw.xp) a.push(`<i class="qra-px">+${rw.xp} XP</i>`);
  return a.length ? `<span class="qra-p">${a.join('')}</span>` : '';
}
function qmRewardArt(rw, z, o) {
  if (!rw) return '';
  z = z || 64; o = o || {};
  const mode = rw.mode || o.mode || qmTab;
  let k = rw.k;
  if (k === 'item' && rw.def && rw.def[1] === 'v') k = 'clothi'; // objet unique qui se porte : sur le familier, avec halo
  const r = Math.max(0, Math.min(4, rw.rar != null ? rw.rar : rw.def ? rw.def[3] : 4)), rc = RARC[r];
  let a = '', rib = '', tag = rw.tag != null ? rw.tag : RARITY[r], halo = false, extra = '';
  const icoOf = def => qmCall(() => itemIcon(bqItemOf(def)), '');
  switch (k) {
    case 'cloth': a = qmWearSVG(rw.def); rib = 'Tenue'; break;
    case 'clothi': a = qmWearSVG(rw.def); halo = true; rib = 'Unique'; break;
    case 'rec': { const R = qmRecOf(); a = (R ? qmCall(() => cmIcon(R, 'qmr' + (++qmUid)), '') : '') || qmCall(() => CM_SCROLL, ''); extra = QM_PLATE; rib = 'Recette'; tag = rw.tag || 'Exclusive'; break; }
    case 'egg': a = qmCall(() => bqEggSVG(rw.sp, 'qme' + (++qmUid)), ''); tag = rw.tag || 'Familier'; halo = !rw.myst; break;
    case 'guard': { const u = rw.G ? qmCall(() => clientURI(myGuardC(rw.G), 'content'), '') : ''; a = u ? `<img src="${u}" alt="">` : ''; tag = rw.tag || 'Légendaire'; halo = !rw.myst; break; }
    case 'title': a = `<span class="qra-ti"><em>★</em><span>${esc(rw.ti || '')}</span></span>`; tag = rw.tag || 'Titre'; break;
    case 'item': a = icoOf(rw.def); halo = true; break;
    case 'secret': a = QM_SECRET; tag = rw.tag || 'Lieu secret'; break;
    case 'season': {
      const inner = rw.def && rw.def[1] === 'v' ? qmWearSVG(rw.def) : icoOf(rw.def);
      a = `<span class="qra-pol"><span class="qra-ph" style="--pc:${(rw.def && rw.def[5]) || '#f6d2e0'}">${inner}</span><i>${rw.ico || '📷'}</i></span>`; tag = rw.tag || (rw.photo ? 'Photo' : 'Saison'); break;
    }
    case 'stones': a = qmCall(() => STONE_SVG, '★'); tag = ''; extra = `<b class="qra-n">×${rw.n || 1}</b>`; halo = true; break;
    default: a = qmCall(() => QT_TROPHY, '');
  }
  if (rw.bonus) extra += `<span class="qra-bo" title="Bonus">${rw.bonus}</span>`;
  const sh = (o.shine || halo) && !rw.myst && !rw.got;
  const cls = `qra k-${k} m-${mode}${rw.got ? ' got' : ''}${rw.myst ? ' myst' : ''}${z < 60 ? ' sm' : ''}${halo ? ' qra-hl' : ''}`;
  const box = `<span class="${cls}" style="--z:${z}px;--rc:${rc}">${halo ? '<i class="qra-h"></i>' : ''}<span class="qra-a">${a}</span>${extra}${rib && z >= 56 ? `<i class="qra-rb">${rib}</i>` : ''}${sh ? '<i class="qra-sp"><b>✦</b><b>✦</b><b>✦</b></i>' : ''}${rw.myst ? '<i class="qra-q">?</i><i class="qra-lk">🔒</i>' : ''}${rw.got ? '<i class="qra-ok">✓</i>' : ''}${tag && z >= 56 ? `<i class="qra-rt">${esc(tag)}</i>` : ''}</span>`;
  return `<span class="qra-w" style="--z:${z}px" role="img" aria-label="${esc(rw.myst ? 'Récompense mystère' : qmRName(rw))}">${box}${o.pills === false ? '' : qmPills(rw)}</span>`;
}
// conversion des récompenses des quêtes (38_quetes.js)
function qmFromQt(rw, mode) {
  const b = { mode, coins: rw.coins || 0 };
  if (rw.k === 'cloth') return Object.assign(b, { k: 'cloth', def: rw.def });
  if (rw.k === 'rec') return Object.assign(b, { k: 'rec', rar: 3 });
  if (rw.k === 'egg') return Object.assign(b, { k: 'egg', sp: rw.sp, rar: 4 });
  if (rw.k === 'secret') return Object.assign(b, { k: 'secret', rar: 3 });
  if (rw.k === 'item' && rw.def) return Object.assign(b, { k: 'item', def: rw.def });
  return Object.assign(b, { k: 'stones', n: rw.stones || 1 });
}
// une carte de quête : vignette à gauche, titre, 1 ligne, difficulté, « + » repliable, bouton
function qmCard(o) {
  const more = o.more ? `<details class="qmc-more"><summary aria-label="Plus de détails">+</summary><div>${o.more}</div></details>` : '';
  const meta = (o.dif || more) ? `<span class="qmc-m">${o.dif ? qmMeta(o.mode, o.dif, []) : ''}${more}</span>` : '';
  return `<div class="qmc qm-${o.mode}${o.cls ? ' ' + o.cls : ''}"${o.id ? ` id="qmq-${o.id}"` : ''}>${o.art || ''}<div class="qmc-x"><b>${o.t}</b>${o.line ? `<small>${o.line}</small>` : ''}${o.body || ''}${meta}</div>${o.btn ? `<div class="qmc-b">${o.btn}</div>` : ''}</div>`;
}
// la récompense apparaît quand on la gagne (histoire, défi) : petit effet léger, se ferme seul
function qmRewardPop(rw, head) {
  try {
    const old = document.querySelector('.qm-pop'); if (old) old.remove();
    const d = document.createElement('div'); d.className = 'qm-pop' + (qmCall(reduceMotion, false) ? ' still' : '');
    d.setAttribute('role', 'status');
    d.innerHTML = `<div class="qm-popc"><span class="qm-popk">${esc(head || 'Récompense obtenue !')}</span>${qmRewardArt(Object.assign({}, rw, { got: false, myst: false }), 112, { shine: 1 })}<b>${esc(qmRName(rw))}</b></div>`;
    d.addEventListener('click', () => d.remove());
    document.body.appendChild(d); setTimeout(() => { try { d.remove(); } catch (e) {} }, 3200);
  } catch (e) {}
}

// ---------------- vitrine : 4 à 6 récompenses phares en tête de chaque onglet ----------------
const QM_VIT = {
  hist() {
    const s = qtState(), out = [];
    QT_STORIES.forEach(q => { const rec = s.st[q.id], got = !!(rec && rec.done), open = qtOpen(q); out.push({ go: `qmq-st_${q.id}|qmq-big`, got, nm: open ? q.title : '???', rw: Object.assign(qmFromQt(q.rw, 'hist'), { got, myst: !open, coins: 0 }), w: got ? 9 : open ? (rec ? 0 : 1) : 3 }); });
    if (!qmTuto() && typeof MY_GUARDS !== 'undefined') MY_GUARDS.forEach(G => { const g = myGRec(G.id); out.push({ go: g.d ? `qmq-gd_${G.id}|myGardiens` : 'myGardiens', got: !!g.done, nm: g.d ? G.nm : '???', rw: { k: 'guard', mode: 'hist', G, got: !!g.done, myst: !g.d }, w: g.done ? 9 : g.d ? 0.5 : 2 }); });
    return qmPick(out, 6, 2, x => x.rw.k === 'guard');
  },
  explo() {
    const out = [];
    if (qmTuto() || typeof MY_RIDDLES === 'undefined') return out;
    MY_RIDDLES.forEach(R => { const done = !!myRec(R.id).done, open = myAvail(R), rw = qmRiddleRw(R, 'explo'); rw.got = done; rw.myst = !open; out.push({ go: `qmq-ri_${R.id}|myEnigmes`, got: done, nm: open ? qmRName(rw) : '???', rw, w: done ? 9 : open ? 1 : 3 }); });
    MY_MAPS.forEach(M => { const won = !!myState().x[M.id], full = myComplete(M.id); out.push({ grp: 1, go: `myMap_${M.id}|myCartes`, got: won, nm: full ? M.tr[0] : '???', rw: { k: full ? 'item' : 'secret', def: M.tr, mode: 'explo', got: won, myst: !full && !won, tag: full ? null : 'Lieu secret' }, w: won ? 9 : full ? 0 : 2 }); });
    if (typeof XP_PLACES !== 'undefined') { const X = xpState(); XP_PLACES.forEach(P => out.push({ grp: 1, go: `qmq-lk_${P.id}|qmLocks`, got: !!X.won[P.id], nm: P.item[0], rw: { k: 'item', def: P.item, mode: 'explo', got: !!X.won[P.id] }, w: X.won[P.id] ? 9 : 1.5 })); }
    return qmPick(out, 6, 3, x => x.grp);
  },
  monde() {
    const out = [];
    if (qmTuto() || typeof WD_MOM === 'undefined') return out;
    WD_MOM.forEach(M => { const st = wdMoState(M), soon = wdMoSoon(M); if (!st.season && !M.tide && soon > 60) return; out.push({ go: `qmq-mo_${M.id}`, got: !!st.got, nm: M.it[0], rw: { k: 'season', def: M.it, ico: M.ico, mode: 'monde', got: !!st.got }, w: st.got ? 9 : st.now ? 0 : st.season || M.tide ? 1 : 2 + soon / 100 }); });
    const n = wdNow(), W = wdState(); wdEvents().filter(E => E.end > n).forEach(E => { const K = WD_EK[E.k]; out.push({ go: `qmq-ev_${E.id}`, got: !!W.ev[E.id], nm: K.it[0], rw: { k: 'season', def: K.it, ico: K.ico, mode: 'monde', got: !!W.ev[E.id], tag: 'Éphémère' }, w: W.ev[E.id] ? 9 : E.start <= n ? 0.2 : 1.2 }); });
    return qmPick(out, 6, 6);
  },
  defi() {
    const out = [], s = qtState();
    const D = qmCall(qtDay, null); if (D) { const left = D.list.filter(o => !o.done), n = left.reduce((a, o) => a + qtDaySt(o), 0); if (n) out.push({ go: 'qtToday', nm: 'Objectif du jour', rw: { k: 'stones', n, mode: 'defi' }, w: 0 }); }
    const E = qmTuto() || typeof eqState !== 'function' ? null : qmCall(eqState, null);
    if (E) { E.con.forEach(c => out.push({ go: `qmq-co_${c.id}|qmDefis`, nm: 'Contrat', rw: { k: 'stones', n: Math.round(eqCDef(c).stones * (c.rev ? 1.5 : 1)), mode: 'defi' }, w: 0.5 })); if (E.del && E.del.st !== 'done') out.push({ go: 'eqLivr', nm: 'Livraison', rw: { k: 'stones', n: 2, mode: 'defi' }, w: 0.6 }); }
    QT_DEFIS.forEach(d => { const got = !!s.df[d.id], r = qmFromQt(d.rw, 'defi'); out.push({ go: `qmq-df_${d.id}|qmDefis`, got, nm: d.title, rw: { k: 'stones', n: d.rw.stones || 8, mode: 'defi', got, bonus: qmRewardArt(Object.assign(r, { coins: 0 }), 30, { pills: false }) }, w: got ? 9 : 1 + (1 - Math.min(1, qmCall(d.cur, 0) / qtDN(d))) }); });
    return qmPick(out, 6, 6);
  },
};
// les plus attirantes d'abord (pas encore gagnées), avec au plus « nb » éléments du groupe g
function qmPick(L, n, nb, g) {
  L = L.slice().sort((a, b) => a.w - b.w);
  if (!g) return L.slice(0, n);
  const A = L.filter(x => !g(x)), B = L.filter(g).slice(0, nb);
  const out = A.slice(0, n - Math.min(nb, B.length)).concat(B);
  return out.slice(0, n);
}
function qmRiddleRw(R, mode) {
  const v = qmCall(() => myRwVals(R), { coins: 0, xp: 0 });
  const b = { mode, coins: v.coins, xp: v.xp };
  if (R.rw.it) return Object.assign(b, { k: 'item', def: R.rw.it });
  if (R.rw.pc) return Object.assign(b, { k: 'secret', tag: 'Morceau de carte', rar: 4 });
  if (R.rw.gd) { const G = MY_GUARDS.find(x => x.id === R.rw.gd); const kn = !!(G && myGRec(G.id).d); return Object.assign(b, { k: 'guard', G, myst: !kn, tag: 'Secret de gardien' }); }
  return Object.assign(b, { k: 'title', ti: R.rw.ti });
}
function qmVitHTML(mode) {
  const L = qmCall(() => QM_VIT[mode](), []).filter(Boolean);
  if (!L.length) return '';
  return `<div class="qm-vitw qm-${mode}"><span class="qm-vith">✨ À gagner ici</span><div class="qm-vit" role="list">${L.map(v => {
    const st = v.got ? 'got' : v.rw.myst ? 'myst' : 'win';
    return `<button class="qm-vi ${st}" role="listitem" data-qmgo="${esc(v.go)}">${qmRewardArt(Object.assign({}, v.rw, { coins: 0, xp: 0 }), 76, { mode, shine: 1, pills: false })}<b>${esc(v.rw.myst ? '???' : v.nm)}</b><small>${st === 'got' ? 'Obtenu ✓' : st === 'myst' ? 'Mystère' : 'À gagner'}</small></button>`;
  }).join('')}</div></div>`;
}
function qmGo(spec) {
  const m = $('modal'); if (!m) return;
  const el = spec.split('|').map(id => m.querySelector('#' + CSS.escape(id))).find(Boolean); if (!el) return;
  qmCall(() => el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 0);
  el.classList.remove('qm-flash'); void el.offsetWidth; el.classList.add('qm-flash');
  setTimeout(() => el.classList.remove('qm-flash'), 1600);
}

// ---------------- la page ----------------
qtPageHTML = function () {
  if (!QM_BY[qmTab]) qmTab = 'hist';
  const M = QM_BY[qmTab];
  if (qmTab === 'monde') qmCall(() => { const W = wdState(); wdEvNow().forEach(E => { W.seen[E.id] = 1; }); }, 0);
  delete qmSnap[qmTab];
  const tabs = QM_MODES.map(T => `<button class="qm-t qm-${T.id}${T.id === qmTab ? ' on' : ''}" data-qmtab="${T.id}" aria-pressed="${T.id === qmTab}"><span>${T.ico}</span>${T.nm}${T.id !== qmTab && qmDot(T.id) ? '<i class="qm-dot" aria-label="nouveau"></i>' : ''}</button>`).join('');
  let body = '';
  try { body = QM_HTML[qmTab](); } catch (e) { console.error('quêtes onglet', e); }
  return `<div class="qt-page qm-page qm-on-${qmTab}${qmCall(reduceMotion, false) ? ' qm-still' : ''}"><div class="qt-top"><h2>Quêtes</h2><button class="qt-x" data-closemodal="1" aria-label="Fermer">✕</button></div>
    <nav class="qm-tabs" aria-label="Modes de quête">${tabs}</nav>
    <p class="qm-pitch qm-${qmTab}"><b>${M.pitch}</b><small>Pièces et XP en bonus</small></p>
    ${qmCall(() => qmVitHTML(qmTab), '')}
    <div class="qm-body" data-qmbody="${qmTab}">${body}</div>
    <div class="qt-acts"><button class="btn green" data-closemodal="1">Fermer</button></div></div>`;
};
qtOpenPage = function () {
  // points rouges : ce qui était nouveau AVANT l'ouverture (l'objectif du jour et les fêtes sont alors marqués « vus »)
  qmSnap = { defi: qmCall(qtDot, false), monde: qmCall(() => wdDot(), false) };
  const live = qmDotsLive();
  if (!qmSnap[qmTab] && !live[qmTab]) { const t = QM_MODES.find(T => qmSnap[T.id] || live[T.id]); if (t) qmTab = t.id; }
  qtPageOn = true;
  try { const s = qtState(); s.seen = qtDay().d; save(); } catch (e) {}
  qmCall(() => { const W = wdState(); wdEvNow().forEach(E => { W.seen[E.id] = 1; }); save(); }, 0);
  showModal(qtPageHTML()); qtBtns();
  const mb = document.querySelector('#modal .mbox'); if (mb) mb.scrollTop = 0;
};
try { window.__qt.page = qtOpenPage; window.__qt.list = qtOpenPage; } catch (e) {}
function qmShow(id) {
  if (!QM_BY[id]) return;
  qmTab = id; qtPageOn = true;
  const m = $('modal'); if (!m || m.hidden || !m.querySelector('.qt-page')) return qtOpenPage();
  showModal(qtPageHTML()); const mb = m.querySelector('.mbox'); if (mb) mb.scrollTop = 0;
}
function qmLockGo(id) {
  const P = typeof XP_P !== 'undefined' ? XP_P[id] : null; if (!P) return;
  const m = $('modal'); if (m) m.hidden = true; qtPageOn = false;
  qmCall(() => closeSheet(), 0);
  qmCall(() => { xpOpen = P.id; xpPinSig = ''; }, 0);
  qmCall(() => map.flyTo({ center: [P.lon, P.lat], zoom: 6, essential: true }), 0);
  setTimeout(() => qmCall(() => { xpPinSig = ''; xpMapUpdate(); }, 0), 1600);
}
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('[data-qmtab],[data-qmlock],[data-qmmore],[data-qmgo]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.qmtab) { qmCall(() => sfx('pop'), 0); return qmShow(d.qmtab); }
  if (d.qmlock) return qmLockGo(d.qmlock);
  if (d.qmgo) { qmCall(() => sfx('pop'), 0); return qmGo(d.qmgo); }
  if (d.qmmore) { qmAllLocks = !qmAllLocks; const m = $('modal'), mb = m && m.querySelector('.mbox'), y = mb ? mb.scrollTop : 0; showModal(qtPageHTML()); if (mb) mb.scrollTop = y; }
});
window.__qm = { art: qmRewardArt, vit: qmVitHTML, pop: qmRewardPop, wear: qmWearSVG, tab: qmShow, cur: () => qmTab, html: () => qtPageHTML(), meta: qmMeta, dots: () => Object.assign({}, qmSnap, qmDotsLive()), MODES: QM_MODES };

// ---------------- styles ----------------
(function qmCSS() {
  const st = document.createElement('style'); st.id = 'qmCSS';
  st.textContent = `
.qm-page{--qh:#7a52c0;--qhb:#efe6fb;--qx:#1f7f77;--qxb:#dcf2ee;--qm:#c4487a;--qmb:#fde4ee;--qd:#a8720a;--qdb:#fdf0d0;max-width:100%;overflow-x:hidden}
.qm-page *{max-width:100%}
.qm-page .qt-top{margin:0 0 8px;top:-18px;padding:8px 46px 8px;border-radius:0}.qm-page .qt-x{right:2px;top:50%;transform:translateY(-50%)}
.qm-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:2px 0 8px}
.qm-t{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 2px 6px;border-radius:14px;border:2.5px solid var(--c);background:#fffaf0;color:var(--c);font:800 11.5px/1.1 var(--display,inherit);cursor:pointer;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 2px 0 rgba(74,53,40,.25)}
.qm-t span{font-size:19px;line-height:1.1}
.qm-t.on{background:var(--c);color:#fff;box-shadow:0 2px 0 rgba(74,53,40,.45)}
.qm-t.qm-hist{--c:var(--qh)}.qm-t.qm-explo{--c:var(--qx)}.qm-t.qm-monde{--c:var(--qm)}.qm-t.qm-defi{--c:var(--qd)}
.qm-dot{position:absolute;right:5px;top:4px;width:11px;height:11px;border-radius:50%;background:#e5484d;border:2px solid #fff}
.qm-pitch{margin:0 0 8px;padding:7px 10px;border-radius:12px;border-left:5px solid var(--c);background:var(--cb);display:flex;flex-direction:column;gap:1px;font:600 12.5px/1.3 var(--body,inherit)}
.qm-pitch b{font:800 14px/1.2 var(--display,inherit);color:var(--c)}.qm-pitch span{font-weight:800}.qm-pitch small{font-size:11px;opacity:.7}
.qm-pitch.qm-hist{--c:var(--qh);--cb:var(--qhb)}.qm-pitch.qm-explo{--c:var(--qx);--cb:var(--qxb)}.qm-pitch.qm-monde{--c:var(--qm);--cb:var(--qmb)}.qm-pitch.qm-defi{--c:var(--qd);--cb:var(--qdb)}
.qm-body{min-width:0}.qm-body .qt-h3:first-child{margin-top:4px}
.qm-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:2px 0 1px;font-style:normal}
.qm-dif{font:800 10px/1 system-ui,sans-serif;letter-spacing:1px;color:#4a3528;font-style:normal;white-space:nowrap}.qm-dif em{font-style:normal;opacity:.22}
.qm-tag{font:800 10.5px/1.5 var(--display,inherit);font-style:normal;padding:0 7px;border-radius:999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qm-tag.qm-hist{background:var(--qhb,#efe6fb);color:var(--qh,#7a52c0)}.qm-tag.qm-explo{background:var(--qxb,#dcf2ee);color:var(--qx,#1f7f77)}.qm-tag.qm-monde{background:var(--qmb,#fde4ee);color:var(--qm,#c4487a)}.qm-tag.qm-defi{background:var(--qdb,#fdf0d0);color:var(--qd,#a8720a)}
.qm-page .qt-story,.qm-page .qt-defi,.qm-page .my-row,.qm-page .wd-row,.qm-page .eqc,.qm-page .my-g,.qm-page .qt-drow,.qm-lock{min-width:0}
.qm-page .qt-story>div,.qm-page .qt-defi>div,.qm-page .my-row>div,.qm-page .wd-row>div,.qm-page .eqc>div,.qm-page .my-g>div{min-width:0;overflow-wrap:anywhere}
.qm-lock{display:flex;align-items:center;gap:8px;background:#fffaf0;border:2px solid rgba(74,53,40,.3);border-radius:14px;padding:6px 8px;margin-bottom:6px}
.qm-lock>div{flex:1;min-width:0;display:flex;flex-direction:column;font:600 12px/1.25 var(--body,inherit)}.qm-lock b{font:800 13.5px/1.2 var(--display,inherit)}
.qm-li{font-size:20px;flex:none}
.qm-lock .btn{flex:none;max-width:92px;white-space:normal;line-height:1.1}
.qm-conds{display:flex;flex-wrap:wrap;gap:3px 6px;margin-top:2px}.qm-conds i{font-style:normal;font-size:11px;font-weight:700}.qm-conds .ok{color:#2f7f3a}.qm-conds .no{color:#b0482f}
.qm-more{display:block;margin:0 auto 6px;border:none;background:none;color:var(--qx);font:800 12.5px var(--display,inherit);text-decoration:underline;cursor:pointer}
.qm-small{font-size:12px;padding:6px 9px}

/* ---- v34 : vignettes de récompense ---- */
.qm-page{--mbh:#efe6fb}
.qra-w{flex:none;width:var(--z);display:flex;flex-direction:column;align-items:center;gap:3px}
.qra{position:relative;display:grid;place-items:center;width:var(--z);height:var(--z);border-radius:calc(var(--z)*.26);border:2.5px solid #5b4636;background:radial-gradient(circle at 50% 38%,#fffdf6 0 28%,var(--mb) 78%);box-shadow:0 3px 0 rgba(74,53,40,.3),inset 0 0 0 3px rgba(255,255,255,.6);overflow:hidden;isolation:isolate}
.qra.m-hist{--mb:#e6d8fa;--mc:#7a52c0}.qra.m-explo{--mb:#cdeee8;--mc:#1f7f77}.qra.m-monde{--mb:#fbd6e5;--mc:#c4487a}.qra.m-defi{--mb:#fbe6b4;--mc:#a8720a}
.qra.qra-hl{border-color:color-mix(in srgb,var(--rc) 55%,#5b4636)}
.qra-h{position:absolute;inset:-20%;background:radial-gradient(circle,color-mix(in srgb,var(--rc) 70%,#fff) 0,color-mix(in srgb,var(--rc) 35%,transparent) 38%,transparent 64%);z-index:-1}
.qra-a{display:grid;place-items:center;width:74%;height:74%}
.qra-a>svg,.qra-a>img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 2px 0 rgba(74,53,40,.18))}
.k-cloth .qra-a,.k-clothi .qra-a{width:104%;height:104%;margin-top:12%}
.k-rec .qra-a{width:56%;height:56%;margin-top:-10%;position:relative;z-index:1}
.qra-plate{position:absolute;left:8%;width:84%;bottom:12%;height:auto}
.k-egg .qra-a,.k-guard .qra-a{width:82%;height:82%}
.k-guard:not(.myst) .qra-a img{filter:drop-shadow(0 0 5px #ffd76a) drop-shadow(0 0 2px #fff3c4)}
.k-stones .qra-a{width:66%;height:66%}.k-stones .qra-a svg{filter:drop-shadow(0 0 6px rgba(159,220,246,.95))}
.qra .qra-n{position:absolute;right:4%;bottom:5%;background:#3d4f99;color:#fff;font:900 calc(var(--z)*.21)/1 var(--display,system-ui);padding:2px 5px 3px;border-radius:999px;border:2px solid #fff;box-shadow:0 1px 0 rgba(0,0,0,.25)}
.qra-bo{position:absolute;left:3%;top:3%;z-index:3}
.qm-page .qra-h,.qm-page .qra-a{max-width:none}
.qra-bo .qra{border-width:1.8px;box-shadow:none}
.qra-ti{display:flex;flex-direction:column;align-items:center;gap:1px;width:100%}
.qra-ti em{font-style:normal;color:#e0a52a;font-size:calc(var(--z)*.24);line-height:1;text-shadow:0 1px 0 #5b4636}
.qra-ti span{display:block;width:100%;background:#f2c14e;color:#4a3528;font:900 calc(var(--z)*.115)/1.12 var(--display,system-ui);text-align:center;padding:3px 9%;clip-path:polygon(0 0,100% 0,92% 50%,100% 100%,0 100%,8% 50%);overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.k-title .qra-a{width:96%;height:80%}
.qra-pol{display:flex;flex-direction:column;align-items:center;background:#fff;padding:6% 6% 3%;width:72%;transform:rotate(-6deg);border:1px solid #d8cbb8;box-shadow:0 2px 3px rgba(74,53,40,.3)}
.qra-ph{display:grid;place-items:center;width:100%;aspect-ratio:1;overflow:hidden;background:linear-gradient(160deg,#fff7e8,color-mix(in srgb,var(--pc) 45%,#fff))}
.qra-ph>svg{width:78%;height:78%}
.qra-pol i{font-style:normal;font-size:calc(var(--z)*.13);line-height:1.25}
.k-season .qra-a{width:96%;height:96%}
.qra-rb{position:absolute;top:9%;left:-26%;width:80%;transform:rotate(-38deg);background:var(--mc);color:#fff;font:900 calc(var(--z)*.105)/1.5 var(--display,system-ui);text-align:center;font-style:normal;box-shadow:0 1px 0 rgba(0,0,0,.2);z-index:2}
.qra-rt{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);background:var(--rc);color:#fff;font:900 8.5px/1.45 var(--display,system-ui);font-style:normal;padding:0 6px;border-radius:999px;border:1.5px solid #fff;white-space:nowrap;max-width:94%;overflow:hidden;text-overflow:ellipsis;z-index:2}
.k-stones .qra-rt{display:none}
.qra-sp{position:absolute;inset:0;pointer-events:none;z-index:3}
.qra-sp b{position:absolute;color:#fff;font-size:calc(var(--z)*.17);text-shadow:0 0 4px #ffd76a;animation:qmTw 2.4s ease-in-out infinite;opacity:0}
.qra-sp b:nth-child(1){left:12%;top:16%}.qra-sp b:nth-child(2){right:12%;top:30%;animation-delay:.8s}.qra-sp b:nth-child(3){left:58%;bottom:22%;animation-delay:1.6s}
@keyframes qmTw{0%,100%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1) rotate(25deg)}}
.qra.myst .qra-a{filter:brightness(0) opacity(.42)}.qra.myst .k-title,.qra.myst.k-title .qra-a{filter:blur(3px)}
.qra.myst{background:radial-gradient(circle at 50% 38%,#fff 0 20%,#ddd3c6 80%)}
.qra-q{position:absolute;inset:0;display:grid;place-items:center;font:900 calc(var(--z)*.42)/1 var(--display,system-ui);font-style:normal;color:#fff;text-shadow:0 2px 0 #5b4636,0 0 6px rgba(74,53,40,.5);z-index:2}
.qra-lk{position:absolute;right:3%;top:3%;font-style:normal;font-size:calc(var(--z)*.2);z-index:3}
.qra.got .qra-a{opacity:.75}
.qra-ok{position:absolute;right:3%;top:3%;width:calc(var(--z)*.28);height:calc(var(--z)*.28);border-radius:50%;background:#4f9f78;color:#fff;border:2px solid #fff;display:grid;place-items:center;font:900 calc(var(--z)*.16)/1 system-ui;font-style:normal;z-index:3}
.qra.sm .qra-rb,.qra.sm .qra-sp{display:none}
.qra-p{display:flex;flex-wrap:wrap;justify-content:center;gap:2px}
.qra-p i{display:inline-flex;align-items:center;gap:1px;font:800 9.5px/1.45 var(--display,system-ui);font-style:normal;color:#6b4a12;background:#fff3cf;border:1.5px solid #e0b75a;border-radius:999px;padding:0 4px;white-space:nowrap}
.qra-p i.qra-px{color:#2f6b8a;background:#e2f2fb;border-color:#8fc3e0}
.qra-p .coin{width:10px;height:10px}
/* cartes à vignette */
.qmc{display:flex;align-items:center;gap:9px;background:#fffaf0;border:2px solid rgba(74,53,40,.26);border-left:5px solid var(--c,#7a52c0);border-radius:16px;padding:7px 8px;margin:0 0 7px;box-shadow:0 2px 0 rgba(74,53,40,.14);min-width:0;scroll-margin:80px}
.qmc.qm-hist{--c:var(--qh);--cb:var(--qhb)}.qmc.qm-explo{--c:var(--qx);--cb:var(--qxb)}.qmc.qm-monde{--c:var(--qm);--cb:var(--qmb)}.qmc.qm-defi{--c:var(--qd);--cb:var(--qdb)}
.qmc-x{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;font:600 12px/1.25 var(--body,inherit)}
.qmc-x>b{font:800 14px/1.18 var(--display,inherit);color:#4a3528}
.qmc-x>small{font-size:12px;opacity:.8;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.qmc-x .qt-face{width:18px;height:18px;vertical-align:-4px;margin-right:2px;border-radius:50%}
.qmc-m{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:18px}
.qmc-more summary{list-style:none;cursor:pointer;width:20px;height:20px;border-radius:50%;background:var(--cb);color:var(--c);border:1.5px solid var(--c);font:900 14px/16px system-ui;text-align:center}
.qmc-more summary::-webkit-details-marker{display:none}
.qmc-more[open]{flex-basis:100%}.qmc-more[open] summary{transform:rotate(45deg)}
.qmc-more>div{margin-top:4px;font-size:12px;line-height:1.3;background:var(--cb);border-radius:10px;padding:5px 8px}
.qmc-b{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:4px}.qmc-b .btn{white-space:nowrap}
.qmc.done{opacity:.7}.qmc.locked{opacity:.85}
.qmc .qt-bar,.qmc .eqc-bar{margin:2px 0}
.qmc .qm-conds{margin:1px 0}
.qm-flash{animation:qmFlash 1.5s ease}
@keyframes qmFlash{0%,100%{box-shadow:0 2px 0 rgba(74,53,40,.14)}25%,60%{box-shadow:0 0 0 4px #ffd76a,0 0 16px #ffd76a}}
.qm-page .qt-big{--c:var(--qh);--cb:var(--qhb)}.qm-page .my-big{--c:var(--qx);--cb:var(--qxb)}
.qm-bigh{align-items:center!important;gap:10px!important}.qm-bigh>div{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}.qm-bigh h3{margin:0}
.my-bh>.qra-w{margin-top:2px}.my-rwl{font-weight:800;color:var(--qx)}.my-howd{margin:-2px 0 0}
.my-mcv{position:relative;display:block}.my-mcv>.qra-w{position:absolute;right:-3px;bottom:-4px}
.qm-ti{display:inline-block;width:20px;height:20px;vertical-align:-4px;margin-right:3px}.qm-ti svg{width:100%;height:100%}
.qm-page .eqc,.qm-page .wd-tr,.qm-page .my-g{align-items:center}.qm-page .eqc>.qra-w,.qm-page .wd-tr>.qra-w,.qm-page .my-g>.qra-w{align-self:flex-start}
.qmc.now{border-color:color-mix(in srgb,var(--c) 60%,transparent);background:#fff5f9}
/* vitrine */
.qm-vitw{margin:0 0 10px;padding:6px 6px 4px;border-radius:16px;background:linear-gradient(180deg,var(--cb),#fffaf0);border:2px solid color-mix(in srgb,var(--c) 40%,transparent)}
.qm-vitw.qm-hist{--c:var(--qh);--cb:var(--qhb)}.qm-vitw.qm-explo{--c:var(--qx);--cb:var(--qxb)}.qm-vitw.qm-monde{--c:var(--qm);--cb:var(--qmb)}.qm-vitw.qm-defi{--c:var(--qd);--cb:var(--qdb)}
.qm-vith{display:block;font:800 12px/1.2 var(--display,inherit);color:var(--c);margin:0 2px 4px}
.qm-vit{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;padding:2px 2px 6px;scroll-snap-type:x proximity;scrollbar-width:thin}
.qm-vi{flex:none;width:84px;scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;padding:0;cursor:pointer;color:#4a3528}
.qm-vi>b{font:800 11px/1.15 var(--display,inherit);text-align:center;width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.3em}
.qm-vi>small{font:800 10px/1.5 var(--display,inherit);padding:0 7px;border-radius:999px;background:var(--c);color:#fff}
.qm-vi.got>small{background:#4f9f78}.qm-vi.myst>small{background:#8a7d70}
.qm-vi:active .qra{transform:scale(.95)}
.qm-vi.win .qra{animation:qmBob 3s ease-in-out infinite}.qm-vi.win:nth-child(2n) .qra{animation-delay:-1.5s}
@keyframes qmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
/* apparition quand on gagne */
.qm-pop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(74,53,40,.35);cursor:pointer}
.qm-popc{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fffaf0;border:3px solid #5b4636;border-radius:22px;padding:14px 22px 16px;box-shadow:0 6px 0 rgba(74,53,40,.3);max-width:86vw;text-align:center;animation:qmPop .5s cubic-bezier(.3,1.6,.5,1)}
.qm-popc>b{font:800 16px/1.2 var(--display,inherit);color:#4a3528}
.qm-popk{font:800 13px var(--display,inherit);color:#a8720a}
@keyframes qmPop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
.qm-still .qra-sp,.qm-pop.still .qra-sp{display:none}.qm-still .qm-vi .qra,.qm-pop.still .qm-popc,.qm-still .qm-flash{animation:none}
@media (prefers-reduced-motion:reduce){.qra-sp{display:none}.qm-vi .qra,.qm-popc,.qm-flash{animation:none!important}}
`;
  document.head.appendChild(st);
})();

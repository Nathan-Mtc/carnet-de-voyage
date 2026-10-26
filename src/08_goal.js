// ================= LE GRAND CARNET (but du jeu) =================
const EUROPE = ['Suisse', 'Italie', 'Espagne', 'Portugal', 'Pays-Bas', 'Royaume-Uni', 'Écosse', 'Islande', 'Norvège', 'Finlande', 'Allemagne', 'Tchéquie', 'Autriche', 'Grèce', 'Turquie'];
const zoneOf = p => p.country === 'France' ? 'fr' : EUROPE.includes(p.country) ? 'eu' : 'monde';
const foundIn = z => PLACES.filter(p => zoneOf(p) === z && S.found[p.name]).length;
const totalIn = z => PLACES.filter(p => zoneOf(p) === z).length;
function nextPlaceIn(z) {
  const h = homeObj();
  return PLACES.filter(p => zoneOf(p) === z && !S.found[p.name] && p.name !== S.home).sort((a, b) => kmBetween(h, a) - kmBetween(h, b))[0];
}
function goToPlace(p) { if (!p) return; if (S.trips[S.sel]) { openSheet('voyage'); return; } choosePlace(p); zoomTo(p.lon, p.lat, Math.max(zoomT.k, 20)); }
const tripActive = () => Object.values(S.trips).some(t => t);
const goHome = () => { const h = homeObj(); zoomTo(h.lon, h.lat, Math.pow(2, (mapMode === 'tiles' ? 15.5 : 13.2) - 1.5)); toast('Touchez une boulangerie, un parc ou une rue pour voir ce qu’on peut y trouver.'); };
const goTrip = () => { const t = S.trips[S.sel]; if (t && t.done) collect(); else openSheet('voyage'); };
const anyTier = n => collections().some(c => colTierReached(c) >= n);
const achCount = () => Object.keys(S.achClaimed || {}).length;
// Chapitres courts au début (3 étapes de quelques minutes chacune), puis les grands objectifs.
const CHAPTERS = [
  { key: 'debut', name: 'Premiers pas', icon: 'compass', steps: [
    { txt: 'Envoie un compagnon en voyage', done: () => (S.stats.started || 0) >= 1, go: () => openSheet('voyage') },
    { txt: 'Réponds à un choix pendant son voyage', done: () => (S.stats.choices || 0) >= 1, go: () => openSheet('voyage') },
    { txt: 'Ouvre son sac à son retour', done: () => (S.stats.trips || 0) >= 1, go: goTrip },
  ], reward: { coins: 60, item: ['Bonnet du baroudeur', 'v', 'tete', 1, 'bonnet', '#e9784a'] } },
  { key: 'quartier', name: 'Mon quartier', icon: 'house', steps: [
    { txt: 'Zoome sur ton quartier et récolte dans un lieu (boulangerie, parc, rue…)', done: () => (S.stats.poiTrips || 0) >= 1 || (S.stats.poiStarted || 0) >= 1, go: goHome },
    { txt: 'Habille un compagnon avec une trouvaille', done: () => (S.stats.worn || 0) >= 1, go: () => { bagFilter = 'v'; openSheet('sac'); } },
    { txt: 'Vends un objet dont tu n’as pas besoin', done: () => (S.stats.sold || 0) >= 1, go: () => { bagFilter = 'all'; openSheet('sac'); toast('Le bouton avec une pièce, à droite de chaque objet, le vend tout de suite.'); } },
  ], reward: { coins: 100, item: ['Foulard du quartier', 'v', 'cou', 2, 'foulard', '#58c2b0'] } },
  { key: 'mains', name: 'Petites mains', icon: 'hammer', steps: [
    { txt: 'Récupère la récompense d’une quête du jour', done: () => (S.stats.qclaimed || 0) >= 1 || S.daily.quests.some(q => q.claimed), go: () => { questView = 'jour'; openSheet('quetes'); } },
    { txt: 'Fabrique un objet à l’atelier', done: () => (S.stats.crafted || 0) >= 1, go: () => openSheet('atelier') },
    { txt: 'Décore la maison', done: () => Object.values(S.house).some(Boolean), go: () => openSheet('maison') },
  ], reward: { coins: 150, item: ['Écharpe du voyageur', 'v', 'cou', 3, 'echarpe', '#e9784a'] } },
  { key: 'collec', name: 'Le collectionneur', icon: 'book', steps: [
    { txt: 'Découvre 20 objets différents', done: () => Object.keys(S.dex).length >= 20, go: () => openSheet('voyage') },
    { txt: 'Atteins 25 % d’une collection de lieu', done: () => anyTier(1), go: () => { questView = 'col'; openSheet('quetes'); } },
    { txt: 'Fais monter un compagnon au niveau 3', done: () => Object.values(S.prog).some(p => p.lvl >= 3), go: () => openSheet('voyage') },
  ], reward: { coins: 200, item: ['Sac à dos d’aventurier', 'v', 'dos', 3, 'sac', '#a87a50'] } },
  { key: 'france', name: 'Le tour de France', icon: 'flag', count: () => foundIn('fr'), goal: 5, txt: n => `Trouve ${n} souvenirs uniques en France`, go: () => goToPlace(nextPlaceIn('fr')), reward: { coins: 300, item: ['Béret tricolore', 'v', 'tete', 4, 'beret', '#3b5aa8'] } },
  { key: 'amis', name: 'Les trois amis', icon: 'heart', steps: [
    { txt: 'Fais voyager Pistache, Mochi et Bulle jusqu’au niveau 2', done: () => Object.values(S.prog).every(p => p.lvl >= 2), go: () => { const k = Object.keys(S.prog).find(x => S.prog[x].lvl < 2); if (k) selectComp(k); openSheet('voyage'); } },
    { txt: 'Récupère 5 succès', done: () => achCount() >= 5, go: () => { questView = 'succes'; openSheet('quetes'); } },
    { txt: 'Atteins 50 % d’une collection de lieu', done: () => anyTier(2), go: () => { questView = 'col'; openSheet('quetes'); } },
  ], reward: { coins: 300, item: ['Pull des trois amis', 'v', 'haut', 3, 'pull', '#f08aa6'] } },
  { key: 'europe', name: 'Grand tour d’Europe', icon: 'globe', count: () => foundIn('eu'), goal: 8, txt: n => `Trouve ${n} souvenirs uniques en Europe`, go: () => goToPlace(nextPlaceIn('eu')), reward: { coins: 500, item: ['Cape de l’explorateur', 'v', 'dos', 4, 'cape', '#3f6e5a'] } },
  { key: 'monde', name: 'Le tour du monde', icon: 'plane', count: () => foundIn('monde'), goal: 10, txt: n => `Trouve ${n} souvenirs uniques sur les autres continents`, go: () => goToPlace(nextPlaceIn('monde')), reward: { coins: 800, item: ['Couronne du tour du monde', 'v', 'tete', 4, 'couronne', '#f2c14e'] } },
  { key: 'secrets', name: 'Les lieux secrets', icon: 'star', count: () => SECRETS.filter(s => S.found[s.name]).length, goal: 6, txt: n => `Visite les ${n} lieux secrets (cartes au trésor)`, go: () => { const s = SECRETS.find(x => S.secrets.includes(x.key) && !S.found[x.name]); if (s && !S.trips[S.sel]) { chooseSecret(s.key); zoomTo(s.lon, s.lat, 20); } else { toast('Les cartes au trésor se trouvent en voyage. Les choix audacieux aident beaucoup !'); openSheet('voyage'); } }, reward: { coins: 1500, item: ['Trophée : Légende du Carnet', 'd', 'statue', 4, null, '#f2c14e'] } },
];
// Ancienne sauvegarde : { ch: index dans l'ancienne liste de 5 chapitres } -> { done: [clés] }
const OLD_CHAPTERS = ['debut', 'france', 'europe', 'monde', 'secrets'];
function goalData() {
  if (!S.goal || typeof S.goal !== 'object') S.goal = { done: [] };
  if (!Array.isArray(S.goal.done)) {
    const oldKey = OLD_CHAPTERS[S.goal.ch || 0], pos = oldKey ? CHAPTERS.findIndex(c => c.key === oldKey) : CHAPTERS.length;
    S.goal.done = CHAPTERS.slice(0, pos).map(c => c.key);
  }
  const idx = CHAPTERS.findIndex(c => !S.goal.done.includes(c.key));
  S.goal.ch = idx < 0 ? CHAPTERS.length : idx;
  return S.goal;
}
function goalState() {
  const G = goalData();
  if (G.ch >= CHAPTERS.length) return { finished: true };
  const ch = CHAPTERS[G.ch];
  if (ch.steps) {
    const doneN = ch.steps.filter(s => s.done()).length, step = ch.steps.find(s => !s.done());
    return { ch, idx: G.ch, doneN, total: ch.steps.length, step, complete: !step };
  }
  const n = Math.min(ch.goal, ch.count());
  return { ch, idx: G.ch, doneN: n, total: ch.goal, step: { txt: ch.txt(ch.goal), go: ch.go }, complete: n >= ch.goal };
}
const GOAL_ICON = {
  compass: '<circle cx="15" cy="15" r="11" fill="#fff3e2" stroke="currentColor" stroke-width="2.2"/><path d="M15 6 L18 15 L15 24 L12 15Z" fill="#d9604f" stroke="currentColor" stroke-width="1.4"/>',
  flag: '<path d="M8 26 V4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 5 H14 V15 H8Z" fill="#3b5aa8"/><path d="M14 5 H18 V15 H14Z" fill="#fff"/><path d="M18 5 H24 V15 H18Z" fill="#d9604f"/><path d="M8 5 H24 V15 H8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  globe: '<circle cx="15" cy="15" r="11" fill="#9fd1d8" stroke="currentColor" stroke-width="2.2"/><path d="M8 11c3 0 4 3 3 5s3 4 4 7M17 5c-1 3 1 4 4 4s3 4 1 6" fill="none" stroke="#5fa274" stroke-width="2.4"/>',
  plane: '<path d="M4 17 L26 6 L20 25 L15 18Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 18 L26 6" stroke="currentColor" stroke-width="1.6"/>',
  house: '<path d="M4 15 L15 5 L26 15 V26 H4Z" fill="#fff3e2" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><rect x="12" y="17" width="6" height="9" fill="#d9604f" stroke="currentColor" stroke-width="1.6"/>',
  hammer: '<path d="M14 13 L24 25" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M14 13 L24 25" stroke="#c99a6a" stroke-width="2" stroke-linecap="round"/><path d="M5 10 L12 3 L19 9 L15 13 L11 10 L9 12Z" fill="#b5bcc2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  book: '<path d="M5 6 H14 Q15 6 15 8 V26 Q15 24 13 24 H5Z M25 6 H16 Q15 6 15 8 V26 Q15 24 17 24 H25Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 11 H12 M8 15 H12 M18 11 H22 M18 15 H22" stroke="#d9604f" stroke-width="1.8" stroke-linecap="round"/>',
  heart: '<path d="M15 26 C4 18 3 12 6 8 C9 4 14 6 15 10 C16 6 21 4 24 8 C27 12 26 18 15 26Z" fill="#f08aa6" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  star: '<path d="M15 3 L18.5 11 L27 11.8 L20.5 17.4 L22.6 26 L15 21.4 L7.4 26 L9.5 17.4 L3 11.8 L11.5 11Z" fill="#f6c445" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};
function renderGoal() {
  const box = $('goal'); if (!box) return;
  // Le but principal est désormais le rêve du compagnon sélectionné (14_reves.js). Les chapitres vivent dans l'onglet Rêves.
  if (typeof renderDreamCard === 'function') { try { renderDreamCard(box); return; } catch (e) { console.error(e); } }
  const g = goalState();
  if (g.finished) { box.className = 'goal'; box.innerHTML = `<svg viewBox="0 0 30 30" class="gi">${GOAL_ICON.star}</svg><div class="gx"><span class="gk">Le Grand Carnet est complet</span><b>Vous êtes une légende du voyage !</b></div>`; return; }
  const pct = Math.round(g.doneN / g.total * 100);
  box.className = 'goal' + (g.complete ? ' ready' : '');
  box.title = `Récompense du chapitre : ${g.ch.reward.coins} pièces et « ${g.ch.reward.item[0]} »`;
  box.innerHTML = `<svg viewBox="0 0 30 30" class="gi" aria-hidden="true">${GOAL_ICON[g.ch.icon]}</svg><div class="gx"><span class="gk">Chapitre ${g.idx + 1}/${CHAPTERS.length} · ${esc(g.ch.name)}</span><b>${g.complete ? 'Chapitre terminé !' : esc(g.step.txt)}</b><span class="gbar"><i style="width:${pct}%"></i></span></div><span class="gn">${g.doneN}/${g.total}</span>${g.complete ? '<button class="btn gold sm" id="goalClaim">Récompense</button>' : '<button class="btn green sm" id="goalGo">Aller</button>'}`;
}
// Grand Carnet, affiché dans l'onglet Rêves : tous les chapitres, le chapitre en cours détaillé
function carnetHTML() {
  const g = goalState(), G = goalData();
  let h = `<p class="small" style="margin:0 0 8px">Les grands défis du voyageur, à remplir à votre rythme. Chaque chapitre rapporte des pièces et un vêtement rare.</p><ol class="carnet">`;
  CHAPTERS.forEach((ch, i) => {
    const done = G.done.includes(ch.key), cur = !g.finished && g.idx === i;
    h += `<li class="${done ? 'done' : cur ? 'cur' : 'todo'}"><svg viewBox="0 0 30 30" class="gi" aria-hidden="true">${GOAL_ICON[ch.icon]}</svg><div class="cx"><b>${i + 1}. ${esc(ch.name)}</b>`;
    if (cur) {
      if (ch.steps) h += `<ul>${ch.steps.map(s => `<li class="${s.done() ? 'ok' : ''}">${s.done() ? '✓' : '○'} ${esc(s.txt)}</li>`).join('')}</ul>`;
      else h += `<span>${esc(ch.txt(ch.goal))} · ${g.doneN}/${g.total}</span>`;
      h += `<span class="gbar"><i style="width:${Math.round(g.doneN / g.total * 100)}%"></i></span><span class="crw">Récompense : ${ch.reward.coins} pièces et « ${esc(ch.reward.item[0])} »</span>`;
    } else h += `<span>${done ? 'Terminé' : `${ch.reward.coins} pièces · « ${esc(ch.reward.item[0])} »`}</span>`;
    h += `</div>${cur ? (g.complete ? '<button class="btn gold sm" data-carnet="claim">Récompense</button>' : '<button class="btn green sm" data-carnet="go">Aller</button>') : done ? '<span class="tagok">Fait</span>' : ''}</li>`;
  });
  h += `</ol>${g.finished ? '<p class="small"><b>Le Grand Carnet est complet : vous êtes une légende du voyage !</b></p>' : ''}`;
  return h;
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.carnet{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.carnet>li{display:flex;align-items:center;gap:9px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:7px 9px}.carnet>li.cur{border-color:var(--ink);background:#fffaf0;box-shadow:0 3px 0 rgba(74,53,40,.25)}.carnet>li.done{background:#eef8f0;opacity:.85}.carnet>li.todo{opacity:.7}.carnet .gi{width:30px;height:30px;flex:none;color:var(--ink)}.carnet .cx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.carnet .cx b{font:700 14.5px var(--display)}.carnet .cx>span{font-size:12.5px;color:var(--ink2)}.carnet ul{list-style:none;margin:0;padding:0;font-size:13px}.carnet ul li.ok{color:var(--greenD)}.carnet .crw{font-size:12px!important}`;
  document.head.appendChild(st);
})();
function claimChapter() {
  const g = goalState(); if (!g.complete || g.finished) return;
  const r = g.ch.reward;
  gainCoins(r.coins);
  const it = makeItem(r.item, 0, `Récompense : ${g.ch.name}`, [], { fixed: r.item[3], special: true });
  S.inv.push(it); S.dex[it.name] = true;
  goalData().done.push(g.ch.key); goalData(); save();
  renderAll();
  const next = CHAPTERS[S.goal.ch];
  showModal(`<div class="mart">${drawChar(S.sel, S.outfits[S.sel], 'amour', 'mod')}</div><h2>Chapitre terminé : ${esc(g.ch.name)} !</h2><p>Récompense : <b>${r.coins} pièces</b> et <b class="rar r${r.item[3]}">« ${esc(r.item[0])} »</b> (${RARITY[r.item[3]]}).</p><div class="haul one">${typeof haulCard === 'function' ? haulCard(it, 0, false) : ''}</div>${next ? `<p>Prochain chapitre : <b>${esc(next.name)}</b>${next.steps ? ' · ' + esc(next.steps[0].txt) : ''}.</p>` : '<p>Vous avez complété tout le Grand Carnet !</p>'}<button class="btn green big" data-closemodal="1">Super !</button>`);
}
function showModal(html) { const m = $('modal'); m.querySelector('.mbox').innerHTML = html; m.hidden = false; }
function maybeIntro() {
  if (S.seenIntro) return;
  showModal(`<div class="mart">${drawChar('pistache', S.outfits.pistache, 'rire', 'intro')}</div><h2>Bienvenue dans le Carnet de voyage !</h2><p>Pistache, Mochi et Bulle ont plein de rêves. <b>Votre mission : les réaliser !</b></p><ul class="mlist"><li><b>Regardez leur rêve</b>, en haut de l’écran, avec ses étapes.</li><li><b>Touchez « Partir »</b> : le jeu choisit le bon endroit, près de chez vous ou au bout du monde.</li><li><b>Rapportez des trésors</b> et fabriquez ce qu’il faut. Chaque rêve réalisé fait grandir le village.</li></ul><p>Le premier rêve de Pistache ne prend que deux petites balades !</p><button class="btn green big" data-closemodal="intro">C’est parti !</button>`);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.id === 'goalGo') { const g = goalState(); if (g.step && g.step.go) g.step.go(); }
  if (b.id === 'goalClaim' || b.dataset.carnet === 'claim') claimChapter();
  if (b.dataset.carnet === 'go') { const g = goalState(); if (g.step && g.step.go) { if (typeof closeSheet === 'function') closeSheet(); g.step.go(); } }
  if (b.dataset.closemodal) { $('modal').hidden = true; if (b.dataset.closemodal === 'intro') { S.seenIntro = true; save(); } }
});

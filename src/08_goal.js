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
const CHAPTERS = [
  { key: 'debut', name: 'Premiers pas', icon: 'compass', steps: [
    { txt: 'Envoie un compagnon en voyage', done: () => (S.stats.started || 0) >= 1, go: () => openSheet('voyage') },
    { txt: 'Zoome sur ton quartier et récolte dans un lieu (boulangerie, parc, rue…)', done: () => (S.stats.poiTrips || 0) >= 1 || (S.stats.poiStarted || 0) >= 1, go: () => { const h = homeObj(); zoomTo(h.lon, h.lat, Math.pow(2, (mapMode === 'tiles' ? 15.5 : 13.2) - 1.5)); toast('Touchez une boulangerie, un parc ou une rue pour voir ce qu\u2019on peut y trouver.'); } },
    { txt: 'Réponds à un choix pendant son voyage', done: () => (S.stats.choices || 0) >= 1, go: () => { if (S.trips[S.sel]) openSheet('voyage'); else openSheet('voyage'); } },
    { txt: 'Ouvre son sac à son retour', done: () => (S.stats.trips || 0) >= 1, go: () => { const t = S.trips[S.sel]; if (t && t.done) collect(); else openSheet('voyage'); } },
    { txt: 'Habille un compagnon avec une trouvaille', done: () => (S.stats.worn || 0) >= 1, go: () => { bagFilter = 'v'; openSheet('sac'); } },
    { txt: 'Fabrique un objet à l’atelier', done: () => (S.stats.crafted || 0) >= 1, go: () => openSheet('atelier') },
    { txt: 'Décore la maison', done: () => Object.values(S.house).some(Boolean), go: () => openSheet('maison') },
  ], reward: { coins: 200, item: ['Écharpe du voyageur', 'v', 'cou', 3, 'echarpe', '#e9784a'] } },
  { key: 'france', name: 'Le tour de France', icon: 'flag', count: () => foundIn('fr'), goal: 5, txt: n => `Trouve ${n} souvenirs uniques en France`, go: () => goToPlace(nextPlaceIn('fr')), reward: { coins: 300, item: ['Béret tricolore', 'v', 'tete', 4, 'beret', '#3b5aa8'] } },
  { key: 'europe', name: 'Grand tour d’Europe', icon: 'globe', count: () => foundIn('eu'), goal: 8, txt: n => `Trouve ${n} souvenirs uniques en Europe`, go: () => goToPlace(nextPlaceIn('eu')), reward: { coins: 500, item: ['Cape de l’explorateur', 'v', 'dos', 4, 'cape', '#3f6e5a'] } },
  { key: 'monde', name: 'Le tour du monde', icon: 'plane', count: () => foundIn('monde'), goal: 10, txt: n => `Trouve ${n} souvenirs uniques sur les autres continents`, go: () => goToPlace(nextPlaceIn('monde')), reward: { coins: 800, item: ['Couronne du tour du monde', 'v', 'tete', 4, 'couronne', '#f2c14e'] } },
  { key: 'secrets', name: 'Les lieux secrets', icon: 'star', count: () => SECRETS.filter(s => S.found[s.name]).length, goal: 6, txt: n => `Visite les ${n} lieux secrets (cartes au trésor)`, go: () => { const s = SECRETS.find(x => S.secrets.includes(x.key) && !S.found[x.name]); if (s && !S.trips[S.sel]) { chooseSecret(s.key); zoomTo(s.lon, s.lat, 20); } else { toast('Les cartes au trésor se trouvent en voyage. Les choix audacieux aident beaucoup !'); openSheet('voyage'); } }, reward: { coins: 1500, item: ['Trophée : Légende du Carnet', 'd', 'statue', 4, null, '#f2c14e'] } },
];
function goalState() {
  S.goal = S.goal || { ch: 0 };
  const ch = CHAPTERS[Math.min(S.goal.ch, CHAPTERS.length - 1)];
  if (S.goal.ch >= CHAPTERS.length) return { finished: true };
  if (ch.steps) {
    const doneN = ch.steps.filter(s => s.done()).length, step = ch.steps.find(s => !s.done());
    return { ch, idx: S.goal.ch, doneN, total: ch.steps.length, step, complete: !step };
  }
  const n = Math.min(ch.goal, ch.count());
  return { ch, idx: S.goal.ch, doneN: n, total: ch.goal, step: { txt: ch.txt(ch.goal), go: ch.go }, complete: n >= ch.goal };
}
const GOAL_ICON = {
  compass: '<circle cx="15" cy="15" r="11" fill="#fff3e2" stroke="currentColor" stroke-width="2.2"/><path d="M15 6 L18 15 L15 24 L12 15Z" fill="#d9604f" stroke="currentColor" stroke-width="1.4"/>',
  flag: '<path d="M8 26 V4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 5 H14 V15 H8Z" fill="#3b5aa8"/><path d="M14 5 H18 V15 H14Z" fill="#fff"/><path d="M18 5 H24 V15 H18Z" fill="#d9604f"/><path d="M8 5 H24 V15 H8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  globe: '<circle cx="15" cy="15" r="11" fill="#9fd1d8" stroke="currentColor" stroke-width="2.2"/><path d="M8 11c3 0 4 3 3 5s3 4 4 7M17 5c-1 3 1 4 4 4s3 4 1 6" fill="none" stroke="#5fa274" stroke-width="2.4"/>',
  plane: '<path d="M4 17 L26 6 L20 25 L15 18Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 18 L26 6" stroke="currentColor" stroke-width="1.6"/>',
  star: '<path d="M15 3 L18.5 11 L27 11.8 L20.5 17.4 L22.6 26 L15 21.4 L7.4 26 L9.5 17.4 L3 11.8 L11.5 11Z" fill="#f6c445" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};
function renderGoal() {
  const box = $('goal'); if (!box) return;
  const g = goalState();
  if (g.finished) { box.innerHTML = `<svg viewBox="0 0 30 30" class="gi">${GOAL_ICON.star}</svg><div class="gx"><span class="gk">Le Grand Carnet est complet</span><b>Vous êtes une légende du voyage !</b></div>`; return; }
  const pct = Math.round(g.doneN / g.total * 100);
  box.className = 'goal' + (g.complete ? ' ready' : '');
  box.innerHTML = `<svg viewBox="0 0 30 30" class="gi" aria-hidden="true">${GOAL_ICON[g.ch.icon]}</svg><div class="gx"><span class="gk">Chapitre ${g.idx + 1}/${CHAPTERS.length} · ${esc(g.ch.name)}</span><b>${g.complete ? 'Chapitre terminé !' : esc(g.step.txt)}</b><span class="gbar"><i style="width:${pct}%"></i></span></div><span class="gn">${g.doneN}/${g.total}</span>${g.complete ? '<button class="btn gold sm" id="goalClaim">Récompense</button>' : '<button class="btn green sm" id="goalGo">Aller</button>'}`;
}
function claimChapter() {
  const g = goalState(); if (!g.complete || g.finished) return;
  const r = g.ch.reward;
  gainCoins(r.coins);
  const it = makeItem(r.item, 0, `Récompense : ${g.ch.name}`, [], { fixed: r.item[3], special: true });
  S.inv.push(it); S.dex[it.name] = true;
  S.goal.ch++; save();
  renderAll();
  const next = CHAPTERS[S.goal.ch];
  showModal(`<div class="mart">${drawChar(S.sel, S.outfits[S.sel], 'amour', 'mod')}</div><h2>Chapitre terminé : ${esc(g.ch.name)} !</h2><p>Récompense : <b>${r.coins} pièces</b> et <b>« ${esc(r.item[0])} »</b> (${RARITY[r.item[3]]}).</p>${next ? `<p>Prochain chapitre : <b>${esc(next.name)}</b>.</p>` : '<p>Vous avez complété tout le Grand Carnet !</p>'}<button class="btn green big" data-closemodal="1">Super !</button>`);
}
function showModal(html) { const m = $('modal'); m.querySelector('.mbox').innerHTML = html; m.hidden = false; }
function maybeIntro() {
  if (S.seenIntro) return;
  showModal(`<div class="mart">${drawChar('pistache', S.outfits.pistache, 'rire', 'intro')}</div><h2>Bienvenue dans le Carnet de voyage !</h2><p>Pistache, Mochi et Bulle rêvent de remplir <b>le Grand Carnet</b> : un souvenir unique de chaque lieu du monde.</p><ul class="mlist"><li><b>Envoyez-les en voyage</b> vers de vrais endroits sur la carte.</li><li><b>Aidez-les en route</b> : choix, rencontres, marchands.</li><li><b>Rapportez des trésors</b> pour les habiller, décorer la maison et fabriquer des objets rares.</li></ul><p>Le bandeau en haut vous dit toujours quoi faire ensuite.</p><button class="btn green big" data-closemodal="intro">C’est parti !</button>`);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.id === 'goalGo') { const g = goalState(); if (g.step && g.step.go) g.step.go(); }
  if (b.id === 'goalClaim') claimChapter();
  if (b.dataset.closemodal) { $('modal').hidden = true; if (b.dataset.closemodal === 'intro') { S.seenIntro = true; save(); } }
});

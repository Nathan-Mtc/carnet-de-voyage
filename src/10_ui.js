// ================= INTERFACE =================
// Navigation à 5 onglets (étape Boutique + Compagnons) : Carte · Boutique · Compagnons · Village · Sac.
// Les anciens noms d'onglets restent valables : openSheet('marche'), openSheet('reves'), openSheet('quetes')… sont redirigés
// vers le bon onglet et le bon sous-onglet (voir TAB_ALIAS).
const NAV = [['carte', 'Carte'], ['boutique', 'Boutique'], ['compagnons', 'Compagnons'], ['village', 'Village'], ['sac', 'Sac']];
const SHEET_TITLES = { sac: 'Sac & Album', boutique: 'La boutique', compagnons: 'Les compagnons', reves: 'Les rêves', village: 'Le village', atelier: 'L\u2019atelier', marche: 'Le marché', maison: 'La maison', quetes: 'Quêtes', album: 'L\u2019album' };
const SUBTABS = {
  compagnons: [['garde', 'Garde-robe', 'garde'], ['reves', 'Rêves', 'reves'], ['talents', 'Talents', 'talents'], ['concours', 'Concours', 'concours']],
  village: [['bat', 'Bâtiments', 'village'], ['maison', 'Maison', 'maison'], ['atelier', 'Atelier', 'atelier']],
  sac: [['sac', 'Sac', 'sac1'], ['col', 'Collections', 'col'], ['album', 'Cartes postales', 'album']],
};
// ancien nom d'onglet -> [onglet, sous-onglet]
const TAB_ALIAS = {
  atelier: ['village', 'atelier'], maison: ['village', 'maison'], batiments: ['village', 'bat'], village: ['village', 'bat'],
  marche: ['boutique', 'marche'], magasin: ['boutique', 'magasin'], comptoir: ['boutique', 'comptoir'], shop: ['boutique'],
  reves: ['compagnons', 'reves'], quetes: ['compagnons', 'reves'], succes: ['compagnons', 'reves'], carnet: ['compagnons', 'reves'],
  garderobe: ['compagnons', 'garde'], tenues: ['compagnons', 'garde'], talents: ['compagnons', 'talents'], concours: ['compagnons', 'concours'],
  album: ['sac', 'album'], cartes: ['sac', 'album'], collections: ['sac', 'col'], sac: ['sac', 'sac'],
};
let sacView = 'sac', villView = 'bat', compView = 'garde';
// sous-onglet courant d'un onglet, et son changement (la boutique gère elle-même ses sous-onglets via openBoutique)
function getSub(t) { return t === 'village' ? villView : t === 'sac' ? sacView : t === 'compagnons' ? compView : t === 'boutique' ? bqSubSafe() : ''; }
function bqSubSafe() { try { return bView; } catch (e) { return ''; } } // bView vit dans 18_boutique.js
function setSub(t, sub) {
  if (!sub) return;
  if (t === 'village') { if (sub === 'marche') return; villView = sub; }
  else if (t === 'sac') sacView = sub;
  else if (t === 'compagnons') compView = sub;
  else if (t === 'boutique') setSub._bq = sub;
}
const NAV_ICONS = {
  boutique: '<path d="M4.5 13.5 V25.5 H25.5 V13.5" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 13 L5.5 5 H24.5 L27 13Z" fill="#f3aec1" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 5 L9 13 M15 5 V13 M20 5 L21 13" stroke="#fff" stroke-width="2.4"/><path d="M3 13 q2.25 3 4.5 0 q2.25 3 4.5 0 q2.25 3 4.5 0 q2.25 3 4.5 0 q2.25 3 4.5 0 q.75 1 1.5 0" fill="#f3aec1" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><rect x="7.5" y="18" width="6" height="7.5" rx="1" fill="#c98a5a" stroke="currentColor" stroke-width="1.5"/><circle cx="20.5" cy="20.5" r="3.3" fill="#f6c445" stroke="currentColor" stroke-width="1.5"/>',
  compagnons: '<path d="M6.5 11 C3.5 6 7 3 10.5 7.5 M23.5 11 C26.5 6 23 3 19.5 7.5" fill="#cf7752" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="15" cy="16.5" rx="11" ry="9.5" fill="#ec9c6f" stroke="currentColor" stroke-width="2"/><ellipse cx="10.4" cy="19.4" rx="4.6" ry="3.6" fill="#fff5ea"/><ellipse cx="19.6" cy="19.4" rx="4.6" ry="3.6" fill="#fff5ea"/><circle cx="11" cy="15.4" r="1.7" fill="currentColor"/><circle cx="19" cy="15.4" r="1.7" fill="currentColor"/><path d="M13.6 19.2 h2.8 l-1.4 1.5Z" fill="currentColor"/><ellipse cx="7.6" cy="19" rx="1.8" ry="1.1" fill="#f49a98"/><ellipse cx="22.4" cy="19" rx="1.8" ry="1.1" fill="#f49a98"/><path d="M15 6.6 L10.8 3.8 V9.4Z M15 6.6 L19.2 3.8 V9.4Z" fill="#f08aa6" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="15" cy="6.6" r="1.6" fill="#f08aa6" stroke="currentColor" stroke-width="1.3"/>',
  garde: '<path d="M15 4.5 a2.6 2.6 0 1 1 2.6 2.6 c-1.3 0 -2.6.8 -2.6 2.2 V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15 10 L3.5 17 H26.5Z" fill="none" stroke="#a87a50" stroke-width="2" stroke-linejoin="round"/><path d="M9 15 L5.5 18.5 L8.5 21.5 L10 20.5 V27 H20 V20.5 L21.5 21.5 L24.5 18.5 L21 15 Q15 17.5 9 15Z" fill="#bfe3d6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 23.8 l-2-1.9 a1.2 1.2 0 0 1 2-1.3 a1.2 1.2 0 0 1 2 1.3Z" fill="#f08aa6"/>',
  talents: '<path d="M10 17 L7 27 L11 25 L13.5 28 L15 19 M20 17 L23 27 L19 25 L16.5 28 L15 19" fill="#9fd1d8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="15" cy="12.5" r="9" fill="#d9ccf5" stroke="currentColor" stroke-width="2"/><path d="M15 7.2 l1.6 3.3 3.6.5 -2.6 2.5.6 3.6 -3.2-1.7 -3.2 1.7.6-3.6 -2.6-2.5 3.6-.5Z" fill="#f6c445" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
  concours: '<path d="M9 4.5 H21 V11 a6 6 0 0 1 -12 0Z" fill="#f6c445" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 6.5 H5.5 a3.5 3.5 0 0 0 4 5.5 M21 6.5 H24.5 a3.5 3.5 0 0 1 -4 5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 17 V21.5" stroke="currentColor" stroke-width="2.4"/><rect x="9.5" y="21.5" width="11" height="5" rx="1.5" fill="#c98a5a" stroke="currentColor" stroke-width="1.8"/><path d="M15 6.6 l1 2 2.2.3 -1.6 1.5.4 2.2 -2-1 -2 1 .4-2.2 -1.6-1.5 2.2-.3Z" fill="#fff8ea"/>',
  reves: '<path d="M8.5 23.5 H22 a4.6 4.6 0 0 0 .9-9.1 a6.6 6.6 0 0 0-12.6-2.2 A5.6 5.6 0 0 0 8.5 23.5Z" fill="#d9ccf5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16 12.6 l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4Z" fill="#f6c445" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M25 4.5 v4 M23 6.5 h4" stroke="#f08aa6" stroke-width="1.8" stroke-linecap="round"/>',
  village: '<path d="M2.5 25.5 H27.5" stroke="#5fa274" stroke-width="2.6" stroke-linecap="round"/><path d="M4.5 25 V15.5 L11.5 9.5 L18.5 15.5 V25Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M2.8 16.6 L11.5 8.6 L20.2 16.6" fill="none" stroke="#d9604f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="9.5" y="19" width="4" height="6" rx="1" fill="#c98a5a" stroke="currentColor" stroke-width="1.4"/><path d="M23.5 19.5 V25" stroke="#a87a50" stroke-width="2.6" stroke-linecap="round"/><circle cx="23.5" cy="14.5" r="5" fill="#8fcf7f" stroke="currentColor" stroke-width="2"/>',
  sac1: '<path d="M7 11 H23 L25 25 H5Z" fill="#e9b07a" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 11 C10 4 20 4 20 11" fill="none" stroke="currentColor" stroke-width="2"/><rect x="11" y="15" width="8" height="5" rx="1.5" fill="#f2c14e" stroke="currentColor" stroke-width="1.6"/>',
  col: '<circle cx="15" cy="13" r="8.5" fill="#f6c445" stroke="currentColor" stroke-width="2"/><path d="M15 8.4 l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5Z" fill="#fff8ea" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M10 20 L8 27 L11.5 25.5 L13.5 28 L15 21.5 M20 20 L22 27 L18.5 25.5 L16.5 28 L15 21.5" fill="#f08aa6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  carte: '<path d="M4 7 L11 4 L18 7 L25 4 V22 L18 25 L11 22 L4 25Z" fill="#9fd1d8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M11 4 V22 M18 7 V25" stroke="currentColor" stroke-width="2"/><path d="M6 15 q3 -3 4 0" stroke="#5fa274" stroke-width="2.4" fill="none"/>',
  sac: '<rect x="15.5" y="2.5" width="11" height="9" rx="1.2" transform="rotate(14 21 7)" fill="#bfe1f2" stroke="currentColor" stroke-width="1.6"/><path d="M7 11 H23 L25 25 H5Z" fill="#e9b07a" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 11 C10 4 20 4 20 11" fill="none" stroke="currentColor" stroke-width="2"/><rect x="11" y="15" width="8" height="5" rx="1.5" fill="#f2c14e" stroke="currentColor" stroke-width="1.6"/>',
  atelier: '<path d="M6 24 L17 13" stroke="#a87a50" stroke-width="4" stroke-linecap="round"/><path d="M14 7 L22 4 L26 8 L23 16 L19 12 L16 13Z" fill="#b9c4cc" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  marche: '<path d="M4 12 L7 5 H23 L26 12Z" fill="#f3aec1" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 5 L7 12 M13 5 L12.5 12 M17 5 L17.5 12 M22 5 L23 12" stroke="currentColor" stroke-width="1.4"/><rect x="6" y="12" width="18" height="12" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="2.5" fill="#f2c14e" stroke="currentColor" stroke-width="1.4"/>',
  maison: '<path d="M5 25 V13 L15 5 L25 13 V25Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 14 L15 4 L27 14" fill="none" stroke="#d9604f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="12" y="16" width="6" height="9" fill="#c98a5a" stroke="currentColor" stroke-width="1.6"/>',
  quetes: '<path d="M8 5 H22 V25 H8Z" fill="#fff3e2" stroke="currentColor" stroke-width="2"/><path d="M6 5 H24 M6 25 H24" stroke="#a87a50" stroke-width="3.4" stroke-linecap="round"/><path d="M11 11 h8 M11 15 h8 M11 19 h5" stroke="currentColor" stroke-width="1.6"/>',
  album: '<rect x="4" y="7" width="22" height="17" rx="2" fill="#bfe1f2" stroke="currentColor" stroke-width="2"/><path d="M4 21 L11 14 L16 19 L19 16 L26 22" fill="#8fbf7f" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="20" cy="12" r="2.4" fill="#fbd76a"/>',
};
function selectComp(k) { S.sel = k; S.unseen[k] = 0; if (S.trips[k]) plan.dest = null; fast = false; save(); renderAll(); const t = S.trips[k]; if (t) { const p = tripPos(t); zoomTo(p[0], p[1]); } }
function resolveTab(name) {
  if (name === 'quetes' && questView === 'col') return ['sac', 'col']; // les collections vivent maintenant dans Sac & Album
  return TAB_ALIAS[name] || [name];
}
// openSheet(nom) : ouvre un onglet ; les anciens noms sont redirigés vers le bon onglet et le bon sous-onglet
function openSheet(name, keepSub) {
  if (name === 'village' && keepSub && villView === 'marche') villView = 'bat';
  const [t, sub] = resolveTab(name);
  // la boutique (18_boutique.js) choisit elle-même son sous-onglet : Comptoir, Magasin ou Marché
  if (t === 'boutique' && sub && !keepSub && typeof openBoutique === 'function' && !openSheet._bq) {
    const was = tab; openSheet._bq = true;
    try { openBoutique(sub); } catch (e) { console.error(e); } finally { openSheet._bq = false; }
    if (tab !== 'boutique') { tab = 'boutique'; houseSel = null; renderPanel(); }
    if (was !== 'boutique') $('panelBody').scrollTop = 0;
    return;
  }
  if (!keepSub && sub) setSub(t, sub);
  const changed = t !== tab || (sub && !keepSub);
  tab = t; houseSel = null; if (t === 'voyage') S.unseen[S.sel] = 0; renderPanel();
  if (changed) $('panelBody').scrollTop = 0;
}
function closeSheet() { const rc = $('react'); if (rc) rc.hidden = true; tab = 'carte'; if (!S.trips[S.sel]) plan.dest = null; renderPanel(); drawMarks(); }
function renderTop() { $('coins').innerHTML = coins(S.coins); }
function renderComps() {
  $('hudComps').innerHTML = Object.entries(CHARS).map(([k, ch]) => {
    const t = S.trips[k], p = S.prog[k], f = Math.min(1, p.xp / needXP(p.lvl));
    const st = !t ? 'home' : t.done ? 'done' : 'away';
    const C = 2 * Math.PI * 27;
    return `<button class="hc-btn ${S.sel === k ? 'on' : ''}" data-sel="${k}" aria-pressed="${S.sel === k}" aria-label="${ch.name}, niveau ${p.lvl}"><svg class="ring" viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#fffaf0" stroke="#e7dcc4" stroke-width="5"/><circle cx="30" cy="30" r="27" fill="none" stroke="#f2c14e" stroke-width="5" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 30 30)" stroke-linecap="round"/></svg><img src="${portraitURI(k, t && t.done ? 'rire' : 'content')}" alt=""><span class="lv">${p.lvl}</span><span class="nm">${ch.name}</span>${st !== 'home' ? `<span class="st ${st}">${st === 'done' ? '!' : '<svg viewBox="0 0 12 12"><path d="M3 11 L5 6 L8 8 L9 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</span>` : ''}</button>`;
  }).join('');
  renderTripCard();
}
function renderTripCard() {
  const k = S.sel, ch = CHARS[k], t = S.trips[k], box = $('tripCard');
  if (tab !== 'carte') { box.hidden = true; return; }
  box.hidden = false;
  if (!t) {
    box.className = 'tripcard idle';
    // le but principal est le rêve (carte du haut, bouton « Partir ») : ici, une aide discrète, sans bouton concurrent
    const dr = typeof curDream === 'function' ? curDream(k) : null;
    // petit tutoriel en 3 étapes (Partir · Livrer · Habiller), affiché ici tant qu'il n'est pas fini
    const ts = tutoStep();
    if (ts) {
      const rdy = typeof shopReady === 'function' ? shopReady() : 0;
      const T = [null,
        ['Partir', 'Touchez « Partir » en haut pour son rêve, ou « Partir chercher » une commande de la boutique.', `<button class="btn cream sm" data-bopen="comptoir">Commandes</button>`],
        ['Livrer à la boutique', rdy ? 'Une commande est prête : livrez-la au comptoir !' : 'Les clients attendent leurs objets au comptoir. Rapportez-les de voyage.', `<button class="btn ${rdy ? 'green' : 'gold'} sm" data-bopen="comptoir">Boutique</button>`],
        ['Habiller son compagnon', `Mettez un vêtement à ${ch.name} dans sa garde-robe.`, `<button class="btn gold sm" data-stgo="garde">Habiller</button>`]][ts];
      box.innerHTML = `<img src="${portraitURI(k)}" alt=""><div class="tcx"><b><i class="tuto">${ts}/3</i> ${T[0]}</b><span>${T[1]}</span></div>${T[2]}`;
      return;
    }
    box.innerHTML =`<img src="${portraitURI(k)}" alt=""><div class="tcx"><b>${ch.name} est à la maison</b><span>${dr ? (typeof dreamReady === 'function' && dreamReady(k) ? 'Son rêve est prêt : touchez « Réaliser » en haut !' : 'Touchez « Partir » en haut pour son rêve, ou n’importe quel lieu de la carte.') : 'Touchez un lieu de la carte pour l’envoyer en voyage.'}</span></div><button class="btn ${dr ? 'cream' : 'gold'} sm" data-suggest="1">${dr ? 'Autres idées' : 'Idées du jour'}</button>`;
    return;
  }
  const f = Math.min(1, t.elapsed / t.total), pend = t.journal.filter(j => j.pending && !j.resolved).length;
  if (t.done) { box.className = 'tripcard done'; box.innerHTML = `<img src="${portraitURI(k, 'rire')}" alt=""><div class="tcx"><b>${ch.name} est rentré !</b><span>${t.bag.length} objets${t.coins > 0 ? ` et ${t.coins} pièces` : ''} dans son sac.</span></div><button class="btn green" id="collectBtn">Ouvrir le sac</button>`; return; }
  box.className = 'tripcard away';
  box.innerHTML = `<img src="${portraitURI(k)}" alt=""><div class="tcx"><b>En route vers ${esc(t.dest.name)}</b><div class="bar"><i id="pbar2" style="width:${(f * 100).toFixed(1)}%"></i><span class="mid"></span></div><span id="ptime2">${f < 0.5 ? 'Aller' : 'Retour'} · ${fmtDur((t.total - t.elapsed) / (fast ? 30 : 1))}</span></div><button class="btn ${pend ? 'pink' : 'cream'} sm" data-open="voyage">${pend ? `${pend} choix !` : 'Journal'}</button>`;
}
// étape du tutoriel (1 Partir, 2 Livrer, 3 Habiller) ; 0 quand les trois sont faites
function tutoStep() {
  const st = S.stats || {};
  const went = (st.started || 0) > 0 || (st.trips || 0) > 0 || Object.values(S.trips).some(Boolean);
  const served = !!(S.shop && S.shop.served > 0);
  const dressed = (st.worn || 0) > 0 || Object.values(S.outfits || {}).some(o => o && o.worn && Object.values(o.worn).some(Boolean));
  return !went ? 1 : !served ? 2 : !dressed ? 3 : 0;
}
function renderNav() {
  const q = revesBadge();
  let shop = 0; try { if (typeof shopBadge === 'function') shop = shopBadge() || 0; } catch (e) {}
  const cols = collections().filter(c => !S.colClaimed[c.key] && c.names.every(n => S.dex[n])).length;
  const sold = S.market.mine.filter(m => !m.sold).length;
  const build = typeof villageBuildable === 'function' ? villageBuildable().length : 0;
  const cur = tab === 'voyage' ? 'carte' : (resolveTab(tab)[0]);
  $('nav').innerHTML = NAV.map(([k, l]) => {
    let b = '';
    if (k === 'compagnons' && q) b = `<i class="tb">${q}</i>`;
    if (k === 'boutique') b = shop ? `<i class="tb">${typeof shop === 'number' ? shop : esc(shop)}</i>` : sold ? `<i class="tb soft" title="Annonces en cours au marché">${sold}</i>` : '';
    if (k === 'sac' && cols) b = `<i class="tb">${cols}</i>`;
    if (k === 'village' && build) b = `<i class="tb" title="Bâtiment à construire">${build}</i>`;
    if (k === 'carte' && Object.values(S.trips).some(t => t && (t.done || t.journal.some(j => j.pending && !j.resolved)))) b = `<i class="tb">!</i>`;
    return `<button data-nav="${k}" class="${cur === k ? 'on' : ''}" aria-current="${cur === k ? 'page' : 'false'}"><svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS[k]}</svg><span>${l}</span>${b}</button>`;
  }).join('');
}
const renderTabBadges = () => { renderNav(); };
function renderPanel() {
  renderNav(); renderTripCard(); renderGoal();
  const sheet = $('sheet');
  if (tab === 'carte') { sheet.hidden = true; document.body.classList.remove('sheet-open'); return; }
  { const [t, sub] = resolveTab(tab); if (t !== tab) { setSub(t, sub); tab = t; } } // ancien nom posé directement dans « tab »
  if (tab === 'village' && villView === 'marche') villView = 'bat'; // le marché a déménagé dans la boutique
  sheet.hidden = false; document.body.classList.add('sheet-open');
  const t = S.trips[S.sel];
  $('sheetTitle').textContent = tab === 'voyage' ? (t ? 'Journal de voyage' : plan.dest ? (plan.dest.poi ? 'Récolter ici' : 'Préparer le voyage') : 'Partir en voyage') : (SHEET_TITLES[tab] || '');
  $('sheetIcon').innerHTML = NAV_ICONS[tab === 'voyage' ? 'carte' : tab] || '';
  sheet.dataset.kind = tab;
  sheet.dataset.sub = getSub(tab);
  const box = $('panelBody');
  const R = { voyage: renderVoyage, boutique: renderBoutiqueTab, compagnons: renderCompagnonsTab, village: renderVillageTab, sac: renderSacTab }[tab];
  try { if (R) R(box); else box.innerHTML = ''; } catch (e) { console.error(e); box.innerHTML = `<p class="empty">Oups, cet écran n’a pas pu s’afficher.</p>`; }
  const subs = SUBTABS[tab];
  if (subs) {
    const curSub = getSub(tab);
    box.insertAdjacentHTML('afterbegin', `<div class="subtabs" role="tablist">${subs.map(([k, l, ic]) => `<button role="tab" data-sub="${k}" aria-selected="${curSub === k}">${subDot(tab, k) ? '<i class="sdot"></i>' : ''}<svg viewBox="0 0 30 30" aria-hidden="true">${NAV_ICONS[ic]}</svg><span>${l}</span></button>`).join('')}</div>`);
  }
}
// pastille rouge sur un sous-onglet : quelque chose attend le joueur
function subDot(t, k) {
  try {
    if (t === 'village' && k === 'bat') return typeof villageBuildable === 'function' && villageBuildable().length > 0;
    if (t === 'compagnons' && k === 'reves') return revesBadge() > 0;
    if (t === 'compagnons' && typeof styleSubDot === 'function') return styleSubDot(k);
  } catch (e) {}
  return false;
}
// quêtes, succès, chapitre du Grand Carnet et rêves à réaliser
function revesBadge() {
  ensureDaily();
  return S.daily.quests.filter(x => x.prog >= x.goal && !x.claimed).length + (typeof achReady === 'function' ? achReady().length : 0) + (typeof goalState === 'function' && goalState().complete ? 1 : 0) + (typeof dreamReady === 'function' ? Object.keys(CHARS).filter(k => dreamReady(k)).length : 0);
}
function renderBoutiqueTab(box) {
  if (typeof renderBoutique === 'function') return renderBoutique(box);
  // en attendant le module Boutique : le marché reste accessible ici
  renderMarket(box);
  box.insertAdjacentHTML('afterbegin', `<p class="empty">La boutique ouvre très bientôt : commandes des clients et magasin. En attendant, voici le marché.</p>`);
}
function renderCompagnonsTab(box) {
  if (typeof renderCompagnons === 'function') return renderCompagnons(box);
  if (compView === 'reves') return renderRevesTab(box);
  box.innerHTML = `<p class="empty">Les compagnons arrivent bientôt ici.</p>`;
}
function renderRevesTab(box) {
  if (typeof renderReves === 'function') return renderReves(box);
  box.innerHTML = phead(S.sel, 'Les rêves', 'Les rêves de vos compagnons arrivent bientôt ici.') + `<p class="empty">Les rêves de Pistache, Mochi et Bulle seront affichés ici, avec les quêtes du jour et les succès.</p>`;
}
function renderVillageTab(box) {
  if (villView === 'maison') return renderHouse(box);
  if (villView === 'atelier') return renderAtelier(box);
  if (typeof renderVillage === 'function') return renderVillage(box);
  box.innerHTML = `<p class="empty">Le village arrive bientôt.</p>`;
}
function renderSacTab(box) {
  if (sacView === 'album') return renderAlbum(box);
  if (sacView === 'col') return renderCollections(box);
  return renderBag(box);
}
function renderCollections(box) {
  let html = '';
  if (typeof colsHTML === 'function') html += colsHTML();
  else html += phead(null, 'Collections', 'Chaque type de lieu a sa collection d’objets à découvrir.') + `<div class="cols">` + collections().map(c => {
    const got = c.names.filter(n => S.dex[n]).length, done = got === c.names.length, claimed = S.colClaimed[c.key];
    return `<details class="col ${done ? 'done' : ''}"><summary><span class="cname">${esc(c.label)}</span><span class="cbar"><i style="width:${(got / c.names.length * 100).toFixed(0)}%"></i></span><span class="small">${got}/${c.names.length}</span>${done && !claimed ? `<button data-claimc="${c.key}">${coins(colReward(c))}</button>` : claimed ? '<span class="tagok">Complète</span>' : ''}</summary><ul>${c.names.map(n => `<li class="${S.dex[n] ? 'got' : ''}">${S.dex[n] ? esc(n) : '? ? ?'}</li>`).join('')}</ul></details>`;
  }).join('') + `</div>`;
  box.innerHTML = html;
}
// « Sert à… » : petites étiquettes colorées, d'après GAME.usesOf(objet)
const USE_KIND = { reve: ['Rêve', '#ece4fd', '#6d4fc0'], batiment: ['Village', '#ffe6cf', '#b8652a'], recette: ['Atelier', '#dcf3e5', '#2f7f6c'], collection: ['Collection', '#dcedfa', '#3d77a8'], usage: ['', '#fff1c9', '#9a6f12'], vente: ['', '#f1ece4', '#7a5f50'] };
const USE_ORDER = ['reve', 'batiment', 'recette', 'collection'];
function itemUses(it) {
  let u = [];
  try { if (typeof GAME !== 'undefined' && GAME.usesOf) u = GAME.usesOf(it) || []; } catch (e) {}
  const seen = new Set(); u = u.filter(x => x && x.txt && !seen.has(x.txt) && seen.add(x.txt));
  u.sort((a, b) => (USE_ORDER.indexOf(a.kind) + 9) % 9 - (USE_ORDER.indexOf(b.kind) + 9) % 9);
  if (!u.length) {
    if (it.cat === 'v') u.push({ txt: 'À porter par un compagnon', kind: 'usage' });
    else if (it.cat === 'n') u.push({ txt: 'Repas pour un compagnon', kind: 'usage' });
    else if (it.cat === 'd') u.push({ txt: 'Décore la maison', kind: 'usage' });
    else if (it.cat === 't') u.push({ txt: 'Révèle un lieu secret', kind: 'usage' });
    else if (it.rarity >= 2 || it.special || it.edition) u.push({ txt: 'Objet de collection', kind: 'collection' });
    else u.push({ txt: 'À vendre au marché', kind: 'vente' });
  }
  return u;
}
function usesTags(it, max) {
  const u = itemUses(it), shown = max ? u.slice(0, max) : u;
  return `<span class="uses">${shown.map(x => { const k = USE_KIND[x.kind] || USE_KIND.usage; return `<i class="use" style="--ub:${k[1]};--uc:${k[2]}">${esc(x.txt)}</i>`; }).join('')}${u.length > shown.length ? `<i class="use more">+${u.length - shown.length}</i>` : ''}</span>`;
}
// fiche d'un objet (touchez un objet du sac)
function itemActs(it) {
  const k = S.sel, worn = it.cat === 'v' && S.outfits[k].worn && S.outfits[k].worn[it.sub] === it.id;
  let act = '';
  if (it.cat === 'v') act = `<button data-wear="${it.id}">${worn ? 'Retirer' : 'Essayer'}</button>`;
  else if (it.cat === 'n') act = `<button data-feed="${it.id}">Donner</button>`;
  else if (it.cat === 't') act = `<button data-unroll="${it.id}">Déplier</button>`;
  else if (it.cat === 'd') act = `<button data-gohouse="1">Placer</button>`;
  return act;
}
function openFiche(id) {
  const it = S.inv.find(i => i.id === id); if (!it) return;
  const m = $('modal');
  m.querySelector('.mbox').innerHTML = `<div class="fiche" style="--rc:${RARC[it.rarity]}"><div class="fico">${itemIcon(it)}</div><h2>${esc(it.name)}</h2><span class="frar">${RARITY[it.rarity]} · ${it.cat === 'v' ? SLOT_LABEL[it.sub] : CAT_LABEL[it.cat]}</span>${it.from ? `<span class="small">${it.edition ? esc(it.edition) + ' · ' : ''}Trouvé : ${esc(it.from)}</span>` : ''}<div class="fuses"><b>Sert à…</b>${usesTags(it, 7)}</div><div class="facts">${itemActs(it)}<button class="sell" data-sellq="${it.id}">Vendre ${coins(sellPrice(it))}</button></div><button class="btn cream" data-fclose="1">Fermer</button></div>`;
  m.hidden = false;
}
const phead = (k, title, sub, mood) => `<div class="phead">${k ? `<img src="${portraitURI(k, mood)}" alt="">` : ''}<div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>`;

// ---- Voyage
function renderVoyage(box) {
  const k = S.sel, ch = CHARS[k], t = S.trips[k], p = S.prog[k];
  if (!t) {
    const sug = suggestions(), h = homeObj();
    if (!plan.dest) {
      let html = phead(k, `Où part ${ch.name} ?`, 'Une idée du jour, un lieu secret, ou n’importe quel endroit de la carte.');
      html += `<div class="sugs">` + sug.map((pl, i) => {
        const d = kmBetween(h, pl);
        return `<button class="sug" data-goplace="${pl.id}"><span class="sugk">${['Tout près', 'Un peu plus loin', 'Grande aventure'][i]}</span><span class="sname">${esc(pl.name)} <small>${esc(pl.country)} · ${d.toLocaleString('fr-FR')} km</small></span><span class="tags">${pl.tags.map(tg => `<i style="--tc:${TAGC[tg]}">${TAGL[tg]}</i>`).join('')}</span></button>`;
      }).join('') + `</div>`;
      if (S.secrets.length) html += `<h3>Lieux secrets découverts</h3><div class="sugs">` + S.secrets.map(key => { const s = SECRETS.find(x => x.key === key); return `<button class="sug secret" data-gosecret="${key}"><span class="sugk">Lieu secret</span><span class="sname">${esc(s.name)} <small>${esc(s.country)}</small></span><span class="hint">Trésors légendaires garantis à l’arrivée.</span></button>`; }).join('') + `</div>`;
      html += `<div class="talents"><h3>Talents de ${ch.name} · niveau ${p.lvl}</h3>${TALENTS[k].map(([l, n, d]) => `<div class="tal ${p.lvl >= l ? 'on' : ''}"><b>${n}</b><span>${p.lvl >= l ? d : `Débloqué au niveau ${l}`}</span></div>`).join('')}</div>`;
      box.innerHTML = html; return;
    }
    const d = plan.dest, dist = kmBetween(h, d);
    const prev = { comps: [k], tags: d.tags, place: d.name, hour: new Date().getHours(), weather: 'soleil', date: Date.now() };
    const hints = [...new Map(d.tags.flatMap(tg => (LOOT[tg] || [])).map(x => [x[0], x])).values()].slice(0, 6).map(def => ({ name: def[0], cat: def[1], sub: def[2], rarity: def[3], look: def[4], color: def[5] }));
    if (d.poi) { box.innerHTML = poiSheet(d, k); return; }
    let html = `<figure class="pc hero">${postcardSVG(prev, 'prev')}</figure>`;
    html += `<div class="dhead"><div><span class="kick">${d.secret ? 'Lieu secret' : esc(d.country || 'Destination')}</span><h2 class="dname">${esc(d.name)}</h2><span class="tags">${d.tags.map(tg => `<i style="--tc:${TAGC[tg]}">${TAGL[tg]}</i>`).join('')}</span></div><div class="dist"><b>${dist.toLocaleString('fr-FR')}</b><span>km</span></div></div>`;
    html += `<h3>Trésors possibles</h3><div class="loot">${hints.map(it => `<span class="lt" title="${esc(it.name)}" style="--rc:${RARC[it.rarity]}">${itemIcon(it)}</span>`).join('')}${d.special ? `<span class="lt special" title="Souvenir unique">${S.found[d.name] ? itemIcon({ name: d.special[0], cat: d.special[1], sub: d.special[2], rarity: 3, look: d.special[4], color: d.special[5] }) : '<b>?</b>'}</span>` : ''}</div>`;
    if (d.special) html += `<p class="small">Souvenir unique de ce lieu : <b>${S.found[d.name] ? esc(d.special[0]) : 'encore inconnu'}</b>${S.found[d.name] ? '' : '. Le premier à le trouver reçoit l’édition originale.'}</p>`;
    if (d.secret) html += `<p class="small">Deux trésors légendaires attendent ${ch.name} à l’arrivée.</p>`;
    html += `<h3>Durée du voyage</h3><div class="durs">` + DURS.map(x => `<button class="dur" data-dur="${x.key}" aria-pressed="${plan.dur === x.key}"><b>${x.label}</b><span>${x.hint}</span><em>${'★'.repeat(Math.round(x.luck) + 1)}</em></button>`).join('') + `</div>`;
    const dd = DURS.find(x => x.key === plan.dur);
    html += `<div class="gobar"><img src="${portraitURI(k)}" alt=""><div><b>${ch.name}</b><span>${dd.ev} étapes · ${dd.hint}</span></div><button class="btn green big" id="goBtn">Partir !</button></div>`;
    box.innerHTML = html; return;
  }
  const f = Math.min(1, t.elapsed / t.total);
  let html = phead(k, t.done ? `${ch.name} est rentré !` : `En route vers ${esc(t.dest.name)}`, `<span id="phase">${t.done ? `${t.bag.length} objets${t.coins ? ` et ${t.coins} pièces` : ''} dans son sac.` : f < 0.5 ? 'À l’aller' : 'Sur le chemin du retour'}</span>`, t.done ? 'rire' : 'content');
  if (!t.done) html += `<div class="prog"><div class="bar"><i id="pbar" style="width:${(f * 100).toFixed(1)}%"></i><span class="mid"></span></div><div class="pinfo"><span id="ptime">Retour dans ${fmtDur((t.total - t.elapsed) / (fast ? 30 : 1))}</span><button class="btn cream sm" id="fastBtn" aria-pressed="${fast}">${fast ? 'Vitesse normale' : 'Avance rapide (test)'}</button></div></div>`;
  else html += `<button class="btn green big wide" id="collectBtn">Ouvrir son sac et tout ranger</button>`;
  html += `<div class="journal">` + t.journal.slice().reverse().map((j, i) => journalEntry(t, j, t.journal.length - 1 - i)).join('') + `</div>`;
  box.innerHTML = html;
}
function poiSheet(d, k) {
  const ch = CHARS[k], h = homeObj(), km = kmBetween(h, d), c = POI_CATS[d.cat];
  const tbl = lootTable(d.tags), got = tbl.filter(x => S.dex[x.d[0]]).length;
  const specFound = S.found[d.name];
  let html = `<div class="poihead"><div class="poiic" style="--pc:${c[1]}"><svg viewBox="0 0 24 24">${POI_GLYPH[c[2]]}</svg></div><div class="poitx"><span class="kick">${esc(c[0])}${d.city ? ' · ' + esc(d.city) : ''}</span><h2 class="dname">${esc(d.name)}</h2><span class="small">À ${fmtDist(km)} de chez vous · revenez autant de fois que vous voulez</span></div></div>`;
  html += `<div class="lthead"><h3>Ce qu'on peut trouver ici</h3><span class="ltcount">${got}/${tbl.length} découverts</span></div>`;
  html += `<div class="ltable">` + tbl.map(x => { const it = { name: x.d[0], cat: x.d[1], sub: x.d[2], rarity: x.d[3], look: x.d[4], color: x.d[5] }, seen = S.dex[it.name];
    return `<div class="ltr${seen ? '' : ' unk'}" style="--rc:${RARC[it.rarity]}"><span class="ltico">${itemIcon(it)}</span><span class="ltn"><b>${seen || it.rarity < 3 ? esc(it.name) : '? ? ?'}</b><i>${RARITY[it.rarity]}${x.tag ? ' · ' + x.tag : ''} · ${it.cat === 'v' ? SLOT_LABEL[it.sub] : CAT_LABEL[it.cat]}</i></span><span class="ltp">${fmtPct(x.p)}</span>${seen ? '<span class="ltok" title="Déjà trouvé">✓</span>' : '<span class="ltok no"></span>'}</div>`; }).join('') + `</div>`;
  html += `<div class="spec${specFound ? ' got' : ''}"><span class="ltico">${specFound ? itemIcon({ name: d.special[0], cat: d.special[1], sub: d.special[2], rarity: 3, look: d.special[4], color: d.special[5] }) : '<b>?</b>'}</span><span><b>Spécialité unique de ce lieu</b><i>${specFound ? esc(d.special[0]) : 'Garantie à votre première récolte ici, puis rare.'}</i></span></div>`;
  html += `<p class="small">Chances par trouvaille. Chaque récolte rapporte 3 objets à l'arrivée, plus des trouvailles en route. Plus la récolte est longue, plus les objets rares sont fréquents.</p>`;
  html += `<h3>Durée de la récolte</h3><div class="durs">` + DURS.map(x => `<button class="dur" data-dur="${x.key}" aria-pressed="${plan.dur === x.key}"><b>${x.label}</b><span>${x.hint}</span><em>${'★'.repeat(Math.round(x.luck) + 1)}</em></button>`).join('') + `</div>`;
  const dd = DURS.find(x => x.key === plan.dur);
  html += `<div class="gobar"><img src="${portraitURI(k)}" alt=""><div><b>${ch.name}</b><span>${dd.ev} étapes · ${dd.hint}</span></div><button class="btn green big" id="goBtn">Récolter !</button></div>`;
  return html;
}
function journalEntry(t, j, i) {
  const time = new Date(j.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  let h = `<article class="je k-${j.kind}"><header><span>${time}${j.place ? ' · ' + esc(j.place) : ''}</span>${j.pending && !j.resolved ? '<em class="need">À toi de choisir</em>' : ''}</header><p>${esc(j.text)}</p>`;
  if (j.photo) h += `<figure class="pc">${postcardSVG(j.photo, 'j' + i + t.id)}</figure>`;
  if (j.kind === 'choix') {
    const c = CHOICES[j.ctag];
    if (!j.resolved) h += `<div class="opts">${c.a.map((a, o) => `<button data-choice="${i}" data-o="${o}">${a}</button>`).join('')}</div><p class="small">Audace : gros trésor ou petite chute. Prudence : sûr mais modeste. Sans réponse, ${CHARS[t.comp].name} décidera selon son caractère.</p>`;
    else h += `<p class="out">« ${c.a[j.choice]} » · ${esc(j.outcome)}</p>`;
  }
  if (j.kind === 'rencontre') {
    if (!j.resolved) h += `<div class="opts"><button data-meet="${i}" data-o="0">Échanger un cadeau</button><button data-meet="${i}" data-o="1">Photo ensemble</button><button data-meet="${i}" data-o="2">Faire la course</button></div>`;
    else h += `<p class="out">${esc(j.outcome)}</p>`;
  }
  if (j.kind === 'marchand') {
    h += `<div class="offers">${j.offers.map((o, oi) => `<div class="offer">${itemChip(o.item)}<button data-buy="${i}" data-o="${oi}" ${o.bought || j.resolved || S.coins < o.price ? 'disabled' : ''}>${o.bought ? 'Acheté' : coins(o.price)}</button></div>`).join('')}</div>`;
    if (!j.resolved) h += `<div class="opts"><button data-buy="${i}" data-o="none">Non merci</button></div>`;
    else if (j.outcome) h += `<p class="out">${esc(j.outcome)}</p>`;
    return h + `</article>`;
  }
  if (j.kind === 'aide') {
    if (!j.resolved) h += `<div class="opts"><button data-help="${i}" data-o="1">${esc(j.help[1])}</button><button data-help="${i}" data-o="0">Continuer sa route</button></div>`;
    else h += `<p class="out">${esc(j.outcome)}</p>`;
  }
  if (j.kind === 'pieces') h += `<p class="out gain">+ ${coins(j.gain)}</p>`;
  const items = j.items || [];
  if (items.length) h += `<div class="items">${items.map(itemChip).join('')}</div>`;
  return h + `</article>`;
}

// ---- Sac
function renderBag(box) {
  const k = S.sel, ch = CHARS[k];
  const cats = [['all', 'Tout'], ['v', 'Vêtements'], ['m', 'Matériaux'], ['n', 'Nourriture'], ['d', 'Déco'], ['t', 'Cartes']];
  const list = S.inv.filter(i => bagFilter === 'all' || i.cat === bagFilter).slice().sort((a, b) => b.rarity - a.rarity || b.date - a.date);
  let html = phead(k, 'Le sac', `${S.inv.length} objets. Essayez les vêtements sur ${ch.name}, offrez-lui à manger, ou vendez ce qui ne sert pas.`);
  html += `<div class="filters">${cats.map(([v, l]) => { const n = v === 'all' ? S.inv.length : S.inv.filter(i => i.cat === v).length; return n || v === 'all' ? `<button data-filter="${v}" aria-pressed="${bagFilter === v}">${l} <small>${n}</small></button>` : ''; }).join('')}</div>`;
  if (!list.length) html += `<p class="empty">Rien ici pour l’instant. Envoyez un compagnon en voyage : il reviendra avec des vêtements, des matériaux et des spécialités locales.</p>`;
  html += `<div class="bag">` + list.map(it => {
    const worn = it.cat === 'v' && S.outfits[k].worn && S.outfits[k].worn[it.sub] === it.id;
    let act = '';
    if (it.cat === 'v') act = `<button data-wear="${it.id}">${worn ? 'Retirer' : 'Essayer'}</button>`;
    else if (it.cat === 'n') act = `<button data-feed="${it.id}">Donner</button>`;
    else if (it.cat === 't') act = `<button data-unroll="${it.id}">Déplier</button>`;
    else if (it.cat === 'd') act = `<button data-gohouse="1">Placer</button>`;
    act += `<button class="sell" data-sellq="${it.id}" title="Vendre au comptoir pour ${sellPrice(it)} pièces">${coins(sellPrice(it))}</button>`;
    return `<div class="bi" style="--rc:${RARC[it.rarity]}"><button class="ico fbtn" data-fiche="${it.id}" aria-label="Fiche : ${esc(it.name)}">${itemIcon(it)}</button><button class="itx fbtn" data-fiche="${it.id}"><b>${esc(it.name)}</b><span>${RARITY[it.rarity]} · ${it.cat === 'v' ? SLOT_LABEL[it.sub] : CAT_LABEL[it.cat]}</span><span class="from">${it.edition ? '<em>' + it.edition + '</em> · ' : ''}${esc(it.from)}</span>${usesTags(it, 3)}</button><div class="acts">${act}</div></div>`;
  }).join('') + `</div><p class="small">Touchez un objet pour voir sa fiche et à quoi il sert. Le prix affiché est celui du comptoir, immédiat. Au marché, vous vendrez plus cher, mais il faut attendre un acheteur.</p>`;
  box.innerHTML = html;
}
const sellPrice = it => Math.round(value(it) * (S.sel === 'mochi' && hasTalent('mochi', 0) ? 0.75 : 0.6));

// ---- Atelier
function ingCount(key) { const subs = ING[key][0]; return S.inv.filter(i => subs.includes(i.sub) && (i.cat === 'm' || i.cat === 'n')).length; }
function canCraft(r) { return r.ing.every(([key, n]) => ingCount(key) >= n) && S.coins >= r.coins; }
function craft(id) {
  const r = RECIPES.find(x => x.id === id); if (!r || !canCraft(r)) return;
  for (const [key, n] of r.ing) {
    const subs = ING[key][0];
    const cands = S.inv.filter(i => subs.includes(i.sub) && (i.cat === 'm' || i.cat === 'n')).sort((a, b) => (a.rid ? 1 : 0) - (b.rid ? 1 : 0) || a.rarity - b.rarity); // spécialités régionales en dernier
    cands.slice(0, n).forEach(c => S.inv.splice(S.inv.indexOf(c), 1));
  }
  S.coins -= r.coins;
  const master = Math.random() < 0.12 + lvlLuck(S.sel) * 0.2;
  const it = makeItem(r.out, 0, `Fabriqué par ${CHARS[S.sel].name}`, [], { fixed: Math.min(4, r.out[3] + (master ? 1 : 0)) });
  if (master) it.name += ' (chef-d’œuvre)';
  S.inv.push(it); S.dex[r.out[0]] = true; S.stats.crafted++;
  addXP(S.sel, 25); bump('craft'); save();
  renderTop(); renderComps(); renderPanel();
  reactionPopup(S.sel, master ? 'amour' : 'rire', master ? `Un chef-d’œuvre ! « ${it.name} »` : `Et voilà : « ${it.name} » !`);
}
function renderAtelier(box) {
  const k = S.sel, kinds = ['Vêtement', 'Décoration', 'Cuisine'];
  let html = phead(k, 'L’atelier', `${CHARS[k].name} transforme les matériaux de voyage en objets uniques. Parfois, il réussit un chef-d’œuvre, plus rare encore.`);
  html += `<div class="filters">${kinds.map(x => `<button data-cf="${x}" aria-pressed="${craftFilter === x}">${x === 'Vêtement' ? 'Vêtements' : x === 'Décoration' ? 'Décoration' : 'Cuisine'}</button>`).join('')}</div><div class="recipes">`;
  html += RECIPES.filter(r => r.kind === craftFilter).map(r => {
    const out = { name: r.out[0], cat: r.out[1], sub: r.out[2], rarity: r.out[3], look: r.out[4], color: r.out[5] };
    const ok = canCraft(r);
    return `<div class="rec ${ok ? 'ok' : ''}" style="--rc:${RARC[out.rarity]}"><div class="ico big">${itemIcon(out)}</div><div class="rx"><b>${esc(out.name)}</b><span class="rr">${RARITY[out.rarity]}${out.cat === 'v' ? ' · ' + SLOT_LABEL[out.sub] : ''}</span><ul>${r.ing.map(([key, n]) => { const have = ingCount(key); return `<li class="${have >= n ? 'have' : ''}">${ING[key][1]} <b>${Math.min(have, n)}/${n}</b></li>`; }).join('')}${r.coins ? `<li class="${S.coins >= r.coins ? 'have' : ''}">${coins(r.coins)}</li>` : ''}</ul></div><button data-craft="${r.id}" ${ok ? '' : 'disabled'}>Fabriquer</button></div>`;
  }).join('') + `</div>`;
  if (craftFilter === 'Cuisine') html += `<p class="small">Les plats cuisinés sont des plats adorés : Pistache raffole de la tarte et de la confiture, Mochi de la salade d’agrumes, Bulle de la soupe de la mer. Un plat adoré donne beaucoup d’expérience.</p>`;
  box.innerHTML = html;
}

// ---- Marché
function marketList() {
  const dk = dayKey();
  if (S.market.day !== dk) { S.market.day = dk; S.market.refresh = 0; S.market.list = []; }
  if (!S.market.list.length) {
    seed(dk * 11 + S.market.refresh * 101 + 5);
    const all = Object.values(LOOT).flat();
    const out = [];
    for (let i = 0; i < 9; i++) {
      const r = srand(); let def, from;
      if (r < 0.12) { const p = PLACES[Math.floor(srand() * PLACES.length)]; def = p.special; from = p.name; }
      else if (r < 0.3) { def = SHOP_DECOR[Math.floor(srand() * SHOP_DECOR.length)]; from = 'Brocante'; }
      else { def = all[Math.floor(srand() * all.length)]; from = PLACES[Math.floor(srand() * PLACES.length)].name; }
      const it = { id: uidGen(), name: def[0], cat: def[1], sub: def[2], rarity: Math.min(4, def[3] + (srand() < 0.3 ? 1 : 0) + (r < 0.12 ? 0 : 0)), look: def[4] || null, color: def[5] || null, from, tags: [], date: Date.now(), special: r < 0.12 ? true : undefined };
      const seller = PLAYERS[Math.floor(srand() * PLAYERS.length)];
      out.push({ item: it, price: Math.round(value(it) * (0.9 + srand() * 0.6)), seller: seller[0], comp: seller[2] });
    }
    S.market.list = out; save();
  }
  return S.market.list;
}
function renderMarket(box) {
  let html = phead(null, 'Le marché', `Achetez aux autres voyageurs, ou mettez vos trouvailles en vente. Vous avez ${coins(S.coins)}.`);
  html += `<div class="filters"><button data-mv="acheter" aria-pressed="${mktView === 'acheter'}">Acheter</button><button data-mv="vendre" aria-pressed="${mktView === 'vendre'}">Vendre <small>${S.market.mine.filter(m => !m.sold).length}</small></button></div>`;
  if (mktView === 'acheter') {
    const list = marketList();
    html += `<div class="bag">` + list.map((l, i) => `<div class="bi" style="--rc:${RARC[l.item.rarity]}"><div class="ico">${itemIcon(l.item)}</div><div class="itx"><b>${esc(l.item.name)}</b><span>${RARITY[l.item.rarity]} · ${l.item.cat === 'v' ? SLOT_LABEL[l.item.sub] : CAT_LABEL[l.item.cat]}</span><span class="from">Vendu par ${esc(l.seller)} · ${esc(l.item.from)}</span></div><div class="acts"><button data-mbuy="${i}" ${l.sold || S.coins < l.price ? 'disabled' : ''}>${l.sold ? 'Vendu' : coins(l.price)}</button></div></div>`).join('') + `</div>`;
    html += `<div class="row"><button class="ghost" id="mRefresh">Voir d’autres annonces (${coins(10)})</button><span class="small">Nouvelles annonces chaque jour.</span></div>`;
  } else {
    const mine = S.market.mine;
    if (mine.length) html += `<h3>Vos annonces</h3><div class="bag">` + mine.map((m, i) => `<div class="bi" style="--rc:${RARC[m.item.rarity]}"><div class="ico">${itemIcon(m.item)}</div><div class="itx"><b>${esc(m.item.name)}</b><span>${m.sold ? `Vendu à ${esc(m.buyer)}` : m.sellAt ? 'Un acheteur s’intéresse…' : 'Pas d’acheteur à ce prix pour l’instant'}</span></div><div class="acts">${m.sold ? `<span class="money ok">+${m.price}</span>` : `<span class="money">${COIN}${m.price}</span><button data-unlist="${i}">Retirer</button>`}</div></div>`).join('') + `</div>`;
    const sellable = S.inv.slice().sort((a, b) => b.rarity - a.rarity);
    html += `<h3>Mettre en vente</h3>`;
    if (!sellable.length) html += `<p class="empty">Votre sac est vide.</p>`;
    html += `<div class="bag">` + sellable.map(it => { const v = value(it); return `<div class="bi" style="--rc:${RARC[it.rarity]}"><div class="ico">${itemIcon(it)}</div><div class="itx"><b>${esc(it.name)}</b><span>${RARITY[it.rarity]} · valeur ${v}</span></div><div class="acts"><button data-list="${it.id}" data-p="0.85" title="Vente rapide">${coins(Math.round(v * 0.85))}</button><button data-list="${it.id}" data-p="1.1" title="Prix juste">${coins(Math.round(v * 1.1))}</button><button data-list="${it.id}" data-p="1.5" title="Prix ambitieux, vente incertaine">${coins(Math.round(v * 1.5))}</button></div></div>`; }).join('') + `</div><p class="small">Trois prix possibles : bas (vendu en une minute environ), juste (quelques minutes), ambitieux (peut-être jamais). Plus l’objet est rare, plus les acheteurs le cherchent.</p>`;
  }
  box.innerHTML = html;
}
function listItem(id, mult) {
  const it = S.inv.find(i => i.id === id); if (!it) return;
  S.inv.splice(S.inv.indexOf(it), 1);
  const price = Math.round(value(it) * mult);
  const chance = mult <= 0.9 ? 1 : mult <= 1.2 ? 0.9 : 0.35 + it.rarity * 0.08;
  const delay = (mult <= 0.9 ? rnd(30, 80) : mult <= 1.2 ? rnd(90, 300) : rnd(240, 900)) * 1000;
  S.market.mine.push({ item: it, price, listedAt: Date.now(), sellAt: Math.random() < chance ? Date.now() + delay : null, buyer: pick(PLAYERS)[0] });
  save(); renderPanel(); toast(`« ${it.name} » mis en vente à ${price} pièces.`);
}

// ---- Maison
function houseSVG() {
  const night = isNight(), L = '#5b4636';
  let s = `<svg viewBox="0 0 640 380" xmlns="http://www.w3.org/2000/svg" class="house">`;
  s += `<defs><pattern id="wp" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#f6e7d0"/><circle cx="7" cy="7" r="2" fill="#efc9b0"/><circle cx="21" cy="21" r="2" fill="#cfe1cf"/></pattern></defs>`;
  s += `<rect width="640" height="260" fill="url(#wp)"/><rect y="244" width="640" height="16" fill="#d9b48a"/><rect y="256" width="640" height="124" fill="#c99a6a"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M0 ${268 + i * 14} H640" stroke="#b5875a" stroke-width="1.2"/>`;
  for (let i = 0; i < 12; i++) s += `<path d="M${(i * 71 + (i % 2) * 30) % 640} ${268 + (i % 8) * 14} v14" stroke="#b5875a" stroke-width="1.2"/>`;
  s += `<rect x="244" y="36" width="152" height="124" rx="8" fill="${night ? '#2f3d6b' : new Date().getHours() >= 18 ? '#f5c1a5' : '#bfe1f2'}" stroke="${L}" stroke-width="3"/>`;
  if (night) { s += `<circle cx="360" cy="70" r="12" fill="#f4efd2"/>`; for (let i = 0; i < 8; i++) s += `<circle cx="${256 + (i * 37) % 130}" cy="${50 + (i * 23) % 90}" r="1.4" fill="#fff"/>`; }
  else s += `<circle cx="360" cy="70" r="16" fill="#fbd76a"/><ellipse cx="290" cy="70" rx="24" ry="9" fill="#fff" opacity=".85"/>`;
  s += `<path d="M320 36 V160 M244 98 H396" stroke="${L}" stroke-width="3"/><rect x="236" y="156" width="168" height="10" rx="3" fill="#d9b48a" stroke="${L}" stroke-width="2"/>`;
  s += `<path d="M236 30 Q250 110 238 166 L226 166 Q232 100 224 30Z M404 30 Q390 110 402 166 L414 166 Q408 100 416 30Z" fill="#f3aec1" stroke="${L}" stroke-width="2"/><rect x="220" y="26" width="200" height="8" rx="4" fill="#8a6448"/>`;
  s += `<rect x="380" y="202" width="218" height="10" rx="3" fill="#a87a50" stroke="${L}" stroke-width="2"/><path d="M392 212 v14 M586 212 v14" stroke="${L}" stroke-width="3"/>`;
  for (const sl of HOUSE_SLOTS) {
    const v = S.house[sl.id];
    if (sl.kind === 'rug') {
      if (v && v.item) s += `<g data-slot="${sl.id}" class="hs"><svg x="${sl.x}" y="${sl.y - 10}" width="${sl.w}" height="${sl.h + 20}" viewBox="0 20 100 60" preserveAspectRatio="none">${decorArt('tapis', v.item.color)}</svg></g>`;
      else s += `<g data-slot="${sl.id}" class="hs empty"><ellipse cx="${sl.x + sl.w / 2}" cy="${sl.y + sl.h / 2}" rx="${sl.w / 2}" ry="${sl.h / 2}" fill="#fff" fill-opacity=".25" stroke="${L}" stroke-width="1.5" stroke-dasharray="6 5"/></g>`;
    }
  }
  const home = Object.keys(CHARS).filter(k => !S.trips[k]);
  home.forEach((k, i) => {
    const w = 104, x = 320 - (home.length * 70) / 2 + i * 70 - 18;
    s += `<g class="hc" data-hc="${k}">${drawChar(k, S.outfits[k], night ? 'dodo' : 'content', 'h' + k).replace('<svg ', `<svg x="${x}" y="${352 - w * 1.06}" width="${w}" height="${w * 1.1}" `)}</g>`;
  });
  { const sl = HOUSE_SLOTS.find(x => x.kind === 'rug'), cx = sl.x + sl.w - 6, cy = sl.y + sl.h / 2 + 8;
    s += `<g data-slot="${sl.id}" class="hs rugbtn"><circle cx="${cx}" cy="${cy}" r="15" fill="${houseSel === sl.id ? '#2f7f6c' : '#fffaf0'}" stroke="${L}" stroke-width="2"/><text x="${cx}" y="${cy + 6}" class="hplus" style="fill:${houseSel === sl.id ? '#fff' : '#7a5f50'}">${S.house[sl.id] ? '✎' : '+'}</text></g>`; }
  for (const sl of HOUSE_SLOTS) {
    if (sl.kind === 'rug') continue;
    const v = S.house[sl.id], sel = houseSel === sl.id;
    s += `<g data-slot="${sl.id}" class="hs ${v ? '' : 'empty'} ${sel ? 'sel' : ''}">`;
    if (v && v.photo) s += `<rect x="${sl.x - 6}" y="${sl.y - 6}" width="${sl.w + 12}" height="${sl.h + 12}" rx="3" fill="#a87a50" stroke="${L}" stroke-width="2"/>` + postcardSVG(v.photo, 'hp' + sl.id).replace('<svg ', `<svg x="${sl.x}" y="${sl.y}" width="${sl.w}" height="${sl.h}" preserveAspectRatio="xMidYMid slice" `);
    else if (v && v.item && v.item.cat === 'd') s += `<svg x="${sl.x}" y="${sl.y}" width="${sl.w}" height="${sl.h}" viewBox="0 0 100 100">${decorArt(v.item.sub, v.item.color)}</svg>`;
    else if (v && v.item) s += `<svg x="${sl.x + 4}" y="${sl.y + 4}" width="${sl.w - 8}" height="${sl.h - 8}" viewBox="0 0 40 40">${itemIcon(v.item).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
    else s += `<rect x="${sl.x}" y="${sl.y}" width="${sl.w}" height="${sl.h}" rx="8" fill="#fff" fill-opacity=".3" stroke="${L}" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${sl.x + sl.w / 2}" y="${sl.y + sl.h / 2 + 5}" class="hplus">+</text>`;
    if (sel) s += `<rect x="${sl.x - 4}" y="${sl.y - 4}" width="${sl.w + 8}" height="${sl.h + 8}" rx="10" fill="none" stroke="#2f7f6c" stroke-width="3"/>`;
    s += `</g>`;
  }
  return s + `</svg>`;
}
function eligible(slot) {
  const sl = HOUSE_SLOTS.find(x => x.id === slot);
  const items = S.inv.filter(i => i.cat === 'd' ? PLACEMENT[i.sub] === sl.kind || (sl.kind === 'shelf' && ['bocal', 'mappemonde'].includes(i.sub)) : sl.kind === 'shelf' && i.cat === 'm');
  const photos = sl.kind === 'wall' ? S.album.slice().reverse() : [];
  return { items, photos };
}
function renderHouse(box) {
  const c = comfort();
  let html = phead(null, 'La maison', `Les compagnons qui ne voyagent pas vivent ici. Décorez avec vos trouvailles : chaque objet ajoute du confort, et une maison confortable fait gagner plus d’expérience.`);
  html += `<div class="comfort"><b>Confort ${c}</b><span>+${Math.round(comfortBonus() * 100)} % d’expérience pour tous les compagnons</span></div>`;
  html += `<div class="housebox">${houseSVG()}</div>`;
  if (houseSel) {
    const sl = HOUSE_SLOTS.find(x => x.id === houseSel), cur = S.house[houseSel], el = eligible(houseSel);
    const hint = { wall: 'cartes postales et herbiers', shelf: 'matériaux, bocaux et mappemondes', floor: 'plantes, lampes, lanternes, cheminées et statues', rug: 'tapis' }[sl.kind];
    html += `<div class="picker"><div class="row"><b>${sl.label}</b><span class="small">Accepte : ${hint}</span>${cur ? `<button class="ghost" id="hRemove">Retirer</button>` : ''}<button class="ghost" id="hClose">Fermer</button></div>`;
    if (!el.items.length && !el.photos.length) html += `<p class="empty">Rien à placer ici pour l’instant. ${sl.kind === 'wall' ? 'Les cartes postales arrivent avec les voyages.' : 'Fabriquez des décorations à l’atelier ou achetez-en au marché.'}</p>`;
    html += `<div class="pickgrid">${el.photos.slice(0, 12).map(p => `<button data-hphoto="${p.id}" class="pp">${postcardSVG(p, 'pk' + p.id)}</button>`).join('')}${el.items.map(it => `<button data-hitem="${it.id}" class="pi" style="--rc:${RARC[it.rarity]}"><span class="ico">${itemIcon(it)}</span><span>${esc(it.name)}</span></button>`).join('')}</div></div>`;
  } else html += `<p class="small">Cliquez sur un emplacement pointillé pour y poser un objet, ou sur un compagnon pour lui faire un câlin.</p>`;
  box.innerHTML = html;
}
function placeInHouse(slot, payload) {
  const cur = S.house[slot];
  if (cur && cur.item) S.inv.push(cur.item);
  S.house[slot] = payload;
  if (payload.item) S.inv.splice(S.inv.findIndex(i => i.id === payload.item.id), 1);
  bump('decor'); save(); houseSel = null; renderPanel();
}

// ---- Quêtes et collections
function renderQuests(box) {
  ensureDaily();
  let html = phead(null, 'Quêtes et collections', 'Trois quêtes nouvelles chaque jour, et des collections à compléter pour de grosses récompenses.');
  html += `<div class="filters"><button data-qv="jour" aria-pressed="${questView === 'jour'}">Quêtes du jour</button><button data-qv="col" aria-pressed="${questView === 'col'}">Collections</button></div>`;
  if (questView === 'jour') {
    html += `<div class="quests">` + S.daily.quests.map((q, i) => {
      const done = q.prog >= q.goal;
      return `<div class="q ${done ? 'done' : ''} ${q.claimed ? 'claimed' : ''}"><div class="qx"><b>${esc(questText(q))}</b><div class="qbar"><i style="width:${(q.prog / q.goal * 100).toFixed(0)}%"></i></div><span class="small">${q.prog}/${q.goal} · Récompense ${coins(q.reward)} et 40 expérience pour ${CHARS[S.sel].name}</span></div>${q.claimed ? '<span class="tagok">Reçu</span>' : `<button data-claimq="${i}" ${done ? '' : 'disabled'}>Récupérer</button>`}</div>`;
    }).join('') + `</div>`;
    const all = S.daily.quests.every(q => q.claimed);
    html += `<div class="chest ${all && !S.daily.chest ? 'ready' : ''}"><svg viewBox="0 0 60 50" width="64"><rect x="6" y="20" width="48" height="26" rx="4" fill="#c98a4f" stroke="#5b4636" stroke-width="2"/><path d="M6 22 C6 6 54 6 54 22Z" fill="#d99a5f" stroke="#5b4636" stroke-width="2"/><rect x="26" y="18" width="8" height="10" rx="2" fill="#f2c14e" stroke="#5b4636" stroke-width="1.6"/></svg><div><b>Coffre du jour</b><p class="small">${S.daily.chest ? 'Déjà ouvert. Revenez demain !' : 'Terminez les trois quêtes pour l’ouvrir : objet rare garanti.'}</p></div>${all && !S.daily.chest ? '<button id="openChest">Ouvrir</button>' : ''}</div>`;
  } else {
    html += `<div class="cols">` + collections().map(c => {
      const got = c.names.filter(n => S.dex[n]).length, done = got === c.names.length, claimed = S.colClaimed[c.key];
      return `<details class="col ${done ? 'done' : ''}"><summary><span class="cname">${esc(c.label)}</span><span class="cbar"><i style="width:${(got / c.names.length * 100).toFixed(0)}%"></i></span><span class="small">${got}/${c.names.length}</span>${done && !claimed ? `<button data-claimc="${c.key}">${coins(colReward(c))}</button>` : claimed ? '<span class="tagok">Complète</span>' : ''}</summary><ul>${c.names.map(n => `<li class="${S.dex[n] ? 'got' : ''}">${S.dex[n] ? esc(n) : '? ? ?'}</li>`).join('')}</ul></details>`;
    }).join('') + `</div><p class="small">Chaque collection terminée rapporte des pièces et une statuette-trophée pour la maison.</p>`;
  }
  box.innerHTML = html;
}

// ---- Album
function renderAlbum(box) {
  let html = phead(null, 'L’album', `${S.album.length} cartes postales. Accrochez vos préférées aux murs de la maison.`);
  if (!S.album.length) html += `<p class="empty">L’album est vide. Chaque voyage rapporte des cartes postales.</p>`;
  html += `<div class="album">` + S.album.slice().reverse().map((p, i) => `<figure class="pc">${postcardSVG(p, 'a' + i)}<figcaption>${esc(p.title || p.place)} <small>${new Date(p.date).toLocaleDateString('fr-FR')}</small></figcaption></figure>`).join('') + `</div>`;
  box.innerHTML = html;
}

function renderAll() { renderTop(); renderComps(); renderPanel(); drawMarks(); renderGoal(); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3200); }
function reactionPopup(k, mood, line, big) {
  const box = $('react');
  box.innerHTML = `<div class="rimg">${drawChar(k, S.outfits[k], mood, 'r' + Date.now())}</div><p>${esc(line)}</p>`;
  box.classList.toggle('big', !!big); box.hidden = false;
  clearTimeout(reactionPopup.h); reactionPopup.h = setTimeout(() => box.hidden = true, big ? 4200 : 3200);
}

// ================= ÉVÉNEMENTS =================
document.addEventListener('click', ev => {
  const hs = ev.target.closest('[data-slot]');
  if (hs && hs.closest('.house')) { houseSel = hs.dataset.slot; renderPanel(); return; }
  const hc = ev.target.closest('[data-hc]');
  if (hc) { const k = hc.dataset.hc; reactionPopup(k, 'amour', pick(CHARS[k].lines.pet)); return; }
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (el.closest('.fiche')) { $('modal').hidden = true; if (d.fclose) return; } // une action dans la fiche ferme la fiche
  if (d.fiche) return openFiche(d.fiche);
  if (d.sel) return selectComp(d.sel);
  if (d.nav) { if (d.nav === 'carte') closeSheet(); else openSheet(d.nav, true); return; }
  if (d.sub && el.closest('.subtabs') && SUBTABS[tab]) { /* la boutique gère ses propres sous-onglets */ setSub(tab, d.sub); houseSel = null; renderPanel(); $('panelBody').scrollTop = 0; return; }
  if (d.open) { openSheet(d.open); return; }
  if (el.id === 'sheetClose') { closeSheet(); return; }
  if (d.suggest) { openSheet('voyage'); return; }
  if (el.id === 'zIn') { zoomBy(1.6); return; }
  if (el.id === 'zOut') { zoomBy(1 / 1.6); return; }
  if (el.id === 'z3d') { window.toggle3D && window.toggle3D(); return; }
  if (el.id === 'zHome') { const h = homeObj(); zoomTo(h.lon, h.lat, homeZoom()); return; }
  if (el.id === 'zWorld') { zoomTo(10, 30, 1.2); return; }
  if (el.id === 'gear') { $('settings').hidden = !$('settings').hidden; return; }
  if (d.goplace) { const p = PLACES[+d.goplace]; choosePlace(p); zoomTo(p.lon, p.lat, Math.max(zoomT.k, 3)); return; }
  if (d.gosecret) { const s = SECRETS.find(x => x.key === d.gosecret); chooseSecret(d.gosecret); zoomTo(s.lon, s.lat, Math.max(zoomT.k, 3)); return; }
  if (el.id === 'clearDest') { plan.dest = null; renderPanel(); drawMarks(); return; }
  if (d.dur) { plan.dur = d.dur; renderPanel(); return; }
  if (el.id === 'goBtn') { S.stats.started = (S.stats.started || 0) + 1; if (plan.dest && plan.dest.poi) S.stats.poiStarted = (S.stats.poiStarted || 0) + 1; startTrip(); closeSheet(); const t = S.trips[S.sel]; if (t) zoomTo((t.from.lon + t.dest.lon) / 2, (t.from.lat + t.dest.lat) / 2, (t.dest.poi ? zoomT.k : Math.max(1.5, Math.min(9, 1800 / Math.max(80, t.dist))))); return; }
  if (el.id === 'fastBtn') { fast = !fast; renderPanel(); return; }
  if (el.id === 'collectBtn') return collect();
  const T = S.trips[S.sel];
  if (d.choice || d.meet || d.help || (d.buy && d.o !== 'none')) S.stats.choices = (S.stats.choices || 0) + 1;
  if (d.choice) { resolveChoice(T, T.journal[+d.choice], +d.o, false); save(); renderPanel(); return; }
  if (d.meet) { resolveMeeting(T, T.journal[+d.meet], +d.o, false); save(); renderPanel(); return; }
  if (d.buy) { resolveMerchant(T, T.journal[+d.buy], d.o === 'none' ? null : +d.o, false); save(); renderTop(); renderPanel(); return; }
  if (d.help) { resolveHelp(T, T.journal[+d.help], d.o === '1', false); save(); renderPanel(); return; }
  if (d.filter) { bagFilter = d.filter; renderPanel(); return; }
  if (d.feed) {
    const it = S.inv.find(i => i.id === d.feed); if (!it) return;
    const taste = tasteOf(S.sel, it);
    S.inv.splice(S.inv.indexOf(it), 1);
    const xp = taste === 'love' ? 25 + it.rarity * 15 : taste === 'like' ? 10 + it.rarity * 5 : 2;
    addXP(S.sel, xp); if (taste === 'love') bump('feed_love'); save();
    reactionPopup(S.sel, taste === 'love' ? 'amour' : taste === 'hate' ? 'boude' : 'rire', taste === 'love' ? `${it.name} ! C’est mon plat préféré ! (+${xp} exp.)` : taste === 'hate' ? `Beurk… ${it.name.toLowerCase()}, non merci.` : `Miam, ${it.name.toLowerCase()} ! (+${xp} exp.)`);
    renderComps(); renderPanel(); return;
  }
  if (d.wear) {
    const it = S.inv.find(i => i.id === d.wear); if (!it) return;
    if (typeof styleToggleWear === 'function') return styleToggleWear(S.sel, it); // garde-robe (19_style.js) : couleurs, prêt entre compagnons
    const o = S.outfits[S.sel]; o.col = o.col || {}; o.worn = o.worn || {};
    if (o.worn[it.sub] === it.id) { o[it.sub] = 'none'; o.worn[it.sub] = null; }
    else { o[it.sub] = it.look; o.col[it.look] = it.color; o.worn[it.sub] = it.id; S.stats.worn = (S.stats.worn || 0) + 1; }
    save(); renderAll();
    reactionPopup(S.sel, 'rire', o.worn[it.sub] ? `Comment tu me trouves avec « ${it.name} » ?` : 'Hop, rangé !');
    return;
  }
  if (d.unroll) {
    const it = S.inv.find(i => i.id === d.unroll); if (!it) return;
    S.inv.splice(S.inv.indexOf(it), 1);
    const s = SECRETS.find(x => x.key === it.sub);
    if (!S.secrets.includes(s.key)) S.secrets.push(s.key);
    save(); tab = 'carte'; plan.dest = null; renderAll(); zoomTo(s.lon, s.lat, 6);
    reactionPopup(S.sel, 'surpris', `Un lieu secret : ${s.name} ! Il apparaît sur la carte.`);
    return;
  }
  if (d.gohouse) { openSheet('maison'); return; }
  if (d.sellq) {
    const id = d.sellq, go = () => {
      const it = S.inv.find(i => i.id === id); if (!it) return;
      const p = sellPrice(it); S.inv.splice(S.inv.indexOf(it), 1); gainCoins(p); S.stats.sold++; bump('sell');
      for (const o of Object.values(S.outfits)) if (o && o.worn && o.worn[it.sub] === it.id) { o[it.sub] = 'none'; o.worn[it.sub] = null; } // aucun compagnon ne garde un vêtement vendu
      save(); renderTop(); renderComps(); renderPanel(); toast(`Vendu au comptoir : +${p} pièces.`);
    };
    if (typeof styleGuard === 'function') styleGuard(id, 'vendre', go); else go();
    return;
  }
  if (d.cf) { craftFilter = d.cf; renderPanel(); return; }
  if (d.craft) return craft(d.craft);
  if (d.mv) { mktView = d.mv; renderPanel(); return; }
  if (d.mbuy) {
    const l = S.market.list[+d.mbuy]; if (!l || l.sold || S.coins < l.price) return;
    S.coins -= l.price; l.sold = true; const it = { ...l.item, id: uidGen(), date: Date.now() }; S.inv.push(it); S.dex[it.name] = true;
    save(); renderTop(); renderPanel(); toast(`Acheté : « ${it.name} ».`); return;
  }
  if (el.id === 'mRefresh') { if (S.coins < 10) return; S.coins -= 10; S.market.refresh++; S.market.list = []; save(); renderTop(); renderPanel(); return; }
  if (d.list) { const id = d.list, m = parseFloat(d.p); if (typeof styleGuard === 'function') styleGuard(id, 'mettre en vente', () => listItem(id, m)); else listItem(id, m); return; }
  if (d.unlist) { const m = S.market.mine[+d.unlist]; if (m && !m.sold) { S.inv.push(m.item); S.market.mine.splice(+d.unlist, 1); save(); renderPanel(); } return; }
  if (el.id === 'hClose') { houseSel = null; renderPanel(); return; }
  if (el.id === 'hRemove') { const cur = S.house[houseSel]; if (cur && cur.item) S.inv.push(cur.item); delete S.house[houseSel]; save(); renderPanel(); return; }
  if (d.hitem) { const it = S.inv.find(i => i.id === d.hitem); if (it) placeInHouse(houseSel, { item: it }); return; }
  if (d.hphoto) { const p = S.album.find(x => x.id === d.hphoto); if (p) placeInHouse(houseSel, { photo: p }); return; }
  if (d.qv) { questView = d.qv; renderPanel(); return; }
  if (d.claimq) {
    const q = S.daily.quests[+d.claimq]; if (!q || q.claimed || q.prog < q.goal) return;
    q.claimed = true; gainCoins(q.reward); addXP(S.sel, 40); save(); renderAll(); toast(`+${q.reward} pièces, +40 expérience.`); return;
  }
  if (el.id === 'openChest') {
    S.daily.chest = true;
    const all = Object.values(LOOT).flat().filter(x => x[1] !== 'n');
    const it = makeItem(pick(all), 2, 'Coffre du jour', []); it.rarity = Math.max(2, it.rarity);
    S.inv.push(it); S.dex[it.name] = true; gainCoins(50); save(); renderAll();
    reactionPopup(S.sel, 'amour', `Le coffre contenait « ${it.name} » et 50 pièces !`); return;
  }
  if (d.claimc) {
    const c = collections().find(x => x.key === d.claimc); if (!c || S.colClaimed[c.key]) return;
    S.colClaimed[c.key] = true; gainCoins(colReward(c));
    S.inv.push({ id: uidGen(), name: `Trophée : ${c.label}`, cat: 'd', sub: 'statue', rarity: c.big ? 4 : 3, color: c.big ? '#f2c14e' : (TAGC[c.key] || '#c9a97a'), from: 'Collection complète', tags: [], date: Date.now() });
    save(); renderAll(); reactionPopup(S.sel, 'amour', `Collection « ${c.label} » complète !`, true); return;
  }
});
$('homeSel').innerHTML = HOMES.map(h => `<option ${h[0] === S.home ? 'selected' : ''}>${h[0]}</option>`).join('');
$('homeSel').addEventListener('change', e => { S.home = e.target.value; plan.dest = null; save(); renderAll(); const h = homeObj(); zoomTo(h.lon, h.lat, 7); });

// ================= BOUCLE =================
async function boot() {
loadLand();
for (const t of Object.values(S.trips)) if (t && !t.done) t.elapsed += Math.max(0, Date.now() - (t.last || Date.now()));
ensureDaily();
tab = 'carte';
tick(0);
await buildMap();
renderAll();
maybeIntro();
lastNow = performance.now();
function loop(now) {
  const dt = Math.min(1000, now - lastNow); lastNow = now; acc += dt;
  if (tick(dt)) { save(); renderTop(); renderComps(); renderGoal(); if (tab === 'voyage' || tab === 'boutique' || (tab === 'compagnons' && compView === 'reves')) renderPanel(); else { renderNav(); renderTripCard(); } drawMarks(); }
  else if (acc > 250) {
    acc = 0;
    const t = S.trips[S.sel];
    if (t && !t.done && tab === 'voyage') {
      const f = Math.min(1, t.elapsed / t.total), pb = $('pbar'), pt2 = $('ptime'), ph = $('phase');
      if (pb) pb.style.width = (f * 100).toFixed(1) + '%';
      if (pt2) pt2.textContent = `Retour dans ${fmtDur((t.total - t.elapsed) / (fast ? 30 : 1))}`;
      if (ph) ph.textContent = f < 0.5 ? 'À l\u2019aller' : 'Sur le chemin du retour';
    }
    if (t && !t.done) { const f = Math.min(1, t.elapsed / t.total), pb2 = $('pbar2'), pt3 = $('ptime2'); if (pb2) pb2.style.width = (f * 100).toFixed(1) + '%'; if (pt3) pt3.textContent = `${f < 0.5 ? 'Aller' : 'Retour'} · ${fmtDur((t.total - t.elapsed) / (fast ? 30 : 1))}`; }
    for (const [k, tt] of Object.entries(S.trips)) { const el = document.querySelector(`[data-st="${k}"]`); if (el && tt && !tt.done) el.textContent = `En route · ${Math.floor(tt.elapsed / tt.total * 100)} %`; }
    if (Object.values(S.trips).some(x => x && !x.done)) updateWalkers();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
const ld = $('loader'); if (ld) { ld.classList.add('out'); setTimeout(() => ld.remove(), 600); }
}
let lastNow = performance.now(), acc = 0;
requestAnimationFrame(() => setTimeout(boot, 30));
setInterval(() => save(), 5000); // save() est enveloppé plus loin (19_style.js) : on appelle toujours la dernière version
window.addEventListener('resize', () => { if (map) map.resize(); });
window.__z = k => { const h = homeObj(); zoomTo(h.lon, h.lat, k); };
window.__redraw = () => drawMarks();
window.__poiRefresh = () => refreshPOIs();
window.__pos = () => positionOverlay();
window.__dbg = () => { const b = window.__map.getBounds(), z = window.__map.getZoom(); const x0 = Math.floor(b.getWest() / CELL), x1 = Math.ceil(b.getEast() / CELL), y0 = Math.floor(b.getSouth() / CELL), y1 = Math.ceil(b.getNorth() / CELL); return { z, w: b.getWest(), e: b.getEast(), s: b.getSouth(), n: b.getNorth(), cells: (x1 - x0) * (y1 - y0) }; };
window.__tabDebug = () => ({ tab, villView, sacView, compView, sub: $('sheet').dataset.sub, hidden: $('sheet').hidden });
window.__test = { S, tick, startTrip, plan, PLACES, collect, craft, setFast: v => fast = v, value };
window.__gen = { gridVillages, geoLayersCities, genCell, CELL };

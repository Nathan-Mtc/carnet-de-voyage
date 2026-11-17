// ================= 84 · LE MOMENT FORT DES LIEUX SANS NATURE : UN CHOIX QUI COMPTE (v80) =================
// Le joueur (17/11) : des choix en route qui changent vraiment LE VOYAGE (pas « je gagne une pomme »),
// et parfois, rarement, une piste qui ouvre une petite quête avec une belle récompense.
// « L'un ou l'autre » : lieu de nature → la cueillette (83) ; ville, mer, monument, désert… → ce choix. Un seul moment par voyage.
// Ce moment REMPLACE les anciens petits événements à choix (scènes « choix », « aide », « marchand », nids sans appât).
// Règle des œufs : ils ne viennent QUE des appâts (plus d'œuf « trouvé en chemin » sans appât ; le tout premier œuf du tutoriel reste).
const ch$ = (f, d) => { try { return f(); } catch (e) { return d; } };

// ---------- les situations, selon le genre de lieu ----------
const CH_KIND = { ville: 'ville', rue: 'ville', boulangerie: 'ville', cafe: 'ville', restaurant: 'ville', marche: 'ville', librairie: 'ville', boutique: 'ville', gare: 'ville', mairie: 'ville', monument: 'monu', musee: 'monu', patrimoine: 'monu', bibliotheque: 'monu', mer: 'mer', plage: 'mer', port: 'mer', phare: 'mer', ile: 'mer', poissonnerie: 'mer', desert: 'desert' };
function chKindOf(d) { if (!d) return 'route'; for (const t of [d.cat, ...(d.tags || [])]) if (t && CH_KIND[t]) return CH_KIND[t]; return 'route'; }
const CH_SC = {
  ville: [
    { ico: '🏙️', q: '{n} se perd dans un dédale de ruelles. Une vieille dame indique un passage par les toits…', safe: 'Retrouver la grande avenue', risk: 'Passer par les toits', ok: 'Quelle vue ! {n} file de toit en toit et déniche des trouvailles en chemin.', ko: 'Une tuile glisse : {n} se rattrape de justesse, mais une partie du sac tombe dans la cour.', lead: 'Le plan griffonné qu’elle lui tend', leadTxt: 'Sur le plan, une croix et un nom : {p}.' },
    { ico: '🚋', q: 'Le dernier tram part dans une minute. {n} peut courir l’attraper… ou rentrer tranquillement à pied.', safe: 'Rentrer à pied', risk: 'Courir après le tram', ok: '{n} saute dans le tram au dernier moment : retour express, et un voyageur lui offre un souvenir.', ko: 'Raté ! En courant, {n} renverse son sac sur les pavés.', lead: 'Le ticket oublié sur le siège', leadTxt: 'Au dos du ticket, quelqu’un a écrit : « Le trésor dort à {p} ».' },
  ],
  monu: [
    { ico: '🏛️', q: 'Derrière une tapisserie, {n} remarque une petite porte entrouverte. La visite guidée continue de l’autre côté.', safe: 'Suivre la visite guidée', risk: 'Pousser la petite porte', ok: 'Un passage secret ! {n} ressort par les jardins, les bras chargés de merveilles.', ko: 'Un gardien l’attrape : {n} doit vider une partie de son sac avant de repartir.', lead: 'La gravure au-dessus de la porte', leadTxt: 'La gravure montre un lieu que {n} reconnaît : {p}.' },
  ],
  mer: [
    { ico: '🌊', q: 'La marée monte. {n} peut traverser la grève à pied tout de suite, ou attendre la prochaine barque.', safe: 'Attendre la barque', risk: 'Traverser à pied', ok: '{n} traverse juste à temps et ramasse des merveilles laissées par la mer.', ko: 'L’eau monte trop vite : {n} s’en sort, mais une partie du sac part avec les vagues.', lead: 'La bouteille échouée sur le sable', leadTxt: 'Dans la bouteille, un message : « Rendez-vous à {p} ».' },
    { ico: '⛵', q: 'Un pêcheur propose à {n} de prendre la mer avec lui, malgré les nuages qui arrivent.', safe: 'Rester sur le port', risk: 'Embarquer quand même', ok: 'Belle pêche ! Le pêcheur partage sa prise et ramène {n} au port en un rien de temps.', ko: 'La houle se lève : il faut jeter une partie du chargement par-dessus bord.', lead: 'La vieille carte du pêcheur', leadTxt: 'Le pêcheur lui confie une carte : un endroit entouré, {p}.' },
  ],
  desert: [
    { ico: '🏜️', q: 'Une caravane suit la longue piste. Les dunes, elles, coupent tout droit… si l’on sait se repérer.', safe: 'Suivre la caravane', risk: 'Couper par les dunes', ok: '{n} lit les étoiles et arrive bien avant tout le monde, avec des trouvailles plein le sac.', ko: 'Une tempête de sable ! {n} s’abrite, mais le vent emporte une partie du sac.', lead: 'Les traces d’une oasis', leadTxt: 'Les traces mènent vers un nom murmuré par les nomades : {p}.' },
  ],
  route: [
    { ico: '🌉', q: 'Le pont est fermé. {n} peut faire le grand détour, ou passer à gué par la rivière.', safe: 'Faire le détour', risk: 'Passer à gué', ok: 'Les pierres tiennent bon : {n} gagne un temps fou et trouve des merveilles sur la berge.', ko: 'Plouf ! {n} glisse dans l’eau et une partie du sac part avec le courant.', lead: 'Le panneau effacé près du pont', leadTxt: 'Sous la mousse du panneau, un nom apparaît : {p}.' },
    { ico: '🌫️', q: 'Un épais brouillard tombe. Un berger connaît un raccourci par la colline.', safe: 'Attendre que ça se lève', risk: 'Suivre le berger', ok: 'Le berger connaît son chemin : {n} arrive vite et le berger lui fait un cadeau.', ko: 'Le berger s’est trompé de sentier : {n} revient sur ses pas, le sac allégé.', lead: 'L’histoire que raconte le berger', leadTxt: 'Le berger parle d’un trésor caché à {p}.' },
  ],
};
const CH_P_OK = 0.6, CH_LEAD_P = 0.18;

// ---------- accroché au voyage ----------
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  ch$(() => {
    const t = S.trips[k]; if (!t || t === before || t.mf) return;
    const kind = chKindOf(t.dest), L = CH_SC[kind];
    t.mf = { k: 'choix', kind, sc: Math.floor(Math.random() * L.length), lead: Math.random() < CH_LEAD_P, at: 0.3 + Math.random() * 0.2, st: 'wait' }; save();
  });
  return r;
})(startTrip);
const chName = k => ch$(() => CHARS[k].name, 'Votre compagnon');
const chFill = (s, k, p) => s.replace(/\{n\}/g, chName(k)).replace(/\{p\}/g, p || '');
function chLoot(t, n, luck) {
  const out = [], tags = (t.dest && t.dest.tags) || ['campagne'];
  const pool = ch$(() => lootTable(tags), []); if (!pool.length) return out;
  for (let i = 0; i < n; i++) {
    let r = Math.random(), d = pool[0].d; for (const x of pool) { r -= x.p; if (r <= 0) { d = x.d; break; } }
    const it = ch$(() => makeItem(d, (t.luck || 0) + (luck || 0), t.dest.name, tags), null); if (it) { t.bag.push(it); out.push(it); }
  }
  return out;
}
function chAuto(t) { if (!t.mf || t.mf.k !== 'choix' || (t.mf.st !== 'wait' && t.mf.st !== 'ready')) return; t.mf.st = 'auto'; ch$(save); }
function chTick() {
  if (!S || !S.trips) return;
  let ch = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || !t.mf) continue;
    // les anciens petits choix (aide, marchand) n'interrompent plus : le moment fort les remplace
    (t.journal || []).forEach(j => { if (j && j.pending && !j.resolved && (j.kind === 'aide' || j.kind === 'marchand')) { j.resolved = true; j.skip = 1; ch = true; } });
    if (t.mf.k !== 'choix') continue;
    if (t.done) { if (t.mf.st === 'wait' || t.mf.st === 'ready') { chAuto(t); ch = true; } continue; }
    if (t.mf.st === 'wait' && t.elapsed >= t.total * t.mf.at) { t.mf.st = 'ready'; ch = true; ch$(() => toast(`${CH_SC[t.mf.kind][t.mf.sc].ico} ${chName(k)} doit faire un choix !`)); }
  }
  if (ch) { ch$(save); ch$(() => renderTripCard()); }
}
setInterval(() => { if (!document.hidden) ch$(chTick); }, 2000);
if (typeof avFireChoice === 'function') avFireChoice = (orig => function (t, e, place, J) {
  if (t && t.mf && e && (e.type === 'choix' || e.type === 'nid')) return true;          // remplacé par le moment fort
  if (e && e.type === 'nid' && !(t && t.bait && t.bait.sps && t.bait.sps.length)) return true; // pas d'œuf sans appât
  return orig.apply(this, arguments);
})(avFireChoice);
if (typeof nsTripEgg === 'function') nsTripEgg = (orig => function (e) {
  const t = e && e.trip;
  if (t && !(t.bait && t.bait.sps && t.bait.sps.length) && ch$(() => nsState().found, 1)) return null;
  return orig.apply(this, arguments);
})(nsTripEgg);

// ---------- la carte d'action ----------
function chReady() { for (const [k, t] of Object.entries(S.trips || {})) if (t && !t.done && t.mf && t.mf.k === 'choix' && t.mf.st === 'ready') return { k, t }; return null; }
if (typeof nextAction === 'function') nextAction = (orig => function () {
  const a = orig.apply(this, arguments);
  if (a && (a.kind === 'collect' || a.kind === 'cumf')) return a;
  if (document.body.classList.contains('firstrun')) return a;
  const R = ch$(chReady, null);
  return R ? { kind: 'chmf', k: R.k, t: R.t } : a;
})(nextAction);
if (typeof renderActionCard === 'function') renderActionCard = (orig => function (box) {
  const a = ch$(() => nextAction(), null);
  if (!a || a.kind !== 'chmf') return orig.apply(this, arguments);
  const sc = CH_SC[a.t.mf.kind][a.t.mf.sc];
  box.hidden = false; box.className = 'tripcard act act-cu'; box.dataset.kind = 'chmf'; box.dataset.k = a.k; box.dataset.sig = ch$(() => actionSig(a), '');
  box.innerHTML = `<span class="acic"><img src="${ch$(() => portraitURI(a.k, 'surpris'), '')}" alt=""></span><div class="tcx"><span class="ack">Moment fort · ${esc(a.t.dest.name || '')}</span><b class="act-t">${sc.ico} ${esc(chName(a.k))} doit choisir</b><span class="acs">À décider avant son retour, sinon il prend le chemin sûr.</span></div><button class="btn green" data-chplay="${a.k}">Choisir</button>`;
})(renderActionCard);

// ---------- les pistes (rares) : une petite quête vers un vrai lieu, avec une belle récompense ----------
function chLeads() { if (!Array.isArray(S.leads)) S.leads = []; const now = Date.now(); S.leads = S.leads.filter(l => !l.done && l.until > now); return S.leads; }
function chPickLeadPlace(t) {
  const h = ch$(() => homeObj(), t.from);
  const L = PLACES.filter(p => p.name !== (t.dest && t.dest.name) && p.name !== S.home && ch$(() => { const R = regionAt(p.lon, p.lat); return typeof rcIsOpen !== 'function' || rcIsOpen(R.id); }, true));
  const C = (L.length ? L : PLACES).map(p => [ch$(() => kmBetween(h, p), 9e9), p]).sort((a, b) => a[0] - b[0]).slice(0, 6);
  return C[Math.floor(Math.random() * C.length)][1];
}
function chLeadReward(t) {
  const L = chLeads(), d = t && t.dest; if (!d || !L.length) return null;
  const l = L.find(x => ch$(() => kmBetween({ lon: x.lon, lat: x.lat }, d), 9e9) < 25); if (!l) return null;
  l.done = Date.now();
  const P = PLACES.find(p => p.name === l.place) || d;
  const pool = ch$(() => lootTable(P.tags || ['campagne']), []);
  const top = pool.slice().sort((a, b) => b.d[3] - a.d[3])[0];
  const it = top ? ch$(() => makeItem(top.d, 1, P.name, P.tags || [], { fixed: Math.max(3, top.d[3]) }), null) : null;
  if (it) { it.edition = 'Trouvaille de piste'; S.inv.push(it); S.dex[it.name] = true; }
  ch$(() => gainStones(1)); ch$(save);
  return { l, it };
}
if (typeof collect === 'function') collect = (orig => function () {
  ch$(() => Object.values(S.trips).forEach(t => { if (t && t.done && t.mf) chAuto(t); }));
  const done = Object.values(S.trips || {}).filter(t => t && t.done);
  const r = orig.apply(this, arguments);
  ch$(() => done.forEach(t => { const R = chLeadReward(t); if (R) { setTimeout(() => ch$(() => { toast(`📜 Piste résolue à ${R.l.place} : ${R.it ? R.it.name + ' (rare)' : 'une trouvaille'} et 1 pierre d’étoile !`); ch$(() => confetti(true)); }), 900); } }));
  return r;
})(collect);
// une épingle « piste » sur la carte
function chLeadPins() {
  if (typeof ovEls === 'undefined' || !document.getElementById('ov')) return;
  const L = chLeads(), keep = new Set(L.map(l => 'lead' + l.id));
  Object.keys(ovEls).forEach(key => { if (key.startsWith('lead') && !keep.has(key)) { ovEls[key].el.remove(); delete ovEls[key]; } });
  L.forEach(l => {
    const key = 'lead' + l.id; if (ovEls[key] && ovEls[key].el.isConnected) return;
    const el = document.createElement('div'); el.className = 'ovm chlead'; el.dataset.chlead = l.id;
    el.innerHTML = `<span class="chl-b">📜</span><span class="chl-t">Piste</span>`;
    document.getElementById('ov').appendChild(el); ovEls[key] = { el, lon: l.lon, lat: l.lat };
  });
}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); ch$(chLeadPins); return r; })(drawMarks);
document.addEventListener('click', ev => {
  const m = ev.target.closest && ev.target.closest('.chlead'); if (!m) return;
  const l = chLeads().find(x => String(x.id) === m.dataset.chlead); if (!l) return;
  ev.stopPropagation();
  const P = PLACES.find(p => p.name === l.place);
  if (P) ch$(() => choosePlace(P)); else ch$(() => toast(`📜 Piste : allez à ${l.place}.`));
});
// et dans Quêtes › Du jour
if (typeof QM_HTML !== 'undefined' && QM_HTML.jour) QM_HTML.jour = (orig => function () {
  const L = chLeads(), now = Date.now();
  const h = L.length ? `<h3 class="qt-h3">📜 Pistes <small>${L.length}</small></h3>${L.map(l => `<div class="chq"><b>${esc(l.place)}</b><span>${esc(l.txt)}</span><small>Encore ${Math.max(1, Math.ceil((l.until - now) / 3600000))} h · récompense rare + 1 pierre d’étoile</small></div>`).join('')}` : '';
  return h + orig.apply(this, arguments);
})(QM_HTML.jour);

// ---------- la fenêtre du choix ----------
function chOpen(k) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.k !== 'choix' || t.mf.st !== 'ready' || t.done) { ch$(() => toast('Ce moment est passé.')); return; }
  const sc = CH_SC[t.mf.kind][t.mf.sc], n = chName(k);
  const ok = Math.round(CH_P_OK * 100);
  const el = document.createElement('div'); el.id = 'chG'; el.className = 'ch-ov ch-' + t.mf.kind;
  el.innerHTML = `<div class="ch-card"><div class="ch-hero"><span class="ch-ico">${sc.ico}</span><img src="${ch$(() => portraitURI(k, 'surpris'), '')}" alt=""></div>
    <p class="cu-k">Moment fort · ${esc(t.dest.name || '')}</p><p class="ch-q">${esc(chFill(sc.q, k))}</p>
    <button class="ch-opt" data-chpick="safe"><b>${esc(sc.safe)}</b><span class="ch-tags"><i>⏱️ Temps normal</i><i>🎒 +1 trouvaille</i><i class="ok">Sans risque</i></span></button>
    <button class="ch-opt risk" data-chpick="risk"><b>${esc(sc.risk)}</b><span class="ch-tags"><i>⏱️ Retour 2× plus tôt</i><i>🎒 +3 trouvailles</i><i class="ko">⚠️ ${100 - ok} % de risque : perdre une partie du sac</i></span></button>
    ${t.mf.lead ? `<button class="ch-opt lead" data-chpick="lead"><b>📜 ${esc(sc.lead)}</b><span class="ch-tags"><i>Une piste vers un lieu proche</i><i class="gold">Récompense rare si vous y allez</i></span></button>` : ''}
    <button class="cu-later" data-chquit="1">Plus tard</button></div>`;
  document.body.appendChild(el); document.body.classList.add('cu-on');
}
function chClose() { const el = document.getElementById('chG'); if (el) el.remove(); document.body.classList.remove('cu-on'); ch$(() => renderTripCard()); ch$(() => drawMarks()); }
function chPick(k, what) {
  const t = S.trips[k]; if (!t || !t.mf || t.mf.st !== 'ready') return chClose();
  const sc = CH_SC[t.mf.kind][t.mf.sc]; let txt = '', fx = [], mood = 'content';
  t.mf.st = 'done'; t.mf.pick = what;
  if (what === 'safe') { const g = chLoot(t, 1, 0); txt = `${chName(k)} prend son temps. Rien de spécial, mais ${g.length ? 'une jolie trouvaille en chemin' : 'tout va bien'}.`; fx = g.map(i => '🎒 ' + i.name); }
  else if (what === 'risk') {
    if (Math.random() < CH_P_OK) {
      const left = t.total - t.elapsed; t.total = Math.round(t.elapsed + left / 2);
      const g = chLoot(t, 3, 0.4); txt = chFill(sc.ok, k); fx = ['⏱️ Retour deux fois plus tôt', ...g.map(i => '🎒 ' + i.name)]; mood = 'rire';
    } else {
      const bag = t.bag || [], nLose = bag.length ? Math.max(1, Math.ceil(bag.length * 0.35)) : 0;
      const lost = []; for (let i = 0; i < nLose; i++) { const j = Math.floor(Math.random() * bag.length); lost.push(bag.splice(j, 1)[0]); }
      if (!nLose) { const left = t.total - t.elapsed; t.total = Math.round(t.elapsed + left * 1.4); }
      txt = chFill(sc.ko, k); fx = nLose ? lost.map(i => '❌ ' + i.name + ' perdu') : ['⏱️ Le voyage dure plus longtemps']; mood = 'triste';
    }
  } else if (what === 'lead') {
    const P = chPickLeadPlace(t), L = chLeads();
    const l = { id: Date.now().toString(36), place: P.name, lon: P.lon, lat: P.lat, from: t.dest.name, txt: chFill(sc.leadTxt, k, P.name), until: Date.now() + 3 * 86400000 };
    L.push(l); txt = l.txt; fx = [`📜 Nouvelle piste : ${P.name}`, 'Envoyez un compagnon là-bas d’ici 3 jours.']; mood = 'rire';
  }
  ch$(() => t.journal.push({ t: Date.now(), kind: 'mfchoix', text: txt }));
  ch$(save);
  const card = document.querySelector('#chG .ch-card'); if (!card) return;
  card.innerHTML = `<div class="ch-hero"><span class="ch-ico">${sc.ico}</span><img src="${ch$(() => portraitURI(k, mood), '')}" alt=""></div><p class="ch-q">${esc(txt)}</p><ul class="ch-fx">${fx.map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn green big wide" data-chquit="1">Continuer</button>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-chplay],[data-chpick],[data-chquit]'); if (!b) return;
  ev.stopPropagation(); ev.preventDefault();
  if (b.dataset.chplay) return chOpen(b.dataset.chplay);
  if (b.dataset.chquit) return chClose();
  const g = document.getElementById('chG'); const k = ch$(() => chReady().k, null) || (g && g.dataset.k);
  if (b.dataset.chpick) { const R = chReady(); if (R) chPick(R.k, b.dataset.chpick); }
}, true);
window.__ch = { force: (k, kind, lead) => { const t = S.trips[k]; if (!t) return; t.mf = { k: 'choix', kind: kind || 'ville', sc: 0, lead: !!lead, at: 0, st: 'ready' }; }, open: k => chOpen(k), leads: () => chLeads() };

{
  const st = document.createElement('style');
  st.textContent = `
.ch-ov{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(120% 90% at 50% 30%,#ffe9c9,#e9cfa4)}
.ch-ov.ch-mer{background:radial-gradient(120% 90% at 50% 30%,#dff3fb,#9fd0e6)}.ch-ov.ch-desert{background:radial-gradient(120% 90% at 50% 30%,#fff1c8,#efc27a)}
.ch-ov.ch-monu{background:radial-gradient(120% 90% at 50% 30%,#f6ecdc,#d9c4a0)}.ch-ov.ch-route{background:radial-gradient(120% 90% at 50% 30%,#eef6df,#bcd9a0)}
.ch-card{width:min(100%,400px);max-height:92vh;overflow:auto;padding:14px 16px 12px;border-radius:24px;background:#fffaf0;border:3px solid #4a3528;box-shadow:0 6px 0 rgba(74,53,40,.3);text-align:center;animation:chIn .35s ease-out}
@keyframes chIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
.ch-hero{position:relative;height:118px;margin:-4px -6px 4px;border-radius:18px;background:linear-gradient(#fff3d6,#ffe2b0);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.ch-hero img{height:112px;width:auto;filter:drop-shadow(0 3px 0 rgba(74,53,40,.2))}
.ch-ico{position:absolute;left:14px;top:10px;font-size:40px;filter:drop-shadow(0 2px 0 rgba(74,53,40,.2))}
.ch-q{margin:6px 2px 12px;font:600 15px/1.4 var(--body,system-ui);color:#4a3528}
.ch-opt{display:block;width:100%;margin:0 0 8px;padding:10px 12px;border-radius:16px;border:2.5px solid #4a3528;background:#fff;text-align:left;cursor:pointer;box-shadow:0 3px 0 rgba(74,53,40,.2)}
.ch-opt b{display:block;font:800 15px var(--display,system-ui);color:#4a3528}
.ch-opt.risk{background:#fff4e8}.ch-opt.lead{background:#fff8d6;border-color:#c99a1a}
.ch-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.ch-tags i{font-style:normal;font:700 11.5px var(--body,system-ui);padding:2px 7px;border-radius:999px;background:#f3ece0;color:#6a5040}
.ch-tags i.ok{background:#e3f4dc;color:#2f7f3c}.ch-tags i.ko{background:#fde3e0;color:#b5443a}.ch-tags i.gold{background:#ffe9a8;color:#8a6110}
.ch-fx{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:4px}.ch-fx li{font:700 13px var(--body,system-ui);color:#4a3528;background:#f6efe2;border-radius:10px;padding:5px 8px}
.ovm.chlead{z-index:4;cursor:pointer}.chlead .chl-b{position:absolute;left:-17px;top:-38px;width:34px;height:34px;border-radius:50%;background:#ffe9a8;border:2.5px solid #4a3528;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 0 rgba(74,53,40,.3);animation:chB 1.4s ease-in-out infinite}
.chlead .chl-t{position:absolute;left:0;top:0;transform:translateX(-50%);padding:0 6px;border-radius:8px;background:#fffaf0;border:1.5px solid #c99a1a;font:800 11px var(--body,system-ui);color:#8a6110;white-space:nowrap}
@keyframes chB{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.chq{margin:0 0 6px;padding:8px 10px;border-radius:14px;background:#fff8d6;border:2px solid #e6c56a;display:flex;flex-direction:column;gap:2px;text-align:left}
.chq b{font:800 14px var(--display,system-ui);color:#4a3528}.chq span{font:600 12.5px var(--body,system-ui);color:#6a5040}.chq small{font:700 11.5px var(--body,system-ui);color:#8a6110}
`;
  document.head.appendChild(st);
}

// ================= LE FOYER QUI TRAVAILLE (v21) =================
// « Vos familiers qui ne voyagent pas travaillent ici. » Chaque familier présent a UN poste (S.foyer.job[k]) :
// - jard  Jardinier : le jardin pousse plus vite, récolte ×2, récolte et ressème tout seul ;
// - comm  Commis : préparation plus rapide et une 4e place au commerce (37_commerce.js), ou prépare seul une recette choisie ;
// - nurs  Gardien de la nurserie : œufs et croisements plus rapides ;
// - repos Repos (par défaut) : le bonheur remonte (son bonus de voyage est affiché).
// Le travail tourne en continu et rattrape le temps passé jeu fermé (S.foyer.wt). Au retour : un toast discret
// « Pendant votre absence : … » (aucune fenêtre), rappelé en tête du foyer.
// Enveloppe : fyRender (31_foyer.js), cmState et cmStart (37_commerce.js). Expose window.__fw (tests).

const FW_SVG = {
  jard: '<path d="M5 13 h10 l2 8 H7Z" fill="#7fae4f" stroke="#5b4636" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 15 L22 10" stroke="#5b4636" stroke-width="2" stroke-linecap="round"/><path d="M7 13 q3 -6 7 0" fill="none" stroke="#5b4636" stroke-width="1.6"/><circle cx="22" cy="13" r="1.1" fill="#5fb0e0"/><circle cx="21" cy="16" r="1.1" fill="#5fb0e0"/>',
  comm: '<path d="M4 12 H20 L18.5 21 H5.5Z" fill="#e3a04b" stroke="#5b4636" stroke-width="1.6" stroke-linejoin="round"/><path d="M2.5 12 H21.5" stroke="#5b4636" stroke-width="2" stroke-linecap="round"/><path d="M9 9 q-1.5 -2 0 -4 M13 9 q-1.5 -2 0 -4" fill="none" stroke="#b0a090" stroke-width="1.5" stroke-linecap="round"/><path d="M16 4 L12 13" stroke="#a87a50" stroke-width="2" stroke-linecap="round"/>',
  nurs: '<path d="M12 3 C16.5 3 19 10 19 14 a7 7 0 0 1 -14 0 C5 10 7.5 3 12 3Z" fill="#fff3e2" stroke="#5b4636" stroke-width="1.6"/><path d="M7.5 12 l2 2 2 -2 2 2 2 -2 1.5 1.5" fill="none" stroke="#f39ab0" stroke-width="1.6"/><circle cx="10" cy="17" r="1.2" fill="#9fd1d8"/><circle cx="14.5" cy="16.5" r="1" fill="#9fd1d8"/>',
  repos: '<path d="M3 15 H21 V20 H3Z" fill="#9fd1d8" stroke="#5b4636" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="7.5" cy="13.5" rx="3" ry="2" fill="#fff" stroke="#5b4636" stroke-width="1.4"/><path d="M13 4 h4 l-4 5 h4 M18 2 h2.5 l-2.5 3 h2.5" fill="none" stroke="#5c6b94" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
};
// [id, nom du poste, verbe, couleur de fond, déco animée de la scène]
const FW_JOBS = [
  ['jard', 'Jardinier', 'jardine', '#e5f4df', '<i class="fw-fx fw-drops">💧</i>'],
  ['comm', 'Commis du commerce', 'cuisine', '#fff0dc', '<i class="fw-fx fw-steam">♨</i>'],
  ['nurs', 'Gardien de la nurserie', 'veille', '#fde8ef', '<i class="fw-fx fw-egg">🥚</i>'],
  ['repos', 'Repos', 'se repose', '#e4effa', '<i class="fw-fx fw-zz">z</i>'],
];
const FW_J = {}; FW_JOBS.forEach(j => { FW_J[j[0]] = j; });
const fwIco = (j, cls = '') => `<svg class="fwi ${cls}" viewBox="0 0 24 24" aria-hidden="true">${FW_SVG[j] || ''}</svg>`;

// ---------------- état ----------------
function fwState() {
  const F = fyState();
  if (!F.job || typeof F.job !== 'object' || Array.isArray(F.job)) F.job = {};
  if (typeof F.wt !== 'number' || !isFinite(F.wt)) F.wt = Date.now();
  if (typeof F.cmr !== 'string') F.cmr = '';
  if (typeof F.cmt !== 'number' || !isFinite(F.cmt)) F.cmt = 0;
  if (F.last && (typeof F.last !== 'object' || typeof F.last.txt !== 'string')) F.last = null;
  return F;
}
const fwHome = () => { try { return compIds().filter(k => CHARS[k] && S.comps[k] && !(S.trips && S.trips[k])); } catch (e) { return []; } };
const fwJob = k => { const j = fwState().job[k]; return FW_J[j] ? j : 'repos'; };
const fwWho = j => fwHome().filter(k => fwJob(k) === j);
const fwNames = ks => { const n = ks.map(k => CHARS[k].name); return n.length <= 1 ? n.join('') : n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1]; };
const fwMin = ms => { const m = Math.ceil(Math.max(0, ms) / 60e3); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
// puissance d'un poste (un 2e familier au même poste aide encore un peu)
const fwGardenX = n => 0.5 * Math.min(n, 2);          // pousse ×1,5 puis ×2
const fwNurseX = n => (n ? 1 + 0.5 * (Math.min(n, 2) - 1) : 0); // œufs ×2 puis ×2,5
const fwCmF = n => (n >= 2 ? 0.55 : n ? 0.7 : 1);     // durée de préparation
const fwCmGap = n => 90e3 / Math.min(Math.max(n, 1), 2); // une préparation automatique toutes les 90 s (45 s à deux)
const fwShop = () => { try { return typeof cmT === 'function' ? cmT() : null; } catch (e) { return null; } };
function fwRecipes() { const T = fwShop(); if (!T || typeof CM_LINES === 'undefined') return []; return (CM_LINES[T.id] || []).filter(R => !R.egg && cmUnlocked(R)); }
function fwPlural(name) { // « Pomme du verger » → « pommes du verger », « Thé fumant » → « thés fumants »
  const P = ['de', 'du', 'des', 'aux', 'au', 'à', 'en', 'd’', 'et']; let stop = false;
  return name.toLowerCase().split(' ').map(w => { if (stop || P.includes(w) || w.startsWith('d’') || w.startsWith('d\'')) { stop = true; return w; } return /[sxz]$/.test(w) || w.includes('-') ? w : w + 's'; }).join(' ');
}

// ---------------- le travail (en continu et au retour) ----------------
function fwWork(dt, rep) {
  const F = fwState(), now = Date.now(), add = (o, n, q = 1) => { o[n] = (o[n] || 0) + q; };
  dt = Math.max(0, Math.min(dt, 48 * 3600e3));
  // jardinier : pousse plus vite, récolte ×2, récolte et ressème tout seul
  const nj = fwWho('jard').length;
  if (nj && typeof famState === 'function' && typeof famHarvest === 'function') {
    const J = famState().j, ex = fwGardenX(nj);
    J.plots.forEach((p0, i) => {
      if (!p0) return;
      p0.t0 -= dt * ex;
      for (let g = 0; g < 8; g++) {
        const p = J.plots[i]; if (!p || now - p.t0 < p.ms) break;
        const at = p.t0 + p.ms, nOut = p.n || 1, seed = p.seed;
        const got = famHarvest(i); if (!got) break;
        got.slice(0, nOut).forEach(it => { const c = Object.assign({}, it, { id: uidGen(), tags: (it.tags || []).slice() }); S.inv.push(c); if (rep) add(rep.h, it.name, 2); });
        const sd = S.inv.find(x => x.name === seed && typeof famSeedOf === 'function' && famSeedOf(x));
        if (!sd || !famSow(i, sd.id)) break;
        J.plots[i].t0 = now - (now - at) * (1 + ex); // le temps écoulé depuis la récolte compte, arrosé
      }
    });
  }
  // gardien de la nurserie : œufs et croisements plus rapides
  const ne = fwNurseX(fwWho('nurs').length);
  if (ne) {
    (S.eggs || []).forEach(e => { if (e && e.ready > now) { e.ready = Math.max(now, e.ready - dt * ne); if (rep && e.ready <= now) rep.eggs++; } });
    try { const N = nsState(); if (N.cross && N.cross.ready > now) { N.cross.ready = Math.max(now, N.cross.ready - dt * ne); if (rep && N.cross.ready <= now) rep.cross = 1; } } catch (e) {}
  }
  // repos : le bonheur remonte
  fwWho('repos').forEach(k => { const c = fyC(k), j0 = c.joy; c.joy = fyClamp(c.joy + dt / 3600e3 * 20); c.nrg = fyClamp(c.nrg + dt / 3600e3 * 10); if (rep && c.joy - j0 >= 5) rep.rest.push(k); });
  // commis : prépare seul la recette choisie
  const nc = fwWho('comm').length, R = F.cmr && typeof CM_R !== 'undefined' ? CM_R[F.cmr] : null, T = fwShop();
  if (nc && R && T && R.shop === T.id && !R.egg && cmUnlocked(R)) {
    const gap = fwCmGap(nc);
    if (!F.cmt) F.cmt = now - gap;
    let k = Math.min(rep ? 12 : 1, Math.floor((now - F.cmt) / gap));
    while (k-- > 0) {
      if (!cmCanIng(R)) { F.cmt = now; if (rep) rep.miss = R.def[0]; break; }
      let c = cmState(); const i = c.sl.findIndex(x => !x); if (i < 0) break;
      cmStart(R.id); c = cmState();
      if (!c.sl[i] || c.sl[i].rid !== R.id) break;
      F.cmt += gap;
      if (rep) { const it = cmFinish(i); if (it) add(rep.p, it.name); }
    }
  }
  F.wt = now;
}
function fwSummary(rep) {
  const parts = [];
  for (const [n, q] of Object.entries(rep.h)) parts.push(`${q} ${q > 1 ? fwPlural(n) : n.toLowerCase()} au jardin`);
  for (const [n, q] of Object.entries(rep.p)) parts.push(`${q} ${q > 1 ? fwPlural(n) : n.toLowerCase()} au comptoir`);
  if (rep.eggs) parts.push(`${rep.eggs} œuf${rep.eggs > 1 ? 's' : ''} prêt${rep.eggs > 1 ? 's' : ''} à éclore`);
  if (rep.cross) parts.push('un œuf de croisement prêt');
  if (rep.rest.length) parts.push(`${fwNames(rep.rest)} ${rep.rest.length > 1 ? 'se sont reposés' : 's’est reposé'}`);
  return parts.length ? 'Pendant votre absence : ' + parts.join(', ') + '.' : '';
}
function fwCatchUp() {
  const F = fwState(), dt = Date.now() - F.wt;
  if (dt < 60e3) { fwWork(dt); return ''; }
  const rep = { h: {}, p: {}, eggs: 0, cross: 0, rest: [], miss: '' };
  fwWork(dt, rep);
  const txt = fwSummary(rep);
  if (txt) { F.last = { t: Date.now(), txt }; setTimeout(() => { try { toast(txt); } catch (e) {} }, 2500); }
  save();
  return txt;
}
let fwN = 0;
setTimeout(() => {
  try { fwCatchUp(); } catch (e) { console.error('foyer travail', e); }
  setInterval(() => {
    try {
      fwWork(Date.now() - fwState().wt);
      if (++fwN % 15 === 0) save();
      if (typeof tab !== 'undefined' && tab === 'village' && typeof villView !== 'undefined' && villView === 'foyer' && fwN % 5 === 0) fwPaintLines();
    } catch (e) {}
  }, 1000);
}, 1200);

// ---------------- commerce : le commis aide ----------------
if (typeof cmState === 'function') cmState = (orig => function () {
  let ex; try { const c = bqState().cm; if (c && Array.isArray(c.sl) && c.sl.length === 4) { ex = c.sl[3]; c.sl.length = 3; } } catch (e) {}
  const c = orig.apply(this, arguments);
  const keep = ex && CM_R[ex.rid] ? ex : null;
  try { if (keep || fwWho('comm').length) c.sl.push(keep); } catch (e) { if (keep) c.sl.push(keep); }
  return c;
})(cmState);
if (typeof cmStart === 'function') cmStart = (orig => function () {
  const t = Date.now(), r = orig.apply(this, arguments);
  try { const f = fwCmF(fwWho('comm').length); if (f < 1) cmState().sl.forEach(x => { if (x && !x.fw && x.t0 >= t) { x.fw = 1; x.dur = Math.max(2000, Math.round(x.dur * f)); x.end = x.t0 + x.dur; } }); } catch (e) {}
  return r;
})(cmStart);

// ---------------- l'écran du foyer ----------------
function fwLine(j) {
  const ks = fwWho(j), now = Date.now(), who = fwNames(ks), V = FW_J[j][2];
  if (!ks.length) return j === 'repos' ? 'Personne ne se repose.' : 'Personne à ce poste : choisissez un familier ci-dessous.';
  const s = ks.length > 1 ? 'nt' : '', verb = ks.length > 1 ? { jardine: 'jardinent', cuisine: 'cuisinent', veille: 'veillent', 'se repose': 'se reposent' }[V] : V;
  if (j === 'jard') {
    let left = Infinity, n = 0; try { famState().j.plots.forEach(p => { if (p) { n++; left = Math.min(left, p.t0 + p.ms - now); } }); } catch (e) {}
    return `${who} ${verb} : récolte ×2, pousse ×${String(1 + fwGardenX(ks.length)).replace('.', ',')}${n ? `, prête dans ${fwMin(left)}` : ' · semez une graine ci-dessous'}`;
  }
  if (j === 'comm') {
    const T = fwShop(); if (!T) return `${who} attend${s} : ouvrez un commerce (Boutique) pour qu’il aide.`;
    const F = fwState(), R = F.cmr && CM_R[F.cmr], pc = Math.round((1 - fwCmF(ks.length)) * 100);
    if (R && R.shop === T.id) return cmCanIng(R) ? `${who} ${verb} seul : ${R.def[0]}, le prochain dans ${fwMin(F.cmt + fwCmGap(ks.length) - now)}` : `${who} voudrait préparer ${R.def[0]} : il manque des ingrédients`;
    return `${who} aide en cuisine : préparation −${pc} %, une 4e place`;
  }
  if (j === 'nurs') {
    const w = (S.eggs || []).filter(e => e && e.ready > now).map(e => e.ready - now); let cr = null; try { cr = nsState().cross; } catch (e) {}
    if (cr && cr.ready > now) w.push(cr.ready - now);
    return `${who} ${verb} : œufs ×${String(1 + fwNurseX(ks.length)).replace('.', ',')} plus vite${w.length ? `, prochain prêt dans ${fwMin(Math.min(...w))}` : ' · aucun œuf qui couve'}`;
  }
  return `${who} ${verb} : bonheur +20 par heure (${ks.map(k => fyPct(k) ? `${CHARS[k].name} +${fyPct(k)} % d’objets rares` : `${CHARS[k].name} sans bonus`).join(', ')})`;
}
function fwPaintLines() { FW_JOBS.forEach(([j]) => document.querySelectorAll(`[data-fwline="${j}"]`).forEach(el => { el.textContent = fwLine(j); })); }
function fwPostHTML(j) {
  const J = FW_J[j], ks = fwWho(j);
  let extra = '';
  if (j === 'comm' && ks.length && fwShop()) {
    const F = fwState(), rs = fwRecipes();
    extra = `<label class="fw-sel"><span>Il prépare :</span><select data-fwrec="1"><option value="">Rien seul (il aide)</option>${rs.map(R => `<option value="${R.id}"${F.cmr === R.id ? ' selected' : ''}>${esc(R.def[0])}${cmCanIng(R) ? '' : ' (ingrédients ?)'}</option>`).join('')}</select></label>`;
  }
  return `<div class="fw-post j-${j}${ks.length ? ' on' : ''}" style="--fwb:${J[3]}"><div class="fw-scene">${fwIco(j, 'big')}${ks.slice(0, 4).map((k, i) => `<img class="fw-pet" style="--d:${(i * 0.35).toFixed(2)}s" src="${portraitURI(k, j === 'repos' ? 'dodo' : 'content')}" alt="${esc(CHARS[k].name)}">`).join('')}${ks.length ? J[4] : ''}</div><div class="fw-pt"><b>${fwIco(j)}${esc(J[1])}</b><span class="fw-line" data-fwline="${j}">${esc(fwLine(j))}</span>${extra}</div></div>`;
}
fyRender = function (box) {
  fyState(); try { fyMig20(); } catch (e) {} const F = fwState();
  if (fySel && !S.comps[fySel]) fySel = null;
  const ids = compIds().filter(k => CHARS[k] && S.comps[k]), now = Date.now();
  let h = `<div class="fw-head"><b>Vos familiers qui ne voyagent pas travaillent ici.</b><span>Donnez un poste à chacun : ce qu’ils produisent arrive dans votre sac, même jeu fermé.</span>${F.last && now - F.last.t < 6 * 3600e3 ? `<span class="fw-last">${fyIco('star')}${esc(F.last.txt)}</span>` : ''}</div>`;
  h += `<div class="fw-posts">${FW_JOBS.map(([j]) => fwPostHTML(j)).join('')}</div>`;
  h += `<h3 class="fy2-h">${fyIco('paw')} Vos familiers</h3><div class="fy2-list">`;
  h += ids.map(k => {
    const c = fyC(k), p = fyPct(k), away = !!S.trips[k], jb = fwJob(k);
    const posts = away ? `<span class="fw-away">${fyIco('map')}en voyage</span>` : `<div class="fw-jobs" role="group" aria-label="Poste de ${esc(CHARS[k].name)}">${FW_JOBS.map(([j, nm]) => `<button data-fwjob="${j}" data-fk="${k}" aria-pressed="${jb === j}" title="${esc(nm)}">${fwIco(j)}<small>${esc(nm.split(' ')[0])}</small></button>`).join('')}</div>`;
    return `<div class="fy2-c fw-c p${p}${fySel === k ? ' sel' : ''}"><span class="fy2-pic"><img src="${portraitURI(k, c.joy >= 70 ? 'rire' : 'content')}" alt=""></span><div class="fy2-x"><b>${esc(CHARS[k].name)}</b>${fyDots(c.joy, 'heart', 'joy')}<span class="fy2-b">${esc(fyBonusTxt(k))}</span></div>${away ? '' : `<div class="fy2-a"><button data-fy="feed2" data-fk="${k}" aria-label="Nourrir">${fyIco('bowl')}</button><button data-fy="pet2" data-fk="${k}" aria-label="Câliner">${fyIco('paw')}</button></div>`}${posts}</div>${fySel === k && fyMode === 'food' ? fyFoodHTML(k) : ''}`;
  }).join('') + `</div>`;
  h += `<h3 class="fy2-h">${fwIco('jard')} Le jardin <small>${fwWho('jard').length ? 'arrosé par votre jardinier' : 'sans jardinier : pousse normale'}</small></h3><div id="fyJardin" class="fy2-jar">${typeof jardinHTML === 'function' ? '' : '<p class="fy2-none">Le jardin arrive bientôt.</p>'}</div>`;
  const N = nsState(), eggs = S.eggs || [], cr = N.cross;
  h += `<h3 class="fy2-h">${fwIco('nurs')} La nurserie</h3><div class="fy2-nur"><div class="fy2-eggs">${eggs.slice(0, 6).map(e => { const ok = e.ready <= now; return `<div class="fy2-egg"><span>${eggArt(e, ok ? 1 : 0, 'fy2' + e.id)}</span>${ok ? `<button class="btn gold sm" data-act="hatch" data-id="${e.id}">Éclore</button>` : `<small>${fmtDur(e.ready - now)}</small>`}</div>`; }).join('') || `<span class="fy2-none">Pas d’œuf pour l’instant</span>`}</div>
    <div class="fy2-cross">${fyIco('heart')}<span>${cr ? `${esc(cr.names[0])} × ${esc(cr.names[1])} : ${cr.ready <= now ? 'œuf prêt !' : 'œuf dans ' + fmtDur(cr.ready - now)}` : N.enclos ? 'Croisements : choisissez deux parents' : 'Croisements : fabriquez le panier double'}</span><button class="btn cream sm" data-fy="nurse">Ouvrir</button></div></div>`;
  try { const ci = fyCapInfo(), canUp = ci.up && nsCanPay(ci.up.nx.cost, ci.up.nx.coins); h += `<div class="fy2-cap">${fyIco('house')}<b>${ci.n}/${ci.cap} familiers accueillis</b>${ci.up ? `<span class="fy2-cost">${nsCostHTML(ci.up.nx.cost, ci.up.nx.coins)}</span><button class="btn ${canUp ? 'green' : 'cream'} sm" data-fy="grow" data-fk="${ci.up.H.id}" ${canUp ? '' : 'disabled'}>Agrandir</button>` : ''}</div>`; } catch (e) {}
  box.innerHTML = h;
  if (typeof jardinHTML === 'function') { const j = box.querySelector('#fyJardin'); try { const r = jardinHTML(j); if (typeof r === 'string' && r) j.innerHTML = r; } catch (e) { console.error('jardin', e); } }
  fyFx = null;
};

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-fwjob]'); if (!el || !el.closest('#panelBody')) return;
  const k = el.dataset.fk, j = el.dataset.fwjob; if (!S.comps[k] || !FW_J[j]) return;
  fwWork(Date.now() - fwState().wt); // le travail en cours est compté avant le changement
  fwState().job[k] = j;
  if (j === 'comm') fwState().cmt = Date.now();
  save(); const b = $('panelBody'), top = b ? b.scrollTop : 0; renderPanel(); if (b) b.scrollTop = top;
});
document.addEventListener('change', ev => {
  const el = ev.target.closest('[data-fwrec]'); if (!el) return;
  const F = fwState(); F.cmr = el.value; F.cmt = Date.now() - fwCmGap(fwWho('comm').length) + 3000; save(); fwPaintLines();
});

// ---------------- style ----------------
(function fwCSS() {
  const st = document.createElement('style');
  st.textContent = `
.fw-head{display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:2.5px solid var(--line,#e2d3bd);border-radius:16px;background:#fffaf0;margin-bottom:10px}
.fw-head>b{font:800 17px/1.2 var(--display,inherit);color:var(--ink,#4a3528)}
.fw-head>span{font-size:13px;color:var(--ink2,#7a6250)}
.fw-head .fw-last{display:flex;gap:6px;align-items:flex-start;margin-top:4px;padding:6px 8px;border-radius:10px;background:#eef8e6;color:#2f6b3a;font-weight:700}
.fw-head .fw-last .fyi{width:16px;height:16px;flex:none;color:#e0a52a}
.fw-posts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
.fw-post{border:2.5px solid var(--line,#e2d3bd);border-radius:16px;background:#fff;overflow:hidden;display:flex;flex-direction:column}
.fw-post.on{border-color:#5b4636;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.fw-scene{position:relative;height:64px;background:var(--fwb);display:flex;align-items:flex-end;justify-content:center;gap:2px;padding:0 6px 4px}
.fw-scene .livep{width:46px;height:50px;flex:none;border-radius:50%;background:#fff;border:2px solid #5b4636;overflow:hidden;animation:fwBob 1.6s ease-in-out infinite}
.fw-scene .fwi.big{position:absolute;left:6px;top:6px;width:30px;height:30px;opacity:.9}
.fw-scene img.fw-pet{width:42px!important;height:42px!important;max-width:42px;flex:none;border-radius:50%;background:#fff;border:2px solid #5b4636;object-fit:cover;animation:fwBob 1.6s ease-in-out infinite;animation-delay:var(--d)}
.j-jard .fw-pet{animation-name:fwDig}.j-comm .fw-pet{animation-name:fwStir}.j-repos .fw-pet{animation:fwSleep 3s ease-in-out infinite}
.fw-fx{position:absolute;right:10px;top:8px;font-style:normal;font-size:16px;animation:fwFx 1.4s ease-in infinite}
.fw-zz{font:800 18px/1 var(--display,inherit);color:#5c6b94}
.fw-egg{animation:fwWob 1s ease-in-out infinite}
.fw-pt{padding:6px 8px 8px;display:flex;flex-direction:column;gap:3px}
.fw-pt>b{display:flex;align-items:center;gap:4px;font:800 13.5px/1.15 var(--display,inherit)}
.fw-line{font-size:12.5px;line-height:1.3;color:var(--ink2,#7a6250)}
.fw-post.on .fw-line{color:var(--ink,#4a3528);font-weight:600}
.fwi{width:20px;height:20px;flex:none}
.fw-sel{display:flex;flex-direction:column;gap:2px;font-size:12px}
.fw-sel select{font:inherit;font-size:13px;padding:4px;border-radius:10px;border:2px solid var(--line,#e2d3bd);background:#fff;max-width:100%}
.fw-c{flex-wrap:wrap}
.fw-jobs{flex-basis:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px}
.fw-jobs button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 2px;border-radius:12px;border:2px solid var(--line,#e2d3bd);background:#fff;cursor:pointer;color:var(--ink2,#7a6250);font:700 11px/1.1 var(--display,inherit)}
.fw-jobs button[aria-pressed="true"]{border-color:#5b4636;background:#fff3c4;color:var(--ink,#4a3528);box-shadow:0 2px 0 rgba(74,53,40,.3)}
.fw-away{flex-basis:100%;display:flex;gap:4px;align-items:center;font-size:12.5px;color:var(--ink2,#7a6250);margin-top:4px}.fw-away .fyi{width:16px;height:16px}
.cm-slots:has(> :nth-child(4)){grid-template-columns:repeat(4,minmax(0,1fr))}
@keyframes fwBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes fwDig{0%,100%{transform:rotate(0)}30%{transform:rotate(-10deg) translateY(2px)}60%{transform:rotate(6deg)}}
@keyframes fwStir{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-3px) rotate(-5deg)}75%{transform:translateX(3px) rotate(5deg)}}
@keyframes fwSleep{0%,100%{transform:scale(1)}50%{transform:scale(1.05,.95) translateY(2px)}}
@keyframes fwFx{0%{transform:translateY(6px);opacity:0}30%{opacity:1}100%{transform:translateY(-10px);opacity:0}}
@keyframes fwWob{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
@media (min-width:700px){.fw-posts{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (prefers-reduced-motion:reduce){.fw-pet,.fw-fx{animation:none}}
`;
  document.head.appendChild(st);
})();

window.__fw = { state: fwState, work: fwWork, catchUp: fwCatchUp, who: fwWho, line: fwLine, setJob: (k, j) => { fwState().job[k] = j; save(); },
  // pour les tests (le jeu est enveloppé dans une fonction)
  T: () => ({ S, addComp, compIds, CHARS, ING, makeItem, famSow, famState, addEgg, cmState, renderPanel, openBoutique: typeof openBoutique === 'function' ? openBoutique : null, $ }) };

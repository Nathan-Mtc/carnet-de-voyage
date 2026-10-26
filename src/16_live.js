// ================= VOYAGE EN DIRECT ET MONDE À COLORIER =================
// Mission A : le fil du voyage (dernière entrée du journal), la notification de choix,
//             le bouton « est rentré ! Ouvrir son sac », et « Ce que tu peux trouver là-bas ».
// Mission B : S.visited, la carte grisée qui se colore autour des lieux visités, le compteur.
(function liveCSS() {
  const st = document.createElement('style'); st.id = 'liveCSS';
  st.textContent = `
/* compagnon en route sur la carte */
.walker .wkb{width:48px;height:48px;left:-24px;top:-54px;box-shadow:0 3px 0 rgba(74,53,40,.35),0 0 0 4px rgba(255,248,234,.75)}
.walker .wkb img{width:46px;height:50px}
.walker .wkl{position:absolute;left:0;top:0;transform:translateX(-50%);background:#fff8ea;border:2px solid #4a3528;border-radius:999px;padding:0 8px;font:800 12px/18px var(--display);color:#4a3528;white-space:nowrap;box-shadow:0 2px 0 rgba(74,53,40,.3);font-variant-numeric:tabular-nums}
.walker.cur .wkl{background:#e6f6e9;border-color:#2f7f6c}
.walker.done .wkl{background:#fff3c4}
.walker.ask .wkbang{display:block;animation:pulse .7s infinite alternate;background:#f08aa6}
.walker.ask .wkbang::before{content:"?"}
.walker.ask .wkbang{font-size:0}.walker.ask .wkbang::before{font-size:13px}
#ov[data-z="far"] .walker:not(.cur) .wkl{display:none}
.tdest svg{position:absolute;left:-7px;top:-38px;width:28px;height:38px;filter:drop-shadow(1px 2px 0 rgba(74,53,40,.3));animation:dropin .4s cubic-bezier(.2,1.6,.4,1)}
.tdest .pinl{top:3px}
#ov[data-z="far"] .tdest .pinl{display:none}

/* fil du voyage, au-dessus de la barre du bas */
#liveBar{position:absolute;left:50%;transform:translateX(-50%);width:min(560px,calc(100% - 32px));z-index:4;pointer-events:none;bottom:calc(190px + env(safe-area-inset-bottom,0px))}
#liveBar>button{pointer-events:auto}
.lvb{width:100%;display:flex;align-items:center;gap:9px;border:2.5px solid var(--ink);border-radius:16px;padding:5px 10px 5px 6px;cursor:pointer;color:var(--ink);text-align:left;font-family:var(--body);box-shadow:0 4px 0 rgba(74,53,40,.4);background:var(--paper)}
.lvb:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(74,53,40,.4)}
.lvb .lvi{position:relative;width:34px;height:34px;flex:none;border-radius:50%;background:var(--ic,#5fbf7f);border:2px solid var(--ink);display:flex;align-items:center;justify-content:center}
.lvb .lvi svg{width:20px;height:20px}
.lvb .lvi img{position:absolute;right:-8px;bottom:-7px;width:22px;height:24px;border-radius:50%;background:#fffaf0;border:1.5px solid var(--ink);object-fit:cover;object-position:top}
.lvb .lvx{flex:1;min-width:0;display:flex;flex-direction:column;gap:0}
.lvb .lvx small{font:700 11.5px/1.25 var(--display);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.lvb .lvx small i{font-style:normal;color:var(--rust);letter-spacing:.05em;text-transform:uppercase}
.lvb .lvx b{font:600 14px/1.22 var(--body);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lvb .lvgo{flex:none;font:800 12.5px var(--display);color:var(--ink2);display:flex;align-items:center;gap:2px}
.lvb .lvgo svg{width:14px;height:14px}
.lvb.pop{animation:lvpop .45s cubic-bezier(.2,1.5,.4,1)}
@keyframes lvpop{from{transform:translateY(10px) scale(.96);opacity:.3}}
.lvb.ask{background:var(--pink);color:#fff;border-color:var(--ink);animation:lvask 1s ease-in-out infinite alternate}
.lvb.ask .lvx small{color:#fff;opacity:.9}.lvb.ask .lvx small i{color:#fff}
.lvb.ask .lvx b{font:800 17px/1.15 var(--display);text-shadow:0 2px 0 var(--pinkD)}
.lvb.ask .lvgo{background:#fff;color:var(--pinkD);border:2px solid var(--ink);border-radius:10px;padding:5px 9px 3px;font-size:14px}
@keyframes lvask{to{box-shadow:0 4px 0 rgba(74,53,40,.4),0 0 0 6px rgba(240,138,166,.35)}}
.lvb.home{background:var(--green);color:#fff;padding:7px 10px 7px 7px;animation:lvglow 1.1s ease-in-out infinite alternate}
.lvb.home .lvi{width:46px;height:46px;background:#fff3c4}
.lvb.home .lvi img{position:static;width:40px;height:44px;border:0;background:none}
.lvb.home .lvx b{font:800 18px/1.1 var(--display);text-shadow:0 2px 0 var(--greenD);-webkit-line-clamp:2}
.lvb.home .lvx small{color:#fff;opacity:.95}
.lvb.home .lvgo{background:var(--gold);color:var(--ink);border:2.5px solid var(--ink);border-radius:12px;padding:8px 11px 6px;font-size:15px;box-shadow:0 3px 0 var(--ink)}
@keyframes lvglow{to{box-shadow:0 4px 0 rgba(74,53,40,.4),0 0 0 7px rgba(246,196,69,.55)}}
body.sheet-open #liveBar{display:none}
@media (max-width:420px){.lvb.home .lvx b{font-size:16px}.lvb.ask .lvx b{font-size:16px}.lvb.feed .lvgo span{display:none}.lvb.feed .lvx b{font-size:13.5px}.lvb .lvgo svg{width:18px;height:18px}}
.je.lvflash{animation:lvflash 1.4s ease-out 2}
@keyframes lvflash{30%{box-shadow:0 0 0 6px rgba(240,138,166,.6)}}

/* « Ce que tu peux trouver là-bas » */
.canfind{flex:none;background:#fff;border:2.5px solid var(--ink);border-radius:16px;box-shadow:0 3px 0 rgba(74,53,40,.3);padding:8px 10px 9px;display:flex;flex-direction:column;gap:6px}
.cfh{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.cfh b{font:800 15px var(--display)}
.cfdur{display:inline-flex;align-items:center;gap:4px;background:#e6f6e9;border:2px solid var(--greenD);border-radius:999px;padding:1px 9px 0;font:800 13px/20px var(--display);color:var(--ink);white-space:nowrap}
.cfdur svg{width:14px;height:14px}
.cfi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.cfi>span{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
.cfi .cfic{width:46px;height:46px;border-radius:13px;background:#fffaf0;border:2.5px solid var(--rc);padding:5px;display:flex}
.cfi .cfic svg{width:100%;height:100%}
.cfi em{font:700 11.5px/1.2 var(--body);font-style:normal;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cfi i{font:800 10.5px var(--display);font-style:normal;color:var(--rc)}

/* monde à colorier */
#worldMeter{position:absolute;right:calc(100% + 8px);display:flex;align-items:center;gap:6px;background:rgba(255,248,234,.94);border:2px solid var(--ink);border-radius:999px;padding:2px 10px 1px 4px;font:700 11.5px/1.2 var(--display);color:var(--ink);white-space:nowrap;box-shadow:0 2px 0 rgba(74,53,40,.35);cursor:pointer;transform-origin:right center;transition:transform .3s}
#worldMeter svg{width:22px;height:22px;flex:none}
#worldMeter span{display:flex;flex-direction:column}
#worldMeter small{font:600 10.5px var(--body);color:var(--ink2)}
#worldMeter .wmbar{display:block;height:5px;margin:1px 0 1px;border-radius:999px;background:#e7dcc4;overflow:hidden}#worldMeter .wmbar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#f2c14e,#5fbf7f)}
#worldMeter.flash{animation:wmflash 2.6s ease-in-out}
@keyframes wmflash{12%{transform:scale(1.25);background:#fff3c4}80%{transform:scale(1.25);background:#fff3c4}}
.reveal{pointer-events:none!important;position:absolute;left:0;top:0}
.reveal i{position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:4px solid #fff;box-shadow:0 0 0 3px rgba(246,196,69,.8),inset 0 0 20px rgba(255,255,255,.9);animation:rvring 1.6s ease-out forwards}
.reveal i:nth-child(2){animation-delay:.25s;border-color:#f6c445}
.reveal b{position:absolute;left:0;top:-70px;transform:translateX(-50%);background:var(--paper);border:2.5px solid var(--ink);border-radius:14px;padding:3px 12px 1px;font:800 15px var(--display);white-space:nowrap;box-shadow:0 3px 0 rgba(74,53,40,.4);animation:rvtxt 3.4s ease-out forwards}
.reveal s{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:var(--sc);text-decoration:none;animation:rvspark 1.3s ease-out forwards;animation-delay:var(--dl)}
@keyframes rvring{from{transform:scale(.1);opacity:1}to{transform:scale(2.6);opacity:0}}
@keyframes rvtxt{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}12%{opacity:1;transform:translate(-50%,0) scale(1.05)}20%{transform:translate(-50%,0) scale(1)}85%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px)}}
@keyframes rvspark{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
`;
  document.head.appendChild(st);
})();

// ---------------- icônes des événements du journal ----------------
const LIVE_KIND = {
  depart: ['#5fbf7f', '<path d="M6 21 V8 a6 6 0 0 1 12 0 V21Z" fill="#fff"/><path d="M9 8 a3 3 0 0 1 6 0" fill="none" stroke="#5fbf7f" stroke-width="2"/><rect x="9" y="13" width="6" height="4" rx="1" fill="#5fbf7f"/>', 'Départ'],
  photo: ['#4f97c4', '<rect x="3" y="7" width="18" height="13" rx="3" fill="#fff"/><path d="M8 7 L10 4 H14 L16 7Z" fill="#fff"/><circle cx="12" cy="13.5" r="3.6" fill="#4f97c4"/>', 'Découverte'],
  trouvaille: ['#e3a72f', '<path d="M12 2 Q13.5 10 22 12 Q13.5 14 12 22 Q10.5 14 2 12 Q10.5 10 12 2Z" fill="#fff"/>', 'Trouvaille'],
  repas: ['#e0884a', '<path d="M3 12 H21 C21 18 17 21 12 21 C7 21 3 18 3 12Z" fill="#fff"/><path d="M8 9 q2 -3 0 -6 M12 9 q2 -3 0 -6 M16 9 q2 -3 0 -6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>', 'Repas'],
  rencontre: ['#f08aa6', '<path d="M12 21 C3 15 2 10 4.5 7 C7 4 11 5.5 12 8.5 C13 5.5 17 4 19.5 7 C22 10 21 15 12 21Z" fill="#fff"/>', 'Rencontre'],
  choix: ['#d9604f', '<path d="M11 22 V3" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M11 4 H19 L22 7 L19 10 H11Z M11 12 H5 L2 15 L5 18 H11Z" fill="#fff"/>', 'Choix'],
  marchand: ['#b77fd1', '<path d="M3 10 L5 4 H19 L21 10Z" fill="#fff"/><rect x="5" y="10" width="14" height="10" fill="#fff"/><circle cx="12" cy="15" r="2.6" fill="#b77fd1"/>', 'Marchand'],
  aide: ['#2f9f8a', '<path d="M3 14 L8 11 C10 10 12 11 13 12 L17 12 C18.5 12 18.5 14.5 17 14.5 H12 M3 19 L8 17 H14 L21 12.5 C22 11.8 21 10 19.8 10.6 L15 13" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="5.5" r="2.6" fill="#fff"/>', 'Coup de main'],
  animal: ['#a87a50', '<ellipse cx="12" cy="16" rx="5" ry="4.2" fill="#fff"/><circle cx="6" cy="10" r="2.2" fill="#fff"/><circle cx="10" cy="6.5" r="2.2" fill="#fff"/><circle cx="14.5" cy="6.5" r="2.2" fill="#fff"/><circle cx="18.5" cy="10" r="2.2" fill="#fff"/>', 'Animal'],
  merveille: ['#7d8fe0', '<path d="M3 18 A9 9 0 0 1 21 18" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M7 18 A5 5 0 0 1 17 18" fill="none" stroke="#fff" stroke-width="2.2" opacity=".75"/><circle cx="18" cy="6" r="2.4" fill="#fff"/>', 'Météo'],
  pieces: ['#c98f1e', '<circle cx="12" cy="12" r="8" fill="#fff"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#c98f1e" stroke-width="1.8"/>', 'Pièces'],
  tresor: ['#8a6448', '<path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20Z" fill="#fff"/><path d="M15 10 l3 3 M18 10 l-3 3" stroke="#d9604f" stroke-width="2" stroke-linecap="round"/>', 'Trésor'],
  retour: ['#5fbf7f', '<path d="M4 12 L12 4 L20 12 V20 H4Z" fill="#fff"/><rect x="10" y="14" width="4" height="6" fill="#5fbf7f"/>', 'Retour'],
};
const liveIcon = kind => { const k = LIVE_KIND[kind] || LIVE_KIND.photo; return { col: k[0], svg: `<svg viewBox="0 0 24 24" aria-hidden="true">${k[1]}</svg>`, label: k[2] }; };
const LIVE_CHEV = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LIVE_CLOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="#fff" stroke="#4a3528" stroke-width="1.6"/><path d="M8 4.5 V8 L10.5 9.5" fill="none" stroke="#4a3528" stroke-width="1.6" stroke-linecap="round"/></svg>';
function liveAgo(t) { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 10 ? 'à l’instant' : s < 60 ? `il y a ${s} s` : s < 3600 ? `il y a ${Math.floor(s / 60)} min` : `il y a ${Math.floor(s / 3600)} h`; }
const livePend = t => t.journal.findIndex(j => j.pending && !j.resolved);
function liveAskText(n, j) {
  if (j.kind === 'rencontre') return `${n} fait une rencontre ! Choisis`;
  if (j.kind === 'marchand') return `Un marchand pour ${n} ! Choisis`;
  if (j.kind === 'aide') return `${n} peut aider ! Choisis`;
  return `${n} hésite ! Choisis`;
}

// ---------------- état du fil : quoi montrer ? ----------------
function liveState() {
  const keys = Object.keys(CHARS), order = [S.sel, ...keys.filter(k => k !== S.sel)];
  for (const k of order) { const t = S.trips[k]; if (t && t.done) return { mode: 'home', k, t }; }
  for (const k of order) { const t = S.trips[k]; if (t && !t.done) { const i = livePend(t); if (i >= 0) return { mode: 'ask', k, t, i }; } }
  for (const k of order) { const t = S.trips[k]; if (t && !t.done) return { mode: 'feed', k, t }; }
  return null;
}
let liveSig = '', liveLastEntry = '';
function renderLive(force) {
  let bar = $('liveBar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'liveBar'; const tc = $('tripCard'); (tc ? tc.parentNode : document.querySelector('.game')).insertBefore(bar, tc ? tc.nextSibling : null); }
  const st = (typeof tab === 'undefined' || tab === 'carte') ? liveState() : null;
  if (!st) { bar.hidden = true; liveSig = ''; return; }
  bar.hidden = false;
  const { mode, k, t } = st, n = CHARS[k].name, f = Math.min(1, t.elapsed / t.total), pct = Math.min(99, Math.floor(f * 100));
  const last = t.journal[t.journal.length - 1] || { kind: 'depart', text: '', t: Date.now() };
  const entryId = k + ':' + t.id + ':' + t.journal.length + ':' + mode;
  const sig = entryId + ':' + pct + ':' + liveAgo(last.t) + ':' + (st.i || 0);
  if (sig === liveSig && !force) { liveLayout(); return; }
  liveSig = sig;
  let html;
  if (mode === 'home') {
    const nb = t.bag.length;
    html = `<button class="lvb home" data-live="collect" data-lk="${k}"><span class="lvi"><img src="${portraitURI(k, 'rire')}" alt=""></span><span class="lvx"><b>${n} est rentré !</b><small>${nb} objet${nb > 1 ? 's' : ''}${t.coins > 0 ? ` et ${t.coins} pièces` : ''} rapportés de ${esc(t.dest.name)}</small></span><span class="lvgo">Ouvrir son sac</span></button>`;
  } else if (mode === 'ask') {
    const j = t.journal[st.i], ic = liveIcon(j.kind);
    html = `<button class="lvb ask" data-live="ask" data-lk="${k}"><span class="lvi" style="--ic:#fff">${ic.svg.replace(/#fff"/g, ic.col + '"').replace('<svg ', `<svg style="color:${ic.col}" `)}<img src="${portraitURI(k)}" alt=""></span><span class="lvx"><small><i>${ic.label}</i> · ${esc(j.place || t.dest.name)}</small><b>${esc(liveAskText(n, j))}</b></span><span class="lvgo">Choisir</span></button>`;
  } else {
    const ic = liveIcon(last.kind);
    html = `<button class="lvb feed" data-live="journal" data-lk="${k}" aria-label="Ouvrir le journal de ${n}"><span class="lvi" style="--ic:${ic.col}">${ic.svg}<img src="${portraitURI(k)}" alt=""></span><span class="lvx"><small><i>${ic.label}</i> · ${n} ${pct} % · ${liveAgo(last.t)}</small><b>${esc(last.text)}</b></span><span class="lvgo"><span>Journal</span>${LIVE_CHEV}</span></button>`;
  }
  bar.innerHTML = html;
  if (entryId !== liveLastEntry) { liveLastEntry = entryId; const b = bar.firstElementChild; if (b && !(typeof reduceMotion === 'function' && reduceMotion())) b.classList.add('pop'); }
  liveLayout();
}
// le fil se pose juste au-dessus de la carte de voyage (ou de la barre du bas)
function liveLayout() {
  const bar = $('liveBar'); if (!bar || bar.hidden) return;
  const game = bar.offsetParent || document.body, gr = game.getBoundingClientRect();
  let top = gr.bottom - 90;
  for (const id of ['tripCard', 'nav']) {
    const el = $(id); if (!el || el.hidden) continue;
    const r = el.getBoundingClientRect(); if (!r.height || getComputedStyle(el).display === 'none') continue;
    top = r.top; break;
  }
  bar.style.bottom = Math.round(gr.bottom - top + 8) + 'px';
}
// sur la carte de voyage du compagnon choisi : quand il est rentré, le gros bouton du fil la remplace
if (typeof renderTripCard === 'function') renderTripCard = (orig => function () {
  const r = orig.apply(this, arguments);
  const t = S.trips[S.sel], box = $('tripCard');
  if (box && t && t.done && tab === 'carte') box.hidden = true;
  renderLive(true);
  return r;
})(renderTripCard);
// ouvrir le journal et amener le choix en attente sous les yeux
function liveOpenJournal(k, focusPending) {
  if (S.sel !== k) { if (typeof selectComp === 'function') selectComp(k); else S.sel = k; }
  openSheet('voyage');
  if (!focusPending) return;
  setTimeout(() => {
    const need = document.querySelector('#panelBody .je .need'); if (!need) return;
    const card = need.closest('.je'); card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    card.classList.add('lvflash'); setTimeout(() => card.classList.remove('lvflash'), 3000);
  }, 60);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-live]'); if (!b) return;
  const k = b.dataset.lk, mode = b.dataset.live;
  if (!S.trips[k]) { renderLive(true); return; }
  if (mode === 'collect') { S.sel = k; S.unseen[k] = 0; collect(); renderLive(true); return; }
  liveOpenJournal(k, mode === 'ask');
});
setInterval(() => { renderLive(false); positionMeter(); }, 400);
addEventListener('resize', () => { liveLayout(); });

// ---------------- « Ce que tu peux trouver là-bas » ----------------
function liveFindHTML(d) {
  let tbl = [];
  try { tbl = typeof lootTable === 'function' ? lootTable(d.tags || ['campagne']) : []; } catch (e) { tbl = []; }
  // les plus probables d'abord, sans doublon de forme d'icône
  const top = tbl.slice().sort((a, b) => b.p - a.p).slice(0, 4);
  const dd = DURS.find(x => x.key === plan.dur) || DURS[0];
  const dur = dd.ms < 3600e3 ? `${Math.round(dd.ms / 60e3)} min` : `${Math.round(dd.ms / 3600e3)} h`;
  return `<div class="canfind"><div class="cfh"><b>Ce que tu peux trouver là-bas</b><span class="cfdur" title="Durée du voyage">${LIVE_CLOCK}${dur} · ${dd.ev} étapes</span></div><div class="cfi">${top.map(x => { const it = { name: x.d[0], cat: x.d[1], sub: x.d[2], rarity: x.d[3], look: x.d[4], color: x.d[5] }; return `<span style="--rc:${RARC[it.rarity]}" title="${esc(it.name)}"><span class="cfic">${itemIcon(it)}</span><em>${esc(it.name)}</em><i>${typeof fmtPct === 'function' ? fmtPct(x.p) : RARITY[it.rarity]}</i></span>`; }).join('')}</div></div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!S.trips[S.sel] && plan.dest && box && !box.querySelector('.canfind')) {
      const anchor = box.querySelector('.dhead, .poihead');
      if (anchor) {
        anchor.insertAdjacentHTML('afterend', liveFindHTML(plan.dest));
        // sur téléphone, la grande carte postale passe sous l'essentiel (nom, butin, durée)
        const hero = box.querySelector('.pc.hero'), cf = box.querySelector('.canfind');
        if (hero && cf && hero.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING) cf.after(hero);
      }
      // l'ancienne rangée « Trésors possibles » ferait doublon : on ne garde que le souvenir unique
      const old = box.querySelector('.loot');
      if (old) { const h = old.previousElementSibling; old.querySelectorAll('.lt:not(.special)').forEach(x => x.remove()); if (!old.children.length) { old.remove(); if (h && h.tagName === 'H3') h.remove(); } else if (h && h.tagName === 'H3') h.textContent = 'Souvenir unique'; }
    }
  } catch (e) { console.error(e); }
  return r;
})(renderVoyage);

// ================= MONDE À COLORIER =================
const VISIT_STEP = 0.01; // environ 1 km : la boulangerie ou le parc du quartier comptent comme un nouveau lieu colorié
const visitKey = (lon, lat) => { const r = v => (Math.round(v / VISIT_STEP) * VISIT_STEP).toFixed(2); return r(lon) + ':' + r(lat); };
function markVisited(lon, lat) {
  if (!S.visited || typeof S.visited !== 'object') S.visited = {};
  if (!isFinite(lon) || !isFinite(lat)) return null;
  const k = visitKey(lon, lat); if (S.visited[k]) return null;
  S.visited[k] = 1; return k;
}
function initVisited() {
  if (!S.visited || typeof S.visited !== 'object') S.visited = {};
  const h = homeObj(); markVisited(h.lon, h.lat);
  // ancienne sauvegarde : les lieux déjà trouvés comptent comme visités
  for (const name of Object.keys(S.found || {})) {
    const p = PLACES.find(x => x.name === name) || (typeof SECRETS !== 'undefined' ? SECRETS.find(x => x.name === name) : null);
    if (p) markVisited(p.lon, p.lat);
  }
  save();
}
try { initVisited(); } catch (e) { console.error(e); }

const LAND_KM2 = 148.9e6, SPOT_KM2 = Math.PI * 3 * 3;
function worldStats() { const n = Object.keys(S.visited || {}).length; return { n, pct: n * SPOT_KM2 / LAND_KM2 * 100 }; }
// paliers du monde colorié : un objectif proche et lisible plutôt qu'un pourcentage minuscule
const WORLD_TIERS = [3, 5, 10, 15, 25, 40, 60, 100, 150, 250, 500, 1000];
function worldTier(n) { const i = WORLD_TIERS.findIndex(t => t > n), next = i < 0 ? 0 : WORLD_TIERS[i], prev = i <= 0 ? (i < 0 ? WORLD_TIERS[WORLD_TIERS.length - 1] : 0) : WORLD_TIERS[i - 1]; return { next, prev, f: next ? (n - prev) / (next - prev) : 1 }; }
function fmtWorldPct(p) {
  if (p >= 10) return Math.round(p) + ' %';
  if (p >= 0.01) return p.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %';
  return p.toLocaleString('fr-FR', { maximumSignificantDigits: 2 }) + ' %';
}
let revealKey = null, revealW = 1, revealQueue = [], revealTab = null, revealBusy = false;
function visitedFC() {
  return { type: 'FeatureCollection', features: Object.keys(S.visited || {}).map(k => { const [lon, lat] = k.split(':').map(Number); return { type: 'Feature', properties: { n: k === revealKey || revealQueue.some(q => q.key === k) ? 1 : 0 }, geometry: { type: 'Point', coordinates: [lon, lat] } }; }) };
}
// voile grisé : une couche « heatmap » dont la couleur à densité nulle couvre tout l'écran,
// et qui devient transparente autour des lieux visités (bords doux, environ 3 km)
const FOG_RAMP = ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(216,216,218,0.82)', 0.2, 'rgba(222,220,216,0.64)', 0.38, 'rgba(255,228,160,0.3)', 0.58, 'rgba(255,240,196,0.1)', 0.75, 'rgba(255,248,230,0)'];
function fogWeight() { return ['case', ['==', ['get', 'n'], 1], revealW, 1]; }
function liveOnMapLoad() {
  if (!map || map.getLayer('fog')) return;
  // maxzoom bas : aux grands zooms, une seule tuile (agrandie) contient tous les lieux proches ; sinon un lieu situé sur une tuile hors écran ne colorie plus les alentours
  map.addSource('visited', { type: 'geojson', data: visitedFC(), maxzoom: 6, buffer: 512 });
  const layers = map.getStyle().layers || [];
  const firstSym = layers.find(l => l.type === 'symbol');
  const before = firstSym ? firstSym.id : (map.getLayer('route-shadow') ? 'route-shadow' : undefined);
  map.addLayer({
    id: 'fog', type: 'heatmap', source: 'visited',
    paint: {
      'heatmap-weight': fogWeight(),
      'heatmap-intensity': 3,
      // noyau d'environ 8,5 km (zone nette ≈ 3 km, bords doux jusqu'à 6 km) ; aux petits zooms, une tache de 18 à 40 px
      'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 1, 18, 4, 26, 8, 40, 16, 40 * 256],
      'heatmap-color': FOG_RAMP,
      'heatmap-opacity': 1,
    },
  }, before);
  renderMeter();
  liveRevealNext();
}
function refreshFog() { if (map && map.getSource && map.getSource('visited')) map.getSource('visited').setData(visitedFC()); }
// compteur discret, à côté des boutons de la carte
// à côté du bouton « monde » ; rien à faire quand les boutons sont cachés (panneau ouvert sur téléphone), sinon le compteur sautait tout en haut
function positionMeter() {
  const m = $('worldMeter'), anchor = $('zWorld') || $('zHome');
  if (!m || !anchor || m.parentNode !== anchor.parentNode || !anchor.offsetHeight || !m.offsetHeight) return;
  const top = Math.round(anchor.offsetTop + anchor.offsetHeight / 2 - m.offsetHeight / 2) + 'px';
  if (m.style.top !== top) m.style.top = top;
}
function renderMeter(flash) {
  let m = $('worldMeter');
  const anchor = $('zWorld') || $('zHome');
  if (!m) {
    if (!anchor) return;
    m = document.createElement('div'); m.id = 'worldMeter'; m.setAttribute('role', 'status'); m.title = 'Chaque lieu visité colorie la carte autour de lui.';
    anchor.parentNode.appendChild(m);
  }
  const { n } = worldStats(), w = worldTier(n);
  m.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 C6.5 3 2.5 7 2.5 12 C2.5 17 6.5 21 11 21 C12.5 21 13 20 12.6 18.8 C12.2 17.5 13 16.5 14.4 16.5 H17 C19.5 16.5 21.5 14.6 21.5 12 C21.5 7 17.5 3 12 3Z" fill="#fff3e2" stroke="#4a3528" stroke-width="1.6"/><circle cx="7.5" cy="11" r="1.8" fill="#e5584f"/><circle cx="10.5" cy="7" r="1.8" fill="#f2c14e"/><circle cx="15" cy="7.2" r="1.8" fill="#5fbf7f"/><circle cx="17.6" cy="11" r="1.8" fill="#4f97c4"/></svg><span><b>${n} lieu${n > 1 ? 'x' : ''} colorié${n > 1 ? 's' : ''}</b><em class="wmbar"><i style="width:${(w.f * 100).toFixed(0)}%"></i></em><small>${w.next ? `Prochain palier : ${w.next} lieux` : 'Le monde est en couleurs !'}</small></span>`;
  positionMeter();
  if (flash) { m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); }
}
document.addEventListener('click', ev => { if (ev.target.closest('#worldMeter')) { if (map) map.flyTo({ center: [10, 30], zoom: 1.8, speed: 1.4 }); renderMeter(true); } });

// au retour d'un voyage : la destination se colore
GAME.on('trip:return', d => {
  const dest = d && d.dest; if (!dest) return;
  const key = markVisited(dest.lon, dest.lat); save();
  renderLive(true);
  if (!key) { renderMeter(); return; }
  revealQueue.push({ key, lon: dest.lon, lat: dest.lat, name: dest.name, poi: !!dest.poi });
  revealTab = typeof tab !== 'undefined' ? tab : null;
  refreshFog();
  liveRevealNext();
});
// on attend que la fenêtre du butin soit fermée, puis on vole jusqu'au lieu et on le colore
function liveRevealNext() {
  if (revealBusy || !revealQueue.length || !map || !map.getLayer || !map.getLayer('fog')) return;
  const modal = $('modal');
  if ((modal && !modal.hidden) || (typeof tab !== 'undefined' && tab !== 'carte' && tab !== revealTab)) { setTimeout(liveRevealNext, 500); return; }
  if (typeof tab !== 'undefined' && tab !== 'carte' && tab === revealTab && typeof closeSheet === 'function') closeSheet();
  revealBusy = true;
  const q = revealQueue[0]; revealKey = q.key; revealW = 0;
  map.setPaintProperty('fog', 'heatmap-weight', fogWeight()); refreshFog();
  const z = mapMode === 'tiles' ? 11 : 10;
  const go = () => {
    const reduce = typeof reduceMotion === 'function' && reduceMotion();
    revealFX(q);
    const t0 = performance.now(), D = reduce ? 1 : 1700;
    const step = now => {
      const x = Math.min(1, (now - t0) / D); revealW = 1 - Math.pow(1 - x, 3);
      try { map.setPaintProperty('fog', 'heatmap-weight', fogWeight()); } catch (e) {}
      if (x < 1) requestAnimationFrame(step);
      else { revealQueue.shift(); revealKey = null; revealW = 1; refreshFog(); map.setPaintProperty('fog', 'heatmap-weight', fogWeight()); renderMeter(true); { const n = worldStats().n; if (WORLD_TIERS.includes(n) && typeof toast === 'function') toast(`Palier atteint : ${n} lieux coloriés sur la carte du monde !`); } revealBusy = false; setTimeout(liveRevealNext, 600); }
    };
    requestAnimationFrame(step);
  };
  // lieu déjà à l'écran (souvent un lieu du quartier) : on reste où on est ; sinon on y vole (sans trop dézoomer pour un lieu du quartier)
  const far = !map.getBounds().contains([q.lon, q.lat]) || (!q.poi && Math.abs(map.getZoom() - z) > 1.5);
  if (far) { map.flyTo({ center: [q.lon, q.lat], zoom: q.poi ? Math.max(map.getZoom(), 13) : z, speed: 1.5, curve: 1.3, essential: true }); map.once('moveend', () => setTimeout(go, 150)); }
  else go();
}
function revealFX(q) {
  const ov = $('ov'); if (!ov || !map) return;
  const el = document.createElement('div'); el.className = 'ovm reveal';
  const cols = ['#f6c445', '#5fbf7f', '#f08aa6', '#4f97c4', '#e0884a', '#b77fd1'];
  let sp = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 70 + (i % 3) * 18; sp += `<s style="--sc:${cols[i % cols.length]};--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r).toFixed(0)}px;--dl:${(0.1 + (i % 4) * 0.06).toFixed(2)}s"></s>`; }
  const { n, pct } = worldStats();
  el.innerHTML = `<i></i><i></i>${sp}<b>${esc(q.name)} se colore ! · ${n} lieux</b>`;
  ov.appendChild(el);
  const place = () => { const p = map.project([q.lon, q.lat]); el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`; };
  place(); map.on('move', place);
  setTimeout(() => { map.off('move', place); el.remove(); }, 3600);
}
// la maison compte aussi comme lieu visité
{ const hs = $('homeSel'); if (hs) hs.addEventListener('change', () => { if (markVisited(homeObj().lon, homeObj().lat)) { save(); refreshFog(); renderMeter(true); } }); }
addEventListener('resize', () => renderMeter());
window.__live = { renderLive, renderMeter, liveState, markVisited, worldStats, refreshFog, visitKey, revealQueue };

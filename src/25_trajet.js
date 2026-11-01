// ================= TRAJET + SÉJOUR (v14) =================
// Retour du joueur : « si on s'éloigne, je veux un temps proportionnel ».
// Durée d'un voyage = trajet aller-retour (selon la distance, tripRoundMs dans 09_logic_b.js) + séjour sur place (niveau DURS).
// Ce module ne fait que l'affichage : panneau de voyage (renderVoyage enveloppée), encart « Ce que tu peux trouver »
// (liveFindHTML enveloppée) et libellés de phase (Aller / Sur place / Retour) des barres de progression.

// « 2 h », « 2 h 30 », « 45 min », « 1 min 30 », « 40 s »
function trjLen(ms) {
  ms = Math.max(0, ms || 0);
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  if (s < 600) { const m = Math.floor(s / 60), r = Math.round((s % 60) / 5) * 5; return r ? `${m} min ${String(r).padStart(2, '0')}` : `${m} min`; }
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm ? `${h} h ${String(mm).padStart(2, '0')}` : `${h} h`;
}
// « vers 19 h 40 », « demain vers 8 h 05 »
function trjClock(ts) {
  const d = new Date(ts), now = new Date();
  const day = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  const hm = `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
  return day <= 0 ? `vers ${hm}` : day === 1 ? `demain vers ${hm}` : `dans ${day} jours, vers ${hm}`;
}
function trjDur(key) { return DURS.find(x => x.key === key) || DURS[0]; }
function trjPlanInfo(dest, key) {
  const km = kmExact(homeObj(), dest), road = tripRoundMs(km), dd = trjDur(key), total = road + dd.ms;
  return { km, road, stay: dd.ms, total, dd, back: Date.now() + total };
}
const TRJ_ICO = {
  road: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 12.5 C5 12.5 4 3.5 8 3.5 S11 12.5 14 12.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.2 2.4"/><circle cx="2" cy="12.5" r="1.6" fill="currentColor"/><circle cx="14" cy="12.5" r="1.6" fill="currentColor"/></svg>',
  stay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 C5.2 1.8 3.4 4 3.4 6.4 C3.4 9.6 8 14.2 8 14.2 S12.6 9.6 12.6 6.4 C12.6 4 10.8 1.8 8 1.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8" cy="6.4" r="1.8" fill="currentColor"/></svg>',
  home: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8 L8 3 L13.5 8 M4.2 6.8 V13 H11.8 V6.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
function trjLineHTML(parts) {
  return `<div class="trjline">${parts.map(([ic, k, v]) => `<span class="trjp"><i>${TRJ_ICO[ic]}</i><span>${k}<b>${v}</b></span></span>`).join('')}</div>`;
}
(function trjStyle() {
  if (document.getElementById('trjStyle')) return;
  const st = document.createElement('style'); st.id = 'trjStyle';
  st.textContent = `.trjline{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:8px 0 4px;padding:8px 12px;background:#fff8ec;border:1px solid var(--line,#e7dccb);border-radius:12px;font-size:13px;color:var(--muted,#7b6a5c)}
.trjp{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.trjp i{display:inline-flex;width:16px;height:16px;color:var(--teal,#3f9c95)}.trjp i svg{width:16px;height:16px}
.trjp b{color:var(--ink,#4a3528);font-weight:700;margin-left:4px}
.dur .durtot{font-size:12px;color:var(--ink,#4a3528);font-weight:600}
.bar .mid2{position:absolute;top:0;bottom:0;width:2px;background:#fff}
.bar .stayzone{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.45) 0 4px,transparent 4px 8px);pointer-events:none}`;
  document.head.appendChild(st);
})();

// ---------------- panneau de voyage ----------------
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try { trjDecorate(box); } catch (e) { console.error(e); }
  return r;
})(renderVoyage);
function trjDecorate(box) {
  if (!box) return;
  const t = S.trips[S.sel];
  if (!t && plan.dest) {
    const info = trjPlanInfo(plan.dest, plan.dur);
    const anchor = box.querySelector('.dhead, .poihead');
    if (anchor && !box.querySelector('.trjline')) anchor.insertAdjacentHTML('afterend', trjLineHTML([
      ['road', 'Trajet aller-retour :', trjLen(info.road)],
      ['stay', 'Séjour :', info.stay ? trjLen(info.stay) : 'aucun'],
      ['home', 'Retour ', trjClock(info.back)],
    ]));
    box.querySelectorAll('.durs').forEach(g => {
      const h = g.previousElementSibling; if (h && h.tagName === 'H3') h.textContent = 'Temps passé sur place';
      g.querySelectorAll('.dur[data-dur]').forEach(b => {
        const dd = trjDur(b.dataset.dur), tot = info.road + dd.ms;
        b.innerHTML = `<b>${esc(dd.label)}</b><span>${dd.ms ? `+ ${trjLen(dd.ms)} sur place` : 'Sans s’arrêter'}</span><span class="durtot">Total ${trjLen(tot)}</span><em>${'★'.repeat(Math.round(dd.luck) + 1)}</em>`;
        b.title = `${dd.ev} étapes · trajet ${trjLen(info.road)} + séjour ${dd.ms ? trjLen(dd.ms) : '0 min'}`;
      });
    });
    const gs = box.querySelector('.gobar > div > span');
    if (gs) gs.textContent = `${info.dd.ev} étapes · ${trjLen(info.total)} au total`;
    return;
  }
  if (t && !t.done && t.out > 0) {
    const prog = box.querySelector('.prog');
    if (prog && !box.querySelector('.trjline')) prog.insertAdjacentHTML('afterend', trjLineHTML([
      ['road', 'Trajet aller-retour :', trjLen(2 * t.out)],
      ['stay', 'Séjour :', t.stay ? trjLen(t.stay) : 'aucun'],
      ['home', 'Retour ', trjClock(Date.now() + (t.total - t.elapsed) / (typeof fast !== 'undefined' && fast ? 30 : 1))],
    ]));
    trjFixBars();
  }
}

// ---------------- « Ce que tu peux trouver là-bas » (16_live.js) : durée totale ----------------
if (typeof liveFindHTML === 'function') liveFindHTML = (orig => function (d) {
  let h = orig.apply(this, arguments);
  try {
    const info = trjPlanInfo(d, plan.dur), clock = typeof LIVE_CLOCK !== 'undefined' ? LIVE_CLOCK : '';
    h = h.replace(/<span class="cfdur"[^>]*>[\s\S]*?<\/svg>[^<]*<\/span>/, `<span class="cfdur" title="Trajet aller-retour ${trjLen(info.road)} + séjour ${info.stay ? trjLen(info.stay) : '0 min'}">${clock}${trjLen(info.total)} · ${info.dd.ev} étapes</span>`);
  } catch (e) { console.error(e); }
  return h;
})(liveFindHTML);

// ---------------- barres de progression : Aller / Sur place / Retour ----------------
// 10_ui.js et 20_collection.js écrivent « Aller » avant 50 % et « Retour » après : avec un séjour, ce n'est plus vrai.
// On corrige le texte juste après leur mise à jour (MutationObserver : avant l'affichage, sans clignotement).
const TRJ_SHORT = { aller: 'Aller', sejour: 'Sur place', retour: 'Retour' };
function trjTripOf(el) {
  const host = el.closest('[data-k]');
  const k = host && host.dataset.k && S.trips[host.dataset.k] ? host.dataset.k : S.sel;
  return S.trips[k] ? S.trips[k] : null;
}
function trjSetText(el, txt) { if (el && el.textContent !== txt) el.textContent = txt; }
function trjMarks(bar, t) {
  if (!bar) return;
  const { fa, fb } = tripPhases(t);
  const mid = bar.querySelector('.mid'); if (mid && mid.style.left !== (fa * 100).toFixed(2) + '%') mid.style.left = (fa * 100).toFixed(2) + '%';
  let z = bar.querySelector('.stayzone');
  if (fb - fa > 0.005) {
    if (!z) { z = document.createElement('span'); z.className = 'stayzone'; bar.appendChild(z); const m2 = document.createElement('span'); m2.className = 'mid2'; bar.appendChild(m2); }
    const L = (fa * 100).toFixed(2) + '%', W = ((fb - fa) * 100).toFixed(2) + '%';
    if (z.style.left !== L) { z.style.left = L; z.style.width = W; const m2 = bar.querySelector('.mid2'); if (m2) m2.style.left = (fb * 100).toFixed(2) + '%'; }
  }
}
let trjBusy = false;
function trjFixBars() {
  if (trjBusy || typeof S === 'undefined' || !S.trips) return;
  trjBusy = true;
  try {
    const ph = document.getElementById('phase'), ts = S.trips[S.sel];
    if (ph && ts && !ts.done && ts.out > 0) {
      const p = tripPhase(ts);
      trjSetText(ph, p === 'aller' ? 'À l’aller' : p === 'sejour' ? `Sur place à ${ts.dest.name}` : 'Sur le chemin du retour');
      const pb = document.getElementById('pbar'); if (pb) trjMarks(pb.parentElement, ts);
    }
    document.querySelectorAll('[id="ptime2"]').forEach(el => {
      const t = trjTripOf(el); if (!t || t.done || !(t.out > 0)) return;
      const m = /^(Aller|Retour|Sur place) · (.*)$/.exec(el.textContent); if (!m) return;
      trjSetText(el, `${TRJ_SHORT[tripPhase(t)]} · ${m[2]}`);
      const pb = el.parentElement && el.parentElement.querySelector('#pbar2');
      if (pb && pb.parentElement.classList.contains('bar')) trjMarks(pb.parentElement, t);
    });
  } catch (e) { console.error(e); }
  trjBusy = false;
}
try {
  const trjObs = new MutationObserver(() => trjFixBars());
  const startObs = () => { trjObs.observe(document.body, { childList: true, subtree: true, characterData: true }); trjFixBars(); };
  if (document.body) startObs(); else addEventListener('DOMContentLoaded', startObs);
} catch (e) { console.error(e); }

// ---------------- v19 : « Qui part ? » ----------------
// Retour du joueur : « si on veut aller à un endroit, on ne nous demande pas de sélectionner le familier ».
// Toucher un lieu choisit un compagnon libre (celui qui est sélectionné s'il est libre, sinon le premier libre),
// et le panneau de départ montre en haut les compagnons disponibles : un toucher change le voyageur.
const trjTeam = () => (typeof hudTeam === 'function' ? hudTeam() : Object.keys(S.comps || {})).filter(k => CHARS[k] && S.prog[k]);
const trjFree = () => trjTeam().filter(k => !S.trips[k]);
let trjAllAway = false;
function trjPickFree() {
  if (!S.trips[S.sel]) { trjAllAway = false; return true; }
  const f = trjFree()[0];
  if (!f) { trjAllAway = true; return false; }
  trjAllAway = false; S.sel = f; S.unseen[f] = 0; fast = false; save();
  try { renderComps(); } catch (e) {}
  return true;
}
let trjMute = false;
const trjGoWrap = orig => function () {
  let ok = true; try { ok = trjPickFree(); } catch (e) { console.error(e); }
  if (ok) return orig.apply(this, arguments);
  trjMute = true; // tout le monde est en voyage : le panneau l'explique, pas de bulle « choisissez un autre compagnon »
  try { return orig.apply(this, arguments); } finally { trjMute = false; }
};
if (typeof toast === 'function') toast = (orig => function (msg) { if (trjMute && /déjà en voyage/.test(String(msg))) return; return orig.apply(this, arguments); })(toast);
if (typeof choosePlace === 'function') choosePlace = trjGoWrap(choosePlace);
if (typeof choosePOI === 'function') choosePOI = trjGoWrap(choosePOI);
if (typeof goToPlace === 'function') goToPlace = trjGoWrap(goToPlace);
if (typeof pickPoint === 'function') pickPoint = trjGoWrap(pickPoint);
// avGoPlace (29_aventure.js) : déclaration de fonction, donc déjà connue ici (tout le jeu est assemblé dans une seule fonction)
if (typeof avGoPlace === 'function') avGoPlace = trjGoWrap(avGoPlace);
if (typeof regionGo === 'function') regionGo = trjGoWrap(regionGo);
// fiche de région : « Y aller » propose un compagnon libre au lieu d'un bouton grisé
if (typeof rgDetail === 'function') rgDetail = (orig => function (R) {
  let h = orig.apply(this, arguments);
  try { const f = S.trips[S.sel] && trjFree()[0]; if (f) h = h.replace(/<button class="btn green big wide" data-rggo="([^"]+)" disabled>[^<]*<\/button>/, (m, id) => `<button class="btn green big wide" data-rggo="${id}">Y aller avec ${esc(CHARS[f].name)}</button>`); } catch (e) {}
  return h;
})(rgDetail);
if (typeof closeSheet === 'function') closeSheet = (orig => function () { trjAllAway = false; return orig.apply(this, arguments); })(closeSheet);
function trjWhoHTML() {
  const free = trjFree(), away = trjTeam().length - free.length;
  if (!free.length) return '';
  return `<div class="trjwho"><span class="trjwk">Qui part ?</span><div class="trjwl" role="radiogroup" aria-label="Qui part en voyage ?">${free.map(k => `<button class="trjwb${k === S.sel ? ' on' : ''}" data-trjwho="${k}" role="radio" aria-checked="${k === S.sel}" style="--tint:${typeof spTint === 'function' ? spTint(k) : '#fff3dc'}"><img src="${portraitURI(k, k === S.sel ? 'rire' : 'content')}" alt=""><b>${esc(CHARS[k].name)}</b></button>`).join('')}</div>${away ? `<span class="trjwa">${away} en voyage</span>` : ''}</div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (!box) return r;
    if (!S.trips[S.sel]) { trjAllAway = false; if (!box.querySelector('.trjwho')) box.insertAdjacentHTML('afterbegin', trjWhoHTML()); }
    else if (trjAllAway && !trjFree().length && !box.querySelector('.trjaway')) box.insertAdjacentHTML('afterbegin', `<div class="trjaway"><b>Tous vos compagnons sont en voyage.</b><span>Ce lieu attendra : dès que l’un d’eux rentre, touchez-le à nouveau pour l’y envoyer.</span></div>`);
  } catch (e) { console.error(e); }
  return r;
})(renderVoyage);
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-trjwho]'); if (!b) return;
  const k = b.dataset.trjwho; if (!S.comps[k] || S.trips[k] || k === S.sel) return;
  S.sel = k; S.unseen[k] = 0; fast = false; save(); renderAll();
  const nb = document.querySelector(`.trjwb[data-trjwho="${k}"]`);
  if (nb && nb.animate && !(typeof reduceMotion === 'function' && reduceMotion())) nb.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12) translateY(-3px)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
});
(function trjWhoCSS() {
  const st = document.createElement('style'); st.id = 'trjWhoCSS';
  st.textContent = `.trjwho{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin:0 0 10px;padding:8px 10px;background:#fff8ec;border:2.5px solid var(--ink,#4a3528);border-radius:16px;box-shadow:0 3px 0 rgba(74,53,40,.25)}
.trjwk{font:800 15px var(--display);color:var(--ink,#4a3528)}
.trjwl{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}
.trjwb{display:flex;align-items:center;gap:5px;background:#fff;border:2.5px solid var(--line,#e7dccb);border-radius:999px;padding:2px 10px 2px 2px;cursor:pointer;color:var(--ink,#4a3528);transition:transform .15s}
.trjwb img{width:34px;height:34px;border-radius:50%;background:var(--tint);border:2px solid var(--ink,#4a3528);box-sizing:border-box}
.trjwb b{font:800 13.5px var(--display)}
.trjwb.on{background:var(--tint);border-color:var(--ink,#4a3528);box-shadow:0 2px 0 var(--ink,#4a3528)}
.trjwb:not(.on){opacity:.85}.trjwb:active{transform:scale(.95)}
.trjwa{font:700 11.5px var(--display);color:var(--muted,#7b6a5c)}
.trjaway{display:flex;flex-direction:column;gap:2px;margin:0 0 10px;padding:9px 12px;background:#fff3c4;border:2.5px dashed #d99a1e;border-radius:14px;font-size:13.5px}
.trjaway b{font:800 15px var(--display)}`;
  document.head.appendChild(st);
})();

// pour les tests et le tutoriel
window.__trajet = { tripRoundMs, tripPlanMs, tripPhases, tripPhase, tripPos, trjLen, trjPlanInfo, homeObj, kmBetween, DURS, PLACES,
  get S() { return S; }, get plan() { return plan; }, startTrip: () => startTrip(), tick: dt => tick(dt),
  openSheet: (...a) => openSheet(...a), renderPanel: () => renderPanel(), closeSheet: () => (typeof closeSheet === 'function' ? closeSheet() : null) };

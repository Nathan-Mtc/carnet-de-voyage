// ================= 97 · LE CARNET D'AUGUSTINE : UN VRAI CARNET DE VOYAGE (v95) =================
// Le joueur (19/11) : « graphiquement l'histoire d'Augustine est mal dessinée, on dirait une carte postale ».
// Choix du joueur : « Vrai carnet de voyage » ; Augustine reste un mystère (on ne la voit jamais).
// Chaque page : papier jauni, ruban adhésif, lieu et date à la main, texte manuscrit (Caveat), un croquis à l'aquarelle,
// un timbre et un tampon de la région, la signature. La page s'ouvre comme on tourne une page.
const kc$ = (f, d) => { try { return f(); } catch (e) { return d; } };
// ---------- les croquis (aquarelle + crayon) ----------
const KC_W = '<filter id="kcW" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="7"/><feGaussianBlur stdDeviation=".7"/></filter><filter id="kcP"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="2"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter>';
const kcA = (d, c, o) => `<path d="${d}" fill="${c}" opacity="${o || 0.55}" filter="url(#kcW)"/>`;           // lavis
const kcL = (d, w) => `<path d="${d}" fill="none" stroke="#5a4434" stroke-width="${w || 1.5}" stroke-linecap="round" stroke-linejoin="round" filter="url(#kcP)"/>`; // trait
const KC_SK = {
  grenier: () => kcA('M10 92 L80 22 L150 92Z', '#e9c08a') + kcA('M58 55h44v30H58z', '#9fc6e4', .6) + kcA('M30 78h34v14H30z', '#b07a4c', .65) + kcA('M104 70a10 13 0 1 0 20 0a10 13 0 1 0 -20 0', '#f4ede0', .9)
    + kcL('M10 92 L80 22 L150 92') + kcL('M58 55h44v30H58z M80 55v30 M58 70h44') + kcL('M30 78h34v14H30z M30 84h34') + kcL('M104 70a10 13 0 1 0 20 0a10 13 0 1 0 -20 0') + kcL('M110 64l2 3 M118 66l-2 3', 1.1),
  pays: () => kcA('M0 70 Q40 40 80 62 T160 52 V100H0Z', '#a8cf8e') + kcA('M0 84 Q50 64 100 80 T160 74 V100H0Z', '#7fb36a', .6) + kcA('M118 22a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', '#f6cf6a', .8) + kcA('M30 62h18v14H30z', '#f0d9b5', .8) + kcA('M28 62 L39 52 L50 62Z', '#d9765a', .7)
    + kcL('M0 70 Q40 40 80 62 T160 52') + kcL('M0 84 Q50 64 100 80 T160 74') + kcL('M30 62h18v14H30z M28 62 L39 52 L50 62') + kcL('M70 74 q6 -10 12 0 M96 66 q5 -8 10 0', 1.1),
  tente: () => kcA('M20 88 L70 26 L120 88Z', '#e8a35f') + kcA('M62 88 L70 50 L78 88Z', '#5a4434', .5) + kcA('M120 88 q10 -14 20 0Z', '#d9765a', .6) + kcA('M0 90h160v10H0z', '#a8cf8e', .5)
    + kcL('M20 88 L70 26 L120 88 M62 88 L70 50 L78 88 M70 26 L70 18') + kcL('M118 88 l8 -6 l8 6 l-8 -3z M126 82 v-8', 1.1) + kcL('M126 74 q-4 -8 0 -12 q4 4 0 12', 1),
  oeuf: () => kcA('M20 86 Q80 64 140 86 Q80 100 20 86Z', '#c9a36a', .6) + kcA('M60 74a20 26 0 1 0 40 0a20 26 0 1 0 -40 0', '#f6efe0', .95) + kcA('M66 66a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M86 80a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', '#e6a6b7', .7)
    + kcL('M20 86 Q80 64 140 86 Q80 100 20 86') + kcL('M60 74a20 26 0 1 0 40 0a20 26 0 1 0 -40 0') + kcL('M30 84 l10 -4 M120 84 l-10 -4 M50 90 l8 -2', 1),
  habitant: () => kcA('M40 92V40 q40 -30 80 0 V92Z', '#e7d2a6') + kcA('M66 92V58 h28 V92Z', '#9a6a46', .7) + kcA('M104 40 h14 v16 h-14z', '#f6cf6a', .8) + kcA('M18 92 q8 -30 16 0Z', '#7fb36a', .6)
    + kcL('M40 92V40 q40 -30 80 0 V92 M66 92V58 h28 V92 M88 76 v2 M104 40 h14 v16 h-14z M111 40 v-6') + kcL('M18 92 q8 -30 16 0 M26 92 v-20', 1.1),
  atelier: () => kcA('M30 70 h80 v10 h-80z', '#8f9cb3', .7) + kcA('M50 80 h40 v16 h-40z', '#6f7a8c', .6) + kcA('M118 30 l14 14 l-30 30 l-14 -14z', '#b07a4c', .55) + kcA('M126 22 l14 14 l-8 8 l-14 -14z', '#8f9cb3', .7) + kcA('M14 88 q6 -16 12 0', '#f2a33a', .7)
    + kcL('M30 70 h80 v10 h-80z M20 70 q10 -6 10 0 M50 80 h40 v16 h-40z') + kcL('M118 30 l14 14 l-30 30 l-14 -14z M126 22 l14 14 l-8 8 l-14 -14z') + kcL('M14 88 q6 -16 12 0 M18 86 q2 -6 4 0', 1),
  montagne: () => kcA('M0 92 L46 30 L72 62 L100 20 L160 92Z', '#a9b7c9') + kcA('M88 38 L100 20 L112 38 L104 34 L98 40Z M38 42 L46 30 L54 42 L48 40Z', '#ffffff', .9) + kcA('M0 92 Q80 76 160 92 V100H0Z', '#7fb36a', .5)
    + kcL('M0 92 L46 30 L72 62 L100 20 L160 92') + kcL('M88 38 L98 40 L104 34 L112 38 M38 42 L48 40 L54 42', 1.1) + kcL('M120 30 q4 -4 8 0 q4 -4 8 0', 1),
  mer: () => kcA('M0 56 h160 v44 H0z', '#8cc5e0') + kcA('M118 20a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', '#f6cf6a', .8) + kcA('M40 52 L56 20 L56 52Z', '#f4ede0', .9) + kcA('M30 52 h36 l-6 8 h-24z', '#b07a4c', .7)
    + kcL('M0 56 h160') + kcL('M40 52 L56 20 L56 52 M30 52 h36 l-6 8 h-24z') + kcL('M10 70 q8 -5 16 0 q8 5 16 0 M80 80 q8 -5 16 0 q8 5 16 0 M110 66 q6 -4 12 0', 1.1),
  foret: () => kcA('M30 92 L46 34 L62 92Z M70 92 L90 22 L110 92Z M110 92 L124 44 L138 92Z', '#7fb36a', .6) + kcA('M0 92 h160 v8 H0z', '#b07a4c', .4) + kcA('M78 92 q12 -10 24 0Z', '#e6a6b7', .5)
    + kcL('M30 92 L46 34 L62 92 M70 92 L90 22 L110 92 M110 92 L124 44 L138 92') + kcL('M46 92 v6 M90 92 v6 M124 92 v6', 1.1),
  ville: () => kcA('M14 92 V52 h28 V92Z M46 92 V36 h26 V92Z M76 92 V58 h30 V92Z M110 92 V44 h34 V92Z', '#e9c08a', .6) + kcA('M44 36 L59 22 L74 36Z M108 44 L127 30 L146 44Z', '#d9765a', .7) + kcA('M20 60h6v6h-6z M52 46h6v6h-6z M84 66h6v6h-6z M118 54h6v6h-6z', '#9fc6e4', .8)
    + kcL('M14 92 V52 h28 V92 M46 92 V36 h26 V92 M76 92 V58 h30 V92 M110 92 V44 h34 V92 M44 36 L59 22 L74 36 M108 44 L127 30 L146 44') + kcL('M0 92 h160', 1.1),
};
function kcSketch(kind) { const f = KC_SK[kind] || KC_SK.pays; return `<svg class="kc-sk" viewBox="0 0 160 100" aria-hidden="true"><defs>${KC_W}</defs>${f()}</svg>`; }
// le croquis d'une région, d'après sa description
function kcKindOf(id) {
  const R = RG[id] || {}, t = ((R.mood || '') + ' ' + (R.name || '')).toLowerCase();
  if (/sommet|montagn|alpe|pyrén|glacier|massif|neige/.test(t)) return 'montagne';
  if (/mer|côte|plage|île|océan|port|lagon|falaise/.test(t)) return 'mer';
  if (/forêt|bois|jungle|taïga/.test(t)) return 'foret';
  if (/ville|ruelle|capitale|métro|gratte|boulevard/.test(t)) return 'ville';
  return 'pays';
}
// ---------- la page ----------
const KC_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function kcDate(seed) { const h = kc$(() => hashStr(String(seed)), 7); const u = Math.abs(h) >>> 0; return `le ${1 + u % 28} ${KC_MOIS[(u >>> 5) % 12]}`; }
function kcPageHTML(o) {
  // o : { kick, title, place, regId, kind, txt, extra, btn, seed }
  const R = RG[o.regId] || null, nm = R ? R.short : (o.place || '');
  return `<div class="kc-page${kc$(() => matchMedia('(prefers-reduced-motion: reduce)').matches, false) ? '' : ' turn'}">
<span class="kc-tape" aria-hidden="true"></span>
<p class="kc-k">${esc(o.kick)}</p>
<p class="kc-where">${esc(o.place || nm)}, ${kcDate(o.seed || o.title)}</p>
<h2 class="kc-h">${esc(o.title)}</h2>
<div class="kc-art">${kcSketch(o.kind)}<span class="kc-stamp" aria-hidden="true">${nm ? `<b>${esc(nm)}</b>` : ''}<i>✦ A. ✦</i></span><span class="kc-timbre" aria-hidden="true">${kcSketch(o.kind)}</span></div>
<p class="kc-txt">${esc(o.txt)}</p>
<p class="kc-sig">— Augustine</p>
${o.extra || ''}${o.btn}</div>`;
}
const KC_CH = { 1: 'grenier', 2: 'pays', 3: 'tente', 4: 'oeuf', 5: 'habitant', 6: 'atelier', 7: 'montagne' };
akPage = function (n) {
  const s = akSt(), C = akChap(n); s.read[n] = 1; if (s.newPage === n || s.newPage === n - 1) s.newPage = 0; kc$(save);
  const reg = C.reg || kc$(() => rgHome().id, null);
  const kind = KC_CH[n] || (C.reg ? kcKindOf(C.reg) : 'pays');
  kc$(() => showModal(kcPageHTML({ kick: `Le carnet d’Augustine · Page ${n}`, title: C.nm, regId: reg, kind, txt: C.page, seed: 'p' + n, btn: '<button class="btn green big wide" data-closemodal="1">Fermer le carnet</button>' })));
  kc$(() => renderTripCard()); kc$(() => cmGoal());
};
// la page d'un camp (95) dans le même style
if (typeof augCampPage === 'function') augCampPage = function (id) {
  const R = RG[id], c = augCamps()[id]; if (!R || !c) return;
  const N = augNext(id), sp = c.sp;
  const txt = `J’ai planté ma tente près de ${c.name}. ${R.mood || ''} ${sp ? `C’est ${c.spWhere === id ? 'ici' : `en ${RG[c.spWhere].short}`} que j’ai appris à attirer ${augPlural(sp)} : je te laisse ma recette.` : ''} ${N ? `De là, j’ai pris la route, direction ${RG[N.id].short}, ${N.how}.` : 'Le monde continue, et moi aussi.'}`.replace(/\s+/g, ' ').trim();
  const gains = [`<li><span>⛺</span><div><b>Camp de base</b><small>Vos compagnons partent d’ici quand c’est plus près que la maison : trajets bien plus courts dans le coin.</small></div></li>`];
  if (sp) gains.push(`<li><span>🪤</span><div><b>Recette : « ${esc(augBaitNm(sp))} »</b><small>À l’Herboristerie. Emportée en voyage, elle attire ${esc(augPlural(sp))}${c.spWhere ? ` (${esc(RG[c.spWhere].short)})` : ''}.</small></div></li>`);
  if (N) gains.push(`<li><span>🧭</span><div><b>La suite : ${esc(RG[N.id].short)}</b><small>${N.how === 'par la route' ? 'Elle s’ouvrira quand vous serez Habitué de la région.' : 'Un habitant près du passage vous expliquera comment le franchir.'}</small></div></li>`);
  kc$(() => showModal(kcPageHTML({ kick: `Le carnet d’Augustine · Le camp de ${R.short}`, title: 'Mon camp', place: c.name, regId: id, kind: 'tente', txt, seed: 'camp' + id,
    extra: `<p class="kc-note">Glissé entre les pages, vous trouvez :</p><ul class="cn-steps aug-gain kc-gain">${gains.join('')}</ul>`, btn: '<button class="btn green big wide" data-closemodal="1">Merci, Augustine</button>' })));
  kc$(() => confetti(true)); kc$(() => drawMarks()); kc$(() => renderTripCard()); kc$(() => cmGoal());
};

{
  const css = document.createElement('style');
  css.textContent = `
.kc-page{position:relative;margin:-4px -4px 0;padding:22px 18px 14px;border-radius:6px 14px 14px 6px;text-align:left;color:#4a3528;
 background:radial-gradient(120% 80% at 10% 0%,rgba(255,255,255,.55),transparent 60%),radial-gradient(90% 60% at 100% 100%,rgba(201,163,106,.25),transparent 70%),repeating-linear-gradient(#f8efdc 0 29px,#e8d6b4 29px 30px);
 box-shadow:inset 10px 0 14px -10px rgba(120,88,52,.45),inset 0 0 0 1px rgba(120,88,52,.18)}
.kc-page.turn{animation:kcTurn .55s cubic-bezier(.2,.8,.2,1) both;transform-origin:left center}
@keyframes kcTurn{0%{transform:perspective(900px) rotateY(-70deg);opacity:0}100%{transform:none;opacity:1}}
.kc-tape{position:absolute;top:-8px;left:50%;width:90px;height:22px;transform:translateX(-50%) rotate(-3deg);background:rgba(242,193,78,.55);box-shadow:0 1px 2px rgba(0,0,0,.12);border-left:2px dashed rgba(255,255,255,.5);border-right:2px dashed rgba(255,255,255,.5)}
.kc-k{margin:0;font:800 10.5px var(--display,system-ui);letter-spacing:.08em;text-transform:uppercase;color:#a5784f}
.kc-where{margin:2px 0 0;font:700 19px 'Caveat',cursive;color:#7a5238}
.kc-h{margin:0 0 6px;font:700 30px/1 'Caveat',cursive;color:#3d2a1e}
.kc-art{position:relative;margin:4px 0 6px;padding:6px 6px 2px;background:#fffaf0;border-radius:4px;box-shadow:0 2px 6px rgba(74,53,40,.18);transform:rotate(-1.2deg);width:78%}
.kc-sk{display:block;width:100%;height:auto}
.kc-stamp{position:absolute;right:-26%;bottom:-6px;width:74px;height:74px;border-radius:50%;border:3px double rgba(181,68,58,.75);color:rgba(181,68,58,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-14deg);font:800 11px var(--display,system-ui);text-transform:uppercase;letter-spacing:.04em;text-align:center;line-height:1.05;mix-blend-mode:multiply}
.kc-stamp b{max-width:64px;font-size:9.5px;white-space:normal;word-break:break-word}.kc-stamp i{font-style:normal;font-size:9px;margin-top:3px}
.kc-timbre{position:absolute;right:-24%;top:-12px;width:52px;padding:4px;background:#fff;transform:rotate(6deg);box-shadow:0 1px 3px rgba(0,0,0,.2);
 -webkit-mask:radial-gradient(circle 3px at 3px 3px,transparent 2.5px,#000 3px) -3px -3px/8px 8px;mask:radial-gradient(circle 3px at 3px 3px,transparent 2.5px,#000 3px) -3px -3px/8px 8px}
.kc-timbre .kc-sk{background:#e9f2f7}
.kc-txt{margin:6px 0 2px;font:500 22px/30px 'Caveat',cursive;color:#3d2a1e}
.kc-sig{margin:0 0 10px;text-align:right;font:700 24px 'Caveat',cursive;color:#7a5238}
.kc-note{margin:0 0 4px;font:700 18px 'Caveat',cursive;color:#7a5238}
.kc-gain li{background:rgba(255,250,240,.85)!important}
`;
  document.head.appendChild(css);
}

// ================= BOUCLE DE JEU : cadeau quotidien, événement du jour, paliers, succès, effets =================
// Chargé en dernier. Ne modifie pas les autres fichiers : il enveloppe quelques fonctions globales
// (renderQuests, renderNav, renderVoyage, renderGoal, maybeIntro) et ajoute ses propres éléments d'interface.
(function injectJeuCSS() {
  const css = `
#jeuBar{position:absolute;z-index:5;display:flex;gap:8px;align-items:center;left:16px;top:calc(106px + env(safe-area-inset-top,0px));pointer-events:none;max-width:calc(100% - 32px)}
#jeuBar>*{pointer-events:auto}
body.sheet-open #jeuBar{display:none}
@media (min-width:901px){body.sheet-open #jeuBar{display:flex}}
.evchip{display:flex;align-items:center;gap:8px;min-width:0;background:var(--paper);border:2.5px solid var(--ink);border-radius:999px;box-shadow:0 3px 0 rgba(74,53,40,.4);padding:3px 12px 3px 3px;cursor:pointer;color:var(--ink);text-align:left;max-width:300px}
.evchip:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(74,53,40,.4)}
.evi{flex:none;width:32px;height:32px;border-radius:50%;background:var(--ec);border:2px solid var(--ink);display:flex;align-items:center;justify-content:center}
.evi svg{width:19px;height:19px}
.evt{display:flex;flex-direction:column;min-width:0}
.evt b{font:700 14px/1.1 var(--display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.evt small{font:700 11.5px/1.2 var(--body);color:var(--rust);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jbtn{position:relative;flex:none;width:44px;height:44px;border-radius:50%;background:var(--paper);border:2.5px solid var(--ink);box-shadow:0 3px 0 rgba(74,53,40,.4);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:var(--ink)}
.jbtn:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(74,53,40,.4)}
.jbtn svg{width:26px;height:26px}
.jbtn .jn{position:absolute;right:-5px;bottom:-5px;min-width:20px;height:20px;border-radius:999px;background:var(--gold);border:2px solid var(--ink);font:800 11.5px/16px var(--display);text-align:center;padding:0 3px}
.jbtn .jb{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;border-radius:999px;background:var(--rust);color:#fff;border:2px solid #fff;font:800 11.5px/16px var(--display);text-align:center;padding:0 4px;animation:pulse .8s ease-in-out infinite alternate}
@media (max-width:900px){#jeuBar{left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));max-width:none}.evchip{flex:1;max-width:none}}
/* événement dans le panneau de voyage */
.evbans{display:flex;flex-direction:column;gap:6px}
.evban{display:flex;align-items:center;gap:10px;background:#fff3c4;border:2px solid var(--goldD);border-radius:14px;padding:8px 10px;margin:0}
.sugs .sug{position:relative}.sugs .sug .x2{position:absolute;right:10px;top:10px;background:var(--gold);border:2px solid var(--ink);border-radius:999px;font:800 12px/1 var(--display);padding:3px 7px}
.evban .evi{width:30px;height:30px}
.evban p{margin:0;font-size:13.5px;line-height:1.35}
.evban b{font-family:var(--display)}
/* effets de pièces et confettis */
#fxLayer{position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden}
.fxcoin{position:absolute;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;filter:drop-shadow(0 2px 0 rgba(74,53,40,.35))}
.fxcoin svg{width:100%;height:100%}
.fxplus{position:absolute;font:800 20px var(--display);color:#fff;-webkit-text-stroke:4px var(--ink);paint-order:stroke fill;white-space:nowrap}
.fxconf{position:absolute;left:0;top:0;width:9px;height:14px;border-radius:2px}
.purse.bump{animation:purseBump .45s cubic-bezier(.2,1.8,.4,1)}
@keyframes purseBump{40%{transform:scale(1.18)}}
/* butin rapporté */
.hhead{display:flex;align-items:center;gap:12px;width:100%;text-align:left}
.hhead img{width:64px;height:70px;flex:none;background:#f6e3c4;border-radius:16px;border:2.5px solid var(--ink)}
.hhead h2{font-size:22px}
.hstats{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.hstats span{display:inline-flex;align-items:center;gap:4px;background:#fff;border:2px solid var(--line);border-radius:999px;padding:2px 9px;font:700 13px var(--display)}
.haul{display:grid;grid-template-columns:repeat(auto-fill,minmax(94px,1fr));grid-auto-rows:max-content;flex:none;gap:8px;width:100%;max-height:min(40vh,380px);overflow:auto;padding:6px 2px 4px}
.haul.one{grid-template-columns:120px;justify-content:center;max-height:none;overflow:visible}
.hcard{position:relative;isolation:isolate;overflow:hidden;background:#fff;border:2.5px solid var(--rc);border-radius:14px;box-shadow:0 3px 0 var(--rc);padding:9px 5px 7px;display:flex;flex-direction:column;align-items:center;gap:3px;opacity:0;transform:scale(.6) translateY(10px);animation:hcIn .5s cubic-bezier(.2,1.5,.4,1) forwards;animation-delay:var(--d,0s)}
@keyframes hcIn{to{opacity:1;transform:none}}
.hcard .hico{width:46px;height:46px;display:flex;align-items:center;justify-content:center}
.hcard .hico svg{width:100%;height:100%}
.hcard b{font:700 12.5px/1.15 var(--display);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.3em}
.hcard .hr{font:800 10.5px var(--display);text-transform:uppercase;letter-spacing:.04em;color:var(--rc)}
.hcard .hnew{position:absolute;left:4px;top:4px;background:var(--pink);color:#fff;font:800 9.5px/1 var(--display);padding:3px 5px;border-radius:999px;text-transform:uppercase;z-index:2}
.hcard .hed{font:700 9.5px var(--display);color:var(--goldD)}
.hcard.r1{background:#f1faf5}.hcard.r2{background:#eef5fd}
.hcard.r3{background:radial-gradient(circle at 50% 35%,#f6efff 0,#e6d8fb 100%);animation:hcIn .6s cubic-bezier(.2,1.5,.4,1) forwards,epicGlow 1.4s ease-in-out infinite alternate;animation-delay:var(--d,0s),calc(var(--d,0s) + .6s)}
.hcard.r4{background:radial-gradient(circle at 50% 35%,#fffbe6 0,#fbe3a3 100%);animation:hcIn .7s cubic-bezier(.2,1.5,.4,1) forwards,legGlow 1.1s ease-in-out infinite alternate;animation-delay:var(--d,0s),calc(var(--d,0s) + .7s)}
.hcard.r3::before,.hcard.r4::before{content:"";position:absolute;inset:-60%;z-index:-1;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.75) 0 10deg,transparent 10deg 30deg);animation:rays 6s linear infinite;opacity:.55}
.hcard.r4::before{background:repeating-conic-gradient(from 0deg,rgba(255,244,190,.95) 0 10deg,transparent 10deg 30deg);opacity:.8}
.hcard.r3::after,.hcard.r4::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;z-index:1;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);transform:skewX(-18deg);animation:shine 2.4s ease-in-out infinite;animation-delay:calc(var(--d,0s) + .8s)}
.hcard.r3 .hico,.hcard.r4 .hico{animation:floaty 1.6s ease-in-out infinite alternate}
@keyframes rays{to{transform:rotate(360deg)}}
@keyframes shine{0%{left:-60%}55%,100%{left:130%}}
@keyframes floaty{to{transform:translateY(-3px) scale(1.06)}}
@keyframes epicGlow{from{box-shadow:0 3px 0 var(--rc),0 0 0 0 rgba(154,111,214,.0)}to{box-shadow:0 3px 0 var(--rc),0 0 14px 3px rgba(154,111,214,.55)}}
@keyframes legGlow{from{box-shadow:0 3px 0 var(--rc),0 0 0 0 rgba(242,193,78,0)}to{box-shadow:0 3px 0 var(--rc),0 0 18px 5px rgba(242,193,78,.75)}}
.hbig{font:800 15px var(--display);text-transform:uppercase;letter-spacing:.06em;padding:3px 12px;border-radius:999px;border:2px solid var(--ink)}
.hbig.r3{background:#e6d8fb;color:#6a3fb0}.hbig.r4{background:#fbe3a3;color:#9a6200;animation:pulse .7s ease-in-out infinite alternate}
.hextra{list-style:none;margin:0;padding:0;width:100%;display:flex;flex-direction:column;gap:5px;text-align:left}
.hextra li{display:block;text-align:left;background:#fff3c4;border:2px solid var(--goldD);border-radius:12px;padding:6px 10px;font-size:13.5px;line-height:1.35}
.hextra li.ach{background:#e6f6e9;border-color:var(--greenD)}
.rar.r3{color:#7a4fc0}.rar.r4{color:#b27a00}
/* raretés dans le sac et le journal */
.bi[style*="--rc:#9a6fd6"],.it[style*="--rc:#9a6fd6"]{background:linear-gradient(90deg,#f3ebff,#fff 60%);box-shadow:0 0 0 1.5px rgba(154,111,214,.35),0 0 12px rgba(154,111,214,.25)}
.bi[style*="--rc:#d99a25"],.it[style*="--rc:#d99a25"]{position:relative;overflow:hidden;background:linear-gradient(90deg,#fff3c9,#fffaf0 60%);box-shadow:0 0 0 1.5px rgba(217,154,37,.45),0 0 14px rgba(242,193,78,.45)}
.bi[style*="--rc:#d99a25"]::after,.it[style*="--rc:#d99a25"]::after{content:"";position:absolute;top:0;bottom:0;left:-40%;width:25%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.8),transparent);transform:skewX(-18deg);animation:shine 3.2s ease-in-out infinite;pointer-events:none}
.bi[style*="--rc:#d99a25"] .itx b,.it[style*="--rc:#d99a25"] .itx b{color:#9a6200}
.bi[style*="--rc:#9a6fd6"] .itx b,.it[style*="--rc:#9a6fd6"] .itx b{color:#6a3fb0}
/* cadeau quotidien */
.dgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;width:100%}
.dcell{position:relative;border:2.5px solid var(--line);background:#fff;border-radius:12px;padding:5px 2px 4px;display:flex;flex-direction:column;align-items:center;gap:1px;font:700 11px var(--display);color:var(--ink2)}
.dcell .dic{width:30px;height:30px;display:flex;align-items:center;justify-content:center}
.dcell .dic svg{width:26px;height:26px}
.dcell .dv{font:800 12px var(--display);color:var(--ink)}
.dcell.past{background:#e6f6e9;border-color:var(--greenD);opacity:.75}
.dcell.past::after{content:"✓";position:absolute;right:3px;top:1px;color:var(--greenD);font:800 13px var(--display)}
.dcell.today{background:#fff3c4;border-color:var(--ink);box-shadow:0 0 0 3px rgba(246,196,69,.6);animation:pulse .8s ease-in-out infinite alternate}
.dcell.big{background:#fbe3a3}
@media (max-width:480px){.dgrid{grid-template-columns:repeat(4,1fr)}.dcell.d7{grid-column:span 2}}
.streak{display:inline-flex;align-items:center;gap:6px;font:800 18px var(--display);color:var(--rust)}
.streak svg{width:24px;height:24px}
.evcard{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 10px}
.evcard .evi{width:40px;height:40px}.evcard .evi svg{width:24px;height:24px}
.evcard p{margin:0;font-size:13.5px}
/* collections avec paliers */
.tcols{display:flex;flex-direction:column;gap:8px}
.tcol{background:#fff;border:2px solid var(--line);border-radius:14px;padding:0}
.tcol summary{list-style:none;display:grid;grid-template-columns:1fr auto;grid-template-areas:"n c" "b b";align-items:center;gap:4px 10px;padding:9px 12px;cursor:pointer}
.tcol summary::-webkit-details-marker{display:none}
.tcol .cn{grid-area:n;font:700 15px var(--display);display:flex;align-items:center;gap:8px;min-width:0}
.tcol .cn i{flex:none;width:12px;height:12px;border-radius:50%;background:var(--tc);border:2px solid var(--ink)}
.tcol .cc{grid-area:c;display:flex;align-items:center;gap:6px;font:700 13px var(--display);color:var(--ink2)}
.tbar{grid-area:b;position:relative;height:12px;background:#f1e4c8;border:2px solid var(--ink);border-radius:999px;margin:6px 0 2px}
.tbar>i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--green)}
.tbar>em{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#fff;border:2px solid var(--ink);font:800 9px/12px var(--display);text-align:center;font-style:normal}
.tbar>em.on{background:var(--gold)}
.tbar>em:last-of-type{margin-left:-14px}
.tcol.full{border-color:var(--goldD);background:#fffaf0}
.tiers{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}
.tiers>span{font:700 12px var(--display);border:2px solid var(--line);border-radius:999px;padding:2px 9px;display:inline-flex;align-items:center;gap:4px;background:#fffaf0}
.tiers>span.on{background:#e6f6e9;border-color:var(--greenD);color:var(--greenD)}
.tcol ul{margin:0;padding:0 12px 10px 28px;columns:2;font-size:13px;color:var(--muted)}
.tcol li.got{color:var(--ink)}
/* succès */
.achsum{display:flex;align-items:center;gap:10px;margin:2px 0 10px}
.achsum b{font:800 16px var(--display);white-space:nowrap}
.achsum .gbar{flex:1}
.achs{display:flex;flex-direction:column;gap:7px}
.ach{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 10px}
.ach .achi{flex:none;width:40px;height:40px;border-radius:12px;background:#efe7d8;display:flex;align-items:center;justify-content:center;filter:grayscale(1);opacity:.55}
.ach .achi svg{width:30px;height:30px}
.ach .achx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ach .achx b{font:700 15px/1.15 var(--display)}
.ach .achx span{font-size:12.5px;color:var(--muted);line-height:1.3}
.ach .apb{height:6px;background:#f1e4c8;border-radius:999px;overflow:hidden;margin-top:2px}
.ach .apb i{display:block;height:100%;background:var(--green)}
.ach .ar{flex:none;font:700 13px var(--display);color:var(--muted)}
.ach.ready{background:#fff3c4;border-color:var(--goldD);animation:glow 1.2s ease-in-out infinite alternate}
.ach.ready .achi,.ach.got .achi{filter:none;opacity:1;background:#fbe3a3}
.ach.got .achi{background:#e6f6e9}
.filters button .fb{display:inline-block;min-width:18px;height:18px;margin-left:3px;border-radius:999px;background:var(--rust);color:#fff;font:800 11px/18px var(--display);text-align:center;padding:0 4px}
/* annonce de succès */
#achPop{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translate(-50%,-150%);z-index:65;display:flex;align-items:center;gap:10px;background:var(--paper);border:3px solid var(--ink);border-radius:18px;box-shadow:0 5px 0 rgba(74,53,40,.45);padding:7px 14px 7px 8px;transition:transform .45s cubic-bezier(.2,1.4,.4,1);cursor:pointer;max-width:calc(100% - 24px)}
#achPop.on{transform:translate(-50%,0)}
#achPop svg{width:38px;height:38px;flex:none}
#achPop small{display:block;font:800 11px var(--display);color:var(--rust);text-transform:uppercase;letter-spacing:.06em}
#achPop b{font:700 16px/1.15 var(--display)}
/* étape réussie du bandeau d'objectif */
.gstep{position:absolute;right:12px;top:-14px;background:var(--green);color:#fff;border:2px solid var(--ink);border-radius:999px;padding:2px 10px;font:800 12px var(--display);pointer-events:none;z-index:6}
#fastBtn{display:none}
body.jeu-test #fastBtn{display:inline-flex}
@media (prefers-reduced-motion:reduce){.hcard,.hcard.r3,.hcard.r4{animation:none;opacity:1;transform:none}.hcard.r3::before,.hcard.r4::before,.hcard::after{animation:none}}
`;
  const st = document.createElement('style'); st.id = 'jeuCSS'; st.textContent = css; document.head.appendChild(st);
  try { if (/test/.test(location.hash + location.search)) document.body.classList.add('jeu-test'); } catch (e) {}
})();

// ---------- Durées : la balade éclair n'est plus présentée comme un « test »
(function () { const e = DURS.find(d => d.key === 'eclair'); if (e && /tester/.test(e.hint)) e.hint = '1 min, parfait pour une pause'; })();

// ---------- Petits outils
const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const fxLayer = () => { let l = $('fxLayer'); if (!l) { l = document.createElement('div'); l.id = 'fxLayer'; document.body.appendChild(l); } return l; };
let lastPointer = { x: 0, y: 0, t: 0 };
document.addEventListener('pointerdown', e => { lastPointer = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
const dayNum = (d = new Date()) => Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
const TROPHY = (c = '#f2c14e') => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 6 H28 V15 C28 21 24 25 20 25 C16 25 12 21 12 15Z" fill="${c}" stroke="#5b4636" stroke-width="2" stroke-linejoin="round"/><path d="M12 9 H6 C6 15 9 17 12 17 M28 9 H34 C34 15 31 17 28 17" fill="none" stroke="#5b4636" stroke-width="2"/><path d="M17 25 H23 L24 31 H16Z" fill="${c}" stroke="#5b4636" stroke-width="2" stroke-linejoin="round"/><rect x="12" y="31" width="16" height="5" rx="1.5" fill="#c98a4f" stroke="#5b4636" stroke-width="2"/><path d="M16 10 Q17 17 20 19" fill="none" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/></svg>`;
const FLAME = `<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3 C17 9 24 11 24 19 C24 24 20 28 15 28 C10 28 6 24 6 19 C6 14 10 12 11 8 C13 11 13 13 15 14 C16 11 16 7 15 3Z" fill="#f2884a" stroke="#5b4636" stroke-width="2" stroke-linejoin="round"/><path d="M15 27 C12 27 10 25 10 22 C10 19 13 18 14 15 C16 18 20 19 20 22 C20 25 18 27 15 27Z" fill="#f6c445"/></svg>`;
const GIFT = (c = '#f08aa6') => `<svg viewBox="0 0 30 30" aria-hidden="true"><rect x="4" y="11" width="22" height="16" rx="2" fill="${c}" stroke="#5b4636" stroke-width="2"/><rect x="3" y="8" width="24" height="5" rx="1.5" fill="${c}" stroke="#5b4636" stroke-width="2"/><path d="M15 8 V27" stroke="#f6c445" stroke-width="4"/><path d="M15 8 C11 2 6 4 9 8 M15 8 C19 2 24 4 21 8" fill="none" stroke="#5b4636" stroke-width="2"/></svg>`;

// ================= EFFETS : pièces, confettis =================
let coinQueue = 0, coinTimer = null;
function coinFX(n) {
  if (!window.__jeuReady) return;
  coinQueue += n; clearTimeout(coinTimer);
  coinTimer = setTimeout(() => { const v = coinQueue; coinQueue = 0; flyCoins(v); }, 60);
}
function flyCoins(n) {
  const purse = $('coins'); if (!purse) return;
  const pr = purse.getBoundingClientRect(), tx = pr.left + 20, ty = pr.top + pr.height / 2;
  const recent = Date.now() - lastPointer.t < 2000;
  const ox = recent ? lastPointer.x : innerWidth / 2, oy = recent ? lastPointer.y : innerHeight / 2;
  const L = fxLayer(), count = reduceMotion() ? 0 : Math.min(12, 3 + Math.round(n / 25));
  let landed = 0;
  const bump = () => { purse.classList.remove('bump'); void purse.offsetWidth; purse.classList.add('bump'); };
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div'); c.className = 'fxcoin'; c.innerHTML = COIN; L.appendChild(c);
    const sx = ox + (Math.random() - 0.5) * 90, sy = oy + (Math.random() - 0.5) * 60 - 30;
    const a = c.animate([
      { transform: `translate(${ox}px,${oy}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${sx}px,${sy}px) scale(1.15)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${tx}px,${ty}px) scale(.7)`, opacity: 1 },
    ], { duration: 650 + i * 55, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
    a.onfinish = () => { c.remove(); landed++; bump(); };
  }
  if (!count) bump();
  const p = document.createElement('div'); p.className = 'fxplus'; p.textContent = `+${n.toLocaleString('fr-FR')}`; L.appendChild(p);
  p.animate([{ transform: `translate(${pr.left + 4}px,${pr.bottom + 4}px)`, opacity: 0 }, { transform: `translate(${pr.left + 4}px,${pr.bottom + 10}px)`, opacity: 1, offset: 0.2 }, { transform: `translate(${pr.left + 4}px,${pr.bottom + 34}px)`, opacity: 0 }], { duration: 1500, delay: count ? 550 : 0, fill: 'both' }).onfinish = () => p.remove();
}
function confetti(gold) {
  if (reduceMotion()) return;
  const L = fxLayer(), cols = gold ? ['#f6c445', '#f2c14e', '#fff3c4', '#d99a25', '#f08aa6'] : ['#9a6fd6', '#cdb8ea', '#f08aa6', '#8cc7e8', '#f6c445'];
  for (let i = 0; i < (gold ? 70 : 40); i++) {
    const c = document.createElement('div'); c.className = 'fxconf'; c.style.background = cols[i % cols.length]; L.appendChild(c);
    const x0 = innerWidth / 2 + (Math.random() - 0.5) * 120, y0 = innerHeight * 0.38;
    const x1 = x0 + (Math.random() - 0.5) * innerWidth * 0.9, y1 = innerHeight + 40, r = Math.random() * 900 - 450;
    const peak = y0 - 120 - Math.random() * 200;
    c.animate([
      { transform: `translate(${x0}px,${y0}px) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px,${peak}px) rotate(${r / 2}deg)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${x1}px,${y1}px) rotate(${r}deg)`, opacity: 0.9 },
    ], { duration: 1800 + Math.random() * 1200, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).onfinish = () => c.remove();
  }
}

// ================= ÉVÉNEMENT DU JOUR =================
const EVENTS = [
  { key: 'boulangerie', name: 'Jour des boulangeries', short: 'Butin ×2 dans les boulangeries', desc: 'Les boulangeries sortent leurs meilleures fournées : tout ce qu’on y récolte est doublé.', tags: ['boulangerie'], cat: 'boulangerie' },
  { key: 'marche', name: 'Jour du marché', short: 'Butin ×2 aux marchés et épiceries', desc: 'Les étals débordent : le butin des marchés et des épiceries fines est doublé.', tags: ['marche', 'epicerie'], cat: 'marche' },
  { key: 'parc', name: 'Journée des parcs', short: 'Butin ×2 dans les parcs et les bois', desc: 'Grand soleil sur les jardins : le butin des parcs, des bois et des forêts est doublé.', tags: ['parc', 'foret'], cat: 'parc' },
  { key: 'mer', name: 'Journée de la mer', short: 'Butin ×2 à la plage et au port', desc: 'Marée exceptionnelle : plages, ports, poissonneries et voyages en bord de mer rapportent le double.', tags: ['plage', 'port', 'poissonnerie', 'mer'], cat: 'plage' },
  { key: 'fleurs', name: 'Fête des fleurs', short: 'Butin ×2 chez les fleuristes et aux champs', desc: 'Tout fleurit : le butin des fleuristes, des champs et de la campagne est doublé.', tags: ['fleuriste', 'campagne'], cat: 'fleuriste' },
  { key: 'patrimoine', name: 'Journée du patrimoine', short: 'Butin ×2 aux musées et monuments', desc: 'Portes ouvertes partout : musées, églises, châteaux, librairies et monuments rapportent le double.', tags: ['musee', 'patrimoine', 'librairie', 'monument'], cat: 'musee' },
  { key: 'gourmand', name: 'Jour gourmand', short: 'Butin ×2 aux cafés, glaciers et restaurants', desc: 'Les cuisines tournent à plein : cafés, glaciers et restaurants rapportent le double.', tags: ['cafe', 'glacier', 'restaurant'], cat: 'cafe' },
  { key: 'mode', name: 'Jour des boutiques', short: 'Butin ×2 dans les boutiques de mode', desc: 'Soldes chez les créateurs : boutiques de vêtements, friperies et boutiques rapportent le double.', tags: ['mode', 'friperie', 'boutique'], cat: 'mode' },
  { key: 'sommets', name: 'Jour des sommets', short: 'Butin ×2 en montagne', desc: 'Ciel limpide sur les cimes : montagnes, neige et points de vue rapportent le double.', tags: ['montagne', 'neige', 'belvedere'], cat: 'belvedere', place: true },
  { key: 'chance', name: 'Jour de chance', short: 'Objets rares plus fréquents partout', desc: 'Un trèfle à quatre feuilles dans chaque sac : les objets rares, épiques et légendaires sortent bien plus souvent.', luck: 1, color: '#5fbf7f' },
  { key: 'pieces', name: 'Jour des pièces', short: 'Pièces de voyage ×2', desc: 'Les fontaines débordent : les pièces rapportées de voyage sont doublées au retour.', coins: true, color: '#f2c14e' },
  { key: 'savoir', name: 'Jour d’apprentissage', short: '+50 % d’expérience', desc: 'Les compagnons sont très attentifs aujourd’hui : +50 % d’expérience au retour de chaque voyage.', xp: 1.5, color: '#7a6fb8' },
];
let _evCache = { dk: 0, ev: null };
function todayEvent() {
  const dk = dayKey(); if (_evCache.dk === dk) return _evCache.ev;
  const ev = EVENTS[(Math.imul(dk, 2654435761) >>> 0) % EVENTS.length];
  _evCache = { dk, ev }; return ev;
}
const evColor = ev => ev.color || (ev.cat && POI_CATS[ev.cat] ? POI_CATS[ev.cat][1] : '#f2c14e');
function evIcon(ev) {
  if (ev.cat && POI_CATS[ev.cat]) return `<svg viewBox="0 0 24 24" aria-hidden="true">${POI_GLYPH[POI_CATS[ev.cat][2]] || ''}</svg>`;
  if (ev.coins) return COIN;
  if (ev.luck) return `<svg viewBox="0 0 24 24" aria-hidden="true">${[0, 1, 2, 3].map(i => `<circle cx="${12 + Math.cos(i * 1.571) * 4.6}" cy="${11 + Math.sin(i * 1.571) * 4.6}" r="4.4" fill="#fff"/>`).join('')}<path d="M12 12 Q14 18 17 21" stroke="#fff" stroke-width="2" fill="none"/></svg>`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6 H11 Q12 6 12 8 V20 Q12 18 10 18 H4Z M20 6 H13 Q12 6 12 8 V20 Q12 18 14 18 H20Z" fill="#fff"/></svg>`;
}
const evApplies = (ev, tags) => !!(ev && ev.tags && tags && tags.some(t => ev.tags.includes(t)));
function goEvent() {
  const ev = todayEvent();
  $('modal').hidden = true;
  if (ev.place && !S.trips[S.sel]) { const h = homeObj(), p = PLACES.filter(x => x.name !== S.home && ev.tags.some(t => x.tags.includes(t))).sort((a, b) => kmBetween(h, a) - kmBetween(h, b))[0]; if (p) { goToPlace(p); return; } }
  if (ev.cat && POI_CATS[ev.cat]) { if (tab !== 'carte') closeSheet(); goHome(); setTimeout(() => toast(`Cherchez « ${POI_CATS[ev.cat][0]} » près de chez vous et touchez-le pour récolter.`), 50); return; }
  openSheet('voyage');
}
function eventModal() {
  const ev = todayEvent();
  showModal(`<div class="evi" style="--ec:${evColor(ev)};width:64px;height:64px">${evIcon(ev).replace('<svg ', '<svg style="width:38px;height:38px" ')}</div><h2>${esc(ev.name)}</h2><p>${esc(ev.desc)}</p><p class="small">Un nouvel événement chaque jour. Revenez demain pour découvrir le suivant !</p><div class="row" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn cream" data-closemodal="1">Fermer</button><button class="btn green" data-jeu="goevent">J’y vais !</button></div>`);
}

// ================= CADEAU QUOTIDIEN ET SÉRIE =================
const LOGIN_REWARDS = [{ coins: 30 }, { coins: 50 }, { item: 1 }, { coins: 80 }, { item: 2 }, { coins: 120 }, { coins: 200, item: 3 }];
function giftItem(r) {
  const all = Object.values(LOOT).flat().filter(d => d[1] !== 'n' && d[3] <= r);
  const it = makeItem(pick(all), 0, 'Cadeau du jour', [], { fixed: r });
  S.inv.push(it); S.dex[it.name] = true; S.stats.maxRar = Math.max(S.stats.maxRar || 0, r);
  return it;
}
function checkLogin() {
  const L = S.login, today = dayNum();
  if (L.last === today) return null;
  L.streak = L.last === today - 1 ? (L.streak || 0) + 1 : 1;
  L.last = today; L.best = Math.max(L.best || 0, L.streak); L.total = (L.total || 0) + 1;
  const idx = (L.streak - 1) % 7, r = LOGIN_REWARDS[idx];
  const got = { idx, coins: r.coins || 0, item: null };
  if (r.item != null) got.item = giftItem(r.item);
  save();
  return got;
}
function rewardCell(r, i, cls) {
  const ic = r.item != null ? GIFT(RARC[r.item]) : COIN;
  return `<div class="dcell ${cls} d${i + 1}${i === 6 ? ' big' : ''}"><span>Jour ${i + 1}</span><span class="dic">${ic}</span><span class="dv"${r.item != null && !r.coins ? ` style="color:${RARC[r.item]}"` : ''}>${r.coins ? r.coins : RARITY[r.item]}${r.coins && r.item != null ? ` + <span style="color:${RARC[r.item]}">${RARITY[r.item]}</span>` : ''}</span></div>`;
}
function loginModal(got) {
  const L = S.login, cur = ((L.streak || 1) - 1) % 7, ev = todayEvent();
  const cells = LOGIN_REWARDS.map((r, i) => rewardCell(r, i, i < cur ? 'past' : i === cur ? 'today' : '')).join('');
  let gotTxt = '';
  if (got) gotTxt = `<p>Cadeau du jour ${got.idx + 1} : ${got.coins ? `<b>${got.coins} pièces</b>` : ''}${got.coins && got.item ? ' et ' : ''}${got.item ? `<b class="rar r${got.item.rarity}">« ${esc(got.item.name)} »</b> (${RARITY[got.item.rarity]})` : ''}.</p>`;
  showModal(`<span class="streak">${FLAME} ${L.streak} jour${L.streak > 1 ? 's' : ''} de suite</span><h2>${got ? (L.total > 1 || (S.stats.trips || 0) > 0 ? 'Bon retour !' : 'Cadeau de bienvenue !') : 'Cadeaux quotidiens'}</h2>${gotTxt}<div class="dgrid">${cells}</div><p class="small">Revenez chaque jour : les cadeaux grandissent jusqu’au 7ᵉ jour. Si vous manquez un jour, la série recommence.</p><div class="evcard"><span class="evi" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><p><b>Aujourd’hui : ${esc(ev.name)}</b><br>${esc(ev.short)}</p></div><button class="btn green big" data-closemodal="1" data-jeu="logindone">${got ? 'Merci !' : 'Fermer'}</button>`);
  if (got) setTimeout(() => { if (got.coins) { lastPointer = { x: innerWidth / 2, y: innerHeight / 2, t: Date.now() }; coinFX(got.coins); } }, 350);
}
function runLogin() {
  if (!S.seenIntro) return;
  if (!$('modal').hidden) { setTimeout(runLogin, 1500); return; }
  const got = checkLogin();
  if (got) { gainCoinsSilent(got.coins); renderAll(); renderJeuBar(); loginModal(got); }
}
// les pièces du cadeau sont ajoutées sans animation immédiate (l'animation part du cadeau)
function gainCoinsSilent(n) { const r = window.__jeuReady; window.__jeuReady = false; gainCoins(n); window.__jeuReady = r; }

// ================= PALIERS DE COLLECTION =================
function checkTiers() {
  const out = [];
  for (const c of collections()) {
    const reached = colTierReached(c), have = S.tiers[c.key] || 0;
    if (reached <= have) continue;
    for (let i = have; i < reached; i++) {
      if (i < 2) {
        const coinsR = tierReward(c, i); gainCoins(coinsR);
        let it = null;
        if (i === 1) { // 50 % : un objet rare de cette collection
          const defs = (LOOT[c.key] || []).filter(d => d[1] !== 'n');
          if (defs.length) { const d = pick(defs); it = makeItem(d, 0, `Palier : ${c.label}`, [c.key], { fixed: Math.max(2, d[3]) }); S.inv.push(it); S.dex[it.name] = true; }
        }
        out.push({ c, i, coins: coinsR, item: it });
      } else out.push({ c, i, coins: 0, full: true });
    }
    S.tiers[c.key] = reached;
  }
  if (out.length) save();
  return out;
}
const tierText = t => t.full ? `Collection « ${t.c.label} » complète ! Votre trophée vous attend dans Quêtes › Collections.` : `Palier ${TIERS[t.i].label} · ${t.c.label} : +${t.coins} pièces${t.item ? ` et « ${t.item.name} »` : ''}`;

// ================= SUCCÈS =================
const st_ = k => S.stats[k] || 0;
const dexN = () => Object.keys(S.dex).length;
const placesN = () => PLACES.filter(p => S.found[p.name]).length;
const maxRar = () => Math.max(S.stats.maxRar || 0, ...S.inv.map(i => i.rarity || 0), 0);
const tierCount = n => collections().filter(c => colTierReached(c) >= n).length;
const lvls = () => Object.values(S.prog).map(p => p.lvl);
const ACH = [
  { id: 'depart', name: 'Premier départ', desc: 'Envoyer un compagnon en voyage', p: () => [st_('started'), 1], r: 30 },
  { id: 'voyageur', name: 'Voyageur', desc: 'Terminer 10 voyages', p: () => [st_('trips'), 10], r: 80 },
  { id: 'globe', name: 'Globe-trotteur', desc: 'Terminer 50 voyages', p: () => [st_('trips'), 50], r: 250 },
  { id: 'pause', name: 'Pause éclair', desc: 'Terminer 5 voyages courts (balade ou escapade)', p: () => [st_('short'), 5], r: 60 },
  { id: 'expe', name: 'Grande expédition', desc: 'Terminer une expédition de 12 h', p: () => [st_('expe'), 1], r: 200 },
  { id: 'quartier', name: 'Enfant du quartier', desc: 'Récolter 10 fois dans les lieux du quartier', p: () => [st_('poiTrips'), 10], r: 120 },
  { id: 'curieux', name: 'Curieux', desc: 'Découvrir 25 objets différents', p: () => [dexN(), 25], r: 60 },
  { id: 'encyclo', name: 'Encyclopédiste', desc: 'Découvrir 100 objets différents', p: () => [dexN(), 100], r: 200 },
  { id: 'savant', name: 'Grand savant', desc: 'Découvrir 250 objets différents', p: () => [dexN(), 250], r: 500 },
  { id: 'epique', name: 'Éclat épique', desc: 'Trouver un objet épique', p: () => [maxRar() >= 3 ? 1 : 0, 1], r: 100 },
  { id: 'legende', name: 'Légendaire !', desc: 'Trouver un objet légendaire', p: () => [maxRar() >= 4 ? 1 : 0, 1], r: 300 },
  { id: 'souvenir', name: 'Premier souvenir', desc: 'Trouver le souvenir unique d’un lieu célèbre', p: () => [placesN(), 1], r: 60 },
  { id: 'memoire', name: 'Mémoire du monde', desc: 'Trouver 15 souvenirs uniques', p: () => [placesN(), 15], r: 300 },
  { id: 'carte', name: 'Chasseur de trésors', desc: 'Déplier une carte au trésor', p: () => [S.secrets.length, 1], r: 100 },
  { id: 'secret', name: 'Lieu secret', desc: 'Visiter un lieu secret', p: () => [SECRETS.filter(s => S.found[s.name]).length, 1], r: 200 },
  { id: 'palier', name: 'Bon début', desc: 'Atteindre 25 % d’une collection de lieu', p: () => [tierCount(1), 1], r: 50 },
  { id: 'paliers', name: 'Collectionneur', desc: 'Atteindre 50 % de 5 collections', p: () => [tierCount(2), 5], r: 200 },
  { id: 'complet', name: 'Collection complète', desc: 'Compléter une collection à 100 %', p: () => [tierCount(3), 1], r: 250 },
  { id: 'artisan', name: 'Artisan', desc: 'Fabriquer 5 objets à l’atelier', p: () => [st_('crafted'), 5], r: 80 },
  { id: 'maitre', name: 'Maître artisan', desc: 'Fabriquer 25 objets à l’atelier', p: () => [st_('crafted'), 25], r: 250 },
  { id: 'commerce', name: 'Petit commerce', desc: 'Vendre 10 objets', p: () => [st_('sold'), 10], r: 80 },
  { id: 'fortune', name: 'Tirelire pleine', desc: 'Gagner 3 000 pièces au total', p: () => [st_('earned'), 3000], r: 150 },
  { id: 'coquet', name: 'Coquet', desc: 'Essayer 5 vêtements', p: () => [st_('worn'), 5], r: 50 },
  { id: 'deco', name: 'Décorateur', desc: 'Remplir 5 emplacements de la maison', p: () => [Object.values(S.house).filter(Boolean).length, 5], r: 100 },
  { id: 'photo', name: 'Photographe', desc: 'Rassembler 30 cartes postales', p: () => [S.album.length, 30], r: 100 },
  { id: 'gourmet', name: 'Gourmet', desc: 'Offrir 10 repas aux compagnons', p: () => [st_('fed'), 10], r: 60 },
  { id: 'coeur', name: 'Grand cœur', desc: 'Répondre à 20 choix en voyage', p: () => [st_('choices'), 20], r: 80 },
  { id: 'aguerri', name: 'Compagnon aguerri', desc: 'Faire monter un compagnon au niveau 5', p: () => [Math.max(...lvls()), 5], r: 150 },
  { id: 'trio', name: 'Les trois amis', desc: 'Les trois compagnons au niveau 3', p: () => [Math.min(...lvls()), 3], r: 150 },
  { id: 'fidele', name: 'Fidèle', desc: 'Revenir 3 jours de suite', p: () => [S.login.best || 0, 3], r: 80 },
  { id: 'assidu', name: 'Assidu', desc: 'Revenir 7 jours de suite', p: () => [S.login.best || 0, 7], r: 250 },
];
const achDone = a => { const [c, g] = a.p(); return c >= g; };
const achReady = () => ACH.filter(a => achDone(a) && !S.achClaimed[a.id]);
function checkAch() {
  const out = [];
  for (const a of ACH) if (!S.achSeen[a.id] && achDone(a)) { S.achSeen[a.id] = Date.now(); out.push(a); }
  if (out.length) save();
  return out;
}
let popQueue = [], popBusy = false;
function achPop(a) { popQueue.push(a); if (!popBusy) nextPop(); }
function nextPop() {
  const a = popQueue.shift(); if (!a) { popBusy = false; return; }
  popBusy = true;
  let el = $('achPop'); if (!el) { el = document.createElement('div'); el.id = 'achPop'; el.setAttribute('role', 'status'); el.addEventListener('click', () => { el.classList.remove('on'); openAchievements(); }); document.body.appendChild(el); }
  el.innerHTML = `${TROPHY()}<div><small>Succès débloqué</small><b>${esc(a.name)}</b></div>`;
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => { el.classList.remove('on'); setTimeout(nextPop, 450); }, 3000);
}
function claimAch(id) {
  const a = ACH.find(x => x.id === id); if (!a || S.achClaimed[id] || !achDone(a)) return;
  S.achClaimed[id] = Date.now(); gainCoins(a.r); save(); renderTop(); renderPanel(); renderJeuBar();
}
function openAchievements() { questView = 'succes'; openSheet('quetes'); }
function achHTML() {
  const ready = achReady().length, claimed = Object.keys(S.achClaimed).length;
  const rows = ACH.map(a => { const [c, g] = a.p(); return { a, c: Math.min(c, g), g, done: c >= g, got: !!S.achClaimed[a.id] }; });
  rows.sort((x, y) => (y.done && !y.got) - (x.done && !x.got) || x.got - y.got || (y.c / y.g) - (x.c / x.g));
  let h = `<div class="achsum"><b>${claimed} / ${ACH.length} succès</b><span class="gbar"><i style="width:${(claimed / ACH.length * 100).toFixed(0)}%"></i></span></div>`;
  if (ready) h += `<p class="small" style="margin:0 0 8px">${ready} récompense${ready > 1 ? 's' : ''} à récupérer !</p>`;
  h += `<div class="achs">` + rows.map(({ a, c, g, done, got }) => `<div class="ach ${got ? 'got' : done ? 'ready' : ''}"><span class="achi">${TROPHY(got ? '#f2c14e' : done ? '#f6c445' : '#c9bfae')}</span><div class="achx"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span>${!done && g > 1 ? `<div class="apb"><i style="width:${(c / g * 100).toFixed(0)}%"></i></div><span>${c.toLocaleString('fr-FR')} / ${g.toLocaleString('fr-FR')}</span>` : ''}</div>${got ? '<span class="tagok">Obtenu</span>' : done ? `<button class="btn gold sm" data-ach="${a.id}">${coins(a.r)}</button>` : `<span class="ar">${coins(a.r)}</span>`}</div>`).join('') + `</div>`;
  return h;
}

// ---- collections avec paliers (remplace la liste d'origine dans Quêtes › Collections)
function colsHTML() {
  const cols = collections().map(c => ({ c, got: colGot(c), n: c.names.length, tier: colTierReached(c) }));
  cols.sort((a, b) => ((b.tier === 3 && !S.colClaimed[b.c.key]) - (a.tier === 3 && !S.colClaimed[a.c.key])) || (!!S.colClaimed[a.c.key] - !!S.colClaimed[b.c.key]) || (b.got / b.n - a.got / a.n));
  let h = `<p class="small" style="margin:0 0 8px">Chaque type de lieu a sa collection. À 25 % et 50 % des objets découverts, vous recevez une récompense automatiquement. À 100 %, un trophée pour la maison.</p><div class="tcols">`;
  h += cols.map(({ c, got, n, tier }) => {
    const claimed = S.colClaimed[c.key], f = got / n;
    const pills = TIERS.map((t, i) => `<span class="${tier > i ? 'on' : ''}">${tier > i ? '✓ ' : ''}${t.label} · ${coins(tierReward(c, i))}${i === 1 ? ' + objet' : i === 2 ? ' + trophée' : ''}</span>`).join('');
    return `<details class="tcol ${tier === 3 ? 'full' : ''}"><summary><span class="cn"><i style="--tc:${TAGC[c.key] || '#c9a97a'}"></i>${esc(c.label)}</span><span class="cc">${got}/${n}${tier === 3 && !claimed ? `<button class="btn gold sm" data-claimc="${c.key}">Trophée</button>` : claimed ? '<span class="tagok">Complète</span>' : ''}</span><span class="tbar"><i style="width:${(f * 100).toFixed(0)}%"></i><em class="${tier > 0 ? 'on' : ''}" style="left:25%"></em><em class="${tier > 1 ? 'on' : ''}" style="left:50%"></em><em class="${tier > 2 ? 'on' : ''}" style="left:100%"></em></span></summary><div class="tiers">${pills}</div><ul>${c.names.map(x => `<li class="${S.dex[x] ? 'got' : ''}">${S.dex[x] ? esc(x) : '? ? ?'}</li>`).join('')}</ul></details>`;
  }).join('');
  return h + `</div>`;
}

// ================= BUTIN AU RETOUR =================
function haulCard(it, i, isNew) {
  return `<div class="hcard r${it.rarity}" style="--rc:${RARC[it.rarity]};--d:${(0.08 * i).toFixed(2)}s">${isNew ? '<span class="hnew">Nouveau</span>' : ''}<span class="hico">${itemIcon(it)}</span><b>${esc(it.name)}</b><span class="hr">${RARITY[it.rarity]}</span>${it.edition ? `<span class="hed">${esc(it.edition)}</span>` : it.special && !/^Récompense/.test(it.from || '') ? '<span class="hed">Souvenir unique</span>' : ''}</div>`;
}
function showHaul(h) {
  const items = h.items.slice().sort((a, b) => b.rarity - a.rarity);
  const top = items.length ? items[0].rarity : 0, name = CHARS[h.comp].name;
  const tiers = checkTiers(), achs = checkAch();
  const extra = (h.extra || []).map(x => `<li>${esc(x)}</li>`).concat(tiers.map(t => `<li>${esc(tierText(t))}</li>`), achs.length ? [`<li class="ach">${achs.length > 1 ? 'Succès débloqués' : 'Succès débloqué'} : <b>${achs.map(a => esc(a.name)).join(', ')}</b>. Récompense${achs.length > 1 ? 's' : ''} dans Quêtes › Succès.</li>`] : []);
  const newN = items.filter(i => h.newNames.has(i.name)).length;
  showModal(`<div class="hhead"><img src="${portraitURI(h.comp, 'rire')}" alt=""><div><h2>${name} est de retour !</h2><div class="hstats"><span>${items.length} objet${items.length > 1 ? 's' : ''}</span>${newN ? `<span>${newN} nouveau${newN > 1 ? 'x' : ''}</span>` : ''}${h.coins > 0 ? `<span>${COIN}+${h.coins}</span>` : ''}<span>+${h.xp} exp.</span>${h.photos ? `<span>${h.photos} carte${h.photos > 1 ? 's' : ''} postale${h.photos > 1 ? 's' : ''}</span>` : ''}</div></div></div>${top >= 3 ? `<span class="hbig r${top}">${top >= 4 ? 'Trouvaille légendaire !' : 'Trouvaille épique !'}</span>` : ''}<div class="haul">${items.map((it, i) => haulCard(it, i, h.newNames.has(it.name))).join('')}</div>${extra.length ? `<ul class="hextra">${extra.join('')}</ul>` : ''}<button class="btn green big wide" data-closemodal="1">Tout ranger dans le sac</button>`);
  if (top >= 3) setTimeout(() => confetti(top >= 4), 300 + Math.min(items.length, 8) * 60);
  renderJeuBar();
}

// ================= BARRE DU JEU (écran principal) =================
function renderJeuBar() {
  let bar = $('jeuBar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'jeuBar'; const g = $('goal'); g.parentNode.insertBefore(bar, g.nextSibling); }
  const ev = todayEvent(), ready = achReady().length, L = S.login;
  bar.innerHTML = `<button class="evchip" data-jeu="event" aria-label="Événement du jour : ${esc(ev.name)}"><span class="evi" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><span class="evt"><b>${esc(ev.name)}</b><small>${esc(ev.short)}</small></span></button><button class="jbtn" data-jeu="login" aria-label="Cadeaux quotidiens, série de ${L.streak || 0} jours">${FLAME}<span class="jn">${L.streak || 0}</span></button><button class="jbtn" data-jeu="ach" aria-label="Succès${ready ? `, ${ready} à récupérer` : ''}">${TROPHY()}${ready ? `<span class="jb">${ready}</span>` : ''}</button>`;
  layoutJeuBar(); eventMapCSS();
}
// les lieux concernés par l'événement du jour brillent sur la carte
function eventMapCSS() {
  const ev = todayEvent(); let st = $('jeuEvCSS'); if (!st) { st = document.createElement('style'); st.id = 'jeuEvCSS'; document.head.appendChild(st); }
  const cols = (ev.tags || []).filter(t => POI_CATS[t]).map(t => POI_CATS[t][1]);
  st.textContent = cols.map(c => `.poi .poib[style*="--pc:${c}"]`).join(',') + (cols.length ? `{box-shadow:0 0 0 3px #f6c445,0 0 12px 4px rgba(246,196,69,.8);animation:pulse .9s ease-in-out infinite alternate}` : '');
}
function layoutJeuBar() {
  const bar = $('jeuBar'), g = $('goal'); if (!bar || !g) return;
  if (innerWidth <= 900) { const r = g.getBoundingClientRect(); bar.style.top = (r.height ? r.bottom + 10 : 110) + 'px'; }
  else bar.style.top = '';
}
addEventListener('resize', layoutJeuBar);

// ================= ENVELOPPES DES FONCTIONS EXISTANTES =================
renderQuests = (orig => function (box) {
  orig(box);
  const f = box.querySelector('.filters');
  if (f && !f.querySelector('[data-qv="succes"]')) { const n = achReady().length; f.insertAdjacentHTML('beforeend', `<button data-qv="succes" aria-pressed="${questView === 'succes'}">Succès${n ? ` <span class="fb">${n}</span>` : ''}</button>`); }
  if (questView === 'col' || questView === 'succes') {
    let el = f ? f.nextElementSibling : null; while (el) { const nx = el.nextElementSibling; el.remove(); el = nx; }
    box.insertAdjacentHTML('beforeend', questView === 'col' ? colsHTML() : achHTML());
  }
})(renderQuests);
renderNav = (orig => function () {
  orig();
  const b = document.querySelector('#nav [data-nav="quetes"]'); if (!b) return;
  const q = S.daily.quests.filter(x => x.prog >= x.goal && !x.claimed).length + collections().filter(c => !S.colClaimed[c.key] && c.names.every(n => S.dex[n])).length + achReady().length;
  const old = b.querySelector('.tb'); if (old) old.remove();
  if (q) b.insertAdjacentHTML('beforeend', `<i class="tb">${q}</i>`);
})(renderNav);
renderVoyage = (orig => function (box) {
  orig(box);
  const ev = todayEvent(); if (S.trips[S.sel]) return;
  let html = '';
  if (plan.dest && evApplies(ev, plan.dest.tags)) html = `<div class="evban"><span class="evi" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><p><b>${esc(ev.name)} !</b> Le butin est doublé ici aujourd’hui.</p></div>`;
  else if (!plan.dest) html = `<div class="evban"><span class="evi" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><p><b>Aujourd’hui : ${esc(ev.name)}.</b> ${esc(ev.short)}.</p></div>`;
  else if (ev.luck || ev.coins || ev.xp) html = `<div class="evban"><span class="evi" style="--ec:${evColor(ev)}">${evIcon(ev)}</span><p><b>${esc(ev.name)} :</b> ${esc(ev.short)}.</p></div>`;
  if (S.firstTripDay !== dayKey()) html += `<div class="evban" style="background:#e6f6e9;border-color:var(--greenD)"><span class="evi" style="--ec:#5fbf7f">${GIFT('#fff').replace('<svg ', '<svg style="width:20px;height:20px" ')}</span><p><b>Premier voyage du jour :</b> un objet peu commun ou mieux en bonus au retour.</p></div>`;
  if (html) box.insertAdjacentHTML('afterbegin', `<div class="evbans">${html}</div>`);
  if (ev.tags) box.querySelectorAll('[data-goplace]').forEach(b => { const p = PLACES[+b.dataset.goplace]; if (p && evApplies(ev, p.tags)) b.insertAdjacentHTML('beforeend', '<span class="x2" title="Butin doublé aujourd’hui">×2</span>'); });
})(renderVoyage);
let _goalMark = null;
renderGoal = (orig => function () {
  orig();
  try {
    const g = goalState(), mark = g.finished ? 'fin' : `${g.idx}:${g.doneN}`;
    if (_goalMark && mark !== _goalMark && !g.finished && g.doneN > 0 && _goalMark.split(':')[0] == g.idx) {
      const box = $('goal');
      if (box && !reduceMotion()) box.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.15) saturate(1.2)', offset: 0.3 }, { filter: 'brightness(1)' }], { duration: 800 });
      if (box) { const s = document.createElement('span'); s.className = 'gstep'; s.textContent = g.complete ? 'Chapitre terminé !' : 'Étape réussie !'; box.appendChild(s); s.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none', offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2200, fill: 'forwards' }); }
    }
    _goalMark = mark;
  } catch (e) {}
  layoutJeuBar();
})(renderGoal);
maybeIntro = (orig => function () {
  orig();
  window.__jeuReady = true;
  renderJeuBar();
  // succès et paliers déjà mérités avec une ancienne sauvegarde : accordés en silence au premier lancement
  if (!S.jeuInit) { const tt = checkTiers(); if (tt.length) setTimeout(() => toast(`Paliers de collection déjà atteints : +${tt.reduce((a, t) => a + t.coins, 0)} pièces !`), 1200); for (const a of ACH) if (achDone(a)) S.achSeen[a.id] = S.achSeen[a.id] || Date.now(); S.jeuInit = 1; save(); renderAll(); }
  setTimeout(runLogin, 700);
})(maybeIntro);

// ================= CLICS =================
document.addEventListener('click', ev => {
  const el = ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.closemodal === 'intro') setTimeout(runLogin, 500);
  if (d.jeu === 'event') return eventModal();
  if (d.jeu === 'goevent') return goEvent();
  if (d.jeu === 'login') return loginModal(null);
  if (d.jeu === 'ach') return openAchievements();
  if (d.ach) return claimAch(d.ach);
  if (d.claimq) { S.stats.qclaimed = (S.stats.qclaimed || 0) + 1; save(); }
  if (d.feed) { S.stats.fed = (S.stats.fed || 0) + 1; save(); }
  if (d.claimc) { S.tiers[d.claimc] = 3; renderJeuBar(); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && window.__jeuReady) { _evCache.dk = 0; renderJeuBar(); runLogin(); } });

// ================= VÉRIFICATION RÉGULIÈRE =================
setInterval(() => {
  if (!window.__jeuReady) return;
  if (!$('modal').hidden) return; // on attend la fin d'une fenêtre (le butin affiche déjà ses propres annonces)
  const tiers = checkTiers(), achs = checkAch();
  tiers.forEach(t => toast(tierText(t)));
  achs.forEach(achPop);
  if (tiers.length || achs.length) { renderTop(); renderNav(); renderJeuBar(); if (tab === 'quetes') renderPanel(); }
  else layoutJeuBar();
}, 1500);
window.__jeu = { setEvent: i => { _evCache = { dk: dayKey(), ev: EVENTS[i] }; renderJeuBar(); }, renderGoal: () => renderGoal(), todayEvent, EVENTS, ACH, checkTiers, checkAch, checkLogin, showHaul, coinFX, confetti, goalState };

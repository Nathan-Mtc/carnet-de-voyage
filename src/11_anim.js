// ================= VIE DES COMPAGNONS =================
// Portraits animés (respiration, clignements, oreilles, branchies), réactions au toucher,
// bulles de paroles. Chargé en dernier : enveloppe quelques fonctions existantes.
(function () {
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const still = () => !!(RM && RM.matches);

  // ---------- styles ----------
  const css = `
.cc .tilt{transition:transform .6s cubic-bezier(.3,1.4,.5,1)}
.cc.tl .tilt{transform:rotate(-5deg)}.cc.tr .tilt{transform:rotate(5deg)}
.cc.m-fier .tilt{transform:rotate(-4deg)}
.cc .eyes.eo.blink{animation:ccBlink .17s ease-in-out}
@keyframes ccBlink{50%{transform:scaleY(.08)}}
.sp-pistache .ear{animation:ccTwitch 5.3s ease-in-out infinite}
.sp-pistache .ear+.ear{animation-duration:6.9s;animation-delay:-2.3s}
@keyframes ccTwitch{0%,84%,100%{transform:rotate(0)}87%{transform:rotate(-10deg)}90%{transform:rotate(6deg)}93%{transform:rotate(-3deg)}96%{transform:rotate(0)}}
.sp-mochi .breath,.sp-mochi .bob{animation-duration:4.8s}
.sp-mochi .ear{animation:ccFlick 7.6s ease-in-out infinite}
.sp-mochi .ear+.ear{animation-duration:9.3s;animation-delay:-3.1s}
@keyframes ccFlick{0%,91%,100%{transform:rotate(0)}94%{transform:rotate(16deg)}97%{transform:rotate(-6deg)}}
.sp-bulle .breath,.sp-bulle .bob{animation-duration:2.7s}
.sp-bulle .wave{animation-duration:1.9s}
.sp-bulle .bubs{transform-box:view-box;animation:ccBubs 6.8s ease-out infinite}
@keyframes ccBubs{0%,60%{opacity:0;transform:translate(0,10px)}66%{opacity:1}92%{opacity:.85;transform:translate(7px,-24px)}100%{opacity:0;transform:translate(9px,-32px)}}
.twk{transform-box:fill-box;transform-origin:center;animation:ccTwk 1.5s ease-in-out infinite}
@keyframes ccTwk{0%,100%{transform:scale(.7);opacity:.7}50%{transform:scale(1.15);opacity:1}}
.cc.hop .root{transform-box:view-box;transform-origin:160px 334px;animation:ccHop .62s cubic-bezier(.3,1.3,.5,1)}
.cc.hop.soft .root{animation-name:ccHopSoft;animation-duration:.8s}
@keyframes ccHop{0%{transform:none}22%{transform:translateY(-34px) scale(.96,1.05)}50%{transform:translateY(0) scale(1.08,.92)}72%{transform:scale(.97,1.03)}100%{transform:none}}
@keyframes ccHopSoft{0%{transform:none}35%{transform:translateY(-12px)}70%{transform:scale(1.04,.96)}100%{transform:none}}
.cc.hop>ellipse{transform-box:fill-box;transform-origin:center;animation:ccShadow .62s ease-in-out}
@keyframes ccShadow{22%{transform:scale(.8);opacity:.7}}
.livep{display:block;line-height:0;box-sizing:content-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.livep svg{display:block;width:100%;height:100%}
.hc-btn .livep{position:absolute;top:5px;left:11px;width:44px;height:48px}
.tripcard .livep{width:56px;height:62px;flex:none;background:#f6e3c4;border-radius:14px;border:2px solid var(--ink);overflow:hidden}
.phead .livep{width:62px;height:68px;flex:none;background:#f6e3c4;border:2px solid var(--ink);border-radius:16px;overflow:hidden}
.gobar .livep{width:50px;height:54px;flex:none;background:#fff;border:2px solid var(--ink);border-radius:12px;overflow:hidden}
.livep:focus-visible{outline:3px solid #2f7f6c;outline-offset:2px}
#ccTalk{position:fixed;left:0;top:0;z-index:30;max-width:min(240px,calc(100vw - 32px));background:#fffaf0;border:3px solid var(--ink);border-radius:18px;padding:6px 13px 5px;font:700 15px/1.25 var(--display);color:var(--ink);box-shadow:0 4px 0 rgba(74,53,40,.35);pointer-events:none;opacity:0;transform:translateY(6px) scale(.92);transition:opacity .18s,transform .28s cubic-bezier(.3,1.6,.5,1);text-wrap:balance}
#ccTalk.on{opacity:1;transform:none}
#ccTalk::after{content:'';position:absolute;left:var(--ax,20px);width:12px;height:12px;background:#fffaf0;border:3px solid var(--ink);transform:rotate(45deg)}
#ccTalk.below::after{top:-9px;border-right:0;border-bottom:0}
#ccTalk:not(.below)::after{bottom:-9px;border-left:0;border-top:0}
.ccP{position:fixed;z-index:29;pointer-events:none;width:20px;height:20px;margin:-10px 0 0 -10px;animation:ccFloat 1.25s ease-out forwards}
.ccP svg{width:100%;height:100%;display:block}
@keyframes ccFloat{0%{opacity:0;transform:translate(0,4px) scale(.4)}18%{opacity:1;transform:translate(calc(var(--dx)*.3),calc(var(--dy,-62px)*.2)) scale(1.05)}100%{opacity:0;transform:translate(var(--dx),var(--dy,-62px)) scale(.85) rotate(var(--rot))}}
@media (prefers-reduced-motion:reduce){.cc *,.cc,.ccP,#ccTalk{animation:none!important;transition:none!important}.cc.tl .tilt,.cc.tr .tilt{transform:none}.ccP{display:none}}
`;
  const st = document.createElement('style');
  st.id = 'ccAnim'; st.textContent = css; document.head.appendChild(st);

  // ---------- portraits vivants (SVG en ligne à la place des <img>) ----------
  const uriInfo = new Map();
  const _portraitURI = portraitURI;
  portraitURI = function (k, mood = 'content') {
    const u = _portraitURI(k, mood);
    if (!uriInfo.has(u)) uriInfo.set(u, [k, mood]);
    return u;
  };
  let uidN = 0;
  const svgFor = (k, mood) => drawChar(k, S.outfits[k], mood, 'lv' + (++uidN) + '_');
  const asleep = k => isNight() && !S.trips[k];
  function liven(root, ctx) {
    if (!root) return;
    root.querySelectorAll('img').forEach(img => {
      const inf = uriInfo.get(img.getAttribute('src')); if (!inf) return;
      const k = inf[0];
      const mood = inf[1] === 'content' && ctx !== 'panel' && asleep(k) ? 'dodo' : inf[1];
      const sp = document.createElement('span');
      sp.className = 'livep'; sp.dataset.k = k; sp.dataset.mood = mood;
      if (ctx === 'hud') sp.setAttribute('aria-hidden', 'true');
      else { sp.tabIndex = 0; sp.setAttribute('role', 'button'); sp.setAttribute('aria-label', `Câliner ${CHARS[k].name}`); }
      sp.innerHTML = svgFor(k, mood);
      img.replaceWith(sp);
    });
  }
  const _renderComps = renderComps;
  renderComps = function () { const r = _renderComps.apply(this, arguments); liven($('hudComps'), 'hud'); return r; };
  const _renderTripCard = renderTripCard;
  renderTripCard = function () { const r = _renderTripCard.apply(this, arguments); liven($('tripCard'), 'trip'); return r; };
  const _renderPanel = renderPanel;
  renderPanel = function () { const r = _renderPanel.apply(this, arguments); liven($('panelBody'), 'panel'); return r; };

  // ---------- vie au repos ----------
  const nextBlink = new WeakMap();
  const onScreen = el => {
    const svg = el.ownerSVGElement || el; const r = svg.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  function blink(el) { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 190); }
  setInterval(() => {
    if (still() || document.hidden) return;
    const now = performance.now();
    document.querySelectorAll('.cc .eyes.eo').forEach(el => {
      const n = nextBlink.get(el);
      if (n === undefined) { nextBlink.set(el, now + rnd(400, 4000)); return; }
      if (now < n || !onScreen(el)) return;
      blink(el);
      if (Math.random() < 0.2) setTimeout(() => blink(el), 300);
      nextBlink.set(el, now + rnd(1800, 6500));
    });
  }, 220);

  function idle() {
    setTimeout(idle, rnd(3500, 8000));
    if (still() || document.hidden) return;
    const list = [...document.querySelectorAll('svg.cc')].filter(s => !s.classList.contains('hop') && !s.classList.contains('m-dodo') && onScreen(s));
    if (!list.length) return;
    const svg = pick(list), sp = svg.parentElement;
    if (sp && sp.classList.contains('livep') && sp.dataset.mood === 'content' && !sp._busy && Math.random() < 0.3) {
      setMood(sp, 'curieux'); sp._busy = true;
      sp._t = setTimeout(() => { sp._busy = false; if (sp.isConnected) setMood(sp, sp.dataset.mood); }, 2400);
      return;
    }
    const c = Math.random() < 0.5 ? 'tl' : 'tr';
    svg.classList.add(c); setTimeout(() => svg.classList.remove(c), rnd(1200, 2200));
  }
  setTimeout(idle, 3000);

  // ---------- réactions au toucher ----------
  function setMood(sp, mood) { sp.innerHTML = svgFor(sp.dataset.k, mood); return sp.querySelector('svg.cc'); }
  function hop(svg, soft) {
    if (!svg || still()) return;
    svg.classList.remove('hop', 'soft'); void svg.getBoundingClientRect();
    svg.classList.add('hop'); if (soft) svg.classList.add('soft');
    clearTimeout(svg._hop); svg._hop = setTimeout(() => svg.classList.remove('hop', 'soft'), 850);
  }
  const L = '#6b4a3c';
  // bulles et particules dans le cadre du jeu, sous les fenêtres (#modal, z-index 40)
  const layer = () => document.querySelector('.game') || document.body;
  const PART = {
    heart: () => `<svg viewBox="0 0 20 20"><path d="${heartD(10, 9, 6)}" fill="#f27a9a" stroke="${L}" stroke-width="1.4"/></svg>`,
    apple: () => `<svg viewBox="0 0 20 20"><circle cx="10" cy="12" r="6.5" fill="#ef6b5e" stroke="${L}" stroke-width="1.4"/><path d="M10 6 q1 -3 3 -4" stroke="${L}" stroke-width="1.4" fill="none"/><path d="M11 5 q4 -3 6 0 q-3 2 -6 0Z" fill="#8cc47a" stroke="${L}" stroke-width="1"/><circle cx="7.5" cy="10" r="1.5" fill="#fff" opacity=".7"/></svg>`,
    bread: () => `<svg viewBox="0 0 20 20"><path d="M3 13 C3 6 17 6 17 13 Q17 16 10 16 Q3 16 3 13Z" fill="#e8b46a" stroke="${L}" stroke-width="1.4"/><path d="M7 9 l1.5 2 M10 8.5 l1.5 2 M13 9 l1.5 2" stroke="${L}" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    citrus: () => `<svg viewBox="0 0 20 20"><circle cx="10" cy="11" r="7" fill="#f7b367" stroke="${L}" stroke-width="1.4"/><path d="M10 4 C12 1 15 1 16 3 C14 4.5 12 4.5 10 4Z" fill="#a6cf8e" stroke="${L}" stroke-width="1"/><circle cx="7.5" cy="9" r="1.6" fill="#fff" opacity=".55"/></svg>`,
    tea: () => `<svg viewBox="0 0 20 20"><path d="M4 9 H14 V13 Q14 17 9 17 Q4 17 4 13Z" fill="#fff8f0" stroke="${L}" stroke-width="1.4"/><path d="M14 10.5 q3.5 0 3 2.5 q-.5 2 -3 1.5" fill="none" stroke="${L}" stroke-width="1.4"/><path d="M7 7 q-1 -2 0 -4 M11 7 q-1 -2 0 -4" stroke="#b9a99a" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`,
    bubble: () => `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#e9f7ff" stroke="#7a4e5c" stroke-width="1.4"/><path d="M6.5 8 q1 -2.5 3.5 -3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
    icecream: () => `<svg viewBox="0 0 20 20"><path d="M6 10 L10 19 L14 10Z" fill="#e8b46a" stroke="${L}" stroke-width="1.3" stroke-linejoin="round"/><circle cx="10" cy="8" r="5" fill="#f9c6d6" stroke="${L}" stroke-width="1.3"/><circle cx="8.3" cy="6.5" r="1.3" fill="#fff" opacity=".7"/></svg>`,
    zz: () => `<svg viewBox="0 0 20 20"><text x="4" y="16" font-family="Fredoka,sans-serif" font-weight="700" font-size="16" fill="#fff" stroke="${L}" stroke-width="1.6" paint-order="stroke">z</text></svg>`,
  };
  const TREATS = { pistache: ['apple', 'apple', 'bread'], mochi: ['citrus', 'tea'], bulle: ['bubble', 'bubble', 'icecream'] };
  function burst(el, k, kind) {
    if (still()) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.3;
    const n = k === 'mochi' ? 4 : 6, top = r.top < 90;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      const type = kind === 'sleep' ? (i % 2 ? 'zz' : 'heart') : (i % 2 ? pick(TREATS[k]) : 'heart');
      p.className = 'ccP'; p.innerHTML = PART[type]();
      p.style.left = (cx + rnd(-r.width * 0.35, r.width * 0.35)) + 'px';
      p.style.top = (cy + rnd(-6, 10)) + 'px';
      p.style.setProperty('--dx', (top ? rnd(-44, 44) : rnd(-26, 26)).toFixed(0) + 'px');
      if (top) p.style.setProperty('--dy', rnd(-26, -14).toFixed(0) + 'px');
      p.style.setProperty('--rot', rnd(-25, 25).toFixed(0) + 'deg');
      p.style.animationDelay = (i * 0.07 + rnd(0, 0.06)).toFixed(2) + 's';
      layer().appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  }
  let talk = null;
  function say(el, text) {
    if (!talk) { talk = document.createElement('div'); talk.id = 'ccTalk'; talk.setAttribute('role', 'status'); layer().appendChild(talk); }
    talk.textContent = text;
    talk.classList.remove('on');
    talk.style.transition = 'none';
    const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const tw = talk.offsetWidth, th = talk.offsetHeight;
    const below = r.top < H * 0.42;
    const ax = r.left + r.width / 2;
    const x = Math.max(16, Math.min(W - 16 - tw, ax - 30));
    const y = below ? r.bottom + 12 : Math.max(8, r.top - th - 12);
    talk.style.left = x + 'px'; talk.style.top = y + 'px';
    talk.style.setProperty('--ax', Math.max(12, Math.min(tw - 30, ax - x - 9)) + 'px');
    talk.classList.toggle('below', below);
    void talk.offsetWidth; talk.style.transition = '';
    requestAnimationFrame(() => talk.classList.add('on'));
    clearTimeout(say.t); say.t = setTimeout(() => talk.classList.remove('on'), Math.max(2400, 900 + text.length * 55));
  }
  const lastLine = {};
  function lineFor(k, sleeping) {
    const ch = CHARS[k], ln = ch.lines, t = S.trips[k];
    let pool = ln.tap;
    if (sleeping) pool = (ln.night || []).concat(ln.wake || []);
    else if (t && !t.done) pool = (ln.away || []).concat(ln.tap.slice(0, 2));
    let l = pick(pool), tries = 0;
    while (pool.length > 1 && l === lastLine[k] && tries++ < 6) l = pick(pool);
    return (lastLine[k] = l);
  }
  const TAP_MOODS = { pistache: ['rire', 'amour', 'curieux', 'rire'], mochi: ['amour', 'fier', 'content'], bulle: ['rire', 'amour', 'surpris', 'rire'] };
  function react(sp, anchor) {
    const k = sp.dataset.k, sleeping = sp.dataset.mood === 'dodo';
    const mood = sleeping ? (Math.random() < 0.5 ? 'surpris' : 'dodo') : pick(TAP_MOODS[k]);
    clearTimeout(sp._t); sp._busy = true;
    const svg = setMood(sp, mood);
    hop(svg, k === 'mochi' || sleeping);
    burst(sp, k, sleeping ? 'sleep' : '');
    say(anchor || sp, lineFor(k, sleeping));
    sp._t = setTimeout(() => { sp._busy = false; if (sp.isConnected) setMood(sp, sp.dataset.mood); }, 2200);
  }

  document.addEventListener('click', ev => {
    const hb = ev.target.closest('.hc-btn[data-sel]');
    if (hb) {
      // le gestionnaire principal a déjà redessiné le HUD : on retrouve le nouveau portrait
      const sp = document.querySelector(`#hudComps .hc-btn[data-sel="${hb.dataset.sel}"] .livep`);
      if (sp) react(sp, sp.closest('.hc-btn'));
      return;
    }
    const sp = ev.target.closest('.livep');
    if (sp) { react(sp); return; }
    const hc = ev.target.closest('[data-hc]');
    if (hc) { const svg = hc.querySelector('svg.cc'); hop(svg, hc.dataset.hc === 'mochi'); burst(hc, hc.dataset.hc, ''); }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const sp = ev.target.closest && ev.target.closest('.livep[role="button"]');
    if (sp) { ev.preventDefault(); react(sp); }
  });
})();

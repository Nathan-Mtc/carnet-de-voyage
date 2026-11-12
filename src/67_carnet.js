// ================= 67 · LE CARNET : UN SEUL ENDROIT POUR TOUT COMPRENDRE (v45) =================
// Le joueur (12/11) : « on a tellement d'éléments, tellement d'infos diverses ; il faudrait un guide, comme le
// "comment ça marche", avec les icônes, le tuto… » + « un carnet des spécialités culinaires et des vêtements signature ».
// Le menu (« Le carnet », bouton en haut de la colonne de droite) devient 5 sous-onglets :
//   Guide (fiches courtes + légende des icônes + Revoir le tutoriel) · Adresses (bonnes adresses et spécialités)
//   · Collections (codex + passeport, sortis de l'album) · Histoire (carnet d'Augustine) · Menu (récompenses, réglages).
let cnView = 'guide', cnF = 'tout';
Object.assign(NAV_ICONS, {
  cguide: '<circle cx="15" cy="15" r="11" fill="#9fd1d6" stroke="currentColor" stroke-width="2"/><path d="M15 7 L18 15 L15 23 L12 15Z" fill="#e0533d" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="15" cy="15" r="1.8" fill="#fff"/>',
  cadr: '<path d="M7 4 H22 a2 2 0 0 1 2 2 V25 a2 2 0 0 1 -2 2 H7Z" fill="#f6c445" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 4 V27" stroke="currentColor" stroke-width="2"/><path d="M15.5 9 l1.6 3.2 3.5 .5 -2.5 2.5 .6 3.5 -3.2 -1.7 -3.2 1.7 .6 -3.5 -2.5 -2.5 3.5 -.5Z" fill="#fff" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
  chist: '<path d="M5 6 Q10 4 15 7 Q20 4 25 6 V25 Q20 23 15 26 Q10 23 5 25Z" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 7 V26" stroke="currentColor" stroke-width="1.6"/><path d="M8 11 H12 M8 15 H12 M18 11 H22 M18 15 H22" stroke="#c9a35a" stroke-width="1.6" stroke-linecap="round"/>',
  cgift: '<rect x="5" y="12" width="20" height="14" rx="2" fill="#f08aa6" stroke="currentColor" stroke-width="2"/><rect x="3.5" y="8" width="23" height="5" rx="1.5" fill="#f6c445" stroke="currentColor" stroke-width="2"/><path d="M15 8 V26" stroke="currentColor" stroke-width="2"/><path d="M15 8 Q10 2 8 5 Q7 8 15 8 Q20 2 22 5 Q23 8 15 8Z" fill="#fff" stroke="currentColor" stroke-width="1.6"/>',
  creg: '<circle cx="15" cy="15" r="5" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M15 3 V7 M15 23 V27 M3 15 H7 M23 15 H27 M6.5 6.5 L9.3 9.3 M20.7 20.7 L23.5 23.5 M6.5 23.5 L9.3 20.7 M20.7 9.3 L23.5 6.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
});
SUBTABS.menu = [['guide', 'Guide', 'cguide'], ['adresses', 'Adresses', 'cadr'], ['col', 'Collections', 'col'], ['hist', 'Histoire', 'chist'], ['reglages', 'Cadeaux', 'cgift']];
getSub = (orig => function (t) { return t === 'menu' ? cnView : orig.apply(this, arguments); })(getSub);
setSub = (orig => function (t, sub) { if (t === 'menu') { if (sub) cnView = sub; return; } return orig.apply(this, arguments); })(setSub);
// une récompense à récupérer : pastille sur « Menu », et c'est lui qui s'ouvre
subDot = (orig => function (t, k) { if (t === 'menu' && k === 'reglages') return cn$(() => pendingRewards().length > 0, false); return orig.apply(this, arguments); })(subDot);
const cn$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
openSheet = (orig => function (name) {
  if (name === 'menu' && typeof tab !== 'undefined' && tab !== 'menu' && cn$(() => pendingRewards().length > 0, false)) cnView = 'reglages';
  return orig.apply(this, arguments);
})(openSheet);

// ---------------- Guide ----------------
const CN_FICHES = [
  ['🧭', 'Voyager', 'Touchez un lieu sur la carte, puis « Partir ». La <b>portée</b> (en km) dit jusqu’où un compagnon peut aller. Avant de partir, regardez le <b>% de risque</b> : un terrain difficile demande du matériel. Bloqué ? Le bouton <b>Me guider</b> montre quoi faire.'],
  ['⭐', 'Les étoiles des lieux', 'Chaque lieu a sa qualité, découverte à la première visite. <b>★★</b> : butin ×1,5, pièces ×2. <b>★★★</b> : butin ×2, pièces ×3, objet rare garanti. Les étoiles s’affichent ensuite sur l’épingle du lieu.'],
  ['🍳', 'Votre commerce', 'Au <b>Comptoir</b>, préparez des plats avec vos ingrédients : les clients les achètent. Les ingrédients courants sont à l’<b>épicerie du Magasin</b>. Les <b>spécialités</b> des bonnes adresses débloquent des <b>recettes signature</b>, vendues 2,5 fois plus cher.'],
  ['🎒', 'Les objets', 'Chaque objet porte une petite pastille qui dit à quoi il sert (voir la légende plus bas). Touchez-le dans le sac pour ouvrir sa fiche : l’utiliser, le vendre ou le recycler.'],
  ['👕', 'Les vêtements', 'Un vêtement porté aide vraiment en voyage (moins de risques ou plus de butin). Les <b>pièces signature</b> des boutiques de vêtements ★★ et ★★★ sont les plus fortes.'],
  ['🥚', 'Familiers et œufs', 'Les œufs se trouvent en voyage : plus souvent avec un <b>appât</b> et dans les lieux étoilés. Ils éclosent à la nurserie. Un familier nourri et heureux trouve de meilleurs objets.'],
  ['🏠', 'Le foyer', 'Posez vos décorations au foyer : le <b>confort</b> rend vos compagnons plus efficaces en voyage.'],
  ['🌫️', 'Le brouillard', 'La carte commence dans le brouillard. Chaque voyage dégage un cercle autour du lieu visité, au retour.'],
  ['📖', 'L’histoire', 'Le carnet d’Augustine vous mène de lieu en lieu. La bannière en bas de la carte dit toujours où aller ensuite.'],
];
const CN_FC = ['#5f8fb8', '#e0a01e', '#e0784a', '#8a6fc4', '#d9739a', '#5fa274', '#b07a4f', '#7a8aa8', '#c9a35a'];
const CN_PILLS = [['cuisiner', 'sert à cuisiner au commerce'], ['construire', 'sert à fabriquer ou construire'], ['porter', 'se porte (bonus en voyage)'], ['expedition', 'matériel ou provision de voyage'],
  ['familier', 'pour nourrir ou attirer un familier'], ['planter', 'se sème au jardin'], ['offrande', 'à offrir à un gardien'], ['confort', 'décoration du foyer (confort)'], ['vendre', 'surtout à vendre'], ['recycler', 'à recycler en matériaux']];
const CN_MAP = [['<b class="cn-ck">✓</b>', 'lieu déjà visité (★)'], ['<b class="cn-st">★★</b>', 'bonne adresse, déjà visitée'], ['<b class="cn-rd"></b>', 'la prochaine chose à faire'], ['<b class="cn-new">Nouveau</b>', 'objet jamais vu avant'], ['<b class="cn-pct">20 %</b>', 'risque du voyage (cercle avant de partir)']];
function cnGuideHTML() {
  const pills = CN_PILLS.filter(([k]) => typeof US_K !== 'undefined' && US_K[k]).map(([k, t]) => `<div class="cn-lg">${cn$(() => usPill(k), '')}<span><b>${esc(US_K[k].nom)}</b> · ${t}</span></div>`).join('');
  return `<div class="cn-tuto"><b>Nouveau ici, ou un peu perdu ?</b><button class="btn green sm" data-tu="replay">Revoir le tutoriel</button></div>
    <div class="cn-fiches">${CN_FICHES.map(([ic, t, x], i) => `<details class="cn-f" style="--fc:${CN_FC[i % CN_FC.length]}"${i === 0 ? ' open' : ''}><summary><span class="cn-fi">${ic}</span><b>${t}</b></summary><p>${x}</p></details>`).join('')}</div>
    <h3 class="cn-h">Les pastilles des objets</h3><div class="cn-lgs">${pills}</div>
    <h3 class="cn-h">Sur la carte et dans les écrans</h3><div class="cn-lgs">${CN_MAP.map(([s, t]) => `<div class="cn-lg"><span class="cn-sym">${s}</span><span>${t}</span></div>`).join('')}</div>`;
}

// ---------------- Adresses : bonnes adresses et spécialités ----------------
function cnAdrHTML() {
  const V = cn$(() => sgState().v, {}), R0 = cn$(() => sgsR(), {}), CL = cn$(() => sgState().cl || {}, {});
  const all = Object.keys(V).map(key => { const d = V[key].d || {}, G = cn$(() => sgOf(d), null), X = cn$(() => sgsOf(d), null); return G ? { key, d, G, X, e: V[key] } : null; }).filter(Boolean);
  const good = all.filter(x => x.G.s >= 2).sort((a, b) => b.G.s - a.G.s || (b.e.at || 0) - (a.e.at || 0));
  const food = good.filter(x => x.X && !x.X.cloth), cloth = good.filter(x => x.X && x.X.cloth);
  const list = cnF === 'cuisine' ? food : cnF === 'vetements' ? cloth : good;
  const chip = (k, l, n) => `<button class="cn-chip${cnF === k ? ' on' : ''}" data-cnf="${k}">${l} <small>${n}</small></button>`;
  const row = x => {
    const has = x.X ? (x.X.cloth ? !!CL[x.X.id] : !!R0[x.X.id]) : false, inv = x.X ? (S.inv || []).filter(it => it.sgId === x.X.id).length : 0;
    const sp = x.X ? `<small class="cn-sp">${x.X.cloth ? '👕' : '🍳'} ${esc(x.X.dish)}${has ? (x.X.cloth ? ' · ✓ obtenue' : ` · ✓ recette apprise${inv ? ` · ${inv} en stock` : ''}`) : ''}</small>` : `<small>${cn$(() => SG_FX[x.G.s].txt, '')}</small>`;
    return `<div class="sg-r s${x.G.s}"><span class="sg-s">${'★'.repeat(x.G.s)}</span><span class="sg-t"><b>${esc(x.d.name || '')}</b>${sp}</span><button class="btn cream sm" data-sggo="${esc(x.key)}">Y aller</button></div>`;
  };
  return `<p class="cn-intro">${all.length} lieu${all.length > 1 ? 'x' : ''} visité${all.length > 1 ? 's' : ''} · <b>${food.length}</b> spécialité${food.length > 1 ? 's' : ''} culinaire${food.length > 1 ? 's' : ''} · <b>${cloth.length}</b> pièce${cloth.length > 1 ? 's' : ''} signature</p>
    <div class="cn-chips">${chip('tout', 'Toutes', good.length)}${chip('cuisine', 'Cuisine', food.length)}${chip('vetements', 'Vêtements', cloth.length)}</div>
    ${list.length ? list.map(row).join('') : `<p class="sg-none">${good.length ? 'Rien dans cette catégorie pour l’instant.' : 'Pas encore de bonne adresse ★★ ou ★★★. Les meilleures se cachent parfois un peu plus loin : explorez !'}</p>`}`;
}

// ---------------- le rendu du carnet ----------------
if (typeof renderMenu === 'function') renderMenu = (orig => function (box) {
  if (cnView === 'reglages' || !SUBTABS.menu.some(x => x[0] === cnView)) {
    const r = orig.apply(this, arguments);
    try {
      // « Récompenses » : on enlève l'aide (dans Guide) et « Ma progression » (doublon de Collections) ; les réglages se replient en bas
      box.querySelectorAll('.msec').forEach(s => {
        const h3 = s.querySelector('header h3'), t = h3 ? h3.textContent.trim() : '';
        if (s.querySelector('[data-tu="replay"]') || /^Ma progression/.test(t)) { s.remove(); return; }
        if (/^Réglages/.test(t)) { const d = document.createElement('details'); d.className = 'msec cn-set'; d.innerHTML = `<summary>⚙️ Réglages</summary>`; [...s.children].forEach((c, i) => { if (i > 0) d.appendChild(c); }); s.replaceWith(d); }
      });
      if (!box.querySelector('.msec.hot')) box.insertAdjacentHTML('afterbegin', `<div class="cn-hero gift"><span class="cn-hi">🎁</span><div><b>Rien à récupérer pour l’instant</b><small>Paliers de collection, succès et cadeaux du jour arrivent ici.</small></div></div>`);
      const wrap = document.createElement('div'); wrap.className = 'cn cn-rw'; while (box.firstChild) wrap.appendChild(box.firstChild); box.appendChild(wrap);
    } catch (e) { console.error('carnet récompenses', e); }
    return r;
  }
  let h = '';
  try {
    const HERO = { guide: ['🧭', 'Le guide du voyageur', 'Tout ce qu’il faut savoir, en quelques lignes.'], adresses: ['📒', 'Mes bonnes adresses', 'Les lieux qui valent le détour, et leurs spécialités.'], col: ['🏅', 'Mes collections', 'Tampons, objets découverts et paliers.'], hist: ['📖', 'Le carnet d’Augustine', 'Son voyage, page après page.'] }[cnView];
    if (HERO) h += `<div class="cn-hero"><span class="cn-hi">${HERO[0]}</span><div><b>${HERO[1]}</b><small>${HERO[2]}</small></div></div>`;
    if (cnView === 'guide') h += cnGuideHTML();
    else if (cnView === 'adresses') h += cnAdrHTML();
    else if (cnView === 'col') h += cn$(() => pgPassHTML(), '') + cn$(() => colsHTML(), '');
    else if (cnView === 'hist') h += cn$(() => styHistHTML(), '<p class="empty">L’histoire commence après le tutoriel.</p>');
  } catch (e) { console.error('carnet', e); h = '<p class="empty">Oups, cette page n’a pas pu s’afficher.</p>'; }
  box.innerHTML = `<div class="cn">${h}</div>`;
})(renderMenu);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-cnf]'); if (!b) return;
  ev.stopPropagation(); cnF = b.dataset.cnf;
  const p = $('panelBody'), y = p ? p.scrollTop : 0; renderPanel(); if (p) p.scrollTop = y;
}, true);
// l'album ne garde que les cartes postales (passeport et carnet d'adresses sont dans le Carnet)
if (typeof renderAlbum === 'function') renderAlbum = (orig => function (box) { const r = orig.apply(this, arguments); try { box.querySelectorAll('.pg-pass, .sg-book').forEach(e => e.remove()); } catch (e) {} return r; })(renderAlbum);
try { const g = document.getElementById('gear'); if (g) { g.title = 'Le carnet : guide, adresses, collections, histoire, menu'; g.setAttribute('aria-label', 'Le carnet'); } } catch (e) {}
{
  const st = document.createElement('style');
  st.textContent = `.cn{background:#fdf6e8 repeating-linear-gradient(0deg,transparent 0 27px,rgba(150,120,80,.07) 27px 28px);border-radius:16px;padding:8px}
.cn{display:flex;flex-direction:column;gap:9px}
.cn-hero{display:flex;align-items:center;gap:12px;padding:12px 14px;border:2.5px solid var(--ink,#4a3528);border-radius:18px;background:linear-gradient(135deg,#fff7e0,#ffe9c2);box-shadow:0 3px 0 rgba(74,53,40,.22);position:relative;overflow:hidden}
.cn-hero::after{content:'';position:absolute;right:-18px;top:-18px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.35)}
.cn-hero.gift{background:linear-gradient(135deg,#fdeef3,#ffe2ea)}
.cn-hi{flex:none;width:44px;height:44px;border-radius:14px;background:#fff;border:2px solid var(--ink,#4a3528);display:flex;align-items:center;justify-content:center;font-size:24px;transform:rotate(-4deg)}
.cn-hero b{display:block;font:800 17px var(--display,inherit);color:var(--ink,#4a3528)}.cn-hero small{font-size:12.5px;color:var(--ink2,#7a6250)}
.cn-f{border-left:6px solid var(--fc,#c9a35a)!important;box-shadow:0 2px 0 rgba(74,53,40,.12)}
.cn-f .cn-fi{width:30px;height:30px;border-radius:50%;background:color-mix(in srgb,var(--fc,#c9a35a) 18%,#fff);display:flex;align-items:center;justify-content:center;font-size:16px}
.cn-rw .msec{border-radius:16px}.cn-set{border:2px solid var(--line,#e7dccb);border-radius:14px;background:#fff;padding:4px 10px}
.cn-set summary{cursor:pointer;padding:6px 0;font:800 14px var(--display,inherit);color:var(--ink,#4a3528)}
.cn-lgs{grid-template-columns:1fr 1fr!important}@media (max-width:360px){.cn-lgs{grid-template-columns:1fr!important}}
.cn-tuto{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:2px dashed #cfe0bd;border-radius:14px;background:#f4fbef}.cn-tuto b{font:800 13.5px var(--display,inherit);color:var(--ink,#4a3528)}
.cn-fiches{display:flex;flex-direction:column;gap:6px}
.cn-f{border:2px solid var(--line,#e7dccb);border-radius:14px;background:#fff;padding:0 10px}
.cn-f summary{display:flex;align-items:center;gap:8px;padding:8px 0;cursor:pointer;list-style:none}.cn-f summary::-webkit-details-marker{display:none}
.cn-f summary b{font:800 14.5px var(--display,inherit);color:var(--ink,#4a3528)}.cn-f summary::after{content:'▾';margin-left:auto;color:#b5a08a}.cn-f[open] summary::after{content:'▴'}
.cn-fi{font-size:18px;width:24px;text-align:center}.cn-f p{margin:0 0 9px;font-size:13.5px;line-height:1.4;color:var(--ink2,#7a6250)}.cn-f p b{color:var(--ink,#4a3528)}
.cn-h{margin:6px 2px 0;font:800 13px var(--body,system-ui);letter-spacing:.04em;text-transform:uppercase;color:#9a8470}
.cn-lgs{display:grid;grid-template-columns:1fr;gap:4px}
.cn-lg{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:10px;background:#fffaf0;font-size:13px;color:var(--ink2,#7a6250)}.cn-lg b{color:var(--ink,#4a3528)}
.cn-lg .uspill{flex:none}.cn-sym{flex:none;min-width:44px;display:flex;justify-content:center}
.cn-ck{display:inline-block;width:16px;height:16px;border-radius:50%;background:#4fa765;color:#fff;font:800 10px/16px system-ui;text-align:center}
.cn-lg .cn-st{color:#e0a01e;font-size:14px;letter-spacing:-1px}.cn-rd{display:inline-block;width:12px;height:12px;border-radius:50%;background:#e0533d;border:2px solid #fff;box-shadow:0 0 0 1px #c9403a}
.cn-new{font:800 10px var(--body,system-ui);color:#fff;background:#e0789a;border-radius:999px;padding:1px 6px;text-transform:uppercase}.cn-pct{font:800 11px var(--body,system-ui);color:var(--ink,#4a3528);border:2px solid #d9733f;border-radius:999px;padding:0 5px}
.cn-intro{margin:0 2px;font-size:13px;color:var(--ink2,#7a6250)}
.cn-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:2px}
.cn-chip{padding:5px 10px;border:2px solid var(--line,#e2d3bd);border-radius:999px;background:#fff;font:800 12.5px var(--body,system-ui);color:#8a7462;cursor:pointer}.cn-chip small{font-weight:700;opacity:.75}
.cn-chip.on{border-color:var(--ink,#4a3528);background:#fff3c9;color:var(--ink,#4a3528)}
.cn .sg-r{margin:0}
#modal li.ach{display:block}#modal li.ach b{display:inline}.cn-sp{font-weight:700;color:#8a5a00!important}`;
  document.head.appendChild(st);
}

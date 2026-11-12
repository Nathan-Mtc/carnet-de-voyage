// ================= 65 · LES BONNES ADRESSES : LES ÉTOILES DE CHAQUE LIEU (v44d) =================
// Le joueur : « je veux qu'on aille dans CE café et pas un autre parce qu'il y a une raison ; qu'on préfère faire 59 km
// plutôt que 2 ». Première version (spécialités + 9 talents) jugée trop chargée et trop faible. Version retenue (12/11) :
// UNE SEULE RÈGLE — chaque vrai lieu a une qualité fixe de ★ à ★★★, la même pour tous les joueurs (tirée du lieu),
// et les étoiles MULTIPLIENT ce qu'on y gagne :
//   ★   (≈ 75 %) : normal
//   ★★  (≈ 20 %) : objets ×1,5 · 1 peu commun garanti · pièces ×2 · exp. +50 % · œufs/rencontres plus fréquents
//   ★★★ (≈ 5 %)  : objets ×2 · 1 rare garanti (chance d'épique) · pièces ×3 · exp. ×2 · œufs ×2 · Trophée de la pépite (1re visite)
// Lieux du quotidien : presque toujours ★. Un lieu épuisé (50_difficulte.js) le reste : il faut alterner.
// Affichage : étoiles sur l'épingle d'un lieu visité (carte), une ligne dans « Le lieu », une pastille au retour
// (« ★★★ ×2 »), « Pépite ! » à la 1re découverte d'une ★★★, et le carnet d'adresses (album). Rien d'autre.
const SG_FX = [null,
  null,
  { loot: 1.5, rar: 1, coins: 2, xp: 1.5, egg: 0.5, txt: 'butin ×1,5 · pièces ×2 · exp. +50 %' },
  { loot: 2, rar: 2, coins: 3, xp: 2, egg: 1, txt: 'butin ×2 · pièces ×3 · exp. ×2' }];
const sg$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
function sgState() { if (!S.sig || typeof S.sig !== 'object') S.sig = { v: {} }; if (!S.sig.v) S.sig.v = {}; return S.sig; }
const sgKey = d => (d.id ? 'i:' + d.id : 'n:' + String(d.name).slice(0, 40) + '@' + (+d.lon).toFixed(3) + ',' + (+d.lat).toFixed(3));
function sgRnd(key, salt) { let h = 2166136261; const s = key + '|' + salt; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
const sgStars = n => '★'.repeat(n);
function sgOf(d) {
  if (!d || !d.name || d.lon == null || d.home) return null;
  const key = sgKey(d), r = sgRnd(key, 'q');
  return { key, s: d.poi ? (r < 0.02 ? 3 : r < 0.12 ? 2 : 1) : (r < 0.05 ? 3 : r < 0.25 ? 2 : 1) };
}
function sgCopy(d) { const o = {}; Object.keys(d).forEach(k => { const v = d[k]; if (v == null || ['string', 'number', 'boolean'].includes(typeof v) || (Array.isArray(v) && v.length < 12 && v.every(x => x == null || typeof x !== 'object'))) o[k] = v; }); return o; }

// ---------------- au retour : les étoiles multiplient le butin, les pièces et l'expérience ----------------
let sgHaul = null;
if (typeof collect === 'function') collect = (orig => function () {
  sgHaul = null;
  try {
    const k = S.sel, t = S.trips[k];
    if (t && t.done && !t.tuto && !t.sgL && Array.isArray(t.bag) && t.dest) {
      t.sgL = 1;
      const d = t.dest, G = sgOf(d);
      if (G) {
        const V = sgState().v, fresh = !V[G.key], F = SG_FX[G.s];
        if (F && !t.xpFail) {
          const tags = d.tags || ['campagne'], base = t.bag.filter(it => !it.special && !it.mk && !it.sgT).length;
          const add = Math.min(10, Math.round(base * (F.loot - 1)) || 1);
          t.bag.push(...lootFor(tags, t.luck || 0, d.name, add, k));
          // la rareté garantie : le meilleur objet du sac monte au moins au cran promis (★★★ : 1 chance sur 4 d'épique)
          const tgt = G.s === 3 && Math.random() < 0.25 ? 3 : F.rar;
          const pool = t.bag.filter(it => !it.special && !it.mk && !it.edition).sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
          if (pool[0] && (pool[0].rarity || 0) < tgt) pool[0].rarity = tgt;
          if (t.coins > 0) t.coins = Math.round(t.coins * F.coins); else t.coins = 10 * G.s;
          t.xp = Math.max(0, Math.round(((t.xp || 0) + 15) * F.xp - 15));
          if (G.s === 3 && fresh) { // le trophée de la pépite : unique, du confort au foyer, se revend cher
            const tr = makeItem([`Trophée de la pépite · ${String(d.name).slice(0, 28)}`, 'd', 'statue', 3, null, '#e3b23c'], 0, d.name, tags, { fixed: 3 });
            tr.sgT = 1; t.bag.push(tr);
          }
        }
        if (fresh) V[G.key] = { at: Date.now(), n: 1, d: sgCopy(d) }; else { V[G.key].n = (V[G.key].n || 1) + 1; V[G.key].at = Date.now(); }
        sgHaul = { k, s: G.s, mul: F ? F.loot : 1, pep: G.s === 3 && fresh };
      }
    }
  } catch (e) { console.error('adresses', e); }
  const r = orig.apply(this, arguments);
  setTimeout(() => sg$(() => refreshPOIs(true), 0), 50); // l'épingle affiche ses étoiles tout de suite
  return r;
})(collect);
// au retour : une pastille « ★★★ ×2 » à côté du nombre d'objets ; « Pépite ! » à la première découverte d'une ★★★
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const H = sgHaul && h && h.comp === sgHaul.k ? sgHaul : null; if (H) sgHaul = null;
  try { if (H && H.pep) h.extra = (h.extra || []).concat(['Une pépite ★★★ ! Ce lieu donne deux fois plus que les autres.']); } catch (e) {}
  const r = orig.apply(this, arguments);
  try {
    if (H) { const st = document.querySelector('#modal .hstats'); if (st && !st.querySelector('.sg-chip')) st.insertAdjacentHTML('afterbegin', `<span class="sg-chip s${H.s}" title="Qualité du lieu">${sgStars(H.s)}${H.s > 1 ? ` ×${String(H.mul).replace('.', ',')}` : ''}</span>`); }
  } catch (e) {}
  return r;
})(showHaul);
// œufs et rencontres plus fréquents dans les lieux étoilés
if (typeof nsTripEgg === 'function') nsTripEgg = (orig => function (e) {
  let r = orig.apply(this, arguments);
  try {
    const G = !r && e && e.trip && e.trip.dest ? sgOf(e.trip.dest) : null, F = G && SG_FX[G.s];
    if (F && Math.random() < F.egg) { const N = nsState(); if (N.dry > 0) N.dry--; r = orig.apply(this, arguments); }
  } catch (x) {}
  return r;
})(nsTripEgg);
// le trophée se revend cher
if (typeof value === 'function') value = (orig => function (it) { const v = orig.apply(this, arguments); return it && it.sgT && typeof v === 'number' ? Math.max(v, 400) : v; })(value);

// ---------------- « Le lieu » : une ligne ----------------
function sgLineHTML(d) {
  const G = sgOf(d); if (!G) return '';
  if (!sgState().v[G.key]) return `<div class="sg-line new"><span class="sg-s">?</span><span class="sg-t"><b>Qualité inconnue</b><small>À découvrir : certains lieux donnent deux fois plus.</small></span></div>`;
  const F = SG_FX[G.s];
  return `<div class="sg-line s${G.s}"><span class="sg-s">${sgStars(G.s)}</span><span class="sg-t"><b>${G.s === 3 ? 'Pépite' : G.s === 2 ? 'Bonne adresse' : 'Adresse ordinaire'}</b><small>${F ? F.txt : 'butin normal'}</small></span></div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const box = document.getElementById('panelBody'), d = plan.dest;
    if (box && d && !box.querySelector('.sg-line') && !sg$(() => mdTuto(), false)) {
      const h = sgLineHTML(d);
      if (h) {
        const lieu = box.querySelector('.dpt-lieu'), prep = box.querySelector('.dpt-prep'), gb = box.querySelector(':scope > .gobar');
        if (lieu) lieu.insertAdjacentHTML('afterbegin', h);
        if (prep) prep.insertAdjacentHTML('afterbegin', h); // aussi dans « Préparation » (onglet ouvert par défaut)
        if (!lieu && !prep) { const at = box.querySelector('.dpt-poils'); if (at) at.insertAdjacentHTML('beforebegin', h); else if (gb) gb.insertAdjacentHTML('beforebegin', h); }
      }
    }
  } catch (e) { console.error('adresses lieu', e); }
  return r;
})(renderVoyage);

// ---------------- le carnet d'adresses (album) ----------------
function sgBookHTML() {
  const V = sgState().v, rows = Object.keys(V).map(key => { const G = sgOf(V[key].d || {}); return G ? { key, G, e: V[key] } : null; }).filter(Boolean)
    .sort((a, b) => b.G.s - a.G.s || (b.e.at || 0) - (a.e.at || 0));
  const top = rows.filter(x => x.G.s === 3).length, good = rows.filter(x => x.G.s === 2).length;
  if (!rows.length) return `<details class="sg-book"><summary><b>📒 Carnet d’adresses</b><small>vide</small></summary><p class="sg-none">Chaque lieu a sa qualité, de ★ à ★★★. Elle se découvre à la première visite.</p></details>`;
  return `<details class="sg-book"><summary><b>📒 Carnet d’adresses</b><small>${top ? `${top} ★★★ · ` : ''}${good ? `${good} ★★ · ` : ''}${rows.length} lieu${rows.length > 1 ? 'x' : ''}</small></summary>
    ${rows.filter(x => x.G.s > 1).slice(0, 40).map(x => `<div class="sg-r s${x.G.s}"><span class="sg-s">${sgStars(x.G.s)}</span><span class="sg-t"><b>${esc(x.e.d.name || '')}</b><small>${SG_FX[x.G.s].txt}</small></span><button class="btn cream sm" data-sggo="${esc(x.key)}">Y aller</button></div>`).join('') || '<p class="sg-none">Pas encore de bonne adresse ★★ ou ★★★ : continuez à explorer !</p>'}
    </details>`;
}
if (typeof renderAlbum === 'function') renderAlbum = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    if (box && !sg$(() => mdTuto(), false)) { const at = box.querySelector('.pg-pass') || box.querySelector('.mdreg') || box.querySelector('.phead, h2, header'); if (at) at.insertAdjacentHTML('afterend', sgBookHTML()); else box.insertAdjacentHTML('afterbegin', sgBookHTML()); }
  } catch (e) { console.error('carnet d’adresses', e); }
  return r;
})(renderAlbum);
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-sggo]'); if (!b) return;
  ev.stopPropagation();
  const e = sgState().v[b.dataset.sggo]; if (!e || !e.d) return;
  if (S.trips[S.sel]) { toast(`${CHARS[S.sel] ? CHARS[S.sel].name : 'Ce compagnon'} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; }
  plan.dest = Object.assign({}, e.d);
  sg$(() => { if (plan.dest.poi && kmBetween(homeObj(), plan.dest) < 40) plan.dur = 'eclair'; }, 0);
  openSheet('voyage'); sg$(() => drawMarks(), 0);
}, true);

// ---------------- sur la carte : les étoiles sur l'épingle d'un lieu déjà visité ----------------
// (épingles dessinées en image par 07_poi.js : drapeau « k1/k2/k3 » ajouté à la variante, puis badge dessiné)
const sgPoiStars = p => { if (!p || !p.name) return 0; const key = 'n:' + String(p.name).slice(0, 40) + '@' + (+p.lon).toFixed(3) + ',' + (+p.lat).toFixed(3); if (!sgState().v[key]) return 0; const G = sgOf({ name: p.name, lon: p.lon, lat: p.lat, poi: true }); return G ? G.s : 0; };
if (typeof poiPick === 'function') poiPick = (orig => function () {
  const out = orig.apply(this, arguments);
  try { out.forEach(s => { const n = sgPoiStars(s.p); if (n && !/k\d/.test(s.v)) s.v = (s.v === 'n' ? '' : s.v) + 'k' + n; }); } catch (e) {}
  return out;
})(poiPick);
function sgStar(g, x, y, R, fill) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
  g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = 0.9; g.strokeStyle = '#7a5410'; g.stroke();
}
if (typeof poiDrawIcon === 'function') poiDrawIcon = (orig => function (g, cx, cy, cat, v) {
  const r = orig.apply(this, arguments);
  try {
    const m = /k(\d)/.exec(String(v)); if (!m) return r;
    const n = +m[1], rr = String(v).includes('s') ? 7 : 10.5;
    if (n === 1) { // ★ : simple coche « déjà visité »
      const bx = cx + rr * 0.75, by = cy + rr * 0.75;
      g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(bx, by, 4.6, 0, 7); g.fill();
      g.fillStyle = '#4fa765'; g.beginPath(); g.arc(bx, by, 3.6, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.3; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(bx - 1.8, by); g.lineTo(bx - 0.4, by + 1.4); g.lineTo(bx + 1.9, by - 1.4); g.stroke();
    } else { // ★★ / ★★★ : petites étoiles dorées sous l'épingle
      const R = 3.4, gap = 6.4, y = cy + rr - 0.6, x0 = cx - ((n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) sgStar(g, x0 + i * gap, y, R, n === 3 ? '#ffc93a' : '#f2b84a');
    }
  } catch (e) {}
  return r;
})(poiDrawIcon);
{
  const st = document.createElement('style');
  st.textContent = `.sg-line,.sg-r{display:flex;align-items:center;gap:8px;padding:6px 10px;border:2px solid #e7dccb;border-radius:14px;background:#fffaf0;margin-bottom:8px}
.sg-line.s2,.sg-r.s2{border-color:#e3c36a;background:#fff8e1}.sg-line.s3,.sg-r.s3{border-color:#d9a21b;background:#fff3c9}
.sg-line.new{border-style:dashed;background:#faf6ee}
.sg-s{flex:none;min-width:30px;text-align:center;font:800 14px var(--display,inherit);color:#c98a12;letter-spacing:-1px}.sg-line.new .sg-s{color:#b5a08a;font-size:18px}
.sg-t{flex:1;min-width:0;display:flex;flex-direction:column}.sg-t b{font:800 13.5px var(--display,inherit);color:var(--ink,#4a3528)}
.sg-t small{font-size:12px;color:var(--ink2,#7a6250)}
.hstats .sg-chip{color:#8a5a00;background:#fff3c9!important;border-color:#d9a21b!important;letter-spacing:-.5px}.hstats .sg-chip.s1{color:#9a8470;background:#fff!important;border-color:var(--line)!important}
.sg-book{margin:10px 0;padding:8px 10px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#fff}
.sg-book summary{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;list-style:none}.sg-book summary::-webkit-details-marker{display:none}
.sg-book summary b{font:800 15px var(--display,inherit);color:var(--ink,#4a3528)}.sg-book summary small{font-size:12px;color:var(--ink2,#7a6250)}
.sg-book[open] summary{margin-bottom:8px}.sg-book .sg-r{margin-bottom:6px}.sg-none{margin:4px 2px;font-size:13px;color:#9a8470}
/* écran de retour plus compact sur téléphone (on doit voir le butin sans faire défiler) */
@media (max-width:600px){#modal .hhead{gap:10px}#modal .hhead img{width:48px;height:52px;border-radius:12px}#modal .hhead h2{font-size:18px;line-height:1.15}
#modal .hstats{gap:4px;margin-top:3px}#modal .hstats span{padding:1px 7px;font-size:11.5px;border-width:1.5px}
#modal .hbig{font-size:11.5px;padding:2px 9px;letter-spacing:.04em}
#modal .jr-hero{padding:7px 10px}#modal .jr-ht{font-size:14px;margin-bottom:1px}#modal .jr-hero .jr-in{font-size:13px;line-height:1.3}
#modal .jr-top .jr-in{font-size:13px;padding:4px 8px;line-height:1.3}#modal .jr-open .jr-h{font-size:13px;padding:3px 8px 1px}
#modal .jr-wrap.jr-top{margin:4px 0 6px}#modal .jr-top .jr-cat{margin:3px 0}}`;
  document.head.appendChild(st);
}
window.__sg = { of: sgOf, state: sgState, line: sgLineHTML, book: sgBookHTML };

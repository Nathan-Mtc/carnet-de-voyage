// ================= 65 · LES BONNES ADRESSES : LA SIGNATURE DE CHAQUE LIEU (v44) =================
// Le joueur : « on a énormément de lieux, mais on y va pour quoi ? Je veux qu'on aille dans CE café et pas un autre
// parce qu'il y a une raison ; qu'on préfère faire 59 km plutôt que 2. » — sans surcharger ni l'écran ni la tête.
// Chaque vrai lieu a une SIGNATURE fixe, la même pour tous les joueurs (tirée de l'identité du lieu, jamais du joueur) :
//   • une SPÉCIALITÉ MAISON (objet unique au nom du lieu), rapportée à chaque visite ;
//   • une QUALITÉ de 1 à 3 étoiles (≈ 75 % / 20 % / 5 % ; lieux du quotidien : presque toujours 1 étoile) ;
//   • un TALENT (un bonus réel à chaque passage, parmi 9).
// Utilité : la spécialité est un ingrédient amélioré (plat vendu +10/+25/+50 %, voir 37_commerce.js cmStart/cmFinish) ;
// un plat étoilé emporté en provision rapporte des objets en plus ; le talent agit au retour du voyage.
// Découverte : rien n'est montré avant la première visite (« Adresse à découvrir »). Seuls les lieux VISITÉS sont
// mémorisés (S.sig.v) ; la signature se recalcule depuis le lieu. Affichage : une ligne dans « Le lieu », une ligne au
// retour (première visite), et le « Carnet d'adresses » dans l'album. Rien sur la carte, aucune fenêtre spontanée.
const SG_VAR = ['maison', 'à l’ancienne', 'du chef', 'grand cru', 'de tradition', 'des habitués', 'du patron', 'façon grand-mère', 'des voyageurs', 'au feu de bois',
  'de saison', 'des grands jours', 'du terroir', 'cuvée spéciale', 'première récolte', 'de la maison', 'des connaisseurs', 'à la mode d’ici', 'du marché', 'de collection'];
// talent : [nom, effet affiché selon les étoiles]
// (v44b : textes en mots simples — le joueur ne comprenait pas « 15 % de chances de monter en rareté »)
const SG_TAL = {
  genereux: ['Généreux', () => 'on en revient avec plus d’objets'],
  rare: ['Filon', () => 'on trouve toujours un objet rare'],
  fortune: ['Bonne affaire', () => 'on gagne des pièces en plus'],
  formateur: ['Formateur', () => 'votre compagnon apprend plus vite'],
  bricoleur: ['Bricoleur', () => 'on trouve des matériaux pour construire'],
  jardinier: ['Jardinier', () => 'on trouve des graines à planter'],
  gourmand: ['Gourmand', () => 'on rapporte sa spécialité en plusieurs exemplaires'],
  chanceux: ['Porte-bonheur', () => 'les trouvailles sont souvent plus rares'],
  eclaireur: ['Point de vue', () => 'on voit loin : le brouillard se lève plus largement'],
};
const SG_PCT = [0, 10, 25, 50];
const sg$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
function sgState() { if (!S.sig || typeof S.sig !== 'object') S.sig = { v: {} }; if (!S.sig.v) S.sig.v = {}; return S.sig; }
const sgKey = d => (d.id ? 'i:' + d.id : 'n:' + String(d.name).slice(0, 40) + '@' + (+d.lon).toFixed(3) + ',' + (+d.lat).toFixed(3));
function sgRnd(key, salt) { let h = 2166136261; const s = key + '|' + salt; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
const sgStars = n => '★'.repeat(n);
const sgShort = nm => { nm = String(nm || '').trim(); return nm.length > 24 ? nm.slice(0, 23).trim() + '…' : nm; };
// la signature d'un lieu (null pour la maison, le tutoriel, un lieu sans nom)
function sgOf(d) {
  if (!d || !d.name || d.lon == null || d.home) return null;
  const key = sgKey(d), tags = d.tags || [];
  const r = sgRnd(key, 'q'), s = d.poi ? (r < 0.02 ? 3 : r < 0.14 ? 2 : 1) : (r < 0.05 ? 3 : r < 0.25 ? 2 : 1);
  let pool = [];
  if (POI_CATS[tags[0]] && LOOT[tags[0]]) pool = LOOT[tags[0]]; else tags.forEach(t => { if (LOOT[t]) pool = pool.concat(LOOT[t]); });
  if (!pool.length) pool = LOOT.campagne || [];
  let c = pool.filter(x => x[1] === 'n' && x[3] <= 1); if (!c.length) c = pool.filter(x => x[1] === 'm' && x[3] <= 1); if (!c.length) c = pool.filter(x => x[1] === 'n' || x[1] === 'm'); if (!c.length) return null;
  const def = c[Math.floor(sgRnd(key, 'd') * c.length)];
  const tals = Object.keys(SG_TAL).filter(t => !(d.poi && t === 'eclaireur')), tal = tals[Math.floor(sgRnd(key, 't') * tals.length)];
  // v44b : la spécialité doit avoir du sens pour CE lieu. On reprend la spécialité déjà prévue par le jeu pour ce type de lieu
  // (« Plat signature de McDonald's », « Brioche de … ») ; sinon celle d'un de ses paysages ; sinon un produit du coin.
  const fix = x => x.replace(/\bde (Le|Les|Au|Aux) /, (m, a) => ({ Le: 'du ', Les: 'des ', Au: 'd’Au ', Aux: 'd’Aux ' })[a]);
  let sp = d.special && (d.special[1] === 'n' || d.special[1] === 'm') ? d.special : null;
  if (!sp && typeof SPECIALTY !== 'undefined') { const tg = tags.find(t => SPECIALTY[t] && (SPECIALTY[t][1] === 'n' || SPECIALTY[t][1] === 'm')); if (tg) { sp = SPECIALTY[tg].slice(); sp[0] = fix(sp[0].replace('{P}', d.name)); } }
  if (sp) return { key, s, tal, def: sp, name: sp[0] };
  const nm = sgShort(d.name);
  return { key, s, tal, def, name: fix(`${def[0]} ${/^[aeiouyhéèêàâîôû]/i.test(nm) ? 'd’' : 'de '}${nm}`) };
}
const sgTalTxt = G => `Ici, ${SG_TAL[G.tal][1](G.s)}`;
const sgKnown = d => { const G = sgOf(d); return !!(G && sgState().v[G.key]); };
function sgItem(G, d) {
  const it = makeItem([G.name, G.def[1], G.def[2], G.s, G.def[4] || null, G.def[5] || null], 0, d.name, d.tags || [], { fixed: G.s });
  it.sg = { k: G.key, s: G.s };
  return it;
}
// copie légère du lieu, pour pouvoir y retourner depuis le carnet d'adresses
function sgCopy(d) { const o = {}; Object.keys(d).forEach(k => { const v = d[k]; if (v == null || ['string', 'number', 'boolean'].includes(typeof v) || (Array.isArray(v) && v.length < 12 && v.every(x => x == null || typeof x !== 'object'))) o[k] = v; }); return o; }

// ---------------- au retour : spécialité, talent, provision étoilée ----------------
let sgHaul = null;
if (typeof collect === 'function') collect = (orig => function () {
  sgHaul = null;
  try {
    const k = S.sel, t = S.trips[k];
    if (t && t.done && !t.tuto && !t.sgL && Array.isArray(t.bag) && t.dest) {
      t.sgL = 1;
      const d = t.dest, G = t.xpFail ? null : sgOf(d), tags = d.tags || ['campagne'], luck = t.luck || 0;
      if (G) {
        const V = sgState().v, fresh = !V[G.key], dry = t.dfEx != null && t.dfEx < 1; // lieu épuisé : pas de spécialité cette fois
        if (!dry) {
          // le jeu offre déjà cette spécialité une fois (souvenir unique du lieu) : on ne la double pas, on la marque
          const own = t.bag.filter(it => it.name === G.name); own.forEach(it => { it.sg = { k: G.key, s: G.s }; });
          const n = (G.tal === 'gourmand' ? 1 + Math.ceil(G.s / 2) : 1) - own.length; for (let i = 0; i < n; i++) t.bag.push(sgItem(G, d));
        }
        let got = '', n0 = t.bag.length; // ce que le talent a vraiment donné, en quelques mots
        if (G.tal === 'genereux') { t.bag.push(...lootFor(tags, luck, d.name, G.s, k)); got = `+${G.s} objet${G.s > 1 ? 's' : ''}`; }
        if (G.tal === 'rare') { const b = lootFor(tags, luck + 1, d.name, 1, k)[0]; if (b) { b.rarity = Math.max(b.rarity || 0, G.s); t.bag.push(b); got = `+1 objet ${sg$(() => RARITY[b.rarity].toLowerCase(), 'rare')} : ${b.name}`; } }
        if (G.tal === 'fortune') { t.coins = (t.coins || 0) + 20 * G.s; got = `+${20 * G.s} pièces`; }
        if (G.tal === 'formateur') { const x0 = t.xp || 0; t.xp = Math.round(x0 * (1 + 0.25 * G.s)) + 5 * G.s; got = `+${t.xp - x0} exp.`; }
        if (G.tal === 'bricoleur') { const ks = ['bois', 'pierre', 'tissu', 'metal'].filter(x => ING[x]); for (let i = 0; i < G.s && ks.length; i++) { const m = sg$(() => bqSampleIng(ks[Math.floor(Math.random() * ks.length)]), null); if (m && m.name) t.bag.push(makeItem([m.name, m.cat, m.sub, 0, m.look || null, m.color], 0, d.name, tags, { fixed: 0 })); } }
        if (G.tal === 'jardinier') for (let i = 0; i < G.s; i++) t.bag.push(makeItem(Math.random() < 0.5 ? ['Graines de tournesol', 'm', 'graine', 0] : ['Pomme de pin', 'm', 'graine', 0], 0, d.name, tags, { fixed: 0 }));
        if (G.tal === 'bricoleur') got = `+${t.bag.length - n0} matériau${t.bag.length - n0 > 1 ? 'x' : ''}`;
        if (G.tal === 'jardinier') got = `+${G.s} graine${G.s > 1 ? 's' : ''}`;
        if (G.tal === 'chanceux') { let up = 0; t.bag.forEach(it => { if (!it.sg && !it.special && !it.mk && (it.rarity || 0) < 3 && Math.random() < 0.15 * G.s) { it.rarity = (it.rarity || 0) + 1; up++; } }); got = up ? `${up} objet${up > 1 ? 's' : ''} plus rare${up > 1 ? 's' : ''}` : 'pas de chance cette fois'; }
        if (G.tal === 'eclaireur') sg$(() => { const p = (S.ex.pend || []).find(x => x.name === d.name); if (p && !p.sg) { p.km = Math.round(p.km * (1 + 0.5 * G.s)); p.sg = 1; } }, 0);
        if (G.tal === 'eclaireur') got = 'brouillard levé plus loin';
        if (G.tal === 'gourmand' && !dry) got = `+${1 + Math.ceil(G.s / 2)} spécialités`;
        const lbl = `${SG_TAL[G.tal][0]}${got ? ' : ' + got : ''}`;
        if (fresh) { V[G.key] = { at: Date.now(), n: 1, d: sgCopy(d) }; sgHaul = { k, txt: G.s === 3 ? `Pépite ★★★ · ${lbl}` : `Nouvelle adresse ${sgStars(G.s)} · ${lbl}` }; }
        else if (got) sgHaul = { k, txt: `📍 ${lbl}` };
        if (!fresh) { V[G.key].n = (V[G.key].n || 1) + 1; V[G.key].at = Date.now(); }
      }
      // un plat cuisiné avec une spécialité étoilée, emporté en provision : des objets en plus
      if (t.sgProv && !t.xpFail) t.bag.push(...lootFor(tags, luck, d.name, t.sgProv, k));
    }
  } catch (e) { console.error('adresses', e); }
  return orig.apply(this, arguments);
})(collect);
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  try { if (sgHaul && h && h.comp === sgHaul.k) { h.extra = (h.extra || []).concat([sgHaul.txt]); sgHaul = null; } } catch (e) {}
  return orig.apply(this, arguments);
})(showHaul);
// provisions : on note la meilleure spécialité parmi les plats emportés
if (typeof eqOnStart === 'function') eqOnStart = (orig => function (k, t, dest, rids) {
  let best = 0;
  try { const used = new Set(); (rids || []).forEach(rid => { const it = eqFood().filter(x => x.mk.rid === rid && !used.has(x.id)).sort((a, b) => a.mk.st - b.mk.st)[0]; if (it) { used.add(it.id); if (it.mk.sg) best = Math.max(best, it.mk.sg); } }); } catch (e) {}
  const r = orig.apply(this, arguments);
  try { if (best && t) t.sgProv = best; } catch (e) {}
  return r;
})(eqOnStart);

// ---------------- à quoi sert la spécialité (fiche et pastilles d'usage) ----------------
GAME.addUses(it => {
  if (!it) return [];
  if (it.sg && it.cat === 'n') return [{ txt: `Spécialité ${sgStars(it.sg.s)} : vos plats cuisinés avec se vendent ${SG_PCT[it.sg.s]} % plus cher`, kind: 'cuisiner' }];
  if (it.sg) return [{ txt: `Spécialité ${sgStars(it.sg.s)} : objet de collection, se revend ${SG_PCT[it.sg.s]} % plus cher`, kind: 'vendre' }];
  if (it.mk && it.mk.sg) return [{ txt: `Plat de spécialité : vendu ${SG_PCT[it.mk.sg]} % plus cher · en provision, +${it.mk.sg} objet${it.mk.sg > 1 ? 's' : ''} au retour`, kind: 'expedition' }];
  return [];
});
// une spécialité non comestible vaut plus cher à la revente
if (typeof value === 'function') value = (orig => function (it) { const v = orig.apply(this, arguments); return it && it.sg && it.cat !== 'n' && typeof v === 'number' ? Math.round(v * (1 + SG_PCT[it.sg.s || 1])) : v; })(value);

// ---------------- affichage : une ligne dans « Le lieu » ----------------
function sgLineHTML(d) {
  const G = sgOf(d); if (!G) return '';
  if (!sgState().v[G.key]) return `<div class="sg-line new"><span class="sg-s">?</span><span class="sg-t"><b>Adresse à découvrir</b><small>Son talent se révèle à la première visite.</small></span></div>`;
  return `<div class="sg-line s${G.s}"><span class="sg-s">${sgStars(G.s)}</span><span class="sg-t"><b>✓ Déjà visité · ${esc(SG_TAL[G.tal][0])}</b><small>${esc(sgTalTxt(G))}</small></span></div>`;
}
if (typeof renderVoyage === 'function') renderVoyage = (orig => function () {
  const r = orig.apply(this, arguments);
  try {
    const box = document.getElementById('panelBody'), d = plan.dest;
    if (box && d && !box.querySelector('.sg-line') && !sg$(() => mdTuto(), false)) {
      const h = sgLineHTML(d);
      if (h) {
        const lieu = box.querySelector('.dpt-lieu'), gb = box.querySelector(':scope > .gobar');
        if (lieu) lieu.insertAdjacentHTML('afterbegin', h);
        else { const at = box.querySelector('.dpt-poils'); if (at) at.insertAdjacentHTML('beforebegin', h); else if (gb) gb.insertAdjacentHTML('beforebegin', h); }
      }
    }
  } catch (e) { console.error('adresses lieu', e); }
  return r;
})(renderVoyage);

// ---------------- le carnet d'adresses (dans l'album, sous le passeport) ----------------
function sgBookHTML() {
  const V = sgState().v, rows = Object.keys(V).map(key => { const G = sgOf(V[key].d || {}); return G ? { key, G, e: V[key] } : null; }).filter(Boolean)
    .sort((a, b) => b.G.s - a.G.s || (b.e.at || 0) - (a.e.at || 0));
  if (!rows.length) return `<details class="sg-book"><summary><b>📒 Carnet d’adresses</b><small>aucune adresse pour l’instant</small></summary><p class="sg-none">Chaque lieu a sa spécialité maison et son talent. Visitez-en un pour le noter ici.</p></details>`;
  const top = rows.filter(x => x.G.s === 3).length;
  return `<details class="sg-book"><summary><b>📒 Carnet d’adresses</b><small>${rows.length} adresse${rows.length > 1 ? 's' : ''}${top ? ` · ${top} pépite${top > 1 ? 's' : ''} ★★★` : ''}</small></summary>
    ${rows.slice(0, 60).map(x => `<div class="sg-r s${x.G.s}"><span class="sg-s">${sgStars(x.G.s)}</span><span class="sg-t"><b>${esc(x.e.d.name || '')}</b><small>${esc(sgTalTxt(x.G))} · ${esc(x.G.name)}</small></span><button class="btn cream sm" data-sggo="${esc(x.key)}">Y aller</button></div>`).join('')}
    ${rows.length > 60 ? `<p class="sg-none">… et ${rows.length - 60} autres adresses.</p>` : ''}</details>`;
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
{
  const st = document.createElement('style');
  st.textContent = `.sg-line,.sg-r{display:flex;align-items:center;gap:8px;padding:7px 10px;border:2px solid #e7dccb;border-radius:14px;background:#fffaf0}
.sg-line.s2,.sg-r.s2{border-color:#e3c36a;background:#fff8e1}.sg-line.s3,.sg-r.s3{border-color:#d9a21b;background:#fff3c9}
.sg-line.new{border-style:dashed;background:#faf6ee}
.sg-s{flex:none;min-width:30px;text-align:center;font:800 14px var(--display,inherit);color:#c98a12;letter-spacing:-1px}.sg-line.new .sg-s{color:#b5a08a;font-size:18px}
.sg-t{flex:1;min-width:0;display:flex;flex-direction:column}.sg-t b{font:800 13.5px var(--display,inherit);color:var(--ink,#4a3528)}
.sg-t small{font-size:12px;color:var(--ink2,#7a6250)}
.sg-book{margin:10px 0;padding:8px 10px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#fff}
.sg-book summary{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;list-style:none}.sg-book summary::-webkit-details-marker{display:none}
.sg-book summary b{font:800 15px var(--display,inherit);color:var(--ink,#4a3528)}.sg-book summary small{font-size:12px;color:var(--ink2,#7a6250)}
/* v44c : écran de retour plus compact sur téléphone (on doit voir le butin sans faire défiler) */
@media (max-width:600px){#modal .hhead{gap:10px}#modal .hhead img{width:48px;height:52px;border-radius:12px}#modal .hhead h2{font-size:18px;line-height:1.15}
#modal .hstats{gap:4px;margin-top:3px}#modal .hstats span{padding:1px 7px;font-size:11.5px;border-width:1.5px}
#modal .hbig{font-size:11.5px;padding:2px 9px;letter-spacing:.04em}
#modal .jr-hero{padding:7px 10px}#modal .jr-ht{font-size:14px;margin-bottom:1px}#modal .jr-hero .jr-in{font-size:13px;line-height:1.3}
#modal .jr-top .jr-in{font-size:13px;padding:4px 8px;line-height:1.3}#modal .jr-open .jr-h{font-size:13px;padding:3px 8px 1px}
#modal .jr-wrap.jr-top{margin:4px 0 6px}#modal .jr-top .jr-cat{margin:3px 0}}
.sg-book[open] summary{margin-bottom:8px}.sg-book .sg-r{margin-bottom:6px}.sg-none{margin:4px 2px;font-size:13px;color:#9a8470}`;
  document.head.appendChild(st);
}
// ---------------- sur la carte : une coche verte sur les lieux du quotidien déjà visités ----------------
// (les épingles sont dessinées sur une image par 07_poi.js : on ajoute le drapeau « k » et on dessine la coche)
const sgPoiSeen = p => !!(p && p.name && sgState().v['n:' + String(p.name).slice(0, 40) + '@' + (+p.lon).toFixed(3) + ',' + (+p.lat).toFixed(3)]);
if (typeof poiPick === 'function') poiPick = (orig => function () {
  const out = orig.apply(this, arguments);
  try { out.forEach(s => { if (sgPoiSeen(s.p) && !String(s.v).includes('k')) s.v = (s.v === 'n' ? '' : s.v) + 'k'; }); } catch (e) {}
  return out;
})(poiPick);
if (typeof poiDrawIcon === 'function') poiDrawIcon = (orig => function (g, cx, cy, cat, v) {
  const r = orig.apply(this, arguments);
  try {
    if (String(v).includes('k')) {
      const rr = String(v).includes('s') ? 7 : 10.5, bx = cx + rr * 0.75, by = cy + rr * 0.75;
      g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(bx, by, 4.6, 0, 7); g.fill();
      g.fillStyle = '#4fa765'; g.beginPath(); g.arc(bx, by, 3.6, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.3; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(bx - 1.8, by); g.lineTo(bx - 0.4, by + 1.4); g.lineTo(bx + 1.9, by - 1.4); g.stroke();
    }
  } catch (e) {}
  return r;
})(poiDrawIcon);
// après un retour, les épingles se redessinent tout de suite
if (typeof collect === 'function') collect = (orig => function () { const r = orig.apply(this, arguments); setTimeout(() => sg$(() => refreshPOIs(true), 0), 50); return r; })(collect);
window.__sg = { of: sgOf, state: sgState, line: sgLineHTML, book: sgBookHTML };

// ================= 77 · LE CATALOGUE DE MEUBLES (v55) =================
// Le joueur : « les modèles sont trop simples, pas assez de vie, les pièces trop petites ; ça ne donne pas envie de
// personnaliser ». Choix (14/11) : meubles À ACHETER et À FABRIQUER, rendu doux et réaliste, pièce plus grande (75 : 12 × 12).
// • 34 meubles en 3D détaillée (pieds, coussins, tiroirs, poignées…), certains animés (aquarium, horloge, radio, télé,
//   fontaine, guirlande). Chacun est un objet du sac (catégorie Décoration, sous-type « mb_… ») : il compte dans le confort.
// • Catalogue (onglet 🛒 d'Aménager) : 8 meubles en arrivage chaque jour, à acheter en pièces ; 8 meubles à FABRIQUER avec
//   les matériaux rapportés de voyage (coquillages, cristal, plumes…). Acheté → il est tout de suite dans la main, à poser.
// • Kit de bienvenue (une fois) : quelques meubles déjà posés pour que la maison soit habitée.
// • Encombrement : un canapé prend 2 cases, un tapis se pose « à plat » sous les meubles (75 : hmFpOf, hmFlat).
const MB = {
  canape: ['Canapé dodu', '🛋️', [2, 1], 600, 2, ['#79aed0', '#f29cb0', '#9fd08a', '#f2c14e']],
  fauteuil: ['Fauteuil club', '💺', [1, 1], 350, 2, ['#e0a07a', '#c9a0dc', '#7fb3e0']],
  chaise: ['Chaise en bois', '🪑', [1, 1], 120, 1, ['#c99a6a']],
  tablebasse: ['Table basse ronde', '☕', [1, 1], 180, 1, ['#c99a6a']],
  tableferme: ['Table de ferme', '🍽️', [2, 1], 400, 2, ['#b98a5e']],
  commode: ['Commode', '🗄️', [1, 1], 300, 1, ['#fffaf0', '#cfe6f5', '#f6c7a0']],
  biblio: ['Bibliothèque', '📚', [1, 1], 380, 2, ['#c99a6a']],
  lampadaire: ['Lampadaire', '🛋', [1, 1], 150, 1, ['#ffd866', '#f6a3b7', '#a9d8f0']],
  grandeplante: ['Grande plante', '🪴', [1, 1], 140, 1, ['#d98a5f', '#fffaf0']],
  cactus: ['Cactus', '🌵', [1, 1], 80, 1, ['#e0a07a']],
  bonsai: ['Bonsaï', '🌳', [1, 1], 260, 2, ['#7a5236']],
  tapisrond: ['Tapis rond', '⭕', [2, 2], 200, 1, ['#f2a58c', '#9fc9e8', '#c8e6a8', '#f7c8dd']],
  tapisraye: ['Tapis rayé', '🟫', [2, 1], 160, 1, ['#e0685a', '#7fb3e0', '#f2c14e']],
  pouf: ['Pouf', '🟠', [1, 1], 90, 1, ['#f2c14e', '#f29cb0', '#7fc38a']],
  coffre: ['Coffre au trésor', '🧰', [1, 1], 320, 2, ['#9a6a4a']],
  piano: ['Piano droit', '🎹', [2, 1], 1200, 3, ['#3b2a22', '#fffaf0']],
  aquarium: ['Aquarium', '🐠', [1, 1], 650, 3, ['#7fd3f0']],
  radio: ['Radio rétro', '📻', [1, 1], 220, 2, ['#e0685a', '#7fb3e0']],
  comtoise: ['Horloge comtoise', '🕰️', [1, 1], 520, 3, ['#9a6a4a']],
  tele: ['Télé vintage', '📺', [1, 1], 480, 2, ['#c98a5a']],
  bureau: ['Bureau', '🖋️', [2, 1], 380, 2, ['#c99a6a']],
  panier: ['Panier douillet', '🧺', [1, 1], 200, 1, ['#f29cb0', '#7fb3e0']],
  vitrine: ['Vitrine', '🏺', [1, 1], 450, 2, ['#fffaf0']],
  tableau: ['Tableau paysage', '🖼️', [1, 1], 150, 1, ['#7fc38a', '#7fb3e0', '#f2a58c'], 1],
  miroir: ['Miroir rond', '🪞', [1, 1], 200, 2, ['#c9a35a'], 1],
  horloge: ['Horloge murale', '🕒', [1, 1], 120, 1, ['#fffaf0'], 1],
  etagmur: ['Étagère murale', '📗', [1, 1], 100, 1, ['#b98a5e'], 1],
  guirlande: ['Guirlande lumineuse', '✨', [1, 1], 140, 2, ['#ffd866'], 1],
  // à fabriquer avec les matériaux de voyage
  trone: ['Trône de coquillages', '🐚', [1, 1], { coquillage: 3, tissu: 1 }, 3, ['#f7c8dd']],
  lanternecristal: ['Lanterne de cristal', '💎', [1, 1], { cristal: 2, metal: 1 }, 3, ['#a9e0f5']],
  paravent: ['Paravent de plumes', '🪶', [2, 1], { plume: 3, bois: 1 }, 2, ['#fffaf0']],
  lampelune: ['Lampe lune', '🌙', [1, 1], { lune: 1, verre: 1 }, 3, ['#fff3c4']],
  fontaine: ['Fontaine de pierre', '⛲', [1, 1], { pierre: 3 }, 2, ['#c9c2b8']],
  murfleuri: ['Mur fleuri', '🌸', [1, 1], { fleur: 3, feuille: 2 }, 2, ['#f7a8bd'], 1],
  banc: ['Banc en bois flotté', '🪵', [2, 1], { bois: 3 }, 2, ['#c9b8a0']],
  vaseperles: ['Vase de perles', '🏺', [1, 1], { perle: 2 }, 2, ['#e8f4f8']],
};
// v64 : la Collection étoile — meubles d'exception, uniquement en pierres d'étoile, 3 par semaine
Object.assign(MB, {
  lustre: ['Lustre de cristal', '💎', [1, 1], { stones: 4 }, 4, ['#e8f4ff']],
  baldaquin: ['Lit à baldaquin', '🛏️', [2, 2], { stones: 6 }, 4, ['#f7c8dd', '#cfe3f5']],
  bassin: ['Bassin aux carpes', '🎏', [2, 2], { stones: 7 }, 4, ['#c9c2b8']],
  pianoqueue: ['Piano à queue', '🎹', [2, 2], { stones: 8 }, 4, ['#2b2220', '#fffaf0']],
  arbresouhaits: ['Arbre à souhaits', '🏮', [1, 1], { stones: 5 }, 4, ['#f2a33a']],
  carrousel: ['Carrousel miniature', '🎠', [1, 1], { stones: 5 }, 4, ['#f7a8bd']],
  marbre: ['Cheminée de marbre', '🔥', [2, 1], { stones: 6 }, 4, ['#f4efe8']],
  globeceleste: ['Globe céleste', '🌌', [1, 1], { stones: 4 }, 4, ['#3b4a7a']],
});
const mbIsStar = k => !!(MB[k] && MB[k][3] && MB[k][3].stones);
const mbIsCraft = k => !!(MB[k] && typeof MB[k][3] === 'object' && !MB[k][3].stones);
const MB_MAT = { coquillage: 'coquillages', tissu: 'tissu', cristal: 'cristal', metal: 'métal', plume: 'plumes', bois: 'bois', lune: 'éclat de lune', verre: 'verre', pierre: 'pierres', fleur: 'fleurs', feuille: 'feuilles', perle: 'perles' };
const mbId = it => it && String(it.sub || '').startsWith('mb_') ? it.sub.slice(3) : null;
const mbDef = it => MB[mbId(it)] || null;
hmFpOf = it => { const D = mbDef(it); return D ? D[2] : [1, 1]; };
hmFlat = it => !!it && (it.sub === 'tapis' || /^mb_(tapis|lustre)/.test(it.sub || ''));
function mbItem(id, col) {
  const D = MB[id]; if (!D) return null;
  const it = { id: uidGen(), name: D[0], cat: 'd', sub: 'mb_' + id, rarity: D[4], look: null, color: col || D[5][0], from: 'Catalogue', tags: [], date: Date.now() };
  if (D[6]) it.wall = 1;
  return it;
}
// ---------------- icônes (sac, plateau d'aménagement) ----------------
if (typeof itemIcon === 'function') itemIcon = (orig => function (it) {
  const D = mbDef(it); if (!D) return orig.apply(this, arguments);
  return `<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="40" fill="${it.color || D[5][0]}" opacity=".35"/><text x="50" y="70" font-size="50" text-anchor="middle">${D[1]}</text></svg>`;
})(itemIcon);
// ---------------- le catalogue ----------------
function mbDay() { const d = new Date(); return d.getFullYear() * 1000 + Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); }
function mbStock() {
  const ids = Object.keys(MB).filter(k => typeof MB[k][3] === 'number'); let r = mbDay() % 233280; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const out = []; while (out.length < 8 && ids.length) { const k = ids.splice(Math.floor(rnd() * ids.length), 1)[0], cs = MB[k][5]; out.push([k, cs[Math.floor(rnd() * cs.length)]]); }
  return out;
}
const mbHave = mat => (S.inv || []).filter(it => it && it.cat === 'm' && it.sub === mat).length;
function mbWeek() { const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return Math.floor(m.getTime() / 6048e5); }
function mbStars() { const ids = Object.keys(MB).filter(mbIsStar); let r = (mbWeek() * 7919) % 233280; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; const out = []; while (out.length < 3 && ids.length) { const k = ids.splice(Math.floor(rnd() * ids.length), 1)[0]; out.push([k, MB[k][5][Math.floor(rnd() * MB[k][5].length)]]); } return out; }
function mbLeft(kind) { const d = new Date(), end = kind === 'w' ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7 - ((d.getDay() + 6) % 7))) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), ms = end - d, h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4); return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${h} h ${String(m).padStart(2, '0')}`; }
const mbSeen = () => { const H = hmS(); if (!Array.isArray(H.seen)) H.seen = []; return H.seen; };
let mbTab = 'jour';
const mbCanCraft = id => Object.entries(MB[id][3]).every(([m, n]) => mbHave(m) >= n);
hmCatHTML = () => {
  const cell = (k, c, act) => { const D = MB[k], it = { cat: 'd', sub: 'mb_' + k, color: c }; return `<div class="mb-c"><span class="mb-i">${itemIcon(it)}</span><b>${esc(D[0])}</b><small>${D[2][0] * D[2][1] > 1 ? `${D[2][0]}×${D[2][1]} cases` : '1 case'}${D[6] ? ' · au mur' : ''}</small>${act}</div>`; };
  const tabs = `<div class="mb-tabs">${[['jour', '🗓️ Du jour'], ['etoile', '⭐ Étoile'], ['mien', '📖 Mon catalogue'], ['fab', '🔨 À fabriquer']].map(([k, l]) => `<button data-mbtab="${k}" class="${mbTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const mkt = `<button class="mb-mkt" data-mbmkt="1">🌍 Marché mondial <small>objets d’autres joueurs</small> ›</button>`;
  if (mbTab === 'etoile') { const n = hm$(() => stonesN(), 0); return tabs + `<h4 class="mb-h">Collection étoile <small>expire dans ${mbLeft('w')}</small></h4><p class="mb-intro">Des pièces d’exception, seulement en pierres d’étoile. Vous en avez <b>${n}</b>.</p><div class="mb-g">${mbStars().map(([k, c]) => { const pr = MB[k][3].stones, ok = n >= pr; return cell(k, c, `<button class="btn ${ok ? 'gold' : 'cream'} sm" data-mbstar="${k}" data-mbcol="${c}"${ok ? '' : ' disabled'}>${pr} ${hm$(() => STONE_SVG, '💎')}</button>`); }).join('')}</div>` + mkt; }
  if (mbTab === 'mien') { const L = mbSeen().filter(k => MB[k] && typeof MB[k][3] === 'number'); return tabs + `<h4 class="mb-h">Mon catalogue <small>${L.length} meuble${L.length > 1 ? 's' : ''}</small></h4><p class="mb-intro">Tout meuble acheté une fois reste ici : vous pouvez le recommander quand vous voulez.</p><div class="mb-g">${L.map(k => { const pr = MB[k][3], ok = (S.coins || 0) >= pr; return cell(k, MB[k][5][0], `<button class="btn ${ok ? 'green' : 'cream'} sm" data-mbbuy="${k}" data-mbcol="${MB[k][5][0]}"${ok ? '' : ' disabled'}>${pr} 🪙</button>`); }).join('') || '<p class="hm-none">Encore vide : achetez un meuble du jour.</p>'}</div>` + mkt; }
  const shop = mbStock().map(([k, c]) => { const pr = MB[k][3], ok = (S.coins || 0) >= pr; return cell(k, c, `<button class="btn ${ok ? 'green' : 'cream'} sm" data-mbbuy="${k}" data-mbcol="${c}"${ok ? '' : ' disabled'}>${pr} 🪙</button>`); }).join('');
  const craft = Object.keys(MB).filter(mbIsCraft).map(k => { const ok = mbCanCraft(k), need = Object.entries(MB[k][3]).map(([m, n]) => `<i class="${mbHave(m) >= n ? 'ok' : ''}">${mbHave(m)}/${n} ${MB_MAT[m] || m}</i>`).join(''); return cell(k, MB[k][5][0], `<span class="mb-need">${need}</span><button class="btn ${ok ? 'green' : 'cream'} sm" data-mbcraft="${k}"${ok ? '' : ' disabled'}>Fabriquer</button>`); }).join('');
  if (mbTab === 'fab') return tabs + `<h4 class="mb-h">À fabriquer <small>avec les matériaux de vos voyages</small></h4><div class="mb-g">${craft}</div>`;
  return tabs + `<h4 class="mb-h">Arrivage du jour <small>expire dans ${mbLeft('d')}</small></h4><div class="mb-g">${shop}</div>` + mkt;
};
document.addEventListener('click', ev => {
  const cb = ev.target.closest && ev.target.closest('[data-hmcat]'); if (cb && cb.closest('#panelBody')) { ev.stopPropagation(); hmEdit = true; hmEdTab = 'c'; hmPick = hmSel = null; hmMove = false; hmRe(); setTimeout(() => { const e = document.querySelector('#panelBody .hm-ed'); if (e) e.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); return; }
  const tb = ev.target.closest && ev.target.closest('[data-mbtab],[data-mbmkt]');
  if (tb && tb.closest('#panelBody')) { ev.stopPropagation(); if (tb.dataset.mbmkt) { hmEdit = false; hm$(() => openSheet('marche'), 0); return; } mbTab = tb.dataset.mbtab; hmRe(); return; }
  const b = ev.target.closest && ev.target.closest('[data-mbbuy],[data-mbcraft],[data-mbstar]'); if (!b || b.disabled) return; ev.stopPropagation();
  let it = null;
  if (b.dataset.mbstar) { const k = b.dataset.mbstar, pr = mbIsStar(k) && MB[k][3].stones; if (!pr || hm$(() => stonesN(), 0) < pr) return; S.stones -= pr; it = mbItem(k, b.dataset.mbcol); hm$(() => renderTop(), 0); }
  else if (b.dataset.mbbuy) { const k = b.dataset.mbbuy, pr = MB[k] && MB[k][3]; if (typeof pr !== 'number' || (S.coins || 0) < pr) return; S.coins -= pr; it = mbItem(k, b.dataset.mbcol); hm$(() => renderTop(), 0); }
  else { const k = b.dataset.mbcraft; if (!MB[k] || !mbCanCraft(k)) return; Object.entries(MB[k][3]).forEach(([m, n]) => { for (let i = 0; i < n; i++) { const c = S.inv.filter(x => x && x.cat === 'm' && x.sub === m).sort((a, b2) => (a.rarity | 0) - (b2.rarity | 0))[0]; if (c) S.inv.splice(S.inv.indexOf(c), 1); } }); it = mbItem(k); }
  if (!it) return;
  S.inv.push(it); { const k = mbId(it); if (k && !mbSeen().includes(k)) mbSeen().push(k); } save(); hmEdTab = 'o'; hmPick = it.id; hmSel = null; hmMove = false;
  hm$(() => toast(`${it.name} : touchez une case pour le poser.`), 0); hmRe();
}, true);
// ---------------- kit de bienvenue : une maison déjà habitée ----------------
const MB_KIT = [['salon', 'fauteuil', 6, 2, '#e0a07a'], ['salon', 'biblio', 9, 0, 0], ['salon', 'tapisrond', 6, 6, '#f7c8dd'], ['salon', 'tablebasse', 7, 7, 0], ['salon', 'pouf', 9, 8, '#f2c14e'],
  ['chambres', 'commode', 9, 0, '#fffaf0'], ['chambres', 'panier', 6, 8, '#7fb3e0'], ['chambres', 'tapisraye', 8, 5, '#7fb3e0'], ['chambres', 'tableau', 0, 8, '#7fb3e0'],
  ['cuisine', 'tableferme', 7, 7, 0], ['cuisine', 'chaise', 7, 8, 0], ['cuisine', 'chaise', 8, 6, 0], ['cuisine', 'horloge', 8, 0, 0],
  ['entree', 'grandeplante', 10, 1, '#fffaf0'], ['entree', 'tapisraye', 6, 7, '#e0685a'], ['entree', 'miroir', 0, 9, 0],
  ['atelier', 'coffre', 9, 4, 0], ['atelier', 'bureau', 7, 8, 0], ['nurserie', 'panier', 9, 6, '#f29cb0'], ['nurserie', 'pouf', 7, 9, '#f29cb0']];
function mbKit() {
  try {
    const H = hmS(); if (H.kit) return; H.kit = 1;
    const D = f3State();
    MB_KIT.forEach(([r, k, x, y, c]) => { const it = mbItem(k, c || undefined); if (!it || !hmCanAt(r, it, x, y)) return; const key = 'hm' + (++H.n); hmReg(key, it); D.d[key] = it; H.p[key] = { r, x, y, m: 0 }; });
    save();
  } catch (e) { console.error('kit maison', e); }
}
if (typeof fyRender === 'function') fyRender = (orig => function (box) { if (!hm$(() => pgTuto(), false)) mbKit(); return orig.apply(this, arguments); })(fyRender);
// ---------------- les modèles 3D ----------------
// construits centrés sur l'origine, la largeur w sur x, la profondeur d sur z (y du sol) ; le fond est côté −d/2
const MB3 = {
  canape(c, w, d) { const x = -w / 2, y = -d / 2, dk = h3Shade(c, -.14), lt = h3Shade(c, .1); h3Legs(x + .05, y + .05, w - .1, d - .1, .2); hB(x, y, .2, w, d, .5, dk, .2); hB(x, y - .05, .2, w, .55, 1.5, c, .26); hB(x - .05, y, .2, .4, d, 1, c, .2); hB(x + w - .35, y, .2, .4, d, 1, c, .2); [0, 1].forEach(i => { hB(x + .38 + i * (w - .76) / 2 + .02, y + .45, .7, (w - .76) / 2 - .04, d - .5, .3, lt, .15); hB(x + .4 + i * (w - .8) / 2 + .05, y + .02, .9, (w - .8) / 2 - .1, .45, .9, lt, .2); }); hB(x + .5, y + .55, 1, .45, .3, .45, '#ffd866', .18, { ns: 1 }); },
  fauteuil(c) { const dk = h3Shade(c, -.14); h3Legs(-.42, -.42, .84, .84, .18); hB(-.45, -.45, .18, .9, .9, .45, dk, .2); hB(-.45, -.5, .18, .9, .3, 1.25, c, .2); hB(-.5, -.45, .18, .25, .9, .85, c, .16); hB(.25, -.45, .18, .25, .9, .85, c, .16); hB(-.25, -.2, .6, .5, .6, .25, h3Shade(c, .1), .12); },
  chaise(c) { h3Legs(-.3, -.3, .6, .6, .5, c, .04); hB(-.32, -.32, .5, .64, .64, .08, c, .03); hB(-.32, -.36, .58, .64, .08, .75, c, .03); hB(-.22, -.25, .58, .44, .5, .06, '#f2c14e', .03); },
  tablebasse(c) { hCy(0, 0, .45, .48, .08, c); hCy(0, 0, 0, .08, .45, h3Shade(c, -.2)); hCy(0, 0, 0, .3, .04, h3Shade(c, -.2)); hCy(.1, .1, .53, .08, .15, '#fffdf7'); },
  tableferme(c, w, d) { h3Legs(-w / 2 + .05, -d / 2 + .05, w - .1, d - .1, .85, h3Shade(c, -.1), .07); hB(-w / 2, -d / 2, .85, w, d, .12, c, .04); hCy(-.3, 0, .97, .22, .06, '#fffdf7'); hSp(-.3, 0, 1.05, .08, '#e0533d'); hCy(.4, .05, .97, .08, .3, '#7fb3e0', { rt: .05 }); },
  commode(c) { hB(-.45, -.35, .1, .9, .7, 1.1, c, .05); h3Legs(-.42, -.32, .84, .64, .1, '#7a5236', .04); [.2, .55, .9].forEach(z => h3Drawer('Y', -.4, .35, z - .02, .8, .32, c)); hCy(.2, 0, 1.2, .1, .3, '#f7a8bd', { rt: .06 }); hSp(.2, 0, 1.55, .1, '#ffd866'); },
  biblio(c) { hB(-.45, -.4, 0, .9, .55, 2.6, c, .04); [.35, .95, 1.55, 2.15].forEach((z, j) => { hB(-.4, -.3, z - .05, .8, .45, .05, h3Shade(c, -.1), .01); for (let i = 0; i < 5; i++) hB(-.38 + i * .15, -.25, z, .12, .35, .38 + (i * 7 + j) % 3 * .07, ['#e0685a', '#6fa8dc', '#f2c14e', '#7fc38a', '#c9a0dc'][(i + j) % 5], .02); }); },
  lampadaire(c) { h3Lamp(0, 0, 0, 2.6, c); },
  grandeplante(c) { h3Plant(0, 0, 1.6, c); },
  cactus(c) { hCy(0, 0, 0, .25, .4, c, { rt: .3 }); hCy(0, 0, .4, .14, 1, '#5fb36b', { rt: .14 }); hSp(0, 0, 1.4, .14, '#5fb36b'); const a = hCy(.22, 0, .7, .07, .4, '#5fb36b'); a.rotation.z = -.2; hSp(0, 0, 1.52, .06, '#f7a8bd'); },
  bonsai(c) { hB(-.35, -.25, 0, .7, .5, .22, '#3f6fa8', .05); const t = hCy(0, 0, .2, .07, .7, c, { rt: .05 }); t.rotation.z = .25; [[-.15, 0, .95, .28], [.2, .05, 1.05, .24], [0, -.1, 1.15, .22]].forEach(([x, y, z, r]) => hSp(x, y, z, r, '#4f9a5f', 1.3, .7, 1)); },
  tapisrond(c, w) { hCy(0, 0, .006, w * .48, .03, c, { ns: 1, seg: 48, tex: 'fabric' }); hCy(0, 0, .037, w * .38, .006, '#fffaf0', { ns: 1, seg: 48 }); hCy(0, 0, .044, w * .33, .006, c, { ns: 1, seg: 48, tex: 'fabric' }); hCy(0, 0, .051, w * .18, .006, h3Shade(c, -.12), { ns: 1, seg: 40 }); },
  tapisraye(c, w, d) { hB(-w / 2 + .05, -d / 2 + .1, .006, w - .1, d - .2, .03, c, .01, { ns: 1, tex: 'fabric' }); [-.25, 0, .25].forEach(z => hB(-w / 2 + .1, z - .04, .042, w - .2, .08, .008, '#fffaf0', 0, { ns: 1 })); },
  pouf(c) { hCy(0, 0, 0, .38, .45, c, { tex: 'fabric', rt: .34 }); hTo(0, 0, .45, .3, .07, h3Shade(c, -.1)); },
  coffre(c) { hB(-.45, -.3, 0, .9, .6, .55, c, .05); const l = hB(-.47, -.32, .55, .94, .64, .2, h3Shade(c, -.1), .1); [-.3, .3].forEach(x => hB(x - .04, -.33, 0, .08, .66, .78, '#c9a35a', .02, { metal: .6, rough: .35 })); hB(-.08, .3, .35, .16, .04, .18, '#c9a35a', .02, { metal: .6, rough: .35 }); },
  piano(c, w, d) { hB(-w / 2 + .1, -d / 2, 0, w - .2, .55, 1.9, c, .06, { rough: .3 }); hB(-w / 2 + .1, -d / 2 + .55, .9, w - .2, .3, .1, c, .03, { rough: .3 }); hB(-w / 2 + .15, -d / 2 + .55, .95, w - .3, .3, .04, '#fffaf0', .01); for (let i = 0; i < 10; i++) hB(-w / 2 + .25 + i * .14, -d / 2 + .6, .99, .05, .18, .04, '#3b2a22', 0, { ns: 1 }); hB(-.4, -d / 2 + .9, .55, .8, .35, .45, '#c99a6a', .1); h3Legs(-.38, -d / 2 + .9, .76, .3, .55, '#7a5236', .04); hCy(.6, -d / 2 + .2, 1.9, .1, .3, '#fff', { e: '#ffd866', ei: .5 }); },
  aquarium(c) { hB(-.45, -.35, 0, .9, .7, .6, '#3b2a22', .04); hB(-.42, -.32, .6, .84, .64, .65, c, .02, { op: .45, rough: .05 }); hB(-.4, -.3, .62, .8, .6, .08, '#e2c49a', 0, { ns: 1 }); const f = [hSp(0, 0, .95, .07, '#f28f3b', 1.6, 1, .6, { ns: 1 }), hSp(0, 0, 1, .06, '#ffd866', 1.6, 1, .6, { ns: 1 })]; h3Anim(t => f.forEach((m, i) => { const a = t * (.7 + i * .3) + i * 3; m.position.set(Math.cos(a) * .28, .85 + i * .15 + Math.sin(t * 2 + i) * .05, Math.sin(a) * .2); m.rotation.y = -a; })); hCy(-.2, 0, .68, .02, .35, '#5fb36b'); },
  radio(c) { hB(-.35, -.3, 0, .7, .6, .5, '#b98a5e', .04); hB(-.3, -.22, .5, .6, .4, .4, c, .12); hCy(-.1, .18, .7, .1, .02, '#fffaf0'); const n = h3Sprite('note', 0, 0, 1.1, .3); h3Anim(t => { const u = (t * .5) % 1; n.position.set(.2 + Math.sin(u * 6) * .1, 1 + u * .8, 0); n.material.opacity = 1 - u; }); },
  comtoise(c) { hB(-.3, -.3, 0, .6, .5, 2.4, c, .05); hCy(0, .2, 1.95, .2, .03, '#fffaf0'); const pe = new THREE.Group(); pe.position.set(0, 1.6, .22); H3P.add(pe); { const Q = H3P; H3P = pe; hCy(0, 0, -1, .015, 1, '#c9a35a'); hCy(0, 0, -1.05, .1, .03, '#c9a35a', { metal: .7, rough: .3 }); H3P = Q; } pe.children.forEach(m => { if (m.geometry.parameters && m.geometry.parameters.radiusTop === .1) m.rotation.x = Math.PI / 2; }); h3Anim(t => { pe.rotation.z = Math.sin(t * 3.2) * .25; }); },
  tele(c) { h3Legs(-.4, -.3, .8, .6, .35, '#7a5236', .04); hB(-.45, -.35, .35, .9, .7, .7, c, .12); const s = hB(-.32, .33, .45, .64, .04, .5, '#9fd3f0', .06, { e: '#9fd3f0', ei: .6, ns: 1 }); h3Anim(t => { s.material.emissiveIntensity = .45 + Math.sin(t * 7) * .08 + Math.sin(t * 13) * .05; }); },
  bureau(c, w, d) { h3Legs(-w / 2 + .05, -d / 2 + .05, w - .1, d - .1, .9, h3Shade(c, -.1), .05); hB(-w / 2, -d / 2, .9, w, d, .1, c, .03); hB(w / 2 - .55, -d / 2 + .05, .45, .5, d - .1, .45, c, .03); h3Drawer('Y', w / 2 - .55, d / 2 - .05, .45, .5, .45, c); hB(-.6, -.3, 1, .5, .35, .04, '#fffaf0', .01); h3Lamp(.55, -.25, 1, .6, '#7fc38a'); },
  panier(c) { hCy(0, 0, 0, .45, .3, '#d9a86a', { rt: .48, tex: 'wood' }); hCy(0, 0, .2, .38, .12, c, { tex: 'fabric' }); },
  vitrine(c) { hB(-.42, -.35, 0, .84, .6, .2, '#b98a5e', .04); hB(-.4, -.33, .2, .8, .56, 1.7, '#e8f6ff', .02, { op: .3, rough: .05 }); hB(-.42, -.35, 1.9, .84, .6, .12, '#b98a5e', .04); [.7, 1.3].forEach(z => hB(-.38, -.31, z, .76, .52, .03, '#fffaf0', .01)); hSp(-.15, 0, .85, .12, '#c9a35a', 1, 1, 1, { metal: .7, rough: .3 }); hCy(.15, 0, 1.33, .1, .3, '#6fa8dc'); hSp(0, 0, .35, .1, '#f7a8bd'); },
  tableau(c) { hB(-.55, -.03, -.45, 1.1, .06, .9, '#c9a35a', .03); hB(-.47, .02, -.37, .94, .03, .74, '#d6f0fb', .01); hSp(-.15, .05, -.15, .25, c, 1.6, .2, .6); hSp(.25, .05, -.2, .2, h3Shade(c, -.15), 1.4, .2, .5); },
  miroir(c) { const m = hCy(0, 0, 0, .5, .06, c, { metal: .6, rough: .3 }); m.rotation.x = Math.PI / 2; const g = hCy(0, .04, 0, .42, .02, '#dff3fb', { metal: .9, rough: .05 }); g.rotation.x = Math.PI / 2; },
  horloge(c) { const m = hCy(0, 0, 0, .42, .08, c); m.rotation.x = Math.PI / 2; const t = hTo(0, .03, 0, .42, .04, '#c99a6a'); t.rotation.x = 0; const a = hB(-.02, .05, 0, .04, .02, .3, '#4a3528', 0, { ns: 1 }), b = hB(-.02, .05, 0, .04, .02, .22, '#e0685a', 0, { ns: 1 }); h3Anim(tt => { a.rotation.y = 0; a.rotation.z = -tt * .2; b.rotation.z = -tt * 2; }); },
  etagmur(c) { hB(-.55, -.1, -.1, 1.1, .3, .08, c, .02); h3Books(-.45, -.05, -.02, 4); hCy(.35, .05, -.02, .1, .25, '#7fc38a'); },
  guirlande(c) { for (let i = 0; i < 6; i++) { const s = hSp(-.6 + i * .24, .05, Math.sin(i / 5 * Math.PI) * -.15, .06, ['#ffd866', '#f6a3b7', '#a9d8f0'][i % 3], 1, 1, 1, { e: ['#ffd866', '#f6a3b7', '#a9d8f0'][i % 3], ei: 1, ns: 1 }); h3Anim(t => { s.material.emissiveIntensity = .4 + Math.abs(Math.sin(t * 2 + i)) * .9; }); } },
  trone(c) { hB(-.45, -.4, 0, .9, .8, .5, '#f6e2d8', .12); const s = hSp(0, -.35, 1.1, .6, c, 1, 1, .35); hB(-.3, -.15, .5, .6, .55, .2, '#c9a0dc', .1); [-.4, 0, .4].forEach(x => hSp(x * .9, -.35, 1.5 - Math.abs(x) * .6, .12, '#fff3e6')); },
  lanternecristal(c) { hB(-.25, -.25, 0, .5, .5, .1, '#8a8f95', .03, { metal: .6, rough: .35 }); hCo(0, 0, .1, .22, .9, c, { e: c, ei: .9, op: .8 }); hB(-.25, -.25, 1, .5, .5, .08, '#8a8f95', .03, { metal: .6, rough: .35 }); if (H3.nl++ < 3) hLt(0, 0, .6, c, .45, 4); },
  paravent(c, w) { [-.6, 0, .6].forEach((x, i) => { const p = hB(x - .3, -.05, 0, .6, .1, 1.8, c, .04); p.rotation.y = (i - 1) * .35; }); [-.6, 0, .6].forEach(x => hSp(x, .1, 1.3, .12, '#e8d8f5', .6, 1.4, .3)); },
  lampelune(c) { hCy(0, 0, 0, .25, .06, '#c9a35a', { metal: .6, rough: .35 }); hCy(0, 0, 0, .03, .5, '#c9a35a'); hSp(0, 0, .85, .32, c, 1, 1, 1, { e: c, ei: .8 }); if (H3.nl++ < 3) hLt(0, 0, .85, '#fff1c8', .55, 5); },
  fontaine(c) { hCy(0, 0, 0, .48, .35, c, { rt: .42 }); hCy(0, 0, .3, .38, .04, '#7fd3f0', { op: .8, rough: .05 }); hCy(0, 0, .35, .07, .5, c); hCy(0, 0, .85, .2, .1, c, { rt: .25 }); for (let i = 0; i < 4; i++) { const d = hSp(0, 0, .9, .04, '#9fdcf5', 1, 1.4, 1, { ns: 1 }); h3Anim(t => { const u = (t * 1.3 + i / 4) % 1, a = i * 1.57; d.position.set(Math.cos(a) * .25 * u, .95 + u * .2 - u * u * .6, Math.sin(a) * .25 * u); }); } },
  murfleuri(c) { hB(-.55, -.05, -.45, 1.1, .1, .9, '#6fbf73', .1, { tex: 'fabric' }); [[-.3, -.2], [.2, -.1], [-.1, .2], [.3, .25], [0, -.3]].forEach(([x, z], i) => hSp(x, .08, z, .1, [c, '#ffd866', '#fffaf0'][i % 3])); },
  banc(c, w, d) { h3Legs(-w / 2 + .1, -d / 2 + .15, w - .2, d - .3, .45, h3Shade(c, -.15), .06); hB(-w / 2, -d / 2 + .1, .45, w, d - .2, .1, c, .05); hB(-w / 2, -d / 2 + .05, .55, w, .12, .6, c, .05); hB(-.6, -.1, .55, .5, .4, .15, '#f29cb0', .1); },
  vaseperles(c) { hCy(0, 0, 0, .22, .6, c, { rt: .14, op: .7, rough: .05 }); [0, 1, 2, 3, 4].forEach(i => hSp(Math.cos(i) * .1, Math.sin(i) * .1, .2 + i * .08, .06, '#fff3f8', 1, 1, 1, { rough: .1 })); [[-.1, 1], [.1, .9]].forEach(([x, z]) => { hCy(x, 0, .6, .015, z - .55, '#5fb36b'); hSp(x, 0, z + .05, .1, '#f7a8bd'); }); },
};
Object.assign(MB3, {
  lustre(c) { const g = new THREE.Group(); g.position.set(0, 5.6, 0); H3P.add(g); const Q = H3P; H3P = g; hCy(0, 0, -.9, .02, .9, '#c9a35a', { metal: .8, rough: .3 }); hTo(0, 0, -1, .55, .05, '#c9a35a', { metal: .8, rough: .25 }); hTo(0, 0, -.8, .32, .04, '#c9a35a', { metal: .8, rough: .25 });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; hCo(Math.cos(a) * .55, Math.sin(a) * .55, -1.35, .07, .3, c, { e: '#fff6d8', ei: .5, op: .85, rough: .05 }); hSp(Math.cos(a) * .55, Math.sin(a) * .55, -.95, .05, '#fff6d8', 1, 1, 1, { e: '#ffe9a8', ei: 1.2 }); }
    hCo(0, 0, -1.6, .12, .45, c, { e: '#fff6d8', ei: .5, op: .85, rough: .05 }); H3P = Q; if (H3.nl++ < 3) hLt(0, 0, 4.4, '#fff1c8', .7, 7); h3Anim(t => { g.rotation.y = Math.sin(t * .4) * .08; }); },
  baldaquin(c, w, d) { h3Legs(-w / 2 + .1, -d / 2 + .1, w - .2, d - .2, .3, '#8a5a3c', .07); hB(-w / 2 + .1, -d / 2 + .1, .3, w - .2, d - .2, .4, '#b98a5e', .08); hB(-w / 2 + .2, -d / 2 + .2, .7, w - .4, d - .4, .35, '#fffaf2', .16); hB(-w / 2 + .5, -d / 2 + .15, .76, w - .65, d - .3, .36, c, .2); [-1, 1].forEach(s => hB(s * .45 - .3, -d / 2 + .3, 1.05, .6, .5, .25, '#fff', .12));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => hCy(a * (w / 2 - .12), b * (d / 2 - .12), 0, .06, 3.2, '#8a5a3c')); hB(-w / 2, -d / 2, 3.15, w, d, .12, '#8a5a3c', .04); hB(-w / 2 + .02, -d / 2 + .02, 3, w - .04, d - .04, .15, c, .06, { op: .9 });
    [[-w / 2 + .05, 'L'], [w / 2 - .25, 'R']].forEach(([x]) => hB(x, -d / 2 + .05, .9, .2, .5, 2.1, h3Shade(c, .15), .1, { tex: 'fabric', op: .92 })); },
  bassin(c, w, d) { hCy(0, 0, 0, w * .48, .45, c, { seg: 40, tex: 'wood' }); hCy(0, 0, .3, w * .42, .1, '#5fb7d8', { seg: 40, op: .85, rough: .05 }); [0, 1, 2].forEach(i => { const f = hSp(0, 0, .38, .1, ['#f28f3b', '#fffaf0', '#e0533d'][i], 1.8, .5, .8, { ns: 1 }); h3Anim(t => { const a = t * (.5 + i * .15) + i * 2.1; f.position.set(Math.cos(a) * .55, .38, Math.sin(a) * .5); f.rotation.y = -a; }); });
    [[-.4, .3], [.5, -.2]].forEach(([x, y]) => { const l = hCy(x, y, .41, .18, .02, '#6fbf73', { ns: 1 }); }); hSp(.2, .45, .45, .07, '#f7a8bd'); },
  pianoqueue(c, w, d) { const g = new THREE.Group(); H3P.add(g); const Q = H3P; H3P = g; hCy(.15, .1, .75, .95, .45, c, { seg: 32, rough: .2 }); hB(-.95, -.85, .75, 1.4, .9, .45, c, .05, { rough: .2 }); hB(-.95, -.95, .95, 1.3, .25, .08, '#fffaf0', .02); for (let i = 0; i < 9; i++) hB(-.9 + i * .14, -.97, 1.03, .05, .14, .04, '#2b2220', 0, { ns: 1 }); const lid = hB(-.6, -.6, 1.2, 1.5, 1.4, .05, c, .02, { rough: .2 }); lid.rotation.z = .45; lid.position.y = 1.55;
    [[-.8, -.7], [.8, -.5], [.4, .8]].forEach(([x, y]) => hCy(x, y, 0, .07, .75, c, { rough: .2 })); H3P = Q; hB(-.5, -1.35, 0, 1, .4, .5, '#2b2220', .08); },
  arbresouhaits(c) { hCy(0, 0, 0, .18, 1.6, '#8a5a3c', { rt: .12 }); [[0, 0, 1.9, .65], [-.35, .1, 1.55, .45], [.35, -.1, 1.6, .45]].forEach(([x, y, z, r]) => hSp(x, y, z, r, '#7fbf6a', 1.2, .9, 1.2)); for (let i = 0; i < 6; i++) { const a = i * 1.05, m = hSp(Math.cos(a) * .55, Math.sin(a) * .55, 1.35 + (i % 2) * .4, .09, c, 1, 1.3, 1, { e: c, ei: 1 }); h3Anim(t => { m.material.emissiveIntensity = .7 + Math.sin(t * 2 + i) * .4; }); } if (H3.nl++ < 3) hLt(0, 0, 1.6, '#ffc880', .5, 4); },
  carrousel(c) { const g = new THREE.Group(); H3P.add(g); const Q = H3P; H3P = g; hCy(0, 0, 0, .45, .15, '#fffaf0'); hCy(0, 0, .15, .42, .05, c); hCy(0, 0, .15, .04, 1, '#c9a35a', { metal: .7, rough: .3 }); hCo(0, 0, 1.15, .5, .4, c); hSp(0, 0, 1.58, .06, '#ffd866');
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; hCy(Math.cos(a) * .3, Math.sin(a) * .3, .2, .015, .95, '#c9a35a'); hSp(Math.cos(a) * .3, Math.sin(a) * .3, .55, .1, ['#fffaf0', '#f2c14e', '#7fb3e0', '#f7a8bd'][i], 1.6, .8, .7); } H3P = Q; h3Anim(t => { g.rotation.y = t * .8; }); },
  marbre(c, w, d) { hB(-w / 2, -d / 2, 0, w, .8, 2.6, c, .05, { rough: .25 }); hB(-w / 2 - .1, -d / 2, 2.6, w + .2, 1, .2, c, .04, { rough: .25 }); hB(-.55, -d / 2 + .76, .1, 1.1, .06, 1.4, '#2a1a14', .02, { ns: 1 }); [-.85, .85].forEach(x => hB(x - .12, -d / 2 + .7, 0, .24, .15, 2.6, '#e8dfd2', .04)); hB(-w / 2 - .1, -d / 2 + .9, 2.6, w + .2, .06, .06, '#c9a35a', .01, { metal: .7, rough: .3 });
    const f1 = hCo(0, -d / 2 + .5, .1, .28, .8, '#f28f3b', { e: '#f28f3b', ei: 1.4, ns: 1 }), lt = hLt(0, -d / 2 + 1.2, .8, '#ff9a40', 1.1, 7); h3Anim(t => { f1.scale.y = 1 + Math.sin(t * 9) * .12; lt.intensity = (hmNight() ? 1.8 : 1.1) * (1 + Math.sin(t * 13) * .08); }); hCy(-.6, -d / 2 + .4, 2.8, .1, .35, '#c9a35a', { metal: .7, rough: .3 }); hCy(.6, -d / 2 + .4, 2.8, .1, .35, '#c9a35a', { metal: .7, rough: .3 }); },
  globeceleste(c) { hCy(0, 0, 0, .35, .08, '#8a6448'); hCy(0, 0, .08, .04, .6, '#c9a35a', { metal: .7, rough: .3 }); const g = new THREE.Group(); g.position.set(0, 1.15, 0); H3P.add(g); const Q = H3P; H3P = g; hSp(0, 0, 0, .28, c, 1, 1, 1, { e: '#9fb8ff', ei: .5 }); [0, 1, 2].forEach(i => { const r = hTo(0, 0, 0, .45 + i * .06, .02, '#c9a35a', { metal: .8, rough: .25 }); r.rotation.set(i * .9, i * .5, 0); }); for (let i = 0; i < 5; i++) hSp(Math.cos(i * 1.3) * .2, Math.sin(i * 1.3) * .2, Math.sin(i) * .15, .025, '#ffe9a8', 1, 1, 1, { e: '#ffe9a8', ei: 1.5, ns: 1 }); H3P = Q; h3Anim(t => { g.rotation.y = t * .5; g.rotation.x = Math.sin(t * .3) * .2; }); },
});
h3Meuble = (o, sel) => {
  const k = mbId(o.it), D = MB[k]; if (!D || !MB3[k]) return false;
  const { it, p } = o, g = new THREE.Group(), P = H3P; H3P = g;
  const [w, d] = D[2];
  try { MB3[k](it.color || D[5][0], w, d); } catch (e) { console.error('meuble 3d', k, e); }
  H3P = P; H3P.add(g);
  if (o.w) { const L = p.y > 0 && p.x === 0, a = (L ? p.y : p.x) + .5; g.position.set(L ? .12 : a, 3.1, L ? a : .12); g.rotation.y = L ? Math.PI / 2 : 0; }
  else { const [fw, fd] = hmFp(it, p.m); g.position.set(p.x + fw / 2, 0, p.y + fd / 2); g.rotation.y = p.m ? Math.PI / 2 : 0; } // dos vers le mur du fond (ou de gauche si tourné)
  if (sel) { const y0 = g.position.y; h3Anim(t => { g.position.y = y0 + Math.abs(Math.sin(t * 4)) * .15; }); }
  return true;
};
{
  const st = document.createElement('style');
  st.textContent = `.mb-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:0 0 6px}.mb-tabs button{padding:6px 2px;border:2px solid transparent;border-radius:10px;background:#fbf4e8;font:800 11.5px var(--body,system-ui);color:var(--ink2,#7a6250);cursor:pointer}.mb-tabs button.on{background:#fff7d6;border-color:#f2c14e;color:var(--ink,#4a3528)}
.mb-intro{margin:0 2px 8px;font-size:12px;color:#9a8470}.mb-intro b{color:#6f5fc0}
.mb-mkt{display:flex;align-items:center;gap:8px;width:100%;margin:10px 0 2px;padding:10px 12px;border:2px solid #cfe3f5;border-radius:14px;background:#f2f8fd;font:800 13.5px var(--body,system-ui);color:var(--ink,#4a3528);cursor:pointer;text-align:left}.mb-mkt small{flex:1;font-weight:600;font-size:11.5px;color:#7f97ad}
.mb-c .money,.mb-c svg.stone{vertical-align:-2px}.mb-c .btn svg.stone{width:14px;height:14px;margin-left:3px}
.mb-h{margin:10px 2px 6px;font:800 13px var(--body,system-ui);color:#9a8470}.mb-h small{font-weight:600;color:#b9a48e;margin-left:4px}
.mb-g{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.mb-c{display:grid;grid-template-columns:44px 1fr;grid-template-rows:auto auto auto;gap:0 8px;align-items:center;padding:8px;border:2px solid var(--line,#eadfce);border-radius:14px;background:#fffdf8}
.mb-i{grid-row:span 2}.mb-i svg{width:44px;height:44px}.mb-c b{font-size:12.5px;line-height:1.15;color:var(--ink,#4a3528)}.mb-c small{font-size:11px;color:#9a8470}
.mb-c .btn{grid-column:span 2;margin-top:6px;width:100%}.mb-need{grid-column:span 2;display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}.mb-need i{font-style:normal;font-size:10.5px;padding:1px 6px;border-radius:8px;background:#f7efe3;color:#a8927c}.mb-need i.ok{background:#e6f5e2;color:#2f7f4c;font-weight:700}`;
  document.head.appendChild(st);
}

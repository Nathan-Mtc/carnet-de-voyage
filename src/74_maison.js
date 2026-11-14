// ================= 74 · LA MAISON DE POUPÉE (v46, étape 1) =================
// Le joueur : « au foyer il y a beaucoup de choses et on doit trop défiler pour améliorer ; la 3D est sympa mais ne sert
// à rien ». Décision (14/11) : une maison vue en coupe (maison de poupée, 2D) ; on touche une pièce et on y entre vraiment
// (esprit « planque de Tarkov ») : son niveau, ce qu'elle fait, ce qu'il faut pour l'améliorer, et ce qu'on y fait.
// Facile à utiliser : un seul écran, une pastille « ! » sur la pièce où il y a quelque chose à faire, un bouton retour.
// Rien n'est réécrit : les blocs existants (constructions de 48, jardin/nurserie/postes de 31-40, la vue 3D de 49 qui
// devient l'intérieur du salon) sont rangés dans leur pièce.
let hmRoom = null;
const HM_ROOMS = [
  // id, nom, construction (48 PG_B), blocs déplacés depuis l'ancien foyer, position dans la maison [x, y, l, h], couleur du mur
  { id: 'observ', nm: 'Observatoire', b: 'observ', blocks: [], r: [118, 34, 84, 44], wall: '#dfe6f7' },
  { id: 'chambres', nm: 'Chambres', b: 'chambre', blocks: ['.fw-head', '.fw-posts', '.fy2-list', '.rfg'], r: [36, 82, 124, 70], wall: '#f6e2ea' },
  { id: 'nurserie', nm: 'Nurserie', b: null, blocks: ['.fy2-nur'], r: [160, 82, 124, 70], wall: '#fdf0d8' },
  { id: 'salon', nm: 'Salon', b: 'cheminee', blocks: ['.f3'], r: [36, 152, 96, 76], wall: '#f9e7d2' },
  { id: 'cuisine', nm: 'Cuisine', b: 'repas', blocks: [], r: [132, 152, 76, 76], wall: '#e5f1df' },
  { id: 'atelier', nm: 'Atelier', b: 'atelier', blocks: [], r: [208, 152, 76, 76], wall: '#ece3d6' },
  { id: 'jardin', nm: 'Jardin', b: 'serre', blocks: ['.fy2-jar'], r: [292, 152, 62, 76], wall: '#e3f4e1', out: 1 },
];
const HM_INFO = {
  observ: 'Annonce à l’avance les moments rares du ciel.',
  chambres: 'Vos familiers qui ne voyagent pas vivent ici : donnez-leur un poste.',
  nurserie: 'Les œufs éclosent ici. Agrandissez-la pour accueillir plus de familiers.',
  salon: 'Décorez : le confort rend vos compagnons plus efficaces en voyage.',
  cuisine: 'Nourrir vos compagnons ici leur donne plus d’expérience.',
  atelier: 'Fabriquez objets, matériel et décorations.',
  jardin: 'Semez des graines : elles poussent même pendant vos voyages.',
};
const hm$ = (fn, d) => { try { const v = fn(); return v == null ? d : v; } catch (e) { return d; } };
const hmLvl = R => R.b ? hm$(() => pgLvl(R.b), 0) : 1;
function hmDot(R) {
  if (R.b && hm$(() => pgLvl(R.b) < 3 && pgCan(R.b).ok, false)) return true;
  if (R.id === 'nurserie' && (S.eggs || []).some(e => e.ready <= Date.now())) return true;
  return false;
}
function hmIcon(R) { return hm$(() => pgIconSVG(R.b || (R.id === 'nurserie' ? 'chambre' : 'hammer')), ''); }
const HM_EMOJI = { observ: '🔭', chambres: '🛏️', nurserie: '🥚', salon: '🛋️', cuisine: '🍳', atelier: '🔨', jardin: '🌱' };
function hmHouseHTML() {
  const stars = l => `<tspan class="hm-st">${'★'.repeat(l)}<tspan class="hm-st0">${'★'.repeat(3 - l)}</tspan></tspan>`;
  let rooms = '';
  HM_ROOMS.forEach(R => {
    const [x, y, w, h] = R.r, l = hmLvl(R), built = !R.b || l > 0, dot = hmDot(R);
    rooms += `<g class="hm-room${built ? '' : ' empty'}" data-hmroom="${R.id}" tabindex="0" role="button" aria-label="${R.nm}${R.b ? `, niveau ${l} sur 3` : ''}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${built ? R.wall : '#faf6ee'}" class="hm-wall"/>
      ${R.out ? '' : `<rect x="${x}" y="${y + h - 9}" width="${w}" height="9" class="hm-floor"/>`}
      <text x="${x + w / 2}" y="${y + h / 2 + 4}" class="hm-emo" text-anchor="middle">${built ? HM_EMOJI[R.id] : '+'}</text>
      <text x="${x + w / 2}" y="${y + 13}" text-anchor="middle" class="hm-nm">${R.nm}</text>
      ${R.b ? `<text x="${x + w / 2}" y="${y + h - 13}" text-anchor="middle" class="hm-stars">${stars(l)}</text>` : ''}
      ${dot ? `<circle cx="${x + w - 9}" cy="${y + 9}" r="7" class="hm-dot"/><text x="${x + w - 9}" y="${y + 12.5}" text-anchor="middle" class="hm-dott">!</text>` : ''}
    </g>`;
  });
  const night = hm$(() => { const h = new Date().getHours(); return h >= 20 || h < 7; }, false);
  return `<div class="hm"><svg class="hm-svg${night ? ' night' : ''}" viewBox="0 0 360 250" aria-label="Votre maison">
    <rect x="0" y="228" width="360" height="22" class="hm-ground"/>
    <path d="M24 82 L160 6 L296 82 Z" class="hm-roof"/>
    <rect x="30" y="80" width="260" height="150" class="hm-body"/>
    ${rooms}
    <path d="M292 152 L323 132 L354 152" class="hm-serre"/>
    <path d="M36 82 H284 M36 152 H284 M160 82 V152 M132 152 V228 M208 152 V228" class="hm-wallsep"/>
  </svg>
  <p class="hm-help">Touchez une pièce pour y entrer. <b class="hm-dotl">!</b> = quelque chose à faire.</p></div>`;
}
function hmRoomHead(R) {
  const l = hmLvl(R);
  return `<div class="hm-head"><button class="btn cream sm" data-hmback="1">← La maison</button><div class="hm-ht"><b>${HM_EMOJI[R.id]} ${R.nm}</b>${R.b ? `<small>Niveau ${l}/3</small>` : ''}</div></div>
    <p class="hm-info">${HM_INFO[R.id] || ''}</p>`;
}
if (typeof fyRender === 'function') fyRender = (orig => function (box) {
  if (!box || hm$(() => pgTuto(), false)) return orig.apply(this, arguments);
  if (!hmRoom) { box.innerHTML = hmHouseHTML(); box.classList.remove('f3-on'); return; }
  const R = HM_ROOMS.find(x => x.id === hmRoom); if (!R) { hmRoom = null; box.innerHTML = hmHouseHTML(); return; }
  // on construit l'ancien foyer à part, puis on range dans la pièce les blocs qui la concernent
  const tmp = document.createElement('div');
  try { orig.call(this, tmp); } catch (e) { console.error('foyer', e); }
  box.innerHTML = hmRoomHead(R);
  box.classList.toggle('f3-on', R.id === 'salon');
  if (R.id !== 'salon') box.insertAdjacentHTML('beforeend', `<div class="hm-pic" style="--w:${R.wall}">${hmIcon(R)}</div>`);
  R.blocks.forEach(sel => tmp.querySelectorAll(sel).forEach(e => box.appendChild(e)));
  if (R.b) box.insertAdjacentHTML('beforeend', `<div class="hm-up"><h3 class="hm-h">Améliorer la pièce</h3>${hm$(() => pgCardHTML(PG_BY[R.b]), '')}</div>`);
  if (R.id === 'atelier') box.insertAdjacentHTML('beforeend', `<button class="btn green" data-hmgo="atelier">🔨 Ouvrir l’établi</button>`);
  if (R.id === 'cuisine') box.insertAdjacentHTML('beforeend', `<button class="btn green" data-hmgo="talents">🍖 Nourrir un compagnon</button>`);
})(fyRender);
document.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const r = t.closest('[data-hmroom]'); if (r) { ev.stopPropagation(); hmRoom = r.dataset.hmroom; renderPanel(); const p = $('panelBody'); if (p) p.scrollTop = 0; return; }
  if (t.closest('[data-hmback]')) { ev.stopPropagation(); hmRoom = null; renderPanel(); return; }
  const g = t.closest('[data-hmgo]'); if (g) { ev.stopPropagation(); if (g.dataset.hmgo === 'atelier') openSheet('atelier'); else { try { tlOpen = 'feed'; } catch (e) {} if (typeof openCompagnons === 'function') openCompagnons('talents'); else openSheet('compagnons'); } }
}, true);
document.addEventListener('keydown', ev => { const r = ev.target.closest && ev.target.closest('[data-hmroom]'); if (r && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
// revenir sur l'onglet Foyer depuis ailleurs : on retrouve la maison
if (typeof openSheet === 'function') openSheet = (orig => function (name) { if (name === 'village' || name === 'foyer') hmRoom = null; return orig.apply(this, arguments); })(openSheet);
{
  const st = document.createElement('style');
  st.textContent = `.hm-svg{width:100%;height:auto;display:block;border-radius:18px;background:linear-gradient(#cfe8f6,#eef7fb 70%);border:2.5px solid var(--ink,#4a3528)}
.hm-svg.night{background:linear-gradient(#2d3a63,#56628f 70%)}
.hm-ground{fill:#9fcf86}.hm-roof{fill:#d9735a;stroke:#4a3528;stroke-width:2.5;stroke-linejoin:round}.hm-body{fill:#fff8ec;stroke:#4a3528;stroke-width:2.5}
.hm-room{cursor:pointer}.hm-room .hm-wall{stroke:#4a3528;stroke-width:1.2}.hm-room:hover .hm-wall,.hm-room:focus .hm-wall{fill:#fff3c9}
.hm-room.empty .hm-wall{stroke-dasharray:4 3;stroke:#b5a08a}.hm-room.empty .hm-emo{fill:#b5a08a;font-size:26px}
.hm-floor{fill:#d9b98f}.hm-emo{font-size:24px}.hm-nm{font:800 10px var(--display,system-ui);fill:#4a3528}
.hm-stars{font-size:9px;fill:#e0a01e}.hm-st0{fill:#d8ccb8}.hm-dot{fill:#e0533d;stroke:#fff;stroke-width:1.5}.hm-dott{font:800 10px system-ui;fill:#fff}
.hm-serre{fill:#d9f0e6;stroke:#4a3528;stroke-width:2;stroke-linejoin:round}.hm-wallsep{fill:none;stroke:#4a3528;stroke-width:2}
.hm-help{margin:6px 2px 0;font-size:12.5px;color:var(--ink2,#7a6250)}.hm-dotl{display:inline-block;width:15px;height:15px;border-radius:50%;background:#e0533d;color:#fff;text-align:center;font:800 10px/15px system-ui}
.hm-head{display:flex;align-items:center;gap:10px;margin-bottom:4px}.hm-ht b{display:block;font:800 18px var(--display,inherit);color:var(--ink,#4a3528)}.hm-ht small{font-size:12px;color:#c98a12;font-weight:800}
.hm-info{margin:0 2px 8px;font-size:13px;color:var(--ink2,#7a6250)}
.hm-pic{display:flex;align-items:center;justify-content:center;height:120px;border-radius:18px;border:2.5px solid var(--ink,#4a3528);background:radial-gradient(circle at 50% 70%,#fff 0 30%,var(--w) 70%);margin-bottom:10px}
.hm-pic svg{width:84px;height:84px}
.hm-up{margin:10px 0}.hm-h{margin:0 2px 6px;font:800 13px var(--body,system-ui);color:#9a8470;text-transform:uppercase;letter-spacing:.04em}
#panelBody>.btn.green{display:block;width:100%;margin-top:8px}`;
  document.head.appendChild(st);
}
window.__hm = { house: () => hmHouseHTML(), room: () => hmRoom, fy: b => fyRender(b) };

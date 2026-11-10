// ================= 55 · RETOUR DE VOYAGE TRIÉ (v40) =================
// Demande du joueur : « le journal de voyage, les gens ne le lisent pas : trop d'éléments, pas intéressant.
// Il faut que ce soit intrigant, important, catégorisé et pertinent. »
// → Après tous les modules, on range les notes du retour :
//   1 MOMENT FORT en grand (seulement s'il y a quelque chose d'important), puis 3 catégories repliées :
//   📈 Progrès · 🎁 Bonus du voyage · ⚠️ À savoir. Ce qui n'apporte rien disparaît.
const JR_CATS = [
  // [clé, motif, titre « accrocheur » du moment fort (null = pas un moment fort), catégorie si pas mis en avant]
  ['carnet', /augustine|page du carnet|chapitre/i, '📖 Une page du carnet d’Augustine !', 'prog'],
  ['gardien', /gardien|confiance|légendaire.*(cerf|lynx|renard|tortue)/i, '🦌 Une présence vous observe…', 'prog'],
  ['carte', /bout de carte|morceau de carte|rumeur|carte déchirée/i, '📜 Un mystère commence…', 'prog'],
  ['secret', /secret|énigme résolue|trésor/i, '❓ Un secret dévoilé', 'prog'],
  ['acces', /désormais accessible|nouveau lieu|lieu secret/i, '🗺️ De nouveaux horizons', 'prog'],
  ['oeuf', /œuf|rencontre|nouvelle espèce|apprivois/i, '🥚 Une rencontre inattendue', 'prog'],
  ['record', /record|vainqueur|conquis|titre/i, '🏔️ Un exploit !', 'prog'],
  ['echec', /demi-tour|blessé|échou|il fallait|manque du matériel|perdu/i, '⛈️ L’expédition a mal tourné…', 'warn'],
  ['prog', /succès|palier|rang|niveau|exp\.|xp|terrain|maîtrise/i, null, 'prog'],
  ['warn', /épuisé|fatigu|repousse|risque|tempête/i, null, 'warn'],
  ['bonus', /.*/, null, 'bonus']
];
const JR_BOX = { prog: ['📈', 'Progrès'], bonus: ['🎁', 'Bonus du voyage'], warn: ['⚠️', 'À savoir'] };
function jrKind(t) { for (const c of JR_CATS) if (c[1].test(t)) return c; return JR_CATS[JR_CATS.length - 1]; }
function jrOrganize() {
  const m = document.querySelector('#modal .mbox'); if (!m || !m.querySelector('.hhead') || m.dataset.jr === '1') return;
  m.dataset.jr = '1';
  const btn = [...m.children].reverse().find(e => e.matches('button[data-closemodal]'));
  const keep = e => e.matches('.hhead, .hbig, .haul, .jr-wrap') || e === btn || /Ce que vous rapportez/.test(e.textContent || '');
  const notes = [];
  [...m.children].forEach(e => {
    if (keep(e)) return;
    if (e.matches('.hextra')) { [...e.children].forEach(li => notes.push(li)); e.remove(); return; }
    if ((e.textContent || '').trim()) notes.push(e);
  });
  if (!notes.length) return;
  const box = { prog: [], bonus: [], warn: [] }; let hero = null, heroT = '';
  const ranked = notes.map(n => ({ n, k: jrKind(n.textContent || '') }));
  // Le moment fort : le premier élément important, dans l'ordre de JR_CATS (le plus marquant d'abord)
  for (const c of JR_CATS) { if (!c[2]) continue; const r = ranked.find(x => x.k === c); if (r) { hero = r; heroT = c[2]; break; } }
  ranked.forEach(r => { if (r !== hero) box[r.k[3]].push(r.n); });
  const wrap = document.createElement('div'); wrap.className = 'jr-wrap';
  if (hero) {
    const h = document.createElement('div'); h.className = 'jr-hero' + (hero.k[0] === 'echec' ? ' bad' : '');
    h.innerHTML = `<b class="jr-ht">${heroT}</b>`; hero.n.classList.add('jr-in'); h.appendChild(hero.n); wrap.appendChild(h);
  }
  ['prog', 'bonus', 'warn'].forEach(k => {
    if (!box[k].length) return;
    const d = document.createElement('details'); d.className = 'jr-cat jr-' + k;
    // « À savoir » s'ouvre seul quand il explique un échec ; le reste reste replié
    if (k === 'warn' && hero && hero.k[0] === 'echec') d.open = true;
    d.innerHTML = `<summary><span>${JR_BOX[k][0]}</span>${JR_BOX[k][1]}<b>${box[k].length}</b></summary>`;
    const body = document.createElement('div'); body.className = 'jr-body';
    box[k].forEach(n => { n.classList.add('jr-in'); body.appendChild(n); });
    d.appendChild(body); wrap.appendChild(d);
  });
  if (btn) m.insertBefore(wrap, btn); else m.appendChild(wrap);
}
if (typeof showHaul === 'function') showHaul = (orig => function () {
  const r = orig.apply(this, arguments);
  try { jrOrganize(); setTimeout(() => { const m = document.querySelector('#modal .mbox'); if (m) { m.dataset.jr = ''; m.querySelectorAll(':scope > .jr-wrap').forEach(w => { [...w.querySelectorAll('.jr-in')].forEach(n => m.insertBefore(n, w)); w.remove(); }); jrOrganize(); } }, 120); } catch (e) { console.error('journal', e); }
  return r;
})(showHaul);
{
  const st = document.createElement('style');
  st.textContent = `.jr-wrap{width:100%;display:flex;flex-direction:column;gap:8px;margin:4px 0 8px;text-align:left}
.jr-hero{position:relative;padding:12px 14px 12px;border-radius:16px;background:linear-gradient(135deg,#fff4d6,#ffe6b8);border:2.5px solid #c9902a;box-shadow:0 3px 0 rgba(120,80,20,.25)}
.jr-hero.bad{background:linear-gradient(135deg,#f3eef8,#e4dcef);border-color:#7f6aa8}
.jr-ht{display:block;font:800 16px var(--display,system-ui);color:#5b3a12;margin-bottom:4px}.jr-hero.bad .jr-ht{color:#3f2f63}
.jr-hero .jr-in{background:none!important;border:0!important;padding:0!important;margin:0!important;box-shadow:none!important;font-size:14px;line-height:1.4;list-style:none}
.jr-cat{border:2px solid var(--line,#e7dccb);border-radius:14px;background:#fffdf7}
.jr-cat summary{list-style:none;display:flex;align-items:center;gap:8px;padding:8px 12px;font:800 14px var(--body,system-ui);color:var(--ink,#4a3528);cursor:pointer}
.jr-cat summary::-webkit-details-marker{display:none}
.jr-cat summary b{margin-left:auto;min-width:22px;height:22px;border-radius:11px;background:#efe6d6;display:grid;place-items:center;font-size:12px}
.jr-cat summary::after{content:'▾';color:#a08a72;margin-left:6px}.jr-cat[open] summary::after{content:'▴'}
.jr-warn{border-color:#e6c27a}
.jr-body{display:flex;flex-direction:column;gap:6px;padding:0 10px 10px}
.jr-body .jr-in{margin:0!important;font-size:13px;list-style:none}
.jr-body li.jr-in{background:#fff7dc;border:1.5px solid #ecd59a;border-radius:10px;padding:6px 9px}`;
  document.head.appendChild(st);
}

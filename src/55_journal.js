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
  const keep = e => e.matches('.hhead, .hbig, .haul, .jr-wrap, .obsum') || e === btn || /Ce que vous rapportez/.test(e.textContent || '');
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
  ranked.forEach(r => { if (r === hero) return; if (r.k[3] === 'bonus') { r.n.remove(); return; } box[r.k[3]].push(r.n); }); // v41 : les petits bonus disparaissent
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
// v41 : « ce qui sert maintenant » : les objets utilisables tout de suite passent devant, avec un ✔,
// et « Ce que vous rapportez » se réduit à UN bouton, l'action la plus utile.
function jrUseNow(it) {
  const cm = typeof usCmRecipes === 'function' ? (usCmRecipes(it) || []).find(x => x.ok) : null;
  if (cm) return { t: 'Préparer : ' + cm.R.def[0], run: () => usCook(cm.R.id) };
  const at = typeof usAtRecipes === 'function' ? (usAtRecipes(it) || []).find(x => x.ok && (typeof usGearOf !== 'function' || usGearOf(x.r.out))) : null;
  if (at) return { t: 'Fabriquer : ' + at.r.out[0], run: () => usCraft(at.r.id) };
  return null;
}
let jrAct = null;
function jrItems() {
  const m = document.querySelector('#modal .mbox'), haul = m && m.querySelector('.haul'); if (!haul) return;
  if (!haul.dataset.jri) { haul.dataset.jri = '1'; jrAct = null;
  const cards = [...haul.children], useful = [];
  cards.forEach(c => {
    const it = (S.inv || []).find(i => i.id === c.dataset.fiche); const u = it && jrUseNow(it);
    if (u) { c.classList.add('jr-now'); useful.push(c); if (!jrAct) jrAct = u; }
  });
  useful.reverse().forEach(c => haul.prepend(c)); }
  const sum = m.querySelector('.obsum');
  if (sum && !sum.dataset.jr) { sum.dataset.jr = '1';
    // Sans action « utile maintenant », on garde le VRAI bouton du module 23 (déplacé, pas copié, pour qu'il marche)
    // en choisissant le plus parlant, avec un libellé clair qui nomme l'objet.
    const PRI = ['craft', 'wear', 'order', 'bait', 'reve'];
    const bs = jrAct ? [] : [...sum.querySelectorAll('.obsa button')];
    const b = bs.sort((x, y) => (PRI.indexOf(x.dataset.obgo) + 1 || 9) - (PRI.indexOf(y.dataset.obgo) + 1 || 9))[0] || null;
    if (jrAct) sum.innerHTML = `<button class="btn green jr-one" data-jrone="1">${esc(jrAct.t)}</button>`;
    else if (b) {
      const it = (S.inv || []).find(i => i.id === b.dataset.obid), nm = it ? it.name : '';
      const L = { bait: `Emporter l’appât : ${nm}`, wear: b.textContent + (nm ? ` (${nm})` : ''), craft: (() => { const r = typeof RECIPES !== 'undefined' && RECIPES.find(x => x.id === b.dataset.obarg); return r ? `Fabriquer : ${r.out[0]}` : b.textContent; })() };
      if (['bait', 'wear', 'craft'].includes(b.dataset.obgo)) b.textContent = L[b.dataset.obgo];
      else if (!PRI.includes(b.dataset.obgo)) b.textContent = nm ? `Œuf : réchauffer avec ${nm} (éclosion plus rapide)` : b.textContent;
      b.className = 'btn green jr-one'; sum.innerHTML = ''; sum.appendChild(b);
    } else sum.remove();
  }
}
document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-jrone]'); if (!b || !jrAct) return; ev.stopPropagation(); try { jrAct.run(); } catch (e) {} b.disabled = true; b.textContent = '✔ ' + b.textContent; }, true);
if (typeof showHaul === 'function') showHaul = (orig => function () {
  const r = orig.apply(this, arguments);
  try { jrOrganize(); jrItems(); setTimeout(() => { const m = document.querySelector('#modal .mbox'); if (m) { m.dataset.jr = ''; m.querySelectorAll(':scope > .jr-wrap').forEach(w => { [...w.querySelectorAll('.jr-in')].forEach(n => m.insertBefore(n, w)); w.remove(); }); jrOrganize(); jrItems(); } }, 120); } catch (e) { console.error('journal', e); }
  return r;
})(showHaul);
{
  const st = document.createElement('style');
  st.textContent = `.haul .hcard{position:relative}
.haul .hcard .hnew{left:auto!important;right:4px!important}
.haul .hcard .obu,.haul .hcard .hr{display:none!important}
.haul .hcard .rgp{position:absolute;top:5px;left:5px;padding:0!important;margin:0!important;background:none!important;border:0!important;z-index:2}
.haul .hcard .rgp>span{display:none}.haul .hcard .rgp .rgb{width:22px;height:22px;display:grid;place-items:center}
.haul .hcard.jr-now{border-color:#5fb36b!important;box-shadow:0 0 0 2px #d8f0d8}
.haul .hcard.jr-now::after{content:'✔';position:absolute;bottom:6px;right:6px;width:20px;height:20px;border-radius:50%;background:#5fb36b;color:#fff;font:800 12px/20px system-ui;text-align:center}
.obsum{padding:6px!important;background:none!important;border:0!important;box-shadow:none!important}
.jr-one{width:100%}
.jr-wrap{width:100%;display:flex;flex-direction:column;gap:8px;margin:4px 0 8px;text-align:left}
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

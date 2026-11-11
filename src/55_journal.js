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
  const keep = e => e.matches('.hhead, .hbig, .haul, .jr-wrap, .obsum, .jr-bar') || e === btn || /Ce que vous rapportez/.test(e.textContent || '');
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
  // v43 : le joueur veut voir Progrès et À savoir EN HAUT, sans faire défiler : juste sous le titre du retour
  const top = [...m.children].filter(e => e.matches('.hhead, .hbig')).pop();
  if (top) top.after(wrap); else if (btn) m.insertBefore(wrap, btn); else m.appendChild(wrap);
  wrap.classList.add('jr-top');
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
  // v44 : plus de bouton séparé : on SÉLECTIONNE un objet, et une barre propose Utiliser + Détails
  const sum = m.querySelector('.obsum'); if (sum) sum.remove();
  if (!haul.querySelector('.hcard.jr-sel')) { const f = haul.querySelector('.hcard.jr-now:not(.jr-used)') || haul.querySelector('.hcard'); if (f) jrSelect(f.dataset.fiche); }
}
function jrMainOf(it) {
  if (!it || typeof usActsFor !== 'function') return null;
  const acts = usActsFor(it), a = usMainOf(acts, it); if (!a) return null;
  const t = a.out && a.kind !== 'planter' ? (a.kind === 'cuisiner' ? 'Cuisiner : ' : 'Fabriquer : ') + a.label
    : (typeof US_VERB !== 'undefined' && US_VERB[a.kind] && !/^(Porter|Équiper|Nourrir|Ouvrir)/.test(a.label) ? US_VERB[a.kind] + ' : ' : '') + a.label;
  return { t, run: a.run };
}
function jrSelect(id) {
  const m = document.querySelector('#modal .mbox'), haul = m && m.querySelector('.haul'); if (!haul) return;
  haul.querySelectorAll('.hcard.jr-sel').forEach(c => c.classList.remove('jr-sel'));
  const c = haul.querySelector(`.hcard[data-fiche="${id}"]`); if (!c) return;
  c.classList.add('jr-sel');
  const it = (S.inv || []).find(i => i.id === id), main = c.classList.contains('jr-used') ? null : jrMainOf(it);
  let u = null; try { u = typeof utilOf === 'function' ? utilOf(it) : null; } catch (e) {}
  let bar = m.querySelector(':scope > .jr-bar');
  if (!bar) { bar = document.createElement('div'); bar.className = 'jr-bar'; haul.insertAdjacentElement('afterend', bar); }
  const nm = it ? it.name : (c.querySelector('.hn, b, strong') || c).textContent.trim();
  bar.dataset.id = id;
  bar.innerHTML = `<div class="jr-bh"><b>${esc(nm)}</b>${u && u.txt ? `<span>${u.ico || ''} ${esc(u.txt)}</span>` : ''}</div>
    <div class="jr-bb">${c.classList.contains('jr-used') ? '<span class="jr-done">Déjà utilisé</span>' : main ? `<button class="btn green sm" data-jruse="${id}">${esc(main.t)}</button>` : '<span class="jr-none">Rien à faire tout de suite</span>'}
    <button class="btn cream sm" data-jrdet="${id}">🔍 Détails</button></div>`;
}
let jrPass = false;
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
.haul .hcard.jr-sel{outline:3.5px solid var(--ink,#4a3528);outline-offset:2px;transform:translateY(-2px)}
.jr-bar{width:100%;margin:2px 0 8px;padding:10px 12px;border:2.5px solid var(--ink,#4a3528);border-radius:16px;background:#fff;box-shadow:0 3px 0 rgba(74,53,40,.3);text-align:left}
.jr-bh{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}.jr-bh b{font:800 15px var(--display,system-ui);color:var(--ink,#4a3528)}.jr-bh span{font-size:13px;color:#7a6656}
.jr-bb{display:flex;gap:8px;align-items:center}.jr-bb .btn.green{flex:1 1 auto}.jr-bb .btn.cream{flex:0 0 auto}
.jr-none,.jr-done{flex:1 1 auto;font:700 13px var(--body,system-ui);color:#9a8470}.jr-done{color:#8a8178}
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
  st.textContent += `\n.jr-wrap.jr-top{margin:6px 0 10px}.jr-top .jr-cat{margin:4px 0}.jr-top .jr-cat summary{padding:6px 10px}.jr-top .jr-in{padding:6px 10px;font-size:14px}`;
  document.head.appendChild(st);
}

// ---- v43 : après « Utiliser » depuis la fiche d'un objet du butin, on REVIENT au butin (au lieu de tout fermer),
// pour revoir ce qu'on a rapporté. L'objet utilisé porte un petit « ✔ utilisé ».
let jrSnap = null, jrUsedId = null;
window.addEventListener('click', ev => {
  const t = ev.target; if (!t.closest) return;
  const card = t.closest('#modal .haul .hcard[data-fiche]');
  if (card && !jrPass) { ev.stopPropagation(); ev.preventDefault(); jrSelect(card.dataset.fiche); return; }
  if (card) { const m = document.querySelector('#modal .mbox'); jrSnap = m ? m.innerHTML : null; jrUsedId = card.dataset.fiche; return; }
  const det = t.closest('[data-jrdet]');
  if (det) { ev.stopPropagation(); ev.preventDefault(); const c = document.querySelector(`#modal .haul .hcard[data-fiche="${det.dataset.jrdet}"]`); if (c) { jrPass = true; c.click(); jrPass = false; } return; }
  const use = t.closest('[data-jruse]');
  if (use) {
    ev.stopPropagation(); ev.preventDefault();
    const id = use.dataset.jruse, it = (S.inv || []).find(i => i.id === id), main = jrMainOf(it); if (!main) return;
    const box0 = document.querySelector('#modal .mbox'); const snap = box0 ? box0.innerHTML : null;
    try { main.run(); } catch (e) { console.error('utiliser', e); }
    setTimeout(() => {
      const mod = document.getElementById('modal'), box = mod && mod.querySelector('.mbox'); if (!box) return;
      if (!mod.hidden && !box.querySelector('.hhead') && !box.querySelector('.fiche')) return; // un autre écran utile s'est ouvert
      if (!box.querySelector('.hhead') && snap) { box.innerHTML = snap; mod.hidden = false; }
      const c = box.querySelector(`.hcard[data-fiche="${id}"]`); if (c) { c.classList.add('jr-used'); c.classList.remove('jr-now'); }
      const nx = box.querySelector('.hcard.jr-now:not(.jr-used)'); jrSelect(nx ? nx.dataset.fiche : id);
      if (typeof toast === 'function') toast('✔ ' + main.t);
    }, 80);
    return;
  }
  if (t.closest('[data-closemodal]') && !t.closest('.fiche')) { jrSnap = null; return; }
  const act = t.closest('#modal .fiche [data-usact], #modal .fiche [data-usres]');
  if (!act || !jrSnap) return;
  if (act.classList.contains('usres') && !act.classList.contains('ok')) return; // v45 : résultat pas encore faisable
  const snap = jrSnap, used = jrUsedId, label = (act.innerText || '').replace(/\s+/g, ' ').trim();
  setTimeout(() => {
    const mod = document.getElementById('modal'); if (!mod) return;
    const box = mod.querySelector('.mbox');
    // si une autre fenêtre utile s'est ouverte (atelier, magasin…), on la laisse ; sinon on revient au butin
    if (!mod.hidden && box && !box.querySelector('.fiche') && !box.querySelector('.hhead')) return;
    box.innerHTML = snap; mod.hidden = false;
    const c = box.querySelector(`.hcard[data-fiche="${used}"]`); if (c) { c.classList.add('jr-used'); c.classList.remove('jr-now'); }
    jrSelect(used); jrSnap = box.innerHTML;
    if (label && typeof toast === 'function') toast('✔ ' + label);
  }, 80);
}, true);
{
  const st = document.createElement('style');
  st.textContent = `.haul .hcard.jr-used{filter:grayscale(.75);opacity:.7}.haul .hcard.jr-used::after{display:none!important}
.haul .hcard.jr-used::before{content:'Utilisé';position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-8deg);z-index:3;background:#8a8178;color:#fff;font:800 11px/1 system-ui;padding:4px 8px;border-radius:999px;box-shadow:0 2px 0 rgba(0,0,0,.2)}`;
  document.head.appendChild(st);
}

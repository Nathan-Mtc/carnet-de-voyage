// ================= LIEUX À DÉFI (v164) : la chasse au trésor sur les vrais lieux =================
// Le joueur : « je veux des lieux à défi presque dans chaque village, pas seulement les Alpes ; qu'on galère de façon
// exponentielle pour y accéder ; que ce qu'on obtient soit propre au lieu et vaille le coup ; des cadenas, pas de code couleur ».
// - Parmi les vrais lieux de la carte, certains (chapelle, château, ruines, étang, rivière, sommet, belvédère, forêt…)
//   deviennent des lieux à défi, toujours les mêmes (tirage fixé par le lieu), de ★1 à ★3 pour l'instant.
// - Chaque lieu a des CADENAS : un équipement d'un certain niveau, un familier d'un terrain et d'un niveau, un moment réel,
//   des matériaux qu'on ne trouve QUE dans les lieux à défi de l'étoile d'en dessous. D'où la croissance exponentielle.
// - Tous les cadenas ouverts : on rapporte des matériaux de l'étoile du lieu et, la première fois, un trésor à son nom.
//   On peut tenter sans tout : on revient rarement avec quelque chose.
// - Sur la carte : une pastille par lieu à défi (étoiles + cadenas ouverts/fermés), et un filtre (tous, ouverts, presque, masqués).
const ld$ = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { console.error('défis', e); return d; } };
function ldSt() { if (!S.ld || typeof S.ld !== 'object') S.ld = {}; const s = S.ld; if (!s.done) s.done = {}; if (!s.f) s.f = 'tout'; if (!s.stars) s.stars = [1, 2, 3]; return s; }

const LD_FAM = {
  ancien: { nm: 'Lieu ancien', gear: ['lanterne', 'boussole', 'lampe'], ter: null, mats: ['Pierre gravée', 'Médaille ancienne', 'Sceau oublié'], col: '#b08a5a', tr: 'Relique' },
  eau: { nm: 'Lieu d’eau', gear: ['bottes', 'palmes', 'cire'], ter: ['riviere', 'marais', 'mer'], mats: ['Galet poli', 'Perle d’eau douce', 'Larme de source'], col: '#3f8fb8', tr: 'Galet chantant' },
  hauteur: { nm: 'Lieu en hauteur', gear: ['crampons', 'corde', 'jumelles'], ter: ['montagne'], mats: ['Éclat de roche', 'Cristal de crête', 'Cœur de sommet'], col: '#8a7a9a', tr: 'Cristal' },
  nature: { nm: 'Lieu sauvage', gear: ['jumelles', 'lanterne', 'bottes'], ter: ['foret', 'campagne'], mats: ['Graine rare', 'Écorce dorée', 'Sève ancienne'], col: '#5f8f52', tr: 'Gland d’or' },
};
const LD_CAT = { patrimoine: 'ancien', etang: 'eau', riviere: 'eau', port: 'eau', plage: 'eau', phare: 'eau', sentier: 'hauteur', belvedere: 'hauteur', foret: 'nature', parc: 'nature', jardin: 'nature', camping: 'nature', ferme: 'nature' };
const LD_P = { patrimoine: .55, etang: .45, riviere: .4, port: .35, plage: .35, phare: .8, sentier: .6, belvedere: .7, foret: .35, parc: .1, jardin: .15, camping: .2, ferme: .2 };
const LD_BIG = ['ruins', 'castle', 'peak', 'waterfall', 'alpine_hut', 'lighthouse', 'saddle', 'monument'];
const LD_CACHE = {};
const ldHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const ldRnd = seed => { let a = seed || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const ldPick = (r, a) => a[Math.floor(r() * a.length)];

// ---------- un lieu est-il à défi ? (toujours la même réponse pour le même vrai lieu) ----------
function ldOf(p) {
  if (!p || !p.cat || !p.name || p.tuto) return null;
  const fam = LD_CAT[p.cat]; if (!fam) return null;
  const id = 'ld' + ldHash(p.cat + '|' + p.name + '|' + (+p.lon).toFixed(3) + '|' + (+p.lat).toFixed(3)).toString(36);
  if (LD_CACHE[id]) return LD_CACHE[id];
  const r = ldRnd(ldHash(id));
  if (r() > (LD_P[p.cat] || .2)) return null;
  const F = LD_FAM[fam], big = p.osm && LD_BIG.includes(p.osm.subclass) ? 1 : 0, x = r();
  const s = Math.min(3, 1 + (x < .55 ? 0 : x < .88 ? 1 : 2) + big);
  const terOf = () => { if (!F.ter) return null; if (fam === 'eau') return ['port', 'plage', 'phare'].includes(p.cat) ? 'mer' : p.cat === 'etang' && r() < .4 ? 'marais' : 'riviere'; if (fam === 'nature') return ['ferme', 'camping'].includes(p.cat) ? 'campagne' : 'foret'; return F.ter[0]; };
  const otherFam = () => ldPick(r, Object.keys(LD_FAM));
  const g = ldPick(r, F.gear), L = [];
  if (s === 1) {
    if (F.ter && r() < .5) L.push({ t: 'c', ter: terOf(), lvl: 3 }); else L.push({ t: 'g', g, tier: 1 });
  } else if (s === 2) {
    L.push({ t: 'g', g, tier: 2 });
    L.push({ t: 'i', fam: otherFam(), tier: 0, n: 3 });
    if (r() < .5) L.push(F.ter ? { t: 'c', ter: terOf(), lvl: 8 } : { t: 'l', lvl: 8 });
  } else {
    L.push({ t: 'g', g, tier: 3 });
    L.push(F.ter ? { t: 'c', ter: terOf(), lvl: 15 } : { t: 'l', lvl: 15 });
    L.push({ t: 'm', m: fam === 'eau' ? (r() < .5 ? 'été' : 'nuit') : fam === 'hauteur' ? (r() < .5 ? 'hiver' : 'nuit') : 'nuit' });
    L.push({ t: 'i', fam: otherFam(), tier: 1, n: 3 });
    L.push({ t: 'i', fam, tier: 0, n: 5 });
  }
  const tr = `${F.tr} de ${p.name}`;
  return (LD_CACHE[id] = { id, fam, s, locks: L, tr, p: { cat: p.cat, name: p.name, lon: +p.lon, lat: +p.lat, city: p.city, osm: p.osm } });
}

// ---------- les cadenas ----------
const ldLvl = k => ld$(() => (S.prog[k] || {}).lvl || 1, 1);
const ldMatN = nm => S.inv.filter(it => it && it.name === nm).length;
function ldOpen(L, k) {
  switch (L.t) {
    case 'g': return !!ld$(() => ppOwned(k, L.g, L.tier), null);
    case 'c': return !!k && ld$(() => faCompTer(k).ter.includes(L.ter), false) && ldLvl(k) >= L.lvl;
    case 'l': return !!k && ldLvl(k) >= L.lvl;
    case 'm': return L.m === 'nuit' ? isNight() : season() === L.m;
    case 'i': return ldMatN(LD_FAM[L.fam].mats[L.tier]) >= L.n;
  }
  return false;
}
const LD_MNM = { nuit: 'De nuit', hiver: 'En hiver', 'été': 'En été', automne: 'En automne', printemps: 'Au printemps' };
function ldLabel(L) {
  switch (L.t) {
    case 'g': return ld$(() => xpGearDef(L.g, L.tier)[0], L.g);
    case 'c': return `Familier ${ld$(() => FA_TER[L.ter][1].toLowerCase(), L.ter)} niveau ${L.lvl}`;
    case 'l': return `Un familier niveau ${L.lvl}`;
    case 'm': return LD_MNM[L.m] || L.m;
    case 'i': return `${L.n} × ${LD_FAM[L.fam].mats[L.tier]}`;
  }
  return '';
}
function ldHint(L, k) {
  switch (L.t) {
    case 'g': return L.tier >= 3 ? 'À fabriquer à l’atelier : il faut la version pro, plus une gemme' : L.tier === 2 ? 'Version pro à fabriquer à l’atelier' : 'À fabriquer à l’atelier du Foyer';
    case 'c': return ld$(() => faCompTer(k).ter.includes(L.ter), false) ? `${faNm(k)} doit encore monter : niveau ${ldLvl(k)} sur ${L.lvl}` : `Il faut envoyer un familier qui vit ${ld$(() => FA_TER[L.ter][2], '')}, assez fort`;
    case 'l': return `${faNm(k)} est niveau ${ldLvl(k)} : voyages et repas le font monter`;
    case 'm': return L.m === 'nuit' ? 'Revenez partir entre 21 h et 6 h' : `Ce lieu ne s’ouvre qu’${(LD_MNM[L.m] || '').toLowerCase().replace(/^en /, 'en ').replace(/^au /, 'au ')}`;
    case 'i': return `Vous en avez ${ldMatN(LD_FAM[L.fam].mats[L.tier])}. Se trouve dans les lieux à défi ${'★'.repeat(L.tier + 1)} « ${LD_FAM[L.fam].nm.toLowerCase()} »`;
  }
  return '';
}
const ldState = (D, k) => { const o = D.locks.map(L => ldOpen(L, k)); return { o, n: o.filter(Boolean).length, all: o.every(Boolean) }; };

// ---------- dessins ----------
const LD_LOCK = (open, col) => `<svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true">${open ? `<path d="M4.5 8V5.5a3.5 3.5 0 0 1 6.8-1.2" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/>` : `<path d="M4.5 8V5.5a3.5 3.5 0 0 1 7 0V8" fill="none" stroke="${col}" stroke-width="2"/>`}<rect x="2" y="8" width="12" height="9" rx="2" fill="${open ? 'none' : col}" stroke="${col}" stroke-width="1.8"/></svg>`;
const LD_GLYPH = {
  ancien: '<path d="M4 20V10l8-6 8 6v10M9 20v-5h6v5M12 4V1M10.5 2.5h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  eau: '<path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  hauteur: '<path d="M2 20L9 7l4 6 3-4 6 11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  nature: '<path d="M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};
function ldMarkHTML(D, st) {
  const left = D.locks.length - st.n, ok = st.all;
  return `<span class="ld-s">${'<i></i>'.repeat(D.s)}</span><span class="ld-c" style="--c:${LD_FAM[D.fam].col}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">${LD_GLYPH[D.fam]}</svg></span><span class="ld-b${ok ? ' ok' : ''}">${LD_LOCK(ok, '#fff')}${ok ? '' : left}</span>`;
}

// ---------- sur la carte ----------
let ldMk = new Map(), ldList = [];
function ldCandidates() {
  if (!map || !mapReady) return [];
  if (mapMode === 'tiles') {
    let feats = []; try { feats = map.queryRenderedFeatures({ layers: ['poi-hit'] }); } catch (e) { feats = []; }
    const out = [];
    for (const f of feats) {
      const p = f.properties || {}, cat = OSM_CAT[p.subclass] || OSM_CAT[p.class], name = p['name:fr'] || p.name;
      if (!cat || !name || !LD_CAT[cat] || f.geometry.type !== 'Point') continue;
      const g = f.geometry.coordinates; out.push({ cat, name, lon: g[0], lat: g[1], osm: { class: p.class || '', subclass: p.subclass || '' } });
    }
    return out;
  }
  return ld$(() => fallbackPOIs(), []).filter(p => LD_CAT[p.cat]);
}
function ldShow(D, st) {
  const s = ldSt(); if (s.f === 'masque' || !s.stars.includes(D.s)) return false;
  if (s.f === 'ouverts') return st.all;
  if (s.f === 'presque') return !st.all && st.n === D.locks.length - 1;
  return true;
}
function ldRefresh() {
  if (!map || !mapReady) return;
  const z = map.getZoom(), seen = new Set(), c = map.getCenter();
  const all = z < 12 ? [] : ldCandidates().map(ldOf).filter(Boolean);
  const uniq = [...new Map(all.map(D => [D.id, D])).values()];
  ldList = uniq;
  const k = S.sel;
  const vis = uniq.map(D => ({ D, st: ldState(D, k) })).filter(o => ldShow(o.D, o.st))
    .sort((a, b) => kmExact({ lon: c.lng, lat: c.lat }, a.D.p) - kmExact({ lon: c.lng, lat: c.lat }, b.D.p)).slice(0, z < 14 ? 8 : 12);
  for (const { D, st } of vis) {
    seen.add(D.id);
    let m = ldMk.get(D.id);
    const html = ldMarkHTML(D, st);
    if (!m) {
      const el = document.createElement('button'); el.className = 'ld-mk'; el.dataset.ld = D.id; el.setAttribute('aria-label', `Lieu à défi ${D.s} étoile${D.s > 1 ? 's' : ''} : ${D.p.name}`);
      el.innerHTML = html; el._h = html;
      el.addEventListener('click', ev => { ev.stopPropagation(); ldFiche(D.id); });
      m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([D.p.lon, D.p.lat]).addTo(map); ldMk.set(D.id, m);
    } else if (m.getElement()._h !== html) { m.getElement().innerHTML = html; m.getElement()._h = html; }
  }
  for (const [id, m] of ldMk) if (!seen.has(id)) { m.remove(); ldMk.delete(id); }
  ldFiltBtn();
}
refreshPOIs = (orig => function () { const r = orig.apply(this, arguments); ld$(() => { clearTimeout(ldRefresh._t); ldRefresh._t = setTimeout(ldRefresh, 120); }); return r; })(refreshPOIs);
renderAll = (orig => function () { const r = orig.apply(this, arguments); ld$(() => { clearTimeout(ldRefresh._u); ldRefresh._u = setTimeout(ldRefresh, 200); }); return r; })(renderAll);
// la carte écoute « moveend » avec l'ancienne fonction (branchée avant ce fichier) : on s'y abonne nous-mêmes
ld$(() => { if (map) { map.on('moveend', () => { clearTimeout(ldRefresh._m); ldRefresh._m = setTimeout(ldRefresh, 150); }); map.on('load', () => setTimeout(ldRefresh, 400)); } });
setInterval(() => ld$(() => { if (mapReady && !document.hidden && (!$('ldFilt') || !ldList.length)) ldRefresh(); }), 2500);

// ---------- le filtre ----------
const LD_F = [['tout', 'Tous les défis'], ['ouverts', 'Tous cadenas ouverts'], ['presque', 'Il manque un cadenas'], ['masque', 'Masquer les défis']];
function ldFiltBtn() {
  let b = $('ldFilt');
  if (!b) {
    const host = document.querySelector('.zoom') || ($('map') && $('map').parentElement); if (!host) return;
    b = document.createElement('div'); b.id = 'ldFilt'; host.appendChild(b);
    b.addEventListener('click', ev => {
      const t = ev.target.closest('button'); if (!t) return; ev.stopPropagation(); const s = ldSt();
      if (t.dataset.ldo) { b.classList.toggle('on'); return; }
      if (t.dataset.ldf) s.f = t.dataset.ldf;
      if (t.dataset.lds) { const n = +t.dataset.lds; s.stars = s.stars.includes(n) ? s.stars.filter(x => x !== n) : s.stars.concat(n).sort(); if (!s.stars.length) s.stars = [n]; }
      save(); ldRefresh(); b.classList.add('on');
    });
  }
  const s = ldSt(), n = ldList.length;
  const html = `<button class="ld-fb" data-ldo="1" aria-label="Filtrer les lieux à défi">${LD_LOCK(false, '#4a3528')}<b>Défis</b>${s.f !== 'tout' ? '<i></i>' : ''}</button>
  <div class="ld-fm"><span>${n} lieu${n > 1 ? 'x' : ''} à défi ici</span>${LD_F.map(([id, nm]) => `<button data-ldf="${id}" class="${s.f === id ? 'sel' : ''}">${nm}</button>`).join('')}<div class="ld-st">${[1, 2, 3].map(x => `<button data-lds="${x}" class="${s.stars.includes(x) ? 'sel' : ''}" aria-label="${x} étoile${x > 1 ? 's' : ''}">${'★'.repeat(x)}</button>`).join('')}</div></div>`;
  if (b._h !== html) { const on = b.classList.contains('on'); b.innerHTML = html; b._h = html; if (on) b.classList.add('on'); }
}
document.addEventListener('click', ev => { const b = $('ldFilt'); if (b && b.classList.contains('on') && !b.contains(ev.target)) b.classList.remove('on'); });

// ---------- la fiche ----------
function ldFiche(id) {
  const D = LD_CACHE[id]; if (!D) return;
  const k = S.sel, st = ldState(D, k), s = ldSt(), F = LD_FAM[D.fam], done = s.done[id] || 0;
  const locks = D.locks.map((L, i) => `<li class="${st.o[i] ? 'op' : ''}">${LD_LOCK(st.o[i], st.o[i] ? '#3f7f3a' : '#4a3528')}<span><b>${esc(ldLabel(L))}</b>${st.o[i] ? '' : `<small>${esc(ldHint(L, k))}</small>`}</span></li>`).join('');
  const mat = F.mats[D.s - 1];
  showModal(`<div class="ld-f">
    <div class="ld-fh" style="--c:${F.col}"><span class="ld-fi"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">${LD_GLYPH[D.fam]}</svg></span><div><small>${esc(F.nm)} · ${'★'.repeat(D.s)}${'☆'.repeat(3 - D.s)}</small><h3>${esc(D.p.name)}</h3></div></div>
    <p class="ld-k">Cadenas · ${st.n} ouvert${st.n > 1 ? 's' : ''} sur ${D.locks.length}${k ? ` pour ${esc(faNm(k))}` : ''}</p>
    <ul class="ld-l">${locks}</ul>
    <p class="ld-k">Ce qu’on y trouve</p>
    <div class="ld-r">${done ? '' : `<div><b>${esc(D.tr)}</b><small>trésor unique, la première fois</small></div>`}<div><b>${esc(mat)}</b><small>matériau ${'★'.repeat(D.s)}, à chaque réussite</small></div></div>
    <p class="ld-n">${st.all ? 'Tous les cadenas sont ouverts.' : 'Vous pouvez tenter sans tout ouvrir, mais on en revient rarement avec quelque chose.'}${done ? ` Déjà réussi ${done} fois.` : ''}</p>
    <div class="ld-b"><button class="btn" data-closemodal="1">Fermer</button><button class="btn ${st.all ? 'green' : 'gold'}" data-ldgo="${id}">${st.all ? 'Y aller' : 'Tenter quand même'}</button></div></div>`);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-ldgo]'); if (!b) return;
  const D = LD_CACHE[b.dataset.ldgo]; if (!D) return;
  ld$(() => { $('modal').hidden = true; });
  choosePOI({ ...D.p, ld: D.id });
});
poiDest = (orig => function (p) { const d = orig.apply(this, arguments); if (p && p.ld) d.ld = p.ld; return d; })(poiDest);

// ---------- départ, retour ----------
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k], d = plan.dest, D = d && d.ld ? LD_CACHE[d.ld] : null;
  const st = D ? ldState(D, k) : null;
  const r = orig.apply(this, arguments);
  ld$(() => {
    const t = S.trips[k]; if (!t || t === before || !D) return;
    if (st.all) for (const L of D.locks) if (L.t === 'i') { let n = L.n; const nm = LD_FAM[L.fam].mats[L.tier]; S.inv = S.inv.filter(it => !(n > 0 && it.name === nm && n--)); }
    t.ld = { id: D.id, ok: st.all };
    save();
  });
  return r;
})(startTrip);
GAME.on('trip:return', e => ld$(() => {
  const t = e && e.trip; if (!t || !t.ld) return;
  const D = LD_CACHE[t.ld.id] || null, s = ldSt(); if (!D) return;
  const F = LD_FAM[D.fam], got = [], k = e.who;
  const give = (nm, tier, n) => { for (let i = 0; i < n; i++) S.inv.push(makeItem([nm, 'm', 'defi', tier, null, F.col], 0, D.p.name, ['defi'], { fixed: tier })); got.push(`${n > 1 ? n + ' × ' : ''}${nm}`); };
  if (t.ld.ok) {
    give(F.mats[D.s - 1], D.s, D.s === 1 ? 1 + (Math.random() < .5 ? 1 : 0) : 1);
    if (D.s >= 2 && Math.random() < .5) give(F.mats[D.s - 2], D.s - 1, 1);
    if (!s.done[D.id]) { const it = makeItem([D.tr, 'd', 'tresor', D.s + 1, null, F.col], 0, D.p.name, ['defi', 'tresor'], { fixed: D.s + 1 }); it.special = true; S.inv.push(it); got.unshift(`le trésor « ${D.tr} »`); }
    s.done[D.id] = (s.done[D.id] || 0) + 1;
    ld$(() => addXP(k, 12 * D.s * D.s, 'défi'));
  } else if (Math.random() < .3) give(F.mats[Math.max(0, D.s - 2)], Math.max(1, D.s - 1), 1);
  save();
  const html = `<div class="nsfind ld-win"><span class="ld-wi">${LD_LOCK(t.ld.ok, t.ld.ok ? '#3f7f3a' : '#4a3528')}</span><div><span class="nsfk">${t.ld.ok ? 'Défi réussi' : 'Tentative'} · ${'★'.repeat(D.s)}</span><b>${esc(D.p.name)}</b><span>${got.length ? 'Rapporté : ' + esc(got.join(', ')) + '.' : 'Rien cette fois : il manquait des cadenas.'}</span></div></div>`;
  const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox');
  if (box && box.querySelector('.haul')) { const btn = box.querySelector('button[data-closemodal]'); if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
  else toast(t.ld.ok ? `Défi réussi : ${D.p.name} !` : `Tentative à ${D.p.name} : ${got.length ? got.join(', ') : 'rien cette fois'}`);
}));
// la fiche de départ rappelle les cadenas
trjDecorate = (orig => function (box) {
  const r = orig.apply(this, arguments);
  ld$(() => {
    if (!box) return; const old = box.querySelector('.ld-tip');
    const d = plan.dest, D = d && d.ld ? LD_CACHE[d.ld] : null;
    if (!D || S.trips[S.sel]) { if (old) old.remove(); return; }
    const st = ldState(D, S.sel), miss = D.locks.filter((L, i) => !st.o[i]).map(ldLabel);
    const h = `<div class="ld-tip">${D.locks.map((L, i) => LD_LOCK(st.o[i], st.o[i] ? '#3f7f3a' : '#4a3528')).join('')}<span><b>Défi ${'★'.repeat(D.s)}</b> · ${st.all ? 'tous les cadenas sont ouverts' : 'il manque : ' + esc(miss.join(', '))}</span></div>`;
    if (old) { if (old.outerHTML !== h) old.outerHTML = h; return; }
    const a = box.querySelector('.fa-tip') || box.querySelector('.sct-tip') || box.querySelector('.trjline'); if (a) a.insertAdjacentHTML('afterend', h);
  });
  return r;
})(trjDecorate);

(function ldStyle() {
  const st = document.createElement('style'); st.id = 'ldStyle';
  st.textContent = `.ld-mk{position:relative;width:30px;height:34px;padding:0;border:0;background:none;cursor:pointer;display:block}
.ld-c{position:absolute;left:1px;bottom:0;width:28px;height:28px;border-radius:50%;background:#fffaf0;border:2px solid var(--c);color:var(--c);display:grid;place-items:center;box-shadow:0 2px 5px rgba(74,53,40,.28)}
.ld-s{position:absolute;left:0;right:0;top:0;display:flex;justify-content:center;gap:2px;z-index:1}.ld-s i{width:5px;height:5px;border-radius:50%;background:#e8b13a;box-shadow:0 0 0 1.2px #fffaf0}
.ld-b{position:absolute;right:-7px;bottom:-3px;z-index:1;display:flex;align-items:center;gap:1px;height:15px;padding:0 4px 0 3px;border-radius:8px;background:#4a3528;color:#fff;font:800 9.5px/1 var(--body,system-ui);box-shadow:0 0 0 1.5px #fffaf0}
.ld-b svg{width:8px;height:9px}.ld-b.ok{background:#3f7f3a;padding:0 3px}
#ldFilt{position:relative;z-index:6;font-family:inherit}
.zoom #ldFilt{margin-top:6px}
.ld-fb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:46px;min-height:46px;padding:4px 2px;border-radius:14px;border:2px solid #4a3528;background:#fffaf0;font:800 10px var(--body,system-ui);color:#4a3528;position:relative}
.ld-fb svg{width:16px;height:18px}
.ld-fb i{position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#e5584f;border:2px solid #fffaf0}
.ld-fm{display:none;position:absolute;right:calc(100% + 8px);top:0;background:#fffaf0;border:2px solid #4a3528;border-radius:14px;padding:6px;width:200px;box-shadow:0 6px 16px rgba(74,53,40,.2)}
#ldFilt.on .ld-fm{display:flex;flex-direction:column;gap:3px}
.ld-fm>span{font-size:11.5px;color:#7a6250;padding:2px 6px 4px}
.ld-fm button{text-align:left;border:0;background:none;border-radius:9px;padding:8px 9px;min-height:38px;font:700 13px var(--body,system-ui);color:#4a3528}
.ld-fm button.sel{background:#f2e6cc}
.ld-st{display:flex;gap:4px;border-top:1px solid #eadcc4;padding-top:5px;margin-top:2px}.ld-st button{flex:1;text-align:center;color:#c8902a;opacity:.45}.ld-st button.sel{opacity:1;background:#fff3c4}
.ld-f h3{margin:0;font:800 22px/1.1 var(--display,inherit)}
.ld-fh{display:flex;align-items:center;gap:10px;margin-bottom:6px}.ld-fh small{font-size:12px;font-weight:700;color:var(--c)}
.ld-fi{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#fffaf0;border:2px solid var(--c);color:var(--c);flex:none}
.ld-k{margin:12px 0 6px;font-size:12px;font-weight:800;color:#8a6a50}
.ld-l{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.ld-l li{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:#fbf3e4;border:1.5px solid #eadcc4}
.ld-l li.op{background:#eef7e8;border-color:#cfe6c2}.ld-l li svg{flex:none;margin-top:2px;width:16px;height:18px}
.ld-l span{display:flex;flex-direction:column}.ld-l b{font-size:14px}.ld-l small{font-size:12px;color:#7a6250}
.ld-r{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px}.ld-r div{padding:8px 10px;border-radius:12px;background:#fff3c4;display:flex;flex-direction:column}.ld-r b{font-size:13.5px}.ld-r small{font-size:11.5px;color:#7a6250}
.ld-n{font-size:12.5px;color:#7a6250;margin:10px 0 0}
.ld-b{display:flex;gap:8px;margin-top:12px}.ld-b .btn{flex:1}
.ld-tip{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:6px 0;padding:7px 10px;border-radius:12px;background:#fbf3e4;border:1.5px solid #eadcc4;font-size:12.5px;line-height:1.35}
.ld-tip span{flex:1;min-width:170px}
.ld-win .ld-wi{flex:none;width:46px;display:grid;place-items:center}.ld-win .ld-wi svg{width:28px;height:32px}`;
  document.head.appendChild(st);
})();
window.__ld = { of: p => ldOf(p), st: (id, k) => ldState(LD_CACHE[id], k || S.sel), list: () => ldList, fiche: id => ldFiche(id), refresh: () => ldRefresh(), cache: LD_CACHE };

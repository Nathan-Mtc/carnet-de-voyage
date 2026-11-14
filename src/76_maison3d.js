// ================= 76 · LA MAISON EN VRAIE 3D (v54) =================
// Le joueur : « je veux le même visuel qu'Animal Crossing, avec nos vrais objets à nous (ceux qu'on rapporte) ».
// Les pièces de 74 sont refaites en 3D (three.js r128, chargé à la demande depuis cdnjs) : meubles arrondis (boîtes
// à bords biseautés), lumière douce, vraies ombres, lampes et cheminée qui éclairent, paysage derrière les fenêtres.
// Les objets posés (75) deviennent de petits modèles 3D selon leur genre (plante, lampe, lanterne, bocal, statue,
// mappemonde, tapis, coussin, tableaux au mur…) à leur couleur. Les familiers sont des personnages « papier » qui font
// leur geste (arroser, touiller, dormir…). Mode Aménager : on touche directement le sol ou un mur de la scène 3D.
// Repli : tant que la 3D n'est pas chargée (ou si l'appareil ne sait pas faire de 3D), la vue dessinée de 74 reste.
// Repère : mêmes coordonnées que 74 (x, y au sol de 0 à 9, z en hauteur) → three (x, z, y).
let h3Load = 0; // 0 rien, 1 en cours, 2 prêt, -1 échec
const H3 = { r: null, cv: null, scene: null, cam: null, raf: 0, t0: 0, anim: [], room: '', ro: null, hit: [], down: null };
function h3Ready() {
  if (window.THREE) return true;
  if (h3Load === 0) {
    h3Load = 1;
    const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; sc.async = true;
    sc.onload = () => { h3Load = 2; try { if (typeof tab !== 'undefined' && tab === 'village' && villView === 'foyer' && document.querySelector('#panelBody .hm-stage')) renderPanel(); } catch (e) {} };
    sc.onerror = () => { h3Load = -1; };
    document.head.appendChild(sc);
  }
  return false;
}
// ---------------- matériaux et formes ----------------
const h3M = {}, h3G = {};
function h3Mat(c, o = {}) {
  const k = c + JSON.stringify(Object.assign({}, o, { map: o.map ? o.map.uuid : 0 })); if (h3M[k]) return h3M[k];
  const T = THREE, p = { color: new T.Color(c).convertSRGBToLinear(), roughness: o.rough != null ? o.rough : .78, metalness: o.metal || 0 };
  if (o.e) { p.emissive = new T.Color(o.e).convertSRGBToLinear(); p.emissiveIntensity = o.ei || 1; }
  if (o.op != null) { p.transparent = true; p.opacity = o.op; p.depthWrite = o.op > .6; }
  if (o.map) p.map = o.map;
  return (h3M[k] = o.basic ? new T.MeshBasicMaterial({ color: p.color, map: o.map || null, transparent: o.op != null, depthWrite: o.op == null || o.op > .6, opacity: o.op != null ? o.op : 1 }) : new T.MeshStandardMaterial(p));
}
function h3RGeo(w, h, d, r) {
  const k = [w, h, d, r].map(v => v.toFixed(3)).join(','); if (h3G[k]) return h3G[k];
  const T = THREE; r = Math.min(r, w / 2 - .002, h / 2 - .002, d / 2 - .002);
  if (r <= .004) return (h3G[k] = new T.BoxGeometry(w, h, d));
  const iw = w - 2 * r, id = d - 2 * r, cr = Math.min(r * .8, iw / 2 - .001, id / 2 - .001), sh = new T.Shape();
  if (cr > .002) { sh.moveTo(-iw / 2 + cr, -id / 2); sh.lineTo(iw / 2 - cr, -id / 2); sh.quadraticCurveTo(iw / 2, -id / 2, iw / 2, -id / 2 + cr); sh.lineTo(iw / 2, id / 2 - cr); sh.quadraticCurveTo(iw / 2, id / 2, iw / 2 - cr, id / 2); sh.lineTo(-iw / 2 + cr, id / 2); sh.quadraticCurveTo(-iw / 2, id / 2, -iw / 2, id / 2 - cr); sh.lineTo(-iw / 2, -id / 2 + cr); sh.quadraticCurveTo(-iw / 2, -id / 2, -iw / 2 + cr, -id / 2); }
  else { sh.moveTo(-iw / 2, -id / 2); sh.lineTo(iw / 2, -id / 2); sh.lineTo(iw / 2, id / 2); sh.lineTo(-iw / 2, id / 2); }
  const g = new T.ExtrudeGeometry(sh, { depth: Math.max(.001, h - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); g.center(); g.computeVertexNormals();
  return (h3G[k] = g);
}
let H3P = null; // groupe en cours de construction
function h3Add(m, sh = true) { m.castShadow = sh; m.receiveShadow = true; H3P.add(m); return m; }
// hB(x, y, z, l, p, h) : comme hIBox de 74 (coin bas, x/y au sol, z en hauteur), mais arrondi
function hB(x, y, z, w, d, h, c, r = .08, o) { const m = new THREE.Mesh(h3RGeo(w, h, d, r), h3Mat(c, o)); m.position.set(x + w / 2, z + h / 2, y + d / 2); return h3Add(m, !(o && o.ns)); }
function hCy(x, y, z, r, h, c, o = {}) { const k = 'c' + [r, h, o.rt, o.seg].join(','), g = h3G[k] || (h3G[k] = new THREE.CylinderGeometry(o.rt != null ? o.rt : r, r, h, o.seg || 22)); const m = new THREE.Mesh(g, h3Mat(c, o)); m.position.set(x, z + h / 2, y); return h3Add(m, !o.ns); }
function hSp(x, y, z, r, c, sx = 1, sy = 1, sz = 1, o = {}) { const k = 's' + r, g = h3G[k] || (h3G[k] = new THREE.SphereGeometry(r, 18, 14)); const m = new THREE.Mesh(g, h3Mat(c, o)); m.position.set(x, z, y); m.scale.set(sx, sy, sz); return h3Add(m, !o.ns); }
function hCo(x, y, z, r, h, c, o = {}) { const k = 'k' + [r, h, o.seg].join(','), g = h3G[k] || (h3G[k] = new THREE.ConeGeometry(r, h, o.seg || 18)); const m = new THREE.Mesh(g, h3Mat(c, o)); m.position.set(x, z + h / 2, y); return h3Add(m, !o.ns); }
function hTo(x, y, z, R, t, c, o = {}) { const k = 't' + R + ',' + t, g = h3G[k] || (h3G[k] = new THREE.TorusGeometry(R, t, 12, 28)); const m = new THREE.Mesh(g, h3Mat(c, o)); m.position.set(x, z, y); m.rotation.x = Math.PI / 2; return h3Add(m, !o.ns); }
function hLt(x, y, z, c = '#ffcf80', i = .8, d = 7) { const L = new THREE.PointLight(new THREE.Color(c), i * (hmNight() ? 1.7 : 1), d, 2); L.position.set(x, z, y); H3P.add(L); return L; }
const h3Anim = f => H3.anim.push(f);
// ---------------- textures dessinées ----------------
const h3Tx = {};
function h3Canvas(k, w, h, draw, rep) {
  if (h3Tx[k]) return h3Tx[k];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return (h3Tx[k] = t);
}
const h3Shade = (h, k) => hIMix(h, k);
function h3Wall(c, pat) {
  return h3Canvas('w' + c + pat, 256, 256, (g, w, h) => {
    g.fillStyle = c; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.28)';
    if (pat === 'stripe') for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 26, h);
    if (pat === 'dots' || pat === 'stars') for (let y = 16; y < h; y += 42) for (let x = (y / 42 % 2) * 21 + 10; x < w; x += 42) { g.beginPath(); g.arc(x, y, pat === 'stars' ? 2.4 : 5, 0, 7); g.fillStyle = pat === 'stars' ? '#ffe9a8' : 'rgba(255,255,255,.55)'; g.fill(); }
    if (pat === 'wood') { g.fillStyle = 'rgba(74,48,38,.16)'; for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 3); }
    if (pat === 'flowers') for (let y = 24; y < h; y += 64) for (let x = (y / 64 % 2) * 32 + 20; x < w; x += 64) { g.fillStyle = 'rgba(255,255,255,.8)'; [[-7, 0], [7, 0], [0, -7], [0, 7]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, 5.5, 0, 7); g.fill(); }); g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
  }, [3, 2]);
}
function h3Floor(c, kind) {
  return h3Canvas('f' + c + kind, 512, 512, (g, w, h) => {
    g.fillStyle = c; g.fillRect(0, 0, w, h);
    if (kind === 'tiles' || kind === 'check') { const n = 4, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (kind === 'check' && (i + j) % 2) { g.fillStyle = h3Shade(c, -.12); g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4; g.strokeRect(i * s, j * s, s, s); } return; }
    if (kind === 'carpet' || kind === 'grass') { for (let i = 0; i < 2600; i++) { g.fillStyle = kind === 'grass' ? (i % 2 ? 'rgba(60,140,60,.25)' : 'rgba(255,255,255,.18)') : 'rgba(255,255,255,.14)'; g.fillRect(Math.random() * w, Math.random() * h, 2, kind === 'grass' ? 5 : 2); } return; }
    let r = 3; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280, ph = h / 8;
    for (let i = 0; i < 8; i++) { let x = -rnd() * 200; while (x < w) { const L = 140 + rnd() * 200; g.fillStyle = h3Shade(c, (rnd() - .5) * .16); g.fillRect(x, i * ph, L, ph); g.strokeStyle = 'rgba(70,40,20,.28)'; g.lineWidth = 2; g.strokeRect(x, i * ph, L, ph); g.strokeStyle = 'rgba(70,40,20,.1)'; g.beginPath(); g.moveTo(x + 20, i * ph + ph * .4); g.bezierCurveTo(x + L * .4, i * ph + ph * .3, x + L * .6, i * ph + ph * .6, x + L - 20, i * ph + ph * .5); g.stroke(); x += L; } }
  }, [2.2, 2.2]);
}
function h3Sky() {
  const n = hmNight();
  return h3Canvas('sky' + n, 256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, n ? '#1f2a5a' : '#6ec3ef'); gr.addColorStop(1, n ? '#3d4a86' : '#d6f0fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = n ? '#fff3c4' : '#ffe27a'; g.beginPath(); g.arc(w * .74, h * .26, 22, 0, 7); g.fill();
    if (!n) { g.fillStyle = '#fff'; [[.3, .25, 40], [.55, .4, 26]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(w * x, h * y, r, r * .4, 0, 0, 7); g.fill(); }); }
    g.fillStyle = n ? '#355a4c' : '#79c96a'; g.beginPath(); g.ellipse(w * .2, h * 1.05, w * .7, h * .38, 0, 0, 7); g.fill();
    g.fillStyle = n ? '#2d4c40' : '#5bb35b'; g.beginPath(); g.ellipse(w * .9, h * 1.1, w * .6, h * .42, 0, 0, 7); g.fill();
    g.fillStyle = n ? '#2d4c40' : '#3f8f55'; g.beginPath(); g.arc(w * .6, h * .7, 18, 0, 7); g.fill();
  });
}
function h3Icon(k, draw) { return h3Canvas('i' + k, 128, 128, draw); }
const H3I = {
  heart: g => { g.fillStyle = '#f0648a'; g.strokeStyle = '#4a3528'; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 108); g.bezierCurveTo(10, 70, 18, 20, 64, 42); g.bezierCurveTo(110, 20, 118, 70, 64, 108); g.fill(); g.stroke(); },
  z: g => { g.font = '900 96px system-ui'; g.textAlign = 'center'; g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText('z', 64, 100); g.fillStyle = '#6f7fc0'; g.fillText('z', 64, 100); },
  note: g => { g.font = '900 96px system-ui'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#fff'; g.strokeText('♪', 64, 100); g.fillStyle = '#e0a01e'; g.fillText('♪', 64, 100); },
  spark: g => { g.fillStyle = '#ffd866'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 18 : 56; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill(); },
  bang: g => { g.font = '900 100px system-ui'; g.textAlign = 'center'; g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText('!', 64, 104); g.fillStyle = '#e0a01e'; g.fillText('!', 64, 104); },
  plus: g => { g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.strokeStyle = '#4a3528'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(36, 64); g.lineTo(92, 64); g.moveTo(64, 36); g.lineTo(64, 92); g.stroke(); },
};
function h3Sprite(k, x, y, z, s = .4) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: h3Icon(k, H3I[k]), transparent: true, depthWrite: false })); m.position.set(x, z, y); m.scale.set(s, s, s); H3P.add(m); return m; }
// portraits des familiers (SVG → canvas → texture), gardés en cache
const h3Por = {};
function h3Portrait(k, mood) {
  const key = k + mood; if (h3Por[key]) return h3Por[key];
  const c = document.createElement('canvas'); c.width = 320; c.height = 350;
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; h3Por[key] = t;
  const im = new Image(); im.onload = () => { c.getContext('2d').drawImage(im, 0, 0, 320, 350); t.needsUpdate = true; }; im.src = hm$(() => portraitURI(k, mood), '');
  return t;
}
// ---------------- éléments récurrents ----------------
function h3Plant(x, y, s = 1, pot = '#d98a5f', z = 0) {
  hCy(x, y, z, .3 * s, .55 * s, pot, { rt: .36 * s }); hCy(x, y, z + .55 * s, .33 * s, .05, '#7a5236', { ns: 1 });
  [[0, 0, .95, .34], [-.17, .1, .78, .26], [.18, -.06, .8, .27], [.05, .2, .72, .22], [-.08, -.18, .74, .24]].forEach(([dx, dy, dz, r], i) => { const m = hSp(x + dx * s, y + dy * s, z + dz * s, r * s, ['#5fb36b', '#6fbf73', '#4fa35f', '#7fcb7f', '#5aa860'][i]); h3Anim(t => { m.rotation.z = Math.sin(t * 1.3 + i) * .05; }); });
}
function h3Lamp(x, y, z = 0, hg = 3, c = '#ffd866') {
  hCy(x, y, z, .32, .08, '#8a6a50'); hCy(x, y, z, .05, hg, '#8a6a50'); hCy(x, y, z + hg - .1, .42, .55, c, { rt: .22, e: c, ei: .35 }); hLt(x, y, z + hg - .1, '#ffcf80', .55, 6);
}
function h3Win(sd, a, z, w, h) {
  const L = sd === 'L', bx = (aa, zz, ww, hh, c, th = .12, off = 0, r = .03, o) => L ? hB(off, aa, zz, th, ww, hh, c, r, o) : hB(aa, off, zz, ww, th, hh, c, r, o);
  bx(a - .18, z - .18, w + .36, h + .36, '#fffaf0', .1, 0);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), h3Mat('#ffffff', { basic: 1, map: h3Sky() })); gl.position.set(L ? .11 : a + w / 2, z + h / 2, L ? a + w / 2 : .11); if (L) gl.rotation.y = Math.PI / 2; H3P.add(gl);
  bx(a + w / 2 - .04, z, .08, h, '#fffaf0', .14, .06, .02); bx(a, z + h / 2 - .04, w, .08, '#fffaf0', .14, .06, .02);
  bx(a - .35, z - .36, w + .7, .14, '#fffaf0', .45, 0, .04);
  bx(a - .85, z - .55, .62, h + .9, '#fbd3c0', .22, .1, .1); bx(a + w + .23, z - .55, .62, h + .9, '#fbd3c0', .22, .1, .1);
  bx(a - 1, z + h + .42, w + 2, .07, '#a87b52', .07, .22, .03);
  // le soleil qui entre
  if (!hmNight()) { const sp = new THREE.SpotLight(0xfff0c8, .45, 14, .55, .6, 1.2); sp.position.set(L ? -2 : a + w / 2, z + h, L ? a + w / 2 : -2); sp.target.position.set(L ? 3.2 : a + w / 2 + 1, 0, L ? a + w / 2 + 1 : 3.2); sp.castShadow = false; H3P.add(sp); H3P.add(sp.target); }
}
function h3Frame(sd, a, z, w, h, inner) { if (sd === 'L') { hB(.02, a, z, .08, w, h, '#fffaf0', .03); hB(.07, a + .1, z + .1, .04, w - .2, h - .2, inner, .01); } else { hB(a, .02, z, w, .08, h, '#fffaf0', .03); hB(a + .1, .07, z + .1, w - .2, .04, h - .2, inner, .01); } }
function h3Books(x, y, z, n, lie) { const C = ['#e0685a', '#6fa8dc', '#f2c14e', '#7fc38a', '#c9a0dc', '#f2a58c']; for (let i = 0; i < n; i++) { if (lie) hB(x, y, z + i * .13, .7 - i * .06, .5, .12, C[(i * 3 + 1) % 6], .02); else hB(x + i * .17, y, z, .15, .5, .5 + (i * 7 % 3) * .08, C[(i * 3 + Math.round(x * 7)) % 6], .02); } }
// la coquille : sol, deux murs, plinthes, corniche
function h3Shell(wall, floor, o = {}) {
  const C = hm$(() => hmCustom(hmCur), {}); let pat = o.pat || 'plain', fk = o.tiles ? 'tiles' : 'planks';
  if (!o.open) { if (C.w) { wall = C.w[1]; pat = C.w[2]; } if (C.f) { floor = C.f[1]; fk = C.f[2]; } }
  if (o.grass) fk = 'grass';
  const fm = h3Mat('#ffffff', { map: h3Floor(floor, fk), rough: .85 }), fl = new THREE.Mesh(new THREE.BoxGeometry(9.4, .4, 9.4), [h3Mat(h3Shade(floor, -.3)), h3Mat(h3Shade(floor, -.3)), fm, h3Mat(h3Shade(floor, -.3)), h3Mat(h3Shade(floor, -.2)), h3Mat(h3Shade(floor, -.3))]);
  fl.position.set(4.3, -.2, 4.3); fl.receiveShadow = true; H3P.add(fl);
  if (o.open) return;
  const wm = h3Mat('#ffffff', { map: h3Wall(wall, pat), rough: .95 }), wc = h3Mat('#fffaf0'), wl = new THREE.Mesh(new THREE.BoxGeometry(.35, 6, 9.4), [wm, wc, wc, wc, wc, wc]);
  wl.position.set(-.175, 3, 4.3); wl.receiveShadow = true; H3P.add(wl);
  const wr = new THREE.Mesh(new THREE.BoxGeometry(9.75, 6, .35), [wc, wc, wc, wc, wm, wc]); wr.position.set(4.475, 3, -.175); wr.receiveShadow = true; H3P.add(wr);
  hB(0, 0, 0, .1, 9, .32, '#fffaf0', .02, { ns: 1 }); hB(0, 0, 0, 9, .1, .32, '#fffaf0', .02, { ns: 1 });
  hB(0, 0, 5.72, .14, 9, .28, '#fffaf0', .03, { ns: 1 }); hB(0, 0, 5.72, 9, .14, .28, '#fffaf0', .03, { ns: 1 });
}
// ---------------- les pièces en 3D ----------------
const H3R = {
  entree() {
    h3Shell('#b9dc9f', '#d99a5b', { pat: 'wood' });
    hB(3.15, 0, 0, 2.5, .1, 4.35, '#fffaf0', .04); const door = hB(3.4, .05, 0, 2, .12, 4, '#79aed0', .08);
    const dg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), h3Mat('#fff', { basic: 1, map: h3Sky() })); dg.position.set(4.4, 2.95, .19); H3P.add(dg);
    hSp(5.05, .25, 1.9, .1, '#f2c14e'); hCy(4.4, .35, 4.6, .3, .35, '#ffd866', { rt: .18, e: '#ffd866', ei: .4 }); hLt(4.4, .7, 4.5, '#ffd9a0', .5, 5);
    hB(3.5, .3, 0, 1.8, 1.1, .05, '#c9785c', .02, { ns: 1 }); hB(3.65, .45, .05, 1.5, .8, .01, '#e9a07a', 0, { ns: 1 });
    hB(.02, 3.1, 2.5, .07, 2.8, 1.8, '#fffaf0', .03); hB(.07, 3.25, 2.62, .04, 2.5, 1.55, '#f3e6cf', .01); [[3.6, 3], [4.9, 3.4], [5.5, 3.6]].forEach(([a, z], i) => hSp(.13, a, z, .07, ['#e0533d', '#f2c14e', '#5fb36b'][i]));
    hB(.15, 3, 0, 1.15, 2.9, .8, '#c99a6a', .1); hB(.12, 3, .8, .25, 2.9, 1.1, '#b98a5e', .1);
    const nb = Math.max(1, Math.min(3, hm$(() => teamIds().length, 3)));
    ['#e0685a', '#7fb3e0', '#9fd08a'].slice(0, nb).forEach((c, i) => { const y = 3.15 + i * .95; hB(.3, y, .8, .75, .78, .85, c, .25); hB(.28, y - .02, 1.35, .82, .82, .32, h3Shade(c, -.12), .14); hSp(.95, y + .39, 1.15, .07, '#f2c14e'); });
    hCy(.9, 1.2, 0, .4, .08, '#8a6a50'); hCy(.9, 1.2, 0, .07, 4.3, '#8a6a50'); hSp(.6, 1.1, 3.9, .28, '#f2c14e', 1.3, .6, 1.3); hB(1, 1.05, 3.3, .14, .5, 1, '#e0685a', .06);
    hCy(8.15, .95, 0, .36, 1.1, '#7fb3e0'); [0, 1].forEach(i => { const u = hCy(8.05 + i * .2, .9, .6, .04, 1.9, i ? '#e0685a' : '#f2c14e'); u.rotation.z = (i ? -.18 : .12); });
    h3Plant(8.2, 3, 1.15);
  },
  salon(l) {
    h3Shell('#ffbf8f', '#d99a5b', { pat: 'stripe' }); h3Win('L', 2.2, 2.3, 2.6, 2.4); h3Frame('R', 1.2, 3, 2, 1.5, '#a9d8b5');
    if (l >= 1) {
      hB(4.6, 0, 0, 2.6, .9, 2.8, '#c9785c', .06); hB(4.4, 0, 2.8, 3, 1.15, .28, '#9a6a4a', .06); hB(5.15, .82, .05, 1.5, .1, 1.6, '#3b2a22', .04, { ns: 1 });
      const f1 = hCo(5.75, .6, .05, .28, .9, '#f28f3b', { e: '#f28f3b', ei: 1.4, ns: 1 }), f2 = hCo(6.05, .55, .05, .2, .65, '#ffe27a', { e: '#ffd866', ei: 1.6, ns: 1 }), fl = hLt(5.9, 1.4, .8, '#ff9a40', 1.2, 7);
      h3Anim(t => { f1.scale.y = 1 + Math.sin(t * 9) * .12; f2.scale.y = 1 + Math.sin(t * 11 + 1) * .15; fl.intensity = (hmNight() ? 2 : 1.2) * (1 + Math.sin(t * 13) * .08); });
      if (l >= 2) { hCy(4.9, .45, 3.08, .16, .55, '#7fb3e0', { rt: .1 }); hCy(6.9, .45, 3.08, .25, .1, '#fffdf7'); }
      if (l >= 3) { hB(6.3, 3.3, 0, 1.7, 1.7, .8, '#e0a07a', .2); hB(7.6, 3.3, .8, .4, 1.7, 1.1, '#d8936d', .18); hB(6.3, 3.3, .8, 1.3, .35, .55, '#d8936d', .15); hB(6.3, 4.65, .8, 1.3, .35, .55, '#d8936d', .15); }
    } else { hB(5, .1, 0, 2.4, .8, 1.1, '#c99a6a', .08); h3Plant(6.2, .5, .7, '#7fb3e0', 1.1); }
    hCy(4.4, 5, 0, 2.3, .04, '#f2a58c', { ns: 1, seg: 40 }); hTo(4.4, 5, .05, 1.6, .04, '#fff7ee', { ns: 1 });
    hB(.25, 3, 0, 1.75, 3.6, .85, '#79aed0', .22); hB(.12, 3, .7, .6, 3.6, 1.25, '#6fa3c6', .25); hB(.25, 2.6, 0, 1.75, .45, 1.3, '#86bad9', .22); hB(.25, 6.55, 0, 1.75, .45, 1.3, '#86bad9', .22);
    hB(.75, 3.15, .85, 1.1, 1.65, .3, '#8cc2e0', .14); hB(.75, 4.85, .85, 1.1, 1.65, .3, '#8cc2e0', .14);
    hB(.65, 3.4, 1.1, .45, 1, .75, '#ffd866', .2); hB(.65, 5.3, 1.1, .45, 1, .75, '#f6a3b7', .2); hB(.3, 6.2, .9, 1.6, .55, .6, '#f2c14e', .18);
    hCy(4.35, 5.35, .45, .85, .1, '#c99a6a'); hCy(4.35, 5.35, 0, .14, .45, '#a87b52'); hCy(4.35, 5.35, 0, .45, .05, '#a87b52'); h3Books(3.9, 5, .55, 3, 1); hCy(4.8, 5.8, .55, .1, .2, '#f6a3b7');
    hB(6.4, 0, 4.1, 2.2, .55, .12, '#b98a5e', .03); h3Books(6.55, .05, 4.22, 5); h3Plant(8.2, .3, .45, '#d98a5f', 4.22);
    h3Frame('L', .55, 3.6, .9, 1.1, '#f6c7a0'); h3Frame('L', 5.6, 3.3, 1, .8, '#cfe3f5');
    h3Lamp(.8, 1.2); h3Plant(8.2, 1.1, 1.25);
  },
  chambres(l) {
    h3Shell('#f7aecb', '#e0a46a', { pat: 'stripe' }); h3Win('R', 3.3, 2.4, 2.4, 2.4);
    const bed = (y, c) => { hB(.2, y, 0, 3.3, 2.2, .6, '#c99a6a', .1); hB(.05, y, 0, .35, 2.2, 1.75, '#b98a5e', .14); hB(3.3, y, 0, .25, 2.2, .95, '#b98a5e', .1); hB(.45, y + .08, .6, 2.9, 2.04, .38, '#fffaf2', .18); hB(1.5, y + .02, .66, 1.95, 2.16, .38, c, .2); hB(.6, y + .35, .95, .8, 1.5, .3, '#ffffff', .15); };
    bed(.9, '#f29cb0');
    hB(.2, 3.4, 0, 1, 1, 1, '#c99a6a', .08); h3Lamp(.7, 3.9, 1, 1.1); h3Books(.35, 3.55, 1, 2, 1);
    if (l >= 1) bed(4.7, '#8fc3e8'); else { h3Plant(.8, 5.5, 1); hB(.2, 6.5, 0, 1.2, 1.4, .9, '#e2b97c', .06); }
    if (l >= 2) { hB(6.4, .05, 0, 2.2, .7, 3.3, '#c99a6a', .05); h3Books(6.6, .3, 2.2, 5); h3Books(6.6, .3, .9, 5); }
    if (l >= 3) for (let i = 0; i < 8; i++) { const s = hSp(.6 + i * 1.05, .2, 5.2 - Math.sin(i / 7 * Math.PI) * .6, .09, ['#ffd866', '#f6a3b7', '#a9d8f0'][i % 3], 1, 1, 1, { e: ['#ffd866', '#f6a3b7', '#a9d8f0'][i % 3], ei: .8, ns: 1 }); h3Anim(t => { s.material.emissiveIntensity = .5 + Math.abs(Math.sin(t * 2 + i)) * .8; }); }
    h3Frame('L', 1.1, 3.4, 1, .9, '#f6c7a0'); h3Frame('L', 2.4, 3.6, .7, .7, '#a9d8b5');
    hSp(2.6, 1.9, 1.25, .2, '#d9a87a'); hSp(2.6, 1.9, 1.55, .16, '#d9a87a'); hSp(2.5, 1.85, 1.68, .06, '#d9a87a'); hSp(2.7, 1.95, 1.68, .06, '#d9a87a');
    hCy(5.2, 5.4, 0, 2, .04, '#f7b9cc', { ns: 1, seg: 40 }); hB(4.2, 3.6, 0, .35, .22, .12, '#f29cb0', .06); hB(4.7, 3.7, 0, .35, .22, .12, '#f29cb0', .06);
    hB(7.3, 2.6, 0, 1, 1, .7, '#e2c49a', .12); h3Plant(8.3, 1, 1.05);
  },
  cuisine(l) {
    h3Shell('#9fdbbd', '#fbeedb', { pat: 'dots', tiles: 1 }); h3Win('L', 2.6, 2.4, 2.4, 2.2);
    hB(.2, 0, 0, 3.4, 1.15, 1.3, '#fffaf0', .05); hB(.15, 0, 1.3, 3.5, 1.25, .12, '#c99a6a', .03); [.5, 1.9].forEach(x => hB(x, 1.12, .2, 1.2, .06, .95, '#f5ead2', .03));
    hB(3.6, 0, 0, 1.6, 1.15, 1.4, '#e7ecee', .05); hB(3.8, 1.12, .25, 1.2, .06, .75, '#3b2a22', .03); hB(3.9, 1.15, .35, 1, .04, .35, '#ffb347', .02, { e: '#ff9a40', ei: .9 });
    hB(5.2, 0, 0, 1.6, 1.15, 1.3, '#fffaf0', .05); hB(5.15, 0, 1.3, 1.7, 1.25, .12, '#c99a6a', .03);
    hCy(4.4, .6, 1.4, .42, .55, '#e0685a'); hCy(4.4, .6, 1.95, .44, .06, '#c95a4c'); hSp(4.4, .6, 2.05, .07, '#4a3528');
    for (let i = 0; i < 3; i++) { const p = hSp(4.3 + i * .1, .6, 2.2, .14 + i * .03, '#ffffff', 1, 1, 1, { op: .7, ns: 1 }); h3Anim(t => { const u = (t * .45 + i / 3) % 1; p.position.y = 2.15 + u * 1.2; p.material.opacity = .7 * (1 - u); p.scale.setScalar(1 + u); }); }
    hB(.6, 0, 3.4, 3.2, .55, .12, '#b98a5e', .03); ['#f08a6a', '#f2c14e', '#9fd08a', '#c9a0dc'].forEach((c, i) => hCy(1 + i * .7, .3, 3.52, .2, .55 + (i % 2) * .2, c));
    hCy(.9, .55, 1.42, .4, .12, '#fffaf0', { rt: .5 }); [['#e0533d', -.1, 0], ['#f2c14e', .12, .08], ['#7fc38a', .05, -.12]].forEach(([c, dx, dy]) => hSp(.9 + dx, .55 + dy, 1.62, .12, c));
    hB(2.2, .25, 1.42, 1, .7, .06, '#d9a86a', .02);
    for (let i = 0; i < 4; i++) { hB(1 + i * .6, .06, 2.1, .06, .06, .55, '#8a8f95', .01); hSp(1.03 + i * .6, .1, 2.05, .1, '#8a8f95', 1, .7, 1); }
    h3Plant(.35, 3.2, .45, '#d98a5f', 2.05); h3Plant(.35, 4, .4, '#e0a07a', 2.05);
    if (l >= 1) { hCy(5.2, 5.2, 1, .8, .1, '#c99a6a'); hCy(5.2, 5.2, 0, .12, 1, '#a87b52'); hCy(5.2, 5.2, 0, .45, .05, '#a87b52'); hCy(3.4, 5.3, 0, .32, .65, '#e0685a', { rt: .36 }); hCy(7, 5, 0, .32, .65, '#e0685a', { rt: .36 }); hCy(5.2, 5.2, 1.1, .32, .14, '#fffdf7', { rt: .4 }); if (l >= 3) { hCy(5.6, 4.8, 1.1, .3, .3, '#f6c7a0'); hCy(5.6, 4.8, 1.4, .3, .08, '#f7a8bd'); hSp(5.6, 4.8, 1.52, .07, '#e0533d'); } }
    else h3Plant(6, 5, 1.2);
    hLt(4.4, 1.6, 3, '#ffd9a0', .4, 6);
  },
  nurserie() {
    h3Shell('#ffd97a', '#e3a86a', { pat: 'dots' }); h3Win('R', 4.2, 2.6, 2.2, 2.2);
    hCy(4.6, 4.6, 0, 2.8, .03, '#fff3dc', { ns: 1, seg: 48 }); hTo(4.6, 4.6, .04, 2, .04, '#f6c7a0', { ns: 1 });
    hTo(4.6, 4.6, .28, 1, .3, '#e2b96a'); hCy(4.6, 4.6, 0, 1.05, .25, '#c99a4e');
    const eggs = (S.eggs || []).filter(Boolean), now = Date.now();
    eggs.slice(0, 3).forEach((e, i) => { const m = hSp(4.6 + [-.3, .3, .05][i], 4.6 + [.15, -.25, .4][i], .58, .26, ['#fff4dc', '#e4f3ff', '#ffe6ee'][i], 1, 1.3, 1); if (e.ready <= now) h3Anim(t => { m.rotation.z = Math.sin(t * 9 + i) * .25; }); });
    hB(.2, 1, 0, 2, 2.6, .5, '#f6dbe6', .08); hB(.25, 1.05, .5, 1.9, 2.5, .25, '#ffffff', .1); for (let i = 0; i < 7; i++) hCy(2.15, 1.15 + i * .38, .5, .04, 1.1, '#c99a6a'); hB(2.05, 1, 1.55, .2, 2.6, .1, '#c99a6a', .04);
    const mob = new THREE.Group(); mob.position.set(4.6, 5.2, 4.6); H3P.add(mob); { const P = H3P; H3P = mob; hCy(0, 0, -.6, .02, .7, '#4a3528'); hB(-1, -.03, -.65, 2, .06, .06, '#c99a6a', .02); hSp(-.9, 0, -1, .14, '#ffd866'); hSp(.9, 0, -1, .14, '#f7a8bd'); hSp(0, 0, -1.1, .12, '#a9c8ff'); H3P = P; } h3Anim(t => { mob.rotation.y = t * .5; });
    hB(1.2, 0, 3, 2.6, .55, .12, '#b98a5e', .03); hSp(1.9, .3, 3.32, .2, '#f6c7a0'); hB(2.8, .1, 3.12, .35, .3, .6, '#fff', .08);
    hB(7.2, .3, 0, 1.4, 1.4, .9, '#f7b9cc', .14); h3Plant(8.3, 2.4, .85, '#f7b9cc');
    hB(6.2, 6.6, 0, .5, .5, .5, '#7fb3e0', .08); hB(6.8, 6.9, 0, .5, .5, .5, '#f2c14e', .08); hB(6.5, 6.75, .5, .5, .5, .5, '#e0685a', .08);
    hLt(4.6, 4.6, 3.2, '#ffe0a0', .5, 7);
  },
  jardin(l) {
    h3Shell('#cfeaf5', '#8fd07a', { open: 1, grass: 1 });
    if (l >= 1) { const gm = h3Mat('#e8f8ff', { op: .28, rough: .1 }); const g1 = new THREE.Mesh(new THREE.BoxGeometry(.06, 5.5, 9), gm); g1.position.set(0, 2.75, 4.5); H3P.add(g1); const g2 = g1.clone(); g2.rotation.y = Math.PI / 2; g2.position.set(4.5, 2.75, 0); H3P.add(g2); for (let i = 0; i <= 9; i += 1.5) { hB(-.05, i - .05, 0, .1, .1, 5.5, '#fffaf0', .02); hB(i - .05, -.05, 0, .1, .1, 5.5, '#fffaf0', .02); } hB(-.05, 0, 5.4, .12, 9, .12, '#fffaf0', .02); hB(0, -.05, 5.4, 9, .12, .12, '#fffaf0', .02); }
    else { for (let i = 0; i <= 9; i += 1) { hB(i - .12, -.12, 0, .24, .24, 1.4, '#e2b97c', .06); hB(-.12, i - .12, 0, .24, .24, 1.4, '#e2b97c', .06); } hB(0, -.06, 1, 9, .1, .14, '#d9a86a', .03); hB(-.06, 0, 1, .1, 9, .14, '#d9a86a', .03); hB(0, -.06, .45, 9, .1, .14, '#d9a86a', .03); hB(-.06, 0, .45, .1, 9, .14, '#d9a86a', .03); }
    const bed = (x, y, w, d) => { hB(x, y, 0, w, d, .45, '#9a6a4a', .06); hB(x + .1, y + .1, .45, w - .2, d - .2, .03, '#6b4228', 0, { ns: 1 }); };
    bed(.7, .7, 5, 1.4); bed(.7, 2.9, 1.4, 4);
    [[1.3, 1.4, '#e0533d'], [2.3, 1.4, 0], [3.3, 1.4, '#f2c14e'], [4.3, 1.4, 0], [5.2, 1.4, '#e0533d'], [1.4, 3.6, 0], [1.4, 4.6, '#f08a3b'], [1.4, 5.6, 0], [1.4, 6.5, '#c9a0dc']].forEach(([x, y, c], i) => { const g = new THREE.Group(); g.position.set(x, .48, y); H3P.add(g); const P = H3P; H3P = g; hCy(0, 0, 0, .03, .35, '#5fa85a'); hSp(-.12, 0, .38, .14, '#6fbf73', 1.4, .6, 1); hSp(.12, 0, .4, .14, '#7fcb7f', 1.4, .6, 1); if (c) hSp(0, 0, .55, .12, c); H3P = P; h3Anim(t => { g.rotation.z = Math.sin(t * 1.6 + i) * .08; }); });
    const sf = new THREE.Group(); sf.position.set(7.6, 0, 1.6); H3P.add(sf); { const P = H3P; H3P = sf; hCy(0, 0, 0, .06, 3.2, '#5fa85a'); hSp(0, 0, 3.3, .3, '#8a5a3c', 1, 1, .5); hTo(0, 0, 3.3, .45, .16, '#f2c14e'); H3P = P; sf.children.slice(1).forEach(m => { m.rotation.x = 0; }); } h3Anim(t => { sf.rotation.z = Math.sin(t) * .04; });
    hB(4.6, 4.6, 0, .8, .6, .6, '#7fb3e0', .12); hCy(5.5, 4.9, .35, .05, .5, '#7fb3e0');
    if (l >= 3) [0, 1].forEach(i => { const b = new THREE.Group(); H3P.add(b); const P = H3P; H3P = b; const w1 = hB(-.2, -.02, 0, .2, .04, .25, i ? '#ffd866' : '#f7a8bd', .02, { ns: 1 }), w2 = hB(0, -.02, 0, .2, .04, .25, i ? '#ffd866' : '#f7a8bd', .02, { ns: 1 }); H3P = P; h3Anim(t => { b.position.set(3 + i * 3 + Math.sin(t * .7 + i) * 1.5, 2.2 + Math.sin(t * 1.3 + i) * .4, 3 + Math.cos(t * .5 + i) * 1.5); w1.rotation.y = Math.sin(t * 14) * .8; w2.rotation.y = -Math.sin(t * 14) * .8; }); });
  },
  atelier(l) {
    h3Shell('#93c8d8', '#c98f58', { pat: 'wood' }); h3Win('L', 3.2, 2.5, 2.2, 2.2);
    hB(.8, .02, 2.2, 3.8, .07, 2.2, '#f3e6cf', .03); hB(1.4, .1, 3.2, .1, .06, 1.1, '#b98a5e', .02); hB(1.2, .1, 4.1, .5, .1, .25, '#8a8f95', .03); hB(2.35, .1, 2.6, .1, .06, 1.4, '#8a8f95', .02); hB(2.3, .1, 2.6, .2, .08, .5, '#e0685a', .03); hTo(3.4, .12, 3.9, .22, .06, '#8a8f95');
    [[.6, .1], [4.4, .1], [.6, 1.2], [4.4, 1.2]].forEach(([x, y]) => hB(x, y, 0, .3, .3, 1.3, '#a87b52', .04)); hB(.6, .1, .4, 4.1, 1.4, .12, '#b98a5e', .03); hB(.5, 0, 1.3, 4.3, 1.6, .25, '#c99a6a', .06);
    hB(1, .4, 1.55, .9, .6, .45, '#6fa8dc', .08); hB(2.4, .5, 1.55, 1.2, .8, .06, '#f2d9a8', .02); hB(3.9, .4, 1.55, .4, .4, .4, '#f2c14e', .06);
    hB(7, .4, 0, 1.6, 1.4, 1.2, '#d9a86a', .05); hB(7.2, .6, 1.2, 1.2, 1, 1, '#e2b97c', .05); hB(7.4, 2.2, 0, 1.1, 1.1, .9, '#d9a86a', .05);
    hB(5.3, .1, 0, .2, .5, 3.2, '#e2b97c', .03); hB(5.6, .1, 0, .2, .5, 2.8, '#d9a86a', .03); hB(1.3, 2.6, 0, 1.1, .6, .5, '#e0685a', .08);
    if (l >= 1) { hB(3.6, 4.6, 0, .9, .9, .7, '#5f666d', .06); hB(3.3, 4.55, .7, 1.6, 1, .35, '#7d858c', .08); }
    if (l >= 2) { hB(0, 6, 3, .55, 2.6, .12, '#b98a5e', .03); [6.2, 6.9, 7.6].forEach((y, i) => hCy(.3, y + .2, 3.12, .18, .5 + (i % 2) * .2, ['#e0685a', '#9fd08a', '#7fb3e0'][i])); }
    if (l >= 3) hB(.03, 6, 1.3, .04, 2.4, 1.5, '#7fb3e0', .01);
    hCy(2.6, .9, 4.6, .45, .4, '#5b8f6a', { rt: .15 }); hCy(2.6, .9, 5, .02, 1, '#4a3528'); hLt(2.6, .9, 4.4, '#ffd9a0', .8, 6);
  },
  observ(l) {
    h3Shell('#2f3a78', '#5a4a8c', { pat: 'stars' });
    const ow = new THREE.Mesh(new THREE.CircleGeometry(1.4, 40), h3Mat('#ffffff', { basic: 1, map: (() => { const t = h3Canvas('obsky', 256, 256, g => { g.fillStyle = '#1f2a55'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) { g.fillStyle = '#fff'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(170, 90, 34, 0, 7); g.fill(); g.fillStyle = '#1f2a55'; g.beginPath(); g.arc(152, 80, 30, 0, 7); g.fill(); }); return t; })() }));
    ow.position.set(5, 3.6, .02); H3P.add(ow); const rg = hTo(5, .03, 3.6, 1.45, .12, '#fffaf0'); rg.rotation.x = 0;
    hCy(4.6, 4.6, 0, 2.2, .03, '#8a74ad', { ns: 1, seg: 40 });
    [[-.5, 0], [.4, .35], [.2, -.45]].forEach(([dx, dy]) => { const m = hCy(4.6 + dx * .5, 4.6 + dy * .5, 0, .04, 2.1, '#4a3528'); m.rotation.set(dy * .5, 0, -dx * .5); });
    const tb = new THREE.Group(); tb.position.set(4.6, 2.1, 4.6); H3P.add(tb); { const P = H3P; H3P = tb; const t1 = hCy(0, 0, -1, .22, 2, '#e7ecee', { rt: .16 }); t1.rotation.z = 0; hCy(0, 0, .95, .26, .25, '#c9a35a'); H3P = P; } tb.rotation.set(.2, .6, -.9);
    if (l >= 2) hB(.03, 1.5, 2.4, .04, 2.6, 1.9, '#f3e6cf', .01);
    if (l >= 3) { hB(7.2, 6.4, 0, .9, .9, 1, '#b98a5e', .06); hSp(7.65, 6.85, 1.45, .4, '#7fb3e0'); }
    h3Lamp(1, 7, 0, 2.4, '#c9a0dc');
  },
};
function h3Locked() {
  h3Shell('#d9cfc0', '#bfae94');
  hB(.6, .6, 0, 1.5, 1.5, 1.2, '#d9a86a', .05); hB(.8, .8, 1.2, 1.1, 1.1, .9, '#e2b97c', .05); hB(2.6, .5, 0, 1.2, 1.2, .9, '#d9a86a', .05);
  hSp(5.6, 2.6, .5, 1.2, '#f6f1e7', 1, .9, 1); hCy(4.8, 6, 0, .06, 1.6, '#8a6a50'); hB(4.2, 5.95, 1.5, 1.2, .1, .6, '#f2d9a8', .06);
}
// ---------------- les objets du joueur en 3D ----------------
function h3Item(o, sel) {
  const { it, p } = o, c = it.color || '#e9c46a', sub = it.sub || '', g = new THREE.Group(), P = H3P; H3P = g;
  if (o.w) {
    const L = p.y > 0 && p.x === 0, a = (L ? p.y : p.x) + .5;
    if (/horloge|pendule/i.test(it.name || '')) { const m = hCy(0, 0, 0, .45, .1, '#fffaf0'); m.rotation.x = Math.PI / 2; hB(-.03, -.12, .02, .06, .06, .35, '#4a3528', .01); }
    else { hB(-.7, -.05, -.55, 1.4, .1, 1.1, sub === 'herbier' ? '#c9a97a' : '#fffaf0', .04); hB(-.58, .02, -.43, 1.16, .06, .86, sub === 'cartemur' || /carte|planisph/i.test(it.name || '') ? '#cfe6f5' : c, .01); if (sub === 'herbier') hSp(0, .09, 0, .18, '#6fbf73', 1.4, .3, .6); if (/carte|planisph/.test((it.name || '') + sub)) { hSp(-.2, .09, .1, .15, '#7fc38a', 1.3, .3, .9); hSp(.25, .09, -.1, .12, '#7fc38a', 1.4, .3, .8); } }
    g.position.set(L ? .08 : a, 3.1, L ? a : .08); if (L) g.rotation.y = Math.PI / 2;
  } else {
    if (sub === 'tapis') { hCy(0, 0, 0, .95, .04, c, { ns: 1, seg: 36 }); hTo(0, 0, .05, .62, .04, '#fffaf0', { ns: 1 }); }
    else if (sub === 'plante') { h3Plant(0, 0, 1.05, '#d98a5f'); if (c && c !== '#e9c46a') [[.15, .1], [-.18, -.05], [0, -.2]].forEach(([dx, dy]) => hSp(dx, dy, 1.15, .07, c)); }
    else if (sub === 'lampe') { h3Lamp(0, 0, 0, 1.7, c); }
    else if (sub === 'lanterne') { hB(-.25, -.25, 0, .5, .5, .1, '#8a6448', .03); hB(-.2, -.2, .1, .4, .4, .7, c, .06, { e: c, ei: .9, op: .85 }); hB(-.27, -.27, .8, .54, .54, .1, '#8a6448', .03); hTo(0, 0, 1, .12, .03, '#8a6448'); hLt(0, 0, .5, c, .35, 3); }
    else if (sub === 'bocal') { hCy(0, 0, 0, .3, .7, '#e8f4f8', { op: .4, rough: .1 }); hSp(0, 0, .25, .2, c, 1, .8, 1); hSp(.08, .05, .4, .12, c); hCy(0, 0, .7, .28, .1, '#c99a6a'); }
    else if (sub === 'statue') { hB(-.32, -.32, 0, .64, .64, .35, '#c9b8a6', .05); hCy(0, 0, .35, .2, .55, c, { rt: .14 }); hSp(0, 0, 1.05, .2, c); }
    else if (sub === 'mappemonde') { hCy(0, 0, 0, .25, .06, '#8a6448'); hCy(0, 0, .06, .03, .5, '#8a6448'); hSp(0, 0, .95, .38, '#6fa8dc'); hSp(.15, .2, 1.05, .16, '#7fc38a', 1, .8, .6); hSp(-.2, -.1, .85, .14, '#7fc38a', .8, 1, .6); const r = hTo(0, 0, .95, .42, .025, '#c9a35a'); r.rotation.x = .4; }
    else if (sub === 'coussin') { hB(-.4, -.4, 0, .8, .8, .35, c, .17); }
    else if (sub === 'gamelle') { hCy(0, 0, 0, .3, .18, c, { rt: .38 }); }
    else if (sub === 'cheminee') { hB(-.45, -.3, 0, .9, .6, .9, c, .06); hB(-.25, .28, .05, .5, .05, .5, '#3b2a22', .02); }
    else { hB(-.35, -.35, 0, .7, .7, .6, c, .18); hSp(0, 0, .75, .16, h3Shade(c, .3)); }
    g.position.set(p.x + .5, 0, p.y + .5); if (p.m) g.rotation.y = Math.PI / 2;
  }
  H3P = P; H3P.add(g);
  if (sel) { h3Anim(t => { g.position.y = (o.w ? 3.1 : 0) + Math.abs(Math.sin(t * 4)) * .15; }); if (!o.w) hCy(p.x + .5, p.y + .5, .01, .6, .02, '#ffd866', { ns: 1, e: '#ffd866', ei: .6 }); }
}
// ---------------- les familiers ----------------
function h3Chars(R, l, who) {
  const A = HM_ACT[R.id] || { fx: '', p: [] }, P = typeof A.p === 'function' ? A.p(l) : A.p;
  who.slice(0, P.length).forEach((k, i) => {
    const [x, y, z = 0] = P[i], fx = i < (A.n || 1) || A.all ? A.fx : '';
    const mat = new THREE.SpriteMaterial({ map: h3Portrait(k, fx === 'zzz' ? 'dodo' : fx === 'love' ? 'amour' : fx ? 'rire' : 'content'), transparent: true }), sp = new THREE.Sprite(mat);
    sp.scale.set(1.75, 1.92, 1); sp.position.set(x, z + .96, y); sp.center.set(.5, .5); H3P.add(sp);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), h3Mat('#3a2418', { op: .25, basic: 1 })); sh.rotation.x = -Math.PI / 2; sh.position.set(x, z + .02, y); H3P.add(sh);
    h3Anim(t => { const q = t + i * .7; if (fx === 'go') sp.position.y = z + .96 + Math.abs(Math.sin(q * 3.4)) * .25; else if (fx === 'zzz') sp.scale.set(1.75 * (1 + Math.sin(q * 2) * .02), 1.92 * (1 - Math.sin(q * 2) * .02), 1); else { sp.position.y = z + .96 + Math.sin(q * 2.6) * .03; mat.rotation = (fx === 'water' || fx === 'stir' || fx === 'hammer') ? Math.sin(q * 3) * .05 : 0; } });
    const up = (ic, n, s = .35, dx = .45) => { for (let j = 0; j < n; j++) { const m = h3Sprite(ic, x + dx, y, z + 1.4, s); h3Anim(t => { const u = (t * .45 + j / n + i * .3) % 1; m.position.set(x + dx + Math.sin(u * 6 + j) * .12, z + 1.3 + u * 1.1, y); m.material.opacity = u < .2 ? u * 5 : 1 - (u - .2) / .8; }); } };
    if (fx === 'water') { const can = new THREE.Group(); can.position.set(x + .55, z + .75, y + .1); H3P.add(can); { const Q = H3P; H3P = can; hB(-.18, -.14, -.15, .36, .28, .3, '#5fa8d8', .08); const s2 = hCy(.25, 0, .05, .04, .4, '#5fa8d8'); s2.rotation.z = -1; H3P = Q; } h3Anim(t => { can.rotation.z = -.15 - Math.max(0, Math.sin((t + i) * 2)) * .5; });
      for (let j = 0; j < 4; j++) { const d = hSp(x + .95, y + .1, z + .6, .045, '#5fb7ea', 1, 1.6, 1, { ns: 1 }); h3Anim(t => { const u = ((t + i) * 1.2 + j / 4) % 1; d.position.set(x + .95 + u * .1, z + .7 - u * .7, y + .1); d.visible = Math.sin((t + i) * 2) > 0; }); } }
    if (fx === 'zzz') up('z', 3, .32, .4);
    if (fx === 'love') up('heart', 3, .3, 0);
    if (fx === 'read') { const bk = hB(x - .25, y + .2, z + .55, .5, .1, .35, '#e0685a', .03, { ns: 1 }); up('note', 1, .32, .45); h3Anim(t => { bk.rotation.y = Math.sin(t * 1.5) * .15; }); }
    if (fx === 'hammer') { const hm = new THREE.Group(); hm.position.set(x + .45, z + .75, y + .1); H3P.add(hm); { const Q = H3P; H3P = hm; hCy(0, 0, 0, .035, .5, '#b98a5e'); hB(-.12, -.06, .45, .24, .12, .12, '#8a8f95', .03); H3P = Q; } h3Anim(t => { hm.rotation.z = -.4 - Math.sin((t + i) * 7) * .5; }); up('spark', 2, .25, .7); }
    if (fx === 'go') up('bang', 1, .35, -.4);
    if (fx === 'stir' || fx === 'star') up('spark', 2, .22, .3);
  });
  if (R.j && !who.length && P[0]) { const [x, y, z = 0] = P[0], m = h3Sprite('plus', x, y, z + .6, .55); m.userData.hire = 1; H3.hit.push(m); hTo(x, y, z + .02, .45, .03, '#ffffff', { ns: 1 }); h3Anim(t => { m.scale.setScalar(.55 + Math.sin(t * 3) * .04); }); }
}
// ---------------- grille d'aménagement ----------------
function h3Grid(R, blk) {
  const here = hm$(() => hmHere(R.id), []), pk = hmPick && S.inv.find(i => i.id === hmPick), mv = hmMove && hmSel && f3State().d[hmSel], probe = pk || mv;
  const gh = new THREE.GridHelper(9, 9, 0xffffff, 0xffffff); gh.position.set(4.5, .025, 4.5); gh.material.transparent = true; gh.material.opacity = .55; H3P.add(gh);
  for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) {
    const occ = here.find(o => o.p.x === x && o.p.y === y), bl = hmIn(blk, x, y), ok = probe ? hmCanAt(R.id, probe, x, y, mv ? hmSel : null, blk) : false;
    const c = occ && occ.k === hmSel ? '#ffd866' : ok ? '#5fb36b' : occ ? '#f2c14e' : bl ? '#4a3528' : '#ffffff';
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), h3Mat(c, { basic: 1, op: ok ? .5 : bl ? .12 : c === '#ffffff' ? .22 : .4 })); m.rotation.x = -Math.PI / 2; m.position.set(x + .5, .03, y + .5); H3P.add(m);
    if (ok && pk && hmWallIt(pk)) { const w = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.2), h3Mat('#5fb36b', { basic: 1, op: .4 })); if (y === 0) w.position.set(x + .5, 3.1, .04); else { w.position.set(.04, 3.1, y + .5); w.rotation.y = Math.PI / 2; } H3P.add(w); }
  }
}
// ---------------- montage dans la page ----------------
function h3Build(R) {
  const T = THREE, l = hmLvl(R), locked = R.lock && l < 1, night = hmNight();
  if (H3.scene) H3.scene.traverse(o => { if (o.geometry && !Object.values(h3G).includes(o.geometry)) o.geometry.dispose(); if (o.material && o.material.map && o.isSprite && !Object.values(h3Tx).includes(o.material.map) && !Object.values(h3Por).includes(o.material.map)) o.material.dispose(); });
  const sc = new T.Scene(); H3.scene = sc; H3.anim = []; H3.hit = []; H3P = sc; hmCur = R.id;
  sc.add(new T.HemisphereLight(new T.Color(night ? '#8090d0' : '#fff4e0'), new T.Color(night ? '#3a2a40' : '#c9a07a'), night ? .3 : .42));
  sc.add(new T.AmbientLight(0xffffff, night ? .06 : .08));
  const sun = new T.DirectionalLight(new T.Color(night ? '#9fb0ff' : '#ffe8c8'), night ? .22 : .85); sun.position.set(14, 16, 9); sun.target.position.set(4.5, 0, 4.5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 }); sun.shadow.bias = -.0008; sun.shadow.radius = 4; sc.add(sun, sun.target);
  try { if (locked) h3Locked(); else H3R[R.id](l); } catch (e) { console.error('maison 3d', e); }
  if (!locked) {
    hm$(() => hmHere(R.id), []).forEach(o => { try { h3Item(o, hmEdit && hmSel === o.k); } catch (e) { console.error('objet 3d', e); } });
    const W = hmWho(), who = W[R.id] || []; try { h3Chars(R, l, who); } catch (e) { console.error('familiers 3d', e); }
    if (hmEdit) h3Grid(R, hm$(() => HM_ISO[R.id](l).blk || [], []));
  }
  // surfaces à toucher : le sol et les deux murs
  const inv = h3Mat('#000', { basic: 1, op: 0 }), fl = new T.Mesh(new T.PlaneGeometry(9, 9), inv); fl.rotation.x = -Math.PI / 2; fl.position.set(4.5, .01, 4.5); fl.userData.s = 'f'; sc.add(fl);
  const wl = new T.Mesh(new T.PlaneGeometry(9, 6), inv); wl.rotation.y = Math.PI / 2; wl.position.set(.01, 3, 4.5); wl.userData.s = 'L'; sc.add(wl);
  const wb = new T.Mesh(new T.PlaneGeometry(9, 6), inv); wb.position.set(4.5, 3, .01); wb.userData.s = 'B'; sc.add(wb);
  [fl, wl, wb].forEach(m => { m.visible = false; }); H3.hit.push(fl, wl, wb); H3.room = R.id;
}
function h3Mount(stage, R) {
  const T = THREE;
  if (!H3.r) {
    try { H3.r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { h3Load = -1; return false; }
    H3.r.outputEncoding = T.sRGBEncoding; H3.r.shadowMap.enabled = true; H3.r.shadowMap.type = T.PCFSoftShadowMap; H3.r.toneMapping = T.NoToneMapping;
    H3.cv = H3.r.domElement; H3.cv.className = 'hm-3d';
    H3.cam = new T.PerspectiveCamera(26, 380 / 352, .5, 100);
    H3.cv.addEventListener('pointerdown', e => { H3.down = [e.clientX, e.clientY]; });
    H3.cv.addEventListener('pointerup', e => { const d = H3.down; H3.down = null; if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 8) return; h3Tap(e); });
    H3.ro = new ResizeObserver(() => h3Size());
  }
  stage.classList.add('is3d'); stage.classList.toggle('sky', R.id === 'jardin'); stage.classList.toggle('nt', hmNight()); stage.insertBefore(H3.cv, stage.firstChild); H3.ro.disconnect(); H3.ro.observe(stage);
  h3Build(R); h3Size(); if (!H3.raf) { H3.t0 = performance.now(); H3.raf = requestAnimationFrame(h3Tick); }
  return true;
}
function h3Size() { const st = H3.cv && H3.cv.parentNode; if (!st) return; const w = st.clientWidth || 360, h = Math.round(w * 352 / 380); H3.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); H3.r.setSize(w, h, false); H3.cv.style.width = w + 'px'; H3.cv.style.height = h + 'px'; H3.cam.aspect = w / h; H3.cam.updateProjectionMatrix(); }
function h3Tick(now) {
  if (!H3.cv || !H3.cv.isConnected) { H3.raf = 0; return; }
  H3.raf = requestAnimationFrame(h3Tick);
  if (document.hidden) return;
  const t = (now - H3.t0) / 1000, a = Math.PI / 4 + Math.sin(t * .15) * .05, dist = 22.5;
  H3.cam.position.set(4.5 + Math.cos(a) * dist, 16.8, 4.5 + Math.sin(a) * dist); H3.cam.lookAt(4.3, 1.5, 4.3);
  for (const f of H3.anim) { try { f(t); } catch (e) {} }
  H3.r.render(H3.scene, H3.cam);
}
function h3Tap(e) {
  const T = THREE, rc = new T.Raycaster(), r = H3.cv.getBoundingClientRect(), v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  rc.setFromCamera(v, H3.cam); const hits = rc.intersectObjects(H3.hit, false); if (!hits.length) return;
  const h = hits[0], o = h.object;
  if (o.userData.hire) { const w = document.querySelector('#panelBody .hm-work'); if (w) w.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  if (!hmEdit) return;
  const P = h.point, cl = v => Math.max(0, Math.min(8, Math.floor(v)));
  let x, y; if (o.userData.s === 'L') { x = 0; y = cl(P.z); } else if (o.userData.s === 'B') { x = cl(P.x); y = 0; } else { x = cl(P.x); y = cl(P.z); }
  hmCellTap(x, y);
}
// la scène 3D remplace le dessin dès qu'elle est prête
if (typeof fyRender === 'function') fyRender = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const st = box && box.querySelector('.hm-stage'), R = hmR(hmRoom);
    if (st && R && h3Load !== -1 && h3Ready()) h3Mount(st, R);
  } catch (e) { console.error('maison 3d', e); h3Load = -1; }
  return r;
})(fyRender);
window.__h3 = { H3, state: () => h3Load };
{
  const st = document.createElement('style');
  st.textContent = `.hm-stage.is3d{background:radial-gradient(ellipse at 50% 40%,#fff8ec,#f3d9bd)}.hm-stage.is3d.sky{background:linear-gradient(#8fd3f5,#dff3fb)}.hm-stage.is3d.nt{background:radial-gradient(ellipse at 50% 40%,#3d4a86,#1f2a5a)}.hm-stage.is3d .hm-iso{display:none}.hm-3d{display:block;touch-action:pan-y}`;
  document.head.appendChild(st);
}

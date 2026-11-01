// ================= AVENTURE (v16, vague 1) : vivre le voyage avec son compagnon =================
// 1. Vue d'exploration : toucher le compagnon en route, le fil du voyage ou la carte d'action ouvre une scène illustrée
//    (décor du paysage, heure locale, météo, compagnon qui marche en parallaxe, récit du journal, étape Aller · Sur place · Retour).
// 2. Choix en 2 ou 3 temps (AV_SCENES) aux conséquences réelles : lieu caché sur la carte, objet rare, rencontre, rumeur de trésor,
//    temps gagné ou perdu, ami, réputation, petite blessure, demi-tour… Certaines options dépendent de l'espèce, des talents,
//    du niveau, des vêtements portés ou du sac.
// 3. Rencontre vécue : le familier sauvage apparaît, méfiant ; on choisit quoi offrir et comment approcher, puis on voit sa réaction.
//    Scène de nid : un œuf trouvé en chemin, ramené (ou non) au refuge.
// 4. Au retour : les moments forts du voyage dans la fenêtre du butin.
// Aucune fenêtre ne s'ouvre seule. Branchements dans 09_logic_b.js (fireEvent 'choix'/'nid', resolveChoice, autoResolve)
// et 21_nurserie.js (bonus d'approche j.avBonus, pas de second œuf si t.avNest).
// Enveloppe : startTrip, journalEntry, renderVoyage, drawMarks, showHaul. Expose : window.__av (tests).

// ---------------- état ----------------
function avState() {
  if (!S.av || typeof S.av !== 'object') S.av = {};
  const A = S.av;
  if (!Array.isArray(A.places)) A.places = [];
  if (!Array.isArray(A.friends)) A.friends = [];
  if (!A.seen || typeof A.seen !== 'object') A.seen = {};
  if (typeof A.rep !== 'number') A.rep = 0;
  return A;
}
const avTuto = t => { try { return !!(t && t.tuto && typeof tuOn === 'function' && tuOn()); } catch (e) { return false; } };
const avSp = k => (typeof spOf === 'function' ? spOf(k) : k);
function avTxt(s, k) {
  const e = typeof compE === 'function' ? compE(k) : '', A = avState(), fr = A.friends.length ? A.friends[A.friends.length - 1].n : 'un ami';
  return String(s || '').replace(/\{n\}/g, CHARS[k] ? CHARS[k].name : '').replace(/\{e\}/g, e).replace(/\{il\}/g, e ? 'elle' : 'il').replace(/\{Il\}/g, e ? 'Elle' : 'Il').replace(/\{lui\}/g, e ? 'elle' : 'lui').replace(/\{ami\}/g, fr);
}

// ---------------- paysage, heure locale, météo ----------------
const AV_BIOME_NAME = { foret: 'Forêt', jungle: 'Jungle', ville: 'En ville', quartier: 'Dans le quartier', campagne: 'Campagne', montagne: 'Montagne', neige: 'Grand froid', mer: 'Bord de mer', lac: 'Au bord de l’eau', desert: 'Désert' };
function avBiome(tags, lat, poi) {
  tags = tags || [];
  const has = x => tags.includes(x);
  if (has('neige')) return 'neige';
  if (has('desert')) return 'desert';
  if ((has('foret') || has('ile')) && Math.abs(+lat || 45) < 24) return 'jungle';
  if (has('mer') || has('ile')) return 'mer';
  if (has('lac')) return 'lac';
  if (has('montagne')) return 'montagne';
  if (has('ville') || has('monument') || has('quartier')) return poi ? 'quartier' : 'ville';
  if (has('foret')) return 'foret';
  return 'campagne';
}
let AV_FORCE = { hour: null, wx: null };
function avLocalHour(lon) {
  if (AV_FORCE.hour != null) return AV_FORCE.hour;
  const d = new Date(), utc = d.getUTCHours() + d.getUTCMinutes() / 60;
  return ((utc + (+lon || 0) / 15) % 24 + 24) % 24;
}
const avTod = h => (h >= 7 && h < 18.5 ? 'jour' : (h >= 18.5 && h < 21) || (h >= 5.5 && h < 7) ? 'soir' : 'nuit');
function avWeather(t, biome) {
  if (AV_FORCE.wx) return AV_FORCE.wx;
  let h = 0; const s = (t.id || '') + Math.floor(Date.now() / 3600e3);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const r = (h % 100) / 100;
  if (biome === 'desert') return 'clair';
  if (biome === 'neige') return r < 0.55 ? 'neige' : 'clair';
  if (biome === 'montagne' && typeof season === 'function' && season() === 'hiver') return r < 0.4 ? 'neige' : 'clair';
  return r < 0.62 ? 'clair' : r < 0.82 ? 'nuages' : 'pluie';
}
// où est le compagnon ? pendant le séjour : la destination ; sinon le dernier lieu traversé
function avWhere(t) {
  const ph = tripPhase(t);
  if (ph === 'sejour' || t.dest.poi) return { name: t.dest.name, tags: t.dest.tags || ['campagne'], lon: t.dest.lon, lat: t.dest.lat, poi: !!t.dest.poi, ph };
  const pos = tripPos(t), last = t.journal.slice().reverse().find(j => j.tags && j.place);
  return { name: last ? last.place : (ph === 'aller' ? t.from.name : t.dest.name), tags: last ? last.tags : (t.dest.tags || ['campagne']), lon: pos[0], lat: pos[1], poi: false, ph };
}

// ---------------- décor (SVG) ----------------
function avMix(a, b, f) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join('');
}
function avRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const AV_L = '#5b4636';
function avDecor(biome, tod, wx) {
  const T = c => tod === 'nuit' ? avMix(c, '#1c2552', 0.58) : tod === 'soir' ? avMix(c, '#e3876a', 0.2) : wx === 'pluie' ? avMix(c, '#8f9aa8', 0.18) : c;
  const night = tod === 'nuit', R = avRng(biome.length * 977 + 13), r = (a, b) => a + R() * (b - a);
  const L = `stroke="${T(AV_L)}" stroke-width="1.6" stroke-linejoin="round"`;
  const hills = (y, amp, col, n = 4) => { let d = `M0 ${y}`; for (let i = 0; i < n; i++) { const x0 = (400 / n) * i, x1 = x0 + 400 / n; d += ` Q${x0 + 200 / n} ${y - amp * (0.6 + R() * 0.8)} ${x1} ${y}`; } return `<path d="${d} V240 H0Z" fill="${T(col)}"/>`; };
  const tree = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="-18" width="8" height="22" rx="2" fill="${T('#8a6448')}" ${L}/><circle cx="0" cy="-34" r="20" fill="${T(col)}" ${L}/><circle cx="-12" cy="-24" r="12" fill="${T(col)}"/><circle cx="12" cy="-26" r="13" fill="${T(col)}"/><circle cx="-6" cy="-40" r="5" fill="#fff" opacity=".22"/></g>`;
  const pine = (x, y, s, col, snow) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-8" width="6" height="12" fill="${T('#7a5a40')}"/><path d="M0 -62 L18 -30 H9 L22 -8 H-22 L-9 -30 H-18Z" fill="${T(col)}" ${L}/>${snow ? `<path d="M0 -62 L9 -46 Q0 -42 -9 -46Z M-13 -30 Q0 -26 13 -30 L9 -36 Q0 -32 -9 -36Z" fill="#fff"/>` : ''}</g>`;
  const palm = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q6 -30 -2 -64" stroke="${T('#a07850')}" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="${T('#4fa36a')}" ${L}><path d="M-2 -64 Q-30 -70 -40 -50 Q-22 -62 -2 -60Z"/><path d="M-2 -64 Q28 -74 40 -52 Q20 -64 -2 -60Z"/><path d="M-2 -64 Q-12 -90 -32 -88 Q-14 -80 -4 -62Z"/><path d="M-2 -64 Q14 -92 34 -86 Q14 -80 0 -62Z"/></g><circle cx="-4" cy="-60" r="4" fill="${T('#8a5a3a')}"/><circle cx="3" cy="-59" r="4" fill="${T('#8a5a3a')}"/></g>`;
  let far = '', mid = '', ground = '', near = '';
  const grass = c => `<rect x="0" y="196" width="400" height="44" fill="${T(c)}"/>`;
  const path = c => `<path d="M0 214 Q100 206 200 214 T400 214 V230 Q300 236 200 230 T0 230Z" fill="${T(c)}" opacity=".9"/>`;
  const tufts = (col, n = 7) => Array.from({ length: n }, (_, i) => { const x = 20 + i * (360 / n) + r(0, 20), y = r(224, 236); return `<path d="M${x} ${y} q-3 -9 -7 -11 M${x} ${y} q0 -12 1 -14 M${x} ${y} q3 -9 8 -10" stroke="${T(col)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; }).join('');
  const flies = night ? Array.from({ length: 6 }, (_, i) => `<circle class="avff" style="animation-delay:${(i * 0.37).toFixed(2)}s" cx="${30 + i * 62 + r(0, 20)}" cy="${r(150, 200)}" r="2.6" fill="#fff6a8"/>`).join('') : '';
  switch (biome) {
    case 'foret':
      far = hills(150, 34, '#98c58b', 3) + Array.from({ length: 9 }, (_, i) => pine(20 + i * 45, 168, 0.45, '#6fa877')).join('');
      mid = [30, 100, 170, 240, 310, 370].map((x, i) => i % 2 ? pine(x + r(-8, 8), 200, r(0.9, 1.1), '#4f8f5a') : tree(x + r(-8, 8), 200, r(0.9, 1.15), i % 4 ? '#5fa063' : '#71ad5e')).join('');
      ground = grass('#9ccb78') + path('#d9c08e');
      near = tufts('#5d9a52') + [70, 250].map(x => `<g transform="translate(${x + r(-10, 10)} 232)"><rect x="-2" y="-8" width="4" height="8" fill="#f6ead2"/><path d="M-8 -7 Q0 -17 8 -7Z" fill="${T('#e2584d')}" ${L}/><circle cx="-2" cy="-11" r="1.4" fill="#fff"/><circle cx="3" cy="-9" r="1.2" fill="#fff"/></g>`).join('') + flies;
      break;
    case 'jungle':
      far = hills(140, 40, '#5fae78', 5) + hills(160, 26, '#4c9a68', 6);
      mid = [40, 150, 270, 360].map(x => palm(x + r(-10, 10), 202, r(0.95, 1.2))).join('') + [90, 210, 320].map(x => `<path d="M${x} 0 Q${x + 10} 50 ${x - 4} ${r(80, 120)}" stroke="${T('#3f8a52')}" stroke-width="3" fill="none"/><ellipse cx="${x + 4}" cy="44" rx="6" ry="3" fill="${T('#5fbf6f')}"/><ellipse cx="${x - 2}" cy="78" rx="6" ry="3" fill="${T('#5fbf6f')}"/>`).join('');
      ground = grass('#7cbf6a') + path('#c9a46e');
      near = [30, 130, 230, 330].map(x => `<g transform="translate(${x + r(-10, 10)} 238)"><path d="M0 0 Q-24 -20 -10 -40 Q2 -24 0 0Z" fill="${T('#3f9a5a')}" ${L}/><path d="M0 0 Q22 -18 14 -36 Q0 -22 0 0Z" fill="${T('#52b06a')}" ${L}/><circle cx="18" cy="-8" r="4" fill="${T('#f08aa6')}"/></g>`).join('') + flies;
      break;
    case 'ville': case 'quartier': {
      const lit = night || tod === 'soir';
      far = Array.from({ length: 8 }, (_, i) => { const w = r(34, 50), h = r(50, 100), x = 4 + i * 49; let s = `<rect x="${x}" y="${178 - h}" width="${w}" height="${h}" fill="${T('#b9c5da')}"/>`; for (let yy = 178 - h + 8; yy < 170; yy += 14) for (let xx = x + 6; xx < x + w - 6; xx += 10) s += `<rect x="${xx}" y="${yy}" width="5" height="7" fill="${lit && R() < 0.5 ? '#ffe28a' : T('#e3eaf4')}"/>`; return s; }).join('');
      const fac = ['#f4c7a1', '#f6e0a8', '#cfe2c6', '#f2b8b8', '#c9d8ef'];
      mid = [0, 1, 2, 3].map(i => { const x = 8 + i * 100, w = 80, h = r(70, 92), c = fac[i % fac.length]; return `<g><rect x="${x}" y="${200 - h}" width="${w}" height="${h}" fill="${T(c)}" ${L}/><path d="M${x - 5} ${200 - h} L${x + w / 2} ${200 - h - 26} L${x + w + 5} ${200 - h}Z" fill="${T('#d9604f')}" ${L}/><rect x="${x + w / 2 - 9}" y="${172}" width="18" height="28" rx="8" fill="${T('#8a6448')}" ${L}/><rect x="${x + 10}" y="${200 - h + 14}" width="16" height="16" fill="${lit ? '#ffe28a' : T('#bfe1f2')}" ${L}/><rect x="${x + w - 26}" y="${200 - h + 14}" width="16" height="16" fill="${lit ? '#ffe28a' : T('#bfe1f2')}" ${L}/><path d="M${x + 6} ${200 - h + 40} H${x + w - 6}" stroke="${T('#f08aa6')}" stroke-width="6" stroke-dasharray="8 4"/></g>`; }).join('') + [92, 292].map(x => `<g><rect x="${x}" y="150" width="4" height="50" fill="${T('#4a3528')}"/><circle cx="${x + 2}" cy="148" r="6" fill="${lit ? '#ffe9a0' : T('#fff6d8')}" ${L}/>${lit ? `<circle cx="${x + 2}" cy="148" r="18" fill="#ffe9a0" opacity=".28"/>` : ''}</g>`).join('');
      ground = `<rect x="0" y="196" width="400" height="44" fill="${T('#cfc6b8')}"/><rect x="0" y="196" width="400" height="9" fill="${T('#e8dfd0')}"/>` + Array.from({ length: 10 }, (_, i) => `<path d="M${i * 40 + 6} 222 h18" stroke="${T('#f6efe2')}" stroke-width="3"/>`).join('');
      near = [50, 210, 340].map(x => `<g transform="translate(${x + r(-10, 10)} 236)"><path d="M-9 0 L-7 -12 H7 L9 0Z" fill="${T('#d98a5a')}" ${L}/><circle cx="-4" cy="-17" r="5" fill="${T('#f08aa6')}"/><circle cx="4" cy="-18" r="5" fill="${T('#f6c445')}"/><circle cx="0" cy="-23" r="5" fill="${T('#9fd37a')}"/></g>`).join('');
      break; }
    case 'campagne':
      far = hills(150, 30, '#b9d98e', 3) + `<path d="M0 160 Q100 140 200 158 T400 160 V175 H0Z" fill="${T('#e8d48a')}"/>` + `<g transform="translate(300 152)"><rect x="-16" y="-24" width="32" height="24" fill="${T('#d9604f')}" ${L}/><path d="M-20 -24 L0 -40 L20 -24Z" fill="${T('#a8473c')}" ${L}/></g>`;
      mid = `<path d="M0 186 H400 M0 196 H400" stroke="${T('#c9a07a')}" stroke-width="4"/>` + Array.from({ length: 10 }, (_, i) => `<rect x="${i * 40 + 18}" y="178" width="5" height="24" fill="${T('#b38a62')}" ${L}/>`).join('') + [80, 260].map(x => `<g transform="translate(${x} 196)"><ellipse cx="0" cy="-12" rx="18" ry="13" fill="${T('#f0cf6a')}" ${L}/><path d="M-12 -16 h24 M-14 -9 h28" stroke="${T('#d9b04a')}" stroke-width="2"/></g>`).join('') + tree(360, 196, 1.05, '#6aab5a');
      ground = grass('#a8d27e') + path('#e0c895');
      near = Array.from({ length: 12 }, (_, i) => { const x = 10 + i * 33; return `<path d="M${x} 240 q2 -16 -2 -26" stroke="${T('#d9b04a')}" stroke-width="2" fill="none"/><ellipse cx="${x - 2}" cy="213" rx="2.4" ry="5" fill="${T('#efc85a')}"/>`; }).join('') + [120, 300].map(x => `<circle cx="${x}" cy="228" r="4" fill="${T('#f08aa6')}"/><circle cx="${x}" cy="228" r="1.6" fill="#fff6a8"/>`).join('') + flies;
      break;
    case 'montagne':
      far = `<path d="M0 170 L50 90 L80 120 L130 50 L190 140 L240 70 L300 150 L350 80 L400 170 V240 H0Z" fill="${T('#9fb0c8')}"/><path d="M130 50 L148 76 L136 72 L124 80 L114 74Z M240 70 L256 94 L240 88 L228 92Z M50 90 L62 108 L46 104Z M350 80 L364 102 L348 98 L338 100Z" fill="#fff"/>`;
      mid = hills(186, 30, '#8fbf7f', 2) + [40, 120, 200, 280, 360].map((x, i) => i % 2 ? pine(x + r(-8, 8), 196, r(0.75, 0.95), '#4f8f6a') : `<path d="M${x - 16} 200 Q${x - 10} 182 ${x} 184 Q${x + 12} 180 ${x + 18} 200Z" fill="${T('#b7aea0')}" ${L}/>`).join('');
      ground = grass('#a9c98a') + path('#c9b896');
      near = [60, 190, 320].map(x => `<g transform="translate(${x + r(-10, 10)} 230)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5" rx="2.4" ry="5" fill="#fff" stroke="${T('#c9c2a8')}" stroke-width=".8" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="${T('#f6c445')}"/></g>`).join('') + tufts('#6f9a5a', 5);
      break;
    case 'neige':
      far = `<path d="M0 160 L60 80 L110 130 L170 60 L230 140 L290 70 L350 120 L400 160 V240 H0Z" fill="${T('#dfe9f6')}"/><path d="M60 80 L80 108 L60 100 L44 104Z M170 60 L190 90 L170 84 L154 88Z M290 70 L308 96 L290 90 L276 94Z" fill="${T('#b9cce6')}"/>`;
      mid = hills(190, 22, '#f2f7fc', 3) + [30, 110, 190, 270, 350].map(x => pine(x + r(-10, 10), 198, r(0.85, 1.1), '#3f7f6a', true)).join('');
      ground = `<rect x="0" y="196" width="400" height="44" fill="${T('#f6f9fd')}"/><path d="M0 220 Q100 212 200 220 T400 220" stroke="${T('#d6e2f0')}" stroke-width="3" fill="none"/>`;
      near = [70, 230, 350].map(x => `<ellipse cx="${x + r(-10, 10)}" cy="236" rx="22" ry="9" fill="#fff" stroke="${T('#cfdcec')}" stroke-width="1.4"/>`).join('') + `<g transform="translate(150 234)"><circle cy="-8" r="9" fill="#fff" ${L}/><circle cy="-22" r="6.5" fill="#fff" ${L}/><path d="M0 -21 l6 1.5 l-6 1.5Z" fill="#f08a4a"/><circle cx="-2" cy="-24" r="1" fill="${AV_L}"/><circle cx="2" cy="-24" r="1" fill="${AV_L}"/></g>`;
      break;
    case 'mer':
      far = `<rect x="0" y="120" width="400" height="80" fill="${T('#6fc3df')}"/><path d="M0 120 H400" stroke="${T('#bfe8f4')}" stroke-width="2"/><path d="M250 120 Q280 100 320 120Z" fill="${T('#7fbf8a')}"/><g transform="translate(90 132)"><path d="M-14 0 H14 L10 6 H-10Z" fill="${T('#fff6e6')}" ${L}/><path d="M0 -2 V-24 L12 -4Z" fill="${T('#f08aa6')}" ${L}/></g>` + Array.from({ length: 6 }, (_, i) => `<path d="M${20 + i * 66} ${150 + (i % 3) * 14} q6 -4 12 0 t12 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`).join('');
      mid = palm(60, 204, 1.05) + `<g transform="translate(250 204)"><path d="M0 0 V-50" stroke="${T('#7a5a40')}" stroke-width="3"/><path d="M-34 -48 Q0 -74 34 -48Z" fill="${T('#f08aa6')}" ${L}/><path d="M-11 -56 Q0 -72 11 -56" stroke="#fff" stroke-width="5" fill="none"/></g>` + palm(360, 204, 0.9);
      ground = `<rect x="0" y="194" width="400" height="46" fill="${T('#f2dfae')}"/><path class="avwave" d="M0 196 Q25 190 50 196 T100 196 T150 196 T200 196 T250 196 T300 196 T350 196 T400 196" stroke="#fff" stroke-width="3" fill="none" opacity=".85"/>`;
      near = [50, 180, 300].map((x, i) => i % 2 ? `<path transform="translate(${x} 230)" d="M0 -10 L3 -3 L10 -3 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-10 -3 L-3 -3Z" fill="${T('#f6a06a')}" ${L}/>` : `<path transform="translate(${x} 232)" d="M-9 0 Q0 -16 9 0Z" fill="${T('#f8d0d8')}" ${L}/>`).join('');
      break;
    case 'lac':
      far = hills(140, 30, '#9cc98a', 3) + `<rect x="0" y="150" width="400" height="46" fill="${T('#8fd0e0')}"/>` + Array.from({ length: 7 }, (_, i) => `<path d="M${20 + i * 56} ${162 + (i % 3) * 10} h22" stroke="#fff" stroke-width="2" opacity=".6"/>`).join('') + `<g transform="translate(300 170)"><ellipse rx="10" ry="6" fill="#fff" ${L}/><path d="M6 -2 Q12 -16 6 -18" stroke="#fff" stroke-width="4" fill="none"/><path d="M6 -18 l5 1" stroke="${T('#f08a4a')}" stroke-width="2.4"/></g>`;
      mid = [50, 220].map(x => `<g transform="translate(${x} 200)"><rect x="-4" y="-40" width="8" height="42" fill="${T('#8a6448')}"/><path d="M0 -70 Q-34 -64 -38 -10 M0 -70 Q-16 -40 -20 -4 M0 -70 Q16 -40 18 -4 M0 -70 Q34 -64 36 -10" stroke="${T('#7fb86a')}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-66" rx="26" ry="12" fill="${T('#8cc474')}"/></g>`).join('') + [130, 330].map(x => Array.from({ length: 5 }, (_, i) => `<path d="M${x + i * 6} 202 V${172 + i * 3}" stroke="${T('#6f9a4a')}" stroke-width="2.4"/><rect x="${x + i * 6 - 2}" y="${168 + i * 3}" width="4" height="10" rx="2" fill="${T('#8a5a3a')}"/>`).join('')).join('');
      ground = grass('#a6d185') + path('#d6c79a');
      near = tufts('#5f9a52', 8) + flies;
      break;
    case 'desert':
      far = `<path d="M0 160 Q70 120 140 150 T280 140 T400 160 V240 H0Z" fill="${T('#f2cd8e')}"/><path d="M0 176 Q90 150 190 172 T400 172 V240 H0Z" fill="${T('#eab874')}"/><g transform="translate(320 128)"><path d="M-14 0 L0 -26 L14 0Z" fill="${T('#d9a868')}" ${L}/></g>`;
      mid = [70, 250].map(x => `<g transform="translate(${x} 202)"><rect x="-6" y="-56" width="12" height="58" rx="6" fill="${T('#6fae6a')}" ${L}/><path d="M-6 -30 H-16 V-44" stroke="${T('#6fae6a')}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M6 -22 H16 V-38" stroke="${T('#6fae6a')}" stroke-width="9" fill="none" stroke-linecap="round"/></g>`).join('') + palm(370, 204, 0.85);
      ground = `<rect x="0" y="194" width="400" height="46" fill="${T('#f6d9a0')}"/><path d="M0 220 Q60 212 120 220 T240 218 T400 220" stroke="${T('#e8c07e')}" stroke-width="3" fill="none"/>`;
      near = [40, 160, 290].map(x => `<ellipse cx="${x + r(-10, 10)}" cy="234" rx="8" ry="5" fill="${T('#c9a07a')}" ${L}/>`).join('');
      break;
  }
  return { far, mid, ground, near };
}
function avSky(tod, wx) {
  const c = tod === 'nuit' ? ['#1b2350', '#3b4a82'] : tod === 'soir' ? ['#f19f86', '#fde3b4'] : wx === 'pluie' ? ['#a3b1c0', '#dbe2ea'] : wx === 'nuages' ? ['#b3d4e8', '#eaf4f8'] : ['#93cff0', '#e4f5fb'];
  let s = `<defs><linearGradient id="avsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs><rect width="400" height="240" fill="url(#avsg)"/>`;
  if (tod === 'nuit') { const R = avRng(7); s += Array.from({ length: 28 }, () => `<circle class="avtw" style="animation-delay:${(R() * 3).toFixed(2)}s" cx="${(R() * 400).toFixed(0)}" cy="${(R() * 130).toFixed(0)}" r="${(0.8 + R() * 1.4).toFixed(1)}" fill="#fff8d8"/>`).join('') + `<circle cx="320" cy="44" r="17" fill="#f6efcf"/><circle cx="328" cy="38" r="15" fill="${c[0]}"/>`; }
  else if (tod === 'soir') s += `<circle cx="300" cy="120" r="30" fill="#f7a35e" opacity=".9"/>`;
  else if (wx !== 'pluie') s += `<circle cx="330" cy="46" r="22" fill="#fbd96a"/><circle cx="330" cy="46" r="32" fill="#fbd96a" opacity=".25"/>`;
  if (wx === 'nuages' || wx === 'pluie') s += [[60, 50], [200, 34], [320, 64]].map(([x, y]) => `<g fill="${wx === 'pluie' ? '#e4e8ee' : '#fff'}" opacity=".95"><ellipse cx="${x}" cy="${y}" rx="34" ry="13"/><ellipse cx="${x - 14}" cy="${y - 8}" rx="16" ry="12"/><ellipse cx="${x + 12}" cy="${y - 10}" rx="18" ry="14"/></g>`).join('');
  return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
}
const avTile = inner => { const sv = `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${inner}</svg>`; return sv + sv; };

// ---------------- les scènes à choix (2 ou 3 temps) ----------------
// option : a (libellé), go (nœud suivant) ou r (résultat) ; p (chance de réussite) + f (résultat d'échec) ;
// need : conditions alternatives ('sp:axo,phoque', 'eff:audace', 'lvl:4', 'wear:pieds:bottes', 'food', 'sub:lumiere', 'friend', 'coins:5') ; h : étiquette.
// fx : loot loot2 rare food place:Nom rumor wild time+ time- back rep friend:Nom hurt cN xN photo give egg
const R_ = (t, fx) => ({ t, fx: fx || '' });
const SWIM = 'sp:axo,phoque,capy', CLIMB = ['sp:panda,lemur,paresseux,tanuki', 'eff:audace'];
const AV_SCENES = [
  // ---------- forêt ----------
  { id: 'sentier', b: ['foret'], q: 'Un sentier moussu s’enfonce sous les grands chênes. {n} renifle l’air : ça sent la noisette… et l’aventure.', o: [
    { a: 'Suivre le sentier', go: { q: 'Le sentier débouche sur une clairière où dansent des lucioles, même en plein jour. Au milieu, une souche creuse brille doucement.', o: [
      { a: 'Glisser la patte dans la souche', p: 0.65, r: R_('Dedans, bien au sec, un trésor de la forêt ! {n} le serre contre {lui}.', 'rare x10'), f: R_('Un hérisson grognon y faisait la sieste. Ouille ! {n} repart avec la patte qui pique.', 'hurt') },
      { a: 'Dessiner la clairière dans le carnet', r: R_('Trois coups de crayon, une luciole pour signer : la clairière apparaît désormais sur votre carte !', 'place:Clairière_des_lucioles x10') },
      { a: 'Remplir son sac de champignons', need: ['wear:dos:sac'], h: 'Avec son sac à dos', r: R_('Son sac à dos avale cèpes, girolles et une noisette géante. Quel festin !', 'food loot') } ] } },
    { a: 'Rester sur la route', r: R_('{n} reste sage et marche d’un bon pas. Le voyage sera un peu plus court !', 'time- loot') },
    { a: 'Grimper au grand chêne', need: CLIMB, h: 'Grimpeur', r: R_('Tout en haut, coincée entre deux branches, une vieille bouteille… avec un bout de carte dedans !', 'rumor x15') } ] },
  { id: 'fees', b: ['foret', 'campagne'], q: 'Un cercle de champignons parfait pousse au pied d’un hêtre. On raconte que les fées y dansent les soirs de lune.', o: [
    { a: 'Entrer dans le cercle', go: { q: 'Tout se met à tourner… {n} se retrouve assis{e} au même endroit, mais le soleil a bougé ! Une petite voix chuchote : « Un vœu ? »', o: [
      { a: 'Faire un vœu', r: R_('Pouf ! Un éclat doré, et un objet rare atterrit dans ses pattes. Mais une heure chez les fées, ça compte double : le voyage s’allonge.', 'rare time+') },
      { a: 'Ressortir en vitesse', r: R_('{n} ressort en riant. Rien de magique… à part ce fou rire qui ne s’arrête plus.', 'x25') } ] } },
    { a: 'Faire le tour prudemment', r: R_('Prudent{e}, {n} contourne le cercle et ramasse quelques trésors des sous-bois.', 'loot') },
    { a: 'Laisser un goûter aux fées', need: ['food'], h: 'Un goûter dans le sac', r: R_('Une toute petite voix dit merci. {n} a une nouvelle amie : la fée Mirabelle !', 'give rep friend:la_fée_Mirabelle') } ] },
  { id: 'pont', b: ['foret', 'lac', 'montagne'], q: 'Un vieux pont de cordes enjambe un ruisseau qui chante. Il manque une planche, pile au milieu.', o: [
    { a: 'Traverser le pont', p: 0.6, go: { q: 'Le pont se balance, mais tient bon ! De l’autre côté, une petite cabane fume.', o: [
      { a: 'Frapper à la porte', r: R_('Barnabé le blaireau ouvre en pantoufles, sert une tisane et offre un petit cadeau. Un nouvel ami !', 'friend:Barnabé_le_blaireau rep loot') },
      { a: 'Jeter un œil par la fenêtre', r: R_('Sur la table, une carte griffonnée ! {n} retient un nom… c’est une rumeur de trésor.', 'rumor') } ] },
      f: R_('Crac ! La planche cède, et {n} tombe dans le ruisseau. Plouf ! Plus de peur que de mal, mais il faut un grand détour pour se sécher.', 'hurt time+') },
    { a: 'Traverser le ruisseau à pied', need: ['wear:pieds:bottes'], h: 'Avec ses bottes', r: R_('Avec ses bottes, {n} traverse le ruisseau sans hésiter… et repère un galet qui brille au fond.', 'rare time-') },
    { a: 'Nager dans le courant', need: [SWIM], h: 'Bon nageur', r: R_('Plouf ! {n} file dans le courant comme une flèche et prend un raccourci.', 'time- loot') },
    { a: 'Faire demi-tour', r: R_('{n} préfère ne pas risquer. {Il} rebrousse chemin et rentrera plus tôt… avec moins de trouvailles.', 'back') } ] },
  { id: 'hibou', b: ['foret', 'montagne'], q: 'Un hibou à lunettes interpelle {n} : « Hou ! Tu as l’air d’un voyageur. Une devinette ? »', o: [
    { a: 'Accepter la devinette', go: { q: '« Qu’est-ce qui a des racines que personne ne voit, et qui est plus grand que les arbres ? »', o: [
      { a: '« Une montagne ! »', r: R_('« Bravo ! » Le hibou se penche et chuchote un secret : une rumeur de trésor.', 'rumor x20') },
      { a: '« Un très grand champignon ? »', r: R_('Le hibou rit si fort qu’il tombe de sa branche. Beau joueur, il offre quand même une plume.', 'loot x10') } ] } },
    { a: 'Lui offrir un goûter', need: ['food'], h: 'Un goûter dans le sac', r: R_('« Hou, gourmand que je suis ! » Monsieur Hulotte devient son ami et promet de veiller sur ses voyages.', 'give friend:Monsieur_Hulotte rep') },
    { a: 'Saluer poliment et filer', r: R_('{n} fait une petite révérence et file. Pas de devinette, mais du temps gagné !', 'time-') } ] },
  { id: 'fourres', b: ['foret', 'jungle'], q: 'Un grand bruit dans les fourrés ! Quelque chose de gros approche…', o: [
    { a: 'Se cacher derrière un tronc', go: { q: 'C’est… un énorme sanglier, qui cherche ses lunettes en reniflant partout. Il a l’air perdu.', o: [
      { a: 'L’aider à chercher', r: R_('Les lunettes étaient sur sa tête. Le sanglier, ému, vide ses poches pour remercier {n}.', 'rep loot2') },
      { a: 'Filer sur la pointe des pattes', r: R_('{n} file en silence et gagne un peu de temps.', 'time-') } ] } },
    { a: 'Faire le brave', p: 0.55, r: R_('C’était un jeune animal sauvage, curieux comme tout ! Il observe {n}… Ouvrez la vue d’exploration pour l’approcher.', 'wild x10'), f: R_('C’était un sanglier pressé. {n} roule dans les feuilles mortes, un peu sonné{e}.', 'hurt') },
    { a: 'Rugir encore plus fort', need: ['lvl:5'], h: 'Niveau 5', r: R_('ROAAAR (version mignonne). Le fourré se tait, puis un petit museau sort : on le salue comme un chef. Un cadeau rare roule à ses pieds.', 'rare rep') } ] },
  // ---------- jungle ----------
  { id: 'liane', b: ['jungle'], q: 'Une liane géante pend au-dessus d’un ravin plein de fleurs. De l’autre côté, on devine des pierres sculptées.', o: [
    { a: 'Se balancer à la liane', p: 0.6, go: { q: 'Wiii ! {n} atterrit devant un temple couvert de mousse. Une porte étroite s’ouvre dans le noir.', o: [
      { a: 'Entrer dans le temple', r: R_('Sur un autel, un objet ancien et une inscription qui parle d’un trésor lointain !', 'rare rumor') },
      { a: 'Noter le temple sur la carte', r: R_('Le Temple des mousses est noté : il apparaît désormais sur votre carte.', 'place:Temple_des_mousses x10') } ] },
      f: R_('La liane était glissante ! {n} atterrit dans un buisson de fleurs. Tout{e} parfumé{e}, mais un peu égratigné{e}.', 'hurt') },
    { a: 'Chercher un pont', r: R_('Le pont est loin, très loin. Au moins, la balade est jolie.', 'time+ loot') },
    { a: 'Demander aux singes', need: ['lvl:4'], h: 'Niveau 4', r: R_('Impressionnés par son assurance, les singes lui montrent un raccourci et deviennent ses amis.', 'friend:Kiki_le_singe time- loot') } ] },
  { id: 'averse', b: ['jungle'], q: 'Une pluie tiède s’abat d’un coup. Les feuilles deviennent des parapluies géants.', o: [
    { a: 'S’abriter sous une feuille', go: { q: 'Sous la feuille, une minuscule grenouille bleue tient compagnie à {n}. Elle a l’air de connaître un secret.', o: [
      { a: 'Lui chanter une chanson', r: R_('La grenouille chante en canon. Les animaux de la jungle applaudissent !', 'rep x20') },
      { a: 'La suivre', r: R_('Elle mène {n} à une mare cachée, bleue comme un bonbon. Elle apparaît sur votre carte !', 'place:Mare_des_grenouilles_bleues') } ] } },
    { a: 'Danser sous la pluie', r: R_('Une averse, des fruits tombés partout : un vrai festin !', 'food') },
    { a: 'Continuer sous son chapeau', need: ['wear:tete:chapeau', 'wear:tete:casquette'], h: 'Avec son chapeau', r: R_('Bien abrité{e} sous son chapeau, {n} continue au sec et repère une orchidée rare.', 'rare time-') } ] },
  { id: 'perroquet', b: ['jungle', 'mer'], q: 'Un perroquet répète tout ce que dit {n}. Soudain, il crie : « Trésor ! Trésor ! »', o: [
    { a: 'Lui demander où', go: { q: '« Par là ! » Le perroquet file vers une cascade qui gronde.', o: [
      { a: 'Passer derrière la cascade', p: 0.55, r: R_('Derrière l’eau, une grotte sèche et un coffret ! {n} en ressort ébloui{e}.', 'rare rumor'), f: R_('Glissade ! {n} ressort trempé{e} jusqu’aux oreilles.', 'hurt') },
      { a: 'Noter la cascade', r: R_('La Cascade du perroquet est notée : elle apparaît sur votre carte.', 'place:Cascade_du_perroquet') } ] } },
    { a: 'Partager un fruit avec lui', need: ['food'], h: 'Un goûter dans le sac', r: R_('Coco le perroquet adopte {n}. « Ami ! Ami ! »', 'give friend:Coco_le_perroquet rep') },
    { a: 'Faire comme si de rien n’était', r: R_('« Rien n’était ! Rien n’était ! » {n} file en pouffant.', 'time- x5') } ] },
  // ---------- ville ----------
  { id: 'ruelle', b: ['ville', 'quartier'], q: 'Une ruelle pavée tourne derrière la grand-place. Une odeur de pain chaud s’en échappe.', o: [
    { a: 'Suivre l’odeur', go: { q: 'Une minuscule boulangerie se cache sous une arcade. La boulangère cherche quelqu’un pour goûter sa nouvelle recette.', o: [
      { a: 'Goûter la recette', r: R_('Délicieux ! {n} repart avec deux viennoiseries encore tièdes.', 'food x10') },
      { a: 'Aider à pétrir la pâte', r: R_('{n} pétrit, enfarine tout et rit beaucoup. Madame Brioche devient son amie.', 'rep c20 friend:Madame_Brioche') },
      { a: 'Noter l’adresse', r: R_('La boulangerie sous l’arcade apparaît sur votre carte. On y reviendra !', 'place:Boulangerie_sous_l’arcade') } ] } },
    { a: 'Rester sur la grand-place', r: R_('{n} flâne entre les étals et trouve une petite chose.', 'loot time-') } ] },
  { id: 'pigeon', b: ['ville', 'quartier', 'monument'], q: 'Un pigeon chipe le mouchoir de {n} et s’envole vers les toits !', o: [
    { a: 'Le poursuivre', p: 0.55, go: { q: 'Course folle sur les toits ! Le pigeon se pose sur un vieux clocher… où il a construit un nid plein de trésors volés.', o: [
      { a: 'Fouiller le nid', r: R_('Mouchoir récupéré… et un objet rare que le pigeon avait chipé ailleurs !', 'rare') },
      { a: 'Admirer la vue', r: R_('D’ici, on voit toute la ville. {n} note le clocher sur votre carte.', 'place:Clocher_aux_pigeons x15') } ] },
      f: R_('Le pigeon est plus rapide. {n}, tout essoufflé{e}, a perdu du temps.', 'time+') },
    { a: 'Laisser tomber', r: R_('Bah, c’était un vieux mouchoir. {n} reprend sa route.', 'x5') },
    { a: 'Lui offrir une miette', need: ['food'], h: 'Un goûter dans le sac', r: R_('Le pigeon rend le mouchoir et roucoule merci. Gaston le pigeon est désormais son ami.', 'give friend:Gaston_le_pigeon rep') } ] },
  { id: 'musicien', b: ['ville', 'quartier'], q: 'Un musicien de rue joue un air joyeux. Son chapeau est presque vide.', o: [
    { a: 'Danser avec lui', go: { q: 'La foule s’arrête, tout le monde danse ! Le chapeau se remplit de pièces.', o: [
      { a: 'Tout lui laisser', r: R_('Le musicien serre {n} dans ses bras. Un ami de plus !', 'rep friend:Léo_le_musicien') },
      { a: 'Partager moitié-moitié', r: R_('Marché conclu ! {n} empoche sa part en dansant.', 'c30') } ] } },
    { a: 'Glisser une pièce', need: ['coins:5'], h: '5 pièces', r: R_('Le musicien joue un air rien que pour {n}. Les passants sourient.', 'c-5 rep') },
    { a: 'Continuer son chemin', r: R_('{n} fredonne l’air pendant des kilomètres.', 'time-') } ] },
  { id: 'musee', b: ['ville', 'monument'], q: 'La porte d’un musée est entrouverte. Une affiche dit : « Fermé pour inventaire ».', o: [
    { a: 'Se faufiler', p: 0.55, go: { q: 'Dans la réserve, des caisses partout. Une étiquette : « Carte ancienne, origine inconnue ». Une caisse vient de tomber.', o: [
      { a: 'Lire la vieille carte', r: R_('Une croix, des pointillés… c’est une rumeur de trésor !', 'rumor') },
      { a: 'Ranger la caisse tombée', r: R_('La conservatrice arrive, ravie : « Quel{le} petit{e} serviable ! » Elle offre un souvenir.', 'rep loot') } ] },
      f: R_('Le gardien attrape {n} par le col… et lui impose la visite complète. Très longue. Très, très longue.', 'time+ x15') },
    { a: 'Attendre la réouverture', r: R_('Patience récompensée : visite guidée et souvenirs !', 'time+ loot2') },
    { a: 'Montrer son élégance', need: ['wear:tete:beret', 'wear:tete:chapeau', 'wear:tete:couronne'], h: 'Bien coiffé{e}', r: R_('Avec son élégant couvre-chef, {n} est pris{e} pour un critique d’art ! On lui offre un cadeau rare.', 'rare rep') } ] },
  { id: 'cuisine', b: ['quartier'], q: 'Juste à côté, une porte de service est restée entrouverte. Quelqu’un fredonne derrière.', o: [
    { a: 'Jeter un œil', go: { q: 'C’est une cuisine ! Un chat cuisinier fait sauter des crêpes… et en rate une sur deux.', o: [
      { a: 'Lui donner un coup de main', r: R_('À deux, c’est parfait. Chef Moustache offre une pile de crêpes et son amitié.', 'food rep friend:Chef_Moustache') },
      { a: 'Rattraper une crêpe au vol', p: 0.5, r: R_('Hop ! Pile dans l’assiette. Le chef applaudit et offre un petit trésor.', 'loot x15'), f: R_('La crêpe atterrit sur la tête de {n}. Délicieux, mais très collant.', 'hurt') } ] } },
    { a: 'Attendre sagement son tour', r: R_('On récompense toujours les gens patients.', 'loot') },
    { a: 'Aider les gens du coin', r: R_('Un carton porté, un vélo réparé : tout le quartier connaît {n} maintenant !', 'rep c20') } ] },
  // ---------- campagne ----------
  { id: 'grange', b: ['campagne'], q: 'Un orage gronde au-dessus des champs de blé. Les épis se couchent sous le vent.', o: [
    { a: 'Courir jusqu’à la grange', go: { q: 'Dans la grange, au sec, une poule couve tranquillement… à côté d’un vieux coffre poussiéreux.', o: [
      { a: 'Ouvrir le coffre', p: 0.6, r: R_('Le coffre grince… et dévoile un trésor d’autrefois !', 'rare'), f: R_('Des toiles d’araignée. Beaucoup. {n} éternue pendant dix minutes.', 'time+') },
      { a: 'Tenir compagnie à la poule', r: R_('La poule glousse de bonheur et partage son goûter.', 'rep food') } ] } },
    { a: 'Courir sous la pluie', p: 0.5, r: R_('Une flaque, deux flaques… et un trèfle à quatre feuilles !', 'rare'), f: R_('Trempé{e} jusqu’aux os, {n} attrape un petit rhume. Atchoum !', 'hurt') },
    { a: 'Sauter dans les flaques', need: ['wear:pieds:bottes'], h: 'Avec ses bottes', r: R_('Avec ses bottes, {n} saute dans toutes les flaques et arrive en avance, ravi{e}.', 'time- loot2') } ] },
  { id: 'epouvantail', b: ['campagne'], q: 'Un épouvantail semble faire signe à {n}. Le vent ? Ou pas…', o: [
    { a: 'S’approcher', go: { q: 'Dans sa poche, un mot : « Celui qui me rendra un chapeau aura ma reconnaissance éternelle. »', o: [
      { a: 'Lui offrir son couvre-chef', need: ['wear:tete:chapeau', 'wear:tete:bonnet', 'wear:tete:casquette', 'wear:tete:beret'], h: 'Porte un chapeau', r: R_('L’épouvantail Firmin sourit (si, si). Il chuchote où se cache un trésor.', 'rumor rep friend:l’épouvantail_Firmin') },
      { a: 'Chercher un chapeau dans le champ', r: R_('Pas de chapeau, mais plein d’autres choses ! Ça prend du temps.', 'time+ loot2') },
      { a: 'Laisser tomber', r: R_('{n} lui fait un signe et repart.', 'x5') } ] } },
    { a: 'Passer en courant', r: R_('Brrr. {n} file sans se retourner, et gagne du temps.', 'time-') } ] },
  { id: 'verger', b: ['campagne', 'agrumes'], q: 'Un verger croule sous les fruits. Une échelle est appuyée contre le plus grand arbre.', o: [
    { a: 'Grimper à l’échelle', p: 0.65, go: { q: 'Tout en haut, la vue est magnifique : au loin, un moulin que personne ne semble connaître.', o: [
      { a: 'Noter le moulin', r: R_('Le Moulin oublié apparaît sur votre carte. Un mystère à explorer !', 'place:Moulin_oublié') },
      { a: 'Cueillir le plus beau fruit', r: R_('Le fruit le plus doré de tout le verger !', 'rare food') } ] },
      f: R_('L’échelle glisse… {n} atterrit dans un tas de pommes. Ouf, mais aïe.', 'hurt food') },
    { a: 'Demander au fermier', go: { q: '« Tu m’aides à ramasser ? » Le fermier Léon tend un panier.', o: [
      { a: 'Aider', r: R_('Deux heures de cueillette, des fous rires et un panier plein. Léon devient son ami.', 'rep food c15 friend:le_fermier_Léon time+') },
      { a: 'Refuser poliment', r: R_('Léon hausse les épaules et lance une pomme. Rattrapée !', 'food') } ] } } ] },
  { id: 'moutons', b: ['campagne', 'montagne'], q: 'Un troupeau de moutons a envahi la route. Ils sont des centaines !', o: [
    { a: 'Guider le troupeau', p: 0.55, r: R_('Les moutons suivent {n} comme un vrai berger ! La bergère Margot, épatée, devient son amie.', 'rep friend:la_bergère_Margot loot'), f: R_('Ce sont plutôt les moutons qui guident {n}… dans la mauvaise direction.', 'time+') },
    { a: 'Attendre qu’ils passent', go: { q: 'Le dernier mouton s’arrête et fixe {n} droit dans les yeux. Il a quelque chose de brillant dans la laine.', o: [
      { a: 'Le brosser doucement', r: R_('Dans la laine : un objet rare ! Le mouton bêle de bonheur.', 'rare') },
      { a: 'Lui faire un câlin', r: R_('Le câlin le plus doux du monde.', 'x20') } ] } },
    { a: 'Passer par le champ', r: R_('{n} coupe à travers champ et gagne du temps.', 'time- loot') } ] },
  // ---------- montagne ----------
  { id: 'col', b: ['montagne'], q: 'Un col enneigé se dresse devant {n}. Le vent siffle des chansons de montagne.', o: [
    { a: 'Grimper jusqu’au sommet', p: 0.55, go: { q: 'Au sommet : une croix de bois, un carnet des randonneurs… et une vue à couper le souffle.', o: [
      { a: 'Signer le carnet', r: R_('En feuilletant, {n} lit une note étrange laissée par un explorateur : une rumeur de trésor !', 'rumor x20') },
      { a: 'Prendre une photo', r: R_('La plus belle carte postale du voyage !', 'photo x15') } ] },
      f: R_('Le vent souffle trop fort. {n} redescend, les oreilles gelées.', 'hurt time+') },
    { a: 'Prendre la vallée', r: R_('Par la vallée, c’est plus court et plein de fleurs.', 'time- loot') },
    { a: 'Grimper bien emmitouflé{e}', need: ['wear:cou:echarpe', 'wear:mains:moufles', 'wear:tete:bonnet'], h: 'Habillé{e} chaudement', r: R_('Bien au chaud, {n} grimpe sans frissonner et trouve un cristal tout en haut.', 'rare x15') } ] },
  { id: 'grotte', b: ['montagne', 'neige'], q: 'Une grotte s’ouvre dans la paroi. Un petit courant d’air tiède en sort.', o: [
    { a: 'Entrer', go: { q: 'Dans le noir, des cristaux scintillent. Plus loin, on entend de l’eau qui goutte en musique.', o: [
      { a: 'Suivre le bruit de l’eau', r: R_('Une salle immense où les cristaux chantent ! Elle apparaît sur votre carte.', 'place:Grotte_aux_cristaux_chantants x10') },
      { a: 'Ramasser un cristal', p: 0.7, r: R_('Un cristal parfait, qui brille encore dans sa patte.', 'rare'), f: R_('Il était bien accroché ! {n} tombe sur les fesses.', 'hurt') } ] } },
    { a: 'Allumer une lanterne', need: ['sub:lumiere', 'sub:lune'], h: 'Une lumière dans le sac', r: R_('À la lumière, des dessins anciens apparaissent sur les murs… ils montrent un trésor !', 'rumor rare') },
    { a: 'Passer son chemin', r: R_('Les grottes, c’est pour une autre fois.', 'time-') } ] },
  { id: 'marmotte', b: ['montagne'], q: 'Une marmotte siffle trois fois. Elle a l’air de vouloir montrer quelque chose.', o: [
    { a: 'La suivre', go: { q: 'Elle mène {n} à son terrier. Un bébé marmotte a la patte coincée dans une racine !', o: [
      { a: 'Le libérer doucement', r: R_('Libre ! Toute la famille Marmotte siffle de joie et offre ses trésors.', 'rep friend:la_famille_Marmotte loot2') },
      { a: 'Appeler ses parents', r: R_('Les parents arrivent en courant. Ils remercient {n} d’un sifflement.', 'x15') } ] } },
    { a: 'Lui offrir un goûter', need: ['food'], h: 'Un goûter dans le sac', r: R_('Miam ! La marmotte, repue, montre à {n} un raccourci secret.', 'give time- loot') },
    { a: 'Continuer', r: R_('{n} siffle trois fois en retour. Politesse de montagne.', 'x5') } ] },
  // ---------- neige ----------
  { id: 'tempete', b: ['neige'], q: 'Le vent souffle fort sur la neige. {n} n’y voit plus rien.', o: [
    { a: 'Avancer dans la tempête', p: 0.5, go: { q: 'Dans le blanc, une petite lumière : un igloo, avec de la fumée qui sort par le haut.', o: [
      { a: 'Entrer se réchauffer', r: R_('Nanouk sert un chocolat chaud et raconte des histoires du grand Nord. Un nouvel ami !', 'friend:Nanouk rep food') },
      { a: 'Noter l’igloo sur la carte', r: R_('L’Igloo de la tempête apparaît sur votre carte.', 'place:Igloo_de_la_tempête') } ] },
      f: R_('Le vent pousse {n} dans une congère. {Il} en ressort tout{e} blanc{he} et grelottant{e}.', 'hurt time+') },
    { a: 'Attendre au refuge', r: R_('Chocolat chaud et jeux de société. Le voyage s’allonge, mais quel bonheur.', 'time+ food') },
    { a: 'Avancer bien couvert{e}', need: ['wear:mains:moufles', 'wear:cou:echarpe', 'wear:tete:bonnet'], h: 'Habillé{e} chaudement', r: R_('Bien au chaud, {n} avance sans peine et trouve un flocon éternel.', 'time- rare') },
    { a: 'Glisser sur le ventre', need: ['sp:phoque,renard'], h: 'Né{e} pour la neige', r: R_('Wiii ! {n} glisse sur la neige à toute vitesse. Quel raccourci !', 'time- loot2') } ] },
  { id: 'aurore', b: ['neige', 'montagne'], q: 'Le ciel se met à onduler de vert et de rose : une aurore boréale !', o: [
    { a: 'La regarder jusqu’au bout', r: R_('Une heure le nez en l’air. Le voyage s’allonge, mais {n} a l’air transformé{e}.', 'time+ rare photo') },
    { a: 'Faire un vœu', go: { q: 'Une étoile tombe tout près, dans la neige fraîche. Elle brille encore.', o: [
      { a: 'Creuser pour la trouver', r: R_('Dans la neige, un éclat d’étoile !', 'rare') },
      { a: 'La laisser briller', r: R_('Certaines choses doivent rester là où elles sont. Un vieux renard qui passait approuve, et confie un secret.', 'rep rumor') } ] } },
    { a: 'Faire un bonhomme de neige', r: R_('Le plus beau bonhomme de neige du monde. Photo souvenir !', 'photo x10') } ] },
  // ---------- mer ----------
  { id: 'crique', b: ['mer'], q: 'À marée basse, une crique secrète se dévoile entre deux rochers.', o: [
    { a: 'Rejoindre la crique', p: 0.55, go: { q: 'Dans la crique, une vieille malle à moitié ensablée attend sous les mouettes.', o: [
      { a: 'Ouvrir la malle', r: R_('Une longue-vue, un coquillage nacré… et une carte !', 'rare rumor') },
      { a: 'Noter la crique', r: R_('La Crique de la marée basse apparaît sur votre carte.', 'place:Crique_de_la_marée_basse') } ] },
      f: R_('Une vague taquine renverse {n}. {Il} doit attendre de sécher au soleil.', 'time+') },
    { a: 'Y aller à la nage', need: [SWIM], h: 'Bon nageur', r: R_('{n} nage jusqu’à la crique en deux brasses et trouve un trésor dans le sable.', 'rare time-') },
    { a: 'Rester sur la plage', r: R_('Coquillages et galets polis : pas mal du tout.', 'loot') },
    { a: 'Aider les pêcheurs', r: R_('Les filets sont rangés en un clin d’œil. Le vieux Marin devient son ami.', 'rep c20 friend:le_vieux_Marin') } ] },
  { id: 'bouteille', b: ['mer', 'lac'], q: 'Une bouteille roule dans l’écume. Il y a un papier dedans !', o: [
    { a: 'L’ouvrir', go: { q: '« À qui trouvera ce message : je suis un crabe et je m’ennuie. Viens jouer ! Signé : Pince. »', o: [
      { a: 'Chercher le crabe', r: R_('Pince est ravi ! Ils jouent à chat sur la plage. Un nouvel ami.', 'friend:Pince_le_crabe loot') },
      { a: 'Écrire une réponse', r: R_('{n} glisse une jolie lettre dans la bouteille et la relance. Quelqu’un sourira bientôt.', 'rep x15') } ] } },
    { a: 'La rapporter telle quelle', r: R_('En l’examinant de près, on dirait un bout de carte au trésor !', 'rumor') } ] },
  { id: 'tortue', b: ['mer'], q: 'Une petite tortue de mer est retournée sur le dos, sur le sable chaud.', o: [
    { a: 'La remettre à l’endroit', go: { q: 'Elle file vers l’eau… puis se retourne, comme pour dire de la suivre.', o: [
      { a: 'La suivre à la nage', need: [SWIM], h: 'Bon nageur', r: R_('Elle mène {n} à un lagon secret plein de tortues. Il apparaît sur votre carte !', 'place:Lagon_des_tortues rare') },
      { a: 'Lui dire au revoir', r: R_('Une tortue reconnaissante, c’est pour la vie.', 'rep x15') } ] } },
    { a: 'Appeler les gardiens', r: R_('La gardienne Lou arrive en courant. Elle remercie {n} et devient son amie.', 'rep friend:la_gardienne_Lou') } ] },
  // ---------- lac ----------
  { id: 'barque', b: ['lac'], q: 'Un ponton s’avance sur l’eau claire. Une barque attend, sans personne.', o: [
    { a: 'Monter dans la barque', go: { q: 'Au milieu du lac, un îlot couvert de saules pleureurs. Des poissons dorés tournent autour.', o: [
      { a: 'Accoster sur l’îlot', r: R_('L’Îlot des saules apparaît sur votre carte.', 'place:Îlot_des_saules x10') },
      { a: 'Pêcher un peu', r: R_('Trois poissons, deux bottes et un trésor !', 'food loot time+') } ] } },
    { a: 'Plonger tout au fond', need: [SWIM], h: 'Bon nageur', r: R_('{n} remonte avec une perle d’eau douce !', 'rare') },
    { a: 'Aider un pêcheur', r: R_('Le pêcheur partage sa pêche et quelques pièces.', 'rep c15 food') } ] },
  { id: 'reine', b: ['lac'], q: 'Une grenouille couronnée trône sur un nénuphar. « Qui ose passer sur mes terres ? »', o: [
    { a: 'S’incliner', go: { q: '« De bonnes manières ! Ma couronne a perdu sa perle dans les roseaux. M’aideras-tu ? »', o: [
      { a: 'Chercher la perle', r: R_('Retrouvée, après une longue fouille ! La reine récompense {n} royalement.', 'time+ rare rep') },
      { a: 'Promettre de revenir', r: R_('La reine confie un secret, en gage : une rumeur de trésor.', 'rumor') } ] } },
    { a: 'Lui montrer sa couronne', need: ['wear:tete:couronne'], h: 'Porte une couronne', r: R_('Deux têtes couronnées ! La reine fait de {n} un{e} chevalier du lac.', 'friend:la_Reine_Grenouille rare') },
    { a: 'Faire un grand plouf', r: R_('Plouf ! La reine est vexée, mais {n} est déjà loin.', 'x10 time-') } ] },
  // ---------- désert ----------
  { id: 'caravane', b: ['desert'], q: 'Une tempête de sable approche à l’horizon.', o: [
    { a: 'Suivre une caravane', go: { q: 'Le soir, au campement, les chameliers racontent des légendes autour du feu.', o: [
      { a: 'Écouter les légendes', r: R_('L’une d’elles parle d’un trésor bien réel…', 'rumor') },
      { a: 'Raconter une histoire à son tour', r: R_('Tout le monde rit aux éclats. Amir le conteur devient son ami.', 'rep friend:Amir_le_conteur') } ] } },
    { a: 'S’abriter sous une tente', r: R_('On attend la fin de la tempête. Long, mais à l’abri.', 'time+ loot') },
    { a: 'Courir sur les dunes', need: ['sp:fennec', 'wear:cou:foulard'], h: 'Fait{e} pour le désert', r: R_('{n} file sur les dunes, plus vite que la tempête, et trouve un trésor des sables.', 'time- rare') } ] },
  { id: 'oasis', b: ['desert'], q: 'Une oasis scintille au loin. Vraie ou mirage ?', o: [
    { a: 'Y aller', p: 0.55, go: { q: 'C’est une vraie oasis ! Palmiers, eau fraîche, et un puits très, très ancien.', o: [
      { a: 'Noter l’oasis sur la carte', r: R_('L’Oasis du mirage apparaît sur votre carte.', 'place:Oasis_du_mirage') },
      { a: 'Regarder au fond du puits', r: R_('Tout au fond, quelque chose brille. {n} le remonte avec le seau !', 'rare') } ] },
      f: R_('Mirage ! {n} a marché pour rien et a très soif.', 'hurt time+') },
    { a: 'Rester sur la piste', r: R_('La piste est sûre et rapide.', 'loot time-') } ] },
  // ---------- partout ----------
  { id: 'voyageur', b: ['any'], q: 'Un petit voyageur au sac trop lourd est assis au bord du chemin. Il soupire.', o: [
    { a: 'Porter son sac', go: { q: '« Merci ! Pour te remercier : un secret ou mon porte-bonheur ? »', o: [
      { a: 'Le secret', r: R_('Il chuchote une rumeur de trésor.', 'rumor rep') },
      { a: 'Le porte-bonheur', r: R_('Un porte-bonheur rare, encore tiède.', 'rare rep') } ] } },
    { a: 'Lui montrer le chemin', r: R_('{n} lui montre un raccourci, et en profite aussi.', 'rep time-') },
    { a: 'Lui présenter un ami', need: ['friend'], h: 'A des amis', r: R_('{n} lui présente {ami}, qui l’emmène. Les amis de mes amis…', 'rep c20') } ] },
  // ---------- le nid (œuf trouvé en chemin) ----------
  { id: 'nid', b: [], q: 'Sous les racines d’un vieil arbre, {n} découvre un nid caché… Un œuf tout tiède y repose, seul.', o: [
    { a: 'Le prendre délicatement', go: { q: '{n} l’enveloppe tout doucement. L’œuf bouge un tout petit peu !', o: [
      { a: 'Le ramener au refuge', r: R_('{n} le porte comme un trésor jusqu’à la maison. Il ira à la nurserie !', 'egg') },
      { a: 'Le reposer : sa maman reviendra', r: R_('{n} le recouvre de mousse. Quelque part, une maman sera soulagée.', 'rep x15') } ] } },
    { a: 'Attendre la maman, caché{e}', p: 0.5, r: R_('Une maman apparaît, renifle {n}… et lui confie l’œuf, comme si elle savait.', 'egg rep'), f: R_('La maman revient et emporte l’œuf. {n} est content{e} de les voir réunis.', 'rep') },
    { a: 'Couvrir le nid de feuilles', r: R_('Bien au chaud, bien caché. {n} trouve une jolie plume en partant.', 'rep loot') } ] },
];
const AV_BY = Object.fromEntries(AV_SCENES.map(s => [s.id, s]));

// ---------------- moteur des choix ----------------
function avHasItem(t, f) { return (t.bag || []).some(f) || (S.inv || []).some(f); }
function avNeedOk(k, need, t) {
  if (!need || !need.length) return true;
  return need.some(n => {
    const [ty, a, b] = n.split(':');
    if (ty === 'sp') return a.split(',').includes(avSp(k));
    if (ty === 'eff') return hasEff(k, a);
    if (ty === 'lvl') return ((S.prog[k] && S.prog[k].lvl) || 1) >= +a;
    if (ty === 'wear') { const o = S.outfits[k] || {}; return o[a] === b; }
    if (ty === 'food') return avHasItem(t, i => i.cat === 'n');
    if (ty === 'sub') return avHasItem(t, i => i.sub === a);
    if (ty === 'friend') return avState().friends.length > 0;
    if (ty === 'coins') return S.coins >= +a;
    return false;
  });
}
function avNode(j) {
  let n = AV_BY[j.sc]; if (!n) return null;
  for (const i of j.path || []) { const o = n.o[i]; if (!o || !o.go) return null; n = o.go; }
  return n;
}
function avPickScene(t, biome, forced) {
  if (forced) return AV_BY[forced];
  const A = avState(), used = new Set(t.journal.filter(j => j.sc).map(j => j.sc));
  const b2 = biome === 'quartier' ? ['quartier', 'ville'] : biome === 'jungle' ? ['jungle', 'foret'] : [biome];
  let c = AV_SCENES.filter(s => s.b.some(x => b2.includes(x)) && !used.has(s.id));
  if (!c.length) c = AV_SCENES.filter(s => s.b.includes('any') && !used.has(s.id));
  if (!c.length) return null;
  const w = c.map(s => 1 / (1 + (A.seen[s.id] || 0)) * (s.b.includes('any') ? 0.4 : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i]; }
  return c[0];
}
// appelé par fireEvent (09_logic_b.js) pour 'choix' et 'nid' ; J ajoute l'entrée au journal
function avFireChoice(t, e, place, J) {
  const tags = place.tags || ['campagne'], biome = avBiome(tags, place.lat, place.poi);
  const sc = avPickScene(t, biome, e.type === 'nid' ? 'nid' : null);
  if (!sc) return false;
  const k = t.comp, o = { kind: 'choix', sc: sc.id, path: [], steps: [], text: avTxt(sc.q, k), ctag: 'campagne', biome, lat: place.lat, lon: place.lon, pending: true };
  if (sc.id === 'nid') {
    t.avNest = 1;
    try { const sp = nsPickSp(t.dest, t.bait ? t.bait.sps : null), genes = rollGenes(sp, 0.5); o.egg = { sp, genes, rarity: geneRarityOf(genes, sp) }; o.kind = 'choix'; } catch (er) { o.egg = null; }
  }
  J(o);
  return true;
}
function avChance(k, p) {
  if (hasEff(k, 'zen')) return 1;
  return Math.min(0.95, p + (hasEff(k, 'audace') ? 0.2 : 0) + (compTemper(k) === 0 ? 0.05 : 0) + Math.min(0.15, (((S.prog[k] && S.prog[k].lvl) || 1) - 1) * 0.02));
}
function avChoose(t, j, oi, auto) {
  if (!t || !j || j.resolved) return;
  const k = t.comp, node = avNode(j);
  if (!node) { j.resolved = true; j.outcome = avTxt('{n} reprend sa route.', k); return; }
  const opt = node.o[oi]; if (!opt) return;
  if (!avNeedOk(k, opt.need, t)) { if (!auto) return; }
  j.path = j.path || []; j.steps = j.steps || [];
  let ok = true;
  if (opt.p != null) ok = Math.random() < avChance(k, opt.p);
  j.steps.push({ a: avTxt(opt.a, k), ok: opt.p != null ? ok : undefined });
  if (opt.go && ok) { j.path.push(oi); j.q = avTxt(opt.go.q, k); j.lastFx = null; save(); return 'next'; }
  const res = ok ? opt.r : (opt.f || R_('{n} reprend sa route.', 'x5'));
  const place = { name: j.place, tags: j.tags || ['campagne'], lat: j.lat, lon: j.lon };
  const out = avApply(t, j, res.fx || '', place);
  j.resolved = true; j.choice = oi; j.auto = !!auto; j.ok = ok;
  j.outcome = (auto ? avTxt(`{n} a décidé tout{e} seul{e} : « ${j.steps.map(s => s.a).join(' › ')} ». `, k) : '') + avTxt(res.t, k);
  j.items = out.items; j.chips = out.chips;
  t.avLog = t.avLog || [];
  t.avLog.push({ a: j.steps.map(s => s.a).join(' › '), t: avTxt(res.t, k), chips: out.chips, place: j.place, auto: !!auto });
  const A = avState(); A.seen[j.sc] = (A.seen[j.sc] || 0) + 1;
  if (!auto) bump('choices');
  save();
  return 'done';
}
function avAutoIdx(t, node) {
  const k = t.comp, av = node.o.map((o, i) => i).filter(i => avNeedOk(k, node.o[i].need, t));
  if (!av.length) return 0;
  const special = av.find(i => node.o[i].need); if (special != null) return special; // ses vêtements et talents lui servent
  const tp = compTemper(k);
  if (tp === 0) return av[0];
  if (tp === 1) return av.includes(1) ? 1 : av[0];
  return av[av.length - 1];
}
function avAuto(t, j) { for (let g = 0; g < 5 && !j.resolved; g++) { const n = avNode(j); if (!n) { avChoose(t, j, 0, true); break; } avChoose(t, j, avAutoIdx(t, n), true); } }

// conséquences
function avFoodDefs(tags) { let pool = []; (tags || []).forEach(tg => (LOOT[tg] || []).forEach(d => { if (d[1] === 'n') pool.push(d); })); if (!pool.length) pool = (LOOT.campagne || []).filter(d => d[1] === 'n'); return pool; }
const AV_PLACE_TAGS = { foret: ['foret'], jungle: ['foret', 'ile'], ville: ['ville'], quartier: ['ville'], campagne: ['campagne'], montagne: ['montagne'], neige: ['neige'], mer: ['mer'], lac: ['lac'], desert: ['desert'] };
function avAddPlace(t, j, name) {
  const A = avState(), k = t.comp;
  const pos = isFinite(j.lon) && isFinite(j.lat) ? [j.lon, j.lat] : tripPos(t);
  if (A.places.some(p => p.name === name && kmBetween({ lon: pos[0], lat: pos[1] }, p) < 40)) return null;
  const km = (t.dest.poi || t.dist < 5) ? 0.3 + Math.random() * 0.6 : 1.5 + Math.random() * 4, a = Math.random() * Math.PI * 2;
  const lat = pos[1] + (km / 111) * Math.cos(a), lon = pos[0] + (km / (111 * Math.max(0.2, Math.cos(pos[1] * Math.PI / 180)))) * Math.sin(a);
  const tags = AV_PLACE_TAGS[j.biome] || ['campagne'];
  const pool = (LOOT[tags[0]] || []).slice().sort((x, y) => y[3] - x[3]);
  const sp = pool.length ? pool[Math.min(pool.length - 1, Math.floor(Math.random() * 3))] : null;
  const p = { id: 'av' + uidGen(), name, lon, lat, tags, special: sp ? [sp[0] + ' (' + name + ')', sp[1], sp[2], Math.max(2, sp[3]), sp[4] || null, sp[5] || null] : null, by: k, date: Date.now(), biome: j.biome };
  A.places.push(p); if (A.places.length > 60) A.places.shift();
  try { drawMarks(); } catch (e) {}
  return p;
}
function avApply(t, j, fx, place) {
  const k = t.comp, n = CHARS[k].name, items = [], chips = [], tags = place.tags, A = avState();
  const dt = () => Math.max(15e3, Math.min(25 * 60e3, t.total * 0.12));
  for (const tok of fx.split(' ').filter(Boolean)) {
    const [ty, arg] = [tok.split(':')[0], tok.split(':').slice(1).join(':').replace(/_/g, ' ')];
    try {
      if (ty === 'loot' || ty === 'loot2') items.push(...lootFor(tags, t.luck + 0.5, place.name, ty === 'loot2' ? 2 : 1, k));
      else if (ty === 'rare') { const it = lootFor(tags, t.luck + 3, place.name, 1, k)[0]; if (it) { it.rarity = Math.max(2, it.rarity); items.push(it); chips.push(['rare', 'Objet rare']); } }
      else if (ty === 'food') { const pool = avFoodDefs(tags); items.push(makeItem(pick(pool), t.luck, place.name, tags), makeItem(pick(pool), t.luck, place.name, tags)); }
      else if (ty === 'place') { const p = avAddPlace(t, j, arg); if (p) { j.newPlace = p.id; chips.push(['place', 'Nouveau lieu : ' + p.name]); } else items.push(...lootFor(tags, t.luck + 1, place.name, 1, k)); }
      else if (ty === 'rumor') {
        let r = null; try { if (typeof tzGiveRumor === 'function') r = tzGiveRumor(null, `${n}, en voyage`, { lon: place.lon, lat: place.lat }); } catch (e) {}
        if (r) chips.push(['rumor', `Rumeur : « ${r.text} »`]); else { items.push(treasureMap(place.name, t.dest)); chips.push(['rumor', 'Bout de carte']); }
      }
      else if (ty === 'wild') {
        if (!avTuto(t) && typeof nsFireWild === 'function' && !t.events.some(e => e.type === 'sauvage' && !e.fired)) { const f = Math.min(1, t.elapsed / t.total); t.events.push({ at: Math.min(0.95, f + 0.015), type: 'sauvage' }); t.events.sort((a, b) => a.at - b.at); chips.push(['wild', 'Une rencontre approche…']); }
        else items.push(...lootFor(tags, t.luck + 1, place.name, 1, k));
      }
      else if (ty === 'time+') { const d = dt(); t.total += d; t.stay = (t.stay || 0) + d; chips.push(['slow', `Le voyage s’allonge (${fmtDur(d)})`]); }
      else if (ty === 'time-') { const d = dt(); t.elapsed = Math.min(t.total - 3e3, t.elapsed + d); chips.push(['fast', `Raccourci : ${fmtDur(d)} de gagné`]); }
      else if (ty === 'back') { const nx = t.events.find(e => !e.fired && e.type !== 'arrivee' && e.type !== 'sauvage'); if (nx) nx.fired = true; const d = dt(); t.elapsed = Math.min(t.total - 3e3, t.elapsed + d); chips.push(['back', 'Demi-tour : retour plus tôt']); }
      else if (ty === 'rep') { A.rep++; chips.push(['rep', 'Réputation +1']); if (A.rep % 5 === 0) { t.coins += 40; chips.push(['rep', `On parle de vos compagnons partout ! +40 pièces`]); } }
      else if (ty === 'friend') { if (!A.friends.some(f => f.n === arg)) { A.friends.push({ n: arg, k, place: place.name, date: Date.now() }); chips.push(['friend', 'Nouvel ami : ' + arg]); } }
      else if (ty === 'hurt') { t.avHurt = (t.avHurt || 0) + 1; t.xp = Math.max(0, t.xp - 12); chips.push(['hurt', avTxt('{n} rentrera fatigué{e}', k)]); }
      else if (/^c-?\d+$/.test(tok)) { const g = +tok.slice(1); t.coins += g; chips.push(['coins', `${g > 0 ? '+' : ''}${g} pièces`]); }
      else if (/^x\d+$/.test(tok)) t.xp += +tok.slice(1);
      else if (ty === 'photo') { const p = { id: uidGen(), comps: [k], tags, place: place.name, country: '', hour: new Date().getHours(), weather: pickWeather(tags), title: `${n} à ${place.name}`, date: Date.now() }; t.photos.push(p); j.photo = p; chips.push(['photo', 'Carte postale']); }
      else if (ty === 'give') {
        const src = (t.bag || []).find(i => i.cat === 'n') ? t.bag : S.inv, it = src.filter(i => i.cat === 'n').sort((a, b) => a.rarity - b.rarity)[0];
        if (it) { src.splice(src.indexOf(it), 1); chips.push(['give', `Offert : ${it.name}`]); }
      }
      else if (ty === 'egg') { if (j.egg) { t.avEgg = j.egg; chips.push(['egg', 'Un œuf pour le refuge !']); } else items.push(...lootFor(tags, t.luck + 1, place.name, 1, k)); }
    } catch (e) { console.error('aventure', tok, e); }
  }
  t.xp += 10;
  t.bag.push(...items);
  return { items, chips };
}

// ---------------- départ : parfois un nid sur la route ----------------
startTrip = (orig => function () {
  const k = S.sel, before = S.trips[k];
  const r = orig.apply(this, arguments);
  try {
    const t = S.trips[k];
    if (t && t !== before && !t.tuto && typeof nsState === 'function') {
      const N = nsState(), p = ({ eclair: 0.08, court: 0.14, moyen: 0.2, long: 0.26, expe: 0.32 })[t.dur] || 0.12;
      if (N.found > 0 && (S.eggs || []).length < 7 && Math.random() < p) { t.events.push({ at: 0.25 + Math.random() * 0.5, type: 'nid' }); t.events.sort((a, b) => a.at - b.at); save(); }
    }
  } catch (e) { console.error('aventure départ', e); }
  return r;
})(startTrip);

// ---------------- lieux cachés sur la carte ----------------
const AV_PIN = '<path d="M12 3 L14.6 9 L21 9.6 L16.2 13.8 L17.6 20 L12 16.8 L6.4 20 L7.8 13.8 L3 9.6 L9.4 9Z" fill="#fff"/>';
function avMapUpdate() {
  if (typeof ovEls === 'undefined' || !$('ov') || !Object.keys(ovEls).length) return;
  for (const p of avState().places) {
    let o = ovEls['av' + p.id];
    if (!o) {
      const el = document.createElement('div'); el.className = 'ovm pin avpin'; el.dataset.avp = p.id;
      el.innerHTML = `<div class="pinb" style="--pc:#e9a83a"><svg viewBox="0 0 24 24" aria-hidden="true">${AV_PIN}</svg></div><span class="pinl">${esc(p.name)}</span>`;
      $('ov').appendChild(el); o = ovEls['av' + p.id] = { el, lon: p.lon, lat: p.lat };
    }
    o.el.classList.toggle('dest', !!(plan.dest && plan.dest.avp === p.id));
  }
}
if (typeof drawMarks === 'function') drawMarks = (orig => function () { const r = orig.apply(this, arguments); try { avMapUpdate(); if (typeof positionOverlay === 'function') positionOverlay(); } catch (e) { console.error(e); } return r; })(drawMarks);
function avGoPlace(id) {
  const p = avState().places.find(x => x.id === id); if (!p) return;
  if (S.trips[S.sel]) { openSheet('voyage'); toast(`${CHARS[S.sel].name} est déjà en voyage. Choisissez un autre compagnon en haut.`); return; }
  plan.dest = { id: null, avp: p.id, name: p.name, country: '', lat: p.lat, lon: p.lon, tags: p.tags.slice(), special: p.special };
  if (kmBetween(homeObj(), plan.dest) < 40) plan.dur = 'eclair';
  openSheet('voyage'); drawMarks();
}

// ---------------- la vue d'exploration ----------------
let avBusy = 0, avK = null, avSig = '', avStageKey = '', avPick = { src: null, id: null, how: null }, avAnim = null, avLastLen = 0;
const AV_PH = [['aller', 'Aller'], ['sejour', 'Sur place'], ['retour', 'Retour']];
function avOpen(k) {
  const t = S.trips[k]; if (!t) return;
  if (S.sel !== k) { S.sel = k; S.unseen[k] = 0; plan.dest = null; save(); try { renderComps(); drawMarks(); } catch (e) {} }
  S.unseen[k] = 0;
  avK = k; avSig = ''; avStageKey = ''; avPick = { src: null, id: null, how: null }; avLastLen = t.journal.length;
  let v = $('avView');
  if (!v) { v = document.createElement('div'); v.id = 'avView'; v.className = 'avv'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); document.body.appendChild(v); }
  v.innerHTML = `<div class="avbox"><header class="avh"></header><div class="avph"></div><div class="avstage"></div><div class="avstory" aria-live="polite"></div><footer class="avf"><button class="btn cream sm" data-av-journal="1">Journal complet</button><button class="btn green sm" data-av-close="1">Retour à la carte</button></footer></div>`;
  v.hidden = false; document.body.classList.add('avopen');
  avRender(true);
}
function avClose() { const v = $('avView'); if (v) { v.hidden = true; v.innerHTML = ''; } avK = null; document.body.classList.remove('avopen'); try { renderAll(); } catch (e) {} }
const avPending = t => t.journal.findIndex(j => j.pending && !j.resolved);
function avRender(force) {
  const v = $('avView'); if (!v || v.hidden || !avK) return;
  if (avBusy > Date.now()) return;
  const k = avK, t = S.trips[k];
  if (!t) { avClose(); return; }
  const w = avWhere(t), biome = avBiome(w.tags, w.lat, w.poi), hour = avLocalHour(w.lon), tod = avTod(hour), wx = avWeather(t, biome);
  const ph = t.done ? 'fin' : w.ph, pi = avPending(t), pj = pi >= 0 ? t.journal[pi] : null;
  const wild = pj && pj.kind === 'sauvage' ? pj : null, tamed = t.journal.filter(j => j.kind === 'sauvage' && j.tamed && S.comps[j.tamed]).map(j => j.tamed);
  // en-tête et étapes
  const left = Math.max(0, (t.total - t.elapsed) / (typeof fast !== 'undefined' && fast && k === S.sel ? 30 : 1));
  v.querySelector('.avh').innerHTML = `<img src="${portraitURI(k)}" alt=""><div><b>${esc(CHARS[k].name)} · ${esc(w.name)}</b><span>${esc(AV_BIOME_NAME[biome] || '')} · ${tod === 'nuit' ? 'la nuit' : tod === 'soir' ? 'au crépuscule' : 'en journée'}${wx === 'pluie' ? ' · sous la pluie' : wx === 'neige' ? ' · il neige' : ''} · ${Math.floor(hour)} h ${String(Math.floor((hour % 1) * 60)).padStart(2, '0')} là-bas</span></div><button class="avx" data-av-close="1" aria-label="Fermer">×</button>`;
  v.querySelector('.avph').innerHTML = AV_PH.map(([id, l]) => `<i class="${id === ph ? 'on' : AV_PH.findIndex(x => x[0] === id) < AV_PH.findIndex(x => x[0] === ph) || ph === 'fin' ? 'past' : ''}">${l}</i>`).join('<b>·</b>') + `<span>${t.done ? 'Rentré !' : 'Retour dans ' + fmtDur(left)}</span>`;
  // décor (reconstruit seulement s'il change, pour ne pas relancer les animations)
  const moving = !t.done && ph !== 'sejour' && !wild;
  const skey = [biome, tod, wx, ph, moving, wild ? wild.t : '', tamed.join(','), t.done].join('|');
  if (skey !== avStageKey || force) {
    avStageKey = skey;
    const D = avDecor(biome, tod, wx), mood = t.done ? 'rire' : wild ? 'curieux' : tod === 'nuit' && ph === 'sejour' ? 'dodo' : 'content';
    const st = v.querySelector('.avstage');
    st.className = `avstage b-${biome} t-${tod} ${moving ? 'mv' : 'still'} ${ph === 'retour' ? 'rev' : ''}`;
    st.innerHTML = `<div class="avl avsky">${avSky(tod, wx)}</div><div class="avl avfar"><div class="avt">${avTile(D.far)}</div></div><div class="avl avgr">${avTile(D.ground).split('</svg>')[0]}</svg></div><div class="avl avmid"><div class="avt">${avTile(D.mid)}</div></div>`
      + tamed.map((id, i) => `<img class="avfol" style="left:${4 + i * 9}%" src="${portraitURI(id, 'content')}" alt="${esc(CHARS[id].name)} suit le groupe">`).join('')
      + `<img class="avme" src="${portraitURI(k, mood)}" alt="${esc(CHARS[k].name)}">`
      + (wild ? `<div class="avwild wary" id="avWild"><img src="${nsPortrait(wild.sp, wild.genes, null, 'curieux')}" alt="${esc(spName(wild.sp))} sauvage"><svg class="avbush" viewBox="0 0 100 60" aria-hidden="true"><path d="M4 60 Q0 34 22 34 Q24 14 46 20 Q60 6 76 22 Q100 20 96 60Z" fill="#5fa063" stroke="#3d6b40" stroke-width="2.4"/><circle cx="30" cy="40" r="3" fill="#f08aa6"/><circle cx="70" cy="34" r="3" fill="#f6c445"/></svg><i class="avq">?</i></div>` : '')
      + `<div class="avl avnear"><div class="avt">${avTile(D.near)}</div></div>`
      + (wx === 'pluie' || wx === 'neige' ? `<div class="avl avwx ${wx}"></div>` : '');
  }
  // récit
  const sig = [t.journal.length, pi, pj ? (pj.path || []).length : '', JSON.stringify(avPick), t.done].join('|');
  if (sig === avSig && !force) return;
  avSig = sig;
  const box = v.querySelector('.avstory');
  const past = t.journal.map((j, i) => [j, i]).filter(([j, i]) => i !== pi).slice(-6);
  let h = past.map(([j, i]) => avLine(t, j, i, i >= avLastLen)).join('');
  avLastLen = t.journal.length;
  if (pj) h += avAsk(t, pj, pi);
  else if (!t.done) h += `<p class="avnext">${esc(avTxt(ph === 'sejour' ? '{n} explore les environs…' : ph === 'retour' ? '{n} reprend le chemin de la maison…' : '{n} marche, le nez au vent…', k))}<span class="avdots"><i></i><i></i><i></i></span></p>`;
  else h += `<div class="avend"><button class="btn green big" data-av-collect="${k}">Ouvrir son sac</button></div>`;
  box.innerHTML = h;
  box.scrollTop = box.scrollHeight;
}
const AV_CHIP_IC = { place: '★', rumor: '✉', friend: '♥', rep: '☺', hurt: '✚', slow: '⧗', fast: '»', back: '↺', wild: '!', egg: '◒', rare: '◆', photo: '▣', coins: '●', give: '♡' };
const avChips = cs => (cs || []).length ? `<span class="avchips">${cs.map(([c, l]) => `<em class="avc c-${c}">${AV_CHIP_IC[c] || ''} ${esc(l)}</em>`).join('')}</span>` : '';
function avLine(t, j, i, fresh) {
  const time = new Date(j.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  let s = `<div class="avln${fresh ? ' pop' : ''} k-${j.kind}"><small>${time}${j.place ? ' · ' + esc(j.place) : ''}</small><p>${esc(j.text)}</p>`;
  if (j.kind === 'choix' && j.resolved) s += `<p class="avpath">${j.steps ? j.steps.map(x => `« ${esc(x.a)} »`).join(' › ') : ''}</p><p class="avout">${esc(j.outcome || '')}</p>${avChips(j.chips)}`;
  else if (j.resolved && j.outcome) s += `<p class="avout">${esc(j.outcome)}</p>`;
  const it = (j.items || []).slice(0, 3);
  if (it.length) s += `<span class="avits">${it.map(x => `<span class="avit" title="${esc(x.name)}">${itemIcon(x)}</span>`).join('')}</span>`;
  return s + `</div>`;
}
function avNeedLabel(opt, k) { return opt.h ? avTxt(opt.h, k) : ''; }
function avAsk(t, j, i) {
  const k = t.comp;
  if (j.kind === 'choix' && j.sc) {
    const node = avNode(j); if (!node) return '';
    let s = `<div class="avask"><p class="avq1">${esc(j.path && j.path.length ? (j.q || avTxt(node.q, k)) : j.text)}</p>`;
    if (j.steps && j.steps.length) s = `<div class="avask"><p class="avpath">${j.steps.map(x => `« ${esc(x.a)} »`).join(' › ')}</p><p class="avq1">${esc(j.q || avTxt(node.q, k))}</p>`;
    s += `<div class="avopts">${node.o.map((o, oi) => { const ok = avNeedOk(k, o.need, t), lb = avNeedLabel(o, k); return `<button data-av-ch="${i}" data-o="${oi}" ${ok ? '' : 'disabled'} class="${o.need ? 'sp' : ''}">${esc(avTxt(o.a, k))}${o.need ? `<small>${ok ? '✓ ' + esc(lb) : 'Il faudrait : ' + esc(lb)}</small>` : o.p != null ? `<small>Risqué</small>` : ''}</button>`; }).join('')}</div>`;
    return s + `<p class="small">Sans réponse, ${esc(CHARS[k].name)} décidera seul${typeof compE === 'function' ? compE(k) : ''} au retour.</p></div>`;
  }
  if (j.kind === 'sauvage') return avTameHTML(t, j, i);
  // autres événements (rencontre, marchand, aide) : la carte du journal habituelle
  try { return `<div class="avask avold">${journalEntry(t, j, i)}</div>`; } catch (e) { return ''; }
}
// ---------------- la rencontre vécue ----------------
const AV_MOODS = { timide: 'Il se cache à moitié derrière un buisson et tremble un peu.', joueur: 'Il remue la queue et sautille sur place, l’œil pétillant.', gourmand: 'Son ventre gargouille si fort qu’on l’entend d’ici.' };
const AV_HOW = [['doux', 'Approcher doucement'], ['jeu', 'Jouer avec lui'], ['attendre', 'Attendre sans bouger']];
const AV_HOW_BONUS = { timide: { doux: 0.18, jeu: -0.12, attendre: 0.12 }, joueur: { doux: 0.04, jeu: 0.2, attendre: -0.06 }, gourmand: { doux: 0.06, jeu: 0, attendre: 0.1 } };
function avWildMood(j) { if (!j.avMood) j.avMood = pick(Object.keys(AV_MOODS)); return j.avMood; }
function avTameHTML(t, j, i) {
  const k = t.comp, mood = avWildMood(j), nm = nsLow(j.sp);
  let s = `<div class="avask avtame"><p class="avq1">${esc(j.text)}</p><p class="avmood">${esc(AV_MOODS[mood])}</p>`;
  if (!nsRoomFor(j.sp)) return s + `<p class="small">${esc(nsRoomText(j.sp))}</p><div class="avopts"><button data-av-tame="${i}" data-go="leave">Le laisser partir</button></div></div>`;
  const offs = nsTameOffers(t, j);
  s += `<b class="avlbl">1. Que lui offrir ?</b><div class="avopts row">${offs.map(o => `<button data-av-off="${o.src}:${o.it.id}" aria-pressed="${avPick.id === o.it.id}"><span class="avoi">${itemIcon(o.it)}</span>${esc(o.it.name)}<small>${o.src === 'bait' ? 'votre appât' : nsBaitPower(o.it, j.sp) > 0 ? 'il adore ça' : 'à grignoter'}</small></button>`).join('')}<button data-av-off="pet:" aria-pressed="${avPick.src === 'pet'}">Une caresse<small>rien à offrir</small></button></div>`;
  if (!offs.length) s += `<p class="small">Il aime : ${esc(NS_BAIT_HINT[j.sp] || 'les bonnes choses')}. Emportez un appât la prochaine fois !</p>`;
  s += `<b class="avlbl">2. Comment approcher ?</b><div class="avopts row">${AV_HOW.map(([id, l]) => `<button data-av-how="${id}" aria-pressed="${avPick.how === id}">${l}</button>`).join('')}</div>`;
  s += `<div class="avopts"><button class="go" data-av-tame="${i}" data-go="try" ${avPick.src && avPick.how ? '' : 'disabled'}>Tenter l’approche</button><button data-av-tame="${i}" data-go="leave">Laisser le ${esc(nm)} tranquille</button></div></div>`;
  return s;
}
function avTry(t, i, leave) {
  const j = t.journal[i]; if (!j || j.resolved) return;
  if (leave) { nsResolveTame(t, j, 'leave', null, false); save(); avRender(true); return; }
  const mood = avWildMood(j);
  let bonus = (AV_HOW_BONUS[mood] || {})[avPick.how] || 0;
  const it = avPick.src === 'bag' ? t.bag.find(x => x.id === avPick.id) : avPick.src === 'inv' ? S.inv.find(x => x.id === avPick.id) : avPick.src === 'bait' && t.bait ? t.bait.item : null;
  if (mood === 'gourmand' && it && it.cat === 'n') bonus += 0.1;
  j.avBonus = bonus; j.avHow = avPick.how;
  nsResolveTame(t, j, avPick.src === 'pet' ? 'pet' : avPick.src, avPick.id, false);
  const ok = !!j.tamed;
  t.avLog = t.avLog || [];
  t.avLog.push({ a: `Rencontre : ${AV_HOW.find(x => x[0] === avPick.how)[1].toLowerCase()}`, t: j.outcome, chips: ok ? [['friend', `${CHARS[j.tamed].name} suit ${CHARS[t.comp].name}`]] : [], place: j.place, tamed: j.tamed || null });
  save();
  avPick = { src: null, id: null, how: null };
  const w = $('avWild'), reduce = typeof reduceMotion === 'function' && reduceMotion();
  if (w && !reduce) {
    avBusy = Date.now() + 2900;
    w.className = 'avwild hesit';
    clearTimeout(avAnim);
    avAnim = setTimeout(() => { w.className = 'avwild ' + (ok ? 'love' : 'flee'); if (ok) w.insertAdjacentHTML('beforeend', '<span class="avhearts"><i>♥</i><i>♥</i><i>♥</i></span>'); const im = w.querySelector('img'); if (im) im.src = nsPortrait(j.sp, j.genes, null, ok ? 'amour' : 'boude'); avAnim = setTimeout(() => { avBusy = 0; avAnim = null; avRender(true); }, 1700); }, 1100);
    const box = $('avView').querySelector('.avstory'); if (box) box.innerHTML = `<p class="avnext">${esc(avTxt(ok ? '{n} tend la patte… le silence… et…' : '{n} tend la patte… le silence… et…', t.comp))}<span class="avdots"><i></i><i></i><i></i></span></p>`;
  } else avRender(true);
}

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const tg = ev.target;
  // entrées : compagnon en route, fil du voyage, carte d'action (sauf pendant le tutoriel, qui a son propre chemin)
  const wk = tg.closest && tg.closest('.ovm.walker');
  const lv = tg.closest && tg.closest('[data-live]');
  const ac = tg.closest && tg.closest('#tripCard [data-act="choose"], #tripCard [data-act="journal"]');
  const av = tg.closest && tg.closest('.ovm.avpin');
  if (av) { ev.stopPropagation(); ev.preventDefault(); avGoPlace(av.dataset.avp); return; }
  const k = wk ? wk.dataset.comp : lv ? lv.dataset.lk : ac ? ac.dataset.k : null;
  if (k && (!lv || lv.dataset.live !== 'collect')) {
    const t = S.trips[k];
    if (t && !t.done && !avTuto(t)) { ev.stopPropagation(); ev.preventDefault(); if ($('modal')) $('modal').hidden = true; avOpen(k); }
  }
}, true);
document.addEventListener('click', ev => {
  const el = ev.target.closest && ev.target.closest('button'); if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.avOpen) { if (typeof closeSheet === 'function' && tab !== 'carte') closeSheet(); avOpen(d.avOpen); return; }
  if (!el.closest('#avView')) return;
  const k = avK, t = k && S.trips[k];
  if (d.avClose) return avClose();
  if (d.avJournal) { avClose(); if (typeof liveOpenJournal === 'function') liveOpenJournal(k, true); else openSheet('voyage'); return; }
  if (d.avCollect) { avClose(); S.sel = d.avCollect; collect(); return; }
  if (!t) return;
  if (d.avCh != null) {
    const j = t.journal[+d.avCh];
    const r = avChoose(t, j, +d.o, false); S.stats.choices = (S.stats.choices || 0) + 1;
    avSig = ''; avRender(false);
    const me = $('avView') && $('avView').querySelector('.avme');
    if (me && r === 'done' && !(typeof reduceMotion === 'function' && reduceMotion())) { me.src = portraitURI(k, (j.chips || []).some(c => c[0] === 'hurt') ? 'boude' : 'rire'); me.classList.add('hop'); avBusy = Date.now() + 1300; setTimeout(() => { me.classList.remove('hop'); avBusy = 0; avStageKey = ''; avRender(true); }, 1400); }
    return;
  }
  if (d.avOff != null) { const [src, id] = d.avOff.split(':'); avPick.src = src; avPick.id = id || null; avRender(); return; }
  if (d.avHow) { avPick.how = d.avHow; avRender(); return; }
  if (d.avTame != null) { avTry(t, +d.avTame, d.go === 'leave'); return; }
  // anciennes cartes (rencontre, marchand, aide) : traitées par 10_ui.js, puis on rafraîchit la scène
  setTimeout(() => avRender(true), 30);
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && avK) avClose(); });
setInterval(() => { try { if (avK) { const t = S.trips[avK]; if (!t) return avClose(); avRender(false); } } catch (e) { console.error(e); } }, 1000);

// ---------------- journal (panneau) : scènes en plusieurs temps ----------------
journalEntry = (orig => function (t, j, i) {
  if (!j || j.kind !== 'choix' || !j.sc) return orig.apply(this, arguments);
  try {
    const k = t.comp, time = new Date(j.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    let h = `<article class="je k-choix"><header><span>${time}${j.place ? ' · ' + esc(j.place) : ''}</span>${j.pending && !j.resolved ? '<em class="need">À toi de choisir</em>' : ''}</header><p>${esc(j.text)}</p>`;
    if (j.steps && j.steps.length) h += `<p class="avpath">${j.steps.map(x => `« ${esc(x.a)} »`).join(' › ')}</p>`;
    if (!j.resolved) {
      const node = avNode(j);
      if (node) {
        if (j.path && j.path.length) h += `<p>${esc(j.q || avTxt(node.q, k))}</p>`;
        h += `<div class="opts">${node.o.map((o, oi) => { const ok = avNeedOk(k, o.need, t); return `<button data-choice="${i}" data-o="${oi}" ${ok ? '' : 'disabled'}>${esc(avTxt(o.a, k))}${o.need ? ` <small>(${ok ? '' : 'il faudrait : '}${esc(avNeedLabel(o, k))})</small>` : ''}</button>`; }).join('')}</div>`;
        if (!t.done && !avTuto(t)) h += `<button class="btn cream sm" data-av-open="${k}">Voir la scène avec ${esc(CHARS[k].name)}</button>`;
        h += `<p class="small">Chaque choix compte : lieu caché, objet rare, ami, rumeur… ou petite chute. Sans réponse, ${esc(CHARS[k].name)} décidera seul${compE(k)} au retour.</p>`;
      }
    } else h += `<p class="out">${esc(j.outcome || '')}</p>${avChips(j.chips)}`;
    if (j.photo) h += `<figure class="pc">${postcardSVG(j.photo, 'j' + i + t.id)}</figure>`;
    const items = j.items || []; if (items.length) h += `<div class="items">${items.map(itemChip).join('')}</div>`;
    return h + `</article>`;
  } catch (e) { console.error(e); return orig.apply(this, arguments); }
})(journalEntry);
// panneau de voyage : un bouton pour rejoindre le compagnon
renderVoyage = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    const t = S.trips[S.sel];
    if (t && !t.done && box && !avTuto(t) && !box.querySelector('.avjoin')) {
      const html = `<button class="avjoin" data-av-open="${S.sel}"><span>${avTxt('Voir ce que {n} voit', S.sel)}</span><small>Suivez l’aventure en direct, et choisissez avec ${esc(CHARS[S.sel].name)}.</small></button>`;
      const j = box.querySelector('.journal'); if (j) j.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
    }
  } catch (e) { console.error(e); }
  return r;
})(renderVoyage);

// ---------------- retour : l'œuf du nid et les moments forts ----------------
GAME.on('trip:return', e => {
  try {
    const t = e && e.trip; if (!t || !t.avEgg || typeof nsAddEgg !== 'function') return;
    const N = nsState(), x = t.avEgg, R = nsRegionOf(t.dest);
    N.found++; N.seen[x.sp] = 1;
    const egg = nsAddEgg({ sp: x.sp, genes: x.genes, rarity: x.rarity, from: { how: 'oeuf', region: R ? R.id : null, place: t.dest.name }, ms: nsHatchMs(x.rarity) });
    t.avEgg = null; save();
    const m = $('modal'), box = m && !m.hidden && m.querySelector('.mbox');
    if (egg && box && box.querySelector('.haul')) { const btn = box.querySelector('button[data-closemodal]'); const html = `<p class="avnest">Le nid caché sous les racines… ${esc(CHARS[e.who] ? CHARS[e.who].name : '')} a ramené l’œuf bien au chaud.</p>` + nsEggFoundHTML(egg); if (btn) btn.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
    else if (egg) toast(`${nsEggLabel(egg)} ramené du voyage ! Il est à la nurserie.`);
  } catch (err) { console.error('aventure retour', err); }
});
function avRecapHTML(h) {
  const t = h.trip; if (!t) return '';
  const log = (t.avLog || []).slice(-6), k = h.comp, n = CHARS[k] ? CHARS[k].name : '';
  if (!log.length && !t.avHurt) return '';
  let s = `<div class="avrecap"><h3>Les moments forts du voyage</h3>`;
  s += log.map(l => `<div class="avrm">${l.tamed && S.comps[l.tamed] ? `<img src="${portraitURI(l.tamed, 'amour')}" alt="">` : ''}<div><b>${esc(l.a)}</b>${l.auto ? ' <small>(décidé tout seul)</small>' : ''}<p>${esc(l.t)}</p>${avChips(l.chips)}${l.tamed && S.comps[l.tamed] ? `<p class="avfollow">${esc(CHARS[l.tamed].name)} a suivi ${esc(n)} jusqu’à la maison et s’installe au refuge !</p>` : ''}</div></div>`).join('');
  if (t.avHurt) s += `<p class="avhurt"><img src="${portraitURI(k, 'dodo')}" alt="">${esc(avTxt('{n} est rentré{e} un peu fatigué{e} : un pansement, un câlin et au lit !', k))}</p>`;
  return s + `</div>`;
}
if (typeof showHaul === 'function') showHaul = (orig => function (h) {
  const r = orig.apply(this, arguments);
  try {
    const html = avRecapHTML(h), m = $('modal'), box = m && m.querySelector('.mbox');
    if (html && box) { const hd = box.querySelector('.haul'); if (hd) hd.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html); }
  } catch (e) { console.error(e); }
  return r;
})(showHaul);

// ---------------- styles ----------------
(function avCSS() {
  const st = document.createElement('style'); st.id = 'avCSS';
  st.textContent = `
.avv{position:fixed;inset:0;z-index:80;background:rgba(58,42,32,.45);display:flex;align-items:center;justify-content:center}
.avv[hidden]{display:none}
.avbox{width:min(560px,100%);height:min(860px,100%);background:#fff8ea;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;border:3px solid #4a3528;box-shadow:0 8px 0 rgba(74,53,40,.35)}
@media (max-width:600px){.avbox{border-radius:0;border:0;height:100%}}
.avh{display:flex;align-items:center;gap:10px;padding:10px 12px 6px}
.avh img{width:44px;height:48px;object-fit:contain;background:#ffe9cf;border-radius:50%;border:2px solid #4a3528}
.avh div{flex:1;min-width:0;display:flex;flex-direction:column}
.avh b{font:800 17px/1.15 var(--display);color:#4a3528;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.avh span{font-size:12.5px;color:#8a7258}
.avx{width:40px;height:40px;border-radius:50%;border:2.5px solid #4a3528;background:#fff;font:800 24px/1 var(--display);color:#4a3528;cursor:pointer;box-shadow:0 3px 0 rgba(74,53,40,.3)}
.avph{display:flex;align-items:center;gap:6px;padding:0 12px 8px;font:700 13px var(--display);color:#b9a58a;flex-wrap:wrap}
.avph i{font-style:normal;padding:2px 9px;border-radius:999px;border:2px solid transparent}
.avph i.past{color:#7a9a6a}
.avph i.on{background:#e6f6e9;border-color:#2f7f6c;color:#2f6f5c}
.avph b{color:#d8c8ae}
.avph span{margin-left:auto;color:#6b5440;font-variant-numeric:tabular-nums}
.avstage{position:relative;height:min(36vh,300px);min-height:200px;overflow:hidden;border-top:3px solid #4a3528;border-bottom:3px solid #4a3528;flex:none;contain:strict}
.avl{position:absolute;inset:0}
.avl svg{display:block;width:100%;height:100%}
.avt{position:absolute;top:0;left:0;height:100%;width:200%;display:flex;will-change:transform}
.avt svg{width:50%;height:100%;flex:none}
.avstage.mv .avfar .avt{animation:avScroll 70s linear infinite}
.avstage.mv .avmid .avt{animation:avScroll 26s linear infinite}
.avstage.mv .avnear .avt{animation:avScroll 9s linear infinite}
.avstage.still .avt{animation:avScroll 120s linear infinite;animation-play-state:paused}
.avstage.rev .avt{animation-direction:reverse}
@keyframes avScroll{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
.avme{position:absolute;left:30%;bottom:6%;height:44%;transform-origin:50% 100%}
.avstage.mv .avme{animation:avWalk .55s ease-in-out infinite alternate}
.avstage.still .avme{animation:avIdle 2.6s ease-in-out infinite}
.avstage.rev .avme{transform:scaleX(-1)}
.avme.hop{animation:avHop .5s ease-out 2!important}
@keyframes avWalk{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-6%) rotate(3deg)}}
@keyframes avIdle{50%{transform:translateY(-2%) scale(1.02,.98)}}
@keyframes avHop{50%{transform:translateY(-22%)}}
.avfol{position:absolute;bottom:6%;height:30%;animation:avWalk .5s ease-in-out infinite alternate}
.avstage.still .avfol{animation:avIdle 2.2s ease-in-out infinite}
.avwild{position:absolute;right:8%;bottom:5%;height:38%;width:30%;transition:transform 1s ease,opacity 1s ease}
.avwild img{position:absolute;bottom:0;left:50%;height:100%;transform:translateX(-50%)}
.avwild .avbush{position:absolute;bottom:-4%;left:-6%;width:112%;height:55%}
.avwild .avq{position:absolute;top:-6%;right:8%;width:24px;height:24px;border-radius:50%;background:#f08aa6;color:#fff;font:800 16px/24px var(--display);text-align:center;font-style:normal;border:2px solid #4a3528}
.avwild.wary img{animation:avPeek 1.8s ease-in-out infinite}
@keyframes avPeek{0%,100%{transform:translateX(-50%) translateY(18%)}50%{transform:translateX(-56%) translateY(4%)}}
.avwild.hesit{transform:translateX(-30%)}
.avwild.hesit img{animation:avShy .35s ease-in-out infinite alternate}
@keyframes avShy{from{transform:translateX(-54%) rotate(-4deg)}to{transform:translateX(-46%) rotate(4deg)}}
.avwild.hesit .avq{animation:pulse .4s infinite alternate}
.avwild.love{transform:translateX(-55%)}
.avwild.love .avbush,.avwild.love .avq,.avwild.flee .avq{opacity:0;transition:opacity .4s}
.avwild.love img{animation:avHop .5s ease-out 3}
.avwild.flee{transform:translateX(160%);opacity:0}
.avhearts{position:absolute;left:30%;top:0}
.avhearts i{position:absolute;font-style:normal;color:#f06a8e;font-size:26px;animation:avHeart 1.6s ease-out forwards;text-shadow:0 2px 0 #fff}
.avhearts i:nth-child(2){left:22px;animation-delay:.2s}.avhearts i:nth-child(3){left:-18px;animation-delay:.4s}
@keyframes avHeart{from{transform:translateY(0) scale(.5);opacity:1}to{transform:translateY(-70px) scale(1.2);opacity:0}}
.avwx.pluie{background:repeating-linear-gradient(105deg,transparent 0 13px,rgba(255,255,255,.5) 13px 14.5px);background-size:200px 200px;animation:avRain .5s linear infinite;opacity:.75}
@keyframes avRain{to{background-position:-40px 200px}}
.avwx.neige{background-image:radial-gradient(circle,#fff 0 2px,transparent 2.5px),radial-gradient(circle,#fff 0 1.4px,transparent 2px);background-size:60px 60px,37px 37px;animation:avSnow 6s linear infinite}
@keyframes avSnow{to{background-position:30px 240px,-20px 240px}}
.avtw{animation:avTw 2.4s ease-in-out infinite alternate}
@keyframes avTw{from{opacity:.25}to{opacity:1}}
.avff{animation:avTw 1.3s ease-in-out infinite alternate}
.avstory{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}
.avln{background:#fffdf7;border:1px solid #eadfca;border-radius:14px;padding:8px 11px}
.avln.pop{animation:avIn .5s ease-out}
@keyframes avIn{from{opacity:0;transform:translateY(8px)}}
.avln small{font:600 11.5px var(--display);color:#a08a6c}
.avln p,.avask .avq1,.avnext{margin:2px 0 0;font-family:var(--hand);font-size:20px;line-height:1.15;color:#3f342c}
.avpath{margin:4px 0 0;font:700 12.5px var(--display);color:#b0703a}
.avout{margin:4px 0 0!important;font:14px/1.4 var(--body)!important;color:#5b4636!important}
.avits{display:flex;gap:6px;margin-top:6px}.avit{width:30px;height:30px;display:inline-flex}.avit svg{width:100%;height:100%}
.avchips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.avc{font-style:normal;font:700 12px/1 var(--display);padding:5px 8px;border-radius:999px;background:#f3ead8;color:#5b4636;border:1.5px solid #e0cfae}
.avc.c-place{background:#fff1c9;border-color:#e9a83a}.avc.c-rumor{background:#f6e9cc;border-color:#c9a97a}.avc.c-friend,.avc.c-egg{background:#ffe3ec;border-color:#f08aa6}.avc.c-hurt,.avc.c-slow{background:#fde5df;border-color:#e09a8a}.avc.c-fast,.avc.c-back{background:#e3f4ea;border-color:#7fbf9a}.avc.c-rare{background:#ede4fb;border-color:#a98ad9}.avc.c-rep{background:#e6f1fb;border-color:#8fb0d8}
.avask{background:#fff3d6;border:2.5px solid #e7b95a;border-radius:16px;padding:10px 12px;box-shadow:0 3px 0 rgba(200,150,60,.25)}
.avask.avold{background:none;border:0;padding:0;box-shadow:none}
.avopts{display:flex;flex-direction:column;gap:7px;margin-top:8px}
.avopts.row{flex-direction:row;flex-wrap:wrap}
.avopts button{font:700 15px/1.2 var(--display);color:#4a3528;background:#fff;border:2.5px solid #4a3528;border-radius:14px;padding:9px 12px;text-align:left;cursor:pointer;box-shadow:0 3px 0 rgba(74,53,40,.3);display:flex;flex-direction:column;gap:2px;min-height:44px;justify-content:center}
.avopts.row button{flex:1 1 30%;align-items:center;text-align:center;font-size:13.5px;padding:7px 8px}
.avopts button small{font:600 11.5px var(--body);color:#8a7258}
.avopts button.sp{background:#eef8ef;border-color:#2f7f6c}
.avopts button.sp small{color:#2f7f6c}
.avopts button:disabled{opacity:.55;background:#f4efe6;border-style:dashed;cursor:default;box-shadow:none}
.avopts button:disabled small{color:#a05a4a}
.avopts button[aria-pressed="true"]{background:#ffe3ec;border-color:#d9607e;box-shadow:0 3px 0 #d9607e}
.avopts button.go{background:#7fcf8f;color:#fff;text-shadow:0 1px 0 #2f6f5c;align-items:center;font-size:17px}
.avopts button.go:disabled{background:#cfe8d4;color:#6f8f78;text-shadow:none}
.avoi{width:30px;height:30px;display:inline-flex}.avoi svg{width:100%;height:100%}
.avlbl{display:block;margin-top:10px;font:800 13px var(--display);color:#8a5a2a}
.avmood{margin:4px 0 0;font:italic 14px var(--body);color:#7a5a40}
.avnext{color:#8a7258!important;font-size:18px!important}
.avdots i{display:inline-block;width:5px;height:5px;margin-left:3px;border-radius:50%;background:#c9a97a;animation:avTw .6s ease-in-out infinite alternate}
.avdots i:nth-child(2){animation-delay:.2s}.avdots i:nth-child(3){animation-delay:.4s}
.avend{display:flex;justify-content:center;padding:6px}
.avf{display:flex;gap:8px;justify-content:space-between;padding:8px 12px calc(8px + env(safe-area-inset-bottom));border-top:2px solid #eadfca;background:#fff3dc}
.avjoin{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;margin:8px 0;padding:10px 14px;border-radius:16px;border:2.5px solid #2f7f6c;background:linear-gradient(90deg,#e6f6e9,#fff8ea);box-shadow:0 3px 0 rgba(47,127,108,.35);cursor:pointer;text-align:left}
.avjoin span{font:800 16px var(--display);color:#2f6f5c}.avjoin small{font-size:12.5px;color:#5b7a6a}
.avrecap{margin:8px 0;padding:10px 12px;background:#fff8e8;border:2px solid #e7c27a;border-radius:14px;text-align:left}
.avrecap h3{margin:0 0 6px;font:800 16px var(--display);color:#8a5a2a}
.avrm{display:flex;gap:8px;padding:6px 0;border-top:1px dashed #e7d3a8}
.avrm:first-of-type{border-top:0}
.avrm img{width:46px;height:50px;object-fit:contain;flex:none}
.avrm b{font:700 13.5px var(--display);color:#b0703a}
.avrm p{margin:2px 0 0;font-size:13.5px;line-height:1.35;color:#5b4636}
.avfollow{color:#d9607e!important;font-weight:700}
.avhurt{display:flex;align-items:center;gap:8px;margin:6px 0 0;font-size:13.5px;color:#a05a4a}.avhurt img{width:40px;height:44px}
.avnest{margin:8px 0 2px;font-family:var(--hand);font-size:20px;color:#5b4636}
.avpin .pinb svg path{fill:#fff}
.avpin .pinl{background:#fff1c9}
body.avopen #liveBar{visibility:hidden}
@media (prefers-reduced-motion: reduce){.avt,.avme,.avfol,.avwx,.avtw,.avff{animation:none!important}}
`;
  document.head.appendChild(st);
})();

// ---------------- tests ----------------
window.__av = {
  open: avOpen, close: avClose, scenes: AV_SCENES, state: avState, force: o => { Object.assign(AV_FORCE, o || {}); avStageKey = ''; avRender(true); },
  choose: avChoose, auto: avAuto, needOk: avNeedOk, biome: avBiome,
};

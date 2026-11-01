// ================= LE FOYER (v17, vague 2) =================
// Remplace refuge, habitats et maison par une petite maison en coupe, vivante et cosy :
// - LA SCÈNE : le salon + les pièces à thème (anciens habitats, même capacité : 21_nurserie.js) + la chambre des petits
//   (nid douillet = couveuse, panier double = enclos). Les compagnons s'y promènent, jouent, dorment (heure réelle).
// - S'OCCUPER : toucher un compagnon → nourrir (goût par espèce), câliner/jouer, habiller, faire progresser (addXP).
//   Jauges en pictogrammes : bonheur (cœurs) et forme (éclairs), état dans S.foyer.c.
// - EFFETS : compagnon heureux et reposé → plus de chance en voyage ; fatigué → moins (enveloppe startTrip et lootFor).
// - MEUBLES : posés dans les emplacements de S.house (mêmes clés qu'avant : anciennes sauvegardes intactes), chacun
//   a un effet (FY_EFF). Nouvelles recettes : coussin, gamelle dorée, carte murale.
// - ATELIER : enveloppe renderAtelier (aperçu visuel + utilité en une ligne, tri par utilité).
// - NAVIGATION : Village → « Foyer » (sous-onglets Foyer · Atelier · Nurserie) ; les anciens noms restent valables.
// Enveloppe : renderVillageTab, renderAtelier, startTrip, lootFor, decorArt, subDot. Expose window.__foyer (tests).

// ---------------- état ----------------
function fyState() {
  if (!S.foyer || typeof S.foyer !== 'object') S.foyer = {};
  const F = S.foyer;
  if (!F.c || typeof F.c !== 'object') F.c = {};
  if (!S.house || typeof S.house !== 'object') S.house = {};
  return F;
}
const fyClamp = v => Math.max(0, Math.min(100, v));
const fyNow = () => Date.now() + ((window.__foyer && window.__foyer.skew) || 0);
function fyHour() { const o = window.__foyer && window.__foyer.hour; return o != null ? o : new Date().getHours(); }
function fyPhase() { const h = fyHour(); return h >= 7 && h < 18 ? 'day' : (h >= 18 && h < 21) || h === 6 ? 'eve' : 'night'; }

// ---------------- meubles : effets ----------------
const FY_IC = {
  heart: '<path d="M12 21 C5 15.5 2.5 12 2.5 8.6 A4.8 4.8 0 0 1 12 6.4 A4.8 4.8 0 0 1 21.5 8.6 C21.5 12 19 15.5 12 21Z"/>',
  bolt: '<path d="M13.5 2 L4.5 13.5 H11 L9.5 22 L19.5 9.5 H13Z"/>',
  bowl: '<path d="M2.5 11.5 H21.5 A9.5 8 0 0 1 2.5 11.5Z"/><path d="M8 9 q1.5-2.5 0-5 M12 9 q1.5-2.5 0-5 M16 9 q1.5-2.5 0-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  paw: '<ellipse cx="12" cy="16" rx="5.2" ry="4.4"/><circle cx="5.6" cy="10.5" r="2.3"/><circle cx="9.5" cy="6.4" r="2.3"/><circle cx="14.5" cy="6.4" r="2.3"/><circle cx="18.4" cy="10.5" r="2.3"/>',
  hanger: '<path d="M12 8 V6.8 a2.3 2.3 0 1 0 -2.3 -2.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 8.5 L2.5 17.5 H21.5Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 17.5 L5 21 H19 L18 17.5" opacity=".55"/>',
  star: '<path d="M12 2 l2.9 6.2 6.6.7 -5 4.5 1.4 6.6 -5.9-3.4 -5.9 3.4 1.4-6.6 -5-4.5 6.6-.7Z"/>',
  sofa: '<path d="M2.5 11 a2 2 0 0 1 4 0 V14 H17.5 V11 a2 2 0 0 1 4 0 V19 H2.5Z"/><path d="M5.5 10 V7.5 a2 2 0 0 1 2-2 H16.5 a2 2 0 0 1 2 2 V10" fill="none" stroke="currentColor" stroke-width="2"/>',
  house: '<path d="M3 11 L12 3.5 L21 11 V21 H3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10 V18 M8 14 H16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  rest: '<rect x="2.5" y="8" width="19" height="10" rx="5"/><path d="M15 3 h4 l-4 4 h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  moon: '<path d="M15.5 3 A9 9 0 1 0 21 15.5 A7.2 7.2 0 0 1 15.5 3Z"/>',
  map: '<path d="M2.5 6 L8.5 3.5 L15.5 6 L21.5 3.5 V18 L15.5 20.5 L8.5 18 L2.5 20.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 3.5 V18 M15.5 6 V20.5" stroke="currentColor" stroke-width="1.6"/>',
  clover: '<circle cx="8.5" cy="8.5" r="4"/><circle cx="15.5" cy="8.5" r="4"/><circle cx="8.5" cy="15.5" r="4"/><circle cx="15.5" cy="15.5" r="4"/>',
  hug: '<path d="M8 17 C3.5 13.5 2 11 2 8.8 A3.2 3.2 0 0 1 8 7.4 A3.2 3.2 0 0 1 14 8.8 C14 11 12.5 13.5 8 17Z"/><path d="M16.5 21 C13 18.3 12 16.5 12 14.8 A2.5 2.5 0 0 1 16.5 13.8 A2.5 2.5 0 0 1 21 14.8 C21 16.5 20 18.3 16.5 21Z" opacity=".7"/>',
  xp: '<path d="M12 3 L20 11 H15 V21 H9 V11 H4Z"/>',
  back: '<path d="M15 4 L7 12 L15 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1.5 V4.5 M12 19.5 V22.5 M1.5 12 H4.5 M19.5 12 H22.5 M4.6 4.6 L6.7 6.7 M17.3 17.3 L19.4 19.4 M4.6 19.4 L6.7 17.3 M17.3 6.7 L19.4 4.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  egg: '<path d="M12 2.5 C17 2.5 20 10 20 14 C20 19 16.5 21.5 12 21.5 C7.5 21.5 4 19 4 14 C4 10 7 2.5 12 2.5Z"/>',
  sad: '<path d="M6 13 a5 4 0 0 1 2-7.5 a5.5 5 0 0 1 9 1 a4 3.6 0 0 1 1 6.5Z"/><path d="M8 16 v2.5 M12 16 v3.5 M16 16 v2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
const fyIco = (n, cls = '') => `<svg class="fyi ${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${FY_IC[n] || ''}</svg>`;
// type d'effet → [icône, plafond]
const FY_KIND = { rest: ['rest', 0.8], night: ['moon', 0.6], joy: ['heart', 0.7], meal: ['bowl', 1], hug: ['hug', 1], trip: ['map', 0.15], xp: ['xp', 1] };
// sous-type de décoration → [effet, valeur, texte court]
const FY_EFF = {
  coussin: ['rest', 0.2, '+20 % de repos'], tapis: ['rest', 0.1, '+10 % de repos'], cheminee: ['joy', 0.3, 'bonheur qui dure (+30 %)'],
  plante: ['joy', 0.2, 'bonheur qui dure (+20 %)'], herbier: ['joy', 0.15, 'bonheur qui dure (+15 %)'],
  lampe: ['night', 0.3, '+30 % de forme la nuit'], lanterne: ['night', 0.3, '+30 % de forme la nuit'],
  gamelle: ['meal', 0.5, '+50 % de bonheur au repas'], bocal: ['hug', 0.5, '+50 % aux câlins'],
  mappemonde: ['trip', 0.04, 'voyages 4 % plus courts'], cartemur: ['trip', 0.06, 'voyages 6 % plus courts'],
  statue: ['xp', 0, 'trophée : + d’expérience (confort)'],
};
const FY_PHOTO_EFF = ['joy', 0.1, 'souvenir : bonheur qui dure (+10 %)'];
function fyEffOf(v) { if (!v) return null; if (v.photo) return FY_PHOTO_EFF; if (v.item && v.item.cat === 'd') return FY_EFF[v.item.sub] || null; return v.item ? ['xp', 0, '+ de confort (expérience)'] : null; }
function fyMods() {
  const m = { rest: 0, night: 0, joy: 0, meal: 0, hug: 0, trip: 0, xp: 0 };
  for (const v of Object.values(fyState() && S.house)) { const e = fyEffOf(v); if (e) m[e[0]] += e[1]; }
  for (const k in m) m[k] = Math.min(FY_KIND[k][1], m[k]);
  return m;
}
// nouvelles décorations utiles (recettes de l'atelier)
if (typeof PLACEMENT !== 'undefined') Object.assign(PLACEMENT, { coussin: 'floor', gamelle: 'floor', cartemur: 'wall' });
if (typeof RECIPES !== 'undefined' && !RECIPES.some(r => r.id === 'coussin')) RECIPES.push(
  { id: 'coussin', kind: 'Décoration', out: ['Coussin moelleux', 'd', 'coussin', 1, null, '#f3aec1'], ing: [['laine', 2], ['plume', 1]], coins: 5 },
  { id: 'gamelle', kind: 'Décoration', out: ['Gamelle dorée', 'd', 'gamelle', 2, null, '#f2c14e'], ing: [['pierre', 2], ['lumiere', 1]], coins: 20 },
  { id: 'cartemur', kind: 'Décoration', out: ['Carte murale', 'd', 'cartemur', 2, null, '#e9d8b0'], ing: [['papier', 2], ['feuille', 1]], coins: 10 });
if (typeof decorArt === 'function') decorArt = (orig => function (kind, c, L = '#5b4636') {
  if (kind === 'coussin') return `<ellipse cx="50" cy="94" rx="40" ry="5" fill="#3d2a1a" opacity=".15"/><path d="M12 66 Q50 44 88 66 Q94 84 86 92 Q50 100 14 92 Q6 84 12 66Z" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M26 74 Q50 64 74 74" fill="none" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/><circle cx="50" cy="78" r="3" fill="${L}" opacity=".5"/>`;
  if (kind === 'gamelle') return `<ellipse cx="50" cy="94" rx="36" ry="5" fill="#3d2a1a" opacity=".15"/><path d="M16 70 H84 L76 92 H24Z" fill="${c}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="50" cy="70" rx="34" ry="7" fill="#fff3c9" stroke="${L}" stroke-width="2.4"/><circle cx="40" cy="68" r="5" fill="#d9893e"/><circle cx="52" cy="66" r="5" fill="#e0604f"/><circle cx="61" cy="69" r="4" fill="#8fbf6a"/><path d="M30 80 l3 3 3-3 M64 80 l3 3 3-3" stroke="#fff" stroke-width="2" fill="none"/>`;
  if (kind === 'cartemur') return `<rect x="8" y="16" width="84" height="64" rx="3" fill="#a87a50" stroke="${L}" stroke-width="2.4"/><rect x="14" y="22" width="72" height="52" fill="${c}"/><path d="M20 40 q8-10 16-2 q6 6 4 14 q-8 6-14 0Z M50 30 q12-6 22 2 q6 10-2 16 q-10 4-14-4 q-8-6-6-14Z" fill="#9cc38a" stroke="${L}" stroke-width="1.4"/><path d="M28 60 q16-8 30 2 q8 6 18-4" fill="none" stroke="#e0604f" stroke-width="2" stroke-dasharray="4 3"/><circle cx="76" cy="58" r="3" fill="#e0604f"/>`;
  return orig.apply(this, arguments);
})(decorArt);

// ---------------- bonheur et forme ----------------
const FY_LOVED = sp => (typeof nsHabOf === 'function' ? nsHabOf(sp) : null);
function fyLovesHome(k) { const h = S.comps && S.comps[k] ? FY_LOVED(S.comps[k].sp) : null; return !!(h && nsHabLvl(h) > 0); }
// état d'un compagnon, mis à jour avec le temps écoulé (repos à la maison, bonheur qui baisse doucement)
function fyC(k) {
  const F = fyState(), now = fyNow();
  let c = F.c[k];
  if (!c || typeof c !== 'object') c = F.c[k] = { joy: 70, nrg: 85, t: now };
  if (!isFinite(c.joy)) c.joy = 70; if (!isFinite(c.nrg)) c.nrg = 85; if (!isFinite(c.t)) c.t = now;
  const h = Math.max(0, Math.min(48, (now - c.t) / 3600e3));
  if (h > 0.003) {
    if (!(S.trips && S.trips[k])) {
      const m = fyMods(), night = fyPhase() === 'night';
      c.nrg = fyClamp(c.nrg + h * 12 * (1 + m.rest) * (night ? 1.3 + m.night : 1));
      if (fyLovesHome(k)) c.joy = fyClamp(c.joy + h * 1.5);
      else c.joy = Math.max(Math.min(c.joy, 30), c.joy - h * 2 * (1 - m.joy));
    }
    c.t = now;
  }
  return c;
}
const fyGood = k => { const c = fyC(k); return c.joy >= 70 && c.nrg >= 60; };
const fyTired = k => fyC(k).nrg < 25;
const fyDots = (v, ic, cls) => `<span class="fy-g ${cls}" role="img" aria-label="${Math.round(v)} sur 100">${[0, 1, 2, 3, 4].map(i => fyIco(ic, v >= (i + 1) * 20 - 6 ? 'on' : v >= i * 20 + 4 ? 'half' : '')).join('')}</span>`;

// ---------------- les pièces ----------------
const FY_ROOM_NAME = { prairie: 'Salon', bambou: 'Coin bambou', bassin: 'Bassin', banquise: 'Coin neige', dune: 'Coin sable', jungle: 'Serre tropicale' };
const FY_L = '#5b4636';
const FY_ROOM_ART = {
  bambou: () => `<rect width="200" height="125" fill="#e6f1d2"/><rect y="92" width="200" height="33" fill="#cdb47c"/><path d="M0 92 H200" stroke="${FY_L}" stroke-width="2"/>${[12, 28, 170, 186].map((x, i) => `<rect x="${x}" y="${-4 + i % 2 * 8}" width="9" height="${100 - i % 2 * 8}" rx="3" fill="#7cbf6a" stroke="${FY_L}" stroke-width="1.6"/><path d="M${x} ${30 + i * 4} h9 M${x} ${60 + i * 3} h9" stroke="${FY_L}" stroke-width="1.4"/><path d="M${x + 9} ${36 + i * 4} q12 -6 16 2 q-10 4 -16 -2Z" fill="#9fd07f" stroke="${FY_L}" stroke-width="1.2"/>`).join('')}<ellipse cx="100" cy="106" rx="34" ry="7" fill="#b89a5f" opacity=".5"/>`,
  bassin: () => `<rect width="200" height="125" fill="#dceff2"/><rect y="88" width="200" height="37" fill="#cfe3c4"/><path d="M0 88 H200" stroke="${FY_L}" stroke-width="2"/><ellipse cx="100" cy="108" rx="62" ry="14" fill="#7fc3e0" stroke="${FY_L}" stroke-width="2"/><ellipse cx="90" cy="104" rx="30" ry="5" fill="#bfe6f4" opacity=".7"/><ellipse cx="70" cy="110" rx="9" ry="3.4" fill="#8fcf7f" stroke="${FY_L}" stroke-width="1.2"/><ellipse cx="128" cy="106" rx="8" ry="3" fill="#8fcf7f" stroke="${FY_L}" stroke-width="1.2"/><circle cx="130" cy="104" r="2.6" fill="#f3aec1"/><path d="M14 88 q4-20 8 0 M24 88 q3-14 6 0 M176 88 q4-22 8 0" stroke="#5fa274" stroke-width="2.4" fill="none"/>`,
  banquise: () => `<rect width="200" height="125" fill="#e8f3fb"/><path d="M0 0 H200 V6 l-6 8 -5-8 -8 10 -6-10 -10 6 -6-6 -9 9 -7-9 -12 7 -8-7 -10 10 -6-10 -12 8 -8-8 -10 6 -8-6 -9 9 -6-9 -12 8 -6-8 -10 6 -7-6 -10 7 -8-7Z" fill="#fff" stroke="#b9d6ea" stroke-width="1.2"/><rect y="90" width="200" height="35" fill="#fff"/><path d="M0 92 q30-12 60 0 t70 0 t70 0 V125 H0Z" fill="#f4fbff" stroke="#b9d6ea" stroke-width="1.6"/><ellipse cx="150" cy="110" rx="30" ry="7" fill="#a9d3ef" stroke="${FY_L}" stroke-width="1.6"/><path d="M26 70 l6 -12 6 12Z M34 74 l8 -18 8 18Z" fill="#cfe8f7" stroke="${FY_L}" stroke-width="1.4"/>`,
  dune: () => `<rect width="200" height="125" fill="#fbe9c6"/><circle cx="160" cy="28" r="12" fill="#fbd76a"/><rect y="88" width="200" height="37" fill="#efcf8e"/><path d="M0 96 q50-20 100 0 t100 -4 V125 H0Z" fill="#e8c27a" stroke="${FY_L}" stroke-width="1.6"/><path d="M28 98 V70 a5 5 0 0 1 10 0 V98 M28 82 h-6 v-8 M38 78 h6 v-8" fill="#7fbf6a" stroke="${FY_L}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="150" cy="108" rx="18" ry="4" fill="#8fd0ea" stroke="${FY_L}" stroke-width="1.4"/>`,
  jungle: () => `<rect width="200" height="125" fill="#d7edd0"/><rect y="90" width="200" height="35" fill="#a8c98a"/><path d="M0 90 H200" stroke="${FY_L}" stroke-width="2"/><path d="M0 4 q30 14 60 2 t70 6 t70 -6" fill="none" stroke="#5fa86a" stroke-width="3"/><path d="M40 8 v20 M120 12 v26 M168 6 v18" stroke="#5fa86a" stroke-width="2"/><path d="M0 60 q20-30 40-8 q-20 4-40 30Z M200 54 q-24-30-44-4 q22 2 44 28Z" fill="#5fa86a" stroke="${FY_L}" stroke-width="1.6"/><path d="M8 92 q14-26 30-4 q-16 0-30 4Z" fill="#7cbf6a" stroke="${FY_L}" stroke-width="1.4"/><circle cx="120" cy="40" r="4" fill="#f6c445" stroke="${FY_L}" stroke-width="1.2"/><circle cx="128" cy="44" r="4" fill="#f08a5a" stroke="${FY_L}" stroke-width="1.2"/>`,
  petits: () => `<rect width="200" height="125" fill="#fde9ef"/><path d="M0 0 H200 V10 H0Z" fill="#f6cdd8"/>${[20, 60, 100, 140, 180].map(x => `<path d="M${x} 10 l-6 8 h12Z" fill="${x % 40 ? '#f6c445' : '#9fd1d8'}"/>`).join('')}<rect y="90" width="200" height="35" fill="#e8cfa8"/><path d="M0 90 H200" stroke="${FY_L}" stroke-width="2"/>`,
};
// salon : fenêtre selon l'heure, étagère, parquet ; les meubles sont posés dans les emplacements de S.house (mêmes clés)
const FY_SLOTS = { w0: [24, 18, 62, 44], w1: [314, 18, 62, 44], s0: [270, 66, 26, 26], s1: [298, 66, 26, 26], s2: [326, 66, 26, 26], s3: [354, 66, 26, 26], f0: [4, 104, 58, 76], f1: [68, 112, 48, 66], f2: [252, 112, 48, 66], f3: [336, 104, 58, 76], r0: [124, 160, 152, 34] };
function fySalonBg(ph) {
  const sky = ph === 'night' ? '#2f3d6b' : ph === 'eve' ? '#f5b48f' : '#bfe1f2';
  let s = `<svg viewBox="0 0 400 200" preserveAspectRatio="none" class="fy-bgsvg" aria-hidden="true"><defs><pattern id="fywp" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#f6e7d0"/><circle cx="6" cy="6" r="1.8" fill="#efc9b0"/><circle cx="18" cy="18" r="1.8" fill="#cfe1cf"/></pattern></defs>`;
  s += `<rect width="400" height="140" fill="url(#fywp)"/><rect y="132" width="400" height="8" fill="#d9b48a"/><rect y="140" width="400" height="60" fill="#c99a6a"/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M0 ${152 + i * 13} H400" stroke="#b5875a" stroke-width="1"/>`;
  s += `<rect x="160" y="18" width="80" height="70" rx="6" fill="${sky}" stroke="${FY_L}" stroke-width="2.4"/>`;
  s += ph === 'night' ? `<circle cx="222" cy="36" r="8" fill="#f4efd2"/><circle cx="174" cy="30" r="1.3" fill="#fff"/><circle cx="190" cy="52" r="1.1" fill="#fff"/><circle cx="208" cy="70" r="1.3" fill="#fff"/><circle cx="182" cy="76" r="1" fill="#fff"/>` : ph === 'eve' ? `<circle cx="200" cy="84" r="16" fill="#f08a5a"/>` : `<circle cx="222" cy="36" r="9" fill="#fbd76a"/><ellipse cx="184" cy="40" rx="13" ry="5" fill="#fff" opacity=".9"/>`;
  s += `<path d="M200 18 V88 M160 53 H240" stroke="${FY_L}" stroke-width="2.4"/><path d="M154 14 q8 40 2 80 h-8 q4-40-2-80Z M246 14 q-8 40-2 80 h8 q-4-40 2-80Z" fill="#f3aec1" stroke="${FY_L}" stroke-width="1.6"/><rect x="146" y="10" width="108" height="6" rx="3" fill="#8a6448"/>`;
  s += `<rect x="264" y="92" width="122" height="7" rx="2" fill="#a87a50" stroke="${FY_L}" stroke-width="1.6"/><path d="M274 99 v8 M376 99 v8" stroke="${FY_L}" stroke-width="2.4"/>`;
  return s + `</svg>`;
}
// où vit chaque compagnon présent à la maison : salon, pièce aimée, ou pièce attribuée par la capacité (nsLayout)
function fyPlacement() {
  const L = nsLayout(), rooms = { prairie: [] };
  NS_HABS.forEach(H => { if (H.id !== 'prairie' && nsHabLvl(H.id)) rooms[H.id] = []; });
  for (const k of compIds()) {
    if (!CHARS[k] || (S.trips && S.trips[k])) continue;
    let r = L.where[k];
    if (L.team.includes(k)) { const h = FY_LOVED(S.comps[k].sp); r = h && rooms[h] && fyHash(k + Math.floor(fyNow() / 900e3)) % 3 === 0 ? h : 'prairie'; } // l'équipe vit au salon et passe parfois dans sa pièce préférée
    if (!r || r === 'tente' || !rooms[r]) r = 'prairie';
    rooms[r].push(k);
  }
  return { rooms, L };
}
function fyHash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function fyBehavior(k, ph) {
  const c = fyC(k), r = fyHash(k + Math.floor(fyNow() / 600e3)) % 100;
  if (c.nrg < 30 || (ph === 'night' && r < 85)) return 'sleep';
  if (ph === 'eve') return r < 40 ? 'sleep' : r < 75 ? 'sit' : 'walk';
  return r < 40 ? 'walk' : r < 65 ? 'play' : r < 90 ? 'sit' : 'sleep';
}
let fySel = null, fyMode = 'menu', fyPanel = null, fySlot = null, fyFx = null;
const FY_EXPR = { sleep: 'dodo', play: 'rire', walk: 'content', sit: 'content' };
function fyCompHTML(k, x, ph, big) {
  const b = fyBehavior(k, ph), c = fyC(k), fx = fyFx && fyFx.k === k ? fyFx.kind : '';
  const expr = fx === 'love' || fx === 'hug' ? 'amour' : fx === 'boude' ? 'boude' : fx === 'lvl' || fx === 'play' ? 'rire' : fx ? 'content' : FY_EXPR[b];
  const beh = fx ? 'sit' : b;
  const badge = fx ? '' : b === 'sleep' ? '<i class="fy-z">z<b>z</b></i>' : fyGood(k) ? `<i class="fy-st good">${fyIco('star')}</i>` : c.joy < 40 ? `<i class="fy-st sad">${fyIco('sad')}</i>` : '';
  const parts = fx ? `<i class="fy-fx fx-${fx}">${(fx === 'boude' ? ['sad'] : fx === 'lvl' ? ['star', 'star', 'star', 'star'] : fx === 'play' ? ['star', 'heart', 'star'] : ['heart', 'heart', 'heart', 'heart']).map((n, i) => `<span style="--i:${i}">${fyIco(n)}</span>`).join('')}</i>` : '';
  return `<button class="fy-c b-${beh}${fySel === k ? ' sel' : ''}${fx ? ' fx-' + fx : ''}" data-fy="comp" data-fk="${k}" style="left:${x}%;--w:${big ? 17 : 30}%;--d:${(fyHash(k) % 50) / 10}s" aria-label="${esc(CHARS[k].name)}"><span class="fy-mv"><span class="fy-bd">${drawChar(k, S.outfits && S.outfits[k], expr, 'fy' + k)}</span></span>${badge}${parts}</button>`;
}
function fyCompsHTML(list, big) {
  const max = big ? 6 : 3, show = list.slice(0, max), ph = fyPhase();
  const xs = show.map((k, i) => show.length === 1 ? 50 : (big ? 22 : 22) + i * ((big ? 56 : 56) / Math.max(1, show.length - 1)));
  return show.map((k, i) => fyCompHTML(k, xs[i], ph, big)).join('') + (list.length > max ? `<i class="fy-more">+${list.length - max}</i>` : '');
}
function fySlotHTML(id, deco) {
  const g = FY_SLOTS[id], v = S.house[id], sel = fySlot === id;
  const st = `left:${g[0] / 4}%;top:${g[1] / 2}%;width:${g[2] / 4}%;height:${g[3] / 2}%`;
  let inner = '';
  if (v && v.photo && typeof postcardSVG === 'function') inner = `<span class="fy-photo">${postcardSVG(v.photo, 'fyp' + id)}</span>`;
  else if (v && v.item && v.item.cat === 'd') inner = `<svg viewBox="0 0 100 100" preserveAspectRatio="${id === 'r0' ? 'none' : 'xMidYMax meet'}">${id === 'r0' ? `<g transform="translate(0 -20) scale(1 1.6)">${decorArt('tapis', v.item.color)}</g>` : decorArt(v.item.sub, v.item.color || '#e9c46a')}</svg>`;
  else if (v && v.item) inner = itemIcon(v.item);
  if (!v && !deco) return '';
  const e = fyEffOf(v), glow = v && v.item && ['lampe', 'lanterne', 'cheminee'].includes(v.item.sub) ? '<i class="fy-glow"></i>' : '';
  return `<button class="fy-slot k-${id[0]}${v ? '' : ' empty'}${sel ? ' sel' : ''}${deco ? ' deco' : ''}" data-fy="slot" data-fk="${id}" style="${st}" ${deco ? '' : 'tabindex="-1"'} aria-label="Emplacement">${glow}${inner || fyIco('house', 'plus')}${deco && e && FY_KIND[e[0]] ? `<i class="fy-eb">${fyIco(FY_KIND[e[0]][0])}</i>` : ''}</button>`;
}
function fyRoomHTML(id, comps) {
  const H = NS_HAB[id], cap = nsCap(id), n = comps.length;
  return `<div class="fy-room r-${id}"><div class="fy-bg"><svg viewBox="0 0 200 125" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${FY_ROOM_ART[id] ? FY_ROOM_ART[id]() : ''}</svg></div><span class="fy-rl">${nsHabIco(id)}<b>${esc(FY_ROOM_NAME[id] || H.short)}</b><i>${Array.from({ length: Math.min(6, cap) }, (_, i) => `<u class="${i < n ? 'on' : ''}"></u>`).join('')}</i></span>${fyCompsHTML(comps)}<i class="fy-night"></i></div>`;
}
function fyNurseryHTML() {
  const N = nsState(), ready = readyEggs().length, eggs = (S.eggs || []).length, cr = N.cross;
  return `<div class="fy-room r-petits"><div class="fy-bg"><svg viewBox="0 0 200 125" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${FY_ROOM_ART.petits()}</svg></div><span class="fy-rl">${fyIco('egg')}<b>Les petits</b></span>
    <button class="fy-nest" data-fy="nurse" aria-label="Nid douillet : ${eggs} œuf${eggs > 1 ? 's' : ''}">${NS_COUV_ART(N.couv)}${eggs ? `<i class="fy-cnt${ready ? ' hot' : ''}">${fyIco('egg')}${eggs}</i>` : ''}</button>
    <button class="fy-basket${N.enclos ? '' : ' off'}" data-fy="nurse" aria-label="Panier double">${NS_ENCLOS_ART()}${cr ? `<i class="fy-cnt${cr.ready <= Date.now() ? ' hot' : ''}">${fyIco('heart')}</i>` : ''}</button><i class="fy-night"></i></div>`;
}
function fyNextRoom() { return NS_HABS.find(H => H.id !== 'prairie' && !nsHabLvl(H.id)); }

// ---------------- rendu de la scène ----------------
function fyRender(box) {
  fyState();
  const ph = fyPhase(), deco = fyPanel === 'deco', P = fyPlacement(), m = fyMods();
  if (fySel && (!S.comps[fySel] || S.trips[fySel])) fySel = null;
  const away = compIds().filter(k => CHARS[k] && S.trips[k]);
  let h = `<div class="fy-top"><span class="fy-time t-${ph}">${fyIco(ph === 'day' ? 'sun' : 'moon')}</span>`;
  // effets actifs des meubles, en pictogrammes
  h += `<span class="fy-effs">${Object.entries(m).filter(([k, v]) => v > 0).map(([k, v]) => `<i title="${k}">${fyIco(FY_KIND[k][0])}<b>${k === 'trip' ? '−' : '+'}${Math.round(v * 100)}%</b></i>`).join('')}</span>`;
  h += `<button class="fy-tool${deco ? ' on' : ''}" data-fy="deco" aria-pressed="${deco}" aria-label="Décorer">${fyIco('sofa')}</button><button class="fy-tool${fyPanel === 'rooms' ? ' on' : ''}" data-fy="rooms" aria-pressed="${fyPanel === 'rooms'}" aria-label="Agrandir le foyer">${fyIco('house')}${typeof villageBuildable === 'function' && villageBuildable().length ? '<i class="sdot"></i>' : ''}</button></div>`;
  h += `<div class="fy-scene t-${ph}${deco ? ' decomode' : ''}"><div class="fy-roof"><svg viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true"><path d="M8 34 L200 3 L392 34Z" fill="#d9604f" stroke="${FY_L}" stroke-width="2.4" stroke-linejoin="round"/><path d="M60 26 L200 8 L340 26" fill="none" stroke="#f08a7a" stroke-width="3" stroke-linecap="round"/><rect x="300" y="2" width="18" height="22" fill="#c99a7a" stroke="${FY_L}" stroke-width="2"/></svg>${ph === 'day' ? '' : '<i class="fy-smoke"></i>'}</div>`;
  h += `<div class="fy-house"><div class="fy-room r-salon"><div class="fy-bg">${fySalonBg(ph)}</div>${Object.keys(FY_SLOTS).map(id => fySlotHTML(id, deco)).join('')}${fyCompsHTML(P.rooms.prairie, true)}<i class="fy-night"></i>${!compIds().some(k => CHARS[k] && !S.trips[k]) ? `<span class="fy-empty">${fyIco('map')}</span>` : ''}</div>`;
  h += `<div class="fy-grid">${fyNurseryHTML()}${Object.keys(P.rooms).filter(r => r !== 'prairie').map(r => fyRoomHTML(r, P.rooms[r])).join('')}`;
  const nx = fyNextRoom();
  if (nx) h += `<button class="fy-room fy-add" data-fy="rooms" aria-label="Ajouter une pièce : ${esc(FY_ROOM_NAME[nx.id])}"><span class="fy-bg ghost"><svg viewBox="0 0 126 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${NS_ART[nx.id]()}</svg></span><span class="fy-plus">${fyIco('house')}</span></button>`;
  h += `</div></div>`;
  if (away.length) h += `<div class="fy-away">${fyIco('map')}${away.map(k => `<img src="${portraitURI(k)}" alt="${esc(CHARS[k].name)} en voyage">`).join('')}</div>`;
  h += `</div>`;
  if (fySel) h += fyCareHTML(fySel);
  else if (deco) h += fyDecoHTML();
  else if (fyPanel === 'rooms') h += fyRoomsHTML();
  else h += `<p class="fy-tip">${fyIco('paw')}<span>Touchez un compagnon</span></p>`;
  box.innerHTML = h;
  fyFx = null;
}
// ---- menu de soin d'un compagnon
function fyCareHTML(k) {
  const c = fyC(k), p = S.prog[k] || { lvl: 1, xp: 0 }, ch = CHARS[k], f = Math.min(1, p.xp / needXP(p.lvl));
  let h = `<div class="fy-care" id="fyCare"><div class="fy-ch"><span class="fy-pic"><img src="${portraitURI(k, c.nrg < 30 ? 'dodo' : c.joy >= 70 ? 'rire' : 'content')}" alt=""></span><div class="fy-cx"><b>${esc(ch.name)} <small>niv. ${p.lvl}</small></b>${fyDots(c.joy, 'heart', 'joy')}${fyDots(c.nrg, 'bolt', 'nrg')}<span class="fy-xp"><i style="width:${(f * 100).toFixed(0)}%"></i></span></div>${fyGood(k) ? `<span class="fy-luck" title="En pleine forme : plus de chance en voyage">${fyIco('clover')}</span>` : fyTired(k) ? `<span class="fy-luck tired" title="Fatigué : il se repose">${fyIco('rest')}</span>` : ''}<button class="fy-x" data-fy="close" aria-label="Fermer">${fyIco('close')}</button></div>`;
  if (fyMode === 'food') {
    const food = S.inv.filter(i => i.cat === 'n'), rank = { love: 0, like: 1, hate: 2 };
    food.sort((a, b) => rank[tasteOf(k, a)] - rank[tasteOf(k, b)] || b.rarity - a.rarity);
    h += `<div class="fy-food"><button class="fy-back" data-fy="menu" aria-label="Retour">${fyIco('back')}</button>${food.length ? food.slice(0, 18).map(it => { const t = tasteOf(k, it); return `<button class="fy-fi t-${t}" data-fy="eat" data-fi="${it.id}" aria-label="${esc(it.name)}" title="${esc(it.name)}"><span class="ico">${itemIcon(it)}</span><i>${fyIco(t === 'love' ? 'heart' : t === 'hate' ? 'sad' : 'star')}</i></button>`; }).join('') : `<span class="fy-none">${fyIco('bowl')}<span>Rien à manger : rapportez des spécialités de voyage ou cuisinez à l’atelier.</span></span>`}</div>`;
  } else {
    const canTrain = c.nrg >= 30 && c.joy >= 40;
    h += `<div class="fy-acts"><button data-fy="food" aria-label="Nourrir">${fyIco('bowl')}<span>Nourrir</span></button><button data-fy="pet" aria-label="Câliner">${fyIco('paw')}<span>Câlin</span></button><button data-fy="dress" aria-label="Habiller">${fyIco('hanger')}<span>Habiller</span></button><button data-fy="train" ${canTrain ? '' : 'disabled'} aria-label="Faire progresser">${fyIco('xp')}<span>Progresser</span>${canTrain ? '' : `<i>${fyIco('bolt')}</i>`}</button></div>`;
  }
  return h + `</div>`;
}
// ---- décorer : choisir quoi poser dans l'emplacement touché
function fyDecoHTML() {
  if (!fySlot) return `<p class="fy-tip">${fyIco('sofa')}<span>Touchez un emplacement</span></p>`;
  const cur = S.house[fySlot], el = eligible(fySlot);
  const opt = (attr, icon, e, name) => `<button class="fy-pick" ${attr} title="${esc(name)}"><span class="ico">${icon}</span>${e ? `<i class="fy-pe">${fyIco(FY_KIND[e[0]][0])}<small>${esc(e[2])}</small></i>` : ''}</button>`;
  let h = `<div class="fy-care fy-deco"><div class="fy-dh">${cur ? `<span class="fy-cur">${fyEffOf(cur) ? fyIco(FY_KIND[fyEffOf(cur)[0]][0]) : ''}<small>${esc(fyEffOf(cur) ? fyEffOf(cur)[2] : '')}</small></span><button class="btn cream sm" data-fy="unplace">Retirer</button>` : ''}<button class="fy-x" data-fy="close" aria-label="Fermer">${fyIco('close')}</button></div><div class="fy-picks">`;
  h += (el.photos || []).slice(0, 8).map(p => opt(`data-fy="putp" data-fi="${p.id}"`, postcardSVG(p, 'fyk' + p.id), FY_PHOTO_EFF, p.title || p.place || '')).join('');
  h += el.items.slice().sort((a, b) => (FY_EFF[b.sub] ? 1 : 0) - (FY_EFF[a.sub] ? 1 : 0) || b.rarity - a.rarity).slice(0, 24).map(it => opt(`data-fy="put" data-fi="${it.id}"`, itemIcon(it), it.cat === 'd' ? FY_EFF[it.sub] : null, it.name)).join('');
  if (!el.items.length && !(el.photos || []).length) h += `<span class="fy-none">${fyIco('star')}<span>Rien à poser ici : fabriquez un meuble à l’atelier.</span><button class="btn gold sm" data-fy="goatelier">Atelier</button></span>`;
  return h + `</div></div>`;
}
// ---- agrandir : les pièces (anciens habitats) et les bâtiments du village
function fyRoomsHTML() {
  const L = nsLayout();
  let h = `<div class="fy-care fy-rooms"><div class="fy-dh"><b>${fyIco('house')} Agrandir le foyer</b><button class="fy-x" data-fy="close" aria-label="Fermer">${fyIco('close')}</button></div><div class="fy-rlist">`;
  h += NS_HABS.filter(H => H.id !== 'prairie').map(H => {
    const lvl = nsHabLvl(H.id), nx = H.lv[lvl], can = nx && nx.cost && nsCanPay(nx.cost, nx.coins), n = (L.by[H.id] || []).length;
    return `<div class="fy-rc${lvl ? ' on' : ''}" style="--hc:${H.color}"><span class="fy-ra"><svg viewBox="0 0 126 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${NS_ART[H.id]()}</svg></span><div class="fy-rx"><b>${esc(FY_ROOM_NAME[H.id])}</b><span class="fy-rsp">${H.sps.map(sp => `<img src="${nsPortrait(sp)}" alt="${esc(spName(sp))}" title="${esc(spName(sp))} : plus heureux ici">`).join('')}${fyIco('heart', 'pink')}</span><span class="fy-rcap">${fyIco('paw')}${lvl ? `${n}/${nsCap(H.id)}` : '0'}${nx ? ` → ${nx.cap}` : ''}</span>${nx && nx.cost ? `${nsCostHTML(nx.cost, nx.coins)}<button class="btn ${can ? 'green' : 'cream'} sm" data-ns-up="${H.id}" ${can ? '' : 'disabled'}>${lvl ? 'Agrandir' : 'Ajouter'}</button>` : `<span class="nsmax">${fyIco('star')}</span>`}</div></div>`;
  }).join('');
  h += `</div>`;
  if (typeof villageBuildingsHTML === 'function') { try { h += `<details class="fy-vb"><summary>${fyIco('map')} Bâtiments du village (bonus de voyage)</summary>${villageBuildingsHTML()}</details>`; } catch (e) {} }
  return h + `</div>`;
}

// ---------------- actions de soin ----------------
function fyFeed(k, id) {
  const it = S.inv.find(i => i.id === id && i.cat === 'n'); if (!it || !S.comps[k]) return;
  const c = fyC(k), t = tasteOf(k, it), m = fyMods();
  if (t === 'hate') { c.joy = fyClamp(c.joy - 2); fyFx = { k, kind: 'boude' }; save(); renderPanel(); return; } // il boude : l'objet reste dans le sac
  S.inv.splice(S.inv.indexOf(it), 1);
  c.joy = fyClamp(c.joy + (t === 'love' ? 25 : 12) * (1 + m.meal)); c.nrg = fyClamp(c.nrg + 6);
  const lv = (S.prog[k] || {}).lvl;
  addXP(k, t === 'love' ? 25 + it.rarity * 15 : 10 + it.rarity * 5);
  if (t === 'love') bump('feed_love');
  S.stats.fed = (S.stats.fed || 0) + 1;
  fyFx = { k, kind: (S.prog[k] || {}).lvl > lv ? 'lvl' : t === 'love' ? 'love' : 'play' };
  if (fyFx.kind === 'lvl') fyParty();
  fyMode = 'menu'; save(); renderTop(); renderComps(); renderPanel();
}
function fyPet(k) {
  if (!k || !S.comps[k]) return;
  const c = fyC(k), m = fyMods(), now = fyNow(), fresh = now - (c.pet || 0) > 20 * 60e3;
  c.joy = fyClamp(c.joy + (fresh ? 10 * (1 + m.hug) : 2)); c.pet = now;
  fyFx = { k, kind: fyHash(k + now) % 2 ? 'hug' : 'play' };
  save(); renderPanel();
}
function fyTrain(k) {
  const c = fyC(k), p = S.prog[k]; if (!p || c.nrg < 30 || c.joy < 40) return;
  c.nrg = fyClamp(c.nrg - 30); c.joy = fyClamp(c.joy - 5);
  const lv = p.lvl; addXP(k, Math.round(needXP(p.lvl) * 0.2) + 10);
  fyFx = { k, kind: p.lvl > lv ? 'lvl' : 'play' };
  if (p.lvl > lv) fyParty();
  save(); renderTop(); renderComps(); renderPanel();
}
function fyParty() { try { if (typeof confetti === 'function') confetti(true); } catch (e) {} }

// ---------------- effets en voyage ----------------
// départ : un compagnon heureux et reposé a plus de chance, un compagnon fatigué moins ; le voyage fatigue ; la carte murale raccourcit
if (typeof startTrip === 'function') startTrip = (orig => function () {
  const k = S.sel, before = S.trips && S.trips[k];
  let good = false, tired = false;
  try { if (k && S.comps && S.comps[k]) { good = fyGood(k); tired = fyTired(k); } } catch (e) {}
  const r = orig.apply(this, arguments);
  try {
    const t = S.trips[k];
    if (t && t !== before) {
      const c = fyC(k), m = fyMods();
      if (good) { t.luck = (t.luck || 0) + 0.6; t.fyBoost = 1; } else if (tired) { t.luck = Math.max(0, (t.luck || 0) - 0.3); t.fyTired = 1; }
      c.nrg = fyClamp(c.nrg - ({ eclair: 5, court: 10, moyen: 18, long: 28, expe: 40 }[t.dur] || 12));
      if (m.trip > 0 && isFinite(t.total)) { const f = 1 - m.trip; t.out = Math.round(t.out * f); t.stay = Math.round((t.stay || 0) * f); t.total = 2 * t.out + t.stay; }
      c.t = fyNow(); save();
    }
  } catch (e) { console.error('foyer départ', e); }
  return r;
})(startTrip);
// butin : la bonne humeur porte chance (meilleurs objets)
if (typeof lootFor === 'function') lootFor = (orig => function (tags, luck, place, n, comp) {
  try { if (comp && S.comps && S.comps[comp] && S.foyer && S.foyer.c && S.foyer.c[comp]) { const c = S.foyer.c[comp]; if (c.joy >= 70 && c.nrg >= 40) luck = (luck || 0) + 0.4; else if (c.joy < 30) luck = Math.max(0, (luck || 0) - 0.2); } } catch (e) {}
  return orig.call(this, tags, luck, place, n, comp);
})(lootFor);
// retour : un peu de bonheur ; après une aventure difficile (29_aventure.js), il rentre fatigué et se repose au foyer
if (typeof GAME !== 'undefined') GAME.on('trip:return', e => {
  try { const k = e && e.who, t = e && e.trip; if (!k || !S.comps[k]) return; const c = fyC(k); c.t = fyNow(); c.joy = fyClamp(c.joy + 4); if (t && t.avHurt) c.nrg = Math.min(c.nrg, 12); save(); } catch (er) {}
});

// ---------------- atelier : aperçu + utilité, tri par utilité ----------------
function fyRecipeOf(id) { const all = [].concat(RECIPES, typeof RG_RECIPES !== 'undefined' ? RG_RECIPES : [], typeof TZ_RECIPES !== 'undefined' ? TZ_RECIPES : []); return all.find(r => r && r.id === id); }
function fyOrderFor(out) {
  try { if (!S.shop || !Array.isArray(S.shop.orders) || typeof bqMatch !== 'function') return null; for (const o of S.shop.orders) { if (o.req.some(q => bqMatch(q, out))) { const c = typeof BQC === 'function' ? BQC(o.client) : null; return c ? (typeof bqWho === 'function' ? bqWho(c) : c.name || 'un client') : 'un client'; } } } catch (e) {}
  return null;
}
function fyUse(r, dwant) {
  const out = { name: r.out[0], cat: r.out[1], sub: r.out[2], rarity: r.out[3], look: r.out[4], color: r.out[5] };
  const who = fyOrderFor(out);
  if (who) return [100, 'star', `pour la commande de ${who}`];
  if (dwant) return [80, 'heart', 'pour un rêve'];
  if (out.cat === 'd') { const e = FY_EFF[out.sub], placed = Object.values(S.house).some(v => v && v.item && v.item.sub === out.sub); return e ? [placed ? 35 : 55, FY_KIND[e[0]][0], e[2] + ' (à poser au foyer)'] : [25, 'sofa', 'déco du foyer (+ confort)']; }
  if (out.cat === 'n') { const fans = compIds().filter(k => CHARS[k] && tasteOf(k, out) === 'love'); return fans.length ? [45, 'heart', `${fans.slice(0, 2).map(k => CHARS[k].name).join(' et ')} ${fans.length > 1 ? 'adorent' : 'adore'}`] : [20, 'bowl', 'un repas pour vos compagnons']; }
  if (out.cat === 'v') return [30, 'hanger', `se porte : ${(SLOT_LABEL[out.sub] || '').toLowerCase()}`];
  return [15, 'star', 'se vend bien au marché'];
}
function fyPreview(r) {
  const out = { name: r.out[0], cat: r.out[1], sub: r.out[2], rarity: r.out[3], look: r.out[4], color: r.out[5] };
  if (out.cat === 'd') return `<span class="fy-prev room"><svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="70" fill="#f6e7d0"/><circle cx="14" cy="14" r="2" fill="#efc9b0"/><circle cx="40" cy="30" r="2" fill="#cfe1cf"/><circle cx="72" cy="12" r="2" fill="#efc9b0"/><rect y="66" width="100" height="5" fill="#d9b48a"/><rect y="71" width="100" height="29" fill="#c99a6a"/><svg x="${PLACEMENT[out.sub] === 'wall' ? 18 : 8}" y="${PLACEMENT[out.sub] === 'wall' ? 6 : 14}" width="${PLACEMENT[out.sub] === 'wall' ? 64 : 84}" height="${PLACEMENT[out.sub] === 'wall' ? 56 : 84}" viewBox="0 0 100 100">${decorArt(out.sub, out.color || '#e9c46a')}</svg></svg></span>`;
  return `<span class="fy-prev ${out.cat === 'n' ? 'plate' : 'disc'}">${itemIcon(out)}</span>`;
}
if (typeof renderAtelier === 'function') renderAtelier = (orig => function (box) {
  const r = orig.apply(this, arguments);
  try {
    box.querySelectorAll('.recipes').forEach(list => {
      const cards = [...list.children].filter(x => x.classList && x.classList.contains('rec'));
      cards.forEach(card => {
        const b = card.querySelector('[data-craft]'), rc = b && fyRecipeOf(b.dataset.craft); if (!rc) { card.dataset.fyScore = 0; return; }
        const u = fyUse(rc, card.classList.contains('dwant'));
        card.dataset.fyScore = u[0] + (canCraft(rc) ? 30 : 0);
        const ico = card.querySelector('.ico.big'); if (ico) ico.outerHTML = fyPreview(rc);
        const nm = card.querySelector('.rx b'); if (nm && !card.querySelector('.fy-use')) nm.insertAdjacentHTML('afterend', `<span class="fy-use">${fyIco(u[1])}→ ${esc(u[2])}</span>`);
      });
      cards.sort((a, b) => b.dataset.fyScore - a.dataset.fyScore).forEach(c => list.appendChild(c));
    });
  } catch (e) { console.error('foyer atelier', e); }
  return r;
})(renderAtelier);

// ---------------- navigation : Village → Foyer ----------------
const FY_NAV_ICON = '<path d="M3 14 L15 4 L27 14" fill="none" stroke="#d9604f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 13 V26 H24 V13" fill="#fff3e2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="20" y="4" width="3.4" height="6" fill="#c99a7a" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="16" width="6" height="5" rx="1" fill="#fbd76a" stroke="currentColor" stroke-width="1.4"/><path d="M12 16 V21 M9 18.5 H15" stroke="currentColor" stroke-width="1"/><ellipse cx="19.5" cy="23.4" rx="3.6" ry="2.6" fill="#ec9c6f" stroke="currentColor" stroke-width="1.4"/><circle cx="17.6" cy="21" r="1.2" fill="#ec9c6f" stroke="currentColor" stroke-width="1"/><circle cx="21.4" cy="21" r="1.2" fill="#ec9c6f" stroke="currentColor" stroke-width="1"/>';
(function fyNav() {
  try {
    if (typeof NAV_ICONS !== 'undefined') { NAV_ICONS.foyer = FY_NAV_ICON; NAV_ICONS.village = FY_NAV_ICON; }
    if (typeof NAV !== 'undefined') { const v = NAV.find(x => x[0] === 'village'); if (v) v[1] = 'Foyer'; }
    if (typeof SHEET_TITLES !== 'undefined') { SHEET_TITLES.village = 'Le foyer'; SHEET_TITLES.maison = 'Le foyer'; }
    if (typeof SUBTABS !== 'undefined' && SUBTABS.village) { const extra = SUBTABS.village.filter(x => !['refuge', 'nurserie', 'habitats', 'atelier', 'maison', 'foyer'].includes(x[0])); SUBTABS.village.splice(0, SUBTABS.village.length, ['foyer', 'Foyer', 'foyer'], ['atelier', 'Atelier', 'atelier'], ['nurserie', 'Nurserie', 'nurserie'], ...extra); }
    if (typeof TAB_ALIAS !== 'undefined') Object.assign(TAB_ALIAS, { village: ['village', 'foyer'], foyer: ['village', 'foyer'], maison: ['village', 'maison'], habitats: ['village', 'habitats'], batiments: ['village', 'habitats'], pieces: ['village', 'habitats'], meubles: ['village', 'maison'] });
    if (typeof villView !== 'undefined' && (villView === 'refuge' || !villView)) villView = 'foyer';
  } catch (e) { console.error('foyer nav', e); }
})();
// anciennes vues du village → le foyer (avec le bon panneau ouvert)
function fyNormView() {
  if (villView === 'habitats' || villView === 'bat') { villView = 'foyer'; fyPanel = 'rooms'; fySel = null; }
  else if (villView === 'maison') { villView = 'foyer'; fyPanel = 'deco'; fySel = null; }
  else if (villView === 'refuge' || villView === 'marche' || !villView) villView = 'foyer';
}
if (typeof renderVillageTab === 'function') renderVillageTab = (orig => function (box) {
  try { fyNormView(); } catch (e) {}
  if (villView === 'foyer') { try { return fyRender(box); } catch (e) { console.error('foyer', e); } }
  return orig.apply(this, arguments);
})(renderVillageTab);
if (typeof subDot === 'function') subDot = (orig => function (t, k) {
  try { if (t === 'village' && k === 'foyer') return typeof villageBuildable === 'function' && villageBuildable().length > 0; } catch (e) {}
  return orig.apply(this, arguments);
})(subDot);

// ---------------- clics ----------------
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-fy]'); if (!el || el.disabled || !el.closest('#panelBody')) return;
  const a = el.dataset.fy, k = el.dataset.fk, id = el.dataset.fi;
  const scrollCare = () => setTimeout(() => { const c = document.getElementById('fyCare'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30);
  if (a === 'comp') { if (fyPanel === 'deco') return; fySel = fySel === k ? null : k; fyMode = 'menu'; fyPanel = null; renderPanel(); if (fySel) scrollCare(); return; }
  if (a === 'close') { fySel = null; fySlot = null; fyPanel = null; renderPanel(); return; }
  if (a === 'menu') { fyMode = 'menu'; renderPanel(); return; }
  if (a === 'food') { fyMode = 'food'; renderPanel(); scrollCare(); return; }
  if (a === 'eat') return fyFeed(fySel, id);
  if (a === 'pet') return fyPet(fySel);
  if (a === 'train') return fyTrain(fySel);
  if (a === 'dress') { const s = fySel; if (s && S.comps[s]) { S.sel = s; save(); } fySel = null; if (typeof openCompagnons === 'function') openCompagnons('garde'); return; }
  if (a === 'deco') { fyPanel = fyPanel === 'deco' ? null : 'deco'; fySel = null; fySlot = null; renderPanel(); return; }
  if (a === 'rooms') { fyPanel = fyPanel === 'rooms' ? null : 'rooms'; fySel = null; renderPanel(); scrollCare(); return; }
  if (a === 'slot') { if (fyPanel !== 'deco') { fyPanel = 'deco'; fySel = null; } fySlot = k; renderPanel(); return; }
  if (a === 'put' && fySlot) { const it = S.inv.find(i => i.id === id); if (it) placeInHouse(fySlot, { item: it }); fySlot = null; renderPanel(); return; }
  if (a === 'putp' && fySlot) { const p = (S.album || []).find(x => x.id === id); if (p) placeInHouse(fySlot, { photo: p }); fySlot = null; renderPanel(); return; }
  if (a === 'unplace' && fySlot) { const cur = S.house[fySlot]; if (cur && cur.item) S.inv.push(cur.item); delete S.house[fySlot]; save(); renderPanel(); return; }
  if (a === 'goatelier') { villView = 'atelier'; fyPanel = null; renderPanel(); $('panelBody').scrollTop = 0; return; }
  if (a === 'nurse') { villView = 'nurserie'; renderPanel(); $('panelBody').scrollTop = 0; return; }
});

// ---------------- style ----------------
(function fyCSS() {
  if (document.getElementById('fyCSS')) return;
  const st = document.createElement('style'); st.id = 'fyCSS';
  st.textContent = `
.fyi{width:1em;height:1em;vertical-align:-.15em;flex:none}
.fy-top{display:flex;align-items:center;gap:6px;margin:2px 0 6px}
.fy-time{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:18px;background:#fff3c9;color:#e0a020;flex:none}
.fy-time.t-eve{background:#fde0cf;color:#e07a4a}.fy-time.t-night{background:#2f3d6b;color:#f4efd2}
.fy-effs{display:flex;gap:4px;flex:1;flex-wrap:wrap;min-width:0}
.fy-effs i{font-style:normal;display:inline-flex;align-items:center;gap:2px;background:#fff8ea;border:1.5px solid #e7d6b8;border-radius:99px;padding:1px 6px 1px 4px;font-size:11px;color:#7a5f50}
.fy-effs i .fyi{font-size:13px;color:#d9604f}.fy-effs b{font-weight:800}
.fy-tool{position:relative;width:40px;height:40px;border-radius:12px;border:2px solid #5b4636;background:#fffaf0;font-size:22px;display:grid;place-items:center;color:#5b4636;box-shadow:0 2px 0 #5b4636;cursor:pointer}
.fy-tool.on{background:#2f7f6c;color:#fff}.fy-tool .sdot{position:absolute;top:-4px;right:-4px}
.fy-scene{position:relative;border-radius:18px;padding:0 6px 8px;background:linear-gradient(#bfe6f4,#e4f4ea 60%,#a7cf7a 60.2%);transition:background .6s}
.fy-scene.t-eve{background:linear-gradient(#f5b48f,#fbe0c8 60%,#94bd6c 60.2%)}
.fy-scene.t-night{background:linear-gradient(#1f2a52,#3a4a7a 60%,#55784a 60.2%)}
.fy-roof{position:relative;height:30px;margin:0 -2px}.fy-roof svg{width:100%;height:100%;display:block}
.fy-smoke{position:absolute;right:20%;top:-14px;width:10px;height:10px;border-radius:50%;background:#fff;opacity:.6;animation:fySmoke 3s ease-out infinite}
@keyframes fySmoke{from{transform:translate(0,8px) scale(.6);opacity:.7}to{transform:translate(8px,-14px) scale(1.6);opacity:0}}
.fy-house{background:#8a6448;border:3px solid #5b4636;border-top:0;border-radius:0 0 12px 12px;padding:5px;display:flex;flex-direction:column;gap:5px}
.fy-room{position:relative;border-radius:8px;aspect-ratio:200/125;display:block}
.fy-room.r-salon{aspect-ratio:2/1}
.fy-bg{position:absolute;inset:0;overflow:hidden;border-radius:8px}.fy-bg>svg{width:100%;height:100%;display:block}
.fy-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.fy-rl{position:absolute;left:4px;top:4px;display:flex;align-items:center;gap:3px;background:rgba(255,250,240,.88);border-radius:99px;padding:1px 6px 1px 3px;font-size:11px;color:#5b4636;z-index:3}
.fy-rl svg{width:15px;height:15px}.fy-rl i{display:flex;gap:2px}.fy-rl u{width:6px;height:6px;border-radius:50%;border:1.3px solid #5b4636;background:#fff}.fy-rl u.on{background:#f08aa6}
.fy-night{position:absolute;inset:0;border-radius:8px;pointer-events:none;z-index:4;transition:background .6s}
.t-eve .fy-night{background:rgba(255,140,70,.14)}
.t-night .fy-night{background:radial-gradient(circle at 50% 8%,rgba(255,220,140,.25),transparent 45%),rgba(25,35,85,.42)}
.fy-glow{position:absolute;left:50%;top:20%;width:220%;aspect-ratio:1;transform:translate(-50%,-40%);border-radius:50%;background:radial-gradient(rgba(255,226,140,.55),transparent 62%);pointer-events:none;z-index:5;opacity:0;transition:opacity .6s}
.t-night .fy-glow,.t-eve .fy-glow{opacity:1}
.fy-slot{position:absolute;padding:0;border:0;background:none;z-index:1;cursor:default}
.fy-slot>svg,.fy-slot .fy-photo>svg{width:100%;height:100%;display:block}
.fy-slot.k-r{z-index:0}.fy-slot .fy-photo{display:block;width:100%;height:100%;border:3px solid #a87a50;border-radius:3px;overflow:hidden;box-sizing:border-box}
.fy-slot.deco{cursor:pointer;outline:2px dashed rgba(91,70,54,.55);outline-offset:1px;border-radius:6px;z-index:6}
.fy-slot.empty{display:grid;place-items:center;background:rgba(255,255,255,.4);color:#7a5f50}
.fy-slot.empty .plus{width:46%;height:46%}
.fy-slot.sel{outline:3px solid #2f7f6c;background:rgba(47,127,108,.15)}
.fy-eb{position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:50%;background:#fff;border:1.5px solid #5b4636;display:grid;place-items:center;color:#d9604f}.fy-eb .fyi{width:12px;height:12px}
.decomode .fy-c{opacity:.55;pointer-events:none}
.fy-c{position:absolute;bottom:4%;width:var(--w);transform:translateX(-50%);padding:0;border:0;background:none;z-index:2;cursor:pointer;-webkit-tap-highlight-color:transparent}
.r-salon .fy-c{bottom:3%}
.fy-mv{display:block}.fy-bd{display:block;transform-origin:50% 100%}.fy-bd svg{width:100%;height:auto;display:block;filter:drop-shadow(0 2px 0 rgba(60,40,20,.18))}
.fy-c.sel .fy-bd{filter:drop-shadow(0 0 4px #fff) drop-shadow(0 0 2px #2f7f6c)}
.b-walk .fy-mv{animation:fyWalk 11s ease-in-out infinite;animation-delay:calc(var(--d) * -1)}
.b-walk .fy-bd{animation:fyHop .45s ease-in-out infinite alternate,fyFace 11s step-end infinite;animation-delay:0s,calc(var(--d) * -1)}
@keyframes fyWalk{0%,100%{transform:translateX(-45%)}50%{transform:translateX(45%)}}
@keyframes fyFace{0%{scale:1 1}50%{scale:-1 1}}
@keyframes fyHop{from{transform:translateY(0)}to{transform:translateY(-5%)}}
.b-sit .fy-bd{animation:fyBreathe 3.2s ease-in-out infinite;animation-delay:calc(var(--d) * -1)}
@keyframes fyBreathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.965)}}
.b-sleep .fy-bd{animation:fyBreathe 4.5s ease-in-out infinite;transform:rotate(-4deg)}
.b-play .fy-bd{animation:fyPlay 1.6s ease-in-out infinite;animation-delay:calc(var(--d) * -1)}
@keyframes fyPlay{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-14%) rotate(-8deg)}50%{transform:translateY(0) rotate(0)}75%{transform:translateY(-8%) rotate(8deg)}}
.fy-z{position:absolute;right:4%;top:0;font:800 13px/1 system-ui;color:#6a7bc0;font-style:normal;animation:fyZ 2.4s ease-out infinite}.fy-z b{font-size:10px;margin-left:2px}
.t-night .fy-z{color:#dfe6ff}
@keyframes fyZ{from{transform:translate(0,6px);opacity:0}30%{opacity:1}to{transform:translate(8px,-14px);opacity:0}}
.fy-st{position:absolute;right:2%;top:2%;width:16px;height:16px;display:grid;place-items:center;border-radius:50%;background:#fff;border:1.4px solid #5b4636}
.fy-st .fyi{width:11px;height:11px}.fy-st.good{color:#f2b32e}.fy-st.sad{color:#7d8fb3}
.fy-fx{position:absolute;inset:-10% 0 auto;height:60%;pointer-events:none;font-style:normal}
.fy-fx span{position:absolute;left:calc(20% + var(--i) * 18%);bottom:0;font-size:16px;color:#f08aa6;animation:fyRise 1.6s ease-out forwards;animation-delay:calc(var(--i) * .15s);opacity:0}
.fx-lvl span,.fx-play span{color:#f2b32e}.fx-boude span{color:#7d8fb3;left:40%;font-size:22px}
@keyframes fyRise{0%{transform:translateY(10px) scale(.4);opacity:0}25%{opacity:1}100%{transform:translateY(-34px) scale(1.15);opacity:0}}
.fy-c.fx-boude .fy-bd{animation:fyShake .5s 2}.fy-c.fx-love .fy-bd,.fy-c.fx-hug .fy-bd{animation:fyPop .6s 2}.fy-c.fx-lvl .fy-bd{animation:fyLvl 1s}.fy-c.fx-play .fy-bd{animation:fyPlay .8s 2}
@keyframes fyShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6%) rotate(-4deg)}75%{transform:translateX(6%) rotate(4deg)}}
@keyframes fyPop{0%,100%{transform:scale(1)}40%{transform:scale(1.1,.92)}70%{transform:scale(.95,1.06)}}
@keyframes fyLvl{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-22%) scale(1.15) rotate(360deg)}100%{transform:translateY(0) scale(1)}}
.fy-more{position:absolute;right:5px;bottom:5px;z-index:3;font:800 11px system-ui;background:#fffaf0;border:1.5px solid #5b4636;border-radius:99px;padding:0 5px;font-style:normal}
.fy-empty{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);font-size:30px;color:#a87a50;opacity:.6}
.fy-nest,.fy-basket{position:absolute;bottom:3%;width:46%;padding:0;border:0;background:none;cursor:pointer;z-index:2}
.fy-nest{left:3%}.fy-basket{right:3%}.fy-basket.off{opacity:.45;filter:grayscale(.6)}
.fy-nest svg,.fy-basket svg{width:100%;height:auto;display:block}
.fy-cnt{position:absolute;top:-4px;right:6%;display:flex;align-items:center;gap:1px;background:#fffaf0;border:1.5px solid #5b4636;border-radius:99px;padding:0 5px;font:800 11px system-ui;font-style:normal;color:#5b4636}
.fy-cnt.hot{background:#f2c14e;animation:fyPop 1.2s infinite}
.fy-add{border:2.5px dashed #f6e7d0;background:rgba(255,255,255,.12);cursor:pointer;padding:0}
.fy-bg.ghost{opacity:.35;filter:grayscale(.4)}
.fy-plus{position:absolute;inset:0;display:grid;place-items:center;font-size:34px;color:#fff;text-shadow:0 2px 0 #5b4636}
.fy-plus .fyi{filter:drop-shadow(0 2px 0 #5b4636)}
.fy-away{display:flex;align-items:center;gap:4px;margin-top:6px;color:#fff;font-size:18px}
.fy-away img{width:30px!important;height:30px!important;border-radius:50%;background:#fffaf0;border:2px solid #fff}
.fy-tip{display:flex;align-items:center;justify-content:center;gap:6px;color:#8a7262;margin:10px 0;font-size:14px}.fy-tip .fyi{font-size:20px;color:#c98a5a}
.fy-care{margin-top:10px;background:#fffaf0;border:2px solid #5b4636;border-radius:16px;padding:10px;box-shadow:0 3px 0 #5b4636;scroll-margin:12px}
.fy-ch{display:flex;align-items:center;gap:8px}.fy-pic>*,.fy-pic svg{width:100%!important;height:100%!important;max-width:none}.fy-pic{display:block;width:58px;height:58px;overflow:hidden;flex:none;border-radius:50%;background:#f6e7d0;border:2px solid #e7d6b8}
.fy-cx{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}.fy-cx b{font-size:15px}.fy-cx small{color:#8a7262;font-weight:600}
.fy-g{display:flex;gap:2px;font-size:16px;color:#e3d6c4}.fy-g .on{color:#f08aa6}.fy-g .half{color:#f7c3d1}
.fy-g.nrg .on{color:#f2b32e}.fy-g.nrg .half{color:#f8dc96}
.fy-xp{height:6px;border-radius:99px;background:#efe3cf;overflow:hidden;max-width:120px}.fy-xp i{display:block;height:100%;background:#f2c14e}
.fy-luck{font-size:24px;color:#4f9f78}.fy-luck.tired{color:#7d8fb3}
.fy-x{width:32px;height:32px;border-radius:50%;border:0;background:#f3eadb;color:#7a5f50;font-size:14px;display:grid;place-items:center;cursor:pointer;flex:none}
.fy-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
.fy-acts button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 6px;border:2px solid #5b4636;border-radius:14px;background:#fff3e2;font:700 11px system-ui;color:#5b4636;box-shadow:0 2px 0 #5b4636;cursor:pointer}
.fy-acts button .fyi{font-size:26px}
.fy-acts button:nth-child(1) .fyi{color:#d9893e}.fy-acts button:nth-child(2) .fyi{color:#f08aa6}.fy-acts button:nth-child(3) .fyi{color:#4f88cf}.fy-acts button:nth-child(4) .fyi{color:#4f9f78}
.fy-acts button:disabled{opacity:.45}.fy-acts button i{position:absolute;top:2px;right:4px;color:#f2b32e;font-size:12px}
.fy-food,.fy-picks{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center}
.fy-back{width:40px;height:52px;border-radius:12px;border:2px solid #e7d6b8;background:#fff;font-size:18px;color:#7a5f50;cursor:pointer}
.fy-fi,.fy-pick{position:relative;width:52px;height:52px;padding:4px;border-radius:12px;border:2px solid #e7d6b8;background:#fff;cursor:pointer}
.fy-fi .ico,.fy-pick .ico{display:block;width:100%;height:100%}.fy-fi .ico svg,.fy-pick .ico svg{width:100%;height:100%}
.fy-fi i{position:absolute;right:-5px;top:-5px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#fff;border:1.5px solid #5b4636;font-size:12px}
.fy-fi.t-love{border-color:#f08aa6;background:#fff0f4}.fy-fi.t-love i{color:#f08aa6}.fy-fi.t-like i{color:#f2b32e}.fy-fi.t-hate{opacity:.7}.fy-fi.t-hate i{color:#7d8fb3}
.fy-pick{width:auto;min-width:52px;display:flex;align-items:center;gap:4px;padding:4px 8px 4px 4px}.fy-pick .ico{width:42px;height:42px;flex:none}
.fy-pe{display:flex;align-items:center;gap:3px;font-style:normal;color:#d9604f;font-size:16px;text-align:left}.fy-pe small{font-size:11px;color:#5b4636;max-width:110px;line-height:1.15}
.fy-none{display:flex;align-items:center;gap:8px;color:#8a7262;font-size:13px;flex-wrap:wrap}.fy-none>.fyi{font-size:24px}
.fy-dh{display:flex;align-items:center;gap:8px;justify-content:flex-end}.fy-dh b{margin-right:auto;display:flex;align-items:center;gap:4px}
.fy-cur{margin-right:auto;display:flex;align-items:center;gap:4px;color:#d9604f;font-size:18px}.fy-cur small{font-size:12px;color:#5b4636}
.fy-rlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-top:8px}
.fy-rc{display:flex;flex-direction:column;border:2px solid #e7d6b8;border-radius:14px;overflow:hidden;background:#fff}.fy-rc.on{border-color:var(--hc)}
.fy-ra{display:block;height:64px}.fy-ra svg{width:100%;height:100%;display:block}
.fy-rx{padding:6px;display:flex;flex-direction:column;gap:4px}.fy-rx>b{font-size:14px}
.fy-rsp{display:flex;align-items:center;gap:2px}.fy-rsp img{width:26px!important;height:26px!important;border-radius:50%;background:#f6e7d0}.fy-rsp .pink{color:#f08aa6}
.fy-rcap{display:flex;align-items:center;gap:3px;font:700 12px system-ui;color:#7a5f50}
.fy-vb{margin-top:10px}.fy-vb summary{cursor:pointer;font-weight:700;color:#5b4636;display:flex;align-items:center;gap:6px}
.fy-use{display:flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:#2f7f6c;margin:1px 0 2px}.fy-use .fyi{font-size:15px;color:#d9604f}
.fy-prev{flex:none;width:76px;height:76px;border-radius:14px;overflow:hidden;display:grid;place-items:center;border:2px solid #e7d6b8}
.fy-prev>svg{width:100%;height:100%}.fy-prev.disc{background:radial-gradient(#fff,#f3eadb);padding:8px;box-sizing:border-box}.fy-prev.plate{background:radial-gradient(circle,#fff 55%,#e7d6b8 56%,#fff 60%);padding:12px;box-sizing:border-box}
@media (min-width:700px){.fy-scene{max-width:640px;margin:0 auto}.fy-grid{grid-template-columns:1fr 1fr 1fr}.fy-care{max-width:640px;margin-left:auto;margin-right:auto}}
@media (prefers-reduced-motion:reduce){.fy-c *,.fy-smoke,.fy-z{animation:none!important}}
`;
  document.head.appendChild(st);
})();

// ---------------- tests ----------------
window.__foyer = {
  hour: null, skew: 0,
  state: () => S.foyer, c: k => fyC(k), mods: () => fyMods(),
  open: () => { villView = 'foyer'; fyPanel = null; openSheet('village', true); },

  select: k => { fySel = k; fyMode = 'menu'; renderPanel(); }, feed: (k, id) => fyFeed(k, id),
};

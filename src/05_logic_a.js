// ================= OUTILS =================
const $ = id => document.getElementById(id);
const R = 6371;
const kmBetween = (a, b) => Math.round(d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]) * R);
let seedState = 1;
const srand = () => { seedState = (seedState * 16807) % 2147483647; return (seedState - 1) / 2147483646; };
const seed = s => { seedState = Math.max(1, Math.floor(s) % 2147483646); for (let i = 0; i < 6; i++) srand(); };
const uidGen = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function fmtDur(ms) {
  ms = Math.max(0, ms); const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h) return `${h} h ${String(m % 60).padStart(2, '0')}`;
  return `${m} min ${String(s % 60).padStart(2, '0')}`;
}
const season = () => { const m = new Date().getMonth(); return m >= 8 && m <= 10 ? 'automne' : m === 11 || m <= 1 ? 'hiver' : m <= 4 ? 'printemps' : 'été'; };
const isNight = () => { const h = new Date().getHours(); return h < 6 || h >= 21; };
const COIN = `<svg class="coin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="#f2c14e" stroke="#a87a1e" stroke-width="1.6"/><circle cx="10" cy="10" r="4.4" fill="none" stroke="#a87a1e" stroke-width="1.3"/><circle cx="7.4" cy="7" r="1.6" fill="#fff" opacity=".6"/></svg>`;
const coins = n => `<span class="money">${COIN}${Math.round(n).toLocaleString('fr-FR')}</span>`;
const WATER = ['mer', 'lac', 'ile'];

// ================= ÉTAT =================
const SAVE = 'carnet-voyage-v2';
const fresh = () => ({
  v: 2, home: 'Lyon', sel: 'pistache', coins: 150, inv: [], album: [], found: {}, dex: {}, secrets: [],
  outfits: Object.fromEntries(Object.keys(CHARS).map(k => [k, { ...CHARS[k].outfit, col: {} }])),
  trips: { pistache: null, mochi: null, bulle: null }, unseen: { pistache: 0, mochi: 0, bulle: 0 },
  prog: { pistache: { xp: 0, lvl: 1 }, mochi: { xp: 0, lvl: 1 }, bulle: { xp: 0, lvl: 1 } },
  house: {}, market: { day: 0, refresh: 0, list: [], mine: [] }, daily: { day: 0, quests: [], chest: false }, colClaimed: {}, stats: { trips: 0, crafted: 0, sold: 0 },
});
let S = fresh();
try {
  const raw = localStorage.getItem(SAVE);
  if (raw) { const d = JSON.parse(raw); if (d && d.v === 2) S = Object.assign(fresh(), d); }
  else { const old = localStorage.getItem('carnet-voyage-v1'); if (old) { const d = JSON.parse(old); S.inv = d.inv || []; S.album = d.album || []; S.home = d.home || S.home; S.found = d.found || {}; S.inv.forEach(i => S.dex[i.name] = true); } }
} catch (e) {}
function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} }
const homeObj = () => { const h = HOMES.find(x => x[0] === S.home) || HOMES[1]; return { name: h[0], lat: h[1], lon: h[2] }; };
let plan = { dest: null, dur: 'eclair' };
let tab = 'voyage', bagFilter = 'all', craftFilter = 'Vêtement', mktView = 'acheter', houseSel = null, questView = 'jour';
let fast = false;

// ================= PROGRESSION =================
const needXP = l => 80 + l * 50;
const hasTalent = (k, idx) => S.prog[k].lvl >= TALENTS[k][idx][0];
const lvlLuck = k => (S.prog[k].lvl - 1) * 0.1;
function comfort() {
  let c = 0;
  for (const v of Object.values(S.house)) { if (!v) continue; c += v.photo ? 1 : (v.item ? v.item.rarity + 1 : 0); }
  return c;
}
const comfortBonus = () => Math.min(0.5, comfort() * 0.03);
function addXP(k, amount, why) {
  const p = S.prog[k]; const gain = Math.round(amount * (1 + comfortBonus()));
  p.xp += gain;
  let up = false;
  while (p.xp >= needXP(p.lvl)) { p.xp -= needXP(p.lvl); p.lvl++; up = true; }
  if (up) {
    const t = TALENTS[k].find(x => x[0] === p.lvl);
    setTimeout(() => reactionPopup(k, 'rire', t ? `Niveau ${p.lvl} ! Nouveau talent : ${t[1]}` : `Niveau ${p.lvl} ! Je me sens plus chanceux.`, true), 400);
  }
  return gain;
}
function gainCoins(n) { S.coins += Math.round(n); }
function value(it) {
  const base = [6, 16, 42, 120, 380][it.rarity] || 6;
  const m = { v: 1.2, m: 1, n: 0.6, d: 1.5, t: 2 }[it.cat] || 1;
  return Math.round(base * m * (it.special ? 1.8 : 1) * (it.edition ? 2.5 : 1));
}

// ================= QUÊTES =================
function ensureDaily() {
  const dk = dayKey();
  if (S.daily.day === dk) return;
  seed(dk * 7 + 13);
  const tags = Object.keys(TAGQ).filter(t => t !== 'agrumes');
  const types = QUEST_T.slice();
  const out = [];
  while (out.length < 3) {
    const q = types.splice(Math.floor(srand() * types.length), 1)[0];
    const tag = q.tag ? tags[Math.floor(srand() * tags.length)] : null;
    out.push({ id: uidGen(), type: q.type, tag, goal: q.goal, prog: 0, claimed: false, reward: 40 + Math.floor(srand() * 5) * 10 });
  }
  S.daily = { day: dk, quests: out, chest: false };
  save();
}
function bump(type, n = 1, tags = null) {
  ensureDaily();
  let changed = false;
  for (const q of S.daily.quests) {
    if (q.claimed || q.prog >= q.goal || q.type !== type) continue;
    if (q.tag && (!tags || !tags.includes(q.tag))) continue;
    q.prog = Math.min(q.goal, q.prog + n); changed = true;
    if (q.prog >= q.goal) toast(`Quête accomplie : ${questText(q)}`);
  }
  if (changed) { save(); renderTabBadges(); }
}
const questText = q => QUEST_T.find(t => t.type === q.type).txt(q.tag);
function collections() {
  const cols = Object.keys(LOOT).map(t => ({ key: t, label: TAGL[t], names: [...new Set(LOOT[t].map(d => d[0]))] }));
  cols.push({ key: 'souvenirs', label: 'Souvenirs du monde', names: PLACES.map(p => p.special[0]), big: true });
  cols.push({ key: 'secrets', label: 'Trésors des lieux secrets', names: SECRETS.flatMap(s => s.loot.map(d => d[0])), big: true });
  return cols;
}
function colReward(c) { return c.big ? 400 : 120; }


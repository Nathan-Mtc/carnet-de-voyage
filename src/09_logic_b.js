// ================= VOYAGE =================
function tripPos(t) {
  const f = Math.min(1, t.elapsed / t.total), k = f <= 0.5 ? f / 0.5 : (1 - f) / 0.5;
  return d3.geoInterpolate([t.from.lon, t.from.lat], [t.dest.lon, t.dest.lat])(k);
}
function nearestPlace(lon, lat, maxKm) { let best = null, bd = maxKm; for (const p of PLACES) { const d = kmBetween({ lat, lon }, p); if (d < bd) { bd = d; best = p; } } return best; }
function weightedType(k) {
  const w = { decouverte: 3, trouvaille: 3, choix: 3, repas: 2, rencontre: 2, marchand: 1.4, aide: 1.6, animal: 2, meteo: 1.2, pieces: 1.4, tresor: 0.5 };
  if (hasTalent(k, 0) && k === 'pistache') w.trouvaille += 1.5;
  if (k === 'pistache' && hasTalent(k, 2)) w.tresor *= 3;
  if (k === 'bulle' && hasTalent(k, 1)) w.meteo *= 2.2;
  let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [t, v] of Object.entries(w)) { r -= v; if (r <= 0) return t; }
  return 'decouverte';
}
function startTrip() {
  const d = DURS.find(x => x.key === plan.dur), from = homeObj(), dest = plan.dest, k = S.sel;
  const dist = kmBetween(from, dest), n = d.ev;
  const events = [];
  for (let i = 0; i < n; i++) events.push({ at: 0.05 + (0.9 * (i + 0.5)) / n, type: null });
  let closest = 0; events.forEach((e, i) => { if (Math.abs(e.at - 0.5) < Math.abs(events[closest].at - 0.5)) closest = i; });
  events[closest].at = 0.5; events[closest].type = 'arrivee';
  const must = ['choix', 'trouvaille', 'rencontre', 'marchand', 'aide', 'animal'];
  let mi = 0;
  events.forEach((e, i) => { if (!e.type) e.type = (n <= 4 ? ['choix', 'animal', 'trouvaille', 'aide'][mi++ % 4] : (mi < must.length ? must[mi++] : weightedType(k))); });
  const order = events.filter(e => e.type !== 'arrivee').map(e => e.type).sort(() => Math.random() - 0.5);
  let oi = 0; events.forEach(e => { if (e.type !== 'arrivee') e.type = order[oi++]; });
  if (hasTalent(k, 0) && k === 'pistache') events.push({ at: 0.97, type: 'trouvaille' });
  if (k === 'mochi' && hasTalent(k, 2)) events.push({ at: 0.93, type: 'pepin' });
  events.sort((a, b) => a.at - b.at);
  S.trips[k] = { id: uidGen(), comp: k, from, dest, dur: d.key, luck: d.luck + lvlLuck(k), total: d.ms, elapsed: 0, last: Date.now(), dist, events, journal: [], bag: [], photos: [], coins: 0, xp: 0, done: false, startedAt: Date.now() };
  S.trips[k].journal.push({ t: Date.now(), kind: 'depart', text: `${CHARS[k].name} boucle son sac et part pour ${dest.name}. ${dist.toLocaleString('fr-FR')} km l’attendent.` });
  plan.dest = null; save(); renderAll();
}
function rollRarity(base, luck) { let r = base; while (r < 4 && Math.random() < 0.08 * (1 + luck * 0.6) * Math.pow(0.5, r - base)) r++; return r; }
function makeItem(def, luck, place, tags, extra = {}) {
  const [name, cat, sub, base, look, color] = def;
  const rarity = extra.fixed != null ? extra.fixed : extra.special ? Math.max(base, 3) : rollRarity(base, luck);
  const it = { id: uidGen(), name, cat, sub, rarity, look: look || null, color: color || null, from: place, tags: tags || [], date: Date.now() };
  if (extra.special) it.special = true;
  if (extra.edition) it.edition = extra.edition;
  return it;
}
function lootFor(tags, luck, place, n = 1, comp = null) {
  let pool = [];
  if (POI_CATS[tags[0]] && LOOT[tags[0]]) pool = LOOT[tags[0]].slice();
  else tags.forEach(t => { if (LOOT[t]) pool = pool.concat(LOOT[t]); });
  if (season() === 'automne' && tags.some(t => ['foret', 'campagne', 'ville', 'montagne', 'parc', 'rue', 'route'].includes(t))) pool = pool.concat(SEASON_LOOT);
  if (isNight()) pool = pool.concat(NIGHT_LOOT);
  if (!pool.length) pool = LOOT.campagne;
  const water = tags.some(t => WATER.includes(t));
  if (comp === 'bulle' && water && hasTalent('bulle', 0)) n *= 2;
  if (comp === 'bulle' && water && hasTalent('bulle', 2)) luck += 1.2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const w = pool.map(d => (SEASON_LOOT.includes(d) || NIGHT_LOOT.includes(d) ? 0.25 : 1) / (1 + d[3] * 1.6));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), def = pool[0];
    for (let j = 0; j < pool.length; j++) { r -= w[j]; if (r <= 0) { def = pool[j]; break; } }
    out.push(makeItem(def, luck, place, tags));
  }
  return out;
}
function tasteOf(comp, item) { const t = FOOD_TASTE[comp]; if (t.love.includes(item.sub)) return 'love'; if (t.hate.includes(item.sub)) return 'hate'; return 'like'; }
function eventPlace(t, e) {
  if (e.type === 'arrivee' || t.dest.poi) return { ...t.dest };
  const k = e.at <= 0.5 ? e.at / 0.5 : (1 - e.at) / 0.5;
  const [lon, lat] = d3.geoInterpolate([t.from.lon, t.from.lat], [t.dest.lon, t.dest.lat])(k);
  const near = nearestPlace(lon, lat, Math.max(120, t.dist * 0.12));
  if (near && near.name !== t.from.name) return near;
  if (!isLand(lon, lat)) return { id: null, name: 'En pleine mer', lon, lat, tags: ['mer'], special: null };
  return { id: null, name: Math.abs(lat) > 60 ? 'Le grand Nord' : 'Sur la route', lon, lat, tags: Math.abs(lat) > 60 ? ['neige', 'foret'] : pick([['campagne'], ['foret'], ['campagne', 'foret']]), special: null };
}
const CHOICES = {
  montagne: { q: n => `Un col enneigé se dresse devant ${n}.`, a: ['Grimper jusqu’au sommet', 'Prendre la vallée', 'Partager le goûter d’un berger'], third: 'food' },
  neige: { q: n => `Le vent souffle fort sur la neige. ${n} hésite.`, a: ['Avancer dans la tempête', 'Attendre au refuge', 'Construire un bonhomme de neige'], third: 'photo' },
  foret: { q: n => `Des traces mystérieuses s’enfoncent sous les fougères.`, a: ['Suivre les traces', 'Rester sur le sentier', 'Écouter les oiseaux'], third: 'xp' },
  lac: { q: n => `Un ponton s’avance sur l’eau claire.`, a: ['Plonger tout au fond', 'Rester sur la rive', 'Aider un pêcheur'], third: 'coins', water: 0 },
  mer: { q: n => `Une crique se dévoile à marée basse.`, a: ['Nager jusqu’à la crique', 'Rester sur la plage', 'Aider à ranger les filets'], third: 'coins', water: 0 },
  ile: { q: n => `Une grotte marine s’ouvre dans la falaise.`, a: ['Explorer la grotte', 'Faire la sieste au soleil', 'Ramasser des coquillages'], third: 'items', water: 0 },
  ville: { q: n => `Un grand marché anime la place.`, a: ['Se faufiler dans un vieux musée', 'Flâner entre les étals', 'Jouer de la musique aux passants'], third: 'coins' },
  monument: { q: n => `Une porte entrouverte mène aux sous-sols du monument.`, a: ['Se glisser dedans', 'Suivre la visite guidée', 'Dessiner le monument'], third: 'xp' },
  desert: { q: n => `Une tempête de sable approche à l’horizon.`, a: ['Continuer coûte que coûte', 'S’abriter sous une tente', 'Suivre une caravane'], third: 'items' },
  campagne: { q: n => `Un orage gronde au-dessus des champs.`, a: ['Courir sous la pluie', 'S’abriter dans une grange', 'Aider à la récolte'], third: 'food' },
  agrumes: { q: n => `Un verger de citronniers borde le chemin.`, a: ['Grimper dans un arbre', 'Demander au fermier', 'Faire de la limonade'], third: 'coins' },
};
function autoChoice(comp, c) {
  if (comp === 'pistache') return 0;
  if (comp === 'mochi') return 1;
  if (c.water !== undefined) return 0;
  return 2;
}
function resolveChoice(t, entry, choice, auto) {
  if (entry.resolved) return;
  const c = CHOICES[entry.ctag], k = t.comp, n = CHARS[k].name, place = entry.place;
  entry.resolved = true; entry.choice = choice; entry.auto = !!auto;
  let text = '', items = [];
  if (!auto) bump('choices');
  if (choice === 0) {
    let chance = 0.6 + (k === 'pistache' ? 0.1 : 0) + (k === 'pistache' && hasTalent(k, 1) ? 0.2 : 0);
    if (k === 'mochi' && hasTalent(k, 1)) chance = 1;
    if (Math.random() < chance) {
      items = lootFor(entry.tags, t.luck + 1.5, place, 1, k);
      if (Math.random() < (k === 'pistache' && hasTalent(k, 2) ? 0.3 : 0.1)) items.push(treasureMap(place));
      text = `Audacieux et récompensé : ${n} revient avec un trésor.`; t.xp += 15;
    } else {
      const lost = Math.min(t.coins + S.coins, 5 + Math.floor(Math.random() * 12));
      t.coins -= lost; t.xp += 6;
      text = pick([`Raté ! ${n} glisse, se relève en riant et perd ${lost} pièces en route.`, `${n} se perd un moment et sème ${lost} pièces avant de retrouver son chemin.`]);
    }
  } else if (choice === 1) {
    items = lootFor(entry.tags, t.luck * 0.6, place, 1, k); t.xp += 8;
    text = pick([`${n} choisit la prudence. Une petite trouvaille quand même.`, `Tranquillement, ${n} ramasse ce qu’il trouve.`]);
  } else {
    t.xp += 10;
    switch (c.third) {
      case 'coins': { const g = 15 + Math.floor(Math.random() * 30); t.coins += g; text = `${n} donne un coup de main et gagne ${g} pièces.`; break; }
      case 'food': { let pool = []; entry.tags.forEach(tg => (LOOT[tg] || []).forEach(d => { if (d[1] === 'n') pool.push(d); })); if (!pool.length) pool = LOOT.campagne.filter(d => d[1] === 'n'); items = [makeItem(pick(pool), t.luck, place, entry.tags), makeItem(pick(pool), t.luck, place, entry.tags)]; text = `Un vrai festin ! ${n} repart avec de quoi grignoter.`; break; }
      case 'xp': t.xp += 30; text = `${n} prend le temps d’observer. Il apprend beaucoup (+30 expérience).`; break;
      case 'photo': { const p = { id: uidGen(), comps: [k], tags: entry.tags, place, country: '', hour: new Date().getHours(), weather: 'neige', title: `${n} et son bonhomme de neige`, date: Date.now(), snowman: true }; t.photos.push(p); entry.photo = p; text = `Le plus beau bonhomme de neige du monde. Photo souvenir !`; break; }
      case 'items': items = lootFor(entry.tags, t.luck, place, 2, k); text = `${n} remplit ses poches de petites merveilles.`; break;
    }
  }
  t.bag.push(...items);
  entry.outcome = (auto ? `${n} a décidé tout seul : « ${c.a[choice]} ». ` : '') + text; entry.items = items;
}
function treasureMap(place) {
  const locked = SECRETS.filter(s => !S.secrets.includes(s.key));
  const s = locked.length ? pick(locked) : pick(SECRETS);
  return { id: uidGen(), name: `Carte au trésor : ${s.name}`, cat: 't', sub: s.key, rarity: 3, from: place, tags: [], date: Date.now() };
}
function fireEvent(t, e) {
  const k = t.comp, n = CHARS[k].name, place = eventPlace(t, e), pName = place.name, tags = place.tags || ['campagne'], now = Date.now();
  const J = o => { t.journal.push({ t: now, place: pName, tags, ...o }); S.unseen[k] = (S.unseen[k] || 0) + 1; };
  const photo = (comps, title, extra = {}) => { const p = { id: uidGen(), comps, tags, place: pName, country: place.country || '', hour: new Date().getHours(), weather: pickWeather(tags), title, date: now, ...extra }; t.photos.push(p); return p; };
  switch (e.type) {
    case 'arrivee': {
      const items = lootFor(tags, t.luck + 0.5, pName, place.poi ? 3 : 2, k);
      if (place.secret) {
        const s = SECRETS.find(x => x.key === place.secret);
        s.loot.forEach(d => items.push(makeItem(d, 0, pName, tags, { fixed: 4, special: true, edition: S.found[s.name] ? null : 'Édition originale' })));
      } else if (place.special && (!S.found[pName] || Math.random() < (place.poi ? 0.08 : 0.3) + t.luck * 0.1)) items.push(makeItem(place.special, t.luck, pName, tags, { special: true, edition: S.found[pName] ? null : 'Édition originale' }));
      t.bag.push(...items); t.xp += 20;
      const p = photo([k], pName);
      J({ kind: 'photo', text: place.secret ? `${n} a trouvé ${pName} ! Personne ne croira ce qu’il a vu.` : pick([`${n} est arrivé à ${pName} ! Regarde-moi cette vue.`, `Bien arrivé à ${pName}. ${n} t’envoie une carte postale.`]), photo: p, items });
      break;
    }
    case 'decouverte': {
      const items = lootFor(tags, t.luck, pName, 1, k);
      if (place.special && Math.random() < 0.08 + t.luck * 0.05) items.push(makeItem(place.special, t.luck, pName, tags, { special: true }));
      t.bag.push(...items); t.xp += 8;
      J({ kind: 'photo', text: pick([`Petit détour par ${pName}.`, `${n} fait une pause à ${pName}.`, `Halte à ${pName}, ${n} sourit pour la photo.`]), photo: photo([k], pName), items });
      break;
    }
    case 'trouvaille': {
      const items = lootFor(tags, t.luck, pName, 1, k); t.bag.push(...items); t.xp += 5;
      J({ kind: 'trouvaille', text: place.id == null ? `${n} a trouvé quelque chose au bord du chemin.` : `${n} a trouvé quelque chose au bord du chemin, près de ${pName}.`, items });
      break;
    }
    case 'repas': {
      let pool = []; tags.forEach(tg => (LOOT[tg] || []).forEach(d => { if (d[1] === 'n') pool.push(d); }));
      if (!pool.length) pool = LOOT.ville.filter(d => d[1] === 'n');
      const it = makeItem(pick(pool), t.luck, pName, tags), taste = tasteOf(k, it);
      t.bag.push(it); t.xp += 5;
      J({ kind: 'repas', text: { love: `${n} goûte ${it.name.toLowerCase()} et pousse un cri de joie. Il en garde pour toi !`, like: `${n} goûte ${it.name.toLowerCase()}. Pas mal du tout ! Il en rapporte.`, hate: `${n} goûte ${it.name.toLowerCase()} et fait une grimace. Il le garde pour un ami.` }[taste], items: [it] });
      break;
    }
    case 'rencontre': { const pl = pick(PLAYERS); J({ kind: 'rencontre', text: `${n} croise ${pl[1]}, le compagnon de ${pl[0]}, qui voyage aussi par ici.`, other: pl, pending: true }); break; }
    case 'choix': { const ctag = tags.find(tg => CHOICES[tg]) || 'campagne'; J({ kind: 'choix', text: CHOICES[ctag].q(n), ctag, pending: true }); break; }
    case 'marchand': {
      const offers = lootFor(tags, t.luck + 1, pName, 2).map(it => { it.rarity = Math.max(it.rarity, 1); return { item: it, price: Math.round(value(it) * (k === 'mochi' && hasTalent(k, 0) ? 0.7 : 1)) }; });
      J({ kind: 'marchand', text: `Un marchand ambulant déballe ses trésors devant ${n}.`, offers, pending: true });
      break;
    }
    case 'aide': { const h = pick(HELPS); J({ kind: 'aide', text: h[0], help: h, pending: true }); break; }
    case 'animal': {
      const tg = tags.find(x => ANIMALS[x]) || 'campagne', a = ANIMALS[tg];
      let text = `${n} rencontre ${a[0]}. ${a[1].replace('{n}', n)}`;
      if (tg === 'ville' && k === 'pistache') text = `Un pigeon ! ${n} se cache derrière un lampadaire jusqu’à ce qu’il s’envole.`;
      const items = Math.random() < 0.55 ? lootFor(tags, t.luck, pName, 1, k) : [];
      t.bag.push(...items); t.xp += 6;
      J({ kind: 'animal', text: text + (items.length ? ' Il laisse un petit cadeau.' : ''), items });
      break;
    }
    case 'meteo': {
      const night = isNight(), roll = Math.random();
      let text, items = [];
      if (night && roll < 0.6) { text = `Une étoile filante traverse le ciel au-dessus de ${n}. Il fait un vœu… et trouve de la poussière d’étoile.`; items = [makeItem(WONDERS.etoile, t.luck, pName, tags)]; }
      else if (roll < 0.55) { text = `Après l’averse, un arc-en-ciel immense apparaît. ${n} court jusqu’à son pied !`; items = [makeItem(WONDERS.arc, t.luck, pName, tags)]; }
      else { text = `Un orage éclate. ${n} s’abrite et recueille une goutte d’orage scintillante.`; items = [makeItem(WONDERS.orage, t.luck, pName, tags)]; }
      t.bag.push(...items); t.xp += 10;
      J({ kind: 'merveille', text, items, photo: photo([k], pName, { weather: night ? 'etoile' : roll < 0.55 ? 'arc' : 'pluie' }) });
      break;
    }
    case 'pieces': { const g = 10 + Math.floor(Math.random() * 25 * (1 + t.luck * 0.4)); t.coins += g; J({ kind: 'pieces', text: pick([`${n} trouve ${g} pièces au fond d’une fontaine.`, `${g} pièces brillent dans l’herbe. ${n} les ramasse.`, `${n} vend un dessin à un passant pour ${g} pièces.`]), gain: g }); break; }
    case 'tresor': { const m = treasureMap(pName); t.bag.push(m); t.xp += 10; J({ kind: 'tresor', text: `Dans une vieille bouteille, ${n} trouve une carte au trésor !`, items: [m] }); break; }
    case 'pepin': { const items = lootFor(['campagne', 'foret'], t.luck + 0.5, 'Avec Pépin', 1, k); t.bag.push(...items); J({ kind: 'animal', text: `Pépin, le petit oiseau de ${n}, le rejoint et lui apporte un cadeau.`, items }); break; }
  }
}
function resolveMeeting(t, entry, opt, auto) {
  if (entry.resolved) return;
  entry.resolved = true; entry.choice = opt;
  const k = t.comp, n = CHARS[k].name, other = entry.other;
  if (opt === 0) {
    const give = t.bag.filter(i => i.rarity <= 1 && i.cat !== 't')[0];
    const got = lootFor(entry.tags, t.luck + 1, entry.place, 1)[0]; got.rarity = Math.max(got.rarity, 1);
    if (give) t.bag.splice(t.bag.indexOf(give), 1);
    t.bag.push(got); entry.items = [got];
    entry.outcome = give ? `Échange réussi : ${n} donne « ${give.name} » et reçoit « ${got.name} ».` : `${other[1]} offre « ${got.name} » à ${n}, qui promet de lui rendre la pareille.`;
  } else if (opt === 1) {
    const p = { id: uidGen(), comps: [k, other[2]], otherName: other[1], tags: entry.tags, place: entry.place, country: '', hour: new Date().getHours(), weather: pickWeather(entry.tags), title: `${n} et ${other[1]}`, date: Date.now() };
    t.photos.push(p); entry.photo = p; entry.outcome = `Photo souvenir avec ${other[1]} !`; t.xp += 8;
  } else {
    const water = entry.tags.some(x => WATER.includes(x));
    const win = Math.random() < (k === 'bulle' && water ? 0.85 : k === 'pistache' ? 0.6 : 0.45);
    if (win) { const g = 25; t.coins += g; entry.outcome = `Course effrénée… ${n} gagne et empoche ${g} pièces !`; }
    else entry.outcome = `${other[1]} gagne la course de justesse. ${n} rit quand même.`;
    t.xp += 12;
  }
  if (!auto) bump('choices');
  if (auto) entry.outcome = `${n} a décidé tout seul. ` + entry.outcome;
}
function resolveMerchant(t, entry, idx, auto) {
  if (entry.resolved) return;
  if (idx == null) { entry.resolved = true; entry.outcome = auto ? `${CHARS[t.comp].name} salue le marchand et reprend la route.` : 'Pas d’achat cette fois.'; return; }
  const o = entry.offers[idx];
  if (o.bought || S.coins < o.price) return;
  S.coins -= o.price; o.bought = true; t.bag.push(o.item); entry.items = (entry.items || []).concat([o.item]);
  if (entry.offers.every(x => x.bought)) { entry.resolved = true; entry.outcome = 'Tout acheté !'; }
}
function resolveHelp(t, entry, yes, auto) {
  if (entry.resolved) return;
  entry.resolved = true; const n = CHARS[t.comp].name;
  if (yes) {
    const it = makeItem(entry.help[2], t.luck, entry.place, entry.tags, { fixed: Math.max(entry.help[2][3], rollRarity(entry.help[2][3], t.luck)) });
    t.bag.push(it); entry.items = [it]; t.xp += 30; const g = 10 + Math.floor(Math.random() * 20); t.coins += g;
    entry.outcome = `${n} donne un coup de main. En remerciement : « ${it.name} » et ${g} pièces.`;
    bump('help');
  } else entry.outcome = `${n} s’excuse et poursuit sa route.`;
  if (auto) entry.outcome = `${n} a décidé tout seul. ` + entry.outcome;
}
function autoResolve(t) {
  for (const j of t.journal) {
    if (!j.pending || j.resolved) continue;
    if (j.kind === 'choix') resolveChoice(t, j, autoChoice(t.comp, CHOICES[j.ctag]), true);
    if (j.kind === 'rencontre') resolveMeeting(t, j, t.comp === 'bulle' ? 2 : t.comp === 'mochi' ? 1 : 0, true);
    if (j.kind === 'marchand') resolveMerchant(t, j, null, true);
    if (j.kind === 'aide') resolveHelp(t, j, true, true);
  }
}
function tick(dtReal) {
  let changed = false;
  for (const [k, t] of Object.entries(S.trips)) {
    if (!t || t.done) continue;
    t.elapsed += dtReal * (fast && k === S.sel ? 30 : 1); t.last = Date.now();
    for (const e of t.events) if (!e.fired && t.elapsed / t.total >= e.at) { autoResolve(t); e.fired = true; fireEvent(t, e); changed = true; }
    if (t.elapsed >= t.total) {
      autoResolve(t); t.done = true;
      t.journal.push({ t: Date.now(), kind: 'retour', text: `${CHARS[k].name} est rentré à la maison, le sac plein !` });
      S.unseen[k] = (S.unseen[k] || 0) + 1; changed = true;
    }
  }
  // ventes au marché
  const now = Date.now();
  for (const m of S.market.mine) {
    if (!m.sold && m.sellAt && now >= m.sellAt) { m.sold = true; gainCoins(m.price); S.stats.sold++; bump('sell'); toast(`${m.buyer} a acheté « ${m.item.name} » pour ${m.price} pièces !`); changed = true; }
  }
  if (changed) S.market.mine = S.market.mine.filter(m => !m.sold || now - m.sellAt < 3600e3);
  return changed;
}
function collect() {
  const k = S.sel, t = S.trips[k]; if (!t) return;
  t.bag.forEach(i => { S.dex[i.name] = true; if (i.special) S.found[i.from] = true; });
  if (t.dest.secret) S.found[t.dest.name] = true;
  S.inv.push(...t.bag);
  S.album.push(...t.photos.map(p => ({ ...p, comp: k })));
  if (t.coins) gainCoins(t.coins);
  const dd = DURS.find(x => x.key === t.dur) || DURS[0];
  const xp = Math.min(520, Math.round((t.xp + 15 + Math.floor(t.dist / 400)) * (1 + dd.luck * 0.4)));
  const gained = addXP(k, xp);
  S.stats.trips++;
  if (t.dest.poi) S.stats.poiTrips = (S.stats.poiTrips || 0) + 1;
  bump('visit', 1, t.dest.tags);
  t.bag.forEach(i => { if (i.tags && i.tags.length) bump('items_tag', 1, i.tags); if (i.rarity >= 2) bump('rare'); });
  bump('postcards', t.photos.length);
  S.trips[k] = null; S.unseen[k] = 0; fast = false;
  save(); tab = 'sac'; renderAll();
  toast(`${t.bag.length} objets rangés${t.coins > 0 ? `, ${t.coins} pièces gagnées` : ''}, +${gained} expérience.`);
}

// ================= CARTES POSTALES =================
function pickWeather(tags) {
  const s = season();
  if (tags.includes('neige') || (s === 'hiver' && tags.includes('montagne'))) return Math.random() < 0.5 ? 'neige' : 'soleil';
  if (tags.includes('desert')) return 'soleil';
  return pick(['soleil', 'soleil', 'nuages', 'pluie']);
}
function postcardSVG(p, uid) {
  const h = p.hour, night = h < 6 || h >= 21 || p.weather === 'etoile', dusk = (h >= 18 && h < 21) || (h >= 6 && h < 8);
  const sky = night ? '#2f3d6b' : dusk ? '#f5c1a5' : p.weather === 'pluie' ? '#bcc8d4' : '#bfe1f2';
  const BASES = ['montagne', 'neige', 'lac', 'mer', 'ile', 'foret', 'ville', 'monument', 'desert', 'campagne'];
  const t0 = (p.tags || []).find(x => BASES.includes(x)) || 'campagne', L = '#5b4636';
  let s = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="200" fill="${sky}"/>`;
  if (night) for (let i = 0; i < 18; i++) s += `<circle cx="${(i * 53) % 320}" cy="${(i * 29) % 90}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity=".8"/>`;
  if (p.weather === 'etoile') s += `<path d="M40 20 L130 60" stroke="#fff6c9" stroke-width="2.4" stroke-linecap="round"/><path d="${starPath(132, 61, 7)}" fill="#fff6c9"/>`;
  if (p.weather === 'arc') ['#f29a8a', '#f6c46b', '#f6e08a', '#a6d88f', '#8cc7e8', '#b9a6e6'].forEach((c, i) => { s += `<path d="M30 ${190} A${130 - i * 9} ${130 - i * 9} 0 0 1 ${290 - i * 0} 190" fill="none" stroke="${c}" stroke-width="9" opacity=".75" transform="translate(${i * 9} 0)"/>`; });
  if (p.weather === 'soleil' || night) s += `<circle cx="262" cy="42" r="${night ? 14 : 20}" fill="${night ? '#f4efd2' : dusk ? '#f7a96b' : '#fbd76a'}"/>`;
  if (p.weather === 'nuages' || p.weather === 'pluie') s += `<g fill="#fff" opacity=".9"><ellipse cx="80" cy="40" rx="34" ry="13"/><ellipse cx="104" cy="32" rx="24" ry="14"/><ellipse cx="220" cy="54" rx="30" ry="11"/></g>`;
  switch (t0) {
    case 'montagne': case 'neige':
      s += `<path d="M-10 150 L70 60 L120 112 L170 44 L250 130 L290 90 L340 150Z" fill="${t0 === 'neige' ? '#dbe7f2' : '#9aa8bf'}" stroke="${L}" stroke-width="1.5"/><path d="M58 74 L70 60 L82 74 L74 70 L70 76 L64 70Z M157 60 L170 44 L184 60 L176 56 L170 62 L163 56Z" fill="#fff"/><rect y="146" width="320" height="54" fill="${t0 === 'neige' ? '#f4f7fb' : '#a9cf8f'}"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${20 + i * 56} 160 l9 -26 l9 26Z" fill="#5f9a6a" stroke="${L}" stroke-width="1"/>`;
      break;
    case 'lac':
      s += `<path d="M-10 120 C60 80 120 96 170 84 S270 70 330 104 V130 H-10Z" fill="#9fc79a" stroke="${L}" stroke-width="1.4"/><rect y="124" width="320" height="76" fill="#7fb6d9"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${20 + i * 52} ${140 + (i % 2) * 14} h24" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>`;
      break;
    case 'mer': case 'ile':
      s += `<rect y="110" width="320" height="46" fill="#5fa3c9"/>`;
      for (let i = 0; i < 7; i++) s += `<path d="M${10 + i * 46} ${122 + (i % 2) * 12} q8 -6 16 0 q8 6 16 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`;
      s += `<path d="M-10 150 C80 140 200 160 330 146 V200 H-10Z" fill="#f2deb0" stroke="${L}" stroke-width="1.4"/>`;
      if (t0 === 'ile') s += `<path d="M262 160 C258 128 262 104 270 90" stroke="#8a6448" stroke-width="5" fill="none"/><path d="M270 90 c-18 -8 -30 4 -34 10 M270 90 c14 -14 30 -6 34 2 M270 90 c-4 -16 8 -24 16 -24" stroke="#5f9a6a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      break;
    case 'foret':
      s += `<rect y="130" width="320" height="70" fill="#8fbf7f"/>`;
      for (let i = 0; i < 9; i++) { const x = i * 38 - 6, y = 130 - (i % 3) * 8; s += i % 2 ? `<circle cx="${x}" cy="${y - 24}" r="26" fill="${season() === 'automne' ? ['#e0954f', '#d9733f', '#e8b04b'][i % 3] : '#6fae7d'}" stroke="${L}" stroke-width="1.2"/><rect x="${x - 3}" y="${y - 4}" width="6" height="14" fill="#8a6448"/>` : `<path d="M${x} ${y - 60} l22 64 h-44Z" fill="#4f8a5f" stroke="${L}" stroke-width="1.2"/>`; }
      break;
    case 'ville': case 'monument':
      for (let i = 0; i < 8; i++) { const w = 34 + (i * 7) % 18, hh = 50 + (i * 23) % 50, x = i * 42 - 10; s += `<rect x="${x}" y="${150 - hh}" width="${w}" height="${hh}" fill="${['#e9b9a0', '#d9c6e8', '#f2d48f', '#b8d8f0'][i % 4]}" stroke="${L}" stroke-width="1.2"/><path d="M${x - 2} ${150 - hh} L${x + w / 2} ${138 - hh} L${x + w + 2} ${150 - hh}Z" fill="#c9604f" stroke="${L}" stroke-width="1.2"/>`; for (let r = 0; r < 3; r++) s += `<rect x="${x + 6}" y="${158 - hh + r * 14}" width="7" height="8" fill="${night ? '#f6d36b' : '#fff8ec'}"/><rect x="${x + w - 13}" y="${158 - hh + r * 14}" width="7" height="8" fill="${night ? '#f6d36b' : '#fff8ec'}"/>`; }
      if (t0 === 'monument') s += `<path d="M120 150 V92 Q160 52 200 92 V150 H184 V104 Q160 80 136 104 V150Z" fill="#e8d6ae" stroke="${L}" stroke-width="1.6"/>`;
      s += `<rect y="148" width="320" height="52" fill="#cfc6b8"/>`;
      break;
    case 'desert':
      s += `<path d="M-10 150 C60 110 130 120 180 140 S280 112 330 130 V200 H-10Z" fill="#ecc27e" stroke="${L}" stroke-width="1.4"/><path d="M-10 170 C80 150 160 176 330 160 V200 H-10Z" fill="#e3ad62"/>`;
      break;
    default:
      s += `<path d="M-10 130 C80 112 200 136 330 118 V200 H-10Z" fill="#b7d38a" stroke="${L}" stroke-width="1.4"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M-10 ${150 + i * 10} C80 ${140 + i * 10} 200 ${160 + i * 10} 330 ${144 + i * 10}" stroke="${['#e7cd6a', '#9cc06a'][i % 2]}" stroke-width="6" fill="none"/>`;
  }
  if (p.weather === 'pluie') for (let i = 0; i < 26; i++) s += `<path d="M${(i * 37) % 320} ${(i * 23) % 140} l-4 10" stroke="#6f8fb0" stroke-width="1.6" opacity=".7"/>`;
  if (p.weather === 'neige') for (let i = 0; i < 26; i++) s += `<circle cx="${(i * 41) % 320}" cy="${(i * 19) % 150}" r="2" fill="#fff"/>`;
  if (p.snowman) s += `<circle cx="80" cy="168" r="20" fill="#fff" stroke="${L}" stroke-width="1.4"/><circle cx="80" cy="136" r="14" fill="#fff" stroke="${L}" stroke-width="1.4"/><path d="M80 138 l10 3 l-10 2Z" fill="#f2a05a"/><circle cx="75" cy="132" r="1.6" fill="${L}"/><circle cx="84" cy="132" r="1.6" fill="${L}"/><rect x="69" y="146" width="22" height="5" rx="2" fill="#d96b5f"/>`;
  const comps = p.comps || [];
  comps.forEach((k, i) => {
    const w = 96, x = comps.length === 1 ? (p.snowman ? 150 : 112) : 70 + i * 92;
    const o = i === 0 ? (S.outfits[k] || CHARS[k].outfit) : CHARS[k].outfit;
    s += drawChar(k, o, i === 0 ? 'rire' : 'content', uid + 'c' + i).replace('<svg ', `<svg x="${x}" y="${200 - w * 1.06}" width="${w}" height="${w * 1.1}" `);
  });
  s += `<rect x="252" y="146" width="56" height="44" fill="#fffaf0" stroke="#c9604f" stroke-width="1.5" stroke-dasharray="3 2"/><text x="280" y="166" text-anchor="middle" font-family="Caveat,cursive" font-size="13" fill="#c9604f">${esc((p.place || '').slice(0, 10))}</text><text x="280" y="181" text-anchor="middle" font-family="Caveat,cursive" font-size="11" fill="#c9604f">${new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</text>`;
  return s + `</svg>`;
}

// ================= ICÔNES =================
function decorArt(kind, c, L = '#5b4636') {
  switch (kind) {
    case 'plante': return `<path d="M28 74 L32 98 H68 L72 74Z" fill="#d98763" stroke="${L}" stroke-width="2"/><rect x="25" y="68" width="50" height="9" rx="3" fill="#e9a07a" stroke="${L}" stroke-width="2"/><path d="M50 68 C48 50 40 40 26 36 C32 50 40 58 50 68Z M50 68 C52 46 60 30 76 26 C72 46 62 58 50 68Z M50 68 C50 50 50 30 48 14 C58 30 56 52 50 68Z" fill="${c}" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>`;
    case 'tapis': return `<ellipse cx="50" cy="50" rx="48" ry="18" fill="${c}" stroke="${L}" stroke-width="2"/><ellipse cx="50" cy="50" rx="36" ry="12" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><ellipse cx="50" cy="50" rx="22" ry="7" fill="none" stroke="${L}" stroke-width="1.2" opacity=".5"/>`;
    case 'lanterne': return `<rect x="34" y="88" width="32" height="8" rx="3" fill="#8a6448" stroke="${L}" stroke-width="2"/><rect x="38" y="38" width="24" height="50" rx="6" fill="${c}" stroke="${L}" stroke-width="2"/><circle cx="50" cy="62" r="8" fill="#fff8d0"/><path d="M40 38 L50 26 L60 38Z" fill="#8a6448" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M50 26 V18" stroke="${L}" stroke-width="2"/><circle cx="50" cy="62" r="18" fill="${c}" opacity=".25"/>`;
    case 'lampe': return `<path d="M42 96 H58 L54 60 H46Z" fill="#c9a97a" stroke="${L}" stroke-width="2"/><path d="M50 20 L72 46 L50 64 L28 46Z" fill="${c}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M28 46 H72 M50 20 L44 46 L50 64 L56 46Z" fill="none" stroke="${L}" stroke-width="1.2"/><circle cx="50" cy="44" r="26" fill="${c}" opacity=".25"/>`;
    case 'bocal': return `<rect x="26" y="30" width="48" height="62" rx="12" fill="#e8f4f8" fill-opacity=".7" stroke="${L}" stroke-width="2"/><rect x="30" y="22" width="40" height="10" rx="3" fill="#c9a97a" stroke="${L}" stroke-width="2"/><path d="M34 80 c4 -10 12 -10 16 0Z M52 84 c4 -12 14 -12 16 0Z M40 66 c4 -8 10 -8 12 0Z" fill="${c}" stroke="${L}" stroke-width="1.4"/>`;
    case 'herbier': return `<rect x="10" y="12" width="80" height="76" rx="3" fill="#c9a97a" stroke="${L}" stroke-width="2"/><rect x="18" y="20" width="64" height="60" fill="#f7eedb"/><path d="M50 74 C48 56 40 46 30 40 C36 54 42 64 50 74Z M50 74 C52 54 62 40 72 34 C68 54 60 64 50 74Z" fill="${c}" stroke="${L}" stroke-width="1.4"/><circle cx="34" cy="30" r="5" fill="#f3aec1" stroke="${L}" stroke-width="1.2"/>`;
    case 'mappemonde': return `<path d="M36 96 H64 M50 96 V80" stroke="${L}" stroke-width="3" stroke-linecap="round"/><path d="M22 52 A28 28 0 1 0 78 52" fill="none" stroke="#b08a5a" stroke-width="3"/><circle cx="50" cy="48" r="24" fill="#9cc8e2" stroke="${L}" stroke-width="2"/><path d="M36 38 c6 -4 12 2 10 8 c-2 6 -10 4 -12 10 M58 34 c6 2 8 10 2 14 c-4 2 -2 8 4 10" fill="#cfe2a8" stroke="${L}" stroke-width="1.2"/>`;
    case 'cheminee': return `<rect x="8" y="26" width="84" height="72" fill="${c}" stroke="${L}" stroke-width="2"/><rect x="4" y="20" width="92" height="10" rx="2" fill="#8a6448" stroke="${L}" stroke-width="2"/><path d="M26 98 V60 Q50 40 74 60 V98Z" fill="#3b2f2a"/><path d="M42 98 C38 84 46 76 50 70 C54 78 62 84 58 98Z" fill="#f2a05a"/><path d="M46 98 C44 90 48 86 50 82 C52 86 56 90 54 98Z" fill="#f6d36b"/>${[34, 50, 66].map(y => `<path d="M8 ${y} H26 M74 ${y} H92" stroke="${L}" stroke-width="1" opacity=".5"/>`).join('')}`;
    case 'statue': return `<rect x="30" y="76" width="40" height="20" rx="3" fill="#c9b8a6" stroke="${L}" stroke-width="2"/><path d="M38 76 C34 60 40 48 50 46 C60 48 66 60 62 76Z" fill="${c}" stroke="${L}" stroke-width="2"/><circle cx="50" cy="36" r="12" fill="${c}" stroke="${L}" stroke-width="2"/><path d="M40 28 L44 18 L48 26 M52 26 L56 18 L60 28" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>`;
    default: return `<rect x="20" y="20" width="60" height="60" rx="8" fill="${c}" stroke="${L}" stroke-width="2"/>`;
  }
}
function itemIcon(it) {
  const L = '#5b4636', c = it.color || '#e9c46a';
  if (it.cat === 'd') return `<svg viewBox="0 0 100 100">${decorArt(it.sub, c)}</svg>`;
  if (it.cat === 't') return `<svg viewBox="0 0 40 40"><path d="M5 9 L14 6 L26 10 L35 7 V31 L26 34 L14 30 L5 33Z" fill="#efe2c4" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 26 q6 -10 12 -4 q4 4 8 -6" fill="none" stroke="#c9604f" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M27 13 l4 4 M31 13 l-4 4" stroke="#c9604f" stroke-width="2" stroke-linecap="round"/></svg>`;
  if (it.cat === 'v') {
    switch (it.sub) {
      case 'tete': return it.look === 'couronne' ? `<svg viewBox="0 0 40 40"><path d="M6 30 V12 L13 20 L20 8 L27 20 L34 12 V30Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="20" cy="24" r="2.6" fill="#f08aa0"/></svg>` : `<svg viewBox="0 0 40 40"><path d="M7 28 C7 6 33 6 33 28Z" fill="${c}" stroke="${L}" stroke-width="1.6"/><rect x="5" y="25" width="30" height="7" rx="3" fill="${c}" stroke="${L}" stroke-width="1.6"/></svg>`;
      case 'cou': return `<svg viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="9" rx="4.5" fill="${c}" stroke="${L}" stroke-width="1.6"/><rect x="20" y="16" width="8" height="18" rx="3" fill="${c}" stroke="${L}" stroke-width="1.6"/></svg>`;
      case 'haut': return `<svg viewBox="0 0 40 40"><path d="M12 7 L4 14 L9 20 L12 17 V34 H28 V17 L31 20 L36 14 L28 7 Q20 12 12 7Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
      case 'bas': return `<svg viewBox="0 0 40 40"><path d="M8 9 H32 L34 33 H23 L20 19 L17 33 H6Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
      case 'mains': return `<svg viewBox="0 0 40 40"><path d="M12 33 V18 C12 10 28 10 28 18 V33Z" fill="${c}" stroke="${L}" stroke-width="1.6"/><ellipse cx="9" cy="20" rx="4" ry="6" fill="${c}" stroke="${L}" stroke-width="1.6"/></svg>`;
      case 'pieds': return `<svg viewBox="0 0 40 40"><path d="M13 6 H24 V24 L33 26 C36 27 36 34 32 34 H11 C9 34 9 30 10 28 L13 24Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
      default: return it.look === 'cape' ? `<svg viewBox="0 0 40 40"><path d="M14 6 H26 L34 34 H6Z" fill="${c}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="20" cy="8" r="2.6" fill="#f6d36b" stroke="${L}" stroke-width="1"/></svg>` : `<svg viewBox="0 0 40 40"><rect x="9" y="11" width="22" height="24" rx="7" fill="${c}" stroke="${L}" stroke-width="1.6"/><path d="M14 11 Q20 2 26 11" fill="none" stroke="${L}" stroke-width="1.6"/></svg>`;
    }
  }
  if (it.cat === 'n') {
    const col = it.color || { pomme: '#e5584f', fruit: '#7a5fb8', agrume: '#f2a93b', mer: '#f08a7a', fromage: '#f2d06b', sucre: '#d9a36b', pain: '#e3b06b', plat: '#d9733f', legume: '#e5584f', glace: '#f6a6b8', boisson: '#c99a6a' }[it.sub] || '#d9a36b';
    if (it.sub === 'pain') return `<svg viewBox="0 0 40 40"><path d="M4 24 C4 12 36 12 36 24 C36 29 4 29 4 24Z" fill="${col}" stroke="${L}" stroke-width="1.6"/><path d="M12 17 l3 6 M19 16 l3 6 M26 17 l3 6" stroke="${L}" stroke-width="1.3" opacity=".6"/></svg>`;
    if (it.sub === 'glace') return `<svg viewBox="0 0 40 40"><circle cx="20" cy="14" r="9" fill="${col}" stroke="${L}" stroke-width="1.6"/><path d="M11 17 L20 37 L29 17Z" fill="#e3b06b" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="16" cy="11" r="2.4" fill="#fff" opacity=".6"/></svg>`;
    if (it.sub === 'boisson') return `<svg viewBox="0 0 40 40"><path d="M7 14 H28 V24 C28 32 7 32 7 24Z" fill="#fffaf0" stroke="${L}" stroke-width="1.6"/><path d="M9 16 H26 V20 H9Z" fill="${col}"/><path d="M28 17 h3 a3 3 0 0 1 0 6 h-3" fill="none" stroke="${L}" stroke-width="1.6"/><path d="M14 5 q3 3 0 6 M20 5 q3 3 0 6" stroke="${L}" stroke-width="1.4" fill="none" opacity=".6"/></svg>`;
    if (it.sub === 'legume') return `<svg viewBox="0 0 40 40"><path d="M10 34 L30 14 C33 11 31 7 28 8 C24 9 16 20 10 34Z" fill="${col}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M28 9 q4 -6 8 -4 M29 11 q6 -2 7 2" stroke="#6faf4f" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;
    if (it.sub === 'plat') return `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="16" ry="7" fill="#fffaf0" stroke="${L}" stroke-width="1.6"/><path d="M8 24 C10 13 30 13 32 24Z" fill="${col}" stroke="${L}" stroke-width="1.6"/></svg>`;
    if (it.rarity >= 2 && /Tarte|Soupe|Salade|Confiture/.test(it.name)) return `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="15" ry="7" fill="#fffaf0" stroke="${L}" stroke-width="1.6"/><path d="M8 24 C10 14 30 14 32 24Z" fill="${col}" stroke="${L}" stroke-width="1.6"/><path d="M14 18 q3 -3 6 0 q3 3 6 0" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/></svg>`;
    if (it.sub === 'fromage') return `<svg viewBox="0 0 40 40"><path d="M6 28 L32 12 L34 28Z" fill="${col}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="24" cy="22" r="2.4" fill="#e3b94a"/><circle cx="16" cy="25" r="1.8" fill="#e3b94a"/></svg>`;
    if (it.sub === 'mer') return `<svg viewBox="0 0 40 40"><path d="M8 20 C14 10 26 10 30 20 C26 30 14 30 8 20Z M30 20 L36 14 V26Z" fill="${col}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="14" cy="18" r="1.6" fill="${L}"/></svg>`;
    if (it.sub === 'sucre') return `<svg viewBox="0 0 40 40"><path d="M6 24 C8 12 32 12 34 24 L30 30 H10Z" fill="${col}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 20 q4 -3 8 0 q4 3 8 0" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/></svg>`;
    return `<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="12" fill="${col}" stroke="${L}" stroke-width="1.6"/><path d="M20 10 q6 -6 10 -2 q-4 4 -10 2Z" fill="#7fbf6a" stroke="${L}" stroke-width="1.2"/><circle cx="15" cy="18" r="3" fill="#fff" opacity=".45"/></svg>`;
  }
  const mc = it.color || { farine: '#f4efe2', metal: '#b5bcc2', verre: '#bfe3f6', bois: '#c99a6a', tissu: '#e9a0a0', plastique: '#7fc4d9', cristal: '#a9d4ef', flocon: '#cfe8f7', perle: '#f7d5df', lumiere: '#f6e08a', lune: '#efe8c4', eclat: '#d9c38f', scarabee: '#e9b93a', corail: '#f29a8a', fleur: '#cdb8ea', feuille: '#e0884a', mousse: '#8fbf6a', champignon: '#e9b04b', plume: '#f4f1ea', coquillage: '#f6cdb8', pierre: '#c99a7a', sable: '#f2cf9a', papier: '#efe2c4', medaille: '#e3b94a', masque: '#e07a9a', eventail: '#e3605f', laine: '#efe6d2', graine: '#a9784f', ble: '#e7c46a' }[it.sub] || '#cbbfa8';
  const shapes = {
    gem: `<path d="M20 5 L33 16 L20 35 L7 16Z" fill="${mc}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 16 H33 M20 5 L15 16 L20 35 L25 16Z" fill="none" stroke="${L}" stroke-width="1"/>`,
    leaf: `<path d="M8 32 C8 14 22 6 34 6 C34 20 26 34 8 32Z" fill="${mc}" stroke="${L}" stroke-width="1.6"/><path d="M8 32 L26 14" stroke="${L}" stroke-width="1.2"/>`,
    shell: `<path d="M6 30 C6 12 34 12 34 30Z" fill="${mc}" stroke="${L}" stroke-width="1.6"/><path d="M20 30 V16 M13 30 L10 18 M27 30 L30 18" stroke="${L}" stroke-width="1.1"/>`,
    feather: `<path d="M10 34 C12 18 22 8 32 6 C30 18 22 28 10 34Z" fill="${mc}" stroke="${L}" stroke-width="1.6"/><path d="M10 34 L28 10" stroke="${L}" stroke-width="1.1"/>`,
    paper: `<rect x="8" y="9" width="24" height="22" rx="2" fill="${mc}" stroke="${L}" stroke-width="1.6" transform="rotate(-6 20 20)"/><path d="M13 16 H27 M13 21 H25 M13 26 H22" stroke="${L}" stroke-width="1.1" transform="rotate(-6 20 20)"/>`,
    spark: `<path d="M20 4 Q22 18 36 20 Q22 22 20 36 Q18 22 4 20 Q18 18 20 4Z" fill="${mc}" stroke="${L}" stroke-width="1.6"/>`,
    stone: `<path d="M7 26 C5 16 14 9 22 10 C31 11 36 20 32 28 C28 34 12 34 7 26Z" fill="${mc}" stroke="${L}" stroke-width="1.6"/>`,
    flower: `${[0, 1, 2, 3, 4].map(k => `<circle cx="${20 + Math.cos(k * 1.256) * 8}" cy="${18 + Math.sin(k * 1.256) * 8}" r="6" fill="${mc}" stroke="${L}" stroke-width="1.2"/>`).join('')}<circle cx="20" cy="18" r="4" fill="#f2c14e"/>`,
    medal: `<path d="M14 4 L20 14 L26 4" fill="none" stroke="#c9604f" stroke-width="3"/><circle cx="20" cy="24" r="10" fill="${mc}" stroke="${L}" stroke-width="1.6"/><path d="M20 18 l2 4 h4 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 h4Z" fill="#fff" opacity=".8"/>`,
    sack: `<path d="M10 12 C8 22 8 32 12 35 H28 C32 32 32 22 30 12Z" fill="${mc}" stroke="${L}" stroke-width="1.6"/><path d="M10 12 C14 8 26 8 30 12" fill="none" stroke="${L}" stroke-width="1.6"/><path d="M14 8 L20 4 L26 8" fill="none" stroke="${L}" stroke-width="1.6"/>`,
    key: `<circle cx="12" cy="14" r="7" fill="none" stroke="${mc}" stroke-width="4"/><circle cx="12" cy="14" r="7" fill="none" stroke="${L}" stroke-width="1"/><path d="M18 18 L33 33 M27 27 L31 23 M30 30 L33 27" stroke="${L}" stroke-width="3.4" stroke-linecap="round"/><path d="M18 18 L33 33" stroke="${mc}" stroke-width="1.6" stroke-linecap="round"/>`,
    log: `<rect x="6" y="14" width="28" height="13" rx="6.5" fill="${mc}" stroke="${L}" stroke-width="1.6"/><ellipse cx="30" cy="20.5" rx="4" ry="6.5" fill="#e9cfa8" stroke="${L}" stroke-width="1.4"/><circle cx="30" cy="20.5" r="2" fill="none" stroke="${L}" stroke-width="1"/>`,
    yarn: `<circle cx="20" cy="21" r="12" fill="${mc}" stroke="${L}" stroke-width="1.6"/><path d="M10 16 C18 18 26 26 28 30 M12 26 C18 20 24 14 30 14 M16 10 C18 18 18 26 16 32" fill="none" stroke="${L}" stroke-width="1"/>`,
    wheat: `<path d="M20 36 V8" stroke="#b08a3a" stroke-width="1.6"/>${[10, 16, 22].map(y => `<ellipse cx="16" cy="${y}" rx="4" ry="2.6" transform="rotate(-30 16 ${y})" fill="${mc}" stroke="${L}" stroke-width="1"/><ellipse cx="24" cy="${y}" rx="4" ry="2.6" transform="rotate(30 24 ${y})" fill="${mc}" stroke="${L}" stroke-width="1"/>`).join('')}`,
  };
  const map = { farine: 'sack', metal: 'key', verre: 'gem', bois: 'log', tissu: 'yarn', plastique: 'stone', cristal: 'gem', flocon: 'spark', perle: 'stone', lumiere: 'spark', lune: 'spark', eclat: 'gem', scarabee: 'medal', corail: 'leaf', fleur: 'flower', feuille: 'leaf', mousse: 'leaf', champignon: 'shell', plume: 'feather', coquillage: 'shell', pierre: 'stone', sable: 'stone', papier: 'paper', medaille: 'medal', masque: 'shell', eventail: 'shell', laine: 'yarn', graine: 'stone', ble: 'wheat' };
  return `<svg viewBox="0 0 40 40">${shapes[map[it.sub] || 'stone']}</svg>`;
}
const SLOT_LABEL = { tete: 'Tête', cou: 'Cou', haut: 'Haut', bas: 'Bas', mains: 'Mains', pieds: 'Pieds', dos: 'Dos' };
const CAT_LABEL = { v: 'Vêtement', m: 'Matériau', n: 'Nourriture', d: 'Décoration', t: 'Carte au trésor' };
const itemChip = it => `<div class="it" style="--rc:${RARC[it.rarity]}"><div class="ico">${itemIcon(it)}</div><div class="itx"><b>${esc(it.name)}</b><span>${RARITY[it.rarity]}${it.special ? ' · Souvenir unique' : ''}</span></div></div>`;

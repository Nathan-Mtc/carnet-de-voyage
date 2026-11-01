// ================= VOYAGE =================
// v14 : durée = TRAJET aller-retour (selon la distance) + SÉJOUR sur place (niveau DURS choisi).
// Trajet aller-retour en minutes : 0,8 + 0,9 × km^0,655 (courbe douce : 2 min dans le quartier, ~10 h aux antipodes).
// kmBetween arrondit au km : pour les lieux du quartier (300 m…), on prend la distance exacte
const kmExact = (a, b) => d3.geoDistance([a.lon, a.lat], [b.lon, b.lat]) * 6371;
function tripRoundMs(km) {
  const min = Math.max(1, 0.8 + 0.9 * Math.pow(Math.max(0, +km || 0), 0.655)); // au moins 1 min
  const ms = min * 60e3;
  if (min < 10) return Math.round(ms / 5e3) * 5e3;        // à 5 s près
  if (min < 60) return Math.round(min) * 60e3;            // à la minute
  return Math.round(min / 5) * 5 * 60e3;                  // à 5 min près
}
// durée totale prévue pour une destination et un niveau de séjour
function tripPlanMs(km, durKey) { const d = DURS.find(x => x.key === durKey) || DURS[0]; return tripRoundMs(km) + d.ms; }
// fractions du voyage : fin de l'aller (fa) et fin du séjour (fb). Anciens voyages (sans t.out) : aller-retour symétrique.
function tripPhases(t) {
  if (!t || !(t.out > 0) || !(t.total > 0)) return { fa: 0.5, fb: 0.5 };
  const fa = Math.min(0.5, t.out / t.total), fb = Math.min(1 - fa, (t.out + (t.stay || 0)) / t.total);
  return { fa, fb: Math.max(fa, fb) };
}
// avancement géographique (0 maison → 1 destination) pour une fraction f du voyage
function tripGeoK(t, f) {
  const { fa, fb } = tripPhases(t);
  if (f <= fa) return fa > 0 ? f / fa : 1;
  if (f <= fb) return 1;
  return fb < 1 ? Math.max(0, (1 - f) / (1 - fb)) : 0;
}
// 'aller' | 'sejour' | 'retour'
function tripPhase(t) { const f = Math.min(1, t.elapsed / t.total), { fa, fb } = tripPhases(t); return f < fa ? 'aller' : f < fb ? 'sejour' : 'retour'; }
function tripPos(t) {
  const f = Math.min(1, t.elapsed / t.total), k = tripGeoK(t, f);
  return d3.geoInterpolate([t.from.lon, t.from.lat], [t.dest.lon, t.dest.lat])(k);
}
function nearestPlace(lon, lat, maxKm) { let best = null, bd = maxKm; for (const p of PLACES) { const d = kmBetween({ lat, lon }, p); if (d < bd) { bd = d; best = p; } } return best; }
function weightedType(k) {
  const w = { decouverte: 3, trouvaille: 3, choix: 3, repas: 2, rencontre: 2, marchand: 1.4, aide: 1.6, animal: 2, meteo: 1.2, pieces: 1.4, tresor: 0.5 };
  if (hasEff(k, 'flair')) w.trouvaille += 1.5;
  if (hasEff(k, 'tresor')) w.tresor *= 3;
  if (hasEff(k, 'chance')) w.meteo *= 2.2;
  let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [t, v] of Object.entries(w)) { r -= v; if (r <= 0) return t; }
  return 'decouverte';
}
function startTrip() {
  const d = DURS.find(x => x.key === plan.dur), from = homeObj(), dest = plan.dest, k = S.sel;
  const dist = kmBetween(from, dest), n = d.ev;
  const out = Math.round(tripRoundMs(kmExact(from, dest)) / 2), stay = d.ms || 0, total = 2 * out + stay, fa = out / total; // l'arrivée a lieu à la fin de l'aller
  const events = [];
  for (let i = 0; i < n; i++) events.push({ at: 0.05 + (0.9 * (i + 0.5)) / n, type: null });
  let closest = 0; events.forEach((e, i) => { if (Math.abs(e.at - fa) < Math.abs(events[closest].at - fa)) closest = i; });
  events[closest].at = fa; events[closest].type = 'arrivee';
  const must = ['choix', 'trouvaille', 'rencontre', 'marchand', 'aide', 'animal'];
  let mi = 0;
  events.forEach((e, i) => { if (!e.type) e.type = (n <= 4 ? ['choix', 'animal', 'trouvaille', 'aide'][mi++ % 4] : (mi < must.length ? must[mi++] : weightedType(k))); });
  const order = events.filter(e => e.type !== 'arrivee').map(e => e.type).sort(() => Math.random() - 0.5);
  let oi = 0; events.forEach(e => { if (e.type !== 'arrivee') e.type = order[oi++]; });
  // voyages courts : un petit coup de chance de temps en temps (arc-en-ciel, étoile filante…)
  if (n <= 6 && Math.random() < 0.18) { const a = events.find(e => e.type === 'animal' || e.type === 'trouvaille'); if (a) a.type = 'meteo'; }
  if (hasEff(k, 'flair')) events.push({ at: 0.97, type: 'trouvaille' });
  if (hasEff(k, 'oiseau')) events.push({ at: 0.93, type: 'pepin' });
  events.sort((a, b) => a.at - b.at);
  S.trips[k] = { id: uidGen(), comp: k, from, dest, dur: d.key, luck: d.luck + lvlLuck(k), total, out, stay, elapsed: 0, last: Date.now(), dist, events, journal: [], bag: [], photos: [], coins: 0, xp: 0, done: false, startedAt: Date.now() };
  const dk = dayKey(); if (S.firstTripDay !== dk) { S.firstTripDay = dk; S.trips[k].dayBonus = true; }
  S.trips[k].journal.push({ t: Date.now(), kind: 'depart', text: `${CHARS[k].name} boucle son sac et part pour ${dest.name}. ${dist < 2 ? 'C’est tout près d’ici !' : `${dist.toLocaleString('fr-FR')} km l’attendent.`}` });
  plan.dest = null; save(); renderAll();
}
function rollRarity(base, luck) { let r = base; while (r < 4 && Math.random() < 0.08 * (1 + luck * 0.6) * Math.pow(0.5, r - base)) r++; return r; }
// spécialité d'un lieu du quotidien (tout près de chez soi) : un joli souvenir, mais peu cher à la revente (la boutique doit rester plus rentable)
function poiNear(it, place) { if (!place || place.poi) it.near = 1; return it; }
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
  const ev = typeof todayEvent === 'function' ? todayEvent() : null; // événement du jour
  if (ev && ev.tags && tags.some(t => ev.tags.includes(t))) n *= 2;
  if (ev && ev.luck) luck += ev.luck;
  // talents d'habitat : chaque espèce est plus douée chez elle (l'axolotl près de l'eau, le renard dans la neige…)
  const inHab = comp && typeof spHab === 'function' ? tags.some(t => spHab(comp).includes(t)) : water;
  if (comp && inHab && hasEff(comp, 'hab2')) n *= 2;
  if (comp && inHab && hasEff(comp, 'habLuck')) luck += 1.2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const w = pool.map(d => (SEASON_LOOT.includes(d) || NIGHT_LOOT.includes(d) ? 0.25 : 1) / (1 + d[3] * 1.6));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), def = pool[0];
    for (let j = 0; j < pool.length; j++) { r -= w[j]; if (r <= 0) { def = pool[j]; break; } }
    out.push(makeItem(def, luck, place, tags));
  }
  return out;
}
function tasteOf(comp, item) { const t = FOOD_TASTE[typeof spOf === 'function' ? spOf(comp) : comp] || FOOD_TASTE.def; if (t.love.includes(item.sub)) return 'love'; if (t.hate.includes(item.sub)) return 'hate'; return 'like'; }
function eventPlace(t, e) {
  if (e.type === 'arrivee' || t.dest.poi) return { ...t.dest };
  const k = tripGeoK(t, e.at);
  if (k >= 1) return { ...t.dest }; // pendant le séjour : sur place
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
  // v14 : lieux du quotidien en ville (boulangerie, café, fleuriste, gare…) : un choix de quartier, pas de « grand marché »
  quartier: { q: n => `Juste à côté, une petite porte de service est restée entrouverte.`, a: ['Jeter un œil derrière la porte', 'Attendre sagement son tour', 'Donner un coup de main aux gens du coin'], third: 'coins' },
};
// le choix d'un événement : les lieux du quotidien « en ville » ont le leur ; les autres (parc, plage, musée…) gardent celui de leur paysage
function choiceTag(place, tags) { return place && place.poi && tags[1] === 'ville' ? 'quartier' : (tags.find(tg => CHOICES[tg]) || 'campagne'); }
// sans réponse du joueur, chaque espèce décide selon son caractère (voir SP_INFO.temper : 0 audace, 1 prudence, 2 la troisième voie, 'eau')
function compTemper(comp) { try { return typeof spTemper === 'function' ? spTemper(comp) : 2; } catch (e) { return 2; } }
function autoChoice(comp, c) {
  const t = compTemper(comp);
  if (t === 0 || t === 1) return t;
  if (t === 'eau' && c.water !== undefined) return 0;
  return 2;
}
function resolveChoice(t, entry, choice, auto) {
  if (entry.resolved) return;
  if (entry.sc && typeof avChoose === 'function') return avChoose(t, entry, choice, auto); // v16 : scènes en plusieurs temps (29_aventure.js)
  const c = CHOICES[entry.ctag], k = t.comp, n = CHARS[k].name, place = entry.place;
  entry.resolved = true; entry.choice = choice; entry.auto = !!auto;
  let text = '', items = [];
  if (!auto) bump('choices');
  if (choice === 0) {
    let chance = 0.6 + (compTemper(k) === 0 ? 0.1 : 0) + (hasEff(k, 'audace') ? 0.2 : 0);
    if (hasEff(k, 'zen')) chance = 1;
    if (Math.random() < chance) {
      items = lootFor(entry.tags, t.luck + 1.5, place, 1, k);
      if (Math.random() < (hasEff(k, 'tresor') ? 0.3 : 0.1)) items.push(treasureMap(place, t.dest));
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
// v15 : un « bout de carte » = une rumeur sur un trésor unique (27_tresors.js, tzMapPiece). Remplace l'ancienne carte au trésor.
function treasureMap(place, near) {
  if (typeof tzMapPiece === 'function') return tzMapPiece(place, near);
  return { id: uidGen(), name: 'Bout de carte', cat: 't', sub: '', rarity: 2, from: place, tags: [], date: Date.now() };
}
function fireEvent(t, e) {
  const k = t.comp, n = CHARS[k].name, place = eventPlace(t, e), pName = place.name, tags = place.tags || ['campagne'], now = Date.now();
  const J = o => { t.journal.push({ t: now, place: pName, tags, ...o }); S.unseen[k] = (S.unseen[k] || 0) + 1; };
  const photo = (comps, title, extra = {}) => { const p = { id: uidGen(), comps, tags, place: pName, country: place.country || '', hour: new Date().getHours(), weather: pickWeather(tags), title, date: now, ...extra }; t.photos.push(p); return p; };
  switch (e.type) {
    case 'arrivee': {
      const items = lootFor(tags, t.luck + 0.5, pName, place.poi ? 3 : 2, k);
      if (place.special && (!S.found[pName] || Math.random() < (place.poi ? 0.08 : 0.3) + t.luck * 0.1)) items.push(poiNear(makeItem(place.special, t.luck, pName, tags, { special: true, edition: S.found[pName] ? null : 'Édition originale' }), place));
      t.bag.push(...items); t.xp += 20;
      const p = photo([k], pName);
      J({ kind: 'photo', text: pick([`${n} est arrivé à ${pName} ! Regarde-moi cette vue.`, `Bien arrivé à ${pName}. ${n} t’envoie une carte postale.`]), photo: p, items });
      break;
    }
    case 'decouverte': {
      const items = lootFor(tags, t.luck, pName, 1, k);
      if (place.special && Math.random() < 0.08 + t.luck * 0.05) items.push(poiNear(makeItem(place.special, t.luck, pName, tags, { special: true }), place));
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
    case 'rencontre': { const pl = pick(PLAYERS); J({ kind: 'rencontre', text: `${n} croise ${pl[1]}, le compagnon ${/^[AEIOUYÉÈ]/.test(pl[0]) ? 'd’' : 'de '}${pl[0]}, qui voyage aussi par ici.`, other: pl, pending: true }); break; }
    case 'nid': case 'choix': { if (typeof avFireChoice === 'function') { try { if (avFireChoice(t, e, place, J)) break; } catch (er) { console.error(er); } } if (e.type === 'nid') break; const ctag = choiceTag(place, tags); J({ kind: 'choix', text: CHOICES[ctag].q(n), ctag, pending: true }); break; }
    case 'marchand': {
      const offers = lootFor(tags, t.luck + 1, pName, 2).map(it => { it.rarity = Math.max(it.rarity, 1); return { item: it, price: Math.round(value(it) * (hasEff(k, 'nego') ? 0.7 : 1)) }; });
      J({ kind: 'marchand', text: `Un marchand ambulant déballe ses trésors devant ${n}.`, offers, pending: true });
      break;
    }
    case 'aide': { const h = pick(HELPS); J({ kind: 'aide', text: h[0], help: h, pending: true }); break; }
    case 'animal': {
      const tg = tags.find(x => ANIMALS[x]) || 'campagne', a = ANIMALS[tg];
      let text = `${n} rencontre ${a[0]}. ${a[1].replace('{n}', n)}`;
      if (tg === 'ville' && spOf(k) === 'panda') text = `Un pigeon ! ${n} se cache derrière un lampadaire jusqu’à ce qu’il s’envole.`;
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
    case 'tresor': { const m = treasureMap(pName, t.dest); t.bag.push(m); t.xp += 10; J({ kind: 'tresor', text: `Dans une vieille bouteille, ${n} trouve un bout de carte : une rumeur sur un trésor unique !`, items: [m] }); break; }
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
    const sp = spOf(k), win = Math.random() < ((sp === 'axo' || sp === 'phoque') && water ? 0.85 : compTemper(k) === 0 ? 0.6 : 0.45);
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
    if (j.kind === 'choix') { if (j.sc && typeof avAuto === 'function') avAuto(t, j); else resolveChoice(t, j, autoChoice(t.comp, CHOICES[j.ctag]), true); }
    if (j.kind === 'rencontre') { const tp = compTemper(t.comp); resolveMeeting(t, j, tp === 0 ? 0 : tp === 1 ? 1 : 2, true); }
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
  const ev = typeof todayEvent === 'function' ? todayEvent() : null, extra = [];
  const newNames = new Set(t.bag.filter(i => !S.dex[i.name]).map(i => i.name));
  if (t.dayBonus) { // bonus du premier voyage du jour : un objet peu commun ou mieux
    const b = lootFor(t.dest.tags || ['campagne'], t.luck + 1, t.dest.name, 1, k)[0];
    if (b) { b.rarity = Math.max(1, b.rarity); if (!S.dex[b.name]) newNames.add(b.name); t.bag.push(b); extra.push('Bonus du premier voyage du jour : un objet en plus !'); }
  }
  if (ev && ev.coins && t.coins > 0) { t.coins *= 2; extra.push(`${ev.name} : pièces doublées !`); }
  t.bag.forEach(i => { S.dex[i.name] = true; if (i.special) S.found[i.from] = true; });
  S.inv.push(...t.bag);
  S.album.push(...t.photos.map(p => ({ ...p, comp: k })));
  if (t.coins) gainCoins(t.coins);
  const dd = DURS.find(x => x.key === t.dur) || DURS[0];
  const xp = Math.min(520, Math.round((t.xp + 15 + Math.floor(t.dist / 400)) * (1 + dd.luck * 0.4)));
  const gained = addXP(k, Math.round(xp * (ev && ev.xp ? ev.xp : 1)));
  S.stats.trips++;
  S.stats.maxRar = Math.max(S.stats.maxRar || 0, ...t.bag.map(i => i.rarity || 0));
  if (t.dur === 'expe') S.stats.expe = (S.stats.expe || 0) + 1;
  if (t.dur === 'eclair' || t.dur === 'court') S.stats.short = (S.stats.short || 0) + 1;
  if (t.dest.poi) S.stats.poiTrips = (S.stats.poiTrips || 0) + 1;
  bump('visit', 1, t.dest.tags);
  t.bag.forEach(i => { if (i.tags && i.tags.length) bump('items_tag', 1, i.tags); if (i.rarity >= 2) bump('rare'); });
  bump('postcards', t.photos.length);
  S.trips[k] = null; S.unseen[k] = 0; fast = false;
  save(); renderAll(); // on reste sur la carte : le butin s'affiche dans la fenêtre du retour
  if (typeof showHaul === 'function') showHaul({ comp: k, trip: t, items: t.bag, coins: t.coins, xp: gained, photos: t.photos.length, newNames, extra });
  else toast(`${t.bag.length} objets rangés${t.coins > 0 ? `, ${t.coins} pièces gagnées` : ''}, +${gained} expérience.`);
}

// ================= CARTES POSTALES =================
function pickWeather(tags) {
  const s = season();
  if (tags.includes('neige') || (s === 'hiver' && tags.includes('montagne'))) return Math.random() < 0.5 ? 'neige' : 'soleil';
  if (tags.includes('desert')) return 'soleil';
  return pick(['soleil', 'soleil', 'nuages', 'pluie']);
}
// v19 : chaque carte postale illustre VRAIMENT le lieu : type de lieu (vitrine, parc, mer, montagne…), monument stylisé des lieux
// célèbres, couleurs de la région, heure et météo du voyage, nom du lieu et date, et le compagnon. Variation stable par lieu (graine = nom).
const PC_SHOP = ['boulangerie', 'cafe', 'restaurant', 'glacier', 'chocolaterie', 'epicerie', 'fromagerie', 'boucherie', 'poissonnerie', 'fleuriste', 'librairie', 'mode', 'friperie', 'boutique', 'jouets', 'bricolage', 'pharmacie', 'coiffeur', 'laverie', 'puces', 'caviste', 'hotel', 'poste', 'cinema', 'bibliotheque'];
const PC_FAM = { marche: 'marche', parc: 'parc', jardin: 'parc', zoo: 'parc', jeux: 'parc', foret: 'foret', camping: 'foret', riviere: 'eau', etang: 'eau', piscine: 'eau', plage: 'plage', port: 'port', phare: 'phare', sentier: 'montagne', belvedere: 'montagne', patrimoine: 'eglise', musee: 'musee', gare: 'gare', ecole: 'civique', mairie: 'civique', sport: 'civique', rue: 'rue', route: 'campagne', ferme: 'ferme', campagne: 'campagne' };
const PC_LAND = [
  ['eiffel', /eiffel|^paris$/], ['fourviere', /fourvi|^lyon$|basilique.*lyon/], ['garde', /garde|^marseille$/], ['msm', /saint-michel/], ['colisee', /colis|^rome$/], ['bigben', /big ben|^londres$|westminster/],
  ['liberte', /libert|new york/], ['opera', /sydney|op[ée]ra de sydney/], ['pyramide', /gizeh|pyramid/], ['torii', /kyoto|torii|sanctuaire|fushimi|temple/], ['tokyo', /^tokyo$|tokyo tower/], ['coupole', /istanbul|marrakech|mosqu/],
  ['christ', /rio de janeiro|corcovado/], ['menhir', /carnac|menhir/], ['montblanc', /chamonix|mont.blanc|zermatt/], ['canal', /venise|amsterdam/], ['sagrada', /barcelone|sagrada/], ['machu', /machu/],
];
function pcRng(seed) { let a = seed >>> 0 || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 10000) / 10000; }; }
function pcHash(s) { let h = 2166136261; s = String(s || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const pcNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// le monument (dessiné derrière le compagnon, à droite)
function pcLandmark(id, L, night) {
  const st = `stroke="${L}" stroke-width="1.4" stroke-linejoin="round"`, win = night ? '#f6d36b' : '#fff8ec';
  switch (id) {
    case 'eiffel': return `<path d="M222 150 L246 40 L250 40 L274 150 L262 150 C258 128 238 128 234 150Z" fill="#b98a5a" ${st}/><path d="M232 112 H264 M238 84 H258 M243 60 H253" stroke="${L}" stroke-width="2"/><path d="M248 40 V28" stroke="${L}" stroke-width="2"/>`;
    case 'fourviere': return `<path d="M150 150 C190 104 290 100 330 150Z" fill="#8fbf7f" ${st}/><rect x="212" y="88" width="64" height="34" fill="#f2ead6" ${st}/><rect x="206" y="72" width="12" height="50" fill="#f2ead6" ${st}/><rect x="270" y="72" width="12" height="50" fill="#f2ead6" ${st}/><path d="M206 72 h12 l-6 -8Z M270 72 h12 l-6 -8Z" fill="#c9a35a" ${st}/><path d="M234 88 l10 -14 l10 14Z" fill="#c9a35a" ${st}/><path d="M244 74 v-8" stroke="#c9a35a" stroke-width="2"/><path d="M190 122 l4 -54 l4 54Z" fill="#9aa4ac" ${st}/>`;
    case 'garde': return `<path d="M160 150 C200 96 280 92 330 150Z" fill="#c9b48a" ${st}/><rect x="226" y="80" width="40" height="34" fill="#f2ead6" ${st}/><rect x="238" y="50" width="16" height="30" fill="#f2ead6" ${st}/><circle cx="246" cy="44" r="6" fill="#f2c14e" ${st}/>`;
    case 'msm': return `<path d="M150 152 C190 120 300 120 330 152Z" fill="#c9bfa6" ${st}/><path d="M196 140 L246 74 L296 140Z" fill="#b5ab96" ${st}/><rect x="238" y="58" width="16" height="36" fill="#d9cfb8" ${st}/><path d="M246 30 L254 58 H238Z" fill="#8a8a96" ${st}/>`;
    case 'colisee': return `<path d="M176 150 V86 Q246 66 316 86 V150Z" fill="#e3c99a" ${st}/>${[0, 1, 2].map(r => [0, 1, 2, 3, 4, 5].map(i => `<path d="M${186 + i * 21} ${142 - r * 20} v-10 a5 5 0 0 1 10 0 v10Z" fill="#b5875a"/>`).join('')).join('')}`;
    case 'bigben': return `<rect x="234" y="58" width="26" height="92" fill="#d9b46a" ${st}/><path d="M232 58 L247 26 L262 58Z" fill="#5c6b7a" ${st}/><circle cx="247" cy="74" r="8" fill="#fff8ec" ${st}/><path d="M247 74 v-5 M247 74 h4" stroke="${L}" stroke-width="1.4"/><rect x="262" y="104" width="54" height="46" fill="#d9b46a" ${st}/>`;
    case 'liberte': return `<rect x="232" y="120" width="34" height="30" fill="#9aa4ac" ${st}/><path d="M240 120 L244 70 Q249 60 254 70 L258 120Z" fill="#7fbfa6" ${st}/><circle cx="249" cy="62" r="7" fill="#7fbfa6" ${st}/><path d="M256 70 L266 36" stroke="#7fbfa6" stroke-width="5" stroke-linecap="round"/><path d="M262 34 l4 -10 l4 10Z" fill="#f2c14e"/>`;
    case 'opera': return `<path d="M170 150 H320 V140 H170Z" fill="#e9e2d6" ${st}/><path d="M184 140 Q200 90 226 140Z M214 140 Q240 76 268 140Z M256 140 Q280 96 304 140Z" fill="#fbf8f0" ${st}/>`;
    case 'pyramide': return `<path d="M170 150 L230 70 L290 150Z" fill="#e3b56b" ${st}/><path d="M250 150 L290 96 L330 150Z" fill="#d9a35a" ${st}/><path d="M230 70 L246 150" stroke="${L}" stroke-width=".8" opacity=".5"/>`;
    case 'torii': return `<rect x="208" y="70" width="8" height="80" fill="#d9403f" ${st}/><rect x="270" y="70" width="8" height="80" fill="#d9403f" ${st}/><path d="M196 62 Q243 54 290 62 L288 70 H198Z" fill="#d9403f" ${st}/><rect x="204" y="80" width="78" height="6" fill="#d9403f" ${st}/>`;
    case 'tokyo': return `<path d="M228 150 L246 50 L264 150Z" fill="#e5584f" ${st}/><path d="M236 110 H256 M240 84 H252" stroke="#fff" stroke-width="3"/><path d="M246 50 V30" stroke="${L}" stroke-width="2"/>${[0, 1, 2].map(i => `<rect x="${280 + i * 14}" y="${96 + i * 8}" width="12" height="${54 - i * 8}" fill="#b8d8f0" ${st}/>`).join('')}`;
    case 'coupole': return `<rect x="200" y="100" width="90" height="50" fill="#f2ead6" ${st}/><path d="M214 100 Q245 50 276 100Z" fill="#5fa3c9" ${st}/><rect x="186" y="58" width="8" height="92" fill="#f2ead6" ${st}/><path d="M184 58 l6 -14 l6 14Z" fill="#5fa3c9" ${st}/><rect x="296" y="58" width="8" height="92" fill="#f2ead6" ${st}/><path d="M294 58 l6 -14 l6 14Z" fill="#5fa3c9" ${st}/>`;
    case 'christ': return `<path d="M150 152 L230 60 L330 152Z" fill="#6fae7d" ${st}/><rect x="226" y="34" width="8" height="30" fill="#f4f1ea" ${st}/><rect x="212" y="40" width="36" height="6" fill="#f4f1ea" ${st}/><circle cx="230" cy="31" r="4" fill="#f4f1ea" ${st}/>`;
    case 'menhir': return [0, 1, 2, 3, 4].map(i => `<path d="M${184 + i * 28} 150 q4 -${34 + (i % 3) * 10} 10 -${36 + (i % 3) * 10} q6 2 8 ${36 + (i % 3) * 10}Z" fill="#a9a39a" ${st}/>`).join('');
    case 'montblanc': return `<path d="M150 150 L250 34 L330 150Z" fill="#9aa8bf" ${st}/><path d="M226 62 L250 34 L274 62 L262 58 L250 68 L238 58Z" fill="#fff"/>`;
    case 'canal': return [0, 1, 2, 3].map(i => `<rect x="${186 + i * 30}" y="${74 + (i % 2) * 10}" width="28" height="${76 - (i % 2) * 10}" fill="${['#c9604f', '#e9b9a0', '#7a8a9a', '#d9a05a'][i]}" ${st}/><path d="M${186 + i * 30} ${74 + (i % 2) * 10} l14 -12 l14 12" fill="${['#c9604f', '#e9b9a0', '#7a8a9a', '#d9a05a'][i]}" ${st}/><rect x="${193 + i * 30}" y="${90 + (i % 2) * 10}" width="7" height="9" fill="${win}"/>`).join('');
    case 'sagrada': return [0, 1, 2, 3].map(i => `<path d="M${206 + i * 20} 150 V${70 - (i % 2) * 14} q6 -18 12 0 V150Z" fill="#d9b48a" ${st}/>`).join('');
    case 'machu': return `<path d="M150 150 L220 70 L250 96 L276 40 L330 150Z" fill="#6f9a5f" ${st}/><path d="M200 140 h80 M206 130 h70 M212 120 h58" stroke="#a9a39a" stroke-width="5"/>`;
  }
  return '';
}
// la scène selon le type de lieu (devant : y > 150)
function pcScene(fam, cat, p, r, L, night, R, sea) {
  const win = night ? '#f6d36b' : '#fff8ec', st = `stroke="${L}" stroke-width="1.3" stroke-linejoin="round"`, accent = (POI_CATS[cat] || [])[1] || (R ? R.color : '#c9604f');
  const houses = (n, y0, roof) => { let h = ''; for (let i = 0; i < n; i++) { const w = 30 + r() * 20, hh = 40 + r() * 50, x = i * (320 / n) - 6; h += `<rect x="${x}" y="${y0 - hh}" width="${w}" height="${hh}" fill="${['#e9b9a0', '#d9c6e8', '#f2d48f', '#b8d8f0', '#f6dcc8', '#cfe3c0'][(i + Math.floor(r() * 6)) % 6]}" ${st}/><path d="M${x - 2} ${y0 - hh} L${x + w / 2} ${y0 - hh - 12} L${x + w + 2} ${y0 - hh}Z" fill="${roof}" ${st}/><rect x="${x + 6}" y="${y0 - hh + 10}" width="7" height="8" fill="${win}"/><rect x="${x + w - 13}" y="${y0 - hh + 10}" width="7" height="8" fill="${win}"/>`; } return h; };
  const tree = (x, y, s, c) => `<rect x="${x - 3 * s}" y="${y - 6 * s}" width="${6 * s}" height="${16 * s}" fill="#8a6448"/><circle cx="${x}" cy="${y - 16 * s}" r="${16 * s}" fill="${c}" ${st}/>`;
  const leaf = season() === 'automne' ? ['#e0954f', '#d9733f', '#e8b04b'] : season() === 'hiver' ? ['#9cb8a6', '#8fae9a'] : ['#6fae7d', '#7fbf6a', '#5f9a6a'];
  const roof = R && R.g >= 3 ? '#5c6b7a' : R && ['paca', 'occitanie', 'corse', 'italie', 'iberie', 'mediterranee'].includes(R.id) ? '#d9733f' : '#c9604f';
  let s = '';
  switch (fam) {
    case 'shop': {
      s += houses(5, 150, roof) + `<rect y="148" width="320" height="52" fill="#cfc6b8"/>`;
      // la façade de la boutique, à droite, avec son store rayé et sa vitrine
      s += `<rect x="150" y="56" width="160" height="96" fill="${['#f6e6d0', '#e9dcc8', '#f2ead6'][Math.floor(r() * 3)]}" ${st}/><rect x="150" y="56" width="160" height="22" fill="${accent}" ${st}/><text x="230" y="72" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="700" font-size="12" fill="#fff">${esc(((POI_CATS[cat] || [])[0] || 'Boutique').slice(0, 22))}</text>`;
      for (let i = 0; i < 8; i++) s += `<path d="M${150 + i * 20} 78 h20 v12 q-10 8 -20 0Z" fill="${i % 2 ? '#fff' : accent}" ${st}/>`;
      s += `<rect x="160" y="96" width="92" height="50" fill="#cfe8f7" ${st}/><rect x="262" y="96" width="38" height="56" fill="#a87a50" ${st}/><circle cx="292" cy="126" r="2" fill="${L}"/>`;
      const G = { boulangerie: i => `<ellipse cx="${172 + i * 18}" cy="134" rx="8" ry="5" fill="#e3b06b" ${st}/><path d="M${167 + i * 18} 132 l4 3 M${172 + i * 18} 131 l4 3" stroke="${L}"/>`, glacier: i => `<path d="M${168 + i * 18} 128 l5 14 l5 -14Z" fill="#e3b06b" ${st}/><circle cx="${173 + i * 18}" cy="125" r="6" fill="${['#f6a6b8', '#fff8ec', '#9fe0c4', '#6b4a32', '#f6e07a'][i]}" ${st}/>`,
        fromagerie: i => `<path d="M${164 + i * 18} 142 l14 -12 v12Z" fill="#f2d06b" ${st}/>`, fleuriste: i => `<rect x="${166 + i * 18}" y="134" width="12" height="9" fill="#c9784f" ${st}/><circle cx="${172 + i * 18}" cy="128" r="6" fill="${['#e5587f', '#f2c14e', '#b07ccf', '#f39ab0', '#e5584f'][i]}" ${st}/>`,
        librairie: i => `<rect x="${166 + i * 16}" y="${118 + (i % 2) * 6}" width="11" height="${24 - (i % 2) * 6}" fill="${['#5f87c9', '#e5584f', '#7fae4f', '#f2a03a', '#b07ccf'][i]}" ${st}/>`, cafe: i => `<path d="M${166 + i * 18} 130 h12 v8 q-6 6 -12 0Z" fill="#fff" ${st}/><path d="M${170 + i * 18} 126 q2 -4 0 -6" stroke="#9aa" fill="none"/>`,
        chocolaterie: i => `<rect x="${166 + i * 18}" y="128" width="12" height="12" rx="2" fill="#6b4a32" ${st}/>`, poissonnerie: i => `<path d="M${164 + i * 18} 134 q8 -7 14 0 l4 -4 v8 l-4 -4 q-6 7 -14 0Z" fill="#9fc0d8" ${st}/>`,
        mode: i => `<path d="M${166 + i * 18} 124 l4 -3 h4 l4 3 l-2 3 h-1 v13 h-6 v-13 h-1Z" fill="${BT_PAL[i * 3 % BT_PAL.length]}" ${st}/>`, restaurant: i => `<circle cx="${172 + i * 18}" cy="134" r="7" fill="#fff" ${st}/><circle cx="${172 + i * 18}" cy="134" r="4" fill="${['#d9733f', '#7fae4f', '#e5584f', '#f2d06b', '#c98a4f'][i]}"/>` };
      const g = G[cat] || G[cat === 'friperie' || cat === 'boutique' ? 'mode' : cat === 'epicerie' || cat === 'caviste' ? 'chocolaterie' : cat === 'bibliotheque' || cat === 'poste' ? 'librairie' : 'restaurant'];
      for (let i = 0; i < 5; i++) s += g(i);
      if (cat === 'cafe' || cat === 'restaurant' || cat === 'glacier') s += `<ellipse cx="200" cy="164" rx="18" ry="5" fill="#fff" ${st}/><rect x="198" y="164" width="4" height="18" fill="${L}"/><path d="M186 152 Q200 136 214 152Z" fill="${accent}" ${st}/>`;
      break;
    }
    case 'marche':
      s += houses(6, 140, roof) + `<rect y="138" width="320" height="62" fill="#d9cfbf"/>`;
      for (let i = 0; i < 3; i++) { const x = 120 + i * 66, c = ['#e5584f', '#4f9f78', '#f2a03a'][i]; s += `<rect x="${x}" y="122" width="58" height="30" fill="#c99a6a" ${st}/>`; for (let k = 0; k < 4; k++) s += `<path d="M${x - 2 + k * 15.5} 94 h15.5 v14 q-7.75 7 -15.5 0Z" fill="${k % 2 ? '#fff' : c}" ${st}/>`; s += `<rect x="${x}" y="108" width="3" height="16" fill="${L}"/><rect x="${x + 55}" y="108" width="3" height="16" fill="${L}"/>`; for (let k = 0; k < 5; k++) s += `<circle cx="${x + 8 + k * 10}" cy="120" r="5" fill="${['#e5584f', '#7fae4f', '#f2a03a', '#f2d06b', '#b07ccf'][(k + i) % 5]}" ${st}/>`; }
      break;
    case 'parc':
      s += `<rect y="120" width="320" height="80" fill="#9fcf8a"/><path d="M180 200 Q220 150 320 140 V160 Q240 170 220 200Z" fill="#e9dcc0"/>`;
      for (let i = 0; i < 6; i++) s += tree(14 + i * 58 + r() * 14, 126 + r() * 10, 0.9 + r() * 0.5, leaf[i % leaf.length]);
      if (cat === 'zoo') s += `<path d="M230 150 q10 -26 20 0" stroke="#f39ab0" stroke-width="5" fill="none"/>`;
      s += r() < 0.5 ? `<ellipse cx="258" cy="172" rx="34" ry="9" fill="#9fd1e8" ${st}/><rect x="254" y="150" width="8" height="20" fill="#e9e2d6" ${st}/><path d="M258 146 q-10 6 -14 22 M258 146 q10 6 14 22" stroke="#9fd1e8" stroke-width="2" fill="none"/>` : `<rect x="236" y="160" width="50" height="5" fill="#a87a50" ${st}/><rect x="236" y="150" width="50" height="5" fill="#a87a50" ${st}/><path d="M240 165 v10 M282 165 v10" stroke="${L}" stroke-width="2"/>`;
      break;
    case 'foret':
      s += `<rect y="130" width="320" height="70" fill="#8fbf7f"/>`;
      for (let i = 0; i < 10; i++) { const x = i * 34 - 6 + r() * 8, y = 136 - r() * 14; s += i % 3 ? `<path d="M${x} ${y - 62} l22 66 h-44Z" fill="${['#4f8a5f', '#5f9a6a'][i % 2]}" ${st}/>` : tree(x, y, 1.1, leaf[i % leaf.length]); }
      if (cat === 'camping') s += `<path d="M220 172 L248 132 L276 172Z" fill="#e9a03a" ${st}/><path d="M248 132 V172" stroke="${L}"/>`;
      break;
    case 'eau':
      s += `<path d="M-10 120 C60 88 130 104 180 90 S280 80 330 108 V130 H-10Z" fill="#9fc79a" ${st}/><rect y="124" width="320" height="76" fill="${cat === 'piscine' ? '#7fd0e8' : '#7fb6d9'}"/>`;
      for (let i = 0; i < 7; i++) s += `<path d="M${16 + i * 46} ${140 + (i % 2) * 16} h24" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${200 + i * 8} 130 q2 -20 ${i % 2 ? 4 : -2} -28" stroke="#5f9a5a" stroke-width="2.5" fill="none"/>`;
      if (cat === 'etang') s += `<ellipse cx="250" cy="170" rx="12" ry="4" fill="#7fae4f" ${st}/><circle cx="252" cy="167" r="3" fill="#f6c2cf"/>`;
      break;
    case 'plage': case 'port': case 'phare':
      s += `<rect y="104" width="320" height="56" fill="${sea}"/>`;
      for (let i = 0; i < 7; i++) s += `<path d="M${10 + i * 46} ${118 + (i % 2) * 14} q8 -6 16 0 q8 6 16 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`;
      if (fam === 'port') { s += `<rect y="150" width="320" height="50" fill="#b5ab96"/>`; for (let i = 0; i < 3; i++) { const x = 150 + i * 56; s += `<path d="M${x} 140 h40 l-6 10 h-28Z" fill="${['#e5584f', '#4f88cf', '#f2c14e'][i]}" ${st}/><path d="M${x + 20} 140 V${100 + i * 6}" stroke="${L}" stroke-width="1.6"/><path d="M${x + 21} ${102 + i * 6} l16 30 h-16Z" fill="#fff" ${st}/>`; } }
      else s += `<path d="M-10 150 C80 140 200 160 330 146 V200 H-10Z" fill="#f2deb0" ${st}/>`;
      if (fam === 'phare') s += `<path d="M262 150 L268 64 H284 L290 150Z" fill="#fff" ${st}/><path d="M265 120 H287 M267 94 H285" stroke="#e5584f" stroke-width="8"/><rect x="266" y="52" width="20" height="12" fill="${night ? '#f6d36b' : '#cfe8f7'}" ${st}/><path d="M264 52 L276 42 L288 52Z" fill="#e5584f" ${st}/>${night ? '<path d="M276 58 L330 40 V76Z" fill="#f6e08a" opacity=".35"/>' : ''}`;
      if (fam === 'plage') s += `<path d="M250 176 V128" stroke="${L}" stroke-width="2"/><path d="M222 132 Q250 104 278 132Z" fill="${accent}" ${st}/><rect x="226" y="176" width="40" height="8" rx="3" fill="#f39ab0" ${st}/>`;
      break;
    case 'montagne': {
      const a = 50 + r() * 40, b = 140 + r() * 60;
      s += `<path d="M-10 150 L${a} ${60 + r() * 20} L${a + 50} 112 L${b} ${36 + r() * 20} L${b + 80} 130 L290 90 L340 150Z" fill="${p.tags && p.tags.includes('neige') ? '#dbe7f2' : '#9aa8bf'}" ${st}/><rect y="146" width="320" height="54" fill="${p.weather === 'neige' ? '#f4f7fb' : '#a9cf8f'}"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${20 + i * 56} 160 l9 -26 l9 26Z" fill="#5f9a6a" ${st}/>`;
      if (cat === 'belvedere') s += `<rect x="226" y="150" width="60" height="5" fill="#a87a50" ${st}/><path d="M230 155 v20 M282 155 v20 M226 140 h60" stroke="#a87a50" stroke-width="3"/><circle cx="256" cy="134" r="7" fill="#9aa4ac" ${st}/>`;
      else s += `<path d="M200 200 Q230 170 260 160 T320 150" stroke="#e9dcc0" stroke-width="7" fill="none"/><path d="M262 160 v-24 h22 l-6 6 l6 6 h-22" fill="#f2c14e" ${st}/>`;
      break;
    }
    case 'eglise': s += houses(4, 150, roof) + `<rect y="148" width="320" height="52" fill="#cfc6b8"/><rect x="180" y="80" width="96" height="70" fill="#e9e2d6" ${st}/><path d="M176 80 L228 50 L280 80Z" fill="#7a6a5a" ${st}/><rect x="236" y="30" width="24" height="50" fill="#e9e2d6" ${st}/><path d="M232 30 L248 4 L264 30Z" fill="#5c6b7a" ${st}/><circle cx="228" cy="104" r="12" fill="${night ? '#f6d36b' : '#9fc7e6'}" ${st}/><path d="M218 150 v-22 a10 10 0 0 1 20 0 v22Z" fill="#a87a50" ${st}/>`; break;
    case 'musee': s += houses(4, 150, roof) + `<rect y="148" width="320" height="52" fill="#cfc6b8"/><path d="M160 70 L240 40 L320 70Z" fill="#e9e2d6" ${st}/><rect x="164" y="70" width="152" height="8" fill="#e9e2d6" ${st}/>${[0, 1, 2, 3, 4].map(i => `<rect x="${172 + i * 30}" y="78" width="10" height="64" fill="#f4f1ea" ${st}/>`).join('')}<rect x="160" y="142" width="160" height="8" fill="#e9e2d6" ${st}/><rect x="196" y="100" width="36" height="22" fill="${accent}" opacity=".8" ${st}/>`; break;
    case 'gare': s += `<rect y="148" width="320" height="52" fill="#b5ab96"/><path d="M0 170 H320 M0 184 H320" stroke="#7a6a5a" stroke-width="3"/><rect x="150" y="70" width="170" height="80" fill="#e9dcc8" ${st}/><path d="M146 70 L235 44 L324 70Z" fill="#5c6b7a" ${st}/><circle cx="235" cy="88" r="12" fill="#fff" ${st}/><path d="M235 88 v-8 M235 88 h6" stroke="${L}" stroke-width="1.6"/>${[0, 1, 2, 3].map(i => `<path d="M${160 + i * 40} 150 v-28 a12 12 0 0 1 24 0 v28Z" fill="${win}" ${st}/>`).join('')}`; break;
    case 'civique': s += houses(4, 150, roof) + `<rect y="148" width="320" height="52" fill="${cat === 'sport' ? '#8fcf7f' : '#cfc6b8'}"/><rect x="160" y="74" width="150" height="76" fill="#f2ead6" ${st}/><path d="M156 74 L235 52 L314 74Z" fill="#5c6b7a" ${st}/><rect x="226" y="44" width="18" height="14" fill="#f2ead6" ${st}/><path d="M244 44 v-14 l12 4 l-12 4" fill="#4f88cf" stroke="${L}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${170 + i * 28}" y="90" width="14" height="18" fill="${win}" ${st}/>`).join('')}<rect x="224" y="120" width="22" height="30" fill="#a87a50" ${st}/>`; break;
    case 'rue': s += houses(7, 152, roof) + `<path d="M0 150 H320 V200 H0Z" fill="#cfc6b8"/><path d="M120 200 L160 150 H200 L260 200Z" fill="#b5ab96"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${i * 50} 176 h30" stroke="#fff" stroke-width="3" opacity=".7"/>`).join('')}<rect x="290" y="96" width="4" height="56" fill="${L}"/><circle cx="292" cy="94" r="7" fill="${night ? '#f6d36b' : '#fff8ec'}" ${st}/>`; break;
    case 'ferme': s += `<path d="M-10 130 C80 112 200 136 330 118 V200 H-10Z" fill="#b7d38a" ${st}/>` + [0, 1, 2, 3].map(i => `<path d="M-10 ${150 + i * 12} C80 ${140 + i * 12} 200 ${160 + i * 12} 330 ${144 + i * 12}" stroke="${['#e7cd6a', '#9cc06a'][i % 2]}" stroke-width="6" fill="none"/>`).join('') + `<rect x="210" y="96" width="70" height="50" fill="#c9604f" ${st}/><path d="M204 96 L245 66 L286 96Z" fill="#8a3a3a" ${st}/><path d="M232 146 v-26 h26 v26 M232 120 l26 26 M258 120 l-26 26" stroke="#fff" stroke-width="2" fill="none"/><ellipse cx="300" cy="160" rx="12" ry="7" fill="#fff" ${st}/><circle cx="292" cy="162" r="2" fill="${L}"/>`; break;
    default: { // campagne, désert, ville, mer… (grands lieux sans type) : le paysage
      const t0 = cat || 'campagne';
      if (t0 === 'desert') s += `<path d="M-10 150 C60 110 130 120 180 140 S280 112 330 130 V200 H-10Z" fill="#ecc27e" ${st}/><path d="M-10 170 C80 150 160 176 330 160 V200 H-10Z" fill="#e3ad62"/><path d="M290 160 v-26 m0 10 h-8 v-8 m8 12 h8 v-10" stroke="#5f9a5a" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      else if (t0 === 'ville' || t0 === 'monument') s += houses(8, 150, roof) + `<rect y="148" width="320" height="52" fill="#cfc6b8"/>`;
      else if (t0 === 'mer' || t0 === 'ile') { s += `<rect y="110" width="320" height="46" fill="${sea}"/><path d="M-10 150 C80 140 200 160 330 146 V200 H-10Z" fill="#f2deb0" ${st}/>`; if (t0 === 'ile') s += `<path d="M262 160 C258 128 262 104 270 90" stroke="#8a6448" stroke-width="5" fill="none"/><path d="M270 90 c-18 -8 -30 4 -34 10 M270 90 c14 -14 30 -6 34 2" stroke="#5f9a6a" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
      else if (t0 === 'lac') s += pcScene('eau', 'lac', p, r, L, night, R, sea);
      else if (t0 === 'montagne' || t0 === 'neige') s += pcScene('montagne', null, p, r, L, night, R, sea);
      else if (t0 === 'foret') s += pcScene('foret', null, p, r, L, night, R, sea);
      else { s += `<path d="M-10 130 C80 112 200 136 330 118 V200 H-10Z" fill="#b7d38a" ${st}/>`; for (let i = 0; i < 5; i++) s += `<path d="M-10 ${150 + i * 10} C80 ${140 + i * 10} 200 ${160 + i * 10} 330 ${144 + i * 10}" stroke="${R && R.id === 'paca' ? ['#b9a6e6', '#9cc06a'][i % 2] : ['#e7cd6a', '#9cc06a'][i % 2]}" stroke-width="6" fill="none"/>`; s += tree(270, 128, 1, leaf[0]); }
    }
  }
  return s;
}
function postcardSVG(p, uid) {
  p = p || {};
  const h = p.hour != null ? p.hour : 12, night = h < 6 || h >= 21 || p.weather === 'etoile', dawn = h >= 6 && h < 8, dusk = h >= 18 && h < 21, L = '#5b4636';
  const tags = p.tags || [], cat = p.cat || (typeof POI_CATS !== 'undefined' && POI_CATS[tags[0]] ? tags[0] : null);
  let R = null; try { R = p.rg && typeof RG !== 'undefined' ? RG[p.rg] : (isFinite(p.lon) && typeof regionAt === 'function' ? regionAt(p.lon, p.lat) : null); } catch (e) { R = null; }
  const nm = pcNorm(p.place), lm = (PC_LAND.find(([, rx]) => rx.test(nm) || rx.test(pcNorm(p.title))) || [])[0] || null;
  const BASES = ['montagne', 'neige', 'desert', 'mer', 'ile', 'lac', 'foret', 'ville', 'monument', 'campagne'];
  const fam = cat && PC_SHOP.includes(cat) ? 'shop' : cat && PC_FAM[cat] ? PC_FAM[cat] : 'land';
  const r = pcRng(pcHash(p.place || p.title || 'x')), uidS = String(uid || 'pc').replace(/[^\w-]/g, '');
  const top = night ? '#1f2a52' : dawn ? '#f6b8a0' : dusk ? '#f08a6a' : p.weather === 'pluie' ? '#9fb0c2' : '#8fc9ea';
  const bot = night ? '#3b4a7a' : dawn ? '#fde2c4' : dusk ? '#f9d39a' : p.weather === 'pluie' ? '#cfd8e2' : '#d9f0fb';
  const sea = R && R.g >= 2 && !['arctique', 'canada', 'scandinavie'].includes(R.id) ? '#3fb5c2' : R && ['arctique', 'scandinavie', 'britanniques', 'bretagne', 'normandie'].includes(R.id) ? '#4f7fa8' : '#5fa3c9';
  let s = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sk${uidS}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs><rect width="320" height="200" fill="url(#sk${uidS})"/>`;
  if (night) for (let i = 0; i < 22; i++) s += `<circle cx="${(i * 53 + 7) % 320}" cy="${(i * 29) % 100}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity=".8"/>`;
  if (p.weather === 'etoile' && typeof starPath === 'function') s += `<path d="M40 20 L130 60" stroke="#fff6c9" stroke-width="2.4" stroke-linecap="round"/><path d="${starPath(132, 61, 7)}" fill="#fff6c9"/>`;
  if (p.weather === 'arc') ['#f29a8a', '#f6c46b', '#f6e08a', '#a6d88f', '#8cc7e8', '#b9a6e6'].forEach((c, i) => { s += `<path d="M${30 + i * 9} 190 A${130 - i * 9} ${130 - i * 9} 0 0 1 ${290 - i * 9} 190" fill="none" stroke="${c}" stroke-width="9" opacity=".7"/>`; });
  if (p.weather === 'soleil' || night || (!p.weather)) s += `<circle cx="${night ? 60 : dawn ? 40 : dusk ? 280 : 150 + r() * 60}" cy="${dawn || dusk ? 70 : 34}" r="${night ? 13 : 18}" fill="${night ? '#f4efd2' : dawn || dusk ? '#f7a96b' : '#fbd76a'}"/>${night ? '<circle cx="66" cy="30" r="11" fill="#1f2a52"/>' : ''}`;
  if (p.weather === 'nuages' || p.weather === 'pluie' || p.weather === 'neige') s += `<g fill="${p.weather === 'pluie' ? '#e9eef3' : '#fff'}" opacity=".92"><ellipse cx="${60 + r() * 40}" cy="38" rx="34" ry="13"/><ellipse cx="${90 + r() * 40}" cy="30" rx="24" ry="14"/><ellipse cx="${200 + r() * 60}" cy="52" rx="30" ry="11"/></g>`;
  const scene = pcScene(fam === 'land' ? null : fam, fam === 'land' ? (tags.find(x => BASES.includes(x)) || 'campagne') : cat, p, r, L, night, R, sea);
  // grand lieu célèbre : le monument passe devant le décor ; lieu du quotidien : il reste au fond
  if (lm && fam === 'land') s += scene + pcLandmark(lm, L, night); else s += (lm ? pcLandmark(lm, L, night) : '') + scene;
  if (R && R.id === 'japon' && !night) for (let i = 0; i < 10; i++) s += `<ellipse cx="${(i * 37 + 11) % 320}" cy="${(i * 23 + 20) % 140}" rx="2.6" ry="1.6" fill="#f6c2cf"/>`;
  if (p.weather === 'pluie') for (let i = 0; i < 26; i++) s += `<path d="M${(i * 37) % 320} ${(i * 23) % 150} l-4 10" stroke="#6f8fb0" stroke-width="1.6" opacity=".7"/>`;
  if (p.weather === 'neige') for (let i = 0; i < 26; i++) s += `<circle cx="${(i * 41) % 320}" cy="${(i * 19) % 160}" r="2" fill="#fff"/>`;
  if (night) s += `<rect width="320" height="200" fill="#1f2a52" opacity=".18"/>`;
  if (p.snowman) s += `<circle cx="96" cy="168" r="20" fill="#fff" stroke="${L}" stroke-width="1.4"/><circle cx="96" cy="136" r="14" fill="#fff" stroke="${L}" stroke-width="1.4"/><path d="M96 138 l10 3 l-10 2Z" fill="#f2a05a"/><rect x="85" y="146" width="22" height="5" rx="2" fill="#d96b5f"/>`;
  const comps = (p.comps || []).filter(k => typeof CHARS !== 'undefined' && CHARS[k]);
  comps.forEach((k, i) => {
    const w = 92, x = comps.length === 1 ? (p.snowman ? 120 : 26) : 12 + i * 78;
    const o = i === 0 ? ((S.outfits && S.outfits[k]) || CHARS[k].outfit) : CHARS[k].outfit;
    s += drawChar(k, o, i === 0 ? 'rire' : 'content', uidS + 'c' + i).replace('<svg ', `<svg x="${x}" y="${200 - w * 1.06}" width="${w}" height="${w * 1.1}" `);
  });
  // cadre aux couleurs de la région, bandeau avec le nom du lieu, timbre et date
  const rc = R ? R.color : '#c9604f', place = String(p.place || '').slice(0, 30), date = p.date ? new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  s += `<rect x="3" y="3" width="314" height="194" fill="none" stroke="${rc}" stroke-width="6" rx="6"/><rect x="3" y="3" width="314" height="194" fill="none" stroke="#fffaf0" stroke-width="2" stroke-dasharray="6 4" rx="6"/>`;
  s += `<rect x="12" y="10" width="${Math.min(220, 26 + place.length * 7.2)}" height="24" rx="12" fill="#fffaf0" stroke="${rc}" stroke-width="2"/><text x="24" y="27" font-family="Baloo 2,sans-serif" font-weight="700" font-size="13" fill="${L}">${esc(place)}</text>`;
  s += `<g transform="translate(262 12) rotate(4)"><rect width="46" height="54" fill="#fffaf0" stroke="${rc}" stroke-width="1.6" stroke-dasharray="3 2"/><rect x="5" y="5" width="36" height="30" fill="${rc}" opacity=".85"/>${R && typeof rgIcon === 'function' ? '' : ''}<text x="23" y="25" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="700" font-size="${R && R.short.length > 9 ? 6.5 : 8.5}" fill="#fff">${esc(R ? R.short.slice(0, 14) : '')}</text><text x="23" y="47" text-anchor="middle" font-family="Caveat,cursive" font-size="8.5" fill="${L}">${esc(date)}</text></g>`;
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
const CAT_LABEL = { v: 'Vêtement', m: 'Matériau', n: 'Nourriture', d: 'Décoration', t: 'Bout de carte' };
const itemChip = it => `<div class="it" style="--rc:${RARC[it.rarity]}"><div class="ico">${itemIcon(it)}</div><div class="itx"><b>${esc(it.name)}</b><span>${RARITY[it.rarity]}${it.special ? ' · Souvenir unique' : ''}</span></div></div>`;

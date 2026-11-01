// ================= AVENTURE (v17) : on REGARDE l'aventure =================
// Bibliothèque de petites séquences animées (SVG + CSS) où le familier fait vraiment quelque chose :
// grimper, nager, sauter de pierre en pierre, traverser un pont, creuser, pêcher, cueillir, glisser, s'abriter sous une feuille,
// sauter dans les flaques, partager un goûter, faire une photo, se perdre puis trouver, dormir sous les étoiles, coffre, nid,
// suivre des traces, être surpris, tomber, magie, courir, grelotter, carte au trésor, et la rencontre d'un familier sauvage.
// Chaque séquence : AX[id] = { mood, c (sous-titres drôles), draw(ctx), g (où l'objet trouvé apparaît) }.
// axSVG(id, ctx, opts) dessine la séquence dans un repère 200×120 (sol à y=112), posé sur le décor de 29_aventure.js.
// axActFor(texte, fx, ok) devine la séquence d'après le texte d'un choix ; axIdle(ctx, créneau) varie selon biome, heure,
// météo, espèce et vêtements. Utilisé par avRender, les vignettes de choix et « Revoir l'aventure ».

const AXL = 'stroke="#5b4636" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
const AX = {};
const axDef = (id, mood, g, c, draw) => { AX[id] = { id, mood, g, c, draw }; };
function axPet(c, x, y, mood, cls, inner) {
  // v19 : ombre portée douce, posée au sol (elle ne suit pas les sauts) ; pas dans l'eau
  const sh = /swim|slide|cross|float/.test(cls || '') ? '' : `<ellipse class="axsh" cx="${x}" cy="${y - 0.5}" rx="15" ry="3.2" fill="#2a1e14" opacity="${c.tod === 'nuit' ? 0.14 : 0.22}"/>`;
  return `${sh}<g class="${cls || 'pet'}"><image href="${portraitURI(c.k, mood || 'content')}" x="${x - 22}" y="${y - 48}" width="44" height="48"/>${inner || ''}</g>`;
}
const axStar = (x, y, r) => `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z`;
const axHeart = (x, y, s, cls) => `<path class="${cls || ''}" d="M${x} ${y + 3 * s} C${x - 7 * s} ${y - 2 * s} ${x - 4 * s} ${y - 7 * s} ${x} ${y - 3.5 * s} C${x + 4 * s} ${y - 7 * s} ${x + 7 * s} ${y - 2 * s} ${x} ${y + 3 * s}Z" fill="#f06a8e" stroke="#fff" stroke-width=".8"/>`;
function axCritter(c, x, y, cls) {
  const ty = c.critter || 'herisson';
  let s;
  if (ty === 'oiseau') s = `<ellipse cx="${x}" cy="${y - 8}" rx="9" ry="8" fill="#7fb6e0" ${AXL}/><path d="M${x - 4} ${y - 8} q-4 4 2 6" fill="#5f96c0" ${AXL}/><path d="M${x + 8} ${y - 10} l5 1.5 l-5 1.5Z" fill="#f6c445" ${AXL}/><circle cx="${x + 4}" cy="${y - 11}" r="1.3" fill="#5b4636"/><path d="M${x - 2} ${y} v2 M${x + 2} ${y} v2" stroke="#f08a4a" stroke-width="1.4"/>`;
  else if (ty === 'lapin') s = `<path d="M${x - 2} ${y - 16} q-4 -14 1 -15 q4 1 2 15 M${x + 3} ${y - 16} q1 -14 6 -13 q3 3 -2 14" fill="#f4ece0" ${AXL}/><ellipse cx="${x}" cy="${y - 8}" rx="10" ry="8.5" fill="#f4ece0" ${AXL}/><circle cx="${x + 4}" cy="${y - 10}" r="1.3" fill="#5b4636"/><circle cx="${x + 8}" cy="${y - 7}" r="1.2" fill="#f08aa6"/><circle cx="${x - 10}" cy="${y - 6}" r="3" fill="#fff" ${AXL}/>`;
  else if (ty === 'grenouille') s = `<ellipse cx="${x}" cy="${y - 6}" rx="11" ry="7" fill="#7fc56a" ${AXL}/><circle cx="${x - 4}" cy="${y - 13}" r="3.5" fill="#7fc56a" ${AXL}/><circle cx="${x + 4}" cy="${y - 13}" r="3.5" fill="#7fc56a" ${AXL}/><circle cx="${x - 4}" cy="${y - 13}" r="1.3" fill="#5b4636"/><circle cx="${x + 4}" cy="${y - 13}" r="1.3" fill="#5b4636"/><path d="M${x - 4} ${y - 5} q4 3 8 0" stroke="#5b4636" stroke-width="1.2" fill="none"/>`;
  else s = `<path d="M${x - 12} ${y} Q${x - 13} ${y - 14} ${x - 1} ${y - 15} Q${x + 9} ${y - 14} ${x + 12} ${y - 5} L${x + 16} ${y - 3} Q${x + 12} ${y} ${x} ${y}Z" fill="#c9a07a" ${AXL}/><path d="M${x - 11} ${y - 4} l-4 -3 M${x - 10} ${y - 9} l-4 -4 M${x - 5} ${y - 13} l-2 -5 M${x + 1} ${y - 14} l1 -5 M${x + 6} ${y - 12} l3 -4" stroke="#7a5a40" stroke-width="2"/><circle cx="${x + 8}" cy="${y - 7}" r="1.3" fill="#5b4636"/><circle cx="${x + 15.5}" cy="${y - 3}" r="1.5" fill="#5b4636"/>`;
  return `<g class="${cls || 'crit'}">${s}</g>`;
}
const axDrops = (n, x0, x1, cls) => Array.from({ length: n }, (_, i) => `<path class="${cls || 'drp'}" style="animation-delay:${(i * 0.23).toFixed(2)}s" d="M${x0 + (x1 - x0) * i / Math.max(1, n - 1)} ${-4 - (i % 3) * 8} l-1.5 6" stroke="#9fd0ee" stroke-width="1.6" stroke-linecap="round"/>`).join('');
const axWater = (y, col) => `<path d="M-10 ${y} Q15 ${y - 3} 40 ${y} T90 ${y} T140 ${y} T190 ${y} T240 ${y} T290 ${y} V122 H-10Z" fill="${col || '#7fcbe0'}"/>`;

// ---------- les séquences ----------
axDef('walk', 'content', [100, 50], ['{n} marche, le nez au vent.', '{n} fredonne une chanson de route.', 'Un pas, deux pas… et une pause goûter ?'],
  c => `${axPet(c, 100, 112, 'content', 'pet bob')}<g class="dust"><circle cx="80" cy="110" r="3" fill="#fff" opacity=".7"/><circle cx="72" cy="108" r="2" fill="#fff" opacity=".6"/></g>`);
axDef('climb', 'fier', [125, 24], ['{n} grimpe… sans regarder en bas.', 'Tout là-haut, la vue est meilleure !', '{n} fait la course avec un écureuil.'],
  c => `<rect x="117" y="20" width="16" height="94" rx="5" fill="#a07850" ${AXL}/><path d="M133 62 l14 -8 M117 76 l-10 -6" stroke="#8a6448" stroke-width="4" stroke-linecap="round"/><g class="crown"><circle cx="104" cy="28" r="16" fill="#5fa063" ${AXL}/><circle cx="146" cy="28" r="17" fill="#5fa063" ${AXL}/><circle cx="125" cy="16" r="24" fill="#6fae5f" ${AXL}/><circle cx="116" cy="10" r="5" fill="#fff" opacity=".25"/></g><path class="leaf l1" d="M140 40 q5 -5 10 0 q-5 5 -10 0Z" fill="#8cc474" ${AXL}/><path class="leaf l2" d="M104 46 q5 -5 10 0 q-5 5 -10 0Z" fill="#a8d27e" ${AXL}/>${axPet(c, 114, 112, 'fier', 'pet climb')}`);
axDef('swim', 'rire', [100, 70], ['Plouf ! {n} fait la planche.', '{n} nage le crawl… du chien.', 'Des bulles, encore des bulles !'],
  c => `${axWater(84, '#8fd0e6')}${axPet(c, 100, 112, 'rire', 'pet swim', c.swimmer ? '' : `<ellipse cx="100" cy="96" rx="21" ry="6" fill="none" stroke="#f06a6a" stroke-width="5" stroke-dasharray="9 6"/>`)}<g class="wave" opacity=".82">${axWater(98, '#6fc3df')}</g><circle class="bub b1" cx="92" cy="104" r="2.4" fill="#fff" opacity=".8"/><circle class="bub b2" cx="108" cy="104" r="1.8" fill="#fff" opacity=".8"/><circle class="bub b3" cx="100" cy="106" r="2" fill="#fff" opacity=".8"/><g class="splash"><path d="M84 92 l-6 -8 M92 88 l-2 -10 M108 88 l2 -10 M116 92 l6 -8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`);
axDef('stones', 'content', [164, 70], ['De pierre en pierre… sans se mouiller !', '{n} vise bien la pierre du milieu.', 'Hop, hop, hop ! Les pieds au sec.'],
  c => `<rect x="0" y="100" width="200" height="22" fill="#a6d185"/><path d="M28 98 Q100 92 172 98 V116 Q100 110 28 116Z" fill="#7fcbe0"/><path class="rip" d="M40 106 h12 M80 110 h10 M120 104 h12 M150 110 h10" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>${[64, 100, 136].map(x => `<ellipse cx="${x}" cy="104" rx="11" ry="5" fill="#b7aea0" ${AXL}/>`).join('')}${axPet(c, 34, 106, 'content', 'pet hop3')}<g class="splash s2"><path d="M96 98 l-4 -6 M104 98 l4 -6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`);
axDef('bridge', 'curieux', [170, 60], ['Le pont fait « crr… crr… ». Ne pas regarder en bas.', '{n} traverse, sur la pointe des pattes.', 'Une planche manque. Grand pas !'],
  c => `${axWater(110, '#7fcbe0')}<g class="sway"><rect x="26" y="62" width="6" height="40" fill="#8a6448" ${AXL}/><rect x="168" y="62" width="6" height="40" fill="#8a6448" ${AXL}/><path d="M29 66 Q100 84 171 66" stroke="#b38a62" stroke-width="2" fill="none"/><path d="M29 92 Q100 106 171 92" stroke="#8a6448" stroke-width="6" fill="none" stroke-dasharray="7 2.5 7 2.5 7 2.5 7 2.5 7 2.5 7 2.5 7 2.5 0 14 7 2.5"/><path d="M50 72 v24 M80 77 v25 M120 77 v25 M150 72 v24" stroke="#b38a62" stroke-width="1.2"/></g>${axPet(c, 30, 94, 'curieux', 'pet cross')}`);
axDef('dig', 'curieux', [114, 98], ['{n} creuse, creuse… ça va sortir !', 'Ça gratte, ça gratte. La terre vole partout.', 'Il y a quelque chose là-dessous !'],
  c => `<path d="M96 113 Q114 92 134 113Z" fill="${c.biome === 'mer' || c.biome === 'desert' ? '#e8c07e' : '#a8825a'}" ${AXL}/><ellipse cx="114" cy="111" rx="10" ry="3" fill="#5b4636" opacity=".7"/>${axPet(c, 84, 112, 'curieux', 'pet dig')}<g class="dirt">${[[70, 96], [64, 90], [74, 86]].map(([x, y], i) => `<circle class="d${i}" cx="${x}" cy="${y}" r="${2.6 - i * 0.4}" fill="#8a6448"/>`).join('')}</g>`);
axDef('fish', 'content', [150, 92], ['Chut… ça mord ?', '{n} attend. Le poisson aussi.', 'Un poisson saute pour dire bonjour.'],
  c => `<rect x="0" y="100" width="110" height="22" fill="#a6d185"/><path d="M104 98 Q150 95 210 98 V122 H98Z" fill="#7fcbe0"/><path class="rip" d="M120 106 h12 M160 112 h10" stroke="#fff" stroke-width="1.4" opacity=".8"/><g class="rod"><path d="M84 92 L120 52" stroke="#8a6448" stroke-width="2.4" stroke-linecap="round"/><path d="M120 52 Q134 68 142 98" stroke="#fff" stroke-width=".9" fill="none"/></g><g class="bobr"><circle cx="142" cy="98" r="3" fill="#f06a6a" ${AXL}/></g><g class="fishj"><path d="M150 104 q8 -6 16 0 q-8 6 -16 0Z M166 104 l5 -4 v8Z" fill="#f6a06a" ${AXL}/></g>${axPet(c, 72, 112, 'content', 'pet idle')}`);
axDef('pick', 'rire', [120, 40], ['Une pour le sac, une pour la bouche…', '{n} cueille les plus belles.', 'Miam. Il en restera pour vous, promis.'],
  c => `<g class="bush"><circle cx="128" cy="78" r="22" fill="#5fa063" ${AXL}/><circle cx="110" cy="92" r="16" fill="#6fae5f" ${AXL}/><circle cx="146" cy="94" r="16" fill="#6fae5f" ${AXL}/><rect x="104" y="96" width="50" height="16" fill="#6fae5f"/></g>${[[118, 70], [136, 80], [124, 90]].map(([x, y], i) => `<circle class="fruit f${i}" cx="${x}" cy="${y}" r="4" fill="${c.biome === 'jungle' ? '#f6c445' : '#e5584f'}" ${AXL}/>`).join('')}${axPet(c, 82, 112, 'rire', 'pet hopl')}<path d="M70 100 h22 l-3 12 h-16Z" fill="#d9a868" ${AXL}/><path d="M72 104 h18 M73 108 h16" stroke="#b38a62" stroke-width="1"/>`);
axDef('slide', 'rire', [170, 80], ['Wiiiii ! {n} glisse sur le ventre.', 'Encore un tour ! Et encore un !', 'Freiner ? Quel freinage ?'],
  c => `<path d="M-10 46 Q80 58 210 108 V122 H-10Z" fill="#f6f9fd" stroke="#cfdcec" stroke-width="2"/><path d="M20 60 Q90 72 180 106" stroke="#dbe6f2" stroke-width="3" fill="none" stroke-dasharray="6 6"/>${axPet(c, 40, 64, 'rire', 'pet slide', c.o.cou === 'echarpe' || c.o.cou === 'foulard' ? `<path class="scarf" d="M28 44 q-10 -2 -18 3 q8 1 16 -1" fill="#e2584d" ${AXL}/>` : '')}<g class="puff"><circle cx="24" cy="60" r="4" fill="#fff"/><circle cx="18" cy="56" r="3" fill="#fff"/></g>`);
axDef('leaf', 'content', [100, 30], ['Pluie ? Pas de souci : une feuille-parapluie.', '{n} écoute la pluie faire « tap tap ».', 'Au sec, sous la plus grande feuille du coin.'],
  c => `${axDrops(9, 20, 180)}${axPet(c, 100, 112, 'content', 'pet idle')}<g class="leafu"><path d="M66 56 Q100 22 136 56 Q100 46 66 56Z" fill="#5fae5f" ${AXL}/><path d="M100 46 L101 100" stroke="#3f8a52" stroke-width="2.5"/></g><g class="bnc"><circle cx="66" cy="58" r="1.6" fill="#9fd0ee"/><circle cx="136" cy="58" r="1.6" fill="#9fd0ee"/></g>`);
axDef('puddle', 'rire', [110, 80], ['Avec des bottes, on saute dans TOUTES les flaques.', 'Splash ! Et re-splash !', '{n} a inventé un sport : la flaque olympique.'],
  c => `${axDrops(7, 20, 180)}<ellipse cx="110" cy="112" rx="34" ry="6" fill="#8fc3dc" ${AXL}/>${axPet(c, 110, 112, 'rire', 'pet jump')}<g class="splash s3"><path d="M84 108 l-8 -8 M92 104 l-3 -10 M128 104 l3 -10 M136 108 l8 -8" stroke="#8fc3dc" stroke-width="2.6" stroke-linecap="round"/></g>`);
axDef('snack', 'amour', [112, 70], ['Un biscuit coupé en deux : la moitié de l’amitié.', '{n} partage son goûter. Miam à deux.', 'Une miette pour toi, une miette pour moi.'],
  c => `${axPet(c, 74, 112, 'amour', 'pet idle')}${axCritter(c, 146, 112, 'crit nod')}<g class="cookie"><circle cx="104" cy="96" r="6" fill="#d9a05a" ${AXL}/><circle cx="102" cy="94" r="1" fill="#7a4a2a"/><circle cx="106" cy="98" r="1" fill="#7a4a2a"/></g>${axHeart(112, 70, 1.1, 'hrt h1')}${axHeart(124, 64, 0.8, 'hrt h2')}`);
axDef('hello', 'rire', [120, 50], ['Un nouvel ami ! Il dit bonjour avec les oreilles.', '{n} papote avec les gens du coin.', 'Salut ! On voyage ensemble un bout ?'],
  c => `${axPet(c, 76, 112, 'rire', 'pet hopl')}${axCritter(c, 140, 112, 'crit nod')}<g class="bubl"><path d="M128 64 h28 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-18 l-6 6 v-6 h-4 a6 6 0 0 1 -6 -6 v-10 a6 6 0 0 1 6 -6Z" fill="#fff" ${AXL}/>${axHeart(142, 75, 0.9)}</g>`);
axDef('photo', 'rire', [146, 54], ['Clic ! Souvenir de voyage dans la boîte.', 'Ne bougez plus… Ouistiti !', '{n} fait sa plus belle tête de carte postale.'],
  c => `${axPet(c, 82, 112, 'rire', 'pet idle')}<g class="cam"><path d="M112 112 l6 -18 l6 18 M118 94 v18" stroke="#5b4636" stroke-width="1.6"/><rect x="106" y="80" width="24" height="15" rx="3" fill="#5b4636"/><circle cx="118" cy="87.5" r="4.5" fill="#bfe1f2" stroke="#fff" stroke-width="1.4"/><rect x="109" y="77" width="6" height="4" fill="#5b4636"/></g><g class="polar"><rect x="134" y="54" width="26" height="30" fill="#fff" ${AXL}/><rect x="137" y="57" width="20" height="18" fill="#93cff0"/><path d="M137 75 l7 -8 l5 5 l3 -3 l5 6Z" fill="#7fbf6a"/></g><rect class="flash" x="-60" y="-60" width="320" height="240" fill="#fff"/>`);
axDef('lost', 'curieux', [100, 30], ['Euh… c’était à gauche ou à droite ?', '{n} se gratte la tête… et trouve !', 'Perdu… puis retrouvé. Comme les chaussettes.'],
  c => `<g><rect x="28" y="70" width="4" height="42" fill="#8a6448"/><path d="M14 72 h26 l6 5 l-6 5 h-26Z" fill="#f2dfae" ${AXL}/><rect x="168" y="70" width="4" height="42" fill="#8a6448"/><path d="M186 72 h-26 l-6 5 l6 5 h26Z" fill="#f2dfae" ${AXL}/></g>${axPet(c, 100, 112, 'curieux', 'pet look')}<g class="qm"><circle cx="114" cy="50" r="10" fill="#fff" ${AXL}/><text x="114" y="55" text-anchor="middle" font-size="14" font-weight="800" fill="#d9607e">?</text></g><g class="bulb"><path d="M114 38 a9 9 0 0 1 5 16 v4 h-10 v-4 a9 9 0 0 1 5 -16Z" fill="#ffe46a" ${AXL}/><path d="M110 61 h8" stroke="#5b4636" stroke-width="2"/><path d="M114 28 v-5 M100 34 l-4 -3 M128 34 l4 -3 M98 46 h-5 M130 46 h5" stroke="#f6c445" stroke-width="2" stroke-linecap="round"/></g>`);
axDef('sleep', 'dodo', [100, 40], ['Dodo sous les étoiles. Chut.', '{n} compte les étoiles… zzz.', 'Une étoile filante ! Vite, un vœu.'],
  c => `${Array.from({ length: 7 }, (_, i) => `<path class="tw" style="animation-delay:${(i * 0.4).toFixed(1)}s" d="${axStar(18 + i * 27, 12 + (i % 3) * 12, 2.6)}" fill="#fff6c0"/>`).join('')}<path class="shoot" d="M150 10 l-22 10" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="96" cy="112" rx="34" ry="5" fill="#d98a8a" ${AXL}/><g class="fire"><path d="M146 112 l8 -4 l8 4" stroke="#8a6448" stroke-width="3"/><path class="flm" d="M154 108 q-7 -8 0 -18 q7 10 0 18Z" fill="#f6a03a"/><path class="flm f2" d="M154 108 q-3 -5 0 -10 q3 5 0 10Z" fill="#ffe46a"/></g>${axPet(c, 96, 112, 'dodo', 'pet breathe')}<g class="zz"><text class="z z1" x="112" y="62" font-size="10" font-weight="800" fill="#fff">z</text><text class="z z2" x="118" y="54" font-size="12" font-weight="800" fill="#fff">z</text><text class="z z3" x="126" y="44" font-size="14" font-weight="800" fill="#fff">Z</text></g>`);
axDef('chest', 'surpris', [130, 88], ['Un coffre ! Qu’y a-t-il dedans ?', 'Ça brille… {n} n’en croit pas ses yeux.', 'Trésor ! (ou chaussette perdue ?)'],
  c => `<g class="rays">${Array.from({ length: 8 }, (_, i) => `<path d="M130 92 L${130 + Math.cos(i * 0.785) * 40} ${92 + Math.sin(i * 0.785) * 40}" stroke="#ffe46a" stroke-width="5" opacity=".5"/>`).join('')}</g><rect x="114" y="94" width="32" height="18" rx="2" fill="#c9884a" ${AXL}/><path d="M114 101 h32" stroke="#8a5a3a" stroke-width="2"/><g class="lid"><path d="M114 94 v-6 q16 -10 32 0 v6Z" fill="#d9985a" ${AXL}/></g><rect x="127" y="96" width="6" height="7" fill="#f6c445" ${AXL}/>${axPet(c, 80, 112, 'surpris', 'pet jump')}<path class="spk" d="${axStar(150, 80, 4)}" fill="#fff6a8"/><path class="spk k2" d="${axStar(110, 84, 3)}" fill="#fff6a8"/>`);
axDef('nest', 'amour', [126, 84], ['Un nid qui brille. L’œuf a bougé !', '{n} parle tout bas à l’œuf.', 'Toc toc… il y a quelqu’un ?'],
  c => `<circle class="halo" cx="126" cy="98" r="18" fill="#fff6c0" opacity=".6"/><g class="egg"><ellipse cx="126" cy="98" rx="8" ry="10" fill="#fdf3dc" ${AXL}/><circle cx="123" cy="96" r="1.6" fill="#f08aa6"/><circle cx="129" cy="101" r="1.4" fill="#7fb6e0"/></g><path d="M106 104 Q126 118 146 104 Q146 112 126 113 Q106 112 106 104Z" fill="#b38a62" ${AXL}/><path d="M108 106 l10 4 M144 106 l-10 4 M114 110 l8 -2 M138 110 l-8 -2" stroke="#8a6448" stroke-width="1.2"/>${axPet(c, 82, 112, 'amour', 'pet lean')}<path class="spk" d="${axStar(144, 84, 3.4)}" fill="#fff6a8"/>`);
axDef('tracks', 'curieux', [170, 80], ['Des traces ! {n} mène l’enquête.', 'Le nez au sol, comme un vrai détective.', 'Petites pattes, grandes pattes… qui est passé ici ?'],
  c => `${Array.from({ length: 6 }, (_, i) => `<g class="pr" style="animation-delay:${(i * 0.42).toFixed(2)}s"><ellipse cx="${66 + i * 20}" cy="${i % 2 ? 114 : 109}" rx="3" ry="2.2" fill="#8a6448" opacity=".75"/><circle cx="${63 + i * 20}" cy="${i % 2 ? 111 : 106}" r="1" fill="#8a6448"/><circle cx="${69 + i * 20}" cy="${i % 2 ? 111 : 106}" r="1" fill="#8a6448"/></g>`).join('')}${axPet(c, 44, 112, 'curieux', 'pet sniff')}<g class="mag"><circle cx="0" cy="0" r="0"/></g>`);
axDef('surprise', 'surpris', [146, 70], ['Bouh ! Qui est là ?', '{n} a fait un bond de trois mètres.', 'Ce n’était qu’un petit voisin curieux.'],
  c => `${axPet(c, 84, 112, 'surpris', 'pet back')}<g class="excl"><circle cx="70" cy="48" r="8" fill="#ffe46a" ${AXL}/><text x="70" y="52.5" text-anchor="middle" font-size="12" font-weight="800" fill="#d9607e">!</text></g>${axCritter(c, 146, 104, 'crit popc')}<path d="M118 114 Q114 92 132 94 Q138 80 152 88 Q166 80 172 96 Q186 98 180 114Z" fill="#5fa063" ${AXL}/>`);
axDef('fall', 'boude', [100, 40], ['Aïe ! Plus de peur que de mal.', 'Patatras ! {n} se relève, digne.', 'Petite chute, grand courage.'],
  c => `${axPet(c, 100, 112, 'boude', 'pet tumble')}<g class="orb"><path d="${axStar(100, 52, 4)}" fill="#ffe46a" ${AXL}/><path d="${axStar(84, 60, 3)}" fill="#ffe46a"/><path d="${axStar(116, 60, 3)}" fill="#ffe46a"/></g><g class="puff"><circle cx="80" cy="110" r="5" fill="#fff" opacity=".8"/><circle cx="122" cy="110" r="4" fill="#fff" opacity=".8"/></g>`);
axDef('magic', 'surpris', [100, 30], ['Pouf ! Des étincelles partout.', 'Les fées font une ronde autour de {n}.', 'Tout tourne… c’est magique !'],
  c => `${Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2, x = 100 + Math.cos(a) * 44, y = 108 + Math.sin(a) * 6; return `<g><rect x="${x - 1.5}" y="${y - 6}" width="3" height="6" fill="#f6ead2"/><path d="M${x - 5} ${y - 5} Q${x} ${y - 12} ${x + 5} ${y - 5}Z" fill="#e2584d" ${AXL}/></g>`; }).join('')}<circle class="halo" cx="100" cy="88" r="26" fill="#fff6c0" opacity=".45"/>${axPet(c, 100, 112, 'surpris', 'pet float')}<g class="spin">${[0, 1, 2, 3, 4].map(i => `<path d="${axStar(100 + Math.cos(i * 1.256) * 34, 80 + Math.sin(i * 1.256) * 22, 3.4)}" fill="${['#fff6a8', '#f6b8d8', '#bfe8ff'][i % 3]}"/>`).join('')}</g>`);
axDef('run', 'content', [130, 70], ['Raccourci ! {n} fonce.', 'Plus vite que le vent (enfin presque).', 'Zoum ! Le voyage raccourcit.'],
  c => `<g class="spd"><path d="M20 70 h30 M10 86 h40 M24 100 h26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></g>${axPet(c, 110, 112, 'content', 'pet dash')}<g class="dust"><circle cx="86" cy="110" r="4" fill="#fff" opacity=".7"/><circle cx="76" cy="107" r="3" fill="#fff" opacity=".6"/></g>`);
axDef('shiver', 'triste', [100, 40], ['Brrr… {n} rêve d’une écharpe.', 'Il fait froid ! Un bonnet serait parfait.', 'Les moustaches gèlent. Brrrr.'],
  c => `${Array.from({ length: 8 }, (_, i) => `<circle class="flk" style="animation-delay:${(i * 0.4).toFixed(1)}s" cx="${15 + i * 24}" cy="-4" r="2" fill="#fff"/>`).join('')}${axPet(c, 100, 112, 'triste', 'pet shake')}<g class="breath"><circle cx="122" cy="80" r="4" fill="#fff" opacity=".8"/><circle cx="130" cy="76" r="3" fill="#fff" opacity=".6"/></g>`);
axDef('map', 'fier', [126, 70], ['Un bout de carte ! La croix rouge, c’est le trésor ?', '{n} déroule un vieux parchemin…', 'Une rumeur de trésor. Affaire à suivre !'],
  c => `<g class="btl"><path d="M114 112 h20 q4 0 4 -4 v-6 q0 -4 -4 -4 h-12 l-4 -4 h-4Z" fill="#bfe1d8" opacity=".85" ${AXL}/></g><g class="scroll"><rect x="110" y="62" width="34" height="24" fill="#f2dfae" ${AXL}/><path d="M116 70 q6 -4 10 2 q4 5 10 -2" stroke="#c9604f" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/><path d="M134 74 l5 5 M139 74 l-5 5" stroke="#c9604f" stroke-width="2"/></g>${axPet(c, 80, 112, 'fier', 'pet idle')}`);
// rencontre d'un familier sauvage : il s'approche, renifle, recule, fait un cœur
const axWildImg = (c, x, mood, cls) => c.wild ? `<g class="${cls}"><image href="${nsPortrait(c.wild.sp, c.wild.genes, null, mood)}" x="${x - 20}" y="68" width="40" height="44"/></g>` : axCritter(c, x, 112, cls);
axDef('wild', 'curieux', [150, 60], ['Qui se cache derrière ce buisson ?'],
  c => `${axPet(c, 62, 112, 'curieux', 'pet lean')}${axWildImg(c, 152, 'curieux', 'wl')}<path d="M150 114 Q144 96 160 96 Q166 84 180 92 Q196 92 196 114Z" fill="#5fa063" ${AXL}/>${axHeart(126, 66, 1, 'wh')}<g class="snf"><path d="M118 92 q-3 -3 0 -6 M114 94 q-3 -3 0 -6" stroke="#fff" stroke-width="1.4" fill="none"/></g>`);
axDef('wildlove', 'amour', [110, 50], ['Coup de foudre ! Il suit {n} partout.'],
  c => `${axPet(c, 80, 112, 'amour', 'pet hopl')}${axWildImg(c, 124, 'amour', 'wlv')}${axHeart(100, 60, 1.1, 'hrt h1')}${axHeart(114, 52, 0.8, 'hrt h2')}${axHeart(90, 50, 0.7, 'hrt h3')}`);
axDef('wildflee', 'triste', [150, 60], ['Il est reparti… une autre fois !'],
  c => `${axPet(c, 70, 112, 'triste', 'pet idle')}${axWildImg(c, 140, 'boude', 'wfl')}<g class="dust"><circle cx="122" cy="110" r="4" fill="#fff" opacity=".7"/></g>`);

// ---------- quelle séquence ? ----------
const AX_RULES = [
  ['climb', /grimp|escalad|arbre|branche|chêne|cime|sommet/],
  ['fish', /pêch|canne|poisson/],
  ['swim', /nag|plong|plouf|baign|courant|vague/],
  ['bridge', /\bpont\b|passerelle|pont de corde/],
  ['stones', /pierre en pierre|galet|ruisseau|gué|botte/],
  ['dig', /creus|fouill|terrier|sable|enterr|souche|racine/],
  ['pick', /cueill|fruit|baie|champignon|pomme|cerise|noisette|mangue/],
  ['slide', /glis|luge|toboggan|pente/],
  ['leaf', /abri|feuille|parapluie/],
  ['snack', /goûter|partag|offr|festin|tisane|biscuit|miam/],
  ['photo', /photo|dessin|croqu|carnet|souvenir|crayon/],
  ['lost', /perd|demi-tour|rebrouss|égar/],
  ['sleep', /dorm|sieste|étoile|dodo/],
  ['map', /carte|bouteille|rumeur|parchemin/],
  ['nest', /nid|œuf/],
  ['chest', /coffre|trésor|brill|éclat|or\b/],
  ['magic', /fée|vœu|magi|cercle|lucioles/],
  ['tracks', /trace|empreinte|sentier|suivre|piste|renifl/],
  ['surprise', /cach|fourré|bruit|surpri|sursaut|bouh/],
  ['hello', /ami|frapp|salu|hibou|devinette|bonjour|aider|papote/],
  ['run', /route|raccourci|vite|filer|file |cours|fonce/],
];
function axActFor(text, fx, ok) {
  fx = fx || '';
  if (ok === false && /hurt|time\+|back/.test(fx)) return 'fall';
  if (/\bhurt\b/.test(fx)) return 'fall';
  const s = String(text || '').toLowerCase();
  for (const [id, re] of AX_RULES) if (re.test(s)) return id;
  if (/egg/.test(fx)) return 'nest';
  if (/friend|give/.test(fx)) return 'hello';
  if (/rumor/.test(fx)) return 'map';
  if (/rare/.test(fx)) return 'chest';
  if (/place|photo/.test(fx)) return 'photo';
  if (/time-/.test(fx)) return 'run';
  if (/back/.test(fx)) return 'lost';
  if (/loot|food/.test(fx)) return 'dig';
  return '';
}
// séquence d'une option : son texte, ou ce qu'elle demande (bottes, nageur, grimpeur…)
function axOptAct(opt, k) {
  const need = (opt.need || []).flat().join(' ');
  if (/wear:pieds:bottes/.test(need)) return 'stones';
  if (/sp:axo|phoque/.test(need) && /nag|plong|courant|eau/i.test(opt.a)) return 'swim';
  const r = axActFor(opt.a, '', true) || axActFor((opt.r && opt.r.t) || (opt.go && opt.go.q) || '', (opt.r && opt.r.fx) || '', true);
  return r || 'walk';
}
const AX_BIOME = { foret: ['tracks', 'climb', 'pick', 'dig', 'snack'], jungle: ['climb', 'pick', 'swim', 'surprise'], mer: ['swim', 'dig', 'fish', 'photo'], lac: ['fish', 'stones', 'swim', 'snack'], montagne: ['climb', 'bridge', 'photo', 'tracks'], neige: ['slide', 'tracks', 'photo'], desert: ['dig', 'tracks', 'lost', 'photo'], ville: ['photo', 'snack', 'hello', 'lost'], quartier: ['photo', 'hello', 'snack', 'lost'], campagne: ['pick', 'snack', 'tracks', 'hello'] };
function axIdle(c, slot, moving) {
  if (moving && slot % 2 === 0) return 'walk';
  let L = (AX_BIOME[c.biome] || AX_BIOME.campagne).slice();
  if (c.tod === 'nuit') L = ['sleep', 'tracks', 'lost', 'snack'];
  if (c.wx === 'pluie') L.unshift(c.o.pieds === 'bottes' ? 'puddle' : 'leaf');
  if (c.wx === 'neige' || c.biome === 'neige') { const warm = c.o.cou === 'echarpe' || c.o.tete === 'bonnet' || c.o.mains === 'moufles'; L = warm ? ['slide', ...L] : ['shiver', ...L.filter(x => x !== 'slide')]; }
  if (c.swimmer && ['mer', 'lac', 'jungle'].includes(c.biome)) L.unshift('swim');
  if (c.climber && ['foret', 'jungle', 'montagne'].includes(c.biome) && c.tod !== 'nuit') L.unshift('climb');
  if (c.o.dos === 'sac' && c.tod !== 'nuit') L.push('pick');
  L = [...new Set(L)];
  return L[Math.floor(slot / (moving ? 2 : 1)) % L.length];
}
const AX_CRIT = { foret: 'herisson', campagne: 'lapin', montagne: 'lapin', desert: 'lapin', lac: 'grenouille', jungle: 'oiseau', mer: 'oiseau', neige: 'oiseau', ville: 'oiseau', quartier: 'oiseau' };
function axCtx(k, biome, tod, wx, extra) {
  const sp = typeof avSp === 'function' ? avSp(k) : k;
  return Object.assign({ k, sp, biome, tod: tod || 'jour', wx: wx || 'clair', o: (S.outfits && S.outfits[k]) || {}, swimmer: ['axo', 'phoque', 'capy'].includes(sp), climber: ['panda', 'lemur', 'paresseux', 'tanuki'].includes(sp), critter: AX_CRIT[biome] || 'herisson' }, extra || {});
}
const AX_SKY = { jour: '#bfe6f6', soir: '#fbd2b0', nuit: '#33407a' };
const AX_GROUND = { foret: '#9ccb78', jungle: '#7cbf6a', mer: '#f2dfae', lac: '#a6d185', montagne: '#a9c98a', neige: '#f6f9fd', desert: '#f6d9a0', ville: '#cfc6b8', quartier: '#cfc6b8', campagne: '#a8d27e' };
function axGift(id, items, gift) {
  const A = AX[id] || AX.walk, [x, y] = A.g || [100, 40], its = (items || []).slice(0, 3), n = its.length;
  if (!n && !gift) return '';
  let ic = '';
  try { ic = n ? its.map((it, i) => itemIcon(it).replace('<svg ', `<svg x="${(x - 9 + (i - (n - 1) / 2) * 20).toFixed(1)}" y="${y - 18}" width="18" height="18" `)).join('') : `<path d="${axStar(x, y - 9, 8)}" fill="#ffd95a" ${AXL}/>`; } catch (e) { ic = ''; }
  return `<g class="gift"><ellipse class="glow" cx="${x}" cy="${y - 9}" rx="${13 + Math.max(0, n - 1) * 10}" ry="13" fill="#fff6c0" opacity=".9"/>${ic}<path class="spk" d="${axStar(x + 12 + n * 6, y - 18, 3)}" fill="#fff"/></g>`;
}
function axSVG(id, c, o) {
  o = o || {};
  const A = AX[id] || AX.walk;
  let s = '';
  try { s = A.draw(c); } catch (e) { console.error('séquence', id, e); s = ''; }
  if (!o.thumb) s += axGift(A.id, o.items, o.gift);
  if (c.tod === 'nuit' && !o.thumb && A.id !== 'sleep') s += [30, 150, 176].map((x, i) => `<circle class="ffy" style="animation-delay:${i * 0.5}s" cx="${x}" cy="${60 + i * 14}" r="1.8" fill="#fff6a8"/>`).join('');
  const bg = o.thumb || o.bg ? `<rect x="-60" y="-10" width="320" height="140" fill="${AX_SKY[c.tod] || AX_SKY.jour}"/><rect x="-60" y="104" width="320" height="30" fill="${AX_GROUND[c.biome] || '#a8d27e'}"/>` : '';
  const mods = [c.swimmer ? 'swimmer' : '', c.climber ? 'climber' : '', c.o.pieds === 'bottes' ? 'w-bottes' : '', c.wildMood ? 'wm-' + c.wildMood : '', o.cls || ''].join(' ');
  return `<svg class="axs ax-${A.id} ${mods}" viewBox="0 0 200 120" preserveAspectRatio="${o.thumb || o.bg ? 'xMidYMid slice' : 'xMidYMax meet'}" aria-hidden="true">${bg}${s}</svg>`;
}
const axLine = (id, slot) => { const L = (AX[id] || AX.walk).c; return L[(slot || 0) % L.length]; };

// ---------- styles des séquences ----------
(function axCSS() {
  const st = document.createElement('style'); st.id = 'axCSS';
  st.textContent = `
.axs{display:block;width:100%;height:100%;overflow:visible}
.axs g,.axs path,.axs circle,.axs ellipse,.axs text,.axs rect{transform-box:fill-box;transform-origin:50% 100%}
.axs .pet{animation:axBob 1.6s ease-in-out infinite}
.axs .pet.bob{animation:axWalkB .55s ease-in-out infinite alternate}
@keyframes axBob{50%{transform:translateY(-2px) scale(1.02,.98)}}
@keyframes axWalkB{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-3px) rotate(3deg)}}
.axs .dust circle{animation:axDust .9s ease-out infinite}
@keyframes axDust{from{opacity:.8;transform:translateX(0) scale(.6)}to{opacity:0;transform:translateX(-14px) scale(1.4)}}
/* grimper */
.axs .climb{animation:axClimb 3.4s ease-in-out infinite}
@keyframes axClimb{0%,8%{transform:translate(0,0)}20%{transform:translate(2px,-16px) rotate(-4deg)}32%{transform:translate(-1px,-32px) rotate(4deg)}46%,72%{transform:translate(1px,-56px) rotate(0)}90%,100%{transform:translate(0,0)}}
.ax-climb:not(.climber) .climb{animation-name:axClimbSlip;animation-duration:3.8s}
@keyframes axClimbSlip{0%,6%{transform:translate(0,0)}24%{transform:translate(1px,-26px) rotate(-5deg)}32%{transform:translate(0,-10px) rotate(6deg)}54%{transform:translate(1px,-40px) rotate(-4deg)}66%,78%{transform:translate(0,-48px)}100%{transform:translate(0,0)}}
.axs .crown{animation:axSway 3s ease-in-out infinite alternate;transform-origin:50% 100%}
@keyframes axSway{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}
.axs .leaf{animation:axLeaf 3.4s ease-in infinite}.axs .leaf.l2{animation-delay:1.5s}
@keyframes axLeaf{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translate(-14px,66px) rotate(200deg)}}
/* nager */
.axs .swim{animation:axSwim 3.2s ease-in-out infinite}
@keyframes axSwim{0%,100%{transform:translate(-8px,-2px) rotate(-3deg)}30%{transform:translate(8px,2px) rotate(3deg)}55%{transform:translate(0,0)}68%{transform:translate(2px,26px) rotate(30deg)}82%{transform:translate(0,-6px) rotate(-6deg)}}
.ax-swim:not(.swimmer) .swim{animation:axFloat 2.4s ease-in-out infinite}
@keyframes axFloat{0%,100%{transform:translate(-4px,0) rotate(-3deg)}50%{transform:translate(4px,3px) rotate(3deg)}}
.axs .wave{animation:axWave 2.4s linear infinite}
@keyframes axWave{from{transform:translateX(0)}to{transform:translateX(-50px)}}
.axs .bub{animation:axBub 2.2s ease-out infinite}.axs .bub.b2{animation-delay:.7s}.axs .bub.b3{animation-delay:1.4s}
@keyframes axBub{from{opacity:.9;transform:translateY(0)}to{opacity:0;transform:translateY(-30px)}}
.axs .splash{opacity:0;animation:axSplash 3.2s ease-out infinite;animation-delay:2.15s}
.ax-swim:not(.swimmer) .splash{animation:none}
@keyframes axSplash{0%{opacity:1;transform:scale(.4)}20%{opacity:1;transform:scale(1.2)}35%,100%{opacity:0;transform:scale(1.3)}}
/* pierres */
.axs .hop3{animation:axHop3 3.6s ease-in-out infinite}
@keyframes axHop3{0%{opacity:0;transform:translate(0,0)}5%{opacity:1;transform:translate(0,0)}14%{transform:translate(15px,-18px)}22%,30%{transform:translate(30px,-2px)}38%{transform:translate(48px,-18px)}46%,54%{transform:translate(66px,-2px)}62%{transform:translate(84px,-18px)}70%,76%{transform:translate(102px,-2px)}84%{transform:translate(118px,-16px)}90%{opacity:1;transform:translate(130px,0)}100%{opacity:0;transform:translate(130px,0)}}
.ax-stones.w-bottes .hop3{animation-name:axWade}
@keyframes axWade{0%{opacity:0;transform:translate(0,0)}6%{opacity:1}30%{transform:translate(40px,4px) rotate(4deg)}50%{transform:translate(66px,6px) rotate(-4deg)}70%{transform:translate(96px,4px) rotate(4deg)}90%{opacity:1;transform:translate(130px,0)}100%{opacity:0;transform:translate(130px,0)}}
.axs .splash.s2{animation-delay:1.6s}
.axs .rip{animation:axWave 3s linear infinite alternate}
/* pont */
.axs .cross{animation:axCross 4s ease-in-out infinite}
@keyframes axCross{0%{opacity:0;transform:translate(0,0)}6%{opacity:1}25%{transform:translate(35px,7px) rotate(-3deg)}45%{transform:translate(62px,10px) rotate(3deg)}52%{transform:translate(78px,-6px)}58%{transform:translate(92px,10px)}78%{transform:translate(118px,6px) rotate(-2deg)}92%{opacity:1;transform:translate(140px,0)}100%{opacity:0;transform:translate(140px,0)}}
.axs .sway{transform-origin:50% 0;animation:axSway 2s ease-in-out infinite alternate}
/* creuser */
.axs .dig{animation:axDig .32s ease-in-out infinite alternate;transform-origin:70% 100%}
@keyframes axDig{from{transform:rotate(-6deg) translateY(0)}to{transform:rotate(8deg) translateY(-2px)}}
.axs .dirt circle{animation:axDirt .9s ease-out infinite}.axs .dirt .d1{animation-delay:.3s}.axs .dirt .d2{animation-delay:.6s}
@keyframes axDirt{from{opacity:1;transform:translate(14px,14px)}to{opacity:0;transform:translate(-10px,-6px)}}
/* pêche */
.axs .bobr{animation:axBobr 1.4s ease-in-out infinite}
@keyframes axBobr{50%{transform:translateY(2px)}80%{transform:translateY(5px)}}
.axs .rod{transform-origin:0 100%;animation:axRod 3.2s ease-in-out infinite}
@keyframes axRod{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-8deg)}}
.axs .fishj{opacity:0;animation:axFish 3.2s ease-out infinite}
@keyframes axFish{0%,55%{opacity:0;transform:translate(0,0) rotate(0)}60%{opacity:1}75%{transform:translate(-8px,-26px) rotate(-40deg)}90%{opacity:1;transform:translate(-16px,0) rotate(-120deg)}100%{opacity:0}}
.axs .idle{animation:axBob 2.2s ease-in-out infinite}
/* cueillir */
.axs .fruit{animation:axFruit 3s ease-in infinite}.axs .fruit.f1{animation-delay:1s}.axs .fruit.f2{animation-delay:2s}
@keyframes axFruit{0%,20%{opacity:1;transform:translate(0,0)}60%{opacity:1;transform:translate(-38px,30px)}70%,100%{opacity:0;transform:translate(-40px,34px)}}
.axs .bush{animation:axSway 1.5s ease-in-out infinite alternate}
.axs .hopl{animation:axHopL 1.5s ease-in-out infinite}
@keyframes axHopL{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(-8px)}}
/* glisser */
.axs .slide{animation:axSlide 3s ease-in infinite}
@keyframes axSlide{0%{opacity:0;transform:translate(0,0) rotate(18deg)}8%{opacity:1}70%{transform:translate(124px,46px) rotate(20deg)}80%{transform:translate(134px,44px) rotate(-6deg)}90%{opacity:1;transform:translate(138px,48px) rotate(0)}100%{opacity:0;transform:translate(138px,48px)}}
.axs .scarf{transform-origin:100% 50%;animation:axScarf .3s ease-in-out infinite alternate}
@keyframes axScarf{from{transform:rotate(-10deg)}to{transform:rotate(12deg)}}
.axs .puff circle{animation:axDust 1s ease-out infinite}
/* pluie, feuille, flaque */
.axs .drp{animation:axDrop .8s linear infinite}
@keyframes axDrop{from{transform:translateY(0)}to{transform:translateY(120px)}}
.axs .leafu{transform-origin:50% 100%;animation:axSway 1.6s ease-in-out infinite alternate}
.axs .bnc circle{animation:axBnc .8s ease-out infinite}
@keyframes axBnc{from{opacity:1;transform:translate(0,0)}to{opacity:0;transform:translate(0,14px)}}
.axs .jump{animation:axJump 1.4s ease-in-out infinite}
@keyframes axJump{0%,100%{transform:translateY(0) scale(1.06,.94)}40%{transform:translateY(-22px) scale(.96,1.04)}70%{transform:translateY(0) scale(1.1,.9)}}
.axs .splash.s3{animation:axSplash 1.4s ease-out infinite;animation-delay:.95s}
/* goûter, bonjour */
.axs .cookie{animation:axCookie 3s ease-in-out infinite}
@keyframes axCookie{0%,15%{transform:translate(-8px,0)}45%,70%{transform:translate(22px,-4px)}100%{transform:translate(-8px,0)}}
.axs .crit.nod{animation:axHopL 1.2s ease-in-out infinite}
.axs .hrt{opacity:0;animation:axHeart 2.4s ease-out infinite}.axs .hrt.h2{animation-delay:.8s}.axs .hrt.h3{animation-delay:1.5s}
@keyframes axHeart{0%{opacity:0;transform:translateY(8px) scale(.4)}25%{opacity:1;transform:translateY(0) scale(1.1)}100%{opacity:0;transform:translateY(-24px) scale(1)}}
.axs .bubl{animation:axPop 2.6s ease-out infinite}
@keyframes axPop{0%,10%{opacity:0;transform:scale(.3)}25%,85%{opacity:1;transform:scale(1)}100%{opacity:0}}
/* photo */
.axs .flash{opacity:0;animation:axFlash 3.2s linear infinite}
@keyframes axFlash{0%,38%{opacity:0}41%{opacity:.95}52%,100%{opacity:0}}
.axs .polar{opacity:0;animation:axPolar 3.2s ease-out infinite}
@keyframes axPolar{0%,44%{opacity:0;transform:translateY(10px) rotate(0) scale(.5)}60%,92%{opacity:1;transform:translateY(-4px) rotate(8deg) scale(1)}100%{opacity:0}}
/* perdu, puis trouvé */
.axs .look{animation:axLook 3.6s ease-in-out infinite;transform-origin:50% 100%}
@keyframes axLook{0%,20%{transform:scaleX(1)}25%,45%{transform:scaleX(-1)}50%,100%{transform:scaleX(1)}}
.axs .qm{animation:axQ 3.6s ease-in-out infinite}
@keyframes axQ{0%{opacity:0;transform:scale(.4)}10%,45%{opacity:1;transform:scale(1)}52%,100%{opacity:0;transform:scale(.4)}}
.axs .bulb{opacity:0;animation:axBulb 3.6s ease-out infinite}
@keyframes axBulb{0%,52%{opacity:0;transform:scale(.4)}62%{opacity:1;transform:scale(1.2)}70%,94%{opacity:1;transform:scale(1)}100%{opacity:0}}
/* dodo */
.axs .tw{animation:axTw 2s ease-in-out infinite alternate;transform-origin:50% 50%}
@keyframes axTw{from{opacity:.3}to{opacity:1}}
.axs .shoot{opacity:0;animation:axShoot 4s ease-out infinite}
@keyframes axShoot{0%,70%{opacity:0;transform:translate(0,0)}75%{opacity:1}90%,100%{opacity:0;transform:translate(-40px,18px)}}
.axs .breathe{animation:axBreathe 3s ease-in-out infinite}
@keyframes axBreathe{50%{transform:scale(1.03,.97)}}
.axs .z{opacity:0;animation:axZ 3s ease-out infinite}.axs .z2{animation-delay:1s}.axs .z3{animation-delay:2s}
@keyframes axZ{0%{opacity:0;transform:translate(0,6px)}30%{opacity:1}100%{opacity:0;transform:translate(8px,-10px)}}
.axs .flm{animation:axFlm .4s ease-in-out infinite alternate}.axs .flm.f2{animation-duration:.3s}
@keyframes axFlm{from{transform:scale(1,1)}to{transform:scale(.85,1.15)}}
.axs .ffy{animation:axTw 1.2s ease-in-out infinite alternate}
/* coffre, nid */
.axs .rays{transform-origin:50% 50%;animation:axSpin 8s linear infinite}
@keyframes axSpin{to{transform:rotate(360deg)}}
.axs .lid{transform-origin:0 100%;animation:axLid 3.2s ease-in-out infinite}
@keyframes axLid{0%,25%{transform:rotate(0)}40%,85%{transform:rotate(-32deg)}100%{transform:rotate(0)}}
.axs .spk{transform-origin:50% 50%;animation:axSpk 1.4s ease-in-out infinite}.axs .spk.k2{animation-delay:.7s}
@keyframes axSpk{0%,100%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1.2) rotate(45deg)}}
.axs .egg{animation:axWob 1.6s ease-in-out infinite}
@keyframes axWob{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}90%{transform:rotate(-5deg)}}
.axs .halo{transform-origin:50% 50%;animation:axHalo 1.6s ease-in-out infinite alternate}
@keyframes axHalo{from{opacity:.25;transform:scale(.9)}to{opacity:.75;transform:scale(1.1)}}
.axs .lean{animation:axLean 2.4s ease-in-out infinite}
@keyframes axLean{0%,100%{transform:rotate(0)}50%{transform:rotate(6deg) translateX(3px)}}
/* traces */
.axs .pr{opacity:0;animation:axPr 3.6s ease-out infinite}
@keyframes axPr{0%{opacity:0}8%,70%{opacity:1}100%{opacity:0}}
.axs .sniff{animation:axSniff 3.6s ease-in-out infinite}
@keyframes axSniff{0%{opacity:0;transform:translate(0,0)}6%{opacity:1}20%{transform:translate(22px,0) rotate(6deg)}30%{transform:translate(30px,-2px) rotate(0)}50%{transform:translate(62px,0) rotate(6deg)}60%{transform:translate(70px,-2px) rotate(0)}85%{opacity:1;transform:translate(110px,0) rotate(6deg)}100%{opacity:0;transform:translate(118px,0)}}
/* surprise */
.axs .back{animation:axBack 3s ease-out infinite}
@keyframes axBack{0%,30%{transform:translate(0,0)}38%{transform:translate(-18px,-20px) rotate(-10deg)}48%,85%{transform:translate(-22px,0) rotate(0)}100%{transform:translate(0,0)}}
.axs .excl{opacity:0;animation:axQ2 3s ease-out infinite}
@keyframes axQ2{0%,30%{opacity:0;transform:scale(.3)}36%,80%{opacity:1;transform:scale(1.1)}90%,100%{opacity:0}}
.axs .popc{animation:axPopc 3s ease-out infinite}
@keyframes axPopc{0%,20%{transform:translateY(18px)}30%,80%{transform:translateY(-8px)}36%{transform:translateY(-14px)}100%{transform:translateY(18px)}}
/* chute */
.axs .tumble{animation:axTumble 3s ease-in-out infinite;transform-origin:50% 60%}
@keyframes axTumble{0%{transform:translate(-20px,-30px) rotate(-180deg)}25%{transform:translate(0,0) rotate(0)}32%{transform:translate(0,0) scale(1.1,.88)}40%,100%{transform:translate(0,0) scale(1)}}
.axs .orb{transform-origin:50% 50%;animation:axSpin 1.6s linear infinite}
/* magie, course, froid, carte */
.axs .float{animation:axFloat2 2.4s ease-in-out infinite}
@keyframes axFloat2{50%{transform:translateY(-12px)}}
.axs .spin{transform-origin:50% 50%;animation:axSpin 4s linear infinite}
.axs .dash{animation:axDash .3s ease-in-out infinite alternate}
@keyframes axDash{from{transform:rotate(8deg) translateY(0)}to{transform:rotate(10deg) translateY(-4px)}}
.axs .spd{animation:axSpd .5s linear infinite}
@keyframes axSpd{from{transform:translateX(20px);opacity:0}30%{opacity:1}to{transform:translateX(-30px);opacity:0}}
.axs .shake{animation:axShake .12s linear infinite alternate}
@keyframes axShake{from{transform:translateX(-1.2px)}to{transform:translateX(1.2px)}}
.axs .breath circle{animation:axDust 1.6s ease-out infinite}
.axs .flk{animation:axFlk 3.2s linear infinite}
@keyframes axFlk{from{transform:translate(0,0)}to{transform:translate(-14px,124px)}}
.axs .scroll{transform-origin:0 50%;animation:axScroll2 3.2s ease-out infinite}
@keyframes axScroll2{0%,15%{opacity:0;transform:scaleX(.1) translateY(30px)}40%,90%{opacity:1;transform:scaleX(1) translateY(0)}100%{opacity:0}}
/* sauvage */
.axs .wl{animation:axApproach 4.4s ease-in-out infinite}
@keyframes axApproach{0%{transform:translate(18px,8px)}22%{transform:translate(-28px,0)}30%{transform:translate(-30px,-2px) rotate(-6deg)}36%{transform:translate(-30px,0) rotate(5deg)}44%{transform:translate(-30px,-2px) rotate(-5deg)}56%{transform:translate(4px,4px)}74%{transform:translate(-22px,0)}90%{transform:translate(-22px,-6px)}100%{transform:translate(18px,8px)}}
.wm-timide .wl{animation-duration:5.6s}
.wm-joueur .wl{animation-duration:3.2s}
.axs .wh{opacity:0;animation:axWh 4.4s ease-out infinite}
@keyframes axWh{0%,80%{opacity:0;transform:scale(.3)}88%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:translateY(-12px)}}
.wm-timide .wh{animation-duration:5.6s}.wm-joueur .wh{animation-duration:3.2s}
.axs .snf{opacity:0;animation:axSnf 4.4s ease-out infinite}
@keyframes axSnf{0%,26%{opacity:0}30%,46%{opacity:1}52%,100%{opacity:0}}
.hesit .wl{animation:axShy .35s ease-in-out infinite alternate}
@keyframes axShy{from{transform:translate(-14px,0) rotate(-5deg)}to{transform:translate(-8px,0) rotate(5deg)}}
.hesit .wh{display:none}
.axs .wlv{animation:axHopL 1s ease-in-out infinite}
.axs .wfl{animation:axFlee 2.4s ease-in forwards}
@keyframes axFlee{0%{transform:translate(0,0)}30%{transform:translate(-6px,-6px)}100%{opacity:0;transform:translate(90px,0)}}
/* l'objet trouvé monte en brillant */
.axs .gift{opacity:0;transform-origin:50% 50%;animation:axGift 3.4s ease-out infinite;animation-delay:.9s}
@keyframes axGift{0%{opacity:0;transform:translateY(16px) scale(.3)}25%{opacity:1}50%,88%{opacity:1;transform:translateY(-10px) scale(1.25)}100%{opacity:0;transform:translateY(-16px) scale(1.2)}}
.axs .glow{transform-origin:50% 50%;animation:axHalo .8s ease-in-out infinite alternate}
@media (prefers-reduced-motion: reduce){
  .axs *,.axs{animation:none!important}
  .axs .gift,.axs .polar,.axs .bulb,.axs .hrt,.axs .scroll,.axs .wh{opacity:1}
  .axs .flash,.axs .qm,.axs .shoot,.axs .fishj,.axs .splash{opacity:0}
}
`;
  document.head.appendChild(st);
})();

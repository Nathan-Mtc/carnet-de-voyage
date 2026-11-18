// ================= 99 · BOUTONS DE LA CARTE ET FILTRE DES LIEUX (v98) =================
// Le joueur (19/11) : « les onglets à droite sont trop au centre, quand on déplie ça prend tout l'écran, et il n'y a pas tous les types de lieux ».
//  - la colonne de boutons se range en haut à droite, juste sous la ligne du chapitre ;
//  - le menu des lieux : une petite colonne compacte, ouverte sous le bouton, collée au bord droit (v99) ;
//  - tous les types de lieux ont leur filtre : + « Sorties et sport » (piscine, terrain de sport, aire de jeux, cinéma, hôtel) et « Rues et routes ».
const uc$ = (f, d) => { try { return f(); } catch (e) { return d; } };
uc$(() => {
  POI_FILTERS.push(['sorties', 'Sorties et sport', ['piscine', 'sport', 'jeux', 'cinema', 'hotel']], ['rues', 'Rues et routes', ['rue', 'route']]);
  const cu = POI_FILTERS.find(f => f[0] === 'culture'); if (cu) cu[2] = cu[2].filter(c => c !== 'cinema');
  POI_FILT_LOOK.sorties = [POI_CATS.sport[1], POI_GLYPH[POI_CATS.sport[2]] || POI_GLYPH.ball || POI_FILT_LOOK.tout[1]];
  POI_FILT_LOOK.rues = [POI_CATS.rue[1], POI_GLYPH[POI_CATS.rue[2]] || POI_GLYPH.sign || POI_FILT_LOOK.tout[1]];
});
// la colonne sous la ligne du chapitre (elle suit sa hauteur réelle)
function ucPlace() {
  const z = document.querySelector('.zoom'); if (!z) return;
  const g = document.getElementById('cmGoal'), top = g && g.offsetParent ? Math.round(g.getBoundingClientRect().bottom + 12) : 150;
  const v = Math.max(110, Math.min(innerHeight - 380, top)) + 'px';
  if (z.style.top !== v) z.style.top = v;
}
setInterval(() => { if (!document.hidden) uc$(ucPlace); }, 800);
addEventListener('resize', () => uc$(ucPlace));
{
  const css = document.createElement('style');
  css.textContent = `
.zoom{top:150px;transform:none!important}
#poiFilt{right:0!important;left:auto!important;top:62px!important;width:172px!important;display:flex!important;flex-direction:column!important;gap:1px!important;padding:5px!important;max-height:calc(100vh - 330px);overflow:auto;z-index:6}
#poiFilt[hidden]{display:none!important}
#poiFilt h4{margin:1px 4px 3px!important;font-size:10px!important}
#poiFilt button{padding:3px 5px!important;gap:7px!important;border-radius:9px!important;min-height:0!important}
#poiFilt .pfi{width:20px!important;height:20px!important;border-width:1.5px!important}#poiFilt .pfi svg{width:12px!important;height:12px!important}
#poiFilt .pft b{font:800 12px/1.1 var(--display)!important;white-space:nowrap}
#poiFilt .pft>:not(b){display:none!important}
`;
  document.head.appendChild(css);
}

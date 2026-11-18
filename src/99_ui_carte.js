// ================= 99 · BOUTONS DE LA CARTE ET FILTRE DES LIEUX (v98) =================
// Le joueur (19/11) : « les onglets à droite sont trop au centre, quand on déplie ça prend tout l'écran, et il n'y a pas tous les types de lieux ».
//  - la colonne de boutons se range en haut à droite, juste sous la ligne du chapitre ;
//  - le menu des lieux devient une petite grille compacte (2 colonnes, sans sous-titres) ;
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
#poiFilt{right:calc(100% + 8px)!important;top:0!important;width:min(250px,calc(100vw - 110px))!important;display:grid!important;grid-template-columns:1fr 1fr;gap:3px!important;padding:6px!important;max-height:calc(100vh - 260px);overflow:auto}
#poiFilt[hidden]{display:none!important}
#poiFilt h4{grid-column:1/-1;margin:0 4px 2px!important;font-size:10.5px!important}
#poiFilt button{padding:4px 5px!important;gap:6px!important;border-radius:10px!important}
#poiFilt .pfi{width:22px!important;height:22px!important}#poiFilt .pfi svg{width:13px!important;height:13px!important}
#poiFilt .pft b{font:800 11.5px/1.15 var(--display)!important}
#poiFilt .pft>:not(b){display:none!important}
`;
  document.head.appendChild(css);
}

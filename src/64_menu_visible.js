// ================= 64 · BOUTON MENU TOUJOURS VISIBLE SUR TÉLÉPHONE (v43) =================
// Sur téléphone, la barre du haut (compagnons + pièces) déborde : le bouton Menu (carnet) sortait de l'écran,
// et le joueur ne trouvait pas « Revoir le tutoriel ». On le range en haut de la colonne de boutons de droite (+, −, 3D…).
{
  const place = () => {
    const g = document.getElementById('gear'), z = document.querySelector('.zoom'), r = document.querySelector('.hud .hright');
    if (!g || !z || !r) return;
    const phone = window.matchMedia('(max-width: 600px)').matches;
    if (phone && g.parentElement !== z) z.prepend(g);
    else if (!phone && g.parentElement !== r) r.insertBefore(g, document.getElementById('settings'));
    g.title = 'Menu (aide, tutoriel, réglages)';
  };
  place();
  window.addEventListener('resize', place);
}

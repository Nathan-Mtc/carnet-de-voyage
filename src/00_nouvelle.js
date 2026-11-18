// ================= 00 · RECOMMENCER UNE PARTIE (v92) =================
// Le joueur (18/11) : « j'aimerais recommencer à 0 pour revoir le tutoriel ».
// Adresse avec ?nouvelle=1 : on demande confirmation, on garde une copie de la partie, puis on repart de zéro.
// Adresse avec ?restaurer=1 : on remet la partie gardée.
(() => {
  try {
    const q = new URLSearchParams(location.search), K = 'carnet-voyage-v2', B = K + '-avant-nouvelle';
    const clean = () => { q.delete('nouvelle'); q.delete('restaurer'); const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); };
    if (q.get('nouvelle') === '1') {
      clean();
      if (localStorage.getItem(K) && confirm('Recommencer une nouvelle partie depuis le début ?\n\nVotre partie actuelle est gardée de côté : vous pourrez la retrouver avec l’adresse …?restaurer=1')) {
        localStorage.setItem(B, localStorage.getItem(K)); localStorage.removeItem(K);
      }
    } else if (q.get('restaurer') === '1') {
      clean();
      const old = localStorage.getItem(B);
      if (old && confirm('Retrouver votre ancienne partie ? (la partie en cours sera remplacée)')) localStorage.setItem(K, old);
    }
  } catch (e) {}
})();

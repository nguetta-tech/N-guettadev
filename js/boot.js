/* ============================================================
   N’GUETTA dev — boot.js
   Petit script chargé dans le <head> AVANT l'affichage de la page.
   Rôle : préparer les "classes d'état" sur <html> pour que le CSS
   sache tout de suite :
     - .js        → JavaScript actif (les animations d'entrée peuvent
                    cacher les éléments avant de les révéler)
     - .no-3d     → le navigateur ne gère pas les transformations 3D
                    (l'effet 3D est alors remplacé par une version plate)
     - .is-loading → l'écran d'ouverture (joueur de foot) est actif.
                    Retiré par preloader.js quand le but est marqué.
                    Jamais ajouté si la personne a demandé « réduire les animations ».
     - .no-anim   → filet de sécurité : si le script principal n'a pas
                    démarré après 3 s, tout le contenu est affiché
   Il est dans un fichier séparé (et non inline) pour rester compatible
   avec la politique de sécurité (CSP) définie dans index.html.
   ============================================================ */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var supports3d = !!(window.CSS && CSS.supports &&
    CSS.supports('transform-style', 'preserve-3d') &&
    CSS.supports('perspective', '1px'));
  if (!supports3d) root.classList.add('no-3d');

  // Écran d'ouverture : seulement si les animations sont autorisées.
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm) root.classList.add('is-loading');

  // FILET DE SÉCURITÉ n°1 : quoi qu'il arrive (preloader.js introuvable, erreur…),
  // l'écran d'ouverture est retiré au bout de 7 s. Le site ne reste jamais bloqué.
  setTimeout(function () {
    if (root.classList.contains('is-loading') && !window.__preloaderDone) {
      root.classList.remove('is-loading');
      root.classList.add('preloader-off');
      window.__preloaderDone = true;
      document.dispatchEvent(new Event('preloader:done'));
    }
  }, 7000);

  // Filet de sécurité : le contenu ne doit jamais rester invisible.
  setTimeout(function () {
    if (!root.classList.contains('is-ready')) root.classList.add('no-anim');
  }, 3000);
})();

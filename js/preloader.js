/* ============================================================
   N’GUETTA dev — preloader.js
   Écran d'ouverture : un joueur tire, le ballon entre dans le but,
   puis le portfolio s'ouvre.

   Règles :
   - L'animation elle-même est en CSS (css/style.css, section 0).
   - Ici on décide seulement QUAND ouvrir le site :
       1. après la célébration du but (GOAL_MS),
       2. ET quand la page est entièrement chargée.
   - Filets de sécurité : bouton « Passer l'intro », touche Échap,
     et ouverture forcée après MAX_MS même si la page charge lentement.
   - Si ce fichier ne se charge pas, boot.js ouvre quand même le site (7 s).
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var el = document.getElementById('preloader');
  if (!el || !root.classList.contains('is-loading')) return;   // animations réduites ou déjà fermé

  var GOAL_MS = 3500;   // durée de l'animation (tir + but + célébration)
  var MAX_MS = 6500;    // ouverture forcée au plus tard
  var closed = false, loaded = document.readyState === 'complete', timeUp = false;

  // Pendant l'intro, le site derrière est inaccessible au clavier et aux lecteurs d'écran.
  var behind = Array.prototype.slice.call(document.querySelectorAll('a.skip-link, header.navbar, main, footer, nav.tabbar'));
  behind.forEach(function (n) { n.setAttribute('inert', ''); });

  var skip = document.getElementById('preloaderSkip');
  if (skip) skip.focus({ preventScroll: true });

  function close() {
    if (closed) return;
    closed = true;
    behind.forEach(function (n) { n.removeAttribute('inert'); });
    el.classList.add('is-done');          // le rideau monte (transition CSS)
    root.classList.add('intro-open');     // le défilement est de nouveau permis
    window.__preloaderDone = true;
    document.dispatchEvent(new Event('preloader:done'));   // script.js lance alors l'entrée du hero
    window.scrollTo(0, 0);
    var main = document.getElementById('contenu');
    if (main) main.focus({ preventScroll: true });
    // on retire l'écran APRÈS la fin du rideau (sinon la transition serait coupée)
    setTimeout(function () {
      root.classList.remove('is-loading', 'intro-open');
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
  }

  function tryClose() { if (timeUp && loaded) close(); }

  window.addEventListener('load', function () { loaded = true; tryClose(); });
  setTimeout(function () { timeUp = true; tryClose(); }, GOAL_MS);
  setTimeout(close, MAX_MS);

  if (skip) skip.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

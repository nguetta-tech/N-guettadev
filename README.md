# Mon-portfolio
Ce projet est mon portfolio (HTML / CSS / JavaScript, sans build).

## Identité visuelle
Palette : jaune doux · blanc · noir. Les couleurs sont définies une seule fois, en haut de `css/style.css` (section « Reset & tokens »).

## Effets
- Scène 3D du hero en CSS pur (aucune librairie 3D) : `.stage` dans `index.html`.
- Parallaxe : attribut `data-parallax="vitesse"`. Inclinaison 3D au survol : attribut `data-tilt`.
- Apparitions au scroll : attribut `data-reveal` (GSAP).
- Nom animé du pied de page : `#wordmark` (lettres découpées par script.js, section 11).
- Respecte « réduire les animations » ; repli plat si la 3D n'est pas supportée (`js/boot.js`).

## Tester
Ouvrir avec Live Server (port 5501) ou double-cliquer sur `index.html`.

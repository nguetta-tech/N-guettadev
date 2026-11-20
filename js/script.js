/* ============================================================
   N’GUETTA dev — script.js
   Sommaire :
   0. Réglages & utilitaires
   1. Curseur personnalisé (desktop uniquement)
   2. Navbar : état au scroll, progression, lien actif, menu mobile
   3. Marquee technologies (boucle parfaite + ralenti au survol)
   4. Effet photo interactif (noir&blanc -> couleur sur le vêtement)
   5. Scène 3D du hero : inclinaison à la souris + pause hors écran
   6. Parallaxe légère au défilement
   7. Inclinaison 3D des cartes (survol)
   8. Animations d'entrée du hero + apparitions au scroll (GSAP)
   9. Compteurs animés (section À propos)
   10. Contact (liens mailto / tel / WhatsApp, sans script)
   11. Nom animé du pied de page (chaque lettre réagit au toucher)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 0. RÉGLAGES & UTILITAIRES ---------- */
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  // "reduceMotion" est un objet vivant : .matches se met à jour si la personne
  // change son réglage système pendant la visite.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const has3d = !root.classList.contains('no-3d');

  // Indique à boot.js que le script principal a bien démarré (annule le filet de sécurité)
  root.classList.add('is-ready');

  /* ---------- 1. CURSEUR PERSONNALISÉ ---------- */
  if (!isTouch && !reduceMotion.matches) {
    const dot = $('#cursor');
    const ring = $('#cursorRing');
    let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0, running = false;

    // La bague suit avec un léger retard pour un rendu plus doux.
    // La boucle s'arrête d'elle-même quand la bague a rattrapé la souris.
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
        requestAnimationFrame(animateRing);
      } else {
        running = false;
      }
    };

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
      dot.classList.add('is-on'); ring.classList.add('is-on');
      if (!running) { running = true; requestAnimationFrame(animateRing); }
    }, { passive: true });

    $$('[data-cursor="link"]').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  } else {
    document.body.classList.add('no-cursor');
  }

  /* ---------- 2. NAVBAR ---------- */
  const navbar = $('#navbar');
  const progressBar = $('#progressBar');
  const burger = $('#burger');
  const mobileMenu = $('#mobileMenu');
  const mobileMenuClose = $('#mobileMenuClose');

  /* 2a. Menu mobile (clavier : Échap pour fermer, Tab reste dans le menu) */
  const getFocusable = () => $$('a[href], button:not([disabled])', mobileMenu);

  const openMobileMenu = () => {
    mobileMenu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.classList.add('menu-open');
    // on attend la fin du déclenchement de la transition avant de donner le focus
    setTimeout(() => mobileMenuClose.focus(), 60);
  };
  const closeMobileMenu = (returnFocus = false) => {
    if (!mobileMenu.classList.contains('is-open')) return;
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.classList.remove('menu-open');
    if (returnFocus) burger.focus();
  };

  burger.addEventListener('click', () => {
    mobileMenu.classList.contains('is-open') ? closeMobileMenu(true) : openMobileMenu();
  });
  mobileMenuClose.addEventListener('click', () => closeMobileMenu(true));
  $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => closeMobileMenu(false)));

  document.addEventListener('keydown', (e) => {
    if (!mobileMenu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeMobileMenu(true); return; }
    if (e.key === 'Tab') {
      const items = getFocusable();
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Si l'écran repasse en largeur "desktop" pendant que le menu mobile est ouvert
  // (redimensionnement, appareil pliable…), on le referme automatiquement.
  const desktopQuery = window.matchMedia('(min-width: 961px)');
  const handleBreakpointChange = (e) => { if (e.matches) closeMobileMenu(false); };
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener('change', handleBreakpointChange);
  } else {
    desktopQuery.addListener(handleBreakpointChange); // repli anciens navigateurs
  }

  /* 2b. Lien actif : surligne la section visible (desktop + mobile) */
  const navAnchors = $$('#navLinks a, .mobile-menu__nav a, .tabbar a');
  const sections = $$('main > section[id]');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navAnchors.forEach((a) => {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- 6. PARALLAXE (préparation) + scroll partagé ---------- */
  // Un seul écouteur de scroll, limité à 1 calcul par image (requestAnimationFrame).
  const parallaxItems = $$('[data-parallax]').map((el) => ({
    el, speed: parseFloat(el.dataset.parallax) || 0, parent: el.parentElement, visible: false,
  }));
  // On ne calcule que pour les éléments dont le parent est à l'écran.
  // (On mesure le PARENT et non l'élément lui-même, car l'élément est déplacé
  // par la parallaxe : le mesurer créerait une boucle de rétroaction.)
  const parentVisibility = new Map();
  const parallaxObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => parentVisibility.set(e.target, e.isIntersecting));
    parallaxItems.forEach((i) => { i.visible = !!parentVisibility.get(i.parent); });
    onScroll();
  }, { rootMargin: '200px 0px' });
  new Set(parallaxItems.map((i) => i.parent)).forEach((p) => parallaxObserver.observe(p));

  const timeline = $('#timeline');
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    // navbar + progression de lecture
    navbar.classList.toggle('is-scrolled', y > 20);
    const max = document.documentElement.scrollHeight - vh;
    progressBar.style.setProperty('--progress', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);

    // fil de la timeline qui se remplit
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
      timeline.style.setProperty('--tl', p.toFixed(4));
    }

    // parallaxe (désactivée si l'utilisateur réduit les animations)
    if (!reduceMotion.matches) {
      parallaxItems.forEach((item) => {
        if (!item.visible) return;
        const r = item.parent.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) * item.speed;
        item.el.style.setProperty('--py', clamp(offset, -140, 140).toFixed(1) + 'px');
      });
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  /* ---------- 3. MARQUEE TECHNOLOGIES ---------- */
  // On duplique la liste une fois pour obtenir une boucle de -50% sans saut visible.
  // Les doublons sont cachés des lecteurs d'écran (sinon la liste serait lue 2 fois).
  const techList = $('#techList');
  const clones = Array.from(techList.children).map((li) => {
    const c = li.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    return c;
  });
  clones.forEach((c) => techList.appendChild(c));

  const techTrack = $('#techTrack');
  techTrack.addEventListener('mouseenter', () => techTrack.classList.add('is-slow'));
  techTrack.addEventListener('mouseleave', () => techTrack.classList.remove('is-slow'));

  /* ---------- 4. EFFET PHOTO INTERACTIF ---------- */
  /*
     Principe : le calque .photo-color est masqué par un dégradé radial
     (mask-image) centré sur la position de la souris (--mx / --my).
     Là où le dégradé est opaque, la couleur du vêtement apparaît ;
     ailleurs, seul le calque noir & blanc (.photo-base) reste visible.
     Le clip-path sur .photo-color garantit que la couleur ne déborde
     jamais sur le visage ou le fond, quelle que soit la position de la souris.
  */
  const photoFrame = $('#photoFrame');
  if (photoFrame) {
    if (!isTouch) {
      photoFrame.addEventListener('mousemove', (e) => {
        const rect = photoFrame.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        photoFrame.style.setProperty('--mx', mx + '%');
        photoFrame.style.setProperty('--my', my + '%');
        photoFrame.classList.add('is-hover');
      });
      photoFrame.addEventListener('mouseleave', () => {
        photoFrame.classList.remove('is-hover');
      });
    } else {
      // Sur mobile/tactile : pas de hover -> on fait glisser doucement
      // le halo de couleur tout seul pour suggérer l'interaction possible.
      photoFrame.classList.add('is-touched');
      let t = 0;
      let sliding = null;
      const slide = () => {
        t += 0.02;
        photoFrame.style.setProperty('--mx', (50 + Math.sin(t) * 26) + '%');
        photoFrame.style.setProperty('--my', (72 + Math.cos(t * 0.7) * 10) + '%');
      };
      const startSlide = () => {
        photoFrame.classList.add('is-hover');
        if (!reduceMotion.matches && !sliding) sliding = setInterval(slide, 60);
        if (reduceMotion.matches) slide(); // pose fixe, sans mouvement
      };
      startSlide();
    }
  }

  /* ---------- 5. SCÈNE 3D DU HERO ---------- */
  const hero = $('#accueil');
  const stage = $('#stage');
  const rig = $('#stageRig');

  // Pause des animations quand le hero n'est plus à l'écran (économise la batterie)
  new IntersectionObserver((entries) => {
    entries.forEach((e) => hero.classList.toggle('is-offscreen', !e.isIntersecting));
  }).observe(hero);

  if (rig && has3d && !isTouch) {
    // Inclinaison douce de toute la scène selon la position de la souris.
    // On interpole (lerp) vers la cible pour un mouvement fluide.
    let targetX = 0, targetY = 0, curX = 0, curY = 0, looping = false;

    const loop = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      rig.style.transform = `rotateX(${curY.toFixed(2)}deg) rotateY(${curX.toFixed(2)}deg)`;
      if (Math.abs(targetX - curX) > 0.01 || Math.abs(targetY - curY) > 0.01) {
        requestAnimationFrame(loop);
      } else {
        looping = false;
      }
    };
    const kick = () => { if (!looping) { looping = true; requestAnimationFrame(loop); } };

    hero.addEventListener('pointermove', (e) => {
      if (reduceMotion.matches || e.pointerType === 'touch') return;
      const r = stage.getBoundingClientRect();
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
      targetX = nx * 11;    // rotation gauche/droite (deg)
      targetY = -ny * 7;    // rotation haut/bas (deg)
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; kick(); });
  }

  /* ---------- 7. INCLINAISON 3D DES CARTES ---------- */
  // Tout élément portant l'attribut data-tilt s'incline légèrement vers la souris
  // et reçoit un reflet lumineux (variables CSS --rx, --ry, --gx, --gy).
  if (has3d) {
    $$('[data-tilt]').forEach((el) => {
      let frame = null;
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || reduceMotion.matches) return;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          const r = el.getBoundingClientRect();
          const px = clamp((e.clientX - r.left) / r.width, 0, 1);
          const py = clamp((e.clientY - r.top) / r.height, 0, 1);
          el.classList.add('is-tilting');
          el.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', () => {
        if (frame) { cancelAnimationFrame(frame); frame = null; }
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- 8. ANIMATIONS D'ENTRÉE + APPARITIONS AU SCROLL ---------- */
  const showEverything = () => {
    $$('[data-reveal], [data-reveal-name], [data-reveal-photo], .hero__eyebrow, .hero__kicker, .hero__role, .hero__text, .hero__actions')
      .forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.timeline__item').forEach((el) => el.classList.add('is-active'));
  };

  if (window.gsap && window.ScrollTrigger && !reduceMotion.matches) {
    gsap.registerPlugin(ScrollTrigger);

    // Hero : entrée en cascade
    // Si l'écran d'ouverture (joueur de foot) est encore là, on met l'entrée du hero
    // en pause : elle démarre dès que le but est marqué (événement « preloader:done »).
    const waitIntro = root.classList.contains('is-loading') && !window.__preloaderDone;
    const tl = gsap.timeline({ delay: 0.25, paused: waitIntro, defaults: { ease: 'power3.out' } });
    if (waitIntro) document.addEventListener('preloader:done', () => tl.play(), { once: true });
    tl.to('[data-reveal-name]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, clearProps: 'transform' })
      .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.6 }, '-=0.7')
      .to('[data-reveal-photo]', { opacity: 1, y: 0, scale: 1, duration: 0.9, clearProps: 'transform' }, '-=0.6')
      .to('.hero__kicker', { opacity: 1, y: 0, duration: 0.5 }, '-=0.6')
      .to('.hero__role', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
      .to('.hero__text', { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
      .to('.hero__actions', { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');

    // Sections : apparition progressive (légère bascule 3D pour les cartes)
    // Les éléments déjà visibles dans le hero sont gérés par la timeline ci-dessus.
    const deepCards = '.service-row, .project-card, .projects__empty, .stat, .timeline__item, .contact__card';
    $$('[data-reveal]').forEach((el) => {
      if (el.closest('.hero')) return;
      const isCard = has3d && el.matches(deepCards);
      gsap.fromTo(el,
        isCard
          ? { opacity: 0, y: 36, rotateX: -9, transformPerspective: 900, transformOrigin: '50% 100%' }
          : { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, rotateX: 0, duration: 0.7, ease: 'power2.out',
          // on rend la main au CSS une fois l'animation finie (sinon l'inclinaison au survol serait bloquée)
          clearProps: 'transform',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
    });

    // Timeline : point actif
    $$('.timeline__item').forEach((item) => {
      ScrollTrigger.create({
        trigger: item, start: 'top 70%',
        onEnter: () => item.classList.add('is-active'),
      });
    });
  } else {
    // Repli sans GSAP (CDN indisponible) ou animations réduites :
    // tout est affiché immédiatement, sans mouvement.
    showEverything();
  }

  /* ---------- 9. COMPTEURS ANIMÉS ---------- */
  const counters = $$('.stat__num');
  const setCounter = (el, value) => {
    el.textContent = Math.round(value).toLocaleString('fr-FR') + (el.dataset.suffix || '');
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      counterObserver.unobserve(el);

      if (reduceMotion.matches) { setCounter(el, target); return; }

      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCounter(el, eased * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => { setCounter(el, 0); counterObserver.observe(el); });

  /* ---------- 10. CONTACT ---------- */
  // Plus de formulaire : le contact se fait par de simples liens (mailto:, tel:, wa.me)
  // écrits directement dans index.html. Aucun script ni base de données nécessaire.

  /* ---------- 11. NOM ANIMÉ DU PIED DE PAGE ---------- */
  /*
     Chaque lettre de .wordmark est découpée dans un <span class="wl">.
     - souris : la lettre saute quand le curseur passe dessus
     - tactile : un appui fait sauter la lettre, et on peut GLISSER le doigt
       sur le nom : chaque lettre touchée saute à son tour
     Les lettres voisines réagissent aussi, plus faiblement (effet de vague).
  */
  const wordmark = $('#wordmark');
  if (wordmark) {
    const letters = [];
    $$('.wordmark__word', wordmark).forEach((word) => {
      const text = word.textContent;
      word.textContent = '';
      Array.from(text).forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'wl';
        span.textContent = ch;
        word.appendChild(span);
        letters.push(span);
      });
    });

    const pop = (letter, amp, delay) => {
      if (!letter || letter.classList.contains('is-pop')) return;
      const dir = Math.random() < 0.5 ? -1 : 1;
      letter.style.setProperty('--rot', (dir * (7 + Math.random() * 9)).toFixed(1) + 'deg');
      letter.style.setProperty('--amp', amp);
      letter.style.animationDelay = delay + 'ms';
      letter.classList.add('is-pop');
      const done = () => {
        letter.classList.remove('is-pop');
        letter.style.animationDelay = '';
        letter.removeEventListener('animationend', done);
      };
      letter.addEventListener('animationend', done);
      // sécurité : si l'animation est coupée (animations réduites), on retire la classe quand même
      setTimeout(done, 1200 + delay);
    };

    const trigger = (letter) => {
      const i = letters.indexOf(letter);
      if (i < 0) return;
      pop(letter, 1, 0);
      pop(letters[i - 1], 0.45, 60);
      pop(letters[i + 1], 0.45, 60);
    };

    const letterAt = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el && el.classList && el.classList.contains('wl') ? el : null;
    };

    wordmark.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'mouse' && e.target.classList.contains('wl')) trigger(e.target);
    });
    wordmark.addEventListener('pointerdown', (e) => {
      const l = letterAt(e.clientX, e.clientY);
      if (l) trigger(l);
    });
    wordmark.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') return;          // la souris est gérée par pointerover
      const l = letterAt(e.clientX, e.clientY);
      if (l) trigger(l);
    });
  }

  /* Année automatique du footer */
  $('#year').textContent = new Date().getFullYear();
});

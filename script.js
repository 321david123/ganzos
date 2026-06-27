/* ============================================================
   GANZO'S — interactions
   GSAP + ScrollTrigger (reveals, parallax, counters),
   Lenis (smooth scroll), Swiper (gallery + reviews).
   Degrades gracefully; respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  document.body.classList.add("reveal-ready");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- SAFETY NET ----------
     Never let content stay invisible. If GSAP/IO setup throws or a CDN
     fails to load, force every reveal element visible after a beat. */
  function forceRevealAll() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll(".hero__line").forEach(function (el) {
      el.style.transform = "none";
    });
  }
  // Fallback only: if neither GSAP nor the IntersectionObserver path arms the
  // reveals (CDN failure / runtime error before setup), reveal everything.
  var revealArmed = false;
  var revealSafety = setTimeout(function () {
    if (!revealArmed) forceRevealAll();
  }, 2600);
  window.addEventListener("error", function () {
    if (!revealArmed) forceRevealAll();
  });

  /* ---------- YEAR ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- NAV: solidify on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 60) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- MOBILE OVERLAY ---------- */
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("overlayMenu");
  var overlayClose = document.getElementById("overlayClose");

  function openMenu() {
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(function () { overlay.hidden = true; }, 400);
  }
  if (toggle) toggle.addEventListener("click", openMenu);
  if (overlayClose) overlayClose.addEventListener("click", closeMenu);
  if (overlay) {
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay && overlay.classList.contains("is-open")) closeMenu();
  });

  /* ---------- HIGHLIGHT TODAY IN HOURS ---------- */
  var today = new Date().getDay(); // 0 = Sun
  var todayRow = document.querySelector('#hoursTable tr[data-day="' + today + '"]');
  if (todayRow) todayRow.classList.add("is-today");

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  var lenis = null;
  if (typeof Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* anchor links -> smooth scroll (works with or without Lenis) */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- GSAP ANIMATIONS ---------- */
  var hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    if (!reduceMotion) {
      /* hero title lines */
      gsap.set(".hero__line", { yPercent: 110 });
      gsap.to(".hero__line", { yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.25 });
      gsap.from(".hero__eyebrow", { opacity: 0, y: 18, duration: 0.8, delay: 0.15 });
      gsap.from(".hero__sub", { opacity: 0, y: 18, duration: 0.8, delay: 0.7 });
      gsap.from(".hero__cta", { opacity: 0, y: 18, duration: 0.8, delay: 0.9 });

      /* reveal-on-scroll */
      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        gsap.fromTo(el,
          { opacity: 0, y: 32 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          });
      });
      revealArmed = true; clearTimeout(revealSafety);

      /* hero parallax */
      gsap.to(".hero__img", {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });

      /* dish image subtle parallax */
      gsap.utils.toArray(".dish__img-wrap img").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      /* fiesta parallax */
      gsap.to(".fiesta__media img", {
        yPercent: 10, ease: "none",
        scrollTrigger: { trigger: ".fiesta", start: "top bottom", end: "bottom top", scrub: true }
      });
    } else {
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
      gsap.set(".hero__line", { yPercent: 0 });
      revealArmed = true; clearTimeout(revealSafety);
    }

    /* ---------- STAT COUNTERS ---------- */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
          gsap.to(obj, {
            val: target, duration: 1.8, ease: "power2.out",
            onUpdate: function () { el.textContent = prefix + Math.round(obj.val) + suffix; },
            onComplete: function () { el.textContent = prefix + target + suffix; }
          });
        }
      });
    });
  } else {
    /* No GSAP: IntersectionObserver fallback for reveals + counters */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });
    document.querySelectorAll(".hero__line").forEach(function (el) { el.style.transform = "none"; });
    revealArmed = true; clearTimeout(revealSafety);

    document.querySelectorAll("[data-count]").forEach(function (el) {
      var t = parseFloat(el.getAttribute("data-count"));
      el.textContent = (el.getAttribute("data-prefix") || "") + t + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- SWIPER: GALLERY ---------- */
  if (typeof Swiper !== "undefined") {
    new Swiper(".gallerySwiper", {
      slidesPerView: 1.15,
      spaceBetween: 18,
      centeredSlides: true,
      loop: true,
      grabCursor: true,
      speed: 600,
      autoplay: reduceMotion ? false : { delay: 3800, disableOnInteraction: false },
      pagination: { el: ".gallerySwiper .swiper-pagination", clickable: true },
      navigation: { nextEl: ".gallery .swiper-button-next", prevEl: ".gallery .swiper-button-prev" },
      breakpoints: {
        640: { slidesPerView: 1.6, spaceBetween: 24 },
        900: { slidesPerView: 2.3, spaceBetween: 28, centeredSlides: false },
        1200: { slidesPerView: 3, spaceBetween: 30, centeredSlides: false }
      }
    });

    new Swiper(".reviewsSwiper", {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      speed: 600,
      autoplay: reduceMotion ? false : { delay: 5500, disableOnInteraction: false },
      pagination: { el: ".reviewsSwiper .swiper-pagination", clickable: true }
    });
  }
})();

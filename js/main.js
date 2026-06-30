/* =====================================================================
   VOIDWAVE — site behaviour
   All links/text come from js/config.js (window.VOIDWAVE).
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.VOIDWAVE || { links: {}, studio: 'DEV505', demoLive: false };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function steamReady() { return !!(CFG.steamLive && CFG.links && CFG.links.steam); }

  /* ---- inject links from config into every [data-link] element ---- */
  function applyLinks() {
    var links = CFG.links || {};
    document.querySelectorAll('[data-link]').forEach(function (el) {
      var key = el.getAttribute('data-link');
      if (key === 'steam') { return; } // Steam is handled by applySteam()
      var url = links[key];
      if (url) {
        el.setAttribute('href', url);
        // mailto / same-tab should not open a blank tab
        if (url.indexOf('mailto:') === 0) { el.removeAttribute('target'); el.removeAttribute('rel'); }
      } else {
        // no URL configured yet → keep it inert but obvious in console
        el.setAttribute('href', '#');
        el.setAttribute('aria-disabled', 'true');
      }
    });
    // optional twitter icon: hide any element if its link is empty
    if (!links.twitter) {
      document.querySelectorAll('[data-link="twitter"]').forEach(function (el) { el.style.display = 'none'; });
    }
  }

  /* ---- Steam buttons: live wishlist link OR a "Coming soon" block ---- */
  function applySteam() {
    var ready = steamReady();
    document.querySelectorAll('[data-link="steam"]').forEach(function (el) {
      var label = el.querySelector('.btn-label');
      if (ready) {
        el.setAttribute('href', CFG.links.steam);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        el.classList.remove('is-soon');
        el.removeAttribute('aria-disabled');
        if (label && el.dataset.liveLabel) { label.textContent = el.dataset.liveLabel; }
      } else {
        if (label) {
          el.dataset.liveLabel = el.dataset.liveLabel || label.textContent;
          label.textContent = el.getAttribute('data-soon') || 'Coming soon';
        }
        el.classList.add('is-soon');
        el.removeAttribute('href');   // not a real link yet → inert, not focusable
        el.removeAttribute('target');
        el.removeAttribute('rel');
        el.setAttribute('aria-disabled', 'true');
      }
    });
  }

  /* ---- studio name + year + demo / Steam wording ---- */
  function applyText() {
    document.querySelectorAll('[data-studio]').forEach(function (el) { el.textContent = CFG.studio || 'DEV505'; });
    var y = document.getElementById('year');
    if (y) { y.textContent = new Date().getFullYear(); }
    var note;
    if (CFG.demoLive) { note = 'The free demo is live on Steam — play it now.'; }
    else if (!steamReady()) { note = 'Steam page coming soon — join the Discord for the launch date.'; }
    if (note) {
      document.querySelectorAll('[data-demo-note]').forEach(function (el) { el.textContent = note; });
    }
  }

  /* ---- sticky nav state ---- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) { return; } // e.g. the press-kit page has no nav bar
    var burger = document.getElementById('navBurger');
    var links = document.getElementById('navLinks');
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && links) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          links.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ---- reveal on scroll ----
     Plain scroll/rect check (no IntersectionObserver) so content is NEVER
     left permanently hidden if the observer fails to fire. Self-removes its
     listeners once every element has revealed. ---- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (reduceMotion) { els.forEach(function (el) { el.classList.add('in'); }); return; }

    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = els.length - 1; i >= 0; i--) {
        var r = els[i].getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { els[i].classList.add('in'); els.splice(i, 1); }
      }
      if (!els.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', check);
      }
    }
    var ticking = false;
    function onScroll() {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () { check(); ticking = false; });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', check);
    check();
    // safety net for any edge case (e.g. content shorter than viewport)
    window.setTimeout(check, 600);
  }

  /* ---- lazy-load + autoplay clips when near viewport ---- */
  function initLazyVideos() {
    var vids = document.querySelectorAll('video[data-lazyvid]');
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { load(v); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { load(v); if (!reduceMotion) { v.play().catch(function(){}); } }
        else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });

    function load(v) {
      if (v.dataset.loaded) { return; }
      v.src = v.getAttribute('data-lazyvid');
      v.dataset.loaded = '1';
    }
  }

  /* ---- gallery lightbox ---- */
  function initLightbox() {
    var lb = document.getElementById('lightbox');
    var lbVideo = document.getElementById('lbVideo');
    var lbClose = document.getElementById('lbClose');
    if (!lb) { return; }
    var lastFocus = null;

    function open(src) {
      lastFocus = document.activeElement;
      lbVideo.src = src;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      lbVideo.play().catch(function () {});
      lbClose.focus();
    }
    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load();
      if (lastFocus) { lastFocus.focus(); }
    }

    document.querySelectorAll('.shot').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn.getAttribute('data-vid')); });
    });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) { close(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) { close(); } });
  }

  /* ---- drifting background blocks ---- */
  function initBlocks() {
    if (reduceMotion) { return; }
    var host = document.getElementById('bgBlocks');
    if (!host) { return; }
    var n = window.innerWidth < 720 ? 7 : 14;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i');
      var size = 14 + Math.random() * 60;
      b.style.left = (Math.random() * 100) + 'vw';
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.bottom = '-80px';
      b.style.animationDuration = (16 + Math.random() * 26) + 's';
      b.style.animationDelay = (-Math.random() * 30) + 's';
      b.style.opacity = (0.25 + Math.random() * 0.5).toFixed(2);
      frag.appendChild(b);
    }
    host.appendChild(frag);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {
    applyLinks();
    applySteam();
    applyText();
    initNav();
    initReveal();
    initLazyVideos();
    initLightbox();
    initBlocks();
  });
})();

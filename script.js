/* =========================================================
   Adisha — scrapbook engine
   ========================================================= */
(function () {
  'use strict';

  var book   = document.getElementById('book');
  var pages  = Array.prototype.slice.call(book.querySelectorAll('.page'));
  var dotsEl = document.getElementById('dots');
  var prevBtn= document.getElementById('prevBtn');
  var nextBtn= document.getElementById('nextBtn');
  var ribbonNum = document.getElementById('ribbonNum');
  var chName = document.getElementById('chName');
  var turnHint = document.getElementById('turnHint');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var index = 0;
  var total = pages.length;
  var locked = false;

  /* ---- build dots ---- */
  pages.forEach(function (p, i) {
    var d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'page ' + (i + 1));
    d.addEventListener('click', function () { goTo(i); });
    dotsEl.appendChild(d);
  });
  var dots = Array.prototype.slice.call(dotsEl.children);

  /* ---- layout (px-accurate translate) ---- */
  function layout() {
    var w = window.innerWidth;
    pages.forEach(function (p) { p.style.flexBasis = w + 'px'; p.style.width = w + 'px'; });
    book.style.transform = 'translateX(' + (-index * w) + 'px)';
  }

  function update() {
    var w = window.innerWidth;
    book.style.transform = 'translateX(' + (-index * w) + 'px)';
    dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    pages.forEach(function (p, i) { p.classList.toggle('in', i === index); });
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

    var num = (index + 1) < 10 ? '0' + (index + 1) : '' + (index + 1);
    ribbonNum.textContent = num;
    chName.textContent = pages[index].getAttribute('data-chapter') || '';

    if (index > 0 && turnHint) turnHint.classList.add('hide');
    if (index === 0 && turnHint) turnHint.classList.remove('hide');
  }

  function goTo(i) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === index || locked) return;
    locked = true;
    book.classList.add('turning');
    // restart reveal animation on the target page
    var target = pages[i];
    target.classList.remove('in');
    void target.offsetWidth;
    index = i;
    update();
    setTimeout(function () { book.classList.remove('turning'); locked = false; }, 620);
  }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  /* ---- wire controls ---- */
  document.querySelectorAll('[data-next]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); next(); });
  });
  document.querySelectorAll('[data-prev]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); prev(); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  });

  /* ---- swipe (touch) ---- */
  var sx = 0, sy = 0, swiping = false;
  book.addEventListener('touchstart', function (e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true;
  }, { passive: true });
  book.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false;
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  window.addEventListener('resize', layout);
  layout();
  update();

  /* =========================================================
     AMBIENT PETALS
     ========================================================= */
  var petalLayer = document.getElementById('petals');
  var PETAL_COLORS = ['#b06a5e', '#c98a7a', '#bd9a57', '#d8b27a', '#cf9c8e'];

  function spawnPetal() {
    if (reduce) return;
    var p = document.createElement('span');
    p.className = 'petal';
    var size = 9 + Math.random() * 12;
    p.style.width = size + 'px';
    p.style.height = (size * 1.25) + 'px';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0];
    p.style.opacity = (0.35 + Math.random() * 0.4).toFixed(2);
    petalLayer.appendChild(p);

    var dur = 9000 + Math.random() * 8000;
    var drift = (Math.random() * 160 - 80);
    var rot = (Math.random() * 720 - 360);
    var anim = p.animate(
      [
        { transform: 'translate(0,-40px) rotate(0deg)' },
        { transform: 'translate(' + drift + 'px,' + (window.innerHeight + 80) + 'px) rotate(' + rot + 'deg)' }
      ],
      { duration: dur, easing: 'cubic-bezier(.45,.05,.55,.95)' }
    );
    anim.onfinish = function () { p.remove(); };
  }
  if (!reduce) {
    for (var i = 0; i < 6; i++) setTimeout(spawnPetal, i * 700);
    setInterval(spawnPetal, 2600);
  }

  /* =========================================================
     CONFETTI / PETAL BURST ON "YES"
     ========================================================= */
  var confettiLayer = document.getElementById('confetti');

  function makeBit(x, y) {
    var b = document.createElement('span');
    b.className = 'confetti-bit';
    var isHeart = Math.random() < 0.45;
    var size = 10 + Math.random() * 16;
    if (isHeart) {
      b.textContent = '♥';
      b.style.color = PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0];
      b.style.fontSize = (size + 6) + 'px';
      b.style.lineHeight = '1';
    } else {
      b.style.width = size + 'px';
      b.style.height = (size * 1.3) + 'px';
      b.style.background = PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0];
      b.style.borderRadius = '60% 60% 60% 60% / 80% 80% 60% 60%';
    }
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    confettiLayer.appendChild(b);

    var ang = Math.random() * Math.PI * 2;
    var vel = 120 + Math.random() * 340;
    var dx = Math.cos(ang) * vel;
    var dy = Math.sin(ang) * vel - (160 + Math.random() * 160);
    var fall = window.innerHeight + 120;
    var rot = Math.random() * 720 - 360;

    var anim = b.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + (dy * 0.4) + 'px) rotate(' + (rot * 0.4) + 'deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(' + (dx * 1.2) + 'px,' + fall + 'px) rotate(' + rot + 'deg)', opacity: 0 }
      ],
      { duration: 2200 + Math.random() * 1600, easing: 'cubic-bezier(.2,.6,.3,1)' }
    );
    anim.onfinish = function () { b.remove(); };
  }

  function burst() {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var n = reduce ? 30 : 90;
    for (var k = 0; k < n; k++) {
      (function (kk) {
        setTimeout(function () { makeBit(cx + (Math.random() * 120 - 60), cy + (Math.random() * 80 - 40)); }, kk * 8);
      })(k);
    }
    // a soft second wave
    if (!reduce) setTimeout(function () {
      for (var j = 0; j < 40; j++) makeBit(Math.random() * window.innerWidth, -20);
    }, 600);
  }

  var yesBtn = document.getElementById('yesBtn');
  var proposalPage = document.getElementById('proposal');
  if (yesBtn) {
    yesBtn.addEventListener('click', function () {
      proposalPage.classList.add('said-yes');
      burst();
      // gentle transform-only entrance (resting state stays visible even if a
      // browser stalls the timeline — the answer never gets stuck hidden)
      if (!reduce) {
        var kids = proposalPage.querySelectorAll('.answered > *');
        Array.prototype.forEach.call(kids, function (el, i) {
          el.animate(
            [{ transform: 'translateY(20px)' }, { transform: 'translateY(0)' }],
            { duration: 760, delay: i * 120, easing: 'cubic-bezier(.2,.7,.2,1)' }
          );
        });
      }
      // music swells in if available
      try { if (song && song.paused && soundOn) song.play(); } catch (e) {}
    });
  }
  var replayBtn = document.getElementById('replayBtn');
  if (replayBtn) replayBtn.addEventListener('click', burst);

  /* =========================================================
     MUSIC TOGGLE
     ========================================================= */
  var song = document.getElementById('song');
  var soundBtn = document.getElementById('soundBtn');
  var soundOn = false;
  if (soundBtn && song) {
    soundBtn.addEventListener('click', function () {
      soundOn = !soundOn;
      if (soundOn) {
        song.volume = 0.5;
        var pr = song.play();
        if (pr && pr.catch) pr.catch(function () {});
        soundBtn.textContent = '♫';
        soundBtn.style.color = 'var(--rose-deep)';
      } else {
        song.pause();
        soundBtn.textContent = '♪';
        soundBtn.style.color = '';
      }
    });
  }
})();

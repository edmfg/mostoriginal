/* ===========================================================================
   MOST ORIGINAL — app.js
   (1) Magic Pointer cursor sim  (spec §4)
   (2) Seamless marquee ticker   (spec §8)
   Vanilla JS. Touch + reduced-motion aware.
   =========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     Device + motion checks
     - Touch devices: never hide the system cursor (mobile users would lose it).
     - Honor prefers-reduced-motion for the look-lift (handled in CSS).
     ------------------------------------------------------------------------- */
  var isTouch =
    window.matchMedia('(hover: none), (pointer: coarse)').matches ||
    'ontouchstart' in window;

  /* =========================================================================
     (1) MAGIC POINTER
     ========================================================================= */
  var cursor = document.getElementById('magic-cursor');

  if (cursor && !isTouch) {
    document.body.classList.add('pointer-on');

    var x = -100, y = -100;       // target position
    var raf = null;

    function render() {
      cursor.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      raf = null;
    }

    window.addEventListener('mousemove', function (e) {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    });

    // Hide the chip when the mouse leaves the window entirely.
    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('active');
    });

    document.querySelectorAll('[data-pointer-action]').forEach(function (el) {
      function activate() {
        cursor.dataset.label = el.dataset.pointerAction;
        cursor.classList.add('active');
        el.classList.add('pointer-target');
      }
      function deactivate() {
        cursor.classList.remove('active');
        el.classList.remove('pointer-target');
      }
      el.addEventListener('mouseenter', activate);
      el.addEventListener('mouseleave', deactivate);
      // keyboard parity: lift on focus too
      el.addEventListener('focus', function () { el.classList.add('pointer-target'); });
      el.addEventListener('blur',  function () { el.classList.remove('pointer-target'); });
    });
  }

  /* =========================================================================
     (2) MARQUEE — duplicate the track so translateX(-50%) loops seamlessly
     ========================================================================= */
  var MARQUEE_TEXT = 'STYLE IT · SUBMIT IT · BE THE MOST ORIGINAL · #MOSTORIGINAL · ';

  function buildMarquee(id, text) {
    var track = document.getElementById(id);
    if (!track) return;
    // Two identical halves: the animation shifts by exactly one half-width.
    var half = '<span>' + text.repeat(6) + '</span>';
    track.innerHTML = half + half;
  }

  buildMarquee('marquee-a', MARQUEE_TEXT);
  buildMarquee('marquee-b', MARQUEE_TEXT);
})();

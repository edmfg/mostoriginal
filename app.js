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

  /* =========================================================================
     (3) MAGIC POINTER STUDIO — select-to-pull → "see your vision" → shop
     ========================================================================= */
  var studio = document.getElementById('studio');
  if (studio) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var pieces      = Array.prototype.slice.call(studio.querySelectorAll('.piece'));
    var tray        = document.getElementById('tray');
    var trayEmpty   = document.getElementById('tray-empty');
    var trayCount   = document.getElementById('tray-count');
    var visionBtn   = document.getElementById('vision-btn');
    var visionEmpty = document.getElementById('vision-empty');
    var visionStage = document.getElementById('vision-stage');
    var visionImg   = document.getElementById('vision-img');
    var shimmer     = document.getElementById('shimmer');
    var ask         = document.getElementById('ask');
    var askInput    = document.getElementById('ask-input');
    var askChips    = document.getElementById('ask-chips');
    var widget      = document.getElementById('widget');
    var widgetThumb = document.getElementById('widget-thumb');
    var resetBtn    = document.getElementById('studio-reset');

    var VISIONS = ['assets/vision-1.jpg', 'assets/vision-2.jpg', 'assets/vision-3.jpg'];
    // hotspot coords (% of stage) for hover-to-shop SKU tags
    var TAG_SPOTS = [[16, 30], [60, 52], [30, 74]];

    var selected = [];          // [{key,name,price,src}]
    var visionIdx = 0;
    var rendered = false;
    var shimmerTimer = null;

    function findSel(key) {
      for (var i = 0; i < selected.length; i++) if (selected[i].key === key) return i;
      return -1;
    }

    // Downscale a (same-origin) product image to a base64 data URL so we can hand the
    // actual garments to the API and keep the request payload small.
    function loadImageDataURL(url, maxSide) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          var w = img.naturalWidth || 1, h = img.naturalHeight || 1;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var c = document.createElement('canvas');
          c.width = cw; c.height = ch;
          try {
            c.getContext('2d').drawImage(img, 0, 0, cw, ch);
            resolve(c.toDataURL('image/jpeg', 0.85));
          } catch (e) { resolve(null); } // tainted canvas / CORS
        };
        img.onerror = function () { resolve(null); };
        img.src = url;
      });
    }

    function togglePiece(btn) {
      var key = btn.dataset.piece;
      var idx = findSel(key);
      if (idx > -1) {
        selected.splice(idx, 1);
        btn.classList.remove('selected');
      } else {
        selected.push({
          key: key,
          name: btn.dataset.name,
          price: btn.dataset.price,
          src: btn.querySelector('img').getAttribute('src')
        });
        btn.classList.add('selected');
      }
      renderTray();
    }

    function renderTray() {
      // rebuild thumbnails
      Array.prototype.slice.call(tray.querySelectorAll('.tray-thumb')).forEach(function (n) { n.remove(); });
      selected.forEach(function (s) {
        var t = document.createElement('div');
        t.className = 'tray-thumb';
        t.style.backgroundImage = 'url(' + s.src + ')';
        t.title = s.name;
        var x = document.createElement('button');
        x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove ' + s.name);
        x.addEventListener('click', function () {
          var b = studio.querySelector('.piece[data-piece="' + s.key + '"]');
          if (b) togglePiece(b);
        });
        t.appendChild(x);
        tray.appendChild(t);
      });
      var n = selected.length;
      trayCount.textContent = n;
      trayEmpty.style.display = n ? 'none' : '';
      visionBtn.disabled = n === 0;
    }

    function buildTags() {
      // clear old
      Array.prototype.slice.call(visionStage.querySelectorAll('.sku-tag')).forEach(function (n) { n.remove(); });
      var items = selected.length ? selected : pieces.slice(0, 3).map(function (b) {
        return { name: b.dataset.name, price: b.dataset.price };
      });
      items.slice(0, 3).forEach(function (s, i) {
        var tag = document.createElement('button');
        tag.type = 'button';
        tag.className = 'sku-tag';
        tag.style.left = TAG_SPOTS[i][0] + '%';
        tag.style.top = TAG_SPOTS[i][1] + '%';
        tag.setAttribute('data-pointer-action', 'Shop the fit');
        tag.innerHTML = s.name + ' <span class="sku-price">' + s.price + '</span>';
        bindPointer(tag);
        visionStage.appendChild(tag);
        // staggered fade-in
        setTimeout(function () { tag.classList.add('in'); }, reduceMotion ? 0 : 220 + i * 180);
      });
    }

    async function render(promptText) {
      visionEmpty.hidden = true;
      visionStage.hidden = false;
      if (promptText) askInput.value = promptText;
      // clear old SKU tags
      Array.prototype.slice.call(visionStage.querySelectorAll('.sku-tag')).forEach(function (n) { n.remove(); });
      shimmer.hidden = false;
      visionBtn.disabled = true;

      // ask Gemini to actually render the selected fit (real image generation).
      // When 2+ pieces are picked it remixes the real product images into one new outfit.
      var items = selected.map(function (s) { return s.name; });
      var imgUrl = null;
      try {
        var images = (await Promise.all(
          selected.map(function (s) { return loadImageDataURL(s.src, 1024); })
        )).filter(Boolean);
        var r = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: items, restyle: promptText || '', images: images })
        });
        if (r.ok) { var d = await r.json(); if (d && d.image) imgUrl = d.image; }
      } catch (e) { /* fall through to fallback */ }

      // graceful fallback (localhost / no key / API error): cycle the stock visions
      if (!imgUrl) imgUrl = VISIONS[visionIdx % VISIONS.length];

      visionImg.src = imgUrl;
      shimmer.hidden = true;
      buildTags();
      widget.hidden = false;
      widgetThumb.src = imgUrl;
      ask.hidden = false;
      askChips.hidden = false;
      resetBtn.hidden = false;
      rendered = true;
      visionBtn.disabled = false;
      visionBtn.innerHTML = '✦ Re-render vision';
    }

    function reset() {
      selected = [];
      visionIdx = 0;
      rendered = false;
      pieces.forEach(function (b) { b.classList.remove('selected'); });
      renderTray();
      visionStage.hidden = true;
      visionEmpty.hidden = false;
      shimmer.hidden = true;
      widget.hidden = true;
      ask.hidden = true;
      askChips.hidden = true;
      resetBtn.hidden = true;
      visionBtn.innerHTML = '✦ See your vision';
    }

    pieces.forEach(function (b) { b.addEventListener('click', function () { togglePiece(b); }); });

    visionBtn.addEventListener('click', function () {
      if (selected.length === 0) return;
      if (rendered) visionIdx++;        // re-render → next look
      render();
    });

    Array.prototype.slice.call(askChips.querySelectorAll('.chip')).forEach(function (c) {
      c.addEventListener('click', function () {
        visionIdx++;
        render(c.dataset.prompt);
      });
    });

    resetBtn.addEventListener('click', reset);
    renderTray();
  }

  /* expose cursor binding for dynamically created [data-pointer-action] nodes */
  function bindPointer(el) {
    if (!document.body.classList.contains('pointer-on')) return;
    var c = document.getElementById('magic-cursor');
    if (!c) return;
    el.addEventListener('mouseenter', function () {
      c.dataset.label = el.dataset.pointerAction;
      c.classList.add('active');
      el.classList.add('pointer-target');
    });
    el.addEventListener('mouseleave', function () {
      c.classList.remove('active');
      el.classList.remove('pointer-target');
    });
  }
})();

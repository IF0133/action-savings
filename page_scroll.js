// The Flutter body scrolls while Scaffold keeps bottom navigation fixed.
(() => {
  const host = document.getElementById('flutter_host');
  const update = () => {
    const viewport = window.visualViewport;
    // Browser bars and the keyboard resize the host; pinch zoom does not.
    const height = viewport && viewport.scale === 1 ? viewport.height : window.innerHeight;
    host.style.height = height + 'px';
  };
  window.addEventListener('resize', update);
  window.addEventListener('pageshow', update);
  window.visualViewport?.addEventListener('resize', update);
  update();

  // Flutter's TapRegion keeps framework focus during related memo controls.
  // With web semantics enabled, the browser also focuses their DOM buttons
  // on mousedown (including the mouse event synthesized after a touch).
  // Cancel that pointer focus transfer even when not editing: native focus
  // can scroll the invisible semantics DOM separately from Flutter's canvas.
  // Clicks, touch scrolling, Tab navigation
  // and screen-reader activation remain available. Never blur/refocus the
  // input, which would dismiss and reopen an iPhone's software keyboard.
  document.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element &&
        event.target.closest('[flt-semantics-identifier="memo-editing-controls"]')) {
      event.preventDefault();
    }
  }, true);
})();

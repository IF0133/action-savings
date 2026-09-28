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
})();

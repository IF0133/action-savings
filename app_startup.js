// Keep help available if the app's runtime cannot be downloaded or initialized.
(() => {
  const panel = document.getElementById('app-startup');
  const status = document.getElementById('startup-status');
  const retry = document.getElementById('startup-retry');
  const host = document.getElementById('flutter_host');
  const minimumDisplayMs = 3000;
  let finished = false, ready = false, failed = false, shownAt = null, revealTimer;
  const revealWhenReady = () => {
    if (finished || failed || !ready || shownAt === null) return;
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      if (finished || failed) return;
      finished = true;
      clearTimeout(timer);
      host.inert = false;
      host.removeAttribute('aria-hidden');
      panel.remove();
    }, Math.max(0, minimumDisplayMs - (performance.now() - shownAt)));
  };
  // Count from the first paint opportunity, not from the network navigation.
  requestAnimationFrame(() => { shownAt = performance.now(); revealWhenReady(); });
  const showHelp = (message) => {
    if (finished) return;
    status.textContent = message;
    retry.hidden = false;
  };
  const timer = setTimeout(() => showHelp('読み込みに時間がかかっています。通信状態を確認するか、再読み込みしてください。'), 20000);
  retry.addEventListener('click', () => window.location.reload());
  window.actionSavingsStartup = {
    complete() {
      if (finished || failed) return;
      ready = true;
      revealWhenReady();
    },
    fail() {
      failed = true;
      clearTimeout(revealTimer);
      clearTimeout(timer);
      showHelp('アプリを開けませんでした。通信状態を確認して、再読み込みしてください。');
    },
  };
  window.addEventListener('error', (event) => {
    if (event.target?.id === 'flutter-bootstrap') window.actionSavingsStartup.fail();
  }, true);
})();

// Keep help available if the app's runtime cannot be downloaded or initialized.
(() => {
  const panel = document.getElementById('app-startup');
  const status = document.getElementById('startup-status');
  const retry = document.getElementById('startup-retry');
  let finished = false;
  const showHelp = (message) => {
    if (finished) return;
    status.textContent = message;
    retry.hidden = false;
  };
  const timer = setTimeout(() => showHelp('読み込みに時間がかかっています。通信状態を確認するか、再読み込みしてください。'), 20000);
  retry.addEventListener('click', () => window.location.reload());
  window.actionSavingsStartup = {
    complete() {
      finished = true;
      clearTimeout(timer);
      panel.remove();
    },
    fail() {
      clearTimeout(timer);
      showHelp('アプリを開けませんでした。通信状態を確認して、再読み込みしてください。');
    },
  };
  window.addEventListener('error', (event) => {
    if (event.target?.id === 'flutter-bootstrap') window.actionSavingsStartup.fail();
  }, true);
})();

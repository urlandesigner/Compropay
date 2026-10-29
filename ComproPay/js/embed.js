/* Quando uma tela abre dentro do mockup (app.html), marca o <html> e avisa qual tela está aberta. */
(function () {
  if (window.self === window.top) return;
  document.documentElement.classList.add('is-embedded');
  var name = location.pathname.split('/').pop() || 'index.html';
  try { parent.postMessage({ type: 'compropay:screen', name: name }, '*'); } catch (e) {}
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'compropay:cmd' && e.data.cmd === 'back') history.back();
  });
})();

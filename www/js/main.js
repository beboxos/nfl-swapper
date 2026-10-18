// Point d'entrée : chargement, boucle de jeu, entrées tactiles, service worker.
(function () {
  const canvas = document.getElementById('stage');
  NFL.Save.load();
  NFL.Renderer.init(canvas);
  NFL.UI.init();

  NFL.Assets.load().then(() => {
    NFL.Renderer.badges = {};
    if (NFL.UI.current === 'title') NFL.UI.renderTitle();
  });

  // Entrées : le canvas est sous les écrans, l'écran de jeu laisse passer les événements.
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  canvas.addEventListener('pointerdown', e => {
    if (NFL.UI.current !== 'game') return;
    if (NFL.Game.state === 'bonus') { NFL.Game.skipBonus(); return; }
    canvas.setPointerCapture(e.pointerId);
    NFL.Game.pointerDown(...pos(e));
  });
  canvas.addEventListener('pointermove', e => { if (NFL.UI.current === 'game') NFL.Game.pointerMove(...pos(e)); });
  canvas.addEventListener('pointerup', () => { if (NFL.UI.current === 'game') NFL.Game.pointerUp(); });
  canvas.addEventListener('pointercancel', () => { NFL.Game.drag = null; });

  window.addEventListener('resize', () => { NFL.Renderer.resize(); NFL.Game.relayout(); });
  document.addEventListener('visibilitychange', () => {
    const a = NFL.Audio;
    if (!a.ctx) return;
    if (document.hidden) a.ctx.suspend(); else a.ctx.resume();
  });
  // Premier geste utilisateur = déblocage audio (politique des navigateurs mobiles)
  window.addEventListener('pointerdown', () => NFL.Audio.unlock(), { once: true });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    const game = NFL.Game;
    if (!game.paused) {
      NFL.Tweens.update(dt);
      NFL.FX.update(dt);
      game.update(dt);
    }
    NFL.Renderer.draw(NFL.UI.current === 'game' ? game : null, game.paused ? 0 : dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

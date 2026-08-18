class ScreenManager {
  constructor(game) {
    this.game = game;
    this.container = game.container;
    this.screens = new Map();
    this.current = null;
  }

  register(screen) {
    this.screens.set(screen.name, screen);
    return this;
  }

  show(name, options = {}) {
    const next = this.screens.get(name);
    if (!next) {
      console.error(`Screen "${name}" not found`);
      return;
    }
    const previous = this.current;
    if (previous && previous !== next) previous.exit(next);
    /* remove a stale element from a previous build of this same screen */
    if (next.el && next.el.parentNode) next.el.remove();
    next.build(options);
    this.container.appendChild(next.el);
    if (typeof UI !== 'undefined') UI.setupLoaded(next.el);
    next.enter(previous, options);
    /* defer the previous screen's destroy so exit() animations can play — but
       only destroy it if it was not re-shown before the frame runs (otherwise
       the pending destroy would wipe the freshly rebuilt screen). */
    if (previous && previous !== next) {
      requestAnimationFrame(() => {
        if (this.current !== previous) previous.destroy();
      });
    }
    this.current = next;
  }
}

const game = new Game(GAME_CONFIG);
game
  .register(new LoadingScreen(game))
  .register(new MenuScreen(game))
  .register(new GameplayScreen(game))
  .register(new GameOverScreen(game))
  .register(new VictoryScreen(game));
if (GAME_CONFIG.features.shop) {
  game.register(new ShopScreen(game));
}

/* Debug handle for QA tooling (harmless in production). */
window.__game = game;

/* Boot the Playgama bridge (when present), pull cloud progress into
   localStorage, then start the game. Without the bridge both calls
   resolve immediately — the game runs normally. */
SDK.init()
  .then(() => game.storage.loadCloud())
  .catch(() => {})
  .finally(() => {
    game.start();
  });

/* Tiny image cache: images are preloaded by the loading screen,
   so by the time gameplay runs they are served from cache. */

const Assets = {
  cache: {},
  get(path) {
    if (!this.cache[path]) {
      const img = new Image();
      img.src = path;
      this.cache[path] = img;
    }
    return this.cache[path];
  }
};

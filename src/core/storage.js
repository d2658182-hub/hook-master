/* ============================================================
   STORAGE — localStorage is the sync source of truth (fast,
   synchronous reads). The Playgama bridge cloud storage is
   pulled at boot (cloud -> local) and re-mirrored on every
   write (local -> cloud), so progress survives across devices
   when the bridge exists, and the game still works without it.
   ============================================================ */

class Storage {
  constructor(gameId) {
    this.prefix = `gt_${gameId}_`;
    this.cloudReady = false;
  }

  /* Pull cloud values into localStorage (called once at boot). */
  async loadCloud() {
    if (!SDK.hasBridge) return;
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.indexOf(this.prefix) === 0) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    const keysToFetch = keys.length ? keys : ['level', 'coins'];
    try {
      const values = await SDK.storageGet(keysToFetch);
      if (Array.isArray(values)) {
        keysToFetch.forEach((key, index) => {
          const value = values[index];
          if (value != null) {
            try {
              localStorage.setItem(this.prefix + key, String(value));
            } catch (error) { /* noop */ }
          }
        });
      }
      this.cloudReady = true;
    } catch (error) { /* noop */ }
  }

  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) { /* storage unavailable */ }
    if (SDK.hasBridge) {
      SDK.storageSet(this.prefix + key, JSON.stringify(value));
    }
  }
}

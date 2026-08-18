/* ============================================================
   PLAYGAMA SDK — defensive wrapper.
   Every call is safe WITH and WITHOUT the bridge:
   the game runs normally (localStorage fallback) when the
   bridge is absent or fails.
   ============================================================ */

const SDK = (() => {
  const bridge = (typeof window !== 'undefined' && window.bridge) || null;

  let initialized = false;
  let readySent = false;
  let audioEnabled = true;
  let platformPaused = false;

  const audioListeners = [];
  const pauseListeners = [];
  let pendingRewarded = null;   // { placement, resolve }
  let pendingInterstitial = null; // { resolve }

  const safe = (fn, fallback) => {
    try {
      return fn();
    } catch (error) {
      return fallback;
    }
  };

  /* ---------------- events ---------------- */

  function wireEvents() {
    if (!bridge) return;
    safe(() => {
      const EV = bridge.EVENT_NAME || {};
      const pOn = bridge.platform && bridge.platform.on;
      const aOn = bridge.advertisement && bridge.advertisement.on;
      const pName = EV.AUDIO_STATE_CHANGED || 'audio_state_changed';
      const pPause = EV.PAUSE_STATE_CHANGED || 'pause_state_changed';
      const iName = EV.INTERSTITIAL_STATE_CHANGED || 'interstitial_state_changed';
      const rName = EV.REWARDED_STATE_CHANGED || 'rewarded_state_changed';

      if (pOn) {
        pOn(pName, (enabled) => {
          audioEnabled = !!enabled;
          audioListeners.forEach((cb) => cb(audioEnabled));
        });
        pOn(pPause, (paused) => {
          platformPaused = !!paused;
          pauseListeners.forEach((cb) => cb(platformPaused));
        });
      }
      if (aOn) {
        aOn(iName, (state) => {
          if (pendingInterstitial && (state === 'closed' || state === 'failed')) {
            const resolve = pendingInterstitial.resolve;
            pendingInterstitial = null;
            resolve(state);
          }
        });
        aOn(rName, (state) => {
          if (!pendingRewarded) return;
          if (state === 'rewarded') {
            const pending = pendingRewarded;
            pendingRewarded = null;
            pending.resolve('rewarded');
          } else if (state === 'closed' || state === 'failed') {
            const pending = pendingRewarded;
            pendingRewarded = null;
            pending.resolve(state);
          }
        });
      }
    });
  }

  /* ---------------- api ---------------- */

  function init() {
    if (initialized) return Promise.resolve();
    initialized = true;
    if (!bridge) {
      wireEvents();
      return Promise.resolve();
    }
    return safe(
      () => bridge.initialize().then(() => {
        wireEvents();
        audioEnabled = safe(() => !!bridge.platform.isAudioEnabled, true);
      }).catch(() => {
        wireEvents();
      }),
      Promise.resolve()
    );
  }

  function sendMessage(name, payload) {
    if (!bridge) return;
    safe(() => bridge.platform.sendMessage(name, payload || undefined));
  }

  function sendGameReady() {
    if (readySent) return;
    readySent = true;
    sendMessage('game_ready');
  }

  function loadingProgress(value) {
    if (!bridge) return;
    safe(() => {
      if (typeof bridge.loadingProgress === 'function') {
        bridge.loadingProgress(value);
      }
    });
  }

  function showInterstitial(placement) {
    if (!bridge || !bridge.advertisement) {
      return Promise.resolve('failed');
    }
    return new Promise((resolve) => {
      pendingInterstitial = { resolve };
      const supported = safe(() => !!bridge.advertisement.isInterstitialSupported, false);
      if (!supported) {
        pendingInterstitial = null;
        resolve('failed');
        return;
      }
      safe(() => bridge.advertisement.showInterstitial(placement || 'level_transition'));
    });
  }

  function showRewarded(placement) {
    if (!bridge || !bridge.advertisement) {
      return Promise.resolve('failed');
    }
    return new Promise((resolve) => {
      pendingRewarded = { placement: placement || 'default', resolve };
      const supported = safe(() => !!bridge.advertisement.isRewardedSupported, false);
      if (!supported) {
        pendingRewarded = null;
        resolve('failed');
        return;
      }
      safe(() => bridge.advertisement.showRewarded(placement || 'default'));
    });
  }

  function isRewardedSupported() {
    return bridge && bridge.advertisement ? safe(() => !!bridge.advertisement.isRewardedSupported, false) : false;
  }

  function isInterstitialSupported() {
    return bridge && bridge.advertisement ? safe(() => !!bridge.advertisement.isInterstitialSupported, false) : false;
  }

  function onAudio(cb) {
    audioListeners.push(cb);
    cb(audioEnabled);
    return () => {
      const index = audioListeners.indexOf(cb);
      if (index >= 0) audioListeners.splice(index, 1);
    };
  }

  function onPause(cb) {
    pauseListeners.push(cb);
    cb(platformPaused);
    return () => {
      const index = pauseListeners.indexOf(cb);
      if (index >= 0) pauseListeners.splice(index, 1);
    };
  }

  function getLanguage() {
    return bridge && bridge.platform ? safe(() => bridge.platform.language, null) : null;
  }

  function getDeviceType() {
    return bridge && bridge.device ? safe(() => bridge.device.type, null) : null;
  }

  /* ---------------- cloud storage mirror ---------------- */

  function storageGet(key) {
    if (!bridge || !bridge.storage) return Promise.resolve(null);
    return safe(() => bridge.storage.get(key).catch(() => null), Promise.resolve(null));
  }

  function storageSet(key, value) {
    if (!bridge || !bridge.storage) return Promise.resolve();
    return safe(() => bridge.storage.set(key, value).catch(() => {}), Promise.resolve());
  }

  return {
    init,
    sendMessage,
    sendGameReady,
    loadingProgress,
    showInterstitial,
    showRewarded,
    isRewardedSupported,
    isInterstitialSupported,
    onAudio,
    onPause,
    getLanguage,
    getDeviceType,
    storageGet,
    storageSet,
    hasBridge: !!bridge
  };
})();

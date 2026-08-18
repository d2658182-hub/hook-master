/* ============================================================
   AUDIO ENGINE — real downloaded files only.
   Two looping music tracks (menu / gameplay), real SFX,
   mute button, and Playgama platform audio events.
   ============================================================ */

class AudioEngine {
  constructor(game) {
    this.game = game;
    this.settings = { sound: true };
    const saved = game.storage.get('settings', null);
    if (saved) Object.assign(this.settings, saved);

    this.music = { current: null, menu: null, gameplay: null };
    this.sfxCache = {};
    this.platformMuted = false;
    this.unlocked = false;

    const unlock = () => {
      this.unlocked = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (this.pendingTrack) {
        this.playMusic(this.pendingTrack);
        this.pendingTrack = null;
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    SDK.onAudio((enabled) => {
      this.platformMuted = !enabled;
      this.applyMusicState();
    });
  }

  musicElement(name) {
    const paths = {
      menu: 'assets/audio/music-menu.ogg',
      gameplay: 'assets/audio/music-gameplay.ogg'
    };
    if (!paths[name]) return null;
    if (!this.music[name]) {
      const audio = new Audio(paths[name]);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.55;
      this.music[name] = audio;
    }
    return this.music[name];
  }

  playMusic(name) {
    this.pendingTrack = null;
    const target = this.musicElement(name);
    if (!target) return;
    if (this.music.current && this.music.current !== target) {
      this.music.current.pause();
    }
    this.music.current = target;
    if (!this.settings.sound || this.platformMuted) {
      target.pause();
      return;
    }
    if (!this.unlocked) {
      this.pendingTrack = name;
      return;
    }
    const attempt = () => {
      const promise = target.play();
      if (promise && promise.catch) {
        promise.catch(() => { this.pendingTrack = name; });
      }
    };
    attempt();
  }

  stopMusic() {
    this.pendingTrack = null;
    if (this.music.current) this.music.current.pause();
    this.music.current = null;
  }

  applyMusicState() {
    if (!this.music.current) return;
    if (!this.settings.sound || this.platformMuted) {
      this.music.current.pause();
    } else if (this.unlocked) {
      const promise = this.music.current.play();
      if (promise && promise.catch) promise.catch(() => {});
    }
  }

  sfx(name) {
    if (!this.settings.sound || this.platformMuted) return;
    const paths = {
      grab: 'assets/audio/sfx-cut.ogg',
      drop: 'assets/audio/sfx-collect.ogg',
      splash: 'assets/audio/sfx-fail.ogg',
      perfect: 'assets/audio/sfx-unlock.ogg',
      win: 'assets/audio/sfx-win.ogg',
      fail: 'assets/audio/sfx-fail.ogg',
      click: 'assets/audio/sfx-click.ogg',
      select: 'assets/audio/sfx-select.ogg',
      unlock: 'assets/audio/sfx-unlock.ogg',
      pop: 'assets/audio/sfx-pop.ogg',
      tick: 'assets/audio/sfx-tick.ogg',
      swing: 'assets/audio/sfx-rise.ogg'
    };
    const path = paths[name];
    if (!path) return;
    if (!this.sfxCache[name]) {
      this.sfxCache[name] = new Audio(path);
    }
    const audio = this.sfxCache[name];
    try {
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise && promise.catch) promise.catch(() => {});
    } catch (error) { /* noop */ }
  }

  click() {
    this.sfx('click');
  }

  hover() {
    this.sfx('select');
  }

  toggleSound() {
    this.settings.sound = !this.settings.sound;
    this.game.storage.set('settings', this.settings);
    this.applyMusicState();
    return this.settings.sound;
  }
}

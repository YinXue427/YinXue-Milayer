/* ============================================================
   系统媒体控制 MediaSession
   ============================================================ */

var MediaSession = {
  supported: 'mediaSession' in navigator,
  init() {
    if (!this.supported) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => { if (audio.paused) togglePlay(); });
      navigator.mediaSession.setActionHandler('pause', () => { if (!audio.paused) audio.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    } catch(e) { console.warn('MediaSession 初始化失败', e); }
  },
  update(song) {
    if (!this.supported) return;
    if (!song) {
      navigator.mediaSession.metadata = null;
      return;
    }
    try {
      const artwork = song.cover ? [
        { src: normalizePic(song.cover, 96), sizes: '96x96', type: 'image/jpeg' },
        { src: normalizePic(song.cover, 192), sizes: '192x192', type: 'image/jpeg' },
        { src: normalizePic(song.cover, 512), sizes: '512x512', type: 'image/jpeg' }
      ] : [];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name || '未知歌曲',
        artist: song.artist || 'YinXue Milayer',
        album: 'YinXue Milayer',
        artwork
      });
    } catch(e) {}
  },
  setPlayState(playing) {
    if (!this.supported) return;
    try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch(e) {}
  }
};

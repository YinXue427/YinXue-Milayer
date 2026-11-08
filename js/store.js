/* ============================================================
   本地存储 Store
   ============================================================ */

var Store = {
  set(key, value) {
    try { localStorage.setItem('yin_' + key, typeof value === 'string' ? value : JSON.stringify(value)); } catch(e) {}
  },
  get(key, defaultValue) {
    try {
      const val = localStorage.getItem('yin_' + key);
      if (val === null) return defaultValue;
      try { return JSON.parse(val); } catch { return val; }
    } catch(e) { return defaultValue; }
  },
  savePlaylist() {
    const neteaseSongs = songs.filter(s => s.source === 'netease').map(s => ({
      nid: s.nid, name: s.name, artist: s.artist, cover: s.cover, dur: s.dur, source: 'netease'
    }));
    const curSong = (cur >= 0 && songs[cur]) ? songs[cur] : null;
    const curNid = (curSong && curSong.source === 'netease') ? curSong.nid : null;
    this.set('playlist', { songs: neteaseSongs, curNid, mode, volume: audio.volume });
  },
  restorePlaylist() {
    const data = this.get('playlist', null);
    if (!data || !data.songs || !data.songs.length) return false;
    songs = data.songs.map(s => ({ ...s, url: null, lyrics: [], _lyricLoaded: false, hasExternalCover: !!s.cover, base: '' }));
    cur = data.curNid ? songs.findIndex(s => s.nid === data.curNid) : -1;
    if (cur >= 0 && !songs[cur]) cur = -1;
    mode = data.mode || 'loop';
    if (data.volume != null) { audio.volume = data.volume; $('volRange').value = data.volume * 100; }
    return cur >= 0;
  }
};

/* ============================================================
   播放核心 playSong
   ============================================================ */

async function playSong(i, openUI) {
  if (i < 0 || i >= songs.length) return;
  const song = songs[i];
  cur = i;
  
  if (bgMode === 'random') currentRandomBgUrl = `https://api.yppp.net/pc.php?t=${Date.now()}`;
  updateNowPlaying();
  if (openUI) setView('player');
  renderLyrics(); refreshAllGrids();

  if (song.source === 'netease' && !song.url) {
    if (song.loading) return; 
    song.loading = true;
    lyricInner.innerHTML = '<div class="lyric-empty">正在获取播放链接...</div>';

    try {
      const res = await API.fetch(`${API_BASE}/song/url/v1?id=${song.nid}&level=exhigh`);
      const data = await res.json();
      if (cur !== i) { song.loading = false; return; }

      const info = data && data.data && data.data[0];
      if (!info || !info.url) {
        toast('该歌曲暂不可播放'); lyricInner.innerHTML = '<div class="lyric-empty">该歌曲暂不可播放</div>'; song.loading = false;
        Store.savePlaylist();
        return;
      }
      song.url = info.url.replace(/^http:/, 'https:');
      if (info.time) song.dur = info.time / 1000;
      song.loading = false;
      loadNeteaseLyric(song).then(() => { if (songs[cur] === song) renderLyrics(); });
    } catch (e) {
      if (cur !== i) return;
      toast('获取播放链接失败：' + e.message); lyricInner.innerHTML = '<div class="lyric-empty">加载失败</div>'; song.loading = false;
      Store.savePlaylist();
      return;
    }
  }

  if (cur !== i) return;
  audio.src = song.url;
  audio.play().catch(()=>{});
  updateNowPlaying(); refreshAllGrids();
  Store.savePlaylist();
}

function updateNowPlaying(){
  const s = (cur >= 0 && cur < songs.length) ? songs[cur] : null;
  const name = s ? s.name : '未播放';
  const artist = s ? s.artist : '网易云音乐';
  const cov = s && s.cover;

  $('sideName').textContent = name;
  $('sideArtist').textContent = artist;
  $('miniName').textContent = name;
  $('miniArtist').textContent = artist;
  $('outroCredit').textContent = s ? `${s.name} - ${s.artist}` : '';

  updateGlobalBg(cov);
  $('coverImg').style.backgroundImage = cov ? `url("${cov}")` : '';
  $('coverFallback').style.display = cov ? 'none' : 'grid';

  const mc = $('miniCover');
  mc.style.backgroundImage = cov ? `url("${cov}")` : '';
  mc.innerHTML = cov ? '' : '<svg class="ic" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  if (!playerView.classList.contains('on') && s) mini.classList.add('show');
  
  updateResumeCard();
  MediaSession.update(s);
}

function syncPlayIcon(){
  const playing = !audio.paused && audio.src;
  const icon = playing ? ICON.pause : ICON.play;
  $('playBtn').innerHTML = icon;
  $('miniPlay').innerHTML = icon;
  MediaSession.setPlayState(playing);
}

function togglePlay(){
  if(cur < 0){ if(songs.length) playSong(0,false); return; }
  if(!audio.src){ playSong(cur,false); return; }
  audio.paused ? audio.play().catch(()=>{}) : audio.pause();
}

function step(dir){
  if(!songs.length) return;
  if(mode==='shuffle'){
    if(dir > 0){
      if(songs.length===1){ playSong(cur,false); return; }
      let n; do { n = Math.floor(Math.random()*songs.length); } while(n===cur);
      playHistory.push(cur);
      if (playHistory.length > 100) playHistory.shift();
      playSong(n,false);
    } else {
      const prev = playHistory.pop();
      if (prev != null && prev >= 0 && prev < songs.length) playSong(prev, false);
      else playSong(cur, false);
    }
    return;
  }
  let n = cur + dir;
  if(n >= songs.length) n = 0;
  if(n < 0) n = songs.length - 1;
  playSong(n,false);
}

function onEnded(){
  if(mode==='one'){ audio.currentTime=0; audio.play().catch(()=>{}); return; }
  if(!songs.length) return;
  if(mode==='shuffle'){ step(1); return; }
  playSong(cur===songs.length-1?0:cur+1,false);
}

function updateProgress(){
  const d=audio.duration||0,t=audio.currentTime||0,p=d?Math.min(1,t/d):0;
  if(!dragging){ barFill.style.width=(p*100)+'%'; barDot.style.left=(p*100)+'%'; }
  $('curTime').textContent = fmt(t);
  $('durTime').textContent = d ? fmt(d) : '0:00';
}

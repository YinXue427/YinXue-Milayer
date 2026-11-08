/* ============================================================
   首页数据加载
   ============================================================ */

async function loadToplist() {
  try {
    const list = await API.getToplist();
    const targetIds = [19723756, 3779629, 3778678, 2884035];
    const picked = targetIds.map(id => list.find(x => x.id === id)).filter(Boolean);
    const final = picked.length === 4 ? picked : list.slice(0, 4);
    
    toplistData = final.map(t => ({
      id: ++uid, nid: t.id, name: t.name, artist: t.updateFrequency || '官方榜单',
      cover: normalizePic(t.coverImgUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'playlist'
    }));
    
    renderCards($('toplistGrid'), toplistData, false);
  } catch(e) { console.warn('榜单加载失败', e); }
}

async function loadRecommendPlaylists() {
  try {
    const list = await API.getRecommend();
    homeList = list.map(p => ({
      id: ++uid, nid: p.id, name: p.name, artist: `歌单 · ${formatNum(p.playCount)} 播放`,
      cover: normalizePic(p.picUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'playlist'
    }));
    renderHomeGrid();
  } catch(e) { console.warn('推荐歌单加载失败', e); }
}

function loadHomeContent() {
  hideSearchError();
  loadToplist();
  loadRecommendPlaylists();
}

function updateResumeCard() {
  const card = $('resumeCard');
  if (cur < 0 || !songs[cur]) { card.style.display = 'none'; return; }
  const s = songs[cur];
  card.style.display = 'flex';
  card.classList.add('show');
  const coverEl = $('resumeCover');
  if (s.cover) {
    coverEl.style.backgroundImage = `url("${s.cover}")`;
    coverEl.innerHTML = '';
  } else {
    coverEl.style.backgroundImage = '';
    coverEl.innerHTML = '<svg class="ic" viewBox="0 0 24 24" style="width:24px;height:24px;opacity:0.4;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  }
  $('resumeName').textContent = s.name;
  $('resumeArtist').textContent = s.artist;
}

$('resumeBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  if (cur >= 0 && songs[cur]) playSong(cur, true);
});
$('resumeCard').addEventListener('click', () => {
  if (cur >= 0 && songs[cur]) playSong(cur, true);
});

/* ============================================================
   歌单 / 专辑 / 歌手页
   ============================================================ */

async function loadDetailView(item) {
  currentDetailCover = item.cover;
  setView('detail');
  
  $('detailSub').textContent = '加载中...';
  $('detailName').textContent = item.name;
  $('detailNavTitle').textContent = item.name;
  $('detailDesc').textContent = item.artist;
  if (item.cover) $('detailCover').src = item.cover;
  else $('detailCover').removeAttribute('src');
  $('detailGridList').innerHTML = '';
  detailSongs = [];

  if (bgMode === 'cover' || bgMode === 'fluid') updateGlobalBg(item.cover);
  
  try {
    let apiUrl = '';
    if (item.source === 'playlist') apiUrl = `${API_BASE}/playlist/track/all?id=${item.nid}&limit=1000`;
    else if (item.source === 'album') apiUrl = `${API_BASE}/album?id=${item.nid}`;
    
    if (!apiUrl) { toast('未知内容类型'); return; }
    
    const res = await API.fetch(apiUrl);
    const data = await res.json();
    let rawSongs = [];
    if (item.source === 'playlist' && data.songs) rawSongs = data.songs;
    else if (item.source === 'album' && data.songs) rawSongs = data.songs;
    
    if (!rawSongs || !rawSongs.length) {
      toast('该列表暂无歌曲'); $('detailSub').textContent = '0 首歌曲'; return;
    }
    
    detailSongs = rawSongs.map(s => {
      const artists = (s.ar || s.artists || []).map(a => a.name).join(' / ') || '未知';
      const albumName = (s.al && s.al.name) || (s.album && s.album.name) || '';
      let rawPic = (s.al && s.al.picUrl) || (s.album && s.album.picUrl) || '';
      const pic = normalizePic(rawPic);
      return {
        id: ++uid, nid: s.id, name: s.name || '未知歌曲',
        artist: albumName ? `${artists} · ${albumName}` : artists,
        url: null, cover: pic || null, hasExternalCover: !!pic,
        lyrics: [], dur: (s.dt || s.duration || 0) / 1000, base: '', source: 'netease'
      };
    });
    
    $('detailSub').textContent = `${detailSongs.length} 首歌曲`;
    renderCards($('detailGridList'), detailSongs, true);
    
    const noPicSongs = detailSongs.filter(s => !s.cover);
    if (noPicSongs.length) fetchDetailCovers(noPicSongs);
    
  } catch (e) {
    toast('加载详情失败：' + e.message);
    $('detailSub').textContent = '加载失败';
  }
}

async function loadArtistData(id) {
  setView('artist');
  
  $('aName').textContent = '加载中...';
  $('aSongList').innerHTML = ''; $('aAlbumList').innerHTML = ''; $('aMvList').innerHTML = '';

  try {
    const [detail, sRes, aRes, mRes] = await Promise.all([
      API.fetch(`${API_BASE}/artist/detail?id=${id}`).then(r=>r.json()),
      API.fetch(`${API_BASE}/artists?id=${id}`).then(r=>r.json()),
      API.fetch(`${API_BASE}/artist/album?id=${id}&limit=50`).then(r=>r.json()),
      API.fetch(`${API_BASE}/artist/mv?id=${id}&limit=30`).then(r=>r.json())
    ]);

    if (detail.code === 200 && detail.data && detail.data.artist) {
      const art = detail.data.artist;
      $('aName').textContent = art.name;
      const cov = normalizePic(art.cover, 800);
      $('aCover').src = cov;
      $('artistHeroBg').style.backgroundImage = `url("${cov}")`;
    }

    artistSongs = sRes.hotSongs || [];
    artistAlbums = aRes.hotAlbums || [];
    artistMVs = mRes.mvs || [];

    $('aStatSongs').textContent = `${artistSongs.length} 首热歌`;
    $('aStatAlbums').textContent = `${artistAlbums.length} 张专辑`;

    // 只渲染前 5 首
    $('aSongList').innerHTML = artistSongs.slice(0, 5).map((s, i) => `
      <div class="artist-track-row" data-song-index="${i}">
        <div class="at-index">${i + 1}</div>
        <div class="at-title-wrap">
          <img class="at-cover" src="${normalizePic(s.al?.picUrl, 100)}">
          <div class="at-info">
            <div class="at-title">${esc(s.name)}</div>
            <div class="at-artist">${esc(s.ar.map(a=>a.name).join(' / '))}</div>
          </div>
        </div>
        <div class="at-album">${esc(s.al?.name || '')}</div>
        <div class="at-time">${fmt(s.dt/1000)}</div>
      </div>
    `).join('');

    $('aAlbumList').innerHTML = artistAlbums.slice(0, 15).map((a, i) => `
      <div class="a-album-card" data-album-index="${i}">
        <img class="a-album-cover" src="${normalizePic(a.picUrl, 300)}">
        <div class="a-album-title">${esc(a.name)}</div>
        <div class="a-album-year">${a.publishTime ? new Date(a.publishTime).getFullYear() : ''}</div>
      </div>
    `).join('');

    $('aMvList').innerHTML = artistMVs.slice(0, 10).map((m, i) => `
      <div class="a-mv-card" data-mv-index="${i}">
        <img class="a-mv-cover" src="${normalizePic(m.imgurl16v9, 400)}">
        <div class="a-mv-info"><div class="a-mv-title">${esc(m.name)}</div></div>
      </div>
    `).join('');

  } catch(e) {
    console.error(e);
  }
}

$('aSongList').addEventListener('click', (e) => {
  const row = e.target.closest('[data-song-index]');
  if (row) playArtistSong(+row.dataset.songIndex);
});
$('aAlbumList').addEventListener('click', (e) => {
  const card = e.target.closest('[data-album-index]');
  if (card) {
    const a = artistAlbums[+card.dataset.albumIndex];
    if (a) loadDetailView({ source: 'album', nid: a.id, name: a.name, artist: '专辑', cover: normalizePic(a.picUrl) });
  }
});
$('aMvList').addEventListener('click', (e) => {
  const card = e.target.closest('[data-mv-index]');
  if (card) {
    const m = artistMVs[+card.dataset.mvIndex];
    if (m) playMV({ nid: m.id, name: m.name });
  }
});

$('aPlayAll').addEventListener('click', () => {
  if (artistSongs.length) playArtistSong(0);
});

$('artistView').addEventListener('click', (e) => {
  const more = e.target.closest('[data-modal]');
  if (more) openArtistModal(more.dataset.modal);
});

$('closeArtistModal').addEventListener('click', () => $('artistModal').classList.remove('on'));
$('artistModal').addEventListener('click', (e) => { if (e.target === $('artistModal')) $('artistModal').classList.remove('on'); });

window.openArtistModal = function(type) {
  const modal = $('artistModal'), title = $('artistModalTitle'), content = $('artistModalContent');
  
  if (type === 'songs') {
    title.textContent = '全部热门歌曲';
    content.innerHTML = `<div class="table-list">${artistSongs.map((s, i) => `
      <div class="table-row" data-song-index="${i}">
        <div class="table-index">${i + 1}</div>
        <div class="table-title-wrap">
          <img class="table-cover" src="${normalizePic(s.al?.picUrl, 100)}">
          <div style="min-width:0">
            <div class="table-title">${esc(s.name)}</div>
            <div class="table-artist">${esc(s.ar.map(a=>a.name).join(' / '))}</div>
          </div>
        </div>
        <div class="table-album">${esc(s.al?.name || '')}</div>
        <div class="table-time">${fmt(s.dt/1000)}</div>
      </div>
    `).join('')}</div>`;
    content.onclick = (ev) => {
      const row = ev.target.closest('[data-song-index]');
      if (row) { playArtistSong(+row.dataset.songIndex); modal.classList.remove('on'); }
    };
  } else if (type === 'albums') {
    title.textContent = '全部专辑';
    content.innerHTML = `<div class="grid-albums">${artistAlbums.map((a, i) => `
      <div class="a-album-card" style="width:100%" data-album-index="${i}">
        <img class="a-album-cover" src="${normalizePic(a.picUrl, 300)}">
        <div class="a-album-title">${esc(a.name)}</div>
      </div>
    `).join('')}</div>`;
    content.onclick = (ev) => {
      const card = ev.target.closest('[data-album-index]');
      if (card) {
        const a = artistAlbums[+card.dataset.albumIndex];
        modal.classList.remove('on');
        if (a) loadDetailView({ source: 'album', nid: a.id, name: a.name, artist: '专辑', cover: normalizePic(a.picUrl) });
      }
    };
  } else if (type === 'mvs') {
    title.textContent = '全部音乐视频';
    content.innerHTML = `<div class="grid-mvs">${artistMVs.map((m, i) => `
      <div class="a-mv-card" style="width:100%" data-mv-index="${i}">
        <img class="a-mv-cover" src="${normalizePic(m.imgurl16v9, 400)}">
        <div class="a-mv-info"><div class="a-mv-title">${esc(m.name)}</div></div>
      </div>
    `).join('')}</div>`;
    content.onclick = (ev) => {
      const card = ev.target.closest('[data-mv-index]');
      if (card) {
        const m = artistMVs[+card.dataset.mvIndex];
        modal.classList.remove('on');
        if (m) playMV({ nid: m.id, name: m.name });
      }
    };
  }
  content.scrollTop = 0;
  modal.classList.add('on');
};

window.playArtistSong = function(i) {
  if (!artistSongs[i]) return;
  songs = artistSongs.map(s => ({
    nid: s.id, name: s.name, artist: s.ar.map(a=>a.name).join(' / '),
    cover: normalizePic(s.al?.picUrl), source: 'netease', lyrics: [], url: null, dur: (s.dt || 0) / 1000
  }));
  playSong(i, true);
};

$('detailBackBtn').addEventListener('click', () => setView('lib'));
$('artistBackBtn').addEventListener('click', () => setView('lib'));
$('queueBtn').addEventListener('click', () => { renderQueue(); $('queueMask').classList.add('on'); });
$('queueClose').addEventListener('click', () => $('queueMask').classList.remove('on'));
$('queueMask').addEventListener('click', e => { if (e.target === $('queueMask')) $('queueMask').classList.remove('on'); });
$('queueClear').addEventListener('click', () => {
  songs = []; cur = -1; audio.pause(); audio.removeAttribute('src');
  renderQueue(); updateNowPlaying(); refreshAllGrids(); syncPlayIcon(); Store.savePlaylist(); toast('已清空队列');
});

var handleHomeGridClick = (e, list) => {
  const card = e.target.closest('.card'); if (!card) return;
  const i = +card.dataset.i; const item = list[i];
  if (!item) return;
  if (item.source === 'playlist' || item.source === 'album') loadDetailView(item);
};
$('homeGridList').addEventListener('click', e => handleHomeGridClick(e, homeList));
$('toplistGrid').addEventListener('click', e => handleHomeGridClick(e, toplistData));

$('searchSlider').addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  const pane = card.closest('.search-pane'); if (!pane) return;
  const type = pane.id.replace('pane-', '');
  const i = +card.dataset.i; const item = searchResults[type][i];
  if (!item) return;
  
  const actEl = e.target.closest('[data-act]');
  if (actEl) {
    e.stopPropagation();
    const act = actEl.dataset.act;
    if (act === 'del') { searchResults[type].splice(i, 1); renderSearchGrid(); }
    else if (act === 'lyric') { targetSongId = item.id; $('lyricInput').click(); }
    else if (act === 'cover') { targetSongId = item.id; $('coverInput').click(); }
    return;
  }
  
  if (item.source === 'mv') {
    playMV(item);
  } else if (item.source === 'artist') {
    loadArtistData(item.nid);
  } else if (item.source === 'playlist' || item.source === 'album') {
    loadDetailView(item);
  } else if (item.source === 'netease' || item.source === 'local') {
    const songList = searchResults.song;
    const playIdx = songList.findIndex(x => x.nid === item.nid && x.source === item.source);
    if (playIdx !== -1) {
      songs = songList; playSong(playIdx, true);
      if ($('queueMask').classList.contains('on')) renderQueue();
    }
  }
});

$('detailGridList').addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  const i = +card.dataset.i;
  songs = [...detailSongs]; playSong(i, true);
  if ($('queueMask').classList.contains('on')) renderQueue();
});

$('detailPlayAll').addEventListener('click', () => {
  if (!detailSongs.length) return;
  songs = [...detailSongs]; playSong(0, true);
  if ($('queueMask').classList.contains('on')) renderQueue();
});

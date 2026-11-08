/* ============================================================
   搜索 & 联想
   ============================================================ */

function escSuggest(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function highlight(text, keyword) {
  if (!keyword) return escSuggest(text);
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escSuggest(text).replace(regex, '<span class="match">$1</span>');
}

var fetchSuggestions = async function(kw) {
  const suggestBox = $('suggestBox');
  if (!kw) { suggestBox.classList.remove('show'); return; }
  if (suggestAbort) suggestAbort.abort();
  suggestAbort = new AbortController();

  try {
    const res = await fetch(`${API_BASE}/search/suggest?keywords=${encodeURIComponent(kw)}&timestamp=${Date.now()}`, { signal: suggestAbort.signal });
    const data = await res.json();
    if (data && data.result) {
      renderSuggestions(data.result, kw);
    } else {
      suggestBox.innerHTML = `<div class="suggest-empty">未找到相关结果</div>`;
      suggestBox.classList.add('show');
      flatSuggestList = [];
    }
  } catch (e) {
    if (e.name !== 'AbortError') suggestBox.classList.remove('show');
  }
};

function renderSuggestions(result, keyword) {
  const suggestBox = $('suggestBox');
  suggestBox.innerHTML = '';
  flatSuggestList = [];
  activeSuggestIndex = -1;

  let hasData = false;

  if (result.artists && result.artists.length > 0) {
    hasData = true;
    const group = document.createElement('div');
    group.className = 'suggest-group';
    group.innerHTML = `<div class="group-title">歌手</div>`;
    
    result.artists.slice(0, 4).forEach(artist => {
      const item = createSuggestItem('artist', artist.name, '歌手', artist.id, artist.picUrl || artist.img1v1Url, keyword);
      group.appendChild(item);
      flatSuggestList.push({ el: item, type: 'artist', data: artist });
    });
    suggestBox.appendChild(group);
  }

  if (result.songs && result.songs.length > 0) {
    hasData = true;
    const group = document.createElement('div');
    group.className = 'suggest-group';
    group.innerHTML = `<div class="group-title">单曲</div>`;
    
    result.songs.slice(0, 4).forEach(song => {
      const artists = song.artists ? song.artists.map(a => a.name).join(' / ') : '未知';
      const item = createSuggestItem('song', song.name, artists, song.id, song.album ? song.album.picUrl : null, keyword);
      group.appendChild(item);
      flatSuggestList.push({ el: item, type: 'song', data: song });
    });
    suggestBox.appendChild(group);
  }

  if (hasData) suggestBox.classList.add('show');
  else {
    suggestBox.innerHTML = `<div class="suggest-empty">未找到相关结果</div>`;
    suggestBox.classList.add('show');
  }
}

function createSuggestItem(type, title, subtitle, id, pic, keyword) {
  const div = document.createElement('div');
  div.className = 'suggest-item';
  
  let iconHtml = '';
  if (pic) {
    iconHtml = `<img src="${normalizePic(pic, 64)}" referrerpolicy="no-referrer" onerror="this.style.display='none'">`;
  } else {
    iconHtml = type === 'artist' ? '👤' : '♪';
  }

  div.innerHTML = `
    <div class="suggest-icon">${iconHtml}</div>
    <div class="suggest-text">${highlight(title, keyword)}<span class="suggest-sub">${escSuggest(subtitle)}</span></div>
  `;

  div.addEventListener('click', () => {
    $('searchInput').value = '';
    $('suggestBox').classList.remove('show');
    $('searchInput').blur();
    if (type === 'artist') {
      loadArtistData(id);
    } else {
      $('searchInput').value = title;
      doSearch();
    }
  });

  return div;
}

$('searchInput').addEventListener('input', (e) => {
  const kw = e.target.value.trim();
  clearTimeout(suggestDebounce);
  suggestDebounce = setTimeout(() => { fetchSuggestions(kw); }, 300);
});

$('searchInput').addEventListener('keydown', (e) => {
  const suggestBox = $('suggestBox');
  if (!suggestBox.classList.contains('show') || flatSuggestList.length === 0) {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSuggestIndex = (activeSuggestIndex + 1) % flatSuggestList.length;
    flatSuggestList.forEach((item, i) => item.el.classList.toggle('active', i === activeSuggestIndex));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSuggestIndex = (activeSuggestIndex - 1 + flatSuggestList.length) % flatSuggestList.length;
    flatSuggestList.forEach((item, i) => item.el.classList.toggle('active', i === activeSuggestIndex));
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeSuggestIndex >= 0 && activeSuggestIndex < flatSuggestList.length) {
      flatSuggestList[activeSuggestIndex].el.click();
    } else {
      suggestBox.classList.remove('show');
      doSearch();
    }
  } else if (e.key === 'Escape') {
    suggestBox.classList.remove('show');
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-hero')) $('suggestBox').classList.remove('show');
});

var searchTabs = document.querySelectorAll('.search-tab');
var searchTabIndicator = $('searchTabIndicator');
var searchSlider = $('searchSlider');

function switchSearchTab(index) {
  currentSearchIndex = index;
  searchTabs.forEach((t, i) => t.classList.toggle('active', i === index));
  
  const tab = searchTabs[index];
  if (tab) {
    searchTabIndicator.style.width = tab.offsetWidth + 'px';
    searchTabIndicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  }
  
  searchSlider.style.transform = `translateX(-${index * 20}%)`;
  searchType = searchTabs[index].dataset.type;
}

searchTabs.forEach((tab, i) => {
  tab.addEventListener('click', () => switchSearchTab(i));
});

async function doSearch() {
  const kw = $('searchInput').value.trim();
  if (!kw) { hideSearchError(); searchResults = { song: [], playlist: [], album: [], artist: [], mv: [] }; renderSearchGrid(); return; }
  hideSearchError();
  const btn = $('searchBtn'); btn.disabled = true; const oldText = btn.textContent; btn.textContent = '搜索中...';

  try {
    const types = [1, 1000, 10, 100, 1004];
    const requests = types.map(t => API.fetch(`${API_BASE}/cloudsearch?keywords=${encodeURIComponent(kw)}&type=${t}&limit=30`).then(r => r.json()));
    const [songData, playlistData, albumData, artistData, mvData] = await Promise.all(requests);

    const songsList = (songData.result && (songData.result.songs || songData.result.song)) || [];
    searchResults.song = songsList.map(s => {
      const artists = (s.ar || s.artists || []).map(a => a.name).join(' / ') || '未知';
      const albumName = (s.al && s.al.name) || (s.album && s.album.name) || '';
      let rawPic = (s.al && s.al.picUrl) || (s.album && s.album.picUrl) || '';
      const pic = normalizePic(rawPic);
      return {
        id: ++uid, nid: s.id, name: s.name || '未知歌曲', artist: albumName ? `${artists} · ${albumName}` : artists,
        url: null, cover: pic || null, hasExternalCover: !!pic, lyrics: [], dur: (s.dt || s.duration || 0) / 1000, base: '', source: 'netease'
      };
    });

    const playlistsList = (playlistData.result && playlistData.result.playlists) || [];
    searchResults.playlist = playlistsList.map(p => ({
      id: ++uid, nid: p.id, name: p.name, artist: `歌单 · ${p.creator?.nickname || '未知'}`,
      cover: normalizePic(p.coverImgUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'playlist'
    }));

    const albumsList = (albumData.result && albumData.result.albums) || [];
    searchResults.album = albumsList.map(p => ({
      id: ++uid, nid: p.id, name: p.name, artist: `专辑 · ${p.artist?.name || '未知'}`,
      cover: normalizePic(p.picUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'album'
    }));

    const artistsList = (artistData.result && artistData.result.artists) || [];
    searchResults.artist = artistsList.map(p => ({
      id: ++uid, nid: p.id, name: p.name, artist: `歌手 · ${(p.alias || []).join(' / ') || '热门歌曲'}`,
      cover: normalizePic(p.picUrl || p.img1v1Url), hasExternalCover: true, lyrics: [], dur: 0, source: 'artist'
    }));

    const mvsList = (mvData.result && (mvData.result.mvs || mvData.result.mv)) || [];
    searchResults.mv = mvsList.map(p => ({
      id: ++uid, nid: p.id, name: p.name, artist: `MV · ${p.artistName || '未知'}`,
      cover: normalizePic(p.cover || p.imgurl16v9 || p.picUrl), hasExternalCover: true, lyrics: [], dur: (p.duration || 0) / 1000, source: 'mv'
    }));

    renderSearchGrid();
    
    const noPicSongs = searchResults.song.filter(s => !s.cover);
    if (noPicSongs.length > 0) fetchSongDetails(noPicSongs);

  } catch (e) {
    showSearchError('搜索失败：' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = oldText;
  }
}

async function fetchSongDetails(songsToUpdate) {
  if (!songsToUpdate.length) return;
  const ids = songsToUpdate.slice(0, 50).map(s => s.nid).join(',');
  try {
    const res = await API.fetch(`${API_BASE}/song/detail?ids=${ids}`);
    const data = await res.json();
    if (data && data.songs && data.songs.length) {
      let updated = false;
      data.songs.forEach(ds => {
        const target = searchResults.song.find(s => s.nid === ds.id);
        if (target && !target.cover) {
          let rawPic = (ds.al && ds.al.picUrl) || (ds.album && ds.album.picUrl) || '';
          const pic = normalizePic(rawPic);
          if (pic) { target.cover = pic; updated = true; }
        }
      });
      if (updated) renderSearchGrid();
    }
  } catch(e) {}
}

async function fetchDetailCovers(songsToUpdate) {
  const ids = songsToUpdate.slice(0, 50).map(s => s.nid).join(',');
  try {
    const res = await API.fetch(`${API_BASE}/song/detail?ids=${ids}`);
    const data = await res.json();
    if (data && data.songs && data.songs.length) {
      let updated = false;
      data.songs.forEach(ds => {
        const target = detailSongs.find(s => s.nid === ds.id);
        if (target && !target.cover) {
          let rawPic = (ds.al && ds.al.picUrl) || (ds.album && ds.album.picUrl) || '';
          const pic = normalizePic(rawPic);
          if (pic) { target.cover = pic; updated = true; }
        }
      });
      if (updated) renderCards($('detailGridList'), detailSongs, true);
    }
  } catch(e) {}
}

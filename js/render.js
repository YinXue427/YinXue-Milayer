/* ============================================================
   卡片 & 列表渲染
   ============================================================ */

function renderCards(container, list, isDetail) {
  container.innerHTML = '';
  list.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    const isSong = item.source === 'local' || item.source === 'netease';
    const isMV = item.source === 'mv';
    const isPlaying = isSong && cur >= 0 && songs[cur] && songs[cur].nid === item.nid && songs[cur].source === item.source;
    if (isPlaying) card.classList.add('on');
    card.dataset.i = i;

    const actsHtml = isSong && !isDetail ? `
      <div class="card-acts">
        <button class="icon-btn" data-act="lyric" title="导入歌词">${ICON.lyric}</button>
        <button class="icon-btn" data-act="cover" title="设置封面">${ICON.image}</button>
        <button class="icon-btn" data-act="del" title="移除">${ICON.trash}</button>
      </div>` : '';

    const overlayIcon = isSong ? '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>' : (isMV ? '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>' : '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>');

    card.innerHTML = `
      <div class="card-cover"></div><div class="card-gradient"></div>
      <div class="card-info"><div class="card-title">${esc(item.name)}</div><div class="card-artist">${esc(item.artist)}</div></div>
      <div class="card-duration">${item.dur ? fmt(item.dur) : ''}</div>
      <div class="play-overlay">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;margin-left:2px;">${overlayIcon}</svg>
      </div>
      ${actsHtml}
    `;

    const coverEl = card.querySelector('.card-cover');
    const fallbackHtml = '<div style="position:absolute;inset:0;display:grid;place-items:center;"><svg class="ic" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
    
    if (item.cover) {
      const img = document.createElement('img');
      img.src = item.cover; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover'; img.referrerPolicy = 'no-referrer';
      img.onerror = () => { img.remove(); coverEl.innerHTML = fallbackHtml; };
      coverEl.appendChild(img);
    } else { coverEl.innerHTML = fallbackHtml; }
    container.appendChild(card);
  });
}

function renderHomeGrid() {
  renderCards($('homeGridList'), homeList, false);
  $('libSub').textContent = homeList.length ? '发现好音乐' : '正在加载…';
  $('homeHeadSub').textContent = homeList.length ? `${homeList.length} 个歌单` : '';
}

function renderSearchGrid() {
  renderCards($('searchGrid_song'), searchResults.song, false);
  renderCards($('searchGrid_playlist'), searchResults.playlist, false);
  renderCards($('searchGrid_album'), searchResults.album, false);
  renderCards($('searchGrid_artist'), searchResults.artist, false);
  renderCards($('searchGrid_mv'), searchResults.mv, false);

  const kw = $('searchInput').value.trim();
  const types = ['song', 'playlist', 'album', 'artist', 'mv'];
  types.forEach(t => {
    const empty = $('empty_' + t);
    if (searchResults[t].length === 0) {
      empty.style.display = 'flex';
      if (kw) {
        empty.innerHTML = `<svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><p>没有找到相关结果</p><span>试试换个关键词</span>`;
      } else {
        empty.innerHTML = `<svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><p>开始探索音乐世界</p><span>输入关键词开始搜索</span>`;
      }
    } else {
      empty.style.display = 'none';
    }
  });
}

function refreshAllGrids() {
  renderHomeGrid();
  renderSearchGrid();
  if (detailSongs.length) renderCards($('detailGridList'), detailSongs, true);
}

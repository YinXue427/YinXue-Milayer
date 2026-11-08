/* ============================================================
   播放队列
   ============================================================ */

function renderQueue() {
  $('queueCount').textContent = songs.length;
  $('queueList').innerHTML = '';
  songs.forEach((s, i) => {
    const isCur = (i === cur);
    const el = document.createElement('div');
    el.className = 'queue-item' + (isCur ? ' on' : '');
    
    let coverHtml = s.cover ? `<img src="${s.cover}" referrerpolicy="no-referrer">` : `<svg class="ic" viewBox="0 0 24 24" style="width:16px;height:16px;opacity:0.5;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    
    el.innerHTML = `
      <div class="queue-item-cover">${coverHtml}</div>
      <div class="queue-item-info"><div class="queue-item-name">${esc(s.name)}</div><div class="queue-item-artist">${esc(s.artist)}</div></div>
      <button class="queue-item-del" data-del="${i}" title="移除"><svg class="ic" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    `;
    
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-del]')) {
        e.stopPropagation(); songs.splice(i, 1);
        if (cur === i) {
          audio.pause(); audio.removeAttribute('src'); cur = -1;
          if (songs.length > 0) playSong(Math.min(i, songs.length-1), false);
          else { updateNowPlaying(); syncPlayIcon(); refreshAllGrids(); Store.savePlaylist(); }
        } else if (cur > i) { cur--; }
        renderQueue(); refreshAllGrids(); updateNowPlaying(); Store.savePlaylist(); return;
      }
      playSong(i, false);
    });
    $('queueList').appendChild(el);
  });
}

function showSearchError(msg) { const el = $('searchError'); el.textContent = msg; el.classList.add('show'); }
function hideSearchError() { $('searchError').classList.remove('show'); }

/* ============================================================
   全局键盘 / 窗口事件
   ============================================================ */

let rzTimer;
window.addEventListener('resize',()=>{
  clearTimeout(rzTimer);
  rzTimer=setTimeout(()=>{
    if(lyricIdx>=0)scrollToLine(lyricIdx,currentGlobalOffset);
    else centerFirst(currentGlobalOffset);
    switchSearchTab(currentSearchIndex);
  },150);
});

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(e.key==='Escape'){
    if(importMask.classList.contains('on')){closeModal();return;}
    if($('loginMask').classList.contains('on')){$('loginMask').classList.remove('on');stopQrPolling();return;}
    if($('queueMask').classList.contains('on')){$('queueMask').classList.remove('on');return;}
    if(videoMask.classList.contains('on')){closeVideoModal();return;}
    if($('artistModal').classList.contains('on')){$('artistModal').classList.remove('on');return;}
    if(playerView.classList.contains('on')){ if (prevView === 'detail') setView('detail'); else if (prevView === 'artist') setView('artist'); else setView('lib'); return; }
    if(detailView.classList.contains('on') || artistView.classList.contains('on')){setView('lib');return;}
    return;
  }
  if(importMask.classList.contains('on')||$('queueMask').classList.contains('on')||$('loginMask').classList.contains('on')||videoMask.classList.contains('on'))return;
  if(e.code==='Space'){e.preventDefault();togglePlay();}
  else if(e.code==='ArrowRight'&&playerView.classList.contains('on')){e.preventDefault();step(1);}
  else if(e.code==='ArrowLeft'&&playerView.classList.contains('on')){e.preventDefault();step(-1);}
});

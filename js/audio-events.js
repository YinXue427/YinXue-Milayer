/* ============================================================
   audio 事件 & 全屏
   ============================================================ */

function updateFsIcon(){
  const on = !!document.fullscreenElement;
  $('fsBtn').innerHTML = on ? ICON.fsExit : ICON.fs;
}
function toggleFullscreen(){
  if(!document.fullscreenElement){
    const el = document.documentElement;
    (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen).call(el).catch(()=>{});
  } else {
    (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document).catch(()=>{});
  }
}
$('fsBtn').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFsIcon);
document.addEventListener('webkitfullscreenchange', updateFsIcon);
updateFsIcon();

var rafId = null;
audio.addEventListener('timeupdate', () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => { updateProgress(); updateLyric(); rafId = null; });
});
audio.addEventListener('loadedmetadata',()=>{$('durTime').textContent=fmt(audio.duration);});
audio.addEventListener('play',()=>{ syncPlayIcon(); });
audio.addEventListener('pause',()=>{ syncPlayIcon(); });
audio.addEventListener('ended',onEnded);
audio.addEventListener('error', () => {
  const s = (cur >= 0 && cur < songs.length) ? songs[cur] : null;
  if (s && s.source === 'netease' && audio.src) {
    toast('音频加载失败，1 秒后自动跳过');
    setTimeout(() => { if (songs[cur] === s) step(1); }, 1000);
  }
});

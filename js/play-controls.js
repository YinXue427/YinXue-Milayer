/* ============================================================
   播放控制条（模式 / 进度 / 音量）
   ============================================================ */

var MODES = [{key:'loop',icon:ICON.loop,title:'列表循环'},{key:'one',icon:ICON.one,title:'单曲循环'},{key:'shuffle',icon:ICON.shuffle,title:'随机播放'}];
function syncMode(){
  const m=MODES.find(x=>x.key===mode),btn=$('modeBtn');
  btn.innerHTML=m.icon;btn.title=m.title;btn.classList.toggle('on',mode!=='loop');
}
$('modeBtn').addEventListener('click',()=>{
  const idx=MODES.findIndex(x=>x.key===mode);
  mode=MODES[(idx+1)%MODES.length].key;
  syncMode();
  Store.savePlaylist();
});

var progressEl = $('progress');
function seekAt(clientX){
  const r=progressEl.getBoundingClientRect(),p=Math.min(1,Math.max(0,(clientX-r.left)/r.width));
  barFill.style.width=(p*100)+'%';barDot.style.left=(p*100)+'%';
  $('curTime').textContent=fmt(p*(audio.duration||0));
  if(audio.duration)audio.currentTime=p*audio.duration;
}
progressEl.addEventListener('pointerdown',e=>{if(!audio.duration)return;dragging=true;progressEl.setPointerCapture(e.pointerId);seekAt(e.clientX);});
progressEl.addEventListener('pointermove',e=>{if(dragging)seekAt(e.clientX);});
progressEl.addEventListener('pointerup',e=>{dragging=false;try{progressEl.releasePointerCapture(e.pointerId);}catch{}});

var volRange = $('volRange');
volRange.addEventListener('input',()=>{ audio.volume = volRange.value / 100; audio.muted = false; syncVolIcon(); Store.set('volume', audio.volume); });
$('muteBtn').addEventListener('click',(e)=>{ e.stopPropagation(); $('volPop').classList.toggle('on'); });
document.addEventListener('click', e => { if (!e.target.closest('.volume-wrapper')) $('volPop').classList.remove('on'); });
function syncVolIcon(){ $('muteBtn').innerHTML = (audio.muted || audio.volume === 0) ? ICON.mute : ICON.sound; }

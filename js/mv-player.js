/* ============================================================
   MV 视频播放器
   ============================================================ */

var videoMask = $('videoMask');
var mvVideo = $('mvVideo');
var playerUI = $('playerUI');
var videoPlayToggle = $('videoPlayToggle');
var videoProgress = $('videoProgress');
var videoProgressFill = $('videoProgressFill');
var videoProgressDot = $('videoProgressDot');
var videoCurTime = $('videoCurTime');
var videoDurTime = $('videoDurTime');
var videoVolIcon = $('videoVolIcon');
var videoVolSlider = $('videoVolSlider');
var videoFsIcon = $('videoFsIcon');
var loadingOverlay = $('loadingOverlay');
var centerIcon = $('centerIcon');
var centerIconSvg = $('centerIconSvg');

var ICON_V_PLAY = '<path d="M7 6.5v11a1.5 1.5 0 0 0 2.3 1.3l8.5-5.5a1.5 1.5 0 0 0 0-2.6L9.3 5.2A1.5 1.5 0 0 0 7 6.5z"/>';
var ICON_V_PAUSE = '<rect x="7" y="5" width="3.6" height="14" rx="1.5"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.5"/>';
var ICON_V_VOL_ON = '<path d="M4 9.5v5h3l4 3.5v-12L7 9.5H4z" fill="currentColor" stroke="none"/><path d="M14.5 9a4 4 0 0 1 0 6"/>';
var ICON_V_VOL_MUTE = '<path d="M4 9.5v5h3l4 3.5v-12L7 9.5H4z" fill="currentColor" stroke="none"/><path d="M15 9.5l5 5M20 9.5l-5 5"/>';
var ICON_V_FS = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';
var ICON_V_FS_EXIT = '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>';

async function playMV(item) {
  videoMask.classList.add('on');
  loadingOverlay.classList.add('show');
  $('uiVideoTitle').textContent = item.name;
  
  mvVideo.pause();
  mvVideo.removeAttribute('src');
  mvVideo.load();
  videoProgressFill.style.width = '0%';
  videoProgressDot.style.left = '0%';
  videoCurTime.textContent = '0:00';

  try {
    const res = await API.fetch(`${API_BASE}/mv/url?id=${item.nid}&r=1080`);
    const data = await res.json();
    if (!data.data || !data.data.url) throw new Error('接口未返回有效视频地址');

    mvVideo.src = data.data.url.replace(/^http:/, 'https:');
    
    mvVideo.oncanplay = () => {
      loadingOverlay.classList.remove('show');
      mvVideo.play().catch(e => console.log('自动播放被拦截', e));
    };
  } catch (e) {
    loadingOverlay.classList.remove('show');
    toast('获取视频失败：' + e.message);
  }
}

function toggleVidPlay() {
  if (mvVideo.paused) mvVideo.play();
  else mvVideo.pause();
}

mvVideo.addEventListener('play', () => {
  videoPlayToggle.innerHTML = `<svg viewBox="0 0 24 24">${ICON_V_PAUSE}</svg>`;
  centerIconSvg.innerHTML = ICON_V_PAUSE;
  showCenterIcon();
});

mvVideo.addEventListener('pause', () => {
  videoPlayToggle.innerHTML = `<svg viewBox="0 0 24 24">${ICON_V_PLAY}</svg>`;
  centerIconSvg.innerHTML = ICON_V_PLAY;
  showCenterIcon();
  playerUI.classList.remove('hide'); 
});

mvVideo.addEventListener('waiting', () => loadingOverlay.classList.add('show'));
mvVideo.addEventListener('playing', () => loadingOverlay.classList.remove('show'));
mvVideo.addEventListener('error', () => { loadingOverlay.classList.remove('show'); toast('视频加载失败'); });

videoPlayToggle.addEventListener('click', toggleVidPlay);
mvVideo.addEventListener('click', toggleVidPlay);

var centerIconTimer = null;
function showCenterIcon() {
  centerIcon.classList.add('show');
  clearTimeout(centerIconTimer);
  centerIconTimer = setTimeout(() => centerIcon.classList.remove('show'), 600);
}

var isVDragging = false;
var vRafId = null;

function updateVidProgress() {
  if (!isVDragging && mvVideo.duration) {
    const pct = (mvVideo.currentTime / mvVideo.duration) * 100;
    videoProgressFill.style.width = pct + '%';
    videoProgressDot.style.left = pct + '%';
    videoCurTime.textContent = fmt(mvVideo.currentTime);
  }
  vRafId = requestAnimationFrame(updateVidProgress);
}

mvVideo.addEventListener('loadedmetadata', () => {
  videoDurTime.textContent = fmt(mvVideo.duration);
  if (!vRafId) vRafId = requestAnimationFrame(updateVidProgress);
});

mvVideo.addEventListener('ended', () => {
  if (vRafId) { cancelAnimationFrame(vRafId); vRafId = null; }
  playerUI.classList.remove('hide');
});

function calcVPct(clientX) {
  const rect = videoProgress.getBoundingClientRect();
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
}

videoProgress.addEventListener('pointerdown', e => {
  if (!mvVideo.duration) return;
  isVDragging = true;
  videoProgress.setPointerCapture(e.pointerId);
  const pct = calcVPct(e.clientX);
  videoProgressFill.style.width = (pct * 100) + '%';
  videoProgressDot.style.left = (pct * 100) + '%';
  videoCurTime.textContent = fmt(pct * mvVideo.duration);
});

videoProgress.addEventListener('pointermove', e => {
  if (!isVDragging) return;
  const pct = calcVPct(e.clientX);
  videoProgressFill.style.width = (pct * 100) + '%';
  videoProgressDot.style.left = (pct * 100) + '%';
  videoCurTime.textContent = fmt(pct * mvVideo.duration);
});

videoProgress.addEventListener('pointerup', e => {
  if (!isVDragging) return;
  isVDragging = false;
  try { videoProgress.releasePointerCapture(e.pointerId); } catch(err) {}
  const pct = calcVPct(e.clientX);
  if (mvVideo.duration) mvVideo.currentTime = pct * mvVideo.duration;
});

videoProgress.addEventListener('pointercancel', e => {
  if (!isVDragging) return;
  isVDragging = false;
  try { videoProgress.releasePointerCapture(e.pointerId); } catch(err) {}
  const pct = calcVPct(e.clientX);
  if (mvVideo.duration) mvVideo.currentTime = pct * mvVideo.duration;
});

function syncVidVolIcon() { videoVolIcon.innerHTML = (mvVideo.muted || mvVideo.volume === 0) ? ICON_V_VOL_MUTE : ICON_V_VOL_ON; }
videoVolSlider.addEventListener('input', () => { mvVideo.volume = videoVolSlider.value / 100; mvVideo.muted = false; syncVidVolIcon(); });
$('videoMuteBtn').addEventListener('click', () => { mvVideo.muted = !mvVideo.muted; syncVidVolIcon(); });

$('videoFsBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) $('playerWrapper').requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
});

document.addEventListener('fullscreenchange', () => {
  videoFsIcon.innerHTML = document.fullscreenElement ? ICON_V_FS_EXIT : ICON_V_FS;
});

var hideVidUiTimer = null;
function resetVidHideTimer() {
  playerUI.classList.remove('hide');
  clearTimeout(hideVidUiTimer);
  if (!mvVideo.paused) {
    hideVidUiTimer = setTimeout(() => playerUI.classList.add('hide'), 3000);
  }
}
$('playerWrapper').addEventListener('mousemove', resetVidHideTimer);
$('playerWrapper').addEventListener('mouseleave', () => { clearTimeout(hideVidUiTimer); if (!mvVideo.paused) playerUI.classList.add('hide'); });
$('playerWrapper').addEventListener('mouseenter', resetVidHideTimer);

function closeVideoModal() {
  videoMask.classList.remove('on');
  mvVideo.pause();
  mvVideo.removeAttribute('src');
  mvVideo.load();
  clearTimeout(hideVidUiTimer);
  if (vRafId) { cancelAnimationFrame(vRafId); vRafId = null; }
}

$('closeVideo').addEventListener('click', closeVideoModal);
videoMask.addEventListener('click', e => { if (e.target === videoMask) closeVideoModal(); });

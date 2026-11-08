/* ============================================================
   视图切换 / 底部导航
   ============================================================ */

function setView(name) {
  if (name === 'player' || name === 'detail' || name === 'artist') {
    if (libView.classList.contains('on')) prevView = 'lib';
    else if (detailView.classList.contains('on')) prevView = 'detail';
    else if (artistView.classList.contains('on')) prevView = 'artist';
  }

  libView.classList.toggle('on', name === 'lib');
  detailView.classList.toggle('on', name === 'detail');
  artistView.classList.toggle('on', name === 'artist');
  playerView.classList.toggle('on', name === 'player');
  
  if (name === 'player') {
    mini.classList.remove('show');
    requestAnimationFrame(()=>{ if(lyricIdx>=0) scrollToLine(lyricIdx, currentGlobalOffset); else centerFirst(currentGlobalOffset); });
  } else {
    if (cur >= 0) mini.classList.add('show');
    if (bgMode === 'cover' || bgMode === 'fluid') {
      if (name === 'lib') {
        const s = (cur >= 0 && songs[cur]) ? songs[cur] : null;
        updateGlobalBg(s ? s.cover : null);
      } else if (name === 'detail') {
        updateGlobalBg(currentDetailCover);
      } else if (name === 'artist') {
        const cov = $('aCover') ? $('aCover').src : '';
        updateGlobalBg(cov || ((cur >= 0 && songs[cur]) ? songs[cur].cover : null));
      }
    }
  }
}

var navTabs = document.querySelectorAll('.nav-tab');
var tabSlider = $('tabSlider');
var navIndicator = $('navIndicator');

function switchTab(index) {
  currentTabIndex = index;
  navTabs.forEach((t, i) => t.classList.toggle('active', i === index));
  tabSlider.style.transform = `translateX(-${index * 25}%)`;
  const activeTab = navTabs[index];
  if (activeTab) {
    navIndicator.style.width = activeTab.offsetWidth + 'px';
    navIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
  }
}

navTabs.forEach((tab, i) => tab.addEventListener('click', () => switchTab(i)));
$('openSettingsPlayer').addEventListener('click', () => { setView('lib'); switchTab(2); });
window.addEventListener('resize', () => switchTab(currentTabIndex));
